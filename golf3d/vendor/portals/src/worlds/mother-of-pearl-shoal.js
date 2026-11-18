// THE MOTHER-OF-PEARL SHOAL: a sea of black lacquer under a silver-foil moon; dive after gannets to a bait ball of
// shell-inlay sardines that wheels green to violet, is slashed by raised-gold sailfish and taken in one lunge by a whale.
// Style: Japanese lacquer (maki-e gold, raden shell), built in 3D. No fog, no lights: every surface is a ShaderMaterial
// that ends in lqDepth (warm ghosting) from the hero's lacquerGLSL. The world returns style 'none'.
//
// MAP OF THIS FILE (in order)
//   1  CONSTANTS            DUR, AH (look-ahead), palette, the hero's seat H0 / C, ring seat RC / RN
//   2  buildRoute()         THE PATH: skim (level, 6 m over the swell), dive, level, 322 degree orbit (clip at 80
//                           degrees), level, pull-up, 60 m straight
//   3  WHALE_SEC, WHALE_KEYS, riverKnots(), GZ, makeChoreo()   the choreography, pure functions of u: gazeAt (THE ONE
//                           POI, weight 1: shoal / stage / river / portal weights; its keys are GZ and GZ_RISE: the gaze
//                           holds the funnel whole while it draws up, sinks once to the stage by the funnel's foot as
//                           the whale passes and rests there, it never chases), the whale's ONE course (WHALE_KEYS:
//                           knots round the shoal's axis from the path's own place at the pass; whaleABC() is its body
//                           at a second, tail beating; whalePose() a point of it; whaleJaw / whaleGape / mouthH /
//                           release: the bite told by the whale's own course and its mouth's height in the funnel;
//                           whaleLit / whaleOn: its light by its own height), slash fish (SLASH), lens tunnel, plunge
//                           list (PLUNGES),
//                           riverKnots (THE RIVER: the survivors' course, a broad band RIVER_SIDE m right of the path
//                           from u 0.685 to 0.79, then on under the pull-up and up to the foot of the ring; four
//                           sailfish are survivors too and ride it on the survivors' own clock: RIDER_QUEUE, RIDER_SHOW)
//   4  RELIEF_FRAG, reliefMaterial()   maki-e gold / vermilion / silver / black / shell by vertex part (aSt), hairlines;
//                           uBelly paints the whale's roundness from its body uv (green-gold back, amber belly); the
//                           mouth (part 5) is dark amber all through: the floor a deep bowl (gold only on the lip's
//                           inner slope), a shadow web by the hinge, and the baleen a comb of gold teeth (cut out between)
//   5  geometry: loft(), whaleGeometry() (26 stations along the head, a lower jaw of 28 stations with a rolled lip, a bead
//                           of four stations a side, and a bowl for a floor that sinks with the pouch: a pouch whose keel
//                           does not swing at the hinge ring, so it runs on from the belly with no crease; engraved jaw
//                           line, ringed shell eye, diamond scales, pleats, a baleen comb hung to some 40% of the gape,
//                           a cheek web by the hinge only, broad rayed pectorals with an amber root),
//                           sailfishGeometry(), gannetGeometry()
//   6  ORN_GLSL, makeSurface()   the lacquer sea, one grid that follows the camera: from above gloss black, seigaiha scales,
//                           foil moon path, plunge rings, boil, rain. From below it is THE ROOF, and it is light, never
//                           ornament: Snell's window is a pool of cut leaf (cool silver slivers laid along the swell, one in four gold)
//                           round the moon's disc and, over the whole window, THE NET OF LIGHT (netM): the swell's
//                           caustic brushed in silver powder, wavy strokes that swell, thin and drift; no edge: it all
//                           thins away through a wide ragged margin (by the ray's own height over level, 4-18 degrees),
//                           and round the window's true rim runs the brief's silver hairline, 1.5 px, wobbling with the
//                           swell; the leaf runs on as a glitter path toward the moon's side, then dust, then dark. ON THE CLIMB
//                           (uClimb: u 0.72-0.8 on, and whenever the gaze swings steeply up) THE NET STAYS as fine lace on
//                           both sides (every seam a hairline 2-4 px, a sharp core and next to no halo): gold toward the disc, cool
//                           pearl-silver away from it (a third, finer mesh takes over where the roof is nearer than
//                           45 m), and BRUSH STROKES are laid among its cells: fine tapered slivers 1-2 px wide in two
//                           directions, each bent in long curves and swung into arcs round the disc's foot, their dashes
//                           of varied length; the cut leaf is turned every way; all of it pooled round the disc (which
//                           glows into it: a soft halo, a broken ring, pin-point dust; a crescent's halo hugs its lit leaf),
//                           hushed within a ring's width of the wreath. Calm round the portal. Above or below is a uniform
//                           (uAboveK, set once per frame in update), never a per-fragment test.
//                           From above: under the disc its light lies on the water as one soft warm pool; far off (beyond
//                           some 45 m) the scales give way to round dust and the moon's path to round flecks, both laid in
//                           the lens's own angles (never dashes); rings, the boil and square flakes go out before they
//                           would be dashes. The horizon itself is hard: black sky on black lacquer, no glow (the design).
//   6b makeDeep()           THE DEEP GROUND (under water only, DEEP_Y): a rosette of wave scales centred under the shoal's
//                           axis, wheeling slowly, in warm gold (as bright as the sea's own scales where the shafts
//                           land and under the moon's sheen), with dust drifts. Under the shoal it is a POOL of bare
//                           lacquer some 70 m across (finest dust only, crossed by three brush lines): a place on the
//                           ground, the same from every eye: calm fine dust within 25 m of the point under the shoal's
//                           axis, feathered to the full scales by 56 m, while the shoal stands over it (uPool).
//                           Roof and ground share no tone and no motif: cool leaf above, warm scales below.
//   6c makeFlecks()         shed scales: bursts of tumbling shell flecks keyed to u (the whale's swoop, its bite, each
//                           slash), each burst with its own fleck size: 2-5 cm for a slash beside the lens, hand-sized
//                           for the whale's; never over 14 px on screen, faded out within 2.5 m of the lens
//   6d SHAFTS, layShafts(), makeShafts()   THE FAN: twenty shafts of light fanned a few degrees about the moon's
//                           refracted light, from the surface to the ground: three by the shoal and seventeen standing all
//                           round it outside the orbit, at every bearing (unevenly spaced, 2 to 10 m wide, each shifted a
//                           few seeded metres), so some shaft with its drifting dust stands in the open side of the
//                           picture wherever the lens is on the dive and the orbit; and three beside the last climb on the
//                           disc's side (one draw): soft veils of gold, feathered to nothing at the edge, widening toward
//                           the ground, thick and thin along their length, dying away with depth, with slow threads and
//                           fine sinking motes (seen along its own length, within 56 to 30 degrees of its axis, a shaft
//                           loses its motes and keeps a third of its veil at most: a loose sheaf of threads with no
//                           straight side); hushed to a fifth or less round
//                           the shoal itself, in the world (uKeep). WHERE A SHAFT MEETS THE GROUND makeDeep lays a
//                           soft pool of lit scales with dust in it: for every shaft, all along the flight
//   7  makeSky()            foil moon (or gold sun / crescent), the gold-dust Milky Way, or for the sun mood kasumi:
//                           level mist bands of sprinkled gold low over the sea. Lacquer black down to a hard horizon.
//   8  makeGannets()        instanced birds: wheel (time), plunges and escorts (u), three GREETERS that glide ahead of the
//                           lens at the arrival and then plunge (GREET; their seats are dealt from a stream of their own
//                           in a band of the world by the entry, GREET_BAND), mirrored doubles
//   9  makeRibbons()        brush lines: current ribbons (time), plunge threads and the rare mass plunge (u), lines under
//                           the orbit, five beside the last climb and three long strokes across the pool under the shoal
//   10 makeBursts(), makeBoil()        gold dust bursts at each entry; shell chips flicking at the surface
//   11 build(ctx)           SEEDED MOODS (hour, weather, cast; the shell kind has its own draw) -> hero placement -> FARS:
//                           four far shoals of AMBER SMOKE (chips only, nothing opaque: a see-through cloud of amber-gold
//                           flecks with a denser heart and a few bright sparks), placed by one rule: round the shoal's
//                           axis 60 degrees apart, alternately 230 and 150 m off, crowns 10 m under the roof -> sea, deep
//                           ground, shafts, sky -> cast (each seed gathers its circling sailfish on its own side) -> dust,
//                           shed scales, rain strokes -> post (EXPOSURE, BLOOM, GRADE are in the return statement) ->
//                           update() (all scripted uniforms)
//
// SCRIPTED MOMENTS (all from the u passed to update; ambient loops use time)
//   hero.setProgress(u)                 ball -> funnel -> bite -> river -> ring (keys in HERO_KEYS); hero.setSwell(): the
//                                       ball is drawn 14% larger while the lens dives to it and closes up by u 0.315;
//                                       while the whale's jaw is dropped hero.setEaten() follows its upper jaw's own
//                                       height in the funnel, so what stands below the snout has gone into it
//   hero.setKeepOut(0..2)               the three sailfish lanes (SLASH[k].u); hero.setKeepOut(3) the lens tunnel
//   hero.setMouth()                     the whale's mouth sphere; whale uniforms uA/uB/uC (body curve: held to a gentle
//                                       arc and to its full length in place(), so it never folds), uJaw, uPleat, uBig,
//                                       uDeep (it is lit by its own height: dark in the deep, it comes up out of the
//                                       lacquer head first), uYaw (its back rolled a little toward the lens round the
//                                       bite, which opens the bowl of the lower jaw to the lens; side-on again as it
//                                       rises), uFluke (the tail drawn turned part-way to the lens, and swung in
//                                       place(): the flukes are a broad shallow V seen three-quarter on, lifting and
//                                       dropping with the stroke; a little more for the bite), uFin (the pectorals hung
//                                       below the belly). Course: WHALE_KEYS, ONE course on the brief's beats (WHALE_SEC):
//                                       up out of the deep behind and below the lens, dark; its flank slides up past the
//                                       lens 6 m to the right at 22.5 s; it tips over toward the shoal, dives beside the
//                                       funnel's foot, pulls out under it and turns up into the throat, jaw dropped; its
//                                       mouth stands open in the throat at 24 s; it takes the lower half and goes up
//                                       through the funnel and out over the top by 25.5 s. Jaw, pleats, the bite's front,
//                                       its size and its release are told by its own course (choreo.whaleJaw, mouthH,
//                                       whaleBig). The sailfish keep out of its body in the world, by its own light
//                                       (update: a keep-out round its six body points; they are moved, never dimmed).
//   flecks.uniforms.uU                  shed-scale bursts: as the whale turns up under the throat, at the bite, at each slash
//   gannets.uniforms.uU, ribbons.uniforms.uU, bursts.uniforms.uU, surface.uniforms.uRing[]   plunges, threads, rings
//   surface.uniforms.uRoofK, uClimb     the net of light overhead is held at a third while the shoal and the whale have the
//                                       frame and comes up to full by u 0.74; uClimb recolours it gold and pearl for the
//                                       climb, draws it as fine lace and lays the brush strokes among its cells
//   shafts.uniforms.uGain, deep.uniforms.uShaft / uShaft2 / uPool / uGnd   the gold shafts and their pools on the ground:
//                                       on from the crossing, thinned by half while the whale is lit, gone by u 0.69
//                                       (before the portal is in the gaze); uKeep, uKeepK hush them round the shoal's
//                                       own centre in the world; uGain2 brings up the climb's three and their pools (u 0.74-0.82)
//   sailfish matrices                   3 slashers, the rest circle (drawn larger, sails up, while the lens dives to the ball);
//                                       four of the circlers are survivors: after the bite each leaves in its turn and
//                                       rides the river's course on the survivors' clock, going dark along the reach up
//                                       to the ring; the three slashers come up round the wreath and circle it, outside
//                                       the tube, for the climb (u 0.72 on)
// LICENCES AND AMENDMENTS TO THE BRIEF: the whale is life size at its pass and drawn up to 1.3 times life size for the
// bite, 1.05 as it leaves; twenty-three shafts of sprinkled gold dust with their pools on the ground stand under water
// (the brief has none: its "no god rays" is kept as no naturalistic ones); the sailfish are drawn up to 1.75 times larger
// while the lens dives to the ball, and 2.2 times round the wreath; the greeter gannets are 1.4 times the others; under
// water the disc is eased 24 degrees right of the moon's own azimuth during the pull-up (u 0.68-0.84), so it stands
// clear of the ring on the last climb; the moon stands almost dead ahead of the entry heading and low (so the previous
// portal frames it whole); inside Snell's window it is drawn whole at a lifted elevation; the sea closes (alpha 1) over
// the far portal seen from above; the brief's open ocean has a lacquer ground 78 m under the shoal (ornament, not a sea
// floor); the sea's underside mirrors nothing but the shoal, and outside the window it carries a net of light and cut
// leaf; four far shoals, not two, each broader than the ball (1.4 times at 150 m, 2.1 times at 230 m); the gaze is one
// scripted poi of weight 1, not the brief's two of 0.6; after its pass the whale tips over and dives beside the
// funnel's foot before it comes up under the throat (the brief has one unbroken climb: the lens passes above the
// throat's height, so a whale that slides up past it has to go down again to take the funnel from below).
// NO FLASHES anywhere; nothing changes colour on a timer, only by turning.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, lacquerGLSL } from '../parts/mother-of-pearl-shoal.js';

// ---------------------------------------------------------------- 1 constants
const DUR = 40, AH = 14, TAU = Math.PI * 2, RAD = Math.PI / 180;
const PAL = ['#050506', '#E2B13C', '#B8B85E', '#DCE0E3', '#3FD9A0', '#7B5CE0', '#D8442B'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const H0 = V3(23, -80, -151);                       // the hero object's origin (base of the ball = the funnel's throat)
const C = V3(23, -60, -151);                        // the shoal's centre
const RC = V3(-74, -16, -220);                      // the ring / portal
const RN = V3(-0.396, 0.766, -0.507).normalize();   // the last straight: 50 degrees up
const BOIL = V3(0, 0, -75);                         // where the chips boil at the surface and where we dive in
const bellW = (x, a, b, f) => smoothstep(a, a + f, x) * (1 - smoothstep(b - f, b, x));
// a point in the shoal's cylinder: ph degrees round the axis (0 = where the orbit starts), r from the axis, y from C
const orb = (ph, r, y, out = V3()) => out.set(C.x - r * Math.cos(ph * RAD), C.y + y, C.z - r * Math.sin(ph * RAD));

// ---------------------------------------------------------------- 2 the path
function buildRoute() {
  // the skim is level, 6 m above the swell (the brief), as far as z -53; the nose-over knot at z -66 lies on the parabola
  // that leaves the level there and meets the dive's first knot (0, -5, -76.5)
  const nose = 6 - 11 * Math.pow((66 - 53) / (76.5 - 53), 2);
  const pts = [[0, 6, 0], [0, 6, -20], [0, 6, -38], [0, 6, -53], [0, nose, -66], [0, -5, -76.5], [0, -22, -89], [0, -40, -101], [0, -52.5, -112],
    [0, -58.6, -123], [0, -60, -134], [0, -60, -143]].map((p) => V3(p[0], p[1], p[2]));
  const N = 17;
  for (let k = 0; k < N; k++) {                     // the orbit: 322 degrees clockwise, the shoal on the right
    const deg = k * 322 / (N - 1), s = clamp((deg - 90) / 232, 0, 1);
    const clip = Math.exp(-Math.pow((deg - 80) / 22, 2));         // the path clips the skin near 80 degrees
    pts.push(orb(deg, 23 + 11 * s - 2.0 * clip, -18 * s));
  }
  const h = V3(RN.x, 0, RN.z).normalize(), e0 = pts[pts.length - 1].clone(), R = 45;
  pts.push(e0.clone().addScaledVector(h, 20), e0.clone().addScaledVector(h, 41));
  for (const a of [12.5, 25, 37.5]) pts.push(e0.clone().addScaledVector(h, 41 + R * Math.sin(a * RAD)).setY(e0.y + R * (1 - Math.cos(a * RAD))));
  for (const d of [-60, -45, -30, -15, 0]) pts.push(RC.clone().addScaledVector(RN, d));   // 60 m straight up the ring's axis
  return pts;
}

// ---------------------------------------------------------------- 3 choreography (pure functions of u)
// THE WHALE. The brief's beats, in seconds of the flight: its flank passes the lens (pass), its mouth stands open in the
// throat (bite), it is gone over the top (gone). WHALE_SIDE: how far to the lens's right it passes (the brief: 6 m).
const WHALE_SEC = { pass: 22.5, bite: 24.0, gone: 25.5 }, WHALE_SIDE = 6;
// ONE COURSE, laid in the world round the shoal's axis (makeChoreo turns it into a curve): knots [seconds from the
// pass, bearing round the axis ahead of the lens's own bearing at the pass (degrees, the way the lens flies), metres
// from the axis, world height]. The pass knot (nulls) is the path's own place at the pass, WHALE_SIDE m toward the axis
// and WHALE_UNDER m below the lens. It comes up out of the deep behind and below the lens on a steep rising line (dark:
// WHALE_DEEP), slides up past the lens flank-on, tips over toward the shoal and dives beside the funnel's foot (nose
// down, square to the lens, which is level with it), pulls out under the foot heading for the axis (the lens looks down
// on its back), turns up into the throat with its jaw dropped, stands in it at the bite, and goes up through the
// funnel and out over the top. Never a hover, never the same reach twice. The body never folds: see place().
const WHALE_UNDER = 3.5;
const WHALE_KEYS = [[-1.5, -50, 27, -119], [-1.0, -33, 25.5, -104.5], [-0.5, -15, 23.6, -88], [-0.22, -6, 22.6, -78.5], [0, 0, null, null],
  [0.3, 12, 18.8, -69.4], [0.5, 27, 14.5, -70.2], [0.67, 43, 11.2, -74.2], [0.84, 55, 9.6, -80.4], [1.0, 62, 8.8, -85.6],
  [1.13, 70, 6.6, -88.4], [1.24, 82, 3.6, -88.2], [1.36, 100, 1.8, -85.2], [1.5, 110, 1.2, -80.8], [1.7, 115, 0.8, -77.2], [1.9, 118, 0.6, -72.8],
  [2.1, 120, 1, -67.8], [2.3, 122, 2, -62], [2.5, 124, 3.5, -55.2], [2.7, 126, 5.5, -47.4], [2.85, 128, 7.5, -40.6], [3.0, 130, 9.5, -33]];
const WHALE_YAW = -0.3;                                                 // its back rolled a little toward the lens for the bite
const WHALE_DEEP = [-106, -94];                                         // the whale's light by its own height (world y): black lacquer below, full gold above
const WHALE_BEAT = { flex: 1.3, k: 0.22, off: [WHALE_SEC.bite - 0.7, WHALE_SEC.bite - 0.1] };   // its tail beats as it swims (metres at the tail, radians per metre travelled), still for the bite
const FUN_H = 36;                                                       // the funnel's height above its throat (H0)
// a licence: life size at the pass (the brief's flank, longer than the frame), it is drawn up to 1.3 times life size
// for the bite, 25 m and more off (whaleGrow: what it has gained by a second, from the pass to the bite), and falls to
// 1.05 as its mouth climbs the funnel's upper half (whaleBig in makeChoreo: by the mouth's own height, not by the
// second), so it leaves as a whole animal
const whaleGrow = (sec) => 0.3 * smoothstep(WHALE_SEC.pass + 0.3, WHALE_SEC.bite - 0.4, sec);
const HERO_KEYS = { funnel: [0.475, 0.545], eat: [0.632, 0.636], river: [0.5925, 0.885], ring: [0.63, 0.755] };   // river: the first survivor leaves at 23.7 s and the last is in the ring by 35.4 s (the design: they wind in while the lens runs level and pulls up; nothing crosses on the last climb)
const SLASH = [{ u: 0.4, rise: 5.2 }, { u: 0.4265, rise: -5.6 }, { u: 0.4475, rise: 6.4 }];
// plunges: [seconds of entry, x, z, kind 1 plunger | 2 escort]; escorts fold beside the lens and dive with us
const PLUNGES = [[0.95, -8.5, -20, 1], [1.9, 9.5, -31.5, 1], [2.7, -11, -41, 1], [3.4, 8, -49, 1], [4.2, -9, -58.5, 1], [4.9, 9, -67, 1],
  [5.6, -12, -76, 1], [6.5, 10, -84, 1], [0.2, 4.5, -25, 1], [3.9, 5.5, -75, 1], [4.3, -4.5, -80, 1], [2.3, -3.5, -58, 1],
  [6.2, -5.2, -75, 2], [6.32, 5.4, -77, 2], [6.55, 1.5, -82.5, 2]];
// THE RIVER OF SURVIVORS: ten knots (world) of the course every survivor rides (hero.setRiverSpline). It pours from the
// funnel's upper half down to the path ahead of the lens, runs beside the path RIVER_SIDE m to the right from
// u 0.685 to 0.79 (the chips do some 20 m/s there, 8 m/s faster than the lens, so the band takes from u 0.67 to 0.82
// to pass), carries on level under the pull-up and climbs to the foot of the ring from underneath.
// RIDERS: four sailfish are survivors too. Each has a place in the queue (RIDER_QUEUE, RIDER_GAP: the hero's own measure,
// 0 the first to leave .. 1 the last; the four are spread over the whole queue, so they set out one after another all
// through the river's run) and rides the same course on the survivors' own clock (hero.riverRide), along the band's far
// side from the path and on the band's top (RIDER_LANE: metres from the path, level, of the first rider's lane
// and the step to each next one; the course lies RIVER_SIDE m from the path and the band reaches 2.8 m beyond it.
// RIDER_TOP: metres above the course: the band's top, 2.1 m, and over it the rider's own half depth and the reach of
// its bob, so its keel never sinks into the band); it shows from where the river has come down to the path and
// goes dark along the river's reach up to the ring (RIDER_SHOW: shares of the course), wherever the lens is.
const RIVER_SIDE = 5.4, RIVER_DROP = 1.0, RIVER_U = [0.685, 0.72, 0.755, 0.79];
const RIDER_QUEUE = 0.1, RIDER_GAP = 0.25, RIDER_SHOW = [0.1, 0.2, 0.68, 0.84], RIDER_LANE = [7.6, 0.4], RIDER_TOP = 2.8;
const RING_Y = V3(0.472, 0.643, 0.604).normalize();   // the ring's in-plane "up" (its foot is RC - RING_Y * 11.2)
const RING_X = V3().crossVectors(RING_Y, RN).normalize();
function riverKnots(path) {
  const p = V3(), t = V3();
  const beside = (u, ahead, drop) => { path.pointAt(u, p); path.tangentAt(u, t); t.y = 0; t.normalize();
    return V3(p.x + t.x * ahead - t.z * RIVER_SIDE, p.y - drop, p.z + t.z * ahead + t.x * RIVER_SIDE); };
  const K = [V3(C.x, C.y + 9, C.z), null];
  for (const u of RIVER_U) K.push(beside(u, 0, RIVER_DROP));
  K.push(beside(0.79, 19, RIVER_DROP + 1.2));
  const k8 = RC.clone().addScaledVector(RING_Y, -27).addScaledVector(RN, -24);
  K.push(K[6].clone().lerp(k8, 0.5).add(V3(0, -5, 0)), k8, RC.clone().addScaledVector(RING_Y, -11.2));
  K[1] = K[0].clone().lerp(K[2], 0.52).add(V3(0, 2.5, 0));
  return K;
}

// THE GAZE'S KEYS. The gaze has ONE weight toward the shoal (wS in gazeDir) and one target: the funnel's middle, so the
// funnel is seen entire while it draws up (the brief's 19-22.5 s), sinking to the STAGE as the whale passes: a fixed
// place by the funnel's foot, where the whale will stand at the bite (GZ.t0, t1: seconds before and after the whale's
// pass over which it sinks; the pass crosses the lower frame, between the lens and the foot, and the gaze goes down
// to the foot once, ahead of the whale's dive: never a chase). From the bite the stage rides up with the whale for
// GZ.hold seconds, then the whale leaves over the top. The river's and the portal's pulls begin when the bite lets go
// (makeChoreo: release, the second the whale's mouth has climbed the funnel's lower half). GZ_RISE is how the weight
// comes back after the close orbit: [u, share added], straight from knot to knot and then smoothed. (w2, w3: u.)
const GZ = { t0: 1.0, t1: 0.9, w2: 0.626, w3: 0.664, zw: 0.04, lift: 2.0, hold: 0.6, foot: 0.3 };
const GZ_RISE = [[0.428, 0], [0.452, 0.15], [0.475, 0.2], [0.55, 0.53], [0.585, 0.55]];
const knotLin = (K, u) => { if (u <= K[0][0]) return K[0][1]; for (let i = 0; i < K.length - 1; i++) if (u <= K[i + 1][0]) return lerp(K[i][1], K[i + 1][1], (u - K[i][0]) / (K[i + 1][0] - K[i][0])); return K[K.length - 1][1]; };
const knots = (K, u) => (knotLin(K, u - 0.014) + knotLin(K, u - 0.007) + knotLin(K, u) + knotLin(K, u + 0.007) + knotLin(K, u + 0.014)) / 5;   // corners rounded over 1.1 s
function makeChoreo(path) {
  const L = path.length, p0 = V3(), p1 = V3(), dir = V3(), tmp = V3(), wp = V3(), fo = V3(), wn = V3(), river = riverKnots(path);
  // the whale's course in the world: the pass knot from the path's own place at the pass, the others round the axis from its bearing
  const pp = path.pointAt(WHALE_SEC.pass / DUR), pt = path.tangentAt(WHALE_SEC.pass / DUR);
  const b0 = Math.atan2(pp.z - C.z, pp.x - C.x), rP = Math.hypot(pp.x - C.x, pp.z - C.z);
  const turn = Math.sign((pp.x - C.x) * pt.z - (pp.z - C.z) * pt.x) || 1;      // which way round the axis the lens flies
  const cyl = (deg, r, y) => V3(C.x + r * Math.cos(b0 + turn * deg * RAD), y, C.z + r * Math.sin(b0 + turn * deg * RAD));
  const KEYS = WHALE_KEYS.map((k) => [WHALE_SEC.pass + k[0], cyl(k[1], k[2] === null ? rP - WHALE_SIDE : k[2], k[3] === null ? pp.y - WHALE_UNDER : k[3])]);
  // a route: a curve through KEYS [seconds, place] and the clock that rides it (seconds -> metres along it, straight
  // from knot to knot, lightly smoothed); beyond its ends it runs on straight at v0 / v1 m/s. Nothing is allocated per frame.
  const makeRoute = (K, v0, v1) => {
    const curve = new THREE.CatmullRomCurve3(K.map((k) => k[1]), false, 'centripetal'); curve.arcLengthDivisions = 600;
    const n = K.length, knotLen = [0], sub = 40, a = V3(), b = V3(); let acc = 0;
    for (let i = 0; i < n - 1; i++) { curve.getPoint(i / (n - 1), a); for (let j = 1; j <= sub; j++) { curve.getPoint((i + j / sub) / (n - 1), b); acc += a.distanceTo(b); a.copy(b); } knotLen.push(acc); }
    const len = acc, e = [curve.getPointAt(0), curve.getTangentAt(0), curve.getPointAt(1), curve.getTangentAt(1)];
    const dist = (sec) => {
      if (sec <= K[0][0]) return (sec - K[0][0]) * v0;
      if (sec >= K[n - 1][0]) return len + (sec - K[n - 1][0]) * v1;
      let i = 0; while (i < n - 2 && sec > K[i + 1][0]) i++;
      return lerp(knotLen[i], knotLen[i + 1], (sec - K[i][0]) / (K[i + 1][0] - K[i][0]));
    };
    return { len, D: (sec) => (dist(sec - 0.12) + 2 * dist(sec) + dist(sec + 0.12)) / 4,
      at: (d, out) => (d <= 0 ? out.copy(e[0]).addScaledVector(e[1], d) : d >= len ? out.copy(e[2]).addScaledVector(e[3], d - len) : curve.getPointAt(d / len, out)) };
  };
  const route = makeRoute(KEYS, 30, 60);
  const whaleD = route.D, whaleAt = route.at, whaleLen = route.len;
  // THE WHALE'S BODY at a second: three points on its course (tail-ward A, middle B, head-ward C; place() in the whale's
  // shader draws the body through them). While it swims its tail beats: A swings across the course, in the upright plane
  // (WHALE_BEAT: by the metres it has travelled, so the beat is the swimming itself), and is still for the bite.
  const whaleABC = (sec, A, B, C, big = whaleBig(sec)) => {
    const d = route.D(sec); route.at(d - 7.5 * big, A); route.at(d, B); route.at(d + 7.5 * big, C);
    const k = WHALE_BEAT.flex * (1 - smoothstep(WHALE_BEAT.off[0], WHALE_BEAT.off[1], sec));
    if (k > 0.001) { wn.subVectors(C, A).normalize(); const ty = wn.y; wn.multiplyScalar(-ty); wn.y += 1; if (wn.lengthSq() < 1e-4) wn.set(1, 0, 0); A.addScaledVector(wn.normalize(), k * Math.sin(d * WHALE_BEAT.k + 0.6)); }
  };
  // a point of the whale's body as place() draws it: Q(z) = B + hf z + bend z z (z -1 tail .. 1 snout; the mouth is 0.773)
  const wA = V3(), wB = V3(), wC = V3(), wb = V3(), wm = V3(), wq = V3();
  const whalePose = (sec, z, out, big = whaleBig(sec)) => {
    whaleABC(sec, wA, wB, wC, big);
    out.subVectors(wC, wA).multiplyScalar(0.5); wb.addVectors(wA, wC).multiplyScalar(0.5).sub(wB);
    const hl = Math.max(out.length(), 1e-3); wb.multiplyScalar(Math.min(1, 0.3 * hl / Math.max(wb.length(), 1e-3)));
    return out.multiplyScalar(7.5 * big / hl * z).addScaledVector(wb, z * z).add(wB);
  };
  // THE WHALE'S SIZE at a second (the licence at whaleGrow): what it has gained from the pass to the bite it loses
  // again as its mouth climbs the funnel's upper half, by the mouth's own height above the throat (H0) over the
  // funnel's height (FUN_H): full size while the mouth is in the lower half it takes, 1.05 at the rim and beyond. The
  // mouth stands a little further up the larger the whale is drawn, so the size is settled in three rounds (each
  // round leaves under an eighth of the last one's error). The last second asked is kept, so a frame works it out once.
  let bigSec = NaN, bigVal = 1;
  const whaleBig = (sec) => {
    if (sec === bigSec) return bigVal;
    const g = whaleGrow(sec); let big = 1 + g;
    if (g > 0) for (let i = 0; i < 3; i++) big = 1 + g * (1 - 0.833 * smoothstep(0.5, 1, (whalePose(sec, 0.773, wq, big).y - H0.y) / FUN_H));
    bigSec = sec; bigVal = big; return big;
  };
  // THE BITE, told by the whale itself. mouthH: how high its mouth stands in the funnel (0 the throat's foot .. 1 the
  // flare's rim). The jaw drops over the last metres of its course to the throat (whaleJaw: by the metres still to
  // swim to its place at the bite) and closes as the mouth climbs past the funnel's middle: the lower half is inside.
  const mouthH = (sec) => (whalePose(sec, 0.773, wm).y - H0.y) / FUN_H;
  const dBite = route.D(WHALE_SEC.bite);
  const whaleGape = (sec) => smoothstep(dBite - 17, dBite - 3, route.D(sec));
  const whaleJaw = (sec) => whaleGape(sec) * (sec > WHALE_SEC.bite ? 1 - smoothstep(0.5, 0.82, mouthH(sec)) : 1);
  // release: the second its mouth has climbed the lower half (found once, by halving, between the bite and its leaving)
  let ra = WHALE_SEC.bite, rb = WHALE_SEC.gone; for (let i = 0; i < 30; i++) { const m = 0.5 * (ra + rb); if (mouthH(m) < 0.5) ra = m; else rb = m; }
  const release = 0.5 * (ra + rb), uRel = release / DUR;
  // its light at a second, as its head carries it (the same law as in its shader: WHALE_DEEP by height)
  const whaleLit = (sec) => smoothstep(WHALE_DEEP[0], WHALE_DEEP[1], whalePose(sec, 0.8, wm).y);
  // how much the whale is THERE at a second (0..1): its own light, until it has gone over the top
  const whaleOn = (sec) => whaleLit(sec) * (1 - smoothstep(WHALE_SEC.gone - 0.5, WHALE_SEC.gone, sec));
  const api = {
    whaleD, whaleAt, whaleLen, river, whalePose, whaleABC, whaleBig, whaleJaw, whaleGape, whaleLit, whaleOn, mouthH, release,
    // THE GAZE: where the camera looks at progress u (the world's single poi returns this point)
    gazeDir(u, out) {
      const d = u * L; path.posAtDist(d, p0); path.posAtDist(d + AH, p1);
      out.subVectors(p1, p0).normalize();
      // the shoal: strong in the dive, gentler on the close orbit (the chord already turns in), and back by GZ_RISE for
      // the funnel and the whale: by then its target has sunk to the stage by the funnel's foot, so the whale's pass,
      // its dive and the funnel's lower half stand in the frame through the bite, and the gaze rides up with the
      // whale as it leaves; then the river and the portal take it
      const wS = (0.72 * smoothstep(0.155, 0.225, u) - 0.3 * smoothstep(0.345, 0.385, u) + knots(GZ_RISE, u)) * (1 - smoothstep(GZ.w2, GZ.w3, u));
      api.focus(u, tmp).sub(p0).normalize();
      out.multiplyScalar(1 - wS).addScaledVector(tmp, wS).normalize();
      // the river of survivors pouring down to the path ahead (it holds the gaze level while the portal comes in above)
      const wR = 0.45 * bellW(u, uRel, 0.7, 0.03);
      if (wR > 0.001) { tmp.subVectors(river[2], p0).normalize(); out.multiplyScalar(1 - wR).addScaledVector(tmp, wR).normalize(); }
      // the portal: enters the upper frame after the bite and is centred by 33 s; until the pull-up the gaze stays low
      // enough to keep the band of survivors in the lower right
      const wP = 0.5 * smoothstep(uRel, 0.705, u) + 0.3 * smoothstep(0.78, 0.86, u);
      tmp.subVectors(RC, p0).normalize(); out.multiplyScalar(1 - wP).addScaledVector(tmp, wP).normalize();
      return out;
    },
    gazeAt(u, out) { api.gazeDir(u, dir); path.posAtDist(u * L, out); return out.addScaledVector(dir, 40); },
    // the stage: the whale's place at the bite (a point just behind its mouth), lifted a little and drawn part-way to
    // the funnel's foot; a fixed place until the bite, then it rides up with the whale for GZ.hold seconds
    stage(u, out) {
      const sec = u * DUR, t = clamp(sec, WHALE_SEC.bite, WHALE_SEC.bite + GZ.hold);
      whalePose(t, GZ.zw, out); out.y += GZ.lift;
      return out.lerp(fo.set(H0.x, H0.y + 4, H0.z), GZ.foot);
    },
    // how far the gaze has sunk from the funnel's middle to the stage (0..1): by the whale's own pass
    sink(u) { return smoothstep(WHALE_SEC.pass - GZ.t0, WHALE_SEC.pass + GZ.t1, u * DUR); },
    // what the gaze is about: the shoal's centre (the funnel's middle once it has drawn up), sinking to the stage
    focus(u, out) {
      const k = api.sink(u); out.set(C.x, C.y - 3 * smoothstep(0.47, 0.54, u), C.z);
      return k > 0.001 ? out.lerp(api.stage(u, wp), k) : out;
    },
  };
  // the slashes: each fish rides a great circle of the ball that crosses the gaze at SLASH[k].u, inside the skin
  api.slash = SLASH.map((s) => {
    const pc = path.pointAt(s.u), g = api.gazeDir(s.u, V3()), R = 19.0;
    const oc = pc.clone().sub(C), b = oc.dot(g), disc = b * b - (oc.lengthSq() - R * R);
    const t = disc > 0 ? -b - Math.sqrt(disc) : -b;
    const n0 = pc.clone().addScaledVector(g, t).sub(C).normalize(), tanF = path.tangentAt(s.u);
    for (let k = 0; k < 30 && pc.distanceTo(tmp.copy(n0).multiplyScalar(R).add(C)) < 5.7; k++) n0.addScaledVector(tanF, 0.02).normalize();   // never nearer than 5.7 m
    const tan = path.tangentAt(s.u); tan.addScaledVector(n0, -tan.dot(n0)).normalize();
    const mer = V3(0, 1, 0); mer.addScaledVector(n0, -mer.dot(n0)).normalize();
    const vel = tan.multiplyScalar(10.1).addScaledVector(mer, s.rise), speed = vel.length();
    return { u: s.u, n0, v: vel.normalize(), omega: speed / R, R };
  });
  // where a slash fish is, tau seconds from its crossing: radius dips into the skin for the slash
  api.slashPos = (k, tau, out) => {
    const s = api.slash[k], a = s.omega * tau, w = bellW(tau, -2.0, 2.0, 0.75);
    return out.copy(s.n0).multiplyScalar(Math.cos(a)).addScaledVector(s.v, Math.sin(a)).multiplyScalar(lerp(25.5, s.R, w)).add(C);
  };
  return api;
}

// ---------------------------------------------------------------- 4 maki-e relief (birds, sailfish, whale)
// aSt = (part, diamond hairlines, ray hairlines, silver share); parts: 0 metal, 1 vermilion sail, 3 black, 4 shell, 5 mouth
const RELIEF_FRAG = /* glsl */`
uniform vec3 uMoon, uFreq; uniform float uGain, uSwap, uBelly, uHairW, uHairK, uRim, uDepthK;
varying vec3 vNv, vPv, vOp, vNw, vPw; varying vec2 vUv; varying vec4 vSt; varying float vDim;
void main(){
  if (vDim < 0.004) discard;
  vec3 Nv = normalize(vNv); if (!gl_FrontFacing) Nv = -Nv;
  float dist = length(vPv); vec3 Vv = -vPv / max(dist, 1e-3);
  float px = length(fwidth(vOp)) * 0.7;
  float dia = max(lqHair((vUv.x + vUv.y) * uFreq.x, 1.1), lqHair((vUv.x - vUv.y) * uFreq.x, 1.1));
  float ray = lqHair(vUv.y * uFreq.y, uHairW), rayS = lqHair(vUv.x * uFreq.z, 1.3);
  float key = dot(Nv, normalize(vec3(-0.55, 0.65, 0.52))) * 0.5 + 0.5;
  float rim = smoothstep(0.55, 0.95, 1.0 - abs(dot(Nv, Vv)));
  vec3 gold = lqGold(Nv, Vv, vOp, px);
  // the whale is always drawn side-on (its section faces the lens), so its roundness is painted from the body uv
  // (uv.y: 0 the back .. 3 the belly's keel): green-gold along the back, full gold on the flank, amber shadow under the belly
  // (the back and the upper flank keep their gold; the amber comes in below the flank's mid-line and deepens to the
  // keel, so the belly third of the body lies in shadow and the body reads round)
  // (the belly's amber is a painted shadow: it takes little of the key, so it reads as shade whichever way the animal lies)
  float shade = uBelly * smoothstep(1.1, 2.1, vUv.y);
  gold = mix(gold, LQ_AMBER * (0.72 - 0.3 * smoothstep(1.9, 3.0, vUv.y)) * (0.85 + 0.2 * key) + gold * 0.06, shade);
  gold = mix(gold, gold * vec3(0.5, 1.0, 0.36) + LQ_GREENGOLD * 0.45, uBelly * 0.9 * (1.0 - smoothstep(0.1, 1.05, vUv.y)));
  // a rim of pale leaf along the edges that face the key (upper left): the hero stands off the dark in raking light
  gold += (LQ_GOLD * 0.75 + LQ_SILVER * 0.3) * uRim * rim * smoothstep(-0.15, 0.6, dot(Nv.xy, vec2(-0.647, 0.763))) * (1.0 - 0.85 * shade);
  vec3 silver = lqSilver(vUv * 26.0, 0.5 + 0.62 * key) + LQ_SILVER * 0.25 * rim;
  float sw = mix(vSt.w, 1.0 - vSt.w, uSwap);
  vec3 col = mix(gold, silver, clamp(sw, 0.0, 1.0)) * (1.0 - uHairK * max(dia * vSt.y, ray * vSt.z));
  float part = vSt.x;
  vec3 sail = mix(LQ_VERMILION * (0.62 + 0.5 * key), LQ_GOLD * 1.15, rayS * 0.9) + LQ_GOLD * 0.5 * smoothstep(0.9, 1.0, vUv.y);
  col = mix(col, sail, step(abs(part - 1.0), 0.5));
  col = mix(col, LQ_SMOKE * 0.3 + LQ_SILVER * 0.4 * rim, step(abs(part - 3.0), 0.5));
  vec3 Nsh = normalize(vNw + (hash33(vec3(floor(vUv * 9.0), 1.0)) - 0.5) * 0.8);   // an inlay of small pieces, each its own tilt
  float lit; vec3 sh = lqShell(Nsh, normalize(cameraPosition - vPw), uMoon, hash12(floor(vUv * 9.0)), lit) * 1.25;
  sh *= 1.0 - 0.85 * smoothstep(0.55, 0.7, length(vUv - 0.5)) * (1.0 - smoothstep(0.8, 0.9, length(vUv - 0.5)));
  col = mix(col, sh, step(abs(part - 4.0), 0.5));
  // THE MOUTH (part 5). vSt.z: 0 the gullet and the cheek web by the hinge (shadow), 1 the palate (dim amber, its comb a
  // ghost), over 1 the baleen; vSt.y 1 marks the floor, a deep bowl: darkest along its keel and toward the gullet, with
  // the gold of the rolled lip running a little way down its slopes. Dark amber all through, never black, never a flat panel.
  float mz = min(vSt.z, 1.0), bal = clamp((vSt.z - 1.0) * 2.0, 0.0, 1.0) * step(4.5, part), flr = vSt.y * step(4.5, part);
  float comb = lqHair(vUv.x * 4.5, 1.5) * smoothstep(0.1, 0.7, abs(vUv.y - 1.0));
  float deepM = 0.3 + 0.7 * smoothstep(3.3, 6.8, vUv.x);
  vec3 mouth = LQ_AMBER * (0.25 + (0.3 + 0.3 * key) * mz) * deepM + LQ_GOLD * mz * 0.06 * comb;
  float rimL = smoothstep(0.86, 1.0, abs(vUv.y - 1.0));
  vec3 bowlC = LQ_AMBER * (0.17 + 0.2 * key + 0.5 * rimL) * deepM + LQ_GOLD * 0.4 * rimL * rimL * (0.4 + 0.6 * deepM) + LQ_AMBER * 0.1 * lqHair(vUv.y * 4.0, 1.4) * deepM;
  mouth = mix(mouth, bowlC, flr);
  // the baleen: a comb of gold plates 0.4 m apart, each a tooth that tapers to a point at its hanging tip; between the
  // teeth the comb is open (cut away), so the dark bowl shows through it
  float bt = clamp(vUv.y * 5.0, 0.0, 1.0), cfw = max(fwidth(vUv.x) * 2.5, 1e-4);
  float bw = 0.42 * (1.0 - 0.8 * bt * bt) + 0.02, bd = abs(fract(vUv.x * 2.5) - 0.5);
  if (bal > 0.5 && bd > bw + 0.5 * cfw) discard;
  mouth = mix(mouth, mix(LQ_AMBER * 1.1, LQ_GOLD * (0.85 + 0.4 * key), smoothstep(0.0, 0.5, (bw - bd) / max(bw, 1e-3))) * (1.0 - 0.3 * bt), bal);
  col = mix(col, mouth, step(abs(part - 5.0), 0.5));
  gl_FragColor = vec4(lqDepth(col * uGain * vDim, dist * uDepthK), 1.0);
}`;
// pre: GLSL that declares what it needs and defines  void place(inout vec3 p, inout vec3 n, out float dim)  (to WORLD space)
function reliefMaterial(style, pre, uniforms) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: false,
    uniforms: { uGain: { value: 1 }, uSwap: { value: 0 }, uBelly: { value: 0 }, uRim: { value: 0 }, uDepthK: { value: 1 }, uHairW: { value: 1.1 }, uHairK: { value: 0.88 }, uFreq: { value: V3(14, 8, 14) }, ...uniforms },
    vertexShader: /* glsl */`
      attribute vec4 aSt; attribute vec4 aW;
      varying vec3 vNv, vPv, vOp, vNw, vPw; varying vec2 vUv; varying vec4 vSt; varying float vDim;
      ${pre}
      void main(){
        vOp = position; vUv = uv; vSt = aSt;
        vec3 p = position, n = normal; float dim = 1.0;
        place(p, n, dim);
        vDim = dim; vPw = p; vNw = n;
        vec4 mv = viewMatrix * vec4(p, 1.0); vPv = mv.xyz; vNv = normalize(mat3(viewMatrix) * n);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: style + RELIEF_FRAG,
  });
}

// ---------------------------------------------------------------- 5 geometry
class MB {
  constructor() { this.p = []; this.uv = []; this.st = []; this.w = []; this.f = []; this.idx = []; }
  v(x, y, z, u, v, st, w, fold) {
    this.p.push(x, y, z); this.uv.push(u, v); this.st.push(st[0], st[1], st[2], st[3]); this.w.push(w[0], w[1], w[2], w[3]);
    if (fold) this.f.push(fold[0], fold[1], fold[2]); else this.f.push(x, y, z);
    return this.p.length / 3 - 1;
  }
  // rows of vertex indices; closed wraps each row
  loft(rows, closed) {
    for (let i = 0; i < rows.length - 1; i++) { const a = rows[i], b = rows[i + 1], n = a.length, m = closed ? n : n - 1;
      for (let j = 0; j < m; j++) { const k = (j + 1) % n; this.idx.push(a[j], b[j], a[k], a[k], b[j], b[k]); } }
  }
  fan(c, ring) { for (let j = 0; j < ring.length - 1; j++) this.idx.push(c, ring[j], ring[j + 1]); }
  build(withFold) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aSt', new THREE.Float32BufferAttribute(this.st, 4));
    g.setAttribute('aW', new THREE.Float32BufferAttribute(this.w, 4));
    if (withFold) g.setAttribute('aFold', new THREE.Float32BufferAttribute(this.f, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    return g;
  }
}
// smooth lookup in a station table [[z, a, b, c], ...] sorted by descending z
function station(T, z) {
  let i = 0; while (i < T.length - 2 && T[i + 1][0] > z) i++;
  const a = T[i], b = T[i + 1], t = smoothstep(0, 1, clamp((a[0] - z) / (a[0] - b[0]), 0, 1));
  return [lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
}
const secPt = (th, top, bot, w) => { const c = Math.cos(th), yc = (top + bot) * 0.5; return [w * Math.sin(th), yc + (c > 0 ? top - yc : yc - bot) * c]; };

// the Bryde's whale: 15 m, +Z forward, +Y dorsal. aW = (jaw, pleat, tail, fin)
const WHALE_T = [[7.5, 0.1, -0.2, 0.06], [6.9, 0.36, -0.6, 0.34], [5.6, 0.6, -0.92, 0.56], [4.0, 0.84, -1.14, 0.7], [2.4, 1.02, -1.27, 0.76],
  [0.4, 1.1, -1.3, 0.76], [-1.6, 1.04, -1.14, 0.68], [-3.5, 0.84, -0.8, 0.5], [-5.0, 0.6, -0.5, 0.3], [-6.2, 0.38, -0.3, 0.15], [-7.1, 0.22, -0.18, 0.09]];
const WHALE_HINGE = [0.08, 3.4];   // y, z of the jaw hinge
async function whaleGeometry(pause) {   // pause(): the build's yield (no seeded draw is made here, so yields reorder nothing)
  const m = new MB(), zh = WHALE_HINGE[1], SB = 36;
  // half-width of the body's section at height y, station z (the surface the eye and the jaw line are laid on)
  const surfX = (y, z) => { const [top, bot, w] = station(WHALE_T, z), yc = (top + bot) * 0.5, k = y > yc ? (y - yc) / Math.max(top - yc, 1e-3) : (yc - y) / Math.max(yc - bot, 1e-3); return w * Math.sqrt(Math.max(1 - k * k, 0)); };
  const pleatW = (th, z) => smoothstep(0.47, 0.66, th / Math.PI) * smoothstep(-2.6, -0.4, z);
  // body: closed rings from the hinge to the tail stock
  const rows = [];
  for (let i = 0; i <= 30; i++) {
    const z = lerp(zh, -7.1, i / 30), [top, bot, w] = station(WHALE_T, z), row = [];
    for (let j = 0; j < SB; j++) {
      const th = (j / SB) * TAU, tt = th > Math.PI ? TAU - th : th, [x, y] = secPt(th, top, bot, w), pw = pleatW(tt, z);
      const lat = Math.abs(tt / Math.PI - 0.43) < 0.02 ? 0.55 * smoothstep(-6.5, -4.5, z) : 0;   // the lateral line: a few engraved strokes along the flank (no lattice)
      const dsc = 0.62 * smoothstep(0.08, 0.17, tt / Math.PI) * (1 - smoothstep(0.36, 0.47, tt / Math.PI)) * smoothstep(-6.4, -4.8, z);   // diamond scales engraved on the flank, between the back and the pleats
      row.push(m.v(x, y, z, z, tt / Math.PI * 3.0, [0, dsc, Math.max(pw, lat), 0.3 * smoothstep(0.7, 0.95, tt / Math.PI) * (1 - pw * 0.6)], [0, pw, smoothstep(-2.5, -7.1, z), 0]));
    }
    rows.push(row);
  }
  m.loft(rows, true);
  await pause();
  // the gullet: a dark cap behind the jaws
  { const [top, bot, w] = station(WHALE_T, zh), c = m.v(0, (top + bot) * 0.5, zh - 0.5, 0, 1, [5, 0, 0, 0], [0, 0, 0, 0]), ring = [];
    for (let j = 0; j <= SB; j++) { const [x, y] = secPt((j / SB) * TAU, top, bot, w); ring.push(m.v(x * 0.97, y * 0.97, zh, 0, 1, [5, 0, 0, 0], [0, 0, 0, 0])); }
    m.fan(c, ring); }
  // the jaws: upper (rostrum + palate) and lower (the pouch + the mouth's floor), split along the mouth line. 26 stations
  // along the head and 28 round the lower jaw, whose rim rolls over into a rounded lip (two more stations a side, in
  // the same loft, so the normals run smoothly over it) and whose floor is a deep bowl: a pouch, not a scoop
  const NZ = 26, NU = 12, NL = 28, NF = 14, up = [], pal = [], low = [], flo = [];
  for (let i = 0; i <= NZ; i++) {
    const z = lerp(zh, 7.5, i / NZ), [top, bot, w] = station(WHALE_T, z), yc = (top + bot) * 0.5;
    const ym = top - 0.36 * (top - bot), thm = Math.acos(clamp((ym - yc) / Math.max(top - yc, 1e-3), -1, 1)), xw = w * Math.sin(thm);
    const a = [], b = [], c = [], d = [], J = [1, 0, 0, 0], lipUv = thm / Math.PI * 3;
    for (let j = 0; j <= NU; j++) { const th = lerp(-thm, thm, j / NU), [x, y] = secPt(th, top, bot, w); a.push(m.v(x, y, z, z, Math.abs(th) / Math.PI * 3, [0, 0.55 * smoothstep(0.07, 0.16, Math.abs(th) / Math.PI) * (1 - smoothstep(6.0, 7.3, z)), 0, 0], [0, 0, 0, 0])); }
    for (let j = 0; j <= NF; j++) { const sj = j / NF; b.push(m.v(lerp(xw, -xw, sj), ym + (0.1 + 0.16 * w) * Math.sin(Math.PI * sj), z, z, sj * 2, [5, 0, 1, 0], [0, 0, 0, 0])); }
    // the rolled lip: a bead lw wide riding the rim (four stations a side, in the same loft as the pouch, so it shades as one round roll)
    const lw = Math.min(0.17, 0.5 * xw), LIP = [[1.5, -0.9], [1.1, 0.35], [0.45, 0.8], [-0.05, 0.5]], xi = xw - 1.5 * lw, yi = ym - 0.9 * lw;
    for (const q of LIP) c.push(m.v(xw - q[0] * lw, ym + q[1] * lw, z, z, lipUv, [0, 0, 0, 0], J));
    for (let j = 0; j <= NL; j++) { const th = lerp(thm, TAU - thm, j / NL), tt = th > Math.PI ? TAU - th : th, [x, y] = secPt(th, top, bot, w), pw = pleatW(tt, z);
      // aW.x: the jawbone (the rim) swings whole; the pouch's keel does not swing at all at the hinge ring (so the pouch runs on
      // from the belly with no crease) and swings whole from mid-jaw on, so the open pouch sags back into the throat in one round line; aW.y: the balloon, fullest behind mid-jaw and nothing at the chin (a pointed chin, never a box)
      c.push(m.v(x, y, z, z, tt / Math.PI * 3, [0, 0, pw * (1 - 0.5 * smoothstep(6.0, 7.5, z)), 0.3 * smoothstep(0.7, 0.95, tt / Math.PI) * (1 - pw * 0.6)], [1 - pw * (1 - smoothstep(zh, zh + 3.2, z)), pw * (1 - smoothstep(4.6, 7.35, z)), 0, 0])); }
    for (let k = 3; k >= 0; k--) c.push(m.v(-(xw - LIP[k][0] * lw), ym + LIP[k][1] * lw, z, z, lipUv, [0, 0, 0, 0], J));
    // the floor: a bowl hung between the lips (aSt.y 1 marks it for the shader), which sinks with the pouch when it fills (aW.y)
    const bowl = 0.5 * (ym - bot), sink = 0.25 * (1 - smoothstep(4.6, 7.35, z)) * smoothstep(zh, zh + 0.8, z);
    for (let j = 0; j <= NF; j++) { const sj = j / NF, sn = Math.sin(Math.PI * sj); d.push(m.v(lerp(-xi, xi, sj), yi - bowl * Math.pow(sn, 0.7), z, z, sj * 2, [5, 1, 0.16, 0], [1, sink * sn, 0, 0])); }
    up.push(a); pal.push(b); low.push(c); flo.push(d);
  }
  m.loft(up, false); m.loft(pal, false); m.loft(low, false); m.loft(flo, false);
  await pause();
  // the baleen: a gold comb hung from each edge of the upper jaw to some 40% of the gape (longest toward the front, where
  // the gape is widest; nothing at the snout's tip), its plates 0.4 m apart: the shader cuts them to tapered teeth
  for (const sx of [-1, 1]) { const rs = [];
    for (let i = 0; i <= 16; i++) { const s = i / 16, z = lerp(zh, 7.5, s), [top, bot, w] = station(WHALE_T, z), yc = (top + bot) * 0.5;
      const ym = top - 0.36 * (top - bot), thm = Math.acos(clamp((ym - yc) / Math.max(top - yc, 1e-3), -1, 1)), xw = w * Math.sin(thm);
      const hang = (0.1 + 1.0 * s) * (1 - smoothstep(0.8, 1.0, s)) + 0.03;
      rs.push([m.v(sx * xw * 0.98, ym + 0.03, z, z, 0, [5, 0, 1.5, 0], [0, 0, 0, 0]), m.v(sx * xw * 0.8, ym - hang, z - 0.18 * hang, z, 0.2, [5, 0, 1.5, hang], [0, 0, 0, 0])]); }
    m.loft(rs, false); }
  // the cheeks: a small web of shadow by the hinge only (the rear third of the gape), from the upper lip to the lower
  // (its lower edge swings with the jaw). Forward of it the mouth is open: the lens looks in over the lip
  for (const sx of [-1, 1]) { const rs = [];
    for (let i = 0; i <= 8; i++) { const s = i / 8, z = lerp(zh - 0.3, zh + 1.4, s), [top, bot, w] = station(WHALE_T, Math.max(z, zh)), yc = (top + bot) * 0.5;
      const ym = top - 0.36 * (top - bot), thm = Math.acos(clamp((ym - yc) / Math.max(top - yc, 1e-3), -1, 1)), xw = w * Math.sin(thm) * 0.9;
      rs.push([m.v(sx * xw, ym - 0.02, z, z, 1, [5, 0, 0.0, 0], [0, 0, 0, 0]), m.v(sx * xw, ym - 0.05, z, z, 1.62, [5, 0, 0.0, 0], [1, 0, 0, 0])]); }
    m.loft(rs, false); }
  // flukes (drawn a little turned, as on a panel), pectoral fins, dorsal fin
  for (const sx of [-1, 1]) {
    const rs = [];
    for (let i = 0; i <= 7; i++) { const s = i / 7, x = sx * 2.25 * s, le = -6.5 - 1.05 * Math.pow(s, 1.2), te = -7.25 - 0.42 * Math.sin(Math.min(1, s * 1.1) * Math.PI * 0.5) - 0.1 * s, r = [];
      for (let j = 0; j <= 2; j++) { const z = lerp(le, Math.min(te, le - 0.02), j / 2); r.push(m.v(x, 0.02 + sx * x * 0.3 + 0.05 * (1 - s) * (j === 1 ? 1 : 0), z, z, s * 4.4, [0, 0, 0.9, 0], [0, 0, 1, 0])); }
      rs.push(r); }
    m.loft(rs, false);
    const ps = [];
    for (let i = 0; i <= 8; i++) { const s = i / 8, ch = 1.8 * (1 - 0.74 * s * s) * (0.62 + 0.38 * Math.min(1, s * 3.5)), r = [];     // a broad swept paddle with a narrow root: twice the old chord
      for (let j = 0; j <= 5; j++) { const t = j / 5;     // uv.y: three ray hairlines across the chord; over 1.9 at the root, so the belly's amber shade falls on it there and the blade runs out to gold
        r.push(m.v(sx * (0.62 + 1.35 * s + 0.07 * Math.sin(Math.PI * t) * (1 - s)), -0.72 - 0.82 * s - 0.05 * Math.sin(Math.PI * t), 2.35 - 2.5 * s - ch * (t - 0.3), s, 1.0 + t * 0.667 + 1.25 * (1 - s) * (1 - s), [0, 0, 0.9, 0], [0, 0, 0, s])); }
      ps.push(r); }
    m.loft(ps, false);
    // the shell-inlay eye, 0.45 m across, laid on the flank just behind and above the corner of the mouth; its uv runs
    // past 0.5 so the shader's black ring falls inside the fan (shell iris, black ring)
    { const ey = 0.36, ez = 2.9, ER = 0.3, ec = m.v(sx * (surfX(ey, ez) + 0.05), ey, ez, 0.5, 0.5, [4, 0, 0, 0], [0, 0, 0, 0]), er = [];
      for (let j = 0; j <= 16; j++) { const a = j / 16 * TAU, y = ey + ER * Math.sin(a), z = ez + ER * 1.12 * Math.cos(a);
        er.push(m.v(sx * (surfX(y, z) + 0.02), y, z, 0.5 + 0.86 * Math.cos(a), 0.5 + 0.86 * Math.sin(a), [4, 0, 0, 0], [0, 0, 0, 0])); }
      m.fan(ec, er); }
    // the engraved jaw line: a black inlay strip along the upper lip from the snout to the hinge, hooking down behind it
    // to the corner of the mouth under the eye; a second strip rides the lower lip and swings with the jaw
    for (const jw of [0, 1]) { const rs = [];
      for (let i = jw ? 0 : -5; i <= 28; i++) {
        const s = i / 28, hk = Math.max(0, -i / 5), z = s >= 0 ? lerp(zh, 7.44, s) : zh - 0.62 * hk;
        const [top, bot] = station(WHALE_T, Math.max(z, zh)), ym = top - 0.36 * (top - bot) - 0.34 * hk * hk - (jw ? 0.035 : 0);
        const hw = (0.075 - 0.05 * Math.max(s, 0) * Math.max(s, 0)) * (1 - 0.7 * hk);
        rs.push([m.v(sx * (surfX(ym + hw, z) + 0.016), ym + hw, z, s, 0, [3, 0, 0, 0], [jw, 0, 0, 0]), m.v(sx * (surfX(ym - hw, z) + 0.016), ym - hw, z, s, 1, [3, 0, 0, 0], [jw, 0, 0, 0])]); }
      m.loft(rs, false); }
  }
  { const rs = [];
    for (let i = 0; i <= 6; i++) { const s = i / 6, z = -3.0 - 1.3 * s, top = station(WHALE_T, z)[0], hgt = 0.62 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.25) * 0.8), 0.8) * (1 - s * 0.6);
      rs.push([m.v(0, top - 0.05, z, z, 0, [0, 0, 0.8, 0], [0, 0, 0.3, 0]), m.v(0, top + hgt, z - 0.5 * hgt, z, 0.6, [0, 0, 0.8, 0], [0, 0, 0.3, 0])]); }
    m.loft(rs, false); }
  await pause();
  const g = m.build(false);
  await pause();
  const P = g.attributes.position, Nn = g.attributes.normal, St = g.attributes.aSt, acc = new Map();
  const key = (i) => Math.round(P.getX(i) * 500) + ',' + Math.round(P.getY(i) * 500) + ',' + Math.round(P.getZ(i) * 500);
  for (let i = 0; i < P.count; i++) { if (St.getX(i) > 0.5) continue; const k = key(i), e = acc.get(k) || [0, 0, 0]; e[0] += Nn.getX(i); e[1] += Nn.getY(i); e[2] += Nn.getZ(i); acc.set(k, e); }
  await pause();
  for (let i = 0; i < P.count; i++) { if (St.getX(i) > 0.5) continue; const e = acc.get(key(i)), l = Math.hypot(e[0], e[1], e[2]) || 1; Nn.setXYZ(i, e[0] / l, e[1] / l, e[2] / l); }
  return g;
}

// the sailfish: 3 m, +Z forward. aW = (sail height share, sail height m, tail weight, 0)
const SAIL_T = [[1.5, 0.005, -0.005, 0.004], [0.86, 0.045, -0.05, 0.022], [0.62, 0.17, -0.17, 0.058], [0.3, 0.235, -0.235, 0.085], [0, 0.24, -0.245, 0.09],
  [-0.4, 0.2, -0.2, 0.078], [-0.8, 0.13, -0.13, 0.052], [-1.1, 0.06, -0.06, 0.028], [-1.27, 0.035, -0.035, 0.018]];
function sailfishGeometry() {
  const m = new MB(), S = 14, rows = [];
  for (let i = 0; i <= 26; i++) {
    const z = lerp(1.5, -1.27, Math.pow(i / 26, 0.9)), [top, bot, w] = station(SAIL_T, z), row = [], tw = smoothstep(0.5, -1.4, z);
    for (let j = 0; j < S; j++) { const th = (j / S) * TAU, tt = th > Math.PI ? TAU - th : th, [x, y] = secPt(th, top, bot, w);
      row.push(m.v(x, y, z, z, tt / Math.PI * 0.5, [0, smoothstep(0.9, 0.6, z), 0, 0.85 * smoothstep(0.55, 0.8, tt / Math.PI) * smoothstep(0.9, 0.6, z)], [0, 0, tw, 0])); }
    rows.push(row);
  }
  m.loft(rows, true);
  // the sail
  const sr = [];
  for (let i = 0; i <= 28; i++) { const s = i / 28, z = lerp(0.56, -0.8, s), top = station(SAIL_T, z)[0];
    const hgt = 1.0 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.8)), 0.55) * (1 - 0.32 * s) * (1 - 0.07 * Math.abs(Math.sin(s * 40))), r = [];
    for (let j = 0; j <= 4; j++) { const t = j / 4; r.push(m.v(0, top - 0.02 + hgt * t, z - 0.22 * hgt * t, s, t, [1, 0, 0, 0], [t, hgt, smoothstep(0.5, -1.4, z), 0])); }
    sr.push(r); }
  m.loft(sr, false);
  // tail crescent, pectorals, pelvic rays, second dorsal and anal fin
  for (const sy of [-1, 1]) {
    const tr = [];
    for (let i = 0; i <= 6; i++) { const s = i / 6, y = sy * 0.6 * Math.pow(s, 0.85), z0 = -1.22 - 0.36 * s * s, ch = 0.16 * (1 - 0.85 * s);
      tr.push([m.v(0, y, z0, s, 0, [0, 0, 1, 0], [0, 0, 1, 0]), m.v(0, y * 0.93, z0 - ch, s, 0.2, [0, 0, 1, 0], [0, 0, 1, 0])]); }
    m.loft(tr, false);
    const fr = [];
    for (let i = 0; i <= 4; i++) { const s = i / 4; fr.push([m.v(sy * (0.07 + 0.05 * s), -0.14 - 0.3 * s, 0.42 - 0.42 * s, s, 0, [0, 0, 1, 0], [0, 0, 0, 0]), m.v(sy * (0.07 + 0.05 * s), -0.16 - 0.3 * s, 0.34 - 0.5 * s + 0.06 * s, s, 0.12, [0, 0, 1, 0], [0, 0, 0, 0])]); }
    m.loft(fr, false);
    const z1 = sy > 0 ? -0.86 : -0.7, t1 = station(SAIL_T, z1), yb = sy > 0 ? t1[0] : t1[1];
    m.loft([[m.v(0, yb, z1, 0, 0, [0, 0, 1, 0], [0, 0, 0.6, 0]), m.v(0, yb, z1 - 0.25, 0.2, 0, [0, 0, 1, 0], [0, 0, 0.7, 0])],
      [m.v(0, yb + sy * 0.13, z1 - 0.1, 0, 0.13, [0, 0, 1, 0], [0, 0, 0.6, 0]), m.v(0, yb + sy * 0.03, z1 - 0.3, 0.2, 0.1, [0, 0, 1, 0], [0, 0, 0.7, 0])]], false);
    // eye
    const ec = m.v(sy * 0.064, 0.05, 0.6, 0.5, 0.5, [4, 0, 0, 0], [0, 0, 0, 0]), er = [];
    for (let j = 0; j <= 8; j++) { const a = j / 8 * TAU; er.push(m.v(sy * 0.058, 0.05 + 0.04 * Math.sin(a), 0.6 + 0.04 * Math.cos(a), 0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a), [4, 0, 0, 0], [0, 0, 0, 0])); }
    m.fan(ec, er);
  }
  return m.build(false);
}

// the gannet: 2.2 m span, +Z forward. aW = (signed span share, 0, 0, 0); aFold = the wing swept back for the plunge
const BIRD_T = [[0.52, 0.004, -0.004, 0.004], [0.36, 0.03, -0.03, 0.026], [0.3, 0.065, -0.06, 0.058], [0.2, 0.055, -0.06, 0.052], [0.05, 0.1, -0.11, 0.1],
  [-0.12, 0.105, -0.115, 0.105], [-0.3, 0.06, -0.07, 0.07], [-0.52, 0.012, -0.012, 0.05]];
function gannetGeometry(slim) {
  const m = new MB(), S = 8, rows = [];
  for (let i = 0; i <= 9; i++) {
    const z = lerp(0.52, -0.52, i / 9), [top, bot, w] = station(BIRD_T, z), row = [];
    for (let j = 0; j < S; j++) { const [x, y] = secPt((j / S) * TAU, top, bot, w); row.push(m.v(x, y, z, z, j / S, [0, 0, 0, smoothstep(0.24, 0.12, z)], [0, 0, 0, 0])); }
    rows.push(row);
  }
  m.loft(rows, true);
  const chordK = slim ? 0.72 : 1;
  for (const sx of [-1, 1]) {
    const seg = (s0, s1, n, part) => {
      const rs = [];
      for (let i = 0; i <= n; i++) {
        const s = lerp(s0, s1, i / n), x = sx * (0.08 + 1.02 * s), le = 0.1 + 0.1 * Math.sin(Math.min(1, s * 2) * Math.PI * 0.5) - 0.34 * Math.max(0, s - 0.5) * (s - 0.5) * 4 * 0.5;
        const ch = chordK * (0.26 - 0.1 * s) * (1 - Math.pow(s, 5)) + 0.015, y = 0.03 + 0.05 * Math.sin(s * Math.PI), r = [];
        for (let j = 0; j <= 2; j++) { const t = j / 2, zz = le - ch * t;
          r.push(m.v(x, y + 0.012 * Math.sin(Math.PI * t), zz, s, t, [part, 0, part === 0 ? 0.7 : 0, 1], [sx * s, 0, 0, 0], [sx * (0.08 + 0.1 * s + 0.05 * t), 0.04, 0.12 - 1.05 * s - ch * 0.3 * t])); }
        rs.push(r);
      }
      m.loft(rs, false);
    };
    seg(0, 0.72, 6, 0); seg(0.72, 1, 3, 3);
  }
  return m.build(true);
}

// ---------------------------------------------------------------- 6 the lacquer sea
const MOON_GLSL = /* glsl */`
uniform vec3 uDisc; uniform vec3 uMoonKind;   // x crescent 0..1, y maria 0..1, z sun rays 0..1
// q: disc coordinates (|q| <= 1), aa: one pixel in q units. A leaf disc with crinkle, seams and engraved maria.
vec3 moonLeaf(vec2 q, float aa){
  float r = length(q), m = 1.0 - smoothstep(1.0 - aa * 1.5, 1.0, r);
  float cut = smoothstep(0.96 - aa * 1.5, 0.96, length(q - vec2(-0.36, 0.14)));
  m *= mix(1.0, cut, uMoonKind.x);
  float cr = vnoise(q * 9.0) * 0.6 + vnoise(q * 23.0) * 0.4;
  float nm = vnoise(q * 2.3 + 4.0) * 0.7 + vnoise(q * 5.0 + 9.0) * 0.3;
  float maria = smoothstep(0.5, 0.56, nm) * uMoonKind.y;
  vec3 leaf = uDisc * (1.22 + 0.38 * cr) * (1.0 - 0.4 * maria);
  leaf *= 1.0 - 0.5 * uMoonKind.y * (1.0 - smoothstep(0.008 + aa, 0.02 + aa * 2.0, abs(nm - 0.5)));
  vec2 g = abs(fract(q * 2.5 + 0.5) - 0.5);
  leaf *= 1.0 - 0.16 * (1.0 - smoothstep(0.0, 0.03 + aa * 2.0, min(g.x, g.y)));
  float an = (abs(q.x) + abs(q.y) > 1e-4) ? atan(q.y, q.x) : 0.0;
  float ray = 1.0 - smoothstep(0.1, 0.22 + aa * 12.0, abs(fract(an * 3.8197) - 0.5));
  leaf *= 1.0 - 0.45 * uMoonKind.z * ray * smoothstep(0.32, 0.4, r);
  leaf *= 1.0 - 0.5 * uMoonKind.z * (1.0 - smoothstep(0.0, 0.02 + aa * 2.0, abs(r - 0.32)));
  return leaf * m;
}`;
const SWELL_GLSL = /* glsl */`
float swellH(vec2 p, float t){ return 0.22 * sin(p.x * 0.11 + t * 0.7) + 0.16 * sin(p.y * 0.17 - t * 0.55 + p.x * 0.05) + 0.08 * sin((p.x + p.y) * 0.31 + t * 1.1); }
vec2 swellS(vec2 p, float t){
  float a = cos(p.x * 0.11 + t * 0.7), b = cos(p.y * 0.17 - t * 0.55 + p.x * 0.05), c = cos((p.x + p.y) * 0.31 + t * 1.1);
  return vec2(0.0242 * a + 0.008 * b + 0.0248 * c, 0.0272 * b + 0.0248 * c);
}`;
// ornament shared by the sea and the deep ground (needs the style's hashes). No derivative is taken inside: the callers
// pass the screen footprints in, so these are safe to call from a branch.
const ORN_GLSL = /* glsl */`
// one hairline of a coordinate c whose screen footprint is fc (taken outside): at least 1.3 px, fades when unresolved
float hairW(float c, float fc, float w0){ float d = abs(fract(c) - 0.5), w = max(w0, 0.65 * fc); return (1.0 - smoothstep(w, w + fc, d)) * (1.0 - smoothstep(0.28, 0.5, fc)); }
float hairF(float c, float fc){ return hairW(c, fc, 0.04); }
// sprinkled dust: one soft grain per cell, thrown anywhere in it (no rows), kept while it covers a fraction of a pixel
float speck(vec2 p, float cell, float thr, float pxw){
  vec2 id = floor(p / cell), f = fract(p / cell) - 0.5; vec2 h = hash22(id + 11.3);
  float r = length(f - (h - 0.5) * 0.62), s = 0.1 + 0.1 * h.x, aa = pxw / cell;
  return step(thr, hash12(id + 3.9)) * (1.0 - smoothstep(s, s + aa + 0.04, r)) * min(1.0, s / max(aa, 1e-3));
}
// a grain of sprinkled dust: a speck that exists only while it is a grain on screen (it leaves before it is a blob)
float grain(vec2 p, float cell, float thr, float pxw){ return speck(p, cell, thr, pxw) * (1.0 - smoothstep(1.5, 3.0, 0.15 * cell / pxw)); }
// nashiji at any distance: four sizes of grain that hand over to one another, so there are no rows and no blobs
float sprinkleK(vec2 xz, float pxw, float k4){   // k4: the share of the coarsest (14 m) grains
  vec2 r = vec2(0.8 * xz.x - 0.6 * xz.y, 0.6 * xz.x + 0.8 * xz.y);
  return grain(xz, 0.7, 0.5, pxw) + grain(r + 17.3, 2.0, 0.42, pxw) + grain(xz + 41.1, 5.5, 0.36, pxw) + k4 * grain(r - 23.7, 14.0, 0.3, pxw);
}
float sprinkle(vec2 xz, float pxw){ return sprinkleK(xz, pxw, 1.0); }
// seigaiha: overlapping wave scales in cell units (rows 0.25 apart, the nearest row in front wins), three engraved
// rings to a scale. dpx, dpy: the screen derivatives of p. fc: the rings' footprint in ring spacings. w0: the line's
// half-width in ring spacings.
float seigaiha(vec2 p, vec2 dpx, vec2 dpy, float w0, out float fc){
  float dsc = 2.0; vec2 dv = vec2(0.0, 1.0);
  for (int k = 0; k < 4; k++) {
    float row = floor(p.y / 0.25) - 1.0 + float(k), off = 0.5 * mod(row, 2.0);
    vec2 ctr = vec2(floor(p.x - off + 0.5) + off, row * 0.25), v = p - ctr; float d = length(v) * 2.0;
    if (d < 1.0 && dsc > 1.5) { dsc = d; dv = v / max(length(v), 1e-4); }
  }
  fc = (abs(dot(dv, dpx)) + abs(dot(dv, dpy))) * 5.0;
  return dsc < 1.5 ? hairW(dsc * 2.5, fc, w0) : 0.0;
}`;
// the net of light on the sea's underside: a warped mesh of seams, cs metres to a mesh, drifting (0 on a seam, toward 1 between)
const NET_GLSL = /* glsl */`
float netM(vec2 xz, float cs, float t) {
  vec2 cp = xz * (3.14159 / cs) + cs * 1.7;
  float ca = cp.x + 1.25 * sin(cp.y * 0.63 + t * 0.33) + 0.55 * sin(cp.y * 1.7 - t * 0.21 + cp.x * 0.4);
  float cb = cp.y + 1.25 * sin(cp.x * 0.57 - t * 0.29) + 0.55 * sin(cp.x * 1.9 + t * 0.17 - cp.y * 0.3);
  return min(abs(sin(ca)), abs(sin(cb)));
}`;
async function makeSurface(style, mood, pause) {   // pause(): the build's yield (no seeded draw is made here, so yields reorder nothing)
  const g = new THREE.PlaneGeometry(2, 2, 127, 127); await pause(); g.rotateX(-Math.PI / 2); await pause();
  const rings = []; for (let i = 0; i < 16; i++) rings.push(new THREE.Vector4(0, 0, -1, 0));
  const uniforms = {
    uTime: { value: 0 }, uCenter: { value: V3() }, uMoonAir: { value: mood.moonAir.clone() }, uSeen: { value: mood.moonSeen.clone() }, uSx: { value: mood.seenX.clone() }, uSy: { value: mood.seenY.clone() },
    uMoonTan: { value: Math.tan(mood.moonRadius) }, uDisc: { value: mood.discColor.clone() }, uMoonKind: { value: mood.moonKind.clone() },
    uFoil: { value: mood.foilColor.clone() }, uCell: { value: mood.cell }, uGate: { value: RC.clone() }, uRing: { value: rings }, uBoil: { value: V3(BOIL.x, BOIL.z, 9) },
    uRain: { value: mood.rain }, uBreeze: { value: mood.breeze }, uSpread: { value: mood.spread }, uRoof: { value: mood.roofColor.clone() }, uRoofK: { value: 1 }, uAboveK: { value: 1 }, uClimb: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, side: THREE.DoubleSide, fog: false, transparent: true, depthWrite: true,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendEquation: THREE.AddEquation,
    vertexShader: SWELL_GLSL + /* glsl */`
      uniform float uTime; uniform vec3 uCenter; varying vec3 vW;
      void main(){
        vec2 gq = position.xz, q = sign(gq) * pow(abs(gq), vec2(2.2)) * 900.0;
        vec3 w = vec3(uCenter.x + q.x, 0.0, uCenter.z + q.y);
        w.y = swellH(w.xz, uTime) * (1.0 - smoothstep(150.0, 420.0, length(q)));
        vW = w; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: style + fx.GLSL_VALUE_NOISE + MOON_GLSL + SWELL_GLSL + ORN_GLSL + NET_GLSL + /* glsl */`
      uniform float uTime, uMoonTan, uCell, uRain, uBreeze, uSpread, uRoofK, uAboveK, uClimb; uniform vec3 uMoonAir, uSeen, uSx, uSy, uFoil, uBoil, uGate, uRoof; uniform vec4 uRing[16];
      varying vec3 vW;
      void main(){
        vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3);
        vec2 xz = vW.xz, dxz = dFdx(xz), dyz = dFdy(xz);
        float pxw = max(length(abs(dxz) + abs(dyz)) * 0.7, 1e-4);
        vec2 sl = swellS(xz, uTime);
        bool above = uAboveK > 0.5;   // decided once per frame in update() (a uniform, never a per-fragment test: no hairline at the horizon under antialiasing)
        // ---- shared: rings (plunges in gold, rain in silver)
        float ringG = 0.0;
        for (int i = 0; i < 16; i++) {
          vec2 rv = xz - uRing[i].xy; float age = uRing[i].z, r = length(rv), R1 = 0.4 + 2.3 * pow(max(age, 0.0), 0.7);
          vec2 rd = rv / max(r, 1e-3); float fr = (abs(dot(rd, dxz)) + abs(dot(rd, dyz))) * 0.8 + 1e-4, th = max(0.03 + 0.012 * age, 1.1 * fr);
          float a = (1.0 - smoothstep(th, th + fr, abs(r - R1))) + 0.7 * (1.0 - smoothstep(th, th + fr, abs(r - R1 * 0.55)));
          a += 0.4 * (1.0 - smoothstep(0.0, R1 * 0.3 + 0.05, r)) * (1.0 - smoothstep(0.0, 0.8, age));
          ringG += a * step(0.0, age) * smoothstep(0.0, 0.12, age) * (1.0 - smoothstep(2.6, 5.5, age)) * uRing[i].w * clamp((0.03 + 0.012 * age) / (1.1 * fr), 0.2, 1.0);
        }
        ringG = min(ringG, 1.1);
        vec2 rc = floor(xz / 5.0); vec2 rh = hash22(rc + 31.7);
        vec2 rcv = xz - (rc + 0.3 + 0.4 * rh) * 5.0; float rage = fract(uTime / 2.4 + rh.x) * 2.4, rr = length(rcv);
        vec2 rdv = rcv / max(rr, 1e-3); float frr = (abs(dot(rdv, dxz)) + abs(dot(rdv, dyz))) * 0.8 + 1e-4, rth = max(0.045, 1.1 * frr);
        // sparse silver hairline rings within 60 m: the width is measured along the ring's own radius, and a ring thinner
        // than its pixel dims instead of swelling, so nothing gathers into a white band toward the horizon
        float rainR = uRain * (1.0 - smoothstep(rth, rth + frr, abs(rr - (0.15 + 0.85 * rage)))) * (1.0 - smoothstep(0.6, 2.2, rage)) * step(0.5, rh.y)
                    * clamp(0.045 / (1.2 * frr), 0.0, 1.0) * (1.0 - smoothstep(25.0, 70.0, dist)) * 0.6;
        // from below: about a dozen faint hairline rings (1.5 px) in 14 m cells, never discs
        vec2 rc2 = floor(xz / 14.0); vec2 rh2 = hash22(rc2 + 5.3);
        float rage2 = fract(uTime / 3.2 + rh2.x) * 3.2, rr2 = length(xz - (rc2 + 0.25 + 0.5 * rh2) * 14.0);
        float rainB = uRain * (1.0 - smoothstep(0.75 * pxw, 1.5 * pxw, abs(rr2 - (0.3 + 1.1 * rage2)))) * (1.0 - smoothstep(0.8, 2.6, rage2)) * step(0.7, rh2.y);
        // the direction of the portal, taken once (never a zero vector, also at the instant the lens reaches its centre)
        vec3 gv = uGate - cameraPosition; vec3 gd = gv / max(length(gv), 1e-3);
        // ---- refraction terms (used from below; computed here so derivatives stay outside the branch)
        vec3 I = -V;
        vec2 rip = sl * 3.0 + 0.012 * vec2(sin(dot(xz, vec2(0.9, 0.4)) + uTime * 1.4), sin(dot(xz, vec2(-0.5, 1.1)) - uTime * 1.1));
        vec3 Nd = normalize(vec3(rip.x, -1.0, rip.y));
        float cosi = max(-dot(I, Nd), 0.0), kk = 1.0 - 1.777 * (1.0 - cosi * cosi);
        // the window's own measure (over 0 inside the flat-water circle), with a slow wobble
        float cf = max(I.y + 0.007 * sin(dot(xz, vec2(0.05, 0.031)) + uTime * 0.6) + 0.005 * sin(dot(xz, vec2(-0.027, 0.06)) - uTime * 0.45), 0.0);
        float kf = 1.0 - 1.777 * (1.0 - cf * cf);
        float fwk = max(fwidth(kf) * 1.2, 1e-4);                             // (the footprint of the window's rim, taken outside the branch)
        vec3 col = vec3(0.0); float alpha = 0.0;
        if (above) {
          // seigaiha: overlapping wave scales, the nearest row in front wins
          vec2 p = (xz + vec2(0.1, 0.34) * uTime + sl * 14.0) / uCell;
          float fc; float line = seigaiha(p, dxz / uCell, dyz / uCell, 0.04, fc);
          float sunK = uMoonKind.z;                                         // the gold-leaf sun: its sea burns (scales drawn further out and brighter near the lens, a clearer pool)
          line *= 1.0 - smoothstep(0.07 + 0.04 * sunK, 0.2 + 0.08 * sunK, fc);   // beyond some 45 m (60 m under the sun) the scales give way to round dust: never dashes
          float pw = hash12(floor(xz / 0.035) + 1.7);                       // gold powder along the lines
          vec3 Nw = normalize(vec3(-sl.x * 3.0, 1.0, -sl.y * 3.0));
          vec3 hv = normalize(uMoonAir + V);
          float gl = smoothstep(0.86 + 0.1 * pw, 0.9 + 0.1 * pw, dot(Nw, hv) + 0.12 * (pw - 0.5));
          vec3 gold = LQ_GOLD * (0.34 + 0.26 * pw + 0.55 * gl) * line * (1.0 + 0.7 * sunK * (1.0 - smoothstep(10.0, 40.0, dist)));   // (under the sun the nearest rows are as bright as the foil flakes)
          // sprinkled dust where the lines are too fine, and far away
          float dust = speck(xz, 0.4, 0.86, pxw) * smoothstep(0.05, 0.2, fc) * (1.0 - smoothstep(30.0, 90.0, dist))
                     + speck(xz + 7.7, 2.2, 0.8, pxw) * smoothstep(18.0, 32.0, dist) * (1.0 - smoothstep(36.0, 62.0, dist));
          gold += LQ_GOLD * 0.75 * dust;
          // far water (beyond some 70 m) carries only ROUND dust: a grain lying on the water would be a dash at that slant, so the
          // far dust is laid in the lens's own angles (bearing, depression), thinning away well short of the horizon
          float dep = max(V.y, 0.0), azV = (abs(V.x) + abs(V.z) > 1e-4) ? atan(-V.x, V.z) : 0.0, azM = atan(uMoonAir.x, -uMoonAir.z);
          vec2 dc = vec2(azV, dep * 1.3) / 0.009, did = floor(dc), df = fract(dc) - 0.5; vec2 dh = hash22(did + 77.7);
          float farDust = step(0.6, hash12(did + 3.1)) * (1.0 - smoothstep(0.08 + 0.12 * dh.y, 0.17 + 0.17 * dh.y, length(df - (dh - 0.5) * 0.55)))
                        * smoothstep(0.006, 0.016, dep) * (1.0 - smoothstep(0.09, 0.18, dep)) * smoothstep(26.0, 48.0, dist);
          gold += LQ_GOLD * 0.55 * farDust * (0.45 + 0.55 * dh.x);
          gold += LQ_GOLD * 0.4 * uBreeze * speck(xz + vec2(uTime * 1.6, uTime * 0.4), 0.3, 0.9, pxw) * (1.0 - smoothstep(20.0, 60.0, dist));
          // the boil: shell-coloured disturbed rings
          vec2 bv = xz - uBoil.xy; float rb = length(bv), an = (abs(bv.x) + abs(bv.y) > 1e-4) ? atan(bv.y, bv.x) : 0.0;
          float cb = rb * 1.1 - uTime * 1.3 + 0.5 * sin(an * 5.0 + rb * 0.8);
          float bl = hairF(cb, max(pxw * 1.1, 1e-4)) * (1.0 - smoothstep(uBoil.z * 0.55, uBoil.z * 1.25, rb)) * (1.0 - smoothstep(0.2, 0.5, pxw));   // (far off its rings would be level dashes)
          vec3 boil = mix(LQ_SHELL_A, LQ_SHELL_B, 0.5 + 0.5 * sin(an * 3.0 + rb * 0.7 - uTime * 0.6)) * 0.85 * bl;
          // the foil path: square leaf flakes that catch the moon in turn
          float fxw = abs(dxz.x) + abs(dyz.x), fzw = abs(dxz.y) + abs(dyz.y);
          vec2 cs = vec2(max(0.5, exp2(ceil(log2(max(fxw, 1e-4) * 3.0)))), max(0.5, exp2(ceil(log2(max(fzw, 1e-4) * 1.6)))));
          vec2 fid = floor(xz / cs), ff = fract(xz / cs); vec2 fh = hash22(fid + cs * 7.31);
          vec2 tilt = sl * 2.5 + (fh - 0.5) * vec2(uSpread * 0.3, uSpread * 0.9) + 0.07 * vec2(sin(uTime * (0.7 + fh.x) + fh.y * 6.283), cos(uTime * (0.6 + fh.y) + fh.x * 6.283));
          vec3 nf = normalize(vec3(-tilt.x, 1.0, -tilt.y));
          float mr = dot(reflect(-V, nf), uMoonAir);
          float flake = smoothstep(0.985, 0.994, mr);
          vec2 ee = min(ff, 1.0 - ff), fa = vec2(fxw, fzw) / cs;
          flake *= smoothstep(0.05, 0.05 + fa.x, ee.x) * smoothstep(0.05, 0.05 + fa.y, ee.y);
          flake *= 1.0 - smoothstep(45.0, 110.0, dist);                     // far off a square flake is a dash on the horizon: there the path is flecks (below)
          vec3 foil = uFoil * (0.7 + 0.55 * hash12(fid + 5.5)) * flake;
          // THE FAR PATH AND THE HORIZON. Beyond the flakes the moon's path is irregular round flecks laid in the lens's own
          // angles (bearing, depression), so they are grains on screen at any distance, each twinkling in its own time;
          // no haze anywhere: the flecks thin away short of the horizon, which stays hard, black sky on black lacquer
          float daz = azV - azM; daz -= 6.2832 * floor(daz / 6.2832 + 0.5);
          vec2 ac = vec2(daz, dep * 1.4) / 0.0085, aid = floor(ac), af = fract(ac) - 0.5; vec2 ah = hash22(aid + 41.7);
          float atw = 0.5 + 0.5 * sin(uTime * (0.7 + 2.2 * ah.x) + ah.y * 6.2832);
          float fleckF = step(0.52, hash12(aid + 9.1)) * (1.0 - smoothstep(0.1 + 0.16 * ah.y, 0.2 + 0.2 * ah.y, length(af - (ah - 0.5) * 0.5))) * smoothstep(0.35, 0.8, atw);
          fleckF *= exp(-daz * daz / (0.0032 + 0.02 * uSpread * uSpread)) * smoothstep(0.002, 0.012, dep) * (1.0 - smoothstep(0.035, 0.085, dep));
          foil += uFoil * (0.5 + 0.7 * ah.x) * fleckF;
          // THE POOL: under the disc its light lies on the water as one soft warm pool (a wash of amber under the scales,
          // which burn a little brighter inside it), widest near the lens and drawn out toward the disc; no edge anywhere
          float poolW = exp(-daz * daz / 0.2) * smoothstep(0.03, 0.2, dep) * (1.0 - smoothstep(0.3, 0.75, dep)) * (0.75 + 0.5 * vnoise(xz * 0.06 + vec2(uTime * 0.05, 3.0)));
          poolW *= 0.4 + 0.6 * uMoonKind.z;                                 // (full for the gold sun; a moon's pool is fainter)
          gold = gold * (1.0 + (0.6 + 0.5 * sunK) * poolW) + (LQ_AMBER * 0.8 + uFoil * 0.2) * (0.2 + 0.06 * sunK) * poolW;
          col = lqDepth(gold + boil, dist) + lqDepth(foil, min(dist, 240.0) * 0.22) + lqDepth(LQ_GOLD * 1.25 * ringG * (1.0 - smoothstep(55.0, 115.0, dist)) + LQ_SILVER * 0.8 * rainR, dist * 0.5);   // a far ring would be a dash on the horizon
          // the lacquer is clear enough to carry the birds' doubles, but closes over the far portal so it is not given away
          alpha = mix(1.0, 0.66, smoothstep(0.06, 0.09, length(cross(I, gd))));
        } else {
          // THE ROOF. From below the sea is LIGHT, never ornament: Snell's window overhead is a pool of cut leaf (kirikane:
          // cool silver slivers, one in four of them gold) that rocks with the swell, densest round the moon's disc, and
          // the leaf itself has no edge: it thins away through a wide ragged margin, runs on as a glitter path toward the
          // moon's side and lies in loose drifts far out, then fine dust, then dark; the pattern never ends on a line.
          // The one line on the roof is the brief's silver hairline round the window's true rim (hair, below).
          // (The ground below is warm gold wave scales: the two share no tone and no motif.)
          float wn = vnoise(xz * 0.019 + vec2(uTime * 0.012, 3.0)) * 0.62 + vnoise(xz * 0.061 - uTime * 0.016) * 0.38;
          float kfn = kf + 0.62 * (wn - 0.5);
          float inside = smoothstep(-0.1, 0.34, kfn);
          // the moon stands lifted inside the window (drawn whole, a licence: true refraction would crush it on the rim)
          // the disc is one round leaf that rocks as a whole: the swell under the lens shifts and squashes it a little
          vec2 rock = swellS(cameraPosition.xz, uTime);
          vec2 q = vec2(dot(I, uSx), dot(I, uSy)) / (uMoonTan * 0.8) * (1.0 + vec2(rock.x, -rock.x) * 2.5) + rock * 5.0;
          vec3 sky = moonLeaf(q, 0.03) * step(0.0, dot(I, uSeen)) * 1.25;
          float lq = length(q), gdot = dot(I, gd);
          // the leaf: slivers of cut leaf laid along the swell's crests (across the moon's bearing, the way glitter lies on
          // water), riding the swell, in two sizes that hand over to one another so a sliver holds a few pixels at any distance
          float fp = max(length(dxz), length(dyz)), lg = log2(max(fp * 3.0, 0.5)), l0 = floor(lg), lf = smoothstep(0.35, 1.0, lg - l0);
          float gl0 = 0.0, gl1 = 0.0, gold0 = 0.0, gold1 = 0.0;
          vec2 ih = I.xz / max(length(I.xz), 1e-3), mh = uSeen.xz / max(length(uSeen.xz), 1e-3);
          vec2 xs = xz + sl * 16.0, xr = vec2(dot(xs, vec2(-mh.y, mh.x)) / 2.4, dot(xs, mh));
          // where the leaf lies: the window and its ragged margin (down to some 20 degrees above level), the path toward the moon, far drifts
          float win = smoothstep(-0.62, 0.22, kfn);
          float pathM = smoothstep(0.55, 0.97, dot(ih, mh)) * (1.0 - win) * (0.55 + 0.45 * wn);
          float drift = smoothstep(0.5, 0.72, vnoise(xz * 0.0075 + vec2(7.0, uTime * 0.008)) * 0.6 + wn * 0.4);
          float mN = exp(-lq * lq / 64.0), mW = exp(-lq * lq / 480.0);          // round the disc (some 23 degrees), and its wide skirt
          // THE NET OF LIGHT: the swell's own caustic, seen on the sea's skin, brushed in silver powder: wavy strokes that
          // swell and thin, fade in and out and drift with the swell (never a closed mesh, never a ruled line). Two
          // sizes of mesh hand over with distance so a mesh stays some 8 to 12 degrees wide.
          vec2 nw = xz + sl * 22.0 + 14.0 * vec2(vnoise(xz * 0.02 + 3.1), vnoise(xz * 0.02 + 17.7));
          float nfar = smoothstep(36.0, 50.0, dist);
          float brush = 0.3 + 1.4 * vnoise(xz * 0.07 + vec2(uTime * 0.03, 5.0));
          float seg = smoothstep(0.3 + 0.1 * uClimb, 0.62 + 0.06 * uClimb, vnoise(xz * 0.045 - vec2(3.0, uTime * 0.04)));   // (on the climb the strands break up a little more: strokes that thin to dust, never one long cable)
          float md = dot(I, uSeen), pool = smoothstep(0.6, 0.95, md), lace = uClimb * mix(0.85, 1.0, smoothstep(0.3, 0.8, md));   // (lace: on the climb every seam is drawn fine, a hairline 2-4 px with a sharp core and next to no halo, toward the disc and away from it alike: lace, never ropes)
          float m0 = netM(nw, 6.5, uTime), m1 = netM(nw, 17.0, uTime), m00 = netM(nw + 3.7, 2.9, uTime), w0 = 0.042 * brush * (1.0 - 0.3 * (1.0 - smoothstep(16.0, 30.0, dist))) * (1.0 - mix(0.4, 0.62, nfar) * lace);   // (m00: a third, finer mesh for the last climb, where the roof is 15 to 30 m off)
          float a0 = max(fp * 0.77, 0.02), a1 = max(fp * 0.3, 0.02), a00 = max(fp * 1.72, 0.02), nnear = 1.0 - smoothstep(mix(16.0, 24.0, uClimb), mix(30.0, 45.0, uClimb), dist);   // (on the climb the finest mesh carries the roof out to 45 m)
          // (a0, a1, a00: one pixel in each mesh's own measure; on the climb a seam's core is held to half a pixel a side, so a strand near the lens is 2-4 px across with its soft edge, never a rope)
          float w0a = mix(w0, min(w0, 0.5 * a0), uClimb), w0b = mix(w0, min(w0, 0.5 * a1), uClimb), w0c = mix(w0, min(w0, 0.5 * a00), uClimb);
          float ln0 = (1.0 - smoothstep(w0a, w0a + a0, m0)) * min(1.0, w0a / a0 + 0.3), ln1 = (1.0 - smoothstep(w0b, w0b + a1, m1)) * min(1.0, w0b / a1 + 0.3);
          float ln00 = (1.0 - smoothstep(w0c, w0c + a00, m00)) * min(1.0, w0c / a00 + 0.3);
          float line = (mix(mix(ln0, ln1, nfar), ln00, nnear) + 0.2 * (1.0 - 0.94 * lace) * mix(mix(1.0 - smoothstep(w0, w0 + 0.22, m0), 1.0 - smoothstep(w0, w0 + 0.22, m1), nfar), 0.5 * (1.0 - smoothstep(w0, w0 + 0.14, m00)), nnear)) * (0.1 + 0.9 * seg);
          float glow = mix(mix(1.0 - smoothstep(0.0, 0.5, m0), 1.0 - smoothstep(0.0, 0.5, m1), nfar), 1.0 - smoothstep(0.0, 0.5, m00), nnear) * seg;
          // THE CLIMB (uClimb: u 0.69-0.8, the pull-up). Looking steeply up, a net is a loud lattice, so for the last
          // fifth the light on the roof is re-drawn as BRUSH STROKES: two families of wavy strokes that never cross (a slow
          // noise gives each place to one family or to neither, so there is no cell to close), each stroke broken into
          // tapered dashes of its own, never wider than 4 px. They gather into a pool round the disc and along its
          // glitter path (from overhead out through the disc), and thin to loose dim dashes, then dust, elsewhere.
          vec2 cv = xz - cameraPosition.xz, mp = vec2(-mh.y, mh.x); float camD = max(-cameraPosition.y, 4.0), alongM = dot(cv, mh);
          float acr = dot(cv, mp) / (0.2 * camD + 0.1 * max(alongM, 0.0));
          float pathIn = exp(-acr * acr) * smoothstep(-0.3 * camD, 0.5 * camD, alongM);
          float gather = max(pool, 0.6 * pathIn);
          vec2 sw2 = xz + sl * 22.0 + 2.2 * vec2(vnoise(xz * 0.05 + 3.1), vnoise(xz * 0.05 + 17.7)) + 0.4 * vec2(vnoise(xz * 0.16 - 5.0), vnoise(xz * 0.16 + 11.0));
          // both families lie ALONG the glitter path (B 20 degrees off A, so they never weave a mesh): each is the level
          // lines of one gently warped coordinate (a stroke bends, it never wriggles), 3.5 m apart; A2 is A at twice the
          // count, shown only in the pool round the disc (same direction, so it never crosses A)
          vec2 dB = vec2(0.643 * mp.x - 0.766 * mp.y, 0.766 * mp.x + 0.643 * mp.y), pB = vec2(-dB.y, dB.x);   // (B lies 50 degrees off A: two directions of sliver; each place holds one family only, so they never weave)
          // (round the disc family A swings into loose arcs about the place where the disc stands on the roof, like cut
          // leaf laid by hand round a moon; further out it straightens; one scalar field, so its strokes never cross)
          vec2 dfoot = cameraPosition.xz + uSeen.xz * (camD / max(uSeen.y, 0.2)); float rhoD = length(sw2 - dfoot);
          float arcW = 0.8 * exp(-rhoD / (1.6 * camD + 12.0));
          // (each family bends in long slow curves: its coordinate is warped by two and a half stroke spacings over some 45 m)
          float cA = mix(dot(sw2, mp), rhoD, arcW) / 3.5 + 2.6 * vnoise(sw2 * 0.022 + 1.7) + 0.3 * vnoise(sw2 * 0.07 + 9.0) + uTime * 0.035;
          float cB = dot(sw2, dB) / 3.5 + 2.4 * vnoise(sw2 * 0.019 - 7.3) + 0.3 * vnoise(sw2 * 0.06 + 31.0) - uTime * 0.03;
          float cA2 = cA * 2.0 + 0.37;
          // (the footprints are taken here, inside the roof's branch: the branch is on a uniform, so the derivative is defined)
          float fcA = max(fwidth(cA), 1e-4), fcB = max(fwidth(cB), 1e-4), fcA2 = 2.0 * fcA;
          float sel = vnoise(xz * 0.021 + vec2(11.0, uTime * 0.01)), thrS = mix(0.68, 0.43, gather), alA = dot(sw2, mh), alB = dot(sw2, pB);
          // every stroke has its own dash length (0.6 to 1.7 of the mean): long and short mixed, never one ruled measure
          float lenA = 0.3 + 0.55 * hash12(vec2(floor(cA), 3.7)), lenB = 0.26 + 0.5 * hash12(vec2(floor(cB), 8.1));
          float segA = smoothstep(thrS, thrS + 0.2, vnoise(vec2(alA * lenA + floor(cA) * 7.3, floor(cA) * 1.7)));
          float segB = smoothstep(thrS, thrS + 0.2, vnoise(vec2(alB * lenB + floor(cB) * 5.9, floor(cB) * 2.3 + 40.0)));
          float segA2 = smoothstep(thrS + 0.08, thrS + 0.28, vnoise(vec2(alA * 0.6 + floor(cA2) * 3.1, floor(cA2) * 2.9 + 80.0)));
          float wdS = 0.02 * (0.5 + brush);
          // a sliver is 1-2 px wide (0.6 to 0.9 of a pixel a side and a soft pixel), tapers to nothing toward the ends of its dash, and goes out before it is unresolved
          float hwA = clamp(wdS, 0.6 * fcA, 0.9 * fcA) * segA * segA, hwB = clamp(wdS, 0.6 * fcB, 0.9 * fcB) * segB * segB, hwA2 = clamp(wdS, 0.6 * fcA2, 0.9 * fcA2) * segA2 * segA2;
          float lnA = (1.0 - smoothstep(hwA, hwA + fcA, abs(fract(cA) - 0.5))) * segA * (1.0 - smoothstep(0.14, 0.3, fcA));
          float lnB = (1.0 - smoothstep(hwB, hwB + fcB, abs(fract(cB) - 0.5))) * segB * (1.0 - smoothstep(0.14, 0.3, fcB));
          float lnA2 = (1.0 - smoothstep(hwA2, hwA2 + fcA2, abs(fract(cA2) - 0.5))) * segA2 * (1.0 - smoothstep(0.14, 0.3, fcA2));
          float wSA = smoothstep(0.5, 0.58, sel), wSB = 1.0 - smoothstep(0.38, 0.46, sel);
          float strokes = wSA * max(lnA, 0.8 * lnA2 * smoothstep(0.4, 0.8, gather)) + wSB * lnB;
          // the roof never ends on a line: it thins away through a wide ragged margin (some 4 to 18 degrees above level)
          float farM = smoothstep(0.07, 0.31, I.y + 0.1 * (wn - 0.5) + 0.06 * (drift - 0.5));
          // (on the climb the cut leaf no longer traces the light's lines: it lies scattered, gathered only by the disc)
          float leafT = 1.0 - 0.6 * uClimb;
          float dens = clamp((0.008 + 0.04 * drift) * (1.0 - 0.5 * uClimb) + 0.5 * mN * (1.0 - 0.85 * uClimb) + mix((0.55 * line + 0.22 * glow) * (0.1 + 0.3 * win + 0.34 * mW + 0.3 * pathM), 0.05 * gather, uClimb), 0.0, 0.9) * (0.2 + 0.8 * farM);
          float tsw = dot(sl, vec2(70.0, 55.0));
          { float cs = exp2(l0), row = floor(xr.y / cs); vec2 xc = vec2(xr.x / cs + fract(row * 0.618), xr.y / cs), fid = floor(xc), ff = fract(xc); vec2 fh = hash22(fid + cs * 7.31); float fk = hash12(fid + 5.5 + cs);
            float ra = (fh.x - 0.5) * 2.6 * uClimb; vec2 fr = ff - 0.5; fr = vec2(fr.x * cos(ra) - fr.y * sin(ra), fr.x * sin(ra) + fr.y * cos(ra));   // on the climb each sliver is turned its own way (up to 75 degrees): scattered leaf, never ruled rows
            float tx = abs(fr.x) / 0.44, e = (0.22 - 0.1 * fh.y) * leafT * (1.0 - tx * tx) - abs(fr.y);
            float tw = 0.5 + 0.5 * sin(fh.x * 6.2832 + tsw * (0.6 + fh.y) + uTime * (0.5 + 0.8 * fk));
            gl0 = step(1.0 - dens, fk) * smoothstep(0.0, fp / cs + 0.02, e) * (0.1 + 0.9 * smoothstep(0.4, 0.9, tw)); gold0 = step(0.75 - 0.33 * uClimb, fract(fk * 13.0 + fh.x)); }
          { float cs = exp2(l0 + 1.0), row = floor(xr.y / cs); vec2 xc = vec2(xr.x / cs + fract(row * 0.618), xr.y / cs), fid = floor(xc), ff = fract(xc); vec2 fh = hash22(fid + cs * 7.31); float fk = hash12(fid + 5.5 + cs);
            float ra = (fh.x - 0.5) * 2.6 * uClimb; vec2 fr = ff - 0.5; fr = vec2(fr.x * cos(ra) - fr.y * sin(ra), fr.x * sin(ra) + fr.y * cos(ra));   // on the climb each sliver is turned its own way (up to 75 degrees): scattered leaf, never ruled rows
            float tx = abs(fr.x) / 0.44, e = (0.22 - 0.1 * fh.y) * leafT * (1.0 - tx * tx) - abs(fr.y);
            float tw = 0.5 + 0.5 * sin(fh.x * 6.2832 + tsw * (0.6 + fh.y) + uTime * (0.5 + 0.8 * fk));
            gl1 = step(1.0 - dens, fk) * smoothstep(0.0, fp / cs + 0.02, e) * (0.1 + 0.9 * smoothstep(0.4, 0.9, tw)); gold1 = step(0.75 - 0.33 * uClimb, fract(fk * 13.0 + fh.x)); }
          vec3 leafB = mix(uRoof, mix(uRoof, LQ_GOLD * 1.1, 0.6), uClimb);          // on the climb even the cool leaf is warmed (no grey smears)
          vec3 leafC = mix(leafB, LQ_GOLD * 1.15, gold0) * gl0 * (1.0 - lf) + mix(leafB, LQ_GOLD * 1.15, gold1) * gl1 * lf;
          // brightest in the window and on the moon's path; calm round the portal; the disc itself is left clear
          float calm = 1.0 - 0.88 * smoothstep(0.8, 0.94, gdot);
          // ... and on the climb the hush is measured in ring widths: within one ring's width of the wreath nothing on the
          // roof is brighter than a third of it, and the dark opens out again by one and a half
          float rho = min(14.6 / max(length(gv), 15.0), 0.36), tang = sqrt(max(1.0 - gdot * gdot, 0.0)) / max(gdot, 0.05);
          float nearG = (1.0 - smoothstep(1.15 * rho, 3.0 * rho, tang)) * step(0.0, gdot);
          calm = min(calm, mix(1.0, 1.0 - 0.93 * nearG, uClimb));
          vec3 roof = leafC * mix(0.4 + 0.45 * win + 1.3 * mN + 0.6 * mW + 0.55 * pathM, 0.22 + 1.3 * mN + 0.55 * pool + 0.4 * pathIn, uClimb);
          // the climb's colours: pearl (the film's own colour for the angle the lens sees the water at: green overhead,
          // teal, violet toward the margin) over leaf, running to warm gold in the disc's pool and round the ring
          vec3 pearl = mix(uRoof, lqRamp(1.25 * (1.0 - abs(I.y)) + 0.3 * (wn - 0.5)) * 1.35, mix(0.5, 0.82, uClimb * (1.0 - pool)));
          vec3 strokeC = mix(pearl, LQ_GOLD * 1.25, clamp(0.3 + 0.5 * pool + 0.55 * nearG, 0.0, 0.92));
          // THE NET OF LIGHT STAYS ON THE CLIMB (it is what makes the roof the underside of water): whole toward the margin,
          // where it lies foreshortened as ripples, and at six tenths overhead, where its seams are laid broad and soft
          // in gold (toward the disc) and pearl (away from it) with a glow in every seam: rippling cells, never a scribble
          float netKeep = mix(1.0, 0.6, smoothstep(0.42, 0.75, I.y));
          // (its colour on the climb: gold toward the disc only; on the side away from the disc it is cool pearl-silver with a
          // breath of the shell's green, at half strength: never the film's violet, which over gold reads as mauve veins)
          float goldK = clamp(0.9 * smoothstep(0.2, 0.8, md) + 0.35 * mW * smoothstep(-0.1, 0.5, md), 0.0, 0.9);
          vec3 netC = mix(uRoof, mix(mix(LQ_SILVER * 0.85, lqRamp(0.16) * 1.15, 0.3), LQ_GOLD * 1.2, goldK), uClimb);
          roof += netC * line * (1.0 + 1.0 * lace) * (0.1 + 0.32 * win + 0.7 * mW + 0.45 * pathM) * (0.5 + 0.7 * vnoise(xz * 1.3 + 9.0)) * uRoofK * (1.0 - uClimb * (1.0 - netKeep * mix(0.5, 1.0, goldK)));
          roof += netC * glow * glow * 0.09 * (0.25 + 0.5 * win + 0.6 * mW) * uRoofK * uClimb * (1.0 - 0.9 * lace);
          // the climb's strokes (slivers among the net's cells, at seven tenths now that the net carries the roof)
          roof += strokeC * strokes * (0.14 + 0.6 * gather) * (0.6 + 0.5 * vnoise(xz * 1.3 + 9.0)) * uClimb * (0.25 + 0.75 * uRoofK) * 0.7;
          // the disc is left clear; a crescent's dark side is not: the roof's light shows through it
          // (lqE: the distance from the LIT leaf in disc radii, 1 on its edge: for a crescent that is the disc less its cut)
          float lcut = length(q - vec2(-0.36, 0.14)), cutM = smoothstep(0.915, 0.96, lcut), litM = mix(1.0, cutM, uMoonKind.x);
          float lqE = 1.0 + mix(lq - 1.0, max(lq - 1.0, 0.96 - lcut), uMoonKind.x);
          roof *= smoothstep(0.95, 1.25, lqE);
          roof += mix(uRoof, mix(strokeC, LQ_GOLD * 1.1, 0.45), uClimb) * 0.5 * sprinkleK(xz, pxw * (1.0 - 0.6 * uClimb), 1.0 - uClimb) * (0.12 + 0.88 * win) * (0.35 + 0.65 * wn) * mix(0.3 + 1.6 * glow, (0.16 + 1.3 * gather) * (0.25 + 0.75 * uRoofK), uClimb);          // fine dust between the leaf (a smaller footprint passed in gives finer grains: pin-points on the climb, and no 14 m tier there)
          // the disc glows into the roof: a halo of fine dust and soft light round it (it is never a pasted circle)
          // (a crisp disc: the soft light close round it is slight, and a soft broken ring of light stands half a radius
          // off it; a crescent wears its halo round its LIT leaf, and the roof's dust shows through its dark side: never an eclipse)
          vec3 halo = uDisc * (exp(-max(lqE - 0.9, 0.0) * 0.5) * (0.07 + 0.3 * sprinkleK(xz + 3.3, pxw * 0.5, 0.0)) + 0.13 * exp(-max(lqE - 0.96, 0.0) * 2.6)
                    + 0.1 * exp(-(lq - 1.5) * (lq - 1.5) / 0.03) * (0.5 + vnoise(q * 3.0 + 7.0)) * (1.0 - uMoonKind.x)) * smoothstep(0.9, 1.02, lqE) * step(0.0, md) * (0.5 + 0.5 * uClimb);
          // THE WINDOW'S EDGE (the brief): a silver hairline about 1.5 px wide round Snell's window, wobbling with the
          // swell (kf is 0 on the rim); it lies over the leaf's ragged margin, leaves the disc clear and dims to nothing
          // where it would cross the portal
          float hair = (1.0 - smoothstep(0.5, 1.2, abs(kf) / fwk)) * (1.0 - smoothstep(0.95, 0.985, gdot)) * smoothstep(0.95, 1.25, lqE);
          col = sky + (lqDepth(roof, dist * 0.16) * farM + halo) * calm + LQ_SILVER * 0.45 * hair * calm
              + (LQ_GOLD * 0.9 * ringG + LQ_SILVER * 0.24 * rainB * calm) * inside + 0.0 * kk;
          // the lacquer closes over the sky inside the window (and behind the disc); outside it stays open for the shoal's double
          alpha = max(inside, step(lq, 1.0) * step(0.0, dot(I, uSeen)) * litM);
        }
        gl_FragColor = vec4(col, alpha);
      }`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'lacquer-sea';
  return { object: mesh, uniforms, rings };
}

// ---------------------------------------------------------------- 6b the deep ground (under water only)
// The base of the jewel box: a lacquer ground DEEP_Y below, so no frame under water is empty black. It carries the
// sea's own wave scales as one great ROSETTE centred under the shoal's axis (the scale lattice laid in log-polar
// coordinates: thirty scales to a ring, every ring larger than the last, so they hold their size on screen out to
// the horizon), wheeling slowly the way the ball wheels, standing in patches between drifts of sprinkled dust. Amber
// under clear-coat; the moon's sheen walks over it in gold as the lens moves. Its heart, where the whale comes up, is bare.
const DEEP_Y = -138;
// THE SHAFTS' FAN, laid in the world: [x, z from C at the shoal's height, half-width m, gain, fan in azimuth, fan in
// elevation (degrees off the moon's refracted light)]. Twenty, unevenly spaced, thin to broad, no two neighbours parallel:
// three by the shoal and seventeen standing all round it outside the orbit (44 to 80 m from the axis, at every bearing,
// near and far by turns), so that wherever the lens is on the dive and the orbit, and whichever way it looks, some shaft
// with its drifting dust stands in the open side of the picture, between the lens's own heading and the shoal's limb.
// Each lands some 85 m nearer the entry than it passes the shoal and lays a pool of light there (makeDeep). layShafts()
// shifts the whole fan and each shaft by a few seeded metres and degrees; a shaft far from the lens is faint (makeShafts),
// so the dive sees the near handful and the orbit the ones it passes.
const SHAFTS = [[-13, -7, 1.3, 1.0, -3, 2], [10, 20, 3.4, 0.55, 4.5, -2], [-27, 12, 1.0, 0.95, 6, -2],
  [21, -48, 1.5, 0.6, 0.8, -0.5], [49, -46, 2.8, 0.68, -0.6, 3.2], [41, -15, 2.8, 0.73, -4.1, 3], [74, -2, 1.2, 0.67, -2.6, -2.7], [42, 17, 4.2, 0.94, 3.3, -0.1], [62, 38, 2.8, 0.82, 0.3, 0.8],
  [22, 39, 1.0, 0.54, -1.3, 2.3], [15, 64, 2.8, 0.6, 4.5, 3.1], [-11, 49, 2.3, 0.92, 4.4, -0.3], [-35, 67, 1.5, 0.74, 0.8, -0.5], [-38, 35, 1.5, 0.9, -4.6, 0.4], [-74, 15, 2.3, 0.66, -3, -1.5],
  [-47, -9, 2.8, 0.54, -1.6, -1.4], [-53, -31, 1.2, 0.53, -4.3, 0.6], [-32, -39, 2.8, 0.55, -1.5, -2.2], [-21, -70, 2.8, 0.69, -5.6, 1.5], [1, -49, 1.0, 0.75, 2.6, -1.2]];
const CLIMB_SHAFTS = [[-41, -16, -255, 1.5, 1.6, 2, 1], [-22, -16, -270, 3.2, 1.1, -4, -2], [-8, -16, -246, 1.0, 1.4, 5, 2]];   // three beside the last climb, on the disc's side: a point each passes (world), half-width m, gain, fan
// the direction a shaft comes from (unit, toward the moon): the moon's refracted light, fanned by a few degrees
function shaftDir(L, az, el) {
  const a = Math.atan2(L.x, -L.z) + az * RAD, e = Math.asin(clamp(L.y, -1, 1)) + el * RAD;
  return V3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
}
// every shaft of this seed: { p: a point it passes (world), hw: half-width, gain, group (0 the fan | 1 the climb's three),
// dir: where its light comes from, land: where it meets the ground }
function layShafts(L, rng) {
  const ox = rng.range(-5, 5), oz = rng.range(-5, 5), list = [];
  for (const f of SHAFTS) list.push({ p: V3(C.x + f[0] + ox + rng.range(-3.5, 3.5), C.y, C.z + f[1] + oz + rng.range(-3.5, 3.5)), hw: f[2] * rng.range(0.85, 1.2), gain: f[3], group: 0, dir: shaftDir(L, f[4] + rng.range(-1.5, 1.5), f[5] + rng.range(-1, 1)) });
  for (const f of CLIMB_SHAFTS) list.push({ p: V3(f[0] + rng.range(-3, 3), f[1], f[2] + rng.range(-3, 3)), hw: f[3] * rng.range(0.85, 1.2), gain: f[4], group: 1, dir: shaftDir(L, f[5] + rng.range(-1.5, 1.5), f[6] + rng.range(-1, 1)) });
  for (const q of list) q.land = V3(q.p.x - q.dir.x * (q.p.y - DEEP_Y) / q.dir.y, DEEP_Y, q.p.z - q.dir.z * (q.p.y - DEEP_Y) / q.dir.y);
  return list;
}
const N_SHAFTS = SHAFTS.length + CLIMB_SHAFTS.length;
function makeDeep(style, mood, dir, shaftList) {
  const g = new THREE.PlaneGeometry(3600, 3600, 1, 1); g.rotateX(-Math.PI / 2);
  // where each shaft lands on the ground: (x, z, radius across, gain); the pool of light is drawn out along the moon's azimuth
  const L = mood.moonWater, lands = shaftList.map((q) => new THREE.Vector4(q.land.x, q.land.z, Math.max(q.hw, 2.2) * 3.4, Math.min(1, q.gain)));
  const mh = new THREE.Vector2(L.x, L.z).normalize();
  const uniforms = { uTime: { value: 0 }, uCenter: { value: V3() }, uMoonW: { value: mood.moonWater.clone() }, uAxis: { value: new THREE.Vector2(C.x, C.z) }, uDir: { value: dir }, uGnd: { value: 1 },
    uLand: { value: lands }, uMh: { value: mh }, uStretch: { value: 1 / Math.max(L.y, 0.3) }, uPool: { value: 1 }, uShaft: { value: 1 }, uShaft2: { value: 0 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      uniform vec3 uCenter; varying vec3 vW;
      void main(){ vW = vec3(uCenter.x + position.x, ${DEEP_Y.toFixed(1)}, uCenter.z + position.z); gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
    fragmentShader: style + fx.GLSL_VALUE_NOISE + ORN_GLSL + /* glsl */`
      uniform float uTime, uDir, uGnd, uStretch, uPool, uShaft, uShaft2; uniform vec3 uMoonW; uniform vec2 uAxis, uMh; uniform vec4 uLand[${N_SHAFTS}]; varying vec3 vW;
      void main(){
        vec3 toEye = cameraPosition - vW; float dist = length(toEye); vec3 V = toEye / max(dist, 1e-3);
        vec2 xz = vW.xz, dxz = dFdx(xz), dyz = dFdy(xz);
        float pxw = max(length(abs(dxz) + abs(dyz)) * 0.7, 1e-4);
        vec2 v = xz - uAxis; float r = max(length(v), 1.0), r2 = r * r;
        float th = ((abs(v.x) + abs(v.y) > 1e-3) ? atan(v.y, v.x) : 0.0) + uDir * uTime * 0.02;
        // log-polar: conformal, so the scales stay round; 30 to a ring closes the lattice exactly
        float k = 30.0 / 6.2832;
        vec2 p = vec2(th * k, log(r) * k);
        vec2 dpx = k / r2 * vec2(v.x * dxz.y - v.y * dxz.x, dot(v, dxz)), dpy = k / r2 * vec2(v.x * dyz.y - v.y * dyz.x, dot(v, dyz));
        float fc; float line = seigaiha(p, dpx, dpy, 0.03, fc);
        float pch = smoothstep(0.3, 0.5, vnoise(xz * 0.0085 + vec2(uTime * 0.005, 7.0)) * 0.65 + vnoise(xz * 0.024 - uTime * 0.007) * 0.35);
        // THE POOL: under the shoal the ground is bare lacquer out to some 70 m, with only the finest dust and the
        // brush lines that cross it, so the ball stands over a dark pool and the rosette is its border
        float heart = smoothstep(26.0, 70.0, r);
        // ... and the pool is a place on the ground, the same from every eye: calm fine dust within 25 m of the point
        // under the shoal's axis, feathered to the full scales by 56 m (uPool: while the shoal stands over it)
        float hush = (1.0 - smoothstep(25.0, 56.0, r)) * uPool;
        // the moon's sheen: the ground is level, so the glint sits where the half-vector stands upright
        vec3 hv = uMoonW + V; hv = hv / max(length(hv), 1e-3);
        float gl = smoothstep(0.86, 0.985, hv.y);
        // WHERE A SHAFT REACHES THE GROUND it lays a soft pool of light, for every shaft, all along the flight: the wave
        // scales are lit there (also inside the bare heart) with dust in them; drawn out along the moon's azimuth, rocking a
        // little, each as strong as its shaft (uShaft: the fan; uShaft2: the three beside the last climb)
        float land = 0.0;
        for (int i = 0; i < ${N_SHAFTS}; i++) {
          vec2 lv = xz - uLand[i].xy; float al = dot(lv, uMh); vec2 lp = lv + uMh * al * (1.0 / uStretch - 1.0);
          land += uLand[i].w * (i < ${SHAFTS.length} ? uShaft : uShaft2) * (1.0 - smoothstep(0.3, 1.0, length(lp) / uLand[i].z));
        }
        land = min(land, 1.0) * (0.8 + 0.2 * sin(uTime * 0.7 + xz.x * 0.05));
        float lit = min(gl + 0.85 * land + 0.22 * smoothstep(0.45, 0.8, vnoise(xz * 0.011 + vec2(uTime * 0.02, -3.0))), 1.25);
        float drift = smoothstep(0.3, 0.7, vnoise(xz * 0.013 + vec2(3.1, uTime * 0.01)));
        float fine = grain(xz, 0.7, 0.5, pxw) + grain(xz.yx + 17.3, 2.0, 0.42, pxw);
        float calm = max(heart, 0.9 * land) * (1.0 - 0.94 * hush);
        float dust = mix(0.4 * fine, sprinkle(xz, pxw), calm) * (0.1 + 0.9 * drift) * (1.0 - 0.6 * pch * calm) * (1.0 + 1.3 * land);
        line *= 1.0 - smoothstep(0.16, 0.34, fc);            // scales too fine to draw give way to the dust: never a smear
        // warm gold, as bright as the sea's own scales where the light lands (the old ground was a dim amber brown)
        vec3 tone = mix(LQ_AMBER * 2.1, LQ_GOLD, 0.5 + 0.4 * min(lit, 1.0));
        vec3 col = tone * ((0.44 + 0.78 * lit) * line * (0.25 + 0.75 * pch) * calm + (0.42 + 0.6 * lit) * dust);
        // a fine gold thread rings the bare heart
        float fr = (abs(dot(v, dxz)) + abs(dot(v, dyz))) / r + 1e-4;
        col += LQ_GOLD * 0.4 * (1.0 - smoothstep(max(0.12, 1.1 * fr), max(0.12, 1.1 * fr) + fr, abs(r - 10.0))) * clamp(0.12 / (1.1 * fr), 0.25, 1.0);
        col = lqDepth(col * uGnd, dist * 0.3) * (1.0 - smoothstep(420.0, 700.0, dist));
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = -1; mesh.name = 'deep-ground';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 6d gold shafts (under water only)
// The moon's (or sun's) light coming down through the sea. Each shaft is LIGHT, never a pane: a bundle of soft threads of
// the finest gold powder (bokashi), feathered to nothing at both edges, brightest where it hangs from the roof and
// dying away with depth (a tenth of it reaches the ground), thick and thin along its length, shimmering slowly, with
// pin-point motes sinking in it. Every shaft widens toward the ground (the thin ones most: three to four times their
// width at the roof) and no two are parallel (layShafts). One draw: a ribbon per shaft turned to the lens about its own
// axis. It fades within 16 m of the lens, and round the shoal itself, in the world (uKeep: the ball's centre, later
// the whale's stage) it is held to a fifth or less. Two groups: the fan of the dive and the orbit (uGain) and three
// beside the last climb (uGain2), right of the approach on the disc's side and never across the ring.
function makeShafts(style, mood, shaftList) {
  const P = [], N = [], UV = [], K = [], idx = [], SEG = 6;
  for (const [i, q] of shaftList.entries()) {
    const Ls = q.dir, top = V3(q.p.x + Ls.x * (-1.5 - q.p.y) / Ls.y, -1.5, q.p.z + Ls.z * (-1.5 - q.p.y) / Ls.y), len = (-1.5 - DEEP_Y) / Ls.y, base = P.length / 3;
    const thin = 1 - smoothstep(1.2, 2.6, q.hw);                         // the thin ones open widest toward the ground
    for (let j = 0; j <= SEG; j++) for (const sd of [-1, 1]) { const t = j / SEG;
      P.push(top.x - Ls.x * len * t, top.y - Ls.y * len * t, top.z - Ls.z * len * t); N.push(-Ls.x, -Ls.y, -Ls.z); UV.push(t * len, sd); K.push(q.hw * (lerp(0.7, 0.62, thin) + lerp(1.1, 1.4, thin) * t), q.gain, i * 7.31, q.group); }
    for (let j = 0; j < SEG; j++) { const a = base + j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAxis', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4)); g.setIndex(idx);
  // the shafts are as strong as the light that makes them: full under the gold sun, and under a moon or the crescent as much
  // fainter as that moon's own pool on the roof is (the roof's rule: 0.4 + 0.6 * the sun's share of the mood)
  const uniforms = { uTime: { value: 0 }, uGain: { value: 1 }, uGain2: { value: 0 }, uTint: { value: new THREE.Color(PAL[1]).lerp(mood.foilColor, 0.22).multiplyScalar(0.4 + 0.6 * mood.moonKind.z) },
    uKeep: { value: new THREE.Vector4(C.x, C.y, C.z, 24) }, uKeepK: { value: 0 } };   // uKeep: the shoal's own centre in the world and the radius of full hush round it (m); uKeepK: how far the shafts are hushed there
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aAxis; attribute vec4 aK; uniform float uTime, uGain, uGain2;
      varying vec2 vQ; varying vec3 vK, vW; varying float vDist;
      void main(){
        vec4 mv = viewMatrix * vec4(position, 1.0);
        vec3 t = mat3(viewMatrix) * aAxis, sd = cross(t, mv.xyz); sd = sd / max(length(sd), 1e-4);
        mv.xyz += sd * uv.y * aK.x;
        vQ = vec2(uv.x, uv.y * aK.x); vK = vec3(aK.x, aK.y * mix(uGain, uGain2, aK.w), aK.z); vDist = length(mv.xyz);
        vW = position + (sd * mat3(viewMatrix)) * (uv.y * aK.x);        // this point of the shaft in the world (the view's turn undone)
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: style + fx.GLSL_VALUE_NOISE + /* glsl */`
      uniform float uTime, uKeepK; uniform vec3 uTint; uniform vec4 uKeep; varying vec2 vQ; varying vec3 vK, vW; varying float vDist;
      // a mote: one fine grain per cell; pmax dims a grain thinner than its pixel, pmin takes it away before it is a blob
      float dustAt(vec2 p, float cell, float thr, float pmax, float pmin, float seed){
        vec2 id = floor(p / cell), f = fract(p / cell) - 0.5; vec2 h = hash22(id + seed);
        float r = length(f - (h - 0.5) * 0.6), sz = 0.06 + 0.05 * h.x, aa = pmax / cell;
        return step(thr, hash12(id + seed + 3.9)) * (1.0 - smoothstep(sz, sz + aa + 0.03, r)) * min(1.0, sz / max(aa, 1e-3)) * (1.0 - smoothstep(1.0, 1.9, 0.12 * cell / pmin));
      }
      void main(){
        float c = clamp(vQ.y / max(vK.x, 1e-3), -1.0, 1.0), prof = 1.0 - c * c; prof = prof * prof * (0.55 + 0.45 * prof);      // a peaked, feathered section: nothing at the edge, no rim, no flat pane (c: across the shaft, held to its own range)
        float fqx = fwidth(vQ.x), fqy = fwidth(vQ.y), pmax = max(max(fqx, fqy), 1e-4), pmin = max(min(fqx, fqy), 1e-4);
        // the light itself: a few soft threads that run the length of the shaft, wander slowly across it and come and go
        float th1 = vnoise(vec2(c * 3.4 + vK.z, vQ.x * 0.03 - uTime * 0.05)), th2 = vnoise(vec2(c * 8.0 - vK.z, vQ.x * 0.075 + uTime * 0.035));
        float threads = 0.25 + 1.5 * th1 * (0.45 + 0.55 * th2);
        vec2 p = vec2(vQ.x + uTime * 0.5, vQ.y + 0.25 * sin(vQ.x * 0.4 + uTime * 0.6 + vK.z));     // the motes sink slowly and drift a little
        float d = dustAt(p, 0.22, 0.55, pmax, pmin, vK.z) + 0.6 * dustAt(p + 9.1, 0.5, 0.5, pmax, pmin, vK.z + 1.7) + 0.25 * dustAt(p + 31.7, 1.0, 0.55, pmax, pmin, vK.z + 4.3);
        // SEEN ALONG ITS OWN LENGTH (any shaft, anywhere on the flight: by the angle of the sight line to its axis, whose
        // sine is pmin / pmax: from 56 degrees off the axis, in full within 30; the last climb looks up three of them)
        // a mote would smear into a cobble and the veil would stand as a pane between two straight sides. There the
        // motes go, at most a third of the veil is kept, and what is kept is a loose sheaf of threads: it falls away
        // from the axis over the whole half-width, and the threads' own pattern cuts its outline (toward the sides only
        // the strongest threads are left, each ending where it thins), so no side is a line
        float along = smoothstep(1.2, 2.0, pmax / pmin), e = 1.0 - abs(c);
        float sheaf = smoothstep(0.0, 1.0, e) * smoothstep(0.0, 0.3, th1 * (0.45 + 0.55 * th2) - mix(0.5, 0.1, e));
        d *= 1.0 - along;
        float veil = threads * (1.0 - along * (1.0 - 0.333 * sheaf));
        // thick and thin along its length (it is never one even bar), a slow shimmer, and it dies away with depth
        float band = 0.35 + 0.65 * smoothstep(0.2, 0.75, vnoise(vec2(vQ.x * 0.034 - uTime * 0.045, vK.z * 1.7))) + 0.12 * sin(uTime * 0.55 + vK.z * 2.0 + vQ.x * 0.05);
        float fall = 2.1 * exp(-vQ.x / 75.0) + 0.08;
        float ends = smoothstep(0.0, 9.0, vQ.x);
        vec3 col = uTint * (0.26 * veil + 0.6 * d) * prof * band * fall * ends * vK.y;
        col *= smoothstep(5.0, 16.0, vDist) * (1.0 - 0.72 * smoothstep(58.0, 112.0, vDist));     // nothing beside the lens; faint far off (the fan is twenty: only the near handful stand as shafts)
        // hushed round the shoal itself, in the world: by how far this point of the shaft is from the shoal's own centre
        // (full within uKeep.w m of it, none beyond twice that), the same from every side
        col *= 1.0 - uKeepK * (1.0 - smoothstep(uKeep.w, 2.0 * uKeep.w, distance(vW, uKeep.xyz)));
        gl_FragColor = vec4(lqDepth(col, vDist * 0.45), 1.0);
      }`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 6; mesh.name = 'gold-shafts';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 6c shed scales: bursts of shell flecks (keyed to u)
// list: [seconds, centre (world), count, speed m/s, lift, [least, most] half-width in metres]. Each fleck is a cut scale
// that tumbles (it turns on the ambient clock, so it flashes once per turn by the film law, never on a timer), is
// thrown out, slows as if caught in wet lacquer and sinks. The whale's roll under the throat, its bite, and each
// sailfish slash shed one. EVERY BURST HAS ITS OWN FLECK SIZE (aSz): a slash beside the lens sheds 2-5 cm scales, the
// whale's bursts, seen from 20-30 m, hand-sized ones. No fleck is ever drawn wider than 14 px (smaller than a chip at
// arm's length), and a fleck within 2.5 m of the lens fades out: nothing flat and featureless ever fills the frame.
function makeFlecks(style, mood, rng, list) {
  const E = [], Vv = [], Sz = [], d = V3();
  for (const [sec, c, count, speed, lift, size] of list) for (let i = 0; i < count; i++) {
    d.set(rng.gauss(), rng.gauss() * 0.7 + lift, rng.gauss()).normalize().multiplyScalar(speed * (0.25 + 0.75 * rng()) * (rng.chance(0.2) ? 1.6 : 1));
    E.push(c.x + rng.gauss() * 0.8, c.y + rng.gauss() * 0.8, c.z + rng.gauss() * 0.8, sec + 0.25 * rng() * rng());
    const sd = rng(); Vv.push(d.x, d.y, d.z, sd);
    Sz.push(lerp(size[0], size[1], (sd * 13.7) % 1));
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aE', new THREE.InstancedBufferAttribute(new Float32Array(E), 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(Vv), 4));
  g.setAttribute('aSz', new THREE.InstancedBufferAttribute(new Float32Array(Sz), 1));
  g.instanceCount = E.length / 4;
  const uniforms = { uU: { value: 0 }, uTime: { value: 0 }, uPx: { value: 0.003 }, uMoon: { value: mood.moonWater.clone() } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aE, aV; attribute float aSz; uniform float uU, uTime, uPx; varying vec2 vC; varying vec3 vN, vW; varying float vPh, vDim;
      void main(){
        float sd = aV.w, tau = uU * ${DUR}.0 - aE.w, t = max(tau, 0.0);
        vec3 P = aE.xyz + aV.xyz * (1.0 - exp(-t * 1.7)) / 1.7 + vec3(0.0, -0.4 * t, 0.0);
        P.xz += 0.35 * vec2(sin(t * 1.3 + sd * 40.0), cos(t * 1.1 + sd * 70.0)) * smoothstep(0.3, 2.5, t);
        float alive = smoothstep(0.0, 0.15, tau) * (1.0 - smoothstep(6.5, 10.5, tau));
        // a tumbling leaf: its face turns about an axis of its own
        vec3 ax = normalize(vec3(sin(sd * 91.0), 0.4 * cos(sd * 57.0), cos(sd * 91.0)));
        vec3 e1 = normalize(cross(ax, vec3(0.0, 1.0, 0.0))), e2 = cross(ax, e1);
        float ang = sd * 44.0 + (1.6 + 3.2 * fract(sd * 7.3)) * uTime;
        vec3 N = e1 * cos(ang) + e2 * sin(ang), Wd = cross(N, ax);
        // its own size, never under 1.4 px (a fleck thinner than that dims instead) and never over 7 px half-width;
        // beside the lens it fades out
        float dc = distance(P, cameraPosition), lo = 1.4 * uPx * dc;
        alive *= smoothstep(1.2, 2.5, dc);
        float sz = min(max(aSz, lo), 7.0 * uPx * dc) * alive;
        vec3 w = P + (ax * position.x * 1.5 + Wd * position.y) * sz;
        vC = position.xy; vN = N; vW = w; vPh = sd; vDim = clamp(aSz / max(lo, 1e-5), 0.45, 1.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: style + /* glsl */`
      uniform vec3 uMoon; varying vec2 vC; varying vec3 vN, vW; varying float vPh, vDim;
      void main(){
        float e = 1.0 - dot(vC, vC); if (e < 0.0) discard;
        vec3 toEye = cameraPosition - vW; float dist = length(toEye), lit;
        vec3 col = lqShell(normalize(vN), toEye / max(dist, 1e-3), uMoon, vPh, lit) * 1.35 + LQ_SILVER * 0.3 * (1.0 - smoothstep(0.0, 0.3, e));
        gl_FragColor = vec4(lqDepth(col * vDim, dist * 0.6), 1.0);
      }`,
  }));
  mesh.frustumCulled = false; mesh.name = 'shed-scales';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 7 the sky (above water only): leaf moon and gold-dust Milky Way
function makeSky(style, mood, rng, detail) {
  const group = new THREE.Group(); group.name = 'sky';
  const moonU = { uDir: { value: mood.moonAir.clone() }, uMx: { value: mood.moonX.clone() }, uMy: { value: mood.moonY.clone() }, uSize: { value: 1500 * Math.tan(mood.moonRadius) },
    uDisc: { value: mood.discColor.clone() }, uMoonKind: { value: mood.moonKind.clone() } };
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: moonU, fog: false, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`uniform vec3 uDir, uMx, uMy; uniform float uSize; varying vec2 vQ;
      void main(){ vQ = position.xy; vec3 w = cameraPosition + uDir * 1500.0 + (uMx * position.x + uMy * position.y) * uSize; gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0); }`,
    fragmentShader: style + fx.GLSL_VALUE_NOISE + MOON_GLSL + /* glsl */`varying vec2 vQ;
      void main(){ float aa = max(fwidth(vQ.x), 1e-4); vec3 c = moonLeaf(vQ, aa); if (c.r + c.g + c.b < 0.002) discard; gl_FragColor = vec4(c * 1.3, 1.0); }`,
  }));
  moon.frustumCulled = false; moon.renderOrder = -2; group.add(moon);
  // (the sky is lacquer black down to a hard horizon: no gradient, no glow, as the design has it; the only warmth low down
  // is the pool of the disc's light lying on the water, in makeSurface)
  // nashiji: gold dust in a band rising behind-left over the zenith and falling ahead-left, clear of the moon
  const nStar = Math.round(mood.stars * detail), n = nStar + Math.round((mood.haze || 0) * detail);
  let dust = null; const dustU = { uPx: { value: 0.003 }, uGain: { value: mood.starGain } };
  if (n > 0) {
    const dir = new Float32Array(n * 4), a = V3(), ax = V3(0.82, 0.4, -0.375).normalize(), u0 = V3(0, 1, 0).addScaledVector(ax, -ax.y).normalize(), v0 = V3().crossVectors(ax, u0);
    // kasumi (the gold-sun mood, which has no stars): seven long mist bands of sprinkled gold lying level, low over the sea
    const bands = []; if (n > nStar) for (let b = 0; b < 7; b++) bands.push([rng.range(-2.6, 2.6), (3 + 3.2 * b + rng.range(-1, 1)) * RAD, rng.range(0.5, 1.0), rng.range(0.007, 0.016), rng() * TAU]);
    for (let i = nStar; i < n; i++) {
      const bd = bands[i % 7], az = bd[0] + bd[2] * rng.gauss() * 0.5, el = Math.max(0.02, bd[1] + bd[3] * rng.gauss() + 0.012 * Math.sin((az - bd[0]) * 5 + bd[4]));
      a.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
      if (a.dot(mood.moonAir) > 0.988) a.y += 0.14, a.normalize();
      dir[i * 4] = a.x; dir[i * 4 + 1] = a.y; dir[i * 4 + 2] = a.z; dir[i * 4 + 3] = rng() * rng();
    }
    for (let i = 0; i < nStar; i++) {
      const t = rng.range(-1.9, 1.6), w = rng.gauss() * 0.17 * (1 + 0.5 * Math.abs(rng.gauss()));
      a.copy(u0).multiplyScalar(Math.cos(t)).addScaledVector(v0, Math.sin(t)).multiplyScalar(Math.cos(w)).addScaledVector(ax, Math.sin(w)).normalize();
      if (a.y < 0.03 || a.dot(mood.moonAir) > 0.93) { a.set(-0.5 + 0.2 * rng(), 0.5 + 0.4 * rng(), -0.6 * rng()).normalize(); }
      dir[i * 4] = a.x; dir[i * 4 + 1] = a.y; dir[i * 4 + 2] = a.z; dir[i * 4 + 3] = rng() * rng();
    }
    const ig = new THREE.InstancedBufferGeometry(); ig.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); ig.setIndex([0, 1, 2, 0, 2, 3]);
    ig.setAttribute('aDir', new THREE.InstancedBufferAttribute(dir, 4)); ig.instanceCount = n;
    dust = new THREE.Mesh(ig, new THREE.ShaderMaterial({
      uniforms: dustU, fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`attribute vec4 aDir; uniform float uPx; varying vec2 vC; varying float vB;
        void main(){ vC = position.xy; vB = aDir.w; vec4 mv = viewMatrix * vec4(cameraPosition + aDir.xyz * 1400.0, 1.0);
          mv.xy += position.xy * (1.1 + 1.7 * aDir.w) * uPx * (-mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: style + /* glsl */`uniform float uGain; varying vec2 vC; varying float vB;
        void main(){ float r = length(vC), a = (1.0 - smoothstep(0.25, 1.0, r)); gl_FragColor = vec4(mix(LQ_AMBER * 1.6, LQ_GOLD, 0.35 + 0.65 * vB) * a * a * (0.35 + 0.95 * vB) * uGain, 1.0); }`,
    }));
    dust.frustumCulled = false; dust.renderOrder = -3; group.add(dust);
  }
  return { object: group, moonU, dustU };
}

// ---------------------------------------------------------------- 8 gannets (or shearwaters): one instanced draw, mirrored doubles included
// aA = wheel (radius, height, phase, angular speed); aB = plunge (entry x, entry z, entry seconds, kind 0 wheel | 1 plunge | 2 escort)
// aC = (mirrored, size, seed, dive length)
function makeGannets(style, mood, rng, density, rare, dive, greet) {   // greet: the greeters' own stream
  const base = gannetGeometry(mood.cast === 1);
  const list = [];
  const nW = Math.round(40 * density);
  for (let i = 0; i < nW; i++) {
    const r = i < 5 ? rng.range(48, 62) : rng.range(12, 46), dirn = rng.chance(0.82) ? 1 : -1;
    list.push([r, rng.range(11, 30) - (i < 5 ? 4 : 0), rng() * TAU, dirn * rng.range(9, 12.5) / r, 0, 0, 0, 0, rng.range(0.92, 1.12), rng(), 0]);
  }
  for (const pl of PLUNGES) list.push([rng.range(14, 30), rng.range(16, 26), rng() * TAU, rng.range(0.3, 0.5), pl[1], pl[2], pl[0], pl[3], 1.05, rng(), pl[3] === 2 ? (mood.cast === 1 ? 52 : 30) : rng.range(9, 13)]);
  // THE GREETERS: three of the plungers do not come off the wheel: they glide ahead of the lens from the entry on, wings
  // spread (large at the arrival, light on dark over the moon), are slowly overhauled, then climb and plunge with the
  // rest. Their seats at 0 s are dealt from the greeters' own stream (greet) in a band of the world by the entry
  // (GREET_BAND): beyond the entry point along the route's first heading (the origin, heading -z), either side of it
  // and above the swell; each glides on along that heading at its own speed. They are three of the plungers'
  // instances: the wheel seats those three were dealt with the rest of the plungers are not used.
  // aA = (-speed m/s, height, x, z at 0 s); a negative aA.x marks them.
  for (const k of GREET) { const e = list[nW + k], gb = GREET_BAND;
    e[3] = -greet.range(gb.ahead[0], gb.ahead[1]); e[2] = greet.range(-gb.side, gb.side); e[1] = greet.range(gb.up[0], gb.up[1]); e[0] = -greet.range(gb.speed[0], gb.speed[1]); e[8] = 1.5; }
  const nReal = list.length;
  if (rare) for (let i = 0; i < 200; i++) { const a = rng() * TAU, r = 22 * Math.sqrt(rng());
    list.push([rng.range(14, 40), rng.range(16, 30), rng() * TAU, rng.range(0.25, 0.5), RARE_C.x + r * Math.cos(a), RARE_C.z + r * Math.sin(a), rng.range(23.9, 25.4), 1, 1.1, rng(), rng.range(34, 44)]); }
  const n = list.length + nReal, A = new Float32Array(n * 4), B = new Float32Array(n * 4), Cc = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const mir = i >= list.length, e = list[mir ? i - list.length : i];
    A.set([e[0], e[1], e[2], e[3]], i * 4); B.set([e[4], e[5], e[6], e[7]], i * 4); Cc.set([mir ? 1 : 0, e[8], e[9], e[10]], i * 4);
  }
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
  for (const k of ['position', 'normal', 'uv', 'aSt', 'aW', 'aFold']) g.setAttribute(k, base.getAttribute(k));
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(Cc, 4));
  g.instanceCount = n;
  const uniforms = { uTime: { value: 0 }, uU: { value: 0 }, uAbove: { value: 1 }, uBoil: { value: BOIL.clone() }, uDive: { value: dive.clone() }, uMoon: { value: mood.moonWater.clone() } };
  const mat = reliefMaterial(style, /* glsl */`
    attribute vec4 aA, aB, aC; attribute vec3 aFold;
    uniform float uTime, uU, uAbove; uniform vec3 uBoil, uDive;
    vec3 wheelPos(float t){
      float a = aA.z + t * aA.w, r = aA.x * (1.0 + 0.16 * sin(a * 2.0 + aC.z * 9.0));
      return vec3(uBoil.x + r * cos(a), aA.y + 2.0 * sin(a * 1.3 + aC.z * 20.0), uBoil.z + 10.0 + r * 0.85 * sin(a));
    }
    vec3 plungePos(float tau){
      vec3 E = vec3(aB.x, 0.0, aB.y);
      vec3 D = aB.w > 1.5 ? uDive : normalize(vec3(-0.12 * sign(aB.x), -1.0, -0.36));
      if (tau < 0.0) { float s = clamp(-tau / 1.5, 0.0, 1.0); vec3 S = E - D * 27.0 * (0.5 * s * s + 0.5 * s); S.z += 9.0 * s * s; return S; }
      float dmax = max(aC.w, 1.0), v0 = aB.w > 1.5 ? 19.0 : 17.0;
      vec3 P = E + D * dmax * (1.0 - exp(-tau * v0 / dmax));
      float upk = smoothstep(1.3, 3.4, tau);
      P.y += upk * upk * (dmax * 0.8 + 2.0); P.xz += D.xz * upk * 12.0 + vec2(sign(aB.x + 0.01) * 6.0 * upk, 0.0);
      return P;
    }
    vec3 glidePos(float t, float tau){
      return vec3(aA.z + 0.5 * sin(t * 0.7 + aC.z * 20.0), aA.y + 0.5 * sin(t * 0.9 + aC.z * 31.0), aA.w + aA.x * (aB.z + tau));
    }
    vec3 birdPos(float t, float tau){
      vec3 w = aA.x < 0.0 ? glidePos(t, tau) : wheelPos(t);
      if (aB.w < 0.5) return w;
      return mix(w, plungePos(tau), smoothstep(-3.2, -1.5, tau));
    }
    void place(inout vec3 p, inout vec3 n, out float dim){
      float tau = uU * ${DUR}.0 - aB.z, plunger = step(0.5, aB.w);
      vec3 P = birdPos(uTime, tau), f = birdPos(uTime + 0.08, tau + 0.08) - P;
      f = f / max(length(f), 1e-4);
      vec3 ref = abs(f.y) > 0.97 ? vec3(0.0, 0.0, -1.0) : vec3(0.0, 1.0, 0.0);
      vec3 r = normalize(cross(f, ref)), u = cross(r, f);
      float fold = plunger * smoothstep(-1.55, -1.0, tau) * (1.0 - smoothstep(1.5, 2.6, tau));
      float bank = clamp(aA.w * 1.6, -0.5, 0.5) * (1.0 - plunger * smoothstep(-3.2, -1.5, tau)) * step(0.0, aA.x);
      vec3 r2 = r * cos(bank) + u * sin(bank); u = u * cos(bank) - r * sin(bank); r = r2;
      float as = abs(aW.x), glide = smoothstep(-0.2, 0.5, sin(uTime * 0.45 + aC.z * 31.0));
      float ang = (0.12 + 0.55 * (1.0 - 0.75 * glide) * sin(uTime * 6.5 + aC.z * 50.0 - as * 1.2)) * as;
      vec3 q = p; q.y += as * 1.1 * sin(ang); q.x *= mix(1.0, cos(ang), step(0.001, as));
      q = mix(q, aFold, fold);
      float size = aC.y * 1.4;
      vec3 w = P + (r * q.x + u * q.y + f * q.z) * size;
      vec3 nn = normalize(r * n.x + u * n.y + f * n.z);
      dim = 1.0 - plunger * smoothstep(3.0, 3.5, tau);
      if (aC.x > 0.5) { w.y = -w.y; nn.y = -nn.y; dim *= uAbove * step(0.3, P.y) * 0.9; }
      p = w; n = nn;
    }`, uniforms);
  mat.uniforms.uSwap.value = mood.cast === 1 ? 1 : 0; mat.uniforms.uFreq.value.set(0, 9, 0);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'gannets';
  return { object: mesh, uniforms, count: n };
}
const GREET = [4, 5, 6];   // the three plungers that are the greeters (indices in PLUNGES)
const GREET_BAND = { ahead: [12, 24], side: 5, up: [9, 13], speed: [8.5, 10.5] };   // where a greeter may sit at 0 s: metres beyond the entry point along the route's first heading, metres either side of it, metres above the swell; and its speed, m/s
const RARE_C = V3(-25.6, 0, -191);   // where the rare mass plunge comes down (up and to the left of the funnel as the lens sees it at the bite, 24-26 s)

// ---------------------------------------------------------------- 9 brush lines: current ribbons, plunge threads
// uv = (s along 0..1, side -1..1); aK = (mode 0 time | 1 keyed to u, phase or entry seconds, period s or rate, width m)
async function makeRibbons(style, rng, path, density, rare, dive, pause) {   // pause(): the build's yield (this rng is the lines' own stream, so yields here reorder nothing)
  const P = [], T = [], UV = [], K = [], idx = [];
  const add = (pts, k) => {
    const n = pts.length, base = P.length / 3, t = V3();
    for (let i = 0; i < n; i++) {
      t.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      for (const sd of [-1, 1]) { P.push(pts[i].x, pts[i].y, pts[i].z); T.push(t.x, t.y, t.z); UV.push(i / (n - 1), sd); K.push(k[0], k[1], k[2], k[3]); }
      if (i < n - 1) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  };
  // current lines: long arcs round the shoal and under the dive, mostly in the lower frame
  const nCur = Math.round(24 * clamp(density, 0.8, 1.2));
  for (let i = 0; i < nCur; i++) {
    const near = i % 3 === 0, a0 = rng() * TAU, span = rng.range(1.9, 3.6) * (rng.chance(0.5) ? 1 : -1), r0 = near ? rng.range(14, 30) : rng.range(42, 86);
    const y0 = near ? rng.range(-50, -32) : rng.range(-42, 4), dy = rng.range(-10, 10), dr = rng.range(-10, 14), wob = rng.range(1.5, 5), wf = rng.range(2, 5), ph = rng() * TAU;
    let drop = 0;
    for (let tries = 0; tries < 4; tries++) {
      let minD = 1e9;
      for (let j = 0; j <= 20; j++) { const s = j / 20, a = a0 + span * s, r = r0 + dr * s; minD = Math.min(minD, path.distanceTo(C.x - r * Math.cos(a), C.y + y0 + dy * s - drop, C.z - r * Math.sin(a))); }
      if (minD > 10) break; drop += 9;
    }
    const pts = [];
    for (let j = 0; j <= 150; j++) { const s = j / 150, a = a0 + span * s, r = r0 + dr * s + wob * Math.sin(s * wf * 3 + ph);
      pts.push(V3(C.x - r * Math.cos(a), C.y + y0 + dy * s - drop + wob * 0.6 * Math.sin(s * wf * 2.1 + ph * 2), C.z - r * Math.sin(a))); }
    add(pts, [near ? 0.3 : 0, rng(), rng.range(9, 15), rng.range(0.14, 0.24) * (near ? 1.4 : 1)]);   // aK.x under 0.5: time mode, and extra gain (1 + 3x)
    await pause();
  }
  await pause();
  // plunge threads: the gold dust each bird trails under water (the bird's own line, drawn to its dive length)
  const thread = (x, z, sec, kind, len, segs, bright) => {   // bright: the rare mass plunge's threads, as bright at their heads as the current lines
    const D = kind === 2 ? dive : V3(-0.12 * Math.sign(x), -1, -0.36).normalize(), pts = [];
    for (let j = 0; j <= segs; j++) pts.push(V3(x, 0, z).addScaledVector(D, len * j / segs));
    add(pts, [bright ? 1.5 : 1, sec, (kind === 2 ? 19 : 17) / len, bright ? 0.14 : 0.1]);
  };
  for (const pl of PLUNGES) thread(pl[1], pl[2], pl[0], pl[3], pl[3] === 2 ? 30 : 11, 22);
  if (rare) { const rr = rng.fork('rare-threads'); for (let i = 0; i < 56; i++) { const a = rr() * TAU, r = 27 * Math.sqrt(rr()); thread(RARE_C.x + r * Math.cos(a), RARE_C.z + r * Math.sin(a), rr.range(23.9, 25.4), 1, rr.range(52, 74), 14, true); } }   // a few long bright threads, well apart (two hundred short ones read as a hatched patch)
  await pause();
  // lines under the funnel's orbit, the level run and the final climb: they run with the path 7-20 m off it, below and to the left (the river
  // is on the right), so every lower third there carries two or three wet-headed strokes; never across the portal's axis
  { const r2 = rng.fork('under-lines'), p = V3(), t = V3(), sd = V3(), dn = V3();
    for (let i = 0; i < 18; i++) {
      const u0 = 0.5 + 0.39 * (i / 18) + r2.range(-0.01, 0.01), du = r2.range(0.1, 0.16), side = -r2.range(1.5, 15), drop = r2.range(6.5, 15), wob = r2.range(0.8, 2.6), wf = r2.range(3, 7), ph = r2() * TAU, pts = [];
      for (let j = 0; j <= 100; j++) { const s = j / 100, uu = Math.min(u0 + du * s, 0.9);
        path.pointAt(uu, p); path.tangentAt(uu, t); sd.set(-t.z, 0, t.x).normalize(); dn.crossVectors(t, sd).normalize(); if (dn.y > 0) dn.negate();
        const sw = side * (1 + 0.5 * s) + wob * Math.sin(s * wf + ph), dw = drop * (1 + 0.3 * s) + wob * 0.6 * Math.cos(s * wf * 0.7 + ph);
        pts.push(V3(p.x + sd.x * sw + dn.x * dw, p.y + dn.y * dw, p.z + sd.z * sw + dn.z * dw)); }
      add(pts, [0.3, r2(), r2.range(6, 9), r2.range(0.2, 0.32)]);
      await pause();
    } }
  await pause();
  // three more beside the last climb (u 0.8-0.97), 8-15 m left of and below the path, so the lower frame of the approach
  // carries brush lines; they end short of the ring and never cross the portal's axis
  { const r3 = rng.fork('climb-lines'), p = V3(), t = V3(), sd = V3(), dn = V3();
    for (let i = 0; i < 5; i++) {
      const u0 = 0.79 + 0.035 * (i % 3) + (i > 2 ? 0.015 : 0), du = 0.17 - 0.03 * (i % 3), side = i > 2 ? -(18 + 6 * (i - 3)) : -(8 + 3.2 * i), drop = 8 + 2.4 * i + r3.range(0, 2), wob = r3.range(0.7, 1.6), wf = r3.range(3, 6), ph = r3() * TAU, pts = [];
      for (let j = 0; j <= 100; j++) { const s = j / 100, uu = u0 + du * s;
        path.pointAt(uu, p); path.tangentAt(uu, t); sd.set(-t.z, 0, t.x).normalize(); dn.crossVectors(t, sd).normalize(); if (dn.y > 0) dn.negate();
        const sw = side * (1 + 0.25 * s) + wob * Math.sin(s * wf + ph), dw = drop * (1 + 0.2 * s) + wob * 0.6 * Math.cos(s * wf * 0.7 + ph);
        pts.push(V3(p.x + sd.x * sw + dn.x * dw, p.y + dn.y * dw, p.z + sd.z * sw + dn.z * dw)); }
      add(pts, [0.3, r3(), r3.range(5, 7), r3.range(0.24, 0.34)]);
      await pause();
    } }
  await pause();
  // three long strokes low over the bare pool under the shoal (44-56 m below its centre, 26 m and more under the path),
  // their heads a third of a cycle apart so two are always writing: the gold current lines of the dive's lower frame
  { const r4 = rng.fork('pool-lines');
    for (let i = 0; i < 3; i++) {
      const a0 = r4() * TAU, off = r4.range(5, 22) * (i % 2 ? 1 : -1), len = r4.range(95, 125), y = C.y - r4.range(44, 56), wob = r4.range(4, 9), wf = r4.range(2, 4), ph = r4() * TAU, pts = [];
      const dx = Math.cos(a0), dz = Math.sin(a0);
      for (let j = 0; j <= 120; j++) { const sj = j / 120, t = (sj - 0.5) * len, w = off + wob * Math.sin(sj * wf + ph);
        pts.push(V3(C.x + dx * t - dz * w, y + 2.5 * Math.sin(sj * 3 + ph), C.z + dz * t + dx * w)); }
      add(pts, [0.49, i / 3 + r4.range(-0.05, 0.05), r4.range(7.5, 9.5), r4.range(0.5, 0.7)]);
    } }
  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4)); g.setIndex(idx);
  const uniforms = { uTime: { value: 0 }, uU: { value: 0 }, uPx: { value: 0.003 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec4 aK; uniform float uTime, uU, uPx;
      varying vec2 vUv; varying vec3 vI; varying float vDist;
      void main(){
        float s = uv.x, inten = 0.0, wet = 0.0, taper = 1.0;
        if (aK.x < 0.5) {
          float h = fract(uTime / aK.z + aK.y) * 1.7, back = h - s, tail = 3.6 / aK.z * 1.7;
          inten = step(0.0, back) * exp(-max(back, 0.0) / max(tail * 0.45, 1e-3)) * (1.0 - smoothstep(tail, tail * 1.5, back));
          wet = exp(-max(back, 0.0) * 60.0); taper = 0.35 + 0.65 * exp(-max(back, 0.0) * 8.0);
          inten *= smoothstep(0.0, 0.04, s) * (1.0 - smoothstep(0.96, 1.0, s));
        } else {
          float tau = uU * ${DUR}.0 - aK.y, h = 1.0 - exp(-max(tau, 0.0) * aK.z);
          float ts = -log(max(1.0 - min(s, 0.999), 1e-3)) / max(aK.z, 1e-3), age = tau - ts;
          inten = step(0.0, age) * step(s, h) * (0.3 + 0.7 * exp(-max(age, 0.0) * 0.5)) * (1.0 - smoothstep(9.0, 22.0, age));
          wet = exp(-max(age, 0.0) * 5.0); taper = 0.5 + 0.5 * wet;
        }
        vec4 mv = viewMatrix * vec4(position, 1.0);
        vec3 t = mat3(viewMatrix) * aTan, sd = cross(t, mv.xyz); sd = sd / max(length(sd), 1e-4);
        float d = length(mv.xyz), w0 = aK.w * taper, wmin = 1.15 * uPx * d, w = max(w0, wmin);
        mv.xyz += sd * uv.y * w;
        vUv = uv; vDist = d; vI = vec3(inten * clamp(w0 / max(wmin, 1e-5), 0.4, 1.0) * (1.0 + 3.0 * min(aK.x, 0.5) * step(aK.x, 0.5) + 1.2 * step(1.25, aK.x)), wet, 0.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: style + /* glsl */`
      varying vec2 vUv; varying vec3 vI; varying float vDist;
      void main(){
        float a = 1.0 - vUv.y * vUv.y; a *= a;
        vec3 col = mix(LQ_AMBER * 1.5, LQ_GOLD, 0.25 + 0.75 * vI.y) * (0.55 + 0.9 * vI.y) * vI.x * a;
        col *= smoothstep(0.6, 3.0, vDist);
        gl_FragColor = vec4(lqDepth(col, vDist * 0.6), 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.name = 'brush-lines';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 10 gold dust bursts at each entry; the boil
function makeBursts(style, rng, dive, crossing) {
  const E = [], Vv = [];
  const burst = (x, z, sec, kind, count, spread) => {
    const D = kind === 2 ? dive : V3(-0.12 * Math.sign(x), -1, -0.36).normalize();
    for (let i = 0; i < count; i++) {
      const air = rng.chance(0.4) ? 1 : 0, a = rng() * TAU, r = Math.sqrt(rng());
      E.push(x, z, sec, rng());
      if (air) Vv.push(Math.cos(a) * r * 2.6 * spread, rng.range(3, 7.5), Math.sin(a) * r * 2.6 * spread, 1);
      else { const l = rng.range(0.5, kind === 0 ? 14 : 9) * spread; Vv.push(D.x * l + Math.cos(a) * r * 1.3 * spread, D.y * l, D.z * l + Math.sin(a) * r * 1.3 * spread, 0); }
    }
  };
  for (const pl of PLUNGES) burst(pl[1], pl[2], pl[0], pl[3], 64, 1);
  burst(crossing.x, crossing.z, crossing.sec, 0, 220, 2.4);   // our own entry: black to black through a burst of gold dust
  const n = E.length / 4, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aE', new THREE.InstancedBufferAttribute(new Float32Array(E), 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(new Float32Array(Vv), 4));
  g.instanceCount = n;
  const uniforms = { uU: { value: 0 }, uPx: { value: 0.003 }, uGain: { value: 1 } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aE, aV; uniform float uU, uPx; varying vec2 vC; varying vec3 vK;
      void main(){
        float tau = uU * ${DUR}.0 - aE.z - 0.05 * aE.w, t = max(tau, 0.0);
        vec3 P = vec3(aE.x, 0.0, aE.y);
        if (aV.w > 0.5) { P += vec3(aV.x * t, aV.y * t - 4.9 * t * t, aV.z * t) * 0.9; }
        else { P += aV.xyz * (1.0 - exp(-t * 2.6)); P.y += 0.9 * (1.0 - exp(-t * 0.5)) * (0.4 + aE.w); }   // rises like a bubble, then is caught
        float alive = step(0.0, tau) * (aV.w > 0.5 ? step(0.0, P.y) : 1.0 - smoothstep(12.0, 24.0, tau));
        vec4 mv = viewMatrix * vec4(P, 1.0); float d = max(-mv.z, 0.01);
        float sz = max(0.035 + 0.05 * aE.w, 1.2 * uPx * d);
        mv.xy += position.xy * sz * alive;
        vC = position.xy; vK = vec3(tau, d, alive * clamp((0.035 + 0.05 * aE.w) / max(1.2 * uPx * d, 1e-5), 0.3, 1.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: style + /* glsl */`
      uniform float uGain; varying vec2 vC; varying vec3 vK;
      void main(){
        float r = length(vC), a = (1.0 - smoothstep(0.3, 1.0, r)) * uGain;
        vec3 col = mix(LQ_GOLD * 1.3, LQ_AMBER * 1.1, smoothstep(0.8, 5.0, vK.x)) * a * vK.z * smoothstep(0.5, 2.0, vK.y) * (0.3 + 0.7 * smoothstep(0.0, 0.5, vK.x));
        gl_FragColor = vec4(lqDepth(col, vK.y * 0.7), 1.0);
      }`,
  }));
  mesh.frustumCulled = false; mesh.renderOrder = 8; mesh.name = 'dust-bursts';
  return { object: mesh, uniforms };
}
function makeBoil(style, rng, mood) {
  const n = 200, S = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const a = rng() * TAU, r = 8.5 * Math.sqrt(rng()); S.set([BOIL.x + r * Math.cos(a), BOIL.z + r * Math.sin(a), rng(), rng()], i * 4); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4)); g.instanceCount = n;
  const uniforms = { uTime: { value: 0 }, uMoon: { value: mood.moonWater.clone() } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms, fog: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec4 aS; uniform float uTime; varying vec2 vQ; varying vec3 vN, vW; varying float vPh;
      void main(){
        float T = 0.8 + 0.9 * aS.w, cyc = uTime / T + aS.z, k = floor(cyc), t = fract(cyc);
        float act = step(0.45, fract(sin(k * 12.9898 + aS.w * 78.233) * 43758.5453));
        float hgt = (0.25 + 0.75 * aS.z) * act, y = 4.0 * hgt * t * (1.0 - t) - 0.18;
        float a = aS.w * 6.283 + k * 2.4, tip = (0.5 - t) * 2.2 * act, spin = t * 6.283 * act + aS.z * 6.283;
        vec3 fw = normalize(vec3(cos(a) * cos(tip), sin(tip), sin(a) * cos(tip)));
        vec3 sd = normalize(cross(fw, vec3(0.0, 1.0, 0.0)) + vec3(0.0, 1e-4, 0.0)), up = cross(sd, fw);
        vec3 b = sd * cos(spin) + up * sin(spin);
        vec3 w = vec3(aS.x, y, aS.y) + fw * (t - 0.5) * 0.9 * act + (fw * position.x + b * position.y * 0.42) * 0.42;
        vQ = position.xy; vN = cross(fw, b); vW = w; vPh = aS.z;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: style + /* glsl */`
      uniform vec3 uMoon; varying vec2 vQ; varying vec3 vN, vW; varying float vPh;
      void main(){
        float x = vQ.x + 0.5, e = 0.5 * sin(3.1416 * clamp(x, 0.0, 1.0)) * (0.55 + 0.45 * x) - abs(vQ.y);
        if (e < 0.0) discard;
        vec3 toEye = cameraPosition - vW; float dist = length(toEye), lit;
        vec3 col = lqShell(normalize(vN), toEye / max(dist, 1e-3), uMoon, vPh, lit) * 1.3;
        col += LQ_SILVER * 0.25 * (1.0 - smoothstep(0.0, 0.08, e));
        gl_FragColor = vec4(lqDepth(col, dist * 0.6), 1.0);
      }`,
  }));
  mesh.frustumCulled = false; mesh.name = 'boil-chips';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 11 the world
// SEEDED MOODS: four looks, each with its own sky, light direction, sea, shell and cast. The disc stands 7.5 degrees right of the
// entry heading and 6-13 degrees up (lower and nearer the axis than the brief's 12 / 14, so it shows inside the previous world's portal)
const MOODS = [
  { name: 'full moon', elev: 8.5, radius: 3.5, disc: '#DCE0E3', discGain: 1, kind: [0, 1, 0], foil: '#DCE0E3', cell: 4.6, spread: 0.5, stars: 4000, starGain: 1, rain: 0, breeze: 0, shell: 0, cast: 0 },
  { name: 'gold-leaf sun', elev: 9, radius: 4.3, disc: '#E2B13C', discGain: 1.12, kind: [0, 0, 1], foil: '#E2B13C', cell: 2.5, spread: 0.72, stars: 0, haze: 3200, starGain: 0.95, rain: 0, breeze: 1, shell: 1, cast: 1 },
  { name: 'crescent and rain', elev: 10, radius: 3.6, disc: '#DCE0E3', discGain: 1.05, kind: [1, 0.6, 0], foil: '#DCE0E3', cell: 3.4, spread: 0.6, stars: 7000, starGain: 1.25, rain: 1, breeze: 0, shell: 2, cast: 0 },
  { name: 'low moon', elev: 6, radius: 3.8, disc: '#DCE0E3', discGain: 1, kind: [0, 1, 0], foil: '#DCE0E3', cell: 5.4, spread: 0.42, stars: 4000, starGain: 0.9, rain: 0, breeze: 0, shell: 0, cast: 0 },
];
function makeMood(rng, vary) {
  let i = rng.pick([0, 0, 1, 2, 3]);
  if (vary.hour === 'golden') i = 1; else if (vary.hour === 'dawn') i = 2; else if (vary.hour === 'night' && i === 1) i = rng.pick([0, 3]);
  const m = { ...MOODS[i], index: i };
  // the shell kind is drawn on its own for every mood (half abalone, a quarter pearl oyster, a quarter black-lip), so two
  // seeds of one mood are still different pictures under water
  const sr = rng.fork('raden'); sr(); const sv = sr(); m.shell = sv < 0.5 ? 0 : sv < 0.75 ? 1 : 2;
  m.sailfish = rng.int(7, 12);
  const az = 1.5 * RAD, el = m.elev * RAD, elW = Math.acos(Math.cos(el) / 1.333);   // true refraction: 14 degrees stands at 43 under water
  m.moonAir = V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
  m.moonWater = V3(Math.sin(az) * Math.cos(elW), Math.sin(elW), -Math.cos(az) * Math.cos(elW)).normalize();
  m.moonX = V3().crossVectors(V3(0, 1, 0), m.moonAir).normalize(); m.moonY = V3().crossVectors(m.moonAir, m.moonX).normalize();
  const elS = Math.max(elW + 5 * RAD, 48 * RAD);                         // where the disc is drawn inside Snell's window
  m.azSeen = az; m.elSeen = elS;                                         // update() eases the seen disc 24 degrees to the right during the pull-up (u 0.68-0.84), so on the last climb it stands 40 degrees right of the heading, clear of the ring
  m.moonSeen = V3(Math.sin(az) * Math.cos(elS), Math.sin(elS), -Math.cos(az) * Math.cos(elS)).normalize();
  m.seenX = V3().crossVectors(V3(0, 1, 0), m.moonSeen).normalize(); m.seenY = V3().crossVectors(m.moonSeen, m.seenX).normalize();
  m.moonRadius = m.radius * RAD;
  m.discColor = new THREE.Color(m.disc).multiplyScalar(m.discGain); m.foilColor = new THREE.Color(m.foil).multiplyScalar(1.15);
  m.roofColor = new THREE.Color(i === 1 ? '#F0E8C4' : '#B9D2EC').multiplyScalar(1.25);   // the leaf of the sea's underside: cool silver-blue under a moon, pale gold-silver under the sun
  m.moonKind = V3(m.kind[0], m.kind[1], m.kind[2]);
  return m;
}

export default {
  id: 'mother-of-pearl-shoal',
  name: 'The Mother-of-Pearl Shoal',
  category: 'ocean',
  weirdness: 0.35,
  media: ['air', 'underwater'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const mood = makeMood(rng.fork('lacquer'), vary);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(PAL[0]);   // lacquer ground; no fog, no lights
    const routePts = buildRoute();
    await ctx.yield();
    const path = makePath(routePts);
    await ctx.yield();
    const choreo = makeChoreo(path);
    await ctx.yield();
    const style = lacquerGLSL(PAL, mood.shell), time = { value: 0 };
    // where and when the path goes through the surface, and its dive direction
    let uCross = 0.13; for (let i = 0; i < 200; i++) { if (path.pointAt(i / 200 * 0.3).y < 0) { uCross = i / 200 * 0.3; break; } }
    const cross = path.pointAt(uCross), dive = path.tangentAt(uCross + 0.05).normalize();

    // ---- the hero: the shoal in its three shapes, at its seat
    const a0 = V3();
    const hero = await buildHero(ctx, { palette: PAL, shell: mood.shell, density: lerp(0.8, 1.0, (density - 0.7) / 0.6), moonDir: mood.moonWater, keys: HERO_KEYS, gain: 1.5 });
    hero.object.position.copy(H0); hero.object.updateMatrixWorld(true); scene.add(hero.object);
    hero.setRiverSpline(choreo.river.map((k) => k.clone().sub(H0)));
    const mirror = hero.makeMirror(0, 0.4);
    await ctx.yield();
    // ---- FAR SHOALS: four warm ghosts that give the black its depth: AMBER SMOKE. Each is only its chips (no shell under
    // them: nothing opaque, the dark shows through), filling its shape with a denser heart and a loose stray halo, every
    // lit chip an amber-gold fleck and one in fourteen a bright gold spark, turning as the ball turns. ONE RULE places
    // them: they stand round the shoal's axis FAR_STEP degrees apart from FAR_FIRST (bearings from +x toward +z),
    // alternately 230 and 150 m off (the brief's two distances); each is as broad as it is far (scale = distance /
    // FAR_WIDE, so all four stand about as wide in the eye: the heart gathers most of a cloud's chips into its middle
    // third, so its body has to be broader than the ball's to be seen at all), and each hangs with its crown FAR_CROWN
    // metres under the surface (none breaks it; all are far above the deep ground). Each has its own shape:
    // FARS [funnel 0 ball..1 funnel, lean about x, lean about z].
    const fars = [];
    const FAR_FIRST = 70, FAR_STEP = 60, FAR_R = [230, 150], FAR_WIDE = 110, FAR_CROWN = 10;
    const FARS = [[0.0, 0.3, 0.5], [1.0, 0.5, -0.75], [0.62, -0.4, 1.25], [0.8, 0.9, 1.1]];
    for (const [i, f] of FARS.entries()) {
      const far = await buildHero({ ...ctx, rng: rng.fork('far' + i) }, { palette: PAL, shell: mood.shell, count: 3600, density: 1, chipLength: 0.16, moonDir: mood.moonWater, gain: 0.5, fray: 1.0, loose: 0.7, heart: 1, ghost: 0.95 });   // (small chips: flecks of a few pixels, a cloud the dark shows through)
      far.mid.visible = false; far.ringCore.visible = false; far.core.visible = false; far.setFunnel(f[0]);
      if (far.chips) far.chips.material.uniforms.uGain.value = 3.2;
      const ang = (FAR_FIRST + FAR_STEP * i) * RAD, rad = FAR_R[i % 2], wide = rad / FAR_WIDE;
      far.object.rotation.set(f[1], 0, f[2]); far.object.scale.setScalar(wide);
      far.object.position.set(C.x + rad * Math.cos(ang), -(20 * wide + FAR_CROWN), C.z + rad * Math.sin(ang)).sub(a0.set(0, 20 * wide, 0).applyEuler(far.object.rotation)); far.object.updateMatrixWorld(true);   // (20: the ball's radius and the height of its centre over the hero's own origin)
      scene.add(far.object); fars.push(far);
      await ctx.yield();
    }

    // ---- sea, sky
    const surface = await makeSurface(style, mood, () => ctx.yield()); scene.add(surface.object);
    await ctx.yield();
    const shaftList = layShafts(mood.moonWater, makeRng(ctx.seed + 9241));   // (its own stream: the world's other draws are untouched)
    const deep = makeDeep(style, mood, hero.uniforms.uDirs.value.x, shaftList); scene.add(deep.object);
    await ctx.yield();
    const shafts = makeShafts(style, mood, shaftList); scene.add(shafts.object);
    await ctx.yield();
    const sky = makeSky(style, mood, rng.fork('sky'), detail); scene.add(sky.object);
    await ctx.yield();

    // ---- the cast: birds, sailfish, the whale
    const gannets = makeGannets(style, mood, rng.fork('birds'), density, rare, dive, ctx.core.makeRng(ctx.core.hashSeed('greeters:' + ctx.seed))); scene.add(gannets.object);   // (the greeters' seats have a stream of their own, from the world's seed and their name: it draws nothing from any other)
    await ctx.yield();
    const nSail = mood.sailfish, sailGeo = sailfishGeometry();
    await ctx.yield();
    const sailInst = new THREE.InstancedBufferAttribute(new Float32Array(nSail * 4), 4); sailInst.setUsage(THREE.DynamicDrawUsage);
    sailGeo.setAttribute('aInst', sailInst);
    const sailU = { uTime: time, uMoon: { value: mood.moonWater.clone() } };
    const sailMat = reliefMaterial(style, /* glsl */`
      attribute vec4 aInst; uniform float uTime;
      void place(inout vec3 p, inout vec3 n, out float dim){
        p.y -= aW.y * aW.x * (1.0 - aInst.x);
        p.x += aW.x * 0.06 * aInst.x * sin(p.z * 7.0 - aInst.y * 0.6);
        p.x += aW.z * aW.z * 0.2 * sin(aInst.y + p.z * 3.2);
        p = (instanceMatrix * vec4(p, 1.0)).xyz; n = normalize(mat3(instanceMatrix) * n); dim = aInst.z;
      }`, sailU);
    sailMat.uniforms.uFreq.value.set(15, 10, 15); sailMat.uniforms.uGain.value = 1.08;
    const sailfish = new THREE.InstancedMesh(sailGeo, sailMat, nSail); sailfish.frustumCulled = false; sailfish.name = 'sailfish'; scene.add(sailfish);
    const srng = rng.fork('sailfish'), sailors = [];
    for (let i = 0; i < nSail; i++) sailors.push({ up: i % 2 === 0, y: i % 2 === 0 ? srng.range(7, 18) : srng.range(-18, -9), a0: srng() * TAU, dir: srng.chance(0.7) ? 1 : -1, speed: srng.range(5, 8), seed: srng() * 40, size: srng.range(1.45, 1.75) });
    // per seed: where the pack gathers (two in three of the circling fish keep within a quarter turn of one side) and how
    // high it rides, so the rim of the ball is peopled differently from seed to seed
    { const hub = srng() * TAU, lift = srng.range(-5, 5), arc = srng.range(0.5, 1.3);
      for (let i = 3; i < nSail; i++) { const s = sailors[i]; if (i % 3 !== 0) s.a0 = hub + srng.gauss() * arc; s.y = clamp(s.y * srng.range(0.55, 1.08) + lift, -19, 19); } }
    await ctx.yield();
    const whaleU = { uA: { value: V3() }, uB: { value: V3(0, 0, 1) }, uC: { value: V3(0, 0, 2) }, uJaw: { value: 0 }, uPleat: { value: 0 }, uStroke: { value: 0 }, uShow: { value: 1 }, uDeep: { value: new THREE.Vector2(WHALE_DEEP[0], WHALE_DEEP[1]) }, uYaw: { value: 0 }, uBig: { value: 1 }, uFluke: { value: 1.15 }, uFin: { value: 1.2 }, uMoon: { value: mood.moonWater.clone() } };
    const whaleMat = reliefMaterial(style, /* glsl */`
      uniform vec3 uA, uB, uC; uniform vec2 uDeep; uniform float uJaw, uPleat, uStroke, uShow, uYaw, uBig, uFluke, uFin;
      void place(inout vec3 p, inout vec3 n, out float dim){
        p.y += aSt.w * step(4.5, aSt.x) * (1.0 - smoothstep(0.1, 0.55, uJaw));   // the baleen hangs only in an open mouth
        // the gape bows the lower jaw out into a pouch, from nothing at the hinge (no step there) to its widest at
        // mid-jaw and in again to the chin; the rostrum stays a blade; the normals follow the bow
        float bow = 1.0 + uJaw * (0.1 * smoothstep(0.5, 4.0, p.z) + 0.6 * aW.x * smoothstep(${WHALE_HINGE[1].toFixed(2)}, 5.4, p.z) * (1.0 - 0.45 * smoothstep(6.0, 7.5, p.z)));
        p.x *= bow; n.x /= bow;
        p.y *= 1.0 + 0.3 * uJaw * smoothstep(-3.0, 2.0, p.z);
        // the throat pouch balloons, in the rest pose (before the jaw swings), so it is round about the jaw's own line
        vec2 o = vec2(p.x, p.y + 0.1); o = o / max(length(o), 1e-3);
        float pb = aW.y * uPleat; p.xy += o * pb * 1.0; p.y -= pb * 0.7;
        float ja = aW.x * uJaw * 0.9, c = cos(ja), s = sin(ja); vec2 h = vec2(${WHALE_HINGE[0].toFixed(2)}, ${WHALE_HINGE[1].toFixed(2)}), d = p.yz - h;
        p.yz = h + vec2(d.x * c - d.y * s, d.y * c + d.x * s); n.yz = vec2(n.y * c - n.z * s, n.z * c + n.y * s);
        // as on a panel, the tail is drawn turned about the body's own line (uFluke: part-way while it climbs, a little
        // more for the bite, so both flukes stand clear), and the pectorals hang well below the belly's line (uFin)
        // (and swung half a radian about the body's upright, so one fluke trails and the other leads: the pair is seen
        // three-quarter on, a broad shallow V with a near blade and a far one, never a fish's upright tail)
        float fy = 0.5 * aW.z * aW.z, fyc = cos(fy), fys = sin(fy); vec2 fq = vec2(p.x, p.z + 6.9);
        p.x = fq.x * fyc - fq.y * fys; p.z = -6.9 + fq.x * fys + fq.y * fyc; n.xz = vec2(n.x * fyc - n.z * fys, n.x * fys + n.z * fyc);
        float ta = uFluke * aW.z * aW.z, tcs = cos(ta), tsn = sin(ta);
        p.xy = vec2(p.x * tcs - p.y * tsn, p.x * tsn + p.y * tcs); n.xy = vec2(n.x * tcs - n.y * tsn, n.x * tsn + n.y * tcs);
        p.y -= aW.w * uFin; p.x *= 1.0 + 0.25 * aW.w * uFin;
        p.y += aW.z * aW.z * 0.9 * sin(uStroke) + aW.w * 0.3 * sin(uStroke * 0.5 + 1.0);
        p.xy *= uBig;                                                   // the lunge is drawn a third larger (uA, uC are sampled further apart to match)
        float z = clamp(p.z / 7.5, -1.3, 1.3);
        vec3 hf = (uC - uA) * 0.5, bend = (uA + uC) * 0.5 - uB;
        // the body never folds: its curve is held to a gentle arc (three tenths of its half-length) and it keeps its
        // whole length where the route turns under it (the same law places the mouth, in update)
        float hl = max(length(hf), 1e-3); bend *= min(1.0, 0.3 * hl / max(length(bend), 1e-3)); hf *= 7.5 * uBig / hl;
        vec3 Q = uB + hf * z + bend * z * z, T = hf + 2.0 * bend * z; T = T / max(length(T), 1e-3);
        vec3 S = cameraPosition - Q; S -= T * dot(S, T); S = S / max(length(S), 1e-3);
        vec3 D = cross(T, S);
        // uYaw turns the belly (and the open mouth) toward the lens for the lunge; 0 is the panel's side view
        float cy = cos(uYaw), sy = sin(uYaw); vec3 S2 = S * cy + D * sy; D = D * cy - S * sy; S = S2;
        p = Q + S * p.x + D * p.y; n = normalize(S * n.x + D * n.y + T * n.z);
        // it is lit by its own height: black lacquer in the deep, amber as it rises, full gold above (uDeep, world y), so
        // it comes up out of the dark head first and its tail is still dim when its head is at the throat
        dim = uShow * smoothstep(uDeep.x, uDeep.y, p.y);
      }`, whaleU);
    whaleMat.uniforms.uFreq.value.set(2.2, 4.125, 0); whaleMat.uniforms.uGain.value = 1.12; whaleMat.uniforms.uBelly.value = 1; whaleMat.uniforms.uRim.value = 1; whaleMat.uniforms.uDepthK.value = 0.45; whaleMat.uniforms.uHairW.value = 1.3; whaleMat.uniforms.uHairK.value = 0.7;   // its pleats and fin rays are fine engraving, not stripes
    await ctx.yield();
    const whale = new THREE.Mesh(await whaleGeometry(() => ctx.yield()), whaleMat); whale.frustumCulled = false; whale.name = 'whale'; scene.add(whale);
    await ctx.yield();

    // ---- ornament that behaves like the sea: brush lines, bursts, the boil, settling gold dust, shed scales
    const ribbons = await makeRibbons(style, rng.fork('lines'), path, density, rare, dive, () => ctx.yield()); scene.add(ribbons.object);
    await ctx.yield();
    const bursts = makeBursts(style, rng.fork('bursts'), dive, { x: cross.x, z: cross.z, sec: uCross * DUR }); scene.add(bursts.object);
    await ctx.yield();
    const boil = makeBoil(style, rng.fork('boil'), mood); scene.add(boil.object);
    await ctx.yield();
    // shed scales: a puff knocked from the funnel's foot as the whale turns up under it (a third of a second before the bite), the bite, one per slash
    const flecks = makeFlecks(style, mood, makeRng(ctx.seed + 4177), [
      [WHALE_SEC.bite - 0.32, V3(H0.x, H0.y + 0.5, H0.z), 320, 9, -0.2, [0.09, 0.19]], [WHALE_SEC.bite - 0.05, V3(H0.x, H0.y + 6, H0.z), 520, 15, 0.15, [0.09, 0.19]],
      ...SLASH.map((sl, k) => [sl.u * DUR + 0.12, choreo.slashPos(k, 0.12, V3()), 240, 5, -0.2, [0.012, 0.025]])]);
    scene.add(flecks.object);
    await ctx.yield();
    const dust = fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', fog: false, time, count: Math.round(2600 * detail * density), box: [40, 26, 40],
      colors: [PAL[1], PAL[2], '#8A4B12'], velocity: [0.02, -0.15, 0.01], velocityRandom: [0.05, 0.06, 0.05], size: [0.026, 0.058], intensity: 1.5 });
    scene.add(dust.object);
    await ctx.yield();
    const scales = fx.makeParticles({ rng: rng.fork('scales'), preset: 'petals', fog: false, time, count: Math.round(3400 * detail), box: [34, 26, 34],
      colors: [PAL[4], PAL[5], PAL[3]], velocity: [0.03, -0.38, 0.02], velocityRandom: [0.12, 0.14, 0.12], turbulence: [0.25, 0.1, 0.5], size: [0.05, 0.09],
      lightDir: [mood.moonWater.x, mood.moonWater.y, mood.moonWater.z] });
    scene.add(scales.object);
    await ctx.yield();
    // rain (the crescent mood): silver hairline strokes above the water
    const rain = mood.rain > 0 ? fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', fog: false, time, count: Math.round(2600 * detail), colors: [PAL[3], PAL[3], PAL[3]], intensity: 0.7 }) : null;
    if (rain) scene.add(rain.object);

    // ---- per-frame state (no allocation in update)
    const a = V3(), b = V3(), e3 = V3(), camW = V3(), cpos = V3(), tan = V3(), fx3 = V3(), fy3 = V3(), fz3 = V3(), gazeV = V3(), buf = new THREE.Vector2(), mat4 = new THREE.Matrix4(), scl = V3(), kP = V3(), kT = V3(), kL = V3(), L = path.length;
    // the river's course as the survivors ride it (the hero's own curve through its ten knots: equal time per span), for the riders
    const ride = hero.riverRide, RK = choreo.river, RN_ = RK.length;
    const riverAt = (t, out, tn) => {
      const x = clamp(t, 0, 1) * (RN_ - 1), i = Math.min(Math.floor(x), RN_ - 2), f = x - i, f2 = f * f, f3 = f2 * f;
      const q0 = RK[Math.max(i - 1, 0)], q1 = RK[i], q2 = RK[i + 1], q3 = RK[Math.min(i + 2, RN_ - 1)];
      const a1 = 2 * f3 - 3 * f2 + 1, a2 = f3 - 2 * f2 + f, a3 = 3 * f2 - 2 * f3, a4 = f3 - f2;
      const d1 = 6 * f2 - 6 * f, d2 = 3 * f2 - 4 * f + 1, d3 = 3 * f2 - 2 * f;
      tn.set(d1 * (q1.x - q2.x) + 0.5 * d2 * (q2.x - q0.x) + 0.5 * d3 * (q3.x - q1.x), d1 * (q1.y - q2.y) + 0.5 * d2 * (q2.y - q0.y) + 0.5 * d3 * (q3.y - q1.y), d1 * (q1.z - q2.z) + 0.5 * d2 * (q2.z - q0.z) + 0.5 * d3 * (q3.z - q1.z));
      return out.set(a1 * q1.x + 0.5 * a2 * (q2.x - q0.x) + a3 * q2.x + 0.5 * a4 * (q3.x - q1.x), a1 * q1.y + 0.5 * a2 * (q2.y - q0.y) + a3 * q2.y + 0.5 * a4 * (q3.y - q1.y), a1 * q1.z + 0.5 * a2 * (q2.z - q0.z) + a3 * q2.z + 0.5 * a4 * (q3.z - q1.z));
    };
    const funR = (h) => 2.5 + 9.5 * Math.pow(Math.max(h, 0), 1.7);
    const wPts = [V3(), V3(), V3(), V3(), V3(), V3()], W_RAD = [2.7, 2.2, 2.7, 2.7, 2.4, 3.0];   // the whale's body as six points (tail .. snout) and its half-breadth at each, fins and flukes included

    return {
      scene, path, duration: DUR, style: 'none', ride: 'none',
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: AH, sway: 0.8, bank: 0.8 },
      // THE ONE POI: the whole gaze is scripted in makeChoreo().gazeDir (shoal, stage, river, portal), weight 1; the
      // steady camera takes its own third of it (the engine's rule) and holds the shoal by the line of the orbit
      pois: [{ at: (t, u) => choreo.gazeAt(u, gazeV), from: -0.5, to: 1.5, weight: 1, fade: 0.01 }],
      portal: { shape: 'circle', radius: 7, color: '#F2D98A', tilt: true, revealDistance: 130, glow: 0.8 },
      // EXPOSURE, BLOOM, GRADE: no grain, no vignette, bloom low so glints stay points and chips keep colour
      post: { exposure: 1.0, bloom: { strength: 0.25, radius: 0.5, threshold: 0.9 },
        grade: { saturation: 1.0, contrast: 1.0, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
      _choreo: choreo, _mood: mood,
      update(dt, time_, camera, u) {
        const sec = u * DUR; time.value = time_;
        camW.setFromMatrixPosition(camera.matrixWorld);       // the portal camera's matrix is set directly: never read .position
        // above or below the sea: decided ONCE per frame, against the swell's height over the lens (the sea's shader takes it as a uniform)
        const above = camW.y > 0.22 * Math.sin(camW.x * 0.11 + time_ * 0.7) + 0.16 * Math.sin(camW.z * 0.17 - time_ * 0.55 + camW.x * 0.05) + 0.08 * Math.sin((camW.x + camW.z) * 0.31 + time_ * 1.1);
        ctx.renderer.getDrawingBufferSize(buf);
        const px = 2 / (camera.projectionMatrix.elements[5] * Math.max(buf.y, 1));
        // sea and sky follow the camera that is rendering
        surface.uniforms.uTime.value = time_; surface.uniforms.uRoofK.value = lerp(0.34, 1, smoothstep(0.64, 0.74, u)); surface.uniforms.uAboveK.value = above ? 1 : 0;
        // the pull-up (and any moment the gaze swings steeply up, as when it follows the whale out): the net of light gives way to brush strokes gathered round the disc
        surface.uniforms.uClimb.value = Math.max(smoothstep(0.72, 0.8, u), smoothstep(0.29, 0.53, camera.getWorldDirection(e3).y));
        surface.uniforms.uCenter.value.set(camW.x, 0, camW.z);
        // the disc inside Snell's window: at the moon's own azimuth until the whale is gone, then eased 24 degrees to the
        // right while the lens pulls up, so on the last climb it stands clear of the ring (keyed to u, not to time)
        { const azS = mood.azSeen + 24 * RAD * smoothstep(0.68, 0.84, u), ce = Math.cos(mood.elSeen), sv = surface.uniforms.uSeen.value;
          sv.set(Math.sin(azS) * ce, Math.sin(mood.elSeen), -Math.cos(azS) * ce);
          surface.uniforms.uSx.value.set(sv.z, 0, -sv.x).normalize(); surface.uniforms.uSy.value.crossVectors(sv, surface.uniforms.uSx.value); }
        deep.object.visible = !above; deep.uniforms.uTime.value = time_; deep.uniforms.uCenter.value.set(camW.x, 0, camW.z);
        deep.uniforms.uGnd.value = lerp(0.6, 1, smoothstep(0.22, 0.32, u));     // through the dive the ground is held well under the ball
        // the gold shafts: full through the dive and the orbit and while the funnel draws up, thinned while the whale is
        // lit (gold on gold: by the whale's own light), gone before the portal is in the gaze
        const wOn = choreo.whaleOn(sec);
        const shaftG = smoothstep(uCross - 0.01, uCross + 0.03, u) * (1 - 0.5 * wOn) * (1 - smoothstep(0.63, 0.69, u));
        shafts.object.visible = !above; shafts.uniforms.uTime.value = time_; shafts.uniforms.uGain.value = shaftG;
        shafts.uniforms.uGain2.value = smoothstep(0.74, 0.82, u);           // the three shafts beside the last climb (off the approach, toward the disc)
        // ... and round the shoal itself, in the world, a shaft is hushed to a fifth (the ball) or a tenth (the whale's
        // stage): by the distance of each point of the shaft from the shoal's own centre (choreo.focus), in full within
        // the shoal's radius and a few metres (15 m round the stage), not at all beyond twice that; the same from every side
        { const kb = choreo.sink(u); choreo.focus(u, kP);
          shafts.uniforms.uKeep.value.set(kP.x, kP.y, kP.z, lerp(hero.radius + 4, 15, kb));
          shafts.uniforms.uKeepK.value = lerp(0.8, 0.9, kb) * (1 - smoothstep(0.64, 0.69, u)); }
        deep.uniforms.uShaft.value = Math.min(1, shaftG * 1.4); deep.uniforms.uShaft2.value = shafts.uniforms.uGain2.value; deep.uniforms.uPool.value = 1 - smoothstep(0.63, 0.69, u);
        sky.object.visible = above; sky.dustU.uPx.value = px;
        mirror.visible = !above; hero.object.visible = camW.y < 1.5;
        for (const f of fars) { f.object.visible = !above; f.update(dt, time_, camera); }
        scales.setOpacity(above ? 0 : 1);
        for (let i = 0; i < PLUNGES.length; i++) surface.rings[i].set(PLUNGES[i][1], PLUNGES[i][2], sec - PLUNGES[i][0], 1);
        surface.rings[15].set(cross.x, cross.z, sec - uCross * DUR, 1.4);
        // the shoal: ball -> funnel -> bite -> river -> ring
        hero.setProgress(u);
        hero.setSwell(1 + 0.14 * (1 - smoothstep(0.255, 0.315, u)));        // loose and large while the lens dives to it; the hunt closes it up before the orbit
        hero.update(dt, time_, camera);
        const fun = hero.uniforms.uFunnel.value;
        // the whale's body in the world: the sailfish keep out of it (a keep-out round its six body points, the same from
        // every side; they are moved aside, never dimmed), so none lies in it or sits on its head
        const whaleOn = wOn * choreo.whaleBig(sec);                       // (by the whale's own light: they part as it comes up gold)
        if (whaleOn > 0) for (let k = 0; k < 6; k++) choreo.whalePose(sec, -1 + 0.4 * k, wPts[k]);
        // sailfish: the first three slash through the skin in front of the lens (lanes = keep-outs 0..2), the rest ring the shoal
        for (let i = 0; i < nSail; i++) {
          const s = sailors[i]; let sail, swim, dim = 1;
          if (i < 3) {
            const tau = (u - SLASH[i].u) * DUR;
            choreo.slashPos(i, tau, cpos); choreo.slashPos(i, tau + 0.06, a); fz3.subVectors(a, cpos).normalize();
            fx3.subVectors(cpos, C).normalize();
            const w = bellW(tau, -1.4, 2.5, 0.5);
            if (w > 0.01) { choreo.slashPos(i, tau - 1.25, b); hero.setKeepOut(i, cpos, b, 2.35 * w); } else hero.clearKeepOut(i);
            sail = lerp(0.25, 1, bellW(tau, -2.2, 2.0, 0.6)); swim = tau * 14 + s.seed; scl.setScalar(1.45);
            // after the hunt the three go dark where they are and come up out of the lacquer round the wreath: they circle
            // it in its own plane, outside the tube and side-on to the climbing lens, sails raised outward (never across the portal)
            if (u > 0.66) {
              dim = (1 - smoothstep(0.66, 0.7, u)) + smoothstep(0.72, 0.78, u);
              if (u > 0.71) {
                const dr = i === 1 ? -1 : 1, ang = s.a0 + i * 2.1 + dr * time_ * 0.3, R = 19.5 + 2.4 * i, ca = Math.cos(ang), sa = Math.sin(ang);
                e3.copy(RING_X).multiplyScalar(ca).addScaledVector(RING_Y, sa);                                    // radial
                cpos.copy(RC).addScaledVector(e3, R).addScaledVector(RN, 1.5 * i - 1.5);
                fz3.copy(RING_X).multiplyScalar(-sa * dr).addScaledVector(RING_Y, ca * dr);
                fx3.copy(RN); if (a.crossVectors(fz3, fx3).dot(e3) < 0) fx3.negate();
                sail = 1; swim = time_ * 8 + s.seed; scl.setScalar(2.2);
              }
            }
          } else {
            const h = clamp((s.y + 20) / 36, 0, 1), rBall = Math.sqrt(Math.max(400 - s.y * s.y, 9)) + 4.2;
            const r = lerp(rBall, funR(h) + 5.5, fun) + 9 * smoothstep(0.64, 0.8, u), ang = s.a0 + s.dir * time_ * s.speed / 22;
            cpos.set(C.x + r * Math.cos(ang), C.y + s.y + 1.2 * Math.sin(time_ * 0.4 + s.seed), C.z + r * Math.sin(ang));
            fz3.set(-Math.sin(ang) * s.dir, 0.12 * Math.cos(time_ * 0.4 + s.seed), Math.cos(ang) * s.dir).normalize();
            fx3.set(Math.cos(ang), 0, Math.sin(ang));
            const diveK = 1 - smoothstep(0.19, 0.27, u);                       // while the lens dives to the ball the pack is drawn larger, sails up: gold strokes on its rim
            sail = Math.max(0.3 + 0.7 * Math.max(0, Math.sin(time_ * 0.5 + s.seed)), fun * (1 - smoothstep(0.62, 0.7, u)), diveK); swim = time_ * 8 + s.seed; scl.setScalar(s.size * (1 + 0.75 * diveK));
          }
          // RIDERS: four of the circling fish are survivors too. Each has its place in the queue and rides the river's own
          // course on the survivors' clock (hero.riverRide), along the band's far side from the path, its keel on the
          // band's top (RIDER_LANE, RIDER_TOP: metres, in the course's own frame), sail up: it leaves its circle as
          // the river comes down to the path, runs on with the river under the pull-up and goes dark along the reach
          // up to the ring (RIDER_SHOW: shares of the course), well short of the ring, wherever the lens is
          const k = i - 3;
          if (k >= 0 && k < 4) {
            const q = clamp((hero.uniforms.uRiver.value - (RIDER_QUEUE + RIDER_GAP * k) * ride.spread) / ride.dur, 0, 1);
            if (q > 0) {
              const w = smoothstep(RIDER_SHOW[0], RIDER_SHOW[1], q), bob = 0.35 * Math.sin(time_ * 0.6 + s.seed);
              riverAt(q, kP, kT);
              kL.set(-kT.z, 0, kT.x); if (kL.lengthSq() < 1e-6) kL.set(1, 0, 0); kL.normalize();    // level right of the course (the path lies RIVER_SIDE m to its left)
              kP.addScaledVector(kL, RIDER_LANE[0] + RIDER_LANE[1] * k - RIVER_SIDE); kP.y += RIDER_TOP + bob;
              cpos.lerp(kP, w); fz3.lerp(kT.normalize(), w).normalize(); fx3.lerp(kL.negate(), w);
              sail = lerp(sail, 1, w); scl.setScalar(lerp(scl.x, 1.5, w));
              dim = 1 - smoothstep(RIDER_SHOW[2], RIDER_SHOW[3], q);
            }
          }
          // THE KEEP-OUT ROUND THE WHALE, in the world: a fish nearer to one of its six body points than that section's
          // radius (W_RAD, by the whale's size and its own light) and the fish's own half length (by the whale's light
          // too, so nothing jumps as it comes out of the dark) is put straight out from that body point to that
          // distance. The same from every side: nothing here reads the lens
          if (whaleOn > 0) for (let k = 0; k < 6; k++) {
            a.subVectors(cpos, wPts[k]); const dw = a.length(), need = W_RAD[k] * whaleOn + 1.9 * scl.x * wOn;
            if (dw < need) cpos.copy(wPts[k]).addScaledVector(dw > 1e-3 ? a.multiplyScalar(1 / dw) : a.set(0, 1, 0), need);
          }
          fx3.addScaledVector(fz3, -fx3.dot(fz3)).normalize(); fy3.crossVectors(fz3, fx3);
          mat4.makeBasis(fx3, fy3, fz3).scale(scl).setPosition(cpos); sailfish.setMatrixAt(i, mat4);
          sailInst.setXYZW(i, sail, swim, dim, 0);
        }
        sailfish.instanceMatrix.needsUpdate = true; sailInst.needsUpdate = true;
        // the lens tunnel: where the path clips the skin the shoal parts round the lens and closes behind
        const wT = 1.0 * bellW(u, 0.36, 0.5, 0.02) + 1.7 * bellW(u, 0.42, 0.487, 0.014);
        if (wT > 0.01) { path.pointAt(u, cpos); path.tangentAt(u, tan); a.copy(cpos).addScaledVector(tan, -3); b.copy(cpos).addScaledVector(tan, 9); hero.setKeepOut(3, a, b, wT); } else hero.clearKeepOut(3);
        // the whale: one gold lunge
        const show = sec > WHALE_SEC.pass - 1.6 && sec < WHALE_SEC.gone + 0.25;   // (below its course's first knot it is dark: WHALE_DEEP)
        whaleU.uShow.value = show ? 1 : 0;                                   // (its light is its own height: uDeep in place())
        if (show) {
          // the jaw: dropped over the last metres to the throat, closed as the mouth climbs past the funnel's middle (choreo.whaleJaw)
          const d = choreo.whaleD(sec), jaw = choreo.whaleJaw(sec), gape = choreo.whaleGape(sec), tb = sec - WHALE_SEC.bite;
          // a licence: the whale is drawn larger than life for the bite (choreo.whaleBig: life size at the pass, 1.3 times at the bite, 1.05 as its mouth reaches the funnel's rim)
          const big = choreo.whaleBig(sec);
          whaleU.uBig.value = big;
          choreo.whaleABC(sec, whaleU.uA.value, whaleU.uB.value, whaleU.uC.value);
          whaleU.uJaw.value = Math.max(0.03, jaw);
          whaleU.uPleat.value = gape * (1 - 0.45 * smoothstep(0.6, 1.4, tb));
          // it is drawn with its flank to the lens; for the bite it rolls its back a little toward the lens, which opens
          // the bowl of the lower jaw to it, and it is side-on again as it rises: back, flank and belly lie across it in
          // green-gold, gold and amber, and a pectoral hangs clear below
          whaleU.uYaw.value = WHALE_YAW * smoothstep(-0.7, -0.1, tb) * (1 - smoothstep(0.3, 0.7, tb));
          whaleU.uFin.value = 1.2 + 0.8 * smoothstep(0.2, 0.7, tb);         // as it rises the pectorals swing down clear of the belly's line
          whaleU.uStroke.value = d * WHALE_BEAT.k + 0.6 + time_ * 0.8;       // the flukes beat with the tail (WHALE_BEAT: by the metres travelled)
          whaleU.uFluke.value = lerp(0.75, 1.0, smoothstep(-0.7, -0.1, tb));   // the flukes are drawn turned part-way to the lens (and swung, in place()): a broad shallow V seen three-quarter on, lifting and dropping with the stroke; a little more for the bite
          choreo.whalePose(sec, 0.773, a);                                // the mouth, placed by the same law as the body in the whale's place()
          hero.setMouth(a, 4.8 * jaw * big);
          // the bite front rides at the upper jaw: the height of the snout (the body's z 1) above the throat over the
          // funnel's height, times the gape; what stands below it in the funnel has gone into the whale, whoever looks
          // (in the hero's own measure the front stands at 0.56 uEat - 0.04 of the funnel's height)
          if (gape > 0) hero.setEaten(((choreo.whalePose(sec, 1, b).y - H0.y) / FUN_H + 0.04) / 0.56 * gape);
        } else hero.setMouth(a.set(0, -1e4, 0), 0);
        // birds, lines, bursts, boil
        gannets.uniforms.uTime.value = time_; gannets.uniforms.uU.value = u; gannets.uniforms.uAbove.value = above ? 1 : 0;
        ribbons.uniforms.uTime.value = time_; ribbons.uniforms.uU.value = u; ribbons.uniforms.uPx.value = px;
        bursts.uniforms.uU.value = u; bursts.uniforms.uPx.value = px; bursts.uniforms.uGain.value = 1 - 0.34 * smoothstep(0.14, 0.17, u);   // under water the bubbles sit under the ball
        flecks.uniforms.uU.value = u; flecks.uniforms.uPx.value = px; flecks.uniforms.uTime.value = time_; flecks.object.visible = !above;
        boil.uniforms.uTime.value = time_;
        dust.update(dt, time_, camera); scales.update(dt, time_, camera);
        if (rain) { rain.setOpacity(above ? 1 : 0); rain.update(dt, time_, camera); }
      },
      dispose() {},
    };
  },
};
