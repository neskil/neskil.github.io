// THE RED CARPET - hero set piece for the world "five-colour-river" (Cano Cristales in bloom).
//
// A 45 m wide slab of black quartzite under a hand's depth of glass-clear water, furred edge to edge with
// crimson river-weed (Macarenia) that streams downstream and never stops waving; forty round potholes punched
// through it (real wells with a lip of bare black rock: deep ones blue, shallow sandy ones lit yellow to the
// bottom, each with the sun's crescent on its wall), a deep blue channel wandering through, a family of giant
// otters porpoising down that channel with two more periscoping from a pothole, a 6 m ledge fall feeding the
// slab at the upstream end, and at the downstream end the slab breaking into seven 1.7 m steps (red ribbons
// between cords of white water, spray, mist) and a last 6 m fall into a pool.
// THE STAIRCASE (zn -90..-195): seven steps of 1.7 m, each lip a wandering line of noses and notches (wz). A tread, from the lip above:
// the fall's face (hidden from upstream: what the eye is given is the lip, the white at its foot and the mist over it), then, ONLY
// under a spout (fcrSpout: where a runnel of the tread above pours over), boil, lace and a blue plunge pocket with a torn edge (gold
// mirror at a low sun); between the spouts the weed runs pressed and wine-dark through the basin, red from lip to lip, in real fronds,
// parted by a few thin runnels where threads of white water gather, thicken and pour over the next lip as spouts, and a hand of
// dark wet sill at the edge. laneJS / basinEndJS / laneThr / treadZone and GL_TREAD are the same sums on the CPU and in every
// shader, so the paint, the white water, the planted fronds and the spray agree to the centimetre. White water on the steps is
// CREAM (round 27, GL_CREAM): one soft field of gradient noise drawn out along the flow and racing with it, a soft sill instead of a
// threshold, lace where it thins, a glass tongue with a body over each lip, the lit side and the lee a tint apart. It reads the
// pixel's footprint (fwidth of the field's own coordinate) as a level of detail: nothing finer than a pixel is drawn, so no edge
// can alias into a facet at any distance.
// A FALL SEEN FROM THE BANK (the world's line goes down the staircase beside it): over the lip a tongue, glass between the cords
// and pale with air where a cord goes over and all along the last fall (no dark line along any lip); veils whose sides wander and
// fray as they fall; behind them the riser, wet black rock mossed in pads, the weed hanging over the lip in short tongues; a low
// churn all along each foot, the sheet's white run on into the boil (no line of clear water where it lands); and a riser to
// whose lip no water comes is bare bedded rock: the sheet paints no fall on it and the paving is not stood on end there.
// Each stretch of the slab's weed is one draw with a ball of its own about it: where no picture can hold it the renderer passes it over.
// THE SLAB'S FIVE COLOURS: besides the red beds the layout composes, along the flight line, a show well under the path at z 38
// (blue, lit to its sandy floor) and two beds where the same weed grows thin and rose (zones). Every other pothole is dealt by the
// seed (sandy ones lit to a yellow floor, deep ones blue, each inside a lip of bare black rock with weed to the lip). Within 23 m of the eye the painted
// weed is drawn tuft by tuft (fcrTuft) and its masks are torn per pixel. Weed stands as single fronds of three fingers (under the eye, by the
// pixel's footprint, a fan of five or seven filaments: a level of detail read from where the eye is), every one leaning
// downstream and of its own tone (iB.w = phase + 8 x tone), dims and blues with the water over it, and is seen through a surface that
// carries travelling slivers of sky (water shader: ripS) and a caustic net of wandering cells (fcrNet). Foam on the open water
// is thin soft threads drawn out along the streamlines, fainter under the eye.
// A WELL BY DAY: a pale lit rim of scoured rock, under it a wall that goes blue with depth, the sky lying in a crescent on the side
// across the hole from the eye (by the direction to the eye, as the low sun's mirror is), and in a wide one fish a forearm long.
// PLANTS TO CARPET: below the ledge the wine-dark mat between the painted tufts goes by the angle at which the bed is seen from where
// the eye is, and the tufts themselves by the pixel's footprint, so no line goes before the eye (above the ledge the tufts go at 23 m).
//
// Spray sprites: kinds 0-4 as before (droplets, mist, plume ...), kind 5 = a thin leaning wisp of dawn mist, one per well.
// At a low sun (uMirror) a well mirrors the rose sky on its far side only, inside a ring of dark wet lip, and the
// still basin below each step mirrors it in gold.
//
// LOCAL SPACE  origin = centre of the slab at bed level, +Y up. The river runs toward -Z; the camera of the
//   brief comes over the ledge at z = +90 and leaves over the brink at z = -90, so "front" (+Z) is the side it
//   arrives from. Travelling -Z, left is -X: the morning sun stands there. Water surface on the slab y = 0.22.
// SIZE   upstream shelf z 116..91 (bed y 6) | ledge fall z 90 | slab z 90..-90 | seven steps at z -90,-105 ..
//   -180 (each -1.7 m) | last fall z -195 (-6 m) | pool to z -232 (water y -17.7). River half-width 22.5 m on
//   the slab narrowing to 11.5 at the last fall; a rock-pavement skirt runs out to x = +-115 for the world's
//   terrain to meet (hero.heightAt(x,z) gives its height, anchors.bounds the box). hero.radius / height /
//   center only frame the slab for the part viewer.
// COST   ~135k triangles with the camera on the slab (bed 35k, wells 21k, water 6k, otters 6k, sprites 1k,
//   fronds <= 88k in 10 distance-culled chunks), 16 draw calls, one 160x768 RGBA mask texture, no lights,
//   ~300 ms build. ctx.quality.detail thins fronds and spray only.
// LIGHT  Everything is custom ShaderMaterial (linear HDR, scene fog via the three fog chunks) lit by uniforms:
//   uSunDir (WORLD direction toward the sun), uSun (colour x intensity / PI), uSky (ambient). On its first
//   update the piece adopts the scene's strongest DirectionalLight and first HemisphereLight unless
//   opts.sunDir is given or opts.adoptLight === false; hero.setLight({ sunDir, sunColor, skyColor }) at any
//   time. It wants the brief's light: a hard warm-white key ~55 deg up from -X. Cloud shadows are one
//   scrolling noise term in every shader here: reuse hero.shared.noiseGLSL + hero.shared.cloudShadowGLSL
//   (uniforms uCloudT = time, uCloudAmt 0..1, both in hero.uniforms) in the world's terrain and water so the
//   whole valley dims together. Water reflects only a two-colour sky (uniforms cHaze, cZen), capped at
//   uReflCap so the red carries at 1 m eye height; bloom comes only from glints, foam and backlit frond tips.
// HOW THE WATER IS FAKED (match it if the world adds more river): the bed shader looks its masks up at a
//   position offset by the surface-ripple slope x depth (hero.shared.waterGLSL: fcrRip, fcrCaus), fronds are
//   offset the same way, caustics are two crossed ridged noises advected downstream, depth mixes toward
//   palette[5]; the surface itself is a nearly invisible premultiplied sheet (fresnel sky, sparkle road
//   toward the sun, drifting foam lines, white cords on the falls, boil at their feet, lace at the shore).
//   Mask texture (hero.uniforms.uMask, rect uMaskRect): R green/shade, G weed>0.5>sand, B pothole SDF, A depth.
//
// OPTS   palette  7 hex strings in the brief's order: weed, frond tip, sand, moss, rock, deep water, haze sky
//        hour     'morning' (default) | 'golden' (sun 20 deg up on +X, wine-dark weed, glowing tips) | 'dawn'
//                 ('night' plays as dawn)             sunDir [x,y,z] / sunAzimuth override the sun
//        season   'september' (default) | 'july' (fuller water, pink + half-green weed) | 'november' (low
//                 water, maroon-purple weed, more bare rock)
//        weather  'clouds' (default, drifting shadows) | 'overcast' (no glints, saturated) | 'cloudburst'
//                 (+0.2 m water, more white water, glossy rock)
//        otters 5..9 swimmers (default 7; two periscopers are extra)    potholes (40)    fronds (7400)
//        reflection (0.24)    cloudShadows 0..1    adoptLight false
//        mirror 0..0.5 (still deep water mirrors the sky; default by hour)    wellMist 0..1 (mist curls over the potholes; 1 at dawn)
// HERO API (besides the contract)
//   hero.setProgress(u)  THE OTTER CLOCK. u = path progress.   hero.setFlight({ length, zAt })  the route, given once in build():
//       its length in metres and zAt(u), our own place on it (hero z) by progress. With a flight the file swims by THE LAW OF THE
//       FILE (makeFileLaw: one function of the metres flown, the brief's own arithmetic, the same in every camera): the rear otter
//       16 m ahead of us where the run begins (u 0.55), we gain 0.35 m a metre (their 6.5 m/s against our 10), the rear four race us
//       abreast in the blue lane 5.3 m to the right (rear otter 2 m ahead) until two seconds past u 0.64, then fall behind; the lead
//       three 14 m ahead at u 0.73, over the brink first, carried down the right-hand chute and overtaken at u 0.86.
//       hero.fileZ(g, u) = z of the middle of group 'A' (the rear four) | 'B' (the lead three). Each swimmer dives into the pots of
//       the lane as it reaches them, by its own stream. The pair periscope from anchors.periscopeWell by our distance to their well:
//       up from 24 m short of it until we are 4 m past. Nothing in the otters reads the camera's lens. No flight given (the part
//       viewer): the family free-runs down the channel on a 22 s loop (anchors.otterSchedule.z).
//   hero.placeOtter(i, position, yaw, { lie })  seat spare otter 0|1 on a rock (for the exit ledge): sitting up, or lying (lie); it keeps
//       the heading it is given.   hero.setWatch(on): the rare migration.
//   hero.makeFronds(list) -> Mesh of more weed for the world's own shallows; hero.setStack(x, z, rx, rz) piles the pool's foam against an island.
//   hero.heightAt(x,z), hero.waterLevelAt(x,z), hero.otterPositions (live local Vector3s, for POIs),
//   hero.setLight, hero.uniforms, hero.shared, hero.layout (chanX(z), wells, edgeL/R(z) ...), hero.stats.
//   hero.shared.paveGLSL = fcrPave(): the black jointed quartzite of the banks, for the world's own ground to match.
//   hero.layout.flyX(z) = the flight line (no sand patch is baked under it), layout.footT(zn) = the foam band below each fall.
//   Otters: swimmers porpoise on evenly spread phases (half of each group airborne at any instant) and trail a V wake;
//   iQ.y > 5 selects the posed spine (periscoping pair, the two sitting on the world's ledge). Every otter is 1.7 to 1.9 m long (iS).
// ANCHORS (local)
//   flyThrough   ordered camera line: 3 m over the shelf, over the ledge, the reveal 8 m above the slab,
//                sinking to 1.2 m over the water 5.3 m LEFT of the channel (otters on the right against red,
//                sun road on the left), 2.5 m over the brink, then 1.8 m above the step edges at 6.46 deg down
//                to the portal. Nothing solid stands above the water near it (rock islands rise < 0.3 m and
//                keep 4 m off the channel); weave +-4 m about it freely.
//   portalSeat   { position [0,-13.3,-225], facing (back up the cascade, tilted 6.46 deg), radius 7, poolY }:
//                the ring's lowest 2.5 m sits under the pool's foam; use portal tilt: true.
//   viewpoints   reveal, otterRun, periscope, brink, cascade: { position, lookAt }.
//   channel      [x, waterY, z] every 8 m down the deep lane and chute.      chuteX, slabWaterY, sunDir
//   periscopeWell, wells[] (x, z, bedY, waterY, radius, depth, sandy: seat fish here), ledge, brink, steps,
//   lastFall, pool, bounds, otterSchedule.
// VIEWER ONLY  opts.view = run|peri|cascade|reveal and opts.debugU reframe the piece for a part viewer; the world
//   never sets them. opts.periZ = [lo, hi] moves the periscope well along the slab.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#C4122F', '#F04E7C', '#EBC65A', '#4C8C3B', '#17161A', '#1668B0', '#8FCBEF'];

// ---- fixed plan (metres, local space; the river runs toward -Z) ----
const Z_LEDGE = 90, Z_BRINK = -90, STEP = 15, NSTEP = 7, RISE = 1.7, Z_LAST = -195, Z_END = -232, Z_TOP = 116;
const TX0 = -32, TX1 = 32, TW = 160, TH = 768;            // mask texture window (x) and size; z spans Z_END..Z_TOP
const WATER_T = 0.22;                                      // water film over the slab
const sstep = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const bump = (t) => { t = 1 - t * t; return t > 0 ? t * t : 0; };
// THE TREADS of the staircase (zn -90..-195, a lip every 15 m; b = metres below the lip above). Each tread is: the fall's face
// (b < 0.9), a plunge basin of clear water down to b = basinEnd (about 5.3 m, ragged), then red weed to the next lip, parted by
// runnels where lane() is high: a hand wide and often broken high on the tread, opening into a spout at the lip (laneThr).
// The same sums in GLSL (GL_TREAD) paint the bed and the water, and here they plant the real fronds. Plain sines only: they
// come out the same on the CPU and in any shader. (a lane meanders, swells and thins, and is broken along its length)
const FACE = 0.6, TS = 0.44, TP = 0.5;                  // a lip pours white where the lane sum is over TS (about half its width, in stretches of two to five metres); a plunge pocket lies under the stronger pours (TP)
const laneJS = (x0, z) => {
  const x = x0 + 0.45 * Math.sin(z * 0.6 + 1.7 * Math.sin(x0 * 0.35)) + 0.2 * Math.sin(z * 1.7 + x0);
  return 0.5 + 0.3 * Math.sin(x * 0.95 + z * 0.06 + 1.3 * Math.sin(z * 0.21 + x * 0.3)) + 0.2 * Math.sin(x * 2.3 - z * 0.09 + 2)
    - 0.26 * Math.max(Math.sin(z * 0.42 + 2.1 * Math.sin(x0 * 0.8) + x0 * 0.3) - 0.3, 0);
};
const basinEndJS = (x, z) => 5.3 + 0.8 * Math.sin(x * 0.7 + z * 0.13) + 0.35 * Math.sin(x * 1.9 + 1.7);
const laneThr = (sT) => 0.88 - (0.88 - TS) * sT * sT * Math.sqrt(sT);
// 0 = fall face, 1 = basin, 2 = runnel of white water, 3 = weed
const treadZone = (x, z, zn) => {
  const k = Math.floor((-90 - zn) / 15), b = -90 - 15 * k - zn, e = basinEndJS(x, z);
  if (b < 0.9) return 0; if (b < e + 0.3) return laneJS(x, z + b) > TP ? 1 : 3;      // (the plunge pocket is only under a spout: between spouts the weed runs lip to lip)
  return laneJS(x, z) > laneThr(clamp((b - e) / (15 - e), 0, 1)) - 0.04 ? 2 : 3;
};
const GL_TREAD = /* glsl */`
float fcrLane(vec2 p){ float x = p.x + .45*sin(p.y*.6 + 1.7*sin(p.x*.35)) + .2*sin(p.y*1.7 + p.x);
  return .5 + .3*sin(x*.95 + p.y*.06 + 1.3*sin(p.y*.21 + x*.3)) + .2*sin(x*2.3 - p.y*.09 + 2.) - .26*max(sin(p.y*.42 + 2.1*sin(p.x*.8) + p.x*.3) - .3, 0.); }
float fcrBasinEnd(vec2 p){ return 5.3 + .8*sin(p.x*.7 + p.y*.13) + .35*sin(p.x*1.9 + 1.7); }
float fcrLaneThr(float sT){ return .88 - ${(0.88 - TS).toFixed(2)}*sT*sT*sqrt(sT); }
float fcrEdge(vec2 p){ return vn(p*vec2(7., 2.2) + 3.) + vn(p*vec2(2.3, .9) + 17.) - 1.; }     // -1..1: tears every edge of a tread
float fcrSpout(vec2 p, float b){ return smoothstep(-.06, .1, fcrLane(vec2(p.x, p.y + b)) - ${TP.toFixed(2)}); }   // 1 where a spout pours over the lip b metres upstream
float fcrCord(vec2 p, float b){ return smoothstep(-.07, .09, fcrLane(vec2(p.x, p.y + b)) - ${TS.toFixed(2)}); }    // 1 where the lip b metres upstream runs white
`;

// (round 19) THE FALLS OF THE STAIRCASE ARE A MESH OF THEIR OWN (buildFalls, below). Its ground, in metres below a lip (b):
// from the lip to the end of the fall's foot. The foot of a step ends where live's own boil runs out (FOOT_S: the face's end,
// 0.35 + FACE, and a third of live's boil band of 6.5 m) or, under a spout, where live's own plunge pocket ends (fcrBasinEnd, torn
// by fcrEdge exactly as the bed's paint tears it); the last fall's where its boil runs out (FOOT_L: 0.35 + 1 m of face + half its
// band of 11 m). The water sheet draws nothing on that ground and the falls' glass and boil nothing off it: one sum, read by both.
// (round 22) ACROSS THE RIVER a fall is as wide as the water that comes to its lip: at each x, lip by lip, the least depth the
// mask itself shows on the tread's last metre before the lip (0.3, 0.65 and 1 m above it), kept in a table (uLip, fcrLip: a
// quarter metre of x to a texel, a row to a lip) and read by both. Where the tread carries water to the lip at x, the fall at
// that x is the falls' mesh from the lip to the end of its ground and the sheet gives all of it up; where it carries none,
// the mesh draws nothing at that x and the sheet is live's own, also in the band beside a lip that the mask marks wet (the
// level there is still the tread's above) and beside the pool. A curtain is therefore whole from lip to landing or not there:
// while it falls it is not cut by what lies under it (a dry shelf or a rock below takes the water as a ledge does); the level
// water of the run up and of the foot is where the mask is wet.
const FOOT_S = 0.35 + FACE + 6.5 / 3, FOOT_L = 0.35 + 1.0 + 11 / 2;
// (the hand-over at the lip is made over the last 0.2 m of the level tread and is done at b = 0, 0.35 m before the sheet leaves
// the level: the sheet's own lip is ruled in chords of 1 m and at the tightest nose, radius 0.85 m, such a chord strays 0.15 m
// from the true line, so both meshes are still level, one on the other, where they change hands. 0.42: the pocket's torn
// end has gone 0.12 m past fcrBasinEnd, and the two meshes' coordinates differ by up to 0.15 m either way. 0.24: the width of that
// torn end itself, over which the sheet takes the water back.)
const GL_FALLS = /* glsl */`
float fcrFallsOwn(float b, float spt, float bEnd, float eN, float big){
  float E = mix(mix(${FOOT_S.toFixed(3)}, max(bEnd - .5*eN + .42, ${FOOT_S.toFixed(3)}), smoothstep(0., .12, spt)), ${FOOT_L.toFixed(3)}, big);
  return smoothstep(-.2, 0., b)*(1. - smoothstep(E, E + .24, b)); }
uniform sampler2D uLip;
float fcrLip(float x, float k){ return smoothstep(0., .03, texture2D(uLip, vec2((x - uMaskRect.x)*uMaskRect.z, (k + .5)/${NSTEP + 1}.)).r); }
float fcrLipW(float x, float k){ return smoothstep(.02, .16, texture2D(uLip, vec2((x - uMaskRect.x)*uMaskRect.z, (k + .5)/${NSTEP + 1}.)).r); }   // (round 27) the white thins out toward the ends of a lip's water: a hand and a half of depth
`;
// (round 27) THE WHITE OF THE STAIRCASE IS CREAM. Eight strangers of eight read the old white as shards: a field of value noise
// (a square lattice, drawn out four to one) cut at a threshold a tenth of its range wide gives shapes with straight sides and
// corners, and a hard lit side and blue lee on each made them facets. The white is now one field of GRADIENT noise (gn: no
// lattice value, so no flat-sided cell), the coarse bodies counting for most (0.7 m across the flow, 5 m along it; streaks of
// a forearm, threads of a hand on them), each count on its own turned lattice. It is never cut: the share of white (S) moves a
// soft sill half the field's whole range wide through it, so a body of foam has no edge, only a rim that thins. Every count
// finer than the PIXEL'S FOOTPRINT on the water (fq = fwidth of the field's own coordinate: this reads the lens, as a level
// of detail does, and nothing else about the eye) is let go to its mean, so far off the white is an even veil and not a
// grain of pixels. fcrCreamW: the white's share at a place, 0..1, from the field's value there (P), the share asked (S).
const GL_CREAM = /* glsl */`
vec2 fcrGr(vec2 i){ float a = 6.2832*h21(i); return vec2(cos(a), sin(a)); }
float gn(vec2 p){ vec2 i = floor(p), f = p - i, u = f*f*f*(f*(f*6. - 15.) + 10.);
  return .5 + .7*mix(mix(dot(fcrGr(i), f), dot(fcrGr(i + vec2(1., 0.)), f - vec2(1., 0.)), u.x),
    mix(dot(fcrGr(i + vec2(0., 1.)), f - vec2(0., 1.)), dot(fcrGr(i + vec2(1., 1.)), f - vec2(1., 1.)), u.x), u.y); }
float fcrCream(vec2 q, vec2 fq){
  float k2 = 1. - smoothstep(.2, .6, max(fq.x*4.2, fq.y*.55)), k3 = 1. - smoothstep(.2, .6, max(fq.x*11., fq.y*1.4));
  return .5 + (gn(mat2(.878, .479, -.479, .878)*(q*vec2(1.5, .2))) - .5)*.5 + (gn(mat2(.454, .891, -.891, .454)*(q*vec2(4.2, .55)) + 7.) - .5)*.32*k2
    + (gn(mat2(-.416, .909, -.909, -.416)*(q*vec2(11., 1.4)) + 3.) - .5)*.18*k3; }
// the grain of a foam: inside the white, streaks a hand wide and a stride long, finer ones of two fingers on them, and a froth of
// bubbles a thumb across, each let go by the pixel's footprint as the field's counts are; where the streaks stand out comes and goes
float fcrGrain(vec2 q, vec2 fq){
  float k1 = 1. - smoothstep(.2, .6, max(fq.x*7., fq.y*.9)), k2 = 1. - smoothstep(.2, .6, max(fq.x*17., fq.y*2.6)), k3 = 1. - smoothstep(.2, .6, max(fq.x*31., fq.y*11.));
  float a = gn(mat2(.454, .891, -.891, .454)*(q*vec2(7., .9)) + 5.), b = gn(mat2(.878, .479, -.479, .878)*(q*vec2(17., 2.6)) + 1.), c = gn(q*vec2(31., 11.) + 8.);
  return .5 + ((a - .5)*.5*k1*(.4 + 1.2*gn(q*vec2(.9, .3) + 13.)) + (b - .5)*.3*k2 + (c - .5)*.34*k3); }
float fcrCreamD(float P, float S){ return (P - .5)*2.2 + S*2. - 1.; }                          // under 0 water, over 0 foam; soft either way
float fcrCreamW(float P, float S){ return smoothstep(-.5, .5, fcrCreamD(P, S))*smoothstep(0., .1, S); }
`;

// Everything about the river's shape lives here so that the mesh, the mask texture, the fronds, the otters
// and the anchors all agree. Returns closures over the seed.
function makeLayout(ctx, opts) {
  const rng = ctx.rng.fork('fcr-layout'), N = ctx.noise;
  const season = opts.season || 'september', weather = opts.weather || 'clouds';
  const flood = (weather === 'cloudburst' ? 0.2 : 0) + (season === 'july' ? 0.1 : 0) - (season === 'november' ? 0.1 : 0);
  const sx = rng.range(0, 500), sz = rng.range(0, 500);
  // ledge lines wander: a domain warp in z applied near every drop
  const drops = [{ z: Z_LEDGE, a: rng.range(1.2, 2.2), k: rng.range(0, 99) }];
  for (let i = 0; i < NSTEP; i++) drops.push({ z: Z_BRINK - STEP * i, a: i === 0 ? rng.range(2.4, 3.4) : rng.range(1.4, 2.8), k: rng.range(0, 99) });
  drops.push({ z: Z_LAST, a: rng.range(1.2, 2.0), k: rng.range(0, 99) });
  drops.forEach((d, i) => { d.s = i > 0 && i <= NSTEP ? 0.75 : 0; d.f = 0.85 + 0.004 * d.k; });
  const wz = (x, z) => {
    let w = 0;
    for (let i = 0; i < drops.length; i++) {
      const d = drops[i], t = (z - d.z) / 7.5;
      if (t > -1 && t < 1) w += bump(t) * (d.a * (N.n2(x * 0.06 + d.k, d.k * 1.7) + 0.35 * N.n2(x * 0.21 + d.k, 3.3)) + d.s * Math.sin(x * d.f + d.k) * (0.45 + 0.55 * Math.sin(x * d.f * 0.31 + d.k * 1.7)));   // (d.s: noses and notches along a step's lip)
    }
    return w;
  };
  const znOf = (x, z) => z - wz(x, z);
  const zOf = (x, zn) => { let z = zn; for (let i = 0; i < 5; i++) z = zn + wz(x, z); return z; };
  // step profile in the unwarped coordinate
  const core = (zn) => {
    let y = 6 * sstep((zn - Z_LEDGE) / 1.0);
    for (let i = 0; i < NSTEP; i++) y -= RISE * sstep((Z_BRINK - STEP * i - zn) / FACE);
    y -= 6 * sstep((Z_LAST - zn) / 1.0);
    return y;
  };
  // the same without the seven small steps (a ramp), for the banks further out
  const ramp = (zn) => 6 * sstep((zn - Z_LEDGE) / 1.0) - RISE * NSTEP * clamp((Z_BRINK + 4 - zn) / (STEP * NSTEP - 8), 0, 1) - 6 * sstep((Z_LAST - zn) / 1.0);
  const fallAmt = (zn) => { // 0..1 where the water is falling
    let f = bump((zn - Z_LEDGE - 0.5) / 1.1);
    for (let i = 0; i < NSTEP; i++) f = Math.max(f, bump((zn - (Z_BRINK - STEP * i) + 0.3) / 0.9));
    return Math.max(f, bump((zn - Z_LAST + 0.5) / 1.3));
  };
  const footAmt = (zn) => { // 0..1 boil at the foot of each drop
    let f = 0; const g = (z0, len) => { const t = (z0 - zn) / len; if (t > 0 && t < 1) f = Math.max(f, (1 - t) * (1 - t) * sstep(t * 8)); };
    g(Z_LEDGE - 0.6, 9); for (let i = 0; i < NSTEP; i++) g(Z_BRINK - STEP * i - 0.9, 6.5); g(Z_LAST - 1.2, 11);
    return f;
  };
  // distance below the nearest fall upstream, in boil-band lengths: 0 at its foot, ~0.7 where the boil has broken into lace, 3 = none
  const footT = (zn) => {
    let t = 3; const g = (z0, len) => { const q = (z0 - zn) / len; if (q > -0.02 && q < t) t = Math.max(q, 0); };
    g(Z_LEDGE - 0.3, 9); for (let i = 0; i < NSTEP; i++) g(Z_BRINK - STEP * i - 0.9, 6.5); g(Z_LAST - 1.2, 11);
    return t;
  };
  const waterY = (zn) => core(zn + 0.35) + WATER_T + flood;
  // banks
  const halfW = (z) => z > -80 ? 22.5 : z > Z_LAST ? lerp(22.5, 11.5, sstep((-80 - z) / 110)) : lerp(11.5, 19, sstep((Z_LAST - z) / 16));
  const edgeL = (z) => -(halfW(z) + 2.2 * N.n2(z * 0.045 + sx, 3.1) + 0.8 * N.n2(z * 0.17, 5.5 + sx));
  const edgeR = (z) => halfW(z) + 2.2 * N.n2(z * 0.045 + sz, 9.7) + 0.8 * N.n2(z * 0.17, 1.5 + sz);
  // the deep channel: wanders over the slab, leaves the brink as the right-hand chute
  const cA = rng.range(5.5, 8), cK = (Math.PI * 2) / rng.range(95, 130), cP = rng.range(0, 6.28);
  const cB = rng.range(1.8, 3), cK2 = (Math.PI * 2) / rng.range(40, 55), cP2 = rng.range(0, 6.28), cBias = rng.range(-1, 3);
  const chanX = (z) => {
    const w = cBias + cA * Math.sin(z * cK + cP) + cB * Math.sin(z * cK2 + cP2);
    const up = sstep((z - 70) / 20), dn = sstep((-52 - z) / 34);
    return lerp(lerp(w, 2, up), 6.5 - 1.5 * sstep((-100 - z) / 90), dn);
  };
  const chanHalf = (z) => 1.75 + 0.3 * N.n2(z * 0.08, 17.3 + sx);
  const flyX = (z) => lerp(chanX(z) - 5.3, 0, sstep((-60 - z) / 28));       // the flight line: 5.3 m left of the channel, centred for the cascade
  // emergent rock islands and riffles on the slab
  const islandAt = (x, z, cx = chanX(z)) => {
    if (z > 84 || z < -86) return 0;
    const f = N.fbm2(x * 0.045 + sx, z * 0.032 + sz, 3);
    return f < 0.42 ? 0 : smoothstep(0.42, 0.62, f) * smoothstep(0, 5, Math.abs(x - cx) - 4);
  };
  // potholes
  const wells = [];
  const zPeri = rng.range(opts.periZ ? opts.periZ[0] : -56, opts.periZ ? opts.periZ[1] : -49);
  wells.push({ x: chanX(zPeri) - 10.2, z: zPeri, r: 2.7, depth: 3.2, sandy: 0, peri: true });
  // THE CAMERA'S LINE over the slab: an S-swing off the flight line while it sinks (the world's path runs through these knots)
  const SW = [[84, 0], [63, 11], [40, -8.8], [18, -1.2], [4, 0]];
  const swingX = (z) => { if (z >= SW[0][0] || z <= SW[4][0]) return 0; for (let i = 1; i < 5; i++) if (z >= SW[i][0]) { const a = SW[i - 1], b = SW[i]; return lerp(a[1], b[1], sstep((a[0] - z) / (a[0] - b[0]))); } return 0; };
  const camX = (z) => flyX(z) + swingX(z);
  // Composed along that line (dx = metres right of the flight line), as the live version has them: the show well under the path at
  // z 38 and two beds of thin rose weed. Every other pothole is dealt by the seed, below.
  const zr = ctx.core.makeRng('fcr-zones:' + ctx.seed), zj = () => zr.range(-0.7, 0.7);
  const xIn = (x, m) => clamp(x, -(22.5 - m), 22.5 - m);
  const showW = { x: xIn(flyX(38) - 8.6, 7.5), z: 38, r: 4.1, depth: 1.7, sandy: 0.7, peri: false, show: true };   // (wide and not deep: from four metres up the eye reaches its floor)
  wells.push(showW);
  const zones = [
    { t: 2, x: flyX(11) + 1.5, z: 11 + zj(), rx: 9.5, rz: 3.4 },                    // a bed of thin rose weed across the line
    { t: 2, x: flyX(-25) - 1, z: -25 + zj(), rx: 8, rz: 3.6 },
  ];
  zones.forEach((q, i) => { q.k = (i ? 5 : 2) * 7.3 + zr.range(0, 5); });
  // weights of sand / green / black rock at a point: out[1..3], each 0..1 with a torn edge
  const zw = [0, 0, 0, 0];
  const zonesAt = (x, z) => {
    zw[1] = 0; zw[2] = 0; zw[3] = 0;
    for (let i = 0; i < zones.length; i++) {
      const q = zones[i], ex = (x - q.x) / q.rx, ez = (z - q.z) / q.rz, d = ex * ex + ez * ez; if (d > 1.7) continue;
      const w = 1 - smoothstep(0.62, 0.95, d + 0.3 * N.n2(x * 0.5 + q.k, z * 0.5) + 0.12 * N.n2(x * 1.7, z * 1.7 + q.k));
      if (w > zw[q.t]) zw[q.t] = w;
    }
    return zw;
  };
  const want = clamp(Math.round((opts.potholes ?? 40)), 8, 48) - (wells.length - 1);
  const radii = []; for (let i = 0; i < want - 1; i++) radii.push(1 + 3 * Math.pow(rng(), 1.9));
  radii.sort((a, b) => b - a);
  for (const r of radii) {
    for (let tries = 0; tries < 60; tries++) {
      const z = rng.range(-83 + r, 83 - r), hw = halfW(z) - r - 2.6, x = rng.range(-hw, hw);
      let ok = true;
      for (let k = -1; k <= 1 && ok; k++) if (Math.abs(x - chanX(z + k * r)) < r + 3.1) ok = false;
      for (let j = 0; j < wells.length && ok; j++) { const w = wells[j]; if (Math.hypot(x - w.x, z - w.z) < r + w.r + 1.5) ok = false; }
      if (ok && islandAt(x, z) > 0.02) ok = false;
      if (!ok) continue;
      const sandy = rng.chance(0.42) ? 1 : 0;
      wells.push({ x, z, r, depth: sandy ? rng.range(1.7, 2.4) : rng.range(2.6, 5), sandy, peri: false });
      break;
    }
  }
  // the pool's shoals, 0 (a lane of sand) .. 1 (the back of a rock rib): long bodies lying with the current, none in the plunge basin
  const poolShoal = (x, z, zn) => smoothstep(-0.16, 0.3, N.fbm2(x * 0.16 + sz + 40, z * 0.085 + sx, 2) + 0.25 * N.n2(x * 0.5 + 7, z * 0.3)) * sstep((Z_LAST - 5.5 - zn) / 6);
  const wellSdf = (x, z) => { let d = 9; for (let i = 0; i < wells.length; i++) { const w = wells[i], e = Math.hypot(x - w.x, z - w.z) - w.r; if (e < d) d = e; } return d; };
  // riverbed (and bank) height; out.wl = water level there, out.dEdge = distance inside the river (negative on the bank)
  const out = { h: 0, wl: 0, dEdge: 0, zn: 0, chan: 0, isl: 0 };
  let mz = NaN, mxl = 0, mxr = 0, mcx = 0, mch = 0;
  const bed = (x, z) => {
    if (z !== mz) { mz = z; mxl = edgeL(z); mxr = edgeR(z); mcx = chanX(z); mch = chanHalf(z); }   // per-row memo (the bake walks rows)
    const zn = znOf(x, z), c = core(zn), xl = mxl, xr = mxr, dE = Math.min(x - xl, xr - x);
    out.zn = zn; out.wl = waterY(zn); out.dEdge = dE; out.chan = 0; out.isl = 0;
    if (dE > -1.5) {
      const onSlab = zn < Z_LEDGE && zn > Z_BRINK;
      let h = c + 0.07 * N.fbm2(x * 0.09 + sz, z * 0.09, 2) + 0.025 * N.n2(x * 0.45, z * 0.45);
      const isl = islandAt(x, z, mcx); out.isl = isl; h += isl * (0.30 + flood * 0.5 + 0.12 * N.n2(x * 0.3, z * 0.3 + 40));
      const cd = Math.abs(x - mcx), ch = mch, cp = 1 - sstep((cd - ch + 0.5) / 1.0);
      const cdep = zn > Z_LEDGE ? 0.25 : onSlab ? 1.25 * sstep((Z_LEDGE - 1 - zn) / 6) + 0.1 : zn > Z_LAST ? 0.5 : 0;
      out.chan = cp; h -= cp * cdep;
      h -= footAmt(zn) * (zn < Z_LAST ? 1.5 : zn > Z_BRINK ? 0.5 : 0.16);                      // plunge basins; the last one is the pool
      // THE POOL is clear water over a bed that is seen: ribs of black rock a forearm under the surface (weed on them, in the sun), lanes
      // of yellow sand knee to thigh deep between them, the deep scoured basin only where the last fall lands
      if (zn < Z_LAST - 1) h -= (0.56 - 0.38 * poolShoal(x, z, zn)) * sstep((Z_LAST - 1 - zn) / 6);
      h += 0.34 * sstep((1.6 - dE) / 1.6);                                    // shelving up to the shore
      if (dE > 0) { out.h = h; return out; }
      const hb = bank(x, z, zn, c, -dE);
      out.h = lerp(h, hb, sstep(-dE / 1.5)); return out;
    }
    out.h = bank(x, z, zn, c, -dE); return out;
  };
  const bank = (x, z, zn, c, d) => {
    const cb = lerp(c, ramp(zn), sstep((d - 1.5) / 9));
    let rise = 0.42 + flood + 0.45 * sstep(d / 2.2) + 0.75 * sstep((d - 3) / 16);
    const t = N.fbm2(x * 0.035 + sx, z * 0.035 + sz, 3) * 0.5 + 0.5;                // terraced pavement
    const q = t * 3.2, qf = Math.floor(q), fr = q - qf;
    rise += (qf + sstep((fr - 0.8) / 0.2)) * 0.26 * sstep(d / 4) - 0.3 * sstep(d / 4);
    return cb + rise + 0.03 * N.n2(x * 0.5, z * 0.5);
  };
  const heightAt = (x, z) => bed(x, z).h;
  // which way the weed lies: downstream (-Z), pulled along the channel near it, with a slow meander elsewhere
  const flowYaw = (x, z) => { const k = Math.exp(-Math.pow((x - chanX(z)) / 7, 2)); return Math.atan((chanX(z - 1.5) - chanX(z + 1.5)) / 3) * k + 0.22 * N.n2(x * 0.045 + sx, z * 0.045); };
  return { noise: N, flowYaw, rng, season, weather, flood, wz, znOf, zOf, core, ramp, fallAmt, footAmt, waterY, halfW, edgeL, edgeR, chanX, chanHalf, islandAt, wells, wellSdf, bed, heightAt, zPeri, footT, flyX, swingX, camX, zones, zonesAt, showWell: showW, poolShoal };
}

// ---- shared GLSL ----------------------------------------------------------------------------------------
// CLOUD_SHADOW_GLSL is exported through hero.shared so the world's terrain/water can dim under the same clouds.
const GL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
float fb(vec2 p){ return vn(p)*.55 + vn(p*2.13+3.7)*.3 + vn(p*4.3+9.1)*.15; }
`;
const CLOUD_SHADOW_GLSL = /* glsl */`
uniform float uCloudT, uCloudAmt, uCloudCov;
// 1 in sun .. ~0.38 under a cloud; w = WORLD xz. Shadows ~150 m wide drift toward +X at 25 m/s.
float fcrCloud(vec2 w){ vec2 p=(w - vec2(25.,7.)*uCloudT)/300.; float n=vn(p*1.3)*.62+vn(p*2.9+7.3)*.38;
  return 1. - uCloudAmt*.62*smoothstep(.5 - uCloudCov,.68 - uCloudCov,n); }
`;
const GL_WATER = /* glsl */`
uniform float uTime;
// surface-ripple slope (toward -Z with the current); used to make everything under water swim
vec2 fcrRip(vec2 p){ float t=uTime; p.y += t*1.4;
  return vec2(sin(p.x*2.9 + t*1.9 + 1.6*sin(p.y*1.3 - t*.8)), sin(p.y*2.3 + t*1.3 + 1.6*sin(p.x*1.9 + t*.6))); }
float fcrCaus(vec2 p){ float t=uTime; vec2 q=p*1.5; q.y += t*.8;
  q += .4*vec2(vn(q*.6+vec2(t*.21,0.)), vn(q*.6+vec2(5.3,-t*.19)));
  float a=vn(q+vec2(t*.33,0.)), b=vn(q*1.41+vec2(-t*.27,t*.22)+11.3);
  float c=(1.-abs(a*2.-1.))*(1.-abs(b*2.-1.)); return c*c*c*2.4; }
// the same light drawn fine, for the near bed only: the net the sun throws through a rippled surface, bright threads closing
// round dim cells a forearm wide, every knot of it wandering, the whole sliding downstream (the borders of jittered cells, warped:
// no texture, no derivative, and no straight line anywhere in it)
float fcrNet(vec2 p){ float t = uTime; vec2 q = vec2(p.x*2.7, p.y*1.8); q.y += t*.9;           // (cells drawn out along the current)
  q += .3*vec2(sin(q.y*1.7 + t*1.3) + 1.6*vn(q*.6 + vec2(t*.3, 0.)), sin(q.x*1.9 - t*1.1) + 1.6*vn(q*.6 + vec2(7., -t*.25)));
  q += 1.5*(vec2(vn(q*.31 + 13.), vn(q*.31 + 29.)) - .5) + .9*(vec2(vn(q*1.1 + 3.), vn(q*1.1 + 41.)) - .5);   // (no two cells alike)
  q += .17*vec2(sin(q.y*6.1 + q.x*2.3 + t*.7), sin(q.x*5.7 - q.y*1.9 - t*.6));                   // (and no thread straight: each one wavers along its length)
  vec2 ci = floor(q), f = q - ci; float d1 = 8., d2 = 8., d3 = 8.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), c = ci + o;
    vec2 r = o + .5 + .47*sin(t*.9 + 6.283*vec2(h21(c + 1.7), h21(c*1.3 + 5.1))) - f;
    float d = dot(r, r);
    if (d < d1) { d3 = d2; d2 = d1; d1 = d; } else if (d < d2) { d3 = d2; d2 = d; } else if (d < d3) { d3 = d; }
  }
  // bright knots where three cells meet, the threads between them fading along their length, whole patches of the bed left dim
  float s1 = sqrt(d1), e = clamp((sqrt(d2) - s1)*4.2, 0., 1.), k = 1. - e, knot = 1. - smoothstep(.04, .5, sqrt(d3) - s1);
  return k*k*k*(.2 + 1.3*knot)*(.25 + 1.5*smoothstep(.25, .8, vn(q*1.3 + 4.)))*smoothstep(.2, .62, vn(q*.37 + 9.)); }
// THE NEAR BED IS MADE OF PLANTS: weed drawn tuft by tuft, for the bed within twenty metres of the eye. Each cell of a 0.4 m grid
// roots one tuft at a jittered holdfast; it lies downstream (-y of p) as a fan of three fingers and sways. Returns (cover, 0 at the
// root .. 1 at the tip, tone of this plant).
vec3 fcrTuft(vec2 p){
  vec2 g = p*2.5 + .35*vec2(vn(p*.9 + 2.), vn(p*.9 + 6.)), ci = floor(g); vec3 best = vec3(0.);
  for (int j = 0; j <= 2; j++) for (int i = -1; i <= 1; i++) {
    vec2 c = ci + vec2(float(i), float(j));
    float h = h21(c + 3.1), h2 = h21(c*1.7 + 9.2), h3 = fract(h*17.3 + h2*5.1);
    vec2 d = g - (c + vec2(.08 + .84*h2, .08 + .84*h));
    float len = .5 + 1.2*h3*h3, t = -d.y/len;
    d.x += (.16*sin(uTime*1.6 + h*40.) + .5*(h3 - .5))*t*len;
    float w = (.3 + .2*h)*(sqrt(clamp(t, 0., 1.)) + .08)*(1.12 - .5*clamp(t, 0., 1.)), ax = abs(d.x)/w;
    float cov = step(0., t)*smoothstep(1., .82, t)*smoothstep(1., .8, ax)*mix(1., smoothstep(-.5, .3, cos(ax*(6.3 + 6.3*h2))), smoothstep(.2, .55, t))*step(.3, fract(h*7.7 + h2*3.3));
    if (cov > best.x) best = vec3(cov, t, h2);
  }
  return best; }
`;
// River sand under clear water, seen from a metre up (hero.shared.sandGLSL; needs the noise chunk): bars 0.7 m apart with a sharp
// lee, between them ripple marks a hand apart under the eye, grain, cobbles with a lit shoulder and a shadow, fallen leaves.
// p = metres, dist = metres from the eye, sun = xz of the direction toward the sun.
const GL_SAND = /* glsl */`
// fcrSandR: the same with cont 0..1 = ripple ridges whole along their length (a wet bar under a film of water: every ridge runs on,
// curving, a lit stoss and a shaded lee), not broken into the dashes of a deeper, stirred bed
vec3 fcrSandR(vec2 p, float dist, vec3 base, vec2 sun, float cont){
  float l1 = smoothstep(60., 10., dist), l2 = smoothstep(11. + 7.*cont, 2.5, dist), l3 = smoothstep(26., 6., dist);
  vec2 w = vec2(vn(p*.45), vn(p*.45 + 7.3));
  float s1 = fract((p.y*.86 + p.x*.5)*1.45 + 2.3*w.x + .7*vn(p*1.3 + 4.)), s2 = fract((p.y*.93 - p.x*.37)*6.9 + 3.4*w.y + 1.5*vn(p*1.9) + .8*vn(p*4.3 + 2.));
  float lee1 = smoothstep(.62, .7, s1)*(1. - smoothstep(.88, 1., s1))*mix(smoothstep(.22, .55, vn(p*.7 + 11.)), 1., cont), lee2 = smoothstep(.56, .68, s2)*(1. - smoothstep(.86, 1., s2))*mix(smoothstep(.2, .6, vn(p*1.6 + 15.)), 1., cont*.85);
  vec3 c = base*(.8 + .32*fb(p*.21 + 20.))*(.9 + .2*vn(p*3.1));
  c *= 1. + l1*(.1*smoothstep(.3, .62, s1) - .3*lee1) + l2*(mix(.07, .24, cont)*smoothstep(.12, .56, s2) - mix(.22, .34, cont)*lee2);
  float gr = h21(floor(p*70.));
  c *= 1. + l2*(.16*(gr - .5) + .12*(vn(p*31.) - .5));
  c = mix(c, c*vec3(.55, .5, .42), l2*step(.93, gr)*.6);
  float drift = smoothstep(.3, .62, vn(p*.21 + 31.));
  vec2 cp = p*3.3, ci = floor(cp), cf = fract(cp); float h = h21(ci + 17.3), h2 = h21(ci*1.7 + 3.1), h3 = h21(ci*2.3 + 41.);
  vec2 cc = vec2(.3) + .4*vec2(h2, h3), cv = (cf - cc)*vec2(1., .8 + .4*h2); float cr = .08 + .2*h3*h3, on = step(.9 - .45*drift, h)*l3;
  c *= 1. - .45*smoothstep(cr + .1, cr - .02, length(cv + sun*.09))*on;
  vec3 pc = mix(vec3(.12, .11, .1), vec3(.52, .47, .38), h2*h2); pc = mix(pc, vec3(.3, .17, .09), step(.62, h3)*.7); pc = mix(pc, vec3(.75, .74, .7), step(.9, h2));
  c = mix(c, pc*clamp(.8 + dot(cv, sun)/cr*.5, .4, 1.5), smoothstep(cr, cr - .035, length(cv))*on);
  vec2 dp = p*1.15 + 3.7, di = floor(dp), df = fract(dp); float k1 = h21(di + 7.9), k2 = h21(di*1.9 + 13.), k3 = h21(di*2.7 + 5.);
  vec2 dc2 = vec2(.3) + .4*vec2(k2, k3), dv = (df - dc2)*vec2(1., .75 + .5*k2); float dr = .13 + .16*k3, don = step(.93 - .3*drift, k1)*l1;
  c *= 1. - .5*smoothstep(dr + .12, dr - .02, length(dv + sun*.1))*don;
  vec3 dcol = mix(vec3(.1, .095, .09), vec3(.42, .39, .33), k2)*(.8 + .4*vn(p*9.));
  c = mix(c, dcol*clamp(.8 + dot(dv, sun)/dr*.55, .35, 1.5), smoothstep(dr, dr - .03, length(dv))*don);
  vec2 lp = p*1.7 + 9.3, li = floor(lp), lf = fract(lp) - .5; float g = h21(li + 5.7), g2 = h21(li*1.3 + 23.), a = g2*6.283;
  vec2 lr = vec2(lf.x*cos(a) + lf.y*sin(a), lf.y*cos(a) - lf.x*sin(a));
  float lv = .05*(1. - lr.x*lr.x/.0169) - abs(lr.y), leaf = smoothstep(0., .008, lv)*step(.78, g)*l3;
  vec3 lc = mix(vec3(.15, .08, .03), vec3(.34, .24, .05), g2)*(.7 + .5*smoothstep(.0, .03, abs(lr.y)));
  return mix(c, lc, leaf);
}
vec3 fcrSand(vec2 p, float dist, vec3 base, vec2 sun){ return fcrSandR(p, dist, base, sun, 0.); }
`;
// Black quartzite pavement, shared with the world's banks (hero.shared.paveGLSL; needs the noise chunk).
// p = xz in metres, lod 0..1. Returns albedo in rgb and the joint in a; aux = per-block tilt (xy) and the moss band along the joints (z).
const GL_PAVE = /* glsl */`
vec4 fcrPave(vec2 p, float lod, out vec3 aux){
  vec2 w = 1.25*vec2(vn(p*.17), vn(p*.17 + 9.));
  vec2 jp = vec2(p.x*.41 + p.y*.12 + w.x, p.y*.27 - p.x*.08 + w.y);
  vec2 id = floor(jp), f = abs(fract(jp) - .5);
  float h = h21(id + 3.7), h2 = h21(id*1.7 + 11.3);
  float d = .5 - max(f.x, f.y);
  vec2 g = abs(fract(jp*2. + .5*vec2(vn(p*.5 + 4.), vn(p*.5 + 13.))) - .5);
  float d2 = (.5 - max(g.x, g.y))*.5 + step(h, .45);                     // a finer set splits about half the blocks
  float crack = max(smoothstep(.03, .004, d), smoothstep(.016, .002, d2)*.7)*lod;
  float rn = fb(p*1.7), fine = vn(p*8.);
  vec3 a = vec3(.076, .073, .085)*(.5 + mix(.5, h, lod))*(.65 + .7*rn);  // near black, block to block
  a = mix(a, a*vec3(1.55, 1.2, .9), smoothstep(.55, .8, vn(p*.33 + 60.))*.5);      // rusty weathering rind
  float li = smoothstep(.54, .68, fb(p*.5 + 40. + h*2.))*smoothstep(.3, .55, fine*.6 + rn*.5)*lod;
  a = mix(a, vec3(.27, .28, .22)*(.7 + .5*fine), li*.8);                  // pale lichen plates
  a *= 1. - .85*crack;
  aux = vec3((vec2(h, h2) - .5)*.34*lod, smoothstep(.1, .0, d)*lod);
  return vec4(a, crack);
}
`;
const VARY = /* glsl */`varying vec3 vL; varying vec3 vW; varying vec3 vN;`;

async function bakeMask(L, ctx) {
  const N = ctx.noise, data = new Uint8Array(TW * TH * 4), dz = (Z_TOP - Z_END) / TH, dx = (TX1 - TX0) / TW;
  const sGreen = L.season === 'july' ? 0.95 : L.season === 'november' ? 0.08 : 0.22;
  const bare = L.season === 'november' ? 0.5 : L.season === 'july' ? 0.56 : 0.62;
  const near = [];
  for (let j = 0; j < TH; j++) {
    const z = Z_END + (j + 0.5) * dz;
    await ctx.yield();                                               // a row at a time, and once more half way along it
    near.length = 0; for (const w of L.wells) if (Math.abs(z - w.z) < w.r + 4.2) near.push(w);
    const exl = L.edgeL(z) - 2, exr = L.edgeR(z) + 2;
    for (let i = 0; i < TW; i++) {
      const x = TX0 + (i + 0.5) * dx, o = (j * TW + i) * 4;
      if (i === (TW >> 1)) await ctx.yield();
      if (x < exl || x > exr) { data[o] = 150; data[o + 1] = 127; data[o + 2] = 255; data[o + 3] = 0; continue; }   // dry bank
      const b = L.bed(x, z), zn = b.zn;
      let sdf = 4, wn = null; for (let k = 0; k < near.length; k++) { const w = near[k], e = Math.hypot(x - w.x, z - w.z) - w.r; if (e < sdf) { sdf = e; wn = w; } }
      const fall = L.fallAmt(zn), foot = L.footAmt(zn);
      let depth = b.wl - b.h; if (fall > 0.05) depth = Math.min(depth, 0.22);
      const inR = b.dEdge > 0;
      let weed = 0, sand = 0, green = 0;
      if (inR && depth > 0.015) {
        const pn = N.fbm2(x * 0.11 + 31, z * 0.08 + 12, 2) * 0.5 + 0.5;
        weed = smoothstep(0.02, 0.07, depth) * (1 - smoothstep(0.7, 1.0, depth)) * smoothstep(0.42, 0.9, sdf) * (1 - 0.9 * smoothstep(bare, bare + 0.16, pn));
        if (zn > Z_LEDGE) weed *= smoothstep(0.34, 0.6, pn + 0.34 * sstep((Z_LEDGE + 30 - zn) / 30)) * 0.9;      // the shelf: flecks of red thickening to the ledge
        else if (zn < Z_BRINK + 2) { const zo = treadZone(x, z, zn); weed *= zo === 3 ? 1 : zo === 2 ? (zn < Z_BRINK ? 1 : 0.35) : 0; }   // the staircase: weed where the tread's own sums say so (a runnel is weed pressed flat)
        else weed *= 1 - 0.8 * Math.min(1, foot * 1.5);
        const pSh = zn < Z_LAST - 1 ? L.poolShoal(x, z, zn) : 0;
        if (zn < Z_LAST) weed = zn < Z_LAST - 6 ? smoothstep(0.02, 0.07, depth) * (1 - smoothstep(0.62, 0.9, depth)) * smoothstep(0.5, 0.8, pSh) * (1 - 0.85 * smoothstep(bare - 0.1, bare + 0.1, pn)) : 0;   // (the pool: weed on the backs of its shoals only)
        const sn = N.fbm2(x * 0.05 + 50, z * 0.035 + 9, 2);
        let patch = smoothstep(0.5, 0.66, sn) * (1 - b.isl) * 0.9;
        if (zn < Z_LEDGE) patch *= smoothstep(5, 11, Math.abs(x - L.camX(z))) * sstep((zn - (Z_BRINK + 3)) / 12);   // never a bare yellow floor under the camera
        sand = Math.max(b.chan * sstep((depth - 0.65) / 0.4) * smoothstep(0.1, 0.4, sn + 0.1), patch);
        if (zn > Z_LEDGE + 1) sand = Math.max(sand, smoothstep(0.02, 0.3, sn + (zn - Z_LEDGE - 22) * 0.022));      // sand in patches only: the shelf is rock under weed
        if (zn < Z_LAST - 3) sand = Math.max(sand * 0.4, (1 - foot * 2) * (1 - smoothstep(0.3, 0.56, pSh)));     // (sand in the lanes between the ribs, none in the scoured basin)
        sand = clamp(sand, 0, 1); weed *= 1 - sand;
        green = Math.max(sstep((5 - b.dEdge) / 4.5) * (x < 0 ? 1 : 0.55), sstep((depth - 0.45) / 0.45) * 0.8,
          smoothstep(0.3, 0.6, N.fbm2(x * 0.06 + 77, z * 0.05 + 3, 2)) * sGreen, foot * 0.9, 0.14);
        if (zn < Z_LAST - 3) green = Math.min(green, 0.12 + 0.5 * foot);                              // (the pool's ribs are black rock under red weed: no rim of algae round them)
        if (zn < Z_LEDGE - 4 && zn > Z_BRINK + 4) {                    // the composed windows: sand, green weed, bare black pavement (green 0 = no algae on it)
          const q = L.zonesAt(x, z), land = (1 - b.chan) * smoothstep(-0.1, 0.5, sdf), ws = q[1] * land, wr = q[3] * land;
          sand = Math.max(sand, ws) * (1 - wr); weed *= (1 - ws) * (1 - wr);
          green *= 1 - wr; weed *= 1 - 0.38 * q[2];                      // (the two composed beds: the same weed grown thin and rose, out in the sun)
        }
      } else green = 0.5 + 0.5 * N.n2(x * 0.1, z * 0.1);
      if (sdf < 0) { depth += sstep(-sdf / 0.3) * 2.4; weed = 0; sand = wn ? wn.sandy : 0; }      // (inside a well G tells the water whether its floor is sand: a sandy well is seen lit to the bottom)
      data[o] = clamp(green, 0, 1) * 255; data[o + 1] = clamp(0.5 + 0.5 * weed - 0.5 * sand, 0, 1) * 255;
      data[o + 2] = clamp((sdf + 2) / 6, 0, 1) * 255; data[o + 3] = clamp(depth / 2.55, 0, 1) * 255;
    }
  }
  const tex = new THREE.DataTexture(data, TW, TH, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}

async function buildBedGeometry(L, ctx) {
  const xs = []; for (let x = -24; x <= 24; x += 1) xs.push(x);
  for (const e of [25.5, 27.5, 30, 34, 40, 50, 66, 88, 115]) { xs.push(e); xs.unshift(-e); }
  const zs = [];
  const drop = (z0, w) => { zs.push(z0 + 0.3 * w, z0, z0 - w / 3, z0 - (2 * w) / 3, z0 - w, z0 - w - 0.45); };
  for (let z = Z_TOP; z > Z_LEDGE + 1; z -= 3.2) zs.push(z);
  drop(Z_LEDGE + 1.0, 1.0);                                   // core() rises over zn 90..91
  for (let z = Z_LEDGE - 1.6; z > Z_BRINK + 0.6; z -= 1.25) zs.push(z);
  for (let i = 0; i < NSTEP; i++) { const z0 = Z_BRINK - STEP * i; drop(z0, FACE); for (let k = 1; k <= 7; k++) zs.push(z0 - 1.05 - (k * (STEP - 1.4)) / 8); }
  drop(Z_LAST, 1.0);
  for (let z = Z_LAST - 3; z >= Z_END; z -= 2.6) zs.push(z);
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), wl = new Float32Array(nx * nz), znA = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    if ((j & 3) === 3) await ctx.yield();                              // a few rows at a time
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = L.zOf(x, zs[j]), b = L.bed(x, z), o = j * nx + i;
      pos[o * 3] = x; pos[o * 3 + 1] = b.h; pos[o * 3 + 2] = z; znA[o] = b.zn;    // (the unwarped coordinate of the vertex itself: the shader finds its tread from it)
      wl[o] = b.dEdge < -1.5 ? Math.min(b.wl, b.h - 0.4) : L.fallAmt(b.zn) > 0.05 ? Math.min(b.wl, b.h + 0.22) : b.wl;
    }
  }
  await ctx.yield();
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let q = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;   // rows run toward -Z: wind so normals face +Y
    idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aWl', new THREE.BufferAttribute(wl, 1)); g.setAttribute('aZn', new THREE.BufferAttribute(znA, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  // vertex normals a band of rows at a time (the same sums as three's computeVertexNormals, which in one go stalls the page)
  const nrm = new Float32Array(nx * nz * 3);
  const face = (a, b, c) => {
    const a3 = a * 3, b3 = b * 3, c3 = c * 3, bx = pos[b3], by = pos[b3 + 1], bz = pos[b3 + 2];
    const ux = pos[c3] - bx, uy = pos[c3 + 1] - by, uz = pos[c3 + 2] - bz, vx = pos[a3] - bx, vy = pos[a3 + 1] - by, vz = pos[a3 + 2] - bz;
    const X = uy * vz - uz * vy, Y = uz * vx - ux * vz, Z = ux * vy - uy * vx;
    nrm[a3] += X; nrm[a3 + 1] += Y; nrm[a3 + 2] += Z; nrm[b3] += X; nrm[b3 + 1] += Y; nrm[b3 + 2] += Z; nrm[c3] += X; nrm[c3 + 1] += Y; nrm[c3 + 2] += Z;
  };
  for (let j = 0; j < nz - 1; j++) {
    if ((j & 31) === 31) await ctx.yield();
    for (let i = 0; i < nx - 1; i++) { const a = j * nx + i; face(a, a + 1, a + nx); face(a + 1, a + nx + 1, a + nx); }
  }
  await ctx.yield();
  for (let o = 0; o < nrm.length; o += 3) { const l = Math.hypot(nrm[o], nrm[o + 1], nrm[o + 2]) || 1; nrm[o] /= l; nrm[o + 1] /= l; nrm[o + 2] /= l; }
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.computeBoundingSphere();
  return g;
}

const VERT_STD = /* glsl */`
${VARY} attribute float aWl, aZn; varying float vWl; varying float vZn;
#include <fog_pars_vertex>
void main(){
  vL = position; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vWl = aWl; vZn = aZn;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const FRAG_HEAD = /* glsl */`
${VARY}
uniform sampler2D uMask; uniform vec4 uMaskRect;
uniform vec3 uSunDir, uSun, uSky, cWeed, cTip, cSand, cGreen, cRock, cDeep, cHaze; uniform float uGloss, uWeedSat;
${GL_NOISE}${CLOUD_SHADOW_GLSL}${GL_WATER}${GL_PAVE}${GL_TREAD}${GL_SAND}
#include <fog_pars_fragment>
`;

function makeBedMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true,
    vertexShader: VERT_STD,
    fragmentShader: FRAG_HEAD + /* glsl */`
varying float vWl; varying float vZn; uniform float uMirror;
uniform vec4 uHol[6];
void main(){
  float depth = vWl - vL.y, uw = smoothstep(0., .05, depth), dc = clamp(depth, 0., 1.5), dCam = distance(cameraPosition, vW);
  float lodB = smoothstep(120., 26., dCam);                               // the finest weed grain is for the near bed only
  vec4 M0 = texture2D(uMask, (vL.xz - uMaskRect.xy)*uMaskRect.zw);
  if (M0.b*6. - 2. < .05) discard;                                   // pothole: the well mesh takes over
  vec2 rp = vL.xz + fcrRip(vL.xz)*(.015 + .07*dc)*uw;                // refraction: the bed swims under the ripples
  vec4 M = texture2D(uMask, (rp - uMaskRect.xy)*uMaskRect.zw);
  float weed = clamp(M.g*2. - 1., 0., 1.)*uw, sand = clamp(1. - M.g*2., 0., 1.)*uw, green = M.r;
  // (the mask is 0.4 m to a texel: near the eye its soft edges are cut to a torn line a hand wide, so sand, weed and rock meet as things)
  float tear = (vn(rp*3.7 + 11.) - .5)*.44 + (vn(rp*9.3) - .5)*.22, crispK = smoothstep(46., 14., dCam);
  weed = mix(weed, smoothstep(.36, .64, weed + tear), crispK); sand = mix(sand, smoothstep(.36, .64, sand + tear), crispK);
  // THE TREADS: on the staircase the weed is not read from the 0.4 m mask (blotches at the closest pass) but drawn from the tread's
  // own sums, every edge torn by noise: face | basin of bare rock | red weed, pressed flat and wine-dark along the runnels, and a
  // hand of bare wet sill at the lip between the spouts
  float onS = smoothstep(-90.2, -90.5, vZn)*step(-195., vZn);
  float kS = floor((-90. - vZn)/15.), bS = -90. - 15.*kS - vZn, bEnd = fcrBasinEnd(rp), eN = fcrEdge(rp);
  float sT = clamp((bS - bEnd)/(15. - bEnd), 0., 1.), faceS = step(bS, .9), dM = M.a*2.55;
  float laneD = fcrLane(rp) - mix(fcrLaneThr(sT), ${TS.toFixed(2)}, faceS) + eN*.05;
  float laneB = smoothstep(-.05, .04, laneD)*mix(smoothstep(bEnd - .2, bEnd + 1.2, bS), 1., faceS)*onS;
  float sillS = smoothstep(14.3, 14.72, bS + eN*.22)*laneB*(1. - faceS)*onS;      // (bare wet sill only where water pours over: in a ribbon the weed bends over the edge itself)
  float basW = 1. - smoothstep(-.12, .12, bS - bEnd + eN*.5), pockS = basW*fcrSpout(rp, bS)*(1. - faceS);   // the plunge pocket: bare and blue only under a white cord
  float weedS = (1. - .9*sillS)*mix((1. - pockS)*(1. - .82*laneB), 1. - .8*laneB, faceS)*smoothstep(.02, .07, dM)*smoothstep(.62, .45, dM)*uw;   // (a runnel is a thread of clear blue water over scoured rock, the weed parted to either side of it)
  weed = mix(weed, weedS, onS); green *= 1. - .6*onS;
  float ribS = sillS, scourS = max(pockS, laneB*(1. - faceS))*onS;
  vec3 N = normalize(vN);
  float steep = 1. - smoothstep(.5, .85, N.y);
  float along = mix(rp.y, vL.y*1.6, steep);
  // THE RISERS OF THE STAIRCASE AND OF THE LAST FALL (the bed's own slope within two metres below a lip): wet black rock under the
  // falling sheet. The weed hangs over the lip in tongues and lets go a forearm or two down; below it the face is bare, darker
  // than the treads, and mossed: in pads everywhere, thickly toward the river's two sides where the sheet runs thin (the mask's depth).
  float rise = steep*smoothstep(-90.2, -90.5, vZn)*smoothstep(2.6, 1.6, bS)*step(-200., vZn);
  weed *= 1. - rise*(1. - smoothstep(.35, .8, vn(vec2(rp.x*1.7, kS*3.1 + 2.)) + .3*(vn(vec2(rp.x*6.1, vL.y*2.)) - .5))*smoothstep(.5, .1, bS + .3*vn(vec2(rp.x*3.3, kS))));
  // black quartzite: joints, pitting; dry pavement is greyer with pale lichen; a moss line at the water
  float rn = fb(rp*1.7), big = fb(rp*.21 + 20.);
  vec2 jp = vec2(rp.x*.37 + along*.11 + 1.1*vn(rp*.17), along*.23 - rp.x*.07 + 1.1*vn(rp*.17 + 9.));
  float crack = smoothstep(.02, 0., min(abs(fract(jp.x) - .5), abs(fract(jp.y) - .5)))*.8;
  float dry = smoothstep(.03, .4, -depth);
  vec3 rock = cRock*(.55 + 1.5*rn)*(1. - crack*.75);
  // (seen through a hand of clear water the bare slab is plainly rock: rusty rind, veins of white quartz, pits)
  float nearR = smoothstep(46., 7., dCam);
  rock = mix(rock, cRock*vec3(3.6, 2.5, 1.7), smoothstep(.5, .78, vn(rp*.31 + 60.))*.5*uw);
  rock += vec3(.07, .07, .078)*smoothstep(.016, .0, abs(vn(rp*vec2(.9, .5) + 3.*vn(rp*.23)) - .5))*smoothstep(.4, .68, vn(rp*.37 + 11.))*(1. - crack)*uw;
  rock *= 1. - .5*smoothstep(.035, 0., min(abs(fract(jp.x*3. + .3*vn(rp*.5)) - .5), abs(fract(jp.y*3.) - .5)))*nearR*uw;
  vec2 hp = rp*1.6, hi = floor(hp), hf = fract(hp) - .5 - (vec2(h21(hi + 31.), h21(hi + 57.)) - .5)*.4;
  float hon = step(.5, h21(hi + 9.1))*nearR*uw, hr = .12 + .2*h21(hi*1.3 + 4.), hd = length(hf);
  rock = mix(rock, cRock*.22, smoothstep(hr, hr - .05, hd)*hon*.85);
  rock += vec3(.045, .05, .06)*smoothstep(.05, .0, abs(hd - hr - .02))*hon*clamp(.5 - .5*dot(hf, uSunDir.xz)/max(hd, .05), 0., 1.);
  rock *= 1. - .55*smoothstep(.7, .84, vn(rp*5.3))*nearR*uw;
  float alg = fb(rp*.8 + 7.) + .15*green, algA = mix(.85*smoothstep(.1, .45, alg), smoothstep(.3, .62, alg)*.7, smoothstep(-96., -86., vL.z));
  float cmbA = mix(.5, vn(vec2(rp.x*38. + 2.*vn(rp*vec2(2., .7)), along*1.3 + 9.)), smoothstep(30., 8., dCam));
  algA = mix(algA, smoothstep(.34, .56, alg)*(.2 + .6*smoothstep(.35, .7, cmbA)), onS);          // (on the treads: thinner, darker, combed by the current into streaks)
  algA *= smoothstep(.03, .11, green + onS)*(1. - .85*ribS);                    // (mask green 0 = a pavement kept bare and black; the ribs of a slide are scoured)
  rock = mix(rock, cGreen*vec3(.45,.9,.5)*(.22 + .5*rn)*(1. - .5*onS)*(.7 + .6*vn(rp*vec2(9., 6.))*nearR), uw*algA*(1. - .8*scourS));
  rock = mix(rock, vec3(.07, .085, .1)*(.6 + .9*rn)*(1. - .5*crack), scourS*.75);   // scoured pale where the water runs hardest
  vec3 aux; vec4 pv = fcrPave(vec2(rp.x, along), 1., aux);              // the dry pavement: jointed black blocks, lichen plates
  pv.rgb *= mix(.5, 1., smoothstep(.02, .5, -depth));                     // dark and wet beside the water
  rock = mix(rock, pv.rgb, dry*(1. - rise));                             // (a riser beside the water is the same bedded rock as under it, not paving stood on end)
  // (round 14) THE WET HOLLOWS of the banks (uHol: x, z, half-width across the bank, half-length along it): a seep in the pavement
  // at the water's edge. Inside its torn outline the rock is dark and wet, green with algae and moss in pads, and the low places
  // hold a little standing water that mirrors the sky (below)
  float hol = 0.;
  for (int i = 0; i < 6; i++) { vec4 hq = uHol[i]; vec2 hd = (vL.xz - hq.xy)/max(hq.zw, vec2(.5));
    hol = max(hol, step(.25, hq.z)*(1. - smoothstep(.62, 1., length(hd) + (vn(vL.xz*.45 + hq.xy) - .5)*.6 + (vn(vL.xz*1.9) - .5)*.16))); }
  float holB = hol*dry*(1. - steep), holP = holB*smoothstep(.5, .56, vn(rp*.55 + 17.)*.7 + vn(rp*1.7 + 3.)*.3)*smoothstep(.3, .8, hol);
  rock *= 1. - .62*holB;
  rock = mix(rock, cGreen*vec3(.5, .9, .42)*(.16 + .5*rn), holB*smoothstep(.38, .5, vn(rp*1.1 + 23.)*.6 + vn(rp*4.3)*.4)*.85*(1. - holP));
  rock *= 1. + steep*(.9*vn(vec2(rp.x*.25, vL.y*5.)) - .3);           // bedding on the scarps
  float moss = smoothstep(.05, 0., abs(depth + .01) - .03*rn)*smoothstep(.4, .75, rn + green*.25);
  moss = max(moss, steep*(1. - uw)*smoothstep(.45, .7, rn));
  rock *= 1. - .45*rise*smoothstep(mix(1., 2.6, step(6.5, kS)), mix(.6, 1.6, step(6.5, kS)), bS);                       // (wet and dark under the sheet; at its foot, where the boil washes it, as the tread is)
  moss = max(moss, rise*smoothstep(.4, .7, vn(vec2(rp.x*1.1 + 9., vL.y*1.7)) + .25*rn + .45*smoothstep(.45, .08, dM))*(1. - .7*laneB));
  moss = max(moss, dry*aux.z*smoothstep(.2, .45, vn(rp*.31 + 5.) + .2*big)*(1. - steep));   // moss in the joints
  rock = mix(rock, cGreen*vec3(.6,.85,.42)*(.2 + .5*rn), moss*.85);
  N = normalize(N + vec3(aux.x, 0., aux.y)*dry*(1. - steep));            // every block tips its own way
  // weed: tufts streaming toward -Z, combed and swaying
  vec2 wp = vec2(rp.x + .07*sin(along*1.9 + uTime*2.4 + 5.*vn(rp*.35)), along);
  float st = vn(vec2(wp.x*6.5 + 2.2*vn(wp*vec2(2.3,.8) + 3.), wp.y*2. + uTime*.3))*.65 + mix(.5, vn(vec2(wp.x*15. + 5., wp.y*4.6 + uTime*.4)), lodB)*.35, st2 = vn(vec2(wp.x*2.4 + 4., wp.y*.7 - 2.));
  float tuft = vn(wp*vec2(1.5,.6) + 13.);
  float lodN = smoothstep(mix(16., 26., onS), 3., dCam);                  // under the eye the paint is combed into ribbons: dark between, bright along each frond
  float dens = weed*smoothstep(.12, .5, tuft*.55 + st2*.45 + weed*.3 + (st - .5)*.55*lodN);
  float ros = vn(vec2(wp.x*1.9 + 1.3*vn(wp*.6), wp.y*1.05 + 4.));           // plant by plant: the rock shows dark at each holdfast
  dens *= 1. - .5*smoothstep(.56, .76, ros)*smoothstep(90., 24., dCam)*(1. - .6*onS);
  vec3 wc = mix(cWeed*mix(.5, .4, lodN), cWeed*mix(1., 1.15, lodN), smoothstep(.15, .8, st));
  wc *= mix(1., .66 + .68*vn(vec2(wp.x*41. + 3.*vn(wp*vec2(3., 1.)), wp.y*5.5 + uTime*.6)), lodN);
  wc = mix(wc, cTip, smoothstep(.6, .95, st*.55 + tuft*.55)*.7);
  vec3 gc = mix(cGreen*.3, cGreen*.9, st);
  wc *= (.72 + .5*big)*(.74 + .5*vn(rp*vec2(2.1, 1.7) + 31.));        // wine-dark and brighter reaches, tuft by tuft
  wc = mix(wc, gc, smoothstep(.3, .8, green + (tuft - .5)*.5));
  wc *= mix(1., .8 + .4*vn(vec2(wp.x*30., wp.y*10. + uTime*.5)), lodB);
  wc *= (1. - .3*lodN)*(1. - .42*laneB*(1. - faceS))*(1. - .3*basW*(1. - pockS)*onS*(1. - faceS));               // (wine-dark under the real fronds near the eye, darker still where a runnel presses it flat)
  // UNDER THE EYE the weed is plants, not paint: a wine-dark mat, and on it tuft after tuft from a dark root to a lit rose tip,
  // every one leaning with the current and of its own tone, bare rock showing dark in the gaps
  // FROM PLANTS TO CARPET WITHOUT A LINE (below the ledge; the shelf above it keeps its law of metres from the eye). Two things
  // change between the plants under the eye and the carpet far off, and each is given its own even law:
  // THE TONE (the wine-dark mat between the plants) is seen where the eye looks down between them and is hidden where it looks
  // along them: it goes by the sine of the angle at which the bed is seen from where the eye IS (lodM: whole from 27 degrees
  // down, none at 2), which from any height is an even ramp up the picture, never a step that goes before the eye.
  // THE PLANTS THEMSELVES go by the pixel's footprint: a tuft is a hand to a forearm across, drawn whole where a pixel covers
  // under two centimetres of the bed (the root of its area there) and let go evenly into the mat's own mean as that grows eleven
  // times over (lodF: the lens, as a level of detail reads it).
  vec2 fpx = dFdx(vL.xz), fpy = dFdy(vL.xz); float shelfK = smoothstep(88., 90.5, vZn), lodO = smoothstep(23., 9., dCam);
  float lodF = 1. - smoothstep(0., 1., (log2(max(sqrt(abs(fpx.x*fpy.y - fpx.y*fpy.x)), 1e-4)) + 5.64)/3.46);
  float lodM = clamp(((cameraPosition.y - vW.y)/max(dCam, 1e-3) - .035)/.42, 0., 1.);
  float lodT = (shelfK >= 1. ? lodO : mix(lodM, lodO, shelfK))*(1. - steep), lodD = shelfK >= 1. ? 1. : mix(lodF, 1., shelfK); vec3 tf = fcrTuft(vec2(rp.x, along));
  vec3 tcol = mix(cWeed*.3, cWeed*1.12, smoothstep(0., .6, tf.y))*(.78 + .46*tf.z); tcol = mix(tcol, cTip*(.85 + .3*tf.z), smoothstep(.5, 1., tf.y)*.62);
  tcol = mix(tcol, mix(cGreen*.3, cGreen*1.05, tf.y)*(.8 + .4*tf.z), smoothstep(.3, .8, green + (tuft - .5)*.5));
  vec3 det = mix(wc*.4, tcol, tf.x);
  if (shelfK >= 1.) wc = mix(wc, det, lodT); else wc = mix(wc, mix(wc*.62, det, lodD), lodT);
  dens *= 1. - lodT*lodD*.5*(1. - tf.x)*smoothstep(.52, .7, vn(rp*2.7 + 5.));
  vec3 alb = mix(rock, wc, dens);
  vec3 sc = fcrSand(rp, dCam, cSand, uSunDir.xz);
  alb = mix(alb, sc, sand*(1. - steep));
  // light
  float cl = fcrCloud(vW.xz), nl = max(dot(N, uSunDir), 0.);
  float caus = (fcrCaus(rp) + 1.3*fcrNet(rp)*smoothstep(30., 7., dCam)*(1. - .95*smoothstep(.12, .5, weed)))*uw*exp(-dc*.5);   // (the fine net is for sand and rock: on weed it would marble the paint)
  nl = mix(nl, max(nl, .62), dens);                                        // (weed stands up into the light: a low sun does not leave the carpet black)
  vec3 col = alb*(uSun*cl*nl*(.78 + 1.0*caus) + uSky*(.55 + .45*N.y));
  vec3 V = normalize(cameraPosition - vW);
  float wet = (1. - uw)*max(1. - dry*(1. - uGloss), moss*.5);
  wet = max(wet, holB*.9);
  col += uSun*cl*wet*.35*pow(max(dot(reflect(-V, N), uSunDir), 0.), 30.);
  float gz = 1. - max(dot(V, N), 0.); gz *= gz;
  col += uSky*gz*gz*(.05 + .22*wet)*(1. - uw);                           // polished rock takes the sky at a glancing angle
  // (round 14) the standing water of a hollow: the sky lying in it, a dark wet rim round each pool, a breath of wind on it
  col = mix(col, (cHaze*.34 + uSky*.5)*(.5 + .5*gz)*(.9 + .2*vn(rp*5. + uTime*.4)), holP*.86);
  col *= 1. - .5*holB*(1. - holP)*smoothstep(.44, .5, vn(rp*.55 + 17.)*.7 + vn(rp*1.7 + 3.)*.3);
  float bedl = smoothstep(.3, .62, vn(vec2(rp.x*.2 + 3., along*1.5 + 1.6*vn(rp*.27))));
  float bareR = mix(clamp(1. - abs(M.g*2. - 1.)*2.2, 0., 1.), 1. - weed, onS)*smoothstep(.5, .2, -depth);
  col *= 1. - .3*min(uMirror*2., 1.)*(1. - uw)*smoothstep(.5, .2, -depth);
  col *= 1. - .45*min(uMirror*2., 1.)*bareR*uw;
  float bedg = smoothstep(.05, .0, abs(vn(vec2(rp.x*.2 + 3., along*1.5 + 1.6*vn(rp*.27))) - .52))*(.4 + .6*vn(rp*vec2(1.3, 4.)));
  col += cHaze*vec3(1.1, .7, .78)*uMirror*bareR*(.012 + .1*bedl*bedl + .5*bedg)*(1. - .6*crack);   // (its bedding catching the rose of the sky)   // a low sun: bare rock in the river lies dark and wet, never a pale pad
  // (wet rock at a low sun: black, block by block, a few of the blocks holding a film of the rose sky, and a glint wandering along
  // some of the joints: never a ruled grid)
  vec2 jq = jp*2.2 + 1.5*vec2(vn(rp*.37 + 2.), vn(rp*.37 + 7.)) + .35*vec2(vn(rp*1.3 + 4.), vn(rp*1.3 + 9.)), jc = floor(jq), jd = abs(fract(jq) - .5);
  float jh = h21(jc + 5.3), jf = .5 - max(jd.x, jd.y), lowK = uMirror*bareR*uw*nearR;
  col += cHaze*vec3(1.2, .66, .74)*lowK*(smoothstep(.02, .045, jf)*smoothstep(.12, .055, jf)*smoothstep(.3, .62, vn(rp*.55 + 13. + jh*3.))*.34 + step(.72, jh)*smoothstep(.03, .12, jf)*.07*(.5 + vn(rp*3.1)));
  col *= 1. - .5*smoothstep(.03, .0, jf)*min(uMirror*2.4, 1.)*bareR*uw*nearR;
  col += cHaze*vec3(1.15, .72, .8)*uMirror*dry*((.03 + .09*bedl + .1*gz*(.4 + 3.*abs(aux.x + aux.y)))*(1. - .85*pv.a) + .5*aux.z*(1. - pv.a)*(.35 + .65*vn(rp*2.3 + 7.)));   // ... and the dry pavement stays black, block by block, its joints edged with the sky's own rose
  float ab = 1. - exp(-max(mix(depth, M.a*2.55, uw) - .3, 0.)*1.3);
  col = mix(col, cDeep*(uSun*cl*.8 + uSky*.8), ab*.9);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}` });
}

// One pothole: lip ring of bare rock, undercut wall, floor. Unit profile scaled per instance in the shader.
function buildWells(L, U) {
  const SIDES = 36, P = [[1, 0.5, -0.07, 0], [1, 0.34, 0.07, 0], [1, 0.1, 0.09, 0], [1, 0, 0.03, 0], [0.985, 0, -0.1, -0.04], [1.05, 0, 0, -0.45], [1, 0, 0, -0.85], [0.7, 0, 0, -0.985]];
  const nr = P.length, pos = [], prof = [], nrm = [], idx = [];
  for (let k = 0; k < nr; k++) {
    // profile normal for a typical well (r 2, depth 3) in the (radial, y) plane
    const a = P[Math.max(0, k - 1)], b = P[Math.min(nr - 1, k + 1)];
    const dr = (b[0] * 2 + b[1]) - (a[0] * 2 + a[1]), dy = (b[2] + b[3] * 3) - (a[2] + a[3] * 3), l = Math.hypot(dr, dy) || 1;
    for (let i = 0; i < SIDES; i++) { const t = (i / SIDES) * Math.PI * 2; pos.push(Math.cos(t), 0, Math.sin(t)); prof.push(...P[k]); nrm.push(dy / l, -dr / l); }
  }
  pos.push(0, 0, 0); prof.push(0, 0, 0, -1); nrm.push(0, 1);
  for (let k = 0; k < nr - 1; k++) for (let i = 0; i < SIDES; i++) {
    const a = k * SIDES + i, b = k * SIDES + (i + 1) % SIDES, c = a + SIDES, d = b + SIDES;
    idx.push(a, c, b, b, c, d);
  }
  for (let i = 0; i < SIDES; i++) idx.push((nr - 1) * SIDES + i, nr * SIDES, (nr - 1) * SIDES + (i + 1) % SIDES);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aProf', new THREE.Float32BufferAttribute(prof, 4));
  g.setAttribute('aNrm', new THREE.Float32BufferAttribute(nrm, 2)); g.setIndex(idx);
  const n = L.wells.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
  L.wells.forEach((w, i) => {
    const b = L.bed(w.x, w.z); w.y = b.h; w.wl = b.wl;
    iA.set([w.x, b.h, w.z, w.r], i * 4); iB.set([w.depth, w.sandy, L.rng(), b.wl], i * 4);
  });
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -2, 0), 100);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true,
    vertexShader: /* glsl */`
${VARY} attribute vec4 aProf, iA, iB; attribute vec2 aNrm; varying vec4 vI; varying vec3 vC; varying float vRel; varying float vRnd;
#include <fog_pars_vertex>
void main(){
  float ang = atan(position.z, position.x + 1e-5), wob = 1. + .018*sin(ang*3. + iB.z*6.28) + .012*sin(ang*7. + iB.z*17.);
  float rr = (iA.w*aProf.x + aProf.y)*wob;
  vec3 p = vec3(iA.x + position.x*rr, iA.y + aProf.z + aProf.w*iB.x, iA.z + position.z*rr);
  vL = p; vC = vec3(iA.x, iA.y + .09, iA.z); vI = vec4(iA.w, iB.x, iB.y, iB.w); vRel = -aProf.w; vRnd = iB.z;
  vec3 n = vec3(position.x*aNrm.x, aNrm.y, position.z*aNrm.x);
  // SEEN THROUGH WATER: a ray from the eye bends down as it enters, so the wall and the floor of a well stand higher in the picture
  // than they are (a third of their depth from a low eye, three quarters from straight above): the well is drawn that much
  // shallower below its lip, and shaded with its true depth (vL)
  vec3 camLoc = cameraPosition - modelMatrix[3].xyz;
  float y0 = iA.y - .1, dv = max(y0 - p.y, 0.), el = max(camLoc.y - iB.w, .05), ln = length(vec3(camLoc.xz - p.xz, el));
  float sa = el/max(ln, .05), sb = sqrt(1. - (1. - sa*sa)/1.7689);
  p.y = y0 - dv*clamp(sa/(1.33*sb), .2, .76);
  vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*n);
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: FRAG_HEAD + /* glsl */`
varying vec4 vI; varying vec3 vC; varying float vRel; varying float vRnd; uniform vec3 uSunL; uniform float uMirror;
void main(){
  vec3 N = normalize(vN); float below = vC.y - vL.y, dw = max(vI.w - vL.y, 0.);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  float lod = smoothstep(110., 24., dist), nearW = smoothstep(34., 8., dist);
  vec2 rp = vL.xz + fcrRip(vL.xz)*(.02 + .05*min(dw, 2.)), rc = vL.xz - vC.xz;
  float rn = fb(rp*1.9 + vL.y*1.3), floorM = smoothstep(.8, .97, vRel), lipM = 1. - smoothstep(.02, .16, below);
  // THE WALL of a pothole: beds of quartzite a hand thick, every ledge of them catching the light and shading the bed under it,
  // scallops ground into it by the stones that drilled the well, paler than the black lip where the water has scoured it
  float ang = atan(rc.y, rc.x + 1e-5), arc = ang*vI.x;
  float bq = below*2.6 + .55*vn(vec2(arc*.8, below*.7) + vRnd*9.), bl = fract(bq);
  float ledge = smoothstep(0., .14, bl)*smoothstep(.55, .14, bl), under = smoothstep(.72, 1., bl);
  vec3 alb = mix(vec3(.07, .07, .075), vec3(.36, .33, .27), .25 + .75*rn);
  alb *= (.75 + .8*ledge*lod)*(1. - .6*under*lod)*(.78 + .44*vn(vec2(arc*2.3, below*1.7) + 3.));
  float algae = smoothstep(.1, .35, below)*smoothstep(1.7, .35, below)*smoothstep(.3, .65, rn + .2*ledge);
  alb = mix(alb, cGreen*vec3(.5, 1., .45)*(.4 + rn), algae*.25);
  // the lip itself: by day a rim of scoured quartzite, pale and lit, pitted, a ring that says where the hole begins; at a low sun bare black rock, wet
  alb = mix(alb, mix(vec3(.43, .4, .34)*(.6 + .8*rn)*(1. - .45*smoothstep(.6, .8, vn(rp*4.7 + 3.))), cRock*(.5 + 1.4*rn), min(uMirror*2.4, 1.)), lipM);
  // the floor: yellow sand in ripples, or the dark bed strewn with the pale stones that ground the hole
  float dF = dist*.6, rpl = sin((rp.x*.6 + rp.y + 1.5*vn(rp*.5))*7.);
  vec3 fl = mix(fcrSand(rp*1.5 + 31., dF, vec3(.085, .092, .1), uSunDir.xz), fcrSand(rp*2.5, dF, cSand*(.82 + .06*rpl), uSunDir.xz), vI.z);
  // small silver fish holding over the floor, each on its own slow round, its shadow beside it
  float fish = 0., fsh = 0., fsz = mix(1., 1.6, smoothstep(2.4, 4., vI.x)); vec2 so = -uSunL.xz*.16;   // (a wide well holds bigger fish: a forearm and more long, seen from the line as fish)
  for (int i = 0; i < 5; i++) {
    float fi = float(i), dir = mod(fi, 2.) < .5 ? 1. : -1., r0 = (.2 + .13*fi + .1*sin(uTime*.31 + fi*2.7))*min(vI.x*.82, 2.6);
    float a = dir*uTime*(.34 + .07*fi)/max(r0, .3) + fi*1.9 + vRnd*40.;
    vec2 c = vec2(cos(a), sin(a))*r0, t = vec2(-sin(a), cos(a))*dir, d = rc - c, d2 = d - so;
    float al = dot(d, t), ac = dot(d, vec2(t.y, -t.x)) + .012*sin(al*38. - uTime*9. + fi), tap = 1. - .6*smoothstep(.0, -.13, al);
    fish = max(fish, smoothstep(1., .72, length(vec2(al/(.13*fsz), ac/(.026*tap*fsz)))));
    float al2 = dot(d2, t), ac2 = dot(d2, vec2(t.y, -t.x));
    fsh = max(fsh, smoothstep(1.3, .5, length(vec2(al2/(.13*fsz), ac2/(.03*fsz)))));
  }
  float fK = floorM*nearW*step(.9, vI.x);
  fl *= 1. - .4*fsh*fK; fl = mix(fl, vec3(.05, .06, .055) + vec3(.25, .27, .26)*smoothstep(.6, 1., fish)*.6, fish*fK*.9);
  alb = mix(alb, fl, floorM);
  // sunlight comes down the shaft: lit where the (refracted) ray back toward the sun clears the rim; the net of light crawls over
  // the lit wall and the floor
  vec2 q = rc + uSunL.xz/max(uSunL.y, .2)*.62*max(below, 0.);
  float shaft = smoothstep(vI.x*1.02, vI.x*.86, length(q)); shaft = mix(shaft, max(shaft, .42), vI.z);   // (a sandy well is lit to its floor, the rim's shadow lying across it on the sun's side: a hole, not a pan)
  float cl = fcrCloud(vW.xz), nl = max(dot(N, uSunDir), 0.)*.8 + .2*floorM;
  vec2 cq = mix(vec2(arc, below*1.4), rp, floorM);
  float caus = (fcrCaus(cq*.6) + 1.2*fcrNet(cq*.75 + 3.)*nearW)*exp(-dw*.22);
  vec3 col = alb*(uSun*cl*nl*shaft*(.8 + 1.25*caus) + uSky*(.32 + .68*smoothstep(1.3, 0., below) + .36*vI.z*floorM + 1.4*uMirror*smoothstep(.12, .6, below)));   // (the sky's light thins down the shaft: the wall goes dark under the rim)
  col *= 1. - .6*min(uMirror*2., 1.)*smoothstep(.3, .02, below);            // a low sun: the lip is a ring of dark wet rock round the mirror
  float gz = 1. - max(dot(V, N), 0.);
  col += uSun*cl*.3*smoothstep(.25, 0., below)*pow(max(dot(reflect(-V, N), uSunDir), 0.), 24.);
  col += cHaze*lipM*(.05 + .32*gz*gz*gz)*(1. - .6*min(uMirror*2., 1.));       // the wet lip takes a glint of sky
  // THE WATER IN IT: clear, losing its red first and then its green with every metre the light travels down and back to the eye
  // (a shallow sandy well stays gold-green to its floor, a deep one goes through turquoise to blue)
  float sa = clamp(V.y, .06, 1.), sb = sqrt(1. - (1. - sa*sa)/1.7689), pw = dw/sb + dw*.6;
  vec3 T = exp(-pw*mix(vec3(.42, .13, .045), vec3(.19, .06, .034), vI.z));
  vec3 body = mix(cDeep*.8 + vec3(0., .02, .02), vec3(.1, .09, .46), uMirror)*(uSun*cl*(.55 + .35*shaft) + uSky*(.7 + 2.2*uMirror));
  col = mix(col*T, body, 1. - exp(-pw*mix(.13, .075, vI.z)));               // (depth is read by colour: gold at a sandy well's wall, green and turquoise over its floor; a deep one blue to black-blue)
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'fcr-wells';
  return mesh;
}

// ---- the water surface: a thin clear sheet that follows the bed down every step ------------------------
const FOG_PREMULT = /* glsl */`
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1. - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, fogColor*a, ff);
  #endif
`;
async function buildWater(L, U, ctx) {
  // (round 22) the water each lip is given, for fcrLip: lip by lip (a row each, the seven steps then the last fall) and x by x
  // (a quarter metre to a texel over the mask's own width), the least depth the mask's own picture has at 0.3, 0.65 and 1 m
  // above the lip on the lip's true line (the mask read between its texels as the shaders read it; its alpha is depth in
  // centimetres). Made here once, handed to the sheet and the falls with U; the engine frees it with their materials.
  const NLX = 256, lipD = new Float32Array(NLX * (NSTEP + 1));
  {
    const md = U.uMask.value.image.data, al = (i, j) => md[(j * TW + i) * 4 + 3], hf = new Uint16Array(lipD.length);
    const wet = (x, z) => {
      const fx = clamp(((x - TX0) / (TX1 - TX0)) * TW - 0.5, 0, TW - 1.001), fz = clamp(((z - Z_END) / (Z_TOP - Z_END)) * TH - 0.5, 0, TH - 1.001), i = Math.floor(fx), j = Math.floor(fz);
      return lerp(lerp(al(i, j), al(i + 1, j), fx - i), lerp(al(i, j + 1), al(i + 1, j + 1), fx - i), fz - j) * 0.01;
    };
    for (let k = 0; k <= NSTEP; k++) {
      const zl = k === NSTEP ? Z_LAST : Z_BRINK - STEP * k;
      for (let i = 0; i < NLX; i++) { const x = TX0 + ((i + 0.5) * (TX1 - TX0)) / NLX, d = Math.min(wet(x, L.zOf(x, zl + 0.3)), wet(x, L.zOf(x, zl + 0.65)), wet(x, L.zOf(x, zl + 1))); lipD[k * NLX + i] = d; hf[k * NLX + i] = THREE.DataUtils.toHalfFloat(d); }
    }
    const lt = new THREE.DataTexture(hf, NLX, NSTEP + 1, THREE.RedFormat, THREE.HalfFloatType);
    lt.minFilter = lt.magFilter = THREE.LinearFilter; lt.wrapS = lt.wrapT = THREE.ClampToEdgeWrapping; lt.needsUpdate = true;
    U.uLip = { value: lt };
  }
  const xs = [-27.5, -25.5]; for (let x = -24; x <= 24; x += 1) xs.push(x); xs.push(25.5, 27.5);   // the bed's own columns: the lips coincide
  const zs = [116, 108, 100, 95, 92.5];
  const drop = (z0, w, foot) => { for (const k of [0.3, 0, -0.25, -0.5, -0.75, -1]) zs.push(z0 + k * w); for (const f of foot) zs.push(z0 - w - f); };
  drop(Z_LEDGE + 0.65, 1.0, [0.8, 2.2, 4.5, 7.5]);
  for (let z = 78; z > -80; z -= 6) zs.push(z);
  zs.push(-82.5, -85, -87.5, -89.3);
  for (let i = 0; i < NSTEP; i++) drop(Z_BRINK - STEP * i - 0.35, FACE, [0.5, 1.6, 3.2, 5.4, 8, 10.6, 12.6, 13.7]);
  drop(Z_LAST - 0.35, 1.0, [1, 2.5, 5, 9, 14, 20, 28, 36]);
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), zn = new Float32Array(nx * nz);
  // the river piles up unevenly before it goes over: humps on every lip (the last fall's the tallest), so seen from behind
  // the edge of a fall is a lumpy line of water and never a ruled one
  const lipHump = (x, zn) => {
    let w = (1 - smoothstep(-194, -187.5, zn)) * smoothstep(-196.1, -195.3, zn), k = 9, a = 1;
    for (let i = 0; i < NSTEP && w <= 0; i++) {
      const zl = Z_BRINK - STEP * i;
      if (zn < zl + 5 && zn > zl - 0.9) { w = (1 - smoothstep(zl + 0.6, zl + 5, zn)) * smoothstep(zl - 0.8, zl - 0.3, zn) * smoothstep(3, 8, Math.abs(x)); k = i; a = 0.6; }
    }
    return w > 0 ? w * a * (0.6 * Math.max(0, L.noise.n2(x * 0.55 + 31 + k * 13.7, 2.7 + k)) + 0.25 * Math.max(0, L.noise.n2(x * 1.7 + 3 + k * 5.1, 9.1))) : 0;
  };
  for (let j = 0; j < nz; j++) {
    if ((j & 31) === 31) await ctx.yield();
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = L.zOf(x, zs[j]), o = j * nx + i, zt = L.znOf(x, z);
      pos[o * 3] = x; pos[o * 3 + 1] = L.waterY(zt) + lipHump(x, zt); pos[o * 3 + 2] = z;
      zn[o] = zt;                                                        // the unwarped coordinate of the vertex itself: every fall is found per pixel
    }
  }
  const idx = []; for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aZn', new THREE.BufferAttribute(zn, 1)); g.setIndex(idx); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
    vertexShader: /* glsl */`
varying vec3 vL; varying vec3 vW; attribute float aZn; varying float vZn;
#include <fog_pars_vertex>
void main(){ vL = position; vZn = aZn; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vW; varying float vZn;
uniform sampler2D uMask; uniform vec4 uMaskRect;
uniform vec3 uSunDir, uSun, uSky, cDeep, cHaze, cZen; uniform float uReflCap, uGlint, uWhite, uMirror; uniform vec4 uStack, uPeri;
${GL_NOISE}${CLOUD_SHADOW_GLSL}${GL_WATER}${GL_TREAD}
${GL_FALLS}${GL_CREAM}
#include <fog_pars_fragment>
void main(){
  vec4 M = texture2D(uMask, (vL.xz - uMaskRect.xy)*uMaskRect.zw);
  float depth = M.a*2.55, weed = clamp(M.g*2. - 1., 0., 1.);
  vec2 p = vL.xz; float flow = uTime*2.2, cl = fcrCloud(vW.xz);
  vec3 Vv = cameraPosition - vW; float dist = length(Vv); vec3 V = Vv/max(dist, 1e-3);
  float farF = smoothstep(14., 42., dist), nearE = smoothstep(17., 6., dist), nearC = smoothstep(30., 9., dist);   // fine foam detail is for the near water: far off it would only be pixel noise
  // WHERE ON THE STAIRCASE, per pixel. Lips stand at zn = 90 (the ledge, 6 m), -90 - 15k for k = 0..6 (1.7 m) and -195 (the last
  // fall, 6 m). The coordinate is roughened first, so no lip, sheet or foam edge follows a polygon.
  float rag = vn(vec2(p.x*2.1, p.y*1.3 + flow*.6))*.6 + vn(vec2(p.x*5.3 + 4., p.y*2.9 + flow))*.4;
  float rag2 = vn(vec2(p.x*.83 + 7., p.y*.4 + 3.));
  float zc = vZn + ((rag - .5)*.55 + (rag2 - .5)*.8)*(1. + 1.3*smoothstep(-186., -192., vZn));   // (the last fall tears widest)
  float si = clamp(floor((-90. - zc)/15.), -1., 7.);                     // the lip last passed: -1 the ledge, 0..6 the steps, 7 the last fall
  float lipUp = si < -.5 ? 91. : -90. - 15.*si, lipDn = si > 6.5 ? -999. : -90. - 15.*(si + 1.);   // (the ledge's sheet starts a metre early)
  float bigU = (si < -.5 || si > 6.5) ? 1. : 0.;
  if (zc > 91.) { lipUp = 999.; lipDn = 91.; bigU = 0.; }
  float below = lipUp - zc, ahead = zc - lipDn, onSteps = smoothstep(-86., -91., vZn);
  float faceW = mix(.6, 1., bigU), tf = (below - .35 - faceW*.5)/(faceW*.5 + .42);
  float fall = max(1. - tf*tf, 0.); fall *= fall;                         // the falling sheet
  fall *= smoothstep(.1, .3, lipUp - vZn);                                // (it starts where the surface itself goes over: the roughened lip may tear it lower, never paint it on the flat tread above)
  float footLen = bigU > .5 ? (si < -.5 ? 9. : 11.) : 6.5;
  float ft = below > .35 + faceW ? (below - .35 - faceW)/footLen : 3.;    // 0 at the foot of the fall, 1 a boil-band further on
  float crest = max(smoothstep(2.1, .1, ahead)*step(-900., lipDn), smoothstep(.55, .0, below))*mix(.55, 1., onSteps);   // the water whitens as it gathers speed for the edge
  float nearT = onSteps*smoothstep(30., 9., dist);
  float lineK = mix(1., .82 + .18*smoothstep(1.5, 6., abs(p.x)), onSteps);
  float ftb = ft*mix(1.5, 1., bigU);                                      // (a 1.7 m step boils for two metres, a 6 m fall for five)
  // THE TREADS (the same sums as the bed and the frond planting): b metres below the lip above, the basin's ragged end, the runnels
  float inS = step(vZn, -90.)*step(-195., vZn), kS = floor((-90. - vZn)/15.), bS = -90. - 15.*kS - vZn;
  float bEnd = fcrBasinEnd(p), eN = fcrEdge(p), laneS = fcrLane(p), sT = clamp((bS - bEnd)/(15. - bEnd), 0., 1.);
  float boil = smoothstep(0., .07, ftb)*smoothstep(.5, .1, ftb);         // broken white at the foot of each fall ...
  float lace = smoothstep(.04, .3, ft)*smoothstep(mix(1.45, 1.35, bigU), .3, ft)*mix(.6, 1., bigU);   // ... trailing down the tread in torn flecks, for metres below a pour
  float spt = fcrSpout(p, bS), crd = fcrCord(p, bS);                       // a spout (the heart of a white cord) pours over the lip above this point
  lace *= mix(1., smoothstep(bEnd + 4.6, bEnd - .6, bS)*(.1 + .9*crd), inS);   // (on a step: below the white stretches of its lip, drifting on past the pocket and thinning)
  float laneD = laneS - fcrLaneThr(sT) + eN*.05 + uWhite*.08;
  float runl = inS*step(.9, bS)*smoothstep(-.07, .05, laneD)*smoothstep(bEnd - .2, bEnd + 1.6, bS);   // a runnel: a thread of clear water between the red ribbons, widening to the next lip
  float foot = max(boil, lace*.4);
  float basin = smoothstep(.0, .1, ft)*smoothstep(1.05, .3, ft)*(1. - bigU);            // the plunge basin under every step ...
  basin = mix(basin, smoothstep(.85, 1.25, bS)*(1. - smoothstep(-.12, .12, bS - bEnd + eN*.5))*spt, inS);   // ... a short pool with a torn edge, clear to its floor
  float riffle = smoothstep(.12, .04, depth)*smoothstep(0., .03, depth)*(1. - .85*nearT)*(1. - crest);
  vec2 g = fcrRip(p)*.045 + .1*vec2(vn(vec2(p.x*2.6, p.y*1.7 + uTime*1.6)) - .5, vn(vec2(p.x*1.3 + 9., p.y*1.1 + uTime*2.1)) - .5);
  g += .14*vec2(vn(p*5. + vec2(0., flow*2.)) - .5, vn(p*5.3 + vec2(7., flow*2.3)) - .5)*(riffle + foot*2. + crest + uWhite)*(1. - .75*farF);
  g *= (1. + 1.0*smoothstep(.4, 1., depth))/(1. + dist*.01);
  vec3 N = normalize(vec3(-g.x, 1., -g.y));
  float nv = max(dot(N, V), 0.), f1 = 1. - nv, fres = min(.02 + .98*f1*f1*f1*f1*f1, uReflCap)*(1. - .75*fall);
  float still = smoothstep(.55, 1.5, depth)*(1. - fall)*(1. - foot);
  float slick = clamp(1. - abs(M.g*2. - 1.)*2.2, 0., 1.)*smoothstep(.015, .09, depth)*(1. - fall)*(1. - foot)*(1. - .55*onSteps);
  float sdfW = M.b*6. - 2.; slick *= smoothstep(.55, 1.1, sdfW);           // (never the lip of a well: it stays a ring of dark rock)
  vec2 tc = Vv.xz/max(length(Vv.xz), 1e-3);
  float sdfN = texture2D(uMask, (vL.xz + tc*.8 - uMaskRect.xy)*uMaskRect.zw).b*6. - 2.;
  // a well mirrors the sky from a hand inside its rim (the lip stays a ring of dark rock), and only on its far side: on the side
  // nearest the eye we look down into it, blue-violet. (sdfN - sdfW = how the rim distance changes toward the eye: +1 near side, -1 far)
  float inW = step(sdfW, .0), nearSide = smoothstep(-.95, .45, (sdfN - sdfW)/.8), rimIn = smoothstep(-.06, -.38, sdfW);
  float lowRock = slick*min(uMirror*2.4, 1.);                              // bare rock under a film at a low sun: seen crisp through the water, joints and all, never a veil of sky
  fres *= 1. - .7*lowRock;
  fres = max(fres, uMirror*max(mix(still, rimIn*mix(1.8, .16, nearSide), inW), .06*slick*(.55 + .9*f1)));   // low sun: the wells, the channel and the bare wet rock lie as mirrors of the sky
  fres = max(fres, max(min(uMirror*2.2, .75), .3*inS)*basin*(1. - .7*boil)*(1. - fall));   // ... and so does the basin under every step of the staircase (by day a clear glass with the sky in it)
  fres *= 1. - .5*inW*(1. - min(uMirror*2.4, 1.));                          // (by day a well is looked INTO: half the sky's veil is taken off it)
  fres = max(fres, .3*inW*rimIn*smoothstep(.75, .1, nearSide)*(1. - min(uMirror*2.4, 1.)));   // (... and on its far side, from a hand inside the rim, the sky lies on it: a pale crescent across the hole from the eye)
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  vec3 sky = mix(cHaze, cZen, smoothstep(0., .4, R.y));
  sky = mix(sky, cHaze*1.08, uMirror*smoothstep(.3, .75, vn(R.xz*2.6 + p*.03 + uTime*.01))*.8);   // cloud in the mirror
  sky *= mix(vec3(1.), vec3(1.16, .84, .88), min(uMirror*2., 1.));           // (a low sky lies rose in still water)
  sky = mix(sky, cHaze*mix(vec3(1.51, .76, .55), vec3(1.5, .96, .4), smoothstep(.4, .3, uMirror)), min(uMirror*3.2, .9)*basin*(.42 + .58*smoothstep(.25, .7, vn(p*.3 + uTime*.03))));   // (the basins hold the lit cloud of a low sky: gold at the golden hour, rose-gold at dawn)
  float lowB = min(uMirror*3., 1.)*basin;                                    // (a low sky in a pocket: deepening to violet toward the lip above, the tread's dark reflection along its far edge)
  sky *= mix(vec3(1.), vec3(.6, .5, .74), lowB*smoothstep(bEnd*.8, 1.2, bS))*(1. - .55*lowB*smoothstep(bEnd - 1.3, bEnd - .1, bS + eN*.5));
  sky = mix(sky, cHaze*vec3(1.2, .5, .6), inW*smoothstep(1., .35, nearSide)*min(uMirror*2., 1.));   // the far edge of a well holds the low rose sky itself
  // the sun's road: a broad lobe broken into small travelling sparkles, never a sheet of white
  float sd = max(dot(R, uSunDir), 0.), road = pow(sd, 36.);
  float spk = smoothstep(.8, .96, vn(p*24. + uTime*vec2(1.3, 3.1)))*smoothstep(.4, .85, vn(p*6. - uTime*vec2(.5, 1.7)));
  float glint = (road*spk*1.6 + pow(sd, 700.)*.6)*uGlint*cl;
  float deepA = (1. - exp(-max(depth - .35, 0.)*.9))*.6;
  deepA *= mix(1., .2, inW*smoothstep(190., 80., dist)*(1. - min(uMirror*2.4, 1.)));   // (by day we look down into a well: its lit wall, its floor, its fish, from the ledge on; at a low sun it keeps its own blue-violet)
  deepA *= 1. - .64*inW*clamp(1. - M.g*2., 0., 1.)*(1. - min(uMirror*2.4, 1.));       // (a sandy well is glass down to its yellow floor from any distance; the deep ones stay blue)
  deepA = max(deepA, max(basin*.5, runl*.4*(1. - fall)));                    // a blue plunge pocket under every spout, a blue thread down every runnel
  // foam: long streamlines riding the current, sparkle on the riffles, cords over the lips and down the falls, boil at their feet
  // FOAM LINES: thin soft threads of foam drawn out along the streamlines, wandering, braiding, broken along their length, racing
  // down with the current (the same noise as before, stretched ten to one along the flow)
  vec2 fp = vec2(p.x, p.y + flow*1.5);
  float raft = smoothstep(.5, .8, vn(fp*vec2(.5, .1) + 3.));
  float flw = .03 + dist*.006;
  float fleck = smoothstep(flw, 0., abs(vn(vec2(fp.x*3.1 + 1.3*vn(fp*vec2(.8, .2) + 7.), fp.y*.5)) - .5))*smoothstep(.34, .64, vn(fp*vec2(2.1, 1.4) + 5.));
  float lines = raft*(fleck*smoothstep(30., 8., dist) + .08*smoothstep(10., 26., dist)*smoothstep(110., 50., dist));
  float foam = lines*.38*(1. - .5*nearT)*(1. - .7*basin)*(1. - .6*smoothstep(8., 2., dist)) + riffle*smoothstep(.68, .9, vn(vec2(p.x*6., (p.y + flow*1.4)*3.2)))*.5*(1. - .85*farF);
  // which stretches of a lip run white: cords a metre or two wide with ribbons of red between them, different on every lip
  float lk = si + (ahead < below ? 1. : 0.);                              // the nearest lip
  float cx = vn(vec2(p.x*.85 + lk*7.31, lk*3.7 + 5.))*.6 + vn(vec2(p.x*2.6 + lk*3.1, 9.))*.4;
  float cord = smoothstep(.4, .58, cx + (.5 - weed)*.16 + uWhite*.4);
  cord = mix(cord, smoothstep(-.1, .08, laneS - ${TS.toFixed(2)} + eN*.06 + uWhite*.1), smoothstep(-86., -88., vZn)*smoothstep(-198., -195.5, zc));   // (down the staircase a lip runs white where the tread's runnels reach it)
  float sy = vW.y*1.4 + uTime*6., sxw = p.x + .13*sin(sy*.8 + 3.*vn(vec2(p.x*1.3, sy*.2)));   // (the streaks of a falling sheet waver and braid: never a comb of ruled lines)
  float streak = vn(vec2(sxw*4.2, sy*.45))*.5 + vn(vec2(sxw*9.5 + 3., sy*.9))*.3 + mix(vn(vec2(sxw*21., sy*1.7)), .5, farF)*.2;
  // (passing under the eye a fall is glass with threads of white in it, and its lip a torn lace: never a white facet of the mesh)
  streak = mix(streak, vn(vec2(sxw*13., sy*.7))*.5 + vn(vec2(sxw*29. + 3., sy*1.3))*.5, smoothstep(10., 3.5, dist)*.8);   // (threads a finger wide there)
  foam += fall*mix(.1, 1., cord)*smoothstep(.3 + .1*nearE, .68 + .12*nearE, streak*.6 + cord*.5);     // white cords, the red bed between them
  float cs = vn(vec2(p.x*6.5, (p.y + flow*2.6)*2.2))*.55 + mix(vn(vec2(p.x*15., (p.y + flow*3.4)*5.)), .5, farF)*.45;
  foam += crest*cord*smoothstep(.62 - .5*crest + .22*nearC, .95 - .45*crest + .18*nearC, cs + .25*crest)*(1. - fall);  // the cords begin on the tread, torn at first
  float nb = vn(p*1.3 + vec2(0., flow*1.2))*.6 + vn(p*3.1 + vec2(3., flow*1.7))*.4;
  foam += boil*lineK*mix(1., .15 + .85*crd, inS)*smoothstep(.52 - boil*.14 + .1*inS, .84 - boil*.1 + .1*inS, nb + cord*mix(.12, .36, inS))*.9;   // (on the steps: thick under a spout, a thin lace between)
  float ls = vn(vec2(p.x*2.8 + .8*vn(p*.7), (p.y + flow*1.6)*1.1))*.55 + mix(vn(vec2(p.x*7.5, (p.y + flow*2.)*2.6)), .5, farF)*.45;
  foam += lace*(1. - .4*nearT)*(1. - .6*farF)*(1. - min(uMirror*2.6, .7)*basin)*smoothstep(.56 - lace*.1, .8, ls + cord*.1)
    *(.45 + .5*mix(vn(p*vec2(17., 3.5) + vec2(0., flow*4.)), .5, farF))*mix(.7, 1., bigU);   // streaks drawn out down the current, strongest below the cords, broken into flecks only near the eye
  foam += smoothstep(.035, .0, depth)*smoothstep(.3, .7, vn(p*3. + uTime*.4))*.35;      // lace at the shore and round rocks
  // on a step the white of the foot trails out across the basin in streaks drawn along the current, thick under a spout, and the
  // lip itself is a torn edge of white: seen from upstream, over the lip, these two are the fall
  float apr = inS*crd*smoothstep(.9, 1.5, bS)*(1. - smoothstep(bEnd - .6, bEnd + .9, bS + eN*.6));
  float aps = vn(vec2(p.x*2.6 + 1.2*vn(p*.6 + 5.), (p.y + flow*1.3)*.5))*.55 + mix(vn(vec2(p.x*6.5 + 2. + 1.5*vn(p*1.3 + 8.), (p.y + flow*1.7)*1.2)), .5, farF)*.45;
  float apt = mix(.42, .76, smoothstep(1., bEnd, bS)) - .3*cord;
  foam += apr*smoothstep(apt, apt + .32, aps)*.9;
  foam += inS*(.06 + .94*cord)*smoothstep(1.1, .05, 15. - bS + eN*.3)*smoothstep(.48 - .3*cord, .84 - .28*cord, cs)*.8*(1. - fall);   // (white at the lip where a cord goes over, a broken line: never a white strip along the whole edge)
  // THE PLUNGE POOL: clear water. Where the last fall lands the froth breaks into RAFTS, soft bodies of foam a metre or two across
  // with clear water between them; they drift out from the fall, fan apart and thin away, so that half
  // way to the ring the pool is glass with the bed under it. (round 27: a soft lace of threads lies round them: pnet, below.)
  float pool = step(6.5, si)*smoothstep(1.6, 6., below);
  vec2 lp = p + vec2(0., uTime*.42), lq = lp + 1.4*vec2(vn(lp*.21 + 3.), vn(lp*.21 + 9.));
  float thinP = smoothstep(4., 27., below);                                                 // fewer and smaller with every metre from the fall
  // (round 27) the rafts are the falls' own cream (GL_CREAM: bodies a stride across, as round as long, no edge to them) and
  // round them the same lace as at a step's foot: threads closing round cells of clear water, soft, wandering, thinning away
  vec2 qp = vec2(lq.x*.5, lq.y*2.), fqp = fwidth(qp);
  float Pp = fcrCream(qp, fqp), Sp = (.56 - .5*thinP)*smoothstep(34., 20., below);
  float raftP = fcrCreamW(Pp, Sp)*(.8 + .2*gn(lq*4.3 + 2.));
  vec2 qn = lq*vec2(1.5, 1.1) + .4*vec2(gn(lq*.7 + 3.), gn(lq*.7 + 8.));
  float pn1 = gn(qn + 11.), pn2 = gn(qn*2.1 + 4.), pf1 = fwidth(pn1)*1.3, pf2 = fwidth(pn2)*1.3;
  float pnet = max((1. - smoothstep(0., .075 + pf1, abs(pn1 - .5)))*.075/(.075 + pf1), .8*(1. - smoothstep(0., .1 + pf2, abs(pn2 - .5)))*.1/(.1 + pf2));
  foam += pool*max(raftP, pnet*.8*smoothstep(.02, .3, Sp + (Pp - .5)*.3)*mix(smoothstep(.42, .66, gn(lq*.3 + 20.)), 1., smoothstep(.36, .56, Sp)))*.9;   // (the lace lies round the fall and, further out, in drifting patches: half way to the ring the pool is glass)
  // the island in the pool (uStack: x, z, half-length across the river, half-width along it): the outflow piles a white pillow
  // against its up-river face, lace gathers round its foot and rings run out from it
  vec2 sq = (p - uStack.xy)/max(uStack.zw, vec2(.2)); float sdk = (length(sq) - 1.)*min(uStack.z, uStack.w), sOn = step(.25, uStack.z);
  float ring = smoothstep(.24, .02, abs(fract(sdk*.62 - uTime*.33) - .5))*smoothstep(5., .6, sdk)*smoothstep(-.4, .2, sdk);
  float upF = smoothstep(-.3, .8, sq.y/max(length(sq), .05));                                // 1 on the face the current meets
  foam += sOn*(ring*.32*(.45 + .55*vn(p*1.9 + uTime*.3)) + smoothstep(.75 + .9*upF, .0, abs(sdk - .1))*(.5 + .45*upF)*smoothstep(.25 - .2*upF, .7, vn(p*2.6 + uTime*vec2(.5, .9))));
  foam = clamp(foam, 0., 1.);
  // right under the eye foam is lace with the bed showing through it, never a flat white sheet
  vec2 pe = vec2(p.x, p.y - vL.y*1.3);                                       // (height counts too: down a fall's face the pattern must not stretch)
  float thinA = vn(pe*vec2(9., 5.) + vec2(0., flow*3.))*.6 + vn(pe*vec2(21., 11.) + vec2(4., flow*5.))*.4;
  float nr2 = smoothstep(8., 3., dist);                                         // (on the steps: threads a hand wide, running with the water; a finger wide right under the eye)
  float thinB = vn(vec2(pe.x*6.5 + 1.5*vn(pe*vec2(1.2, .5)), pe.y*1.2 + flow*3.))*(.6 - .3*nr2) + vn(vec2(pe.x*15. + 2.*vn(pe*vec2(2.3, .9) + 3.), pe.y*2.4 + flow*5.))*.4
    + vn(vec2(pe.x*33. + 2.5*vn(pe*vec2(5., 1.7) + 6.), pe.y*4.5 + flow*7.))*.3*nr2;
  foam *= 1. - smoothstep(15., 5., dist)*(.26 + .62*smoothstep(.64, .3, mix(thinA, thinB, onSteps)));
  // THE THREADS: where a tread's runnels gather, threads of white water race toward the lip: a few, a hand wide and broken, high on
  // the tread; braiding and thickening as the runnel opens (fcrLaneThr); a spout at the lip. Soft-edged, wavering, never ruled;
  // drawn after the thinning above so they stay crisp under the eye.
  float tcord = runl*(1. - fall)*smoothstep(.62, .45, depth);
  vec2 cq = vec2(p.x + .2*sin(p.y*1.3 + 2.4*vn(p*.7 + 3.)), p.y + flow*2.4);
  float fil = vn(vec2(cq.x*5.5 + 1.7*vn(cq*vec2(1.1, .45)), cq.y*.6))*.6 + mix(vn(vec2(cq.x*13. + 2.6*vn(cq*vec2(2.1, .8) + 4.), cq.y*1.4 + 5.)), .5, farF)*.4;
  tcord *= mix(.25 + .75*smoothstep(.36, .58, vn(vec2(p.x*.9 + 3., (p.y + flow*.3)*.3))), 1., smoothstep(.7, 1., sT));   // (broken along its length, whole only where it nears the lip)
  float wK = tcord*(.45 + .55*smoothstep(.25, 1., sT));                       // the white gathers toward the lip
  // (right under the eye a spout is a sheaf of finger-wide threads with the bed between them, never a clot of white)
  fil = mix(fil, fil*.5 + .5*vn(vec2(cq.x*24. + 2.2*vn(cq*vec2(4., 1.4) + 2.), cq.y*2.6 + 1.)), nr2);
  // (round 27) the threads are the cream of the falls (GL_CREAM): long soft streaks on the runnel's water, gathering to a
  // veil at the lip; the old field (fil) keeps a tenth of a say in where they lie
  vec2 cqs = cq*vec2(2.2, 1.), fcq = fwidth(cqs);
  float Pt = fcrCream(cqs, fcq) + (fil - .5)*.1 + (fcrGrain(cqs*vec2(1.6, 1.), fcq*vec2(1.6, 1.)) - .5)*.24, St = wK*.46 + .06*clamp(laneD*4., 0., 1.)*tcord;
  foam = max(foam, tcord*fcrCreamW(Pt, St)*(.55 + .45*smoothstep(.2, .9, sT)));
  // (round 19) on the run up to each lip of the staircase, live's crest (the last 2.1 m), the white is the strands of the falls' own
  // mesh, which run on over the lip and down the fall: the sheet's own foam hands over to them there (not at the shore's lace)
  foam *= 1. - smoothstep(2.1, 1.3, 15. - bS)*step(vZn, -87.9)*step(-195., vZn)*smoothstep(.035, .1, depth)*fcrLip(p.x, kS + 1.);
  float lipSh = inS*max(smoothstep(1.2, .15, 15. - bS), smoothstep(.5, .0, bS))*(.35 + .65*vn(vec2(p.x*1.7 + kS*5., 2.)))*(1. - foam);   // the water bends over the lip: a band of sky in the glass
  float shore = smoothstep(0., .03, depth);
  vec3 lit = uSun*cl + uSky;
  float lane = .78 + .42*vn(vec2(p.x*1.5 + 1.5*vn(p*.6), (p.y + flow)*.8));
  vec3 col = sky*fres + cDeep*lit*.6*lane*deepA*(1. + .8*max(basin, runl*.8))*(1. - fres);
  float a = 1. - (1. - fres)*(1. - deepA);
  // THE SURFACE ITSELF: wavelets tip the sky toward the eye in travelling slivers of light, so the weed is seen THROUGH water.
  // None straight down under the eye; far off they merge into an even sheen.
  vec2 rq = vec2(p.x*.8 + .6*vn(p*.35 + 2.), (p.y + flow*.55)*2.4);
  float rw = vn(rq)*.6 + vn(rq*2.3 + 7.)*.4;
  float ripS = mix(smoothstep(.6, .78, rw), .2, smoothstep(13., 38., dist))*f1*f1*smoothstep(1.6, 5., dist)*(1. - .6*inS)*(1. - fall)*(1. - .7*inW)*(1. - .85*lowRock);
  col += sky*ripS*.5*(1. - fres); a = min(a + ripS*.45, 1.);
  // rings run out over the well where the pair came up (uPeri: x, z, radius, how far they are out)
  float pd = length(p - uPeri.xy), prs = uPeri.w*smoothstep(uPeri.z*1.04, uPeri.z*.8, pd)*smoothstep(.3, .9, pd)*smoothstep(.5, .95, sin(pd*6.5 - uTime*4.6)*.5 + .5)*(.55 + .45*vn(p*2.3 + uTime*.3));
  col += sky*prs*.6*(1. - fres); a = min(a + prs*.5, 1.);
  // every well laps: faint rings run in from its rim, the sky tipped toward the eye on each
  float wring = inW*smoothstep(.5, .93, sin(sdfW*8.5 + uTime*2.3)*.5 + .5)*smoothstep(-1.5, -.15, sdfW)*(.35 + .65*vn(p*1.7 + uTime*.2))*smoothstep(60., 14., dist);
  col += sky*wring*.2*(1. - fres); a = min(a + wring*.22, 1.);
  float bnet = min(fcrCaus(p*.62 + 3.) + 1.1*fcrNet(p*.8 + 2.)*smoothstep(16., 5., dist), 1.7)*max(basin, runl*.6)*smoothstep(46., 5., dist)*(1. - fres);       // a basin is clear blue water with the light's net in it, not a dark blot
  bnet *= 1. - min(uMirror*3., 1.);                                          // (not when the basin is a mirror of the low sky)
  col += vec3(.3, .58, .9)*lit*.26*bnet; a = min(a + bnet*.2, 1.);
  col += sky*lipSh*.24; a = min(a + lipSh*.22, 1.);
  float aer = apr*smoothstep(bEnd + .3, 1.2, bS)*(.55 + .45*cord)*(1. - min(uMirror*2.6, .8));
  col = mix(col, vec3(.3, .7, .76)*lit*.46, aer*.6); a = mix(a, 1., aer*.55);      // under a fall the basin is aerated, pale turquoise, clearing to blue
  float aerP = pool*smoothstep(15., 3., below)*(.45 + .55*smoothstep(.3, .7, vn(lq*.5 + 7.)))*(1. - min(uMirror*2.6, .7));
  col = mix(col, vec3(.3, .72, .78)*lit*.5, aerP*.55); a = mix(a, 1., aerP*.5);     // ... and so is the pool where the last fall lands: milk-turquoise, clearing to glass
  // white water has a body: on the staircase it is modelled by the sun at three scales, GENTLY (round 27: the side toward the sun a
  // little brighter, the lee a tint of the sky; no clot has two colours), and thin foam is pale turquoise
  vec2 so = normalize(uSunDir.xz + vec2(1e-4, 0.))*.38, q1 = pe*vec2(1.6, 1.1) + vec2(0., flow*1.1), q2 = pe*vec2(4.3, 3.) + vec2(5., flow*2.), q3 = pe*vec2(11., 7.5) + vec2(9., flow*3.4);
  float relief = (vn(q1) - vn(q1 + so))*.5 + (vn(q2) - vn(q2 + so))*.3 + mix(vn(q3) - vn(q3 + so), 0., farF)*.2;
  float onB = onSteps*smoothstep(90., 30., dist), body = clamp(1. + 1.2*relief, .6, 1.2);
  vec3 fc = mix(vec3(.86, .9, .93), vec3(.9, .925, .93), onSteps)*lit*mix(.82, .68 + .16*body, onB);
  fc = mix(fc, vec3(.62, .76, .9)*(uSky*2.2 + uSun*cl*.3), onB*smoothstep(1., .6, body)*.2);
  fc = mix(vec3(.4, .7, .78)*lit*.5, fc, mix(1., smoothstep(.12, .6, foam), onSteps));
  col = mix(col, fc, foam); a = mix(a, 1., foam*.92);
  col += uSun*glint*4.5; a = min(a + glint, 1.);
  col *= shore; a *= shore;
  // (round 19) the seven falls of the staircase and the last fall, lip to foot, are drawn by the falls' own mesh (fcr-falls): on
  // their ground this sheet draws nothing (its painted sheet on the face, its foot and its pocket there are replaced, not retuned)
  { float fo = max(fcrFallsOwn(bS, spt, bEnd, eN, step(vZn, -195.))*step(vZn, -90.)*step(-210., vZn), smoothstep(14.8, 15., bS)*step(vZn, -89.)*step(-195., vZn))*fcrLip(p.x, kS + step(10., bS)); col *= 1. - fo; a *= 1. - fo; }   // (round 22: where the lip above, or the lip just ahead, is given water at this x)
  // (a riser to whose lip no water comes at this x is dry rock: the sheet paints no fall on it, though the mask marks the tread
  // below it wet right up to its foot. The sheet takes up again, softly, where the face reaches the level below)
  { float fw = mix(.6, 1., step(vZn, -195.)), dF = step(vZn, -90.)*step(-200., vZn)*(1. - fcrLip(p.x, kS))*smoothstep(.1, .3, bS)*(1. - smoothstep(fw + .4, fw + .8, bS)); col *= 1. - dF; a *= 1. - dF; }
  ${FOG_PREMULT}
  gl_FragColor = vec4(col, a);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 3; mesh.name = 'fcr-water';
  await ctx.yield();
  mesh.add(await buildFalls(L, U, lipHump, xs, lipD, NLX, ctx));                    // (round 19) the falls ride with the sheet they are cut from
  await ctx.yield();
  return mesh;
}

// ---- (round 19) THE FALLS OF THE STAIRCASE: falling water ------------------------------------------------
// Each of the seven falls and the last fall is a body of its own, from the lip to the end of its foot (the ground of GL_FALLS):
//   THE LIP AND THE SHEET. The tread's film (h = WATER_T + flood) goes over the edge at the speed of its own wave, v = sqrt(g h)
//   (1.47 m/s on 0.22 m of water: a free overfall runs critical at its brink), from where live's sheet leaves the level, 0.35 m
//   past the rock's lip (waterY), and falls free: s = v t out, g t^2 / 2 down. A step's 1.7 m takes 0.59 s and throws the sheet
//   0.87 m, so it lands 1.22 m below the lip: in live's own boil (0.95 to 3.1 m) and under live's own spray (0.9 to 1.7 m). The
//   last fall's 6 m take 1.11 s and throw it 1.63 m. The lip is therefore ROUND: the water bends over it on that parabola.
//   THE MESH follows the lip's true line (zOf), not the bed's 1 m columns: a new column wherever the line has turned 8 degrees
//   or run 1 m (the sagitta of such a chord is under 2 cm), about two columns to the metre round the noses. Down the sheet the rows
//   stand where its slope is 30 and 60 degrees (76 too on the last fall) and where it lands. Every column has a vertex on the bend
//   (the 30-degree row: the line the eye upstream sees the lip by); the other rows, and the level foot, take every second column.
//   THE WHITE is where live's lane sums put it: a lip runs white where fcrLane at the lip is over TS (fcrCord's own edges, and
//   uWhite widens it as it widens live's cords), the weed goes over in glass between; the boil is thick under a white stretch and
//   a lace between (live's own .15 + .85 crd); the pocket is under a spout (fcrSpout, TP). The white itself is one field of
//   foam that the water carries (fcrCream, round 27): strands on the run up to a lip and down the sheet, the same strands churned at the foot.
// WHAT HERE READS THE EYE (round 27), and nothing else does: the pixel's footprint (fwidth) as a level of detail of the cream and
// the lace; the direction to the eye for the sky on the tongue (Fresnel) and for sil and fz, by which the white of a sheet thins
// away where the sheet turns from the eye. The sheet is drawn by its front faces only: a face turned from the eye is not drawn.
// No distance to the eye, no clock but uTime. Light is the sun on the surface's
// own normal and on the foam's own relief. Nothing here draws a random number: every place is the layout's own.
async function buildFalls(L, U, lipHump, xs, lipD, NLX, ctx) {
  const G = 9.81, B0 = 0.35, V0 = Math.sqrt(G * (WATER_T + L.flood)), RUN = 2.1;   // (RUN: live's own crest, the last 2.1 m before an edge, where the water whitens as it gathers for it)
  const TURN = (8 * Math.PI) / 180, SMAX = 1.0, DX = 0.1;
  // live's sheet between its own columns: the root of a fall lies in the sheet's own surface, humps and all
  const humpAt = (x, zn) => { let i = 0; while (i < xs.length - 2 && xs[i + 1] <= x) i++; const f = clamp((x - xs[i]) / (xs[i + 1] - xs[i]), 0, 1); return lerp(lipHump(xs[i], zn), lipHump(xs[i + 1], zn), f); };
  const P = [], Nn = [], A = [], lipsI = [];                              // position | normal | (b, fall time, metres past the landing, lip) | each lip's cells
  for (let k = 0; k <= NSTEP; k++) {
    const big = k === NSTEP, zl = big ? Z_LAST : Z_BRINK - STEP * k, yTop = L.waterY(zl + 1), yBot = L.waterY(zl - 5);
    const footB = (big ? FOOT_L : FOOT_S) + 0.3, pockB = [5.5, 7.65];       // (7.65: the longest pocket, 6.45 + 0.5 + 0.42 + 0.24 = 7.61, and 0.04 m to spare; the foot has 0.3 m)
    // (round 22) THE MESH IS AS WIDE AS THE WATER THAT COMES TO ITS LIP (lipD, the table fcrLip reads) and half a metre more
    // either side: the table's outermost wet place is within a quarter metre of the water's edge.
    let xa = Infinity, xb = -Infinity;
    for (let i = 0; i < NLX; i++) if (lipD[k * NLX + i] > 0) { const x = TX0 + ((i + 0.5) * (TX1 - TX0)) / NLX; xa = Math.min(xa, x - 0.5); xb = Math.max(xb, x + 0.5); }
    if (!(xb > xa)) continue;                                              // (a lip that no water comes to has no fall)
    const lipZ = (x) => L.zOf(x, zl - B0), cols = [xa];
    let zp = lipZ(xa), hp = null, turn = 0, run = 0;
    for (let x = xa + DX; x < xb - DX * 0.5; x += DX) {
      const z = lipZ(x), hd = Math.atan2(z - zp, DX); if (hp !== null) turn += Math.abs(hd - hp); hp = hd; run += Math.hypot(DX, z - zp); zp = z;
      if (turn >= TURN || run >= SMAX) { cols.push(x); turn = 0; run = 0; }
    }
    if (cols.length % 2 === 1) cols.push((cols[cols.length - 1] + xb) / 2);
    cols.push(xb);                                                        // (an even count of cells: they pair off the bend)
    const ang = big ? [30, 60, 76] : [30, 60], NA = ang.length;
    // rows: 0 the root, RUN up the tread | 1..NA down the sheet | NA+1 the landing | NA+2 the landing again, level | NA+3 the foot's end | +4, +5 the pocket
    const NRW = NA + 6, base = P.length / 3, nc = cols.length;
    const put = (x, y, b, d, t, sl, up) => {
      const z = L.zOf(x, zl - b);
      if (up) Nn.push(0, 1, 0); else { const zx = (L.zOf(x + 0.1, zl - b) - L.zOf(x - 0.1, zl - b)) / 0.2, l = Math.hypot(zx * d, 1, d); Nn.push((zx * d) / l, 1 / l, -d / l); }   // (the sheet's own normal: z = lip(x) - s, y = y0 - g t^2 / 2)
      P.push(x, y, z); A.push(b, t, sl, k);
    };
    for (let i = 0; i < nc; i++) {
      const x = cols[i], y0 = yTop + humpAt(x, zl - B0), T = Math.sqrt((2 * (y0 - yBot)) / G), bL = B0 + V0 * T;
      put(x, yTop + humpAt(x, zl + RUN), -RUN, 0, -(RUN + B0) / V0, 0, true);   // (the root, up the tread: the water there is still (RUN + B0) / v short of its take-off)
      for (const a of ang) { const d = Math.tan((a * Math.PI) / 180), t = Math.min((V0 * d) / G, T * 0.9); put(x, y0 - 0.5 * G * t * t, B0 + V0 * t, (G * t) / V0, t, 0, false); }
      put(x, yBot, bL, (G * T) / V0, T, 0, false); put(x, yBot, bL, 0, T, 0, true);
      put(x, yBot, footB, 0, T, footB - bL, true);
      for (const b of pockB) put(x, yBot, b, 0, T, b - bL, true);
    }
    await ctx.yield();                                                    // (each lip is two build steps: its vertices, then its cells)
    const at = (i, r) => base + i * NRW + r, I = [], It = [];              // (It: the tongue, from the root to the bend)
    lipsI.push([I, It]);
    for (let i = 0; i < nc - 2; i += 2) {                                  // (rows run toward -Z: wound so the faces look up)
      const j = i + 1, m = i + 2;
      It.push(at(i, 0), at(m, 0), at(j, 1), at(i, 0), at(j, 1), at(i, 1), at(m, 0), at(m, 1), at(j, 1));     // the lip to the bend: the bend's row has every column
      I.push(at(i, 1), at(j, 1), at(i, 2), at(j, 1), at(m, 2), at(i, 2), at(j, 1), at(m, 1), at(m, 2));      // the bend to the next row
      const cell = (r) => I.push(at(i, r), at(m, r), at(i, r + 1), at(m, r), at(m, r + 1), at(i, r + 1));
      for (let r = 2; r <= NA; r++) cell(r);
      cell(NA + 2);
      if (big) continue;
      // a pocket's two cells only where a spout pours within the pair (the shader's own sum, out to where the pocket's water has run out under the weed)
      let pk = false; for (let x = cols[i] - 0.3; x <= cols[m] + 0.3 && !pk; x += 0.15) for (const b of [1, 3, 5, 7]) if (laneJS(x, L.zOf(x, zl - b) + b) > TP - 0.3) { pk = true; break; }
      if (pk) { cell(NA + 3); cell(NA + 4); }
    }
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aF', new THREE.Float32BufferAttribute(A, 4));
  // (round 27) THE ORDER OF THE CELLS. Nothing here writes depth, and the tongue now has a body: a fall's own face and foot are
  // seen through its tongue from upstream, where the route always is, so each lip's face and foot are drawn before its tongue,
  // and the lips from the last fall up to the brink (what is further down the river first). The same cells, in another order.
  // (FRONT FACES ONLY since round 27, where live drew both sides: of a face only what is turned toward the eye is drawn, so
  // from upstream the steep part of a fall's face does not show white through the tongue of its own lip.)
  const I = []; for (let k = lipsI.length - 1; k >= 0; k--) for (const part of lipsI[k]) for (let i = 0; i < part.length; i++) I.push(part[i]);
  g.setIndex(I); g.computeBoundingSphere();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
    vertexShader: /* glsl */`
attribute vec4 aF; varying vec3 vL; varying vec3 vW; varying vec3 vN; varying vec4 vF;
#include <fog_pars_vertex>
void main(){ vL = position; vF = aF; vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal);
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vW; varying vec3 vN; varying vec4 vF;
uniform sampler2D uMask; uniform vec4 uMaskRect;
uniform vec3 uSunDir, uSun, uSky, cDeep, cHaze, cZen; uniform float uWhite, uMirror;
${GL_NOISE}${CLOUD_SHADOW_GLSL}${GL_WATER}${GL_TREAD}${GL_FALLS}${GL_CREAM}
#include <fog_pars_fragment>
// THE BODY OF A FOAM: heaps of 0.8 m, 0.3 m and 0.14 m, as round as long (q in metres)
float fcrHeap(vec2 q){ return gn(q*1.3 + 2.)*.55 + gn(q*3.1 + 7.)*.3 + gn(q*7.3)*.15; }
void main(){
  vec2 p = vL.xz; float b = vF.x, tF = vF.y, sF = vF.z, big = step(6.5, vF.w), flow = uTime*2.2, cl = fcrCloud(vW.xz);   // (flow: live's own current, 2.2 m/s)
  // (round 22) level water (the run up, the foot) is where the mask is wet; the falling sheet is not cut by what lies under it; all of it only where its lip is given water at this x
  // (round 27: from a forearm short of the rock's lip the hand-over to "not cut" is made, not at the take-off: past the rock's lip the
  // mask's texels are the face's and the foot's, and cut the tongue in squares)
  float shore = mix(smoothstep(0., .03, texture2D(uMask, (p - uMaskRect.xy)*uMaskRect.zw).a*2.55), 1., smoothstep(-.35, -.1, b)*(1. - smoothstep(0., .15, sF)))*fcrLip(p.x, vF.w);
  float bEnd = fcrBasinEnd(p), eN = fcrEdge(p), spt = fcrSpout(p, b)*(1. - big);
  float own = fcrFallsOwn(b, spt, bEnd, eN, big)*shore, laneL = fcrLane(vec2(p.x, p.y + b));
  float ft = smoothstep(0., .15, sF);                                      // 0 on the falling sheet, 1 on the foot
  // (the pocket's water does not end at a ruled line: it runs out under the weed either side over a forearm or two, raggedly, the
  // fronds standing in it; the lane sum from TP - .2 to TP + .08)
  float pk = smoothstep(-.2, .08, laneL - ${TP.toFixed(2)} + .1*(vn(p*vec2(2.1, .9) + 3.) - .5))*(1. - smoothstep(-.12, .12, b - bEnd + eN*.5))*ft*(1. - big);
  float apr = (1. - smoothstep(-.2, 0., b))*shore;                          // the run up to the lip: there only the white is the falls' (the glass is the sheet's)
  if (max(max(own, pk*shore), apr) < .003) discard;
  // WHERE THE WHITE IS (live's sums). Below a lip: where the lip runs white (fcrCord's sum at the lip; uWhite as in live's cords).
  // On the run up to it: where the tread's runnel is (the lane sum over fcrLaneThr, which is TS at the lip itself; above the
  // brink, where no runnel is drawn, the brink's own sum), whitening over live's crest, the last 2.1 m.
  float sT = clamp((15. + b - bEnd)/(15. - bEnd), 0., 1.);
  float crdL = mix(laneL - ${TS.toFixed(2)}, fcrLane(p) - mix(fcrLaneThr(sT), ${TS.toFixed(2)}, step(vF.w, .5)), step(b, 0.)) + uWhite*.1, crd = smoothstep(-.07, .09, crdL);
  float ramp = smoothstep(-2.1, -.1, b);
  vec3 N = normalize(vN);
  vec2 so = normalize(uSunDir.xz + vec2(1e-4, 0.));
  vec3 lit = uSun*cl + uSky, litW = uSun*cl*max(uSunDir.y, 0.) + uSky;     // (level water takes the sun by its height in the sky)
  vec3 skyC = mix(cHaze, cZen, .6)*mix(vec3(1.), vec3(1.16, .84, .88), min(uMirror*2., 1.));   // the sky that lies in glass (live's rose at a low sun)
  // THE SHEET. It thins as it gains speed (the same water through a faster section: h v0 / v). fine is the share of its body it
  // has given up: none at the lip, three quarters at the foot of a step (5.96 m/s), seven eighths at the last fall's (10.9 m/s).
  float gv = ${G.toFixed(2)}*max(tF, 0.), thin = ${V0.toFixed(3)}/sqrt(${(V0 * V0).toFixed(3)} + gv*gv), fine = 1. - thin;
  float tau = uTime - tF;                                                  // the moment this water leaves the lip: it keeps it up the tread and down the fall
  // THE WHITE OF A CORD IS FOAM THE WATER CARRIES. It is laid out on the water itself: across the lip in metres (x) and along the
  // run in the metres the water has made at the lip's own speed (mF = v0 tau), so it goes up the tread and down the fall with
  // the water and at the water's speed, and is drawn out as the water gains speed: on the tread long streaks, down the fall
  // veils. (round 27) The field is fcrCream (GL_CREAM): soft bodies, a rim that thins, nothing cut.
  // The streaks swing a hand to either side over a stride or two of their run (0.19 m over 1.4 m and 0.6 m), so they close on
  // one another and part again: braided. (No line here is ruled along the lip or down the fall: every edge is the field's.)
  float mF = tau*${V0.toFixed(3)};
  // A VEIL FRAYS AS IT FALLS. At the lip a cord's two sides are where the lane sum puts them; from there down they wander with the
  // water (a field the fall carries: a stride and a forearm across, drawn out down the fall) and the sill between white and glass
  // widens, a hand at the lip to a forearm and more at the foot. Seen face on, no white of a fall has a ruled side.
  { float fray = smoothstep(.02, .5, tF)*step(0., b);
    crd = smoothstep(-.07 - .1*fray, .09 + .16*fray, crdL + ((gn(vec2(p.x*1.9 + 3., mF*.55)) - .5)*.34 + (gn(vec2(p.x*5.3, mF*1.3 + 7.)) - .5)*.16)*fray); }
  vec2 q = vec2(p.x + .25*(vn(vec2(p.x*1.3, mF*.7)) + .5*vn(vec2(p.x*2.9 + 5., mF*1.6)) - .75), mF), fq = fwidth(q);
  float grN = fcrGrain(q, fq), P = fcrCream(q, fq) + (grN - .5)*.2, Ps = fcrCream(q + so*.12, fq) + (grN - .5)*.2;   // (Ps: the same field a hand toward the sun; the grain parts a body into streaks)
  // HOW MUCH OF THE SHEET IS WHITE. In a cord: none where live's crest begins, 2.1 m up the tread, growing to three parts in five at the
  // edge, and falls as veils with as much glass between them (brk). Between cords the
  // water goes over as A TONGUE OF GLASS (below) and the sheet whitens only low down, to a quarter.
  float brk = smoothstep(0., .4, tF);
  // (over the lip itself the cord's water is a tongue: for the last metre of the run and over the bend the white opens into
  // streaks with glass between them, and closes again into the falling veil)
  float lipW = fcrLipW(p.x, vF.w), S = (crd*ramp*mix(.6, .55, brk)*(1. - .4*smoothstep(-1.3, -.2, b)*(1. - smoothstep(0., .35, b))) + (1. - crd)*.25*brk*fine)*lipW;
  float wN = fcrCreamW(P, S);
  // (a body of foam is thin at its rim and thick at its middle: the rim is a veil the water shows through)
  float thk = smoothstep(-.3, .7, fcrCreamD(P, S));
  // WHERE THE SHEET LANDS the boil stands up round its foot: heaps to a sixth of the fall's height (0.3 m of a step's 1.7 m,
  // 1.06 m of the last fall's 6 m; each as wide as it is high and its own height), so the line where the sheet meets the tread
  // is never seen (hA: metres above the landing, by the fall's own law). The heaps' tops are soft over their own height.
  float TL = mix(${Math.sqrt((2 * RISE) / G).toFixed(3)}, ${Math.sqrt((2 * 6) / G).toFixed(3)}, big), hA = ${(G / 2).toFixed(3)}*max(TL*TL - tF*tF, 0.);
  // (between the white stretches of a lip the sheet is thin glass, but it lands all the same: a low churn runs the whole length
  // of a fall's foot, three parts in five of a cord's, so the dark rock at the riser's base never shows as a line under the sheet)
  float hH = mix(.3, 1.06, big), up = (1. - smoothstep(-.1*hH, .6*hH, hA - hH*fcrHeap(vec2(p.x*mix(2.2, .62, big), uTime*.9))))*mix(max(.15 + .85*crd, .6), 1., big)*smoothstep(.0, .05, tF)*lipW*(.62 + .76*(P - .25));
  wN = max(wN, up); thk = max(thk, up);
  // glass: clear (the weed and the rock show through it); only as it stands steep does a little sky lie in it (water seen
  // square-on gives back a fiftieth of the light, a sixth at a slant): a band of it where the tongue bends over, and soft
  // glints a hand wide that run down with the water
  float sheen = (.1*smoothstep(0., .35, 1. - N.y) + .14*smoothstep(.45, .8, gn(mat2(.454, .891, -.891, .454)*(q*vec2(9., 2.2)) + 9.))*(1. - N.y))*smoothstep(-.05, .05, tF);
  // (round 27) THE TONGUE HAS A BODY. The film over the last metre of a tread is looked through at a slant: the eye's ray goes on
  // past the rock's lip (b = 0) and, in a clear pane, shows the foot of the fall below with the rock's ruled edge cut across it.
  // Water gathering for an edge is not a pane: over the last 0.2 m before the lip (where the falls' own ground begins: mine, below,
  // cuts gB's longer ramp off there) and on over the bend it deepens to the river's own blue-green (paler,
  // aerated, where a cord runs), and the sky lies on it where it bends over (Fresnel, by the direction to the eye, as on every
  // water here; the bend's normal is the mesh's own, taken up over the last half metre). It thins away again over the bend, by
  // the 30 degree row: the mesh's own edge against what lies below is then never a line of the picture, and lower down the
  // sheet is the clear glass with veils of white that it was.
  vec3 Nt = normalize(mix(vec3(0., 1., 0.), N, smoothstep(-.2, .48, b)));
  vec3 Vv = normalize(cameraPosition - vW); float f1 = 1. - max(dot(Nt, Vv), 0.), fr = .03 + .97*f1*f1*f1*f1*f1;
  float gB = smoothstep(-1.1, -.3, b)*(1. - smoothstep(.05, .47, b))*fcrLipW(p.x, vF.w);
  // (NO DARK LINE ALONG A LIP: where a cord goes over, and all along the last fall, the tongue's water is full of air, pale as
  // the foam either side of it; and the sky a tongue gives back to a low eye is the pale sky of the horizon, not the zenith's blue)
  vec3 tong = mix(mix(cDeep*.62, vec3(.3, .7, .76)*.46, crd*.6), vec3(.62, .8, .84)*.66, max(crd*.8, big*.62))*litW;
  vec3 skyT = mix(skyC, cHaze*mix(vec3(1.), vec3(1.16, .84, .88), min(uMirror*2., 1.)), smoothstep(.35, .9, f1));
  vec3 col = mix(skyC*sheen, tong*(1. - fr) + skyT*(fr + sheen*.5), gB); float a = mix(sheen, mix(.78, 1., fr), gB);
  // THE FOOT. Foam lies thickest where the sheet lands and thins to nothing at live's own reach (u: 0 at the landing, 1 there):
  // thick under a white stretch of the lip, a lace between (live's .15 + .85 crd); all along the last fall.
  // THE POCKET under a spout (live's own ground: fcrSpout, to fcrBasinEnd, torn as the bed's paint is): flecks of foam drift on
  // down it and thin away to its end; the water under the boil is aerated, pale turquoise (live's colour), clearing to the
  // river's own blue, the light's net and travelling wavelets on it.
  float bL = b - sF, Eb = mix(${FOOT_S.toFixed(3)}, ${FOOT_L.toFixed(3)}, big), u = clamp(sF/max(Eb - bL, .5), 0., 1.);
  float tl = clamp((b - Eb)/max(bEnd - Eb, .5), 0., 1.);
  // THE BOIL IS THE SAME FOAM, LANDED: the cords' own field, its bodies a fifth as long (the water has lost the fall's speed and
  // churns), drifting on down the tread. It is nearly whole where the sheet lands for the first third of the reach and thins
  // to nothing over the rest; it lies in heaps (hp), thick in clumps and open between. Bits of it drift on down the pocket to
  // its end; between the white stretches of a lip only a few (live's lace, .15 + .85 crd). (round 27) Where it thins it OPENS
  // INTO LACE: threads of foam round cells of the basin's water a forearm across (lnet, lace), so the white goes out into the green-blue
  // through a net and never at a line.
  // (the pocket is 0.38 m deep where the tread's film is 0.22: the same water goes through it at 0.58 of the current's speed)
  vec2 qf = vec2(p.x, p.y + flow*.58); qf += .3*vec2(vn(qf*.9 + uTime*.15), vn(qf*.9 + vec2(9., -uTime*.13)));
  float hp = fcrHeap(qf);
  // (a cord's sides are straight down the fall; landed, the boil spreads from under it by its own heaps: the lane sum's edge is
  // moved by a quarter of the sum's whole swing either way and is itself a forearm and more wide, so the boil has no ruled side)
  float crdF = smoothstep(-.16, .2, laneL - ${TS.toFixed(2)} + uWhite*.1 + (hp - .5)*.6 + (gn(qf*2.3 + 5.) - .5)*.3);
  // (the churn of the landing, all along the foot: whole for a hand, gone by its own heaps within a forearm to a stride)
  float wash = (1. - smoothstep(.1, .3 + .6*hp, sF))*.7;
  float dn = (1. - smoothstep(.3, 1., u))*mix(max(.15 + .85*crdF, wash), 1., big)*ft, thick = dn*1.7 + hp - .85;
  vec2 qw = vec2(qf.x, qf.y*5.), fw = fwidth(qw);
  float Pb = fcrCream(qw, fw) + (hp - .5)*.35, PbS = fcrCream(qw + so*vec2(.12, .6), fw) + (hp - .5)*.35;
  float df = max(pk*crdF*.6*(1. - tl), .55*(1. - u)*mix(.15 + .85*crdF, 1., big))*ft;
  float Sl = max(.9*dn, .3*df)*lipW, Sb = Sl*(.35 + .65*Sl), dB = fcrCreamD(Pb, Sb);   // (Sl: how much foam of any kind; Sb: how much of it is still a whole body)
  float wB = fcrCreamW(Pb, Sb);
  // the lace: threads of foam closing round cells of clear water a forearm across, drawn out a little along the current,
  // wandering (the level lines of two smooth fields: no thread straight, none ends at a point), a finger wide and soft,
  // widened by the pixel's footprint and paler for it; strong round the bodies, thinning to single threads and gone at the reach
  vec2 ql = qf*vec2(2.3, 1.25) + .4*vec2(gn(qf*1.1 + 3.), gn(qf*1.1 + 8.));
  float n1 = gn(ql + 11.), n2 = gn(ql*2.1 + 4.), f1l = fwidth(n1)*1.3, f2l = fwidth(n2)*1.3;
  float lnet = max((1. - smoothstep(.0, .075 + f1l, abs(n1 - .5)))*.075/(.075 + f1l), .8*(1. - smoothstep(.0, .1 + f2l, abs(n2 - .5)))*.1/(.1 + f2l));
  float lace = lnet*smoothstep(.02, .32, Sl + (Pb - .5)*.3)*(.55 + .45*smoothstep(.3, .6, gn(qf*.8 + 17.)));
  wB = max(wB, lace*.85);
  vec2 rq = vec2(p.x*.8 + .6*vn(p*.35 + 2.), (p.y + flow*.55)*2.4);
  float rip = smoothstep(.5, .85, gn(rq)*.6 + gn(rq*2.3 + 7.)*.4);
  float net = fcrCaus(p*.62 + 3.)*(1. - min(uMirror*3., 1.));
  // the water under the foam: aerated round the boil (soft: it is bubbles under the surface), the river's blue beyond
  float aer = smoothstep(-.4, .5, thick)*smoothstep(.1, .7, dn);
  vec3 wat = mix(cDeep*1.08, vec3(.3, .7, .76)*.46, aer)*litW;
  float aP = mix(.65, .9, aer), pkA = max(pk, aer*ft);
  vec3 colF = skyC*(.04 + .1*rip), colP = skyC*(.14 + .3*rip)*(1. - .6*aer) + wat*.86*aP + vec3(.3, .58, .9)*lit*.26*net*(1. - aer);
  col = mix(col, mix(colF, colP, pkA), ft); a = mix(a, mix(.04 + .08*rip, 1. - .86*(1. - aP), pkA), ft);
  float mine = max(own, pk*shore);                                       // (on the falls' own ground, and where a pocket's water runs out under the weed beside it)
  col *= mine; a *= mine;
  // WHITE WATER HAS A BODY, GENTLY (round 27): thick foam is cream and thin foam the pale turquoise of the water seen through it;
  // the side toward the sun is a little brighter and the lee takes a tint of the sky. A tint, not a cut: no clot has two colours.
  // (the white on the tongue thins away over the bend with the tongue's body WHERE THE BEND IS THE EDGE OF WHAT THE EYE SEES OF
  // THE SHEET: sil, 1 where the facet below the 30 degree row is turned from the eye, by the mesh's own normal there. Seen from
  // a side from which the fall's face shows, the white runs on down it unbroken. So no fall ends in a ruled white edge.)
  float sil = 1. - smoothstep(.2, .45, dot(N, Vv));
  // (and where the fall's face does show, its veils thin away toward the edge of what is seen of it, the sheet turning from the
  // eye: a veil has no outline)
  // (sil and fz are the falling sheet's: the level foot, known by its own normal, is not a sheet turned from the eye, and the
  // white is whole from the sheet's last hand on to the boil: no line of clear water where the sheet lands)
  float shF = (1. - ft)*(1. - step(.99, N.y));
  float fz = mix(1., smoothstep(.04, .42, abs(dot(N, Vv))), smoothstep(.0, .1, tF)*shF);
  float w = max(wN*(1. - smoothstep(.1, .4, sF))*(1. - sil*smoothstep(.05, .47, b)*shF)*fz, wB)*max(mine, apr);   // (the sheet's white runs a forearm on into the boil: no gap between them)
  float tk = mix(thk, smoothstep(-.3, .7, dB), ft);
  // (gS: how the field rises over a hand toward the sun: a rise is a lee. The boil's rim is heaped foam, not the sheet: level)
  float gS = mix(Ps - P, PbS - Pb, ft), nlS = dot(normalize(mix(N, vec3(0., 1., 0.), max(up, ft))), uSunDir);
  float sun = clamp(.6 + .2*nlS - 2.2*gS, 0., 1.);
  float gr = mix(grN, fcrGrain(qw, fw), ft);                    // (streaks inside the white: it is water running, not paint)
  vec3 fc = vec3(.9, .925, .93)*lit*(.68 + .14*tk + .14*sun)*(.84 + .32*gr);
  fc = mix(fc, vec3(.62, .76, .9)*(uSky*2.2 + uSun*cl*.3), (1. - sun)*.22 + .14*smoothstep(.56, .38, hp)*ft);
  fc = mix(vec3(.42, .72, .78)*lit*.52, fc, .25 + .75*smoothstep(.08, .7, w));
  float wa = w*mix(.6, 1., tk)*mix(.72 + .56*gr, 1., tk);                                          // (a thin rim is a veil, half of it hiding the water)
  col = mix(col, fc, wa); a = mix(a, 1., wa*.95);
  ${FOG_PREMULT}
  gl_FragColor = vec4(col, a);
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 4; mesh.name = 'fcr-falls';   // (after the sheet, 3; before the spray, 5)
  return mesh;
}

// ---- real weed fronds near the flight line: instanced ribbon tufts, combed downstream, waving --------------
async function buildFronds(L, U, mask, count, ctx) {
  const rng = L.rng.fork('fronds'), N = L.noise;
  const base = [], bi = [];
  for (let r = 0; r < 2; r++) {
    const o = base.length / 3, rows = [[0, 0.7], [0.45, 1], [0.8, 0.7]];
    for (const [t, w] of rows) base.push(-w, t, r, w, t, r);
    base.push(0, 1, r);
    bi.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4, o + 3, o + 5, o + 4, o + 4, o + 5, o + 6);
  }
  const FR_TOP = Z_TOP - 0.6, NCH = 10, zSpan = (FR_TOP - (Z_LAST + 1)) / NCH, lists = Array.from({ length: NCH }, () => []);
  const dz = (Z_TOP - Z_END) / TH, dx = (TX1 - TX0) / TW;
  let placed = 0, kept = 0;
  // One frond per holdfast, every one leaning with the current (the yaw is the flow's, a few degrees either way) and of its own
  // tone (0..7, carried in the whole part of the phase). put() takes the list's own chunk.
  const put = (x, y, z, yaw, len, depth, green, ph, tone) => {
    lists[clamp(Math.floor((FR_TOP - z) / zSpan), 0, NCH - 1)].push(x, y, z, yaw, len, depth, green, (ph % 1) * 0.998 + Math.floor(clamp(tone, 0, 0.999) * 8));
    kept++;
  };
  for (let tries = 0; tries < count * 12 && placed < count; tries++) {
    if ((tries & 255) === 255) await ctx.yield();
    const z = rng.range(Z_LAST + 1, FR_TOP), x = rng.range(-25, 25);
    const i = clamp(Math.floor((x - TX0) / dx), 0, TW - 1), j = clamp(Math.floor((z - Z_END) / dz), 0, TH - 1), o = (j * TW + i) * 4;
    const weed = mask[o + 1] / 127.5 - 1; if (weed < 0.25) continue;
    const off = Math.abs(x - L.camX(z)), w = 0.07 + 0.93 * Math.exp(-(off * off) / 64);     // thickest under the camera's own line, swing and all
    if (rng() > weed * w) continue;
    const b = L.bed(x, z), depth = b.wl - b.h; if (depth < 0.03 || mask[o + 2] / 255 * 6 - 2 < 0.45) continue;
    const zn = b.zn, yaw = L.flowYaw(x, z) + rng.range(-0.12, 0.12), len = rng.range(0.5, 1.0), ph = rng(), tone = rng(), onS = zn < -90.6 && zn > -195;
    placed++;
    if (z < 20 && off > 14 && placed % 5 >= 2) continue;                  // (far from the flight line three in five are left out: they pay for the treads below)
    if (onS) { const zo = treadZone(x, z, zn); if (zo !== 3 || -90 - 15 * Math.floor((-90 - zn) / 15) - zn > 14.85) continue; }   // no weed in a basin or in a runnel; in a ribbon it stands right to the edge
    put(x, b.h - 0.01, z, yaw, len, Math.min(depth, 0.6), L.zonesAt(x, z)[2] > 0.45 ? 2 : (mask[o] / 255) * (onS ? 0.5 : 1), ph, 0.25 + 0.75 * tone * (0.6 + 0.4 * N.n2(x * 0.3, z * 0.3)));
  }
  await ctx.yield();
  // THE TREADS under the camera (within 10 m of the flight line x = 0): planted on a jittered grid wherever treadZone() says weed, at
  // the slab's own density and more on the last four (the closest pass), thinner on the three the camera crosses from high up
  {
    const rs = rng.fork('treads'), dens = 0.5 + 0.5 * clamp(count / 7400, 0, 1), C = 0.5;
    for (let zi = 0; zi < 180; zi++) {
      if ((zi & 7) === 7) await ctx.yield();
      for (let xi = 0; xi < 40; xi++) {
        const jx = rs(), jz = rs(), pk = rs(), ja = rs(), jl = rs(), ph = rs();
        const x = -10 + (xi + jx) * C, z = -105.2 - (zi + jz) * C;
        if (pk > (Math.abs(x) < 6 ? (z < -150 ? 0.9 : 0.74) : 0.46) * dens) continue;     // (the camera skims every tread at 1.8 to 3.5 m)
        const zn = L.znOf(x, z), bq = -90 - 15 * Math.floor((-90 - zn) / 15) - zn; if (zn > -105 || zn < -194.7 || treadZone(x, z, zn) !== 3 || bq > 14.85) continue;
        const b = L.bed(x, z), depth = b.wl - b.h; if (depth < 0.03 || depth > 0.5 || b.dEdge < 0.4) continue;
        const i = clamp(Math.floor((x - TX0) / dx), 0, TW - 1), j = clamp(Math.floor((z - Z_END) / dz), 0, TH - 1);
        put(x, b.h - 0.01, z, L.flowYaw(x, z) + (ja - 0.5) * 0.3, (0.55 + 0.45 * jl) * (1 + 0.45 * smoothstep(12.6, 14.6, bq)), Math.min(depth, 0.6), (mask[(j * TW + i) * 4] / 255) * 0.4, ph, 0.2 + 0.8 * rs());   // (the last fronds before a lip are the longest: they bend over the edge and stream down it)
      }
    }
  }
  await ctx.yield();
  // THE OTTER RUN (z 8..-52, within 5.6 m of the camera's own line): a second sowing on a jittered grid, so that the nearest metres
  // under the eye are plants leaning with the current and not paint
  {
    const rs = rng.fork('run'), dens = 0.5 + 0.5 * clamp(count / 7400, 0, 1), C = 0.7;
    for (let zi = 0; zi < 86; zi++) {
      if ((zi & 7) === 7) await ctx.yield();
      for (let xi = 0; xi < 16; xi++) {
        const jx = rs(), jz = rs(), pk = rs(), ja = rs(), jl = rs(), ph = rs(), tn = rs();
        if (pk > 0.62 * dens) continue;
        const z = 8 - (zi + jz) * C, x = L.camX(z) - 5.6 + (xi + jx) * C;
        const i = clamp(Math.floor((x - TX0) / dx), 0, TW - 1), j = clamp(Math.floor((z - Z_END) / dz), 0, TH - 1), o = (j * TW + i) * 4;
        if (mask[o + 1] / 127.5 - 1 < 0.3 || mask[o + 2] / 255 * 6 - 2 < 0.45) continue;
        const b = L.bed(x, z), depth = b.wl - b.h; if (depth < 0.03) continue;
        put(x, b.h - 0.01, z, L.flowYaw(x, z) + (ja - 0.5) * 0.26, 0.5 + 0.5 * jl, Math.min(depth, 0.6), L.zonesAt(x, z)[2] > 0.45 ? 2 : mask[o] / 255, ph, 0.25 + 0.75 * tn);
      }
    }
  }
  await ctx.yield();
  // THE SHELF above the ledge (z 115..91, within 9 m of the flight line): distinct red tufts on the dark rock, every one leaning
  // downstream, thickening to the ledge; never on a sand patch
  {
    const rs = rng.fork('shelf'), dens = 0.5 + 0.5 * clamp(count / 7400, 0, 1), C = 0.45;
    for (let zi = 0; zi < 53; zi++) {
      if ((zi & 7) === 7) await ctx.yield();
      for (let xi = 0; xi < 40; xi++) {
        const jx = rs(), jz = rs(), pk = rs(), ja = rs(), jl = rs(), ph = rs(), tn = rs();
        const z = 115 - (zi + jz) * C, x = L.flyX(z) - 9 + (xi + jx) * C;
        if (pk > (0.34 + 0.4 * zi / 53) * dens) continue;
        const i = clamp(Math.floor((x - TX0) / dx), 0, TW - 1), j = clamp(Math.floor((z - Z_END) / dz), 0, TH - 1), o = (j * TW + i) * 4;
        if (mask[o + 1] / 127.5 - 1 < 0.02 || mask[o + 2] / 255 * 6 - 2 < 0.45) continue;
        const b = L.bed(x, z), depth = b.wl - b.h; if (depth < 0.03) continue;
        put(x, b.h - 0.01, z, L.flowYaw(x, z) + (ja - 0.5) * 0.26, 0.5 + 0.5 * jl, Math.min(depth, 0.6), mask[o] / 255, ph, 0.25 + 0.75 * tn);
      }
    }
  }
  await ctx.yield();
  // THE POOL'S SHOALS (below the last fall, within 13 m of the route): weed on the backs of the rock ribs, seen through the glass
  {
    const rs = ctx.core.makeRng('fcr-pool-weed:' + ctx.seed), C = 0.55;
    for (let zi = 0; zi < 42; zi++) {
      if ((zi & 7) === 7) await ctx.yield();
      for (let xi = 0; xi < 48; xi++) {
        const jx = rs(), jz = rs(), pk = rs(), ja = rs(), jl = rs(), ph = rs(), tn = rs();
        if (pk > 0.62) continue;
        const x = -13.2 + (xi + jx) * C, z = Z_LAST - 7 - (zi + jz) * C;
        const i = clamp(Math.floor((x - TX0) / dx), 0, TW - 1), j = clamp(Math.floor((z - Z_END) / dz), 0, TH - 1), o = (j * TW + i) * 4;
        if (mask[o + 1] / 127.5 - 1 < 0.3) continue;
        const b = L.bed(x, z), depth = b.wl - b.h; if (depth < 0.05) continue;
        put(x, b.h - 0.01, z, (ja - 0.5) * 0.5, 0.55 + 0.45 * jl, Math.min(depth, 0.6), 0.15 * (mask[o] / 255), ph, 0.25 + 0.75 * tn);
      }
    }
  }
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 iA, iB; varying vec3 vL; varying vec3 vW; varying vec3 vK; varying vec2 vT;
uniform float uFrondFar; ${GL_NOISE}${GL_WATER}
#include <fog_pars_vertex>
void main(){
  float side = position.x, t = position.y, rib = position.z, tone = floor(iB.w)/8., ph = fract(iB.w)*6.283;
  vec4 wr = modelMatrix*vec4(iA.xyz, 1.);
  float len = iB.x*(1. - .25*rib)*smoothstep(uFrondFar, uFrondFar*.7, distance(wr.xyz, cameraPosition));
  float yaw = iA.w + (rib - .5)*.74 + .2*sin(uTime*.8 + ph);
  vec2 d = vec2(sin(yaw), -cos(yaw)), pr = vec2(-d.y, d.x);
  float wave = sin(t*3.6 - uTime*3.1 + ph + rib*2.);
  float roll = (rib*2. - 1.)*.75, hw = side*.2*len;
  float top = min(iB.y*.8 - .012, len*.4);
  float lift = top*(1. - (1. - t)*(1. - t)) + .025*sin(t*5. - uTime*3.7 + ph*1.7)*t;
  vec3 p = iA.xyz;
  p.xz += d*(t*len*1.1) + pr*(hw*cos(roll) + wave*.12*t*len);
  p.y += lift + hw*sin(roll)*(.25 + .75*t);
  float wl = iA.y + iB.y;
  p.y = min(p.y, wl + (iB.y < .13 ? .035 : -.008));                 // tips break the surface only in the riffles
  p.xz += fcrRip(p.xz)*(.015 + .07*max(wl - p.y, 0.));
  vL = p; vK = vec3(t, iB.z, side); vT = vec2(tone, max(wl - p.y, 0.));
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
varying vec3 vL; varying vec3 vW; varying vec3 vK; varying vec2 vT;
uniform vec3 uSunDir, uSun, uSky, cWeed, cTip, cGreen, cDeep;
${GL_NOISE}${CLOUD_SHADOW_GLSL}${GL_WATER}
#include <fog_pars_fragment>
void main(){
  // (round 27) under the eye a frond is a FAN OF FILAMENTS, each of its own length, not a card of three spikes: seven of them, or
  // five a little further off. The split is chosen by the pixel's footprint (a level of detail read from where the eye is: a
  // filament must have five pixels to itself to be cut out), so a frond further off keeps its three tapering fingers and
  // the carpet stays soft.
  float t = vK.x, fw = fwidth(vK.z), nf = fw < .06 ? 3.5 : fw < .1 ? 2.5 : 1.5, fz = vK.z*nf + .5, sd = abs(fract(fz) - .5);
  float tipL = nf < 2. ? 1.01 : .56 + .44*fract(sin(floor(fz)*12.9898 + vT.x*78.233 + 1.7)*43758.5453);
  if (sd > (nf < 2. ? .5 - .37*smoothstep(.2, 1., t) : (.5 - .29*smoothstep(0., .6, t/tipL))*(1. - smoothstep(.72, 1., t/tipL))) || t > tipL) discard;
  vec3 Vv = cameraPosition - vW; float dist = length(Vv), nearF = smoothstep(15., 4., dist); vec3 V = Vv/max(dist, 1e-3);
  float rib = (1. - .8*sd)*(1. - .4*nearF*smoothstep(.06, .0, sd)*smoothstep(.1, .4, t));      // a dark midrib down each finger
  rib *= 1. - .2*nearF*step(.55, fract(t*13. + sd*4.));                // and the pinnae along it
  float tone = .8 + .42*vT.x;                                          // every frond its own tone: wine to fresh crimson
  vec3 base = mix(cWeed*.5, cWeed*1.2, smoothstep(0., .5, t))*tone; base = mix(base, cTip*(.85 + .3*vT.x), smoothstep(.5, 1., t)*.65);
  float rose = step(1.5, vK.y), grn = vK.y*(1. - rose);                 // (green 2 = a frond of the thin rose beds)
  vec3 gc = mix(cGreen*.3, cGreen, t)*tone; base = mix(base, gc, smoothstep(.3, .8, grn));
  base = mix(base, mix(cWeed*.75, cTip*1.05, smoothstep(.1, .8, t))*tone, rose*.75);
  float cl = fcrCloud(vW.xz), caus = fcrCaus(vL.xz) + 1.2*fcrNet(vL.xz)*smoothstep(24., 6., dist);
  float back = max(dot(-V, uSunDir), 0.); back *= back;
  vec3 lit = uSun*cl, col = base*rib*(lit*(.72 + .9*caus + 1.1*back*t) + uSky*.8);
  float dw = vT.y;                                                     // the water over it: bright in the shallows, a little dimmer and bluer in the deeps
  col *= mix(1., .72, smoothstep(.1, .5, dw));
  col = mix(col, cDeep*(lit*.5 + uSky*.7), smoothstep(.25, .8, dw)*.25);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}` });
  const group = new THREE.Group(); group.name = 'fcr-fronds'; const chunks = [];
  // one mesh of fronds from a flat list, 8 numbers each: x, bed y, z, yaw | length, water depth, green 0..1 (2 = rose), phase
  const make = (arr) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(base, 3)); g.setIndex(bi);
    const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(arr), 8);
    g.setAttribute('iA', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('iB', new THREE.InterleavedBufferAttribute(ib, 4, 4));
    g.instanceCount = arr.length / 8;
    const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1;
    return m;
  };
  lists.forEach((arr, c) => {
    const n = arr.length / 8; if (!n) return;
    const zc = FR_TOP - (c + 0.5) * zSpan, m = make(arr); group.add(m);
    // (a stretch of the slab's own weed is one draw. It is given the ball that holds every holdfast of it and a frond's reach
    // more, 2.5 m, so that the renderer passes the stretch over wherever the picture cannot hold any of it, whatever the look)
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9, br = 0;
    for (let i = 0; i < arr.length; i += 8) { x0 = Math.min(x0, arr[i]); x1 = Math.max(x1, arr[i]); y0 = Math.min(y0, arr[i + 1]); y1 = Math.max(y1, arr[i + 1]); z0 = Math.min(z0, arr[i + 2]); z1 = Math.max(z1, arr[i + 2]); }
    const bc = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    for (let i = 0; i < arr.length; i += 8) br = Math.max(br, Math.hypot(arr[i] - bc.x, arr[i + 1] - bc.y, arr[i + 2] - bc.z));
    m.geometry.boundingSphere = new THREE.Sphere(bc, br + 2.5); m.frustumCulled = true;
    chunks.push({ mesh: m, center: new THREE.Vector3(0, L.core(zc), zc), radius: Math.hypot(26, zSpan / 2), n });
  });
  return { group, chunks, placed: kept, make };
}

// ---- giant otters ---------------------------------------------------------------------------------------
// One lofted body (flat broad head, thick neck, long trunk, flat paddle tail, webbed feet tucked back), spine
// along +Z with the nose at +0.85. Posed per instance in the vertex shader: bent along a circular arc in the
// pitch plane (the porpoise arc / the periscope S), yawed and placed. Poses are computed on the CPU (<= 13).
function buildOtterGeometry() {
  // stations nose -> tail tip: [z, half-width, half-height, y of the centre]
  const ST = [[0.86, 0.022, 0.018, -0.004], [0.84, 0.05, 0.034, -0.002], [0.80, 0.068, 0.044, 0], [0.755, 0.078, 0.05, 0.006],      // blunt wide muzzle
    [0.71, 0.098, 0.056, 0.012], [0.66, 0.106, 0.06, 0.014], [0.61, 0.098, 0.06, 0.01],                                              // broad flat skull
    [0.555, 0.074, 0.058, 0.002], [0.49, 0.07, 0.062, -0.004],                                                                        // the neck
    [0.42, 0.084, 0.076, -0.004], [0.30, 0.106, 0.094, 0], [0.12, 0.118, 0.104, 0], [-0.06, 0.12, 0.106, 0], [-0.2, 0.11, 0.098, -0.002],
    [-0.30, 0.092, 0.074, -0.008], [-0.38, 0.082, 0.044, -0.016], [-0.47, 0.088, 0.024, -0.022], [-0.58, 0.092, 0.016, -0.024],   // the root flattens into the paddle
    [-0.69, 0.08, 0.013, -0.024], [-0.79, 0.054, 0.011, -0.024], [-0.86, 0.014, 0.008, -0.024]];
  const SIDES = 12, pos = [], col = [], idx = [];
  const fur = [0.06, 0.035, 0.021], belly = [0.074, 0.046, 0.029], cream = [0.62, 0.5, 0.31], creamD = [0.36, 0.28, 0.17], nose = [0.02, 0.014, 0.012];
  ST.forEach(([z, hw, hh, yc], k) => {
    for (let i = 0; i < SIDES; i++) {
      const a = (i / SIDES) * Math.PI * 2, sa = Math.sin(a), ca = Math.cos(a);
      pos.push(1.5 * hw * ca * (1 - 0.12 * Math.abs(sa)), 1.15 * (yc + 1.32 * hh * sa * (sa < 0 ? 0.86 : 1)), 1.15 * z);
      let c = sa < -0.35 ? belly : fur;
      const blot = Math.sin(z * 41 + i * 2.1) * Math.sin(i * 1.7 + 1);
      if (z > 0.46 && z < 0.74 && sa < (z < 0.54 ? -0.78 : -0.55) + 0.15 * blot) c = cream;   // the cream bib: throat and the top of the chest, nothing below
      if (z >= 0.74 && z < 0.85 && sa < -0.15) c = creamD;                                  // pale chin and lips
      if (k === 0) c = nose;
      const dark = 0.82 + 0.18 * Math.sin(z * 9 + a * 2);
      col.push(c[0] * dark, c[1] * dark, c[2] * dark);
    }
  });
  for (let k = 0; k < ST.length - 1; k++) for (let i = 0; i < SIDES; i++) {
    const a = k * SIDES + i, b = k * SIDES + (i + 1) % SIDES, c = a + SIDES, d = b + SIDES;
    idx.push(a, c, b, b, c, d);
  }
  // small round ears low on the sides of the skull
  for (const sx of [-1, 1]) {
    const o = pos.length / 3, x = sx * 0.09, y = 0.084, z = 0.725;
    pos.push(x + sx * 0.012, y - 0.014, z + 0.03, x + sx * 0.012, y - 0.014, z - 0.032, x - sx * 0.03, y + 0.006, z, x + sx * 0.034, y + 0.04, z - 0.012);
    for (let i = 0; i < 4; i++) col.push(0.045, 0.027, 0.017);
    idx.push(o, o + 1, o + 3, o + 3, o + 1, o, o + 1, o + 2, o + 3, o + 3, o + 2, o + 1, o + 2, o, o + 3, o + 3, o, o + 2);
  }
  // webbed feet, tucked back along the flanks
  for (const [fz, fx] of [[0.3, 0.09], [0.3, -0.09], [-0.2, 0.095], [-0.2, -0.095]]) {
    const o = pos.length / 3, FS = [[0, 0.02, 0.018], [-0.05, 0.034, 0.02], [-0.11, 0.045, 0.012], [-0.16, 0.012, 0.006]];
    FS.forEach(([dz, w, h]) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pos.push(1.4 * (fx + Math.sign(fx) * (0.012 - dz * 0.12) + w * Math.cos(a)), 1.4 * (-0.075 + dz * 0.1 + h * Math.sin(a)), 1.15 * (fz + dz)); col.push(0.04, 0.028, 0.02); } });
    for (let k = 0; k < FS.length - 1; k++) for (let i = 0; i < 6; i++) { const a = o + k * 6 + i, b = o + k * 6 + (i + 1) % 6; idx.push(a, a + 6, b, b, a + 6, b + 6); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function buildOtters(U, max, sizes = []) {
  const g = buildOtterGeometry();
  const iP = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4), iQ = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4);
  iP.setUsage(THREE.DynamicDrawUsage); iQ.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP', iP); g.setAttribute('iQ', iQ); g.instanceCount = max;
  // every animal 1.7 m nose to tail tip, the largest 1.9 (the lofted body is 1.98 m long)
  const iS = new Float32Array(max); for (let i = 0; i < max; i++) iS[i] = sizes[i] ?? 0.88; g.setAttribute('iS', new THREE.InstancedBufferAttribute(iS, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true,
    vertexShader: /* glsl */`
attribute vec4 iP, iQ; attribute float iS; attribute vec3 color; varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vWl; uniform float uTime;
#include <fog_pars_vertex>
void main(){
  // iP = x, y, z, yaw     iQ = pitch, bend (rad/m), water level (<-900 hides), swim phase
  float s = position.z, hide = step(-900., iQ.z), land = step(iQ.z, -400.);  // the two on the exit ledge sit on dry rock
  float tail = smoothstep(.25, -.9, s), scull = sin(s*4.5 - iQ.w)*tail;       // tail and hips scull up and down
  float th = iQ.x + iQ.y*s, thc = iQ.x + iQ.y*s*.5;
  vec2 sp = vec2(s*cos(thc), s*sin(thc));                                  // swimming: one circular arc
  if (iQ.y > 5.) {                                                         // posed (iQ.y = 10 + lift of the chest): hips, upright chest, head held level
    float B = iQ.y - 10., ds = s/10.; sp = vec2(0.);
    for (int i = 0; i < 10; i++) { float sm = ds*(float(i) + .5), a = iQ.x + B*smoothstep(-.35, .25, sm) - 1.1*smoothstep(.52, .8, sm); sp += vec2(cos(a), sin(a))*ds; }
    th = iQ.x + B*smoothstep(-.35, .25, s) - 1.1*smoothstep(.52, .8, s);
  }
  th += .1*scull;
  float ct = cos(th), sn = sin(th);
  vec3 q = vec3(position.x, sp.y + position.y*ct + .05*scull*(1. - land), sp.x - position.y*sn)*iS;
  vec3 n = vec3(normal.x, normal.y*ct + normal.z*sn, normal.z*ct - normal.y*sn);
  float cy = cos(iP.w), sy = sin(iP.w);
  vec3 p = vec3(q.x*cy + q.z*sy, q.y, -q.x*sy + q.z*cy)*hide + iP.xyz;
  n = vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy);
  vec4 w = modelMatrix*vec4(p, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix)*n); vC = color;
  vWl = (modelMatrix*vec4(0., iQ.z, 0., 1.)).y;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vWl;
uniform vec3 uSunDir, uSun, uSky, cDeep;
${GL_NOISE}${CLOUD_SHADOW_GLSL}
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float cl = fcrCloud(vW.xz), nl = max(dot(N, uSunDir), 0.), nv = max(dot(N, V), 0.);
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.));
  float nh = max(dot(N, H), 0.), under = smoothstep(.02, -.25, vW.y - vWl);
  vec3 col = vC*(uSun*cl*(nl*1.35 + .12) + uSky*(.55 + .45*N.y));           // chocolate, never pewter
  float f1 = 1. - nv; f1 *= f1;
  col += uSun*cl*(.6*pow(nh, 140.) + .025*pow(nh, 18.))*(1. - under);          // one thin wet highlight
  col += (uSky*.28 + uSun*cl*.1*max(dot(N, uSunDir) + .4, 0.))*f1*f1*.4;       // a faint rim against the red
  col = mix(col, cDeep*(uSun*cl*.5 + uSky*.6)*.12 + col*.6, under);          // seen through the water
  col = mix(col, cDeep*(uSun*cl*.8 + uSky*.8), 1. - exp(-clamp(vWl - vW.y - .12, 0., 3.)*2.4));   // one that has dived is lost in the lane's own blue within a metre
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}` });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.name = 'fcr-otters';
  return { mesh, iP, iQ };
}

// ---- spray, mist, falling clumps (GPU, static) and otter splash rings / wakes (CPU, <= 40 quads) --------------
function makeFxMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
attribute vec4 iP0, iV, iK; varying vec2 vUv; varying vec3 vK; varying vec3 vW; uniform float uTime;
#include <fog_pars_vertex>
void main(){
  // iP0 = xyz, size   iV = velocity, life (0: age comes from iK.y)   iK = kind, phase|age, alpha, seed
  // kinds: 0 spray fleck | 1 mist wisp (rises, swells, fades) | 2 splash ring | 3 V wake | 4 the plume standing over a fall (breathes, never gone)
  // 5 a wisp of dawn mist | 6 the curtain of spray thrown up behind a white stretch of a lip (bursts, falls back, bursts again)
  float life = iV.w, age = life > 0. ? fract(uTime/max(life, .01) + iK.y) : iK.y, tt = age*life, kind = iK.x;
  vec3 c = iP0.xyz + iV.xyz*tt; float size = iP0.w, al = iK.z;
  if (kind < .5) { c.y -= 4.9*tt*tt; size *= .55 + .9*age; al *= (1. - age)*smoothstep(0., .12, age); }
  else if (kind < 1.5) { size *= .5 + 1.5*age; al *= sin(3.14159*age); c.x += sin(uTime*.5 + iK.w*20.)*.4*age; }
  else if (kind < 2.5) { size *= .25 + 1.25*age; al *= (1. - age)*(1. - age); }
  else if (kind > 5.5) { size *= .78 + .4*age; al *= sin(3.14159*age); }
  else if (kind > 4.5) { al *= .8 + .2*sin(6.2832*age + iK.w*9.); }
  else if (kind > 3.5) { float b = 6.2832*age; al *= .78 + .22*sin(b + iK.w*9.); c.x += .55*sin(b); c.y += .22*sin(b*2. + iK.w*5.); c.z += .3*cos(b); }
  vec4 w = modelMatrix*vec4(c, 1.);
  if (kind > 4.5 && kind < 5.5) { float hh = position.y*.5 + .5; w.xyz += mat3(modelMatrix)*vec3(.8, 0., .3)*(size*.42*hh*hh + .1*size*hh*sin(uTime*.7 + iK.w*20.)); }   // a wisp leans downwind as it climbs
  if (kind > 1.5 && kind < 3.5) {                                                    // flat on the water, turned by the yaw in iV.x
    float cy = cos(iV.x), sy = sin(iV.x); vec2 l = vec2(position.x, -position.y)*size;
    w.xyz += mat3(modelMatrix)*vec3(l.x*cy + l.y*sy, 0., -l.x*sy + l.y*cy);
  }
  vec4 mvPosition = viewMatrix*w;
  if (kind < 1.5) { mvPosition.xy += position.xy*size; al *= smoothstep(size*.5, size*2.2 + .5, -mvPosition.z); }   // never a white sheet on the lens
  else if (kind > 5.5) { mvPosition.xy += vec2(position.x*size*1.5, (position.y + .8)*size*.6); al *= smoothstep(3.5, 10., -mvPosition.z); }   // low and wide, standing behind its lip
  else if (kind > 4.5) { mvPosition.xy += vec2(position.x*size*.34, (position.y + 1.)*size*.5); al *= smoothstep(1.5, 5., -mvPosition.z); }   // tall and narrow, standing on its foot
  else if (kind > 3.5) { mvPosition.xy += position.xy*size*vec2(1., 1.2); al *= smoothstep(size*2.2 + 5., size*4. + 13., -mvPosition.z); }   // (a plume is for the lips ahead: passed over, it thins to nothing, never a pale sheet behind a lip)
  vUv = position.xy; vK = vec3(kind, al, iK.w + ((life > 0. && (kind < 3.5 || kind > 5.5)) ? floor(uTime/life + iK.y)*.37 : 0.));
  vW = w.xyz; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
varying vec2 vUv; varying vec3 vK; varying vec3 vW;
uniform vec3 uSunDir, uSun, uSky; uniform float uTime;
${GL_NOISE}${CLOUD_SHADOW_GLSL}
#include <fog_pars_fragment>
void main(){
  float r = length(vUv), a;
  if (vK.x < .5) { a = smoothstep(1., 0., r)*(.35 + .65*vn(vUv*2.6 + vK.z*31.)); a *= a*1.6; }
  else if (vK.x < 1.5) { a = smoothstep(1., .1, r)*(.55 + .45*vn(vUv*1.6 + vK.z*17. + uTime*.15)); a *= a; }
  else if (vK.x < 2.5) { float n = vn(vUv*5. + vK.z*13.); a = smoothstep(.2, 0., abs(r - .78) - .06*n)*(.5 + .5*n) + smoothstep(.6, 0., r)*smoothstep(.45, .8, n)*.5; }
  else if (vK.x < 3.5) {                                              // the V wake behind a swimming head: apex at uv.y = -.85
    float y = vUv.y + .85, ax = abs(vUv.x), n = vn(vUv*vec2(7., 3.) + vec2(vK.z*9., uTime*2.2));
    float arm = smoothstep(.11, 0., abs(ax - y*.4) - .05*n)*smoothstep(0., .22, y);
    float wash = smoothstep(y*.4 + .02, 0., ax)*smoothstep(.7, .1, y)*smoothstep(.4, .8, n)*.5;
    a = (arm*(.3 + .7*n) + wash*.35)*smoothstep(1.85, .7, y)*smoothstep(1., .8, ax);
  } else if (vK.x < 4.5) {                                            // a standing plume: billows climbing through a soft body, no foot
    float n = vn(vUv*vec2(1.7, 1.2) + vec2(vK.z*17., -uTime*.3)), n2 = vn(vUv*3.4 + vec2(vK.z*5. + 3., -uTime*.55));
    a = smoothstep(1., .12, r)*(.36 + .64*n)*(.68 + .32*n2); a *= a*1.3*smoothstep(-.92, -.2, vUv.y);
  } else if (vK.x > 5.5) {                                            // spray thrown up behind a lip: a soft body with a torn crest, droplets climbing through it
    float h = vUv.y*.5 + .5, ax = abs(vUv.x);
    float n = vn(vec2(vUv.x*2.6 + vK.z*23., h*1.8 - uTime*1.9)), n2 = vn(vec2(vUv.x*7. + vK.z*11., h*4.5 - uTime*3.3));
    float top = .35 + .6*n;
    a = smoothstep(1., .3, ax)*smoothstep(top, top*.35, h)*smoothstep(0., .12, h)*(.55 + .45*n2);
  } else {                                                            // a curl of mist off still water: one thin thread that wavers as it climbs and frays out
    float h = vUv.y*.5 + .5, cx = (.5*sin(h*5. + vK.z*40. - uTime*.8) + .25*sin(h*11. - uTime*1.3 + vK.z*9.))*h;
    float wd = mix(.34, .95, h), n = vn(vec2(vUv.x*2.2 + vK.z*13., h*5. - uTime*.5));
    a = smoothstep(wd, .0, abs(vUv.x - cx))*(.4 + .6*n)*smoothstep(0., .1, h)*(1. - h)*(1. - h*.4)*1.9;
  }
  a *= vK.y; if (a < .004) discard;
  vec3 V = normalize(cameraPosition - vW);
  float fwd = max(dot(-V, uSunDir), 0.); fwd *= fwd*fwd;
  vec3 col = vec3(.84, .88, .92)*(uSun*fcrCloud(vW.xz)*(.62 + .7*fwd) + uSky*.9);
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}` });
}
function fxMesh(mat, arr, dynamic) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const ib = new THREE.InstancedInterleavedBuffer(arr, 12); if (dynamic) ib.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iP0', new THREE.InterleavedBufferAttribute(ib, 4, 0)); g.setAttribute('iV', new THREE.InterleavedBufferAttribute(ib, 4, 4)); g.setAttribute('iK', new THREE.InterleavedBufferAttribute(ib, 4, 8));
  g.instanceCount = arr.length / 12;
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 5;
  return { mesh: m, buffer: ib };
}
function buildSpray(L, mat, detail, wellMist, plumeK, ctx) {
  const rng = L.rng.fork('spray'), a = [];
  const add = (x, y, z, size, vx, vy, vz, life, kind, alpha, g = rng) => a.push(x, y, z, size, vx, vy, vz, life, kind, g(), alpha, g());
  const along = (zn, n, f) => { for (let i = 0; i < n; i++) { const zz = zn, x0 = rng.range(-1, 1), xl = L.edgeL(zz) + 1, xr = L.edgeR(zz) - 1, x = lerp(xl, xr, x0 * 0.5 + 0.5); f(x, L.zOf(x, zz)); } };
  const D = (n) => Math.max(2, Math.round(n * detail));
  // THE PLUME OVER A FALL: big soft bodies standing just behind the lip, most of them near the flight line, so that from upstream
  // every lip of the staircase carries its own pale bank of mist. hold = keep the portal's own line thin.
  const plume = (zr, yLip, S, al, nNear, nFar, hold, drop) => {
    for (let k = 0; k < nNear + nFar; k++) {
      let x = k < nNear ? ((k + rng()) / nNear * 2 - 1) * 10.5 : rng.range(10, 21) * (k % 2 ? 1 : -1), thin = 1;
      if (hold && Math.abs(x) < 4.5) { if (k % 3) x = (x < 0 ? -1 : 1) * rng.range(4.8, 9.5); else thin = 0.45; }
      x = clamp(x, L.edgeL(zr) + 1.5, L.edgeR(zr) - 1.5);
      const s = S * rng.range(0.8, 1.22) * (k < nNear ? 1 : 0.85);
      add(x, yLip + rng.range(0.35, 1.25) - drop * rng(), L.zOf(x, zr - rng.range(1.3, 3.2) - drop * 0.4), s, 0, 0, 0, rng.range(6, 10), 4, al * plumeK * thin * rng.range(0.75, 1.1) * (k < nNear ? 1 : 0.7));
    }
  };
  // THE STAIRCASE: flicks of spray burst from the foot of every step, most of them under a spout (where a runnel of the tread above
  // pours over: laneJS at the lip), wisps tear off, a bank of mist stands behind each lip where the eye upstream can see it over
  // the edge, and a white tuft marks every spout.
  for (let i = 0; i < NSTEP; i++) {
    const zr = Z_BRINK - STEP * i, y = L.waterY(zr - 3), sp = [];
    for (let x = L.edgeL(zr) + 1.5; x < L.edgeR(zr) - 1.5; x += 0.5) if (laneJS(x, L.zOf(x, zr + 0.3)) > 0.7) sp.push(x);
    if (!sp.length) sp.push(5.5);
    const pick = () => sp[Math.floor(rng() * sp.length) % sp.length] + rng.range(-0.35, 0.35);
    for (let k = 0, n = D(46); k < n; k++) { const x = k % 3 ? pick() : lerp(L.edgeL(zr) + 1, L.edgeR(zr) - 1, rng()); add(x, y + 0.05, L.zOf(x, zr - 1.0), rng.range(0.22, 0.5), rng.range(-0.5, 0.5), rng.range(1.6, 3.4), -rng.range(0.8, 2.6), rng.range(0.6, 1.1), 0, rng.range(0.5, 0.9)); }
    along(zr - 1.4, D(6), (x, z) => add(x, y + rng.range(1.3, 2.6), z - rng.range(0, 2.2), rng.range(2.3, 3.8), rng.range(0.2, 0.7), rng.range(0.2, 0.5), -rng.range(0.4, 1.0), rng.range(3.2, 5), 1, rng.range(0.2, 0.3)));   // wisps tearing off it
    plume(zr, L.waterY(zr + 2), 1.6 + 0.32 * i, 0.66 - 0.03 * i, D(10), D(5), i >= 4, i ? 0 : 0.5);
    // THE WHITE OF EVERY LIP: a low curtain of spray thrown up from the fall's foot behind each white stretch of the lip (the same sum
    // that paints the cords), so that from up the staircase every step edge carries its own broken, sunlit line of white, lip after lip
    for (let x = L.edgeL(zr) + 1.2; x < L.edgeR(zr) - 1.2; x += 0.95) {
      const v = laneJS(x, L.zOf(x, zr + 0.3)), pk = rng(), jx = rng.range(-0.3, 0.3), jz = rng.range(0.9, 1.7), js = rng.range(0.85, 1.2), jl = rng.range(1.3, 2.2), ja = rng.range(0.5, 0.72);
      if (v < TS + 0.02 || pk > 0.5 + 0.3 * detail) continue;
      add(x + jx, L.waterY(zr + 2) - 0.3, L.zOf(x, zr - jz), (0.75 + 0.9 * clamp((v - TS) / 0.4, 0, 1)) * js, 0, 0, 0, jl, 6, ja * plumeK);
    }
    if (i) for (let k = 0, n = D(14); k < n; k++) {                                   // flicks thrown up off the lip either side of the flight line: they pass the lens at eye height
      const x = (k % 2 ? 1 : -1) * rng.range(0.7, 4.4);
      add(x, L.waterY(zr + 2) + 0.1, L.zOf(x, zr - 0.3), rng.range(0.1, 0.2), rng.range(-0.4, 0.4), rng.range(5.2, 6.6), -rng.range(2, 4), rng.range(0.9, 1.3), 0, rng.range(0.55, 0.9));
    }
    for (let k = 0, n = D(8); k < n; k++) { const x = pick(); add(x, L.waterY(zr + 2) + rng.range(-0.15, 0.3), L.zOf(x, zr - rng.range(0.1, 0.8)), rng.range(0.4, 0.75), 0, 0, 0, rng.range(2.2, 4), 4, rng.range(0.4, 0.7)); }
  }
  for (const [zr, yTop, n] of [[Z_LEDGE + 0.4, L.waterY(Z_LEDGE + 3), 1], [Z_LAST - 0.6, L.waterY(Z_LAST + 3), 1.4]]) {
    const y = yTop - 6;
    along(zr - 1.0, D(46 * n), (x, z) => add(x, y + 0.1, z, rng.range(0.35, 0.8), rng.range(-0.8, 0.8), rng.range(2.5, 5), -rng.range(1, 3.5), rng.range(0.8, 1.3), 0, rng.range(0.5, 0.9)));
    along(zr - 2.2, D(15 * n), (x, z) => add(x, y + 1.2, z, rng.range(3, 5.5) * (n > 1 ? 1.25 : 1), rng.range(0.3, 0.9), rng.range(0.5, 1.1), -rng.range(1, 2.4) * n, rng.range(3.5, 6), 1, rng.range(0.1, 0.19)));
    along(zr + 0.2, D(22), (x, z) => add(x, yTop - 0.1, z, rng.range(0.3, 0.6), 0, -0.3, -rng.range(1.2, 2), 1.08, 0, 0.8));   // clumps falling with the sheet
  }
  plume(Z_LAST, L.waterY(Z_LAST + 2) - 1.2, 4.6, 0.36, D(10), D(6), true, 2.2);      // the last fall's is the tallest
  for (let i = NSTEP; i <= NSTEP; i++) {                                             // white tufts bursting on the last fall's lip: a lumpy, torn edge
    const zl = i < NSTEP ? Z_BRINK - STEP * i : Z_LAST, big = i === NSTEP ? 1 : 0;
    for (let k = 0, n = D(big ? 24 : 9); k < n; k++) {
      const x = clamp(((k + rng()) / n * 2 - 1) * 11, L.edgeL(zl) + 1, L.edgeR(zl) - 1);
      add(x, L.waterY(zl + 2) + rng.range(0, 0.45), L.zOf(x, zl - rng.range(0.1, 0.9)), rng.range(0.45, 0.9) * (1 + 0.55 * big), 0, 0, 0, rng.range(2.2, 4), 4, rng.range(0.4, 0.8));
    }
  }
  const poolY = L.waterY(Z_LAST - 12);
  for (let k = 0, n = D(9); k < n; k++)                                             // mist blowing off the pool and through the ring's lower edge
    add(rng.range(-6.5, 6.5), poolY + rng.range(0.7, 1.7), rng.range(-219.5, -212), rng.range(2.0, 3.1), rng.range(-0.25, 0.25), rng.range(0.15, 0.35), -rng.range(1.3, 1.9), rng.range(4, 5.5), 1, rng.range(0.24, 0.34));
  { const mr = ctx.core.makeRng('fcr-ring-mist:' + ctx.seed);                        // (its own stream) more of it, low on the water: it curls through the ring's lower rim
    for (let k = 0, n = D(12); k < n; k++) add(mr.range(-7.5, 7.5), poolY + mr.range(0.4, 1.3), mr.range(-223.5, -214.5), mr.range(2.2, 3.4), mr.range(-0.3, 0.3), mr.range(0.1, 0.3), -mr.range(1.0, 1.7), mr.range(4.5, 6.5), 1, mr.range(0.3, 0.42), mr); }
  if (wellMist > 0.01) for (const w of L.wells) {                                    // low sun: a pale curl of mist standing over every pothole
    for (let k = 0, n = w.r > 2.2 ? 2 : 1; k < n; k++) {                              // one thin wisp (two on the big wells) standing at the far, downwind rim: the disc stays open
      const th = -1.25 + (k ? -0.95 : 0) + rng.range(-0.25, 0.25), rr = w.r * rng.range(0.78, 0.95), s = clamp(1.25 + 0.3 * w.r, 1.4, 2.4) * rng.range(0.85, 1.15) * (k ? 0.75 : 1);
      add(w.x + Math.cos(th) * rr, w.wl + 0.02, w.z + Math.sin(th) * rr, s, 0, 0, 0, rng.range(5, 8), 5, (0.48 + 0.2 * wellMist) * rng.range(0.85, 1.1));
    }
  }
  return fxMesh(mat, new Float32Array(a), false);
}

const HOURS = {
  morning: { el: 55, side: -1, sun: [1.0, 0.95, 0.86], sunI: 1.0, sky: [0.2, 0.28, 0.42], weed: 1, tip: 1, zen: '#2463B8' },
  golden: { el: 20, side: 1, sun: [1.0, 0.6, 0.3], sunI: 1.05, sky: [0.16, 0.19, 0.3], weed: 0.84, tip: 1.3, zen: '#3560A8' },
  dawn: { el: 11, side: -1, sun: [1.0, 0.52, 0.46], sunI: 0.8, sky: [0.17, 0.17, 0.27], weed: 0.75, tip: 1.2, zen: '#4A5E9C' },
};
const tabAt = (tab, u) => {                                 // (a key with a third number is eased into: the file draws level and settles there)
  if (u <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (u <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; let t = (u - a[0]) / (b[0] - a[0]); if (b[2]) t = 1 - (1 - t) * (1 - t); return lerp(a[1], b[1], t); }
  return tab[tab.length - 1][1];
};
// Otter clock of the part viewer (no flight given): z of each group's centre against progress u. In the world the file swims by
// THE LAW OF THE FILE (makeFileLaw, below), a law of metres flown.
const OTTER_Z = { A: [[0, 78], [0.3, 50], [0.55, -13], [0.62, -25], [0.64, -29], [0.69, -49], [0.75, -65], [0.86, -97], [1, -150]],
  B: [[0, 60], [0.3, 30], [0.55, -38], [0.64, -58], [0.73, -79], [0.76, -90], [0.86, -134], [1, -185]] };
// THE LAW OF THE FILE: how far down-river of our own place on the route the middle of each group swims, as ONE function of the
// metres we have flown. It is the brief's own arithmetic and reads no camera: every camera style sees the same river.
//   The otters make 6.5 m/s. We fly the brief's speeds (16 m/s down to the reveal, easing to 10 for the otter run, 16 again down
//   the staircase), so for every metre we fly they swim 6.5 / (our speed there) of a metre and we gain the rest: 0.35 m a metre on the run.
//   A, the rear four: their rear otter is 16 m ahead of us where the run begins (the brief's u 0.55). We gain until the rear otter is
//   2 m ahead of us and the four lie abreast, 5 m to our right in the blue lane; there they race us, metre for metre, until we have
//   flown the brief's two seconds (20 m) past its u 0.64; then they fall back to 6.5 m/s and we leave them behind.
//   B, the lead three: 14 m ahead of us at the brief's u 0.73, by the same gain before it; they go over the brink first and the
//   chute's white water carries them, losing those 14 m evenly, so that we overtake them at the brief's u 0.86.
// Returns ahead(g, u) (metres, u = metres flown / length), a table made once.
function makeFileLaw(length, rearA) {
  const N = 400, V = (u) => 16 - 6 * smoothstep(0.46, 0.55, u) + 6 * smoothstep(0.73, 0.8, u), gain = (i) => (1 - 6.5 / V((i + 0.5) / N)) * (length / N);
  const A = new Float32Array(N + 1), B = new Float32Array(N + 1), iRun = Math.round(0.55 * N), i64 = Math.round(0.64 * N), i73 = Math.round(0.73 * N), i86 = Math.round(0.86 * N);
  const abreast = rearA + 2, race = i64 + Math.round((20 / length) * N);
  A[iRun] = rearA + 16; for (let i = iRun - 1; i >= 0; i--) A[i] = A[i + 1] + gain(i);
  for (let i = iRun + 1; i <= N; i++) { const a = A[i - 1] - gain(i - 1); A[i] = i <= race ? Math.max(a, abreast) : a; }
  B[i73] = 14; for (let i = i73 - 1; i >= 0; i--) B[i] = B[i + 1] + gain(i);
  for (let i = i73 + 1; i <= N; i++) B[i] = B[i - 1] - 14 / (i86 - i73);
  // (an animal does not change pace in a stride: each change is eased over some eight metres of flight)
  const ease = (T) => { const o = Float32Array.from(T), w = Math.max(1, Math.round((4 / length) * N)); for (let i = 0; i <= N; i++) { let q = 0, n = 0; for (let k = -w; k <= w; k++) { const j = i + k; if (j >= 0 && j <= N) { q += o[j]; n++; } } T[i] = q / n; } return T; };
  ease(A); ease(B);
  const T = { A, B };
  return (g, u) => { const f = clamp(u, 0, 1) * N, i = Math.min(N - 1, Math.floor(f)); return lerp(T[g][i], T[g][i + 1], f - i); };
}

export async function buildHero(ctx, opts = {}) {
  const palHex = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map((h) => new THREE.Color(h));
  const detail = ctx.quality?.detail ?? 1;
  const hourName = opts.hour === 'night' ? 'dawn' : (HOURS[opts.hour] ? opts.hour : 'morning'), hour = HOURS[hourName];
  const L = makeLayout(ctx, opts), rng = L.rng.fork('hero');
  const object = new THREE.Group(); object.name = 'five-colour-river-hero';
  const V3 = (c, k = 1) => new THREE.Vector3(c.r * k, c.g * k, c.b * k);

  // palette with season / hour / per-seed drift
  const cWeed = pal[0].clone(), cTip = pal[1].clone(), cGreen = pal[3].clone();
  cWeed.lerp(pal[1], rng.range(0, 0.14));
  if (L.season === 'july') { cWeed.lerp(pal[1], 0.5); } else if (L.season === 'november') { cWeed.lerp(new THREE.Color(0.26, 0.0, 0.13), 0.5); cTip.lerp(new THREE.Color(0.45, 0.04, 0.4), 0.6); }
  const overcast = L.weather === 'overcast', burst = L.weather === 'cloudburst';
  const az = opts.sunAzimuth ?? rng.range(-0.25, 0.25), el = (hour.el * Math.PI) / 180;
  const sunDir = opts.sunDir ? new THREE.Vector3(...opts.sunDir).normalize() : new THREE.Vector3(hour.side * Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  const sunK = hour.sunI * (overcast ? 0.5 : 1), skyK = overcast ? 1.9 : 1;
  await ctx.yield();
  const mask = await bakeMask(L, ctx);
  const U = {
    uTime: { value: 0 }, uCloudT: { value: 0 }, uCloudAmt: { value: opts.cloudShadows ?? (overcast ? 0 : 1) }, uCloudCov: { value: 0 },
    uSunDir: { value: sunDir.clone() }, uSunL: { value: sunDir.clone() },
    uSun: { value: new THREE.Vector3(...hour.sun).multiplyScalar(sunK) }, uSky: { value: new THREE.Vector3(...hour.sky).multiplyScalar(skyK) },
    uMask: { value: mask }, uMaskRect: { value: new THREE.Vector4(TX0, Z_END, 1 / (TX1 - TX0), 1 / (Z_TOP - Z_END)) },
    cWeed: { value: V3(cWeed, hour.weed * (overcast ? 1.1 : 1)) }, cTip: { value: V3(cTip, hour.tip) }, cSand: { value: V3(pal[2], 0.92) }, cGreen: { value: V3(cGreen) },
    cRock: { value: V3(pal[4], 2.2).addScalar(0.004) }, cDeep: { value: V3(pal[5]) }, cHaze: { value: V3(pal[6]) }, cZen: { value: V3(new THREE.Color(hour.zen)) },
    uGloss: { value: burst ? 1 : 0.25 }, uWeedSat: { value: 1 }, uReflCap: { value: opts.reflection ?? (overcast ? 0.2 : 0.24) }, uGlint: { value: overcast ? 0 : 1 },
    uWhite: { value: burst ? 0.35 : L.season === 'july' ? 0.15 : 0 }, uFrondFar: { value: 72 },
    uMirror: { value: opts.mirror ?? (hourName === 'dawn' ? 0.42 : hourName === 'golden' ? 0.27 : 0) },      // still deep water mirrors a low sky
    uStack: { value: new THREE.Vector4(0, 0, 0, 0) },                       // the island in the plunge pool (x, z, half-length across the river, half-width along it; 0 = none): hero.setStack
    uPeri: { value: new THREE.Vector4(0, 0, 1, 0) },                        // the periscope well (x, z, radius, how far the pair are out of the water)
    // the wet hollows of the banks (x, z, half-width across the bank, half-length along it; a zero radius = none): hero.setHollows
    uHol: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, 0, 0)) },
  };
  await ctx.yield();
  const bed = new THREE.Mesh(await buildBedGeometry(L, ctx), makeBedMaterial(U)); bed.name = 'fcr-bed'; object.add(bed);
  await ctx.yield();
  const wells = buildWells(L, U); object.add(wells);
  await ctx.yield();
  const water = await buildWater(L, U, ctx); object.add(water);
  await ctx.yield();
  const fronds = await buildFronds(L, U, mask.image.data, Math.round(clamp(opts.fronds ?? 7400, 500, 8000) * (0.5 + 0.5 * detail)), ctx);
  object.add(fronds.group);
  await ctx.yield();

  // ---- otters ----
  // (the rear four are the brief's four abreast in a small family as in one of nine; the rest lead, never fewer than the brief's three)
  const nFam = clamp(Math.round(opts.otters ?? 7), 3, 9), nA = Math.min(4, nFam - 1), nSwim = nA + Math.max(3, nFam - nA), MAXO = nSwim + 4;
  const oSize = []; for (let i = 0; i < MAXO; i++) oSize.push(i === 0 ? 0.96 : 0.86 + 0.07 * rng());   // 1.7 to 1.84 m, one big male of 1.9
  const ot = buildOtters(U, MAXO, oSize); object.add(ot.mesh);
  await ctx.yield();
  const swim = [];
  for (let i = 0; i < nSwim; i++) {
    const inA = i < nA, k = inA ? i : i - nA, n = inA ? nA : nSwim - nA;
    // phases spread evenly round the cycle: with half of it airborne, half of each group is out of the water at any instant
    swim.push({ g: inA ? 'A' : 'B', dz: (k - (n - 1) / 2) * (inA ? 1.75 : 2.6) + rng.range(-0.2, 0.2), lat: rng.range(-0.5, 0.5), ph: k / n + rng.range(-0.04, 0.04) });
  }
  const periWell = L.wells[0], sitting = [null, null];
  const fxMat = makeFxMaterial(U);
  const spray = buildSpray(L, fxMat, detail, opts.wellMist ?? (hourName === 'dawn' ? 1 : 0), hourName === 'golden' ? 0.6 : 1, ctx); spray.mesh.name = 'fcr-spray'; object.add(spray.mesh);   // (a low sun lights the plumes from the side: thinner, or they veil the staircase)
  const NDYN = nSwim * 4 + 2, dynArr = new Float32Array(NDYN * 12), dyn = fxMesh(fxMat, dynArr, true); dyn.mesh.name = 'fcr-otter-fx'; object.add(dyn.mesh);
  for (let i = 0; i < NDYN; i++) dynArr[i * 12 + 11] = rng();

  // One porpoise cycle = STRIDE metres of river (about 1.6 s at 6.5 m/s): a low arc clear of the water for AIR of it, then a
  // surface swim with the back awash and the head up. leap(p) = height of the body's centre over the water.
  // (the swimmers ride high, half the back and the whole head dark above the water, so the file reads in any single frame)
  const STRIDE = 13, CYC = 6, CYCW = 10.5, AIR = 0.56, LEAPH = 0.4;
  const leap = (p) => p < AIR ? 0.0 + LEAPH * Math.sin((Math.PI * p) / AIR) : 0.0 - 0.03 * Math.sin((Math.PI * (p - AIR)) / (1 - AIR));
  const fr = (x) => x - Math.floor(x);
  const slope = (p) => Math.atan((leap(fr(p + 0.01)) - leap(fr(p - 0.01 + 1))) / (0.02 * CYC));
  const wlAt = (x, z) => L.waterY(L.znOf(x, z));
  let progress = -1, watch = false; const otterPos = [];
  const set4 = (arr, i, a, b, c, d) => { const o = i * 4; arr[o] = a; arr[o + 1] = b; arr[o + 2] = c; arr[o + 3] = d; };
  const setDyn = (i, x, y, z, size, kind, age, alpha, yaw = 0) => { const o = i * 12; dynArr[o] = x; dynArr[o + 1] = y; dynArr[o + 2] = z; dynArr[o + 3] = size; dynArr[o + 4] = yaw; dynArr[o + 8] = kind; dynArr[o + 9] = age; dynArr[o + 10] = alpha; };
  const camL = new THREE.Vector3(), tmpQ = new THREE.Quaternion();
  const dzMax = { A: -1e9, B: -1e9 }; for (const o of swim) dzMax[o.g] = Math.max(dzMax[o.g], o.dz);
  const zcOf = { A: 0, B: 0 };
  // THE FLIGHT (given once by the world: hero.setFlight): the route's length and our own place on it, z by progress. With it the
  // file swims by the law of metres flown (makeFileLaw); nothing below reads the camera's lens.
  let fileLaw = null, flightZ = null;
  const fileZ = (g, u) => flightZ(u) - fileLaw(g, u);                     // where the middle of a group swims (z), at progress u
  // DIVES ARE THE OTTERS' OWN. The lane's floor is drilled with pots, deep holes some thirty metres apart (their own stream); each
  // otter, as it reaches one, dives into it or leaps on by a draw from its own stream: it tips its nose down, goes under for a few
  // metres of river (a hand under the glass, a dark shape still seen, bubbles breaking over it) and comes up beyond, a ring where it went in and a
  // ring where it came out. None on the staircase: the chute is white water.
  const pots = []; { const pr = ctx.core.makeRng('fcr-otter-pots:' + ctx.seed); for (let z = Z_LEDGE - 16 - pr.range(0, 10); z > Z_BRINK + 14; z -= pr.range(24, 36)) pots.push(z); }
  for (let i = 0; i < nSwim; i++) { const dr = ctx.core.makeRng('fcr-otter-dives:' + i + ':' + ctx.seed); swim[i].dives = pots.map((z) => ({ z: z + dr.range(-1.5, 1.5), on: dr() < 0.42, len: dr.range(3.4, 4.8), deep: dr.range(0.3, 0.4) })); }
  function poseOtters(time, u) {
    const P = ot.iP.array, Q = ot.iQ.array, law = fileLaw !== null && progress >= 0;
    for (const g of ['A', 'B']) zcOf[g] = law ? fileZ(g, u) : tabAt(OTTER_Z[g], u);
    const usZ = law ? flightZ(u) : camL.z, usX = law ? L.flyX(usZ) : camL.x;   // OUR PLACE on the route (not the lens): what the watching pair turn to
    for (let i = 0; i < nSwim; i++) {
      const o = swim[i], zc = zcOf[o.g];
      const z = clamp(zc + o.dz, Z_LAST + 3, Z_LEDGE - 6), x = L.chanX(z) + o.lat * smoothstep(-95, -85, z) + (z < Z_BRINK ? o.lat * 0.4 : 0);
      const wa = wlAt(x, z - 0.9), wb = wlAt(x, z + 0.9), wl = (wa + wlAt(x, z) + wb) / 3;
      // its dive, if it is in one: q = 0 where it goes under .. 1 where it is up again (and on to 1.5 while its second ring spreads)
      let dv = 0, dq = -1, dDeep = 0, dZ = 0, dLen = 1;
      for (let j = 0; j < o.dives.length; j++) { const d = o.dives[j]; if (!d.on) continue; const q = (d.z - z) / d.len; if (q > 0 && q < 1.5) { dq = q; dZ = d.z; dLen = d.len; dDeep = d.deep; dv = smoothstep(0, 0.24, q) * (1 - smoothstep(0.76, 1, q)); } }
      const ph = fr((100 - zc) / STRIDE + time * 0.12 + o.ph), y = leap(ph) * (1 - dv) - dDeep * dv;
      const air = smoothstep(0, 0.06, ph) * (1 - smoothstep(AIR - 0.06, AIR, ph));          // 1 in the arc, 0 swimming
      const arc = clamp((slope(ph + 0.03) - slope(ph - 0.03 + 1)) / (0.06 * CYC), -0.6, 0.6);
      const nose = dq > 0 && dq < 1 ? -0.62 * Math.sin(6.2832 * dq) : 0;                    // down into the pot, up out of it
      const pitch = (slope(ph) + (1 - air) * 0.17) * (1 - dv) + Math.atan((wa - wb) / 1.8) * 0.8 + nose, bend = lerp(0.14, arc, air * (1 - dv));
      const yaw = Math.atan2((L.chanX(z - 1) - L.chanX(z + 1)) / 2, -1), sy = Math.sin(yaw), cy = Math.cos(yaw);
      set4(P, i, x, wl + y, z, yaw); set4(Q, i, pitch, bend, wl, ph * 12.57 + time * 5);
      (otterPos[i] ||= new THREE.Vector3()).set(x, wl + y, z);
      // a ring where it went back in, a ring where it came out, a burst of spray at whichever is fresh, and a V wake off the swimming head
      const a1 = fr(ph - AIR + 1), z1 = z + a1 * CYCW, z0 = z + ph * CYCW, k1 = smoothstep(-97, -90, z1);
      if (dq > 0) {                                                                          // diving: the two rings of the dive, and its bubbles breaking over the swimmer
        const zo = dZ - dLen, qo = (dq - 0.8) / 0.7;
        setDyn(i * 4, L.chanX(dZ), wl + 0.03, dZ, 1.45, 2, clamp(dq / 0.9, 0, 1), dq < 0.9 ? 0.95 : 0);
        setDyn(i * 4 + 1, L.chanX(zo), wl + 0.03, zo, 1.3, 2, clamp(qo, 0, 1), qo > 0 ? 0.9 : 0);
        setDyn(i * 4 + 2, x - sy * 0.25, wl + 0.1, z - cy * 0.25, 0.5, 1, fr(time * 1.7 + o.ph * 5), 0.85 * dv);
        setDyn(i * 4 + 3, x - sy * 0.6, wl + 0.035, z - cy * 0.6, 1.7, 3, 0, 0);
      } else {
        setDyn(i * 4, L.chanX(z1) + o.lat * k1, wl + 0.03, z1, 1.3, 2, a1, 0.9 * k1 + 0.25);
        setDyn(i * 4 + 1, L.chanX(z0) + o.lat * smoothstep(-97, -90, z0), wl + 0.03, z0, 1.0, 2, ph, 0.7);
        const fresh = ph >= AIR, ap = fresh ? (ph - AIR) / 0.24 : ph / 0.2, zp = fresh ? z1 : z0;
        setDyn(i * 4 + 2, L.chanX(zp) + o.lat, wl + 0.2, zp, 0.62, 1, clamp(ap, 0, 1), 0.7);
        setDyn(i * 4 + 3, x - sy * 0.6, wl + 0.035, z - cy * 0.6, 1.7, 3, 0, 0.6 * (1 - air), yaw);
      }
    }
    // THE PERISCOPING PAIR in their well, 5 m to the left of the route. They come up as we come up to the well (rising while we are
    // thirty-eight to twenty-four metres short of it), stand head, neck and chest out, their heads turning after our place on the
    // route, and stay up until we are abeam and a few metres past: they sink while we fly from four to nine metres beyond the well.
    // On a rare visit (the migration) they are up from sixty metres off and their heads go between the wings coming up the
    // flight line and us, the two out of step, so one of them is always turned our way.
    for (let k = 0; k < 2; k++) {
      const i = nSwim + k, x = periWell.x + (k ? 0.62 : -0.55), z = periWell.z + (k ? -0.6 : 0.5), wl = periWell.wl;   // side by side as seen from up the route
      const dUp = usZ - periWell.z, cyc = fr(time / 11 + k * 0.08);
      const e = law ? smoothstep(watch ? 62 : 38, watch ? 46 : 24, dUp) * (1 - smoothstep(-4, -9, dUp)) : smoothstep(0.1, 0.25, cyc) * (1 - smoothstep(0.7, 0.82, cyc));
      let yaw = Math.atan2(usX - x, usZ - z) + 0.25 * Math.sin(time * 0.7 + k * 2);
      if (watch) { const wz = lerp(clamp(usZ, periWell.z - 6, periWell.z + 30), periWell.z - 7, 0.5 + 0.5 * Math.sin(time * 0.9 + k * 2.6)); yaw = Math.atan2(L.flyX(wz) - x, wz - z); }
      set4(P, i, x, wl + 0.05 - (1 - e) * 1.25 + 0.025 * Math.sin(time * 2.1 + k), z, yaw);
      if (!k) U.uPeri.value.set(periWell.x, periWell.z, periWell.r, e);
      set4(Q, i, 1.5 + 0.07 * Math.sin(time * 0.9 + k * 1.7), 10, wl, time * 1.5);          // upright column, head level
      (otterPos[i] ||= new THREE.Vector3()).set(x, wl + 0.4, z);
      setDyn(nSwim * 4 + k, x, wl + 0.03, z, 0.8, 2, fr(time * 0.45 + k * 0.5), 0.6 * e);
    }
    // the two on the world's ledge keep the seat and the heading the world gave them (by its island and its river); they only stir
    for (let k = 0; k < 2; k++) {
      const i = nSwim + 2 + k, s = sitting[k];
      if (!s) { Q[i * 4 + 2] = -999; continue; }
      if (s.lie) { set4(P, i, s.x, s.y + 0.13 * oSize[i], s.z, s.yaw + 0.05 * Math.sin(time * 0.4 + k * 3)); set4(Q, i, 0.02, 10.72 + 0.05 * Math.sin(time * 0.6 + k), -500, 0); }   // stretched on the rock, chest propped, head low
      else { set4(P, i, s.x, s.y + 0.25 * oSize[i], s.z, s.yaw + 0.16 * Math.sin(time * 0.5 + k * 3)); set4(Q, i, 0.08, 11.35 + 0.06 * Math.sin(time * 0.8 + k), -500, 0); }   // sitting up on its haunches, looking about
    }
    ot.iP.needsUpdate = true; ot.iQ.needsUpdate = true; dyn.buffer.needsUpdate = true;
  }

  // ---- anchors (local space) ----
  const flyX = L.flyX;
  const wsY = WATER_T + L.flood, casY = (z) => 1.8 + wsY - RISE * ((Z_BRINK - z) / STEP);
  const flyThrough = [[flyX(112), 6 + wsY + 3, 112], [flyX(93), 6 + wsY + 3, 93], [flyX(84), 8.2 + wsY, 84], [flyX(62), 5.2, 62], [flyX(42), 2.4, 42], [flyX(24), wsY + 1.2, 24]];
  for (let z = 8; z >= -72; z -= 16) flyThrough.push([flyX(z), wsY + 1.2, z]);
  flyThrough.push([0, wsY + 2.5, Z_BRINK + 1], [0, casY(-108), -108], [0, casY(-150), -150], [0, casY(Z_LAST), Z_LAST], [0, casY(-225), -225]);
  const channel = []; for (let z = 88; z >= Z_LAST + 2; z -= 8) channel.push([L.chanX(z), wlAt(L.chanX(z), z), z]);
  const fd = new THREE.Vector3(0, RISE, STEP).normalize();
  const anchors = {
    portalSeat: { position: [0, casY(-225), -225], facing: fd.toArray(), radius: 7, tiltDeg: 6.46, poolY: -17.9 + wsY },
    flyThrough, channel,
    viewpoints: {
      reveal: { position: [flyX(86), 8.2 + wsY, 86], lookAt: [L.chanX(45), 0, 45] },
      otterRun: { position: [flyX(-29), wsY + 1.2, -29], lookAt: [L.chanX(-33), 0.4, -33] },
      periscope: { position: [flyX(L.zPeri + 6), wsY + 1.2, L.zPeri + 6], lookAt: [periWell.x, wsY + 0.4, periWell.z] },
      brink: { position: [0, wsY + 2.5, Z_BRINK + 1], lookAt: [0, -8, -160] },
      cascade: { position: [0, casY(-150), -150], lookAt: [0, casY(-225), -225] },
    },
    periscopeWell: { position: [periWell.x, periWell.wl, periWell.z], radius: periWell.r },
    wells: L.wells.map((w) => ({ x: w.x, z: w.z, bedY: w.y, waterY: w.wl, radius: w.r, depth: w.depth, sandy: !!w.sandy })),
    ledge: { z: Z_LEDGE, topWaterY: 6 + wsY, drop: 6 }, brink: { z: Z_BRINK }, steps: { count: NSTEP, rise: RISE, tread: STEP, firstZ: Z_BRINK },
    lastFall: { z: Z_LAST, topY: -RISE * NSTEP + wsY, drop: 6 }, pool: { center: [0, -17.9 + wsY, -212], halfWidth: 17 },
    chuteX: 5.5, slabWaterY: wsY, sunDir: sunDir.toArray(),
    bounds: { min: [-115, -21, Z_END], max: [115, 9, Z_TOP], river: { halfWidth: 22.5, z0: Z_TOP, z1: Z_END } },
    otterSchedule: { z: OTTER_Z, at: tabAt },
  };

  // framing switches for the part viewer (opts.view = run|peri|cascade|reveal, opts.debugU); the world never sets them
  const view = opts.view || '', dbgU = parseFloat(opts.debugU);
  if (isFinite(dbgU)) progress = dbgU;
  let center = new THREE.Vector3(0, 14, -5), radius = 30, height = 26;
  if (view === 'run') { const z = tabAt(OTTER_Z.A, progress >= 0 ? progress : 0.64); center = new THREE.Vector3(L.chanX(z) - 1.5, 1.9, z); radius = 3; height = 6; }
  else if (view === 'peri') { center = new THREE.Vector3(periWell.x + 1, 1.9, periWell.z); radius = 2.5; height = 6; }
  else if (view === 'cascade') { center = new THREE.Vector3(2, 6, -140); radius = 30; height = 24; }
  else if (view === 'reveal') { center = new THREE.Vector3(L.chanX(40), 5, 40); radius = 12; height = 14; }

  const tris = bed.geometry.index.count / 3 + (wells.geometry.index.count / 3) * L.wells.length + water.geometry.index.count / 3 + fronds.placed * 10
    + (ot.mesh.geometry.index.count / 3) * MAXO + (spray.mesh.geometry.instanceCount + NDYN) * 2;
  let adopted = !!opts.sunDir || opts.adoptLight === false;
  const setLight = ({ sunDir: d, sunColor, skyColor } = {}) => {
    if (d) U.uSunDir.value.set(d.x ?? d[0], d.y ?? d[1], d.z ?? d[2]).normalize();
    if (sunColor) U.uSun.value.set(sunColor.r ?? sunColor[0], sunColor.g ?? sunColor[1], sunColor.b ?? sunColor[2]);
    if (skyColor) U.uSky.value.set(skyColor.r ?? skyColor[0], skyColor.g ?? skyColor[1], skyColor.b ?? skyColor[2]);
    adopted = true;
  };
  const tv = new THREE.Vector3();
  function adoptLights() {
    adopted = true; let root = object; while (root.parent) root = root.parent;
    let sun = null, hemi = null;
    root.traverse((o) => { if (o.isDirectionalLight && (!sun || o.intensity > sun.intensity)) sun = o; if (o.isHemisphereLight && !hemi) hemi = o; });
    if (sun) {
      tv.copy(sun.position).sub(sun.target.position); if (tv.lengthSq() > 1e-6) U.uSunDir.value.copy(tv.normalize());
      U.uSun.value.set(sun.color.r, sun.color.g, sun.color.b).multiplyScalar((sun.intensity / Math.PI) * (overcast ? 0.5 : 1));
    }
    if (hemi) U.uSky.value.set(hemi.color.r, hemi.color.g, hemi.color.b).multiplyScalar((hemi.intensity / Math.PI) * 1.5 * skyK).max(tv.set(0.06, 0.08, 0.12));
  }

  return {
    object, radius, height, center, anchors, ground: false, groundY: 0,
    uniforms: U, layout: L, otterPositions: otterPos,
    shared: { noiseGLSL: GL_NOISE, cloudShadowGLSL: CLOUD_SHADOW_GLSL, waterGLSL: GL_WATER, paveGLSL: GL_PAVE, sandGLSL: GL_SAND },
    stats: { triangles: Math.round(tris), drawCalls: 6 + fronds.chunks.length, fronds: fronds.placed, wells: L.wells.length, otters: nSwim + 2 },
    heightAt: (x, z) => L.bed(x, z).h,
    waterLevelAt: (x, z) => L.waterY(L.znOf(x, z)),
    // THE CLOCK of everything that must coincide with the camera: u = the world's path progress 0..1.
    // Optional camLocalZ = the camera's z in hero space: the otter groups are then held at the brief's offsets
    // from the camera itself (abreast at u 0.64-0.69 ...) whatever the world's speed profile is.
    setProgress(u) { progress = clamp(u, 0, 1); },
    // THE FLIGHT, given once in build(): the route's length in metres and zAt(u), our own place on it (hero z) by progress. From then
    // on the file swims by the law of metres flown (makeFileLaw) and hero.fileZ(g, u) says where the middle of group 'A' | 'B' is.
    setFlight({ length, zAt }) { fileLaw = makeFileLaw(length, dzMax.A); flightZ = zAt; },
    fileZ: (g, u) => (fileLaw ? fileZ(g, u) : tabAt(OTTER_Z[g], u)),
    setLight,
    // more of the same weed for the world's own shallows (same material, so the same light and current): a flat list, 8 numbers a
    // frond: x, bed y, z, yaw | length 0.5-1, water depth, green 0..1, phase 0..1. Returns a Mesh for the world to add and to cull.
    makeFronds: (arr) => fronds.make(arr),
    // the island standing in the plunge pool (centre, half-length across the river, half-width along it): a pillow of white water on its
    // up-river face, lace round its foot, rings running out
    setStack(x, z, rx, rz = rx) { U.uStack.value.set(x, z, rx, rz); },
    // the rare migration: the periscoping pair are up early and watch the wings stream past
    setWatch(on) { watch = !!on; },
    // THE WET HOLLOWS of the banks, given once in build(): up to six seeps in the pavement at the water's edge, each [x, z, half-width
    // across the bank, half-length along it]. The bed shader paints them: dark wet rock, moss and algae, a little standing water in the
    // low places.
    setHollows(list) { U.uHol.value.forEach((v, i) => { const h = list[i]; if (h) v.set(h[0], h[1], h[2], h[3]); else v.set(0, 0, 0, 0); }); },
    // seat one of the two spare otters on a rock (local position of the rock surface, the heading it faces): sitting up, or lying (o.lie)
    placeOtter(i, position, yaw = 0, o = {}) { sitting[i & 1] = position ? { x: position.x ?? position[0], y: position.y ?? position[1], z: position.z ?? position[2], yaw: yaw || 0, lie: !!o.lie } : null; },
    update(dt, time, camera) {
      U.uTime.value = time; U.uCloudT.value = time;
      if (!adopted) adoptLights();
      object.getWorldQuaternion(tmpQ).invert(); U.uSunL.value.copy(U.uSunDir.value).applyQuaternion(tmpQ);
      if (camera) object.worldToLocal(camL.setFromMatrixPosition(camera.matrixWorld)); else camL.set(0, 8, 120);
      // (a stretch of weed goes by its distance from the eye alone, where its fronds have shrunk to nothing; the weed stands up out
      // of the slab's water, and from below the brink its tops show over the lip, so no stretch is let go for the eye's depth)
      const far = U.uFrondFar.value;
      for (const c of fronds.chunks) c.mesh.visible = camL.distanceTo(c.center) < c.radius + far;
      poseOtters(time, progress >= 0 ? progress : 0.52 + 0.4 * fr(time / 22));
    },
    dispose() { mask.dispose(); },
  };
}
