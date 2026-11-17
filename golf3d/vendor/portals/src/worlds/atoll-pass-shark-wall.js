// The Pass (atoll-pass-shark-wall): a fall from half a kilometre above a coral atoll to its one pass, a
// skim over the tide rip, a dive, a scoured coral canyon and THE WALL of five hundred sharks (the hero,
// src/parts/atoll-pass-shark-wall.js), then a manta, a scour bowl and a sand slope up to the portal.
//
// MAP OF THIS FILE (in order)
//   1. GLSL        ATOLL_GLSL (ring / islet / rip functions mirrored in JS below), SEA_SHADE (the whole
//                  atoll painted from the ring's signed distance: lagoon, patch reefs, flat, surf, pass,
//                  foam streaks, boils, the apron seaward of the pass (sixth pass: turquoise shallows as a soft patchy
//                  field, a pale sand lens under each approach shark (AP_SEATS), and the race drawn for the air:
//                  converging foam lines and two chevron crests), the three canoes' wakes (wakeOf), swell in groups and cat's paws on the open
//                  sea (every wave train is faded by how fast its own phase turns per pixel: no ruled lines from the
//                  air), cloud shadows, haze; near the lens a glint is a pin-point, never a patch),
//                  then the small materials: sea disc, rip sheet (close up its foam is wandering broken threads:
//                  ripNet / gNet read through a fine warp; the near wave face is glass with crest glitter; the sheet is
//                  see-through only within some thirty metres of the lens and painted like the sea beyond; the three
//                  standing crests 65 to 91 m short of P carry a broken foam line, "the bar"; a short-crested chop breaks
//                  the sky's reflection into flecks within forty metres), the dolphins' spray
//                  (SPRAY_*), bed card,
//                  islets, props (palms, canoe, houses, beacon), surface sharks (dark countershaded shapes; APSHARK_*:
//                  the four approach sharks, drawn over the sheet and held near 9 % of the frame from the air),
//                  the portal's own shafts (PSHAFT_*), fish (anthias, fusiliers, wrasse / barracuda), fans / whips /
//                  garden eels, the mantas (MANTA_*: caustics, modelled belly, rim), sand smoke (SMOKE_*: puffs),
//                  cloud wisps (WISP_*).
//   2. JS mirrors  makeAtoll(): ringR, islA, islH, ripH (must stay identical to the GLSL).
//   3. build()     a. SEEDED MOODS: `LOOKS` table and the pick (search "SEEDED MOODS"): sky, light, fog,
//                     sea palette, wind, cast. vary.hour / vary.rare / vary.density / quality.detail.
//                     Two random streams: R (the world as first built) and RX (everything the polish pass added,
//                     search "polish pass": far canoes, opening birds, the exit's reef / eels / rays / schools, the
//                     amphitheatre's fusiliers, the rear guard of sharks). RX2 is the second polish pass (the terns that
//                     cross the bow at the opening, the extra sharks under the skim, the amphitheatre walls' corals and
//                     fans). RX4 is the fourth polish pass (the frigatebird that glides down the entry with us). RX5 is the sixth
//                     (the sharks and the shafts round the portal). Add new things with a new stream so nothing moves.
//                     Streams of single things, each made from the seed and a name of its own: pass-dolphins (the
//                     pods' leap phase), pass-pacers (RXP: the wall's station animals), pass-flock-near (RXN: the
//                     flock's three near birds), pass-rays (RXR: the sand rays' start bearings), pass-skim (RXS: the
//                     tail-beat phases of the skim sharks and the approach sharks).
//                  b. THE PATH (search "THE PATH"): air leg (entry 64 m up), skim, dive point P, canyon, the hero's
//                     flyThrough, bowl, straight 20 degree climb to the portal. Key u's are measured from it.
//                  c. sky, light rig, clouds, birds (terns we fall through, noddies, frigatebirds; the opening's own
//                     three near frigatebirds and seven terns; the nose-over's three terns: RX3, the third polish pass;
//                     the entry's one large frigatebird: RX4; all shaded and marked by shadeBird, a patch of the kit's
//                     bird shader: search "shadeBird"),
//                     the cloud wisps at arm's length on the fall (search "CLOUD WISPS").
//                  d. ABOVE WATER group: sea disc (unscaled), plate group scaled by k about P (islets,
//                     palms, houses, beacon, canoe, two far canoes, rip sheet, bed card, 85 surface sharks, the four
//                     approach sharks), eight large sharks in world space under the bar's crests and on to the pass
//                     mouth (skim-sharks, search "SK ="), the dolphins' spray, and the
//                     depth-only screen in front of the exit portal's halo (search "glow-screen").
//                  e. BELOW WATER group: HERO PLACEMENT (search "HERO PLACEMENT"), canyon loft (wallL: in the
//                     amphitheatre the walls have deep bays, buttresses and a ledge), table
//                     corals (plate1), mound colonies and boulders (boulder), bommies, the portal's rubble
//                     ring, THE AMPHITHEATRE'S WALLS (search it: large corals on the far walls, their own mesh),
//                     THE EXIT'S REEF (search it: its own rock mesh), fans, whips, eels and the exit's own
//                     (exitG), anthias, fusiliers, wrasse, hover schools (wallFish, exit anthias and fusiliers),
//                     station mantas, THE MANTA MOMENT (search it), sand rays, escorts, dolphins, stragglers (and the
//                     eighteen round the portal: sharks-portal),
//                     THE REAR GUARD (search it), THE PACERS (search it: the hero's pacers, ten to fourteen large
//                     station animals along our line through the sheet), sand smoke.
//                  f. underwater kit (fog, rays: their cross-profile is softened by a patch of the kit's ray shader,
//                     search "THE SHAFTS' EDGES"; plankton, waterline), the sixteen shafts round the portal, bubbles.
//                  g. POIS, POST (exposure, bloom, grade: search "POST"), update(), dispose().
// REEF LOOK: the canyon, corals and boulders are shaded by the hero's ROCK_FRAG (see its header: lobed crust patches, a
//   few wandering crevices, shadowed pockets, no cellular net): the writer's occlusion (aCol.a: 0.5 at a wall's foot, 1 at
//   its rim) decides where the reef is warm and sunlit and where it drains to deep olive-teal shadow.
// SEVENTH PASS (a narrow repair round): the exit canyon's walls keep their warm crust (the hero's ROCK_FRAG); on the skim
//   the water within forty-five metres of the lens is the pass's deep blue again (SEA_SHADE, "THE SKIM"), and the shallows'
//   outline from the air is feathered; the race's foam lines and crests are ragged lace; the frigatebirds are dark
//   chocolate, long-winged and fork-tailed (FRIG); the manta's back is charcoal-blue with a pale hook
//   on each shoulder (MANTA_FRAG), its cephalic lobes rooted to the head (MANTA_VERT); the kit shafts' broad lobe is a
//   quarter stronger.
// EIGHTH PASS (everything staged is a rule in the world or a beat of the design. A second of the design means the place
//   the flight has reached at that share of its 50 s, u = second / 50: whatever happens at a place is driven by u, never
//   by the world's clock, and whatever runs on the clock reads the same at any phase): the reef near the lens is plate
//   tiers, plates, pits and pockets (the hero's ROCK_FRAG, "arm's length": a rule of distance in the world); the pacers are stations of the wall (search "THE
//   PACERS"); the manta is the one cast that flies with us (it leads the lens along the route, in the path's own
//   frame); the dolphins' leaps are phased by the pod's seed and they are painted
//   as bottlenoses; an eagle ray has small round spots; the birds' undersides take the lagoon's mint bounce again.
// THE HAND MEND AFTER IT: the manta's table, the entry's frigatebird and the nose-over's three terns are the site's own
//   lines again, as the site wrote them (keyed to u); the flock we
//   fall through has three near birds of its own, flying inside it (pass-flock-near); the pacers are ten to fourteen,
//   one every 8 to 10 m of our line through the sheet, each a third of a turn round the line from the one before
//   (search "THE PACERS"); the sand rays' start bearings and the skim and approach sharks' tail beats are drawn
//   (pass-rays, pass-skim), not typed.
// THE FLOCK CURE (10 Oct): seven of the air's bird calls keep 2.3 m of clear air from the lens's place, by place and on every deal (search "flock cure"); the flock we fall through is as it was.
// FOG: air is a thin FogExp2 (apparent-distance haze is done in the sea / islet / prop shaders with
//   distance / k); below, the water kit retunes the same fog to 0.009 in the water colour of the mood.
// SCRIPTED MOMENTS (driven by u in update(), as the guide asks; the seconds are the design's):
//   uPlate.z (k)      the air-leg scale trick: KMIN (0.18) for the opening view only, then kOf(u): keys of ln k joined by a
//                     monotone cubic (kKeys: knots at u 0.08, 0.12, 0.16 and 0.2, of which only 0.12 is a beat the design
//                     names, the end of its ring beat at 6 s; then the old ramp's last third, 1 at K1)
//   the nose-over     pois[1]: from the first second the gaze drops, eased, to the sea four tenths of the way to the pass,
//                     so the ring swells to overfill the frame's width with the notch on the centre line while the
//                     horizon and a strip of sky stay in the top of the picture into the fall
//   the pull-out      pois[2]: from 4 to 12 s the gaze lifts again to the far side of the lagoon, so the pass, the lagoon
//                     and the sky are in the picture together at the design's 8 s, and the skim (the path's last two air
//                     points, 5.4 and 2.8 m up) comes in looking almost level
//   frigatebird       one large frigatebird glides down the entry 12 m ahead, in the upper third, from u 0 to 0.035 (RX4; a
//                     cross route keyed to u, so it is there on every seed)
//   skim sharks       eight 2.6 to 3 m sharks hang half across the tide under the bar and on to the pass mouth (world space)
//   terns             a dozen cross the bow 17 m ahead five seconds in (RX2); the flock we fall through crosses our line
//                     where the flight is 8.65 s in (u K0 + 0.055; the design's tern flock, at its 9 s), and three large
//                     near birds fly inside it on the same crossing (pass-flock-near)
//   terns (nose-over) three large terns in echelon cut across the bow 7-11 m ahead at u 0.083 (RX3; in frame u 0.06 .. 0.095)
//   cloud wisps       four world-fixed scraps beside the fall, some 9 m off our line; we pass them between 3.3 and 7.6 s
//                     of the flight (38 to 89 m of the route; WISP_*; no hook: only their noise moves)
//   uCanoe            canoe position / heading (the wake is painted from it): it beats seaward against us, 9 m off the
//                     starboard bow, small as the skim begins, a quarter of the frame tall two seconds before the dive and
//                     abeam at canoeU (just after uDive; on dolphin seeds it passes earlier and wider, under the descent, at K1 - 0.08);
//                     drawn at 1.2 / max(k, 0.8) of its size, so its sail stands a twelfth of the frame tall from the skim
//   fishStream.uSchool*  the fusilier river overtaking on the left in the canyon
//   bubbles opacity   one second of bubbles at the dive (uDive)
//   overManta         THE MANTA MOMENT (the site's table): a manta comes round the coral head, turns down the canyon and
//                     flies with the lens past the head, some 6 m ahead, 2.7 m to the right and half a metre below; it
//                     rolls over as we pass (44 degrees back-to-us 36 m short of the head, level some 7 m past it, 28
//                     degrees belly-to-us 29 m past it), draws ahead and leaves to the right (MANTA_KEYS: lead / height
//                     / side / pitch / roll / heading against u - uHead; its knots lie 71 m before the head to 81 m after)
//   the pacers        PACE (not scripted: stations in the world): ten to fourteen large sharks (the hero's addPacer) hold
//                     station along our line through the sheet (the design's 25 to 34 s of it, 105 m): one every 8 to
//                     10 m of the line, each a third of a turn round the line from the one before (give or take 35
//                     degrees), 1.4 to 3 m off it and never nearer than 1.2 m (gaps, bearings, distances, lengths and
//                     phases from their own stream, pass-pacers), slipping back and beating forward on the world's
//                     clock; the ranks part round every one in space
//   dolphins (rare)   two pods porpoising in long low arcs either side of the bow on the skim (K1 .. uDive - 0.01), their leap
//                     phases a third of a cycle apart and set by the pod's seed, a fan of spray (sprayOf / uSpl) where each
//                     breaks the surface and falls back, and their kit shader patched: bottlenose markings, and a tint
//                     under water; below, two pods cut across the bow in the canyon (cross routes at 62% and 98% of uDive..uBend)
//   eel uSink         garden eels sink ahead of the lens (camera distance, no u needed)
//   the wall's parting follows the camera inside the hero (no hook needed), and so do the shark meshes' instance counts
//   exitReef / exitG  the exit's reef and dressing are hidden until the lens is at z < 10 (out of sight before that);
//                     wallFish (the amphitheatre's fusiliers) is hidden once the lens is past z = -55
//   sandRays, farCanoes   four rays gliding loops over the exit's sand; two canoes sailing the open sea (uCanoe2 / uCanoe3)
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, sharkGeometry, makeWriter, vertexNormalsInSlices } from '../parts/atoll-pass-shark-wall.js';

const PALETTE = ['#0B3C9C', '#8DF3D6', '#17B093', '#F6FCF8', '#D9AF98', '#0C5078', '#FF7B2E'];
const DURATION = 50;

// ================================================================= 1. GLSL
const NOISE_GLSL = /* glsl */`
float aHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float aNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(aHash(i), aHash(i + vec2(1., 0.)), f.x), mix(aHash(i + vec2(0., 1.)), aHash(i + vec2(1., 1.)), f.x), f.y); }
float aFbm(vec2 p){ return aNoise(p) * .5 + aNoise(p * 2.03 + 17.1) * .3 + aNoise(p * 4.1 + 41.7) * .2; }
vec3 aVoro(vec2 p){
  vec2 i = floor(p), f = fract(p); float best = 9.; vec2 bid = i;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 o = vec2(aHash(i + g), aHash(i + g + 71.3));
    float dd = length(g + .15 + .7 * o - f); if (dd < best) { best = dd; bid = i + g; }
  }
  return vec3(best, aHash(bid + 5.7), aHash(bid + 91.1));
}`;

// ring / islets / rip: mirrored by makeAtoll() in JS. Plate space = real metres at k = 1.
const ATOLL_GLSL = /* glsl */`
uniform vec4 uRing;    // centre x, centre z, R0, angle of the pass
uniform vec4 uRingE;   // e2, phi2, e3, phi3
uniform vec4 uIsl;     // islet count n, a1, a2, e5
uniform vec4 uPlate;   // P.x, P.z, k, time
uniform vec4 uRipP;    // flow dir x, z, standing-wave amplitude, chop amplitude
float ringR(float th){ return uRing.z * (1. + uRingE.x * cos(2. * (th - uRingE.y)) + uRingE.z * cos(3. * th - uRingE.w) + uIsl.w * cos(5. * th + 1.3)); }
float angDiff(float a){ return a - 6.2831853 * floor(a / 6.2831853 + .5); }
float islA(float th, float s){
  float f = sin(uIsl.x * th + 1.6 * sin(3. * th + uIsl.y) + .9 * sin(7. * th + uIsl.z));
  float a = smoothstep(-.15, .55, f), sh = abs(s), e = (sh - 260.) / 170.;
  a = max(a, exp(-e * e));
  return a * smoothstep(105., 170., sh);
}
float islH(float a, float d){ float hw = 22. + 58. * a, x = (d + 55.) / hw; return a < .02 ? -1.5 : 3.4 * sqrt(max(a, 0.)) * (1. - x * x) - .6 * (1. - a); }
float ripH(vec2 q, float t){
  vec2 rl = q - uPlate.xy; float a = dot(rl, uRipP.xy), b = dot(rl, vec2(-uRipP.y, uRipP.x));
  float env = exp(-b * b / 2400.) * smoothstep(-125., -78., a) * (1. - smoothstep(150., 330., a));
  float ph = a * .7854 + .8 * sin(b * .15 + t * .3);
  return env * uRipP.z * sin(ph) * (.75 + .25 * sin(b * .31 + t * .7))
       + uRipP.w * (sin(.9 * q.x + .5 * q.y - 1.9 * t) + .7 * sin(-.6 * q.x + 1.3 * q.y - 2.3 * t));
}`;

// the approach sharks' seats on the plate (sixth polish pass): metres along the tide from P, metres to the right, yaw off the
// heading into the tide. SEA_SHADE lays a pale sand lens under each; build() seats the animals (search "approach-sharks") and
// draws each one's tail-beat phase from the skim sharks' stream
const AP_SEATS = [[-99, -21, 1.25], [-108, 25, -1.35], [-118, -3, 1.12], [-126, 17, -1.22]];
const AP_LENS = AP_SEATS.map(([a, b]) => 'lens = max(lens, 1. - smoothstep(.3, 1., length(vec2(pa - (' + a.toFixed(1) + '), pb - (' + b.toFixed(1) + ')) / vec2(15., 22.)) + .35 * (sn3 - .5)));').join('\n  ');
const SEA_SHADE = /* glsl */`
uniform vec3 uCobalt, uMint, uJade, uTeal, uSand, uTan, uFoam, uFoamSh, uReefDark, uPassCol;
uniform vec3 uSkyZen, uSkyHor, uHazeCol, uLit, uSunCol, uShadowTint, uSunDir;
uniform vec4 uWind;    // dir x, z, chop 0..1, cloud-shadow strength
uniform vec4 uSunA;    // shadow offset x, z (m per m of height), haze per metre, reflection gain
uniform vec4 uCanoe;   // position x, z, heading x, z
uniform vec4 uCanoe2, uCanoe3;   // the two large canoes out on the open sea (seen from the air: a fleck and a pale V)
uniform vec4 uSquall;  // centre x, z, radius, strength
float gLace = 1.;       // metres per pixel for the foam lace: geometric mean of the two screen directions, set by the caller
float gNet = 1.;        // the rip sheet's close-range foam net (set by RIP_FRAG; 1 everywhere else)
// a canoe's wake: a white V and a churned stern trail, never thinner than a pixel. L: length scale
float wakeOf(vec4 c, vec2 q, float fw, float L){
  vec2 cr = q - c.xy; float cx = -dot(cr, c.zw), cy = dot(cr, vec2(-c.w, c.z));
  float wk = (1. - smoothstep(.3 + cx * .012 + fw * .7, .9 + cx * .03 + 1.4 * fw, abs(abs(cy) - cx * .33))) * (1. - smoothstep(30. * L, 120. * L, cx));
  return max(wk, (1. - smoothstep(.4, 1.3 + fw, abs(cy))) * (1. - smoothstep(4., 40. * L, cx)) * .9) * step(0., cx);
}
// q: plate-space position, N: geometric normal, V: unit vector to the eye, D: apparent distance, fw: metres per pixel
vec3 seaShade(vec2 q, vec3 Ng, vec3 V, float D, float fw, out float foamOut){
  float t = uPlate.w;
  vec2 rel = q - uRing.xy; float r = length(rel) + 1e-3;
  float th = atan(rel.y, abs(rel.x) < 1e-4 ? 1e-4 : rel.x);
  float d = r - ringR(th), s = angDiff(th - uRing.w) * uRing.z;
  float a = islA(th, s), hI = islH(a, d);
  vec2 wd = uWind.xy, wp = vec2(-wd.y, wd.x);
  float n1 = aFbm(q * .0031 + 3.7), n2 = aNoise(q * .021), n3 = aNoise(q * .11 + 9.);
  float nearK = clamp(1.5 - fw * .7, 0., 1.), midK = clamp(1.6 - fw * .12, 0., 1.);
  // ---- lagoon: mint sand shelves, jade at 10 m, teal in the middle, patch reefs in pale halos
  float dl = -d - 165. + 110. * (n1 - .5), dep = smoothstep(0., 430., dl);
  vec3 lag = mix(uMint, uJade, smoothstep(.10, .5, dep));
  lag = mix(lag, uTeal, smoothstep(.45, 1., dep)) * (.88 + .24 * n1);
  lag = mix(lag, uMint * 1.04, (1. - smoothstep(0., .16, dep)) * .6);
  vec3 vr = aVoro(q / 128. + 13.);
  float rr = .05 + .19 * vr.y * vr.y, on = step(.3, vr.z) * smoothstep(.05, .18, dep), aa = fw / 128.;
  float halo = (1. - smoothstep(rr * 1.15, rr * 1.75 + .035 + aa, vr.x + .04 * (n2 - .5))) * on;
  float core = (1. - smoothstep(rr * .8 - aa, rr + aa, vr.x + .05 * (n3 - .5))) * on;
  lag = mix(lag, uMint * 1.02, halo * .7 * (1. - .4 * dep));
  lag = mix(lag, uReefDark * (.8 + .5 * n3), core * .92);
  float stK = aNoise(vec2(dot(q, wp) * .2, dot(q, wd) * .01 - t * .04));
  lag *= 1. + .09 * (stK - .5) * midK * (.4 + .6 * uWind.z);
  vec3 col = lag;
  // ---- reef flat: tan-pink under a hand of water, white sand on its lagoon shore, spur and groove seaward
  float flatM = smoothstep(0., 28., -dl);
  vec3 flatC = mix(uTan, uMint, .22) * (.78 + .3 * n2) * (.9 + .2 * n3 * nearK);
  flatC = mix(flatC, uSand, (1.0 - smoothstep(0., 40., -dl)) * .7);
  flatC = mix(flatC, uTan * .62, smoothstep(.6, .8, aNoise(q * .035 + 31.)) * .5);
  float gr = sin(s * .29 + 2.5 * aNoise(vec2(s * .02, 3.)));
  float grooveK = smoothstep(.15, .7, gr) * smoothstep(5., 50., d + 12. * n2) * midK;
  vec3 slope = mix(uPassCol * 1.25, uCobalt, smoothstep(60., 210., d));
  flatC = mix(flatC, slope, grooveK * .85);
  col = mix(col, flatC, flatM);
  float lace0 = .55 + .45 * aNoise(q * .13 + vec2(t * .3, 0.));
  // ---- open ocean: cobalt, swell wrapping the ring, whitecaps
  float seaM = smoothstep(52., 96., d + 14. * (n2 - .5));
  float wrap = (1.0 - smoothstep(160., 800., d));
  // (two wave trains, the wind's and the one wrapping the ring, cross-faded: one sine of a phase blended between the two ran
  // five times finer wherever the blend changed, and from the air that band showed as ruled lines. Each train, and the long
  // swell below, is faded by how fast its own phase turns per pixel, so nothing finer than nine pixels a wave is ever drawn)
  float swW = 3. * n1 + 2.6 * aNoise(q * .011 + 7.) - t * .8, phA = dot(rel, wd) * .074 + swW, phB = -d * .074 + swW;
  // (fourth polish pass: the fade is by the pixel footprint of the wave itself and much earlier. A train is drawn in full only
  // while one wave spans thirty pixels and is gone at ten: at eleven pixels a wave, full strength, it was a fine ruled banding
  // over the whole open sea in the opening seconds)
  float swell = mix(sin(phA) * clamp(1.45 - fwidth(phA) * 2.4, 0., 1.), sin(phB) * clamp(1.45 - fwidth(phB) * 2.4, 0., 1.), wrap) * (.35 + .65 * aNoise(q * .0052 + vec2(t * .01, 3.)));   // (wave groups: never ruled lines)
  vec3 oc = mix(slope, uCobalt * mix(1., .62, smoothstep(150., 1100., d)), smoothstep(60., 260., d));
  float wcA = dot(q, wd), wcB = dot(q, wp);
  // the open sea is never one flat tone, from any height: the swell wrapping the ring, a longer swell crossing it, and
  // cat's paws (wind-ruffled water lying in long paler patches down the wind, darker slicks between)
  float ph2 = dot(rel, wd * .82 + wp * .57) * .027 - t * .5 + 4. * n1;
  float swell2 = sin(ph2) * clamp(1.45 - fwidth(ph2) * 2.4, 0., 1.) * (.55 + .45 * aNoise(q * .0031 + vec2(9., t * .008)));
  oc *= 1. + .16 * swell * clamp(1.75 - fw * .2, 0., 1.) + .10 * swell2 * clamp(1.7 - fw * .075, 0., 1.);   // (each only while a wave spans 7+ pixels, full from 16: broad bands, never ruled lines)
  float gust = aNoise(vec2(wcA * .0035 - t * .012, wcB * .0105 + 9.)) * .65 + aNoise(vec2(wcA * .011 - t * .03, wcB * .03 + 4.)) * .35;
  oc *= .84 + .40 * smoothstep(.25, .8, gust);
  float wcN = aNoise(vec2(wcA * .3 - t * 1.1, wcB * .05)) * .72 + aNoise(vec2(wcA * .7 - t * 1.6, wcB * .14)) * .28;
  float wc = smoothstep(.67, .80, wcN) * smoothstep(.47, .7, aNoise(vec2(wcA * .035 + 3., wcB * .017) - t * .04)) * min(uWind.z, 1.);
  float wcFar = clamp(1.5 - fw * .22, 0., 1.);   // with range the caps thin out to fewer white flecks, then none (never a haze of dim streaks)
  // lace at every range: three scales, each used only while a pixel still resolves it (crests break into streaks, not blots)
  float wl1 = aNoise(vec2(wcA * .85 - t * 1.5, wcB * .30 + 2.)), wl2 = aNoise(vec2(wcA * 2.5 - t * 2.3, wcB * 1.0 + 7.)), wl3 = aNoise(q * 6.1 + wd * t * 2.);
  float wk1 = clamp(1.6 - gLace * .8, 0., 1.), wk2 = clamp(1.6 - gLace * 2.4, 0., 1.), wk3 = clamp(1.6 - gLace * 6.5, 0., 1.);
  float wLace = mix(.7, wl1, wk1) * .5 + mix(.7, wl2, wk2) * .3 + mix(.7, wl3, wk3) * .2;
  wc *= smoothstep(.38, .66, wLace);
  col = mix(col, oc, seaM);
  wc *= smoothstep((1. - wcFar) * .9, (1. - wcFar) * .9 + .25, wc) * smoothstep(0., .15, wcFar);
  float foam = wc * seaM * smoothstep(160., 260., d) * (.5 + .5 * lace0);
  // ---- surf: breakers rolling in over the reef edge, a chalk swash line that never thins below a pixel
  float lace = lace0;
  float b = fract((d + 16. * n2) / 40. + t * .10);
  float breaker = smoothstep(0., .10, b) * (1. - smoothstep(.10, .8, b)) * lace;
  float surfEnv = (1.0 - smoothstep(118., 150., d)) * smoothstep(46., 66., d);
  float swash = 1. - smoothstep(6. + fw, 15. + 2. * fw, abs(d - 60. - 8. * (n2 - .5)));
  float surf = max(breaker * surfEnv * 1.2, swash * .9);
  // ---- the pass, the tide pouring through it and its tongue in the lagoon
  float tl = max(dl, 0.), oceanSide = max(d - 60., 0.);
  float us = s / (108. + tl * .42 + oceanSide * .5);
  float inPass = 1. - smoothstep(.82, 1.08, abs(us) + .06 * (n2 - .5));
  float tongue = inPass * (1. - smoothstep(260., 430., tl)) * (1. - smoothstep(70., 240., oceanSide));
  vec3 passC = mix(uPassCol, uCobalt, .6 * smoothstep(-120., 110., d));
  passC = mix(passC, mix(uJade, uPassCol, .45), smoothstep(0., 300., tl));
  float chan = tongue * mix(1., .55, smoothstep(40., 330., tl)) * (1. - smoothstep(30., 170., oceanSide));
  col = mix(col, passC, chan);
  vec2 rp = q - uPlate.xy;
  // ---- (sixth polish pass) the apron seaward of the pass: turquoise shallows over its sand, a soft patchy field with no
  // edge anywhere (it runs from 230 m seaward of P to the pass mouth, where the see-through water of the rip sheet takes
  // over in the same colour, so the sheet's near water is never a disc of another colour), and a paler sand lens under
  // each of the approach sharks
  float pa = dot(rp, uRipP.xy), pb = dot(rp, vec2(-uRipP.y, uRipP.x));
  float sn1 = aNoise(rp * .019 + 41.), sn2 = aNoise(rp * .055 + 5.), sn3 = aNoise(rp * .16 + 19.);
  // (seventh pass: its outline is feathered. The side and seaward edges ran on the 18 m noise at full swing over a 100 m
  // ramp and showed from the air as a lobed, blobby border against the deep blue; they now follow the slow 50 m field over
  // a ramp half as wide again, so the turquoise thins out into the cobalt with no edge to see)
  float shoal = smoothstep(-285., -140., pa + 50. * (sn1 - .5)) * (1. - smoothstep(-30., 80., pa + 70. * (sn1 - .5))) * (1. - smoothstep(28., 176., abs(pb) + 46. * (sn1 - .5) + 18. * (sn2 - .5)));
  shoal *= (.45 + .55 * smoothstep(.22, .7, sn2 * .6 + sn3 * .4)) * mix(.4, 1., smoothstep(.2, .42, uPlate.z));   // (from the opening's height a faint pale apron, no more)
  float lens = 0.;
  ${AP_LENS}
  // (seventh pass) THE SKIM: once the plate is near full size (k over 0.6, u 0.22 on) the water within some forty-five metres of
  // the lens is the pass's own deep blue again, so every shark under the surface is a dark body in clear dark water; the
  // turquoise of the shallows stays where it is seen from the air and, on the skim, out toward the islets
  { float skimK = smoothstep(.60, .80, uPlate.z) * (1. - smoothstep(18., 70., D));
    shoal *= 1. - .9 * skimK; lens *= 1. - .78 * skimK; }
  col = mix(col, mix(uJade, uMint, .36 + .3 * sn3), shoal * .68);
  col = mix(col, uMint * 1.03, lens * .6);
  float rip = sin(dot(rp, uRipP.xy) * .7854 + .8 * sin(dot(rp, vec2(-uRipP.y, uRipP.x)) * .15 + t * .3) + 2.4 * n2 + 2.2 * aNoise(rp * .08 + 31.));
  col *= 1. + .15 * rip * (.2 + .8 * smoothstep(.3, .7, aNoise(rp * .05 + vec2(t * .04, 7.)))) * (.4 + .6 * min(uWind.z, 1.)) * tongue * clamp(1.5 - fw * 2., 0., 1.);   // (broken wave groups, never ruled stripes)
  float stN = aNoise(vec2(us * 11., d * .014 + t * .22)) * (.6 + .4 * aNoise(vec2(us * 31., d * .05 + t * .6)));
  float lace2 = smoothstep(.34, .62, aNoise(q * .5 + uRipP.xy * t * 1.6) * .65 + aNoise(q * 1.7 + uRipP.xy * t * 2.4) * .35);
  float streak = smoothstep(.42, .62, stN) * tongue * (.35 + .65 * smoothstep(.2, 1., abs(us))) * mix(1., lace2, nearK);
  // (seaward of the surf line the streaks are short broken lengths of foam that thin out and are gone within 130 m: drawn to
  // 240 m in unbroken lines they fanned over the dark sea as long pale smears)
  streak *= mix(1., smoothstep(.42, .66, aNoise(vec2(us * 19., d * .055 + t * .3))), smoothstep(0., 50., oceanSide)) * (1. - smoothstep(40., 130., oceanSide));
  vec3 bo = aVoro(vec2(s, d + t * 5.) / 42. + 3.);
  float boilOn = step(.55, bo.y) * tongue * midK;
  col = mix(col, col * 1.22 + .012, (1.0 - smoothstep(.16, .40, bo.x)) * boilOn * .7);
  foam = max(foam, surf * (1. - inPass));
  // (a boil's foam rim is a ragged arc or two, wandering in radius: never a ruled ellipse, from the air least of all)
  foam = max(foam, streak * .7 + (1.0 - smoothstep(0., .07, abs(bo.x - .36 + .13 * (aNoise(q * .09 + 3.) - .5)))) * smoothstep(.42, .62, aNoise(q * .045 + vec2(17., t * .05))) * boilOn * .3 * lace2);
  // ---- (sixth polish pass) the race from the air: where the tide draws in to the pass its two edges show as lines of foam
  // that converge from 80 m either side, 170 m out, to the pass mouth (three lines a side, 10 m apart, broken into
  // lengths), and two standing crests stand across it between them, 78 and 128 m seaward of P, each a broken line of
  // foam bent back like a chevron with a dark trough on its seaward side. All of it is the from-the-air drawing of the
  // rip: it fades as the plate comes up to size (k 0.62 to 0.8), where the sheet's own waves, bar and lace take over, and
  // from very high it thins to a faint trace.
  { float aw = pa + 12. * (sn2 - .5), bw = abs(pb + 16. * (sn1 - .5) + 5. * (sn3 - .5));
    float eB = 22. + 63. * clamp((10. - aw) / 180., 0., 1.25), sv = (bw - eB) / 10., si = floor(sv + .5), eW = min(max(.13, fw * .14), .3);
    // (seventh pass: each line is a ragged run of lace, not an even stroke. Its width swells and thins along its length,
    // half to one and a half times, on a 6 m noise; a finer field tears gaps in it; it is brighter on its outer side and
    // falls to the foam's blue-violet shadow inside; and it fades over the last third of each run instead of ending round)
    float eRun = aNoise(vec2(aw * .07 - t * .12, si * 7.3 + sign(pb) * 3.1)) * .65 + aNoise(rp * .21 + 13.) * .35;
    float eRag = aNoise(vec2(aw * .17 + si * 3.7, bw * .21 + 9.)), eLace = aNoise(rp * .47 + vec2(23., t * .05)) * .6 + aNoise(rp * 1.1 + 5.) * .4;
    float eWv = eW * mix(.6, 1.8, eRag), eS = sv - si;
    float eL = (1. - smoothstep(eWv * (eS < 0. ? 1.7 : .8), eWv * (eS < 0. ? 1.7 : .8) + .1 + fw * .05, abs(eS))) * mix(1., .6, smoothstep(0., eWv * 1.7, -eS)) * (1. - smoothstep(.6, 1.6, abs(si - .2)));
    eL *= smoothstep(-215., -165., aw) * (1. - smoothstep(-20., 25., aw));
    eL *= smoothstep(.36, .58, eRun) * mix(.5, 1., smoothstep(.46, .60, eRun)) * (.5 + .5 * smoothstep(.26, .50, eLace));
    float cr = 0., crSh = 0., cW = max(1.5, fw * 1.1);
    for (int j = 0; j < 2; j++) {
      float A = j == 0 ? -78. : -128., dC = aw - (A + .16 * bw) - 2.5 * sin(pb * .21 + float(j) * 2.);
      float within = 1. - smoothstep(eB - 16., eB - 4., bw);
      // (a crest's foam is sharp on its seaward lip and trails off down its back in torn lace; its width wanders)
      float cRun = aNoise(vec2(pb * .085 + t * .08, A * .37)) * .6 + aNoise(rp * .27 + 7.) * .4, cWv = cW * mix(.55, 1.5, aNoise(vec2(pb * .19 + A, aw * .13)));
      float cD = dC < 0. ? -dC * 1.6 : dC * .7;
      cr = max(cr, (1. - smoothstep(cWv * .6, cWv + 1.2 + fw, cD)) * mix(1., .6, smoothstep(0., cWv, dC)) * within * smoothstep(.32, .54, cRun) * mix(.55, 1., smoothstep(.40, .56, cRun)) * (.5 + .5 * smoothstep(.24, .50, eLace)));
      crSh += within * (smoothstep(1.5, 4., dC) * (1. - smoothstep(4., 11., dC)) * .6 - smoothstep(-10., -4., dC) * (1. - smoothstep(-4., -1., dC)));
    }
    float airK = smoothstep(.15, .4, fw) * (1. - smoothstep(.62, .8, uPlate.z)) * clamp(2.6 / max(fw, 1e-3), 0., 1.);
    col *= 1. + .16 * crSh * airK;
    foam = max(foam, max(eL * .8, cr) * airK * (.6 + .4 * lace0)); }
  // ---- the canoe's wake
  float wk = max(wakeOf(uCanoe, q, fw, 1.), .62 * max(wakeOf(uCanoe2, q, fw, .5), wakeOf(uCanoe3, q, fw, .5)));
  foam = max(foam, wk * lace * .8);
  // ---- islets: the sand they stand on, and the shadows they throw
  col = mix(col, uSand * (.92 + .1 * n3), smoothstep(-1.3, -.15, hI) * .9);
  vec2 rel2 = rel + uSunA.xy * 9.; float th2 = atan(rel2.y, abs(rel2.x) < 1e-4 ? 1e-4 : rel2.x);
  float h2 = islH(islA(th2, angDiff(th2 - uRing.w) * uRing.z), length(rel2) - ringR(th2));
  col *= mix(vec3(1.), uShadowTint, smoothstep(.9, 2.2, h2) * .6);
  // ---- cloud shadows (jade blots) and the squall's shadow
  float cs = smoothstep(.52, .72, aFbm((q + wd * t * 34.) * .0013 + 5.));   // (34 m/s: from the air the blots visibly slide over the lagoon)
  col *= mix(vec3(1.), vec3(.60, .76, .74), min(1., cs * uWind.w * (1. + .8 * (1. - smoothstep(.2, .45, uPlate.z)))));   // (deeper in the opening view, while the plate is small)
  vec2 sq = (q - uSquall.xy) / max(uSquall.z, 1.);
  col *= mix(vec3(1.), vec3(.27, .34, .40), uSquall.w * (1. - smoothstep(.5, 1.1, length(sq) + .2 * (n1 - .5))));
  // ---- light, foam, sky reflection, sparkle, haze
  col *= uLit;
  float closeK = clamp(1.5 - gLace * 5., 0., 1.);
  float lace3 = smoothstep(.24, .52, aNoise(q * 3.3 + uRipP.xy * t * 2.) * .6 + aNoise(q * 8.1 - uRipP.xy * t * 1.3) * .4);
  foam = clamp(foam, 0., 1.) * mix(1., lace3, closeK) * gNet;
  // foam keeps blue-violet shadow inside it and never goes to flat white
  float fShade = mix(.75, aNoise(q * .8 + 3. - wd * t * .6) * .6 + aNoise(q * 2.9 + wd * t) * .4, clamp(1.6 - gLace * 1.8, 0., 1.));
  col = mix(col, mix(uFoamSh, uFoam, smoothstep(.3, .95, foam) * smoothstep(.2, .7, fShade)) * uLit, foam * .84);
  // ripples only once the plate is near full size and while a wave still spans several pixels (else they moire)
  float kK = smoothstep(.45, .95, uPlate.z);
  vec3 N = Ng; float rpl = kK * clamp(1.5 - fw, 0., 1.) * (.25 + .75 * uWind.z);
  N.xz += rpl * .10 * vec2(sin(q.x * 1.9 + t * 1.7 + sin(q.y * 1.3 - t) * 1.2), sin(q.y * 2.3 - t * 1.4 + sin(q.x * 1.1 + t * .8) * 1.3));
  N.xz += kK * clamp(1.4 - fw * 2.5, 0., 1.) * .07 * vec2(sin(q.x * 5.3 + t * 2.9 + sin(q.y * 4.1 - t)), sin(q.y * 6.1 - t * 2.3 + sin(q.x * 3.7 + t)));
  // capillary ripples in the last few metres before the lens, so the face of a wave is never one flat tone
  N.xz += kK * clamp(1.4 - fw * 14., 0., 1.) * .055 * vec2(sin(q.x * 17. + t * 4.1 + 1.7 * sin(q.y * 11. - t * 1.3)), sin(q.y * 21. - t * 3.7 + 1.5 * sin(q.x * 13. + t * 1.1)));
  col *= 1. + .1 * nearK * (aNoise(q * 1.3 + uRipP.xy * t * 1.2) - .5);
  N = normalize(N);
  float ndv = clamp(dot(N, V), 0., 1.), om = 1. - ndv, fr = .02 + .98 * om * om * om * om * om;
  vec3 Rv = reflect(-V, N);
  vec3 sky = mix(uSkyHor, uSkyZen, pow(clamp(Rv.y, 0., 1.), .45));
  col = mix(col, sky, clamp(fr * uSunA.w, 0., 1.) * (1. - .85 * foam) * (1. - .5 * max(shoal * .9, lens)));   // (the shallows keep their colour under the sky's glare)
  float sp = aNoise(q * 2.3 + vec2(t * 1.3, -t * .9)) * aNoise(q * .83 - vec2(t * .5, t * .7));
  float glit = mix(1., smoothstep(.5, .78, aNoise(q * 7.3 + vec2(t * 2.1, -t * 1.6))), clamp(1.5 - fw * 4., 0., 1.)) * mix(1., 1.6 * smoothstep(.5, .8, aNoise(q * 23. - vec2(t * 3.3, t * 2.7))), clamp(1.5 - fw * 12., 0., 1.));   // near the lens a glint is glitter, not a white patch
  float nearG = smoothstep(3., 9., D);   // the last few metres before the lens are glass: there a glint is a pin-point, never a patch
  col += uSunCol * 1.1 * smoothstep(.60, .78, sp) * glit * clamp(1.4 - fw * 3.5, 0., 1.) * (1. - foam) * (.3 + .7 * min(uWind.z, 1.)) * nearG;   // sparkle only where a glint spans a pixel (no salt-and-pepper from the air)
  float pin = smoothstep(.80, .93, aNoise(q * 57. + vec2(t * 3.7, -t * 3.1))) * smoothstep(.45, .7, sp);
  col += uSunCol * .9 * pin * (1. - nearG) * clamp(1.5 - fw * 60., 0., 1.) * (1. - foam) * (.3 + .7 * min(uWind.z, 1.));
  col = mix(col, uHazeCol, 1. - exp(-D * uSunA.z));
  foamOut = foam;
  return col;
}`;

// ---- the open sea: a flat disc that follows the camera; everything on it is painted in plate space
const DISC_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const DISC_FRAG = /* glsl */`
uniform vec4 uRip;     // rip sheet centre x, z (plate), radius, disc radius
varying vec3 vW;
${NOISE_GLSL}
${ATOLL_GLSL}
${SEA_SHADE}
void main(){
  float k = max(uPlate.z, .01);
  vec2 q = uPlate.xy + (vW.xz - uPlate.xy) / k;
  if (length(q - uRip.xy) < uRip.z * .9) discard;
  vec3 toEye = cameraPosition - vW; float dist = length(toEye);
  float fw = max(length(dFdx(q)), length(dFdy(q)));
  gLace = sqrt(length(dFdx(q)) * length(dFdy(q)));
  float foam; vec3 col = seaShade(q, vec3(0., 1., 0.), toEye / max(dist, 1e-3), dist / k, fw, foam);
  col = mix(col, uHazeCol, smoothstep(.5, .97, dist / uRip.w));
  gl_FragColor = vec4(col, 1.);
}`;

// ---- the rip: a displaced, fresnel-transparent sheet round P (standing waves from ripH)
const RIP_VERT = /* glsl */`
uniform vec4 uRip;
varying vec3 vW, vN; varying vec2 vQ; varying float vH;
${ATOLL_GLSL}
void main(){
  vec2 q = position.xz; float t = uPlate.w;
  float edge = 1. - smoothstep(uRip.z * .72, uRip.z * .9, length(q - uRip.xy));
  float h = ripH(q, t) * edge, e = .35;
  float hx = ripH(q + vec2(e, 0.), t) * edge, hz = ripH(q + vec2(0., e), t) * edge;
  vN = normalize(vec3(h - hx, e, h - hz));
  vec4 w = modelMatrix * vec4(q.x, h + .03, q.y, 1.); vW = w.xyz; vQ = q; vH = h;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const RIP_FRAG = /* glsl */`
uniform vec4 uRip;
varying vec3 vW, vN; varying vec2 vQ; varying float vH;
${NOISE_GLSL}
${ATOLL_GLSL}
${SEA_SHADE}
// foam lace: 1 on the lines between cells of open water (distance between the two nearest cell centres), 0 inside them
float ripNet(vec2 p, float w){
  vec2 i = floor(p), f = fract(p); float f1 = 9., f2 = 9.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 o = vec2(aHash(i + g), aHash(i + g + 71.3));
    float dd = length(g + .15 + .7 * o - f);
    if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) { f2 = dd; }
  }
  return 1. - smoothstep(.01, w, f2 - f1);
}
void main(){
  float k = max(uPlate.z, .01), t = uPlate.w;
  vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3);
  float fw = max(length(dFdx(vQ)), length(dFdy(vQ)));
  gLace = sqrt(length(dFdx(vQ)) * length(dFdy(vQ)));
  // (a standing wave under a few pixels wide is flat water to the painter: its tilted faces would mirror the sky in ruled lines)
  vec3 N = normalize(mix(vN, vec3(0., 1., 0.), clamp(fw * 2.2 - .5, 0., 1.)));
  // at close range foam is a net of lines round cells of open water, never a sheet: a coarse net while a 30 cm line
  // still spans a pixel, finer strands inside it nearer still, and within a few metres of the lens only broken lace
  vec2 fl = vQ - uRipP.xy * t * 3.2;
  float warp = aNoise(fl * .7), nearF = smoothstep(1.5, 6., dist);
  float kC = clamp(1.6 - gLace * 7., 0., 1.), kF = clamp(1.6 - gLace * 22., 0., 1.);
  // (the net is read through a second, finer warp, so every strand wanders: no straight bar between two junctions; a strand
  // is a few centimetres wide, never thinner than a pixel and a half, and under a third of each survives the break-up)
  vec2 fn = fl + .35 * vec2(aNoise(fl * 2.3), aNoise(fl * 2.3 + 17.)) + .12 * vec2(aNoise(fl * 6.1 + 3.), aNoise(fl * 6.1 + 29.));
  float netC = ripNet(fn * .42 + .6 * warp, max(.045, gLace * .42 * 1.6)), netF = ripNet(fn * 1.3 + 3.1 + .5 * warp, max(.045, gLace * 1.3 * 1.6));
  float net = mix(1., max(netC, kF * .75 * netF) * smoothstep(.50, .70, aNoise(fl * 1.9 + 5.) * .6 + warp * .4), kC);   // (the lines are broken, never a full net)
  gNet = net * nearF;
  // (sixth polish pass) a short-crested chop rides the standing waves within some forty metres of the lens: their faces
  // mirrored the sky in unbroken bands from one side of the frame to the other; now each band is irregular flecks
  { float chopK = smoothstep(.45, .95, k) * clamp(1.8 - fw * .45, 0., 1.);
    N = normalize(N + chopK * .36 * vec3(aNoise(fl * .37 + 3.) + .6 * aNoise(fl * 1.1 + 11.) - .8, 0., aNoise(fl * .37 + 47.) + .6 * aNoise(fl * 1.1 + 23.) - .8)); }
  float foam; vec3 col = seaShade(vQ, N, V, dist / k, fw, foam);
  // relief: faces toward the sun lift, troughs deepen, foam lace rides the crests while the water races through
  float ndl = clamp(dot(N, uSunDir), 0., 1.);
  // (the relief and the see-through water are a close-range affair: from the air the sheet must match the painted sea round it)
  // (its feather is wide: the relief dies away from a quarter of the sheet's radius out, and with it the standing waves' shading
  // where a wave is under a few pixels; the waves come in groups, not as ruled stripes)
  float rimK = smoothstep(uRip.z * .25, uRip.z * .9, length(vQ - uRip.xy)), farK = max(rimK, smoothstep(60., 150., dist) * (1. - smoothstep(.45, .95, k)));
  float grp = .45 + .55 * smoothstep(.25, .7, aNoise(vQ * .05 + vec2(t * .04, 7.)));
  col *= mix(.66 + .3 * ndl + .42 * vH * grp, 1., max(farK, 1. - clamp(1.7 - fw * 2.2, 0., 1.)));
  vec2 fa = vec2(dot(fl, uRipP.xy) * .4, dot(fl, vec2(-uRipP.y, uRipP.x)));       // streaks drawn out along the flow
  // the near face of a wave is glass: deeper blue in the trough, sky toward the crest, sun glitter scattered along the crest
  float nearW = (1. - smoothstep(8., 34., dist)) * (1. - farK);
  col *= mix(vec3(1.), mix(vec3(.55, .72, .95), vec3(1.15, 1.11, 1.04), smoothstep(-.22, .34, vH)), nearW);
  float crest = smoothstep(.24, .36, vH) * smoothstep(.56, .8, aNoise(fl * 5.3 + 2.) * .6 + aNoise(fl * 13. + 7.) * .4);
  col += uSunCol * .45 * crest * nearW * clamp(1.5 - fw * 6., 0., 1.) * smoothstep(3., 8., dist);
  float cf = smoothstep(.19, .34, vH) * smoothstep(.38, .72, aNoise(fa * .6) * .6 + aNoise(fa * 1.7) * .4) * clamp(1.5 - fw * .6, 0., 1.);
  cf *= mix(1., smoothstep(.34, .62, aNoise(fa * 1.9 + 4.) * .55 + aNoise(fl * 3.1) * .45), clamp(1.6 - gLace * 2.2, 0., 1.));
  cf *= mix(1., smoothstep(.3, .6, aNoise(fl * 3.9) * .6 + aNoise(fl * 8.7) * .4), clamp(1.6 - gLace * 6., 0., 1.));
  // (from the air the crest foam comes in broken groups: a slow field leaves under half of the channel foamed, no run of
  // crest longer than some thirty metres, and the whole term is gone before a wave is two pixels wide)
  cf *= mix(1., smoothstep(.46, .66, aNoise(vQ * .041 + vec2(t * .03, 11.)) * .7 + aNoise(vQ * .13 + 5.) * .3), smoothstep(.12, .5, fw)) * clamp(1.5 - fw * 1.2, 0., 1.);
  cf *= net * nearF;
  // the bar: the standing crests the skim crosses short of the pass mouth break in a line of foam, in pieces a few metres
  // long that ride the crest as it wanders (drawn only while a crest is several pixels deep: never a ruled line from the air)
  vec2 brl = vQ - uPlate.xy; float ba = dot(brl, uRipP.xy), bb = dot(brl, vec2(-uRipP.y, uRipP.x));
  float bar = smoothstep(.80, .95, sin(ba * .7854 + .8 * sin(bb * .15 + t * .3))) * smoothstep(-91., -87., ba) * (1. - smoothstep(-69., -65., ba)) * exp(-bb * bb / 500.);
  bar *= smoothstep(.40, .62, aNoise(vec2(bb * .45 + t * .5, ba * .35)) * .65 + aNoise(fl * 2.9 + 31.) * .35);
  bar *= (.55 + .45 * smoothstep(.3, .7, aNoise(fl * 7.3 + 9.))) * clamp(1.6 - fw * 4., 0., 1.) * smoothstep(2., 5., dist) * (1. - farK);
  cf = max(cf, bar);
  col = mix(col, mix(uFoamSh, uFoam, smoothstep(.15, .8, cf)) * uLit, cf * .72);
  float ndv = clamp(dot(N, V), 0., 1.), om = 1. - ndv;
  float edgeA = smoothstep(uRip.z * .78, uRip.z * .9, length(vQ - uRip.xy));
  // (see-through only within some thirty metres of the lens: further off, and from the air, the sheet is the painted sea,
  // so the pass never shows as a disc of another colour)
  float alpha = max(max(max(mix(.30, .95, om * om * om), max(foam, cf)), edgeA), smoothstep(22., 64., dist));
  gl_FragColor = vec4(col, alpha);
}`;
// the dolphins' spray: one upright fan of droplets where an animal breaks the surface and one where it falls back
// (uSpl: x, z, which, age in seconds; under zero: none). Twelve small quads, placed by update().
const SPRAY_VERT = /* glsl */`
uniform vec4 uSpl[12]; attribute vec3 aQ;
varying vec3 vQ; varying float vAge;
void main(){
  vec4 s = uSpl[int(aQ.z + .5)]; float g = clamp(s.w / .8, 0., 1.);
  float w = .3 + .7 * g, h = .35 + 1.9 * g - 1.5 * g * g;        // it widens as it rises and falls back
  vec3 rt = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));
  vec3 p = vec3(s.x, .02, s.y) + rt * (aQ.x * w) + vec3(0., aQ.y * h, 0.);
  if (s.w < 0.) p = vec3(0., -999., 0.);
  vQ = aQ; vAge = g;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`;
const SPRAY_FRAG = /* glsl */`
uniform vec3 uCol; varying vec3 vQ; varying float vAge;
${NOISE_GLSL}
void main(){
  float fan = 1. - smoothstep(.55, 1., abs(vQ.x) / max(.3 + .7 * vQ.y, .05));
  vec2 q = vec2(vQ.x * 13., vQ.y * 17. - vAge * 7.) + vQ.z * 13.7;
  float drops = smoothstep(.42, .68, aNoise(q) * .55 + aNoise(q * 2.7 + 7.) * .45);        // (droplets a few centimetres across)
  float a = fan * max(drops * (.5 + .5 * vQ.y), .5 * (1. - vQ.y) * (1. - vQ.y) * (1. - abs(vQ.x))) * (1. - smoothstep(.7, 1., vQ.y)) * (1. - smoothstep(.45, 1., vAge)) * smoothstep(0., .08, vAge + .02);
  if (a < .02) discard;
  gl_FragColor = vec4(uCol, min(1., a * 1.15));
}`;
// the dark pass bed seen through the rip
const BED_FRAG = /* glsl */`
uniform vec3 uPassCol, uLit; uniform vec4 uPlate; uniform float uBedK;
varying vec3 vW;
${NOISE_GLSL}
void main(){
  vec2 q = uPlate.xy + (vW.xz - uPlate.xy) / max(uPlate.z, .01);
  float n = aFbm(q * .06), c = aNoise(q * .5 + uPlate.w * .4) * aNoise(q * .23 - uPlate.w * .3);
  vec3 col = mix(vec3(.016, .13, .24), vec3(.04, .25, .35), n) + vec3(.10, .32, .34) * smoothstep(.3, .6, c) * .3;
  col = mix(col, uPassCol * (.55 + .5 * n) + col * .25, uBedK);   // (dawn, golden: the bed takes the pass's own slate-teal)
  gl_FragColor = vec4(col * uLit, 1.);
}`;

// ---- islets (a strip of displaced land round the ring) and props (palms, canoe, houses, beacon)
const ISLET_VERT = /* glsl */`
varying vec3 vW, vN; varying vec2 vQ; varying float vH;
void main(){ vQ = position.xz; vH = position.y; vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const ISLET_FRAG = /* glsl */`
uniform vec3 uSand, uSunDir, uSunCol, uAmb, uHazeCol, uShadowTint; uniform vec4 uPlate, uSunA;
varying vec3 vW, vN; varying vec2 vQ; varying float vH;
${NOISE_GLSL}
void main(){
  float n = aFbm(vQ * .05), n3 = aNoise(vQ * .6), n4 = aNoise(vQ * .21 + 7.);
  float tH = vH + .5 * (n - .5);
  vec3 alb = uSand * (.82 + .2 * n3) * mix(.72, 1., smoothstep(.0, .35, vH));          // wet sand at the waterline
  alb = mix(alb, vec3(.33, .46, .19) * (.8 + .4 * n3), smoothstep(.85, 1.25, tH));  // naupaka fringe
  alb = mix(alb, vec3(.065, .135, .06) * (.6 + .9 * n4), smoothstep(1.3, 1.9, tH)); // pisonia scrub
  alb = mix(alb, alb * uShadowTint, smoothstep(.45, .7, n4) * smoothstep(1., 1.6, tH) * .7);
  vec3 N = normalize(vN + vec3(n3 - .5, 0., n4 - .5) * .5 * smoothstep(1., 1.8, tH));
  vec3 col = alb * (uSunCol * clamp(dot(N, uSunDir), 0., 1.) + uAmb);
  float D = length(cameraPosition - vW) / max(uPlate.z, .01);
  gl_FragColor = vec4(mix(col, uHazeCol, 1. - exp(-D * uSunA.z)), 1.);
}`;
const PROP_VERT = /* glsl */`
attribute vec3 aCol3; attribute float aWind;
uniform vec4 uPlate, uWind;
varying vec3 vW, vN, vC;
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  float ph = p.x * .05 + p.z * .07, t = uPlate.w;
  float g = aWind * (.5 + uWind.z);
  p.xz += uWind.xy * g * (.7 + .6 * sin(t * 1.9 + ph) + .3 * sin(t * 4.3 + ph * 3.));
  p.y -= g * .3 * (.5 + .5 * sin(t * 1.9 + ph));
  vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vC = aCol3;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const PROP_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uAmb, uBounce, uHazeCol; uniform vec4 uPlate, uSunA;
varying vec3 vW, vN, vC;
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float ndl = clamp(dot(N, uSunDir) * .7 + .3, 0., 1.);
  vec3 col = vC * (uSunCol * ndl + uAmb * (.6 + .4 * N.y) + uBounce * clamp(-N.y, 0., 1.));
  float D = length(cameraPosition - vW) / max(uPlate.z, .01);
  gl_FragColor = vec4(mix(col, uHazeCol, 1. - exp(-D * uSunA.z)), 1.);
}`;

// ---- the sharks that ride under the rip (far LOD of the hero's shark, nose into the current)
const SSHARK_VERT = /* glsl */`
attribute vec4 iA, iB;   // x y z length | phase, beat Hz, yaw jitter, -
uniform vec4 uPlate, uRipP;
varying vec3 vN; varying float vDepth;
void main(){
  float t = uPlate.w, t01 = .5 - position.z; vec3 p = position;
  p.x += (.012 + .085 * t01 * t01) * sin(t * 6.2832 * iB.y + iB.x * 6.2832 - t01 * 4.2);
  float cy = cos(iB.z), sy = sin(iB.z); vec2 f = -uRipP.xy;
  vec3 fw3 = vec3(f.x * cy - f.y * sy, 0., f.x * sy + f.y * cy), rt = vec3(fw3.z, 0., -fw3.x);
  vec3 C = iA.xyz + fw3 * (.8 * sin(t * .23 + iB.x * 20.)) + rt * (1.1 * sin(t * .17 + iB.x * 31.));
  vec3 lp = C + (rt * p.x + vec3(0., p.y, 0.) + fw3 * p.z) * iA.w;
  vN = normalize(rt * normal.x + vec3(0., normal.y, 0.) + fw3 * normal.z); vDepth = -lp.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lp, 1.);
}`;
const SSHARK_FRAG = /* glsl */`
uniform vec3 uSharkCol, uWaterCol;
varying vec3 vN; varying float vDepth;
void main(){
  // seen from above: a dark slate back, a paler flank, light rippling along the spine; the water takes it with depth
  float up = normalize(vN).y;
  vec3 c = mix(uSharkCol * 1.9, uSharkCol * .62, smoothstep(-.1, .75, up));
  c += uSharkCol * .9 * smoothstep(.86, 1., up);
  gl_FragColor = vec4(mix(c * .84, uWaterCol, clamp(vDepth * .07 + .02, 0., .5)), 1.);   // (seventh pass: a fifth darker and less taken by the water: dark slate bodies under the skim, not pale ghosts)
}`;
// the approach sharks (sixth polish pass): the same animal, drawn over the rip sheet (the sheet is the painted sea beyond
// 64 m, so nothing under it shows from the air) as a dark shape in the pale shallows. From the air each is held at some 9 %
// of the frame's width (its plan size follows the range to the lens, capped at 12.5 m, its depth stays an animal's), so the
// lower third of the approach reads as sharks; as the lens comes down it shrinks to its true 2.8 m, and beyond 100 m the
// water hides it.
const APSHARK_VERT = /* glsl */`
attribute vec4 iA, iB;
uniform vec4 uPlate, uRipP;
varying vec3 vN; varying float vDepth, vA;
void main(){
  float t = uPlate.w, t01 = .5 - position.z; vec3 p = position;
  p.x += (.012 + .085 * t01 * t01) * sin(t * 6.2832 * iB.y + iB.x * 6.2832 - t01 * 4.2);
  float cy = cos(iB.z), sy = sin(iB.z); vec2 f = -uRipP.xy;
  vec3 fw3 = vec3(f.x * cy - f.y * sy, 0., f.x * sy + f.y * cy), rt = vec3(fw3.z, 0., -fw3.x);
  vec3 C = iA.xyz + fw3 * (.8 * sin(t * .23 + iB.x * 20.)) + rt * (1.1 * sin(t * .17 + iB.x * 31.));
  float dist = distance(cameraPosition, (modelMatrix * vec4(C, 1.)).xyz);
  float L = max(iA.w, min(.19 * dist, 12.5) / max(uPlate.z, .1));
  vec3 lp = C + (rt * p.x + fw3 * p.z) * L + vec3(0., p.y * iA.w * 1.4, 0.);
  vN = normalize(rt * normal.x + vec3(0., normal.y, 0.) + fw3 * normal.z); vDepth = -lp.y; vA = 1. - smoothstep(62., 100., dist);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lp, 1.);
}`;
const APSHARK_FRAG = /* glsl */`
uniform vec3 uSharkCol, uWaterCol;
varying vec3 vN; varying float vDepth, vA;
void main(){
  float up = normalize(vN).y;
  vec3 c = mix(uSharkCol * 1.9, uSharkCol * .62, smoothstep(-.1, .75, up));
  c += uSharkCol * .9 * smoothstep(.86, 1., up);
  gl_FragColor = vec4(mix(c, uWaterCol, clamp(vDepth * .10 + .16, 0., .6)), .86 * vA);
}`;
// the shafts that stand round the portal (sixth polish pass): world-fixed, turned to the lens about their own axis like the
// kit's, soft from edge to edge, faded by the water with range and where the lens passes through one
const PSHAFT_VERT = /* glsl */`
attribute vec4 aA; attribute vec2 aB;   // top x, z, length, width | phase, gain
uniform vec3 uRayDir; uniform float uT;
varying vec2 vQ; varying float vI, vSeed, vD;
void main(){
  vec3 top = vec3(aA.x + 1.2 * sin(uT * .07 + aB.x * 40.), 0., aA.y + 1.2 * sin(uT * .06 + aB.x * 71.));
  vec3 mid = top + uRayDir * aA.z * .5;
  vec3 side = normalize(cross(uRayDir, cameraPosition - mid));
  vec3 wp = top + uRayDir * (aA.z * position.y) + side * (position.x * aA.w * (.5 + .9 * position.y));
  float flick = .68 + .32 * sin(uT * (.3 + .4 * aB.x) + aB.x * 6.2831) * sin(uT * .21 + aB.x * 40.);
  vI = aB.y * flick * smoothstep(2., 11., length(cross(cameraPosition - top, uRayDir)));
  vQ = position.xy; vSeed = aB.x;
  vec4 mv = viewMatrix * vec4(wp, 1.); vD = length(mv.xyz); gl_Position = projectionMatrix * mv;
}`;
const PSHAFT_FRAG = /* glsl */`
uniform vec3 uRayColor; uniform float uFogK;
varying vec2 vQ; varying float vI, vSeed, vD;
void main(){
  float x = vQ.x, e = 1. - x * x, o = x - .3 * sin(vSeed * 37.);
  float prof = (exp(-x * x * 3.2) + .3 * exp(-o * o * 12.)) * e * e;
  float len = smoothstep(0., .14, vQ.y) * pow(clamp(1. - vQ.y, 0., 1.), 1.7);
  gl_FragColor = vec4(uRayColor * (prof * len * vI * exp(-vD * uFogK)), 1.);
}`;

// ---- small fish: anthias hover and flinch (uMode 0), fusiliers stream (uMode 1); also the wrasse / barracuda
const LIGHT_GLSL = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyL, uDeepL; uniform float uSurfY;
vec3 uwLight(vec3 alb, vec3 N, float y){
  float dl = exp(-max(uSurfY - y, 0.) * .028);
  float ndl = clamp((dot(N, uSunDir) + .3) / 1.3, 0., 1.);
  return alb * (uSunCol * dl * ndl + mix(uDeepL, uSkyL, N.y * .5 + .5) * (.5 + .5 * dl));
}`;
const FISH_VERT = /* glsl */`
attribute vec4 iA, iB;   // hover: home xyz, size | phase, wall angle, flinch gain, beat Hz.  stream: side, up, -, size | phase, along, -, Hz
uniform float uT, uMode, uHeadA, uFlinch, uSchoolK;
uniform vec3 uCam, uSchoolPos, uSchoolDir;
varying vec3 vN, vM; varying float vPh, vY;
#include <fog_pars_vertex>
void main(){
  float ph = iB.x, t01 = .5 - position.z, sc = iA.w; vec3 p = position;
  p.x += (.01 + .09 * t01 * t01) * sin(uT * 6.2832 * iB.w + ph * 6.2832 - t01 * 3.6);
  vec3 fwd, C;
  if (uMode < .5) {
    float a = uHeadA + .16 * sin(uT * .9 + ph * 40.); fwd = vec3(sin(a), 0., cos(a));
    C = iA.xyz + vec3(sin(uT * .7 + ph * 30.), sin(uT * .9 + ph * 50.), sin(uT * .6 + ph * 70.)) * .22;
    float fl = (1. - smoothstep(4.5, 11., length(C - uCam))) * uFlinch * iB.z;
    C += vec3(cos(iB.y), -.25, sin(iB.y)) * fl * 1.5; sc *= 1. - .45 * fl;
  } else {
    fwd = normalize(uSchoolDir + vec3(0., 0., 1e-5));
    vec3 r0 = normalize(vec3(fwd.z, 0., -fwd.x) + vec3(1e-5, 0., 0.));
    C = uSchoolPos + fwd * iB.y + r0 * (iA.x + .5 * sin(uT * .8 + iB.y * .15)) + vec3(0., iA.y + .3 * sin(uT * .6 + iB.y * .2), 0.);
    sc *= uSchoolK;
  }
  vec3 rt = normalize(vec3(fwd.z, 0., -fwd.x) + vec3(1e-5, 0., 0.)), up = cross(fwd, rt);
  vec3 lp = C + (rt * p.x + up * p.y + fwd * p.z) * sc;
  vN = normalize(rt * normal.x + up * normal.y + fwd * normal.z); vM = position; vPh = ph; vY = lp.y;
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FISH_FRAG = /* glsl */`
uniform vec3 uTop, uSide, uBelly, uTail; uniform vec4 uStripe; uniform float uPattern, uGlow;
varying vec3 vN, vM; varying float vPh, vY;
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float y = vM.y;
  vec3 alb = mix(uBelly, uSide, smoothstep(-.07, -.005, y));
  alb = mix(alb, uTop, smoothstep(.02, .075, y));
  alb = mix(alb, uStripe.rgb, uStripe.a * (1. - smoothstep(.010, .028, abs(y - .04 - vM.z * .03))));
  alb = mix(alb, uTail, (1.0 - smoothstep(-.42, -.30, vM.z)));
  alb *= .82 + .36 * fract(vPh * 7.3);
  float sc = sin(vM.z * 95.) * sin(y * 120. + vM.z * 40.);
  alb *= 1. - uPattern * (.22 * smoothstep(0., .6, sc) + .25 * (1. - smoothstep(.0, .012, abs(y - .02 - .5 * (vM.z - .3) * (vM.z - .3)))) * step(.2, vM.z));
  float eye = length(vec2(vM.z - .345, (y - .04) * 1.15));
  alb = mix(alb, vec3(.9, .8, .4), step(.01, uPattern) * (1. - smoothstep(.022, .028, eye)));
  alb = mix(alb, vec3(.015), step(.01, uPattern) * (1. - smoothstep(.011, .016, eye)));
  gl_FragColor = vec4(uwLight(alb, N, vY) + alb * uGlow, 1.);   // uGlow: the anthias hold their orange in the blue
  #include <fog_fragment>
}`;

// ---- sea fans, whip corals and garden eels: ribbons that never thin below ~1.6 px, bent and fluttered by the tide
const FAN_VERT = /* glsl */`
attribute vec3 aSide;    // in-plane offset direction x, y; half width (m at scale 1)
attribute float aFlex;   // 0 at the holdfast .. 1 at the tips
attribute vec4 iA, iB;   // xyz, scale | yaw of the fan plane, phase, tint, -
uniform float uT, uPix, uSinkOn;
uniform vec3 uFlowV, uCam, uBend;   // bend amount, slow flutter, fast flutter
varying float vTint, vFlex, vY; varying vec3 vN;
#include <fog_pars_vertex>
void main(){
  float sc = iA.w, cy = cos(iB.x), sy = sin(iB.x), sink = 1.;
  vec3 ax = vec3(cy, 0., -sy), az = vec3(sy, 0., cy);
  if (uSinkOn > .5) sink = .06 + .94 * smoothstep(7., 17., length(iA.xyz - uCam));
  vec3 wp = iA.xyz + ax * (position.x * sc) + vec3(0., position.y * sc * sink, 0.);
  float fl = aFlex * sc * sink;
  float flut = sin(uT * 2.3 + iB.y * 6.28 + position.y * 1.7) * uBend.y + sin(uT * 5.1 + iB.y * 9. + position.x * 3.) * uBend.z;
  wp += uFlowV * fl * (uBend.x + flut); wp.y -= fl * uBend.x * .35;
  vec4 mv = viewMatrix * modelMatrix * vec4(wp, 1.);
  float wHalf = max(aSide.z * sc, -mv.z * uPix * .8);
  wp += (ax * aSide.x + vec3(0., aSide.y, 0.)) * wHalf;
  vN = az; vTint = iB.z; vFlex = aFlex; vY = wp.y;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FAN_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uColC;
varying float vTint, vFlex, vY; varying vec3 vN;
#include <fog_pars_fragment>
${LIGHT_GLSL}
void main(){
  vec3 alb = mix(uColA, uColB, smoothstep(.2, .55, vTint)); alb = mix(alb, uColC, smoothstep(.6, .9, vTint));
  alb *= .55 + .7 * vFlex;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  N = normalize(N + vec3(0., .7, 0.));
  // (a red fan in blue light goes black: it keeps a floor of the water's own light on a greyed albedo, so in the dim looks
  // it is a deep plum or teal shape a step or two darker than the wall behind, with paler tips)
  vec3 c = max(uwLight(alb, N, vY), (alb * .6 + .075) * (uSkyL * .5 + uDeepL * .6));
  c += (alb * .5 + .06) * uSkyL * .45 * vFlex * vFlex;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---- the manta that dives over the lens at the coral head: wing beat in the vertex shader, belly pattern painted
const MANTA_VERT = /* glsl */`
attribute vec3 aUV;      // signed span fraction -1..1, chord 0 (leading edge) .. 1 (trailing), +1 back / -1 belly / 2 lobes and tail / 3 the hero's whip (aUV.y: disc lengths from its root)
uniform float uT, uFlap, uSpan;
varying vec3 vN, vUV, vWp; varying float vY, vUp;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
  // (seventh pass) the cephalic lobes are tagged with a span of 0.9 so that the fragment shader knows them: they rode the
  // wing beat with the wingtips, up to 1.1 m above and below the head they belong to (a pale bar adrift beside it).
  // They now beat with the body where they are rooted: their true span fraction, at the leading edge.
  bool lob = aUV.z > 1.5 && abs(aUV.x) > .5;
  float w = lob ? abs(position.x) / max(uSpan, .01) : abs(aUV.x), sg = aUV.x < 0. ? -1. : 1.;
  float ph = uT * 2.0 - w * 1.9 - (lob ? 0. : aUV.y) * .6;
  p.y += uFlap * w * w * sin(ph);
  // the hero's whip sways with the body's own beat: the wave that leaves the hind edge (0.6 behind the lip) runs on down it at the
  // wings' own lag (1.9, here to a disc length), growing to a quarter of the wingtips' beat one disc length out and no more beyond
  if (aUV.z > 2.5) { float wy = min(aUV.y, 1.); p.y += uFlap * .25 * wy * wy * sin(uT * 2.0 - .6 - 1.9 * aUV.y); }
  float sl = sg * uFlap / max(uSpan, .01) * (2. * w * sin(ph) - 1.9 * w * w * cos(ph));
  n = normalize(vec3(n.x - sl * n.y, n.y + sl * n.x, n.z)); vUp = n.y;
  vec4 wp = modelMatrix * vec4(p, 1.); vN = normalize(mat3(modelMatrix) * n); vUV = aUV; vY = wp.y; vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const MANTA_FRAG = /* glsl */`
uniform vec3 uBounceM; uniform float uRayK, uT, uHero;
varying vec3 vN, vUV, vWp; varying float vY, vUp;
// the crawling caustic net the reef and the sharks carry (the same three warped sines), so the manta sits in the same light
float mCaus(vec2 p, float t){
  float w = sin(p.x * 1.1 + sin(p.y * .9 + t) * 1.3 + t * .7) + sin(p.y * 1.3 - sin(p.x * .8 - t * .8) * 1.2 + t * .5) + sin((p.x + p.y) * .8 + sin((p.x - p.y) * .7 + t * .6));
  float c = 1. - min(abs(w) * .42, 1.); c = c * c; c = c * c; return c * c;
}
// the pools of shaft light that rake the sharks (the parts file's swShaft), read in the same place
float mShaft(vec2 p, float t){
  float a = sin(p.x * .23 + 1.7 * sin(p.y * .11 + t * .13) + t * .21) * sin(p.y * .19 - 1.3 * sin(p.x * .09 - t * .11) + t * .17);
  return smoothstep(.08, .7, a);
}
#include <fog_pars_fragment>
${NOISE_GLSL}
${LIGHT_GLSL}
void main(){
  // the two skins meet along the wing's edges: each is drawn from its own side only, so the black back can never show
  // through the white belly as a comb of triangles at the wingtip (the lobes and the tail, vUV.z of 2 and over, are drawn from both sides)
  if (vUV.z < 1.5 && !gl_FrontFacing) discard;
  vec3 N = normalize(vN);
  float w = abs(vUV.x), c = vUV.y, belly = step(vUV.z, 0.);
  float n1 = aNoise(vec2(vUV.x * 12., c * 8.5) + 3.), n2 = aNoise(vec2(vUV.x * 21., c * 14.) + 9.);
  // back: near-black with pale shoulder chevrons (an eagle ray: brown with pale spots)
  // (seventh pass: charcoal-blue, half as light again as before, with paler shoulder marks: under the low sun of the
  // golden looks the back was the darkest thing in the frame, a black cut-out)
  vec3 back = vec3(.050, .063, .088) * (.8 + .5 * n2);
  // (the shoulder marks are a hook a side, not a patch: a band lying along the leading edge from beside the head to
  // mid-wing, and a spur running back from its inner end, both broad where they meet and tapering to nothing, their
  // edges carried in and out by the skin's own noise. A soft-edged band 0.7 m wide and 0.6 m long, which is what this
  // was, is a pale square on the near shoulder when the back is turned to the lens.)
  float cw = c + (n2 - .5) * .05, ww = w + (n1 - .5) * .04, hwA = mix(.085, .02, smoothstep(.08, .46, ww)), hwB = mix(.07, .018, smoothstep(.14, .44, cw));
  float chev = max((1. - smoothstep(hwA * .35, hwA, abs(cw - .14 - .10 * ww))) * smoothstep(.05, .11, ww) * (1. - smoothstep(.30, .52, ww)),
                   (1. - smoothstep(hwB * .35, hwB, abs(ww - .12 - .10 * (cw - .15)))) * smoothstep(.07, .14, cw) * (1. - smoothstep(.24, .46, cw))) * (.7 + .3 * n1);
  back = mix(back, vec3(.27, .30, .335), chev * (.4 + .6 * chev) * .85);
  // (eighth pass: an eagle ray is dark umber-grey with small round off-white spots: one dot to a cell of some 12 cm, each
  // 4 to 7 cm across, most cells empty over the shoulders and two in three filled toward the hind edge. The spots were a
  // value noise cut at a threshold: large angular cream shards, the harshest thing in the frame under a low sun.)
  vec3 rv = aVoro(vec2(vUV.x * 17., c * 15.) + 4.);
  float rR = mix(.18, .30, rv.y), rSpot = (1. - smoothstep(rR - .07, rR, rv.x)) * step(mix(.72, .34, smoothstep(.12, .62, c)), rv.z);
  vec3 ray = mix(vec3(.118, .100, .084) * (.85 + .3 * n1), vec3(.42, .40, .34), rSpot * .9);
  back = mix(back, ray, uRayK);
  // belly: near-white shading to grey toward the wingtips, soft charcoal blotches clustered between the gill slits and
  // the abdomen, a grey trailing margin, five gill slits a side and the mouth
  vec3 bel = vec3(.80, .81, .79) * (.94 + .08 * n2) * (.75 + .25 * (1. - w)) * (.95 + .05 * sin(c * 9.));
  float zone = (1. - smoothstep(.15, .35, w)) * smoothstep(.20, .40, c) * (1. - smoothstep(.70, .92, c));
  float blot = smoothstep(.55, .72, n1 * .7 + n2 * .3 + .20 * zone - .10) * zone;
  bel = mix(bel, vec3(.05, .055, .065), blot * .92 * (1. - uRayK));
  bel = mix(bel, vec3(.20, .23, .28), clamp(smoothstep(.70, .98, c) * .8 + smoothstep(.62, .98, w) * .8 + (1.0 - smoothstep(.0, .07, c)) * .5, 0., 1.) * (.75 + .25 * n1));   // (a dark margin along the trailing edge, the wingtips and the lip)
  float gz = (c - .2) / .055;
  float gill = step(0., gz) * step(gz, 5.) * (1. - smoothstep(.10, .20, abs(fract(gz) - .5))) * smoothstep(.03, .045, w) * (1. - smoothstep(.17 - .014 * gz, .20 - .014 * gz, w));
  bel *= 1. - .85 * gill;
  // (a manta's mouth is at the lip, between the lobes' roots; a ray's under the head)
  bel *= 1. - .8 * (1. - smoothstep(.012, .026, abs(c - .07 * uRayK))) * (1. - smoothstep(.10 + .05 * (1. - uRayK), .12 + .05 * (1. - uRayK), w));
  // (sixth polish pass) the belly is modelled, not a flat pale sheet: it darkens toward the wing roots and along the body's
  // keel, the pattern keeps a dark margin at the wingtips, and the light is the reef's own: the caustic net crawls over
  // every face turned to the sun (faintly, from the sand's bounce, over the belly too), and a rim of the low sun and the
  // sky runs along the wings' edges, so the animal reads as a manta at a glance
  float rootSh = mix(.70, 1., smoothstep(.03, .36, w)) * mix(.86, 1., smoothstep(.0, .2, abs(c - .5)));
  bel *= rootSh * (1. - .22 * smoothstep(.55, 1., w) * (1. - uRayK));
  back = mix(back, back * 1.9 + .012, smoothstep(.72, 1., w) * .5);                    // the wingtips' backs a step paler
  vec3 alb = mix(back, bel, belly);
  // (seventh pass) the plain rays' lobes are single sheets and the normal is turned to the face in view. The hero manta's are
  // rolled horns that say which face is the upper one (aUV.y): above a small step paler than the back, so the head reads
  // against it and no more (at an albedo of 0.15 the near one was a white bar ahead of the head: this light makes anything
  // over a tenth pale); below pale like the belly. Its whip is the back's own plain tone.
  float lobe = step(1.5, vUV.z) * step(.5, w);
  if (vUV.z > 1.5 && !gl_FrontFacing) N = -N;
  alb = mix(alb, mix(vec3(.50, .52, .52), vec3(.082, .098, .128), smoothstep(.3, .6, c)), lobe * (1. - uRayK));
  alb = mix(alb, mix(vec3(.050, .063, .088), vec3(.118, .100, .084), uRayK), step(2.5, vUV.z));
  vec3 V = normalize(cameraPosition - vWp);
  vec2 cq = vWp.xz - uSunDir.xz * (vWp.y / max(uSunDir.y, .2));
  float ca = mCaus(cq * .85, uT * 1.3) + .6 * mCaus(cq * 1.9 + 7.3, uT * 1.7 + 2.);
  float sunny = smoothstep(-.25, .5, dot(N, uSunDir));
  vec3 col = uwLight(alb, N, vY) * (1. + ca * (1.1 * sunny + .16)) + alb * uBounceM * clamp(.3 - N.y, 0., 1.) * (1. + .55 * ca);
  float fr = 1. - abs(dot(N, V)); fr = fr * fr * fr;
  col += (uSkyL * .8 + uSunCol * .5 * (.35 + .65 * sunny)) * fr * (.22 + .5 * alb) * exp(-max(uSurfY - vY, 0.) * .02);
  // (seventh pass) the back carries the sky: a soft sheen on every face of it that looks up, strongest in a band along the
  // leading edge and over the head, so the head, the shoulders and the dorsal ridge are modelled and the back is never flat
  { float upK = smoothstep(-.05, .85, N.y), leadK = 1. - smoothstep(.02, .26, c);
    col += (uSkyL * (.04 + .11 * leadK) + uSunCol * .045 * leadK * sunny) * upK * (1. - belly) * (1. - lobe) * (1. - .3 * uRayK) * (.55 + .45 * n1) * exp(-max(uSurfY - vY, 0.) * .02); }
  // THE HERO'S LIGHT (uHero; the plain rays keep the light above) is the sharks' own (SHARK_FRAG of the parts file), read in their frame
  // (lp: its floor lies 30 m under the surface): the sun on a wrapped lambert, the caustic net and the shafts' pools in the sun's term
  // alone, on faces that look up, thinning with depth; the sky above and the deep below; their highlight and their rim. It differs by what
  // this skin is: the rim is weighed by the skin's tone against the sharks' back (0.17), light on a dark skin and never a film of the
  // water's colour over it (on a broad back seen along its plane the rim and the sheen lay over all of it: the see-through read); the sand's
  // bounce is the manta's own; and the body shades itself (form): a face that turns from the animal's own dorsal axis has less of every light.
  if (uHero > .5) {
    vec3 lp = vec3(vWp.x, vWp.y - uSurfY + 30., vWp.z);
    vec2 hq = lp.xz - uSunDir.xz * (lp.y / max(uSunDir.y, .2));
    float hc = (mCaus(hq * .85, uT * 1.3) + .6 * mCaus(hq * 1.9 + 7.3, uT * 1.7 + 2.)) * smoothstep(0., 23., lp.y) * smoothstep(-.1, .45, N.y);
    float dl = exp(-max(uSurfY - vY, 0.) * .028), ndl = clamp((dot(N, uSunDir) + .22) / 1.22, 0., 1.), shaft = mShaft(hq, uT);
    float form = mix(.5, 1., smoothstep(.55, 1., abs(vUp)));
    vec3 amb = mix(uDeepL, uSkyL, N.y * .5 + .5) * (.45 + .55 * dl) + uBounceM * clamp(.3 - N.y, 0., 1.);
    col = alb * (uSunCol * dl * ndl * (.55 + 2. * hc) * (.74 + 1.25 * shaft) + amb) * form;
    float ndh = max(dot(N, normalize(uSunDir + V)), 0.), hf = 1. - max(dot(N, V), 0.); hf = hf * hf * hf;
    col += uSunCol * dl * .10 * pow(ndh, 28.) * (1. - belly) * (.5 + hc);
    col += (uSkyL + uSunCol * .35 * shaft * dl) * hf * (.06 + .42 * smoothstep(-.1, .7, N.y)) * min(alb / .17, 1.);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// ---- sand smoke: soft streamers lying on the sand, carried up the slope by the tide
const SMOKE_VERT = /* glsl */`
attribute vec4 iA, iB, iC;   // base xyz, length | phase, speed, width, alpha | drift direction xyz, travel (m)
uniform float uT;
varying vec2 vUv; varying float vA, vPh;
#include <fog_pars_vertex>
void main(){
  float cyc = fract(iB.x + uT * iB.y / max(iC.w, 1.));
  vec3 dir = normalize(iC.xyz + vec3(0., 0., 1e-5)), side = normalize(cross(vec3(0., 1., 0.), dir) + vec3(1e-5, 0., 0.));
  float grow = .6 + .8 * cyc;
  vec3 wp = iA.xyz + dir * ((cyc - .5) * iC.w + position.z * iA.w * grow) + side * (position.x * iB.z * grow) + vec3(0., .22 + .5 * cyc, 0.);
  vUv = position.xz + .5; vA = iB.w * sin(3.14159 * cyc); vPh = iB.x * 37.;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SMOKE_FRAG = /* glsl */`
uniform vec3 uSmokeCol; uniform float uT;
varying vec2 vUv; varying float vA, vPh;
#include <fog_pars_fragment>
${NOISE_GLSL}
void main(){
  float r = length((vUv - .5) * 2.), soft = 1. - smoothstep(.2, 1., r);
  // (broken along its length into puffs a metre or two long that roll up the slope: one noise drawn out along the streamer
  // read from the bowl as long pale streaks on the sand)
  float n = aNoise(vec2(vUv.x * 5. + vPh, vUv.y * 8. + uT * .5 + vPh)) * .55 + aNoise(vec2(vUv.x * 11. - vPh, vUv.y * 19. + uT * .9)) * .45;
  gl_FragColor = vec4(uSmokeCol, soft * soft * smoothstep(.42, .86, n) * vA * .9);
  #include <fog_fragment>
}`;

// ================================================================= 2. JS mirrors and geometry builders
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// A = { cx, cz, R0, thP, e2, p2, e3, p3, n, a1, a2, e5, px, pz, fx, fz, ripAmp, chop }: same maths as ATOLL_GLSL
function makeAtoll(A) {
  const ringR = (th) => A.R0 * (1 + A.e2 * Math.cos(2 * (th - A.p2)) + A.e3 * Math.cos(3 * th - A.p3) + A.e5 * Math.cos(5 * th + 1.3));
  const angDiff = (a) => a - Math.PI * 2 * Math.floor(a / (Math.PI * 2) + 0.5);
  const islA = (th, s) => {
    const f = Math.sin(A.n * th + 1.6 * Math.sin(3 * th + A.a1) + 0.9 * Math.sin(7 * th + A.a2));
    const sh = Math.abs(s), e = (sh - 260) / 170;
    return Math.max(sstep(-0.15, 0.55, f), Math.exp(-e * e)) * sstep(105, 170, sh);
  };
  const islH = (a, d) => { const hw = 22 + 58 * a, x = (d + 55) / hw; return a < 0.02 ? -1.5 : 3.4 * Math.sqrt(a) * (1 - x * x) - 0.6 * (1 - a); };
  const ripH = (x, z, t) => {
    const rx = x - A.px, rz = z - A.pz, a = rx * A.fx + rz * A.fz, b = -rx * A.fz + rz * A.fx;
    const env = Math.exp(-b * b / 2400) * sstep(-125, -78, a) * (1 - sstep(150, 330, a));
    const ph = a * 0.7854 + 0.8 * Math.sin(b * 0.15 + t * 0.3);
    return env * A.ripAmp * Math.sin(ph) * (0.75 + 0.25 * Math.sin(b * 0.31 + t * 0.7))
      + A.chop * (Math.sin(0.9 * x + 0.5 * z - 1.9 * t) + 0.7 * Math.sin(-0.6 * x + 1.3 * z - 2.3 * t));
  };
  // ring coordinates (arc metres from the pass centre, metres outside the ring line) -> plate xz
  const toPlate = (s, d, out = [0, 0]) => { const th = A.thP + s / A.R0, r = ringR(th) + d; out[0] = A.cx + Math.cos(th) * r; out[1] = A.cz + Math.sin(th) * r; return out; };
  return { ringR, angDiff, islA, islH, ripH, toPlate };
}

// vertex-coloured prop geometry (palms, canoe, houses, beacon): position, normal, aCol3, aWind
function propGeo() {
  const pos = [], col = [], wind = [], idx = [], c = new THREE.Color();
  const G = {
    v(x, y, z, hex, w = 0, shade = 1) { c.set(hex).multiplyScalar(shade); pos.push(x, y, z); col.push(c.r, c.g, c.b); wind.push(w); return pos.length / 3 - 1; },
    quad(a, b, d, e) { idx.push(a, b, d, a, d, e); }, tri(a, b, d) { idx.push(a, b, d); },
    tube(pts, radii, sides, hex, shades) {
      const rings = [];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        const t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        const u = new THREE.Vector3(1, 0, 0); if (Math.abs(t.x) > 0.9) u.set(0, 0, 1);
        const n1 = new THREE.Vector3().crossVectors(t, u).normalize(), n2 = new THREE.Vector3().crossVectors(t, n1), ring = [];
        for (let j = 0; j < sides; j++) { const an = (j / sides) * Math.PI * 2, cs = Math.cos(an) * radii[i], sn = Math.sin(an) * radii[i];
          ring.push(G.v(p[0] + n1.x * cs + n2.x * sn, p[1] + n1.y * cs + n2.y * sn, p[2] + n1.z * cs + n2.z * sn, hex, 0, shades ? shades[i] : 1)); }
        rings.push(ring);
      }
      for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; G.quad(rings[i][j], rings[i + 1][j], rings[i + 1][j1], rings[i][j1]); }
    },
    box(cx, cy, cz, sx, sy, sz, hex, shade = 1) {
      const o = [];
      for (let i = 0; i < 8; i++) o.push(G.v(cx + (i & 1 ? sx : -sx) * 0.5, cy + (i & 2 ? sy : -sy) * 0.5, cz + (i & 4 ? sz : -sz) * 0.5, hex, 0, shade));
      G.quad(o[0], o[2], o[3], o[1]); G.quad(o[4], o[5], o[7], o[6]); G.quad(o[0], o[1], o[5], o[4]); G.quad(o[2], o[6], o[7], o[3]); G.quad(o[0], o[4], o[6], o[2]); G.quad(o[1], o[3], o[7], o[5]);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aCol3', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('aWind', new THREE.Float32BufferAttribute(wind, 1));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    },
  };
  return G;
}

// one coconut palm, 11 m to the crown: leaning ringed trunk, nine arching fronds that toss in the trade wind
function palmGeo(rng) {
  const G = propGeo();
  G.tube([[0, -0.5, 0], [0.5, 3.5, 0.1], [1.4, 7.5, 0.2], [2.0, 10.6, 0.2]], [0.3, 0.21, 0.17, 0.14], 4, '#8a765e', [0.7, 0.9, 1, 0.85]);
  const R = [0.15, 1.5, 2.9, 4.1, 5.0], HW = [0.14, 0.62, 0.66, 0.42, 0.05];
  for (let i = 0; i < 9; i++) {
    const az = (i / 9) * Math.PI * 2 + rng.range(-0.25, 0.25), e = rng.range(-0.7, 0.75), cx = Math.cos(az), cz = Math.sin(az), L = rng.range(0.85, 1.15);
    const Y = [0, 0.95 + e * 0.8, 1.1 + e * 1.3, 0.35 + e * 1.5, -1.1 + e * 1.4];
    let prev = null;
    for (let j = 0; j < 5; j++) {
      const r = R[j] * L, w = HW[j], wnd = Math.pow(j / 4, 1.5) * 0.85, sh = 0.75 + 0.25 * (i % 2);
      const hex = j < 2 ? '#2c5f22' : j < 4 ? '#4c8a2c' : '#7fae3e';
      const a = G.v(2.0 + cx * r - cz * w, 10.6 + Y[j] - 0.12 * w, 0.2 + cz * r + cx * w, hex, wnd, sh);
      const b = G.v(2.0 + cx * r + cz * w, 10.6 + Y[j] - 0.12 * w, 0.2 + cz * r - cx * w, hex, wnd, sh * 0.85);
      if (prev) G.quad(prev[0], prev[1], b, a);
      prev = [a, b];
    }
  }
  return G.build();
}

// outrigger sailing canoe, 9 m, bow toward +Z, float to port (-X), one orange crab-claw sail
function canoeGeo(accent) {
  const G = propGeo(), N = 9, rows = [];
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1) * 2 - 1, z = t * 4.5, w = 0.46 * Math.sqrt(Math.max(0, 1 - t * t * t * t)) + 0.02, rise = 0.55 * t * t * t * t;
    rows.push([G.v(-w, 0.5 + rise, z, '#caa46c'), G.v(-w * 0.8, 0.05 + rise * 0.6, z, '#5d3c22'), G.v(0, -0.28 + rise * 0.5, z, '#4a2f1b'), G.v(w * 0.8, 0.05 + rise * 0.6, z, '#5d3c22'), G.v(w, 0.5 + rise, z, '#caa46c'), G.v(0, 0.3 + rise, z, '#3a2616')]);
  }
  for (let i = 0; i < N - 1; i++) { const a = rows[i], b = rows[i + 1]; for (let j = 0; j < 4; j++) G.quad(a[j], b[j], b[j + 1], a[j + 1]); G.quad(a[0], a[5], b[5], b[0]); G.quad(a[5], a[4], b[4], b[5]); }
  G.tube([[-2.7, 0.1, -3.1], [-2.7, 0.0, -1.5], [-2.7, 0.0, 1.5], [-2.7, 0.22, 3.2]], [0.05, 0.19, 0.19, 0.05], 5, '#6a4526');   // the float
  for (const z of [-1.5, 1.4]) G.tube([[0, 0.55, z], [-1.4, 0.75, z], [-2.7, 0.15, z]], [0.07, 0.07, 0.06], 4, '#7a5631');          // booms
  G.tube([[0, 0.3, 0.9], [0.05, 5.4, 0.5]], [0.09, 0.07], 4, '#7a5631');                                                              // mast
  const tack = [0, 0.75, 3.9], peak = [0.5, 9.6, -1.4], clew = [1.5, 2.6, -4.2];
  G.tube([tack, peak], [0.08, 0.05], 4, '#8a6238'); G.tube([tack, clew], [0.08, 0.05], 4, '#8a6238');
  const M = 7, grid = [];
  for (let i = 0; i <= M; i++) { const row = []; for (let j = 0; j <= M; j++) {
    const u = i / M, v = j / M, r = u * (1 - 0.34 * Math.sin(Math.PI * v) * u);   // concave leech: the crab claw
    const x = lerp(peak[0], clew[0], v), y = lerp(peak[1], clew[1], v), z = lerp(peak[2], clew[2], v), belly = Math.sin(Math.PI * v) * Math.sin(Math.PI * Math.min(1, u * 1.1) * 0.9) * 0.75;
    row.push(G.v(lerp(tack[0], x, r) + belly, lerp(tack[1], y, r), lerp(tack[2], z, r), accent, belly * 0.12, (j % 2 ? 0.74 : 0.82) * (0.8 + 0.2 * u)));
  } grid.push(row); }
  for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) G.quad(grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]);
  for (const z of [-2.6, -0.6]) { G.box(0, 0.95, z, 0.42, 0.75, 0.36, '#3b2a22'); G.box(0, 1.5, z, 0.24, 0.26, 0.24, '#2a1c16'); }      // two crew
  return G.build();
}

// three thatched houses and the rusted pass beacon (local metres; placed on the islets by the caller)
function houseGeo(G, x, y, z, yaw) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw), P = (lx, ly, lz) => [x + lx * cs - lz * sn, y + ly, z + lx * sn + lz * cs];
  const c = [[-3, 0, -2.2], [3, 0, -2.2], [3, 0, 2.2], [-3, 0, 2.2]], wall = [], eave = [];
  for (const q of c) { wall.push(G.v(...P(q[0], 0, q[2]), '#b59a6c', 0, 0.8), G.v(...P(q[0], 2.4, q[2]), '#c8ad7c')); eave.push(G.v(...P(q[0] * 1.25, 2.2, q[2] * 1.3), '#8f7748', 0, 0.8)); }
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; G.quad(wall[i * 2], wall[j * 2], wall[j * 2 + 1], wall[i * 2 + 1]); }
  const r0 = G.v(...P(-1.8, 4.6, 0), '#a48a56'), r1 = G.v(...P(1.8, 4.6, 0), '#a48a56');
  G.quad(eave[0], eave[1], r1, r0); G.quad(eave[2], eave[3], r0, r1); G.tri(eave[1], eave[2], r1); G.tri(eave[3], eave[0], r0);
}
function beaconGeo(G, x, y, z) {
  const rust = '#7a3a22';
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) G.tube([[x + sx * 1.1, y - 0.5, z + sz * 1.1], [x + sx * 0.35, y + 6, z + sz * 0.35]], [0.11, 0.09], 4, rust);
  for (const h of [1.8, 3.6, 5.4]) { const w = lerp(1.1, 0.35, (h + 0.5) / 6.5); G.box(x, y + h, z, w * 2.1, 0.14, w * 2.1, rust, 0.8); }
  G.box(x, y + 6.5, z, 1.1, 1.0, 1.1, '#9a4a2a'); G.box(x, y + 7.3, z, 0.5, 0.6, 0.5, '#d8d2c0');
}

// a small fish, nose +Z, length 1: lofted body, forked tail, dorsal and anal fins
function fishGeo(rows, sides, tailH, finH) {
  const pos = [], idx = [], rings = [];
  for (const [z, top, bot, w] of rows) {
    const yc = (top + bot) * 0.5, ring = [];
    for (let j = 0; j < sides; j++) { const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th); ring.push(pos.length / 3); pos.push(w * sn, cs > 0 ? yc + (top - yc) * cs : yc + (yc - bot) * cs, z); }
    rings.push(ring);
  }
  const n = rings.length, lz = rows[n - 1][0], nose = pos.length / 3; pos.push(0, (rows[0][1] + rows[0][2]) * 0.5, rows[0][0] + 0.07);
  for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; idx.push(rings[0][j], rings[0][j1], nose);
    for (let i = 0; i < n - 1; i++) idx.push(rings[i][j], rings[i + 1][j], rings[i + 1][j1], rings[i][j], rings[i + 1][j1], rings[i][j1]); }
  const t0 = pos.length / 3; pos.push(0, 0.03, lz + 0.02, 0, -0.03, lz + 0.02, 0, tailH, lz - 0.13, 0, 0, lz - 0.07, 0, -tailH, lz - 0.13);
  idx.push(t0, t0 + 2, t0 + 3, t0, t0 + 3, t0 + 1, t0 + 1, t0 + 3, t0 + 4);
  if (finH > 0) {
    const a = rows[1], b = rows[n - 2], f0 = pos.length / 3;
    pos.push(0, a[1] * 0.9, a[0] - 0.05, 0, a[1] + finH, a[0] - 0.14, 0, b[1] + finH * 0.8, b[0] + 0.02, 0, b[1] * 0.9, b[0] - 0.02);
    idx.push(f0, f0 + 1, f0 + 2, f0, f0 + 2, f0 + 3);
    const g0 = pos.length / 3; pos.push(0, rows[2][2] * 0.9, rows[2][0] - 0.05, 0, b[2] - finH * 0.7, b[0] + 0.04, 0, b[2] * 0.9, b[0] - 0.02); idx.push(g0, g0 + 1, g0 + 2);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const FISH_SMALL = [[0.42, 0.045, -0.04, 0.03], [0.24, 0.11, -0.10, 0.055], [0.02, 0.13, -0.12, 0.06], [-0.2, 0.08, -0.075, 0.035], [-0.36, 0.03, -0.03, 0.012]];
const FISH_WRASSE = [[0.43, 0.05, -0.07, 0.05], [0.33, 0.21, -0.15, 0.09], [0.14, 0.23, -0.18, 0.105], [-0.1, 0.18, -0.15, 0.08], [-0.28, 0.085, -0.075, 0.035], [-0.37, 0.055, -0.05, 0.016]];
const FISH_CUDA = [[0.44, 0.02, -0.022, 0.02], [0.3, 0.05, -0.045, 0.04], [0.0, 0.06, -0.055, 0.046], [-0.22, 0.045, -0.04, 0.032], [-0.38, 0.022, -0.02, 0.012]];

// ribbons in a fan's plane (x across, y up): sea fan, whip tuft, garden eel. aSide = offset dir + half width, aFlex = bend weight
function ribbonGeo(build) {
  const pos = [], side = [], flex = [], idx = [];
  const ribbon = (pts, w0, w1, flexOf) => {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1, i / (n - 1)), f = flexOf(pts[i][0], pts[i][1], i / (n - 1));
      for (const s of [-1, 1]) { pos.push(pts[i][0], pts[i][1], 0); side.push(-dy * s, dx * s, w); flex.push(f); }
      const k = pos.length / 3 - 2; if (i > 0) idx.push(k - 2, k - 1, k + 1, k - 2, k + 1, k);
    }
  };
  build(ribbon);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3));
  g.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 1)); g.setIndex(idx);
  return g;
}
const fanGeo = (rng) => ribbonGeo((ribbon) => {
  const ribs = 9, ph = rng.range(0, 6), fl = (x, y) => Math.min(1, x * x + y * y);
  ribbon([[0, -0.14], [0, 0.1]], 0.04, 0.03, () => 0);
  for (let i = 0; i < ribs; i++) {
    const p0 = lerp(-1.0, 1.0, (i + rng.range(0.2, 0.8)) / ribs), L = (0.7 + 0.3 * Math.abs(Math.sin(p0 * 2.3 + ph))) * (0.85 + 0.3 * Math.cos(p0)), pts = [];
    for (let j = 0; j < 4; j++) { const r = [0.04, 0.38, 0.7, 1][j] * L, p = p0 + 0.1 * Math.sin(j * 1.3 + i); pts.push([Math.sin(p) * r, Math.cos(p) * r]); }
    ribbon(pts, 0.02, 0.008, fl);
    for (const [k, sg] of [[1, -1], [2, 1], [2, -1]]) { const b = pts[k], p = p0 + sg * rng.range(0.4, 0.7), l = L * rng.range(0.2, 0.32); ribbon([b, [b[0] + Math.sin(p) * l, b[1] + Math.cos(p) * l]], 0.012, 0.006, fl); }
  }
});
const whipGeo = (rng) => ribbonGeo((ribbon) => {
  for (let i = 0; i < 4; i++) {
    const bx = rng.range(-0.25, 0.25), L = rng.range(1.5, 2.8), lean = rng.range(-0.25, 0.25), pts = [];
    for (let j = 0; j < 7; j++) { const t = j / 6; pts.push([bx + lean * t * L + 0.06 * Math.sin(t * 5 + i), t * L]); }
    ribbon(pts, 0.03, 0.011, (x, y, t) => Math.pow(t, 1.6) * (L / 2.8));
  }
});
const eelGeo = () => ribbonGeo((ribbon) => {
  // slim and upright: a shallow S with a small hooked head (unit height; placed at 0.3-0.6 m)
  ribbon([[0, -0.06], [0.006, 0.18], [-0.012, 0.4], [0.004, 0.6], [0.035, 0.78], [0.085, 0.9], [0.15, 0.95]], 0.042, 0.034, (x, y, t) => t * t * 0.5);
});
// a reef manta, nose +Z, half span W: separate back and belly skins (aUV.z says which), cephalic lobes, whip tail
function mantaGeo(W, tail = 1.7, hero = 0) {   // tail: where the whip tail ends, in body lengths behind the centre (the hero's: its whip's length in disc lengths). hero: the manta moment's own animal, 1 a reef manta, 2 a spotted eagle ray (its whip: aUV.z = 3, aUV.y the distance from its root in D; its lobes: aUV.y 1 above, 0 below; the skins meet round the leading edge on one normal)
  const Lb = W * 0.88, NS = 12, NC = 7, pos = [], uv = [], idx = [];
  // THE MANTA MOMENT'S OWN ANIMAL, every measure a share of its own disc (width DW, length D; the pivot 45.7% of D behind the lip, as it was).
  // Reef manta (Mobula alfredi): DW 2.2 D; head a sixth of DW across, 8% of D proud of the wing roots, the lip a bay 1.2% of D deep; body 14% of
  // DW deep; tips 68% of D behind the lip; rolled lobes 13% of DW long, 4.8% deep, 4.4% broad, drooped and turned in a tenth of their length;
  // whip one D, 2.4% of D thick at its root. Spotted eagle ray (Aetobatus ocellatus): DW 1.8 D; head 13% of DW across on a bill 17% of D long; body
  // 13% deep; tips 66% back; whip 2.5 D, 2% thick. Both: thickest 37% of the chord back, 5/8 of it above; wing 8.8% of DW thick at the root, 0.7%
  // at the tip; trunk flat over 6% of the half span, shoulders out to 28%; tip hooked 6% of D, hind edge hollow 12 to 14%; whip thinning to three tenths, drooping 12% of its length; dorsal fin 3% of DW tall.
  if (hero) {
    const ray = hero === 2, DW = 2 * W, D = DW / (ray ? 1.8 : 2.2), hs = ray ? 0.13 : 1 / 6, hp = ray ? 0.17 : 0.08, tipZ = ray ? 0.66 : 0.68, dep = ray ? 0.13 : 0.14, HS = 28, HC = 16, zF = 0.457 * D;
    const lead = (s) => (s < hs ? (ray ? hp * (s / hs) ** 2 : 0.012 * (1 - (s / hs) ** 2)) : (ray ? hp : hp * sstep(hs, 1.7 * hs, s)) + (tipZ - 0.06 - hp) * ((s - hs) / (1 - hs)) ** (ray ? 1.1 : 1.2) + 0.06 * s ** 7);
    const trail = (s) => 1 - (1 - tipZ - 0.012) * s ** (ray ? 1.2 : 1.4) - (ray ? 0.12 : 0.14) * Math.sin(Math.PI * s ** 1.5);
    const deep = (s) => DW * (0.007 + 0.081 * (1 - s) ** 1.6 + (dep - 0.088) * (1 - sstep(0.06, 0.28, s))), prof = (c) => Math.pow(Math.sin(Math.PI * Math.pow(c, 0.7)), 0.8);
    const zAt = (s, c) => zF - D * (lead(s) + (trail(s) - lead(s)) * c);
    for (const sd of [1, -1]) {
      const start = pos.length / 3;
      for (let i = -HS; i <= HS; i++) {
        const t = Math.abs(i) / HS, s = t * (0.7 + 0.3 * t), th = deep(s) * (sd > 0 ? 0.625 : -0.375);
        for (let j = 0; j <= HC; j++) { const c = (j / HC) ** 1.7; pos.push(Math.sign(i) * s * W, th * prof(c) - 0.05 * Lb * s * s, zAt(s, c)); uv.push(Math.sign(i) * s, c, sd); }
      }
      for (let i = 0; i < 2 * HS; i++) for (let j = 0; j < HC; j++) {
        const a = start + i * (HC + 1) + j, b = a + HC + 1;
        if (sd > 0) idx.push(a, b + 1, a + 1, a, b, b + 1); else idx.push(a, a + 1, b + 1, a, b + 1, b);
      }
    }
    const nSkin = (2 * HS + 1) * (HC + 1), tube = (k, rings, sides, fwd) => {
      for (let q = 0; q < rings - 1; q++) for (let e = 0; e < sides; e++) { const a = k + q * sides + e, b = k + q * sides + (e + 1) % sides; if (fwd) idx.push(a, b, b + sides, a, b + sides, a + sides); else idx.push(a, b + sides, b, a, a + sides, b + sides); }
      for (let e = 0; e < sides; e++) { const a = k + (rings - 1) * sides + e, b = k + (rings - 1) * sides + (e + 1) % sides; if (fwd) idx.push(a, b, k + rings * sides); else idx.push(a, k + rings * sides, b); }
    };
    if (!ray) for (const sx of [-1, 1]) {
      const k = pos.length / 3, L = 0.13 * DW, bx = 0.022 * DW, by = 0.024 * DW, x0 = sx * (hs * W + 0.6 * bx), y0 = -0.05 * Lb * hs * hs - 0.5 * by, z0 = zF - 0.035 * D;
      for (let q = 0; q <= 5; q++) for (let e = 0; e < 8; e++) {
        const f = q / 5, r = 1 - 0.55 * f * f, a = (e / 8) * Math.PI * 2;
        pos.push(x0 - sx * 0.10 * L * f * f + Math.cos(a) * bx * r, y0 - 0.12 * L * f * f + Math.sin(a) * by * r, z0 + L * f); uv.push(sx * 0.9, 0.5 + 0.5 * Math.sin(a), 2);
      }
      pos.push(x0 - sx * 0.10 * L, y0 - 0.12 * L, z0 + L + 0.5 * bx); uv.push(sx * 0.9, 0.5, 2); tube(k, 6, 8, true);
    }
    { const k = pos.length / 3, Lt = tail * D, rings = Math.round(8 + 6 * tail), r0 = (ray ? 0.01 : 0.012) * D, q0 = -0.07 * D / Lt;
      for (let q = 0; q < rings; q++) for (let e = 0; e < 6; e++) {
        const f = q0 + (1 - q0) * q / (rings - 1), g = Math.max(f, 0), r = r0 * (0.3 + 0.7 * (1 - g) ** 0.8), a = (e / 6) * Math.PI * 2;
        pos.push(Math.cos(a) * r, 0.01 * D - 0.12 * Lt * g * g + Math.sin(a) * r, zF - D - Lt * f); uv.push(0, g * tail, 3);
      }
      pos.push(0, 0.01 * D - 0.12 * Lt, zF - D - Lt - r0); uv.push(0, tail, 3); tube(k, rings, 6, false); }
    { const k = pos.length / 3, yb = (c) => 0.625 * deep(0) * prof(c) - 0.004 * DW;
      pos.push(0, yb(0.84), zAt(0, 0.84), 0.004 * DW, yb(0.90), zAt(0, 0.90), 0, yb(0.955), zAt(0, 0.955), -0.004 * DW, yb(0.90), zAt(0, 0.90), 0, yb(0.93) + 0.03 * DW, zAt(0, 0.945));
      uv.push(0, 0.84, 1, 0, 0.90, 1, 0, 0.955, 1, 0, 0.90, 1, 0, 0.93, 1); idx.push(k, k + 1, k + 4, k + 1, k + 2, k + 4, k, k + 4, k + 3, k + 3, k + 4, k + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3)); g.setIndex(idx); g.computeVertexNormals();
    const nr = g.attributes.normal;
    for (let i = 0; i <= 2 * HS; i++) { const a = i * (HC + 1), b = nSkin + a, x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1; nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l); }
    return g;
  }
  const skin = (sd) => {
    const start = pos.length / 3;
    for (let i = -NS; i <= NS; i++) {
      const sp = Math.abs(i) / NS, zl = Lb * (0.42 - 0.56 * Math.pow(sp, 1.35)), zt = Lb * (-0.5 + 0.375 * Math.pow(sp, 0.75)), th = 0.115 * Lb * Math.pow(1 - sp, 1.6) + 0.010 * Lb;
      for (let j = 0; j <= NC; j++) {
        const c = j / NC, bump = Math.pow(Math.sin(Math.PI * Math.pow(c, 0.7)), 0.8);
        pos.push((i / NS) * W, (sd > 0 ? th : -th * 0.6) * bump - 0.05 * Lb * sp * sp, zl + (zt - zl) * c); uv.push(i / NS, c, sd);
      }
    }
    for (let i = 0; i < 2 * NS; i++) for (let j = 0; j < NC; j++) {
      const a = start + i * (NC + 1) + j, b = a + NC + 1;
      if (sd > 0) idx.push(a, b + 1, a + 1, a, b, b + 1); else idx.push(a, a + 1, b + 1, a, b + 1, b);
    }
  };
  skin(1); skin(-1);
  for (const sx of [-1, 1]) {   // cephalic lobes
    const k = pos.length / 3;
    pos.push(sx * 0.07 * Lb, 0.01 * Lb, 0.38 * Lb, sx * 0.10 * Lb, -0.03 * Lb, 0.60 * Lb, sx * 0.15 * Lb, -0.035 * Lb, 0.56 * Lb, sx * 0.17 * Lb, 0, 0.34 * Lb);
    for (let i = 0; i < 4; i++) uv.push(sx * 0.9, 0.95, 2);
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  { const k = pos.length / 3, zs = [-0.44, -0.44 - (tail - 0.44) * 0.29, -0.44 - (tail - 0.44) * 0.64, -tail], rs = tail < 1.5 ? [0.024, 0.016, 0.01, 0.003] : [0.02, 0.012, 0.006, 0.001];   // whip tail
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const a = (j / 4) * Math.PI * 2; pos.push(Math.cos(a) * rs[i] * Lb, Math.sin(a) * rs[i] * Lb, zs[i] * Lb); uv.push(0, 0.95, 2); }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { const a = k + i * 4 + j, b = k + i * 4 + (j + 1) % 4; idx.push(a, b, b + 4, a, b + 4, a + 4); } }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// Catmull-Rom through keyframes [x, v0, v1, ...] (x ascending); out receives the values at x
function keyAt(keys, x, out) {
  let i = 0; while (i < keys.length - 2 && keys[i + 1][0] < x) i++;
  const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(keys.length - 1, i + 2)], t = clamp((x - p1[0]) / (p2[0] - p1[0]), 0, 1);
  for (let k = 1; k < p1.length; k++) { const a = p0[k], b = p1[k], c = p2[k], d = p3[k]; out[k - 1] = 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - 3 * c + d - a) * t * t * t); }
  return out;
}
const instanced = (base, attrs, count) => {
  const g = new THREE.InstancedBufferGeometry(); g.setIndex(base.index);
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  for (const k of Object.keys(attrs)) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
  g.instanceCount = count; return g;
};

// ---- cloud wisps at arm's length on the fall: billboards round a world-fixed centre, soft stranded fbm, gone when its centre is 16 m off
const WISP_VERT = /* glsl */`
attribute vec3 aC, aS;      // centre (world); half width, half height, seed
varying vec2 vUv; varying vec2 vK;
void main(){
  vec4 mv = viewMatrix * vec4(aC, 1.);
  vUv = position.xy; vK = vec2(length(mv.xyz), aS.z);
  mv.xy += position.xy * aS.xy;
  gl_Position = projectionMatrix * mv;
}`;
const WISP_FRAG = /* glsl */`
uniform vec3 uWispLit, uWispSh; uniform float uWispT;
varying vec2 vUv; varying vec2 vK;
${NOISE_GLSL}
void main(){
  vec2 p = vUv * 1.5 + vK.y * 17.3;
  float w = aFbm(p * 1.2 + vec2(uWispT * .05, 0.));
  float n = aFbm(p * vec2(1.1, 2.9) + 1.7 * w + vec2(uWispT * .12, uWispT * .03));      // drawn-out strands
  float a = 1. - smoothstep(.1, 1., length(vUv) + .95 * (n - .42));
  a *= a * (1. - smoothstep(12.6, 16.2, vK.x)) * smoothstep(3., 6., vK.x) * .8;
  gl_FragColor = vec4(mix(uWispSh, uWispLit, smoothstep(.2, .75, n + .25 * vUv.y)), a);
}`;

// ================================================================= SEEDED MOODS
// sky: makeSky options. lit: what the sun does to the sea's own colour. refl: fresnel gain (glass calm mirrors the sky).
// wind: chop 0..1 (whitecaps, ripples, palms). cloudSh: cloud-shadow strength. uw*: the water below. hero*: the wall's light.
const LOOKS = {
  trades: { sky: { preset: 'day', zenith: '#1E6FD8', horizon: '#BFE3F5', sunElevation: 78 }, lit: [1.0, 0.98, 0.93], sun: '#FFF8EA', sunK: 1.0, amb: [0.30, 0.38, 0.52],
    shadow: [0.42, 0.50, 0.78], tan: '#D9AF98', refl: 0.55, wind: 1, cloudSh: 0.55, clouds: 30, squall: 0, hazeK: 0.00011,
    uwWater: '#1B7FA6', uwDeep: '#0C5078', uwFog: 0.0082, rays: 0.8, exposure: 1.0, tint: '#ffffff', satur: 1.12 },
  calm: { sky: { preset: 'day', zenith: '#2478DC', horizon: '#CBE9F6', sunElevation: 78 }, lit: [1.0, 0.99, 0.95], sun: '#FFF8EA', sunK: 1.0, amb: [0.32, 0.40, 0.52],
    shadow: [0.42, 0.50, 0.78], tan: '#DDB6A0', refl: 0.8, wind: 0.07, cloudSh: 0.25, clouds: 9, squall: 0, hazeK: 0.00008,
    uwWater: '#1D86AE', uwDeep: '#0C5078', uwFog: 0.0082, rays: 0.85, exposure: 1.0, tint: '#ffffff', satur: 1.15 },
  squall: { sky: { preset: 'day', zenith: '#3A6AA4', horizon: '#C2D0D8', sunElevation: 70 }, lit: [0.88, 0.9, 0.9], sun: '#FFF4E2', sunK: 0.86, amb: [0.30, 0.37, 0.48],
    shadow: [0.40, 0.47, 0.72], tan: '#D2A994', refl: 0.6, wind: 1.25, cloudSh: 0.8, clouds: 34, squall: 1, hazeK: 0.00014,
    uwWater: '#1A7799', uwDeep: '#0B4A70', uwFog: 0.0095, rays: 0.7, exposure: 1.02, tint: '#f4f8ff', satur: 1.08 },
  golden: { sky: { preset: 'goldenHour', sunElevation: 25 }, lit: [0.96, 0.88, 0.76], sun: '#FFC27A', sunK: 0.95, amb: [0.30, 0.27, 0.40],
    shadow: [0.46, 0.36, 0.66], tan: '#E6A868', refl: 0.6, wind: 0.6, cloudSh: 0.35, clouds: 22, squall: 0, hazeK: 0.00013,
    uwWater: '#217A8E', uwDeep: '#0D4868', uwFog: 0.009, rays: 1.3, exposure: 1.05, tint: '#fff2e0', satur: 1.1,
    heroSun: [1.25, 0.82, 0.50], heroSky: [0.20, 0.52, 0.60], heroDeep: [0.05, 0.24, 0.36] },
  dawn: { sky: { preset: 'dawn', sunElevation: 7 }, lit: [0.80, 0.79, 0.80], sun: '#FFC9B8', sunK: 0.6, amb: [0.42, 0.38, 0.50],
    shadow: [0.62, 0.56, 0.78], tan: '#D6A6A2', refl: 0.8, wind: 0.04, cloudSh: 0.15, clouds: 12, squall: 0, hazeK: 0.00010,
    uwWater: '#19688F', uwDeep: '#092F54', uwFog: 0.0098, rays: 0.5, exposure: 1.18, tint: '#ffeef2', satur: 1.05,
    heroSun: [0.36, 0.56, 0.72], heroSky: [0.15, 0.42, 0.60], heroDeep: [0.05, 0.20, 0.36] },
};

export default {
  id: 'atoll-pass-shark-wall',
  name: 'The Pass',
  category: 'ocean',
  weirdness: 0.05,
  media: ['air', 'water', 'underwater'],
  async build(ctx) {
    const R = ctx.rng.fork('pass-look'), noise = ctx.noise;
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    // RX: the random stream of everything added in the polish pass (the far canoes, the near frigatebirds and terns, the
    // amphitheatre's fusiliers, the exit's reef, eels, rays, schools and ranks of sharks). R, the world's own stream, is
    // drawn exactly as before, so nothing that was already there has moved.
    const RX = makeRng('pass-polish:' + (ctx.seed ?? 0));
    // RX2: the stream of the second polish pass (the crossing flight of terns at the opening, the extra sharks under the
    // skim, the amphitheatre walls' own corals and fans). R and RX are drawn exactly as before.
    const RX2 = makeRng('pass-polish2:' + (ctx.seed ?? 0));
    // RX3: the third polish pass (the nose-over's own birds; the cloud wisps draw nothing). R, RX and RX2 are drawn as before.
    const RX3 = makeRng('pass-polish3:' + (ctx.seed ?? 0));
    // RX4: the fourth polish pass (the frigatebird that wheels beside the entry). The other streams are drawn as before.
    const RX4 = makeRng('pass-polish4:' + (ctx.seed ?? 0));
    // RX5: the sixth polish pass (the group of sharks and the shafts of light round the portal). The others are drawn as before.
    const RX5 = makeRng('pass-polish5:' + (ctx.seed ?? 0));
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z), col = (h) => new THREE.Color(h);

    // ---- the pick: hour first (the viewer's wish), then weather, atoll and cast by seed
    const hour = vary.hour || 'any'; let lookName;
    if (hour === 'golden' || hour === 'night') lookName = 'golden';
    else if (hour === 'dawn') lookName = 'dawn';
    else if (hour === 'day') lookName = R.pick(['trades', 'trades', 'calm', 'squall']);
    else { const r0 = R(), r = typeof vary.mood === 'number' ? vary.mood : r0; lookName = r < 0.42 ? 'trades' : r < 0.64 ? 'golden' : r < 0.78 ? 'squall' : r < 0.9 ? 'calm' : 'dawn'; }
    const LK = LOOKS[lookName], noon = lookName === 'trades' || lookName === 'calm' || lookName === 'squall';
    const cast = { rays: R.chance(0.33), cuda: R.chance(0.4), dolphins: !!vary.rare };
    const milky = R.chance(0.35), pinkSand = R.chance(0.4);
    const mint = col(PALETTE[1]), jade = col(PALETTE[2]), cobalt = col(PALETTE[0]), deepTeal = col(PALETTE[5]);
    if (milky) { mint.lerp(col('#BFF2EA'), 0.55); jade.lerp(col('#3CC6B8'), 0.6); } else jade.offsetHSL(R.range(-0.02, 0.02), 0, R.range(-0.02, 0.03));
    const sand = col(pinkSand ? '#F2D9CF' : '#F6FCF8').multiplyScalar(0.8), tanC = col(LK.tan);

    // ================================================================= HERO PLACEMENT
    // The hero's local frame has the amphitheatre floor at y = 0 and the surface at y = 30: it sits at world y = -30,
    // unrotated (the camera arrives from +Z flying -Z). The canyon is built in the same frame and parented to it.
    const sunDirW = skyDirection(LK.sky.sunElevation, 200);            // astern and 20 degrees to port, never in frame
    const uwSun = V3(sunDirW.x * 0.75, Math.max(sunDirW.y, 0.55), sunDirW.z * 0.75).normalize();   // refracted: steeper below
    const hero = await buildHero(ctx, { palette: PALETTE, standalone: false, sunDir: uwSun, haze: LK.uwWater, hazeDeep: LK.uwDeep, footDark: noon ? 0.8 : 0,
      sunColor: LK.heroSun ? new THREE.Color(...LK.heroSun) : undefined, skyLight: LK.heroSky ? new THREE.Color(...LK.heroSky) : undefined, deepLight: LK.heroDeep ? new THREE.Color(...LK.heroDeep) : undefined });
    hero.object.position.set(0, -30, 0);
    const HA = hero.anchors, toW = (v) => V3(v.x, v.y - 30, v.z);
    await ctx.yield();

    // ================================================================= THE PATH
    // d1: the tide's direction through the pass (30 degrees right of -Z); B: the canyon bend; P: where the path meets the sea.
    const d1 = V3(0.5, 0, -0.8660254), Lf = V3(d1.z, 0, -d1.x), Rt = Lf.clone().negate();
    const B = toW(HA.flyThrough[0]), P = B.clone().addScaledVector(d1, -80); P.y = 0;
    const cdir = d1.clone().multiplyScalar(Math.cos(0.21)).addScaledVector(Lf, Math.sin(0.21)), cLf = V3(cdir.z, 0, -cdir.x);
    const S0 = P.clone().addScaledVector(d1, -45), A0 = S0.clone().addScaledVector(cdir, -150);
    const air = (t, off, y) => V3(A0.x + cdir.x * t + cLf.x * off, y, A0.z + cdir.z * t + cLf.z * off);
    const along = (a, y) => V3(P.x + d1.x * a, y, P.z + d1.z * a);
    const seat = toW(HA.portalSeat.position);
    // (the entry is 64 m up, an apparent 350 m: high enough that the ring lies open as a full ellipse, not a thin disc)
    const pts = [air(0, 0, 64), air(30, 0, 61), air(60, 1.5, 54), air(82, 3.5, 37), air(102, 5, 17), air(122, 4.5, 5.4), air(138, 2.5, 2.8),
      along(-45, 2.3), along(-28, 2.05), along(-12, 2.0), P.clone(), along(14, -3.4), along(30, -8.2), along(50, -11.2), along(66, -11.9)];
    for (const f of HA.flyThrough) pts.push(toW(f));
    pts.push(V3(-2.5, -29.5, -108), V3(-3.5, -31.3, -121), seat.clone().add(V3(0, -20.5, 56.4)), seat.clone().add(V3(0, -10.25, 28.2)), seat.clone());
    const path = makePath(pts);
    await ctx.yield();
    const uOf = (v) => path.nearestXZ(v.x, v.z).u;
    const uDive = uOf(P), uBend = uOf(B), uWallIn = uOf(V3(0, 0, 40)), uHead = uOf(V3(0, 0, -64)), uBowl = uOf(V3(-3.5, 0, -121));
    const K0 = uDive * 0.32, K1 = uDive * 0.8;
    const camHold = new THREE.Matrix4(), camPos = new THREE.Vector3();
    // k(u), the air leg's scale (third polish pass): KMIN for the opening view only, then the fall begins at once. A first
    // surge (from just after the first second to the fourth) brings the ring from 70% of the frame's width to past its
    // edges while the nose goes over, a steady swell follows, and the last third of the ramp is the old one (so the skim
    // arrives exactly as it did). Keys of ln k, joined by a monotone cubic: k never falls back and never jerks.
    // The knots are places on the route, shares u of its 583 m: 0.025 (14.6 m in: the opening view ends), 0.08, 0.12, 0.16
    // and 0.2 (46.7, 70.0, 93.3 and 116.7 m in), then K1 - 0.05, K1 - 0.02 and K1 (the old ramp's last third). Only 0.12 is
    // a beat the design names (the place the flight has reached at its 6 s, where the ring beat ends and the fall begins);
    // the others are typed shares of the route that give the swell its shape between, not seconds of the design. They
    // shape the swell of the ring and nothing else.
    const KMIN = 0.18;
    const kKeys = [[0, KMIN], [0.025, KMIN], [0.08, 0.37], [0.12, 0.43], [0.16, 0.48], [0.2, 0.55], [K1 - 0.05, 0.72], [K1 - 0.02, 0.93], [K1, 1], [1.01, 1]].map(([u, k]) => [u, Math.log(k)]);
    const kTan = (() => {
      const n = kKeys.length, d = [], m = new Array(n).fill(0);
      for (let i = 0; i < n - 1; i++) d.push((kKeys[i + 1][1] - kKeys[i][1]) / (kKeys[i + 1][0] - kKeys[i][0]));
      for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] > 0 ? 0.5 * (d[i - 1] + d[i]) : 0;
      for (let i = 0; i < n - 1; i++) {
        if (Math.abs(d[i]) < 1e-9) { m[i] = 0; m[i + 1] = 0; continue; }
        const a = m[i] / d[i], b = m[i + 1] / d[i], q = a * a + b * b;
        if (q > 9) { const t = 3 / Math.sqrt(q); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
      }
      return m;
    })();
    const kOf = (u) => {
      const x = clamp(u, 0, 1); let i = 0; while (i < kKeys.length - 2 && kKeys[i + 1][0] < x) i++;
      const h = kKeys[i + 1][0] - kKeys[i][0], t = (x - kKeys[i][0]) / h, t2 = t * t, t3 = t2 * t;
      return Math.exp((2 * t3 - 3 * t2 + 1) * kKeys[i][1] + (t3 - 2 * t2 + t) * h * kTan[i] + (-2 * t3 + 3 * t2) * kKeys[i + 1][1] + (t3 - t2) * h * kTan[i + 1]);
    };

    // ---- the atoll's shape for this seed (plate space = world space at k = 1)
    const R0 = R.range(1380, 1520), e2 = R.range(0.07, 0.12), e3 = R.range(0.02, 0.05), e5 = R.range(0.01, 0.028);
    const AT = { R0, e2, p2: R.range(0, Math.PI), e3, p3: R.range(0, 6.28), e5, n: R.int(12, 30), a1: R.range(0, 6.28), a2: R.range(0, 6.28),
      px: P.x, pz: P.z, fx: d1.x, fz: d1.z, ripAmp: 0.36, chop: 0.03 + 0.045 * Math.min(LK.wind, 1), thP: Math.atan2(-d1.z, -d1.x), cx: 0, cz: 0 };
    { // put the ring so that P lies in the pass, 85 m seaward of the ring line (the islets then stand ahead on both bows)
      const rp = AT.R0 * (1 + AT.e2 * Math.cos(2 * (AT.thP - AT.p2)) + AT.e3 * Math.cos(3 * AT.thP - AT.p3) + AT.e5 * Math.cos(5 * AT.thP + 1.3)) + 85;
      AT.cx = P.x + d1.x * rp; AT.cz = P.z + d1.z * rp;
    }
    const atoll = makeAtoll(AT);
    const surfaceAt = (x, z, t) => atoll.ripH(x, z, t);

    // ================================================================= sky, light, clouds
    const sky = makeSky({ rng: R, ...LK.sky, sunAzimuth: 200, clouds: false });
    scene.add(sky.object);
    await ctx.yield();
    const fwdHor = V3(d1.x, 0.035, d1.z).normalize();
    const hazeCol = sky.colorAt(fwdHor, new THREE.Color()), skyZen = sky.colorAt(V3(0, 1, 0), new THREE.Color()), skyHor = sky.colorAt(V3(d1.x, 0.12, d1.z).normalize(), new THREE.Color());
    scene.fog = new THREE.FogExp2(hazeCol.clone(), 0.00007);
    scene.background = hazeCol.clone();
    const rig = makeLightRig(sky, { bounce: 0.45 }); scene.add(rig.object);
    await ctx.yield();
    const sunCol = col(LK.sun).multiplyScalar(LK.sunK);
    const clouds = [];
    for (let i = 0; i < Math.round(LK.clouds * (0.7 + 0.3 * detail)); i++) {
      const az = R.range(0, Math.PI * 2), dist = R.range(1700, 3400), w = R.range(240, 520);
      clouds.push([P.x + Math.cos(az) * dist, R.range(110, 240) + (LK.squall ? 30 : 0), P.z + Math.sin(az) * dist, w]);
    }
    const cloudField = makeCloudField({ rng: R, sky, at: clouds, puffs: 20, height: 0.62, farFade: [4300, 5600], fogFade: 0, wind: [d1.x * -3, 0, d1.z * -3] });
    scene.add(cloudField.object);
    await ctx.yield();

    // ================================================================= ABOVE WATER
    const above = new THREE.Group(); above.name = 'above-water'; scene.add(above);
    const plate = new THREE.Group(); plate.name = 'plate'; above.add(plate);       // everything in it is scaled by k about P
    const ripC = P.clone().addScaledVector(d1, -10), RIP_R = 150, DISC_R = 3800;
    const V4 = (x, y, z, w) => ({ value: new THREE.Vector4(x, y, z, w) }), C3 = (c) => ({ value: c });
    const passCol = deepTeal.clone().lerp(cobalt, 0.35).multiplyScalar(1.15);
    if (lookName === 'dawn') passCol.lerp(col('#2F4E66'), 0.6);      // (dawn: a jade-to-slate channel in a slate sea, not electric violet)
    // (golden: the open sea is a teal-blue, so the rose haze greys it with distance instead of turning it purple)
    const seaU = {
      uRing: V4(AT.cx, AT.cz, AT.R0, AT.thP), uRingE: V4(AT.e2, AT.p2, AT.e3, AT.p3), uIsl: V4(AT.n, AT.a1, AT.a2, AT.e5),
      uPlate: V4(P.x, P.z, KMIN, 0), uRipP: V4(d1.x, d1.z, AT.ripAmp, AT.chop), uRip: V4(ripC.x, ripC.z, RIP_R, DISC_R),
      uCobalt: C3(lookName === 'dawn' ? cobalt.clone().lerp(col('#2F4E66'), 0.86).multiplyScalar(0.8) : (lookName === 'golden' ? cobalt.clone().lerp(col('#0D6488'), 0.5) : cobalt.clone().lerp(deepTeal, 0.25)).multiplyScalar(noon ? 0.85 : 1.0)), uMint: C3(mint.clone().multiplyScalar(0.86)), uJade: C3(jade.clone()), uTeal: C3(jade.clone().lerp(deepTeal, 0.7).multiplyScalar(0.9)),
      uSand: C3(sand), uTan: C3(tanC.clone().multiplyScalar(0.92)), uFoam: C3(col('#ffffff').multiplyScalar(0.9)), uFoamSh: C3(col('#8A9BD8').multiplyScalar(0.72)),
      uReefDark: C3(col('#2B5A4C')), uPassCol: C3(passCol), uSkyZen: C3(skyZen), uSkyHor: C3(skyHor), uHazeCol: C3(hazeCol),
      uLit: C3(new THREE.Color(...LK.lit)), uSunCol: C3(sunCol), uShadowTint: C3(new THREE.Color(...LK.shadow)), uSunDir: { value: sunDirW.clone() },
      uWind: V4(-d1.x, -d1.z, LK.wind, LK.cloudSh), uSunA: V4(sunDirW.x / sunDirW.y, sunDirW.z / sunDirW.y, LK.hazeK, LK.refl),
      uCanoe: V4(P.x, P.z, d1.x, d1.z), uCanoe2: V4(P.x, P.z, d1.x, d1.z), uCanoe3: V4(P.x, P.z, d1.x, d1.z), uSquall: V4(0, 0, 500, 0),
      uAmb: C3(new THREE.Color(...LK.amb)), uBounce: C3(mint.clone().multiplyScalar(0.22)),
      uBedK: { value: lookName === 'dawn' ? 0.7 : lookName === 'golden' ? 0.45 : 0 },
    };
    { // the sea disc
      const J = 44, S = 72, pos = [0, 0, 0], idx = [];
      for (let j = 1; j <= J; j++) { const r = DISC_R * Math.pow(j / J, 2.6); for (let i = 0; i < S; i++) { const a = (i / S) * Math.PI * 2; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); } }
      for (let i = 0; i < S; i++) idx.push(0, 1 + (i + 1) % S, 1 + i);
      for (let j = 0; j < J - 1; j++) for (let i = 0; i < S; i++) { const a = 1 + j * S + i, b = 1 + j * S + (i + 1) % S; idx.push(a, b, b + S, a, b + S, a + S); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      var seaDisc = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: DISC_VERT, fragmentShader: DISC_FRAG, side: THREE.DoubleSide }));
      seaDisc.frustumCulled = false; seaDisc.name = 'sea-disc'; above.add(seaDisc);
    }
    await ctx.yield();
    // land height at ring coordinates (arc metres from the pass, metres outside the ring line)
    const landAt = (s, d) => { const th = AT.thP + s / AT.R0, a = atoll.islA(th, s), q = atoll.toPlate(s, d); return { x: q[0], z: q[1], y: atoll.islH(a, d), a }; };
    { // islets: a strip of land round the ring, dense near the pass; only the quads that break the surface are kept
      const NT = 560, ND = 13, pos = [], idx = [], id = new Int32Array((NT + 1) * ND).fill(-1), ys = new Float32Array((NT + 1) * ND), xz = new Float32Array((NT + 1) * ND * 2);
      for (let i = 0; i <= NT; i++) {
        if (i % 15 === 14) await ctx.yield();
        const t = (i / NT) * Math.PI * 2 - Math.PI, s = (t - 0.7 * Math.sin(t)) * AT.R0;
        for (let j = 0; j < ND; j++) {
          const d = -140 + (j / (ND - 1)) * 170, L = landAt(s, d), k = i * ND + j;
          const bump = L.y > 0.9 ? 0.9 * (noise.fbm2(L.x * 0.03, L.z * 0.03, 3) + 0.4) : 0.12 * noise.n2(L.x * 0.08, L.z * 0.08);
          ys[k] = Math.max(-1.5, L.y + bump); xz[k * 2] = L.x; xz[k * 2 + 1] = L.z;
        }
      }
      await ctx.yield();
      const vert = (k) => { if (id[k] < 0) { id[k] = pos.length / 3; pos.push(xz[k * 2], ys[k], xz[k * 2 + 1]); } return id[k]; };
      for (let i = 0; i < NT; i++) for (let j = 0; j < ND - 1; j++) {
        const a = i * ND + j, b = a + ND, c = b + 1, e = a + 1;
        if (Math.max(ys[a], ys[b], ys[c], ys[e]) < -0.25) continue;
        idx.push(vert(a), vert(e), vert(c), vert(a), vert(c), vert(b));
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); await vertexNormalsInSlices(ctx, g);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: ISLET_VERT, fragmentShader: ISLET_FRAG, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.name = 'islets'; plate.add(m);
    }
    await ctx.yield();
    const propMat = new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: PROP_VERT, fragmentShader: PROP_FRAG, side: THREE.DoubleSide });
    // which ring side is on the camera's left as it comes in
    const ls = (() => { const q = atoll.toPlate(300, -55); return ((q[0] - P.x) * Lf.x + (q[1] - P.z) * Lf.z) > 0 ? 1 : -1; })();
    { // palms: six hundred crowns, thickest on the two islets that shoulder the pass
      const want = Math.round(600 * dens * (0.6 + 0.4 * detail)), M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V3(1, 1, 1), p = V3(0, 0, 0), list = [];
      for (let tries = 0; tries < want * 30 && list.length < want; tries++) {
        if (tries % 100 === 99) await ctx.yield();
        const nearPass = R.chance(0.6), s = nearPass ? (R.chance(0.5) ? 1 : -1) * (120 + Math.abs(R.gauss()) * 330) : R.range(-Math.PI, Math.PI) * AT.R0;
        const L = landAt(s, R.range(-118, 8));
        if (L.y < 1.35) continue;
        list.push(L);
      }
      await ctx.yield();
      const palms = new THREE.InstancedMesh(palmGeo(R), propMat, list.length);
      list.forEach((L, i) => { const k = R.range(0.8, 1.4); e.set(R.range(-0.12, 0.12), R.range(0, 6.28), R.range(-0.12, 0.12)); q.setFromEuler(e); sc.set(k, k * R.range(0.85, 1.15), k); p.set(L.x, L.y - 0.3, L.z); M.compose(p, q, sc); palms.setMatrixAt(i, M); });
      palms.frustumCulled = false; palms.name = 'palms'; plate.add(palms);
      await ctx.yield();
      const G = propGeo();
      [[330, -84, 0.3], [352, -70, 1.2], [374, -88, -0.4]].forEach(([s, d, yaw]) => { const L = landAt(ls * s, d); houseGeo(G, L.x, Math.max(L.y, 0.6) - 0.1, L.z, yaw + AT.thP); });
      const bl = landAt(-ls * 232, -42); beaconGeo(G, bl.x, Math.max(bl.y, 0.5), bl.z);
      const props = new THREE.Mesh(G.build(), propMat); props.frustumCulled = false; props.name = 'houses-beacon'; plate.add(props);
      var beaconAt = V3(bl.x, 9, bl.z);
    }
    await ctx.yield();
    // the canoe: runs up the tongue of the rip ahead and to starboard of the skim; its wake is painted by the sea shader
    const canoe = new THREE.Mesh(canoeGeo(PALETTE[6]), propMat); canoe.frustumCulled = false; canoe.name = 'canoe'; plate.add(canoe);
    // It beats out through the pass against us at 5 m/s, 9 m off the starboard bow: a fleck ahead as the skim begins, a
    // quarter of the frame tall two seconds before the dive, abeam as the lens goes under (canoeU). On the rare dolphin
    // seeds it passes earlier and wider, under the last of the descent, so the sea ahead of the skim is the dolphins' alone.
    const canoeHead = d1.clone().multiplyScalar(-1).addScaledVector(Rt, 0.06).normalize();
    const canoeU = cast.dolphins ? K1 - 0.08 : uDive + 0.004;
    const canoeAb = (() => { const c = path.pointAt(canoeU), kk = kOf(canoeU), lat = cast.dolphins ? 16 : 9; return V3(P.x + (c.x + Rt.x * lat - P.x) / kk, 0, P.z + (c.z + Rt.z * lat - P.z) / kk); })();
    canoe.rotation.y = Math.atan2(canoeHead.x, canoeHead.z);
    // two more canoes far out on the open sea, under the opening view (128 and 170 m ahead of the entry, to starboard and
    // to port): from the air an orange fleck with a short white V behind it, for scale. Their wakes are painted by the sea
    // shader from uCanoe2 / uCanoe3; they sail 4.5 m/s in plate space.
    const farCanoes = [[128, -32, 0.5], [170, 40, -0.35]].map(([t, off, turn], i) => {
      const m = new THREE.Mesh(canoe.geometry, propMat); m.frustumCulled = false; m.name = 'canoe-far-' + i; plate.add(m);
      const a = air(t, off, 0), h = cdir.clone().multiplyScalar(Math.cos(turn)).addScaledVector(cLf, Math.sin(turn));
      m.rotation.y = Math.atan2(h.x, h.z); m.scale.setScalar(2);   // (a voyaging canoe twice the size of the one in the pass)
      return { m, px: P.x + (a.x - P.x) / KMIN, pz: P.z + (a.z - P.z) / KMIN, hx: h.x, hz: h.z, yaw: m.rotation.y, u: i ? seaU.uCanoe3 : seaU.uCanoe2 };
    });
    await ctx.yield();
    { // the rip sheet (fine near the skim line), the dark bed under it and the sharks between
      const N = 140, pos = [], idx = [], id = new Int32Array((N + 1) * (N + 1)).fill(-1), wx = (i) => { const a = (i / N) * 2 - 1; return Math.sign(a) * Math.pow(Math.abs(a), 1.7) * (RIP_R + 6); };
      for (let j = 0; j <= N; j++) { if (j % 20 === 19) await ctx.yield(); for (let i = 0; i <= N; i++) { const x = wx(i), z = wx(j); if (Math.hypot(x, z) < RIP_R + 12) { id[j * (N + 1) + i] = pos.length / 3; pos.push(ripC.x + x, 0, ripC.z + z); } } }
      await ctx.yield();
      for (let j = 0; j < N; j++) { if (j % 20 === 19) await ctx.yield(); for (let i = 0; i < N; i++) { const a = id[j * (N + 1) + i], b = id[j * (N + 1) + i + 1], c = id[(j + 1) * (N + 1) + i + 1], e = id[(j + 1) * (N + 1) + i]; if (a >= 0 && b >= 0 && c >= 0 && e >= 0) idx.push(a, e, c, a, c, b); } }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); await ctx.yield(); g.setIndex(idx);
      await ctx.yield();
      const sheet = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: RIP_VERT, fragmentShader: RIP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 }));
      sheet.frustumCulled = false; sheet.renderOrder = 1; sheet.name = 'rip-sheet'; plate.add(sheet);
      await ctx.yield();
      const bed = new THREE.Mesh(new THREE.CircleGeometry(RIP_R + 4, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: DISC_VERT, fragmentShader: BED_FRAG }));
      bed.position.set(ripC.x, -4, ripC.z); bed.frustumCulled = false; bed.name = 'pass-bed'; plate.add(bed);
      // The forty of the first build (R, drawn as before) ride nearer the line and shallower, in every size from 1.4 to 2.8 m;
      // thirty-two more (RX2) hang within 8 m of it; and a dozen are placed along the skim by hand, large, shallow and turned
      // half across the tide, so that wherever the lens is one big animal lies in profile a few metres ahead of it.
      const FEAT = [[-60.5, -0.8, 2.8, -0.8, 1.3], [-56.5, 3.2, 2.4, -1.0, -1.2], [-53, -4.6, 2.6, -1.0, 1.1], [-47, 0.8, 2.5, -1.1, -1.0], [-39, 2.4, 2.7, -0.9, -1.0], [-33, -2.6, 2.1, -1.1, 0.9], [-27.5, 3.0, 2.6, -1.0, -0.75],
        [-21, -2.3, 2.8, -0.9, 1.05], [-15, 3.2, 2.3, -1.15, -0.9], [-8.8, -2.4, 2.8, -0.85, 0.95], [-5.2, 2.9, 2.0, -1.2, -0.8], [0.5, -3.0, 2.6, -1.0, 0.85], [5, 2.5, 2.4, -1.1, -0.9]];
      const n0 = 40, n1 = 32, n = n0 + n1 + FEAT.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      for (let i = 0; i < n0; i++) {
        const a = R.range(-78, 14), b = (R.chance(0.5) ? 1 : -1) * R.range(2.2, 15), len = R.range(1.6, 2.0), y = R.range(-2.8, -1.1), sz = lerp(1.4, 2.6, Math.pow(RX2(), 1.3));
        iA.set([P.x + d1.x * a + Rt.x * b * 0.8, y * 0.72 - 0.1, P.z + d1.z * a + Rt.z * b * 0.8, sz + 0 * len], i * 4);
        iB.set([R(), R.range(0.5, 0.8), R.gauss() * 0.12 + RX2.range(-0.45, 0.45), 0], i * 4);
      }
      for (let i = n0; i < n0 + n1; i++) {
        const a = RX2.range(-76, 12), b = (RX2.chance(0.5) ? 1 : -1) * RX2.range(1.6, 8), sz = lerp(1.4, 2.8, Math.pow(RX2(), 1.2));
        iA.set([P.x + d1.x * a + Rt.x * b, RX2.range(-1.9, -0.75), P.z + d1.z * a + Rt.z * b, sz], i * 4);
        iB.set([RX2(), RX2.range(0.5, 0.8), RX2.range(-0.7, 0.7), 0], i * 4);
      }
      FEAT.forEach(([a, b, sz, y, yaw], j) => { const i = n0 + n1 + j;
        iA.set([P.x + d1.x * a + Rt.x * b, y, P.z + d1.z * a + Rt.z * b, sz], i * 4); iB.set([RX2(), 0.55, yaw, 0], i * 4); });
      await ctx.yield();
      const sgBase = sharkGeometry(0), sg = instanced(sgBase, { iA, iB }, n);
      const sm = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: { uPlate: seaU.uPlate, uRipP: seaU.uRipP, uSharkCol: C3(new THREE.Color(0.075, 0.09, 0.11).multiply(seaU.uLit.value)), uWaterCol: C3(new THREE.Color(0.03, 0.2, 0.31).multiply(seaU.uLit.value)) }, vertexShader: SSHARK_VERT, fragmentShader: SSHARK_FRAG, side: THREE.DoubleSide }));
      sm.frustumCulled = false; sm.name = 'surface-sharks'; plate.add(sm);
      // THE SKIM'S OWN SHARKS (fourth polish pass). As the skim begins the plate is still short of its full size, so its
      // sharks are small and far. These are real metres in world space (in `above`, not on the plate): large animals lying
      // half across the tide along the lens' own line under the bar's standing-wave crests, 30 to 60 m short of the dive
      // point, two or three metres either side of the line, each an eighth to a sixth of the frame wide as we come over it
      // (sixth polish pass: four more carry the line on to the pass mouth, so all through the skim one lies a few metres ahead)
      const SK = [[-60.3, -2.0, 3.0, -0.75, 1.25], [-58.0, 2.4, 2.8, -0.8, -1.2], [-55.4, -0.3, 3.0, -0.9, 1.0], [-52.0, 3.8, 2.6, -1.0, -0.9],
        [-49.4, -2.7, 3.0, -0.8, 1.15], [-43.4, -2.3, 2.9, -0.75, -1.1], [-36.3, 1.1, 3.0, -0.85, 1.2], [-30.3, -0.5, 2.8, -0.8, -1.05]];
      // (each animal's tail-beat phase, and with it the phase of its slow drift, is drawn from a stream of the skim's own, RXS:
      // the eight here first, then the four approach sharks)
      const RXS = makeRng('pass-skim:' + (ctx.seed ?? 0));
      const kA = new Float32Array(SK.length * 4), kB = new Float32Array(SK.length * 4);
      SK.forEach(([a, b, sz, y, yaw], i) => { kA.set([P.x + d1.x * a + Rt.x * b, y, P.z + d1.z * a + Rt.z * b, sz], i * 4); kB.set([RXS(), 0.5 + 0.06 * i, yaw, 0], i * 4); });
      const sm2 = new THREE.Mesh(instanced(sgBase, { iA: kA, iB: kB }, SK.length), sm.material);
      sm2.frustumCulled = false; sm2.name = 'skim-sharks'; above.add(sm2);
      // the approach sharks (see APSHARK_VERT): four on the plate, 99 to 126 m seaward of P, each over its pale sand lens
      const pA = new Float32Array(AP_SEATS.length * 4), pB = new Float32Array(AP_SEATS.length * 4);
      AP_SEATS.forEach(([a, b, yaw], i) => { pA.set([P.x + d1.x * a + Rt.x * b, -1.5, P.z + d1.z * a + Rt.z * b, 2.8], i * 4); pB.set([RXS(), 0.5 + 0.05 * i, yaw, 0], i * 4); });
      const sm3 = new THREE.Mesh(instanced(sgBase, { iA: pA, iB: pB }, AP_SEATS.length), new THREE.ShaderMaterial({ uniforms: sm.material.uniforms, vertexShader: APSHARK_VERT, fragmentShader: APSHARK_FRAG, transparent: true, depthWrite: false }));
      sm3.frustumCulled = false; sm3.renderOrder = 2; sm3.name = 'approach-sharks'; plate.add(sm3);
    }
    { // The exit portal stands 350 m ahead under the lagoon lip. The rip sheet is see-through and writes no depth, and the
      // sea disc is cut away under it, so during the skim a ray that left the lens through the sheet ran on under the
      // surface to the portal's rim, which showed as a small white hoop on the horizon. A depth-only screen stands just in
      // front of the whole of the engine's halo plane (22 m below the surface to 11 m above it), in `above`, so only while
      // the lens is in the air: it writes no colour, is drawn after everything of the world's own and before the halo.
      const occ = new THREE.Mesh(new THREE.PlaneGeometry(84, 34), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true, side: THREE.DoubleSide, fog: false }));
      occ.position.set(seat.x, -6, seat.z + 9.5); occ.renderOrder = 5.5; occ.frustumCulled = false; occ.name = 'glow-screen'; above.add(occ);
    }
    if (LK.squall) { // one squall: a grey rain curtain on the far rim, dragging its shadow over the lagoon
      const q = atoll.toPlate(AT.R0 * R.range(2.35, 2.8) * (R.chance(0.5) ? 1 : -1), 120);
      const cur = new THREE.Mesh(new THREE.PlaneGeometry(1900, 1000, 1, 1), new THREE.ShaderMaterial({ uniforms: { uPlate: seaU.uPlate, uLit: seaU.uLit }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: NOISE_GLSL + /* glsl */`
uniform vec4 uPlate; uniform vec3 uLit; varying vec2 vUv;
void main(){
  float t = uPlate.w; vec2 p = vUv;
  float n = aFbm(p * vec2(7., 4.) + vec2(t * .008, 0.)), n2 = aNoise(p * vec2(23., 14.) - t * .015);
  float bell = pow(max(sin(3.14159 * clamp(p.x, 0., 1.)), 0.), .7);
  float top = .50 + .36 * bell + .10 * (n - .5) + .03 * n2;
  float base = .40 + .03 * sin(p.x * 9.) + .04 * (aNoise(p * vec2(5., 2.) + 3.) - .5);
  float sx = p.x + .06 * (n - .5);
  float cloud = smoothstep(base - .03, base + .04, p.y) * (1. - smoothstep(top - .06, top + .01, p.y)) * smoothstep(.04, .2, sx) * (1.0 - smoothstep(.8, .96, sx));
  float h01 = clamp((p.y - base) / max(top - base, .05), 0., 1.);
  vec3 cc = mix(vec3(.09, .12, .18), vec3(.80, .83, .88), smoothstep(.15, .85, h01 + .25 * (n - .5) + .1 * (n2 - .5))) * uLit;
  float streak = .62 + .38 * aNoise(vec2(p.x * 95. + p.y * 12., p.y * 2.5 + t * .5));
  float veil = (1. - smoothstep(base - .02, base + .03, p.y)) * smoothstep(.12, .4, p.x) * (1.0 - smoothstep(.6, .88, p.x)) * mix(.5, .9, smoothstep(0., base, p.y)) * streak * smoothstep(-.01, .06, p.y);
  gl_FragColor = vec4(mix(vec3(.17, .23, .31) * uLit, cc, cloud), max(cloud * .97, veil));
}` }));
      cur.position.set(q[0], 495, q[1]); cur.lookAt(P.x, 495, P.z); cur.renderOrder = 1; cur.name = 'squall'; plate.add(cur);
      seaU.uSquall.value.set(q[0] - (q[0] - AT.cx) * 0.25, q[1] - (q[1] - AT.cz) * 0.25, 680, 1);
    }
    await ctx.yield();

    // ---- birds: terns we fall through, noddies round the beacon, frigatebirds hanging high
    const hex = (c) => '#' + c.getHexString();
    // (sixth polish pass) the birds are shaded and marked, not flat cut-outs. Terns: grey mantle, pale trailing edge, black
    // wing tips and cap, orange bill. Frigatebirds: dark chocolate, not black (see FRIG below).
    // And for both a patch of the kit's lit fragment shader (text replaced before the first compile; skipped if the kit's
    // text ever changes): the upper wing takes the light and the underside is darker, the sea's light fills the underside
    // so its form shows from below, and the low sun lays a warm rim along every edge turned from the lens.
    const TERN = { body: '#eef0ec', belly: '#f6f7f6', wingC: '#8e97a5', trail: '#e8ebee', tip: '#22252b', head: '#1d1f24', neckC: '#f2f3f1', beak: '#e8862c', rim: 0.6 };
    // THE FRIGATEBIRD is a frigatebird: dark chocolate all over, a small off-white breast patch painted in the shader, a
    // long pale hooked bill; and its shape is the kit's own bird given a frigatebird's proportions through the palette
    // (which the kit copies over the species' preset): long narrow wings bent at the wrist and drawn to a point, no
    // fingers, a slim body, a deeply forked tail. Like every bird here its underside takes the lagoon's mint bounce (the
    // brief's light); on a dark bird that is a green-grey cast under the wings and body, never a pale ball.
    const FRIG = { body: '#4a393c', belly: '#5c4a4c', wingC: '#3f3136', trail: '#57464c', tip: '#231c20', tailC: '#2b2327', head: '#33282b', neckC: '#33282b', beak: '#c3bcae', rim: 0.9,
      palette: { wing: 'gull', fingers: 0, fork: 1, tail: 0.44, tailW: 0.17, girth: 0.118, span: 1.14, chord: 0.36, beakLen: 0.2 } };
    const shadeBird = (fl, kind) => {
      const m = fl.material, a = 'vec3 alb = vColor;', b = 'gl_FragColor = vec4(c, uOpacity);', frig = kind === 'frig', under = frig ? '.74' : '.60', rimK = frig ? '1.5' : '.9';
      const mark = frig ? ` float brK = (1. - vThin) * (1. - upF) * smoothstep(.02, .10, vLocal.z) * (1. - smoothstep(.20, .30, vLocal.z)); alb = mix(alb, vec3(.70, .66, .58), brK * .85);` : '';
      const fill = `alb * uGroundColor * ((1. - upF) * ${frig ? '.8' : '.45'} * .3183)`;
      if (m.fragmentShader.includes(a) && m.fragmentShader.includes(b)) m.fragmentShader = m.fragmentShader
        .replace(a, a + ` float upF = smoothstep(-.35, .35, N.y); alb *= mix(1., mix(${under}, 1.1, upF), vThin);` + mark)
        .replace(b, `{ float rimF = pow(clamp(1. - abs(dot(N, V)), 0., 1.), 2.2); c += uSunColor * (.12 + .6 * alb) * (rimF * ${rimK} * .3183) + ${fill}; }\n  ` + b);
      return fl;
    };
    const airLight = { sunDir: sunDirW.clone(), sunColor: LK.sun, sunIntensity: 1.75 * LK.sunK, sky: hex(skyZen.clone().lerp(skyHor, 0.5)), skyIntensity: 1.0, ground: hex(mint), groundIntensity: 0.7 };
    const faunaAir = F.makeFauna(scene, { light: airLight });
    await ctx.yield();
    faunaAir.add(shadeBird(F.makeFlock({ rng: R, species: 'gulls', count: Math.round(44 * dens), size: 1.35, ...TERN, spread: [18, 7, 44],
      cross: { path, u: K0 + 0.055, lead: 13, span: 190, angle: 50, side: 1, height: -1.5, duration: DURATION } }), 'tern'));
    await ctx.yield();
    faunaAir.add(F.makeFlock({ rng: R, species: 'crows', count: Math.round(26 * dens), size: 1.0, body: '#15171b', wingC: '#1d2026', center: [beaconAt.x, 13, beaconAt.z], radius: 42, height: 8 }));
    await ctx.yield();
    faunaAir.add(shadeBird(F.makeFlock({ rng: R, species: 'eagles', count: 8, size: 2.3, ...FRIG, center: [P.x + d1.x * 30, 110.5, P.z + d1.z * 30], height: 6, spread: [150, 26, 150], soarRadius: 34 }), 'frig'));
    await ctx.yield();
    // the opening's own birds (RX): three frigatebirds wheeling 40-70 m ahead of the entry, 9 to 32 m above eye height, against
    // the sky, and seven white terns keeping pace low over the dark sea on the starboard bow for the first seconds.
    // (flock cure: both soars stand over the whole flown line by place, on every deal: centre - 1.5 x the loop's height (what its
    // spline can dip) - the deal's fall (spread y) - soarLift - a bird's half span is 2.3 m above the line's top, 64 m)
    { const c = air(62, -8, 0);
      faunaAir.add(shadeBird(F.makeFlock({ rng: RX, species: 'eagles', count: 3, size: 2.7, ...FRIG, center: [c.x, 84.5, c.z], radius: 10, height: 3, spread: [46, 7, 26], soarRadius: 15, soarLift: 3 }), 'frig'));
      await ctx.yield();
      faunaAir.add(shadeBird(F.makeFlock({ rng: RX, species: 'gulls', count: 7, size: 1.7, ...TERN, spread: [9, 2.5, 9], maxSigma: 3, wander: [1.1, 1.0, 0.7, 0.35],
        along: { path, side: 11, up: -8.2, lead: 27, from: -0.05, to: K0 + 0.03 } }), 'tern'));   // (8.2 m below our line and 11 m to starboard: low over the sea, as the design has them; flock cure: at three scatters, held by maxSigma, with its own wander, no bird's reach rises within 2.3 m of the lens)
      await ctx.yield();
      // a dozen large white terns cross the bow from port four seconds in, 17 m ahead and a little below the lens, against
      // the dark sea and the ring: far off to one side in the opening view, bright and near in the next.
      // (flock cure: the kit's keepClear then moves the whole course bodily, by the deal 3 to 11 m and mostly upward, until
      // no bird's reach comes within 2.3 m of the flown line by place; no body of this flock exists past u 0.3)
      faunaAir.add(shadeBird(F.makeFlock({ rng: RX2, species: 'gulls', count: 12, size: 2.0, ...TERN, spread: [10, 3, 22], maxSigma: 3, wander: [1.1, 1.0, 0.7, 0.35], keepClear: { path, dist: 2.3, step: 2, to: 0.3 },
        cross: { path, u: 0.10, lead: 17, span: 170, angle: 62, side: -1, height: -3.5, duration: DURATION } }), 'tern'));
      await ctx.yield(); }
    // (fourth polish pass, RX4) one frigatebird glides down the entry with us, keyed to the lens' own progress (a cross
    // route nearly parallel to the path, flown at three quarters of our speed): 12 m ahead and just left of centre as the
    // world opens, 3 m above the lens' line, in the upper third of the frame; we draw up under it and it leaves over the
    // top left corner at u 0.035. The same on every seed (the three above stand 40 to 70 m off and are specks on most).
    // (flock cure: the course is the middle 30 m of the 60 it was, on the same line, so it begins some 7 m ahead of the lens's
    // first place and what a portal preview leaves cannot bring the bird over the lens; the window is shortened in the same
    // measure, so the bird is where it was at every u, until its course ends at u 0.054)
    { faunaAir.add(shadeBird(F.makeFlock({ rng: RX4, species: 'eagles', form: 'vee', count: 1, size: 2.6, speed: 9, ...FRIG, translucency: 0.12, wander: [0.25, 0.2, 0.25, 0.5],
        cross: { path, u: 0.02, lead: 9, span: 30, angle: 20, side: -1, offset: -4, height: 3.3, bow: 0, window: 0.0686 * 30 / 60 } }), 'frig'));
      await ctx.yield(); }
    // THE NOSE-OVER'S OWN BIRDS (third polish pass, RX3). As the nose drops, three large white terns in close echelon cut
    // across the bow from port, 7 to 11 m ahead of the lens and some 6 m below it (flock cure: 4 m lower than they flew, so
    // that no bird's reach comes within 2.3 m of the lens): at u 0.08 they hang against the mint of
    // the lagoon, the nearest some 12 m off. They fly fast and 68 degrees off our
    // course, so they come into the picture after u 0.055 (none stands half in the frame in the opening seconds) and
    // are out to starboard by u 0.10.
    faunaAir.add(shadeBird(F.makeFlock({ rng: RX3, species: 'gulls', form: 'vee', count: 3, size: 1.9, speed: 17, spacing: 4.3, wander: [1.1, 1.0, 0.7, 0.45], ...TERN,
      cross: { path, u: 0.083, lead: 10.5, span: 120, angle: 68, side: 1, height: -3, offset: 4.5, bow: 0, duration: DURATION } }), 'tern'));   // (span 120 at 17 m/s: the route begins after u = 0, so the kit's portal-preview loop never offsets it)
    await ctx.yield();
    // THE FLOCK'S NEAR BIRDS (RXN, a stream of their own: pass-flock-near). Three large white terns in close echelon fly
    // inside the flock we fall through (the tern flock above, search "spread: [18, 7, 44]"), on the flock's own crossing
    // of our line: the same u, the same angle and side and the same span, so the same course over the sea. They cross
    // the line 16.5 m beyond the point of it the crossing is timed for (the flock's first birds 13 m beyond it, the rest
    // strung out 44 m behind those), at one height inside the flock's slab, drawn once: the flock's -1.5 m, give or take
    // half its 7 m spread. At 17 m/s to the flock's 12 they come up through it from astern and are 3.5 m ahead of its first
    // birds as it crosses our line (flock cure: 6 m farther along the line than they crossed it, so that no bird's reach
    // comes within 2.3 m of the lens at any height drawn). The kit times a route from its length and the birds' speed: this one, 192 m long, begins
    // where the flight is at u 0.06, after the world has opened, so the span is the flock's own 190 m, not shortened
    // (the kit's portal-preview loop never offsets it).
    { const RXN = makeRng('pass-flock-near:' + (ctx.seed ?? 0)), nearH = -1.5 + RXN.range(-3.5, 3.5);
      faunaAir.add(shadeBird(F.makeFlock({ rng: RXN, species: 'gulls', form: 'vee', count: 3, size: 1.9, speed: 17, spacing: 4.3, wander: [1.1, 1.0, 0.7, 0.45], ...TERN,
        cross: { path, u: K0 + 0.055, lead: 16.5, span: 190, angle: 50, side: 1, height: nearH, duration: DURATION } }), 'tern'));
      await ctx.yield(); }
    // CLOUD WISPS AT ARM'S LENGTH (third polish pass): four ragged scraps of cloud stand beside the line of the fall, each
    // some 9 m off the lens' own line, so each slides out past a corner of the frame as a pale ragged veil as we drop by
    // it: lower left first, then right, right, left. They are world-fixed billboards (soft stranded fbm, no texture),
    // seen only while their centre is within 16 m (never a blob ahead), and lie outside the plate group: real metres, real parallax.
    const wispMat = new THREE.ShaderMaterial({ uniforms: { uWispT: { value: 0 }, uWispLit: { value: col('#ffffff').lerp(sunCol, 0.3).multiplyScalar(0.84) },
      uWispSh: { value: hazeCol.clone().lerp(col('#ffffff'), 0.35).multiplyScalar(0.7) } }, vertexShader: WISP_VERT, fragmentShader: WISP_FRAG, transparent: true, depthWrite: false });
    { const wp = [], wc = [], ws = [], wi = [], cam = V3(0, 0, 0);
      [[0.066, -8.8, -4.6, 6.2, 4.0, 24], [0.105, 9.0, -4.6, 6.0, 3.8, 27], [0.131, 9.2, -3.2, 6.2, 3.6, 19], [0.152, -9.0, -4.4, 6.0, 3.8, 15]].forEach(([uw, X, Y, hw, hh, pit], i) => {
        path.pointAt(uw, cam);
        const hx = P.x - cam.x, hz = P.z - cam.z, hl = Math.hypot(hx, hz) || 1, cp = Math.cos(pit * 0.01745), sp = Math.sin(pit * 0.01745);
        const f = V3((hx / hl) * cp, -sp, (hz / hl) * cp), rt = V3(-hz / hl, 0, hx / hl), up = V3().crossVectors(rt, f);
        const c = cam.clone().addScaledVector(f, 7).addScaledVector(rt, X).addScaledVector(up, Y), k = wp.length / 3;
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { wp.push(a, b, 0); wc.push(c.x, c.y, c.z); ws.push(hw, hh, i * 0.37 + 0.11); }
        wi.push(k, k + 1, k + 2, k, k + 2, k + 3);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(wc, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(ws, 3)); g.setIndex(wi);
      const wisps = new THREE.Mesh(g, wispMat); wisps.frustumCulled = false; wisps.renderOrder = 3; wisps.name = 'cloud-wisps'; above.add(wisps); }
    await ctx.yield();
    // RARE: six bottlenose dolphins porpoising in the standing waves, three on each bow, 6 to 12 m ahead of the lens, in long
    // low arcs (apex about 2.2 m, bodies pitched under 30 degrees). The kit strings a pod out behind its leader (toward the
    // lens, so the followers were seen end-on); here each pod is strung out AHEAD of its leader: the leader 6 m ahead and
    // 4.4 m off the lens' line, the second 9 m ahead at 4.2 m, the third 12 m ahead at 7.6 m, so each is seen from the rear
    // quarter, 25 to 36 degrees off its tail. A fan of spray stands where each one breaks the surface and where it falls
    // back. The kit's dolphin is a smooth grey body, so its fragment shader is given a few lines here, before it is first
    // compiled (eighth pass: the animal is painted as a bottlenose): a dark cape over the back with a clean lower edge
    // that dips behind the eye, a mid-grey flank, a pale belly and lower jaw, the crease between melon and beak, a dark
    // eye patch, darker flukes and fins, and a wet line of sky along the back; below the surface the animal takes the
    // water's colour with depth, and reads as under the sheet instead of lying on it. The kit's model has a short beak
    // (the last tenth of the body) and no option for a longer one: it is painted, not rebuilt.
    const pods = [], sprayOf = [], podPh0 = makeRng('pass-dolphins:' + (ctx.seed ?? 0))();
    if (cast.dolphins) for (const sd of [-1, 1]) {
      const pod = faunaAir.add(F.makeDolphins({ rng: R, count: 3, level: 0, light: airLight, length: 3.2, top: '#44586c', belly: '#eef1f0', fin: '#34475a', leapHeight: 2.6, leapPeriod: 3.4, speed: 11.5, spread: [2.4, 0, 1.9],
        along: { path, side: sd * 4.4, up: -3.5, lead: 6, from: K1 - 0.012, to: uDive - 0.01 } }));   // (they are gone before the dive)
      pod.uniforms.uLeap.value.z = 0.12;      // more of each arc above the water than the kit's 0.42
      // the kit draws each animal's leap phase (iA.w + iB.z) and its place in the pod (iA.x, iB.w: world x and z) at random,
      // so a pod can be all under water for a second, or two animals can leap through each other. Here the three leap a
      // third of a cycle apart and swim in echelon: the leader nearest, each follower 3 m further ahead, so one or two of
      // each pod are always in the air through the design's skim (14 to 17 s, most of a leap cycle). Where in its cycle a
      // pod is at any moment comes from the pod's own seed (podPh), the two pods a twelfth of a cycle apart.
      { const gA = pod.geometry && pod.geometry.attributes.iA, gB = pod.geometry && pod.geometry.attributes.iB, podPh = podPh0 + (sd > 0 ? 1 / 12 : 0);
        if (gA && gB) {
          for (let i = 0; i < gA.count; i++) {
            const lat = sd * [0, -0.2, 3.2][i % 3];      // metres to the pod's outer side (along Rt)
            gA.setW(i, i / gA.count + podPh - gB.getZ(i)); gA.setX(i, Rt.x * lat); gB.setW(i, Rt.z * lat); gA.setZ(i, -3 * i);
            sprayOf.push({ pod, lag: -3 * i, ox: Rt.x * lat, oz: Rt.z * lat, ph: i / gA.count + podPh });
          }
          gA.needsUpdate = true; gB.needsUpdate = true;
        } }
      const dm = pod.material, hook = 'gl_FragColor = vec4(c, uOpacity);';
      const skin = 'vec3 alb = vColor;';
      if (dm && typeof dm.fragmentShader === 'string' && dm.fragmentShader.includes(hook) && dm.fragmentShader.includes('vWorld') && dm.fragmentShader.includes(skin) && dm.fragmentShader.includes('vLocal')) {
        // (vLocal is the kit's own model space: metres, nose at +z, the body 3.2 m long)
        dm.fragmentShader = dm.fragmentShader.replace(skin, skin + ` { float dz = vLocal.z / 3.2, dy = vLocal.y / 3.2, dx = abs(vLocal.x) / 3.2, body = 1. - vThin;
    float capeY = .030 - .034 * smoothstep(.16, .34, dz) * (1. - smoothstep(.34, .42, dz)) + .012 * sin(dz * 9. + 1.);
    float cape = smoothstep(capeY, capeY + .012, dy), bellyK = 1. - smoothstep(-.050, -.022, dy + .02 * smoothstep(.30, .45, dz));
    alb = mix(alb, vec3(.105, .135, .175), cape * .86 * body);
    float finK = clamp(smoothstep(.074, .082, dx) * step(dy, -.035) + step(dy, -.100) + step(dz, -.44) * smoothstep(.015, .035, dx), 0., 1.);   // flippers and flukes
    alb = mix(alb, vec3(.86, .88, .88), bellyK * .8 * body * (1. - finK));
    alb = mix(alb, vec3(.115, .145, .185), finK * .85);
    alb *= 1. - .55 * body * (1. - smoothstep(.003, .010, abs(dz - .405 - .25 * dy))) * step(dy, .03);
    alb = mix(alb, vec3(.03, .035, .04), body * (1. - smoothstep(.010, .022, length(vec2(dz - .355, (dy - .004) * 1.6)))) * step(.03, dx) * .85);
 }`)
          .replace(hook, 'c += uSkyColor * (.20 * (1. - vThin) * pow(clamp(N.y, 0., 1.), 10.) * smoothstep(-.2, .3, vWorld.y)); c = mix(c, vec3(.04, .30, .46) * (uSkyColor + uSunColor * .25) * .5, .7 * (1. - smoothstep(-1.5, .15, vWorld.y))); ' + hook);
      }
      pods.push(pod); await ctx.yield();
    }
    const sprayU = { uSpl: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 0, -1)) }, uCol: C3(seaU.uFoam.value.clone().multiply(seaU.uLit.value)) };
    if (sprayOf.length) {
      const q = [], ix = [];
      for (let b = 0; b < 12; b++) { const o = q.length / 3; q.push(-1, 0, b, 1, 0, b, 1, 1, b, -1, 1, b); ix.push(o, o + 1, o + 2, o, o + 2, o + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(48 * 3), 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3)); g.setIndex(ix);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: sprayU, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 6; m.name = 'dolphin-spray'; above.add(m); await ctx.yield();
    }

    // ================================================================= BELOW WATER
    const below = new THREE.Group(); below.name = 'below-water'; below.visible = false; scene.add(below);
    below.add(hero.object);
    // ---- the canyon: a cross-section lofted along a centreline, in the hero's local frame (floor 0, surface 30)
    const head = HA.coralHead.position, seatL = HA.portalSeat.position;
    const clPts = [along(-90, 0), along(-40, 0), V3(P.x, 0, P.z), along(40, 0), V3(B.x, 0, B.z), V3(1, 0, 70), V3(1, 0, 40), V3(2, 0, 0), V3(4, 0, -40), V3(5.5, 0, -64),
      V3(3, 0, -90), V3(-2, 0, -115), V3(-4, 0, -135), V3(-4, 0, -186), V3(-4, 0, -252)];
    const cl = new THREE.CatmullRomCurve3(clPts, false, 'centripetal'), clLen = cl.getLength(), NS = Math.round(clLen / 2.0);
    const hwOf = (zc) => zc >= 90 ? 13 : zc >= 62 ? 13 + 34.5 * sstep(90, 62, zc) : zc >= -42 ? 47.5 : zc >= -62 ? 47.5 - 27.5 * sstep(-42, -62, zc) : 20 + 55 * sstep(-140, -200, zc);
    const floorOf = (zc) => zc > -78 ? 0 : zc > -112 ? -8 * sstep(-78, -112, zc) : zc > -128 ? -8 : zc > -186 ? -8 + (-128 - zc) / 58 * 21 : 13;
    const rimOf = (zc) => 24 - 7 * sstep(-150, -210, zc);
    const stations = [];
    { let sB = 0, best = 1e9; const tmp = V3(0, 0, 0);
      for (let i = 0; i <= NS; i++) { cl.getPointAt(i / NS, tmp); const dd = Math.hypot(tmp.x - B.x, tmp.z - B.z); if (dd < best) { best = dd; sB = i; } }
      for (let i = 0; i <= NS; i++) {
        const c = cl.getPointAt(i / NS), t = cl.getTangentAt(i / NS), zc = i < sB ? 96 + (sB - i) * (clLen / NS) : Math.min(c.z, 96);
        stations.push({ c, t, nx: -t.z, nz: t.x, s: (i / NS) * clLen, zc, hw: hwOf(zc), fl: floorOf(zc), rim: rimOf(zc) });
      } }
    // lateral position of the wall face at height fraction v on side sg (+1 = the camera's right)
    const wallL = (st, sg, v) => {
      const butt = 4.6 * (noise.ridged2(st.s * 0.045 + sg * 37, v * 0.55 + 3, 3) - 0.42) * (0.55 + 0.45 * v) + 1.3 * noise.n3(st.s * 0.21, v * 3.1, sg * 9);
      const fine = 0.9 * noise.n3(st.s * 0.55, v * 6.5, sg * 5.1) + 0.35 * noise.n3(st.s * 1.3, v * 14, sg * 2.2);
      // the amphitheatre's walls (47 m from the lens: they must read as rock from there): bays up to 6 m deep between
      // standing buttresses, deepest at the rim so its line is scalloped, and an overhung ledge under the rim
      const amph = sstep(92, 66, st.zc) * sstep(-58, -40, st.zc);
      const bay = amph * 6.0 * sstep(-0.15, 0.55, noise.n2(st.s * 0.06 + sg * 71.3, 4.4 + v * 0.35)) * (0.45 + 0.55 * v);
      const ledge = amph * 1.7 * Math.exp(-(((v - 0.84) / 0.085) ** 2)) * (0.55 + 0.45 * noise.n2(st.s * 0.09 + sg * 13.1, 8.8));
      const l = st.hw - 3 * (1 - v) * (1 - v) + 1.4 * Math.sin(Math.PI * v) + 0.9 * sstep(0.55, 0.63, v) + butt + fine + bay - ledge;
      return [Math.max(l, 9), butt + fine * 1.4 + bay * 0.55 - ledge * 0.8];
    };
    const wallPoint = (st, sg, v, inset = 0) => { const l = wallL(st, sg, v)[0] - inset; return V3(st.c.x + st.nx * sg * l, st.fl + (st.rim - st.fl) * v, st.c.z + st.nz * sg * l); };
    const floorY = (x, z, st) => {
      let y = st.fl + 0.45 * noise.fbm2(x * 0.045, z * 0.045, 3) + 0.15 * noise.n2(x * 0.2, z * 0.2);
      const dh = Math.hypot(x - head.x, z - head.z), dp = Math.hypot(x - seatL.x, z - seatL.z);
      y -= 0.9 * sstep(13, 6, dh) * sstep(2.5, 5.5, dh) + 0.9 * sstep(12, 8.5, dp) * sstep(3.5, 6.5, dp);
      return y;
    };
    let W = makeWriter(); const cc = new THREE.Color();
    const flush = async (name) => { const m = new THREE.Mesh(await W.buildAsync(ctx), hero.rockMaterial); m.name = name; m.frustumCulled = false; hero.object.add(m); W = makeWriter(); return m; };
    const cSand = col(PALETTE[4]).lerp(col(PALETTE[3]), 0.3).multiplyScalar(0.62), cRock = col('#8f8078'), cOchre = col('#DC9A46'), cOlive = col('#8F8A5A'), cRose = col('#D48A88'), cTop = cOchre.clone().lerp(cOlive, 0.4);
    {
      const NF = 6, NW = 16, PL = [2, 6, 13, 24, 38], rows = [];
      let stN = 0;
      for (const st of stations) {
        if (++stN % 3 === 0) await ctx.yield();
        const row = [];
        const put = (l, y, c, ao, m) => row.push(W.v(st.c.x + st.nx * l, y, st.c.z + st.nz * l, c, ao, m));
        for (const sg of [-1, 1]) {
          const half = [];
          const rimEdge = wallL(st, sg, 1)[0];
          for (let j = 0; j <= NF; j++) {       // floor, centre -> wall foot
            if (sg > 0 && j === 0) continue;
            const l = (st.hw - 3) * (j / NF) * sg, x = st.c.x + st.nx * l, z = st.c.z + st.nz * l;
            cc.copy(cSand).multiplyScalar(0.92 + 0.14 * noise.n2(x * 0.07 + 9, z * 0.07));
            half.push([l, floorY(x, z, st), cc.clone(), 0.72 + 0.28 * (1 - j / NF), 0]);
          }
          for (let j = 1; j <= NW; j++) {       // wall, foot -> rim
            // crust in broad soft bands: olive low on the face, ochre and dusty rose toward the sunlit rim
            const v = j / NW, [lw, butt] = wallL(st, sg, v), band = noise.n2(v * 2.4 + st.s * 0.011, sg * 5.3 + st.s * 0.004), band2 = noise.n2(st.s * 0.014 + sg * 11.7, v * 2.1 + 40);
            const warm = sstep(0.4, 0.82, v + 0.2 * band);
            cc.copy(cOlive).lerp(cOchre, sstep(-0.3, 0.35, band) * (0.3 + 0.7 * warm)).lerp(cRose, sstep(0.0, 0.5, band2) * (0.2 + 0.55 * warm));
            cc.lerpColors(cRock, cc, 0.68 + 0.22 * warm).multiplyScalar((0.76 + 0.3 * v) * (1 - 0.18 * sstep(0.3, 2.2, butt)));
            half.push([lw * sg, st.fl + (st.rim - st.fl) * v + 0.5 * noise.n2(st.s * 0.11, v * 7 + sg), cc.clone(), (0.5 + 0.5 * v) * (1 - 0.45 * sstep(0.3, 2.4, butt)), 1]);
          }
          for (let j = 0; j < PL.length; j++) { // reef top
            const l = (rimEdge + PL[j]) * sg, x = st.c.x + st.nx * l, z = st.c.z + st.nz * l;
            cc.copy(cTop).lerp(cRose, 0.3 * (noise.n2(x * 0.05, z * 0.05) + 0.5)).multiplyScalar(0.9 + 0.2 * noise.n2(x * 0.13, z * 0.13));
            half.push([l, st.rim + 0.6 + 1.6 * sstep(0, 30, PL[j]) + 0.8 * noise.fbm2(x * 0.06, z * 0.06, 2), cc.clone(), 1, 1]);
          }
          if (sg < 0) half.reverse();
          for (const h of half) put(h[0], h[1], h[2], h[3], h[4]);
        }
        rows.push(row);
      }
      await ctx.yield();
      for (let i = 0; i < rows.length - 1; i++) { if (i % 64 === 63) await ctx.yield(); for (let j = 0; j < rows[i].length - 1; j++) W.quad(rows[i][j], rows[i + 1][j], rows[i + 1][j + 1], rows[i][j + 1]); }
    }
    await ctx.yield();
    await flush('canyon');
    await ctx.yield();
    // table corals shelving out of the walls, talus boulders at their feet and a rubble ring round the portal's foot
    const stIn = (z0, z1) => stations.filter((s) => s.zc <= z0 && s.zc >= z1);
    const canyonSt = stIn(150, 64).concat(stIn(-48, -150)), allSt = stIn(152, -175);
    // a table coral: one to three ribbed dishes on a stalk, each with a pale growing rim, a thick lip and a dark underside
    const pale = col('#d8dcd4');
    let RR = R;   // the random stream plate1() and boulder() draw from: R, or RX while the polish pass builds its reef
    const plate1 = (o, a, Rr, tint, tiers = 1) => {
      for (let k = 0; k < tiers; k++) {
        const Rk = Rr * (1 - 0.2 * k), ox = o.x + (k ? RR.range(-0.3, 0.3) * Rr : 0), oz = o.z + (k ? RR.range(-0.3, 0.3) * Rr : 0), oy = o.y + k * RR.range(0.24, 0.36);
        const seg = 12, tiltA = a + RR.range(-0.6, 0.6), tilt = RR.range(0.02, 0.15), ph = RR.range(0, 6.28), hgt = (x, z) => -(x * Math.cos(tiltA) + z * Math.sin(tiltA)) * tilt;
        const mid = W.v(ox, oy - 0.12, oz, cc.copy(tint).multiplyScalar(0.6), 0.8, 2);
        const foot = W.v(k ? ox : ox - Math.cos(a) * Rk * 0.5, oy - (k ? 0.4 : 0.55), k ? oz : oz - Math.sin(a) * Rk * 0.5, cc.copy(tint).multiplyScalar(0.4), 0.4, 2);
        const r1 = [], r2 = [], r3 = [], r4 = [];
        for (let i = 0; i < seg; i++) {
          const b = (i / seg) * Math.PI * 2, rib = i % 2 ? 0.64 : 1, dy = i % 2 ? -0.03 : 0.03;
          const rr = Rk * (0.88 + 0.09 * Math.sin(b * 3 + ph) + 0.06 * Math.sin(b * 5 - ph * 2)), x1 = Math.cos(b) * rr * 0.5, z1 = Math.sin(b) * rr * 0.5, x2 = Math.cos(b) * rr, z2 = Math.sin(b) * rr;
          r1.push(W.v(ox + x1, oy - 0.04 + dy * 0.6 + hgt(x1, z1), oz + z1, cc.copy(tint).multiplyScalar(0.84 * rib), 0.92, 2));
          r2.push(W.v(ox + x2, oy + 0.05 + dy + hgt(x2, z2), oz + z2, cc.copy(tint).lerp(pale, 0.3).multiplyScalar(rib), 1, 2));
          r3.push(W.v(ox + x2 * 0.97, oy - 0.09 + hgt(x2, z2), oz + z2 * 0.97, cc.copy(tint).multiplyScalar(0.5), 0.6, 2));
          r4.push(W.v(ox + x2 * 0.28, oy - 0.2 + hgt(x2, z2) * 0.28, oz + z2 * 0.28, cc.copy(tint).multiplyScalar(0.36), 0.38, 2));
        }
        for (let i = 0; i < seg; i++) { const i1 = (i + 1) % seg; W.tri(mid, r1[i1], r1[i]); W.quad(r1[i], r1[i1], r2[i1], r2[i]); W.quad(r2[i], r2[i1], r3[i1], r3[i]); W.quad(r3[i], r3[i1], r4[i1], r4[i]); W.tri(r4[i], r4[i1], foot); }
      }
    };
    // a boulder (rock) or, with a tint, a mound coral colony (material 3: the shader paints its polyps), shaded at its base
    const boulder = (x, y, z, s, tint = null, fine = false) => {   // fine: the large domes that stand near the lens (no faceted outline)
      const nu = fine ? 16 : tint ? 9 : 7, nv = fine ? 8 : tint ? 5 : 4, rr = [], ph = RR.range(0, 9), sq = tint ? RR.range(0.7, 1.0) : RR.range(0.5, 0.9), mt = tint ? 3 : 1, lump = tint ? 0.2 : 0.12;
      if (tint) cc.copy(tint); else cc.copy(cRock).lerp(RR.chance(0.4) ? cRose : cTop, RR.range(0.1, 0.5)).multiplyScalar(RR.range(0.6, 1.05));
      const c0 = cc.clone();
      for (let j = 0; j <= nv; j++) { const row = [], la = (j / nv) * Math.PI;
        for (let i = 0; i < nu; i++) { const lo = (i / nu) * Math.PI * 2, bump = 0.78 + 0.3 * Math.sin(lo * 2 + ph + j) + 0.16 * Math.sin(lo * 3 - ph * 2 + j * 1.7) + lump * Math.sin(lo * 5 + ph * 3) * Math.sin(la * 4 + ph), sr = Math.sin(la) * s * bump;
          const base = sstep(-0.75, 0.35, Math.cos(la));
          row.push(W.v(x + Math.cos(lo) * sr * 1.3, y + s * 0.2 + Math.cos(la) * s * sq, z + Math.sin(lo) * sr, cc.copy(c0).multiplyScalar(0.62 + 0.38 * base), (0.34 + 0.66 * base) * (0.8 + 0.25 * bump), mt)); }
        rr.push(row); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const i1 = (i + 1) % nu; W.quad(rr[j][i], rr[j][i1], rr[j + 1][i1], rr[j + 1][i]); }
    };
    const sandy = col('#b9aca0'), plateTints = [cOchre, cOlive, cRose, cOchre.clone().lerp(cRose, 0.5)];
    for (let i = 0; i < 112; i++) {
      if (i % 5 === 4) await ctx.yield();
      const st = R.pick(R.chance(0.75) ? canyonSt : allSt), sg = R.chance(0.5) ? 1 : -1, v = R.range(0.06, 0.6), Rr = R.range(0.6, 1.4);
      const o = wallPoint(st, sg, v, Rr * 0.5); o.y += R.range(0.15, 0.4);
      plate1(o, Math.atan2(-st.nz * sg, -st.nx * sg), Rr, sandy.clone().lerp(R.pick(plateTints), R.range(0.35, 0.7)).multiplyScalar(R.range(0.8, 1.05)), R.int(1, 3));
    }
    for (let i = 0; i < 54; i++) { if (i % 9 === 0) await ctx.yield(); const st = R.pick(allSt), sg = R.chance(0.5) ? 1 : -1, p = wallPoint(st, sg, 0, R.range(0.5, 4)); boulder(p.x, floorY(p.x, p.z, st), p.z, R.range(0.3, 1.0)); }
    await ctx.yield();
    const moundTints = [col('#C0903E'), col('#8B9A62'), col('#C4787E'), col('#A8A060'), col('#C67E52')];
    for (let i = 0; i < 100; i++) {   // mound and lobe corals in touching groups, breaking the wall's outline
      if (i % 5 === 4) await ctx.yield();
      const st = R.pick(R.chance(0.7) ? canyonSt : allSt), sg = R.chance(0.5) ? 1 : -1, v = R.range(0.04, 1), tint = R.pick(moundTints), m = R.int(2, 4);
      for (let j = 0; j < m; j++) { const sz = R.range(0.45, 1.5) * (j ? 0.7 : 1), p = wallPoint(st, sg, clamp(v + R.range(-0.06, 0.06), 0.02, 1), R.range(0.0, 0.5) + sz * 0.3);
        boulder(p.x + R.range(-1.2, 1.2) * j, p.y - sz * 0.2, p.z + R.range(-1.2, 1.2) * j, sz, cc.copy(tint).multiplyScalar(R.range(0.85, 1.1)).clone()); }
    }
    await ctx.yield();
    await flush('canyon-corals');
    await ctx.yield();
    const stAtZ = (z) => stations.reduce((a, q) => (q.zc <= 96 && Math.abs(q.c.z - z) < Math.abs(a.c.z - z) ? q : a), stations[stations.length - 1]);
    const bommies = [];
    // fan-topped bommies breaking up the amphitheatre's sand: seven close under the path (8-14 m aside), the rest scattered
    for (let i = 0; i < 25; i++) {
      await ctx.yield();
      const close = i < 7, x = (R.chance(0.5) ? 1 : -1) * (close ? R.range(8.5, 14) : R.range(8, 40)), z = close ? R.range(20, 84) : R.range(-34, 84), st = stAtZ(z);
      if (Math.hypot(x - head.x, z - head.z) < 15 || Math.abs(x - st.c.x) > st.hw - 9) continue;
      const y = floorY(x, z, st), tint = R.pick(moundTints); bommies.push({ x, y, z, st });
      for (let j = 0; j < 4; j++) boulder(x + R.range(-1.6, 1.6), y - 0.25, z + R.range(-1.6, 1.6), R.range(0.7, 1.9) * (j ? 0.7 : 1), cc.copy(j % 2 ? R.pick(moundTints) : tint).multiplyScalar(R.range(0.85, 1.1)).clone());
      for (let j = 0; j < 2; j++) plate1(V3(x + R.range(-1.5, 1.5), y + R.range(1.0, 2.0), z + R.range(-1.5, 1.5)), R.range(0, 6.28), R.range(0.6, 1.2), sandy.clone().lerp(R.pick(plateTints), 0.55).multiplyScalar(0.9), 2);
      for (let j = 0; j < 5; j++) { const a = R.range(0, 6.28), d = R.range(2.2, 5.2); boulder(x + Math.cos(a) * d, floorY(x + Math.cos(a) * d, z + Math.sin(a) * d, st) - 0.05, z + Math.sin(a) * d, R.range(0.18, 0.5)); }   // rubble apron
    }
    for (let i = 0; i < 8; i++) {   // small fan-topped heads and rubble on the bowl floor and the sand slope, under and beside the path (7 m below it)
      await ctx.yield();
      const z = R.range(-172, -98), x = seatL.x + (R.chance(0.5) ? 1 : -1) * R.range(2.5, 11), st = stAtZ(z), y = floorY(x, z, st), tint = R.pick(moundTints);
      bommies.push({ x, y, z, st });
      for (let j = 0; j < 3; j++) boulder(x + R.range(-1, 1), y - 0.2, z + R.range(-1, 1), R.range(0.5, 1.2) * (j ? 0.7 : 1), cc.copy(j % 2 ? R.pick(moundTints) : tint).multiplyScalar(R.range(0.85, 1.1)).clone());
      plate1(V3(x + R.range(-0.8, 0.8), y + R.range(0.7, 1.2), z + R.range(-0.8, 0.8)), R.range(0, 6.28), R.range(0.5, 0.9), sandy.clone().lerp(R.pick(plateTints), 0.55).multiplyScalar(0.9), 2);
      for (let j = 0; j < 5; j++) { const a = R.range(0, 6.28), d = R.range(1.6, 4.5); boulder(x + Math.cos(a) * d, floorY(x + Math.cos(a) * d, z + Math.sin(a) * d, st) - 0.05, z + Math.sin(a) * d, R.range(0.15, 0.42)); }
    }
    await ctx.yield();
    // the portal's foot: a ragged rubble ring (clumps of mixed sizes, a few coral colonies and dishes among them) round the scour moat
    const lipSt = stations.reduce((a, s) => (Math.abs(s.c.z - seatL.z) < Math.abs(a.c.z - seatL.z) ? s : a), stations[0]);
    const ringBits = [];
    for (let i = 0; i < 15; i++) {
      if (i % 4 === 3) await ctx.yield();
      const a = R.range(0, Math.PI * 2), d = R.range(7.8, 11.5), cx0 = seatL.x + Math.cos(a) * d, cz0 = seatL.z + Math.sin(a) * d * 0.8, m = R.int(1, 4);
      for (let j = 0; j < m; j++) {
        const x = cx0 + R.range(-1.1, 1.1) * j, z = cz0 + R.range(-1.1, 1.1) * j, sz = j ? R.range(0.2, 0.55) : R.range(0.45, 1.25), y = floorY(x, z, lipSt) - 0.1;
        if (R.chance(0.3)) boulder(x, y, z, sz * 0.8, cc.copy(R.pick(moundTints)).multiplyScalar(R.range(0.85, 1.08)).clone()); else boulder(x, y, z, sz);
        if (!j && R.chance(0.45)) plate1(V3(x, y + sz * 1.1, z), a, R.range(0.5, 0.9), sandy.clone().lerp(R.pick(plateTints), 0.55).multiplyScalar(0.9), R.int(1, 2));
        if (!j) ringBits.push({ x, y: y + sz * 0.9, z });
      }
    }
    await ctx.yield();
    await flush('canyon-bommies');
    await ctx.yield();
    // ================================================================= THE AMPHITHEATRE'S WALLS (second polish pass, RX2)
    // The walls the wall of sharks hangs between stand 47 m either side of the lens, so their corals are built large: two
    // dozen groups of mound colonies 1.3-2.6 m across (four in ten on the rim itself, breaking its line) with sea fans
    // 1.5-2.4 m tall on them, and twenty table corals up to 5.6 m across shelving out of the face in tiers.
    const amphSt = stIn(60, -42), amphFans = [];
    RR = RX2;
    for (let i = 0; i < 24; i++) {
      if (i % 3 === 2) await ctx.yield();
      const st = RX2.pick(amphSt), sg = RX2.chance(0.5) ? 1 : -1, onRim = RX2.chance(0.4), v = onRim ? 1 : RX2.range(0.3, 0.9), tint = RX2.pick(moundTints), m = RX2.int(2, 3);
      let top = null;
      for (let j = 0; j < m; j++) {
        const sz = RX2.range(1.3, 2.6) * (j ? 0.7 : 1), p = wallPoint(st, sg, clamp(v + RX2.range(-0.05, 0.05), 0.02, 1), sz * 0.25);
        const bx = p.x + RX2.range(-1.6, 1.6) * j, by = p.y - sz * 0.25 + (onRim ? 0.4 : 0), bz = p.z + RX2.range(-1.6, 1.6) * j;
        boulder(bx, by, bz, sz, cc.copy(tint).multiplyScalar(RX2.range(0.85, 1.1)).clone());
        if (!j) top = V3(bx, by + sz * 1.05, bz);
      }
      if (RX2.chance(0.75)) amphFans.push({ p: top, s: RX2.range(1.5, 2.4), yaw: Math.atan2(st.t.x, st.t.z) + RX2.range(-0.4, 0.4) });
    }
    for (let i = 0; i < 20; i++) {
      if (i % 3 === 2) await ctx.yield();
      const st = RX2.pick(amphSt), sg = RX2.chance(0.5) ? 1 : -1, v = RX2.range(0.25, 0.85), Rr = RX2.range(1.5, 2.8);
      const o = wallPoint(st, sg, v, Rr * 0.55); o.y += RX2.range(0.2, 0.5);
      plate1(o, Math.atan2(-st.nz * sg, -st.nx * sg), Rr, sandy.clone().lerp(RX2.pick(plateTints), RX2.range(0.4, 0.7)).multiplyScalar(RX2.range(0.82, 1.05)), RX2.int(2, 3));
    }
    RR = R;
    await ctx.yield();
    await flush('amph-reef');
    await ctx.yield();
    // ================================================================= THE EXIT'S REEF (polish pass, RX)
    // From the coral head to the portal the floor is never bare sand: fan-topped bommies flank the lane (7.6-16 m aside,
    // two pairs standing either side of the ring) and low coral heads and rubble lie under it (the lens rides 7 m above).
    // Its own mesh, hidden until the lens is within sight of it (update: exitReef.visible).
    const laneX = (z) => (z > -90 ? -1 : z > -130 ? lerp(-1, -4, (-90 - z) / 40) : -4);
    const exitBommies = [], exitLow = [];
    RR = RX;
    for (let i = 0; i < 18; i++) {
      await ctx.yield();
      const flank = i < 4, z = flank ? seatL.z + RX.range(-7, 3) : RX.range(-176, -84), sd = flank ? (i % 2 ? 1 : -1) : (RX.chance(0.5) ? 1 : -1);
      const lat = flank ? RX.range(10.5, 15) : i < 11 ? RX.range(7.6, 11) : RX.range(9, 16), x = laneX(z) + sd * lat, st = stAtZ(z);
      if (Math.abs(x - st.c.x) > st.hw - 7) continue;
      let ok = true; for (const b of exitBommies) if (Math.hypot(b.x - x, b.z - z) < 6) ok = false;
      if (!ok) continue;
      const y = floorY(x, z, st), tint = RX.pick(moundTints), big = RX.range(1.0, 1.5); exitBommies.push({ x, y, z, st, big });
      for (let j = 0; j < 5; j++) boulder(x + RX.range(-1.7, 1.7) * big, y - 0.3, z + RX.range(-1.7, 1.7) * big, RX.range(0.7, 1.5) * big * (j ? 0.7 : 1), cc.copy(j % 2 ? RX.pick(moundTints) : tint).multiplyScalar(RX.range(0.85, 1.1)).clone(), j < 2);
      for (let j = 0; j < 2; j++) plate1(V3(x + RX.range(-1.5, 1.5), y + RX.range(0.9, 1.6) * big, z + RX.range(-1.5, 1.5)), RX.range(0, 6.28), RX.range(0.5, 0.95), sandy.clone().lerp(RX.pick(plateTints), 0.55).multiplyScalar(0.9), RX.int(1, 2));
      for (let j = 0; j < 4; j++) { const a = RX.range(0, 6.28), d = RX.range(2.4, 5.4); boulder(x + Math.cos(a) * d, floorY(x + Math.cos(a) * d, z + Math.sin(a) * d, st) - 0.05, z + Math.sin(a) * d, RX.range(0.18, 0.5)); }
    }
    for (let i = 0; i < 16; i++) {
      if (i % 4 === 3) await ctx.yield();
      const z = RX.range(-172, -80), x = laneX(z) + RX.range(-6, 6), st = stAtZ(z), y = floorY(x, z, st);
      if (Math.hypot(x - seatL.x, z - seatL.z) < 12) continue;
      // (the last 45 m of the lane is left to the ring: a head that would stand within 4.5 m of its centre line there is drawn
      // from the stream as before but not built, so the ring reads clean and nothing else has moved)
      const inLane = z < seatL.z + 45 && Math.abs(x - laneX(z)) < 4.5, Wk = W;
      if (inLane) W = makeWriter(); else exitLow.push({ x, y, z });
      for (let j = 0; j < 2; j++) boulder(x + RX.range(-0.7, 0.7), y - 0.12, z + RX.range(-0.7, 0.7), RX.range(0.28, 0.62), cc.copy(RX.pick(moundTints)).multiplyScalar(RX.range(0.85, 1.1)).clone());
      for (let j = 0; j < 2; j++) boulder(x + RX.range(-1.6, 1.6), y - 0.04, z + RX.range(-1.6, 1.6), RX.range(0.12, 0.3));
      W = Wk;
    }
    RR = R;
    await ctx.yield();
    const exitReef = await flush('exit-reef');
    await ctx.yield();

    // ---- fans, whips and garden eels (world space; the tide bends them all the same way)
    const HU = hero.uniforms, fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const lightU = { uSunDir: { value: uwSun }, uSunCol: HU.uSunColor, uSkyL: HU.uSkyLight, uDeepL: HU.uDeepLight, uSurfY: { value: 0 } };
    const flowV = HA.heading.clone().negate(), uT = { value: 0 }, uCam = { value: V3(0, 0, 0) }, uPix = { value: 0.002 };
    const ribbonMesh = (geo, list, colors, bend, sink, rng = R) => {
      const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      list.forEach((o, i) => { iA.set([o.p.x, o.p.y - 30, o.p.z, o.s], i * 4); iB.set([o.yaw, rng(), rng(), 0], i * 4); });
      const mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...lightU, uT, uCam, uPix, uSinkOn: { value: sink ? 1 : 0 }, uFlowV: { value: flowV }, uBend: { value: V3(...bend) },
        uColA: C3(col(colors[0])), uColB: C3(col(colors[1])), uColC: C3(col(colors[2])) }, vertexShader: FAN_VERT, fragmentShader: FAN_FRAG, fog: true, side: THREE.DoubleSide });
      const m = new THREE.Mesh(instanced(geo, { iA, iB }, n), mat); m.frustumCulled = false; below.add(m); return m;
    };
    const growAt = (set) => { const st = R.pick(set), sg = R.chance(0.5) ? 1 : -1, zone = R(), v = zone < 0.45 ? R.range(0.02, 0.2) : zone < 0.75 ? R.range(0.56, 0.66) : 1;
      const p = wallPoint(st, sg, v, v === 1 ? R.range(-1.5, 0.3) : R.range(0.2, 0.9)); if (v === 1) p.y += 0.5; return { p, st, sg, yaw: Math.atan2(st.t.x, st.t.z) + R.range(-0.35, 0.35) }; };
    const fans = [], whips = [], eels = [];
    for (let i = 0; i < Math.round(240 * dens * (0.6 + 0.4 * detail)); i++) { if (i % 60 === 59) await ctx.yield(); const g = growAt(R.chance(0.7) ? canyonSt : allSt); g.s = R.range(0.75, 1.35); g.p.y += 0.12 * g.s; fans.push(g); }
    await ctx.yield();
    for (let i = 0; i < Math.round(200 * dens * (0.6 + 0.4 * detail)); i++) { if (i % 60 === 59) await ctx.yield(); const g = growAt(R.chance(0.7) ? canyonSt : allSt); g.s = R.range(0.6, 1.15); whips.push(g); }
    await ctx.yield();
    for (let i = 0; i < 160; i++) { if (i % 40 === 39) await ctx.yield(); const z = R.range(-181, -124), x = seatL.x + (R.chance(0.5) ? 1 : -1) * R.range(1.5, 15), st = stations.reduce((a, s) => (Math.abs(s.c.z - z) < Math.abs(a.c.z - z) ? s : a), stations[0]);
      eels.push({ p: V3(x, floorY(x, z, st) - 0.02, z), s: R.range(0.32, 0.6), yaw: R.range(-0.5, 0.5) }); }
    for (const b of ringBits) if (R.chance(0.6)) { const f = { p: V3(b.x, b.y, b.z), s: R.range(0.6, 1.0), yaw: R.range(-0.4, 0.4) }; if (!(b.z > seatL.z - 1 && Math.abs(b.x - seatL.x) < 9)) fans.push(f); }   // (none on the rubble in front of the ring)
    for (const b of bommies) { for (let j = 0; j < 3; j++) (j ? fans : whips).push({ p: V3(b.x + R.range(-1.8, 1.8), b.y + R.range(0.9, 1.9), b.z + R.range(-1.8, 1.8)), s: R.range(0.7, 1.2), yaw: R.range(-0.4, 0.4) }); }
    await ctx.yield();
    const fanMesh = ribbonMesh(fanGeo(R), fans, ['#9E2F3A', '#B8607A', '#C8923E'], [0.07, 0.035, 0.012]); fanMesh.name = 'sea-fans';
    await ctx.yield();
    const whipMesh = ribbonMesh(whipGeo(R), whips, ['#C23B32', '#D4563A', '#B8504E'], [0.55, 0.12, 0.03]); whipMesh.name = 'whip-corals';
    await ctx.yield();
    const eelMesh = ribbonMesh(eelGeo(), eels, ['#D8D2C0', '#BDB49C', '#E8E2D2'], [0.14, 0.06, 0.02], true); eelMesh.name = 'garden-eels';
    await ctx.yield();
    const amphFanMesh = ribbonMesh(fanMesh.geometry, amphFans, ['#A23340', '#C0688A', '#D09A44'], [0.07, 0.035, 0.012], false, RX2); amphFanMesh.name = 'sea-fans-amphitheatre';
    await ctx.yield();
    // (polish pass, RX) the exit's own dressing, one group hidden until the lens is within sight of it: fans and whips on
    // the new bommies and low heads, and eleven colonies of taller garden eels beside the lane that sink as the lens comes
    const exitG = new THREE.Group(); exitG.name = 'exit-dressing'; below.add(exitG);
    { const fans2 = [], whips2 = [], eels2 = [];
      for (const b of exitBommies) for (let j = 0; j < 4; j++) (j ? fans2 : whips2).push({ p: V3(b.x + RX.range(-1.9, 1.9) * b.big, b.y + RX.range(1.0, 2.3) * b.big, b.z + RX.range(-1.9, 1.9) * b.big), s: j ? RX.range(0.8, 1.35) : RX.range(0.6, 0.95), yaw: RX.range(-0.4, 0.4) });
      for (const b of exitLow) if (RX.chance(0.7)) fans2.push({ p: V3(b.x, b.y + 0.45, b.z), s: RX.range(0.5, 0.8), yaw: RX.range(-0.4, 0.4) });
      for (let c = 0; c < 11; c++) {
        const z = RX.range(-180, -126), x = laneX(z) + (RX.chance(0.5) ? 1 : -1) * RX.range(2.5, 12), st = stAtZ(z);
        for (let j = 0; j < 26; j++) { const ex = x + RX.gauss() * 1.9, ez = z + RX.gauss() * 1.9; eels2.push({ p: V3(ex, floorY(ex, ez, st) - 0.02, ez), s: RX.range(0.5, 0.95), yaw: RX.range(-0.5, 0.5) }); }
      }
      await ctx.yield();
      const f2 = ribbonMesh(fanMesh.geometry, fans2, ['#9E2F3A', '#B8607A', '#C8923E'], [0.07, 0.035, 0.012], false, RX); f2.name = 'sea-fans-exit'; exitG.add(f2);
      const w2 = ribbonMesh(whipMesh.geometry, whips2, ['#C23B32', '#D4563A', '#B8504E'], [0.55, 0.12, 0.03], false, RX); w2.name = 'whip-corals-exit'; exitG.add(w2);
      await ctx.yield();
      const e2 = ribbonMesh(eelMesh.geometry, eels2, ['#D8D2C0', '#BDB49C', '#E8E2D2'], [0.14, 0.06, 0.02], true, RX); e2.name = 'garden-eels-exit'; exitG.add(e2);
    }
    await ctx.yield();

    // ---- anthias in clouds on both walls, the fusilier river, the Napoleon wrasse (or a great barracuda)
    const headA = Math.atan2(HA.heading.x, HA.heading.z);
    const fishMat = (mode, c, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...lightU, uT, uCam, uMode: { value: mode }, uHeadA: { value: headA }, uFlinch: { value: extra.flinch ?? 1 },
      uSchoolK: { value: 1 }, uSchoolPos: { value: V3(0, -100, 0) }, uSchoolDir: { value: d1.clone() }, uTop: C3(col(c[0]).multiplyScalar(extra.boost ?? 1)), uSide: C3(col(c[1]).multiplyScalar(extra.boost ?? 1)), uBelly: C3(col(c[2])), uTail: C3(col(c[3]).multiplyScalar(extra.boost ?? 1)),
      uStripe: { value: new THREE.Vector4(...col(c[4] || '#000000').toArray(), c[4] ? 1 : 0) }, uPattern: { value: extra.pattern ?? 0 }, uGlow: { value: extra.glow ?? 0 } }, vertexShader: FISH_VERT, fragmentShader: FISH_FRAG, fog: true, side: THREE.DoubleSide });
    const smallFish = fishGeo(FISH_SMALL, 4, 0.13, 0.05), tinyFish = fishGeo([FISH_SMALL[0], FISH_SMALL[2], FISH_SMALL[4]], 4, 0.13, 0);   // anthias: 23 triangles each
    { const n = Math.round(1000 * dens * (0.6 + 0.4 * detail)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4); let k = 0;
      const diveSt = stIn(152, 97);
      while (k < n) {
        const beside = R.chance(0.4), st = R.pick(beside ? diveSt : R.chance(0.8) ? canyonSt : allSt), sg = R.chance(0.5) ? 1 : -1, m = Math.min(n - k, R.int(10, 26)), wa = Math.atan2(st.nz * sg, st.nx * sg);
        let c;
        if (beside) { const l = R.range(4.5, 7.5) * sg; c = V3(st.c.x + st.nx * l, 0, st.c.z + st.nz * l); c.y = path.nearestXZ(c.x, c.z).y + 30 + R.range(-2.6, 2.2); }   // clouds 4-7 m from the lens
        else c = wallPoint(st, sg, R.range(0.25, 0.98), R.range(1.0, 2.2));
        // (the clouds beside the lens are larger fish packed tighter, and flinch less: iB.z is the flinch gain)
        const sp = beside ? 0.6 : 0.9, s0 = beside ? 0.5 : 0.3, s1 = beside ? 0.7 : 0.45;
        for (let j = 0; j < m; j++, k++) { iA.set([c.x + R.gauss() * sp, c.y - 30 + R.gauss() * sp * 0.9, c.z + R.gauss() * sp, R.range(s0, s1)], k * 4); iB.set([R(), wa, R() * 0 + (beside ? 0.3 : 1), R.range(3, 5)], k * 4); }
      }
      const m = new THREE.Mesh(instanced(tinyFish, { iA, iB }, n), fishMat(0, ['#FF6420', '#FF7430', '#FFB480', '#E8588C'], { boost: 1.2, glow: 0.45 })); m.frustumCulled = false; m.name = 'anthias'; below.add(m); }
    await ctx.yield();
    const nFus = Math.round(300 * (0.6 + 0.4 * detail));
    const fusMat = fishMat(1, ['#2C7CCB', '#5AA8EA', '#E6F1F8', '#EFC72E', '#F5D23C']);
    { const iA = new Float32Array(nFus * 4), iB = new Float32Array(nFus * 4);
      for (let i = 0; i < nFus; i++) { iA.set([R.gauss() * 1.5, R.gauss() * 0.9, 0, R.range(0.36, 0.5)], i * 4); iB.set([R(), R.range(-30, 30), R(), R.range(2.6, 3.6)], i * 4); }
      const m = new THREE.Mesh(instanced(smallFish, { iA, iB }, nFus), fusMat); m.frustumCulled = false; m.name = 'fusiliers'; below.add(m); }
    await ctx.yield();
    const uWrasse = lerp(uDive, uBend, 0.72), wrP = path.pointAt(uWrasse).addScaledVector(Rt, 5).add(V3(0, 0.2, 0));
    { const iA = new Float32Array([wrP.x, wrP.y, wrP.z, cast.cuda ? 1.6 : 1.35]), iB = new Float32Array([0.3, 0, 0.5, cast.cuda ? 0.5 : 0.7]);
      const g = cast.cuda ? fishGeo(FISH_CUDA, 8, 0.09, 0.03) : fishGeo(FISH_WRASSE, 10, 0.13, 0.07);
      const mat = cast.cuda ? fishMat(0, ['#5E7C88', '#A9C2CC', '#E6EEF0', '#3A4A52'], { flinch: 0, pattern: 0.5 }) : fishMat(0, ['#2C7C88', '#3FA890', '#93CCB2', '#2A6C8E'], { flinch: 0, pattern: 1 });
      mat.uniforms.uHeadA.value = Math.atan2(-d1.x, -d1.z) + 0.35;
      const m = new THREE.Mesh(instanced(g, { iA, iB }, 1), mat); m.frustumCulled = false; m.name = cast.cuda ? 'barracuda' : 'napoleon-wrasse'; below.add(m); }

    // (polish pass, RX) schools that hold station: fusiliers in loose clouds 3.8-10 m off the lens' line right across the
    // amphitheatre, facing the current among the sharks and parting from the lens as it comes (wallFish); anthias over
    // every bommie of the exit and fusiliers above the slope and either side of the ring (in exitG)
    const hoverSchool = (geo, clouds, per, sizes, colors, extra, name) => {
      const n = clouds.length * per, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4); let k = 0;
      for (const c of clouds) for (let j = 0; j < per; j++, k++) {
        iA.set([c.x + RX.gauss() * c.r, c.y - 30 + RX.gauss() * c.r * 0.6, c.z + RX.gauss() * c.r * 1.3, RX.range(sizes[0], sizes[1])], k * 4);
        iB.set([RX(), c.away, c.flinch, RX.range(2.4, 3.6)], k * 4);
      }
      const m = new THREE.Mesh(instanced(geo, { iA, iB }, n), fishMat(0, colors, extra)); m.frustumCulled = false; m.name = name; return m;
    };
    const lineYL = (z) => (z > 46 ? 15 + (z - 46) * 0.0625 : 14 + z * (z > 0 ? 0.022 : 0.03));   // the lens' height through the wall (hero-local)
    const FUS = ['#2C7CCB', '#5AA8EA', '#E6F1F8', '#EFC72E', '#F5D23C'];
    let wallFish, exitAnthias, exitFus;
    { const wc = [];
      for (let i = 0; i < 12; i++) { const z = lerp(64, -32, (i + RX()) / 12), sd = i % 2 ? 1 : -1; wc.push({ x: sd * RX.range(3.8, 10), y: lineYL(z) + RX.range(-4, 3.5), z, r: 1.3, away: sd > 0 ? 0 : Math.PI, flinch: 0.5 }); }
      wallFish = hoverSchool(tinyFish, wc, Math.round(24 * (0.6 + 0.4 * detail)), [0.36, 0.5], FUS, {}, 'fusiliers-wall'); below.add(wallFish);
      await ctx.yield();
      const ac = exitBommies.map((b) => ({ x: b.x, y: b.y + 2.3 * b.big, z: b.z, r: 1.25 * b.big, away: b.x > laneX(b.z) ? 0 : Math.PI, flinch: 0.4 }));
      exitAnthias = hoverSchool(tinyFish, ac, Math.round(20 * (0.6 + 0.4 * detail)), [0.3, 0.5], ['#FF6420', '#FF7430', '#FFB480', '#E8588C'], { boost: 1.2, glow: 0.45 }, 'anthias-exit'); exitG.add(exitAnthias);
      const fc = [];
      for (let i = 0; i < 6; i++) { const z = lerp(-104, -172, (i + RX()) / 6), sd = i % 2 ? 1 : -1; fc.push({ x: laneX(z) + sd * RX.range(7, 12), y: floorOf(z) + RX.range(3.5, 7), z, r: 1.6, away: sd > 0 ? 0 : Math.PI, flinch: 0.4 }); }
      for (const sd of [-1, 1]) fc.push({ x: seatL.x + sd * RX.range(10, 12.5), y: seatL.y + RX.range(-3.5, 1), z: seatL.z + RX.range(-3, 4), r: 1.7, away: sd > 0 ? 0 : Math.PI, flinch: 0.3 });
      exitFus = hoverSchool(tinyFish, fc, Math.round(26 * (0.6 + 0.4 * detail)), [0.36, 0.5], FUS, {}, 'fusiliers-exit'); exitG.add(exitFus);
    }
    await ctx.yield();

    // ---- kit swimmers: the cleaning station's mantas (or eagle rays), the one that banks over the lens, the escorts
    const uwLightK = { sunDir: uwSun.clone(), sunColor: lookName === 'golden' ? '#ffd9a8' : lookName === 'dawn' ? '#a8c8e6' : '#bfeaff', sunIntensity: lookName === 'dawn' ? 1.5 : 2.5,
      sky: lookName === 'golden' ? '#4aa0b0' : '#3fa6c8', skyIntensity: lookName === 'dawn' ? 1.1 : 1.6, ground: '#3f7f8c', groundIntensity: lookName === 'dawn' ? 1.0 : 1.6 };   // the lit sand bounces light into bellies
    const faunaSea = F.makeFauna(scene, { light: uwLightK });
    const mo = toW(HA.mantaOrbit.center);
    const stationRays = cast.rays ? faunaSea.add(F.makeMantaRay({ rng: R, span: 0.95, count: 12, top: '#5a4e44', belly: '#e8e4dc', center: [mo.x, mo.y + 1, mo.z], radius: 10, height: 3, spread: [9, 3, 9] }))
      : faunaSea.add(F.makeMantaRay({ rng: R, span: 2.25, count: 2, top: '#34404e', belly: '#f4f4ee', patch: '#c6ced6', bank: 26, center: [mo.x + 1.5, mo.y + 0.5, mo.z], radius: HA.mantaOrbit.radius, height: 2, spread: [1.5, 2, 12] }));   // kept to the head's side of the canyon: nothing circles in front of the portal
    // (seen from the canyon they were dark kites: more of the sand's light on their bellies and a paler rim on their backs)
    if (stationRays && stationRays.uniforms) { const su = stationRays.uniforms; if (su.uFill) su.uFill.value = 0.3; if (su.uRim) su.uRim.value = 1.0; if (su.uGroundColor) su.uGroundColor.value.multiplyScalar(1.7); }
    await ctx.yield();
    // THE MANTA MOMENT (the site's table). One manta (an eagle ray on rays seeds) comes round the coral head toward us on
    // the right, turns down the canyon and flies with us past the head, some 6 m ahead of the lens, 2.7 m to the right of
    // its line and half a metre below it. It comes banked back-to-us (44 degrees 36 m short of the head: the
    // charcoal-blue back in plan, both wingtips, the pale shoulder marks, the cephalic lobes ahead, the whip tail behind),
    // rolls over as we pass the head (40 degrees 21 m short of it, 19 degrees 3.5 m short, level some 7 m past: side on,
    // dark over white; then belly-to-us, the white belly with its gill slits, dark margins and blotches, 28 degrees 29 m
    // past), and draws ahead to the right: 12 m ahead and 7.4 m aside 52 m past the head, then back and out, abeam and
    // 15 m off where the table ends. The wings beat through half their span; it never crosses the portal, which stands
    // clear to its left.
    // The knots are measured from the coral head (u - uHead; the flight reaches the head 39.06 s in, and one hundredth of
    // u is 5.83 m of the route and half a second of the 50). They stand 70.6, 58.9, 50.2, 42.6, 35.6, 21.0, 12.3 and
    // 3.5 m before the head (6.05, 5.05, 4.3, 3.65, 3.05, 1.8, 1.05 and 0.3 s before we are level with it) and 5.3, 11.1,
    // 28.6, 51.9, 60.7, 72.3 and 81.1 m after it (0.45, 0.95, 2.45, 4.45, 5.2, 6.2 and 6.95 s after): the flight is then
    // 33.01, 34.01, 34.76, 35.41, 36.01, 37.26, 38.01, 38.76, 39.51, 40.01, 41.51, 43.51, 44.26, 45.26 and 46.01 s in.
    // They are the table's own places; none is named for a second of the design. MANTA_KEYS are
    // [u - uHead, metres ahead of the lens, above it, to its right, nose-down pitch (deg), roll (deg; negative: back to the lens, positive: belly), heading left of travel (rad)].
    const mantaW = cast.rays ? 2.0 : 2.8, mantaK = mantaW / 2.8;   // (half spans: a 5.6 m manta, or a 4 m eagle ray flown that much nearer)
    const overManta = new THREE.Mesh(mantaGeo(mantaW, cast.rays ? 2.5 : 1, cast.rays ? 2 : 1), new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...lightU, uT, uFlap: { value: mantaW * 0.5 }, uSpan: { value: mantaW }, uRayK: { value: cast.rays ? 1 : 0 }, uHero: { value: 1 },
      uBounceM: C3(new THREE.Color(0.55, 0.49, 0.37).multiplyScalar((0.3 * HU.uSunColor.value.r + 0.5 * HU.uSunColor.value.g + 0.2 * HU.uSunColor.value.b) / 1.29)) }, vertexShader: MANTA_VERT, fragmentShader: MANTA_FRAG, fog: true, side: THREE.DoubleSide }));
    overManta.frustumCulled = false; overManta.visible = false; overManta.name = 'manta-over'; overManta.rotation.order = 'YXZ'; below.add(overManta);
    const MANTA_KEYS = [[-0.121, 48, 3.0, 9.5, 0, 0, 2.9], [-0.101, 31, 2.0, 7.8, 2, -14, 2.6], [-0.086, 19.5, 0.8, 6.0, 4, -28, 2.1], [-0.073, 11.4, -0.3, 4.4, 4, -40, 1.5],
      [-0.061, 6.1, -0.6, 2.9, 4, -44, 1.0], [-0.036, 5.8, -0.5, 2.7, 4, -40, 0.8], [-0.021, 5.7, -0.4, 2.6, 4, -32, 0.72], [-0.006, 5.7, -0.3, 2.6, 4, -19, 0.66],
      [0.009, 5.9, -0.2, 2.65, 4, -4, 0.6], [0.019, 6.2, -0.1, 2.75, 3, 12, 0.52], [0.049, 9, 0.0, 4.4, 0, 28, 0.15],
      [0.089, 12, 2.0, 7.4, 0, 12, -0.15], [0.104, 10, 2.4, 9.2, 2, 30, -0.5], [0.124, 5, 2.6, 13, 0, 40, -0.9], [0.139, -2, 3, 15, 0, 40, -1.0]], mk = [0, 0, 0, 0, 0, 0];
    // (polish pass) four spotted rays gliding low over the sand of the bowl and the slope, on slow loops either side of the lane
    // (where on its loop each one starts, its bearing round the loop's centre, is drawn from a stream of the rays' own, RXR)
    const sandRays = [], RXR = makeRng('pass-rays:' + (ctx.seed ?? 0));
    { const g = mantaGeo(1.0), mat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...lightU, uT, uFlap: { value: 0.17 }, uSpan: { value: 1.0 }, uRayK: { value: 1 }, uHero: { value: 0 },
        uBounceM: overManta.material.uniforms.uBounceM }, vertexShader: MANTA_VERT, fragmentShader: MANTA_FRAG, fog: true, side: THREE.DoubleSide });
      for (const [cz0, lat, rx, rz, w] of [[-150, 8.5, 3.2, 9, 0.13], [-166, -9.5, 3.5, 8, -0.11], [-112, 7, 2.6, 7, 0.12], [-136, -8, 3, 10, -0.1]]) {
        const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.rotation.order = 'YXZ'; m.name = 'sand-ray'; exitG.add(m);
        sandRays.push({ m, cx: laneX(cz0) + lat, cz: cz0, rx, rz, w, ph: RXR.range(0, 6.2832) });
      } }
    await ctx.yield();
    for (const sd of [-1, 1]) { faunaSea.add(F.makeShark({ rng: R, count: Math.round(8 * dens), length: 1.8, speed: 9, spread: [2, 2.5, 10],
      along: { path, side: sd * 8.5, up: -0.5, lead: 12, from: uHead - 0.03, to: 0.975, drift: 2 } })); await ctx.yield(); }   // 6.5-10.5 m out: on the flanks, never on the portal
    // RARE, below: the dolphins that dived with us cut across the bow in the canyon, three from each side, 9 m ahead, broadside on
    // (the kit's dolphins only leap, so these are its dolphin model on the plain swimmer)
    if (cast.dolphins) for (const [sd, uu] of [[-1, lerp(uDive, uBend, 0.62)], [1, lerp(uDive, uBend, 0.98)]]) {
      const L = 2.5, D = { len: L, speed: 13, count: 3, light: 'underwater', swim: [1.5, 0.035, 4, 0.2], fin: [0.3, 0.05, 0.25, 1], bank: 26, bob: 0.7, rim: 0.8, spec: 1.2, shine: 40, caustics: 0.6, spread: [1.8, 1.3, 2.0] };
      faunaSea.add(F.makeSwimmer(F.dolphinGeometry({ len: L, top: '#7890a6', belly: '#f2f5f5', fin: '#64798e' }), { rng: R, light: uwLightK,
        cross: { path, u: uu, lead: 9.5, angle: 62, side: sd, height: 0.4, span: 90, sag: 2.5, duration: DURATION } }, R, D));
      await ctx.yield();
    }
    // stragglers: the wall does not end at the coral head. Animals hold station in the current all the way down the
    // exit and round the portal, so the lens threads sharks until the last second (the hero's own shader: they part).
    {
      const list = [], want = Math.round(64 * Math.min(dens, 1)), tp = V3(), tt = V3();
      for (let tries = 0; tries < 4000 && list.length < want; tries++) {
        const us = lerp(uHead + 0.004, 0.992, Math.pow(R(), 0.8));
        path.pointAt(us, tp); path.tangentAt(us, tt);
        const lz = tp.z - hero.object.position.z, hl = Math.hypot(tt.x, tt.z) || 1;
        // (past the bowl nothing hangs within 6 m of the lens' line, widening to 10 m at the ring: the last 60 m is a clear lane)
        const latMin = us > uBowl ? lerp(6, 10, sstep(uBowl, 0.99, us)) : 2.6;
        const latMax = Math.min(24, hwOf(lz) - 8), sd = R.chance(0.5) ? 1 : -1, lat = sd * R.range(latMin, Math.max(latMin + 1.4, latMax));
        const x = tp.x - hero.object.position.x + (-tt.z / hl) * lat, z = lz + (tt.x / hl) * lat;
        const y = Math.max(tp.y - hero.object.position.y + R.range(-3, 7.5), floorOf(lz) + 1.8);
        let ok = true;
        for (const q of list) if ((q.x - x) ** 2 + ((q.y - y) * 1.5) ** 2 + (q.z - z) ** 2 < 12) { ok = false; break; }
        if (ok) list.push({ x, y, z, line: Math.abs(lat) });
      }
      for (let i = 0; i < 12; i++) { const z = R.range(-176, -134); list.push({ x: seatL.x + (R.chance(0.5) ? 1 : -1) * R.range(7, 14), y: floorOf(z) + R.range(2.0, 3.2), z, line: 9 }); }   // low over the sand slope, to either side of the lane
      hero.addSharks(list, 0, { range: 125 });      // (drawn only within 125 m ahead of the lens: from the bend they are beyond sight)
      var stragglers = list;
      // (sixth polish pass, RX5) a loose group round the portal: a knot of eleven on the port side of the lane, 8 to 16 m off
      // it and 3 to 30 m short of the ring, and seven strung out wider to starboard; none nearer the lane than 8.5 m
      { const more = [];
        for (let tries = 0; tries < 600 && more.length < 18; tries++) {
          const knot = more.length < 11, sd = knot ? -1 : 1, z = seatL.z + (knot ? RX5.range(3, 30) : RX5.range(1, 46));
          const x = seatL.x + sd * (knot ? RX5.range(8.5, 16) : RX5.range(9.5, 23)), y = Math.min(27, floorOf(z) + (knot ? RX5.range(3.5, 11) : RX5.range(2.5, 14)));
          let ok = Math.abs(x - seatL.x) < hwOf(z) - 5;
          for (const q of list) if ((q.x - x) ** 2 + ((q.y - y) * 1.5) ** 2 + (q.z - z) ** 2 < 10) { ok = false; break; }
          for (const q of more) if ((q.x - x) ** 2 + ((q.y - y) * 1.5) ** 2 + (q.z - z) ** 2 < 10) { ok = false; break; }
          if (ok) more.push({ x, y, z, line: Math.abs(x - seatL.x) });
        }
        hero.addSharks(more, 0, { rng: RX5, range: 125, name: 'sharks-portal', offset: 9000 }); }
    }
    await ctx.yield();
    { // (polish pass, RX) THE REAR GUARD: the wall does not thin to stragglers at the coral head. Some 235 more animals hang
      // in ranks down both flanks of the exit canyon, from the head through the bowl and up the slope, thickest behind the
      // head and thinning toward the ring: 4.2 m and more off the lens' line as far as the bowl, then outside the clear lane
      // (6 m widening to 10 m at the ring), from just over the sand to 10 m above the lens. The sixty nearest the line are
      // the ranks' full model, the rest the far model; both in three runs along z that are drawn only within 125 m ahead.
      const list = [], want = Math.round(235 * Math.min(dens, 1) * (0.6 + 0.4 * detail)), pyT = [];
      for (let i = 0; i <= 70; i++) { const z = -48 - i * 2; pyT.push(path.nearestXZ(laneX(z), z).y + 30); }
      await ctx.yield();
      const pyAt = (z) => { const f = clamp((-48 - z) / 2, 0, 69.999), i = Math.floor(f); return lerp(pyT[i], pyT[i + 1], f - i); };
      const clear = (x, y, z) => { for (const q of list) if ((q.x - x) ** 2 + ((q.y - y) * 1.5) ** 2 + (q.z - z) ** 2 < 11.5) return false;
        for (const q of stragglers) if ((q.x - x) ** 2 + ((q.y - y) * 1.5) ** 2 + (q.z - z) ** 2 < 11.5) return false; return true; };
      for (let tries = 0; tries < 9000 && list.length < want; tries++) {
        if (tries % 250 === 249) await ctx.yield();
        const z = -50 - 130 * Math.pow(RX(), 1.25), st = stAtZ(z), lx = laneX(z);
        const latMin = z > -121 ? 4.2 : lerp(6, 10, sstep(-121, -186, z)), latMax = Math.max(latMin + 2, Math.min(21, st.hw - 6.5));
        const sd = RX.chance(0.5) ? 1 : -1, lat = lerp(latMin, latMax, Math.pow(RX(), 1.3)), x = lx + sd * lat, py = pyAt(z);
        const low = RX.chance(0.06), y = low ? floorOf(z) + 1.4 + RX.range(0.6, 0.9) : lerp(floorOf(z) + 2.2, Math.min(st.rim - 2.5, py + 10), RX());   // (none within 2 m of the sand: a far animal is drawn stout, and one that low looked half buried)
        if (Math.hypot(x - head.x, z - head.z) < 9) continue;
        if (clear(x, y, z)) list.push({ x, y, z, line: lat, d: lat + Math.abs(y - py) * 0.6 });
      }
      await ctx.yield();
      list.sort((a, b) => a.d - b.d);
      const nNear = Math.min(list.length, 60), runs = [[-40, -92], [-92, -134], [-134, -200]];
      runs.forEach(([z0, z1], r) => {
        hero.addSharks(list.slice(0, nNear).filter((q) => q.z <= z0 && q.z > z1), 0, { rng: RX, range: 125, name: 'sharks-rear-near', offset: 1000 * (r + 1) });
        hero.addSharks(list.slice(nNear).filter((q) => q.z <= z0 && q.z > z1), 1, { rng: RX, range: 125, name: 'sharks-rear-far', offset: 1000 * (r + 5) });
      });
    }
    await ctx.yield();

    // ================================================================= THE PACERS (a rule of the wall sheet)
    // The design's wall: "For nine seconds there is a shark within 3 m on every side (the nearest, 1.2 m away ...)". These
    // are the large animals of that ring (the hero's close-up model and its own shader), stations of the sheet like all
    // the others, laid by a rule of the school round our line through it (the route from the place the flight has reached
    // at the design's 25 s to the place it has reached at its 34 s: 105 m of line):
    //   along the line   the first stands 0 to 8 m into that stretch, each next one 8 to 10 m further on (every gap drawn),
    //                    to the stretch's end: ten to fourteen animals, eleven or twelve on most seeds (the hero
    //                    carries fourteen);
    //   round the line   the first at a bearing drawn all round it; each next one a third of a turn on from the one before,
    //                    give or take 35 degrees (drawn);
    //   off the line     1.4 to 3 m (drawn), and then far enough that no point of its axis, nose to tail, over all its
    //                    travel comes nearer than 1.2 m (the design's figure) to our line as it runs at the station
    //                    (its tangent there); the travel is its slip and beat, its own length along its pitched axis
    //                    and the sheet's sway, and a few centimetres are added for the swing the sheet's yaw gives its
    //                    nose. A margin in space: an animal that heads toward our line stands further off for it;
    //   itself           2.6 to 3 m long (drawn), the three body variants in turn, a small pitch and roll of its own.
    // It heads up-current as the ranks beside it do (on our left the hero's fan turns them some 30 degrees more across,
    // and a pacer there too), and it holds its station as a shark does: it slips back down its own lane and beats forward
    // again, a body's half length either way on a cycle of 9 to 14 s, swaying with the sheet. That cycle runs on the
    // world clock from a phase of its own and reads the same at any phase; nothing about a pacer follows the lens or the
    // flight. The ranks part round every one by the hero's rule in space (2 m round its axis, all round).
    // Every draw is from the pacers' own stream (RXP, pass-pacers), which nothing else reads: how many stand, and where,
    // is dealt by it alone. q: the station (hero space), h: its heading, surge (m) / period (s) / ph: the slip-and-beat,
    // beat0: its tail's phase.
    const RXP = makeRng('pass-pacers:' + (ctx.seed ?? 0)), PACE = [];
    const pcM = new THREE.Matrix4(), pcE = new THREE.Euler(0, 0, 0, 'YXZ'), pcF = HA.heading, pcSw = HU.uSway.value;
    { const sEnd = (34 / DURATION) * path.length, c = V3(0, 0, 0), t = V3(0, 0, 0), rt = V3(0, 0, 0), up = V3(0, 0, 0), cn = [];
      let s = (25 / DURATION) * path.length + RXP.range(0, 8), deg = RXP.range(0, 360);
      for (let i = 0; s <= sEnd; i++, s += RXP.range(8, 10), deg += 120 + RXP.range(-35, 35)) {
        const len = RXP.range(2.6, 3.0), phi = deg * 0.01745, cph = Math.cos(phi), sph = Math.sin(phi);
        const surge = len * RXP.range(0.3, 0.5), period = RXP.range(9, 14), ph = RXP(), beat0 = RXP.range(0, 6.2832), tone = RXP();
        const pitch = RXP.range(-0.07, 0.07), roll = RXP.range(-0.1, 0.1);
        path.posAtDist(s, c); path.tangentAtDist(s, t);
        const hl = Math.hypot(t.x, t.z) || 1; rt.set(-t.z / hl, 0, t.x / hl); up.crossVectors(rt, t).normalize();
        const A = HA.crossAngle * 0.01745 + (cph < 0 ? 0.5 : 0) + RXP.range(-0.08, 0.08), h = V3(Math.sin(A), 0, Math.cos(A));
        // its three moves, seen along our line (metres to the right of it, metres above it): the slip and beat along its
        // heading, its own half length along its pitched axis, the sheet's sway across the school's heading
        const mv = [[h.x * surge, 0, h.z * surge], [h.x * Math.cos(pitch) * len * 0.5, Math.sin(pitch) * len * 0.5, h.z * Math.cos(pitch) * len * 0.5], [pcF.z * pcSw.x, 0, -pcF.x * pcSw.x]]
          .map(([x, y, z]) => [x * rt.x + z * rt.z, x * up.x + y * up.y + z * up.z]);
        // every place a point of its axis can come to is the station plus or minus each move: a six-sided patch across our
        // line whose corners are among these eight, and whose nearest point to the line lies between two of them
        const nearAt = (r) => {
          for (let k = 0; k < 8; k++) { const a = k & 1 ? 1 : -1, b = k & 2 ? 1 : -1, d = k & 4 ? 1 : -1; cn[k] = [cph * r + a * mv[0][0] + b * mv[1][0] + d * mv[2][0], sph * r + a * mv[0][1] + b * mv[1][1] + d * mv[2][1]]; }
          let near = 1e9;
          for (let a = 0; a < 7; a++) for (let b = a + 1; b < 8; b++) {
            const dx = cn[b][0] - cn[a][0], dy = cn[b][1] - cn[a][1], f = clamp(-(cn[a][0] * dx + cn[a][1] * dy) / Math.max(dx * dx + dy * dy, 1e-9), 0, 1);
            near = Math.min(near, Math.hypot(cn[a][0] + dx * f, cn[a][1] + dy * f));
          }
          return near;
        };
        let r = RXP.range(1.4, 3.0);
        for (let n = 0; n < 40 && nearAt(r) < 1.2 + 0.25 * len * pcSw.w; n++) r += 0.2;
        const pc = hero.addPacer({ length: len, variant: i % 3, phase: tone });
        if (!pc) break;      // (the hero carries no more: the rule above never asks for more than it carries)
        PACE.push({ q: c.clone().addScaledVector(rt, cph * r).addScaledVector(up, sph * r).sub(hero.object.position), h, yaw: Math.atan2(h.x, h.z), pitch, roll, surge, period, ph, beat0, pc });
      } }
    await ctx.yield();

    { // sand smoke: streamers lying on the bowl and the slope, carried up to the lip and off it toward the portal
      const n = Math.round(150 * (0.6 + 0.4 * detail)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        const z = R.range(-186, -96), x = seatL.x + R.range(-17, 17), st = stations.reduce((a, q) => (Math.abs(q.c.z - z) < Math.abs(a.c.z - z) ? q : a), stations[0]);
        const dy = floorOf(z - 1) - floorOf(z), il = 1 / Math.hypot(0.25, dy, 1);
        iA.set([x, floorY(x, z, st) - 30, z, R.range(6, 12)], i * 4); iB.set([R(), R.range(0.9, 1.8), R.range(1.6, 3.4), R.range(0.22, 0.42)], i * 4); iC.set([-0.25 * il, dy * il, -il, R.range(5, 9)], i * 4);
      }
      const m = new THREE.Mesh(instanced(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), { iA, iB, iC }, n), new THREE.ShaderMaterial({ uniforms: { ...fogU(), uT,
        uSmokeCol: C3(HU.uSunColor.value.clone().multiply(new THREE.Color(0.42, 0.44, 0.40)).add(HU.uSkyLight.value.clone().multiplyScalar(0.3))) },
        vertexShader: SMOKE_VERT, fragmentShader: SMOKE_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      m.frustumCulled = false; m.renderOrder = 2; m.name = 'sand-smoke'; below.add(m);
    }
    // ---- the water itself: fog, shafts, plankton, the waterline at the crossing; one second of bubbles
    await ctx.yield();
    const uw = Water.makeUnderwater({ rng: R, sky, surfaceY: 0, floorY: -34, surfaceAt, water: LK.uwWater, deep: LK.uwDeep, fogDensity: LK.uwFog, rayIntensity: LK.rays, rays: { count: 110, width: 2.3 },   // (more and thinner shafts: at the kit's width some read as slabs)
      particles: { count: Math.round(900 * (0.5 + 0.5 * detail)), range: 40, size: 0.05 },
      bubbles: false });
    scene.add(uw.object);
    // (sixth polish pass) THE SHAFTS' EDGES. The kit's shaft is two or three narrow lobes inside its quad; at this width
    // they read as hard-edged pale bars. Its fragment shader is patched before the first compile (skipped if the kit's text
    // changes): one broad soft lobe carries most of the light and the narrow lobes ride on it at a fifth of their strength,
    // on a quad half as wide again, so every shaft fades out to nothing at both edges.
    { const rm = uw.rays && uw.rays.material, a = 'float len = smoothstep(0.,.16,vQ.y)*pow(1.-vQ.y,2.4);';
      // (seventh pass: only if the kit's text still declares the two names the patch uses; the broad lobe a quarter stronger,
      // the shafts read a little fainter than the kit's own in the canyon and the wall)
      if (rm && rm.fragmentShader.includes(a) && rm.fragmentShader.includes('float x = vQ.x') && rm.fragmentShader.includes('float prof = '))
        rm.fragmentShader = rm.fragmentShader.replace(a, 'prof = .24*prof + .78*exp(-x*x*3.4)*(1.-x*x)*(1.-x*x);\n  ' + a); }
    // SHAFTS ROUND THE PORTAL (RX5). The kit's shafts ride with the lens and thin out over the last sand; these sixteen stand
    // in the world, either side of the lane over the last 55 m and a little beyond the ring, leaning down the sun, each
    // soft-edged and slowly breathing. None comes within 8 m of the lane from top to foot, so the ring is never crossed.
    if (uw.rays) {
      const tq = V3(); path.tangentAt(0.97, tq); tq.y = 0; tq.normalize();
      const lx = -tq.z, lz = tq.x, dn = uwSun.clone().multiplyScalar(-1), pos = [], aA = [], aB = [], idx = [];
      for (let tries = 0, n = 0; tries < 400 && n < 16; tries++) {
        const lat = (n % 2 ? 1 : -1) * RX5.range(9, 30), back = RX5.range(-9, 55), len = RX5.range(24, 38), wid = RX5.range(2.2, 4.2), ph = RX5(), gain = RX5.range(0.3, 0.6);
        const latFoot = lat + (dn.x * lx + dn.z * lz) * len;
        if (latFoot * lat < 0 || Math.abs(latFoot) < 8) continue;
        const x = seat.x + lx * lat - tq.x * back, z = seat.z + lz * lat - tq.z * back, v0 = pos.length / 3;
        for (const [px, py] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) { pos.push(px, py, 0); aA.push(x, z, len, wid); aB.push(ph, gain); }
        idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3); n++;
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 4)); g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 2)); g.setIndex(idx);
      var portalShafts = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uRayDir: uw.rays.material.uniforms.uRayDir, uRayColor: uw.rays.material.uniforms.uRayColor, uT, uFogK: { value: LK.uwFog * 1.5 } },
        vertexShader: PSHAFT_VERT, fragmentShader: PSHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
      portalShafts.frustumCulled = false; portalShafts.renderOrder = 4; portalShafts.name = 'portal-shafts'; below.add(portalShafts);
    }
    await ctx.yield();
    const bubbles = fx.makeParticles({ rng: R.fork('bubbles'), preset: 'bubbles', count: Math.round(700 * (0.5 + 0.5 * detail)), box: [16, 12, 16], size: [0.02, 0.1], near: [0.3, 1.2] });
    bubbles.setOpacity(0); scene.add(bubbles.object);

    // ================================================================= POIS
    const sheetC = toW(HA.sheet.center), gazeP = V3(0, 0, 0), gazeQ = V3(0, 0, 0), gazeR = V3(0, 0, 0);
    const pois = [
      // the pass and the lagoon beyond it (a plate-space point, so it is scaled with k like everything on the plate)
      { at: (time, u) => gazeP.copy(P).addScaledVector(d1, 420 * kOf(u)), from: 0, to: K1, weight: 0.5 },
      // THE NOSE-OVER (third polish pass; eased in the sixth: it begins in the first second, is spread over a long fade and
      // pulls a little less, so the nod is slow): the gaze drops to the sea four tenths of the way from the pass to the
      // point under the lens, so that four seconds in the horizon is leaving the top of the picture and the notch stands
      // on the centre line; it lets go again as the path itself dives (6 to 8.5 s)
      { at: (time, u) => { path.pointAt(clamp(u, 0, 1), gazeQ); return gazeQ.set(P.x + (gazeQ.x - P.x) * 0.4, 0, P.z + (gazeQ.z - P.z) * 0.4); }, from: 0.015, to: 0.155, fade: 0.5, weight: 0.6 },
      // THE PULL-OUT (fourth polish pass): from four and a half seconds in the gaze is drawn back up to the lagoon beyond
      // the pass while the path itself dives, so through the design's eighth second (its last with the horizon) the pass
      // stands on the centre of the picture with its two islets, the lagoon behind it and the sky over the far rim; it lets
      // go before the skim
      { at: (time, u) => gazeR.copy(P).addScaledVector(d1, 420 * kOf(u)), from: 0.085, to: 0.245, fade: 0.45, weight: 0.62 },
      { at: wrP, from: uWrasse - 0.07, to: uWrasse + 0.004, weight: 0.3 },
      { at: sheetC, from: uBend - 0.06, to: uWallIn + 0.01, weight: 0.5 },
      { at: V3(head.x * 0.45, head.y - 30 + HA.coralHead.crownY + 3.5, head.z), from: uHead - 0.1, to: uHead - 0.004, weight: 0.28 },
    ];

    // (no warm-up of the hidden underwater half here: the engine compiles and draws hidden objects too, a few per frame)
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const sunI = rig.sun.intensity, hemiI = rig.hemi.intensity, airFog = { color: hazeCol.clone(), density: 0.00007 };
    const tmpP = V3(0, 0, 0), tmpT = V3(0, 0, 0), bufSize = new THREE.Vector2();
    const canoeYaw = canoe.rotation.y, uSchoolMid = lerp(uDive, uBend, 0.55);

    return {
      scene, path, duration: DURATION,
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 22, sway: 0.4, bank: 0.7 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#C8FFEC', glow: 1, revealDistance: 160, tilt: true },
      // ================================================================= POST (exposure, bloom, grade per mood)
      post: { exposure: LK.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 1.0 },
        grade: { saturation: LK.satur, contrast: 1.05, tint: LK.tint, shadowTint: '#020a16', vignette: 0.26, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        // the engine's portal-preview camera has matrixAutoUpdate off and an identity local matrix: any kit call that asks
        // three for the camera's world direction (the light rig does) resets its matrixWorld and the preview is then drawn
        // from the world origin. Keep the matrix the engine gave us and hand it back at the end.
        const heldCam = camera.matrixAutoUpdate === false;
        if (heldCam) camHold.copy(camera.matrixWorld); else camera.updateMatrixWorld();
        camPos.setFromMatrixPosition(camera.matrixWorld);     // (never camera.position: the preview camera has only a matrix)
        // the air-leg scale trick: the plate group shrinks to k about P, the sea disc paints in plate space
        const k = kOf(u);
        seaU.uPlate.value.z = k; seaU.uPlate.value.w = time;
        plate.scale.setScalar(k); plate.position.set(P.x * (1 - k), 0, P.z * (1 - k));
        seaDisc.position.set(camPos.x, 0, camPos.z);
        // the canoe runs up the tongue ahead and to starboard; the wake follows uCanoe
        const tt = (u - canoeU) * DURATION;
        const cx = canoeAb.x + canoeHead.x * 5 * tt, cz = canoeAb.z + canoeHead.z * 5 * tt;
        canoe.position.set(cx, atoll.ripH(cx, cz, time) * 0.8 + 0.14, cz);
        canoe.rotation.set(0.035 * Math.sin(time * 1.3), canoeYaw, -0.1 + 0.04 * Math.sin(time * 0.9));
        canoe.scale.setScalar(1.2 / Math.max(k, 0.8));   // (a fifth larger than life; half again while the plate is under 0.8, so the sail stands a twelfth of the frame tall as the skim begins)
        seaU.uCanoe.value.set(cx, cz, canoeHead.x, canoeHead.z);
        // above / below: one fog retuned by the water kit, two halves of the world swapped at the surface
        uw.update(dt, time, camera);
        const sub = uw.applyTo(scene, camera, airFog);
        above.visible = !sub; below.visible = sub; sky.object.visible = !sub; cloudField.object.visible = !sub;
        sky.update(dt, time, camera); rig.update(dt, time, camera); cloudField.update(dt, time, camera);
        rig.sun.intensity = sunI * (sub ? 0.5 : 1); rig.hemi.intensity = hemiI * (sub ? 0.8 : 1);
        faunaAir.update(dt, time, camera, u, !sub); faunaSea.update(dt, time, camera, u, sub);
        hero.update(dt, time, camera);
        // shared uniforms of the fish and ribbons
        uT.value = time; uCam.value.copy(camPos); wispMat.uniforms.uWispT.value = time;
        ctx.renderer.getDrawingBufferSize(bufSize);
        uPix.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(bufSize.y, 1));
        // the fusilier river: behind us at the dive, alongside in mid-canyon, ahead at the bend, gone before the wall
        const uf = clamp(u + (u - uSchoolMid) * 0.85 + 4 / path.length, uDive + 0.008, uWallIn - 0.02);
        path.pointAt(uf, tmpP); path.tangentAt(uf, tmpT);
        fusMat.uniforms.uSchoolPos.value.set(tmpP.x + tmpT.z * 5.5, tmpP.y - 1.2, tmpP.z - tmpT.x * 5.5);
        fusMat.uniforms.uSchoolDir.value.copy(tmpT);
        fusMat.uniforms.uSchoolK.value = sstep(uDive + 0.004, uDive + 0.03, u) * (1 - sstep(uWallIn - 0.06, uWallIn - 0.015, u));
        // the manta: placed against the lens' own path position, so the moment lands on the same frame at any speed
        const du = u - uHead;
        if (sub && du > MANTA_KEYS[0][0] && du < MANTA_KEYS[MANTA_KEYS.length - 1][0]) {
          keyAt(MANTA_KEYS, du, mk); path.pointAt(u, tmpP); path.tangentAt(u, tmpT);
          const hl = Math.hypot(tmpT.x, tmpT.z) || 1, tx = tmpT.x / hl, tz = tmpT.z / hl, cs = Math.cos(mk[5]), sn = Math.sin(mk[5]);
          const mS = lerp(1, mantaK, sstep(-0.09, -0.06, du) * (1 - sstep(0.02, 0.05, du)));   // (an eagle ray is smaller: it holds the same place in the frame, nearer)
          mk[0] *= mS; mk[1] *= mS; mk[2] *= mS;
          overManta.position.set(tmpP.x + tx * mk[0] - tz * mk[2], tmpP.y + mk[1], tmpP.z + tz * mk[0] + tx * mk[2]);
          overManta.rotation.set(mk[3] * 0.01745, Math.atan2(tx * cs + tz * sn, tz * cs - tx * sn), mk[4] * 0.01745);
          overManta.scale.setScalar(0.02 + 0.98 * sstep(MANTA_KEYS[0][0], MANTA_KEYS[0][0] + 0.012, du));
          overManta.visible = true;
        } else overManta.visible = false;
        // the dolphins' spray: each animal leaves the water at 0.019 of its leap cycle and falls back at 0.481; a fan stands
        // for 0.8 s where it did (the animal has since run on at our own speed)
        if (sprayOf.length) {
          const on = !sub && u > K1 - 0.008 && u < uDive - 0.012, per = 3.4, vS = path.length / DURATION, sv = sprayU.uSpl.value;
          for (let j = 0; j < sprayOf.length && j < 6; j++) {
            const so = sprayOf[j], f = time / per + so.ph;
            for (let e = 0; e < 2; e++) {
              const age = (((f - (e ? 0.48086 : 0.01914)) % 1 + 1) % 1) * per, v = sv[j * 2 + e];
              if (on && age < 0.8) { so.pod.route.pointAt(so.pod.uniforms.uTravel0.value - so.lag - vS * age, tmpP); v.set(tmpP.x + so.ox, tmpP.z + so.oz, j * 2 + e, age); } else v.w = -1;
            }
          }
        }
        // the pacers: each holds its station, slipping back and beating forward on its own cycle (see PACE; the world's
        // clock, read well at any phase), and sways with the sheet (the hero's own wave)
        for (let i = 0; i < PACE.length; i++) {
          const pa = PACE[i];
          if (!pa.pc) continue;
          if (sub) {
            const cyc = 6.2832 * (time / pa.period + pa.ph), adv = pa.surge * Math.sin(cyc), x = pa.q.x + pa.h.x * adv, y = pa.q.y, z = pa.q.z + pa.h.z * adv;
            const sw = pcSw.x * Math.sin(pcSw.y * (x * pcF.x + z * pcF.z) + pcSw.z * time + (x * pcF.z - z * pcF.x) * 0.035 + y * 0.06);
            pcE.set(-pa.pitch, pa.yaw + pcSw.w * 0.5 * Math.cos(pcSw.y * (x * pcF.x + z * pcF.z) + pcSw.z * time), pa.roll);
            pcM.makeRotationFromEuler(pcE).setPosition(x + pcF.z * sw, y, z - pcF.x * sw);
            // (its tail beats a little harder while it gains ground)
            pa.pc.place(pcM, true, 0.4 * Math.max(0, Math.cos(cyc)), 0, time * 3.6 + pa.beat0, 2.0);
          } else pa.pc.place(pcM, false);
        }
        // (polish pass) the exit's reef and dressing wait until the lens is within sight of them, the amphitheatre's
        // fusiliers leave when it is past; the sand rays glide their loops; the far canoes sail on
        const zc = camPos.z;
        exitReef.visible = zc < 10; exitG.visible = zc < 10; wallFish.visible = zc < 178 && zc > -55;
        if (sub && zc < 10) for (const r of sandRays) {
          const a = r.ph + time * r.w, x = r.cx + Math.cos(a) * r.rx, z = r.cz + Math.sin(a) * r.rz, vx = -Math.sin(a) * r.rx * r.w, vz = Math.cos(a) * r.rz * r.w, vl = Math.hypot(vx, vz) || 1;
          r.m.position.set(x, floorOf(z) - 30 + 1.0, z);
          r.m.rotation.set(-Math.atan((floorOf(z + vz / vl) - floorOf(z)) * 0.9), Math.atan2(vx, vz), 0.12 * Math.sin(time * 0.6 + r.ph));
        }
        for (const c of farCanoes) {
          const x = c.px + c.hx * 4.5 * time, z = c.pz + c.hz * 4.5 * time;
          c.m.position.set(x, 0.14, z); c.m.rotation.set(0.03 * Math.sin(time * 1.2 + c.px), c.yaw, -0.08 + 0.04 * Math.sin(time * 0.8 + c.pz)); c.u.value.set(x, z, c.hx, c.hz);
        }
        // one second of bubbles at the crossing
        bubbles.setOpacity(sub ? sstep(uDive - 0.004, uDive + 0.003, u) * (1 - sstep(uDive + 0.014, uDive + 0.034, u)) : 0);
        bubbles.update(dt, time, camera);
        if (heldCam) camera.matrixWorld.copy(camHold);
      },
      dispose() { sky.dispose?.(); smallFish.dispose(); tinyFish.dispose(); },
    };
  },
};
