// AFTER THE SIXTH SUN. A world of six suns that has never been dark. The flight compresses its last afternoon: over
// wheat and down an avenue toward an observatory ridge while the suns set one by one, the last red sun is eaten to a
// thread and goes out, and the black sky ignites with the stars of a cluster seen from inside.
//
// ONE CLOCK. Every sun position, sky colour, light, shadow, the bite, the star wave, the torches and the dome's turn
// is a pure function of where we are on the route in metres, m = u * length (parts/after-the-sixth-sun-sky.js: makeClock).
// NO WINDOW IS TYPED IN u: the clock hangs on two places (the first notch half-way down the avenue, the snap at the road's first bend at the
// ridge foot), and every fade, gaze, pace and bird window is metres from a place found on the land (parts/...-land.js: routePlaces).
// Through the previous portal (u = 0) the world shows its five-sun afternoon; wind, birds and water run on the world clock.
//
// MAP OF THIS FILE: seeded choices (season, avenue species, sun cast, cluster, cirrus) -> the clock and the sky ->
// lights and fog -> the land (ground, shadow decals) -> trees -> the observatory (the hero part) -> the farm, bridge,
// people, torches and city (parts/...-folk.js) -> water -> birds and particles -> gaze and pace -> update().
import * as THREE from 'three';
import { makePath, clamp, smoothstep } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';
import { buildHero, buildTerrace } from '../parts/after-the-sixth-sun.js';
import { makeClock, makeCluster, makeSkyDome, makeStars, makeLakeMirror, makeGlitter } from '../parts/after-the-sixth-sun-sky.js';
import { landH, LAND_GLSL, skylineEl, beltH, makeFields, landUniforms, makeGround, makeDecals, LAKE_Y, RIVER_Y, KNOLL, CREST_Z, FARM, ROAD, routePlaces, CITY, lakeShoreZ, NPOOL, poolBoxes } from '../parts/after-the-sixth-sun-land.js';
import { makeBuilt, makeFolk } from '../parts/after-the-sixth-sun-folk.js';

const DUR = 48;
// The route. Low over the fields and into the avenue; over the bridge; up the ridge; through the saddle at the gallery's height, 30 m west of the
// dome; then one straight line down the far slope toward the burning town (the last three points lie on one line, 13 degrees down) to a ring over
// the lake. WHERE THE ROUTE ENDS is set by the land and the water: the line of descent keeps 10 m and more above the far slope all the way; it ends
// 30 m above the lake, where the ring's lower edge (23 m) still clears the tallest mast afloat (19 m), 83 m of flight past the shore;
// that is far below the ridge's crest (72 m in the saddle), so the land itself hides the ring from the whole approach and no white light shows on
// the hill before the dark (a check at the end of build() warns if it ever does).
const AV_Z0 = 243, AV_STEP = 14, AV_N = 15;      // the avenue: its first pair of trees, the spacing, the number of pairs
const PTS = [[-110, 17, 540], [-96, 16, 470], [-60, 13.5, 380], [-20, 11, 300], [0, 9, 240], [0, 8, 150], [0, 8.5, 50], [4, 11, -35], [16, 30, -130], [28, 66, -210], [36, 84, -285], [36, 84, -350], [62.4, 67.8, -413], [124, 30, -560]];

// instanced plants on one wind material: items [{ x, y, z, sx, sy, rot, tint }]
function plant(geo, mat, items) {
  const mesh = new THREE.InstancedMesh(geo, mat, items.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
  items.forEach((it, i) => {
    e.set(it.tx || 0, it.rot, it.tz || 0); q.setFromEuler(e); v.set(it.x, it.y, it.z); s.set(it.sx, it.sy, it.sx);
    mesh.setMatrixAt(i, m.compose(v, q, s)); const t = it.tint || [1, 1, 1]; mesh.setColorAt(i, c.setRGB(t[0], t[1], t[2]));
  });
  mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 4;
  return mesh;
}

export default {
  id: 'after-the-sixth-sun',
  name: 'After the Sixth Sun',
  category: 'books',
  placeKind: 'sky',
  book: 'Nightfall and Other Stories',
  author: 'Isaac Asimov, 1920 to 1992',
  weirdness: 0.55,
  async build(ctx) {
    const { rng } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = vary.density ?? 1, rare = !!vary.rare;
    // ---- seeded choices (the first draws, in this order), dealt by shares: where the brief names a default it gets 1/2 and the others 1/4 each;
    // where it names none the shares are equal
    // the season: ripe wheat (the brief's default) 1/2, green spring with the avenue in blossom 1/4, stubble with stooks and river mist 1/4
    const season = (() => { const r = rng(); return r < 1 / 2 ? 0 : r < 3 / 4 ? 1 : 2; })();
    // the avenue's trees: limes 1/3, poplars 1/3, cypresses 1/3
    const species = (() => { const r = rng(); return r < 1 / 3 ? 'lime' : r < 2 / 3 ? 'poplar' : 'cypress'; })();
    // which pair of small suns stands low on the left and sets first: the white pair 1/2, the blue pair 1/2. Cirrus (below): 1/3, the brief's share
    const swapPairs = rng.chance(1 / 2), goldAz = rng.range(12, 22);
    const heartAz = rng.range(-4, 8), heartEl = rng.range(20, 24), warmth = rng.range(0.15, 0.6), blue = rng.range(0.45, 0.62);
    const cirrus = rng.chance(1 / 3) ? 1 : 0;
    // ---- the seeded streams: one for each cast and each planting, all taken here in this fixed order before anything is built, so that no loop's
    // count of draws (a tree refused near the route, a block refused by the land) can re-deal another thing
    const S = {};
    for (const name of ['cluster', 'dome', 'stars', 'starsWide', 'fields', 'avenue', 'fieldTrees', 'belt', 'knollCypresses', 'farmCypresses', 'observatory', 'farm', 'walls', 'sheaves',
      'ricks', 'city', 'walkers', 'harvesters', 'cattle', 'carts', 'flames', 'smoke0', 'smoke1', 'smoke2', 'smoke3', 'smoke4', 'grass', 'reeds', 'fauna', 'swifts', 'starlings', 'crows', 'geese',
      'pollen', 'leaves', 'sparks', 'rick', 'rickSparks', 'river', 'watchers', 'boats', 'stooks', 'jetty', 'isles', 'wall', 'terrace', 'lakeReeds', 'mill', 'flicker']) S[name] = rng.fork(name);
    // fix round 2: every new thing takes a stream of its own made from the world's seed and its name; it draws nothing from any parent, so the 49
    // streams above deal exactly as before: the mole's works and fires, the further gangs of reapers and their wains, the stooks on the stubble, the
    // hedges' form and gaps, the low cloud, the flicker of the firelight in the observatory's door
    for (const name of ['moleWorks', 'gangs', 'stookRows', 'hedges', 'clouds', 'firelight', 'scholars', 'tide', 'stookForm', 'moleFires', 'tremble']) S[name] = ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // where the things that run on the world's clock stand when it starts: the observatory's inner firelight and the two beats of the city's glow
    const PH = { hero: S.flicker() * 60, cityA: S.flicker() * 6.283, cityB: S.flicker() * 6.283, door: S.firelight() * 6.283 };
    // some cloud on every afternoon: how much of the low sky it covers (a third to all of the rule's cover) and where the field of it lies
    const cloud = { amount: S.clouds.range(0.35, 1), ox: S.clouds() * 40, oz: S.clouds() * 40 };
    const hour = vary.hour;

    const scene = new THREE.Scene();
    const path = makePath(PTS);
    // ---- the places the journey's windows hang on (metres along the route), and the sky's clock hung on two of them:
    // the first notch is seen from half-way down the avenue, where the sun stands at the far end of the trees; the last thread goes as we
    // cross the road's first bend at the foot of the ridge, the dome on the skyline above. (The viewer's later hours: the sky has already
    // turned when we arrive; for 'night' the notch comes half-way to the avenue and the snap at the avenue's last trees.)
    const RP = routePlaces(path, { avenue: [AV_Z0, AV_Z0 - AV_STEP * (AV_N - 1)] }), LEN = RP.L;
    const clock = makeClock({ swapPairs, goldAz, heartAz, heartEl, skyline: skylineEl,
      notchAt: hour === 'night' ? RP.AH / 2 : RP.AM, goneAt: hour === 'night' ? RP.AE : RP.FT, fullAt: hour === 'night' ? RP.B1 : RP.H1, cityAt: RP.CV, endAt: LEN, tremble: [S.tremble() * 6.283, S.tremble() * 6.283], turn0: hour === 'night' ? 11.5 : hour === 'golden' ? 6 : 0 });
    const MN = clock.notchAt, MG = clock.goneAt;
    await ctx.yield();

    // ---- the sky: dome, stars, the lake that mirrors them
    const cluster = makeCluster(S.cluster, clock, { warmth });
    const dome = makeSkyDome(S.dome, clock, cluster, { cirrus, cloud });
    scene.add(dome.object);
    await ctx.yield();
    const stars = await makeStars(S.stars, clock, cluster, { wide: S.starsWide, yieldFn: ctx.yield, count: Math.round(30000 * (detail < 1 ? 0.7 : 1)), mirror: 7000, landGLSL: LAND_GLSL, lakeY: LAKE_Y, blue });
    scene.add(stars.object, stars.mirror);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(new THREE.Color('#f1e6cf'), 0.00035);
    scene.background = new THREE.Color('#05040a');
    const lake = makeLakeMirror(dome, { landGLSL: LAND_GLSL, lakeY: LAKE_Y, fogColor: scene.fog.color, fogDensity: scene.fog.density });
    scene.add(lake.object);
    await ctx.yield();

    // ---- four lights for the whole flight, never switched: a hemisphere and three directionals re-aimed and re-coloured by the clock
    const hemi = new THREE.HemisphereLight(0xffffff, 0x555555, 1);
    const dirs = [0, 1, 2].map(() => { const d = new THREE.DirectionalLight(0xffffff, 1); scene.add(d, d.target); return d; });      // 0 white pair / red sun / heart, 1 golden sun, 2 blue pair
    scene.add(hemi);

    // ---- the land
    const fields = makeFields(S.fields, season);
    const LU = landUniforms(fields);
    LU.uFogCol.value = scene.fog.color; LU.uFogDen.value = scene.fog.density;
    const ground = await makeGround(LU, ctx.yield);
    scene.add(ground.object);
    await ctx.yield();
    const casters = [];

    // ---- trees: one wind, one material
    const wind = flora.makeWind({ direction: [0.94, 0.34], strength: 0.6, speed: 1 });
    const matOpts = { wind, backlight: 1.6, ambient: 1.3, leafAmbient: 1.35, wrap: 0.8, sheen: 0.4 };
    await flora.prepareLeafTexture(matOpts, ctx.yield);
    const treeMat = flora.windMaterial(matOpts);
    await ctx.yield();
    // the avenue: 15 pairs 14 m apart, rows at x -12 and +12
    const blossom = season === 1 && species === 'lime';
    const avGeos = [];
    for (let k = 0; k < 2; k++) {
      if (species === 'lime') avGeos.push(flora.oakGeometry({ rng: S.avenue, height: 15, detail: 2, leaf: blossom ? '#e9e3d2' : '#5d8436', leafLight: blossom ? '#fbf8ee' : '#8fb04a', leafDark: blossom ? '#a9a48c' : '#3a5a24', bark: '#6a5a48' }));
      else if (species === 'poplar') avGeos.push(flora.cypressGeometry({ rng: S.avenue, height: 21, detail: 1, girth: 0.11, leaf: '#5f8a38', bark: '#7a705c' }));
      else avGeos.push(flora.cypressGeometry({ rng: S.avenue, height: 18.5, detail: 1, girth: 0.1, leaf: '#234430', bark: '#5a4636' }));
      await ctx.yield();
    }
    const avItems = [[], []];
    for (let k = 0; k < AV_N; k++) for (const sd of [-1, 1]) {
      const v = Math.floor(S.avenue() * 2), g = avGeos[v], x = sd * (12 + (S.avenue() - 0.5) * 0.8), z = AV_Z0 - AV_STEP * k + (S.avenue() - 0.5) * 1.2;
      const sx = species === 'lime' ? 0.7 + 0.08 * S.avenue() : 1 + 0.12 * S.avenue(), sy = species === 'lime' ? 1.16 + 0.14 * S.avenue() : 0.95 + 0.14 * S.avenue(), br = 0.9 + 0.2 * S.avenue();
      avItems[v].push({ x, y: landH(x, z) - 0.2, z, sx, sy, rot: S.avenue() * 6.283, tint: [br, br, br * 0.96] });
      const H = g.userData.height * sy, R = g.userData.radius * sx;
      if (species === 'lime') casters.push({ x, z, hc: H * 0.64, r: R * 0.9, tr: 0.55 });
      else casters.push({ x, z, hc: H * 0.97, r: R * 0.75, tr: 0.5, kind: 1 });
    }
    for (let v = 0; v < 2; v++) if (avItems[v].length) scene.add(plant(avGeos[v], treeMat, avItems[v]));
    await ctx.yield();
    // single field trees, most of them on the field boundaries, thicker toward the road down the middle of the plain (a share that falls off over
    // 140 m either side of it); none in the corridor we fly through; the finer model for those within 95 m of the eye's line (cost only)
    const fGeos = [flora.oakGeometry({ rng: S.fieldTrees, height: 13, detail: 1, leaf: '#4b6435', leafLight: '#748849', leafDark: '#2f4124' }), flora.oakGeometry({ rng: S.fieldTrees, height: 12, detail: 0, leaf: '#455e30', leafLight: '#6c7e43', leafDark: '#2c3d22' }), flora.oakGeometry({ rng: S.fieldTrees, height: 14, detail: 0, leaf: '#4e6433', leafLight: '#788946', leafDark: '#304322' })];
    await ctx.yield();
    const fItems = [[], [], []], fts = [];
    for (let tries = 0; fts.length < 84 && tries < 6000; tries++) {
      let x = S.fieldTrees.range(-520, 420); const z = S.fieldTrees.range(36, 800);
      if (S.fieldTrees() < 0.6) { const i = fields.stripOf(x); x = fields.xb[S.fieldTrees() < 0.5 ? i : i + 1] + (S.fieldTrees() - 0.5) * 3; }
      const near = path.nearestXZ(x, z);
      if (near.dist < 24 || (Math.abs(x) < 36 && z > 20 && z < 275) || Math.hypot(x - FARM[0], z - FARM[1]) < 70) continue;
      if (S.fieldTrees() > Math.exp(-Math.abs(x) / 140)) continue;
      if (fts.some((t) => Math.hypot(t.x - x, t.z - z) < 28)) continue;
      const v = near.dist < 95 ? 0 : 1 + Math.floor(S.fieldTrees() * 2), g = fGeos[v], sc = 0.85 + 0.4 * S.fieldTrees(), br = 0.88 + 0.24 * S.fieldTrees();
      fts.push({ x, z }); fItems[v].push({ x, y: landH(x, z) - 0.15, z, sx: sc, sy: sc * (0.95 + 0.15 * S.fieldTrees()), rot: S.fieldTrees() * 6.283, tint: [br, br, br * 0.94] });
      casters.push({ x, z, hc: g.userData.height * sc * 0.62, r: g.userData.radius * sc * 0.88, tr: 0.45 });
    }
    for (let v = 0; v < 3; v++) if (fItems[v].length) scene.add(plant(fGeos[v], treeMat, fItems[v]));
    await ctx.yield();
    // the belt of dark trees on the ridge's skyline (none in the saddle where the road and the flight cross, nor on the knoll)
    const bGeos = [flora.oakGeometry({ rng: S.belt, height: 14, detail: 0, leaf: '#263f2a', leafLight: '#3c5a34', leafDark: '#16261a', bark: '#3a3028' }), flora.oakGeometry({ rng: S.belt, height: 14, detail: 0, leaf: '#2b4426', leafLight: '#445e30', leafDark: '#182818', bark: '#3a3028' }), flora.coniferGeometry({ rng: S.belt, height: 17, detail: 0, leaf: '#1f3a2a' })];
    const bItems = [[], [], []], NB = Math.round(140 * (detail < 1 ? 0.8 : 1));
    for (let i = 0; i < NB; i++) {
      const x = -650 + 900 * (i + S.belt()) / NB, bh = beltH(x); if (bh < 4) continue;
      const z = CREST_Z + ((i % 3) - 1) * 8 + (S.belt() - 0.5) * 5, v = S.belt() < 0.22 ? 2 : Math.floor(S.belt() * 2), g = bGeos[v];
      const top = bh * (0.9 + 0.2 * S.belt()), sy = top / g.userData.height, br = 0.85 + 0.3 * S.belt();
      bItems[v].push({ x, y: landH(x, z) - 0.3, z, sx: sy * (v === 2 ? 1.25 : 0.95), sy, rot: S.belt() * 6.283, tint: [br, br, br] });
    }
    for (let v = 0; v < 3; v++) if (bItems[v].length) scene.add(plant(bGeos[v], treeMat, bItems[v]));
    await ctx.yield();
    // slim dark flames round the observatory and the farm
    const cyGeo = flora.cypressGeometry({ rng: S.knollCypresses, height: 13, detail: 0, leaf: '#21402c', bark: '#4a3a2c' }), cyItems = [];
    const cyAt = (x, z, sc, r) => { cyItems.push({ x, y: landH(x, z) - 0.2, z, sx: sc, sy: sc * (0.9 + 0.3 * r()), rot: r() * 6.283 }); casters.push({ x, z, hc: 13 * sc, r: 1.3 * sc, tr: 0.3, kind: 1 }); };
    for (let k = 0; k < 22; k++) {
      const kr = S.knollCypresses, a = kr() * 6.283, r = 24 + 30 * kr(), x = KNOLL[0] + 14 + Math.cos(a) * r, z = KNOLL[1] + Math.sin(a) * r * 0.7;
      if (x < 50 || Math.hypot(x - KNOLL[0], z - KNOLL[1]) < 19 || (x > 86 && x < 126 && z > KNOLL[1] - 16 && z < KNOLL[1] + 4) || path.nearestXZ(x, z).dist < 12) continue;
      cyAt(x, z, 0.75 + 0.5 * kr(), kr);
    }
    for (let k = 0, fr = S.farmCypresses; k < 14; k++) { const a = k / 14 * 6.283 + fr() * 0.3, r = 50 + 14 * fr(), x = FARM[0] + Math.cos(a) * r, z = FARM[1] + Math.sin(a) * r * 0.9; if (x < FARM[0] - 40 && Math.abs(z - FARM[1]) < 22) continue; cyAt(x, z, 0.8 + 0.5 * fr(), fr); }
    scene.add(plant(cyGeo, treeMat, cyItems));
    await ctx.yield();

    // ---- the observatory on its knoll (the hero part; its dome is turned by the clock)
    const hero = (await buildHero(ctx, { rng: S.observatory, scholars: S.scholars, pools: LU.uTorch.value, poolBox: LU.uPoolBox.value })).world();
    hero.object.position.set(KNOLL[0], landH(KNOLL[0], KNOLL[1]) - 0.4, KNOLL[1]);
    scene.add(hero.object);
    casters.push({ x: KNOLL[0], z: KNOLL[1], hc: 24, r: 13, tr: 13, kind: 1 });
    await ctx.yield();

    // ---- what people built (farm, windmill, walls and hedges, bridge, far city) and the people, beasts and fires
    const built = await makeBuilt({ rng: S.farm, streams: S, fields, season, casters, yieldFn: ctx.yield });
    scene.add(built.object);
    await ctx.yield();
    await ctx.yield();
    // the city's smoke: five columns leaning east, raised by the clock once the fires have taken
    const T = { value: 0 }, smokes = [];
    for (let k = 0; k < 5; k++) {
      const f = built.fires[Math.min(built.fires.length - 1, k * 3)]; if (!f) break;
      const sm = fx.makeSmokeColumn({ rng: S['smoke' + k], time: T, position: [f.x, f.y, f.z], height: 380 + 70 * k, radius: [14, 150], size: [45, 170], count: 130, wind: [1, 0, 0.12], bend: 0.85, rim: 0.3, scatter: 0.35,
        color: '#3b2c30', colorTop: '#4c4652', shadowColor: '#160d10', ambient: '#150a09', hot: '#e2400e', hotFalloff: 380, opacity: 0, rate: 0.03, sunDir: [clock.heartDir.x, clock.heartDir.y, clock.heartDir.z], sunColor: '#8a9cd0' });
      scene.add(sm.object); smokes.push(sm); await ctx.yield();
    }

    // ---- small growth near the flight: rough grass under the avenue, on the verges, in the meadows and up the ridge; reeds on both banks
    const roadD = (x, z) => { let d = 1e9; for (let i = 0; i < ROAD.length - 1; i++) { const a = ROAD[i], b = ROAD[i + 1], bx = b[0] - a[0], bz = b[1] - a[1], t = clamp(((x - a[0]) * bx + (z - a[1]) * bz) / (bx * bx + bz * bz), 0, 1); d = Math.min(d, Math.hypot(x - a[0] - bx * t, z - a[1] - bz * t)); } return d; };
    const grassDen = (x, z) => {
      if (z < CREST_Z - 20 || landH(x, z) < -0.5 || roadD(x, z) < 4.2) return 0;
      if (z < 34) return z < -112 ? 0.75 : 1;
      if (Math.abs(x) < 15.5) return Math.abs(x) > 10.6 ? 0.85 : 0;      // the avenue's pale floor is left bare: it takes the shadows and the flecks
      return fields.at(x, z).edge < 2.3 ? 1 : 0;
    };
    const grassCol = (x, z) => { const n = 0.5 + 0.5 * Math.sin(x * 0.13 + 1.7) * Math.sin(z * 0.11 + 0.3); return z < -112 ? [0.15 + 0.1 * n, 0.17 + 0.06 * n, 0.07 + 0.03 * n] : [0.11 + 0.05 * n, 0.165 + 0.03 * n, 0.055]; };
    const grass = await flora.makeGrassAsync({ rng: S.grass, path, uRange: [(RP.AH - 100) / LEN, RP.CR / LEN], heightAt: landH, wind, map: treeMat.map, count: Math.round(15000 * detail), radius: 34, bias: 1.7,
      density: grassDen, groundColor: grassCol, height: [0.5, 1.0], width: [1.0, 1.7], flowers: 0, chunks: 6, fade: [80, 115],
      materialOptions: { ambient: 1.2, leafAmbient: 1.15, wrap: 0.5, backlight: 0.8 } }, ctx.yield);
    scene.add(grass.object);
    const grassFade = grass.uniforms.uFloraFade;
    await ctx.yield();
    const reeds = flora.makeReeds({ rng: S.reeds, bounds: [-130, -72, 150, 2], heightAt: landH, yRange: [-1.5, -0.25], density: (x, z) => (Math.abs(x) < 7 ? 0 : 1), count: Math.round(170 * detail), spacing: 1.1, material: treeMat, scale: [0.8, 1.5], cullDistance: 230 });
    scene.add(reeds.object);
    await ctx.yield();

    // ---- birds: swifts over the corn as far as the middle of the avenue; the starling cloud that pours down to roost, on its way from the entry until we
    // are under the avenue's first trees; the roosts that burst, one after another, between the avenue's last trees and the river's far bank
    const birdLight = { sunDir: [0.2, 0.3, -0.9], sunColor: '#ffffff', sunIntensity: 2, sky: '#8aa0d0', skyIntensity: 1, ground: '#6a5a40', groundIntensity: 0.5 };
    const fauna = F.makeFauna(scene, { light: birdLight, rng: S.fauna });
    const flocks = [
      fauna.add(F.makeFlock({ rng: S.swifts, species: 'swifts', count: Math.round(40 * dens), along: { path, side: 5, up: 1.5, lead: 24, from: -60 / LEN, to: RP.AM / LEN, drift: 10 }, spread: [22, 7, 26] })),
      fauna.add(F.makeFlock({ rng: S.starlings, species: 'starlings', count: Math.round(1200 * Math.min(1.4, dens)), duration: DUR, cross: { path, u: RP.AH / 2 / LEN, lead: 150, span: 560, angle: 14, side: 1, height: 44, offset: -115, rise: -40, bow: 60, window: RP.AH / 2 / LEN }, spread: [70, 26, 90] })),
    ];
    // (each flock's angle across our line, 60 to 90 degrees, its height over ours, 2 to 6 m, and its side, 1/2 each, are drawn from the crows' own stream)
    for (let k = 0; k < 3; k++) { const cr = S.crows, angle = cr.range(60, 90), height = cr.range(2, 6), side = cr() < 1 / 2 ? -1 : 1;
      flocks.push(fauna.add(F.makeFlock({ rng: cr, species: 'crows', count: Math.round(20 * dens), size: 0.8, speed: 17, duration: DUR,
        cross: { path, u: (RP.AE + (RP.B2 - RP.AE) * (k + 0.5) / 3) / LEN, lead: 34, span: 190, angle, side, height, rise: 16 }, spread: [9, 4, 14] }))); }
    await ctx.yield();
    // ---- motes: pollen by day, leaves torn from the avenue as the cold wind comes, sparks from the torches on the ridge
    const pollen = fx.makeParticles({ rng: S.pollen, preset: 'pollen', time: T, count: Math.round(900 * detail), colors: ['#e8d48a', '#d8c070', '#f0e0a8'], intensity: 0.55, opacity: 0 });
    const leaves = fx.makeParticles({ rng: S.leaves, preset: 'leaves', time: T, count: Math.round(900 * detail), size: [0.16, 0.34], velocity: [9.5, -0.5, 3.4], colors: ['#1c0d09', '#261310', '#120807'], intensity: 0.6, opacity: 0 });      // (dark shapes against the red sky, as a leaf against the light is; never a lit fleck that could be taken for a star)
    // (the sparks keep to the torch stream on the lower zigzags, in a box of their own: loose in the dark sky they would be taken for stars)
    const sparks = fx.makeParticles({ rng: S.sparks, preset: 'embers', time: T, follow: false, center: [62, 20, -186], box: [150, 34, 124], count: Math.round((rare ? 900 : 460) * detail), velocity: [4, 1.8, 1.5], opacity: 0 });
    scene.add(pollen.object, leaves.object, sparks.object);
    // a rare afternoon: the ricks of the farm at the ridge foot are fired as we pass; their smoke and sparks cross the path
    let rickSmoke = null, rickSparks = null;
    if (rare && built.ricks.length) {
      const r0 = built.ricks[Math.min(1, built.ricks.length - 1)];
      rickSmoke = fx.makeSmokeColumn({ rng: S.rick, time: T, position: [r0.x + 3, r0.y - 1, r0.z - 3], height: 90, radius: [5, 30], size: [9, 44], count: 80, wind: [1, 0, 0.3], bend: 0.9,
        color: '#2a2224', colorTop: '#3c3438', shadowColor: '#0c090a', ambient: '#060406', hot: '#ff5a14', hotFalloff: 9, opacity: 0, rate: 0.09, sunDir: [0.2, 0.4, -0.9], sunColor: '#6a1a12' });
      rickSparks = fx.makeParticles({ rng: S.rickSparks, preset: 'sparks', time: T, follow: false, center: [r0.x + 34, r0.y + 12, r0.z], box: [110, 34, 60], count: Math.round(700 * detail), velocity: [8, 2.4, 2.2], opacity: 0 });
      scene.add(rickSmoke.object, rickSparks.object);
    }
    await ctx.yield();

    // ---- the river
    const WL = Water.waterLight({ preset: 'noon', clouds: false });
    const rpts = []; for (let x = -960; x <= 960; x += 60) rpts.push([x, RIVER_Y, -35 + 7 * Math.sin(x * 0.0075 + 0.6)]);
    const river = Water.makeRiver({ rng: S.river, light: WL, points: rpts, width: 52, speed: 1.6, foam: 0.15, bankFoam: 0.3, ripple: 1.1, opacity: 0.8, deep: '#16343a', shallow: '#4f8f86', bankFade: 3 });
    scene.add(river.object);
    const glitter = makeGlitter(dome, { landGLSL: LAND_GLSL, level: RIVER_Y, fogDensity: scene.fog.density });
    scene.add(glitter.object);
    await ctx.yield();

    // ---- the people, beasts and fires; the mole, the isles and the road's wall (each cast on its own stream)
    const folk = makeFolk({ streams: S, fields, path, clock, places: RP, door: { x: KNOLL[0], y: hero.object.position.y, z: KNOLL[1], ...hero.door }, avenue: [AV_Z0, AV_Z0 - AV_STEP * (AV_N - 1)], dens, rare, built, torchUniform: LU.uTorch.value, torchBox: LU.uPoolBox.value, blazeUniform: LU.uBlaze.value, wind: [0.94, 0.34], duration: DUR });
    scene.add(folk.object);
    await ctx.yield();
    // the astronomers' terrace with its instruments and people, on the hero's west side
    { const terrace = buildTerrace(S.terrace, hero.lit); hero.object.add(terrace.object); }
    // reeds along the lake's edge for 200 m either side of the mole (which leaves the shore straight below the dome); none where the mole stands
    const lakeReeds = (() => { const mx = KNOLL[0], sz = lakeShoreZ(mx);
      return flora.makeReeds({ rng: S.lakeReeds, bounds: [mx - 200, sz - 22, mx + 200, sz + 18], heightAt: landH, yRange: [-1.3, 0.5], density: (x) => (Math.abs(x - mx) < 7 ? 0 : 1), count: Math.round(230 * detail), spacing: 1.2, material: treeMat, scale: [0.9, 1.7], cullDistance: 300 }); })();
    scene.add(lakeReeds.object);
    await ctx.yield();
    // skeins of geese over the lake: bystanders on the world's clock, each flying its own line along the ridge's shore from end to end and round again
    // (the kit starts each at a seeded place on its line). Three lines, each drawn from the geese's own stream: 40 to 420 m off the shore, 10 to 38 m
    // above the water, slanting up to 80 m nearer or farther along the way, eastward or westward 1/2 each. Nothing times them to the flight.
    { const gr = S.geese, sz = lakeShoreZ(KNOLL[0]);
      for (let k = 0; k < 3; k++) { const off = gr.range(40, 420), y = gr.range(10, 38), slant = gr.range(-80, 80), dir = gr() < 1 / 2 ? -1 : 1, pts = [];
        for (let i = 0; i <= 6; i++) { const t = i / 6 - 0.5; pts.push([100 + dir * t * 1100, y + 5 * Math.sin(i * 1.3 + off), sz - off - slant * t - 30 * (1 - 4 * t * t)]); }
        flocks.push(fauna.add(F.makeFlock({ rng: gr, species: 'geese', count: Math.round(17 * Math.min(1.5, dens)), size: 2, route: pts, closed: false, spread: [24, 3, 28] }))); } }
    await ctx.yield();

    // ---- shadows: every tree and building owns one strip per sun
    const decals = makeDecals(casters, LU);
    scene.add(decals.object);
    await ctx.yield();

    // the ring (with its glow) must stay behind the LAND of the ridge, trees not counted, from every point of the approach up to the ridge foot:
    // a check of the layout, sampled along the path
    { const P = new THREE.Vector3(), end = path.end; let worst = -1e9;
      for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, P); if (P.z < CREST_Z + 215) break;
        const k = (P.z - CREST_Z) / (P.z - end.z), x = P.x + (end.x - P.x) * k, need = P.y + (end.y + 9.5 - P.y) * k;
        worst = Math.max(worst, need - landH(x, CREST_Z)); }
      if (worst > 0) console.warn('after-the-sixth-sun: the ring clears the ridge by ' + worst.toFixed(1) + ' m before the ridge foot'); }

    // ---- gaze and pace, in metres from places
    const gaze = new THREE.Vector3(), gazeD = new THREE.Vector3(), pathP = new THREE.Vector3(), size = new THREE.Vector2(800, 450);
    const pois = [
      // the red sun, from under the avenue's first trees (it stands at the far end of them) until its last thread goes
      { at: (time, u) => { path.pointAt(u, gaze); return gaze.addScaledVector(clock.redDirAt(u * LEN, gazeD), 600); }, from: RP.AH / LEN, to: MG / LEN, weight: 0.3 },
      // the dome, from where the star wave sets out until we are abeam of it in the saddle
      { at: [KNOLL[0], landH(KNOLL[0], KNOLL[1]) + 16, KNOLL[1]], from: clock.waveAt / LEN, to: RP.CR / LEN, weight: 0.4 },
      // the cluster's heart, from the saddle to the route's end: the way down the far slope points the eye at the water, and the sky over it is
      // the subject of that stretch (the engine itself lets every gaze go before the exit)
      { at: (time, u) => { path.pointAt(u, gaze); return gaze.addScaledVector(clock.heartDir, 6000); }, from: RP.CR / LEN, to: 1, weight: 0.4 },
    ];
    // slower into the avenue (from 40 m short of its first trees to 30 m inside); a little quicker from its last trees to the river's bank; slower
    // from the far bank to the ridge foot, where the thread goes; quicker again once the night is full, over one more wave's length; easing from
    // the saddle down to the shore
    const NIGHT_AT = clock.nightAt, WAVE = clock.waveLen, PACE_TO = Math.max(NIGHT_AT + 20, RP.H2);      // (quicker again from the place where the night is full to the place abreast of the road's second hairpin)
    const pace = (u) => { const m = u * LEN; return 1.2 - 0.35 * smoothstep(RP.AH - 40, RP.AH + 30, m) + 0.15 * smoothstep(RP.AE, RP.B1, m) - 0.3 * smoothstep(RP.B2, RP.FT, m) + 0.35 * smoothstep(NIGHT_AT, PACE_TO, m) - 0.05 * smoothstep(RP.CR, RP.SH, m); };
    // the dome's slit follows the dying sun at first (its bearing at the first notch), then is brought round by the west, through the eclipse and
    // until the night is full, to face down the hill to the road's first bend; after that it creeps on
    const domeTurn = (() => { const d = clock.redDirAt(MN, new THREE.Vector3()), B = ROAD[4];
      const a0 = (Math.atan2(d.x, d.z) + 6.2832) % 6.2832; let a1 = Math.atan2(B[0] - KNOLL[0], B[1] - KNOLL[1]); while (a1 < a0) a1 += 6.2832;
      return (m) => a0 + (a1 - a0) * smoothstep(MN, clock.nightAt, m) + 0.0011 * Math.max(0, m - clock.nightAt); })();

    const DUSK0 = clock.eclAt(0.3);
    const DOOR = [KNOLL[0], KNOLL[1] + 20.5];      // the ground before the observatory's door (the door faces south, 13.6 m from the drum's middle; its steps run out 6 m)
    function update(dt, time, camera, u) {
      const m = u * LEN;
      path.pointAt(u, pathP);
      const st = clock.at(m, pathP);
      if (ctx.renderer) ctx.renderer.getDrawingBufferSize(size);
      const pxAngle = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(size.y, 1));
      dome.update(st, pxAngle, time); stars.update(st, time, ctx.renderer, size);
      scene.fog.color.copy(st.hor);
      hemi.color.copy(st.hemiSky); hemi.groundColor.copy(st.hemiGround);
      for (let i = 0; i < 3; i++) {
        const L = st.dir[i]; dirs[i].color.copy(L.color); dirs[i].position.copy(L.dir).multiplyScalar(1000);
        LU.uDirDir.value[i].copy(L.dir); LU.uDirCol.value[i].copy(L.color);
      }
      LU.uHemiSky.value.copy(st.hemiSky); LU.uHemiGround.value.copy(st.hemiGround); LU.uTime.value = time; LU.uPx.value = pxAngle; LU.uWind.value.z = st.wind; LU.uNight.value = st.night; LU.uRim.value = 0.25 + 0.9 * st.hard * (1 - st.night);      // (the thinner the crescent, the more the land's edges against it stand out: the ridge's crest takes a rim of its light)
      wind.set({ strength: st.wind }); wind.update(time);
      decals.update(st);
      // the scholars' torchlight: each light in the observatory is kindled at its own moment along the dusk, which runs from the place where three
      // tenths of the eclipse is gone (where the road's first torch is lit) to the snap; one gallery torch falls and dies as the Stars swell
      const duskK = clamp((m - DUSK0) / (MG - DUSK0), 0, 1);
      hero.setTurn(domeTurn(m)); hero.setFire(duskK); hero.setFall(smoothstep(clock.swellAt, clock.swellAt + WAVE / 14, m)); hero.update(dt, time + PH.hero);
      T.value = time;
      built.update(time, st.wind);
      folk.update(u, m, time, st, camera.position, size);
      // the last pool of firelight on the ground: before the observatory's open door, raised with the scholars' torches inside
      LU.uTorch.value[NPOOL - 1].set(DOOR[0], DOOR[1], 0.5 * hero.doorLit * (0.8 + 0.2 * Math.sin(time * 7.3 + PH.door) * Math.sin(time * 4.1 + PH.door * 1.7)), 1 / (4.5 * 4.5));      // (the hall's light on the ground before the door reaches 4.5 m)
      poolBoxes(LU.uTorch.value, LU.uPoolBox.value);      // (cost only, C1) the two boxes that hold every lit pool, from the lamps' own places
      // the far city burning (the clock's last state, st.city): its glow on the sky (its bearing taken from the eye every frame), its smoke
      { const dx = CITY[0] - camera.position.x, dz = CITY[1] - camera.position.z, l = Math.hypot(dx, dz) || 1, cityK = st.city;
        dome.uniforms.uCity.value.set(dx / l, dz / l, cityK, 0.84 + 0.16 * Math.sin(time * 2.1 + PH.cityA) * Math.sin(time * 0.83 + PH.cityB));
        dome.uniforms.uDusk.value.y = dx / l; dome.uniforms.uDusk.value.z = dz / l;      // (the dusk is darkest on the city's bearing)
        const so = 0.62 * smoothstep(0.1, 0.85, cityK); for (const sm of smokes) sm.uniforms.uOpacity.value = so; }
      const pk = ctx.through ? 0 : 1;
      pollen.setOpacity(pk * 0.7 * (1 - smoothstep(8.5, 13.5, st.turn)));      // pollen glints while the higher pair of small suns stands a few degrees up
      leaves.setOpacity(pk * smoothstep(0.3, 0.52, st.hard) * (1 - smoothstep(0.8, 0.97, st.hard)));      // leaves are torn off as the cold wind rises; they go out with the light (a red fleck in a black sky would be taken for a star)
      // sparks: with the torches of the last of the eclipse; they keep to their box on the lower zigzags, which the crest hides once we are over it
      sparks.setOpacity(pk * smoothstep(0.88, 1.0, st.hard) * (rare ? 1 : 0.6));
      if (rickSmoke) { const rk = smoothstep(MG, MG + WAVE, m); rickSmoke.uniforms.uOpacity.value = 0.8 * rk; rickSparks.setOpacity(rk); }      // (the ricks are fired at the snap: their smoke and sparks rise with the star wave)
      // the river mirrors the sky of the moment
      const key = st.dir[0].color.r + st.dir[0].color.g > st.dir[1].color.r + st.dir[1].color.g ? st.dir[0] : st.dir[1];
      WL.sunDir.copy(key.dir); if (WL.sunDir.y < 0.05) { WL.sunDir.y = 0.05; WL.sunDir.normalize(); } WL.scatDir.copy(WL.sunDir);
      WL.sunColor.copy(key.color); WL.zenith.copy(st.zen); WL.horizon.copy(st.hor); WL.mid.copy(st.zen).lerp(st.hor, 0.4); WL.scatterColor.copy(key.color).multiplyScalar(0.2);
      WL.ambient.copy(st.hemiSky).multiplyScalar(0.3); WL.fogColor.copy(st.hor);
      river.update(dt, time);
      for (const f of flocks) { const fu = f.uniforms; fu.uSunDir.value.copy(key.dir); fu.uSunColor.value.copy(key.color); fu.uSkyColor.value.copy(st.hemiSky); fu.uGroundColor.value.copy(st.hemiGround); }
      fauna.update(dt, time, camera, u);
      grass.update(dt, time, camera); reeds.update(dt, time, camera); lakeReeds.update(dt, time, camera);
      { const k = 1 - 0.55 * st.night; grassFade.value.x = 80 * k; grassFade.value.y = 115 * k; }      // by starlight only the nearer tufts stand out of the silver
      grass.material.color.setRGB(1 - 0.62 * st.night, 1 - 0.56 * st.night, 1 - 0.38 * st.night);      // and they are as dark as the ground they stand in: no colour by starlight, no lit yellow-green leaves on a dark hill
    }

    return {
      scene, path, duration: 48, pace,
      camera: { fov: 64, near: 0.3, far: 9000, lookAhead: 26, sway: 0.6, bank: 0.5 },
      pois,
      // (the exit's look is PINNED to the plain ring: dealt by seed, the engine's 'corona' look would hang a black disc with a pearl corona over the burning
      // city, the earthly-eclipse picture this world must never show, and its 'lens' look reads as a moon over the water)
      portal: { shape: 'circle', radius: 7, color: '#eaf2ff', glow: 1.0, tilt: true, revealDistance: 220, style: 'ring' },
      post: { exposure: 1.05, bloom: { strength: 0.36, radius: 0.45, threshold: 1.15 },
        grade: { saturation: 1.05, contrast: 1.06, tint: '#ffffff', shadowTint: '#0a0818', vignette: 0.28, grain: 0.02, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() {},
    };
  },
};
