// THE CYCLONE OF WINGS (manta-cyclone): a sand bay 28 m deep under a passing squall. We arrive on the sand INSIDE the
// eye of a turning, hollow column of two hundred manta rays and spend the whole ride climbing its funnel against the
// turn, in clear deep-blue water swept by narrow sun beams; a 9 m whale shark rises through the eye beside us and leaves
// through the wall; the squall tears and one broad gold shaft stands down the eye; we come out under the rain-pocked
// ceiling at a ring hung in the mouth of the funnel. Naturalistic, never leaves the water or the eye. Everything is drawn
// by this file's own shaders plus the hero part (src/parts/manta-cyclone.js: the column, chain, remoras, fusilier
// ribbon, feed motes, the eight narrow beams, the broad shaft's light, wing shadows, the rare breach).
//
// MAP OF THIS FILE (in order)
//   1. GLSL        W_VERT / W_PARS (shared light + water fog: wFogCol() is cyan-blue looking up, mid blue level, deep blue
//                  looking down, and deepens with distance; wFog() adds the hero's broad shaft and takes the blue out
//                  behind it), BACK_FRAG (the backdrop: water at infinity, so no pixel is bare background),
//                  CEIL_FRAG (Snell's window, squall cloud, the sun gap and the ragged rift that runs out of it: silver
//                  cloud lit from behind where it is thin, pale gold in its body, white only in its core, gold threads
//                  fanning from it; or the moon; mirror outside it, rain as thin rings with a fringe of bubbles that dim
//                  with distance and a far shimmer, the dark bank
//                  over the exit, the breach's hole), FLOOR_FRAG (sand ripples, caustics, coins under the narrow beams,
//                  the gold pool with the wing shadows of the tiers turning through it, the whale shark's shadow),
//                  REEF (bommies), EEL, FISHLET (small gold fish over every reef head), MOTE (plankton; gold inside a
//                  beam or the shaft), SHARK (the whale shark: spots, bars, ribs, gills, remoras).
//   2. MOODS       the four seeded looks (squall / golden / dawn / night): water, far water, window, sun, fog tints,
//                  rain, shaft, beam and gap schedules, exposure and grade. Chosen in build() from ctx.vary.hour or ctx.rng.
//   3. helpers     reefBuilder(), sharkGeometry() (the lofted whale shark: flat head, mouth cavity, ribs, fins, remoras)
//   4. build()     cast (mood, turn direction, tiers, melanistic share, mote density; all rng draws first)
//                  -> hero (placed at y -28; opts.turn -1 mirrors the whole world in z, see X())
//                  -> PATH: the hero's flyThrough anchor (the brief's line), smoothed and resampled every 1.5 m
//                  -> backdrop, ceiling, sand, the bommies (fourteen out in the bay and up to eight low heads under the
//                     wall, scattered per seed, none within 7 m of the path; one merged mesh), their fish, garden eels, weed scraps and leaves under the ceiling, plankton,
//                     the whale shark (SHARK_KEYS: its centre keyed to u; lowered in build() if it would come within
//                     3.3 m of the path)
//                  -> POIS, pace(u), portal, POST in the returned object
//                  -> update(): everything keyed to u is in one block.
// SCRIPTED (u is the fraction of path LENGTH, about 149 m in 50 s)
//   0-0.056 the floor, 0.056-0.124 the rosette, 0.124-0.22 the low orbit (the lens rides IN the bottom tier's lane,
//   half a metre under and inside its line: every animal comes at it mouth first and slides round it), 0.22-0.327 over
//   the backs, 0.327-0.437 the whale shark, 0.437-0.488 the wall closes, 0.488-0.61 the gold shaft, 0.61-0.70 the well,
//   0.70-0.786 the flare, 0.786-0.897 under the rain, 0.897-1 the ring (the last 12.5 m dead straight).
//   GAZE             replayed in the page with the engine's own pose, speed easing and slerp (60 Hz), both cameras.
//                    One poi on the rosette over the whole opening, laneAt rests on the lane 3.4 m ahead, sandAt
//                    runs round ahead of us on the sand at one height, sharkPoi stays on one point of the whale
//                    shark's flank for the whole pass, and from the gold shaft on one poi (gazeAt, weight 1) takes
//                    the gaze through three aims FIXED IN THE WORLD: the middle of the far wall across the gold pool
//                    (the well), the sky under the sun's gap, the ring: one smooth blend from each to the next,
//                    even in time. The steady camera has ONE poi of its
//                    own under it (steadyAt), solved so that it follows a fifth of the same pull.
//   SOMERSAULTER     one, beside the column's head, looping on the WORLD CLOCK from a seeded phase, its loop's plane
//                    through the funnel's axis (the hero's cast). Nothing about it is keyed to u.
//   SHARK            sharkAt(u): cruising in low from the east from the start, under our keel (4.4 m down) as we come
//                    over the backs, turning north inside our own turn, its head abreast and then its flank beside the
//                    lens (axis 3.4-3.9 m off), out through the wall as the wall closes, scaled away over u 0.60-0.66
//                    (30 m out, behind the wall). Its own school rides its snout in its own frame for as long as it is
//                    there (hero.setBow), floor uShk draws its shadow, eels sink before it; its keep-out
//                    (hero.setCapsule) runs snout to tail tip and holds every manta 4.5 m and more from its line.
//   FUSILIERS        ten schools live in the WORLD: each circles the funnel at its own seeded inset, height, turn
//                    rate and rise on the world clock, as a teardrop, an arc or a ball (the hero's cast). None is placed
//                    by u or by the lens.
//   SAND             pale rippled sand under drifting fields of cloud light and shade, the wing shadows of the three
//                    lowest tiers (hero.setShadow), reef-head shadows, 900 garden eels (40 cm), caustic
//                    lines, and from the tear the gold disc with the top tiers' diamond shadows wheeling through it.
//   hero.setShaft    squall: 0 until the tear (u 0.488-0.545), then 1; golden: there from the start. ONE ease by where
//                    the lens is: within the shaft's own radius of its axis the glare is eased by the mood's share
//                    (the lens looks along the column there), and the brief's ease to 0.6 over u 0.86-0.92.
//                    The eight narrow beams keep the mood's one strength for the whole ride.
//   CEIL uGap        the torn gap: M.gap[0] until the tear, M.gap[1] after; uRiftQ: the rift runs out of it over the
//                    same span (M.rift) toward the west side of the window
//   CEIL uRing.z     the dark cloud bank stands over the ring from u 0.74-0.84
//   hero.setBreach   only when ctx.vary.rare: one manta breaches through the ceiling over u 0.80-0.85
//                    (CEIL uHole: the torn water lingers and closes)
//   through          while ctx.through (seen through the previous portal) the fog thins with the lens's distance behind
//                    the entry, and the hero hides every animal between the lens and the entry plane (hero.setThrough)
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { buildHero, NOISE_GLSL, FOG_FADE_GLSL, SHAFT_FN_GLSL, BEAM_GLSL } from '../parts/manta-cyclone.js';

const FLOOR = -28;
const S = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------------------------------------------ 1. GLSL
const W_VERT = /* glsl */`
varying vec3 vW;
varying vec3 vN;
varying vec3 vCol;
#include <fog_pars_vertex>
`;
const W_PARS = /* glsl */`
uniform float uTime;
uniform vec3 uAmbUp;
uniform vec3 uAmbDown;
uniform vec3 uKeyCol;
uniform vec3 uSunCol;
uniform float uSun;
uniform float uCaustic;
uniform float uShaft;
uniform vec3 uShaftB;
uniform float uShaftR;
uniform vec3 uFogUp;
uniform vec3 uFogDn;
uniform vec3 uSunW;
uniform float uTurn;
uniform vec3 uShaftA;
uniform vec3 uShaftCol;
uniform vec3 uFogFar;
uniform float uFogFarK;
varying vec3 vW;
varying vec3 vN;
varying vec3 vCol;
#include <fog_pars_fragment>
${NOISE_GLSL}
${SHAFT_FN_GLSL}
${BEAM_GLSL}
// a world point in the hero's local space (y above the sand; z mirrored when the column turns the other way)
vec3 toHero(vec3 w) { return vec3(w.x, w.y + 28.0, w.z * uTurn); }
// the broad shaft's light in the water between the lens and this fragment
vec3 wGlow() { return shaftGlow(toHero(cameraPosition), toHero(vW), 1.0); }
// the water a thing fades into: cyan-blue looking up, deep blue looking down, and deeper blue far from the lens
#ifdef USE_FOG
vec3 wFogCol(float h, float f) {
  return mix(fogColor, uFogFar, uFogFarK * smoothstep(0.3, 1.0, f)) * mix(vec3(1.0), uFogUp, smoothstep(0.0, 0.64, h)) * mix(vec3(1.0), uFogDn, smoothstep(0.0, 0.5, -h));
}
#endif
// clear scales the fog's thickness (a huge value: water at infinity, whatever the density); keep is how much of the
// blue stays behind the broad shaft (0.3 for water, sand, ceiling and animals, so the column runs unbroken from the
// water onto the ceiling); veil scales the shaft's own light laid over the thing (the sand inside the gold disc takes
// less of it: we look down the whole length of the column there, and a full veil would hide the shadows in the disc)
vec3 wFogKV(vec3 col, float clear, float keep, float veil) {
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fd = min(vFogDepth * fogDensity * clear, 30.0);
    float f = 1.0 - exp(-fd * fd);
  #else
    float f = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  float h = normalize(vW - cameraPosition + vec3(0.0, 1e-5, 0.0)).y;
  // the shaft is gold light, not white: where it glows it also takes the blue out of the water behind it
  vec3 g = wGlow() * veil;
  vec3 gold = uShaftWarm / max(max(uShaftWarm.r, uShaftWarm.g), 1e-3);
  return mix(col, wFogCol(h, f), f) * mix(vec3(1.0), keep + (1.0 - keep) * gold, clamp(max(g.r, g.g) * 2.2, 0.0, 1.0)) + g;
#else
  return col + wGlow() * veil;
#endif
}
vec3 wFogK(vec3 col, float clear, float keep) { return wFogKV(col, clear, keep, 1.0); }
vec3 wFog(vec3 col, float clear) { return wFogKV(col, clear, 0.3, 1.0); }
`;
const PLANE_VERT = /* glsl */`
${W_VERT}
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vN = vec3(0.0, 1.0, 0.0); vCol = vec3(1.0);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
// the backdrop: a wall of water at infinity that follows the lens between sand and ceiling. It carries the same fog
// colour and the same shaft light as the two planes, so the glow runs unbroken from sand to ceiling
const BACK_FRAG = /* glsl */`
${W_PARS}
void main() { gl_FragColor = vec4(wFog(vec3(0.0), 1000.0), 1.0); }
`;
// the underside of the sea: Snell's window holding the whole sky, a dark mirror outside it, rain over both: thin rings
// near the lens, a fine shimmer of sparks further off
const CEIL_FRAG = /* glsl */`
${W_PARS}
uniform float uRain;
uniform float uRagged;
uniform float uGap;
uniform float uGapW;      // how wide the gap round the sun is (in q)
uniform vec2 uRiftQ;      // where the tear in the cloud ends: it runs from the sun's place (uMoonQ) to here
uniform float uMoon;
uniform float uBio;
uniform vec2 uMoonQ;
uniform vec3 uRing;       // xz of the cloud bank that stands behind the exit ring, strength
uniform vec4 uHole;       // the breach: xz, radius, strength
uniform vec3 uCloud;
uniform vec3 uCloudDark;
uniform vec3 uGapCol;
uniform vec3 uGapTint;    // the blaze outside its core (gold by day; only the core is white)
uniform vec3 uMirror;
// one hashed cell per octave: a ring is born anywhere in its cell, widens for 0.7 s and dies, then the cell rests. The
// line keeps its own width (1-3 cm) plus under a pixel of filter: where a pixel is wider than the line it DIMS, it does
// not grow, so a ring 15 m off is a faint hair, never a disc
vec3 ring(vec2 p, float cell, float t, float fw) {
  vec2 g = p / cell;
  vec2 id = floor(g), f = fract(g);
  float h = h21(id), rate = 0.55 + 0.35 * h21(id + 7.7);
  float ck = t * rate + h * 9.0;
  float life = fract(ck) * 2.4;
  float ep = floor(ck);
  float rmax = min(0.3, 0.3 * cell), m = 0.75 * rmax / cell + 0.02;
  vec2 c = m + (1.0 - 2.0 * m) * vec2(h21(id + ep * 0.37 + 3.1), h21(id - ep * 0.53 + 5.9));
  float on = step(life, 1.0);
  float rd = length(f - c) * cell;
  float d = abs(rd - min(0.05 + 0.24 * life * cell, rmax));                           // rings 0.1 to 0.6 m across
  float w = 0.01 + 0.018 * life;
  float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y)) * cell;
  float far = (1.0 - smoothstep(0.05, 0.2, fw / cell)) * smoothstep(0.0, 0.05, edge);
  float line = (1.0 - smoothstep(w, w + fw * 0.75 + 0.003, d)) * (w / (w + fw)) * (1.0 - life) * (1.0 - life) * on * far;
  float splash = (1.0 - smoothstep(0.0, 0.05 + fw * 0.75, rd)) * (0.05 / (0.05 + fw)) * (1.0 - life) * on * far;
  // the fringe: bubbles the drop drove down, a 10 cm band of beads round the ring that dips and comes back up (each
  // bead on its own beat); beads smaller than a pixel melt into a faint band
  vec2 bq = (f - c) * cell * 30.0;
  float bead = 1.0 - smoothstep(0.12, 0.42, length(fract(bq) - 0.5));
  float bh = h21(floor(bq) + id * 3.7);
  bead *= step(0.45, bh) * max(0.45 + 0.55 * sin(t * 5.0 + bh * 40.0), 0.0);
  float fringe = (1.0 - smoothstep(0.015, 0.06, d)) * mix(bead, 0.14, smoothstep(0.008, 0.03, fw)) * (1.0 - life) * on * far;
  return vec3(line, splash, fringe);
}
// beyond the reach of the rings: one soft spark in a cell a few pixels wide, each on its own clock
float spark(vec2 p, float cs, float t) {
  vec2 g = p / cs, id = floor(g), f = fract(g);
  float h = h21(id + 0.37);
  float ph = fract(t * (0.5 + 0.7 * h21(id + 4.1)) + h * 11.0);
  vec2 c = 0.3 + 0.4 * vec2(h21(id + 1.3), h21(id + 8.7));
  return (1.0 - smoothstep(0.1, 0.34, length(f - c))) * step(0.68, h) * smoothstep(0.0, 0.12, ph) * (1.0 - smoothstep(0.12, 0.5, ph));
}
void main() {
  vec3 V = normalize(vW - cameraPosition + vec3(0.0, 1e-5, 0.0));
  vec2 p = vW.xz;
  vec2 fwv = fwidth(p);
  float fw = max(fwv.x, fwv.y);
  float t = uTime;
  float n1 = vn(p * 0.35 + vec2(t * 0.11, -t * 0.07)), n2 = vn(p * 1.3 - vec2(t * 0.23, t * 0.17));
  float rip = (n1 - 0.5) + 0.5 * (n2 - 0.5);
  // three octaves on grids turned against one another, so no lattice shows
  vec2 p2 = vec2(p.x * 0.8 - p.y * 0.6, p.x * 0.6 + p.y * 0.8) + 13.7, p3 = vec2(p.x * 0.28 + p.y * 0.96, p.y * 0.28 - p.x * 0.96) - 29.1;
  vec3 rr = ring(p, 0.9, t, fw) + ring(p2, 1.3, t * 0.93, fw) + ring(p3, 1.9, t * 0.87, fw);
  float lod = log2(max(fw, 0.004) * 5.0), l0 = floor(lod);
  float shim = mix(spark(p, exp2(l0), t), spark(p + 31.7, exp2(l0 + 1.0), t), lod - l0) * smoothstep(0.035, 0.13, fw) * (1.0 - smoothstep(0.45, 1.3, fw));
  float rings = rr.x * uRain;
  float cosT = abs(V.y) + rip * uRagged + rings * 0.04;
  float win = smoothstep(0.60, 0.69, cosT);
  // the sky squeezed into the window: q is the horizontal part of the refracted ray (0 zenith .. 1 horizon)
  vec2 q = V.xz / 0.75;
  float ql = min(length(q), 1.0);
  vec2 c = q / max(sqrt(max(1.0 - ql * ql, 0.0)), 0.3) + p * 0.004 + vec2(t * 0.012, t * 0.007);
  float cl = vn(c * 1.7) * 0.55 + vn(c * 4.3 + 7.0) * 0.3 + vn(c * 9.7 - 3.0) * 0.15;
  vec3 sky = mix(uCloudDark, uCloud, smoothstep(0.3, 0.72, cl));
  // the squall's darkest bank stands over the exit, so the ring hangs on mirror-dark water, not on bright cloud; inside
  // the bank window and mirror are one tone, so the window's rim does not show there
  float bank = (1.0 - smoothstep(9.0, 27.0, length(p - uRing.xy) + (cl - 0.5) * 9.0)) * uRing.z;
  sky = mix(sky, uMirror * vec3(0.8, 1.0, 1.3) * (1.6 + 2.2 * cl), bank * 0.88);      // (the bank is slate blue, not neutral grey)
  win *= 1.0 - 0.9 * bank;
  // the tear: widest and brightest round the sun, running out from it along a ragged rift in the cloud
  vec2 ra = uRiftQ - uMoonQ;
  float rt = clamp(dot(q - uMoonQ, ra) / max(dot(ra, ra), 1e-4), 0.0, 1.0);
  float gd = length(q - uMoonQ - ra * rt) + (cl - 0.5) * 0.3 + (vn(c * 9.7 - 3.0) - 0.5) * 0.1 + 0.05 * rt * sin(rt * 9.0 + cl * 6.0);
  float gap = (1.0 - smoothstep(0.03 * (1.0 - rt), mix(uGapW, 0.15, rt), gd)) * uGap * (1.0 - 0.55 * rt);
  // a ragged blaze of pale gold, luminous through its whole body, with only its core (round the sun) white. Where the
  // tear is thin (its edge, the rift, the gap before the squall tears) it is the cloud itself lit from behind: silver,
  // brighter and a little warm, then cream, then gold. Never a dull orange laid over grey cloud, which reads as tan
  float core = smoothstep(0.94, 1.0, gap) * (1.0 - 0.6 * rt);
  float body = smoothstep(0.45, 0.85, gap);
  vec3 silver = sky * (1.0 + 2.2 * gap) + uGapCol * (0.22 * gap);
  vec3 gapLit = uGapCol * mix(uGapTint, vec3(1.0), core) * (0.88 + 1.3 * core) * body;
  sky = silver * (1.0 - body) + gapLit;
  // gold threads fan out from the tear across the window: the sun's rays in the water, seen from below, all running
  // out from where the sun stands (a sum of whole multiples of the bearing, so there is no seam), drifting and
  // flickering; they come with the tear and die away toward the window's rim
  vec2 dq = q - uMoonQ;
  float tb = atan(dq.y, dq.x + 1e-5), tr = length(dq);
  float th1 = 0.5 + 0.5 * sin(tb * 13.0 + 2.0 * sin(tb * 4.0 + t * 0.13) + t * 0.07);
  float th2 = 0.5 + 0.5 * sin(tb * 31.0 - t * 0.19 + 1.7 * sin(tb * 7.0 - t * 0.05));
  float threads = smoothstep(0.55, 1.0, th1) * (0.45 + 0.55 * th2) * smoothstep(0.05, 0.22, tr) * (1.0 - smoothstep(0.3, 0.95, tr)) * (0.6 + 0.4 * cl);
  sky += uGapCol * uGapTint * uGapTint * (threads * 0.62 * smoothstep(0.5, 1.0, uGap) * (1.0 - uMoon));
  sky *= mix(0.6, 1.0, 1.0 - smoothstep(0.55, 1.0, ql)) * (1.0 + 0.25 * rip);
  // night: a small hard moon (wobbling with the ripples) and its halo, where the sun would stand by day
  float md = length(q - uMoonQ + rip * 0.02);
  sky += uGapCol * uMoon * (6.0 * (1.0 - smoothstep(0.04, 0.052, md)) + 0.5 * exp(-md * 7.0) + 0.25 * cl * exp(-md * 2.5));
  vec3 mir = uMirror * (0.75 + 0.6 * n1 + 0.5 * rip);
  vec3 col = mix(mir, sky, win);
  col += gapLit * (1.0 - win) * 0.45 * smoothstep(0.52, 0.66, cosT);      // the blaze burns through the dark bank too: no hard edge where the bank begins
  float drops = rings * mix(0.8, 0.55, win) + (rr.y * 0.1 + rr.z * 0.3 + shim * 0.16) * uRain;
  col += uCloud * drops;
  col += vec3(0.12, 0.85, 0.7) * uBio * drops * 0.5 * (1.0 - smoothstep(8.0, 22.0, distance(vW, cameraPosition)));   // night: the nearest drops spark, a faint twinkle
  // the breach: a ragged hole of bright sky where the animal went through, ringed by a crown of white water; the sky
  // closes first (uHole.w under 0.5) and leaves a broken ring of foam that thins away
  float hd = length(p - uHole.xy) + (n2 - 0.5) * 0.7;
  float foam = vn(p * 5.0 + vec2(t * 0.3, -t * 0.2));
  float hole = (1.0 - smoothstep(uHole.z * 0.6, uHole.z, hd)) * smoothstep(0.5, 0.9, uHole.w);
  float crown = (1.0 - smoothstep(0.0, 0.5, abs(hd - uHole.z * 1.05))) * uHole.w;
  float froth = (1.0 - smoothstep(uHole.z * 0.3, uHole.z * 1.1, hd)) * uHole.w * smoothstep(0.5, 0.78, foam);
  col = mix(col, uCloud * 1.25 + uGapCol * 0.5, hole) + uCloud * (crown * (0.3 + 1.1 * n2) * (0.5 + foam) + froth * 0.5);
  gl_FragColor = vec4(wFog(col, 1.0), 1.0);
}
`;
// the sand: rippled (three sets of ripples 0.33 to 0.55 m apart, 25 to 45 degrees between them, each holding the sand in patches
// ten metres across, crests wandering and forking where two sets meet), mottled, lit by a caustic net and by thin bright caustic lines near
// the lens, dark feet under the bommies, coins of gold where the narrow beams stand, the whale shark's shadow, and the
// foot of the broad shaft: a gold disc with the diamond shadows of the top tiers wheeling through it, the sand round it
// back under the squall's cloud. Nothing on it is stretched into streaks toward the horizon: patterns with no direction
// of their own (mottle, the caustic net) fade by how far the sand is foreshortened on screen (stretch 1 looking
// straight down, 3 at 19 degrees, 6.5 at 9: gone), ripples and lines by the pixel's footprint as well.
const FLOOR_FRAG = /* glsl */`
${W_PARS}
uniform vec4 uBom[22];   // reef heads: x, z, radius, height
uniform vec3 uSand;
uniform vec3 uSandDark;
uniform vec3 uWheel;      // phase of the inner lane, its tiers, strength of the sand pool
uniform vec3 uDisc;       // x: how far the pool is a clear disc (the broad shaft stands), y: how far the sand round it is dimmed, z: the disc's light
uniform vec4 uShkA;       // the whale shark's body axis in the hero's space: nose (xyz), 1 while it is about
uniform vec3 uShkB;       // tail
uniform float uSandK;     // how far the sand's light is drawn toward warm white (day 0.7: pale coral sand; night 0.15: moonlit grey)
// diamond shadows in the gold disc. The top five tiers swim through the broad shaft on the sun's side, and their
// shadows come down it onto its foot: each tier's shadows ride a ring of the tier's own radius that passes through the
// disc (five rows 1.8 m apart, the middle one through its centre), thirteen to the ring, half a spacing out of step
// from row to row (so the diamonds nest and never merge), turning at the lane's rate and the way the animals above swim
float wingShade(vec2 pl) {
  float sh = 0.0;
  for (int k = 0; k < 5; k++) {
    float fk = float(k), tier = max(uWheel.y - 1.0 - fk, 0.0);
    float y = 3.2 + tier * 20.8 / max(uWheel.y - 1.0, 1.0), rk = 11.1 + 4.0 * clamp((y - 2.0) / 24.0, 0.0, 1.0);
    vec2 q = pl - uShaftB.xz - vec2(0.0, rk + 3.6 - 1.8 * fk);
    float rq = length(q);
    float ph = (atan(-q.y, q.x + 1e-4) - uWheel.x - 0.14 * uTime) * (13.0 / 6.2831853) + 0.5 * fk;
    float du = (fract(ph + 0.5) - 0.5) * (6.2831853 / 13.0) * rq, dv = rq - rk;
    float d = abs(dv) / 1.75 + abs(du) / 1.05 + 0.25 * du * du;
    // (soft, in metres of the sand: a shadow lands with an edge a tenth as wide as the height y it has fallen through
    // the water, the light under a ruffled surface being spread over some six degrees; soft is half that width on the
    // diamond's own measure d, which rises 1.11 for each metre across the diamond's edge. And the wider its edge the
    // paler the shadow, its whole darkness kept: under such an edge the diamond's area grows by soft * soft / 5)
    float soft = 0.5 * 0.1 * y * 1.11;
    sh = max(sh, (1.0 - smoothstep(1.0 - soft, 1.0 + soft, d)) * (1.0 - 0.07 * fk) / (1.0 + 0.2 * soft * soft));
  }
  return sh;
}
float crest(float ph) { return sin(ph) + 0.3 * sin(2.0 * ph + 1.0); }
void main() {
  vec2 p = vW.xz;
  vec2 fwv = fwidth(p);
  float fw = max(fwv.x, fwv.y);
  vec3 Vd = normalize(vW - cameraPosition + vec3(0.0, 1e-5, 0.0));
  float stretch = 1.0 / max(abs(Vd.y), 0.03);
  float flatK = mix(0.4, 1.0, 1.0 - smoothstep(2.6, 6.5, stretch));
  float big = vn(p * 0.07 + 3.0), mid = vn(p * 0.31 + 11.0), grain = vn(p * 19.0);
  // ripples: which set holds the sand here (wA, wB, wC sum to 1), and a short-range shear that makes the crests wander
  vec2 wv = vec2(vn(p * 0.47 + 7.0), vn(p * 0.47 + 31.0)) - 0.5;
  float wA = smoothstep(0.34, 0.62, vn(p * 0.09 + 21.0)), wB = (1.0 - wA) * smoothstep(0.38, 0.64, vn(p * 0.12 - 9.0)), wC = 1.0 - wA - wB;
  vec2 wv2 = vec2(vn(p * 1.3 + 17.0), vn(p * 1.3 - 23.0)) - 0.5;              // a finer shear: crests fork and rejoin every metre
  float phA = dot(p, vec2(0.97, 0.26)) * 14.5 + 4.0 * wv.x + 1.2 * mid + 1.5 * wv2.x;        // 0.43 m apart
  float phB = dot(p, vec2(0.64, 0.77)) * 19.0 + 4.2 * wv.y + 1.5 * wv2.y;                    // 0.33 m
  float phC = dot(p, vec2(0.87, -0.5)) * 11.5 + 3.6 * (wv.x - wv.y) - 1.5 * wv2.x;           // 0.55 m
  float rA = 1.0 - smoothstep(0.55, 1.5, fwidth(phA)), rB = 1.0 - smoothstep(0.55, 1.5, fwidth(phB)), rC = 1.0 - smoothstep(0.55, 1.5, fwidth(phC));
  // (a set of ripples seen along its own crests on foreshortened sand is a comb of parallel bars: each set fades where
  // the view lies within about twenty degrees of its crests, the more the flatter the sand is seen)
  vec2 Vh = normalize(Vd.xz + vec2(1e-5, 0.0));
  float endK = smoothstep(1.5, 3.5, stretch);
  rA *= mix(1.0, smoothstep(0.1, 0.4, abs(dot(Vh, vec2(0.97, 0.26)))), endK);
  rB *= mix(1.0, smoothstep(0.1, 0.4, abs(dot(Vh, vec2(0.64, 0.77)))), endK);
  rC *= mix(1.0, smoothstep(0.1, 0.4, abs(dot(Vh, vec2(0.87, -0.5)))), endK);
  float rip = (wA * rA * crest(phA) + wB * rB * crest(phB) + wC * rC * crest(phC)) * (1.0 - 0.6 * smoothstep(4.0, 10.0, stretch));
  float rAll = wA * rA + wB * rB + wC * rC;
  float shade = 1.0 + 0.14 * rip;
  vec3 alb = uSand * (0.8 + 0.26 * big + 0.12 * mix(0.5, mid, flatK)) * shade * (0.93 + 0.14 * grain * rAll);
  alb = mix(alb, uSandDark, smoothstep(0.52, 0.8, vn(p * 0.13 + 40.0)) * 0.3 * flatK);
  // every reef head stands in its own contact shade and throws a soft shadow away from the sun, as long as it is tall
  float dark = 0.0, castSh = 0.0;
  for (int i = 0; i < 22; i++) {
    vec2 bd = p - uBom[i].xy;
    float d = length(bd) + (mid - 0.5) * 1.6;
    dark = max(dark, 1.0 - smoothstep(uBom[i].z * 0.9, uBom[i].z * 2.1, d));
    vec2 sd2 = bd - vec2(0.0, uTurn * 0.45 * uBom[i].w);
    castSh = max(castSh, 1.0 - smoothstep(0.75, 1.25, length(sd2 * vec2(1.0, 0.8)) / max(uBom[i].z, 0.1) + (mid - 0.5) * 0.25));
  }
  alb = mix(alb, uSandDark * 0.6, dark * 0.8);
  float skip = smoothstep(0.9, 1.0, vn(vec2(p.x * 7.0 - uTime * 1.1, p.y * 7.0))) * max(sin(phA), 0.0) * rA * wA;   // grains skipping along the crests
  float r = length(p);
  float under = 1.0 - 0.12 * smoothstep(8.0, 13.0, r) * (1.0 - smoothstep(18.0, 30.0, r));     // the wall's own shade; the floor of the eye is open to the sky
  // caustics: the broad net with a finer, quicker one crawling through it (the troughs between the lines stay lit), and
  // near the lens a net of thin bright lines; each fades where a pixel is wider than its lines or the sand is foreshortened
  float fineK = 1.0 - smoothstep(0.12, 0.5, fw);
  float cau = mix(0.55, mix(caustic(p, uTime), caustic(p * 2.7 + 17.0, uTime * 1.35), 0.6 * fineK), flatK);
  float cline = smoothstep(1.3, 2.1, caustic(p * 6.1 - 5.0, uTime * 1.7)) * (1.0 - smoothstep(0.02, 0.1, fw)) * (1.0 - smoothstep(3.0, 7.0, stretch));
  float dapple = mix(1.0, 0.36 + 0.74 * cau, max(uCaustic, 0.85)) + 0.34 * cline;
  // the squall's cloud is broken: its light and shade drift over the sand in soft fields 20 m and more across (under
  // them the sand keeps its own colour and four fifths of its light), and each reef head's shadow lies in it
  float cloudSh = smoothstep(0.3, 0.7, vn(p * 0.05 + vec2(uTime * 0.021, -uTime * 0.013)) * 0.65 + vn(p * 0.13 - vec2(uTime * 0.03, uTime * 0.017)) * 0.35);
  float fieldK = mix(0.74, 1.06, cloudSh) * (1.0 - 0.4 * castSh);
  vec2 pl = vec2(p.x, p.y * uTurn);
  // the sand pool: a broad warm wash on the sand under the eye and, once the broad shaft stands, its foot: a gold disc
  // with a broken edge, the wing shadows of the top tiers turning through it
  float pd0 = length(pl - uShaftB.xz), pd = pd0 + (mid - 0.5) * 2.0;
  float pool = (1.0 - smoothstep(uShaftR * 0.5, uShaftR * 2.7, pd)) * uWheel.z;
  float disc = (1.0 - smoothstep(uShaftR * 0.92, uShaftR * 1.14, pd0 + (mid - 0.5) * 1.0 + (vn(p * 1.9 + 3.0) - 0.5) * 0.5)) * uDisc.x;
  float wings = disc > 0.004 ? wingShade(pl) : 0.0;
  float dim = uDisc.y * (1.0 - disc / max(uDisc.x, 1e-3));          // round the disc the sand is under the squall's cloud
  // coins of light where the narrow beams stand
  float coin = beamAt(vec3(pl.x, 0.0, pl.y));
  // the whale shark's shadow: a soft capsule carried down the sun's ray
  vec2 sa = uShkA.xz + vec2(0.0, 0.466) * uShkA.y, sb = uShkB.xz + vec2(0.0, 0.466) * uShkB.y, ab = sb - sa;
  float sh = 0.5 * (uShkA.y + uShkB.y);
  float sd = length(pl - sa - ab * clamp(dot(pl - sa, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0));
  float shk = (1.0 - smoothstep(0.35, 1.2 + 0.14 * sh, sd)) * uShkA.w / (1.0 + 0.09 * sh);
  // the sand keeps its own pale colour: its light is drawn toward a warm white as bright as the water's own (lit by the
  // plain blue of the water it goes olive and brown)
  vec3 ambS = mix(uAmbUp, dot(uAmbUp, vec3(0.3, 0.5, 0.2)) * vec3(1.06, 1.0, 0.93), uSandK);
  vec3 keyS = mix(uKeyCol, dot(uKeyCol, vec3(0.3, 0.5, 0.2)) * vec3(1.08, 1.0, 0.9), uSandK * 0.85);
  vec3 light = ambS * under * (0.55 + 0.45 * dapple) * (1.0 - 0.19 * dim) * (0.5 + 0.5 * fieldK) + keyS * uSun * under * dapple * (1.0 - 0.47 * dim) * fieldK
             + (uShaftWarm * 1.5 + uSunCol * 0.2) * pool * (0.4 + 0.75 * cau) * (1.0 - 0.5 * uDisc.x)
             + (uShaftWarm * 0.95 + keyS * 0.2) * uDisc.z * disc * (0.6 + 0.4 * min(cau, 1.6) + 0.25 * cline) * (1.0 - 0.92 * wings)
             + uSunCol * coin * (0.6 + 0.9 * cau);
  float inDisc = disc / max(uDisc.x, 1e-3);
  // (the disc is gold, not cream: the sand in it takes the shaft's own colour)
  vec3 col = alb * mix(vec3(1.0), vec3(1.06, 0.95, 0.7), inDisc) * light * (1.0 - 0.62 * shk) * (1.0 - 0.6 * wings * inDisc) + uKeyCol * skip * 0.12;
  // (inside the disc the column's own veil is thinned to two fifths, and under a wing shadow to a quarter: a shadow
  // in the disc is a hole in the lit water above it too)
  gl_FragColor = vec4(wFogKV(col, 0.7, 0.3, 1.0 - inDisc * (0.6 + 0.15 * wings)), 1.0);
}
`;
// bommies: world-space merged geometry; aSway = (metres of bend with the surge, phase)
const REEF_VERT = /* glsl */`
attribute vec3 color;
attribute vec2 aSway;
uniform float uTime;
${W_VERT}
void main() {
  vec3 wp = position;
  float s = sin(uTime * 0.8 + aSway.y + position.x * 0.25);
  wp.x += aSway.x * s; wp.z += aSway.x * 0.4 * sin(uTime * 0.6 + aSway.y * 1.7);
  wp += normal * 0.035 * step(5.0, aSway.y) * sin(uTime * 1.6 + aSway.y * 3.0);        // soft corals pulse
  vW = wp; vN = normal; vCol = color;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const REEF_FRAG = /* glsl */`
${W_PARS}
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = -N;
  float polyp = vn(vW.xz * 7.0 + vW.y * 5.0), fine = vn(vW.xz * 26.0 + vW.y * 19.0);
  float groove = smoothstep(0.42, 0.5, abs(vn(vW.xz * 1.7 + vW.y * 2.3) - 0.5) * 2.0 + 0.3);   // fissures in the heads
  vec3 alb = vCol * (0.7 + 0.45 * polyp) * (0.86 + 0.28 * fine) * mix(0.45, 1.0, groove);
  // (modelled by the light: tops and the sunward side lit, the side turned from the sun and everything near the sand
  // in a shade half as bright, so a head 30 m off is a lit dome with a dark side, not a flat patch)
  float hemi = smoothstep(-0.45, 1.0, N.y);
  float ao = mix(0.52, 1.0, smoothstep(0.0, 1.8, vW.y + 28.0));
  float cau = caustic(vW.xz + vW.y * 0.3, uTime);
  float sunSide = dot(N, uSunW);
  vec3 light = mix(uAmbDown * 0.46, uAmbUp * 0.9, hemi) * ao * (0.72 + 0.28 * smoothstep(-0.6, 0.5, sunSide))
             + uKeyCol * uSun * max(sunSide * 0.9 + 0.1, 0.0) * 1.3 * mix(1.0, cau, uCaustic) * ao;
  vec3 col = alb * light + uAmbUp * 0.08 * pow(max(1.0 - abs(dot(N, V)), 0.0), 3.0);
  gl_FragColor = vec4(wFog(col, 0.8), 1.0);
}
`;
// garden eels: question marks swaying in the surge; they sink as wing shadows sweep over, as the whale shark's shadow
// comes, and under the lens
const EEL_VERT = /* glsl */`
attribute vec4 iEel;      // x, z, seed, height
uniform float uTime;
uniform float uTurn;
uniform vec2 uWheel;      // phase and angular rate of the bottom tier
uniform vec4 uShkA;
uniform vec3 uShkB;
${W_VERT}
void main() {
  float t = position.y, sd = iEel.z;
  vec2 b = iEel.xy;
  float r = length(b);
  float ang = atan(-b.y * uTurn, b.x + 1e-4);
  float sweep = pow(0.5 + 0.5 * sin(13.0 * (ang - uWheel.x - uWheel.y * uTime)), 3.0) * (1.0 - smoothstep(13.0, 23.0, r)) * smoothstep(6.0, 10.0, r);
  float near = 1.0 - smoothstep(1.6, 4.2, distance(cameraPosition, vec3(b.x, -28.0, b.y)));
  // the whale shark: the field sinks in a wave ahead of its shadow and rises again behind it
  vec2 pl = vec2(b.x, b.y * uTurn), ab = uShkB.xz - uShkA.xz;
  float along = dot(pl - uShkA.xz, ab) / max(dot(ab, ab), 1e-4);
  float sdist = length(pl - uShkA.xz - ab * clamp(along, -0.6, 1.0));
  float shark = (1.0 - smoothstep(2.5, 6.5, sdist)) * uShkA.w * (1.0 - smoothstep(4.0, 9.0, uShkA.y));
  float H = iEel.w * (1.0 - clamp(max(max(sweep * 0.9, near), shark), 0.0, 0.97));
  float ph = uTime * (0.8 + 0.5 * sd) + sd * 40.0;
  float hook = t * t;
  vec3 wp = vec3(b.x, -28.0 + t * H * (1.0 - 0.18 * hook), b.y);
  float fa = (fract(sd * 7.31) - 0.5) * 2.6; vec2 fd = vec2(cos(fa), sin(fa));
  float lean = 0.22 + 0.2 * fract(sd * 13.7);
  wp.x += H * 0.2 * t * sin(ph);
  wp.xz += fd * (H * (lean * hook * hook + 0.1 * hook * sin(ph * 1.7 + t * 3.0)));
  wp.z += H * 0.16 * t * cos(ph * 0.8 + sd * 9.0);
  float rad = max(0.02 * (1.0 - 0.3 * t), distance(wp, cameraPosition) * 0.0017);
  wp.xz += position.xz * rad;
  vW = wp; vN = vec3(position.x, 0.4, position.z);
  float dots = step(0.55, fract(t * 6.0 + sd * 3.0));
  vCol = mix(vec3(0.6, 0.53, 0.37), vec3(0.07, 0.07, 0.05), dots * 0.75) * (0.5 + 0.5 * t);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const EEL_FRAG = /* glsl */`
${W_PARS}
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  // (an eel is a pale cream animal: it takes the sky's light as the sand does, by its brightness and warm, so the
  // field never reads as blue grass)
  vec3 sky = mix(uAmbUp, vec3(dot(uAmbUp, vec3(0.3, 0.5, 0.2))) * vec3(1.12, 1.0, 0.8), 0.75);
  vec3 light = sky * (0.55 + 0.45 * N.y) + uKeyCol * uSun * mix(1.0, caustic(vW.xz, uTime), uCaustic) + uSunCol * beamAt(toHero(vW)) * 0.6;
  gl_FragColor = vec4(wFog(vCol * light, 0.7), 1.0);
}
`;
// the small fish over the reef heads: iHome = station (world) and seed; each wanders about its station, faces the surge
// and beats its tail; all of them duck toward the coral while the lens is near
const FISHLET_VERT = /* glsl */`
attribute vec4 iHome;
uniform float uTime;
${W_VERT}
void main() {
  float sd = iHome.w, t = uTime * (0.6 + 0.6 * sd);
  vec3 off = vec3(sin(t * 0.9 + sd * 40.0) + 0.4 * sin(t * 2.3 + sd * 11.0), 0.5 * sin(t * 1.3 + sd * 17.0), cos(t * 0.7 + sd * 29.0) + 0.4 * sin(t * 1.9 + sd * 7.0)) * (0.3 + 0.45 * fract(sd * 7.0));
  vec3 c = iHome.xyz + off;
  float duck = 1.0 - smoothstep(5.0, 10.0, distance(cameraPosition, c));
  c.y = mix(c.y, -28.0 + 0.6 * (c.y + 28.0), duck);
  float yaw = 0.5 * sin(t * 0.5 + sd * 23.0) + 0.9 * sin(sd * 60.0) + 0.6 * cos(t * 0.9 + sd * 40.0);
  vec3 f = vec3(cos(yaw), 0.12 * cos(t * 1.3 + sd * 17.0), sin(yaw)), r = vec3(-f.z, 0.0, f.x), u = vec3(0.0, 1.0, 0.0);
  vec3 q = position;
  q.x += 0.12 * sin(uTime * 9.0 + sd * 80.0 + q.z * 5.0) * (0.5 - q.z);
  float size = (0.15 + 0.08 * fract(sd * 13.0)) * max(1.0, distance(cameraPosition, c) * 0.05);
  vec3 wp = c + (r * q.x + u * q.y + f * q.z) * size;
  vW = wp; vN = normalize(r * position.x * 3.0 + u * (position.y * 2.0 + 0.5) + vec3(0.0, 1e-4, 0.0));
  // gold flank, darker back, a paler tail
  vCol = mix(vec3(0.95, 0.42, 0.07), vec3(1.0, 0.72, 0.16), fract(sd * 5.0)) * mix(0.55, 1.25, smoothstep(-0.1, 0.12, -position.y + 0.02)) * (0.9 + 0.5 * step(position.z, -0.25));
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
// weed scraps and mangrove leaves washed out by the squall: they hang just under the ceiling among the rain rings,
// turning slowly and bobbing; seen from below they are dark shapes with the window's light coming through them.
// iLeaf = x, z, seed, length in metres (below 0: a weed scrap, longer, narrow and lobed)
const LEAF_VERT = /* glsl */`
attribute vec4 iLeaf;
uniform float uTime;
${W_VERT}
void main() {
  float sd = iLeaf.z, weed = step(iLeaf.w, 0.0), t = position.z + 0.5;
  vec3 c = vec3(iLeaf.x + 0.4 * sin(uTime * 0.11 + sd * 31.0), -0.22 - 0.9 * fract(sd * 9.7) + 0.05 * sin(uTime * 0.9 + sd * 30.0), iLeaf.y + 0.4 * cos(uTime * 0.09 + sd * 17.0));
  float size = abs(iLeaf.w) * max(1.0, distance(cameraPosition, c) * 0.09);
  vec3 q = position;
  float prof = pow(max(sin(3.14159 * clamp(t, 0.0, 1.0)), 0.0), 0.8);
  q.x *= prof * mix(0.2, 0.13 * (0.65 + 0.45 * sin(t * 19.0 + sd * 40.0)), weed);
  q.y = mix(2.5 * q.x * q.x, 0.14 * sin(t * 5.0 + sd * 9.0 + uTime * 0.6), weed) - 0.1 * (t - 0.5) * (t - 0.5);
  float yaw = sd * 40.0 + uTime * (0.12 + 0.3 * fract(sd * 7.0)) * (fract(sd * 3.0) < 0.5 ? 1.0 : -1.0);
  float pit = 0.6 * sin(uTime * 0.37 + sd * 20.0), ro = sd * 9.0 + uTime * (0.15 + 0.35 * fract(sd * 13.0));
  vec3 f = vec3(cos(yaw) * cos(pit), sin(pit), sin(yaw) * cos(pit));
  vec3 r0 = normalize(vec3(-f.z, 0.0, f.x) + vec3(1e-5, 0.0, 0.0)), u0 = cross(r0, f);
  vec3 r = r0 * cos(ro) + u0 * sin(ro), u = cross(r, f);
  vec3 wp = c + (r * q.x + u * q.y + f * q.z) * size;
  vW = wp; vN = u;
  vCol = mix(mix(vec3(0.3, 0.3, 0.07), vec3(0.42, 0.24, 0.05), fract(sd * 5.0)), vec3(0.3, 0.23, 0.06), weed) * (0.55 + 0.45 * smoothstep(0.0, 0.25, abs(position.x)));
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const LEAF_FRAG = /* glsl */`
${W_PARS}
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = -N;
  float thru = smoothstep(0.0, 0.6, -V.y) * (0.4 + 0.6 * abs(N.y));        // seen from below: the sky's light through the blade
  vec3 light = uAmbUp * (0.45 + 0.4 * N.y) + uAmbDown * 0.3 + uKeyCol * uSun * (0.2 + 1.1 * thru);
  gl_FragColor = vec4(wFog(vCol * light, 1.0), 1.0);
}
`;
// plankton: soft motes in a box that wraps the camera; half ride the wheel about the axis, half drift with the
// surge, and each is drawn as a short streak along its own motion. Sparse and dim in the clear water, bright and gold
// wherever a beam or the broad shaft catches them
const MOTE_VERT = /* glsl */`
attribute vec4 iP;
uniform float uTime;
uniform float uTurn;
uniform float uPx;
uniform vec3 uBox;
uniform float uShaft;
uniform vec3 uShaftA;
uniform vec3 uShaftB;
uniform float uShaftR;
varying vec2 vC;
varying float vA;
varying float vG;
#include <fog_pars_vertex>
${BEAM_GLSL}
vec2 rot(vec2 v, float th) { float c = cos(th), s = sin(th) * uTurn; return vec2(v.x * c + v.y * s, v.y * c - v.x * s); }
void main() {
  vec3 cam = cameraPosition;
  float wheel = step(0.5, fract(iP.w * 7.0));
  float th = uTime * 0.15 * wheel;
  vec2 cr = rot(cam.xz, -th);
  vec3 base = iP.xyz * uBox + (1.0 - wheel) * vec3(0.35, 0.03, 0.12) * uTime + 0.25 * sin(uTime * 0.4 + iP.w * vec3(31.0, 47.0, 59.0));
  vec3 rel = mod(base - vec3(cr.x, cam.y, cr.y) + 0.5 * uBox, uBox) - 0.5 * uBox;
  vec3 pr = vec3(cr.x, cam.y, cr.y) + rel;
  vec2 wxz = rot(pr.xz, th);
  vec3 wp = vec3(wxz.x, pr.y, wxz.y);
  vec3 vel = mix(vec3(0.4, 0.03, 0.15), 0.15 * vec3(wp.z * uTurn, 0.0, -wp.x * uTurn), wheel);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  vec3 vv = (viewMatrix * vec4(vel, 0.0)).xyz;
  float dist = max(-mvPosition.z, 0.1);
  float px = dist * 1.2 / max(uPx, 1.0);
  float size = max(0.011 + 0.012 * fract(iP.w * 13.0), px * 1.3);
  float sp = length(vv.xy);
  vec2 dir = sp > 1e-4 ? vv.xy / sp : vec2(1.0, 0.0);
  float len = size + sp * 0.11;
  mvPosition.xy += dir * position.x * len * 2.0 + vec2(-dir.y, dir.x) * position.y * size * 2.0;
  vec3 e = abs(rel) / (0.5 * uBox);
  float edge = 1.0 - smoothstep(0.82, 1.0, max(e.x, max(e.y, e.z)));
  vA = edge * smoothstep(0.35, 1.4, dist) * min(1.0, 0.02 / size) * (size / len) * (0.6 + 0.4 * sin(uTime * 1.3 + iP.w * 90.0))
     * step(wp.y, -0.3) * step(-27.8, wp.y);
  // motes inside the broad shaft or a narrow beam catch the light: brighter and gold
  vec3 lp = vec3(wp.x, wp.y + 28.0, wp.z * uTurn), ab = uShaftB - uShaftA;
  float tt = clamp(dot(lp - uShaftA, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  vG = (1.0 - smoothstep(uShaftR * 0.45, uShaftR * 1.05, length(lp - (uShaftA + ab * tt)))) * uShaft + 2.5 * beamAt(lp);
  vC = position.xy * 2.0;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const MOTE_FRAG = /* glsl */`
uniform vec3 uMote;
uniform vec3 uShaftWarm;
varying vec2 vC;
varying float vA;
varying float vG;
#include <fog_pars_fragment>
${FOG_FADE_GLSL}
void main() {
  float a = 1.0 - smoothstep(0.15, 1.0, length(vC));
  gl_FragColor = vec4((uMote + (uShaftWarm * 3.2 + uMote) * min(vG, 1.6)) * a * vA * fogFade(), 1.0);
}
`;
// the whale shark: one lofted animal placed by uniforms and bent along its own line (uBend = sideways and upward
// curvature per metre, scale); its tail sweeps 0.75 m either side every 5 s, the wave growing from the gills back.
// aFin: 0 body, 1 fins and tail, 2 mouth lining, 3 its remoras (which shift station and scull).
const SHARK_VERT = /* glsl */`
uniform float uTime;
uniform vec3 uPos;
uniform vec3 uFwd;
uniform vec3 uBend;
attribute float aFin;
attribute float aSeed;
varying vec3 vR;
varying float vFin;
${W_VERT}
void main() {
  vec3 q = position;
  if (aFin > 2.5) {
    q.z += 0.2 * sin(uTime * 0.23 + aSeed * 40.0);
    q.x += 0.035 * sin(uTime * 4.0 + aSeed * 60.0 + position.z * 9.0);
  } else if (aFin > 0.5 && aFin < 1.5) {
    q.y += 0.1 * max(abs(position.x) - 0.9, 0.0) * sin(uTime * 0.7 + position.z);      // pectorals trimming
  } else if (position.z > 3.9 && position.y < 0.0) {
    q.y *= 1.0 + 0.3 * sin(uTime * 0.6);                                              // the mouth working
  }
  float k = clamp((2.8 - q.z) / 7.3, 0.0, 1.0);
  q.x += 0.75 * k * k * sin(uTime * 1.2566 + q.z * 0.5) + 0.5 * uBend.x * q.z * q.z;
  q.y += 0.5 * uBend.y * q.z * q.z;
  q *= uBend.z;
  vec3 f = normalize(uFwd + vec3(0.0, 0.0, 1e-5));
  vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f) + vec3(1e-5, 0.0, 0.0));
  vec3 u = cross(f, r);
  vec3 wp = uPos + r * q.x + u * q.y + f * q.z;
  vW = wp; vN = r * normal.x + u * normal.y + f * normal.z; vR = position; vFin = aFin; vCol = vec3(1.0);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const SHARK_FRAG = /* glsl */`
varying vec3 vR;
varying float vFin;
uniform float uBioK;
${W_PARS}
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = -N;
  float fin = step(0.5, vFin) * step(vFin, 1.5), mouth = step(1.5, vFin) * step(vFin, 2.5), rem = step(2.5, vFin);
  float n1 = vn(vR.xz * 2.0 + vR.y * 1.3), n2 = vn(vR.zy * 7.0 + vR.x * 5.0);
  float head = smoothstep(2.7, 3.9, vR.z);
  // slate back and flanks; white below the lowest rib and under the head
  float belly = (1.0 - smoothstep(-0.36, -0.2, vR.y + 0.07 * (n1 - 0.5) + 0.14 * head)) * (1.0 - fin);
  // pale spots from a jittered hashed grid in body coordinates (length, girth): 3-8 cm, smaller and denser on the head
  float sc = mix(4.2, 7.5, head);
  vec2 gp = mix(vec2(vR.z, atan(vR.x, max(vR.y + 0.9, 0.05)) * 1.1), vec2(vR.z + vR.y * 0.6, vR.y * 1.2 + abs(vR.x) * 0.9), fin) * sc;
  vec2 id = floor(gp), f = fract(gp);
  vec2 c = 0.5 + 0.5 * (vec2(h21(id), h21(id + 7.7)) - 0.5);
  float rad = (0.016 + 0.024 * h21(id + 3.3)) * sc;
  float spot = 1.0 - smoothstep(rad * 0.6, rad, length(f - c));
  // pale vertical bars between the columns of spots on the flanks
  // (thin, wavering and broken into dashes down the flank: whole straight bars read as paint)
  float barId = floor(gp.x * 0.5 + 0.12 * (n1 - 0.5));
  float bar = (1.0 - smoothstep(0.02, 0.06, abs(fract(gp.x * 0.5 + 0.12 * (n1 - 0.5) + 0.07 * sin(gp.y * 1.7 + barId * 2.3)) - 0.5))) * (1.0 - head) * (1.0 - fin) * smoothstep(-0.3, 0.0, vR.y)
            * 0.42 * smoothstep(0.3, 0.62, vn(vec2(barId * 7.31, gp.y * 0.9 + barId * 3.7)));
  float pale = max(spot, bar) * (0.75 + 0.25 * n2);
  // (slate blue of its own, not a grey that only the water's light turns blue)
  vec3 alb = mix(vec3(0.15, 0.185, 0.222) * (0.75 + 0.5 * n1), vec3(0.72, 0.72, 0.66), pale * 0.92);
  alb = mix(alb, vec3(0.68, 0.7, 0.66) * (0.9 + 0.1 * n2), belly);
  // (the pectorals: slate and spotted above, the belly's pale tone on the face turned to the sand)
  float pecU = fin * step(0.8, abs(vR.x)) * smoothstep(0.9, 1.3, vR.z) * (1.0 - smoothstep(-0.25, 0.1, normalize(vN + vec3(0.0, 1e-5, 0.0)).y));
  alb = mix(alb, vec3(0.6, 0.62, 0.6), pecU * 0.85);
  // five gill slits over each pectoral, pumping
  float gz = (3.05 - vR.z) / 0.17, gi = floor(gz);
  float gw = 0.05 + 0.03 * sin(uTime * 1.3 - gi * 0.5);
  // (narrow folds on the lower two thirds of the flank, not five broad bands)
  float slit = (1.0 - smoothstep(gw * 0.5, gw + 0.2, abs(fract(gz) - 0.5))) * step(-0.5, gi) * step(gi, 4.5) * smoothstep(0.45, 0.6, abs(vR.x)) * (1.0 - smoothstep(0.2, 0.36, abs(vR.y + 0.06) + 0.05 * (n2 - 0.5))) * (1.0 - fin);
  alb = mix(alb, vec3(0.045, 0.05, 0.055), slit * 0.62);      // soft dark folds, not black bars
  float eye = (1.0 - smoothstep(0.035, 0.055, length(vec2(vR.y - 0.03, vR.z - 4.0)))) * step(0.6, abs(vR.x)) * (1.0 - fin);
  alb = mix(alb, vec3(0.008), eye);
  float occl = mix(1.0, 0.1 + 0.9 * smoothstep(3.5, 4.5, vR.z), mouth);
  alb = mix(alb, vec3(0.09, 0.06, 0.06), mouth);
  alb = mix(alb, vec3(0.045, 0.05, 0.055) + 0.16 * smoothstep(0.2, 0.9, -N.y), rem);
  float hemi = N.y * 0.5 + 0.5, top = smoothstep(-0.1, 0.6, N.y);
  vec3 hp = toHero(vW);
  float cau = caustic(vW.xz + vW.y * 0.3, uTime);
  // (the water's light on it is drawn a third of the way to grey, so the slate stays slate and not cobalt; the key
  // lights the back and upper flank plainly and leaves the under side to the sand's bounce)
  vec3 ambS = mix(uAmbDown * 0.8, uAmbUp, hemi);
  ambS = mix(ambS, vec3(dot(ambS, vec3(0.3, 0.5, 0.2))), 0.36) * mix(0.72, 1.0, top);
  vec3 light = ambS * occl
             + uKeyCol * uSun * max(dot(N, uSunW) * 0.85 + 0.15, 0.0) * mix(1.0, cau, uCaustic) * (0.3 + 1.15 * top) * occl
             + uSunCol * beamAt(hp) * (0.3 + 0.7 * top);
  vec3 col = alb * light * (0.72 + 0.28 * abs(dot(N, V))) + uAmbUp * 0.14 * pow(max(1.0 - abs(dot(N, V)), 0.0), 3.0) * occl;
  vec3 Hh = normalize(uSunW + V + vec3(0.0, 1e-5, 0.0));
  col += uKeyCol * uSun * 0.1 * pow(max(dot(N, Hh), 0.0), 14.0) * occl * (1.0 - rem);        // wet skin: a soft sheen along the back and upper flank
  // night: its bow wave and its tail shed blue-green sparks
  float spark = smoothstep(0.72, 0.9, vn(vR.xz * 9.0 + vec2(vR.y * 5.0, uTime * 1.5)));
  col += vec3(0.12, 0.85, 0.7) * uBioK * (spark * 1.6 * (smoothstep(3.4, 4.5, vR.z) + 1.0 - smoothstep(-4.4, -2.2, vR.z)) + 0.012);
  gl_FragColor = vec4(wFog(col, 1.0), 1.0);
}
`;

// ------------------------------------------------------------------------------------------------ 2. MOODS
// water = level-gaze fog colour, far = what it deepens to with distance, fogUp / fogDn = what it is multiplied by looking
// up 40 degrees or more / down 30 or more, cloud / cloudDark = the window, mirror = the ceiling outside it,
// gap = sun gap strength [before, after the tear], gapW = its width round the sun, rift = how far the tear runs out from
// the sun [before, after], shaft = the broad shaft [before, after], beams = the eight narrow ones (beamMix = their colour:
// shares of sun and of water),
// pool = the sand pool before the tear (poolK scales its light and the gold disc's; dim = how far the sand round the
// disc is dimmed once the shaft stands; gapTint = the blaze's colour outside its white core), sandK = how far the sand's light is drawn to warm white (sandLift: the night's pale sand stands bright under the moon), ease = how far the broad
// shaft is eased while the lens is inside it (it looks along the column there), dens = fog density (exp2).
// The hexes are linear inputs chosen through the engine's tone map (it pulls red out of blues, so they look greyer here
// than on screen): squall level water shows #1B6FA8, looking up #3BA4D8, looking down #0A2A4E, far #0F4680;
// golden #2A78A4; dawn #3C7FA6; night #0A2546.
const MOODS = {
  squall: { water: '#406b94', far: '#3b5175', cloud: '#86b8d6', cloudDark: '#557488', mirror: '#3a4354', sun: '#e9b952', gapCol: '#fff0c0', sand: '#d2bc8e',
    fogUp: [0.8, 1.8, 2.1], fogDn: [0.93, 0.42, 0.32], rain: 1, ragged: 0.1, gap: [0.35, 1], gapW: 0.34, rift: [0.2, 1], shaft: [0, 1], ease: 0.32, beams: 0.35, beamMix: [0.35, 0.3], pool: 0.45, poolK: 1, dim: 1, gapTint: [1.0, 0.82, 0.5], sandK: 0.7, shaftTint: [1, 1, 1], sunK: 0.5, amb: 1.0, bio: 0, moon: 0,
    dens: 0.014, exposure: 1.1, tint: '#f6fbff', sat: 1.02 },
  golden: { water: '#3f7296', far: '#3a5a7c', cloud: '#7fa9c6', cloudDark: '#4f7d9c', mirror: '#34485e', sun: '#f0b24a', gapCol: '#fff2c8', sand: '#d6bd8e',
    fogUp: [0.8, 1.78, 2.2], fogDn: [0.93, 0.45, 0.36], rain: 0, ragged: 0.015, gap: [1, 1], gapW: 0.24, rift: [0.35, 1], shaft: [1, 1], ease: 0.5, beams: 0.3, beamMix: [0.3, 0.45], pool: 1, poolK: 0.6, dim: 0.6, gapTint: [1.0, 0.82, 0.5], sandK: 0.7, shaftTint: [1, 1, 1], sunK: 0.75, amb: 1.0, bio: 0, moon: 0,
    dens: 0.012, exposure: 1.1, tint: '#fff8ea', sat: 1.02 },
  dawn: { water: '#497392', far: '#44607c', cloud: '#c9b6bd', cloudDark: '#84788a', mirror: '#3c4553', sun: '#f0d2c2', gapCol: '#ffd9cc', sand: '#cebdaa',
    fogUp: [0.95, 1.5, 1.65], fogDn: [0.9, 0.5, 0.42], rain: 0.45, ragged: 0.06, gap: [0.3, 0.7], gapW: 0.3, rift: [0.2, 0.95], shaft: [0, 0.55], ease: 0.2, beams: 0.22, beamMix: [0.5, 0.25], pool: 0.3, poolK: 1, dim: 0.8, gapTint: [1.0, 0.84, 0.76], sandK: 0.7, shaftTint: [1.05, 0.95, 1.0], sunK: 0.3, amb: 0.85, bio: 0, moon: 0,
    dens: 0.016, exposure: 1.1, tint: '#fff5f6', sat: 0.98 },
  night: { water: '#373d4b', far: '#33363f', cloud: '#4a5f78', cloudDark: '#1f2d40', mirror: '#16181d', sun: '#c9d8e6', gapCol: '#dfeaf5', sand: '#d8c8a2', sandLift: 1.5,
    fogUp: [0.9, 1.5, 1.8], fogDn: [0.95, 0.7, 0.6], rain: 1, ragged: 0.1, gap: [0.35, 0.6], gapW: 0.34, rift: [0.15, 0.7], shaft: [0.15, 0.55], ease: 0.32, beams: 0.3, beamMix: [0.5, 0.25], pool: 0.3, poolK: 1, dim: 0.7, gapTint: [0.8, 0.9, 1.0], sandK: 0.8, shaftTint: [0.7, 0.95, 1.5], sunK: 0.5, amb: 0.8, bio: 1, moon: 1,
    dens: 0.018, exposure: 1.25, tint: '#eef6ff', sat: 1.0 },
};

// ------------------------------------------------------------------------------------------------ 3. helpers
// merged world-space geometry for the bommies
function reefBuilder() {
  const P = [], N = [], C = [], SW = [], I = [];
  const v = (x, y, z, c, k, sway, ph) => { P.push(x, y, z); N.push(0, 1, 0); C.push(c[0] * k, c[1] * k, c[2] * k); SW.push(sway, ph); return P.length / 3 - 1; };
  const grid = (rows, cols, at) => {
    const first = P.length / 3;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) at(i / (rows - 1), j / (cols - 1));
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) { const a = first + i * cols + j, b = a + 1, c = a + cols, d = c + 1; I.push(a, c, b, b, c, d); }
  };
  // (the merged mesh is large: its arrays are packed and its normals made in four short steps)
  const build = async (ctx) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    await ctx.yield();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    await ctx.yield();
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(SW, 2));
    g.setIndex(I);
    await ctx.yield();
    g.computeVertexNormals();
    return g;
  };
  return { v, grid, build };
}
// The whale shark, 9 m, nose +Z: a body lofted from control sections (z, half-width, height above the axis, depth
// below it) with a broad flat head, three raised ribs a side running into the keel of the tail stalk, the open mouth as
// a real cavity, and dorsals, pectorals, pelvics, anal fin and the two tail lobes as tapered, swept blades; six remoras
// ride it. aFin: 0 body, 1 blades, 2 mouth lining, 3 remoras (aSeed: one per remora).
const SHARK_CS = [[4.5, 0.63, 0.13, 0.17], [4.42, 0.75, 0.2, 0.22], [4.25, 0.81, 0.26, 0.26], [3.9, 0.85, 0.33, 0.33], [3.4, 0.88, 0.42, 0.42], [2.8, 0.89, 0.54, 0.52], [2.05, 0.87, 0.68, 0.62],
  [1.35, 0.81, 0.78, 0.66], [0.65, 0.71, 0.76, 0.62], [-0.05, 0.59, 0.65, 0.52], [-0.75, 0.46, 0.52, 0.41], [-1.4, 0.34, 0.39, 0.3], [-1.95, 0.25, 0.27, 0.21], [-2.4, 0.21, 0.19, 0.16], [-2.75, 0.12, 0.14, 0.12]];
const sharkSect = (f) => {
  const n = SHARK_CS.length, i = Math.min(n - 2, Math.max(0, Math.floor(f))), t = f - i;
  const g = (k) => { const a = SHARK_CS[Math.max(0, i - 1)][k], b = SHARK_CS[i][k], c = SHARK_CS[i + 1][k], d = SHARK_CS[Math.min(n - 1, i + 2)][k]; return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t); };
  return [g(0), g(1), g(2), g(3)];
};
const sharkAtZ = (z) => { let lo = 0, hi = SHARK_CS.length - 1; for (let k = 0; k < 24; k++) { const m = 0.5 * (lo + hi); if (sharkSect(m)[0] > z) lo = m; else hi = m; } return sharkSect(0.5 * (lo + hi)); };
async function sharkGeometry(ctx) {
  const P = [], F = [], SD = [], I = [];
  const HALF = [0, 10, 19, 24, 28, 32, 40, 47, 52, 57, 64, 71, 76, 81, 90, 101, 113, 126, 140, 154, 167, 180];
  const ANG = HALF.concat(HALF.slice(1, -1).reverse().map((a) => 360 - a)).map((a) => (a * Math.PI) / 180), RN = ANG.length;
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // one ring of the body at section s = [z, hw, top, bot], shrunk by k (the mouth cavity uses k < 1)
  const ringAt = (s, k, fin) => {
    const z = s[0], hd = sm(2.6, 4.2, z), e = 0.85 - 0.3 * hd, e2 = 1 - 0.2 * hd;
    const ribK = (1 - sm(2.3, 3.2, z)) * (0.45 + 0.55 * sm(-2.75, -1.6, z)), keel = 1 - sm(-2.6, -1.7, z);
    for (let j = 0; j < RN; j++) {
      const a = ANG[j], sn = Math.sin(a), cs = Math.cos(a), deg = Math.min(a, Math.PI * 2 - a) * 57.2958;
      let x = Math.sign(sn) * Math.pow(Math.abs(sn), e) * s[1], y = cs > 0 ? Math.pow(cs, e2) * s[2] : -Math.pow(-cs, e2) * s[3];
      let rib = 0;
      for (const c of [28, 52, 76]) rib += Math.exp(-((deg - c) / 5.5) * ((deg - c) / 5.5));
      const out = 0.055 * rib * ribK * (fin ? 0 : 1);
      x += Math.sign(sn) * Math.abs(sn) * out + Math.sign(sn) * 0.16 * keel * Math.exp(-((deg - 90) / 22) * ((deg - 90) / 22));
      y += cs * out;
      P.push(x * k, y * k, z - 0.2 * sm(4.0, 4.5, z) * sn * sn); F.push(fin); SD.push(0);
    }
  };
  const tube = (first, rings) => {
    for (let i = 0; i < rings - 1; i++) for (let j = 0; j < RN; j++) { const a = first + i * RN + j, b = first + i * RN + (j + 1) % RN, c = a + RN, d = b + RN; I.push(a, b, c, b, d, c); }
  };
  const NS = 44;
  for (let i = 0; i < NS; i++) ringAt(sharkSect((i / (NS - 1)) * (SHARK_CS.length - 1)), 1, 0);
  tube(0, NS);
  { const s = sharkSect(SHARK_CS.length - 1), c = P.length / 3; P.push(0, 0, s[0] - 0.12); F.push(0); SD.push(0); const b = (NS - 1) * RN; for (let j = 0; j < RN; j++) I.push(b + j, c, b + (j + 1) % RN); }   // the stalk's end
  await ctx.yield();
  // the mouth: a cavity running back from the lips, its lining dark
  {
    const first = P.length / 3, lip = sharkSect(0), M = [[4.5, 1], [4.36, 0.93], [4.05, 0.8], [3.6, 0.5], [3.35, 0.04]];
    for (const m of M) ringAt([m[0], lip[1], lip[2], lip[3]], m[1], 2);
    tube(first, M.length);
  }
  // blades: root = leading-edge root, span = direction, then length, root chord, sweep, camber, greatest thickness and
  // the taper's power (below 1 the chord narrows fastest near the root: a hollow trailing edge, the tail's crescent).
  // Each is a closed foil section, round at the leading edge and sharp at the trailing one, thinning to the tip
  // fillet > 0 (the pectorals): a finer blade (18 spans of 9) whose root swells into the flank, chord and thickness
  // growing over the first fifth of the span, and whose camber holds to the tip: a cupped, falcate fin, not a flat wing
  const blade = (root, span, len, chord, sweep, camber, thick, taper = 1.3, fillet = 0) => {
    const first = P.length / 3, R = fillet ? 18 : 12, C = fillet ? 9 : 6, M = 2 * (C - 1), l = Math.hypot(span[0], span[1], span[2]) || 1;
    const sx = span[0] / l, sy = span[1] / l, sz = span[2] / l, nl = Math.hypot(sy, sx) || 1, nx = -sy / nl, ny = sx / nl;     // across the blade: span x (0, 0, -1)
    for (let i = 0; i < R; i++) for (let m = 0; m < M; m++) {
      const t = i / (R - 1), c = (m < C ? m : M - m) / (C - 1), side = m < C ? 1 : -1;
      const fl = fillet ? fillet * Math.pow(Math.max(0, 1 - t / 0.2), 2) : 0;
      const back = c * chord * (1 - 0.86 * Math.pow(t, taper)) * (1 + 0.3 * fl) - 0.12 * fl * chord + sweep * t * t * len, bow = camber * Math.sin(Math.PI * c) * (fillet ? 1 - 0.55 * t : 1 - t);
      const th = side * thick * 2.6 * Math.sqrt(c) * (1 - c) * (1 - t * t) * (1 + 1.4 * fl);
      P.push(root[0] + sx * len * t + bow * sy + nx * th, root[1] + sy * len * t - bow * Math.abs(sx) + ny * th, root[2] + sz * len * t - back); F.push(1); SD.push(0);
    }
    for (let i = 0; i < R - 1; i++) for (let m = 0; m < M; m++) { const a = first + i * M + m, b = first + i * M + (m + 1) % M, c = a + M, d = b + M; I.push(a, c, b, b, c, d); }
  };
  blade([0, sharkAtZ(0.95)[2] - 0.14, 0.95], [0, 1, 0], 1.08, 1.25, 0.8, 0, 0.09);                 // first dorsal, 0.95 m clear of the back
  blade([0, sharkAtZ(-1.45)[2] - 0.05, -1.45], [0, 1, 0], 0.45, 0.6, 0.7, 0, 0.045);                // second dorsal
  for (const sx of [-1, 1]) blade([sx * 0.74, -0.3, 2.65], [sx * 0.9, -0.38, -0.2], 1.95, 1.2, 0.78, 0.17, 0.095, 1.5, 1);     // pectorals
  for (const sx of [-1, 1]) blade([sx * 0.2, -0.3, -0.9], [sx * 0.7, -0.7, 0], 0.5, 0.55, 0.5, 0, 0.04);            // pelvics
  blade([0, -sharkAtZ(-1.85)[3] + 0.05, -1.85], [0, -1, 0], 0.4, 0.5, 0.5, 0, 0.035);              // anal fin
  blade([0, 0.03, -2.5], [0, 0.94, -0.34], 2.69, 1.7, 0.5, 0, 0.1, 0.9);                            // tail: the tall upper lobe of the crescent (broad at the root, upright, its tip swept back: a sickle, not a long blade)
  blade([0, -0.03, -2.5], [0, -0.8, -0.6], 1.58, 1.25, 0.3, 0, 0.085, 0.85);                        // and the lower, half as tall (2.53 m above the stalk and 1.27 m below: 3.8 m in all)
  // six remoras, 0.6-0.9 m: under the chin, on the belly and beside the dorsal fin
  const remora = (x, y, z, len, seed) => {
    const first = P.length / 3, zs = [0.5, 0.36, 0.12, -0.14, -0.38], rs = [0.012, 0.055, 0.062, 0.045, 0.014], K = 6;
    for (let i = 0; i < zs.length; i++) for (let j = 0; j < K; j++) { const a = (j / K) * Math.PI * 2; P.push(x + Math.sin(a) * rs[i] * len, y + Math.cos(a) * rs[i] * 0.8 * len, z + zs[i] * len); F.push(3); SD.push(seed); }
    for (let i = 0; i < zs.length - 1; i++) for (let j = 0; j < K; j++) { const a = first + i * K + j, b = first + i * K + (j + 1) % K, c = a + K, d = b + K; I.push(a, b, c, b, d, c); }
    const t0 = P.length / 3; P.push(x, y, z - 0.36 * len, x, y + 0.075 * len, z - 0.5 * len, x, y - 0.075 * len, z - 0.5 * len); F.push(3, 3, 3); SD.push(seed, seed, seed); I.push(t0, t0 + 1, t0 + 2);
  };
  remora(0.28, -sharkAtZ(3.5)[3] * 0.94 - 0.05, 3.5, 0.7, 0.13); remora(-0.3, -sharkAtZ(3.3)[3] * 0.93 - 0.045, 3.3, 0.6, 0.41);
  remora(0.3, -sharkAtZ(1.0)[3] * 0.93 - 0.06, 1.0, 0.9, 0.67); remora(-0.26, -sharkAtZ(-0.2)[3] * 0.93 - 0.055, -0.2, 0.75, 0.29);
  remora(0.2, sharkAtZ(0.1)[2] * 0.95 + 0.04, 0.1, 0.6, 0.83); remora(-0.17, sharkAtZ(-0.45)[2] * 0.95 + 0.045, -0.45, 0.65, 0.55);
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aFin', new THREE.Float32BufferAttribute(F, 1));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(SD, 1));
  g.setIndex(I);
  g.computeVertexNormals();
  return g;
}

// the whale shark's centre keyed to u (world space before mirroring). It cruises in low from the east at 1-2.5 m/s,
// passes 4.4 m under our keel at u 0.30-0.33 and turns north inside our own turn, rising: at u 0.34-0.37 the lens is
// abreast of its head and looks back along its whole length, we ride beside its gills and flank at u 0.37-0.41 (axis
// 3.4-3.9 m off), then it pulls ahead at 2.5 m/s, veers right and goes out through the wall (tail 4 m off our bow at 0.43)
const SHARK_KEYS = [[0, 33, -26.6, -2.6], [0.1, 27, -26.6, -2.6], [0.19, 20.5, -26.6, -3.0], [0.25, 14.8, -26.6, -4.1], [0.29, 11.4, -26.5, -5.4], [0.31, 9.0, -26.3, -5.8], [0.325, 7.0, -25.7, -5.5],
  [0.34, 4.8, -24.4, -4.0], [0.355, 3.3, -23.5, -2.0], [0.37, 2.2, -22.85, 0.4], [0.385, 0.2, -22.0, 2.2], [0.4, -3.3, -21.3, 2.2], [0.415, -6.3, -20.8, 1.4], [0.43, -9.2, -20.3, 0.4],
  [0.447, -13.4, -19.8, -1.2], [0.471, -18, -19.3, -3.4], [0.53, -24, -18.9, -6.4], [0.6, -30.5, -18.7, -10], [0.7, -38, -18.5, -14]];

// the brief's camera line, smoothed (its hand-placed points pinch) and resampled every 1.5 m; the first 6 m stay level
// and straight, the last 12.5 m dead straight onto the ring
function smoothLine(raw) {
  const c = new THREE.CatmullRomCurve3(raw, false, 'centripetal'), L0 = c.getLength();
  let P = c.getSpacedPoints(Math.round(L0 / 0.5));
  const A = raw[0], B = raw[raw.length - 1], S0 = raw[raw.length - 4], run = B.distanceTo(S0);
  const pinned = P.map((p, i) => i * 0.5 < 6 || i * 0.5 > L0 - 12.5);
  P.forEach((p, i) => {
    const d = i * 0.5;
    if (d < 6) { p.x = A.x + 0.1 * (d / 6); p.y = A.y; }
    if (d > L0 - 12.5) p.lerpVectors(S0, B, Math.max(0, 1 - (L0 - d) / run));
  });
  for (let pass = 0; pass < 4; pass++) {
    const Q = P.map((p) => p.clone());
    for (let i = 2; i < P.length - 2; i++) if (!pinned[i]) Q[i].copy(P[i - 2]).add(P[i - 1]).add(P[i]).add(P[i + 1]).add(P[i + 2]).multiplyScalar(0.2);
    P = Q;
  }
  const c2 = new THREE.CatmullRomCurve3(P, false, 'centripetal');
  return c2.getSpacedPoints(Math.round(c2.getLength() / 1.5));
}

// ------------------------------------------------------------------------------------------------ 4. the world
export default {
  id: 'manta-cyclone',
  name: 'The Cyclone of Wings',
  category: 'ocean',
  weirdness: 0.3,
  media: ['underwater'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    // ---- cast: every draw from ctx.rng happens here, before the first yield
    const hour = vary.hour || 'any', pick = rng();
    const moodId = hour === 'golden' ? 'golden' : hour === 'dawn' ? 'dawn' : hour === 'night' ? 'night' : hour === 'day' ? 'squall'
      : (pick < 0.4 ? 'squall' : pick < 0.65 ? 'golden' : pick < 0.85 ? 'dawn' : 'night');
    const M = MOODS[moodId];
    const turn = rng() < 0.3 ? -1 : 1;                       // -1 mirrors the whole world in z (see X)
    const dens = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const tiers = dens < 0.85 ? 8 : dens > 1.12 ? 10 : 9;
    const soup = rng.range(0.65, 1.35) * dens;
    const mel = rng.pick([0, 0.05, 0.085, 0.14, 0.22, 0.33]);
    const prng = rng.fork('plankton'), brng = rng.fork('bommies'), erng = rng.fork('eels');
    const frng = ctx.core.makeRng(ctx.core.hashSeed('manta-reef-fish:' + ctx.seed));
    const rare = !!vary.rare;
    const X = (x, y, z) => new THREE.Vector3(x, y, z * turn);
    const col = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---- the hero: origin on the sand under the axis, sea surface at local y 28. (shaft: false: the broad shaft's light
    // in open water is carried by this file's backdrop, sand and ceiling through wFog, not by the hero's far-plane tube)
    const hero = await buildHero(ctx, { palette: [M.water, M.mirror, M.sun, '#EDF1E4', '#0A1013', M.cloud, '#2E8FD8'], turn, tiers, melanistic: mel, bio: M.bio, shaft: false });
    await ctx.yield();
    const scene = new THREE.Scene();
    hero.object.position.y = FLOOR;
    scene.add(hero.object);
    const H = hero.uniforms, A = hero.anchors;
    H.uAmbUp.value.multiplyScalar(M.amb); H.uAmbDown.value.multiplyScalar(M.amb); H.uSun.value = M.sunK;
    hero.setFogTint(new THREE.Color().fromArray(M.fogUp), new THREE.Color().fromArray(M.fogDn));
    hero.setShaftTint(new THREE.Color().fromArray(M.shaftTint));       // squall and golden: gold; dawn rose-white; night moon silver
    hero.setBeams(M.beams, col(M.sun, M.beamMix[0]).multiply(new THREE.Color().fromArray(M.shaftTint)).add(col(M.water, M.beamMix[1])));
    const cWater = col(M.water), cFar = col(M.far), FAR_K = 0.6;
    const fog = new THREE.FogExp2(cWater.clone(), M.dens);
    scene.fog = fog; scene.background = cWater.clone().lerp(cFar, FAR_K);     // (never seen: the backdrop covers every pixel)
    hero.setFogFar(cFar, FAR_K);
    await ctx.yield();

    // ---- PATH: the brief's line from the hero's anchors, smoothed and resampled; ends on the ring
    const pts = smoothLine(A.flyThrough).map((p) => X(p.x, p.y + FLOOR, p.z));
    await ctx.yield();
    const path = makePath(pts);
    await ctx.yield();

    // ---- shared uniforms (the hero's own objects, so one write lights everything)
    const sunW = new THREE.Vector3(H.uSunDir.value.x, H.uSunDir.value.y, H.uSunDir.value.z * turn);
    const U = { uTime: H.uTime, uAmbUp: H.uAmbUp, uAmbDown: H.uAmbDown, uKeyCol: H.uKeyCol, uSunCol: H.uSunCol, uSun: H.uSun, uCaustic: H.uCaustic,
      uShaft: H.uShaft, uShaftA: H.uShaftA, uShaftB: H.uShaftB, uShaftR: H.uShaftR, uShaftCol: H.uShaftCol, uShaftWarm: H.uShaftWarm, uShaftT: H.uShaftT, uFogFar: H.uFogFar, uFogFarK: H.uFogFarK, uFogUp: H.uFogUp, uFogDn: H.uFogDn,
      uBeam: H.uBeam, uBeamLean: H.uBeamLean, uSunW: { value: sunW }, uTurn: { value: turn } };
    const mat = (name, vs, fs, extra, o) => new THREE.ShaderMaterial({ name, fog: true, vertexShader: vs, fragmentShader: fs,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...extra }, ...o });

    // ---- the backdrop, the ceiling (surface from below) and the sand: they follow the lens, patterns in world space
    const back = new THREE.Mesh(new THREE.CylinderGeometry(300, 300, 28.8, 48, 1, true), mat('manta-backdrop', PLANE_VERT, BACK_FRAG, {}, { side: THREE.BackSide, depthWrite: false }));
    back.position.y = FLOOR / 2; back.frustumCulled = false; back.renderOrder = -2; scene.add(back);
    await ctx.yield();
    const ring = pts[pts.length - 1];
    // the sun's place in the window (the beams lean 25 degrees: q = sin 25 / 0.75), or the moon's; the tear runs from it
    // toward the west side of the window, where the last circuit looks across the mouth of the funnel
    const sunQ = M.moon ? new THREE.Vector2(-0.3, -0.35 * turn) : new THREE.Vector2(sunW.x / 0.75, sunW.z / 0.75);
    const riftQ = new THREE.Vector2(M.moon ? -0.8 : -0.75, (M.moon ? -0.05 : -0.2) * turn);
    const ceilU = { uRain: { value: M.rain }, uRagged: { value: M.ragged }, uGap: { value: M.gap[0] }, uGapW: { value: M.gapW }, uRiftQ: { value: sunQ.clone().lerp(riftQ, M.rift[0]) }, uMoon: { value: M.moon }, uBio: { value: M.bio }, uMoonQ: { value: sunQ },
      uRing: { value: new THREE.Vector3(ring.x - 1, ring.z, 0) }, uHole: { value: new THREE.Vector4(hero.breachHole.x, hero.breachHole.z * turn, 1.7, 0) },
      uCloud: { value: col(M.cloud) }, uCloudDark: { value: col(M.cloudDark) }, uGapCol: { value: col(M.gapCol) }, uGapTint: { value: new THREE.Color().fromArray(M.gapTint) }, uMirror: { value: col(M.mirror) } };
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(Math.PI / 2), mat('manta-ceiling', PLANE_VERT, CEIL_FRAG, ceilU, { side: THREE.DoubleSide, depthWrite: false }));
    // (backdrop and ceiling are drawn first and write no depth: nothing lies beyond them, and the ring's halo, which
    // reaches above the surface, is then not cut along the ceiling plane. The hero discards its animals above the surface)
    ceil.frustumCulled = false; ceil.renderOrder = -1; scene.add(ceil);
    await ctx.yield();
    // eight reef heads and six low ones out in the bay, all 26 m or more from the axis and none in the lane behind the
    // entry (the lens of the view through the previous portal stands there)
    const BOM = [[-30, 14, 3.0, 3.6], [-20, -27, 2.6, 3.0], [-38, -12, 2.2, 2.6], [8, 33, 2.8, 3.4], [-12, 36, 2.4, 2.8], [30, 22, 3.4, 4.0], [34, -11, 2.6, 3.2], [22, -30, 2.9, 3.4],
      [-27, -4, 1.5, 1.7], [25, 10, 1.4, 1.6], [16, -24, 1.5, 1.7], [-33, 28, 1.6, 1.8], [41, 7, 1.6, 1.9], [-9, -31, 1.5, 1.6]];
    // and up to eight small heads under the wall by a seeded scatter (a stream of their own): one to each eighth of the
    // circle, 11.5-21 m from the axis, 1 m tall at most (the fifth number scales what grows on them). A place is taken
    // only if the head stands 7 m or more from every point of the route (in space; the route's points lie 1.5 m apart),
    // clear of the whale shark's road where it runs low, out of the lane behind the entry and 5 m from the last head
    {
      const hrng = ctx.core.makeRng(ctx.core.hashSeed('manta-low-heads:' + ctx.seed));
      const segD = (x, z, a, b) => { const ax = b[1] - a[1], az = b[3] - a[3], t = Math.min(1, Math.max(0, ((x - a[1]) * ax + (z - a[3]) * az) / Math.max(ax * ax + az * az, 1e-6))); return Math.hypot(x - a[1] - ax * t, z - a[3] - az * t); };
      for (let k = 0; k < 8; k++) {
        for (let tries = 0; tries < 14; tries++) {
          const a = ((k + hrng()) / 8) * Math.PI * 2, r = hrng.range(11.5, 21), R = hrng.range(0.9, 1.3), x = Math.cos(a) * r, z = Math.sin(a) * r;      // (the hero's space: before mirroring)
          let ok = !(Math.abs(x - 2) < 6 && z < -3.5);
          for (let i = 0; ok && i < pts.length; i++) { const q = pts[i], dx = q.x - x, dy = q.y - (FLOOR + 0.5), dz = q.z * turn - z, lim = 7 + R; if (dx * dx + dy * dy + dz * dz < lim * lim) ok = false; }
          for (let i = 0; ok && i < SHARK_KEYS.length - 1; i++) if (Math.min(SHARK_KEYS[i][2], SHARK_KEYS[i + 1][2]) < FLOOR + 5 && segD(x, z, SHARK_KEYS[i], SHARK_KEYS[i + 1]) < 3.4 + R) ok = false;
          for (let i = 14; ok && i < BOM.length; i++) if (Math.hypot(BOM[i][0] - x, BOM[i][1] - z) < 5) ok = false;
          if (ok) { BOM.push([x, z, R, R * 0.77, 0.4 + 0.08 * R]); break; }
        }
      }
    }
    // (the sand's shader holds twenty-two: places not taken stand far off with no size)
    const bomU = BOM.map((b) => new THREE.Vector4(b[0], b[1] * turn, b[2], b[3]));
    while (bomU.length < 22) bomU.push(new THREE.Vector4(900, 900, 0.01, 0));
    const floorU = { uBom: { value: bomU }, uSand: { value: col(M.sand, 0.96 * (M.sandLift || 1)) }, uSandDark: { value: col(M.sand, 0.4).lerp(col(M.mirror), 0.25) }, uSandK: { value: M.sandK },
      uWheel: { value: new THREE.Vector3(hero.info.wheelPhase, hero.info.tiers, M.pool * M.poolK) }, uDisc: { value: new THREE.Vector3(0, 0, M.poolK) }, uShkA: { value: new THREE.Vector4(0, 60, 0, 0) }, uShkB: { value: new THREE.Vector3(0, 60, 1) } };
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(700, 700).rotateX(-Math.PI / 2), mat('manta-sand', PLANE_VERT, FLOOR_FRAG, floorU));
    floor.position.y = FLOOR; floor.frustumCulled = false; scene.add(floor);
    await ctx.yield();

    // ---- the bommies in one merged mesh: porites dome, plate tiers, sea fans, whips, soft corals, rubble skirt
    const OLIVE = [0.2, 0.22, 0.08], OCHRE = [0.44, 0.28, 0.07], BONE = [0.6, 0.58, 0.44], GOLD = [0.46, 0.33, 0.08], DARK = [0.07, 0.08, 0.05], CORAL = [0.5, 0.17, 0.12], ROSE = [0.62, 0.32, 0.3];
    const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    const reef = reefBuilder(), n2 = (x, y) => ctx.noise.n2(x, y);
    for (const b of BOM) {
      const bx = b[0], bz = b[1] * turn, R = b[2], Hh = b[3], sk = b[4] || 1, tone = brng();
      reef.grid(9, 17, (a, c) => {
        const th = a * 1.75, ph = c * Math.PI * 2, sx = Math.sin(th) * Math.cos(ph), sz = Math.sin(th) * Math.sin(ph);
        const lump = 1 + 0.2 * n2(bx + sx * 1.6, bz + sz * 1.6) + 0.08 * n2(bx + sx * 5 + 9, bz + sz * 5);
        reef.v(bx + sx * R * lump, FLOOR - 0.1 + Math.max(Math.cos(th), -0.05) * Hh * 0.8 * lump, bz + sz * R * lump,
          mixc(mixc(mixc(OLIVE, OCHRE, 0.25 + 0.5 * tone + 0.25 * n2(bx + sx * 3, bz + sz * 3 + 5)), BONE, 0.3 * Math.max(0, Math.cos(th)) + 0.25 * Math.max(0, n2(bx + sx * 4 + 3, bz + sz * 4 - 7))),
            tone < 0.5 ? ROSE : CORAL, Math.min(0.5, Math.max(0, 2.4 * (n2(bx * 0.7 + sx * 2.2 + 31, bz * 0.7 + sz * 2.2) - 0.32)))),
          0.55 + 0.5 * Math.cos(th), 0, 0);
      });
      const np = 2 + (brng() < 0.5 ? 1 : 0);
      for (let k = 0; k < np; k++) {
        const pa = brng() * 6.283, pr = R * brng.range(0.5, 0.85), cx = bx + Math.cos(pa) * R * 0.6, cz = bz + Math.sin(pa) * R * 0.6, cy = FLOOR + Hh * (0.5 + 0.17 * k);
        reef.grid(3, 15, (a, c) => {
          const ph = c * Math.PI * 2, rr = pr * a * (1 + 0.14 * Math.sin(5 * ph + k));
          reef.v(cx + Math.cos(ph) * rr, cy + 0.22 * a * a * pr, cz + Math.sin(ph) * rr, mixc(k === 1 ? mixc(ROSE, BONE, 0.5) : BONE, OCHRE, 0.2 + 0.4 * a), 0.5 + 0.5 * a, 0, 0);
        });
      }
      for (let k = 0; k < 4; k++) {
        const fa = brng() * 6.283, w = brng.range(1.1, 1.5), h = brng.range(1.2, 1.9) * sk, psi = brng.range(-0.5, 0.5), phs = brng() * 4.5;
        const fx0 = bx + Math.cos(fa) * R * 0.7, fz0 = bz + Math.sin(fa) * R * 0.7, fy0 = FLOOR + Hh * 0.5;
        reef.grid(5, 7, (a, c) => {
          const an = (c - 0.5) * 2 * w, rr = a * h * (1 - 0.12 * Math.abs(c - 0.5));
          reef.v(fx0 + Math.sin(psi) * Math.sin(an) * rr, fy0 + Math.cos(an) * rr, fz0 + Math.cos(psi) * Math.sin(an) * rr,
            k === 3 ? ROSE : k % 2 ? OCHRE : GOLD, (0.45 + 0.6 * a) * (Math.round(c * 6) % 2 ? 0.72 : 1) * (k % 2 ? 1.25 : 1), 0.16 * a * a * h, phs);
        });
      }
      for (let k = 0; k < 5; k++) {
        const wa = brng() * 6.283, wr = brng.range(0.1, 0.6) * R, Lw = brng.range(1.3, 2.2) * sk, phs = brng() * 4.5;
        const wx = bx + Math.cos(wa) * wr, wz = bz + Math.sin(wa) * wr, wy = FLOOR + Hh * 0.7;
        reef.grid(6, 2, (a, c) => reef.v(wx + 0.3 * a * a * Lw, wy + a * Lw, wz + (c - 0.5) * 0.09 * (1.2 - a), [0.4, 0.2, 0.06], 0.5 + 0.6 * a, 0.3 * a * a * Lw, phs));
      }
      for (let k = 0; k < 5; k++) {
        const sa = brng() * 6.283, sr = R * brng.range(0.75, 1.0), rad = brng.range(0.28, 0.5) * Math.max(sk, 0.7), phs = 5 + brng() * 3, tv = brng(), tint = tv < 0.22 ? mixc(ROSE, BONE, tv * 3) : tv < 0.55 ? mixc(OLIVE, BONE, (tv - 0.1) * 1.6) : mixc(OCHRE, BONE, tv);
        const cx = bx + Math.cos(sa) * sr, cz = bz + Math.sin(sa) * sr, cy = FLOOR + Hh * brng.range(0.15, 0.45);
        reef.grid(5, 8, (a, c) => {
          const th = a * 2.4, ph = c * Math.PI * 2, lump = 1 + 0.3 * Math.sin(ph * 3 + k) * Math.sin(th * 2);
          reef.v(cx + Math.sin(th) * Math.cos(ph) * rad * lump, cy + Math.cos(th) * rad * 1.2, cz + Math.sin(th) * Math.sin(ph) * rad * lump, tint, 0.6 + 0.4 * Math.cos(th), 0.03, phs);
        });
      }
      for (let k = 0; k < 9; k++) {
        const ra = brng() * 6.283, rd = R * brng.range(1.05, 1.9), rad = brng.range(0.2, 0.55) * Math.max(sk, 0.6), tint = mixc(DARK, BONE, 0.25 + brng() * 0.5);
        const cx = bx + Math.cos(ra) * rd, cz = bz + Math.sin(ra) * rd;
        reef.grid(3, 7, (a, c) => { const th = a * 1.5, ph = c * Math.PI * 2; reef.v(cx + Math.sin(th) * Math.cos(ph) * rad, FLOOR - 0.03 + Math.cos(th) * rad * 0.55, cz + Math.sin(th) * Math.sin(ph) * rad, tint, 0.7, 0, 0); });
      }
      await ctx.yield();
    }
    const reefGeo = await reef.build(ctx);
    await ctx.yield();
    const reefMesh = new THREE.Mesh(reefGeo, mat('manta-reef', REEF_VERT, REEF_FRAG, {}, { side: THREE.DoubleSide }));
    reefMesh.frustumCulled = false; scene.add(reefMesh);
    await ctx.yield();

    // ---- small gold fish over every head: each holds a station in a loose cloud above the coral and darts about it
    {
      const per = Math.max(8, Math.round(26 * detail)), n = BOM.length * per, arr = new Float32Array(n * 4);
      for (let b = 0; b < BOM.length; b++) for (let k = 0; k < per; k++) {
        const a = frng() * 6.283, rr = BOM[b][2] * (0.2 + 0.9 * Math.sqrt(frng())), o = (b * per + k) * 4;
        arr[o] = BOM[b][0] + Math.cos(a) * rr; arr[o + 1] = FLOOR + BOM[b][3] * (0.75 + 0.9 * frng()) + 0.3; arr[o + 2] = (BOM[b][1] + Math.sin(a) * rr) * turn; arr[o + 3] = frng();
      }
      const P = [0, 0, 0.5, 0, 0.17, 0.1, 0.07, 0, 0.1, 0, -0.15, 0.1, -0.07, 0, 0.1, 0, 0, -0.3, 0, 0.2, -0.5, 0, -0.2, -0.5];
      const I = [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 1, 4, 5, 1, 2, 5, 2, 3, 5, 3, 4, 5, 4, 1, 5, 6, 7];
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      g.setAttribute('iHome', new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat('manta-reef-fish', FISHLET_VERT, EEL_FRAG, {}, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- garden eels: the floor of the eye (thickest just ahead of the entry), the sand under the wall, two colonies
    // among the bommies
    const eelU = { uWheel: { value: new THREE.Vector2(hero.info.wheelPhase, hero.info.bottomRate) }, uShkA: floorU.uShkA, uShkB: floorU.uShkB };
    {
      // (900, about 40 cm of each showing)
      const n = Math.round(900 * detail), arr = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const k = i % 9, c = k < 3 ? [0, 0, 0, 9.5] : k < 5 ? [0, 0, 8.5, 21] : k < 6 ? [1.5, 3.5, 0, 5.5] : k < 8 ? [-25, 23, 0, 9] : [30, 9, 0, 8];
        const a = erng() * 6.283, r = c[2] + (c[3] - c[2]) * Math.sqrt(erng());
        arr[i * 4] = c[0] + Math.cos(a) * r; arr[i * 4 + 1] = (c[1] + Math.sin(a) * r) * turn; arr[i * 4 + 2] = erng(); arr[i * 4 + 3] = erng.range(0.32, 0.5);
      }
      const P = [], I = [];
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const a = (j / 4) * 6.283; P.push(Math.cos(a), i / 5, Math.sin(a)); }
      for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { const a = i * 4 + j, b = i * 4 + (j + 1) % 4, c = a + 4, d = b + 4; I.push(a, c, b, b, c, d); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      g.setAttribute('iEel', new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat('manta-eels', EEL_VERT, EEL_FRAG, eelU, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- weed scraps and mangrove leaves under the ceiling (their own stream of draws: nothing else moves): about
    // sixty over the mouth of the funnel and the top of the wall, none over the ring
    {
      const lrng = ctx.core.makeRng(ctx.core.hashSeed('manta-leaves:' + ctx.seed));
      const n = Math.max(24, Math.round(64 * detail)), arr = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        let x = 0, z = 0;
        for (let k = 0; k < 6; k++) { const a = lrng() * 6.283, r = 19 * Math.sqrt(lrng()); x = Math.cos(a) * r; z = Math.sin(a) * r; if (Math.hypot(x - ring.x, z - ring.z) > 7.5) break; }
        const weed = lrng() < 0.4;
        arr[i * 4] = x; arr[i * 4 + 1] = z; arr[i * 4 + 2] = lrng(); arr[i * 4 + 3] = weed ? -lrng.range(0.24, 0.4) : lrng.range(0.1, 0.15);
      }
      const P = [], I = [], NS = 6;
      for (let i = 0; i <= NS; i++) for (let j = 0; j < 3; j++) P.push(j - 1, 0, i / NS - 0.5);
      for (let i = 0; i < NS; i++) for (let j = 0; j < 2; j++) { const a = i * 3 + j, b = a + 1, c = a + 3, d = c + 1; I.push(a, c, b, b, c, d); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      g.setAttribute('iLeaf', new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat('manta-leaves', LEAF_VERT, LEAF_FRAG, {}, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- plankton streaks
    const moteU = { uPx: { value: 900 }, uBox: { value: new THREE.Vector3(38, 24, 38) }, uMote: { value: col(M.sun, 0.16).add(col(M.cloud, 0.2)) } };
    {
      const n = Math.round(7000 * detail * soup), arr = new Float32Array(n * 4);
      for (let i = 0; i < n * 4; i++) arr[i] = prng();
      await ctx.yield();
      const q = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
      g.setIndex(q.index); g.setAttribute('position', q.attributes.position);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat('manta-plankton', MOTE_VERT, MOTE_FRAG, moteU, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      m.frustumCulled = false; m.renderOrder = 9; scene.add(m);
    }
    await ctx.yield();

    // ---- the whale shark: standing cast, in every visit. sharkAt(u) is its centre in world space before mirroring
    const keys = SHARK_KEYS.map((k) => k.slice());
    let sharkCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(k[1], k[2], k[3])), false, 'centripetal');
    const sA = new THREE.Vector3(), sB = new THREE.Vector3();
    const sharkRaw = (u, out) => {
      const n = keys.length; let i = 0; while (i < n - 2 && u > keys[i + 1][0]) i++;
      const t = Math.min(1, Math.max(0, (u - keys[i][0]) / (keys[i + 1][0] - keys[i][0])));
      return sharkCurve.getPoint((i + t) / (n - 1), out);
    };
    const sharkAt = (u, out) => { sharkRaw(u - 0.004, sA); sharkRaw(u + 0.004, sB); sharkRaw(u, out); return out.multiplyScalar(2).add(sA).add(sB).multiplyScalar(0.25); };
    const sPos = new THREE.Vector3(), sFwd = new THREE.Vector3(1, 0, 0), tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3(), camP = new THREE.Vector3();
    // its body axis (snout to tail root) must stay 3.3 m or more from the lens (the tightest places are where it passes
    // under our bow and where we ride beside it): if it would not, its keys there are lowered and the line is rebuilt
    for (let tries = 0; tries < 3; tries++) {
      let worst = 99;
      for (let k = 0; k <= 70; k++) {
        const u = 0.26 + 0.24 * (k / 70);
        sharkAt(u, sPos); sharkAt(u + 0.006, tA); sharkAt(u - 0.006, tB); sFwd.subVectors(tA, tB).normalize();
        path.pointAt(u, camP); camP.z *= turn;
        tC.subVectors(camP, sPos);
        const s = Math.max(-3, Math.min(4.5, tC.dot(sFwd)));
        worst = Math.min(worst, tC.addScaledVector(sFwd, -s).length());
      }
      if (worst >= 3.3) break;
      for (let i = 5; i <= 12; i++) keys[i][2] = Math.max(FLOOR + 1.3, keys[i][2] - (3.4 - worst));
      sharkCurve = new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(k[1], k[2], k[3])), false, 'centripetal');
    }
    await ctx.yield();
    const sharkU = { uPos: { value: new THREE.Vector3(0, -90, 0) }, uFwd: { value: new THREE.Vector3(1, 0, 0) }, uBend: { value: new THREE.Vector3(0, 0, 0.0001) }, uBioK: { value: M.bio } };
    {
      const g = await sharkGeometry(ctx);
      await ctx.yield();
      const m = new THREE.Mesh(g, mat('manta-whale-shark', SHARK_VERT, SHARK_FRAG, sharkU, { side: THREE.DoubleSide }));
      m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- POIS
    const poiB = new THREE.Vector3(), poiC = new THREE.Vector3(), poiD = new THREE.Vector3(), poiE = new THREE.Vector3(), poiG = new THREE.Vector3();
    const SAND_LEAD = 0.9, SAND_R = 0.8;
    // the low orbit: the lens rides in the bottom tier's lane and the gaze rests on the lane 3.4 m ahead (0.3 rad round
    // it: an animal there is 9 degrees off head-on), so one manta is always coming at the middle of the frame mouth
    // first and slides round the lens's keep-out as it passes; the aim runs out to 5.6 m (0.5 rad) over u 0.20-0.24,
    // where the gaze goes over to the sand. The tier's phase is the hero's own (wheelPhase, bottomRate, thirteen to the
    // ring); the gaze leans half way toward the animal nearest the aim point and passes to the one behind it without a
    // jump (the two are blended as they change places)
    const LANE_R = A.eyeRadius(3.2) + 2.1, LANE_STEP = (Math.PI * 2) / hero.info.laneN;
    const laneAt = (time, u) => {
      path.pointAt(u, camP);
      const angC = Math.atan2(-camP.z * turn, camP.x);
      const lc = 0.3 + 0.2 * S(0.2, 0.24, u);
      let t = (angC - lc - hero.info.wheelPhase - hero.info.bottomRate * time) / LANE_STEP; t -= Math.round(t);     // -0.5..0.5: the nearest animal's place about the aim point
      const d = lc + 0.5 * LANE_STEP * (t - Math.sign(t) * 0.5 * S(0.08, 0.5, Math.abs(t)));
      const th = angC - d;
      return poiB.set(Math.cos(th) * LANE_R, FLOOR + 3.0, -Math.sin(th) * LANE_R * turn);
    };
    // over the backs: the gaze drifts right and down onto the floor of the eye, a point on the sand that runs round ahead
    // of us inside our own circle (looking straight across at the sand pool would be a quarter turn in a second)
    const sandAt = (time, u) => {
      path.pointAt(u, camP);
      const th = Math.atan2(-camP.z * turn, camP.x) - SAND_LEAD, rr = Math.hypot(camP.x, camP.z) * SAND_R;
      return poiE.set(Math.cos(th) * rr, FLOOR, -Math.sin(th) * rr * turn);
    };
    // the whale shark: its head as it comes up beside us, its gills and dorsal fin while we ride abreast, then its tail
    // root. It first passes under and behind us, where following it would whip the gaze straight down and round the
    // back: so until u 0.352 the gaze is led instead, swinging steadily right from the sand pool (40 degrees off the
    // bow) to where the head will come out, never steeper than 30 degrees down
    const sharkPoi = (time, u) => {
      sharkAt(u, poiC); sharkAt(u + 0.006, poiD); sharkAt(u - 0.006, tC); poiD.sub(tC).normalize();
      poiC.addScaledVector(poiD, 3.5 - 1.5 * S(0.34, 0.37, u) - 2.5 * S(0.37, 0.4, u) - 2.0 * S(0.405, 0.435, u));
      // (the aim lies on its flank, not on its axis: 0.7 m out toward the lens's side and 0.35 m below the back line)
      path.pointAt(u, camP); camP.z *= turn;
      tC.subVectors(camP, poiC); tC.addScaledVector(poiD, -tC.dot(poiD)); tC.y = 0;
      poiC.addScaledVector(tC, 0.7 / Math.max(tC.length(), 0.5)); poiC.y -= 0.35;
      const k = Math.pow(S(0.268, 0.352, u), 1.7);       // (a slow start: the swing waits for this aim's weight to come in, or the two add up to a whip)
      if (k < 1) {
        path.pointAt(u, camP); camP.z *= turn; path.tangentAt(u, tC); tC.z *= turn;
        const hl = Math.max(Math.hypot(tC.x, tC.z), 1e-4), hx = tC.x / hl, hz = tC.z / hl, dx = poiC.x - camP.x, dy = poiC.y - camP.y, dz = poiC.z - camP.z;
        let yawH = Math.atan2(hx * dz - hz * dx, hx * dx + hz * dz); if (yawH < -0.35) yawH += Math.PI * 2;
        const yaw = 0.7 + (Math.min(yawH, 2.44) - 0.7) * k, pit = -0.21 + (Math.max(-0.52, Math.atan2(dy, Math.hypot(dx, dz))) + 0.21) * k;
        const c = Math.cos(pit) * 6;
        poiC.set(camP.x + (hx * Math.cos(yaw) - hz * Math.sin(yaw)) * c, camP.y + Math.sin(pit) * 6, camP.z + (hx * Math.sin(yaw) + hz * Math.cos(yaw)) * c);
      }
      poiC.z *= turn; return poiC;
    };
    const sa = A.shaftTop, sb = A.shaftFoot, shaftAt = (y) => { const t = (y - FLOOR) / (sa.y - sb.y); return X(sb.x + (sa.x - sb.x) * t, y, sb.z + (sa.z - sb.z) * t); };
    // THE GAZE from the well to the ring comes from three aims FIXED IN THE WORLD and one smooth blend from each to the
    // next: bearing and elevation of the gaze run from those of one aim to those of the next at an even rate IN TIME
    // (the flight's own clock, from pace; eased over the first and last sixth of each blend). It has the whole gaze
    // (weight 1) while it runs, and begins as the route's own look 9 m ahead, so it comes in without a step:
    //   WALL   the middle of the funnel's far wall across the gold pool: a place of the funnel, at its middle height
    //          (the hero's own columnMid, 13 m above the sand), on the wall's own surface at that height (the
    //          hero's own radius there, made as LANE_R is for the bottom tier), on the bearing from the funnel's axis
    //          through the middle of the gold pool, beyond the pool. The gaze comes down onto it from where the lens
    //          comes over the well's rim to where it comes over the gold disc and rests on it a metre of route
    //   SUN    the sky under the sun's gap: a point 150 m off along the bearing the gold column leans to, 38 degrees
    //          up, so far away that the lens cannot swing past it (the column's own head is 2 m from the route: an aim
    //          on it whips as we pass). The blaze stands 20 degrees above it, in the top third of the frame. WALL and
    //          SUN lie almost opposite one another: the bearing goes round the way the route turns, across the west
    //          wall, quicker at first and slowing, and the gaze comes up over the later 62 percent of that turn, so
    //          the two never run at their full rate together (never through the floor). It is reached where the lens
    //          passes the gold column's axis. The ring hangs west and above the lens all this while (16 m off as the
    //          lens comes over the well, under 9 m as it leaves it); the gaze goes by its aims alone and is not held
    //          away from the ring
    //   RING   the ring itself: the whole descent from the sun is one even turn across the pocked ceiling over the
    //          mouth of the funnel (the lens circles toward the ring's bearing meanwhile, so it is the shortest turn
    //          there is). It begins a metre of route past the gold column, where the ring hangs 113 degrees from the
    //          sun's gap and 15 m from the lens, and it ends at D_RING, as early as a turn no faster than the gaze's
    //          own fastest earlier turn allows: 18.5 m flown from the column, the lens 17.5 m from the ring. From
    //          there the gaze rests on the ring's middle
    const paceAt = (u) => 0.58 + 0.22 * S(0.05, 0.09, u) + 0.79 * S(0.12, 0.14, u) - 0.84 * S(0.175, 0.21, u) - 0.24 * S(0.262, 0.297, u) + 0.92 * S(0.46, 0.49, u) - 0.70 * S(0.53, 0.58, u) - 0.2 * S(0.63, 0.66, u) + 0.2 * S(0.69, 0.72, u) + 0.40 * S(0.72, 0.75, u) + 0.10 * S(0.79, 0.83, u) - 0.30 * S(0.84, 0.88, u);
    const CLOCK = new Float32Array(401);                       // the flight's clock by u (in flights: 1 = the whole duration at pace 1)
    for (let i = 1; i <= 400; i++) CLOCK[i] = CLOCK[i - 1] + 0.0025 / paceAt((i - 0.5) / 400);
    const clockAt = (u) => { const x = Math.min(399.999, Math.max(0, u * 400)), i = Math.floor(x); return CLOCK[i] + (CLOCK[i + 1] - CLOCK[i]) * (x - i); };
    const sunH = Math.hypot(sa.x - sb.x, sa.z - sb.z), poolH = Math.hypot(sb.x, sb.z), WALL_R = A.eyeRadius(A.columnMid.y) + 2.1;
    const AIMS = [X((sb.x / poolH) * WALL_R, FLOOR + A.columnMid.y, (sb.z / poolH) * WALL_R), X(((sa.x - sb.x) / sunH) * 150, FLOOR + 16 + 150 * Math.tan(0.663), ((sa.z - sb.z) / sunH) * 150), ring];
    // THE PLACES the gaze's keys stand at are found on the route itself, in metres flown (routeD: from a place, the
    // first place where a measure turns positive, by quarter metres and then to a centimetre; the lens in the hero's space):
    //   D_DISC  the lens comes over the gold disc: above the funnel's middle height, its level distance to the shaft's
    //           foot falls under the shaft's radius
    //   D_WELL  the lens comes over the well's rim: the last place before D_DISC where, seen from above, it crosses the
    //           line through the pool's middle and the funnel's axis, on the far side of the axis (from there WALL
    //           lies straight across the pool)
    //   D_COL   the lens passes the gold column: within the shaft's radius of its axis, the nearest it comes to it
    //   D_RING  the look is whole on the ring: the first place at which the last blend, begun a metre of route past the
    //           column, can end without turning the gaze anywhere faster than GAZE_R, the gaze's own fastest turn
    //           inside the two blends before it as they stand, both measured the way a camera turns (see gazeRate,
    //           below the gaze). That place is 18.52 m flown from the column on seeds 7, 3 and 11 alike (the route
    //           and the three aims are the same on every seed): 131.65 m flown, the lens 17.5 m from the ring
    // Each aim, once reached, is rested on for AIM_REST = 1 m of route before the next blend begins, and the poi takes
    // the gaze over the GAZE_IN = 4 m of route before D_WELL (and lets it go over as many at its end).
    const lensAt = (d) => { path.posAtDist(d, camP); camP.y -= FLOOR; camP.z *= turn; return camP; };
    const routeD = (from, step, f) => { for (let d = from + step; d > 0 && d < path.length; d += step) if (f(d) > 0) { let lo = d - step, hi = d; for (let k = 0; k < 5; k++) { const m = 0.5 * (lo + hi); if (f(m) > 0) hi = m; else lo = m; } return hi; } return from; };
    const footD = (d) => { lensAt(d); return Math.hypot(camP.x - sb.x, camP.z - sb.z); };
    const colD = (d) => { lensAt(d).sub(sb); return camP.addScaledVector(tC.subVectors(sa, sb).normalize(), -camP.dot(tC)).length(); };
    const GAZE_IN = 4, AIM_REST = 1;
    const D_DISC = routeD(0, 0.25, (d) => (lensAt(d).y > A.columnMid.y && footD(d) < A.shaftRadius ? 1 : -1));
    const D_WELL = routeD(D_DISC, -0.25, (d) => { lensAt(d); return camP.z * sb.x - camP.x * sb.z; });
    const D_COL = routeD(D_DISC, 0.25, (d) => (colD(d) < A.shaftRadius && colD(d + 0.05) > colD(d - 0.05) ? 1 : -1));
    // from, to (places in metres flown, as shares of the route), the way the bearing goes (1: with the route's turn; 0: the short way), the share of the blend the elevation waits
    // (the last blend ends at D_RING, which is found below the gaze: until then the route's end stands in its place)
    const BLENDS = [[D_WELL, D_DISC, 0, 0], [D_DISC + AIM_REST, D_COL, 1, 0.38], [D_COL + AIM_REST, path.length, 0, 0]].map((b) => [b[0] / path.length, b[1] / path.length, b[2], b[3]]);
    const share = (a, b, x) => { const ca = clockAt(a); return Math.min(1, Math.max(0, (clockAt(x) - ca) / (clockAt(b) - ca))); };
    const ease = (t) => { const e = 0.16; return t < e ? (t * t) / (2 * e * (1 - e)) : t > 1 - e ? 1 - ((1 - t) * (1 - t)) / (2 * e * (1 - e)) : (t - e / 2) / (1 - e); };
    const aimDir = (p) => { const dx = p.x - camP.x, dy = p.y - camP.y, dz = (p.z - camP.z) * turn; return [Math.atan2(dz, dx), Math.atan2(dy, Math.hypot(dx, dz))]; };
    const gazeAt = (time, u) => {
      path.posAtDist(Math.min(path.length, u * path.length + 9), poiG);
      path.pointAt(u, camP);
      let [az, el] = aimDir(poiG);
      for (let i = 0; i < BLENDS.length; i++) {
        const t = share(BLENDS[i][0], BLENDS[i][1], u), lag = BLENDS[i][3], k = ease(lag > 0 ? 1 - Math.pow(1 - t, 1.5) : t);
        if (t <= 0) break;
        const [b, e] = aimDir(AIMS[i]);
        let d = b - az; d -= Math.PI * 2 * Math.round(d / (Math.PI * 2));
        if (BLENDS[i][2] > 0 && d < 0) d += Math.PI * 2;
        az += d * k; el += (e - el) * ease(Math.max(0, (t - lag) / (1 - lag)));
      }
      const ce = Math.cos(el) * 16;
      return poiG.set(camP.x + Math.cos(az) * ce, camP.y + Math.sin(el) * 16, camP.z + Math.sin(az) * ce * turn);
    };
    // D_RING (see THE PLACES). gazeRate is the gaze's fastest turn between two places of the route, measured the way a
    // camera turns: the square root of (the bearing's rate squared plus the elevation's rate squared), at eyes every
    // quarter metre of route, by the flight's own clock (radians a flight). GAZE_R is that rate inside the two earlier
    // blends as they stand, and the last blend ends at the first place of the route where it has no such rate above it
    const gazeRate = (from, to) => {
      gazeAt(0, from / path.length); let [a0, e0] = aimDir(poiG), m = 0;                       // (gazeAt leaves the lens's place in camP)
      for (let d = from; d < to - 1e-6; d += 0.25) {
        const e = Math.min(d + 0.25, to); gazeAt(0, e / path.length);
        const [a1, e1] = aimDir(poiG); let da = a1 - a0; da -= Math.PI * 2 * Math.round(da / (Math.PI * 2));
        m = Math.max(m, Math.hypot(da, e1 - e0) / (clockAt(e / path.length) - clockAt(d / path.length)));
        a0 = a1; e0 = e1;
      }
      return m;
    };
    const GAZE_R = Math.max(gazeRate(D_WELL, D_DISC), gazeRate(D_DISC + AIM_REST, D_COL));
    const D_RING = routeD(D_COL + AIM_REST, 0.25, (d) => { BLENDS[2][1] = d / path.length; return GAZE_R - gazeRate(D_COL + AIM_REST, d); });
    BLENDS[2][1] = D_RING / path.length;
    // THE STEADY CAMERA takes every poi at 0.35 and rests the other 0.65 on its own look 30 m down the route, which on
    // this spiral points across the eye: where the gaze above stands opposite that look and sweeps past it, the sum of
    // the two whips round. ONE poi answers it, listed once, before the gaze (whose weight of 1 replaces everything
    // listed before it for the default camera, which therefore never sees this one; so it runs only while the gaze
    // has its whole weight): its aim is solved so that the steady camera ends on a fifth of the gaze's pull instead of
    // a third (STEADY_Q), or as near to that as one poi can bring it.
    const STEADY = [0.632, 0.804, 0.15], STEADY_Q = 0.2, poiS = new THREE.Vector3(), sD0 = new THREE.Vector3(), sG = new THREE.Vector3(), sF = new THREE.Vector3();
    const AHEAD = Math.min(9 * 3.4, Math.max(9, path.length * 0.22));
    const steadyAt = (time, u) => {
      const w0 = (STEADY[1] - STEADY[0]) * STEADY[2], ws = 0.35 * S(STEADY[0], STEADY[0] + w0, u) * (1 - S(STEADY[1] - w0, STEADY[1], u)), wk = 1 - ws;
      gazeAt(time, u); sG.copy(poiG).sub(camP).normalize();                                 // (gazeAt leaves the lens's place in camP)
      path.posAtDist(u * path.length + AHEAD, sD0).sub(camP).normalize(); sD0.y *= 0.55; sD0.normalize();
      sF.copy(sD0).multiplyScalar(1 - STEADY_Q).addScaledVector(sG, STEADY_Q).normalize();
      // the look after this poi (d1) must give 0.65 d1 + 0.35 G along F ...
      const fg = 0.35 * sF.dot(sG), c = fg + Math.sqrt(Math.max(fg * fg - 0.1225 + 0.4225, 0));
      sF.multiplyScalar(c).addScaledVector(sG, -0.35).normalize();
      // ... and this poi must bring the look-ahead onto d1: wk d0 + ws S along d1 (if it cannot reach, it pulls square to d0)
      const b = wk * sF.dot(sD0), disc = b * b - wk * wk + ws * ws;
      if (disc >= 0) poiS.copy(sF).multiplyScalar(b + Math.sqrt(disc)).addScaledVector(sD0, -wk);
      else poiS.copy(sF).addScaledVector(sD0, -sF.dot(sD0));
      if (poiS.lengthSq() < 1e-8) poiS.copy(sD0);
      return poiS.normalize().multiplyScalar(16).add(camP);
    };
    // (a poi's weight rises and falls over the same share of its span, so a target that must come up quickly and
    // let go slowly is listed twice: a short span and a long one that overlap)
    // (the rosette's aim stands 2.5 m west of the axis, inside our first turn: the lens passes 2 m from the axis itself,
    // and an aim straight overhead would whip the bearing round as it went under)
    const rosette = X(-2.5, -6, -0.5);
    const pois = [
      { at: rosette, from: 0.005, to: 0.13, weight: 0.8, fade: 0.5 },                         // the rosette: up the funnel, over the whole opening
      { at: laneAt, from: 0.105, to: 0.215, weight: 0.9, fade: 0.3 },                          // the mouths
      { at: laneAt, from: 0.15, to: 0.28, weight: 0.9, fade: 0.5 },
      { at: sandAt, from: 0.205, to: 0.335, weight: 0.75, fade: 0.54 },                        // over the backs: the floor of the eye
      { at: sharkPoi, from: 0.265, to: 0.465, weight: 0.9, fade: 0.2 },                        // the whale shark's flank, for its whole pass
      { at: shaftAt(-16), from: 0.47, to: 0.57, weight: 0.4, fade: 0.3 },                      // gold beside blue
      { at: ring, from: 0.80, to: 1, weight: 0.66, fade: 0.15 },
      { at: steadyAt, from: STEADY[0], to: STEADY[1], weight: 1, fade: STEADY[2] },             // the steady camera only (see STEADY)
      { at: gazeAt, from: (D_WELL - GAZE_IN) / path.length, to: 0.905, weight: 1, fade: GAZE_IN / (0.905 * path.length - D_WELL + GAZE_IN) },   // the well, the sun's gap, the ring: the whole gaze from the well's rim (D_WELL)
    ];
    const shA = new THREE.Vector3(), shB = new THREE.Vector3();
    const size2 = new THREE.Vector2(), camW = new THREE.Vector3(), noseL = new THREE.Vector3(), tailL = new THREE.Vector3(), capL = new THREE.Vector3(), fwdL = new THREE.Vector3(), rAx = new THREE.Vector3(), uAx = new THREE.Vector3();
    const p0 = path.pointAt(0, new THREE.Vector3()), t0 = path.tangentAt(0, new THREE.Vector3()), UP = new THREE.Vector3(0, 1, 0);

    return {
      scene, path, duration: 50, ride: 'none',
      // the floor 0.58 (the gaze lifts 60 degrees up the funnel here), the rosette 0.80, the low orbit 1.59, over the
      // backs 0.75, beside the whale shark 0.51 (slowing before the gaze swings onto it), the wall pass and the shaft
      // 1.43, the well 0.73 (0.53 while the gaze comes up out of it), the flare 1.13, under the rain 1.23, the ring 0.93
      pace: paceAt,
      camera: { fov: 62, near: 0.2, far: 700, lookAhead: 9, sway: 0.5, bank: 0.35, nearThrough: 0.3 },
      pois,
      portal: { shape: 'circle', radius: 4.5, color: '#CFEFE2', glow: 0.45, tilt: true, revealDistance: 45, blendDistance: 25 },
      // POST: exposure per mood; bloom only reaches the sun gap, the shaft's spine, fusilier flanks and the portal rim
      post: { exposure: M.exposure, bloom: { strength: 0.4, radius: 0.6, threshold: 0.92 },
        grade: { saturation: M.sat, contrast: 1.06, tint: M.tint, shadowTint: '#02091a', vignette: 0.34, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        // --- everything keyed to u or to where the lens is
        camera.getWorldPosition(camW);
        // seen through the previous portal the lens stands behind the entry, outside the wall, and looks through that
        // much more water: thin the fog to match and hide the animals between it and the entry plane
        const through = !!ctx.through;
        const behind = Math.max(0, (p0.x - camW.x) * t0.x + (p0.y - camW.y) * t0.y + (p0.z - camW.z) * t0.z);
        fog.density = M.dens * (through ? 12 / (12 + behind) : 1);
        hero.setThrough(through);
        // the squall tears at u 0.488: the gap opens wide and the broad shaft stands down the eye; eased on the final run
        const tear = S(0.488, 0.545, u);
        // (ONE ease by where the lens is: in the core of the column, where it looks along it, the glare is eased by
        // M.ease: fully within a quarter of the shaft's radius of its axis and not at all beyond 0.8 of it; and the
        // brief's own ease to 0.6 on the last run)
        shA.copy(U.uShaftA.value); shB.copy(U.uShaftB.value).sub(shA);
        tC.set(camW.x, camW.y - FLOOR, camW.z * turn).sub(shA);
        const sd = tC.addScaledVector(shB, -Math.min(1, Math.max(0, tC.dot(shB) / shB.lengthSq()))).length(), SR = U.uShaftR.value;
        const shaft = (M.shaft[0] + (M.shaft[1] - M.shaft[0]) * tear) * (1 - M.ease * (1 - S(0.25 * SR, 0.8 * SR, sd))) * (1 - 0.4 * S(0.86, 0.92, u));
        hero.setShaft(shaft); hero.setShadow(0.56 + 0.1 * shaft);
        // the sand pool: its wash from the start, and from the tear the foot of the broad shaft as a clear gold disc
        // (golden: the shaft has stood since the first second, so the disc has too), the sand round it dimmed
        floorU.uDisc.value.x = Math.min(1, (M.shaft[0] + (M.shaft[1] - M.shaft[0]) * tear) / Math.max(M.shaft[0], M.shaft[1])); floorU.uDisc.value.y = tear * M.dim;
        const torn = S(0.47, 0.545, u);
        ceilU.uGap.value = M.gap[0] + (M.gap[1] - M.gap[0]) * torn;
        ceilU.uRiftQ.value.copy(sunQ).lerp(riftQ, M.rift[0] + (M.rift[1] - M.rift[0]) * torn);
        ceilU.uRing.value.z = S(0.74, 0.84, u);
        // the whale shark: centre, heading and the bend of its line; its keep-out capsule, bow-wave riders and shadow
        const on = 1 - S(0.6, 0.66, u);
        sharkAt(u, sPos); sharkAt(u + 0.006, tA); sharkAt(u - 0.006, tB);
        sFwd.subVectors(tA, tB); const ds = Math.max(sFwd.length(), 1e-3); sFwd.multiplyScalar(1 / ds);
        noseL.copy(sPos).addScaledVector(sFwd, 4.2); noseL.y -= FLOOR; tailL.copy(sPos).addScaledVector(sFwd, -4.2); tailL.y -= FLOOR;
        // (the keep-out runs from the snout to the tip of the tail, 6.3 m about its line: every manta inside it is moved
        // out to 4.5 m and more from the line, so a wing tip stays a metre and more from the body, fins and tail)
        capL.copy(sPos).addScaledVector(sFwd, -5.2); capL.y -= FLOOR;
        hero.setCapsule(noseL, capL, on > 0.01 ? 6.3 * on : 0);
        // the whale shark's own school rides its snout for as long as it is there (and is as large as it is)
        fwdL.copy(sFwd); hero.setBow(noseL, fwdL, on);
        floorU.uShkA.value.set(noseL.x, noseL.y, noseL.z, on); floorU.uShkB.value.copy(tailL);
        tA.sub(sPos).normalize(); tC.subVectors(sPos, tB).normalize(); tA.sub(tC).multiplyScalar(2 / ds);      // d(heading)/d(metre)
        sPos.z *= turn; sFwd.z *= turn; tA.z *= turn;
        rAx.crossVectors(UP, sFwd).normalize(); uAx.crossVectors(sFwd, rAx);
        sharkU.uPos.value.copy(sPos); if (on <= 0.01) sharkU.uPos.value.y = -90;
        sharkU.uFwd.value.copy(sFwd);
        sharkU.uBend.value.set(Math.max(-0.12, Math.min(0.12, tA.dot(rAx))), Math.max(-0.12, Math.min(0.12, tA.dot(uAx))), Math.max(on, 0.0001));
        // the rare breach: one manta drives up through the ceiling over u 0.80-0.85
        if (rare) {
          const k = (u - 0.8) / 0.05, live = k > 0 && k < 1;
          hero.setBreach(live ? k : -1);
          ceilU.uHole.value.w = live ? S(0.27, 0.33, k) * (1 - S(0.6, 0.98, k)) : 0;      // the torn water lingers and closes
        }
        // --- ambient
        hero.update(dt, time, camera);
        back.position.x = ceil.position.x = floor.position.x = camW.x; back.position.z = ceil.position.z = floor.position.z = camW.z;
        moteU.uPx.value = ctx.renderer.getDrawingBufferSize(size2).y;
      },
      dispose() { hero.dispose(); },
    };
  },
};
