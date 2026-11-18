// The Standing Wave: an alpine ridge seen by colour-schlieren optics.
// WHAT THE PICTURE RESTS ON (fix round 1): (1) the reveal is ONE figure: from the climb to the col until we are under the lip
// only the part's ruleSection is ruled east of the ridge (ten nested hooked streamlines in the plane of the Horn, from a flow
// of its own low enough to stand inside the frame), the eye is held on it by a solved poi, and the hoops of the barrel, the
// hero's lenses and the birds' threads come in (uBarrel, uThread) as we dive under it; (2) washes never mix: every marbled
// air claims its pixels (see SW_STRONG in the part), prints at full ink (hard) and stops the hairs; (3) the entry comes in
// level above the pines, climbs a little and looks up, so black is a third of the frame and the hut, plume and lenses stand
// on field. Rock, trees, hut, ibex and birds are flat black
// cut-outs with one hair of fringe; the air is the only subject, printed amber where its density rises downwind and
// ultramarine where it falls, on an even jade field. Everything comes from one makeStyle() instance (src/parts).
// POLISH ROUND (fix 5): the bird we follow is small and FLIES (buildRide: a course in the eye's frame, banking, flapping in bursts,
// below the frame at the col and the ring); the route comes in climbing from above the knoll, the saddle is 35 m lower and the hut
// stands 95 m ahead, so the land is under a quarter of the frame to the col and the level view through the previous portal holds
// the whole plume; no solid of the cirque wears a hair (trees, tufts, boulders, hut, pole, ibex, crag, our bird); from the col the
// sheet just overhead is ruled next to the eye (buildRails a).
// POLISH ROUND 6 (outside reviewers' twelve stills): the windward land is ruled in profile hairs by the knife-edge rule
// (buildGroundHairs) instead of one black mass; the field is graded (the part's makeField, uGrade); the bird we follow has a range
// as well as a place and leaves the frame four times (buildRide FLIGHT); the reveal has a near layer and a far train
// (buildOverhead: six hairs of the sheet 45 m overhead in long streaking dashes, three low round crests receding under the lens).
// POLISH ROUND 8 (outside reviewers' twelve stills again): a thermal's claim is the column's own shape and is given up with its hairs
// (the wide square claims were the 'pale rectangle' in the strata; the dust rings are gone); a grove of broad columns on the upper
// face and the bird near once, far once, out once (buildWarmFace GROVE, buildRide FLIGHT); the lee land and the Horn ruled in profile
// hairs with pines along the crest (buildLeeHairs, buildCirque); THE BARREL DOWN ITS LENGTH: the hook's section repeated six times
// north of the Horn's plane, nested in true perspective (buildBarrel d), the plunge claiming its pixels, the eye turned up the face
// at u 0.79 (finish pocketAt); every barrel bird a swept chevron showing its plan (planToEye; the part's choughGeometry, birdPlan,
// birdMin), strokes only on the near tier; the rotor's cells ruled as nested closed hairs (the part's marbleMaterial o.lines).
// ROUND 9 (the same reviewers; four pictures changed): THE LOOK UP THE FACE at u 0.79 is one family of hairs in true perspective
// (buildFace: rails of the nearest sheet 7 m apart, a claim of the face's own in front of everything behind it, its lenses and its
// flock in four tiers; finish pocketAt turns the eye by direction, 68 degrees east of north and 35 up); the barrel's sections each
// claim their pixels in order of range (buildBarrel CLM), so no family is ruled across another; INSIDE THE THERMAL at u 0.25 is a ring
// of hairs round the route (buildWarmFace RING: amber north, ultramarine south, open toward the lenses, a wall claim), the columns
// claim by range too (THERMAL_CLAIM) and are put away whole before the lane's hairs thin (uThm); the sheet overhead is whole by u 0.447
// and the eye is on the hook by 0.46 (finish WL); the lee country carries profile hairs to 10 km (buildLeeHairs); the trench under the
// climb is meshed at 3.75 m so floor hairs cross it as curves; the crag is plain black at every range; the sailplane and the big birds
// show their plan; the breaths are closed hairs like the rotor (the part's o.lines, now the weight of every other hair).
// NORTH IS -Z here (see the part's header): ridge along x 0, col at the origin, the Horn at z -1400, the ring at (150, 250, -420).
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeStyle, makeFlow, buildHero, choughGeometry } from '../parts/standing-wave-schlieren.js';

const TAU = Math.PI * 2;
// the hanging cirque's floor, metres above the flow's datum: high enough that the ridge is a low black band from the entry
// and the field, the pines' tops and the plume share the horizon line
const FLOOR = 80, HUT_X = -548, HUT_Z = -28, KNOLL_H = 60, HUT_S = 1.3, RING_R = 8.5;   // (round 7) the hut stands 80 m ahead and 26 degrees left of the eye at u 0.08, on a knoll whose top is at the eye's height there: the gable is cut out against the field   // the ring's hole is 17 m: at 14 m it was a dot until the last seconds
const DARK_GAIN = 0.75;
// two shoulders of raised ground beside the first hundred metres (left beyond the hut, right of the path): the close pines stand
// on them, so their spires cut the skyline in the left and right quarters of the first frame and slide past in the first ten seconds
const SHOULDERS = [[-632, -46, 24], [-565, 42, 105]], SHOULDER_H = 46;   // [x, z, half-length]: 20 m left of the line of flight before the hut, 23 m right of it all the way to the hut
const THERMAL_CLAIM = (g) => 0.9999972 + g * 4e-7;   // the claim depth of a thermal by its range from the route (0 nearest); the strata are tested behind them all
const THREAD_DIR = [0.62, 0.78, 0.86, 0.5];   // every bird's pair of hairs streams the same way: up the rising air and over (start and end tangents, x and y)
const EVENT_ROW = [0.3, 0.82, 1.1, 0.5];   // the billows' row seen from the foot of the face: azimuth right of north and elevation (radians), first roll to last
// colourways: [field, black, rising ink, falling ink, fringe, rim of the mirror]
const WAYS = {
  jade: ['#BFE3CF', '#050608', '#F2A33A', '#2438B8', '#EAF7EE', '#4F8F7C'],
  rose: ['#E4D6D2', '#060506', '#E24A2A', '#007487', '#F8EEEB', '#8E7073'],
  dark: ['#0B1512', '#010202', '#F2A33A', '#4664FF', '#EAF7EE', '#040807'],
};
const WEATHER = {
  // fig: the height of the FIGURE of the wave ruled for the reveal (the part's ruleSection, a flow of its own). The wave the
  // birds ride stands 60 degrees over the col and can never be seen whole; the figure's outermost streamline tops out 48
  // degrees up, inside the frame, so that from the col the Standing Wave is one shape on blank field.
  light: { tall: 0.62, fig: 0.46, lenses: 1, rotor: 0.75, birds: 0.7, name: 'light wind' },
  gale: { tall: undefined, fig: 0.64, lenses: 3, rotor: 1, birds: 1, name: 'gale' },
  storm: { tall: 1.08, fig: 0.7, lenses: 5, rotor: 1.1, birds: 0.9, name: 'storm flow' },   // (round 6) rotor 1.4 put the eye inside its shells: cells seen at a grazing angle printed straight-sided slabs
};

// the hut's knoll and the two shoulders as shapes 0..1 (terrain and the ground's hairs both read them)
const _bump = (v, c, w) => { const t = (v - c) / w; return Math.exp(-t * t); };
const knollK = (x, z) => _bump(x, HUT_X, 38) * Math.exp(-Math.pow((z - HUT_Z) / 30, 4));
const shoulderK = (x, z) => _bump(x, SHOULDERS[0][0], SHOULDERS[0][2] + 8) * _bump(z, SHOULDERS[0][1], 15) + _bump(x, SHOULDERS[1][0], SHOULDERS[1][2]) * _bump(z, SHOULDERS[1][1] + 5, 20);

export default {
  id: 'standing-wave-schlieren',
  name: 'The Standing Wave',
  category: 'sky',
  weirdness: 0.55,
  media: ['air'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const look = ctx.rng.fork('look');
    // ---- the seeded look: colourway, weather, heat, cast ------------------------------------------
    const wv = look(), way = vary.hour === 'night' ? 'dark' : ((wv >= 0.27 && wv < 0.4) || wv >= 0.8 ? 'rose' : 'jade');
    const wr = look(), weather = wr < 0.52 ? 'gale' : (wr < 0.7 || wr >= 0.935) ? 'storm' : 'light', WX = WEATHER[weather];
    const cr = look(), cast = cr >= 0.8 ? 'sailplane' : (cr >= 0.2 && cr < 0.5) ? 'lammergeiers' : 'choughs';
    const heat = vary.hour === 'dawn' ? 0 : vary.hour === 'golden' ? 1.7 : lerp(0.8, 1.25, look());
    const rare = !!vary.rare;
    const dark = way === 'dark';
    const POST = { exposure: 1, saturation: 1.05, contrast: 1.04 };
    const style = makeStyle(ctx, { palette: WAYS[way], grade: POST, bloomSafe: false, fringePx: dark ? 2.1 : 1.5 });
    const U = style.uniforms;
    if (dark) {   // dark-field: the solver in makeStyle is made for light inks; set the bottle-black field by hand and thin the washes
      style.palette.field.set(WAYS.dark[0]).multiplyScalar(DARK_GAIN); style.palette.rim.set(WAYS.dark[5]).multiplyScalar(DARK_GAIN); U.uAlphaCap.value = 0.3;
    } else U.uAlphaCap.value = 1;
    if (U.uGrade) U.uGrade.value.set(dark ? 0.005 : way === 'jade' ? 0.17 : 0.24   /* (round 7) rose took 0.36 of the rising ink low down: a sunset band along the skyline, the one place the picture looked like a sky */, dark ? 0.01 : way === 'jade' ? 0.3 : 0.36, dark ? 0.15 : 0.42);   // (dark-field: the inks are a hundred times brighter than the bottle-black field, a hundredth is a tint)   // (jade takes less of the rising ink: amber over jade is sand)   // (round 6) the graded field: see makeField in the part   // a wash is one clean ink or nothing: thin amber over the field prints sand, a fifth colour
    const W = { scene, style, vary, detail, density, way, weather, WX, cast, heat, rare, dark, tick: [], disposables: [] };
    W.field = style.makeField(5000); scene.add(W.field);
    await ctx.yield();

    // ---- the hero: sheets, rotor, lenses, ring, flock (the Horn and all rock are this file's terrain) ---
    const flow = makeFlow(ctx.rng, ctx.noise, { tall: WX.tall, swellWidth: 860 });
    const fig = makeFlow(makeRng(Math.floor(flow.nz0 * 1e6) + 7), ctx.noise, { tall: WX.fig, lean: 1, swellWidth: 860 });   // the figure of the reveal (see WEATHER)
    const hero = await buildHero(ctx, {
      style, flow, detail, field: false, horn: false, lenses: 0   /* (round 7) the hero's lenses, 1.2 km long north to south, were seen end-on from the climb: a leaf across the arcs, cut by the top edge. The world hangs its own (buildCirque for the reveal, buildBarrel for the ring) */, rotor: WX.rotor,
      birds: Math.round(100 * WX.birds * clamp(density, 0.75, 1.12)), fill: 0, line: 0.85, westFade: [60, 130]   /* (round 7) the flick the section left at the summit crossed the comb of buildBarrel: the hero rules nothing west of the summit */, gapPx: 40, graze: [0.05, 0.3], sheetFar: [70, 240], ringPos: [215, 250, -420],
      sheetKeep: [], lensBarrel: true, laneNear: 26, laneZ: [-140, 140], laneEnd: flow.IDX.at[8], threadDir: THREAD_DIR, threadLen: [9, 18], lensShift: [1000, 300, 0], rotorMin: 95, rotorLump: 1, rotorEdge: 0.9, rotorLines: 1   /* (round 8) the roll's cells are ruled as nested hairs, not printed as slabs */, birdMin: 0.017, birdPlan: 0.55, birdThreads: false   /* (round 8) the far flock: small clean birds showing their plan, no strokes */, ringHole: RING_R * 2, ringTube: 1.8, ruleSection: { flow: fig, lines: 14, gap: 32, first: 24, train: [] }   /* (round 6) trainFar, the pulse trace, is gone: the world rules the train itself (buildOverhead) */, rulePlan: [],   // (fix 3) the lane's hairs and the hoops' windward ends are no longer ruled: they were the kinked scratches and stray arcs of the climb; the world rules its own families (buildStrata, buildRails)
    });
    scene.add(hero.object);
    W.heroFlock = hero.object.getObjectByName('choughs'); if (W.heroFlock) W.heroFlock.userData.hull.visible = dark;   // (round 7) far birds printed white ticks wider than their black
    W.hero = hero; W.flow = flow; W.fig = fig;
    await ctx.yield();

    // ---- the path: east across the cirque, up the warm face, over the col, dive, north along the foot, up into the ring
    const A = hero.anchors, F = A.flyThrough, seat = A.portalSeat;
    const end = seat.position.clone(), dir = seat.direction.clone();
    const pts = [
      [-720, FLOOR + 52, 8], [-706, FLOOR + 56.4, 8], [-690, FLOOR + 60.8, 8], [-668, FLOOR + 64.5, 8], [-640, FLOOR + 66, 7], [-600, FLOOR + 65, 7], [-545, FLOOR + 59, 5], [-470, FLOOR + 49, 2],   /* (polish round) the route comes in CLIMBING at 17 degrees: the engine's first gaze is the route's own direction, so the first frames look up and the land is the bottom quarter; the entry point stands above the knoll and the shoulders, so the level view through the previous portal has its skyline at mid-height and the whole plume inside the disc */ [-360, 118, 0], [-270, 113.5, 0], [-188, 112.5, 0], [-118, 114, 0],   // in level above the tallest pines (the engine brings the eye in level: seen through the portal the forest is one black band under the field), then a short climb that lifts the gaze, and a long glide down to the face
      F[0], F[1], F[2], F[3],
      F[4].clone().add(new THREE.Vector3(26, 10, 0)), F[5].clone().add(new THREE.Vector3(34, 16, 0)), F[5].clone().add(new THREE.Vector3(34, 16, 0)).lerp(end.clone().addScaledVector(dir, -105), 0.55).add(new THREE.Vector3(0, -5, 0)),   // straight on to the foot of the climb (the old point swung the ring across the frame)
      end.clone().addScaledVector(dir, -105), end.clone().addScaledVector(dir, -70), end.clone().addScaledVector(dir, -35), end,
    ];
    const path = makePath(pts);
    W.path = path; W.end = end; W.dir = dir;
    // The line as flown from u0 to u1, half a metre apart (x, y, z after one another): what a bird that wanders is kept off.
    W.flown = (u0, u1) => { const o = [], q = new THREE.Vector3(); for (let d = u0 * path.length; d <= u1 * path.length; d += 0.5) { path.posAtDist(d, q); o.push(q.x, q.y, q.z); } return o; };
    // No bird of the hero's far flock in the lane of the course. The hero keeps its birds off its own camera line, but this course
    // leaves that line by tens of metres north along the foot, so some seeds dealt a bird across the lens. The hero stands unturned at
    // the origin, so the line is in its frame as it is; it runs from where update first shows the flock (uCol - 0.12) to the ring.
    await ctx.yield();
    hero.keepBirdsOff(W.flown(Math.max(path.nearestXZ(0, 0).u - 0.12, 0), 1));
    await ctx.yield();
    style.setClearing(end.clone().addScaledVector(dir, -120), end.clone().addScaledVector(dir, 1700), 62, 900);   // a ring's width of blank field round the ring, all the way up the climb

    await buildTerrain(ctx, W);
    await buildCirque(ctx, W);
    await buildWarmFace(ctx, W);
    await buildGroundHairs(ctx, W);   // (after the crag: its slopes are ruled too)
    await buildLeeHairs(ctx, W);
    await buildStrata(ctx, W);
    await buildRails(ctx, W);
    await buildOverhead(ctx, W);
    await buildBarrel(ctx, W);
    await buildFace(ctx, W);
    await buildRide(ctx, W);
    await buildCast(ctx, W);
    await buildEvent(ctx, W);
    await ctx.yield();
    return finish(ctx, W);
  },
};

// ---------------------------------------------------------------------------------------------
// TERRAIN: one black heightfield (ridge, col, cirque walls, lee valley, the hooked Horn), carved under the path.
// ---------------------------------------------------------------------------------------------
async function buildTerrain(ctx, W) {
  const { flow, path, style, scene } = W, noise = ctx.noise, hz = flow.hornZ;
  let top = -1e9; for (let dx = -40; dx <= 40; dx += 8) for (let dz = -40; dz <= 40; dz += 8) top = Math.max(top, flow.groundY(dx, hz + dz));
  W.hornTop = new THREE.Vector3(70, top, hz + 18); W.hookAt = (x, y, z) => { const t = clamp((y - 250) / Math.max(top - 250, 1), 0, 1), nr = Math.exp(-Math.pow((z - hz) / 900, 2)); return [x + 95 * t * t * t * nr, y, z + 18 * t * t * nr]; };   // where a point of the grid stands once the Horn is hooked
  const bump = (v, c, w) => { const t = (v - c) / w; return Math.exp(-t * t); };
  // raw ground: the flow's ridge + cirque arms + far lee hills
  const raw = (x, z) => {
    let y = flow.groundY(x, z);
    {   // a broad saddle either side of the col, so the field shows over the ridge from the cirque
      const az = Math.abs(z), cut = 138 * smoothstep(26, 170, az) * (1 - smoothstep(520, 1050, az)) + 30 * smoothstep(40, 260, az) * (1 - smoothstep(700, 1100, az));
      const wx = x < 0 ? 1 - smoothstep(0, 1, Math.pow(clamp(-x / 520, 0, 1), 0.8)) : 1 - smoothstep(0, 1, Math.pow(clamp(x / 950, 0, 1), 0.75));
      y -= cut * wx;
      y -= 35 * smoothstep(30, 190, az) * (1 - smoothstep(560, 1100, az)) * wx;   // (polish round) the saddle 35 m lower: its crest stood 45 m over the entry point, and the level view through the previous portal was 56 percent black
      // and the saddle's own crest is smooth and low (its jags stood 30 m over the eye at the entry): the skyline sits at eye level
      y -= 46 * noise.ridged2(z / 210 + flow.nz0, 3.1, 3) * smoothstep(40, 260, az) * 0.75 * (1 - smoothstep(300, 620, az)) * (x < 0 ? wx : 1 - smoothstep(0, 140, x));
      // the crest's creases run down the lee as sharp spurs, each of which would catch a fringe line beside the bird: smooth them there
      if (x > 0) y -= 46 * noise.ridged2(z / 210 + flow.nz0, 3.1, 3) * smoothstep(40, 260, az) * wx * smoothstep(10, 160, x) * 0.9;
    }
    if (x < 0) { const fl = FLOOR + 9 * smoothstep(-760, -260, x) + 3.5 * noise.fbm2(x / 90 + 2, z / 90, 2) + KNOLL_H * knollK(x, z) + SHOULDER_H * shoulderK(x, z);   /* (15 m wide at least: the terrain grid is 15 m) */ if (y < fl) y = fl; }   // the hut's knoll: its top stands at the eye's height, so the hut is cut out against the field
    if (x < -150) {
      const rc = Math.hypot((x + 770) / 1.2, z);
      const arm = smoothstep(330, 800, rc) * smoothstep(-150, -420, x);
      y += arm * (20 + 75 * noise.ridged2(x / 330 + 3.3, z / 330 + 8.1, 3));
    }
    // the lee country keeps falling downwind (its far edge lies 15 degrees under the eye at the col), with low foothills on it
    if (x > 900) { const t = x - 900; y -= 0.23 * t * smoothstep(0, 1600, t); y += smoothstep(1300, 4300, x) * (30 + 300 * noise.ridged2(x / 2900 + 1.7, z / 2900 + 4.2, 1) * (0.55 + 0.45 * Math.sin(x / 1300))); }
    return y;
  };
  // carved: nothing within ~7 m of the path
  const NC = 150, cpx = new Float32Array(NC), cpy = new Float32Array(NC), cpz = new Float32Array(NC), cv = new Float32Array(NC), _c = new THREE.Vector3();
  for (let k = 0; k < NC; k++) { path.pointAt(k / (NC - 1), _c); cpx[k] = _c.x; cpy[k] = _c.y; cpz[k] = _c.z; }
  const ground = (x, z) => {
    let y = raw(x, z);
    if (x > -840 && x < 380 && z > -520 && z < 90) {
      // the ceiling under the path: a soft minimum over samples of the whole route (the single nearest point jumps where the
      // route bends, which cut dead-straight cliffs radiating from the turn, each catching a fringe hair)
      let mn = 1e9; for (let k = 0; k < NC; k++) { const dx = x - cpx[k], dz = z - cpz[k], d = Math.sqrt(dx * dx + dz * dz), v = cpy[k] - 9.5 + Math.pow(Math.max(0, d - 6), 1.5) * 0.14; cv[k] = v; if (v < mn) mn = v; }
      let sm = 0; for (let k = 0; k < NC; k++) { const e = (cv[k] - mn) / 5; if (e < 12) sm += Math.exp(-e); }
      const lim = mn - 5 * Math.log(sm) + 5 * Math.log(2.2);
      { const k = 16, h = clamp(0.5 + 0.5 * (y - lim) / k, 0, 1); y = lerp(y, lim, h) - k * h * (1 - h); }   // a smooth minimum: no crease for the fringe to catch
    }
    return y;
  };
  W.rawGround = raw;
  const axis = (a, b, f) => { const out = []; let v = a; while (v < b) { out.push(v); v += f(v); } out.push(b); return out; };
  const xs = axis(-1500, 2500, (x) => (x > -730 && x < 420 ? 15 : x < -730 ? 40 : lerp(26, 60, smoothstep(420, 1600, x))));
  const zs = axis(-3200, 1700, (z) => (z > -36 && z < 36 ? 3.75 : z > -530 && z < 110 ? 15 : z <= -530 && z > -2150 ? 27 : 52));   // (round 9) 3.75 m rows under the climb (the route runs along z 0 to the col): on 15 m rows the trench carved under the path was a faceted V and every floor hair crossing it a chevron (the frame through the portal). It is the smooth trough it was carved as, and the hairs cross it as curves.
  const nx = xs.length, nz = zs.length, pos = new Float32Array(nx * nz * 3), nor = new Float32Array(nx * nz * 3);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const x = xs[i], z = zs[j], y = ground(x, z), o = (j * nx + i) * 3;
      const t = clamp((y - 250) / Math.max(top - 250, 1), 0, 1), near = bump(z, hz, 900);     // the hook: the tip leans downwind
      pos[o] = x + 95 * t * t * t * near; pos[o + 1] = y; pos[o + 2] = z + 18 * t * t * near;
    }
    if (j % 6 === 5) await ctx.yield();
  }
  const idx = new Uint32Array((nx - 1) * (nz - 1) * 6); let n = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d; }
  await ctx.yield();
  gridNormals(pos, nor, nx, nz, 0, nz); await ctx.yield();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  const landFr = style.fringeMaterial({ near: [150, 520], low: [300, 460] }); landFr.polygonOffset = true; landFr.polygonOffsetFactor = 4; landFr.polygonOffsetUnits = 8;   /* (polish round) where the hull has no width it lies exactly on the land's own back faces, and along every crease seen edge-on it tied in depth with the black in front: rows of white dots under the path (the 'stray strokes'). Pushed back, it loses every tie. */
  const land = style.solid(g, { noCull: true, fringe: landFr }); land.userData.hull.visible = W.dark;   /* (round 7) the hair of the Horn's high flanks printed white scratches lying on its black wherever a crease stood behind the skyline: the land wears none (dark-field apart) */ land.name = 'ridge'   /* only the Horn's high flanks wear a hair: on the low lee spurs it broke into scratches lying on black */; scene.add(land);
  // things stand on the MESH: the height of the triangle under (x, z), so nothing floats where the grid is coarser than the rock
  const find = (arr, v) => { let a = 0, b = arr.length - 1; while (b - a > 1) { const m = (a + b) >> 1; if (arr[m] <= v) a = m; else b = m; } return a; };
  W.ground = (x, z) => {
    if (!(x > xs[0] && x < xs[nx - 1] && z > zs[0] && z < zs[nz - 1])) return ground(x, z);
    const i = find(xs, x), j = find(zs, z), fx = (x - xs[i]) / (xs[i + 1] - xs[i]), fz = (z - zs[j]) / (zs[j + 1] - zs[j]);
    const ya = pos[(j * nx + i) * 3 + 1], yb = pos[(j * nx + i + 1) * 3 + 1], yc = pos[((j + 1) * nx + i) * 3 + 1], yd = pos[((j + 1) * nx + i + 1) * 3 + 1];
    return fx + fz <= 1 ? ya + fx * (yb - ya) + fz * (yc - ya) : yd + (1 - fx) * (yc - yd) + (1 - fz) * (yb - yd);
  };
  await ctx.yield();
  // the far country: a coarse black floor with hills out to where the wave train ends, sunk under the fine grid
  const X0 = -3200, X1 = 13500, Z0 = -10500, Z1 = 8000, MX = 64, MZ = 64, p2 = new Float32Array((MX + 1) * (MZ + 1) * 3), n2 = new Float32Array((MX + 1) * (MZ + 1) * 3);
  for (let j = 0; j <= MZ; j++) {
    for (let i = 0; i <= MX; i++) {
      const x = lerp(X0, X1, Math.pow(i / MX, 1.25)), z = lerp(Z0, Z1, j / MZ), o = (j * (MX + 1) + i) * 3;
      const inside = smoothstep(-1500, -1250, x) * smoothstep(2500, 2250, x) * smoothstep(-3200, -2950, z) * smoothstep(1700, 1450, z);
      // sunk deep under the fine grid: its 260 m cells cut straight across the Horn's hollow flanks and would poke through as
      // dead-straight black edges, each with a fringe hair
      const deep = smoothstep(-1250, -700, x) * smoothstep(2250, 1700, x) * smoothstep(-2950, -2400, z) * smoothstep(1450, 900, z);
      p2[o] = x; p2[o + 1] = raw(x, z) - 70 * inside - 560 * deep - (x < -1400 ? 200 : 0); p2[o + 2] = z;
    }
    if (j % 8 === 7) await ctx.yield();
  }
  const i2 = new Uint32Array(MX * MZ * 6); n = 0;
  for (let j = 0; j < MZ; j++) for (let i = 0; i < MX; i++) { const a = j * (MX + 1) + i, b = a + 1, c = a + MX + 1, d = c + 1; i2[n++] = a; i2[n++] = c; i2[n++] = b; i2[n++] = b; i2[n++] = c; i2[n++] = d; }
  gridNormals(p2, n2, MX + 1, MZ + 1, 0, MZ + 1);
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', new THREE.BufferAttribute(p2, 3)); g2.setAttribute('normal', new THREE.BufferAttribute(n2, 3)); g2.setIndex(new THREE.BufferAttribute(i2, 1));
  const far = style.solid(g2, { noCull: true, fringe: style.fringeMaterial({ near: [1e7, 2e7] }) }); far.name = 'far-country'; scene.add(far); W.farGrid = { p2, MX, MZ };   /* (round 9) ruled by buildLeeHairs along seven of its own grid lines */
  await ctx.yield();
}
// smooth normals of a displaced grid (rows j0..j1), from neighbour differences
function gridNormals(pos, nor, nx, nz, j0, j1) {
  for (let j = j0; j < j1; j++) for (let i = 0; i < nx; i++) {
    const a = (j * nx + Math.max(0, i - 1)) * 3, b = (j * nx + Math.min(nx - 1, i + 1)) * 3, c = (Math.max(0, j - 1) * nx + i) * 3, d = (Math.min(nz - 1, j + 1) * nx + i) * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[d] - pos[c], vy = pos[d + 1] - pos[c + 1], vz = pos[d + 2] - pos[c + 2];
    let x = vy * uz - vz * uy, y = vz * ux - vx * uz, z = vx * uy - vy * ux; const l = Math.hypot(x, y, z) || 1;
    const o = (j * nx + i) * 3; nor[o] = x / l; nor[o + 1] = y / l; nor[o + 2] = z / l;
  }
}

// ---- small geometry helpers ---------------------------------------------------------------------
// merge indexed geometries that carry the same attributes
function merge(list) {
  const names = Object.keys(list[0].attributes), out = new THREE.BufferGeometry(); let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  for (const k of names) { const sz = list[0].attributes[k].itemSize, a = new Float32Array(nv * sz); let o = 0; for (const g of list) { a.set(g.attributes[k].array, o); o += g.attributes[k].array.length; } out.setAttribute(k, new THREE.BufferAttribute(a, sz)); }
  const idx = new Uint32Array(ni); let o = 0, base = 0;
  for (const g of list) { const s = g.index.array; for (let i = 0; i < s.length; i++) idx[o++] = s[i] + base; base += g.attributes.position.count; }
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
// a closed prism with shared vertices (smooth normals for the fringe hull): convex outline [[x,y],...] CCW, from z0 to z1
function prism(outline, z0, z1, place = (x, y, z) => [x, y, z]) {
  const n = outline.length, pos = [], idx = [];
  for (const z of [z0, z1]) for (const [x, y] of outline) pos.push(...place(x, y, z));
  for (let i = 0; i < n; i++) { const a = i, b = (i + 1) % n, c = a + n, d = b + n; idx.push(a, c, b, b, c, d); }
  for (let i = 1; i < n - 1; i++) { idx.push(0, i, i + 1); idx.push(n, n + i + 1, n + i); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // make sure the normals point outward (away from the centroid)
  g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()), p = g.attributes.position, nn = g.attributes.normal; let s = 0;
  for (let i = 0; i < p.count; i++) s += (p.getX(i) - c.x) * nn.getX(i) + (p.getY(i) - c.y) * nn.getY(i) + (p.getZ(i) - c.z) * nn.getZ(i);
  if (s < 0) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.computeVertexNormals(); }
  return g;
}
// a crossed ribbon of curdled air along a polyline (the chimney plume, breath, wisps): pts [Vector3], width(t) metres,
// uv.x runs along it (cells scroll at `rate`), aRel.x = cross coordinate (upwind edge amber, lee edge blue)
function airRibbon(pts, width, o = {}) {
  const n = pts.length, cu = o.cellsU ?? 1.1, cellLen = o.cellLen ?? 9, rate = o.rate ?? -0.3, pos = [], nor = [], uv = [], rel = [], idx = [];
  const T = new THREE.Vector3(), S = new THREE.Vector3(), B = new THREE.Vector3(), E = new THREE.Vector3(1, 0, 0); let len = 0;
  for (let pl = 0; pl < 2; pl++) {
    len = 0;
    for (let j = 0; j < n; j++) {
      const a = pts[Math.max(0, j - 1)], b = pts[Math.min(n - 1, j + 1)]; T.subVectors(b, a).normalize();
      if (j) len += pts[j].distanceTo(pts[j - 1]);
      // plane 0 spreads across the wind (shows amber | blue flanks to a camera looking downwind), plane 1 along it
      S.set(0, 0, 1).addScaledVector(T, -T.z).normalize(); B.crossVectors(T, S).normalize();
      const sd = pl ? B : S, t = j / (n - 1), w = width(t), fade = (o.fade ? o.fade(t) : smoothstep(0, 0.08, t) * (1 - smoothstep(0.72, 1, t)));
      for (let i = 0; i <= 4; i++) {
        const x = i / 2 - 1;
        pos.push(pts[j].x + sd.x * x * w, pts[j].y + sd.y * x * w, pts[j].z + sd.z * x * w); nor.push(pl ? S.x : B.x, pl ? S.y : B.y, pl ? S.z : B.z);
        uv.push(len / cellLen + pl * 5.3, x * cu + pl * 3.7);
        const up = pl ? -x * sd.dot(E) : -x;                       // which edge is upwind
        rel.push((pl ? up : -x) * 0.9, (1 - x * x * x * x) * fade, rate);
      }
    }
  }
  for (let pl = 0; pl < 2; pl++) for (let j = 0; j < n - 1; j++) for (let i = 0; i < 4; i++) { const a = pl * n * 5 + j * 5 + i; idx.push(a, a + 1, a + 6, a, a + 6, a + 5); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aRel', new THREE.Float32BufferAttribute(rel, 3)); g.setIndex(idx);
  return g;
}
// HAIRS (fix round 3): families of nested streamlines as one merged ribbon mesh for style.ruleMaterial. add(P, o): P is a
// smooth polyline [[x, y, z], ...] in the mesh's own frame (dense samples of an analytic curve: no corners); o.g(j) the sign of
// the signal (+ amber, - ultramarine), o.fade(j) how much of the line is ruled there (ends dissolve in dashes, at full ink),
// o.far / o.near the range it is ruled in (a line is on or off, never tinted), o.seed, o.kind (0 x uLane, 1 x uBarrel), o.ext
// three numbers for the material's own hook. Tangents are taken in xy (lines in a plane of constant z) and in 3D (aT3).
function hairBuilder() {
  const pos = [], tan = [], t3 = [], rule = [], lod = [], kind = [], ext = [], idx = [];
  return {
    get lines() { return idx.length; },
    add(P, o) {
      const n = P.length, base = pos.length / 3; let len = o.flow0 ?? 0;
      for (let j = 0; j < n; j++) {
        const a = P[Math.max(0, j - 1)], b = P[Math.min(n - 1, j + 1)], c = P[j];
        let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l3 = Math.hypot(tx, ty, tz) || 1, l2 = Math.hypot(tx, ty) || 1;
        if (j) len += Math.hypot(c[0] - P[j - 1][0], c[1] - P[j - 1][1], c[2] - P[j - 1][2]);
        const g = o.g(j), f = o.fade ? o.fade(j) : 1, e = o.ext || [0, 0, 0];
        for (let sd = 0; sd < 2; sd++) {
          pos.push(c[0], c[1], c[2]); tan.push(tx / l2, ty / l2); t3.push(tx / l3, ty / l3, tz / l3); rule.push(len, g, f, sd ? 1 : -1);
          lod.push(o.far ?? 1e9, o.seed ?? 0, o.near ?? 0); kind.push(o.kind ?? 0); ext.push(e[0], e[1], e[2]);
        }
      }
      for (let j = 0; j < n - 1; j++) { const q = base + j * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 2)); g.setAttribute('aT3', new THREE.Float32BufferAttribute(t3, 3));
      g.setAttribute('aRule', new THREE.Float32BufferAttribute(rule, 4)); g.setAttribute('aLod', new THREE.Float32BufferAttribute(lod, 3)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(ext, 3)); g.setIndex(idx);
      return g;
    },
  };
}
// a strip that claims its pixels and prints nothing (style.marbleMaterial mask): rows [[x0, x1, y], ...] in a plane of constant z
function maskStrip(out, rows, z, far = 1e9) {   // far: the range beyond which the claim is given up (uv.y; see the thermals' claim)
  const base = out.pos.length / 3;
  for (const [x0, x1, y] of rows) { out.pos.push(x0, y, z, x1, y, z); out.nor.push(0, 0, 1, 0, 0, 1); out.uv.push(0, far, 1, far); out.rel.push(0, 1, 0, 0, 1, 0); }
  for (let j = 0; j < rows.length - 1; j++) { const q = base + j * 2; out.idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
}
function maskGeometry(out) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(out.nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(out.uv, 2)); g.setAttribute('aRel', new THREE.Float32BufferAttribute(out.rel, 3)); g.setIndex(out.idx);
  return g;
}
// an almond lens shell (the same shape as the hero's lenses), length L along z
function lensGeometry(cx, cy, cz, L, seed = 0) {
  const NU = 28, NV = 12, pos = [], nor = [], uv = [], rel = [], idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
    const th = (j / NV) * Math.PI, ph = (i / NU) * TAU, x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph);
    const tip = 1 - 0.55 * Math.pow(Math.abs(z), 2.2);
    const px = x * L * 0.2 * tip - 0.05 * L * (1 - z * z), py = y * L * 0.045 * tip * (y < 0 ? 0.4 : 1) + 0.012 * L * (1 - x * x), pz = z * L * 0.5;
    pos.push(cx + px, cy + py, cz + pz); const nl = Math.hypot(x / 0.2, y / 0.045, z / 0.5) || 1; nor.push(x / 0.2 / nl, y / 0.045 / nl, z / 0.5 / nl);
    uv.push(px / 260 + seed * 7, pz / 520 + seed * 3); rel.push(-x * 1.05 - 0.12, 1, 0.05);
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const p = j * (NU + 1) + i; idx.push(p, p + 1, p + NU + 2, p, p + NU + 2, p + NU + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aRel', new THREE.Float32BufferAttribute(rel, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------
// THE CIRQUE: arolla pines standing dead still, the hut and its plume (the lesson of the world), the limp windsock,
// and one small lens over the col.
// ---------------------------------------------------------------------------------------------
async function buildCirque(ctx, W) {
  const { style, scene, path, ground, detail, density } = W, rng = ctx.rng.fork('cirque'), noise = ctx.noise;
  const HUT = new THREE.Vector3(HUT_X, 0, HUT_Z); HUT.y = ground(HUT.x, HUT.z); W.hut = HUT;
  // pines: two crossed cut-outs each
  // one cut-out per tree, turned about its trunk to face the eye (crossed planes would print a fringe line inside the tree)
  const half = [[0.05, 0], [0.05, 0.13], [0.3, 0.14], [0.2, 0.3], [0.27, 0.33], [0.16, 0.5], [0.22, 0.53], [0.11, 0.7], [0.15, 0.73], [0.05, 0.9], [0, 1]];
  const outline = half.concat(half.slice(0, -1).reverse().map(([u, v]) => [-u, v]));
  const pineGeo = style.cutout(outline, (u, v) => [u, v, 0]);
  const pineHook = { flat: true, size: 2.2, far: [28, 50], down: [0.04, 0.16],   /* looked down on, a pine lies on black forest: no hair (white wire triangles) */   /* beyond the first rows the forest is one black mass with a toothed top */ vertexPost: `{ vec3 o = instanceMatrix[3].xyz; vec2 tc = cameraPosition.xz - o.xz; float tl = length(tc); vec2 r = tl > 1e-3 ? vec2(tc.y, -tc.x) / tl : vec2(1., 0.);
      float lat = pos.x - o.x; pos.x = o.x + r.x * lat; pos.z = o.z + r.y * lat; float nl = nrm.x; nrm.x = r.x * nl; nrm.z = r.y * nl; }` };
  const want = Math.round(1500 * detail * density), cand = [];
  let tries = 0;
  while (cand.length < want && tries < want * 14) {
    tries++;
    const near = cand.length < want * 0.22;
    let x, z;
    if (near) { const u = rng.range(0.005, 0.3), p = path.pointAt(u); const side = rng.chance(0.5) ? 1 : -1, off = 8 + Math.pow(rng(), 1.6) * 60; x = p.x + rng.range(-6, 6); z = p.z + side * off; }
    else { x = rng.range(-1000, -150); z = rng.range(-520, 520); }
    if (tries % 300 === 0) await ctx.yield();
    const y = ground(x, z);
    if (y > 190 || (!near && noise.fbm2(x / 170 + 9, z / 170, 2) < -0.12 + smoothstep(40, 150, y) * 0.5)) continue;
    const q = path.nearestXZ(x, z); if (q.dist < 7.6) continue;
    if (knollK(x, z) > 0.12) continue;                           // the knoll is bare
    if (x > -730 && x < HUT.x + 30 && z > HUT.z - 9 && z < 4) continue;          // keep the sight line from the entry to the hut open
    if ((x < -705 && Math.abs(z - 8) < 34) || (x < -650 && Math.abs(z - 8) < 14) || (x < -500 && Math.abs(z - 8) < 40 && z > HUT_Z) || shoulderK(x, z) > 0.1) continue;   // (and none of the scattered pines on or between the shoulders)   // nothing behind and around the entry point: the first view is the hut, the plume and the field
    const h = rng.range(8, 16) * (rng.chance(0.3) ? 1.25 : 1) * (near ? 1.4 : 1);   // the path rides 20 to 30 m up: the nearest pines are the tall ones, their tops cut out against the field beside the bird
    cand.push([x, y - 0.4, z, h, rng.range(0, TAU), rng.range(0.42, 0.62)]);
  }
  {
    const add = (x, z, h, w) => { if (path.nearestXZ(x, z).dist > 9) cand.push([x, ground(x, z) - 0.4, z, h, 0, w]); };
    // five tall pines on each shoulder, stepping away from the eye
    for (let sdI = 0; sdI < 2; sdI++) { const S = SHOULDERS[sdI], nP = sdI ? 8 : 3; for (let k = 0; k < nP; k++) add(S[0] + lerp(-0.85, 0.85, (k + 0.5) / nP) * S[2] + rng.range(-2, 2), S[1] + (sdI ? 1 : -1) * rng.range(-1, 4), rng.range(31, 39), rng.range(0.27, 0.34)); }   // (round 7) 31 to 39 m on 46 m shoulders: their tiers stand 20 m over the eye, spires a quarter of the frame high at the left and right edges
    // and the skyline is toothed: big pines along the saddle either side of the col and on the near rises
    const nSky = Math.round(150 * detail);
    for (let k = 0; k < nSky; k++) { const z = rng.range(-560, 560), x = rng.range(-70, -8); const hk = rng.range(11, 22) * lerp(0.45, 1, smoothstep(110, 300, Math.abs(z))), wk = rng.range(0.4, 0.6); if (Math.abs(z) > 110) add(x, z, hk, wk); }   // none near the col: the reveal's foreground is the bird alone
  }
  // (round 8) pines along the crest that climbs from the col to the Horn: from the lee and from the barrel they tooth the Horn's edge.
  // They grow with the distance they are seen from (15 m by the col, 58 m under the summit, which stands a kilometre off), and stop
  // short of the tip. A generator of their own: every other draw of the cirque keeps its number.
  { const rH = makeRng(7741), hzP = W.flow.hornZ, topY = W.hornTop.y, nH = Math.round(210 * detail);
    for (let k = 0; k < nH; k++) {
      const z = lerp(-125, hzP + 50, Math.pow((k + rH()) / nH, 0.8)); let bx = 0, by = -1e9;
      for (let x = -70; x <= 130; x += 10) { const y = ground(x, z); if (y > by) { by = y; bx = x; } }
      const t = clamp((by - 250) / Math.max(topY - 250, 1), 0, 1), nr = Math.exp(-Math.pow((z - hzP) / 900, 2)), hk = lerp(15, 58, smoothstep(250, 1200, -z)) * rH.range(0.7, 1.25), wk = rH.range(0.36, 0.5), jx = rH.range(-3, 3);
      if (t < 0.84) cand.push([bx + 95 * t * t * t * nr + jx, by - 0.5, z + 18 * t * t * nr, hk, 0, wk, 1]);
      if (k % 40 === 39) await ctx.yield();
    } }
  const pineFr = style.fringeMaterial(pineHook), pineBl = style.blackMaterial(pineHook);
  // (polish round 6) the ground is ruled in hairs now, and a far forest standing in front of them chopped every hair into crumbs. Trees,
  // tufts and boulders further than about a hundred metres therefore print only where they stand against the field (a depth just
  // under the far plane: on the black land they are black on black anyway) and leave the land's hairs whole; near ones stand in
  // front of the hairs as before (overlap).
  pineBl.vertexShader = pineBl.vertexShader.replace('void main(){', 'varying float vFarT; void main(){').replace('float lat = pos.x - o.x;', 'vFarT = step(60., tl); float lat = pos.x - o.x;');
  pineBl.fragmentShader = 'uniform vec3 uBlack; varying float vFarT; void main(){ gl_FragColor = vec4(uBlack, 1.); gl_FragDepth = vFarT > .5 ? .99999 : gl_FragCoord.z; }';
  const pines = style.solid(pineGeo, { flat: true, instances: cand.length, fringe: pineFr, black: pineBl }); pines.name = 'pines';
  const m = new THREE.Matrix4(), q4 = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), sc = new THREE.Vector3(), pp = new THREE.Vector3();
  W.pineTops = [];
  for (let i = 0; i < cand.length; i++) {
    const c = cand[i]; q4.identity(); m.compose(pp.set(c[0], c[1], c[2]), q4, sc.set(c[3] * c[5] * 1.7, c[3], c[3] * c[5] * 1.7)); pines.userData.setMatrixAt(i, m);
    if (c[3] > 15.5 && !c[6]) W.pineTops.push([c[0], c[1] + c[3] * 0.8, c[2]]);
  }
  pines.userData.commit(); pines.userData.hull.visible = false;   /* (polish round) no hair on any tree, tuft, boulder, hut or pole: a black solid on the field has no outline, the field shows its edge; on black land a hair was a white wire triangle */ scene.add(pines);
  await ctx.yield();
  // boulder fields on the floor and the face, and a fringe of dwarf pine and grass tufts biting the ridge line: black cut-outs
  // whose hairs of fringe are all the drawing the foreground has
  {
    const bGeo = style.cutout([[-1, 0], [-0.92, 0.42], [-0.55, 0.8], [0.05, 0.96], [0.58, 0.74], [0.93, 0.36], [1, 0]]);
    const tGeo = style.cutout([[-0.5, 0], [-0.46, 0.5], [-0.27, 0.2], [-0.1, 0.92], [0.05, 0.26], [0.3, 0.7], [0.4, 0.16], [0.5, 0]]);
    const nb = Math.round(420 * detail), nt = Math.round(520 * detail);
    const lowFr = style.fringeMaterial(Object.assign({ down: [0.05, 0.2] }, pineHook, { size: 0.7 }));   // (a hair only on the nearest: a row of far tufts printed white dashes on the black)   // looked down on, a tuft or boulder lies on black: no hair
    const boulders = style.solid(bGeo, { flat: true, instances: nb, fringe: lowFr, black: pineBl }), tufts = style.solid(tGeo, { flat: true, instances: nt, fringe: lowFr, black: pineBl });
    q4.identity(); let k = 0, tr = 0;
    while (k < nb && tr < nb * 12) {
      tr++; const near = k < nb * 0.3; let x, z;
      if (near) { const c = path.pointAt(rng.range(0.01, 0.4)); x = c.x + rng.range(-5, 5); z = c.z + (rng.chance(0.5) ? 1 : -1) * rng.range(8, 46); } else { x = rng.range(-940, -60); z = rng.range(-480, 480); }
      if (tr % 200 === 0) await ctx.yield();
      if (!near && noise.fbm2(x / 120 + 4, z / 120 + 2, 2) < 0.1) continue;
      if (path.nearestXZ(x, z).dist < 8 || knollK(x, z) > 0.12 || (x < -705 && Math.abs(z - 8) < 14)) continue;
      const w = rng.range(1.2, 4.2); m.compose(pp.set(x, ground(x, z) - 0.25, z), q4, sc.set(w, w * rng.range(0.5, 0.95), w)); boulders.userData.setMatrixAt(k++, m);
    }
    for (; k < nb; k++) { m.makeScale(0, 0, 0); boulders.userData.setMatrixAt(k, m); }
    for (let i = 0; i < nt; i++) {
      const onCrest = i < nt * 0.7, z = onCrest ? rng.range(-1000, 950) : rng.range(-420, 420), x = onCrest ? rng.range(-9, 6) : rng.range(-880, -80), h = rng.range(1.4, onCrest ? 5.5 : 2.6);
      if (i % 200 === 199) await ctx.yield();
      if (path.nearestXZ(x, z).dist < 9) { m.makeScale(0, 0, 0); tufts.userData.setMatrixAt(i, m); continue; }
      m.compose(pp.set(x, ground(x, z) - 0.2, z), q4, sc.set(h * rng.range(0.7, 1.3), h, h)); tufts.userData.setMatrixAt(i, m);
    }
    boulders.userData.commit(); tufts.userData.commit(); boulders.userData.hull.visible = tufts.userData.hull.visible = false; boulders.name = 'boulders'; tufts.name = 'tufts'; scene.add(boulders, tufts);
  }
  await ctx.yield();
  // the hut: a black gable with a chimney, a pole and a windsock hanging limp. (round 7) It stands whole against the field on the
  // knoll's top (the eye's own height at u 0.08), a third larger than it was; its walls run 8 m into the knoll so no slope shows under it.
  const HS = HUT_S, gy = HUT.y - 0.5, hut = merge([
    prism([[-5.1 * HS, -8], [5.1 * HS, -8], [5.1 * HS, 5 * HS], [0, 9.3 * HS], [-5.1 * HS, 5 * HS]], -6.3 * HS, 6.3 * HS, (x, y, z) => [HUT.x + z, gy + y, HUT.z + x]),
    prism([[-0.9 * HS, 0], [0.9 * HS, 0], [0.9 * HS, 11.6 * HS], [-0.9 * HS, 11.6 * HS]], -0.9 * HS, 0.9 * HS, (x, y, z) => [HUT.x + 3.3 * HS + z, gy + y, HUT.z + 2.4 * HS + x]),
  ]);
  { const o = style.solid(hut, { fringe: style.fringeMaterial({ size: 1.6 }) }); o.userData.hull.visible = false; o.name = 'hut'; scene.add(o); }
  // the pole: one black hair, never under two pixels wide (widened about its own axis with distance), the sock a drooping tongue
  const pz = HUT.z + 17, px = HUT.x + 1, py = ground(px, pz) - 2, PH = 15;
  const poleO = [[-0.13, 0], [0.13, 0], [0.13, PH], [-0.13, PH]], sockO = [[0, 0], [0.9, -0.15], [1.35, -1.5], [1.4, -3.6], [1.0, -5.0], [0.5, -3.8], [0.3, -1.6]];
  const pole = merge([style.cutout(poleO, (u, v) => [px + u, py + v, pz]), style.cutout(poleO, (u, v) => [px, py + v, pz + u])]);
  const poleHook = { flat: true, vertexDecl: 'uniform vec2 uRes;', vertexHook: `{ vec2 c = vec2(${px.toFixed(2)}, ${pz.toFixed(2)}); float dP = distance(cameraPosition, pos); pos.xz = c + (pos.xz - c) * max(1., dP * 1.25 / max(uRes.y, 1.) / .13); }` };
  { const o = style.solid(pole, { flat: true, fringe: style.fringeMaterial({ flat: true, size: 3 }), black: style.blackMaterial(poleHook) }); o.userData.hull.visible = false; o.name = 'pole'; scene.add(o); }
  const sockHook = { flat: true, size: 4, vertexDecl: '', vertexHook: `float sw = (${(py + PH - 0.1).toFixed(2)} - pos.y); pos.z += sw * sw * .03 * sin(uTime * .8 + sw); pos.x += sw * .05 * sin(uTime * .53);` };
  const sock = merge([style.cutout(sockO, (u, v) => [px, py + PH - 0.1 + v, pz + 0.13 + u]), style.cutout(sockO, (u, v) => [px + 0.6 * u, py + PH - 0.1 + v, pz + 0.13 + 0.8 * u])]);
  { const o = style.solid(sock, { flat: true, fringe: style.fringeMaterial(sockHook), black: style.blackMaterial(sockHook) }); o.userData.hull.visible = false; o.name = 'sock'; scene.add(o); }
  await ctx.yield();
  // THE PLUME, the lesson of the world (round 7): ONE column of curdling, 8 m wide and 46 m tall, dead straight in the still air:
  // rounded cells half its width, amber on its left, ultramarine on its right, veins of field between, scrolling up and wobbling.
  // One ribbon square to the eye of the first hundred metres (two crossed ones cut each other into straight-edged flakes); its
  // cover falls off toward the edges, so the cells make the outline, not the ribbon. Where it meets the first stream-sheet it is
  // bent over downwind and combed into four hairs that run on east with the strata.
  const cx = HUT.x + 3.3 * HS, cz = HUT.z + 2.4 * HS, y0 = gy + 11.4 * HS, RISE = 46, BEND = 9, RUN = RISE + 24, NPL = 80, HWP = 4.1;
  const SHR = new THREE.Vector3(0.85, 0, 0.53).normalize(), SIDE = new THREE.Vector3(0.36, 0, 0.93).normalize();
  const centre = (sd, out) => { const over = Math.max(0, sd - RISE), k = 1 - Math.exp(-over / BEND), lat = over - BEND * k; return out.set(cx + SHR.x * lat, y0 + Math.min(sd, RISE) + BEND * k, cz + SHR.z * lat); };
  {
    const pos = [], nor = [], uv = [], rel = [], idx = [], T = new THREE.Vector3(), S = new THREE.Vector3(), Nn = new THREE.Vector3(), Ca = new THREE.Vector3(), Cb = new THREE.Vector3(), C = new THREE.Vector3(), NX = 8; let len = 0;
    for (let j = 0; j <= NPL; j++) {
      const sd = (j / NPL) * RUN; centre(sd, C); centre(Math.max(0, sd - 0.5), Ca); centre(sd + 0.5, Cb); T.subVectors(Cb, Ca).normalize(); if (j) len += RUN / NPL;
      S.copy(SIDE).addScaledVector(T, -SIDE.dot(T)).normalize(); Nn.crossVectors(T, S).normalize();
      const w = HWP * (0.42 + 0.58 * smoothstep(0, 9, sd)) * (1 - 0.7 * smoothstep(RISE - 2, RUN, sd)), fade = smoothstep(0, 1.5, sd) * (1 - smoothstep(RISE + 8, RUN, sd));
      for (let i = 0; i <= NX; i++) {
        const x = i / (NX / 2) - 1; pos.push(C.x + S.x * x * w, C.y + S.y * x * w, C.z + S.z * x * w); nor.push(Nn.x, Nn.y, Nn.z);
        uv.push(len / (HWP * 1.35), x * 0.8); rel.push(-x * 1.05, Math.min(1, 1.3 * Math.pow(Math.max(0, 1 - x * x), 0.8)) * fade, -0.5);
      }
    }
    for (let j = 0; j < NPL; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i; idx.push(a, a + 1, a + NX + 2, a, a + NX + 2, a + NX + 1); }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); pg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    pg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); pg.setAttribute('aRel', new THREE.Float32BufferAttribute(rel, 3)); pg.setIndex(idx);
    const plumeMat = style.marbleMaterial({ seed: rng.range(0, 30), fill: 1, relief: 1.0, curdle: 0.95, warp: 0.8, sway: 0.011, swayZ: 1, swayBase: y0, swayFreq: 0.1, soft: [0.22, 0.62], lod: false, hard: true, clear: false });
    const plume = new THREE.Mesh(pg, plumeMat); plume.frustumCulled = false; plume.renderOrder = 30;   /* before the strata: its cells stop their hairs */ plume.name = 'plume'; scene.add(plume);
    // the comb: four hairs out of the bent end, running on downwind, opening a little, ending in dashes
    const HP = hairBuilder(), Sp = new THREE.Vector3(-SHR.z, 0, SHR.x), NH = 48;
    for (let h = 0; h < 4; h++) {
      const P = [], o = h - 1.5;
      for (let j = 0; j <= NH; j++) { const sd = RISE + 9 + j * 2.6, t = j / NH; centre(sd, C); P.push([C.x + Sp.x * o * lerp(0.5, 1.2, t), C.y + o * lerp(-0.9, -3.4, t) + 5 * t * t, C.z + Sp.z * o * lerp(0.5, 1.2, t)]); }   // stacked one over the other and opening: side by side they lay along the line of sight, one thick stroke
      HP.add(P, { g: () => (o < 0 ? 0.5 : -0.5), fade: (j) => smoothstep(0, 5, j) * smoothstep(0, 22, NH - j), seed: (0.17 + h * 0.29) % 1, kind: 2, far: 520 });
    }
    const hm = new THREE.Mesh(HP.build(), style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0.5, speed: 7, period: 0.1, t3: true })); hm.frustumCulled = false; hm.renderOrder = 34; hm.name = 'plume-comb'; scene.add(hm); W.disposables.push(hm.geometry);
  }
  W.plumeTop = new THREE.Vector3(cx + 2, y0 + 20, cz + 2);   // the gaze is drawn to the column's middle
  // one small lens high over the col: all that shows of the wave from the cirque
  const nLens = W.WX.lenses >= 5 ? 5 : W.WX.lenses >= 3 ? 2 : 1, lg = [];
  // (round 7) placed by where they stand in the frame of the reveal (colView): whole almonds no wider than a sixth of the frame, the
  // first over the far crests of the train, the second over the second crest, the storm's three stacked above them; from the cirque
  // they stand over the col, right of the plume
  const cvL = colView(W), LN = [[676, 180, 88, 1400], [600, 150, 96, 3000], [690, 158, 60, 1500], [612, 108, 72, 3100], [684, 118, 50, 1600]];   // (all right of the plume as the cirque sees them: one over the second crest stood on the plume's top like a hat)   // (off the axis the frame stretches them: the right-hand ones are built narrower)
  for (let n = 0; n < nLens; n++) { const [sx, sy, wpx, D] = LN[n], c = cvL.at(sx, sy, D); (W.lensAt = W.lensAt || []).push(new THREE.Vector3(c.x, c.y, c.z)); (W.lensLen = W.lensLen || []).push(wpx / cvL.F * D); lg.push(lensGeometry(c.x, c.y, c.z, wpx / cvL.F * D, 5 + n)); }
  const lens = new THREE.Mesh(nLens > 1 ? merge(lg) : lg[0], style.marbleMaterial({ seed: rng.range(0, 40), fill: 1, relief: 2.3, curdle: 0.22, warp: 0.2, edge: 0.18, soft: [0.14, 0.42], side: THREE.FrontSide, clear: false }));
  lens.frustumCulled = false; lens.renderOrder = 9; scene.add(lens); W.revealLens = lens;
  // (round 9) each lens stands whole in a gap of field: a claim a third longer than the lens (drawn after it), at which every hair stops short
  { const gm = []; for (let n = 0; n < nLens; n++) gm.push(lensGeometry(W.lensAt[n].x, W.lensAt[n].y - 0.02 * W.lensLen[n], W.lensAt[n].z, W.lensLen[n] * 1.32, 5 + n));
    const lm = new THREE.Mesh(nLens > 1 ? merge(gm) : gm[0], style.marbleMaterial({ fill: 0, mask: true, maskDepth: 0.999996, clear: false, lod: false })); lm.frustumCulled = false; lm.renderOrder = 9.5; lm.name = 'lens-claims'; scene.add(lm); W.revealLensClaim = lm; }
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE LAND DRAWN IN HAIRS (polish round 6). The windward ground was one black mass under the air. It is now ruled like everything
// else the instrument sees: PROFILE HAIRS, each the section of the ground at one distance downwind (a line of constant x draped a
// metre over the terrain), printed by the knife-edge rule (amber where the ground rises downwind, ultramarine where it falls). Seen
// from the flight they are ridge behind ridge, wide apart under the eye and closing toward the skyline; every second, fourth and
// eighth line is ruled further out (the grain coarsens with distance: on or off, in dashes, never tinted). Pines, hut and crag
// stand in front of them (depth); they end short of the crest, so the skyline stays a clean black edge under the strata.
// ---------------------------------------------------------------------------------------------
async function buildGroundHairs(ctx, W) {
  const { style, scene, ground } = W, HB = hairBuilder(), X0 = -702, DX = 12, NX = 58, DZ = 3;   /* (round 9) a point every 3 m (it was 6): the hairs follow the trough under the path as curves */   // to 18 m short of the crest, each hair whole to its end (faded toward the crest they were stray dashes under the reveal)
  const LV = [[192, 1000, 820], [96, 640, 640], [48, 440, 480], [24, 305, 340], [12, 215, 250]];   // [spacing m, ruled within m, half-length m] by octave: under the eye 12 m apart, each octave ruled 1.4 times further (a gap never under about 1.5 percent of the frame)
  for (let i = 0; i < NX; i++) {
    const x = X0 + i * DX, lv = LV[i % 16 === 9 ? 0 : i % 8 === 1 ? 1 : i % 4 === 1 ? 2 : i % 2 === 1 ? 3 : 4], half = lv[2], n = Math.round(2 * half / DZ), P = [], G = [];
    for (let j = 0; j <= n; j++) {
      const z = 4 - half + j * DZ;
      P.push([x, ground(x, z) + 0.9, z]); G.push(ground(x + 45, z) - ground(x - 45, z) + 0.8 >= 0 ? 0.5 : -0.5);   // the broad slope (a 90 m base): whole flanks in one ink, level ground with the rising
    }
    // no hair over the knoll and the two shoulders: they are 30 m cones on a 15 m grid, and a hair draped over one was a chevron (a
    // zigzag). They stand in the ruled floor as black solids, like the near pines.
    const bmp = (v, c, w) => { const t = (v - c) / w; return Math.exp(-t * t); };
    const lump = (z) => Math.max(knollK(x, z), shoulderK(x, z));
    const toCrest = 1;
    HB.add(P, { g: (j) => G[j], fade: (j) => smoothstep(0, 28, j) * smoothstep(0, 28, n - j) * toCrest * (1 - smoothstep(0.05, 0.16, lump(P[j][2]))) * (x > -256 && x < -104 ? 1 - smoothstep(9.5, 12, P[j][2]) * smoothstep(24.5, 22, P[j][2]) : 1)   /* none on the ibex's own bench */, far: lv[1], seed: (0.19 + i * 0.381) % 1, kind: 2 });
    if (i % 4 === 3) await ctx.yield();
  }
  // (round 9) the ibex's crag is NOT ruled: ruled, it was a striped loaf in the striped floor from the cirque and plain black from beside it. It is a
  // black cut-out at every range, the one unruled solid of the face, with the horned heads on its skyline (the land's hairs pass behind it).
  const mat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0, speed: 5, period: 0.24, t3: true });
  mat.fragmentShader = mat.fragmentShader.replace('gl_FragDepth = uClaimD;', '');   // these hairs lie ON black: they keep their own depth and are drawn after the solids
  mat.depthFunc = THREE.LessEqualDepth;
  const mesh = new THREE.Mesh(HB.build(), mat); mesh.frustumCulled = false; mesh.renderOrder = 103; mesh.name = 'ground-hairs'; scene.add(mesh); W.disposables.push(mesh.geometry);
  W.groundHairs = mesh;
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE LEE LAND AND THE HORN DRAWN IN HAIRS (round 8). East of the crest the land was one flat black cut-out: 'a featureless wedge'
// in the barrel, 'a hard black slab' at the left edge of the reveal. It is ruled now like the cirque's floor: PROFILE HAIRS, each the
// section of the land at one distance north (a line of constant z draped two metres over the mesh, from the crest down to the lee
// valley), so from the col and from the run north they stand ridge behind ridge up to the Horn's tip. The grain coarsens with range
// as everywhere: 16 m apart within 520 m of the eye, then 32, 64, 128 and 256 m (a line is on or off, in dashes, never tinted). The
// knife-edge reads the relief of each section: its benches and brows print the rising ink, its steeps the falling.
// ---------------------------------------------------------------------------------------------
async function buildLeeHairs(ctx, W) {
  const { style, scene, ground } = W, HB = hairBuilder(), hz = W.flow.hornZ, DZ = 16, N = Math.round((150 - (hz - 430)) / DZ);
  for (let i = 0; i <= N; i++) {
    const z = 150 - i * DZ, lv = i % 16 === 0 ? [6000, 2400, 40] : i % 8 === 0 ? [3400, 2400, 30] : i % 4 === 0 ? [1900, 1500, 20] : i % 2 === 0 ? [950, 760, 13] : [520, 620, 13]   /* the coarse ones run on over the lee country: from the col it was a flat black third of the frame under the steady camera */, P = [], G = [];   // [ruled within m, to x m east, step m]
    for (let x = -6; x <= lv[1]; x += lv[2]) {
      const y = ground(x, z); P.push(W.hookAt(x, y + 2.2, z));
      // the relief of the section itself: where it falls less steeply than the flank around it (a bench, the brow of a spur) the rising ink, where it falls more steeply the falling
      G.push((ground(x + 26, z) - ground(x - 26, z)) / 52 - (ground(x + 140, z) - ground(x - 140, z)) / 280 + 0.05 >= 0 ? 0.5 : -0.5);
    }
    const n = P.length - 1;
    HB.add(P, { g: (j) => G[j], fade: (j) => smoothstep(0, 3, j) * smoothstep(0, 8, n - j), far: lv[0], seed: (0.27 + i * 0.381) % 1, kind: 2 });
    if (i % 2 === 1) await ctx.yield();
  }
  // (round 9) THE LEE COUNTRY. Past x 2250 the land is the coarse far mesh, and it carried no hair: under the steady camera at u 0.6 it
  // was a plain black band a fifth of the frame deep between the ruled slope and the sky. Seven profile hairs are laid along its own
  // north-south grid lines (so they lie on it exactly), 2.5 to 10 km out, each nearer the next as they go: from the col they are level
  // hairs closing on the horizon, the same ink rule as the sections (rising ground the warm ink, falling the cold).
  if (W.farGrid) { const { p2, MX, MZ } = W.farGrid, at = (i, j, c) => p2[(j * (MX + 1) + i) * 3 + c];
    [27, 29, 32, 36, 41, 47, 54].forEach((i, q) => { const P = [], G = [];
      for (let j = 1; j < MZ; j++) { const x = at(i, j, 0), z = at(i, j, 2); if (Math.abs(z + 600) > 1.6 * x + 1800) continue;
        P.push([x, at(i, j, 1) + 9, z]); G.push(at(i, j + 1, 1) - at(i, j - 1, 1) >= 0 ? 0.5 : -0.5); }
      const n = P.length - 1; if (n > 3) HB.add(P, { g: (j) => G[j], fade: (j) => smoothstep(0, 2, j) * smoothstep(0, 2, n - j), far: 60000, seed: (0.13 + q * 0.381) % 1, kind: 2 }); }); }
  await ctx.yield();
  const mat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0, speed: 5, period: 0.24, t3: true });
  mat.fragmentShader = mat.fragmentShader.replace('gl_FragDepth = uClaimD;', '');   // on black, like the cirque's: their own depth, drawn after the solids
  mat.depthFunc = THREE.LessEqualDepth;
  const mesh = new THREE.Mesh(HB.build(), mat); mesh.frustumCulled = false; mesh.renderOrder = 103; mesh.name = 'lee-hairs'; scene.add(mesh); W.disposables.push(mesh.geometry);
  W.leeHairs = mesh;
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE WARM FACE: thermals standing like glass kelp (one of them on the path), and six ibex on their spur.
// ---------------------------------------------------------------------------------------------
async function buildWarmFace(ctx, W) {
  const { style, scene, path, ground, detail, density, heat } = W, rng = ctx.rng.fork('face'), noise = ctx.noise;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), s = new THREE.Vector3(), p = new THREE.Vector3();
  const RING = { xc: -378, a: 50, b: 15, n: 20 }, U_THERMAL = path.nearestXZ(RING.xc, 1).u, U_IBEX = path.nearestXZ(-172, 0).u;
  const list = [];   // [x, y, z, width, height]
  if (heat > 0) {
    const want = Math.round(84 * detail * clamp(density, 0.8, 1.2) * clamp(heat, 0.5, 1.6));
    // the nearest ones, 10 to 26 m off the path all the way up the face
    for (let i = 0; i < 16; i++) {
      const u = lerp(0.17, 0.41, (i + rng()) / 16), c = path.pointAt(u), side = i % 2 ? 1 : -1, off = rng.range(10, 26) * side;
      if (Math.abs(u - U_IBEX) < 0.035 && side > 0) continue;
      const tw = rng.range(3, 6.5), thh = rng.range(40, 95); if (c.x > RING.xc - RING.a - 26 && c.x < RING.xc + RING.a + 16) continue;   // (round 9) none beside the column we fly through: seen through its wall their hairs lay over its own, amber on ultramarine
      list.push([c.x, ground(c.x, c.z + off), c.z + off, tw, thh]);
    }
    for (const t of W.pineTops) { if (t[0] > -520 && rng.chance(0.25) && list.length < want * 0.3) list.push([t[0], t[1], t[2], rng.range(3, 6), rng.range(40, 110)]); }
    let tries = 0;
    while (list.length < want && tries < want * 20) {
      tries++;
      const x = rng.range(-430, -40), z = rng.range(-620, 620), y = ground(x, z);
      if (tries % 200 === 0) await ctx.yield();
      if (noise.fbm2(x / 120 + 4, z / 120 + 2, 2) < 0.12 && heat < 1.5) continue;    // boulder fields
      const d = path.nearestXZ(x, z).dist; if (d < 12) continue;
      if (Math.hypot(x - W.hut.x, z - W.hut.z) < 70) continue;
      list.push([x, y, z, rng.range(3, 9), rng.range(40, 150)]);
    }
  }
  // the one we fly through: a cluster of fat columns on the path itself (present even at dawn: the bird needs its lift)
  const c0 = path.pointAt(U_THERMAL), t0 = path.tangentAt(U_THERMAL); W.thermalAt = c0.clone();
  const through = heat > 0 ? [[-9, 3, 7, 150, 0.2], [-3, -2.5, 8, 170, 1.1], [3, 2, 9, 190, 2.3], [9, -2, 7.5, 160, 0.7], [15, 1.5, 6, 140, 1.9]] : [];
  // FIX ROUND 3: a thermal is a COLUMN OF NESTED STREAMLINES, not a wash: eight hairs a flank, amber on the north flank and
  // ultramarine on the south with a lane of field between, parallel, swaying together like kelp, the inner ones the tallest, their
  // dashes rising. Far columns are broad and ruled wide apart (a hair is ruled only where its gap is over ~1 percent of the frame),
  // near ones are fine combs: the grain of the air tells the distance. Each column claims its pixels (a mask), so the strata over
  // the crest stop behind it: overlap, not a net of crossing lines.
  const n = list.length + through.length;
  if (n) {
    // (round 9) OVERLAP BETWEEN COLUMNS TOO: where the amber flank of one column stood over the ultramarine flank of another the two printed a mauve mass.
    // Columns are sorted into three ranges from the route (under 34 m, under 110 m, beyond); each range's claims have a depth of their own and a column's
    // hairs are tested just under their own range's depth, so a nearer column stops a farther one's hairs and the strata stop at them all.
    const HB = hairBuilder(), MKS = [0, 1, 2].map(() => ({ pos: [], nor: [], uv: [], rel: [], idx: [] })), s01 = (a, b, v) => smoothstep(a, b, v); W.thermalMK = MKS;
    const column = (X, Yb, Z, Wd, Ht, nF, seed, dP, o = {}) => {
      const phase = (o.phase ?? seed) * TAU, B = 0.018 * Ht, bend = (t) => B * (Math.sin(t * 2.4 + phase) - Math.sin(phase)), prof = (t) => lerp(0.5, 1, s01(0, 0.3, t)) * lerp(1, 0.7, s01(0.6, 1, t));
      const gap = Wd * 0.5 * 0.84 / nF, SEG = dP < 120 ? 28 : 18, grp = o.grp ?? (dP < 34 ? 0 : dP < 110 ? 1 : 2), MK = MKS[grp], clm = THERMAL_CLAIM(grp) - 2e-7;
      for (let sg = -1; sg <= 1; sg += 2) for (let q = 0; q < nF; q++) {
        const far = Math.min(q === 0 ? (o.far ?? 1e9) : 104 * gap * (q % 4 === 0 ? 4 : q % 2 === 0 ? 2 : 1), o.cap ?? 1e9); if (far < dP * 0.9) continue;
        const a = 1 - (q / nF) * 0.84, tk = 0.8 + 0.2 * Math.pow(q / Math.max(nF - 1, 1), 0.7), P = [];
        for (let j = 0; j <= SEG; j++) { const t = (j / SEG) * tk; P.push([Z + sg * a * Wd * 0.5 * prof(t) + bend(t), Yb + t * Ht, -X]); }
        HB.add(P, { g: () => (sg < 0 ? 0.6 : -0.6), fade: (j) => s01(0, 0.05, j / SEG) * (1 - s01(0.78, 1, j / SEG)), far, seed: (seed + q * 0.13 + (sg > 0 ? 0.5 : 0)) % 1, ext: [Yb, phase, clm] });   // (the third number is the sway's weight, 1, and the hair's claim depth, a hair under 1, at once)
      }
      // (round 8) THE CLAIM IS THE COLUMN'S OWN SHAPE. It was a rectangle half a column wider than the column either side, square at the
      // top and kept at any range: where the column's own hairs were not ruled (the far ones, the cone of the entry) it printed a pale
      // quad cut out of the strata ('a clipping patch'). Now it hugs the outermost hair by a hair's gap (plus the sway), draws in with
      // the hairs as the outer ones end, comes to a point where the innermost ends, and is given up at the range the column's outer
      // hair is given up at: the strata run up to the column and on beyond it.
      const rows = []; for (let i = 0; i <= 10; i++) { const t = (i / 10) * 0.96, hw = Wd * 0.5 * prof(t) * lerp(1, 0.1, s01(0.6, 0.96, t)) * (1 - s01(0.9, 0.96, t)) + (Math.max(gap * 1.3, 0.7) + 0.02 * t * Ht + 0.009 * dP) * (1 - s01(0.8, 0.96, t)), c = Z + bend(t); rows.push([c - hw, c + hw, Yb + t * Ht]); }
      maskStrip(MK, rows, -X, Math.min(o.far ?? 1e9, o.cap ?? 1e9));
    };
    let i = 0;
    for (const t of list) {
      const dP = path.nearestXZ(t[0], t[2]).dist, wide = clamp(dP * 0.055, 7, 26);
      // (polish round) straight down the entry axis the far columns stood as a bar-code of some thirty-five hairs behind the plume: within
      // 20 degrees of that axis four columns in five are ruled only within 340 to 460 m of the eye (they come in dash by dash as we fly up
      // the cirque), so from the entry and through the previous portal the plume is the first thing read
      const cone = Math.abs(t[2] - 8) < 0.36 * (t[0] + 720) && i % 5 !== 2;
      // (round 9) and every column that stands in the view out of the column we fly through (beyond its near end and within 150 m of the line of flight) is ruled only
      // once the eye is nearer to it than half its range from that column: from inside the ring, and from the cirque, the face ahead is the ring, the grove
      // and clear field; the kelp of the upper face comes in dash by dash as we leave the ring
      const dxr = t[0] - (RING.xc - RING.a - 30), inView = heat > 0 && dxr > 0 && Math.abs(t[2] - c0.z) < 150, o = cone ? { far: 200 + 80 * ((i * 0.618) % 1) } : {}; if (inView) o.cap = Math.max(45, 0.55 * Math.hypot(dxr, t[2] - c0.z));
      const sdC = rng(); if (heat > 0 && Math.abs(t[0] - RING.xc) < RING.a + 34 && Math.abs(t[2] - c0.z) < 85) { i++; continue; }   // none beside the ring itself
      column(t[0], t[1] - 2, t[2], Math.max(t[3] * 1.2, wide), t[4] * lerp(1, 1.7, smoothstep(90, 500, dP)), 8, sdC, dP, o);
      if (++i % 12 === 0) await ctx.yield();
    }
    // THE COLUMN WE FLY THROUGH (round 9). It was five flat combs standing across the route, a hundred hairs at one pitch: from outside and
    // from inside alike a curtain of stripes a third of the frame wide with the lenses printed across it. It is now ONE column, a ring of
    // upright hairs round the route (an oval 66 m long and 24 m across at the eye's height), amber on its north flank and ultramarine
    // on its south, swaying as one. From the cirque it is a column like the others, whole, its hairs a few (every fourth is ruled at
    // any range, the rest within 75 and 40 m). From INSIDE (u 0.24 to 0.28) its hairs pass within metres of the wings, a tenth of the
    // frame apart at the sides and closing toward the far wall, their dashes streaking upward, and between them the view ahead stands
    // clear: the far wall is left open where the lenses stand (no hair within three degrees of a lens), and the wall itself claims
    // its pixels, so the strata, the col and the lenses are seen through that opening and nowhere across the hairs (level dashes
    // between upright hairs were a ladder).
    const RK = { pos: [], nor: [], uv: [], rel: [], idx: [] };
    { const ph = rng(), yb = ground(c0.x, c0.z) - 2; for (const t of through) rng();
      if (through.length) { const E = path.pointAt(0.26), Ht = 170, B = 0.018 * Ht, phase = ph * TAU, bend = (t) => B * (Math.sin(t * 2.4 + phase) - Math.sin(phase)), prof = (t) => lerp(0.62, 1, s01(0, 0.2, t)) * lerp(1, 0.7, s01(0.6, 1, t));
        let azA = 1e9, azB = -1e9; (W.lensAt || []).forEach((Lc, i) => { const d = Math.hypot(Lc.x - E.x, Lc.z - E.z), az = Math.atan2(Lc.z - E.z, Lc.x - E.x), hw = Math.atan(0.5 * (W.lensLen?.[i] ?? 400) / d) + 0.055; azA = Math.min(azA, az - hw); azB = Math.max(azB, az + hw); });
        const wallL = [], wallR = [];
        for (let sg = -1; sg <= 1; sg += 2) for (let k = 0; k < RING.n; k++) {
          const phi = Math.PI * (1 - Math.pow((k + 0.5) / RING.n, 0.85)), hx = RING.a * Math.cos(phi), hz = sg * RING.b * Math.sin(phi), X = RING.xc + hx, Z = c0.z + hz;
          if (X > E.x + 2) { const az = Math.atan2(Z - E.z, X - E.x); if (az > azA && az < azB) continue; }   // the gap the lenses stand in
          const far = k % 4 === 1 ? 520 : k % 2 === 1 ? 185 : 115, P = [];
          for (let j = 0; j <= 28; j++) { const t = (j / 28) * 0.97, pr = prof(t); P.push([c0.z + hz * pr + bend(t), yb + t * Ht, -(RING.xc + hx * pr)]); }
          HB.add(P, { g: () => (sg < 0 ? 0.6 : -0.6), fade: (j) => s01(0, 0.05, j / 28) * (1 - s01(0.78, 1, j / 28)), far, seed: (ph + k * 0.13 + (sg > 0 ? 0.5 : 0)) % 1, ext: [yb, phase, THERMAL_CLAIM(0) - 2e-7] });
          (sg < 0 ? wallL : wallR).push([hx, hz]);
        }
        // the wall: one strip from the last hair of the north flank round the near end to the last hair of the south flank
        const wall = wallL.slice().reverse().concat(wallR), NW = wall.length;
        for (let c = 0; c < NW; c++) for (let r = 0; r <= 3; r++) { const t = r * 0.31, pr = prof(t); RK.pos.push(c0.z + wall[c][1] * pr + bend(t), yb + t * Ht, -(RING.xc + wall[c][0] * pr)); RK.nor.push(0, 0, 1); RK.uv.push(0, 520); RK.rel.push(0, 1, 0); }
        for (let c = 0; c < NW - 1; c++) for (let r = 0; r < 3; r++) { const q = c * 4 + r; RK.idx.push(q, q + 1, q + 5, q, q + 5, q + 4); }
      } }
    // (round 8) THE GROVE ON THE UPPER FACE. After the column we fly through, the climb to the ibex was 'thin pillars and a lot of empty
    // pink' (the still at u 0.34). Five broad combs now stand on the upper face, three left of the line of flight and two beyond the
    // ibex's crag, ten hairs a flank, 160 to 190 m tall, swaying as one: we see them ACROSS (from the side, 60 to 150 m off) where the
    // first was seen from below. Their outer hairs are ruled within 190 m, so from the cirque they are a few fine hairs and they fill
    // in dash by dash as we leave the first column.
    if (heat > 0) { const GROVE = [[-198, -30, 22, 176, 0.21], [-178, -50, 27, 192, 0.47], [-157, -27, 20, 166, 0.73], [-152, 60, 25, 184, 0.35], [-121, 79, 20, 162, 0.62]], phG = 0.37;
      for (const t of GROVE) { column(t[0], ground(t[0], t[1]) - 2, t[1], t[2], t[3], 10, t[4], 60, { phase: phG, far: 190, cap: 150 }); await ctx.yield(); } }
    await ctx.yield();
    const mat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0, speed: 14, decl: 'attribute vec3 aCol; flat varying float vClm;',
      hook: 'vClm = aCol.z; float hh = max(position.y - aCol.x, 0.); p.x += aCol.z * hh * (sin(uTime * .45 + aCol.y + hh * .05) * .013 + sin(uTime * .21 + aCol.y * 1.7 + hh * .021) * .017);' });
    mat.fragmentShader = mat.fragmentShader.replace('uniform float uLine,', 'flat varying float vClm; uniform float uLine,').replace('gl_FragDepth = uClaimD;', 'gl_FragDepth = vClm;');
    mat.vertexShader = mat.vertexShader.replace('smoothstep(aLod.x * .7, aLod.x, dist)', 'smoothstep(aLod.x * uThm * .74, aLod.x * uThm * .82, length(w.xz - uCam.xz))');   // (round 9) an upright hair is ruled by its range over the ground: whole or absent (by the range of each point, the hairs next to the eye were ruled only at the eye's own height)
    mat.uniforms.uThm = { value: 1 }; mat.vertexShader = mat.vertexShader.replace('uniform float uTime,', 'uniform float uThm, uTime,').replace('aKind < -.5 ? 1. : uLane)', 'aKind < -.5 ? 1. : step(.02, uThm))'); W.thermalMat = mat; W.thermalClaims = [];   /* (round 9) the columns are put away WHOLE (range by range, see update): their range is drawn in to nothing over 20 m of flight, so they go hair by hair, the far ones first; thinned dash by dash with the lane's hairs they stood as upright ticks across the level dashes at u 0.43 */
    const th = new THREE.Mesh(HB.build(), mat); th.rotation.y = -Math.PI / 2; th.frustumCulled = false; th.renderOrder = 36; th.name = 'thermals';
    scene.add(th); W.disposables.push(th.geometry);
    if (RK.idx.length) {   // the ring's claim: its wall, given up at the range its last hairs are
      const rm = style.marbleMaterial({ fill: 0, mask: true, maskDepth: THERMAL_CLAIM(0), clear: false, lod: false });
      rm.vertexShader = rm.vertexShader.replace('vW = w.xyz;', 'vW = w.xyz; vRel.y *= 1. - smoothstep(uv.y * uThm * .72, uv.y * uThm * .9, length(w.xz - uCam.xz));'); rm.vertexShader = 'uniform float uThm;\n' + rm.vertexShader; rm.uniforms.uThm = W.thermalMat.uniforms.uThm;
      const rk = new THREE.Mesh(maskGeometry(RK), rm); rk.rotation.y = -Math.PI / 2; rk.frustumCulled = false; rk.renderOrder = 30; rk.name = 'ring-claims'; scene.add(rk); W.thermalClaims.push(rk); W.disposables.push(rk.geometry); }
  }
  await ctx.yield();
  // ibex: black cut-outs on the spur, turned to meet the eye, each in a small shimmer of body heat, breathing
  const IB = [[-0.78, 0], [-0.74, 0.6], [-0.88, 0.95], [-0.8, 1.1], [-0.4, 1.14], [0.25, 1.1], [0.45, 1.3], [0.52, 1.62], [0.42, 1.88], [0.2, 2.02], [-0.1, 2.0], [-0.3, 1.9], [-0.05, 2.15], [0.3, 2.2], [0.6, 2.0], [0.68, 1.74],
    [0.8, 1.7], [1.04, 1.5], [1.0, 1.4], [0.76, 1.4], [0.7, 1.1], [0.66, 0.66], [0.68, 0], [0.54, 0], [0.5, 0.6], [0.34, 0.64], [0.36, 0], [0.22, 0], [0.18, 0.62], [-0.34, 0.6], [-0.4, 0], [-0.54, 0], [-0.56, 0.56], [-0.64, 0]];
  const ibGeo = style.cutout(IB), NI = 6, ibex = style.solid(ibGeo, { flat: true, instances: NI, fringe: style.fringeMaterial({ flat: true, size: 3.5 }) }); ibex.name = 'ibex'; ibex.userData.hull.visible = false;   // (polish round) no hair: far off the hair was wider than the animal, a white wire ibex
  const puffGeo = style.ribbonGeometry({ segs: 8, cellsU: 2.4, cellsV: 5.5, rate: -0.5 });
  { const r = puffGeo.attributes.aRel; for (let i = 0; i < r.count; i++) { const x = r.getX(i) / 0.9; r.setY(i, r.getY(i) * Math.pow(Math.max(0, 1 - x * x), 1.5)); } }   // a spindle with no edge of its own: the shimmer is small curdled slivers (flat hard-edged quadrilaterals read as flags)
  const puffMat = style.marbleMaterial({ seed: 7.7, fill: 1, relief: 1.5, curdle: 0.45, warp: 0.9, sway: 0.25, soft: [0.3, 0.75], hard: true, lines: 1 });   /* (round 9) ruled like the rotor: a breath is one or two closed hairs in its ink, where it was a flat oval of ultramarine with a pale ring */   // (round 7) a breath is the plume in small: amber on one flank, ultramarine on the other, a vein of field between (one-ink blobs read as flags)   // a shimmer: slivers of ink, not a flag
  const puffs = new THREE.InstancedMesh(puffGeo, puffMat, NI), HH = hairBuilder();
  puffs.frustumCulled = false; puffs.renderOrder = 44;
  const spots = [[-212, 14.4, 0.9], [-200, 15.4, -0.5], [-187, 14.4, 0.7], [-174, 15.4, 0.85], [-161, 14.4, -0.6], [-148, 15.4, 0.8]];   // at the front of the bench: hooves on its edge
  // their crag: its own black solid, a fine heightfield standing out of the face (the 15 m terrain grid cannot hold a ledge
  // 10 m wide), so there is rock under every hoof. Its rim sinks under the terrain; hooves are seated on its own grid.
  const pY = (x) => path.nearestXZ(x, 0).y, CX0 = -254, CX1 = -106, CZ0 = 6.5, CZ1 = 43, CNX = 62, CNZ = 16;
  const cpos = new Float32Array((CNX + 1) * (CNZ + 1) * 3), cnor = new Float32Array((CNX + 1) * (CNZ + 1) * 3), cidx = [];
  for (let j = 0; j <= CNZ; j++) for (let i = 0; i <= CNX; i++) {
    const x = lerp(CX0, CX1, i / CNX), z = lerp(CZ0, CZ1, j / CNZ), o = (j * (CNX + 1) + i) * 3, g0 = ground(x, z) - 1.6;
    const mask = smoothstep(-252, -220, x) * smoothstep(-108, -138, x) * smoothstep(7.5, 12, z) * smoothstep(42, 23, z);   // (long ramps at both ends: seen end-on from down the valley the raised bench was a square block on the skyline)
    const ledge = smoothstep(12, 13.6, z) * smoothstep(21, 18.5, z);                         // the flat the ibex stand on
    const lip = 1 - smoothstep(11.5, 13.5, z);   // (fix 3) the near lip stood as high as the eye and hid five of the six to the horns: it lies 5 m under the bench now
    const yC = pY(x) + 4.2 - 5.2 * lip + (1 - ledge) * (1.3 * noise.fbm2(x / 7 + 3, z / 7, 2) * (1 - 0.6 * lip) + 1.2 * Math.max(0, Math.sin(x * 0.13 + 0.6)) * smoothstep(19, 25, z) - 2.4 * smoothstep(21, 30, z)) + 0.5 * Math.sin(x * 0.21);
    cpos[o] = x; cpos[o + 1] = Math.max(g0, lerp(g0, yC, mask)); cpos[o + 2] = z;
  }
  for (let j = 0; j < CNZ; j++) for (let i = 0; i < CNX; i++) { const a = j * (CNX + 1) + i, b = a + 1, c = a + CNX + 1, d = c + 1; cidx.push(a, c, b, b, c, d); }
  gridNormals(cpos, cnor, CNX + 1, CNZ + 1, 0, CNZ + 1);
  const crag = new THREE.BufferGeometry(); crag.setAttribute('position', new THREE.BufferAttribute(cpos, 3)); crag.setAttribute('normal', new THREE.BufferAttribute(cnor, 3)); crag.setIndex(cidx);
  const cragS = style.solid(crag, { noCull: true, fringe: style.fringeMaterial({ near: [110, 380] }) }); cragS.name = 'ibex-crag'; cragS.userData.hull.visible = false;   /* (polish round) black rock on black land: its hair was a white wire wedge under the line of flight in every frame of the cirque */ scene.add(cragS);
  const cragTop = (x, z) => {
    const fi = clamp((x - CX0) / (CX1 - CX0) * CNX, 0, CNX - 1e-3), fj = clamp((z - CZ0) / (CZ1 - CZ0) * CNZ, 0, CNZ - 1e-3), i = Math.floor(fi), j = Math.floor(fj), fx = fi - i, fz = fj - j;
    const at = (ii, jj) => cpos[(jj * (CNX + 1) + ii) * 3 + 1], ya = at(i, j), yb2 = at(i + 1, j), yc = at(i, j + 1), yd = at(i + 1, j + 1);
    return fx + fz <= 1 ? ya + fx * (yb2 - ya) + fz * (yc - ya) : yd + (1 - fx) * (yc - yd) + (1 - fz) * (yb2 - yd);
  };
  W.ibex = []; const cI = path.pointAt(U_IBEX); W.ibexAt = new THREE.Vector3(-176, cI.y + 9, 17);
  for (let i = 0; i < NI; i++) {
    const [x, z, yawS] = spots[i], y = cragTop(x, z) - 0.12, sc = rng.range(1.25, 1.6), yaw = (Math.PI * 0.5 - 0.75) + rng.range(-0.2, 0.2) + (yawS < 0 ? Math.PI : 0);   // side-on to the approaching eye, some facing back
    q.setFromAxisAngle(up, yaw); m.compose(p.set(x, y, z), q, s.set(sc, sc, sc)); ibex.userData.setMatrixAt(i, m);
    const muzzle = new THREE.Vector3(1.02, 1.45, 0).multiplyScalar(sc).applyQuaternion(q).add(p), fwd = new THREE.Vector3(1, -0.15, 0).applyQuaternion(q).normalize();
    W.ibex.push({ muzzle, fwd, phase: rng() * 3, sc });
    // (round 7) body heat: a thermal in small, four upright hairs off the back (amber north, ultramarine south), swaying, their dashes rising
    for (let h = 0; h < 4; h++) { const o = [-0.85, -0.32, 0.32, 0.85][h] * sc, Hh = (h === 0 || h === 3 ? 4.6 : 6.4) * sc, y0h = y + (h === 0 || h === 3 ? 1.5 : 1.25) * sc, P = [];
      for (let j = 0; j <= 14; j++) { const t = j / 14; P.push([x + 0.3 * sc * Math.sin(t * 2.2 + i), y0h + t * Hh, z + o * (1 + 0.5 * t)]); }
      HH.add(P, { g: () => (h < 2 ? 0.5 : -0.5), fade: (j) => smoothstep(0, 2, j) * smoothstep(0, 6, 14 - j), far: 190, seed: (0.13 + i * 0.37 + h * 0.21) % 1, kind: 2, ext: [y + sc, i * 1.9, 1] }); }   // (polish round) slimmer and seated on the back: the ink of the spindle is in its upper part, and it floated above the horns as an egg
    // (round 9) and the heat claims its pixels: the strata stop round each animal (its upright hairs across their level ones were a grid)
    { const MK0 = (W.ibexMK = W.ibexMK || { pos: [], nor: [], uv: [], rel: [], idx: [] });   /* a claim of the ibex's own: it stays when the columns are put away */ maskStrip(MK0, [[z - 1.9 * sc, z + 1.9 * sc, y + 0.7 * sc], [z - 2.4 * sc, z + 2.4 * sc, y + 4 * sc], [z - 2.0 * sc, z + 2.0 * sc, y + 8.4 * sc]], -x, 190); }
    m.makeScale(0, 0, 0); puffs.setMatrixAt(i, m);
  }
  ibex.userData.commit(); scene.add(ibex, puffs);
  { const hm = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0, speed: 2.4, period: 0.06, t3: true, decl: 'attribute vec3 aCol;',
      hook: 'float hh = max(position.y - aCol.x, 0.); p.z += aCol.z * hh * (sin(uTime * 1.1 + aCol.y + hh * .6) * .05 + sin(uTime * .53 + aCol.y * 1.7 + hh * .31) * .06);' });
    hm.uniforms.uPmin.value = 2; const heat = new THREE.Mesh(HH.build(), hm); heat.frustumCulled = false; heat.renderOrder = 37; heat.name = 'ibex-heat'; scene.add(heat); W.disposables.push(heat.geometry); }
  for (let g = 0; g < 4; g++) { const MK = g < 3 ? W.thermalMK?.[g] : W.ibexMK; if (!MK || !MK.idx.length) continue;
    const mk = new THREE.Mesh(maskGeometry(MK), style.marbleMaterial({ fill: 0, mask: true, maskDepth: THERMAL_CLAIM(g % 3), clear: false, lod: false })); mk.rotation.y = -Math.PI / 2;   // a claim the strata stop at and the columns' own hairs print over
    mk.material.vertexShader = mk.material.vertexShader.replace('vW = w.xyz;', 'vW = w.xyz; vRel.y *= 1. - smoothstep(uv.y * uThm * .8, uv.y * uThm * .95, length(w.xz - uCam.xz));'); mk.material.vertexShader = 'uniform float uThm;\n' + mk.material.vertexShader; mk.material.uniforms.uThm = g < 3 && W.thermalMat ? W.thermalMat.uniforms.uThm : { value: 1 };   // (round 8; round 9: by the range over the ground, as the hairs are, and given up after the last hair has gone) a claim ends where its column's hairs end
    mk.frustumCulled = false; mk.renderOrder = 30; mk.name = 'thermal-claims'; scene.add(mk); if (g < 3 && W.thermalClaims) W.thermalClaims.push(mk); W.disposables.push(mk.geometry); }
  W.cragY = (x, z) => (x > CX0 && x < CX1 && z > CZ0 && z < CZ1 ? cragTop(x, z) : -1e9);
  // breath: one puff every three seconds, growing from the muzzle and thinning out
  const yAxis = new THREE.Vector3(0, 1, 0);
  W.tick.push((dt, time) => {
    for (let i = 0; i < NI; i++) {
      const b = W.ibex[i], ph = ((time + b.phase) % 3) / 3, g = smoothstep(0, 0.45, ph), fadeOut = 1 - smoothstep(0.55, 0.95, ph);
      q.setFromUnitVectors(yAxis, b.fwd); const w = (0.25 + 0.75 * g) * fadeOut * b.sc;
      m.compose(p.copy(b.muzzle).addScaledVector(b.fwd, 0.1 + g * 0.5), q, s.set(0.75 * w, (0.5 + 2.4 * g) * b.sc * (fadeOut > 0 ? 1 : 0), 0.75 * w)); puffs.setMatrixAt(i, m);
    }
    puffs.instanceMatrix.needsUpdate = true;
  });
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE BIRD WE RIDE: a black chough of 5 m span built by the world. Placed from camera.matrixWorld every frame
// (never parented to the camera), wings beating in the valley and fixed on the wave, a vortex thread from each tip.
// ---------------------------------------------------------------------------------------------
async function buildRide(ctx, W) {
  const { style, scene } = W;
  const half = [[0.74, 0], [0.7, 0.012], [0.62, 0.03], [0.55, 0.075], [0.47, 0.1], [0.38, 0.09], [0.3, 0.13], [0.37, 0.42], [0.45, 0.78], [0.5, 1.12], [0.52, 1.36], [0.4, 1.3], [0.36, 1.47], [0.24, 1.36], [0.17, 1.5], [0.07, 1.36], [-0.02, 1.45], [-0.08, 1.28],
    [-0.2, 1.3], [-0.2, 1.05], [-0.3, 0.82], [-0.25, 0.45], [-0.24, 0.14], [-0.5, 0.11], [-0.76, 0.21], [-0.8, 0]];
  const outline = half.concat(half.slice(1, -1).reverse().map(([u, v]) => [u, -v]));
  const SC = 5 / 3, geo = style.cutout(outline, (u, v) => [u * SC, 0.1 * Math.abs(v) * SC, v * SC]);
  const flap = { value: 0 }, lift = { value: 0 };
  const hookO = { flat: true, uniforms: { uFlap: flap }, vertexDecl: 'uniform float uFlap;',
    vertexHook: `float az = abs(pos.z); float bend = uFlap * (az * .42 + az * az * .11); pos.y += bend; pos.z *= 1. - .05 * abs(uFlap) * az; pos.x += .06 * uFlap * az;` };
  const fr = style.fringeMaterial(hookO), bl = style.blackMaterial(hookO); fr.uniforms.uFlap = bl.uniforms.uFlap = flap;
  const bird = style.solid(geo, { flat: true, fringe: fr, black: bl, noCull: true }); bird.name = 'ride-chough';
  // (polish round) THE BIRD FLIES. It was 60 percent of the frame wide at the bottom centre of every frame, like something on the
  // lens. Now it is the chough we follow: ten metres ahead (a quarter of the frame wide at most), low, and never twice in the same
  // place: FLIGHT is its course in the eye's own frame [u, metres right, metres up], it banks into every turn of the route and of
  // its own drift, wanders and bobs with time, flaps in bursts on the climb, rides up the thermal, and sinks below the bottom edge
  // for the reveal at the col and for the ring (one visible flag on the group holding the bird and its two threads).
  // No hair of fringe (polish round, rule 3): a black solid on the field has no outline, the field shows its edge.
  bird.userData.hull.visible = false;
  bl.depthTest = false; bird.userData.body.renderOrder = 111;
  bird.matrixAutoUpdate = false; bird.userData.hull.frustumCulled = bird.userData.body.frustumCulled = false;
  const threads = style.makeThreads(2, { segs: 20, speed: 30, sway: 0.045, renderOrder: 72, rng: ctx.rng.fork('ride'), always: true });
  const rig = new THREE.Group(); rig.name = 'ride'; rig.add(bird, threads); scene.add(rig);
  // (polish round 6) Outside reviewers still saw 'the same flat black bird in the lower centre of all twelve stills'. The course now
  // has a RANGE as well: [u, metres right, metres up, metres ahead] in the eye's frame. The bird is 7 to 17 percent of the frame
  // wide, never twice the same size or place; it comes in from the lower left, crosses climbing to the upper right far ahead, is
  // lifted through the middle in the thermal and circles out over the top edge, comes back in from the left before the col, slides
  // out by the left edge for the reveal, rises in at the lower right in the dive, hangs small over the rotor, and leaves by the
  // right edge before the climb to the ring. It banks and turns its head into every crossing.
  // (round 8) five different pictures to the col: it comes in low left and crosses by the plume (u 0.08), leaves by the right edge and is
  // gone at u 0.16, comes back far and small up the column we fly through (u 0.25), swings in NEAR, a sixth of the frame wide, a third
  // in from the left (u 0.34), slides out left and is back beside the ibex (u 0.43)
  const FLIGHT = [[0, -24, -11, 16], [0.035, -22, -9, 16], [0.08, -8.6, -3.2, 16], [0.128, 28, -1, 18], [0.195, 38, 7, 26], [0.25, -10, 1.5, 30], [0.3, -9, 4, 21], [0.325, -5.2, -0.9, 14], [0.355, -5.6, -0.4, 13.5], [0.395, -25, 4, 14],
    [0.43, -7, -3.2, 14], [0.455, -10, -1.5, 15], [0.49, -25, -5, 14], [0.51, -25, -13, 15],   /* (round 7) it stays in the frame through the last of the climb and leaves by the left edge as the wave comes in */ [0.56, 21, -13, 15], [0.61, 2.6, -2.8, 15], [0.7, 13, -8, 30], [0.79, 17, -6, 30], [0.84, 44, 2, 30], [1, 46, 2, 30]];   // (round 8) in the barrel it is one of the flock, 8 percent of the frame, low right
  const course = (u, o) => {
    let k = 0; while (k < FLIGHT.length - 2 && u > FLIGHT[k + 1][0]) k++;
    const A = FLIGHT[k], B = FLIGHT[k + 1], t = smoothstep(A[0], B[0], u);
    o.x = lerp(A[1], B[1], t); o.y = lerp(A[2], B[2], t); o.d = lerp(A[3], B[3], t); return o;
  };
  const off = new THREE.Matrix4(), rot = new THREE.Matrix4().makeRotationY(Math.PI / 2), mr = new THREE.Matrix4(), mp = new THREE.Matrix4();
  const tipL = new THREE.Vector3(), tipR = new THREE.Vector3(), back = new THREE.Vector3(), d0 = new THREE.Vector3(), d1 = new THREE.Vector3(), camX = new THREE.Vector3(), camY = new THREE.Vector3();
  const c0 = { x: 0, y: 0, d: 16 }, c1 = { x: 0, y: 0, d: 16 }, my = new THREE.Matrix4(), t0 = new THREE.Vector3(), t1 = new THREE.Vector3();
  const TIP = [0.12 * SC, 0.1 * 1.5 * SC, 1.48 * SC], L = W.path.length;
  W.ride = { bird, threads, lift, rig };
  W.rideUpdate = (dt, time, camera, u) => {
    const valley = 1 - smoothstep(0.4, 0.5, u), surf = smoothstep(0.42, 0.56, u);
    // flaps in bursts: coming up into the frame, in the thermal, on the last of the climb; a glide between
    const burst = Math.max(Math.exp(-Math.pow((u - 0.085) / 0.035, 2)), Math.exp(-Math.pow((u - 0.25) / 0.035, 2)), 0.8 * Math.exp(-Math.pow((u - 0.39) / 0.03, 2)), 0.5 * Math.exp(-Math.pow((u - 0.63) / 0.02, 2)));
    const ph = time * TAU * 2.5 + u * 260, beat = Math.sin(ph);
    flap.value = (0.1 + 0.4 * beat) * burst + (1 - burst) * (0.1 + 0.03 * Math.sin(time * 1.3 + u * 30));
    course(u, c0); course(u + 0.012, c1);
    // its own wander (two slow sines each way) and the thermal's lift
    const wx = 0.75 * Math.sin(time * 0.43 + 1.1) + 0.4 * Math.sin(time * 0.97 + u * 9), wy = 0.4 * Math.sin(time * 0.31 + 2.3) + 0.22 * Math.sin(time * 0.79 + u * 7);
    const vx = 0.75 * 0.43 * Math.cos(time * 0.43 + 1.1) + 0.4 * 0.97 * Math.cos(time * 0.97 + u * 9);
    const x = c0.x + wx, y = c0.y + wy + lift.value * 11 - 0.25 * burst * Math.cos(ph);
    // banks into the turn of the route (left turn: right wing up) and into its own drift across the frame
    W.path.tangentAtDist(u * L, t0); W.path.tangentAtDist(Math.min(L, u * L + 34), t1);
    const turn = t0.z * t1.x - t0.x * t1.z;
    const roll = clamp(turn * 1.5 - (c1.x - c0.x) * 0.12 - vx * 0.35, -0.6, 0.6), pitch = 0.34 + clamp((c1.y - c0.y) * 0.1, -0.12, 0.25) + 0.08 * burst + 0.24 * (1 - smoothstep(13, 19, c0.d)) + 0.34 * smoothstep(0.63, 0.7, u);   // (and in the barrel, where it flies further off: level, it was a blade)   // (round 8) when it is near it is tipped further: the whole plan with its fingered tips   // (round 6: it flies further off and nearer the eye's own level, where a flat bird is a line: tipped up a little more, its whole plan shows)
    // (round 9) the tilt is measured from the LINE OF SIGHT, not from the eye's level: four metres above the eye at twenty the fixed pitch left the plan nine degrees open, a blade.
    // 33 degrees and more at any place in the frame, under any camera: the chord is never under a fifth of the span.
    const tilt = Math.max(0.58, pitch) + Math.atan2(y, c0.d);
    rig.visible = Math.abs(x) < 1.07 * c0.d + 4.5 && Math.abs(y) < 0.6 * c0.d + 3.5;
    const yaw = clamp(-(c1.x - c0.x) * 0.09, -0.45, 0.45);   // it flies where it is going: the head turns into a crossing
    off.makeTranslation(x, y, -c0.d).multiply(my.makeRotationY(yaw)).multiply(mr.makeRotationZ(roll)).multiply(mp.makeRotationX(tilt)).multiply(rot);
    bird.matrix.multiplyMatrices(camera.matrixWorld, off); bird.matrixWorld.copy(bird.matrix);
    bird.userData.hull.matrixWorld.copy(bird.matrix); bird.userData.body.matrixWorld.copy(bird.matrix);
    // wingtip threads: short lazy curls in the valley, longer and taut on the wave; they stream back toward the eye and out of the
    // bottom of the frame, so they are kept short (a long pair was two ruler lines across the lower corners)
    const fy = TIP[1] + flap.value * (TIP[2] * 0.42 + TIP[2] * TIP[2] * 0.11);
    tipL.set(TIP[0], fy, -TIP[2]).applyMatrix4(bird.matrix); tipR.set(TIP[0], fy, TIP[2]).applyMatrix4(bird.matrix);
    camX.setFromMatrixColumn(camera.matrixWorld, 0); camY.setFromMatrixColumn(camera.matrixWorld, 1); back.setFromMatrixColumn(camera.matrixWorld, 2);
    // (round 9) two short curved strokes that hang back and down from the tips, 7 percent of the frame long at any range, and are put away (dash by dash) as the bird nears a frame edge:
    // streaming straight back at the eye, a bird at the side of the frame ruled a dead-straight line to the edge
    const pmE = camera.projectionMatrix.elements, edge = 1 - smoothstep(0.62, 0.84, Math.max(Math.abs(x * pmE[0] / c0.d), Math.abs(y * pmE[5] / c0.d)));
    const len = 0.15 * c0.d * lerp(0.85, 1.1, surf), curl = lerp(0.28, 0.14, surf), par = 0.9 * smoothstep(0.6, 0.68, u);   // (round 7) in the pocket the pair streams the way every other bird's does: streaming back at the eye, a bird at the side of the frame ruled a line to its edge   // (round 6) a pair of clean strokes like every other bird's: the curls and the sway were 1 px scribbles
    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1;
      d1.copy(back).multiplyScalar(0.25).addScaledVector(camX, sg * (0.55 + curl) - roll * 0.3).addScaledVector(camY, -0.5 + 0.2 * beat * burst).normalize();
      d0.copy(back).multiplyScalar(0.45).addScaledVector(camX, sg * 0.1).addScaledVector(camY, -0.75).normalize();
      if (par > 0) { d0.multiplyScalar(1 - par); d0.x += THREAD_DIR[0] * par; d0.y += THREAD_DIR[1] * par; d0.normalize(); d1.multiplyScalar(1 - par); d1.x += THREAD_DIR[2] * par; d1.y += THREAD_DIR[3] * par; d1.normalize(); }
      threads.userData.set(s, s ? tipR : tipL, d0, d1, len, edge);
    }
    threads.userData.commit();
  };
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE CAST beside the flock (seeded): a pair of lammergeiers with 9 m spans and long slow threads, or one sailplane.
// ---------------------------------------------------------------------------------------------
async function buildCast(ctx, W) {
  const { style, scene, path, cast } = W, rng = ctx.rng.fork('cast');
  W.castAt = [];
  await nearFlock(ctx, W, rng);
  await figureFlock(ctx, W, ctx.rng.fork('figure-flock'));
  if (cast === 'choughs') return;
  let geo, tip, n, scale, len;
  if (cast === 'lammergeiers') { geo = choughGeometry(style); tip = geo.userData.tip; n = 2; scale = 3; len = 260; }
  else {
    // (round 9) a cut-out sailplane: broad tapered wings and a stout boom (true to scale its wing was a hair of black: seen beside the eye, a spike across the frame's edge)
    const h = [[3.3, 0], [3.0, 0.42], [2.3, 0.62], [2.2, 0.66], [2.0, 2.5], [1.6, 6.0], [1.1, 8.6], [0.3, 9.2], [-0.6, 8.4], [-1.2, 6.0], [-1.6, 2.5], [-1.7, 0.6], [-2.7, 0.36], [-3.3, 0.34], [-3.5, 1.9], [-4.3, 1.9], [-4.45, 0]];
    const o = h.concat(h.slice(1, -1).reverse().map(([u, v]) => [u, -v]));
    const plan = style.cutout(o, (u, v) => [u, 0.05 * Math.abs(v), v]);
    const side = style.cutout([[3.1, 0], [2.6, 0.42], [1.6, 0.62], [0.6, 0.45], [-2.6, 0.18], [-3.2, 0.2], [-3.75, 1.5], [-4.1, 1.5], [-3.9, 0.1], [-3.6, -0.14], [-0.5, -0.5], [1.2, -0.62], [2.5, -0.38]], (u, v) => [u, v, 0]);
    geo = merge([plan, side]); tip = [0.4, 0.45, 9.1]; n = 1; scale = 1.5; len = 300;
  }
  const threads = style.makeThreads(n * 2, { segs: 22, speed: cast === 'lammergeiers' ? 16 : 42, rng }); threads.renderOrder = 61;
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), m = new THREE.Matrix4(), P = new THREE.Vector3(), q = new THREE.Vector3(), d0 = new THREE.Vector3(), d1 = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0.7 : (i ? 0.817 : 0.648), c = path.pointAt(u), tg = path.tangentAt(u), tgl = Math.hypot(tg.x, tg.z) || 1, sd = n === 1 ? 24 : i ? 11 : 9;   // (round 7) the first lammergeier hangs 35 m ahead at the still of u 0.61, whole in the frame (at 0.617 it was a wing cut by the right edge)
    P.set(c.x - tg.z / tgl * sd, c.y + (n === 1 ? 14 : i ? 5 : 17), c.z + tg.x / tgl * sd);
    if (n === 1) P.copy(W.end).add(q.set(115, 50, -180));   // (round 9) the sailplane holds in the wave beyond the ring and right of the exit line: whole in the frame from the dive to the ring, 3 to 6 percent of it wide, never cut by an edge at arm's length
    const sx = rng(), sy = rng();
    const hookO = { flat: true, thin: true, size: 6, uniforms: { uSeed2: { value: new THREE.Vector2(sx, sy) } }, vertexDecl: 'uniform vec2 uSeed2;' + style.sway, vertexPost: 'pos += swSway(uSeed2, uTime);' };
    X.set(-1, 0.12, rng.range(-0.25, 0.25)).normalize(); planToEye(X, Y, Z, P, path.pointAt(n === 1 ? 0.86 : u - 0.04, d0), n === 1 ? 0.3 : 0.45);   /* (round 9) the sailplane too: heading into the wind with its wings north-south it was seen from the south along its span, a blade */   // (round 9) the big birds show their plan like every chough of the barrel (banked 40 degrees they were blots)
    m.makeBasis(X, Y, Z); m.scale(q.set(scale, scale, scale)); m.setPosition(P);
    // the placement is baked into a per-bird geometry, so the hook can sway it in world space
    const g = geo.clone(); g.applyMatrix4(m);
    const nrm = g.attributes.normal; for (let k = 0; k < nrm.count; k++) { q.fromBufferAttribute(nrm, k).normalize(); nrm.setXYZ(k, q.x, q.y, q.z); }
    const nb = style.solid(g, { flat: true, fringe: style.fringeMaterial(hookO), black: style.blackMaterial(hookO), noCull: true });
    nb.name = cast; nb.userData.hull.visible = W.dark; scene.add(nb); W.castAt.push(P.clone());
    const f = W.flow.point(1, W.flow.IDX.trough + 6, P.z); d0.set(THREAD_DIR[0], THREAD_DIR[1], 0).normalize(); d1.set(THREAD_DIR[2], THREAD_DIR[3], 0).normalize(); len = n === 1 ? 14 : 9;   // (round 7) short strokes: at 18 m the wingtip threads ran right across the amber family
    for (let s = 0; s < 2; s++) { q.set(tip[0], tip[1], s ? -tip[2] : tip[2]).applyMatrix4(m); threads.userData.set(i * 2 + s, q, d0, d1, len, 1, [sx, sy]); }
  }
  threads.userData.commit(); scene.add(threads); W.disposables.push(geo);
  await ctx.yield();
}

// A flat bird seen edge-on is a needle (round 7): every big bird is banked so that its plan faces the eye that will look at it. X is
// its heading; the up-axis Y is turned toward the eye (or away, if that keeps the bird the right way up: the cut-out is the same from
// both sides) with a little of the world's up left in, and Z follows.
const _fe = new THREE.Vector3(), _fu = new THREE.Vector3();
function faceEye(X, P, eye, Y, Z, k = 0.4) {   // k 0.4: banked some 40 degrees toward the eye (fully turned, a flock of them stood on their wingtips)
  _fe.subVectors(eye, P).normalize(); _fe.addScaledVector(X, -_fe.dot(X)); if (_fe.lengthSq() < 1e-6) _fe.set(0, 1, 0); _fe.normalize(); if (_fe.y < 0) _fe.negate();
  _fu.set(0, 1, 0).addScaledVector(X, -X.y).normalize();
  Y.copy(_fu).multiplyScalar(0.45).addScaledVector(_fe, k).normalize(); Z.crossVectors(X, Y).normalize(); Y.crossVectors(Z, X);
}

// (round 8) THE PLAN TO THE EYE. Banked 40 degrees, a flat bird seen from behind was a blot ('blobby black shapes that read poorly').
// Every bird of the barrel now shows the eye its PLAN, the way a soaring bird is seen from below: the wings lie across the line of
// sight (level on the screen but for `roll`, which turns the head into the wind), the back or belly faces the eye but for a fifth of
// the world's up, the head points up the frame: two swept wings, body, tail.
const _pe = new THREE.Vector3(), _pu = new THREE.Vector3(0, 1, 0), _pw = new THREE.Vector3();
function planToEye(X, Y, Z, P, eye, roll = 0.5) {
  _pe.subVectors(eye, P).normalize(); if (_pe.y < 0) Y.copy(_pe).negate(); else Y.copy(_pe);
  Y.multiplyScalar(0.85).addScaledVector(_pu, 0.22).normalize();
  Z.crossVectors(_pe, _pu); if (Z.lengthSq() < 1e-6) Z.set(1, 0, 0); Z.normalize(); if (_pe.y < 0) Z.negate();
  _pw.crossVectors(Y, Z).normalize(); Z.multiplyScalar(Math.cos(roll)).addScaledVector(_pw, Math.sin(roll)); Z.addScaledVector(Y, -Z.dot(Y)).normalize();
  X.crossVectors(Y, Z).normalize();
}

// THE FIGURE'S OWN BIRDS (fix round 2): the figure of the wave is ruled in the Horn's plane, two kilometres from the col, where a
// 3 m chough is nothing. Twenty choughs are drawn on that plane at the figure's scale (specks of half to one and a half percent
// of the frame from the col, the lowest the largest), each with its pair of hairs, and grow with the figure (uFigG) as we fly
// in under it: they are what tells the three kilometres.
async function figureFlock(ctx, W, rng) {
  const { style, scene, flow, fig } = W, IDX = fig.IDX, sl = fig.slice(flow.hornZ), Tx = sl.x[IDX.trough], Ty = sl.y[IDX.trough], Hf = 2050 * fig.tall * Math.pow(sl.w, 1.3);
  const N = Math.round(22 * lerp(0.75, 1, (W.detail - 0.5) * 2)), geo = choughGeometry(style), tip = geo.userData.tip;
  const iBird = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); geo.setAttribute('iBird', iBird);
  const hookO = { flat: true, thin: true, size: 40, vertexDecl: 'attribute vec4 iBird; uniform vec2 uFigT; uniform vec3 uFigG;' + style.sway,
    vertexHook: `float rl = sin(uTime * (.4 + iBird.x * .3) + iBird.y * 30.) * .26; float cr = cos(rl), sr = sin(rl); pos.yz = vec2(pos.y * cr - pos.z * sr, pos.y * sr + pos.z * cr); nrm.yz = vec2(nrm.y * cr - nrm.z * sr, nrm.y * sr + nrm.z * cr);`,
    vertexPost: 'pos += swSway(iBird.xy, uTime * .6) * 9.; pos.xy = uFigT + (pos.xy - uFigT) * uFigG.x;' };
  const flock = style.solid(geo, { flat: true, instances: N, fringe: style.fringeMaterial(hookO), black: style.blackMaterial(hookO) }); flock.name = 'figure-choughs';
  const threads = style.makeThreads(N * 2, { segs: 16, speed: 420, sway: 9, rng, always: true }); threads.renderOrder = 63;
  const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3(), q = new THREE.Vector3(), d0 = new THREE.Vector3(THREAD_DIR[0], THREAD_DIR[1], 0).normalize(), d1 = new THREE.Vector3(THREAD_DIR[2], THREAD_DIR[3], 0).normalize();
  const eyeB = W.path.pointAt(0.66);
  for (let i = 0; i < N; i++) {
    // loose tiers round the hollow of the wave, from under the lip (upper left) down its rising face to the trough
    const tier = i % 5, fy = [0.16, 0.36, 0.58, 0.82, 1.02][tier] + rng.range(-0.06, 0.06), span = [[-0.12, 0.5], [-0.22, 0.62], [-0.28, 0.66], [-0.22, 0.58], [-0.1, 0.42]][tier];
    P.set(Tx + lerp(span[0], span[1], (Math.floor(i / 5) + rng()) / Math.ceil(N / 5)) * Hf, Ty + fy * Hf, flow.hornZ + rng.range(-40, 40));
    const low = 1 - clamp((P.y - Ty) / (1.1 * Hf), 0, 1), sc = lerp(7, 19, low * low) * rng.range(0.85, 1.15) * (Hf / 943) ** 0.5, sx = rng(), sy = rng();
    planToEye(X, Y, Z, P, eyeB, 0.55 + rng.range(-0.4, 0.4));
    m.makeBasis(X, Y, Z); m.scale(q.set(sc, sc, sc)); m.setPosition(P); flock.userData.setMatrixAt(i, m); iBird.setXYZW(i, sx, sy, 0, 0);
    for (let s2 = 0; s2 < 2; s2++) { q.set(tip[0], tip[1], s2 ? -tip[2] : tip[2]).applyMatrix4(m); threads.userData.set(i * 2 + s2, q, d0, d1, sc * 5.5, 2, [sx, sy]); }   // strength 2: grows with the figure
  }
  flock.userData.hull.visible = W.dark;   // (round 6) no hair on the near choughs either, except in dark-field where the hair is all that shows a bird: under a wing seen edge-on the hull printed a white slab bigger than the wing
  flock.userData.commit(); threads.userData.commit(); scene.add(flock, threads); W.figFlock = flock; W.figThreads = threads;
  await ctx.yield();
}

// the near tier of the flock: choughs holding station 15 to 60 m off the line of flight along the foot of the face, on its
// field side (never against the Horn), each wingtip ruling a thread up the local streamline
async function nearFlock(ctx, W, rng) {
  const { style, scene, path, flow, end, dir } = W;
  const N = Math.round(46 * clamp(W.density, 0.8, 1.2) * lerp(0.7, 1, (W.detail - 0.5) * 2)), geo = choughGeometry(style), tip = geo.userData.tip;
  const NE = 4;   // the escorts: four choughs that surf along with us in the pocket (set every frame in W.escortUpdate)
  // The seeds' buffer holds the escorts too. It held N birds, and where every bird found its place (placed = N; with one to three unplaced, the last
  // escorts' alone) the escorts' seeds, dealt below, were written past its end and lost: the four escorts then drew their sideslip from whatever lay beyond
  // the buffer, another picture at every load (and a draw a stricter graphics driver may refuse whole).
  const iBird = new THREE.InstancedBufferAttribute(new Float32Array((N + NE) * 4), 4); geo.setAttribute('iBird', iBird);
  const hookO = { flat: true, thin: true, size: 3, vertexDecl: 'attribute vec4 iBird;' + style.sway,
    vertexHook: `float rl = sin(uTime * (.5 + iBird.x * .4) + iBird.y * 30.) * .24 + sin(uTime * 1.7 + iBird.x * 50.) * .07;
      float cr = cos(rl), sr = sin(rl); pos.yz = vec2(pos.y * cr - pos.z * sr, pos.y * sr + pos.z * cr); nrm.yz = vec2(nrm.y * cr - nrm.z * sr, nrm.y * sr + nrm.z * cr);`,
    vertexPost: 'pos += swSway(iBird.xy, uTime);' };
  const flock = style.solid(geo, { flat: true, instances: N + NE, fringe: style.fringeMaterial(hookO), black: style.blackMaterial(hookO) }); flock.name = 'near-choughs';
  const threads = style.makeThreads((N + NE) * 2, { segs: 18, speed: 42, rng }); threads.renderOrder = 62;
  const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3(), q = new THREE.Vector3(), d0 = new THREE.Vector3(), d1 = new THREE.Vector3(), ab = new THREE.Vector3();
  let placed = 0, tries = 0; W.nearBirds = [];
  while (placed < N && tries < N * 3) {
    tries++;
    // tier A (every other bird): 7 to 17 m right of the line of flight and a little above it, so each fills a tenth of the frame
    // as we come up on it; tier B: 26 to 75 m out toward the face. One every 12 m of the run, so three depths are always in view.
    const slot = tries - 1, u = lerp(0.56, 0.9, ((slot % N) + rng()) / N), c = path.pointAt(u), tg = path.tangentAt(u), tierA = slot % 2 === 0;
    const tgl = Math.hypot(tg.x, tg.z) || 1, rx = -tg.z / tgl, rz = tg.x / tgl;   // the bird's right, level
    const off = tierA ? rng.range(15, 25) : rng.range(30, 76), hgt = tierA ? rng.range(3, 9) : rng.range(2, 32);   // (round 8) tier A stands 15 to 25 m out: a chough we pass is 8 percent of the frame at most
    const fw = tierA ? 0 : rng.range(0, 40), sd = off + (u > 0.78 ? 10 : 0); P.set(c.x + rx * sd + tg.x / tgl * fw, c.y + hgt, c.z + rz * sd + tg.z / tgl * fw);
    const sx = rng(), sy = rng(), yaw = rng.range(-0.35, 0.35), sc = rng.range(1.35, 1.85);
    if (path.distanceTo(P.x, P.y, P.z) < 6.5 || P.y < W.ground(P.x, P.z) + 6) continue;
    if ([0.648, 0.7, 0.817].some((cu) => path.pointAt(cu, q).distanceTo(P) < 24)) continue;   // no near chough over a cast bird: black on black is only a white outline
    if (u < 0.72 && W.lensAt && W.lensAt.some((Lc) => [0.57, 0.59, 0.61, 0.63, 0.645].some((eu) => { path.pointAt(eu, q); ab.subVectors(P, q).normalize(); d0.subVectors(Lc, q).normalize(); return ab.dot(d0) > 0.975; }))) continue;   // (round 7) no near chough across a lens as the reveal is held: the lenses stay whole
    q.subVectors(P, end); ab.copy(dir); const h = q.dot(ab); if (h > -130 && q.addScaledVector(ab, -h).length() < 30) continue;      // keep the exit line clear
    const L = flow.sheetLine(1, P.z); let bi = flow.IDX.crest + 2, bd = 1e9;
    for (let i = flow.IDX.crest + 2; i < flow.IDX.face + 8; i++) { const d = Math.abs(L.x[i] - P.x) + Math.abs(L.y[i] - P.y) * 0.3; if (d < bd) { bd = d; bi = i; } }
    const j = Math.min(bi + 5, flow.NS - 2);
    let tx = L.x[bi + 1] - L.x[bi - 1], ty = L.y[bi + 1] - L.y[bi - 1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
    let ux = L.x[j + 1] - L.x[j - 1], uy = L.y[j + 1] - L.y[j - 1]; const ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
    planToEye(X, Y, Z, P, path.pointAt(Math.max(0.5, u - 0.05), ab), 0.5 + yaw);   // (round 8) wings square to the line of flight (heading upwind they were seen from the wingtip: blobs), the back tipped toward the eye that comes up on it
    m.makeBasis(X, Y, Z); m.scale(q.set(sc, sc, sc)); m.setPosition(P);
    flock.userData.setMatrixAt(placed, m); iBird.setXYZW(placed, sx, sy, 0, 0);
    d0.set(THREAD_DIR[0], THREAD_DIR[1], 0).normalize(); d1.set(THREAD_DIR[2], THREAD_DIR[3], 0).normalize();   // (the local streamline gave strokes at every angle)
    for (let s2 = 0; s2 < 2; s2++) { q.set(tip[0], tip[1], s2 ? -tip[2] : tip[2]).applyMatrix4(m); threads.userData.set(placed * 2 + s2, q, d0, d1, lerp(0.4, 0.75, (rng.range(40, 75) - 40) / 35) * clamp(sd * 0.3, 4, 12), tierA ? 1 : 0, [sx, sy]); }   // (round 9) a stroke is 8 percent of the frame at most when its bird is beside us   // (round 8) only the near tier rules strokes: beside a far bird a pair was a torn two-colour scrap
    W.nearBirds.push(P.clone()); placed++;
    if (placed % 4 === 0) await ctx.yield();
  }
  flock.userData.hull.count = flock.userData.body.count = placed + NE; threads.geometry.instanceCount = (placed + NE) * 2;
  // THE ESCORTS: [metres ahead, right, up (in the frame of the eye-to-pocket line), scale]. Two fill an eighth of the frame, two a
  // twentieth; they come up from behind as we dive under the lip and fall away to the right before the climb to the ring.
  const ESC = [[27, 9.5, 4.4, 1.35], [36, 15.5, -4.5, 1.6], [52, 3, 10.5, 1.9], [74, 34, -2, 2.0]];   // (round 8) the nearest three are 5 to 7 percent of the frame wide, each on field of its own (at 11 to 14 percent they overlapped: one black blot)   // none on the line from the eye to the ring
  const cp = new THREE.Vector3(), fd = new THREE.Vector3(), rt = new THREE.Vector3(), upv = new THREE.Vector3(), Yw = new THREE.Vector3(0, 1, 0);
  const escSeed = [];
  for (let e = 0; e < NE; e++) { escSeed.push([rng(), rng()]); m.makeScale(0, 0, 0); flock.userData.setMatrixAt(placed + e, m); iBird.setXYZW(placed + e, escSeed[e][0], escSeed[e][1], 0, 0); for (let s2 = 0; s2 < 2; s2++) threads.userData.set((placed + e) * 2 + s2, P.set(0, -9999, 0), d0, d1, 1, 0, [rng(), rng()]); }
  W.escortUpdate = (camera, u, time) => {
    const on = u > 0.56 && u < 0.985;
    cp.setFromMatrixPosition(camera.matrixWorld); fd.subVectors(W.pocket, cp).normalize(); rt.crossVectors(fd, Yw).normalize(); upv.crossVectors(rt, fd);
    for (let e = 0; e < NE; e++) {
      const E = ESC[e], k = placed + e;
      const come = smoothstep(0.585 + e * 0.012, 0.675 + e * 0.012, u), go = smoothstep(0.83 + e * 0.01, 0.95, u);
      if (!on || come <= 0) { m.makeScale(0, 0, 0); flock.userData.setMatrixAt(k, m); for (let s2 = 0; s2 < 2; s2++) threads.userData.set(k * 2 + s2, P.set(0, -9999, 0), d0, d1, 1, 0); continue; }
      const ah = lerp(E[0] + 150, E[0], come) + go * 60, rr = lerp(E[1] * 3 + 8, E[1], come) + go * (40 + e * 9) + Math.sin(time * 0.37 + e * 2.1) * 0.9, uu = lerp(E[2] + 16, E[2], come) - go * (22 + e * 6) + Math.sin(time * 0.29 + e) * 0.7;   // (round 9) we come up on them: they were brought in from six metres BEHIND the eye, and a wing passing the frame's right edge at arm's length was a black spike
      P.copy(cp).addScaledVector(fd, ah).addScaledVector(rt, rr).addScaledVector(upv, uu);
      planToEye(X, Y, Z, P, cp, 0.5 + 0.3 * Math.sin(e * 1.7 + 0.4) + 0.08 * Math.sin(time * 0.6 + e * 2.3));
      m.makeBasis(X, Y, Z); m.scale(q.set(E[3], E[3], E[3])); m.setPosition(P); flock.userData.setMatrixAt(k, m);
      d0.set(THREAD_DIR[0], THREAD_DIR[1], 0).normalize(); d1.set(THREAD_DIR[2], THREAD_DIR[3], 0).normalize();
      for (let s2 = 0; s2 < 2; s2++) { q.set(tip[0], tip[1], s2 ? -tip[2] : tip[2]).applyMatrix4(m); threads.userData.set(k * 2 + s2, q, d0, d1, E[3] * (E[0] < 30 ? 2.2 : 3.2), 1, escSeed[e]); }   // (round 7) the thread sideslips with its own bird: with a seed of its own it wandered off the wingtip
    }
    flock.userData.commit(); threads.userData.commit();
  };
  flock.userData.hull.visible = W.dark; W.nearFlockG = flock;   // (round 7) no hair on any chough (dark-field apart): the hull under a tilted wing was a white slab
  flock.userData.commit(); threads.userData.commit(); scene.add(flock, threads);
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE RARE EVENT, the wave breaks: the top of the crest overturns into a row of seven cat's-eye billows, amber outside
// and blue inside, rolling along it; choughs scatter up through them. Everything is built hidden and keyed to u.
// ---------------------------------------------------------------------------------------------
async function buildEvent(ctx, W) {
  const { style, scene, rare } = W, rng = ctx.rng.fork('event');
  W.eventUpdate = null;
  if (!rare) return;
  // Each billow is a cat's eye WOUND FROM STREAMLINES: two hair lines enter from its neighbours (one over the top, one under the
  // bottom) and coil inward, amber on the outer turns and ultramarine on the inner, round a small eye of curdled air. Neighbours
  // share the points where their lines begin, so the seven rolls are one linked chain along the overturning crest.
  const NB = 7, TURNS = 2.3, NPT = 110, XS = 1.08, YS = 0.95;
  const pos = [], tan = [], rule = [], lod = [], kind = [], idx = [];
  for (let arm = 0; arm < 2; arm++) {
    const base = pos.length / 3; let len = 0, px = 0, py = 0;
    for (let j = 0; j <= NPT; j++) {
      const t = j / NPT, phi = t * TURNS * TAU, r = Math.pow(1 - 0.88 * t, 0.9), a = Math.PI - phi + arm * Math.PI;   // clockwise from the left (arm 0) or the right (arm 1)
      const x = Math.cos(a) * r * XS, y = Math.sin(a) * r * YS, e = 1e-3, t2 = t + e, r2 = Math.pow(1 - 0.88 * t2, 0.9), a2 = Math.PI - t2 * TURNS * TAU + arm * Math.PI;
      let tx = Math.cos(a2) * r2 * XS - x, ty = Math.sin(a2) * r2 * YS - y; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      if (j) len += Math.hypot(x - px, y - py); px = x; py = y;
      const g = clamp((r - 0.5) * 6, -1, 1), fade = smoothstep(0, 0.04, t) * (1 - smoothstep(0.9, 1, t));
      for (let s = 0; s < 2; s++) { pos.push(x, y, 0); tan.push(tx, ty); rule.push(len * 110, g, fade, s ? 1 : -1); lod.push(1e9, 0.37 + arm * 0.31, 0); kind.push(2); }
    }
    for (let j = 0; j < NPT; j++) { const p = base + j * 2; idx.push(p, p + 1, p + 3, p, p + 3, p + 2); }
  }
  const coil = new THREE.BufferGeometry();
  coil.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); coil.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 2)); coil.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  coil.setAttribute('aRule', new THREE.Float32BufferAttribute(rule, 4)); coil.setAttribute('aLod', new THREE.Float32BufferAttribute(lod, 3)); coil.setIndex(idx);
  const coilMat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0, speed: 80 });
  // the eye: a small disc of curdled ultramarine
  const ep = [], en = [], eu = [], er = [], ei = [], ER = 0.2, EN = 20;
  for (let j = 0; j <= 3; j++) for (let i = 0; i <= EN; i++) { const rho = j / 3, th = (i / EN) * TAU; ep.push(Math.cos(th) * rho * ER * XS, Math.sin(th) * rho * ER * YS, 0); en.push(0, 0, 1); eu.push(Math.cos(th) * rho * 1.3, Math.sin(th) * rho * 1.3); er.push(-0.75 + 0.5 * Math.cos(th) * rho, 1 - smoothstep(0.55, 1, rho), 0.1); }
  for (let j = 0; j < 3; j++) for (let i = 0; i < EN; i++) { const p = j * (EN + 1) + i; ei.push(p, p + 1, p + EN + 2, p, p + EN + 2, p + EN + 1); }
  const eyeGeo = new THREE.BufferGeometry();
  eyeGeo.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3)); eyeGeo.setAttribute('normal', new THREE.Float32BufferAttribute(en, 3));
  eyeGeo.setAttribute('uv', new THREE.Float32BufferAttribute(eu, 2)); eyeGeo.setAttribute('aRel', new THREE.Float32BufferAttribute(er, 3)); eyeGeo.setIndex(ei);
  const eyeMat = style.marbleMaterial({ seed: rng.range(0, 30), fill: 1, relief: 1, curdle: 0.9, warp: 0.6, soft: [0.3, 0.55], clear: false, lod: false, hard: true });
  const maskGeo = new THREE.CircleGeometry(1.2, 28); maskGeo.setAttribute('aRel', new THREE.Float32BufferAttribute(new Float32Array(maskGeo.attributes.position.count * 3).map((v, i) => (i % 3 === 1 ? 1 : 0)), 3));
  const maskMat = style.marbleMaterial({ fill: 0, mask: true, clear: false, lod: false }); W.disposables.push(maskGeo);
  // the row: along the overturning top of the crest, on a sphere 1500 m from the foot of the face, up and to the RIGHT of the
  // line of flight (the exit line and the ring keep their clear field), each roll bigger than the last
  const eye = new THREE.Vector3(210, 170, -330), D = 1500, AZ0 = EVENT_ROW[0], EL0 = EVENT_ROW[1], AZ1 = EVENT_ROW[2], EL1 = EVENT_ROW[3];
  const Rb = [], sAt = []; let total = 0;
  for (let b = 0; b < NB; b++) { Rb.push(lerp(105, 185, b / (NB - 1))); if (b) total += (Rb[b - 1] + Rb[b]) * 1.0; sAt.push(total); }
  const billows = []; W.billowsAt = [];
  // the row drifts downwind (to the right of the line of flight) as it rolls, so by the time the climb brings the ring up to
  // its height it stands well clear of the ring
  const place = (gr, f, slide) => { const az = lerp(AZ0, AZ1, f) + slide, el = lerp(EL0, EL1, f);
    gr.position.set(eye.x + D * Math.cos(el) * Math.sin(az), eye.y + D * Math.sin(el), eye.z - D * Math.cos(el) * Math.cos(az)); gr.lookAt(eye); };
  for (let b = 0; b < NB; b++) {
    const f = sAt[b] / total, gr = new THREE.Group(), spin = new THREE.Group();
    place(gr, f, 0);
    const c = new THREE.Mesh(coil, coilMat), e = new THREE.Mesh(eyeGeo, eyeMat); c.frustumCulled = e.frustumCulled = false; c.renderOrder = 11; e.renderOrder = 11;   // before the rotor: its cells may lie over a coil, but its body does not blank the row
    const mk = new THREE.Mesh(maskGeo, maskMat); mk.frustumCulled = false; mk.renderOrder = 11.5; gr.add(mk);   // after its own coil, before the figure's hairs: the crest's lines stop at the roll
    spin.add(c, e); gr.add(spin); gr.visible = false; gr.scale.setScalar(0.001); scene.add(gr); billows.push({ gr, spin, R: Rb[b], f }); W.billowsAt.push(gr.position.clone());
  }
  W.billowAt = W.billowsAt[3]; W.disposables.push(coil, eyeGeo);
  await ctx.yield();
  // the scatter: choughs (big enough to read at 300 m) climbing out of the face toward the billows
  const NS = 22, cg = choughGeometry(style), flapO = { flat: true, thin: true, size: 6, vertexDecl: 'attribute float iPh;', vertexHook: 'pos.y += sin(uTime * 13. + iPh * 40.) * abs(pos.z) * .45;' };
  cg.setAttribute('iPh', new THREE.InstancedBufferAttribute(Float32Array.from({ length: NS }, () => rng()), 1));
  const scat = style.solid(cg, { flat: true, instances: NS, fringe: style.fringeMaterial(flapO), black: style.blackMaterial(flapO) }); scat.visible = false; scat.userData.hull.visible = W.dark; scene.add(scat);
  const seeds = []; for (let i = 0; i < NS; i++) seeds.push([rng.range(300, 470), rng.range(170, 300), rng.range(-420, -760), rng.range(0.6, 1.3), rng() * TAU, rng.range(4.5, 8)]);
  const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), P = new THREE.Vector3(), S = new THREE.Vector3();
  const U0 = 0.6, U1 = 0.97;
  W.eventUpdate = (dt, time, u) => {
    const e = clamp((u - U0) / (U1 - U0), 0, 1), on = u > U0 - 0.01, slide = 0.75 * smoothstep(0.8, 0.9, u);
    scat.visible = on;
    for (let b = 0; b < NB; b++) {
      const B = billows[b]; B.gr.visible = on; if (!on) continue;
      // the crest overturns roll by roll, from the Horn outward; each one keeps turning over
      const grow = smoothstep(b * 0.045, b * 0.045 + 0.2, e), sc = Math.max(0.001, B.R * (0.25 + 0.75 * grow) * (grow > 0 ? 1 : 0.001));
      place(B.gr, B.f, slide); B.gr.scale.set(sc, sc, sc); B.spin.rotation.z = b * 0.9 + time * 0.3 + (1 - grow) * 5;
    }
    if (!on) return;
    for (let i = 0; i < NS; i++) {
      const s = seeds[i], k = smoothstep(0, 1, clamp(e * 1.25 - i * 0.012, 0, 1)), a = s[4] + time * 0.35 * s[3];
      P.set(s[0] + Math.cos(a) * 14 + k * 230, s[1] + k * 420 * s[3], s[2] - k * 200 + Math.sin(a) * 14);
      X.set(-0.8 + 0.3 * Math.cos(a), 0.35 + 0.5 * k, -0.4 + 0.3 * Math.sin(a)).normalize(); Y.set(0, 1, 0); Z.crossVectors(X, Y).normalize(); Y.crossVectors(Z, X);
      m.makeBasis(X, Y, Z); m.scale(S.setScalar(s[5])); m.setPosition(P); scat.userData.setMatrixAt(i, m);
    }
    scat.userData.commit();
  };
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE STRATA OVER THE CREST (fix round 3): what the cirque sees of the flow. ONE family of nested streamlines in one plane just
// beyond the crest, so from anywhere west of the ridge they are parallel: packed 7 m apart where the air squeezes over the col,
// opening to 25 m and more either side and upward, following the smoothed skyline below and flattening with height; ultramarine
// where a line falls, amber where it rises, dashes sliding along. They come down to meet us on the climb and are put away, dash
// by dash, as the eye turns to the wave (uLane). Thermals, the plume and the lenses stand in front of them (claims).
// ---------------------------------------------------------------------------------------------
async function buildStrata(ctx, W) {
  const { style, scene, ground, detail } = W, XS = 46, Z0 = -1050, Z1 = 1050, DZ = 12.5, NZ = Math.round((Z1 - Z0) / DZ);
  const raw = new Float32Array(NZ + 1), sm = new Float32Array(NZ + 1);
  for (let i = 0; i <= NZ; i++) { const z = Z0 + i * DZ; let m = -1e9; for (let x = -45; x <= 45; x += 15) m = Math.max(m, ground(x, z)); raw[i] = m; if (i % 40 === 39) await ctx.yield(); }
  const SIG = 150 / DZ, KR = Math.ceil(SIG * 2.6);
  for (let i = 0; i <= NZ; i++) { let a = 0, w = 0; for (let k = -KR; k <= KR; k++) { const g = Math.exp(-0.5 * (k / SIG) * (k / SIG)); a += raw[clamp(i + k, 0, NZ)] * g; w += g; } sm[i] = a / w + 15; }
  await ctx.yield();
  const iCol = Math.round(-Z0 / DZ), yCol = sm[iCol], NL = Math.max(16, Math.round(24 * detail)), HB = hairBuilder();
  let d = 12;
  for (let m = 0; m < NL; m++) {
    const flat = 1 - Math.exp(-d / 520), P = [], Y = new Float32Array(NZ + 1);
    for (let i = 0; i <= NZ; i++) { const z = Z0 + i * DZ, zc = z - 0.11 * d, sq = lerp(0.3, 1, 1 - Math.exp(-(zc / 450) * (zc / 450)));   /* the squeeze leans south with height: the turn from falling to rising ink is a slanted curve, not a ruled seam */ Y[i] = lerp(sm[i], yCol + (sm[i] - yCol) * 0.25, flat) + d * sq; P.push([z, Y[i], -XS]); }
    HB.add(P, { g: (j) => (Y[Math.min(NZ, j + 1)] - Y[Math.max(0, j - 1)] >= 0 ? 0.5 : -0.5), fade: (j) => smoothstep(0, 8, j) * smoothstep(0, 8, NZ - j) * (m < 7 ? 1 - smoothstep(190 + 30 * m, 330 + 30 * m, Math.abs(Z0 + j * DZ)) : 1), seed: (0.11 + m * 0.047) % 1, kind: 0 });   // the lowest seven run only over the col: along the saddle the far thermals stand in front of them and chopped them into rows of dashes
    d += 22 * Math.pow(1.085, m);
    if (m % 6 === 5) await ctx.yield();
  }
  const mesh = new THREE.Mesh(HB.build(), style.ruleMaterial({ line: 1, width: 0.0045, breathe: 1.5, speed: 140, period: 0.2, claim: 0.9999985 })   /* (fix 4) three or four gaps on every hair, crossing the frame from left to right in about ten seconds */);
  mesh.rotation.y = -Math.PI / 2; mesh.frustumCulled = false; mesh.renderOrder = 34; mesh.name = 'strata'; scene.add(mesh); W.disposables.push(mesh.geometry);
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// AIR NEXT TO THE EYE (fix round 3, the review's move to nine): from the col onward the sheet we fly in is ruled within metres of
// the bird. The route IS a streamline of that sheet, so its neighbours are the route's own offset curves: four hairs of the sheet
// above, passing over the top edge, and the sheet below fanning forward under the wings (mostly the right wing: the Horn and its
// black flank are on the left). Each is ruled only within 70 m of the eye (on or off, in dashes), so they stream past like rails
// and end long before the figure, the pocket and the ring; ultramarine down the dive, amber up the face, like the figure's own.
// ---------------------------------------------------------------------------------------------
async function buildRails(ctx, W) {
  const { style, scene, path } = W, uCol = path.nearestXZ(0, 0).u, UA = uCol - 0.1, UB = uCol + 0.045, L = path.length, STEP = 2.5;
  // (a) OVER THE COL the flow runs the way we fly, so the sheet's streamlines are the route's own offset curves; they run to the
  // point we are flying at, which stands at the right of the frame once the eye is turned on the figure.
  // (polish round, the review's move to nine) THE SHEET JUST OVERHEAD: six hairs 6 to 8 m above the route and from over it to
  // 9 m south, snaking together, ruled only within some 22 m of the eye. Overhead they are outside the top edge; they come into the frame over it between
  // the hook and the right edge and run down toward the point we are flying at (which stands at the right, the eye being turned on
  // the figure), closing on one another, and break into dashes long before the lens. Two of the sheet below pass under where
  // the bird was. Near, middle and far by the grain of the air: these streak past while the wave stands.
  // Each is ruled within 2.7 times its height: there it stands 22 degrees over the horizon, above the lens it runs
  // toward, and has been breaking into dashes since 32 degrees. They end at the col: run on east, the ones north of the route lay
  // upper left once we sank under them, across the plunge and the hook.
  const UC = uCol + 0.024, UA2 = uCol - 0.17, RAILS = [   /* (round 6) the six hairs of the sheet overhead are buildOverhead's now: 6 m up, only ten metres of each were ever inside the frame, three blunt strokes */ [7, -5.5, uCol - 0.09, uCol + 0.006, 38], [11.5, -6.6, uCol - 0.09, uCol + 0.006, 38]];
  // past the col the sheet does not turn north with us: it runs on downwind and begins its plunge, so as the eye swings to the figure
  // its hairs pass overhead and out by the right edge (following the route they swung across the hook)
  const dCol = uCol * L, CC = new THREE.Vector3(), TC = new THREE.Vector3(); path.posAtDist(dCol, CC); path.tangentAtDist(dCol, TC); TC.y = 0; TC.normalize();
  const HB = hairBuilder(), T = new THREE.Vector3(), R = new THREE.Vector3(), Uv = new THREE.Vector3(), C = new THREE.Vector3(), YU = new THREE.Vector3(0, 1, 0);
  for (let r = 0; r < RAILS.length; r++) {
    const [rr, hh, u0, u1, far] = RAILS[r], n = Math.ceil((u1 - u0) * L / STEP), P = [], G = [];
    for (let j = 0; j <= n; j++) {
      const dd = (u0 + (u1 - u0) * j / n) * L, ov = dd - dCol;
      if (ov > 0) { C.copy(CC).addScaledVector(TC, ov); C.y -= 0.0035 * ov * ov; T.copy(TC); T.y = -0.007 * ov; T.normalize(); } else { path.posAtDist(dd, C); path.tangentAtDist(dd, T); }
      R.crossVectors(T, YU).normalize(); Uv.crossVectors(R, T);
      const sqz = hh > 0 ? 1 + 0.3 * Math.min(1, (C.x / 85) * (C.x / 85)) : 1 + 0.55 * Math.min(1, (C.x / 95) * (C.x / 95));   // the sheets squeeze together over the col and open either side: the hairs are bowed, not ruled
      const wv = hh > 0 ? 1.5 * Math.sin(dd * 0.2 + 0.8) : 0.8 * Math.sin(dd * 0.16), wu = hh > 0 ? 0.7 * Math.sin(dd * 0.13) : 0, ro = rr * sqz + wv, ho = hh * sqz + wu;   // the sheet's hairs snake together (one phase: parallel, never crossing): ruled dead straight they were rays from a point
      P.push([C.x + R.x * ro + Uv.x * ho, C.y + R.y * ro + Uv.y * ho, C.z + R.z * ro + Uv.z * ho]); G.push(ov > -18 ? -0.5 : 0.5);   // ultramarine where the sheet is about to fall
    }
    HB.add(P, { g: (j) => G[j], fade: (j) => smoothstep(0, 10, j) * smoothstep(0, 10, n - j), far, seed: (0.07 + r * 0.173) % 1, kind: 1 });
  }
  await ctx.yield();
  // (b) IN THE SURF we fly north up the barrel with the eye on the pocket. The air next to us is ruled as the barrel's own hoops:
  // every 11 m of the run three arcs of circles about the line from the eye to the pocket, 30, 36 and 43 m out, from under the
  // right wing up the right side, amber like the figure's rising face beside them. Each is ruled
  // only while it stands 28 degrees and more off the pocket (where the figure's widest hairs run), so on screen the near arcs are concentric
  // with the figure, lie outside it, and slide out past the frame's right edge: six or so at any moment, none across the pocket,
  // the Horn or the plunge (the arcs stop short of the left).
  const sA = (uCol + 0.145) * L, sB = 0.9 * L, NH = Math.floor((sB - sA) / 11), NPH = 36, PH0 = 0.6, PH1 = W.rare ? 1.8 : 2.3,   /* (from where the figure has grown to the wave's size: before that its hook stands where these arcs pass) */ A = new THREE.Vector3(), Ce = new THREE.Vector3();
  for (let k = 0; k <= (W.weather === 'storm' ? -1 : NH); k++) {   // (round 6) none in a storm: cut by the deeper rotor's claim they printed a patch of ruled bars under the billows
    const dd = sA + k * 11; if (dd > 0.73 * L) break;   /* (round 9) none on the run north itself: turned up the face the eye saw them from the side, ellipses across the face's own hairs (buildFace is the air next to the eye there) */ path.posAtDist(dd, C); path.tangentAtDist(dd, T); A.set(450, 560, W.flow.hornZ).sub(C).normalize();   // (the pocket the eye rests on: W.pocket in finish)
    Ce.copy(C).addScaledVector(A, 40).addScaledVector(T, -40);   // seen from 40 m back the centre lies on the line to the pocket
    R.crossVectors(A, YU).normalize(); Uv.crossVectors(R, A);
    const edge = smoothstep(0, 3, k) * smoothstep(0, 3, NH - k);
    for (let h = 0; h < 3; h++) {
      const rad = [30, 36, 43][h], P = [];
      for (let j = 0; j <= NPH; j++) { const ph = lerp(PH0, PH1, j / NPH), sn = Math.sin(ph) * rad, cs = -Math.cos(ph) * rad; P.push([Ce.x + R.x * sn + Uv.x * cs, Ce.y + R.y * sn + Uv.y * cs, Ce.z + R.z * sn + Uv.z * cs]); }
      HB.add(P, { g: () => 0.5, fade: (j) => edge * smoothstep(0, 5, j) * smoothstep(0, 7, NPH - j), far: rad * 1.75   /* (round 8) ruled a little nearer: they pass the right edge and are gone before they stand across the sections of the barrel */, seed: (0.31 + k * 0.137 + h * 0.29) % 1, kind: 1 });
    }
    if (k % 6 === 5) await ctx.yield();
  }
  const mesh = new THREE.Mesh(HB.build(), style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0.4, speed: 40, t3: true,
    hook: 'float nk = step(aLod.x, 30.); p.z += nk * .6 * sin(uTime * 2.1 - position.x * .19); p.y += nk * .3 * sin(uTime * 1.6 - position.x * .13 + 1.);' }));   // the sheet overhead (the hairs ruled within 30 m) ripples: a wave runs down them with the wind
  mesh.frustumCulled = false; mesh.renderOrder = 35; mesh.name = 'near-air'; scene.add(mesh); W.disposables.push(mesh.geometry);
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE REVEAL'S NEAR AND FAR (polish round 6, the review's move to nine). From the last of the climb to the col the hook stood alone
// like a glyph on the glass. Two things now tell its three kilometres:
// (a) THE SHEET OVERHEAD: six hairs of the stream-sheet 45 m over the line of flight, running downwind, drawn together toward the
// col and snaking as one. Each is ruled only where it stands 35 degrees and more over the horizon ahead (within 90 m), so on screen
// it comes in over the top edge between the hook and the right edge, bows, closes on its neighbours and ends in dashes above the
// lens; its dashes are 10 m long and stand almost still in the air, so they streak toward the eye at our own speed (two gaps a
// second on a pixel: under the three-a-second rule), many times faster than any gap on the figure. Falling ink: the sheet is about
// to plunge. (At 6 m up, as before, only ten metres of a hair were ever in frame: three blunt strokes.)
// (b) THE TRAIN: three low round crests of four nested hairs each, receding to the right under the lens (the old one was drawn
// in a plane seen almost edge-on: a pulse trace). Amber up each face, ultramarine down each back, each smaller and lower than the last.
// ---------------------------------------------------------------------------------------------
// THE FRAME OF THE REVEAL: where a point of an 800 x 450 frame lies in the world, for the eye at the col with its gaze on the solved
// aim of finish() (waveLook). at(sx, sy, D) -> the point D metres from the eye that prints at pixel (sx, sy) of that frame.
function colView(W) {
  const uCol = W.path.nearestXZ(0, 0).u, eye = W.path.pointAt(uCol + 0.012), aim = new THREE.Vector3(1372, 113 + 813 * (W.fig.tall / 0.64), -1111);
  const f = aim.clone().sub(eye).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(r, f), F = 225 / Math.tan(31 * Math.PI / 180);
  return { eye, F, at: (sx, sy, D) => new THREE.Vector3().copy(f).addScaledVector(r, (sx - 400) / F).addScaledVector(up, (225 - sy) / F).normalize().multiplyScalar(D).add(eye) };
}
async function buildOverhead(ctx, W) {
  const { style, scene, path } = W, HB = hairBuilder(), yRef = path.pointAt(path.nearestXZ(0, 0).u).y;
  const S = [-36, -22, -8, 6, 20, 34];   // (round 7) spread over the line of flight and both sides of it: they come in over the top edge across the whole right half   // metres south of the line of flight: over it and to its north, so they come in over the top edge from mid-frame to the right and sweep down beside the hook's falling blade, parallel to it
  for (let r = 0; r < S.length; r++) {
    // two stretches of one hair: to the col it is ruled within 100 m (it ends in dashes above the lens); past the col, where the
    // sheet begins its plunge and would run down behind the lens, only within 70 m (it ends higher)
    const at = (x) => { const q = (x - 10) / 150, w = 0.62 + 0.38 * Math.min(1, q * q); return [x, yRef + 43 + (x < 0 ? 0.0005 * x * x : -0.0012 * x * x) + 0.5 * r, S[r] * w + 4 * Math.sin(x / 14.3 + 0.8)]; };
    const XA = -126, XM = 20, XB = 126, nA = Math.round((XM - XA) / 2.5), nB = Math.round((XB - XM) / 2.5), PA = [], PB = [];
    for (let j = 0; j <= nA; j++) PA.push(at(XA + (XM - XA) * j / nA));
    for (let j = 0; j <= nB; j++) PB.push(at(XM + (XB - XM) * j / nB));
    let lenA = 0; for (let j = 1; j <= nA; j++) lenA += Math.hypot(PA[j][0] - PA[j - 1][0], PA[j][1] - PA[j - 1][1], PA[j][2] - PA[j - 1][2]);
    const seed = (0.13 + r * 0.271) % 1;
    HB.add(PA, { g: () => -0.5, fade: (j) => smoothstep(0, 12, j), far: 118, seed, kind: 1 });   // kind 1: they come in (uBarrel) as the last of the strata are put away: ruled together the two families were a net
    HB.add(PB, { g: () => -0.5, fade: (j) => smoothstep(0, 10, nB - j), far: 96, seed, kind: 1, flow0: lenA });
  }
  const mat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0.5, speed: 8, period: 0.012, t3: true,
    hook: 'p.z += .8 * sin(uTime * 1.7 - position.x * .12); p.y += .4 * sin(uTime * 1.3 - position.x * .09 + 1.);' });   // a ripple runs down them with the wind
  mat.uniforms.uPmin.value = 10;   // dashes 10 m long whatever the frame size: three or four on the stretch in view
  const mesh = new THREE.Mesh(HB.build(), mat); mesh.frustumCulled = false; mesh.renderOrder = 35; mesh.name = 'sheet-overhead'; scene.add(mesh); W.disposables.push(mesh.geometry);
  await ctx.yield();
  // (b) THE TRAIN (round 7): three more crests stepping away downwind, each the SAME hooked figure as the great wave (the figure's own
  // streamlines from its flow, seven nested hairs, amber up the face, ultramarine over the lip, curling the same way), each in a
  // plane turned to face the col (true downwind it is seen edge-on), 3.6, 5.6 and 8 km off, so that from the col they stand at
  // about 55, 35 and 22 percent of the great hook's height with their feet on one line falling gently to the right: the row tells
  // the three kilometres. Placed by where they stand in the frame of the reveal (colView: an 800 x 450 frame, the eye at the col).
  const HT = hairBuilder(), fg = W.fig, IDX = fg.IDX, sl = fg.slice(W.flow.hornZ), i0 = IDX.trough - 1, i1 = IDX.at[20] + 1, cv = colView(W);
  let gmax = 1; for (let i = IDX.at[9]; i < IDX.at[19]; i++) gmax = Math.max(gmax, sl.gap[i]);
  const cr = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - 3 * c + d - a) * f * f * f);
  const hair = (m) => { const X = [], Y = []; for (let i = 0; i < fg.NS; i++) { const d = (24 + m * 32) * Math.min(1, sl.gap[i] / gmax); X.push(sl.x[i] + sl.nx[i] * d); Y.push(sl.y[i] + sl.ny[i] * d); } return { X, Y }; };
  const fx = sl.x[IDX.trough], fy = sl.y[IDX.trough]; let hgt = 1; { const h13 = hair(13); for (let i = i0; i <= i1; i++) hgt = Math.max(hgt, h13.Y[i] - fy); }
  const bias = (t) => 0.5 * smoothstep(IDX.at[13], IDX.at[15], t) * (1 - smoothstep(IDX.at[18], IDX.at[20], t));
  const CRESTS = [[522, 368, 160, 3600], [650, 377, 100, 5600], [741, 385, 64, 8000]];   // [foot x, foot y, height px in the col's frame, metres off]
  for (let c = 0; c < CRESTS.length; c++) {
    const [sx, sy, hp, D] = CRESTS[c], foot = cv.at(sx, sy, D), sc = hp / cv.F * D / hgt, dh = Math.hypot(foot.x - cv.eye.x, foot.z - cv.eye.z) || 1, rx = -(foot.z - cv.eye.z) / dh, rz = (foot.x - cv.eye.x) / dh;
    for (let m = 0; m < 14; m += 2) {
      const L = hair(m), P = [], G = [], end = i1 - (13 - m) * 0.6;
      for (let i = i0; i < i1; i++) for (let e = 0; e < 3; e++) {
        const f = e / 3, t = i + f, a2 = Math.max(0, i - 1), d2 = Math.min(fg.NS - 1, i + 2); if (t > end) break;
        const x = cr(L.X[a2], L.X[i], L.X[i + 1], L.X[d2], f), y = cr(L.Y[a2], L.Y[i], L.Y[i + 1], L.Y[d2], f), y2 = cr(L.Y[a2], L.Y[i], L.Y[i + 1], L.Y[d2], f + 0.05), x2 = cr(L.X[a2], L.X[i], L.X[i + 1], L.X[d2], f + 0.05);
        P.push([foot.x + rx * (x - fx) * sc, foot.y + (y - fy) * sc, foot.z + rz * (x - fx) * sc]); G.push((y2 - y) / (Math.hypot(x2 - x, y2 - y) || 1) - bias(t) >= 0 ? 0.5 : -0.5);
      }
      const nP = P.length - 1;
      HT.add(P, { g: (j) => G[j], fade: (j) => smoothstep(0, 5, j) * smoothstep(0, 16, nP - j), seed: (0.41 + m * 0.115 + c * 0.37) % 1, kind: 2 });
    }
    await ctx.yield();
  }
  const trainMat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 2, speed: 150, t3: true, decl: 'uniform float uTrn;' }); trainMat.uniforms.uTrn = { value: 1 }; trainMat.vertexShader = trainMat.vertexShader.replace('float lod = (', 'float lod = uTrn * ('); W.trainMat = trainMat;   // (round 9) put away, dash by dash, as we turn north under the lip
  const train = new THREE.Mesh(HT.build(), trainMat);
  train.frustumCulled = false; train.renderOrder = 33; train.name = 'wave-train'; scene.add(train); W.disposables.push(train.geometry);
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// INSIDE THE BARREL (fix round 7, the review's move to nine). From u 0.66 to 0.87 the left half of the frame was blank field over
// a plain black triangle. Two families of hairs close the figure round the pocket:
// (a) THE COMB ON THE HORN: the stream-sheets squeezed over the crest of the ridge that climbs to the Horn, a dozen hairs lying
// along its skyline as the surf sees it (the skyline is measured from a point of the run and each hair is that 3D crest line lifted a
// little more than the last, so they stay parallel to the rock from anywhere on the run), packed tight beside the rock and opening
// outward, amber as they climb, springing from the summit on one parabola and turning ultramarine as they begin to fall;
// (b) THE ROOF: the lip carried over the top of the frame: ten nested arcs about the pocket, in a plane behind the Horn, coming in
// where the figure's amber hairs leave the top edge and sweeping left to beyond the Horn's tip, ending in dashes that pour toward it.
// Both are shown (uBarrel of their own, dash by dash) once the figure has grown to the wave's size, and keep a clearing of their own
// round the exit line (a ring's width).
// ---------------------------------------------------------------------------------------------
async function buildBarrel(ctx, W) {
  const { style, scene, path, flow } = W, hz = flow.hornZ, top = W.hornTop.y, RAD = Math.PI / 180;
  const E0 = path.pointAt(0.72), bump = (v, c, w) => { const t = (v - c) / w; return Math.exp(-t * t); };
  // the skyline from E0: per half degree of azimuth (0 = north, + = east) the highest elevation of the land and how far off it is
  const A0 = -72, DA = 0.5, NB = 200, el = new Float32Array(NB).fill(-9), rg = new Float32Array(NB);
  let tipEl = -9, tipAz = 0, tipR = 1000, n = 0;
  for (let z = E0.z - 130; z > hz - 260; z -= 12) {
    for (let x = -330; x <= 430; x += 12) {
      const y = W.ground(x, z), t = clamp((y - 250) / Math.max(top - 250, 1), 0, 1), nr = bump(z, hz, 900);
      const dx = x + 95 * t * t * t * nr - E0.x, dz = z + 18 * t * t * nr - E0.z, h = Math.hypot(dx, dz), e = Math.atan2(y - E0.y, h) / RAD, az = Math.atan2(dx, -dz) / RAD;
      const b = Math.round((az - A0) / DA); if (b < 0 || b >= NB) continue;
      if (e > el[b]) { el[b] = e; rg[b] = h; }
      if (e > tipEl) { tipEl = e; tipAz = az; tipR = h; }
    }
    if (++n % 12 === 0) await ctx.yield();
  }
  // fill empty bins, then smooth both (a hair is a smooth curve; the rock's jags stay black under it)
  for (let b = 1; b < NB; b++) if (el[b] < -8.5 && el[b - 1] > -8.5) { el[b] = el[b - 1]; rg[b] = rg[b - 1]; }
  const smooth = (src, sig) => { const out = new Float32Array(NB), K = Math.ceil(sig * 2.6); for (let b = 0; b < NB; b++) { let a = 0, w = 0; for (let k = -K; k <= K; k++) { const g = Math.exp(-0.5 * (k / sig) * (k / sig)); a += src[clamp(b + k, 0, NB - 1)] * g; w += g; } out[b] = a / w; } return out; };
  const bT = Math.round((tipAz - A0) / DA);
  let b0 = 0; while (b0 < bT && el[b0] < -8.5) b0++;
  for (let b = 0; b < b0; b++) { el[b] = el[b0]; rg[b] = rg[b0]; }
  // the envelope: the highest of seven bins, smoothed, so a hair never dips under a jag of the rock
  const dil = new Float32Array(NB); for (let b = 0; b < NB; b++) { let mx = -9; for (let k = -3; k <= 3; k++) mx = Math.max(mx, el[clamp(b + k, 0, NB - 1)]); dil[b] = mx; }
  const elS = smooth(dil, 2.5), rgS = smooth(rg, 5);
  await ctx.yield();
  // beside the summit the base is the straight line of the last of the slope, through the tip itself; [u, v] are degrees right of and
  // above the tip, T the line's direction and Nn its upper normal
  const cE = Math.cos(tipEl * RAD), s0 = (tipEl - el[bT - 12]) / (12 * DA), tl = Math.hypot(cE, s0), T = [cE / tl, s0 / tl], Nn = [-T[1], T[0]];
  const base = (b) => lerp(elS[b], tipEl + s0 * (A0 + b * DA - tipAz), smoothstep(bT - 26, bT - 8, b));
  const HB = hairBuilder(), NC = 12, bL = Math.max(b0 + 2, bT - Math.round(58 / DA)), AL0 = Math.atan2(Nn[1], Nn[0]) / RAD, AL1 = -24;
  const at = (az, e, h) => [E0.x + h * Math.sin(az * RAD), E0.y + h * Math.tan(e * RAD), E0.z - h * Math.cos(az * RAD)];
  for (let m = 0; m < NC; m++) {
    const P = [], G = [], r = 0.5 + 0.56 * m, azEnd = tipAz + Nn[0] * r / cE;
    for (let b = bL; A0 + b * DA < azEnd - 0.2; b++) {
      const az = A0 + b * DA, k = clamp((b - bL) / Math.max(bT - bL, 1), 0, 1);
      P.push(at(az, base(b) + lerp(0.5 + m * 1.15, r / T[0], smoothstep(0, 1, k)), rgS[Math.min(b, bT)])); G.push(0.5);
    }
    // over the summit: arcs about the tip, a quarter turn and more, squeezed 0.56 degrees apart; they turn ultramarine as they begin to fall
    const nA = Math.max(6, Math.round((AL0 - AL1) / lerp(22, 5, m / (NC - 1)))), nS = P.length;
    for (let j = 0; j <= nA; j++) { const al = lerp(AL0, AL1, j / nA) * RAD; P.push(at(tipAz + r * Math.cos(al) / cE, tipEl + r * Math.sin(al), rgS[bT])); G.push(al > 80 * RAD ? 0.5 : -0.5); }
    const nP = P.length - 1, inL = 6 + m * 2, out = Math.max(3, Math.round(nA * 0.45));   // the outer hairs begin a little later: the comb opens from the left edge
    HB.add(P, { g: (j) => G[j], fade: (j) => smoothstep(inL, inL + 14, j) * smoothstep(0, out, nP - j), seed: (0.23 + m * 0.171) % 1, kind: 1 });
  }
  await ctx.yield();
  const own = (mat) => { mat.uniforms.uBarrel = { value: 0 }; mat.uniforms.uClrA = { value: new THREE.Vector3() }; mat.uniforms.uClrB = { value: new THREE.Vector3() }; mat.uniforms.uClrR = { value: new THREE.Vector2(46, 300) };
    mat.uniforms.uClrA.value.copy(W.end).addScaledVector(W.dir, -120); mat.uniforms.uClrB.value.copy(W.end).addScaledVector(W.dir, 1700); return mat; };
  const combMat = own(style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0.6, speed: 46, period: 0.16, t3: true }));
  const comb = new THREE.Mesh(HB.build(), combMat); comb.frustumCulled = false; comb.renderOrder = 34; comb.name = 'horn-comb'; scene.add(comb); W.disposables.push(comb.geometry);
  // (b) the roof: arcs of ellipses about a centre under and right of the tip (the pocket), on a plane square to the line from E0 to
  // the tip and a little behind it; [x right, y up] in units of the range
  const RF = { c: [0.18, -0.42], a: [1.0, 0.03], b: [0.55, 0.0225], th: [82, 128], n: 10 };
  const sa = Math.sin(tipAz * RAD), ca = Math.cos(tipAz * RAD), se = Math.sin(tipEl * RAD), ce = Math.cos(tipEl * RAD), RNG = tipR / ce + 120;
  const D0 = [sa * ce, se, -ca * ce], RX = [ca, 0, sa], UY = [-sa * se, ce, ca * se], HR = hairBuilder(), NT = 64;
  for (let m = 0; m < RF.n; m++) {
    const a = RF.a[0] + m * RF.a[1], b = RF.b[0] + m * RF.b[1], P = [];
    for (let j = 0; j <= NT; j++) {
      const th = lerp(RF.th[0], RF.th[1] - m * 0.8, j / NT) * RAD, X = RF.c[0] + a * Math.cos(th), Y = RF.c[1] + b * Math.sin(th);
      P.push([E0.x + (D0[0] + RX[0] * X + UY[0] * Y) * RNG, E0.y + (D0[1] + RX[1] * X + UY[1] * Y) * RNG, E0.z + (D0[2] + RX[2] * X + UY[2] * Y) * RNG]);
    }
    HR.add(P, { g: (j) => (lerp(RF.th[0], RF.th[1], j / NT) < 80 ? 0.5 : -0.5), fade: (j) => smoothstep(0, 9, j) * smoothstep(0, 20, NT - j), seed: (0.07 + m * 0.213) % 1, kind: 1 });
  }
  const roofMat = own(style.ruleMaterial({ line: 1, width: 0.0045, breathe: 2, speed: 120, period: 0.16, t3: true }));
  const roof = new THREE.Mesh(HR.build(), roofMat); roof.frustumCulled = false; roof.renderOrder = 34; roof.name = 'barrel-roof'; scene.add(roof); W.disposables.push(roof.geometry);
  // (c) THE LENSES BEYOND THE RING: level almonds on the clear field up and to the left of the exit line, three kilometres off, turned
  // square to the climb (the hero's own, lying north to south, were seen end-on: a leaf). They swell out of their cores as the climb begins.
  const nE = W.WX.lenses >= 5 ? 3 : W.WX.lenses >= 3 ? 2 : 1, eyeX = path.pointAt(0.94), fX = W.dir.clone().normalize(), rX = new THREE.Vector3().crossVectors(fX, new THREE.Vector3(0, 1, 0)).normalize(), uX = new THREE.Vector3().crossVectors(rX, fX), FX = 225 / Math.tan(31 * RAD);
  const EL = [[232, 98, 118, 3000], [136, 54, 78, 3400], [322, 48, 60, 3200]], lgs = [], M4 = new THREE.Matrix4(), S4 = new THREE.Matrix4().makeScale(0.5, 1, 1);
  for (let k = 0; k < nE; k++) {
    const [sx, sy, wpx, D] = EL[k], c = new THREE.Vector3().copy(fX).addScaledVector(rX, (sx - 400) / FX).addScaledVector(uX, (225 - sy) / FX).normalize().multiplyScalar(D).add(eyeX);
    const g = lensGeometry(0, 0, 0, wpx / FX * D, 9 + k); M4.makeRotationY(Math.atan2(rX.x, rX.z)).multiply(S4).setPosition(c); g.applyMatrix4(M4); lgs.push(g);
  }
  const lensMat = style.marbleMaterial({ seed: 3.3, fill: 1, relief: 2.3, curdle: 0.22, warp: 0.2, edge: 0.18, soft: [0.14, 0.42], side: THREE.FrontSide, clear: false, barrel: true }); lensMat.uniforms.uLens = { value: 0 };
  const xl = new THREE.Mesh(lgs.length > 1 ? merge(lgs) : lgs[0], lensMat); xl.frustumCulled = false; xl.renderOrder = 9; xl.name = 'exit-lenses'; scene.add(xl);
  // (d) THE BARREL DOWN ITS LENGTH (round 8). The hook of the wave stood in ONE plane, the Horn's, a kilometre off: a figure on a flat
  // page with blank field inside it ('the last third is mostly empty pale pink'). The wave is a roll lying north to south, so the
  // same section stands again and again down its length: six more of them, the same world size (the figure as it stands grown),
  // 1.5 to 11 times as far north as the Horn's, each a ribbon of fewer hairs than the last. From the foot of the face they nest inside
  // the great hook in true perspective, ribbon within ribbon, closing on the point due north where the barrel ends: amber up each
  // face, ultramarine over each lip, their dashes pouring. They come in (a uBarrel of their own) as we dive under the lip, and keep
  // the clearing round the exit line.
  const fg = W.fig, FI = fg.IDX, fsl = fg.slice(hz), Gf = Math.max(1, 1.1 / fg.tall), Tx = fsl.x[FI.trough], Ty = fsl.y[FI.trough], HT = hairBuilder();
  let gmx = 1; for (let i = FI.at[9]; i < FI.at[19]; i++) gmx = Math.max(gmx, fsl.gap[i]);
  const crm = (a, b, c, d, f) => 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - 3 * c + d - a) * f * f * f);
  const grown = (m) => { const X = [], Y = []; for (let i = 0; i < fg.NS; i++) { const d = (24 + m * 32) * Math.min(1, fsl.gap[i] / gmx), gw = smoothstep(FI.trough - 2, FI.trough + 4, i);
    X.push(Tx + (fsl.x[i] - Tx) * lerp(1, Gf, gw) + fsl.nx[i] * d * lerp(1, Gf * 0.8, gw)); Y.push(Ty + (fsl.y[i] - Ty) * lerp(1, Gf, gw) + fsl.ny[i] * d * lerp(1, Gf * 0.8, gw)); } return { X, Y }; };
  const biasT = (t) => 0.5 * smoothstep(FI.at[13], FI.at[15], t) * (1 - smoothstep(FI.at[18], FI.at[20], t));
  const zE = path.pointAt(0.76).z, DH = zE - hz, TUN = [[1.5, [0, 2, 4, 6, 8, 10, 12]], [2.25, [0, 3, 6, 9, 12]], [3.4, [0, 4, 8, 12]], [5.1, [1, 6, 11]], [7.6, [2, 9]], [11, [3, 10]]], ti0 = FI.trough + 2   /* from the foot of the face: the trough's side lay across the hairs pouring off the Horn */, ti1 = FI.at[20] + 1;
  const eyeR = path.pointAt(0.82);
  // (round 9) OVERLAP, NOT A NET, BETWEEN THE SECTIONS TOO. Seen through each other and through the great hook the six sections were a
  // lattice of crossing arcs. Each band now claims its pixels at a depth of its own (the great hook nearest, then section by section),
  // and a section's hairs are tested just under their own band's depth: a nearer band stops them, a farther one does not. Ribbon behind
  // ribbon, each stopping short of the one in front.
  const CLM = (c) => 0.9999972 + c * 4e-7, secMasks = [];
  for (let c = 0; c < TUN.length; c++) {
    const zc = zE - TUN[c][0] * DH; let tLo = 1e9, tHi = -1e9;
    for (const m of TUN[c][1]) {
      const L = grown(m), P = [], G = [], endT = FI.at[15] + 0.6 - (13 - m) * 0.25;   // each ends over the top of its crest: the curl of the lip came down across the hairs pouring off the Horn
      for (let i = ti0; i < ti1; i++) for (let e = 0; e < 3; e++) {
        const f = e / 3, t = i + f, a2 = Math.max(0, i - 1), d2 = Math.min(fg.NS - 1, i + 2); if (t > endT) break;
        const x = crm(L.X[a2], L.X[i], L.X[i + 1], L.X[d2], f), y = crm(L.Y[a2], L.Y[i], L.Y[i + 1], L.Y[d2], f), x2 = crm(L.X[a2], L.X[i], L.X[i + 1], L.X[d2], f + 0.05), y2 = crm(L.Y[a2], L.Y[i], L.Y[i + 1], L.Y[d2], f + 0.05);
        // nested sections never cross where the hair runs ROUND the point due north of the eye; where it runs toward or away from that
        // point (the foot of the face, low in the frame) one section's hairs lay across the next's. Each hair is ruled only from where
        // it has turned at least 30 degrees off that radius.
        const rx = x - eyeR.x, ry = y - eyeR.y, tl = Math.hypot(x2 - x, y2 - y) || 1, sn = Math.abs(rx * (y2 - y) - ry * (x2 - x)) / (tl * (Math.hypot(rx, ry) || 1));
        if (!P.length && sn < 0.5 && t < FI.at[12]) continue;
        P.push([x, y, zc]); G.push((y2 - y) / tl - biasT(t) >= 0 ? 0.5 : -0.5); tLo = Math.min(tLo, t); tHi = Math.max(tHi, t);
      }
      const nP = P.length - 1; if (nP < 12) continue;
      HT.add(P, { g: (j) => G[j], fade: (j) => smoothstep(0, 6, j) * smoothstep(0, 16, nP - j), seed: (0.29 + m * 0.137 + c * 0.41) % 1, kind: 1, ext: [CLM(c + 1) - 2e-7, 0, 0] });
    }
    if (tHi > tLo) { const ms = TUN[c][1], La = grown(ms[0] - 0.9), Lb = grown(ms[ms.length - 1] + 0.9), MK = { pos: [], nor: [], uv: [], rel: [], idx: [] }; let r = 0;
      for (let i = Math.floor(tLo); i <= Math.min(fg.NS - 1, Math.ceil(tHi)); i++, r++) { MK.pos.push(La.X[i], La.Y[i], zc, Lb.X[i], Lb.Y[i], zc); MK.nor.push(0, 0, 1, 0, 0, 1); MK.uv.push(0, 1e9, 1, 1e9); MK.rel.push(0, 1, 0, 0, 1, 0); }
      for (let j = 0; j < r - 1; j++) { const q = j * 2; MK.idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      const sm = new THREE.Mesh(maskGeometry(MK), style.marbleMaterial({ fill: 0, mask: true, maskDepth: CLM(c + 1), clear: false, lod: false })); sm.frustumCulled = false; sm.renderOrder = 30; sm.name = 'section-claim'; sm.visible = false; scene.add(sm); W.disposables.push(sm.geometry); secMasks.push(sm); }
    await ctx.yield();
  }
  // the great hook's own band: a strip between its first and last hair, a hair's gap wider, built from the figure's own vertices so it grows with the figure
  { const sec = W.hero.object.getObjectByName('wave-section'), ud = sec && sec.userData;
    if (ud && ud.ts) { const NP = ud.NP, gp = sec.geometry.attributes.position, gf = sec.geometry.attributes.aFig, NLs = Math.round(gp.count / (NP * 2)), pos = [], fig = [], nor = [], uv = [], rel = [], idx = []; let r = 0;
      for (let j = 0; j < NP; j++) { const t = ud.ts[j]; if (t < FI.trough + 1 || t > FI.at[20] + 1) continue;
        for (let e = 0; e < 2; e++) { const v = ((e ? NLs - 1 : 0) * NP + j) * 2, ox = gf.getX(v), oy = gf.getY(v), ol = Math.hypot(ox, oy) || 1, k = e ? 1 + 22 / ol : Math.max(0, 1 - 22 / ol);
          pos.push(gp.getX(v), gp.getY(v), gp.getZ(v)); fig.push(ox * k, oy * k, gf.getZ(v), gf.getW(v)); nor.push(0, 0, 1); uv.push(e, 1e9); rel.push(0, 1, 0); }
        r++; }
      for (let j = 0; j < r - 1; j++) { const q = j * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aFig', new THREE.Float32BufferAttribute(fig, 4)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aRel', new THREE.Float32BufferAttribute(rel, 3)); g.setIndex(idx);
      const hm = style.marbleMaterial({ fill: 0, mask: true, maskDepth: CLM(0), clear: false, lod: false }); hm.uniforms.uFigT = style.uniforms.uFigT; hm.uniforms.uFigG = style.uniforms.uFigG;
      hm.vertexShader = 'attribute vec4 aFig; uniform vec2 uFigT; uniform vec3 uFigG;\n' + hm.vertexShader.replace('vec3 p = position;', 'vec3 p = position; p.xy = uFigT + (position.xy - uFigT) * mix(1., uFigG.x, aFig.z) + aFig.xy * mix(1., uFigG.y * (1. + uFigG.z * aFig.w), aFig.z);');
      const hk = new THREE.Mesh(g, hm); hk.frustumCulled = false; hk.renderOrder = 30; hk.name = 'hook-claim'; hk.visible = false; scene.add(hk); W.disposables.push(g); secMasks.push(hk); } }
  W.secMasks = secMasks;
  await ctx.yield();
  const tunMat = own(style.ruleMaterial({ line: 1, width: 0.0045, breathe: 2, speed: 150, t3: true, claim: 0.999997, decl: 'attribute vec3 aCol; flat varying float vClm;', hook: 'vClm = aCol.x;' }));
  tunMat.fragmentShader = tunMat.fragmentShader.replace('uniform float uLine,', 'flat varying float vClm; uniform float uLine,').replace('gl_FragDepth = uClaimD;', 'gl_FragDepth = vClm;');
  // OVERLAP, NOT A NET: the hairs pouring off the Horn stand a kilometre nearer than any of these sections, so the plunge claims its
  // pixels (a strip from its first hair to its last, in the figure's plane) and the sections stop behind it
  { const MK = { pos: [], nor: [], uv: [], rel: [], idx: [] }, La = grown(-0.8), Lb = grown(13.8); let iS = FI.trough; while (iS > 2 && fsl.x[iS - 1] > 90) iS--;
    let r = 0; for (let i = iS; i <= FI.trough + 2; i++, r++) { MK.pos.push(La.X[i], La.Y[i], hz, Lb.X[i], Lb.Y[i], hz); MK.nor.push(0, 0, 1, 0, 0, 1); MK.uv.push(0, 1e9, 1, 1e9); MK.rel.push(0, 1, 0, 0, 1, 0); }
    for (let j = 0; j < r - 1; j++) { const q = j * 2; MK.idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
    const pm = new THREE.Mesh(maskGeometry(MK), style.marbleMaterial({ fill: 0, mask: true, maskDepth: 0.999997, clear: false, lod: false })); pm.frustumCulled = false; pm.renderOrder = 30; pm.name = 'plunge-claim'; pm.visible = false; scene.add(pm); W.disposables.push(pm.geometry); W.plungeClaim = pm; }
  // the ring stands on clear field: these sections are kilometres behind it, so their clearing is kept by ANGLE from the eye (uRingC = cosines of the outer and inner radius, set every frame)
  tunMat.uniforms.uRingP = { value: W.end.clone() }; tunMat.uniforms.uRingC = { value: new THREE.Vector2(0.9, 0.95) };
  tunMat.fragmentShader = tunMat.fragmentShader.replace('uniform vec3 uCam;', 'uniform vec3 uCam; uniform vec3 uRingP; uniform vec2 uRingC;').replace('float kk = whole ? .3 : .9;', '{ vec3 dv = vW - uCam, dr = uRingP - uCam; s *= 1. - smoothstep(uRingC.x, uRingC.y, dot(dv, dr) / max(length(dv) * length(dr), 1e-4)); } float kk = whole ? .3 : .9;');
  const tun = new THREE.Mesh(HT.build(), tunMat); tun.frustumCulled = false; tun.renderOrder = 33; tun.name = 'barrel-sections'; scene.add(tun); W.disposables.push(tun.geometry);
  W.barrel = { combMat, roofMat, lensMat, tunMat, E0 };
  await ctx.yield();
}

// ---------------------------------------------------------------------------------------------
// THE FACE NEXT TO THE EYE (round 9, the review's move to nine). Everything ruled in the barrel stood a kilometre off, so the wave was
// a figure on a page. From u 0.72 to 0.86 the eye turns right and up the wave's face (finish: faceAim) and finds ONE family of hairs
// lying in the sheet eleven metres under it, in true perspective: the streamlines of that sheet, each a section at one distance
// north (a line of constant z: over the foot, up the hollow face, over the lip 780 m above), 7 m apart beside the eye, every second,
// fourth and eighth one ruled further out (by its distance north or south of the eye: a hair is whole or absent). Beside the eye they
// pass under the right wing a twelfth of the frame apart and streak south with our own speed; up the face they close like rails on
// the lip, where they turn to the falling ink and curl over. The sheet CLAIMS ITS PIXELS (a mask of its own surface, nearer than any
// other claim): the great hook, its sections, the train and the rotor stop short of it, so no band lies across another.
// ---------------------------------------------------------------------------------------------
const FACE = { XF: 150, C: 11, SEG: [[0, -3], [80, 22], [900, 72], [1000, 100], [1150, 200]], PITCH: 7, Z0: 231, Z1: -623, NORTH: [40, 55], SOUTH: [230, 290], U: [0.715, 0.75, 0.835, 0.868], AZ: 68, EL: 35 };   // AZ, EL: where the eye rests at u 0.79 (degrees east of north, degrees up)
async function buildFace(ctx, W) {
  const { style, scene, path } = W, F = FACE, RAD = Math.PI / 180;
  // the profile: a heading that turns with arc length (hollow at the foot, steepening, over the lip), integrated metre by metre
  const prof = []; { let x = 0, y = 0; const SM = F.SEG[F.SEG.length - 1][0];
    for (let sI = 0; sI <= SM; sI++) { let k = 0; while (k < F.SEG.length - 2 && sI > F.SEG[k + 1][0]) k++; const th = lerp(F.SEG[k][1], F.SEG[k + 1][1], smoothstep(F.SEG[k][0], F.SEG[k + 1][0], sI));
      if (sI % (sI < 120 ? 5 : 15) === 0 || sI === SM) prof.push([x, y, th, sI]); x += Math.cos(th * RAD); y += Math.sin(th * RAD); } }
  // the foot of the sheet follows the run north (u 0.68 to 0.88) a little under the route and runs on at the last slope either side
  const fz = [], fy = []; for (let i = 0; i <= 20; i++) { const c = path.pointAt(0.68 + 0.01 * i); fz.push(c.z); fy.push(c.y); }
  const footY = (z) => { if (z >= fz[0]) return fy[0] - F.C; let i = 0; while (i < 19 && z < fz[i + 1]) i++; return fy[i] + (fy[i + 1] - fy[i]) * (z - fz[i]) / (fz[i + 1] - fz[i]) - F.C; };
  W.faceAt = (s, z) => { let i = 0; while (i < prof.length - 2 && prof[i + 1][3] < s) i++; const a = prof[i], b = prof[i + 1], t = clamp((s - a[3]) / (b[3] - a[3]), 0, 1); return new THREE.Vector3(F.XF + lerp(a[0], b[0], t), footY(z) + lerp(a[1], b[1], t), z); };
  const HB = hairBuilder(), nP = prof.length - 1; let n = 0;
  for (let k = Math.round(F.Z0 / F.PITCH); k >= Math.round(F.Z1 / F.PITCH); k--) {
    const z = k * F.PITCH, y0 = footY(z), P = prof.map((q) => [F.XF + q[0], y0 + q[1], z]), rg = k % 8 === 0 ? 1e4 : k % 4 === 0 ? 125 : k % 2 === 0 ? 60 : 26, cut = 2 + ((k * 7) % 5 + 5) % 5;   // each ends a little sooner or later than its neighbour: the curl dissolves, it is not ruled off
    HB.add(P, { g: (j) => (prof[j][2] < 86 ? 0.5 : -0.5), fade: (j) => smoothstep(0, 4, j) * smoothstep(0, 5, nP - cut - j), seed: ((0.21 + k * 0.381) % 1 + 1) % 1, kind: 1, ext: [rg, 0, 0] });
    if (++n % 12 === 0) await ctx.yield();
  }
  const uFace = { value: 0 }, win = `(1. - smoothstep(${F.NORTH[0].toFixed(1)}, ${F.NORTH[1].toFixed(1)}, -dzr)) * (1. - smoothstep(${F.SOUTH[0].toFixed(1)}, ${F.SOUTH[1].toFixed(1)}, dzr))`;
  const mat = style.ruleMaterial({ line: 1, width: 0.0045, breathe: 0, speed: 45, period: 0.14, decl: 'attribute vec3 aCol; uniform float uFace;',
    hook: `p.y += .6 * sin(uTime * .785 + position.z * .004); float dzr = position.z - uCam.z; float rk = uFace * (1. - smoothstep(aCol.x * .75, aCol.x, abs(dzr))) * ${win};` });
  mat.uniforms.uFace = uFace; mat.vertexShader = mat.vertexShader.replace('float lod = (', 'float lod = rk * (');
  const rails = new THREE.Mesh(HB.build(), mat); rails.frustumCulled = false; rails.renderOrder = 7; rails.name = 'face-rails'; rails.visible = false; scene.add(rails); W.disposables.push(rails.geometry);
  await ctx.yield();
  // the claim: the sheet's own surface from its foot to the top of its lip, a cell beyond the last hair ruled either way
  const MK = { pos: [], nor: [], uv: [], rel: [], idx: [] }, cols = prof.filter((q, j) => (j % 2 === 0 || j === nP) && q[2] < 112), NR = Math.round((F.Z0 - F.Z1) / 14);
  for (let r = 0; r <= NR; r++) { const z = F.Z0 - r * 14, y0 = footY(z); for (const q of cols) { MK.pos.push(F.XF + q[0], y0 + q[1], z); MK.nor.push(0, 1, 0); MK.uv.push(0, 1e9); MK.rel.push(0, 1, 0); } }
  for (let r = 0; r < NR; r++) for (let j = 0; j < cols.length - 1; j++) { const a = r * cols.length + j, b = a + 1, c = a + cols.length, d = c + 1; MK.idx.push(a, c, b, b, c, d); }
  const mm = style.marbleMaterial({ fill: 0, mask: true, maskDepth: 0.9999955, clear: false, lod: false }); mm.uniforms.uFace = uFace;
  mm.vertexShader = 'uniform float uFace;\n' + mm.vertexShader.replace('vW = w.xyz;', `vW = w.xyz; { float dzr = w.z - uCam.z; vRel.y *= step(.5, uFace) * (1. - smoothstep(${(F.NORTH[1] + 4).toFixed(1)}, ${(F.NORTH[1] + 16).toFixed(1)}, -dzr)) * (1. - smoothstep(${(F.SOUTH[1] + 4).toFixed(1)}, ${(F.SOUTH[1] + 16).toFixed(1)}, dzr)); }`);
  const claim = new THREE.Mesh(maskGeometry(MK), mm); claim.frustumCulled = false; claim.renderOrder = 8; claim.name = 'face-claim'; claim.visible = false; scene.add(claim); W.disposables.push(claim.geometry);
  // the frame of the look: where a point of an 800 x 450 frame lies in the world for the eye at u 0.79 turned up the face
  const eyeF = path.pointAt(0.79), az = F.AZ * RAD, el = F.EL * RAD, fF = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)), rF = new THREE.Vector3().crossVectors(fF, new THREE.Vector3(0, 1, 0)).normalize(), uF = new THREE.Vector3().crossVectors(rF, fF), FF = 225 / Math.tan(31 * RAD);
  const atF = (sx, sy, D) => new THREE.Vector3().copy(fF).addScaledVector(rF, (sx - 400) / FF).addScaledVector(uF, (225 - sy) / FF).normalize().multiplyScalar(D).add(eyeF);
  // two lenses whole on the field above and left of the lip, three kilometres off, square to the look; they swell out of their cores as the eye turns
  const LF = [[404, 66, 104, 3100], [428, 30, 62, 3400]], lgs = [], M4 = new THREE.Matrix4(), S4 = new THREE.Matrix4().makeScale(0.5, 1, 1);
  for (let k = 0; k < (W.WX.lenses >= 3 ? 2 : 1); k++) { const [sx, sy, wpx, D] = LF[k], g = lensGeometry(0, 0, 0, wpx / FF * D, 13 + k); M4.makeRotationY(Math.atan2(rF.x, rF.z)).multiply(S4).setPosition(atF(sx, sy, D)); g.applyMatrix4(M4); lgs.push(g); }
  const lensMat = style.marbleMaterial({ seed: 5.1, fill: 1, relief: 2.3, curdle: 0.22, warp: 0.2, edge: 0.18, soft: [0.14, 0.42], side: THREE.FrontSide, clear: false, barrel: true }); lensMat.uniforms.uLens = { value: 0 };
  const lens = new THREE.Mesh(lgs.length > 1 ? merge(lgs) : lgs[0], lensMat); lens.frustumCulled = false; lens.renderOrder = 9; lens.name = 'face-lenses'; lens.visible = false; scene.add(lens);
  await ctx.yield();
  // THE FLOCK UP THE FACE: four tiers hung over the sheet, from one chough a few wingspans off the right wing to ticks under the lip,
  // each built at the size that reads at its range (the flock's own rule), showing its plan to the eye, holding station and sideslipping
  const TIER = [[1, 24, 34, 2.1, 5, 16, 16], [4, 80, 150, 3.4, 9, -30, 90], [6, 300, 470, 8.5, 16, -40, 160], [8, 700, 1010, 15, 30, -50, 270]];   // [birds, range of arc length up the face (m), scale, metres off the sheet, metres south of the eye from, to]
  const rT = makeRng(9127), geo = choughGeometry(style), NT = TIER.reduce((a, t) => a + t[0], 0), iBird = new THREE.InstancedBufferAttribute(new Float32Array(NT * 4), 4), uTier = { value: 0 }; geo.setAttribute('iBird', iBird);
  const hookO = { flat: true, thin: true, size: 3, uniforms: { uTier }, vertexDecl: 'attribute vec4 iBird; uniform float uTier;' + style.sway,
    vertexHook: 'float rl = sin(uTime * (.5 + iBird.x * .4) + iBird.y * 30.) * .22; float cr = cos(rl), sr = sin(rl); pos.yz = vec2(pos.y * cr - pos.z * sr, pos.y * sr + pos.z * cr); nrm.yz = vec2(nrm.y * cr - nrm.z * sr, nrm.y * sr + nrm.z * cr);',
    vertexPost: '{ vec3 oT = instanceMatrix[3].xyz; pos = oT + (pos - oT) * uTier + swSway(iBird.xy, uTime) * iBird.z; }' };
  const frT = style.fringeMaterial(hookO), blT = style.blackMaterial(hookO); frT.uniforms.uTier = blT.uniforms.uTier = uTier;
  const tiers = style.solid(geo, { flat: true, instances: NT, fringe: frT, black: blT }); tiers.name = 'face-choughs'; tiers.userData.hull.visible = W.dark;
  { const m = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), q = new THREE.Vector3(); let i = 0;
    const LANE = W.flown(0.705, 0.88), BXT = style.swayBox, gp = geo.attributes.position; let rGT = 0; for (let j = 0; j < gp.count; j++) rGT = Math.max(rGT, Math.hypot(gp.getX(j), gp.getY(j), gp.getZ(j)));   // the line while update draws the tiers (uTier above 0), the sideslip's box, the farthest a chough's skin stands from its centre
    for (let t = 0; t < TIER.length; t++) { const [nb, s0, s1, sc, offN, zA, zB] = TIER[t];
      for (let b = 0; b < nb; b++, i++) { let sP = lerp(s0, s1, (b + rT()) / nb); const zP = eyeF.z + lerp(zA, zB, ((b * 0.618 + 0.3) % 1 + rT() * 0.15) % 1), fO = rT.range(0.7, 1.3), rl = 0.45 + rT.range(-0.35, 0.35), k = sc * rT.range(0.85, 1.15), P = new THREE.Vector3();
        const hang = () => { P.copy(W.faceAt(sP, zP)); q.subVectors(W.faceAt(sP + 2, zP), P).normalize(); P.x -= q.y * offN; P.y += q.x * offN * fO; };   // off the sheet, on the eye's side of it
        // No chough of the face in the lane of the course. A bird is not its home: it sideslips in the box of swSway (here k / 1.6
        // times it) and its skin reaches rGT spans from its centre. One whose box of wander comes nearer the line as flown than its
        // reach and 2.5 m hangs further up the face, half a metre of arc at a time, by the same law off the sheet, until it is clear
        // (or for 60 m of arc: never reached, twelve or thirteen steps on every seed counted).
        // (Only the nearest bird ever was: dealt 5.8 m from the line, it slipped across the lens. It hangs some 6 m further up,
        // beyond the range the table gives its tier.) Every draw is made as before and in the same order.
        const clearOf = () => { const hx = BXT[0] * k / 1.6, hy = BXT[1] * k / 1.6, hz = BXT[2] * k / 1.6, need = 2.5 + rGT * k;
          for (let j = 0; j < LANE.length; j += 3) if (Math.hypot(Math.max(Math.abs(LANE[j] - P.x) - hx, 0), Math.max(Math.abs(LANE[j + 1] - P.y) - hy, 0), Math.max(Math.abs(LANE[j + 2] - P.z) - hz, 0)) < need) return false;
          return true; };
        for (hang(); sP < s1 + 60 && !clearOf(); hang()) sP += 0.5;
        planToEye(X, Y, Z, P, eyeF, rl); m.makeBasis(X, Y, Z); m.scale(q.set(k, k, k)); m.setPosition(P); tiers.userData.setMatrixAt(i, m); iBird.setXYZW(i, rT(), rT(), k / 1.6, 0); } } }
  tiers.userData.commit(); tiers.visible = false; scene.add(tiers);
  W.face = { rails, claim, uFace, lens, lensMat, tiers, uTier };
  await ctx.yield();
}

// (round 8) the two dust rings on the glass are gone: on blank field a faint circle was the only mark there, and every outside
// reviewer read it as a fault ('a ghost circle outline in the sky'). The instrument's flaws are the vignette and the grade of the field.
// ---------------------------------------------------------------------------------------------
function finish(ctx, W) {
  const { hero, path, style, scene, end } = W, A = hero.anchors;
  const uAt = (x, z) => path.nearestXZ(x, z).u;
  W.figGrow = Math.max(1, 1.1 / W.fig.tall); W.pocket = new THREE.Vector3(450, 560, W.flow.hornZ);
  const uCol = uAt(0, 0), uTh = uAt(W.thermalAt.x, W.thermalAt.z), uIb = uAt(-172, 0);
  const camPos = new THREE.Vector3();
  const _pp = new THREE.Vector3(), _lv = new THREE.Vector3();
  const lift = (dx, dy, dz) => (time, u) => path.pointAt(u, _pp).add(new THREE.Vector3(dx, dy, dz));
  // THE REVEAL. From the climb to the col until we are under the lip the eye is held on one fixed point of the field, chosen so
  // the whole figure of the wave stands in the frame: crest a quarter in from the left and under the top edge, the train dying
  // away to the right, land low. The engine blends a poi INTO the path's own look-ahead, which dives and turns here, so the
  // point handed over is solved backwards to make the blend come out on that gaze.
  const WL = { from: uCol - 0.14, to: uCol + 0.13, weight: 0.62, fade: 0.148 }   /* (round 9) the eye turns to the wave over 0.04 of the route where it took 0.0675: at u 0.45 the great hook is whole, its crest well inside the frame (it was cut by the left edge), and at 0.43 the ibex are still in it */, aim = new THREE.Vector3(1372, 113 + 813 * (W.fig.tall / 0.64), -1111);   // (fix 2: five degrees further north, so the Horn stands in the frame as a black tooth)
  const BL = { from: uCol + 0.05, to: 0.9, weight: 0.66, fade: 0.3 };   // (round 9) held to 0.9: the look up the face (faceK) needs its whole weight to 0.85
  const _d0 = new THREE.Vector3(), _D = new THREE.Vector3(), _a = new THREE.Vector3(), _out = new THREE.Vector3();
  const solved = (WL, aim) => (time, u) => {
    const L = path.length, fw = (WL.to - WL.from) * WL.fade, w = clamp(smoothstep(WL.from, WL.from + fw, u) * (1 - smoothstep(WL.to - fw, WL.to, u)) * WL.weight, 0.05, 0.95);
    path.posAtDist(u * L, _pp); path.posAtDist(u * L + 26, _a); _d0.subVectors(_a, _pp).normalize(); _D.subVectors(typeof aim === 'function' ? aim(u) : aim, _pp).normalize();
    const c = _D.dot(_d0), q = 1 - w, k = q * c + Math.sqrt(Math.max(q * q * c * c - q * q + w * w, 0));
    _out.copy(_D).multiplyScalar(k).addScaledVector(_d0, -q); if (_out.lengthSq() < 1e-6) _out.copy(_D);
    return _out.normalize().multiplyScalar(2000).add(_pp);
  };
  // (round 8) in the middle of the run north the eye is turned up the wave's face for a few seconds (some 20 degrees right and up of the
  // pocket): the Horn sinks to the lower left corner and the frame is the barrel down its length, section within section, with the
  // flock in tiers up it; then it comes back to the ring. Three pictures at u 0.70, 0.79 and 0.87 where there was one.
  // (round 9) THE LOOK UP THE FACE: 520 m east of the pocket turned the eye ten degrees and the Horn stayed where it was. The eye is now
  // turned by DIRECTION: from u 0.725 to 0.85 it swings to 63 degrees east of north and 35 degrees up (the Horn and the ring leave by the
  // left edge), rests there on the face next to it (buildFace) from 0.77 to 0.805, and swings back to the pocket and the ring.
  const FAZ = FACE.AZ * Math.PI / 180, FEL = FACE.EL * Math.PI / 180, faceDir = new THREE.Vector3(Math.sin(FAZ) * Math.cos(FEL), Math.sin(FEL), -Math.cos(FAZ) * Math.cos(FEL));
  const faceK = (u) => (W.rare ? 0 : smoothstep(0.725, 0.772, u) * (1 - smoothstep(0.805, 0.852, u)));
  const pocketAim = new THREE.Vector3(), _pe = new THREE.Vector3(), pocketAt = (u) => { const k = faceK(u); path.pointAt(u, _pe); pocketAim.subVectors(W.pocket, _pe).normalize().multiplyScalar(1 - k).addScaledVector(faceDir, k).normalize(); return pocketAim.multiplyScalar(2000).add(_pe); };
  const waveLook = solved(WL, aim), barrelLook = solved(BL, pocketAt);
  return {
    scene, path, duration: 50,
    title: 'The Standing Wave',
    pace: (u) => lerp(0.52, 1.3, smoothstep(0.08, 0.5, u)) * lerp(1, 0.82, smoothstep(0.84, 0.94, u)),
    camera: { fov: 62, near: 0.4, far: 16000, lookAhead: 26, sway: 0.5, bank: 0.8 },
    pois: [
      // the gaze is carried above the line of flight all the way, so the black land keeps to the bottom of the frame and the
      // bird is seen against air: up at the lens from the cirque, up the hollow face from the col, up the barrel on the run north
      { at: (time, u) => path.pointAt(u, _pp).add(_lv.set(140, 140 - 60 * Math.exp(-Math.pow(u / 0.04, 2)) + 45 * Math.exp(-Math.pow((u - 0.085) / 0.05, 2)) - 55 * Math.exp(-Math.pow((u - 0.335) / 0.05, 2))   /* (round 8) level for a moment on the upper face: the ruled land is a quarter of the frame under the grove */, 0)), from: 0, to: uCol - 0.09, weight: 0.48, fade: 0.04 },   // (less where the route's own short climb already lifts the gaze: there the land left the frame)   // (fix 3) lifted further: the land is the bottom fifth of the frame and the air is the picture
      { at: W.plumeTop, from: 0, to: 0.135, weight: 0.36, fade: 0.3 },   // (round 7) held stronger and longer: the hut and its plume are the picture of the first hundred metres
      { at: waveLook, from: WL.from, to: WL.to, weight: WL.weight, fade: WL.fade },   // the reveal: the whole figure of the wave, its crest inside the frame
      { at: barrelLook, from: BL.from, to: BL.to, weight: BL.weight, fade: BL.fade },   // the barrel: the eye rests on the pocket of field between the Horn and the rising hairs
      { at: end, from: 0.83, to: 1, weight: 0.5, fade: 0.3 },   // (round 9) from 0.83: it was pulling the eye back to the ring in the middle of the look up the face
    ],
    portal: { shape: 'circle', radius: RING_R, tilt: true, color: W.dark ? '#bfe3cf' : '#EAF7EE', glow: 0.25, halo: false, style: 'ring', revealDistance: 300 },
    post: { exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 4 }, grade: { saturation: 1.05, contrast: 1.04, tint: '#ffffff', shadowTint: '#000000', vignette: 0, grain: 0, aberration: 0 } },
    ride: 'none', style: 'none', companion: 'none',
    update(dt, time, camera, u) {
      hero.setProgress(u);
      { const sw = smoothstep(uCol - 0.165, uCol - 0.085, u); style.uniforms.uEast.value = 130 + sw * sw * sw * 16000; }   // (round 7) the sweep east runs 45 m sooner: the second before the reveal the gaze had already turned to the wave and found blank field (the review's worst frame)
      // from the cirque the hoops' windward ends are the hairs skimming the crest; they are put away as the climb turns to the
      // wave, the figure stands alone through the reveal, and the hoops are ruled again once we are under the lip
      // FIX ROUND 2: the figure never dissolves. The hoops are only the hairs skimming the crest from the cirque; past the col the
      // lane's hairs are put away dash by dash and the SAME figure grows about its trough to the size of the wave we fly under
      const SU = style.uniforms, gr = smoothstep(uCol + 0.035, uCol + 0.16, u);
      SU.uBarrel.value = smoothstep(uCol - 0.129, uCol - 0.116, u);   /* (round 9) in over 17 m, whole by u 0.447: at half strength the sheet overhead was a field of ticks at u 0.45 */ { const k = 1 - smoothstep(uCol - 0.1625, uCol - 0.147, u); if (W.thermalMat) { W.thermalMat.uniforms.uThm.value = k; for (const m of W.thermalClaims) m.visible = k > 0.02; } }   /* (round 7) a touch sooner, as the strata go: the frame before the reveal has its near layer over the incoming hook */   /* (polish round) the hairs of the sheet overhead come in, dash by dash, as the last of the strata go: ruled together they crossed at right angles, a net */   /* (fix 3) the hoops are gone: uBarrel now only shows the rails of near air, which are ruled by range */ SU.uLane.value = 1 - smoothstep(uCol - 0.15, uCol - 0.118, u);   /* (round 7) with the sweep east: the strata are put away as the figure comes in (ruled together they lay across the hook, a net) */   /* (round 6) put away a little sooner, the sheet overhead comes in a little sooner: the reveal has its near layer from the first frame the figure is whole */   /* (fix 3) earlier: the strata and the thermals are gone before the sweep east brings the figure in */   // the lane's hairs are the streamlines that come down to meet us on the climb; seen from the col each one ran dead straight across the figure
      SU.uThread.value = smoothstep(uCol + 0.03, uCol + 0.12, u); SU.uLens.value = smoothstep(uCol + 0.2, uCol + 0.3, u);
      SU.uFigG.value.set(lerp(1, W.figGrow, gr), lerp(1, W.figGrow * 0.8, gr), 0); SU.uFigClr.value = smoothstep(0.8, 0.9, u);   // base and gaps grow alike (gaps growing faster folded the inner hairs into cusps); the fan opens only over the top
      // (round 9) while the eye is turned up the face the sections, the roof and the train are put away (they stand behind and beside the face's hairs: one family in the frame)
      const lookK = W.rare ? 0 : smoothstep(0.715, 0.745, u) * (1 - smoothstep(0.84, 0.872, u));
      { W.barrel.combMat.uniforms.uBarrel.value = smoothstep(0.6, 0.66, u) * (1 - smoothstep(0.93, 0.985, u)); W.barrel.roofMat.uniforms.uBarrel.value = smoothstep(0.645, 0.7, u) * (1 - smoothstep(0.84, 0.9, u)) * (1 - lookK);   /* the roof only once the hook's own crest has grown out over the top edge */ W.barrel.lensMat.uniforms.uLens.value = smoothstep(0.875, 0.93, u); W.barrel.tunMat.uniforms.uBarrel.value = smoothstep(0.62, 0.69, u) * (1 - lookK); W.trainMat.uniforms.uTrn.value = 1 - smoothstep(0.655, 0.7, u);   /* (round 9) the train is the reveal's: from the run north its nearest crest stood at the right of the frame ACROSS the barrel's sections, a lattice */ W.plungeClaim.visible = u > 0.61; for (const sm of W.secMasks) sm.visible = u > 0.61;
        const ang = Math.atan(RING_R * 1.3 / Math.max(camPos.setFromMatrixPosition(camera.matrixWorld).distanceTo(end), 1)) + 0.085; W.barrel.tunMat.uniforms.uRingC.value.set(Math.cos(ang * 1.35), Math.cos(ang)); }   // the barrel closes round the pocket once the figure has grown, and is put away on the last of the climb
      { const F = FACE.U, k = W.rare ? 0 : smoothstep(F[0], F[1], u) * (1 - smoothstep(F[2], F[3], u)); W.face.uFace.value = k; W.face.rails.visible = W.face.claim.visible = k > 0;
        const kl = W.rare ? 0 : smoothstep(0.7, 0.74, u) * (1 - smoothstep(0.855, 0.89, u)); W.face.lensMat.uniforms.uLens.value = kl; W.face.lens.visible = kl > 0; W.face.uTier.value = W.rare ? 0 : smoothstep(0.705, 0.735, u) * (1 - smoothstep(0.85, 0.88, u)); W.face.tiers.visible = W.face.uTier.value > 0; if (W.revealLens) W.revealLens.visible = W.revealLensClaim.visible = u < 0.69; }   // (round 9) the reveal's lenses stand due east of the run north: seen from under them, turned up the face, they were ovals cut by the frame's corner
      hero.update(dt, time, camera);
      camera.getWorldPosition(camPos); W.field.position.copy(camPos);
      { const on = u > uCol - 0.12; if (W.heroFlock) W.heroFlock.visible = on; W.figFlock.visible = W.nearFlockG.visible = on; }   // from the cirque the far flocks were black specks alone on blank field: dirt
      { const k = 1 - smoothstep(0.63, 0.69, u); W.figThreads.material.uniforms.uLen.value = Math.max(k, 0.001); W.figThreads.visible = k > 0 && W.figFlock.visible; }   // (round 8) the figure's birds rule their strokes for the reveal; in the barrel the sections stand behind them and a stroke lay across their hairs
      W.groundHairs.visible = u < uCol + 0.02; W.leeHairs.visible = u > uCol - 0.07;   // from the lee they showed over the crest as stray strokes
      // the thermal we fly through lifts the bird under us for a second and a half
      W.ride.lift.value = 0.16 * Math.exp(-Math.pow((u - uTh) / 0.012, 2));
      for (const f of W.tick) f(dt, time, u);
      W.rideUpdate(dt, time, camera, u);
      if (W.escortUpdate) W.escortUpdate(camera, u, time);
      if (W.eventUpdate) W.eventUpdate(dt, time, u);
    },
    dispose() { for (const d of W.disposables) d.dispose(); },
  };
}
