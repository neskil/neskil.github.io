// THE CITY ON STILTS ABOVE THE CLOUD
// An original place from one city of Italo Calvino's "Invisible Cities". Out of an old broadleaf wood a few slender
// stilts, far apart, rise and are lost in the cloud; above the cloud they hold up a whole sunlit city that touches
// the earth nowhere else, and from its rails brass spyglasses stand pointed down at the leaves.
//
// THE FLIGHT (one line, the same law on every seed; a drawn hand mirrors the whole place east for west)
//   along a sunlit ride to the foot of the ladder leg (the one stilt that stands apart, 270 m south-west of the city, and
//   carries the head of the long gangway to it); once round that leg, climbing under the cloud, the look up and out over
//   the wood (the leg a slim thing by one edge of the picture); on the round's last part the city comes into the look
//   and stays in it: OVERHEAD, on its legs, seen up the cloud's standing gap about the leg and the city; up through that
//   gap's clear air, out of the cloud's top UNDER the gangway (it crosses 20 m over the line) and straight toward the
//   city over the cloud's sea; north along its west rail; a half turn round its north-west corner; up the stair street
//   between the houses and under the footbridge; over the summit square and its market, the look going down and out
//   over the jetty's rail to the cloud's great hole and the land in it, and lifted again before the raft's south rail;
//   straight out over the jetty's walk, over the hole, to the brass ring on its end.
//
// WHAT IS DRIVEN BY WHAT (kept true; see also the head of src/parts/city-on-stilts-above-the-cloud.js)
//   BY THE WORLD'S CLOCK, each from a phase of its own stream, the same at every metre of the flight:
//     the wind in the leaves and the grass (kit), the leaves' dapple, the slow cloud shadows on the wood and the play of
//     the kites' and mills' shadows in the holes of the city's pierced shadow (the place's light, shader laws in world
//     space), the stream's run and the glints of its far line, deer, butterflies, the thrushes over the ride, the
//     swifts and the storks round the legs and over the great hole, the storks' small sway on their nests, the bucket on
//     its rope, the lanterns, the cloud's own drift (kit; its gaps stand), the shafts of sun, windmill sails, kites and
//     their strings, washing, the hanging gardens, the spyglasses' slow sweep, the standing people's shift of weight, the
//     walkers' round of the stair street (up one file, down the other), the pigeons' round, kitchen smoke.
//   BY THE HOUR (ctx.vary.hour or the seed's own draw; it stands for the whole visit):
//     sun or moon and its tint, sky, fog colour, exposure, the strength of sun and fill, lit windows and lanterns (by day
//     a lamp in one window in five of a front turned from the sun), fireflies, the dawn's ground mist, the colour of the
//     cloud's body, of the far air under it and of the light its floor throws up under the raft.
//   BY THE RARE (ctx.vary.rare; it stands for the whole visit): the same sea of cloud, more broken: its six dealt gaps of
//     blue stand half as wide again, more heaps boil up out of it and more great heaps stand on it far out.
//   BY THE METRES FLOWN (u), and nothing else of the world: the pace and five pulls of the look.
//     THE PACE is set by the line's own bend (nowhere faster than lets the heading turn at 0.47 radians, 26.9 degrees,
//     a second) and by speeds that stand AT places of the line. EVERY KEY LIES BETWEEN 0.4 AND 2.5 OF THE MEAN (the mean
//     is the line's 993 m over 49.5 s, 20.1 m/s: so between 8.0 and 50.2 m/s) and there is no other cap. The keys, typed:
//     20 m/s on the ride, 22 where the round begins, 29 at the cloud's top, 31 under the gangway (the one free key:
//     scaled, with nothing else, so that my own reckoning of the engine's easing lasts 49.5 s), 29 where the climb comes
//     to the rail's height, 21 beside the west rail, 17 round the corner, 19 at the stair street's foot, 14 at the fifth
//     terrace's edge, 10.3 over the summit and the jetty as far as the last ledge, 42 at the ring. The engine reads the
//     pace at 65 places, keeps it between 0.35 and 2.5 of the mean and scales it to the flight's 49.5 s; with the lag of
//     its easing the flight lasts 49.65 s as flown.
//     THE PULLS are five, every one of weight 1, each a window between two places of the line, each coming and going
//     over a stretch that is itself the way between two places (no typed share of a window anywhere). They are laid one
//     over the next: where a later pull is whole it alone holds the look, so a hand-over is one turn from one look to
//     the next and the line's own heading never shows between them. (1) THE CLIMB: 57 degrees to the leg's side of the
//     line's level heading and 6 up, growing from nothing at the first metre to whole where the round begins, let go
//     through the cloud's depth; (2) THE CITY, from where on the round it stands at the climb's own look, to the west
//     rail; (3) THE WEST RAIL AND THE CORNER: 62 degrees toward the town and 3 under the level, by the rail's own line,
//     from under the gangway to the summit; (4) THE STAIR STREET: 12 degrees up along the street; (5) THE JETTY: 39
//     degrees to the hole's side and 32 down, going down from the summit's north edge, at its lowest at the foot of
//     the jetty's own steps (where the walk and its rail come to their full depth under the line), lifted over the south
//     terraces' ledges, gone 63 m before the ring: at the line's first sampled metre past the raft's south rail, which
//     the line crosses 64 m before the ring. The camera never rolls (no bank, no sway).
//     TYPED AND DECLARED, each a number of mine: the keys above; the pulls' angles; the look point of a pull 200 m off
//     (far enough that the angle is the same from every metre near by); the eases of the climb's and the jetty's shares
//     (a first and a last quarter); the camera's lens (64 degrees) and its look-ahead of 24 m along the line; 49.5 s.
//   THE LINE'S OWN POINTS, named as such (they are places of the LINE, found on it at build; no rule of a THING reads
//     one): rideEnd (where the ride's straight ends, 60 m before the entry's z), helix and out (where the round about
//     the leg is entered and left: within R + 1.5 m and beyond R + 2.5 m of the leg), abeam and cross (where the city's
//     middle comes square abeam, and where it stands at the climb's look), cloudIn and cloudOut (the eye at the body's
//     foot and 12 m over its tops), gang (under the gangway), level (the line's own cruising height beside the west
//     rail, 7 m over the lowest deck), rail and turn (the line beside the west rail: its first metre there and where its
//     half turn begins), northRail, street (the stair street's foot), terrace, summit, last, jetty, steps, low and
//     southRail (the edges of the fifth terrace, the summit square, the jetty's head and the foot of its steps, the
//     second terrace and the raft's south rail as the line passes over them).
//   BY THE VISITOR'S PLACE OR NEARNESS: nothing is switched, moved, grown, faded or lit as we come. The cloud lies by
//     height and by place (its gaps are places of the world); the city's light and shadow are laws of world position;
//     every plant dealt stands whole from anywhere (the kit's fade and cull by the eye's distance are not asked for).
//     Three things are seen THROUGH air, as in every world, and so depend on where they are seen from without anything
//     of the place changing: the scene's fog and the far country's air (by distance); THE CLOUD'S BODY (a standing slab
//     between two heights, open at its gaps: a thing, and a heap of the cloud itself, is lost by the length of the sight
//     line that lies inside the slab, the same law for any eye anywhere); the strings and ropes, ribbons of the cord's own
//     width that keep their flat to the eye. A HEAP OF THE CLOUD IS KEPT OFF THE LENS BY PLACE AND BY NOTHING ELSE OF
//     MINE: the kit shrinks a heap to the room left outside the plan's cuts (the city's cone and the gaps' shafts, see
//     below), and wherever the line is within the heaps' own heights it lies inside a cut (counted; said in the report);
//     there the cloud about the line is its body's haze, a medium by height and place.
//     THE KIT'S CLOUD SEA DOES GO BY THE EYE, by the kit's own laws, as in every world that uses it (they are not mine
//     and stay): (a) a heap thins within 0.35 to 1.5 of its own size of any eye; (b) the sea's near heaps are one tile
//     of 2,000 m wrapped about the eye, thinned from 720 m to 980 m from it along either axis (the tile's edge), and
//     they go out between 560 m and 940 m of the eye; (c) the far ring's heaps are a tile of 5,600 m wrapped likewise
//     (thinned from 2,016 m to 2,744 m), come in between 403 m and 902 m of the eye and go out between 1,848 m and
//     2,688 m; (d) the great heaps far out go out between 4,160 m and 5,460 m; (e) a heap of the sea takes the horizon's
//     colour by its distance from the eye, from 560 m to 2,808 m; (f) a heap takes the scene's fog and is thinned by
//     it: its alpha is cut by three quarters of the fog's share at its depth from the eye (the kit's sky code; the
//     share at d metres is 1 - exp(-(k d)^2), k the hour's fog set below: by day a half at 2,081 m). So of the cloud
//     it is my own body, its gaps and its face that stand by place; the kit's heaps on it are a dressing that the kit
//     lays about the eye.
//     THE CLOUD FACE'S MARKINGS (the underside's billows, the top's lit heaps and hollows) go into their own mean where
//     the picture's grain, or the sight line's own way through the body's soft depth, is longer than they are, and for
//     no other reason. THE GRAIN: one picture element covers a strip of the face, long along the look where the look is
//     low; its longer axis is taken. THE WAY: the body has no skin (its top thins over 9 m, its foot thickens over
//     12 m), so the face's colour is not met at one place but gathered along the sight line, from where the line comes
//     into the body to where its haze from there on is whole but for one part in e (the body thickens the air by 0.2 a
//     metre of the line in it), and a marking shorter than that way is seen through its neighbours. The way is worked
//     from those measures of the body and from the angle at which the line meets the level face, and no number is set
//     for it: over the top it is 8 m of the face at 45 degrees, 15 m at 21, 22 m at 10, 34 m at 4.5, 72 m at 1. The
//     billows and heaps are whole where the longer of the two lengths is 14 m or less and gone at 34 m, the broad
//     hollows from 58 m to 142 m (so by the way alone the top's heaps are whole where the line meets the top steeper
//     than 23 degrees and at their mean under 4.4, the underside's billows steeper than 27 and under 5.1, the hollows
//     steeper than 1.5 and under 0.26). Nothing of them goes by a bearing's threshold, by the line or by a moment of the
//     visit. THE BROAD HOLLOWS are a tone of the level top: the body's make gives them no depth of their own and none
//     is given them; they go by the same two lengths as they lie.
//     Typed measures of the cloud's body: it thickens over its lowest 12 m; a thin skirt of scud hangs 16 m under its
//     foot; its underside pales into the far air's colour, two thirds at 600 m from the eye by day and 420 m by night; a
//     gap's clear air counts whole for a sight line that runs 60 m inside the body's height and for nothing from 300 m
//     (a gap is a well, not a lane). The kit's birds, beasts and kitchen smoke are lost in the body by the same law.
//   THE PLAN FIRST, THE LINE AFTER: the place is laid by its own laws, and the line is then laid through what the plan
//     leaves open. THE RIDE IS A MADE THING: a kept width of 7 m to either side of its axis, and no tree is planted
//     nearer its edge than the tree's own crown reaches with its sway (0.45 to 0.7 of its height and 1.2 m), the same
//     before and behind the entry and on into the glade's mouth; the glade about the leg's foot (40 m) and the deer's
//     glade likewise; the line climbs out of the wood in the glade's open air. A SHAFT OF SUN in the wood is dealt at the
//     ride's edge, the glade's rim or in the wood behind the rim: on the side the sun gives its FOOT stands at that place,
//     on the far side its HOLE is there and it falls away from the open place; its whole body lies under the wood's roof,
//     in its shade, never across the ride or a glade (the plan's own test). BUTTERFLIES have their homes at the
//     ride's two edges (5.5 to 12 m off its axis) and in the glade's rim; FIREFLIES at the edges and under the trees
//     behind them (8.5 to 30 m) and about the glade's rim; the dawn's MIST lies off the made ground. KITES fly from the
//     jetty's lee rail only (and from the terraces' own posts), a rope of washing across the stair street hangs house to
//     house over the lower half of its flight. The people stand by standing laws (watchers at a rail look out and down
//     by that rail's own outward side, on every side alike; walkers go the stair street's two files; terrace folk face
//     the thing they are at); the spyglasses are aimed at the earth through the cloud's standing gaps. THE CLOUD'S CUTS
//     are the city's cone (174 m in radius 90 m over the lowest deck, 32 m in radius 130 m under it) and an upright
//     shaft of 0.85 of each gap's round, from 150 m under the cloud's tops to 80 m over them: the gap about the leg and
//     the city is a row of four rounds (64 m at the leg's well to 92 m at the city), so the ladder leg, the gangway and
//     the way from one to the other all lie in one clear air; there is no cut about the gangway of its own any more.
//     THE LINE'S ONLY SAY comes after: a dealt thing whose body, with its whole reach, comes within 2.5 m of the line
//     (or of the entry's axis continued 365 m behind the entry) is left out AFTER its draws, by a test at build. On
//     seeds 1 to 300 that test leaves out, by kind: see the report (a few a seed at the most; of most kinds none).
//     THE BEAMS OF SUN UNDER THE GAPS: of the 19,500 dealt on seeds 1 to 300 the true clearance leaves out 103, on 43
//     seeds, 4 on a seed at the most: every one of them hangs from the rim of a gap of blue and slants down across
//     the round under the cloud (each one's axis comes nearest the line between the line's 168th and its 308th metre,
//     the axis and the line taken every 0.1 m; its body, the axis less its half width, lies within the clearance's
//     measure of the line somewhere between the 133rd and the 334th). That is the clearance's own doing and nothing
//     else's: no beam is moved, thinned or re-dealt for it.
//     THE KIT'S FLOCKS, five calls: each hands the kit its count, its spread and its wander; the three of the loose
//     form hand maxSigma 3 (live's kit then holds each bell-curve draw within three scatters; this tree's kit of 6 Oct
//     does not know the name and deals as it did); none hands keepClear: each course is laid by the place's own
//     numbers well off the line, and nothing is asked of the kit at the build. THE BOUND of a call, counted on seeds 1
//     to 300: the least distance from the flown line to the course as the kit lays it, less three scatters on each
//     axis (a scatter is 0.45 of the spread; for the two calls of the line form, dealt by plain draws, the form's own
//     bounds instead: half the row's width to every side and 1.1 m in height), less the wander's whole box (one and a
//     half of its first measure across, its second in height, its third along), less the bird's own ball (its length
//     and its span together at the largest size dealt): true on live's kit with maxSigma 3 handed, for any draw.
//     Beside each bound, the reader's count on this tree's kit as dealt, seeds 1 to 100.
//     The thrushes over the ride keep 7.4 m from the line by the bound (as dealt 7.6 m).
//     The swifts round the ladder leg keep 11.7 m by the bound (as dealt 13.1 m).
//     The storks about the ladder leg keep 16.8 m by the bound (as dealt 17.1 m).
//     The storks in the great hole keep 37.4 m by the bound (as dealt 39.9 m).
//     The pigeons over the east terraces keep 14.7 m by the bound (as dealt 17.2 m).
//     Nothing else is placed, turned, aimed, thinned or dealt by the line, the lens, a seed's luck or a clock.
//   THE RIDE IS CARRIED BACK behind the entry as far as the country goes, by place: level ground (the floor's meshes
//     for 385 m, then the ride's own strip of the wood's shell), trees to either side for 365 m, the wood's roof open
//     over it all the way; the stream leaves the ride there and goes off under the wood.
//   EVERY TEXTURE MADE HERE IS FREED in dispose: the plan's picture (planTex), the cloud's picture (cloudPic), the
//     sky's and the terrain's own (by their kits' dispose); the stand-in picture of kitUniforms is freed where the
//     plan's picture replaces it. The kit's makers (flora, fauna, water, fx, sky fields) free their own with the scene.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed, makePath, makeNoise } from '../kit/core.js';
import * as skyKit from '../kit/sky.js';
import * as terrainKit from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as fauna from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as water from '../kit/water.js';
import { stiltsPlan, buildHero, buildStiltsGeo, planRaster, planTexture, kitUniforms, makeKitMaterials, placePatch, hazePuffs, hazeCreatures, hazeVeil, makeHazeSky, DIM, COL } from '../parts/city-on-stilts-above-the-cloud.js';

const TAU = Math.PI * 2;
// the standing hours: sky preset, exposure, fog density, the strength of the sun and of the fill (by day the sun is some three and a half
// times the fill, so that every wall has a lit and a shaded side by value and the city's own shadows lie dark across its stairs,
// terraces and square), how much of the night's lamps are lit,
// the sun's own tint (the day's sun stands low in the north-west and is warm) and how far the sky's fill is cooled
const HOUR = {
  day: { preset: 'day', exposure: 0.96, fog: 0.0004, sun: 2.0, amb: 0.56, night: 0, warm: [1.0, 0.9, 0.72], cool: 0.5 },
  golden: { preset: 'goldenHour', exposure: 1.02, fog: 0.00046, sun: 1.8, amb: 0.62, night: 0.12, warm: [1, 1, 1], cool: 0.3 },
  dawn: { preset: 'dawn', exposure: 1.06, fog: 0.00052, sun: 1.6, amb: 0.72, night: 0.2, warm: [1, 1, 1], cool: 0.2 },
  night: { preset: 'night', exposure: 1.2, fog: 0.00036, sun: 1.5, amb: 1.5, night: 1, warm: [1, 1, 1], cool: 0 },
};

export default {
  id: 'city-on-stilts-above-the-cloud',
  name: 'The City on Stilts Above the Cloud',
  category: 'books',
  placeKind: 'city',
  book: 'Invisible Cities',
  author: 'Italo Calvino, 1923 to 1985',
  media: ['air', 'open'],
  weirdness: 0.7,

  async build(ctx) {
    const seed = ctx.seed, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const tick = ctx.yield ? () => ctx.yield() : async () => {};
    // every stream of the world file, taken here in one list (the plan's own streams are listed at its head)
    const R = {}; for (const k of ['sky', 'cloud', 'heap', 'pic', 'grass', 'fern', 'flower', 'bush', 'reed', 'bird', 'swift', 'stork', 'fly', 'fire', 'rays', 'beam', 'mist', 'land', 'stone']) R[k] = makeRng(hashSeed('stilts-world-' + k + ':' + seed));
    const P = await stiltsPlan(seed, { hour: vary.hour, rare: vary.rare, density: vary.density, detail }, tick);
    const h = P.hand, hourName = P.hour, HR = HOUR[hourName], night = hourName === 'night', D = DIM;
    const scene = new THREE.Scene();
    // the line that is flown: the plan's knots, mirrored by the hand
    const path = makePath(P.knots.map((k) => [k[0] * h, k[1], k[2]]));
    const L = path.length, uM = (m) => clamp(m / L, 0, 1), pl = P.place;
    await tick();
    // ---- the sky of the hour; the sun (the moon at night) stands low in the north-west (for the hand +1): it lights the city's west side,
    // which we come up to out of the cloud, and throws the city's shadow on the wood to the south-east, under the jetty's end
    const sunDir = new THREE.Vector3(Math.sin((P.sunAz * Math.PI) / 180) * h * Math.cos((P.sunEl * Math.PI) / 180), Math.sin((P.sunEl * Math.PI) / 180), -Math.cos((P.sunAz * Math.PI) / 180) * Math.cos((P.sunEl * Math.PI) / 180)).normalize();
    const skyAz = (Math.atan2(sunDir.x, -sunDir.z) * 180) / Math.PI;
    const sky = skyKit.makeSky({
      rng: R.sky, preset: HR.preset, clouds: false, clouds2: hourName === 'day' ? { coverage: 0.22, opacity: 0.5 } : false,
      ...(night ? { bodyOverrides: { 0: { elevation: P.sunEl, azimuth: skyAz, size: 3.2, phase: 1, glow: 0.5 } }, stars: 0.8, bake: !!ctx.renderer, renderer: ctx.renderer } : { sunElevation: P.sunEl, sunAzimuth: skyAz }),
      ...(hourName === 'day' ? { zenith: '#3a86dc', horizon: '#bcdcf4' } : {}),
    });
    scene.add(sky.object);
    await tick();
    // THE CITY'S OWN SHADOWS: the one shadow light is the hour's sun (the moon by night); its shadow frame stands on the city's middle, 112 m
    // to every side (it follows nothing), and is drawn once: nothing that casts in it moves (the walls, the houses, the decks, the stairs)
    const rig = skyKit.makeLightRig(sky, { intensity: HR.sun, ambient: HR.amb, bounce: night ? 0.45 : 0.3, shadow: true, shadowSize: 4096, shadowRange: 112, distance: 420, follow: false });
    rig.sun.target.position.set((D.cityX + P.raftMid[0]) * h, P.deckY + 22, D.cityZ + P.raftMid[1] + 5);
    rig.sun.shadow.autoUpdate = false; rig.sun.shadow.needsUpdate = true; rig.sun.shadow.bias = -0.0006; rig.sun.shadow.normalBias = 0.3;
    // the hour's own tint, set once (it stands for the whole visit): a warm sun, a cooler fill, so that shade reads as shade
    rig.sun.color.multiply(new THREE.Color(HR.warm[0], HR.warm[1], HR.warm[2])); rig.hemi.color.lerp(new THREE.Color('#9fbef5'), HR.cool);
    scene.add(rig.object);
    const fogCol = sky.fogColor.clone().lerp(new THREE.Color('#ffffff'), night ? 0 : 0.25);
    scene.fog = new THREE.FogExp2(fogCol, HR.fog);
    // ---- THE PLACE'S LIGHT: one set of uniforms for everything lit here (laws of world position and the clock; see the part file)
    await tick();
    const U = kitUniforms(), mats = makeKitMaterials(U);
    await tick();
    const ras = planRaster(P, h), planTex = planTexture(ras);
    await tick();
    // (the stand-in picture of kitUniforms is freed here, where it is replaced by the plan's own)
    U.uKPlan.value.dispose(); U.uKPlan.value = planTex; U.uKPlanA.value.set(ras.x0, ras.z0, 1 / ras.size, P.deckY); U.uKPlanB.value.set(102, P.cloudTop + 14, HR.night, night ? 0.6 : 0.88);
    U.uKSun.value.copy(sunDir); U.uKRide.value.set(P.rideX * h, 24, 400, D.rideHalf); U.uKGlade.value[0].set(0, 0, D.glade, 0); U.uKGlade.value[1].set(P.deer.x * h, P.deer.z, P.deer.r + 3, 0);
    U.uKWind.value.set(P.wind[0] * h, P.wind[1], 5, night ? 0.5 : 1);
    // THE CLOUD'S BODY: a slab between two heights under the cloud's tops (D.slab), whole but for its standing gaps; a thing is lost in it
    // within a few tens of metres of sight line, and nothing is seen through its whole depth: a thing is clear of the cloud or it is in it.
    U.uKCloud.value.set(P.cloudTop - D.slab[0], P.cloudTop - D.slab[1], 0.2, night ? 0.24 : 0.34);
    U.uKCloudCol.value.set({ day: '#d3deee', golden: '#ecccac', dawn: '#f0d3d2', night: '#7a8ab4' }[hourName]);
    // THE FAR AIR UNDER THE CLOUD (what the cloud's underside pales into with distance, two thirds at 600 m from the eye by day, at
    // 420 m by night): by day the cloud's own colour, greyed and blued (a little paler than the underside's own mean), a quarter of
    // the way to the scene's fog colour (a far underside is a grey-blue, not the sky's white); by night, when the fog is the dark of the sky and the moonlit heaps stand pale against it, the cloud's own
    // colour a little darkened toward it (0.15)
    { const air = night ? U.uKCloudCol.value.clone().lerp(fogCol, 0.15) : U.uKCloudCol.value.clone().multiply(new THREE.Color(0.62, 0.68, 0.82)).lerp(fogCol, 0.25); U.uKAir.value.set(air.r, air.g, air.b, 1 / (night ? 420 : 600)); }
    // the cloud's standing gaps (places of the world) and the legs whose thin shadows lie across the wood
    P.gaps.forEach((g, i) => { if (i < 11) U.uKGap.value[i].set(g.x * h, g.z, g.r, 0); });
    P.stilts.forEach((s, i) => { if (i < 6) U.uKLeg.value[i].set(s.x * h, s.z, s.y1, s.r); });
    // the stream's law for the far country's painting (see kLand in the part file): the ride's x, the hand times the side, the swing's size and phase
    U.uKStream.value.set(P.rideX * h, P.ws * h, P.sAmp, P.sph);
    const groundW = (x, z) => P.ground(x * h, z), woodW = (x, z) => P.woodD(x * h, z);
    await tick();
    // ---- everything built of the part's own geometry stands in one group, mirrored east for west by the hand
    const set = new THREE.Group(); set.scale.x = h; scene.add(set);
    const hero = await buildHero(ctx, { plan: P, uniforms: U, materials: mats });
    hero.object.position.set(D.cityX, P.deckY - hero.drop, D.cityZ); set.add(hero.object);
    hero.object.traverse((o) => { if (o.isMesh) { o.receiveShadow = true; o.castShadow = o.name === 'city'; } });
    await tick();
    const SK = await buildStiltsGeo(P, tick);
    await SK.s.bound(tick); await SK.m.bound(tick);
    const stiltGeo = SK.s.toGeometry();
    await tick();
    const stiltMesh = new THREE.Mesh(stiltGeo, mats.solid), stiltMove = new THREE.Mesh(SK.m.toGeometry(), mats.moving);
    stiltMesh.name = 'stilts'; stiltMove.name = 'stilts-moving'; stiltMesh.receiveShadow = true; set.add(stiltMesh, stiltMove);
    await tick();
    // ---- THE WOOD'S FLOOR: a patch of ground round the glade and the ride, and under the ride where it is carried back
    // behind the entry (the canopy's shell covers the rest of the country)
    const cGrass = new THREE.Color('#5d8a35'), cMoss = new THREE.Color('#55702f'), cLitter = new THREE.Color('#7a6a44'), cWet = new THREE.Color('#3a3626'), cBank = new THREE.Color('#77603e'), cRide = new THREE.Color('#6c9a3c');
    const gNoise = makeNoise(hashSeed('stilts-floor:' + seed)), _gc = new THREE.Color();
    const groundColor = (x, z, y, ny, out) => {
      const o = out || _gc, cx = x * h, n = gNoise.n2(x * 0.06, z * 0.06) * 0.5 + 0.5, n2 = gNoise.n2(x * 0.31 + 9, z * 0.31) * 0.5 + 0.5;
      const open = Math.max(1 - smoothstep(D.rideHalf * 0.5, D.rideHalf * 1.3, Math.abs(cx - P.rideX)) * 1, 1 - smoothstep(D.glade * 0.6, D.glade * 1.05, Math.hypot(cx, z)), 1 - smoothstep(P.deer.r * 0.7, P.deer.r * 1.5, Math.hypot(cx - P.deer.x, z - P.deer.z)));
      o.copy(cLitter).lerp(cMoss, smoothstep(0.25, 0.7, n)).lerp(cGrass, open * 0.85).lerp(cRide, open * smoothstep(0.4, 0.8, n2) * 0.5);
      // the stream's bed dark and wet, its banks bare earth for a metre above the water's edge
      const ds = Math.abs(cx - P.streamX(z)), wet = 1 - smoothstep(2.2, 3.4, ds), bank = smoothstep(2.6, 3.2, ds) * (1 - smoothstep(4.0, 5.0, ds));
      return o.lerp(cBank, bank * 0.85).lerp(cWet, wet * 0.9).multiplyScalar(0.82 + 0.3 * n2);
    };
    const bx = h > 0 ? [-115, 150] : [-150, 115];
    const terrain = await terrainKit.makeTerrainAsync({
      rng: R.stone, noise: gNoise, height: groundW, bounds: [bx[0], -120, bx[1], 250], cell: 2.5, near: 34, levels: 4, focus: (x, z) => woodW(x, z), corridor: false,
      biome: 'meadow', palette: { clouds: 0, ripples: 0, snow: 0 }, color: (x, z, hh, ny, out) => groundColor(x, z, hh, ny, out), sunDir, shadow: 0, ao: 0.3, skirt: 8, maxTriangles: 36000,
    }, ctx.yield);
    placePatch(terrain.material, U, 'floor'); scene.add(terrain.object);
    await tick();
    // the ride's floor where it is carried back behind the entry, from under the patch's far edge on (6 cm under the ground's
    // law, so that the patch lies over it where both are): the same ground and the same colours by the same laws, 40 m to
    // either side of the ride's axis (the wood's roof stands over its edges and its end)
    {
      const z0 = 228, z1 = D.entryZ + D.backRide + 20, nz = Math.ceil((z1 - z0) / 10), nx = 8, pos = new Float32Array((nx + 1) * (nz + 1) * 3), col = new Float32Array((nx + 1) * (nz + 1) * 3), idx = [], c = new THREE.Color();
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
        const x = P.rideX * h + (i - nx / 2) * 10, z = z0 + (z1 - z0) * j / nz, y = groundW(x, z) - 0.06, q = (j * (nx + 1) + i) * 3;
        pos[q] = x; pos[q + 1] = y; pos[q + 2] = z; groundColor(x, z, y, 1, c); col[q] = c.r; col[q + 1] = c.g; col[q + 2] = c.b;
      }
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, d = a + nx + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); fg.setAttribute('color', new THREE.BufferAttribute(col, 3)); fg.setIndex(idx); fg.computeVertexNormals();
      const backFloor = new THREE.Mesh(fg, placePatch(new THREE.MeshLambertMaterial({ vertexColors: true }), U, 'backfloor', 'diffuseColor.rgb *= 0.84 + 0.3 * kNoise(kW.xz * 0.8);'));
      backFloor.name = 'terrain-back'; scene.add(backFloor);
    }
    // ---- THE CANOPY'S SHELL: the wood's roof over the whole country, from 58 m off the ride and the glade outward (woodD, the plan's measure
    // of how far a place lies from the wood's two open places; inside that the
    // real trees stand; the shell sinks under the ground there). A law of place: its height is the ground's plus the crowns' plus the
    // country's own slow hills; glades, rides and the stream's line lie open in it where they lie (kOpenLand in the part file); nothing
    // of it follows the visitor.
    const zFloorEnd = D.entryZ + D.backRide + 20;
    {
      // six far glades and two far rides, dealt (a glade inside the real wood's patch or on the ride's own line is left out after its draws);
      // the first ride is our own, carried on south from where the floor ends
      const nG = [], rl = R.land;
      for (let i = 0; i < 6; i++) { const a = rl.range(0, TAU), d = rl.range(190, 760), r = rl.range(20, 52), gx = Math.cos(a) * d, gz = Math.sin(a) * d; if (P.woodD(gx, gz) > 120 + r && Math.abs(gx - P.rideX) > r + 40) nG.push([gx, gz, r]); }
      nG.forEach((g, i) => U.uKFar.value[i].set(g[0] * h, g[1], g[2], 0));
      U.uKWay.value[0].set(P.rideX * h, D.entryZ + 60, 0, 10.5);
      for (let i = 0; i < 2; i++) { const g = nG[i], b = rl.range(0, TAU), wd = rl.range(5, 7.5); if (g) U.uKWay.value[i + 1].set(g[0] * h, g[1], b * h, wd); }
      const sn = makeNoise(hashSeed('stilts-shell:' + seed)), ax = [], fine = 5.36;
      for (let v = -134; v <= 134.01; v += fine) ax.push(v);
      for (let st = fine * 1.12, v = 134 + st; v < 9000; st *= v < 300 ? 1.12 : 1.3, v += st) { ax.push(v); ax.unshift(-v); }
      const n = ax.length, pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3), idx = new Uint32Array((n - 1) * (n - 1) * 6);
      const cD = new THREE.Color('#2c6132'), cM = new THREE.Color('#467a38'), cL = new THREE.Color('#8fae58'), c = new THREE.Color(), cx0 = 10 * h, cz0 = 40;
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const x = cx0 + ax[i], z = cz0 + ax[j], q = j * n + i, cellS = Math.max(i > 0 ? ax[i] - ax[i - 1] : 99, j > 0 ? ax[j] - ax[j - 1] : 99), fineK = 1 - smoothstep(7, 22, cellS);
          // the ride carried back behind the entry and on to the south: the roof is open over it (from D.cutIn to D.cutOut metres to either side of its axis) as far as the country goes
          const back = z - D.entryZ, offR = Math.abs(x * h - P.rideX), cut = back > 0 ? smoothstep(D.cutIn, D.cutOut, offR) : 1;
          const dl = woodW(x, z), rise = smoothstep(58, 80, dl) * cut, far = Math.hypot(ax[i], ax[j]);
          // the wood's roof: broad heads on a slow roll of the wood's height, on the far country's hills (the crowns themselves are drawn on it by the shell's own shading, a law of place)
          const b1 = 1 - Math.abs(sn.n2(x * 0.045, z * 0.045)), b2 = 1 - Math.abs(sn.n2(x * 0.11 + 40, z * 0.11 - 12)), roll = sn.n2(x * 0.011 + 5, z * 0.011) * 4 + sn.n2(x * 0.0023, z * 0.0023 + 3) * 9 * smoothstep(250, 900, far);
          const hills = (sn.n2(x * 0.0011 + 7, z * 0.0011 - 3) * 46 + sn.n2(x * 0.0034 - 2, z * 0.0034 + 8) * 15) * smoothstep(320, 1500, far) * (back > 0 ? smoothstep(40, 300, offR) : 1);
          const crown = 25 + roll + (b1 * b1 * 5 + b2 * 2.4 - 3.4) * fineK, gK = Math.max(1 - smoothstep(110, 140, dl), back > 0 ? 1 - smoothstep(36, 60, offR) : 0), g = gK > 0 ? groundW(x, z) * gK : 0;
          // under the ground by 4 m where the real wood or the floor lies over it; the ground itself in the ride beyond the floor's end
          const sink = 4 - 3.94 * smoothstep(zFloorEnd - 34, zFloorEnd - 10, z);
          pos[q * 3] = x; pos[q * 3 + 1] = g + hills - sink + (crown + sink) * rise; pos[q * 3 + 2] = z;
          const tone = clamp(0.2 + 0.4 * b1 * b1 * fineK + 0.4 * (sn.n2(x * 0.02 + 70, z * 0.02) * 0.5 + 0.5) + 0.2 * (1 - fineK), 0, 1);
          c.copy(cD).lerp(cM, smoothstep(0.15, 0.6, tone)).lerp(cL, smoothstep(0.66, 1, tone) * 0.55);
          col[q * 3] = c.r; col[q * 3 + 1] = c.g; col[q * 3 + 2] = c.b;
        }
        if (j % 2 === 1) await tick();
      }
      let t = 0; for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, d = a + n, e = d + 1; idx[t++] = a; idx[t++] = d; idx[t++] = b; idx[t++] = b; idx[t++] = d; idx[t++] = e; }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(col, 3)); sg.setIndex(new THREE.BufferAttribute(idx, 1));
      await tick();
      // (the shell's normals by its own grid, a strip of rows at a time: the slope across each vertex's two neighbours either way)
      { const nor = new Float32Array(n * n * 3);
        for (let j = 0; j < n; j++) {
          const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, n - 1);
          for (let i = 0; i < n; i++) { const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, n - 1), q = (j * n + i) * 3, hx = (pos[(j * n + i1) * 3 + 1] - pos[(j * n + i0) * 3 + 1]) / (ax[i1] - ax[i0]), hz = (pos[(j1 * n + i) * 3 + 1] - pos[(j0 * n + i) * 3 + 1]) / (ax[j1] - ax[j0]), il = 1 / Math.hypot(hx, 1, hz); nor[q] = -hx * il; nor[q + 1] = il; nor[q + 2] = -hz * il; }
          if (j % 24 === 23) await tick();
        }
        sg.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); }
      await tick(); sg.computeBoundingSphere();
      // every crown a dome about 11 m across: lit on its sunward side, dark in the gaps between, each of its own green between a
      // dark and a yellow one; then the open places: grass bright in the sun or dim in the trees' shade, the stream's water with its
      // glints. Where a picture element spans more than a crown (far off, or seen at a low angle) the crowns cannot be told apart
      // and the roof takes the MEAN of what the crowns are near to (farWood: the mean green times the mean of dome and sunward
      // light, counted here for this hour's sun over 4,096 places of a field of crowns laid by the same law), so that the far wood
      // is neither paler nor darker than the near one.
      // THE OPEN PLACES ARE PAINTED WHERE THE SHELL LIES LEVEL: on the roof at its whole height and on the ride's own strip at the
      // ground. On its RISING FACE (the far wood's wall toward the real wood, 58 to 80 m from the real wood's open places, and the
      // two sides of the ride carried back, 11 to 30 m from its axis: kRise below is the shell's own rise, by the same measures as
      // its vertices above) there is no grass and no water: a wall of trees stands there, and the stream goes in under it. (Before,
      // the stream's water and its banks' grass were painted up the wall where the stream's line crosses it: a flat blue box and a
      // green slab in the tree line, 25 m high, seen from the ride.)
      const farWood = (() => {
        const rq = makeRng(hashSeed('stilts-crown-mean')), sx = sunDir.x, sy = sunDir.y, sz = sunDir.z; let sum = 0;
        for (let k = 0; k < 4096; k++) {
          const fx = rq(), fz = rq(); let d1 = 9, vx = 0, vz = 0;
          for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = i + 0.15 + 0.7 * rq() - fx, cz = j + 0.15 + 0.7 * rq() - fz, d = cx * cx + cz * cz; if (d < d1) { d1 = d; vx = cx; vz = cz; } }
          const dome = 1 - smoothstep(0.3, 0.8, Math.sqrt(d1)), nl = 1 / Math.hypot(vx * 2.2, 1, vz * 2.2), lit = clamp((-vx * 2.2 * sx + sy - vz * 2.2 * sz) * nl * 1.25, 0, 1);
          sum += (0.36 + 0.64 * dome) * (0.5 + 0.8 * lit);
        }
        const m = sum / 4096;
        return [(0.82 + 0.38 / 3) * m, (0.95 + 0.17 / 3) * m, (0.8 - 0.08 / 3) * m].map((v) => v.toFixed(4)).join(', ');
      })();
      const crowns = `
        vec2 g = kW.xz / 11.5, gi = floor(g), gf = fract(g); float d1 = 9., id = 0.; vec2 dv = vec2(0.);
        for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)); vec2 cc = o + 0.15 + 0.7 * vec2(kHash(gi + o), kHash(gi + o + 17.3)) - gf; float d = dot(cc, cc); if (d < d1) { d1 = d; dv = cc; id = kHash(gi + o + 5.7); } }
        float dome = 1. - smoothstep(0.3, 0.8, sqrt(d1)), fw = max(fwidth(g.x), fwidth(g.y)), kk = clamp(1.3 - fw * 1.8, 0., 1.);
        float lit = clamp(dot(normalize(vec3(-dv.x * 2.2, 1., -dv.y * 2.2)), uKSun) * 1.25, 0., 1.);
        vec3 tint = mix(vec3(0.82, 0.95, 0.8), vec3(1.2, 1.12, 0.72), id * id);
        float stand = 0.78 + 0.4 * kNoise(kW.xz * 0.0065 + 3.1) + 0.14 * kNoise(kW.xz * 0.031);
        diffuseColor.rgb *= mix(vec3(${farWood}), tint * (0.36 + 0.64 * dome) * (0.5 + 0.8 * lit), kk) * (0.78 + 0.44 * kNoise(kW.xz * 0.9 + kW.y * 0.3)) * stand;
        float kSh, kWat, kOp = kOpenLand(kW.xz, kSh, kWat);
        float kDl = min(length(vec2(kW.x - uKRide.x, kW.z - clamp(kW.z, uKRide.y, ${D.entryZ.toFixed(1)}))), abs(length(kW.xz) - ${D.glade.toFixed(1)}));
        float kRise = smoothstep(58., 80., kDl) * (kW.z > ${D.entryZ.toFixed(1)} ? smoothstep(${D.cutIn.toFixed(1)}, ${D.cutOut.toFixed(1)}, abs(kW.x - uKRide.x)) : 1.);
        float kLevel = max(1. - smoothstep(0., 0.04, kRise), smoothstep(0.985, 1., kRise));
        kOp *= kLevel; kWat *= kLevel;
        vec3 grassC = vec3(0.42, 0.58, 0.2) * (0.85 + 0.3 * kNoise(kW.xz * 0.35)) * mix(1., 0.34, kSh);
        diffuseColor.rgb = mix(diffuseColor.rgb, grassC, kOp);
        float glint = step(0.9, kNoise(kW.xz * 1.9 + vec2(uKTime * 0.7, -uKTime * 0.4)));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.5, 0.68, 0.8) * mix(1., 0.5, kSh) + glint * (1. - kSh) * 0.8, kWat);`;
      // the air of a far country: beyond the scene's own fog a thing pales to the horizon's colour by its distance, as everywhere
      const farAir = '{ gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 0.94 * smoothstep(900., 5600., length(vViewPosition))); }\n';
      const sm = placePatch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), U, 'shell', crowns, farAir);
      const shell = new THREE.Mesh(sg, sm); shell.name = 'canopy'; scene.add(shell);
      await tick();
      // TWO FAR RIDGES of the same wood, each a long back of land at its dealt bearing and distance (one to the west, one to the east of
      // the ladder leg for the hand +1), paling with their distance
      for (const [b0, b1] of [[205, 300], [70, 150]]) {
        const be = rl.range(b0, b1) * Math.PI / 180, dist = rl.range(1500, 2500), top = rl.range(90, 150), len = rl.range(3200, 4600), wid = rl.range(700, 1000), skew = rl.range(-0.35, 0.35), ph = rl.range(0, 50);
        const ox = Math.sin(be) * dist * h, oz = -Math.cos(be) * dist, tx = Math.cos(be + skew) * h, tz = Math.sin(be + skew), nxr = -tz, nzr = tx, NA = 40, NC = 8;
        const rp = new Float32Array((NA + 1) * (NC + 1) * 3), rc = new Float32Array((NA + 1) * (NC + 1) * 3), ri = [];
        for (let a = 0; a <= NA; a++) for (let cc = 0; cc <= NC; cc++) {
          const al = (a / NA - 0.5) * len, ac = (cc / NC - 0.5) * wid, q = (a * (NC + 1) + cc) * 3, x = ox + tx * al + nxr * ac, z = oz + tz * al + nzr * ac;
          const bell = Math.pow(Math.cos((cc / NC - 0.5) * Math.PI), 1.5) * Math.sin(a / NA * Math.PI) ** 0.6;
          rp[q] = x; rp[q + 1] = -40 + (40 + 25 + top * (0.55 + 0.45 * sn.n2(al * 0.0016 + ph, 0.5))) * bell; rp[q + 2] = z;
          c.copy(cD).lerp(cM, 0.5 + 0.4 * sn.n2(x * 0.004, z * 0.004)); rc[q] = c.r; rc[q + 1] = c.g; rc[q + 2] = c.b;
        }
        for (let a = 0; a < NA; a++) for (let cc = 0; cc < NC; cc++) { const p0 = a * (NC + 1) + cc, p1 = p0 + 1, p2 = p0 + NC + 1, p3 = p2 + 1; ri.push(p0, p1, p2, p1, p3, p2); }
        const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); rg.setAttribute('color', new THREE.BufferAttribute(rc, 3)); rg.setIndex(ri); rg.computeVertexNormals();
        const ridge = new THREE.Mesh(rg, sm); ridge.name = 'ridge'; scene.add(ridge);
        await tick();
      }
    }
    // ---- THE WOOD: the kit's trees at the plan's own points (each tested there against the lane), undergrowth by rules of place
    const wind = flora.makeWind({ direction: [P.wind[0] * h, P.wind[1]], strength: 0.75, speed: 0.9 });
    // (the bark is asked for whole and in plates a little broader than the kit's own, so that a trunk beside the ride reads as bark)
    const leafOpts = { wind, backlight: 1.0, backlightTint: '#d8f07a', detail: 0.6, detailScale: 0.6 };
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMat = placePatch(flora.windMaterial(leafOpts), U, 'leaf');
    // (the low plants' material has no fade by the eye's distance: a plant stands whole wherever it is dealt)
    const coverMat = placePatch(flora.windMaterial({ wind, map: leafMat.map, detail: 0, wrap: 0.3, backlight: 0.6, ambient: 1.1, leafAmbient: 1.1, sheen: 0.4 }), U, 'cover');
    const TREE = [
      (d, r) => flora.oakGeometry({ rng: r, height: 12.5, detail: d, leaf: '#3f7f33', leafLight: '#8fbf4a', leafDark: '#2a5a2a', bark: '#9a8468', barkDark: '#6a5a48' }),
      (d, r) => flora.oakGeometry({ rng: r, height: 12.5, detail: d, leaf: '#4a8a36', leafLight: '#a9cc58', leafDark: '#2f6230', bark: '#a08a6e', barkDark: '#6e5e4a' }),
      (d, r) => flora.mapleGeometry({ rng: r, height: 12.5, detail: d, leaf: '#5a9a3a', gold: '#86b446', crimson: '#3f7a30', leafLight: '#b7d260', leafDark: '#2f6b3a', bark: '#94806a', barkDark: '#665848' }),
      (d, r) => flora.birchGeometry({ rng: r, height: 13.5, detail: d, leaf: '#6fa64a', leafLight: '#c9d66b', leafDark: '#3f7a36', bark: '#b4ab98', barkDark: '#2c2722', barkLight: '#7d6f5e' }),
    ];
    const treeNear = [], treeFar = [];
    for (let i = 0; i < 4; i++) { treeNear.push(TREE[i](detail < 0.75 ? 0 : 1, makeRng(hashSeed('stilts-tree-n' + i + ':' + seed)))); await tick(); treeFar.push(TREE[i](0, makeRng(hashSeed('stilts-tree-f' + i + ':' + seed)))); await tick(); }
    const treePt = (t) => ({ x: t.x * h, y: t.y, z: t.z, s: t.s, rot: t.rot, d: t.d, u: 0, v: t.v });
    // A TREE STANDS ONLY WHERE ITS OWN BOUGHS KEEP THE LANE: the kit's own geometry at the kit's own placing (upright, turned
    // by rot, of size s, sunk 0.03 of its height), every vertex against the line's eyes and the eyes of the entry's axis behind
    // the entry, with the lane (2.5 m), the wind's sway (1.2 m) and the eyes' spacing (0.15 m). One that fails is not planted.
    const EY = P.eyes, BK = P.back, _tm = new THREE.Matrix4(), _tq = new THREE.Quaternion(), _te = new THREE.Euler(), _tv = new THREE.Vector3(), _ts = new THREE.Vector3(), keepR2 = 3.85 * 3.85;
    const boughsKeep = (t, geo) => {
      if (!geo.boundingSphere) geo.computeBoundingSphere();
      const reach = (geo.boundingSphere.radius + geo.boundingSphere.center.length()) * t.s + 3.85, r2 = reach * reach, cand = [];
      for (let i = 0; i < EY.n; i++) { const dx = EY.x[i] - t.x, dz = EY.z[i] - t.z; if (dx * dx + dz * dz < r2 && EY.y[i] < t.y + reach) cand.push(EY.x[i] * h, EY.y[i], EY.z[i]); }
      for (let i = 0; i < BK.n; i++) { const dx = BK.x[i] - t.x, dz = BK.z[i] - t.z; if (dx * dx + dz * dz < r2) cand.push(BK.x[i] * h, BK.y[i], BK.z[i]); }
      if (!cand.length) return true;
      _te.set(0, t.rot, 0); _tq.setFromEuler(_te); _tv.set(t.x * h, t.y - 0.03 * (geo.userData.height || 1) * t.s, t.z); _ts.set(t.s, t.s, t.s); _tm.compose(_tv, _tq, _ts);
      const pa = geo.attributes.position;
      for (let i = 0; i < pa.count; i++) { _tv.fromBufferAttribute(pa, i).applyMatrix4(_tm); for (let k = 0; k < cand.length; k += 3) { const dx = cand[k] - _tv.x, dy = cand[k + 1] - _tv.y, dz = cand[k + 2] - _tv.z; if (dx * dx + dy * dy + dz * dz < keepR2) return false; } }
      return true;
    };
    const planted = []; let treeI = 0;
    for (const t of P.trees) { if (boughsKeep(t, (t.near ? treeNear : treeFar)[t.v % 4])) planted.push(t); if (++treeI % 3 === 0) await tick(); }
    // (for the node counts: how many trees the plan deals and how many the boughs' own test then leaves out)
    scene.userData.stiltsTrees = { plan: P.trees.length, out: P.trees.length - planted.length, planOut: P.leftOut.tree };
    const woodNear = flora.makeScatter({ rng: makeRng(hashSeed('stilts-wood-n:' + seed)), points: planted.filter((t) => t.near).map(treePt), variants: treeNear, material: leafMat, tint: 0.16, hue: 0.05, stretch: 0, tilt: 0 });
    await tick();
    const woodFar = flora.makeScatter({ rng: makeRng(hashSeed('stilts-wood-f:' + seed)), points: planted.filter((t) => !t.near).map(treePt), variants: treeFar, material: leafMat, tint: 0.16, hue: 0.05, stretch: 0, tilt: 0 });
    scene.add(woodNear.object, woodFar.object);
    await tick();
    // WHERE THE LOW PLANTS GROW: within 60 m of the ride and the glade (woodD: thinning from 42 m to none at 62 m), on
    // the banks but not in the stream's water (which lies 3 m to either side of its middle), not on the plinth. Every plant dealt stands
    // whole from anywhere: nothing sinks, fades or is switched off by the eye's distance (the kit's fade and cull are not asked for).
    const cb = h > 0 ? [-62, -62, 112, 196] : [-112, -62, 62, 196], noCull = { cullDistance: Infinity };
    const openAt = (x, z) => Math.max(1 - smoothstep(D.rideHalf * 0.6, D.rideHalf * 1.2, Math.abs(x * h - P.rideX)), 1 - smoothstep(D.glade * 0.7, D.glade, Math.hypot(x, z)));
    const growAt = (x, z) => (1 - smoothstep(42, 62, woodW(x, z))) * smoothstep(3.3, 4.3, Math.abs(x * h - P.streamX(z))) * smoothstep(6.2, 8, Math.hypot(x, z));
    const grass = await flora.makeGrassAsync({
      rng: R.grass, bounds: cb, count: Math.round(9500 * D.coverKeep * P.dens), heightAt: groundW, density: (x, z) => growAt(x, z) * (0.35 + 0.65 * openAt(x, z)), groundColor: (x, z, y) => groundColor(x, z, y, 1, null),
      wind, material: coverMat, chunks: 2, flowers: 0.05, flowerColors: ['#f2d24b', '#d9486a', '#f4f0e0'], height: [0.45, 0.95], width: [1.0, 1.6], ...noCull,
    }, ctx.yield);
    scene.add(grass.object);
    await tick();
    const fernG = [0, 1].map((i) => flora.fernGeometry({ rng: makeRng(hashSeed('stilts-fern' + i + ':' + seed)), size: 1.5, detail: 1, leaf: '#3c8a3a', leafLight: '#8fc04a', leafDark: '#2a5f2e' }));
    const ferns = flora.makeFerns({ rng: R.fern, bounds: cb, count: Math.round(340 * D.coverKeep * P.dens), heightAt: groundW, variants: fernG, material: coverMat, chunks: 1, corridor: 0, scale: [0.9, 1.8], ...noCull, density: (x, z) => growAt(x, z) * (1 - 0.75 * openAt(x, z)) * smoothstep(4.6, 6.6, Math.abs(x * h - P.rideX)) });
    scene.add(ferns.object);
    await tick();
    // foxgloves: tall spires of pink (some pale, a few yellow) at the ride's edges and round the glade
    const spire = flora.flowerGeometry({ rng: makeRng(hashSeed('stilts-spire:' + seed)), petalMask: true, cards: 3, width: 0.34, height: 1.35, root: '#3f6a2a', tip: '#7fae4a' });
    await tick();
    const flowers = flora.makeFlowers({ rng: R.flower, bounds: cb, count: Math.round(900 * D.coverKeep * P.dens), heightAt: groundW, variants: [spire], material: coverMat, chunks: 1, scale: [0.7, 1.25], colors: ['#d9486a', '#d9486a', '#e77a9a', '#f1c3d0', '#f2d24b'], ...noCull,
      density: (x, z) => { const a = Math.abs(x * h - P.rideX), r = Math.hypot(x, z); return growAt(x, z) * smoothstep(3.4, 5.5, a) * Math.max(1 - smoothstep(9, 15, a), smoothstep(D.glade - 14, D.glade - 6, r) * (1 - smoothstep(D.glade, D.glade + 8, r))) * (0.35 + 0.65 * smoothstep(-0.2, 0.4, gNoise.n2(x * 0.09, z * 0.09))); } });
    scene.add(flowers.object);
    await tick();
    const bushG = [];
    for (const i of [0, 1]) { bushG.push(flora.bushGeometry({ rng: makeRng(hashSeed('stilts-bush' + i + ':' + seed)), size: 1.8, detail: 0, flowers: i ? 0.5 : 0, flowerColor: '#f4f0e0', leaf: '#3f7f33', leafLight: '#9cc552', leafDark: '#2a5a2a' })); await tick(); }
    const bushes = flora.makeBushes({ rng: R.bush, bounds: cb, count: Math.round(120 * D.coverKeep * P.dens), heightAt: groundW, variants: bushG, material: leafMat, corridor: 0, spacing: 2.6, scale: [0.9, 2.3], ...noCull, density: (x, z) => growAt(x, z) * (1 - openAt(x, z)) * smoothstep(D.rideHalf + 1, D.rideHalf + 4, Math.abs(x * h - P.rideX)) * (woodW(x, z) > 8 ? 1 : 0) });
    scene.add(bushes.object);
    await tick();
    // reeds at the water's edge, their feet in the shallows (from 2.6 to 4.4 m off the stream's middle)
    const reeds = flora.makeReeds({ rng: R.reed, bounds: cb, count: Math.round(90 * D.coverKeep * P.dens), heightAt: groundW, material: coverMat, corridor: 0, scale: [0.6, 1.0], ...noCull, density: (x, z) => { const a = Math.abs(x * h - P.streamX(z)); return smoothstep(2.5, 2.9, a) * (1 - smoothstep(3.6, 4.4, a)) * (1 - smoothstep(42, 62, woodW(x, z))) * smoothstep(4.4, 5.4, Math.abs(x * h - P.rideX)); } });
    scene.add(reeds.object);
    await tick();
    // ---- THE STREAM beside the ride, in its bed between banks of bare earth and stones (the plan's): clear dark water a metre under
    // the banks, 5.8 m wide, running north over a stony bed with a broken, moving surface (ripples, a chop, foam where it runs against
    // its banks and stones); its edges thin out over the bank's last metre and a half. It goes on under the wood's roof at both ends,
    // where its line is painted on the roof by the same law.
    const streamPts = []; for (let z = 196; z >= -114; z -= 10) streamPts.push([P.streamX(z) * h, P.water, z]);
    const stream = water.makeRiver({ rng: makeRng(hashSeed('stilts-stream:' + seed)), points: streamPts, width: 5.8, speed: 1.6, foam: 0.3, bankFoam: 0.55, ripple: 1.7, chop: 0.24, bankFade: 1.5, opacity: 0.8, deep: '#12322c', shallow: '#4a8273', light: water.waterLight(sky) });
    scene.add(stream.object);
    await tick();
    // ---- the wood's creatures and the city's birds: every one on a round of its own, on the clock (none is tied to the flight: the kit is given u = 0)
    const fa = fauna.makeFauna(scene, { light: fauna.lightFrom(scene) });
    await tick();
    fa.add(fauna.makeHerd({ rng: makeRng(hashSeed('stilts-deer:' + seed)), species: 'deer', count: 5, center: [P.deer.x * h, 0, P.deer.z], radius: P.deer.r - 2.2, heightAt: groundW, mode: 'graze' }));
    await tick();
    // BUTTERFLIES have their homes where the flowers are: at the ride's two edges (5.5 to 12 m to either side of its axis, from the
    // glade to 40 m behind the entry: seven in ten of them) and on the glade's rim (from 8 m inside it to 2 m outside, off the ride's
    // own kept width: the others), 0.7 to 2.4 m over the ground. By the kit's law each stays within 1.89 m of its home (a roam of
    // 1.6 m level and 0.7 m in height, and its own bob), and its wings reach 0.3 m. The line's say comes after: a home within 2.5 m
    // and that reach (4.7 m) of the line or of the entry's axis behind it is left out after its draws, and is not dealt again. The
    // kit adds no scatter of its own to a home.
    const flyPts = [], lifeOut = { fly: 0, fire: 0, flyAll: 0, fireAll: 0 }; scene.userData.stiltsLifeOut = lifeOut;
    for (let i = 0, n = 0; i < 400 && n < Math.round(46 * P.dens); i++) {
      const edge = R.fly.chance(0.7), side = R.fly.sign(), q0 = R.fly(), q1 = R.fly(), up = R.fly.range(0.7, 2.4); let x, z;
      if (edge) { x = (P.rideX + side * lerp(5.5, 12, q0)) * h; z = lerp(24, D.entryZ + 40, q1); }
      else { const a = q0 * TAU, r = D.glade + lerp(-8, 2, q1); x = Math.cos(a) * r; z = Math.sin(a) * r; if (Math.abs(x * h - P.rideX) < D.rideHalf + 2.2 && z > 0) continue; }
      const y = groundW(x, z) + up; n++; lifeOut.flyAll++;
      if (P.laneW(x * h, y, z) < 2.5 + 1.89 + 0.3) { lifeOut.fly++; continue; } flyPts.push([x, y, z]);
    }
    await tick();
    fa.add(fauna.makeButterflies({ rng: R.fly, positions: flyPts, count: flyPts.length, size: 2.2, roam: [1.6, 0.7, 0.5, 0.4] }));
    await tick();
    // thrushes up and down the ride: a long round 14 m wide, 14 to 18 m over the ground (the line runs 3.6 m over it). The loose
    // form: maxSigma 3 is handed and no keepClear (the course is laid by the ride's own numbers). The course, less three scatters
    // (3.4 m level, 1.6 m in height), less the wander's box (1.2 m, 0.6 m, 0.8 m), less the bird's ball (0.8 m), keeps 7.4 m from
    // the line on seeds 1 to 300, and as much from the entry's axis behind the entry (as dealt by this tree's kit, the reader's
    // count on seeds 1 to 100: 7.6 m)
    const rz = (D.entryZ + 30) / 2 + 10, birdRoute = []; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; birdRoute.push([(P.rideX + Math.cos(a) * 7) * h, 16 + 2 * Math.sin(a * 2), rz + Math.sin(a) * 38]); }
    fa.add(fauna.makeFlock({ rng: R.bird, species: 'crows', count: 7, size: 0.7, route: birdRoute, closed: true, speed: 9, spread: [2.5, 1.2, 12], maxSigma: 3, wander: [0.8, 0.6, 0.8, 0.3], palette: { body: '#6a5846', belly: '#d2c4a2', wingC: '#57483a' } }));
    await tick();
    // swifts round the ladder leg: a round of 11 m about it, well inside the line's own round of 30 m, at a dealt height between three
    // and four tenths of the leg's (where its nests are). The loose form: maxSigma 3 is handed and no keepClear. The course, less
    // three scatters (3 m on each axis), less the wander's box (1.5 m, 1 m, 1 m), less the bird's ball (1.2 m), keeps 11.7 m from
    // the line on seeds 1 to 300 (as dealt by this tree's kit, the reader's count on seeds 1 to 100: 13.1 m)
    const S0 = P.stilts[0], swiftY = S0.y1 * R.swift.range(0.3, 0.4), swiftRoute = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; swiftRoute.push([Math.cos(a) * 11, swiftY + 9 * Math.sin(a * 2 + 1), Math.sin(a) * 11]); }
    fa.add(fauna.makeFlock({ rng: R.swift, species: 'swifts', count: 14, route: swiftRoute, closed: true, speed: 14, spread: [2.2, 2.2, 9], maxSigma: 3, wander: [1, 1, 1, 0.4] }));
    await tick();
    // storks soaring: three about the ladder leg, a round of 8 m at a dealt height between 0.56 and 0.68 of the leg's (above the swifts,
    // under the cloud), and four
    // in THE GREAT HOLE, soaring on its rising air: a round of 34 m about the hole's own middle, 22 to 42 m over the cloud's tops, with
    // 8 m of rise and fall (one sees them cross it from the jetty, over the wood far below; their highest is 39 m under the line, and
    // the round's nearest 28 m to the side of the line's end). Both calls are of the line form, dealt by plain draws: nothing is
    // handed for them (no maxSigma, no keepClear). The form's own bounds: half the row's width (2.1 m for the three, 5.3 m for the
    // four) to every side, 1.1 m in height. The course, less those, less the wander's box (0.9 m, 0.6 m, 0.6 m about the leg; 1.2 m,
    // 0.8 m, 0.8 m in the hole), less the bird's ball (2.1 m; 3.9 m), keeps 16.8 m from the line about the leg and 37.4 m in the
    // hole on seeds 1 to 300 (as dealt by this tree's kit, the reader's count on seeds 1 to 100: 17.1 m and 39.9 m)
    const storkPal = { body: '#f2f0ea', belly: '#ffffff', wingC: '#f4f2ee', trail: '#1c1c20', tip: '#1c1c20', beak: '#d24a2a', head: '#f6f4f0', neckC: '#f6f4f0', legC: '#d24a2a' };
    { const y0 = S0.y1 * R.stork.range(0.56, 0.68), rt = []; for (let i = 0; i < 12; i++) { const a = -i / 12 * TAU; rt.push([Math.cos(a) * 8, y0 + 3 * Math.sin(a * 2 + 2), Math.sin(a) * 8]); }
      fa.add(fauna.makeFlock({ rng: R.stork, species: 'flamingos', count: 3, size: 1.3, route: rt, closed: true, speed: 7, spread: [1.6, 2.5, 14], wander: [0.6, 0.6, 0.6, 0.2], palette: storkPal })); }
    await tick();
    { const gh = P.gaps.find((g) => g.kind === 'great'), y0 = P.cloudTop + R.stork.range(22, 42), rt = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; rt.push([(gh.x + Math.cos(a) * 34) * h, y0 + 8 * Math.sin(a * 2), gh.z + Math.sin(a) * 34]); }
      fa.add(fauna.makeFlock({ rng: makeRng(hashSeed('stilts-stork2:' + seed)), species: 'flamingos', count: 4, size: 2.4, route: rt, closed: true, speed: 8, spread: [2.5, 3, 18], wander: [0.8, 0.8, 0.8, 0.2], palette: storkPal })); }
    await tick();
    // the pigeons' round over the east terraces (the plan's; its whole spread was measured there against the lane). The loose form:
    // maxSigma 3 is handed and no keepClear. The course, less three scatters (4.1 m level, 2 m in height), less the wander's box
    // (1.5 m, 0.6 m, 1 m), less the bird's ball (0.8 m), keeps 14.7 m from the line on seeds 1 to 300 (as dealt by this tree's kit,
    // the reader's count on seeds 1 to 100: 17.2 m)
    if (P.flock) { const fr = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; fr.push([(P.flock.x + D.cityX + Math.cos(a) * P.flock.r) * h, P.deckY + P.flock.y + 1.5 * Math.sin(a * 3), D.cityZ + P.flock.z + Math.sin(a) * P.flock.r]); } fa.add(fauna.makeFlock({ rng: makeRng(hashSeed('stilts-pigeon:' + seed)), species: 'gulls', count: Math.round(18 * P.dens), size: 0.55, route: fr, closed: true, speed: 10, spread: [3, 1.5, 9], maxSigma: 3, wander: [1, 0.6, 1, 0.3], palette: { body: '#aab2bc', belly: '#eef0f2', wingC: '#8a929c', tip: '#4a4e56' } })); }
    // FIREFLIES by night, 320 homes, where the flowers and the wood's edge are: beside the ride (8.5 to 30 m to either side of its
    // axis, from the glade to 60 m behind the entry: seven in ten) and about the glade's rim (from 6 m inside it to 14 m outside, off
    // the ride's own kept width: the others), 0.6 to 7 m over the ground. Each stays within 3 m of its home (a roam of 2 m level and
    // 1 m in height): a home within 2.5 m and that reach (5.5 m) of the line or of the entry's axis is left out after its draws and
    // is not dealt again. The kit adds no scatter of its own to a home.
    if (night) {
      const ff = [];
      for (let i = 0, n = 0; i < 1500 && n < 320; i++) {
        if (i % 150 === 149) await tick();
        const edge = R.fire.chance(0.7), side = R.fire.sign(), q0 = R.fire(), q1 = R.fire(), up = R.fire.range(0.6, 7); let x, z;
        if (edge) { x = (P.rideX + side * lerp(8.5, 30, q0)) * h; z = lerp(24, D.entryZ + 60, q1); }
        else { const a = q0 * TAU, r = D.glade + lerp(-6, 14, q1); x = Math.cos(a) * r; z = Math.sin(a) * r; if (Math.abs(x * h - P.rideX) < D.rideHalf + 3 && z > 0) continue; }
        const y = groundW(x, z) + up; n++; lifeOut.fireAll++;
        if (P.laneW(x * h, y, z) < 2.5 + 3) { lifeOut.fire++; continue; } ff.push([x, y, z]);
      }
      fa.add(fauna.makeFireflies({ rng: makeRng(hashSeed('stilts-firefly:' + seed)), positions: ff, count: ff.length, size: 0.2, roam: [2.0, 1.0, 0.35, 0.05] }));
    }
    await tick();
    // ---- SHAFTS OF SUN, kitchen smoke, the dawn's ground mist, the lanterns' glow in the cloud: standing things of the hour
    const fxTime = { value: 0 }, fxSet = fx.fxGroup(); scene.add(fxSet.object);
    const rayDir = [-sunDir.x, -sunDir.y, -sunDir.z], rayCol = night ? '#b9c8ff' : hourName === 'day' ? '#fff3cc' : '#ffd9a0', sunH = Math.hypot(sunDir.x, sunDir.z) / Math.max(sunDir.y, 0.2);
    // A SHAFT IS A BODY (it is kept off the line by place, not by its fade near the eye). The kit lays each shaft as a ribbon from its head
    // down the sun's ray: its head within 'radius' of the cluster's own head, square to the ray; its length the cluster's times the
    // shaft's own lot (0.6 to 1); its half width growing from the first to the second of 'width', times its own lot (0.5 to 1.6). The
    // six lots of every shaft are drawn HERE from the shafts' own stream, the shaft's whole body is measured against the line (and the
    // entry's axis behind the entry) every 2 m of its length, and one that would come within 2.5 m and its own half width of it is
    // left out after its draws; the kit is then handed the kept shafts' lots, one by one, where it would have drawn its own.
    const tally = { shafts: 0, shaftsOut: 0, shaftsPlan: 0, beams: 0, beamsOut: 0, mist: 0, mistOut: 0, mistAll: 0, near: 1e9, mistNear: 1e9 }; scene.userData.stiltsTally = tally;
    const rayV = new THREE.Vector3(rayDir[0], rayDir[1], rayDir[2]).normalize(), rayE1 = new THREE.Vector3().crossVectors(rayV, new THREE.Vector3(0, 1, 0)).normalize(), rayE2 = new THREE.Vector3().crossVectors(rayV, rayE1).normalize();
    const shafts = (rng, head, radius, count, length, width, opts) => {
      const lots = []; let kept = 0, out = 0;
      for (let i = 0; i < count; i++) {
        const v = [rng(), rng(), rng(), rng(), rng(), rng()], a = v[0] * TAU, r = Math.sqrt(v[1]) * radius, cu = Math.cos(a) * r, cv = Math.sin(a) * r, wm = 0.5 + v[2] * 1.1, len = length * (0.6 + v[3] * 0.4);
        const ox = head[0] + rayE1.x * cu + rayE2.x * cv, oy = head[1] + rayE1.y * cu + rayE2.y * cv, oz = head[2] + rayE1.z * cu + rayE2.z * cv, n = Math.ceil(len / 2);
        // (its body's nearest to the line: the axis every 2 m, less the shaft's own half width there; 0.3 m more is kept for the step)
        let near = 1e9;
        for (let k = 0; k <= n; k++) { const s = k / n; near = Math.min(near, P.laneW((ox + rayV.x * len * s) * h, oy + rayV.y * len * s, oz + rayV.z * len * s) - lerp(width[0], width[1], s) * wm); }
        if (near >= 2.5 + 0.3) { for (const q of v) lots.push(q); kept++; tally.near = Math.min(tally.near, near); } else out++;
      }
      if (kept) { let q = 0; fxSet.add(fx.makeGodRays({ rng: () => lots[q++], time: fxTime, position: head, direction: rayDir, radius, count: kept, length, width, ...opts })); }
      return [kept, out];
    };
    // IN THE WOOD a shaft falls where the wood's roof has a hole, and it shows only in the wood's shade: its whole body lies under the
    // roof, never across an open place (in the ride's or the glade's full sun there is no shade to show it). Eighteen places are
    // dealt at the open places' edges: eight along the ride (half a metre to 3.5 m outside its kept width, on a dealt side, one in
    // every eighth of its length from the glade to 30 m behind the entry), five on the glade's rim (half a metre to 3.5 m outside
    // it), five in the wood 10 to 55 m outside the glade. At a place on the SUN'S side of its open place the shaft's FOOT stands
    // there (it comes down over the trees from a hole further toward the sun); at a place on the far side the HOLE is there, and the
    // shaft falls away from the open place on to the wood's floor beyond. Three shafts come down through each hole, from the roof
    // (27 m) to the ground, on the sun's own slant. A place whose shaft would still pass over an open place (where the ride runs
    // into the glade, or beside the deer's glade) has no shaft (after its draws; the plan's own test, not the line's).
    { const places = [], rr = R.rays, top = 27, slant = 1 / Math.max(sunDir.y, 0.2);
      for (let i = 0; i < 8; i++) { const side = rr.sign(), off = D.rideHalf + rr.range(0.5, 3.5), z = lerp(26, D.entryZ + 30, (i + rr.range(0.1, 0.9)) / 8); places.push([(P.rideX + side * off) * h, z, side * h * sunDir.x > 0]); }
      for (let i = 0; i < 5; i++) { const a = (i + rr.range(0.1, 0.9)) / 5 * TAU, r = D.glade + rr.range(0.5, 3.5); places.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * sunDir.x + Math.sin(a) * sunDir.z > 0]); }
      for (let i = 0; i < 5; i++) { const a = (i + rr.range(0.1, 0.9)) / 5 * TAU, r = D.glade + rr.range(10, 55); places.push([Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * sunDir.x + Math.sin(a) * sunDir.z > 0]); }
      const openAir = (x, z) => (Math.abs(x * h - P.rideX) < D.rideHalf && z > 24) || Math.hypot(x, z) < D.glade || Math.hypot(x * h - P.deer.x, z - P.deer.z) < P.deer.r;
      for (const [px, pz, sunSide] of places) {
        const wide = rr.range(1.5, 3.5);
        // (the foot and the hole: one is the dealt place, the other follows from the sun's slant over the roof's height above the ground there)
        let fx = px, fz = pz, run = (top - groundW(px, pz)) * slant;
        if (!sunSide) { fx = px - sunDir.x * run; fz = pz - sunDir.z * run; run = (top - groundW(fx, fz)) * slant; }
        const hx = fx + sunDir.x * run, hz = fz + sunDir.z * run;
        let under = true; for (let k = 0; k <= 8 && under; k++) if (openAir(lerp(fx, hx, k / 8), lerp(fz, hz, k / 8))) under = false;
        if (!under) { for (let k = 0; k < 18; k++) rr(); tally.shaftsPlan++; continue; }
        const [k, o] = shafts(rr, [hx, top, hz], wide, 3, run * 1.04, [0.7, 2.0], { color: rayCol, intensity: night ? 0.07 : 0.12, speed: 0.6 });
        tally.shafts += k; tally.shaftsOut += o;
      }
      await tick();
    }
    // UNDER THE CLOUD the sun comes down through its standing gaps in long shafts (their own stream). A shaft shows where the sun's
    // light passes the cloud's edge: it hangs from the gap's rim on the side AWAY from the sun (the rim the light comes in over lies
    // on the sun's side; the lit air under the gap slants away from it and is bounded there), from the cloud's foot down the sun's
    // own slant: each shaft's head is dealt on that rim, within 60 degrees to either hand of the way the light goes, between 0.8
    // of the gap's width and its whole width from its middle (5 to a gap of blue, 7 to the great hole and to each round of the
    // gap about the leg and the city). The same law of the body as in the wood: one that would come within the lane is left out.
    { const lightGo = Math.atan2(-sunDir.z, -sunDir.x), y0 = P.cloudTop - D.slab[0];
      for (const g of P.gaps) {
        const n = g.kind === 'blue' ? 5 : 7;
        for (let i = 0; i < n; i++) {
          const a = lightGo + R.beam.range(-1, 1) * Math.PI / 3, r = g.r * R.beam.range(0.8, 1);
          const [k, o] = shafts(R.beam, [g.x * h + Math.cos(a) * r, y0, g.z + Math.sin(a) * r], 4, 1, Math.min(260, 150 * Math.hypot(1, sunH)), [7, 18], { color: rayCol, intensity: night ? 0.03 : 0.05, speed: 0.35 });
          tally.beams += k; tally.beamsOut += o;
        }
      }
    }
    await tick();
    // (the kitchens' smoke is lost in the cloud's body as everything is: see hazeVeil in the part file)
    for (const c of P.smokes) { const sm = fx.makeSmokeColumn({ rng: makeRng(hashSeed('stilts-smoke:' + seed + ':' + Math.round(c[0]))), time: fxTime, position: [(c[0] + D.cityX) * h, P.deckY + c[1], D.cityZ + c[2]], height: 15, radius: [0.3, 2.2], size: [1.1, 4.6], count: 26, color: '#cfcac4', colorTop: '#efece8', shadowColor: '#9a96a0', ambient: '#6a6870', opacity: 0.42, wind: [P.wind[0] * h * 1.3, 0, P.wind[1] * 1.3], bend: 0.55 }); hazeVeil(sm.material, U); fxSet.add(sm); }
    // THE DAWN'S GROUND MIST lies where the ground is low: in the wood's hollows and along the stream (a puff is dealt over the floor and
    // kept where the ground lies 0.3 m or more under the ride's level, or within 16 m of the stream's line), and it does not lie on
    // the made ground of the open places: a puff's whole ball stands off the ride's kept width and outside the glade. Each puff
    // stands where it is dealt (it does not drift) and is a ball of half its size, with 0.03 of its size for its bob: the same law
    // of the body as the shafts' (its lots drawn here from the mist's own stream; one that would still come within 2.5 m and its
    // reach of the line is left out after its draws; the kit is handed the kept puffs' places and lots).
    if (hourName === 'dawn') {
      const lots = [], pts = [], rm = R.mist;
      for (let i = 0; i < 150; i++) {
        const x = (P.rideX + rm.range(-105, 105)) * h, z = rm.range(-80, 190), up = rm.range(0.6, 4.5), v = [rm(), rm(), rm(), rm()], s = 10 + 12 * v[0], g0 = groundW(x, z), y = g0 + up + s * 0.126;
        if (!(g0 < -0.3 || Math.abs(x * h - P.streamX(z)) < 16)) continue;
        if ((Math.abs(x * h - P.rideX) < D.rideHalf + s * 0.53 && z > 24 - s * 0.53) || Math.hypot(x, z) < D.glade + s * 0.53) continue;
        const near = P.laneW(x * h, y, z) - s * 0.53; tally.mistAll++;
        if (near < 2.5 + 0.3) { tally.mistOut++; continue; }
        pts.push([x, y, z]); for (const q of v) lots.push(q); tally.mist++; tally.mistNear = Math.min(tally.mistNear, near);
      }
      if (pts.length) { let q = 0; fxSet.add(fx.makeMist({ rng: () => lots[q++], time: fxTime, positions: pts, size: [10, 22], color: '#fbeee6', opacity: 0.17 })); }
    }
    // THE LANTERNS IN THE CLOUD: a soft glow on every lantern of the legs that hangs within the cloud's body (from 12 m under its foot to
    // 8 m over its top: a law of height), and on all of them by night: what is left of the leg as one goes up through the cloud
    { const y0 = P.cloudTop - D.slab[0] - 12, y1 = P.cloudTop + 8, lp = (SK.lamps || []).filter((q) => night || (q[1] > y0 && q[1] < y1)).map((q) => [q[0] * h, q[1], q[2]]);
      if (lp.length) fxSet.add(fx.makeGlows({ positions: lp, color: '#ffc880', size: 3.4, intensity: night ? 1.5 : 1.2, time: fxTime })); }
    if (night) { const lp = P.posts.filter((p) => p.lamp).map((p) => [(p.x + p.inw[0] * 0.55 + D.cityX) * h, P.deckY + p.y + Math.min(p.hgt, 2.9) - 0.6, D.cityZ + p.z + p.inw[1] * 0.55]); fxSet.add(fx.makeGlows({ positions: lp, color: '#ffc880', size: 2.4, intensity: 1.5, time: fxTime })); }
    await tick();
    // ---- THE CLOUD lies where it lies, by height and by place: a sea of bright heaps whose tops stand about cloudTop, with towers
    // boiling up out of it and great heaps standing on it far out; it is OPEN where its standing gaps are (the plan's list: the one
    // gap about the ladder leg and the city, the great hole under the jetty's end, six dealt ones of blue). A heap is a body: it is
    // kept out of the plan's own cuts by place, never thinned by the eye's distance (the kit shrinks a puff to the room it has
    // outside a cut, so none reaches into one). The cuts, each by its own thing's measures (none reads the line):
    //   THE CITY'S BODY: an upright cone about the raft's middle, 174 m in radius 90 m over the lowest deck, 32 m in radius 130 m
    //   under it (116 m at the lowest deck's own height, so no heap touches the raft; 90 m at the cloud's top, a little inside the
    //   gap's rim, so that heaps stand on the rim);
    //   EVERY OTHER ROUND OF A GAP: an upright shaft of 0.85 of the round's width, from 150 m under the cloud's tops (under the
    //   foot of the lowest-hanging heap the kit deals: counted on seeds 1 to 300, 143 m under the tops at the most) to 80 m over them (heaps stand
    //   on its rim). The gap about the leg and the city is one such cut from the leg's well to the raft: the
    //   ladder leg stands in it, the gangway hangs across it, and what goes from the leg to the city goes up it.
    // Its drift is the high wind's, on the clock; the gaps stand. (The rare visit: the same sea, more broken.)
    const cxh = (D.cityX + P.raftMid[0]) * h, czc = D.cityZ + P.raftMid[1], keepOut = [[cxh, P.deckY + 90, czc, 174, P.deckY - 130, 32]];
    for (const g of P.gaps) if (g.kind !== 'city') keepOut.push([g.x * h, P.cloudTop + 80, g.z, g.r * 0.85, P.cloudTop - 150, g.r * 0.85]);
    // THE CLOUD'S PICTURE. The kit makes its cloud picture (a tiling noise texture, 256 x 256) inside whichever cloud field is asked for
    // first, in one step of 60 to 140 ms on a cold start, and cannot be asked for it apart; but a field takes a picture that is handed
    // to it (the kit's own option). So the picture is made here, by the kit's own law (two channels of four octaves of lattice noise, two
    // shifted copies of the first), one octave at a time with a breath between, and handed to both fields: the far heaps, a small field,
    // then the sea.
    const cloudPic = await (async () => {
      const size = 256, N = size * size, f = [new Float32Array(N), new Float32Array(N)], rg = R.pic, ix0 = new Int32Array(size), ix1 = new Int32Array(size), wx = new Float32Array(size);
      for (let ch = 0; ch < 2; ch++) for (let o = 0, per = ch ? 16 : 4, amp = 0.5; o < 4; o++, per *= 2, amp *= 0.55) {
        const acc = f[ch], lat = new Float32Array(per * per); for (let i = 0; i < lat.length; i++) lat[i] = rg();
        for (let x = 0; x < size; x++) { const fx = x / size * per, i = Math.floor(fx), t = fx - i; ix0[x] = i % per; ix1[x] = (i + 1) % per; wx[x] = t * t * (3 - 2 * t); }
        for (let y = 0; y < size; y++) { if (y % 64 === 63) await tick(); const r0 = ix0[y] * per, r1 = ix1[y] * per, wy = wx[y];
          for (let x = 0, p = y * size; x < size; x++, p++) { const a = lat[r0 + ix0[x]], b = lat[r0 + ix1[x]], c = lat[r1 + ix0[x]], d = lat[r1 + ix1[x]], w = wx[x]; acc[p] += amp * (a + (b - a) * w + (c + (d - c) * w - a - (b - a) * w) * wy); } }
        await tick();
      }
      const norm = 0.5 * (1 + 0.55 + 0.55 ** 2 + 0.55 ** 3), data = new Uint8Array(N * 4), m = size - 1, px = (v) => Math.max(0, Math.min(255, ((v / norm - 0.5) * 1.75 + 0.5) * 255));
      for (let y = 0; y < size; y++) { for (let x = 0; x < size; x++) { const p = y * size + x, s = ((y + 89) & m) * size + ((x + 151) & m), s2 = ((y + 33) & m) * size + ((x + 201) & m); data[p * 4] = px(f[0][p]); data[p * 4 + 1] = px(f[1][p]); data[p * 4 + 2] = px(f[0][s]); data[p * 4 + 3] = px(f[0][s2]); } if (y % 64 === 63) await tick(); }
      const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.anisotropy = 4; tex.generateMipmaps = true; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
      return tex;
    })();
    const cloudCommon = { sky, noiseTexture: cloudPic, wind: [P.wind[0] * h * 1.6, 0, P.wind[1] * 1.6], avoid: keepOut, ...(night ? {} : { bottomColor: '#d3dbe8' }) };
    const farOff = (x, y, z, w) => Math.hypot(x - cxh, z - czc) > 360 + w * 0.5 && Math.hypot(x, z) > 400 + w * 0.5;
    const heaps = skyKit.makeCloudField({ ...cloudCommon, rng: R.heap, mode: 'cumulus', count: P.rare ? 22 : 16, altitude: P.cloudTop - 34, altitudeJitter: 16, size: [170, 300], height: 0.62, center: [D.cityX * 0.5 * h, 0, D.cityZ * 0.5], extent: [2600, 2600], filter: farOff });
    scene.add(heaps.object);
    await tick();
    // (the sea's heaps are asked for WITHOUT the kit's swelling of a heap's depth toward the eye: with it a broad heap standing 90 m off,
    // beyond the ladder leg, was drawn before the leg and cut it along a lumpy edge; without it a heap lies flat at its own middle's
    // distance, and the leg, which stands in the clear shaft, is always whole before it)
    const cloud = skyKit.makeCloudField({ ...cloudCommon, rng: R.cloud, mode: 'sea', altitude: P.cloudTop + 6, spacing: 62, relief: 36, towers: P.rare ? 0.5 : 0.3, deck: false, opacity: 0.94, depth: 0 });
    scene.add(cloud.object);
    // (the heaps take the cloud body's haze like every other thing: see hazePuffs in the part file)
    for (const f of [heaps, cloud]) f.object.traverse((o) => { if (o.material && o.material.name === 'KitCloudPuffs') hazePuffs(o.material, U); });
    await tick();
    // the cloud's body over the sky beyond (a standing ball about the place)
    scene.add(makeHazeSky(U, 6000));
    // ---- (the place is built here)
    await tick();
    // (the kit's birds and beasts are lost in the cloud's body as everything is: see hazeCreatures in the part file)
    hazeCreatures(scene, U);
    await sky.prewarm(ctx.renderer, null, scene);

    // ---- THE PACE: a speed in metres a second at each place of the line, in two parts, both found on the line itself; the engine scales
    // the whole to the flight's 49.5 s.
    // (1) BY THE LINE'S OWN BEND: nowhere faster than lets the heading turn at 0.47 radians (26.9 degrees) a second (so round the
    //     ladder leg the look, which keeps its angle to the heading, turns at that one rate, and round the city's north-west corner
    //     likewise), and nowhere faster than the engine's own upper bound (2.5 of the mean);
    // (2) BY PLACE, [the place's metres, m/s, held]: every key stands AT a place of the line (none at a place plus typed metres),
    //     and every key lies between 0.4 and 2.5 of the mean (8.0 to 50.2 m/s; there is no other cap): the ride's first metre and
    //     its end (20); where the round begins (22; the bend's own speed takes over); the cloud's top (29); under the gangway (31:
    //     the quick straight toward the city); where the climb comes to the rail's height (29); beside the west rail (21: its row
    //     of spyglasses); where the half turn begins and the north rail (17: the corner at one speed); the stair street's foot
    //     (19) and the fifth terrace's edge (14); the summit's two edges and the last ledge under the jetty (10.3: there the look
    //     goes down over the jetty's rail into the great hole and comes up again); the ring (42). A held speed stands; the one
    //     free key (under the gangway) is scaled so that the whole lasts 49.5 s by my own reckoning of the engine's easing; the
    //     engine then reads and scales the pace itself (see the head).
    const DUR = 49.5, mean = L / DUR, vTop = 2.5 * mean, vLow = 0.4 * mean;
    const nV = Math.floor(L / 2) + 1, vBend = new Float32Array(nV), turnRate = 0.47;
    { const t0 = new THREE.Vector3(), t1 = new THREE.Vector3(), raw = new Float32Array(nV);
      for (let i = 0; i < nV; i++) { path.tangentAtDist(Math.max(0, i * 2 - 5), t0); path.tangentAtDist(Math.min(L, i * 2 + 5), t1); const a = Math.atan2(t0.x * t1.z - t0.z * t1.x, t0.x * t1.x + t0.z * t1.z); raw[i] = turnRate / Math.max(Math.abs(a) / 10, 1e-4); }
      for (let i = 0; i < nV; i++) { let s = 0, c = 0; for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < nV) { s += Math.min(raw[j], vTop); c++; } } vBend[i] = s / c; } }
    const bendAt = (m) => { const q = clamp(m / 2, 0, nV - 1.001), i = Math.floor(q); return lerp(vBend[i], vBend[i + 1], q - i); };
    const SP = [[0, 20, 1], [pl.rideEnd, 20, 1], [pl.helix, 22, 1], [pl.cloudOut, 29, 1], [pl.gang, 31], [pl.level, 29, 1], [pl.rail, 21, 1], [pl.turn, 17, 1], [pl.northRail, 17, 1], [pl.street, 19, 1], [pl.terrace, 14, 1], [pl.summit, 10.3, 1], [pl.jetty, 10.3, 1], [pl.low, 10.3, 1], [L, 42, 1]];
    const speedF = (m, f) => { let v = SP[SP.length - 1][1] * f; for (let i = 1; i < SP.length; i++) if (m <= SP[i][0]) { v = lerp(SP[i - 1][1] * (SP[i - 1][2] ? 1 : f), SP[i][1] * (SP[i][2] ? 1 : f), smoothstep(SP[i - 1][0], SP[i][0], m)); break; } return clamp(Math.min(v, bendAt(m)), vLow, vTop); };
    // (my own reckoning of the flight: the engine eases its speed toward the pace at 1.4 a second; the free key is scaled so that
    // this reckoning lasts 49.5 s)
    const flown = (f) => { let d = 0, t = 0, v = speedF(0, f); const dt = 1 / 60, k = 1 - Math.exp(-1.4 * dt); while (d < L && t < 90) { v += (speedF(d, f) - v) * k; d += v * dt; t += dt; } return t; };
    let fLo = 0.5, fHi = 1.6; for (let i = 0; i < 16; i++) { const f = (fLo + fHi) / 2; if (flown(f) > DUR) fLo = f; else fHi = f; await tick(); }
    const fFree = (fLo + fHi) / 2, speedAt = (m) => speedF(m, fFree);
    // ---- THE GAZE: five pulls of the look, each of weight 1 and each a window between two places of the line, laid one over the
    // next: the engine takes them in order, so where a later pull is whole it alone holds the look, and a hand-over is one turn
    // from the earlier look to the later across a stretch that is itself the way between two places. The engine's bell gives a pull the same ramp at both ends (a share of its
    // window); so each share below is written as one stretch between places over the window's length, never as a typed number.
    const RAD = Math.PI / 180, ramp = (a, b, m) => Math.min(0.5, m / (b - a));
    // lookBy: a point 200 m off (far enough that the look's angle is the same from every metre of the line near by) along the line's
    // own level heading at u, turned 'yaw' degrees toward the left hand (the ladder leg's and the hole's side for the hand +1) and
    // raised 'pitch' degrees: the look kept level while the line climbs, by the line's own heading. 'share', where given, is how
    // much of that turn is on at a metre of the line (0 to 1, by places): the look then stands turned that share of 'yaw' and raised
    // that share of 'pitch' (the side turn and the up turn go together, evenly). 'headFrom', where given, is a place of the line:
    // before it the heading is taken AT that place (the look then stands by that place's own line, not by the bends that lead to it).
    const lookBy = (yawDeg, pitchDeg, share = null, headFrom = 0) => { const v = new THREE.Vector3(), pp = new THREE.Vector3(), pt = new THREE.Vector3(), u0 = headFrom / L;
      return (time, u) => { const k = share ? share(u * L) : 1, a = yawDeg * RAD * h * k, p = pitchDeg * RAD * k, ca = Math.cos(a), sa = Math.sin(a), cp = Math.cos(p), sp = Math.sin(p); path.pointAt(u, pp); path.tangentAt(Math.max(u, u0), pt); const hl = Math.hypot(pt.x, pt.z) || 1, dx = pt.x / hl, dz = pt.z / hl;
        return v.set(pp.x + (dx * ca + dz * sa) * cp * 200, pp.y + sp * 200, pp.z + (dz * ca - dx * sa) * cp * 200); }; };
    // ease: a share that goes from 0 at the place a to 1 at the place b evenly, eased over a first and a last quarter of the way (at
    // its fastest a third over its mean)
    const ease = (a, b, m) => { const x = clamp((m - a) / (b - a), 0, 1); return x < 0.25 ? x * x * 8 / 3 : x > 0.75 ? 1 - (1 - x) * (1 - x) * 8 / 3 : (x - 0.125) * 4 / 3; };
    // the city's place the look rests on: on its axis (the stair street's line) at the raft's middle from north to south, at the height
    // of its second terrace
    const cityAt = new THREE.Vector3(D.cityX * h, P.deckY + P.H(2), D.cityZ + P.raftMid[1]);

    return {
      scene, path, duration: DUR,
      title: night ? 'The City on Stilts Above the Cloud, by Moonlight' : 'The City on Stilts Above the Cloud',
      // (no bank and no sway: the camera never rolls)
      camera: { fov: 64, near: 0.3, far: 12000, lookAhead: 24, sway: 0, bank: 0 },
      pace: (u) => speedAt(u * L) / mean,
      pois: [
        // THE CLIMB: up and out, not into the timber: turned D.climbSide (57) degrees toward the ladder leg's side of the line's level heading and
        // raised 6 (the leg then stands a slim thing by the picture's one edge while the wood from above, the city's shadow on it,
        // the city's own legs and the cloud's underside pass behind it). The turn grows over the ride, from nothing at the first
        // metre to whole where the round begins; the pull is let go through the cloud's depth, where the city's look has it whole.
        { at: lookBy(D.climbSide, D.climbUp, (m) => ease(0, pl.helix, m)), from: 0, to: uM(pl.gang), weight: 1, fade: ramp(0, pl.gang, pl.gang - pl.cloudIn) },
        // THE CITY, the thing climbed toward: taken up on the round from where the city's middle stands at the climb's own look
        // (the place 'cross': the look then goes over to the city with no jump) to the cloud's foot, whole from there: up the cloud's standing gap about the leg and the city with
        // the city overhead, out of its top, under the gangway and along the straight toward it; let go by the same measure before
        // the west rail, where the corner's look has come
        { at: cityAt, from: uM(pl.cross), to: uM(pl.rail), weight: 1, fade: ramp(pl.cross, pl.rail, pl.rail - pl.level) },
        // BESIDE THE WEST RAIL AND ROUND THE NORTH-WEST CORNER: the look turned 62 degrees toward the town (by the line's own
        // heading), a little under the level; it comes from where the climb comes level with the rail to the raft's west rail
        // itself, is whole beside the rail and round the half turn (the terraces on the turn's inner side, the cloud's sea beyond
        // them) and goes by the same measure before the stair street's foot
        { at: lookBy(-62, -3, null, pl.rail), from: uM(pl.gang), to: uM(pl.summit), weight: 1, fade: ramp(pl.gang, pl.summit, pl.level - pl.gang) },
        // UP THE STAIR STREET, from over the north rail to the summit's edge: the look kept 12 degrees up along the street while the
        // line climbs; it comes over the corner's last stretch (north rail to the street's foot) and goes by the same measure
        { at: lookBy(0, 12), from: uM(pl.northRail), to: uM(pl.summit), weight: 1, fade: ramp(pl.northRail, pl.summit, pl.street - pl.northRail) },
        // FROM THE SUMMIT AND THE JETTY: down and out over the jetty's rail into the cloud's great hole and the land in it
        // (D.holeSide degrees to the hole's side of the walk's own line, D.holeDown under the level). The pull's window is from
        // the fifth terrace's north edge to the line's first sampled metre past the raft's south rail under the walk (the window
        // ends 63 m before the ring; the rail is crossed 64 m before it); it comes over the last
        // flight of the stair street, while its look is still the line's own level heading (the stair street's look goes over the
        // same metres), and it goes by the same measure before the raft's south rail: that going is the look's lifting to the ring.
        // The look itself goes down by places: from the summit's north edge, across the square, to THE FOOT OF THE JETTY'S OWN STEPS
        // (pl.steps: 9.6 m along the jetty, beyond its landing and its flight of eight steps, 6.6 m beyond the square's south rail;
        // there the walk has come down to its own level, so that it and its rail lie their full 8.4 m under the line and the look
        // goes out over the rail into the hole). There the look comes to its lowest, as the pull's own going begins (that going
        // begins a summit square's length before the raft's south rail, which is 2 m before the steps' foot on the line as it is
        // sampled) and lifts it over the south terraces' ledges. Over the last 63 m, over the hole, the look is the line's own.
        { at: lookBy(D.holeSide, -D.holeDown, (m) => ease(pl.summit, pl.steps, m)), from: uM(pl.terrace), to: uM(pl.southRail), weight: 1, fade: ramp(pl.terrace, pl.southRail, pl.jetty - pl.summit) },
      ],
      portal: { shape: 'circle', radius: 7, color: night ? '#ffd9a0' : '#ffe9b8', glow: 1, revealDistance: 320 },
      post: {
        exposure: HR.exposure, bloom: { strength: night ? 0.55 : 0.3, radius: 0.6, threshold: 0.93 },
        grade: { saturation: night ? 1.0 : 1.12, contrast: 1.08, tint: '#ffffff', shadowTint: night ? '#0a1030' : '#16243a', vignette: 0.24, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        U.uKTime.value = time; fxTime.value = time;
        sky.update(dt, time, camera); rig.update(dt, time); terrain.update(dt, time);
        // (the low plants are not asked to cull by the eye: only their wind runs)
        wind.update(time);
        stream.update(dt, time, camera); fa.update(dt, time, camera, 0); fxSet.update(dt, time, camera); heaps.update(dt, time, camera); cloud.update(dt, time, camera);
      },
      dispose() { sky.dispose?.(); planTex.dispose(); cloudPic.dispose(); terrain.dispose?.(); },
    };
  },
};
