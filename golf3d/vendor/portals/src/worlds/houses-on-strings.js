// HOUSES ON STRINGS (film worlds B; the idea alone is the film's: homes carried off by toy balloons to a fall on a
// table mountain). A stone hill village has let go of the ground: every building, slung on a raft of great timber
// beams, rides under its own bunches of thousands of small balloons, and the whole village sails in loose company
// over a sea of cloud toward a table mountain. We rise among them, pass under the windmill's raft, thread a lane
// between long bunches with the sun through their skins, come out over the edge of the cloud and fly up the
// mountain's bay 120 to 146 m off its west wall, level, 60 m under its rim: the one fall comes down across the bay
// on our left, the forest lies 540 m under us and buildings of the village ride beside us on our right; then we
// climb out over the north rim in a wide rising left turn, four still hung over the rim ahead, and come down into the
// village settling on the top, landed buildings on both hands, to the ring.
// STATED AT THE HEAD, what is typed and what is dealt.
// TYPED, the same on every seed, so that they are passed close: the mill (its deck at (15, 51, -150)); the second
// glasshouse and the farm (262 and 292 m along the route, 25 m to the left and 32 m to the right); the lane's two
// (34.5 m either side of the line, the lane's middle 36 m short of the bay's mouth, so that its rolls end where the
// bay begins); on the top four buildings still hung at the rows' head, broadside to the way in (three abreast
// as near the north rim as its 60 m allow, 30 m left and 30 and 86 m right of the route, one farther in,
// midway to the east stair: all four by rules of the place; the left one is THE HOUSE, 4.5 m over the rock, the others 30, 38 and 46 m over it), three landed behind the ring, and two stairs of four still coming down
// (west from (-110, -1100) north to (-137, -1202), east from (0, -1160) to (108, -1130); 15, 26, 37 and 48 m over
// the rock at the least: a step whose bunch would touch its neighbour's at any phase rides higher, 2 m at a time, until it is clear).
// PLACED BY A RULE OF PLACE, with dice inside stated bounds: the entry's two (one on either hand, 70 to 110 m along
// the route, 50 to 66 m off the line, 2 to 8 m over it, facing by a die); the mill's two neighbours (in a ring of 45
// to 70 m about it); the company that rides with us (from 40 m inside the bay's mouth, through the turn and up the
// climb to the last place the north rim's 60 m allow, at one even pitch of about 50 m, on the hand away from the fall
// and the west wall: a near rank 24 to 32 m off the line, its decks from 6 m under to 8 m over the line, and a far
// rank from half a pitch on, 76 to 84 m off, one fewer, at its own even pitch to its own last place the rim allows;
// a stream to each building; the first of the near rank is the greenhouse); the
// avenue (one even pitch of 40 m in route metres, a landed raft's length and a gap of 14 m, from 46 m behind the
// rank of three still hung to 40 m short of the ring, the right hand half a pitch on, each 20 to 24 m off the line);
// the fourth still hung, midway between the rank's third and the east stair's third step; up to four late-comers; the fleet;
// two far landed pairs. The bay's mouth, the turn and the rim crossing are found at build from the path and the
// plan's lines.
// RULES THAT HOLD ON EVERY DEAL: nothing stands in the wedge behind the fall's lip (65 degrees either side of due
// west, 700 m deep, at any height); inside the bay nothing stands on the fall's side of the line (the lane ends
// before the bay's mouth; every dealt thing keeps its whole bunch on the other side); nothing within 150 m of the
// lip or 60 m of the true rim (its whole bunch); every building aloft has two others within 80 m (companions are
// dealt beside one that lacks them; one of the fleet or the village still short is not flown); none of the dealt
// fleet, of the late-comers or of the buildings still hung over the top stands within 12 degrees of the fall's
// bearing from the bay's stretch of the route (from the mouth to 20 m past the lip's line);
// a bunch is broad both ways (a quilt at least half as broad as long, tiers stepped to either end); the mill
// is a stout tower joined to a long low range on one broad deck, and no line of its quilt crosses its sails' swept
// disc; balloons are let go only where no hung thing stands over their way.
// THE HOUSE, the only thing of its kind: a small tall painted timber house under one great round ball of balloons in every colour (56 m
// across), its strings gathered into its chimney. It is the left one of the rank at the rows' head (30 m off the line on the fall's hand, as
// near the north rim as the rim's 60 m allow its whole ball), and it hangs low: its foot 4.5 m over the rock. The gaze holds it from where
// the company's last look closes until it is passed. Every rule above holds for it too.
// THE LOOKS A SEED DEALS: always morning. ctx.vary.hour dawn or night gives DAWN (sun 10 degrees up), golden gives
// GOLDEN (18), day gives DAY (a clear early morning, 16); with any other hour one die of the stream 'look' deals:
// under 0.5 DAY, under 0.75 GOLDEN, else DAWN. ctx.vary.density sets the number of the fleet's groups of three (four or five), ctx.vary.rare adds one group,
// ctx.quality.detail thins the balloons. Every motion is on the world's clock and bounded (rise, turn and swing of
// each hung thing; the let-go balloons wrap; the sails' and the bell's phases are dealt). No thing is scripted to u
// and none is placed, shown or timed by the lens: the veils are dealt clear of the route and thin only by true
// distance inside 2.5 m of the eye; shading alone reads the view (sheen, the light through a skin by the ray to that
// balloon, a far balloon drawn no smaller than a pixel), as the kit's sky, cloud and water do.
// THE GAZE: every look aims at a thing of the world, and its span is found from places at build by ONE pair of
// thresholds: it opens where its thing first stands within 105 m of the eye and inside 62 degrees of the heading,
// and closes where the thing's bearing passes 62 degrees. Two looks open at a place: the fall's at the bay's mouth
// (it hands over where the first building inside the bay passes abeam), and the look at the building hung nearest
// the rim crossing, which opens where the last of the company has passed. No look reads u. u is handed on to the kit's fauna only because its
// guide asks for it (it drives the kit's cross and along encounters, of which this world makes none: its four
// flocks wheel about fixed centres set from the lip, the rim crossing, the ring and the forest); it places nothing here.
import * as THREE from 'three';
import { makeSky, makeCloudFieldAsync, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import { makeBalloonMeshes, FAMILIES } from '../parts/houses-on-strings-balloons.js';
import { makeBuildingMeshes } from '../parts/houses-on-strings-buildings.js';
import { makeMountain, makeFloors, makeFall, makeFarTepuis, makeVeils, riverCourse, LIP, RING, TOP } from '../parts/houses-on-strings-land.js';
import { makePlan, dealRest } from '../parts/houses-on-strings-plan.js';

const LOOKS = {
  dawn: { preset: 'dawn', el: 10, glow: 2.4, lit: 0.75, fog: 0.00042, exposure: 1.04, tint: '#fff2e6', deep: 0, thru: 0.52, silver: 1.15, ring: 0.9 },
  golden: { preset: 'goldenHour', el: 18, glow: 1.3, lit: 0.5, fog: 0.00036, exposure: 1.0, tint: '#fff6e8', deep: 0.1, thru: 0.56, silver: 1.2, ring: 0.7 },
  day: { preset: 'goldenHour', el: 16, glow: 1.2, lit: 0.5, fog: 0.00036, exposure: 1.0, tint: '#fff5e6', deep: 0.3, thru: 0.95, silver: 1.1, ring: 0.8, warm: [1.04, 0.99, 0.92],
    sky: { clouds2: { coverage: 0.42, opacity: 0.45 } } },                         // "day" is a clear EARLY morning: the sun 16 degrees up, warm gold light and long shadows, high thin cloud
};

export default {
  id: 'houses-on-strings',
  name: 'Houses on Strings',
  category: 'screen',
  placeKind: 'sky',
  screen: 'Up',
  screenYear: '2009',
  screenKind: 'film',
  weirdness: 0.45,
  media: ['air'],
  async build(ctx) {
    const scene = new THREE.Scene(), core = ctx.core, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const stream = (name) => core.makeRng(core.hashSeed(name + ':' + ctx.seed));
    const lookDie = stream('look')(), byHour = ({ dawn: 'dawn', night: 'dawn', golden: 'golden', day: 'day' })[vary.hour];
    const look = LOOKS[byHour || (lookDie < 0.5 ? 'day' : lookDie < 0.75 ? 'golden' : 'dawn')];
    const noise = core.makeNoise(core.hashSeed('land:' + ctx.seed));

    // ---------------- sky and light: the sun to our right and a little behind
    const sr = stream('sky'), sunAz = 95 + 13 * sr();
    const sky = makeSky({ rng: sr, preset: look.preset, sunElevation: look.el, sunAzimuth: sunAz, clouds2: { coverage: 0.3, opacity: 0.3 }, clouds: false, ...(look.sky || {}) });
    scene.add(sky.object);
    scene.fog = new THREE.FogExp2(sky.fogColor.clone(), look.fog);
    const rig = makeLightRig(sky, { bounce: 0.45 }); scene.add(rig.object);
    const light = { sun: sky.lightDirection.clone(), sunCol: rig.sun.color.clone().multiplyScalar(rig.sun.intensity),
      sky: rig.hemi.color.clone().multiplyScalar(rig.hemi.intensity), ground: rig.hemi.groundColor.clone().multiplyScalar(rig.hemi.intensity) };
    if (look.warm) { light.sunCol.r *= look.warm[0]; light.sunCol.g *= look.warm[1]; light.sunCol.b *= look.warm[2]; rig.sun.color.r *= look.warm[0]; rig.sun.color.g *= look.warm[1]; rig.sun.color.b *= look.warm[2]; }
    light.ground.add(light.sunCol.clone().multiplyScalar(0.2)).add(light.sky.clone().multiplyScalar(0.3));          // the cloud sea's bounce: no underside is black
    await ctx.yield();

    // ---------------- the plan: route, heroes, fleet, village (plain data), then the meshes
    const plan = await makePlan(core, ctx.seed, vary, detail, noise, ctx.yield);
    await dealRest(plan, vary, ctx.yield);
    const path = plan.path, PL = path.length;
    await ctx.yield();
    const bunches = await makeBalloonMeshes(plan.S, light, ctx.yield); scene.add(bunches.object); bunches.uniforms.uDeep.value = look.deep; bunches.uniforms.uThru.value = look.thru;
    await ctx.yield();
    const hm = plan.heroes.mill, bell = plan.heroes.laneRight, bH = bell.H;
    const bellW = [bH.x + bell.bell[0] * bH.cs + bell.bell[2] * bH.sn, bH.y + bell.bell[1], bH.z - bell.bell[0] * bH.sn + bell.bell[2] * bH.cs];
    const builds = await makeBuildingMeshes(plan.B, light, { glow: look.glow, lit: look.lit, sail: hm.sail, sailAx: [0, 0, 1], bell: bellW, bellAx: [bH.cs, 0, -bH.sn], sailPh: hm.phase, bellPh: plan.heroes.laneRight.phase }, ctx.yield);   // the sails' and the bell's phases are dealt (streams mill and laneRight)
    scene.add(builds.object);
    await ctx.yield();

    // ---------------- the table mountain, the forest floor, the cloud sea and its floor, the fall
    const mirrors = plan.village.filter((c) => c.kind !== 'house' && (c.landed || c.over < 40)).map((c) => [c, path.nearestXZ(c.x, c.z).dist]).sort((a, b) => a[1] - b[1]).slice(0, 16).map(([c]) => {
      const f = FAMILIES[c.fam], g = plan.land.topAt(c.x, c.z);         // the sixteen low bunches nearest the way: each throws its shadow on the rock and has a pool at its feet
      return [c.x, g + (c.landed ? 21 : c.over + 30), c.z, c.landed ? 10 : 14, (f[0][0] + f[1][0]) / 2, (f[0][1] + f[1][1]) / 2, (f[0][2] + f[1][2]) / 2];
    });
    if (plan.house) { mirrors.length = Math.min(mirrors.length, 15); mirrors.push([plan.house.ball[0], plan.house.ball[1], plan.house.ball[2], plan.house.ball[3] - 1, 0.8, 0.5, 0.5]); }   // the house's ball throws its shadow too (a reach over 20 m has no pool at its feet)
    const mountain = await makeMountain(plan.land, noise, path, light, ctx.yield, mirrors); scene.add(mountain.object); mountain.uniforms.uRing.value.w = look.ring;
    await ctx.yield();
    const floors = makeFloors(noise, light, { lit: sky.cloudLit.clone(), shade: sky.cloudShade.clone(), y: -66 }); scene.add(floors.forest, floors.floor);
    await ctx.yield();
    const fall = makeFall(light); scene.add(fall.object);
    scene.add(makeFarTepuis(stream('far'), noise));
    await ctx.yield();
    // the kit takes sixteen solids at most: fifteen are given. The walls' clefts run up to 60 m into the rock and stand open to the
    // air, so the solids reach 120 m and more behind the bay's walls and the south face: no puff stands in a cleft or against stone
    const avoid = [[0, 18, 45, 30], [0, 18, 0, 30], [0, 23, -45, 30], [0, 28, -90, 30], [0, 33, -135, 30], [0, 42, -180, 30],     // the route's first 200 m: its tube through the sea
      [60, -14, -700, 300], [300, -14, -720, 300], [-150, -14, -430, 170], [-230, -14, -640, 200],                                    // the whole bay; behind the bay's west wall
      [130, -14, -1000, 300], [-200, -14, -900, 200],                                                                                 // behind the north wall and the bay's inner corner
      [-380, -14, -420, 300], [-830, -14, -420, 300], [-1280, -14, -420, 300]];                                                       // the west block's south face, before and behind it
    const sea = await makeCloudFieldAsync({ rng: stream('sea'), mode: 'sea', sky, altitude: -14, relief: 34, towers: 0, deck: false, avoid, silver: look.silver }, ctx.yield);
    scene.add(sea.object);
    await ctx.yield();

    // ---------------- the top's dress: fins, ridges and labyrinth walls of pale weathered sandstone (each longer than it is
    // tall, none a pillar), bog cushions, the tea river to the lip
    const tr = stream('top'), topAt = plan.land.topAt, dummy = new THREE.Object3D(), rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 });
    const tf = stream('fins'), tc = stream('cushions'), tt = stream('tussocks');   // a stream each: a change in one deals no other anew
    // THE POOLS' OUTLINE as the mountain's drawing has it (the same sums in single precision; the wet shore counted in), so that no
    // mound and no tussock stands in a pool: the two families of pools, the pools round the ring, the one at each low bunch's feet
    const fr = Math.fround, frac = (v) => v - Math.floor(v);
    const h1 = (px, py) => { let qx = frac(fr(fr(px) * fr(0.1031))), qy = frac(fr(fr(py) * fr(0.1031))), qz = qx; const d = fr(fr(fr(qx * fr(qy + 33.33)) + fr(qy * fr(qz + 33.33))) + fr(qz * fr(qx + 33.33))); qx = fr(qx + d); qy = fr(qy + d); qz = fr(qz + d); return frac(fr(fr(qx + qy) * qz)); };
    const vn = (px, py) => { const ix = Math.floor(px), iy = Math.floor(py); let fx = px - ix, fy = py - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = h1(ix, iy), b = h1(ix + 1, iy), c = h1(ix, iy + 1), d = h1(ix + 1, iy + 1), lo = a + (b - a) * fx; return lo + (c + (d - c) * fx - lo) * fy; };
    const inPool = (x, z) => { const rm = Math.hypot(x - RING[0], z - RING[2]), t = Math.min(1, Math.max(0, (Math.abs(rm - 44) - 22) / 8)); let pf = vn(x * 0.014 + 77, z * 0.014 + 77) + 0.1 * vn(x * 0.09 + 5, z * 0.09 + 5);
      if (vn(x * 0.05 + 31, z * 0.05 + 31) >= 0.45) pf += 0.16 * (1 - t * t * (3 - 2 * t));
      return pf > 0.665 || vn(x * 0.047 + 13, z * 0.047 + 13) + 0.12 * vn(x * 0.2 + 3, z * 0.2 + 3) > 0.705 || mirrors.some((m) => m[3] < 20 && Math.hypot((x - m[0] - Math.sign(RING[0] + 8 - m[0]) * 12) * 1.5, (z - m[2]) * 0.8) < 7.5); };
    const wetAt = (x, z, r) => inPool(x, z) || inPool(x + r, z) || inPool(x - r, z) || inPool(x, z + r) || inPool(x, z - r);   // a body's whole foot: its middle and four places on its outline
    const stacks = [0, 1, 2].map((k) => T.seaStackGeometry({ rng: tr, height: 5, radius: 2.3 + k * 0.4, segments: 9, ledges: 3 + k, undercut: 0.45, lobes: 0.4, top: 'flat', sink: 0.6, wetBase: 0,
      color: '#9a8b76', colorB: '#b7a78e', colorTop: '#d6cab2' }));
    const spots = [[], [], []], cush = []; await ctx.yield();
    for (let k = 0; k < 4200 && spots[0].length + spots[1].length + spots[2].length < 96; k++) {
      if (k % 40 === 39) await ctx.yield();
      const x = -230 + 330 * tf(), z = -1425 + 525 * tf(), sc = 0.6 + 0.7 * tf(), lenK = 3 + 3.5 * tf(), v = Math.floor(tf() * 3), jit = tf();
      const ya = noise.n2(x / 140 + 4, z / 140) * 1.2 + (jit - 0.5) * 0.5, half = (2.3 + v * 0.4) * sc * lenK;   // the walls of one district run one way
      const q = path.nearestXZ(x, z), rd = plan.land.rimDist(x, z);
      if (rd < 60 + half || q.dist < 12 + half || q.dist > 150 || Math.hypot(x - RING[0], z - RING[2]) < 34 + half) continue;
      if (q.dist < 25 + half && Math.hypot(x - plan.land.cross[0], z - plan.land.cross[1]) < 80 + half) continue;   // over the first 80 m inside the rim no wall of rock stands within 25 m of the line: we come in low there
      if (plan.village.some((c) => Math.hypot(c.x - x, c.z - z) < 16 + half)) continue;
      spots[v].push([x, topAt(x, z) - 0.3, z, sc, ya, lenK]);
    }
    for (let v = 0; v < 3; v++) {
      const im = new THREE.InstancedMesh(stacks[v], rockMat, spots[v].length); im.name = 'sandstoneWalls';
      spots[v].forEach((s, i) => { dummy.position.set(s[0], s[1], s[2]); dummy.rotation.set(0, s[4], 0); dummy.scale.set(s[3] * s[5], s[3] * (0.75 + 0.35 * ((i * 7) % 5) / 5), s[3] * 1.15); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix); });
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); scene.add(im);
    }
    await ctx.yield();
    for (let k = 0; k < 6000 && cush.length < Math.round(600 * detail); k++) {                  // moss cushions in drifts: a big one and up to four smaller that lean on it
      if (k % 40 === 39) await ctx.yield();
      const x = -150 + 190 * tc(), z = -1410 + 508 * tc(), s = 0.5 + 1.3 * tc() ** 2, c = tc(), n = 1 + Math.floor(tc() * 4.99), a0 = tc() * 6.283, q = path.nearestXZ(x, z);
      if (plan.land.rimDist(x, z) < 5 || noise.n2(x / 30 + 9, z / 30) < -0.1 || Math.hypot(x - RING[0], z - RING[2]) < 32 || plan.village.some((v) => v.landed && Math.hypot(v.x - x, v.z - z) < 16 + 2.5)
        || (q.dist < 25 && Math.hypot(x - plan.land.cross[0], z - plan.land.cross[1]) < 90) || wetAt(x, z, 1.8 * s + 0.4)) continue;   // none on a landed raft's level pad (15 m, and a mound's own breadth); none within 25 m of the route's line where it comes in over the rim; none in a pool
      for (let j = 0; j < n; j++) { const a = a0 + j * 2.4, d = j ? s * (0.95 + 0.3 * j) : 0, xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d, sj = j ? s * (0.45 + 0.12 * (j % 3)) : s; if (j && wetAt(xx, zz, 1.8 * sj + 0.4)) continue; cush.push([xx, topAt(xx, zz) - 0.1 * sj, zz, sj, (c + j * 0.13) % 1]); }   // nor does a mound that leans on the first stand in water (its dark foot reaches 1.8 times its measure)
    }
    const cg = new THREE.SphereGeometry(1, 7, 2, 0, Math.PI * 2, 0, Math.PI / 2), cm = new THREE.InstancedMesh(cg, new THREE.MeshLambertMaterial(), cush.length * 2), cc = new THREE.Color();
    cush.forEach((s, i) => { dummy.position.set(s[0], s[1], s[2]); dummy.rotation.set(0, s[4] * 9, 0); dummy.scale.set(s[3] * 1.35, s[3] * 0.5, s[3] * (1 + 0.5 * s[4])); dummy.updateMatrix(); cm.setMatrixAt(i * 2, dummy.matrix);   // low moss mounds
      cm.setColorAt(i * 2, s[4] < 0.25 ? cc.set('#8a6a44') : s[4] < 0.45 ? cc.set('#9a9a4a') : cc.set('#5f9a34').offsetHSL((s[4] - 0.7) * 0.1, 0, (s[4] - 0.7) * 0.16));   // moss greens and rust
      dummy.position.y = s[1] + 0.1 * s[3] + 0.04; dummy.scale.set(s[3] * 1.8, 0.03, s[3] * (1.35 + 0.65 * s[4])); dummy.updateMatrix(); cm.setMatrixAt(i * 2 + 1, dummy.matrix); cm.setColorAt(i * 2 + 1, cc.set('#231a14')); });   // each mound's dark foot on the rock
    cm.name = 'bogCushions'; cm.computeBoundingSphere(); scene.add(cm); await ctx.yield();
    // tussocks, low shrubs and flowering rosettes, 0.5 to 1.5 m high and of mixed breadth, in groves (the land's own noise leaves open rock between them), thick beside the way from where it has come in over the north rim (the way runs 9.5 m and more over the rock)
    const tus = [], PLn = path.length, sIn = (() => { for (let s = 0; s < PLn; s += 2) { const a = plan.at(s); if (plan.land.inset(a.p.x, a.p.z) > 20) return s; } return PLn; })();
    for (let k = 0; k < 9000 && tus.length < Math.round(1300 * detail); k++) {                  // every die before the one test
      if (k % 40 === 39) await ctx.yield();
      const s = sIn + (PLn - sIn) * tt(), u = tt(), sd = tt() < 0.5 ? -1 : 1, hgt = 0.5 + tt(), kind = tt(), hue = tt(), a = plan.at(s), d = 3 + 42 * u * u, x = a.p.x + sd * a.rx * d, z = a.p.z + sd * a.rz * d;
      if (plan.land.rimDist(x, z) < 6 || Math.hypot(x - RING[0], z - RING[2]) < 16 || plan.village.some((v) => v.landed && Math.hypot(v.x - x, v.z - z) < 16) || noise.n2(x / 22 + 3, z / 22) < -0.12 || wetAt(x, z, (kind > 0.62 ? 0.8 * hgt : 0.75 + 0.45 * hue) + 0.6)) continue;   // none on a landed raft's level pad (15 m) nor against its walls; none in a pool
      tus.push([x, topAt(x, z), z, hgt, kind, hue]);
    }
    await ctx.yield();
    const tg = new THREE.SphereGeometry(0.5, 6, 3, 0, Math.PI * 2, 0, Math.PI / 2); tg.scale(1, 2, 1);   // a rounded crown: low shrubs and cushions of grass, no cone
    const flw = tus.filter((s) => s[4] > 0.62), tm = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), tus.length), fm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 5, 3), new THREE.MeshLambertMaterial(), flw.length);
    tus.forEach((s, i) => { const ros = s[4] > 0.62, w = ros ? 1.6 * s[3] : 1.5 + 0.9 * s[5]; dummy.position.set(s[0], s[1] - 0.05, s[2]); dummy.rotation.set(0, s[5] * 6.283, 0); dummy.scale.set(w, ros ? 0.45 * s[3] : s[3], w); dummy.updateMatrix(); tm.setMatrixAt(i, dummy.matrix);
      tm.setColorAt(i, cc.set(ros ? '#3f6e2a' : s[5] < 0.5 ? '#a89a52' : '#7d8a3c')); });       // straw and olive tussocks, dark rosettes
    flw.forEach((s, i) => { dummy.position.set(s[0], s[1] + 0.45 * s[3] + 0.12, s[2]); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.8 + 0.9 * s[5]); dummy.updateMatrix(); fm.setMatrixAt(i, dummy.matrix);
      fm.setColorAt(i, cc.set(s[5] < 0.34 ? '#e23a58' : s[5] < 0.67 ? '#f2c230' : '#f4ecd8')); });   // each rosette's flower: red, yellow or cream
    tm.name = 'tussocks'; fm.name = 'rosetteFlowers'; tm.computeBoundingSphere(); fm.computeBoundingSphere(); scene.add(tm, fm);
    const wl = Water.waterLight(sky);
    const river = Water.makeRiver({ rng: stream('river'), light: wl, points: riverCourse(), width: 12, speed: 3.2, deep: '#3a220e', shallow: '#9a6426', foam: 0.35, bankFoam: 0.3, opacity: 0.9 });
    scene.add(river.object);
    await ctx.yield();

    // ---------------- small life: swifts in the bay by the fall, at the north rim and round the ring, parrots low over the
    // forest; a thin plume at the fall's foot (the forest shows), shreds that drift along the walls, smoke from the landed chimneys
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) }), flocks = {};
    for (const [name, cx, cy, cz, rad, n, sz] of [['swifts', LIP[0] + 34, LIP[1] - 34, LIP[2] - 30, 44, 60, 1.3], ['swiftsRim', plan.land.cross[0] + 28, TOP + 8, plan.land.cross[1] + 16, 46, 110, 2], ['swiftsRing', RING[0], RING[1] + 14, RING[2] + 10, 26, 40, 1.3]]) {   // by the fall; out over the bay's corner 28 m east and 16 m south of the rim crossing, 8 m over the top; over the ring
      flocks[name] = await F.makeFlockAsync({ rng: stream(name), species: 'swifts', count: n, size: sz, center: [cx, cy, cz], radius: rad, height: 9, spread: [12, 6, 12], wander: [5, 2.5, 4],
        maxSigma: 3, keepClear: { path, dist: 12 } }, ctx.yield);
      fauna.add(flocks[name]); await ctx.yield();
    }
    const parrots = await F.makeFlockAsync({ rng: stream('parrots'), species: 'parrots', count: 22, size: 2.1, center: [-10, -372, -760], radius: 70, height: 6, spread: [16, 4, 16], wander: [3, 1.2, 2],
      maxSigma: 3, body: '#d8261c', wingC: '#1f58c8', trail: '#f0c020', tailC: '#d8261c', head: '#d8261c', keepClear: { path, dist: 10 } }, ctx.yield);
    fauna.add(parrots);
    const mr = stream('mist'), veilList = [];
    // every die of a veil is drawn before its one test: none whose sheet (its half width, with 14 m of drift) comes within 26 m of the route's line
    const addVeil = (q) => { if (path.distanceTo(q[0], q[1], q[2]) > Math.max(q[3], q[4]) + 40) veilList.push(q); };
    for (let i = 0; i < 9; i++) { const dn = mr(), w = 60 + 60 * dn + 20 * mr(); addVeil([LIP[0] + 30 + (mr() - 0.3) * 50, -310 - 100 * dn, LIP[2] + (mr() - 0.5) * (50 + 60 * dn), w, w * (0.5 + 0.3 * mr()), 0.07 + 0.06 * mr(), mr() * 6.283]); }
    for (let i = 0; i < 30; i++) { const ew = mr() < 0.5, a = mr(), b = mr(), w = 26 + 36 * mr(); addVeil([ew ? -70 + a * 12 : -60 + a * 330, 80 + b * 90, ew ? -470 - mr() * 380 : -850 + mr() * 12, w, w * (0.28 + 0.2 * mr()), 0.09 + 0.06 * mr(), mr() * 6.283]); }
    for (const c of plan.village) if (c.landed && c.b && (c.kind === 'longhouse' || c.kind === 'cottages')) {     // a squat stack at a gable end: three puffs, one after another
      const H = c.H, lx = c.kind === 'longhouse' ? 3.7 - c.b.L / 2 : -c.b.L / 2 + 0.7, wx = H.x + lx * H.cs, wz = H.z - lx * H.sn;
      for (let k = 0; k < 3; k++) addVeil([wx, H.y + c.b.ridgeY + 1.5, wz, 1.7, 1.7, 0.3, mr() * 6.283, 1.0 + 0.5 * mr()]);   // each puff takes the veils' own route test
    }
    const veils = makeVeils(veilList, light); scene.add(veils.object);
    await ctx.yield();

    // ---------------- the looks: one at a time, each at a THING of the world, by the thing's place
    // ONE PAIR OF THRESHOLDS FOR EVERY LOOK, and every span found from places at build: a look opens where its thing first stands within FAR
    // metres of the eye and inside ANG degrees of the heading (in plan), once the look before it has closed, and closes where the thing's
    // bearing passes ANG degrees off the heading. One aim for every building: 12 m over its deck's middle, between its roof and its bunch
    const P3 = (x, y, z) => new THREE.Vector3(x, y, z), hb = plan.heroes, FAR = 105, CA = Math.cos(62 * Math.PI / 180), over = (H) => P3(H.x, H.y + 12, H.z);
    const firstArc = (test, after = 0) => { for (let s = Math.ceil(after); s <= PL; s += 1) if (test(plan.at(s))) return s; return PL; };
    const far3 = (pt, a) => Math.hypot(pt.x - a.p.x, pt.y - a.p.y, pt.z - a.p.z), bear = (pt, a) => ((pt.x - a.p.x) * a.tx + (pt.z - a.p.z) * a.tz) / (Math.hypot(pt.x - a.p.x, pt.z - a.p.z) || 1);
    const spanOf = (pt, after = 0, reach = FAR) => { const from = firstArc((a) => far3(pt, a) < reach && bear(pt, a) > CA, after); return [from, firstArc((a) => bear(pt, a) < CA, from + 1)]; };
    const whereOf = (pt) => { let b = 0, bd = 1e9; for (let s = 0; s <= PL; s += 2) { const a = plan.at(s), d = Math.hypot(pt.x - a.p.x, pt.z - a.p.z); if (d < bd) { bd = d; b = s; } } return b; };   // the route metre nearest a thing, in plan
    const mid = (A, B) => P3((A.x + B.x) / 2, (A.y + B.y) / 2 + 12, (A.z + B.z) / 2), nearest = (L, pt) => L.reduce((b, c) => (Math.hypot(c.x - pt[0], c.z - pt[1]) < Math.hypot(b.x - pt[0], b.z - pt[1]) ? c : b), L[0]);
    // the things, in the order of their places along the route: the mill, the second glasshouse, the lane (the middle of its two), each flown
    // building of the company's near rank, the house at the rows' head (the point between its roof and its ball's middle), the first pair
    // of landed bunches of the avenue (the middle of the two), the ring
    const hungTop = plan.village.filter((c) => !c.landed && c.H), rowL = plan.village.filter((c) => c.row === -1 && c.H), rowR = plan.village.filter((c) => c.row === 1 && c.H), ringAt = P3(RING[0], RING[1], RING[2]);
    const things = [[over(hb.mill.H), 0.5], [over(hb.glass2.H), 0.45], [mid(hb.laneLeft.H, hb.laneRight.H), 0.45], ...hb.company.filter((H) => H.near).map((H) => [over(H), 0.45]),
      ...(plan.house ? [[P3(plan.house.H.x, plan.house.H.y + 30, plan.house.H.z), 0.6, 1e9]] : hungTop.length ? [[over(nearest(hungTop, plan.land.cross).H), 0.55, 1e9]] : []), ...(rowL.length && rowR.length ? [[mid(nearest(rowL, plan.land.cross).H, nearest(rowR, plan.land.cross).H), 0.45]] : []), [ringAt, 0.55]]
      .map(([pt, w, reach]) => ({ pt, w, reach, s: 0 }));
    for (const th of things) { th.s = whereOf(th.pt); await ctx.yield(); }
    things.sort((a, b) => a.s - b.s);
    // the fall's look: across the bay, level with the route at the bay's mouth; from the mouth to where the first building inside the bay
    // passes 62 degrees off the heading: that building rides in the fall's picture and takes no look of its own. From there to the rim
    // the gaze always holds one building: each of the company's near rank in its turn, and when the last of them has passed (the rim's
    // 60 m let none stand nearer the rim), the house at the rows' head, however far it still is (were it not flown: the building hung
    // nearest the rim crossing)
    const fallAt = P3(LIP[0], plan.at(plan.mouthAt).p.y, LIP[2]), looks = []; let after = 0, fallDone = false;
    await ctx.yield();
    for (const th of things) {
      if (!fallDone && th.s > plan.mouthAt) {
        const open = Math.max(after, plan.mouthAt), to = firstArc((a) => bear(th.pt, a) < CA, open + 1); fallDone = true;
        if (to > open) { looks.push({ pt: fallAt, w: 0.35, from: open, to }); after = to; continue; }
        after = open;
      }
      const sp = spanOf(th.pt, after, th.reach); if (sp[1] > sp[0]) { looks.push({ pt: th.pt, w: th.w, from: sp[0], to: sp[1] }); after = sp[1]; }
      await ctx.yield();
    }
    const size = new THREE.Vector2();
    await sky.prewarm(ctx.renderer, null, scene);
    return {
      scene, path, duration: 62,
      camera: { fov: 62, near: 0.5, far: 7000, lookAhead: 30, sway: 0.8, bank: 0.7 },
      pois: looks.map((l) => ({ at: () => l.pt, from: l.from / PL, to: l.to / PL, weight: l.w })),
      portal: { shape: 'circle', radius: 9, color: '#fff1d8', glow: 1.5 },
      post: { exposure: look.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.08, contrast: 1.04, tint: look.tint, vignette: 0.28, grain: 0.02 } },
      update(dt, time, camera, u) {
        ctx.renderer.getDrawingBufferSize(size);
        bunches.uniforms.uTime.value = time; bunches.uniforms.uViewH.value = size.y; builds.uniforms.uTime.value = time;
        mountain.uniforms.uTime.value = time; floors.uniforms.uTime.value = time; fall.uniforms.uTime.value = time; veils.uniforms.uTime.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera); sea.update(dt, time, camera);
        river.update(dt, time, camera); fauna.update(dt, time, camera, u);
      },
      dispose() { for (const k of [sky, rig, sea, river, fauna]) if (k && typeof k.dispose === 'function') k.dispose(); },   // every kit piece that offers a dispose
      kept: { swifts: flocks.swifts.kept, swiftsRim: flocks.swiftsRim.kept, swiftsRing: flocks.swiftsRing.kept, parrots: parrots.kept },
    };
  },
};
