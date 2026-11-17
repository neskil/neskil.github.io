// THE RED WEED: late dusk over a drowned Surrey river valley, choked by a carmine water-weed. We fly up the river
// under a weed-hung bridge and past an empty village, behind a three-legged walking engine that strides the swamp
// against the afterglow, pass beneath it, and climb a heath hill where a second engine stands dead over a pit.
//
// MAP OF THIS FILE
//   1. THE EVENING     the seeded looks: week (how sick the weed is, how fast the engine strides), hour (afterglow,
//                      clearing storm, deep dusk, mist), layout (mirrored in x; the bridge's arches), cast
//   2. LAYOUT          every place in metres (unmirrored; X() mirrors), the ground's height function, the path,
//                      and WHERE THINGS HAPPEN: each window is metres of route from a place, or the engine's own walk
//   3. build()         sky -> ground -> what people built -> flood map and sheet -> engines -> weed -> trees -> birds
//                      -> air -> hill growth, skiff, far engines, curtains, pools, clumps, hill trees (every
//                      seeded stream is taken in one list at the head of build)
//   4. update()        the engine's walk is a function of the way flown (never of time); ambient life runs on the clock
// Pieces (src/parts): the-red-weed.js (the engine), -common.js (shared uniforms and GLSL), -land.js (dome, flood
// sheet), -built.js (bridge, mill, village, church, cylinder), -growth.js (standing weed, curtains, the flakes it
// sheds), -air.js (far fire, black smoke, falling star, waterfowl, perched birds)
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { makeShared, Acc, C, clamp, lerp, sstep, DEG } from '../parts/the-red-weed-common.js';
import { makeEngineKit, makeState, makeFrame, poseWalk, plantPoint, hoodLook, SZ, PART } from '../parts/the-red-weed.js';
import { makeDome, makeStars, makeFloodMap, makeSheet } from '../parts/the-red-weed-land.js';
import { makeBuiltMaterial, bridgeInto, cartInto, wheelInto, skiffInto, washingInto, cottageInto, churchInto, millInto, cylinderInto, trackInto, finish, KIND } from '../parts/the-red-weed-built.js';
import { makeGrowth, makeCurtains, makeCrumble, makeLitter } from '../parts/the-red-weed-growth.js';
import { makeFarFire, makeInk, makeFallingStar, makeWaterfowl, makePerched } from '../parts/the-red-weed-air.js';

const DUR = 46;

// ---------------------------------------------------------------- 1. THE EVENING
const HOURS = {
  // amber and rose afterglow, clear (the brief's own evening). Colours are named as they are seen (see shown() in the common part)
  glow: { sky: {}, stars: 60, starGain: 1, fogDen: 0.0009, exposure: 1.15, mist: 0.11 },
  // a clearing storm: slate cloud over a lemon band, a far curtain of rain
  storm: { sky: { amber: '#E8D27A', amberGain: 1.08, rose: '#B98A8E', roseGain: 0.9, cloud: 0.92, cloudBase: 0.2, cloudSoft: 0.16, cloudCol: '#2E3648', keyCol: '#F0D892', keyI: 0.45, mistCol: '#84858E' }, stars: 0, starGain: 0, fogDen: 0.001, exposure: 1.18, rain: 0.8, mist: 0.1 },
  // deep dusk: many stars, the fire the strongest light
  deep: { sky: { amber: '#C9854A', rose: '#A8606C', glow: 0.9, bandH: 0.8, zenith: '#0E1730', mid: '#1C2A4C', low: '#27375A', keyI: 0.35, hemiSky: '#56607E', mistCol: '#77747F' }, stars: 420, starGain: 1.15, fogDen: 0.00085, exposure: 1.25, fire: 1.5, mist: 0.08 },
  // a mist evening: the engine is a shape in the haze until the bridge
  mist: { sky: { rose: '#D9919A', low: '#56608A', mistDen: 0.0055, mistTop: 5.5, mistCol: '#8E8A98', fog: '#3A4566' }, stars: 24, starGain: 0.8, fogDen: 0.0021, exposure: 1.15, mist: 0.2 },
};

export default {
  id: 'the-red-weed',
  name: 'The Red Weed',
  category: 'books',
  placeKind: 'wilderness',
  book: 'The War of the Worlds',
  author: 'H. G. Wells, 1866 to 1946',
  weirdness: 0.45,
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {};
    // ---- the seeded evening (draws in a fixed order; never a seed number)
    const week = rng.pick(['early', 'mid', 'mid', 'late']);
    const hourKey = rng.pick(['glow', 'glow', 'glow', 'storm', 'deep', 'mist']);
    const MX = rng.chance(2 / 5) ? -1 : 1;                     // the whole valley mirrored: village and mill on the left bank, the engine crossing from the right
    const sideArches = rng.chance(1 / 3) ? 2 : 1;              // a bridge of five arches, or three
    const cast = { gulls: rng.chance(1 / 3), owl: rng.chance(3 / 10) };
    // ---- every seeded stream of this world, taken once, here, in this order: one per kind of thing, and one for
    // each loop that tries places against the route or the land. Nothing below draws from ctx.rng itself.
    const R = {};
    for (const k of ['stars', 'land', 'built', 'wood', 'willows', 'flood', 'plants', 'weedshapes', 'trees', 'fauna', 'air', 'hillgrowth', 'skiff', 'farengines', 'curtains', 'pools',
      'lowclumps', 'hillclumps', 'sidetrees', 'hillpines', 'inkheaps', 'gait', 'clocks']) R[k] = rng.fork(k);
    // start phases of the series that run on the clock (waterfowl, perched birds, curtains, the skiff's roll, pitch
    // and bob, the fall-back pools): a stream of their own, drawn here once in this order
    const PHS = ctx.core.makeRng(ctx.core.hashSeed('phases:' + ctx.seed));
    const PH = { fowl: PHS(), perch: PHS(), curtain: PHS(), roll: PHS.range(0, 6.2832), pitch: PHS.range(0, 6.2832), bob: PHS.range(0, 6.2832), pool: PHS.range(0, 6.2832) };
    const rare = !!vary.rare;                                  // the keyed falling star comes down close behind the hill
    const hour = HOURS[hourKey], late = week === 'late', early = week === 'early';
    const X = (x) => MX * x;
    const shared = makeShared({ ...hour.sky, glowAz: -12 * MX, fogDen: hour.fogDen, post: { exposure: hour.exposure } }), U = shared.U, S = shared.shown;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(U.uFogCol.value.clone(), hour.fogDen);
    // the kit's ground, trees and birds take the scene's lights; this world's own shaders read U. (A light of
    // strength pi lights a white matt surface to its own colour.)
    const hemi = new THREE.HemisphereLight(U.uHemiSky.value.clone(), U.uHemiGnd.value.clone(), 5.0);
    const key = new THREE.DirectionalLight(U.uKeyCol.value.clone(), 2.0); key.position.copy(shared.keyDir).multiplyScalar(600);
    const fill = new THREE.DirectionalLight(U.uHemiSky.value.clone(), 2.0); fill.position.set(-120 * MX, 300, 260);       // the high sky behind us: gives the slopes that face us their form
    scene.add(hemi, key, key.target, fill, fill.target);
    await ctx.yield();

    // ---------------------------------------------------------------- 2. LAYOUT (unmirrored metres; X() mirrors)
    // The route comes in low over the choked channel (below the bridge's deck: its arches stand against the
    // afterglow from the first), goes under the middle arch, follows a lead of open water past the mill and the
    // village, passes under the striding engine, and climbs the hill's face to the pit and the dead engine.
    const PTS = [[0, 9, 0], [0, 8, -55], [0, 4.5, -115], [0, 3.2, -150], [4, 4, -220], [14, 6, -300], [18, 7, -390], [12, 7, -470], [5, 6.5, -548], [0, 8, -650], [-4, 12, -740], [-4, 20, -800], [-3, 30, -850], [-2, 42, -890], [0, 53, -920], [0, 53, -975]];
    const path = makePath(PTS.map((p) => [X(p[0]), p[1], p[2]]));
    // the hill: a level top 36 m across; the pit is dug in its face just under the brow, so that what stands on the
    // top behind the pit stands whole against the sky from the hill's foot
    const HILL = { x: 0, z: -1003, top: 46, r0: 36, r1: 190 }, PIT = { x: 0, z: -945, r: 20, depth: 8 };
    const SMOKE = { x: -175, z: -855 }, WOOD = { x: 420, z: -1500, len: 700 }, BRIDGE_Z = -150, BRIDGE_HW = 3.4, WEIR = { x0: -16, x1: 22.5, z: -300 }, MILL = { x: 30, z: -300 }, CHURCH = { x: 46, z: -470 };
    const ELMS = [[-64, -262], [92, -352], [-52, -702]], POPLARS = { z0: -588, step: 9.5, n: 9 };
    const channelX = (z) => 12 * Math.sin(z / 170);
    const pathAt = (z, c) => { const zz = clamp(z, PTS[PTS.length - 1][2], 0); let i = 0; while (i < PTS.length - 2 && PTS[i + 1][2] > zz) i++; const a = PTS[i], b = PTS[i + 1]; return lerp(a[c], b[c], sstep(0, 1, (zz - a[2]) / (b[2] - a[2]))); };
    const pathX = (z) => pathAt(z, 0), pathY = (z) => pathAt(z, 1);
    const woodZ = (x) => WOOD.z + 0.22 * (x - WOOD.x);
    // WHERE THINGS HAPPEN. A place's fraction of the way is found on the path (the point of the route nearest to
    // it); every window below is metres of route from such a place, or metres of the engine's own walk.
    const LEN = path.length, M = (m) => m / LEN;                // metres of route as a fraction of the way
    const uOf = (x, z) => path.nearestXZ(X(x), z).u;
    const uBridgeFar = uOf(0, BRIDGE_Z - BRIDGE_HW);            // the eye comes out from under the bridge's far parapet
    const uWeir = uOf(3, WEIR.z), uTower = uOf(CHURCH.x, CHURCH.z);            // abreast of the weir (and the mill beside it), abreast of the church tower
    const uPass = uOf(5, -548);                                  // the crossing: the striding engine's line meets the route here
    const zPoplarN = POPLARS.z0 - (POPLARS.n - 1) * POPLARS.step, uPoplar0 = uOf(channelX(POPLARS.z0) - 25, POPLARS.z0);      // the last and the first of the nine poplars
    const uFoot = uOf(-4, HILL.z + HILL.r1), uBrow = uOf(0, HILL.z + HILL.r0);                  // the hill's foot; the brow of its level top
    const uLevel = uOf(PTS[14][0], PTS[14][2]);                  // where the climb ends and the route runs level, over the pit's near rim
    // the striding engine: it goes fast ("as fast as flying birds"), up the valley on a line that closes slowly on
    // ours, so that we run behind and beside it from the bridge to the crossing. Its walk is counted from the
    // bridge: from the far parapet in the early weeks, 12 m and 24 m beyond it later (the engines grow slower as
    // their makers sicken). Its pace is whatever takes it from there to the crossing while we fly there; LINE is
    // the metres it would walk while we fly the whole way.
    const EDIR = new THREE.Vector2(0.14, -0.99).normalize(), BEYOND = early ? 0 : late ? 24 : 12;
    const passP = path.pointAt(uPass, new THREE.Vector3()), LINE0 = (BRIDGE_Z - BRIDGE_HW - BEYOND - passP.z) / -EDIR.y / uPass;
    // The road crosses the engine's line 6 m AHEAD of its body: the rear leg walks on that line and its foot reaches
    // no further forward than the body's centre, so nothing of it is where we cross (the engine's line is walked
    // that much less by the time we are there)
    const AHEAD = 6, LINE = LINE0 - AHEAD / uPass, speed = LINE / DUR;
    // ITS MAKE. The engine that strides over our road stands wide and reaches far (a walking engine clears what it
    // steps over): its front feet track 19 m to either side of its line (the kit's 13) and plant 8 m ahead of the
    // body (3.6). Its legs are longer with its stance: 12 + 11 + 11 = 34 m (the kit's 30). The stance's greatest
    // reach from hip to ankle is 33.12 m (a front foot coming down), 0.974 of the leg: no section is ever asked
    // for more than its length, and the leg is still folded, a little, at its longest. The two knuckles share the
    // fold more evenly than the kit's (the second turn is nine tenths of the first, back; the kit's 1.25 of it):
    // while a foot is down its lower knee stands at most 3.2 m in from the straight line from hip to foot (the
    // kit's 4.5 m) and its upper knee at most 5.0 m out from it (the kit's 2.8 m), so less of the leg comes in
    // over what the engine straddles
    const MAKE = { lat: [19, -19, 0], fa: [8, 8, SZ.fa[2]], L: [12, 11, 11], fold: [1, -0.9] };
    // what must stand clear of its walk: a foot reaches 1.85 m from its sole's centre (the far corners of its
    // toes), a lifted foot swings 7 hundredths wider than its track, and a tree is counted as reaching as far from
    // its trunk as it is tall: a willow of the old banks at its largest 10.4 m (9 m at size 1.15), a dead elm 17 m
    // (15 m at size 1.1, and its lean)
    const FOOT_R = 1.85, TRACK = MAKE.lat[0] * 1.07, CROWN = 10.4, ELM_CROWN = 17;
    const engO = new THREE.Vector3(passP.x - MX * EDIR.x * LINE0 * uPass, 0, passP.z - EDIR.y * LINE0 * uPass);
    // it comes to a stand in the flood 45 m short of the hill's foot (found along its own line)
    let walkEnd = LINE * uPass; for (; walkEnd < LINE; walkEnd += 5) if (Math.hypot(engO.x + MX * EDIR.x * walkEnd - X(HILL.x), engO.z + EDIR.y * walkEnd - HILL.z) < HILL.r1 + 45) break;
    const engineLineD = (x, z) => Math.abs((x - MX * passP.x) * -EDIR.y + (z - passP.z) * EDIR.x);        // metres from the striding engine's line (unmirrored)
    const onEngineWalk = (z) => z < engO.z + 30 && z > engO.z + EDIR.y * walkEnd - 30;
    // NO TREE WHERE A FOOT SWINGS. A dead elm stands no nearer the engine's line than the front feet's track, the
    // foot and the elm's own boughs ask; one that would is stood off, straight out from the line, to that distance
    // (the first elm is, by 10.9 m). The old banks' willows have the same test where they are placed.
    for (const q of ELMS) { const sd = (q[0] - MX * passP.x) * -EDIR.y + (q[1] - passP.z) * EDIR.x, off = TRACK + FOOT_R + ELM_CROWN - Math.abs(sd);
      if (onEngineWalk(q[1]) && off > 0) { q[0] += -EDIR.y * off * Math.sign(sd || 1); q[1] += EDIR.x * off * Math.sign(sd || 1); } }
    const uElm = uOf(ELMS[2][0], ELMS[2][1]);                    // the dead elm that stands in the water before the hill
    // the ground (in unmirrored coordinates)
    const ground0 = (x, z) => {
      const nb = 24 * noise.n2(x / 170, z / 170) + 8 * noise.n2(x / 49, z / 49 + 7);
      const dMain = Math.max(x > 0 ? x - 250 : -x - 250 - 75 * Math.exp(-Math.pow((z + 865) / 95, 2)), -1050 - z);
      const dBranch = Math.max(40 - x, Math.abs(z + 975) - 165);                    // the river's way out, to the right round the hill
      const d = Math.min(dMain, dBranch) + nb;
      let h;
      if (d < 0) h = -0.35 - 0.9 * sstep(0, 55, -d) - 1.6 * Math.exp(-Math.pow((x - channelX(z)) / 12, 2));
      else { const k = sstep(0, 210, d); h = 0.04 * d + 56 * k * (0.75 + 0.25 * k) + (11 * noise.n2(x / 230 + 3, z / 230) + 4 * noise.n2(x / 66, z / 66 + 9)) * sstep(30, 190, d); }
      // the meadow in the hollow left of the hill stands just clear of the flood
      const hs = Math.hypot((x - SMOKE.x) / 1.25, z - SMOKE.z); if (d < 0) h = lerp(h, 0.9 + 0.5 * noise.n2(x / 30, z / 30), 1 - sstep(60, 105, hs));
      // the far ridge the wood burns on
      h += 46 * Math.exp(-Math.pow((z - woodZ(x)) / 150, 2)) * sstep(0, 150, d) * sstep(-250, 60, x);
      // the hill that closes the valley, its pit and the raw banks thrown up round it
      const r = Math.hypot(x - HILL.x, z - HILL.z);
      if (r < HILL.r1 + 30) {
        const hh = HILL.top * (1 - Math.pow(clamp((r - HILL.r0) / (HILL.r1 - HILL.r0), 0, 1), 1.2)) + 1.3 * noise.n2(x / 21, z / 21) * sstep(HILL.r0, HILL.r0 + 40, r) * (1 - sstep(HILL.r1 - 30, HILL.r1, r));
        h = Math.max(h, hh);
        const pd = Math.hypot(x - PIT.x, z - PIT.z);
        if (pd < 44) {
          h -= PIT.depth * (1 - sstep(PIT.r - 8, PIT.r + 0.5, pd)) * (1 + 0.08 * noise.n2(x / 5, z / 5));
          // the earth thrown up round it: a raw bank, heaped unevenly, with clods and spoil running out from it
          h += 2.6 * Math.exp(-Math.pow((pd - PIT.r - 4.5) / 3.4, 2)) * (0.7 + 0.5 * noise.n2(x / 6 + 5, z / 6)) + 0.5 * noise.n2(x / 2.6, z / 2.6 + 30) * (1 - sstep(PIT.r + 2, PIT.r + 22, pd)) * sstep(PIT.r - 14, PIT.r - 4, pd);
        }
      }
      return h;
    };
    const ground = (x, z) => ground0(MX * x, z);
    // ground colours (the dusk's light is dim and blue: these are the daylight colours of the things)
    const cMeadow = C('#737a6c'), cField = C('#89857a'), cHeath = C('#84706a'), cGorse = C('#8a8660'), cBurnt = C('#3c3634'), cSand = C('#c4ad84'), cScorch = C('#3a3634'), cMud = C('#4a4238'), cWeed = C('#A8474E'), cPink = C('#c99aa0'), cChalk = C('#d8cdbf'), cBed = C('#15181c');
    const cTmp = new THREE.Color();
    const landColor = (wx, z, h, ny, out) => {
      const x = MX * wx, r = Math.hypot(x - HILL.x, z - HILL.z), n1 = noise.n2(x / 85 + 20, z / 85), n2 = noise.n2(x / 19, z / 19 + 40);
      if (h < -0.05) return out.copy(cBed);
      out.copy(cMeadow).lerp(cField, sstep(0.1, 0.5, n1));
      if (r < HILL.r1 + 20) {
        // heath, with gorse and stretches of burnt furze
        const onHill = 1 - sstep(HILL.r1 - 40, HILL.r1 + 20, r), n3 = noise.n2(x / 7 + 11, z / 7 - 5);
        out.lerp(cHeath, onHill).lerp(cGorse, 0.45 * sstep(0.25, 0.6, n2) * onHill).lerp(cBurnt, 0.65 * sstep(0.15, 0.45, noise.n2(x / 38 + 140, z / 38 - 60)) * onHill);
        out.multiplyScalar(0.84 + 0.32 * n3);
        const pd = Math.hypot(x - PIT.x, z - PIT.z), up = sstep(1, 40, h);
        // the weed came up out of the water this far and died as it climbed: crimson at the hill's foot, pale pink
        // half way up, bone white under the brow (thickest where the dead growth stands: the same drift field
        // places the plants further down)
        if (pd > PIT.r + 6) {
          const wn = noise.n2(x / 27 + 60, z / 27) * 0.6 + 0.4 * n2, drift = noise.n2(wx / 17 + 200, z / 17);
          cTmp.copy(cWeed).lerp(cPink, sstep(0.14, 0.5, up)).lerp(cChalk, sstep(0.45, 0.82, up));
          out.lerp(cTmp, Math.max(sstep(0.0, 0.35, wn + 0.45 - up * 1.05) * 0.9, sstep(0.04, 0.3, drift) * 0.7) * (1 - 0.5 * sstep(0.85, 1, up)));
        }
        // the sand thrown out of the pit lies down the slope in rays, thick at the rim and thinning over eighty
        // metres; in the pit and on its banks the earth is scorched and cloddy
        const a = Math.atan2(z - PIT.z, x - PIT.x), ray = noise.n2(Math.cos(a) * 2.4 + 5, Math.sin(a) * 2.4 + pd / 70), thrown = 1 - sstep(PIT.r + 4, PIT.r + 88, pd);
        out.lerp(cSand, clamp(Math.pow(thrown, 1.4) * (0.55 + 1.1 * ray), 0, 0.92) * (0.8 + 0.2 * n2));
        if (pd < PIT.r + 9) out.lerp(cScorch, (1 - sstep(PIT.r - 11, PIT.r + 9, pd)) * (0.55 + 0.45 * noise.n2(x / 3.1 + 9, z / 3.1)));
        if (pd < PIT.r + 30) out.multiplyScalar(0.8 + 0.4 * noise.n2(x / 4.3, z / 4.3 + 70));
      } else {
        out.lerp(cMud, 1 - sstep(0.2, 1.6, h)); out.lerp(cWeed, (1 - sstep(0.3, 2.6, h)) * sstep(-0.2, 0.3, n2) * 0.85);
      }
      return out;
    };
    await ctx.yield();

    // ---------------------------------------------------------------- 3. the sky, the ground
    // the wood's smoke leans across the sky from the burning end of the wood, away from the glow; where it stands
    // on the horizon is set every frame from the eye (see update)
    const FIRE = { x: WOOD.x + 0.12 * WOOD.len, far: Math.atan2(X(WOOD.x), -WOOD.z) + 1.2 * MX };      // the middle of the burning stretch; the bearing its smoke trails off to, far away
    const dome = makeDome(U, { smoke: [Math.atan2(X(FIRE.x), -woodZ(FIRE.x)), 1.2 * MX, hourKey === 'deep' ? 0.95 : 0.75, hour.fire || 1], rain: hour.rain || 0,
      bars: [[-0.42 * MX, 0.135, 0.5, 0.012], [0.12 * MX, 0.185, 0.42, 0.011], [-0.08 * MX, 0.098, 0.3, 0.008]] });
    scene.add(dome.object);
    U.uFire.value.set(X(FIRE.x), ground0(FIRE.x, woodZ(FIRE.x)) + 30, woodZ(FIRE.x), 0.4 * (hour.fire || 1));
    const stars = makeStars(U, R.stars, { count: hour.stars, gain: hour.starGain, glowAz: shared.glowAz, planetAz: 0.62 * MX, planet: hourKey !== 'storm' });
    scene.add(stars.object);
    await ctx.yield();
    // The land's near grain: stones and cracked plates, which are the same every way round. The kit's tufts are
    // not asked for: they are long cells laid flat from above with their length up the valley, and on the hill's
    // slope, looked along, they read as a smear of strokes all leaning one way. What stands on the hill's ground
    // instead is real (see THE GROUND AT THE HILL'S FOOT).
    const terrain = await T.makeTerrainAsync({ rng: R.land, noise, path, height: ground, color: landColor, bounds: [-760, -1820, 860, 230], biome: 'meadow', maxTriangles: 56000,
      cell: 3, near: 40, levels: 6, waterLevel: 0, sunDir: shared.keyDir, shadow: 0.35, ao: 0.3, corridor: { clearance: 6, width: 10 },
      palette: { clouds: 0, rock: '#6a665e', rockB: '#5c5852', snow: null, tufts: 0, pebbles: 0.35, cracks: 0.25, bounceAmount: 0.6 } }, () => ctx.yield());
    scene.add(terrain.object);
    await ctx.yield();

    // ---------------------------------------------------------------- what people built and left (one mesh, unmirrored, then mirrored whole)
    const brng = R.built, acc = new Acc(), posts = [], hangs = [];
    const bridge = bridgeInto(acc, { z: BRIDGE_Z, side: sideArches, rng: brng }); posts.push(...bridge.posts); hangs.push(...bridge.hangs);
    const cartX = bridge.half - 7, cart = cartInto(acc, { at: [cartX, bridge.deckY(cartX) + 0.62, BRIDGE_Z + bridge.hw - 1.5] });
    await ctx.yield();
    // the valley has been emptied: no window in it is lit (no lamp in the mill, the inn or any cottage)
    const mill = millInto(acc, { x: MILL.x, z: MILL.z }, brng); posts.push(...mill.posts);
    const brick = () => C(brng.pick(['#8a5a48', '#7f5646', '#92624c', '#84604e'])), lime = () => C(brng.pick(['#b9b2a2', '#aba596', '#c2bcae']));
    // x, z, turn, width, depth, eaves, state (0 whole, 1 roof burst open, 2 burnt to the gable ends: its embers still glow), limewashed
    const HOUSES = [[38, -404, 1.45, 8, 5.4, 3.2, 0, 0], [41, -424, 1.7, 7, 5, 3.0, 1, 1], [37, -447, 1.55, 9, 5.5, 3.3, 2, 0], [44, -500, 0.2, 7.5, 5, 3.1, 1, 0], [39, -519, 1.5, 8, 5.2, 3.0, 0, 1],
      [66, -408, 0.05, 8, 5.5, 4.9, 0, 0], [72, -428, 1.6, 7, 5, 3.2, 2, 1], [74, -494, 1.5, 7.5, 5.2, 3.2, 1, 0], [67, -516, 0.1, 8, 5.4, 4.7, 0, 0],
      [93, -404, 0.3, 7, 5, 3.1, 2, 0], [101, -432, 1.2, 8, 5.5, 3.3, 0, 1], [97, -466, 0.2, 7, 5, 3.0, 1, 0], [110, -490, 1.4, 8, 5.2, 3.2, 0, 0], [121, -450, 0.8, 7, 5, 3.0, 2, 1]];
    const houses = [];
    for (const hs of HOUSES) {
      const lw = hs[7] === 1;
      houses.push(cottageInto(acc, { x: hs[0], z: hs[1], ry: hs[2], w: hs[3], d: hs[4], h: hs[5], state: hs[6], wall: lw ? KIND.plaster : KIND.brick, wallCol: lw ? lime() : brick(), roofCol: C(brng.pick(['#7a4a3a', '#6e4638', '#80523e'])),
        weed: brng.range(2.2, 4.6), chimneys: brng.pick([1, 1, 2]), door: brng.pick([1, -1]), pitch: brng.range(0.85, 1.05) }, brng));
      posts.push([hs[0], hs[1], hs[3] * 0.75, 0.55]);
    }
    await ctx.yield();
    // the inn: the largest house, two floors, two chimneys, a lower range behind; nothing hangs over its door
    houses.push(cottageInto(acc, { x: 64, z: -447, ry: 1.52, w: 13, d: 7, h: 5.4, state: 0, wall: KIND.plaster, wallCol: C('#b3ac9c'), roofCol: C('#74483a'), weed: 4.2, chimneys: 2, door: -1, pitch: 0.9 }, brng));
    cottageInto(acc, { x: 71.5, z: -441, ry: 0.0, w: 8, d: 5, h: 3.0, state: 0, wall: KIND.brick, wallCol: brick(), roofCol: C('#74483a'), weed: 3, chimneys: 0, pitch: 0.9 }, brng);
    posts.push([64, -447, 10, 0.55]);
    const church = churchInto(acc, { x: CHURCH.x, z: CHURCH.z, ry: 0, tower: 22 }); posts.push(...church.posts, [CHURCH.x + 14, CHURCH.z, 9, 0.5]);
    washingInto(acc, { a: [27.5, -429.5], b: [34, -431.5], y: 2.3 }, brng);
    await ctx.yield();
    const cyl = cylinderInto(acc, { x: PIT.x + 1.5, y: ground0(PIT.x, PIT.z) - 2.6, z: PIT.z + 1, radius: 14, tilt: 0.2, yaw: 0.25 });
    // the cart track to the sand pit: it leaves the flood at the hill's foot and winds up the hill's face to the
    // pit's bank on a line of its own (the route climbs some 15 m to its left)
    const trackX = (z) => 12 + 6 * Math.sin((z + 780) / 23);
    { const pts = []; for (let k = 0; k <= 50; k++) { const z = lerp(HILL.z + HILL.r1 + 6, PIT.z + PIT.r + 9, k / 50), x = trackX(z); pts.push([x, z]); }
      trackInto(acc, { pts, width: 2.5, heightAt: (x, z) => terrain.surfaceAt(X(x), z) }); }
    // the far wood on its ridge: dark crowns, small with distance (the fire is among them)
    { const wr = R.wood; acc.extra(KIND.wood, 0, 0, 0.5);
      for (let k = 0; k < 150; k++) {
        const x = WOOD.x + (wr() - 0.5) * (WOOD.len + 160), z = woodZ(x) + wr.range(-70, 70) + 20, y = ground0(x, z), hh = wr.range(13, 22), rr = hh * wr.range(0.34, 0.5);
        acc.color(C('#232a1c').multiplyScalar(wr.range(0.7, 1.2))); acc.ball(x, y + hh * 0.62, z, [rr, hh * 0.44, rr], 6, 3); acc.tube([x, y - 1, z], [x, y + hh * 0.4, z], 0.5, 0.35, 4, 0);
      } }
    const builtMat = makeBuiltMaterial(U);
    builtMat.uniforms.uSick.value.set(late ? 0.2 : early ? -0.8 : -0.4, 0.03); builtMat.uniforms.uGreen.value = 0.07;      // the pit breathes; it is not a lamp
    const built = new THREE.Mesh(finish(acc, MX), builtMat); built.frustumCulled = false; scene.add(built);
    await ctx.yield();
    // the things that still move: the mill wheel, the cart's wheel in the air, the skiff
    const wheelGeo = (o, kind, weed, col) => { const a = new Acc(); a.extra(kind, weed, 0, 0.3); a.color(col); wheelInto(a, o); return finish(a, 1); };
    const millWheel = new THREE.Mesh(wheelGeo({ radius: 3.0, width: 1.7, spokes: 8, paddles: 18, thick: 0.11, axle: 0.5 }, KIND.wood, 99, C('#55483c')), builtMat);
    millWheel.position.set(X(mill.wheel[0]), mill.wheel[1], mill.wheel[2]); millWheel.rotation.set(0, Math.PI / 2, 0); scene.add(millWheel);
    const cartWheel = new THREE.Mesh(wheelGeo({ radius: 0.74, width: 0.08, spokes: 12, seg: 14 }, KIND.wood, 0, C('#6e5a44')), builtMat), cartPivot = new THREE.Group();
    cartPivot.position.set(X(cart.hub.x), cart.hub.y, cart.hub.z); cartPivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(MX * cart.axis.x, cart.axis.y, cart.axis.z)); cartPivot.add(cartWheel); scene.add(cartPivot);
    const skiffAcc = new Acc(); skiffInto(skiffAcc); const skiff = new THREE.Mesh(finish(skiffAcc, 1), builtMat);
    const SKIFF = { x: X(channelX(-232) + 3.5), z: -232 }; skiff.position.set(SKIFF.x, 0.02, SKIFF.z); scene.add(skiff);
    await ctx.yield();
    // the willows of the two old banks (placed now, planted later: the weed is thickest round every trunk)
    const wrng = R.willows, willowPts = [];
    for (const bank of [-1, 1]) for (let z = 130 - wrng() * 15; z > -770; z -= wrng.range(15, 25)) {
      const x = channelX(z) + bank * (16 + wrng.range(-2.5, 3.5));
      if (Math.abs(x - pathX(z)) < 11 || Math.abs(z - BRIDGE_Z) < 16 || Math.abs(z - WEIR.z) < 9) continue;
      if (onEngineWalk(z) && engineLineD(x, z) < TRACK + FOOT_R + CROWN) continue;      // no crown where a foot swings
      if (Math.hypot(x - MILL.x, z - MILL.z) < 14 || ground0(x, z) > -0.1) continue;
      willowPts.push({ x: X(x), y: -0.25, z, s: wrng.range(0.85, 1.15), rot: wrng.range(0, 6.28), v: wrng() < 0.62 ? 1 : 0 });
      posts.push([x, z, 5.5, 0.5]);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the flood: one map, one sheet
    const sickBias = early ? -0.9 : late ? 0.12 : -0.5;
    // the current through each arch keeps a tail of open water below the bridge (and a pool above it)
    const archTails = []; for (const a of bridge.arches) for (const [dz, r, k] of [[13, 7.5, 0.8], [-16, 9, 1.0], [-36, 9, 0.9], [-58, 8, 0.8], [-82, 7, 0.7]]) archTails.push([X(a[0]), BRIDGE_Z + dz, r, k]);
    const map = await makeFloodMap(ctx, { rng: R.flood, box: [-345, -1150, 345, 170], size: [384, 736], channelX: (z) => MX * channelX(z),
      leadX: (z) => MX * (pathX(z) + 6.5 * Math.sin(z / 43) + 3 * Math.sin(z / 19 + 1)), leadW: (z) => (z < -770 ? 0 : (3.2 + 2.6 * Math.sin(z / 31 + 2)) * sstep(-0.35, 0.1, Math.sin(z / 37 + 0.6) + 0.6)),
      sickAt: (x, z) => sickBias + (late ? 0.5 : 1.05) * (1 - sstep(-800, -540, z)), bumps: posts.map((p) => [X(p[0]), p[1], p[2], p[3]]), holes: [[SKIFF.x, SKIFF.z, 9, 1.2], [X(4), WEIR.z - 10, 13, 0.9], ...archTails] });
    const sheet = makeSheet(U, map, { z0: 168, z1: -1146, dz: 3.2, cols: 26, first: 0.9, ratio: 1.155, centreX: (z) => MX * (pathX(z) + 150 * (1 - sstep(-900, -760, z))) }, { uDeep: { value: S('#0E1A2E') } });
    { const SU = sheet.uniforms; bridge.arches.slice(0, 5).forEach((a, i) => SU.uArch.value[i].set(X(a[0]), a[1], a[2], a[3]));
      SU.uBridge.value.set(BRIDGE_Z, 11.4, bridge.far, 1); SU.uWeir.value.set(Math.min(X(WEIR.x0), X(WEIR.x1)), Math.max(X(WEIR.x0), X(WEIR.x1)), WEIR.z, 1); }
    scene.add(sheet.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the engines
    const kit = makeEngineKit(ctx, U);
    await ctx.yield();
    const eBase = { origin: [engO.x, 0, engO.z], dir: [MX * EDIR.x, EDIR.y], drift: [0.6 * MX, 0, 0.3], ...MAKE };
    // THE GAIT'S PHASE (36 to a stride). A phase is clear if, with it, (1) no foot that comes down in the walk
    // comes down on the weir's sill, and (2) the road keeps 3 m and more from every metal surface through the
    // whole pass. The gait's one draw takes one of the clear phases, each as likely as another. (1): the sill is
    // the line of white water the flood sheet draws, 1.5 m to either side of it, and the foot's own reach. (2)
    // walks the road every 0.25 m from 220 m before the crossing to 110 m after it. Surfaces: every part of a leg
    // section lies within 1.5 m of its axis (knuckle balls 1.4, 1.22 and 1.02 m, collars to 1.06 m, the slide
    // rod's far side 1.5 m), a foot within FOOT_R of its sole's centre, the body within 6.5 m of its centre.
    // (Which phases are clear follows from the week and from whether the valley is mirrored: six lists, of 7 to
    // 15 phases, none empty; were one empty, the dealt phase would stand.)
    const third = SZ.stride / 3, standAt = (ph) => ph + Math.ceil((SZ.stride - ph) / third - 1e-9) * third;      // metres walked where it stands as we come in (see below)
    const sillZ = (wx) => WEIR.z + 0.2 - 1.5 * Math.sin(0.35 * wx), SILL = 1.5, sillX = [Math.min(X(WEIR.x0), X(WEIR.x1)), Math.max(X(WEIR.x0), X(WEIR.x1))];
    let phi = 0;
    const LEG_R = 1.5, CLEAR = 3;
    { const Fr = makeFrame(eBase), st = makeState(), p = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), clear = [];
      const segD = (P, A, B) => { a.subVectors(B, A); const t = clamp(b.subVectors(P, A).dot(a) / Math.max(a.lengthSq(), 1e-6), 0, 1); return b.copy(A).addScaledVector(a, t).distanceTo(P); };
      // foot j stands on its n-th place while the body walks from (n + j/3 + 1/3) strides to (n + j/3 + 1)
      const footing = () => { const s0 = standAt(Fr.phi), s1 = Math.min(LINE, walkEnd);
        for (let j = 0; j < 3; j++) for (let n = -1; Fr.phi + (n + j / 3 + 1 / 3) * SZ.stride <= s1; n++) {
          if (Fr.phi + (n + j / 3 + 1) * SZ.stride < s0) continue;
          plantPoint(Fr, j, n, p);
          if (p.x > sillX[0] - FOOT_R && p.x < sillX[1] + FOOT_R && Math.abs(p.z - sillZ(p.x)) < SILL + FOOT_R) return false;
        }
        return true; };
      const road = async () => { let n = 0;
        for (let m = -220; m <= 110; m += 0.25) {
          const u = uPass + M(m); path.pointAt(u, p); poseWalk(Fr, st, (LINE * u - Fr.phi) / Fr.stride, 1, {});
          let least = st.body.distanceTo(p) - 6.5;
          for (let j = 0; j < 3; j++) least = Math.min(least, segD(p, st.hip[j], st.k1[j]) - LEG_R, segD(p, st.k1[j], st.k2[j]) - LEG_R, segD(p, st.k2[j], st.ank[j]) - LEG_R, st.sole[j].distanceTo(p) - FOOT_R);
          if (least < CLEAR) return false;
          if (++n % 200 === 0) await ctx.yield();
        }
        return true; };
      for (let k = 0; k < 36; k++) { Fr.phi = (k / 36) * SZ.stride; if (footing() && await road()) clear.push(k);
        await ctx.yield(); }
      const draw = R.gait();
      phi = ((clear.length ? clear[Math.floor(draw * clear.length)] : Math.floor(draw * 36)) / 36) * SZ.stride;
    }
    const cycleT = SZ.stride / speed, eOpt = { ...eBase, cycleT };
    // it stands as we come in (all three feet down) and strides off as we enter: it is at its pace when it has
    // walked one whole stride, and the first all-feet-down moment that allows that sets where it stood
    const aStart = (2 * standAt(phi)) / LINE;
    const striding = (u) => (u >= aStart ? LINE * u : LINE * (aStart / 2 + (u * u) / (2 * aStart)));
    // metres it has walked along its line when we are u of the way; near the hill it slows to a stand at walkEnd
    const walked = (u) => { const s = striding(clamp(u, 0, 1)), s0 = walkEnd - 40; return s < s0 ? s : s0 + 40 * (1 - Math.exp(-(s - s0) / 40)); };
    const walked0 = walked(0), gaitAt = (u) => (walked(u) - phi) / SZ.stride;
    await ctx.yield();
    const strider = kit.make({ ...eOpt, phi, fx: true, gStart: gaitAt(0) - 1e-4, weed: [30, 2.4, 0, 0.8] });
    scene.add(strider.object);
    // along its line: where it comes abreast of the mill, and of the church tower (metres walked)
    const alongLine = (x, z) => (X(x) - engO.x) * strider.E.F.x + (z - engO.z) * strider.E.F.z;
    const sMill = alongLine(MILL.x, MILL.z), sTower = alongLine(CHURCH.x, CHURCH.z);
    const aimWood = new THREE.Vector3(X(WOOD.x - 120) - passP.x, 70, woodZ(WOOD.x - 120) - passP.z).normalize();
    // THE DEAD ENGINE stands over the ring where it died, on the level top behind the pit. It had turned toward
    // the river's way out round the hill, a little back toward the valley; its body hangs out of level, each leg
    // has given way in its own manner, the hood is sunk and turned aside, the arm hangs. (Its stance is written
    // for the unmirrored valley; a mirrored valley mirrors it, left leg for right.)
    const dF = new THREE.Vector2(0.95, 0.31).normalize(), dL = new THREE.Vector2(dF.y, -dF.x), DEAD = { x: 2, z: -987, h: 23 };
    const dead = kit.make({ origin: [X(DEAD.x), HILL.top, DEAD.z], dir: [MX * dF.x, dF.y], pole: [1, -0.2], weed: [5.2, 12.5, HILL.top, 1] });
    scene.add(dead.object);
    const stance = [[10, 9], [12, -10], [-13, 1]].map(([f, l]) => { const s = new THREE.Vector3(X(DEAD.x + dF.x * f + dL.x * l), 0, DEAD.z + dF.y * f + dL.y * l); s.y = terrain.surfaceAt(s.x, s.z) - 0.25; return s; });
    const sw = (a) => (MX > 0 ? a : [a[1], a[0], a[2]]);
    const deadSoles = sw(stance), deadBody = new THREE.Vector3(X(DEAD.x), HILL.top + DEAD.h, DEAD.z);
    dead.still(deadSoles, deadBody, { hoodYaw: -0.62 * MX, hoodTip: 27 * DEG, raise: 0, slack: true, roll: 6.5 * DEG * MX, pitch: 5 * DEG,
      poles: sw([[1, -0.2, 0.35 * MX], [1, -0.55, -0.5 * MX], [0.7, -0.1, 0.6 * MX]]), folds: sw([[1.0, -1.25], [1.25, -0.5], [0.7, -1.7]]) });
    await ctx.yield();

    // ---------------------------------------------------------------- the standing weed
    // kinds: 0 tall candelabra, 1 thicket, 2 great water fronds, 3 low clump, 4 far thicket; TALL / WIDE: a kind's height and half spread at size 1
    const prng = R.plants, plants = [], steps = [], TALL = [4.3, 2.9, 2.2, 1.2, 3.4], WIDE = [1.7, 2.2, 3.5, 1.2, 2.4];
    { const t = new THREE.Vector3(); for (let n = -3; n < Math.ceil(LINE / SZ.stride) + 3; n++) for (let j = 0; j < 3; j++) { plantPoint(strider.E, j, n, t); steps.push([t.x, t.z]); } }
    const blocked = (x, z, r) => {
      for (const s of steps) if (Math.abs(s[0] - x) < r && Math.abs(s[1] - z) < r) return true;
      for (const p of posts) if (p[3] > 0.52 && Math.hypot(x - X(p[0]), z - p[1]) < p[2] * 0.6) return true;      // not inside a house or a pier
      return Math.abs(z - BRIDGE_Z) < 4.6 && Math.abs(x) < bridge.far;
    };
    // the three herons stand on the weir's sill (placed now, made with the other birds). A stand that a foot comes
    // down by (the plants' own test and distance) is left for another place on the sill, dealt on a stream of the
    // herons' own until one is clear of every footfall and 5 m from the other birds
    const heronAt = [[X(-10), WEIR.z - 0.4], [X(-3.5), WEIR.z + 0.5], [X(6.5), WEIR.z - 0.7]];
    { const hs = ctx.core.makeRng(ctx.core.hashSeed('herons:' + ctx.seed));
      for (let i = 0; i < 3; i++) for (let tries = 0; tries < 40 && blocked(heronAt[i][0], heronAt[i][1], 4.5); tries++) {
        const x = X(hs.range(WEIR.x0 + 3, WEIR.x1 - 5)), z = sillZ(x);
        if (heronAt.every((h, k) => k === i || Math.hypot(h[0] - x, h[1] - z) > 5)) heronAt[i] = [x, z];
      } }
    // NOTHING LARGE AT THE LENS. Whatever stands within 6 m of the line of flight (its whole height and spread
    // counted) is a low clump, and a low clump is no taller than leaves 3.2 m between its top and the eye
    const gap = (d, z, v, s) => Math.hypot(Math.max(0, Math.abs(d) - WIDE[v] * s), Math.max(0, pathY(z) - TALL[v] * s));
    const lowSize = (d, z, s) => (Math.abs(d) < 3.2 + WIDE[3] * s ? Math.min(s, Math.max(0.3, (pathY(z) - 3.2) / TALL[3])) : s);
    for (let k = 0; k < 5200 && plants.length < 820; k++) {
      const z = prng.range(150, -792), d = (prng() < 0.5 ? -1 : 1) * (4 + 236 * Math.pow(prng(), 2.3)), x = X(pathX(z)) + d, m = map.sampleMat(x, z);
      if (m < 0.66 || noise.n2(x / 26 + 300, z / 26) + 0.9 * map.sampleHum(x, z) + (m - 0.8) < 0.05 || blocked(x, z, 4.5)) continue;
      let v = Math.abs(d) > 105 ? 4 : prng.pick([0, 0, 1, 1, 2]), s = prng.range(0.8, 1.3);
      if (gap(d, z, v, s) < 6) { v = 3; s = lowSize(d, z, s); }
      plants.push({ x, y: 0.06 + 0.7 * map.sampleHum(x, z), z, v, s, rot: prng.range(0, 6.28), sick: map.sampleSick(x, z), seed: prng(), lean: prng.range(0, 0.12) });
      if (k % 400 === 399) await ctx.yield();
    }
    await ctx.yield();
    const growth = await makeGrowth(ctx, U, { rng: R.weedshapes, plants, chunkZ: 96, cull: 290, ring: sheet.uniforms.uRing });
    scene.add(growth.object);
    await ctx.yield();
    // ---------------------------------------------------------------- the native trees: dark shapes
    const wind = flora.makeWind({ direction: [0.6 * MX, 0.8], strength: 0.4, gustiness: 0.4 });       // still air: a slow stir
    const mopt = { wind, backlight: 0.3, backlightTint: '#c8d8a0', ambient: 1.25, leafAmbient: 1.15 };
    await flora.prepareLeafTexture(mopt, ctx.yield);
    const treeMat = flora.windMaterial(mopt), weedTreeMat = flora.windMaterial({ wind, map: treeMat.map, backlight: 1.1, backlightTint: '#FF3B45', ambient: 1.25, leafAmbient: 1.5 });
    const trng = R.trees, dark = { leaf: '#566b46', leafLight: '#74875a', leafDark: '#33402c', bark: '#5a5046', barkDark: '#38322c' };
    const hung = { leaf: '#A04048', leafLight: '#C85560', leafDark: '#5a2028', bark: '#4a4034', barkDark: '#28221c' };
    const poplar = { leaf: '#8d9674', leafLight: '#c6cea4', leafDark: '#4a5442', bark: '#6a6256', barkDark: '#423c34' };      // a poplar's leaf is pale underneath and never still
    const withD = (p) => ({ ...p, d: Math.abs(p.x - X(pathX(p.z))), u: path.nearestXZ(p.x, p.z).u });
    const trees = [];
    for (const [v, pal, mat] of [[0, dark, treeMat], [1, hung, weedTreeMat]]) {
      const pts = willowPts.filter((p) => p.v === v).map((p) => ({ ...withD(p), v: 0 }));
      trees.push(flora.makeScatter({ rng: trng.fork('w' + v), points: pts, variants: [flora.willowGeometry({ rng: trng.fork('wa' + v), detail: 1, height: 9, strands: 12, ...pal })], farVariants: [flora.willowGeometry({ rng: trng.fork('wb' + v), detail: 0, height: 9, strands: 5, ...pal })],
        farDistance: 34, material: mat, tint: 0.1, hue: 0.02, sink: 0.01, tilt: 0.06 }));
      await ctx.yield();
    }
    // nine poplars in a row along the old channel's left bank (8 to 11 m behind the willows' line) past the crossing, three
    // dead elms, the yew by the tower. A Lombardy poplar is
    // a column, not a flame: the kit's tall narrow tree is drawn out so that its sides run nearly parallel for two
    // thirds of its height and end in a blunt point (each ring of foliage is widened by what the column asks at
    // its height over what the flame gave it)
    const POPLAR_H = 24, column = (geo) => { const P = geo.attributes.position, y0 = 0.17 * POPLAR_H, y1 = 0.9 * POPLAR_H;
      for (let i = 0; i < P.count; i++) { const y = P.getY(i), t = clamp((y - y0) / (y1 - y0), 0, 1);
        const flame = t < 0.22 ? lerp(0.72, 1, t / 0.22) : lerp(1, 0.16, Math.pow((t - 0.22) / 0.78, 1.5)), col = lerp(0.78, 1, sstep(0, 0.3, t)) * lerp(1, 0.34, sstep(0.62, 1, t));
        const k = lerp(1, col / flame, sstep(0.1 * POPLAR_H, 0.2 * POPLAR_H, y)); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); }
      P.needsUpdate = true; geo.computeBoundingSphere(); geo.computeBoundingBox(); return geo; };
    { const pts = [];
      for (let k = 0; k < POPLARS.n; k++) { const z = POPLARS.z0 - k * POPLARS.step + trng.range(-1.5, 1.5), x = channelX(z) - 24 - trng.range(0, 3); pts.push(withD({ x: X(x), y: Math.max(ground0(x, z), -0.3), z, s: trng.range(0.9, 1.15), rot: trng.range(0, 6.28), v: 0 })); }
      for (const q of ELMS) pts.push(withD({ x: X(q[0]), y: Math.max(ground0(q[0], q[1]), -0.3), z: q[1], s: 1.1, rot: trng.range(0, 6.28), v: 1 }));
      pts.push(withD({ x: X(CHURCH.x - 5), y: -0.3, z: CHURCH.z + 10.5, s: 1, rot: 1.0, v: 2 }));
      trees.push(flora.makeScatter({ rng: trng.fork('pop'), points: pts, variants: [column(flora.cypressGeometry({ rng: trng.fork('p'), detail: 2, height: POPLAR_H, girth: 0.085, flex: 2.2, ...poplar })), flora.deadTreeGeometry({ rng: trng.fork('e'), detail: 1, height: 15, bark: '#57504a' }),
        flora.oakGeometry({ rng: trng.fork('y'), detail: 1, height: 8.5, fullness: 1.25, leaf: '#22321c', leafLight: '#31452a', leafDark: '#121a10', bark: '#3a3028' })], material: treeMat, tint: 0.06, hue: 0.01, sink: 0.01, tilt: 0.03, stretch: 0.1 })); }
    await ctx.yield();
    // the arrival, on every deal (a stream of its own: nothing else is re-rolled). A field ditch runs down the
    // meadow from a dealt point beside the entry on a dealt bearing within 11 degrees of the valley's axis: six
    // weed-hung willows stand along it at uneven dealt gaps. A hedge lies along a field edge: a line through a
    // dealt point of the meadow at its own dealt bearing across the valley, 64 m of it, drowned. Both are kept
    // 11 m clear of the road (the old banks' willows' own number) and of nothing else; neither is laid by the road.
    { const ar = ctx.core.makeRng(ctx.core.hashSeed('arrival:' + ctx.seed)), pts = [], KEEP = 11;
      const dx0 = (ar() < 0.5 ? -1 : 1) * ar.range(13, 21), dslope = ar.range(-0.2, 0.2); let dz = -4 - ar.range(0, 8);
      for (let k = 0; k < 6; k++) { const z = dz, x = dx0 + dslope * -z, size = ar.range(0.85, 1.25), rot = ar.range(0, 6.28); dz -= ar.range(13, 27);
        if (Math.abs(x - pathX(z)) >= KEEP && !blocked(X(x), z, 3)) pts.push(withD({ x: X(x), y: Math.max(ground0(x, z), -0.3), z, s: size, rot, v: 0 })); }
      const hx0 = ar.range(-30, 30), hz0 = -30 - ar.range(0, 70), hb = ar.range(-0.6, 0.6);
      for (let k = 0; k < 34; k++) { const t = -32 + 1.94 * k + ar.range(-0.3, 0.3), x = hx0 + Math.cos(hb) * t, z = hz0 + Math.sin(hb) * t, size = ar.range(0.8, 1.15), rot = ar.range(0, 6.28);
        if (Math.abs(x - pathX(z)) >= KEEP && !blocked(X(x), z, 2)) pts.push(withD({ x: X(x), y: Math.max(ground0(x, z), -0.3) - 0.4, z, s: size, rot, v: 1 })); }
      const sRng = ar.fork('s'), gw = flora.willowGeometry({ rng: ar.fork('w'), detail: 1, height: 10, strands: 12, ...hung });
      await ctx.yield();
      const gh = flora.oakGeometry({ rng: ar.fork('h'), detail: 0, height: 3.4, fullness: 1.5, ...hung });
      await ctx.yield();
      trees.push(flora.makeScatter({ rng: sRng, points: pts, variants: [gw, gh], material: weedTreeMat, tint: 0.1, hue: 0.02, sink: 0.01, tilt: 0.06 }));
      await ctx.yield(); }
    for (const t of trees) scene.add(t.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the birds have come back
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), frng = R.fauna, many = late ? 2 : 1;
    // swifts hawk over the water ahead of us, from fifty metres before the entry until the crossing
    fauna.add(F.makeFlock({ rng: frng.fork('swifts'), species: 'swifts', count: 40 * many, along: { path, side: 0, up: 1.2, lead: 24, from: -M(50), to: uPass, drift: 12 }, spread: [20, 3.2, 26] }));
    await ctx.yield();
    fauna.add(F.makeWaders({ rng: frng.fork('herons'), species: 'heron', count: 3, positions: heronAt.map((h) => [h[0], 0, h[1]]), level: 0, size: 1.15 }));
    // a heron gets up and crosses ahead of us as we come abreast of the weir
    fauna.add(F.makeFlock({ rng: frng.fork('heron'), species: 'flamingos', count: 1, size: 0.9, speed: 9, flap: 2.1,
      palette: { body: '#8a8f98', belly: '#c4c4be', wingC: '#6d727c', trail: '#3a3d44', tip: '#2a2c32', beak: '#c9a44a', head: '#d0d0cc', neckC: '#b4b5b2', tailC: '#6d727c', legC: '#5a5248' },
      cross: { path, u: uWeir, lead: 30, angle: 64, side: -MX, height: 3.5, span: 170, rise: 11, duration: DUR } }));
    await ctx.yield();
    const belfry = church.openings[2];
    // the owl crosses 26 m ahead of us as we come abreast of the tower; on other evenings the bats come out of the
    // belfry when the eye is first within 120 m of it (straight line: their 50 m to our way at 8.5 m/s against our
    // 120 m, so the stream is across our way as we reach it), and stream away across the river (their way is the
    // straight line from the belfry to a point over the far flood; the kit's crossing is solved to lie on it)
    if (cast.owl) fauna.add(F.makeFlock({ rng: frng.fork('owl'), species: 'gulls', count: 1, size: 1.45, speed: 7, flap: 2.2, glide: 0.5, palette: { body: '#cfc6b4', belly: '#e8e2d4', wingC: '#b9a98a', tip: '#8a7a5c', head: '#e2dccc', beak: '#6a5a40' },
      cross: { path, u: uTower, lead: 26, angle: 72, side: MX, height: 4, span: 190, rise: -3, duration: DUR } }));
    else {
      let uNear = 0; { const q = new THREE.Vector3(), bf = new THREE.Vector3(X(belfry.x - 1), belfry.y, belfry.z); for (let m = 0; m < LEN; m += 2) if (path.pointAt(m / LEN, q).distanceTo(bf) < 120) { uNear = m / LEN; break; } }
      const bs = 8.5, S0 = new THREE.Vector3(X(belfry.x - 1), belfry.y, belfry.z), E0 = new THREE.Vector3(X(-150), 26, -560), span = Math.hypot(E0.x - S0.x, E0.z - S0.z);
      const mid = S0.clone().add(E0).multiplyScalar(0.5), win = span / (2 * bs * DUR), cu = uNear + win, um = path.nearestXZ(mid.x, mid.z).u;
      const P = path.pointAt(um, new THREE.Vector3()), Tn = path.tangentAt(um, new THREE.Vector3()).setY(0).normalize(), Rn = new THREE.Vector3(-Tn.z, 0, Tn.x), dd = E0.clone().sub(S0).setY(0).normalize();
      fauna.add(F.makeFlock({ rng: frng.fork('bats'), species: 'bats', count: 60, speed: bs,
        cross: { path, u: cu, lead: (um - cu) * LEN, offset: mid.clone().sub(P).dot(Rn), height: mid.y - P.y, angle: Math.acos(clamp(dd.dot(Tn), -1, 1)) / DEG, side: Math.sign(dd.dot(Rn)) || 1, span, rise: E0.y - S0.y, bow: 0, duration: DUR } }));
    }
    // crows (or gulls) about the dead engine's hood; eight sit on it and on the basket's rim until we come
    const bodyM = dead.state.mats[PART.body], hoodM = dead.state.mats[PART.hood], hoodTop = new THREE.Vector3(0, 5.45, -0.4).applyMatrix4(hoodM);
    fauna.add(F.makeFlock({ rng: frng.fork('crows'), species: cast.gulls ? 'gulls' : 'crows', count: 30 * many, center: [hoodTop.x, hoodTop.y + 2.5, hoodTop.z - 2], radius: 22, height: 8, speed: 7.5, size: 1.25 }));
    // on the rare evening the star comes down close: every bird in the valley goes up as it lands (by the dead elm)
    if (rare) fauna.add(F.makeFlock({ rng: frng.fork('up'), species: 'crows', count: 34, speed: 11, cross: { path, u: uElm, lead: 150, angle: 78, side: MX, height: 4, span: 360, rise: 70, duration: DUR } }));
    await ctx.yield();
    const fowl = makeWaterfowl(U, sheet.uniforms.uWake, { phase: PH.fowl }); scene.add(fowl.object);
    const perches = []; { const v = new THREE.Vector3();
      for (const th of [0.5, 1.75, 2.7, 3.9, 5.3]) { v.set(Math.cos(th) * 3.03, 5.25, -6.35 + Math.sin(th) * 1.95).applyMatrix4(bodyM); perches.push([v.x, v.y, v.z, th + 1.6]); }
      for (const q of [[-0.9, 5.3, -0.4, 0.4], [0.8, 5.3, -0.9, -0.7], [0.1, 5.2, 0.6, 2.6]]) { v.set(q[0], q[1], q[2]).applyMatrix4(hoodM); perches.push([v.x, v.y, v.z, q[3]]); } }
    const perched = makePerched(U, { perches, phase: PH.perch, size: 1.5, color: cast.gulls ? '#b9b6ae' : '#141317' }); scene.add(perched.object);
    await ctx.yield();

    // ---------------------------------------------------------------- the air: mist, midges, flakes, fire, smoke, stars
    const time = { value: 0 }, set = fx.fxGroup(), arng = R.air; scene.add(set.object);
    { const pos = []; for (let k = 0; k < 64; k++) { const z = arng.range(130, -800); pos.push([X(pathX(z)) + arng.range(-190, 190), arng.range(1.4, 3.4), z]); }
      set.add(fx.makeMist({ rng: arng.fork('mist'), time, positions: pos, count: 64, size: [28, 64], color: U.uMistCol.value.clone(), opacity: hour.mist, flatten: 0.28 })); }
    const midges = set.add(fx.makeParticles({ rng: arng.fork('midges'), preset: 'dust', time, count: 600, box: [44, 6.5, 44], follow: 'xz', center: [0, 3.6, 0], colors: ['#e8d8c0', '#f0c8a0', '#d8d8e0'], intensity: 0.8 }));
    // a few flakes are on the air wherever the weed is dying; most of them are seen leaving the dead growth itself (makeCrumble below)
    const flakes = set.add(fx.makeParticles({ rng: arng.fork('flakes'), preset: 'ash', time, count: Math.round((late ? 1500 : 1100) * (ctx.quality ? ctx.quality.detail : 1)), box: [56, 26, 56], colors: ['#d8cdbf', '#c9bfb4', '#e6ddd0'], size: [0.05, 0.2],
      velocity: [1.5 * MX, -0.3, 0.45], velocityRandom: [0.7, 0.4, 0.6], intensity: 1.0 }));
    await ctx.yield();
    set.add(fx.makeShootingStars({ rng: arng.fork('stars'), time, count: 1, period: [9, 16], duration: 1.0, color: '#b8ffd0', tailColor: '#2ea85a', intensity: 3, minElevation: 0.32, width: 0.004 }));
    // the far wood: alight on the right from the start. While the striding engine's case is above half its lift
    // (the middle half of its walk from abreast of the mill to abreast of the tower) a further stretch catches,
    // tree after tree: each has a place on the engine's walk at which it takes fire
    const flames = [], burning0 = 0.5, fr = arng.fork('fire'), catchAt = (t) => lerp(sMill, sTower, 0.25 + 0.5 * t);
    const fpos = (t, size, ig, seed) => { const x = WOOD.x + (t - 0.5) * WOOD.len, z = woodZ(x) + fr.range(-45, 45) + 20; flames.push([X(x), ground0(x, z) + 2, z, size, ig, seed]); };
    for (let k = 0; k < 42; k++) fpos(lerp(burning0, 1.04, fr()), fr.range(20, 44), -1, fr() * 0.99);
    for (let k = 0; k < 18; k++) fpos(burning0 - ((k + fr()) / 18) * 0.34, fr.range(26, 48), catchAt((k + 0.5) / 18), fr() * 0.99);
    for (let k = 0; k < 6; k++) fpos(lerp(burning0, 1.0, (k + 0.5) / 6), 90, -1, 2 + fr() * 0.99);
    for (let k = 0; k < 3; k++) fpos(burning0 - ((k + 0.5) / 3) * 0.34, 80, catchAt((k + 0.5) / 3), 2 + fr() * 0.99);
    const fire = makeFarFire(U, { flames, gain: hour.fire || 1, flare: SZ.stride / 2 }); scene.add(fire.object);      // a tree takes half a stride of the engine's walk to flare up
    for (const t of [0.62, 0.8, 0.96]) { const x = WOOD.x + (t - 0.5) * WOOD.len, z = woodZ(x) + 20;
      set.add(fx.makeSmokeColumn({ rng: arng.fork('col' + t), time, position: [X(x), ground0(x, z) + 10, z], height: 300, radius: [12, 70], size: [44, 150], count: 40, color: '#3a3940', colorTop: '#46444c', shadowColor: '#2a292e', ambient: '#28272c',
        hot: '#8a3008', hotFalloff: 34, opacity: 0.5, rate: 0.014, wind: [1.0 * MX, 0, 0.12], bend: 0.75, sunDir: shared.keyDir, sunColor: '#7a5a40', rim: 0.1, scatter: 0.12 })); }
    await ctx.yield();
    // the black smoke: a heavy bank lying in the hollow left of the hill; its tongue creeps out over the water
    // down the wind (the same wind the flakes go down)
    // (the heaps it sank from: metres from its middle, height, radius; the bank's skin swells over each, and the
    // four largest still coil upward: see below, after the skiff)
    const inkHeaps = [[-10, 0, 19, 30], [30, -12, 13, 24], [-42, 16, 14, 26], [12, 26, 10, 20], [-18, -30, 11, 22], [52, 14, 8, 17]].map((h) => [MX * h[0], h[1], h[2], h[3]]);
    const ink = makeInk(U, { centre: [X(SMOKE.x), SMOKE.z], size: [84, 58], top: 11, floor: (x, z) => Math.max(0, terrain.heightAt(x, z)), reach: [MX * 1.5, 0.45], heaps: inkHeaps.map((h) => [h[0], h[1], h[2] * 0.5, h[3]]) });
    scene.add(ink.object);
    const dirAt = (az, el, dist) => new THREE.Vector3(Math.sin(az * DEG) * Math.cos(el * DEG), Math.sin(el * DEG), -Math.cos(az * DEG) * Math.cos(el * DEG)).multiplyScalar(dist);
    const star = makeFallingStar(U, { from: dirAt(-41 * MX, 31, 2600), to: rare ? dirAt(-14 * MX, 1.2, 1500) : dirAt(-18 * MX, 1.0, 2600) }); scene.add(star.object);
    // the pit: a breath of green vapour from the cylinder's open end and one faint green light (a signal, small)
    const mouth = new THREE.Vector3(X(cyl.mouth.x), cyl.mouth.y, cyl.mouth.z);
    set.add(fx.makeSmokeColumn({ rng: arng.fork('pit'), time, position: [mouth.x, mouth.y - 1, mouth.z], height: 19, radius: [0.5, 2.4], size: [0.9, 3.1], count: 46, color: '#2c4a3a', colorTop: '#5d6f66', shadowColor: '#10201a', ambient: '#0c1c14',
      hot: '#1c7a4a', hotFalloff: 3.5, opacity: 0.2, rate: 0.045, wind: [0.25 * MX, 0, 0.1], bend: 0.3 }));
    const pitLight = new THREE.PointLight('#7BE08A', 2.4, 36, 2); pitLight.position.set(mouth.x, mouth.y + 2.5, mouth.z); scene.add(pitLight);
    await ctx.yield();

    // ---------------------------------------------------------------- the tall growth that climbed the hill and died there
    // It stands in the same drifts as the low clumps: shrunk, brittle, leaning, clear of the route.
    const hillSick = (y, r) => clamp(0.38 + 0.3 * sstep(3, 32, y) + 0.35 * r, 0, 1), shedders = [];
    const hrng = R.hillgrowth, hillPlants = [];
    for (let k = 0; k < 3600 && hillPlants.length < 300; k++) {
      const z = hrng.range(HILL.z + HILL.r1 + 43, PIT.z + PIT.r - 3), d = (hrng() < 0.5 ? -1 : 1) * (7 + 62 * Math.pow(hrng(), 1.5)), x = X(pathX(z)) + d, y = terrain.heightAt(x, z);
      if (y < 0.5 || Math.hypot(x - X(PIT.x), z - PIT.z) < PIT.r + 10 || noise.n2(x / 17 + 200, z / 17) < 0.1) continue;
      const pl = { x, y: terrain.surfaceAt(x, z) - 0.15, z, v: hrng.pick([0, 1, 1, 4]), s: hrng.range(1.35, 2.4), rot: hrng.range(0, 6.28), sick: hillSick(y, hrng.range(-0.1, 0.25)), seed: hrng(), lean: hrng.range(0.06, 0.3) };
      // its height above the ground counted, it keeps 6 m from the line of flight like everything else
      if (Math.hypot(Math.max(0, Math.abs(d) - WIDE[pl.v] * pl.s), Math.max(0, pathY(z) - pl.y - TALL[pl.v] * pl.s)) < 6) { pl.v = 3; pl.s = Math.min(pl.s, 1.4); }
      hillPlants.push(pl); if (pl.sick > 0.5) shedders.push(pl);
      if (k % 400 === 399) await ctx.yield();
    }
    await ctx.yield();

    // ---------------------------------------------------------------- skiff, far engines, curtains, pools, clumps, hill trees
    const srng = R.skiff, erng = R.farengines, crng = R.curtains, qrng = R.pools, lrng = R.lowclumps, krng = R.hillclumps, irng = R.inkheaps;
    // the black smoke's heaps: slow, heavy coils of ink standing on the bank
    for (let i = 0; i < 4; i++) { const h = inkHeaps[i];
      set.add(fx.makeSmokeColumn({ rng: irng.fork('h' + i), time, position: [X(SMOKE.x) + h[0], 8, SMOKE.z + h[1]], height: h[2] + 9, radius: [h[3] * 0.45, h[3] * 0.9], size: [h[3] * 0.5, h[3] * 1.05], count: 24,
        color: '#0c0c10', colorTop: '#18181d', shadowColor: '#030304', ambient: '#060608', opacity: 0.92, rate: 0.012, wind: [0.3 * MX, 0, 0.15], bend: 0.25, sunDir: shared.keyDir, sunColor: '#6a3a40', rim: 0.3, scatter: 0.06 })); }
    // low clumps along the edges of the mats near the route: the lumpy outline against the bright leads. Beyond
    // 34 m from the route they are a texture, not shapes: one in three stands there.
    const lowPlants = [];
    for (let k = 0; k < 9000 && lowPlants.length < 1650; k++) {
      const z = lrng.range(120, -790), d = (lrng() < 0.5 ? -1 : 1) * (1.5 + 58 * Math.pow(lrng(), 1.5)), x = X(pathX(z)) + d, m = map.sampleMat(x, z);
      if (m < 0.52 || (m > 0.8 && lrng() < 0.6) || blocked(x, z, 2.5) || (Math.abs(d) >= 34 && lrng() > 0.34)) continue;
      lowPlants.push({ x, y: 0.03 + 0.7 * map.sampleHum(x, z), z, v: 3, s: lowSize(d, z, lrng.range(0.6, 1.3)), rot: lrng.range(0, 6.28), sick: map.sampleSick(x, z), seed: lrng(), lean: 0 });
      if (k % 600 === 599) await ctx.yield();
    }
    // on the hill the weed came up out of the water and died as it climbed: red at the foot, pale half way, bone
    // white and brittle under the brow, in drifts with bare heath between (from 35 m short of the hill's foot to
    // the pit's near bank); every other bleached clump is seen to shed
    const hillClumps = [];
    for (let k = 0; k < 2600 && hillClumps.length < 373; k++) {
      const z = krng.range(HILL.z + HILL.r1 + 35, PIT.z + PIT.r + 10), x = X(pathX(z)) + (krng() < 0.5 ? -1 : 1) * (2 + 70 * Math.pow(krng(), 1.4)), y = terrain.heightAt(x, z);
      if (y < 0.4 || Math.hypot(x - X(PIT.x), z - PIT.z) < PIT.r + 9 || noise.n2(x / 17 + 200, z / 17) < 0.12) continue;
      const pl = { x, y: terrain.surfaceAt(x, z) - 0.06, z, v: 3, s: krng.range(0.45, 0.95) * 1.5, rot: krng.range(0, 6.28), sick: hillSick(y, krng.range(-0.1, 0.25)), seed: krng(), lean: krng.range(0, 0.25) };
      pl.s = lowSize(x - X(pathX(z)), z, pl.s);
      hillClumps.push(pl); if (pl.sick > 0.55 && krng() < 0.5) shedders.push(pl);
    }
    await ctx.yield();
    // the top: the dead growth goes on in drifts over the brow and round the pit to its very lip, bone white and
    // shedding, with a few brittle standing fronds 9 m and more from the route's line (a stream of its own)
    const topClumps = [];
    { const tg = ctx.core.makeRng(ctx.core.hashSeed('topgrowth:' + ctx.seed));
      for (let k = 0; k < 4200 && topClumps.length < 560; k++) {
        if (k % 400 === 399) await ctx.yield();
        const a = tg.range(0, 6.2832), pr = PIT.r + 1.5 + 62 * Math.pow(tg(), 1.6), x = X(PIT.x) + Math.cos(a) * pr, z = PIT.z + Math.sin(a) * pr, d = x - X(pathX(z)), y = terrain.heightAt(x, z);
        const roll = tg(), size = tg.range(0.45, 0.95) * 1.5, rot = tg.range(0, 6.28), sk = tg.range(-0.05, 0.25), seed = tg(), lean = tg.range(0, 0.3), shed = tg();
        if (y < HILL.top - 14 || Math.abs(d) < 2.5 || Math.hypot(x - X(DEAD.x), z - DEAD.z) < 7 || noise.n2(x / 13 + 310, z / 13 - 40) < -0.12 * (1 - sstep(PIT.r + 2, PIT.r + 16, pr))) continue;
        const tall = roll < 1 / 6 && Math.abs(d) > 9, pl = { x, y: terrain.surfaceAt(x, z) - 0.06, z, v: tall ? 1 : 3, s: tall ? size : lowSize(d, z, size), rot, sick: hillSick(y, sk), seed, lean };
        if (tall && Math.hypot(Math.max(0, Math.abs(d) - WIDE[1] * pl.s), Math.max(0, pathY(z) - pl.y - TALL[1] * pl.s)) < 6) { pl.v = 3; pl.s = lowSize(d, z, Math.min(size, 1.4)); }
        topClumps.push(pl); if (shed < 0.5) shedders.push(pl);
      } }
    // THE GROUND AT THE HILL'S FOOT: the hill's whole face toward the valley, from the flood's edge at its foot to
    // the pit's near bank and from side to side of the hill. Real things lie on it by a rule of the place alone:
    // tussocks of dry grass, stones, the dead stems of the weed with their shrunk pads (crimson low down, pink and
    // chalk higher), and the first pale flowers of the heath coming back (more of them the higher the ground).
    // They lie in drifts (a slow noise of the land, 23 m across), thickest along the flood's edge where the water
    // leaves its wrack (the first 2.5 m above it) and low on the slope, where what washes and blows down the hill
    // lodges, thinning with height; the cart track and the pit's bank are bare. Where the flood lies against the
    // hill's foot there is no band between two grounds: a ragged line of low clumps stands in the shallows and on
    // the first metres of the slope, round the whole of the foot that faces the valley. Two streams of their own.
    // THE ROAD DECIDES ONE THING HERE, a level of detail: of the things so dealt, those within NEAR_ROAD metres of
    // the road's line (measured across the valley) are given a mesh; the rest are dealt and not made. How thick
    // they lie never depends on the road. (The road's keep-clear has nothing to ask of the small things: the
    // tallest is 2.3 m and the road is nowhere less than 14 m above this ground. The clumps take the keep-low
    // that every low clump of this world takes, lowSize, unchanged.)
    const NEAR_ROAD = 60, footClumps = [], litter = [], dealt = { clumps: 0, litter: 0 };
    { const fc = ctx.core.makeRng(ctx.core.hashSeed('footclumps:' + ctx.seed)), lt = ctx.core.makeRng(ctx.core.hashSeed('hillfoot:' + ctx.seed)), rgb = (hex) => { const c = C(hex); return [c.r, c.g, c.b]; };
      for (let k = 0; k < 12000 && dealt.clumps < 700; k++) {
        const a = fc.range(-1.2, 1.2), r = HILL.r1 + fc.range(-9, 5), ux = HILL.x + Math.sin(a) * r, x = X(ux), z = HILL.z + Math.cos(a) * r, size = fc.range(0.5, 1.25), rot = fc.range(0, 6.28), sk = fc.range(-0.1, 0.25), seed = fc(), lean = fc.range(0, 0.2);
        if (k % 500 === 499) await ctx.yield();
        // only where the flood lies against the foot (35 m out from it the ground is under water)
        if (ground0(HILL.x + Math.sin(a) * (HILL.r1 + 35), HILL.z + Math.cos(a) * (HILL.r1 + 35)) > -0.05 || noise.n2(x / 5 + 31, z / 5 - 17) < -0.15 || Math.abs(ux - trackX(z)) < 2.2 || blocked(x, z, 2.5)) continue;
        dealt.clumps++;
        if (Math.abs(x - X(pathX(z))) > NEAR_ROAD) continue;
        const y = terrain.heightAt(x, z), wet = y < 0.05;
        footClumps.push({ x, y: wet ? 0.03 + 0.7 * map.sampleHum(x, z) : terrain.surfaceAt(x, z) - 0.06, z, v: 3, s: lowSize(x - X(pathX(z)), z, size), rot, sick: wet ? map.sampleSick(x, z) : hillSick(y, sk), seed, lean: wet ? 0 : lean });
      }
      await ctx.yield();
      const cTus = ['#cfc39a', '#b9b08a', '#d6c8a0'].map(rgb), cStone = ['#a09a90', '#8a857d', '#b8ae9c'].map(rgb), cPad = ['#8a3a42', '#c99aa0', '#d8cdbf'].map(rgb), cStem = rgb('#6a5a52'), cPetal = rgb('#efe9d6'), cStalk = rgb('#5e6a4a');
      for (let k = 0; k < 65000; k++) {
        if (k % 2000 === 1999) await ctx.yield();
        const ux = lt.range(HILL.x - HILL.r1, HILL.x + HILL.r1), z = lt.range(PIT.z + PIT.r + 9, HILL.z + HILL.r1 + 2), x = X(ux), roll = lt(), size = lt(), rot = lt.range(0, 6.28), seed = lt(), tone = lt(), gate = lt();
        const y = terrain.heightAt(x, z);
        if (y < 0.1 || Math.hypot(ux - HILL.x, z - HILL.z) > HILL.r1 || Math.hypot(ux - PIT.x, z - PIT.z) < PIT.r + 8 || Math.abs(ux - trackX(z)) < 1.7) continue;
        if (gate > (0.35 + 0.65 * sstep(-0.3, 0.3, noise.n2(x / 23 + 70, z / 23 - 20))) * (0.55 + 1.3 * (1 - sstep(0.2, 2.5, y)) + 0.7 * (1 - sstep(2, 26, y))) / 2.55) continue;
        dealt.litter++;
        if (Math.abs(x - X(pathX(z))) > NEAR_ROAD) continue;
        const up = sstep(1, 40, y), pStem = lerp(0.3, 0.12, up), pFlower = 0.03 + 0.12 * sstep(0.08, 0.5, up), kind = roll < 0.24 ? 1 : roll < 0.24 + pStem ? 2 : roll < 0.24 + pStem + pFlower ? 3 : 0, pick = Math.min(2, Math.floor(tone * 3));
        litter.push({ x, y: terrain.surfaceAt(x, z), z, k: kind, s: kind === 0 ? 0.6 + 0.8 * size : kind === 1 ? 0.25 + 0.9 * size * size : kind === 2 ? 0.7 + 0.8 * size : 1 + 0.8 * size, rot, seed,
          col: kind === 0 ? cTus[pick] : kind === 1 ? cStone[pick] : kind === 2 ? cStem : cPetal, col2: kind === 2 ? cPad[clamp(Math.floor(up * 4 + tone * 1.4), 0, 2)] : cStalk });
      } }
    const hillGrowth = await makeGrowth(ctx, U, { plants: hillPlants.concat(hillClumps, lowPlants, topClumps, footClumps), chunkZ: 96, cull: 290, ring: sheet.uniforms.uRing, shapes: growth.shapes });
    scene.add(hillGrowth.object);
    const footGround = await makeLitter(ctx, U, litter); scene.add(footGround.object);
    // the dead growth breaks up: flakes leave each bleached plant and go down the wind
    const crumble = makeCrumble(U, shedders, { per: 7, wind: [1.5 * MX, 0.45], heights: TALL }); scene.add(crumble.object);
    await ctx.yield();
    // elms and hedgerow oaks on the valley sides, thirty black pines on the hill (none on the route, by the pit
    // or within 26 m of the dead engine)
    { const pts = [];
      for (let k = 0; k < 400 && pts.length < 46; k++) { const x = R.sidetrees.range(-520, 560), z = R.sidetrees.range(120, -1250), y = ground0(x, z); if (y < 2.5 || y > 62 || Math.hypot(x - HILL.x, z - HILL.z) < HILL.r1 + 15) continue;
        if (noise.n2(x / 60 + 90, z / 60) < 0.05) continue; pts.push(withD({ x: X(x), y, z, s: R.sidetrees.range(0.8, 1.3), rot: R.sidetrees.range(0, 6.28), v: 0 })); }
      for (let k = 0; k < 500 && pts.length < 76; k++) { const a = R.hillpines.range(-0.5, 2.3), r = R.hillpines.range(48, 172), x = HILL.x + Math.cos(a) * r, z = HILL.z + Math.sin(a) * r * 0.9 + 15, y = ground0(x, z);
        if (y < 3 || Math.abs(x - pathX(z)) < 16 || Math.hypot(x - PIT.x, z - PIT.z) < PIT.r + 14 || Math.hypot(x - DEAD.x, z - DEAD.z) < 26) continue; pts.push(withD({ x: X(x), y, z, s: R.hillpines.range(0.7, 1.1), rot: R.hillpines.range(0, 6.28), v: 1 })); }
      const far = flora.makeScatter({ rng: trng.fork('elm'), points: pts, variants: [flora.oakGeometry({ rng: trng.fork('o'), detail: 0, height: 15, ...dark }), flora.pineGeometry({ rng: trng.fork('pi'), detail: 0, height: 15, leaf: '#1f2e20', leafLight: '#2c3f2c', leafDark: '#101810', bark: '#3c2e26' })],
        material: treeMat, tint: 0.08, hue: 0.02, sink: 0.02 });
      scene.add(far.object); }
    await ctx.yield();
    // the skiff is adrift: it turns slowly from wherever it lay, and yaws on a slow swell
    const skiffTurn = srng.range(0, 6.2832), skiffSwell = srng.range(0, 6.2832);
    // where the wheels, the pit's breathing and the striding hood's glancing about are in their rounds when we arrive
    const wheel0 = R.clocks.range(0, 6.2832), cart0 = R.clocks.range(0, 6.2832), cart1 = R.clocks.range(0, 6.2832), pit0 = R.clocks.range(0, 6.2832), hoodSeed = R.clocks.range(0, 9);
    // in the early weeks two more engines wade the open flood: each from a seeded stand 150 to 230 m from the
    // valley's axis, heading up the valley, on a line that keeps to the flood for its whole walk (two fifths of the
    // striding engine's), and at least 80 m from the other
    const farEngines = [], FARWALK = 0.4;
    if (early) for (let n = 0; n < 2; n++) for (let tries = 0; tries < 24; tries++) {
      const side = erng() < 0.5 ? -1 : 1, x0 = side * erng.range(150, 230), z0 = erng.range(-300, -520), d = new THREE.Vector2(side * erng.range(0, 0.12), -1).normalize(), g0 = erng(), look = erng.range(0, 9);
      let ok = farEngines.every((f) => Math.hypot(f.x0 - x0, f.z0 - z0) > 80);
      for (let s = -20; s <= FARWALK * LINE + 20 && ok; s += 20) ok = ground0(x0 + d.x * s, z0 + d.y * s) < -0.3;
      if (!ok) continue;
      const e = kit.make({ origin: [X(x0), 0, z0], dir: [MX * d.x, d.y], cycleT: cycleT / FARWALK, dim: 0.9 }); scene.add(e.object); farEngines.push({ e, g0, look, x0, z0 }); break;
    }
    await ctx.yield();
    // the curtains: from the bridge, round the tower where the growth stops, from the eaves by the water
    const curtainList = hangs.map((h) => [X(h[0]), h[1], h[2], h[3], MX * h[4], h[5], h[6]]);
    for (let k = 0; k < 4; k++) { const c = Math.round(Math.cos(k * Math.PI / 2)), s = Math.round(Math.sin(k * Math.PI / 2));
      for (let i = 0; i < 6; i++) { const e = crng.range(-3, 3); curtainList.push([X(CHURCH.x + c * 3.38 - s * e), crng.range(6.2, 8.4), CHURCH.z + s * 3.38 + c * e, crng.range(2.2, 5), MX * c, s, crng.range(0.5, 0.9)]); } }
    { const v = new THREE.Vector3(), nn = new THREE.Vector3();
      for (const hz of [houses[0], houses[1], houses[3], houses[4], houses[houses.length - 1], mill.main]) for (const s of [1, -1]) for (let i = 0; i < 4; i++) {
        v.set(crng.range(-hz.hx, hz.hx), hz.h - 0.25, s * (hz.hz + 0.4)).applyMatrix4(hz.m); nn.set(0, 0, s).transformDirection(hz.m);
        curtainList.push([X(v.x), v.y, v.z, Math.min(hz.h, crng.range(1.8, 4.2)), MX * nn.x, nn.z, crng.range(0.5, 0.85)]);
      } }
    const curtains = makeCurtains(U, curtainList, { sick: late ? 0.52 : early ? 0 : 0.3, phase: PH.curtain });
    scene.add(curtains.object);
    await ctx.yield();
    // the pools the swans and moorhens keep to: open water beside the route. NO POOL WHERE A FOOT SWINGS: the
    // willows' test again (a bird on its round reaches its pool's radius, and 0.9 m more, a swan's length from its
    // middle to its bill, from the pool's middle)
    const BIRD = 0.9, inWalk = (x, z, r) => onEngineWalk(z) && engineLineD(MX * x, z) < TRACK + FOOT_R + r + BIRD;
    const pools = [];
    for (let k = 0; k < 2400 && pools.length < 7; k++) {
      const z = qrng.range(-70, -700), x = X(pathX(z)) + (qrng() < 0.5 ? -1 : 1) * qrng.range(5, 32); let r = pools.length ? qrng.range(2, 4.5) : 5.5, ok = false;
      for (; r > (pools.length ? 1.4 : 4); r *= 0.8) { ok = map.sampleMat(x, z) < 0.3; for (let i = 0; i < 10 && ok; i++) ok = map.sampleMat(x + Math.cos(i * 0.628) * (r + 0.8), z + Math.sin(i * 0.628) * (r + 0.8)) < 0.36; if (ok) break; }
      if (ok && !inWalk(x, z, r) && pools.every((p) => Math.hypot(p.x - x, p.z - z) > 30)) pools.push({ x, z, r, w: (qrng() < 0.5 ? -1 : 1) * qrng.range(0.35, 0.6) / r, a: qrng.range(0, 6.28) });
    }
    // the fall-back pools (none is needed on most deals): 9 m right of the route, every 60 m, as before; one that
    // would lie in the engine's walk or on land is tried 9 m left, 20 m right and left, then 9 m further on, until clear
    while (pools.length < 7) { const n = pools.length; let x = 0, z = 0, ok = false;
      for (let j = 0; j < 160 && !ok; j++) { z = -200 - n * 60 - 9 * Math.floor(j / 4); x = X(pathX(z)) + [9, -9, 20, -20][j % 4]; ok = !inWalk(x, z, 1.5) && ground0(MX * x, z) < -0.3; }
      pools.push({ x, z, r: 1.5, w: 0.3, a: PH.pool + 2.4 * n }); }
    const birdPool = [0, 0, 1, 2, 3, 4, 5, 6];                 // the two swans keep together
    await ctx.yield();

    // ---------------------------------------------------------------- the gaze
    const poiA = new THREE.Vector3(), poiB = new THREE.Vector3(0, 5.45, -0.4).applyMatrix4(hoodM), inkTop = inkHeaps.reduce((a, b) => (b[2] > a[2] ? b : a)), poiC = new THREE.Vector3(X(SMOKE.x) + inkTop[0], 11 + 0.5 * inkTop[2], SMOKE.z + inkTop[1]);      // the bank's highest heap
    const pois = [
      // the striding engine, from where the eye comes out from under the bridge until we are under it at the crossing
      { at: (t, u) => poiA.copy(engO).addScaledVector(strider.E.F, walked(u)).setY(SZ.H0 + 2), from: uBridgeFar, to: uPass, weight: 0.5 },
      // the black smoke's highest heap, from the first poplar to the hill's foot
      { at: poiC, from: uPoplar0, to: uFoot, weight: 0.3 },
      // the dead engine's hood, from the hill's foot to the brow
      { at: poiB, from: uFoot, to: uBrow, weight: 0.35 },
    ];

    const here = new THREE.Vector3(), ctl = { hoodYaw: 0, hoodTip: 0, raise: 0, aim: aimWood }, fctl = { hoodYaw: 0, hoodTip: 0, raise: 0 };
    const smokeGlow = dome.uniforms.uSmoke.value.w, fireGlow = U.uFire.value.w, PI2 = Math.PI * 2;
    // ---------------------------------------------------------------- 4. update
    function update(dt, t, camera, u) {
      U.uTime.value = t; time.value = t;
      // the striding engine: its place and every joint follow from the metres it has walked, and those from u;
      // the roll and the lift of its gait come in over its first step
      const eW = walked(u), g = (eW - phi) / SZ.stride, w = sstep(0, third, eW - walked0);
      // where we are: the route's own point at u (what happens at a place follows the flight, never the lens)
      path.pointAt(clamp(u, 0, 1), here); const hx = here.x, hy = here.y, hz = here.z;
      // the eye itself (read from the matrix), used only to stand the far wood's smoke on the sky over its fire
      const cm = camera.matrixWorld.elements, cx = cm[12], cz = cm[14];
      // the hood comes round to look back down the river from when we are one stride behind its rear foot's reach; it
      // is furthest round when we come level with the furthest reach of its rear foot, and looks ahead again when
      // we are under the body (behind: metres of its own line between it and us; one turn there and back)
      const eF = strider.E.F, behind = (hx - engO.x - eF.x * eW) * eF.x + (hz - engO.z - eF.z * eW) * eF.z;
      const rear = MAKE.fa[2] - third, back = sstep(rear - SZ.stride, rear, behind) * (1 - sstep(rear, 0, behind));
      ctl.hoodYaw = lerp(hoodLook(t, hoodSeed), Math.PI * 0.94 * MX, back);
      // the case comes up as the engine passes the mill, is highest midway between the mill and the church tower
      // and is down again abreast of the tower (caseT: its place between the two, 0 to 1)
      const caseT = (eW - sMill) / (sTower - sMill);
      ctl.raise = sstep(0, 0.5, caseT) * (1 - sstep(0.5, 1, caseT));
      strider.walk(g, w, ctl);
      const SU = sheet.uniforms, ev = strider.events;
      for (let i = 0; i < 8; i++) SU.uRing.value[i].set(ev[i * 4], ev[i * 4 + 1], ev[i * 4 + 2], ev[i * 4 + 3] * w);
      const J = strider.joints; for (let i = 0; i < 12; i++) SU.uJ.value[i].set(J[i * 3], J[i * 3 + 1], J[i * 3 + 2]);
      const B = strider.state.body, fwd = strider.E.F;
      SU.uBlob.value[0].set(B.x, B.y + 2.6, B.z, 4.9); SU.uBlob.value[1].set(B.x, B.y + 8.3, B.z, 3.0); SU.uBlob.value[2].set(B.x - fwd.x * 6.3, B.y + 2.2, B.z - fwd.z * 6.3, 3.3);
      for (const f of farEngines) { fctl.hoodYaw = hoodLook(t, f.look); f.e.walk(f.g0 + (FARWALK * (eW - walked0)) / SZ.stride, w, fctl); }
      // the far wood catches along the engine's walk while the case is up; its smoke and the valley take the glow
      const caught = sstep(0.25, 1, caseT);
      fire.uniforms.uU.value = eW; dome.uniforms.uSmoke.value.w = smokeGlow * (1 + 0.4 * caught); U.uFire.value.w = fireGlow * (1 + 0.6 * caught);
      // the wood's smoke stands on the horizon where the eye sees the burning end of the wood, and trails off to its far bearing
      { const a0 = Math.atan2(X(FIRE.x) - cx, cz - woodZ(FIRE.x)), sm = dome.uniforms.uSmoke.value; sm.x = a0; sm.y = ((FIRE.far - a0 + Math.PI * 3) % PI2) - Math.PI; }
      // the green star falls while we fly from abreast of the last poplar to abreast of the dead elm (our place
      // up the valley on the route); on the rare evening its glow stands
      // behind the hill from its landing until we reach the hill's foot
      const sT = (zPoplarN - hz) / (zPoplarN - ELMS[2][1]); star.uniforms.uT.value = sT; star.uniforms.uFlash.value = rare ? sstep(0.9, 1.0, sT) * (1 - sstep(-ELMS[2][1], -(HILL.z + HILL.r1), -hz)) : 0;
      perched.uniforms.uLift.value = sstep(119, 62, Math.hypot(hx - hoodTop.x, hy - hoodTop.y, hz - hoodTop.z));      // they go up as we come within a hundred metres
      // what turns and drifts on the world's clock
      millWheel.rotation.z = wheel0 + t * 0.42; cartWheel.rotation.z = cart0 + 0.2 * t + 0.4 * Math.sin(0.47 * t + cart1);
      skiff.rotation.set(0.02 * Math.sin(t * 0.8 + PH.pitch), skiffTurn + 0.05 * t + 0.35 * Math.sin(0.13 * t + skiffSwell), 0.035 * Math.sin(t * 1.1 + PH.roll)); skiff.position.y = 0.03 + 0.025 * Math.sin(t * 1.3 + PH.bob);
      for (let i = 0; i < 8; i++) { const p = pools[birdPool[i]], a = p.a + p.w * t - (i === 1 ? 0.5 : 0), sg = Math.sign(p.w); SU.uWake.value[i].set(p.x + Math.cos(a) * p.r, p.z + Math.sin(a) * p.r, -Math.sin(a) * sg, Math.cos(a) * sg); }
      pitLight.intensity = 2.4 * (0.8 + 0.2 * Math.sin(t * 0.7 + pit0));
      // midges hang over the water; the flakes are in the air where the weed under us is dying
      midges.setOpacity(1 - sstep(0.4, 4.5, terrain.heightAt(hx, hz)));
      flakes.setOpacity(0.9 * sstep(0.3, 0.6, (map.sampleSick(hx, hz) + map.sampleSick(hx, hz - 35) + map.sampleSick(hx, hz - 70)) / 3));
      growth.update(camera); hillGrowth.update(camera); flora.updateWind(wind, t); fauna.update(dt, t, camera, u); set.update(dt, t, camera);
    }
    { const cam0 = new THREE.PerspectiveCamera(62, 16 / 9, 0.3, 6000); cam0.position.copy(path.pointAt(0, new THREE.Vector3())); cam0.updateMatrixWorld(); update(0, 0, cam0, 0); }

    return {
      scene, path, duration: DUR,
      // slower from abreast of the tower (easing in over 60 m) until the crossing; quicker over the open water
      // from the first poplar to the dead elm, easing back by the hill's foot; slower again up the hill's face,
      // from its foot to where the route levels over the pit's near rim (easing in and out over 60 m)
      pace: (u) => 1 - 0.2 * sstep(uTower, uTower + M(60), u) * (1 - sstep(uPass, uPoplar0, u)) + 0.15 * sstep(uPass, uPoplar0, u) * (1 - sstep(uElm, uFoot, u)) - 0.28 * sstep(uFoot, uFoot + M(60), u) * (1 - sstep(uLevel - M(60), uLevel, u)),
      camera: { fov: 62, near: 0.3, far: 6000, lookAhead: 24, sway: 0.8, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#BFE8C8', glow: 0.8, revealDistance: 420 },
      post: { exposure: hour.exposure, bloom: { strength: 0.5, radius: 0.6, threshold: 0.9 }, grade: { saturation: 1.06, contrast: 1.05, shadowTint: '#070B18', vignette: 0.3, grain: 0.02 } },
      update,
      dispose() {},
    };
  },
};
