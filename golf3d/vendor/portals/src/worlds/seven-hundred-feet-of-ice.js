// Seven Hundred Feet of Ice
//
// North up a snowbound forest road to a pale line across the whole horizon that grows into a wall of ice 213 m high; past
// a ruined holdfast and the riders' fork, in among the towers and timber halls of the castle huddled at its foot; up
// beside its built face of great blocks, level and 50 m and more off it, past the switchback stair with its lanterns and
// the cage on its chains; over the lip, out over the southern edge, along the top's middle among fires, sheds, engines
// and cranes, out over the northern edge; down over the great blocks of fallen ice at the north foot and the frozen river
// that runs out of them, over a wide belt of open snow (copses of young spruce, dark rocks, wind-carved drifts) and
// along the kept way that crosses it (a sledge's track between lines of young spruce, low cairns at its edges),
// through the
// dark wood between old trunks, to an avenue of great white trees with red leaves. The portal stands at the avenue's
// end, between the two that flank it, its light on the snow and the trunks.
//
// The place is laid out by arithmetic in the part (icePlan): the same plan serves this build and the builder's replay.
// It is drawn in one hand and mirrored here by the seed's own draw (plan.hand).
//
// THE PLACE STANDS. One sun, one sky light and one fog are set at build and never written again. The sky is clear and
// cold; by day the sun stands low (some twelve degrees up, off to one side of the road). The light differs by PLACE,
// because of the place: the low sun lies on the road, the castle and the south face (rose gold up high, paler toward
// the foot); every tree, tower and hall south of the wall throws a long shadow on the snow (a map of the ground worked
// out once at build, the part's shadeMapSteps); the wall throws its own shadow some hundreds of metres north, and the far
// wood and the mountains beyond it stand in the sun. The wind takes snow off the top and it sifts down in the wall's lee
// all the while. Every material works the light out for each point it draws by THAT POINT'S own place (the part's
// G_COMMON and placeLit), so a northern tree is as blue seen from the top of the wall as seen beside it; only the air
// between differs, counted along the ray (the one fog, the dawn mist at the south foot). Where no sun reaches, the sky's
// light has a side to it. THE FIRES stand and burn for the whole visit: the braziers of the top, the braziers, door
// lanterns and lit windows of the castle, the lanterns at the stair's landings, and the ring itself light the snow, the
// ice, the stone, the timber and the trunks about them, each by its own place (the part's fireAt, fireLists, ringAt). In
// the lee the trees carry snow on whatever of them looks up. The kit's birds, elk, smoke and leaves take the one fog and
// a light given at build. Nothing begins, turns or ends because the visitor comes; no figure regards the visitor.
// WHAT IS DRIVEN BY WHAT
// by the world's clock alone (each a round or a run of its own, the same for a visitor who stands still): meltwater and
//   its glints, the shadows of passing clouds, blown snow and spindrift, small falls of ice down the south face (shards
//   and their powder, each fall a round of its own), the powder of pines shedding their snow, fires and the flicker
//   of their light, smoke, the cage up and down on its chains, the men who pace the top, the men on the stair, the men who cross the yard, the riders round their course (out of the tunnel,
//   down the road, away by the fork) with their cloaks blowing, ravens, elk, the sifting snow (each flake about a home
//   of its own in a lattice fixed in the world), the falling leaves of the grove
//   (the kit's flocks, herd, smoke and leaves move by that clock; the kit is handed the camera with it, for its own
//   use: it draws a member of a flock or a herd only within the fog's reach of the eye. That is the kit's doing)
// by nothing (standing): everything else; on a rare day a great block of the wall lies fallen and shattered at the south foot
// by where the visitor's eye is, in metres (rules of drawing: none sets the light, the weather or what is there; none knows
//   a share of the flight, a seed or a clock):
//   1 no tree, stone or made thing comes or goes by the eye's distance: every one is drawn at whatever distance it
//     stands (the kit is given no cull distance). The renderer leaves out a mesh that lies wholly outside the picture's
//     field (the forests stand in chunks and tiles for that): zero pixels
//   2 what the wall hides is not drawn, and only that. THE NORTH (its fine ground, its far high ground, its woods,
//     stones, beasts and leaves) is left out while the eye is south of the top's southern edge AND under the line drawn
//     back from that edge at the slope of the steepest sight line from the edge up to any point of the far high ground
//     (the part's northHidden; the slope is the plan's P.highK, 0.10 to 0.16 on seeds 1 to 300). Under that line the
//     wall's own body stands before the whole of the north. The north comes on as the eye crosses the line: on the
//     climb, 5.1 to 8.4 m under the level of the top, while the highest point of the high ground still stands 0.38
//     degrees and more UNDER the crest (counted on seeds 1 to 300 with the camera's sway, m1-high.mjs: none of it over
//     the crest on any seed; round 4 switched 4 m under the top, when high ground already stood over the crest).
//     THE SOUTH (the fine ground of the road and the castle, the castle, its woods, men and smoke) is left out while
//     the eye is north of the wall's north foot and more than 4 m under its top (the part's southHidden): nothing of
//     the south stands as high as the top
//   3 of the endless lattice of sifting flakes only the cells within 36 m of the eye are drawn, fainter with distance.
//     Whether a flake is there is by its own place
//   4 the air between the eye and a seen point is counted along that ray (fog, mist): the eye is the ray's near end
//   5 the small falling things are media and take a law of nearness: no flake is drawn within 2.7 m of the eye and each
//     is whole by 6 m (the field's own law); no leaf's middle within 2.9 m, each whole by 6.5 m (the kit's law, with
//     these numbers); a puff of chimney smoke thins as the eye comes into it (the kit's law; the plan keeps every
//     column's farthest puff 3 m clear of the line, as it keeps every made thing, and the corners of the sheets the
//     puffs are drawn on 2.5 m clear of it)
//   6 makes by distance: the same form, told finer when near. None of them builds a thing or leaves one out, and none
//     stands in for a thing that is built: the one stand-in of this world, the painted wood beyond the built country,
//     is laid by place (THE WOOD, below). THE WHOLE LIST:
//     the ice: its relief is read over a step that widens with distance; its joints, fractures and clefts are drawn as
//       wide as they can be seen, and wider and fainter still where the face is seen along its length or down its
//       height (by the direction to the eye and the face's lean: a pixel's reach on the face is longer that way);
//       the single block (its tone, its tilt) within 90 to 300 m, upright joints within 70 to 240 m, bed joints within
//       180 to 520 m, the net of fractures on a block within 90 to 300 m, the long fractures fainter over 220 to
//       800 m, ledges, sheets and the seams of old ice fainter over 300 to 900 m, icicles singly while a pixel's
//       reach along the face is well under their spacing (never beyond 380 m) and as a pale fringe beyond, meltwater
//       runnels within 180 to 520 m, the crack-scale relief and the film of meltwater within 160 to 600 m, the grain,
//       the frost's crust and its sparks, the wisps of milky ice and the grit within 25 to 110 m; bands of gravel a
//       little stronger far off
//     the snow: its fine drifts within 60 to 240 m; the wind-carved ridges of open snow within 250 to 700 m; the
//       talus's rubble within 200 to 600 m; the river's cracks within 60 to 200 m and the dark of its banks within 300
//       to 900 m; the fallen leaves singly within 50 to 130 m, farther off as their own mean on the snow (a leaf covers
//       0.177 of its cell; the share of cells that hold one is the place's; no more red than that is laid); the
//       hoof-marks of the road and the way singly within 30 to 90 m and their ruts' dark within 120 to 300 m, farther
//       off as their own means on the track (a track is as dark far off as near); the streaks of blown snow within
//       110 to 380 m;
//       glints within 20 to 80 m and the crust's sparkle toward the sun within 40 to 420 m; the painted crowns of
//       the far wood singly within 0.9 to 2.2 km of the eye, as a closed wood beyond (THE WOOD, below, says how dark)
//     stone and timber: the joints of courses and logs within 70 to 260 m, drawn as wide as they can be seen; each
//       stone's own grey fainter over 150 to 500 m
//     the kit's trees: the plates and furrows of their bark fade as they come under a pixel
//     a far fire: a bead of light that comes up over 140 to 460 m
//   7 what is flat is turned to the eye, and a glint is a mirror's: a flame is a flat sheet turned about the upright to
//     face the eye, a flake a small disc facing it, a puff of smoke a disc facing it; the sun's glint on ice, meltwater,
//     frost and the snow's crust and the sky's on the river's bare ice are seen where eye, face and light make the angle
//     (the direction to the eye, nothing else of the eye); a bough shows its snow on the side of it that is seen and
//     looks up
// THE WOOD, BUILT AND PAINTED (the far stand-in, declared): trees are built, tree by tree, within 400 m of the made
//   ways of the place (the road to its head; the wall from the gate's meridian to the foot of the way to the grove;
//   that way to the ring): every cell of 14 m is dealt at nine tenths of the place's woodedness, by the visit's
//   density. From 400 to 500 m of those ways the share that is built falls evenly to none, and over the same band the
//   snow's painted crowns come in, filled at the same nine tenths of the place's cover and the same density (at full
//   cover and density 1: 46 to the hectare, built or painted; the painted ones in two turned lattices of 19.8 m
//   cells). Beyond 500 m the wood is painted only. Where it is built and where painted is by place alone: it follows
//   neither the eye, the clock nor the flight. ONE FILTER BY THE EYE'S DISTANCE is laid on the painted crowns: beyond
//   0.9 to 2.2 km of the eye a crown is too small to tell, and the painted wood is drawn closed there at eight tenths
//   of the place's cover. That is darker than the crowns' share of the ground seen straight down (a fifth of the
//   cover): a standing wood seen far off and low shows crown before crown and none of its floor. It is a stand-in's
//   tone, declared here, not the plan mean of the crowns.
// THE MADE WAYS OF THE PLACE (the part's plan) and what keeps off them: THE ROAD (no thing of the yard within 7.5 m of
//   its middle); THE KEPT WALK down the middle of the wall's top, 2.2 m to either side of the wall's axis, swept and
//   gritted, with every fire, shed, store, engine, crane and sentry to its two sides; THE WAY TO THE GROVE, straight
//   from the toe of the wall's northern apron to the ring: as far as the avenue's head 9 m to either side kept clear
//   of everything (no stem's foot, no part of a stone, stump, fallen trunk or cairn), the blocks of the talus and
//   the fallen ice at its foot too, and round its first point on every side (its trodden
//   track runs down its middle), verges of 5 m more (young spruce, stumps, and the way's low cairns at the kept
//   width's edge, no young spruce's bough within 3 m of one), its own lines of young spruce along both sides, old
//   trunks left standing along both its edges in the wood, the wood's other great trunks felled within 22 m of its
//   middle; in the grove the avenue's aisle takes over, with its own width (8.5 m to either side: the great
//   trees' feet stand at its edge). THE HERD OF ELK stands in the wood square off that way's axis, on one
//   hand or the other, its whole round beyond the verges, the aisle and the ring (the part's planLife; the kit is
//   handed no path). These are measured from the ways, never from the line that is flown. THE PLAN COMES FIRST AND THE LINE AFTER (the part's planPlaces, then planRoute): the castle's threshold, the
//   talus, the river, the grove and the way to it stand by the wall's own measure and their own draws; the line is
//   then laid along the road, slantwise across the walk 7.6 m and more over it, and down TO the way to the grove,
//   which it comes onto 56 to 220 m before the wood opens. For the line's own sake a thing is left out only where the
//   line would pass within its true clearance (2.5 m and the thing's own allowance: the part's P.keep, each thing
//   measured as it is made).
// by the film: ITS PACE (the plan's pace by place, P.ramps: the road at one pace; slower round the castle's arc; fastest
//   up beside the face and over the lip; a little slower along the top; fastest again down the descent; slower round
//   the low turn; the engine's least pace, a walk, from 50 m before the wood opens to the ring. As flown, the film is
//   48.1 s long and goes at 64 to 67 m/s on the road, 50 to 53 round the castle, 77 to 82 up the face, 71 to 74 over
//   the top, 79 to 83 down the descent, 49 to 64 round the low turn and along the way, 11.2 to 11.8 under the avenue
//   (seeds 1 to 300, m1-speeds.mjs)), and THREE PULLS OF THE GAZE, end to end and no two at once, each toward a
//   standing place of the plan over a stretch of the line between named places of the line (the plan's pois; the
//   metres along the line are counted on seeds 1 to 300; the first two come on and go off over 150 m at each end, the
//   third over 0.45 of its stretch):
//   1 from 60 m before the line comes abeam of the face (metre 438 to 480) to 30 m before it comes level with the lip
//     (metre 816 to 890): toward a place 40 m up, 1,700 m east of where the slant across the top begins and 520 m south
//     of the climb's line (the far country south-east of the wall, at the horizon's height)
//   2 from there to where the line passes over the top's middle (metre 1,174 to 1,264): toward the snow 140 m south
//     of the south foot, 520 m east of that crossing
//   3 from there to 60 m after the line begins to sink (metre 1,530 to 1,634): toward the wood 620 m north of the
//     wall, 1,300 m east of where the line leaves the top
//   Each of the three places is measured from the wall, the slant and the climb; none is taken from a picture.
// NO PACING IS DECLARED: nothing follows the metres flown.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import {
  icePlanSteps, makeUniforms, makeMaterials, wallSet, landSteps, Solid, towerInto, castleSteps, fireLists, gateInto, yardInto, rocksInto, waysInto, holdfastInto, blockInto, capeGeometry, instanced, matAt, veilMat, sheetGeometry,
  figureGeometry, horseGeometry, legGeometry, farPineGeometry, moundsSteps, northHidden, southHidden, shadowGeometry, shadeMapSteps, highlandSteps, talusGeometry, placeLit, flakeField, footIceGeometry, faceZ, WALL_H, DURATION, CAMERA, RING_R, SMOKE, LEAVES,
} from '../parts/seven-hundred-feet-of-ice.js';

// the four hours: the kit's sky, how bright the picture is held, how far the clear air reaches, how wet the ice, how the fires
// tell, how thick the morning's mist lies at the south foot (a share of the light lost in each metre at the ground), how
// much of the sun's light a thrown shadow takes (sat: how much colour the picture keeps; the night is silvered)
// (the sky has form: banks of cloud with their shaded undersides and streaks of high cloud over them, and by day the low
// sun's pale band along its side of the horizon; the clear air reaches far enough for the wall's length to be seen
// running off both ways before the distance takes it. All of it is set once, here)
const HOURS = {
  // (the day is a LOW SUN late on a clear cold day: the kit's low-sun sky toned to rose gold, its blue kept overhead, few clouds, clear air)
  day: { preset: 'goldenHour', exposure: 0.95, fogDen: 0.00026, wet: 0.5, glint: 1, fire: 1.0, mist: 0, shadow: 1, sky: { clouds: { coverage: 0.34, scale: 0.8, softness: 0.3, detail: 0.7 }, clouds2: { opacity: 0.4, coverage: 0.5 }, horizon: '#efc4a4', scatterColor: '#ffab6a', scatter: 0.6, lightColor: '#ffbd88', lightIntensity: 3.0, ambientColor: '#a3b8ea' } },
  golden: { preset: 'goldenHour', exposure: 1.0, fogDen: 0.00034, wet: 0.6, glint: 0.9, fire: 1.0, mist: 0, shadow: 1, sky: { clouds: { coverage: 0.5, scale: 0.8, detail: 0.7 }, clouds2: { opacity: 0.45 } } },
  dawn: { preset: 'dawn', exposure: 1.05, fogDen: 0.00034, wet: 0.3, glint: 0.7, fire: 1.1, mist: 0.012, shadow: 0.9, sky: { clouds: { coverage: 0.44, scale: 0.8, detail: 0.7 }, clouds2: { opacity: 0.5 } } },
  night: { preset: 'night', exposure: 1.3, fogDen: 0.0003, wet: 0.12, glint: 0.6, fire: 1.5, mist: 0, shadow: 0.75, sat: 0.74, sky: { clouds: { coverage: 0.38, scale: 0.8 } } },
};

export default {
  id: 'seven-hundred-feet-of-ice',
  name: 'Seven Hundred Feet of Ice',
  category: 'books',
  placeKind: 'wilderness',
  book: 'A Game of Thrones',
  author: 'George R. R. Martin, born 1948',
  media: ['air', 'open'],
  weirdness: 0.45,

  async build(ctx) {
    const seed = ctx.seed, detail = ctx.quality?.detail ?? 1, H = WALL_H;
    const tick = () => ctx.yield();
    // run a part's steps, handing the page back at each of them
    const run = async (it) => { let r = it.next(); while (!r.done) { await tick(); r = it.next(); } return r.value; };
    const P = await run(icePlanSteps(seed, ctx.vary || {}));
    const hand = P.hand, hour = HOURS[P.hour] || HOURS.day;
    const scene = new THREE.Scene(), root = new THREE.Group();
    root.scale.x = hand; scene.add(root);
    const mirrored = P.pts.map((p) => [p[0] * hand, p[1], p[2]]);
    await tick();
    const path = makePath(mirrored);
    await tick();
    const heightAt = (x, z) => P.groundAt(x * hand, z);
    const geos = [], kits = [];
    await tick();

    // the sky and the light of the hour: the key light stands in the south, on the side the visitor travels along the top
    const az = 180 - hand * P.sunOff;
    const sky = makeSky({
      rng: makeRng(hashSeed('ice-sky:' + seed)), preset: hour.preset, lightElevationMin: 6, ...hour.sky,
      ...(P.hour === 'night' ? { bodyOverrides: { 0: { elevation: P.sunEl, azimuth: az, phase: 1, size: 2.3 } } } : { sunElevation: P.sunEl, sunAzimuth: az }),
    });
    await tick();
    scene.add(sky.object);
    // ONE sun, ONE sky light and ONE fog for the whole visit: none of them is written again after this
    const rig = makeLightRig(sky, { bounce: 0.5, follow: false });
    scene.add(rig.object);
    const north = sky.colorAt(new THREE.Vector3(0, 0.03, -1), new THREE.Color());
    const fogSouth = sky.fogColor.clone().lerp(north, 0.6);
    scene.fog = new THREE.FogExp2(fogSouth.clone(), hour.fogDen);
    await tick();
    const U = makeUniforms(P), M = makeMaterials(U);
    const k = 1 / Math.PI;
    U.uSun.value.copy(sky.lightDirection);
    U.uSunCol.value.copy(sky.lightColor).multiplyScalar(sky.lightIntensity * k);
    const skyAmb = sky.ambientColor.clone().multiplyScalar(sky.ambientIntensity * k);
    // snow gives back the light it gets: the ground's light is a share of the sky's and of the sun's
    const gndAmb = skyAmb.clone().multiplyScalar(0.55).add(U.uSunCol.value.clone().multiplyScalar(0.12));
    // the wall's own shadow, a standing state of the country north of it: the sky's light there is a little bluer and
    // deeper (no sunlit snow lies about to give its light back). Every material works it out from the place of the point
    // it draws (the part's G_COMMON and placeLit); nothing here is written again after the build
    const lum = skyAmb.r * 0.25 + skyAmb.g * 0.6 + skyAmb.b * 0.15;
    const skyShade = skyAmb.clone().lerp(new THREE.Color(lum * 0.78, lum * 1.0, lum * 1.4), 0.5);
    U.uSky.value.copy(skyAmb); U.uGnd.value.copy(gndAmb); U.uFog.value.copy(fogSouth); U.uFogDen.value = hour.fogDen;
    U.uSkyN.value.copy(skyShade);
    U.uAmbN.value.setRGB(0.86, 0.96, 1.14);
    U.uWet.value = hour.wet; U.uGlint.value = hour.glint; U.uFire.value = hour.fire;
    U.uShadow.value = hour.shadow;
    U.uMist.value = hour.mist; U.uMistCol.value.copy(fogSouth).multiplyScalar(1.08).add(U.uSunCol.value.clone().multiplyScalar(0.07));
    await tick();

    // the ground, the wall and all that is on it
    const land = await run(landSteps(P));
    const south = new THREE.Group(), northG = new THREE.Group(), both = new THREE.Group();
    root.add(south, northG, both);
    for (const g of [land.coarse, land.south, land.north]) geos.push(g);
    both.add(new THREE.Mesh(land.coarse, M.snow)); south.add(new THREE.Mesh(land.south, M.snow)); northG.add(new THREE.Mesh(land.north, M.snow));
    await tick();
    // the high ground of the far north: wooded ridges about the river's valley, mountains beyond them
    const high = await run(highlandSteps(P));
    northG.add(new THREE.Mesh(high, M.snow)); geos.push(high);
    await tick();
    const wall = await run(wallSet(P, U, M));
    both.add(wall.group); geos.push(...wall.geos);
    await tick();

    // the castle at its foot
    const cs = new Solid(), lamps = await run(castleSteps(cs, P));
    gateInto(cs, P);
    yardInto(cs, P);
    await tick();
    // the covered ways between them; by the road the ruined holdfast and the waymark at the fork; on a rare day the fallen block
    waysInto(cs, P);
    await tick();
    if (P.holdfast.on) towerInto(cs, P.holdfast.tower, makeRng(hashSeed('ice-holdfast-tower:' + seed)));
    holdfastInto(cs, P, makeRng(hashSeed('ice-holdfast-walls:' + seed)));
    await tick();
    blockInto(cs, P);
    await tick();
    const castle = new THREE.Mesh(cs.geometry(), M.built);
    south.add(castle); geos.push(castle.geometry);
    await tick();
    // ITS FIRES AND LAMPS, each standing where it stands and burning for the whole visit: braziers in the yard with their
    // flames, the lantern over the door of every hall where men live and the firelight in its doorway, the shuttered
    // lights that are lit, the lamps behind the high lights of the towers. The part's fireLists says which of them light
    // the snow, the stone and the timber about them (the braziers, the door lanterns, the low windows) and puts them in
    // the shaders' two lists once, here, in the plan's own hand; a light it could not list is not lit at all
    const yd = P.castle.yard, cl = [], FL = fireLists(P, lamps), dark = new Set(FL.dark);
    for (const t of yd.things.filter((q) => q.kind === 'brazier' && !dark.has(q))) { const y = P.groundAt(t.x, t.z) - 0.15; cl.push({ x: t.x, y: y + 1.05, z: t.z, a: [2.2, t.seed, 0] }, { x: t.x, y: y + 0.5, z: t.z, a: [10, t.seed, 1] }, { x: t.x, y: y + 0.2, z: t.z, a: [3.2, t.seed, 3] }); }
    for (const q of lamps) if (!dark.has(q)) { cl.push({ x: q[0], y: q[1] - q[3] / 2, z: q[2], a: [q[3], q[4], 3] }); if (q[5] === 'door') cl.push({ x: q[0], y: P.groundAt(q[0], q[2]) + 0.3, z: q[2], a: [7.5, q[4], 1] }); }
    const lights = instanced(sheetGeometry(false), M.flame, cl, (i, m, f) => m.makeTranslation(f.x, f.y, f.z), { name: 'aFl', size: 3, fill: (i, f, arr) => arr.set(f.a, i * 3) });
    lights.renderOrder = 3; south.add(lights); geos.push(lights.geometry);
    FL.a.forEach((q, i) => U.uFYa.value[i].set(q.x, q.y, q.z, q.w)); FL.b.forEach((q, i) => U.uFYb.value[i].set(q.x, q.y, q.z, q.w)); U.uFYcut.value = FL.cut;
    // the men of the yard: those who stand at the braziers, those who walk a beat along the front of a hall
    const yardMen = [...yd.men.map((q) => ({ k: 0, q })), ...yd.beats.map((q) => ({ k: 1, q, len: Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) }))], ym4 = new THREE.Matrix4();
    const yfig = instanced(figureGeometry(), M.solid, yardMen, (i, m, f) => (f.k === 0 ? matAt(m, f.q.x, P.groundAt(f.q.x, f.q.z) - 0.05, f.q.z, f.q.face, 1.22) : m.makeScale(0, 0, 0)));
    south.add(yfig); geos.push(yfig.geometry);
    kits.push((dt, time) => {
      for (let i = yd.men.length; i < yardMen.length; i++) {
        const f = yardMen[i], q = f.q, cyc = (time * 0.75 * q.sp) / f.len + q.ph * 2, t = cyc - Math.floor(cyc), tri = smoothstep(0, 1, t < 0.5 ? t * 2 : 2 - t * 2);
        const x = lerp(q.a[0], q.b[0], tri), z = lerp(q.a[1], q.b[1], tri), yaw = Math.atan2(q.b[0] - q.a[0], q.b[1] - q.a[1]) + (t < 0.5 ? 0 : Math.PI);
        matAt(ym4, x, P.groundAt(x, z) - 0.05 + 0.03 * Math.sin(time * 7 + i), z, yaw, 1.22); yfig.setMatrixAt(i, ym4);
      }
      yfig.instanceMatrix.needsUpdate = true;
    });
    await tick();
    // north of the wall, where no sun reaches, the dark about each tree's foot (the long shadows south of the wall are
    // made with the forests, below: the snow's own shade map)
    const shNorth = new THREE.Mesh(shadowGeometry(P, 'north'), M.shade);
    shNorth.renderOrder = -2;
    northG.add(shNorth); geos.push(shNorth.geometry);
    await tick();

    // stones, fallen trunks, stumps and the way's cairns in the snow of the northern wood
    const rs = new Solid();
    for (let i = 0; i < P.rocks.length; i += 30) { rocksInto(rs, P, i, i + 30); await tick(); }
    const rocks = new THREE.Mesh(rs.geometry(), M.solid);
    northG.add(rocks); geos.push(rocks.geometry);
    await tick();

    // the fall of broken ice along the north foot: blocks of two makes, each sized, turned, tilted and sunk by the plan's numbers
    for (const which of [0, 1]) {
      const list = P.footIce.filter((b) => b.var === which);
      const mesh = instanced(footIceGeometry(which), M.solid, list, (i, m, b) => matAt(m, b.x, b.y - b.size * (0.08 + 0.3 * b.seed), b.z, b.rot, b.size, b.size * (0.8 + 0.5 * ((b.seed * 7) % 1)), b.size, (b.seed - 0.5) * 0.8));
      northG.add(mesh); geos.push(mesh.geometry);
      await tick();
    }

    // the talus at the north foot: its great blocks (three makes), each sized, turned, tilted and sunk by the plan's numbers
    for (const which of [0, 1, 2]) {
      const list = P.talusBlocks.filter((b) => b.make === which);
      const mesh = instanced(talusGeometry(which), M.solid, list, (i, m, b) => matAt(m, b.x, b.y + b.hs * (0.5 * b.tall - 0.28), b.z, b.rot, b.hs, b.hs * b.tall, b.hs, b.pitch));
      northG.add(mesh); geos.push(mesh.geometry);
      await tick();
    }

    const W ={ P, U, M, scene, root, south, northG, both, path, heightAt, hand, hour, detail, seed, tick, geos, kits, sky, rig, wall };
    await buildForests(W);
    // THE LONG SHADOWS of the low sun south of the wall: laid down once, here, from every tree's, tower's and hall's own
    // place (the part's shadeMapSteps), and read by the snow where it lies
    const shade = await run(shadeMapSteps(P));
    U.uShadeMap.value = shade.tex; U.uShadeBox.value.set(...shade.box);
    W.drop.push(() => shade.tex.dispose());
    await buildLife(W);
    await buildFalls(W);
    await sky.prewarm?.(ctx.renderer, null, scene);

    const eye = new THREE.Vector3();
    return {
      scene, path, duration: DURATION, pace: P.pace, camera: CAMERA,
      // the plan's three pulls of the gaze (the part's icePlanSteps says where each looks and over which metres), in this world's hand
      pois: P.pois.map((q) => ({ ...q, at: new THREE.Vector3(q.at[0] * hand, q.at[1], q.at[2]) })),
      // the ring: 7.5 m in radius at the avenue's end, a warm pale gold against the blue shade (its light on the snow and
      // the trunks about it is the part's ringAt: by place, constant)
      portal: { shape: 'circle', radius: RING_R, color: '#ffe2b0', glow: 1.3 },
      post: { exposure: hour.exposure, bloom: { strength: 0.42, radius: 0.6, threshold: 0.9 }, grade: { saturation: hour.sat ?? 1.06, contrast: 1.06, vignette: 0.26, grain: 0.015, aberration: 0 } },
      update(dt, time, camera) {
        camera.getWorldPosition(eye);
        U.uTime.value = time; U.uCloudOff.value = time * P.cloudSpeed * 0.0017;
        // what the wall hides is not drawn (the only thing of the world's own that reads where the eye is: the part's
        // northHidden and southHidden say when the wall's body stands before the whole of a country; the kit's things
        // of each country, which stand in the scene's own hand, go with it. The kit's sky, smoke, flocks, herd and
        // leaves are handed the camera below for the kit's own use)
        const showN = !northHidden(P, eye.y, eye.z), showS = !southHidden(eye.y, eye.z);
        northG.visible = W.northK.visible = showN; south.visible = W.southK.visible = showS;
        sky.update(dt, time, camera);
        wall.update(time);
        for (const f of W.kits) f(dt, time, camera, eye);
      },
      dispose() { for (const g of geos) g.dispose(); for (const m in M) M[m].dispose(); sky.dispose?.(); for (const d of W.drop || []) d(); },
    };
  },
};

// the forests: far pines as plain cones on both sides, the kit's snow-laden spruces by the road and north of the wall, great dark
// trunks in the old wood about the way to the grove, the white trees of the grove (the two greatest stand by the ring,
// measured by the plan). Every tree stands at the height the plan gave its foot (under the drawn ground beneath it),
// upright (no tilt is given to the kit), with a mound of snow at its foot
async function buildForests(W) {
  const { P, U, M, scene, south, northG, hand, heightAt, seed, tick, geos, sky } = W;
  // what the wall hides is not drawn: the kit's things stand in the world's own hand, in two groups of their own
  const southK = W.southK = new THREE.Group(), northK = W.northK = new THREE.Group();
  scene.add(southK, northK);
  // the far pines stand in tiles 420 m square, each with its own bounds, so that only the tiles in sight are drawn
  // (north of the wall they carry more snow; and in the wall's lee, where the blown snow sifts down, the plan marks
  // the pines that carry it heavily, by their distance from the wall (the part's leeSnow, round 4 mending 3): those are
  // drawn with the snowed make, so that seen from above they read as snowed trees, not as dark pointed cones)
  const fg = farPineGeometry(), fgN = farPineGeometry(0.18), fgL = farPineGeometry(0.8, 0.6); geos.push(fg, fgN, fgL);
  for (const [list, group, geo] of [[P.forest.farS, south, fg], [P.forest.farN.filter((t) => !t.lee), northG, fgN], [P.forest.farN.filter((t) => t.lee), northG, fgL]]) {
    const tiles = new Map();
    for (const t of list) { const k = Math.floor(t.x / 420) * 64 + Math.floor(t.z / 420); let a = tiles.get(k); if (!a) tiles.set(k, a = []); a.push(t); }
    let n = 0;
    for (const a of tiles.values()) {
      // (t.y: the lowest of the drawn ground under the pine's skirt; its skirt's rim reaches 0.4 m and more under that)
      const mesh = instanced(geo, M.solid, a, (i, m, t) => matAt(m, t.x, t.y - 0.4, t.z, t.rot, t.h * 0.96, t.h, t.h * 0.96));
      mesh.computeBoundingSphere(); mesh.frustumCulled = true;
      group.add(mesh);
      if (++n % 2 === 0) await tick();
    }
    await tick();
  }
  const wind = flora.makeWind({ direction: [-0.9 * hand, 0.3], strength: 0.8 });
  const mo = { wind, backlight: 0.5 };
  await flora.prepareLeafTexture(mo, tick);
  const mat = flora.windMaterial(mo);
  const matRed = flora.windMaterial({ wind, map: mat.map, backlight: 1.0, backlightTint: '#ff6a58' });
  const matGreat = flora.windMaterial({ wind, map: mat.map, backlight: 1.0, backlightTint: '#ff6a58', color: '#e4e0d6' });
  // the kit's trees take the place's standing weather like everything else: the sun's share, the sky's and the air between
  // are worked out from each seen point's own place (the part's placeLit), so a tree looks the same from wherever it is seen
  // (and in the wall's lee, where the blown snow sifts down, they carry it: thick on the dark trees, a dusting on the red leaves)
  // (in the wall's shade the snow all about gives the sky's light back: the dark trees take a share more of it there, the
  // white trees with their red leaves more still, so that their bark is pale and their leaves red in that shade)
  placeLit(mat, U, 'vFloraWorld', false, 0.86, 0.7); placeLit(matRed, U, 'vFloraWorld', false, 0.16, 1.5); placeLit(matGreat, U, 'vFloraWorld', false, 0.16, 1.5);
  W.drop = [() => { mat.map?.dispose?.(); mat.dispose(); matRed.dispose(); matGreat.dispose(); }];
  await tick();
  // the trees themselves were made by the plan, which measured each (the part's planForests)
  const { con1, con0, red1, red0, white1, white0 } = P.trees;
  geos.push(...con1, ...con0, ...red1, ...red0, ...white1, ...white0, ...P.trees.great);
  const pts = (list, uOf) => list.map((t) => ({ x: t.x * hand, y: t.y, z: t.z, s: t.s, rot: t.rot, v: t.v, d: 0, u: clamp(uOf(t), 0, 0.999) }));
  const scatter = async (name, group, list, variants, o) => {
    const s = flora.makeScatter({ rng: makeRng(hashSeed('ice-scatter-' + name + ':' + seed)), points: list, variants, material: mat, heightAt, tilt: 0, stretch: 0, sink: 0, ...o });
    group.add(s.object); W.kits.push((dt, time, camera) => s.update(dt, time, camera));
    await tick();
    return s;
  };
  const F0 = P.forest, zs = P.zStart, uS = (t) => (t.z - 60) / (zs + 100), uN = (t) => (-t.z - 50) / 800;
  // the dark trees of the north, the great trunks darker still; the white trees a pale bone that stands out of the blue shade and keeps its own shading
  const shadeN = () => [0.78, 0.82, 0.9], shadeT = () => [0.74, 0.76, 0.82], shadeW = () => [0.95, 0.93, 0.88];
  // NO TREE COMES INTO BEING BY THE EYE'S DISTANCE: every one is drawn from the first frame at whatever distance it stands
  // (no cull distance is given to the kit; a chunk wholly outside the picture is left out by the renderer, at zero pixels)
  await scatter('road-near', southK, pts(F0.sNear.filter((t) => t.hi), uS), con1, { chunks: 4 });
  await scatter('road-far', southK, pts([...F0.sNear.filter((t) => !t.hi), ...F0.sMid], uS), con0, { chunks: 6 });
  await scatter('north-near', northK, pts(F0.nNear, uN), con1, { chunks: 3, shade: shadeN });
  await scatter('north-far', northK, pts(F0.nMid, uN), con0, { chunks: 4, shade: shadeN });
  // the young spruces of the open belt, where the wood's edge is drawn down toward the wall's foot
  await scatter('belt', northK, pts(F0.belt, uN), con0, { chunks: 2, shade: shadeN });
  await scatter('trunks-near', northK, pts(F0.trunks.filter((t) => t.hi), uN), red1, { chunks: 2, tilt: 0, shade: shadeT });
  await scatter('trunks-far', northK, pts(F0.trunks.filter((t) => !t.hi), uN), red0, { chunks: 2, tilt: 0, shade: shadeT });
  await scatter('white', northK, pts(F0.white.filter((t) => t.hi), uN), white1, { material: matRed, chunks: 1, tilt: 0, tint: 0.06, hue: 0.02, shade: shadeW });
  await scatter('white-far', northK, pts(F0.white.filter((t) => !t.hi), uN), white0, { material: matRed, chunks: 1, tilt: 0, tint: 0.06, hue: 0.02, shade: shadeW });
  // the grove's great old trees (three makes; each stands where the plan measured it, turned as the plan turned it)
  for (const g of P.great) {
    const mesh = new THREE.Mesh(P.trees.great[g.v], matGreat);
    mesh.position.set(g.x, g.y, g.z); mesh.rotation.y = g.yaw;
    northG.add(mesh);
  }
  // A MOUND OF SNOW AT EVERY TREE'S FOOT (the plan's own list: where, how wide, how high; each tested like every made
  // thing): a low swell of the ground itself, drawn by the ground's own material
  for (const [list, group] of [[F0.moundsS, south], [F0.moundsN, northG]]) {
    const it = moundsSteps(P, list);
    let r = it.next();
    while (!r.done) { await tick(); r = it.next(); }
    geos.push(r.value);
    group.add(new THREE.Mesh(r.value, M.snow));
    await tick();
  }
}

// the life of the place: smoke, ravens, elk, falling snow, red leaves, the riders
async function buildLife(W) {
  const { P, U, M, scene, south, northG, southK, northK, hand, heightAt, seed, tick, geos, sky, rig, path, detail } = W;
  const S = (name) => makeRng(hashSeed('ice-life-' + name + ':' + seed));
  // smoke of the chimneys, leaning west on the wind
  const warm = new THREE.Color().copy(sky.lightColor), wl = Math.max(warm.r, warm.g, warm.b, 1e-3); warm.multiplyScalar(1 / wl);
  const smokeLit = new THREE.Color('#8a8a92').lerp(new THREE.Color('#8a8a92').multiply(warm).multiplyScalar(1.15), 0.7), smokeTop = new THREE.Color('#c6cad4').lerp(new THREE.Color('#d8d8dc').multiply(warm).multiplyScalar(1.12), 0.75);
  for (let i = 0; i < P.castle.smokes.length; i++) {
    const t = P.castle.smokes[i];
    // (soft-edged puffs, many and thin: smoke, not solid. The low sun lights it: its lit side takes the sun's colour of the
    // hour, set here once; its shaded side is the blue-grey of the shade. The part's SMOKE holds its measures: the plan
    // tests every column by them)
    const sm = fx.makeSmokeColumn({ rng: S('smoke' + i), time: U.uTime, position: [t[0] * hand, t[1], t[2]], height: SMOKE.height, radius: SMOKE.radius, size: SMOKE.size, count: SMOKE.count, wind: [SMOKE.wind[0] * hand, SMOKE.wind[1], SMOKE.wind[2]], sunDir: sky.lightDirection,
      color: smokeLit.getStyle(), colorTop: smokeTop.getStyle(), opacity: 0.42, ragged: 0.75, softness: 1.0, shadowColor: '#5f6878', variation: 0.1, sunColor: sky.lightColor });
    southK.add(sm.object); if (sm.update) W.kits.push((dt, time, camera) => sm.update(dt, time, camera));
    await tick();
  }
  // ravens about the tallest tower, and a string of them going out over the wall and coming back
  const birds = F.makeFauna(southK, { light: F.lightFrom(scene) }), rv = P.ravens;
  // (they keep close about the tower: the flock's own spread is given here so that its whole box of wander, its round of
  // 40 m widened by its farthest member, the wander's swing and a bird's span, stands 20 m and more from the line on
  // every seed (29 m and more on seeds 1 to 300): the report's count, r4-flock.mjs. The kit's own spread of 30 m let
  // that box reach the line)
  if (rv.home) birds.add(F.makeFlock({ rng: S('ravens-home'), species: 'crows', count: rv.castle, center: [rv.home[0] * hand, rv.home[1], rv.home[2]], radius: 40, spread: [12, 6, 24] }));
  await tick();
  // the string going out flies a closed round over the wall and back, high over both lands: it hangs in the scene itself,
  // outside the two groups the wall can hide, and is drawn at every clock
  const far = F.makeFauna(scene, { light: F.lightFrom(scene) });
  if (rv.loop) far.add(F.makeFlock({ rng: S('ravens-out'), species: 'crows', count: rv.out, route: rv.loop.map((q) => [q[0] * hand, q[1], q[2]]), closed: true, start: rv.ph, speed: 13, spread: [8, 5, 24] }), { always: true });
  await tick();
  // elk in the dark wood beside the way to the grove, lit at build as their country stands in the wall's shade. THE PLAN
  // PLACES THE HERD (the part's planLife: its middle square off the way's axis, beyond the kept width and the verge by
  // the herd's whole round and more, inside the wood) and asks the true clearance of that whole round; a herd that
  // fails is not made. THE KIT IS HANDED NO PATH AND NO CLEAR: it deals each beast a loop of its own about the middle
  // and keeps the loops apart, and that is all it decides. Every loop read out of the kit's own table on seeds 1 to
  // 300 (m3-elk.mjs): the report gives the least distances to the way, the avenue, the ring and the line
  const shadeLight = { sunDir: sky.lightDirection.toArray(), sunColor: rig.sun.color.clone().multiplyScalar(rig.sun.intensity * 0.1), sky: new THREE.Color(0.55, 0.7, 1).multiplyScalar(rig.hemi.intensity * 1.6), ground: new THREE.Color(0.5, 0.6, 0.85).multiplyScalar(rig.hemi.intensity * 0.9) };
  const beasts = F.makeFauna(northK, { light: shadeLight });
  await tick();
  if (P.elk.ok) beasts.add(F.makeHerd({ rng: S('elk'), species: 'deer', count: P.elk.n, size: P.elk.size, coat: P.elk.coat, heightAt, center: [P.elk.x * hand, 0, P.elk.z], radius: P.elk.radius, roam: P.elk.roam }));
  // (the kit's flocks and herd move by the clock; the kit is handed the camera too and, by its own doing, draws a
  // member only within the fog's reach of the eye. Nothing of the world's own asks where the eye is here)
  W.kits.push((dt, time, camera) => { birds.update(dt, time, camera); far.update(dt, time, camera); beasts.update(dt, time, camera); });
  await tick();
  // snow sifts down all the while in the wall's lee: a field fixed in place (the part's flakeField: every flake has a home
  // in a lattice and shows or not by its own place; the cells about the eye are drawn).
  // Red leaves drift down over the avenue and the ring, in a box that stands over them
  const snow = flakeField(S('snow'), Math.round(20000 * detail * P.snowfall), M.flake);
  scene.add(snow); geos.push(snow.geometry);
  await tick();
  // (the box stands over the whole avenue and the ring; no leaf is drawn within LEAVES.near[0] of the eye: the kit's law of
  // nearness, with room for the leaf's own size)
  const lf = P.leaves, leaves = fx.makeParticles({ rng: S('leaves'), preset: 'leaves', time: U.uTime, follow: false, center: [lf.center[0] * hand, lf.center[1], lf.center[2]], box: lf.box, count: Math.round(LEAVES.count * P.density * detail), colors: ['#c8222a', '#e8443a', '#8e1420'], lightDir: sky.lightDirection, near: LEAVES.near });
  northK.add(leaves.object);
  W.kits.push((dt, time, camera) => leaves.update(dt, time, camera));
  await tick();

  // the riders in black: horses, their legs, the cloaked men on them; out of the tunnel and away south down the road's right half
  const R = P.riders, riders = [], rh = S('horses'), m4 = new THREE.Matrix4(), hm = new THREE.Matrix4(), lm = new THREE.Matrix4(), col = new THREE.Color();
  for (const g of R.groups) for (let j = 0; j < 8; j++) { const coat = rh(), gait = rh(); if (R.ok && j < g.n) riders.push({ s0: g.s0 - j * g.gap, coat, gait }); }
  const zero = (i, m) => m.makeScale(0, 0, 0);
  const horses = instanced(horseGeometry(), M.solid, riders, zero), legs = instanced(legGeometry(), M.solid, riders.flatMap((r) => [r, r, r, r]), zero), cloaks = instanced(figureGeometry(), M.solid, riders, zero), capes = instanced(capeGeometry(), M.solid, riders, zero);
  for (let i = 0; i < riders.length; i++) { const c = riders[i].coat; col.setRGB(1.1 + 2.4 * c, 1.0 + 2.0 * c, 0.95 + 1.7 * c); horses.setColorAt(i, col); for (let q = 0; q < 4; q++) legs.setColorAt(i * 4 + q, col); }
  south.add(horses, legs, cloaks, capes); geos.push(horses.geometry, legs.geometry, cloaks.geometry, capes.geometry);
  const HIP = [[-0.2, 1.0, 0.7], [0.2, 1.0, 0.7], [-0.2, 1.0, -0.75], [0.2, 1.0, -0.75]], crs = R.course;
  W.kits.push((dt, time) => {
    for (let i = 0; i < riders.length; i++) {
      const r = riders[i], s = (((r.s0 + time * R.speed) % R.Lc) + R.Lc) % R.Lc;
      let a = 0, b = crs.length - 1; while (b - a > 1) { const mid = (a + b) >> 1; if (crs[mid][3] <= s) a = mid; else b = mid; }
      const A = crs[a], B = crs[b], t = (s - A[3]) / Math.max(B[3] - A[3], 1e-3), ph = s * 2.9 + r.gait * 6.283;
      matAt(hm, lerp(A[0], B[0], t), lerp(A[1], B[1], t) + 0.03 * Math.sin(ph * 2), lerp(A[2], B[2], t), Math.atan2(B[0] - A[0], B[2] - A[2]), 1);
      horses.setMatrixAt(i, hm);
      for (let q = 0; q < 4; q++) { lm.makeRotationX(0.42 * Math.sin(ph + (q === 0 || q === 3 ? 0 : Math.PI))); lm.setPosition(HIP[q][0], HIP[q][1], HIP[q][2]); legs.setMatrixAt(i * 4 + q, m4.multiplyMatrices(hm, lm)); }
      lm.makeScale(1.05, 0.72, 1.05); lm.setPosition(0, 1.32, -0.12); cloaks.setMatrixAt(i, m4.multiplyMatrices(hm, lm));
      // his cloak streams between the way he has come and the way the wind blows (west), lifting and falling on the clock
      const hx = B[0] - A[0], hz = B[2] - A[2], hl = Math.hypot(hx, hz) || 1, tx = -0.5 * hx / hl - 0.8, tz = -0.5 * hz / hl + 0.16;
      matAt(m4, lerp(A[0], B[0], t), lerp(A[1], B[1], t) + 2.26, lerp(A[2], B[2], t), Math.atan2(-tx, -tz), 1, 1, 1, -0.3 + 0.28 * Math.sin(time * 5.1 + r.gait * 40) + 0.14 * Math.sin(time * 8.7 + r.coat * 30));
      capes.setMatrixAt(i, m4);
    }
    horses.instanceMatrix.needsUpdate = legs.instanceMatrix.needsUpdate = cloaks.instanceMatrix.needsUpdate = capes.instanceMatrix.needsUpdate = true;
  });
  await tick();
}

// ice that falls: small falls down the south face, each on a round of its own on the world's clock
async function buildFalls(W) {
  const { P, M, south, seed, tick, geos } = W;
  const rc = makeRng(hashSeed('ice-chunks:' + seed)), G = 9.8, chunks = [], m4 = new THREE.Matrix4();
  // (a broken shard: no two of its corners alike)
  const cs = new Solid(0); cs.hull([[-0.5, -0.35, -0.4], [0.45, -0.42, -0.45], [0.56, -0.3, 0.4], [-0.4, -0.4, 0.5], [-0.28, 0.3, -0.22], [0.33, 0.46, -0.3], [0.2, 0.24, 0.36], [-0.46, 0.18, 0.28]], [0.5, 0.7, 0.9], 0);
  for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) {
    const dx = rc.range(-2, 2), out = rc.range(3, 5), late = rc.range(0, 0.7), size = rc.range(0.4, 1.2), spin = rc.range(-3, 3);
    if (i < P.falls.length) { const f = P.falls[i]; chunks.push({ f, dx, out, late, size: size * f.size, spin, y1: P.groundAt(f.x + dx, faceZ(0) + out) + 0.2 }); }
  }
  const mesh = instanced(cs.geometry(), M.solid, chunks, (i, m) => m.makeScale(0, 0, 0));
  south.add(mesh); geos.push(mesh.geometry);
  W.kits.push((dt, time) => {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i], f = c.f, tf = (((time / f.period + f.ph) % 1) * f.period) - c.late, y = f.y - 0.5 * G * tf * tf;
      if (tf < 0 || y < c.y1) m4.makeScale(0, 0, 0); else matAt(m4, f.x + c.dx, y, faceZ(y) + c.out, c.spin * tf, c.size, c.size, c.size, c.spin * 0.7 * tf);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  await tick();
  await tick();
}
