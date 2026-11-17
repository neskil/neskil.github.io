// GREEN GATE PAST THE POPPIES (a working name; the owner chooses the title shown). In the low warm light of a late
// golden afternoon, under a blue sky with fair weather clouds, we fly low along a winding road of worn brick: out
// of fenced farmland with round dome-roofed farmhouses, over the field's edge where wild flowers thicken into
// scarlet, through a sunk lane in a rise and out across an open sea of poppies that ripples in the wind to the
// hills; a walled green city is in sight off to one side from the first metre, lost and found behind trees and
// rises, and grows the whole way; the brick stays under us and brings us under the high green wall to the gate,
// where the ring stands in the gateway.
// THE ONE TURN: a road journey across open country to a walled city in sight from the first metre; the flight ends
// AT THE GATE, never inside. SOURCES: L. Frank Baum's prose of 1900 and the real world. Words alone.
// OUR OWN ARRANGEMENT of his things: in Baum the poppies lie by the river, a day and more from the wall; that they
// lie right before the city here is a general situation, taken as an idea. The header's screen fields name the film
// the card is inspired by: The Wizard of Oz (1939).
//
// THE CITY, ITS WALL AND THE GATE are the city part's (src/parts/green-gate-past-the-poppies-city.js): one call,
// buildCity(ctx, root, { sun, shade, brick }), with this world's own sun, the country's cloud shadows and the
// road's own brick as the field part built it (one sheet, built once: env.U.tBrick); it adds its meshes to the same root, takes the world's lights, shadow map and air, moves nothing, and hands back ITS PLACES
// as built (the gate, the Great Dome, the Broad Tower, the Long Hall, the bastions, the wall's normal).
// THE COUNTRY is the field part's (src/parts/green-gate-past-the-poppies.js): prepareField lays the road, the land
// and the route and hands back THE DEALT PLACES in the road's metres (the first farmstead by the road or none, the
// bridge, the dry-stone wall's crossing, the lane's two mouths, where the poppies' cover ends, the court's edge);
// buildField builds the rest. This file types no metre of the road: every place is read at build.
//
// SPACE: metres, y up; the gate's threshold is the origin; the wall's outer face is the plane z = 0; the country
// lies on -z (looking along +z, +x, the east, is on the left hand). THE ROUTE is the field part's flown line, read
// afresh at every build: level, no roll, at an even speed (45 s); it runs wide of each bend by the bend's own rise
// (6 m at most) and keeps the brick's centre on the bridge, in the lane and from the sward on; it ends dead straight and level along the wall's
// normal at the ring's centre. THE EYE'S HEIGHT is the field part's own (low over open ground and among the
// poppies, lifted over a fence or a wall it passes within 3 m of, 2.1 m of clear air over built things, one rise to
// the ring); never a high sweep.
// THE STRETCHES, by places: farmland from the entry to the dry-stone wall (the bridge on the way); the field's
// edge from that wall to the lane's near mouth; the sunk lane through the ridge (banks of grass, fern and thorn,
// no poppies; it shuts the city from sight); the deep field from the lane's far mouth to where the poppies' cover
// ends; the sward under the wall; the court and the gate.
// THE GAZE is the route's own (36 m ahead) and THE LOOKS, EACH AT A PLACE OF THE WORLD (one fixed point, read at
// build; the gaze's lines below say every rule): ONE ENTRY TO A PLACE, EACH AT WEIGHT 0.8, the weights never summing
// over 0.8. THE ROAD'S PLACES, in the route's order: the first farmstead's house; the bridge; the gap where the road
// passes the dry-stone wall; the lane's near mouth and its far mouth. Each opens and shuts at places as dealt or
// built and is held only while its place stands within 45 degrees of the route's heading as laid (THE SHOULDER: at
// weight 0.8 the gaze then stands 36 degrees off the heading at most, so the way ahead never leaves the view); a
// place whose look would hold the gate under the gaze over the poppies is not looked at (the owner's term 12); an
// ease is 2 m of route to a degree of the turn asked; a look that would be whole for under two seconds is not given.
// FROM THE LANE'S FAR MOUTH TO THE END OF THE LOOKS THE LOOK IS AT A PLACE OF THE CITY, of those the city part hands
// over (every bastion as built, the dome, the tower, the hall, the gate). Where none is held, the place taken is the
// one that (i) where the poppies' cover under the eye is above a half stands 13 degrees or more from the gate's
// place as seen from there (term 12), (ii) through the route's last third keeps the ring within 26 degrees of the
// gaze (the design's R2 a asks 28), (iii) stands within the shoulder, will keep all three long enough TO BE WHOLE
// FOR TWO SECONDS beside the chain's ease (a place that cannot is not given: the chain begins at the first that
// can, and a stretch so left bare is flown with the road's own look or none), and (iv) of those stands nearest the
// heading. It is held to the last metre it keeps them; the next opens one ease before its own first metre and
// eases in while the one let go eases out. The chain has ONE ease (the engine's bell opens and shuts alike, and
// two looks that hand over must ease alike or the gaze sags to the heading between them): the chain is that of
// the least ease giving 2 m to a degree of the greatest turn it asks, and its ease is then as long as leaves every
// one of its places whole for two seconds. THE LAST LOOK ENDS 60 m before the ring or
// where the last straight begins, whichever comes first: from there the engine's own heading meets the ring. No
// look holds an angle off a bearing, a heading, a normal or the ring; nothing else turns the gaze.
// WHAT THE RULES GIVE on the road as it is laid (seeds 1 to 40; worked out at every build, it differs by the deal):
// the lane's far mouth on every seed, its near mouth on most, the bridge and the gap on half, the house on a few;
// then the first bastion west of the gate's own on every seed, the Great Dome on over half of them, the gate's
// own east bastion on every seed, each whole for two seconds and more (the ease 48 to 80 m). NOT KEPT THERE: over
// the last 35 m before the last straight no place is looked at (the gate's own reach, from where the cover under
// the eye ends, is under two seconds): the gaze there is the route's own.
// BEHIND THE ENTRY the road runs on straight along the entry's own axis with its verges and farmland (the field
// part's BEHIND); camera.nearThrough is set (the eye starts lower over the ground than the opening is tall);
// nothing is carried with the camera.
// THE RING: the engine's portal, radius 7, whole from the first metre; neither drawWithin nor drawIn is set; this
// file gives it no light source and no double (the city part paints a fixed pale pool on the passage walls and the
// apron round it: paint, not a light).
//
// WHAT A SEED DEALS (stream 'gate-look', nine draws in this order; the seed's number is never read): the sun's
// side behind us (first die under one half: on our left as we face the gate, else on our right), its height (13
// to 17 degrees: every tree, fence, hedge, house and tower throws a shadow 3.3 to 4.3 times its height across the
// road and the flowers) and bearing off -z, our tail (60 to 70 degrees, well to one side over our shoulder: the
// wall's face takes the sun at a rake); the cloud cover (2 to 4 tenths); the wind (the fifth draw under one half:
// light, else fresh) and its bearing (the sixth); then how broad the towering cumulus stand, how many small clouds
// lie between them, how much high streak crosses the blue. Which farmhouse and tree stands where is dealt by the
// part's streams. Every deal is a late golden afternoon with the wall's face sunlit. ALSO DEALT, by the journey
// and not by the seed: ctx.vary.hour (golden or dawn keeps the sun in the lower third of its 13 to 17 degrees;
// never a dusk), ctx.vary.rare (the fullest fair-weather cloud, 4 tenths), ctx.vary.density and the machine's
// detail (the count of blown petals).
//
// EVERY RULE THAT READS THE EYE (nothing joins this list unsaid):
//  1. the built textures' mipmaps and anisotropic filtering (the brick, the poppies' ground, the cards, the tone
//     field): the pixel's footprint;
//  2. one footprint filter in the ground's paint (dFdx, dFdy, fwidth): the bloom mask at its three sizes, the
//     crops' rows, swaths and tramlines and the apron's courses give way to their own mean where a pixel is larger
//     than they are;
//  3. the air by distance (scene fog on everything but the sky);
//  4. the kit's own near fade and least apparent size of the petals' medium;
//  5. the kit's sky dome, drawn at the far plane round the rendering camera, and the kit's light rig, whose shadow
//     map's box travels with the eye (how finely a shadow is drawn near the eye; never what casts);
//  6. the kit's leaf material: leaves seen against the sun glow a little (a sheen);
//  7. three's own hiding of what lies outside the camera's frustum (chunks of cards, trees, built things, the
//     petals' box);
//  8. the engine's portal;
//  9. the kit's two cloud fields (towering cumulus and small clouds standing in the world 490 to 710 m over the
//     plain) and the dome's own high streaks (part of the sky, at no distance): the fields' puffs face the eye, are
//     sorted by it and thin with distance into the air (the kit's own laws; never what stands where);
// 10. the field part's levels of detail by the eye's place (its own names): a chunk of the standing blooms' cards
//     farther than CARD_FAR (160 m) from the eye's place is not drawn; the low dress (verge tufts, crop rows, the
//     lane's fern and parsley) likewise beyond DRESS_FAR (100 m); the near ground's cards beyond NEAR_FAR (80 m),
//     their thinner outer bands beyond NEAR_OUT (60 m); every card fades in by its own distance from the eye's
//     place over the last FADE (20 m) before its reach, so no block comes on at once; the ground's red law carries
//     the same cover beyond. WHERE the near cards stand is by distance from the road's centre line alone (full
//     within 12 m of it, thinning to none at 40 m), never by the eye;
//     also the field part's chimney smoke: one ribbon to a chimney whose two edges are set square to the eye's
//     bearing about the ribbon's own upright (it turns about its own place, as the kit's puffs do; never where
//     it stands or when it rises), and far cards that go to their mean tone by the pixel's footprint;
// 11. THE LOOKS (the gaze's lines): the engine mixes each look's fixed place into the gaze by the eye's place on
//     the route. Where the gaze points; never what stands where.
// THE GREEN GLOW (Baum's own) is one sheet standing in the world just behind the city's masses: a soft pale green
// halo that hugs the skyline (as wide as the wall, about one city height over the roofs, strongest low behind the
// domes, fading to nothing at every edge; pale, at most a tenth of the air's colour there), fixed in place and in
// the scene's air like everything else: nothing green stands elsewhere in the sky; no light source, nothing by the
// eye.
// NOTHING is placed, sized, shown, hidden, lit or moved by the lens, the gaze, a seed's number or the clock of any
// one moment. The brook's glitter and the gust bands go by place and the world clock alone.
// WHAT MOVES BY THE CLOCK: the wind field over the poppies, the grain and the verge, the trees' crowns, the clouds
// and their shadows (on the country and on the city's wall alike), the petals, two chimneys' smoke, the brook's
// glitter. The cumulus wraps (the kit's wrap); gusts, cloud shadows and petals go by the field part's own laws of
// place and clock; the petals' box and the sky are fixed in the world. Nothing goes by the metres flown.
// NEVER HERE: a figure, anything on the road, anything flying, anything lettered.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField, makeCloudFieldAsync } from '../kit/sky.js';
import { prepareField, buildField, RING } from '../parts/green-gate-past-the-poppies.js';
import { buildCity } from '../parts/green-gate-past-the-poppies-city.js';

export default {
  id: 'green-gate-past-the-poppies',
  name: 'The Road to the Green Wall',
  category: 'screen',
  media: ['air', 'open'],
  placeKind: 'wilderness',
  screen: 'The Wizard of Oz',
  screenYear: '1939',
  screenKind: 'film',
  weirdness: 0.25,
  async build(ctx) {
    const scene = new THREE.Scene(), root = new THREE.Group(); scene.add(root);
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // ---- WHAT THE SEED DEALS (stream 'gate-look'; nine draws, in this order; the last three are the clouds' kinds:
    // how broad the towers, how many small ones, how much high streak): the sun's side behind us (under one half: on
    // our left as we face the gate), its height (13 to 17 degrees) and its bearing off the -z axis (60 to 70
    // degrees); the cloud cover (2 to 4 tenths); the wind (under one half light, else fresh) and its bearing. Every
    // deal is a late golden afternoon with the wall's face sunlit. The seed's number is never read.
    const vary = ctx.vary || {}, lowSun = vary.hour === 'golden' || vary.hour === 'dawn', density = vary.density || 1, detail = (ctx.quality && ctx.quality.detail) || 1;
    const lk = stream('gate-look'), sideDie = lk(), elevDie = lk(), bear = lk.range(60, 70), coverDie = lk(), windDie = lk();
    const elev = 13 + 4 * (lowSun ? elevDie / 3 : elevDie), cover = vary.rare ? 0.4 : 0.2 + 0.2 * coverDie;
    const side = sideDie < 0.5 ? 1 : -1, fresh = windDie >= 0.5, wa = lk.range(-0.5, 0.5), towerDie = lk(), smallDie = lk(), streakDie = lk();
    // the wind blows across the road from the sun's side, a little toward the wall
    const windDir = [-side * Math.cos(wa), Math.abs(Math.sin(wa)) * 0.6 + 0.3], wl = Math.hypot(windDir[0], windDir[1]); windDir[0] /= wl; windDir[1] /= wl;
    const look = {
      windDir, windSpeed: fresh ? 9 : 5.5, windStrength: fresh ? 1.3 : 0.75, cloudDrift: [windDir[0] * 5, windDir[1] * 5],
      cloudCut: 0.58 - 0.30 * (cover - 0.2), cloudShade: 0.33, plotTurn: 0.38, petals: Math.round(6000 * detail * density),
    };
    await ctx.yield();
    const env = await prepareField(ctx, look);
    const path = makePath(env.routePoints), LEN = path.length;
    await ctx.yield();

    // ---- THE SKY AND THE LIGHT: A LATE GOLDEN AFTERNOON OF REAL DAYLIGHT, by the sky and the light rig alone; never
    // a sunset, no orange or pink sky. THE SKY: a deep clear blue overhead that keeps its blue down to about twelve
    // degrees over the land, then a warm pale haze low round the whole horizon (the dome's own band and its scatter
    // toward the sun); high thin streaks across the blue (the dome's own layer; how much is the look's ninth draw).
    // THE LIGHT: the sun stands 13 to 17 degrees up and 60 to 70 degrees off our tail, A WARM STRONG KEY (about
    // 3,900 K); the sky's fill is cooler and clearly weaker, so every shaded side (a bank, a trunk, a wall's return,
    // a tower's far face) is plainly darker and bluer than its lit side, and shadows 3.3 to 4.3 times a thing's
    // height lie dark across the brick and the flowers. BY THE LIGHTS' OWN ARITHMETIC: level ground takes the sun at
    // the sine of its height (4.0 x 0.22 to 0.29) and the fill whole (0.7): ground in shade keeps 0.37 to 0.44 of
    // the same ground in sun (the design's V1 asks 0.35 and more: never black); an upright face turned to the sun
    // takes it nearly whole, so the exposure is set a little under one (post.exposure) to keep pale sunlit faces
    // from burning out. THE SHADOW MAP: its box reaches 130 m either way from the eye, so the tallest thing beside
    // the road (a 13 m oak: a shadow of 56 m at the sun's lowest) and all that throws a shadow to within 70 m of the
    // eye is in it, drawn at 0.13 m a texel (2048); no wider, because every caster in it is paid in triangles.
    // THE SUN'S DISC AND ITS GLOW (the kit sky's own options): the disc is 0.7 degrees in radius (sunSize; under the
    // kit's own 1.5, and the size under which the kit gives a disc its soft skirt: a glow that falls away over
    // several discs' breadth); sunGlow at its whole and the inner lobe set broad (sunGlowTight 0.3: about five discs
    // to its half), so the disc stands in a soft warm glow and never as a bare hard-edged circle.
    const sky = makeSky({
      rng: stream('gate-sky'), preset: 'day', sunElevation: elev, sunAzimuth: side * bear,
      zenith: '#17479f', mid: '#4a86d8', horizon: '#f6dcae', horizonPow: 5.5, midPow: 2.0, scatter: 0.42, scatterColor: '#ffdaa4', scatterPow: 4, sunSize: 0.7, sunGlow: 1, sunGlowTight: 0.3,
      lightColor: '#ffcd98', ambientColor: '#8fb0f4', groundLight: '#6a6448',
      clouds: false, clouds2: { coverage: 0.2 + 0.1 * streakDie, opacity: 0.32, lit: '#fff1da', shade: '#c0cbe2' }, cloudLit: '#ffedcc', cloudShade: '#7c89a8',
    });
    scene.add(sky.object);
    const sun = sky.sunDirection.clone();
    // THE AIR: a warm haze that thickens with distance, so the far field, the far hills and the city's farther
    // masses step back in layers, while the city stands clear from the first metre. Its law is set by the PLACE:
    // from the entry itself the city's deepest masses (CITY_DEEP behind the wall's face, where the city part lays
    // them) keep AIR_KEEP of their own colour; the figure falls where the route's first point puts it (about
    // 1.1 km: of a thing's own colour about 79 in 100 is left at 1 km, 39 at 2 km, 12 at 3 km).
    const AIR_KEEP = 0.76, CITY_DEEP = 260, p0 = path.posAtDist(0, new THREE.Vector3());
    const hazeDir = new THREE.Vector3(0.2, 0.035, 1).normalize(), haze = sky.colorAt(hazeDir).clone().lerp(new THREE.Color('#f0dab2'), 0.5);
    scene.fog = new THREE.FogExp2(haze, Math.sqrt(-Math.log(AIR_KEEP)) / Math.hypot(RING.x - p0.x, CITY_DEEP - p0.z));
    const rig = makeLightRig(sky, { shadow: true, shadowSize: 2048, shadowRange: 130, distance: 420, intensity: 4.0, ambient: 0.7, bounce: 0.3 });
    rig.sun.shadow.bias = -0.0009; rig.sun.shadow.normalBias = 0.4;       // (a low sun wants a little more bias)
    scene.add(rig.object);
    await ctx.yield();
    // CLOUDS OF UNLIKE KINDS AND SIZES (the kit's cloud fields, streams 'gate-cumulus' and
    // 'gate-cumulus-small'; their sizes and counts from the look's own stream: its seventh and eighth draws and the
    // cover): (1) A FEW LARGE TOWERING CUMULUS, three to five, 0.9 to 2 km broad and three quarters as tall as broad,
    // with bright sunlit flanks and flat shaded bases 580 to 700 m over the plain; (2) SMALL ONES BETWEEN, twelve to
    // twenty-two, 140 to 430 m broad, low and flat, their bases 490 to 710 m; (3) HIGH THIN STREAKS above both (the
    // dome's own layer, with the sky). Never a row of like puffs. Both fields drift with ONE WIND, the same that
    // carries their shadows over the ground (look.cloudDrift, 5 m a second), and WRAP (the kit's wrap, over their
    // own 6 km extent), so the dealt cover holds at any clock; none comes near the eye.
    const cloudWind = [look.cloudDrift[0], 0, look.cloudDrift[1]];
    const cumulus = await makeCloudFieldAsync({
      rng: stream('gate-cumulus'), sky, mode: 'cumulus', center: [-120, 0, -180], extent: [6000, 6000], altitude: 640, altitudeJitter: 60,
      count: Math.round(3 + 10 * (cover - 0.2)), size: [900 + 300 * towerDie, 1500 + 500 * towerDie], height: 0.75, puffs: 60, softness: 0.42, erode: 0.95, opacity: 0.9,
      wind: cloudWind, wrap: true, farFade: [3300, 4700], fogFade: 0.55, bottomColor: '#5f6b87',
    }, ctx.yield);
    scene.add(cumulus.object);
    await ctx.yield();
    // each small cloud is 44 puffs (the kit builds one of a body and one to three outliers: of few puffs an outlier's
    // stand apart as single round discs) with the kit's own edge (softness 0.36: a puff's rim is not a wide faint
    // veil), so every one reads as a cloud
    const small = makeCloudField({
      rng: stream('gate-cumulus-small'), sky, mode: 'cumulus', center: [-120, 0, -180], extent: [6000, 6000], altitude: 600, altitudeJitter: 110,
      count: Math.round(12 + 10 * smallDie), size: [140, 430], height: 0.45, puffs: 44, softness: 0.36, erode: 0.9, opacity: 0.84,
      wind: cloudWind, wrap: true, farFade: [3300, 4700], fogFade: 0.55, bottomColor: '#6c7892', noiseTexture: cumulus.noiseTexture,
    });
    scene.add(small.object);
    await ctx.yield();
    // BAUM'S GREEN GLOW: A HALO BOUND TO THE CITY. One sheet standing in the world just behind
    // the city's deepest masses (320 m behind the wall's face; the city part lays them within about 260 m of it), as
    // wide as the wall (1,040 m, end drum to end drum) and 300 m high: about one city height over the skyline in the
    // middle (the masses stand to 150 m), lower toward the wall's ends. A soft pale green in the haze, strongest low
    // behind the domes, fading to nothing sideways within the city's width, at its top and at its foot, so no edge is
    // seen and NOTHING GREEN STANDS ELSEWHERE IN THE SKY. It takes the scene's air by distance like everything else
    // (from far off it is paler, under the haze); A PALE GREEN, AT MOST A TENTH of the air's colour there (the design's
    // own most); never neon; it lights nothing.
    const GLOW = { wide: 1040, high: 300, behind: 320 };
    const glowMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: true, uniforms: THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      vertexShader: '#include <fog_pars_vertex>\nvarying vec2 vG;\nvoid main() { vG = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;\n#include <fog_vertex>\n}',
      fragmentShader: '#include <fog_pars_fragment>\nvarying vec2 vG;\nvoid main() { vec2 q = vec2((vG.x - .5) * 2., vG.y); float top = 1. - .45 * q.x * q.x; float up = 1. - smoothstep(.22, 1., q.y / top); float side = 1. - smoothstep(.3, 1., abs(q.x)); float core = exp(-(q.x * q.x * 6. + (q.y - .28) * (q.y - .28) * 14.)); float a = min(.10, .06 * up * side + .07 * core * up) * smoothstep(0., .07, vG.y); gl_FragColor = vec4(vec3(.42, .84, .56), a);\n#include <fog_fragment>\n}',
    });
    const glowGeo = new THREE.PlaneGeometry(GLOW.wide, GLOW.high), glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(RING.x, GLOW.high / 2, GLOW.behind); glow.rotation.y = Math.PI; glow.renderOrder = 1; scene.add(glow);
    await ctx.yield();

    // ---- THE COUNTRY (the field part) and THE CITY (the city part, with the world's own sun)
    env.sun = sun;
    const field = await buildField(ctx, root, env);
    await ctx.yield();
    // the part's export: { update(dt, t), dispose(), triangles }; shade: the country's own cloud shadows fall on the wall too
    const city = await buildCity(ctx, root, { sun, shade: { tone: env.U.tTone, time: env.U.uTime, cloud: env.U.uCloud }, brick: env.U.tBrick.value });
    await ctx.yield();

    // ---- THE GAZE: the route's own (REACH ahead) and THE LOOKS, each AT A PLACE OF THE WORLD: one fixed point a
    // traveller would look at, read at build from what the field part deals (env.places: road metres) and what the
    // city part builds (city.places: points). No look holds an angle off anything; each is one entry of the engine's
    // own mix at WEIGHT (0.8: the gaze goes most of the way to the place and the way ahead keeps a fifth).
    // THE ROAD'S LOOKS, in the route's order: the first farmstead's house (from the entry until we are abreast of
    // it); the bridge (from the farmstead); the gap where the road passes the dry-stone wall (from the bridge); the
    // lane's near mouth (from the gap); the lane's far mouth (from the near one). A look's two ends are those places,
    // turned into the route's own metres (the route's nearest point, as laid this build), and what is worked out at
    // build from the route and the place: (1) THE SHOULDER: a look is held only while its place stands within
    // SHOULDER (45) degrees of the route's heading as laid, so the way ahead never leaves the view: of its reach it
    // keeps the longest run that does; (2) THE LAW'S OWN END (the one end that is not a place; the design's R2 a: the
    // ring within 28 degrees of the gaze through the route's last third): in the last third a look ends at the metre
    // where holding it would put the ring more than KEEP (26) degrees off the gaze; (3) THE OWNER'S TERM 12 (R2 b): a
    // place whose look would hold the gate's place within NEAR (12) degrees of the gaze for more than RUN (2)
    // seconds, where the poppies' cover under the eye is above a half, is not looked at. EACH EASE is RATE metres of
    // route to a degree of the turn asked where it meets the whole look (the greater of its two: the engine's bell
    // opens and shuts alike). A LOOK THAT WOULD BE WHOLE FOR UNDER WHOLE (2) SECONDS IS NOT GIVEN.
    // THE CITY'S LOOKS, from the lane's far mouth to where the looks end (LAST_CLEAR, 60 m: the design's V3, before
    // the ring, or where the last straight begins, whichever comes first: from there the engine's own heading meets
    // the ring): a chain over the city's places as the city part hands them. Where none is held, the place taken (i)
    // stands CLEAR (13) degrees or more from the gate's place as seen from there wherever the poppies' cover under
    // the eye is above a half (so the gate itself only where it is not), (ii) keeps the ring within KEEP of the gaze
    // through the last third, (iii) stands within the shoulder, will keep all three for WHOLE seconds, and (iv) of
    // those stands nearest the heading; it is held to the last metre it keeps them. The entries' weights never sum
    // over WEIGHT: the chain has one ease, and at a hand-over the two looks ease together.
    const road = env.road, land = env.land, pl = env.places, cp = city.places;
    const RAD = Math.PI / 180, REACH = 36, SECONDS = 45, WEIGHT = 0.8, SHOULDER = 45, KEEP = 26, NEAR = 12, RUN = 2, CLEAR = 13, WHOLE = 2, LAST_CLEAR = 60, CALM = 12;
    // RATE, the one rate of every ease: at the route's own speed this many metres to a degree turn the gaze, over an
    // ease, at CALM in the mean (12 degrees a second: the crew's calm measure for nine tenths of a flight) and, at the
    // bell's steepest (one and a half times its mean), at that measure's most (18)
    const N = Math.floor(LEN), perSecond = LEN / SECONDS, RATE = perSecond / CALM, gP = new THREE.Vector3(), gA = new THREE.Vector3(), gT = new THREE.Vector3(), gB = new THREE.Vector3();
    // the route as laid, metre by metre: the eye's place E and its heading H (toward its own point REACH on)
    const E = new Float32Array(3 * N + 3), H = new Float32Array(3 * N + 3);
    for (let m = 0; m <= N; m++) {
      path.posAtDist(m, gP); path.posAtDist(Math.min(LEN, m + REACH), gA); gA.sub(gP);
      if (gA.lengthSq() < 1e-6) gA.set(H[3 * m - 3], H[3 * m - 2], H[3 * m - 1]); gA.normalize();
      E[3 * m] = gP.x; E[3 * m + 1] = gP.y; E[3 * m + 2] = gP.z; H[3 * m] = gA.x; H[3 * m + 1] = gA.y; H[3 * m + 2] = gA.z;
    }
    const metreAt = (x, z) => { let best = 0, least = 1e18; for (let m = 0; m <= N; m++) { const dx = E[3 * m] - x, dz = E[3 * m + 2] - z, q = dx * dx + dz * dz; if (q < least) { least = q; best = m; } } return best; };
    const onRoad = (s) => { const a = road.at(s); return [a.x, land.roadY(s), a.z]; };       // a place of the road itself, at the brick
    const abreast = (s) => { const a = road.at(s); return metreAt(a.x, a.z); };              // the route's metre abreast of the road's metre s
    const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
    // degrees between the place's bearing from the eye and the route's heading at metre m
    const off = (m, P) => Math.acos(Math.min(1, gT.set(P[0] - E[3 * m], P[1] - E[3 * m + 1], P[2] - E[3 * m + 2]).normalize().dot(gA.set(H[3 * m], H[3 * m + 1], H[3 * m + 2])))) / RAD;
    // the gaze at metre m with the look at P whole (the engine's own mix), and its angle to the point Q, in degrees
    const gazeTo = (m, P) => gT.set(P[0] - E[3 * m], P[1] - E[3 * m + 1], P[2] - E[3 * m + 2]).normalize().multiplyScalar(WEIGHT).add(gA.set(H[3 * m], H[3 * m + 1], H[3 * m + 2]).multiplyScalar(1 - WEIGHT)).normalize();
    const toward = (m, Q) => gA.set(Q[0] - E[3 * m], Q[1] - E[3 * m + 1], Q[2] - E[3 * m + 2]).normalize();
    const apart = (m, P, Q) => { gazeTo(m, P); return Math.acos(Math.min(1, gT.dot(toward(m, Q)))) / RAD; };
    const turn = (m, P) => { gazeTo(m, P); return Math.acos(Math.min(1, gT.dot(gA.set(H[3 * m], H[3 * m + 1], H[3 * m + 2])))) / RAD; };
    const point = (p) => [p.x, p.y, p.z], GATE_AT = point(cp.gate), RING_AT = [RING.x, RING.y, RING.z];
    const THIRD = Math.ceil(LEN * 2 / 3);                    // where the route's last third begins (R2 a)
    // where the last straight begins: from there to its end the route runs along the wall's own normal
    let sStraight = N; const nrm = Math.atan2(-cp.normal.x, -cp.normal.z);
    for (let m = N - 1; m >= 0; m--) { if (Math.abs(wrapA(Math.atan2(E[3 * m + 3] - E[3 * m], E[3 * m + 5] - E[3 * m + 2]) - nrm)) > 0.5 * RAD) break; sStraight = m; }
    // one look at the place P over the reach a to b (route metres), by the rules above; null where it is not given
    const lay = (P, a, b) => {
      let a1 = a, b1 = a - 1, run = -1;
      for (let m = a; m <= b + 1; m++) {                     // (1) the shoulder: the longest run inside it
        const inside = m <= b && off(m, P) <= SHOULDER;
        if (inside && run < 0) run = m;
        if (!inside && run >= 0) { if (m - 1 - run > b1 - a1) { a1 = run; b1 = m - 1; } run = -1; }
      }
      for (let m = Math.max(a1, THIRD); m <= b1; m++) if (apart(m, P, RING_AT) > KEEP) { b1 = m; break; }      // (2) the law's own end
      let near = 0;                                          // (3) term 12: the gate's place under the gaze, over the poppies
      for (let m = a1; m <= b1; m++) {
        near = land.cover(E[3 * m], E[3 * m + 2]).c > 0.5 && apart(m, P, GATE_AT) < NEAR ? near + 1 : 0;
        if (near > RUN * perSecond) return null;
      }
      if (b1 <= a1) return null;
      // the ease: as long as the turn it asks, which is the turn the whole look asks where the ease meets it
      let e = 0; while (e < RATE * Math.max(turn(a1 + e, P), turn(b1 - e, P)) && 2 * e < b1 - a1) e++;
      return b1 - a1 - 2 * e < WHOLE * perSecond ? null : { at: P, a: a1, b: b1, e };
    };
    // THE LOOKS, in the route's order: each reach opens where the place before it lies
    const looks = [], add = (L) => { if (L) looks.push(L); return L; };
    const mFarm = pl.farm === null ? 0 : abreast(pl.farm), mBridge = abreast(pl.bridge), mEdge = abreast(pl.edge), mLane0 = abreast(pl.lane0), mLane1 = abreast(pl.lane1), mSward = abreast(pl.sward);
    if (pl.farm !== null) {                                  // the first farmstead's house, at the eye's own level as we come abreast
      const h = field.things.homes.slice().sort((p, q) => Math.abs(p.s - pl.farm) - Math.abs(q.s - pl.farm))[0];
      add(lay([h.x, E[3 * mFarm + 1], h.z], 0, mFarm));
    }
    add(lay(onRoad(pl.bridge), mFarm, mBridge)); add(lay(onRoad(pl.edge), mBridge, mEdge)); add(lay(onRoad(pl.lane0), mEdge, mLane0)); add(lay(onRoad(pl.lane1), mLane0, mLane1));
    // THE CITY'S PLACES as the city part hands them over: every bastion as built, the dome, the tower, the hall, the gate
    const cityAt = cp.bastions.map(point).concat([point(cp.dome), point(cp.tower), point(cp.hall), GATE_AT]);
    const mEnd = Math.min(N - LAST_CLEAR, sStraight), least = WHOLE * perSecond;      // where the looks end; two seconds of route
    // degrees between two places as seen from metre m; between the whole looks at them (the turn one hands the other)
    const seen = (m, P, Q) => { toward(m, Q); return Math.acos(Math.min(1, gT.set(P[0] - E[3 * m], P[1] - E[3 * m + 1], P[2] - E[3 * m + 2]).normalize().dot(gA))) / RAD; };
    const between = (m, P, Q) => { gazeTo(m, Q); gB.copy(gT); gazeTo(m, P); return Math.acos(Math.min(1, gT.dot(gB))) / RAD; };
    const poppies = new Uint8Array(N + 2); for (let m = mLane1; m <= mEnd; m++) poppies[m] = land.cover(E[3 * m], E[3 * m + 2]).c > 0.5 ? 1 : 0;
    // (i) term 12, (ii) the law, (iii) the shoulder: does the place P keep all three at metre m
    const keeps = (m, P) => off(m, P) <= SHOULDER && (m < THIRD || apart(m, P, RING_AT) <= KEEP) && (!poppies[m] || seen(m, P, GATE_AT) >= CLEAR);
    // for every place and metre: the last metre of the unbroken run over which it keeps them from there (-1: it does not)
    const until = cityAt.map((P) => { const u = new Int32Array(N + 2).fill(-1); for (let m = mEnd; m >= mLane1; m--) if (keeps(m, P)) u[m] = m < mEnd && u[m + 1] >= 0 ? u[m + 1] : m; return u; });
    // THE CHAIN of the city's looks: at each metre where none is held, (iv) the place nearest the heading of those
    // that keep the three rules there and on for long enough TO BE WHOLE FOR TWO SECONDS once the chain's ease has
    // taken its share (one ease where it takes over from the place before it, fewer than two seconds of route behind
    // it; else two): a place that cannot is not given (LK5' rules over LK6), so the chain begins at the first place
    // that can and a stretch left bare is flown with the road's own look or none. A place taken is held to the last
    // metre it keeps the rules.
    const chainBy = (e) => {
      const c = [];
      for (let m = mLane1; m <= mEnd;) {
        const p = c[c.length - 1], joins = !!p && m - p.b - 1 < least;
        let pick = -1, nearest = 1e9;
        for (let i = 0; i < cityAt.length; i++) {
          if (until[i][m] < 0 || until[i][m] - m < least + (joins ? 1 : 2) * e) continue;
          const o = off(m, cityAt[i]); if (o < nearest) { nearest = o; pick = i; }
        }
        if (pick < 0) { m++; continue; }
        c.push({ at: cityAt[pick], a: m, b: until[pick][m], joins }); m = until[pick][m] + 1;
      }
      return c;
    };
    // THE CHAIN'S ONE EASE: RATE metres to a degree of the greatest turn the chain asks, each turn read where its
    // ease meets the whole look (an open end: the whole look's own turn off the heading one ease inside it; a
    // hand-over: from the gaze at the place let go, one ease before its last metre, to the gaze at the next where it
    // opens whole; both off the heading as laid there). The chain is the one its own ease allows: THE LEAST EASE
    // LONG ENOUGH FOR THE CHAIN OF THE PLACES THAT STAY WHOLE FOR TWO SECONDS WITH IT.
    const yawOff = (m, P) => { gazeTo(m, P); return wrapA(Math.atan2(gT.x, gT.z) - Math.atan2(H[3 * m], H[3 * m + 2])) / RAD; };
    const askedBy = (c, e) => c.reduce((most, L, i) => { const q = c[i + 1], inn = Math.min(L.b, Math.round(L.a + e)), out = Math.max(L.a, Math.round(L.b - e)); return Math.max(most, L.joins ? 0 : turn(inn, L.at), q && q.joins ? Math.abs(wrapA((yawOff(out, L.at) - yawOff(q.a, q.at)) * RAD)) / RAD : turn(out, L.at)); }, 0);
    let ease = 0, chain = [];
    for (let e = 1; e <= N; e++) { const c = chainBy(e); if (RATE * askedBy(c, e) <= e) { ease = e; chain = c; break; } }
    // THE EASE LENGTHENED (calm: the gaze may turn 18 degrees a second at most with the road's own turn in it): of
    // that chain, the longest ease that still leaves every one of its places whole for two seconds
    const same = (c) => c.length === chain.length && c.every((L, i) => L.at === chain[i].at && L.a === chain[i].a);
    for (let e = ease + 1; e <= N; e++) { const c = chainBy(e); if (!same(c) || RATE * askedBy(c, e) > e) break; ease = e; chain = c; }
    // the road's looks: one that opens inside the ease of the look before it opens so that the two eases end together; one left whole for under two seconds by that is not given
    for (let i = 1; i < looks.length; i++) {
      const p = looks[i - 1], q = looks[i]; if (q.a < p.b) q.a = Math.max(q.a, p.b - Math.min(p.e, q.e));
      if (q.b - q.a - 2 * q.e < least) { looks.splice(i, 1); i--; }
    }
    // a hand-over: the next opens one ease before its own first metre, so it is whole only where it keeps the rules and eases in while the one let go eases out
    chain.forEach((L) => { L.a -= L.joins ? ease : 0; L.e = ease; looks.push(L); });
    // one entry to a place; steady: the steady camera looks at the same places with the same weight
    const pois = looks.map((L) => ({ at: L.at, from: L.a / LEN, to: L.b / LEN, weight: WEIGHT, fade: L.e / (L.b - L.a), steady: true }));
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: SECONDS,
      camera: { fov: 62, near: 0.5, nearThrough: 0.5, far: 6400, lookAhead: REACH, sway: 0, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: RING.r, color: '#f1ecd2', glow: 0.8 },
      post: { exposure: 0.84, bloom: { strength: 0.2, radius: 0.55, threshold: 0.94 }, grade: { saturation: 1.04, contrast: 1.0, tint: '#fff1dc', shadowTint: '#0b1424', vignette: 0.2, grain: 0.015 } },
      ride: 'none', companion: 'none', style: 'none',
      update(dt, time, camera, u) {
        sky.update(dt, time, camera); rig.update(dt, time, camera); cumulus.update(dt, time, camera); small.update(dt, time, camera);
        field.update(dt, time, camera); city.update(dt, time);
      },
      dispose() { field.dispose(); city.dispose(); glowGeo.dispose(); glowMat.dispose(); },
    };
  },
};
