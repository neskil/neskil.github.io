// THE LONGEST ANIMAL: a dusk descent out of the last blue light to one siphonophore coiled like a spiral galaxy.
// The route is about 446 m, flown in 52 s; its landmarks (path.marks: tip, ride, rideEnd, lift, fig, join) are
// fractions of it (the numbers below are seed 3's; they move by under 0.005 between seeds):
//   the descent  (to u 0.48) down through shafts of the last light, which melt into even water by u 0.21: the pillar,
//                whose near face is rising lanternfish (dark upright fish with lit bellies, the largest at its edges,
//                stragglers peeling off toward the lens) over its soft core of light, a comb
//                jelly and a school of hatchetfish beside the pillar in the first second, a school of lanternfish
//                crossing the lens (the first few from u 0.005, drawn in tight round it at u 0.08), the flight slowed to
//                70% as the lens tips down onto the galaxy (u 0.10-0.235), comb jellies at arm's length, the descent's own giant
//                (u 0.20-0.27), the galaxy growing below; THE SCHOOL THAT FALLS WITH US, a wheel of hatchetfish the lens
//                keeps beside it (u 0.28-0.42: lower right at 0.34, under the galaxy at 0.37, low left at 0.40) and ITS
//                OUTRIDERS, sixteen large fish wheeling and flashing 2.2-4.5 m off the lens in the right half of the frame
//                (u 0.29-0.41), then three lit helmet jellies
//                upper right and a comb jelly at arm's length low on the right (u 0.43), so no two frames of the descent
//                are the disc alone; the pull-out is laid BACKWARDS from the head (the IN table: heading and pitch of
//                each leg), so the route arrives along the bells without a wiggle
//   the head     (u 0.48-0.53) the lens comes down inboard of the head's tip and slides along the swimming bells
//   the ride     (u 0.53-0.64) BESIDE THE CURTAIN for most of a turn of the arm: 1.25 m from the hanging threads and
//                1.35 m under the stem, so rope, glowing cord and curtain cross the frame from edge to edge and the
//                bands of light overtake the lens
//                THE CHAIN'S COMPANY (head, ride and roll): a dozen helmet jellies and comb jellies hang in a band
//                4.4 to 6.3 m round the stem's own line along its first 90 m, where the water beside the rope was bare
//   the roll     (u 0.64-0.68) it rises past the bells and crosses over the rope, three hand points further and
//                further outboard (ROLL), pitch rising all the way; the flight slows to 64% (PACE) and the gaze leaves
//                the rope for the core in ONE swing (SWING: under 38 degrees a second, 33 for the steady camera)
//   the helix    (u 0.68-0.92) ONE climbing left-hand turn round the galaxy with all of it in frame, low and wide
//                at first. The gaze PANS: the galaxy, still an oblique ellipse, sits in the left third with the scale
//                figure 15 m off on its right and a school of hatchetfish below (u 0.77-0.79); the gaze swings across
//                (u 0.79-0.855: mid-pan, u 0.82, the galaxy is on the centre with a helmet jelly crossing the bottom
//                of the frame 5.5 m off, a school of hatchetfish flashing between lens and disc, lit helmets 17-20 m
//                off either side and a comb jelly up-left) and the galaxy sits in the right third with that helmet
//                jelly and comb jellies at arm's length on the left (u 0.84-0.87); a comb jelly up-left and a school
//                low on the right as the route tips over onto the disc's axis 36 m above the eye (u 0.90). Round the
//                whole turn the water has depth: THE COLONY'S GLOW IN THE WATER, a dim indigo round the galaxy that
//                falls to black water 50-70 degrees from it on every cast, and the DEEP SCATTERING LAYER, a level
//                sheet of dim blue points at the colony's depth that recedes behind the animals; the core stays a
//                clean disc (no helmet stands on it between u 0.74 and 0.89)
//   the dive     (from u 0.92) straight down the axis, two large scarlet helmet jellies low on the left (u 0.945)
// Build-time guards keep the route clear of the stem (1.05 m beside the head, 1.6 m elsewhere) and the helix free of
// any hairpin (heading under 56 degrees a second at the nominal speed, the bank never changing sign).
//
// MAP OF THIS FILE (in order)
//   1. constants: palette, C (disc centre), disc normal, HERO_K (the colony is shown a fifth larger than it is built),
//      STARTLE_AT, depthAt(u) (the 4:1 compressed apparent depth)
//   2. GLSL: ENV (dome colour with the colony's glow in the water, the dome's shafts (waterCol), water fog, key light
//      from above, colony light: shared by every shader here),
//      DOME (the glow overhead and its SHAFTS), MOTE (snow / pillar points / copepods / sparks: one instanced sprite
//      shader with wrap boxes, streaks and the analytic halo of the spiral arm), FISH (lanternfish with seven
//      photophores; #define HATCHET turns it into wheeling silver hatchetfish that swim upright and bank as they wheel:
//      a dark back, a silver flank that mirrors the glow overhead and the colony's, a pale belly, the colony's light
//      through a knee so that none out-shines the lit helmets), GLASS (comb jellies, mucus houses,
//      salps), BODY (MODE 0 oarfish: S-bend, rippling sail, mirror flank lit from below; MODE 1 squid: mottled, rim-lit;
//      MODE 2 helmet jellies: opaque, lit only by the down-light and by the colony's disc: discAtt() falls with height
//      above the disc, so red is scarlet beside the bells and black 25 m up. A lit underside, a dark maroon crown, a
//      skirt that glows through when seen against the light (from above, in the helix, that is all of its light), a
//      bright margin of lappets and a red thread on the limb; beyond 60 m from the lens they shrink away to nothing),
//      EYE (the dim lens of haze laid over the eye while it is seen edge-on: a plug that hides the window and a wisped
//      indigo haze that fades toward the frame's edge), PFISH (the pillar's fish, as upright
//      impostors)
//   3. geometry builders: quad, ellipsoid, fish lofts, the Geo helper, oarfish, giant squid, helmet jelly
//   4. build(ctx):
//        LOOKS      cast, weather, scale figure and coil rolled independently; ctx.vary.hour  -> "const look ="
//                   and ctx.vary.mood (halo depth, pillar offset, glow hue)
//        HERO       buildHero + placement (position C, quaternion from the disc normal, scale) -> "hero placement"
//        PATH       the brief's descent, the pull-out (IN), then points beside the stem:      -> "const routeFor ="
//                   rope() in the hero's frame for the head, hang() in world metres for the
//                   ride, rollPt() for the roll; then THE HELIX, integrated from a turn-rate and pitch schedule and  -> "const HELIX ="
//                   solved so that it lands on the disc's axis; the CLEARANCE GUARD moves
//                   the head pass or the ride until it holds; the TOP GUARD resamples the    -> "const topCheck ="
//                   helix finer if the spline ripples
//        PACE       the flight's speed along the route: 64% through the roll, 80% over the    -> "const paceDip ="
//                   helix's top, 70% into the descent (the engine keeps the flight at 52 s)
//        FIGURE     where the oarfish / squid hangs: inside the helix, 14-15 m off the lens   -> "let figPos ="
//                   at u 0.79 and 24 degrees right of its gaze
//        POIS       gaze: the core on the descent, then ONE sliding point (slideAt): core ->   -> "const slideAt ="
//                   the head's bells -> the rope ahead in its curtain -> the core (SWING: a
//                   table built by chasing the core's bearing in real time at a capped rate
//                   and acceleration) -> the helix's PAN either side of the core (PANS). Points
//                   REPEAT so the steady camera (a third of each weight) is held too;
//                   gazeAt(u, out, calm) reproduces either camera; stage() / stageB() (with
//                   the engine's bank: true screen axes) / pushOff() place animals in a given
//                   frame, clear of the route and the dive line
//        ENV        the shared uniforms; setDepth(u) sets dome, key, shafts, FOG colour and    -> "function setDepth"
//                   density
//        CAST       snow fields, pillar (points, soft core, PFISH impostors), copepods, the deep scattering layer, the
//                   glow in the eye (sprites, the EYE cloud and its flakes),
//                   lanternfish (pillar box, the school round the lens, stragglers), hatchetfish (standing schools,
//                   the one that falls with the lens and its outriders), glass animals, oarfish / pair / squid, the descent's giant,
//                   helmet jellies (then the pass that moves any helmet off the core for the helix: "THE CORE STAYS").
//                   Everything staged since the first hand-in draws from its own stream (px,
//                   ':longest-animal:polish') or is staged last, so the older layout is where it was
//                   THE CHAIN'S COMPANY: helmet and comb jellies round the first 90 m of the stem, by a   -> "const company ="
//                   rule of the place (own stream, 'chain-company:' + seed; its helmets join the list after that pass)
//        POST       exposure 1.25, bloom 0.55 / 0.9, grade                                    -> "post:"
//        update()   scripted moments keyed to u (the descent's in the old route's fractions, uo), loops to time
//
// UNIFORMS THAT DRIVE THE SCRIPTED MOMENTS
//   env.uGlowCol / uGlowK / uMidCol / uKeyCol / uFogD   the surface glow going out with depth (depthAt(uo))
//   dome uRays (raysU), uShaft (shaftU)                 the shafts of the last light: shy in the entry, melted into even
//                                                       water by u 0.21 (uShaft), gone with the glow
//   env.uEntry, pillarCore.uGain                        u 0 (seen through the previous portal) to 0.05: a violet cap
//                                                       reaching down to the level gaze and a 4x pillar core
//   pillar / pillarCore / haze .uGain                   the pillar thins behind the school (u 0.06-0.15) and goes dark
//                                                       behind the lens (u 0.30-0.43)
//   snowA.uGain                                         flakes half as bright from the roll-over (u 0.61) to the dive (u 0.93)
//   env.uDeepCol / uDeepCol2 / uDeepDir                 the colony's glow in the water: up between u 0.68 and 0.76 (it
//                                                       spreads out from the galaxy as it comes), drawn in for the dive
//   pfish.uGain / uRise                                 the pillar's fish: with the pillar, rising at its pace
//   fishC.uVis / uCenter / uBox                         the school of lanternfish round the lens (u 0.004-0.31), tight at
//                                                       first; uVis brings the fish in one by one, each whole: at 60% of
//                                                       its size and in the water's colour, then growing and lit
//   hatchT.uVis / uCenter                               the school that falls with the lens (u 0.27-0.42; travelAt(u))
//   hatchN.uVis / uCenter                               its outriders beside the lens (u 0.283-0.42; outAt(u))
//   deep.uGain                                          the deep scattering layer: up from the lift-off, thinner in the dive
//   eyeU.uEyeGain, eyeFlakes / eyeGlow .uGain (eyeK)    the dim haze over the eye and its lit flakes while the lens is
//                                                       within 8-20 degrees of the disc's plane (the portal there is a
//                                                       flat window: seen edge-on it was a pale plate), gone from above
//   snow.uStreak, snow.uOffset                          streak length and the snow's own rise or fall (u 0.12-0.48)
//   glass: vDisturb (computed from the camera)          comb-jelly canals flare as the lens passes
//   dI (the descent giant's uColonyI)                   its light: up at u 0.09-0.17, out by u 0.37
//   lateU (uLate)                                       the lift-off's ladder of helmet jellies arrives at u 0.47-0.53,
//                                                       behind the lens, so the descent's view of the galaxy stays clear
//   figure.uFlick / uFlickT                             the figure's flick (rare event)
//   env.uColonyI, haloU.uHaloK                          the colony's light on every animal and on the snow (both leap
//                                                       with the startle)
//   hero.setProgress(u)                                 the startle wave itself from u 0.8 (hero part, only with ctx.vary.rare)
//   hero.setBand(s, amp)                                the lens's own band of light, just ahead of it for the ride (u 0.48-0.68)
//
// Kit note: sprites, fish and jellies are this file's own shaders, not kit fauna / fx. The kit lights creatures with
// a sun + sky rig and this world has neither: everything is lit by one glow overhead that dies with depth, then only
// by the animal. The hero is src/parts/longest-animal.js.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/longest-animal.js';

const PALETTE = ['#010208', '#141B4D', '#4A3F8C', '#3F8CFF', '#CFEAFF', '#FF7A2A', '#B8203A'];
const CX = -54, CY = -107, CZ = -62;                  // the disc centre (and the portal)
const NX = -0.37, NY = 0.91, NZ = -0.21;              // the disc normal: tilted 25 degrees to face the descent
const DURATION = 52, SPEED = 10, STARTLE_AT = 0.8;        // the rare startle begins at u 0.8: over the top of the helix, the whole galaxy in frame
const HERO_K = 1.2, BANK = 0.6;                                    // the colony is built 45 m across and shown 54 m across: a fifth larger in every frame

// apparent depth in metres: 120 for the level entry, 300 at 13 s, 620 from 21 s on (the real drop is 116 m)
function depthAt(u) {
  if (u <= 0.135) return 120;
  if (u <= 0.283) return lerp(120, 300, smoothstep(0.135, 0.283, u) * 0.6 + 0.4 * (u - 0.135) / 0.148);
  if (u <= 0.457) return lerp(300, 620, (u - 0.283) / 0.174);
  return 620;
}
const table = (x, pts) => {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return lerp(pts[i - 1][1], pts[i][1], (x - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
  return pts[pts.length - 1][1];
};

// ------------------------------------------------------------------------------------------------ GLSL
const ENV = /* glsl */`
uniform vec3 uGlowCol, uMidCol, uLowCol, uKeyCol, uColonyCol, uColonyPos, uDeepDir, uDeepCol, uDeepCol2;
uniform float uGlowK, uFogD, uColonyI, uColonyR2, uTime, uPxScale, uEntry, uRays, uShaft;
// the water's own colour in direction d (what fog fades to): the glow overhead, and round the helix THE COLONY'S
// GLOW IN THE WATER: a wide, edgeless lobe of dim indigo about the direction of the colony (uDeepDir: lens -> core),
// brightest round the galaxy, under the grade's black point 48-52 degrees from it and gone altogether by 70 (the
// lobe is steep, pow 1.4: at 0.55 it sat just under the black point across the whole frame, and the least light added
// to it, a brighter cast, a blizzard, lifted the far water to an even navy), plus a tighter blue one
vec3 deepGlow(vec3 d) {
  float w = max(0.5 + 0.5 * dot(d, uDeepDir), 1e-4), w3 = w * w * w;
  return uDeepCol * pow(w, 1.4) + uDeepCol2 * (w3 * w3);
}
vec3 domeCol(vec3 d) {
  float up = clamp(d.y, -1.0, 1.0);
  vec3 c = mix(uLowCol, uMidCol, smoothstep(-0.95, 0.45, up));
  float g = exp(-(1.0 - up) / max(uGlowK, 0.004));
  float wide = up * 0.5 + 0.5; wide = wide * wide * wide;
  return c + uGlowCol * (g + 0.22 * wide * wide + uEntry * 0.22 * smoothstep(-0.6, 0.5, up)) + deepGlow(d);
}
float fogF(float dist) { float x = uFogD * dist; return 1.0 - exp(-x * x); }
vec3 colonyLight(vec3 wp, vec3 N, float wrap) {
  vec3 toC = uColonyPos - wp; float d2 = dot(toC, toC);
  vec3 l = toC / sqrt(max(d2, 1e-4));
  float nl = clamp((dot(N, l) + wrap) / (1.0 + wrap), 0.0, 1.0);
  return uColonyCol * (uColonyI * nl / (1.0 + d2 / uColonyR2));
}
vec3 keyLight(vec3 N) { float t = clamp(N.y * 0.75 + 0.25, 0.0, 1.0); return uKeyCol * (t * t) + uMidCol * 0.4; }
vec4 qmul(vec4 a, vec4 b) { return vec4(a.w * b.xyz + b.w * a.xyz + cross(a.xyz, b.xyz), a.w * b.w - dot(a.xyz, b.xyz)); }
vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
float h11(float x) { return fract(sin(x * 127.1) * 43758.5453); }
// The dome itself: domeCol plus the SHAFTS of the last light. Seen from inside the water every shaft is an arc from
// straight overhead to straight below, so they fan out of the top of the level entry and, on the descent, converge
// under the lens beyond the galaxy; under them the water keeps a floor of blue that goes out with the glow (uRays
// scales both). Soft, wide bars (uShaft 1) over a floor of blue with no black gaps; as uShaft goes to 0 the bars melt
// into the floor at the same mean brightness, so the galaxy comes to sit in even dark-blue water.
vec3 waterCol(vec3 d) {
  float az = atan(d.z, abs(d.x) < 1e-5 ? 1e-5 : d.x), pol = sqrt(max(1.0 - d.y * d.y, 0.0));
  float a = 0.5 + 0.5 * sin(az * 9.0 + 1.7 * sin(az * 4.0 + uTime * 0.07) + uTime * 0.05);
  float b = 0.5 + 0.5 * sin(az * 23.0 - 2.3 * sin(az * 5.0 - uTime * 0.09) + 1.3);
  float shafts = (a * a * 0.85 + a * b * 0.15) * smoothstep(0.04, 0.34, pol);
  float body = 0.3 + 0.7 * smoothstep(-1.0, 0.8, d.y);
  return domeCol(d) + uGlowCol * (uRays * body * (0.085 + 0.045 * (1.0 - uShaft) + 0.125 * uShaft * shafts));
}
`;

const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const DOME_FRAG = /* glsl */`
varying vec3 vDir;
${ENV}
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  gl_FragColor = vec4(waterCol(d), 1.0);
}`;

// ---- motes: every small light or flake. Instanced quads; wrap box (follows the camera or stands still), streaks
// along the motion relative to the lens, energy-preserving minimum size, lit by the key, the colony and the arm's halo.
const MOTE_VERT = /* glsl */`
attribute vec3 iBase; attribute vec4 iData;          // iData: size (m), seed, brightness, string (0 round .. 1 long)
uniform vec3 uCenter, uBox, uOffset, uStreak, uColA, uColB, uSelf, uHeroPos, uHaloCol, uTop;
uniform mat3 uHeroInv;
uniform float uWrap, uMinPx, uGain, uLit, uBlink, uDart, uTwinkle, uBandPos, uBandGap, uOwnS, uOwnAmp, uB2, uT1, uHaloR2, uHaloK, uMinE, uBroad, uFar;
uniform vec2 uNear;
varying vec2 vUv; varying vec3 vCol;
${ENV}
float armHalo(vec3 wp, out float band) {
  vec3 lp = uHeroInv * (wp - uHeroPos);
  float r = max(length(lp.xz), 0.05);
  float phi = atan(lp.x, abs(lp.z) < 1e-4 ? 1e-4 : lp.z);
  float lnr = log(22.5 / clamp(r, 6.5, 22.5));
  float tr = lnr <= 0.60525 ? lnr / 0.1345 : 4.5 + (lnr - 0.60525) / max(uB2, 0.01);
  float k = floor((tr - phi) / 6.28318 + 0.5);
  float t0 = phi + 6.28318 * k;
  if (t0 < 0.0) t0 += 6.28318;
  float t = min(t0, uT1);
  float ra = 22.5 * exp(-(0.1345 * min(t, 4.5) + uB2 * max(t - 4.5, 0.0)));
  float dr = r - ra, drr = r - 6.5;
  float d2 = min(dr * dr, drr * drr) + lp.y * lp.y;
  float s = 168.8 * (1.0 - exp(-0.1345 * t));
  float bx = (s - uBandPos) / max(uBandGap, 1.0);
  float d = (fract(bx) - 0.5) * uBandGap, dh = (fract(bx + 0.5) - 0.5) * uBandGap;
  band = exp(-d * d / 40.0) + 0.5 * exp(-dh * dh / 40.0) + uOwnAmp * exp(-(s - uOwnS) * (s - uOwnS) / 60.0);
  return 1.0 / (1.0 + d2 / uHaloR2);
}
void main() {
  float seed = iData.y;
  vec3 p = iBase + uOffset;
  p += vec3(sin(uTime * 0.71 + seed * 40.0), sin(uTime * 0.53 + seed * 71.0), cos(uTime * 0.63 + seed * 53.0)) * (0.2 * uTwinkle);
  float kk = floor(uTime * 1.3 + seed * 10.0), fr = fract(uTime * 1.3 + seed * 10.0);
  vec3 j0 = vec3(h11(kk + seed), h11(kk * 1.7 + seed * 3.0), h11(kk * 2.3 + seed * 5.0)) - 0.5;
  vec3 j1 = vec3(h11(kk + 1.0 + seed), h11((kk + 1.0) * 1.7 + seed * 3.0), h11((kk + 1.0) * 2.3 + seed * 5.0)) - 0.5;
  p += mix(j0, j1, smoothstep(0.0, 0.22, fr)) * uDart;
  float edge = 1.0;
  if (uWrap > 0.5) {
    vec3 q = mod(p - uCenter + uBox * 0.5, uBox);
    vec3 e = min(q, uBox - q) / (uBox * 0.12);
    edge = clamp(min(e.x, min(e.y, e.z)), 0.0, 1.0);
    p = uCenter + q - uBox * 0.5;
  }
  // the pillar's top: the column thins into scattered points and fades with no edge (uTop: from y, to y, amount)
  float tp = smoothstep(uTop.x, uTop.y, p.y) * uTop.z;
  p.xz = uCenter.xz + (p.xz - uCenter.xz) * (1.0 + 2.2 * tp * tp);
  edge *= 1.0 - 0.88 * tp;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = max(length(mv.xyz), 0.05);
  float sz = iData.x;
  float hs = max(sz * 0.5, uMinPx * (1.0 + uFar * smoothstep(45.0, 110.0, dist)) * dist / uPxScale);   // uFar: the far end of a layer is drawn larger
  float e0 = sz * 0.5 / hs;
  float energy = max(e0 * e0, uMinE);
  // a streak from where the mote is to where it was a shutter ago (plus the length of a string of dead plankton)
  float ang = seed * 50.0;
  vec3 sv = (viewMatrix * vec4(uStreak, 0.0)).xyz + vec3(cos(ang), sin(ang), 0.0) * (hs * 3.0 * iData.w);
  float al = length(sv);
  vec3 dirv = al > 1e-5 ? sv / al : vec3(0.0, 1.0, 0.0);
  vec3 cr = cross(dirv, mv.xyz); float cl = length(cr);
  vec3 side = cl > 1e-5 ? cr / cl : vec3(1.0, 0.0, 0.0);
  float tt = position.y * 0.5 + 0.5;
  vec3 vp = mv.xyz - sv * tt + dirv * (-position.y * hs) + side * (position.x * hs);
  gl_Position = projectionMatrix * vec4(vp, 1.0);
  vUv = position.xy;
  energy *= pow(2.0 * hs / (al + 2.0 * hs), 0.32);
  float band;
  float halo = armHalo(p, band);
  vec3 toC = uColonyPos - p;
  vec3 broad = uColonyCol * (uColonyI * 0.26 * uBroad / (1.0 + dot(toC, toC) / 1200.0));
  vec3 light = (uKeyCol * 1.3 + uMidCol * 0.8 + uHaloCol * (halo * uHaloK * (0.55 + 1.5 * band)) + broad) * uLit;
  float bl = 0.5 + 0.5 * sin(uTime * (1.5 + 3.0 * fract(seed * 9.0)) + seed * 60.0);
  float blink = mix(1.0, pow(bl, 10.0) * 3.0, uBlink);
  vec3 col = mix(uColA, uColB, fract(seed * 7.13)) * light + uSelf * blink;
  col *= 1.0 - uTwinkle * (0.3 + 0.3 * sin(uTime * (1.6 + 2.6 * fract(seed * 5.3)) + seed * 90.0));
  float nf = smoothstep(uNear.x, uNear.y, dist);
  vCol = col * (iData.z * energy * edge * nf * uGain * (1.0 - fogF(dist)));
}`;
const MOTE_FRAG = /* glsl */`
varying vec2 vUv; varying vec3 vCol;
void main() {
  float r2 = dot(vUv, vUv);
  float g = max(exp(-r2 * 3.2) - 0.04, 0.0) * (1.0 - smoothstep(0.7, 1.0, r2));
  gl_FragColor = vec4(vCol * g, 1.0);
}`;

// ---- fish: lanternfish (dark, seven blue photophores on the belly, tail beating) in a wrap box that rises or
// falls; with #define HATCHET the same shader draws silver hatchetfish wheeling in schools like thrown coins.
const FISH_VERT = /* glsl */`
attribute vec3 iBase; attribute vec3 iDir; attribute vec4 iData;    // size, seed, speed, school phase
attribute vec2 aFish;                                               // tail weight, -
uniform vec3 uCenter, uBox;
uniform float uWrap, uSign, uVis;
uniform vec2 uFar;
varying vec3 vLocal, vN, vWorld, vSide; varying float vSeed, vFar, vGain, vVis, vTiny;
${ENV}
void main() {
  float seed = iData.y, edge = 1.0;
  vGain = 1.0;
#ifdef HATCHET
  vGain = 1.0 + iData.z;
  float yaw = uTime * 0.45 + iData.w * 6.28318 + 1.1 * sin(uTime * 0.6 + iData.w * 20.0);
  float cy = cos(yaw), sy = sin(yaw);
  vec3 c = iBase + uCenter + vec3(cy * iDir.x + sy * iDir.z, iDir.y + 0.1 * sin(uTime * 0.8 + seed * 30.0), -sy * iDir.x + cy * iDir.z);   // uCenter: (0,0,0) for the standing schools
  vec3 F = vec3(-sy * iDir.x + cy * iDir.z, 0.0, -cy * iDir.x - sy * iDir.z) + vec3(sin(seed * 40.0), 0.0, cos(seed * 40.0)) * 0.25;
  F = F / max(length(F), 1e-4);
#else
  vec3 F = vec3(iDir.x, iDir.y * uSign, iDir.z);
  vec3 c = iBase + vec3(0.0, F.y * iData.z * uTime, 0.0);      // they rise (or pour down) in place: the pillar keeps its shape
  c += vec3(sin(uTime * 0.7 + seed * 31.0), 0.0, cos(uTime * 0.6 + seed * 17.0)) * 0.12;
  if (uWrap > 0.5) {
    vec3 q = mod(c - uCenter + uBox * 0.5, uBox);
    vec3 e = min(q, uBox - q) / (uBox * 0.1);
    edge = clamp(min(e.x, min(e.y, e.z)), 0.0, 1.0);
    c = uCenter + q - uBox * 0.5;
  }
#endif
  vec3 X = cross(vec3(0.0, 1.0, 0.0), F); X = X / max(length(X), 1e-4);
  vec3 U = cross(F, X);
#ifdef HATCHET
  // a fish swims upright: it banks up to 23 degrees about its own line of travel as the school wheels, out of step
  // with its neighbours, so its mirror flank tilts through the light. (It rolled 75 degrees either way, a thrown
  // coin: half of a school lay on its side or showed the lens a flat pane, and it read as shards.)
  float roll = 0.3 * sin(uTime * (0.8 + 0.7 * fract(seed * 5.7)) + seed * 37.0) + 0.1 * sin(uTime * 2.1 + seed * 11.0);
  float cr = cos(roll), sr = sin(roll);
  vec3 X0 = X; X = X0 * cr + U * sr; U = U * cr - X0 * sr;
#endif
  vSide = X;
  float dcam = distance(c, cameraPosition);
  // a school gathers and thins fish by fish (uVis 1: all of it). A fish arrives WHOLE: at 60% of its size and in the
  // water's own colour (vVis, in the fragment shader), then grows and takes its light. (Scaled up from nothing it
  // was a stipple of dark and light pixels for its first second.)
  float vis = smoothstep(seed * 0.8, seed * 0.8 + 0.2, uVis);
  vVis = vis;
  float sc = iData.x * edge * (vis > 0.0 ? 0.6 + 0.4 * vis : 0.0) * smoothstep(0.3, 0.9, dcam) * (1.0 - smoothstep(uFar.x, uFar.y, dcam));
  vec3 lp = position;
  float ph = uTime * (8.0 + 5.0 * fract(seed * 3.3)) + seed * 40.0;
  lp.x += sin(ph + lp.z * 5.0) * (0.015 + 0.1 * aFish.x);
  vec3 wp = c + (X * lp.x + U * lp.y + F * lp.z) * sc;
  vN = X * normal.x + U * normal.y + F * normal.z;
  vWorld = wp; vLocal = position; vSeed = seed;
  vFar = 1.0 - smoothstep(9.0, 26.0, iData.x * uPxScale / max(dcam, 0.05));
  vTiny = 1.0 - smoothstep(3.0, 8.0, sc * uPxScale / max(dcam, 0.05));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const FISH_FRAG = /* glsl */`
uniform vec3 uPhoto;
varying vec3 vLocal, vN, vWorld, vSide; varying float vSeed, vFar, vGain, vVis, vTiny;
${ENV}
void main() {
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  vec3 N = vN / max(length(vN), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 3.0);
#ifdef HATCHET
  // a fish, not a shard: it takes the water's light as the other animals here do. A dark back over a silver flank
  // and a pale belly, at every size (under 9 px that is all there is of it). The glow overhead lights it from above
  // and the colony from where the colony lies: its school's share of that light (vGain) through a knee that tops
  // out at 0.36, so it is never brighter than the lit helmets beside it, whatever the colony throws at it; the
  // light wraps round a body with thickness (and half of it is the water's own scatter, which reaches every side:
  // seen from above, the colony under it, a fish is a grey-blue back and not a black sliver), so the side turned
  // to the colony is the bright one and the back the dark one. THE FLASH IS THE MIRROR'S, not the whole fish's: the flank shows what lies along the reflected ray,
  // the water's own colour there (the glow overhead when the fish banks up to it) and the colony's glow where the
  // ray comes within 60 degrees of the colony, so as a school wheels a few fish at a time catch it, each across the
  // curve of its flank. (One flash for the whole flank, on a light multiplied up to the knee, drew every fish as
  // one flat pale tone: cut-out paper.) Close up (near): a dark eye in a pale ring, the plates of the mirror, a row
  // of lights along the keel. Under 8 px (vTiny) the fish sinks into the water's own colour (four fifths of the way
  // at 3 px), so a far school is soft flecks and not a stipple of dark and light pixels.
  float near = 1.0 - vFar;
  vec3 toC = uColonyPos - vWorld; float d2 = dot(toC, toC);
  vec3 Lc = toC / sqrt(max(d2, 1e-4)), R = reflect(-V, N);
  float glow = uColonyI * vGain / (1.0 + d2 / uColonyR2);
  glow = glow / (1.0 + glow / 0.36);
  float wrapL = clamp((dot(N, Lc) + 0.6) / 1.6, 0.0, 1.0), mirror = smoothstep(0.15, 0.95, dot(R, Lc));
  float back = smoothstep(0.03, 0.13, vLocal.y), belly = 1.0 - smoothstep(-0.17, -0.06, vLocal.y), fin = 1.0 - smoothstep(-0.42, -0.36, vLocal.z);
  vec3 alb = mix(mix(vec3(0.6, 0.66, 0.76), vec3(0.84, 0.88, 0.94), belly), vec3(0.24, 0.28, 0.38), back) * (1.0 - 0.5 * fin);
  alb *= 1.0 - near * (1.0 - back) * (0.08 - 0.08 * sin(vLocal.z * 52.0 + 4.0 * vLocal.y));      // the mirror is plates: upright bands
  vec3 lit = keyLight(N) * 2.0 + uColonyCol * (glow * (0.5 + 0.5 * wrapL));
  vec3 col = alb * lit + vec3(0.7, 0.78, 0.9) * (domeCol(R) + uColonyCol * (glow * 0.45 * mirror)) * ((1.0 - 0.7 * back) * (1.0 - fin))
    + (uColonyCol * (glow * 0.3) + uKeyCol + uMidCol * 0.5) * (fres * 0.4);
  float ed = length(vec2(vLocal.z - 0.36, vLocal.y - 0.04));
  col *= 1.0 - near * (0.94 - 0.94 * smoothstep(0.03, 0.04, ed));
  col += lit * (0.4 * near * smoothstep(0.04, 0.045, ed) * (1.0 - smoothstep(0.052, 0.06, ed)));
  col += uPhoto * ((0.1 + 0.08 * sin(vLocal.z * 70.0)) * near * (1.0 - fin)) * (1.0 - smoothstep(-0.21, -0.13, vLocal.y));
  col = mix(col, waterCol(-V), 0.8 * vTiny);
#else
  float flank = smoothstep(-0.085, -0.035, vLocal.y) * (1.0 - smoothstep(0.0, 0.06, vLocal.y));     // dark back, silvered flank, dark belly
  vec3 alb = mix(vec3(0.012, 0.016, 0.03), vec3(0.3, 0.36, 0.5), flank);
  vec3 lit = keyLight(N) + colonyLight(vWorld, N, 0.6);
  vec3 col = alb * lit * 2.2 + (uKeyCol + uMidCol * 0.5) * (fres * 0.55);
  float ed = length(vec2(vLocal.z - 0.36, vLocal.y - 0.028));
  col *= smoothstep(0.026, 0.036, ed);
  col += lit * (0.35 * smoothstep(0.036, 0.042, ed) * (1.0 - smoothstep(0.048, 0.056, ed)));
  float hh = 0.12 * clamp(1.0 - abs(vLocal.z - 0.12) * 1.75, 0.17, 1.0);
  float zc = (vLocal.z + 0.33) / 0.63 * 7.0;
  float inR = step(0.0, zc) * step(zc, 7.0);
  float cz = (fract(zc) - 0.5) * 0.09;
  float dy = vLocal.y + 0.62 * hh;
  float ph = exp(-(cz * cz + dy * dy) / 0.00095) * inR;
  float tw = 0.7 + 0.3 * sin(uTime * 3.0 + vSeed * 50.0 + floor(zc) * 1.7);
  float broad = exp(-dy * dy / 0.003) * inR;
  col += uPhoto * (ph * tw * (1.0 - vFar) + (broad * 0.4 + 0.25 + 0.6 * smoothstep(0.03, -0.05, vLocal.y)) * vFar);
  // seen from over its back a lanternfish was a black bar: the lamp before the eye, the gland on the tail stalk and
  // the glow of the belly row wrapping up the flank show from any side, and the wet back takes a thread of rim light
  float lamp = exp(-((vLocal.z - 0.44) * (vLocal.z - 0.44) + (vLocal.y - 0.012) * (vLocal.y - 0.012)) / 0.0011);
  float gland = exp(-((vLocal.z + 0.3) * (vLocal.z + 0.3) + (vLocal.y - 0.03) * (vLocal.y - 0.03)) / 0.0016);
  col += uPhoto * ((0.55 * lamp + 0.7 * gland) * tw + 0.07 * smoothstep(0.07, -0.04, vLocal.y)) * (1.0 - vFar) + uPhoto * (0.09 * fres);
#endif
  col = mix(col, domeCol(-V), fogF(dist));
  col = mix(waterCol(-V), col, vVis * vVis * (3.0 - 2.0 * vVis));
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- glass: comb jellies (kind 0), larvacean mucus houses (kind 1) and salps (kind 2) from one ellipsoid
const GLASS_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iQuat; attribute vec4 iData;    // radial scale, length scale, kind, seed
varying vec3 vLocal, vN, vWorld; varying float vKind, vSeed, vDisturb;
${ENV}
void main() {
  float kind = iData.z, seed = iData.w, sx = iData.x, sy = iData.y;
  vec3 lp = position;
  if (kind < 0.5) { lp.xz *= (0.82 + 0.18 * lp.y) * (1.0 + 0.05 * sin(uTime * 1.3 + seed * 30.0 + lp.y * 2.0)); }
  else if (kind < 1.5) { lp *= 1.0 + 0.07 * sin(lp.x * 4.0 + seed * 9.0) * sin(lp.y * 3.0 + seed * 5.0) * sin(lp.z * 5.0 + seed * 3.0); }
  else { lp.xz *= (1.0 + 0.18 * (1.0 - lp.y * lp.y)) * (1.0 + 0.07 * sin(uTime * 2.2 + seed * 20.0)); }
  vec3 sp = vec3(lp.x * sx, lp.y * sy, lp.z * sx);
  vec3 n = normalize(vec3(normal.x / sx, normal.y / sy, normal.z / sx) + vec3(0.0, 1e-5, 0.0));
  float tum = kind < 0.5 ? 0.25 : (kind < 1.5 ? 1.0 : 0.0);
  float ang = uTime * (0.08 + 0.2 * fract(seed * 3.1)) * tum + (kind < 0.5 ? 0.35 * sin(uTime * 0.4 + seed * 9.0) : 0.0);
  vec3 axis = normalize(vec3(sin(seed * 17.0), 0.4, cos(seed * 23.0)));
  vec4 q = qmul(vec4(axis * sin(ang * 0.5), cos(ang * 0.5)), iQuat);
  vec3 c = iPos + vec3(sin(uTime * 0.2 + seed * 12.0), sin(uTime * 0.27 + seed * 7.0), cos(uTime * 0.23 + seed * 5.0)) * 0.08;
  vec3 wp = c + qrot(q, sp);
  vN = qrot(q, n); vWorld = wp; vLocal = position; vKind = kind; vSeed = seed;
  vDisturb = 1.0 - smoothstep(1.5, 7.0, distance(c, cameraPosition));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}`;
const GLASS_FRAG = /* glsl */`
uniform vec3 uEmber;
varying vec3 vLocal, vN, vWorld; varying float vKind, vSeed, vDisturb;
${ENV}
void main() {
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  vec3 N = vN / max(length(vN), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - ndv, 2.2);
  vec3 lit = keyLight(N) + colonyLight(vWorld, N, 1.0) + uMidCol * 0.6;
  float lon = atan(vLocal.z, abs(vLocal.x) < 1e-4 ? 1e-4 : vLocal.x), lat = vLocal.y;
  float rowD = abs(sin(lon * 4.0));
  float bd = abs(sin(lat * 9.0));
  float fw = fwidth(rowD) + 1e-4, fwBd = fwidth(bd) + 1e-4;   // derivatives before any branch
  vec3 col; float a;
  if (vKind < 0.5) {
    // comb jelly: eight comb rows running as beads of the down-light (cyan to violet only), canals that flare
    float ends = 1.0 - smoothstep(0.72, 0.93, abs(lat));
    float row = (1.0 - smoothstep(0.09, 0.09 + fw, rowD)) * ends;
    float bead = 0.5 + 0.5 * sin(lat * 40.0 - uTime * 7.0 + floor(lon * 1.2732 + 4.0) * 1.3);
    bead = bead * bead;
    vec3 hue = mix(vec3(0.1, 0.85, 1.0), vec3(0.5, 0.25, 1.0), 0.5 + 0.5 * sin(lat * 5.0 - uTime * 2.4 + lon * 2.0));
    float amb = 0.32 + 1.6 * dot(uKeyCol, vec3(0.33)) + 0.3 * dot(colonyLight(vWorld, N, 1.0), vec3(0.33));
    float canal = (1.0 - smoothstep(0.2, 0.55, rowD)) * ends * vDisturb * (0.45 + 0.55 * sin(lat * 5.0 - uTime * 6.0 + vSeed * 20.0));
    canal = max(canal, 0.0);
    col = vec3(0.5, 0.75, 0.9) * lit * (0.1 + 1.3 * fres) + hue * (row * (0.25 + 1.1 * bead) * amb) + vec3(0.1, 0.95, 0.7) * (canal * 1.3);
    float gut = exp(-dot(vLocal.xz, vLocal.xz) * 30.0) * (1.0 - smoothstep(0.3, 0.8, abs(lat)));
    col += vec3(0.35, 0.5, 0.8) * lit * gut * 0.6;
    a = clamp(0.03 + 0.45 * fres + 0.4 * row + 0.3 * canal + 0.12 * gut, 0.0, 0.9);
  } else if (vKind < 1.5) {
    // mucus house: a ghost-balloon, brightest at its limb, with a faint veil of filter folds
    float edge = smoothstep(0.0, 0.32, ndv);
    float inner = pow(ndv, 5.0) * (0.6 + 0.4 * sin(lon * 3.0 + lat * 4.0 + vSeed * 20.0));
    float veil = 0.5 + 0.5 * sin(lon * 5.0 + 3.0 * sin(lat * 3.0 + vSeed * 10.0));
    col = (vec3(0.7, 0.72, 0.8) * lit + vec3(0.02, 0.022, 0.03)) * (0.03 + 0.42 * fres * sqrt(fres) + 0.07 * inner + 0.035 * veil);
    a = (0.02 + 0.16 * fres + 0.05 * inner + 0.02 * veil) * edge;
    col *= edge;
  } else {
    // salp: a glass barrel with muscle bands and a warm gut nucleus
    float band = (1.0 - smoothstep(0.2, 0.2 + fwBd, bd)) * (1.0 - smoothstep(0.8, 0.95, abs(lat)));
    vec3 g = vLocal - vec3(0.0, -0.62, 0.0);
    float gut = exp(-dot(g, g) * 14.0);
    col = vec3(0.45, 0.7, 1.0) * lit * (0.12 + 1.4 * fres + 0.45 * band) + uEmber * gut * 1.4;
    a = clamp(0.05 + 0.5 * fres + 0.25 * band + 0.7 * gut, 0.0, 0.9);
  }
  float ff = fogF(dist);
  // (the glow in the water lies between a glass animal and the lens as much as behind it: what its alpha takes
  // out of the glow is put back, or a mucus house 40 m above the colony was a dark disc on the indigo)
  gl_FragColor = vec4(col * (1.0 - ff) + domeCol(-V) * (ff * a) + deepGlow(-V) * (a * (1.0 - 0.6 * ff) * (1.0 - ff)), a * (1.0 - 0.6 * ff));
}`;

// ---- body: opaque animals lit only by the glow overhead and by the colony (red is black until its light arrives)
const BODY_VERT = /* glsl */`
attribute vec4 aA;        // v along the body 0..1, wave weight, part id, metres along a ray / arm
attribute vec4 aThin;     // centre-line point and a flag: thin parts never draw under ~1.6 px
#ifdef INSTANCED
attribute vec3 iPos; attribute vec4 iQuat; attribute vec4 iData;   // scale, seed, light gain, late (1 = shown only from u 0.5)
#endif
uniform float uPhase, uFlick, uFlickT, uLate;
varying vec3 vN, vWorld, vColor, vLocal; varying vec4 vA; varying float vWave, vGain;
${ENV}
#if MODE == 0
// the oarfish hangs in a slow S: a two-node wave travelling tailward, a lazy sway of the whole ribbon, the rare flick
vec2 sBend(float v, float seed) {
  float z = sin(v * 5.0 - uTime * 0.7 + seed) * 1.05 * smoothstep(0.05, 0.4, v) + sin(v * 2.1 - uTime * 0.45 + seed * 1.7) * 0.35 * v;
  z += uFlick * sin(v * 5.0 - uFlickT * 12.0) * (0.25 + 0.75 * v);
  float x = sin(v * 3.4 - uTime * 0.5 + seed * 2.3) * 0.45 * smoothstep(0.1, 0.7, v);
  return vec2(x, z);
}
#endif
vec3 disp(vec3 p, vec4 a, float seed, inout vec3 n, out float wave) {
  vec3 d = vec3(0.0);
  wave = 0.0;
#if MODE == 0
  d.xz += sBend(a.x, seed);
  vec2 db = (sBend(a.x + 0.004, seed) - sBend(a.x - 0.004, seed)) * (-125.0 / 8.0);    // slope along y (the body is 8 m)
  n.y -= db.x * n.x + db.y * n.z;
  // the dorsal sail runs waves from head to tail (1.2 m/s); plumes and oars trail and sway from their roots
  float ph = a.x * 27.0 - uTime * 4.2 + seed;
  d.z += (sin(ph) + 0.4 * sin(a.x * 61.0 - uTime * 6.0)) * 0.15 * a.y;
  d.x += cos(ph) * 0.05 * a.y;
  wave = cos(ph) * a.y;
  n.y += cos(ph) * 0.5 * a.y * n.z;
  d.z += sin(uTime * 1.1 - a.w * 1.5 + p.x * 3.0 + seed) * 0.13 * a.w;
  d.x += sin(uTime * 0.8 - a.w * 1.2 + p.z * 5.0 + seed) * 0.08 * a.w;
#elif MODE == 1
  float w2 = a.w * a.w;
  d.x += sin(uTime * 0.8 + a.w * 0.9 + p.z * 4.0 + seed) * 0.035 * w2 + uFlick * sin(a.w * 1.2 - uFlickT * 9.0) * 0.12 * a.w;
  d.z += cos(uTime * 0.65 + a.w * 0.8 + p.x * 4.0 + seed) * 0.035 * w2;
  d.z += sin(uTime * 2.0 + p.y * 5.0) * 0.1 * a.y;
  d.xz += p.xz * (0.05 * sin(uTime * 1.1) * (1.0 - step(0.5, a.z)) * (1.0 - a.x));
#else
  float pulse = 0.5 + 0.5 * sin(uTime * 2.513 + seed);
  pulse *= pulse;
  d.xz -= p.xz * (0.26 * pulse * a.y);
  d.y += 0.06 * pulse * a.y;
  d.xz += vec2(sin(uTime * 1.1 + a.w * 3.0 + seed), cos(uTime * 0.9 + a.w * 2.0 + seed)) * (0.02 * a.w);
#endif
  return d;
}
void main() {
  float seed = uPhase;
#ifdef INSTANCED
  seed = iData.y * 6.28318;
#endif
  vec3 n = normal;
  float wave;
  vGain = 1.0;
#ifdef INSTANCED
  vGain = iData.z;
#endif
  vec3 d = disp(position, aA, seed, n, wave);
  vec3 p = position + d, c = aThin.xyz + d;
#ifdef INSTANCED
  vec3 ip = iPos + vec3(0.0, 0.3 * sin(uTime * 0.25 + seed), 0.0);
  float isc = iData.x * mix(1.0, uLate, iData.w);        // the climb's own jellies arrive while the lens rides the arm
#if MODE == 2
  isc *= 1.0 - smoothstep(60.0, 78.0, distance(ip, cameraPosition));   // 80 m off and seen from over the crown a helmet was a 1 % black block: they grow in from 78 m
#endif
  p = ip + qrot(iQuat, p * isc); c = ip + qrot(iQuat, c * isc); n = qrot(iQuat, n);
#else
  p = (modelMatrix * vec4(p, 1.0)).xyz; c = (modelMatrix * vec4(c, 1.0)).xyz; n = mat3(modelMatrix) * n;
#endif
  if (aThin.w > 0.5) {
    float r = max(length(p - c), 1e-5);
    float dist = length((viewMatrix * vec4(c, 1.0)).xyz);
#if MODE == 2
    p = c + (p - c) * max(1.0, 1.25 * dist / (uPxScale * r));     // a helmet's tentacles: never under 2.5 px (at 1.6 they broke into dotted lines at 20 m)
#else
    p = c + (p - c) * max(1.0, 0.8 * dist / (uPxScale * r));
#endif
  }
  vN = n; vWorld = p; vColor = color; vLocal = position; vA = aA; vWave = wave;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const BODY_FRAG = /* glsl */`
uniform vec3 uSheen, uColonyN;
uniform float uReach2, uCut, uMemb;
varying vec3 vN, vWorld, vColor, vLocal; varying vec4 vA; varying float vWave, vGain;
${ENV}
// the colony as its neighbours take it: a disc of light 54 m wide under them. Its strength falls with HEIGHT above
// the disc (and with distance outside the rim), not with distance from the core, so a jelly beside the bells is
// scarlet and one 25 m up is a black shape; the light arrives from below and from the core's side.
float discAtt(vec3 wp, out vec3 l) {
  vec3 lc = uColonyPos - wp;
  float h = -dot(lc, uColonyN);
  vec3 rv = lc + uColonyN * h;
  float rex = max(length(rv) - ${(17 * HERO_K).toFixed(1)}, 0.0), hh = max(h, 0.0);
  l = lc / max(length(lc), 1e-3) * 0.55 - uColonyN;
  l = l / max(length(l), 1e-4);
  return uColonyI / (1.0 + (hh * hh + rex * rex) / uReach2) * (1.0 - uCut * smoothstep(11.0, 26.0, hh));
}
void main() {
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-4);
  vec3 N = vN / max(length(vN), 1e-4);
  if (dot(N, V) < 0.0) N = -N;
  float ndv = clamp(dot(N, V), 0.0, 1.0), fres = pow(1.0 - ndv, 2.5);
  // (with antialiasing a pixel half-covered by a sliver of a triangle, the oarfish's sail where its body bends, is
  // shaded OUTSIDE the triangle, where the vertex colour and the sail's wave run off to huge values: one such pixel
  // was a white square with a glow round it. Both are clamped, and so is the result.)
  vec3 vc = clamp(vColor, 0.0, 1.0), alb = vc;
  float fq = fwidth(vA.x), fx = fwidth(vLocal.x);          // derivatives before any branch
  vec3 L;
  float att = discAtt(vWorld, L) * vGain;
  float nl = clamp((dot(N, L) + 0.15) / 1.15, 0.0, 1.0);
  vec3 col;
#if MODE == 0
  if (vA.z < 0.5) {
    // mirror-silver flank: dusky oblique bars breaking into blotches, fine spots, the lateral line, the gill cover
    float soft = 1.0 - smoothstep(0.003, 0.012, fq);
    float bars = smoothstep(0.25, 0.95, sin(vA.x * 46.0 + vLocal.x * 5.0 + 1.6 * sin(vA.x * 13.0))) * (0.6 + 0.4 * sin(vLocal.x * 19.0 + vA.x * 29.0));
    float spots = smoothstep(0.75, 0.95, sin(vA.x * 230.0) * sin(vLocal.x * 60.0 + vA.x * 40.0));
    alb *= 1.0 - (0.5 * bars + 0.3 * spots) * soft * smoothstep(0.03, 0.08, vA.x);
    alb *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.012 + fx, abs(vLocal.x - 0.02))) * soft;
    float gy = (vA.x - 0.03) * 8.0;
    float gd = abs(length(vec2(vLocal.x + 0.04, gy + 0.04)) - 0.31);
    alb *= 1.0 - 0.3 * (1.0 - smoothstep(0.0, 0.02 + fx, gd)) * smoothstep(0.1, 0.18, gy) * soft;
    // lit from below: a face turned down to the disc takes its light, a face turned up goes dark, and the mirror
    // picks up the glow under it; the head end, furthest from the light, is the darkest
    float under = clamp(0.45 - 1.15 * N.y, 0.0, 1.3) * (0.35 + 0.65 * nl);
    vec3 R = reflect(-V, N);
    float mirror = smoothstep(0.25, -0.75, R.y);
    float topDark = mix(0.42, 1.1, smoothstep(0.0, 0.6, vA.x)) * (1.0 - 0.65 * smoothstep(0.7, 1.0, vA.x));   // and the thin tail takes little
    float glint = mirror * under;
    float Lm = att * topDark * (0.05 + 0.36 * under + 0.24 * mirror * (0.4 + under));
    Lm = 1.25 * Lm / (1.0 + 0.6 * Lm);                        // a soft knee: the flank never burns out to white
    col = alb * (uColonyCol * Lm + keyLight(N) * 0.6 + domeCol(R) * 1.2) + uColonyCol * (min(att * topDark, 1.2) * 0.08 * glint * glint * glint) + uSheen * ((0.02 + 0.25 * fres) * (0.3 + 0.4 * att));
  } else if (vA.z < 1.5) {
    // crimson sail, plumes and oars: thin membranes. They ride the back, in the body's shadow, so from the lit side
    // they are nearly black; seen against the light (from above, looking down past the fish) they glow through.
    // fin rays: fine ones close up, bundles of four at a distance (they were faded out beyond a few metres, which
    // left the sail one flat sheet); the membrane glows at its root and falls to dark red at its free edge and tips
    float sail = step(vA.w, 0.001), fine = 1.0 - smoothstep(0.6, 2.2, fq * 240.0), coarse = (1.0 - smoothstep(0.6, 2.2, fq * 60.0)) * (1.0 - 0.6 * fine);
    float rays = mix(1.0, 0.72 + 0.28 * sin(vA.x * 240.0), fine * sail) * mix(1.0, 0.62 + 0.38 * sin(vA.x * 60.0 + 0.8 * sin(vA.x * 17.0)), coarse * sail);
    float tip = mix(clamp(vA.w / 1.9, 0.0, 1.0), vA.y, sail);
    rays *= mix(0.82 + 0.18 * sin(vA.w * 30.0), 1.0, sail);                     // the plumes and oars are barred along their length
    // ... and each is a RAY with a vane: a bright rib down its middle, the membrane either side of it darker (the
    // part id runs 1.0 to 1.4 across a plume), so the crest reads as rays at 15 m and not as red blades
    float across = clamp((vA.z - 1.0) * 2.5, 0.0, 1.0);
    rays *= mix(mix(0.42, 1.7, 1.0 - smoothstep(0.1, 0.36, abs(across - 0.5))), 1.0, sail);
    float ripple = 0.8 + 0.5 * clamp(vWave, -1.0, 1.0);
    float through = smoothstep(0.0, 0.75, -dot(V, L));
    float oar = step(0.001, vA.w) * step(vLocal.x, 0.0);                       // the pelvic oars hang under the head, in the light
    float memb = (0.07 + 0.5 * through + 0.4 * oar * nl) * uMemb;
    col = alb * (uColonyCol * (att * memb * ripple) + keyLight(N) * 1.3) * rays * mix(1.35, mix(0.2, 0.26, sail), tip * tip * (3.0 - 2.0 * tip)) + (alb + uColonyCol * 0.25) * (fres * 0.16 * att * (1.0 - 0.5 * tip));
  } else {
    col = alb * (uColonyCol * (att * 0.4 * (0.3 + nl)) + keyLight(N)) + uColonyCol * (att * 0.5 * pow(ndv, 24.0) * step(2.5, vA.z));
  }
#else
  // red animals: black until the colony's light falls on them. Lit underside, dark crown, a thread of rim light.
#if MODE == 1
  float below = clamp(0.38 - 1.15 * N.y, 0.03, 1.35);      // the squid: its underside takes the light, its upper faces almost none
#else
  // the helmet jelly: a thick dark crown, a thin pleated skirt below the groove and a margin of lappets. The light
  // comes up from the disc, so the underside and the skirt take it (a wide wrap: the flesh scatters), the crown none
  float below = clamp(0.56 - 0.86 * N.y, 0.03, 1.25);
  float bellK = step(vA.w, 0.001), marg = smoothstep(0.88, 1.0, vA.x) * bellK;
  nl = clamp((dot(N, L) + 0.6) / 1.6, 0.0, 1.0);
  alb *= mix(0.34, 1.0, smoothstep(0.05, 0.68, vA.x));
#endif
  att = 1.3 * att / (1.0 + 0.5 * att);                     // a soft knee: scarlet, never a flat clipped red
#if MODE == 1
  att *= 0.9 * mix(1.15, 0.2, smoothstep(0.6, 3.3, vLocal.y));   // ... and the light dies up the mantle: lit arms and head, a dark crown
#endif
  vec3 lit = keyLight(N) + uColonyCol * (att * nl * below);
#if MODE == 1
  // the squid: chromatophores mottle the mantle, the arms nearest the light are the brightest, the mantle tip the darkest
  vec3 mq = vLocal * vec3(13.0, 8.0, 13.0);
  mq += 2.2 * sin(mq.yzx * 0.83 + vec3(0.0, 2.1, 4.2)) + 1.1 * sin(mq.zxy * 1.9 + vec3(1.7, 0.3, 5.1));
  float mott = 0.5 + 0.5 * sin(mq.x + 1.3 * sin(mq.z * 0.7)) * sin(mq.y * 1.3 + mq.z * 0.6);
  vec3 bq = vLocal * vec3(4.1, 2.3, 4.1); bq += 1.6 * sin(bq.zxy * 1.1 + vec3(2.0, 0.0, 4.0));
  float blot = 0.5 + 0.5 * sin(bq.x) * sin(bq.y + bq.z);
  alb *= (0.55 + 0.55 * smoothstep(0.25, 0.75, mott) + 0.35 * blot * blot) * mix(1.25, 0.7, smoothstep(-1.5, 3.4, vLocal.y));
#endif
  float through = smoothstep(0.1, 0.9, -dot(V, L));         // seen against the light the flesh glows through
#if MODE == 2
  // glow-through follows thickness: little through the crown or face-on, most at the limb and in the skirt. Seen
  // from above (the helix) this is the whole of a helmet's light, the lit underside being turned away: a lantern
  through *= 0.5 * (mix(0.24, 0.85, smoothstep(0.42, 0.95, vA.x)) + 0.8 * pow(1.0 - ndv, 1.5) * mix(0.45, 1.0, smoothstep(0.2, 0.9, vA.x)));
#else
  through *= 0.6;
#endif
  col = alb * lit * 1.2 + alb * uColonyCol * (att * through) + (alb * 0.6 + uSheen * 0.25) * (fres * (lit + 0.01)) + uColonyCol * (att * fres * fres * 0.14);
#if MODE == 1
  // the rim: the wet skin's edge catches the colony's light all round, brightest on the limb turned to it
  col += (uColonyCol * 0.55 + alb * uColonyCol * 1.6) * (att * fres * (0.25 + 0.75 * nl) * 0.5);
  // the eye: a pale ring that takes the colony's light whichever way it faces, and a point of light in the pupil
  float eye = step(1.5, vA.z);
  col = mix(col, vc * uColonyCol * (0.12 + 0.75 * att) + uColonyCol * (0.9 * att * pow(ndv, 40.0)), eye);
#endif
#if MODE == 2
  // the lappets are thin enough to glow: a bright scalloped margin; and the wet skin's edge takes the last of the
  // glow overhead, so a helmet far above the colony is a rimmed animal, not a black blot
  col += (alb * 1.7 + uColonyCol * 0.07) * uColonyCol * (att * marg * (0.5 + 0.5 * nl));
  // the flesh scatters what reaches it (a dark maroon crown, never a black hole in black water) and the limb of
  // the bell takes a red thread of the colony's light
  col += (alb * 0.05 + vc * (0.05 + 0.42 * fres)) * uColonyCol * (att * bellK) + uColonyCol * (att * marg * marg * 0.12);
  col *= 1.3;
  col += (uKeyCol * 0.8 + uMidCol * 0.45) * (fres * fres * 0.5);
#endif
#endif
  col = clamp(col, 0.0, 6.0);
  col = mix(col, domeCol(-V), fogF(dist));
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- the eye seen edge-on: a dim lens of haze. One quad facing the lens; the fragment shader works along its own
// ray. OPACITY and LIGHT are separate: (1) the PLUG hides the flat window in the eye and its rim: where the ray meets
// the disc's plane inside uEyeR it is opaque (feathered over 2.6 m of radius), and a thin Gaussian lens in the plane
// (integrated in closed form) covers the last few pixels when the window is seen exactly edge-on; in place of what
// it hides it shows the animal's halo at the level it has round the eye (uEyeFill), so the window is neither a pale
// plate nor a dark blade. (2) The HAZE is a Gaussian cloud (uEyeA metres wide in the
// disc's plane, uEyeB thick), integrated in closed form, in the halo's indigo and never brighter than the halo along
// the arm; wisps at two scales (and thin layers across its thickness) take 45% out of it, it fades toward the frame's
// edge and toward the lens, and under the grade's black point its thin parts are black water. Points carry the light
// (the flakes drawn over it), not fog. Laid over the window with premultiplied alpha, only while the lens is near the
// disc's plane (uEyeGain); from above it is not drawn.
const EYE_VERT = /* glsl */`
uniform vec3 uEyePos; uniform float uEyeSize, uEyePull;
varying vec3 vWorld; varying vec4 vClip;
void main() {
  vec3 toCam = cameraPosition - uEyePos; float dC = max(length(toCam), 1e-3);
  vec3 fwd = toCam / dC;
  vec3 rt = cross(vec3(0.0, 1.0, 0.0), fwd); rt = rt / max(length(rt), 1e-4);
  vec3 up = cross(fwd, rt);
  vec3 wp = uEyePos + fwd * min(uEyePull, dC * 0.6) + (rt * position.x + up * position.y) * uEyeSize;   // it stands in front of the whole window
  vWorld = wp;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  vClip = gl_Position;
}`;
const EYE_FRAG = /* glsl */`
uniform vec3 uEyePos, uEyeN, uEyeCol, uEyeFill; uniform float uEyeGain, uEyeA, uEyeB, uEyeR, uTime;
varying vec3 vWorld; varying vec4 vClip;
// the line integral of a Gaussian lens (a wide, b thick) along the ray o + d t: 1 through the middle, edge-on
float lens(vec3 o, vec3 d, float dn, float on, float a, float b, out float tm) {
  float ia = 1.0 / (a * a), ib = 1.0 / (b * b);
  float A = max((1.0 - dn * dn) * ia + dn * dn * ib, 1e-6);
  float B = (dot(o, d) - on * dn) * ia + on * dn * ib;
  float Cq = (dot(o, o) - on * on) * ia + on * on * ib;
  tm = -B / A;
  return sqrt(3.14159 / A) * exp(-max(Cq - B * B / A, 0.0)) / (1.7725 * a);
}
void main() {
  vec3 o = cameraPosition - uEyePos, dv = vWorld - cameraPosition;
  vec3 d = dv / max(length(dv), 1e-4);
  float dn = dot(d, uEyeN), on = dot(o, uEyeN), tm, t2;
  // (1) the plug over the window
  float th = -on / (abs(dn) > 1e-5 ? dn : 1e-5);
  vec3 hp = o + d * th;
  float plug = th > 0.0 ? 1.0 - smoothstep(uEyeR, uEyeR + 2.6, length(hp)) : 0.0;
  plug = max(plug, 1.0 - exp(-6.0 * lens(o, d, dn, on, 5.0, 0.42, t2)));
  // (2) the haze: measured where the ray passes nearest the middle of the cloud
  float I = lens(o, d, dn, on, uEyeA, uEyeB, tm);
  vec3 qm = o + d * tm; float hq = dot(qm, uEyeN); vec3 q = qm - uEyeN * hq;
  float w1 = sin(q.x * 0.9 + 1.6 * sin(q.z * 0.55 + uTime * 0.21) + uTime * 0.13) * sin(q.z * 0.8 - uTime * 0.17 + 1.3 * sin(q.x * 0.4));
  float w2 = sin(q.x * 2.7 - q.z * 1.9 + hq * 4.6 + 1.2 * sin(q.z * 1.3 - uTime * 0.19) + uTime * 0.23) * sin(q.z * 2.3 + q.x * 1.1 - hq * 3.1 + uTime * 0.11);
  float wisp = 1.0 + 0.3 * w1 + 0.25 * w2;
  vec2 ndc = vClip.xy / max(vClip.w, 1e-4);
  float edgeF = (1.0 - smoothstep(0.5, 0.96, abs(ndc.x))) * (1.0 - smoothstep(0.72, 1.0, abs(ndc.y))), lensF = smoothstep(4.0, 10.0, tm);
  float e = 1.3 * (1.0 - exp(-2.0 * I)) * wisp * edgeF * lensF * uEyeGain;
  // what the plug hides it gives back: the animal's own halo, at about the level it has round the eye (uEyeFill), so
  // the window is not a dark blade in the halo either
  float fill = plug * uEyeGain * (0.8 + 0.2 * w1) * lensF * mix(1.0, edgeF, 0.6) * (1.0 - 0.6 * min(e / 1.3, 1.0));
  gl_FragColor = vec4(uEyeCol * e + uEyeFill * fill, min(max(plug * 0.97, 0.22 * min(e, 1.0)) * uEyeGain, 1.0));
}`;

// ---- the pillar's near face: lanternfish as upright dashes. Each is a 4:1 quad along its own line of rise: a dark
// spindle with a forked tail, a row of blue photophores along the belly (beads when it is large enough, one thread
// of light when it is three pixels long) and a lamp by the eye. Premultiplied, so the dark body shows against the
// column's glow and the lights against black water. They are impostors for the first hundred metres only: they fade
// out as the lens nears the column and the modelled fish take over.
const PFISH_VERT = /* glsl */`
attribute vec3 iBase; attribute vec4 iData;          // iData: size factor, seed, brightness, -
uniform vec3 uCenter; uniform vec2 uNear, uWrapH; uniform float uRise, uGain, uAng, uSign;
varying vec2 vUv; varying float vA, vSeed, vPx;
${ENV}
void main() {
  float seed = iData.y, H = mix(uWrapH.x, uWrapH.y, iData.w);
  vec3 p = iBase;
  float y = mod(p.y - uCenter.y + uRise * (0.75 + 0.5 * fract(seed * 7.3)) + H * 0.5, H);
  float edge = clamp(min(y, H - y) / (H * 0.12), 0.0, 1.0);
  p.y = uCenter.y + y - H * 0.5;
  p.xz += vec2(sin(uTime * 0.5 + seed * 40.0), cos(uTime * 0.43 + seed * 23.0)) * 0.3;
  float a1 = (fract(seed * 13.7) - 0.5) * 0.8 + 0.14 * sin(uTime * (2.0 + 2.0 * fract(seed * 5.1)) + seed * 60.0), a2 = fract(seed * 29.3) * 6.2832;
  vec3 ax = vec3(sin(a1) * cos(a2), cos(a1) * uSign, sin(a1) * sin(a2));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  float dist = max(length(mv.xyz), 0.05);
  vec2 a2d = (viewMatrix * vec4(ax, 0.0)).xy; float al = length(a2d);
  a2d = al > 1e-4 ? a2d / al : vec2(0.0, 1.0);
  // half its length: an angle (uAng times its size factor) while it is far, a true 26-34 cm once that is larger, never under 1.5 px
  float hl = max(max(min(0.13 * iData.x, 0.17), uAng * dist * iData.x) * max(al, 0.6), 1.5 * dist / uPxScale), hw = hl * 0.3;
  vec3 vp = mv.xyz + vec3(a2d * (position.y * hl) + vec2(a2d.y, -a2d.x) * (position.x * hw), 0.0);
  gl_Position = projectionMatrix * vec4(vp, 1.0);
  vUv = vec2(position.x * (fract(seed * 3.7) < 0.5 ? 1.0 : -1.0), position.y);
  vPx = hl * uPxScale / dist;
  vA = iData.z * edge * smoothstep(uNear.x, uNear.y, dist) * uGain * (1.0 - 0.75 * fogF(dist));
  vSeed = seed;
}`;
const PFISH_FRAG = /* glsl */`
uniform vec3 uPhoto, uBodyCol;
varying vec2 vUv; varying float vA, vSeed, vPx;
${ENV}
void main() {
  float x = vUv.x, y = vUv.y;
  float w = 0.92 * pow(max(1.0 - y * y, 0.0), 0.6) * (0.5 + 0.5 * smoothstep(-1.0, 0.25, y)) * (0.78 + 0.4 * fract(vSeed * 11.3));     // a spindle, fuller toward the head (+y); slim fish and deep ones
  w = max(w, (1.0 - smoothstep(-1.0, -0.6, y)) * (0.3 + 0.6 * abs(x)));                             // the forked tail
  float body = 1.0 - smoothstep(w - 0.3, w + 0.12, abs(x));
  float bx = x - 0.62 * w;                                                                          // the belly's edge
  float big = smoothstep(7.0, 10.0, vPx);                                                           // over 14-20 px long: six beads, half as bright again
  float row = exp(-bx * bx / mix(0.035, 0.05, big)) * (1.0 - smoothstep(0.6, 0.85, abs(y + 0.05)));
  float bc = 0.5 + 0.5 * cos(y * mix(12.0, 23.0, big) + vSeed * 6.0);
  float bead = mix(0.75, 0.15 + 1.25 * bc * bc, smoothstep(3.0, 6.0, vPx)) * (1.0 + 0.55 * smoothstep(5.0, 9.0, vPx));   // a thread of light when small, beads when large
  float tw = 0.72 + 0.28 * sin(uTime * 3.0 + vSeed * 50.0);
  float lamp = exp(-((x + 0.15) * (x + 0.15) * 5.0 + (y - 0.7) * (y - 0.7) * 34.0));
  vec3 col = uBodyCol * body + uPhoto * (row * bead * tw + (0.15 + 0.7 * fract(vSeed * 17.9)) * lamp) * smoothstep(0.0, 0.35, body + row);
  gl_FragColor = vec4(col * vA, body * 0.9 * min(vA * 1.5, 1.0));
}`;

// ------------------------------------------------------------------------------------------------ geometry
function quadGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
function instancedGeo(base, count, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k][0], attrs[k][1]));
  g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// a small fish: nose +Z, unit length; rings [z, halfHeight, halfWidth, yOffset]; fins are flat fans in the YZ plane
function fishGeometry(rings, sides, fins) {
  const pos = [], nor = [], fa = [], idx = [];
  const tw = (z) => { const k = clamp((0.15 - z) / 0.65, 0, 1); return k * k; };
  for (const [z, hy, hx, y0 = 0] of rings) for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    pos.push(ca * hx, y0 + sa * hy, z);
    const nx = ca / Math.max(hx, 1e-3), ny = sa / Math.max(hy, 1e-3), nl = Math.hypot(nx, ny);
    nor.push(nx / nl, ny / nl, 0); fa.push(tw(z), 0);
  }
  for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) {
    const a = j * sides + i, b = j * sides + ((i + 1) % sides), c = a + sides, d = b + sides;
    idx.push(a, b, c, b, d, c);
  }
  for (const pts of fins) {
    const base = pos.length / 3;
    for (const p of pts) { pos.push(0, p[0], p[1]); nor.push(1, 0, 0); fa.push(tw(p[1]) * 1.3, 1); }
    for (let i = 1; i < pts.length - 1; i++) idx.push(base, base + i, base + i + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aFish', new THREE.Float32BufferAttribute(fa, 2));
  g.setIndex(idx);
  return g;
}
function ellipsoidGeometry(segs, rings) {
  const pos = [], idx = [];
  for (let j = 0; j <= rings; j++) for (let i = 0; i < segs; i++) {
    const th = (j / rings) * Math.PI, ph = (i / segs) * Math.PI * 2, s = Math.max(Math.sin(th), 0.02);
    pos.push(Math.cos(ph) * s, Math.cos(th), Math.sin(ph) * s);
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) {
    const a = j * segs + i, b = j * segs + ((i + 1) % segs), c = a + segs, d = b + segs;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.slice(), 3));
  g.setIndex(idx);
  return g;
}
// vertex builder for the modelled animals: position, analytic normal, linear colour, aA (v, wave, part, metres), aThin
function Geo() {
  const P = [], N = [], C = [], A = [], T = [], I = [];
  const self = {
    v(p, n, c, a, thin) {
      P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); C.push(c.r, c.g, c.b); A.push(a[0], a[1], a[2], a[3]);
      if (thin) T.push(thin[0], thin[1], thin[2], 1); else T.push(0, 0, 0, 0);
      return P.length / 3 - 1;
    },
    tri(a, b, c) { I.push(a, b, c); },
    // rings: { c, ax, az, rx, rz, col (Color or (angle) => Color), a }
    loft(rings, sides, thin = false) {
      const base = P.length / 3;
      for (const r of rings) for (let i = 0; i < sides; i++) {
        const t = (i / sides) * Math.PI * 2, ca = Math.cos(t), sa = Math.sin(t);
        const kx = ca / Math.max(r.rx, 1e-4), kz = sa / Math.max(r.rz, 1e-4);
        const n = [r.ax[0] * kx + r.az[0] * kz, r.ax[1] * kx + r.az[1] * kz, r.ax[2] * kx + r.az[2] * kz];
        const nl = Math.hypot(n[0], n[1], n[2]) || 1;
        self.v([r.c[0] + r.ax[0] * ca * r.rx + r.az[0] * sa * r.rz, r.c[1] + r.ax[1] * ca * r.rx + r.az[1] * sa * r.rz, r.c[2] + r.ax[2] * ca * r.rx + r.az[2] * sa * r.rz],
          [n[0] / nl, n[1] / nl, n[2] / nl], typeof r.col === 'function' ? r.col(t) : r.col, r.a, thin ? r.c : null);
      }
      for (let j = 0; j < rings.length - 1; j++) for (let i = 0; i < sides; i++) {
        const a = base + j * sides + i, b = base + j * sides + ((i + 1) % sides), c = a + sides, d = b + sides;
        I.push(a, b, c, b, d, c);
      }
    },
    // a flat ribbon between two rows of points
    ribbon(rowA, rowB, n, colA, colB, aA, aB, thin = false) {
      const base = P.length / 3;
      for (let i = 0; i < rowA.length; i++) {
        const mid = thin ? [(rowA[i][0] + rowB[i][0]) / 2, (rowA[i][1] + rowB[i][1]) / 2, (rowA[i][2] + rowB[i][2]) / 2] : null;
        self.v(rowA[i], n, colA, aA(i), mid); self.v(rowB[i], n, colB, aB(i), mid);
      }
      for (let i = 0; i < rowA.length - 1; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    },
    // a round disc facing n (used for eyes): centre colour, rim colour
    disc(c, n, ux, uy, r, colIn, colOut, a) {
      const base = self.v(c, n, colIn, a);
      for (let i = 0; i < 10; i++) { const t = (i / 10) * Math.PI * 2; self.v([c[0] + (ux[0] * Math.cos(t) + uy[0] * Math.sin(t)) * r, c[1] + (ux[1] * Math.cos(t) + uy[1] * Math.sin(t)) * r, c[2] + (ux[2] * Math.cos(t) + uy[2] * Math.sin(t)) * r], n, colOut, a); }
      for (let i = 0; i < 10; i++) I.push(base, base + 1 + i, base + 1 + ((i + 1) % 10));
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4));
      g.setAttribute('aThin', new THREE.Float32BufferAttribute(T, 4));
      g.setIndex(I);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
      return g;
    },
  };
  return self;
}
const AX = [1, 0, 0], AZ = [0, 0, 1];
// the oarfish: 8 m, head up (+Y), dorsal edge +X, a blade 17 cm thick and 70 cm deep at the shoulder; v runs 0 at the
// forehead to 1 at the tail. Blunt head with a 9 cm eye, a tall scalloped dorsal sail, crest plumes with flags, two oars.
function oarfishGeometry(crimson, L = 8) {
  const g = Geo(), half = L / 2;
  const silver = new THREE.Color(0.8, 0.83, 0.88), back = new THREE.Color(0.2, 0.27, 0.42), belly = new THREE.Color(0.92, 0.95, 0.98);
  const dark = new THREE.Color(0.006, 0.008, 0.015), pale = new THREE.Color(0.95, 0.97, 1.0), iris = new THREE.Color(0.5, 0.56, 0.66);
  const red = crimson.clone().multiplyScalar(1.15), redHot = crimson.clone().lerp(new THREE.Color(1, 0.25, 0.2), 0.35).multiplyScalar(1.5);
  // [v, half depth (X), half thickness (Z), x offset of the centre line]: a rounded snout, a steep forehead
  const prof = [[-0.013, 0.03, 0.012, -0.07], [-0.009, 0.1, 0.036, -0.06], [-0.002, 0.165, 0.055, -0.04], [0.01, 0.245, 0.072, -0.015], [0.03, 0.31, 0.084, 0], [0.07, 0.345, 0.088, 0],
    [0.15, 0.335, 0.08, 0], [0.35, 0.275, 0.062, 0], [0.6, 0.185, 0.042, 0], [0.82, 0.1, 0.024, 0], [0.95, 0.04, 0.011, 0], [1, 0.012, 0.004, 0]];
  const at = (v, k) => { for (let i = 1; i < prof.length; i++) if (v <= prof[i][0]) return lerp(prof[i - 1][k], prof[i][k], clamp((v - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]), 0, 1)); return prof[prof.length - 1][k]; };
  const vs0 = [-0.013, -0.009, -0.002, 0.004, 0.01, 0.02];
  for (let i = 0; i <= 50; i++) vs0.push(0.03 + 0.97 * Math.pow(i / 50, 1.15));
  const rings = vs0.map((v) => ({ c: [at(v, 3), half - L * v, 0], ax: AX, az: AZ, rx: at(v, 1), rz: at(v, 2), a: [Math.max(v, 0), 0, 0, 0],
    col: (t) => { const c = Math.cos(t); return silver.clone().lerp(back, smoothstep(0.5, 1.0, c)).lerp(belly, smoothstep(-0.55, -1.0, c)); } }));
  g.loft(rings, 12);
  // the eye: a pale iris 9 cm across with a dark pupil, both flanks
  for (const sz of [1, -1]) {
    const ez = sz * at(0.027, 2) * 0.985;
    g.disc([-0.04, half - L * 0.027, ez], [0, 0, sz], [1, 0, 0], [0, 1, 0], 0.05, pale, iris, [0.027, 0, 2, 0]);
    g.disc([-0.04, half - L * 0.027, ez + sz * 0.004], [0, 0, sz], [1, 0, 0], [0, 1, 0], 0.026, dark, dark, [0.027, 0, 3, 0]);
  }
  // the dorsal fin: one crimson sail along the whole back, tallest behind the head, its edge scalloped ray by ray
  const rowA = [], rowB = [], vs = [], NF = 300;
  for (let i = 0; i <= NF; i++) {
    const k = i / NF, v = lerp(0.006, 0.985, k);
    const tall = v < 0.08 ? lerp(0.95, 0.72, (v - 0.006) / 0.074) : lerp(0.72, 0.16, Math.pow((v - 0.08) / 0.905, 0.8));
    const h = tall * smoothstep(0, 0.012, k) * (1 - smoothstep(0.965, 1, k)) * (0.93 + 0.07 * Math.abs(Math.sin(i * Math.PI / 8)));
    const x0 = at(v, 3) + at(v, 1) * 0.9;
    rowA.push([x0, half - L * v, 0]); rowB.push([x0 + h, half - L * v - 0.12 * h, 0]); vs.push(v);
  }
  g.ribbon(rowA, rowB, [0, 0, 1], red, redHot, (i) => [vs[i], 0, 1, 0], (i) => [vs[i], 1, 1, 0]);
  // crest plumes from the forehead, each ending in a leaf-shaped flag; two pelvic oars with paddles below the head
  const ray = (root, dir, len, w0, w1, bend) => {
    const a = [], b = [], ms = [], n = 12;
    const dl = Math.hypot(dir[0], dir[1], dir[2]) || 1, side = [-dir[1], dir[0], 0], sl = Math.hypot(side[0], side[1]) || 1;
    for (let i = 0; i <= n; i++) {
      const k = i / n, m = k * len, w = w0 + (w1 - w0) * smoothstep(0.58, 0.8, k) * (1 - 0.9 * smoothstep(0.9, 1, k));
      const c = [root[0] + dir[0] / dl * m + bend[0] * k * k * len, root[1] + dir[1] / dl * m + bend[1] * k * k * len, root[2] + dir[2] / dl * m + bend[2] * k * k * len];
      a.push([c[0] - side[0] / sl * w, c[1] - side[1] / sl * w, c[2]]); b.push([c[0] + side[0] / sl * w, c[1] + side[1] / sl * w, c[2]]); ms.push(m);
    }
    g.ribbon(a, b, [0, 0, 1], red, redHot, (i) => [0.02, 0, 1, ms[i]], (i) => [0.02, 0, 1.4, ms[i]], true);   // part 1.0 on one edge, 1.4 on the other: the shader's rib
  };
  for (let i = 0; i < 8; i++) {
    const k = i / 7, ang = lerp(0.08, 1.2, k);
    ray([0.06 + 0.11 * k, half + 0.03 - 0.22 * k, 0], [Math.sin(ang), Math.cos(ang), (i % 2 ? 1 : -1) * 0.07], lerp(2.7, 1.3, k), 0.02, 0.13, [0.28, -0.1, (i % 3 - 1) * 0.14]);
  }
  for (const sz of [1, -1]) ray([-0.24, half - L * 0.07, sz * 0.04], [-0.36, -0.92, sz * 0.18], 2.6, 0.016, 0.17, [-0.22, 0.12, sz * 0.2]);
  return g.build();
}
// the giant squid: 7 m, mantle up, arms hanging
function squidGeometry(crimson) {
  const g = Geo();
  const red = crimson.clone().multiplyScalar(1.1), deep = crimson.clone().multiplyScalar(0.55), dark = new THREE.Color(0.005, 0.005, 0.01), pale = new THREE.Color(0.8, 0.82, 0.75);
  const mant = [[3.5, 0.02], [3.3, 0.14], [2.9, 0.25], [2.3, 0.31], [1.8, 0.29], [1.5, 0.25], [1.46, 0.2], [1.3, 0.2], [1.1, 0.17], [1.0, 0.13]];
  g.loft(mant.map(([y, r], i) => ({ c: [0, y, 0], ax: AX, az: AZ, rx: r * 1.3, rz: r * 1.2, a: [i / (mant.length - 1), 0, 0, 0], col: (t) => red.clone().lerp(deep, 0.5 + 0.5 * Math.sin(t * 3 + y * 5)) })), 10);
  for (const sx of [1, -1]) {
    const a = [], b = [];
    for (let i = 0; i <= 6; i++) { const k = i / 6, y = lerp(3.45, 2.5, k); a.push([sx * 0.12 * Math.sin(k * 3.14), y, 0]); b.push([sx * (0.12 + 0.36 * Math.sin(Math.pow(k, 0.8) * 3.14)), y, 0]); }
    g.ribbon(a, b, [0, 0, 1], red, deep, () => [0.1, 0, 0, 0], () => [0.1, 1, 0, 0]);
  }
  for (const sz of [1, -1]) g.disc([0, 1.2, sz * 0.262], [0, 0, sz], [1, 0, 0], [0, 1, 0], 0.13, dark, pale, [0.5, 0, 2, 0]);   // the largest eye of any animal: a dark pupil in a pale ring
  const arm = (ang, len, r0, r1, club, splay) => {
    const rings = [], n = len > 3 ? 14 : 8, dx = Math.cos(ang), dz = Math.sin(ang);
    for (let i = 0; i <= n; i++) {
      const k = i / n, m = k * len, out = 0.1 + splay * Math.sin(Math.min(k * 2.2, 1.57));
      const r = lerp(r0, r1, k) * (club && k > 0.82 ? 3.2 * Math.sin((k - 0.82) / 0.18 * 3.14) + 1 : 1);
      rings.push({ c: [dx * out, 1.02 - m, dz * out], ax: AX, az: AZ, rx: r, rz: r, a: [0.6, 0, 0, m], col: k > 0.5 ? deep : red });
    }
    g.loft(rings, 5, true);
  };
  for (let i = 0; i < 8; i++) arm((i / 8) * Math.PI * 2 + 0.2, 2.2 + 0.3 * (i % 2), 0.078, 0.013, false, 0.26);     // arms as thick as a wrist at the root: limbs, not hairs
  arm(1.2, 4.6, 0.032, 0.02, true, 0.1); arm(4.4, 4.4, 0.032, 0.02, true, 0.1);
  return g.build();
}
// the helmet jelly (Periphylla): a tall dome with a coronal groove and lappets, twelve stiff tentacles held forward
function helmetGeometry(crimson) {
  const g = Geo();
  const red = crimson.clone().multiplyScalar(1.2), deep = crimson.clone().multiplyScalar(0.5);
  const prof = [[0.56, 0.012, 0], [0.5, 0.1, 0.05], [0.38, 0.18, 0.2], [0.22, 0.235, 0.45], [0.12, 0.25, 0.6], [0.095, 0.215, 0.65], [0.05, 0.25, 0.8], [-0.04, 0.275, 0.92], [-0.13, 0.27, 1]];
  const rings = [];
  for (const [y, r, w] of prof) rings.push({ c: [0, y, 0], ax: AX, az: AZ, rx: r, rz: r, a: [w, w, 0, 0], col: (t) => deep.clone().lerp(red, w * (0.75 + 0.25 * Math.cos(t * 16))) });
  // the margin: sixteen LAPPETS, each a rounded tongue (eight segments, three rows: root, belly, tip) that cups 15
  // degrees inward toward its tip, with a narrow dark cleft between it and the next and a brighter free edge. (Four
  // segments and one row made a sawtooth of flat triangles: a paper crown.)
  const last = rings[rings.length - 1];
  g.loft(rings.slice(0, -1), 32);
  const NL = 128, rows = [[], [], []], cols = [[], [], []], cleft = deep.clone().multiplyScalar(0.55), edge = red.clone().multiplyScalar(1.45);
  for (let i = 0; i <= NL; i++) {
    const t = (i / NL) * Math.PI * 2, lobe = Math.pow(Math.abs(Math.sin(t * 8)), 0.55), ct = Math.cos(t), st = Math.sin(t);
    const r0 = 0.275, r1 = last.rx + 0.006 * lobe, r2 = last.rx - 0.034 * lobe;
    rows[0].push([ct * r0, -0.04, st * r0]); rows[1].push([ct * r1, -0.055 - 0.06 * lobe, st * r1]); rows[2].push([ct * r2, -0.062 - 0.125 * lobe, st * r2]);
    cols[0].push(red.clone().lerp(cleft, 0.5 * (1 - lobe))); cols[1].push(red.clone().lerp(cleft, 1 - lobe)); cols[2].push(edge.clone().lerp(cleft, 1 - lobe));
  }
  for (let k = 0; k < 2; k++) for (let i = 0; i < NL; i++) {
    const t = ((i + 0.5) / NL) * Math.PI * 2, n = [Math.cos(t), 0.1 - 0.35 * k, Math.sin(t)], w0 = 0.92 + 0.04 * k, w1 = 0.96 + 0.04 * k;
    const v0 = g.v(rows[k][i], n, cols[k][i], [w0, w0, 0, 0]), v1 = g.v(rows[k][i + 1], n, cols[k][i + 1], [w0, w0, 0, 0]), v2 = g.v(rows[k + 1][i], n, cols[k + 1][i], [w1, w1, 0, 0]), v3 = g.v(rows[k + 1][i + 1], n, cols[k + 1][i + 1], [w1, w1, 0, 0]);
    g.tri(v0, v1, v2); g.tri(v1, v3, v2);
  }
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * Math.PI * 2 + 0.13, dx = Math.cos(t), dz = Math.sin(t), tr = [];
    // each a limb with its own length, outward curve and sideways bend (they were twelve ruler-straight spokes)
    const h1 = Math.sin(i * 12.9898 + 4.1) * 43758.5453, r1 = h1 - Math.floor(h1), h2 = Math.sin(i * 78.233 + 1.7) * 24634.6345, r2 = h2 - Math.floor(h2);
    const len = 1.28 + 0.34 * r1, curl = 0.11 + 0.08 * r2, bend = (r1 - 0.5) * 0.32, droop = 0.05 + 0.1 * r2;
    for (let k = 0; k <= 7; k++) {
      const m = (k / 7) * len, out = 0.225 + 0.4 * m - curl * m * m, sd = bend * m * m;
      tr.push({ c: [dx * out - dz * sd, 0.1 + 0.92 * m - droop * m * m * m / len, dz * out + dx * sd], ax: AX, az: AZ, rx: lerp(0.016, 0.004, k / 7), rz: lerp(0.016, 0.004, k / 7), a: [0.6, 0.15, 0, m], col: k < 3 ? red : deep });
    }
    g.loft(tr, 3, true);
  }
  // true normals: the loft's own are radial (no slope along the axis), which shaded the dome as a cylinder with no
  // crown and no underside. (The shader turns every normal to the lens, so their sign does not matter.)
  const geo = g.build();
  geo.computeVertexNormals();
  return geo;
}

// ------------------------------------------------------------------------------------------------ the world
export default {
  id: 'longest-animal',
  name: 'The Longest Animal',
  category: 'ocean',
  weirdness: 0.25,
  media: ['underwater'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, bell = ctx.core.bell;
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3), mood = vary.mood ?? 0.5;
    const scene = new THREE.Scene();
    const col = (h) => new THREE.Color(h);
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

    // ---------------------------------------------------------------- LOOKS: the seeded moods and the hour
    // cast = the colony's colours, weather = snow and halo, figure = the scale figure beside the rim, fog = clarity
    // rolled independently (3 casts x 3 weathers x 3 figures x 2 coils), so two visits differ in more than one way
    const CASTS = ['ghost', 'gold', 'blue'];
    const WEATHERS = [
      { weather: 'blizzard, deep halo', snow: 1.35, haloR2: 24, haloK: 1.0, fog: 1.0, houses: 9 },
      { weather: 'a drift of mucus houses', snow: 0.9, haloR2: 11, haloK: 0.95, fog: 0.94, houses: 44 },
      { weather: 'thin snow, crisp halo', snow: 0.72, haloR2: 5, haloK: 1.25, fog: 0.84, houses: 7 },
    ];
    const FIGURES = ['pair', 'squid', 'oarfish'];
    const SNOW_TINT = { ghost: ['#c9c4e6', '#8e86c8'], gold: ['#d6d9e2', '#a0a8c0'], blue: ['#cfd6e6', '#93a2c4'] };   // gold keeps cool-grey snow for contrast; the rope's own light warms it
    const cast = CASTS[Math.min(2, Math.floor(rng() * 3))];
    const coil = rng.chance(0.6) ? 'open' : 'tight';        // the part's third coil ('tail') is not requested: its clearance to the descent line is unchecked
    const lr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:look'));
    const look = { cast, ...WEATHERS[Math.min(2, Math.floor(lr() * 3))], figure: FIGURES[Math.min(2, Math.floor(lr() * 3))], snowTint: SNOW_TINT[cast] };
    look.haloR2 *= lerp(0.75, 1.4, mood);                   // vary.mood: how deep the halo reaches into the snow
    const hourKey = vary.hour === 'dawn' || vary.hour === 'day' || vary.hour === 'night' ? vary.hour : 'dusk';
    const HOURS = {
      dusk: { glow: '#6E4FA6', deep: '#2B3FA8', gain: 1.0, reach: 1.0, fishSign: 1, pillar: 'fish' },
      dawn: { glow: '#8E3F84', deep: '#4A3F9C', gain: 1.0, reach: 1.0, fishSign: -1, pillar: 'fish' },
      day: { glow: '#2658CC', deep: '#1F48B8', gain: 1.3, reach: 0.85, fishSign: 1, pillar: 'salp' },
      night: { glow: PALETTE[2], deep: '#2B3FA8', gain: 0.0, reach: 1.0, fishSign: 1, pillar: 'fish' },
    };
    const H = HOURS[hourKey];
    const rare = !!vary.rare;

    // ---------------------------------------------------------------- hero placement
    // built flat (normal +Y, head on +Z); here: centre C, normal n, head toward the disc's low point
    const hero = await buildHero(ctx, { palette: PALETTE, cast: look.cast, coil, rare, startleAt: STARTLE_AT, farGlow: 0.22, dustDensity: clamp(density * look.snow, 0.6, 1.4) });
    await ctx.yield();
    const C = V3(CX, CY, CZ), nrm = V3(NX, NY, NZ).normalize();
    const headDir = V3(-73, -116, -83).sub(C); headDir.addScaledVector(nrm, -headDir.dot(nrm)).normalize();
    const heroM = new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(nrm, headDir).normalize(), nrm, headDir);
    hero.object.quaternion.setFromRotationMatrix(heroM);
    hero.object.position.copy(C);
    hero.object.scale.setScalar(HERO_K);
    scene.add(hero.object);
    hero.object.updateMatrixWorld(true);
    const toWorld = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const heroInv = new THREE.Matrix3().setFromMatrix4(heroM.clone().transpose()).multiplyScalar(1 / HERO_K);   // world -> the hero's own units
    const tight = hero.info.coil === 'tight';

    // ---------------------------------------------------------------- PATH (about 446 m, steepest 65 degrees, last 36 m straight)
    // The lens never comes nearer the stem than 1.05 m beside the head (which has no curtain) and 1.6 m anywhere else:
    //   the head    it comes down INBOARD of the head's tip (no crossing, so no kink), 1.6 m off and a little above the
    //               stem, and sinks beside the rope only where the curtain begins (HEAD: out, above at five points)
    //   the ride    from there to the high rim and round it (arm angle 0.95 to T_END) the lens flies BESIDE THE CURTAIN:
    //               SIDE metres from the curtain's plane on the eye's side and BELOW metres under the stem, half-way
    //               down the hanging threads, so the rope of bells runs across the top third of the frame, the curtain fills
    //               it from the right edge to the far left, and the bands of light overtake us along the cord
    //   the roll    still following the arm it rises past the bells and crosses over the rope 3 m above the stem
    //   the helix   see HELIX below: generated; one climbing left-hand turn round the galaxy and onto the disc's axis
    // rope(t, out, above): a point beside the stem at arm angle t, `out` metres outboard (negative: toward the eye) and
    // `above` metres along the disc normal, in the hero's own units. hang(t, side, below): the same in world metres and
    // with the world's gravity: `side` metres horizontally from the stem toward the eye, `below` metres under it (the
    // curtain hangs truly down, so `side` is the distance to the curtain). routeFor() is rebuilt by the guards below.
    const UP = V3(0, 1, 0);
    const rope = (t, out, above) => toWorld(hero.anchors.armInboard(t, -out, -above));
    const stemW = (t) => toWorld(hero.anchors.armPoint(t));
    const hang = (t, side, below) => {
      const s = stemW(t), h = V3(0, 0, 0).crossVectors(UP, stemW(t + 0.02).sub(stemW(t - 0.02))).normalize();
      if (h.dot(C.clone().sub(s)) < 0) h.negate();
      return s.addScaledVector(h, side).add(V3(0, -below, 0));
    };
    // THE HELIX (from the roll-over to the dive) is flown, not drawn: the route is integrated from a schedule of turn
    // rate and pitch, so its curvature is continuous and there is nothing to overshoot. From the rope it runs straight
    // for l1 metres, then climbs at about 31 degrees in ONE left-hand turn round the galaxy, up to 34 m from the disc's
    // axis and LOW (42 m above the disc at u 0.79, so the galaxy is still an oblique ellipse there and the gaze is
    // only 38 degrees down), stops turning l2 metres before the end, tips over through `over` metres and joins the
    // axis HELIX.axis metres above the eye. Its length is FIXED (so every landmark of the route keeps its fraction);
    // three numbers (the straight l1, the turn's end l2, the climb angle pc) are solved at build time so that the run
    // lands on the axis point for this visit's coil; whatever is left (centimetres) is spread evenly along the run.
    // lev: metres over which pc eases to pe.
    const HELIX = { len: 104.4, l1: 24, l2: 10, pc: 0.5, over: 40, pe: 0.5, lev: 16, axis: 36 };
    const yaw1 = Math.atan2(-nrm.x, -nrm.z), pitch1 = Math.asin(-nrm.y);
    const helixRun = (S0, yaw0, pitch0, P, keep, w0 = 0) => {
      const E = 0.22, ramp = (t) => { t = clamp(t, 0, 1); const v = 1 / (1 - E); return t < E ? 0.5 * v * t * t / E : t > 1 - E ? 1 - 0.5 * v * (1 - t) * (1 - t) / E : 0.5 * v * E + v * (t - E); };
      let dy = yaw1 - yaw0; while (dy < 0) dy += Math.PI * 2; while (dy > Math.PI * 2) dy -= Math.PI * 2;
      const N = 320, ds = P.len / N;
      // turn rate: none for the first l1 metres (the lens leaves the rope along its line), then one steady turn that
      // ends l2 metres before the join, eased in and out and scaled so that the whole turn is dy
      const rate = (d) => smoothstep(P.l1 - 6, P.l1 + 6, d) * (1 - smoothstep(P.len - P.l2 - 6, P.len - P.l2 + 6, d));
      let tot = 0; for (let i = 0; i < N; i++) tot += rate((i + 0.5) * ds) * ds;
      // the roll arrives still turning with the arm (w0 radians a metre): that turn dies away over the first 9 m
      const ease = (d) => w0 * (1 - smoothstep(0, 9, d));
      let pre = 0; for (let i = 0; i < N; i++) pre += ease((i + 0.5) * ds) * ds;
      const sc = (dy - pre) / Math.max(tot, 1e-6), p = S0.clone(), run = [];
      let yaw = yaw0;
      for (let i = 0; i < N; i++) {
        const d = (i + 0.5) * ds;
        yaw += (rate(d) * sc + ease(d)) * ds;
        const pit = pitch0 + (P.pc - pitch0) * ramp(d / 12) + (P.pe - P.pc) * ramp((d - (P.len - P.over - P.lev)) / P.lev) + (pitch1 - P.pe) * ramp((d - (P.len - P.over)) / P.over);
        p.x += Math.sin(yaw) * Math.cos(pit) * ds; p.z += Math.cos(yaw) * Math.cos(pit) * ds; p.y += Math.sin(pit) * ds;
        if (keep) run.push(p.clone());
      }
      return { run, miss: C.clone().addScaledVector(nrm, P.axis).sub(p) };
    };
    const helixFor = async (S0, yaw0, pitch0, step, w0) => {
      const P = { ...HELIX }, keys = ['l1', 'l2', 'pc'], h = [0.5, 0.5, 0.01], lim = [6, 6, 0.1], BND = [[2, 40], [-10, 60], [0.2, 0.86]], J = new THREE.Matrix3(), dv = V3(0, 0, 0);
      for (let it = 0; it < 30; it++) {
        if (it % 4 === 3) await ctx.yield();
        const m0 = helixRun(S0, yaw0, pitch0, P, false, w0).miss;
        if (m0.length() < 0.02) break;
        const c = [];
        for (let k = 0; k < 3; k++) { const Q = { ...P }; Q[keys[k]] += h[k]; c.push(helixRun(S0, yaw0, pitch0, Q, false, w0).miss.sub(m0).multiplyScalar(1 / h[k])); }
        J.set(c[0].x, c[1].x, c[2].x, c[0].y, c[1].y, c[2].y, c[0].z, c[1].z, c[2].z);
        if (Math.abs(J.determinant()) < 1e-9) break;
        dv.copy(m0).negate().applyMatrix3(J.invert());
        const dvv = [dv.x, dv.y, dv.z];
        for (let k = 0; k < 3; k++) P[keys[k]] = clamp(P[keys[k]] + clamp(dvv[k], -lim[k], lim[k]) * 0.6, BND[k][0], BND[k][1]);
      }
      const { run, miss } = helixRun(S0, yaw0, pitch0, P, true, w0), N = run.length, K = Math.round(P.len / step), pts = [];
      for (let k = 1; k < K; k++) { const x = k * N / K - 1, i = Math.min(N - 2, Math.floor(x)); pts.push(run[i].clone().lerp(run[i + 1], x - i).addScaledVector(miss, (x + 1) / N)); }   // evenly spaced: uneven points ripple the spline
      for (const f of [1, 0.72, 0.48, 0.24, 0]) pts.push(C.clone().addScaledVector(nrm, P.axis * f));
      return { pts, P, miss: miss.length() };
    };
    const T_END = 3.4, SIDE = 1.25, BELOW = 1.35;        // the ride ends at arm angle T_END; the lens beside the curtain
    // THE ROLL: four evenly spaced points over 1.2 rad of arm (about 18 m). [arm angle past T_END, metres further
    // inboard than the ride, metres the lens has RISEN IN THE WORLD since the ride's last point]: the arm falls away
    // on this side of the tilted disc, so the lens, rising by more at every step, comes up through the stem's level
    // 1.7 m inboard of it, then drifts out over the rope 4 to 8 m above it. The route's pitch only ever grows
    // through the roll and flows into the helix's climb
    const ROLL = [[0.3, 0.47, 0.5], [0.6, 0.3, 1.35], [0.9, -0.7, 2.7]], ROLL_S0 = [1.2, -2.7, 4.6];
    const HEAD = [0, 0, 0, 0, -1.15, 0.65, -1.35, 0.0, -1.6, -0.7];              // the head pass: (out, above) beside the bells at arm angle 0.14, 0.32 and 0.5 (the first four are unused)
    const IN = [[-21, -13], [-22, -25], [-23, -37], [-40, -50], [-70, -52]];        // the way in, backwards from there: [heading, pitch] in degrees of each step
    const routeFor = async (headUp, sideUp, step) => {
      const sd = SIDE + sideUp;
      // the pull-out from the descent is spread over 50 m and laid out BACKWARDS from the first point beside the bells
      // (headIn), each step a little steeper and a little further round to the right than the one after it, so that
      // heading and pitch only ever move one way: 13, 25, 37, 50 and 52 degrees down at headings -21 to -70. (It was
      // 53 to 25 degrees in one 5 m step with a right-left wiggle: the fastest turn of the route after the old roll.)
      const headIn = rope(0.14, HEAD[4] - headUp, HEAD[5] + 0.5 * headUp);
      const back = (from, len, hdg, pit) => { const h = hdg * Math.PI / 180, q = pit * Math.PI / 180; return from.clone().add(V3(-Math.sin(h) * Math.cos(q) * len, -Math.sin(q) * len, -Math.cos(h) * Math.cos(q) * len)); };
      const tipPt = back(headIn, 4.7, IN[0][0], IN[0][1]), in1 = back(tipPt, 4.5, IN[1][0], IN[1][1]), in0 = back(in1, 7.2, IN[2][0], IN[2][1]), in9 = back(in0, 14.6, IN[3][0], IN[3][1]), in8 = back(in9, 18.7, IN[4][0], IN[4][1]);
      const hand = [
        [0, 0, 0], [0, 0, -31], [0, -3, -62], [-6, -19, -81], [-20, -41, -97], in8, in9, in0, in1, tipPt,
        headIn, rope(0.32, HEAD[6] - headUp, HEAD[7]), rope(0.5, HEAD[8], HEAD[9]),
        hang(0.72, sd + 0.85, 0.7), hang(0.95, sd + 0.4, 1.1),
      ].map((p) => (p.isVector3 ? p : V3(p[0], p[1], p[2])));
      const ridePt = hand[hand.length - 1];
      for (let i = 0; i <= 8; i++) hand.push(hang(lerp(1.2, T_END, i / 8), sd + 0.4 * smoothstep(5, 8.5, i), BELOW - 0.35 * smoothstep(6, 8.3, i)));   // the last three ease inboard and begin to rise, making room to pass the stem
      const rideEndPt = hand[hand.length - 1];
      const y0 = hand[hand.length - 1].y, rollPt = ([dt, ds, up]) => { const q = hang(T_END + dt, sd + ds, 0); q.y = y0 + up; return q; };
      for (const r of ROLL) hand.push(rollPt(r));
      const S0 = rollPt(ROLL_S0), d0 = S0.clone().sub(hand[hand.length - 1]), dPrev = hand[hand.length - 1].clone().sub(hand[hand.length - 2]);
      let dPsi = Math.atan2(d0.x, d0.z) - Math.atan2(dPrev.x, dPrev.z); dPsi = clamp(Math.atan2(Math.sin(dPsi), Math.cos(dPsi)), 0, 0.4);
      const seg = d0.length(); d0.normalize();
      const helix = await helixFor(S0, Math.atan2(d0.x, d0.z) + 0.5 * dPsi, Math.asin(d0.y), step, dPsi / seg);
      await ctx.yield();
      const pth = makePath([...hand, S0, ...helix.pts]);
      await ctx.yield();
      // landmarks, as fractions of the route: the head's tip, where the ride settles beside the curtain, where it ends,
      // the lift-off (S0) and the join with the axis
      const at = (q) => { let best = 1e9, bu = 0; for (let i = 0; i <= 800; i++) { const d = pth.pointAt(i / 800, _cp).distanceToSquared(q); if (d < best) { best = d; bu = i / 800; } } return bu; };
      const mTip = at(tipPt), mRide = at(ridePt);
      await ctx.yield();
      pth.marks = { tip: mTip, ride: mRide, rideEnd: at(rideEndPt), lift: at(S0), join: 1 - helix.P.axis / pth.length, helix: helix.P, miss: helix.miss };
      return pth;
    };
    // CLEARANCE GUARD: from the head's tip to the lift-off, in steps of 0.001, the distance from the route to the stem
    // (at rest and breathed out 2%) must be at least 1.05 m beside the head and 1.6 m elsewhere; if not, the head
    // pass is moved up and inboard or the ride further from the curtain, and the route is built again
    const HEAD_T = 0.41, stemT = [], stemP = [], _cp = V3(0, 0, 0);
    for (let t = 0; t <= 6.4; t += 0.02) for (const breath of [1, 1.02]) {
      const p = hero.anchors.armPoint(t); p.x *= breath; p.z *= breath;
      stemT.push(t); stemP.push(toWorld(p));
    }
    const shortfall = async (pth) => {
      let head = 0, ride = 0, min = 1e9;
      const u0 = pth.marks.tip - 0.035, n = Math.round((pth.marks.lift + 0.03 - u0) / 0.001);
      for (let i = 0; i <= n; i++) {
        if (i % 40 === 39) await ctx.yield();
        pth.pointAt(u0 + i * 0.001, _cp);
        let best = 1e9, bt = 0;
        for (let k = 0; k < stemP.length; k++) { const d = stemP[k].distanceToSquared(_cp); if (d < best) { best = d; bt = stemT[k]; } }
        const d = Math.sqrt(best), miss = (bt < HEAD_T ? 1.05 : 1.6) - d;
        if (d < min) min = d;
        if (miss > 0) { if (bt < 0.6) head = Math.max(head, miss); else ride = Math.max(ride, miss); }
      }
      return { head, ride, min };
    };
    let topStep = 2.5, headUp = 0, sideUp = 0;
    let path = await routeFor(0, 0, topStep);
    await ctx.yield();
    let guard = await shortfall(path);
    for (let i = 0; i < 8 && (guard.head > 0 || guard.ride > 0); i++) {
      if (guard.head > 0) headUp += 0.15;
      if (guard.ride > 0) sideUp += 0.15;
      await ctx.yield();
      path = await routeFor(headUp, sideUp, topStep);
      await ctx.yield();
      guard = await shortfall(path);
    }
    await ctx.yield();
    // TOP GUARD: from the lift-off to the join, in steps of 0.001, the heading of the route must change by less than
    // 60 degrees per second and the bank term the engine uses (t0.z * t1.x - t0.x * t1.z, 14 m ahead) must never change
    // sign; if the spline ripples past either, the helix is sampled more finely and tried again
    const _ta = V3(0, 0, 0), _tb = V3(0, 0, 0);
    const topCheck = (pth) => {
      let rate = 0, lo = 1e9, hi = -1e9;
      const u0 = pth.marks.rideEnd - 0.02, n = Math.round((pth.marks.join - 0.004 - u0) / 0.001);
      for (let i = 0; i <= n; i++) {
        const u = u0 + i * 0.001;
        pth.tangentAt(u, _ta); pth.tangentAt(u + 0.001, _tb);
        rate = Math.max(rate, _ta.angleTo(_tb) * 180 / Math.PI / (0.001 * DURATION));
        pth.tangentAtDist(u * pth.length + 14, _tb);
        const turn = _ta.z * _tb.x - _ta.x * _tb.z;
        lo = Math.min(lo, turn); hi = Math.max(hi, turn);
      }
      return { rate, lo, hi, ok: rate < 56 && (lo >= 0 || hi <= 0) };
    };
    let topGuard = topCheck(path);
    for (let i = 0; i < 2 && !topGuard.ok; i++) {
      topStep *= 0.6;
      await ctx.yield();
      path = await routeFor(headUp, sideUp, topStep);
      await ctx.yield();
      guard = await shortfall(path); topGuard = topCheck(path);
    }
    const LEN = path.length, M = path.marks;
    // PACE: the flight lingers (0.64 of its speed) from the moment the lens settles beside the curtain until the gaze
    // has come to rest on the core after the roll-over, so the ride lasts as long as it deserves and the one big
    // swing of the gaze is slow; it stays at 0.8 over the top of the helix (the gaze pans across the galaxy there)
    // and takes the tip into the descent (u 0.10-0.235) at 0.7, where the lens turns down onto the galaxy: without
    // that dip the gaze yawed 52 degrees a second for 0.8 s. paceK is the engine's own normalisation (65 samples),
    // so realDt() is the true time.
    const PACE = { ride: 0.36, desc: 0.3, top: 0.2 };
    const paceDip = (u) => smoothstep(M.ride - 0.03, M.ride + 0.03, u) * (1 - smoothstep(M.lift + 0.075, M.lift + 0.135, u));
    const paceTop = (u) => smoothstep(M.lift + 0.075, M.lift + 0.135, u) * (1 - smoothstep(M.join - 0.015, M.join + 0.025, u));
    const paceDesc = (u) => smoothstep(0.10, 0.14, u) * (1 - smoothstep(0.195, 0.235, u));
    const pace = (u) => (1 - PACE.ride * paceDip(u) - PACE.top * paceTop(u)) * (1 - PACE.desc * paceDesc(u));
    let paceK = 0; for (let i = 0; i < 64; i++) paceK += 2 / (pace(i / 64) + pace((i + 1) / 64)) / 64;
    const realDt = (u, du) => du * DURATION / (pace(u) * paceK);      // seconds the lens takes over du at u
    path.guard = { min: guard.min, headUp, sideUp, topRate: topGuard.rate, topTurn: [topGuard.lo, topGuard.hi], topStep, marks: M };   // what the guards found (for the record; nothing reads it)
    path.stage = { hero, toWorld, C: V3(CX, CY, CZ), look };                                                                 // the cast of this visit (for the record; nothing reads it)
    await ctx.yield();
    // The descent was laid out and scripted on a route 459.73 m long; this one differs by a few metres. U(old) turns
    // one of the descent's old fractions into this route's (the same metre of water); update() goes the other way.
    const OLD_LEN = 459.73, U = (old) => old * OLD_LEN / LEN;

    // ---------------------------------------------------------------- POIS (the gaze)
    // beside the curtain the gaze rests on the rope a few metres ahead (a point sliding along the stem, lowered into
    // the curtain): the rope then runs from the top right corner through the middle of the frame and away to the left
    // as the arm curls, with the curtain hanging from all of it
    const armPts = [];
    for (let i = 0; i <= 72; i++) armPts.push(toWorld(hero.anchors.armPoint(0.05 + (i / 72) * 5.0)));
    const _ap = V3(0, 0, 0), _ab = V3(0, 0, 0), _aq = V3(0, 0, 0);
    const stemNear = (dist, out) => {
      path.posAtDist(dist, _ap);
      let best = 1e9;
      for (let i = 0; i < armPts.length - 1; i++) {
        _ab.subVectors(armPts[i + 1], armPts[i]);
        const k = clamp(_aq.subVectors(_ap, armPts[i]).dot(_ab) / Math.max(_ab.lengthSq(), 1e-6), 0, 1);
        _aq.copy(armPts[i]).addScaledVector(_ab, k);
        const d = _aq.distanceToSquared(_ap);
        if (d < best) { best = d; out.copy(_aq); }
      }
      return out;
    };
    // arc length (the hero's metres from the head) of the stem beside the lens at u
    const lensS = (u) => {
      path.pointAt(u, _ap);
      let best = 1e9, bt = 0;
      for (let i = 0; i < armPts.length - 1; i++) {
        _ab.subVectors(armPts[i + 1], armPts[i]);
        const k = clamp(_aq.subVectors(_ap, armPts[i]).dot(_ab) / Math.max(_ab.lengthSq(), 1e-6), 0, 1);
        const d = _aq.copy(armPts[i]).addScaledVector(_ab, k).distanceToSquared(_ap);
        if (d < best) { best = d; bt = 0.05 + (i + k) / 72 * 5.0; }
      }
      return hero.armS(bt);
    };
    // ONE sliding point carries the gaze from the last of the descent to the dive, so nothing ever snaps: the galaxy's
    // core; then (as the lens comes down on the head) the swimming bells 4 m ahead of it; then, beside the curtain,
    // the rope 5.6 m ahead lowered 0.6 m into the threads; then THE SWING to the core.
    const _sl = V3(0, 0, 0), _sd = V3(0, 0, 0);
    const ez = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1), E = PANS.E, v = 1 / (1 - E); return t < E ? 0.5 * v * t * t / E : t > 1 - E ? 1 - 0.5 * v * (1 - t) * (1 - t) / E : 0.5 * v * E + v * (t - E); };
    const PANS = { E: 0.25, l: 24, r: 24, a0: 0.725, a1: 0.775, b0: 0.787, b1: 0.855, c0: 0.872, c1: 0.912 };
    const ropeAim = (u, out) => {
      const a = smoothstep(M.tip - 0.004, M.tip + 0.045, u);
      stemNear(u * LEN + lerp(4.2, 5.6, a), out); out.y -= 0.6 * a;
      return out.lerp(C, 1 - smoothstep(M.tip - 0.075, M.tip - 0.004, u));
    };
    // THE SWING is flown, not blended: from SWING.a the gaze's heading and pitch are integrated at build time as a
    // pursuit of the bearing to the core, never turning faster than SWING.cap degrees a second of real time (the pace
    // above included) and never changing its rate faster than SWING.acc, so the gaze leaves the rope and settles on
    // the core in ONE unhurried turn to the left, the same hand as the route. The table runs to SWING.b; from there
    // the gaze is the core itself. (Blending the two aim points instead swung the gaze 240 degrees in 4.6 s.)
    const SWING = { a: M.rideEnd - 0.08, b: M.lift + 0.15, du: 0.0005, cap: 37, acc: 22, capP: 14, accP: 16, gain: 1.6, H: null, P: null, end: 0 };
    {
      const hOf = (v) => Math.atan2(v.x, v.z) * 180 / Math.PI, pOf = (v) => Math.asin(clamp(v.y / Math.max(v.length(), 1e-6), -1, 1)) * 180 / Math.PI;
      const toC = (u, out) => out.copy(C).sub(path.pointAt(u, _ap));
      const toRope = (u, out) => { ropeAim(u, out); return out.sub(path.pointAt(u, _ap)); };
      const n = Math.round((SWING.b - SWING.a) / SWING.du), H = new Float32Array(n + 1), P = new Float32Array(n + 1), du = SWING.du;
      const wrap = (d) => { d = ((d + 60) % 360 + 360) % 360 - 60; return d; };            // the long way round is to the LEFT
      let G = hOf(toRope(SWING.a, _sd)), Pg = pOf(_sd);
      const dt0 = realDt(SWING.a, du);
      let r = wrap(G - hOf(toRope(SWING.a - du, _sd))) / dt0, rp = (Pg - pOf(_sd)) / dt0, hPrev = hOf(toC(SWING.a - du, _sd)), pPrev = pOf(_sd);
      r = clamp(r, 0, SWING.cap);
      SWING.end = SWING.b;
      for (let i = 0; i <= n; i++) {
        const u = SWING.a + i * du, dt = realDt(u, du);
        const hC = hOf(toC(u, _sd)), pC = pOf(_sd);
        const ff = wrap(hC - hPrev) / dt, ffP = (pC - pPrev) / dt; hPrev = hC; pPrev = pC;
        H[i] = G; P[i] = Pg;
        const err = wrap(hC - G), errP = pC - Pg;
        const want = clamp(ff + SWING.gain * err, 0, SWING.cap), wantP = clamp(ffP + SWING.gain * errP, -SWING.capP, SWING.capP);
        r += clamp(want - r, -SWING.acc * dt, SWING.acc * dt); rp += clamp(wantP - rp, -SWING.accP * dt, SWING.accP * dt);
        G += r * dt; Pg += rp * dt;
      }
      SWING.H = H; SWING.P = P;
      SWING.miss = [wrap(hOf(toC(SWING.b, _sd)) - G), pOf(_sd) - Pg];      // what is left at the table's end (for the record)
    }
    await ctx.yield();
    const slideAt = (time, u) => {
      if (u < SWING.a) return ropeAim(u, _sl);
      path.pointAt(u, _ap);
      _sd.copy(C).sub(_ap).normalize();
      if (u < SWING.b) {
        const x = (u - SWING.a) / SWING.du, i = Math.min(SWING.H.length - 2, Math.floor(x)), f = x - i;
        const h = lerp(SWING.H[i], SWING.H[i + 1], f) * Math.PI / 180, pt = lerp(SWING.P[i], SWING.P[i + 1], f) * Math.PI / 180;
        _sl.set(Math.sin(h) * Math.cos(pt), Math.sin(pt), Math.cos(h) * Math.cos(pt));
        _sd.lerp(_sl, 1 - smoothstep(SWING.b - 0.03, SWING.b, u)).normalize();
      }
      // THE HELIX'S PAN: the gaze does not sit on the core all the way up. It eases PANS.l degrees to the right of it
      // (the galaxy in the left third, the scale figure on the right at u 0.79), swings across between u 0.787 and
      // 0.855 to PANS.r degrees left of it (the galaxy in the right third, helmet and comb jellies at arm's length on
      // the left at u 0.84-0.87) and comes back onto the core as the route tips over, so the disc returns to the
      // centre fresh for the dive. The angles are TRUE screen angles: the gaze is turned about the vertical by
      // asin(sin(pan) / cos(pitch)) and re-pitched so that the core stays on the frame's horizontal axis (turning the
      // aim about the vertical alone showed half of it, the gaze being 40-60 degrees down). ez: an eased ramp whose
      // peak rate is 1.33 times its mean, so the swing stays under 38 degrees a second of yaw (29 steady).
      const pan = (PANS.l * smoothstep(PANS.a0, PANS.a1, u) - (PANS.l + PANS.r) * ez(PANS.b0, PANS.b1, u) + PANS.r * ez(PANS.c0, PANS.c1, u)) * Math.PI / 180;
      if (pan !== 0) {
        const ch = Math.max(Math.hypot(_sd.x, _sd.z), 1e-3), dpsi = Math.asin(clamp(Math.sin(pan) / ch, -0.97, 0.97));
        const ty = _sd.y / ch / Math.cos(dpsi), psi = Math.atan2(_sd.x, _sd.z) - dpsi, cp = 1 / Math.hypot(1, ty);
        _sd.set(Math.sin(psi) * cp, ty * cp, Math.cos(psi) * cp);
      }
      return _sl.copy(_ap).addScaledVector(_sd, 16);
    };
    // The steady camera (reduced motion) takes a third of each weight and looks 48 m down the route, so one point of
    // interest cannot hold a subject for it. The descent and the slide therefore repeat theirs: together they hold the
    // sweeping gaze on the point and bring the steady gaze most of the way to it.
    const pois = [];
    for (let i = 0; i < 3; i++) pois.push({ at: C, from: U(0.13), to: M.tip - 0.006, weight: 0.65, fade: 0.2 });               // the descent: hold the galaxy's core
    for (let i = 0; i < 5; i++) pois.push({ at: slideAt, from: M.tip - 0.11, to: M.join + 0.012, weight: 0.9, fade: 0.06 });   // head, ride, helix: the sliding point
    const _g0 = V3(0, 0, 0), _g1 = V3(0, 0, 0), _g2 = V3(0, 0, 0);
    // the engine's gaze, reproduced so staged animals can be put where the lens will be looking
    const gazeAt = (u, out, calm = 0) => {
      path.pointAt(u, _g0); path.posAtDist(u * LEN + 14 * (1 + 2.4 * calm), _g1);
      out.subVectors(_g1, _g0).normalize();
      if (calm > 0) { out.y *= 1 - 0.45 * calm; out.normalize(); }
      const guard = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
      for (const poi of pois) {
        const w = bell(u, poi.from, poi.to, poi.fade) * poi.weight * guard * (1 - 0.65 * calm);
        if (w <= 0.001) continue;
        _g2.copy(typeof poi.at === 'function' ? poi.at(0, u) : poi.at).sub(_g0).normalize();
        out.multiplyScalar(1 - w).addScaledVector(_g2, w).normalize();
      }
      return out;
    };
    // a point in the frame at u: metres ahead along the gaze, to the right and up
    const stage = (u, ahead, sx, sy, calm = 0) => {
      const g = gazeAt(u, V3(0, 0, 0), calm), p = path.pointAt(u), right = V3(0, 0, 0).crossVectors(g, UP).normalize(), upv = V3(0, 0, 0).crossVectors(right, g);
      return p.addScaledVector(g, ahead).addScaledVector(right, sx).addScaledVector(upv, sy);
    };
    // the same in TRUE screen axes: with the engine's bank, which at a steep downward gaze rolls the picture by up to
    // 25 degrees (the helix's foreground is staged with this one; everything staged before it keeps stage())
    const frameB = (u) => {
      const g = gazeAt(u, V3(0, 0, 0)), right = V3(0, 0, 0).crossVectors(g, UP).normalize();
      path.tangentAt(u, _g0); path.tangentAtDist(u * LEN + 14, _g1);
      const bank = clamp(-(_g0.z * _g1.x - _g0.x * _g1.z) * 0.55, -0.28, 0.28) * BANK;
      const upv = V3(0, 1, 0).addScaledVector(right, bank); upv.addScaledVector(g, -upv.dot(g)).normalize();
      right.crossVectors(g, upv);
      return { g, right, upv };
    };
    const stageB = (u, ahead, sx, sy) => { const f = frameB(u); return path.pointAt(u).addScaledVector(f.g, ahead).addScaledVector(f.right, sx).addScaledVector(f.upv, sy); };
    // a direction given in that frame (right, up, toward the lens): the way a staged animal's crown points
    const dirB = (u, x, y, z) => { const f = frameB(u); return V3(0, 0, 0).addScaledVector(f.right, x).addScaledVector(f.upv, y).addScaledVector(f.g, -z).normalize(); };
    // ... nudged until it is `min` metres clear of the route and 8 m off the dive line
    const diveGap = (p) => { const k = clamp(p.clone().sub(C).dot(nrm), 0, 46); return p.distanceTo(C.clone().addScaledVector(nrm, k)); };   // the dive is the axis's lowest 36 m (and 10 m of margin above the join)
    const pushOff = (p, min, gap = 8) => {
      const f = (x, y, z) => Math.min(path.distanceTo(x, y, z) - min, diveGap(_g2.set(x, y, z)) - gap);
      for (let i = 0; i < 24 && f(p.x, p.y, p.z) < 0; i++) {
        const gx = f(p.x + 0.4, p.y, p.z) - f(p.x - 0.4, p.y, p.z), gy = f(p.x, p.y + 0.4, p.z) - f(p.x, p.y - 0.4, p.z), gz = f(p.x, p.y, p.z + 0.4) - f(p.x, p.y, p.z - 0.4);
        const gl = Math.hypot(gx, gy, gz) || 1;
        p.x += gx / gl * 0.6; p.y += gy / gl * 0.6; p.z += gz / gl * 0.6;
      }
      return p;
    };

    // THE SCALE FIGURE hangs inside the helix, where the lens is looking at u 0.79: FIG_OFF metres off (14-15 m: at
    // 9 m it crossed the whole frame in a second) and 24 degrees to the right of the gaze, so with the helix's pan it
    // stands BESIDE the galaxy (the disc in the left third, the animal 45% of the frame's height on the right)
    // from u 0.77 to 0.80, sinks out of the bottom of the frame as the pan swings (u 0.82) and is a small figure low
    // on the left, 22-28 m off, at u 0.84-0.87: the helix's foreground is staged clear of it. figAxis: the way its
    // head points (up, leaning toward the disc's axis).
    M.fig = 0.79;
    const FIG_LEAN = look.figure === 'squid' ? 0.22 : 0.5, FIG_HALF = look.figure === 'squid' ? 4.8 : 4.0;
    const FIG_OFF = look.figure === 'squid' ? 15 : 14;
    const Pf = path.pointAt(M.fig);
    const figAxis = (c) => { const h = C.clone().sub(c); h.y = 0; h.normalize(); return V3(0, Math.cos(FIG_LEAN), 0).addScaledVector(h, Math.sin(FIG_LEAN)); };
    const figClear = (c, min) => { const ax = figAxis(c); for (let k = -FIG_HALF; k <= FIG_HALF + 0.01; k += FIG_HALF / 8) if (path.distanceTo(c.x + ax.x * k, c.y + ax.y * k, c.z + ax.z * k) < min) return false; return true; };
    const figAt = (off) => stage(M.fig, off, off * 0.45, -0.02 * off);
    let figPos = figAt(FIG_OFF);
    for (let d = 0.4; d < 6 && !figClear(figPos, 8.2); d += 0.4) figPos = figAt(FIG_OFF + d);

    await ctx.yield();
    // ---------------------------------------------------------------- ENV: shared uniforms; depth drives dome, key and FOG
    const surf = hero.colors.glow.clone().lerp(col(PALETTE[4]), 0.6).multiplyScalar(1.3);   // the colony's light on surfaces: blue-white
    const raysU = { value: 0 }, shaftU = { value: 1 };
    // THE COLONY'S GLOW IN THE WATER (domeCol): scene-linear colours of its wide lobe and of the tighter blue one. They
    // look grey here; the grade crushes the first 0.04 of every channel, so what is left on screen is indigo, about
    // (30, 28, 72) at 20 degrees from the galaxy, (11, 9, 56) at 42, luminance under 4 of 255 from 48 and black by
    // 70-75, on every cast (the green channel, which carries the luminance, is the same 0.053 on all three). DEEP_K
    // scales its reach. update() brings it up from the lift-off and draws it in for the dive (deepGlow).
    const DEEP_K = 0.905, DEEP = { blue: [[0.052, 0.053, 0.066], [0, 0.002, 0.018]], ghost: [[0.0545, 0.053, 0.066], [0.003, 0, 0.018]], gold: [[0.052, 0.053, 0.07], [0.001, 0.001, 0.02]] }[look.cast];
    const deepA = new THREE.Color(...DEEP[0]).multiplyScalar(DEEP_K), deepB = new THREE.Color(...DEEP[1]).multiplyScalar(DEEP_K);
    const env = {
      uDeepDir: { value: V3(0, -1, 0) }, uDeepCol: { value: new THREE.Color(0, 0, 0) }, uDeepCol2: { value: new THREE.Color(0, 0, 0) }, uRays: raysU, uShaft: shaftU,
      uGlowCol: { value: new THREE.Color() }, uMidCol: { value: new THREE.Color() }, uLowCol: { value: col(PALETTE[0]) }, uKeyCol: { value: new THREE.Color() },
      uColonyCol: { value: surf }, uColonyPos: { value: C.clone() }, uGlowK: { value: 0.17 }, uFogD: { value: 0.012 }, uColonyI: { value: 1.6 }, uColonyR2: { value: 700 }, uEntry: { value: 1 },
      uTime: { value: 0 }, uPxScale: { value: 400 },
    };
    const glowA = col(H.glow).offsetHSL((mood - 0.5) * 0.05, 0, 0), glowB = col(H.deep), indigo = col(PALETTE[1]), low = col(PALETTE[0]);
    const fog = new THREE.FogExp2(0x000000, 0.012);
    scene.fog = fog;
    const GLOW_GAIN = 3.0, KEY_GAIN = 2.4, MID_GAIN = 0.8, entryBoost = { value: 1 };
    function setDepth(u) {
      const D = depthAt(u), Dg = 120 + (D - 120) * H.reach;
      // seen through the previous world's portal (u = 0) and for the first two seconds the eye is still wide open:
      // the glow overhead reaches down to the level gaze as a violet cap over indigo (uEntry, in domeCol) and the
      // pillar's core is shown 4x brighter, all easing to the true values by u 0.05
      const eb = 1 - smoothstep(0, 0.05, u);
      entryBoost.value = eb; env.uEntry.value = 1 - smoothstep(0, 0.022, u);      // the cap itself is gone within a second
      const gs = table(Dg, [[120, 1], [300, 0.3], [450, 0.06], [550, 0]]) * H.gain * (1 + 0.5 * eb);
      const blue = smoothstep(120, 420, Dg);
      env.uGlowCol.value.copy(glowA).lerp(glowB, blue).multiplyScalar(GLOW_GAIN * gs);
      env.uKeyCol.value.copy(glowA).lerp(glowB, blue).multiplyScalar(KEY_GAIN * gs / (1 + 0.3 * eb));
      env.uGlowK.value = lerp(0.3, 0.045, smoothstep(120, 520, Dg)) + 0.06 * eb;
      const amb = table(Dg, [[120, 1], [300, 0.34], [450, 0.08], [560, 0]]) * (H.gain > 0 ? Math.min(H.gain, 1.1) : 0.1);
      env.uMidCol.value.copy(indigo).multiplyScalar(amb * MID_GAIN * (1 + 0.4 * eb)).add(low);
      env.uFogD.value = lerp(0.012, 0.009, smoothstep(120, 620, D)) * look.fog;      // FOG density 0.012 -> 0.009
      fog.density = env.uFogD.value;
      fog.color.copy(env.uMidCol.value);                                             // FOG colour indigo -> black
      raysU.value = lerp(0.45, 1, smoothstep(0.05, 0.14, u)) * (1 + 1.3 * smoothstep(150, 300, Dg));   // shafts: shy in the entry, held up as the glow thins
      shaftU.value = 1 - smoothstep(0.15, 0.21, u);                                                    // ... and melted into even water by 10 s
    }
    setDepth(0);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 20), new THREE.ShaderMaterial({
      uniforms: { ...env }, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.renderOrder = -1; dome.frustumCulled = false;
    scene.add(dome);
    const quad = quadGeometry();
    const photo = col(PALETTE[3]).lerp(col(PALETTE[4]), 0.18);          // photophore blue

    // ---------------------------------------------------------------- motes: snow, pillar points, copepods, sparks
    const streakU = { value: V3(0, 0, 0) };
    const haloU = { uB2: { value: tight ? 0.0789 : 0.1346 }, uT1: { value: tight ? Math.PI * 4 : 9.23 }, uHaloR2: { value: look.cast === 'gold' ? Math.min(look.haloR2, 8) : look.haloR2 }, uHaloK: { value: look.haloK * (look.cast === 'gold' ? 1.35 : 1.05) } };
    // gold: the colony's wide haze is the water's indigo (see the part), so its warmth is carried here: flakes lit warm
    // white within a few metres of the rope (reach capped at 8), which reads as light where an amber haze read as tan
    const haloCol = look.cast === 'gold' ? new THREE.Color(1.0, 0.7, 0.36).multiplyScalar(3.0) : hero.colors.glow, HALO_K = haloU.uHaloK.value;
    // gold's light is three times as luminous as the same amount of blue, so its flakes far from the rope were bright
    // grey-white and out-shouted it: they take 45% of the colony's broad light, and the warm pool beside the rope
    // (the halo term above) is what lights them
    const BROAD = look.cast === 'gold' ? 0.45 : 1;
    const makeMotes = async (count, fill, o) => {
      const base = new Float32Array(count * 3), data = new Float32Array(count * 4), p = [0, 0, 0], d = [0, 0, 0, 0];
      for (let i = 0; i < count; i++) { fill(i, p, d); base.set(p, i * 3); data.set(d, i * 4); if (i % 2500 === 2499) await ctx.yield(); }
      const uniforms = {
        ...env, ...haloU, uStreak: o.streak === false ? { value: V3(0, 0, 0) } : streakU,
        uCenter: { value: (o.center || V3(0, 0, 0)).clone() }, uBox: { value: (o.box || V3(1, 1, 1)).clone() }, uOffset: { value: V3(0, 0, 0) },
        uColA: { value: col(o.colA || '#ffffff') }, uColB: { value: col(o.colB || o.colA || '#ffffff') }, uSelf: { value: o.self || new THREE.Color(0, 0, 0) },
        uHeroPos: { value: C }, uHaloCol: { value: haloCol }, uHeroInv: { value: heroInv },
        uWrap: { value: o.box ? 1 : 0 }, uMinPx: { value: o.minPx ?? 1.1 }, uGain: { value: o.gain ?? 1 }, uLit: { value: o.lit ?? 1 }, uBlink: { value: o.blink ?? 0 },
        uDart: { value: o.dart ?? 0 }, uTwinkle: { value: o.steady ? 0 : 1 }, uBroad: { value: BROAD }, uFar: { value: o.far ?? 0 }, uMinE: { value: o.minE ?? 0.3 }, uNear: { value: new THREE.Vector2(...(o.near || [0.35, 1.4])) },
        uBandPos: hero.uniforms.uBandPos, uBandGap: hero.uniforms.uBandGap, uOwnS: hero.uniforms.uOwnS, uOwnAmp: hero.uniforms.uOwnAmp, uTop: { value: o.top || V3(0, 1, 0) },
      };
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
      const mesh = new THREE.Mesh(instancedGeo(quad, count, { iBase: [base, 3], iData: [data, 4] }), mat);
      mesh.frustumCulled = false; mesh.renderOrder = o.order ?? 10;
      scene.add(mesh);
      return { mesh, u: uniforms };
    };
    const snowAmt = density * look.snow * detail;
    const SNOW_GAIN = look.cast === 'gold' && look.snow > 1.2 ? 0.7 : 1;        // gold in a blizzard: bright grey flakes out-shouted the pearl rope
    const snowFill = (box) => (i, p, d) => {
      p[0] = rng.range(-0.5, 0.5) * box.x; p[1] = rng.range(-0.5, 0.5) * box.y; p[2] = rng.range(-0.5, 0.5) * box.z;
      const k = rng();
      d[0] = 0.008 + 0.04 * k * k * k; d[1] = rng(); d[2] = rng.range(0.45, 1); d[3] = rng.chance(0.16) ? rng.range(0.6, 1.6) : 0;
    };
    const snowSelf = new THREE.Color(0.1, 0.13, 0.25);
    const boxA = V3(38, 30, 38), boxB = V3(84, 44, 84);
    // 1) snow that travels with the lens: streaks up in the descent, falls inside the halo
    const snowA = await makeMotes(Math.round(8200 * snowAmt), snowFill(boxA), { box: boxA, colA: look.snowTint[0], colB: look.snowTint[1], self: snowSelf, minE: 0.55, minPx: 1.2 });
    await ctx.yield();
    // 2) snow standing in the colony's own water, lit by the arm (the halo is this, not a sprite)
    const snowB = await makeMotes(Math.round(6200 * snowAmt), snowFill(boxB), { box: boxB, center: C, colA: look.snowTint[0], colB: look.snowTint[1], self: snowSelf.clone().multiplyScalar(0.6), minE: 0.5, minPx: 1.2, gain: SNOW_GAIN });
    await ctx.yield();

    // 3) the pillar on the path at z = -75: 14 m wide, 130 m tall, so it runs out of the top of the first frame; its top
    // third thins into scattered rising points. Dusk, dawn, night: lanternfish; day: a salp chain
    const pillarC = V3(-2 + (mood - 0.5) * 3, 8, -75), fishPillar = H.pillar === 'fish', PILLAR_H = 130;     // vary.mood slides the pillar across the path
    const pillarGlow = col(PALETTE[3]).lerp(col(PALETTE[4]), 0.05).multiplyScalar(3.9);
    const pr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:pillar'));   // its own stream: the rest of the world keeps its draws
    const pillar = await makeMotes(Math.round((fishPillar ? 4700 : 650) * clamp(density, 0.8, 1.2) * detail), (i, p, d) => {
      const r = 7.5 * Math.pow(pr(), 0.56) * (pr() < 0.3 ? 1 + 0.9 * pr() : 1), a = pr.range(0, 6.2832);   // three in ten stray up to twice as far out: no hard edge
      p[0] = pillarC.x + Math.cos(a) * r; p[1] = pillarC.y + pr.range(-65, 65); p[2] = pillarC.z + Math.sin(a) * r;
      d[0] = 0.075; d[1] = pr(); d[2] = pr.range(0.3, 1); d[3] = 0.3;
    }, { box: V3(400, PILLAR_H, 400), center: pillarC, self: pillarGlow, lit: 0, minPx: 1.25, minE: 0.45, near: [3, 9], streak: false, blink: 0.25, top: V3(12, 68, 1) });
    await ctx.yield();
    const topFade = (y) => 1 - smoothstep(6, 52, y);            // the soft light inside the column dies upward with no edge
    const haze = await makeMotes(38, (i, p, d) => {
      p[0] = pillarC.x + pr.range(-2.6, 2.6); p[1] = -56 + (i / 37) * 108; p[2] = pillarC.z + pr.range(-0.8, 0.8);
      d[0] = pr.range(14, 25); d[1] = pr(); d[2] = pr.range(0.85, 1.05) * topFade(p[1]); d[3] = 0;
    }, { self: col(PALETTE[3]).multiplyScalar(fishPillar ? 0.028 : 0.01), lit: 0, minE: 1, near: [7, 30], streak: false, order: 2, steady: 1 });
    // seen from the entry (and through the previous world's portal) the column also carries a soft core of light;
    // at night, with no glow behind it, the core is halved and the points carry the column
    const pillarCore = await makeMotes(30, (i, p, d) => {
      p[0] = pillarC.x + pr.range(-2.4, 2.4); p[1] = -56 + (i / 29) * 108; p[2] = pillarC.z + pr.range(-0.6, 0.6);
      d[0] = pr.range(12, 23); d[1] = pr(); d[2] = pr.range(0.85, 1.05) * topFade(p[1]); d[3] = 0;
    }, { self: col(PALETTE[3]).multiplyScalar((fishPillar ? 0.3 : 0.05) * (hourKey === 'night' ? 0.5 : 1)), lit: 0, minE: 1, near: [36, 80], streak: false, order: 2, steady: 1 });
    for (let i = 0, n = (Math.round((fishPillar ? 3600 : 500) * clamp(density, 0.8, 1.2) * detail) + 60) * 5; i < n; i++) rng();
    await ctx.yield();
    // THE PILLAR'S NEAR FACE IS FISH: seen from the entry the column was a soft band of round specks, a particle effect.
    // A third of the specks are gone (the last third of the list: they are scattered evenly) and in front of the
    // rest, on the side of the column turned to the entry, rise some 430 lanternfish drawn as upright fish (PFISH):
    // 300 dashes on the column's skin, 130 larger ones at its two edges, where they stand against darker water and
    // body, forked tail and belly lights resolve, and 70 stragglers peeling off each edge toward the lens in loose
    // twos and threes. Their size is an angle (6-10 px of a 450 px frame on the skin, 12-20 px at the edges)
    // while the lens is far; inside 18 m they fade and the modelled fish (fishA, fishC) are the column. Own stream.
    let pfish = null;
    if (fishPillar) {
      pillar.mesh.geometry.instanceCount = Math.round(pillar.mesh.geometry.instanceCount * 0.67);
      const fr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:pfish'));
      const NF = Math.round(300 * clamp(density, 0.8, 1.2) * detail), NE = Math.round(130 * detail), NS = 70, n = NF + NE + NS, base = new Float32Array(n * 3), data = new Float32Array(n * 4);
      let grp = 0, gA = 0, gR = 0, gY = 0, gJ = 0, gSeed = 0;
      for (let i = 0; i < n; i++) {
        let x, y, z, len, br, sd = -1;
        if (i < NF) {                 // the column's near skin: dashes 5-8 px long (of 360)
          const a = fr.range(-1.95, 1.95), r = fr() < 0.65 ? fr.range(5.2, 8.8) : fr.range(1.5, 6);
          x = Math.sin(a) * r; z = Math.cos(a) * r; y = fr.range(-65, 65);
          len = lerp(1.0, 1.6, fr()); br = fr.range(0.7, 1.1);
        } else if (i < NF + NE) {     // its two edges, against darker water: fish 10-16 px long, body, tail and beads resolved
          const side = fr() < 0.5 ? 1 : -1, a = side * fr.range(0.9, 1.8), r = fr.range(6.6, 10.5);
          x = Math.sin(a) * r; z = Math.cos(a) * r; y = fr.range(-65, 65);
          len = lerp(2.0, 3.2, fr()); br = fr.range(0.85, 1.15);
        } else {                      // stragglers peeling off toward the lens: loose twos and threes at uneven spacing, of every size
          // (they left in two evenly spaced files of seven, a chevron of identical dashes). A group shares an angle,
          // a distance out and a height, each jittered by a third, and nearly one pace of rise (seeds 0.013 apart),
          // so it stays a group; one fish in eight is 25-30 px long and shows its row of beads
          if (grp === 0) { grp = fr() < 0.45 ? 3 : 2; const side = fr() < 0.5 ? 1 : -1; gJ = 6.5 * Math.pow(fr(), 1.4); gA = side * (1.45 - 0.08 * gJ) * fr.range(0.7, 1.3); gR = (9.6 + 2.1 * gJ) * fr.range(0.8, 1.3); gY = fr.range(-65, 65); gSeed = fr(); }
          grp--;
          const a = gA + fr.range(-0.08, 0.08), r = gR + fr.range(-1.2, 1.2);
          x = Math.sin(a) * r; z = Math.cos(a) * r; y = gY + fr.range(-2.4, 2.4);
          len = Math.min((2.0 + 3.0 * Math.pow(fr(), 1.5)) * (1 + 0.03 * gJ), 4.9); br = fr.range(0.85, 1.2);
          sd = (gSeed + 0.013 * grp) % 1;
        }
        base.set([pillarC.x + x, pillarC.y + y, pillarC.z + z], i * 3); data.set([len, sd < 0 ? fr() : sd, br, 0], i * 4);
      }
      const uniforms = { ...env, uCenter: { value: pillarC.clone() }, uNear: { value: new THREE.Vector2(9, 18) }, uWrapH: { value: new THREE.Vector2(PILLAR_H, PILLAR_H) }, uRise: { value: 0 }, uGain: { value: 1 },
        uAng: { value: 0.0083 }, uSign: { value: H.fishSign }, uPhoto: { value: photo.clone().multiplyScalar(2.6) }, uBodyCol: { value: new THREE.Color(0.004, 0.006, 0.016) } };
      const mesh = new THREE.Mesh(instancedGeo(quad, n, { iBase: [base, 3], iData: [data, 4] }),
        new THREE.ShaderMaterial({ uniforms, vertexShader: PFISH_VERT, fragmentShader: PFISH_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: false }));
      mesh.frustumCulled = false; mesh.renderOrder = 11;
      scene.add(mesh);
      pfish = { mesh, u: uniforms };
    }
    await ctx.yield();
    // 4) copepods sparking where the curtains catch them
    const armW = V3(0, 0, 0), arcT = hero.info.turns * Math.PI * 2 + 6.0;
    const pods = await makeMotes(Math.round(600 * density * detail), (i, p, d) => {
      hero.anchors.armPoint(rng() * arcT, armW).applyMatrix4(hero.object.matrixWorld);
      p[0] = armW.x + rng.gauss() * 0.7; p[1] = armW.y - rng.range(0.2, 3.3); p[2] = armW.z + rng.gauss() * 0.7;
      d[0] = 0.016; d[1] = rng(); d[2] = rng.range(0.5, 1.2); d[3] = 0;
    }, { self: photo.clone().lerp(col(PALETTE[4]), 0.35).multiplyScalar(1.6), blink: 1, dart: 0.5, minPx: 1.2, minE: 0.5, near: [0.6, 2], streak: false, colA: '#9fb6d8' });
    // 5) night only: a wake of blue sparks from the plankton the lens disturbs
    const boxS = V3(22, 16, 22);
    const sparks = hourKey === 'night' ? await makeMotes(Math.round(1400 * detail), snowFill(boxS), { box: boxS, self: photo.clone().multiplyScalar(1.3), lit: 0, blink: 1, minE: 0.5, minPx: 1.2 }) : null;
    await ctx.yield();
    // 6) THE DEEP SCATTERING LAYER: the black water round the helix has depth. A level sheet of dim blue points (the
    // photophores of far lanternfish, three in four gathered into loose schools) 20 m thick at the colony's own depth
    // and 175 m out from it on every side, with a soft-edged clearing 26-44 m round the colony, which eats them. From
    // the helix, 35-55 m above, it is a band of points receding behind the animals to the far water, its far end
    // drawn a little larger (uFar) and taken by the fog; the galaxy keeps its dark water. It stands still in the
    // world (no wrap box), comes up as the lens leaves the rope and thins for the dive.
    const dr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:deep'));
    const SLAB = { y: CY - 2, h: 20, r0: 26, r1: 44, R: 175 }, deepC = [];
    for (let i = 0; i < 90; i++) { const a = dr.range(0, 6.2832), r = lerp(40, 150, Math.pow(dr(), 0.8)); deepC.push([CX + Math.cos(a) * r, SLAB.y + dr.range(-0.3, 0.3) * SLAB.h, CZ + Math.sin(a) * r, dr.range(4, 10)]); }
    const deep = await makeMotes(Math.round(5000 * clamp(density, 0.85, 1.2) * detail), (i, p, d) => {
      for (let tries = 0; tries < 6; tries++) {
        if (dr() < 0.75) { const c = deepC[Math.floor(dr() * deepC.length) % deepC.length]; p[0] = c[0] + dr.gauss() * c[3]; p[1] = c[1] + dr.gauss() * c[3] * 0.35; p[2] = c[2] + dr.gauss() * c[3]; }
        else { const a = dr.range(0, 6.2832), r = lerp(SLAB.r0, SLAB.R, Math.pow(dr(), 0.75)); p[0] = CX + Math.cos(a) * r; p[1] = SLAB.y + dr.range(-0.5, 0.5) * SLAB.h; p[2] = CZ + Math.sin(a) * r; }
        if (Math.hypot(p[0] - CX, p[2] - CZ) > lerp(SLAB.r0, SLAB.r1, dr())) break;
      }
      const k = dr();
      d[0] = 0.06 + 0.07 * k; d[1] = dr(); d[2] = 0.35 + 0.65 * k * k; d[3] = 0;
    }, { self: photo.clone().multiplyScalar(1.8), lit: 0, minPx: 1.2, minE: 0.75, near: [16, 42], streak: false, blink: 0.22, gain: 0, order: 3, far: 0.5 });
    await ctx.yield();
    // 7) THE EYE SEEN EDGE-ON: from the rope the lens looks across the disc in its own plane, and the portal in the eye
    // (a flat window) was a hard bright band, then, under a cloud of light, a pale wedge like a searchlight's beam.
    // Now it is a DIM LENS OF HAZE: a few soft sprites in the halo's indigo (eyeGlow), the EYE CLOUD (EYE_VERT /
    // EYE_FRAG: a plug that hides the window and shows the halo's own dim colour in its place, and a wisped haze of indigo that is black water where
    // it is thin, fades toward the frame's edge and never out-shines the halo along the arm) and 460 lit flakes
    // drifting inside it, which carry its light. The cloud is drawn after the portal's own halo (order 6) and before
    // the curtains, lures and flakes, so those hang in front of it. All three follow eyeK in update(): full while the
    // lens is within 8 degrees of the disc's plane, gone at 20, so from the lift-off on the eye is the clean window.
    const eyeHaze = new THREE.Color(...{ blue: [0.042, 0.054, 0.14], ghost: [0.066, 0.05, 0.14], gold: [0.06, 0.052, 0.13] }[look.cast]);      // the halo's indigo: about 40 of 255 at full depth
    const eyeGlow = await makeMotes(34, (i, p, d) => {
      const r = 6.4 * Math.sqrt(dr()), a = dr.range(0, 6.2832), q = toWorld(V3(Math.cos(a) * r, dr.gauss() * 0.42 * (1 - 0.1 * r), Math.sin(a) * r));
      p[0] = q.x; p[1] = q.y; p[2] = q.z;
      d[0] = dr.range(4.2, 7.2) * (1 - 0.05 * r); d[1] = dr(); d[2] = dr.range(0.7, 1.1); d[3] = 0;
    }, { self: eyeHaze.clone().multiplyScalar(0.5), lit: 0, minE: 1, near: [7, 16], streak: false, order: 6, steady: 1, gain: 0 });
    await ctx.yield();
    const eyeTint = hero.colors.glow.clone().lerp(col(PALETTE[4]), 0.4), eyeMax = Math.max(eyeTint.r, eyeTint.g, eyeTint.b, 1e-3);
    eyeTint.multiplyScalar(1 / eyeMax);
    const eyeU = { uTime: env.uTime, uEyePos: { value: C }, uEyeN: { value: nrm }, uEyeSize: { value: 21 }, uEyePull: { value: 9 }, uEyeA: { value: 6.4 }, uEyeB: { value: 1.15 }, uEyeR: { value: 5.9 }, uEyeGain: { value: 0 },
      uEyeCol: { value: eyeHaze }, uEyeFill: { value: hero.colors.halo.clone().multiplyScalar({ blue: 0.33, ghost: 0.4, gold: 0.85 }[look.cast]) } };
    const eyeCloud = new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: eyeU, vertexShader: EYE_VERT, fragmentShader: EYE_FRAG, transparent: true, premultipliedAlpha: true, depthWrite: false, fog: false }));
    eyeCloud.frustumCulled = false; eyeCloud.renderOrder = 6.5; eyeCloud.visible = false;
    scene.add(eyeCloud);
    const eyeFlakes = await makeMotes(Math.round(460 * detail), (i, p, d) => {
      const r = 5.6 * Math.sqrt(dr()), a = dr.range(0, 6.2832), q = toWorld(V3(Math.cos(a) * r, dr.gauss() * 0.4 * (1 - 0.09 * r), Math.sin(a) * r));
      p[0] = q.x; p[1] = q.y; p[2] = q.z;
      d[0] = dr.range(0.02, 0.045); d[1] = dr(); d[2] = dr.range(0.5, 1.2); d[3] = dr.chance(0.2) ? dr.range(0.5, 1.2) : 0;
    }, { self: eyeTint.clone().lerp(new THREE.Color(1, 1, 1), 0.3).multiplyScalar(1.5), lit: 0, minPx: 1.15, minE: 0.5, near: [3, 8], streak: false, blink: 0.3, gain: 0 });
    await ctx.yield();

    // ---------------------------------------------------------------- lanternfish and hatchetfish
    const makeFish = (count, geo, fill, o) => {
      const base = new Float32Array(count * 3), dir = new Float32Array(count * 3), data = new Float32Array(count * 4), p = [0, 0, 0], f = [0, 0, 0], d = [0, 0, 0, 0];
      for (let i = 0; i < count; i++) { fill(i, p, f, d); base.set(p, i * 3); dir.set(f, i * 3); data.set(d, i * 4); }
      const uniforms = { ...env, uCenter: { value: (o.center || V3(0, 0, 0)).clone() }, uBox: { value: (o.box || V3(1, 1, 1)).clone() }, uWrap: { value: o.box ? 1 : 0 },
        uSign: { value: H.fishSign }, uVis: { value: 1 }, uFar: { value: new THREE.Vector2(...o.far) }, uPhoto: { value: photo.clone().multiplyScalar(o.photo ?? 3) } };
      const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, side: THREE.DoubleSide, fog: false, defines: o.hatchet ? { HATCHET: 1 } : {} });
      const mesh = new THREE.Mesh(instancedGeo(geo, count, { iBase: [base, 3], iDir: [dir, 3], iData: [data, 4] }), mat);
      mesh.frustumCulled = false;
      scene.add(mesh);
      return { mesh, u: uniforms };
    };
    const lanternGeo = fishGeometry([[0.5, 0.012, 0.01], [0.42, 0.085, 0.05], [0.22, 0.12, 0.068], [-0.02, 0.105, 0.055], [-0.26, 0.052, 0.026], [-0.4, 0.028, 0.012]], 6,
      [[[0, -0.38], [0.12, -0.53], [0.03, -0.47], [0, -0.45], [-0.03, -0.47], [-0.12, -0.53]], [[0.105, 0.06], [0.175, -0.04], [0.085, -0.12]]]);
    const riseDir = (f) => {       // nose 62-80 degrees up, any heading
      const pitch = rng.range(1.08, 1.4), yaw = rng.range(0, 6.2832);
      f[0] = Math.cos(pitch) * Math.cos(yaw); f[1] = Math.sin(pitch); f[2] = Math.cos(pitch) * Math.sin(yaw);
    };
    const boxP = V3(60, 34, 60), pillarFishC = V3(pillarC.x, -12, -73);
    const fishA = fishPillar ? makeFish(Math.round(350 * clamp(density, 0.8, 1.2) * detail), lanternGeo, (i, p, f, d) => {
      const r = 7.5 * Math.pow(rng(), 0.6), a = rng.range(0, 6.2832);
      p[0] = pillarFishC.x + Math.cos(a) * r; p[1] = pillarFishC.y + rng.range(-17, 17); p[2] = pillarFishC.z + Math.sin(a) * r;
      riseDir(f);
      d[0] = rng.range(0.11, 0.15); d[1] = rng(); d[2] = rng.range(0.6, 1.3); d[3] = 0;
    }, { box: boxP, center: pillarFishC, far: [24, 36] }) : null;
    await ctx.yield();
    // the pillar's fish at arm's length: 250 in a box that travels with the lens from the pillar to half-way down
    // (u 0.09-0.31), so a school of bodies 5-25% of the frame tall streams past at 0.9-7 m (25-35 cm: the largest
    // lanternfish, a third larger again so the row of photophores resolves); the lens itself stays clear
    const boxN = V3(9, 7, 9);
    // (the same draws as riseDir, turned into a SCHOOL: every nose within 35 degrees of one heading, across the gaze,
    // and only 7-35 degrees up, so the lens sees flanks and the rows of photophores, not noses)
    const schoolDir = (f, lo, hi, yaw0, spread) => {
      const pitch = lo + (Math.asin(clamp(f[1], -1, 1)) - 1.08) / 0.32 * (hi - lo), yaw = yaw0 + Math.atan2(f[2], f[0]) / Math.PI * spread;
      f[0] = Math.cos(pitch) * Math.cos(yaw); f[1] = Math.sin(pitch); f[2] = Math.cos(pitch) * Math.sin(yaw);
    };
    const fishC = fishPillar ? makeFish(Math.round(250 * clamp(density, 0.8, 1.2) * detail), lanternGeo, (i, p, f, d) => {
      p[0] = rng.range(-2.5, 2.5) * 1.8; p[1] = rng.range(-3.5, 3.5); p[2] = rng.range(-2.5, 2.5) * 1.8;
      riseDir(f); schoolDir(f, 0.12, 0.62, -Math.PI / 2, 0.6);
      d[0] = rng.range(0.17, 0.24) * 1.45; d[1] = rng(); d[2] = rng.range(0.6, 1.3); d[3] = 0;
    }, { box: boxN, far: [7.5, 9.5], photo: 4 }) : null;
    await ctx.yield();
    // stragglers rising against us all the way down (they travel in a box around the lens)
    const boxF = V3(19, 16, 19);
    const fishB = makeFish(Math.round(280 * density * detail), lanternGeo, (i, p, f, d) => {
      p[0] = rng.range(-9.5, 9.5); p[1] = rng.range(-8, 8); p[2] = rng.range(-9.5, 9.5);
      riseDir(f); schoolDir(f, 0.35, 0.95, 0, 1);            // flatter than the pillar's: more flank to the lens
      d[0] = rng.range(0.11, 0.15) * 1.35; d[1] = rng(); d[2] = rng.range(0.6, 1.3); d[3] = 0;
    }, { box: boxF, far: [40, 50] });
    await ctx.yield();
    // hatchetfish: twelve silver schools wheeling like thrown coins, 3.5-7.5 m off the path on the side we look to
    // (a body with thickness and a fish's outline: deep in the belly, 40% of its length, and 15% thick, tapering
    // evenly to the tail stalk, a forked tail and a low dorsal fin. It was a pane: 60% deep and 8% thick, cut off
    // abruptly to a thin stalk, and at any distance a school of those read as angular flakes)
    const hatchGeo = fishGeometry([[0.5, 0.015, 0.008, 0.02], [0.44, 0.095, 0.036, 0.015], [0.32, 0.165, 0.062, 0], [0.16, 0.2, 0.075, -0.02], [-0.02, 0.185, 0.068, -0.025], [-0.17, 0.115, 0.045, -0.005], [-0.3, 0.05, 0.022, 0.015], [-0.4, 0.03, 0.009, 0.02]], 6,
      [[[0.02, -0.38], [0.16, -0.56], [0.02, -0.47], [-0.12, -0.56]], [[0.15, 0.2], [0.25, 0.02], [0.1, -0.14]]]);
    const schoolU = H.pillar === 'salp' ? [0.1, 0.13, 0.15, 0.17, 0.2, 0.24, 0.29, 0.33, 0.38, 0.69, 0.73, 0.78] : [0.075, 0.15, 0.2, 0.235, 0.27, 0.305, 0.34, 0.375, 0.41, 0.685, 0.725, 0.775];
    const schools = schoolU.slice(0, 9).map((uOld, k) => {
      const u = U(uOld), p = path.pointAt(u), t = path.tangentAt(u), g = gazeAt(u, V3(0, 0, 0));
      const side = g.clone().addScaledVector(t, -g.dot(t)).add(V3(rng.range(-0.25, 0.25), rng.range(-0.25, 0.25), rng.range(-0.25, 0.25)));
      side.addScaledVector(t, -side.dot(t));
      if (side.length() < 0.05) side.set(t.z, 0.3, -t.x);
      return p.addScaledVector(side.normalize(), rng.range(3.6, 7.2)).addScaledVector(t, rng.range(2, 8));
    });
    // the helix: schools 7-10 m off, in the frame at the lift-off (u 0.69) and at u 0.815, 0.84 and 0.89, lit from below by the colony
    for (const [u, ahead, sx, sy] of [[M.lift + 0.012, 8, 3.2, -1.8], [0.815, 7, -3.0, 1.7], [0.842, 9, 7.0, 4.6], [0.9, 10, -8.5, 1.0]]) schools.push(pushOff((u > 0.83 ? stageB : stage)(u, ahead, sx, sy), 3.2));
    const PER = 30;
    await ctx.yield();
    // the steady camera looks further down the route: one school in ITS mid-ground on the descent (own random stream)
    const xr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:steady'));
    schools.push(pushOff(stage(U(0.33), 7.5, 2.6, 0.6, 1), 3.2));
    // ... and one low in the frame at u 0.79, between the galaxy and the scale figure (its own random stream too)
    const sr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:school79'));
    schools.push(pushOff(stageB(0.79, 5.6, -0.25, -2.15), 3.2));
    // (the polish pass's own random stream: everything staged since draws from it, so nothing older moves)
    const px = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:polish'));
    // ... three more, of larger fish: one flashing BETWEEN THE LENS AND THE DISC as the pan crosses the galaxy (u 0.82,
    // 4 m off, under the core on its left: at that range it has left the frame by u 0.84), one at u 0.90 and one by the foot of the pillar in the entry (18 m in)
    const SCHOOL_X = [[0.82, 5.0, -1.65, -0.55, 5.5], [0.9, 8, 4.5, -1.2, 7], [0.02, 9.5, 3.3, -1.7, 0]];
    for (const [u, ahead, sx, sy] of SCHOOL_X) schools.push(pushOff((u > 0.5 ? stageB : stage)(u, ahead, sx, sy), 2.6, 4.5));
    const hatch = makeFish(schools.length * PER, hatchGeo, (i, p, f, d) => {
      const s = Math.floor(i / PER), c = schools[s], R = s >= 15 ? px : s === 14 ? sr : s >= 13 ? xr : rng, r = 1.0 * Math.sqrt(R()), a = R.range(0, 6.2832);
      p[0] = c.x; p[1] = c.y; p[2] = c.z;
      f[0] = Math.cos(a) * r; f[1] = R.range(-0.3, 0.3); f[2] = Math.sin(a) * r;
      // (the descent's fish are shown half as large again as they were: at 11-15 cm a school 5 m off was 30 specks)
      d[0] = s >= 15 ? R.range(0.2, 0.27) : (s >= 9 && s < 13) || s === 14 ? R.range(0.15, 0.2) : R.range(0.11, 0.15) * 1.5; d[1] = R(); d[2] = s >= 15 ? SCHOOL_X[s - 15][4] : s === 14 ? 7 : s >= 10 && s < 13 ? 2 : 0;   // d[2]: the helix's schools, 50 m above the colony, take its light through a gain d[3] = (s * 0.618) % 1;
    }, { far: [34, 48], photo: 2, hatchet: true });
    await ctx.yield();
    // THE SCHOOL THAT FALLS WITH US (u 0.28-0.42): hatchetfish wheeling in five rings, keeping station with the lens
    // as it falls and drifting across the bottom of its frame from right to left, 5-9 m off: far on the right at
    // u 0.30, a wheel of silver in the lower right at 0.34 with the galaxy behind it, under the galaxy at 0.37, low
    // on the left at 0.40 and gone by 0.42. Its line is a curve through six stations staged in the frames of those
    // moments (TRAVEL: [u, ahead, right, up]), keyed to u. It never comes level with the lens: when the lens
    // overtook it the fish passed 1-2 m off, each a tenth of the frame, white paper fish.
    const TRAVEL = [[0.28, 9, 4.6, -1.6], [0.31, 7, 3.0, -1.5], [0.34, 5.4, 1.7, -1.35], [0.37, 5.4, 0.5, -1.6], [0.40, 5.6, -1.1, -1.7], [0.43, 7, -4.2, -1.3]];
    const tvCurve = new THREE.CatmullRomCurve3(TRAVEL.map(([u, ahead, sx, sy]) => stageB(u, ahead, sx, sy)));
    const travelAt = (u, out) => tvCurve.getPoint(clamp((u - TRAVEL[0][0]) / (TRAVEL[5][0] - TRAVEL[0][0]), 0, 1), out);
    const hatchT = makeFish(Math.round(170 * clamp(density, 0.8, 1.2) * detail), hatchGeo, (i, p, f, d) => {
      const ring = i % 5, r = 0.5 + 0.47 * ring + px.range(-0.24, 0.24), a = px.range(0, 6.2832);
      p[0] = 0; p[1] = 0; p[2] = 0;
      f[0] = Math.cos(a) * r; f[1] = px.range(-1, 1) * (1.2 - 0.13 * ring); f[2] = Math.sin(a) * r;
      d[0] = px.range(0.2, 0.3); d[1] = px(); d[2] = 3; d[3] = ring * 0.21 + 0.07;
    }, { far: [30, 42], photo: 2, hatchet: true });
    hatchT.u.uVis.value = 0;
    // ITS OUTRIDERS (u 0.29-0.41): sixteen of the largest fish of that school, 30-40 cm, in a loose wheel 2.9 m across
    // that keeps station with the lens 2.2-4.5 m off it, in the right half of its frame (stations staged in the
    // frames of those moments, as TRAVEL is): at u 0.34 each is 7-12% of the frame's height and, banking as it
    // wheels, a few of them catch the colony's glow on the flank, so the still is animals falling with us past a distant galaxy.
    // They come in from the right and leave low on the right; the lens never overtakes them. Own random stream.
    const TRAVEL_N = [[0.28, 8, 5.6, -0.3], [0.31, 4.4, 2.5, -0.3], [0.34, 3.3, 1.6, -0.25], [0.37, 3.3, 1.55, -0.5], [0.40, 4.6, 2.7, -1.3], [0.43, 8, 5.4, -1.8]];
    const tnCurve = new THREE.CatmullRomCurve3(TRAVEL_N.map(([u, ahead, sx, sy]) => stageB(u, ahead, sx, sy)));
    const outAt = (u, out) => tnCurve.getPoint(clamp((u - TRAVEL_N[0][0]) / (TRAVEL_N[5][0] - TRAVEL_N[0][0]), 0, 1), out);
    const nx = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:outriders'));
    const hatchN = makeFish(16, hatchGeo, (i, p, f, d) => {
      const a = (i / 16) * 6.2832 + nx.range(-0.2, 0.2), r = i % 2 ? nx.range(1.0, 1.45) : nx.range(0.45, 0.9);
      p[0] = 0; p[1] = 0; p[2] = 0;
      f[0] = Math.cos(a) * r; f[1] = nx.range(-0.5, 0.5); f[2] = Math.sin(a) * r;
      d[0] = nx.range(0.3, 0.4); d[1] = nx(); d[2] = 6; d[3] = nx.range(0.0, 0.1);      // d[2]: twice the school's share of the colony's light, so an edge-on fish is a grey sliver and not a hole
    }, { far: [30, 42], photo: 2, hatchet: true });
    hatchN.u.uVis.value = 0;
    path.stage.probe = { travel: (u) => (u > 0.27 && u < 0.42 ? travelAt(u, V3(0, 0, 0)) : null) };      // for the record; nothing reads it
    await ctx.yield();

    // ---------------------------------------------------------------- glass animals: comb jellies, mucus houses, salps
    const Y = V3(0, 1, 0), gl = { p: [], q: [], d: [] }, tq = new THREE.Quaternion(), te = new THREE.Euler();
    const addGlass = (pos, kind, sx, sy, quat, R = rng) => {
      if (!quat) quat = tq.setFromEuler(te.set(R.range(-0.9, 0.9), R.range(0, 6.28), R.range(-0.9, 0.9)));
      gl.p.push(pos.x, pos.y, pos.z); gl.q.push(quat.x, quat.y, quat.z, quat.w); gl.d.push(sx, sy, kind, R());
    };
    const nearDive = (p) => { const k = clamp(p.clone().sub(C).dot(nrm), 0, 70); return p.distanceTo(C.clone().addScaledVector(nrm, k)); };
    // six-plus comb jellies staged where the lens is looking at 12-16 s: [u, metres ahead, right, up]
    for (const [uOld, ahead, sx, sy] of [[0.25, 2.1, 0.8, -0.35], [0.265, 3.0, -1.0, 0.3], [0.283, 2.6, 1.1, 0.5], [0.3, 2.2, -0.8, -0.3], [0.318, 3.2, 1.2, -0.5], [0.335, 2.8, -1.1, 0.45], [0.36, 3.0, 0.9, 0.2], [0.4, 2.3, 0.85, -0.3]]) {
      const u = U(uOld), g = gazeAt(u, V3(0, 0, 0)), p = path.pointAt(u), right = V3(0, 0, 0).crossVectors(g, Y).normalize(), upv = V3(0, 0, 0).crossVectors(right, g);
      addGlass(p.addScaledVector(g, ahead).addScaledVector(right, sx).addScaledVector(upv, sy), 0, 0.125, 0.2);
    }
    // ... and more from their own random stream, so that from 7 s to the colony one is always growing in the frame
    const jr = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:jellies'));
    for (const uOld of [0.15, 0.16, 0.172, 0.185, 0.198, 0.21, 0.222, 0.236, 0.34, 0.348, 0.372, 0.385, 0.412, 0.425, 0.44]) {
      const k = jr.range(0.9, 1.35), side = jr.chance(0.5) ? 1 : -1;
      addGlass(pushOff(stage(U(uOld), jr.range(2.5, 3.6), side * jr.range(0.8, 1.7), jr.range(-0.7, 0.6)), 1.2), 0, 0.12 * k, 0.19 * k, null, jr);
    }
    await ctx.yield();
    for (let i = 0; i < 7; i++) {
      const u = U(rng.range(0.15, 0.44)), g = gazeAt(u, V3(0, 0, 0)), p = path.pointAt(u);
      addGlass(p.addScaledVector(g, rng.range(5, 10)).add(V3(rng.range(-3, 3), rng.range(-3, 3), rng.range(-3, 3))), 0, 0.1, 0.155);
    }
    for (const [t, r, y] of [[0.6, 15.5, 2.2], [1.6, 13.5, 1.8], [2.7, 11.5, 2.4]]) addGlass(toWorld(V3(Math.sin(t) * r, y, Math.cos(t) * r)), 0, 0.1, 0.155);
    // a second set where the STEADY camera is looking at 11-18 s, so its frame has an arm's-length subject too
    for (const [u, ahead, sx, sy] of [[0.24, 2.6, 0.5, 0.2], [0.27, 3.2, -0.9, -0.4], [0.3, 2.5, 0.7, 0.35], [0.33, 3.0, -0.6, 0.1], [0.36, 2.6, 0.8, -0.3]])
      addGlass(pushOff(stage(U(u), ahead, sx, sy, 1), 1.3), 0, 0.09, 0.14, null, xr);
    // one more low on the left as the lens comes down on the head (u 0.47), and THE HELIX'S FOREGROUND: large comb
    // jellies at arm's length where the lens is looking at u 0.84, 0.87 (on the left, the galaxy panned to the right)
    // and 0.90, their canals flaring as it passes: the nearest things in the frame while the galaxy is furthest off
    const hx = ctx.core.makeRng(ctx.core.hashSeed((ctx.seed ?? 1) + ':longest-animal:helix'));
    addGlass(pushOff(stage(0.47, 2.4, -1.25, -0.75), 1.2), 0, 0.16, 0.26, null, hx);
    for (const [u, ahead, sx, sy, k] of [[0.79, 3.0, 1.95, -1.37, 1.3], [0.84, 3.0, -0.58, 0.93, 1.25], [0.853, 3.4, 1.9, 0.7, 1.1], [0.87, 2.6, -0.37, 0.75, 1.6], [0.87, 3.7, -3.1, 1.48, 1.45], [0.872, 4.6, -0.9, -1.9, 1.1]])
      addGlass(pushOff(stageB(u, ahead, sx, sy), 1.3), 0, 0.125 * k, 0.2 * k, null, hx);
    // the polish pass: a large one low on the right at u 0.43 (the galaxy behind it on the left), one up on the left at
    // u 0.82 and one up on the left at u 0.90 (the galaxy alone in black water there), one low on the left in the entry
    for (const [u, ahead, sx, sy, k] of [[0.43, 2.4, 1.3, -0.8, 1.4], [0.82, 3.2, -2.4, 0.8, 1.3], [0.9, 4.5, -2.4, 1.3, 1.8], [0.02, 5.0, -2.0, -0.9, 1.8]])
      addGlass(pushOff((u > 0.5 ? stageB : stage)(u, ahead, sx, sy), 1.3, 3.5), 0, 0.125 * k, 0.2 * k, null, px);
    // larvacean houses turning slowly past (a drift of them in the 'drift' weather)
    for (let i = 0, n = Math.round(look.houses * density); i < n; i++) {
      for (let tries = 0; tries < 8; tries++) {
        const u = rng.range(0.03, 0.84), p = path.pointAt(u), t = path.tangentAt(u);
        const side = V3(rng.range(-1, 1), rng.range(-1, 1), rng.range(-1, 1)); side.addScaledVector(t, -side.dot(t));
        if (side.length() < 0.1) continue;
        p.addScaledVector(side.normalize(), rng.range(2.6, 9));
        if (path.distanceTo(p.x, p.y, p.z) < 2.4 || nearDive(p) < 7.5) continue;
        const s = rng.range(0.16, 0.27);
        addGlass(p, 1, s, s * rng.range(1.05, 1.5));
        break;
      }
    }
    // day: the lanternfish are already deep, so the entry pillar is a 30 m salp chain coiled like a glass spring
    if (H.pillar === 'salp') {
      const N = 118, tan = V3(0, 0, 0);
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1), a = k * Math.PI * 2 * 7.5, R = 2.3;
        tan.set(-Math.sin(a) * R * 47.1, 30, Math.cos(a) * R * 47.1).normalize();
        addGlass(V3(5.6 + Math.cos(a) * R, -27 + 30 * k, -77 + Math.sin(a) * R), 2, 0.2, 0.43, tq.setFromUnitVectors(Y, tan));
      }
    }
    // THE CHAIN'S COMPANY (a stream of its own, 'chain-company:' + seed, which draws nothing from any other). Along
    // the first 90 m of the stem, from the head's tip to arm angle 4.4, the water beside the colony's rope was bare:
    // 0.36 animals to ten metres of stem hang within 8 m of it there, 1.73 along the 60 m of stem after it, where the
    // ladder of helmets hangs (counted on seeds 1 to 40). It is peopled up to that density by a rule of the place:
    // (1.73 - 0.36) x 9 = 12 seats, one at a chance point of each equal part of that stretch of stem, each in a BAND
    // ROUND THE STEM'S OWN LINE: 4.4 to 6.3 m from it, at a chance angle all round it (the middle half of the
    // distances at which the older neighbours hang from the stem along those 60 m: 3.5 to 8.4 m for four in five of
    // them, 5.3 the median). Three seats in four are helmet jellies and the rest comb jellies, as among those
    // neighbours, of the same meshes, materials, sizes and drift (a helmet's gain is 1: the disc lights it by the law
    // it lights its own). A seat is drawn again, up to 12 times, and then left empty, while it is nearer ANY part
    // of the stem than the band's 4.4 m; nearer the hanging curtain (the 4.4 m under every point of the stem) than
    // 3 m for a helmet, whose tentacles reach 2.2 m, or 1.5 m for a comb jelly; nearer the route's line than the
    // older animals of its kind keep from it (a helmet 5 m, the nearest any of them comes; a comb jelly 1.3 m, the
    // margin the staged ones are pushed off to); inside the cone of water over the eye (nearer the disc's axis than
    // 9 m plus its height above the disc: the dive's line and the core stay clear); or within 3 m of another comb
    // jelly or of a seat already taken. Nothing here reads the lens, the gaze or the flight.
    const company = { band: [4.4, 6.3], per10: 1.73, has: 0.36, t1: 4.4, clear: [5, 1.3], hem: 4.4, sheet: [3, 1.5], helmets: 0.74, cone: 9, apart: 3, seats: [] };
    {
      const cc = ctx.core.makeRng(ctx.core.hashSeed('chain-company:' + ctx.seed));
      const line = [], run = [0], nB = Math.round(company.t1 / 0.05);      // the stem's own line in the world, every 0.05 rad of it; metres along its first stretch
      for (let t = 0; t <= hero.info.turns * Math.PI * 2; t += 0.05) line.push(stemW(t));
      for (let i = 1; i <= nB; i++) run.push(run[i - 1] + line[i].distanceTo(line[i - 1]));
      const N = Math.round((company.per10 - company.has) * run[nB] / 10), R0 = company.band[0] * company.band[0], R1 = company.band[1] * company.band[1], A2 = company.apart * company.apart;
      const _c = V3(0, 0, 0), e1 = V3(0, 0, 0), e2 = V3(0, 0, 0), along = V3(0, 0, 0);
      const free = (p, kind) => {
        for (const q of line) {
          if (q.distanceToSquared(p) < R0) return false;
          const dy = q.y - clamp(q.y - p.y, 0, company.hem) - p.y, dx = q.x - p.x, dz = q.z - p.z;
          if (dx * dx + dy * dy + dz * dz < company.sheet[kind] * company.sheet[kind]) return false;
        }
        const h = _c.subVectors(p, C).dot(nrm);
        if (_c.addScaledVector(nrm, -h).length() < company.cone + Math.max(h, 0)) return false;
        if (path.distanceTo(p.x, p.y, p.z) < company.clear[kind]) return false;
        for (const s of company.seats) if (s.p.distanceToSquared(p) < A2) return false;
        for (let j = 0; j < gl.d.length; j += 4) if (gl.d[j + 2] === 0 && _c.set(gl.p[j * 0.75], gl.p[j * 0.75 + 1], gl.p[j * 0.75 + 2]).distanceToSquared(p) < A2) return false;
        return true;
      };
      for (let i = 0; i < N; i++) {
        const kind = cc() < company.helmets ? 0 : 1, s = (i + cc()) / N * run[nB];
        let k = 1; while (k < nB && run[k] < s) k++;
        const at = line[k - 1].clone().lerp(line[k], (s - run[k - 1]) / Math.max(run[k] - run[k - 1], 1e-6));
        along.subVectors(line[k], line[k - 1]).normalize(); e1.crossVectors(along, UP).normalize(); e2.crossVectors(e1, along);
        for (let tries = 0; tries < 12; tries++) {
          const a = cc.range(0, 6.2832), r = Math.sqrt(lerp(R0, R1, cc())), p = at.clone().addScaledVector(e1, Math.cos(a) * r).addScaledVector(e2, Math.sin(a) * r);
          if (!free(p, kind)) continue;
          if (kind === 0) {           // a helmet jelly: crown up, give or take the tilt the colony's own have (it joins the others below)
            const sc = cc.range(1, 1.5), q = new THREE.Quaternion().setFromEuler(te.set(cc.range(-0.3, 0.3), cc.range(0, 6.28), cc.range(-0.3, 0.3)));
            company.seats.push({ p, q, d: [sc, cc(), 1, 0] });
          } else {                    // a comb jelly, 36 to 64 cm long
            const sz = cc.range(0.9, 1.6);
            addGlass(p, 0, 0.125 * sz, 0.2 * sz, null, cc);
          }
          break;
        }
      }
    }
    const nGlass = gl.d.length / 4;
    const glassMesh = new THREE.Mesh(instancedGeo(ellipsoidGeometry(16, 10), nGlass, { iPos: [new Float32Array(gl.p), 3], iQuat: [new Float32Array(gl.q), 4], iData: [new Float32Array(gl.d), 4] }),
      new THREE.ShaderMaterial({ uniforms: { ...env, uEmber: { value: col(PALETTE[5]) } }, vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG,
        transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    glassMesh.frustumCulled = false; glassMesh.renderOrder = 9;
    scene.add(glassMesh);
    await ctx.yield();

    // ---------------------------------------------------------------- the scale figure: oarfish, a pair, or a giant squid
    await ctx.yield();
    const crimson = col(PALETTE[6]), goldCast = look.cast === 'gold', warm = new THREE.Color(1.0, 0.9, 0.7);
    const flickU = { value: 0 }, flickT = { value: 0 }, figI = { value: 4.0 }, lateU = { value: 0 };
    // the colony's light on its neighbours: blue-white (whiter on the mirror-silver), gold-white under a gold colony
    const figLight = goldCast ? hero.colors.glow.clone().lerp(warm, 0.45).multiplyScalar(1.4) : hero.colors.glow.clone().lerp(col(PALETTE[4]), 0.85).multiplyScalar(1.25);
    const bodyLight = goldCast ? hero.colors.glow.clone().lerp(warm, 0.3).multiplyScalar(0.85) : surf;   // gold light is strong in red: held back so the scarlet does not out-shout the colony
    const sheen = hero.colors.glow.clone().multiplyScalar(0.28).add(new THREE.Color(0.06, 0.07, 0.085));
    // reach2 / cut: how fast the light dies with height above the disc (helmets go black 25 m up; the figure keeps its own)
    const bodyMat = (mode, instanced, phase, colonyI, reach2, cut) => new THREE.ShaderMaterial({
      uniforms: { ...env, uColonyI: colonyI, uColonyCol: { value: instanced ? bodyLight : (mode === 1 && goldCast ? figLight.clone().multiplyScalar(1.1) : figLight) }, uColonyN: { value: nrm }, uReach2: { value: reach2 }, uCut: { value: cut },
        uPhase: { value: phase }, uFlick: flickU, uFlickT: flickT, uLate: lateU, uSheen: { value: sheen }, uMemb: { value: goldCast ? 0.75 : 1 } },   // uMemb: gold light is strong in red, so the oarfish's membranes take a quarter less of it
      vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, vertexColors: true, side: THREE.DoubleSide, fog: false,
      defines: instanced ? { MODE: mode, INSTANCED: 1 } : { MODE: mode } });
    const figures = [];
    // each figure bows over the colony: head up and leaning toward the disc's axis, belly turned down to the light, the
    // flank turned half-way to the lens of the lift-off, so the S-bend shows as a curve and as light and shade
    const _bx = V3(0, 0, 0), _by = V3(0, 0, 0), _bz = V3(0, 0, 0), _bm = new THREE.Matrix4(), _bq = new THREE.Quaternion();
    const addFigure = (geo, mode, pos, scale, phase, lean) => {
      const m = new THREE.Mesh(geo, bodyMat(mode, false, phase, figI, mode === 1 ? 2000 : 1600, 0));
      m.scale.setScalar(scale);
      const hL = C.clone().sub(pos); hL.y = 0; hL.normalize();
      _by.copy(UP).multiplyScalar(Math.cos(lean)).addScaledVector(hL, Math.sin(lean));
      _bx.copy(UP).multiplyScalar(Math.sin(lean)).addScaledVector(hL, -Math.cos(lean));       // the dorsal edge: up and away from the disc
      _bz.crossVectors(_bx, _by);
      m.quaternion.setFromRotationMatrix(_bm.makeBasis(_bx, _by, _bz));
      const toCam = Pf.clone().sub(pos);                                                        // the lens at the close pass
      let dA = Math.atan2(toCam.x, toCam.z) - Math.atan2(_bz.x, _bz.z);
      dA = Math.atan2(Math.sin(dA), Math.cos(dA));
      if (Math.abs(dA) > Math.PI / 2) dA -= Math.sign(dA) * Math.PI;                          // either flank will do
      m.quaternion.premultiply(_bq.setFromAxisAngle(UP, 0.55 * dA));
      m.position.copy(pos);
      m.userData.baseY = pos.y;
      m.frustumCulled = false;
      scene.add(m); figures.push(m);
      return m;
    };
    if (look.figure === 'squid') addFigure(squidGeometry(crimson), 1, figPos, 1.2, 1.3, FIG_LEAN);
    else {
      const oar = oarfishGeometry(crimson);
      addFigure(oar, 0, figPos, 1, 0.7, FIG_LEAN);
      if (look.figure === 'pair') {
        // the second hangs beyond the first as the lift-off sees them, lower and to the right: smaller in frame
        const v = figPos.clone().sub(Pf); v.y = 0; v.normalize();
        const p2 = figPos.clone().addScaledVector(v, 5.5).addScaledVector(V3(0, 0, 0).crossVectors(v, UP), 4.4).add(V3(0, -2.4, 0));
        addFigure(oar, 0, pushOff(p2, 6.5), 0.78, 2.9, 0.42);
      }
    }

    await ctx.yield();
    // THE DESCENT'S OWN GIANT: the species the colony does not have beside it (an oarfish when that is the squid, a
    // squid otherwise) hangs where the lens is looking at 11-12 s, 9 m off and to the right of the galaxy, head up and
    // leaning away so its length lies up the frame, flank to the lens. It takes the colony's light like the figure but
    // through a gain of its own (dI) that update() brings up at 5 s and lets go out by 17 s, so later it is black water.
    const dI = { value: 0 };
    {
      const uD = U(0.25), g = gazeAt(uD, V3(0, 0, 0)), pD = pushOff(stage(uD, 9.5, 3.7, 0.3), 5.5), squidD = look.figure !== 'squid';
      const m = new THREE.Mesh(squidD ? squidGeometry(crimson) : oarfishGeometry(crimson), bodyMat(squidD ? 1 : 0, false, 2.1, dI, 30000, 0));
      const gh = V3(g.x, 0, g.z).normalize();
      _by.copy(UP).multiplyScalar(Math.cos(0.44)).addScaledVector(gh, Math.sin(0.44));
      _bx.crossVectors(_by, gh.negate()).normalize(); _bz.crossVectors(_bx, _by);
      m.quaternion.setFromRotationMatrix(_bm.makeBasis(_bx, _by, _bz));
      m.scale.setScalar(squidD ? 0.85 : 1);
      m.position.copy(pD); m.frustumCulled = false; m.userData.half = squidD ? 4 : 4;
      scene.add(m);
      path.stage.extras = [m];
    }
    await ctx.yield();
    path.stage.figures = figures;

    // ---------------------------------------------------------------- helmet jellies: black domes above, scarlet by the colony
    const hl = { p: [], q: [], d: [] }, hlU = [];
    const addHelmet = (pos, scale, tilt = 0.3, gain = 1, late = 0, axis = null, stageU = 0) => {
      hlU.push(stageU);
      tq.setFromEuler(te.set(rng.range(-tilt, tilt), rng.range(0, 6.28), rng.range(-tilt, tilt)));
      if (axis) tq.premultiply(_bq.setFromUnitVectors(Y, axis));       // a staged one: its crown points along `axis` (give or take the tilt)
      hl.p.push(pos.x, pos.y, pos.z); hl.q.push(tq.x, tq.y, tq.z, tq.w); hl.d.push(scale, rng(), gain, late);
    };
    addHelmet(V3(6.6, 3.9, -19), 1.7, 0.2);                        // the entry silhouette, up-right against the glow
    addHelmet(V3(-10, 8.5, -50), 1.4);
    // two on the descent, well clear of the galaxy: up and to one side of the gaze (they sat on its rim as black blots)
    // (the second drifted straight across the galaxy's core as a black blot at u 0.29-0.32, wherever on that side it
    // was staged, the lens flying 40 degrees across its own gaze there: it is no longer drawn. It keeps its place in
    // the list at size 0 so that every later random draw stays where it was)
    for (const [uOld, sx] of [[0.2, 6.8], [0.33, -6.8]]) addHelmet(pushOff(stage(U(uOld), 10, sx, 4.4), 4), uOld > 0.3 ? 0 : 1.25);
    for (const [t, r, y, s] of [[0.9, 12.3, 1.3, 1.1], [1.9, 11.2, 2.0, 1.25], [2.9, 9.9, 1.5, 1.0], [4.3, 27, 3.5, 1.3], [5.6, 28.5, -1.5, 1.2]]) addHelmet(toWorld(V3(Math.sin(t) * r, y, Math.cos(t) * r)), s);
    // helmGain: the gain that brings the colony's light on a staged helmet to `target` (1 = just under the shader's
    // soft knee, so the light still models the dome; the old fixed gains of 200 and 270 sat on the knee)
    const helmGain = (p, target) => {
      const lc = C.clone().sub(p), h = -lc.dot(nrm), rex = Math.max(lc.addScaledVector(nrm, h).length() - 17 * HERO_K, 0), hh = Math.max(h, 0);
      return target / Math.max(1.6 / (1 + (hh * hh + rex * rex) / 120) * (1 - 0.93 * smoothstep(11, 26, hh)), 1e-3);
    };
    // the lift-off (u 0.69, two more at u 0.79): a ladder of them from the rim up, so the eye reads the climb as rising out of the light:
    // scarlet beside the bells, dimmer at 8-14 m, black shapes with a thread of rim light at 25 m. [u, ahead, right, up, scale, tilt]
    for (const [u, ahead, sx, sy, sc, tilt] of [
      [0.65, 9.5, 4.6, -4.6, 1.15, 0.8], [0.65, 15, -6.2, -6.4, 1.5, 0.5], [0.65, 22, 7.5, -8.5, 1.8, 0.7], [0.65, 13.5, 8.6, -1.2, 0.9, 0.8],
      [0.65, 17, -10.5, 1.5, 1.3, 0.6], [0.65, 24, 12.5, 4.5, 1.6, 0.8], [0.65, 19, -5.5, 8.2, 1.0, 0.7], [0.65, 27, 6, 11.5, 1.4, 0.5],
      [0.7, 15, -8.2, 3.6, 1.5, 0.6], [0.7, 18, 9.2, 1.2, 1.2, 0.8]]) {
      // (the last two hang 17-20 m off in the middle of the helix pan, 50 m over the disc: black on black with a gain
      // of 1. They take the colony's light as the near ones do, so the pan always has lit company at mid distance)
      const hp = pushOff(stage(u < 0.68 ? M.lift + 0.012 : M.fig + 0.03, ahead, sx, sy), 5);
      addHelmet(hp, u < 0.68 ? sc : sc * 1.25, tilt, u < 0.68 ? 1 : helmGain(hp, 0.9), 1);
    }
    // THE HELIX AND THE DIVE: two at 5-8 m low on the left at u 0.84 (60 m up they take the colony's light through a
    // gain of their own, or they would be black on black) and two large ones low on the left of the dive (u 0.945),
    // 8 m off its line and 11-14 m ahead, lit scarlet from below: a foreground again as the disc fills the frame.
    // (Those two stood upright, so the diving lens saw them crown-on: a dark disc with legs. They now lie side-on to
    // it, tentacles trailing down and left out of the frame, the open bell and its lappets turned to the core.)
    // (the first was 5.2 m off at u 0.84 and in the frame for a second. It now hangs 9 m off and is larger by as much,
    // so it fills the same place in that frame and is ALSO the lit animal low in the frame at u 0.82, mid-pan, where
    // the galaxy was alone: it comes in on the right at u 0.805, crosses the bottom of the frame 5.5 m from the lens
    // at u 0.82 and leaves on the left at u 0.855. Its crown points up the frame of u 0.82, across both the lens's
    // line of sight and its line of travel, so it is seen side-on the whole way (never crown-on, a black disc with
    // legs) and its tentacles trail out of the bottom of the frame, never toward the core.)
    for (const [u, ahead, sx, sy, sc, tilt, gain, lean, toLens, uAxis] of [[0.84, 9.0, -6.54, -1.7, 2.6, 0.12, 0, 2.75, -0.2, 0.82], [0.87, 5.2, -3.47, -2.09, 1.4, 0.12, 0, -0.5, 0.3, 0.87], [0.945, 11, -7.3, -4.4, 2.1, 0.2, 2.2, -2.2, 0.25, 0.945], [0.945, 14.5, -9.8, -1.8, 1.6, 0.25, 2.6, -1.8, 0.2, 0.945]]) {
      const hp = pushOff((u < 0.9 ? stageB : stage)(u, ahead, sx, sy), 3.2);
      addHelmet(hp, sc, tilt, gain || helmGain(hp, 1.05), 1, dirB(uAxis, Math.sin(lean), Math.cos(lean), toLens), u > 0.9 ? u : 0);
    }
    // the steady camera's descent: one in its mid-ground
    { const hp = pushOff(stage(U(0.3), 13, 3.5, 2.2, 1), 5.5); addHelmet(hp, 1.3, 0.5, Math.max(2.5, helmGain(hp, 0.8))); }
    // THE POLISH PASS (staged last, so no older draw moves). [u, ahead, right, up, scale, lean, target light, late, toward the lens]
    //   u 0.43  three at 6-13 m in the upper right, at the lens's own level 17 m above the disc, so their lit
    //           undersides face it: the red company of the last of the descent (the galaxy sits lower left of them)
    for (const [u, ahead, sx, sy, sc, lean, target, late, toLens] of [[0.43, 6.5, 2.9, 1.5, 1.9, -0.3, 1.25, 0, 0.1], [0.43, 10.5, 5.8, 0.2, 1.5, 0.35, 1.2, 0, 0.0], [0.43, 13.5, 1.9, 3.7, 1.3, 0.1, 1.2, 0, 0.0]]) {
      const hp = pushOff((u > 0.5 ? stageB : stage)(u, ahead, sx, sy), u > 0.5 ? 3.2 : 4);
      addHelmet(hp, sc, 0.12, helmGain(hp, target), late, dirB(u, Math.sin(lean), Math.cos(lean), toLens));
    }
    // THE CORE STAYS A CLEAN DISC THROUGH THE HELIX'S PAN: two or three helmets (the dive's pair, 10-13 m above the disc
    // and 9 m from its axis, and one of the ladder) stood as dark tentacled shapes on the bright window, the one
    // place the eye rests. Every helmet is projected from the lens through u 0.74-0.89 (in steps of 0.01, in the
    // frame of that moment); one that falls on the core (and is more than 14 m off: the staged foreground is left
    // alone) is moved outward in the disc's plane and down toward the disc, 4 m above it at the least, until its
    // foot falls between the arms. A moved helmet keeps the light it had (its gain is rescaled); one staged for a later
    // frame (the dive's pair, u 0.945) is moved back along that frame's line of sight and enlarged as much, so in
    // its own picture it is where it was.
    {
      const _h = V3(0, 0, 0), _d = V3(0, 0, 0), _x = V3(0, 0, 0), TAN = Math.tan(31 * Math.PI / 180), frames = [];
      for (let u = 0.74; u <= 0.8901; u += 0.01) frames.push({ cam: path.pointAt(u), ...frameB(u) });
      const onCore = (p, sc) => {
        for (const f of frames) {
          _d.subVectors(p, f.cam);
          const z = _d.dot(f.g);
          if (z < 14 || Math.abs(_d.dot(f.right)) > z * TAN * 1.9 || Math.abs(_d.dot(f.upv)) > z * TAN * 1.08) continue;
          const dn = _d.dot(nrm), cn = _x.subVectors(f.cam, C).dot(nrm);
          if (dn > -1e-4 || -cn / dn < 1) continue;                                   // it hangs under the disc from here
          if (_x.copy(f.cam).addScaledVector(_d, -cn / dn).sub(C).length() < 6.5 + 1.3 * sc) return true;
        }
        return false;
      };
      const moved = [];
      for (let i = 0; i < hlU.length; i++) {
        let sc = hl.d[i * 4], n = 0;
        if (sc <= 0) continue;
        const old = _h.set(hl.p[i * 3], hl.p[i * 3 + 1], hl.p[i * 3 + 2]).clone(), sc0 = sc, cam = hlU[i] > 0 ? path.pointAt(hlU[i]) : null;
        for (; n < 18 && onCore(_h, sc); n++) {
          if (cam) {
            // staged for a later frame: it goes back along that frame's line of sight (so it stays where it was in
            // that picture, and as large), which from the diving lens is outward and down toward the disc
            const k = 1 + 0.05 * (n + 1);
            _x.copy(cam).addScaledVector(_d.subVectors(old, cam), k);
            if (_d.subVectors(_x, C).dot(nrm) < 4) break;
            _h.copy(_x); sc = sc0 * k;
          } else {
            const hN = _x.subVectors(_h, C).dot(nrm);
            _x.addScaledVector(nrm, -hN);
            _h.addScaledVector(_x, 0.7 / Math.max(_x.length(), 1e-3)).addScaledVector(nrm, -Math.min(0.55, Math.max(hN - 4, 0)));
          }
        }
        if (!n) continue;
        if (!cam) pushOff(_h, 3.2);
        hl.d[i * 4] = sc; hl.d[i * 4 + 2] *= helmGain(_h, 1) / helmGain(old, 1);
        hl.p[i * 3] = _h.x; hl.p[i * 3 + 1] = _h.y; hl.p[i * 3 + 2] = _h.z;
        moved.push(i);
      }
      path.stage.movedHelmets = moved;                                                // for the record; nothing reads it
    }
    await ctx.yield();
    // the chain's company: its helmet jellies join the list here, after every older helmet is seated (none takes a
    // seat within 3 m of one of those)
    for (const s of company.seats) {
      let clear = true;
      for (let i = 0; i < hl.d.length; i += 4) if (hl.d[i] > 0 && s.p.distanceTo(_bx.set(hl.p[i * 0.75], hl.p[i * 0.75 + 1], hl.p[i * 0.75 + 2])) < company.apart) clear = false;
      if (clear) { hl.p.push(s.p.x, s.p.y, s.p.z); hl.q.push(s.q.x, s.q.y, s.q.z, s.q.w); hl.d.push(...s.d); }
    }
    const helmets = new THREE.Mesh(instancedGeo(helmetGeometry(crimson), hl.d.length / 4, { iPos: [new Float32Array(hl.p), 3], iQuat: [new Float32Array(hl.q), 4], iData: [new Float32Array(hl.d), 4] }),
      bodyMat(2, true, 0, env.uColonyI, 120, 0.93));
    helmets.frustumCulled = false;
    scene.add(helmets);
    path.stage.props = { helmets: hl, glass: gl, schools };                         // where the staged animals are (for the record; nothing reads it)
    await ctx.yield();

    // ---------------------------------------------------------------- update: scripted moments keyed to u, loops to time
    const _size = new THREE.Vector2(), _tan = V3(0, 0, 0), _fwd = V3(0, 0, 0), _cam = V3(0, 0, 0);
    const wrapOff = (v, box) => { v.x %= box.x; v.y %= box.y; v.z %= box.z; };
    return {
      scene, path, duration: DURATION,
      camera: { fov: 62, near: 0.12, far: 1500, lookAhead: 14, sway: 0.3, bank: BANK },
      pace,
      pois,
      portal: { shape: 'circle', radius: 5.5, color: '#9FE0FF', glow: 0.3, revealDistance: 220, tilt: true },
      // POST: exposure, bloom and grade
      post: { exposure: 1.25, bloom: { strength: 0.55, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.06, tint: '#f3f6ff', shadowTint: look.cast === 'gold' ? '#040404' : '#03051a', vignette: 0.42, grain: 0.03, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        env.uTime.value = time;
        const h = ctx.renderer?.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(_size).y : 720;
        env.uPxScale.value = camera.projectionMatrix.elements[5] * (h || 720) * 0.5;
        const uo = u * LEN / OLD_LEN;                          // the descent's script is written in the old route's fractions
        setDepth(uo);
        _cam.setFromMatrixPosition(camera.matrixWorld);       // never camera.position alone: the portal camera sets its matrix
        dome.position.copy(_cam);
        // the pillar goes dark once it is behind and above the lens (u 0.30-0.42): seen from the arm, 70 m below, its
        // cut-off foot was a lone blue ball over the colony
        const pillarOn = 1 - smoothstep(0.3, 0.42, uo);
        pillarCore.u.uGain.value = (1 + 3 * entryBoost.value) * pillarOn;
        if (pfish) {
          pfish.u.uRise.value += 0.9 * H.fishSign * dt;
          pfish.u.uGain.value = pillarOn * (1 - 0.3 * env.uEntry.value);
          pfish.mesh.visible = pillarOn > 0.001;
        }
        pillar.u.uGain.value = (1 + 0.5 * entryBoost.value) * pillarOn * (1 - 0.45 * smoothstep(0.06, 0.1, uo) * (1 - smoothstep(0.12, 0.15, uo)));   // the column thins behind the school at u 0.08
        haze.u.uGain.value = pillarOn;
        // the descent's giant takes its light at 5 s and is black water again by 17 s
        dI.value = 2.2 * smoothstep(0.09, 0.17, uo) * (1 - smoothstep(0.3, 0.37, uo));
        lateU.value = smoothstep(M.tip - 0.02, M.tip + 0.045, u);
        hero.setProgress(u);
        // THE LENS'S OWN BAND: besides the bands that overtake it, one slug of light comes up from behind as the lens
        // settles beside the curtain, runs 4 to 6 m ahead of it for the length of the ride (gaining slowly) and
        // outruns it at the roll-over, so the stretch of rope in the frame is always the one that is alight
        const ownIn = smoothstep(M.tip + 0.004, M.tip + 0.032, u), ownOut = smoothstep(M.rideEnd - 0.012, M.lift, u);
        hero.setBand(lensS(u) + lerp(-5, 3, ownIn) + 2.2 * clamp((u - M.tip - 0.03) / (M.rideEnd - M.tip - 0.03), 0, 1) + 16 * ownOut, ownIn * (1 - ownOut));
        hero.update(dt, time, camera);
        // the colony's light on its neighbours breathes with the bands and leaps with the startle; so does the snow's halo
        const sp = rare ? (u - STARTLE_AT) / (1 - STARTLE_AT) : -1;
        const flash = sp > 0 ? smoothstep(0, 0.03, sp) * (1 - smoothstep(0.2, 0.6, sp)) : 0;
        env.uColonyI.value = 1.6 * (1 + 0.07 * Math.sin(time * 2.1)) * (1 + 1.1 * flash);
        figI.value = 4.0 * (1 + 0.07 * Math.sin(time * 2.1)) * (1 + 0.45 * flash);      // the figure takes less of the flash: its crimson must not wash out
        haloU.uHaloK.value = HALO_K * (1 + (goldCast ? 0.6 : 1.5) * flash);
        flickU.value = rare ? bell(u, STARTLE_AT - 0.025, STARTLE_AT + 0.06, 0.3) : 0;
        flickT.value = (u - STARTLE_AT + 0.025) * DURATION;
        // snow: its own rise in the descent, then a slow fall; streaks follow the motion relative to the lens
        const climb = smoothstep(M.rideEnd - 0.02, M.lift + 0.01, u) * (1 - smoothstep(M.join - 0.045, M.join + 0.015, u));
        const dive = smoothstep(M.join - 0.045, M.join + 0.015, u);
        const rise = lerp(-0.06, 5, smoothstep(0.12, 0.16, uo) * (1 - smoothstep(0.4, 0.47, uo))) - 0.16 * climb;   // on the climb it falls toward the lens
        snowA.u.uOffset.value.y += rise * dt; wrapOff(snowA.u.uOffset.value, boxA);
        snowB.u.uOffset.value.y -= 0.06 * dt; wrapOff(snowB.u.uOffset.value, boxB);
        pillar.u.uOffset.value.y = (pillar.u.uOffset.value.y + 0.9 * H.fishSign * dt) % PILLAR_H;
        path.tangentAt(u, _tan);
        const k = 0.36 + 0.64 * smoothstep(0.11, 0.17, uo) * (1 - smoothstep(0.4, 0.47, uo)) - 0.14 * smoothstep(0.42, 0.48, uo) * (1 - smoothstep(M.rideEnd, M.lift, u)) + 0.3 * dive;
        streakU.value.set(-_tan.x * SPEED, rise - _tan.y * SPEED, -_tan.z * SPEED).multiplyScalar(0.05 * k);
        _fwd.set(0, 0, -1).transformDirection(camera.matrixWorld);
        snowA.u.uCenter.value.copy(_cam).addScaledVector(_fwd, 11);
        fishB.u.uCenter.value.copy(_cam).addScaledVector(_fwd, 7);
        fishB.u.uVis.value = (1 - smoothstep(0.46, 0.505, uo)) + 0.85 * climb * (1 - smoothstep(M.join - 0.09, M.join - 0.04, u));
        if (fishC) {
          // at first the school is drawn in tight round the lens (a smaller wrap box, centred 3 m ahead), so five or
          // six fish cross it at 1-2 m by u 0.08; it opens out to its full box by u 0.14
          const open = smoothstep(0.1, 0.14, uo);
          fishC.u.uCenter.value.copy(_cam).addScaledVector(_fwd, lerp(3, 4.2, open));
          fishC.u.uBox.value.copy(boxN).multiplyScalar(lerp(0.64, 1, open));
          fishC.u.uVis.value = smoothstep(0.004, 0.06, uo) * (1 - smoothstep(0.27, 0.31, uo));      // the first few cross the lens within a second of the entry; the school has gathered by u 0.06
          fishC.mesh.visible = fishC.u.uVis.value > 0.001;
        }
        // flakes: half as bright from the roll-over (u 0.61) to the dive (over the glow in the water every flake reads
        // larger and brighter than it did on black: at 70% and more the helix was a blizzard of dots), thinner in
        // the portal view
        snowA.u.uGain.value = SNOW_GAIN * (1 - 0.5 * smoothstep(M.rideEnd - 0.03, M.lift, u) * (1 - smoothstep(M.join - 0.025, M.join + 0.025, u))) * (1 - 0.5 * env.uEntry.value);
        // the school that falls with us, the deep scattering layer, the cloud of light in the eye
        hatchT.u.uVis.value = smoothstep(0.272, 0.315, u) * (1 - smoothstep(0.4, 0.425, u));
        hatchT.mesh.visible = hatchT.u.uVis.value > 0.001;
        if (hatchT.mesh.visible) travelAt(u, hatchT.u.uCenter.value);
        hatchN.u.uVis.value = smoothstep(0.283, 0.322, u) * (1 - smoothstep(0.385, 0.42, u));
        hatchN.mesh.visible = hatchN.u.uVis.value > 0.001;
        if (hatchN.mesh.visible) outAt(u, hatchN.u.uCenter.value);
        deep.u.uGain.value = 2.0 * smoothstep(M.lift, M.lift + 0.075, u) * (1 - 0.6 * dive);
        _tan.subVectors(_cam, C);
        const eyeD = Math.max(_tan.length(), 1e-3), graze = Math.abs(_tan.dot(nrm)) / eyeD;
        // the colony's glow in the water: up between the lift-off and u 0.76 (it spreads out from the galaxy as it
        // comes: the grade's black point), about the direction from this camera to the core
        const deepGlow = smoothstep(M.lift - 0.01, M.lift + 0.075, u) * (1 - 0.3 * smoothstep(M.join - 0.045, M.join + 0.02, u));   // in the dive it draws in round the galaxy, which is on black water again
        if (eyeD > 0.5) env.uDeepDir.value.copy(_tan).multiplyScalar(-1 / eyeD);
        env.uDeepCol.value.copy(deepA).multiplyScalar(deepGlow); env.uDeepCol2.value.copy(deepB).multiplyScalar(deepGlow);
        // the eye seen edge-on: the cloud over the window, its flakes and the older sprites behind it
        const eyeK = (1 - smoothstep(0.14, 0.34, graze)) * smoothstep(9, 15, eyeD) * smoothstep(0.3, 0.4, u);
        eyeGlow.u.uGain.value = 0.2 * eyeK;
        eyeU.uEyeGain.value = eyeK; eyeCloud.visible = eyeK > 0.002;
        eyeFlakes.u.uGain.value = eyeK;
        if (sparks) sparks.u.uCenter.value.copy(_cam).addScaledVector(_fwd, 6);
      },
      dispose() { hero.dispose(); },
    };
  },
};
