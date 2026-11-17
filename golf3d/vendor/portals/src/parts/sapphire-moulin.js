// THE SAPPHIRE RACE: hero set piece for the world "sapphire-moulin".
//
// What it is
//   The last straight reach of a meltwater canyon sawn into the Greenland ice sheet (113 m long, 14 m
//   wide at the waterline, 12 m deep, overhanging scalloped walls with a glowing melt notch, icicle
//   fringes and smoking snow cornices), the river in it (electric blue, foam braids, standing waves,
//   slush rafts and tumbling blocks), the BRINK where the river bends over in a glassy curve, and the
//   MOULIN it falls into: a fluted shaft 45 x 38 m at the mouth, leaning 22 degrees downstream,
//   325 m deep, banded so that depth reads as colour (aqua, cobalt, ink), with the river sliding down its
//   footwall as a wall of white water that frays into torn threads until a side conduit swallows it.
//   Above the mouth stands a 90 m spray plume (a tower of stacked billows, a truthful piece of rainbow), mist rings
//   hang in the shaft, drops and ropes of spray fall with the camera, and the exit portal's light breathes on the ice.
//
// THE FALL, TOP TO BOTTOM. Everything in it follows its own place: a wall point's colour its own depth below the surface,
// a light its own ray or its own distance from its source, a block its own size; nothing reads the depth or the distance
// of the eye (only filtering does: antialiasing widths, pixel floors, the fade of sprites, threads and streamers that
// would slap the lens, and the fog of the air between eye and thing). So any eye sees the gradient ahead: aqua above it,
// cobalt round it, ink below (ICE_FRAG "THE FALL'S REACHES").
//   aqua    [to about 60 m]   pale turquoise ice, the white sheet a wall of water under the lens (torn strands three to
//                       eight metres long with soft turquoise between them, WATER_FRAG aquaK). The sun's gold lies only
//                       where its ray reaches through the mouth: the crescent on the far wall's top, as deep as the sun's
//                       height and the mouth's width give, and one ribbon of lit air along that ray ('shaft-beam',
//                       BEAM_FRAG). The mouth's own daylight comes down as a pale wedge on the wall across from the sun.
//   cobalt  [to 130 m]  saturated cobalt; the flutes (half as deep again here, each wandering half a metre) are lit ribs
//                       over dark troughs, the cups at full depth, the dipping bands crossing them; the sheet has frayed
//                       into short pale threads lying in the footwall's flutes (WATER_FRAG "TORN, NOT RULED")
//   conduit [where the route is at 34.5 s of its 40: opts.conduitDepth, about 160 m] the footwall ends in a scalloped lip
//                       that climbs to the left and steps away, and a throat is scooped 12 m straight out under it
//                       along its own bearing (makeShape pocketK / lipWob). Its mouth is an arch that stands 8 m higher
//                       on the left wall (ARCH) with a scalloped edge (lipScal: bays 4 to 6 m wide), and the lip is an
//                       overhang (the scoop is at full depth 2.4 m under it); no terrace on the wall round the mouth
//                       (shaftSteps "under"). The throat is ink by how far into the scoop a point lies, its edge a thin
//                       wet line worked out per fragment (ICE_FRAG "THE CONDUIT"; aCd carries the wall's own
//                       coordinates). The whole sheet gathers to the left (waterSteps "THE PEEL") and is torn away in
//                       clots over the last metres (WATER_FRAG "THE END OF THE SHEET"); what goes over is a mesh of its
//                       own, 'conduit-fall' (buildConduitFall, CREST_*): knots of foam, a boiling pale cyan-white welt on
//                       the lip, then separate ropes and clots flung to the left into the throat, sharp at arm's length
//                       (each seed its own stretch of that water: CREST_FRAG wS, from the band seed).
//                       Mist rolls out of the mouth and climbs 12 to 30 m up the left wall above it, a pale breath that
//                       stands over the conduit from far above ('conduit-mist', SPRITE_VERT MODE 3; none within 14 m of
//                       the lens).
//   ink     [from 200 m] deep indigo on the same sculpted flutes and cups (never flat black: the upper lip of every cup
//                       and every rib keeps twice the light of the hollows), the daylight a trace; the ring's fill within
//                       its last 40 m, its cyan crescents on every cup's upper lip, strongest beside the ring and
//                       reaching 150 m up the well by each cup's own distance from it; mist catching it
//
// The shaft as a place (what the shader and the geometry do, top to bottom)
//   geometry   30 lengthwise flutes (each wandering half a metre either way from 25 m down: no ruled aretes), and LEDGES: broken terraces every 13 to 20 m that step 1.5 m toward the axis
//              (shaftSteps; aIce.y marks a shelf's frosted top). Nothing closer than 9 m to the axis.
//   cups       scallops 1.7 by 2 m in the shader (three times the canyon's), so they read from the axis, 13 m away
//   bands      broad dipping bands, white bubbly bands, pale healed fractures running aslant (fwidth-antialiased)
//   light      daylight from the mouth (ICE_FRAG "DAYLIGHT FROM THE MOUTH"): it thins with the square of the depth
//              but never goes out, comes down tipped to the sun's side (shelf tops and upper cup lips bright,
//              undercuts deep), and one pale wedge of it slides down the wall across from the sun to about
//              150 m; then the ring's light ("THE RING'S LIGHT") fills the last 60 m with rich blue: it comes from below,
//              so the upper lip of every cup is a cyan crescent over a cobalt hollow, on the 2 m cups and on a second,
//              larger generation (5 by 6 m, this light only) that still reads right down at the ring
//   footwall   beside and under the falling water the ice is wet glassy turquoise with films running on it
//   water      the sheet (WATER_FRAG "THE FIBRES": white strands, cobalt gaps, slits torn through to the ice; the
//              brink curve leaves in lobes, WATER_VERT "THE TORN LIP"), three chains of short falls going down flutes
//              from ledge to ledge, a third of the way round the shaft from one another (buildThreads: a white knot where the
//              water strikes each ledge, a tapering rope below its lip, dark wall to the next; each chain shows by the
//              water's own depth, in over 12 to 34 m and out over 205 to 244 m, so all three stand in the shaft at
//              once: THREAD_FRAG), ropes of spray among the drops
//              (SPRITE_VERT MODE 2: strings of clots, none drawn within 9 m of the lens: a rope there was a smear)
//   skylight   the hanging wall keeps a tongue of aqua daylight to about 215 m (ICE_FRAG "THE SKYLIGHT"), a tenth of the
//              aqua ambient holds to 150 m, and the ring's cyan crescents reach 150 m up the well: the cobalt reach has
//              two hues and two values (aqua and white above, cyan rims below)
//
// Local space
//   Origin = centre of the brink at ice-sheet surface level (y = 0), +Y up. The river arrives down +Z
//   and flows toward -Z (so "front" is +Z: the camera comes from there travelling -Z; right is +X).
//   Canyon: z = 0 .. reach (113), water level y = -12 + 0.02 z, rim y = 0.01 z.
//   Brink: (0, -12, 0). Shaft axis: x = 0, z = AXIS_Z0 - 0.404 (depth - 20.76) (68 degrees below level),
//   the footwall (the wall the water slides on) lies 7.5 m "under" the axis on the +Z side.
//
// anchors (all local space)
//   lip          the brink: where water and camera go over.
//   portalSeat   { position, normal, up, radius 7 }: centre of the 14 m portal on the shaft axis at
//                depth 273 m, facing back up the axis (tilt true). Behind it 50 m of black shaft.
//   flyThrough   ordered points: down the canyon 0.9 m over the water, over the brink on a 40 m arc,
//                then straight down the axis (68 degrees) to the portal seat. >= 6 m clear of all ice
//                from the brink down (in the canyon it rides the water, as the brief wants). The arc cuts
//                the corner of the brink by about a metre: a camera that must stay just over the water
//                (as the world's drifter does) should lay its own points with kit.surfaceY instead.
//   axisTop, axisDir   a point on the axis at y = 0 and the unit direction down it.
//   viewpoints   { canyonStart, brink, shaftAqua, shaftCobalt, portalApproach, plumeFar }.
//   plumeBase, plumeTop   gaze targets for the spray plume.   conduit: where the sheet leaves (the lip, low on the left, 4 m above hero.conduitDepth).
//   farWallCrescent   centre of the sun-lit gold crescent on the far wall.
//
// opts
//   palette   brief palette [electric, cobalt, turquoise, snow, cryoconite, gold, orange]
//   sunDir    Vector3 TOWARD the sun in hero-local space (default -0.80, 0.41, 0.44)
//   sunColor, skyColor, hazeColor, inkColor   hex; key light, blue sky fill, far haze, shaft bottom
//   reach     length of the straight canyon (default 113)
//   apron     true: the hero's own ring of ice-sheet surface (radius 260 m, hole for mouth and canyon).
//             false: the world lays its own terrain up to the cornices.
//   plume, rafts, spindrift   false to leave any of these out.
//   season    'early' | 'peak' | 'late' (default seeded): snow cover, cryoconite stripes, slush.
//   portalColor  hex of the light the portal throws on the flutes (default #A8F0FF).
//   route        Float32Array (x, y, z, ...): the centreline of the world's route at every metre, in hero-local space. The
//                streamers keep 4.5 m from it (driftCurtainSteps). Default: the hero's own flyThrough.
//   conduitDepth metres below the surface at which the footwall ends in the conduit's lip: the depth the world's route has
//                reached at 34.5 s of its 40 (default: the same share of the brief's own route, 161 m). hero.conduitDepth
//                gives it back. The module also exports moulinRoute (water surface, brink radius, axis, portal seat), so
//                a world can lay that route before the hero exists.
//
// hooks
//   hero.setProgress(u)   0..1 world progress; only used for the shaft fog / portal-light ramp.
//   hero.setCameraDepth(d) optional override of the same thing (metres below the surface).
//   hero.uniforms         shared uniform objects (uTime, uSun, uSunCol, uPortalI ...). Mood knobs the world sets after
//                         the build: uWarm (1 = warm low key: gold in the lit ice, crests and spindrift; 0 = neutral),
//                         uFoamTint / uPlumeTint (white by day, dim at twilight), uPlumeShade / uPlumeSide (tint of the plume's shade flank; how far the split is turned sideways), uDrift (spindrift strength; above
//                         1.4 the windward ribbons hang down the wall), uDriftH (extra spindrift height, m),
//                         uHump (height of the standing hump of water on the brink, m), uUpGlow (0 by day; at twilight the
//                         teal up-light the water throws on the foot of the canyon walls and under the bridges).
//                         uPools[3] / uPoolDir[3]: foam aprons the river shader draws where the world's tributary falls land
//                         ((x, z, radius, strength) and the flow direction; WATER_FRAG "FOAM APRONS").
//   spindrift             ribbons along both rims and round the mouth ('spindrift'), and nine streamers that pour off the left
//                         cornice, 7.2 to 15.2 m apart, and hang straight down the top of the left wall, combed into
//                         threads ('spindrift-curtains', driftCurtainSteps + DRIFT_FRAG "STREAMERS": gold drapes in a low
//                         sun). A rule of the place: each streamer's whole body, over all its fall and all the wind
//                         does to it, keeps 4.5 m from the route's centreline (opts.route); one that a pose of the wind
//                         brings nearer is shortened as far as that asks: falls of 6.3 to 7.8 m below the cornice lip on
//                         the world's route. Each is the same for every eye but for a fade within 4 to 11 m of the lens,
//                         which acts on every pass (they hang 4.5 to 6.3 m from the route's line)
//                         (amber and laid on stronger when uWarm is high). A ribbon geometry may carry a fourth aRib
//                         component that fades it (the world: no ribbon over a snow bridge).
//   plume                 a TOWER OF BILLOWS (SPRITE_VERT MODE 0): eleven heads of vapour rise out of the mouth one after
//                         another at uneven spacing, each a ball of fifty soft puffs, their sizes two to one, each overlapping
//                         the next by a third, with lilac neck wisps hung between them (one continuous leaning tower, never a
//                         string of beads), swelling as it climbs, leaning downwind. uPlumeKnee: how far the soft knee lets
//                         the lit heads go (0.3; snowfall 0.44). The puffs are sorted belly
//                         first, crown last (makeSprites), so each crown lies over the belly of the head above. Spray is
//                         white in every hour, in three tones (SPRITE_FRAG "THREE TONES"): white crowns, lilac hollows under
//                         them and in the creases between heads, a blue-violet shade flank (uPlumeShade); the hour's
//                         colour only as a thin warm rim on the sunward lumps; feathered edges; a soft knee holds it under 0.9.
//                         One plume for every eye: its girth, its lean and the sideways step of its heads follow height above
//                         the mouth alone (30 to 45 m across at the top, the brief's), its hollows the height on each head,
//                         its knee the drift alone (let out in a ground blizzard), and its haze is the fog of the air between
//                         eye and plume (smFog), as on everything else. Nothing else in it reads how far the eye is, but the
//                         guard that fades a puff about to slap the lens.
//   bridge icicles        aInst.x = -1 (the world's fringes under its snow bridges): thin spikes with an even taper and no
//                         frosted root, pale in the bridge's shade, its own size at every range with a floor of one pixel
//                         either side of its axis (ICE_VERT IS_ICICLE)
//   streamers / ribbons   DRIFT_FRAG: a streamer wavers sideways as it falls and its edges are torn (never a ruled bar); a
//                         hanging ribbon thins where it turns its edge to the lens in a ground blizzard
//   late season           uLate = 1 (walls): extra cryoconite stripes, a mauve-grey stain down the top of the face, darker
//                         bare ice and two old melt notches above the water (ICE_FRAG "LATE SEASON")
//   hero.kit              { makeIceMaterial(variant), buildCanyonWall(o), profile, waterLevel(z), rimLevel(z),
//                           shaftPoint(theta, depth), pal }: the same walls and ice for the meanders.
//                         Also exported from this module by name.
//                         For the world's meanders the kit also carries makeWaterMaterial() (the river shader),
//                         makeDriftMaterial() (spindrift ribbons), makeIcicles(list) and axisZ(depth); the ice
//                         material has a 'raft' variant (InstancedMesh posed on the CPU, sun-lit above uLitY).
//                         kit.surfaceY(z): height of the river surface on the centreline (canyon, hump, brink arc),
//                         which the world uses to keep its drifter afloat. kit.buildCanyonWallAsync(o, yieldFn):
//                         the same wall built in slices. kit.lean: tan of the shaft's lean.
//
// Building in slices
//   Every large mesh is made by a generator ("...Steps") that yields every few rows; buildHero drives them with
//   runStepsAsync(gen, ctx.yield) so no step of the build is long. runSteps(gen) runs one to the end at once.
//   gridNormalSteps(pos, nu, nv, rows, keep) computes the same normals as computeVertexNormals for a grid, sliced.
//   The order of the rng draws is the same either way.
//
// Size: radius 150 (canyon + mouth + plume), the shaft goes 325 m down, the plume 90 m up.
// Cost: about 160k triangles in 18 meshes (shaft 76k, walls 14k, water 28k, river ice 14k, icicles 12k,
//   apron 7k, the conduit's fall 4k, the rest 4k), no lights of its own, build about 300 ms.
// Lighting: everything is shaded by its own ShaderMaterials from opts.sunDir / sunColor / skyColor
//   (linear HDR, scene fog honoured, and the shaft fades to ink with depth by itself), so it wants a
//   warm low key from left-behind (-X, +Z) and a blue sky. Scene lights do not affect it.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeNoise } from '../kit/core.js';

const DEFAULT_PALETTE = ['#16A0F0', '#0B3FA8', '#5FD6E4', '#DDEBF3', '#3E3A38', '#FFC878', '#FF5E1A'];
const DEG = Math.PI / 180;
const LEAN = Math.tan(22 * DEG), COSL = Math.cos(22 * DEG), SINL = Math.sin(22 * DEG);
const LIP_D = 12, RB = 14, PHI_END = 68 * DEG;
const ARC_D = LIP_D + RB * (1 - Math.cos(PHI_END)), ARC_Z = -RB * Math.sin(PHI_END);   // end of the brink curve
const FW_OFF = 7.5 / COSL;                                                               // footwall under the axis (horizontal)
const AXIS_Z0 = ARC_Z - FW_OFF + ARC_D * LEAN;                                           // axis z at y = 0
const SHAFT_D = 325, PORTAL_D = 273;
// THE SIDE CONDUIT (where the water leaves the fall). Its depth is not typed. The brief: "at 34.5 s the footwall steps
// away to the lower left and the water peels off into a side conduit". So the lip the footwall ends in lies at the depth
// the eye has reached at that share of the flight (34.5 s of 40): opts.conduitDepth, which the world reads off its own
// route; a hero built alone takes the same share of the brief's route (lip at path metre 581 of 880, a 40 m arc to 68
// degrees, then the axis). In the shaders it is uCd = (that depth, the shaft's half-width there).
// At the lip the footwall steps away over CD_STEP metres, and low on its left a throat is scooped 12 m under it: it begins
// PK_TOP below the lip, is deepest to PK_FULL and has climbed back to the round shaft by PK_END.
// The throat lies LOW ON THE LEFT (POCKET_TH: bearing round the shaft, 90 = the footwall under the falling water,
// 180 = the left wall), is pushed straight out along that bearing, and its mask is measured in metres of arc round the
// wall (POCKET_S2). POCKET_X: the x of its middle, for mist and companions.
const BRIEF_CONDUIT_D = LIP_D + (40 / PHI_END) * (1 - Math.cos(PHI_END)) + ((34.5 / 40) * 880 - 581 - 40) * Math.sin(PHI_END);
const CD_STEP = 7, PK_TOP = 1, PK_FULL = 14, PK_END = 42;
const POCKET_TH = 150 * DEG, POCKET_X = -11, POCKET_S2 = 70, POCKET_PUSH = 12;
const PDX = Math.cos(POCKET_TH), PDZ = Math.sin(POCKET_TH), LIP_RISE = 4;
// (the lip is not level: it is scalloped across the footwall by lipWob, up to 4 m higher or lower, and it CLIMBS to the
// left: on the left wall it lies LIP_RISE metres higher, and where footwall and left wall meet (x about -10) it is held
// 3 m lower, so the lip the water goes over runs aslant in one sweep from the left wall down across the footwall;
// LIP_WOB is the same in GLSL)
const lipWob = (x) => 3.0 * Math.sin(x * 0.45 + 0.6) + 1.4 * Math.sin(x * 1.3 + 2.0) + LIP_RISE * (1 - smoothstep(-12.5, -11, x)) - 3.0 * Math.exp(-(((x + 9.7) / 1.3) ** 2));
const LIP_WOB = (x) => `(3.0*sin(${x}*0.45 + 0.6) + 1.4*sin(${x}*1.3 + 2.0) + ${LIP_RISE}.0*(1.0 - smoothstep(-12.5, -11.0, ${x})) - 3.0*exp(-(${x} + 9.7)*(${x} + 9.7)/1.69))`;
// (arc: metres round the wall from the throat's middle, positive toward the left wall. THE MOUTH IS AN ARCH: on the left
// wall its top stands ARCH metres higher than over the footwall, and it is wider on that side)
const ARCH = 8, POCKET_S2B = 110;
const archRise = (arc) => ARCH * smoothstep(3, 11, arc);
// (and THE ARCH IS SCALLOPED: bays 4 to 6 m wide round its edge, each a round bite 1.9 m high between hanging points, so
// the edge is a run of curves, never a straight cut; none where the water goes over)
const lipScal = (arc) => (1.9 * Math.abs(Math.sin(arc * 0.62 + 0.8 * Math.sin(arc * 0.27 + 1.0))) - 0.8) * smoothstep(1, 4, arc);
const lipLift = (x, arc) => lipWob(x) + archRise(arc) + lipScal(arc);      // metres the mouth's upper edge stands above the conduit's depth here
// the same in GLSL, from the shaft's own coordinates (x before the flutes, metres of arc), for the fragment shader
const LIP_LIFT = (x, arc) => `(${LIP_WOB(x)} + ${ARCH}.0*smoothstep(3.0, 11.0, ${arc}) + (1.9*abs(sin(${arc}*0.62 + 0.8*sin(${arc}*0.27 + 1.0))) - 0.8)*smoothstep(1.0, 4.0, ${arc}))`;
// (THE LIP IS AN EDGE: the scoop reaches its full depth 2.4 m under it, so the roof of the throat is an overhang hidden
// from above and the mouth's outline is the lip itself; over 5 m the roof was a pale ramp with straight-cut sides)
// (dl: metres below the conduit's depth)
const pocketK = (x, dl, arc) => smoothstep(PK_TOP, PK_TOP + 2.4, dl + lipLift(x, arc)) * (1 - smoothstep(PK_FULL, PK_END, dl)) * Math.exp(-(arc * arc) / (arc > 0 ? POCKET_S2B : POCKET_S2));
const N_FLUTE = 30, SEG_PER_FLUTE = 5;
const HUMP = 0.18;                                             // the river humps up this much just before it bends over

// ---------------------------------------------------------------- shape functions (JS)
const axisZ = (D) => AXIS_Z0 - D * LEAN;
function pw(D, pts) { // piecewise smooth interpolation through [D, value] pairs
  if (D <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (D <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], D)); }
  return pts[pts.length - 1][1];
}
function makeShape(S) {
  const CD = S.cd;                                             // the conduit's depth: where the footwall ends in a lip
  const Rx = (D) => pw(D, [[0, 19 * S.mouthX], [30, 16.5], [93, 15], [240, 12], [SHAFT_D, 10.5]]);
  const Rfar = (D) => pw(D, [[0, 25 * S.mouthZ], [30, 19], [93, 15], [240, 12], [SHAFT_D, 10.5]]);
  const Rnear = (D) => lerp(20, Rx(D), smoothstep(0, 45, D));
  // z of the footwall plane at depth D (the brink curve, then a 68 degree slope, then it steps away)
  const fwZ = (D, x = 0) => {
    if (D < LIP_D) return (LIP_D - D) * 0.1;
    if (D < ARC_D) { const c = (RB - (D - LIP_D)) / RB; return -RB * Math.sqrt(Math.max(0, 1 - c * c)); }
    return ARC_Z - (D - ARC_D) * LEAN + (D > CD - 38 ? 9 * smoothstep(CD, CD + CD_STEP, D + lipWob(x)) : 0);
  };
  const flare = (D) => (D < 6 ? 3.6 * (1 - D / 6) * (1 - D / 6) : 0);
  // point on the shaft wall. theta: 0 = +X, 90 deg = footwall (+Z). ex = extra radius (rim flare), fl = flute offset
  const point = (theta, D, ex = 0, fl = 0, out = {}) => {
    const c = Math.cos(theta), s = Math.sin(theta);
    const rx = Rx(D) + ex, rz = (s >= 0 ? Rnear(D) : Rfar(D)) + ex;
    let x = rx * c, z = axisZ(D) + rz * s;
    // outward direction of the free ellipse
    let nx = c / rx, nz = s / rz; const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
    // smooth clip against the footwall plane
    const f = fwZ(D, x) + ex, k = 2.2;
    const h = clamp(0.5 + 0.5 * (f - z) / k, 0, 1);         // 1 = free wall, 0 = on the footwall
    const zc = lerp(f, z, h) - k * h * (1 - h);
    const w = 1 - h;                                         // footwall weight
    nx = nx * (1 - w); nz = nz * (1 - w) + w; const n2 = Math.hypot(nx, nz) || 1; nx /= n2; nz /= n2;
    // side conduit: a throat low on the left where the water leaves, scooped straight out along its own bearing
    const arc = D > CD - 28 ? Math.atan2(Math.sin(theta - POCKET_TH), Math.cos(theta - POCKET_TH)) * rx : 99;
    const cd = D > CD - 28 ? pocketK(x, D - CD, arc) : 0;
    out.x = x + nx * fl + cd * POCKET_PUSH * PDX; out.z = zc + nz * fl + cd * POCKET_PUSH * PDZ; out.y = -D; out.w = w; out.nx = nx; out.nz = nz; out.cd = cd;
    // (x0, arc: the wall's own coordinates here, before flutes and scoop; the shader works the throat and its lip out
    // from them per fragment, so the lip is a clean scalloped curve at any range)
    // (mouthUp: metres above the mouth's upper edge, within its arc: shaftSteps keeps the terraces off the wall there)
    out.x0 = x; out.arc = arc; out.mouthUp = D > CD - 28 ? CD - lipLift(x, arc) - D : 99;
    return out;
  };
  // z of the near (footwall-side) wall at lateral x and depth D, flutes aside: what the falling water lies on
  // (above the conduit's lip only: the throat's scoop is not in it)
  const nearZ = (x, D) => {
    const rx = Rx(D), c = clamp(x / rx, -0.98, 0.98), sn = Math.sqrt(1 - c * c);
    const z = axisZ(D) + Rnear(D) * sn, f = fwZ(D, x), k = 2.2, h = clamp(0.5 + 0.5 * (f - z) / k, 0, 1);
    return lerp(f, z, h) - k * h * (1 - h);
  };
  return { Rx, Rfar, Rnear, fwZ, flare, point, nearZ, cd: CD };
}
export const waterLevel = (z) => -LIP_D + 0.02 * Math.max(z, 0);
export const rimLevel = (z) => 0.01 * Math.max(z, 0);

// Canyon wall cross-section. Each row: [offset from the centreline at half-width 7, t, glow, kind]
// t < 0: metres below the water; 0..1: fraction of the wall height (water to rim); > 1: metres above the rim + 1.
export const profile = [
  [6.3, -1.6, 0.9, 0], [6.9, -0.3, 1.0, 0], [7.35, 0.02, 1.0, 0], [7.85, 0.05, 1.0, 0], [8.0, 0.09, 0.95, 0],
  [7.7, 0.135, 0.9, 0], [7.15, 0.18, 0.75, 0], [6.9, 0.3, 0.6, 0], [6.55, 0.45, 0.52, 0], [6.2, 0.6, 0.46, 0],
  [5.85, 0.75, 0.42, 0], [5.55, 0.87, 0.4, 0], [5.3, 0.94, 0.45, 1], [5.05, 0.985, 0.5, 1], [5.2, 1.35, 0.2, 2],
  [5.9, 1.75, 0.06, 2], [7.2, 1.8, 0.03, 2], [9.0, 1.45, 0.0, 2], [11.5, 0.7, 0.0, 2],
];

// ---------------------------------------------------------------- shared GLSL
const NOISE_GLSL = /* glsl */`
float smHash(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
vec2 smHash2(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz)*q.zy); }
float smNoise(vec2 x){
  vec2 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(smHash(i), smHash(i + vec2(1.0, 0.0)), f.x), mix(smHash(i + vec2(0.0, 1.0)), smHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float smFbm(vec2 p){ return 0.5*smNoise(p) + 0.3*smNoise(p*2.07 + 13.1) + 0.2*smNoise(p*4.3 + 5.7); }
`;
// fog that sits in the haze up top and turns to ink down the shaft. Needs vFogDepth, vP (local position).
const FOG_PARS = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor; varying float vFogDepth;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
#endif
uniform vec3 uInk; uniform float uShaftFog; uniform float uCamDepth; uniform vec2 uCd;      // uCd: the conduit's depth, the shaft's half-width there
vec3 smFog(vec3 col, float localY, float dist){
  // haze up top; below the surface a short ink fog whose reach shrinks as the camera descends
  float below = smoothstep(4.0, 30.0, -localY);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float f = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float f = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col = mix(col, fogColor, f*(1.0 - below));
  #endif
  float deep = smoothstep(18.0, 150.0, max(-localY, uCamDepth));
  float fi = 1.0 - exp(-dist*uShaftFog*mix(0.25, 1.0, deep));
  return mix(col, uInk, fi*below);
}
`;

// ---------------------------------------------------------------- ice material
// One ShaderMaterial for every piece of ice. Attributes: aSurf (surface metres: along, up) drives the
// scallops and threads; aIce = (inner glow 0..1, sun-lit depth below the rim in metres, depth below the rim).
// variant: 'wall' | 'shaft' | 'apron' | 'block'
const ICE_VERT = /* glsl */`
attribute vec2 aSurf; attribute vec3 aIce;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec2 vSurf; varying vec3 vIce; varying vec3 vSunW; varying vec3 vPL; varying vec3 vLoc; varying vec2 vCd;
uniform vec3 uSun; uniform vec3 uPortalPos;
#ifdef IS_SHAFT
  attribute vec2 aCd;
#endif
#ifdef IS_BLOCK
  attribute vec4 aSeed; uniform float uTime; uniform vec4 uFlow;   // reach, speed, lipLen, fallLen
  ICE_BLOCK_PARS
#endif
#ifdef IS_ICICLE
  attribute vec2 aInst; uniform float uTime, uPx;
#endif
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position; vec3 n = normal;
  #ifdef IS_BLOCK
    smBlock(p, n);
  #endif
  vP = p; vSurf = aSurf; vIce = aIce; vLoc = position; vCd = vec2(0.0);
  #ifdef IS_SHAFT
    vCd = aCd;
  #endif
  #ifdef IS_RAFT
    // rigid chunks posed on the CPU by the world (rafts, floes, the toppling slab, falling blocks)
    {
      mat3 im = mat3(instanceMatrix);
      vec3 s2 = max(vec3(dot(im[0], im[0]), dot(im[1], im[1]), dot(im[2], im[2])), vec3(1e-6));
      p = (instanceMatrix*vec4(p, 1.0)).xyz; n = normalize(im*(n/s2));
      vP = p; vSurf = aSurf*sqrt(s2.x) + float(gl_InstanceID)*7.31; vIce = vec3(aIce.x, 0.0, 2.6);
      vLoc = position*sqrt(s2) + vec3(float(gl_InstanceID)*3.7, 0.0, float(gl_InstanceID)*1.9);   // metres on the chunk, its own patch of crust
    }
  #endif
  #ifdef IS_ICICLE
    // a slow sway of the tip, then the instance transform; aInst = (sun-lit 0..1, seed)
    // (aInst.x = -1, a fringe under a snow bridge: a thin spike with an even taper from the ice down to its point, no
    // carrot shoulder and no bulb at the root. It is its own size at every range; only a floor of one pixel either side
    // of its axis, tapering to the tip, keeps a far fringe from shimmering)
    if (aInst.x < -0.5) {
      float it = clamp(-position.y, 0.0, 1.0);
      vec2 iax = vec2(0.12*sin(it*5.0), 0.0), idr = position.xz - iax;
      vec3 icw = (modelMatrix*instanceMatrix*vec4(0.0, 0.0, 0.0, 1.0)).xyz;
      float pxR = length(icw - cameraPosition)*uPx*(1.0 - 0.7*it)/max(length(instanceMatrix[0].xyz), 1e-4);
      p.xz = iax*0.4 + idr/max(length(idr), 1e-4)*max(0.52*pow(1.0 - it, 1.2) + 0.03, pxR);
    }
    p.x += 0.02*sin(uTime*1.3 + aInst.y*40.0)*(-p.y);
    p = (instanceMatrix*vec4(p, 1.0)).xyz; n = normalize(mat3(instanceMatrix)*n);
    vP = p; vSurf = aSurf + aInst.y*37.0; vIce = vec3(aIce.x, aInst.x, 3.0 + aSurf.y);
  #endif
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix)*n); vSunW = normalize(mat3(modelMatrix)*uSun);
  vPL = mat3(modelMatrix)*(uPortalPos - p);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const ICE_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec2 vSurf; varying vec3 vIce; varying vec3 vSunW; varying vec3 vPL; varying vec3 vLoc; varying vec2 vCd;
uniform float uTime, uSeason, uPortalI, uBandSeed, uLate, uLitY, uWarm, uUpGlow;
uniform vec3 uSun, uSunCol, uSkyCol, uSnow, uTurq, uCobalt, uElectric, uCryo, uGold, uPortalCol, uMauve;
uniform vec2 uDip; uniform vec4 uMouth;      // axis z at y=0, lean, Rx, Rz
#include <common>
${NOISE_GLSL}
${FOG_PARS}
// irregular level bands: returns (clear turquoise, cobalt lens, cryoconite stripe)
vec3 smBands(float yb, float along, float aa){
  float n1 = smNoise(vec2(yb*0.31 + uBandSeed, 3.7)), n2 = smNoise(vec2(yb*0.83 + 9.1, uBandSeed)), n3 = smNoise(vec2(yb*2.3, 1.3 + uBandSeed));
  float strat = n1*0.6 + n2*0.28 + n3*0.12;
  float clear = smoothstep(0.42, 0.6, strat);
  float lens = smoothstep(0.6, 0.74, strat)*smoothstep(0.3, 0.6, smNoise(vec2(along*0.045, yb*0.2 + 4.0)));
  float yc = yb*1.15 + 0.35*n2;
  float cell = floor(yc), fr = fract(yc), r = smHash(vec2(cell, 7.0 + uBandSeed));
  float th = (0.035 + 0.07*smHash(vec2(cell, 21.0)))*1.15, w = max(th, aa*1.15);
  float d = abs(fr - (0.3 + 0.4*smHash(vec2(cell, 3.0))));
  float stripe = (1.0 - smoothstep(w, w + aa*1.15 + 0.004, d))*step(1.0 - uSeason, r)*(th/w);
  stripe *= 0.55 + 0.45*smNoise(vec2(along*0.21, cell));
  return vec3(clear, lens, stripe);
}
void main(){
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  float dist = length(cameraPosition - vW);
  float depthIn = vIce.z;
  float D = max(-vP.y, 0.0);
  vec3 cobD = uCobalt*(1.0 + 1.5*smoothstep(70.0, 165.0, D));      // COBALT DEEPENS WITH DEPTH: the blue of a point of ice, water or spray is two and a half times as strong by 165 m down as above 70 m, by its own depth (cobD)
  #ifdef IS_SHAFT
    // THE FALL'S REACHES (depth is read as colour: aqua, cobalt, ink). A wall point's reach is its own depth below the
    // surface, whoever looks at it: AQUA to about 60 m (pale turquoise ice, the wall of white water), COBALT to 130 m
    // (zCob: saturated blue, the flutes lit ribs over dark troughs, the dipping bands crossing them), INK from 200 m
    // (zInk: deep indigo on the same sculpted flutes, nothing bright but the ring and its cyan crescents). So a frame
    // shows the gradient ahead: aqua above the eye, cobalt round it, ink below.
    float zCob = smoothstep(48.0, 86.0, D), zInk = smoothstep(130.0, 200.0, D);
    float rib = smoothstep(0.2, 0.9, vIce.x);                    // 1 on a flute's arete, 0 in its trough
    // the side conduit's throat and its lip, worked out per fragment from the wall's own coordinates (vCd = x before the
    // flutes, metres of arc from the throat's middle): pk = how far into the scoop 0..1, cUp = metres above the mouth's edge,
    // cGd = how deep the scoop goes at this place along the lip 0..1 (pk reaches it 2.4 m below the edge)
    // (cSide: only on the throat's own side of the axis; across the shaft the arc wraps round inside one facet)
    float cSide = step(0.0, vP.x*${PDX.toFixed(4)} + (vP.z - (${AXIS_Z0.toFixed(4)} - D*${LEAN.toFixed(5)}))*${PDZ.toFixed(4)});
    float cdl = D - uCd.x, cOn = step(-30.0, cdl)*cSide, cLift = ${LIP_LIFT('vCd.x', 'vCd.y')};
    float cGd = cOn*(1.0 - smoothstep(${PK_FULL}.0, ${PK_END}.0, cdl))*exp(-vCd.y*vCd.y/(vCd.y > 0.0 ? ${POCKET_S2B}.0 : ${POCKET_S2}.0));
    float pk = cGd*smoothstep(${PK_TOP}.0, ${PK_TOP}.0 + 2.4, cdl + cLift);
    float cUp = ${PK_TOP}.0 - (cdl + cLift);
    float cArcK = cOn*(1.0 - smoothstep(vCd.y > 0.0 ? 12.0 : 7.0, vCd.y > 0.0 ? 18.0 : 12.0, abs(vCd.y)));
  #endif
  // ---- cotangent frame from the surface coordinates (derivatives taken once, outside every loop)
  #ifdef IS_SHAFT
    vec2 q = vSurf*vec2(0.6, 0.5);          // cups 1.7 m by 2 m: they have to read from the axis, 13 m away
  #else
    vec2 q = vSurf*vec2(1.75, 2.1);
  #endif
  vec3 dp1 = dFdx(vW), dp2 = dFdy(vW); vec2 du1 = dFdx(q), du2 = dFdy(q);
  vec3 dp2p = cross(dp2, N), dp1p = cross(N, dp1);
  vec3 T = dp2p*du1.x + dp1p*du2.x, B = dp2p*du1.y + dp1p*du2.y;
  float inv = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-12)); T *= inv; B *= inv;
  float fw = max(length(du1), length(du2));
  float ybAA = fwidth(vP.y) + 0.176*(fwidth(vP.x) + fwidth(vP.z));
  float lod = 1.0 - smoothstep(0.3, 1.1, fw);
  // ---- scallops: Voronoi cups with sharp crests
  q += 0.45*vec2(smNoise(vSurf*0.55 + 3.0), smNoise(vSurf*0.55 + 17.0))*vec2(1.6, 1.0) + 0.25*vec2(smNoise(vSurf*1.7), smNoise(vSurf*1.7 + 8.0));
  vec2 ic = floor(q), fc = fract(q); float f1 = 9.0, f2 = 9.0; vec2 gv = vec2(0.0); vec2 idc = vec2(0.0);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); vec2 c = o + 0.15 + 0.7*smHash2(ic + o) - fc; float d = dot(c, c);
    if (d < f1) { f2 = f1; f1 = d; gv = c; idc = ic + o; } else if (d < f2) { f2 = d; }
  }
  float crest = (1.0 - smoothstep(0.0, 0.11, sqrt(f2) - sqrt(f1)))*lod;
  #ifdef IS_APRON
    float cup = 0.0; crest = 0.0;
  #else
    float cup = lod*smoothstep(0.4, 2.0, depthIn + 0.6*smNoise(vSurf*0.6));
  #endif
  #ifdef IS_SHAFT
    // the cups soften with depth but never die: the walls round the ring are still scalloped ice
    float pdK = dot(vPL, vPL); pdK = pdK/(pdK + 6400.0);      // 0 at the ring, 0.5 at 80 m from it
    float inkK = 1.0 - 0.4*smoothstep(170.0, 250.0, D)*pdK;      // (and they come back to full depth in the ring's light)
    cup *= inkK; crest *= inkK;
    // (and calmer where the blocks tumble beside the lens, in the aqua and the first cobalt: they must read against the wall)
    float calm = 1.0 - 0.38*smoothstep(18.0, 40.0, D)*(1.0 - smoothstep(120.0, 170.0, D))*(1.0 - zCob);
    cup *= calm*(1.0 + 0.3*zCob);      // (in the cobalt reach the cups are at full depth and more: the ribs are scalloped ice)
  #endif
  #if defined(IS_RAFT) || defined(IS_BLOCK)
    // rafts, floes and blocks carry a snow crust on top; only their broken sides are cupped
    float topK = smoothstep(0.2, 0.65, N.y);
    float wetB = 1.0 - smoothstep(0.03, 0.3, vLoc.y);
    cup *= (1.0 - topK)*0.6; crest *= 1.0 - topK;
  #endif
  vec3 Np = normalize(N + (T*gv.x + B*gv.y)*2.1*cup);
  #if defined(IS_RAFT) || defined(IS_BLOCK)
    float cr0 = smFbm(vLoc.xz*3.1), cr1 = smFbm(vLoc.xz*3.1 + vec2(0.3, 0.0)), cr2 = smFbm(vLoc.xz*3.1 + vec2(0.0, 0.3));
    float pit = smoothstep(0.62, 0.78, smNoise(vLoc.xz*5.3 + 9.0));
    Np = normalize(Np + vec3(cr0 - cr1, 0.0, cr0 - cr2)*3.4*topK*lod);
  #endif
  float cupAO = mix(1.0, 0.9 + 0.2*smoothstep(0.0, 0.3, f1), cup);
  // ---- bands and albedo
  float along = vSurf.x;
  float yb = vP.y + dot(vP.xz, uDip) + 0.7*(smNoise(vec2(along*0.05, vP.y*0.07)) - 0.5);
  #ifdef IS_SHAFT
    yb = vP.y*0.8 + dot(vP.xz, uDip)*2.2 + 5.0*(smNoise(vec2(along*0.06, vP.y*0.018)) - 0.5) + 1.6*(smNoise(vec2(along*0.21, vP.y*0.06 + 5.0)) - 0.5);
    ybAA *= 1.6;
  #endif
  #ifdef IS_SHAFT
    vec3 bands = smBands(yb*0.42, along, ybAA*0.42);      // broad bands, readable from the axis and too slow to strobe
  #else
    vec3 bands = smBands(yb, along, ybAA);
  #endif
  float iceMix = smoothstep(0.5, 2.4, depthIn + 0.8*smNoise(vSurf*0.35));
  float bub = smNoise(vSurf*vec2(5.0, 9.0));
  vec3 snow = uSnow*0.78;
  vec3 alb = mix(snow, mix(uSnow, uTurq, 0.16)*(0.66 + 0.08*bub), iceMix);
  #ifdef IS_SHAFT
    bands *= vec3(0.6, 0.8, 0.45)*(1.0 + 0.75*zCob*(1.0 - zInk));      // (the dipping bands cross the cobalt ribs plainly)
  #endif
  alb = mix(alb, uTurq*0.62 + 0.05, bands.x*0.62*iceMix);
  alb = mix(alb, cobD*0.85 + vec3(0.0, 0.03, 0.08), bands.y*0.8*iceMix);
  alb = mix(alb, uMauve, uLate*0.35*smoothstep(0.45, 0.75, smNoise(vSurf*0.18 + 7.0))*(1.0 - bands.x));
  alb = mix(alb, uCryo*0.6, bands.z*0.8*iceMix);
  #ifdef IS_SHAFT
    // white bubbly bands between the clear blue ones, and healed fractures running aslant through them
    float bubB = smoothstep(0.5, 0.68, smNoise(vec2(yb*0.3 + 31.0, uBandSeed)))*(0.5 + 0.5*smNoise(vSurf*vec2(1.9, 2.7)))*smoothstep(14.0, 30.0, D);
    alb = mix(alb, uSnow*0.86, bubB*0.5);
    vec2 cq = vec2(along*0.085 + vP.y*0.047, vP.y*0.058 - along*0.031);
    float cn = smNoise(cq) + 0.35*smNoise(cq*2.3 + 7.0);
    float cwid = max(0.011, fwidth(cn)*1.3);
    float crack = (1.0 - smoothstep(cwid*0.5, cwid, abs(cn - 0.74)))*(0.011/cwid)*smoothstep(18.0, 34.0, D);
    alb = mix(alb, uSnow*0.95, crack*0.75);
  #endif
  // ---- light
  float ndlG = dot(N, vSunW);
  float ndl = max(dot(Np, vSunW), 0.0);
  float lit = 1.0, day = 1.0; vec3 amb = uSkyCol;
  #ifdef IS_WALL
    lit = 1.0 - smoothstep(vIce.y - 0.9, vIce.y + 0.9, depthIn + 1.4*(smNoise(vec2(along*0.22, 1.0)) - 0.5) + 0.5*(sqrt(f1) - 0.3)*cup);
    amb = uSkyCol*(1.25 + 0.45*N.y) + uElectric*0.3*smoothstep(1.0, 9.0, depthIn)*(0.6 - 0.4*N.y);
    amb *= mix(1.0, 0.7, smoothstep(0.0, 10.0, depthIn));
    // TWILIGHT (uUpGlow > 0): the faintly luminous water lights the canyon from below (teal on undersides, in the notch
    // and up the first metres of the walls) and the aurora lays a thin green rim on what faces the sky
    amb += (uTurq*0.75 + uElectric*0.5)*uUpGlow*(0.6 - 0.4*N.y)*exp(-max(vSurf.y, 0.0)/5.5) + vec3(0.1, 0.5, 0.3)*uUpGlow*0.55*smoothstep(0.3, 0.85, N.y);
    // a decided key: where the sun reaches, the wall is cream snow-ice; where it does not, it sinks into blue
    float keyK = smoothstep(0.35, 0.8, dot(uSunCol, vec3(0.3333)));
    alb = mix(alb, snow*mix(vec3(1.0), vec3(1.05, 1.0, 0.92), uWarm), lit*0.6*keyK);
    amb *= mix(1.0, mix(0.74, 0.4, lit), keyK);
    // LATE SEASON: bare old ice (laid on after the key's cream, so it shows on the sun-lit wall too). Two more sets of
    // cryoconite stripes between the first, a mauve-grey algal stain down the cornice and the top four metres of the
    // face, the whole wall a shade darker, and two old melt notches the lower water has left a metre and two metres
    // above the river (dark lines with a pale lip under each).
    float lateAA = fwidth(vSurf.y);
    if (uLate > 0.0) {
      vec3 b2 = smBands(yb + 0.47, along + 40.0, ybAA), b3 = smBands(yb*1.31 + 0.2, along + 90.0, ybAA*1.31);
      alb = mix(alb, uCryo*0.55, uLate*max(b2.z, b3.z*0.8)*0.8*smoothstep(0.3, 1.5, depthIn));
      float stainK = (1.0 - smoothstep(0.6, 4.2, depthIn + 1.6*(smNoise(vSurf*vec2(0.3, 0.9)) - 0.5)))*(0.45 + 0.5*smNoise(vSurf*0.45 + 11.0));
      alb = mix(alb, uMauve*0.62, uLate*stainK*0.85);
      alb *= 1.0 - 0.16*uLate;
      float hN = vSurf.y + 0.12*(smNoise(vec2(along*0.6, 3.0)) - 0.5), nw = max(0.1, lateAA*1.2);
      float n1 = (1.0 - smoothstep(nw*0.5, nw, abs(hN - 1.15)))*(0.1/nw), n2 = (1.0 - smoothstep(nw*0.5, nw, abs(hN - 2.05)))*(0.1/nw)*0.75;
      float lipL = (1.0 - smoothstep(0.0, 0.24, abs(hN - 0.92)))*0.5 + (1.0 - smoothstep(0.0, 0.22, abs(hN - 1.84)))*0.38;
      alb = mix(alb, uSnow*0.85, uLate*lipL*0.45);
      alb = mix(alb, cobD*0.3, uLate*max(n1, n2)*0.85);
    }
  #endif
  #ifdef IS_SHAFT
    {
      float slotT = (vP.y + ${LIP_D}.0)/${LIP_D}.0;
      float slotHalf = mix(7.15, 5.05, clamp((slotT - 0.18)/0.8, 0.0, 1.0)) + 0.8*smoothstep(0.0, 0.05, slotT)*(1.0 - smoothstep(0.1, 0.18, slotT)) - 0.3;
      if (vP.y > -${LIP_D}.0 + 0.1 && vP.z > -2.5 && abs(vP.x) < slotHalf) discard;
      float ts = D/max(uSun.y, 0.05);
      vec2 e = vec2(vP.x + uSun.x*ts, vP.z + uSun.z*ts - uMouth.x)/uMouth.zw;
      lit = (1.0 - smoothstep(0.72, 1.02, dot(e, e) + 0.12*smNoise(vSurf*0.2)))*step(0.0, D);
      // THE FAR WALL'S CRESCENT, as the river sees it down the last reach: the top of the wall that faces the canyon is lit
      // right across the slot (deepest on the right, where the sun reaches furthest), not only its right-hand half
      lit = max(lit, smoothstep(0.35, 0.8, N.z)*(1.0 - smoothstep(9.5, 16.0, D + 0.3*max(-vP.x - 2.0, 0.0) + 2.0*smNoise(vSurf*0.25)))*step(0.0, D)*step(vP.z, uMouth.x));
      alb = mix(alb, snow, lit*0.45);
      // DAYLIGHT FROM THE MOUTH. The mouth is a window of sky far overhead: its light thins with the square of the depth
      // but never goes out (the ice passes blue on), and it comes down the shaft tipped toward the sun's side, so shelf
      // tops, the upper lip of every cup and the wall across from the sun are bright and undercuts are deep.
      day = 1.0/(1.0 + D*D/3200.0);
      vec3 tint = mix(uSkyCol, uTurq*0.9, smoothstep(6.0, 45.0, D));
      tint = mix(tint, mix(uElectric, cobD, 0.6)*1.3, max(0.5*smoothstep(45.0, 125.0, D), zCob));
      // a tenth of the aqua daylight holds to 150 m and dies by 215 m: the cobalt keeps a second hue
      day = max(day, 0.1*(1.0 - smoothstep(150.0, 215.0, D)));
      tint = mix(tint, uTurq*0.85 + uElectric*0.25, 0.35*smoothstep(70.0, 110.0, D)*(1.0 - smoothstep(150.0, 215.0, D))*(1.0 - 0.8*zCob));
      tint = mix(tint, cobD*0.8 + vec3(0.02, 0.0, 0.07), zInk);          // toward ink: indigo, the last of the daylight
      vec2 sh = normalize(uSun.xz + vec2(1e-4, 0.0));
      vec3 Ls = normalize(vec3(sh.x*0.42, ${COSL.toFixed(4)}, ${SINL.toFixed(4)} + sh.y*0.42));
      float up = dot(Np, Ls), upG = dot(N, Ls);
      float form = 0.45 + 0.45*max(upG, 0.0) + 0.9*max(up, 0.0) + 0.55*max(Np.y, 0.0) + 0.1*up;
      // the footwall beside and under the falling water is wet, water-polished ice with films running on it: glassy
      // turquoise, darker than the white water, never rime-white (fz = where the footwall lies at this depth)
      float arcC = ${RB}.0 - max(D - ${LIP_D}.0, 0.0);
      float fz = D < ${ARC_D.toFixed(3)} ? -sqrt(max(${RB * RB}.0 - arcC*arcC, 0.0)) : ${ARC_Z.toFixed(3)} - (D - ${ARC_D.toFixed(3)})*${LEAN.toFixed(5)};
      float onFoot = (1.0 - smoothstep(0.5, 2.4, fz - vP.z))*smoothstep(${LIP_D}.0 - 0.4, ${LIP_D}.0 + 1.2, D)*(1.0 - smoothstep(uCd.x, uCd.x + ${CD_STEP}.0, D));
      float film = smoothstep(0.5, 0.78, smNoise(vec2(vP.x*1.4, D*0.07 - uTime*0.8))*0.6 + smNoise(vec2(vP.x*4.1 + 9.0, D*0.2 - uTime*1.9))*0.4);
      alb = mix(alb, uTurq*0.4 + cobD*0.2 + 0.03 + uSnow*0.3*film, onFoot*0.82);
      form = mix(form, 0.6 + 0.5*max(up, 0.0), onFoot);
      float shelfTop = vIce.y*smoothstep(20.0, 40.0, D);          // the top of a ledge: rime and spray frost, facing the sky
      alb = mix(alb, uSnow*0.88, shelfTop*0.55);
      form *= 1.0 + 0.7*shelfTop;
      float arete = vIce.x;
      // (the first metres under the rim keep the sun-side shading they always had: the mouth seen from the canyon)
      float sideT = dot(N, normalize(vec3(uSun.x, 0.3, uSun.z)))*0.5 + 0.5;
      vec3 ambTop = tint*(0.3 + 0.9*exp(-D/60.0))*(0.35 + 1.05*sideT*sideT)*mix(0.62, 1.3, arete*arete);
      amb = mix(ambTop, tint*(0.19 + 1.1*day)*form*mix(0.84, 1.16, arete), smoothstep(8.0, 30.0, D));
      alb = mix(alb, uSnow*0.8, arete*arete*0.3);
      amb *= mix(1.0, 0.45, lit*uWarm);
      // COBALT: every flute is a lit rib over a dark trough (the geometry is half as deep again here), a shade deeper overall
      form = mix(form, (0.22 + 0.4*max(upG, 0.0) + 1.5*max(up, 0.0) + 0.85*max(Np.y, 0.0))*(1.0 + 0.7*shelfTop), zCob*(1.0 - 0.5*zInk));      // (and every cup has a lit upper lip over a deep hollow)
      amb = mix(amb, tint*(0.19 + 1.1*day)*form*mix(0.84, 1.16, arete), zCob*(1.0 - 0.5*zInk)*smoothstep(8.0, 30.0, D));
      amb *= mix(1.0, mix(0.56, 1.36, rib)*0.94, zCob*(1.0 - 0.4*zInk));
      // INK: the daylight is a trace of indigo on the same forms (never out: the cups and ribs still read in it)
      // (the upper lip of every cup and every rib keeps twice the light of the hollows: form, not a flat dimming)
      amb *= mix(1.0, mix(0.3, 0.62, clamp(0.55*rib + 0.9*max(up, 0.0)*cup + 0.5*crest*cup, 0.0, 1.0)), zInk);
      // and one shaft of it stands in the well: a wedge of direct light that slides down the wall across from the sun
      // and narrows to nothing far below
      vec3 Lb = normalize(vec3(sh.x*0.15, ${COSL.toFixed(4)}, ${SINL.toFixed(4)} + sh.y*0.15));
      float tb = D/max(Lb.y, 0.3);
      vec2 eb = vec2(vP.x + Lb.x*tb, vP.z + Lb.z*tb - uMouth.x)/(uMouth.zw*0.62);
      float beam = (1.0 - smoothstep(0.5, 1.0 + D*0.003, dot(eb, eb) + 0.3*(smNoise(vSurf*0.11) - 0.5)))*smoothstep(10.0, 26.0, D)*smoothstep(-0.05, 0.14, dot(N, Lb));
      // (the mouth's own daylight, sky-blue then turquoise: the SUN's gold lies only where the sun's ray reaches through
      // the mouth, "lit" above, the crescent on the far wall's top, as deep as the sun's height and the mouth's width give)
      vec3 beamCol = mix(uSkyCol*1.1 + uSnow*0.45, uTurq*1.25, smoothstep(20.0, 110.0, D));
      amb += beamCol*beam*1.5*exp(-D/95.0)*(0.3 + 1.7*max(dot(Np, Lb), 0.0))*(1.0 - 0.75*zCob);
      // THE SKYLIGHT. The mouth stands over the hanging wall (the wall across from the falling water, the top of the
      // frame for an eye looking down the axis), so that wall keeps a long tongue of aqua daylight: broad all the way down
      // and dying out near 250 m, brightest on the aretes, the shelf tops and the upper lips of the cups, torn at its edges.
      // It is what the waterfall ropes run down, and it is the second hue of the cobalt reach.
      float skW = mix(17.0, 12.0, smoothstep(60.0, 220.0, D));
      float skX = abs(vP.x + 2.5*(smNoise(vec2(D*0.03, 7.0)) - 0.5)) + 3.0*(smNoise(vSurf*vec2(0.3, 0.07)) - 0.5);
      float skyl = (1.0 - smoothstep(skW*0.55, skW, skX))*smoothstep(0.1, 0.5, N.z)*smoothstep(38.0, 70.0, D)*(1.0 - smoothstep(200.0, 250.0, D));
      vec3 skCol = mix(uTurq*1.05 + uSnow*0.3, uTurq*1.25 + uSnow*0.14, smoothstep(60.0, 170.0, D));
      skyl *= mix(1.0, 0.45, smoothstep(105.0, 185.0, D))*(1.0 - 0.62*zCob)*(1.0 - 0.6*zInk);          // (it thins by half below 185 m, and in the cobalt reach it is a trace)
      amb += skCol*skyl*(0.5 + 0.3*exp(-D/120.0))*(0.3 + 0.8*max(up, 0.0) + 0.5*arete*arete + 0.6*shelfTop);
      iceMix = max(iceMix, smoothstep(3.0, 9.0, D));
    }
  #endif
  #ifdef IS_ICICLE
    lit = max(vIce.y, 0.0); cup = 0.0; crest = 0.0; Np = N;
    amb = (uSkyCol*0.7 + uElectric*0.12)*mix(1.0, 0.86, step(vIce.y, -0.5));      // aInst.x = -1: under a bridge, in its shade
  #endif
  #ifdef IS_BLOCK
    lit = (1.0 - smoothstep(-2.0, 6.0, vP.z))*(1.0 - smoothstep(14.0, 30.0, D));
    day = exp(-max(D - 12.0, 0.0)/60.0);
    amb = mix(uSkyCol*0.8 + uElectric*0.25, cobD*1.2, smoothstep(40.0, 120.0, D))*(0.3 + 0.9*day)*(1.0 - smoothstep(120.0, 240.0, D));
    amb += (uTurq*0.5 + uSnow*0.34)*(0.55 + 0.45*Np.y)*smoothstep(20.0, 45.0, D)*(1.0 - smoothstep(150.0, 215.0, D));
    alb = mix(alb, snow, 0.55 + 0.45*smoothstep(-0.1, 0.25, N.y));
    amb *= 0.72 + 0.4*Np.y;
    alb *= mix(1.0, (0.6 + 0.75*cr0)*(1.0 - 0.45*pit)*(0.86 + 0.28*smNoise(vLoc.xz*11.0 + 3.0)), topK);
    alb = mix(alb, uTurq*0.5 + cobD*0.12, wetB*(1.0 - topK)*0.75*(1.0 - smoothstep(13.0, 20.0, D)));
  #endif
  #ifdef IS_RAFT
    lit = smoothstep(uLitY - 1.0, uLitY, vW.y);
    day = exp(-max(D - 12.0, 0.0)/60.0);
    amb = mix(uSkyCol*(0.95 + 0.3*N.y) + uElectric*0.25*(1.0 - lit), cobD*1.2, smoothstep(40.0, 120.0, D))*(0.3 + 0.9*day)*(1.0 - smoothstep(120.0, 240.0, D));
    // in the fall a block keeps a pale aqua of its own (snow crust in the mouth's light), so it reads against the cobalt wall
    amb += (uTurq*0.5 + uSnow*0.34)*(0.55 + 0.45*Np.y)*smoothstep(20.0, 45.0, D)*(1.0 - smoothstep(150.0, 215.0, D));
    alb = mix(alb, snow, 0.5 + 0.5*smoothstep(-0.1, 0.25, N.y));
    alb *= mix(1.0, (0.6 + 0.75*cr0)*(1.0 - 0.45*pit), topK*(1.0 - 0.75*smoothstep(15.0, 40.0, D)));      // wind crust and melt pits on top (washed off in the fall)
    alb = mix(alb, uTurq*0.5 + cobD*0.12, wetB*(1.0 - topK)*0.75);              // the wet, darker band at the waterline
  #endif
  #ifdef IS_APRON
    {
      vec2 em = vec2(vP.x, vP.z - uMouth.x)/(uMouth.zw + 4.4);
      float e = dot(em, em);
      if (e < 1.0 && vP.z < 5.6) discard;
      if (abs(vP.x) < 5.5 && vP.z > 0.0 && vP.z < uMouth.y) discard;
      // sastrugi, crust, rills, cryoconite country
      vec2 ws = vP.xz*vec2(0.11, 0.5) + vec2(0.0, 0.3*smNoise(vP.xz*0.05));
      float s0 = smFbm(ws), s1 = smFbm(ws + vec2(0.035, 0.0)), s2 = smFbm(ws + vec2(0.0, 0.25));
      float far = 1.0 - smoothstep(60.0, 320.0, dist);
      Np = normalize(N + vec3((s0 - s1)*3.2, 0.0, (s0 - s2)*1.2)*far*(1.0 - smoothstep(0.15, 0.7, fwidth(vP.z)*0.55)));
      ndl = max(dot(Np, vSunW), 0.0);
      float country = smFbm(vP.xz*0.011 + 3.0);
      float edge = max(1.0 - smoothstep(1.0, 1.7, e), (1.0 - smoothstep(6.0, 16.0, abs(vP.x)))*step(0.0, vP.z)*step(vP.z, uMouth.y));
      alb = snow*(0.9 + 0.1*s0);
      alb = mix(alb, mix(uSnow, uCryo, 0.38)*0.74, smoothstep(0.5, 0.72, country)*(0.3 + 0.4*uSeason));
      alb = mix(alb, uMauve, uLate*0.3*smoothstep(0.4, 0.7, smFbm(vP.xz*0.03 + 9.0)));
      alb = mix(alb, mix(uSnow, uTurq, 0.45)*0.7, edge*0.55*smoothstep(0.3, 0.7, smNoise(vP.xz*0.25) + edge*0.4));
      float rw = fwidth(vP.x) + fwidth(vP.z);
      // blue rills: tributaries running into the canyon like the barbs of a feather
      float tr = (vP.z + abs(vP.x)*0.55 + 9.0*smNoise(vP.xz*0.03) + 2.5*smNoise(vP.xz*0.13))/31.0;
      float tcell = floor(tr), tf = abs(fract(tr) - 0.5)*31.0;
      float rh = smHash(vec2(tcell, sign(vP.x)*3.0 + 5.0));
      float rw0 = 0.22 + 0.4*rh, rwid = max(rw0, rw*0.9);
      float rill = (1.0 - smoothstep(rwid, rwid + rw*0.9 + 0.05, tf))*(rw0/rwid)*step(0.3, rh)
        *smoothstep(5.0, 9.0, abs(vP.x))*(1.0 - smoothstep(40.0 + 120.0*rh, 60.0 + 150.0*rh, abs(vP.x)))*step(4.0, vP.z);
      alb = mix(alb, uElectric*0.8, rill*0.8);
      vec2 pc = vP.xz*1.6; vec2 pi = floor(pc); vec2 ph = smHash2(pi);
      float pd = length(fract(pc) - 0.2 - 0.6*ph), pr = 0.06 + 0.16*smHash(pi + 5.0);
      float paa = rw*0.9;
      float pock = (1.0 - smoothstep(pr, pr + 0.03 + paa, pd))*(pr/(pr + paa))*step(0.8 - 0.2*uSeason, ph.x)
        *(1.0 - smoothstep(0.06, 0.3, rw))*smoothstep(0.45, 0.7, smNoise(vP.xz*0.07 + 4.0));
      alb = mix(alb, uCryo*0.5, pock*0.8);
      amb = uSkyCol*(0.75 + 0.25*Np.y);
      depthIn = 0.0; iceMix = 0.0; bands = vec3(0.0);
    }
  #endif
  #ifdef IS_WALL
    float wrap = max(ndl*0.55 + 0.45*max(ndlG, 0.0), 0.0);   // the lit wall reads as one cream plane, not as half-blue cups
  #else
    float wrap = max(ndl*0.85 + 0.15*max(ndlG, 0.0), 0.0);
  #endif
  vec3 key = uSunCol;
  #ifdef IS_WALL
    key *= mix(vec3(1.0), uGold*1.35, 0.42*uWarm);
  #endif
  #ifdef IS_SHAFT
    key *= mix(vec3(1.0), uGold*1.5, 0.8*uWarm)*1.15;          // the gold crescent on the far wall
  #endif
  vec3 col = alb*(key*wrap*lit*0.95 + amb)*cupAO;
  // ---- light through the ice: turquoise near the surface, electric cobalt low down, strongest in the notch
  vec3 glowCol = mix(uTurq*0.8, mix(cobD, uElectric, 0.55)*1.25, smoothstep(0.8, 7.0, depthIn));
  float glow = vIce.x*vIce.x*(0.22 + 0.95*bands.x + 0.8*bands.y)*mix(1.0, 0.3, lit*smoothstep(0.0, 0.4, ndlG));
  #ifdef IS_SHAFT
    glowCol = mix(uTurq, mix(uElectric, cobD, 0.6)*1.4, smoothstep(20.0, 110.0, D));
    glow = (0.2 + 0.34*bands.x + 0.34*bands.y)*(0.2 + 0.9*exp(-D/55.0))*(1.0 - 0.6*lit)*iceMix*(1.0 - 0.6*smoothstep(130.0, 240.0, D))*mix(1.0, 0.45 + 0.85*rib, zCob)*(1.0 - 0.7*zInk);
  #endif
  #if defined(IS_RAFT) || defined(IS_BLOCK)
    glow *= day;
  #endif
  col += glowCol*glow*0.85;
  // ---- crests: gold on the lit side, pale blue in shadow
  float rim = (1.0 - smoothstep(0.0, 0.3, sqrt(f2) - sqrt(f1)))*lod;                // a wider, softer band along each crest
  col += uGold*min(uSunCol*1.1, vec3(1.3))*(crest*0.5 + rim*0.5)*cup*lit*smoothstep(-0.1, 0.5, ndlG)*mix(0.25, 0.85, uWarm);   // gold only as far as the key is
  #if defined(IS_RAFT) || defined(IS_BLOCK)
    col += uTurq*0.22*wetB*(1.0 - topK)*day;
  #endif
  col += uSkyCol*crest*cup*(1.0 - lit)*0.05*day;
  // ---- running melt threads and creeping films
  float thr = smoothstep(0.64, 0.8, smNoise(vec2(along*1.9, 2.0)))*smoothstep(1.0, 3.0, depthIn)*(1.0 - smoothstep(0.2, 0.7, fw));
  float run = smNoise(vec2(along*5.7, vSurf.y*0.9 + uTime*2.4));
  float glint = thr*smoothstep(0.5, 0.85, run);
  col *= 1.0 - 0.14*thr;
  // ---- wet speculars, sky fresnel, sparkle
  vec3 Hh = normalize(V + vSunW);
  float spec = pow(max(dot(Np, Hh), 0.0), 70.0)*lit;
  float fres = pow(clamp(1.0 - dot(Np, V), 0.0, 1.0), 4.0);
  col += uSunCol*spec*1.6*(0.35 + 0.65*iceMix) + uSkyCol*fres*0.3*day;
  col += (uSkyCol*0.3*day + uSunCol*lit*0.9)*glint;
  #ifdef IS_SHAFT
    // wet films keep glinting as they creep down the flutes, cyan from the ring, long after the daylight has gone
    col += (uTurq*0.04 + uPortalCol*0.03)*glint*smoothstep(45.0, 95.0, D)*(1.0 - 0.7*smoothstep(165.0, 200.0, D))*(0.35 + 0.65*vIce.x);
  #endif
  float hs = smHash(idc + 3.0), hs2 = smHash(idc + 11.0);
  float tw = pow(max(sin(uTime*(1.5 + 3.5*hs) + hs*40.0), 0.0), 18.0)*step(0.72, hs2)*lod*cup*exp(-f1*90.0);
  col += uSunCol*tw*(lit*smoothstep(-0.2, 0.4, ndlG)*4.0 + 0.5*day);
  #ifdef IS_APRON
    float gs = smHash(floor(vP.xz*9.0)), gt = pow(max(sin(uTime*(2.0 + 3.0*gs) + gs*50.0), 0.0), 20.0);
    col += uSunCol*gt*step(0.9, smHash(floor(vP.xz*9.0) + 2.0))*(1.0 - smoothstep(0.05, 0.3, fwidth(vP.x)*9.0))*2.2;
  #endif
  #ifdef IS_ICICLE
    // glass, not a blade: a darker core, a bright rim where the surface turns away, and one long highlight down its length
    // (the light behind comes through the body, a dark band of bent light runs just inside each edge, rings of growth
    // cross it every few centimetres, and the root is frosted white where it joins the snow)
    float icC = abs(dot(N, V));
    float icR = pow(clamp(1.0 - icC, 0.0, 1.0), 1.6);
    float icT = clamp((vIce.z - 3.0)/1.4, 0.0, 1.0);
    // (under a bridge it hangs in the bridge's shade: a pale blue-white spike against the dark roof, a little brighter
    // seen from below with the sky behind it; and it has no frosted root: it comes out of the ice as ice)
    float icBr = step(vIce.y, -0.5);
    float icSh = mix(1.0, mix(0.82, 1.0, smoothstep(0.14, 0.4, -V.y)), icBr);
    float icBand = smoothstep(0.22, 0.42, icC)*(1.0 - smoothstep(0.5, 0.8, icC));
    float icRib = 0.84 + 0.16*sin(vSurf.y*24.0 + 2.0*sin(vSurf.x*10.0));
    vec3 icH = normalize(V + normalize(vec3(vSunW.x, 0.25, vSunW.z) + vec3(1e-4, 0.0, 0.0)));
    float icL = min(1.0, dot(uSkyCol, vec3(1.1)));      // (its own whites follow the sky's brightness: quiet at twilight)
    col = mix(col, (uSkyCol*0.5 + (uTurq*0.3 + uSnow*0.08)*icL)*day*icSh, 0.5)*icRib*(1.0 - 0.38*icBand);
    col = mix(col, (uSnow*0.5*icL + uSkyCol*0.3)*day*icSh, 0.6*(1.0 - smoothstep(0.0, 0.22, icT))*(1.0 - icBr));
    col += (uSkyCol*0.4 + uSnow*0.14*icL)*icR*icR*day*icSh +(uSkyCol*0.5 + uSunCol*0.7*lit)*pow(max(dot(vec3(N.x, 0.0, N.z), icH), 0.0), 20.0);
  #endif
  // ---- the portal's light on the flutes, breathing
  float pd2 = dot(vPL, vPL);
  vec3 pL = vPL*inversesqrt(max(pd2, 1e-4));
  #ifdef IS_SHAFT
    // THE RING'S LIGHT. It fills the bottom of the well as a glow more than a lamp (the mist carries it), so every cup,
    // shelf and rib for 60 m above the ring stands in rich blue, and only the shaft beyond the ring is ink.
    // It comes from below, so the upper lip of every cup catches it as a crescent and the cup under it stays deep cobalt.
    // The 2 m cups melt into the distance a little way down the well, so the ring also lights a second, larger generation
    // of scallops (5 by 6 m, this term only): cups read all the way down to the ring, and the flutes' rays stay fainter.
    vec2 q2 = vSurf*vec2(0.2, 0.17) + 0.35*vec2(smNoise(vSurf*0.13 + 5.0), smNoise(vSurf*0.13 + 23.0));
    vec2 ic2 = floor(q2), fc2 = fract(q2); float g1 = 9.0, g2 = 9.0; vec2 gv2 = vec2(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j)); vec2 c = o + 0.15 + 0.7*smHash2(ic2 + o + 37.0) - fc2; float d = dot(c, c);
      if (d < g1) { g2 = g1; g1 = d; gv2 = c; } else if (d < g2) { g2 = d; }
    }
    float lod2 = 1.0 - smoothstep(0.22, 0.8, fw*0.34);
    float rimB = (1.0 - smoothstep(0.0, 0.13, sqrt(g2) - sqrt(g1)))*lod2;
    vec3 Nr = normalize(Np + (T*gv2.x + B*gv2.y)*1.25*lod2);
    float pf = max(dot(Nr, pL), 0.0);
    float pwrap = 0.27 + 1.5*pf*pf;
    float breathe = 0.88 + 0.12*sin(uTime*0.9), pFall = 1.0/(1.0 + pd2/900.0);
    vec3 pTint = mix(mix(uElectric*1.15, uPortalCol, 0.16), uPortalCol*0.9, 0.45*smoothstep(0.45, 0.95, pf));
    // (TOWARD INK the fill draws in to the last 40 m and is three fifths as strong, and it models the flutes: ribs lit,
    // troughs deep; what the outer frame keeps is the crescents below and the trace of indigo daylight)
    float pFill = 1.0/(1.0 + pd2/mix(900.0, 460.0, zInk));
    col += pTint*(alb*0.9 + 0.08)*uPortalI*0.34*mix(1.0, 0.62, zInk)*pwrap*mix(mix(0.94, 1.04, vIce.x), mix(0.55, 1.5, rib), zInk)*pFill*breathe;
    // THE CRESCENTS REACH FURTHER UP THE WELL THAN THE FILL, and how far is a matter of the wall point's own distance
    // from the ring, whoever looks: within 30 m of it every lip is the ring's own cyan at full strength; further up the
    // strength falls off slowly (still a quarter at 80 m, a tenth at 150 m) and the tone deepens to sapphire-cyan (farW),
    // so the ring stays the brightest thing in the well and the deep reach is never as pale as the mouth.
    float farW = smoothstep(30.0, 85.0, sqrt(pd2));
    float pFallR = max(pFall, 0.6/(1.0 + pd2/5200.0));
    float pfR = smoothstep(0.05, 0.5, max(dot(Nr, pL), 0.0) + 0.25*max(dot(N, pL), 0.0)*farW);
    vec3 ringCol = mix(uPortalCol, mix(uElectric, uPortalCol, 0.3)*1.05, 0.75*farW);
    // (toward ink the cups keep their crescents: thin cyan upper lips are what the ink is drawn with)
    col += ringCol*(rimB*mix(0.6, 0.75, farW) + crest*cup*0.42)*(0.2 + 0.8*pfR)*uPortalI*0.41*pFallR*(1.0 - 0.56*smoothstep(0.4, 0.9, pFall))*breathe*mix(1.0, min(0.74 + 0.7*smoothstep(0.14, 0.5, pFall), 1.0), zInk);
    // the cups melt into the distance down the well (they must, or they would alias), so far from the ring it is the
    // geometry that carries its light: the lip of every ledge is a broken cyan arc and every arete a cyan thread
    col += ringCol*(vIce.y*0.6 + vIce.x*vIce.x*0.16)*uPortalI*0.4*pFallR*(1.0 - 0.7*smoothstep(0.35, 0.9, pFall))*breathe*farW;
    // from far above, a thin cyan rim on every arete: a trace only, laid over the lit ice (and fainter than the cups' rims near the ring)
    float farP = smoothstep(60.0, 110.0, D)*(1.0 - 0.5/(1.0 + pd2/3600.0));
    col += uPortalCol*vIce.x*vIce.x*(0.35 + 0.65*max(dot(N, pL), 0.0))*0.1*farP/(1.0 + pd2/9000.0)*(0.86 + 0.14*sin(uTime*0.9));
  #else
    float pnl = 0.3 + 0.7*max(dot(Np, pL), 0.0);
    col += uPortalCol*(alb*0.6 + 0.4*crest + 0.1)*uPortalI*pnl/(1.0 + pd2/420.0)*(0.86 + 0.14*sin(uTime*0.9));
    #if defined(IS_RAFT) || defined(IS_BLOCK)
      // blocks tumbling in the fall: under-faces and edges rim-lit cyan by the ring from far above it
      float farB = smoothstep(40.0, 90.0, D)*(1.0 - smoothstep(175.0, 205.0, D))/(1.0 + pd2/9000.0);
      col += uPortalCol*((alb*0.9 + 0.08)*(0.14 + 0.86*pow(max(dot(Np, pL), 0.0), 1.5))*1.5 + 0.35*pow(clamp(1.0 - dot(Np, V), 0.0, 1.0), 3.0))*farB;
    #endif
  #endif
  #ifdef IS_SHAFT
    // THE CONDUIT: its throat is ink, a hole darker than anything round it, by how far into the scoop the wall point
    // lies (pk), whoever looks: three quarters of the way to black at its mouth, nine tenths at its deepest, every cup's
    // upper lip a step above black on the way in. Its edge is wet and catches what light there is, cup by cup (a
    // scalloped edge, not a ruled one), and so do the throat's sides.
    // THE WALL BEHIND THE EDGE IS INK AT ONCE. From the edge the wall turns in under the lip: 12 m of it in 2.4 m of
    // depth, a few long facets on which a cup's lit lip is drawn metres wide. A hand below the edge (cIn) it already
    // has the darkness of the scoop it leads into (cGd), nine tenths while it is still turning in (cTurn), and nothing
    // on it is lit: seen from beside the mouth it is the black of the throat, never a pale facet.
    float cTopL = clamp(-cUp/2.4, 0.0, 1.0), cIn = smoothstep(0.0, 0.06, cTopL), cTurn = cIn*(1.0 - smoothstep(0.6, 1.0, cTopL));
    float thrK = max(smoothstep(0.03, 0.5, pk), cIn*smoothstep(0.03, 0.5, cGd)), thrD = max(smoothstep(0.3, 0.85, pk), cTurn*smoothstep(0.03, 0.3, cGd));
    col = mix(col, uInk*0.5, (0.72 + 0.2*thrD)*thrK) + (cobD*0.03 + uElectric*0.016)*thrK*mix(2.0, 0.6, thrD)*(0.3 + 1.1*max(Np.y, 0.0) + 1.2*crest*cup + 0.6*rimB + 0.5*rib)*(1.0 - 0.8*cTurn);
    float sideE = smoothstep(0.02, 0.1, cGd)*(1.0 - smoothstep(0.1, 0.36, cGd))*cIn*(1.0 - cTurn);
    // (the half metre of wet wall above the edge: lit only on its cups' lips and its ribs, never a pale band)
    float cuq = cUp/(cUp > 0.0 ? 0.6 : 0.1);
    float lipIce = max(exp(-cuq*cuq)*cArcK, 0.2*sideE)*(1.0 - 0.7*smoothstep(0.3, 0.7, pk));
    col += (uTurq*0.46 + uPortalCol*0.2 + uSnow*0.1)*lipIce*(0.03 + 0.5*crest + 0.3*rimB + 0.08*rib)*0.6;
    // (and the very edge is a thin wet line that follows the scallops, a hand wide and never thinner than two pixels:
    // brightest where a cup's lip or a rib meets it)
    float eW = max(0.14, 1.5*fwidth(cUp));
    float edgeL = (1.0 - smoothstep(0.45*eW, eW, abs(cUp - 0.14)))*cArcK;
    col += (uTurq*0.34 + uPortalCol*0.2 + uSnow*0.14)*edgeL*(0.4 + 0.45*crest + 0.3*rib)*0.9;
  #endif
  gl_FragColor = vec4(smFog(col, vP.y, dist), 1.0);
}`;

// rigid tumbling blocks: advected down the river, over the brink and down the sheet, all in the vertex shader
const BLOCK_PARS = /* glsl */`
vec3 smFlowPos(float s, float lane, out vec3 tang){
  // s: metres along the flow line from the upstream end. uFlow = (reach, speed, arcLen, fallLen)
  float sz = uFlow.x - s;                               // canyon: z = reach - s
  if (s < uFlow.x) { tang = vec3(0.0, -0.02, -1.0); return vec3(lane, -${LIP_D}.0 + 0.02*sz, sz); }
  float a = s - uFlow.x;
  if (a < uFlow.z) { float ph = a/${RB}.0; tang = vec3(0.0, -sin(ph), -cos(ph)); return vec3(lane*(1.0 + 0.25*a/uFlow.z), -${LIP_D}.0 - ${RB}.0*(1.0 - cos(ph)), -${RB}.0*sin(ph)); }
  float b = a - uFlow.z;
  tang = vec3(0.0, -${COSL.toFixed(5)}, -${SINL.toFixed(5)});
  return vec3(lane*(1.25 + 0.3*b/uFlow.w), -${ARC_D.toFixed(4)}, ${ARC_Z.toFixed(4)}) + tang*b;
}
void smBlock(inout vec3 p, inout vec3 n){
  float total = uFlow.x + uFlow.z + uFlow.w;
  // time warp: constant speed in the canyon, accelerating once over the brink
  float ph = fract(aSeed.x + uTime*uFlow.y/ (total*1.18));
  float s = ph*total*1.18; float over = max(s - uFlow.x - 2.0, 0.0); s += over*over*0.0035; s = min(s, total);
  vec3 tang; vec3 c = smFlowPos(s, aSeed.y, tang);
  float fall = smoothstep(uFlow.x, uFlow.x + uFlow.z, s);
  float spin = uTime*(0.25 + 1.6*fall)*(aSeed.z - 0.5)*2.0 + aSeed.z*20.0;
  float bob = sin(uTime*1.7 + aSeed.x*60.0)*0.12*(1.0 - fall);
  // rotate about a per-block axis (yaw in the river, tumble in the fall)
  if (aSeed.z > 0.55) { p.y *= 0.5; p.xz *= 1.45; n = normalize(n*vec3(0.5, 1.45, 0.5)); }
  vec3 ax = normalize(mix(vec3(0.0, 1.0, 0.0), vec3(sin(aSeed.w*9.0), 0.3, cos(aSeed.w*9.0)), fall));
  float cs = cos(spin), sn = sin(spin);
  p = p*cs + cross(ax, p)*sn + ax*dot(ax, p)*(1.0 - cs);
  n = n*cs + cross(ax, n)*sn + ax*dot(ax, n)*(1.0 - cs);
  float gone = 1.0 - smoothstep(total - 14.0, total - 2.0, s);
  float born = smoothstep(0.0, 6.0, s);
  p *= aSeed.w*gone*born;
  vec3 up = normalize(cross(vec3(1.0, 0.0, 0.0), tang));
  p += c + up*(0.1 + bob + fall*(1.2 + 2.2*aSeed.z));
}`;

export function makeIceMaterial(U, variant = 'wall', o = {}) {
  const defines = {};
  defines['IS_' + variant.toUpperCase()] = '';
  const mat = new THREE.ShaderMaterial({
    defines, fog: true, side: o.side ?? THREE.FrontSide,
    uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, o.uniforms || {}),
    vertexShader: ICE_VERT.replace('ICE_BLOCK_PARS', BLOCK_PARS), fragmentShader: ICE_FRAG,
  });
  return mat;
}

// ---------------------------------------------------------------- geometry builders
function gridIndex(nu, nv, flip) { // (nu+1) x (nv+1) vertices, row-major along v
  const idx = new Uint32Array(nu * nv * 6); let k = 0;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    if (flip) { idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c; }
    else { idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  }
  return idx;
}
// BUILDING IN SLICES. The big builders are generators ("...Steps") that pause every few milliseconds of work:
// runSteps() runs one straight through, runStepsAsync(gen, yieldFn) hands the frame back at every pause, so no
// step of a world's build holds the page for long. Neither changes what is built.
export function runSteps(gen) { let r = gen.next(); while (!r.done) r = gen.next(); return r.value; }
export async function runStepsAsync(gen, yieldFn) { let r = gen.next(); while (!r.done) { if (yieldFn) await yieldFn(); r = gen.next(); } return r.value; }
// Area-weighted vertex normals of a (nu+1) x (nv+1) grid indexed by gridIndex(nu, nv, false): the same sums as
// BufferGeometry.computeVertexNormals, a few rows at a time. keep(a, b, c, d): optional, false leaves a quad out.
export function* gridNormalSteps(pos, nu, nv, rows = 24, keep = null) {
  const W = nu + 1, nrm = new Float32Array(pos.length);
  const tri = (a, b, c) => {                                   // three's rule: n = (pC - pB) x (pA - pB)
    const a3 = a * 3, b3 = b * 3, c3 = c * 3;
    const ax = pos[a3] - pos[b3], ay = pos[a3 + 1] - pos[b3 + 1], az = pos[a3 + 2] - pos[b3 + 2];
    const cx = pos[c3] - pos[b3], cy = pos[c3 + 1] - pos[b3 + 1], cz = pos[c3 + 2] - pos[b3 + 2];
    const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
    nrm[a3] += nx; nrm[a3 + 1] += ny; nrm[a3 + 2] += nz; nrm[b3] += nx; nrm[b3 + 1] += ny; nrm[b3 + 2] += nz; nrm[c3] += nx; nrm[c3 + 1] += ny; nrm[c3 + 2] += nz;
  };
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * W + i, b = a + 1, c = a + W, d = c + 1;
      if (keep && !keep(a, b, c, d)) continue;
      tri(a, c, b); tri(b, c, d);
    }
    if (j % rows === rows - 1) yield;
  }
  for (let i = 0; i < nrm.length; i += 3) {
    const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1;
    nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l;
  }
  return nrm;
}
function* finishGridSteps(pos, surf, ice, nu, nv, towardFn) {
  const nrm = yield* gridNormalSteps(pos, nu, nv);
  // make the faces look toward towardFn(x,y,z) (a point the surface should face)
  const cnt = pos.length / 3, step = Math.max(1, Math.floor(cnt / 400)); let dot = 0;
  for (let i = 0; i < cnt; i += step) {
    const t = towardFn(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
    dot += (t[0] - pos[i * 3]) * nrm[i * 3] + (t[1] - pos[i * 3 + 1]) * nrm[i * 3 + 1] + (t[2] - pos[i * 3 + 2]) * nrm[i * 3 + 2];
  }
  const flip = dot < 0;
  if (flip) for (let i = 0; i < nrm.length; i++) nrm[i] = -nrm[i];
  yield;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('aSurf', new THREE.BufferAttribute(surf, 2));
  g.setAttribute('aIce', new THREE.BufferAttribute(ice, 3));
  g.setIndex(new THREE.BufferAttribute(gridIndex(nu, nv, flip), 1));
  return g;
}

// One swept canyon wall (cornice, overhang, face, notch).
//   o.stations: [{ x, z, tx, tz, water, rim, half }]: centreline points in flow order, unit flow tangent (XZ),
//               water level, rim level and waterline half-width there (7 for the straight, 6 for the meanders)
//   o.side: +1 = right of the flow, -1 = left.   o.noise: a kit noise.   o.sunDir: THREE.Vector3 toward the sun.
//   o.fadeEnd: metres over which the relief dies toward the last station (hero: so it meets the shaft)
//   o.clip(v, depthBelowRim): optional, moves a vertex {x,y,z} (hero: onto the shaft's headwall)
//   o.cornice: height scale of the snow cornice (default 1).   o.alongStart: surface metres at station 0.
// Returns a BufferGeometry for makeIceMaterial(U, 'wall'). buildCanyonWallAsync(o, yieldFn) builds the same wall in slices.
export function buildCanyonWall(o) { return runSteps(canyonWallSteps(o)); }
export function buildCanyonWallAsync(o, yieldFn) { return runStepsAsync(canyonWallSteps(o), yieldFn); }
function* canyonWallSteps(o) {
  const st = o.stations, ns = st.length, np = profile.length, side = o.side, nz = o.noise, sun = o.sunDir;
  const pos = new Float32Array(ns * np * 3), surf = new Float32Array(ns * np * 2), ice = new Float32Array(ns * np * 3);
  const sh = Math.hypot(sun.x, sun.z) || 1e-3, tanEl = sun.y / sh;
  let along = o.alongStart || 0; const v = { x: 0, y: 0, z: 0 };
  let total = 0; for (let i = 1; i < ns; i++) total += Math.hypot(st[i].x - st[i - 1].x, st[i].z - st[i - 1].z);
  for (let i = 0; i < ns; i++) {
    const s = st[i];
    if (i > 0) along += Math.hypot(s.x - st[i - 1].x, s.z - st[i - 1].z);
    const rx = -s.tz * side, rz = s.tx * side;                 // outward (away from the water) on this side
    const H = s.rim - s.water, k = s.half / 7;
    // sun-lit depth below the rim: the far rim's shadow line on this wall
    const cIn = (-rx * sun.x - rz * sun.z) / sh;                // > 0 when this wall faces the sun
    const litDepth = cIn > 0.05 ? Math.min(40, 2 * 5.3 * k * tanEl / cIn) : 0;
    const fade = o.fadeEnd ? smoothstep(0, o.fadeEnd, total - (along - (o.alongStart || 0))) : 1;
    const a = along * side + (side > 0 ? 0 : 517);              // each side gets its own relief
    const big = 1 + 0.9 * Math.max(0, nz.n2(a * 0.025, 77));
    for (let j = 0; j < np; j++) {
      const pr = profile[j], t = pr[1];
      let y, hAbove;
      if (t < 0) { y = s.water + t; hAbove = t; } else if (t <= 1) { y = s.water + t * H; hAbove = t * H; } else { y = s.rim + (t - 1); hAbove = H + (t - 1); }
      // relief: metre-scale buttresses and big scallops on the face, drifted cornice on top
      let off = pr[0] * k;
      const face = pr[3] === 0 ? 1 : pr[3] === 1 ? 0.6 : 0;
      const but = 0.75 * nz.fbm2(a * 0.045, y * 0.05 + 3, 3) + 0.38 * nz.n2(a * 0.16, y * 0.22) + 0.2 * nz.n2(a * 0.55, y * 0.7 + 9);
      off += but * fade * face * (0.45 + 0.55 * smoothstep(0, 0.25, t));
      if (pr[3] === 2) {
        const cn = nz.fbm2(a * 0.07, 40 + j * 0.3, 2);
        off += cn * 0.5 * fade;
        y = s.rim + (t - 1) * (0.75 + 0.5 * cn) * (pr[0] < 9 ? big : 1) * (o.cornice ?? 1) * (0.35 + 0.65 * fade);
        if (j === np - 5) off -= 0.35 * (big - 1) * fade;       // the cornice lip leans out further where it is big
      }
      v.x = s.x + rx * off; v.y = y; v.z = s.z + rz * off;
      const depth = s.rim - v.y;
      if (o.clip) o.clip(v, depth);
      const q = (i * np + j);
      pos[q * 3] = v.x; pos[q * 3 + 1] = v.y; pos[q * 3 + 2] = v.z;
      surf[q * 2] = a; surf[q * 2 + 1] = hAbove;
      ice[q * 3] = pr[2]; ice[q * 3 + 1] = litDepth; ice[q * 3 + 2] = pr[3] === 2 ? Math.min(depth, 0.3) : depth;
    }
    if (i % 10 === 9) yield;
  }
  // the surface must face the water
  return yield* finishGridSteps(pos, surf, ice, np - 1, ns - 1, (x, y, z) => {
    let best = 1e9, bi = 0; for (let i = 0; i < ns; i += 4) { const d = (st[i].x - x) ** 2 + (st[i].z - z) ** 2; if (d < best) { best = d; bi = i; } }
    return [st[bi].x, y + 6, st[bi].z];
  });
}

// The moulin: rim flare, funnel, brink curve, fluted leaning shaft, conduit pocket.
const rimExtra = (D) => (D >= 1.3 ? 3.6 * Math.max(0, 1 - D / 6) ** 2 : lerp(7.6, 2.2, smoothstep(-0.55, 1.3, D)));
function* shaftSteps(shape, S, nz, detail) {
  const nu = N_FLUTE * SEG_PER_FLUTE;
  // rings: explicit snow-lip rings [y, extra radius, depth], dense over the brink, then growing steps
  const rings = [[-0.6, 10, 0.6], [0.55, 7.6, -0.55], [0.6, 5.6, -0.6], [0.15, 4.3, -0.15], [-0.55, 3.2, 0.55]];
  let D = 1.3;
  while (D < SHAFT_D) {
    rings.push([-D, shape.flare(D), D]);
    const nearLip = Math.exp(-((D - 13.5) * (D - 13.5)) / 30);
    // (and three times as fine across the conduit's lip and its arch, from 16 m above its depth to 8 m below: the edge
    // is a curve, not a run of straight facets)
    D += lerp(lerp(0.9, 1.4, smoothstep(8, 40, D)) + 1.8 * smoothstep(278, 292, D), 0.3, nearLip) / (detail < 1 ? 0.8 : 1) * lerp(1, 0.34, smoothstep(shape.cd - 18, shape.cd - 14, D) * (1 - smoothstep(shape.cd + 6, shape.cd + 10, D)));
  }
  rings.push([-SHAFT_D, 0, SHAFT_D]);
  const nv = rings.length - 1, cnt = (nu + 1) * (nv + 1);
  const pos = new Float32Array(cnt * 3), surf = new Float32Array(cnt * 2), ice = new Float32Array(cnt * 3);
  const cdA = new Float32Array(cnt * 2);                     // aCd = (x before flutes and scoop, metres of arc from the throat's middle): ICE_FRAG works the throat and its lip out from them
  // irregular flutes: per-flute width and depth
  const fr = S.rng, wj = []; let sum = 0;
  for (let f = 0; f < N_FLUTE; f++) { const w = 0.6 + fr() * 0.9; wj.push(w); sum += w; }
  const th0 = [0]; for (let f = 0; f < N_FLUTE; f++) th0.push(th0[f] + wj[f] / sum * Math.PI * 2);
  const amp = []; for (let f = 0; f < N_FLUTE; f++) amp.push(0.7 + fr() * 0.6); amp.push(amp[0]);
  const P = {};
  // (from 25 m down every flute also wanders half a metre either way as it goes: sculpted ribs, never ruled rays)
  const thetaAt = (theta0, ct, stt, Dq) => theta0 + S.spiral * (Math.PI / 2) * Dq / 300 + (0.04 * nz.n2(ct * 1.6, Dq * 0.02 + stt * 1.6) + nz.n2(ct * 2.3 + 9, Dq * 0.075 + stt * 2.3) * (0.035 * smoothstep(25, 50, Dq) + 0.015 * smoothstep(70, 100, Dq)) + 0.026 * nz.n2(ct * 3.1 + 17, Dq * 0.21 + stt * 3.1) * smoothstep(25, 50, Dq)) * smoothstep(2.5, 11, Dq);
  const colTheta = (i) => { const f = Math.min(Math.floor(i / SEG_PER_FLUTE), N_FLUTE - 1), k = i === nu ? 1 : (i % SEG_PER_FLUTE) / SEG_PER_FLUTE; return lerp(th0[f], th0[f + 1], k); };
  // THE ROWS FOLLOW THE LIP. Round the conduit's depth the rows of the mesh are not level: down each column they are
  // shifted by the height the lip stands at where that column crosses it (its scallops, slant and arch: lipLift), so
  // the brink of the throat and the footwall's last edge run ALONG a row and are drawn as the curve they are; level
  // rows cut that slanting edge into a flight of stairs.
  const rowLift = new Float32Array(nu + 1);
  for (let i = 0; i <= nu; i++) {
    const theta0 = colTheta(i), ct = Math.cos(theta0), stt = Math.sin(theta0);
    let L = 0;
    for (let it = 0; it < 3; it++) {
      const Dq = shape.cd - L + 2;
      shape.point(thetaAt(theta0, ct, stt, Dq), Math.max(Dq, shape.cd - 27), 0, 0, P);
      L = clamp(lipWob(P.x0) + (archRise(P.arc) + lipScal(P.arc)) * (1 - smoothstep(20, 32, P.arc)), -6, 18);
    }
    rowLift[i] = L;
  }
  for (let j = 0; j <= nv; j++) {
    const r = rings[j], Dr = Math.max(r[2], 0);
    const rowK = smoothstep(shape.cd - 50, shape.cd - 12, Dr) * (1 - smoothstep(shape.cd + 10, shape.cd + 48, Dr));
    for (let i = 0; i <= nu; i++) {
      const f = Math.min(Math.floor(i / SEG_PER_FLUTE), N_FLUTE - 1), k = i === nu ? 1 : (i % SEG_PER_FLUTE) / SEG_PER_FLUTE;
      const theta0 = colTheta(i);
      const ct = Math.cos(theta0), stt = Math.sin(theta0);
      const Dj = Dr - rowK * rowLift[i], y = rowK > 0 ? -Dj : r[0];
      const fluteOn = smoothstep(2.5, 11, Dj);
      const theta = thetaAt(theta0, ct, stt, Dj);
      const a = lerp(amp[f], amp[f + 1], k);
      const groove = Math.sin(Math.PI * k);                    // 0 at the arete, 1 in the cup
      let shelf = 0, shelfTop = 0;
      // (through the cobalt reach the flutes are half as deep again: lit ribs with dark troughs)
      let fl = (0.62 * Math.pow(groove, 0.8) - 0.3) * a * fluteOn * (1 + 0.55 * smoothstep(84, 112, Dj) * (1 - smoothstep(205, 245, Dj)));
      fl += 0.22 * nz.n2(ct * 3 + 5, Dj * 0.11 + stt * 3) * fluteOn + 0.5 * nz.n2(ct * 0.9, Dj * 0.02 + stt * 0.9 + 20) * smoothstep(0, 8, Dj);
      shape.point(theta, Dj, r[1], 0, P);                      // first pass: is this the footwall under the sheet?
      fl *= (1 - 0.6 * P.w * (1 - smoothstep(88, 112, Dj))) * (1 - 0.4 * smoothstep(0.05, 0.4, P.cd));      // (below 100 m the footwall is fluted too: the water runs in its troughs; inside the throat the flutes keep three fifths of their depth)
      const inThroat = smoothstep(0.03, 0.3, P.cd);
      // LEDGES: broken terraces every 13 to 20 m. Each is a shelf that steps toward the axis (its top faces the sky and
      // catches the light from the mouth) and tapers back into the wall below it. None under the sliding sheet.
      {
        const lph = 8 * nz.n2(ct * 1.1 + 31, stt * 1.1) + 4 * nz.n2(ct * 2.9, stt * 2.9 + 13);
        const lt = (Dj + lph) / 16.5, lc = Math.floor(lt), lf = lt - lc;
        const lon = smoothstep(-0.25, 0.2, nz.n2(ct * 1.7 + lc * 7.3, stt * 1.7 - lc * 3.1)) * smoothstep(24, 42, Dj);
        // (and none on the wall for 16 m above the conduit's mouth, nor across its edge: a terrace there cut the mouth's
        // outline in straight lines; the scalloped lip itself is the edge)
        const under = Math.max(smoothstep(0, 0.6, P.w) * (1 - smoothstep(shape.cd + CD_STEP, shape.cd + CD_STEP + 14, Dj)), (1 - smoothstep(15, 23, Math.abs(P.arc))) * (1 - smoothstep(9, 16, P.mouthUp)) * smoothstep(-9, -3, P.mouthUp));
        shelf = smoothstep(0, 0.09, lf) * Math.pow(1 - lf, 1.6) * lon * (0.75 + 0.5 * Math.abs(nz.n2(lc * 3.7, 5.5))) * (1 - under) * (1 - 0.5 * inThroat);
        fl -= 1.5 * shelf;
        shelfTop = smoothstep(-0.02, 0.05, lf) * (1 - smoothstep(0.08, 0.2, lf)) * lon * (1 - under) * (1 - 0.5 * inThroat);
      }
      shape.point(theta, Dj, r[1], fl, P);
      const q = j * (nu + 1) + i;
      pos[q * 3] = P.x; pos[q * 3 + 1] = y; pos[q * 3 + 2] = P.z;
      surf[q * 2] = (i / nu) * 88; surf[q * 2 + 1] = -Dj;
      ice[q * 3] = 1 - groove; ice[q * 3 + 1] = shelfTop; ice[q * 3 + 2] = j < 5 ? 0 : Dj;
      cdA[q * 2] = P.x0; cdA[q * 2 + 1] = P.arc;
    }
    if (j % 3 === 2) yield;
  }
  S.fluteTh0 = th0;                                         // (buildThreads lays its falls on the same ledges)
  const g = yield* finishGridSteps(pos, surf, ice, nu, nv, (x, y, z) => [0, y, axisZ(-y)]);
  g.setAttribute('aCd', new THREE.BufferAttribute(cdA, 2));
  return g;
}

// Ring of ice-sheet surface around the mouth and the canyon (polar grid; the holes are cut in the shader).
function buildApron(S, radius, nz) {
  const nu = 96, nv = 36, cnt = (nu + 1) * (nv + 1);
  const pos = new Float32Array(cnt * 3), surf = new Float32Array(cnt * 2), ice = new Float32Array(cnt * 3);
  for (let j = 0; j <= nv; j++) {
    const t = j / nv, r = 3 + (radius - 3) * Math.pow(t, 1.9);
    for (let i = 0; i <= nu; i++) {
      const a = (i / nu) * Math.PI * 2, x = Math.sin(a) * r, z = S.mouthCz + 20 + Math.cos(a) * r;
      const q = j * (nu + 1) + i;
      const roll = 0.35 * nz.fbm2(x * 0.02, z * 0.02, 3) * smoothstep(14, 60, r) + 1.6 * nz.fbm2(x * 0.004 + 9, z * 0.004, 2) * smoothstep(60, 240, r);
      pos[q * 3] = x; pos[q * 3 + 1] = rimLevel(z) + roll - 0.06 - 3 * smoothstep(radius * 0.8, radius, r); pos[q * 3 + 2] = z;
      surf[q * 2] = x; surf[q * 2 + 1] = z; ice[q * 3] = 0; ice[q * 3 + 1] = 99; ice[q * 3 + 2] = 0;
    }
  }
  return runSteps(finishGridSteps(pos, surf, ice, nu, nv, (x, y, z) => [x, y + 10, z]));
}

// ---------------------------------------------------------------- the water: river, brink and sheet in one mesh
const ARC_LEN = RB * PHI_END, G_FALL = 4.2, V_RIVER = 16;
function* waterSteps(shape, reach) {
  const nu = 44, rows = [];                                    // fine enough across for the lobes of the torn lip
  for (let s = 0; s < reach - 6; s += 0.8) rows.push(s);
  for (let s = reach - 6; s < reach + ARC_LEN + 4; s += 0.4) rows.push(s);
  const CD = shape.cd, sheetLen = (CD + 7 - ARC_D) / COSL;
  for (let b = 4.6; b <= sheetLen; b += lerp(0.8, 1.7, smoothstep(4, 40, b))) rows.push(reach + ARC_LEN + b);
  const nv = rows.length - 1, cnt = (nu + 1) * (nv + 1);
  const pos = new Float32Array(cnt * 3), uv = new Float32Array(cnt * 4);
  for (let j = 0; j <= nv; j++) {
    const s = rows[j];
    let cy, cz, half, zone, tau, nrmY = 1, nrmZ = 0, D = 0;
    if (s < reach) { cz = reach - s; cy = waterLevel(cz); half = 8.4; zone = 0; tau = s / V_RIVER; }
    else if (s < reach + ARC_LEN) {
      const ph = (s - reach) / RB; cz = -RB * Math.sin(ph); cy = -LIP_D - RB * (1 - Math.cos(ph)); zone = (s - reach) / ARC_LEN;
      half = lerp(8.4, 9.0, zone); nrmY = Math.cos(ph); nrmZ = -Math.sin(ph);
      const v = Math.sqrt(V_RIVER * V_RIVER + 2 * G_FALL * (s - reach)); tau = reach / V_RIVER + (v - V_RIVER) / G_FALL;
    } else {
      const b = s - reach - ARC_LEN; cy = -ARC_D - b * COSL; cz = ARC_Z - b * SINL; zone = 1 + b / sheetLen;
      half = lerp(9.0, 11.5, smoothstep(0, 45, b)); nrmY = SINL; nrmZ = -COSL;
      const v = Math.sqrt(V_RIVER * V_RIVER + 2 * G_FALL * (s - reach)); tau = reach / V_RIVER + (v - V_RIVER) / G_FALL;
    }
    D = -cy;
    // THE PEEL: from 42 m above the conduit the whole sheet gathers to the left, onto its lip (x -11.3 to -6.6).
    // It ends there, torn away by the shader (WATER_FRAG "gone"); what goes over the lip is 'conduit-fall' (buildConduitFall).
    const peel = smoothstep(CD - 42, CD - 11, D), rxM = shape.Rx(Math.min(D, CD)) - 1.6;
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1; let x = u * half, y = cy, z = cz;
      // (below 100 m the sheet lies low in the footwall's flutes: their aretes stand through it and part it into threads)
      const lift = zone > 0 ? lerp(0.12, 0.5, smoothstep(0, 1, zone)) * (zone > 1 ? lerp(1, 0.22, smoothstep(88, 112, D)) : 1) : 0;
      if (zone > 1) {
        x = clamp(lerp(x, -8.95 + u * 2.35, peel), -rxM, rxM);
        const wob = D > CD - 38 ? lipWob(x) : 0, Dw = Math.min(D, CD - 1.5 - wob);
        z = shape.nearZ(x, Dw) - (D - Dw) * LEAN + nrmZ * lift; y += nrmY * lift;
      } else { y += nrmY * lift; z += nrmZ * lift; }
      const q = j * (nu + 1) + i;
      pos[q * 3] = x; pos[q * 3 + 1] = y; pos[q * 3 + 2] = z;
      uv[q * 4] = u; uv[q * 4 + 1] = s; uv[q * 4 + 2] = zone; uv[q * 4 + 3] = tau;
    }
    if (j % 30 === 29) yield;
  }
  const nrm = yield* gridNormalSteps(pos, nu, nv), flip = nrm[5 * 3 + 1] < 0;
  if (flip) for (let i = 0; i < nrm.length; i++) nrm[i] = -nrm[i];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('aFlow', new THREE.BufferAttribute(uv, 4));
  g.setIndex(new THREE.BufferAttribute(gridIndex(nu, nv, flip), 1));
  return g;
}
// Height of the water surface on the centreline (x = 0) at local z, from 40 m upstream of the brink, over the hump
// and the brink curve and 40 m down the sheet: what the world needs to keep a hull afloat as the river bends over.
function makeSurfaceY(hump) {
  const zs = [], ys = [], H = (z) => hump * Math.exp(-(((1.2 - z) / 1.6) ** 2));
  for (let z = 40; z > 0; z -= 0.2) { zs.push(z); ys.push(waterLevel(z) + H(z)); }
  for (let a = 0; a <= ARC_LEN; a += 0.2) {
    const ph = a / RB, lift = lerp(0.12, 0.5, smoothstep(0, 1, a / ARC_LEN));
    zs.push(-(RB + lift) * Math.sin(ph)); ys.push(-LIP_D - RB * (1 - Math.cos(ph)) + lift * Math.cos(ph) + H(-a) * Math.cos(ph));
  }
  for (let b = 0.5; b < 40; b += 0.5) { zs.push(ARC_Z - b * SINL - COSL * 0.5); ys.push(-ARC_D - b * COSL + SINL * 0.5); }
  return (z) => {
    if (z >= zs[0]) return waterLevel(z);
    for (let i = 1; i < zs.length; i++) if (zs[i] <= z) return lerp(ys[i - 1], ys[i], (z - zs[i - 1]) / Math.min(zs[i] - zs[i - 1], -1e-6));
    return ys[ys.length - 1];
  };
}
// What a world needs of the hero to lay its route before the hero is built (the conduit's depth is read off that route):
// the water surface on the centreline, the radius of the brink curve, the shaft's axis and the portal seat. The same values as hero.kit.surfaceY and
// hero.anchors.axisTop / axisDir / portalSeat.position.
export const moulinRoute = { surfaceY: makeSurfaceY(HUMP), brinkRadius: RB, axisTop: [0, 0, AXIS_Z0], axisDir: [0, -COSL, -SINL], portalSeat: [0, -PORTAL_D, axisZ(PORTAL_D)] };
const WATER_VERT = /* glsl */`
attribute vec4 aFlow;
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec4 vFlow; varying float vWave; varying float vSlope; varying vec3 vSunW; varying vec3 vPL; varying float vLobe; varying float vLobeS;
uniform float uTime, uReach, uHump; uniform vec3 uSun; uniform vec3 uPortalPos;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position; float s = aFlow.y, u = aFlow.x;
  float glassy = 1.0 - smoothstep(uReach - 15.0, uReach - 3.0, s);     // the last metres before the brink run smooth
  float river = 1.0 - smoothstep(0.0, 0.5, aFlow.z);
  // trains of standing waves (they stand; the water runs through them), plus a little live chop
  float env = smoothstep(0.15, 0.8, 0.5 + 0.5*sin(s*0.071 + 1.3))*(0.7 + 0.3*sin(s*0.023 + 4.0));
  float lane = exp(-(u - 0.25*sin(s*0.05))*(u - 0.25*sin(s*0.05))*2.2);
  float st = sin(s*1.15 + 0.6*sin(u*2.4))*env*lane;
  float chop = sin(s*2.7 + u*5.0 - uTime*5.5)*0.035 + sin(s*1.3 - u*7.0 + uTime*3.7)*0.03;
  float edge = smoothstep(0.55, 0.95, abs(u));
  float h = (st*0.26*glassy + chop*(0.35 + 0.65*glassy) + 0.06*sin(uTime*1.3 + s*0.4)*edge)*river;
  // the water humps up a hand before it bends over: from upstream the river ends in a bright curved line
  float hb = (s - uReach + 1.2)/1.6;
  h += uHump*exp(-hb*hb)*(1.0 - 0.5*u*u);
  // the brink: a smooth hump that sags and breathes slightly
  h += 0.06*sin(uTime*0.8 + u*2.0)*smoothstep(0.0, 0.5, aFlow.z)*(1.0 - smoothstep(0.6, 1.2, aFlow.z));
  // the sheet: thin ripples crawling down
  h += 0.07*sin(aFlow.w*26.0 - uTime*26.0 + u*9.0)*smoothstep(1.0, 1.15, aFlow.z);
  // THE TORN LIP: past the brink line the water leaves in lobes and thick ropes, so the edge of the sheet against the
  // shaft is ragged from wherever it is seen, never a ruled line (vLobeS: the lobes' slope across the flow, for the fragment shader)
  // (ropes stand up from the film, never down into the ice under it: the lobes only add height)
  float tornK = smoothstep(0.1, 0.42, aFlow.z)*(1.0 - smoothstep(1.06, 1.2, aFlow.z));
  float uw = u*9.0, a1 = uw*1.25 + 0.7 + 0.5*sin(uTime*0.9), a2 = uw*2.9 + 2.1 - uTime*1.7, a3 = uw*4.3 + uTime*2.3 + s*0.8;
  vLobe = 0.34*sin(a1) + 0.4*sin(a2) + 0.26*sin(a3);
  float amp = tornK*(0.5 + 0.4*smoothstep(0.3, 0.9, aFlow.z));
  h += amp*(0.5 + 0.5*vLobe);
  vLobeS = amp*0.5*(0.34*1.25*cos(a1) + 0.4*2.9*cos(a2) + 0.26*4.3*cos(a3));      // its slope across the flow
  p += normal*h;
  vWave = st*river*glassy; vFlow = aFlow; vP = p;
  vSlope = cos(s*1.15 + 0.6*sin(u*2.4))*env*lane*river*glassy;
  vec4 wp = modelMatrix*vec4(p, 1.0); vW = wp.xyz;
  vN = normalize(mat3(modelMatrix)*normal); vSunW = normalize(mat3(modelMatrix)*uSun);
  vPL = mat3(modelMatrix)*(uPortalPos - p);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vW; varying vec3 vN; varying vec4 vFlow; varying float vWave; varying float vSlope; varying vec3 vSunW; varying vec3 vPL; varying float vLobe; varying float vLobeS;
uniform float uTime, uPortalI, uReach;
uniform vec3 uSun, uSunCol, uSkyCol, uSnow, uTurq, uCobalt, uElectric, uPortalCol, uFoamTint; uniform vec4 uMouth;
uniform vec4 uPools[3]; uniform vec2 uPoolDir[3];      // foam aprons: (x, z, radius m, strength), and the flow direction there
#include <common>
${NOISE_GLSL}
${FOG_PARS}
void main(){
  float u = vFlow.x, s = vFlow.y, zone = vFlow.z;
  float run = (vFlow.w - uTime)*${V_RIVER}.0;                 // metres in the water's own frame
  float river = 1.0 - smoothstep(0.0, 0.6, zone), sheet = smoothstep(1.0, 1.2, zone), brink = 1.0 - river - sheet;
  float W = mix(8.4, 11.0, sheet);
  float past = smoothstep(uReach - 2.5, uReach + 2.5, s);              // 0 in the river, 1 from the first metre over the brink
  float D = max(-vP.y, 0.0);
  vec3 cobD = uCobalt*(1.0 + 1.5*smoothstep(70.0, 165.0, D));
  float dist = length(cameraPosition - vW);
  vec3 V = normalize(cameraPosition - vW);
  // ---- fraying edges and tears of the sheet (alpha test, widened by fwidth so it does not sparkle)
  float fb = max(zone - 1.0, 0.0);
  float torn = smoothstep(0.2, 0.9, zone);                      // 0 on the brink line, 1 where the curve has become the sheet
  // (deepK: the cobalt reach, where the sheet has frayed into separate threads; lipK: the conduit's lip, where what is
  // left gathers, turns white and goes over; gone: past the lip it is torn away within a few metres)
  float De = D - uCd.x + ${LIP_WOB('vP.x')}*step(uCd.x - 38.0, D);          // metres below the lip, as the scalloped lip sees it                       // (the lip is scalloped: depth as the lip sees it)
  float deepK = smoothstep(92.0, 128.0, D)*(1.0 - 0.25*smoothstep(-22.0, -3.0, De));      // (it stays threads to the lip: never a slab)
  float lipK = smoothstep(-12.0, -3.0, De), gone = smoothstep(-7.0, 0.5, De);
  float fray = smoothstep(0.0, 0.25, fb)*0.42 + deepK*0.3 + torn*0.1 + gone*0.5;
  float tear = smNoise(vec2(u*W*0.55, run*0.035)) *0.6 + smNoise(vec2(u*W*1.7 + 4.0, run*0.06))*0.4;
  if (abs(u) > 1.0 - fray*(0.25 + tear)) discard;
  if (sheet > 0.5 && tear < smoothstep(0.35, 1.0, fb)*0.3*(1.0 - lipK)) discard;
  // THE END OF THE SHEET: over the last seven metres above the conduit's lip it is torn away in clots a metre or two
  // across (two octaves of noise in metres across and metres of fall, so no mesh row and no straight slit ever shows);
  // nothing of it is left past the lip, where 'conduit-fall' takes the water over
  float tearE = smNoise(vec2(vP.x*0.8 + 3.0, run*0.085))*0.62 + smNoise(vec2(vP.x*2.3 + 11.0, run*0.21))*0.38;
  if (tearE < gone*1.3 - 0.12) discard;
  // THE FIBRES of the falling water: strands a hand to a forearm wide, drawn out along the fall, on a faint metre-wide
  // swell (each fine layer fades before it can alias). fibN is high in a white fibre and low in a gap. The broad layer
  // is kept weak: with more of it whole lobes of the lip turn to one white sheet.
  // TORN, NOT RULED (the sheet below the brink curve): every strand wanders a metre across the fall as it drops and is
  // cut into lengths of three to eight metres with ragged ends, so from above the falling water is short torn threads
  // and clots, never a fan of straight lines converging on the ring.
  float tornS = smoothstep(1.02, 1.3, zone);
  // (from 40 m above the conduit the sheet is gathered sideways toward it: its strands are laid in metres across the wall
  // there, not in the sheet's own squeezed width, or they would close up into a fan of ruled bands)
  float uwm = mix(u*W, vP.x*0.957, smoothstep(uCd.x - 48.0, uCd.x - 40.0, D)), fwU = fwidth(uwm), fwR = fwidth(run);
  float ux = uwm + tornS*((smNoise(vec2(uwm*0.3, run*0.07)) - 0.5)*2.2 + (smNoise(vec2(uwm*0.9 + 5.0, run*0.19)) - 0.5)*0.7);
  // (the pattern is laid in the water's own time, and the water is three times as fast at the bottom as at the brink:
  // without the last factor a strand 4 m long at the top was 12 m long, a ruled line, in the cobalt reach)
  float lenK = (1.0 + 1.6*tornS)*mix(1.0, sqrt(1.0 + 0.0328*max(s - uReach, 0.0)), tornS);
  float fA = smNoise(vec2(ux*0.62, run*0.028*lenK));
  float fB = smNoise(vec2(ux*2.8 + 1.2*fA, run*0.075*lenK));
  float fC = mix(0.5, smNoise(vec2(ux*7.0, run*0.24*lenK + 3.0*fB)), 1.0 - smoothstep(0.45, 1.1, fwU*7.0));
  float fD = mix(0.5, smNoise(vec2(ux*16.0, run*0.55*lenK)), 1.0 - smoothstep(0.45, 1.1, fwU*16.0));
  float fibN = 0.5 + (fA*0.14 + fB*0.36 + fC*0.3 + fD*0.2 - 0.5)*1.8;      // (spread out: four noises summed crowd round 0.5)
  // clots: the strands are cut across, raggedly, into lengths (fading before the cut can alias)
  // (while it is the pale wall of water, to 90 m down, the cuts are twice as far apart: strands three to eight metres
  // long with soft turquoise between them, drawn out down the fall, never a stipple of flecks)
  float aquaK = sheet*(1.0 - smoothstep(60.0, 100.0, D));
  float cK = lenK/2.6*mix(1.0, 0.45, aquaK);
  float clot = mix(0.5, smNoise(vec2(ux*0.8 + 9.0, run*0.21*cK)), 1.0 - smoothstep(0.5, 1.6, fwR*0.21*cK))*0.65 + mix(0.5, smNoise(vec2(ux*2.1, run*0.5*cK + 4.0)), 1.0 - smoothstep(0.5, 1.6, fwR*0.5*cK))*0.35;
  fibN -= tornS*(1.0 - smoothstep(0.3, 0.56, clot))*mix(0.22, 0.5, deepK)*mix(1.0, 0.7, aquaK);
  float fibM = max(sheet, past*(0.55 + 0.45*torn));
  // slits torn right through the sheet: the wet blue ice of the footwall shows in them
  // (only past the brink: in the river the threshold is 0 and the spread fibN dips below 0 near the lens, which would
  // open holes to the void, since nothing lies under the river)
  float slitT = 0.27*smoothstep(0.55, 1.08, zone)*(1.0 - 0.45*smoothstep(0.5, 1.0, fb)*(1.0 - deepK)) + 0.3*deepK + 0.3*gone;
  slitT *= 1.0 - 0.55*aquaK;      // (the wall of water is nearly whole: few slits, and those long)
  if (zone > 0.55 && fibN < slitT) discard;      // (in the cobalt reach half of it is gone: threads in the flutes)
  float slitE = zone > 0.55 ? 1.0 - smoothstep(slitT, slitT + 0.07, fibN) : 0.0;      // the thin wet edge of a slit: it deepens to the ice's own blue before the water ends
  fibN = clamp(fibN, 0.0, 1.0);
  // ---- colour: electric over the white bed, turquoise in the shallows, cobalt in the deep thread
  float thread = exp(-(u - 0.25*sin(s*0.05))*(u - 0.25*sin(s*0.05))*3.2);
  vec3 base = mix(uElectric, uTurq*0.82, smoothstep(0.45, 1.0, abs(u)));
  base = mix(base, mix(cobD, uElectric, 0.22), thread*0.85*(1.0 - 0.5*brink));
  // once it has gone over, the water has no shallows: the whole width deepens toward cobalt, so its white fibres stand out
  base = mix(base, mix(cobD, uElectric, 0.42), smoothstep(uReach + 1.0, uReach + 6.0, s)*(1.0 - sheet)*0.62);
  // bed glow mottling drifting slower than the surface
  base *= 0.8 + 0.3*smNoise(vec2(u*W*0.35, s*0.12 + run*0.02));
  base *= 0.82 + 0.34*smNoise(vec2(u*W*2.3, run*0.085));
  base *= 1.0 + 0.3*vWave;
  // over the brink the glass is drawn out into long streaks, so the water under the nose is never a blank slab
  base *= mix(1.0, 0.5 + 1.0*smNoise(vec2(u*W*1.3, run*0.02)), past*(1.0 - sheet));
  float cw = smNoise(vec2(u*W*1.5, run*0.27) + 0.6*smNoise(vec2(u*W*0.7, run*0.11 + 3.0)));
  float caust = 1.0 - abs(cw - 0.5)*2.0; caust *= caust*caust;
  base *= 0.78 + 0.6*caust*(1.0 - sheet);
  base = mix(base, base*0.5 + cobD*0.25, sheet*0.8);
  // the gaps between the fibres are thin dark water: cobalt, not pale blue
  float gap = (1.0 - smoothstep(mix(0.34, 0.26, aquaK), mix(0.52, 0.6, aquaK), fibN))*fibM;      // (soft-edged gaps in the wall of water)
  // (in the aqua reach the wall of water is pale: its gaps are turquoise shadow, not navy stripes)
  base = mix(base, mix(base*0.3 + mix(cobD, uElectric, 0.25)*0.3, base*0.55 + uTurq*0.3 + uElectric*0.12, sheet*(1.0 - smoothstep(60.0, 105.0, D))), gap*0.85);
  // ---- surface normal from flowing ripples
  vec2 rc = vec2(u*W*0.9, run*0.33);
  float r0 = smFbm(rc), r1 = smFbm(rc + vec2(0.12, 0.0)), r2 = smFbm(rc + vec2(0.0, 0.12));
  vec3 N = normalize(vN);
  vec3 Tx = vec3(1.0, 0.0, 0.0), Tz = normalize(cross(Tx, N));
  float rough = mix(1.0, 0.25, brink) + sheet*0.6;
  vec3 Np = normalize(N + (Tx*(r0 - r1) + Tz*(r0 - r2))*3.4*rough + Tz*vSlope*0.3 - Tx*vLobeS*0.8);
  base *= 1.0 - 0.3*clamp(vLobeS*sign(uSun.x + 1e-4), -1.0, 1.0);      // each rope of the lip has a lit flank and a shaded one
  base *= 1.0 + 2.2*(r0 - r1)*rough + 1.6*(r0 - r2)*rough;
  // ---- foam: braided lines along the flow, wall eddies, wave crests, fibres on the sheet
  float b1 = smNoise(vec2(u*W*0.55 + 1.3*sin(run*0.04 + u*2.0), run*0.05));
  float b2 = smNoise(vec2(u*W*0.7 - 1.1*sin(run*0.033 + 2.0), run*0.06 + 9.0));
  float fine = smNoise(vec2(u*W*3.1, run*0.42));
  float w1 = max(0.03, fwidth(b1)*1.3), w2 = max(0.03, fwidth(b2)*1.3);
  float foam = (1.0 - smoothstep(w1*0.4, w1, abs(b1 - 0.5)))*(0.03/w1) + (1.0 - smoothstep(w2*0.4, w2, abs(b2 - 0.42)))*(0.03/w2)*0.8;
  float lace = smoothstep(0.32, 0.62, smNoise(vec2(u*W*5.5, run*1.4)));
  foam *= (0.25 + 0.75*lace)*0.8;
  foam += smoothstep(0.82, 0.92, smNoise(vec2(u*W*4.0, run*0.9)))*lace*0.45;
  foam += smoothstep(0.84, 0.97, abs(u) + 0.09*smNoise(vec2(s*0.6, uTime*0.7)))*(0.35 + 0.65*fine)*0.8;
  foam += smoothstep(0.45, 0.95, vWave)*smoothstep(0.3, 0.7, fine)*0.85;
  // FOAM APRONS where a tributary fall lands: churned white at the foot, drawn out downstream and torn into flecks with
  // blue water between them. It is part of the river's own surface, so it rides the waves (a flat foam sheet laid over
  // the water was cut by every crest into a comb) and thins toward the lens so the water shows through.
  float ap = 0.0;
  for (int i = 0; i < 3; i++) {
    vec2 dq = vW.xz - uPools[i].xy; float al = dot(dq, uPoolDir[i]), ac = dq.x*uPoolDir[i].y - dq.y*uPoolDir[i].x;
    float rr = length(vec2(ac, al/(al > 0.0 ? 2.8 : 1.0)))/max(uPools[i].z, 0.01);
    ap = max(ap, (1.0 - smoothstep(0.15, 1.0, rr))*uPools[i].w);
  }
  float churn = smNoise(vec2(u*W*1.9, run*0.55))*0.55 + fine*0.3 + lace*0.25;
  foam += smoothstep(0.9 - 0.78*ap, 1.1 - 0.68*ap, churn)*smoothstep(0.0, 0.12, ap)*mix(0.5, 1.0, smoothstep(3.0, 9.0, dist))*0.95;
  foam *= river + brink*0.25;
  float fibres = smoothstep(0.58 - 0.1*sheet*(1.0 - smoothstep(60.0, 105.0, D)), 0.72 + 0.1*aquaK, fibN + 0.05*smoothstep(0.0, 0.5, fb))*fibM;      // (whiter while it is the wall of water)
  // the brink itself: a crisp bright arc where the water bends over, flecked with foam
  float bq = (s - uReach + 0.7)/1.0; float brinkLine = exp(-bq*bq)*mix(0.25, 1.0, smoothstep(4.0, 16.0, dist));
  foam += brinkLine*smoothstep(0.5, 0.78, fine)*0.5;
  foam = clamp(foam + fibres*(0.78 + 0.22*smoothstep(0.0, 0.4, fb)), 0.0, 1.0);
  // ---- light: sun only where the mouth lets it in; daylight dies with depth
  float ts = D/max(uSun.y, 0.05);
  vec2 e = vec2(vP.x + uSun.x*ts, vP.z + uSun.z*ts - uMouth.x)/uMouth.zw;
  float lit = (1.0 - smoothstep(0.72, 1.02, dot(e, e)))*smoothstep(-6.0, 1.0, -vP.z + 1.0);
  float day = exp(-max(D - 12.0, 0.0)/58.0);
  vec3 deepTint = mix(vec3(1.0), mix(uTurq*1.5, cobD*2.2, smoothstep(45.0, 125.0, D)), smoothstep(14.0, 50.0, D));
  float ambI = (0.3 + 0.9*day)*(1.0 - 0.55*smoothstep(120.0, 240.0, D));
  // white water stays white as it falls: the fibres take only part of the depth's blue
  deepTint = mix(deepTint, mix(deepTint, vec3(0.62, 0.9, 1.2), 0.62), foam*sheet);
  vec3 col = base*(0.78 + 0.5*lit)*mix(1.0, 1.12, brink);
  col = mix(col, (uSnow*0.85*(0.62 + 0.5*lit) + uSkyCol*0.1)*uFoamTint, foam*0.9);
  col *= 1.0 + 0.5*sheet*smoothstep(20.0, 60.0, D);
  col *= deepTint*mix(1.0, ambI, smoothstep(12.0, 30.0, D));
  float fres = pow(clamp(1.0 - dot(Np, V), 0.0, 1.0), 3.0);
  vec3 R = reflect(-V, Np);
  float sk = smoothstep(0.1, 0.65, R.y - 0.35*abs(R.x)*river);
  vec3 refl = mix(cobD*0.45 + uTurq*0.12, uSkyCol*1.5 + uSnow*0.3, sk);
  col = mix(col, refl*day, fres*0.62*(1.0 - foam*0.7)*(1.0 - 0.8*past));      // falling water is torn, not a mirror
  col += (uTurq*0.16 + uSnow*0.05)*brink*(0.6 + 0.4*lit);
  col += (uSkyCol*1.2 + uSnow*0.5*(0.6 + 0.6*lit))*uFoamTint*brinkLine*1.6;
  vec3 Hh = normalize(V + vSunW);
  col += uSunCol*pow(max(dot(Np, Hh), 0.0), 120.0)*lit*3.0 + uSunCol*pow(max(dot(Np, Hh), 0.0), 14.0)*lit*0.25*(brink + 0.3);
  // sparkle on the chop
  float gs = smHash(floor(vec2(u*W*5.0, run*2.0)));
  col += uSunCol*step(0.975, gs)*lit*(0.5 + 0.5*sin(uTime*9.0 + gs*90.0))*1.6*(1.0 - smoothstep(20.0, 70.0, dist));
  float pd2 = dot(vPL, vPL);
  col += uPortalCol*(0.25 + 0.6*foam)*uPortalI/(1.0 + pd2/420.0);
  // THE CONDUIT'S LIP: the one bright thing in the deep reach besides the ring: churned white water going over an edge,
  // pale cyan-white, torn (it is laid on after the depth's blue so it stays white)
  // (only its strands: between them the water is thin and dark; the last three metres before the edge are solid churn)
  // (wet cyan-white with form, never paper white: held under 0.6 whatever the mood's foam tint; the crest itself, the
  // clots and the strands that go over, are 'conduit-fall')
  vec3 lipCol = (uSnow*0.42 + uTurq*0.34 + uPortalCol*0.1)*min(uFoamTint, vec3(1.0))*(0.5 + 0.5*fibN);
  col = mix(col, lipCol*0.6, deepK*smoothstep(0.6, 0.8, fibN)*0.55);      // (and in the cobalt reach its threads stay pale: falling water, not dark lines)
  col = mix(col, lipCol, lipK*smoothstep(0.5, 0.8, fibN)*0.7);
  col = mix(col, (uTurq*0.4 + cobD*0.2 + 0.03)*deepTint*mix(1.0, ambI, smoothstep(12.0, 30.0, D)), slitE*aquaK*0.8);
  gl_FragColor = vec4(smFog(col, vP.y, dist), 1.0);
}`;

// ---------------------------------------------------------------- the water going over the conduit's lip
// 'conduit-fall': where the water leaves. A ribbon of its own laid along the lip the footwall ends in (the lip runs aslant,
// highest on the left), from 5 m upstream of the lip on the ice, over it, and 24 m on down into the throat, pulled into
// the scoop as it drops. It is patterned in its own metres (aC = metres along the lip, metres along the flow with 0 at
// the lip, 0..1 across, -), never in the sheet's squeezed width:
//   upstream   knots of foam one to two metres across with dark water between (the sheet's torn end lies under them)
//   the crest  a boiling pale cyan-white welt standing half a metre to a metre off the lip (CREST_VERT): knots of froth
//              standing closest here, dark water still showing between them
//   the fall   separate ROPES of water (CREST_FRAG smRopes: two families, a forearm and a hand wide), each a bundle of
//              fibres a finger to a hand wide with dark slits between them, wandering off its line, swelling into a knot
//              every half metre, tapering to a point where it is cut, with dark between two ropes; they are flung to the
//              left into the throat from the lip on, and none reaches the ring's reach
// It is water at arm's length as much as from far above: every edge is as sharp as a pixel allows (the antialiasing
// width follows the pixel's footprint, with no floor a hand wide), fibres a finger wide come in as soon as a pixel can
// hold them, and it has no faded border anywhere: toward its sides and both its ends the ropes thin and end one by one.
const CREST_VERT = /* glsl */`
attribute vec4 aC; attribute vec3 aN;
varying vec4 vC; varying vec3 vP; varying vec3 vW; varying vec3 vPL; varying float vHump;
uniform float uTime; uniform vec3 uPortalPos;
#include <common>
#include <fog_pars_vertex>
void main(){
  float xm = aC.x, bm = aC.y;
  vec3 p = position;
  // the welt on the lip boils: lumps that swell and travel along it
  float boil = 0.5 + 0.5*sin(xm*1.7 + uTime*2.3 + 1.3*sin(xm*0.6 - uTime*1.1));
  float boil2 = 0.5 + 0.5*sin(xm*4.1 - uTime*3.4 + bm*1.3);
  float hump = exp(-(bm - 0.4)*(bm - 0.4)/3.4);
  p += aN*hump*(0.5 + 0.45*boil + 0.2*boil2);
  // the strands sway apart as they drop
  float fl = max(bm - 1.2, 0.0);
  p.x += 0.045*fl*sin(xm*2.1 + bm*0.35 - uTime*1.6);
  p += aN*(0.04*fl*sin(xm*1.3 + 2.0 + uTime*0.9));
  vC = aC; vP = p; vHump = hump*(0.4 + 0.6*boil);
  vec4 wp = modelMatrix*vec4(p, 1.0); vW = wp.xyz;
  vPL = mat3(modelMatrix)*(uPortalPos - p);
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const CREST_FRAG = /* glsl */`
varying vec4 vC; varying vec3 vP; varying vec3 vW; varying vec3 vPL; varying float vHump;
uniform float uTime, uPortalI, uBandSeed; uniform vec3 uSnow, uTurq, uCobalt, uElectric, uPortalCol, uFoamTint;
#include <common>
${NOISE_GLSL}
${FOG_PARS}
// ROPES of falling water: one family of strands, about 1/f metres apart but never evenly (each stands anywhere in its
// own stretch, so two may run side by side and the next gap be twice as wide), a few thick and most thin (half its
// width is wa to wa + wb of that spacing). Each wanders off its own line (slowly by a fifth of its spacing, quickly by
// a fourteenth), swells into a knot every metre or so and thins between two knots, and is cut into lengths that taper
// to a point at both ends; cut = 0 at the lip, where nearly every rope is whole, to 1 far down the fall, where they
// are thinner, fewer and shorter. No rope is drawn thinner than a pixel and a half can hold (fw = the pixel's footprint
// in metres), so a thread is a line and never a row of dots.
// Returns its profile: 1 on a strand's centre line, 0 at its edge and in the dark between two strands.
float smRopes(float sx, float run, float f, float seed, float cut, float fw, float wa, float wb){
  float c = sx*f, id = floor(c), fr = c - id, best = 0.0;
  for (int k = -1; k <= 1; k++) {
    float i = id + float(k), h = smHash(vec2(i, seed)), h2 = smHash(vec2(i + 31.0, seed));
    float cx = float(k) + 0.5 + 0.7*(h2 - 0.5) + 0.4*(smNoise(vec2(run*(0.19 + 0.2*h), i*1.7 + seed)) - 0.5) + 0.14*(smNoise(vec2(run*(0.7 + 0.5*h2), i*2.9 + seed)) - 0.5);
    float len = smNoise(vec2(run*(0.3 + 0.35*h2) + h2*30.0, i*3.1 + seed));
    float kn = smNoise(vec2(run*(0.7 + 0.6*h) + h*17.0, i + seed));
    float w = (wa + wb*h*h)*smoothstep(0.12 + 0.32*cut, 0.3 + 0.32*cut, len)*(0.5 + kn)*(1.0 - 0.45*cut);
    w *= smoothstep(0.012, 0.04, w);
    w = max(w, 0.8*fw*f*min(w*40.0, 1.0));
    best = max(best, 1.0 - abs(fr - cx)/max(w, 1e-3));
  }
  return best;
}
void main(){
  float xm = vC.x, bm = vC.y, ac = vC.z;
  float run = bm - uTime*13.0;                                  // metres in the water's own frame
  // EACH SEED ITS OWN WATER: every noise below is read wS metres further across its field (xw for xm, and wS on the typed
  // offsets of the lookups that run with the water alone), wS from the hero's band seed (0 to 60, already dealt: no new
  // draw): 0 to 222 m, more than a hundred knots' widths. The same water in kind, another stretch of it. What belongs
  // to the place stays on xm and ac: the lip's climb, the mesh's sides, the pixel's footprint.
  float wS = uBandSeed*3.7, xw = xm + wS;
  float dc = length(cameraPosition - vW);
  vec3 cobD = uCobalt*(1.0 + 1.5*smoothstep(70.0, 165.0, max(-vP.y, 0.0)));
  // (each layer of detail is drawn as soon as a pixel can hold it, and not before: by the pixel's footprint in the
  // water's own metres, so at arm's length the finest fibres are there and from far above they have melted away)
  float fwX = fwidth(xm), fwM = max(fwX, fwidth(bm));
  float lodF = 1.0 - smoothstep(0.25, 0.9, fwM*5.5), lod0 = 1.0 - smoothstep(0.3, 0.9, fwX*11.0), lodN = 1.0 - smoothstep(0.3, 0.9, fwX*26.0), lodV = 1.0 - smoothstep(0.3, 0.9, fwX*60.0);
  float up = 1.0 - smoothstep(-2.4, -0.3, bm);                  // 1 upstream of the crest
  float fallK = smoothstep(1.4, 5.0, bm);                       // 1 well down the fall
  // CLOTS: knots of foam one to two metres across, smaller ones on them, froth a thumb across on those
  float n1 = smNoise(vec2(xw*0.75 + 0.3*sin(run*0.2), run*0.34));
  float n2 = smNoise(vec2(xw*1.9 + 5.0, run*0.8 + 2.0*n1));
  float n3 = mix(0.5, smNoise(vec2(xw*5.5 + 1.0, run*2.1)), lodF);
  float n4 = mix(0.5, smNoise(vec2(xw*14.0 + 3.0, run*5.0)), lodN);
  float clot = n1*0.34 + n2*0.22 + n3*0.24 + n4*0.2;
  // ROPES of the fall: they wander across the drop (a metre and a half slowly, a quarter of a metre quickly), so no two
  // run parallel for long, and they stand unevenly: thick ones a forearm wide well apart, thin ones only in bunches
  // (clump), drops flung clear between them (bead). Each rope is a BUNDLE OF FIBRES: streaks a hand, two fingers and a
  // finger wide run down it (each kind drawn as soon as a pixel can hold it), and where they are thin the dark shows
  // through, so a rope is split into fibres along its length and frayed at both edges.
  float sx = xw + ((smNoise(vec2(xw*0.4 + 2.0, run*0.1)) - 0.5)*1.6 + (smNoise(vec2(xw*1.3 + 9.0, run*0.45)) - 0.5)*0.25)*fallK;      // (across the seed's own stretch of water, like xw)
  float cut = smoothstep(1.5, 11.0, bm);
  float clump = smoothstep(0.2, 0.5, smNoise(vec2(sx*0.8 + 3.0, run*0.22 + 4.0)));
  float rA = max(smRopes(sx, run, 1.6, 3.0, cut, fwX, 0.1, 0.25), 0.0), rB = max(smRopes(sx + 0.37, run*1.2 + 5.0, 3.4, 11.0, cut, fwX, 0.08, 0.2), 0.0)*lodF*clump;
  float bead = smoothstep(0.82, 0.96, smNoise(vec2(sx*6.0 + 7.0, run*1.9 + 3.0)))*lod0;
  float f0 = mix(0.5, smNoise(vec2(sx*11.0 + 1.5*n2, run*0.8)), lod0);
  float f1 = mix(0.5, smNoise(vec2(sx*26.0, run*1.4)), lodN), f2 = mix(0.5, smNoise(vec2(sx*60.0 + 5.0, run*3.2)), lodV);
  float fib = (f0 - 0.5)*0.56 + (f1 - 0.5)*0.4 + (f2 - 0.5)*0.22;
  float rope = max(rA, 0.85*rB);
  float strand = min(rope*1.7, 0.68)*(0.8 + 0.2*n2) + (clot - 0.5)*0.3 + fib*(0.1 + 1.7*smoothstep(0.0, 0.35, rope)) + 0.62*bead;      // (knots ride down the ropes)
  // (upstream and on the crest the water is knots of froth, streaked the way it runs)
  float body = mix(clot + fib*0.6, strand, fallK);
  body += 0.09*clamp(vHump, 0.0, 1.0);                         // (the water piles up on the lip: the knots stand closest there)
  // how much of it there is: knots with dark water between upstream, closest on the crest, ropes with dark between
  // them from the crest on, fewer and thinner as they drop
  float thr = mix(mix(0.46, 0.57, up), 0.38 + 0.14*smoothstep(3.0, 18.0, bm), fallK);
  // RAGGED ON EVERY SIDE. Toward its sides and both its ends the water does not fade: there is less and less of it (the
  // threshold rises), so ropes and knots end one by one, each at its own place. The sides wander by metres as the water
  // runs and by a quarter of the width over a metre; the ropes end at different heights.
  float acw = ac + 0.25*(smNoise(vec2(run*0.9, xw*0.7 + 3.0)) - 0.5) + 0.12*(smNoise(vec2(run*2.3 + 7.0, xw*1.9)) - 0.5);
  float side = smoothstep(0.08, 0.3 + 0.1*smNoise(vec2(run*0.17, 7.0 + wS)), acw)*(1.0 - smoothstep(0.66 - 0.12*smNoise(vec2(run*0.23, 31.0 + wS)), 0.92, acw));
  float fadeUp = smoothstep(-5.0, -2.6, bm + 1.6*(n1 - 0.5) + 0.8*(n2 - 0.5));
  float fadeDn = 1.0 - smoothstep(9.5, 17.5, bm + 5.0*(n1 - 0.5) + 7.0*(smNoise(vec2(sx*1.3, 5.0)) - 0.5));      // (sx carries wS)
  thr += 0.55*(1.0 - side) + 0.5*(1.0 - fadeUp) + 0.62*(1.0 - fadeDn);
  // (and none of it on the lip's climb: left of the notch it pours through, the lip rises four metres in a metre and a
  // half, and water does not run up that; knots drawn there stood over the fall as a pale patch of their own)
  thr += 0.8*(1.0 - smoothstep(-11.9, -10.9, xm + 0.5*(n2 - 0.5)));
  float aw = clamp(1.2*fwidth(body), 0.004, 0.12);              // an edge as sharp as the pixel allows, at any range
  float cov = smoothstep(thr - aw, thr + aw, body);
  cov *= smoothstep(0.0, 0.03, ac)*(1.0 - smoothstep(0.97, 1.0, ac))*(1.0 - smoothstep(22.5, 24.0, bm))*smoothstep(-5.0, -4.6, bm);      // (nothing is left by the mesh's own border)
  if (cov < 0.004) discard;
  // form: each knot and rope is brightest on its crown and blue-shadowed at its edge; the welt on the lip is the brightest
  float crown = smoothstep(thr - 0.01, thr + 0.13, body);
  vec3 foam = (uSnow*0.4 + uTurq*0.4 + uPortalCol*0.12)*min(uFoamTint, vec3(1.0))*0.9;
  vec3 shade = (uElectric*0.2 + cobD*0.16 + uTurq*0.08)*min(uFoamTint, vec3(1.0));
  vec3 col = mix(shade, foam, crown*mix(0.62 + 0.38*clamp(vHump, 0.0, 1.0), 0.86, fallK)*(0.72 + 0.28*n3));
  col *= 0.74 + 0.2*f0 + 0.2*f1 + 0.12*f2;                      // (wet cyan-white with form: fibres and knots, not paper)
  col *= 1.0 - 0.3*smoothstep(10.0, 21.0, bm);                  // it dims as it drops into the dark
  col += uPortalCol*uPortalI*0.1*(0.3 + 0.7*crown)/(1.0 + dot(vPL, vPL)/2600.0);
  cov *= smoothstep(1.2, 3.0, dc);                              // (do not slap the lens)
  gl_FragColor = vec4(smFog(col, vP.y, dc)*cov, cov);
}`;
function buildConduitFall(shape) {
  const X0 = -12.8, X1 = -5.6, nu = 44, bs = [], CD = shape.cd;
  for (let b = -5; b < -1.61; b += 0.85) bs.push(b);
  for (let b = -1.6; b < 2.39; b += 0.4) bs.push(b);
  for (let b = 2.4; b <= 24.01; b += 0.8) bs.push(b);
  const nv = bs.length - 1, cnt = (nu + 1) * (nv + 1);
  const pos = new Float32Array(cnt * 3), ac = new Float32Array(cnt * 4), an = new Float32Array(cnt * 3);
  for (let j = 0; j <= nv; j++) {
    const b = bs[j];
    for (let i = 0; i <= nu; i++) {
      const a = i / nu, x = lerp(X0, X1, a), q = j * (nu + 1) + i;
      const Dl = CD - 0.8 - lipWob(x), zl = shape.nearZ(x, Dl);      // the lip: just above where the footwall steps away
      // the way the water stands off the ice: toward the axis, tipped up the shaft
      let ox = -x, oz = axisZ(Dl) - zl; const ol = Math.hypot(ox, oz) || 1; ox /= ol; oz /= ol;
      let px, py, pz;
      if (b <= 0) { const D = Dl + b * COSL; px = x; py = -D; pz = shape.nearZ(x, D); }
      else {
        // on down the fall line, fanning a little, and FLUNG INTO THE THROAT from the lip on: the strands swing away to the
        // left along the wall, the way the conduit runs (8 m by 10 m down, 12 m by 16 m). Seen from above, water that only
        // fell would lie behind its own crest, a blob; flung so, it draws ragged strands across the dark of the mouth
        const sw = Math.max(b - 0.8, 0), q2 = 12 * (1 - Math.exp(-sw * sw * 0.013)), fan = (a - 0.5) * 0.14 * b;
        px = x + fan - 0.9 * q2; py = -Dl - b * COSL - 0.008 * b * b; pz = zl - b * SINL - 0.436 * q2;
      }
      const off = 0.7;                                          // (clear of the flutes' aretes, which stand half a metre off the footwall)
      pos[q * 3] = px + ox * off * 0.94; pos[q * 3 + 1] = py + off * 0.34; pos[q * 3 + 2] = pz + oz * off * 0.94;
      ac[q * 4] = x; ac[q * 4 + 1] = b; ac[q * 4 + 2] = a; ac[q * 4 + 3] = 0;
      an[q * 3] = ox * 0.94; an[q * 3 + 1] = 0.34; an[q * 3 + 2] = oz * 0.94;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aC', new THREE.BufferAttribute(ac, 4)); g.setAttribute('aN', new THREE.BufferAttribute(an, 3));
  g.setIndex(new THREE.BufferAttribute(gridIndex(nu, nv, false), 1));
  return g;
}

// ---------------------------------------------------------------- soft sprites: plume, shaft mist, falling drops
const PLUME_NB = 11;     // billows in the plume at any moment (SPRITE_VERT MODE 0): close enough that each head overlaps the next by a third
const SPRITE_VERT = /* glsl */`
attribute vec4 aSeed;
varying vec2 vUv; varying vec4 vSeed; varying vec3 vW; varying vec3 vP; varying float vA; varying float vPh; varying vec3 vSunV; varying vec3 vPL; varying vec4 vOv;
uniform float uTime, uPlumeH, uLean, uPx, uPlumeSide; uniform vec3 uSun, uPortalPos; uniform vec4 uMouth; uniform vec2 uCd;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 c; float size, alpha, ph = 0.0;
  vOv = vec4(0.0, 1.0, 0.0, 1.0);
  #if MODE == 0
    // THE PLUME IS A TOWER OF BILLOWS: ${PLUME_NB} heads of vapour rise out of the mouth one after another, a dozen metres apart,
    // each a ball of puffs (aSeed.x = (which billow + how far out from its centre) / ${PLUME_NB}; aSeed.w = where on the head,
    // crown to belly). A head swells as it climbs, steps a little to one side or the other of the leaning axis, and
    // stands on the crown of the one below; its puffs breathe and sway on it. The puffs are drawn belly first and crown
    // last (makeSprites), so the crown of each head lies over the belly of the head above: from the river the column is
    // three or four stacked lumps, each bright on its crown with a hollow beneath, never one even band. A seventh of
    // the puffs are wisps, larger and thinner: half are flung past the head and feather its outline into the sky, half
    // hang in the neck between two heads.
    float bi = floor(aSeed.x*${PLUME_NB}.0), be = fract(aSeed.x*${PLUME_NB}.0);
    float b1 = fract(bi*0.618 + 0.21), b2 = fract(bi*0.382 + 0.63);
    ph = fract((bi + 0.6*b1)/${PLUME_NB}.0 + uTime*0.034);      // (irregular spacing: never a string of evenly spaced beads)
    float hb = pow(ph, 1.35)*(uPlumeH + 12.0) - 12.0;      // (closer together and slower where they leave the mouth: the foot is a solid column)
    float hh = max(hb, 0.0), hp = hh/uPlumeH;
    // ONE PLUME FOR EVERY EYE, shaped by height above the mouth alone: a jet where it leaves the hole, 7 m wide and
    // dense, so it stands on the hole as a column and the far wall's crescent shows beside it; it swells to its girth in
    // the first 25 m and goes on widening as it climbs, to the brief's 30 to 45 m across at the top. Its heads are of
    // unequal size, two to one, and each steps further to one side of the leaning axis the higher it stands, so the
    // tower's outline keeps its notches; lilac vapour fills every neck.
    float Rb = (3.4 + 3.6*(1.0 - exp(-hh/12.0)) + 0.11*hh)*(0.6 + 0.72*b2);
    vec3 bc = vec3(uLean*(2.0 + 26.0*pow(hp, 1.2)) + (b1 - 0.5)*(3.2 + 0.11*hh) + 1.2*sin(uTime*0.27 + bi*2.4)*hp, hb, uMouth.x - 2.0 - 4.0*hp + (b2 - 0.5)*3.0);
    float pth = acos(clamp(mix(1.0, -0.6, pow(aSeed.w, 0.85)), -1.0, 1.0)) + 0.16*sin(uTime*0.5 + aSeed.w*40.0), ang = aSeed.z*6.2832 + 0.22*sin(uTime*0.13 + aSeed.w*9.0);
    vec3 po = vec3(sin(pth)*cos(ang), cos(pth), sin(pth)*sin(ang));
    float wisp = step(0.8, aSeed.y), shell = mix(0.3, 1.0, sqrt(be));
    // (a head is a fifth taller than it is wide, so each stands on the crown of the one below and the tower has no gaps;
    // and half of the wisps are not flung out but hang in the NECK between two heads: the lilac vapour in the creases)
    float neck = wisp*step(0.25, fract(aSeed.w*7.0));      // (three in four: lilac vapour fills every neck; the rest feather the outline)
    po = normalize(mix(po, vec3(0.5*cos(ang), -1.0, 0.5*sin(ang)), neck));
    c = bc + po*vec3(1.0, 1.25, 0.9)*Rb*mix(shell*(1.0 + 0.5*wisp), 0.55 + 0.75*be, neck);      // (neck wisps hang from the belly to the crown below)
    size = Rb*(0.4 + 0.3*aSeed.y)*(1.0 + 0.25*wisp + 0.2*neck);
    float lowFade = smoothstep(-9.0, -1.5, c.y);               // thin deep inside the mouth; solid from just under the rim up: it stands in the hole
    alpha = smoothstep(0.0, 0.07, ph)*(1.0 - smoothstep(0.74, 1.0, ph))*mix(0.86 + 0.14*sin(uTime*0.7 + aSeed.z*30.0), 0.98, neck)*0.94*lowFade*(1.0 - 0.62*wisp*(1.0 - neck));
    vOv = vec4(mat3(viewMatrix)*mat3(modelMatrix)*po, shell);
  #elif MODE == 1
    // mist hanging in the shaft, breathing slowly
    float Dm = mix(16.0, 236.0, aSeed.x) + 5.0*sin(uTime*0.11 + aSeed.y*30.0);
    float am = aSeed.z*6.2832; float rm = 2.0 + 7.0*aSeed.w;
    float bz = sin(am)*rm; bz = bz > 0.0 ? bz*0.5 : bz;
    c = vec3(cos(am)*rm + 0.8*sin(uTime*0.07 + aSeed.w*20.0), -Dm, ${AXIS_Z0.toFixed(4)} - Dm*${LEAN.toFixed(5)} + bz);
    size = 8.0 + 7.0*aSeed.y; alpha = 0.16 + 0.1*aSeed.w;
  #elif MODE == 3
    // MIST ROLLING OUT OF THE CONDUIT. A third of the puffs sit on the lip where the water goes over. The rest are born a
    // metre or two inside the mouth under the lip, roll out and climb 12 to 30 m up the shaft along the left wall,
    // swelling and thinning: a pale breath standing off the wall over the conduit, which tells from far above where the
    // water is going. None is drawn within 14 m of the lens (it would be a smear).
    float pm = fract(aSeed.x + uTime*(0.035 + 0.02*aSeed.y));
    float onLip = step(0.66, aSeed.y);
    float mx = mix(-12.0, -6.6, aSeed.z);
    float Dc = uCd.x - ${LIP_WOB('mx')} + mix(0.5 + 2.5*aSeed.w, -0.5 + 1.5*aSeed.w, onLip);
    vec3 c0 = vec3(mx, -Dc, ${AXIS_Z0.toFixed(4)} - Dc*${LEAN.toFixed(5)} + min(8.1, sqrt(max(uCd.y*uCd.y*0.95 - mx*mx, 0.0))) - 0.8) + vec3(${PDX.toFixed(4)}, 0.0, ${PDZ.toFixed(4)})*1.5*(1.0 - onLip);
    float rise = 12.0 + 27.0*aSeed.y;
    vec3 roll = mix(vec3(0.5 + 1.5*aSeed.w, rise, ${LEAN.toFixed(5)}*rise - 1.0 - 1.5*aSeed.z), vec3(1.5 + 2.0*aSeed.w, 3.0 + 5.0*aSeed.y, -2.0 - 2.0*aSeed.z)*0.4, onLip);
    c = c0 + roll*pm + vec3(0.5*sin(uTime*0.23 + aSeed.z*30.0), 0.0, 0.4*cos(uTime*0.19 + aSeed.y*40.0));
    size = mix(mix(1.4, 6.2, pm), mix(1.1, 2.8, pm)*0.7, onLip)*(0.7 + 0.6*aSeed.w); alpha = smoothstep(0.0, 0.16, pm)*(1.0 - smoothstep(0.45, 1.0, pm))*mix(0.3, 0.2, onLip);
  #else
    // drops and small clumps falling with the camera
    float Dd = mod(aSeed.x*205.0 + uTime*(19.0 + 9.0*aSeed.y), 205.0) + 13.0;
    float ad = aSeed.z*6.2832; float rd = 1.6 + 6.4*sqrt(aSeed.w);
    float bd = sin(ad)*rd; bd = bd > 0.0 ? bd*0.75 : bd;
    c = vec3(cos(ad)*rd, -Dd, ${AXIS_Z0.toFixed(4)} - Dd*${LEAN.toFixed(5)} + bd);
    size = 0.05 + 0.13*aSeed.y*aSeed.y; alpha = 0.7;
    // every third one is a rope of spray: a soft streak a metre or two long, falling with us
    float rope = step(0.66, aSeed.w);
    size *= 1.0 + 0.9*rope;
    float slen = (0.3 + 0.6*aSeed.y)*(1.0 + 0.25*rope);
    c += vec3(0.0, -${COSL.toFixed(4)}, -${SINL.toFixed(4)})*position.y*slen;      // the quad's long axis lies down the fall line
  #endif
  vec4 wc = modelMatrix*vec4(c, 1.0);
  vec4 mv = viewMatrix*wc;
  float dist = length(mv.xyz);
  #if MODE == 2
    size = max(size, dist*uPx*1.3);                       // never thinner than ~1.6 px
    alpha *= smoothstep(0.4, 1.5, dist)*(1.0 - 0.6*rope)*mix(1.0, smoothstep(9.0, 20.0, dist), rope);      // a rope beside the lens was a smear, at 8 m a ruled hairline
  #else
    alpha *= smoothstep(size*0.25, size*1.1, dist);        // do not slap the lens
    #if MODE == 3
      alpha *= smoothstep(14.0, 30.0, dist);
    #endif
  #endif
  vUv = position.xy; vSeed = aSeed; vA = alpha; vPh = ph; vP = c;
  #if MODE == 2
    {
      vec3 fv = mat3(viewMatrix)*mat3(modelMatrix)*vec3(0.0, -${COSL.toFixed(4)}, -${SINL.toFixed(4)});
      vec2 sd = fv.xy*(-mv.z) + mv.xy*fv.z;                 // the fall line as it lies on the screen here (it points at the vanishing point)
      vec2 fd = sd/max(length(sd), 1e-4);
      mv.xy += vec2(fd.y, -fd.x)*position.x*size + fd*position.y*size;
    }
  #else
    mv.xy += position.xy*size;
  #endif
  vW = wc.xyz + (vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0])*position.x + vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1])*position.y)*size;
  #if MODE == 2
    vW = wc.xyz;
  #endif
  vSunV = normalize(mat3(viewMatrix)*mat3(modelMatrix)*uSun);
  #if MODE == 0
    {
      // the plume's key: the sun, lifted toward the zenith (a crown is bright whatever the hour) and, in a low sun, turned
      // toward left and right as the lens sees it (uPlumeSide), so the shade flank shows beside the lit one
      vec3 sT = normalize(uSun); float sl = length(sT.xz);
      vec2 sx = mix(sT.xz, vec2(sT.x < 0.0 ? -sl : sl, 0.0), 0.6*uPlumeSide);
      vSunV = normalize(mat3(viewMatrix)*mat3(modelMatrix)*vec3(sx.x, sT.y + 0.5, sx.y));
    }
  #endif
  vPL = uPortalPos - c;
  vec4 mvPosition = mv;
  gl_Position = projectionMatrix*mv;
  #include <fog_vertex>
}`;
const SPRITE_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vSeed; varying vec3 vW; varying vec3 vP; varying float vA; varying float vPh; varying vec3 vSunV; varying vec3 vPL; varying vec4 vOv;
uniform float uTime, uPortalI, uWarm, uPlumeSide, uDrift, uPlumeKnee; uniform vec3 uSun, uSunCol, uSkyCol, uSnow, uTurq, uCobalt, uElectric, uGold, uPortalCol, uPlumeTint, uPlumeShade;
#include <common>
${NOISE_GLSL}
${FOG_PARS}
void main(){
  float r2 = dot(vUv, vUv);
  if (r2 > 1.0) discard;
  float dist = length(cameraPosition - vW);
  float D = max(-vP.y, 0.0);
  vec3 cobD = uCobalt*(1.0 + 1.5*smoothstep(70.0, 165.0, D));
  float pd2 = dot(vPL, vPL);
  vec3 portal = uPortalCol*uPortalI/(1.0 + pd2/420.0);
  #if MODE == 2
    float core = (1.0 - r2); core *= core;
    // a rope of spray is a string of falling clots, not a ruled streak
    core *= mix(1.0, smoothstep(0.3, 0.62, 0.5 + 0.5*sin(vUv.y*6.5 + vSeed.x*60.0) + 0.25*(smNoise(vec2(vUv.y*3.0 + vSeed.y*40.0, vSeed.x*9.0)) - 0.5)), step(0.66, vSeed.w));
    float day = exp(-D/60.0);
    vec3 col = (mix(uSkyCol + uSnow*0.5, mix(cobD, uTurq, 0.35)*1.5, smoothstep(40.0, 130.0, D))*(0.2 + 1.1*day)*(1.0 - 0.6*smoothstep(120.0, 240.0, D)) + portal*5.0)*(0.6 + 0.8*core);
    col += uSunCol*2.5*core*step(0.9, fract(vSeed.w*17.0))*(1.0 - step(0.66, vSeed.w))*day*(0.5 + 0.5*sin(uTime*7.0 + vSeed.x*80.0));
    gl_FragColor = vec4(smFog(col, vP.y, dist), core*vA);
  #else
    float r = sqrt(r2);
    vec2 nu = vUv*1.6 + vSeed.xy*17.0;
    float n = smFbm(nu + vec2(0.0, -uTime*0.11)) *0.65 + smNoise(nu*2.7 + uTime*0.07)*0.35;
    #if MODE == 3
      float a = (1.0 - smoothstep(0.0, 0.95, r + (0.5 - n)*0.95))*vA;      // (torn all round: a breath of mist, never a disc)
    #elif MODE == 1
      float a = (1.0 - smoothstep(0.05, 0.95, r + (0.5 - n)*0.5))*vA;
    #else
      // (a torn edge that feathers out: soft where a head meets the sky, and softer still on the wisps)
      float a = (1.0 - smoothstep(mix(0.32, 0.08, step(0.8, vSeed.y)), 0.98, r + (0.5 - n)*1.1))*vA;
    #endif
    // fake volume: a sphere normal in view space lit by the sun, blue in the shadow, never grey
    vec3 nrm = normalize(vec3(vUv*0.9 + (n - 0.5)*0.5, sqrt(max(1.0 - r2, 0.0)) + 0.25));
    float l = dot(nrm, vSunV)*0.5 + 0.5;
    #if MODE == 0
      // THREE TONES, AND ALL OF THEM A CLOUD'S. Each puff knows where it sits on its billow (vOv: the direction out from the
      // head's centre, in view space, and how near the shell it is), so the light models whole heads, not sprites: a
      // CROWN that is white to cream, a HOLLOW under it and in the creases between two heads that is lilac, a clear step
      // darker, and a SHADE flank (the side turned from the sun) that runs on through lilac into the sky's blue-violet.
      // SPRAY IS WHITE whatever the hour (the key's colour is taken most of the way to white at its own brightness: a rose
      // or amber sun does not dye a cloud of water tan); the hour shows only as a thin warm rim on the sunward lumps.
      vec3 shade = (uSnow*0.3 + uSkyCol*0.42 + uTurq*0.04)*uPlumeShade*mix(1.0, 0.9, uPlumeSide);
      vec3 s0 = mix(uSunCol, vec3(1.12), 0.45); float sM = max(s0.r, max(s0.g, s0.b));
      vec3 sunny = uSnow*0.95*mix(vec3(sM), s0, 0.22);
      vec3 lilac = mix(shade, sunny*vec3(0.9, 0.88, 1.0), 0.24);
      vec3 upV = normalize(viewMatrix[1].xyz);
      vec3 Nb = normalize(vOv.xyz*(0.3 + 0.9*vOv.w) + nrm*0.7 + vec3(1e-4, 0.0, 0.0));
      float lc = dot(Nb, vSunV)*0.5 + 0.5;
      float crown = dot(vOv.xyz, upV) + 0.4*dot(nrm, upV) + 0.35*(n - 0.5);      // where on its head (1 crown .. -0.6 belly), and the puff's own top
      float hollow = (1.0 - smoothstep(0.15, 0.85, crown))*(0.45 + 0.55*vOv.w);      // (a hollow by its height on its own head and how near the head's shell it lies: the same for every eye)
      float litK = smoothstep(0.42, 0.68, lc)*(1.0 - 0.95*hollow)*(0.5 + 0.5*smoothstep(-0.05, 0.25, vPh));
      // (the darkest tone is a third of the way from the shade to the lilac: no navy bellies, no smoky flank)
      vec3 col = mix(mix(mix(shade, lilac, 0.35), lilac, smoothstep(0.2, 0.52, lc)*(1.0 - 0.5*hollow)), sunny, litK);
      col *= (0.86 + 0.24*n)*(0.94 + 0.1*smoothstep(0.1, 0.9, crown))*(1.0 - 0.14*smoothstep(0.5, 0.95, r));
      col += mix(sunny, uGold*s0*1.25, 0.75*uWarm)*0.32*smoothstep(0.35, 0.8, r)*smoothstep(0.42, 0.7, n)*smoothstep(0.6, 0.86, lc)*(1.0 - hollow);      // the thin warm rim, sun side only
      float fsc = max(dot(normalize(vW - cameraPosition), normalize(uSun)), 0.0);
      col += mix(uGold, vec3(1.0), 0.75)*pow(fsc, 4.0)*0.3*(1.0 - a*0.5);
      // a truthful piece of rainbow: 42 degrees from the antisolar point, where the spray is
      vec3 vd = normalize(vW - cameraPosition);
      float ca = clamp(dot(vd, -normalize(uSun)), -1.0, 1.0);
      float deg = acos(ca)*57.2958;
      float tb = (deg - 40.2)/2.4;
      vec3 bow = clamp(vec3(1.5 - abs(tb*4.0 - 3.2), 1.5 - abs(tb*4.0 - 2.0), 1.5 - abs(tb*4.0 - 0.8)), 0.0, 1.0);
      col += bow*smoothstep(0.0, 0.2, tb)*(1.0 - smoothstep(0.8, 1.0, tb))*0.8*(1.0 - smoothstep(0.45, 0.9, vPh));
      // NEVER FLAT WHITE: a soft knee holds the brightest lumps under 0.9, so form shows inside the lit flank
      col *= uPlumeTint;
      // (in a ground blizzard the knee is let out, by the drift alone: the tower stands in bright gold murk and must not be
      // darker than the haze behind it)
      float kTop = uPlumeKnee + 0.45*smoothstep(1.4, 2.4, uDrift);
      float cm = max(col.r, max(col.g, col.b)), ck = cm > 0.6 ? 0.6 + kTop*(1.0 - exp(-(cm - 0.6)/kTop)) : cm;
      col *= ck/max(cm, 1e-3);
      // (its haze is the air's: the fog that lies between the eye and the plume, as on everything else (smFog); nothing
      // else in the plume reads how far the eye is)
      gl_FragColor = vec4(smFog(col, max(vP.y, 0.0), dist), a);
    #else
      float day = exp(-D/60.0);
      vec3 col = mix(uSkyCol*0.8 + uSnow*0.3, cobD*1.5, smoothstep(30.0, 120.0, D))*(0.12 + 0.9*day)*(1.0 - smoothstep(130.0, 240.0, D))*(0.6 + 0.6*l);
      // (the mist in the deep reach catches the ring's light from 60 m above it)
      col += uPortalCol*uPortalI*0.5/(1.0 + pd2/1100.0)*(0.7 + 0.5*l);
      #if MODE == 3
        // pale against the indigo wall and the ink throat: spray, lit by what daylight is left and by the ring
        col = (uTurq*0.2 + uSnow*0.16 + uElectric*0.12 + uPortalCol*0.08)*(0.5 + 0.6*l)*(0.8 + 0.4*n);
      #endif
      gl_FragColor = vec4(smFog(col, vP.y, dist), a);
    #endif
  #endif
}`;
// ---------------------------------------------------------------- waterfall threads in the shaft
// Meltwater that comes in over the rim goes down a flute from ledge to ledge, with the camera: A CHAIN OF SHORT FALLS.
// Where it strikes a ledge it bursts into a white knot; from the ledge's lip a rope half a metre wide pours off, thins,
// is torn into lumps and then drops, and ends 5 to 9 m lower; below that the wall is dark until the next ledge. Each fall
// leaves its ledge at its own place across the flute and wanders as it drops, so the chain zigzags inside the flute
// (never one ruled line: a fall is 5 to 9 m long, its rope a white core 0.3 to 0.6 m wide at the lip with soft edges
// to twice that, a third as wide at its end, and 7 to 11 m of dark wall lie between one fall and the next).
// A CHAIN IS A THING OF THE PLACE: it shows by the water's own depth below the surface, coming in between 12 and 34 m
// down and run out between 205 and 244 m (the third chain by 106 m), well above the ring at 273 m, so all three stand
// in the shaft at once for any eye. The eye's distance only fades what would slap the lens (7 to 15 m) and sets the
// pixel floors.
// The strip is made from the shaft's own vertices (one whole flute, pushed 0.22 m toward the axis), so it follows the
// flutes, their slow spiral and the ledges exactly. aT = (across -1..1, depth m, seed, ledge coordinate: whole numbers
// at the top of each ledge, worked out as shaftSteps does).
const THREAD_VERT = /* glsl */`
attribute vec4 aT; attribute float aK;
varying vec4 vT; varying vec3 vP; varying vec3 vW; varying vec3 vPL; varying float vK;
uniform vec3 uPortalPos;
#include <common>
#include <fog_pars_vertex>
void main(){
  vT = aT; vK = aK; vP = position; vPL = uPortalPos - position;
  vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const THREAD_FRAG = /* glsl */`
varying vec4 vT; varying vec3 vP; varying vec3 vW; varying vec3 vPL; varying float vK;
uniform float uTime, uPortalI; uniform vec3 uSkyCol, uSnow, uTurq, uCobalt, uElectric, uPortalCol, uFoamTint;
#include <common>
${NOISE_GLSL}
${FOG_PARS}
// a thin side strand: it wanders, swells and thins, and is broken into lengths that taper at both ends
float smStrand(float x, float D, float run, float id, float seed, float c0){
  // (a fast sideways wander and short lengths: seen close it is torn water, never a ruled hairline)
  float cx = c0 + (id - 0.5)*0.9 + 0.3*(smNoise(vec2(D*0.09 + id*7.3, seed*31.0)) - 0.5)*2.0 + 0.1*sin(run*0.21 + id*2.0) + 0.25*(smNoise(vec2(D*0.6 + id*3.1, seed*13.0)) - 0.5);
  float gate = smoothstep(0.5, 0.7, smNoise(vec2(id*5.1 + seed*17.0, run*0.16)));
  float w = (0.07 + 0.11*smNoise(vec2(run*0.034 + id*3.0, seed*9.0)))*(0.35 + 0.65*gate);
  return (1.0 - smoothstep(w*0.3, w, abs(x - cx)))*gate;
}
void main(){
  float x = vT.x, D = vT.y, sd = vT.z;
  vec3 cobD = uCobalt*(1.0 + 1.5*smoothstep(70.0, 165.0, D));
  float run = D - uTime*27.0;
  float aa = fwidth(x), lodR = 1.0 - smoothstep(0.3, 1.0, fwidth(run)*0.2), nearK = 1.0 - smoothstep(0.07, 0.22, aa);
  float dc = length(cameraPosition - vW);
  // which fall of the chain, and how far down it (lf 0 .. 0.09 is the ledge's top, 0.09 its lip)
  float seg = floor(vT.w), lf = vT.w - seg;
  float h1 = smHash(vec2(seg*1.7 + 3.0, sd*91.0)), h2 = smHash(vec2(seg*2.3 + 11.0, sd*53.0)), h3 = smHash(vec2(seg + 29.0, sd*37.0));
  float len = 0.34 + 0.24*h1;                                    // this fall's length as a share of the ledge spacing: 5 to 9 m
  float wet = step(0.12, h3);                                   // now and then the water runs behind a ledge
  float q = clamp((lf - 0.09)/(len - 0.09), 0.0, 1.0);          // 0 at the lip, 1 where the fall has blown out
  float tail = smoothstep(0.05, 0.1, lf)*(1.0 - smoothstep(len*0.55, len, lf));
  // THE ROPE of one fall: it leaves the ledge at its own place across the flute, wanders as it drops, thins to a third,
  // has ragged edges, and is torn into lumps and then into drops. Never drawn thinner than two pixels (it fades instead).
  float c0 = (h2 - 0.5)*0.9;
  float cx = c0 + 0.24*(smNoise(vec2(D*0.2, sd*31.0)) - 0.5)*2.0 + 0.08*sin(D*0.7 + sd*40.0);
  float w = (0.3 + 0.22*smNoise(vec2(run*0.055, sd*9.0)))*mix(1.0, 0.38, q), wm = max(w, aa*2.0);
  float xr = x - cx + 0.14*(smNoise(vec2(x*3.0 + sd*5.0, run*0.11)) - 0.5)*nearK;
  float body = 1.0 - smoothstep(wm*0.4, wm, abs(xr));
  float lumpN = 0.62*smNoise(vec2(sd*9.0, run*0.13)) + 0.38*mix(smNoise(vec2(sd*3.0 + 7.0, run*0.27)), smNoise(vec2(x*2.6 + sd, run*0.2)), nearK);
  float lump = smoothstep(0.14 + 0.42*q, 0.36 + 0.42*q, lumpN);
  float fib = mix(0.8, 0.66 + 0.34*smNoise(vec2(x*9.0 + sd*31.0, run*0.9)), lodR*nearK);      // short lengths: long fibres were ruled hairlines beside the lens
  float rope = body*lump*fib*(w/wm)*tail;
  // THE KNOT: where the water strikes the ledge it bursts white, boiling: 1 to 1.8 m wide (half the flute) and about
  // 1.6 m high, its own size in metres at every range; a little spray stands over it
  float dk = (lf - 0.055)/0.05, up = exp(-(1.0 - lf)/0.035);
  float boil = 0.5 + 0.5*smNoise(vec2(x*4.0 + sd*3.0 + seg, uTime*2.6 + lf*30.0));
  float knot = (exp(-dk*dk) + 0.45*up)*(1.0 - smoothstep(0.15, 0.4 + 0.16*boil, abs(x - c0*0.7)))*(0.5 + 0.5*boil);      // a burst, not a cloud
  // near the eye: two thin strands beside the rope, a torn veil of spray, and beads flung clear
  float st = max(smStrand(x, D, run + 37.0, 0.0, sd, c0), smStrand(x, D, run + 91.0, 1.0, sd, c0))*nearK*lump;
  float veil = exp(-xr*xr*5.0)*smoothstep(0.45, 0.8, smNoise(vec2(x*2.6 + sd*13.0, run*0.09)))*0.16*lump;
  // (beads are drops a hand long, one to a cell 0.43 m long down the fall and 0.25 to 0.3 m across it: two metres long,
  // they were ruled pale hairlines)
  vec2 bc = vec2(x*5.0 + sd*7.0, run*2.3); float bh = smHash(floor(bc)); vec2 bo = (smHash2(floor(bc) + 3.0) - 0.5)*0.5;
  // (a bead is drawn only where its cell is a dozen pixels across: smaller, they were a patch of pixel stipple)
  float bead = step(0.9 - 0.12*q, bh)*(1.0 - smoothstep(0.08, 0.16 + 0.2*bh, length(fract(bc) - 0.5 - bo)))*lodR*nearK*(1.0 - smoothstep(0.05, 0.11, max(fwidth(bc.x), fwidth(bc.y))));
  float a = clamp(rope*0.95 + min(knot*0.9, 0.5) + (st*0.35 + veil + bead*0.7)*tail, 0.0, 1.0)*(1.0 - smoothstep(0.78, 1.0, abs(x)))*wet;
  a *= smoothstep(12.0, 34.0, D)*(1.0 - smoothstep(205.0, 244.0, D))*vK;      // by the water's own depth: in over 12 to 34 m, out over 205 to 244 m (vK: where its own chain runs out)
  a *= mix(0.72, 0.95, nearK)*smoothstep(7.0, 15.0, dc);      // a guard only: nothing is drawn within 7 m of the lens (a knot there was a smear)
  float day = 1.0/(1.0 + D*D/3200.0);
  vec3 deep = mix(uTurq*1.3, mix(uElectric, cobD, 0.3)*2.1, smoothstep(45.0, 125.0, D));
  // white water stays white: it keeps half as much light again below 120 m as the ice does, and takes the ring's cyan near it
  // (in the deep reach it gives two thirds of that back and turns bluer: the ring is the brightest thing in the well)
  vec3 col = (uSnow*0.8 + uSkyCol*0.2)*mix(vec3(1.0), deep, 0.3*smoothstep(14.0, 60.0, D) + 0.3*smoothstep(140.0, 210.0, D))*(0.22 + 0.72*day + 0.3*smoothstep(70.0, 125.0, D)*(1.0 - 0.65*smoothstep(150.0, 215.0, D)))*uFoamTint;
  col *= 0.8 + 0.4*fib + 0.3*lump + 0.5*knot;
  col += uPortalCol*uPortalI*0.2/(1.0 + dot(vPL, vPL)/2600.0);
  gl_FragColor = vec4(smFog(col, vP.y, dc)*a, a);
}`;
// The slant of light standing in the upper shaft: a ribbon turned to the lens round its own axis (uB0 .. uB1), soft across,
// combed into three or four rays that drift, strongest where it enters and gone before it meets the wall.
const BEAM_VERT = /* glsl */`
attribute vec2 aB; varying vec2 vB;
uniform vec3 uB0, uB1;
void main(){
  vec3 c = (modelMatrix*vec4(mix(uB0, uB1, aB.x), 1.0)).xyz, ax = normalize(mat3(modelMatrix)*(uB1 - uB0));
  vec3 sd = cross(ax, cameraPosition - c); sd = sd/max(length(sd), 1e-4);
  vB = aB;
  gl_Position = projectionMatrix*viewMatrix*vec4(c + sd*aB.y*mix(5.2, 2.6, aB.x), 1.0);
}`;
const BEAM_FRAG = /* glsl */`
varying vec2 vB;
uniform float uTime, uWarm, uBeamA; uniform vec3 uGold, uSunCol, uSkyCol, uSnow;
${NOISE_GLSL}
void main(){
  float x = vB.y, t = vB.x;
  float prof = exp(-x*x*3.2)*(1.0 - smoothstep(0.75, 1.0, abs(x)));
  float lanes = smoothstep(0.3, 0.72, smNoise(vec2(x*2.6 + 3.0 + 0.3*sin(uTime*0.11), t*1.3 + uTime*0.012)))*0.7 + 0.3*smNoise(vec2(x*6.5 + uTime*0.05, t*3.0));
  float dust = 0.75 + 0.5*smNoise(vec2(x*5.0 + 11.0, t*42.0 - uTime*0.7));
  lanes = mix(lanes, 0.6, smoothstep(0.1, 0.35, t));      // (rays only where it enters: further down it is one soft slant, never a ruled ray)
  float a = prof*(0.3 + 0.7*lanes)*dust*smoothstep(0.02, 0.3, t)*(1.0 - smoothstep(0.5, 0.97, t))*uBeamA*(0.45 + 0.55*smoothstep(0.3, 0.7, uWarm));
  float wK = smoothstep(0.3, 0.7, uWarm);
  vec3 col = mix(uSkyCol*0.5 + uSnow*0.3, mix(uGold, uGold*uSunCol/max(max(uSunCol.r, max(uSunCol.g, uSunCol.b)), 1e-3), 0.3)*vec3(1.35, 1.0, 0.7), wK);
  gl_FragColor = vec4(col*a, a*mix(0.2, 0.75, wK));      // (laid over the aqua behind it as well as added: gold on pale blue only whitens)
}`;
function buildThreads(shaftGeo, targetsDeg, rng, th0, nz) {
  const sp = shaftGeo.attributes.position, sf = shaftGeo.attributes.aSurf, W = N_FLUTE * SEG_PER_FLUTE + 1, nRing = sp.count / W;
  const pos = [], at = [], ak = [], idx = [], NK = SEG_PER_FLUTE + 1;
  let jRef = 0; while (jRef < nRing - 1 && -sf.getY(jRef * W) < 30) jRef++;
  for (const [T, Dmax] of targetsDeg) {
    // the flute whose groove lies nearest the wanted bearing 30 m down
    let best = 9, bf = 0;
    for (let f = 0; f < N_FLUTE; f++) {
      const q = jRef * W + f * SEG_PER_FLUTE + 2, a = Math.atan2(sp.getZ(q) - axisZ(30), sp.getX(q));
      const d = Math.abs(Math.atan2(Math.sin(a - T * DEG), Math.cos(a - T * DEG)));
      if (d < best) { best = d; bf = f; }
    }
    // the ledges' phase in this flute (as shaftSteps lays them): one value for the whole strip, so a knot lies level
    const tm = lerp(th0[bf], th0[bf + 1], 0.5), ct = Math.cos(tm), stt = Math.sin(tm);
    const lph = 8 * nz.n2(ct * 1.1 + 31, stt * 1.1) + 4 * nz.n2(ct * 2.9, stt * 2.9 + 13);
    const base = pos.length / 3, seed = rng(); let rows = 0;
    for (let j = 0; j < nRing; j++) {
      const D = -sf.getY(j * W); if (D < 9 || D > Dmax - 4) continue;
      for (let k = 0; k < NK; k++) {      // the whole flute, arete to arete: the rope and its spray have room to wander
        const q = j * W + bf * SEG_PER_FLUTE + k, x = sp.getX(q), z = sp.getZ(q), ix = -x, iz = axisZ(D) - z, il = Math.hypot(ix, iz) || 1;
        pos.push(x + ix / il * 0.34, sp.getY(q) + 0.12, z + iz / il * 0.34); at.push((k / (NK - 1)) * 2 - 1, D, seed, (D + lph) / 16.5 + 40); ak.push(1 - smoothstep(Dmax - 36, Dmax - 6, D));      // 0.12 up: clear of the shelf tops
      }
      rows++;
    }
    for (let j = 0; j < rows - 1; j++) for (let k = 0; k < NK - 1; k++) { const a = base + j * NK + k, b = a + 1, c = a + NK, d = c + 1; idx.push(a, c, b, b, c, d); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(at, 4)); g.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 1)); g.setIndex(idx);
  return g;
}

function makeSprites(U, mode, count, rng, extra = {}) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  let seed = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) seed[i] = rng();
  if (mode === 0) for (let i = 0; i < count; i++) seed[i * 4] = (i + rng()) / count;   // even phases: no pulsing
  if (mode === 0) {
    // THE PLUME'S PUFFS: extra.puffs of them, dealt evenly to PLUME_NB billows (x = (billow + how far out) / PLUME_NB), from a
    // generator of their own (the draws above are kept so that every later draw from the build's rng is unchanged), and
    // put in order: wisps first, then from belly to crown and from the far side of a head to the near side (the lens
    // always looks at the plume from upstream), so a crown is drawn over the belly of the head above it
    const n2 = extra.puffs || count, lr = makeNoiseRng(seed[1] * 40 + seed[2]), rows = [];
    for (let i = 0; i < n2; i++) {
      const e = clamp(lr(), 0.002, 0.998), y = lr(), z = lr(), w = lr();
      rows.push([((i % PLUME_NB) + e) / PLUME_NB, y, z, w, lerp(1, -0.6, Math.pow(w, 0.85)) + 0.5 * Math.sin(z * 6.2832) * lerp(0.3, 1, Math.sqrt(e)) - (y > 0.8 ? 2 : 0)]);
    }
    rows.sort((a, b) => a[4] - b[4]);
    seed = new Float32Array(n2 * 4); rows.forEach((r, i) => seed.set(r.slice(0, 4), i * 4)); count = n2;
    extra = Object.assign({}, extra); delete extra.puffs;
  }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    defines: { MODE: mode }, fog: true, transparent: true, depthWrite: false,
    blending: mode === 2 ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, extra),
    vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- spindrift: gold snow smoke streaming off the rims
// the wind's hand on a streamer, in metres at its tail: (lean, more lean by its own seed, swing to and fro, drift along
// the rim, lift) in a ground blizzard, and the up-and-down sway of any day (0.3 + 0.22). DRIFT_VERT moves a streamer by
// these numbers and driftCurtainSteps measures its body by them.
const SW_LEAN = 2.4, SW_LEAN2 = 2.4, SW_SWING = 1.7, SW_ALONG = 3.2, SW_LIFT = 1.2, SW_SWAY = 0.52;
const glf = (v) => v.toFixed(2);
const DRIFT_VERT = /* glsl */`
attribute vec4 aRib;     // u along the wind 0..1, v along the rim (m), seed, strength (1 when the geometry carries only three)
varying vec4 vRib; varying vec3 vW; varying vec3 vP;
uniform float uTime, uDriftH, uDrift;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  {
    // STREAMERS IN A GROUND BLIZZARD (aRib.y < -900): the wind takes each one as it falls, so it leans out into the slot
    // by 2.4 to 4.8 m at its tail and curls, each to its own measure: a comma blown across the slot, never a straight thread
    // (SW_*: the same numbers driftCurtainSteps measures every streamer's body by, so that it keeps clear of the route)
    float blzV = smoothstep(1.4, 2.4, uDrift)*step(aRib.y, -900.0), uw = max(aRib.x - 0.2, 0.0)/0.8;
    p.x += blzV*((${glf(SW_LEAN)} + ${glf(SW_LEAN2)}*fract(aRib.z*7.3))*pow(uw, 1.4) + ${glf(SW_SWING)}*uw*sin(uTime*0.9 + aRib.z*40.0 + uw*5.5));      // (it bends like a comma, from the lip on)
    p.z += blzV*${glf(SW_ALONG)}*uw*uw*sin(aRib.z*23.0 + 1.0);
    p.y += blzV*${glf(SW_LIFT)}*uw*uw*(1.0 + sin(aRib.z*31.0));          // (and its tail lifts on the wind instead of hanging plumb)
  }
  p.y += uDriftH*sin(3.14159*min(aRib.x*1.25, 1.0));        // a ground blizzard stands taller over the rims
  // and its ribbons hang further down the windward wall (the ribbons only: a streamer is blown out, never dragged down
  // toward the route; its fall is what driftCurtainSteps measured)
  p.y -= uDriftH*2.2*step(aRib.y, 0.0)*step(-900.0, aRib.y)*pow(max(aRib.x - 0.5, 0.0)*2.0, 1.5);
  p.y += (0.3*sin(uTime*1.9 + aRib.y*0.23 + aRib.x*5.0) + 0.22*sin(uTime*3.1 + aRib.y*0.61))*aRib.x;
  vRib = aRib; vP = p;
  vec4 wp = modelMatrix*vec4(p, 1.0); vW = wp.xyz;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const DRIFT_FRAG = /* glsl */`
varying vec4 vRib; varying vec3 vW; varying vec3 vP;
uniform float uTime, uDrift, uWarm, uVeil; uniform vec3 uGold, uSunCol, uSnow;
#include <common>
${NOISE_GLSL}
${FOG_PARS}
void main(){
  float u = vRib.x, v = vRib.y;
  float lodv = 1.0 - smoothstep(0.25, 1.0, fwidth(v)*1.6);
  float gust = smoothstep(0.25, 0.75, smNoise(vec2(v*0.035 + vRib.z, uTime*0.22 - u*0.6)));
  float n1 = smNoise(vec2(u*3.2 - uTime*1.3, v*0.42 + vRib.z*9.0));
  float n2 = mix(0.5, smNoise(vec2(u*11.0 - uTime*3.4, v*1.6 + vRib.z*3.0)), lodv);
  float a = smoothstep(0.3, 0.9, n1*0.65 + n2*0.5)*(0.15 + 0.85*gust);
  // v < 0 marks the windward ribbons, whose sagging end shows against the wall: in a blizzard it stays thick to the end
  float hang = smoothstep(1.4, 2.4, uDrift)*step(v, 0.0);
  // (in a ground blizzard the hanging end is a veil that thins to nothing over its lowest third, well above the water)
  a *= smoothstep(0.0, 0.12, u)*(1.0 - smoothstep(mix(0.6, 0.88, step(v, -900.0)*0.6), mix(1.0, 0.94, hang), u));
  a = min(a*uDrift, 1.3);
  float dist = length(cameraPosition - vW);
  {
    // a hanging ribbon seen edge-on (the eye looking along the sheet where it sags into the slot) must not add up to a
    // ruled pillar: in a ground blizzard it thins as it turns its edge to the lens
    vec3 rdx = dFdx(vW), rdy = dFdy(vW), rn = cross(rdx, rdy);
    float face = abs(dot(rn/max(length(rn), 1e-6), (cameraPosition - vW)/max(dist, 1e-3)));
    a *= mix(1.0, 0.05 + 0.95*smoothstep(0.1, 0.62, face), hang);
  }
  a *= smoothstep(1.0, 5.0, dist);
  float cur = step(v, -900.0);
  a *= mix(vRib.w, 1.0, cur);      // ribbons: the fourth component fades them out (the world: over its snow bridges); 1 when the geometry carries three
  // (and it pales from gold to snow as it falls: a pale gold veil, never a tan pillar from rim to water)
  vec3 col = (mix(uSnow*uSunCol*0.8, mix(uGold*uSunCol*1.3, uSnow*uSunCol*0.9 + uGold*0.12, hang*smoothstep(0.4, 0.85, u)), uWarm) + uSnow*0.15)*a;
  // laid over what is behind it, not only added: a lit veil shows against the bright sky of the slot as well as the walls
  float fd = 1.0 - smoothstep(600.0, 1500.0, dist);
  // (a thin veil on an ordinary day, so the sky of the slot stays clean; a thick one in a ground blizzard)
  float thick = smoothstep(1.4, 2.4, uDrift);
  float vk = mix(1.0, uVeil, step(v, 0.0)*(1.0 - thick));      // uVeil > 1: the windward ribbons of this mesh are laid on thicker
  // v < -900 marks the CURTAINS: veils of snow smoke that pour off the windward cornice and hang across the slot, facing
  // the eye that looks down the canyon (the ribbons along the rims are seen edge-on from the water). vRib.w fades their
  // upper and lower edges. They are laid on at one strength whatever the weather, so a blizzard does not wall the slot up.
  // (in a warm low sun they are laid on twice as strong: gold curtains across the upper third of the slot)
  // (and in amber rather than pale gold: they hang in front of the white plume and must read against it)
  // STREAMERS: each is combed by the wind into threads that run with it over the cornice lip and pour down the wall,
  // dense and bright at the lip, torn to nothing at the tail. They are laid over the wall, not added to it (gold added
  // to blue ice is only a pale glow): in a warm low sun each is a gold drape on the blue shadow wall. A streamer thins
  // along its own length and is the same for every eye; only within 4 to 11 m of the lens does it fade, and that fade
  // acts on every pass: by the rule of the place the streamers hang 4.5 to 6.3 m from the route's line, none nearer
  // (driftCurtainSteps).
  // (v runs 0..9 across a streamer; its streaks are drawn along the flow, so near and far they stay combed threads)
  // (and never a bar with ruled edges: the whole veil wavers sideways as it falls, by up to a third of its width, its
  // two edges are torn by the same gusts, more and more toward the tail, and its body is thin enough to see the wall through)
  float vv0 = fract(-v/40.0)*40.0;                                  // 0..9 across this streamer's own strip
  float wander = (smNoise(vec2(u*2.3 - uTime*0.45, vRib.z*29.0 + 3.0)) - 0.5)*smoothstep(0.12, 0.7, u);
  // (in a ground blizzard every streamer leans and curls downwind as it falls: no straight vertical thread)
  float blz = smoothstep(1.4, 2.4, uDrift);
  float vv = vv0 + 5.5*wander - blz*(3.4*u*u + 1.3*u*sin(u*5.5 - uTime*0.7 + vRib.z*40.0));
  // (and its tail frays: a second sideways gust that differs across the strip, so its two edges never stay parallel)
  vv += blz*3.0*(smNoise(vec2(u*3.1 + vRib.z*11.0, vv0*0.45 - uTime*0.3)) - 0.5)*smoothstep(0.3, 1.0, u);
  float comb = 0.62*smNoise(vec2(u*2.4 - uTime*1.0, vv*0.8 + vRib.z*17.0)) + 0.38*smNoise(vec2(u*6.5 - uTime*2.3, vv*2.3 + vRib.z*5.0));
  float tailK = smoothstep(0.35, 1.0, u);                           // from a third of the way down the streamer is torn into threads, and then gone
  float strk = smoothstep(0.2 + 0.36*tailK, 0.46 + 0.36*tailK, comb);
  float head = 1.0 - smoothstep(0.2, 0.75, u);                      // dense and bright where it leaves the cornice lip
  // a drape with a body (half opaque between its threads, the threads nearly solid), all threads at the tail
  float envS = pow(max(sin(3.14159*clamp(vv/9.0, 0.0, 1.0)), 0.0), 0.6)*smoothstep(0.0, 0.3, vRib.w);
  float torn = smoothstep(0.08, 0.5, envS - (0.2 + (0.5 + 0.25*blz)*tailK)*smNoise(vec2(u*5.0 - uTime*1.2, vv0*1.1 + vRib.z*7.0)));
  float acur = mix(0.3 + 0.5*strk, strk*0.9, tailK)*(0.8 + 0.2*gust)*smoothstep(0.0, 0.1, u)*(1.0 - smoothstep(0.86, 1.0, u))*envS*mix(1.0, torn, 0.85);
  // (in a ground blizzard each streamer is torn along its length too: two or three detached veils, not one stroke)
  acur *= mix(1.0, smoothstep(0.24, 0.5, smNoise(vec2(u*4.4 - uTime*0.4 + vRib.z*50.0, vRib.z*13.0 + vv0*0.12))), blz*smoothstep(0.12, 0.34, u));
  acur = min(acur, 1.0)*smoothstep(4.0, 11.0, dist);
  // gold in a warm low sun (a bright drape, a stop over the blue shadow wall behind it); pale snow smoke otherwise
  // (the key's colour is taken half way to white at its own brightness: a rose midnight sun still gilds them)
  vec3 sc = min(mix(uSunCol, vec3(max(uSunCol.r, max(uSunCol.g, uSunCol.b))), 0.45)*0.98, vec3(1.25));
  vec3 colS = mix(uSnow*uSunCol*0.8 + uSnow*0.15, (uGold*0.86 + vec3(0.14, 0.12, 0.04))*sc*(0.86 + 0.3*strk*head), uWarm);
  float aS = acur*mix(0.5, 0.82, uWarm);
  gl_FragColor = mix(vec4(col*mix(0.8, 1.0, thick)*fd*vk, min(min(a, 1.0)*mix(0.24, 0.8, thick)*vk, 1.0)*fd), vec4(colS*aS, aS)*fd, cur);
}`;
function buildSpindrift(S, reach, shape, rng) {
  const pos = [], rib = [], idx = [];
  const strip = (rows, seed) => { // rows: array of arrays of [x,y,z,u,v]
    const base = pos.length / 3, nu = rows[0].length - 1;
    for (const r of rows) for (const q of r) { pos.push(q[0], q[1], q[2]); rib.push(q[3], q[4], seed); }
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d);
    }
  };
  for (let layer = 0; layer < 2; layer++) {
    const lift = layer * 0.7, sd = rng();
    // left rim: pours off the cornice and sags into the slot; right rim: streams away downwind
    const left = [], right = [];
    for (let z = reach; z >= 2; z -= 2.5) {
      const rl = [], rr = [], rim = rimLevel(z);
      for (let i = 0; i <= 7; i++) {
        const u = i / 7;
        rl.push([-14 + 16.5 * u, rim + 0.8 + lift + 0.7 * Math.sin(Math.PI * u * 0.75) - 5.2 * Math.pow(Math.max(u - 0.55, 0) / 0.45, 1.8), z, u, -(z + layer * 31)]);
        rr.push([5.5 + 13 * u, rim + 0.9 + lift + 1.6 * u, z, u * 0.9, z + 200 + layer * 31]);
      }
      left.push(rl); right.push(rr);
    }
    strip(left, sd); strip(right, sd + 0.37);
    // the windward (-X) arc of the mouth: snow smoke pouring into the hole
    const arc = [];
    for (let k = 0; k <= 34; k++) {
      const th = (118 + (k / 34) * 150) * DEG, row = [], P = {};
      for (let i = 0; i <= 7; i++) {
        const u = i / 7; shape.point(th, 0, 12 - 17 * u, 0, P);
        row.push([P.x, 0.9 + lift + 0.6 * Math.sin(Math.PI * u * 0.75) - 5.5 * Math.pow(Math.max(u - 0.55, 0) / 0.45, 1.8), P.z, u, k * 2.6 + 400 + layer * 31]);
      }
      arc.push(row);
    }
    strip(arc, sd + 0.71);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRib', new THREE.Float32BufferAttribute(rib, 3));
  g.setIndex(idx);
  return g;
}
// STREAMERS: nine tongues of snow smoke that pour off the left (windward) cornice of the straight reach. Each is a band
// in the plane of the wind (x, y), so it faces the eye that looks down the canyon: it runs over the cornice to its lip,
// spills, and hangs 6.3 to 7.8 m straight down in front of the overhung wall (the top half of it and more: drop, its
// own measure), fanning from 0.9 to 2.8 m wide. They are seated 7.2 to 15.2 m apart, so from anywhere on the reach three
// of them hang one behind the other over the blue shadow wall: gold drapes in a warm low sun. Their own mesh, drawn
// after the plume (which is a hundred metres behind them but writes no depth). No rng draws.
// A RULE OF THE PLACE: a streamer is spindrift blown off a rim, and its whole body, over all its fall and all the wind
// does to it, keeps STREAM_CLEAR metres from the route's centreline (line: that centreline at every metre). Each one's
// strip is measured against every metre of the line that passes it, still and in every pose the wind can give it
// (SW_*: the same numbers as DRIFT_VERT moves it by: the sway of any day and the whole lean, swing and lift of a
// ground blizzard, so the rule holds in any weather). Only a streamer that some pose brings nearer is shortened, and
// only as far as that asks; its seat stays where it is. None is removed, and none is tested against a moment or a
// position of the lens.
// On this world's route (0.95 m over the river, 12 m from the cornice lip) the calm streamers hang 5.1 to 6.3 m from
// the line, and four of the nine are shortened for the blizzard's lean, by 0.2 to 1.1 m (falls of 6.3 to 7.8 m).
const STREAM_CLEAR = 4.5;
function* driftCurtainSteps(reach, line) {
  const pos = [], rib4 = [], idx = [], NU = 16, NV = 6, nV = (NU + 1) * (NV + 1), nL = line.length / 3, clear = [];
  const B = new Float32Array(nV * 3), fr = (x) => x - Math.floor(x);
  // one streamer's strip: c = which, zc = its seat on the rim, drop = how far it falls (its tail hangs 1.2 + drop below the lip)
  const body = (c, zc, drop) => {
    const rim = rimLevel(zc), back = 0.55 + 0.15 * Math.sin(c * 3.1);
    // the band's centreline in the plane of the wind: over the cornice to its lip (u 0.2), then straight down, drawn a
    // little back under the overhang. (Blown out into the slot as it fell, it lay exactly along the wall's skyline for an
    // eye on the river, and was lost against the sky: it must hang BELOW that line, on the wall.)
    const cx = (u) => { const w = Math.max(u - 0.2, 0) / 0.8; return u < 0.2 ? -7.9 + 3.4 * (u / 0.2) : -4.5 - back * w; };
    const cy = (u) => { const w = Math.max(u - 0.2, 0) / 0.8; return u < 0.2 ? rim + 1.75 - 0.55 * (u / 0.2) ** 2 : rim + 1.2 - 0.9 * w - (drop + 0.3) * w * w; };
    for (let j = 0, q = 0; j <= NV; j++) for (let i = 0; i <= NU; i++, q += 3) {
      const u = i / NU, t = j / NV, dx = cx(u + 0.02) - cx(u - 0.02), dy = cy(u + 0.02) - cy(u - 0.02), dl = Math.hypot(dx, dy) || 1, wd = (0.9 + 1.9 * u) * (t - 0.5);
      // (its width lies across its own flow: level over the cornice, sideways once it falls)
      B[q] = cx(u) + (-dy / dl) * wd; B[q + 1] = cy(u) + (dx / dl) * wd; B[q + 2] = zc - 1.2 * u * Math.sin(c * 1.7 + 0.5) + 0.4 * Math.sin(t * 3 + c);
    }
  };
  // how near that strip comes to the centreline: its vertices (every one along it, every second one across), in the
  // poses of the wind (k: how hard the blizzard blows, at every eighth; a: its swing, at every quarter from end to end;
  // sw: the sway, up, level and down), against every metre-long stretch of the line that passes within 22 m of the seat
  // (further than a blown streamer and the clearance reach together). Between those poses a body can come up to
  // STREAM_GRAIN nearer than any of them. Returns the nearest in any wind; calm.d holds the nearest with no blizzard.
  const STREAM_GRAIN = 0.05, need = STREAM_CLEAR + STREAM_GRAIN, seg = [], calm = { d: 0 };
  const nearest = function* (c, zc, drop) {      // (a step for every four stations along the strip: none is long)
    body(c, zc, drop);
    const sd = Math.fround(0.13 + c * 0.171), lean = SW_LEAN + SW_LEAN2 * fr(sd * 7.3), sAl = SW_ALONG * Math.sin(sd * 23 + 1), sLi = SW_LIFT * (1 + Math.sin(sd * 31)), rim = rimLevel(zc);
    seg.length = 0;
    for (let j = 0; j < nL - 1; j++) { const ex = line[j * 3] + 4.5, ey = line[j * 3 + 1] - rim, ez = line[j * 3 + 2] - zc; if (ex * ex + ey * ey + ez * ez < 484) seg.push(j * 3); }
    let best = 1e12, best0 = 1e12;
    for (let j = 0; j <= NV; j += 2) for (let i = 0; i <= NU; i++) {
      const q = (j * (NU + 1) + i) * 3, u = i / NU, uw = Math.max(u - 0.2, 0) / 0.8, lx = lean * Math.pow(uw, 1.4), swg = SW_SWING * uw, ly = sLi * uw * uw, lz = sAl * uw * uw;
      for (let kk = 0, nk = uw > 0 ? 8 : 0; kk <= nk; kk++) for (let a = kk > 0 ? -2 : 2; a <= 2; a++) for (let sw = -1; sw <= 1; sw++) {
        const k = kk / 8, x = B[q] + k * (lx + swg * a * 0.5), y = B[q + 1] + k * ly + sw * SW_SWAY * u, z = B[q + 2] + k * lz;
        for (let n = 0; n < seg.length; n++) {
          const m = seg[n], ax = line[m], ay = line[m + 1], az = line[m + 2], bx = line[m + 3] - ax, by = line[m + 4] - ay, bz = line[m + 5] - az;
          const px = x - ax, py = y - ay, pz = z - az, bb = bx * bx + by * by + bz * bz, h = bb > 0 ? clamp((px * bx + py * by + pz * bz) / bb, 0, 1) : 0;
          const ex = px - bx * h, ey = py - by * h, ez = pz - bz * h, d = ex * ex + ey * ey + ez * ez;
          if (d < best) best = d;
          if (kk === 0 && d < best0) best0 = d;
        }
      }
      if (i % 4 === 3) yield;
    }
    calm.d = Math.sqrt(best0);
    return Math.sqrt(best);
  };
  for (let c = 0; c < 9; c++) {
    // its seat and its fall by its own measure
    const zc = Math.min(reach - 4, 7 + c * 11.3 + 2.2 * Math.sin(c * 2.4));
    let drop = 5.9 + 1.2 * Math.sin(c * 1.9 + 1) + 0.5 * Math.sin(c * 4.3);
    let d = yield* nearest(c, zc, drop);
    if (d < need) {
      // some pose of the wind brings it too near: the longest fall that clears, to a 256th of its own measure (0.02 to 0.03 m)
      let lo = 0, hi = drop, dl = -1, cl = 0;
      for (let it = 0; it < 8; it++) { const mid = (lo + hi) / 2, dm = yield* nearest(c, zc, mid); if (dm >= need) { lo = mid; dl = dm; cl = calm.d; } else hi = mid; }
      drop = lo;
      if (dl < 0) dl = yield* nearest(c, zc, 0); else calm.d = cl;
      d = dl;
    }
    body(c, zc, drop); clear.push({ z: zc, fall: 1.2 + drop, near: d, calm: calm.d });
    const base = pos.length / 3, sd = 0.13 + c * 0.171;
    for (let j = 0, q = 0; j <= NV; j++) for (let i = 0; i <= NU; i++, q += 3) {
      const u = i / NU, t = j / NV;
      pos.push(B[q], B[q + 1], B[q + 2]);
      rib4.push(u, -(1000 + c * 40 + t * 9), sd, Math.pow(Math.sin(Math.PI * t), 0.6));
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, b = a + 1, d2 = a + NU + 1, e = d2 + 1; idx.push(a, d2, b, b, d2, e); }
    yield;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRib', new THREE.Float32BufferAttribute(rib4, 4));
  g.setIndex(idx);
  g.userData.streamers = clear;      // (each one's seat z, its fall below the lip and how near it comes to the line in any wind and in the calm, in metres)
  return g;
}
// the centreline of a route given as points: one point at every metre along the straight legs between them
function lineAtEveryMetre(pts) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(a.distanceTo(b)));
    for (let k = 0; k < n; k++) out.push(lerp(a.x, b.x, k / n), lerp(a.y, b.y, k / n), lerp(a.z, b.z, k / n));
  }
  const e = pts[pts.length - 1]; out.push(e.x, e.y, e.z);
  return new Float32Array(out);
}

// ---------------------------------------------------------------- small solids: icicles and river ice
function buildIcicleGeometry(rng) {
  const sides = 5, ts = [0, 0.1, 0.3, 0.55, 0.8, 0.95, 1], pos = [], surf = [], ice = [], idx = [];
  for (let j = 0; j < ts.length; j++) {
    const t = ts[j], r = Math.pow(1 - t, 0.75) * (1 + 0.22 * Math.sin(t * 9 + 1)) + 0.05;
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      pos.push(Math.cos(a) * r + 0.12 * Math.sin(t * 5), -t, Math.sin(a) * r);
      surf.push(i / sides * 0.6, t * 1.4); ice.push(0.75 + 0.25 * t, 0, 0);
    }
  }
  for (let j = 0; j < ts.length - 1; j++) for (let i = 0; i < sides; i++) {
    const a = j * (sides + 1) + i, b = a + 1, c = a + sides + 1, d = c + 1; idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSurf', new THREE.Float32BufferAttribute(surf, 2));
  g.setAttribute('aIce', new THREE.Float32BufferAttribute(ice, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function buildBlockGeometry(nz, count, rng, laneHalf) {
  const ico = new THREE.IcosahedronGeometry(1, 2); ico.deleteAttribute('uv'); ico.deleteAttribute('normal');
  const base = mergeVertices(ico, 1e-4), p = base.attributes.position, n = p.count; ico.dispose();
  const g = new THREE.InstancedBufferGeometry();
  const pos = new Float32Array(n * 3), surf = new Float32Array(n * 2), ice = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = 0.8 + 0.3 * nz.n3(x * 1.1 + 3, y * 1.1, z * 1.1) + 0.12 * nz.n3(x * 2.6, y * 2.6 + 7, z * 2.6) - 0.1 * Math.abs(nz.n3(x * 1.9 + 11, y * 1.9, z * 1.9));
    x *= d * 1.15; y *= d * 0.7; z *= d;
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    surf[i * 2] = Math.atan2(x, z) * 0.6 + y; surf[i * 2 + 1] = y; ice[i * 3] = 0.55; ice[i * 3 + 1] = 0; ice[i * 3 + 2] = 2.6;
  }
  g.setIndex(base.index.clone()); base.dispose();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSurf', new THREE.BufferAttribute(surf, 2));
  g.setAttribute('aIce', new THREE.BufferAttribute(ice, 3));
  g.computeVertexNormals();
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const raft = rng() < 0.4;
    seed[i * 4] = (i + rng() * 0.8) / count; seed[i * 4 + 1] = rng.sign() * rng.range(2.3, laneHalf);   // the mid-stream lane stays clear for the camera
    seed[i * 4 + 2] = raft ? rng.range(0.56, 1) : rng.range(0, 0.54); seed[i * 4 + 3] = raft ? rng.range(0.7, 1.25) : rng.range(0.35, 1.25);
    // nothing rides closer than 1.6 m to the camera's line: the bigger the piece, the further out its lane
    const lane = seed[i * 4 + 1], reachR = seed[i * 4 + 3] * (raft ? 1.7 : 1.2);
    if (raft) seed[i * 4 + 3] *= 0.78;                              // slush rafts 1-3 m across
    seed[i * 4 + 1] = Math.sign(lane) * Math.min(Math.max(Math.abs(lane), 2.3 + reachR * (raft ? 0.78 : 1)), laneHalf + 0.6);
  }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = count;
  return g;
}

// a small deterministic sequence from a number: used where a new piece needs a seed without drawing from ctx.rng
// (the order of the hero's rng draws is part of its look and must not change)
function makeNoiseRng(seed) { let t = Math.floor(seed * 1e4) + 17; return () => { t = (t * 16807) % 2147483647; return (t & 0xffff) / 65536; }; }

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const nz = ctx.noise || makeNoise(ctx.seed ?? 1);
  const palHex = opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const C = (h) => new THREE.Color(h);
  const pal = { electric: C(palHex[0]), cobalt: C(palHex[1]), turq: C(palHex[2]), snow: C(palHex[3]), cryo: C(palHex[4]), gold: C(palHex[5]), orange: C(palHex[6]) };
  const reach = opts.reach ?? 113;
  // ---- per-seed variety
  const season = opts.season || rng.pick(['early', 'peak', 'peak', 'late']);
  const S = {
    rng, mouthX: rng.range(0.93, 1.08), mouthZ: rng.range(0.92, 1.08), spiral: rng.sign(),
    lean: rng.range(0.7, 1.25), plumeH: rng.range(84, 98), bandSeed: rng.range(0, 60),
    dipA: rng.range(-0.9, 0.9), cornice: season === 'early' ? 1.5 : season === 'late' ? 0.6 : 1,
    // the conduit's depth: where the eye comes level at 34.5 s of the 40 (the world's own route, or the brief's)
    cd: clamp(opts.conduitDepth ?? BRIEF_CONDUIT_D, 120, 225),
  };
  const shape = makeShape(S);
  // the hero's own fly-through (anchors.flyThrough; also the line its streamers keep clear of when no route is given)
  const flyThrough = [[0, waterLevel(reach) + 0.9, reach], [0, waterLevel(60) + 0.9, 60], [0, waterLevel(20) + 0.9, 20], [0, -10.9, 4], [0, -12.4, -7], [0, -19, -17.5],
    [0, -31, axisZ(31) - 0.4], ...[46, 100, 180, PORTAL_D].map((D) => [0, -D, axisZ(D)])].map((q) => new THREE.Vector3(q[0], q[1], q[2]));
  const zFar = AXIS_Z0 - 25 * S.mouthZ, zNear = 1.2;
  S.mouthCz = (zFar + zNear) / 2;
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.80, 0.41, 0.44)).normalize();
  const axisDir = new THREE.Vector3(0, -COSL, -SINL);
  const portalPos = new THREE.Vector3(0, -PORTAL_D, axisZ(PORTAL_D));
  const U = {
    uTime: { value: 0 }, uSun: { value: sunDir }, uSunCol: { value: C(opts.sunColor || '#FFE6C2').multiplyScalar(1.15) },
    uSkyCol: { value: C(opts.skyColor || '#3F7FCF').multiplyScalar(0.8) },
    uSnow: { value: pal.snow }, uTurq: { value: pal.turq }, uCobalt: { value: pal.cobalt }, uElectric: { value: pal.electric },
    uCryo: { value: pal.cryo }, uGold: { value: pal.gold }, uMauve: { value: C('#8E86A0') }, uInk: { value: C(opts.inkColor || '#030B22') },
    uPortalPos: { value: portalPos }, uPortalCol: { value: C(opts.portalColor || '#A8F0FF') }, uPortalI: { value: 3.4 },
    uSeason: { value: season === 'early' ? 0.4 : season === 'late' ? 0.95 : 0.62 }, uLate: { value: season === 'late' ? 1 : 0 },
    uBandSeed: { value: S.bandSeed }, uDip: { value: new THREE.Vector2(Math.sin(S.dipA), Math.cos(S.dipA)).multiplyScalar(0.176) },
    uMouth: { value: new THREE.Vector4(S.mouthCz, reach + 0.5, 19 * S.mouthX, (zNear - zFar) / 2) },
    uShaftFog: { value: 0.0058 }, uCamDepth: { value: 0 }, uLitY: { value: 1e5 }, uCd: { value: new THREE.Vector2(S.cd, shape.Rx(S.cd)) },
    uPlumeH: { value: S.plumeH }, uLean: { value: S.lean }, uPx: { value: 0.003 }, uDrift: { value: season === 'early' ? 1.25 : 1 },
    // looks a world may set per mood: uWarm (0..1: how gilded the key is: gold crests, cream lit walls, gold crescent and
    // spindrift), uFoamTint / uPlumeTint (white by day, dim blue-green at twilight), uDriftH (extra spindrift height, m)
    uWarm: { value: 1 }, uFoamTint: { value: C('#ffffff') }, uPlumeTint: { value: C('#ffffff') }, uPlumeShade: { value: C('#ffffff') }, uPlumeSide: { value: 0 }, uPlumeKnee: { value: 0.3 }, uDriftH: { value: 0 },
    uReach: { value: reach }, uHump: { value: HUMP }, uUpGlow: { value: 0 },
    // foam aprons under the world's tributary falls (strength 0: none)
    uPools: { value: [new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0), new THREE.Vector4(0, 0, 1, 0)] },
    uPoolDir: { value: [new THREE.Vector2(0, -1), new THREE.Vector2(0, -1), new THREE.Vector2(0, -1)] },
  };
  const Y = ctx.yield ? () => ctx.yield() : null;
  const object = new THREE.Group(); object.name = 'sapphire-moulin-hero';

  // ---- canyon walls
  const stations = [];
  for (let z = reach; z > -0.01; z -= 0.6) stations.push({ x: 0, z: Math.max(z, 0), tx: 0, tz: -1, water: waterLevel(z), rim: rimLevel(z), half: 7 });
  const clip = (v) => { const D = -v.y, hz = shape.fwZ(Math.max(D, 0)) + rimExtra(D) - 0.05; if (v.z < hz) v.z = hz; };
  const wallMat = makeIceMaterial(U, 'wall');
  const wallGeo = [];
  for (const side of [1, -1]) {
    const g = await buildCanyonWallAsync({ stations, side, noise: nz, sunDir, fadeEnd: 9, clip, cornice: S.cornice }, Y);
    const m = new THREE.Mesh(g, wallMat); m.name = side > 0 ? 'wall-right' : 'wall-left'; object.add(m); wallGeo.push(g);
    await ctx.yield?.();
  }
  // ---- the moulin
  const shaftGeo = await runStepsAsync(shaftSteps(shape, S, nz, detail), Y);
  const shaft = new THREE.Mesh(shaftGeo, makeIceMaterial(U, 'shaft')); shaft.name = 'shaft'; shaft.frustumCulled = false; object.add(shaft);
  await ctx.yield?.();
  const cap = new THREE.Mesh(new THREE.CircleGeometry(16, 24), new THREE.MeshBasicMaterial({ color: U.uInk.value, fog: false }));
  cap.position.set(0, -SHAFT_D + 0.5, axisZ(SHAFT_D)); cap.rotation.x = -Math.PI / 2; object.add(cap);
  // ---- ice-sheet apron
  if (opts.apron !== false) {
    const apron = new THREE.Mesh(buildApron(S, 260, nz), makeIceMaterial(U, 'apron')); apron.name = 'apron'; object.add(apron);
    await ctx.yield?.();
  }
  // ---- water
  const waterGeo = await runStepsAsync(waterSteps(shape, reach), Y);
  await ctx.yield?.();
  const water = new THREE.Mesh(waterGeo, new THREE.ShaderMaterial({
    fog: true, uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U),
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
  }));
  water.name = 'water'; water.frustumCulled = false; object.add(water);
  await ctx.yield?.();
  {
    // the water going over the conduit's lip
    const cf = new THREE.Mesh(buildConduitFall(shape), new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U), vertexShader: CREST_VERT, fragmentShader: CREST_FRAG,
    }));
    cf.renderOrder = 3.6; cf.frustumCulled = false; cf.name = 'conduit-fall'; object.add(cf);
  }
  await ctx.yield?.();
  // ---- icicles under both overhangs and round the far rim of the mouth
  {
    const np = profile.length, lipJ = 13, list = [];
    for (let w = 0; w < 2; w++) {
      const p = wallGeo[w].attributes.position, side = w === 0 ? 1 : -1;
      const cIn = -side * sunDir.x;                              // right wall (side +1) faces -X
      for (let i = 2; i < stations.length - 6; i++) {
        const a = i * 0.6 * side + w * 300;
        if (nz.n2(a * 0.09, 12) < -0.15 || rng() > 0.62 * detail) continue;
        const q = i * np + lipJ, len = Math.min(2.4, 0.35 + Math.abs(rng.gauss()) * 0.75) * (0.7 + 0.5 * Math.max(0, nz.n2(a * 0.05, 30)));
        list.push([p.getX(q) + side * rng.range(0.02, 0.3), p.getY(q) + 0.12, p.getZ(q) + rng.range(-0.25, 0.25), len, cIn > 0 ? 1 : 0]);
      }
    }
    const sp = shaftGeo.attributes.position, nu = N_FLUTE * SEG_PER_FLUTE, ring = 6;
    for (let i = 0; i < nu; i++) {
      const q = ring * (nu + 1) + i, x = sp.getX(q), z = sp.getZ(q);
      if (z > -6 || rng() > 0.8 * detail) continue;
      for (let k = 0; k < 2; k++) list.push([x + rng.range(-0.3, 0.3), sp.getY(q) + 0.5, z + rng.range(-0.3, 0.3), 0.5 + Math.abs(rng.gauss()) * 0.9, z < S.mouthCz ? 1 : 0]);
    }
    await ctx.yield?.();
    const ig = buildIcicleGeometry(rng);
    const im = new THREE.InstancedMesh(ig, makeIceMaterial(U, 'icicle'), list.length);
    const inst = new Float32Array(list.length * 2), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
    list.forEach((L, i) => {
      const rad = 0.05 + 0.065 * L[3];
      E.set(rng.range(-0.07, 0.07), rng.range(0, 6.28), rng.range(-0.07, 0.07)); Q.setFromEuler(E);
      M.compose(V.set(L[0], L[1], L[2]), Q, Sc.set(rad, L[3], rad)); im.setMatrixAt(i, M);
      inst[i * 2] = L[4]; inst[i * 2 + 1] = rng();
    });
    ig.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 2));
    im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'icicles'; object.add(im);
  }
  await ctx.yield?.();
  // ---- slush rafts and blocks riding the river and going over
  const fallLen = (S.cd - 18 - ARC_D) / COSL;      // (the river's ice is gone from the sheet 20 m above the conduit's lip)
  if (opts.rafts !== false) {
    const count = Math.round((season === 'early' ? 60 : 44) * detail);
    const blocks = new THREE.Mesh(buildBlockGeometry(nz, count, rng, 5.6), makeIceMaterial(U, 'block', { uniforms: { uFlow: { value: new THREE.Vector4(reach, V_RIVER, ARC_LEN, fallLen) } } }));
    blocks.frustumCulled = false; blocks.name = 'river-ice'; object.add(blocks);
  }
  await ctx.yield?.();
  // ---- spindrift, plume, mist, drops
  if (opts.spindrift !== false) {
    const drift = new THREE.Mesh(buildSpindrift(S, reach, shape, rng), new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
      uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, { uVeil: { value: 2.4 } }), vertexShader: DRIFT_VERT, fragmentShader: DRIFT_FRAG,
    }));
    drift.renderOrder = 3; drift.frustumCulled = false; drift.name = 'spindrift'; object.add(drift);
    await ctx.yield?.();
    // (the streamers keep 4.5 m from the route's centreline: the world's own route, or the hero's fly-through)
    const curtains = new THREE.Mesh(await runStepsAsync(driftCurtainSteps(reach, opts.route || lineAtEveryMetre(flyThrough)), Y), drift.material);
    curtains.renderOrder = 7; curtains.frustumCulled = false; curtains.name = 'spindrift-curtains'; object.add(curtains);
  }
  await ctx.yield?.();
  {
    // three chains of falls, a third of the way round the shaft from one another (far wall and both side walls: they
    // never fan from one sector of the view), each carried away from the footwall by the flutes' spiral
    // [bearing 30 m down (0 = +X, 90 = the footwall), depth at which it has run out]. The footwall and its sheet fill 34..146
    // degrees: the third chain starts beside the sheet's edge and is gone before the spiral carries it onto the sheet.
    const tg = buildThreads(shaftGeo, S.spiral > 0 ? [[262, 250], [160, 250], [5, 112]] : [[278, 250], [20, 250], [175, 112]], makeNoiseRng(S.bandSeed), S.fluteTh0, nz);
    const threads = new THREE.Mesh(tg, new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,      // the strip never fights the flutes it lies on for depth (it was a patch of stipple)
      uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U), vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG,
    }));
    threads.renderOrder = 3.5; threads.frustumCulled = false; threads.name = 'shaft-threads'; object.add(threads);
  }
  await ctx.yield?.();
  {
    // THE SLANT OF SUNLIGHT in the mouth: one ribbon turned to the lens, laid along the sun's own ray. It enters over the
    // sunward edge of the mouth and runs to the wall across from it, as deep as the sun's height and the mouth's width
    // give (about 18 m at 24 degrees: the gold crescent on the far wall's top is where it lands), at one strength for
    // every eye; no ray enters when the sun is on the horizon.
    const nb = 28, bp = new Float32Array((nb + 1) * 2 * 3), ba = new Float32Array((nb + 1) * 2 * 2), bi = [];
    for (let i = 0; i <= nb; i++) for (let k = 0; k < 2; k++) { ba[(i * 2 + k) * 2] = i / nb; ba[(i * 2 + k) * 2 + 1] = k * 2 - 1; }
    for (let i = 0; i < nb; i++) { const a = i * 2; bi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('aB', new THREE.BufferAttribute(ba, 2)); bg.setIndex(bi);
    const sunH = Math.hypot(sunDir.x, sunDir.z) || 1e-3, bhx = sunDir.x / sunH, bhz = sunDir.z / sunH;
    const mouthR = 1 / Math.hypot(bhx / (19 * S.mouthX), bhz / ((zNear - zFar) / 2));      // the mouth's radius along the sun's bearing
    const beam0 = new THREE.Vector3(bhx * mouthR, 0, S.mouthCz + bhz * mouthR), beam1 = beam0.clone().addScaledVector(sunDir, -2 * mouthR / sunH);
    U.uBeamA = { value: 0.4 * smoothstep(0.03, 0.12, sunDir.y) };
    const beam = new THREE.Mesh(bg, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      uniforms: { uTime: U.uTime, uWarm: U.uWarm, uGold: U.uGold, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uSnow: U.uSnow, uBeamA: U.uBeamA,
        uB0: { value: beam0 }, uB1: { value: beam1 } },
      vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG,
    }));
    beam.renderOrder = 4; beam.frustumCulled = false; beam.name = 'shaft-beam'; object.add(beam);
    const cmist = makeSprites(U, 3, Math.round(26 * (0.5 + 0.5 * detail)), makeNoiseRng(S.bandSeed + 3.3)); cmist.renderOrder = 4; cmist.name = 'conduit-mist'; object.add(cmist);
  }
  await ctx.yield?.();
  const mist = makeSprites(U, 1, Math.round(30 * detail), rng); mist.renderOrder = 4; mist.name = 'mist'; object.add(mist);
  await ctx.yield?.();
  const drops = makeSprites(U, 2, Math.round(320 * detail), rng); drops.renderOrder = 5; drops.name = 'drops'; object.add(drops);
  await ctx.yield?.();
  if (opts.plume !== false) {
    const plume = makeSprites(U, 0, Math.round(260 * (0.5 + 0.5 * detail)), rng, { puffs: PLUME_NB * Math.round(50 * (0.5 + 0.5 * detail)) }); plume.renderOrder = 6; plume.name = 'plume'; object.add(plume);
  }
  await ctx.yield?.();

  // ---- anchors
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const ax = (D) => V3(0, -D, axisZ(D));
  const anchors = {
    lip: V3(0, -LIP_D, 0),
    portalSeat: { position: portalPos.clone(), normal: axisDir.clone().negate(), up: V3(0, SINL, -COSL), radius: 7 },
    axisTop: ax(0), axisDir: axisDir.clone(),
    flyThrough,
    viewpoints: { canyonStart: V3(0, waterLevel(reach) + 0.9, reach), brink: V3(0, -10.6, 14), shaftAqua: ax(40), shaftCobalt: ax(95), portalApproach: ax(205), plumeFar: V3(60, 14, 420) },
    plumeBase: V3(0, 0, S.mouthCz), plumeTop: V3(S.lean * 22, S.plumeH, S.mouthCz - 6),
    conduit: V3(POCKET_X, -(S.cd - 4), shape.nearZ(POCKET_X, S.cd - 10)), farWallCrescent: V3(0, -9, zFar + 3),
    mouth: { center: V3(0, 0, S.mouthCz), halfX: 19 * S.mouthX, halfZ: (zNear - zFar) / 2 },
  };
  let forcedDepth = null;
  const tmp = new THREE.Vector3(), size = new THREE.Vector2();
  const hero = {
    object, radius: 150, height: 100, center: V3(0, 10, 10), anchors, ground: false, groundY: 0,
    uniforms: U, season, conduitDepth: S.cd,
    kit: {
      makeIceMaterial: (variant, o) => makeIceMaterial(U, variant, o), buildCanyonWall, buildCanyonWallAsync, profile, waterLevel, rimLevel, shaftPoint: (theta, D) => shape.point(theta, D, 0, 0, {}), pal, axisZ,
      // surfaceY(z): the water surface on the centreline from 40 m above the brink, over it and 40 m down the sheet
      surfaceY: makeSurfaceY(HUMP), lean: LEAN,
      // the river's own shader for the world's meanders: geometry needs position, normal and aFlow = (u -1..1, s metres
      // along the flow with s = 0 at the head of the straight reach, 0, s / 16)
      makeWaterMaterial: () => new THREE.ShaderMaterial({ fog: true, uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U), vertexShader: WATER_VERT, fragmentShader: WATER_FRAG }),
      // spindrift ribbons: geometry needs position and aRib = (u along the wind 0..1, v metres along the rim, seed)
      makeDriftMaterial: () => new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, side: THREE.DoubleSide,
        uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, { uVeil: { value: 1 } }), vertexShader: DRIFT_VERT, fragmentShader: DRIFT_FRAG }),
      // an icicle fringe: list of [x, y, z, length, sunLit 0..1, or -1 for one under a snow bridge] in hero-local space
      makeIcicles: (list, r = rng) => {
        const ig = buildIcicleGeometry(r), im = new THREE.InstancedMesh(ig, makeIceMaterial(U, 'icicle'), list.length);
        const inst = new Float32Array(list.length * 2), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), Sc = new THREE.Vector3();
        list.forEach((L, i) => {
          const rad = 0.05 + 0.065 * L[3];
          E.set(r.range(-0.07, 0.07), r.range(0, 6.28), r.range(-0.07, 0.07)); Q.setFromEuler(E);
          M.compose(V.set(L[0], L[1], L[2]), Q, Sc.set(rad, L[3], rad)); im.setMatrixAt(i, M);
          inst[i * 2] = L[4]; inst[i * 2 + 1] = r();
        });
        ig.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 2));
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = 'icicles';
        return im;
      },
    },
    setProgress(u) { forcedDepth = u == null ? null : Math.max(0, (u * 880 - 585)) * 0.9; },
    setCameraDepth(d) { forcedDepth = d; },
    update(dt, time, camera) {
      U.uTime.value = time;
      let depth = forcedDepth;
      if (camera) {
        if (depth == null) { camera.getWorldPosition(tmp); object.worldToLocal(tmp); depth = Math.max(0, -tmp.y); }      // world matrix: the camera behind a portal has no position of its own
        ctx.renderer?.getDrawingBufferSize(size);
        const fov = (camera.fov || 60) * DEG;
        U.uPx.value = 2 * Math.tan(fov / 2) / Math.max(size.y || 720, 1);
      }
      U.uCamDepth.value = depth || 0;
    },
    dispose() {},
  };
  return hero;
}
