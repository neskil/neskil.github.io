// THE MILKY SEA: a moonless night on the Arabian Sea. The whole ocean glows a steady pale jade,
// brighter than the sky, and lights a becalmed barque (src/parts/milky-sea.js) from underneath.
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the three seeded looks: 'edge' (teal glow, braided lanes, the black front off the
//                       port quarter, dolphins, tropicbirds), 'snow' (snowfield white, wind-rows, thin
//                       haze, mantas, terns), 'jade' (the brief's default: jade, braided lanes, whale
//                       shark, boobies). build() picks one with the first ctx.rng draw (seed 3 = jade,
//                       11 = snow, 7 = edge); ctx.vary.hour 'dawn' adds the indigo band astern (sky
//                       scatter), ctx.vary.rare stages the phosphorescent wheel (uWheel + hero.setGlowWave),
//                       ctx.vary.density and ctx.quality.detail scale rafts, squid, fish cloud, birds, snow.
//   2. GLSL             Q_NOISE (hash / value noise), SEA_VS / SEA_FS (the glowing sea, both sides; which side
//                       is drawn is the uniform uUnder, set in update from the camera, never a per-fragment
//                       test). seaMask(): the marble mask filtered by pixel footprint with fine dark filaments,
//                       and in the 'snow' mood the WIND-ROWS (slicks that wander in a warped domain, fork and
//                       die out). main(): cat's-paws, ripples, the SWELL (two short trains in sets with bent
//                       crests, and a long swell made of three trains 25 degrees apart, so no band is straight;
//                       troughs fall blue, and in 'snow' jade-blue water pools in them: uTrough), the RELIEF near the
//                       lens (seaRel: a short sea 6-10 m long read as slope along the line of sight), the forced
//                       PORTAL LANE (portalLane: pool under the jib-boom, braided thread, river past the ring,
//                       tributary, bright banks), the luminous corridor over the underwater route crossed by
//                       the two forced braided ENTRY LANES (entryLane), oar pools, swimmer shadow, dhow slicks,
//                       RIPPLE RINGS running out from the barque (ring1: distance from her middle in a bent
//                       field, phase on its root) and from every dhow (ring2, dhowRing; uDh[6] holds the six
//                       vessels); on the white 'snow' sea they are drawn as deeper blue water (rgs) and each
//                       crest has its own weight, broken into short arcs that die out within 75 m,
//                       portal mirror, wheel spokes (a gain on the water under them, so its ripples and swell
//                       lines show through), the "edge" (seaEdge(): no line, the glow thins over half a
//                       kilometre into holes, patches and a few lit wave tops; far away a compass bearing
//                       decides it over a third of the horizon); from below the same mask as a ceiling (its lanes
//                       soft-edged there, their outlines broken by ripple light and the caustic web) with a
//                       20 m marble octave of dark veins, fogging to a luminous seam at the horizon that
//                       makeBackdrop continues down into deep teal water),
//                       LIT (shared under-light for everything this file models), creature shaders.
//   3. Acc              tiny mesh accumulator (tube / quad / tri / box) used by every model below.
//   4. builders         makeSeaMesh, makeBackdrop, makeShark, makeMantas, makeSquid, makeFlyingFish
//                       (fish + their scratches, blue when fresh, one mesh), makeWeed (sargassum rafts),
//                       makeLongboat (+ rowers, oars, bow lantern), makeHawser, makeLensSheet (the surface passing
//                       over the lens at the break: the glowing layer from inside, with depth: bright under the
//                       crest, deep teal below, slanting streaks of light, a broken caustic net, a few blurred
//                       bubbles; one rounded crest, meniscus, a thin film and a few small beads under the
//                       horizon), makeDhows (six becalmed vessels, dark silhouettes carrying amber lanterns and lit
//                       panes: DHOWS in build gives their places and sizes: three on the horizon, the big NEAR DHOW
//                       70 m off the starboard beam, her tender lying off her side at the site's own seat, and
//                       THE QUARTER DHOW at the site's own seat for her, 150 m astern and 50 m to
//                       starboard; her hull is folded away by the camera's state for the whole underwater leg,
//                       because she lies within the water's sight distance of it), makeStarBand (the Milky Way: a low
//                       arch from the port bow over the
//                       ring to the starboard quarter, soft light with dust lanes under fine points in five
//                       rotated layers, + the glow off the sea at the horizon, drawn over the kit sky),
//                       makeSpray (the whales' splashes: a crown of streaked droplets and a veil of mist).
//   TWO MORE COLOURS    SH.uWarm (amber lantern light: hero lanterns, dhow lamps, longboat lantern, glow sprites
//                       from fx.makeGlows, and in SEA_FS the glitter path of eight lamps, uLamp) and SH.uBlue
//                       (disturbed water: swell-line troughs, slow blue-white patches, the ripple rings round
//                       every hull, dhow slick rims, oar pools, fish scratches, the whales' rings, uSpl).
//   5. build(ctx)       mood -> hero -> PATH (const PTS: entry point + hero.anchors.flyThrough, exit at
//                       hero.anchors.portalSeat; CUT and K(): the approach was shortened by 16 m, and every
//                       constant tuned on the longer route is written K(old u)) -> PLACES ON THE ROUTE (uOfPoint,
//                       abeam: where the lens passes a route point or comes abeam of a mast; T_LEVEL: a second
//                       of the design) -> sky (+ meteors) -> sea -> dhows -> cast -> POIS -> return.
//                       THE GAZE (POIS, at the end of build): under water two ordinary pois; from the break on,
//                       gazeA (the sweeping camera's whole gaze, a script of bearings and pitches turned at
//                       chosen rates) and gazeB (three pois that steer the steady camera only: the table GZ).
//                       The gaze is the site's own, and what it was written to look at stands as on the site: the
//                       near dhow and the quarter dhow (DHOWS[3], [4]), the cow (WHALES[0], her place and her
//                       moment), the swimmer's route (swimAt). What the round added is not placed from the gaze:
//                       every bird's flight is laid from places of the world
//                       or a place of the route, the bull from the lane and the route.
//                       UNDER WATER, LOWER HALF OF THE FRAME: the sardine ball, the mackerel river and the
//                       two sets of light shafts right after the marine snow (LIT_FISH, makeGodRays).
//                       The pieces the site's version added draw from `xr` (one stream of their own), never from
//                       ctx.rng, so what ctx.rng deals stays as it was, but for two things that are dealt anew
//                       against the site: the first bird of the 30 s pair (fork 'b4') and the dolphins (fork
//                       'dol'); the site's flock b3, whose fork of ctx.rng came before theirs, is gone. Each
//                       thing added since then (flocks b7,
//                       b8, the second bird of the pair, the six single birds of the last third, the bull) draws
//                       from a stream of its own, own(name), made from the world's seed and a name, so the forks
//                       of xr are dealt as on the site.
//                       The dark lane the portal stands in, its bright banks and the bright patch round
//                       the longboat are portalLane() in SEA_FS.
//                       HERO PLACEMENT: hero.object at the origin, unrotated (brief space == hero space).
//                       EXPOSURE / BLOOM / GRADE: the `post` object at the end of build().
//                       FOG: AIR_FOG / WATER_FOG just above update(); update() swaps them when the eye
//                       passes through the surface (hero.swellHeight) and hides the sky under water.
//   6. update()         scripted moments, all keyed to u (te = u * DUR seconds of flight). In flight order:
//                         0-7.5 s    swimmer (SWIMMER ROUTE, swimAt: the site's own route): high on the left at the
//                                    entry, then it glides down and the lens slides along its flank at 3.5-5 s (POIS turns
//                                    to it); the gaze otherwise rests just above the hull (KEEL_LOOK)
//                         6-9.5 s    up under the ceiling off the port quarter: the barque's hull from below (the
//                                    site's own form: black sternpost, shaped rudder, bar keel:
//                                    src/parts), the fish cloud forward of the post, weed overhead
//                         9.8 s      THE BREAK (BREAK_U, u 0.195): uSheet (the sea over the lens, the waterline falling down
//                                    the glass in 0.6 s, a few beads; clear 0.7 s after), uBurstA (flying fish), gaze on the main top; five
//                                    birds cross ahead of the lens at u 0.243; from u 0.215 gazeA: a forward look from
//                                    the port side, the ring under the sail stacks
//                         15-18.3 s  the slot, then out of the canvas, gaze on the NEAR DHOW (u 0.30-0.365; three birds
//                                    wheel over the water between her and the barque; her tender lies off her
//                                    side)
//                         18.3-21.6 s one pan clockwise (u 0.367-0.432) from the near dhow to the ship from astern; THE
//                                    QUARTER DHOW (150 m astern and 50 m to starboard, her own birds wheeling over her
//                                    masthead) crosses the frame in the pan
//                         21.6-27.8 s round the quarter and stern, 40 m off: the whole ship, the ring clear
//                                    of her rig to starboard of the sail stacks (the hero's loop); five birds fly
//                                    up her starboard side
//                         27.8-34.9 s the top run: the gaze goes 25 degrees down the centreline (u 0.545-0.60), then
//                                    out to the water off the starboard bow where the cow breaches (u 0.63-0.695;
//                                    WHALES: she leaves the sea at 33.2 s, rolled toward the lens).
//                                    30 s: THE PAIR crosses 7 m ahead of the lens, bellies to the lens
//                         34.9-42.3 s the swoop: the lens tips abeam of the fore mast with the cow in the air off the
//                                    starboard bow (the top of her arc at u 0.703, fallen back at 36.2 s, the crown
//                                    of spray still standing); from u 0.70 the gaze goes to the ring (the
//                                    bearing swings to it first, the pitch follows; it is there by u 0.84); three
//                                    birds stoop with the lens past the jib-boom end (38.7 s), her calf leaps by the
//                                    dark lane (in the air 37.9-39.9 s)
//                         42.3-50 s  the final run: THE BULL leaves the sea at 42.3 s on the starboard bow, heading
//                                    across it (in the air to 45.1 s, to the right of the ring; three birds cross the
//                                    lane over the ring's top as he tops his arc); seaU.uSpl ages (SPL_U) drive spray
//                                    and rings; flying fish glide up beside the lens (bursts from 41.5 s); the ring
//                         uSwim (x, z, heading, strength) swimmer shadow off the starboard bow (sea material)
//                         uBurstB (flying-fish clocks on the final run: BURSTS[i].u)
//                       ambient loops on time: swell, lanes drifting, cat's-paws, ripples, rings, oars
//                       (uStroke), hawser, weed, squid, fish cloud, birds, snow, stars, wheel (rare).
//
// Loading: build() yields between every kit call and builder (no step over ~30 ms); update() reads the
// camera's world matrix, never camera.position (the camera behind a portal).
// Engine / kit notes: the kit ocean cannot be a light source and the kit underwater volume fights the
// inverted light, so the sea, its underside, the abyss backdrop and the fog swap are this file's own.
// Kit creatures take a light object whose 'sun' points straight DOWN (UNDER_LIGHT). Kit pieces used: sky.makeSky (night, moon removed),
// fauna.makeFlock / makeFishSchool / makeDolphins / makeWhale, fx.makeParticles (marine snow), fx.makeGodRays (shafts
// under water), fx.makeShootingStars, fx.makeGlows (lantern sprites). Whales and the birds that cross the flight use the kit's
// `cross` with a stand-in path object (fakePath) so their routes sit at fixed world places and stay keyed to u.
// Kit workarounds in build(): the kit whale has no roll, so the cow rolls by `bank` on a bowed route; and the kit
// shades each whale 0.9..1.08, which above 1 turns its fin glow negative, so iTint is clamped to 1 here.
// THE FLOCK CURE (10 Oct): every bird keeps 2.3 m of clear air from the flown line by place: the wheels b1, b2 and b6 are laid off it by room() and roof() in build(), and the five that cross after the break are held within three scatters (maxSigma).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/milky-sea.js';

const DUR = 50;
// ---------------------------------------------------------------- 1. seeded moods
const MOODS = [
  { key: 'edge', title: 'The Edge of the Milky Sea', pal: ['#A4ECEE', '#4DBCC8', '#0D3E4C', '#06061C', '#2E2C4E', '#020506', '#FF3B2A'],
    pattern: 0, edge: 1, haze: 0, cast: 'dolphin', birds: 'tropic', horizon: '#081920', portal: '#CFF4F7', dusk: '#4A4152' },
  { key: 'snow', title: 'The Milky Sea: Snowfield', pal: ['#D8F0E6', '#93C9B6', '#1D4B49', '#08071C', '#35314C', '#020506', '#FF3B2A'],
    pattern: 1, edge: 0, haze: 1, cast: 'manta', birds: 'tern', horizon: '#1F4541', portal: '#E6F6F0', dusk: '#504453' },
  { key: 'jade', title: 'The Milky Sea', pal: ['#B8F2D6', '#5FCBA4', '#124A45', '#07061A', '#302B4A', '#020506', '#FF3B2A'],
    pattern: 0, edge: 0, haze: 0, cast: 'shark', birds: 'booby', horizon: '#10282A', portal: '#CFF7E6', dusk: '#4E4152' },
];

// ---------------------------------------------------------------- 2. GLSL
const Q_NOISE = /* glsl */`
float qH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float qN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(qH(i), qH(i + vec2(1.,0.)), f.x), mix(qH(i + vec2(0.,1.)), qH(i + vec2(1.,1.)), f.x), f.y);
}
float qF2(vec2 p){ return 0.62*qN(p) + 0.38*qN(p*2.07 + 9.1); }
float qF3(vec2 p){ return 0.55*qN(p) + 0.28*qN(p*2.03 + 17.3) + 0.17*qN(p*4.1 + 31.7); }
`;

const SEA_VS = (swell) => /* glsl */`
${swell}
uniform float uRadius;
varying vec3 vW;
void main(){
  vec3 wp = vec3(position.x + cameraPosition.x, 0.0, position.z + cameraPosition.z);
  float r = length(position.xz);
  wp.y = msSwell(wp.xz)*(1.0 - smoothstep(600.0, 1500.0, r));
  wp.y = mix(wp.y, cameraPosition.y, step(uRadius*0.97, r)*step(0.0, cameraPosition.y));      // above water the last ring rises to eye level: no gap under the horizon (under water it would be an edge-on bright sliver)
  vW = wp;
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`;

const SEA_FS = (swell) => /* glsl */`
${swell}
${Q_NOISE}
uniform float uTime, uPattern, uRadius, uStroke, uUnder;      // uUnder: 1 while the camera is below the surface (set in update)
uniform vec3 uBright, uLane, uFar, uPortalCol;
uniform vec4 uUFog;      // rgb underwater haze, a density
uniform vec4 uEdge;      // xy centre, z radius, w on
uniform vec4 uBoat;      // x, z, on, -
uniform vec4 uSwim;      // x, z, heading, strength
uniform vec4 uSwimK;     // kind (0 shark, 1 mantas), -, -, -
uniform vec4 uPortal;    // x, y, z, radius
uniform vec4 uWheel;     // hub x, hub z, amount, phase
uniform vec2 uWind, uOff;
uniform vec4 uDh[6];                     // the six vessels: x, z, cos(heading)/k, sin(heading)/k (k: the size of her slick and rings, 1 for a full-size dhow)
uniform vec3 uBlue, uWarm, uTrough;      // the second colours: disturbed water (blue-white), lantern light (amber); uTrough: the jade-blue that pools in the troughs (wind-row mood)
uniform vec4 uLamp[8];                   // lanterns whose light lies on the water: xyz, strength
uniform vec4 uSpl[6];                    // where the three whales leave and re-enter the sea: x, z, age (s), size
varying vec3 vW;

// 1 = bright milky water, 0 = dark eddy lane
float seaMask(vec2 p, float fp){
  p += uOff;
  vec2 dr = vec2(uTime*0.0035, -uTime*0.0026);
  vec2 w = vec2(qF2(p/640.0 + dr), qF2(p/640.0 + 5.2 - dr));
  float f = qF3(p/430.0 + 1.9*(w - 0.45) + vec2(0.0, 3.1));
  float g = qF2(p/52.0 - 1.4*w + uTime*0.005);
  float gf = 1.0 - smoothstep(6.0, 40.0, fp);                 // the 52 m break-up fades with the pixel footprint
  float v = f + 0.085*(g - 0.5)*gf;
  float wid = 0.014 + 0.042*qN(p/520.0 + 7.7), we = 0.004*fp + 0.011*uUnder;   // band edges soften both ways with the footprint (keeps the mean); from below a lane is a gap in a glowing layer 5 m thick, so its edge is wide and soft
  float b1 = smoothstep(wid*0.55 - we, wid*1.1 + we, abs(v - 0.455));
  float b2 = smoothstep(wid*0.25 - we, wid*0.6 + we, abs(v - 0.60));
  float braid = min(b1, b2);
  // WIND-ROWS (pattern 1): slicks that wander, fork and die out. The row coordinate is read in a domain warped at
  // three scales, so no row runs straight for more than a ship's length; where fk opens a row splits into two
  // about its own centre (a fork), every row fades in and out along its length, and whole reaches of sea carry none
  vec2 wd = uWind, wn = vec2(-wd.y, wd.x);
  vec2 pw = p + 44.0*(vec2(qF2(p/240.0 + 3.1), qF2(p/240.0 + 8.6)) - 0.5) + 26.0*(vec2(qN(p/117.0 + 4.4), qN(p/117.0 + 2.9)) - 0.5) + 16.0*(vec2(qN(p/63.0 + 1.7), qN(p/63.0 + 6.3)) - 0.5);
  float s = dot(pw, wn)/22.0 + 0.5*(qN(p/29.0) - 0.5), rid = floor(s), rx = fract(s) - 0.5, al = dot(pw, wd);
  float fk = 0.25*smoothstep(0.42, 0.7, qN(vec2(al/90.0 + rid*1.9, rid*5.1)));
  float rr = abs(abs(rx) - fk)*2.0;
  float brk = smoothstep(0.2, 0.52, qN(vec2(al/70.0 + rid*3.7, rid*7.3)))*smoothstep(0.2, 0.44, qF2(p/330.0 + 12.0));
  float soft = 1.0 - smoothstep(2.5, 11.0, fp);
  float rw = 0.12 + 0.28*qN(p/83.0 + 4.0);                                              // uneven width
  float rows = 1.0 - (0.6*(1.0 - smoothstep(0.02, rw, rr))*brk*soft + 0.06*(1.0 - soft));
  float m = mix(braid, min(rows, mix(1.0, b2, 0.9)), uPattern);
  m *= 1.0 - 0.14*gf*(1.0 - smoothstep(0.3, 0.7, g));
  // fine marbling inside the bright water: thin dark filaments that curl in patches (melt with the footprint)
  vec2 w2 = vec2(qN(p/57.0 + 3.7), qN(p/57.0 + 9.2)) - 0.5;
  float hf = qF2(p/88.0 + 1.6*w2 + 0.8*w + dr*3.0);
  float fil = max(1.0 - smoothstep(0.010, 0.032, abs(hf - 0.5)), 0.7*(1.0 - smoothstep(0.008, 0.024, abs(hf - 0.62))));
  m *= 1.0 - 0.5*fil*(1.0 - smoothstep(1.5, 9.0, fp))*smoothstep(0.3, 0.62, qN(p/150.0 + 2.0))*(1.0 - 0.6*uPattern);
  // far away the lanes average out: radiance settles to the mean
  m = mix(m, 0.7, smoothstep(22.0, 160.0, fp));
  return m;
}
// x: 1 inside the dark lane the portal stands in: a small pool under and to port of the jib-boom (it backs the
// headsails seen from the swoop, which comes down their starboard side), a thread of two strands weaving round bright eyes along the final run, swelling by the ring
// into a river 60 m wide that runs on past it toward the horizon, braiding round islands, with a tributary
// coming in from starboard. y: 1 where the water is kept bright (both banks, round the longboat and her trail)
vec2 portalLane(vec2 p){
  if (p.y > 4.0 || p.y < -1000.0 || abs(p.x) > 420.0) return vec2(0.0);
  vec2 ws = vec2(qN(p/23.0) - 0.5, qN(p/23.0 + 4.7) - 0.5)*13.0;
  vec2 wl = vec2(qF2(p/105.0 + 3.3) - 0.5, qF2(p/105.0 + 8.1) - 0.5)*56.0;
  vec2 a = p + ws; float z = a.y;
  float wide = smoothstep(-84.0, -132.0, z), bey = smoothstep(-190.0, -290.0, z);
  float cx = 2.0 + 5.0*sin(z/27.0 + 0.6)*(1.0 - bey) + bey*(30.0*sin((z + 205.0)/135.0) + 0.45*wl.x);
  float d = a.x - cx + 0.3*wl.x*wide*(1.0 - bey);
  float wv = 4.6*sin(z/9.5 + 1.0 + 3.0*qN(vec2(z/29.0, 2.7)))*(1.0 - wide), wv2 = 4.0*sin(z/12.7 + 2.2 + 3.0*qN(vec2(z/23.0, 8.1)))*(1.0 - wide);
  float hw = mix(2.6 + 1.2*sin(z/13.0), 29.0 + 7.0*sin(z/47.0 + 1.0), wide), sf = 1.4 + 6.0*wide + 9.0*bey;
  float river = max(1.0 - smoothstep(hw, hw + sf, abs(d - wv)), 1.0 - smoothstep(hw*0.7, hw*0.7 + sf, abs(d + wv2)));
  river *= smoothstep(-50.0, -58.0, z)*(1.0 - smoothstep(-560.0, -900.0, z));
  float zc = (z + 215.0)/118.0, zz = fract(zc) - 0.5, ox = (qH(vec2(floor(zc), 3.0)) - 0.5)*24.0;
  vec2 ei = vec2((d - ox)/(0.42*hw), zz/0.36);
  river *= 1.0 - 0.92*(1.0 - smoothstep(0.55, 1.0, dot(ei, ei)))*smoothstep(-200.0, -230.0, z);       // islands: the river braids
  vec2 pq = (a - vec2(-3.5, -45.0))/vec2(10.0, 14.5);
  float pool = 1.0 - smoothstep(0.55, 1.1, dot(pq, pq));
  float tx = a.x - 14.0, tz = z + 124.0 - 0.0011*tx*tx, tw = 5.0*sin(tx/15.0);
  float trib = max(1.0 - smoothstep(3.5, 7.5, abs(tz - tw)), 1.0 - smoothstep(2.5, 6.0, abs(tz + tw + 2.0)))*smoothstep(0.0, 16.0, tx)*(1.0 - smoothstep(170.0, 330.0, tx));
  float lane = max(max(river, pool), 0.9*trib)*(0.84 + 0.16*qN(p/31.0 + 2.2));
  float bank = (1.0 - smoothstep(hw + 16.0, hw + 44.0, abs(d)))*smoothstep(-50.0, -72.0, z)*smoothstep(-330.0, -230.0, z);
  vec2 bq = (a - vec2(-17.0, -68.0))/vec2(15.0, 48.0); bq *= bq;
  float boat = exp(-bq.x - bq.y*bq.y);
  return vec2(lane, max(bank, boat)*(1.0 - lane));
}
// the dark slick a becalmed dhow lies in (1 inside)
float dhowSlick(vec2 p, vec4 dh){
  vec2 q = p - dh.xy; q = vec2(dh.z*q.x - dh.w*q.y, dh.w*q.x + dh.z*q.y)/vec2(5.2, 17.0);
  return 1.0 - smoothstep(0.5, 1.25, dot(q, q));
}
// forced dark braided lanes (1 inside): two cross the entry corridor between the entry point and the hull,
// each two strands that weave round bright eyes. They keep clear of everything forward of the surface
// break (z < 30), which must stay bright for the break frame and the flying fish's scratches.
float strand(float d, float hw, float fp){ return 1.0 - smoothstep(hw - 1.6*uUnder, hw + 2.2 + fp + 5.5*uUnder, abs(d)); }      // (from below: soft over 9 m)
float entryLane(vec2 p, float fp){
  if (abs(p.x + 45.0) > 150.0 || abs(p.y - 50.0) > 110.0) return 0.0;
  vec2 a = p + (vec2(qN(p/17.0 + 2.3), qN(p/17.0 + 7.9)) - 0.5)*6.0 + (vec2(qF2(p/61.0 + 1.7), qF2(p/61.0 + 6.1)) - 0.5)*9.0;
  float wv = 5.0*sin(a.x/12.5), wv2 = 5.0*sin(a.x/12.5 + 0.9);
  float x1 = a.x + 56.0, x2 = a.x + 22.0;
  float d1 = (a.y - (92.0 - 0.197*x1 - 0.157*(sqrt(x1*x1 + 900.0) - 30.0)))*0.95;      // bends from E-W to run in toward the stern
  float d2 = (a.y - (61.0 + 0.38*(sqrt(x2*x2 + 484.0) - 22.0) - 0.04*x2))*0.93;         // a shallow V with its point astern of the break
  float l1 = max(strand(d1 - wv, 3.0, fp), strand(d1 + wv2, 2.1, fp))*smoothstep(-185.0, -130.0, a.x)*(1.0 - smoothstep(35.0, 80.0, a.x));
  float l2 = max(strand(d2 + wv, 3.1, fp), strand(d2 - wv2, 2.2, fp))*smoothstep(-150.0, -105.0, a.x)*(1.0 - smoothstep(25.0, 60.0, a.x));
  return max(l1, l2)*(1.0 - smoothstep(4.0, 14.0, fp));
}
// distance from a dhow for the rings that run out from her (slightly long ellipses that round off with distance)
float dhowRing(vec2 p, vec4 dh){
  vec2 q = p - dh.xy; q = vec2(dh.z*q.x - dh.w*q.y, dh.w*q.x + dh.z*q.y);
  return length(vec2(q.x*1.35, q.y) ) + 1e-3;
}
// THE EDGE of the milky sea ('edge' mood, uEdge.w): how much of the glow is left, 1 inside .. 0 black water. There is
// no line anywhere: the front wanders by a couple of hundred metres, across it the milk thins over some 500 m
// (from 190 m off the port quarter) and opens into holes of darker water, and beyond it the glow lives on in
// drifting patches and streamers for another few hundred metres (main() adds a few wave tops that still catch light out there, and a far field decided by direction)
float seaEdge(vec2 p, float t, float fp, float dist){
  float near = 1.0 - smoothstep(25.0, 110.0, fp), mid = 1.0 - smoothstep(350.0, 900.0, dist);      // (mid: the wander and the patches live within some 600 m of the lens; further off one pixel row is deeper than they are, and they drew slivers one pixel tall on the black water beyond the front)
  float ew = 170.0*(qF2(p/460.0 + vec2(t*0.003, 0.0)) - 0.5)*(1.0 - smoothstep(30.0, 120.0, fp))*mid + 60.0*(qF2(p/140.0 - vec2(0.0, t*0.005)) - 0.5)*near*mid;
  float ed = length(p - uEdge.xy) - uEdge.z + ew;
  float fall = 1.0 - smoothstep(-110.0, 380.0, ed);
  float pn = qF2(p/110.0 + vec2(-t*0.006, t*0.004) + 31.0);
  float pat = smoothstep(0.5, 0.72, pn)*(1.0 - smoothstep(60.0, 760.0, ed))*near*mid;
  float mot = mix(1.0, 0.45 + 0.9*smoothstep(0.3, 0.62, pn), smoothstep(-80.0, 200.0, ed)*near);
  return clamp(max(fall*mot, 0.8*pat), 0.0, 1.0);
}
// wind ripples. Each octave is read on its own turned grid (31 and 74 degrees off the keel line): value noise keeps a
// trace of its lattice, and on an unturned grid that trace is a set of lines parallel to the ship, which from the
// masthead beat against the pixels into ruler-straight bands fanning to the horizon
// RELIEF near the lens: a low short sea, three trains 6 to 10 m long with bent crests (0..1). main() reads its slope
// along the line of sight
float seaRel(vec2 p, float t){
  float a = sin(dot(p, vec2(0.52, 0.31)) - t*1.25 + 2.0*qN(p/19.0)), b = sin(dot(p, vec2(-0.21, 0.78)) - t*1.5 + 2.0*qN(p/13.0 + 4.0)), c = sin(dot(p, vec2(0.95, -0.55)) - t*1.9 + 1.7);
  return 0.5 + 0.22*a + 0.17*b + 0.11*c;
}
float rip(vec2 p, float n1, float n2, float t){
  vec2 pa = vec2(0.857*p.x - 0.515*p.y, 0.515*p.x + 0.857*p.y), pb = vec2(0.276*p.x - 0.961*p.y, 0.961*p.x + 0.276*p.y);
  return n1*qN(pa*0.85 + vec2(t*0.5, t*0.12)) + 0.55*n2*qN(pb*2.9 - vec2(t*0.3, t*0.8));
}
void main(){
  vec2 p = vW.xz; float t = uTime;
  float fp = max(length(dFdx(p)), length(dFdy(p)));
  vec3 Vv = vW - cameraPosition; float dist = length(Vv); vec3 Vd = Vv/max(dist, 1e-3);
  float m = seaMask(p, fp);
  vec2 pl = portalLane(p);
  // the underwater corridor stays luminous (only the two entry lanes cross it) and so does the sea at the break
  vec2 cq = p - vec2(-88.0, 154.0), cdir = vec2(0.4845, -0.8748);
  float corr = 1.0 - smoothstep(30.0, 68.0, length(cq - cdir*clamp(dot(cq, cdir), 0.0, 165.0)) + 16.0*(qN(p/43.0 + 5.5) - 0.5));
  m = max(m, 0.8*corr);
  m = min(m, 1.0 - mix(0.93, 0.8, uUnder)*entryLane(p, fp));
  m = max(m, 0.85*(1.0 - smoothstep(14.0, 28.0, length(p - vec2(-21.0, 36.0)))));
  m = max(m, 0.9*pl.y);
  m = min(m, 1.0 - 0.96*pl.x);
  float fl = min(length(dFdx(p)), length(dFdy(p)));              // the footprint across the line of sight
  float n1 = (1.0 - smoothstep(0.5, 2.4, fp))*(1.0 - smoothstep(0.2, 0.42, fl)), n2 = 1.0 - smoothstep(0.12, 0.7, fp);      // the ripples melt before their grid can beat against the pixels
  vec2 e2 = Vv.xz/max(length(Vv.xz), 1e-3);
  float cat = smoothstep(0.5, 0.68, qF2(p/78.0 + vec2(t*0.019, t*0.006) + 9.0));
  float h0 = rip(p, n1, n2, t), h1 = rip(p + e2*0.4, n1, n2, t);
  float slope = (h1 - h0)/0.4;
  vec3 col;
  if (uUnder < 0.5) {            // by which side the camera is on, never per fragment (under MSAA a sample past the horizon ring's top edge would take the other branch: a dashed teal hairline)
    // ---------------- from above: the sea is the light
    col = mix(uLane, uBright, m);
    float nf = 1.0 - smoothstep(9.0, 45.0, fp);                 // 70-80 m features melt before they can alias at the horizon
    col *= 1.0 - (0.3 + 0.1*uPattern)*cat*nf;
    col *= 1.0 + (0.26 + 0.4*cat)*clamp(slope*1.25, -1.0, 0.6);
    col *= 1.0 + 0.22*msSwell(p)*nf;
    // WATER, not snow: two crossing trains of swell lines travel through the glow (crests catch it, troughs
    // fall blue), and slow patches of brighter blue-white breathe through the milk
    // (the crests are read in a warped domain, so no line is straight, and each train comes in sets a few crests
    // long that travel with it at the group speed; in the wind-row mood they bend more)
    float bend = 1.0 + 0.6*uPattern;
    vec2 ps = p + bend*(17.0*(vec2(qN(p/97.0 + 2.0), qN(p/97.0 + 7.4)) - 0.5) + 5.0*(vec2(qN(p/33.0 + 5.0), qN(p/33.0 + 1.2)) - 0.5));
    float wq = 2.4*(qN(p/47.0 + 2.0) - 0.5);
    float w1 = 0.5 + 0.5*sin(dot(ps, vec2(0.19, 0.53)) - t*0.95 + wq), w2 = 0.5 + 0.5*sin(dot(ps, vec2(0.262, 0.262)) - t*0.7 - 1.7*wq);
    float g1 = smoothstep(0.28, 0.6, qN(vec2(dot(ps, vec2(0.19, 0.53))/31.0 - t*0.015, dot(ps, vec2(-0.53, 0.19))/40.0) + 3.0));
    float g2 = smoothstep(0.28, 0.6, qN(vec2(dot(ps, vec2(0.262, 0.262))/22.0 - t*0.013, dot(ps, vec2(-0.262, 0.262))/36.0) + 8.0));
    float am = smoothstep(0.35, 0.65, qN(p/83.0 + 6.0));              // the two short trains take turns (crossing at full strength they bead into an egg-crate)
    // the long swell is three trains 25 degrees apart (crests across the keel line), read in a domain that wanders by more than a wavelength: their
    // crests are short, they fork where one train slips past another and they come in sets (one straight train
    // would rule the whole sea into parallel bands fanning to the horizon)
    vec2 p3 = ps + 52.0*(vec2(qF2(p/330.0 + 15.0), qF2(p/330.0 + 19.4)) - 0.5);
    float Lw = 0.5*sin(dot(p3, vec2(0.042, 0.181)) - t*0.52 + 1.3*wq) + 0.38*sin(dot(p3, vec2(0.088, 0.123)) - t*0.47 + 1.7) + 0.32*sin(dot(p3, vec2(-0.052, 0.207)) - t*0.58 + 4.1);
    float w3 = smoothstep(-0.8, 0.8, Lw);
    float l3 = (1.0 - smoothstep(5.0, 20.0, fp))*(0.45 + 0.55*smoothstep(0.25, 0.7, qN(p/140.0 + 3.0)));
    float swl = 0.9*am*g1*(1.0 - smoothstep(1.2, 4.5, fp))*(w1*w1 - 0.375) + 0.8*(1.0 - am)*g2*(1.0 - smoothstep(2.0, 7.5, fp))*(w2*w2 - 0.375) + 0.5*l3*(w3*w3 - 0.375);
    swl *= 1.0 - 0.5*cat;
    col *= 0.9*(1.0 + 0.52*swl);
    // RELIEF: near the lens the milk is water with a surface. The short sea is read as slope along the line of sight:
    // faces tilted toward the eye are lighter, their backs fall darker and bluer, and every crest carries a thin
    // brighter line (it melts with the footprint, so from the masthead the sea is the marbled sheet again)
    float rn = (1.0 - smoothstep(0.22, 1.7, fp))*(1.0 - 0.5*cat);
    vec2 prl = 0.5*(ps + p);
    float hA = seaRel(prl, t), rs = (seaRel(prl + e2*0.9, t) - hA)/0.9;
    col *= 1.0 + rn*(0.36*clamp(rs*1.5, -1.0, 1.0) + 0.15*smoothstep(0.66, 0.95, hA));
    col = mix(col, col*vec3(0.68, 0.94, 1.15), rn*clamp(-rs*1.3, 0.0, 0.55));
    // troughs fall blue; in the wind-row mood darker jade-blue water pools in the troughs of the long swell
    float tpool = uPattern*l3*smoothstep(-0.15, -0.7, Lw)*(0.55 + 0.45*smoothstep(0.3, 0.62, qF2(p/115.0 + vec2(t*0.006, 0.0) + 21.0)));
    col = mix(col, col*vec3(0.62, 0.92, 1.2), clamp(-swl*2.2, 0.0, 0.75));
    col = mix(col, uTrough*(0.8 + 0.3*h0), clamp(0.75*tpool + uPattern*clamp(-swl*1.3, 0.0, 0.3), 0.0, 0.66)*m);
    col *= mix(vec3(1.0), vec3(0.84, 1.0, 1.1), smoothstep(0.3, 0.8, qN(p/270.0 + 11.0))*nf);                 // slow drift of hue: jade here, bluer there
    // slow patches of brighter blue-white breathe through the milk, and broken ribbons of light curl round them
    // (open arcs: a ribbon dies out before it can close into a loop)
    vec2 pq2 = p/41.0 + 0.9*(vec2(qN(p/88.0 + 14.0), qN(p/88.0 + 3.0)) - 0.5);
    float pu = qF2(pq2 + vec2(t*0.03, -t*0.021) + 4.0);
    float ribbon = (1.0 - smoothstep(0.012, 0.05 + 0.004*fp, abs(pu - 0.5)))*smoothstep(0.42, 0.62, qN(p/31.0 + vec2(-t*0.02, t*0.013) + 13.0));
    float pulse = max(0.6*smoothstep(0.56, 0.72, pu), ribbon);
    pulse *= (0.55 + 0.45*sin(t*0.45 + 6.0*qN(p/190.0)))*m*(1.0 - smoothstep(6.0, 30.0, fp));
    col = mix(col, mix(uBlue, vec3(1.0), 0.38)*(0.86 + 0.2*h0), 0.55*pulse);
    float blue = 0.0;
    // phosphorescent wheel (rare): twelve broad curved spokes turning about a hub off the starboard bow
    vec2 hv = p - uWheel.xy; float hr = length(hv), ha = atan(hv.y, hv.x + 1e-4);
    float sp = smoothstep(0.4, 0.74, 0.5 + 0.5*cos(12.0*ha + hr/220.0 - uWheel.w)), wk = uWheel.z*smoothstep(30.0, 160.0, hr);
    sp = mix(sp, 0.4, smoothstep(14.0, 70.0, fp));               // the spokes melt into their mean before they can alias
    col *= 1.0 - 0.42*wk*(1.0 - sp);
    col *= 1.0 + 0.32*wk*sp*(1.0 - pl.x);                         // a spoke is brighter WATER: a gain, so ripples, swell lines, troughs and cat's-paws show through it
    // soft multiply decals: longboat slick, the two dotted rows of oar pools, the swimmer 2 m down
    float dark = 0.0;
    vec2 bq = p - uBoat.xy;
    dark += uBoat.z*0.5*exp(-(bq.x*bq.x)/5.3 - (bq.y*bq.y)/30.0);
    float cz = bq.y/4.3 - uStroke, lz = (fract(cz + 0.5) - 0.5)*4.3;
    float age = clamp(bq.y/60.0, 0.0, 1.0), pr = 0.75*(1.0 + 0.9*age);
    float px = abs(bq.x) - 2.9 - 0.8*age;
    float pool = exp(-(px*px + lz*lz)/(pr*pr))*(1.0 - age)*step(0.5, bq.y);
    dark += uBoat.z*0.72*pool;
    float pr2 = sqrt(px*px + lz*lz) - pr;
    blue += uBoat.z*0.9*exp(-pr2*pr2/0.1)*(1.0 - age)*(1.0 - age)*step(0.5, bq.y)*n1;       // each oar pool is rimmed blue where the blade stirred it
    float ch = cos(uSwim.z), sh = sin(uSwim.z);
    vec2 sq = p - uSwim.xy; sq = vec2(ch*sq.x - sh*sq.y, sh*sq.x + ch*sq.y);       // x across, y along (head at -y)
    float kind = uSwimK.x, body, spots;
    if (kind < 0.5) {
      float lx = sq.x + 0.7*sin(t*1.25 - sq.y*0.55)*smoothstep(0.5, 4.6, sq.y);
      float zz = clamp(sq.y/4.7, -1.0, 1.0);
      float hw2 = 1.2*pow(max(1.0 - zz*zz, 0.0), 0.62)*(1.0 - 0.35*smoothstep(0.0, 1.0, zz));
      float fin = max(0.0, 1.0 - abs(sq.y + 1.1 - 0.45*abs(lx))/0.75)*step(abs(lx), 2.9);
      float tail = max(0.0, 1.0 - abs(sq.y - 4.4)/0.9)*step(abs(lx), 1.5 - 0.6*abs(sq.y - 4.4));
      body = max(max(smoothstep(hw2 + 0.3, hw2 - 0.3, abs(lx))*step(abs(sq.y), 4.7), fin*0.85), tail*0.8);
      vec2 g2 = vec2(lx, sq.y)*1.9; float ds = length(fract(g2) - 0.5);
      spots = (1.0 - smoothstep(0.12, 0.26, ds))*smoothstep(hw2, hw2*0.3, abs(lx));
    } else {
      float fl = 1.0 + 0.1*sin(t*1.9);
      vec2 a = vec2(sq.x - 3.6, sq.y), b = vec2(sq.x + 3.4, sq.y - 5.0);
      float xa = min(abs(a.x)/(2.7*fl), 1.0), xb = min(abs(b.x)/(2.6*fl), 1.0);
      float ma = smoothstep(0.0, 0.3, a.y + 1.05 - 0.95*xa*sqrt(xa))*smoothstep(0.0, 0.3, 1.0 - 1.1*sqrt(xa) - a.y)*step(abs(a.x), 2.7*fl);
      float mb = smoothstep(0.0, 0.3, b.y + 1.0 - 0.9*xb*sqrt(xb))*smoothstep(0.0, 0.3, 0.95 - 1.05*sqrt(xb) - b.y)*step(abs(b.x), 2.6*fl);
      float ta = exp(-a.x*a.x/0.012)*smoothstep(0.6, 1.0, a.y)*(1.0 - smoothstep(2.6, 3.4, a.y));
      float tb2 = exp(-b.x*b.x/0.012)*smoothstep(0.6, 1.0, b.y)*(1.0 - smoothstep(2.4, 3.2, b.y));
      body = max(max(ma, mb), 0.6*max(ta, tb2)); spots = 0.0;
    }
    dark += uSwim.w*body*(0.86 - 0.38*spots);
    float dsl = 0.0, rdh = 1.0e5;
    for (int i = 0; i < 6; i++) { dsl = max(dsl, dhowSlick(p, uDh[i])); if (i < 5) rdh = min(rdh, dhowRing(p, uDh[i])); }      // (the tender, the last, lies in a slick but sends out no rings of her own)
    dark += 0.66*dsl;
    blue += 2.2*dsl*(1.0 - dsl)*(0.55 + 0.45*sin(t*0.62 + p.x*0.37 + 4.0*qN(p*0.21)));           // the slick's rim brightens blue as the hull rolls
    // the barque: every roll sends a blue ripple out from her waterline
    float hf = pow(abs(p.x)/5.3, 2.2) + pow(abs(p.y + 0.3)/29.5, 2.6);
    float hd = (pow(max(hf, 1e-4), 0.42) - 1.0)*5.3;
    blue += 0.38*smoothstep(0.55, 1.0, sin(hd*2.1 - t*1.6 + 2.5*qN(p*0.27)))*smoothstep(1.0, 4.0, hd)*(1.0 - smoothstep(4.0, 11.0, hd))*n1;
    // and soft, widening rings run on out from her and from every dhow (each filtered by its own phase footprint)
    // (a distance from her middle in a slowly bent field, all but circles: seen from astern or from the masthead,
    // any stretch of ring that ran straight along her side would fan out in perspective like ruled rays)
    vec2 pr1 = vec2(p.x, p.y + 0.3) + 10.0*(vec2(qN(p/47.0 + 5.3), qN(p/47.0 + 9.1)) - 0.5);
    float hc = length(vec2(pr1.x, max(abs(pr1.y) - 3.0, 0.0)));
    // (the phase runs on the root of the distance: the rings widen as they travel, 5 m apart by the hull, 13 m
    // apart 100 m out, and reach far enough to be seen from the masthead, curving round the bows)
    float ph1 = 10.0*sqrt(hc + 4.0) - t*1.4 + 1.6*qN(p*0.09 + 3.0);
    float arc1 = 0.5 + 0.5*smoothstep(0.3, 0.62, qN(p/57.0 + vec2(0.0, t*0.02) + 17.0));      // long arcs: cut short they stop reading as rings and turn into streaks
    // she pitches, so the ripples leave her ahead and astern and die out abeam: from astern and from the masthead
    // the steep flanks of rings centred under the lens would read as rays fanning from the hull, their crowns as arcs
    arc1 *= smoothstep(0.3, 0.72, abs(pr1.y)/max(hc, 1.0));
    // (on the white 'snow' sea evenly ruled rings read as contour lines: there each crest has its own weight, some
    // are missing, the arcs are cut shorter and they die out within 75 m)
    float crw = mix(1.0, smoothstep(0.22, 0.6, qH(vec2(floor(ph1/6.2832)*3.7, 1.0)))*(0.45 + 0.75*qN(p/23.0 + 41.0)), uPattern);
    arc1 = mix(arc1, arc1*smoothstep(0.42, 0.6, qN(p/37.0 + vec2(t*0.02, 0.0) + 29.0)), uPattern);
    float ring1 = smoothstep(0.5, 0.97, sin(ph1))*smoothstep(13.0, 19.0, hc)*(1.0 - smoothstep(40.0, mix(112.0, 75.0, uPattern), hc))*arc1*crw*(1.0 - smoothstep(1.2, 2.8, fwidth(ph1)));
    float ph2 = rdh*0.32 - t*0.8 + 1.4*qN(p*0.05 + 6.0);
    float arc2 = 0.3 + 0.7*smoothstep(0.28, 0.58, qN(p/41.0 + vec2(t*0.03, 0.0) + 23.0));
    float crw2 = mix(1.0, smoothstep(0.25, 0.65, qH(vec2(floor(ph2/6.2832 + 0.25)*5.3, 2.0)))*(0.45 + 0.75*qN(p/29.0 + 53.0)), uPattern);       // (snow: the same for the dhows' rings)
    arc2 = mix(arc2, arc2*smoothstep(0.4, 0.6, qN(p/43.0 - vec2(t*0.02, 0.0) + 37.0)), uPattern);
    float ring2 = smoothstep(-0.1, 0.9, sin(ph2))*smoothstep(13.0, 19.0, rdh)*(1.0 - smoothstep(mix(50.0, 36.0, uPattern), mix(135.0, 82.0, uPattern), rdh))*arc2*crw2*(1.0 - smoothstep(1.2, 2.8, fwidth(ph2)));
    // (her rings cross the dark lane ahead of the bows, so each arc is seen whole; the dhows' stay out of it and
    // are softer over the dark lanes, where blue on black would stripe)
    float r1 = (0.6 + 0.2*uPattern)*ring1, r2 = ring2*(1.0 - 0.8*pl.x), rgs = r1 + r2;
    blue += 0.46*(r1*(0.6 + 0.4*m) + r2*(0.4 + 0.6*m));
    // where a whale leaves the sea and where it falls back: churned blue-white water and rings running out
    float spn = qN(p*0.8 + vec2(t*0.5, -t*0.3));
    for (int i = 0; i < 6; i++) {
      float a = uSpl[i].z, sz = uSpl[i].w, r = length(p - uSpl[i].xy);
      float on = step(0.0, a)*(1.0 - smoothstep(10.0, 16.0, a));
      float R = sz*(2.0 + 5.2*sqrt(max(a, 0.0))), wd = 0.7 + 0.3*max(a, 0.0);
      float d1 = (r - R)/wd, d2 = (r - 0.55*R)/wd;
      float core = exp(-r*r/(sz*sz*(5.0 + 6.0*max(a, 0.0))))*(0.5 + 0.6*spn);
      blue += on*((1.3*exp(-d1*d1) + 0.8*exp(-d2*d2))*exp(-max(a, 0.0)*0.17) + 2.1*core*exp(-max(a, 0.0)*0.2));
      dark += on*0.3*exp(-d1*d1*0.16)*exp(-max(a, 0.0)*0.2)*step(r, R);
    }
    col *= 1.0 - clamp(dark, 0.0, 0.9);
    col = mix(col, uBlue*(1.0 + 0.3*spn), clamp(blue, 0.0, 0.92));
    // on the snow-white sea a mix toward light blue burns out to white again: there the rings are deeper blue water
    col = mix(col, uBlue*vec3(0.5, 0.66, 0.85)*(0.85 + 0.3*h0), 0.8*uPattern*clamp(rgs, 0.0, 1.0)*m);
    // lantern light lying on the water: the glitter path of each lamp, long toward the eye, broken into wavering bars
    vec2 e2p = vec2(-e2.y, e2.x); float ea = dot(p, e2), eb = dot(p, e2p), wsum = 0.0;
    float bars = mix(1.0, 0.3 + 1.4*qN(vec2(ea*1.5 - t*1.1, eb*0.22 + t*0.2)), n1);
    float wob = 0.022*sin(ea*0.9 - t*2.0) + 0.013*sin(ea*2.3 + t*2.7);
    for (int i = 0; i < 8; i++) {
      vec3 L = uLamp[i].xyz - vW; float dl = max(length(L), 1e-3); L /= dl;
      vec3 Hh = L - Vd; vec2 tl = Hh.xz/max(Hh.y, 1e-3);                 // the facet slope that would mirror this lamp into the eye
      float ta = dot(tl, e2), tb = dot(tl, e2p) + wob;
      wsum += uLamp[i].w*exp(-ta*ta/0.0128 - tb*tb/0.0036)/(1.0 + dl*0.012);
    }
    col = mix(col, uWarm*(1.05 + 0.3*h0), 0.85*clamp(wsum*bars, 0.0, 1.0));
    // the portal ring mirrored in rippled water
    vec3 Nw = normalize(vec3(-e2.x*slope*0.22 + 0.05*sin(p.y*1.7 + t*1.3), 1.0, -e2.y*slope*0.22 + 0.05*sin(p.x*2.1 - t*1.1)));
    vec3 R = reflect(Vd, Nw); R.y = abs(R.y);
    float rz = min(R.z, -1e-3), tt = (uPortal.z - vW.z)/rz;
    vec3 hp = vW + R*tt;
    float pd = length(hp.xy - uPortal.xy);
    float rg = (pd - uPortal.w)/0.8;
    float ring = exp(-rg*rg) + 0.22*(1.0 - smoothstep(0.0, uPortal.w, pd));
    float om = 1.0 - clamp(dot(-Vd, Nw), 0.0, 1.0), fres = 0.06 + 0.94*om*om*om;
    col += uPortalCol*ring*fres*step(0.0, tt)*step(uPortal.z, vW.z)*(1.0 - smoothstep(60.0, 150.0, tt))*0.6;
    col = mix(col, uFar, smoothstep(0.3, 0.9, dist/uRadius));
    // the edge of the milky sea: beyond the front the ocean is black
    float inside = seaEdge(p, t, min(fp, 200.0), dist);                       // (the footprint is unbounded on the horizon ring: clamp it)
    // far away the glow is decided by direction alone (the same turn of the compass as the sky's glow in makeStarBand),
    // over a third of the horizon, mottled: it sweeps out to the horizon as a wide soft falling-off, never a wedge
    float farIn = smoothstep(-0.30, 0.34, dot(e2, vec2(0.7071, -0.7071)) + 0.16*(qF2(p/1400.0) - 0.5)*(1.0 - smoothstep(3000.0, 9000.0, dist)));      // (the mottling dies out with distance: on the horizon one pixel row spans kilometres, and a noise read there once per row drew a ruled streak)
    inside = mix(inside, farIn, smoothstep(700.0, 2400.0, dist));
    float tops = smoothstep(0.66, 0.97, w3)*l3*(1.0 - inside)*(1.0 - smoothstep(350.0, 900.0, dist));           // beyond the edge a few tops of the long swell still catch light
    col *= mix(1.0, 0.012 + 0.988*inside + 0.085*tops, uEdge.w);
    col = min(col, vec3(0.93));
  } else {
    // ---------------- from below: the same mask as a luminous ceiling, brighter toward grazing
    float mu = abs(Vd.y);
    // ripple light breaks the lanes' outlines: along every edge of the mask the facets and the caustic web carry the
    // glow a few metres into the dark water and the dark into the glow (no lane ends in a drawn line)
    vec2 cwe = p*0.5 + 0.7*vec2(qN(p*0.19 + t*0.07), qN(p*0.19 + 3.3 - t*0.06));
    float web = 1.0 - abs(2.0*qN(cwe + vec2(t*0.2, 0.0)) - 1.0);
    m = clamp(m + 4.0*m*(1.0 - m)*(0.42*(h0 - 0.62) + 0.42*(web*web - 0.3) + 0.26*(qN(p*0.13 + vec2(-t*0.05, t*0.04)) - 0.5))*(1.0 - smoothstep(3.0, 16.0, fp)), 0.0, 1.0);
    col = mix(uLane*0.46, uBright, m);
    float gz = clamp(1.0 - mu, 0.0, 1.0);
    col *= 0.5 + 0.75*gz*sqrt(gz);
    col *= 0.86 + 0.5*h0;
    col *= 0.88 + 0.26*qN(p*0.31 + vec2(t*0.4, -t*0.25));
    col *= 1.0 - 0.3*cat;
    // unmistakably the underside of water: close overhead the ripple facets stand out and a web of caustic
    // light crawls across the ceiling
    float tex = 0.5*(h0 - 0.75)*(1.0 - smoothstep(4.0, 14.0, dist));
    vec2 cw = p*0.5 + 0.7*vec2(qN(p*0.19 + t*0.07), qN(p*0.19 + 3.3 - t*0.06));
    float c1 = 1.0 - abs(2.0*qN(cw + vec2(t*0.2, 0.0)) - 1.0), c2 = 1.0 - abs(2.0*qN(cw*1.8 + 4.1 - vec2(0.0, t*0.27)) - 1.0);
    c1 *= c1; c2 *= c2;
    tex += (0.6*c1*c1 + 0.4*c2*c2 - 0.14)*(1.0 - smoothstep(0.25, 1.5, fp))*(0.4 + 0.6*m);
    vec2 cf = p*2.3 + 0.5*vec2(qN(p*0.9 + t*0.2), qN(p*0.9 + 5.1 - t*0.17));                  // and a finer one for the last metres before the break
    float f1 = 1.0 - abs(2.0*qN(cf + vec2(t*0.5, 0.0)) - 1.0), f2 = 1.0 - abs(2.0*qN(cf*2.1 + 1.7 - vec2(0.0, t*0.6)) - 1.0);
    f1 *= f1; f2 *= f2;
    tex += (0.6*f1*f1 + 0.45*f2*f2 - 0.3)*(1.0 - smoothstep(0.03, 0.22, fp))*(1.0 - smoothstep(4.0, 16.0, dist));
    // the 20 m marble octave: darker veins curling through the bright water (fades with the footprint)
    float mb = qF2(p/21.0 + 1.5*(vec2(qN(p/47.0 + 3.1), qN(p/47.0 + 8.7)) - 0.5) + vec2(t*0.004, -t*0.003));
    float vein = 1.0 - smoothstep(0.012, 0.045, abs(mb - 0.47));
    col *= 1.0 - (0.28*(1.0 - smoothstep(0.34, 0.56, mb)) + 0.55*vein)*(1.0 - smoothstep(3.0, 14.0, fp));
    col *= mix(1.0, 0.02 + 0.98*seaEdge(p, t, min(fp, 200.0), dist), uEdge.w);
    col = min(col, vec3(0.95))*(1.0 + tex);                     // (after the clamp, so the facets and the web also show where the ceiling is brightest)
    float fd = dist*uUFog.a, fg = 1.0 - exp(-fd*fd);
    col = mix(col, uUFog.rgb*2.0, fg);                          // far away: the luminous seam at the horizon (matches makeBackdrop)
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// shared under-light for this file's own models: above the sea the light comes from below, in the
// water it comes from the glowing layer overhead. Needs vWp (world position) and applies scene fog.
const LIT = /* glsl */`
uniform vec3 uGlow, uSkyFill;
vec3 qLit(vec3 alb, vec3 N, float wy){
  float dn = clamp(0.5 - 0.5*N.y, 0.0, 1.0); dn = dn*dn*(3.0 - 2.0*dn);
  vec3 air = uGlow*dn + uSkyFill*(1.0 - dn);
  vec3 sea = uGlow*(0.1 + 0.55*clamp(0.5 + 0.5*N.y, 0.0, 1.0));
  return alb*mix(air, sea, step(wy, -0.05));
}`;
const FOG_V = '#include <fog_pars_vertex>\n', FOG_F = '#include <fog_pars_fragment>\n';

// ---- creature shaders (all: aCol vertex colour, aAnim per-model animation data, scene fog)
const BODY_FS = (pattern, decl = '') => /* glsl */`
${Q_NOISE}
${LIT}
uniform float uTime;
${decl}
varying vec3 vWp, vN, vCol, vL;
${FOG_F}
void main(){
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 alb = vCol, emi = vec3(0.0);
  ${pattern}
  gl_FragColor = vec4(qLit(alb, N, vWp.y) + emi, 1.0);
  #include <fog_fragment>
}`;
const BODY_TAIL = /* glsl */`
  vec4 wp = modelMatrix*vec4(P, 1.0); vWp = wp.xyz;
  vN = normalize(mat3(modelMatrix)*Nn); vCol = aCol;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BODY_HEAD = /* glsl */`
attribute vec3 aCol; attribute vec4 aAnim;
uniform float uTime;
varying vec3 vWp, vN, vCol, vL;
${FOG_V}
`;
const SHARK_VS = BODY_HEAD + /* glsl */`
void main(){
  vec3 P = position, Nn = normal; vL = position;
  float w = smoothstep(2.2, -4.6, P.z);
  P.x += 0.8*w*w*sin(uTime*1.25 + P.z*0.55) - 0.07*sin(uTime*1.25 + 2.4)*(1.0 - w);
  P.y += aAnim.x*0.25*sin(uTime*0.9 + P.z);
` + BODY_TAIL;
const SHARK_PATTERN = /* glsl */`
  float top = smoothstep(-0.25, 0.45, N.y);
  vec2 g = vec2(atan(vL.y + 0.3, vL.x)*1.15*2.3, vL.z*2.0); g.x += 0.5*floor(g.y);      // the lattice wraps the girth: spots on the flanks too, never bars
  float sp = 1.0 - smoothstep(0.13, 0.24, length(fract(g) - 0.5));
  float bar = 1.0 - smoothstep(0.02, 0.07, abs(fract(vL.z*1.0 + 0.25) - 0.5));
  float finM = step(vCol.g*1.25, vCol.b)*step(vCol.g, 0.12);                               // fins are flagged by their colour
  top = max(max(top, 0.8*finM), 0.62*smoothstep(-0.8, -0.15, N.y));      // the flanks carry spots too, dimmer: they read from the side and from a little below
  vec2 gf = vL.yz*2.1; gf.x += 0.5*floor(gf.y);
  sp = mix(sp, 1.0 - smoothstep(0.12, 0.22, length(fract(gf) - 0.5)), finM);
  alb += vec3(0.34, 0.42, 0.38)*max(sp, bar*0.12)*top*step(vCol.g, 0.12);
  emi += finM*uGlow*vec3(0.012, 0.022, 0.022)*(0.7 + 0.3*sin(dot(vL.yz, vec2(9.0, 17.0))));     // thin: the ceiling's light comes through, in rays
  float gz = (2.75 - vL.z)/0.17;                                                           // five gill slits on each flank (for the close pass)
  alb *= 1.0 - 0.75*(1.0 - smoothstep(0.12, 0.3, abs(fract(gz) - 0.5)))*step(0.0, gz)*step(gz, 5.0)*(1.0 - smoothstep(0.25, 0.7, abs(N.y)))*step(abs(vL.y + 0.1), 0.62);
`;
const MANTA_VS = BODY_HEAD + /* glsl */`
void main(){
  vec3 P = position, Nn = normal; vL = position;
  float a = aAnim.x, ph = uTime*1.9 + aAnim.y;
  P.y += 1.0*a*sqrt(a)*sin(ph - a*1.7) + 0.12*sin(ph + 1.0);
  P.x *= 1.0 - 0.1*a*(0.5 + 0.5*sin(ph - 1.0));
  P.x += aAnim.z*0.35*sin(uTime*1.3 + P.z*0.9);
` + BODY_TAIL;
const BOAT_VS = BODY_HEAD + /* glsl */`
uniform float uStroke;
void main(){
  vec3 P = position, Nn = normal; vL = position;
  float kind = aAnim.w, ph = 6.2832*uStroke;
  vec3 q = P - aAnim.xyz;
  if (kind > 0.5 && kind < 1.5) {            // rower: swing from the hips
    float th = 0.42*cos(ph + 0.35), c = cos(th), s = sin(th);
    q = vec3(q.x, c*q.y - s*q.z, s*q.y + c*q.z); Nn = vec3(Nn.x, c*Nn.y - s*Nn.z, s*Nn.y + c*Nn.z);
    P = aAnim.xyz + q;
  } else if (kind > 1.5) {                   // oar: sweep about the oarlock, dip on the drive
    float sd = kind > 2.5 ? 1.0 : -1.0;
    float al = -sd*0.52*cos(ph), be = sd*(0.17 + 0.15*sin(ph));
    float c = cos(al), s = sin(al);
    q = vec3(c*q.x + s*q.z, q.y, -s*q.x + c*q.z);
    c = cos(be); s = sin(be);
    q = vec3(c*q.x + s*q.y, -s*q.x + c*q.y, q.z);
    P = aAnim.xyz + q;
  }
` + BODY_TAIL;

// ---------------------------------------------------------------- 3. mesh accumulator
function makeAcc() { return { p: [], c: [], a: [], i: [], n: 0 }; }
function vtx(A, x, y, z, col, an) { A.p.push(x, y, z); A.c.push(col[0], col[1], col[2]); A.a.push(an[0], an[1], an[2], an[3]); return A.n++; }
// lofted tube: fn(i, k) -> [x, y, z] for ring i (0..rings) and side k (0..sides-1); col / an may be functions of (i, k)
function tube(A, rings, sides, fn, col, an, capA = true, capB = true) {
  const base = A.n, C = (i, k) => (typeof col === 'function' ? col(i, k) : col), AN = (i, k, q) => (typeof an === 'function' ? an(i, k, q) : an);
  for (let i = 0; i <= rings; i++) for (let k = 0; k < sides; k++) { const q = fn(i, k); vtx(A, q[0], q[1], q[2], C(i, k), AN(i, k, q)); }
  for (let i = 0; i < rings; i++) for (let k = 0; k < sides; k++) {
    const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides;
    A.i.push(a, b, c, b, d, c);
  }
  for (const [on, i] of [[capA, 0], [capB, rings]]) {
    if (!on) continue;
    let cx = 0, cy = 0, cz = 0; for (let k = 0; k < sides; k++) { const q = fn(i, k); cx += q[0] / sides; cy += q[1] / sides; cz += q[2] / sides; }
    const m = vtx(A, cx, cy, cz, C(i, 0), AN(i, 0, [cx, cy, cz]));
    for (let k = 0; k < sides; k++) { const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides; if (i === 0) A.i.push(m, b, a); else A.i.push(m, a, b); }
  }
}
function quad(A, p0, p1, p2, p3, col, an) {
  const AN = (q) => (typeof an === 'function' ? an(q) : an);
  const a = vtx(A, p0[0], p0[1], p0[2], col, AN(p0)), b = vtx(A, p1[0], p1[1], p1[2], col, AN(p1)), c = vtx(A, p2[0], p2[1], p2[2], col, AN(p2)), d = vtx(A, p3[0], p3[1], p3[2], col, AN(p3));
  A.i.push(a, b, c, a, c, d);
}
function tri(A, p0, p1, p2, col, an) {
  const AN = (q) => (typeof an === 'function' ? an(q) : an);
  const a = vtx(A, p0[0], p0[1], p0[2], col, AN(p0)), b = vtx(A, p1[0], p1[1], p1[2], col, AN(p1)), c = vtx(A, p2[0], p2[1], p2[2], col, AN(p2));
  A.i.push(a, b, c);
}
// box between two points (a square-section bar), half-widths wx / wy
function bar(A, a, b, wx, wy, col, an) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= L; d[1] /= L; d[2] /= L;
  let u = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const r = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], rl = Math.hypot(r[0], r[1], r[2]); r[0] /= rl; r[1] /= rl; r[2] /= rl;
  u = [r[1] * d[2] - r[2] * d[1], r[2] * d[0] - r[0] * d[2], r[0] * d[1] - r[1] * d[0]];
  const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  tube(A, 1, 4, (i, k) => { const o = i ? b : a, c = cs[k]; return [o[0] + r[0] * c[0] * wx + u[0] * c[1] * wy, o[1] + r[1] * c[0] * wx + u[1] * c[1] * wy, o[2] + r[2] * c[0] * wx + u[2] * c[1] * wy]; }, col, an);
}
function accGeo(A) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A.p, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(A.c, 3));
  g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A.a, 4));
  g.setIndex(A.i); g.computeVertexNormals();
  return g;
}
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
function bodyMat(SH, vs, pattern, extra = {}, o = {}, decl = '') {
  return new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: BODY_FS(pattern, decl), uniforms: { ...fogU(), uTime: SH.uTime, uGlow: SH.uGlow, uSkyFill: SH.uSkyFill, ...extra }, fog: true, side: THREE.DoubleSide, ...o });
}
// piecewise-linear table lookup with smooth interpolation: tab = [[s, a, b, ...], ...]
function prof(tab, s, j) {
  for (let i = 0; i < tab.length - 1; i++) if (s <= tab[i + 1][0]) { const t = smoothstep(tab[i][0], tab[i + 1][0], s); return lerp(tab[i][j], tab[i + 1][j], t * 0.6 + 0.4 * clamp((s - tab[i][0]) / (tab[i + 1][0] - tab[i][0]), 0, 1)); }
  return tab[tab.length - 1][j];
}

// ---------------------------------------------------------------- 4. builders
function makeSeaMesh(hero, U) {
  const radii = [0]; for (let i = 1; i <= 34; i++) radii.push(i * 1.4);
  while (radii[radii.length - 1] < U.uRadius.value) radii.push(radii[radii.length - 1] * 1.078);
  const SEG = 96, sp = [], si = [];
  radii.forEach((r) => { for (let k = 0; k < SEG; k++) { const a = k / SEG * Math.PI * 2; sp.push(Math.cos(a) * r, 0, Math.sin(a) * r); } });
  for (let i = 0; i < radii.length - 1; i++) for (let k = 0; k < SEG; k++) { const a = i * SEG + k, b = i * SEG + (k + 1) % SEG; si.push(a, b, a + SEG, b, b + SEG, a + SEG); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setIndex(si);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: SEA_VS(hero.swellGLSL), fragmentShader: SEA_FS(hero.swellGLSL), uniforms: U, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 1;
  return m;
}
// what is seen under water below the horizon: the luminous seam of the glowing layer, and under it deep teal
// water that darkens slowly toward the abyss (so the lower half of the frame reads as depth, not as a void)
function makeBackdrop(U) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.ShaderMaterial({
    uniforms: { uUFog: U.uUFog, uDeep: { value: new THREE.Color('#010504') } }, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
    fragmentShader: 'uniform vec4 uUFog; uniform vec3 uDeep; varying vec3 vD; void main(){ float y = vD.y/max(length(vD), 1e-3); float s = smoothstep(-0.13, 0.0, y), d = max(-y, 0.0); vec3 deep = uUFog.rgb*vec3(0.85, 1.0, 0.8)*1.45*exp(-d*2.5); gl_FragColor = vec4(uDeep + max(uUFog.rgb*2.0*s*sqrt(s), deep), 1.0); }',
  }));
  m.frustumCulled = false; m.renderOrder = -5; m.scale.setScalar(3000);
  return m;
}

// 9 m whale shark with four remoras. Local: nose +Z, +Y up.
function makeShark(SH) {
  const A = makeAcc(), DK = [0.042, 0.066, 0.07], PALE = [0.2, 0.25, 0.23], FIN = [0.04, 0.056, 0.078];
  const T = [[0, 1.16, 0.26, 0.22], [0.05, 1.36, 0.4, 0.34], [0.14, 1.42, 0.56, 0.5], [0.3, 1.24, 0.86, 0.72], [0.5, 0.84, 0.82, 0.62], [0.7, 0.46, 0.52, 0.4], [0.86, 0.17, 0.22, 0.17], [0.93, 0.09, 0.14, 0.1]];
  const RINGS = 22, SIDES = 14;
  tube(A, RINGS, SIDES, (i, k) => {
    const s = i / RINGS * 0.93, th = k / SIDES * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
    const hw = prof(T, s, 1), ht = prof(T, s, 2), hb = prof(T, s, 3);
    const ridge = sn > 0 ? 1 + 0.07 * Math.max(0, Math.cos(th * 6)) * smoothstep(0.1, 0.3, s) : 1;
    return [hw * Math.sign(c) * Math.pow(Math.abs(c), 0.8), (sn > 0 ? ht * ridge : hb) * Math.sign(sn) * Math.pow(Math.abs(sn), 0.8), 4.5 - 9 * s];
  }, (i, k) => (Math.sin(k / SIDES * Math.PI * 2) < -0.35 ? PALE : DK), [0, 0, 0, 0]);
  const Z = [0, 0, 0, 0];
  // dorsals, caudal (tall upper lobe), pectorals, pelvics
  quad(A, [0, 0.8, 0.5], [0, 0.78, -1.0], [0, 1.75, -1.5], [0, 1.5, -0.95], FIN, Z);
  tri(A, [0, 0.5, -1.9], [0, 0.45, -2.6], [0, 0.95, -2.75], FIN, Z);
  quad(A, [0, 0.12, -3.5], [0, 0.0, -3.95], [0, 1.5, -5.0], [0, 1.0, -4.15], FIN, Z);
  tri(A, [0, 0.0, -3.5], [0, -1.05, -4.45], [0, -0.05, -3.95], FIN, Z);
  for (const sd of [-1, 1]) {
    quad(A, [sd * 1.15, -0.3, 2.3], [sd * 1.05, -0.32, 1.25], [sd * 3.0, -1.25, -0.3], [sd * 2.6, -1.1, 0.55], FIN, (q) => [Math.max(0, Math.abs(q[0]) - 1) * 0.5, 0, 0, 0]);
    tri(A, [sd * 0.5, -0.5, -1.3], [sd * 0.42, -0.5, -1.95], [sd * 0.95, -0.82, -2.15], FIN, Z);
  }
  // remoras: 0.7 m spindles holding on under the belly and by the fins
  for (const [x, y, z, yaw] of [[0.35, -0.8, 1.2, 0.1], [-0.45, -0.74, -0.4, -0.15], [1.25, -0.5, 1.5, 0.3], [-0.2, -0.56, -2.0, 0]]) {
    tube(A, 6, 5, (i, k) => {
      const s = i / 6, r = 0.075 * Math.pow(Math.sin(Math.PI * Math.min(0.97, s * 0.9 + 0.06)), 0.7), th = k / 5 * Math.PI * 2, zz = 0.35 - 0.7 * s;
      return [x + Math.cos(th) * r + zz * Math.sin(yaw), y + Math.sin(th) * r * 0.8, z + zz * Math.cos(yaw)];
    }, [0.07, 0.085, 0.08], [0, 0, 0, 0]);
  }
  const mesh = new THREE.Mesh(accGeo(A), bodyMat(SH, SHARK_VS, SHARK_PATTERN));
  mesh.frustumCulled = false;
  return mesh;
}
// a pair of 5 m mantas. Local: nose +Z.
function makeMantas(SH) {
  const A = makeAcc(), DK = [0.028, 0.04, 0.046], PALE = [0.22, 0.26, 0.25];
  for (const [ox, oy, oz, ph] of [[0, 0, 0, 0], [3.6, 1.3, -5.2, 2.1]]) {
    const NX = 14, NZ = 5, P = (ix, iz, top) => {
      const x = (ix / NX * 2 - 1) * 2.5, a = Math.abs(x) / 2.5, le = 1.0 - 1.15 * Math.pow(a, 1.25), te = -0.95 + 0.75 * Math.pow(a, 0.8), f = iz / NZ;
      const z = lerp(te, le, f), th = (top ? 0.3 : -0.16) * Math.pow(1 - a, 1.3) * Math.pow(Math.sin(Math.PI * clamp(f * 0.86 + 0.07, 0, 1)), 0.7);
      return [ox + x, oy + th, oz + z, a];
    };
    for (const top of [1, 0]) for (let ix = 0; ix < NX; ix++) for (let iz = 0; iz < NZ; iz++) {
      const q = [P(ix, iz, top), P(ix + 1, iz, top), P(ix + 1, iz + 1, top), P(ix, iz + 1, top)];
      const an = (v) => [Math.abs(v[0] - ox) / 2.5, ph, 0, 0];
      if (top) quad(A, q[0], q[3], q[2], q[1], DK, an); else quad(A, q[0], q[1], q[2], q[3], PALE, an);
    }
    for (const sd of [-1, 1]) quad(A, [ox + sd * 0.28, oy, oz + 0.9], [ox + sd * 0.5, oy, oz + 0.95], [ox + sd * 0.42, oy - 0.08, oz + 1.45], [ox + sd * 0.3, oy - 0.05, oz + 1.4], DK, [0.05, ph, 0, 0]);
    tube(A, 6, 3, (i, k) => { const s = i / 6, r = 0.05 * (1 - s) + 0.008, th = k / 3 * Math.PI * 2; return [ox + Math.cos(th) * r, oy + Math.sin(th) * r, oz - 0.9 - 3.2 * s]; }, DK, (i) => [0, ph, i / 6, 0], false, false);
  }
  const mesh = new THREE.Mesh(accGeo(A), bodyMat(SH, MANTA_VS, ''));
  mesh.frustumCulled = false;
  return mesh;
}

// 0.6 m squid jetting through the glow layer (instanced; all motion in the vertex shader)
function makeSquid(SH, rng, path, count) {
  const A = makeAcc(), DK = [0.02, 0.03, 0.03];
  tube(A, 5, 5, (i, k) => { const s = i / 5, r = 0.075 * Math.sin(Math.PI * (0.16 + 0.62 * (1 - s))), th = k / 5 * Math.PI * 2; return [Math.cos(th) * r, Math.sin(th) * r, -0.04 + 0.36 * s]; }, DK, [0, 0, 0, 0]);
  for (const sd of [-1, 1]) tri(A, [sd * 0.03, 0, 0.32], [sd * 0.03, 0, 0.16], [sd * 0.17, 0, 0.2], DK, [0, 0, 0, 0]);
  for (let k = 0; k < 6; k++) {
    const th = k / 6 * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), w = 0.018;
    quad(A, [c * 0.04 - s * w, s * 0.04 + c * w, -0.04], [c * 0.04 + s * w, s * 0.04 - c * w, -0.04], [c * 0.07, s * 0.07, -0.34], [c * 0.065, s * 0.065, -0.34], DK, (q) => [clamp((-q[2] - 0.04) / 0.3, 0, 1), 0, 0, 0]);
  }
  const base = accGeo(A), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of ['position', 'normal', 'aCol', 'aAnim']) g.setAttribute(k, base.attributes[k]);
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  const p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const u = rng.range(0.015, 0.2); path.pointAt(u, p); path.tangentAt(u, t);
    const side = rng.sign() * rng.range(3.5, 17), yaw = rng.range(0, 6.283);
    iA.set([p.x + t.z * side, rng.range(-4.6, -1.2), p.z - t.x * side, yaw], i * 4);
    iB.set([rng.range(-0.25, 0.25), rng.range(1.6, 3.2), rng.range(0, 1), rng.range(0.8, 1.5)], i * 4);
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = count;
  const vs = BODY_HEAD + /* glsl */`
attribute vec4 iA, iB;
void main(){
  vec3 P = position*iB.w*1.2, Nn = normal; vL = position;
  float cyc = uTime*0.55*iB.w + iB.z*7.0, c = fract(cyc), jet = 1.0 - (1.0 - c)*(1.0 - c);
  float run = 26.0, d = mod((floor(cyc) + jet)*iB.y, run), q = d/run;
  float sc = smoothstep(0.0, 0.1, q)*(1.0 - smoothstep(0.9, 1.0, q));
  P.xy *= 1.0 + aAnim.x*(0.3 + 1.3*c);
  P *= sc;
  float cy = cos(iA.w), sy = sin(iA.w), cp = cos(iB.x), sp = sin(iB.x);
  vec3 fw = vec3(sy*cp, sp, cy*cp), rt = vec3(cy, 0.0, -sy), up = cross(fw, rt);
  vec3 O = iA.xyz + fw*(d - run*0.5);
  O.y = clamp(O.y, -4.9, -0.7);
  P = O + rt*P.x + up*P.y + fw*P.z;
  Nn = rt*normal.x + up*normal.y + fw*normal.z;
` + BODY_TAIL;
  const mesh = new THREE.Mesh(g, bodyMat(SH, vs, ''));
  mesh.frustumCulled = false;
  return mesh;
}

// 300 flying fish in bursts + the dark scratch each draws on the glow (one mesh, premultiplied blend).
// bursts: [{ u, origin: [x, z], forward: heading rad, n, fan: [lo, hi] rad, both: bool }]
function makeFlyingFish(SH, hero, rng, bursts) {
  const A = makeAcc(), DK = [0.045, 0.065, 0.06], WING = [0.13, 0.19, 0.17];     // pale undersides: the fan glows jade against the sky at the break
  // a long body with swept, pointed wings and a deep forked tail: from astern it reads as a dart, not a plus sign
  tube(A, 6, 5, (i, k) => { const s = i / 6, r = 0.045 * Math.pow(Math.sin(Math.PI * clamp(s * 0.9 + 0.06, 0, 1)), 0.75), th = k / 5 * Math.PI * 2; return [Math.cos(th) * r * 0.8, Math.sin(th) * r, 0.3 - 0.54 * s]; }, DK, [0, 0, 0, 0]);
  tri(A, [0, 0, -0.2], [0, 0.09, -0.36], [0, 0, -0.27], DK, [2, 0, 0, 0]);
  tri(A, [0, 0, -0.2], [0, 0, -0.27], [0, -0.13, -0.43], DK, [2, 0, 0, 0]);
  for (const sd of [-1, 1]) {
    quad(A, [sd * 0.035, 0.015, 0.15], [sd * 0.035, 0.015, -0.03], [sd * 0.37, 0.05, -0.22], [sd * 0.34, 0.05, -0.1], WING, (q) => [1, Math.abs(q[0]), 0, 0]);
    tri(A, [sd * 0.03, -0.01, -0.08], [sd * 0.03, -0.01, -0.17], [sd * 0.18, 0.0, -0.26], WING, (q) => [1, Math.abs(q[0]), 0, 0]);
  }
  // the scratch: x = across (-1..1), z = along (0..1), flagged 3
  const NS = 4;
  for (let j = 0; j < NS; j++) quad(A, [-1, 0, j / NS], [1, 0, j / NS], [1, 0, (j + 1) / NS], [-1, 0, (j + 1) / NS], DK, [3, 0, 0, 0]);
  const base = accGeo(A), g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of ['position', 'normal', 'aCol', 'aAnim']) g.setAttribute(k, base.attributes[k]);
  const total = bursts.reduce((s, b) => s + b.n, 0), iO = new Float32Array(total * 4), iP = new Float32Array(total * 4);
  let n = 0;
  bursts.forEach((b, bi) => {
    for (let i = 0; i < b.n; i++, n++) {
      const sd = b.both ? (i % 2 ? 1 : -1) : rng.sign(), fan = rng.range(b.fan[0], b.fan[1]) * sd, h = b.forward + fan;
      const lat = b.both ? sd * rng.range(b.lat[0], b.lat[1]) : rng.range(-b.lat[1], b.lat[1]), along = rng.range(b.ahead[0], b.ahead[1]);
      const fx0 = Math.sin(b.forward), fz0 = -Math.cos(b.forward);
      iO.set([b.origin[0] + fx0 * along + (-fz0) * lat, b.origin[1] + fz0 * along + fx0 * lat, h, rng.range(0, b.spreadT ?? 0.8)], n * 4);
      iP.set([rng.range(6, 20), rng.range(34, 46), rng(), bi], n * 4);
    }
  });
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(iO, 4)); g.setAttribute('iP', new THREE.InstancedBufferAttribute(iP, 4));
  g.instanceCount = total;
  const U = { ...fogU(), uTime: SH.uTime, uGlow: SH.uGlow, uSkyFill: SH.uSkyFill, uMsTime: hero.uniforms.uMsTime, uMsAmp: hero.uniforms.uMsAmp, uBlue: SH.uBlue,
    uBurstA: { value: new THREE.Vector4(-9, -9, -9, -9) }, uBurstB: { value: new THREE.Vector4(-9, -9, -9, -9) } };
  const vs = /* glsl */`
${hero.swellGLSL}
attribute vec3 aCol; attribute vec4 aAnim, iO, iP;
uniform float uTime; uniform vec4 uBurstA, uBurstB;
varying vec3 vWp, vN, vCol; varying vec4 vS;
${FOG_V}
void main(){
  float bi = iP.w;
  vec4 sA = vec4(equal(vec4(bi), vec4(0.0, 1.0, 2.0, 3.0))), sB = vec4(equal(vec4(bi), vec4(4.0, 5.0, 6.0, 7.0)));
  float tl = dot(uBurstA, sA) + dot(uBurstB, sB) - iO.w;
  float v = 11.0, Ls = iP.x, Lg = iP.y, Tt = Lg/v;
  float d = clamp(tl, 0.0, Tt)*v;
  vec2 f = vec2(sin(iO.z), -cos(iO.z)), r = vec2(-f.y, f.x);
  float part = aAnim.x;
  vec3 wpos; vec3 Nn = normal;
  if (part > 2.5) {
    float a = min(position.z*Ls, d), age = tl - a/v;
    float heal = clamp(1.0 - age/5.0, 0.0, 1.0)*step(0.0, tl)*step(0.01, d);
    vec2 xz = iO.xy + f*a + r*(position.x*(0.3 + 0.1*age)*(1.3 - 0.75*position.z) + 0.22*sin(a*0.9 + iP.z*20.0));
    wpos = vec3(xz.x, msSwell(xz) + 0.06, xz.y);
    vS = vec4(position.x, heal*(0.3 + 0.7*smoothstep(-0.5, 0.6, sin(a*2.3 + iP.z*40.0)))*smoothstep(0.0, 1.5, a)*(1.0 - smoothstep(0.55, 1.0, position.z)), 1.0, 1.0 - smoothstep(0.2, 2.0, age));
    Nn = vec3(0.0, 1.0, 0.0);
  } else {
    float live = step(0.0, tl)*step(tl, Tt);
    float sc = 1.5*live*smoothstep(0.0, 0.12, tl)*(1.0 - smoothstep(Tt - 0.25, Tt, tl));
    float g = clamp((d - Ls)/max(Lg - Ls, 1.0), 0.0, 1.0);
    float y = 0.1 + 0.12*clamp(d/Ls, 0.0, 1.0) + (0.34 + 0.2*iP.z)*sqrt(max(sin(3.1416*g), 0.0)) + 0.05*sin(uTime*3.0 + iP.z*50.0);
    y += sA.x*(2.8 + 2.2*iP.z)*sin(3.1416*clamp(d/18.0, 0.0, 1.0));     // the burst at the surface break leaps into the frame
    y += (sA.z + sA.w + sB.x)*(0.5 + 2.3*iP.z*iP.z)*sqrt(max(sin(3.1416*g), 0.0));      // on the final run (the three bursts of 41.5 to 44.5 s) some glide a man's height up, toward the lens
    y *= 1.0 - smoothstep(0.93, 1.0, g);
    vec3 P = position;
    float taxi = 1.0 - smoothstep(Ls*0.8, Ls*1.1, d);
    if (part > 1.5) P.x += (0.05 + 0.07*taxi)*sin(uTime*38.0 + iP.z*30.0)*(-P.z - 0.1)*6.0;
    if (part > 0.5 && part < 1.5) P.y += aAnim.y*(0.25 - 0.2*taxi) + 0.02*aAnim.y*sin(uTime*30.0 + iP.z*9.0)*taxi;
    float pt = 0.1*taxi + 0.03, cp = cos(pt), sp = sin(pt);
    P = vec3(P.x, cp*P.y + sp*P.z, -sp*P.y + cp*P.z)*sc;
    Nn = vec3(Nn.x, cp*Nn.y + sp*Nn.z, -sp*Nn.y + cp*Nn.z);
    vec2 xz = iO.xy + f*(d + P.z) + r*P.x;
    wpos = vec3(xz.x, msSwell(xz) + y + P.y, xz.y);
    Nn = vec3(r.x*Nn.x + f.x*Nn.z, Nn.y, r.y*Nn.x + f.y*Nn.z);
    vS = vec4(0.0, 1.0, 0.0, 0.0);
  }
  vWp = wpos; vN = Nn; vCol = aCol;
  vec4 mvPosition = viewMatrix*vec4(wpos, 1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
  const fs = /* glsl */`
${LIT}
uniform vec3 uBlue;
varying vec3 vWp, vN, vCol; varying vec4 vS;
${FOG_F}
void main(){
  if (vS.z > 0.5) {
    float a = vS.y*0.42*(1.0 - smoothstep(0.0, 1.0, abs(vS.x)));
    gl_FragColor = vec4(uBlue*(1.6*a*vS.w), a);                  // fresh, the scratch is a smear of blue light; it heals dark
  } else {
    vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
    gl_FragColor = vec4(qLit(vCol, N, 1.0), 1.0);
    #include <fog_fragment>
  }
}`;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: U, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  mesh.frustumCulled = false; mesh.renderOrder = 3;
  return { mesh, uniforms: U, count: total };
}

// sargassum: lace discs lying on the swell + fronds hanging 1.5 m into the glow (one mesh)
function makeWeed(SH, hero, rng, rafts, frondsPer) {
  const p = [], c = [], k = [], idx = []; let n = 0;
  const V = (x, y, z, cc, kk) => { p.push(x, y, z); c.push(cc[0], cc[1], cc[2], cc[3]); k.push(kk[0], kk[1], kk[2], kk[3]); return n++; };
  for (const r of rafts) {
    const cc = [r.x, r.z, r.r, rng.range(0, 50)], SEG = 16, c0 = V(r.x, 0, r.z, cc, [0, 0, 0, 0]);
    for (let i = 0; i < SEG; i++) { const a = i / SEG * Math.PI * 2; V(r.x + Math.cos(a) * r.r, 0, r.z + Math.sin(a) * r.r, cc, [0, 0, 0, 0]); }
    for (let i = 0; i < SEG; i++) idx.push(c0, c0 + 1 + (i + 1) % SEG, c0 + 1 + i);
    const nf = Math.round(frondsPer * (0.6 + r.r / 8));
    for (let f = 0; f < nf; f++) {
      const a = rng.range(0, 6.283), rr = Math.sqrt(rng()) * r.r * 0.8, fx0 = r.x + Math.cos(a) * rr, fz0 = r.z + Math.sin(a) * rr;
      const yaw = rng.range(0, 3.14), w = rng.range(0.1, 0.24), len = rng.range(0.7, 1.7), ph = rng.range(0, 6.283), dx = Math.cos(yaw) * w, dz = Math.sin(yaw) * w, ROWS = 3;
      const b0 = n;
      for (let j = 0; j <= ROWS; j++) { const d = j / ROWS, t = 1 - 0.55 * d; V(fx0 - dx * t, -len * d, fz0 - dz * t, cc, [1, d, ph, -1]); V(fx0 + dx * t, -len * d, fz0 + dz * t, cc, [1, d, ph, 1]); }
      for (let j = 0; j < ROWS; j++) { const a0 = b0 + j * 2; idx.push(a0, a0 + 1, a0 + 2, a0 + 1, a0 + 3, a0 + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aC', new THREE.Float32BufferAttribute(c, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 4)); g.setIndex(idx);
  const vs = /* glsl */`
${hero.swellGLSL}
attribute vec4 aC, aK; uniform float uTime;
varying vec2 vUv; varying vec4 vK; varying float vSeed, vR;
${FOG_V}
void main(){
  vec3 P = position;
  if (aK.x < 0.5) P.y = msSwell(P.xz) + 0.04;
  else {
    P.y += msSwell(aC.xy) + 0.02;
    P.xz += vec2(sin(uTime*0.7 + aK.z + aK.y*2.2), cos(uTime*0.6 + aK.z*1.3 + aK.y*1.7))*0.17*aK.y;
  }
  vUv = (position.xz - aC.xy)/aC.z; vK = aK; vSeed = aC.w; vR = aC.z;
  vec4 mvPosition = viewMatrix*vec4(P, 1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
  const fs = /* glsl */`
${Q_NOISE}
uniform vec3 uGlow;
varying vec2 vUv; varying vec4 vK; varying float vSeed, vR;
${FOG_F}
void main(){
  float a; vec3 col = vec3(0.012, 0.014, 0.008);
  if (vK.x < 0.5) {
    vec2 q = vUv*vR; float r = length(vUv);
    float n = qF2(q*0.95 + vSeed), n2 = qN(q*0.42 + vSeed*3.0), w = max(0.035, fwidth(n)*1.3);
    float a0 = 1.0 - smoothstep(0.62, 0.98, r + 0.5*(qN(vUv*2.6 + vSeed) - 0.5));
    float strand = max(1.0 - smoothstep(w, 2.0*w, abs(n - 0.5)), 1.0 - smoothstep(w, 2.0*w, abs(n - 0.36)));
    float clump = smoothstep(0.5, 0.6, n2 + 0.25*(n - 0.5));
    a = a0*clamp(max(clump, strand*0.9), 0.0, 1.0);
    col += vec3(0.05, 0.04, 0.012)*step(0.86, qH(floor(q*9.0)))*clump;
  } else {
    a = (1.0 - smoothstep(0.45, 1.0, abs(vK.w) + 0.6*(qN(vec2(vK.y*6.0, vK.z*9.0)) - 0.5)))*(1.0 - smoothstep(0.85, 1.0, vK.y));
    col += uGlow*0.012*(1.0 - vK.y);
  }
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms: { ...fogU(), uTime: SH.uTime, uGlow: SH.uGlow, uMsTime: hero.uniforms.uMsTime, uMsAmp: hero.uniforms.uMsAmp },
    fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// the 8 m clinker longboat sent ahead to tow: six oarsmen and a coxswain. Local: bow -Z.
function makeLongboat(SH, uStroke) {
  const A = makeAcc(), Z = [0, 0, 0, 0], W1 = [0.2, 0.17, 0.13], W2 = [0.26, 0.22, 0.17], MAN = [0.03, 0.03, 0.035], OAR = [0.3, 0.26, 0.2];
  const hb = (s) => 1.05 * (s < 0.45 ? lerp(0.62, 1, smoothstep(0, 0.45, s)) : Math.pow(Math.cos((s - 0.45) / 0.55 * Math.PI / 2), 0.65));
  const sheer = (s) => 0.5 + 0.28 * (2 * s - 1) * (2 * s - 1), keelY = (s) => -0.42 + 0.55 * smoothstep(0.8, 1, s);
  const HP = (s, g, sd, lap = 0) => [sd * (hb(s) * Math.pow(g, 0.5) + lap), keelY(s) + (sheer(s) - keelY(s)) * Math.pow(g, 1.5), 4 - 8 * s];
  const NS = 14, NG = 7;
  for (const sd of [-1, 1]) for (let i = 0; i < NS; i++) for (let j = 0; j < NG; j++) {
    const s0 = i / NS, s1 = (i + 1) / NS, g0 = j / NG, g1 = (j + 1) / NG, lap = j > 0 ? 0.035 : 0;
    const q = [HP(s0, g0, sd, lap), HP(s1, g0, sd, lap), HP(s1, g1, sd), HP(s0, g1, sd)];
    if (sd > 0) quad(A, q[0], q[1], q[2], q[3], j % 2 ? W1 : W2, Z); else quad(A, q[0], q[3], q[2], q[1], j % 2 ? W1 : W2, Z);
  }
  for (let j = 0; j < NG; j++) quad(A, HP(0, j / NG, -1), HP(0, j / NG, 1), HP(0, (j + 1) / NG, 1), HP(0, (j + 1) / NG, -1), W1, Z);   // transom
  for (const sd of [-1, 1]) for (let i = 0; i < NS; i++) bar(A, HP(i / NS, 1, sd), HP((i + 1) / NS, 1, sd), 0.035, 0.03, W2, Z);                // gunwale
  bar(A, [0, sheer(1) + 0.25, -4.02], [0, keelY(0.9), -3.7], 0.04, 0.05, W1, Z);                                                              // stem post
  for (let i = 0; i < 6; i++) {
    const z = -2.25 + i * 0.86, s = (4 - z) / 8, b = hb(s) * 0.93, sd = i % 2 ? -1 : 1, x = -sd * 0.26, hip = [x, 0.3, z];
    bar(A, [-b, 0.24, z], [b, 0.24, z], 0.11, 0.02, W1, Z);                                                                                    // thwart
    const R = [hip[0], hip[1], hip[2], 1];
    tube(A, 2, 6, (ii, k) => { const t = ii / 2, th = k / 6 * Math.PI * 2; return [x + Math.cos(th) * lerp(0.19, 0.24, t), 0.3 + 0.58 * t, z + Math.sin(th) * lerp(0.13, 0.12, t) + 0.05 * t]; }, MAN, R);
    tube(A, 3, 6, (ii, k) => { const t = ii / 3, th = k / 6 * Math.PI * 2, r = 0.115 * Math.sin(Math.PI * (0.12 + 0.76 * t)); return [x + Math.cos(th) * r, 0.9 + 0.26 * t, z + 0.07 + Math.sin(th) * r]; }, MAN, R);
    for (const ar of [-1, 1]) { bar(A, [x + ar * 0.22, 0.84, z + 0.04], [x + ar * 0.14, 0.58, z + 0.5], 0.045, 0.045, MAN, R); bar(A, [x + ar * 0.1, 0.32, z + 0.02], [x + ar * 0.12, 0.12, z + 0.6], 0.06, 0.055, MAN, Z); }
    const lock = [sd * hb(s), sheer(s) + 0.06, z + 0.42], K = [lock[0], lock[1], lock[2], sd < 0 ? 2 : 3];
    bar(A, [lock[0] - sd * 0.95, lock[1] + 0.07, lock[2]], [lock[0] + sd * 2.3, lock[1] - 0.16, lock[2]], 0.028, 0.028, OAR, K);
    bar(A, [lock[0] + sd * 2.25, lock[1] - 0.16, lock[2]], [lock[0] + sd * 3.0, lock[1] - 0.21, lock[2]], 0.085, 0.014, OAR, K);
  }
  // coxswain in the stern sheets, tiller, rudder
  tube(A, 2, 6, (ii, k) => { const t = ii / 2, th = k / 6 * Math.PI * 2; return [Math.cos(th) * lerp(0.2, 0.25, t), 0.38 + 0.62 * t, 3.25 + Math.sin(th) * 0.13 - 0.06 * t]; }, MAN, Z);
  tube(A, 3, 6, (ii, k) => { const t = ii / 3, th = k / 6 * Math.PI * 2, r = 0.12 * Math.sin(Math.PI * (0.12 + 0.76 * t)); return [Math.cos(th) * r, 1.02 + 0.27 * t, 3.18 + Math.sin(th) * r]; }, MAN, Z);
  bar(A, [0.2, 0.82, 3.25], [0.1, 0.62, 3.75], 0.045, 0.045, MAN, Z); bar(A, [0.1, 0.62, 3.75], [0, 0.66, 4.05], 0.025, 0.025, OAR, Z);
  bar(A, [-3.0e-3, 0.5, 4.08], [0, -0.5, 4.12], 0.02, 0.16, W1, Z);
  bar(A, [-0.7, 0.3, 3.2], [0.7, 0.3, 3.2], 0.3, 0.02, W1, Z);
  // a lantern on a staff in the bow (the lens is flagged by its colour; BOAT_LAMP is where its light comes from)
  bar(A, [0, 0.55, -3.9], [0, 1.6, -3.9], 0.022, 0.022, W1, Z);
  bar(A, [0, 1.6, -3.9], [0, 1.92, -3.9], 0.085, 0.085, [0.95, 0.5, 0.15], Z);
  const mesh = new THREE.Mesh(accGeo(A), bodyMat(SH, BOAT_VS, `alb *= 0.8 + 0.4*qN(vL.xz*vec2(14.0, 2.0) + vL.y*5.0);
  vec3 ld = vec3(0.0, 1.76, -3.9) - vL; float lr = dot(ld, ld);
  emi = (vCol*1.2 + 0.006)*uWarm*(1.7*(0.35 + 0.65*max(dot(N, ld)/sqrt(max(lr, 1e-4)), 0.0))/(1.0 + lr*0.16));
  if (vCol.r > 0.9) emi = vCol*3.6;`, { uStroke, uWarm: SH.uWarm }, {}, 'uniform vec3 uWarm;'));
  mesh.frustumCulled = false;
  return mesh;
}

// the tow hawser: a ribbon that sags from the hawse-pipe into the sea and lifts with every stroke
function makeHawser(SH, from, to, uStroke, uRes) {
  const N = 48, p = [], idx = [];
  for (let i = 0; i <= N; i++) for (const sd of [-1, 1]) p.push(i / N, sd, 0);
  for (let i = 0; i < N; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx);
  const vs = /* glsl */`
uniform vec3 uA, uB; uniform float uStroke, uTime; uniform vec2 uRes;
varying float vX, vY;
${FOG_V}
vec3 hw(float s){
  float lift = 0.5 + 0.5*sin(6.2832*uStroke - 1.2);
  float sag = 4.9 - 2.5*lift*lift;
  vec3 P = mix(uA, uB, s);
  P.y -= sag*4.0*s*(1.0 - s)*(0.75 + 0.5*s);
  P.x += 0.25*sin(uTime*0.9 + s*5.0)*s*(1.0 - s);
  return P;
}
void main(){
  float s = position.x;
  vec3 P = hw(s), T = normalize(hw(s + 0.01) - hw(s - 0.01));
  vec3 toC = cameraPosition - P; float dist = length(toC);
  vec3 sdv = normalize(cross(T, toC/max(dist, 1e-3)) + vec3(1e-5));
  float px = 2.0*dist/(projectionMatrix[1][1]*uRes.y);
  P += sdv*position.y*max(0.045, px*0.9);
  vX = position.y; vY = P.y;
  vec4 mvPosition = viewMatrix*vec4(P, 1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
  const fs = /* glsl */`
uniform vec3 uGlow;
varying float vX, vY;
${FOG_F}
void main(){
  float drip = smoothstep(1.6, 0.0, vY);
  vec3 col = vec3(0.03, 0.028, 0.022) + uGlow*(0.02 + 0.07*drip)*(0.5 - 0.5*vX);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide,
    uniforms: { ...fogU(), uA: { value: from.clone() }, uB: { value: to.clone() }, uStroke, uTime: SH.uTime, uRes, uGlow: SH.uGlow } }));
  mesh.frustumCulled = false;
  return mesh;
}

// THE SURFACE PASSING OVER THE LENS at the break (a full-screen pass, off otherwise). It is drawn as water, not as a
// tinted band: from 0.07 s before the break the lens is wholly in the sea (the frame is the glowing layer seen from
// inside, opaque: bright at the top, deep teal at the bottom, with slanting streaks of light, a broken caustic net and
// a few blurred bubbles, so nothing of the true surface shows through), then the waterline falls down the glass in
// 0.6 s as ONE ROUNDED CREST: glowing water below it (thin enough near the crest for the sails to show through), a
// thin bright meniscus along it and the sea's light gathered under it. Above it the glass is left wet for a moment: a film that
// thins away and a handful of small beads (each under 2 % of the frame's height, fewer than ten, only below the
// horizon: never over the sky) that slide down and are gone 0.7 s after the break.
function makeLensSheet(SH, uRes, body, deepC) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const U = { uSheet: { value: new THREE.Vector3(0, 0, 0) }, uRes, uGlow: SH.uGlow, uBody: { value: body }, uDeepC: { value: deepC }, uTime: SH.uTime };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */`
${Q_NOISE}
uniform vec3 uSheet; uniform vec2 uRes; uniform vec3 uGlow, uBody, uDeepC; uniform float uTime;     // uSheet: x = seconds since the lens broke the surface, y = how far the water has closed over the lens just before it (0..1), z = the horizon's height on the screen (0 bottom .. 1 top)
void main(){
  vec2 uv = gl_FragCoord.xy/max(uRes, vec2(1.0));
  float asp = uRes.x/max(uRes.y, 1.0), x = uv.x*asp, tb = max(uSheet.x, 0.0), t = uTime;
  float s = clamp(tb/0.62, 0.0, 1.0); s = s*s*(3.0 - 2.0*s);
  float E = 1.3 - 1.45*s + 0.11*sin(x*2.0 + 0.9) + 0.03*sin(x*5.1 + tb*7.0) + 0.014*(qN(vec2(x*8.0, tb*4.0)) - 0.5);      // the waterline: one broad rounded crest
  float d = uv.y - E;                                         // > 0: the glass is clear of the sea here
  float below = 1.0 - smoothstep(-0.008, 0.003, d);
  float rim = exp(-(d + 0.004)*(d + 0.004)/0.00011);          // the meniscus
  float gather = exp(-max(-d, 0.0)/0.09)*below;               // light gathered under the crest
  // THE WATER STILL OVER THE LENS has depth: it is the glowing layer seen from inside, brightest just under the crest
  // and falling to deep teal toward the bottom of the frame. Light stands in it as long soft streaks that slant up to
  // the crest and slide with the water; the ceiling's caustic web is drawn stretched along the run of the water and
  // broken by a second layer, so it is an irregular net of pinched bright strokes, never a closed ring; and a few
  // bubbles run down as short blurred streaks. Close under the crest the water is thin and the scene shows through it.
  float deep = clamp(-d/0.9, 0.0, 1.0);
  float sl = x + 0.42*uv.y;
  float st = 0.62*qN(vec2(sl*11.0, uv.y*1.1 - tb*2.4 + 3.0)) + 0.38*qN(vec2(sl*26.0 + 5.0, uv.y*2.2 - tb*4.2));
  st = smoothstep(0.38, 0.86, st);
  vec2 q = vec2(x*6.0, (uv.y + 0.55*tb)*2.4);
  vec2 cw = q + 2.0*(vec2(qN(q*0.33 + t*0.07), qN(q*0.33 + 3.3 - t*0.06)) - 0.5);
  float r1 = 1.0 - abs(2.0*qN(cw + vec2(t*0.2, 0.0)) - 1.0), r2 = 1.0 - abs(2.0*qN(cw*1.7 + 4.1 - vec2(0.0, t*0.27)) - 1.0);
  float wb = r1*(0.4 + 0.6*r2); wb *= wb; float web = wb*wb;
  vec2 bq = vec2(x*8.0, uv.y*3.0); float bx = floor(bq.x), bs = 2.4 + 2.8*qH(vec2(bx, 5.0));
  bq.y += tb*bs + 9.0*qH(vec2(bx, 23.0)); float by = floor(bq.y), bh = qH(vec2(bx, by) + 3.0);
  vec2 bf = vec2(fract(bq.x) - 0.5 - 0.3*(qH(vec2(by, bx) + 9.0) - 0.5), fract(bq.y) - 0.5);
  float bub = step(0.8, bh)*exp(-bf.x*bf.x/0.012)*(1.0 - smoothstep(0.08, 0.42, abs(bf.y)));
  float lum = (0.5 + 0.38*web + 0.28*st*(1.0 - 0.5*deep) + 0.08*(qN(q*0.31 + vec2(t*0.11, -t*0.07)) - 0.5))*(1.22 - 0.72*deep) + 0.24*gather*gather;
  vec3 col = (mix(uBody, uDeepC, 0.6*deep)*lum + uGlow*0.2*bub*(1.0 - 0.5*deep))*below;
  float al = below*(0.74 + 0.26*smoothstep(0.0, 0.2, -d));
  // the wet glass above the line: a film that thins with height above the crest and with time
  float dry = 1.0 - smoothstep(0.3, 0.65, tb), bdry = 1.0 - smoothstep(0.5, 0.7, tb);
  float film = 0.1*exp(-max(d, 0.0)/0.16)*(0.6 + 0.4*qN(vec2(x*6.0, uv.y*2.0 + tb*2.5)))*(1.0 - below)*dry;
  // beads: about one cell in four of a grid a ninth of the frame high, only in the strip of frame under the horizon
  // (uSheet.z) and never above 0.4 of its height; each column slides down at its own speed, each bead is thrown about
  // inside its cell and is a small lens (dark top, the sea turned over as a bright crescent below, a glint)
  float zone = (1.0 - smoothstep(uSheet.z - 0.035, uSheet.z - 0.008, uv.y))*(1.0 - smoothstep(0.34, 0.4, uv.y));
  vec2 gq = vec2(x*9.0 + 0.3*sin(uv.y*23.0), uv.y*9.0); float cx = floor(gq.x), sp = 0.35 + 0.9*qH(vec2(cx, 3.0));
  gq.y += tb*sp + 7.0*qH(vec2(cx, 17.0)); float cy = floor(gq.y), hh = qH(vec2(cx, cy) + 7.0);
  vec2 f = vec2(fract(gq.x), fract(gq.y)) - 0.5 - 0.5*(vec2(qH(vec2(cx, cy) + 1.3), qH(vec2(cy, cx) + 5.1)) - 0.5);
  float r = 0.045 + 0.03*qH(vec2(cx, cy) + 11.0), rr = length(f*vec2(1.0, 0.85))/r;
  float bead = step(0.72, hh)*(1.0 - smoothstep(0.7, 1.0, rr))*smoothstep(0.0, 0.04, d)*bdry*zone;
  float cres = smoothstep(0.3, 1.0, rr)*smoothstep(-0.3, 0.9, -f.y/r);                         // the sea, turned over inside the bead
  float glint = exp(-dot(f - vec2(-0.3, 0.35)*r, f - vec2(-0.3, 0.35)*r)/(0.05*r*r + 1e-5));
  col += uGlow*(0.5*rim*(1.0 - 0.5*below) + 0.42*film) + uBody*bead*(0.1 + 0.8*cres + 0.6*glint);
  al = max(al, clamp(0.6*rim + 0.5*film + 0.7*bead, 0.0, 0.9));
  float cover = uSheet.x < 0.0 ? uSheet.y : 1.0;             // just before the break: the sea closing over the lens
  gl_FragColor = vec4(col*cover, al*cover);
}`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 999; mesh.visible = false;
  return { mesh, uniforms: U };
}

// company on the horizon: four becalmed two-masted dhows. They are SILHOUETTES: black hulls and dark canvas
// against the glow (only the sail feet catch the sea light), and each carries amber light: a lantern on the
// poop, one under the masthead and lit cabin panes. The lantern light on hull, spars and canvas is baked per
// vertex (aWarm: the lamps are rigid with the dhow). list: [{ x, z, h (heading rad), s (scale) }]. One mesh;
// they roll, heave on the swell and their sails slat in the vertex shader. Local: bow -Z, 27 m on deck.
// Returns { mesh, lamps: [{ p: Vector3 rest position, d: index into list, size, sea: strength of its glitter
// path on the water }], hide: the uniform that folds one vessel away }; dhowPoint() gives a lamp's place for the
// current roll.
const DHOW_LAMPS = [[0, 8.4, 12.5, 2.2], [-0.7, 19.3, -5.3, 1.5]];        // model space: x, y, z, strength
async function makeDhows(SH, hero, list, pause) {
  const A = makeAcc(), DK = [0.02, 0.018, 0.016], STR = [0.06, 0.05, 0.036], SPAR = [0.11, 0.09, 0.06], CAN = [0.19, 0.18, 0.155], LENS = [0.95, 0.5, 0.15], PANE = [0.5, 0.25, 0.07];
  const lamps = [], owner = [];
  for (let di = 0; di < list.length; di++) {
    const d = list[di];
    const c = Math.cos(d.h), sn = Math.sin(d.h), sc = d.s, an0 = [d.x, d.z, d.h, 0], anL = [d.x, d.z, d.h, 1], n0 = A.n;
    const W = (x, y, z) => [d.x + sc * (c * x + sn * z), sc * y, d.z + sc * (-sn * x + c * z)];
    const hb = (s) => 3.5 * Math.pow(Math.sin(Math.PI * clamp(s * 0.9 + 0.075, 0, 1)), 0.6);
    const sheer = (s) => 2.1 + 2.5 * Math.pow(Math.abs(2 * s - 1), 2.2) * (s < 0.5 ? 1.5 : 1.05), keel = (s) => -2.0 + 2.9 * smoothstep(0.74, 1, s) + 0.9 * (1 - smoothstep(0, 0.14, s));
    tube(A, 14, 12, (i, k) => {
      const s = i / 14, th = k / 12 * Math.PI * 2, cc = Math.cos(th), ss = Math.sin(th), b = hb(s);
      const y = ss < 0 ? lerp(sheer(s), keel(s), Math.pow(-ss, 0.75)) : sheer(s) + 0.12 * ss;
      return W(b * Math.sign(cc) * Math.pow(Math.abs(cc), ss < 0 ? 0.55 : 1) * (ss < 0 ? 1 : 0.97), y, 12.5 - 27 * s);
    }, (i, k) => (Math.sin(k / 12 * Math.PI * 2) > -0.45 ? STR : DK), an0);
    const pA = [0, sheer(0.03) + 0.75, 12.0], pB = [0, sheer(0.2) + 0.7, 6.4];
    bar(A, W(...pA), W(...pB), 2.0 * sc, 0.7 * sc, DK, an0);                                                          // poop
    bar(A, W(0, sheer(0.99) - 0.2, -14.3), W(0, sheer(0.99) + 2.4, -15.9), 0.16 * sc, 0.2 * sc, STR, an0);           // stem head
    // lit cabin panes along both sides of the poop, a staff and lantern on the poop, a lantern under the masthead
    for (const sd of [-1, 1]) for (const f of [0.28, 0.62]) {
      const y = lerp(pA[1], pB[1], f) + 0.12, z = lerp(pA[2], pB[2], f), x = sd * 2.06;
      quad(A, W(x, y - 0.26, z - 0.5), W(x, y - 0.26, z + 0.5), W(x, y + 0.26, z + 0.5), W(x, y + 0.26, z - 0.5), PANE, anL);
      lamps.push({ p: new THREE.Vector3(...W(x + sd * 0.15, y, z)), d: di, size: 0.42, sea: 0 });
    }
    bar(A, W(0, pA[1] + 0.6, 12.5), W(0, DHOW_LAMPS[0][1] - 0.3, 12.5), 0.05 * sc, 0.05 * sc, SPAR, an0);
    for (const [lx, ly, lz, lw] of DHOW_LAMPS) {
      bar(A, W(lx, ly - 0.28, lz), W(lx, ly + 0.28, lz), 0.17 * sc, 0.17 * sc, LENS, anL);
      lamps.push({ p: new THREE.Vector3(...W(lx, ly, lz)), d: di, size: lw > 2 ? 1 : 0.8, sea: lw > 2 ? 1 : 0, w: lw });
    }
    for (const [foot, top, r, y0, y1, tack, clew, side] of [
      [[0, 2.3, -1.5], [0, 21.5, -5.6], 0.3, [0, 4.8, -15.2], [0, 31.5, 5.8], [0, 4.6, -14.6], [0, 3.6, 9.6], 1],
      [[0, 3.6, 7.6], [0, 15.5, 5.6], 0.2, [0, 6.0, 1.2], [0, 20.5, 11.4], [0, 5.9, 1.7], [0, 4.9, 13.4], -1]]) {
      bar(A, W(...foot), W(...top), r * sc, r * sc, SPAR, an0);
      bar(A, W(...y0), W(...y1), 0.2 * sc, 0.2 * sc, SPAR, an0);
      const NU = 12, NV = 7, P = (iu, iv) => {
        const u = iu / NU, v = iv / NV, w = Math.sin(Math.PI * u) * Math.sin(Math.PI * Math.min(1, v * 1.15));
        const yx = lerp(y0[1], y1[1], u) - 0.35, yz = lerp(y0[2], y1[2], u), fy = lerp(tack[1], clew[1], u) - 1.6 * Math.sin(Math.PI * u), fz = lerp(tack[2], clew[2], u);
        const q = W(side * (1.9 * w + 0.22 * Math.sin(u * 23) * v), lerp(yx, fy, v), lerp(yz, fz, v)); q.w = w; return q;
      };
      for (let iu = 0; iu < NU; iu++) for (let iv = 0; iv < NV; iv++) {
        const q = [P(iu, iv), P(iu + 1, iv), P(iu + 1, iv + 1), P(iu, iv + 1)], base = A.n;
        for (const v of q) vtx(A, v[0], v[1], v[2], CAN, [d.x, d.z, d.h, 10 + v.w]);
        A.i.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    for (let i = n0; i < A.n; i++) owner.push(di);
    await pause();
  }
  const g = accGeo(A), pos = g.attributes.position.array, nor = g.attributes.normal.array, an = g.attributes.aAnim.array, nv = g.attributes.position.count, warm = new Float32Array(nv);
  await pause();
  const lit = lamps.filter((L) => L.w);
  for (let i = 0; i < nv; i++) {
    if (i % 800 === 799) await pause();
    const sail = an[i * 4 + 3] >= 10, sc = list[owner[i]].s; let w = 0;
    for (const L of lit) {
      if (L.d !== owner[i]) continue;
      const dx = L.p.x - pos[i * 3], dy = L.p.y - pos[i * 3 + 1], dz = L.p.z - pos[i * 3 + 2], r2 = dx * dx + dy * dy + dz * dz;
      const nl = (nor[i * 3] * dx + nor[i * 3 + 1] * dy + nor[i * 3 + 2] * dz) / Math.sqrt(Math.max(r2, 1e-4));
      w += L.w * (sail ? 0.45 + 0.55 * Math.abs(nl) : 0.12 + 0.88 * Math.max(nl, 0)) / (1 + r2 * (sail ? 0.22 : 0.075) / (sc * sc));
    }
    warm[i] = w;
  }
  g.setAttribute('aWarm', new THREE.Float32BufferAttribute(warm, 1));
  const vs = hero.swellGLSL + BODY_HEAD + /* glsl */`
attribute float aWarm; varying float vWarm, vKind; uniform vec3 uHide;      // uHide: x, z of one vessel, and 1 while she is folded away (every vertex on her pivot: no pixels)
void main(){
  vec3 P = position, Nn = normal; vL = position; vWarm = aWarm; vKind = aAnim.w;
  vec3 pv = vec3(aAnim.x, 0.0, aAnim.y);
  P = mix(P, pv, uHide.z*step(abs(aAnim.x - uHide.x) + abs(aAnim.y - uHide.y), 0.5));
  vec3 q = P - pv, fw = vec3(-sin(aAnim.z), 0.0, -cos(aAnim.z));
  float ph = aAnim.x*0.37, ang = 0.05*sin(uTime*0.62 + ph) + 0.018*sin(uTime*1.31 + ph*2.0);
  P += ang*vec3(-fw.z*q.y, fw.z*q.x - fw.x*q.z, fw.x*q.y);                                  // roll about the keel line
  P += vec3(-fw.z, 0.0, fw.x)*0.8*max(aAnim.w - 10.0, 0.0)*step(9.5, aAnim.w)*sin(uTime*0.62 + ph + 1.2);       // the lateens slat as she rolls
  P.y += msSwell(pv.xz);
` + BODY_TAIL;
  const pattern = /* glsl */`
  if (vKind > 9.5) {                        // dark, thin canvas: only the foot catches the sea, the head is dusk; cloth seams
    float h = clamp((vWp.y - 3.5)/27.0, 0.0, 1.0);
    alb *= (1.0 - 0.8*h)*(0.8 + 0.2*smoothstep(0.08, 0.2, abs(fract(vL.y*0.8 + vL.z*0.3) - 0.5)));
    N = normalize(N + vec3(0.0, -0.9, 0.0));
    emi = uWarm*vWarm*0.3*(0.75 + 0.25*sin(uTime*7.0 + vL.x));
  } else if (vKind > 0.5) emi = vCol*3.4*(0.9 + 0.1*sin(uTime*9.0 + vL.z));        // lantern lens, lit panes
  else emi = uWarm*vWarm*(vCol*2.2 + 0.012);`;
  const hide = { value: new THREE.Vector3(0, 0, 0) };
  const mesh = new THREE.Mesh(g, bodyMat(SH, vs, pattern, { uMsTime: hero.uniforms.uMsTime, uMsAmp: hero.uniforms.uMsAmp, uWarm: SH.uWarm, uHide: hide }, {}, 'uniform vec3 uWarm; varying float vWarm, vKind;'));
  mesh.frustumCulled = false;
  return { mesh, lamps, hide };
}
// where a point of a dhow is right now (the roll and heave of makeDhows' vertex shader, on the CPU)
function dhowPoint(p, d, t, hero, out) {
  const ph = d.x * 0.37, ang = 0.05 * Math.sin(t * 0.62 + ph) + 0.018 * Math.sin(t * 1.31 + ph * 2), fx0 = -Math.sin(d.h), fz0 = -Math.cos(d.h);
  const qx = p.x - d.x, qy = p.y, qz = p.z - d.z;
  return out.set(p.x + ang * (-fz0 * qy), p.y + ang * (fz0 * qx - fx0 * qz) + hero.swellHeight(d.x, d.z, t), p.z + ang * (fx0 * qy));
}

// THE STAR BAND and the glow off the sea. The kit sky keeps its gradient and its 3,000 stars; this dome adds,
// over it, the Milky Way: a low arch that rises from the horizon off the port bow, climbs across the sky above
// the ring (35 degrees up off the starboard bow) and comes down on the starboard quarter. It is drawn as what it
// is: a soft river of unresolved light with a brighter bulge low to the left of the ring, split by dust lanes
// that follow the spine and mottled into star clouds, under a dust of fine points. The points are five layers
// of hashed cells, each layer turned by its own fixed rotation (no two grids line up with each other or with the
// screen), at most half their cells filled, each star jittered through most of its cell; a layer fades out
// before its cells shrink under ~2.4 pixels (uPx: the angle one pixel covers, from update), so there is never a
// lattice or a screen-door. At the horizon the sea's own light lifts into the air (so the sea never ends in a
// hard cut against black; in the "edge" mood there is none over the black water).
function makeStarBand(SH, o) {
  const e1 = new THREE.Vector3().crossVectors(o.pole, new THREE.Vector3(0, 1, 0)).normalize(), e2 = new THREE.Vector3().crossVectors(o.pole, e1);
  if (e2.y < 0) e2.negate();
  const U = { uTime: SH.uTime, uPole: { value: o.pole }, uE1: { value: e1 }, uE2: { value: e2 }, uBandCol: { value: o.color }, uSeaCol: { value: o.sea }, uEdgeD: { value: o.edge }, uAmt: { value: o.amount }, uPx: { value: 0.0024 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.ShaderMaterial({
    uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, transparent: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
    fragmentShader: /* glsl */`
${Q_NOISE}
uniform float uTime, uPx; uniform vec3 uPole, uE1, uE2, uBandCol, uSeaCol; uniform vec4 uEdgeD; uniform vec3 uAmt;      // amount: stars, haze, horizon glow
varying vec3 vD;
float sH(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y)*p.z); }
// one layer of stars: S cells per radian. Returns brightness; h3 (0..1) comes back for the tint
float starLayer(vec3 d, float S, float dens, out float tint){
  vec3 q = d*S, id = floor(q), f = fract(q) - 0.5;
  float h = sH(id), h2 = sH(id + 7.7), h3 = sH(id + 3.1), hb = sH(id + 11.3);
  float r = clamp(0.62*uPx*S, 0.07, 0.2);                                   // at least ~1.2 px across, never past its cell
  float dd = length(f - (vec3(h2, h3, sH(id + 5.3)) - 0.5)*0.6);
  float e = min(0.16/r, 2.0);
  tint = h3;
  return step(h, dens)*(0.16 + 0.84*hb*hb*hb)*(1.0 - smoothstep(0.3*r, r, dd))*e*e*(0.8 + 0.2*sin(uTime*(1.5 + 4.0*h3) + h*50.0))*(1.0 - smoothstep(0.42, 0.55, uPx*S));
}
void main(){
  vec3 d = normalize(vD);
  float x = atan(dot(d, uE2), dot(d, uE1) + 1e-5);
  if (x < -1.5708) x += 6.2832;      // (the angle's seam is turned away under the sea, off the band: at the band's foot off the port bow it cut a straight crease through the glow)
  // along the band: 0 at its foot on the starboard quarter, pi/2 at the top of the arch, 2.4 over the ring, pi at its foot off the port bow
  float lat = dot(d, uPole) + 0.03*sin(x*3.0 + 0.7) + 0.016*sin(x*7.0 + 1.0);
  float B = exp(-lat*lat/0.022) + 0.3*exp(-lat*lat/0.16);
  float core = 0.5 + 0.5*smoothstep(0.6, 2.4, x);
  vec2 bq = vec2(x*4.6, lat*17.0);
  float dl = qF3(bq + 1.3*vec2(qN(vec2(x*2.1, lat*5.0) + 7.0), qN(vec2(x*2.1, lat*5.0) + 2.0)));
  float lane = smoothstep(0.45, 0.64, dl)*exp(-lat*lat/0.008)*smoothstep(0.8, 1.4, x);        // the dark rift along the spine
  float cl = qF3(bq*0.6 + 5.0 + 0.8*vec2(qN(bq*0.31 + 1.0), qN(bq*0.31 + 4.0)));               // star clouds
  vec2 bg = vec2((x - 2.76)/0.36, lat/0.17);
  float bulge = exp(-dot(bg, bg));                                                           // the bright heart, low to the left of the ring
  float dens = (B*core + 0.8*bulge)*(1.0 - 0.8*lane)*(0.5 + 1.0*cl);
  float up = smoothstep(0.0, 0.14, d.y);
  // each layer in its own frame
  vec3 d1 = vec3(0.7071*d.x - 0.7071*d.y, 0.5*d.x + 0.5*d.y - 0.7071*d.z, 0.5*d.x + 0.5*d.y + 0.7071*d.z);
  vec3 d2 = vec3(0.3536*d.x + 0.6124*d.y + 0.7071*d.z, -0.8660*d.x + 0.5*d.y, -0.3536*d.x - 0.6124*d.y + 0.7071*d.z);
  vec3 d3 = vec3(0.8138*d.x - 0.4698*d.y + 0.3420*d.z, 0.5438*d.x + 0.8232*d.y - 0.1632*d.z, -0.2049*d.x + 0.3188*d.y + 0.9254*d.z);
  vec3 d4 = vec3(0.4330*d.x + 0.75*d.y - 0.5*d.z, -0.4356*d.x + 0.6597*d.y + 0.6124*d.z, 0.7891*d.x - 0.0474*d.y + 0.6124*d.z);
  float t0, t1, t2, t3, t4;
  float s0 = starLayer(d + 0.13, 300.0, 0.5*dens, t0), s1 = starLayer(d1 + 0.37, 210.0, 0.5*dens, t1), s2 = starLayer(d2 + 0.71, 150.0, 0.5*dens + 0.004, t2),
    s3 = starLayer(d3 + 0.29, 96.0, 0.42*dens + 0.01, t3), s4 = starLayer(d4 + 0.53, 56.0, 0.15*dens + 0.006, t4);
  float st = 0.5*s0 + 0.55*s1 + 0.65*s2 + 0.8*s3 + 0.9*s4;
  float tn = (0.5*s0*t0 + 0.55*s1*t1 + 0.65*s2*t2 + 0.8*s3*t3 + 0.9*s4*t4)/max(st, 1e-4);
  vec3 col = mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.9, 0.8), tn*tn)*st*uAmt.x;
  // the unresolved light: violet-grey, a little warmer in the heart, mottled, cut by the rift
  float glow = (0.04*B*core*(0.45 + 1.1*cl) + 0.034*bulge*(0.6 + 0.8*cl))*(1.0 - 0.72*lane);
  col += mix(uBandCol, vec3(0.92, 0.84, 0.86), 0.5*bulge)*(glow*uAmt.y);
  col *= up;
  float el = max(d.y, 0.0);
  float ef = mix(1.0, smoothstep(-0.30, 0.34, dot(d.xz/max(length(d.xz), 1e-3), uEdgeD.xy)), uEdgeD.w);      // (the same wide falling-off as the sea's far field in SEA_FS)
  col += uSeaCol*(uAmt.z*ef*(0.36*exp(-el/0.018) + 0.09*exp(-el/0.075)));
  gl_FragColor = vec4(col, 1.0);
}`,
  }));
  m.frustumCulled = false; m.renderOrder = -0.9; m.scale.setScalar(3000);
  m.userData.uPx = U.uPx;
  return m;
}

// the spray a whale throws up where it leaves the sea and where it falls back: 6 sites (uSpl: x, z, age, size;
// uSplV: the leap's direction and how far the water is thrown along it). Not a puff: a CROWN of fine droplets
// thrown up and outward in a cone (a V seen from the side), each drawn as a short streak along its own flight,
// blue where the sea lights it from below and paling toward the top, with a thin veil of mist left hanging
// behind them. One instanced mesh; everything is a function of the site's age.
function makeSpray(SH, rng, uSpl, uSplV, per) {
  const N = per * 6, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const iA = new Float32Array(N * 4), iB = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const a = rng.range(0, 6.283), site = Math.floor(i / per), land = site % 2, up = Math.pow(rng(), 1.3), mist = rng() < (land ? 0.12 : 0.17);
    const vy = (land ? 3.5 : 4.5) + (land ? 5.5 : 7.5) * up, cone = (land ? 0.75 : 0.42) + rng.range(-0.14, 0.2);      // outward speed = vy * cone: a V
    iA.set([Math.cos(a), Math.sin(a), vy * cone * (mist ? 0.5 : 1), vy * (mist ? 0.55 : 1)], i * 4);
    // (where she leaves the sea the water keeps going up for as long as her body is passing through it, 1.5 s: at
    // the top of her leap the crown still stands round her)
    iB.set([rng.range(0, land ? 0.3 : 1.5) * (0.4 + 0.6 * (1 - up)), mist ? -rng.range(1.3, land ? 2.4 : 3.0) : rng.range(0.07, 0.19), rng(), site], i * 4);      // delay, size (negative = mist), random, site
  }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = N;
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uSpl, uSplV, uBlue: SH.uBlue }, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
attribute vec4 iA, iB;
uniform vec4 uSpl[6]; uniform vec4 uSplV[6];
varying vec2 vC; varying vec3 vA; varying float vY;
vec3 fly(vec4 S, vec4 D, float a, float k){
  vec3 v = vec3(iA.x*iA.z + D.x*D.z*(0.4 + 0.6*iB.z), iA.w, iA.y*iA.z + D.y*D.z*(0.4 + 0.6*iB.z))*sqrt(S.w);
  vec3 P = vec3(S.x, 0.3, S.y) + vec3(iA.x, 0.0, iA.y)*S.w*1.5*iB.z + v*a*(1.0 - 0.18*k);
  P.y = max(P.y - 4.9*a*a, 0.12);
  return P;
}
void main(){
  int si = int(iB.w + 0.5);
  vec4 S = uSpl[si], D = uSplV[si];
  float mist = step(iB.y, 0.0), size = abs(iB.y), lv = 1.0 - mod(iB.w, 2.0);        // lv: 1 at the two sites where a whale leaves the sea
  float a = S.z - iB.x, life = mix(1.9 + 2.2*iB.z, 3.6 + 1.5*iB.z, mist), k = clamp(a/life, 0.0, 1.0);
  float alive = step(0.0, a)*step(a, life);
  vec3 P = fly(S, D, a, k), P2 = fly(S, D, a + 0.05, k);
  vec4 mv = viewMatrix*vec4(P, 1.0), mv2 = viewMatrix*vec4(P2, 1.0);
  vec2 dv = mv2.xy - mv.xy; float dl = length(dv);
  vec2 ax = dl > 1e-4 ? dv/dl : vec2(0.0, 1.0), sd = vec2(ax.y, -ax.x);      // (sd, ax) right-handed: the quad keeps facing the lens
  float sz = size*sqrt(S.w)*mix(0.8 + 0.5*k, 0.7 + 1.6*k, mist)*alive;
  float stretch = mix(1.0 + min(dl*9.0, 3.2), 1.0, mist);                   // a droplet is a streak along its flight
  vec2 off = (sd*position.x + ax*position.y*stretch)*sz;
  mv.xy += off;
  vC = position.xy;
  vY = P.y + off.x*viewMatrix[1][0] + off.y*viewMatrix[1][1];      // this corner's height above the sea
  vA = vec3(alive*smoothstep(0.0, 0.05, k)*(1.0 - k)*mix(0.95*smoothstep(0.12, 0.5, P.y), (0.2 + 0.28*lv)*(1.0 - 0.5*k), mist), clamp(P.y/(9.0*sqrt(S.w)), 0.0, 1.0), mist);
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uBlue;
varying vec2 vC; varying vec3 vA; varying float vY;
void main(){
  float r2 = dot(vC, vC), core = exp(-r2*mix(5.5, 2.6, vA.z)), al = vA.x*core*(1.0 - smoothstep(0.7, 1.0, r2));
  al *= mix(1.0, smoothstep(0.0, 1.1, vY), vA.z);      // the mist thins into the water: the sea never cuts a veil along a straight line (seen from 7 m up beside the bull)
  vec3 c = mix(uBlue*1.25, vec3(0.86, 0.97, 1.0), 0.25 + 0.5*vA.y*vA.y);          // lit blue from below, paling as it climbs out of the light
  gl_FragColor = vec4(c*(mix(2.9, 1.9, vA.z)*al), mix(0.7, 0.5, vA.z)*al);      // brighter than the sea that lights it: the droplets glitter
}`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// ---------------------------------------------------------------- 5. the world
export default {
  id: 'milky-sea',
  name: 'The Milky Sea',
  category: 'ocean',
  weirdness: 0.3,
  media: ['air', 'underwater'],
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = vary.density ?? 1;
    // ---- seeded mood (first rng draw), hour and rare event
    const mood = MOODS[Math.min(MOODS.length - 1, Math.floor(rng() * MOODS.length))];
    const dawn = vary.hour === 'dawn', rare = !!vary.rare;
    const pal = mood.pal.map((h) => new THREE.Color(h));
    const scene = new THREE.Scene();

    // ---- hero: the barque at the origin, bow toward -Z (brief space == hero space)
    const heroPal = mood.pal.slice(); heroPal[4] = mood.dusk;        // sail heads: a muted violet-grey dusk (the brief's #3A3158 at lower chroma)
    const hero = await buildHero(ctx, { palette: heroPal, sea: false, contact: true });
    scene.add(hero.object);
    const AN = hero.anchors;
    await ctx.yield();

    // ---- PATH: entry 12 m down, 109 m off the port quarter, then the hero's fly-through line to the ring.
    // The approach is CUT metres shorter than it first was (the surface break comes at u 0.18 and the lens is clear
    // of the slot's canvas by u 0.34). Everything keyed to u was tuned on the longer route, so those constants are
    // written K(old u): the same place on the route.
    const CUT = 16, PTS = [[-73 + CUT * 0.5, -12, 128.1 - CUT * 0.866], AN.viewpoints.underKeel, ...AN.flyThrough];
    const xr = ctx.core.makeRng('milky-sea-extras:' + ctx.seed);       // its own stream: the extras never reshuffle the world's draws
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed('milky-sea-' + name + ':' + ctx.seed));      // a stream of its own, from the world's seed and a name, for each thing added since the site's version: it draws nothing from xr, so what follows it there is dealt as on the site
    const path = makePath(PTS);
    const L_OLD = path.length + CUT, K = (uo) => (uo * L_OLD - CUT) / path.length;
    await ctx.yield();
    let lo = 0.15, hi = 0.3; const tp = new THREE.Vector3(), tt = new THREE.Vector3();
    for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, tp).y < 0) lo = m; else hi = m; }
    const BREAK_U = (lo + hi) / 2;                                   // where the lens breaks the surface (about 0.195)

    // ---- PLACES ON THE ROUTE AND A BEAT OF THE DESIGN that the cast is keyed to. uOfPoint(i): where the
    // lens passes route point i (the route goes through every point of PTS; searched along the route in metres);
    // abeam(z, i, j): where, between route points i and j, the lens is abeam of the ship's station z (a mast).
    const uOfPoint = (i) => {
      const P = path.points[i], L = path.length; let bd = 0, best = Infinity;
      for (let d = 0; d <= L; d += 0.5) { const q = path.posAtDist(d, tp).distanceToSquared(P); if (q < best) { best = q; bd = d; } }
      let a = Math.max(0, bd - 0.5), b = Math.min(L, bd + 0.5);
      for (let k = 0; k < 24; k++) { const m1 = a + (b - a) / 3, m2 = b - (b - a) / 3; if (path.posAtDist(m1, tp).distanceToSquared(P) < path.posAtDist(m2, tp).distanceToSquared(P)) b = m2; else a = m1; }
      return (a + b) / 2 / L;
    };
    const abeam = (z, i, j) => {
      let a = uOfPoint(i), b = uOfPoint(j); const sa = Math.sign(path.pointAt(a, tp).z - z);
      for (let k = 0; k < 30; k++) { const m = (a + b) / 2; if (Math.sign(path.pointAt(m, tp).z - z) === sa) a = m; else b = m; }
      return (a + b) / 2;
    };
    const MAST_Z = [-14, 3, 19];                // fore, main, mizzen (the hero's stations)
    const T_LEVEL = 42.3;                       // a second of the design's journey: the swoop ends and the final run begins
    const DEG = Math.PI / 180;                  // one degree, in radians (the cast's headings)
    const U_QTR = uOfPoint(9);                  // the quarter (the hero's viewpoint 40, 42, 35.4)
    const U_JIB = uOfPoint(18);                 // over the jib-boom end, half way down the swoop (route point 6.6, 29, -45)
    await ctx.yield();
    const U_FORE = abeam(MAST_Z[0], 17, 18);    // the lens abeam of the fore mast on the top run (9.9 m to starboard of her truck, 7.1 m higher: beside it, not over it)
    await ctx.yield();

    // ---- shared uniforms, colours, FOG and lights
    const time = { value: 0 }, uStroke = { value: 0 }, uRes = { value: new THREE.Vector2(800, 450) };
    const SH = { uTime: time, uGlow: hero.uniforms.uMsGlow, uSkyFill: hero.uniforms.uMsSky,
      uBlue: { value: new THREE.Color('#62B6FF') }, uWarm: hero.uniforms.uMsWarm };       // THE SECOND COLOURS: disturbed water, lantern light
    const bright = pal[0].clone().multiplyScalar(0.87), lane = pal[2].clone().lerp(pal[1], 0.1);
    const farCol = lane.clone().lerp(bright, 0.6).multiplyScalar(mood.haze ? 0.95 : 0.8);
    const AIR_FOG = { color: new THREE.Color(mood.haze ? '#12302E' : '#0A1E1E'), density: mood.haze ? 0.0032 : 0.0019 };
    const WATER_FOG = { color: pal[1].clone().lerp(pal[2], 0.45).multiplyScalar(0.4), density: 0.005 };
    WATER_FOG.color.r *= 0.8; WATER_FOG.color.b *= 1.25;
    const AIR_BG = new THREE.Color('#020208'), WATER_BG = new THREE.Color('#010504');
    scene.fog = new THREE.FogExp2(AIR_FOG.color.clone(), AIR_FOG.density);
    scene.background = AIR_BG.clone();
    scene.add(new THREE.HemisphereLight('#0A0A1E', '#7FE0BE', 1.6));   // for rides / companions: the same upside-down light
    const glowHex = '#' + pal[0].clone().lerp(pal[1], 0.45).getHexString();
    await ctx.yield();
    const UNDER_LIGHT = { sunDir: [0, -1, 0], sunColor: glowHex, sunIntensity: 2.2, sky: '#0A0A1E', skyIntensity: 0.25, ground: glowHex, groundIntensity: 2.4 };
    const WATER_LIGHT = { sunDir: [0, 1, 0], sunColor: glowHex, sunIntensity: 1.0, sky: glowHex, skyIntensity: 0.7, ground: '#03100e', groundIntensity: 0.4 };

    // ---- sky: moonless, cloudless, stars and the Milky Way over the mastheads
    const sky = makeSky({
      rng, preset: 'night', bodies: [], key: 'sun', clouds: false, clouds2: false,
      zenith: mood.pal[3], mid: mood.pal[3], horizon: mood.horizon, ground: mood.edge ? '#020406' : farCol, horizonPow: mood.haze ? 9 : mood.edge ? 7 : 16, groundFalloff: 90,
      stars: mood.haze ? 0.5 : 1, twinkle: 0.45, milkyWay: 0, milkyAxis: [0.906, 0, -0.423], milkyAngle: 148, milkyColor: '#8a86a0', milkyCore: '#b4acc4',
      scatter: dawn ? 0.8 : 0, scatterColor: '#16324A', scatterPow: 1.2, scatterHigh: 0, scatterFall: 16, sunAzimuth: 180, sunElevation: -8, sunIntensity: 0, sunGlow: 0,
      bake: true, bakeSize: 512, renderer: ctx.renderer,
    });
    scene.add(sky.object);
    await ctx.yield();
    const meteors = fx.makeShootingStars({ rng: xr.fork('met'), time, count: 9, period: [6, 15], duration: 1.4, minElevation: 0.22, intensity: 2.4, color: '#e6f2ff', tailColor: '#8fb4c4' });
    scene.add(meteors.object);
    await ctx.yield();

    // ---- the sea (both sides) and the abyss backdrop
    const wa = rng.range(0, 6.283);
    const seaU = {
      uTime: time, uMsTime: hero.uniforms.uMsTime, uMsAmp: hero.uniforms.uMsAmp, uPattern: { value: mood.pattern }, uRadius: { value: 20000 }, uStroke, uUnder: { value: 0 },
      uBright: { value: bright }, uLane: { value: lane }, uFar: { value: farCol }, uPortalCol: { value: new THREE.Color(mood.portal).multiplyScalar(1.15) },
      uUFog: { value: new THREE.Vector4(WATER_FOG.color.r, WATER_FOG.color.g, WATER_FOG.color.b, WATER_FOG.density) },
      uEdge: { value: new THREE.Vector4(6152, -6152, 9000, mood.edge) }, uBoat: { value: new THREE.Vector4(-17, -92, 1, 0) },
      uSwim: { value: new THREE.Vector4(16, -46, 0.25, 0) }, uSwimK: { value: new THREE.Vector4(mood.cast === 'manta' ? 1 : 0, 0, 0, 0) },
      uPortal: { value: new THREE.Vector4(AN.portalSeat.position.x, AN.portalSeat.position.y, AN.portalSeat.position.z, AN.portalSeat.radius) },
      uWheel: { value: new THREE.Vector4(300, -260, rare ? 1 : 0, 0) }, uWind: { value: new THREE.Vector2(Math.cos(wa), Math.sin(wa)) },
      uOff: { value: new THREE.Vector2(rng.range(-4000, 4000), rng.range(-4000, 4000)) },
      uDh: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4()) },
      uBlue: SH.uBlue, uWarm: SH.uWarm, uTrough: { value: pal[1].clone().lerp(new THREE.Color('#3E9FD0'), 0.42).multiplyScalar(0.62) }, uLamp: { value: [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, 5, 0, 0)) },
      uSpl: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, 0, -1, 1)) },
    };
    // company: six becalmed vessels. Three dhows on the horizon (left of the ring; far to the right of it, beyond the
    // water where the bull breaches; off the port beam); [3] THE NEAR DHOW, a big one lying 70 m off the starboard
    // beam, broadside to the slot with her poop lantern toward the ship: the sweeping gaze comes on to her as it comes
    // out of the canvas, and the pan leaves her by the left edge; [4] a
    // dhow 150 m off the starboard quarter, where the steady camera looks at u 0.36-0.41 and the sweeping pan crosses
    // (THE QUARTER DHOW: the site's own seat, heading, size and rig for her, typed in the table as on the site; the
    // site's gaze, kept as it is, was written to her seat). Her middle is 120 m from the point where the route
    // enters the water, inside the water's own sight distance (1 / WATER_FOG.density = 200 m), so her hull is
    // folded away while the lens is under water (uHide, set in update from the camera's state, for the whole
    // underwater leg);
    // [5] the near dhow's tender (the same model at 0.45: a 12 m boat under a small lateen), lying off her side in
    // the foreground. (k: the size of each one's slick and rings in SEA_FS.)
    // the site's own six seats, inherited unchanged; first work of a later round
    const DHOWS = [{ x: -62, z: -296, h: 2.25, s: 1.0 }, { x: 152, z: -402, h: -0.85, s: 1.12 }, { x: -171, z: -16, h: 0.45, s: 1.05 },
      { x: 72, z: 22, h: -0.52, s: 1.4 }, { x: 50, z: 150, h: -0.9, s: 1.15 }, { x: 66, z: -6, h: -0.3, s: 0.45 }];
    DHOWS.forEach((d, i) => { const k = i < 3 ? 1 : d.s; seaU.uDh.value[i].set(d.x, d.z, Math.cos(d.h) / k, Math.sin(d.h) / k); });
    await ctx.yield();
    const sea = makeSeaMesh(hero, seaU); scene.add(sea);
    await ctx.yield();
    const backdrop = makeBackdrop(seaU); backdrop.visible = false; scene.add(backdrop);
    await ctx.yield();
    const dhows = await makeDhows(SH, hero, DHOWS, () => ctx.yield()); scene.add(dhows.mesh);
    dhows.hide.value.set(DHOWS[4].x, DHOWS[4].z, 0);
    await ctx.yield();
    // the star band over the kit sky, with the sea's glow lifting into the air at the horizon
    const band = makeStarBand(SH, { pole: new THREE.Vector3(0.472, -0.817, -0.331).normalize(), color: new THREE.Color('#b9b4d6'), sea: bright.clone(), edge: new THREE.Vector4(0.7071, -0.7071, 0, mood.edge),
      amount: new THREE.Vector3(mood.haze ? 0.7 : 1, mood.haze ? 0.85 : 1, mood.haze ? 0.75 : 1) });
    scene.add(band);
    await ctx.yield();

    // ---- cast under water: the big swimmer on its entry pass, squid, the fish cloud, marine snow
    const MANTA = mood.cast === 'manta', swimmer = MANTA ? makeMantas(SH) : makeShark(SH);
    if (mood.cast !== 'manta') swimmer.scale.setScalar(1.25);
    scene.add(swimmer);
    await ctx.yield();
    const E0 = path.pointAt(0, new THREE.Vector3()), D0 = path.tangentAt(0, new THREE.Vector3()); D0.y = 0; D0.normalize();
    const L0 = new THREE.Vector3(D0.z, 0, -D0.x);
    // SWIMMER ROUTE (a pure function of te = u * DUR): at the entry it hangs 33 m ahead and 13 m to the left, high
    // against the ceiling, three-quarter on (the silhouette seen through the previous portal); it glides down and
    // in toward the route as the lens comes up, and at 3.5-5 s (u 0.07-0.10) the lens slides along its spotted
    // flank 6 m off, level with it (POIS turns the gaze to it); then it falls astern.
    const SWP = MANTA ? { a0: 36, v: 3.4, s0: 10, s1: 6.5, y0: -9.2, y1: -11.6 } : { a0: 33, v: 3.6, s0: 13, s1: 6, y0: -8.5, y1: -12.3 };
    const swimAt = (te, out) => {
      const a = SWP.a0 + SWP.v * te, sd = lerp(SWP.s0, SWP.s1, smoothstep(0, 3.8, te));
      return out.set(E0.x + D0.x * a + L0.x * sd, lerp(SWP.y0, SWP.y1, smoothstep(0.4, 3.6, te)) + 1.6 * smoothstep(5.5, 8, te), E0.z + D0.z * a + L0.z * sd);
    };
    const swA = new THREE.Vector3(), swB = new THREE.Vector3(), poiW = new THREE.Vector3();
    swimmer.rotation.order = 'YXZ';
    scene.add(makeSquid(SH, rng.fork('squid'), path, Math.max(24, Math.round(60 * dens * detail))));
    await ctx.yield();
    const fauna = F.makeFauna(scene, {});
    fauna.add(F.makeFishSchool({ rng: rng.fork('cloud'), species: 'mackerel', form: 'baitball', count: Math.max(180, Math.round(480 * dens * detail)), size: 2.4, spread: [8.5, 2.8], center: [-8, -5.6, 9],
      top: '#2c5246', belly: '#101a18', fin: '#0a1212', spec: 0, caustics: 0, light: WATER_LIGHT }), { light: false, always: true });
    await ctx.yield();
    const snow = fx.makeParticles({ rng: rng.fork('snow'), preset: 'dust', count: Math.round(1500 * detail), box: [30, 20, 34], size: [0.035, 0.13], colors: ['#9fd8c4', '#cdeee2', '#6aa894'],
      intensity: 0.8, opacity: 0.8, additive: 0.5, velocity: [0.05, -0.2, 0.02], twinkle: 0.15, time });
    scene.add(snow.object);
    await ctx.yield();
    // the lower half of the underwater frames: the glow from above falls on things. A sardine ball turning in
    // the deep water right of the route, a river of mackerel streaming under the lens (pale backs catch the
    // light), and soft shafts hanging from the ceiling into the dark.
    const LIT_FISH = { top: '#b4ecd6', belly: '#14302a', fin: '#0e1a18', spec: 0.12, caustics: 0, light: { ...WATER_LIGHT, sunIntensity: 2.4, skyIntensity: 1.0 } };
    fauna.add(F.makeFishSchool({ rng: xr.fork('ball'), species: 'sardines', count: Math.max(600, Math.round(1600 * dens * detail)), size: 3.4, spread: [10.5, 7.5], center: [-27.7, -22, 75.7], spin: 1.1, ...LIT_FISH }), { light: false, always: true });
    await ctx.yield();
    fauna.add(F.makeFishSchool({ rng: xr.fork('river'), species: 'mackerel', count: Math.max(240, Math.round(640 * dens * detail)), size: 1.9, spread: [9, 3, 190], speed: 3.4,
      route: [[-72, -20, 120], [-46, -20, 84], [-30, -18.5, 58], [-15, -16, 34], [2, -15, 24], [12, -18, 46], [-6, -23, 76], [-34, -27, 112], [-60, -24, 130]], closed: true, ...LIT_FISH }), { light: false, always: true });
    await ctx.yield();
    for (const o of [{ position: [-48, -0.4, 88], radius: 62, count: 30, length: 36, width: [1.4, 5.5], intensity: 0.42 }, { position: [-30, -0.4, 64], radius: 150, count: 26, length: 64, width: [5, 16], intensity: 0.3 }]) {
      const rays = fx.makeGodRays({ rng: xr.fork('rays'), time, direction: [0.1, -1, -0.06], color: glowHex, falloff: 1.2, speed: 0.8, near: [0.8, 3.5], fogAmount: 0.7, ...o });
      rays.object.frustumCulled = false; scene.add(rays.object);
      await ctx.yield();
    }

    // ---- on the surface: sargassum, the longboat and her hawser, flying fish
    const BOAT = new THREE.Vector3(-17, 0, -92);
    const rafts = [{ x: -26.5, z: 46.5, r: 3.4 }, { x: -46, z: 105, r: 6.5 }, { x: -49.7, z: 69, r: 5 }, { x: -33.5, z: 28, r: 4 }, { x: -12.5, z: 30, r: 3.2 }, { x: -26.5, z: 22, r: 5 }, { x: 19, z: -112, r: 6 }, { x: -34, z: -134, r: 5 }];
    const wr = rng.fork('weed'), wantRafts = Math.round(20 * dens);
    const RAFT_KEEP = [[-80, -290], [152, -402], [-168, 6], [176, 58]];       // (the places the seeded layout was drawn round: it stays as it was)
    for (let i = 0; i < 400 && rafts.length < wantRafts; i++) {
      const a = wr.range(0, 6.283), d = wr.range(40, 250), x = Math.cos(a) * d, z = Math.sin(a) * d, r = wr.range(3, 12) * (wr() < 0.6 ? 0.6 : 1);
      if (path.distanceTo(x, 0, z) < r + 9 || (Math.abs(x) < 14 + r && Math.abs(z + 8) < 48 + r)) continue;
      if (Math.abs(x - 2) < 48 + r && z < -28) continue;
      if (RAFT_KEEP.some((o) => Math.hypot(o[0] - x, o[1] - z) < 34 + r)) continue;
      if (Math.abs(x - BOAT.x) < 8 + r && z > BOAT.z - 10 && z < BOAT.z + 70) continue;
      if (rafts.some((o) => Math.hypot(o.x - x, o.z - z) < o.r + r + 6)) continue;
      rafts.push({ x, z, r });
    }
    // ... and any raft that would lie under one of the vessels is slid out to her side
    for (const o of rafts) for (const d of DHOWS) {
      const dx = o.x - d.x, dz = o.z - d.z, dd = Math.hypot(dx, dz), need = 26 * d.s + o.r;
      if (dd < need) { const k = need / Math.max(dd, 1); o.x = d.x + dx * k; o.z = d.z + dz * k; }
    }
    await ctx.yield();
    scene.add(makeWeed(SH, hero, wr, rafts, Math.round(26 * detail)));
    await ctx.yield();
    const boat = makeLongboat(SH, uStroke); boat.position.copy(BOAT); scene.add(boat);
    await ctx.yield();
    scene.add(makeHawser(SH, AN.hawse, new THREE.Vector3(BOAT.x, 0.5, BOAT.z + 4.05), uStroke, uRes));
    await ctx.yield();
    // LANTERN GLOWS: every dhow lamp and lit pane, and the longboat's bow lantern (the barque's own are in the hero).
    // update() moves them with each hull's roll and gives the sea the eight lamps whose light lies on the water
    // (seaU.uLamp: [0-3] the first four dhows' poop lanterns, [4] the barque's taffrail lantern, [5] the longboat's,
    // [6] the quarter dhow's, [7] the tender's)
    const glows = fx.makeGlows({ rng: xr.fork('glow'), time, positions: [...dhows.lamps.map((l) => l.p), new THREE.Vector3(BOAT.x, 1.8, BOAT.z - 3.9)], sizes: [...dhows.lamps.map((l) => l.size * DHOWS[l.d].s), 0.5],
      color: '#ffb056', size: 5.5, intensity: 2.6, flicker: 0.18, minAngle: 0.006, fogAmount: 0.5 });
    glows.object.frustumCulled = false; scene.add(glows.object);
    await ctx.yield();

    path.tangentAt(BREAK_U, tt); path.pointAt(BREAK_U, tp);
    const BURSTS = [{ u: BREAK_U - 0.008, origin: [tp.x, tp.z], forward: Math.atan2(tt.x, -tt.z) - 0.4, n: 120, fan: [0, 0.48], lat: [0, 7], ahead: [8, 18], spreadT: 1.0, both: false }];
    for (const uo of [0.80, 0.835, 0.862, 0.885, 0.905, 0.925, 0.945]) {
      const u = K(uo); path.pointAt(u, tp);
      const mid = uo > 0.82 && uo < 0.9;        // the three bursts of 41.5 to 44.5 s (abreast of the longboat and the bull) are bigger, nearer the lens and glide higher (the vertex shader lifts bursts 2-4)
      BURSTS.push({ u, origin: [0, tp.z], forward: 0, n: mid ? 40 : 26, fan: [0.5, 0.95], lat: mid ? [3, 9] : [4, 9], ahead: uo > 0.9 ? [10, 16] : mid ? [10, 24] : [13, 24], spreadT: 0.6, both: true });
    }
    const fish = makeFlyingFish(SH, hero, rng.fork('fish'), BURSTS); scene.add(fish.mesh);
    await ctx.yield();

    // ---- THE THREE HUMPBACKS of the swoop and the final run: their places and seconds (the animals are made further
    // down; the last flock is timed from the bull). The kit's own rise ties the moment a whale leaves the sea to the
    // top of its arc: on a route `span` long that dips `sag` under the sea at both ends, a whale
    // WSPEED m/s fast is h0 = span * sqrt(apex height / (4 sag)) from the top when its middle crosses the surface,
    // and 0.45 of its length earlier its snout does (`leave`); it has fallen back (`back`) when it is h0 - 0.2 length
    // past the top. A whale is typed either by the top of its arc (`u`: the cow) or by the moment its snout leaves
    // the sea (`leave`: the calf and the bull), and the script below works out the other from the rise.
    //   THE COW is the site's own line, and these are the site's words for her: the cow leaps off the starboard
    //   bow as the lens tips over the fore truck (in the air at u 0.70). The cow's route bows toward the lens and she
    //   banks hard through it (the kit rolls a swimmer into its turn), so she comes out rolled belly-up toward the
    //   swoop: pale pleated throat, one long pectoral fin lifted. (The top of her arc is at 26, 6.5, -54 at u 0.703;
    //   by the rise her snout leaves the sea at u 0.6633 and she has fallen back at u 0.7242. The site's gaze, kept
    //   as it is, looks out to her from u 0.63.)
    //   HER CALF leaps beyond the longboat by the dark lane. Her moment is the round's own: her snout leaves the sea
    //   one leap of her mother's (`wait`: the cow's time from snout out to fallen back, 3.05 s) after the lens tips
    //   abeam of the fore mast (U_FORE), at u 0.7580; her mother has fallen back 1.7 s before.
    //   THE BULL leaves the sea at the design's 42.3 s, as the swoop ends. His place is told from the dark lane and
    //   the route's levelling point (route point 0, 7.5, -91): the top of his arc is 22 m to starboard of the lane's
    //   middle line and 34 m ahead of that point, and he heads ACROSS THE BOW, 30 degrees toward the lens, so the
    //   whole arc, from the sea to the fall, lies on the starboard bow of the final run, to the right of the ring,
    //   and he falls back 7 m off the lane's middle line, 28 m short of the ring's plane. His route bows toward the
    //   lens too: he rolls his pale belly and long flipper to it.
    const WSPEED = 13, LEVEL = path.points[20];
    const WHALES = [{ u: 0.703, apex: [26, 6.5, -54], dir: [-0.92, 0, 0.38], len: 18.5, span: 80, sag: 34, size: [1.9, 2.5], bow: -8, bank: 100 },
      { leave: U_FORE, wait: 0, apex: [-37, 3.6, -120], dir: [-1, 0, -0.12], len: 13, span: 66, sag: 29, size: [1.45, 1.9], bow: 0, bank: 18 },
      { leave: T_LEVEL / DUR, apex: [LEVEL.x + 22, 7.2, LEVEL.z - 34], dir: [-Math.cos(30 * DEG), 0, Math.sin(30 * DEG)], len: 15.5, span: 68, sag: 31, size: [1.25, 1.3], bow: -6, bank: 80 }];
    for (const w of WHALES) {
      w.h0 = Math.sqrt(w.apex[1] / (4 * w.sag)) * w.span;
      w.up = (w.h0 + 0.45 * w.len) / (WSPEED * DUR); w.down = (w.h0 - 0.2 * w.len) / (WSPEED * DUR);      // in u: from the snout leaving the sea to the top of the arc, and from the top to fallen back
      if (w.wait !== undefined) w.leave = w.leave + WHALES[w.wait].up + WHALES[w.wait].down;
      if (w.u === undefined) w.u = w.leave + w.up; else w.leave = w.u - w.up;
      w.back = w.u + w.down;
    }

    // ---- in the air: seabirds wheeling round the mastheads, and the birds that cross the flight (below)
    const B ={ booby: { size: 1.3, n: 10, n2: 4, s2: 0.9 }, tern: { size: 0.85, n: 16, n2: 0, s2: 0.8 }, tropic: { size: 1.0, n: 8, n2: 6, s2: 1.25 } }[mood.birds];
    const plum = { body: '#f4f4ee', belly: '#ffffff', wingC: '#ecece6', trail: '#17171b', tip: '#0e0e12', head: '#f4f4ee', beak: '#d8c860', tailC: '#141418' };
    const flock = (o) => fauna.add(F.makeFlock({ species: 'gulls', light: UNDER_LIGHT, ...plum, ...o }), { light: false, always: true });
    // THE WHEELS' STAND-OFF FROM THE FLOWN LINE (the flock cure of 10 Oct). A soaring bird is counted by its whole ring: every
    // circle the kit can draw about its dealt place (WIDE times soarRadius at the widest), its rise and fall (soarLift), its
    // wander up and down, and half its span. FLOWN is the flown line's places every quarter metre of the route. AIR is the
    // clear air a body keeps from them: 2.3 m, and half a step for what lies between two places. HALF is half the span of
    // a kit gull of size 1 at the largest the kit deals it (1.12 of the size handed).
    //   room(cx, cz, y0, y1, ball): the radius of the widest level wheel about the upright through (cx, cz) whose birds, of
    //   half span `ball`, fly between the heights y0 and y1 and keep AIR from every place of the line.
    //   roof(cx, cz, R, ball): the greatest height at which the birds of a level wheel of radius R about that upright keep
    //   AIR under every place of the line that passes over the wheel or within AIR and `ball` of its rim.
    //   wheel(R, layer): what the kit is handed for a wheel of radius R, as the wheel b6 below is laid: the loop its middle
    //   drifts round is level and reaches a tenth of R; every bird circles that middle (no scatter on the level), the
    //   widest circle ending at R; the birds fly in layers within `layer` of the middle's height, rise and sink by as
    //   much and wander up and down by WANDER (a soar flies only that figure of its wander; the rate is the species' own).
    //   tall(layer): how far above and below its middle's height such a wheel's birds can be.
    const FLOWN = [], STEP = 0.25; for (let d = 0; d < path.length; d += STEP) FLOWN.push(path.posAtDist(d, new THREE.Vector3())); FLOWN.push(path.posAtDist(path.length, new THREE.Vector3()));
    const GULL = F.BIRD_PRESETS.gulls, AIR = 2.3 + STEP / 2, HALF = (0.5 * GULL.girth + GULL.span) * 1.12, WIDE = 1.45 * 1.25, WANDER = 0.4;
    const room = (cx, cz, y0, y1, ball) => { let r = Infinity; const a = AIR + ball; for (const q of FLOWN) { const dy = Math.max(0, y0 - q.y, q.y - y1); if (dy < a) r = Math.min(r, Math.hypot(q.x - cx, q.z - cz) - Math.sqrt(a * a - dy * dy)); } return r; };
    const roof = (cx, cz, R, ball) => { let y = Infinity; const a = AIR + ball; for (const q of FLOWN) { const ex = Math.max(0, Math.hypot(q.x - cx, q.z - cz) - R); if (ex < a) y = Math.min(y, q.y - Math.sqrt(a * a - ex * ex)); } return y; };
    const wheel = (R, layer) => ({ radius: R / 10, wobble: 0, height: 0, spread: [0, layer, 0], soarRadius: 0.9 * R / WIDE, soarLift: layer, wander: [0.6, WANDER, 0.6, GULL.wander[3]] });
    const tall = (layer) => 2 * layer + WANDER;
    // b1 and b2 wheel round the barque's mastheads, their middles where they were: b1's at 40 m between the fore and the
    // main mast, b2's at 45 m between the main and the mizzen. The lens flies the top run at 50 to 52 m, 10 to 16 m to
    // starboard of the trucks, so b1 flies in layers of 1.5 m (36.6 to 43.4 m) and b2
    // in layers of 1 m (42.6 to 47.4 m), and each wheel is as wide as the flown line leaves room for at those heights.
    flock({ rng: rng.fork('b1'), form: 'soar', count: Math.max(5, Math.round(B.n * dens)), size: B.size, center: [-3, 40, -4], ...wheel(room(-3, -4, 40 - tall(1.5), 40 + tall(1.5), B.size * HALF), 1.5) });
    await ctx.yield();
    if (B.n2) flock({ rng: rng.fork('b2'), form: 'soar', count: B.n2, size: B.s2, center: [4, 45, 10], ...wheel(room(4, 10, 45 - tall(1), 45 + tall(1), B.s2 * HALF), 1), trail: '#d8d8d2', tip: '#2a2a30' });
    await ctx.yield();
    const rB4 = rng.fork('b4');        // the stream of the first bird of the 30 s pair (the pair is made below, with the other crossings)
    flock({ rng: xr.fork('b5'), count: 5, size: B.size * 1.15, form: 'loose', spread: [5, 1.6, 7], maxSigma: 3, wander: [0.7, 0.4, 0.7, 0.3], cross: { path, u: 0.243, lead: 15, angle: 62, side: -1, height: 5.5, span: 150, duration: DUR } });
    await ctx.yield();
    if (mood.cast === 'dolphin') fauna.add(F.makeDolphins({ rng: rng.fork('dol'), count: 6, center: [-50, -0.6, -52], radius: 17, height: 0, level: 0, top: '#06090a', belly: '#121a1c', fin: '#06090a', light: UNDER_LIGHT }), { light: false, always: true });
    await ctx.yield();
    // THE BIRDS THAT CROSS THE FLIGHT. Every crossing is laid from places of the world (a vessel, a mast, the ring)
    // or from a place of the route (a route point, or so many metres on along the route from where the
    // lens is at a second of the design); none from a gaze or a camera. fakePath gives the kit's `cross` a fixed
    // place and heading.
    const fakePath = (P, T) => ({ length: path.length, posAtDist: (d, out) => out.copy(P), tangentAtDist: (d, out) => out.copy(T) });
    // three birds wheel over the water between the barque and the near dhow, as the flocks b1 and b2 wheel over the
    // barque's trucks: a soar flock on the world's clock (the kit draws each bird's circle and its place on it from
    // the flock's own stream). The wheel is told from the two rigs: its middle is half way along the line from the
    // barque's starboard main yardarm to the near dhow's masthead, and its radius is a quarter of that line's length,
    // so a quarter of the line is clear water at either rig; it flies at the masthead's height, or as high as its top
    // birds can fly under the flown line, which climbs over the wheel (roof(), above: the lower of the two). The kit takes two radii
    // for a wheel: the loop its middle drifts round (it cannot be a point: a tenth of the wheel's radius is left for
    // it) and soarRadius, each bird's own circle, which the kit draws bird by bird from 0.55 to 1.45 of that figure
    // and lets breathe by a quarter more; soarRadius is the figure that ends the widest circle the kit can draw on
    // the wheel's radius. The three fly in layers within 1.5 m of the middle's height, rise and sink by as much on
    // the wheel and wander by 0.4 m
    {
      const arm = new THREE.Vector3(12, 15, MAST_Z[1]);            // the hero's rig plan: her main yard crosses 15 m up and reaches 12 m to a side (the seed braces it a degree or two, so the arm is within a metre or so of this)
      const N = DHOWS[3], head = new THREE.Vector3(N.x - N.s * Math.sin(N.h) * 5.6, N.s * 21.5, N.z - N.s * Math.cos(N.h) * 5.6);      // the near dhow's main masthead (makeDhows: 21.5 up, 5.6 forward of her middle, in her own metres)
      const R = head.distanceTo(arm) / 4, LOOP = R / 10, WIDEST = 1.45 * 1.25, layer = 1.5;
      const mx = (arm.x + head.x) / 2, mz = (arm.z + head.z) / 2, my = Math.min(head.y, roof(mx, mz, R, B.size * 1.2 * HALF) - tall(layer));
      flock({ rng: xr.fork('b6'), form: 'soar', count: 3, size: B.size * 1.2, center: [mx, my, mz],
        radius: LOOP, wobble: 0, height: 0, spread: [0, layer, 0], wander: [0.6, 0.4, 0.6, 0.3], soarRadius: (R - LOOP) / WIDEST, soarLift: layer });
    }
    await ctx.yield();
    // ... three more are birds of THE QUARTER DHOW: they wheel over her own masthead and poop lantern, as the flocks b1
    // and b2 wheel over the barque's trucks. All of it from her rig: the middle of their wheel is half way between
    // her masthead and her lantern, and the kit is given half the distance between the two as the radius of the loop
    // that middle drifts round and half the run of her yard as soarRadius (the radius the kit takes for each bird's
    // own circle: it draws the circle bird by bird from 0.55 to 1.45 of it); the wheel's height is the peak of her
    // yard plus the wheel's rise and fall, the birds' layer, the loop's bob and a metre (the kit's own wander for
    // the species, 2.5 m up and down, is not in that sum)
    {
      const A = DHOWS[4], MAST = -5.6, LAMP = DHOW_LAMPS[0][2], PEAK = 31.5, YARD = 21;      // her own metres (makeDhows): masthead and poop lantern from her middle (minus is forward), the peak of her lateen yard, the yard's run along her
      const mid = A.s * (MAST + LAMP) / 2, lift = 3, bob = 1, layer = 1.5;
      flock({ rng: own('b7'), form: 'soar', count: 3, size: B.size * 1.3, center: [A.x + Math.sin(A.h) * mid, A.s * PEAK + lift + layer + 1.2 * bob + 1, A.z + Math.cos(A.h) * mid],
        radius: A.s * (LAMP - MAST) / 2, height: bob, spread: [A.s * 3.5, layer, A.s * 3.5], soarRadius: A.s * YARD / 2, soarLift: lift });
    }
    await ctx.yield();
    // ... and five fly up the barque's starboard side from astern, heading as she heads: 18 m outboard of her middle
    // line and 38 m up, on a straight run of 170 m whose middle is abreast of her mizzen; they are at that middle as
    // the lens passes the quarter (U_QTR)
    flock({ rng: own('b8'), count: 5, size: B.size * 1.5, form: 'loose', spread: [4, 1.4, 7], wander: [0.6, 0.4, 0.6, 0.3],
      cross: { path: fakePath(new THREE.Vector3(18, 38, MAST_Z[2]), new THREE.Vector3(0, 0, -1)), u: U_QTR, lead: 0, angle: 0, side: 1, height: 0, span: 170, bow: 0, duration: DUR } });
    await ctx.yield();
    // THE CROSSINGS OF THE LAST THIRD: three, each on a beat of the flight, each bird a flock of one in its SEAT
    // (metres ahead, up, to the right of its flock's point). routeCross(u, lead, up, port): the point `lead` metres
    // on along the route from where the lens is at u, `up` above the route there, and a heading `port` degrees to
    // port of the route's own direction. A crossing's route is an arc (BOW: negative bulges it back toward the side
    // the birds come from) and the kit banks a bird into its turn, so a bird on an arc that bulges toward the lens
    // is rolled with its BELLY toward the lens.
    //   THE 30 s PAIR (the design: "two cross 7 m ahead of the lens at 30 s"): ONE pair, the point of its crossing
    //   7 m on along the route from the lens's place at 30 s, 0.3 m under the route's height there (the route is
    //   still climbing, so that is above the lens), the two wing to wing, 0.3 m apart in height: against the stars.
    //   They cross from starboard to port on a heading 50 degrees off the route's, a little faster than the lens:
    //   they come in broadside on the starboard bow and the lens closes on them slowly, so they stay within 6 to
    //   10 m through the whole crossing; they climb as the lens does over the second in which it passes them, so
    //   they hold their height against the stars. A booby's own size (1.65 m across the wings); rolled belly to
    //   the lens, wings spread, under-lit; dark heads, bills, wing tips and trailing edges.
    //   THREE STOOP WITH THE LENS down the line of the jibs: 10 m on along the route as the lens passes over the
    //   jib-boom end (U_JIB), half a metre over the route, on the route's own slope, heading 18 degrees to starboard
    //   of it at about the lens's speed: black crosses on the bright sea that drift from port to starboard under
    //   the line of sight.
    //   THREE CROSS THE DARK LANE as the bull tops his arc: from starboard to port, at the height of the ring's
    //   crown, two ring diameters on the near side of the ring (so over its top from the final run, never in front
    //   of it), broadside to the lane.
    {
      const SPAN = 150, SEATS = [[1.3, 0.4, 0], [-1.3, -0.35, 0.9], [-3.6, 0.25, -1.1]], vL = new THREE.Vector3();
      const routeCross = (u, lead, up, port) => {
        const P = path.posAtDist(u * path.length + lead, new THREE.Vector3()), T = path.tangentAtDist(u * path.length + lead, new THREE.Vector3()); T.y = 0; T.normalize();
        const a = port * DEG, d = new THREE.Vector3(T.x * Math.cos(a) + T.z * Math.sin(a), 0, T.z * Math.cos(a) - T.x * Math.sin(a));
        P.y += up; return { u, P, d, bx: new THREE.Vector3(-d.z, 0, d.x) };
      };
      const bird = (c, j, BOW, o, cr, stack = 1) => flock({ count: 1, form: 'loose', spread: [0, 0, 0], wander: [0.25, 0.15, 0.25, 0.3], ...o,           // stack: how much of the seats' difference in height is kept
        cross: { path: fakePath(c.P.clone().addScaledVector(c.d, SEATS[j][0]).addScaledVector(c.bx, SEATS[j][2] - BOW).setY(c.P.y + SEATS[j][1] * stack), c.d), u: c.u, lead: 0, angle: 0, side: 1, height: 0, span: SPAN, bow: BOW, duration: DUR, ...cr } });
      // the pair
      const PAIR_V = 10.5, pair = routeCross(30 / DUR, 7, -0.3, 50), PAIR = { size: 1.15, speed: PAIR_V, bank: 17, head: '#24242b', beak: '#f2c64a', trail: '#0c0c10', tip: '#060608' };
      const climb = (path.pointAt(31 / DUR, vL).y - path.pointAt(30 / DUR, tp).y) * SPAN / PAIR_V;      // the lens's climb from 30 to 31 s, kept up over their span
      bird(pair, 0, -12, { rng: rB4, ...PAIR }, { rise: climb }, 0.4);
      await ctx.yield();
      bird(pair, 1, -12, { rng: own('b4b'), ...PAIR }, { rise: climb }, 0.4);
      await ctx.yield();
      // the three that stoop with the lens
      const stoop = routeCross(U_JIB, 10, 0.5, -18);
      path.tangentAt(U_JIB, vL);
      const dive = vL.y / Math.hypot(vL.x, vL.z) * SPAN;                     // the route's own slope, over their span
      for (let j = 0; j < 3; j++) {
        bird(stoop, j, -10, { rng: own('fl1' + j), size: B.size * 1.3, speed: 10, bank: 12 }, { rise: dive });
        await ctx.yield();
      }
      // the three over the lane
      const ring = AN.portalSeat, lane = { u: WHALES[2].u, P: new THREE.Vector3(ring.position.x, ring.position.y + ring.radius, ring.position.z + 4 * ring.radius), d: new THREE.Vector3(-1, 0, 0), bx: new THREE.Vector3(0, 0, -1) };
      for (let j = 0; j < 3; j++) {
        bird(lane, j, -12, { rng: own('fl2' + j), size: 1.45 + 0.3 * B.size, speed: 11, bank: 17 }, {});
        await ctx.yield();
      }
    }
    // THE HUMPBACKS (WHALES, above): kit whales on steep arcs keyed to u; where each leaves the sea and where it falls
    // back the water is thrown up blue-white (makeSpray) and rings of blue light run out (seaU.uSpl).
    const SPL_U = [], uSplV = { value: [] };
    for (let i = 0; i < WHALES.length; i++) {
      const w = WHALES[i], T = new THREE.Vector3(...w.dir).normalize(), BX = new THREE.Vector3(-T.z, 0, T.x), h0 = w.h0;
      const P = new THREE.Vector3(...w.apex).addScaledVector(BX, -w.bow);                      // the route's mid point, so that the top of the arc is at `apex`
      const S0 = new THREE.Vector3(...w.apex).addScaledVector(BX, -4 * w.bow * (h0 / w.span) ** 2);    // on the bowed route abreast of where she leaves / re-enters
      // (the cow and her calf are the site's two whales and keep their forks of xr; the bull, added since, has a stream of his own)
      const wh = F.makeWhale({ rng: i < 2 ? xr.fork('whale' + i) : own('whale' + i), length: w.len, speed: WSPEED, bank: w.bank, top: '#1d3436', belly: '#c4e4d8', glow: '#8cc8ff', glowIntensity: 0.9, caustics: 0, light: UNDER_LIGHT,
        cross: { path: fakePath(P, T), u: w.u, lead: 0, angle: 0, side: 1, height: 0, span: w.span, sag: -w.sag, bow: w.bow, duration: DUR } });
      // kit workaround: the kit shades each whale 0.9..1.08, and above 1 its fin glow (uGlowF*(1 - shade)*3) goes
      // below zero (a few negative pixels on the flipper): keep the shade at 1 or under
      { const a = wh.geometry.getAttribute('iTint'); for (let j = 0; j < a.array.length; j++) a.array[j] = Math.min(a.array[j], 1); }
      fauna.add(wh, { light: false, always: true });
      SPL_U.push(w.leave, w.back);
      seaU.uSpl.value[i * 2].set(S0.x - T.x * h0, S0.z - T.z * h0, -1, w.size[0]); seaU.uSpl.value[i * 2 + 1].set(S0.x + T.x * h0, S0.z + T.z * h0, -1, w.size[1]);
      uSplV.value.push(new THREE.Vector4(T.x, T.z, 8.5, 0), new THREE.Vector4(T.x, T.z, 6.5, 0));      // the water she lifts follows her out; the fall throws it on ahead
      await ctx.yield();
    }
    scene.add(makeSpray(SH, xr.fork('spray'), seaU.uSpl, uSplV, Math.round(440 * (0.6 + 0.4 * detail))));
    await ctx.yield();
    const sheet = makeLensSheet(SH, uRes, bright, pal[1].clone().lerp(pal[2], 0.5).multiplyScalar(0.8)); scene.add(sheet.mesh);
    await ctx.yield();

    // ---- POIS: where the gaze goes
    // The engine blends pois one after another, and a poi of weight 1 that comes last decides the SWEEPING gaze alone;
    // the STEADY camera takes 35 % of each. So from the surface break on, the gaze is two scripts, written as
    // bearings (degrees from +x toward +z: -90 is dead ahead, 0 the starboard beam, 90 astern) and pitches, and
    // every turn is a turn of the bearing at a chosen rate, never a cross-fade between two far-apart targets (which
    // swings the gaze through whatever lies between at any speed: the whip this world used to have at u 0.385):
    //   gazeA  the sweeping camera's whole gaze from u 0.215. In flight order: a forward look from the port side
    //          (the ring under the sail stacks); from u 0.245 it turns slowly out to starboard and comes to rest on
    //          the NEAR DHOW as the lens clears the canvas (u 0.30-0.365); one even pan clockwise (u 0.367-0.432:
    //          the dhow off the quarter crosses the frame) to the ship from astern; the whole ship (to u 0.545); 25
    //          degrees down the centreline on the top run; out to where the cow breaches (u 0.63-0.70); then the
    //          ring, where it stays (the bearing gets there first, the pitch follows: the calf leaps in frame).
    //   gazeB  three weight-1 pois just before gazeA: invisible to the sweeping camera, they steer the steady one
    //          (0.18 look-ahead + 0.47 B + 0.35 A). GZ is the solved table of B's bearing and pitch that makes the
    //          steady camera turn at one even 21.5 degrees a second from u 0.355 to 0.545: near dhow, the dhow off
    //          the quarter, open sea astern, the ship. (Solved off line against the engine's pose rules; if the
    //          route, NEAR / SHIP or gazeA change it must be solved again.)
    const KEEL_LOOK = new THREE.Vector3(-4, 5, -6), poiA = new THREE.Vector3(), D2R = Math.PI / 180;
    const NEAR = new THREE.Vector3(DHOWS[3].x, 13, DHOWS[3].z), SHIP = hero.center.clone().setY(22), WHV = new THREE.Vector3(WHALES[0].apex[0] - 8, 15, WHALES[0].apex[2] - 6);
    const RING0 = new THREE.Vector3(-3, 10, -146), RING1 = new THREE.Vector3(0, 7.2, -146);
    const gCam = new THREE.Vector3(), gTmp = new THREE.Vector3(), gA = new THREE.Vector3(), gB = new THREE.Vector3(), ang = [0, 0];
    const lin = (u, a, b) => clamp((u - a) / (b - a), 0, 1), ease = (x, k) => lerp(x, x * x * (3 - 2 * x), k);
    const bearing = (pt) => { gTmp.copy(pt).sub(gCam); ang[0] = Math.atan2(gTmp.z, gTmp.x); ang[1] = Math.atan2(gTmp.y, Math.hypot(gTmp.x, gTmp.z)); };
    const aim = (out, az, pt) => out.set(gCam.x + Math.cos(az) * Math.cos(pt) * 100, gCam.y + Math.sin(pt) * 100, gCam.z + Math.sin(az) * Math.cos(pt) * 100);
    const wrap = (d) => d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
    const gazeA = (t, u) => {
      path.pointAt(clamp(u, 0, 1), gCam);
      let az = -62 * D2R, pt = lerp(25, 14, lin(u, 0.215, 0.255)) * D2R;                    // forward from the port side
      bearing(NEAR); az += Math.pow(lin(u, 0.245, 0.365), 0.85) * wrap(ang[0] - az); pt = lerp(pt, ang[1], lin(u, 0.255, 0.365));      // out to the near dhow
      if (u > 0.367) {                                                                      // the pan, clockwise, to the ship
        bearing(SHIP); let d = ang[0] - az; while (d < 0) d += 2 * Math.PI;
        const s = ease(lin(u, 0.367, 0.432), 0.25); az += s * d; pt = lerp(pt, ang[1], s);
      }
      if (u > 0.545) {                                                                      // the top run: down the centreline
        gTmp.set(gCam.x * 0.3, gCam.y - 36, gCam.z - 78); bearing(gTmp);
        const s = ease(lin(u, 0.545, 0.60), 1); az += s * wrap(ang[0] - az); pt = lerp(pt, ang[1], s);
      }
      if (u > 0.63) { bearing(WHV); const s = lin(u, 0.63, 0.695); az += s * wrap(ang[0] - az); pt = lerp(pt, ang[1], s); }       // the cow
      if (u > 0.70) {                                                                       // the ring
        gTmp.copy(RING0).lerp(RING1, smoothstep(0.80, 0.90, u)); bearing(gTmp);
        const x = lin(u, 0.70, 0.84); az += (1 - Math.pow(1 - x, 2.5)) * wrap(ang[0] - az); pt = lerp(pt, ang[1], 1 - Math.pow(1 - x, 1.8));
      }
      return aim(gA, az, pt);
    };
    const GZ = [       // gazeB: bearing, pitch (degrees) every 0.005 of u from u = GZ_U0
      -21.3, 13.4, -3.2, 11.4, 3.1, 10.2, 7.7, 9, 12.2, 8, 16.4, 6.9, 20.3, 5.8, 24.1, 4.7, 27.8, 3.7, 30.5, 2.8, 33.2, 1.9, 35.9, 1.1, 38.7, 0.2, 41.5, -0.6,
      44.4, -1.4, 47.3, -2.2, 50.2, -2.8, 53.1, -3.4, 55.8, -3.8, 58.5, -4.2, 65.7, -2.4, 72.7, -0.6, 78.2, 0.4, 80.5, 1.2, 82, 1.9, 82.8, 2.4, 83, 2.9, 82.6, 3.2,
      82, 3.5, 81.3, 3.6, 80.8, 3.7, 80.8, 3.7, 81.5, 3.6, 83.2, 3.4, 85.8, 3.1, 90.5, 2.6, 95.7, 1.9, 100.6, 1.2, 105.1, 0.4, 109.1, -0.3, 113.1, -0.8, 117.3, -1.2,
      122.1, -1.3, 127.8, -1.2, 134.6, -0.9, 142.2, -0.7, 150.4, -0.5, 158.9, -0.3, 167.5, -0.2, 176.2, -0.7, 185, -1.2, 193.6, -1.6, 202.4, -2, 211.2, -2.3, 220.1, -2.6, 229.2, -2.8,
      238.5, -2.9, 248, -2.8, 248.8, -2.7, 249.9, -2.4, 251.2, -2.2, 252.6, -2.2, 253.8, -2.3, 255, -2.8, 256.3, -3.4, 257.6, -4.2, 259, -5.1, 260.6, -6, 262.5, -6.7, 262.4, -7.5,
      262.4, -8.2, 262.4, -9, 262.5, -9.8, 262.7, -10.6, 263, -11.4, 263.3, -12.1, 263.5, -12.8, 263.7, -13.5, 263.7, -14.2, 263.7, -14.9, 263.6, -15.5, 263.4, -16.2, 263.3, -16.8, 263.1, -17.4,
      263, -17.9, 262.8, -18.4, 262.7, -18.8, 262.5, -19, 262.4, -19.1, 262.3, -19.1, 262.3, -18.9, 262.2, -18.6, 262.1, -18.2, 262.1, -17.6, 262.1, -17, 262.1, -16.4, 262.2, -15.7, 262.3, -15.1,
      262.5, -14.4, 262.7, -13.7, 263, -12.9, 263.3, -12.2, 263.6, -11.5, 263.9, -10.8, 264.2, -10.2, 264.5, -9.5, 264.9, -8.8, 265.2, -8.1, 265.5, -7.4, 265.8, -6.7, 266.1, -6, 266.4, -5.3,
      266.7, -4.7, 267, -4, 267.4, -3.4, 267.7, -2.8, 267.9, -2.3, 268.2, -1.8, 268.5, -1.4, 268.7, -1, 269, -0.7, 269.3, -0.5, 269.5, -0.4, 269.6, -0.3, 269.8, -0.2, 270, -0.1,
    ], GZ_U0 = 0.26, GZ_DU = 0.005;
    await ctx.yield();
    const gazeB = (t, u) => {
      path.pointAt(clamp(u, 0, 1), gCam);
      const f = clamp((u - GZ_U0) / GZ_DU, 0, GZ.length / 2 - 1.001), i = Math.floor(f), k = f - i;
      return aim(gB, lerp(GZ[i * 2], GZ[i * 2 + 2], k) * D2R, lerp(GZ[i * 2 + 1], GZ[i * 2 + 3], k) * D2R);
    };
    const steer = () => ({ at: gazeB, from: 0.262, to: 0.88, weight: 1, fade: 0.02 / 0.618 });
    const pois = [
      // under water the gaze rests just above the hull (the ceiling fills the upper two thirds, the lit deep
      // water the rest); as the lens nears the surface it sweeps up to the main top, so the break shows
      // three sail stacks from below
      { at: (t, u) => poiA.copy(KEEL_LOOK).lerp(AN.mainTop, smoothstep(0.150, K(0.218), u)), from: 0.02, to: K(0.32), weight: 0.6, fade: 0.167 },
      // the close pass: the gaze turns to the big swimmer as the lens slides along its flank, and eases back
      // toward the hull as it falls astern
      { at: (t, u) => swimAt(u * DUR, poiW).lerp(KEEL_LOOK, 0.5 * smoothstep(0.085, 0.125, u)), from: 0.03, to: 0.125, weight: 0.55, fade: 0.37 },
      steer(), steer(), steer(),
      { at: gazeA, from: 0.215, to: 1.2, weight: 1, fade: 0.035 / 0.985 },
    ];

    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();
    const camP = new THREE.Vector3(), lampV = new THREE.Vector3();
    const size = new THREE.Vector2(), wheelA = Math.atan2(260, -300), WHEEL_R = Math.hypot(300, 260);
    let sub = null;
    // ---------------------------------------------------------------- 6. update
    function update(dt, t, camera, u) {
      time.value = t;
      const te = u * DUR;
      hero.update(dt, t, camera);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); uRes.value.copy(size); }
      // FOG swap at the surface: dark air haze above, glowing water below
      const cp = camP.setFromMatrixPosition(camera.matrixWorld), under = cp.y < hero.swellHeight(cp.x, cp.z, t);     // world position: the camera behind a portal has its matrix set directly
      seaU.uUnder.value = under ? 1 : 0; dhows.hide.value.z = under ? 1 : 0;
      if (under !== sub) {
        sub = under;
        scene.fog.color.copy(under ? WATER_FOG.color : AIR_FOG.color); scene.fog.density = under ? WATER_FOG.density : AIR_FOG.density;
        scene.background.copy(under ? WATER_BG : AIR_BG);
        sky.object.visible = !under; band.visible = !under; backdrop.visible = under; snow.setOpacity(under ? 0.85 : 0);
      }
      backdrop.position.copy(cp); band.position.copy(cp);
      sky.update(dt, t, camera);
      // the big swimmer: entry pass keyed to u, then its shadow off the starboard bow from 22 s
      band.userData.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(size.y, 1));      // the angle one pixel covers (the star layers fade by it)
      swimmer.visible = te < 7.8;
      swimAt(te, swA); swimAt(te + 0.25, swB);
      swimmer.position.set(swA.x, swA.y + 0.25 * Math.sin(t * 0.4), swA.z);
      swimmer.rotation.set(Math.atan2(swA.y - swB.y, Math.hypot(swB.x - swA.x, swB.z - swA.z)), Math.atan2(swB.x - swA.x, swB.z - swA.z), 0);
      const teo = u > 0 ? (u * path.length + CUT) / L_OLD * DUR : 0;              // seconds on the first, longer route (the shadow's script)
      seaU.uSwim.value.set(16.5 - 0.1 * (teo - 28), -46 - 0.4 * (teo - 28), 0.25 + 0.1 * Math.sin(t * 0.2), smoothstep(17, 23, teo));
      // flying-fish clocks
      const a = fish.uniforms.uBurstA.value, b = fish.uniforms.uBurstB.value;
      a.set((u - BURSTS[0].u) * DUR, (u - BURSTS[1].u) * DUR, (u - BURSTS[2].u) * DUR, (u - BURSTS[3].u) * DUR);
      b.set((u - BURSTS[4].u) * DUR, (u - BURSTS[5].u) * DUR, (u - BURSTS[6].u) * DUR, (u - BURSTS[7].u) * DUR);
      // longboat: 28 strokes a minute, surging and rocking on the swell
      uStroke.value = t * 28 / 60;
      const ph = uStroke.value * 6.2832;
      boat.position.set(BOAT.x, hero.swellHeight(BOAT.x, BOAT.z, t) + 0.03 * Math.sin(ph), BOAT.z - 0.22 * Math.sin(ph - 0.6));
      boat.rotation.set(0.03 * Math.sin(ph + 0.5), 0, 0.045 * Math.sin(t * 1.3));
      // rare: the phosphorescent wheel, a spoke under the ship every 8 s
      if (rare) {
        const wp = t * 6.2832 / 8; seaU.uWheel.value.w = wp;
        const c0 = (wp - 12 * wheelA - WHEEL_R / 220) / 6.2832 + 0.5, cyc = c0 - Math.floor(c0);       // 0.5 = a spoke under the ship
        hero.setGlowWave(0.45, -0.4 + 1.8 * cyc);
      }
      // the surface passing over the lens at the break, and the wet glass after it
      const tb = (u - BREAK_U) * DUR;                                  // eased: the sea closes over the lens in 0.06 s (opaque 0.07 s before the break), the waterline falls in 0.6 s
      const me = camera.matrixWorld.elements, fwy = clamp(-me[9] / Math.max(Math.hypot(me[8], me[9], me[10]), 1e-6), -0.95, 0.95);      // the gaze's climb: where the horizon stands on the screen
      sheet.mesh.visible = u > 0 && tb > -0.14 && tb < 0.72;
      sheet.uniforms.uSheet.value.set(tb, smoothstep(-0.13, -0.07, tb), 0.5 - 0.5 * (fwy / Math.sqrt(1 - fwy * fwy)) * camera.projectionMatrix.elements[5]);
      // lanterns ride their hulls; eight of them lay their light on the water
      const LP = seaU.uLamp.value;
      for (let i = 0; i < dhows.lamps.length; i++) {
        const L = dhows.lamps[i]; dhowPoint(L.p, DHOWS[L.d], t, hero, lampV);
        glows.setPosition(i, lampV.x, lampV.y, lampV.z);
        if (L.sea) LP[L.d < 4 ? L.d : L.d + 2].set(lampV.x, lampV.y, lampV.z, L.d === 5 ? 0.6 : 1.0);
      }
      hero.toWorld(AN.lamps[0], lampV); LP[4].set(lampV.x, lampV.y, lampV.z, 0.9);
      boat.updateMatrixWorld(); lampV.set(0, 1.76, -3.9).applyMatrix4(boat.matrixWorld);
      glows.setPosition(dhows.lamps.length, lampV.x, lampV.y, lampV.z); LP[5].set(lampV.x, lampV.y, lampV.z, 0.55);
      glows.update(dt, t);
      // the whales' splash clocks (seconds since each left the sea / fell back; negative = not yet)
      for (let i = 0; i < SPL_U.length; i++) seaU.uSpl.value[i].z = u > 0 ? (u - SPL_U[i]) * DUR : -1;
      fauna.update(dt, t, camera, u);
      snow.update(dt, t, camera);
    }

    return {
      scene, path, duration: DUR, title: mood.title,
      camera: { fov: 62, near: 0.3, far: 26000, lookAhead: 20, sway: 0.5, bank: 0.07 },      // (almost no bank: the horizon is this world's ruler)
      pois,
      portal: { shape: 'circle', radius: 7, color: mood.portal, glow: 0.55, revealDistance: 260 },
      // EXPOSURE, BLOOM, GRADE: jade over violet-black; only the sidelights and the portal rim bloom
      post: { exposure: 1.15, bloom: { strength: 0.25, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.04, tint: '#f1fff8', shadowTint: '#0b0915', vignette: 0.4, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { sky.dispose(); },
    };
  },
};
