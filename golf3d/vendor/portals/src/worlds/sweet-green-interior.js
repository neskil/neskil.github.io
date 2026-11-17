// World "sweet-green-interior": a quiet morning in a farm valley of round green hills, painted in seven sweet oil
// pigments on forms as smooth as rolled dough. We drop off a hill crown to a red-earth railway, are overtaken by a
// small green engine, cross a farm at roof height, round the foot of a smooth cactus 127 m tall with the train below
// us, climb between its arms as its flowers open on their tips (a bouquet that faces the way we come), and leave by
// the great flower on its crown, the low sun to port of it.
//
// THE STYLE (all of it comes from src/parts/sweet-green-interior.js: gradeMaterial, makePigments, the geometry builders)
//   One unlit material: every form is one pigment graded from a pale middle to a darker rim of its own colour, in five
//   seen steps, the pale band half the form's width, brush ridges along the form near and far. No light, no outline,
//   no fog, no texture; post is flat (the tone map is skipped), bloom 0.
//   PAINTED SHADOWS: one sun direction is a law of the place. Every standing thing lays a soft-edged shape on the
//   ground, leaning away from the sun, 1.6 m long for each metre of height: a deeper tint of the ground's own pigment,
//   never grey or black. The shapes are stamped at build into one map of the valley that the ground's material reads
//   at the place; cloud shadows drift on the clock, the wagons' shadows go with the cars, each animal carries a flat
//   oval. Shadows read the sun's fixed direction and the place only, never the eye.
//   THE SKY IS BANDED in every edition: six level bands fixed to the sky (the morning's are a dawn: cream at the
//   skyline, pale yellow, pink, then blues), each with brush ridges along it. The sun stands low on a bearing between
//   20 and 60 degrees to port of the entry axis, settled at build (pickSun): the bearing from which its disc is whole,
//   clear of the cactus's trunk, arms and great flower, from the greatest number of places set every 2 m along the last
//   straight of the line into the ring.
//   The hills are scallops: each ONE smooth dome with a pale crown and a deep rim, a few big plots lapped on it like
//   fish scales (two rings of six, the lower turned half a plot) and thin contour rows of small round plants.
// WHAT READS WHAT (the laws of this file and of the part)
//   THE EYE'S PLACE is read by the grade alone: the grade turns toward the eye (cameraPosition: the direction from the
//   surface point to the eye, and for a dome the eye's bearing on the map), and the sky's dome is carried with the eye.
//   Nothing reads the lens's direction or the gaze. No body is placed, moved, hidden, sized or timed by where the eye is
//   or looks.
//   THE PIXEL'S FOOTPRINT (fwidth: it changes with the resolution, the lens's field and the distance) is read by four
//   drawn marks and by no body: the spacing of the brush ridges (on every form and on the sky's bands), the soft edge of
//   the sun's disc, the width of the rails with the fade of the sleepers, and the fade of the hill plots and their rows
//   into the hill's plain grade. Each derivative is taken once, outside any branch.
//   THE ROUTE'S METRES FLOWN (u times the path's length) move the engine and its wagons, the rare pink train, the puffs,
//   the two pairs of macaws, the burst at the fork and the petals, each by its own law or lane in the place. No beat is
//   keyed to a share of the path: every stretch below is a PLACE of the valley, found at build from the geometry, plus
//   or minus metres of route (uAt). Only idle loops run on the clock: wing beats, rocking palms, sliding clouds and
//   their shadows, wheeling birds, walking files, hopping frogs, the chimney's puffs, the slow walk of the pale middle.
//   No seed number is read and nothing is dealt for one.
// LAYOUT (+Z is the course; flying +Z, port is +X). The crest hill at z 34 (path 40 m up, its crown furnished with
// boulders and bushes), its flank down to z 128; the railway comes round the hill's foot in the open (no tunnel) and
// runs straight on x = +7, the flown line 9.5 m to starboard of it (x = -2.5); the palm avenue along that straight, from
// z 215 to where the track begins its swing round the farm (found from the track); the farm round (6, 470) with its
// yard, files of capybaras and a cream zebu, the mill with its chimney 25 m off; the pond and three-arch bridge at
// z 612; the cactus at (14, 0, 700), turned 58 degrees, the railway looped round its foot (drawn in to 59 m on the far
// side, where the second hamlet stands; a third, the east hamlet, lies outside the loop under the shoulder) and away
// to the south-east. The path spirals in to the hero's own climb, taken unchanged.
// THE TRAIN runs by one law of rate (metres of track for each metre of route flown, by its own place on its track:
// steady on the open line, slower over the bridge and its approaches), fixed by two beats by place: level with us at
// the foot of the drop, on the middle of the bridge as we pass the pond. See THE TRAIN'S LAW below.
// The valley floor is a quilt of rounded graded plots with rows of plants, fences and cream paths; red earth is only
// bed, yard and path. The hills are true domes. Nothing but ground and sky lies behind the entry.
// EDITIONS (seeded; ctx.vary.hour is honoured): banded dawn, sunset, crescent night, after rain; the flowers
// open in every edition. Rare deal: a second, pink train comes the other way on a second line by the same law, and
// the two engines meet at the middle of the bridge as we pass the pond.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makePigments, gradeMaterial, paint, paintInstances, tubeGeometry, ballGeometry, lensGeometry, faceGeometry,
  macawGeometry, macawMaterial, STYLE, GRADE_GLSL, SHADOW_GLSL, PALETTE } from '../parts/sweet-green-interior.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const _rp = V();
const CX = 14, CZ = 700;                          // the cactus's foot
const PHI = 58 * Math.PI / 180;                   // the cactus is turned so that its fork looks back down the valley we flew
const LOOP_R = 85;                                // the railway's loop round the cactus's foot
const RAILX = 7;                                  // the straight of the railway

// unit dome for mode 1 (radius 1, height by profile(r) 0..1): aG = (x, 0, z) on the map
function domeGeometry(seg, rings, profile, ridge = 1, tall = 0) {
  const pos = [], nor = [], ag = [], uv = [], idx = [];
  for (let j = 0; j <= rings; j++) {
    const r = j === 0 ? 0 : Math.pow(j / rings, 0.8), h = profile(r), dh = (profile(Math.min(1, r + 0.01)) - profile(Math.max(0, r - 0.01))) / 0.02;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), l = Math.hypot(1, dh) || 1;
      pos.push(c * r, h, s * r); nor.push(-dh * c / l, 1 / l, -dh * s / l); ag.push(c * r, tall, s * r); uv.push(ridge === 2 ? c * r : th * 40 * ridge, r * 40);
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = j * (seg + 1) + i, b = a + seg + 1; if (j) idx.push(a, a + 1, b); idx.push(a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  return g;
}
// a heap of round lobes with a flat base (mode 3: aG.y = height in the heap, -1 foot .. 1 top): clouds and puffs.
// lobes: [x, z, r, squash] each a ball standing on the base, cut level at y = 0
function heapGeometry(lobes, wseg = 9, hseg = 5, flatZ = 1) {
  const parts = []; let H = 0;
  for (const [x, z, r, sq = 1] of lobes) { const g = ballGeometry(r, r * sq, r * flatZ, wseg, hseg); g.translate(x, r * sq * 0.62, z * flatZ); parts.push(g); H = Math.max(H, r * sq * 1.62); }
  const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose());
  const p = g.attributes.position, ag = g.attributes.aG;
  for (let i = 0; i < p.count; i++) { const y = Math.max(0, p.getY(i)); p.setY(i, y); ag.setXYZ(i, 0, (y / H) * 2 - 1, 0); }
  return g;
}
const CLOUD_LOBES = [[-1.5, 0, 0.42, 0.9], [-0.75, 0.1, 0.66, 1], [0.1, -0.05, 0.82, 1.05], [0.95, 0.08, 0.6, 0.95], [1.6, 0, 0.38, 0.85]];
const PUFF_LOBES = [[-0.55, 0, 0.52, 0.9], [0.1, 0, 0.74, 1], [0.68, 0, 0.46, 0.85]];
// an instanced mesh from a list of { p, q | yaw, s (number | Vector3), pig }
const _d = new THREE.Object3D();
function instanced(geo, mat, list) {
  const n = Math.max(1, list.length);
  if (!geo.attributes.aMid) paintInstances(geo, n, list.length ? list.map((o) => o.pig) : [{ mid: new THREE.Color(0, 0, 0), rim: new THREE.Color(0, 0, 0), base: new THREE.Color(0, 0, 0) }]);
  const m = new THREE.InstancedMesh(geo, mat, n);
  list.forEach((o, i) => {
    _d.position.copy(o.p); if (o.q) _d.quaternion.copy(o.q); else _d.rotation.set(0, o.yaw || 0, 0);
    if (o.s && o.s.isVector3) _d.scale.copy(o.s); else _d.scale.setScalar(o.s ?? 1);
    _d.updateMatrix(); m.setMatrixAt(i, _d.matrix);
  });
  if (!list.length) { _d.position.set(0, -500, 0); _d.scale.setScalar(0.001); _d.updateMatrix(); m.setMatrixAt(0, _d.matrix); }
  m.frustumCulled = false;
  return m;
}
const boxFaces = (x0, x1, y0, y1, z0, z1, top = true) => {
  const Q = (...a) => a.map((p) => V(p[0], p[1], p[2]));
  const f = [Q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]), Q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]),
    Q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]), Q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0])];
  if (top) f.push(Q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]));
  return f;
};

// the sky: six level bands of flat pigment (by the height of the direction only, so they are fixed to the sky and level
// in the world), brush ridges along them, one plain sun disc (or a crescent) that lights nothing
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = position;
  vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec3 uBandC[6]; uniform float uBandE[5]; uniform vec3 uGround;
uniform vec3 uSun; uniform vec3 uSunX; uniform vec3 uSunY; uniform float uSunR; uniform float uCres;
uniform vec3 uSBase;
${GRADE_GLSL}
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  float e = d.y;
  // HER BANDED SKY (the lead's note 8a): six broad level bands from the skyline to the zenith, each one flat colour, the
  // edge between two a soft step; the bands are level in the world and fixed to the sky, and read nothing of the eye
  // but the direction of the ray. A faint brush ridge runs along the bands.
  float fe = fwidth(e);
  float rdg = sgRidge(e * 30., fe * 30.);
  vec3 col = uBandC[0];
  for (int i = 0; i < 5; i++) col = mix(col, uBandC[i + 1], smoothstep(uBandE[i] - 0.011, uBandE[i] + 0.011, e));
  col *= mix(1., rdg, 0.35);
  col = mix(uGround, col, smoothstep(-0.03, -0.005, e));
  // the sun: one plain flat disc of hot yellow, no grade, no rays, no halo (a crescent at night); it lights nothing
  vec2 q = vec2(dot(d, uSunX), dot(d, uSunY)) / (uSunR * max(dot(d, uSun), 0.2));
  float fw = fwidth(q.x) + fwidth(q.y);
  float r = length(q);
  float a = (1. - smoothstep(1. - fw, 1. + fw, r)) * step(0.5, dot(d, uSun));
  float bite = smoothstep(0.86 - fw, 0.86 + fw, length(q - vec2(0.42, 0.2)));
  a *= mix(1., bite, uCres);
  col = mix(col, uSBase, a);
  gl_FragColor = vec4(col, 1.);
}`;

export default {
  id: 'sweet-green-interior',
  name: 'The Sweet Green Interior',
  category: 'artists',
  placeKind: 'wilderness',
  after: 'Tarsila do Amaral, 1886 to 1973',
  weirdness: 0.4,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, tick = () => ctx.yield();
    const detail = clamp(ctx.quality?.detail ?? 1, 0.6, 1), dens = clamp(ctx.vary?.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const add = (name, ...ms) => { for (const m of ms) { m.name = name; scene.add(m); } };       // names are for the print-only clearance check

    // ------------------------------------------------------------------ the edition (seeded; the hour is honoured)
    const hour = ctx.vary?.hour || 'any', roll = rng();
    const edition = hour === 'night' ? 'night' : hour === 'golden' || hour === 'dawn' ? 'sunset' : hour === 'day' ? (roll < 0.6 ? 'morning' : 'rain')
      : roll < 0.4 ? 'morning' : roll < 0.6 ? 'sunset' : roll < 0.8 ? 'night' : 'rain';
    const rare = !!ctx.vary?.rare;
    const pg = makePigments(PALETTE), R = pg.raw, mix = pg.mix;
    if (edition === 'night') {
      pg.green = { mid: mix(R.green, R.blue, 0.42), base: mix(R.green, R.deep, 0.62), rim: R.deep.clone() };
      pg.greenDark = { mid: mix(mix(R.green, R.blue, 0.4), R.deep, 0.3), base: mix(R.green, R.deep, 0.8), rim: R.deep.clone() };
      pg.greenPale = { mid: mix(R.green, R.blue, 0.5), base: mix(R.green, R.deep, 0.45), rim: mix(R.green, R.deep, 0.9) };
      pg.earth = { mid: mix(R.earth, R.pink, 0.3), base: mix(R.earth, R.deep, 0.3), rim: mix(R.earth, R.deep, 0.6) };
    } else if (edition === 'sunset') {
      pg.greenPale = { mid: pg.green.mid.clone(), base: pg.green.base.clone(), rim: pg.green.rim.clone() };
      pg.green = { mid: pg.greenDark.mid.clone(), base: pg.greenDark.base.clone(), rim: pg.greenDark.rim.clone() };
      pg.greenDark = { mid: mix(R.green, R.cream, 0.25), base: mix(R.green, R.deep, 0.5), rim: mix(R.green, R.deep, 0.92) };
    } else if (edition === 'rain') {
      pg.earth = { mid: mix(mix(R.earth, R.pink, 0.6), R.cream, 0.45), base: mix(R.earth, R.pink, 0.6), rim: mix(R.earth, R.pink, 0.2) };
    }
    const earthRoof = edition === 'rain' ? makePigments(PALETTE).earth : pg.earth;
    const flat = pg.flat;
    // clouds and puffs are cut-out heaps: cream above, one sugar-pink under-band along the flat base
    const cloudPig = { mid: R.cream.clone(), base: mix(R.cream, R.pink, 0.4), rim: mix(R.cream, R.pink, 0.85) };
    const matHeap = gradeMaterial({ mode: 3 });
    await tick();

    // ------------------------------------------------------------------ the sun's one direction (the sky and every shadow use it)
    const deg = Math.PI / 180;
    // The sun stands low (9.5 degrees up; 5 at sunset, 11 in rain, the crescent 16) on a bearing 20 to 60 degrees to port of the entry
    // axis: to port of the cactus from the crest and down the railway, and to the side of the line we leave by. It is ONE
    // direction for the whole place; every painted shadow leans away from it.
    // Its bearing is settled with the hero (pickSun below). The hero's test looks from eyes set every 2 m of its line along
    // the whole of the line's last straight into the ring; of the bearings 20, 22 .. 60 degrees the one is taken from which
    // the disc is whole (1.5 degrees and more clear of the trunk, the arms and the great flower) at the greatest number of
    // those eyes, and of equal ones the least. A small flower is left unbuilt only if it would cross the disc (come within
    // SUN_FLOWER degrees of its middle) as seen from any of the same eyes.
    const sunEl = (edition === 'sunset' ? 5 : edition === 'night' ? 16 : edition === 'rain' ? 11 : 9.5) * deg, sunRad = (edition === 'sunset' ? 4.2 : 3.2) * deg;
    const SUN_FLOWER = 6.5;
    let sunAz = 32 * deg; const sunDir = V(), sunTried = [], sunPick = { bearing: 0, whole: 0, eyes: 0, dropped: 0 };
    const sunAt = (az) => V(Math.sin(az) * Math.cos(sunEl), Math.sin(sunEl), Math.cos(az) * Math.cos(sunEl)).normalize();
    const pickSun = async (test) => {
      let best = null;
      for (let a = 20; a <= 60; a += 2) {
        const loc = sunAt(a * deg).applyAxisAngle(V(0, 1, 0), -(Math.PI + PHI)), t = test(loc, sunRad + 1.5 * deg);
        sunTried.push([a, t.whole]);
        if (!best || t.whole > best.whole) best = { a, loc, whole: t.whole, eyes: t.eyes };       // (a later bearing must do better: of equal ones the least stays)
        if (a % 8 === 0) await tick();
      }
      const drop = test.hits(best.loc, SUN_FLOWER * deg); await tick();
      sunAz = best.a * deg; sunDir.copy(sunAt(sunAz)); Object.assign(sunPick, { bearing: best.a, whole: best.whole, eyes: best.eyes, dropped: drop.length });
      return { dir: best.loc, drop };
    };
    // ------------------------------------------------------------------ the hero and the path
    const birdBody = edition === 'rain' ? pg.deep : pg.blue;                 // after rain toucans replace the macaws
    // (the great flower turns one petal toward the sun's place, so the disc passes behind that petal as we come in: the hero is given the sun's direction in its own axes)
    const hero = await buildHero(ctx, { pigments: pg, detail, turn: 1, flowers: 12, birdBody, birdBill: pg.yellow, pickSun });
    hero.object.position.set(CX, 0, CZ); hero.object.rotation.y = Math.PI + PHI;
    scene.add(hero.object);
    const HA = hero.worldAnchors();
    const matTube = hero.style.matTube, matDome = hero.style.matDome, matFace = hero.style.matFace;
    await tick();
    // The crest, the drop, the railway, over the farm, then ONE left-hand spiral: out round the pond's west rim, in over
    // the loop of the railway and onto the hero's own climb at its second point (the hero keeps its arms 7 m and more off that line).
    const pre = [[0, 40, 0], [0, 40, 22], [0, 38.6, 38], [0, 33, 56], [0, 24, 74], [0, 15.5, 92], [-0.6, 9.3, 110], [-1.7, 6, 128], [-2.5, 5, 146], [-2.5, 5, 200], [-2.5, 5, 260], [-2.5, 5, 320], [-2.5, 5, 380],
      [-1, 6, 425], [-1, 9, 452], [-3, 9.5, 489], [-7, 10, 520]];
    {
      const J = HA.flyThrough[1], J2 = HA.flyThrough[2], th = Math.atan2(J2.x - J.x, J2.z - J.z), rho = 60, nL = (a) => [Math.cos(a), -Math.sin(a)];
      const c = [J.x + rho * nL(th)[0], J.z + rho * nL(th)[1]], arc = (a, y) => [c[0] - rho * nL(a)[0], y, c[1] - rho * nL(a)[1]];
      const a0 = th - 93 * Math.PI / 180, e = arc(a0, 13.5), back = (m, y) => [e[0] - Math.sin(a0) * m, y, e[2] - Math.cos(a0) * m];
      pre.push(back(100, 11), back(60, 12.5), e, arc(th - 58 * Math.PI / 180, 14), arc(th - 28 * Math.PI / 180, 14));
    }
    // the hero's own climb from its second point on, ending 0.9 m short on the same line: at the ring, in front of the disc's face
    const climbPts = HA.flyThrough.slice(1, -1).concat([HA.flowerCentre.clone().addScaledVector(HA.portalSeat.normal, 0.9)]);
    const path = makePath(pre.map((p) => V(p[0], p[1], p[2])).concat(climbPts));
    const L = path.length;
    // share of the hero's own climb flown at u (0 at its first point, 1 at the ring)
    // (the hero's line starts one point, 20 m, before the place where the world's path joins it)
    const uJoin = path.nearestXZ(HA.flyThrough[1].x, HA.flyThrough[1].z).u, climbStart = uJoin - (1 - uJoin) * 20 / Math.max(hero.plan.line.len - 20, 1);
    const climbOf = (u) => clamp((u - climbStart) / (1 - climbStart), 0, 1);
    const forkU = climbStart + (1 - climbStart) * HA.fork.p;                 // where the flown line passes between the fork's two arms
    // samples of the path for placing things by their distance from it
    const PS = []; for (let i = 0; i <= 700; i++) PS.push(path.pointAt(i / 700));
    const pathDist = (x, y, z) => { let b = 1e9; for (const p of PS) { const d = (p.x - x) ** 2 + (p.y - y) ** 2 + (p.z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    const pathDistXZ = (x, z) => { let b = 1e9; for (const p of PS) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    const cactusDist = (x, z) => Math.hypot(x - CX, z - CZ);
    // EVERY BEAT IS A PLACE. Nothing below is keyed to a share of the path: a beat is found at build as a place in the
    // valley (the foot of the drop, the pond, the join, the fork, the ring, the avenue's ends) and the metres of route at
    // which the flown line reaches it; a stretch is that place plus or minus metres of route. uAt turns metres of route
    // into the share the engine counts in, and mAt the other way.
    const uAt = (m) => clamp(m / L, 0, 1), mAt = (u) => clamp(u, 0, 1) * L;
    const routeAtZ = (z) => { for (let m = 0; m <= L; m++) if (path.posAtDist(m, _rp).z >= z) return m; return L; };       // metres of route at which the line first reaches z
    await tick();

    // ------------------------------------------------------------------ the sky
    const sunX = V().crossVectors(V(0, 1, 0), sunDir).normalize(), sunY = V().crossVectors(sunDir, sunX).normalize();
    // the bands of each edition, from the skyline up (two-pigment mixes only), and the sine of the height of each edge
    const nt = mix(R.blue, R.deep, 0.55);
    const BANDS = {
      morning: [[mix(R.cream, R.yellow, 0.12), mix(R.yellow, R.cream, 0.5), mix(R.pink, R.cream, 0.22), mix(R.pink, R.blue, 0.5), mix(R.blue, R.cream, 0.24), R.blue.clone()], [0.05, 0.11, 0.2, 0.26, 0.37]],
      sunset: [[mix(R.yellow, R.cream, 0.25), mix(R.yellow, R.pink, 0.5), mix(R.pink, R.cream, 0.15), mix(R.pink, R.blue, 0.42), mix(R.blue, R.pink, 0.22), R.blue.clone()], [0.06, 0.14, 0.27, 0.39, 0.52]],
      night: [[mix(nt, R.blue, 0.85), mix(nt, R.blue, 0.5), mix(nt, R.pink, 0.3), mix(nt, R.blue, 0.22), nt, mix(nt, R.deep, 0.18)], [0.05, 0.105, 0.17, 0.27, 0.5]],
      rain: [[R.cream.clone(), mix(R.blue, R.cream, 0.62), mix(R.pink, R.blue, 0.3), mix(R.blue, R.cream, 0.36), mix(R.blue, R.cream, 0.1), mix(R.blue, R.deep, 0.14)], [0.05, 0.12, 0.2, 0.3, 0.46]],
    }[edition];
    const skyU = { ...STYLE, uBandC: { value: BANDS[0] }, uBandE: { value: BANDS[1] }, uGround: { value: pg.greenDark.mid.clone() },
      uSun: { value: sunDir }, uSunX: { value: sunX }, uSunY: { value: sunY }, uSunR: { value: Math.tan(sunRad) }, uCres: { value: edition === 'night' ? 1 : 0 },
      uSBase: { value: edition === 'night' ? R.cream.clone() : R.yellow.clone() } };
    const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(3000, 3), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }));
    sky.frustumCulled = false; sky.renderOrder = -1; scene.add(sky);

    await tick();
    // ------------------------------------------------------------------ painted shadows: one map of the valley, laid at build
    // Every standing thing lays a soft-edged shape on the ground, leaning away from the sun: SHK metres of shadow for
    // each metre of height (a painter's law, the same everywhere). The shapes are stamped into one small map (R8, 0.4 m
    // by 0.5 m a cell); the ground's own material reads it at the place (world x, z) and turns the ground there to a
    // deeper tint of its own pigment. Heights are taken from the ground a thing stands on. Clouds' and wagons' shadows
    // move and are given to the same material as numbers (the clouds' on the clock, the wagons' with the cars).
    const SHK = edition === 'sunset' ? 2.3 : 1.6, SHD = { x: -Math.sin(sunAz), z: -Math.cos(sunAz) };
    const SHW = 2048, SHH = 2048, SHX0 = -400, SHZ0 = -72, SHSX = 800 / SHW, SHSZ = 1024 / SHH, shData = new Uint8Array(SHW * SHH);
    // a capsule from (x0, z0) with radius r0 to (x1, z1) with radius r1, soft over 'soft' metres; strength k (0..1)
    const shSeg = (x0, z0, x1, z1, r0, r1 = r0, soft = 0.6, k = 1) => {
      const rm = Math.max(r0, r1) + soft, i0 = Math.max(1, Math.floor((Math.min(x0, x1) - rm - SHX0) / SHSX)), i1 = Math.min(SHW - 2, Math.ceil((Math.max(x0, x1) + rm - SHX0) / SHSX));
      const j0 = Math.max(1, Math.floor((Math.min(z0, z1) - rm - SHZ0) / SHSZ)), j1 = Math.min(SHH - 2, Math.ceil((Math.max(z0, z1) + rm - SHZ0) / SHSZ));
      const dx = x1 - x0, dz = z1 - z0, ll = dx * dx + dz * dz;
      for (let j = j0; j <= j1; j++) { const z = SHZ0 + (j + 0.5) * SHSZ; for (let i = i0; i <= i1; i++) {
        const x = SHX0 + (i + 0.5) * SHSX, t = ll > 1e-6 ? clamp(((x - x0) * dx + (z - z0) * dz) / ll, 0, 1) : 0, d = Math.hypot(x - x0 - dx * t, z - z0 - dz * t), r = r0 + (r1 - r0) * t;
        const a = clamp((r - d) / soft + 0.5, 0, 1); if (a <= 0) continue;
        const v = Math.round(255 * k * a * a * (3 - 2 * a)), q = j * SHW + i; if (v > shData[q]) shData[q] = v;
      } }
    };
    // a thing of height h and half-width r standing at (x, z): its shape from its foot away from the sun; top: half-width of its head
    const shStand = (x, z, h, r, top = r, soft = 0.6) => shSeg(x, z, x + SHD.x * SHK * h, z + SHD.z * SHK * h, r, top, soft);
    // a point in the air (height y over the ground it shadows) -> where its shadow lies
    const shAt = (x, y, z) => [x + SHD.x * SHK * y, z + SHD.z * SHK * y];
    const shCloud = [0, 1, 2, 3].map(() => new THREE.Vector4(0, -9000, 1, 1)), shCar = [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector4(0, -9000, 0, 1));
    const shTex = new THREE.DataTexture(shData, SHW, SHH, THREE.RedFormat, THREE.UnsignedByteType);
    shTex.minFilter = shTex.magFilter = THREE.LinearFilter; shTex.wrapS = shTex.wrapT = THREE.ClampToEdgeWrapping; shTex.generateMipmaps = false; shTex.unpackAlignment = 1;
    const shU = { uShadow: { value: shTex }, uShRect: { value: new THREE.Vector4(SHX0, SHZ0, 1 / 800, 1 / 1024) }, uCloudSh: { value: shCloud }, uCarSh: { value: shCar },
      uCarSweep: { value: new THREE.Vector2(SHD.x * SHK * 3.7, SHD.z * SHK * 3.7) }, uShAmt: { value: edition === 'night' ? 0.7 : 0.85 }, uShTint: { value: mix(R.blue, R.deep, 0.4) } };
    const pinkEarth = { mid: mix(R.pink, R.cream, 0.3), base: mix(R.pink, R.earth, 0.22), rim: mix(R.pink, R.earth, 0.55) };
    // the ground's two materials: plots, floor and water take the shadows; tall domes (the hills, the crest) also carry the drawn quilt
    const matGround = gradeMaterial({ mode: 1, ground: true, uniforms: shU });
    const matHill = gradeMaterial({ mode: 1, ground: true, quilt: true, uniforms: { ...shU, uQMid: { value: [pinkEarth.mid, pg.yellow.mid, pg.cream.mid] }, uQRim: { value: [pinkEarth.rim, pg.yellow.rim, pg.cream.rim] } } });
    // the cactus lays one great shadow across the pond's rim and the plots: its trunk and every arm, as they stand
    {
      const M = hero.object.matrixWorld, a = V(), b = V(), lay = async (pts, radii) => {
        for (let i = 0; i < pts.length - 1; i++) { a.copy(pts[i]).applyMatrix4(M); b.copy(pts[i + 1]).applyMatrix4(M); const [ax, az] = shAt(a.x, a.y, a.z), [bx, bz] = shAt(b.x, b.y, b.z); shSeg(ax, az, bx, bz, Math.max(radii[i], 0.4), Math.max(radii[i + 1], 0.4), 1.6); if (i % 8 === 7) await tick(); }
        await tick();
      };
      await lay(hero.details.trunk.pts, hero.details.trunk.radii);
      for (const arm of hero.plan.arms) await lay(arm.pts, arm.radii);
      shStand(HA.houseAt.x, HA.houseAt.z, 6, 2.8, 1.4);
    }
    await tick();

    // ------------------------------------------------------------------ the ground: one red-earth floor, the crest, the scallops
    // the crest hill: an oval dome 31 m tall, 124 m across and 180 m long under the entry and the drop, scooped so that it
    // lies 9 m under the line all the way down its flank
    const pathY = (z) => { if (z <= PS[0].z) return PS[0].y; for (let i = 1; i < PS.length; i++) if (PS[i].z >= z) { const a = PS[i - 1], b = PS[i]; return lerp(a.y, b.y, clamp((z - a.z) / Math.max(b.z - a.z, 1e-4), 0, 1)); } return 0; };
    const CREST = { x: 0, z: 34, R: 90, RX: 62, H: 31.4 };
    // (the railway round the hill's foot, as laid further down: the hill is kept low toward it)
    const FOOT = new THREE.CatmullRomCurve3([[108, 40], [78, 82], [52, 107], [28, 122], [12, 134], [7, 150]].map((p) => V(p[0], 0, p[1])), false, 'centripetal').getSpacedPoints(40);
    const footDist = (x, z) => { let b = 1e9; for (const p of FOOT) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    const groundY = (x, z) => { const q = ((x - CREST.x) / CREST.RX) ** 2 + ((z - CREST.z) / CREST.R) ** 2; return q >= 1 ? 0 : Math.max(0, Math.min(CREST.H * Math.pow(1 - q, 0.62), pathY(z) - 9 + 0.012 * x * x, 0.42 * (footDist(x, z) - 5))); };
    const inCrest = (x, z, m = 0) => ((x - CREST.x) / (CREST.RX + m)) ** 2 + ((z - CREST.z) / (CREST.R + m)) ** 2 < 1;
    const hillPig = [pg.green, pg.greenDark, pg.greenPale];
    {
      // the floor is red earth: it shows only as the railway's bed, the yard, the paths and the cactus's foot, between the plots
      const floor = instanced(domeGeometry(48, 6, () => 0, 0), matGround, [{ p: V(0, 0, 500), s: V(1500, 1, 1500), pig: { mid: pg.earth.mid, base: pg.earth.mid, rim: mix(R.earth, R.deep, 0.5) } }, { p: V(0, -0.6, 500), s: V(6300, 1, 6300), pig: flat(pg.greenDark.mid) }]);
      add('ground', floor);
      const cg = domeGeometry(72, 24, () => 0, 1, 1), cp = cg.attributes.position;
      for (let i = 0; i < cp.count; i++) cp.setY(i, groundY(CREST.x + cp.getX(i) * CREST.RX, CREST.z + cp.getZ(i) * CREST.R));
      add('ground', instanced(cg, matHill, [{ p: V(CREST.x, 0, CREST.z), s: V(CREST.RX, 1, CREST.R), pig: pg.greenPale }]));
    }
    await tick();

    // ------------------------------------------------------------------ the railway's line (XZ) and its height
    // It comes round the crest hill's foot in the open, runs dead straight down the valley on x = 7, swings to port round the
    // farm, crosses the pond by the bridge, goes up the cactus's west flank, round its back and down its east flank (the
    // loop: the train circles the foot below us all the way up the climb) and leaves to the south-east between the hills.
    const BR = { x: -4, z: CZ - 88, ax: -0.82, az: 0.57 };       // the bridge's middle and the way the line crosses it
    // the loop is drawn in toward the foot on the far side (bearing 345), where the climb starts, so the train passes close below us there
    const loopR = (deg) => { const d = ((deg - 345 + 540) % 360) - 180; return LOOP_R - 26 * Math.cos(clamp(d / 65, -1, 1) * Math.PI / 2) ** 2; };
    const loopAt = (deg) => { const r = loopR(deg), a = deg * Math.PI / 180; return [CX + r * Math.sin(a), CZ + r * Math.cos(a)]; };
    const trackPts = [[150, -520], [150, -300], [142, -120], [128, -20], [108, 40], [78, 82], [52, 107], [28, 122], [12, 134], [RAILX, 150], [RAILX, 200], [RAILX, 300], [RAILX, 394],
      [12, 416], [34, 438], [56, 460], [62, 480], [60, 520], [54, 555], [BR.x - 55 * BR.ax, BR.z - 55 * BR.az], [BR.x - 30 * BR.ax, BR.z - 30 * BR.az], [BR.x, BR.z], [BR.x + 30 * BR.ax, BR.z + 30 * BR.az],
      [BR.x + 55 * BR.ax, BR.z + 55 * BR.az], [-64, CZ - 32], loopAt(270), loopAt(290), loopAt(305), loopAt(320), loopAt(335), loopAt(350), loopAt(5), loopAt(20), loopAt(35), loopAt(60), loopAt(90), loopAt(115),
      [84, CZ - 75], [80, CZ - 115], [84, CZ - 160], [92, CZ - 210], [110, CZ - 270], [150, CZ - 330], [230, CZ - 380], [420, CZ - 430], [700, CZ - 450]];
    const trackCurve = new THREE.CatmullRomCurve3(trackPts.map((p) => V(p[0], 0, p[1])), false, 'centripetal');
    trackCurve.arcLengthDivisions = 3200;
    const TL = trackCurve.getLength(), TN = 2400, TS = trackCurve.getSpacedPoints(TN);
    const sAtZ = (z) => { for (let i = 0; i <= TN; i++) if (TS[i].z >= z) return (i / TN) * TL; return TL; };      // (the first time the line reaches z)
    const sNear = (x, z) => { let b = 1e9, bi = 0; for (let i = 0; i <= TN; i++) { const d = (TS[i].x - x) ** 2 + (TS[i].z - z) ** 2; if (d < b) { b = d; bi = i; } } return (bi / TN) * TL; };
    const POND = { x: BR.x, z: BR.z + 1, r: edition === 'rain' ? 48 : 38 };
    const sBC = sNear(POND.x, POND.z), sB0 = sBC - 25, sB1 = sBC + 25, BRIDGE_H = 4.5;
    const trackH = (s) => BRIDGE_H * smoothstep(sB0 - 34, sB0 - 2, s) * (1 - smoothstep(sB1 + 2, sB1 + 34, s));
    const _tt = V();
    const trackAt = (s, out = V()) => { const k = clamp(s / TL, 0, 1) * TN, i = Math.min(TN - 1, Math.floor(k)); out.lerpVectors(TS[i], TS[i + 1], k - i); out.y = trackH(s); return out; };
    const trackTan = (s, out = V()) => { trackAt(s + 0.5, out); trackAt(s - 0.5, _tt); return out.sub(_tt).normalize(); };
    const trackDistXZ = (x, z) => { let b = 1e9; for (let i = 0; i <= TN; i += 3) { const d = (TS[i].x - x) ** 2 + (TS[i].z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    const FZ = 104, FARM = { x: 6, z: 366 + FZ }, YARD = { x: 0, z: 396 + FZ, r: 15 }, CHIM = { x: -38, z: 424 + FZ };    // the yard's middle, the mill chimney's foot (FZ: how far the farm lies down the valley from its first plan)
    await tick();

    // ------------------------------------------------------------------ THE TRAIN'S LAW: one law of rate, two beats by place
    // The engine's place on its track is the integral of ONE law of rate: metres of track run for each metre of route we
    // fly, a function of the train's OWN place on its track and of nothing else. On the open line the rate is R_OPEN; a
    // train slows for a bridge, so from 45 m before the deck to 15 m past it the rate is R_BRIDGE, and it eases from the
    // one to the other over the 30 m of track before that stretch and the 30 m after it; round the loop and away it is
    // R_OPEN again. The law is integrated once, here, over the route in steps of 1 m of route (midpoint rule) into a table,
    // and the engine's place is read from the table by the metres of route flown (u times L).
    // TWO BEATS BY PLACE fix the law's two numbers (R_OPEN and where the train is as we enter), both found here from the
    // geometry: (1) M1, the foot of the drop: the metre of route at which the flown line first comes within 6.5 m of the
    // height of the rail bed; there the engine's middle is level with the eye's place (the same z); (2) M2, the pond: the
    // metre of route at which the eye's place is nearest the middle of the pond's water; there the engine's middle is at
    // the middle of the bridge. Before M1 the train is simply running at R_OPEN from further back along its line.
    const BED_Y = 0.12, R_BRIDGE = 0.55, MR = Math.ceil(L), CAR_BACK = [0, 9.6, 17.4, 25.2];      // (CAR_BACK: how far behind the engine's middle each car's middle rides)
    let M1 = 0; while (M1 < MR && path.posAtDist(M1, _rp).y - BED_Y > 6.5) M1++;
    let M2 = 0; { let b = 1e9; for (let m = 0; m <= MR; m++) { path.posAtDist(m, _rp); const d = (_rp.x - POND.x) ** 2 + (_rp.y - 0.16) ** 2 + (_rp.z - POND.z) ** 2; if (d < b) { b = d; M2 = m; } } }
    const sLevel = (z) => { for (let i = 1; i <= TN; i++) if (TS[i].z >= z) return ((i - 1 + (z - TS[i - 1].z) / Math.max(TS[i].z - TS[i - 1].z, 1e-6)) / TN) * TL; return TL; };     // where the line first reaches z, between its sampled points
    const sM1 = sLevel(path.posAtDist(M1, _rp).z);
    // dir +1: the green train, up the line; dir -1: the rare deal's pink train, the same law the other way
    const rateAt = (s, rOpen, dir) => lerp(rOpen, R_BRIDGE, dir > 0 ? smoothstep(sB0 - 75, sB0 - 45, s) * (1 - smoothstep(sB1 + 15, sB1 + 45, s)) : smoothstep(sB0 - 45, sB0 - 15, s) * (1 - smoothstep(sB1 + 45, sB1 + 75, s)));
    const runLaw = (s0, rOpen, dir, n, T) => { let s = s0; if (T) T[0] = s; for (let i = 0; i < n; i++) { s += dir * rateAt(s + dir * 0.5 * rateAt(s, rOpen, dir), rOpen, dir); if (T) T[i + 1] = s; } return s; };
    // R_OPEN by bisection: the rate at which a train level with us at M1 is at the middle of the bridge at M2
    let R_OPEN = 1; { let lo = 0.6, hi = 3; for (let k = 0; k < 44; k++) { R_OPEN = (lo + hi) / 2; if (runLaw(sM1, R_OPEN, 1, M2 - M1) < sBC) lo = R_OPEN; else hi = R_OPEN; } }
    await tick();
    const trainT = new Float64Array(MR + 1); runLaw(sM1 - R_OPEN * M1, R_OPEN, 1, MR, trainT);        // (open line all the way back from M1: the start follows from the rate)
    // the pink train: the same law and the same R_OPEN the other way on its own line; its one number, where it is as we
    // enter, is fixed by one beat: its engine's middle is at the middle of the bridge at M2, where the green engine's is
    const train2T = new Float64Array(MR + 1); { let lo = sBC, hi = sBC + 3.2 * M2; for (let k = 0; k < 44; k++) { const m = (lo + hi) / 2; if (runLaw(m, R_OPEN, -1, M2) < sBC) lo = m; else hi = m; } runLaw((lo + hi) / 2, R_OPEN, -1, MR, train2T); }
    const readT = (T, u) => { const m = mAt(u), i = Math.min(MR - 1, Math.floor(m)); return T[i] + (T[i + 1] - T[i]) * (m - i); };
    const trainS = (u) => readT(trainT, u), train2S = (u) => readT(train2T, u);
    await tick();

    // ------------------------------------------------------------------ the avenue's ends, from the track's own geometry
    // The palm avenue stands along the straight of the railway: its first pair at AV_Z0, a pair every AV_STEP metres, its
    // last pair where the track begins its swing round the farm: walking up the line from the first pair, the first place
    // at which the track's direction has turned 2 degrees from its direction there.
    const AV_Z0 = 215, AV_STEP = 10;
    let sSwing = sAtZ(AV_Z0); { const t0 = trackTan(sSwing, V()).setY(0).normalize(), t1 = V(); while (sSwing < TL - 2 && trackTan(sSwing + 1, t1).setY(0).normalize().angleTo(t0) < 2 * deg) sSwing += 1; }
    const AV_Z1 = AV_Z0 + AV_STEP * Math.floor((trackAt(sSwing, V()).z - AV_Z0) / AV_STEP);
    // THE PLACES OF THE FLIGHT, in metres of route (each found from the geometry; M1 and M2 above)
    await tick();
    const M_AV0 = routeAtZ(AV_Z0), M_AV1 = routeAtZ(AV_Z1);        // level with the avenue's first palms, and with its last
    await tick();
    const M_JOIN = mAt(uJoin), M_FORK = mAt(forkU), M_RING = L;     // where the path joins the hero's climb; between the fork's arms; the ring

    // ------------------------------------------------------------------ the two pairs of macaws: lanes fixed in the valley
    // A pair never keeps station on us except the bow pair through the avenue. Everything else it flies is a straight lane
    // fixed in the valley, flown at a bird's pace by the metres of route we have flown (BIRD_RATE metres of lane for each).
    //   THE CREST PAIR flies one straight lane for the whole flight: from starboard, over the flown line above the crown's
    //   falling edge (CREST_X metres of route from the entry, 5 m over the line, as we come between the entry's palms),
    //   then rising away to port over the hills, where it stays a far speck.
    //   THE BOW PAIR comes down the valley ahead of us on a straight lane that ends at its station beside the bow where the
    //   flown line is level with the avenue's first palms; it rows beside the bow (5 m to port of the line, 7.5 and 13 m
    //   ahead of the eye's place) to the avenue's last palms; from there it flies a straight lane to port, never nearer
    //   the cactus, climbing, and stays a far speck over the hills. The change from lane to station and back is made over
    //   BOW_EASE metres of route at each end of the avenue.
    const BIRD_RATE = 0.7, CREST_X = 58, CREST_LEAD = 28, BOW_EASE = 50;
    const bowPair = (() => {
      const t = V(), left = V(), up = V(0, 1, 0), a = V(), c = V();
      const station = (m, b, out) => { const mm = Math.min(m + 7.5 + b * 5.5, L - 0.5); path.posAtDist(mm, out); path.tangentAtDist(mm, t); left.crossVectors(up, t).normalize(); out.addScaledVector(left, 5.0 - b * 0.5); out.y += -1.0 + b * 0.8; return out; };
      const IN = V(0, -0.2, 0.98).normalize(), OUT = V(1, 0.27, -0.06).normalize(), P0 = [station(M_AV0, 0, V()), station(M_AV0, 1, V())], P1 = [station(M_AV1, 0, V()), station(M_AV1, 1, V())];
      return (m, b, out) => {
        const wIn = smoothstep(M_AV0 - BOW_EASE, M_AV0, m), wOut = smoothstep(M_AV1, M_AV1 + BOW_EASE, m);
        a.copy(P0[b]).addScaledVector(IN, BIRD_RATE * (m - M_AV0));                 // the lane down the valley
        if (wIn > 0 && wOut < 1) a.lerp(station(m, b, c), wIn);
        if (wOut > 0) a.lerp(c.copy(P1[b]).addScaledVector(OUT, BIRD_RATE * (m - M_AV1)), wOut);    // the lane away to port
        return out.copy(a);
      };
    })();
    const crestPair = (() => {
      const DIR = V(0.8, 0.16, 0.58).normalize(), SIDE = V(DIR.z, 0, -DIR.x).normalize(), X = path.posAtDist(CREST_X, V());
      return (m, b, out) => out.copy(X).addScaledVector(DIR, BIRD_RATE * (m - (CREST_X - CREST_LEAD)) - 7 * b).addScaledVector(SIDE, 1.8 * b).setY(out.y + 5 + 0.6 * b);
    })();
    // both pairs' lanes as points every 2 m of route: the standing things, the hills and the clouds keep off them
    const LANES = []; for (let m = 0; m <= L; m += 2) { for (let b = 0; b < 2; b++) LANES.push(bowPair(m, b, V()), crestPair(m, b, V())); if (m % 300 === 298) await tick(); }
    const laneAir = (x, y, z) => { let d = 1e9; for (const q of LANES) { const e = (q.x - x) ** 2 + (q.y - y) ** 2 + (q.z - z) ** 2; if (e < d) d = e; } return Math.sqrt(d); };
    const laneAirXZ = (x, z, yTop) => { let d = 1e9; for (const q of LANES) if (q.y < yTop) { const e = (q.x - x) ** 2 + (q.z - z) ** 2; if (e < d) d = e; } return Math.sqrt(d); };     // in plan, to the parts of the lanes below yTop
    await tick();

    // ------------------------------------------------------------------ the scallops: true hill domes overlapping in rows
    // (each at least a quarter as tall as it is wide: H = 0.5 to 0.62 R; graded by height, so the pale crown is the top half)
    const hills = [];
    const HAMLET = { x: CX + 88 * Math.sin(0.12), z: CZ + 88 * Math.cos(0.12) }, HAM3 = { x: CX + 120 * Math.sin(1.86), z: CZ + 120 * Math.cos(1.86) };       // the second hamlet, outside the loop on the cactus's far side
    {
      const hr = rng.fork('hills');
      const tryHill = (x, z, Rr, k) => {
        if (pathDistXZ(x, z) < Rr + 60 || trackDistXZ(x, z) < Rr + 14 || cactusDist(x, z) < Rr + 150 || Math.hypot(x - HAMLET.x, z - HAMLET.z) < Rr + 40 || Math.hypot(x - HAM3.x, z - HAM3.z) < Rr + 30) return;
        if (inCrest(x, z, Rr * 0.8)) return;
        // (no hill stands in a pair's lane: every point of the lanes is 4 m and more above the dome or outside it)
        for (const q of LANES) { const d2 = ((q.x - x) ** 2 + (q.z - z) ** 2) / (Rr * Rr); if (d2 < 1 && q.y < Rr * k * Math.pow(1 - d2, 0.62) - 0.5 + 4) return; }
        hills.push({ p: V(x, -0.5, z), s: V(Rr, Rr * k, Rr), pig: hillPig[Math.floor(hr() * 3)] });
      };
      for (const side of [-1, 1]) for (let row = 0; row < 5; row++) for (let z = -420 + hr() * 60; z < 1750;) {
        const Rr = 46 + row * 17 + hr() * 30, k = 0.5 + hr() * 0.12;
        tryHill(side * (178 + row * 96 + Rr * 0.3 + hr() * 40), z, Rr, k);
        z += Rr * (1.05 + hr() * 0.35);
      }
      for (let i = 0; i < 16; i++) { const Rr = 90 + hr() * 90; tryHill((hr() - 0.5) * 900, CZ + 620 + hr() * 800, Rr, 0.5 + hr() * 0.1); }      // the valley's end
      for (let i = 0; i < 9; i++) { const Rr = 70 + hr() * 70; tryHill((hr() - 0.5) * 800, -560 - Rr - hr() * 420, Rr, 0.5); }                  // far behind the crest (480 m and more back)
      const near = hills.filter((h) => h.s.x < 100), far = hills.filter((h) => h.s.x >= 100);
      add('ground', instanced(domeGeometry(22, 6, (r) => Math.pow(Math.max(0, 1 - r * r), 0.62), 1, 1), matHill, near), instanced(domeGeometry(20, 6, (r) => Math.pow(Math.max(0, 1 - r * r), 0.62), 1, 1), matHill, far));
    }
    await tick();

    // ------------------------------------------------------------------ her quilt: the valley floor is covered by rounded plots
    // Low lapped domes on a hex grid (22 m apart near the line, 56 m far off), each one pigment graded from its pale middle,
    // its brush rows running its own way; they keep off the railway, the yard, the pond, the cactus's foot and the cream
    // paths, so red earth shows only there. Rows of ball plants, banana clumps and paddle cacti stand on the nearer plots.
    const lanes = [[[-44, FARM.z + 6], [-92, FARM.z + 34], [-150, FARM.z + 92], [-196, FARM.z + 170], [-240, FARM.z + 190]], [[-14, 300], [-70, 288], [-140, 252], [-205, 184]],
      [[22, 252], [84, 232], [150, 242], [232, 204]], [[HAMLET.x + 16, HAMLET.z + 10], [HAMLET.x + 70, HAMLET.z + 52], [HAMLET.x + 150, HAMLET.z + 70]], [[-62, FARM.z - 28], [-110, FARM.z - 60], [-180, FARM.z - 70]]]
      .map((pts) => new THREE.CatmullRomCurve3(pts.map((p) => V(p[0], 0, p[1])), false, 'centripetal').getSpacedPoints(Math.round(pts.length * 14)));
    const laneDist = (x, z) => { let b = 1e9; for (const L2 of lanes) for (const p of L2) { const d = (p.x - x) ** 2 + (p.z - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    const plots = [], plotGrid = new Map(), PG = 48, pkey = (x, z) => Math.floor(x / PG) + ':' + Math.floor(z / PG);
    const plotProfile = (r) => Math.pow(Math.max(0, 1 - r * r), 0.7);
    {
      const qr = rng.fork('quilt');
      const pigs = [[pg.green, 0.3], [pg.greenPale, 0.22], [pg.greenDark, 0.18], [pg.deep, 0.07], [pinkEarth, 0.11], [pg.cream, 0.07], [pg.yellow, 0.05]];
      const pick = () => { let k = qr(); for (const [p, w] of pigs) { if (k < w) return p; k -= w; } return pg.green; };
      const nearZone = (x, z) => pathDistXZ(x, z) < 150 || (z > -20 && z < CZ + 140 && trackDistXZ(x, z) < 110) || cactusDist(x, z) < 230;
      const tryPlot = (x, z, cell, fine) => {
        const r = cell * (0.68 + qr() * 0.12), sx = r * (0.88 + qr() * 0.3), sz = r * (0.88 + qr() * 0.3), yaw = qr() * 3.1416, h = fine ? 0.5 + qr() * 1.3 : cell > 100 ? 4 + qr() * 5 : 1.6 + qr() * 2.2, pig = pick(), rm = Math.max(sx, sz);
        if (trackDistXZ(x, z) < rm * 0.9 + 3.6 + (rare ? 4.3 : 0) || laneDist(x, z) < rm * 0.9 + 1.3 || cactusDist(x, z) < rm + 30 || Math.hypot(x - POND.x, z - POND.z) < rm * 0.92 + POND.r + 1.5) return;
        if (Math.hypot(x - FARM.x, z - FARM.z) < rm * 0.9 + 36 || Math.hypot(x - HAMLET.x, z - HAMLET.z) < rm * 0.9 + 21 || Math.hypot(x - HAM3.x, z - HAM3.z) < rm * 0.9 + 19 || inCrest(x, z, -rm * 0.25)) return;
        for (const hl of hills) if (Math.hypot(x - hl.p.x, z - hl.p.z) < hl.s.x * 0.86 - rm * 0.3) return;
        const pl = { p: V(x, -0.04, z), s: V(sx, h, sz), yaw, pig, x, z, sx, sz, h, rm, fine };
        plots.push(pl);
        for (let gx = Math.floor((x - rm) / PG); gx <= Math.floor((x + rm) / PG); gx++) for (let gz = Math.floor((z - rm) / PG); gz <= Math.floor((z + rm) / PG); gz++) { const k = gx + ':' + gz; if (!plotGrid.has(k)) plotGrid.set(k, []); plotGrid.get(k).push(pl); }
      };
      let n = 0;
      for (const [cell, fine, X, Z0, Z1] of [[22, true, 560, -330, CZ + 760], [56, false, 560, -330, CZ + 760], [150, false, 1700, -1100, CZ + 2100]]) {
        const dz = cell * 0.866;
        for (let j = 0, z = Z0; z < Z1; j++, z += dz) for (let x = -X + (j % 2) * cell * 0.5; x < X; x += cell) {
          const px = x + (qr() - 0.5) * cell * 0.3, pz = z + (qr() - 0.5) * cell * 0.3, nz = nearZone(px, pz);
          if (cell > 100 ? (Math.abs(px) > 540 || pz < -310 || pz > CZ + 740) : nz === fine) tryPlot(px, pz, cell, fine);
          if (++n % 400 === 0) await tick();
        }
      }
      add('ground', instanced(domeGeometry(14, 2, plotProfile, 2), matGround, plots.filter((p) => p.fine)), instanced(domeGeometry(12, 2, plotProfile, 2), matGround, plots.filter((p) => !p.fine)));
    }
    // the height of the quilt (and the crest) at a place: things stand ON the plots, like toys on a cloth
    const plotY = (x, z) => {
      let y = groundY(x, z); const c = plotGrid.get(pkey(x, z)); if (!c) return y;
      for (const pl of c) { const dx = x - pl.x, dz = z - pl.z, cs = Math.cos(pl.yaw), sn = Math.sin(pl.yaw), lx = (dx * cs - dz * sn) / pl.sx, lz = (dx * sn + dz * cs) / pl.sz, rr = lx * lx + lz * lz; if (rr < 1) y = Math.max(y, pl.h * plotProfile(Math.sqrt(rr)) - 0.04); }
      return y;
    };
    await tick();

    // ------------------------------------------------------------------ the railway: one ribbon; bed, rails and sleepers are drawn in its material
    // (rails never thinner than 1.5 pixels, sleepers fading to their flat average tint before they could shimmer). In the
    // rare deal a second line lies 4.3 m to port of it for the pink train, over the whole of that train's run: from the
    // line away to the south-east, round the loop and over the bridge, back to the hill's foot.
    const S_END = TL - 6, LINE2 = 4.3;
    const sLoop = (deg) => sNear(loopAt(deg)[0], loopAt(deg)[1]);
    // the second line's span: the whole of the pink train's run, its last wagon and its nose with 12 m to spare
    const S2A = Math.max(0, Math.min(sNear(128, -20), train2T[MR] - 4.6 - 12)), S2B = Math.min(S_END, train2T[0] + CAR_BACK[3] + 3.4 + 12);
    const trackOff = (s, off, out = V()) => { trackAt(s, out); if (off) { trackTan(s, _tt2); out.x += _tt2.z * off; out.z -= _tt2.x * off; } return out; };
    const _tt2 = V();
    const earthRoof2 = earthRoof;
    {
      const bedPig = edition === 'rain' ? earthRoof : { mid: mix(R.earth, R.cream, 0.34), base: mix(R.earth, R.cream, 0.12), rim: mix(R.earth, R.deep, 0.16) };
      const bedMat = new THREE.ShaderMaterial({
        uniforms: { ...STYLE, uBedMid: { value: bedPig.mid }, uBedBase: { value: bedPig.base }, uBedRim: { value: bedPig.rim }, uRail: { value: R.cream.clone() }, uRailRim: { value: pg.cream.rim.clone() }, uSleeper: { value: mix(R.earth, R.deep, 0.34) }, uBedSh: { value: mix(R.earth, R.deep, 0.3) }, ...shU },
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `varying vec2 vUv; varying vec3 vW; uniform vec3 uBedSh; uniform vec3 uBedMid; uniform vec3 uBedBase; uniform vec3 uBedRim; uniform vec3 uRail; uniform vec3 uRailRim; uniform vec3 uSleeper;
          ${GRADE_GLSL}
          ${SHADOW_GLSL}
          void main() {
            float fx = fwidth(vUv.x), fs = fwidth(vUv.y / 2.4), fr = fwidth(vUv.x * 2.6);
            float sh = sgShadow(vW.xz) * uShAmt;
            float ax = abs(vUv.x);
            vec3 col = sgGrade(uBedMid, uBedBase, uBedRim, ax) * sgRidge(vUv.x * 2.6, fr);
            // sleepers: 0.6 m every 2.4 m, 3.4 m long; past the point where they are a pixel apart, their flat average
            float d = abs(fract(vUv.y / 2.4) - 0.5), sl = 1. - smoothstep(0.125 - fs, 0.125 + fs, d);
            sl = mix(sl, 0.25, smoothstep(0.2, 0.5, fs)) * (1. - smoothstep(0.654 - fx, 0.654 + fx, ax));
            col = mix(col, uSleeper, sl * 0.85);
            // rails: 0.5 m of cream at 1.05 m either side of the middle, never under 1.5 pixels (thinner: paler instead)
            float hw = 0.096, w = max(hw, fx * 0.75), rl = (1. - smoothstep(w - fx * 0.5, w + fx * 0.5, abs(ax - 0.404))) * (hw / w);
            col = mix(col, mix(uBedSh, uShTint, 0.2), sh);
            col = mix(col, mix(mix(uRail, uRailRim, smoothstep(0.3, 1., abs(ax - 0.404) / w)), uRailRim * 0.86, sh), rl);
            gl_FragColor = vec4(col, 1.);
          }`,
      });
      const ribbonGeo = (s0, s1, off) => {
        const pos = [], uv = [], idx = [], a = V(), t = V(); let n = 0;
        for (let s = s0; ; s = Math.min(s + 3.2, s1)) {
          trackOff(s, off, a); trackTan(s, t); const nx = t.z, nz = -t.x, y = a.y + BED_Y + (off ? 0.02 : 0);
          pos.push(a.x + nx * 2.6, y, a.z + nz * 2.6, a.x - nx * 2.6, y, a.z - nz * 2.6); uv.push(1, s, -1, s);
          if (n) idx.push(n * 2 - 2, n * 2 - 1, n * 2, n * 2 - 1, n * 2 + 1, n * 2); n++;
          if (s >= s1) break;
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
      };
      const beds = [ribbonGeo(0, S_END, 0)]; if (rare) beds.push(ribbonGeo(S2A, S2B, LINE2));
      const bed = new THREE.Mesh(mergeGeometries(beds, false), bedMat); beds.forEach((g) => g.dispose()); bed.frustumCulled = false; add('rail', bed);
      await tick();
      // the ramps up to the bridge: earth walls under the bed
      const wall = [], a = V(), b = V(), ta = V();
      for (const off of rare ? [0, LINE2] : [0]) for (const [s0, s1] of [[sB0 - 34, sB0 - 1], [sB1 + 1, sB1 + 34]]) for (let s = s0; s < s1; s += 5.5) {
        const e = Math.min(s + 5.5, s1); trackOff(s, off, a); trackOff(e, off, b); trackTan((s + e) / 2, ta); const n = V(ta.z, 0, -ta.x).normalize();
        for (const sd of [1, -1]) { const A = a.clone().addScaledVector(n, sd * 2.6), B = b.clone().addScaledVector(n, sd * 2.6); const q = [A.clone().setY(-0.2), B.clone().setY(-0.2), B.clone().setY(b.y + 0.1), A.clone().setY(a.y + 0.1)]; wall.push(sd > 0 ? q.reverse() : q); }
      }
      const rampG = paint(faceGeometry(wall), earthRoof2); const ramp = new THREE.Mesh(rampG, matFace); ramp.frustumCulled = false; add('rail', ramp);
    }
    await tick();

    // ------------------------------------------------------------------ the trains: a deep green engine, three wagons, cream puffs
    // One geometry of tubes and one of flat faces for all the cars; each vertex knows its car (aCar) and the cars are set on
    // the line by matrices, by the train's law (the metres of route flown). Rods and hubs crank with the distance run. Cars 4..7 are the rare
    // deal's second train (a pink engine, running the other way on the second line).
    const carM = [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Matrix4().makeTranslation(0, -400, 0)), uRoll = { value: 0 };
    const trainDecl = 'attribute float aCar; attribute float aCrank; uniform mat4 uCar[8]; uniform float uRoll;';
    const trainPre = 'm = modelMatrix * uCar[int(aCar + 0.5)]; pos.y += aCrank * 0.36 * cos(uRoll); pos.z += aCrank * 0.36 * sin(uRoll);';
    const matTrainT = gradeMaterial({ mode: 0, uniforms: { uCar: { value: carM }, uRoll }, vertexDecl: trainDecl, vertexPre: trainPre });
    const matTrainF = gradeMaterial({ mode: 2, uniforms: { uCar: { value: carM }, uRoll }, vertexDecl: trainDecl, vertexPre: trainPre, side: THREE.DoubleSide });
    {
      const tubes = [], faces = [];
      const tag = (g, car, crank = 0) => { const n = g.attributes.position.count; g.setAttribute('aCar', new THREE.BufferAttribute(new Float32Array(n).fill(car), 1)); g.setAttribute('aCrank', new THREE.BufferAttribute(new Float32Array(n).fill(crank), 1)); return g; };
      const T = (g, pig, car, crank = 0) => tubes.push(tag(paint(g, pig), car, crank));
      const F = (polys, pig, car) => faces.push(tag(paint(faceGeometry(polys), pig), car));
      const wheel = (car, x, z, r) => {
        const w = ballGeometry(0.17, r, r, 14, 6, 0, true); w.translate(x, r, z); T(w, earthRoof, car);
        const h = ballGeometry(0.1, 0.2, 0.2, 6, 4); h.translate(x + Math.sign(x) * 0.2, r, z); T(h, pg.cream, car, 1);
      };
      const makeTrain = (c0, body, band, wagons) => {
        // engine (car c0): nose toward +Z, 9 m long, 4 m tall, funnel to 5 m
        T(tubeGeometry([V(0, 2.35, -1.5), V(0, 2.35, 0), V(0, 2.35, 2), V(0, 2.35, 3.6), V(0, 2.35, 4.2), V(0, 2.35, 4.55)], [1.22, 1.27, 1.27, 1.22, 0.85, 0], 18), body, c0);
        T(tubeGeometry([V(0, 3.3, 3.1), V(0, 4.0, 3.1), V(0, 4.0, 3.1), V(0, 4.45, 3.1), V(0, 4.45, 3.1), V(0, 5.0, 3.1), V(0, 5.02, 3.1)], [0.42, 0.44, 0.52, 0.52, 0.5, 0.68, 0], 12), body, c0);
        T(tubeGeometry([V(0, 4.0, 3.1), V(0, 4.45, 3.1)], [0.535, 0.535], 12), band, c0);
        { const d = ballGeometry(0.52, 0.6, 0.52, 10, 6); d.translate(0, 3.5, 0.9); T(d, band, c0); }
        for (const sx of [1, -1]) {
          for (const z of [-3.1, -0.8, 1.5]) wheel(c0, sx * 1.32, z, 0.9);
          T(tubeGeometry([V(sx * 1.56, 0.9, -3.1), V(sx * 1.56, 0.9, 1.5)], [0.1, 0.1], 6), pg.cream, c0, 1);
        }
        F(boxFaces(-1.38, 1.38, 1.05, 4.0, -4.4, -1.45), body, c0);
        F(boxFaces(-1.6, 1.6, 4.0, 4.22, -4.65, -1.2), earthRoof, c0);
        F(boxFaces(-1.12, 1.12, 0.7, 1.12, -4.4, 4.2), earthRoof, c0);
        for (const sx of [1, -1]) { const x = sx * 1.4, q = [V(x, 2.5, -3.9), V(x, 2.5, -2.0), V(x, 3.6, -2.0), V(x, 3.6, -3.9)]; F([sx > 0 ? q.reverse() : q], flat(band.base), c0); }
        // wagons: cubes on four wheels, a painted door
        wagons.forEach((pig, k) => {
          const c = c0 + k + 1;
          F(boxFaces(-1.34, 1.34, 1.05, 3.5, -3.2, 3.2), pig, c); F(boxFaces(-1.5, 1.5, 3.5, 3.7, -3.4, 3.4), earthRoof, c); F(boxFaces(-1.1, 1.1, 0.7, 1.08, -3.3, 3.3), earthRoof, c);
          for (const sx of [1, -1]) { const x = sx * 1.37, q = [V(x, 1.2, -0.8), V(x, 1.2, 0.8), V(x, 3.0, 0.8), V(x, 3.0, -0.8)]; F([sx > 0 ? q.reverse() : q], flat(R.deep), c); for (const z of [-2.1, 2.1]) wheel(c, sx * 1.3, z, 0.72); }
        });
      };
      makeTrain(0, pg.deep, pg.yellow, [pg.blue, pg.yellow, pg.pink]);       // the green engine; a blue, a yellow and a pink wagon
      if (rare) makeTrain(4, pg.pink, pg.cream, [pg.blue, pg.cream, pg.yellow]);
      // (the cars are built 200 m down the course and set on the line by their matrices, which take the 200 m off again:
      // nothing built stands at the origin, behind the entry)
      const tm = new THREE.Mesh(mergeGeometries(tubes, false).translate(0, 0, 200), matTrainT), fm = new THREE.Mesh(mergeGeometries(faces, false).translate(0, 0, 200), matTrainF);
      tubes.forEach((g) => g.dispose()); faces.forEach((g) => g.dispose());
      tm.frustumCulled = fm.frustumCulled = false; add('train', tm, fm);
    }
    await tick();
    // (where the engine's middle is on the line: trainS and train2S, the train's law above, read by the metres of route flown)
    const _p = V(), _t = V(), _q = new THREE.Quaternion(), _one = V(1, 1, 1), _z = V(0, 0, 1), _unshift = new THREE.Matrix4().makeTranslation(0, 0, -200);
    const placeTrain = (u) => {
      const s = trainS(u);
      for (let c = 0; c < 4; c++) { trackAt(s - CAR_BACK[c], _p); trackTan(s - CAR_BACK[c], _t); _q.setFromUnitVectors(_z, _t); shCar[c].set(_p.x + SHD.x * SHK * _p.y, _p.z + SHD.z * SHK * _p.y, _t.x, _t.z); carM[c].compose(_p.setY(_p.y + 0.45), _q, _one).multiply(_unshift); }
      if (rare) { const s2 = train2S(u); for (let c = 0; c < 4; c++) { trackOff(s2 + CAR_BACK[c], LINE2, _p); trackTan(s2 + CAR_BACK[c], _t).negate(); _q.setFromUnitVectors(_z, _t); shCar[4 + c].set(_p.x + SHD.x * SHK * _p.y, _p.z + SHD.z * SHK * _p.y, _t.x, _t.z); carM[4 + c].compose(_p.setY(_p.y + 0.45), _q, _one).multiply(_unshift); } }
      uRoll.value = s / 1.9;
      return s;
    };
    // puffs: one laid every 14 m of the line as a funnel passes, then hanging there; none where the path comes near
    const puffs = [];
    const layPuffs = (s0, s1, off, dir) => {
      for (let s = s0; s < s1; s += 14) {
        const b = trackOff(s, off, V()), r = 1.5 + rng() * 0.7; let cap = 5.5 + rng() * 2; b.y += 5.6; b.x += (rng() - 0.5) * 1.2;
        if (b.z < 3.5 && Math.abs(b.x) < 124) continue;                                 // nothing hangs behind the entry within 120 m of its axis
        while (cap > 0 && pathDist(b.x, b.y + cap, b.z) - 1.6 * r < 5) cap -= 1.5;
        if (cap <= 0 && pathDist(b.x, b.y, b.z) - 1.6 * r < 5) continue;
        const tq = trackTan(s, V()); puffs.push({ s, b, r, cap: Math.max(cap, 0), dir, q: new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.atan2(tq.x, tq.z) + Math.PI / 2) });
      }
    };
    // (over the whole run of each train, from 44 m behind where its engine is as we enter to where it is as we leave)
    layPuffs(trainT[0] - 44, trainT[MR], 0, 1);
    if (rare) layPuffs(train2T[MR], train2T[0] + 44, LINE2, -1);
    const puffMesh = instanced(heapGeometry(PUFF_LOBES, 7, 4, 0.7), matHeap, puffs.map((f) => ({ p: f.b, s: 0.001, pig: cloudPig })));
    add('puffs', puffMesh);
    const _m = new THREE.Matrix4(), _s = V();
    const placePuffs = (sEngine, sEngine2) => {
      for (let i = 0; i < puffs.length; i++) {
        const f = puffs[i], a = (f.dir > 0 ? sEngine - 3.1 - f.s : f.s - sEngine2 - 3.1) / 70, k = smoothstep(0, 0.1, a) * (1 - smoothstep(0.5, 0.92, a));
        _p.copy(f.b); _p.y += f.cap * (1 - Math.exp(-Math.max(a, 0) * 2.2));
        _m.compose(_p, f.q, _s.setScalar(Math.max(0.001, f.r * 1.25 * k * (0.55 + 0.45 * smoothstep(0, 0.5, a)))));
        puffMesh.setMatrixAt(i, _m);
      }
      puffMesh.instanceMatrix.needsUpdate = true;
    };
    await tick();

    // ------------------------------------------------------------------ small helpers for baked parts
    // move a baked part (position, normal and the grade datum aG together)
    const _n3 = new THREE.Matrix3();
    const xform = (g, mtx) => {
      g.applyMatrix4(mtx); _n3.setFromMatrix4(mtx);
      const ag = g.attributes.aG, v = V();
      for (let i = 0; i < ag.count; i++) { v.fromBufferAttribute(ag, i); const l = v.length(); v.applyMatrix3(_n3); if (l > 1e-6) v.setLength(l); ag.setXYZ(i, v.x, v.y, v.z); }
      return g;
    };
    const mat4 = (px, py, pz, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(V(px, py, pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), V(s, s, s));
    // rewrite a face part's grade datum from its positions (one grade over a wall made of many polygons)
    const regrade = (g, fn) => { const p = g.attributes.position, ag = g.attributes.aG, v = V(), o = V(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); fn(v, o); ag.setXYZ(i, o.x, o.y, o.z); } return g; };
    const rimOf = (pig) => ({ mid: pig.rim.clone(), base: pig.rim.clone(), rim: pig.rim.clone() });

    // ------------------------------------------------------------------ palms: a ringed trunk and six paddle leaves, rocking as one piece
    const rockPre = `float rk = 0.052 * sin(uTime * 0.9 + instanceMatrix[3].x * 0.7 + instanceMatrix[3].z * 0.4); float rc = cos(rk), rs = sin(rk);
      pos.xy = vec2(rc * pos.x - rs * pos.y, rs * pos.x + rc * pos.y); nrm.xy = vec2(rc * nrm.x - rs * nrm.y, rs * nrm.x + rc * nrm.y); g.xy = vec2(rc * g.x - rs * g.y, rs * g.x + rc * g.y);`;
    const matRockT = gradeMaterial({ mode: 0, vertexPre: rockPre });
    const palmGeometry = (radial, lw, lh) => {
      const parts = [], H = 12;
      for (let k = 0; k < 8; k++) parts.push(paint(tubeGeometry([V(0, k * 1.5 - (k ? 0 : 0.6), 0), V(0, k * 1.5 + 1.5, 0)], [0.56 - k * 0.014, 0.56 - (k + 1) * 0.014], radial), k % 2 ? pg.pink : pg.cream));
      parts.push(paint(ballGeometry(0.8, 0.85, 0.8, Math.max(6, radial), 4), pg.greenDark).translate(0, H + 0.2, 0));
      for (let k = 0; k < 6; k++) {
        const leaf = ballGeometry(1.05, 2.3, 0.3, lw, lh, 0.22, true); leaf.translate(0, 2.5, 0);
        parts.push(paint(xform(leaf, mat4(0, H + 0.3, 0, k % 2 ? 1.5 : 0.8, (k / 6) * 6.2832 + 0.3, 0)), k % 2 ? pg.greenDark : pg.green));
      }
      const a = mergeGeometries(parts, false); parts.forEach((g) => g.dispose());
      return a;
    };
    const farmClear = (x, z, r) => Math.hypot(x - FARM.x, z - FARM.z) > 46 + r && Math.hypot(x - HAMLET.x, z - HAMLET.z) > 19 + r && Math.hypot(x - HAM3.x, z - HAM3.z) > 18 + r;
    const inHill = (x, z, r = 0) => hills.some((h) => Math.hypot(x - h.p.x, z - h.p.z) < h.s.x * 0.92 + r);
    // a palm stands clear of the pairs' lanes: its crown (a ball 4.4 m across the scale, 13.6 m up) by 5 m of air, its trunk by 5 m in plan
    const palmOffLanes = (x, z, sc) => laneAir(x, plotY(x, z) - 0.3 + 13.6 * sc, z) > 4.4 * sc + 5 && laneAirXZ(x, z, plotY(x, z) + 13 * sc) > 5;
    const palmCrowns = [];                                                                         // { x, y, z, r } of every palm's crown, for the wheeling birds
    {
      const pr = rng.fork('palms'), near = [], far = [];
      const put = (list, x, z, s) => { const y0 = plotY(x, z) - 0.3; list.push({ p: V(x, y0, z), yaw: pr() * 6.283, s }); palmCrowns.push({ x, y: y0 + 13.6 * s, z, r: 4.4 * s }); shStand(x, z, 12.2 * s, 0.62 * s); const [ax, az] = shAt(x, 12.6 * s, z); shSeg(ax, az, ax, az, 3.6 * s, 3.6 * s, 1.6); };
      put(near, 9.6, 33, 1.14); put(near, -9.8, 36, 1.08);                                        // the pair at the entry
      // the avenue: along the straight of the railway, from AV_Z0 to where the track begins its swing (AV_Z1, found above)
      for (let z = AV_Z0; z <= AV_Z1; z += AV_STEP) { put(near, -10.5 - pr() * 0.6, z + pr() * 1.2, 0.9 + pr() * 0.3); put(near, 15.4 + pr() * 0.6, z + pr() * 1.2, 0.9 + pr() * 0.3); if ((z - AV_Z0) % (4 * AV_STEP) === 0) await tick(); }
      await tick();
      // singles by the line, round the pond and the row at the second hamlet (each kept off the line, the railway, the water and the pairs' lanes)
      const singles = [[-13, 164], [16.5, 172], [-22, 318 + FZ], [-54, 384 + FZ], [27, 430 + FZ], [-70, 468 + FZ], [44, POND.z + 34], [-42, POND.z + 46], [-8, POND.z + 50], [66, POND.z - 4], [-96, CZ - 40], [-104, CZ + 6]];
      for (let k = 0; k < 6; k++) { const a = -0.62 + k * 0.1, rr = loopR(a * 180 / Math.PI) + 12 + (k % 2) * 2.5; singles.push([CX + rr * Math.sin(a), CZ + rr * Math.cos(a)]); }
      for (const [x, z] of singles) { const sc = 0.85 + pr() * 0.4; if (pathDistXZ(x, z) > 12 && trackDistXZ(x, z) > 8 && Math.hypot(x - POND.x, z - POND.z) > POND.r + 3 && palmOffLanes(x, z, sc)) put(near, x, z, sc); }
      await tick();
      const nFar = Math.round(130 * detail * dens);
      for (let i = 0; i < nFar * 5 && far.length < nFar; i++) {
        if (i % 24 === 23) await tick();
        const x = (pr() - 0.5) * (i % 3 ? 440 : 900), z = -60 + pr() * (i % 3 ? CZ + 240 : CZ + 800), s = 0.8 + pr() * 0.55;
        if (pathDistXZ(x, z) < 16 || trackDistXZ(x, z) < 9 || cactusDist(x, z) < LOOP_R + 11 || Math.hypot(x - POND.x, z - POND.z) < POND.r + 3 || !farmClear(x, z, 0) || inHill(x, z) || laneDist(x, z) < 3) continue;
        if (inCrest(x, z, 2)) continue;                                                          // the crest's own pair stands alone
        if (z < 8 && Math.abs(x) < 130) continue;                                              // nothing stands behind the entry
        if (!palmOffLanes(x, z, s)) continue;                                                    // nor in a pair's lane
        put(far, x, z, s);
      }
      await tick();
      add('palms', instanced(palmGeometry(10, 8, 5), matRockT, near), instanced(palmGeometry(5, 5, 3), matRockT, far));
    }
    await tick();

    // ------------------------------------------------------------------ the pond and the three-arch bridge
    {
      add('ground', instanced(domeGeometry(40, 4, () => 0, 0), matGround, [{ p: V(POND.x, 0.16, POND.z), s: V(POND.r, 1, POND.r), pig: pg.blue }]));
      const c = trackAt(sBC, V()), t = trackTan(sBC, V()).setY(0).normalize(), yaw = Math.atan2(t.x, t.z), top = BRIDGE_H + 0.75, hw = 2.75;
      const walls = [], under = [], span = 13, rise = 3.9, pier = 2.6, x0 = -(3 * span + 2 * pier) / 2;
      for (const sd of [1, -1]) {
        const Q = (pts) => walls.push(sd > 0 ? pts.map((p) => V(sd * hw, p[1], p[0])) : pts.map((p) => V(sd * hw, p[1], p[0])).reverse());
        Q([[-25, -0.3], [x0, -0.3], [x0, top], [-25, top]]); Q([[-x0, -0.3], [25, -0.3], [25, top], [-x0, top]]);
        for (let k = 0; k < 3; k++) {
          const cx = x0 + k * (span + pier) + span / 2;
          if (k < 2) Q([[cx + span / 2, -0.3], [cx + span / 2 + pier, -0.3], [cx + span / 2 + pier, top], [cx + span / 2, top]]);
          for (let i = 0; i < 10; i++) { const a0 = Math.PI * (1 - i / 10), a1 = Math.PI * (1 - (i + 1) / 10), xa = cx + Math.cos(a0) * span / 2, xb = cx + Math.cos(a1) * span / 2; Q([[xa, Math.sin(a0) * rise - 0.3], [xb, Math.sin(a1) * rise - 0.3], [xb, top], [xa, top]]); }
        }
      }
      for (let k = 0; k < 3; k++) { const cx = x0 + k * (span + pier) + span / 2; for (let i = 0; i < 10; i++) { const a0 = Math.PI * (1 - i / 10), a1 = Math.PI * (1 - (i + 1) / 10), xa = cx + Math.cos(a0) * span / 2, xb = cx + Math.cos(a1) * span / 2, ya = Math.sin(a0) * rise - 0.3, yb = Math.sin(a1) * rise - 0.3; under.push([V(-hw, ya, xa), V(hw, ya, xa), V(hw, yb, xb), V(-hw, yb, xb)]); } }
      const wg = regrade(faceGeometry(walls), (v, o) => o.set(0, clamp((v.y / top) * 2 - 1, -1, 1) * 0.92, 0));
      const bg = mergeGeometries([paint(wg, pg.cream), paint(regrade(faceGeometry(under), (v, o) => o.set(0, 0, 0)), rimOf(pg.cream))], false);
      const bridge = new THREE.Mesh(bg, matFace); bridge.position.set(c.x, 0, c.z); bridge.rotation.y = yaw; add('bridge', bridge);
      for (const off of rare ? [0, LINE2] : [0]) for (let k = 0; k <= 4; k++) { const hgt = (top - 0.4) * k / 4, ox = c.x + t.z * off, oz = c.z - t.x * off, [ax, az] = shAt(ox - t.x * 24, hgt, oz - t.z * 24), [bx, bz] = shAt(ox + t.x * 24, hgt, oz + t.z * 24); shSeg(ax, az, bx, bz, 2.2, 2.2, 1.2); }
      if (rare) { const b2 = new THREE.Mesh(bg, matFace); b2.position.set(c.x + t.z * LINE2, 0, c.z - t.x * LINE2); b2.rotation.y = yaw; add('bridge', b2); }
    }
    await tick();

    // ------------------------------------------------------------------ air to the standing bodies: clouds and wheeling birds fly through nothing
    // The cactus as it stands in the world: its trunk, arms, bud arms and the flower's neck as chains of round sections,
    // its fruit as balls, each flower as a round slab (its cup behind, its cupped petals before). bodyAir(p) is the least
    // air from a point to any of them, to a palm (crown and trunk), to the mill's chimney and the column of its puffs, to
    // a hill's dome and to a cloud at any place of its slide. Clouds and the wheeling macaws are laid only where their
    // whole lane keeps its air: a law of place, tested on the bodies themselves and not only on the flown line.
    const heroAir = (() => {
      const M = hero.object.matrixWorld, D = hero.details;
      const chains = [D.trunk, ...hero.plan.arms, ...D.budLines, D.neck].map((a) => { const w = a.pts.map((q) => q.clone().applyMatrix4(M)), c = V(); for (const q of w) c.add(q); c.multiplyScalar(1 / w.length); let R = 0; w.forEach((q, i) => { R = Math.max(R, q.distanceTo(c) + a.radii[i]); }); return { w, r: a.radii, c, R }; });
      const fruit = D.fruits.map((f) => ({ c: f.p.clone().applyMatrix4(M), r: 1.05 * f.s }));
      const slabs = D.flowers.map((f) => ({ c: f.c.clone().applyMatrix4(M), n: f.face.clone().transformDirection(M), R: (8.7 + 16) * f.s, s: f.s }));
      const balls = []; for (const ch of chains) ch.w.forEach((q, i) => balls.push({ c: q, r: ch.r[i] })); for (const f of fruit) balls.push(f); for (const f of slabs) balls.push({ c: f.c, r: f.R });
      // (with 'stop' given the answer is only good for the question 'is the air under stop': bodies further off are passed over)
      const air = (p, stop = -1e9) => {
        let b = stop > -1e8 ? stop + 0.5 : 1e9;
        for (const ch of chains) { if (p.distanceTo(ch.c) - ch.R > b) continue; for (let i = 0; i < ch.w.length - 1; i++) { const a = ch.w[i], e = ch.w[i + 1], dx = e.x - a.x, dy = e.y - a.y, dz = e.z - a.z, t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy + (p.z - a.z) * dz) / (dx * dx + dy * dy + dz * dz || 1e-9), 0, 1), d = Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t, p.z - a.z - dz * t) - (ch.r[i] + (ch.r[i + 1] - ch.r[i]) * t); if (d < b) b = d; } if (b < stop) return b; }
        for (const f of fruit) b = Math.min(b, p.distanceTo(f.c) - f.r);
        for (const f of slabs) { const dx = p.x - f.c.x, dy = p.y - f.c.y, dz = p.z - f.c.z, h = dx * f.n.x + dy * f.n.y + dz * f.n.z, rr = Math.sqrt(Math.max(0, dx * dx + dy * dy + dz * dz - h * h)); b = Math.min(b, Math.max(h - 8.5 * f.s, -6.5 * f.s - h, rr - f.R)); }
        return b;
      };
      return { air, balls };
    })();
    const cloudBoxes = [];                                                // every cloud with its slide: { x, y, z, hx, hy, hz } (y: its flat base)
    const boxAir = (c, x, y, z) => Math.hypot(Math.max(Math.abs(x - c.x) - c.hx, 0), Math.max(c.y - y, y - c.y - c.hy, 0), Math.max(Math.abs(z - c.z) - c.hz, 0));
    const bodyAir = (p, stop = -1e9) => {
      let b = heroAir.air(p, stop); if (b < stop) return b;
      for (const c of palmCrowns) { const dx = p.x - c.x, dz = p.z - c.z, dh = dx * dx + dz * dz; if (dh > 900) continue; b = Math.min(b, Math.sqrt(dh + (p.y - c.y) ** 2) - c.r); if (p.y < c.y) b = Math.min(b, Math.sqrt(dh) - 0.14 * c.r); }
      { const dx = p.x - CHIM.x, dz = p.z - CHIM.z; b = Math.min(b, Math.max(Math.hypot(dx, dz) - 1.9, p.y - 18.2)); const t = clamp(((p.x - CHIM.x) * 9 + (p.y - 18) * 18) / 405, 0, 1); b = Math.min(b, Math.hypot(dx - 9 * t, p.y - 18 - 18 * t, dz) - 4); }
      for (const h of hills) { const d2 = ((p.x - h.p.x) ** 2 + (p.z - h.p.z) ** 2) / (h.s.x * h.s.x); if (d2 < 1) b = Math.min(b, p.y - (h.s.y * Math.pow(1 - d2, 0.62) - 0.5)); }
      for (const c of cloudBoxes) b = Math.min(b, boxAir(c, p.x, p.y, p.z));
      return b;
    };
    await tick();

    // ------------------------------------------------------------------ cloud sausages: cream middles, pink rims, sliding level
    {
      const cr = rng.fork('clouds'), list = [];
      // a cloud with the whole of its slide (30 m either way) as a box: 14 m and more from the flown line, 3 m and more of
      // air to the cactus's trunk, arms, fruit and flowers, 5 m and more to the pairs' lanes
      const ok = (x, y, z, len, th) => {
        for (let k = -1; k <= 1; k += 0.25) if (pathDist(x + k * (len / 2 + 30), y, z) < th / 2 + 14) return false;
        const c = { x, y, z, hx: 0.66 * len + 30, hy: 1.4 * th, hz: 1.13 * th };
        for (const q of heroAir.balls) if (boxAir(c, q.c.x, q.c.y, q.c.z) - q.r < 3) return false;
        for (const q of LANES) if (boxAir(c, q.x, q.y, q.z) < 5) return false;
        return true;
      };
      const put = (x, y, z, len, th) => { if (ok(x, y, z, len, th) && (z > 20 || Math.abs(x) > 160 + len)) { list.push({ p: V(x, y, z), s: V(len / 3, th, th * 1.3), pig: cloudPig }); cloudBoxes.push({ x, y, z, hx: 0.66 * len + 30, hy: 1.4 * th, hz: 1.13 * th }); } };
      put(0, 78, 46, 64, 13);                                                    // over the crest
      put(-60, 120, 330, 80, 18); put(120, 150, 520, 60, 14); put(185, 90, 556, 54, 13);
      { const d = path.endTangent, e = path.end; put(e.x + d.x * 170 + 10, e.y + d.y * 170, e.z + d.z * 170, 84, 18); }       // behind the flower
      for (let i = 0; i < 200 && list.length < 40; i++) { put((cr() - 0.5) * 1800, 60 + cr() * 160, -300 + cr() * 1900, 30 + cr() * 60, 8 + cr() * 12); if (i % 5 === 4) await tick(); }
      const matCloud = gradeMaterial({ mode: 3, vertexPre: 'm[3].x += 30. * sin(uTime * 0.035 + m[3].z * 0.013 + m[3].y * 0.02);' });
      add('clouds', instanced(heapGeometry(CLOUD_LOBES, 9, 5), matCloud, list));
    }
    await tick();

    // ------------------------------------------------------------------ birds on their own lanes: the two pairs (by the route's metres), and wheelers (clock)
    const birdGeo = macawGeometry(pg, birdBody, pg.yellow), nWheel = Math.round(14 * detail), nRing = 20, nFlower = 8, nBirds = 2 + nWheel + nRing + nFlower + 2;
    const birdAttr = new Float32Array(nBirds * 2), wheel = [];
    for (let i = 0; i < nBirds; i++) { birdAttr[i * 2] = rng() * 6.283; birdAttr[i * 2 + 1] = 1; }
    birdGeo.setAttribute('aBird', new THREE.InstancedBufferAttribute(birdAttr, 2));
    const birdMesh = instanced(birdGeo, macawMaterial(), Array.from({ length: nBirds }, () => ({ p: V(0, -400, 0), s: 1, pig: pg.blue })));
    add('birds', birdMesh);
    {
      const br = rng.fork('birds'), q = V(), BIRD_AIR = 5.2;       // a wheeling bird's middle keeps 5.2 m from every body: 3 m of air and more beyond its own half span
      // a wheel's whole lane (every place on its circle, at the top and the bottom of its bob) against the bodies
      const wheelClear = (c, rad, bob, e1, e2) => {
        for (let a = 0; a < 6.283; a += 0.03) for (const dy of bob ? [-bob, 0, bob] : [0]) {
          if (e1) q.copy(c).addScaledVector(e1, Math.cos(a) * rad).addScaledVector(e2, Math.sin(a) * rad); else q.set(c.x + Math.cos(a) * rad, c.y + dy, c.z + Math.sin(a) * rad);
          if (bodyAir(q, BIRD_AIR) < BIRD_AIR) return false;
        }
        return true;
      };
      // the valley's wheelers: level circles over the plots, 12 m and more from the flown line, 11.5 m and more above the
      // ground (over every roof, mast and pole), 26 m and more up where they pass over the railway (over the engine's puffs)
      for (let i = 0; i < nWheel * 6 && wheel.length < nWheel; i++) {
        const c = V((br() - 0.5) * 260, 12 + br() * 40, 120 + br() * (CZ - 40)), rad = 14 + br() * 22;
        const w = { c, rad, w: (br() < 0.5 ? -1 : 1) * (5.5 + br() * 3) / rad, ph: br() * 6.283, bob: 1 + br() * 2, s: 1.15 };
        if (pathDist(c.x, c.y, c.z) < rad + 12 || cactusDist(c.x, c.z) < rad + 100 || c.y - w.bob < 11.5) continue;
        if (c.y - w.bob < 26) { let over = false; for (let a = 0; a < 6.283 && !over; a += 0.1) if (trackDistXZ(c.x + Math.cos(a) * rad, c.z + Math.sin(a) * rad) < 7 + (rare ? LINE2 : 0)) over = true; if (over) continue; }
        const clear = wheelClear(c, rad, w.bob); await tick();
        if (clear) wheel.push(w);
      }
      await tick();
      // macaws wheel round the cactus at our height as we climb: four level rings outside the turn. Each ring is the first
      // of its candidates (widening by 2 m, then 1.5 m higher) that keeps 9.5 m from the flown line and its air to every
      // body; a ring for which none is found is flown high over the valley, 160 m out.
      const ringOK = (y, rad) => { for (let a = 0; a < 6.283; a += 0.06) if (pathDist(CX + Math.cos(a) * rad, y, CZ + Math.sin(a) * rad) < 9.5) return false; return wheelClear(V(CX, y, CZ), rad, 0.7); };
      for (let k = 0; k < 4; k++) {
        let y = 25 + k * 11.5, rad = 62 + (k % 2) * 3, ok = false;
        for (let h = 0; h < 4 && !ok; h++) for (let r = 0; r < 22 && !ok; r++) { if (ringOK(y + h * 1.5, rad + r * 2)) { ok = true; y += h * 1.5; rad += r * 2; } if (r % 3 === 2 || ok) await tick(); }
        for (let i = 0; i < nRing / 4; i++) wheel.push({ c: V(CX, ok ? y : 300, CZ), rad: ok ? rad : 160, w: 9 / rad, ph: k * 1.3 + i * 6.2832 / (nRing / 4) + br() * 0.4, bob: 0.7, s: 1.4 });
      }
      // and a wheel of eight round the great flower: a level circle 30 m in radius about the flower's heart, at the least
      // height over the heart (6 m, then higher by 2 m steps) at which its whole lane keeps its air to the cactus, its
      // arms, its fruit and every flower of the bouquet. It passes 20 m and more over the line we leave by.
      { const ex = V(1, 0, 0), ez = V(0, 0, 1); let c = null;
        for (let h = 6; h <= 60 && !c; h += 2) { const k = HA.flowerCentre.clone(); k.y += h; if (wheelClear(k, 30, 0, ex, ez)) c = k; await tick(); }
        const rad = c ? 30 : 160; if (!c) c = V(CX, 300, CZ);
        for (let i = 0; i < nFlower; i++) wheel.push({ c, rad, w: 0.34 * 23 / rad, ph: i * 6.2832 / nFlower, bob: 0, e1: ex, e2: ez, s: 1.5 }); }
    }
    const _f = V(), _e = new THREE.Euler();
    const placeBirds = (u, time) => {
      // the two pairs, each bird on its own lane (bowPair, crestPair above) by the metres of route flown; it heads the way
      // its lane runs; only its slight rise and fall is on the clock
      const m = mAt(u);
      for (let b = 0; b < 2; b++) {
        bowPair(m, b, _p); bowPair(m + 1, b, _f); _f.sub(_p).normalize(); _p.y += 0.2 * Math.sin(time * 2.1 + b * 2);
        _q.setFromUnitVectors(_z, _f); _m.compose(_p, _q, _s.setScalar(1.3)); birdMesh.setMatrixAt(b, _m);
        crestPair(m, b, _p); crestPair(m + 1, b, _f); _f.sub(_p).normalize(); _p.y += 0.25 * Math.sin(time * 2.3 + b * 1.7);
        _q.setFromUnitVectors(_z, _f); _m.compose(_p, _q, _s.setScalar(1.35)); birdMesh.setMatrixAt(nBirds - 2 + b, _m);
      }
      for (let i = 0; i < wheel.length; i++) {
        const w = wheel[i], a = w.ph + time * w.w, ca = Math.cos(a), sa = Math.sin(a);
        if (w.e1) { _p.copy(w.c).addScaledVector(w.e1, ca * w.rad).addScaledVector(w.e2, sa * w.rad); _f.copy(w.e1).multiplyScalar(-sa).addScaledVector(w.e2, ca); _q.setFromUnitVectors(_z, _f); }
        else { _p.set(w.c.x + ca * w.rad, w.c.y + Math.sin(a * 2 + w.ph) * w.bob, w.c.z + sa * w.rad); _q.setFromEuler(_e.set(0, -a + (w.w > 0 ? 0 : Math.PI), 0)); }
        _m.compose(_p, _q, _s.setScalar(w.s)); birdMesh.setMatrixAt(2 + i, _m);
      }
      birdMesh.instanceMatrix.needsUpdate = true;
    };
    await tick();

    // ------------------------------------------------------------------ the farm: sugar-cube houses round a red-earth yard, the brick chimney
    const houses = [];      // { x, z, r } for keeping other things off them
    {
      const fr = rng.fork('farm'), faces = [], Q = (...a) => a.map((p) => V(p[0], p[1], p[2]));
      const house = (x, z, yaw, w, d, h, top, pig) => {
        const o = 0.3, e = 0.08, W = w + o, D = d + o, parts = [];
        parts.push(paint(faceGeometry([Q([-w, 0, d], [w, 0, d], [w, h, d], [-w, h, d]), Q([w, 0, d], [w, 0, -d], [w, h, -d], [w, h, d]), Q([w, 0, -d], [-w, 0, -d], [-w, h, -d], [w, h, -d]), Q([-w, 0, -d], [-w, 0, d], [-w, h, d], [-w, h, -d])]), pig));
        parts.push(paint(faceGeometry([Q([-W, h, D], [W, h, D], [W, top, 0], [-W, top, 0]), Q([W, h, -D], [-W, h, -D], [-W, top, 0], [W, top, 0]), Q([W, h, D], [W, h, -D], [W, top, 0]), Q([-W, h, -D], [-W, h, D], [-W, top, 0])]), earthRoof));
        const dh = Math.min(2.5, h * 0.62), s0 = h * 0.36, s1 = Math.min(h - 0.5, s0 + 1.4), sx = w * 0.42;
        parts.push(paint(faceGeometry([Q([-0.65, 0, d + e], [0.65, 0, d + e], [0.65, dh, d + e], [-0.65, dh, d + e]), Q([w + e, 0, 0.5], [w + e, 0, -0.7], [w + e, dh, -0.7], [w + e, dh, 0.5])]), flat(R.deep)));
        parts.push(paint(faceGeometry([Q([-sx - 0.9, s0, d + e], [-sx, s0, d + e], [-sx, s1, d + e], [-sx - 0.9, s1, d + e]), Q([sx, s0, d + e], [sx + 0.9, s0, d + e], [sx + 0.9, s1, d + e], [sx, s1, d + e]),
          Q([-w - e, s0, 0.6], [-w - e, s1, 0.6], [-w - e, s1, -0.6], [-w - e, s0, -0.6]), Q([-0.5, s0, -d - e], [-0.5, s1, -d - e], [0.5, s1, -d - e], [0.5, s0, -d - e])]), flat(edition === 'night' ? R.yellow : R.blue)));
        const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose());
        faces.push(xform(g, mat4(x, -0.05, z, 0, yaw, 0))); houses.push({ x, z, r: Math.hypot(w, d) + 0.6 }); shStand(x, z, top, Math.max(w, d) * 0.98, Math.max(w, d) * 0.5);
      };
      // eleven houses standing on the ground in a ring round the yard, none nearer the flown line than 6 m beside it or 4 m under it
      const hp = () => { const k = fr(); return k < 0.5 ? pg.pink : k < 0.75 ? pg.yellow : pg.cream; };
      const spots = [[-13, 338, 0.3], [-17, 356, 1.4], [-25, 376, 1.9], [-23, 413, 2.6], [12, 334, -0.3], [26, 346, -0.9], [31, 366, -1.5], [25, 388, -2.1], [17, 414, 3.4], [-34, 362, 1.2], [3, 364, 0.2]];
      spots.forEach(([x, z, yaw], i) => {
        const small = i === 10, h = small ? 2.3 : 2.6 + fr() * 2.0, w = small ? 1.9 : 2.3 + fr() * 1.6, d = small ? 1.7 : 2 + fr() * 1.2;
        house(x + (fr() - 0.5) * 2, z + FZ + (fr() - 0.5) * 3, yaw + (fr() - 0.5) * 0.4, w, d, h, h + (small ? 1.3 : 1.5 + fr() * 1.2), i === 0 ? pg.pink : i === 4 ? pg.yellow : hp());
      });
      // the second hamlet, on the cactus's far side outside the loop: four bigger cubes on their own small yard
      [[-7, -5, 0.4, pg.pink], [6, -7, -0.5, pg.yellow], [9, 5, -1.9, pg.pink], [-6, 8, 2.5, pg.cream]].forEach(([dx, dz, yaw, pig]) => { const h = 4.2 + fr() * 1.4; house(HAMLET.x + dx, HAMLET.z + dz, yaw + Math.atan2(HAMLET.x - CX, HAMLET.z - CZ) + Math.PI, 3 + fr() * 0.8, 2.6 + fr() * 0.6, h, h + 2 + fr() * 0.8, pig); });
      // the mill: a low cream house with an earth roof; its chimney stands at the west gable
      house(CHIM.x + 6.4, CHIM.z + 0.5, 0, 4.6, 3.1, 3.1, 4.9, pg.cream);
      [[-8, -3, 0.5, pg.pink], [6, -8, -0.4, pg.yellow], [10, 4, -1.8, pg.cream], [-4, 9, 2.6, pg.pink], [-1, -13, 0.1, pg.yellow]].forEach(([dx, dz, yaw, pig]) => { const h = 3.6 + fr() * 1.6; house(HAM3.x + dx, HAM3.z + dz, yaw + Math.atan2(HAM3.x - CX, HAM3.z - CZ) + Math.PI, 2.8 + fr() * 0.8, 2.4 + fr() * 0.6, h, h + 1.8 + fr() * 0.8, pig); });
      // the cream paths between the plots
      { const polys = []; for (const L2 of lanes) for (let i = 0; i < L2.length - 1; i++) { const a = L2[i], b = L2[i + 1], p0 = L2[Math.max(0, i - 1)], p1 = L2[Math.min(L2.length - 1, i + 2)];
          const na = V(b.z - p0.z, 0, p0.x - b.x).normalize().multiplyScalar(1.15), nb = V(p1.z - a.z, 0, a.x - p1.x).normalize().multiplyScalar(1.15);
          polys.push([V(a.x + na.x, 0.09, a.z + na.z), V(a.x - na.x, 0.09, a.z - na.z), V(b.x - nb.x, 0.09, b.z - nb.z), V(b.x + nb.x, 0.09, b.z + nb.z)]); }
        const lg = faceGeometry(polys), ag = lg.attributes.aG, sg = [1, -1, -1, 1];
        for (let j = 0; j < ag.count; j += 4) { const ax = (ag.getX(j) - ag.getX(j + 1)) * 0.5, az = (ag.getZ(j) - ag.getZ(j + 1)) * 0.5, al = Math.hypot(ax, az) || 1; for (let q = 0; q < 4; q++) ag.setXYZ(j + q, sg[q] * ax / al * 0.9, 0, sg[q] * az / al * 0.9); }      // graded across the path only
        faces.push(paint(lg, pg.cream)); }
      // washing: a line between two poles with four flat cloths
      const wash = (x, z, yaw) => {
        const parts = [], cols = [pg.cream, pg.pink, pg.blue, pg.yellow];
        parts.push(paint(faceGeometry([Q([-4, 2.5, 0], [4, 2.5, 0], [4, 2.62, 0], [-4, 2.62, 0])]), flat(R.cream)));
        for (let k = 0; k < 4; k++) { const a = -3.3 + k * 1.75, hgt = 1.0 + ((k * 7) % 3) * 0.3; parts.push(paint(faceGeometry([Q([a, 2.5 - hgt, 0.02], [a + 1.3, 2.5 - hgt, 0.02], [a + 1.3, 2.5, 0.02], [a, 2.5, 0.02])]), cols[(k + (x > 0 ? 1 : 0)) % 4])); }
        const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose()); faces.push(xform(g, mat4(x, 0, z, 0, yaw, 0)));
        return [V(x - 4 * Math.cos(yaw), 0, z + 4 * Math.sin(yaw)), V(x + 4 * Math.cos(yaw), 0, z - 4 * Math.sin(yaw))];
      };
      const washPoles = [...wash(-9.5, 352 + FZ, 1.25), ...wash(33, 404 + FZ, -0.5), ...wash(HAMLET.x + 14, HAMLET.z - 2, 0.9)];
      const fm = new THREE.Mesh(mergeGeometries(faces, false), matFace); faces.forEach((q) => q.dispose()); fm.frustumCulled = false; add('houses', fm);
      await tick();
      // posts: washing poles, fences round the yard and a paddock, telegraph poles along the line, signal masts with disc targets
      const posts = [], discs = [], t = V(), p = V();
      for (const w of washPoles) posts.push({ p: w, s: V(0.16, 3.0, 0.16), pig: pg.cream });
      const fence = (x0, z0, x1, z1) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.2); for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n), z = lerp(z0, z1, i / n); if (pathDistXZ(x, z) > 7 && trackDistXZ(x, z) > 5 && houses.every((h) => Math.hypot(x - h.x, z - h.z) > h.r + 5)) posts.push({ p: V(x, plotY(x, z) - 0.1, z), s: V(0.2, 1.4, 0.2), pig: pg.cream }); } };
      // post fences: the paddock west of the yard, and rows along the plots beside the line (never before a house's face)
      for (const [a, b, c, d] of [[-58, 392, -96, 396], [-96, 396, -98, 440], [-98, 440, -62, 446], [-62, 446, -58, 392]]) fence(a, b + FZ, c, d + FZ);
      fence(-21, 236, -21, 300); fence(-21, 300, -52, 306); fence(27, 262, 27, 318); fence(27, 318, 60, 322); fence(-24, 128, -62, 150); fence(30, 180, 66, 196);
      fence(-44, POND.z - 58, -84, POND.z - 40); fence(HAMLET.x + 22, HAMLET.z - 20, HAMLET.x + 30, HAMLET.z + 22);
      // telegraph poles 8.2 m to port of the line (not through the avenue, whose palms stand there, and none within 5 m of a pair's lane), signal masts with disc targets
      for (let s = sNear(78, 82); s < sLoop(110); s += 34) { trackAt(s, p); trackTan(s, t); if ((s > sB0 - 36 && s < sB1 + 36) || (p.z > AV_Z0 - 10 && p.z < AV_Z1 + 11 && p.x < 9)) continue; const x = p.x + t.z * 8.2, z = p.z - t.x * 8.2; if (pathDistXZ(x, z) > 9 && laneAirXZ(x, z, 12.5) > 5) { posts.push({ p: V(x, 0, z), s: V(0.22, 7.5, 0.22), pig: earthRoof }); shStand(x, z, 7.5, 0.42, 0.42, 0.7); } }
      const sig = (x, z, yaw = 0) => { shStand(x, z, 8.4, 0.45, 0.45, 0.7); { const [ax, az] = shAt(x, 8.4, z); shSeg(ax, az, ax, az, 1.1, 1.1, 0.8); } posts.push({ p: V(x, plotY(x, z) - 0.2, z), s: V(0.26, 9, 0.26), pig: pg.cream }); discs.push({ p: V(x, plotY(x, z) + 8.4, z), yaw: yaw + Math.PI / 2, s: 1, pig: discs.length % 2 ? pg.yellow : earthRoof }); };
      for (const s of [sNear(46, 112), sAtZ(262), sNear(60, 366 + FZ), sB0 - 46, sLoop(286), sLoop(358), sNear(84, CZ - 160)]) { trackAt(s, p); trackTan(s, t); sig(p.x + t.z * 9.5, p.z - t.x * 9.5, Math.atan2(t.x, t.z)); }
      sig(-10, 410);
      add('posts', instanced(tubeGeometry([V(0, 0, 0), V(0, 1, 0), V(0, 1.03, 0)], [1, 1, 0], 7), matTube, posts));
      add('signal discs', instanced(ballGeometry(0.22, 1.25, 1.25, 16, 8, 0, true), matTube, discs));
      // the mill's chimney: 18 m of red earth tapering from 3.6 m to 2 m, a cream band two thirds up, a dark cap; it lays lobed
      // puffs on the clock. It stands 27 m to starboard of the flown line.
      { const cy = (y) => V(CHIM.x, y, CHIM.z), cr = (y) => lerp(1.8, 1.0, clamp(y / 17, 0, 1));
        const parts = [paint(tubeGeometry([cy(-0.5), cy(0), cy(6), cy(12), cy(16.8)], [1.85, cr(0), cr(6), cr(12), cr(16.8)], 20), earthRoof),
          paint(tubeGeometry([cy(11.2), cy(11.25), cy(12.6), cy(12.65)], [cr(11.2), cr(11.2) + 0.1, cr(12.6) + 0.1, cr(12.6)], 20), pg.cream),
          paint(tubeGeometry([cy(16.6), cy(16.7), cy(17.9), cy(18)], [1.0, 1.32, 1.32, 0], 20), rimOf(earthRoof))];
        add('chimney', new THREE.Mesh(mergeGeometries(parts, false), matTube)); parts.forEach((q) => q.dispose()); shStand(CHIM.x, CHIM.z, 18, 1.7, 1.25); }
      houses.push({ x: CHIM.x, z: CHIM.z, r: 2 });
    }
    await tick();

    // ------------------------------------------------------------------ the verge: small scallops lapped right up to the bed, the yard and the paths
    // (so that red earth shows only AS bed, yard and path); laid where the big plots leave the floor bare
    {
      const vr = rng.fork('verge'), small = [], cell = 9, dz = cell * 0.866;
      const pigs = [[pg.green, 0.34], [pg.greenPale, 0.26], [pg.greenDark, 0.2], [pinkEarth, 0.1], [pg.cream, 0.06], [pg.yellow, 0.04]];
      const pick = () => { let k = vr(); for (const [p, w] of pigs) { if (k < w) return p; k -= w; } return pg.green; };
      const covered = (x, z) => { const c = plotGrid.get(pkey(x, z)); if (!c) return false; for (const pl of c) { const dx = x - pl.x, dzz = z - pl.z, cs = Math.cos(pl.yaw), sn = Math.sin(pl.yaw), lx = (dx * cs - dzz * sn) / pl.sx, lz = (dx * sn + dzz * cs) / pl.sz; if (lx * lx + lz * lz < 0.6) return true; } return false; };
      // the kerb: one row of long scallops lying along each side of the bed (and beyond the second line where it is laid)
      {
        const a = V(), t = V();
        for (let s = sNear(96, 62); s < sNear(150, CZ - 330); s += 8.5) for (const sd of [1, -1]) {
          if (trackH(s) > 0.2) continue;
          trackAt(s, a); trackTan(s, t);
          const wd = 3.3 + vr() * 1.3, off = sd * (3.05 + wd + (rare && sd > 0 && s > S2A && s < S2B ? LINE2 : 0)), px = a.x + t.z * off, pz = a.z - t.x * off, k2 = vr(), pig = pick();
          if (trackDistXZ(px, pz) < Math.abs(off) - 0.6 || laneDist(px, pz) < wd + 1.2 || Math.hypot(px - POND.x, pz - POND.z) < POND.r + wd + 1 || inCrest(px, pz, -3) || Math.hypot(px - YARD.x, pz - YARD.z) < YARD.r + wd) continue;
          if (houses.some((h) => Math.hypot(px - h.x, pz - h.z) < h.r + wd) || cactusDist(px, pz) < 27 + wd) continue;
          const pl = { p: V(px, -0.03, pz), s: V(wd, 0.3 + k2 * 0.4, 5.6 + k2 * 1.4), yaw: Math.atan2(t.x, t.z), pig, x: px, z: pz, rm: 7, fine: true };
          pl.sx = pl.s.x; pl.sz = pl.s.z; pl.h = pl.s.y; small.push(pl);
          for (let gx = Math.floor((px - pl.rm) / PG); gx <= Math.floor((px + pl.rm) / PG); gx++) for (let gz = Math.floor((pz - pl.rm) / PG); gz <= Math.floor((pz + pl.rm) / PG); gz++) { const k = gx + ':' + gz; if (!plotGrid.has(k)) plotGrid.set(k, []); plotGrid.get(k).push(pl); }
        }
      }
      let n = 0;
      for (let j = 0, z = -60; z < CZ + 340; j++, z += dz) for (let x = -330 + (j % 2) * cell * 0.5; x < 440; x += cell) {
        if (++n % 600 === 0) await tick();
        const px = x + (vr() - 0.5) * 3, pz = z + (vr() - 0.5) * 3, r = cell * (0.74 + vr() * 0.16), k1 = vr(), k2 = vr(), k3 = vr(), k4 = vr(), pig = pick();
        const dT = trackDistXZ(px, pz), dF = Math.hypot(px - FARM.x, pz - FARM.z), dH = Math.min(Math.hypot(px - HAMLET.x, pz - HAMLET.z), Math.hypot(px - HAM3.x, pz - HAM3.z) + 2), dL = laneDist(px, pz), dC = cactusDist(px, pz);
        if (!(dT < 36 || dF < 66 || dH < 44 || dL < 14 || dC < 70 || pathDistXZ(px, pz) < 22)) continue;
        if (dT < r + 3.1 + (rare ? LINE2 : 0) || dL < r + 1.2 || dC < r + 27 || Math.hypot(px - POND.x, pz - POND.z) < r + POND.r + 1.2 || inCrest(px, pz, -3) || Math.hypot(px - YARD.x, pz - YARD.z) < r + YARD.r || dH < r + 20) continue;
        if (houses.some((h) => Math.hypot(px - h.x, pz - h.z) < h.r + r * 0.7) || covered(px, pz)) continue;
        const pl = { p: V(px, -0.03, pz), s: V(r * (0.9 + k1 * 0.3), 0.3 + k2 * 0.5, r * (0.9 + k3 * 0.3)), yaw: k4 * 3.1416, pig, x: px, z: pz, rm: r * 1.2, fine: true };
        pl.sx = pl.s.x; pl.sz = pl.s.z; pl.h = pl.s.y; small.push(pl);
        for (let gx = Math.floor((px - pl.rm) / PG); gx <= Math.floor((px + pl.rm) / PG); gx++) for (let gz = Math.floor((pz - pl.rm) / PG); gz <= Math.floor((pz + pl.rm) / PG); gz++) { const k = gx + ':' + gz; if (!plotGrid.has(k)) plotGrid.set(k, []); plotGrid.get(k).push(pl); }
      }
      add('ground', instanced(domeGeometry(10, 1, plotProfile, 2), matGround, small));
    }
    await tick();

    // ------------------------------------------------------------------ flora: ball bushes, banana clumps, papaya poles, paddle cacti, egg boulders
    const freeSpot = (x, z, r) => pathDistXZ(x, z) > r + 9 && trackDistXZ(x, z) > r + 6 && cactusDist(x, z) > r + 62 && Math.hypot(x - POND.x, z - POND.z) > POND.r + r + 1 && houses.every((h) => Math.hypot(x - h.x, z - h.z) > h.r + r + 1)
      && !(z < 8 && Math.abs(x) < 130) && !inHill(x, z, r) && laneDist(x, z) > r + 1.5 && !inCrest(x, z, r);
    let papayaTop = V(-26, 6, 344 + FZ);
    {
      const fl = rng.fork('flora'), bushes = [], rowBalls = [], bananas = [], papayas = [], cacti = [], eggs = [];
      const scatter = (list, n, r, make, spread = 300, z0 = 60, z1 = CZ + 200) => { for (let i = 0; i < n * 5 && list.length < n; i++) { const x = (fl() - 0.5) * spread, z = z0 + fl() * (z1 - z0); if (freeSpot(x, z, r)) list.push(make(x, z)); } };
      scatter(bushes, Math.round(40 * detail * dens), 2.5, (x, z) => { const s = 1 + fl() * 1.7; return { p: V(x, plotY(x, z) + s * 0.55, z), s: V(s * (1 + fl() * 0.4), s, s * (1 + fl() * 0.4)), pig: hillPig[Math.floor(fl() * 3)] }; }, 380);
      scatter(bananas, Math.round(22 * detail * dens), 3, (x, z) => ({ p: V(x, plotY(x, z) - 0.1, z), yaw: fl() * 6.283, s: 0.8 + fl() * 0.5 }), 150, 130, CZ + 150);
      scatter(papayas, Math.round(16 * detail * dens), 2, (x, z) => ({ p: V(x, plotY(x, z) - 0.1, z), yaw: fl() * 6.283, s: 0.85 + fl() * 0.4 }), 130, 300 + FZ, CZ + 10);
      papayas.unshift({ p: V(-26, 0, 344 + FZ), yaw: 0, s: 1 }); papayaTop = V(-26, 7.05, 344 + FZ);
      scatter(cacti, Math.round(22 * detail * dens), 2.5, (x, z) => ({ p: V(x, plotY(x, z) - 0.1, z), yaw: fl() * 6.283, s: 0.8 + fl() * 0.7 }), 260, 60, CZ + 200);
      // the crest hill is furnished by hand: egg boulders on its crown under the entry and down its flank beside the drop (the
      // big one passes 12 m from the line), ball bushes and one stacked paddle cactus; all 6 m and more below or beside the line
      for (const [x, z, s, yaw] of [[-7, 32, 1.7, 0.4], [8, 47, 2.0, -0.5], [-12, 58, 2.3, 1.1], [-10.5, 96, 2.6, 0.5], [-15, 112, 2.0, 0.9], [-21, 70, 2.0, 0.3], [-17, 22, 1.6, 0.7], [4.5, 13, 1.5, 1.3], [-13, 12, 1.8, 0.2]])
        eggs.push({ p: V(x, groundY(x, z) + s * 0.5, z), yaw, s, pig: pg.pink });
      for (const [x, z, s] of [[3, 38, 1.3], [-9, 46, 1.6], [12, 40, 1.2], [-14, 80, 1.4], [-6, 104, 1.6], [-20, 28, 1.3], [15, 18, 1.2], [-24, 94, 1.5], [6, 21, 1.4], [-10, 23, 1.3]])
        bushes.push({ p: V(x, groundY(x, z) + s * 0.55, z), s: V(s * 1.2, s, s * 1.1), pig: hillPig[(Math.abs(x) | 0) % 3] });
      cacti.push({ p: V(-17, groundY(-17, 84) - 0.2, 84), yaw: 0.7, s: 1.4 });
      // and rows of ball plants across the crest's flank, on its contours, each with its shadow (8 m and more to the side of the line, 9 m under it)
      for (const [z0, x0, x1] of [[52, 9, 37], [66, 8.5, 41], [80, 9, 33], [52, -37, -19], [69, -40, -26]]) for (let x = x0; x <= x1; x += 3.7) {
        const z = z0 + 0.011 * x * x, sz = 0.95; if (groundY(x, z) > 1.5) rowBalls.push({ p: V(x, groundY(x, z) + sz * 0.5, z), s: V(sz * 1.1, sz, sz * 1.1), pig: (z0 % 4 ? pg.greenDark : pg.green) });
      }
      scatter(eggs, Math.round(40 * detail), 3, (x, z) => { const s = 1 + fl() * 1.6; return { p: V(x, plotY(x, z) + s * 0.45, z), yaw: fl() * 6.283, s, pig: pg.pink }; }, 420, 100, CZ + 300);
      // egg boulders on the plots nearest the loop, on the far side where the line is drawn in
      for (const [deg, rr, es] of [[325, 55, 3.4], [339, 49, 2.4], [331, 77, 2.6], [352, 72, 1.9], [312, 60, 2.2]]) { const a = deg * Math.PI / 180, x = CX + rr * Math.sin(a), z = CZ + rr * Math.cos(a); eggs.push({ p: V(x, plotY(x, z) + es * 0.45, z), yaw: a, s: es, pig: pg.pink }); }   // the far side's boulders, each side of the drawn-in line
      for (let k = 0; k < 9; k++) { const a = k * 0.7 + 0.2, rr = LOOP_R + 16 + (k % 3) * 9, x = CX + rr * Math.sin(a), z = CZ + rr * Math.cos(a), s = 1.8 + (k % 4) * 0.5; if (freeSpot(x, z, 2)) eggs.push({ p: V(x, plotY(x, z) + s * 0.45, z), yaw: a, s, pig: pg.pink }); }
      await tick();
      // rows of plants on the nearer plots: the brush rows of a plot run along its own z, and so do its plants
      {
        const maxRows = Math.round(1100 * detail);
        let want = 0; for (const pl of plots) if (pl.fine && !(pathDistXZ(pl.x, pl.z) > 105 && cactusDist(pl.x, pl.z) > 150)) want += 0.6 * 0.56 * Math.PI * pl.sx * pl.sz * 0.52 / 19.4;
        const share = clamp(maxRows / Math.max(want, 1), 0.2, 1);
        for (let i = 0; i < plots.length && rowBalls.length < maxRows; i++) {
          const pl = plots[i]; if (!pl.fine) continue;
          if (((i * 0.61803) % 1) > share) continue;
          const kind = fl(), near = pathDistXZ(pl.x, pl.z); if (near > 105 && cactusDist(pl.x, pl.z) > 150) continue;
          if (kind > 0.78 || (pl.z < 8 && Math.abs(pl.x) < 150)) continue;
          const cs = Math.cos(pl.yaw), sn = Math.sin(pl.yaw), gap = kind < 0.6 ? 4.4 : 7.5, pig = pl.pig === pg.greenDark || pl.pig === pg.deep ? pg.greenPale : pl.pig === pg.green ? pg.greenDark : pg.green;
          const size = 0.75 + fl() * 0.5;
          // (ball plants stand close along a row and the rows well apart: from far off they read as rows, never as a net)
          const ga = kind < 0.6 ? 6.6 : gap, gb = kind < 0.6 ? 2.9 : gap;
          for (let a = -Math.floor(pl.sx * 0.72 / ga) * ga; a <= pl.sx * 0.72; a += ga) for (let b = -Math.floor(pl.sz * 0.72 / gb) * gb; b <= pl.sz * 0.72; b += gb) {
            if ((a / pl.sx) ** 2 + (b / pl.sz) ** 2 > 0.56) continue;
            const x = pl.x + a * cs + b * sn, z = pl.z - a * sn + b * cs, y = plotY(x, z);
            if (z < 8 && Math.abs(x) < 135) continue;                                         // nothing stands behind the entry
            if (pathDist(x, y + 1, z) < 6 || trackDistXZ(x, z) < 5.5 || laneDist(x, z) < 2.6 || !houses.every((h) => Math.hypot(x - h.x, z - h.z) > h.r + 2.5)) continue;
            if (kind < 0.6) rowBalls.push({ p: V(x, y + size * 0.5, z), s: V(size * 1.1, size, size * 1.1), pig });
            else if (kind < 0.7) { if (bananas.length < 36) bananas.push({ p: V(x, y - 0.1, z), yaw: fl() * 6.283, s: 0.6 + fl() * 0.25 }); }
            else if (cacti.length < 46) cacti.push({ p: V(x, y - 0.1, z), yaw: fl() * 6.283, s: 0.55 + fl() * 0.3 });
          }
          if (i % 60 === 59) await tick();
        }
      }
      for (const o of bushes) shStand(o.p.x, o.p.z, o.s.y, o.s.x * 0.82);
      for (const o of eggs) shStand(o.p.x, o.p.z, o.s * 0.62, o.s * 0.74);
      await tick();
      for (let i = 0; i < rowBalls.length; i++) { const o = rowBalls[i]; shStand(o.p.x, o.p.z, o.s.y * 0.95, o.s.x * 0.8, o.s.x * 0.8, 0.7); if (i % 250 === 249) await tick(); }
      await tick();
      for (const o of bananas) shStand(o.p.x, o.p.z, 3.3 * o.s, 1.5 * o.s, 2 * o.s);
      for (const o of papayas) { shStand(o.p.x, o.p.z, 6 * o.s, 0.45, 0.45, 0.7); const [ax, az] = shAt(o.p.x, 6.2 * o.s, o.p.z); shSeg(ax, az, ax, az, 1.5 * o.s, 1.5 * o.s, 0.9); }
      for (const o of cacti) shStand(o.p.x, o.p.z, 4 * o.s, 1.05 * o.s, 0.8 * o.s);
      add('bushes and boulders', instanced(ballGeometry(1, 0.9, 1, 10, 6), matTube, bushes), instanced(ballGeometry(1, 0.62, 0.66, 14, 8, 0.12), matTube, eggs), instanced(ballGeometry(1, 0.9, 1, 6, 4), matTube, rowBalls));
      await tick();
      // banana clump: five broad paddles from one foot
      { const parts = []; for (let k = 0; k < 5; k++) { const leaf = ballGeometry(0.95, 2.2, 0.26, 8, 5, 0.1, true); leaf.translate(0, 2.3, 0); parts.push(paint(xform(leaf, mat4(0, 0, 0, 0.25 + (k % 3) * 0.2, k * 1.257 + 0.2, 0)), k % 2 ? pg.green : pg.greenPale)); }
        const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose()); add('bananas', instanced(g, matRockT, bananas)); }
      // papaya: a pale pole, a ruff of yellow balls under a small crown of paddles
      { const parts = [paint(tubeGeometry([V(0, -0.3, 0), V(0, 3, 0), V(0, 6, 0)], [0.34, 0.3, 0.26], 8), pg.cream)];
        for (let k = 0; k < 6; k++) parts.push(paint(ballGeometry(0.34, 0.46, 0.34, 6, 4).translate(Math.cos(k * 1.047) * 0.5, 5.35 - (k % 2) * 0.5, Math.sin(k * 1.047) * 0.5), pg.yellow));
        for (let k = 0; k < 5; k++) { const leaf = ballGeometry(0.6, 1.3, 0.18, 6, 4, 0.1, true); leaf.translate(0, 1.4, 0); parts.push(paint(xform(leaf, mat4(0, 6, 0, 1.15, k * 1.257, 0)), pg.green)); }
        const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose()); add('papayas', instanced(g, matRockT, papayas)); }
      // paddle cactus: three fat pads stacked
      { const parts = []; [[0, 1.1, 0, 0, 1], [0.5, 2.7, 0.5, 0.45, 0.8], [-0.45, 2.9, 2.2, -0.5, 0.7], [0.75, 4.1, 0.9, 0.2, 0.55]].forEach(([x, y, ry, rz, s]) => parts.push(paint(xform(ballGeometry(0.95, 1.2, 0.36, 8, 5, 0, true), mat4(x, y, 0, 0, ry, rz, s)), pg.green)));
        const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose()); add('paddle cacti', instanced(g, matTube, cacti)); }
    }
    await tick();

    // ------------------------------------------------------------------ fauna: capybaras in files, three zebu oxen, a toucan, frogs on lily pads
    // bean-shaped graded solids, one deep green dot for an eye; legs, heads and hops are moved in the vertex shader on the clock
    const animPre = `float hip = abs(aPart);
      if (hip > 15.) { float hp = max(0., sin(uTime * 1.7 + aAnim.x)); pos.y += hp * hp * 1.1; pos.z += hp * hp * 0.5; }
      else if (hip > 5.) { float ha = 0.3 * sin(uTime * 0.8 + aAnim.x), hc = cos(ha), hs = sin(ha); vec2 hq = pos.xz - vec2(0., 0.95); pos.xz = vec2(0., 0.95) + vec2(hc * hq.x + hs * hq.y, -hs * hq.x + hc * hq.y); nrm.xz = vec2(hc * nrm.x + hs * nrm.z, -hs * nrm.x + hc * nrm.z); }
      else if (hip > 0.01) pos.z += sign(aPart) * aAnim.y * 0.16 * sin(uTime * 7. + aAnim.x) * clamp(1. - pos.y / hip, 0., 1.);`;
    const matAnimal = gradeMaterial({ mode: 0, vertexDecl: 'attribute float aPart; attribute vec2 aAnim;', vertexPre: animPre });
    const part = (g, pig, k = 0) => { paint(g, pig); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(k), 1)); return g; };
    const animalMesh = (parts, list, walk) => {
      const g = mergeGeometries(parts, false); parts.forEach((q) => q.dispose());
      const a = new Float32Array(Math.max(1, list.length) * 2); for (let i = 0; i < list.length; i++) { a[i * 2] = rng() * 6.283; a[i * 2 + 1] = walk; }
      g.setAttribute('aAnim', new THREE.InstancedBufferAttribute(a, 2));
      const m = instanced(g, matAnimal, list); add('animals', m); return m;
    };
    // the capybara is a fat loaf: a body twice as long as it is tall, a blunt square muzzle, legs as stubs a quarter of the
    // body's height, a pale cream-earth middle and a red-earth rim like the roofs, one deep green dot for the eye
    const capyPig = { mid: mix(R.earth, R.cream, 0.6), base: mix(R.earth, R.cream, 0.16), rim: mix(R.earth, R.deep, 0.18) };
    const files = [{ cx: YARD.x, cz: YARD.z, rx: 9.6, rz: 10.4, n: 7, dir: 1 }, { cx: POND.x, cz: POND.z, rx: POND.r + 4.2, rz: POND.r + 4.2, n: 5, dir: 1, arc: [2.9, 5.25] },
      { cx: HAMLET.x + 1, cz: HAMLET.z, rx: 16, rz: 16, n: 4, dir: 1 }];
    const capys = []; files.forEach((f, fi) => { for (let i = 0; i < f.n; i++) capys.push({ p: V(f.cx, 0, f.cz), s: 1, fi, i }); });
    const CAPY = V(2.5, 2.5, 2.5), CAPY_GAP = 8.6;
    const capyMesh = (() => {
      // a barrel on four short legs, a blunt square muzzle, small ears, no tail; two tones: pale barrel, dark legs, muzzle and ears
      const dark = { mid: mix(R.earth, R.cream, 0.12), base: R.earth.clone(), rim: mix(R.earth, R.deep, 0.3) };
      const P = [part(ballGeometry(0.56, 0.5, 0.98, 12, 7), capyPig).translate(0, 0.92, 0), part(ballGeometry(0.42, 0.4, 0.5, 9, 6), capyPig).translate(0, 1.06, 0.84),
        part(tubeGeometry([V(0, 1.0, 1.02), V(0, 0.98, 1.4), V(0, 0.98, 1.46), V(0, 0.98, 1.47)], [0.36, 0.33, 0.3, 0], 9), dark)];
      for (const sx of [1, -1]) { P.push(part(ballGeometry(0.06, 0.06, 0.05, 4, 2), flat(R.deep)).translate(sx * 0.37, 1.2, 0.98), part(ballGeometry(0.1, 0.12, 0.07, 5, 3), dark).translate(sx * 0.25, 1.44, 0.7));
        for (const sz of [1, -1]) P.push(part(tubeGeometry([V(sx * 0.29, 0, sz * 0.52), V(sx * 0.29, 0.6, sz * 0.52)], [0.17, 0.2], 6), dark, sx * sz * 0.6)); }
      return animalMesh(P, capys, 1);
    })();
    const capyShade = instanced(domeGeometry(12, 1, () => 0, 0), matDome, capys.map(() => ({ p: V(0, -300, 0), s: 1, pig: flat(mix(mix(R.earth, R.deep, 0.34), R.blue, 0.12)) })));
    add('ground', capyShade);
    const _shq = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), Math.atan2(SHD.x, SHD.z)), _shs = V(1.75, 1, 1.75 + SHK * 1.1);
    const placeCapys = (time) => {
      for (let k = 0; k < capys.length; k++) {
        const c = capys[k], f = files[c.fi], rm = (f.rx + f.rz) / 2; let a = f.dir * (time * 1.1 / rm) - c.i * CAPY_GAP / rm * f.dir;
        if (f.arc) { const w = f.arc[1] - f.arc[0], q = ((a % (2 * w)) + 2 * w) % (2 * w); a = f.arc[0] + (q < w ? q : 2 * w - q); _e.set(0, -a + (q < w ? 0 : Math.PI), 0); } else _e.set(0, -a + (f.dir > 0 ? 0 : Math.PI), 0);
        _p.set(f.cx + Math.cos(a) * f.rx, 0, f.cz + Math.sin(a) * f.rz); _m.compose(_p, _q.setFromEuler(_e), CAPY); capyMesh.setMatrixAt(k, _m);
        _p.x += SHD.x * SHK * 1.1; _p.z += SHD.z * SHK * 1.1; _p.y = 0.2; _m.compose(_p, _shq, _shs); capyShade.setMatrixAt(k, _m);
      }
      capyMesh.instanceMatrix.needsUpdate = true; capyShade.instanceMatrix.needsUpdate = true;
    };
    {
      // zebu: cream, humped, crescent horns; the head swings
      const P = [part(ballGeometry(0.62, 0.7, 1.25, 10, 6), pg.cream).translate(0, 1.45, 0), part(ballGeometry(0.4, 0.42, 0.5, 8, 5), pg.cream).translate(0, 2.1, 0.55), part(ballGeometry(0.33, 0.36, 0.5, 8, 5), pg.cream, 10).translate(0, 1.75, 1.45)];
      const horn = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; horn.push(V(Math.cos(a) * 0.5, 2.05 + Math.sin(a) * 0.52 - 0.1, 1.42)); }
      P.push(part(tubeGeometry(horn.slice(0, 4).reverse().concat([]), [0.085, 0.075, 0.055, 0], 5), earthRoof, 10), part(tubeGeometry(horn.slice(5), [0.085, 0.075, 0.055, 0], 5), earthRoof, 10));
      for (const sx of [1, -1]) { P.push(part(ballGeometry(0.06, 0.06, 0.06, 4, 2), flat(R.deep), 10).translate(sx * 0.3, 1.85, 1.62)); for (const sz of [1, -1]) P.push(part(tubeGeometry([V(sx * 0.36, 0, sz * 0.8), V(sx * 0.36, 1.1, sz * 0.8)], [0.13, 0.17], 6), pg.cream, 0)); }
      const OX = { x: YARD.x - 17.5, z: YARD.z - 9 }; shStand(OX.x, OX.z, 2.9, 1.6, 1.4); shStand(-78, 418 + FZ, 2.2, 1.2); shStand(-52, 506 + FZ, 2.2, 1.2);
      animalMesh(P, [{ p: V(OX.x, plotY(OX.x, OX.z), OX.z), yaw: 0.6, s: 1.7 }, { p: V(-78, plotY(-78, 418 + FZ), 418 + FZ), yaw: 2.4, s: 1.2 }, { p: V(-52, plotY(-52, 506 + FZ), 506 + FZ), yaw: 0.9, s: 1.2 }], 0);
      // lily pads and frogs
      const lr = rng.fork('lily'), pads = [], frogs = [];
      for (let i = 0; i < 80 && pads.length < 14; i++) { const a = lr() * 6.283, d = Math.sqrt(lr()) * (POND.r - 4), x = POND.x + Math.cos(a) * d, z = POND.z + Math.sin(a) * d, r = 1.3 + lr() * 1.3;
        if (trackDistXZ(x, z) < 9 + r || pads.some((q) => q.p.distanceTo(V(x, 0.24, z)) < r + q.s.x + 0.6)) continue;
        pads.push({ p: V(x, 0.24, z), s: V(r, 1, r), pig: lr() < 0.5 ? pg.greenPale : pg.green }); if (frogs.length < 9) frogs.push({ p: V(x, 0.5, z), yaw: lr() * 6.283, s: 1 }); }
      add('ground', instanced(domeGeometry(14, 2, () => 0), matGround, pads));
      animalMesh([part(ballGeometry(0.42, 0.3, 0.52, 7, 4), pg.greenDark, 20), part(ballGeometry(0.07, 0.07, 0.07, 4, 2), flat(R.deep), 20).translate(0.2, 0.2, 0.3), part(ballGeometry(0.07, 0.07, 0.07, 4, 2), flat(R.deep), 20).translate(-0.2, 0.2, 0.3)], frogs, 0);
      // the toucan on its papaya: deep green, a yellow bill
      const tgeo = macawGeometry(pg, pg.deep, pg.yellow); tgeo.setAttribute('aBird', new THREE.InstancedBufferAttribute(new Float32Array([1.3, 0]), 2));
      add('toucan', instanced(tgeo, birdMesh.material, [{ p: papayaTop.clone().setY(papayaTop.y + 0.4), yaw: 2.2, s: 1.5 }]));
      // the chimney's puffs: laid on the clock, rising and thinning
      const cp = []; for (let i = 0; i < 6; i++) cp.push({ p: V(CHIM.x, 19.4, CHIM.z), s: 1.9, pig: cloudPig });
      const cg = heapGeometry(PUFF_LOBES, 8, 4, 0.7); cg.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array([0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6]), 1));
      add('chimney puffs', instanced(cg, gradeMaterial({ mode: 3, vertexDecl: 'attribute float aPh;', vertexPre: 'float ca = fract(uTime * 0.06 + aPh); pos *= smoothstep(0., 0.12, ca) * (1. - smoothstep(0.7, 1., ca)) * (0.6 + 0.6 * ca); m[3].y += ca * 15.; m[3].x += ca * ca * 9.;' }), cp));
    }
    await tick();


    // ------------------------------------------------------------------ the flight
    // four cloud shadows drift across the valley from port to starboard at 4 m/s (a loop on the clock): each grows from
    // nothing far out on one side and shrinks to nothing far out on the other, so none ever appears or goes out at once
    const CLSH = [[-90, 250, 70, 36, 0.0], [120, 470, 58, 30, 0.31], [-30, 690, 80, 40, 0.57], [170, 90, 62, 32, 0.82]];
    const placeCloudShadows = (time) => {
      for (let i = 0; i < 4; i++) { const c = CLSH[i], ph = (((time * 4 / 1500 + c[4]) % 1) + 1) % 1, k = Math.sqrt(Math.max(0, Math.sin(ph * Math.PI))); shCloud[i].set(c[0] + 750 - ph * 1500, c[1], Math.max(1, c[2] * k), Math.max(1, c[3] * k)); }
    };
    // (a shadow in the map is a shape on the valley FLOOR: where a hill dome stands the map is cleared, or the rows of
    // plants at a hill's foot would print their shadows up its flank as a lattice; the crest keeps its own)
    for (const hl of hills) {
      const R2 = hl.s.x * 0.95; if (hl.p.x + R2 < SHX0 || hl.p.x - R2 > SHX0 + 800 || hl.p.z + R2 < SHZ0 || hl.p.z - R2 > SHZ0 + 1024) continue;
      for (let j = Math.max(0, Math.floor((hl.p.z - R2 - SHZ0) / SHSZ)); j <= Math.min(SHH - 1, Math.ceil((hl.p.z + R2 - SHZ0) / SHSZ)); j++) {
        const dz = SHZ0 + (j + 0.5) * SHSZ - hl.p.z, w2 = R2 * R2 - dz * dz; if (w2 <= 0) continue;
        const hw = Math.sqrt(w2), i0 = Math.max(0, Math.ceil((hl.p.x - hw - SHX0) / SHSX)), i1 = Math.min(SHW - 1, Math.floor((hl.p.x + hw - SHX0) / SHSX));
        if (i1 >= i0) shData.fill(0, j * SHW + i0, j * SHW + i1 + 1);
      }
      await tick();
    }
    shTex.needsUpdate = true;
    const _poi = V(), _poi2 = V();
    let lastU = -1;
    // the great flower opens as we pass the fork: from 90 m of route before the fork's point to 30 m after it
    const step = (u, time) => {
      if (u !== lastU) { lastU = u; placePuffs(placeTrain(u), rare ? train2S(u) : 0); hero.setClimb(climbOf(u)); hero.setFlower(smoothstep(uAt(M_FORK - 90), uAt(M_FORK + 30), u)); }
      placeBirds(u, time); placeCapys(time); placeCloudShadows(time);
    };
    step(0, 0);
    const yellowHex = '#' + R.yellow.getHexString(), seat = HA.portalSeat;
    // THE LOOKS. Each begins and ends at a place of the flight plus or minus metres of route (look(at, from m, to m, weight)),
    // and holds along its whole stretch. A look eases in and out over three tenths of its stretch (the engine's own
    // measure), or over less where its stretch is short, so that it is at its full weight for LOOK_FULL metres of route
    // and more. The last look keeps the engine's own measure, as the engine's guard lets every look go before the ring.
    const LOOK_FULL = 64, looks = [];
    const look = (name, at, m0, m1, weight, o = {}) => { const fade = o.plain ? undefined : Math.min(0.3, (m1 - m0 - LOOK_FULL) / (2 * (m1 - m0))); looks.push({ name, m0, m1, weight, fade: fade ?? 0.3 }); return { at, from: uAt(m0), to: uAt(m1), weight, ...(fade === undefined ? {} : { fade }), ...(o.arc ? { arc: true } : {}) }; };
    // the last look's one fixed point: the great flower's heart moved 8 m toward the sun's bearing in plan and 1 m down
    const restAt = HA.flowerCentre.clone().add(V(Math.sin(sunAz) * 8, -1, Math.cos(sunAz) * 8));
    return {
      scene, path, duration: 40,
      // hurried down the railway (from the foot of the drop to the avenue's end, eased over 80 m and 90 m of route), slowed
      // through the fork (from 130 m of route before the fork's point to 75 m after it, eased over 75 m and 55 m)
      pace: (u) => (1 + 0.3 * smoothstep(uAt(M1 - 20), uAt(M1 + 60), u) * (1 - smoothstep(uAt(M_AV1), uAt(M_AV1 + 90), u)) - 0.3 * smoothstep(uAt(M_FORK - 130), uAt(M_FORK - 55), u) * (1 - smoothstep(uAt(M_FORK + 20), uAt(M_FORK + 75), u))),
      camera: { fov: 62, near: 0.8, far: 6500, lookAhead: 20, sway: 0.6, bank: 0.12 },     // (the bank stays under 2 degrees: the horizon level on the climb)
      pois: [
        // the crest and the drop: the gaze stays level on the cactus down the valley while the line falls, from the entry to the foot of the drop
        look('the cactus down the valley', V(CX, 70, CZ), 0, M1, 0.85),
        // the engine: ONE look that follows it as it comes up from behind, draws level at the foot of the drop and pulls ahead
        look('the engine', (time, u) => { trackAt(trainS(u), _poi2); _poi2.y += 3; return _poi2; }, M1 - 70, M1 + 120, 0.4, { arc: true }),
        // the cactus over the farm and the pond, then up the trunk from its foot: from 60 m after the avenue's end to 35 m past the join
        look('the cactus over the farm and pond', V(CX, 64, CZ), M_AV1 + 60, M_JOIN + 35, 0.6),
        // the reveal: down to the pond, the bridge and the train on it, under the cactus, from 75 m before the pond's place to 65 m after it
        look('the reveal', V(BR.x + 8, 15, BR.z + 22), M2 - 75, M2 + 65, 0.78, { arc: true }),
        // the climb: out and down at the train circling the foot below us, from the join to where the fork's look begins
        look('the train below', (time, u) => trackAt(trainS(u) - 8, _poi), M_JOIN, M_FORK - 95, 0.55, { arc: true }),
        // the fork: back down the valley we flew to the crest we came from, between the fork's arms
        look('the fork', V(0, 40, 0), M_FORK - 95, M_FORK + 35, 0.62, { arc: true }),
        // the bouquet: the gaze rests on one fixed point between the great flower and the sun, from 15 m after the fork's point to the ring
        look('the rest between flower and sun', restAt, M_FORK + 15, M_RING, 0.95, { arc: true, plain: true }),
      ],
      portal: { shape: 'circle', radius: 7, tilt: true, blendDistance: 25, color: yellowHex, glow: 0, veil: '#' + pg.yellow.mid.getHexString(), revealDistance: 240 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);
        step(u, time);
      },
      dispose() { hero.dispose(); },
      // for the print-only checks: the laws, places and lanes of everything that moves
      dev: { sunDir, sunTried, sunPick, sunRad, SUN_FLOWER, looks, places: { M1, M2, M_AV0, M_AV1, AV_Z0, AV_Z1, sSwing, M_JOIN, M_FORK, M_RING }, restAt, bowPair, crestPair, LANES, bodyAir, heroAir, palmCrowns, cloudBoxes, hero, trainS, train2S, rare, trackAt, trackOff, LINE2, CAR_BACK, puffs, wheel, files, climbOf, forkU, uJoin, CHIM, plots, hills, plotY, HAMLET, POND, FARM, train: { R_OPEN, R_BRIDGE, M1, M2, sM1, sBC, sB0, sB1, TL, S_END, S2A, S2B, start: trainT[0], end: trainT[MR], start2: train2T[0], end2: train2T[MR] }, uAt, trackTan, pairAt: (u, b, out) => { placeBirds(u, 0); birdMesh.getMatrixAt(b, _m); return out.setFromMatrixPosition(_m); },
        crestPairAt: (u, b, out) => { placeBirds(u, 0); birdMesh.getMatrixAt(nBirds - 2 + b, _m); return out.setFromMatrixPosition(_m); }, HAM3 },
    };
  },
};
