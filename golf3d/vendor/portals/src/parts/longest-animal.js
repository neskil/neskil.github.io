// THE LONGEST ANIMAL: hero set piece "the siphonophore coiled like a spiral galaxy" (all procedural; kit/core only).
//
// WHAT     One siphonophore, 120-200 m of animal coiled flat like a face-on spiral galaxy. From 100 m: one luminous
//          arm, a brighter inner ring (the portal sits in its eye), a soft halo and a dust of lit plankton, with a
//          thin ember fringe under the arm. Close: a rope of glass. A head of 64 swimming bells (22 cm, pumping in
//          a wave, small young bells and a pearly float at the tip), then a beaded milky stem carrying ~1,700 glass
//          thimbles in two staggered ranks (outer wall + darker inner cavity, four canals, keel, lit lip, a
//          blue-white light body, a wet glint: the modelled thimble as far as t = 5.3, a simple 5-sided bell beyond),
//          rose-orange feeding polyps under the stem, and from each a 3 m hair-fine tentacle with side branches
//          (tentilla) left and right, each ending in a glass bead with a warm stinging tip; a second rank of tentacles
//          between them thickens the curtain (45% of those carry a lure); every first-rank tentacle is tipped with
//          an ember lure shaped like a tiny copepod.
//          The stem itself conducts the light: a soft glowing cord (the "stem light") runs the whole stem, dim at
//          rest and bright where a band passes.
// SIZE     Built FLAT: disc in the XZ plane, normal +Y, origin at the EYE (centre of the inner ring), head at the
//          rim on +Z. (The brief asks for origin-at-eye instead of base-centre; the world tilts and places it.)
//          Arm: r = 22.5 exp(-0.1345 t), point(t) = (r sin t, ~0, r cos t), t = 0 at the head; it winds counter-
//          clockwise seen from +Y, so a camera following it inward turns LEFT. It closes into a ring of radius 6.5.
//          radius 24 (36 with coil 'tail'), height 24 (the halo; the solid part is +0.4 / -3.3 m), center (0,0,0).
//          The arm wanders (wobble): as built up to t = 4.7 (the stretch a camera rides); beyond it, the far inner
//          turns, in SLOW waves 6-11 m long. (A 2 m ripple there turned the stem 10-16 degrees from one 0.7 m
//          segment to the next and from above the inner ring was drawn in facets.) Arc length is still measured
//          along the older line (makeArm's PO), so info.length and every count along the stem are what they were.
// OPTS     palette   7 hex strings in the brief's order (black, indigo, mauve, glass blue, blue-white, ember, red)
//          cast      'blue' (Praya blue, default 50%) | 'ghost' (colourless bells, violet rims and halo, twice the
//                    lures, 25%) | 'gold' (champagne gold-white from an explicit warm white, a faint indigo-violet
//                    haze instead of an amber halo (kept at 50% edge-on near the lens, with a pool of it and
//                    brighter light bodies round the head), near bells held to 72% with a darker cavity, tufted 22-bead
//                    curtains; its far arm is a line of CREAM light: cream carriers 1.7 times as bright as the
//                    other casts', more beyond 40-110 m, bands 1.6x, a cream cord; 25%); seeded if omitted
//          coil      'open' (1.47 turns, 60%) | 'tight' (2 turns, 40%) | 'tail' (only on request: 45 m more stem
//                    trailing off the rim before t = 0 and sagging 6 m BELOW the disc, the head at its tip; check
//                    the descent line against it). The path-side stretch t = 0..4.1 is identical in all three.
//          rare      true: setProgress(u) plays the startle from u = startleAt (default 0.8) to 1
//          down      Vector3, local-space gravity for the curtains. Default: derived every frame from the object's
//                    world rotation, so the curtains hang truly down however the world tilts the disc.
//          dust      (true) the lit-plankton sprites; dustDensity (1);  wobble (1) organic wander of the far arm
//          farGlow   (0.16) strength of the one wide soft glow that carries the galaxy from far off; farGlowSize (120 m)
// PER SEED cast, coil, far-arm wander, bell size / splay / sweep, grouping rhythm, pulse rate, band spacing (26-34 m)
//          and speed, tentacle lengths, lure counts. ctx.quality.detail thins dust, carriers and halo, never bells.
// MOTION   (all in shaders, driven by update(dt, time, camera)) bands of light 4 m long run head -> core along arc
//          length at ~16 m/s, a weaker band half-way between each two; every bell pulses 20% at ~1.1 Hz with the phase running down the stem; head bells jet
//          in a slower wave; the stem carries contraction waves and a slow heave; the coil breathes 0-2% OUTWARD
//          only (it never moves toward an inboard camera); each tentacle hauls up a third of its length and pays it
//          out, out of step, and sways; lures twitch; polyps nod; dust sinks at 6 cm/s and twinkles.
// PROGRESS hero.setStartle(p)  p 0..1: one eased wave of full brightness runs head -> core during the first fifth
//          (waveAt(s): a sharp front with a 30 m tail; behind it light bodies, cord, carriers, halo and dust swell up
//          to three times), the coil tightens 6%, every curtain snaps up, then all of it relaxes. 0 or 1 = at rest.
//          hero.startle() plays the same over 10 s of update() time. hero.setProgress(u) only acts with opts.rare.
//          hero.setBand(s, amp) places ONE more band of light at arc length s (hero.armS(t) gives s for an arm
//          angle), for a world that wants a band to keep pace with its camera; off (amp 0) until it is called.
//          Nothing else is keyed to arrival: bands and pulses are ambient loops.
// ANCHORS  (local space) normal (0,1,0);  portalSeat { position (0,0,0), normal +Y, radius 5.5, ringRadius 6.5 }:
//          the 11 m portal lies in the plane of the ring, bell tips stay >= 0.5 m outside its rim;
//          armPoint(t), armTangent(t) (toward the core), armInboard(t, inward = 1.8, below = 1.0): the brief's camera
//          line beside the arm (negative values give a point outboard of / above the stem); flyThrough: 11 such
//          points for t = 0.15 .. 3.95 (clearance to the stem is 1.8 m BY DESIGN, bells reach 0.3 m from the stem,
//          curtains hang on the far side of the lens at the low rim and lean up to 0.5 m toward it near t = pi when
//          the disc is tilted 25 degrees; the head, t < 0.41, has no curtain);  liftOff = last of them;
//          dive: (0,66,0) .. (0,0,0) down the axis, > 6 m from everything until the ring;  head / headTip / headEnd;
//          rimHigh = armPoint(pi), the high side when the head is the low point;  viewpoints [{ name, position, target }].
//          Also hero.info { cast, coil, length, bandGap, bandSpeed, ... }, hero.colors (linear), hero.uniforms
//          (uBandPos, uBandGap, uTime: use them to light the world's snow in step with the bands).
// LIGHTING Self-lit: reads no scene lights. Wants black water, bloom (threshold ~0.9, strength ~0.55), exposure 1-1.3.
//          Bell edges sit near 0.8, light bodies 1.5 at rest and ~4 inside a band (bells large on screen take only
//          40% of the band, so a band passing a metre from the lens keeps its tint), lures 2.5. Honours scene fog
//          (Fog and FogExp2): emissive parts fade to the fog, they do not gain its colour.
// DISTANCE Bells never draw under ~2 px (they grow and dim, energy preserved). Beyond 14-48 m soft carrier sprites
//          along the stem and one veil strip under it (24-60 m) take over so the arm is a line of light, not a dotted
//          one; both (and far bells) dim to 3-15% where the disc is seen edge-on (emitters stack up along the line of sight), so the
//          far arm keeps its tint; halo sprites (soft profile, no edge) all fade out together 18 to 5 m from the lens,
//          so none is left standing alone as a ball and there is no overdraw on the arm pass. The stem light is never
//          under ~3 px wide and fades out 30 to 60 m from the lens (the carriers take over); the far glow is one
//          sprite at the eye that fades IN from 40 to 90 m and collapses to nothing nearer, so it costs no fill close up.
//          Tentacle side branches and beads are drawn in the ribbon's fragment shader; beyond a few metres the ribbon
//          is one even thread, as before.
// COST     ~157k triangles (open, tight; a little more with 'tail'), 12 draw calls (13 for gold), 7 programs, no textures, no
//          lights, ~100-150 ms build in yielded steps. Nothing to dispose beyond what hangs off `object`.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#010208', '#141B4D', '#4A3F8C', '#3F8CFF', '#CFEAFF', '#FF7A2A', '#B8203A'];
const R_RIM = 22.5, R_RING = 6.5, PITCH = 0.1345, HEAD_LEN = 9.0, PORTAL_R = 5.5, TAIL_T = -1.7;

// ------------------------------------------------------------------------------------------------ shared GLSL
// Every part carries its arc length s (metres from the head). bandAt(s) is the travelling light, coilWarp() the
// motion of the whole body (breathing radius, startle tightening, longitudinal contraction waves, slow heave).
const COMMON = /* glsl */`
uniform float uTime, uBandPos, uBandGap, uWaveS, uWaveAmp, uBreath, uPxScale, uOwnS, uOwnAmp;
uniform vec3 uDown;
// the rare startle: one eased front running head -> core, a sharp leading edge and a 30 m tail behind it
float waveAt(float s) {
  float w = s - uWaveS;
  return uWaveAmp * exp(-w * w / (w > 0.0 ? 14.0 : 900.0));
}
// the travelling light: a bright band every uBandGap metres and a weaker one (half as bright) half-way between,
// plus the one band a world may place itself (setBand: arc length uOwnS, strength uOwnAmp, half as long again)
float bandW(float s, float w2) {
  float x = (s - uBandPos) / uBandGap;
  float d = (fract(x) - 0.5) * uBandGap, dh = (fract(x + 0.5) - 0.5) * uBandGap, o = s - uOwnS;
  float b = exp(-d * d / w2) + 0.5 * exp(-dh * dh / w2) + uOwnAmp * exp(-o * o / (w2 * 2.4));
  return min(b + waveAt(s), 1.25);
}
float bandAt(float s) { return bandW(s, 2.6); }
vec3 coilWarp(vec3 p, float s) {
  vec2 rd = p.xz / max(length(p.xz), 1e-3);
  vec2 tg = vec2(rd.y, -rd.x);
  float lon = 0.085 * sin(s * 0.8 - uTime * 1.4) + 0.04 * sin(s * 2.1 + uTime * 0.9);
  float bob = 0.09 * sin(s * 0.23 - uTime * 0.45) + 0.04 * sin(s * 0.71 + uTime * 0.8);
  p.xz = p.xz * uBreath + tg * lon;
  p.y += bob;
  return p;
}
`;
const FOG_PARS = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
#endif
float fogAmount(float depth) {
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1.0 - exp(-fogDensity * fogDensity * depth * depth);
    #else
      return smoothstep(fogNear, fogFar, depth);
    #endif
  #else
    return 0.0;
  #endif
}
`;
// one tentacle: hangs from `root` along uDown, hauls a third of its length up and pays it out, sways from the root
const TENTACLE = /* glsl */`
uniform float uHaul;
vec3 tentaclePos(vec3 root, float v, float len, float seed, float s, out float L) {
  float ph = seed * 6.2832;
  float haul = 1.0 - 0.33 * (0.5 + 0.5 * sin(uTime * (0.32 + 0.3 * fract(seed * 7.31)) + ph));
  haul = mix(haul, 0.28, uHaul);
  L = len * haul;
  vec2 rd = root.xz / max(length(root.xz), 1e-3);
  vec3 tg = vec3(rd.y, 0.0, -rd.x), ro = vec3(rd.x, 0.0, rd.y);
  vec3 off = tg * (0.22 * sin(uTime * 0.6 + s * 0.35 - v * 2.2) + 0.07 * sin(uTime * 1.3 + ph - v * 5.0))
           + ro * (0.16 * sin(uTime * 0.47 + s * 0.5 + ph * 0.3 - v * 1.7));
  vec3 lean = tg * sin(ph * 3.0) + ro * cos(ph * 5.0);
  return root + uDown * (L * v) + off * (v * v * L * 0.5) + lean * (0.045 * L * v * (0.4 + 0.6 * v));
}
`;

// ---- bells: instanced glass thimbles (outer wall + inner cavity in one mesh), one premultiplied pass, no depth write
const BELL_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iQuat; attribute vec4 iData;   // iData: s, length (m), seed, pulse depth
attribute float aPart;                                            // 0 outer wall, 1 inner cavity
uniform float uPulseHz, uPulseK, uBandNear, uNearGain, uNearWide;
varying vec3 vLocal, vN, vView, vL; varying float vPart, vGlow, vEnergy, vSeed, vPulse, vFogDepth, vNear;
${COMMON}
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
void main() {
  float s = iData.x;
  float th = uTime * 6.2832 * uPulseHz - s * uPulseK + iData.z * 0.9;
  float pulse = 0.5 + 0.5 * sin(th); pulse = pulse * pulse * pulse;
  vec3 lp = position;
  lp.xz *= 1.0 - iData.w * pulse * smoothstep(0.08, 1.0, lp.y);
  lp.y *= 1.0 + 0.12 * iData.w * pulse;
  vec3 c = coilWarp(iPos, s);
  vec4 mc = modelViewMatrix * vec4(c, 1.0);
  float dist = max(length(mc.xyz), 0.05);
  float px = iData.y * uPxScale / dist;                 // bell length in pixels
  float grow = max(1.0, 2.2 / max(px, 1e-3));           // never smaller than ~2 px: no sub-pixel sparkle
  vEnergy = mix(0.45, 1.0, smoothstep(1.5, 8.0, px)) / (grow * grow);
  // far bells seen edge-on stack up along the line of sight: dim them there so the far arm keeps its tint
  vec3 nView = normalMatrix * vec3(0.0, 1.0, 0.0);
  float face = abs(dot(mc.xyz / dist, nView / max(length(nView), 1e-4)));
  vEnergy *= mix(min(1.0, 0.08 + 1.5 * face + 4.0 * face * face), 1.0, smoothstep(6.0, 22.0, px));
  vec3 wp = c + qrot(iQuat, lp * iData.y * grow);
  vec4 mv = modelViewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mv;
  vN = normalMatrix * qrot(iQuat, normal);
  vL = normalMatrix * (qrot(iQuat, vec3(0.9, -0.3, 0.0)) - uDown * 0.6);     // toward the neighbours' light bodies
  vView = mv.xyz; vFogDepth = -mv.z;
  vLocal = vec3(position.x * 2.5, position.y, position.z * 2.5);
  vPart = aPart; vSeed = iData.z; vPulse = pulse;
  vNear = smoothstep(9.0, 28.0, px);                    // large on screen: the wall clears and the cavity, canals and lip carry it
  // a band on bells a metre from the lens keeps its tint (no white-out). Per cast: uBandNear is how much of the band a
  // large bell gives up (0.6; gold 0.9), uNearGain what is left of a large bell's own light (1; gold 0.72: champagne is
  // three times as luminous as the same amount of blue), uNearWide 1 starts both from 4 px instead of 9 (gold)
  float nearB = mix(vNear, smoothstep(4.0, 13.0, px), uNearWide);
  vGlow = (1.0 + 1.7 * bandAt(s) * (1.0 - uBandNear * nearB)) * mix(1.0, uNearGain, nearB);
}`;
const BELL_FRAG = /* glsl */`
uniform vec3 uBell, uRim, uCore, uCav;
uniform float uGain, uCavNear;
varying vec3 vLocal, vN, vView, vL; varying float vPart, vGlow, vEnergy, vSeed, vPulse, vFogDepth, vNear;
${FOG_PARS}
${COMMON}
void main() {
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 V = -vView / max(length(vView), 1e-4);
  float ndv = abs(dot(N, V));
  float fres = pow(max(1.0 - ndv, 0.0), 2.4);
  float fwl = fwidth(vLocal.x) + fwidth(vLocal.z) + fwidth(vLocal.y) + 1e-5;
  vec3 col; float a;
  float rho = length(vLocal.xz) / 2.5;                 // radius in bell lengths
  float f3 = fres * sqrt(max(1.0 - ndv, 0.0));         // a tighter edge term
  if (vPart < 0.5) {
    // thick glass wall: clear face-on, a line of light where the view grazes it
    float mouth = smoothstep(0.9, 0.95, vLocal.y);
    float onVelum = mouth * (1.0 - smoothstep(0.298, 0.31, rho));
    float lip = onVelum * smoothstep(0.262, 0.274, rho);                 // a round lit lip drawn on the mouth membrane
    float wall = mix(0.022 + 0.8 * f3, 0.009 + 0.1 * f3 + 0.62 * f3 * f3, vNear) * (1.0 - onVelum) * (1.0 - 0.6 * smoothstep(0.9, 1.0, vLocal.y));
    // four radial canals from apex to rim
    float cd = min(abs(vLocal.x), abs(vLocal.z));
    float canal = (1.0 - smoothstep(0.026, 0.026 + fwl, cd)) * smoothstep(0.02, 0.2, vLocal.y) * (1.0 - onVelum);
    // the light body: a blue-white organ in the wall on the keeled back
    vec3 q = vLocal - vec3(0.86, 0.36, 0.0);
    float lb = exp(-dot(q, q * vec3(9.0, 22.0, 12.0)));
    float speck = 0.75 + 0.25 * sin(vSeed * 40.0 + uTime * (1.0 + fract(vSeed * 3.7)));
    vec3 H = V + vL / max(length(vL), 1e-4);
    float sp = abs(dot(N, H / max(length(H), 1e-4)));
    float glint = pow(sp, 110.0) * (1.0 - onVelum);      // the wet-glass highlight
    vec3 wcol = mix(uBell * 0.85, mix(uBell, uRim, 0.4), smoothstep(0.25, 1.0, vLocal.y));   // deeper at the apex, paler at the mouth
    col = wcol * wall + uRim * (canal * mix(0.3, 0.6, vNear) + lip * (mix(0.55, 0.95, vNear) + 0.5 * vPulse) + glint * 0.65) + uCore * lb * 1.5 * speck;
    a = clamp(0.02 + mix(0.22, 0.14, vNear) * f3 * (1.0 - onVelum) + mix(0.12, 0.2, vNear) * canal + 0.3 * lip + 0.6 * lb + 0.4 * glint + 0.03 * onVelum, 0.0, 0.85);
  } else {
    // inner cavity: darker water held inside the bell, its own wall catching a thinner edge of light
    col = uCav * (0.2 + 0.5 * fres) + uBell * (0.3 * f3);
    a = mix(0.34, uCavNear, vNear) + 0.22 * fres;       // uCavNear 0.15; gold holds its cavity darker so it reads against champagne
  }
  col *= vGlow * uGain * vEnergy;
  a *= mix(vEnergy, 1.0, 0.0);
  float ff = fogAmount(vFogDepth);
  #ifdef USE_FOG
    col = col * (1.0 - ff) + fogColor * ff * a;
  #endif
  gl_FragColor = vec4(col, a);
}`;

// ---- body: the milky stem, the feeding polyps under it and the float at the tip of the head (opaque)
const BODY_VERT = /* glsl */`
attribute vec3 aRel; attribute float aS; attribute float aKind;   // kind 0 stem, 1 polyp, 2 float
uniform mat3 uHang;
varying vec3 vColor, vN, vView, vNl; varying float vGlow, vKind, vFogDepth;
${COMMON}
void main() {
  float k = step(0.5, aKind) * (1.0 - step(1.5, aKind));
  vec3 rel = aRel, n = normal;
  if (k > 0.5) {
    // polyps hang with gravity and nod as the stem works
    float sw = 0.25 * sin(uTime * 1.7 + aS * 3.1) * clamp(-aRel.y * 14.0, 0.0, 1.0);
    rel.xz += rel.y * sw * vec2(0.6, 0.8);
    rel = uHang * rel; n = uHang * n;
  }
  vec3 wp = coilWarp(position, aS) + rel;
  vec4 mv = modelViewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mv;
  vN = normalMatrix * n; vNl = n; vView = mv.xyz; vFogDepth = -mv.z;
  vColor = color; vKind = aKind;
  vGlow = bandAt(aS);
}`;
const BODY_FRAG = /* glsl */`
uniform vec3 uLight;
varying vec3 vColor, vN, vView, vNl; varying float vGlow, vKind, vFogDepth;
${FOG_PARS}
${COMMON}
void main() {
  vec3 N = vN / max(length(vN), 1e-4);
  vec3 V = -vView / max(length(vView), 1e-4);
  float fres = pow(max(1.0 - abs(dot(N, V)), 0.0), 2.0);
  // lit only by the bells that sit above it: brighter on the side turned to them, never by a lamp
  float up = 0.5 - 0.5 * dot(vNl / max(length(vNl), 1e-4), uDown);
  float lit = vKind < 0.5 ? 0.14 + 0.3 * up + 0.95 * fres : 0.2 + 0.5 * up + 1.0 * fres;
  vec3 col = vColor * lit * (0.75 + 1.5 * vGlow) + uLight * fres * (0.12 + 0.4 * vGlow);
  if (vKind > 1.5) col = vColor * (0.9 + 1.2 * fres);
  float ff = fogAmount(vFogDepth);
  #ifdef USE_FOG
    col = mix(col, fogColor, ff);
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- tentacles: camera-facing ribbons; the hair line, its side branches (tentilla) and the bead at the end of each
// branch are drawn in the fragment shader. Far away the ribbon is one even thread, as before.
const TENT_VERT = /* glsl */`
attribute vec3 iRoot; attribute vec4 iData;     // s, length, seed, bead count
uniform float uBeadR, uTentW;
varying float vX, vV, vL, vThread, vGlow, vPx, vEnergy, vSeed, vNb, vFogDepth;
${COMMON}
${TENTACLE}
void main() {
  float s = iData.x, L, L2;
  vec3 root = coilWarp(iRoot, s) + uDown * 0.075;
  vec3 p = tentaclePos(root, position.y, iData.y, iData.z, s, L);
  vec3 p2 = tentaclePos(root, position.y + 0.03, iData.y, iData.z, s, L2);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 tv = (modelViewMatrix * vec4(p2 - p, 0.0)).xyz;
  vec3 c = cross(tv, mv.xyz);
  vec3 side = c / max(length(c), 1e-6);
  float dist = max(length(mv.xyz), 0.05);
  float trueHw = uBeadR * 1.7;
  float thread = max(trueHw, 0.9 * dist / uPxScale);      // the far thread: never under ~1.8 px
  float hw = max(uTentW, thread);                         // near: room for the side branches
  mv.xyz += side * (position.x * hw);
  gl_Position = projectionMatrix * mv;
  vX = position.x * hw; vV = position.y; vL = L; vThread = thread; vSeed = iData.z; vNb = iData.w;
  vPx = uBeadR * uPxScale / dist;
  vEnergy = trueHw / thread;
  vGlow = bandAt(s);
  vFogDepth = -mv.z;
}`;
const TENT_FRAG = /* glsl */`
uniform vec3 uBead, uLine, uTip;
uniform float uBeadR, uTentW;
varying float vX, vV, vL, vThread, vGlow, vPx, vEnergy, vSeed, vNb, vFogDepth;
${FOG_PARS}
void main() {
  float yM = vV * vL;
  float cell = vL / vNb;
  float idx = floor(vV * vNb);
  float dy = (fract(vV * vNb) - 0.5) * cell;
  float h = fract(sin(idx * 12.9898 + vSeed * 78.233) * 43758.5453);
  float on = step(0.5, idx);
  float br = uBeadR * (0.7 + 0.6 * h) * on;
  float aaX = fwidth(vX) + 1e-6;
  // the side branch: leaves the thread above the bead and hangs out and down to it, left and right in turn
  float sg = mod(idx, 2.0) * 2.0 - 1.0;
  vec2 B = vec2(sg * uTentW * (0.38 + 0.3 * h), 0.12 * cell);
  vec2 A = vec2(0.0, -0.34 * cell);
  vec2 q = vec2(vX, dy);
  vec2 ba = B - A;
  float t = clamp(dot(q - A, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0);
  float dseg = length(q - A - ba * t);
  float branch = (1.0 - smoothstep(0.0008, 0.0008 + aaX, dseg)) * on;
  vec2 e = (q - B) * vec2(1.0, 0.72);                     // the bead is a little longer than wide
  float d = length(e) / max(br, 1e-4);
  float aa = aaX / max(br, 1e-4);
  float bead = (1.0 - smoothstep(1.0 - aa, 1.0 + aa, d)) * step(1e-4, br);
  float z = sqrt(max(1.0 - d * d, 0.0));
  float shade = 0.22 + 0.95 * pow(max(1.0 - z, 0.0), 1.4) + 0.5 * pow(z, 10.0);
  float line = max(1.0 - smoothstep(0.0011, 0.0011 + aaX, abs(vX)), branch * 0.8);
  // a warm stinging tip under every bead (the brief's rose-orange, in miniature)
  vec2 tq = q - B - vec2(0.0, br * 1.25);
  float tip = exp(-dot(tq, tq) / max(br * br * 0.16, 1e-8)) * step(1e-4, br);
  vec3 col = uBead * shade * bead + uLine * line * (1.0 - bead) + uTip * tip * (1.0 - bead);
  float a = max(max(bead * 0.75, line * 0.5), tip * 0.5);
  // far away the beads merge into an even thread
  float detail = smoothstep(0.5, 1.5, vPx);
  float fa = 0.42 * (1.0 - smoothstep(0.25, 1.0, abs(vX) / max(vThread, 1e-5)));
  col = mix(uBead * 0.4 * fa, col, detail); a = mix(fa, a, detail);
  float fall = 0.2 + 1.0 / (1.0 + yM * yM * 0.8);      // lit by the bells above, dimmer down the curtain
  col *= fall * (0.8 + 1.7 * vGlow) * vEnergy; a *= vEnergy;
  float ff = fogAmount(vFogDepth);
  #ifdef USE_FOG
    col = col * (1.0 - ff) + fogColor * ff * a;
  #endif
  gl_FragColor = vec4(col, a);
}`;

// ---- lures: ember sprites shaped like a tiny red copepod, twitching at the tentacle tips
const LURE_VERT = /* glsl */`
attribute vec3 iRoot; attribute vec4 iData;     // s, length, seed, position along the tentacle (0..1)
varying vec2 vP; varying float vI, vDetail, vFogDepth;
${COMMON}
${TENTACLE}
void main() {
  float s = iData.x, L, seed = iData.z;
  vec3 root = coilWarp(iRoot, s) + uDown * 0.075;
  vec3 c = tentaclePos(root, iData.w, iData.y, seed, s, L);
  float tw = uTime * 2.1 + seed * 17.0;
  float k = floor(tw / 3.14159);
  float jerk = pow(abs(sin(tw)), 10.0);
  c += vec3(sin(k * 2.4 + seed * 9.0), cos(k * 3.7 + seed * 5.0), sin(k * 5.1 + seed * 3.0)) * (0.04 * jerk);
  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  float dist = max(length(mv.xyz), 0.05);
  float hs = max(0.07, 2.0 * dist / uPxScale);
  float roll = 0.6 * sin(uTime * 0.9 + seed * 30.0) + 2.5 * jerk * sin(k * 7.0);
  float cr = cos(roll), sr = sin(roll);
  mv.xy += position.xy * hs;
  gl_Position = projectionMatrix * mv;
  vec2 q = position.xy * hs;
  vP = vec2(cr * q.x - sr * q.y, sr * q.x + cr * q.y);
  vDetail = smoothstep(2.0, 6.0, 0.02 * uPxScale / dist);       // body size in pixels
  float e = 0.07 / hs;
  vI = e * e * (0.8 + 0.2 * sin(uTime * 3.0 + seed * 50.0)) * (1.0 + 0.5 * bandAt(s));
  vFogDepth = -mv.z;
}`;
const LURE_FRAG = /* glsl */`
uniform vec3 uEmber, uEmberHot;
varying vec2 vP; varying float vI, vDetail, vFogDepth;
${FOG_PARS}
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-8), 0.0, 1.0); return length(pa - ba * h); }
void main() {
  vec2 p = vP;
  float r = length(p);
  float body = exp(-(p.x * p.x * 2.6 + p.y * p.y) / 0.00022);
  float tail = exp(-(p.x * p.x * 9.0 + (p.y + 0.02) * (p.y + 0.02)) / 0.00016) * 0.5;
  float da = min(seg(p, vec2(0.0, 0.012), vec2(0.028, 0.02)), seg(p, vec2(0.0, 0.012), vec2(-0.028, 0.02)));
  float ant = exp(-da * da / 0.000009) * 0.45;
  float halo = exp(-r / 0.02) * 0.2 * (1.0 - smoothstep(0.045, 0.07, r));
  float soft = exp(-r * r / 0.0007);
  float shape = mix(soft, body + tail + ant, vDetail);
  vec3 col = uEmberHot * (2.5 * shape) + uEmber * halo;
  col *= vI * (1.0 - fogAmount(vFogDepth));
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- glow sprites: the distance carriers along the stem and the big soft halo (additive, collapse when faded)
const GLOW_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iData;      // s, diameter, seed, gain
uniform float uFadeA, uFadeB, uFadeSize, uBase, uBandGain, uBandWidth, uDrift, uTwinkle, uMinE, uFar, uEdge, uEdgeMin, uFarBase, uWaveK;
varying vec2 vUv; varying float vI, vFogDepth;
${COMMON}
void main() {
  vec3 c = coilWarp(iPos, iData.x);
  float ph = fract(uTime * uDrift * 0.25 + iData.z);       // dust sinks 4 m, fading in and out, and starts again
  float live = step(1e-5, uDrift);
  c += uDown * ((ph - 0.5) * 4.0 * live);
  vec4 mv = modelViewMatrix * vec4(c, 1.0);
  float dist = max(length(mv.xyz), 0.05);
  float k = uFadeA + uFadeSize * iData.y;
  float fade = smoothstep(k, k + uFadeB + uFadeSize * iData.y * 1.4, dist);
  float hs = max(iData.y * 0.5, 1.5 * dist / uPxScale);
  float e = iData.y * 0.5 / hs;
  hs *= 1.0 + uFar * smoothstep(40.0, 110.0, dist);
  mv.xy += position.xy * hs * step(0.002, fade);
  gl_Position = projectionMatrix * mv;
  vUv = position.xy;
  // seen edge-on the far arm stacks dozens of sprites on one line of sight: keep the tint, not a white wedge
  vec3 nView = (modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
  float face = abs(dot(mv.xyz / dist, nView / max(length(nView), 1e-4)));
  float bandCap = mix(1.0, 0.2 + 0.8 * smoothstep(0.1, 0.35, face), uEdge);
  vI = fade * max(e * e, uMinE) * iData.w * (uBase * (1.0 + uFarBase * smoothstep(40.0, 110.0, dist)) + uBandGain * bandCap * bandW(iData.x, uBandWidth)) * (1.0 - uTwinkle + uTwinkle * sin(uTime * (0.7 + 2.0 * uTwinkle * fract(iData.z * 9.0)) + iData.z * 40.0)) * mix(1.0, sin(3.14159 * ph), live);
  // (uEdgeMin: what is left edge-on within ~25 m of the lens: 0.03 keeps the far arm's tint; gold's haze holds 0.5 there,
  // so the water behind the rope glows on the close passes, where the lens flies in the disc's own plane)
  vI *= mix(1.0, min(1.0, mix(0.03, uEdgeMin, 1.0 - smoothstep(16.0, 34.0, dist)) + 0.9 * face + 3.2 * face * face), uEdge);
  vI *= 1.0 + uWaveK * waveAt(iData.x);                  // the startle: carriers and halo swell behind the front
  vFogDepth = -mv.z;
}`;
const GLOW_FRAG = /* glsl */`
uniform vec3 uCol, uTail;
uniform float uSoft, uSharp;
varying vec2 vUv; varying float vI, vFogDepth;
${FOG_PARS}
void main() {
  float r2 = dot(vUv, vUv);
  float hard = max(exp(-r2 * 3.6) - 0.027, 0.0) * (1.0 - smoothstep(0.75, 1.0, r2));
  float w = max(1.0 - r2, 0.0);
  float soft = exp(-r2 * uSharp) * w * w;                // the halo: no shoulder and no edge, so sprites merge into one haze
  float g = mix(hard, soft, uSoft);
  vec3 c = mix(uTail, uCol, smoothstep(0.0, 0.35, g));   // the dim skirt may be paler than the core (gold: amber, not maroon)
  gl_FragColor = vec4(c * (g * vI * (1.0 - fogAmount(vFogDepth))), 1.0);
}`;

// ---- veil: one strip under the whole arm that stands in for the bead curtain beyond ~40 m
const VEIL_VERT = /* glsl */`
attribute float aS; attribute float aV;
varying float vS, vV, vI, vFogDepth;
${COMMON}
uniform float uHaul;
void main() {
  vec3 p = coilWarp(position, aS);
  float L = 2.75 * (0.84 + 0.08 * sin(uTime * 0.4 + aS * 0.6)) * mix(1.0, 0.3, uHaul);
  p += uDown * (aV * L);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float dist = length(mv.xyz);
  vS = aS; vV = aV; vFogDepth = -mv.z;
  vec3 nView = (modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz;
  float face = abs(dot(mv.xyz / max(dist, 1e-3), nView / max(length(nView), 1e-4)));
  vI = smoothstep(24.0, 60.0, dist) * (0.8 + 1.6 * bandAt(aS)) * min(1.0, 0.03 + 0.9 * face + 3.2 * face * face);
}`;
const VEIL_FRAG = /* glsl */`
uniform vec3 uBead, uEmber;
varying float vS, vV, vI, vFogDepth;
${FOG_PARS}
void main() {
  float streak = 0.6 + 0.4 * sin(vS * 23.0 + 2.0 * sin(vS * 5.3));
  float fall = 0.08 + 0.55 * pow(max(1.0 - vV, 0.0), 1.6);
  float edge = smoothstep(0.0, 0.05, vV) * (1.0 - smoothstep(0.9, 1.0, vV));
  float fringe = smoothstep(0.7, 0.9, vV) * (1.0 - smoothstep(0.9, 1.0, vV));
  float dots = 0.5 + 0.5 * sin(vS * 31.0 + 3.0 * sin(vS * 3.1)); dots = 0.25 + 0.75 * dots * dots;
  vec3 col = uBead * (0.2 * streak * fall * edge) + uEmber * (0.7 * fringe * dots);
  gl_FragColor = vec4(col * vI * (1.0 - fogAmount(vFogDepth)), 1.0);
}`;

// ---- stem light: the cord itself conducts the light. One camera-facing ribbon along the whole stem, soft across,
// dim at rest and bright inside a band, so a band passing the lens is a slug of light running down a glowing cord
// (never under ~3 px; it hands over to the carriers with distance)
const CORD_VERT = /* glsl */`
attribute vec3 aDir; attribute float aS; attribute float aSide;
uniform float uW, uBase, uBand, uWaveK;
uniform vec2 uFade;
varying float vX, vI, vFogDepth;
${COMMON}
void main() {
  vec3 p = coilWarp(position, aS);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec3 tv = (modelViewMatrix * vec4(aDir, 0.0)).xyz;
  vec3 c = cross(tv, mv.xyz);
  vec3 side = c / max(length(c), 1e-6);
  float dist = max(length(mv.xyz), 0.05);
  float hw = max(uW, 1.5 * dist / uPxScale);
  mv.xyz += side * (aSide * hw);
  gl_Position = projectionMatrix * mv;
  vX = aSide;
  vI = (uW / hw) * (1.0 - smoothstep(uFade.x, uFade.y, dist)) * (uBase + uBand * bandW(aS, 3.4)) * (1.0 + uWaveK * waveAt(aS));
  vFogDepth = -mv.z;
}`;
const CORD_FRAG = /* glsl */`
uniform vec3 uCol;
varying float vX, vI, vFogDepth;
${FOG_PARS}
void main() {
  float g = max(1.0 - vX * vX, 0.0);
  gl_FragColor = vec4(uCol * (g * g * vI * (1.0 - fogAmount(vFogDepth))), 1.0);
}`;

// ------------------------------------------------------------------------------------------------ the arm
// One log spiral in the XZ plane, r = 22.5 exp(-0.1345 t), head at t = 0 on +Z, winding counter-clockwise seen
// from +Y (a camera following it inward turns left), closing into a ring of radius 6.5 around the origin.
// The path-side stretch t = 0 .. 4.1 is identical for every coil variant.
function makeArm(coil, noise, wob) {
  const T1 = coil === 'tight' ? Math.PI * 4 : 9.23;
  const tA = coil === 'tail' ? TAIL_T : 0, tB = T1 + Math.PI * 2 - 0.06;
  const N = 3000, dt = (tB - tA) / N;
  const w2 = (t) => smoothstep(4.1, 4.9, t), env = (t) => 1 - smoothstep(T1 - 0.45, T1 + 0.45, t);
  let A = 0, Bq = 0;
  for (let i = 0; i < 4000; i++) { const t = (i + 0.5) * (tB / 4000); A += PITCH * (1 - w2(t)) * env(t) * (tB / 4000); Bq += w2(t) * env(t) * (tB / 4000); }
  const b2 = (Math.log(R_RIM / R_RING) - A) / Bq;
  const bOf = (t) => (t < 0 ? PITCH + 0.2 * smoothstep(0, TAIL_T, t) : (PITCH * (1 - w2(t)) + b2 * w2(t)) * env(t));
  const i0 = Math.round(-tA / dt);
  const lnr = new Float64Array(N + 1);
  lnr[i0] = Math.log(R_RIM);
  for (let i = i0 + 1; i <= N; i++) lnr[i] = lnr[i - 1] - bOf(tA + (i - 0.5) * dt) * dt;
  for (let i = i0 - 1; i >= 0; i--) lnr[i] = lnr[i + 1] + bOf(tA + (i + 0.5) * dt) * dt;
  const P = new Float32Array((N + 1) * 3), S = new Float32Array(N + 1), PO = new Float32Array((N + 1) * 3);
  for (let i = 0; i <= N; i++) {
    const t = tA + i * dt;
    const far = smoothstep(4.2, 5.3, t), ring = smoothstep(T1 - 0.6, T1, t), tail = smoothstep(0, TAIL_T, t);
    const amp = lerp(0.05, 0.34, far) * (1 - 0.62 * ring) + 0.5 * tail;
    const ampY = lerp(0.04, 0.42, far) * (1 - 0.7 * ring) + 0.4 * tail;
    // The far arm wanders in long slow curves: one octave, a bend every third of a turn. (It took three octaves of
    // noise at its full amplitude, which bent the arm every few metres: from 40 m the far turns read as straight
    // segments with corners.) Up to t = 4.7 (the stretch the lens flies beside, and the roll-over) the arm is exactly
    // as it was; the slow wander takes over between there and t = 5.3, and only the small fine wander is kept.
    const slow = smoothstep(4.7, 5.3, t), amp0 = 0.05 * (1 - 0.62 * ring), ampY0 = 0.04 * (1 - 0.7 * ring);
    const r = Math.exp(lnr[i]) + wob * (lerp(amp, amp0, slow) * noise.fbm2(t * 1.15 + 11.3, 3.7, 3) + (amp - amp0) * slow * 1.8 * noise.n2(t * 0.55 + 11.3, 3.7));
    const y = wob * (lerp(ampY, ampY0, slow) * noise.fbm2(t * 0.9 - 4.1, 17.9, 3) + (ampY - ampY0) * slow * 1.8 * noise.n2(t * 0.45 - 4.1, 17.9)) - 6.0 * tail * tail;
    P[i * 3] = r * Math.sin(t); P[i * 3 + 1] = y; P[i * 3 + 2] = r * Math.cos(t);
    // s, every part's coordinate along the stem, is still measured along the arm AS IT WAS (PO: the old wander), so
    // the length, the ring's start and with them every count and random draw of the build are what they were; on
    // the far turns it differs from the true arc length by a fraction of a percent
    const rO = Math.exp(lnr[i]) + amp * wob * noise.fbm2(t * 1.15 + 11.3, 3.7, 3), yO = ampY * wob * noise.fbm2(t * 0.9 - 4.1, 17.9, 3) - 6.0 * tail * tail;
    PO[i * 3] = rO * Math.sin(t); PO[i * 3 + 1] = yO; PO[i * 3 + 2] = rO * Math.cos(t);
    if (i > 0) S[i] = S[i - 1] + Math.hypot(PO[i * 3] - PO[i * 3 - 3], PO[i * 3 + 1] - PO[i * 3 - 2], PO[i * 3 + 2] - PO[i * 3 - 1]);
  }
  const length = S[N];
  const atIndex = (f, out) => {
    const i = clamp(Math.floor(f), 0, N - 1), k = clamp(f - i, 0, 1), a = i * 3;
    return out.set(lerp(P[a], P[a + 3], k), lerp(P[a + 1], P[a + 4], k), lerp(P[a + 2], P[a + 5], k));
  };
  const indexOfS = (s) => {
    let lo = 0, hi = N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    return lo + clamp((s - S[lo]) / Math.max(S[hi] - S[lo], 1e-6), 0, 1);
  };
  const arm = {
    length, tA, tB, T1, b2, coil,
    pointAtS(s, out = new THREE.Vector3()) { return atIndex(indexOfS(clamp(s, 0, length)), out); },
    pointAtT(t, out = new THREE.Vector3()) { return atIndex((clamp(t, tA, tB) - tA) / dt, out); },
    sOfT(t) { const f = (clamp(t, tA, tB) - tA) / dt, i = Math.min(Math.floor(f), N - 1); return lerp(S[i], S[i + 1], f - i); },
    tOfS(s) { return tA + indexOfS(clamp(s, 0, length)) * dt; },
    // frame at s: T toward the core, U up, B outward (away from the eye)
    frame(s, fr) {
      const a = arm.pointAtS(s - 0.06, _a), b = arm.pointAtS(s + 0.06, _b);
      fr.T.subVectors(b, a).normalize();
      fr.B.crossVectors(fr.T, _up).normalize();
      fr.U.crossVectors(fr.B, fr.T).normalize();
      arm.pointAtS(s, fr.P);
      return fr;
    },
  };
  return arm;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
const makeFrame = () => ({ P: new THREE.Vector3(), T: new THREE.Vector3(), U: new THREE.Vector3(), B: new THREE.Vector3() });

// ------------------------------------------------------------------------------------------------ geometry
// A bell is a lathe along +Y, apex at y = 0 (on the stem), mouth at y = 1; unit length, radius ~0.4.
// outer / inner: profiles [[y, r], ...] below the apex point; the inner one is the cavity (aPart = 1).
function bellGeometry(radial, outer, innerRadial, inner, innerApexY, shape) {
  const pos = [], part = [], idx = [];
  const lathe = (seg, prof, apexY, isInner) => {
    const base = pos.length / 3;
    pos.push(0, apexY, 0); part.push(isInner);
    for (let j = 0; j < prof.length; j++) for (let i = 0; i < seg; i++) {
      const th = (i / seg) * Math.PI * 2, y = prof[j][0];
      const r = prof[j][1] * (isInner ? 1 : shape(th, y));
      pos.push(Math.cos(th) * r, y, Math.sin(th) * r); part.push(isInner);
    }
    for (let i = 0; i < seg; i++) idx.push(base, base + 1 + ((i + 1) % seg), base + 1 + i);
    for (let j = 0; j < prof.length - 1; j++) for (let i = 0; i < seg; i++) {
      const a = base + 1 + j * seg + i, b = base + 1 + j * seg + ((i + 1) % seg), c = a + seg, d = b + seg;
      idx.push(a, b, c, b, d, c);
    }
  };
  if (inner) lathe(innerRadial, inner, innerApexY, 1);   // cavity first, so the wall draws over it
  lathe(radial, outer, 0, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const keel = (k, lobes) => (th, y) => (1 + k * Math.pow(Math.max(0, Math.cos(th)), 6) * (1 - 0.55 * y)) * (1 + lobes * Math.cos(2 * th));

function instanced(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k].array, attrs[k].size));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  return g;
}
function quadGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
function stripGeometry(segs) {
  const pos = [], idx = [];
  for (let j = 0; j <= segs; j++) { const v = Math.pow(j / segs, 0.85); pos.push(-1, v, 0, 1, v, 0); }
  for (let j = 0; j < segs; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

// colony casts: [wall, rim, core, cavity, bead, glow, halo] as mixes of the brief's palette
function castColours(cast, pal) {
  const C = (i) => new THREE.Color(pal[i] || DEFAULT_PALETTE[i]);
  const black = C(0), indigo = C(1), mauve = C(2), blue = C(3), white = C(4), ember = C(5), red = C(6);
  const mix = (a, b, k) => a.clone().lerp(b, k);
  if (cast === 'ghost') {
    const grey = mix(white, mauve, 0.25);
    return { wall: mix(grey, indigo, 0.1).multiplyScalar(0.55), rim: mix(mauve, white, 0.2).multiplyScalar(2.0), core: mix(white, mauve, 0.25),
      cav: mix(black, mauve, 0.35), bead: mix(white, mauve, 0.3), glow: mix(white, mauve, 0.5).multiplyScalar(0.62), halo: mix(mauve, red, 0.12).multiplyScalar(1.5),
      stem: mix(white, mauve, 0.3), polyp: mix(mix(ember, red, 0.5), white, 0.15), ember, red, black, gain: 1.0, haloGain: 0.9, lures: 2 };
  }
  if (cast === 'gold') {
    // an explicit champagne white (linear): lerping blue-white toward ember passes through pink, so it is not mixed
    const gold = new THREE.Color(1.0, 0.8, 0.48), amber = new THREE.Color(1.0, 0.62, 0.2), cream = new THREE.Color(1.0, 0.9, 0.7);
    return { wall: gold.clone().multiplyScalar(0.62), rim: mix(gold, amber, 0.3).multiplyScalar(1.0), core: cream.clone(),
      cav: new THREE.Color(0.05, 0.035, 0.02), bead: mix(cream, gold, 0.4), glow: gold.clone().multiplyScalar(0.92),
      // THE GOLD HALO IS THE WATER'S COLOUR, NOT THE ANIMAL'S: dim orange on black goes brown through the tone map and
      // reads as a tan dome with a rim, however it is tinted. So the wide haze is a faint indigo-violet (as ghost's is
      // mauve), dimmed where the disc is seen edge-on (haloEdge), and the warmth is carried by what reads as light:
      // the bells, the carriers, the dust and the world's snow lit warm-white within a few metres of the rope.
      // (an explicit violet-indigo: the palette's mauve and indigo alone carry four times as much blue as red and read royal blue)
      halo: new THREE.Color(0.08, 0.036, 0.18), haloEdge: 1,
      // champagne is about three times as luminous as the same amount of glass blue, so large (near) bells give up
      // most of the band and 28% of their own light (more and dim gold goes khaki), and hold a darker cavity
      bandNear: 0.9, nearGain: 0.72, nearWide: 1, cavNear: 0.28,
      // the far arm must read as LIGHT (not a matte bone ribbon beside the blue-white core): its carriers are cream, twice
      // 1.7 times as bright as the other casts' at any distance (carrierBase), up to 2.6 times that beyond 40-110 m
      // (farBase) and 1.6 times in a band (bandX), so the line blooms softly and a band shows on it; being that bright
      // already, its glow sprites swell only a fifth as much in the startle (waveK): more and the wave is a grey fog
      carrier: cream.clone().multiplyScalar(1.15), carrierBase: 1.7, farBase: 1.6, bandX: 1.6, cord: cream.clone(), cordGain: 0.7, waveK: 0.2,
      // THE CLOSE PASSES: the head's bells sit in a pool of light. Their light bodies are 2.1 times as bright (headCore:
      // cream-white, enough to bloom), the haze keeps 50% edge-on near the lens (haloEdgeMin) at 1.5 of the others'
      // strength (its indigo is a third as luminous as ghost's mauve), the lit plankton round the rope is three times
      // as bright (dustGain), and three wide, very soft sprites of the haze's own indigo-violet lie along the head
      // (pool) so the water behind the bells is not flat black
      headCore: 2.1, haloEdgeMin: 0.5, dustGain: 3.0, pool: 0.11,
      stem: mix(cream, gold, 0.3), polyp: mix(mix(ember, red, 0.3), cream, 0.15), ember, red, black, gain: 0.85, haloGain: 1.5, lures: 1 };
  }
  return { wall: blue.clone(), rim: mix(blue, white, 0.45), core: white.clone(), cav: mix(black, indigo, 0.7), bead: mix(white, blue, 0.3),
    glow: mix(blue, white, 0.12), halo: mix(blue, mauve, 0.3), stem: mix(white, blue, 0.3), polyp: mix(mix(ember, red, 0.25), white, 0.22), ember, red, black, gain: 1.0, haloGain: 1, lures: 1 };
}

// ------------------------------------------------------------------------------------------------ buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const detail = clamp(ctx.quality?.detail ?? 1, 0.4, 1);
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const castRoll = rng(), coilRoll = rng();
  const cast = opts.cast || (castRoll < 0.5 ? 'blue' : castRoll < 0.75 ? 'ghost' : 'gold');
  const coil = opts.coil || (coilRoll < 0.6 ? 'open' : 'tight');
  const col = castColours(cast, pal);
  await ctx.yield?.();
  const arm = makeArm(coil, noise, opts.wobble ?? 1);
  await ctx.yield?.();
  const LEN = arm.length;
  const fr = makeFrame();
  const sN0 = arm.sOfT(Math.max(arm.tA, -0.1)), sN1 = arm.sOfT(4.35), sRing = arm.sOfT(arm.T1);
  const sFine = arm.sOfT(5.3);       // the modelled thimble (wall + cavity) is used this far: the lens looks back across the rope at t 4.2-5
  const isNear = (s) => s >= sN0 && s <= sN1;
  // per-seed character
  const pulseHz = 1.1 * rng.range(0.9, 1.1), bandGap = rng.range(26, 34), bandSpeed = 16 * rng.range(0.92, 1.08);
  const bellScale = rng.range(0.94, 1.1), rollMid = rng.range(0.95, 1.2), sweep = rng.range(0.35, 0.6);
  const tentScale = rng.range(0.9, 1.1), groupLen = rng.range(0.9, 1.5), beads = cast === 'gold' ? 22 : 14;
  const object = new THREE.Group();
  object.name = 'longest-animal';

  // ---------------------------------------------------------------- bells
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), dir = new THREE.Vector3(), ax = new THREE.Vector3(), xa = new THREE.Vector3(), za = new THREE.Vector3();
  const lists = { near: { p: [], q: [], d: [] }, far: { p: [], q: [], d: [] }, head: { p: [], q: [], d: [] } };
  const pushBell = (L, s, side, len, roll, sw, depth, stand) => {
    arm.frame(s, fr);
    dir.copy(fr.U).multiplyScalar(Math.cos(roll)).addScaledVector(fr.B, side * Math.sin(roll));
    ax.copy(dir).addScaledVector(fr.T, sw).normalize();
    xa.copy(fr.T).multiplyScalar(-1).addScaledVector(ax, fr.T.dot(ax)).normalize();   // keel and light body face the head
    za.crossVectors(xa, ax);
    q.setFromRotationMatrix(m4.makeBasis(xa, ax, za));
    L.p.push(fr.P.x + dir.x * stand, fr.P.y + dir.y * stand, fr.P.z + dir.z * stand);
    L.q.push(q.x, q.y, q.z, q.w);
    L.d.push(s, len, rng(), depth);
  };
  // the head: a double row of 64 swimming bells over the first 9 m, small young bells at the tip
  for (let i = 0; i < 64; i++) {
    const pair = i >> 1, side = i & 1 ? -1 : 1;
    const s = 0.36 + pair * ((HEAD_LEN - 0.5) / 32) + (side < 0 ? 0.135 : 0);
    const grown = 0.5 + 0.5 * smoothstep(0.0, 2.6, s);
    pushBell(lists.head, s, side, 0.22 * bellScale * grown * rng.range(0.94, 1.08), 1.35 + rng.range(-0.1, 0.1), 0.7 + rng.range(-0.08, 0.08), 0.3, 0.035);
  }
  await ctx.yield?.();
  // the stem: two staggered ranks of glass thimbles, gathered in soft groups so the rope has a rhythm
  let nStem = 0;
  const isTail = coil === 'tail', nearStep = isTail ? 0.19 : 0.16;
  const farStep = Math.max(0.2, (LEN - HEAD_LEN - (sN1 - Math.max(sN0, HEAD_LEN))) * 2 / (isTail ? 760 : 860));
  for (let s = HEAD_LEN + 0.15; s < LEN - 0.05;) {
    const nearZone = isNear(s), step = nearZone ? nearStep : farStep;
    for (let k = 0; k < 2; k++) {
      const ss = s + k * step * 0.5 + rng.range(-0.02, 0.02), side = k ? -1 : 1;
      const group = 0.88 + 0.2 * (0.5 + 0.5 * Math.sin((ss / groupLen) * Math.PI * 2));
      const len = (nearZone ? rng.range(0.11, 0.172) : rng.range(0.135, 0.19) * (farStep / 0.2)) * bellScale * group;
      pushBell(nearZone || (s > sN1 && s <= sFine) ? lists.near : lists.far, Math.min(ss, LEN), side, len, rollMid + rng.range(-0.28, 0.24), sweep + rng.range(-0.12, 0.12), 0.2, 0.028);
      nStem++;
    }
    s += step;
    if ((nStem & 127) === 0) await ctx.yield?.();
  }
  await ctx.yield?.();
  const nearGeo = bellGeometry(12, [[0.1, 0.23], [0.5, 0.4], [1.0, 0.33], [0.965, 0.2]], 4, [[0.5, 0.2], [0.93, 0.25]], 0.3, keel(0.2, 0.0));
  const farGeo = bellGeometry(5, [[0.1, 0.24], [0.6, 0.4], [1.0, 0.31]], 0, null, 0, keel(0.15, 0.0));
  const headGeo = bellGeometry(12, [[0.05, 0.15], [0.2, 0.32], [0.5, 0.41], [0.8, 0.4], [1.0, 0.3], [0.955, 0.17]], 8, [[0.42, 0.21], [0.7, 0.29], [0.93, 0.235]], 0.24, keel(0.2, 0.1));
  const F32 = (a) => new Float32Array(a);
  const bellAttrs = (L) => ({ iPos: { array: F32(L.p), size: 3 }, iQuat: { array: F32(L.q), size: 4 }, iData: { array: F32(L.d), size: 4 } });

  // ---------------------------------------------------------------- shared uniforms and materials
  const shared = {
    uTime: { value: 0 }, uBandPos: { value: 0 }, uBandGap: { value: bandGap }, uWaveS: { value: -500 }, uWaveAmp: { value: 0 },
    uBreath: { value: 1.01 }, uPxScale: { value: 480 }, uDown: { value: new THREE.Vector3(0, -1, 0) }, uHaul: { value: 0 },
    uOwnS: { value: -500 }, uOwnAmp: { value: 0 },
  };
  const mk = (vs, fs, own, extra) => new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared, own), vertexShader: vs, fragmentShader: fs, fog: true, ...extra,
  });
  const glass = { transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide };
  const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const bellUniforms = (hz, k, gain) => ({ uBell: { value: col.wall }, uRim: { value: col.rim }, uCore: { value: col.core }, uCav: { value: col.cav },
    uGain: { value: gain }, uPulseHz: { value: hz }, uPulseK: { value: k },
    uBandNear: { value: col.bandNear ?? 0.6 }, uNearGain: { value: col.nearGain ?? 1 }, uNearWide: { value: col.nearWide ?? 0 }, uCavNear: { value: col.cavNear ?? 0.15 } });
  const bellMat = mk(BELL_VERT, BELL_FRAG, bellUniforms(pulseHz, 1.6, col.gain), glass);
  const headMat = mk(BELL_VERT, BELL_FRAG, bellUniforms(pulseHz * 0.75, 1.15, col.gain * 1.1), glass);
  if (col.headCore) headMat.uniforms.uCore = { value: col.core.clone().multiplyScalar(col.headCore) };
  const add = (geo, mat, order, name) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; m.name = name; object.add(m); return m; };
  add(instanced(farGeo, lists.far.d.length / 4, bellAttrs(lists.far)), bellMat, 4, 'bells-far');
  add(instanced(nearGeo, lists.near.d.length / 4, bellAttrs(lists.near)), bellMat, 5, 'bells-near');
  add(instanced(headGeo, 64, bellAttrs(lists.head)), headMat, 6, 'bells-head');
  await ctx.yield?.();

  // ---------------------------------------------------------------- body: stem, polyps, float
  const bp = [], brel = [], bn = [], bc = [], bs = [], bk = [], bi = [];
  const vert = (p, rel, n, c, s, kind) => { bp.push(p.x, p.y, p.z); brel.push(rel.x, rel.y, rel.z); bn.push(n.x, n.y, n.z); bc.push(c.r, c.g, c.b); bs.push(s); bk.push(kind); return bp.length / 3 - 1; };
  const zero = new THREE.Vector3(), nrm = new THREE.Vector3(), pt = new THREE.Vector3(), cc = new THREE.Color();
  const SIDES = 5;
  let prevRing = -1, ringNo = 0;
  for (let s = 0; s <= LEN + 1e-3;) {
    const sc = Math.min(s, LEN);
    arm.frame(sc, fr);
    const headK = 1 - smoothstep(HEAD_LEN - 1.5, HEAD_LEN + 0.5, sc);
    const rad = (0.0165 + 0.012 * headK) * (ringNo & 1 ? 1.5 : 0.72) * (0.4 + 0.6 * smoothstep(0, 0.4, sc)) * (0.35 + 0.65 * smoothstep(0, 0.6, LEN - sc));
    const start = bp.length / 3;
    for (let i = 0; i < SIDES; i++) {
      const a = (i / SIDES) * Math.PI * 2 + ringNo * 0.31;
      nrm.copy(fr.U).multiplyScalar(Math.cos(a)).addScaledVector(fr.B, Math.sin(a));
      pt.copy(fr.P).addScaledVector(nrm, rad);
      cc.copy(col.stem).multiplyScalar(0.2 + 0.14 * (ringNo & 1));
      vert(pt, zero, nrm, cc, sc, 0);
    }
    if (prevRing >= 0) for (let i = 0; i < SIDES; i++) { const a = prevRing + i, b = prevRing + ((i + 1) % SIDES), c = start + i, d = start + ((i + 1) % SIDES); bi.push(a, c, b, b, c, d); }
    prevRing = start; ringNo++;
    if (s >= LEN) break;
    s += isNear(s) ? 0.15 : 0.36;
    if ((ringNo & 255) === 0) await ctx.yield?.();
  }
  await ctx.yield?.();
  // feeding polyps: little rose-orange flasks every 25 cm, each the root of one tentacle
  const tent = { r: [], d: [] }, lure = { r: [], d: [] };
  const polypProf = [[-0.016, 0.014], [-0.047, 0.0165], [-0.078, 0.0075]];
  const rel = new THREE.Vector3(), tip = col.polyp.clone().lerp(col.core, 0.3);
  const flask = (s, scl, bright, hue, seg, lean) => {
    arm.frame(s, fr);
    const yaw = rng.range(0, 6.28);
    pt.copy(fr.P).addScaledVector(fr.U, -0.012);
    const c0 = col.polyp.clone().lerp(col.red, hue);
    cc.copy(c0).multiplyScalar(bright * 0.7);
    const apex = vert(pt, zero, nrm.set(0, 1, 0), cc, s, 1);
    for (let j = 0; j < polypProf.length; j++) for (let i = 0; i < seg; i++) {
      const a = yaw + (i / seg) * Math.PI * 2, r = polypProf[j][1] * scl * (j === 1 ? 1 + 0.25 * Math.sin(a * 2 + yaw) : 1), y = polypProf[j][0] * scl;
      rel.set(Math.cos(a) * r + lean * y * Math.cos(yaw), y, Math.sin(a) * r + lean * y * Math.sin(yaw));
      nrm.set(Math.cos(a), j === 2 ? -0.7 : 0.15 - j * 0.2, Math.sin(a)).normalize();
      cc.copy(c0).lerp(tip, j / 2).multiplyScalar(bright * (0.8 + 0.3 * j));
      vert(pt, rel, nrm, cc, s, 1);
    }
    for (let i = 0; i < seg; i++) bi.push(apex, apex + 1 + i, apex + 1 + ((i + 1) % seg));
    for (let j = 0; j < 2; j++) for (let i = 0; i < seg; i++) { const a = apex + 1 + j * seg + i, b = apex + 1 + j * seg + ((i + 1) % seg); bi.push(a, a + seg, b, b, a + seg, b + seg); }
  };
  for (let s = HEAD_LEN + 0.3, nPol = 0; s < LEN - 0.1;) {
    if ((++nPol % 120) === 0) await ctx.yield?.();
    flask(s, rng.range(0.65, 1.25), rng.range(0.4, 0.7), rng.range(0, 0.3), 4, rng.range(-0.3, 0.3));
    if (isNear(s) && rng.chance(isTail ? 0.3 : 0.62)) flask(s + rng.range(0.04, 0.2), rng.range(0.4, 0.75), rng.range(0.3, 0.55), rng.range(0.1, 0.6), 3, rng.range(-0.5, 0.5));
    arm.frame(s, fr); pt.copy(fr.P).addScaledVector(fr.U, -0.012);
    // its tentacle and lures
    const onRing = s > sRing, seed = rng();
    const tl = (onRing ? 2.1 : 3.0) * tentScale * rng.range(0.78, 1.1);
    tent.r.push(pt.x, pt.y, pt.z); tent.d.push(s, tl, seed, beads);
    lure.r.push(pt.x, pt.y, pt.z); lure.d.push(s, tl, seed, 0.985);
    const extra = col.lures > 1 ? 1 + (rng.chance(0.4) ? 1 : 0) : (rng.chance(0.35) ? 1 : 0);
    for (let e = 0; e < extra; e++) { lure.r.push(pt.x, pt.y, pt.z); lure.d.push(s, tl, seed, rng.range(0.45, 0.85)); }
    s += (isNear(s) ? 0.25 : onRing ? 0.34 : 0.5) * rng.range(0.9, 1.1);
  }
  // the float: a small pearly gas-filled bladder at the very tip of the head
  {
    arm.frame(0.02, fr);
    const cF = col.ember.clone().lerp(col.core, 0.35).multiplyScalar(0.9), base = bp.length / 3, R = 8, rings = [-0.8, -0.3, 0.3, 0.8];
    const centre = pt.copy(fr.P).addScaledVector(fr.T, -0.1).clone();
    vert(_c.copy(centre).addScaledVector(fr.T, 0.1), zero, nrm.copy(fr.T), cF, 0, 2);
    for (const a of rings) for (let i = 0; i < R; i++) {
      const th = (i / R) * Math.PI * 2, rr = 0.05 * Math.sqrt(1 - a * a) * (1 + 0.25 * a);
      nrm.copy(fr.U).multiplyScalar(Math.cos(th)).addScaledVector(fr.B, Math.sin(th));
      _c.copy(centre).addScaledVector(fr.T, a * 0.1).addScaledVector(nrm, rr);
      vert(_c, zero, nrm.clone().addScaledVector(fr.T, a).normalize(), cF, 0, 2);
    }
    const end = vert(_c.copy(centre).addScaledVector(fr.T, -0.105), zero, nrm.copy(fr.T).multiplyScalar(-1), cF, 0, 2);
    for (let i = 0; i < R; i++) { bi.push(base, base + 1 + i, base + 1 + ((i + 1) % R)); bi.push(end, base + 1 + 3 * R + ((i + 1) % R), base + 1 + 3 * R + i); }
    for (let j = 0; j < 3; j++) for (let i = 0; i < R; i++) { const a = base + 1 + j * R + i, b = base + 1 + j * R + ((i + 1) % R); bi.push(a, a + R, b, b, a + R, b + R); }
  }
  const bodyGeo = new THREE.BufferGeometry();
  bodyGeo.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3));
  bodyGeo.setAttribute('aRel', new THREE.Float32BufferAttribute(brel, 3));
  bodyGeo.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3));
  bodyGeo.setAttribute('color', new THREE.Float32BufferAttribute(bc, 3));
  bodyGeo.setAttribute('aS', new THREE.Float32BufferAttribute(bs, 1));
  bodyGeo.setAttribute('aKind', new THREE.Float32BufferAttribute(bk, 1));
  bodyGeo.setIndex(bi);
  const hang = new THREE.Matrix3();
  const bodyMat = mk(BODY_VERT, BODY_FRAG, { uHang: { value: hang }, uLight: { value: col.glow } }, { vertexColors: true, side: THREE.DoubleSide });
  add(bodyGeo, bodyMat, 0, 'stem-polyps');
  await ctx.yield?.();

  // ---------------------------------------------------------------- curtain: tentacles and lures
  // a second rank between the first on the stretch the lens rides, so that beside the lens the curtain is a curtain
  // (a thread every 12 cm) and not a row of hairs; drawn from its own random stream, so nothing else moves
  {
    const cr = makeRng(hashSeed((ctx.seed ?? 1) + ':longest-animal:curtain'));
    for (let s = HEAD_LEN + 0.42; s < sN1 + 6; s += 0.25 * cr.range(0.9, 1.1)) {
      arm.frame(s, fr); pt.copy(fr.P).addScaledVector(fr.U, -0.012);
      const seed = cr(), tl = 3.0 * tentScale * cr.range(0.62, 1.0);
      tent.r.push(pt.x, pt.y, pt.z); tent.d.push(s, tl, seed, beads);
      if (cr.chance(0.45)) { lure.r.push(pt.x, pt.y, pt.z); lure.d.push(s, tl, seed, 0.985); }
    }
  }
  await ctx.yield?.();
  const nTent = tent.d.length / 4, nLure = lure.d.length / 4;
  const beadR = cast === 'gold' ? 0.0115 : 0.0095;
  const tentMat = mk(TENT_VERT, TENT_FRAG, { uBead: { value: col.bead }, uLine: { value: col.bead.clone().multiplyScalar(0.55) }, uBeadR: { value: beadR },
    uTentW: { value: cast === 'gold' ? 0.05 : 0.042 }, uTip: { value: col.polyp.clone().lerp(col.ember, 0.5).multiplyScalar(1.1) } }, glass);
  add(instanced(stripGeometry(6), nTent, { iRoot: { array: F32(tent.r), size: 3 }, iData: { array: F32(tent.d), size: 4 } }), tentMat, 7, 'tentacles');
  const emberHot = col.ember.clone().lerp(col.red, 0.12);
  const lureMat = mk(LURE_VERT, LURE_FRAG, { uEmber: { value: col.ember }, uEmberHot: { value: emberHot } }, additive);
  add(instanced(quadGeometry(), nLure, { iRoot: { array: F32(lure.r), size: 3 }, iData: { array: F32(lure.d), size: 4 } }), lureMat, 8, 'lures');

  // ---------------------------------------------------------------- distance carriers, veil and halo
  const glowList = (n, sizeA, sizeB, jitter, lift) => {
    const p = [], d = [];
    for (let i = 0; i < n; i++) {
      const s = clamp(((i + rng()) / n) * LEN, 0, LEN);
      arm.pointAtS(s, pt);
      p.push(pt.x + rng.range(-jitter, jitter), pt.y + lift + rng.range(-jitter, jitter) * 0.6, pt.z + rng.range(-jitter, jitter));
      const ring = smoothstep(sRing - 6, sRing, s);
      d.push(s, rng.range(sizeA, sizeB) * (1 - 0.35 * ring * (sizeB > 4 ? 1 : 0)), rng(), rng.range(0.8, 1.2) * (1 + 0.25 * ring) * (0.72 + 0.5 * (0.5 + 0.5 * noise.n2(s * 0.11, 41.7))));
    }
    return { iPos: { array: F32(p), size: 3 }, iData: { array: F32(d), size: 4 } };
  };
  const nCarrier = Math.round(620 * detail * LEN / 160), nHalo = Math.round(58 * detail * LEN / 160);
  const glowU = (c, a, b, k, base, gain, width, drift, twinkle, minE) => ({ uCol: { value: c }, uFadeA: { value: a }, uFadeB: { value: b }, uFadeSize: { value: k },
    uBase: { value: base }, uBandGain: { value: gain }, uBandWidth: { value: width }, uDrift: { value: drift }, uTwinkle: { value: twinkle }, uMinE: { value: minE }, uFar: { value: 0 }, uEdge: { value: 0 }, uEdgeMin: { value: 0.03 }, uFarBase: { value: 0 },
    uTail: { value: c }, uSoft: { value: 0 }, uSharp: { value: 2.6 }, uWaveK: { value: 0 } });
  // the halo: half as many sprites again at 0.82 of the light each (same total), a soft profile, and one fade for all
  // of them (5-18 m from the lens) so that no single sprite is left standing on its own as a ball
  const haloI = 0.041 * col.haloGain / Math.sqrt(detail);
  const haloMat = mk(GLOW_VERT, GLOW_FRAG, glowU(col.halo, 5, 13, 0, haloI, haloI, 70, 0, 0.08, 0), additive);
  haloMat.uniforms.uSoft.value = 1; haloMat.uniforms.uTail.value = col.tail || col.halo; haloMat.uniforms.uSharp.value = col.haloSharp || 2.6;
  haloMat.uniforms.uEdge.value = col.haloEdge || 0;      // gold: the haze dims where the disc is seen edge-on from afar (no plateau from the arm)
  haloMat.uniforms.uEdgeMin.value = col.haloEdgeMin ?? 0.03;
  const carrierMat = mk(GLOW_VERT, GLOW_FRAG, glowU(col.glow, 14, 34, 0, 0.1 / detail, 0.34 / detail, 3.2, 0, 0.08, 0), additive);
  carrierMat.uniforms.uFar.value = 0.7; carrierMat.uniforms.uEdge.value = 1; carrierMat.uniforms.uFarBase.value = col.farBase ?? 0;   // gold: see castColours
  if (col.carrier) { carrierMat.uniforms.uCol.value = col.carrier; carrierMat.uniforms.uTail.value = col.carrier; carrierMat.uniforms.uBase.value *= col.carrierBase ?? 1; carrierMat.uniforms.uBandGain.value *= (col.bandX ?? 1) * (col.carrierBase ?? 1); }
  carrierMat.uniforms.uWaveK.value = 2.0 * (col.waveK ?? 1); haloMat.uniforms.uWaveK.value = 1.6 * (col.waveK ?? 1);
  glowList(nHalo, 11, 25, 1.6, -0.6);                    // not drawn: kept so that every later random draw stays where it was
  {
    const hr = makeRng(hashSeed((ctx.seed ?? 1) + ':longest-animal:halo')), n = Math.round(nHalo * 1.5), p = [], d = [];
    for (let i = 0; i < n; i++) {
      const s = clamp(((i + hr()) / n) * LEN, 0, LEN), ring = smoothstep(sRing - 6, sRing, s);
      arm.pointAtS(s, pt);
      p.push(pt.x + hr.range(-1.6, 1.6), pt.y - 0.6 + hr.range(-1, 1), pt.z + hr.range(-1.6, 1.6));
      d.push(s, hr.range(13, 24) * (1 - 0.35 * ring), hr(), hr.range(0.85, 1.15) * (1 + 0.25 * ring) * (0.72 + 0.5 * (0.5 + 0.5 * noise.n2(s * 0.11, 41.7))));
    }
    add(instanced(quadGeometry(), n, { iPos: { array: F32(p), size: 3 }, iData: { array: F32(d), size: 4 } }), haloMat, 1, 'halo');
  }
  if (col.pool) {
    // the head's pool of light (gold): three soft sprites 12-15 m wide along the first 12 m of the animal, drawn down to
    // 1 m from the lens (the halo's own sprites are gone within 5 m of it), each well under a tenth of the bells' light
    const p = [], d = [];
    for (const [sp, size, g] of [[1.5, 12, 1], [6.5, 14, 0.9], [12, 15, 0.6]]) { arm.pointAtS(sp, pt); p.push(pt.x, pt.y - 0.5, pt.z); d.push(sp, size, 0.31 + sp * 0.07, g); }
    const poolMat = mk(GLOW_VERT, GLOW_FRAG, glowU(col.halo.clone().multiplyScalar(1.2), 0.8, 3.4, 0, col.pool, col.pool * 0.5, 70, 0, 0.06, 0), additive);   // each fades out 3.4 to 0.8 m from the lens: no pop as it passes
    poolMat.uniforms.uSoft.value = 1; poolMat.uniforms.uSharp.value = 2.2;
    add(instanced(quadGeometry(), 3, { iPos: { array: F32(p), size: 3 }, iData: { array: F32(d), size: 4 } }), poolMat, 1, 'head-pool');
  }
  add(instanced(quadGeometry(), nCarrier, glowList(nCarrier, 0.95, 1.45, 0.05, 0.06)), carrierMat, 3, 'carriers');
  if (opts.dust !== false) {
    // plankton and snow caught in the animal's own light: the stars of the galaxy, and the haze round the rope up close
    const n = Math.round(1500 * detail * (opts.dustDensity ?? 1)), p = [], d = [];
    for (let i = 0; i < n; i++) {
      const s = rng() * LEN;
      arm.pointAtS(s, pt);
      const ox = rng.gauss() * 2.6, oy = rng.gauss() * 1.7 - 0.6, oz = rng.gauss() * 2.6, d2 = ox * ox + oy * oy + oz * oz;
      p.push(pt.x + ox, pt.y + oy, pt.z + oz);
      d.push(s, rng.range(0.03, 0.07), rng(), rng.range(0.35, 1) / (1 + d2 / 9));
    }
    const dustMat = mk(GLOW_VERT, GLOW_FRAG, glowU(col.glow.clone().lerp(col.core, 0.35), 0, 0.001, 0, 0.55 * (col.dustGain ?? 1), 1.5, 26, 0.06, 0.45, 0.5), additive);
    dustMat.uniforms.uWaveK.value = 1.2 * (col.waveK ?? 1);
    add(instanced(quadGeometry(), n, { iPos: { array: F32(p), size: 3 }, iData: { array: F32(d), size: 4 } }), dustMat, 3, 'dust');
  }
  {
    const vp = [], vs = [], vv = [], vi = [];
    let n = 0;
    for (let s = HEAD_LEN; s <= LEN; s += 0.45, n++) {
      arm.pointAtS(s, pt);
      vp.push(pt.x, pt.y - 0.05, pt.z, pt.x, pt.y - 0.05, pt.z); vs.push(s, s); vv.push(0, 1);
      if (n > 0) { const a = (n - 1) * 2; vi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(vs, 1));
    g.setAttribute('aV', new THREE.Float32BufferAttribute(vv, 1));
    g.setIndex(vi);
    add(g, mk(VEIL_VERT, VEIL_FRAG, { uBead: { value: col.bead }, uEmber: { value: col.ember } }, additive), 2, 'veil');
  }
  await ctx.yield?.();
  {
    // the stem light: a ribbon of two vertices every 30 cm along the whole stem (see CORD_VERT)
    const cp = [], cd = [], cs = [], cside = [], ci = [];
    let n = 0;
    for (let s = 0; s <= LEN; s += 0.3, n++) {
      arm.frame(Math.min(s, LEN), fr);
      for (const sd of [-1, 1]) { cp.push(fr.P.x, fr.P.y, fr.P.z); cd.push(fr.T.x, fr.T.y, fr.T.z); cs.push(s); cside.push(sd); }
      if (n > 0) { const a = (n - 1) * 2; ci.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
    g.setAttribute('aDir', new THREE.Float32BufferAttribute(cd, 3));
    g.setAttribute('aS', new THREE.Float32BufferAttribute(cs, 1));
    g.setAttribute('aSide', new THREE.Float32BufferAttribute(cside, 1));
    g.setIndex(ci);
    const cg = col.cordGain ?? 1;
    add(g, mk(CORD_VERT, CORD_FRAG, { uCol: { value: col.cord || col.core.clone().lerp(col.rim, 0.25) }, uW: { value: 0.04 }, uBase: { value: 0.5 * cg }, uBand: { value: 3.4 * cg },
      uWaveK: { value: 1.0 }, uFade: { value: new THREE.Vector2(30, 60) } }, additive), 1, 'stem-light');
    // the far glow: the water round the whole colony takes its light. One wide soft sprite at the eye, seen only from
    // far off (it fades in from 40 to 90 m), so on the descent the galaxy sits in a glow that grows as we fall toward it
    const farMat = mk(GLOW_VERT, GLOW_FRAG, glowU(col.halo, 40, 50, 0, (opts.farGlow ?? 0.16) * col.haloGain, 0, 70, 0, 0.05, 0), additive);
    farMat.uniforms.uSoft.value = 1; farMat.uniforms.uSharp.value = 3.4; farMat.uniforms.uEdge.value = 1; farMat.uniforms.uWaveK.value = 0;
    add(instanced(quadGeometry(), 1, { iPos: { array: F32([0, 0, 0]), size: 3 }, iData: { array: F32([LEN * 0.5, opts.farGlowSize ?? 120, 0.37, 1]), size: 4 } }), farMat, 0, 'far-glow');
  }
  await ctx.yield?.();

  // ---------------------------------------------------------------- anchors (local space)
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const armPoint = (t, out = new THREE.Vector3()) => arm.pointAtT(t, out);
  const armTangent = (t, out = new THREE.Vector3()) => out.subVectors(arm.pointAtT(t + 0.01, _b), arm.pointAtT(t - 0.01, _a)).normalize();
  const armInboard = (t, inward = 1.8, below = 1.0, out = new THREE.Vector3()) => {
    arm.pointAtT(t, out);
    const r = Math.hypot(out.x, out.z) || 1;
    out.x -= (out.x / r) * inward; out.z -= (out.z / r) * inward; out.y -= below;
    return out;
  };
  const flyThrough = [];
  for (let i = 0; i < 11; i++) flyThrough.push(armInboard(0.15 + (i / 10) * 3.8));
  const anchors = {
    normal: V(0, 1, 0),
    portalSeat: { position: V(0, 0, 0), normal: V(0, 1, 0), radius: PORTAL_R, ringRadius: R_RING },
    head: arm.pointAtS(HEAD_LEN * 0.5), headTip: arm.pointAtS(0), headEnd: arm.pointAtS(HEAD_LEN),
    rimHigh: armPoint(Math.PI), liftOff: armInboard(3.95),
    armPoint, armTangent, armInboard,
    flyThrough,
    dive: [V(0, 66, 0), V(0, 48, 0), V(0, 32, 0), V(0, 16, 0), V(0, 0, 0)],
    viewpoints: [
      { name: 'galaxy', position: V(0, 100, 46), target: V(0, 0, 0) },
      { name: 'arm', position: armInboard(2.0), target: armPoint(2.42) },
      { name: 'head', position: armInboard(0.02, 2.4, 0.4), target: arm.pointAtS(HEAD_LEN * 0.55) },
      { name: 'over-the-top', position: V(0, 70, 0), target: V(0, 0, 0) },
    ],
  };

  // ---------------------------------------------------------------- animation
  const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m4 = new THREE.Matrix4(), _size = new THREE.Vector2(), _down = new THREE.Vector3(0, -1, 0);
  let startleP = -1, startleClock = -1, tight = 0;
  const applyStartle = (p) => {
    if (!(p > 0) || p >= 1) { shared.uWaveAmp.value = 0; shared.uHaul.value = 0; tight = 0; return; }
    const run = smoothstep(0, 0.2, p);
    shared.uWaveS.value = lerp(-10, LEN + 30, run);
    shared.uWaveAmp.value = smoothstep(0, 0.02, p) * (1 - smoothstep(0.2, 0.5, p));
    shared.uHaul.value = smoothstep(0.01, 0.1, p) * (1 - smoothstep(0.25, 1, p));
    tight = smoothstep(0, 0.2, p) * (1 - smoothstep(0.2, 1, p));
  };
  const hero = {
    object, radius: coil === 'tail' ? 36 : 24, height: 24, center: V(0, 0, 0), anchors,
    ground: false, groundY: -4,
    info: { cast, coil, length: LEN, turns: arm.T1 / (Math.PI * 2), bells: nStem + 64, tentacles: nTent, lures: nLure, bandGap, bandSpeed, pitch: PITCH, rim: R_RIM },
    colors: { bell: col.wall, glow: col.glow, halo: col.halo, ember: col.ember },
    uniforms: shared,
    // the rare startle: p 0..1 (0 or 1 = at rest). One eased wave of full brightness runs rim to core in the first
    // fifth, the coil tightens 6% and the curtain snaps up; everything relaxes over the rest.
    setStartle(p) { startleP = p; startleClock = -1; },
    startle() { startleClock = 0; },                       // same thing played over 10 s of update() time
    setProgress(u) { if (opts.rare) hero.setStartle((u - (opts.startleAt ?? 0.8)) / (1 - (opts.startleAt ?? 0.8))); },
    setDown(v) { opts.down = v; },                         // local-space gravity; default follows the object's world tilt
    setBand(s, amp) { shared.uOwnS.value = s; shared.uOwnAmp.value = amp; },   // one more band of light, at arc length s (see armS)
    armS(t) { return arm.sOfT(t); },                       // arc length (metres from the head, the hero's own units) at arm angle t
    update(dt, time, camera) {
      shared.uTime.value = time;
      shared.uBandPos.value = (time * bandSpeed) % bandGap;
      if (startleClock >= 0) { startleClock += dt / 10; startleP = startleClock; if (startleClock >= 1) startleClock = -1; }
      applyStartle(startleP);
      shared.uBreath.value = (1.01 + 0.01 * Math.sin(time * 0.33)) * (1 - 0.06 * tight);
      if (camera) {
        let h = 720;
        if (ctx.renderer?.getDrawingBufferSize) h = ctx.renderer.getDrawingBufferSize(_size).y || h;
        shared.uPxScale.value = camera.projectionMatrix.elements[5] * h * 0.5;
      }
      // curtains hang with the world's gravity however the world tilts the disc
      if (opts.down) _down.copy(opts.down).normalize();
      else { object.updateWorldMatrix(true, false); object.getWorldQuaternion(_q).invert(); _down.set(0, -1, 0).applyQuaternion(_q); }
      shared.uDown.value.copy(_down);
      _q2.setFromUnitVectors(_c.set(0, -1, 0), _down);
      hang.setFromMatrix4(_m4.makeRotationFromQuaternion(_q2));
    },
    dispose() {},
  };
  object.userData.hero = hero;
  hero.update(0, 0, null);
  return hero;
}
