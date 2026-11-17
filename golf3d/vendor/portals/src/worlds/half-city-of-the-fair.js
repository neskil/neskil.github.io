// Sophronia, the Fair That Stays. From Invisible Cities by Italo Calvino (1923 to 1985).
//
// ONE STANDING PLACE: a city of two halves on a plain at dusk, one standing minute of it. One half is a great fair
// (a riveted lattice wheel of small open cages on a tower with a high gallery, a white timber switchback, a chain
// swing, swing boats, a riders' drum, a great tent, a bandstand), rooted like an old town: brick footings sunk in
// turf, ivy, old limes in full summer leaf hung with lamps, thick clipped hedges, flower beds, raked gravel
// walks; it is lit by its own lamps. The other half is an old town of honey limestone and marble that is
// being taken away: every building stands 1.2 to 1.8 m clear on crib stacks and short bearers of pale new timber,
// a storm lantern hanging under it every few metres; small iron lifting eyes with rope slings stand in pairs on
// its cornices; where a building has gone its plan is left (one closed outline of low dark bearers along its
// walls' lines, the floor it leaves inside, room by room in warm tones: boards, tiles, kitchen flags, a hearth
// stone, a cellar hatch; its doorstep on jacks at the street's edge with a tub and a clipped ball either side;
// low lanterns at the kerb; one or three of its own pieces on cribs on that floor, each with its lantern: a
// column's drums in cradles, a length of cornice and of balustrade, a glazed window in its frame, a small copper
// cupola; the kerb, the pavement and the gas standards of its street, a dry trough, a bench, bollards).
// ONE PALACE STANDS HALF TAKEN DOWN by the square: its ground storey whole and finished, its walls ending one
// course above the upper sills in one level line (a shallow wide notch with its sill where each upper window
// stood), open to the sky, and its own top set down beside it in its yard (the pediment lying flat on its back
// on cribs, its moulded face up; lengths of cornice and balustrade in flat stacks, squared wall stones in two
// tiers with bearers between, copper, slates, roof timbers).
// ALONG THE SEAM, BESIDE THAT STREET, THE FAIR'S LIT EDGE: tall old limes ringed with lamps in a chase, festoons
// from tree to tree, four white masts with pennants and festoons, two booths (F.planSeam).
// THE WORKS ARE COLD: no smoke, steam, fire or dust anywhere; their one chimney stands cold on its bearers.
// THE WAY OUT is a narrow rutted carters' lane: road
// wagons on spoked wheels stand singly along it, each with one great piece of this town (the hall's dome in
// small, a portico, lengths of the fronts' cornice and balustrade, glazed windows in their frames, a pediment,
// fluted drums), every drawbar pointing away from the town; beyond, the caravan stands toward the horizon, a
// lantern on each. The place simply stands: nothing in it begins, turns or ends because we come.
// No person and no creature is anywhere in it, and nothing is lettered.
//
// WHAT IS DRIVEN BY WHAT
//   By the world's clock (time) and the plan's numbers (the seed's) ONLY:
//     the wheel's turn and its cages' rock; the trains on the switchback; the chain swing's turn, fling and wave;
//     the trapezes; the swing boats (empty, each on a phase of its own); the fireworks (an even loop of 40 s, its
//     phase the seed's); the canvas, the flags, the pennants and the leaves (one wind); the fair's lamps' slow
//     chase along the hoop, the wheel's rim, the rails and the festoons, and the seam band's deeper chase of long
//     runs (a round of 1 s, each ring and swag from a place of its own); the slow breath of the lanterns' and gas
//     standards' flames (each on a round of its own, 3 to 5 s, and a phase of its own); the stars' twinkle (the
//     kit's own). NOTHING PULSES IN UNISON: the pools on the ground and the baked wash are still. Each
//     law is named at the head of src/parts/half-city-of-the-fair.js. They run for ever and loop.
//   By the visit's hour hint (one law, in `HOURS` below): the sky, the light, and whether lamps, lanterns, lit
//     windows, pools, the last light on the cornices and the fireworks are there. DUSK is the
//     world's own hour: every lamp and lantern lit. By day they are all out and no rocket rises; at night the
//     lamps, the lanterns and a moon carry it.
//   By the metres flown, the lens's place, our nearness or a share of the flight: ONLY the film's pace (quicker
//     on the lane, slower round the turns), the camera's gaze (eight pulls, never two in force together: each
//     begins at the mark of the line where the one before it ends, each aims at a place the plan names:
//     F.planFilm) and THE LAMPS' FILTER BY A PIXEL'S FOOTPRINT (a lamp smaller than two pixels is drawn at two
//     pixels and gives no more light than its own: its brightness is scaled by its own area over the drawn area;
//     F.makeLampField; the fireworks' sparks are drawn by the very same filter, F.makeFireField). The lamps and
//     the sparks take the scene's own haze by the scene's own figure, like every body. Nothing else in the place
//     is: no dust or mote is made; the tufts, the meadow's and the beds' flowers stand by the plan's rule and are
//     drawn at every distance (the kit's fade by distance is off).
//   NOTHING is lifted, lowered, hauled or driven: the stone half, its wagons and the caravan have no law of
//     movement at all (only the pennants on a few roofs and the flag on the dome fly). NO LIGHT IS MADE for the
//     lamps or for the last sun: the lamps' wash on what stands by them and the last light on the stone half's
//     cornices, pediments, dome and obelisk are baked by place (the kit's flood); the lamps' pools on the ground
//     are painted by place (F.groundSheet); their pools on the gallery's boards are a flat mesh by place
//     (F.makePoolMesh).
//
// THE LIGHT'S PLACE AND THE SKY BY ITS BEARING: the wheel's plane is turned 33 to 37 degrees from the seam's cross
// line, so the headings flown run from the lane's (into the town) round by the fair to the gallery's, and the sun
// (at night the moon and the milky way's bright middle) stands in the middle of the arc never flown, 60 degrees
// and more from every gaze. At dusk the west (the sun's bearing) is a low furnace band (no cloud anywhere),
// overhead is violet, the east is night blue with stars: on the lane the band lies ahead and over the stone hand
// and the night over the fair; down the midway and round the swing the lens looks into the night; on the rising
// turn and the gallery the band comes round again on the other hand.
// THE ROUTE'S RULES
//   The line is laid first (planRoute); every mover is then placed clear of it by rule and counted at every clock:
//   R1 entry level at 4.6 m on the lane's middle, 90 m before the plots' head; nothing that stands is nearer
//   than 14 m to the entry's lens and none is cut by the picture's edge in the first second (the gate, the hedge,
//   the limes and the first wagon begin 28 m and more ahead; under the lens only the lane, its grass and stones).
//   R2 the standing wagons' middles 10.4 m and more from the line (the nearest stone or timber of any wagon and
//   its load 7.8 m); the close's east hedge 6.7 m, the boats behind it on a beam 14 m off, their whole sweep
//   6.2 m and more from the line. R3 the emptied lots are floor dress (bearers 0.3 m high); the half palace's
//   nearest stone 8.5 m; in its yard the lying pediment 12.3 m from the street's middle and every stack 13.6 m
//   and more (the yard's nearest thing of any kind 6.7 m from the line). R4 the bank's portico 15.7 m and more
//   (its columns 16.7 m, its wall 19.5 m from the street's middle), the street's other east fronts 10.7 m and
//   more with their hoods and brackets; its fair side is open; every gas mantle 5.8 m and more; the lots' own
//   pieces on cribs 13.2 m and more, the kerb's low things (tubs, trough, bench, bollards, kerb stones) 6.5 m
//   and more aside and under 1.7 m high; the seam band's tall limes 19.7 m and more by their leaves at the wind's
//   bound, its lamps 4.4 m and more (counted by true triangles on seeds 1 to 300). R5 no trunk within
//   9 m plus half its crown, and EVERY LIME BY ITS LEAVES: each leaf at the wind's bound 2.5 m and more from the
//   line (planned at 2.55 m by the shapes' own reach, F.limeClear; counted on the drawn leaves on seeds 1 to
//   300: 2.73 m, a still leaf 3.24 m). R6 the trestle's portal bays 11 m wide, nothing under 12.6 m in them.
//   R7 the booths 8.3 m; the festoon poles' heads 6.9 m (those of the swing's garden stand under the line's
//   round, 6.9 m below it); the nearest festoon lamp 2.75 m (under the line, on the midway). R8 the line 24 m
//   from the swing's axis (its seats reach 15 m). R9 the drum 8.2 m (its stair and walk), the tent's open side
//   17 m; the bandstand 40 m; every walk lamp 9.3 m and more. R10 the rising turn has a 40 m radius and comes
//   onto the gallery's line 73 to 90 m before the ring: the last stretch is straight and level, 11.4 m from the
//   wheel's middle plane (everything that turns stays within 3.1 m of it and 8.1 m and more from the lens), deck
//   3.0 m under the lens, rails and standards 3.85 m aside. R11 movers counted on seeds 1 to 300 at twelve clocks
//   and over their whole courses: the boats 6.2 m and more, the trains and the swing's seats 8.6 m, every spark
//   of the fireworks 139 m and more. R12 gaze pulls under 1, never two in force together, none after the line
//   joins the gallery. R13 the camera's bank is 0.3: the horizon's roll is 4.8 degrees at the most (the engine's
//   ceiling of 0.28 times the bank), on the turns only; no pull dips the gaze there. ON THE ROUND THE GAZE IS ON
//   THE SWING ITSELF (one pull from the midway's straight to the round's end, aimed at its axis half-way between
//   its seats and its crown: the gaze rises some 8 degrees and stands 74 degrees off the heading at the most; it
//   comes gently, over its first 32 m, its aim held back between the line's own look and the swing so that its
//   share of the gaze eases out to its full: F.planFilm, swingAim):
//   the ride stands in the picture with its mast and its whole crown, and no chair's chain is cut in a corner.
import * as THREE from 'three';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as S from '../kit/structures.js';
import * as flora from '../kit/flora.js';
import { makeRng, hashSeed } from '../kit/core.js';
import * as F from '../parts/half-city-of-the-fair.js';

const DEG = Math.PI / 180;
// The hours: one law. el: the light's height (null: the plan's own low sun, 2 to 5 degrees up); night: the kit
// materials' night term (how far the lanterns' and lamps' baked wash, the lit windows and the pools are on); glow:
// how much the canvas shines of itself; shade: the long shadows' colour on the ground; lift: the ground's own share;
// far: the far plain's own tint by place and the greatest share of the haze it takes (F.groundSheet), at dusk only.
// DUSK is the world's own hour: the last minutes of sun, the exposure down, so that THE FAIR IS LIT BY ITS LAMPS.
const HOURS = {
  dusk: { preset: 'sunset', el: null, night: 0.5, exposure: 0.9, fog: 0.0007, glow: 0.36, shade: '#d6d2de', lift: 0.3, rig: { intensity: 0.92, ambient: 0.84, bounce: 0.16 }, bloom: 0.54, far: { tint: [0.78, 0.58, 0.46], cap: 0.55 } },
  day: { preset: 'day', el: 40, night: 0, exposure: 1.0, fog: 0.0006, glow: 0, shade: '#9a9cae', lift: 0.12, rig: { intensity: 1, ambient: 1, bounce: 0.35 }, bloom: 0.25 },
  dawn: { preset: 'dawn', el: 7, night: 0.3, exposure: 1.05, fog: 0.0012, glow: 0.1, shade: '#aeaabd', lift: 0.3, rig: { intensity: 1.05, ambient: 1.2, bounce: 0.4 }, bloom: 0.5 },
  night: { preset: 'night', el: 34, night: 1, exposure: 1.1, fog: 0.0008, glow: 0.5, shade: '#b4b6c6', lift: 0.16, rig: { intensity: 1.5, ambient: 1.7, bounce: 0.5 }, bloom: 0.55 },
};

export default {
  id: 'half-city-of-the-fair',
  name: 'Sophronia, the Fair That Stays',
  category: 'books',
  placeKind: 'city',
  book: 'Invisible Cities',
  author: 'Italo Calvino, 1923 to 1985',
  media: ['air'],
  weirdness: 0.6,

  async build(ctx) {
    const scene = new THREE.Scene();
    // THE PAGE IS HANDED BACK AFTER EVERY PIECE of the build (every step of a maker, every mesh): the build asks
    // the engine for a hand-back; the engine answers at once when the last hand-back was a moment ago, so asking
    // after every piece costs nothing and no piece is long. No clock is read here.
    const breathe = () => ctx.yield();
    const run = async (it) => { let q = it.next(); while (!q.done) { await breathe(); q = it.next(); } await breathe(); return q.value; };

    // ------------------------------------------------------------ the plan (arithmetic only)
    const P = F.planHead(ctx.seed, ctx.vary || {});
    for (const step of F.PLAN_STEPS) { step(P); await breathe(); }
    const H = HOURS[P.hour], R = P.R;

    // ------------------------------------------------------------ sky, light, haze
    // the light's place: the plan's azimuth (never in the lens, see planHead), the hour's height
    const el = H.el == null ? P.sunEl : H.el, sdx = P.hand * Math.cos(P.sunAz), sdz = Math.sin(P.sunAz);
    const azDeg = Math.atan2(sdx, -sdz) / DEG;
    const skyOpts = { rng: R.sky, preset: H.preset, quality: 0.5, renderOrder: -3, renderer: ctx.renderer };
    // (at night the milky way's axis is laid by the plan, so that its bright middle stands on the plain's rim at
    // the moon's bearing, in the arc no gaze takes, and only its thin far end crosses the sky over the fair)
    if (P.hour === 'night') Object.assign(skyOpts, { bodyOverrides: { 0: { elevation: el, azimuth: azDeg } }, milkyAxis: [sdz, 0.45, -sdx], milkyAngle: 0, milkyWay: 0.7 });
    else { skyOpts.sunElevation = el; skyOpts.sunAzimuth = azDeg; }
    // by day the sky's rim is a pale warm grey, the land's own
    if (P.hour === 'day') skyOpts.horizon = '#cfc8b6';
    // DUSK, THE SKY BY ITS BEARING. WEST is the sun's bearing: there a low furnace band of orange lies on the
    // plain's rim (the kit's wash on the sun's side, broad in bearing, steep in height: full orange under 6
    // degrees, rose at 12, gone into the violet by 25). The band alone: NO CLOUD IS ANYWHERE IN THIS SKY (the
    // kit's two cloud sheets are off at dusk and no bar or puff is made). OVERHEAD the sky is violet. EAST, away
    // from the sun, its rim is the deep blue of night, with many stars; they twinkle by the kit's own law on the
    // world's clock (twinkle 0.6: a star's light swells and sinks by up to three quarters at the rim).
    if (P.hour === 'dusk') Object.assign(skyOpts, { zenith: '#1c1250', mid: '#2a2a80', horizon: '#16306e', horizonPow: 4, midPow: 1.5,
      scatterColor: '#ff7a26', scatter: 2.0, scatterPow: 3, scatterHigh: 0.025, scatterFall: 6, ambientColor: '#7c86c4', stars: 0.75, starDensity: 1, twinkle: 0.6, clouds: false, clouds2: false });
    if (P.hour === 'night') skyOpts.twinkle = 0.6;
    const sky = makeSky(skyOpts);
    scene.add(sky.object);
    const rig = makeLightRig(sky, H.rig);
    scene.add(rig.object);
    // (at dusk the haze is the plain's own dusk: A WARM DARK TONE OF THE LAND, the sky's rim and overhead mixed and
    // then drawn 85 parts in a hundred toward a dark earth brown: darker than the sky's rim on every bearing, so that
    // the land is a dark edge under the furnace band and no bright line lies under the night blue; it is no blue,
    // so the far plain from the gallery is land to its rim)
    const fogCol = sky.horizonColor.clone().lerp(sky.zenithColor, P.hour === 'dusk' ? 0.42 : 0.25);
    if (P.hour === 'dusk') fogCol.lerp(new THREE.Color('#3c2a26'), 0.85);
    // G2: the haze is dust over land, a little darker than the sky's rim, so no bright line lies on the horizon
    if (P.hour === 'dawn') fogCol.lerp(new THREE.Color('#cfae8a'), 0.3);
    // by day the far haze is a warm grey of the land: the plain's rim is dust, never a blue line
    if (P.hour === 'day') fogCol.lerp(new THREE.Color('#b7b09e'), 0.7);
    fogCol.multiplyScalar(0.94);
    scene.fog = new THREE.FogExp2(fogCol, H.fog * (0.85 + 0.3 * P.haze));
    await breathe();

    const L = sky.lightDirection, dusk = P.hour === 'dusk';
    // (lit: the share of the stone half's windows that are lit, a few at dusk; flood: the lanterns' and lamps'
    // baked wash, strongest on what looks down at them; detail: the stone's own mottle, fine)
    const mats = S.makeMaterials({ night: H.night, lit: dusk ? 0.2 : 0.3, glow: 1.6, streetY: 0, streetGlow: dusk ? 0.1 : P.hour === 'night' ? 0.3 : 0.25, streetFall: 12, nightFill: [0.1, 0.12, 0.2],
      flood: 1, floodColor: '#ffc48a', floodDir: [0, -1, 0.001], detail: 0.85,
      sky: { top: '#' + sky.zenithColor.getHexString(), horizon: '#' + sky.horizonColor.getHexString(), sun: '#' + sky.sunColor.getHexString(), sunDir: [L.x, L.y, L.z] } });
    await breathe();

    // ------------------------------------------------------------ everything standing (the part's makers)
    const I = F.makeLists();
    const solid = async (gen) => {
      const b = S.makeBuilder(16384);
      await run(gen(b, P, I));
      const m = new THREE.Mesh(b.toGeometry(), mats.facades); m.frustumCulled = false; m.matrixAutoUpdate = false; scene.add(m);
      await breathe();
      return m;
    };
    await solid(F.buildStone);
    await solid(F.buildTrestle);
    await solid(F.buildFair);

    // ------------------------------------------------------------ the instanced things and the movers
    const U = F.unitShapes(), G = {};
    for (const k in U) G[k] = U[k].toGeometry();
    G.crown = I.crown.toGeometry();
    await breathe();
    const things = new THREE.Group(); things.matrixAutoUpdate = false; scene.add(things);
    await run(F.standingMeshes(P, I, G, mats, things));
    const movers = F.makeMovers(P, I, G, mats, things);
    movers.move(0);
    await breathe();
    // the cloth: tent, cone, awnings, flags and pennants in one mesh, moved by one wind in its own material
    const clothMat = F.makeClothMaterial(H.glow);
    const clothGeo = I.cloth.toGeometry(); clothGeo.clearGroups();
    const clothMesh = new THREE.Mesh(clothGeo, clothMat.material); clothMesh.frustumCulled = false; scene.add(clothMesh);
    await breathe();
    // the lamps: one draw call of sprites; by day they are out
    // (a lamp takes THE SCENE'S OWN HAZE by the scene's own figure: its light times exp(-(density * depth)^2), the
    // very law of the scene's fog; the sparks the same)
    const lamps = F.makeLampField(P, I, P.hour);
    lamps.uniforms.uFogD.value = scene.fog.density;
    // (the lamps under the trapezes' bars read the bars' places, which the movers' law sets)
    lamps.uniforms.uTrap.value = movers.trapP;
    // the lamps' filter takes the drawing's height: update copies it into the lamps' uniform every frame
    const cvs = ctx.renderer.domElement;
    scene.add(lamps.mesh);
    await breathe();
    // the lamps' pools on the gallery's boards, by place (F.makePoolMesh); none by day
    const pools = F.makePoolMesh(P, I, P.hour);
    if (pools) scene.add(pools.mesh);
    // the fireworks' sparks over the fields beyond the fair's far side: one draw call, by the lamps' own filter and
    // the lamps' own uniform for the picture's height; they burn at dusk and at night only (F.makeFireField)
    const fire = F.makeFireField(P, P.hour, lamps.uniforms.uVH);
    fire.uniforms.uFogD.value = scene.fog.density;
    scene.add(fire.mesh);
    await breathe();

    // ------------------------------------------------------------ the ground: one painted sheet and the plain beyond
    // (the low sun's shadows are drawn as from 8 degrees, so that none is longer than the sheet; pools: whether
    // the lamps' warm pools are painted, by every hour but the day)
    const ground = await run(F.groundSheet(P, I, sdx, sdz, Math.max(el, 8) * DEG, H.shade, { lift: H.lift, pools: P.hour !== 'day', farTint: H.far && H.far.tint, farCap: H.far && H.far.cap }));
    // (the lane's own relief and the garden's raked walks: ribbons on the sheet in the sheet's material, see
    // F.groundSheet, F.walkRibbons)
    scene.add(ground.mesh, ground.far, ground.lane, ground.walks);
    await breathe();

    // ------------------------------------------------------------ the limes, the ivy, the flower beds (kit flora)
    // (the wind's strength is the plan's, F.LIME_WIND: the plan places every lime by its leaves at that wind's bound)
    const wind = flora.makeWind({ direction: [Math.cos(P.windA), Math.sin(P.windA)], strength: F.LIME_WIND, speed: 0.9 });
    const fopt = { wind, backlight: P.hour === 'night' ? 0.2 : 0.9, backlightTint: '#ffd9a0', ambient: P.hour === 'night' ? 2.2 : 1.2 };
    await flora.prepareLeafTexture(fopt, ctx.yield);
    // (the limes and the ivy stand among the fair's lamps: by the lamps' hours their leaves take a small warm share
    // of their own, the same for every leaf; the grass tufts by the lane, out on the plain, have a material without it)
    const fmat = flora.windMaterial(P.hour === 'day' ? fopt : { ...fopt, emissive: '#6a4420', emissiveIntensity: dusk ? 0.18 : 0.36 });
    const tuftMat = flora.windMaterial({ ...fopt, map: fmat.map });
    const tr = R.trees, floraSets = [];
    // THE LIMES ARE THE PLAN'S OWN SHAPES (F.planLimes: two near shapes drawn by turns, one coarser far one; bark
    // brown trunks, full summer leaf), drawn as the plan counted them: upright, unstretched, sunk by F.LIME_SINK,
    // each at its own height and turn; within 70 m of the line in plan a near shape (its number in the list says
    // which), further off the far one
    const limeNear = P.limes.near, limeFar = P.limes.far;
    const pts = P.dress.trees.map((t, i) => ({ x: P.X(t.d), y: 0, z: t.z, s: t.h / 15, rot: t.rot, v: i % 2 }));
    const nearPts = [], farPts = [];
    for (const q of pts) (P.gapXZ(q.x, q.z, 70).dist < 70 ? nearPts : farPts).push(q);
    if (nearPts.length) floraSets.push(flora.makeScatter({ rng: tr, points: nearPts, variants: limeNear, material: fmat, tint: 0.12, hue: 0.03, tilt: 0, stretch: 0, sink: F.LIME_SINK }));
    await breathe();
    if (farPts.length) floraSets.push(flora.makeScatter({ rng: tr, points: farPts.map((q) => ({ ...q, v: 0 })), variants: limeFar, material: fmat, tint: 0.12, hue: 0.03, tilt: 0, stretch: 0, sink: F.LIME_SINK }));
    await breathe();
    const ivyGeo = [flora.bushGeometry({ rng: makeRng(hashSeed('half-city-of-the-fair:ivy:' + ctx.seed)), detail: 0, size: 1.5, leaf: '#2f5a30' })];
    floraSets.push(flora.makeScatter({ rng: tr, points: I.ivy.map((k) => ({ x: k[0], y: k[1] - 0.5, z: k[2], s: k[3], rot: (k[0] * 7 + k[2] * 3) % 6.28, v: 0 })), variants: ivyGeo, material: fmat, tint: 0.1, hue: 0.02, tilt: 0, stretch: 0.5, sink: 0 }));
    await breathe();
    // THE SEAM'S TALL LIMES (F.planSeam): each in the shape the plan names for it (a near shape or the far one,
    // whatever its distance), drawn as planned, in two sets of their own with streams of their own, so that no
    // older lime's, ivy's or flower's die is dealt anew by them
    const seamPts = P.dress.seam.limes.map((t) => ({ x: P.X(t.d), y: 0, z: t.z, s: t.h / 15, rot: t.rot, v: t.v }));
    for (const [name, sel, shapes] of [['seamlimes', (q) => q.v < 0, limeFar], ['seamnear', (q) => q.v >= 0, limeNear]]) {
      const set = seamPts.filter(sel).map((q) => ({ ...q, v: Math.max(0, q.v) }));
      if (set.length) floraSets.push(flora.makeScatter({ rng: makeRng(hashSeed('half-city-of-the-fair:' + name + ':' + ctx.seed)), points: set, variants: shapes, material: fmat, tint: 0.12, hue: 0.03, tilt: 0, stretch: 0, sink: F.LIME_SINK }));
      await breathe();
    }
    for (const f of floraSets) scene.add(f.object);
    // THE BEDS' FLOWERS: points inside each bed; each flower's colour is the kit's own die among four (white,
    // yellow, red, pink). They are drawn WITHOUT the kit's fade by distance (no sinking, no cull: fopt2 names no
    // fade), so no flower reads the lens. THE OLDER BEDS FIRST, from the beds' own stream, as they always were
    // dealt; then the later beds in a set of their own, from a stream of their own (below).
    const fopt2 = { detail: 0, ambient: 1.2, leafAmbient: 1.2 };
    const fr = R.beds, fpts = [], fcol = ['#e4e4da', '#f0cc48', '#d24b3a', '#f07898'];
    for (const q of P.dress.beds) { const n = Math.round(22 * q.rx * q.rz / 4); for (let i = 0; i < n; i++) { const a = fr.range(0, 6.283), rr = Math.sqrt(fr()) * 0.92; fpts.push({ x: P.X(q.d) + Math.cos(a) * rr * q.rx, y: 0.28, z: q.z + Math.sin(a) * rr * q.rz, s: fr.range(1.8, 2.6), rot: fr.range(0, 6.283), v: 0 }); } }
    const flowers = flora.makeFlowers({ rng: fr, points: fpts, wind, map: fmat.map, colors: fcol, chunks: 1, materialOptions: fopt2 });
    scene.add(flowers.object); floraSets.push(flowers);
    await breathe();
    // the later beds: the parterres' (P.dress.bedsNew), then the five beds of the swing's garden (two and a half
    // flowers to a square metre of each bed's earth, inside its low hedge)
    const fr2 = makeRng(hashSeed('half-city-of-the-fair:bedsnew:' + ctx.seed)), fpts2 = [], Gd = P.dress.garden;
    const bloom = (x, z) => fpts2.push({ x, y: 0.27, z, s: fr2.range(1.8, 2.6), rot: fr2.range(0, 6.283), v: 0 });
    for (const q of P.dress.bedsNew) { const n = Math.round(22 * q.rx * q.rz / 4); for (let i = 0; i < n; i++) { const a = fr2.range(0, 6.283), rr = Math.sqrt(fr2()) * 0.92; bloom(P.X(q.d) + Math.cos(a) * rr * q.rx, q.z + Math.sin(a) * rr * q.rz); } }
    for (const [a0, a1] of Gd.beds) {
      const r0 = Gd.rb0 + 0.55, r1 = Gd.rb1 - 0.55, n = Math.round(2.5 * (a1 - a0 - 2) * DEG * (r0 + r1) / 2 * (r1 - r0));
      for (let i = 0; i < n; i++) { const p = Gd.at(fr2.range(r0, r1), fr2.range(a0 + 1, a1 - 1)); bloom(P.X(p[0]), p[1]); }
    }
    const flowers2 = flora.makeFlowers({ rng: fr2, points: fpts2, wind, map: fmat.map, colors: fcol, chunks: 1, materialOptions: fopt2 });
    scene.add(flowers2.object); floraSets.push(flowers2);
    await breathe();
    // the summer grass by the carters' lane: green tufts (the kit's tuft shape in two greens) on the lane's crown
    // and verges, placed by the plan's own rule (F.tuftPoints: none in the ruts, thinning away from the lane), in
    // four sets. No leaf lies on the ground anywhere.
    const tg = [['#55803a', '#a8c860'], ['#5f8a3e', '#bcd272']].map((c, i) => flora.grassTuftGeometry({ rng: makeRng(hashSeed('half-city-of-the-fair:tuft' + i + ':' + ctx.seed)), width: 0.8, height: 0.52, root: c[0], tip: c[1] }));
    const tp = await run(F.tuftPoints(P, 2400)), ts = makeRng(hashSeed('half-city-of-the-fair:tuftset:' + ctx.seed));
    for (let k = 0; k < 4; k++) {
      const set = flora.makeScatter({ rng: ts, points: tp.filter((q, i) => i % 4 === k), variants: tg, material: tuftMat, tint: 0.2, hue: 0.04, tilt: 0.06, stretch: 0.3, sink: 0.1 });
      scene.add(set.object); floraSets.push(set);
      await breathe();
    }
    // the meadow's flowers on the lane's verges (the plain's own: daisies, buttercups, poppies), by the plan's rule
    const meadow = flora.makeFlowers({ rng: makeRng(hashSeed('half-city-of-the-fair:meadowset:' + ctx.seed)), points: F.meadowFlowers(P), wind, map: fmat.map, colors: ['#ecead8', '#f0cc48', '#d8503c', '#ecead8'], chunks: 1, materialOptions: fopt2 });
    scene.add(meadow.object); floraSets.push(meadow);
    await breathe();

    // ------------------------------------------------------------ the air is clear: THE WORKS ARE COLD, and no
    // smoke, steam, fire, dust or mote is made anywhere
    // ------------------------------------------------------------ the film: pace, gaze, ring
    // the pace (slower round the three turns) and the gaze's pulls (each at a place the plan names, by the plan's
    // own figures) are the plan's: F.planFilm
    const film = F.planFilm(P), pace = film.pace;
    // (the swing's pull has an aim of its own while it comes: the engine asks a pull's aim at every place of the
    // line; the plan's law writes the led aim into one array kept here, and from the coming's end the aim is the
    // pull's target itself, as for every other pull)
    const pois = film.pulls.map((q) => {
      const target = new THREE.Vector3(q.at[0], q.at[1], q.at[2]), poi = { at: target, from: q.from, to: q.to, weight: q.weight, fade: q.fade };
      if (q.aim) { const led = new THREE.Vector3(), o = [0, 0, 0]; poi.at = (t, u) => (q.aim(u, o) ? led.set(o[0], o[1], o[2]) : target); }
      return poi;
    });
    P.marks = film.marks;

    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path: P.path, duration: F.DURATION, pace, pois,
      // (bank 0.3: the horizon stays near level over the pleasure ground, 4.8 degrees of roll at the most)
      camera: { fov: 62, near: 0.5, far: 5200, lookAhead: 16, sway: 0.6, bank: 0.3 },
      portal: { shape: 'circle', radius: 6, color: '#ffd27a', glow: 0.75, revealDistance: 230 },
      post: { exposure: H.exposure, bloom: { strength: H.bloom, radius: 0.6, threshold: dusk ? 0.88 : 0.9 }, grade: { saturation: 1.06, contrast: 1.04, vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) {
        // only the world's clock comes in: everything below sets values on what the build made
        movers.move(time);
        // (NO PULSE OF THE WHOLE PICTURE: the lamps' pools on the ground and their baked wash on what stands by
        // them are STILL, the same at every clock; nothing swells or sinks in unison. Each flame breathes on a
        // phase and a round of its own, in the lamps' own field: F.makeLampField)
        lamps.uniforms.uTime.value = time; lamps.uniforms.uWheel.value.copy(movers.wheelM); lamps.uniforms.uCrown.value.copy(movers.crownM);
        // (the one line that reads the drawing: its height in pixels, for the lamps' filter; the fireworks' sparks
        // read the same uniform, and their own clock is the world's)
        lamps.uniforms.uVH.value = cvs.height;
        fire.uniforms.uTime.value = time;
        clothMat.uniforms.uTime.value = time;
        wind.update(time);
        sky.update(dt, time, camera); rig.update(dt, time, camera); mats.update(dt, time);
        for (const f of floraSets) f.update(dt, time, camera);
      },
      dispose() {
        scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
        for (const k in G) G[k].dispose();
        clothMat.material.dispose(); lamps.material.dispose(); fire.material.dispose();
        ground.texture.dispose(); ground.farTexture.dispose(); if (ground.glowTexture) ground.glowTexture.dispose();
        ground.detailTexture.dispose(); ground.kindTexture.dispose();
        ground.mesh.material.dispose(); ground.far.material.dispose(); ground.lane.material.dispose();
        if (pools) pools.material.dispose();
        // (the plan's lime shapes: freed here whether or not a lime of that shape stands)
        for (const g of P.limes.near.concat(P.limes.far)) g.dispose();
        for (const f of floraSets) if (f.material && f.material.dispose) f.material.dispose();
        if (fmat.map) fmat.map.dispose(); fmat.dispose(); tuftMat.dispose();
        // (the kit's materials this world made: the one facade material and the pair every built mesh wears,
        // named one by one, with every texture they hold; the kit's lazy materials were never made and are not
        // asked for here)
        for (const m of [mats.facade, ...mats.facades]) {
          for (const v of Object.values(m)) if (v && v.isTexture) v.dispose();
          if (m.uniforms) for (const un of Object.values(m.uniforms)) if (un && un.value && un.value.isTexture) un.value.dispose();
          m.dispose();
        }
        for (const un of Object.values(mats.uniforms)) if (un && un.value && un.value.isTexture) un.value.dispose();
        sky.dispose?.();
      },
    };
  },
};
