// The island at its endless sundown: a small steep green island with a reef, a lagoon, a grove of seven great trunks
// and a creek with a brig in it. Hero set piece of src/worlds/out-the-nursery-window.js.
//
// WHAT STANDS. The island stands in ONE state for a whole visit; nothing here takes the metres flown or the route's
// parameter, and nothing wakes, sinks, shrinks or leaves because anyone comes. A LIT THING TAKES ITS SKY BY WHERE IT
// STANDS (its own z against the three lines of the map), never by where the eye is: the island is gold and violet
// from every water. The eye's place is read here only by drawing rules: a medium (rain, mist, spray) thins inside
// 0.6 to 2.5 m of the lens, a far glint keeps a least angle, flat streaks and darts face the eye, a bubble's film and
// the bow shine by the angle they are seen at, a shaft of the sun seen end-on is not drawn (the kit's law, by angle;
// by place no shaft's axis comes within its own half-width and 2 m of the line). The sun rests at one height
// (sunHeight: 5 degrees; 9, 7 or 2 on a visit at another hour) on bearing 22 and its arrows fly down its line always.
// The shade line (shadeA to shadeB) is fixed on the map: north-east of it the east flank, the lagoon, the rock, the
// bow and the peak lie in gold; south-west of it (the creek, the brig, the south-west arm, the red house) and on the
// whole floor of the great wood all is shade under the low moon. Every light of the island burns always: the fire
// under the mushroom's rim, the house's two windows, the loose lights, the eyes, the brig's green lamp, its stain and
// her bow lantern. The tide stands. What moves, moves on the world clock from seeded starts: surf, leaves, shower,
// bubbles and tails, the six sitters' rounds on the rock, the nest, the loose lights, the gold lights of the tree tops,
// the three files on their round of the south face, the brig at her cable.
//
// Everything is written in WORLD metres (x east, z south, sea level y 0): the object stays at the origin and the
// island's middle is given as `center`. The route of the whole flight is exported from here too, so that the island's
// lanes (through the trunks, up the well in the leaves, down the creek) are tested against the very line that is flown.
//
// MAP OF THIS FILE: places and the route -> the shore field and the land's height -> the shade patch (the fixed shade
// line, the wood's floor, the four lamps and fills of the four skies by where a surface stands, four small lamps of
// the place, the well in the leaves, the grain of wood) -> small helpers -> the gold lights' haunts -> the files'
// round -> buildHero: land, the round, forest, palms, the seven trunks, rocks, surf -> the lagoon (rock and sitters,
// nest, bow, shower, game) -> the sun's shafts and darts -> the grove (mushroom, the trunks' stems and splits,
// ferns), the red house, the small lights -> the brig -> the three files, the kite, the south face (cave fall, hut,
// pool) -> update.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed, makePath } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;

// ---------------------------------------------------------------- places (world metres)
export const PLACES = {
  centre: [-90, -405], half: [110, 70],
  peak: [-62, -390, 52],
  bay: [-60, -490, 42],
  rock: [-70, -492], nest: [-30, -506],
  bowWest: [-62, -501], bowEast: [-23, -485],
  ring: [-128, -440, 17], mushroom: [-124, -452],
  trunks: [[-136, -455], [-113, -448], [-112, -435], [-120, -425], [-134, -424], [-145, -441], [-142, -450]],
  redHouse: [-158, 33, -416], leafWell: [-143, 26, -430],
  // the creek: 26 m wide at its head; from 25 m down it the banks stand back, to 50 m of water where the brig lies
  // (52 m down) and 64 m at the mouth. She lies 14 m to the left of the axis: a full beam and more of open water
  // between her side and that bank's stones, her masts 21 m from the route's line down the other side.
  creekHead: [-165, -394], creekDir: [-0.8, 0.6], creekLen: 120, creekHalf: [13, 25, 32],
  brig: [-197.9, -351.8], portalSeat: [-273, 10, -322],
  cave: [-8, -352], hut: [-60, -338], pool: [0, 14, -400], beach: [-108, -472],
  reef: [[66, -345], [70, -470], [40, -540], [-40, -556], [-125, -520]],
  // the island's north-east point, where the east cliff ends and the shore falls back west to the lagoon
  northEast: [20, -468],
  // the low sun's bearing (degrees clockwise from -Z; it never moves), the low moon's, and the low moon's height: at
  // 8 degrees the wood and the peak hide it from the whole lagoon (at 11 it stood half over the wood's top from there)
  sunAz: 22, moonAz: -132, moonEl: 8,
  // the shade line's two ends: the west end of the lagoon's beach and the south shore
  shadeA: [-150, -470], shadeB: [-40, -340],
  // the three joins of the four skies: lines across the sea (z)
  joins: [-86, -140, -196],
  // the two chimney ridges the route crosses, on the town's axes: the ridge's z, the stacks' tops, one stack's x (they
  // stand every 24 m, each 8 m wide), and the x at which the route crosses the ridge
  stackRows: [[-98, 54, -4, 8], [-138, 72, 10, 22]],
  // the gold lights' lane over the sea: it rises among the last roofs before the quay, runs down the moon's road and
  // through the cloud's cleft, and from the cloud's far edge goes straight to the tree tops over the ring's east side
  laneStart: [0, 17, 10], laneEnd: [-116, 36, -438],
};
// the one height at which the sun rests over the island on a visit (degrees): each hour a visit may deal is another
// fixed height, never a sinking
export const sunHeight = (hour) => hour === 'dawn' ? 9 : hour === 'day' ? 7 : hour === 'night' ? 2 : 5;

// The town's own axes: the origin is the entry point on the nursery floor plan, its -Z the window's axis.
const TOWN = { ox: 70, oz: 160, ax: [0.8, -0.6], az: [0.6, 0.8] };
export const townToWorld = (xL, y, zL) => [TOWN.ox + xL * TOWN.ax[0] + zL * TOWN.az[0], y, TOWN.oz + xL * TOWN.ax[1] + zL * TOWN.az[1]];
export const worldToTown = (x, z) => [(x - TOWN.ox) * TOWN.ax[0] + (z - TOWN.oz) * TOWN.ax[1], (x - TOWN.ox) * TOWN.az[0] + (z - TOWN.oz) * TOWN.az[1]];
// a chimney stack stands at x on the ridge zr (town axes) only where the land does: nothing is built past the quay's line
export const stackStands = (x, zr) => townToWorld(x - 6, 0, zr - 14)[2] > -2 && townToWorld(x + 6, 0, zr - 14)[2] > -2;

// The route of the whole flight, entry to ring. In the town it is given on the town's axes (through the window's
// middle, between two chimney stacks on each ridge), then in world metres: straight down -Z over the sea, through the
// cloud, round the reef's southern end, up the east shore, west along the lagoon, through the ring of trunks, up the
// well in the leaves and down the creek.
export function routePoints() {
  const L = townToWorld, P = PLACES.portalSeat;
  // the room, the two ridges, the crest over the last roofs; then the dive as two arcs of radius 78 m (over the top and out
  // along the sea) so that the heading turns at one even rate; the cloud; HIGH (31 to 27 m) from the cloud's far edge to
  // the reef's southern end; round it a drop that flattens all the way down; LOW (4.5 m) just inside the reef's crest, the
  // surf 10 to 12 m to starboard, as far as abeam the peak; then IN under the east cliff (9 m up, 17 to 20 m from its
  // foot: nearer would bend the line harder than the eye bears) to the north-east point; the lagoon, the
  // beach, the ring of trunks, the rounded top over the canopy, the creek
  return [L(0, 47.5, 0), L(0, 47.5, -30), L(0, 47.5, -48), L(0, 47.8, -62), L(8, 53.5, -98), L(22, 72, -138), [1.2, 75.2, 14],
    [0, 70.5, -12.6], [0, 57, -36], [0, 40.9, -50.5], [0, 24.8, -65], [0, 11.3, -88.4], [0, 6.6, -115], [0, 9, -140], [0, 25, -170],
    [0.6, 34, -190], [3, 35.5, -212], [20, 31, -255], [46, 27, -316], [53.3, 16, -339], [55.6, 9.5, -353],
    [56.5, 5.8, -366], [56, 4.5, -380], [52, 5.3, -395], [44, 7.4, -412], [36.5, 9, -430], [34.5, 8, -449], [30.5, 6.6, -470], [8, 5, -512], [-40, 4, -522],
    [-84, 5, -512], [-112, 8, -482], [-130, 8, -448], [-143, 26, -430], [-150.5, 37, -419], [-160, 41.5, -405.5], [-172, 37.5, -397],
    [-184, 29, -389], [-217, 11, -364], [-233, 10, -352], [P[0], P[1], P[2]]];
}

// ---------------------------------------------------------------- the shore field and the land
const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
const smax = (a, b, k) => -smin(-a, -b, k);
function segDist(px, pz, ax, az, bx, bz) {
  const vx = bx - ax, vz = bz - az, t = clamp(((px - ax) * vx + (pz - az) * vz) / (vx * vx + vz * vz), 0, 1);
  return Math.hypot(px - ax - vx * t, pz - az - vz * t);
}

// lay: the seed's own layout { coast: phase of the coast's coves, cliff: 0..1 height of the cliffs, dell: height of the grove floor }
export function makeLand(noise, lay = {}) {
  const [cx, cz] = PLACES.centre, [ax, az] = PLACES.half, [pkx, pkz, pkh] = PLACES.peak, [bx, bz, br] = PLACES.bay;
  const [hx, hz] = PLACES.creekHead, [dx, dz] = PLACES.creekDir, rx = -dz, rz = dx, CL = PLACES.creekLen;
  const [gx, gz] = PLACES.ring, reef = PLACES.reef, co = lay.coast ?? 0, cliffK = lay.cliff ?? 0.5, dellY = lay.dell ?? 2.0;
  const creekHalf = (a) => PLACES.creekHalf[0] + (PLACES.creekHalf[1] - PLACES.creekHalf[0]) * smoothstep(25, 50, a) + (PLACES.creekHalf[2] - PLACES.creekHalf[1]) * smoothstep(50, CL, a);
  // metres along the creek from its head, and metres to the right of its axis
  const creekFrame = (x, z) => [(x - hx) * dx + (z - hz) * dz, (x - hx) * rx + (z - hz) * rz];
  // the creek's banks wander along its length, the two sides out of step: the brig's side (left of the axis) stands back by
  // up to 4.5 m and never comes in by more than half a metre, the other side comes in or goes out by up to 3 m
  const creekWander = (a, p) => lerp(2 + 2.5 * noise.n2(a * 0.05 + co, 1.9), 0.3 + 2.7 * noise.n2(a * 0.06 - co, 7.3), smoothstep(-4, 4, p)) + 1.1 * noise.n2(a * 0.15, p > 0 ? 3.1 : 8.8) * smoothstep(3, 8, Math.abs(p));
  // metres to the creek's water edge (positive on land)
  const creekEdge = (x, z) => { const [a, p] = creekFrame(x, z), w = creekWander(a, p); return a < 0 ? Math.hypot(a, p) - creekHalf(0) - w : Math.abs(p) - creekHalf(a) - w; };
  const reefDist = (x, z) => { let d = 1e9; for (let i = 0; i < reef.length - 1; i++) d = Math.min(d, segDist(x, z, reef[i][0], reef[i][1], reef[i + 1][0], reef[i + 1][1])); return d; };
  // inside the reef's arc (the reef's line closed through the island's middle) the water stays shallow: the lagoon
  const poly = [...reef, [cx, cz]];
  const inLagoon = (x, z) => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, zi] = poly[i], [xj, zj] = poly[j];
      if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  };
  // the shore field: metres inland of the waterline (negative: metres out to sea)
  const shore = (x, z) => {
    const ex = Math.abs(x - cx) / ax, ez = Math.abs(z - cz) / az, e = Math.pow(ex * ex * ex + ez * ez * ez, 1 / 3) || 1e-6, rr = Math.hypot(x - cx, z - cz);
    let s = (1 - e) * (rr / e) + 6 * noise.fbm2(x * 0.017 + co, z * 0.017 - co, 3);
    s = smin(s, Math.hypot(x - bx, z - bz) - br, 8);
    const [a, p] = creekFrame(x, z);
    const arm = smin(creekHalf(a) + 24 + 3 * noise.n2(a * 0.05 + co, p * 0.02) - Math.abs(p), smin(CL + 3 - a, a + 30, 6), 10);
    s = smax(s, arm, 12);
    return smin(s, creekEdge(x, z), 3);
  };
  // how cliff-like the shore is here: 0 on the lagoon's beach, 1 on the east, south and west faces
  const cliffy = (x, z) => 1 - smoothstep(100, 62, Math.hypot(x - bx, z - bz));
  const height = (x, z) => {
    const s = shore(x, z);
    if (s <= 0) {
      const d = -s, rd = reefDist(x, z);
      let h = -(0.5 + Math.min(d, 45) * 0.075) - (inLagoon(x, z) ? 0 : Math.max(0, d - 45) * 0.3);
      // the creek is a channel with water enough under the brig: 3.5 m more of it from 9 m off either bank, shoaling
      // again over the 40 m outside its mouth
      h -= 3.5 * smoothstep(1.5, 9, -creekEdge(x, z)) * smoothstep(CL + 40, CL, creekFrame(x, z)[0]);
      h = Math.max(h, -14) + 0.35 * noise.n2(x * 0.09, z * 0.09);
      // the reef's crest and its coral heads
      const crest = Math.exp(-(rd * rd) / 40);
      return Math.min(-0.25, lerp(h, -0.5 + 0.25 * noise.n2(x * 0.2, z * 0.2), crest));
    }
    const c = cliffy(x, z), ce = creekEdge(x, z), onArm = smoothstep(-185, -205, x);
    const n1 = noise.fbm2(x * 0.021 + 9, z * 0.021 + 4, 3), w = lerp(26, 5, c);
    const top = lerp(lerp(11 + 3 * n1, 8 + 2 * n1, onArm) * (0.85 + 0.3 * cliffK), 2.3, 1 - c);
    let h = smoothstep(0, w, s) * top + Math.max(0, s - w) * lerp(0.035, 0.1, c) * (1 - onArm);
    // the creek's banks are lower and steep
    h = lerp(h, Math.min(h, 7 + 2 * n1), smoothstep(26, 8, ce) * smoothstep(0, 5, s));
    // the grove's floor: a level dell under the seven trunks, open to the beach
    const dg = Math.hypot(x - gx, z - gz);
    h = lerp(h, dellY + 0.4 * n1, smoothstep(46, 24, dg) * smoothstep(0, 10, s));
    // the peak
    const pr2 = (x - pkx) * (x - pkx) + (z - pkz) * (z - pkz);
    h += (pkh - 17) * Math.exp(-pr2 / 1700) * smoothstep(6, 40, s);
    return h + 0.5 * noise.n2(x * 0.07, z * 0.07) * smoothstep(0, 6, s);
  };
  return { shore, height, creekFrame, creekEdge, creekHalf, creekWander, reefDist, cliffy, inLagoon };
}

// ---------------------------------------------------------------- the shade that stands on the island
// One set of uniforms for every lit material of the island. The low sun never moves, so the island's own bulk keeps
// one side of it out of the sun for good. THE SHADE LINE is one straight line of the map, from the west end of the
// lagoon's beach (shadeA) to the south shore (shadeB): a surface north-east of it takes the sun, a surface south-west
// of it does not, by where the surface itself stands (soft over 20 m), never by where the eye is. Under the leaves of
// the great wood round the ring of trunks whatever stands lower than the crowns is in shade on either side of the line.
// THE FOUR LAMPS. The scene has four lamps on four fixed bearings whose colours never change: the low sun (the scene's
// first lamp), the first moon's, the day's from above, the low moon's. None ever turns. EVERYTHING IS BY WHERE THE
// SURFACE STANDS, nothing by the eye: each lamp is brighter or fainter by the sky the surface itself stands under
// (how much of night, first light, day and sundown stands at its own z; two cross over 40 m at each of the three
// lines, uNwJoin), and the sky's fill is taken the same way (uNwSky, uNwGnd); the sun is cut by the shade above; the
// low moon lights only what the sun does not (peak and wood stand between it and the sunlit side). So the town
// stands in its night, the sleepers in the bank's white day and the island in its sundown, from wherever they are
// seen. A room takes none of the lamps (uNwMoon.y 1).
// Four small lamps of the place are worked in the shader, each with a reach in metres and no shadow: the fire under
// the mushroom's rim, the brig's green lamp, her bow lantern, and the common glow of the gold lights gathered in the
// well of leaves by the little house. They burn always.
export function makeShade() {
  const [ax, az] = PLACES.shadeA, [bx, bz] = PLACES.shadeB, ll = Math.hypot(bx - ax, bz - az), nx = (bz - az) / ll, nz = -(bx - ax) / ll;
  const uniforms = { uNwShade: { value: new THREE.Vector4(nx, nz, ax * nx + az * nz, 0) },
    // the great wood: the ring's middle in x and z, the radius its shade reaches on the ground, the height of the crowns' base
    uNwWood: { value: new THREE.Vector4(PLACES.ring[0], PLACES.ring[1], 44, 22) },
    uNwMoon: { value: new THREE.Vector2(0, 0) }, uNwJoin: { value: new THREE.Vector3(...PLACES.joins) }, uNwFirst: { value: new THREE.Vector3(1, 1, 1) },
    uNwSky: { value: [0, 1, 2, 3].map(() => new THREE.Vector3(1, 1, 1)) }, uNwGnd: { value: [0, 1, 2, 3].map(() => new THREE.Vector3(1, 1, 1)) },
    uNwLamp: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -900, 0, 1)) }, uNwLampCol: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
    // the low moon's cool light as it comes scattered into the shade: a fill on what the sun does not light
    uNwCool: { value: new THREE.Vector3() },
    // the well in the leaves: three points of its axis (far away until the grove sets them) and its radius
    uNwWell: { value: [new THREE.Vector3(0, -900, 0), new THREE.Vector3(0, -901, 0), new THREE.Vector3(0, -902, 0)] }, uNwWellR: { value: 7 } };
  // leaves and twigs that would hang inside the well are not drawn there: the well is a clear shaft through the crowns,
  // its wall a little ragged
  const WELL_GLSL = `
  uniform vec3 uNwWell[3]; uniform float uNwWellR;
  float nwSeg(vec3 p, vec3 a, vec3 b){ vec3 ab = b - a; return distance(p, a + ab * clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-4), 0., 1.)); }
  float nwWell(vec3 p){ return min(nwSeg(p, uNwWell[0], uNwWell[1]), nwSeg(p, uNwWell[1], uNwWell[2])); }
  float nwH3(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float nwVn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(nwH3(i), nwH3(i + vec3(1., 0., 0.)), f.x), mix(nwH3(i + vec3(0., 1., 0.)), nwH3(i + vec3(1., 1., 0.)), f.x), f.y),
      mix(mix(nwH3(i + vec3(0., 0., 1.)), nwH3(i + vec3(1., 0., 1.)), f.x), mix(nwH3(i + vec3(0., 1., 1.)), nwH3(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }`;
  const dirLoop = 'getDirectionalLightInfo( directionalLight, directLight );';
  const hemiLine = 'irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );';
  const leafTerm = 'reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb';
  // `leaves`: this material is foliage, and is cleared out of the well (wood, walls and earth are not). `grain`: the
  // island's wood takes its grain (false for what is not the island's: the town's brick, the birds, the fins)
  const patch = (material, leaves = false, grain = true) => {
    const old = material.onBeforeCompile, oldKey = material.customProgramCacheKey;
    material.onBeforeCompile = (shader, renderer) => {
      if (old) old.call(material, shader, renderer);
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vNwW;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
        { vec4 nwP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          nwP = instanceMatrix * nwP;
        #endif
          vNwW = (modelMatrix * nwP).xyz; }`);
      const begin = THREE.ShaderChunk.lights_fragment_begin
        .replace(dirLoop, dirLoop + ' directLight.color *= ( UNROLLED_LOOP_INDEX == 0 ) ? nwK0 : ( UNROLLED_LOOP_INDEX == 1 ) ? nwK1 : ( UNROLLED_LOOP_INDEX == 2 ) ? nwK2 : nwK3;')
        .replace(hemiLine, 'irradiance += mix( nwGnd, nwSky, 0.5 * dot( geometryNormal, hemisphereLights[ i ].direction ) + 0.5 );');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vNwW; uniform vec4 uNwShade, uNwWood; uniform vec2 uNwMoon; uniform vec3 uNwJoin, uNwFirst, uNwCool, uNwSky[4], uNwGnd[4]; uniform vec4 uNwLamp[4]; uniform vec3 uNwLampCol[4]; float nwLit = 1.0; vec3 nwK0, nwK1, nwK2, nwK3, nwSky, nwGnd;' + WELL_GLSL)
        // (leaves) the well's cut is DECIDED here and MADE further down, after the normal and before the lights: a texture level or a
        // derivative taken after a discard is not defined, and the leaf map, the width of the alpha edge and the kit's bark relief are all
        // taken between the two places (the rim of the cut came out different on each draw); after the normal nothing takes either
        // in this Lambert material as the world lights it (no light here casts a shadow, and it has no light, ao or environment map)
        .replace('#include <clipping_planes_fragment>', leaves ? `#include <clipping_planes_fragment>
        bool nwCut; { vec3 nwC = floor(vNwW * 2.5); float nwH = fract(sin(dot(nwC, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          nwCut = nwWell(vNwW) < uNwWellR * (0.8 + 0.2 * nwH); }` : '#include <clipping_planes_fragment>')
        .replace('#include <normal_fragment_maps>', leaves ? `#include <normal_fragment_maps>
        if (nwCut) discard;` : '#include <normal_fragment_maps>')
        // wood and bark (whatever is redder than it is green) take a grain that runs up the stem: furrows a third of a metre apart
        .replace('#include <color_fragment>', grain ? `#include <color_fragment>
        { float nwWood = smoothstep(-0.01, 0.05, diffuseColor.r - diffuseColor.g); vec3 nwQ = vNwW * vec3(3.1, 0.5, 3.1);
          float nwG = nwVn(nwQ) * 0.6 + nwVn(nwQ * 2.3 + 7.1) * 0.4;
          diffuseColor.rgb *= mix(1.0, 0.45 + 0.9 * nwG, nwWood); }` : '#include <color_fragment>')
        .replace('#include <lights_fragment_begin>', `nwLit = smoothstep(-10.0, 10.0, dot(vNwW.xz, uNwShade.xy) - uNwShade.z);
        nwLit *= 1.0 - smoothstep(uNwWood.z, uNwWood.z - 14.0, distance(vNwW.xz, uNwWood.xy)) * smoothstep(uNwWood.w, uNwWood.w - 8.0, vNwW.y);
        { float nwOn = 1.0 - uNwMoon.y;
          // how much of each of the four skies stands over THIS SURFACE: its own z against the three lines, 20 m either side
          float nwT0 = 1.0 - smoothstep(uNwJoin.x - 20.0, uNwJoin.x + 20.0, vNwW.z), nwT1 = 1.0 - smoothstep(uNwJoin.y - 20.0, uNwJoin.y + 20.0, vNwW.z), nwT2 = 1.0 - smoothstep(uNwJoin.z - 20.0, uNwJoin.z + 20.0, vNwW.z);
          vec4 nwW = vec4(1.0 - nwT0, nwT0 * (1.0 - nwT1), nwT1 * (1.0 - nwT2), nwT2);
          nwK0 = vec3(nwW.w * nwLit * nwOn); nwK1 = (nwW.x + nwW.y * uNwFirst) * nwOn; nwK2 = vec3(nwW.z * nwOn); nwK3 = vec3(nwW.w * (1.0 - nwLit) * nwOn);
          nwSky = nwW.x * uNwSky[0] + nwW.y * uNwSky[1] + nwW.z * uNwSky[2] + nwW.w * uNwSky[3]; nwGnd = nwW.x * uNwGnd[0] + nwW.y * uNwGnd[1] + nwW.z * uNwGnd[2] + nwW.w * uNwGnd[3];
          vec3 nwCool = uNwCool * (nwW.w * (1.0 - nwLit) * nwOn); nwSky += nwCool; nwGnd += nwCool * 0.7; }
        ` + begin)
        .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        { vec3 nwE = vec3(0.0);
          for (int nwI = 0; nwI < 4; nwI++) { vec3 nwTo = uNwLamp[nwI].xyz - vNwW; float nwD = max(length(nwTo), 1.0e-3);
            vec3 nwL = (viewMatrix * vec4(nwTo / nwD, 0.0)).xyz; float nwF = 1.0 - clamp(nwD / max(uNwLamp[nwI].w, 1.0e-3), 0.0, 1.0);
            nwE += uNwLampCol[nwI] * (nwF * nwF * max(dot(normal, nwL), 0.0)); }
          reflectedLight.directDiffuse += diffuseColor.rgb * nwE; }`)
        .replace(leafTerm, 'reflectedLight.directDiffuse += nwK0 * directionalLights[0].color * diffuseColor.rgb');
    };
    material.customProgramCacheKey = () => (oldKey ? oldKey.call(material) : material.type) + (leaves ? '-nwleaves6' : '-nwshade6') + (grain ? '' : 'p');
    return material;
  };
  return { uniforms, patch,
    // the soft edge of the shade is moved `d` metres toward the south-west (a visit's own state, set once in build)
    shift(d) { uniforms.uNwShade.value.z = ax * nx + az * nz - d; },
    // a room: neither the sun nor the moon's lamp comes in
    room() { uniforms.uNwShade.value.z = 1e6; uniforms.uNwMoon.value.y = 1; },
    // the four skies' fills (sky and ground colours, strengths in them) and the first light's lamp colour over the night's
    skies(sky, gnd, first, cool) { uniforms.uNwCool.value.fromArray(cool); sky.forEach((c, i) => uniforms.uNwSky.value[i].fromArray(c)); gnd.forEach((c, i) => uniforms.uNwGnd.value[i].fromArray(c)); uniforms.uNwFirst.value.fromArray(first); },
    // how far north-east of the line a place lies, in metres (negative: in the shade)
    side(x, z) { return x * nx + z * nz - uniforms.uNwShade.value.z; },
    lamp(i, x, y, z, reach) { uniforms.uNwLamp.value[i].set(x, y, z, reach); },
    lampColor(i, r, g, b) { uniforms.uNwLampCol.value[i].set(r, g, b); },
    setWell(a, b, c, r) { const w = uniforms.uNwWell.value; w[0].copy(a); w[1].copy(b); w[2].copy(c); uniforms.uNwWellR.value = r; } };
}

// ---------------------------------------------------------------- small helpers
// A MEDIUM we fly through (cloud, mist, spray, rain) thins only between NEAR[0] and NEAR[1] true metres of the eye,
// whatever its size. The kit's mist takes its range times each puff's size: mistNear gives the range for a mist whose
// puffs are size[0] to size[1] across, so that every puff of it thins inside NEAR.
export const NEAR = [0.6, 2.5];
export const mistNear = (size) => [NEAR[0] / size[0], NEAR[1] / size[1]];
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// the route as points two metres apart, for lane tests
export function lanePoints(path, step = 2) {
  const out = [], p = new THREE.Vector3();
  for (let m = 0; m <= path.length; m += step) { path.posAtDist(m, p); out.push(p.x, p.y, p.z); }
  return new Float32Array(out);
}
// least distance from a place to the route's points
function laneDist(pts, x, y, z, i0 = 0, i1 = pts.length / 3) {
  let best = 1e18;
  for (let i = i0; i < i1; i++) { const dx = pts[i * 3] - x, dy = pts[i * 3 + 1] - y, dz = pts[i * 3 + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
  return Math.sqrt(best);
}
// least horizontal distance from an upright thing (foot y0, top y1) to the route where the route is within its height
function laneDistUpright(pts, x, z, y0, y1, i0 = 0, i1 = pts.length / 3) {
  let best = 1e18;
  for (let i = i0; i < i1; i++) {
    const sy = pts[i * 3 + 1], dy = sy < y0 ? y0 - sy : sy > y1 ? sy - y1 : 0, dx = pts[i * 3] - x, dz = pts[i * 3 + 2] - z, d = dx * dx + dz * dz + dy * dy;
    if (d < best) best = d;
  }
  return Math.sqrt(best);
}

// the route's span through the leaves over the ring of trunks: from where it has risen 12 m over the grove's floor to
// its highest point above the tree tops (indices into the lane's points, three points of its axis, the well's radius)
export function wellSpan(lane, laneFrom, dellY) {
  const [gx, gz] = PLACES.ring; let a = -1, b = -1, top = -1;
  for (let i = laneFrom; i < lane.length / 3; i++) {
    const x = lane[i * 3], y = lane[i * 3 + 1], z = lane[i * 3 + 2];
    if (a < 0 && Math.hypot(x - gx, z - gz) < 40 && y > dellY + 12) a = i;
    if (a >= 0 && i < a + 60 && y > top) { top = y; b = i; }
  }
  const at = (i) => V3(lane[i * 3], lane[i * 3 + 1], lane[i * 3 + 2]);
  return { a, b, pts: [at(a), at((a + b) >> 1), at(b)], r: 9 };
}
export const laneStart = (lane) => { let i = 0; while (i < lane.length / 3 - 1 && lane[i * 3 + 2] > -250) i++; return i; };

// ---------------------------------------------------------------- the gold lights: their haunts
// A gold light lives in a haunt: a course of its own through places of the world (a closed round, or the one lane over
// the sea) along which its station goes at one speed on the world clock, from a start dealt by its haunt's stream; about
// the station it darts, a dash and then a pause, within `reach` metres. Nothing here takes the metres flown, the route's
// parameter or the eye. Every course is tested whole against the whole route when it is built: station and darts together
// never come within 8 m of the line (in the nursery: 5 m aside of it or 4 m under it) nor within 30 m of the ring of
// light at the end; a course that cannot keep that is not there.
const DART = 1.54;
// a course: a smooth curve through points [x, y, z, reach], as samples a metre and a half apart
function courseTable(points, closed) {
  const curve = new THREE.CatmullRomCurve3(points.map((q) => V3(q[0], q[1], q[2])), closed, 'centripetal'); curve.arcLengthDivisions = 400;
  const len = curve.getLength(), n = Math.max(8, Math.ceil(len / 1.5)), pts = new Float32Array((n + 1) * 4), p = V3(0, 0, 0), segs = closed ? points.length : points.length - 1;
  for (let i = 0; i <= n; i++) {
    const t = curve.getUtoTmapping(i / n), ts = Math.min(t * segs, segs - 1e-6), k = Math.floor(ts);
    curve.getPoint(t, p); pts.set([p.x, p.y, p.z, lerp(points[k][3], points[(k + 1) % points.length][3], ts - k)], i * 4);
  }
  return { pts, n, len };
}
// The least room a course leaves, on one scale: 8 or more means the rule holds along all of it. Outside the nursery it
// is the distance to the route less the dart's farthest corner; in the nursery (its floor plan, on the town's axes) it
// and for the 9 m outside its window in which a light that has come through the window's opening gets clear) it is 8
// plus the better of (metres aside - 5) and (metres under - 4); the portal's seat counts as 22 m nearer than it is.
function courseLeast(tab, lane, i0, i1) {
  let least = 1e9; const P = PLACES.portalSeat;
  for (let i = 0; i <= tab.n; i++) {
    const x = tab.pts[i * 4], y = tab.pts[i * 4 + 1], z = tab.pts[i * 4 + 2], r = tab.pts[i * 4 + 3], [xl, zl] = worldToTown(x, z);
    const room = zl > -47 && zl < 0.6 && Math.abs(xl) < 15 && y > 30 && y < 56;
    const c = room ? 8 + Math.max(Math.abs(xl) - r - 5, 47.5 - y - 0.6 * r - 4) : laneDist(lane, x, y, z, i0, i1) - DART * r;
    least = Math.min(least, c, Math.hypot(x - P[0], y - P[1], z - P[2]) - DART * r - 22);
  }
  return least;
}
const goldLight = (tab, rng, speed, s0 = rng() * tab.len, ends = 0) => ({ tab, speed, s0, slot: rng.range(0.6, 0.9), seed: rng() * 100, ends });
// ONE about the nursery: in low over the sill, round the room over the beds' feet and along the walls, low across the
// back, out again, down over the street, round the far sides of the two stacks that flank the route on the first ridge
// (crossing under the route's line over the street and again over the roof behind the ridge); a round of 20 to 30 s
export function goldNursery(rng, lane) {
  const [zr, top, xa] = PLACES.stackRows[0], xb = xa + 24;
  const round = [[2.5, 42.9, -37, 0.4], [4.5, 39, -44, 0.8], [8, 36, -57, 1.5], [xb - 6, 38, zr + 23, 2.2], [xb + 2, top + 2, zr + 6, 1.6], [xb + 9, top + 4, zr, 1.6], [xb + 4, top - 2, zr - 7, 1.6],
    [xb - 3, top - 8, zr - 8, 1.4], [(xa + xb) / 2, top - 11, zr - 7, 1.2], [xa + 3, top - 8, zr - 8, 1.4], [xa - 4, top - 2, zr - 7, 1.6], [xa - 9, top + 4, zr, 1.6], [xa - 4, top + 2, zr + 6, 1.6],
    [xa - 8, 40, zr + 26, 2], [-8, 37, -58, 1.6], [-4.5, 39, -44, 0.8],
    [-2.5, 42.9, -37, 0.4], [-5.5, 42.7, -29, 0.5], [-6.3, 42.9, -20, 0.5], [-6.5, 43, -13, 0.5], [-11, 44.5, -7.5, 0.5], [-5, 42.6, -4.2, 0.5], [0, 42.2, -3.5, 0.5], [6.5, 42.6, -4, 0.5],
    [10.3, 46.8, -8, 0.5], [6, 42.9, -19, 0.5], [5.5, 42.7, -29, 0.5]];
  const tab = courseTable(round.map((q) => [...townToWorld(q[0], q[1], q[2]), q[3]]), true), T = rng.range(20, 30), L = goldLight(tab, rng, tab.len / T);
  const least = courseLeast(tab, lane, 0, lane.length / 3);
  return { lights: least >= 8 ? [L] : [], least, tab };
}
// THREE TO FIVE among the stacks: each weaves round two or three stacks of its own that stand together on one ridge, on
// one side of the route, the nearest of them the second stack from the route's crossing or further
export function goldStacks(rng, lane) {
  const lights = [], used = new Set(), K = rng.int(3, 5); let least = 1e9;
  for (let k = 0; k < K; k++) {
    for (let tries = 0; tries < 40; tries++) {
      const row = rng.int(0, 1), side = rng.sign(), first = rng.int(2, 4), n = rng.int(2, 3), h = rng.range(1.5, 5), speed = rng.range(7, 11);
      const [zr, top, sx, xc] = PLACES.stackRows[row], j0 = Math.floor((xc - sx) / 24), js = [];
      for (let i = 0; i < n; i++) js.push(side > 0 ? j0 + first + i : j0 + 1 - first - i);
      if (js.some((j) => used.has(row + ':' + j) || !stackStands(sx + 24 * j, zr))) continue;
      const c = js.map((j) => sx + 24 * j), pts = [];
      c.forEach((x, i) => pts.push([x, top + h, zr + (i % 2 ? -5.5 : 5.5), 1.6]));
      pts.push([c[n - 1] + side * 9, top + h + 1, zr, 1.6]);
      for (let i = n - 1; i >= 0; i--) pts.push([c[i], top + h + 2, zr - (i % 2 ? -5.5 : 5.5), 1.6]);
      pts.push([c[0] - side * 9, top + h + 1, zr, 1.6]);
      const tab = courseTable(pts.map((q) => [...townToWorld(q[0], q[1], q[2]), q[3]]), true), room = courseLeast(tab, lane, 0, lane.length / 3);
      if (room < 8) continue;
      js.forEach((j) => used.add(row + ':' + j)); least = Math.min(least, room); lights.push(goldLight(tab, rng, speed)); break;
    }
  }
  return { lights, least };
}

// THE LANE over the sea, from places: it rises among the last roofs before the quay, runs down the moon's road in two
// tracks 15 m either side of it (so the lane is 40 m wide on open water with the darts), draws in to 11 m either side
// through the cloud's cleft, and from the cloud's far edge goes straight to the tree tops over the ring's east side,
// 8 to 30 m over the sea and 22 m over the land. Two trains ply it for ever, one on each track: four slow lights at
// 15 m/s and three or four fast ones at 40 m/s, evenly spaced, each train's start dealt by the stream. A light shows as
// it rises among the roofs and is lost in the leaves at the far end (by its own place on the lane).
export function goldLane(rng, lane, land) {
  const lights = [], E = PLACES.laneEnd, S0 = PLACES.laneStart, J = PLACES.joins, slowSide = rng.sign(), nFast = rng.int(3, 4); let least = 1e9, length = 0;
  for (const [side, n, speed] of [[slowSide, 4, 15], [-slowSide, nFast, 40]]) {
    const pts = [[side * 3, S0[1], S0[2], 1], [side * 8, S0[1] + 10, -12, 1.5], [side * 15, 20, -45, 2.5], [side * 15, 15, J[0], 2.5], [side * 13, 12, J[1] + 12, 2.2],
      [side * 11, 10, J[1] - 10, 1.4], [side * 11, 10, J[2] + 6, 1.4], [side * 11, 13, J[2] - 10, 1.4]];
    const a = pts[pts.length - 1];
    for (let k = 1; k <= 10; k++) { const t = k / 10, x = lerp(a[0], E[0], t), z = lerp(a[2], E[2], t); pts.push([x, k < 10 ? Math.max(lerp(a[1], E[1], t), land.height(x, z) + 22) : E[1], z, 2.5]); }
    const tab = courseTable(pts, false), room = courseLeast(tab, lane, 0, lane.length / 3), start = rng() * tab.len;
    least = Math.min(least, room); length = tab.len;
    for (let k = 0; k < n; k++) { const L = goldLight(tab, rng, speed, start + k * tab.len / n, 16); if (room >= 8) lights.push(L); }
  }
  return { lights, least, length };
}
// ON THE ISLAND a dozen or two: a third of them (four at least) gathered in the well of leaves by the little house,
// each on a small round of its own on the well's wall on the house's side; the rest threading the tree tops, each on a
// round through two or three crowns that stand together. crowns: [x, top, z] of the great trees; well: wellSpan().
export function goldIsle(rng, lane, laneFrom, crowns, well) {
  const lights = [], n = rng.int(12, 24), nWell = Math.max(4, Math.round(n / 3)), H = V3(...PLACES.redHouse), A = well.pts, p = V3(0, 0, 0), glow = { x: 0, y: 0, z: 0, w: 0, n: 0 }; let least = 1e9;
  const axis = (t, o) => t < 0.5 ? o.lerpVectors(A[0], A[1], t * 2) : o.lerpVectors(A[1], A[2], t * 2 - 1);
  const u = A[2].clone().sub(A[0]).normalize(), e1 = H.clone().sub(axis(0.5, p)); e1.addScaledVector(u, -e1.dot(u)).normalize(); const e2 = u.clone().cross(e1);
  for (let k = 0; k < n; k++) {
    for (let tries = 0; tries < 8; tries++) {
      const pts = [];
      if (k < nWell) {
        // stepped a metre further out from the well's axis at each try until the whole round keeps the rule
        const t0 = rng.range(0.2, 0.9), a0 = rng.range(-1.9, 1.9), R = rng.range(9.6, 11.6) + tries, dt = rng.range(0.1, 0.25), da = rng.range(0.25, 0.6), f0 = rng() * TAU;
        for (let j = 0; j < 4; j++) { const f = f0 + j * Math.PI / 2, a = a0 + da * Math.sin(f); axis(clamp(t0 + dt * Math.cos(f), 0.05, 1), p).addScaledVector(e1, R * Math.cos(a)).addScaledVector(e2, R * Math.sin(a)); pts.push([p.x, p.y, p.z, 0.8]); }
        if (pts.some((q) => Math.hypot(q[0] - H.x, q[1] - H.y, q[2] - H.z) < 5)) continue;
      } else {
        const c0 = crowns[rng.int(0, crowns.length - 1)], m = rng.int(2, 3), d2 = (c) => (c[0] - c0[0]) ** 2 + (c[2] - c0[2]) ** 2;
        for (const c of crowns.slice().sort((x, y) => d2(x) - d2(y)).slice(0, m)) { const a = rng() * TAU, r = rng.range(3, 6), y = c[1] + rng.range(-2, 3);
          pts.push([c[0] + Math.cos(a) * r, y, c[2] + Math.sin(a) * r, 1.5], [c[0] - Math.cos(a) * r, y + rng.range(-1.5, 1.5), c[2] - Math.sin(a) * r, 1.5]); }
      }
      const tab = courseTable(pts, true), room = courseLeast(tab, lane, laneFrom, lane.length / 3), L = goldLight(tab, rng, rng.range(5, 9));
      if (room < 8) continue;
      least = Math.min(least, room); lights.push(L);
      // a light gathered in the well adds its whole round to the middle of the gathering
      if (k < nWell) { for (let i = 0; i < tab.n; i++) { glow.x += tab.pts[i * 4]; glow.y += tab.pts[i * 4 + 1]; glow.z += tab.pts[i * 4 + 2]; } glow.w += tab.n; glow.n++; }
      break;
    }
  }
  if (glow.w) { glow.x /= glow.w; glow.y /= glow.w; glow.z /= glow.w; }
  // glow: the middle of the gathered lights' own rounds (the mean of their course tables) and how many they are
  return { lights, least, glow };
}

// ---------------------------------------------------------------- the gold lights: what is drawn
// Each light is one hard point of gold: a core half a metre across in a glow of 1.2 m, no rays, no figure, nothing
// shed. A new place in its reach is dealt every `slot` (0.6 to 0.9 s): it dashes there at 40 to 70 m/s and waits as a
// steady point. While it dashes, a faint streak shows the last 2 m of its way at most (0.035 s of it).
export function makeGoldLights(lights, rng) {
  const N = lights.length, object = new THREE.Group();
  const glow = fx.makeGlows({ rng, positions: lights.map(() => [0, -500, 0]), color: '#ffbe3a', size: 1.2, intensity: 2.8, core: 1.1, halo: 0.25, minAngle: 0.0045, fogAmount: 0, near: [0.2, 0.6] });
  glow.object.frustumCulled = false; object.add(glow.object);
  const sp = new Float32Array(N * 12), sa = new Float32Array(N * 4), idx = [], g = new THREE.BufferGeometry();
  for (let i = 0; i < N; i++) { sa[i * 4 + 2] = sa[i * 4 + 3] = 1; idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2); }
  g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('aAge', new THREE.BufferAttribute(sa, 1)); g.setIndex(idx);
  const streak = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: /* glsl */`attribute float aAge; varying float vAge; void main(){ vAge = aAge; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`varying float vAge; void main(){ gl_FragColor = vec4(vec3(1., .78, .3) * .55 * (1. - vAge) * (1. - vAge), 1.); }` }));
  streak.frustumCulled = false; streak.renderOrder = 8; object.add(streak);
  const hh = (L, k, j) => { const x = Math.sin(k * 127.1 + j * 311.7 + L.seed) * 43758.5453; return x - Math.floor(x); };
  const st = V3(0, 0, 0), fw = V3(0, 0, 0), rt = V3(0, 0, 0), up = V3(0, 0, 0), o0 = V3(0, 0, 0), o1 = V3(0, 0, 0), head = V3(0, 0, 0), tail = V3(0, 0, 0), eye = V3(0, 0, 0), w = V3(0, 0, 0);
  const off = (L, k, r, o) => o.set((hh(L, k, 1) - 0.5) * 2 * r, (hh(L, k, 2) - 0.5) * 1.2 * r, (hh(L, k, 3) - 0.5) * 2 * r);
  // where light L is at clock t; returns how much of it shows (1, or less at the two ends of the lane)
  const place = (L, t, out) => {
    const T = L.tab, P = T.pts, s = (((L.s0 + L.speed * t) % T.len) + T.len) % T.len, q = s / T.len * T.n, i = Math.min(Math.floor(q), T.n - 1), f = q - i, a = i * 4, b = a + 4;
    st.set(lerp(P[a], P[b], f), lerp(P[a + 1], P[b + 1], f), lerp(P[a + 2], P[b + 2], f)); const r = lerp(P[a + 3], P[b + 3], f);
    fw.set(P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]).normalize(); rt.set(-fw.z, 0, fw.x); if (rt.lengthSq() < 1e-6) rt.set(1, 0, 0); rt.normalize(); up.crossVectors(rt, fw);
    const c = t / L.slot + L.seed, k = Math.floor(c), f0 = (c - k) * L.slot; off(L, k - 1, r, o0); off(L, k, r, o1);
    o0.lerp(o1, smoothstep(0, 1, clamp(f0 * lerp(40, 70, hh(L, k, 4)) / Math.max(o0.distanceTo(o1), 1e-3), 0, 1)));
    out.copy(st).addScaledVector(rt, o0.x).addScaledVector(up, o0.y).addScaledVector(fw, o0.z);
    return L.ends ? smoothstep(0, L.ends, s) * (1 - smoothstep(T.len - L.ends, T.len, s)) : 1;
  };
  const update = (dt, time, camera) => {
    camera.getWorldPosition(eye);
    lights.forEach((L, i) => {
      const k = place(L, time, head); glow.setPosition(i, head.x, head.y, head.z); glow.setSize(i, k);
      place(L, time - 0.035, tail); w.copy(tail).sub(head); const l = w.length(); if (l > 2) w.multiplyScalar(2 / l);
      tail.copy(eye).sub(head).cross(w); if (tail.lengthSq() < 1e-8) tail.set(0, 0, 0); else tail.normalize().multiplyScalar(0.04 * k);
      sp.set([head.x + tail.x, head.y + tail.y, head.z + tail.z, head.x - tail.x, head.y - tail.y, head.z - tail.z,
        head.x + w.x + tail.x, head.y + w.y + tail.y, head.z + w.z + tail.z, head.x + w.x - tail.x, head.y + w.y - tail.y, head.z + w.z - tail.z], i * 12);
    });
    g.attributes.position.needsUpdate = true; glow.update(dt, time);
  };
  return { object, update, place, count: N };
}

// a matrix from a place, three turns (radians, order Y X Z) and a scale
const _e = new THREE.Euler(), _q = new THREE.Quaternion();
export const mat = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(V3(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), V3(sx, sy, sz));
// one mesh out of many plain shapes: corners, normals and one colour per shape
export function makeMesher() {
  const pos = [], nor = [], col = [], m3 = new THREE.Matrix3(), v = new THREE.Vector3(), c = new THREE.Color();
  const api = {
    count: 0,
    add(geo, matrix, color) {
      const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = g.attributes.normal;
      m3.getNormalMatrix(matrix); c.set(color);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i).applyMatrix4(matrix); pos.push(v.x, v.y, v.z);
        v.fromBufferAttribute(n, i).applyMatrix3(m3).normalize(); nor.push(v.x, v.y, v.z);
        col.push(c.r, c.g, c.b);
      }
      api.count += p.count / 3;
      return api;
    },
    box(w, h, d, matrix, color) { return api.add(new THREE.BoxGeometry(w, h, d), matrix, color); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.computeBoundingSphere();
      return g;
    },
  };
  return api;
}

// the seed's own layout of the island: the coast's coves, the cliffs' height, the rock's outline, which trunk is the
// giant, the brig's lean and which of her sails hangs loose
export function islandLayout(seed) {
  const r = makeRng(hashSeed('isle-layout:' + seed));
  return { coast: r.range(0, 40), cliff: r(), dell: 2.0, rockShape: r.int(0, 2), giant: r.int(0, 6), lean: r.range(-1, 1), loose: r.int(0, 3) };
}

// ---------------------------------------------------------------- the files' round
// The closed round the three files walk (see the files in buildHero). Two lines of the island's south face: the shore
// path, 9 m in from the water, and the same face 17 m further inland; of each, the longest run that stands `far` + 4 m
// and more from the flight's line; the two runs joined at their ends. stems: [x, z, radius] of what stands by place
// before any path is laid (the hut): the round's points are stepped off them, bark and 0.9 m. The finished round is
// read every half metre and tested whole against the whole line: if any of it stood nearer than `far`, both runs are
// cut back 4 m and it is laid again; a shore on which that never holds gets no round (n 0) and no files. THE PATH IS
// BARE: the wood and the palms are dealt after it and none stands with its bark within 0.9 m of it (clear()).
// Returns the table (x, ground, z every `step` metres), its length, the least distance to the line, the least room
// to a stem, at(s, out): the place s metres round it, and clear(x, z, r).
export function fileRound(land, lane, stems, groundAt, far = 75) {
  const [ccx, ccz] = PLACES.centre, NB = 240, none = { n: 0, len: 1, least: 0, stem: 0, at: (s, out) => out.set(ccx, 0, ccz), clear: () => true };
  const farFrom = (x, z) => laneDist(lane, x, land.height(x, z) + 1, z);
  // the line `inland` metres behind the water's edge, on NB bearings round the island's middle, and its longest far run
  const run = (inland, margin) => {
    const pts = [], ok = [];
    for (let k = 0; k < NB; k++) {
      const a = k / NB * TAU, dx = Math.cos(a), dz = Math.sin(a); let lo = 0, hi = 200;
      for (let it = 0; it < 11; it++) { const r = (lo + hi) / 2; if (land.shore(ccx + dx * r, ccz + dz * r) > inland) lo = r; else hi = r; }
      pts.push([ccx + dx * lo, ccz + dz * lo]); ok.push(farFrom(ccx + dx * lo, ccz + dz * lo) >= far + margin);
    }
    let k0 = ok.indexOf(false); if (k0 < 0) return [];
    let best = [], cur = [];
    for (let j = 1; j <= NB; j++) { const k = (k0 + j) % NB; if (ok[k]) cur.push(pts[k]); else { if (cur.length > best.length) best = cur; cur = []; } }
    return best;
  };
  for (let margin = 4; margin <= 24; margin += 4) {
    const outer = run(9, margin), inner = run(26, margin);
    if (outer.length < 8 || inner.length < 8) continue;
    // one point every third bearing (some 5 m), the outer run one way and the inner run back
    const ctl = [];
    for (let i = 0; i < outer.length; i += 3) ctl.push(V3(outer[i][0], 0, outer[i][1]));
    for (let i = inner.length - 1; i >= 0; i -= 3) ctl.push(V3(inner[i][0], 0, inner[i][1]));
    const near = stems.filter((q) => ctl.some((c) => Math.hypot(c.x - q[0], c.z - q[1]) < 12 + q[2]));
    // the bare round, read every half metre
    const curve = new THREE.CatmullRomCurve3(ctl, true, 'centripetal'); curve.arcLengthDivisions = ctl.length * 12;
    let pts = [], len = curve.getLength(), n = Math.ceil(len / 0.5), stem = 1e9; const p = V3();
    for (let i = 0; i < n; i++) { curve.getPointAt(i / n, p); pts.push([p.x, p.z]); }
    // a closed line of points read again every half metre of its own length
    const reread = (P) => { const out = []; let L = 0; const seg = P.map((a, i) => { const b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); L += l; return l; });
      const m = Math.ceil(L / 0.5), st = L / m; let i = 0, acc = 0;
      for (let k = 0; k < m; k++) { const d = k * st; while (i < P.length - 1 && acc + seg[i] < d) { acc += seg[i]; i++; } const f = seg[i] > 1e-9 ? (d - acc) / seg[i] : 0, a = P[i], b = P[(i + 1) % P.length]; out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]); }
      return [out, L]; };
    // step the round off the stems: a point within a stem's bark and 0.9 m is set straight out to that distance (so
    // the round bends round the stem on the side it came by); the round is read again and stepped again until none moves
    for (let pass = 0; pass < 40; pass++) {
      let moved = 0;
      for (const c of pts) for (const q of near) { let dx = c[0] - q[0], dz = c[1] - q[1], d = Math.hypot(dx, dz); const need = q[2] + 0.9; if (d < need - 1e-4) { if (d < 1e-3) { dx = 1; dz = 0; d = 1; } c[0] = q[0] + dx / d * need; c[1] = q[1] + dz / d * need; moved++; } }
      [pts, len] = reread(pts);
      if (!moved) break;
    }
    n = pts.length; const tab = new Float32Array((n + 1) * 3);
    for (let i = 0; i <= n; i++) { const c = pts[i % n]; tab[i * 3] = c[0]; tab[i * 3 + 2] = c[1]; for (const q of near) stem = Math.min(stem, Math.hypot(c[0] - q[0], c[1] - q[1]) - q[2]); }
    if (stem < 0.6) continue;
    let least = 1e9;
    for (let i = 0; i <= n; i++) { const x = tab[i * 3], z = tab[i * 3 + 2]; tab[i * 3 + 1] = groundAt(x, z); least = Math.min(least, farFrom(x, z), laneDist(lane, x, tab[i * 3 + 1] + 1, z)); }
    if (least < far) continue;
    const step = len / n;
    const at = (s, out) => { const q = (((s % len) + len) % len) / step, i = Math.min(Math.floor(q), n - 1), f = q - i, a = i * 3, b = a + 3; return out.set(lerp(tab[a], tab[b], f), lerp(tab[a + 1], tab[b + 1], f), lerp(tab[a + 2], tab[b + 2], f)); };
    // THE PATH IS BARE: is the ground of an upright thing of radius r (its bark and 0.9 m) clear of the whole round?
    const clear = (x, z, r) => { const need = (r + 0.9) ** 2; for (let i = 0; i < n; i++) { const dx = tab[i * 3] - x, dz = tab[i * 3 + 2] - z; if (dx * dx + dz * dz < need) return false; } return true; };
    return { n, len, step, tab, least, stem, margin, at, clear };
  }
  return none;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const { noise } = ctx, detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = clamp(vary.density ?? 1, 0.7, 1.3);
  // every stream of the island, made from the world's seed and a name: none draws from another, and all are taken here
  const S = {};
  for (const name of ['land', 'forest', 'palms', 'grove', 'rocks', 'lagoonRock', 'figures', 'game', 'bubbles', 'nest', 'shower', 'brig', 'shafts', 'darts',
    'lights', 'eyes', 'smoke', 'files', 'hut', 'ferns', 'house', 'kite', 'bankRocks', 'spray', 'seven', 'splits', 'dartsFine', 'shaftsPlace'])
    S[name] = makeRng(hashSeed('isle-' + name + ':' + ctx.seed));
  const lay = islandLayout(ctx.seed);
  const object = new THREE.Group();
  const land = makeLand(noise, lay);
  const path = opts.path || makePath(routePoints());
  // the island's lane tests take the route from where it comes into the island's waters (south of z -250) to its end
  const lane = lanePoints(path, 2), laneFrom = laneStart(lane);
  const shade = opts.shade || makeShade();
  // the island stands in one state: the sun's height is set here once for the visit; whatever moves, moves on the world clock
  const updates = [], sunEl = sunHeight(opts.hourWish);
  // the dawn hour's wider gold: the soft edge of the shade lies 15 m further south-west
  if (opts.hourWish === 'dawn') shade.shift(15);

  // ---- the land: one adaptive mesh, fine near the route
  const terrain = await T.makeTerrainAsync({
    rng: S.land, noise, height: land.height, biome: 'tropical', bounds: [-330, -600, 120, -270], path, corridor: false,
    cell: 2.5, near: 34, levels: 4, maxTriangles: 76000, waterLevel: 0, heightRange: [0, 52], shadow: 0, ao: 0.5,
    palette: { ramp: [[0, '#d9c9a0'], [0.035, '#b8ad7c'], [0.07, '#4f6b3a'], [0.5, '#3f5e34'], [0.85, '#5c6e44'], [1, '#8a8a6a']], shore: '#e2d4ac', bed: '#3f8f86', rock: '#7d776c', rockB: '#5e5a54', clouds: 0 },
  }, ctx.yield);
  shade.patch(terrain.material);
  object.add(terrain.object);
  const groundAt = (x, z) => terrain.surfaceAt(x, z);
  // handles of everything a stream deals here, for the check that builds the world on many seeds (no cost: names only)
  const dealt = { land, lane, groundAt };
  // the files' round is laid first, on the bare land (see fileRound and the files below): the wood and the palms that
  // follow leave it bare
  await ctx.yield();
  const round = fileRound(land, lane, [[PLACES.hut[0], PLACES.hut[1], 3.6]], groundAt);
  await ctx.yield();
  await ctx.yield();

  // ---- the forest: one wind and one leaf atlas for every plant of the island
  const wind = flora.makeWind({ direction: [0.5, 0.86], strength: 0.9, speed: 1 });
  const matOpts = { wind, backlight: 1.5, backlightTint: '#ffe08a', wrap: 0.9, ambient: 2.0, leafAmbient: 1.9, sheen: 0.4, detailScale: 2.4, detail: 0.25 };
  await flora.prepareLeafTexture(matOpts, ctx.yield);
  const leafMat = shade.patch(flora.windMaterial(matOpts), true);
  await ctx.yield();
  const LEAF = { leaf: '#2f6b3a', leafLight: '#5f9a48', leafDark: '#1f4a34', bark: '#4c4034', barkDark: '#2e2620' };
  const GREAT = { leaf: '#2a5f3c', leafLight: '#4f8a4a', leafDark: '#1f4a34', bark: '#44372c', barkDark: '#2a211c', barkLight: '#5a4a3a' };
  // variants: 0 a near broadleaf, 1 to 3 far broadleaves, 4 to 6 great trees of the grove's wood, 7 and 8 the seven trunks (8 is the giant)
  const treeGeos = [];
  treeGeos.push(flora.oakGeometry({ rng: S.forest, height: 13, detail: 1, fullness: 1.15, ...LEAF })); await ctx.yield();
  treeGeos.push(flora.oakGeometry({ rng: S.forest, height: 12, detail: 0, fullness: 1.2, ...LEAF })); await ctx.yield();
  treeGeos.push(flora.oakGeometry({ rng: S.forest, height: 14, detail: 0, fullness: 1.1, ...LEAF, leaf: '#356f34', leafLight: '#6aa04a' })); await ctx.yield();
  treeGeos.push(flora.oakGeometry({ rng: S.forest, height: 13, detail: 0, fullness: 1.3, ...LEAF, leaf: '#2a6440', leafLight: '#55904a' })); await ctx.yield();
  // a great tree is a broadleaf grown large with every leaf below its canopy's base taken off: bare trunk and boughs up to there
  const lifted = (g, base) => {
    const pos = g.attributes.position, w = g.attributes.wind, idx = g.index.array, keep = [];
    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i], b = idx[i + 1], c = idx[i + 2];
      const leaf = w.getZ(a) >= 0.5 || w.getZ(b) >= 0.5 || w.getZ(c) >= 0.5, low = Math.min(pos.getY(a), pos.getY(b), pos.getY(c)) < base;
      if (!(leaf && low)) keep.push(a, b, c);
    }
    g.setIndex(keep); g.userData.triangles = keep.length / 3;
    return g;
  };
  for (const h of [12, 13, 14]) treeGeos.push(lifted(flora.oakGeometry({ rng: S.grove, height: h, detail: 1, fullness: 1.25, ...GREAT }), h * 0.3));
  await ctx.yield();
  for (const h of [13, 14.5]) { treeGeos.push(lifted(flora.oakGeometry({ rng: S.grove, height: h, detail: 2, fullness: 1.05, ...GREAT }), h * 0.56)); await ctx.yield(); }
  // The seven trunks keep the kit tree's boughs and crown; their stems are built here (see the grove): so each kit stem
  // is measured (where the middle of its wood lies at two heights) and then taken off below a fifth of the tree's height.
  const stemAxes = [13, 14.5].map((h, k) => {
    const g = treeGeos[7 + k], pos = g.attributes.position, w = g.attributes.wind, idx = g.index.array, keep = [];
    const middle = (y0, y1) => { let x = 0, z = 0, n = 0; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (w.getZ(i) >= 0.5 || y < y0 || y > y1) continue; x += pos.getX(i); z += pos.getZ(i); n++; } return n ? [x / n, z / n] : [0, 0]; };
    const axis = { h, a: middle(0.1 * h, 0.22 * h), b: middle(0.22 * h, 0.3 * h) };
    for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2]; if (!(w.getZ(a) < 0.5 && w.getZ(b) < 0.5 && w.getZ(c) < 0.5 && Math.max(pos.getY(a), pos.getY(b), pos.getY(c)) < 0.2 * h)) keep.push(a, b, c); }
    g.setIndex(keep); g.userData.triangles = keep.length / 3;
    return axis;
  });
  const [gx, gz, gr] = PLACES.ring;
  // the route's span through the leaves: from where it has risen 12 m over the grove's floor to its highest point above the tree tops
  const well = wellSpan(lane, laneFrom, lay.dell);
  shade.setWell(well.pts[0], well.pts[1], well.pts[2], well.r);
  // the gold lights gathered in the well of leaves light the leaves about them: one gold lamp (the shade's fourth small
  // lamp, reach 26 m, wavering a little on the clock) at the middle of those lights' own rounds, its strength by how
  // many are gathered there (0.45 a light). The world sets it when the lights' rounds are built (wellGlow, below).
  let wellGlowK = 0;
  updates.push((dt, time) => { const k = wellGlowK * (0.9 + 0.1 * Math.sin(time * 2.3) * Math.sin(time * 1.1 + 2)); shade.lampColor(3, 1.0 * k, 0.72 * k, 0.28 * k); });
  // an upright thing is stepped straight away from the route until its bark stands `need` metres from the line
  const pushClear = (x, z, y0, y1, need) => {
    for (let k = 0; k < 4; k++) {
      let best = 1e18, bx = 0, bz = 0;
      for (let i = laneFrom; i < lane.length / 3; i++) {
        const sy = lane[i * 3 + 1]; if (sy < y0 - 3 || sy > y1 + 3) continue;
        const dx = x - lane[i * 3], dz = z - lane[i * 3 + 2], d = dx * dx + dz * dz; if (d < best) { best = d; bx = dx; bz = dz; }
      }
      const d = Math.sqrt(best); if (d >= need || d < 1e-3) break;
      x += bx / d * (need - d + 0.05); z += bz / d * (need - d + 0.05);
    }
    return [x, z];
  };
  // a crown may not hang in the lane, except inside the well, where the leaves are parted
  const crownClear = (x, y, z, hgt, crownR, base) => {
    for (let i = laneFrom; i < lane.length / 3; i++) {
      if (i >= well.a && i <= well.b) continue;
      const sy = lane[i * 3 + 1]; if (sy < y + hgt * base - 3 || sy > y + hgt + 4) continue;
      if (Math.hypot(lane[i * 3] - x, lane[i * 3 + 2] - z) < crownR + 4) return false;
    }
    return true;
  };
  // crowns: the tops of the great trees ([x, top, z]): the seven, and the great wood round them
  const trees = [], trunks = [], seven = [], crowns = [];
  // the seven trunks first: their nominal places, a metre of play each, the giant by the seed
  PLACES.trunks.forEach((t, i) => {
    const giant = i === lay.giant, sc = giant ? 2.62 : S.grove.range(2.3, 2.6), hgt = (giant ? 14.5 : 13) * sc, thick = 1.14 * sc * (giant ? 1.12 : 1);
    const [x, z] = pushClear(t[0] + S.grove.range(-1, 1), t[1] + S.grove.range(-1, 1), lay.dell, lay.dell + 20, 7 + thick * 0.5);
    const y = land.height(x, z) - 1.2, rot = S.grove() * TAU;
    seven.push({ x, y, z, s: sc, rot, d: 0, u: 0, v: giant ? 1 : 0 });
    trunks.push({ x, y, z, rot, s: sc, r: thick * 0.5, h: hgt, giant }); crowns.push([x, y + hgt * 0.88, z]);
  });
  // the tree that carries the red house: a great tree whose crown stands round the house's place
  const [rhx, rhy, rhz] = PLACES.redHouse;
  const houseTree = (() => { const [x, z] = pushClear(rhx - 2.2, rhz + 2.6, lay.dell, rhy, 8.5), y = land.height(x, z) - 0.4, sc = (rhy + 5 - y) / 13; trees.push({ x, y, z, s: sc, rot: S.house() * TAU, d: 0, u: 0, v: 5 }); return { x, y, z, h: 13 * sc }; })();
  // the mushroom in the ring: stepped off the route until it stands 6.5 m clear
  const mush = (() => { const [x, z] = pushClear(PLACES.mushroom[0], PLACES.mushroom[1], lay.dell - 1, lay.dell + 8, 6.5); return { x, y: land.height(x, z), z }; })();
  {
    const step = 9.3 / Math.sqrt(dens), row = step * 0.866;
    let k = 0;
    for (let z = -590; z < -280; z += row, k++) { if (k % 5 === 4) await ctx.yield(); for (let x = -320 + (k % 2) * step * 0.5; x < 110; x += step) {
      const jx = x + S.forest.range(-0.35, 0.35) * step, jz = z + S.forest.range(-0.35, 0.35) * step, r1 = S.forest(), r2 = S.forest(), r3 = S.forest();
      const s = land.shore(jx, jz);
      if (s < 5 + 9 * (1 - land.cliffy(jx, jz))) continue;
      const y = land.height(jx, jz);
      // more than 52 m from the route the wood is drawn with half as many trees, each half as large again
      const farWood = laneDist(lane, jx, y + 8, jz, laneFrom) > 52;
      if (farWood && r2 < 0.5) continue;
      if (y > 41 + 6 * r1) continue;
      const dg = Math.hypot(jx - gx, jz - gz);
      if (dg < gr + 7) continue;
      // within 60 m of the ring the wood is of great trees; on the creek's banks the trees are lower. Where a great
      // tree's crown would hang in the lane a common tree is tried in its place.
      const bank = smoothstep(30, 10, land.creekEdge(jx, jz));
      if (trunks.some((t) => Math.hypot(t.x - jx, t.z - jz) < 11) || Math.hypot(houseTree.x - jx, houseTree.z - jz) < 9 || Math.hypot(mush.x - jx, mush.z - jz) < 6) continue;
      for (const great of dg < 62 - 14 * r3 ? [true, false] : [false]) {
        const scale = great ? lerp(2.0, 2.6, r1) : lerp(1.05, 1.5, r1) * lerp(1, 0.82, bank) * (farWood ? 1.5 : 1);
        const v = great ? 4 + Math.floor(r3 * 3) : 0, hgt = (great ? 12 + (v - 4) : 13) * scale, crownR = 0.5 * hgt;
        if (laneDistUpright(lane, jx, jz, y, y + hgt * 0.5, laneFrom) < 6 + 0.045 * hgt) continue;
        if (!crownClear(jx, y, jz, hgt, crownR, 0.3)) continue;
        if (!round.clear(jx, jz, 1.2 * scale)) continue;
        const near = laneDist(lane, jx, y + hgt * 0.5, jz, laneFrom) < 30;
        trees.push({ x: jx, y: y - 0.3, z: jz, s: scale, rot: r2 * TAU, d: 0, u: 0, v: great ? v : near ? 0 : 1 + Math.floor(r3 * 3) });
        if (great) crowns.push([jx, y + hgt * 0.88, jz]);
        break;
      }
    } }
  }
  await ctx.yield();
  const forest = flora.makeScatter({ rng: S.forest, points: trees, variants: treeGeos.slice(0, 7), material: leafMat, tint: 0.2, hue: 0.05 });
  // the seven stand upright and unstretched, each exactly where its own stem is built
  const sevenWood = flora.makeScatter({ rng: S.seven, points: seven, variants: treeGeos.slice(7), material: leafMat, tint: 0.2, hue: 0.05, tilt: 0, stretch: 0, sink: 0 });
  object.add(forest.object, sevenWood.object);
  updates.push((dt, time, camera) => { forest.update(dt, time, camera); sevenWood.update(dt, time, camera); });
  await ctx.yield();

  // ---- palms: along the cliff tops and the beach's rim, leaning out over the water, and one on each headland of the creek's mouth
  const palmGeos = [flora.palmGeometry({ rng: S.palms, height: 12, detail: 1, curve: 0.7, leaf: '#3f7a2e', leafLight: '#7fae4a', leafDark: '#1c4a2a' }),
    flora.palmGeometry({ rng: S.palms, height: 10, detail: 1, curve: 0.35, leaf: '#46802c', leafLight: '#86b24c', leafDark: '#1c4a2a' }),
    flora.palmGeometry({ rng: S.palms, height: 11, detail: 0, curve: 0.6, leaf: '#3f7a2e', leafLight: '#7fae4a', leafDark: '#1c4a2a' })];
  const palms = [];
  {
    // walk the shore in steps of bearing round the island's middle and of metres along the arm; a palm stands 3 to 9 m inland of the waterline
    const tryPalm = (x, z, lean) => {
      const s = land.shore(x, z); if (s < 2.5 || s > 11) return;
      const y = land.height(x, z), sc = S.palms.range(0.85, 1.35), hgt = 12 * sc;
      if (laneDistUpright(lane, x, z, y, y + hgt, laneFrom) < 6 + 0.5 * hgt * 0.45) return;
      if (trees.some((t) => t.v >= 4 && Math.hypot(t.x - x, t.z - z) < 6)) return;
      if (!round.clear(x, z, 0.45 * sc)) return;
      const far = laneDist(lane, x, y + hgt * 0.6, z, laneFrom) > 34;
      const v = far ? 2 : S.palms.chance(0.6) ? 0 : 1;
      palms.push({ x, y: y - 0.3, z, s: sc, rot: lean, d: 0, u: 0, v });
    };
    const [cx, cz] = PLACES.centre, [ax, az] = PLACES.half;
    await ctx.yield();
    for (let a = 0; a < TAU; a += 0.045) {
      const ca = Math.cos(a), sa = Math.sin(a), r = S.palms.range(0.86, 0.99), on = S.palms.chance(0.8), lean = Math.atan2(ca, sa) + S.palms.range(-0.5, 0.5);
      if (on) tryPalm(cx + ca * ax * r, cz + sa * az * r, lean);
    }
    for (let m = 20; m < PLACES.creekLen + 6; m += 6.5) for (const side of [-1, 1]) {
      const off = side * (land.creekHalf(m) + S.palms.range(14, 23)), on = S.palms.chance(m > PLACES.creekLen - 14 ? 1 : 0.45);
      const x = PLACES.creekHead[0] + PLACES.creekDir[0] * m - PLACES.creekDir[1] * off, z = PLACES.creekHead[1] + PLACES.creekDir[1] * m + PLACES.creekDir[0] * off;
      if (on) tryPalm(x, z, S.palms() * TAU);
    }
  }
  await ctx.yield();
  const palmWood = flora.makeScatter({ rng: S.palms, points: palms, variants: palmGeos, material: leafMat, tint: 0.15, hue: 0.04, tilt: 0.16 });
  object.add(palmWood.object);
  await ctx.yield();

  // ---- rocks: boulders at the foot of the cliffs and awash on the reef, coral heads in the shallows inside it
  const rockMat = shade.patch(T.makeRockMaterial({ terrain, top: null, strata: 0.3 }));
  await ctx.yield();
  const rockGeos = [T.rockGeometry({ rng: S.rocks, kind: 'boulder', radius: 1, detail: 2, color: '#6e675c', colorB: '#4a463f' }), T.rockGeometry({ rng: S.rocks, kind: 'rock', radius: 1, detail: 2, color: '#5c564e', colorB: '#3a3632' })];
  await ctx.yield();
  const rockItems = [[], []];
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const put = (x, y, z, sx, sy, sz, k, R = S.rocks) => { e.set(R.range(-0.3, 0.3), R() * TAU, R.range(-0.3, 0.3)); q.setFromEuler(e); rockItems[k].push(m4.compose(V3(x, y, z), q, V3(sx, sy, sz)).clone()); };
    for (let i = 0; i < 520; i++) {
      if (i % 130 === 129) await ctx.yield();
      const x = S.rocks.range(-320, 110), z = S.rocks.range(-590, -285), r = S.rocks.range(0.7, 2.6), k = S.rocks.chance(0.5) ? 0 : 1, sq = S.rocks.range(0.5, 0.9);
      const s = land.shore(x, z), c = land.cliffy(x, z);
      const foot = s > -5 && s < 3 && c > 0.5, reefTop = land.reefDist(x, z) < 5 && s < -20;
      if (!foot && !reefTop) continue;
      if (laneDist(lane, x, 1, z, laneFrom) < 6 + r) continue;
      put(x, Math.max(land.height(x, z), -1) + r * (reefTop ? -0.25 : 0.2), z, r * (reefTop ? 1.6 : 1), r * sq * (reefTop ? 0.6 : 1), r * (reefTop ? 1.4 : 1), k);
    }
    // the creek's banks have fallen stones at their feet: one every 4 to 8 m of each bank, in the water's edge, from the
    // creek's head to 12 m outside its mouth (their own stream)
    {
      const R = S.bankRocks, [chx, chz] = PLACES.creekHead, [cdx, cdz] = PLACES.creekDir;
      for (const side of [-1, 1]) for (let a = 3 + R.range(0, 4); a < PLACES.creekLen + 12; a += R.range(4, 8)) {
        const r = R.range(0.7, 2.1), sq = R.range(0.5, 0.85), k = R.chance(0.5) ? 0 : 1, inset = R.range(-0.4, 1.6);
        const half = land.creekHalf(a) + land.creekWander(a, side * 10) - inset, x = chx + cdx * a - cdz * side * half, z = chz + cdz * a + cdx * side * half;
        // none in the lane, and none within 1.5 m of the brig's hull (19 m either way along her, 4 m to her side)
        const [ba, bp] = land.creekFrame(PLACES.brig[0], PLACES.brig[1]), lean = R.range(0.8, 1.3);
        if (laneDist(lane, x, 1, z, laneFrom) < 6 + r || (Math.abs(a - ba) < 19 + r && Math.abs(side * half - bp) < 5.5 + r)) continue;
        put(x, -0.25 + r * sq * 0.3, z, r, r * sq, r * lean, k, R);
      }
    }
  }
  rockItems.forEach((list, k) => {
    const mesh = new THREE.InstancedMesh(rockGeos[k], rockMat, list.length);
    list.forEach((m, i) => mesh.setMatrixAt(i, m)); mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); object.add(mesh);
  });
  await ctx.yield();


  // ---- the surf on the reef: white water along the whole crest, 14 m across (10 m to seaward of the crest, 4 m inside
  // it). Breakers run in from the sea, one every five to seven seconds on each stretch of reef, and leave lace behind;
  // the crest itself is always awash. All of it is the clock's; its colour is set once from the sun's height.
  const surfU = { uTime: { value: 0 }, uCol: { value: new THREE.Color('#fff0d8') }, uLen: { value: 1 } };
  {
    // the crest's line at steps of 3 m, its corners rounded, and the way out to sea at each step
    const raw = [], reef = PLACES.reef, [ccx, ccz] = PLACES.centre;
    for (let i = 0; i < reef.length - 1; i++) { const len = Math.hypot(reef[i + 1][0] - reef[i][0], reef[i + 1][1] - reef[i][1]), n = Math.round(len / 3); for (let k = 0; k < n; k++) raw.push([lerp(reef[i][0], reef[i + 1][0], k / n), lerp(reef[i][1], reef[i + 1][1], k / n)]); }
    raw.push(reef[reef.length - 1]);
    const pts = raw.map((q, i) => { let x = 0, z = 0, w = 0; for (let k = -4; k <= 4; k++) { const j = clamp(i + k, 0, raw.length - 1), wk = 5 - Math.abs(k); x += raw[j][0] * wk; z += raw[j][1] * wk; w += wk; } return [x / w, z / w]; });
    const pos = [], uv = [], idx = []; let along = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, pts.length - 1)], tx = b[0] - a[0], tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
      let nx = tz / tl, nz = -tx / tl; if (nx * (pts[i][0] - ccx) + nz * (pts[i][1] - ccz) < 0) { nx = -nx; nz = -nz; }
      if (i) along += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      // three across: the seaward edge, the middle, the lagoon edge; the edges lie in the water, the middle just over it
      [[10, 0.05, 0], [3, 0.42, 0.5], [-4, 0.1, 1]].forEach(([off, y, v]) => { pos.push(pts[i][0] + nx * off, y, pts[i][1] + nz * off); uv.push(along, v); });
      if (i < pts.length - 1) { const k = i * 3; idx.push(k, k + 3, k + 1, k + 1, k + 3, k + 4, k + 1, k + 4, k + 2, k + 2, k + 4, k + 5); }
    }
    surfU.uLen.value = along;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const surf = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: surfU, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uLen; uniform vec3 uCol; varying vec2 vUv;
        float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h2(i), h2(i + vec2(1., 0.)), f.x), mix(h2(i + vec2(0., 1.)), h2(i + vec2(1., 1.)), f.x), f.y); }
        void main(){
          float s = vUv.x, v = clamp(vUv.y, 0., 1.), y = v * 14.;
          float beat = vn(vec2(s * .05, 1.7)) * 3. + vn(vec2(s * .013, 8.1)) * 5., t = uTime * .17 + beat, f = fract(t);
          float front = 1. + 8.5 * f + 1.4 * (vn(vec2(s * .35, floor(t) * 7.3)) - .5), d = y - front;
          float lace = smoothstep(.42, .68, vn(vec2(s * .9, y * .9 - uTime * .25)) * .6 + vn(vec2(s * 2.3 + 5., y * 2.1 + uTime * .1)) * .4);
          float line = exp(-clamp(d * d, 0., 30.) * 1.6) * (1. - .5 * f);
          float behind = smoothstep(0., -.6, d) * exp(clamp(d, -20., 0.) * .45) * (1. - .3 * f);
          float wash = exp(-clamp((y - 9.6) * (y - 9.6), 0., 30.) * .2) * (.35 + .65 * lace);
          float a = clamp(line + behind * (.3 + .7 * lace) + wash * .75, 0., 1.);
          a *= smoothstep(0., .12, v) * smoothstep(1., .8, v) * smoothstep(0., 14., s) * smoothstep(uLen, uLen - 14., s);
          gl_FragColor = vec4(uCol * (.78 + .22 * lace), a * .92);
        }` }));
    surf.renderOrder = 2; object.add(surf);
    surfU.uCol.value.set('#9a9ccc').lerp(new THREE.Color('#ffe2b4'), smoothstep(-3, 5, sunEl));
    updates.push((dt, time) => { surfU.uTime.value = time; });
  }
  await ctx.yield();

  const night = opts.hourWish === 'night', plainMat = shade.patch(new THREE.MeshLambertMaterial({ vertexColors: true }));

  // ---- the lagoon's rock: black, long and low, one of three outlines by the seed. THE TIDE STANDS: the rock's top is
  // 3.2 m clear of the water (0.6 m on a visit at the night hour) and only the swell works on it.
  const [rkx, rkz] = PLACES.rock, tide = night ? 2.6 : 0;
  const rock = new THREE.Group(); rock.position.set(rkx, -tide, rkz); rock.rotation.y = 0.39 + S.lagoonRock.range(-0.3, 0.3); object.add(rock);
  {
    const shapes = [[[0, 0, 10, 4.2, 4.5, 0]], [[-3.5, 0, 6.5, 4.3, 4.5, 0.15], [5.5, 0.6, 4.6, 3.2, 3.6, -0.3]], [[-2, 0, 8, 4.4, 4.2, 0.1], [6, -0.5, 4.5, 2.6, 4.4, 0.4]]][lay.rockShape];
    const darkGeo = T.rockGeometry({ rng: S.lagoonRock, kind: 'rock', radius: 1, detail: 3, color: '#2c2a2a', colorB: '#17161c' });
    const body = new THREE.InstancedMesh(darkGeo, rockMat, shapes.length);
    shapes.forEach((q, i) => body.setMatrixAt(i, mat(q[0], 3.2 - 0.92 * q[3] + (i ? -0.5 : 0), q[1], q[5], 0, 0, q[2], q[3], q[4])));
    body.instanceMatrix.needsUpdate = true; body.computeBoundingSphere(); rock.add(body);
    rock.updateMatrixWorld(true);
    await ctx.yield();
    // six seats along the crest, found on the rock's own top. A SEAT IS ROCK: SEAT_UP (0.4 m) and more of
    // it over the water under the sitter. A seat is drawn along the crest and across it; it begins on the crest's
    // middle line or on the far side of it (never on the side toward the flight's line) and is stepped toward the far
    // side while it stands nearer than 28 m to the line, as far as the rock still carries a seat (and no further
    // than 3.4 m across the crest); a place dealt where the rock has none (its ends, a gap) is stepped along the
    // crest toward its middle until it has; one that finds none, or that would sit within 0.9 m of an earlier seat,
    // is no seat and nobody sits there, like one under the tide. The rock itself stands 24 m from the line and its
    // west end nearer, so by geometry the seats lie 22 to 27 m from it (the report gives the figure on forty seeds).
    const seats = [], cs = Math.cos(rock.rotation.y), sn = Math.sin(rock.rotation.y), SEAT_UP = 0.4;
    // the rock's top as a table of heights every quarter metre (a along the crest, b across it), from its own
    // triangles as they stand in the world; -9 where there is no rock
    const rockAt = (() => {
      const A0 = -12, B0 = -6.5, ST = 0.25, NA = 97, NC = 53, top = new Float32Array(NA * NC).fill(-9), pos = darkGeo.attributes.position, idx = darkGeo.index, m = new THREE.Matrix4(), v = V3(), q = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < shapes.length; i++) { body.getMatrixAt(i, m); m.premultiply(rock.matrixWorld);
        for (let t = 0, nt = (idx ? idx.count : pos.count) / 3; t < nt; t++) {
          for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, idx ? idx.getX(t * 3 + k) : t * 3 + k).applyMatrix4(m); const dx = v.x - rkx, dz = v.z - rkz; q[k * 3] = dx * cs - dz * sn; q[k * 3 + 1] = dx * sn + dz * cs; q[k * 3 + 2] = v.y; }
          const den = (q[4] - q[7]) * (q[0] - q[6]) + (q[6] - q[3]) * (q[1] - q[7]); if (Math.abs(den) < 1e-9) continue;
          const i0 = Math.max(0, Math.ceil((Math.min(q[0], q[3], q[6]) - A0) / ST)), i1 = Math.min(NA - 1, Math.floor((Math.max(q[0], q[3], q[6]) - A0) / ST)), j0 = Math.max(0, Math.ceil((Math.min(q[1], q[4], q[7]) - B0) / ST)), j1 = Math.min(NC - 1, Math.floor((Math.max(q[1], q[4], q[7]) - B0) / ST));
          for (let ia = i0; ia <= i1; ia++) for (let ib = j0; ib <= j1; ib++) { const a = A0 + ia * ST, b = B0 + ib * ST, w0 = ((q[4] - q[7]) * (a - q[6]) + (q[6] - q[3]) * (b - q[7])) / den, w1 = ((q[7] - q[1]) * (a - q[6]) + (q[0] - q[6]) * (b - q[7])) / den, w2 = 1 - w0 - w1;
            if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue; const y = w0 * q[2] + w1 * q[5] + w2 * q[8], c = ia * NC + ib; if (y > top[c]) top[c] = y; }
        } }
      // between four heights of the table; no seat where any of the four has no rock or where they differ by more
      // than 0.35 m (a ledge between two lumps, a flank too steep to sit on)
      return (a, b) => { const fa = (a - A0) / ST, fb = (b - B0) / ST, ia = Math.floor(fa), ib = Math.floor(fb); if (ia < 0 || ia >= NA - 1 || ib < 0 || ib >= NC - 1) return -9;
        const c = ia * NC + ib, h00 = top[c], h01 = top[c + 1], h10 = top[c + NC], h11 = top[c + NC + 1]; if (Math.min(h00, h01, h10, h11) < -8 || Math.max(h00, h01, h10, h11) - Math.min(h00, h01, h10, h11) > 0.35) return -9;
        const ta = fa - ia, tb = fb - ib; return lerp(lerp(h00, h01, tb), lerp(h10, h11, tb), ta); };
    })();
    await ctx.yield();
    const farSide = laneDist(lane, rkx + 3 * sn, 3, rkz + 3 * cs, laneFrom) > laneDist(lane, rkx - 3 * sn, 3, rkz - 3 * cs, laneFrom) ? 1 : -1;
    for (let j = 0; j < 6; j++) {
      let a = lerp(-7.5, 7.5, (j + S.figures.range(0.2, 0.8)) / 6), b = Math.max(S.figures.range(-1.6, 1.6) * farSide, 0) * farSide, y = rockAt(a, b);
      for (let k = 0; k < 12 && y < SEAT_UP; k++) { a *= 0.9; y = rockAt(a, b); }
      while (y >= SEAT_UP && b * farSide < 3.4 && laneDist(lane, rkx + a * cs + b * sn, 3, rkz - a * sn + b * cs, laneFrom) < 28) { const y2 = rockAt(a, b + 0.2 * farSide); if (y2 < SEAT_UP) break; b += 0.2 * farSide; y = y2; }
      const x = rkx + a * cs + b * sn, z = rkz - a * sn + b * cs;
      if (seats.some((o) => o.y >= SEAT_UP && Math.hypot(o.x - x, o.z - z) < 0.9)) y = -1;
      // a seat faces out over the nearer long side; that is the side its sitter slides off and hauls out by
      seats.push({ x, y: y >= SEAT_UP ? y : -1, z, face: rock.rotation.y + (b > 0 ? 0 : Math.PI) + S.figures.range(-0.5, 0.5), tall: S.figures.range(1.5, 1.85), comb: S.figures() * TAU });
    }
    await ctx.yield();
    // a sitter: small, far and plain, dark against the light (trunk, head, long hair, a tail lying down the rock's side)
    const M = makeMesher(), skin = '#6a5246';
    M.add(new THREE.CapsuleGeometry(0.17, 0.42, 3, 8), mat(0, 0.5, 0, 0, -0.12), skin);
    M.add(new THREE.SphereGeometry(0.13, 8, 6), mat(0, 0.98, 0.03), skin);
    M.add(new THREE.SphereGeometry(0.15, 8, 6), mat(0, 1.0, -0.03, 0, 0, 0, 1, 1.05, 1), '#1e1614');
    M.add(new THREE.ConeGeometry(0.16, 0.7, 7), mat(0, 0.68, -0.14, 0, 0.16, Math.PI), '#1e1614');
    M.add(new THREE.CylinderGeometry(0.19, 0.17, 0.6, 8), mat(0, 0.2, 0.26, 0, Math.PI / 2 - 0.1), '#2a6a64');
    M.add(new THREE.CylinderGeometry(0.17, 0.1, 0.6, 8), mat(0, 0.02, 0.78, 0, Math.PI / 2 + 0.5), '#235e5a');
    M.add(new THREE.CylinderGeometry(0.1, 0.045, 0.5, 6), mat(0, -0.36, 1.18, 0, Math.PI / 2 + 1.0), '#1f5654');
    for (const sd of [-1, 1]) M.add(new THREE.ConeGeometry(0.13, 0.42, 5), mat(sd * 0.14, -0.62, 1.38, 0, Math.PI / 2 + 0.9, sd * 0.7, 1, 1, 0.3), '#2f7a72');
    const sitters = new THREE.InstancedMesh(M.build(), plainMat, 6); sitters.frustumCulled = false; object.add(sitters);
    Object.assign(dealt, { seats, sitters, rockBody: body });
    // THEIR HABIT, on the world clock, whoever passes: each sits combing, slides off her own side, is gone a while and
    // hauls out on her own seat again. One round of 42 s for all; each is seated two thirds of it; the six phases lie
    // evenly round it in an order dealt by the seed, so three to five sit at any moment. A seat the standing tide
    // covers (the night hour) is not sat on.
    const ROUND = 42, order = S.figures.shuffle([0, 1, 2, 3, 4, 5]), phase0 = S.figures();
    updates.push((dt, time) => {
      seats.forEach((st, j) => {
        const p = (((time / ROUND + phase0 + order[j] / 6) % 1) + 1) % 1;
        // k: 0 seated, 1 under water; off over 3.4 s, gone 9 s, out again over 3.4 s
        const k = st.y < 0.15 ? 1 : smoothstep(0.585, 0.666, p) * (1 - smoothstep(0.88, 0.96, p));
        const out = k * k * 3.4, drop = smoothstep(0.25, 1, k) * (st.y + 2.6), sway = (1 - k) * 0.07 * Math.sin(time * 1.9 + st.comb);
        sitters.setMatrixAt(j, mat(st.x + Math.sin(st.face) * out, st.y - drop, st.z + Math.cos(st.face) * out, st.face + sway, k * 1.3, sway, st.tall));
      });
      sitters.instanceMatrix.needsUpdate = true;
    });
  }

  await ctx.yield();
  // ---- the nest afloat with its white bird, riding the lagoon's small swell
  {
    const [nx, nz] = PLACES.nest, M = makeMesher();
    M.add(new THREE.TorusGeometry(0.95, 0.3, 6, 14), mat(0, 0.2, 0, 0, Math.PI / 2), '#6a5238');
    M.add(new THREE.CylinderGeometry(0.95, 0.8, 0.2, 12), mat(0, 0.05, 0), '#57432e');
    M.add(new THREE.SphereGeometry(0.5, 10, 8), mat(0, 0.55, 0, 0, 0, 0, 0.8, 0.62, 1.15), '#f4f1ea');
    M.add(new THREE.CylinderGeometry(0.09, 0.13, 0.5, 6), mat(0, 0.95, 0.42, 0, 0.35), '#f4f1ea');
    M.add(new THREE.SphereGeometry(0.14, 8, 6), mat(0, 1.22, 0.52), '#f4f1ea');
    M.add(new THREE.ConeGeometry(0.05, 0.22, 5), mat(0, 1.2, 0.72, 0, Math.PI / 2), '#d9a03a');
    M.add(new THREE.ConeGeometry(0.3, 0.7, 5), mat(0, 0.62, -0.62, 0, -Math.PI / 2 - 0.2, 0, 1, 1, 0.35), '#e6e2d8');
    const nest = new THREE.Mesh(M.build(), plainMat); nest.position.set(nx, 0.2, nz); nest.rotation.y = S.nest() * TAU; object.add(nest);
    const ph = S.nest() * TAU;
    updates.push((dt, time) => { nest.position.y = 0.22 + 0.16 * Math.sin(time * 0.9 + ph); nest.rotation.z = 0.06 * Math.sin(time * 0.7 + ph); nest.rotation.x = 0.05 * Math.sin(time * 1.1 + ph * 2); });
  }
  await ctx.yield();


  // ---- the bow over the lagoon: a half circle of radius 21 m standing in the water on its two feet, its plane square to
  // the low sun. It stands always, at one strength (half of it at the night hour's deep red sun). It is light in falling
  // rain, so for ANY eye: it shows only from the sun's side of its plane (thinning in the last 6 m before the plane, gone
  // behind it), and never edge-on: nothing where the line of sight lies within 20 degrees of its plane, all of it beyond 40.
  const bowC = V3((PLACES.bowWest[0] + PLACES.bowEast[0]) / 2, 0, (PLACES.bowWest[1] + PLACES.bowEast[1]) / 2);
  const bowA = V3(PLACES.bowEast[0] - PLACES.bowWest[0], 0, PLACES.bowEast[1] - PLACES.bowWest[1]).normalize();
  const bowN = V3(Math.sin(PLACES.sunAz * DEG), 0, -Math.cos(PLACES.sunAz * DEG));
  const bowU = { uC: { value: bowC }, uN: { value: bowN }, uK: { value: night ? 0.5 : 1 }, uDeep: { value: night ? 1 : 0 }, uTime: { value: 0 } };
  {
    const arc = (R, half, flip) => {
      const pos = [], uv = [], idx = [], N = 72;
      for (let i = 0; i <= N; i++) {
        const th = Math.PI * i / N, c = Math.cos(th), sn = Math.sin(th);
        for (const e of [-1, 1]) { const r = R + e * half; pos.push(bowC.x - bowA.x * r * c, r * sn - 0.4, bowC.z - bowA.z * r * c); uv.push(i / N, flip ? (1 - e) / 2 : (e + 1) / 2); }
        if (i < N) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      return g;
    };
    const bowMat = (gain) => new THREE.ShaderMaterial({
      uniforms: { ...bowU, uGain: { value: gain } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uC, uN; uniform float uK, uDeep, uTime, uGain; varying vec2 vUv; varying vec3 vW;
        void main(){
          float t = clamp(vUv.y, 0., 1.);
          // the band's colours from the inner edge (violet) to the outer (red)
          vec3 c = clamp(vec3(smoothstep(.42, .8, t) + .55 * smoothstep(.3, .0, t), 1. - abs(t - .5) * 2.6, smoothstep(.62, .2, t)), 0., 1.);
          c = mix(c, c * vec3(1.25, .6, .55), uDeep);
          // a smooth hump across the band: nothing at either edge, most in the middle, no line anywhere
          float hump = sin(3.14159 * t); hump *= hump;
          // the rain is not even: the band breathes a little along its length
          float rain = .78 + .22 * sin(vUv.x * 23. + uTime * .7) * sin(vUv.x * 7.3 - uTime * .4);
          vec3 sight = vW - cameraPosition; float sl = max(length(sight), 1e-3);
          float side = smoothstep(0., 6., dot(cameraPosition - uC, uN)) * smoothstep(.342, .643, abs(dot(sight / sl, uN)));
          // each foot is lost in the spray that stands about it
          float foot = smoothstep(.3, 4.5, vW.y);
          gl_FragColor = vec4(c * hump * rain * side * foot * uK * uGain, 1.);
        }`,
    });
    const bow = new THREE.Mesh(arc(21, 1.25, false), bowMat(0.24)); bow.renderOrder = 6; bow.frustumCulled = false; object.add(bow);
    // on a showery visit a second, very faint bow stands outside the first with its colours turned round
    if (opts.mood === 'showery') { const outer = new THREE.Mesh(arc(26, 1.4, true), bowMat(0.05)); outer.renderOrder = 6; outer.frustumCulled = false; object.add(outer); }
    // the bow's colours lie faint on the water from foot to foot, 5 m wide, broken by the ripples
    const bandGeo = new THREE.PlaneGeometry(1, 1, 24, 1).rotateX(-Math.PI / 2), bandU = { ...bowU };
    const band = new THREE.Mesh(bandGeo, new THREE.ShaderMaterial({ uniforms: bandU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uK, uDeep, uTime; varying vec2 vUv;
        void main(){
          float t = clamp(vUv.y + .06 * sin(vUv.x * 60. + uTime * 2.3) + .04 * sin(vUv.x * 141. - uTime * 3.1), 0., 1.);
          vec3 c = clamp(vec3(smoothstep(.42, .8, t) + .55 * smoothstep(.3, .0, t), 1. - abs(t - .5) * 2.6, smoothstep(.62, .2, t)), 0., 1.);
          c = mix(c, c * vec3(1.25, .6, .55), uDeep);
          float edge = smoothstep(0., .3, t) * smoothstep(1., .7, t) * smoothstep(0., .08, vUv.x) * smoothstep(1., .92, vUv.x);
          float broken = .55 + .45 * sin(vUv.x * 210. + uTime * 4.) * sin(vUv.y * 9. - uTime * 1.7);
          gl_FragColor = vec4(c * edge * broken * uK * .16, 1.);
        }` }));
    band.scale.set(42, 1, 5); band.position.set(bowC.x, 0.55, bowC.z); band.rotation.y = Math.atan2(-bowA.z, bowA.x); band.renderOrder = 4; object.add(band);
    updates.push((dt, time) => { bowU.uTime.value = time; });
  }
  // the shower that makes it has a SOURCE and a FOOT: one small cloud over the bay's inner water, 8 to 38 m beyond the
  // bow's plane on the side away from the sun, its base 40 m up (the world file hangs the cloud there); the rain falls
  // from that base only, slanting 12 degrees down the wind, in fine strands; where it meets the water a skirt of mist
  // lies and rings open. The rock and the route's lane stay outside it.
  const SHOWER_BASE = 40, showerAt = V3(bowC.x - bowN.x * 23, 0, bowC.z - bowN.z * 23);
  const showerFar = opts.mood === 'showery' ? V3(bowC.x - bowN.x * 300, 110, bowC.z - bowN.z * 300) : null;
  await ctx.yield();
  {
    const deep = opts.mood === 'showery' ? 2 : opts.mood === 'clear' ? 0.6 : 1, slant = Math.tan(12 * DEG), wx = 0.5, wz = 0.86, lean = SHOWER_BASE * slant;
    const shower = fx.makeParticles({ rng: S.shower, preset: 'rain', follow: false, center: [showerAt.x + wx * lean * 0.5, SHOWER_BASE / 2, showerAt.z + wz * lean * 0.5], box: [46, SHOWER_BASE, 28],
      count: Math.round(1500 * deep * lerp(0.6, 1, detail)), velocity: [24 * slant * wx, -24, 24 * slant * wz], size: [0.03, 0.06], stretch: 0.05, colors: ['#ffe9b0', '#fff6e0', '#ffd27a'], intensity: 1.2, opacity: 0.4, near: NEAR });
    object.add(shower.object);
    // the same rain seen from far: three thin sheets of fine strands hung from the cloud's base, leaning with the rain
    const pos = [], uv = [], ph = [], idx = [];
    const sheet = (cx, cz, half, top, k) => {
      const b = pos.length / 3, sh = top * slant;
      for (const [a, y] of [[-half, 0], [half, 0], [half, top], [-half, top]]) { pos.push(cx + bowA.x * a + wx * sh * (1 - y / top), y, cz + bowA.z * a + wz * sh * (1 - y / top)); uv.push(a / (2 * half) + 0.5, y / top, half / 23); ph.push(k); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    for (let k = 0; k < 3; k++) { const off = 12 + k * 9 + S.shower.range(-1.5, 1.5); sheet(bowC.x - bowN.x * off, bowC.z - bowN.z * off, 23, SHOWER_BASE, k * 0.37); }
    // on a showery visit a second curtain hangs 300 m beyond the lagoon from a cloud of its own
    if (showerFar) sheet(showerFar.x, showerFar.z, 70, showerFar.y, 2.1);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 3)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1)); g.setIndex(idx);
    const veilU = { uTime: { value: 0 }, uCol: { value: new THREE.Color('#ffd9a0') }, uK: { value: 0.022 * deep } };
    const veil = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: veilU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`attribute float aPh; attribute vec3 aUv; varying vec3 vUv; varying float vPh; void main(){ vUv = aUv; vPh = aPh; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float uTime, uK; uniform vec3 uCol; varying vec3 vUv; varying float vPh;
        float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        float strands(vec2 p){ float i = floor(p.x), f = fract(p.x); float a = h1(i), b = h1(i + 1.); float col = mix(a, b, f * f * (3. - 2. * f));
          return col * col * (.6 + .4 * sin(p.y * (3. + 4. * a) + a * 40.)); }
        void main(){
          float x = (vUv.x + vPh) * vUv.z, y = vUv.y;
          float s = strands(vec2(x * 150., y * 5. + uTime * 2.2)) * .6 + strands(vec2(x * 61. + 5., y * 3. + uTime * 1.3)) * .4;
          float side = smoothstep(0., .35, vUv.x) * smoothstep(1., .65, vUv.x);
          // strongest under the cloud's base, thinning toward the water, where the mist takes it
          float up = smoothstep(1., .82, y) * smoothstep(-.1, .5, y);
          gl_FragColor = vec4(uCol * s * side * up * uK, 1.);
        }` }));
    veil.renderOrder = 5; object.add(veil);
    // the rain's foot on the water: a skirt of mist, and rings opening where drops fall thickest
    const foot = V3(showerAt.x + wx * lean, 0, showerAt.z + wz * lean);
    const skirt = fx.makeMist({ rng: S.spray, count: 14, area: [42, 1.6, 24], center: [foot.x, 1.7, foot.z], size: [7, 13], color: '#ffe6cc', opacity: 0.09 * Math.sqrt(deep), drift: [0.5, 0, 0.3], flatten: 0.3, floorFade: 0, near: mistNear([7, 13]) });
    object.add(skirt.object);
    // low white spray stands about each foot of the bow, 5 to 6 m across: the band fades into it
    const sprayAt = [];
    for (const f of [PLACES.bowWest, PLACES.bowEast]) for (let k = 0; k < 6; k++) { const a = S.spray() * TAU, r = S.spray.range(0, 2.2); sprayAt.push([f[0] + Math.cos(a) * r, S.spray.range(0.8, 2.6), f[1] + Math.sin(a) * r]); }
    const spray = fx.makeMist({ rng: S.spray, positions: sprayAt, count: sprayAt.length, size: [2.6, 4.6], color: '#fff6ea', opacity: 0.2, flatten: 0.7, floorFade: 0, fog: false, near: mistNear([2.6, 4.6]) });
    object.add(spray.object);
    const NR = 16, ringGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), ringPh = new THREE.InstancedBufferAttribute(new Float32Array(NR), 1); ringGeo.setAttribute('aPh', ringPh);
    const rainRings = new THREE.InstancedMesh(ringGeo, new THREE.ShaderMaterial({ uniforms: veilU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`attribute float aPh; varying vec2 vUv; varying float vG; uniform float uTime; void main(){ vUv = uv * 2. - 1.; vG = fract(uTime * .55 + aPh); gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vG; void main(){ float r = length(vUv), q = (r - (.1 + .8 * vG)) / .07; gl_FragColor = vec4(uCol * exp(-min(q * q, 40.)) * (1. - vG) * .4, 1.); }` }), NR);
    for (let j = 0; j < NR; j++) { ringPh.array[j] = S.spray(); const a = S.spray() * TAU, r = Math.sqrt(S.spray()); rainRings.setMatrixAt(j, mat(foot.x + bowA.x * Math.cos(a) * r * 20 - bowN.x * Math.sin(a) * r * 11, 0.42, foot.z + bowA.z * Math.cos(a) * r * 20 - bowN.z * Math.sin(a) * r * 11, 0, 0, 0, S.spray.range(2.4, 4.4))); }
    rainRings.instanceMatrix.needsUpdate = true; rainRings.frustumCulled = false; rainRings.renderOrder = 4; object.add(rainRings);
    updates.push((dt, time, camera) => { veilU.uTime.value = time; shower.update(dt, time); skirt.update(dt, time, camera); spray.update(dt, time, camera); });
  }
  await ctx.yield();

  // ---- the game in the lagoon: bubbles of many colours batted from tail to tail along the line between the bow's feet,
  // each foot a goal (two in three burst there, one is batted back). Ten stations: the two feet and eight tails in a zigzag.
  // Every station strikes four times in each 2.8 s, a little before or after its neighbours, so a hop lasts 2.2 to 3.4 s.
  // A bubble is a clear thin film 1.2 to 2.2 m across, flying a clear low arc (apex 2 to 5 m); a fluke stands 2.5 to
  // 3.5 m out of the water. All of it is a pure function of the world clock.
  {
    const T0 = 2.8, NB = Math.round(30 * dens * lerp(0.8, 1, detail)), nodes = [], ph = [];
    for (let j = 0; j < 10; j++) {
      const t = j / 9, lat = j === 0 || j === 9 ? 0 : (j % 2 ? 1 : -1) * S.game.range(1.1, 2.1) + 0.3;
      nodes.push(V3(lerp(PLACES.bowWest[0], PLACES.bowEast[0], t) + bowN.x * lat, 0, lerp(PLACES.bowWest[1], PLACES.bowEast[1], t) + bowN.z * lat));
      ph.push(0.4 + 0.1 * (j % 2 ? 1 : -1) * S.game.range(0.3, 1));
    }
    const node = (k) => 9 - Math.abs(((k % 18) + 18) % 18 - 9), hash = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
    const geo = new THREE.IcosahedronGeometry(1, 2), fade = new THREE.InstancedBufferAttribute(new Float32Array(NB), 1), tint = new THREE.InstancedBufferAttribute(new Float32Array(NB), 1);
    geo.setAttribute('aFade', fade); geo.setAttribute('aTint', tint);
    const bubU = { uTime: { value: 0 }, uSun: { value: V3(0, 0.2, -1) }, uSunCol: { value: new THREE.Color('#ffd9a0') }, uSky: { value: new THREE.Color('#7f8fd0') } };
    // A bubble is a CLEAR THIN FILM: next to nothing at its middle (the water and the wood show through it), its
    // colours gathering toward the rim where the film is seen edge on, a fine bright line at the very rim, and one
    // glint where the sun stands in it. The drops of a burst take the same film, whole (they are too small for a rim).
    const filmMat = (drop) => new THREE.ShaderMaterial({ uniforms: bubU, defines: drop ? { NW_DROP: 1 } : {}, transparent: true, depthWrite: false, fog: false,
      vertexShader: /* glsl */`
        attribute float aFade, aTint; varying vec3 vN, vV; varying float vFade, vTint;
        void main(){ vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal); vV = normalize(cameraPosition - w.xyz);
          vFade = aFade; vTint = aTint; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform float uTime; uniform vec3 uSun, uSunCol, uSky; varying vec3 vN, vV; varying float vFade, vTint;
        void main(){
          vec3 n = normalize(vN), v = normalize(vV); float nv = clamp(abs(dot(n, v)), 0., 1.), fr = (1. - nv) * (1. - nv);
          // a soap film: its colour turns with the angle it is seen at and with slow swirls on its skin
          float th = nv * 1.6 + vTint * 3. + .35 * sin(n.y * 5. + uTime * .9 + vTint * 20.) + .25 * sin(n.x * 7. - uTime * .6);
          vec3 film = .5 + .5 * cos(6.2832 * (th + vec3(0., .33, .67)));
          vec3 r = reflect(-v, n); float glint = pow(clamp(dot(r, uSun), 0., 1.), 140.);
          #ifdef NW_DROP
            vec3 c = mix(film, vec3(1., .96, .9), .5); float a = .8 * vFade;
          #else
            float rim = smoothstep(.45, .95, fr), line = smoothstep(.72, .98, fr);
            vec3 c = film * (.55 + .75 * rim) + vec3(1., .97, .92) * .7 * line + uSky * .25 * fr;
            float a = clamp(.05 + .16 * fr + .6 * rim + glint, 0., 1.) * vFade;
            c += uSunCol * glint * 2.6;
          #endif
          gl_FragColor = vec4(c * a, a);
        }`, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor });
    const bubMat = filmMat(false), dropMat = filmMat(true);
    const bubbles = new THREE.InstancedMesh(geo, bubMat, NB); bubbles.frustumCulled = false; bubbles.renderOrder = 7; object.add(bubbles);
    // a burst leaves a ring of six drops that opens and falls back to the water at the goal
    const dropGeo = new THREE.OctahedronGeometry(0.1, 0), dFade = new THREE.InstancedBufferAttribute(new Float32Array(NB * 6), 1), dTint = new THREE.InstancedBufferAttribute(new Float32Array(NB * 6), 1);
    dropGeo.setAttribute('aFade', dFade); dropGeo.setAttribute('aTint', dTint);
    const drops = new THREE.InstancedMesh(dropGeo, dropMat, NB * 6); drops.frustumCulled = false; drops.renderOrder = 7; object.add(drops);
    for (let i = 0; i < NB * 6; i++) dTint.array[i] = S.bubbles();
    const B = [];
    for (let i = 0; i < NB; i++) { B.push({ r: S.bubbles.range(0.6, 1.1), d: Math.floor(S.bubbles() * 4) / 4, K: S.bubbles.int(0, 17), id: S.bubbles() * 100 }); tint.array[i] = S.bubbles(); }
    // the tails: a tapering stem out of the water, bent over at the top, and a broad fluke of two pointed lobes swept
    // out and up from it with a notch between (as wide as the stem is tall, so that it reads from the far shore); the
    // wet shine is a pale line down the stem's and each lobe's upper side. Sculling; each strike sends a ring out
    const M = makeMesher();
    M.add(new THREE.CylinderGeometry(0.13, 0.24, 0.9, 7), mat(0, 0.3, 0), '#1f7f7c');
    M.add(new THREE.CylinderGeometry(0.08, 0.13, 0.72, 7), mat(0, 1.05, 0.08, 0, 0.25), '#2f958c');
    M.add(new THREE.CylinderGeometry(0.03, 0.05, 1.5, 4), mat(0, 0.66, 0.2, 0, 0.14), '#d8fff0');
    for (const sd of [-1, 1]) {
      M.add(new THREE.ConeGeometry(0.3, 1.0, 6), mat(sd * 0.42, 1.62, 0.2, 0, 0.3, -sd * 1.0, 1, 1, 0.22), '#49b3a4');
      M.add(new THREE.ConeGeometry(0.06, 0.8, 4), mat(sd * 0.44, 1.7, 0.27, 0, 0.3, -sd * 1.0, 1, 1, 0.5), '#e2fff4');
    }
    const tails = new THREE.InstancedMesh(M.build(), plainMat, 8); tails.frustumCulled = false; object.add(tails);
    Object.assign(dealt, { nodes, bubbles, tails });
    const tailRot = nodes.slice(1, 9).map(() => S.game() * TAU), tailTall = nodes.slice(1, 9).map(() => S.game.range(1.55, 2.05));
    const ringGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), ringPh = new THREE.InstancedBufferAttribute(new Float32Array(8), 1); ringGeo.setAttribute('aPh', ringPh);
    const ringU = { uTime: { value: 0 }, uCol: { value: new THREE.Color('#fff0d8') } };
    const rings = new THREE.InstancedMesh(ringGeo, new THREE.ShaderMaterial({ uniforms: ringU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`attribute float aPh; varying vec2 vUv; varying float vG; uniform float uTime; void main(){ vUv = uv * 2. - 1.; vG = fract(uTime * ${(4 / T0).toFixed(5)} - aPh * 4.); gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vG; void main(){ float r = length(vUv), q = (r - (.15 + .8 * vG)) / .07; float splash = smoothstep(.3, .0, r) * smoothstep(.25, .0, vG); gl_FragColor = vec4(uCol * (exp(-min(q * q, 40.)) * (1. - vG) * .8 + splash * 1.2), 1.); }` }), 8);
    rings.frustumCulled = false; rings.renderOrder = 4; object.add(rings);
    for (let j = 0; j < 8; j++) { ringPh.array[j] = ph[j + 1]; rings.setMatrixAt(j, mat(nodes[j + 1].x, 0.45, nodes[j + 1].z, 0, 0, 0, 7)); }
    rings.instanceMatrix.needsUpdate = true;
    const A = V3(), Bp = V3();
    updates.push((dt, time) => {
      bubU.uTime.value = time; ringU.uTime.value = time;
      for (let j = 0; j < 8; j++) {
        const g = (((time / T0 - ph[j + 1]) * 4) % 1 + 1) % 1, swing = 0.9 * smoothstep(0.86, 1, g) + 0.9 * Math.exp(-5 * g) * Math.cos(9 * g);
        tails.setMatrixAt(j, mat(nodes[j + 1].x, -0.25, nodes[j + 1].z, tailRot[j], swing * 0.7, 0, tailTall[j]));
      }
      tails.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < NB; i++) {
        const b = B[i], sT = time / T0 + b.d + b.K;
        let k = Math.floor(sT); if (sT < k + ph[node(k)]) k -= 1;
        const n0 = node(k), n1 = node(k + 1), t0 = k + ph[n0], f = clamp((sT - t0) / (k + 1 + ph[n1] - t0), 0, 1);
        const goal0 = n0 === 0 || n0 === 9, born = goal0 && hash(b.id, k) < 2 / 3, dies = (n1 === 0 || n1 === 9) && hash(b.id, k + 1) < 2 / 3;
        A.copy(nodes[n0]); Bp.copy(nodes[n1]);
        const apex = 2 + 3 * hash(b.id + 7, k), side = (hash(b.id + 3, k) - 0.5) * 1.1;
        let x = lerp(A.x, Bp.x, f) + bowN.x * side * Math.sin(Math.PI * f), z = lerp(A.z, Bp.z, f) + bowN.z * side * Math.sin(Math.PI * f), y = 1.5 + (apex - 1.5) * 4 * f * (1 - f), sc = b.r, al = 1;
        // a burst bubble's place is taken by a new one that swells out of the water at the next tail
        if (born) { x = Bp.x; z = Bp.z; y = lerp(0.2, 1.5, f); sc = b.r * smoothstep(0, 0.85, f); }
        if (dies && f > 0.94) { const q = (f - 0.94) / 0.06; sc *= 1 + 0.7 * q; al = 1 - q; }
        bubbles.setMatrixAt(i, mat(x, y, z, 0, 0, 0, Math.max(sc, 1e-3))); fade.array[i] = al;
        // its drops: thrown out from where it burst (the goal it came to), up a little and down under their weight
        const tf = f * T0, fall = 1.5 + 2.2 * tf - 4.9 * tf * tf, on = born && fall > 0.1 ? 1 : 0;
        for (let q = 0; q < 6; q++) {
          const a = (q + hash(b.id + q, k)) / 6 * TAU, r = 0.35 + 2.1 * tf;
          drops.setMatrixAt(i * 6 + q, mat(A.x + Math.cos(a) * r, Math.max(fall, 0.1), A.z + Math.sin(a) * r, 0, 0, 0, on ? 1 + b.r : 1e-3)); dFade.array[i * 6 + q] = on;
        }
      }
      bubbles.instanceMatrix.needsUpdate = true; fade.needsUpdate = true; drops.instanceMatrix.needsUpdate = true; dFade.needsUpdate = true;
    });
    bubU.uSun.value.set(Math.sin(PLACES.sunAz * DEG) * Math.cos(sunEl * DEG), Math.sin(sunEl * DEG), -Math.cos(PLACES.sunAz * DEG) * Math.cos(sunEl * DEG));
    bubU.uSunCol.value.set('#ffb860');
  }
  await ctx.yield();

  // ---- THE SUN'S ARROWS fly always, at one strength: eighteen broad shafts and some four thousand short gold darts
  // (2 to 4 m long, 70 m a second), all down the sun's own line from the sun's place, so that they read as its light.
  // The darts are densest over the island's sunward side; over the lagoon and the reef beyond it, where they are seen
  // from the side, a second field is finer and far fewer (by place: north of the lagoon's shore line).
  {
    const az = PLACES.sunAz * DEG, slant = Math.max(sunEl, 4) * DEG, from = V3(Math.sin(az) * Math.cos(slant), Math.sin(slant), -Math.cos(az) * Math.cos(slant));
    const thick = opts.hourWish === 'day' ? 1.5 : opts.mood === 'clear' ? 0.8 : 1, soft = opts.mood === 'haze';
    const shafts = fx.makeGodRays({ rng: S.shafts, position: [PLACES.centre[0] + from.x * 330, 30 + from.y * 330, PLACES.centre[1] + from.z * 330], direction: [-from.x, -from.y, -from.z], radius: 150, count: 18,
      length: 560, width: soft ? [9, 26] : [5, 15], color: '#ffc870', intensity: 0.2 * (soft ? 1.4 : 1), falloff: 0.7, fogAmount: 0.3 });
    object.add(shafts.object);
    // THE SHAFTS ARE BODIES OF LIGHT TOO, kept off the eye BY PLACE as the darts are. The kit deals each shaft's axis
    // (a place in a disc of 150 m across the sun's line, a width and a length of its own). An axis that would pass
    // within the shaft's own half-width there and 2 m of any point of the route (2 m apart, the whole line) is dealt
    // a new place in the same disc from a stream of its own (isle-shaftsPlace), up to thirty times; one that finds
    // none is left out (strength 0). So a lane of clear air stands round the whole route for any eye, and no shaft is
    // thinned as we come: its near range is the medium's own, 0.6 to 2.5 m in true metres from its axis (the kit's
    // law scaled it by the width: that one line of its shader is replaced; if the kit's text ever differs the range
    // is passed divided by the widest half-width instead, which is never more than the true range).
    {
      const sd = V3(-from.x, -from.y, -from.z), s1 = V3().crossVectors(sd, V3(0, 1, 0)).normalize(), s2 = V3().crossVectors(sd, s1).normalize();
      const org = shafts.object.geometry.attributes.aOrigin, par = shafts.object.geometry.attributes.aParam, at = shafts.object.position, wide = shafts.uniforms.uWidth.value, LEN = shafts.uniforms.uLength.value;
      const crosses = (ox, oy, oz, k, len) => {
        for (let j = 0; j < lane.length; j += 3) {
          const px = lane[j] - ox, py = lane[j + 1] - oy, pz = lane[j + 2] - oz, t = clamp(px * sd.x + py * sd.y + pz * sd.z, 0, len);
          const dx = px - sd.x * t, dy = py - sd.y * t, dz = pz - sd.z * t, need = lerp(wide.x, wide.y, t / len) * k + 2;
          if (dx * dx + dy * dy + dz * dz < need * need) return true;
        }
        return false;
      };
      const shaftsDealt = { again: 0, out: 0, least: 1e9 };
      for (let i = 0; i < org.count; i++) {
        const k = par.getX(i), len = LEN * par.getY(i);
        let clear = !crosses(at.x + org.getX(i), at.y + org.getY(i), at.z + org.getZ(i), k, len), tried = false;
        for (let n = 0; !clear && n < 30; n++) {
          const a = S.shaftsPlace() * TAU, r = Math.sqrt(S.shaftsPlace()) * 150, x = Math.cos(a) * r, y = Math.sin(a) * r; tried = true;
          org.setXYZ(i, s1.x * x + s2.x * y, s1.y * x + s2.y * y, s1.z * x + s2.z * y);
          clear = !crosses(at.x + org.getX(i), at.y + org.getY(i), at.z + org.getZ(i), k, len);
        }
        if (!clear) { par.setW(i, 0); shaftsDealt.out++; } else if (tried) shaftsDealt.again++;
      }
      org.needsUpdate = par.needsUpdate = true;
      const law = 'smoothstep(uNear.x*wHere, uNear.y*wHere, dAxis)', m = shafts.material;
      if (m.vertexShader.split(law).length === 2) { m.vertexShader = m.vertexShader.replace(law, 'smoothstep(uNear.x, uNear.y, dAxis)'); shafts.uniforms.uNear.value.set(NEAR[0], NEAR[1]); }
      else shafts.uniforms.uNear.value.set(NEAR[0] / (wide.y * 1.6), NEAR[1] / (wide.y * 1.6));
      shaftsDealt.metres = m.vertexShader.includes('smoothstep(uNear.x, uNear.y, dAxis)'); Object.assign(shaftsDealt, { org, par, at, dir: sd, wide, len: LEN });
      Object.assign(dealt, { shafts: shaftsDealt });
    }
    // THE DARTS ARE BODIES, kept off the eye BY PLACE. Each flies one straight line of its own down the sun's bearing,
    // all the lines parallel, through one of two fields that stand in the world (boxes: over the island's sunward side
    // and, finer and fewer, over the lagoon and the reef beyond it). A line is dealt as a place in its field; where it
    // would pass within DART_LANE of the flight's line it is not built: a lane of clear air stands along the whole
    // route, the same for any eye. Nothing of a dart is thinned by the eye's distance. Each is a spear of gold light
    // 2 to 4 m long: a point at its head, widest a fifth behind it, a tail drawn out to nothing.
    const DART_LANE = 10, DART_SPEED = 70, dir = V3(-from.x, -from.y, -from.z);
    const dartU = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uDir: { value: dir }, uCol: { value: new THREE.Color('#ffb62e') }, uMinAngle: { value: 0.0012 } }]);
    // the route's points as seen down the sun's line: two metres across it (along e1 and e2), one along it, kept in
    // squares a lane's width wide, so that a dart's line is measured only against the points that could be near it
    const e1 = V3().crossVectors(dir, V3(0, 1, 0)).normalize(), e2 = V3().crossVectors(dir, e1).normalize(), CELL = DART_LANE + 1, laneDown = new Map();
    for (let j = 0; j < lane.length; j += 3) { const a = lane[j] * e1.x + lane[j + 1] * e1.y + lane[j + 2] * e1.z, b = lane[j] * e2.x + lane[j + 1] * e2.y + lane[j + 2] * e2.z, k = Math.floor(a / CELL) + ',' + Math.floor(b / CELL);
      if (!laneDown.has(k)) laneDown.set(k, []); laneDown.get(k).push(a, b, lane[j] * dir.x + lane[j + 1] * dir.y + lane[j + 2] * dir.z); }
    await ctx.yield();
    const dartField = (rng, centre, box, count, width, gain) => {
      const base = [], span = [], shape = [], lo = [0, 1, 2].map((k) => centre[k] - box[k] / 2), hi = [0, 1, 2].map((k) => centre[k] + box[k] / 2), d = [dir.x, dir.y, dir.z];
      for (let i = 0; i < count; i++) {
        const p = [rng.range(lo[0], hi[0]), rng.range(lo[1], hi[1]), rng.range(lo[2], hi[2])], len = rng.range(2, 4), w = rng.range(width[0], width[1]);
        // the line's chord through the field: from t0 to t1 metres along it from the dealt place
        let t0 = -1e9, t1 = 1e9;
        for (let k = 0; k < 3; k++) { const a = (lo[k] - p[k]) / d[k], b = (hi[k] - p[k]) / d[k]; t0 = Math.max(t0, Math.min(a, b)); t1 = Math.min(t1, Math.max(a, b)); }
        // the lane: the whole chord (and a dart's length beyond each end) against every point of the route, 2 m apart
        // (the route's points are read down the sun's line from their squares: see laneDown)
        let clear = true; const need = Math.hypot(DART_LANE + w, 1), a0 = p[0] * e1.x + p[1] * e1.y + p[2] * e1.z, b0 = p[0] * e2.x + p[1] * e2.y + p[2] * e2.z, tp = p[0] * d[0] + p[1] * d[1] + p[2] * d[2];
        const ca = Math.floor(a0 / CELL), cb = Math.floor(b0 / CELL);
        for (let ia = ca - 1; ia <= ca + 1 && clear; ia++) for (let ib = cb - 1; ib <= cb + 1 && clear; ib++) { const sq = laneDown.get(ia + ',' + ib); if (!sq) continue;
          for (let j = 0; j < sq.length && clear; j += 3) { const t = sq[j + 2] - tp; if (t < t0 - need - 4 || t > t1 + need + 4) continue; const da = sq[j] - a0, db = sq[j + 1] - b0; if (da * da + db * db < need * need) clear = false; } }
        if (!clear) continue;
        base.push(p[0] + d[0] * t0, p[1] + d[1] * t0, p[2] + d[2] * t0); span.push(t1 - t0, -t0 / (t1 - t0)); shape.push(len, w * 0.5);
      }
      const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position); g.setAttribute('uv', quad.attributes.uv);
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 3)); g.setAttribute('aSpan', new THREE.InstancedBufferAttribute(new Float32Array(span), 2)); g.setAttribute('aShape', new THREE.InstancedBufferAttribute(new Float32Array(shape), 2));
      g.instanceCount = span.length / 2;
      const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...dartU, uGain: { value: gain } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
        vertexShader: /* glsl */`
          attribute vec3 aBase; attribute vec2 aSpan, aShape; uniform float uTime, uMinAngle; uniform vec3 uDir; varying vec2 vUv; varying float vA;
          #include <fog_pars_vertex>
          void main(){
            // metres along its chord (the head); the dart shows whole between the field's two faces and is lost in them
            float s = fract(uTime * ${DART_SPEED.toFixed(1)} / aSpan.x + aSpan.y) * aSpan.x;
            vec3 c = aBase + uDir * (s - aShape.x * (1. - uv.y));
            vec3 toEye = cameraPosition - c, sd = cross(uDir, toEye); float dist = length(toEye), w = max(aShape.y, uMinAngle * dist);
            vec4 mvPosition = viewMatrix * vec4(c + sd / max(length(sd), 1e-4) * (uv.x * 2. - 1.) * w, 1.0);
            vUv = vec2(uv.x * 2. - 1., uv.y); vA = aShape.y / w * smoothstep(0., 8., s) * (1. - smoothstep(aSpan.x - 8., aSpan.x, s));
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; uniform float uGain; varying vec2 vUv; varying float vA;
          #include <fog_pars_fragment>
          void main(){
            float v = clamp(vUv.y, 0., 1.), across = clamp(abs(vUv.x), 0., 1.);
            float wide = v > .8 ? (1. - v) * 5. : pow(clamp(v / .8, 0., 1.), .6);
            float a = (1. - smoothstep(wide * .45, wide + .02, across)) * (.12 + .88 * v * v) * vA * uGain;
            #ifdef FOG_EXP2
              float fd = fogDensity * vFogDepth; a *= exp(-min(fd * fd, 40.));
            #endif
            gl_FragColor = vec4(uCol * a, 1.);
          }` }));
      mesh.frustumCulled = false; mesh.renderOrder = 6; object.add(mesh);
      return mesh;
    };
    const shoreZ = PLACES.bay[1] + 14, fewer = 2 / 3;
    const darts = dartField(S.darts, [PLACES.centre[0] + 20, 46, (shoreZ - 245) / 2], [460, 84, -245 - shoreZ], Math.round(5600 * fewer * thick * lerp(0.6, 1, detail)), [0.06, 0.12], 1.5);
    await ctx.yield();
    const dartsFine = dartField(S.dartsFine, [PLACES.centre[0] + 20, 40, shoreZ - 75], [460, 72, 150], Math.round(600 * fewer * thick * lerp(0.6, 1, detail)), [0.035, 0.07], 1.3);
    updates.push((dt, time) => { shafts.update(dt, time); darts.material.uniforms.uTime.value = time; dartsFine.material.uniforms.uTime.value = time; });
  }
  await ctx.yield();

  // ---- the grove. THE WARMTH IS THE MUSHROOM'S ALONE: firelight in the gap under its rim, a thin thread of smoke from
  // under the rim, and the fire's pool on sand, roots and ferns: brightest at the mushroom's foot and gone by 18 m, every
  // trunk lit only on its side toward it (the first of the shade's three lamps; it burns always). The trunks' hollows
  // are dark splits in the bark (see the stems below): nothing is lit in them.
  const fireU = { uTime: { value: 0 } };
  // the lamp stands 4 m over the mushroom's foot (the fire's light as it comes out under the rim and off its smoke), so
  // its pool lies wide on the ground about the foot
  const FIRE = [1.0, 0.5, 0.17], FIRE_K = 11;
  shade.lamp(0, mush.x, mush.y + 4, mush.z, 18); shade.lampColor(0, FIRE[0] * FIRE_K, FIRE[1] * FIRE_K, FIRE[2] * FIRE_K);
  {
    const M = makeMesher(), glowPos = [], glowIdx = [], glowUv = [];
    const quad = (cx, cy, cz, ax, ay, az, bx, by, bz, kind) => {
      const b = glowPos.length / 3;
      for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { glowPos.push(cx + ax * u + bx * v, cy + ay * u + by * v, cz + az * u + bz * v); glowUv.push(u, v, kind); }
      glowIdx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    // the mushroom: 1.4 m tall, its cap 1.8 m across, plain pale brown; only the firelight under its rim shines
    M.add(new THREE.CylinderGeometry(0.3, 0.4, 1.0, 10), mat(mush.x, mush.y + 0.5, mush.z), '#c9b08a');
    M.add(new THREE.SphereGeometry(0.9, 14, 6, 0, TAU, 0, Math.PI / 2), mat(mush.x, mush.y + 0.95, mush.z, 0, 0, 0, 1, 0.5, 1), '#b08f6a');
    M.add(new THREE.CylinderGeometry(0.9, 0.34, 0.12, 14), mat(mush.x, mush.y + 0.9, mush.z), '#8a6c4c');
    quad(mush.x, mush.y + 0.83, mush.z, 0.86, 0, 0, 0, 0, 0.86, 2);
    quad(mush.x, mush.y + 0.2, mush.z, 5.5, 0, 0, 0, 0, 5.5, 1);
    object.add(new THREE.Mesh(M.build(), plainMat));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(glowPos, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(glowUv, 3)); g.setIndex(glowIdx);
    // kind 1: the heart of the fire's pool lying on the ground at the mushroom's foot; 2: the warm line under the mushroom's rim
    const fires = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: fireU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: /* glsl */`attribute vec3 aUv; varying vec3 vUv; varying vec3 vW; void main(){ vUv = aUv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */`
        uniform float uTime; varying vec3 vUv; varying vec3 vW;
        void main(){
          vec2 q = vUv.xy; float r = length(q), kind = vUv.z;
          float fl = .8 + .2 * sin(uTime * 7.3 + vW.x * 3.1) * sin(uTime * 4.1 + vW.z * 2.7) + .08 * sin(uTime * 17. + vW.x);
          vec3 ground = vec3(1., .55, .2) * .3 * smoothstep(1., 0., r) * smoothstep(1., .2, r);
          vec3 rim = vec3(1., .6, .24) * 3. * smoothstep(1., .82, r) * smoothstep(.3, .75, r);
          gl_FragColor = vec4((kind < 1.5 ? ground : rim) * fl, 1.);
        }` }));
    fires.renderOrder = 2; object.add(fires);
    // the firelight in the thin haze of its own smoke: one soft warm glow about the mushroom, 14 m across
    const fireHaze = fx.makeGlows({ rng: S.smoke, positions: [[mush.x, mush.y + 2.2, mush.z]], color: '#ff9a4a', size: 14, intensity: 0.3, core: 0, halo: 1, flicker: 0.12, fogAmount: 0 });
    object.add(fireHaze.object); updates.push((dt, time) => fireHaze.update(dt, time));
    // the firelight wavers: the lamp's strength follows the same clock as the pool
    updates.push((dt, time) => { fireU.uTime.value = time; const fl = FIRE_K * (0.86 + 0.14 * Math.sin(time * 7.3) * Math.sin(time * 4.1) + 0.05 * Math.sin(time * 17)); shade.lampColor(0, FIRE[0] * fl, FIRE[1] * fl, FIRE[2] * fl); });
    // THE SEVEN STEMS. Each of the seven trunks has a stem of its own from under the ground to where its boughs fork (three
    // tenths of the tree's height): 2.9 to 3.4 m thick, leaning as its tree leans, swelling under the fork, with five or
    // six roots flaring at its foot and furrowed bark in relief. Its HOLLOW is one ragged dark split in the bark: 2 to 5 m
    // tall, 0.5 to 1.2 m wide, leaning, torn at its lips, each lip its own outline, no two alike; no frame, no arch, no sill,
    // and nothing lit inside. The split is drawn in the stem's own shader from four numbers carried by each corner:
    // metres across the bark from the split's middle line, the share of its height, its half width, its own seed.
    await ctx.yield();
    {
      const NA = 40, NH = 26, pos = [], col = [], spl = [], idx = [], c = new THREE.Color(), bark = new THREE.Color('#56402e'), barkDark = new THREE.Color('#33261c');
      for (const t of trunks) {
        const ax = stemAxes[t.giant ? 1 : 0], h = ax.h, cr = Math.cos(t.rot), sr = Math.sin(t.rot), base = pos.length / 3;
        const roots = S.splits.int(5, 6), rootPh = S.splits() * TAU, furPh = S.splits() * TAU, r0 = 0.62;
        // the split: its bearing (toward the ring's middle, up to 50 degrees to either side), its foot above the roots, its height, width and lean
        const bearing = Math.atan2(gz - t.z, gx - t.x) + S.splits.range(-0.9, 0.9) + t.rot, foot = t.y + 1.2 + S.splits.range(0.7, 1.5);
        const tall = t.giant ? S.splits.range(4.2, 5) : S.splits.range(2, 4.4), halfW = S.splits.range(0.25, 0.6), lean = S.splits.range(-0.28, 0.28), seed = S.splits() * 40;
        for (let j = 0; j <= NH; j++) {
          const f = j / NH, y = lerp(-0.07 * h, 0.37 * h, f * f * 0.35 + f * 0.65);
          const k = clamp(y / (0.16 * h), 0, 1), k2 = clamp((y - 0.16 * h) / (0.1 * h), 0, 1), cx = lerp(ax.a[0] * k, ax.b[0], k2), cz = lerp(ax.a[1] * k, ax.b[1], k2);
          // it swells under the fork and draws in over it to a rounded shoulder among the boughs (no flat sawn top)
          const swell = (1 + 0.14 * smoothstep(0.19 * h, 0.28 * h, y)) * (1 - 0.68 * smoothstep(0.29 * h, 0.37 * h, y)), flare = 0.9 * Math.exp(-Math.max(y, 0) / (0.035 * h));
          for (let i = 0; i < NA; i++) {
            const th = i / NA * TAU, lobe = Math.pow(0.5 + 0.5 * Math.cos(roots * th + rootPh), 2);
            const fur = Math.abs(Math.sin(3 * th + furPh + 0.5 * Math.sin(y * 0.9 + furPh * 3))), rough = noise.n2(th * 2.2 + t.x, y * 0.5 + t.z);
            const r = r0 * (swell + flare * (0.35 + 0.65 * lobe) + 0.075 * fur + 0.05 * rough);
            const lx = cx + Math.cos(th) * r, lz = cz + Math.sin(th) * r, wy = t.y + t.s * y, rw = r * t.s;
            pos.push(t.x + t.s * (lx * cr + lz * sr), wy, t.z + t.s * (-lx * sr + lz * cr));
            c.copy(barkDark).lerp(bark, 0.25 + 0.75 * fur).multiplyScalar(0.85 + 0.3 * (0.5 + 0.5 * rough)); col.push(c.r, c.g, c.b);
            let d = th - (bearing + lean * (wy - foot - tall / 2) / rw); d -= Math.round(d / TAU) * TAU;
            // (the far half of the stem carries no split at all: its corners say so, so nothing is drawn where the angle wraps)
            spl.push(d * rw, Math.abs(d) > 1.6 ? -1 : (wy - foot) / tall, halfW, seed);
            if (j < NH) { const a = base + j * NA + i, b = base + j * NA + (i + 1) % NA; idx.push(a, a + NA, b, b, a + NA, b + NA); }
          }
        }
        // the top is closed just above the fork
        const topC = pos.length / 3, kx = ax.b[0], kz = ax.b[1];
        pos.push(t.x + t.s * (kx * cr + kz * sr), t.y + t.s * 0.385 * h, t.z + t.s * (-kx * sr + kz * cr)); col.push(barkDark.r, barkDark.g, barkDark.b); spl.push(9, -1, 0, 0);
        for (let i = 0; i < NA; i++) idx.push(base + NH * NA + i, topC, base + NH * NA + (i + 1) % NA);
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aSplit', new THREE.Float32BufferAttribute(spl, 4));
      g.setIndex(idx); g.computeVertexNormals(); g.computeBoundingSphere();
      await ctx.yield();
      const stemMat = new THREE.MeshLambertMaterial({ vertexColors: true });
      stemMat.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aSplit; varying vec4 vNwSplit;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvNwSplit = aSplit;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vNwSplit;')
          .replace('#include <color_fragment>', `#include <color_fragment>
          { float spT = clamp(vNwSplit.y, 0.0, 1.0), spD = abs(vNwSplit.x), spS = vNwSplit.w + step(0.0, vNwSplit.x) * 17.3;
            float spEnv = pow(clamp(sin(3.14159 * spT), 0.0, 1.0), 0.75);
            float spW = vNwSplit.z * spEnv * (0.45 + 0.85 * nwVn(vec3(vNwSplit.y * 13.0, spS, 3.7)) + 0.3 * nwVn(vec3(vNwSplit.y * 37.0, spS, 1.3)));
            float spOn = step(0.0, vNwSplit.y) * step(vNwSplit.y, 1.0);
            float spIn = spOn * (1.0 - smoothstep(spW - 0.05, spW, spD));
            float spLip = spOn * (1.0 - smoothstep(spW, spW + 0.3, spD)) * (1.0 - spIn);
            // the torn lips: pale inner wood in ragged flecks along both edges, so the dark of the hollow reads in shade too
            float spTorn = spLip * smoothstep(0.25, 0.7, nwVn(vec3(vNwSplit.y * 17.0, vNwSplit.x * 5.0, spS)));
            diffuseColor.rgb = mix(mix(diffuseColor.rgb * (1.0 - 0.3 * spLip), vec3(0.3, 0.21, 0.13), 0.7 * spTorn), vec3(0.008, 0.006, 0.007), spIn); }`);
      };
      stemMat.customProgramCacheKey = () => 'nw-stem3';
      object.add(new THREE.Mesh(g, shade.patch(stemMat)));
    }
    await ctx.yield();
    // ferns on the dell's floor and under the great wood, none within 5 m of the route
    const ferns = [];
    for (let i = 0; i < 900 * dens; i++) {
      if (i % 200 === 199) await ctx.yield();
      const a = S.ferns() * TAU, r = 6 + 62 * Math.sqrt(S.ferns()), x = gx + Math.cos(a) * r, z = gz + Math.sin(a) * r, sc = S.ferns.range(1.3, 2.6), rot = S.ferns() * TAU;
      if (land.shore(x, z) < 12 || land.height(x, z) < 1.7 || laneDist(lane, x, land.height(x, z) + 1, z, laneFrom) < 5 || Math.hypot(x - mush.x, z - mush.z) < 2) continue;
      ferns.push({ x, y: land.height(x, z) - 0.05, z, s: sc, rot, d: 0, u: 0, v: i % 2 });
    }
    await ctx.yield();
    const fernGeos = [flora.fernGeometry({ rng: S.ferns, size: 1.2, fronds: 9, detail: 1, leaf: '#3c7a3a', leafLight: '#6aa04a', leafDark: '#1c4a2a' }), flora.fernGeometry({ rng: S.ferns, size: 1.0, fronds: 7, detail: 0, leaf: '#356f34', leafLight: '#5f9a48', leafDark: '#12382c' })];
    object.add(flora.makeScatter({ rng: S.ferns, points: ferns, variants: fernGeos, material: leafMat, tint: 0.2, hue: 0.05 }).object);
  }
  await ctx.yield();

  // ---- the red house in the leaves: 4 by 3 by 3 m, red walls, a mossy roof, a hat for a chimney, two windows that are
  // always lit. It faces out over the well in the leaves (a place of the wood), and leaves close about its foot: no
  // platform and no bough under it shows.
  const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.6) });
  {
    const M = makeMesher(), W = makeMesher();
    const yaw = Math.atan2(PLACES.leafWell[0] - rhx, PLACES.leafWell[2] - rhz), at = (lx, ly, lz) => { const c = Math.cos(yaw), sn = Math.sin(yaw); return [rhx + lx * c + lz * sn, rhy + ly, rhz - lx * sn + lz * c]; };
    const put = (geo, lx, ly, lz, col, ry = 0, rx = 0, rz = 0, mesher = M) => { const [x, y, z] = at(lx, ly, lz); mesher.add(geo, mat(x, y, z, yaw + ry, rx, rz), col); };
    put(new THREE.BoxGeometry(4, 3, 3), 0, 1.5, 0, '#c23a2e');
    for (const sd of [-1, 1]) put(new THREE.BoxGeometry(4.7, 0.22, 2.3), 0, 3.55, sd * 0.86, sd > 0 ? '#4f6b3a' : '#466434', 0, sd * 0.66);
    for (let k = 0; k < 7; k++) put(new THREE.BoxGeometry(S.house.range(0.5, 1.1), 0.1, S.house.range(0.4, 0.8)), S.house.range(-1.9, 1.9), 3.72 - 0.0, (k % 2 ? 1 : -1) * S.house.range(0.5, 1.5), '#6a8a4a', 0, (k % 2 ? 1 : -1) * 0.66);
    // the gables: one prism under the roof, end to end
    { const sh = new THREE.Shape(); sh.moveTo(-1.5, 0); sh.lineTo(1.5, 0); sh.lineTo(0, 1.17); sh.closePath();
      put(new THREE.ExtrudeGeometry(sh, { depth: 4, bevelEnabled: false }).translate(0, 0, -2), 0, 3, 0, '#b3362b', Math.PI / 2); }
    put(new THREE.CylinderGeometry(0.28, 0.3, 0.8, 10), 1.2, 4.55, 0.2, '#1c1a20'); put(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), 1.2, 4.16, 0.2, '#1c1a20');
    put(new THREE.BoxGeometry(0.9, 1.8, 0.1), 0, 0.9, 1.52, '#3a2418');
    for (const sd of [-1, 1]) {
      put(new THREE.BoxGeometry(0.95, 1.0, 0.06), sd * 1.25, 1.75, 1.52, '#ffffff', 0, 0, 0, W);
      put(new THREE.BoxGeometry(1.1, 0.07, 0.1), sd * 1.25, 1.75, 1.55, '#3a2418'); put(new THREE.BoxGeometry(0.07, 1.1, 0.1), sd * 1.25, 1.75, 1.55, '#3a2418');
    }
    M.add(new THREE.CylinderGeometry(0.5, 0.75, rhy - houseTree.y - 4, 8), mat(houseTree.x, (rhy - 4 + houseTree.y) / 2, houseTree.z), '#4a382c');
    object.add(new THREE.Mesh(M.build(), plainMat), new THREE.Mesh(W.build(), lampMat));
    // the leaves about its foot: twenty bushy masses under and round the floor, of the wood's own leaf (not parted by the well)
    const footMat = shade.patch(flora.windMaterial({ ...matOpts, map: leafMat.map }));
    const footGeos = [flora.bushGeometry({ rng: S.house, size: 1.7, detail: 1, leaf: GREAT.leaf, leafLight: GREAT.leafLight, leafDark: GREAT.leafDark }), flora.bushGeometry({ rng: S.house, size: 1.4, detail: 1, leaf: '#2f6b3a', leafLight: '#5f9a48', leafDark: '#1f4a34' })];
    const footPts = [];
    // (and eight more a tier lower, about the boughs that carry it: no leg-like bough shows under the floor)
    for (let k = 0; k < 20; k++) { const low = k >= 12, a = (k + S.house.range(0, 0.8)) / (low ? 8 : 12) * TAU, r = k % 3 === 0 ? S.house.range(0, 1.2) : S.house.range(2.0, 3.1), [x, y, z] = at(Math.cos(a) * r * 1.25, S.house.range(-2.6, -1.3) - (low ? 2.4 : 0), Math.sin(a) * r);
      footPts.push({ x, y, z, s: S.house.range(1.25, 1.8), rot: S.house() * TAU, d: 0, u: 0, v: k % 2 }); }
    object.add(flora.makeScatter({ rng: S.house, points: footPts, variants: footGeos, material: footMat, tint: 0.2, hue: 0.05, sink: 0, tilt: 0.3 }).object);
    // smoke: from the hat, and one thin thread from under the mushroom's rim (the rim's edge down the wind)
    const smokeOpts = { count: 36, color: '#8f8b98', colorTop: '#b9b4c4', shadowColor: '#4a4658', ambient: '#2a2838', opacity: 0.5, rate: 0.05, wind: [0.5, 0, 0.86], bend: 0.5, sunDir: [0.3, 0.5, -0.8] };
    const [cx, cy, cz] = at(1.2, 5.0, 0.2);
    const s1 = fx.makeSmokeColumn({ rng: S.smoke, ...smokeOpts, position: [cx, cy, cz], height: 15, radius: [0.2, 2.4], size: [0.8, 4.5] });
    const s2 = fx.makeSmokeColumn({ rng: S.smoke, ...smokeOpts, opacity: 0.42, position: [mush.x + 0.42, mush.y + 0.86, mush.z + 0.72], height: 15, radius: [0.04, 0.5], size: [0.22, 1.1] });
    object.add(s1.object, s2.object);
    updates.push((dt, time) => { s1.update(dt, time); s2.update(dt, time); });
  }
  await ctx.yield();

  // ---- the island's small lights: loose points (mauve, white, pale blue) going home through the tree tops along six
  // broad ways toward the ring, each at its own unsteady pace, some straying and circling back; and pairs of eyes along
  // the shore. All of them burn always, wherever they are.
  {
    const NL = Math.round((opts.rare ? 3000 : 500) * lerp(0.7, 1, detail)), NE = 22;
    const ways = [];
    for (let w = 0; w < 6; w++) {
      // a way starts on land 85 to 125 m from the ring on its own bearing and wanders in to the ring's middle
      const a = (w + S.lights.range(0.15, 0.85)) / 6 * TAU, pts = []; let r = S.lights.range(85, 125);
      while (r > 30 && land.shore(gx + Math.cos(a) * r, gz + Math.sin(a) * r) < 12) r -= 6;
      const bend = S.lights.range(-0.5, 0.5), n = 6;
      for (let k = 0; k <= n; k++) {
        const t = k / n, rr = r * (1 - t) + 3 * t, aa = a + bend * Math.sin(Math.PI * t), x = gx + Math.cos(aa) * rr, z = gz + Math.sin(aa) * rr;
        pts.push(V3(x, Math.max(land.height(x, z), 0) + lerp(19, 30, smoothstep(70, 20, rr)) - 16 * smoothstep(0.85, 1, t), z));
      }
      ways.push({ curve: new THREE.CatmullRomCurve3(pts), half: S.lights.range(4, 7), len: r });
    }
    await ctx.yield();
    const Lt = [];
    for (let i = 0; i < NL; i++) Lt.push({ w: S.lights.int(0, 5), s0: S.lights(), v: S.lights.range(1.4, 4.2), ph: S.lights() * TAU, rad: Math.sqrt(S.lights()), th: S.lights() * TAU, om: S.lights.range(-0.5, 0.5),
      stray: S.lights.chance(0.18) ? S.lights.range(5, 12) : 0, size: S.lights.range(0.7, 1.3), swirl: opts.rare && S.lights.chance(0.3), lift: S.lights.range(0, 1) });
    const eyes = [];
    await ctx.yield();
    for (let k = 0; k < 400 && eyes.length < NE; k++) {
      const x = S.eyes.range(-320, 100), z = S.eyes.range(-480, -300), sh = land.shore(x, z);
      if (sh < 6 || sh > 16 || laneDist(lane, x, land.height(x, z) + 1, z, laneFrom) < 14) continue;
      // a pair looks out to sea: the two eyes lie along the shore, 0.24 m apart
      const e = 2, gxs = land.shore(x + e, z) - land.shore(x - e, z), gzs = land.shore(x, z + e) - land.shore(x, z - e), l = Math.hypot(gxs, gzs) || 1;
      eyes.push({ x, y: land.height(x, z) + S.eyes.range(0.5, 1.1), z, tx: -gzs / l * 0.12, tz: gxs / l * 0.12, ph: S.eyes() * 50, green: S.eyes.chance(0.4) });
    }
    await ctx.yield();
    const cols = [];
    for (let i = 0; i < NL; i++) cols.push(['#c9a0ff', '#ffffff', '#a9d0ff'][i % 3]);
    for (const e of eyes) cols.push(e.green ? '#b8ff70' : '#ffd060', e.green ? '#b8ff70' : '#ffd060');
    const glows = fx.makeGlows({ rng: S.lights, count: NL + eyes.length * 2, area: [1, 1, 1], colors: cols, size: 0.75, intensity: 2.6, halo: 0.5, minAngle: 0.0035, fogAmount: 0.3 });
    glows.object.frustumCulled = false; object.add(glows.object);
    const aPos = glows.object.geometry.attributes.aPos, aCol = glows.object.geometry.attributes.aColor, P = V3();
    updates.push((dt, time) => {
      const pa = aPos.array, ca = aCol.array;
      for (let i = 0; i < NL; i++) {
        const L = Lt[i], way = ways[L.w];
        // metres along its way: a steady drift with a slow surge on it, and for a strayer a loop that carries it back a while
        const s = (((L.s0 + (time * L.v + 5 * Math.sin(time * 0.21 + L.ph) + L.stray * Math.sin(time * 0.13 + L.ph * 2)) / way.len) % 1) + 1) % 1;
        way.curve.getPoint(s, P);
        const th = L.th + time * L.om, rad = L.rad * way.half * (1 + 0.4 * L.stray / 12);
        let x = P.x + Math.cos(th) * rad, y = P.y + Math.sin(th * 1.3 + L.ph) * rad * 0.4 + L.lift * 2, z = P.z + Math.sin(th) * rad;
        // on a rare night a part of them turn in a slow swirl 30 m wide above the house
        if (L.swirl) { const a = L.th + time * (0.25 + 0.2 * L.rad); x = rhx + Math.cos(a) * 15 * L.rad; z = rhz + Math.sin(a) * 15 * L.rad; y = rhy + 7 + 9 * L.lift + Math.sin(time * 0.5 + L.ph); }
        pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z;
        ca[i * 4 + 3] = L.size * smoothstep(0, 0.04, s) * smoothstep(1, 0.96, s) * (0.8 + 0.2 * Math.sin(time * 3.1 + L.ph * 7));
      }
      eyes.forEach((e, j) => {
        const t = time * 0.4 + e.ph, f = t - Math.floor(t);
        // a blink: shut for a twelfth of each 2.5 s, and gone altogether for one stretch in four
        const open = (f > 0.08 ? 1 : 0) * (Math.sin(Math.floor(t) * 12.9898 + e.ph) > -0.5 ? 1 : 0);
        for (const sd of [0, 1]) { const i = NL + j * 2 + sd; pa[i * 3] = e.x + (sd ? e.tx : -e.tx); pa[i * 3 + 1] = e.y; pa[i * 3 + 2] = e.z + (sd ? e.tz : -e.tz); ca[i * 4 + 3] = 0.42 * open; }
      });
      aPos.needsUpdate = true; aCol.needsUpdate = true;
    });
  }
  await ctx.yield();

  // ---- the brig in the creek: 34 m of black hull lying low, foul with weed along her waterline, two masts of 28 m with
  // yards and furled sails (one hangs loose, by the seed), a list by the seed, one green lamp at her side and its stain on
  // the water, a lantern at her bow: all three burn always
  const brigU = { uTime: { value: 0 }, uK: { value: 1 } };
  {
    const [bx, bz] = PLACES.brig, [dx, dz] = PLACES.creekDir, yaw = Math.atan2(dx, dz), M = makeMesher();
    const ship = new THREE.Group(); ship.position.set(bx, -0.5, bz); ship.rotation.set(0, yaw, lay.lean * 0.05, 'YXZ'); object.add(ship);
    // the hull: stations from stern (z -17) to stem (z 17), each a curve from keel to rail
    const NS = 22, NR = 7, pos = [], col = [], idx = [], c = new THREE.Color();
    const half = (z) => z > 0 ? 4 * Math.pow(Math.max(1 - Math.pow(z / 17, 2.2), 0), 0.6) : 4 * (1 - 0.32 * Math.pow(-z / 17, 2.5));
    const rail = (z) => 3.3 + 1.3 * Math.pow(Math.abs(z) / 17, 2) + (z < -11 ? 1.2 * smoothstep(-11, -13, z) : 0);
    for (const sd of [-1, 1]) for (let i = 0; i <= NS; i++) {
      const z = -17 + 34 * i / NS, b = half(z), ry = rail(z);
      for (let j = 0; j <= NR; j++) {
        const t = j / NR, y = lerp(-1.6, ry, t);
        pos.push(sd * b * (1 - Math.pow(1 - t, 2.4)), y, z + (z > 0 ? 2.2 * t * Math.pow(z / 17, 3) : 0));
        // black above, a pale strake under the rail, weed from the waterline down and in streaks above it
        const weed = smoothstep(1.5 + 0.8 * Math.sin(z * 1.7 + sd), 0.3, y);
        c.set(t > 0.82 && t < 0.93 ? '#6a5a3c' : '#2e2a28').lerp(new THREE.Color('#33503a'), weed * 0.85); col.push(c.r, c.g, c.b);
      }
    }
    const row = NR + 1, side = (NS + 1) * row;
    for (let sdi = 0; sdi < 2; sdi++) for (let i = 0; i < NS; i++) for (let j = 0; j < NR; j++) {
      const a = sdi * side + i * row + j, b = a + row;
      if (sdi) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
    const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); hg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); hg.setIndex(idx); hg.computeVertexNormals();
    const hullMat = shade.patch(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    ship.add(new THREE.Mesh(hg, hullMat));
    await ctx.yield();
    // deck, stern board, deck houses, masts, yards, furled sails, bowsprit
    for (let i = 0; i < 9; i++) { const z = -15 + i * 3.6; M.add(new THREE.BoxGeometry(2 * half(z) - 0.3, 0.2, 3.7), mat(0, rail(z) - 1.0, z), '#6e604e'); }
    M.add(new THREE.BoxGeometry(5.3, 3.2, 0.3), mat(0, 3.4, -17), '#2a2422');
    M.add(new THREE.BoxGeometry(4.2, 1.5, 5), mat(0, 4.6, -13), '#3a2e26'); M.add(new THREE.BoxGeometry(2.4, 1.1, 3), mat(0, 3.4, 0), '#3a2e26');
    const masts = [[6, 28, 0.02], [-5.5, 28, 0.05]], yardGeo = (len) => new THREE.CylinderGeometry(0.14, 0.14, len, 6).rotateZ(Math.PI / 2), tops = [];
    masts.forEach(([z, h, rake], mi) => {
      M.add(new THREE.CylinderGeometry(0.16, 0.36, h, 8), mat(0, 2.4 + h / 2, z - rake * h / 2, 0, -rake), '#8f887c');
      tops.push(V3(0, 2.4 + h, z - rake * h));
      [[9, 15], [16, 12], [22.5, 8.5]].forEach(([y, len], yi) => {
        const zz = z - rake * y + 0.4, loose = lay.loose === mi * 2 + yi && yi < 2;
        M.add(yardGeo(len), mat(0, 2.4 + y, zz, 0, 0, (mi ? -1 : 1) * 0.04), '#7f786e');
        if (!loose) M.add(new THREE.CapsuleGeometry(0.42, len * 0.8, 3, 8).rotateZ(Math.PI / 2), mat(0, 2.4 + y - 0.42, zz, 0, 0, (mi ? -1 : 1) * 0.04, 1, 0.72, 0.72), '#bdb6a6');
        else {
          // the loose sail: a cloth hanging from its yard, bellying in the wind
          const sg = new THREE.PlaneGeometry(len * 0.8, 4.2, 10, 6); sg.translate(0, -2.1, 0);
          const sail = new THREE.Mesh(sg, shade.patch(new THREE.MeshLambertMaterial({ color: '#857c6c', side: THREE.DoubleSide }))); sail.position.set(0, 2.4 + y - 0.2, zz); ship.add(sail);
          const base = sg.attributes.position.array.slice();
          updates.push((dt, time) => { const a = sg.attributes.position.array; for (let k = 0; k < a.length; k += 3) { const hang = -base[k + 1] / 4.2; a[k + 2] = hang * (0.9 * Math.sin(time * 1.3 + base[k] * 0.5) + 0.5 * Math.sin(time * 2.1 + base[k + 1] * 1.3) + 1.2); a[k] = base[k] * (1 - 0.25 * hang * hang); } sg.attributes.position.needsUpdate = true; });
        }
      });
    });
    const sprit = V3(0, 7.6, 26); M.add(new THREE.CylinderGeometry(0.1, 0.2, 10, 6), mat(0, 6.1, 21.3, 0, 1.25), '#8f887c');
    // rigging: stays and shrouds as thin stems (wide enough not to break up far off)
    const rope = (a, b) => { const len = a.distanceTo(b), m4 = new THREE.Matrix4().lookAt(a, b, V3(0, 1, 0)).multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); m4.setPosition(a.clone().lerp(b, 0.5)); M.add(new THREE.CylinderGeometry(0.045, 0.045, len, 4), m4, '#1c1a1c'); };
    rope(tops[0], sprit); rope(tops[0].clone().setY(20), V3(0, 6.6, 23)); rope(tops[0], tops[1]); rope(tops[1], V3(0, 5.6, -17)); rope(tops[1].clone().setY(20), tops[0].clone().setY(11));
    masts.forEach(([z], mi) => { for (const sd of [-1, 1]) for (const off of [-1.6, 0, 1.6]) rope(tops[mi].clone().setY(21), V3(sd * half(z) * 0.98, rail(z), z + off - 1.5)); });
    ship.add(new THREE.Mesh(M.build(), plainMat));
    await ctx.yield();
    // a long pennant at the main top, streaming
    { const pg = new THREE.PlaneGeometry(4.6, 0.7, 8, 1); pg.translate(2.3, 0, 0); const pen = new THREE.Mesh(pg, shade.patch(new THREE.MeshLambertMaterial({ color: '#7a2a2e', side: THREE.DoubleSide }))); pen.position.copy(tops[1]).y -= 0.5; pen.rotation.y = 1.0; ship.add(pen);
      const base = pg.attributes.position.array.slice();
      updates.push((dt, time) => { const a = pg.attributes.position.array; for (let k = 0; k < a.length; k += 3) { const t = base[k] / 4.6; a[k + 2] = t * 0.7 * Math.sin(time * 5 - base[k] * 2.2); a[k + 1] = base[k + 1] * (1 - 0.8 * t) - 0.5 * t * t + 0.15 * t * Math.sin(time * 3.3 - base[k] * 1.5); } pg.attributes.position.needsUpdate = true; }); }
    // the green lamp on the side the creek's channel passes, and the lantern at her bow
    const lampL = V3(-4.25, 4.9, -2), lanternL = V3(0, 6.6, 22.3), lampMesh = makeMesher();
    lampMesh.add(new THREE.BoxGeometry(0.45, 0.6, 0.45), mat(lampL.x, lampL.y, lampL.z), '#ffffff');
    const greenMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 2.6, 1.2) }), warmMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.7, 0.8) });
    ship.add(new THREE.Mesh(lampMesh.build(), greenMat), new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5).translate(lanternL.x, lanternL.y, lanternL.z), warmMat));
    ship.updateMatrixWorld(true);
    const lampW = lampL.clone().applyMatrix4(ship.matrixWorld), lanternW = lanternL.clone().applyMatrix4(ship.matrixWorld);
    const glow = fx.makeGlows({ rng: S.brig, positions: [lampW, lanternW], colors: ['#3fe08a', '#ffd9a0'], sizes: [1, 0.8], size: 3.4, intensity: 2.4, halo: 1, fogAmount: 0.3 });
    object.add(glow.object);
    // both burn always; each lights what stands within its reach (the second and third of the shade's lamps): the green
    // lamp her side, rail and deck for 10 m, the lantern her bow for 8 m
    shade.lamp(1, lampW.x - (-dz) * 0.6, lampW.y, lampW.z - dx * 0.6, 10); shade.lampColor(1, 0.25, 2.2, 1.0);
    shade.lamp(2, lanternW.x, lanternW.y, lanternW.z, 8); shade.lampColor(2, 2.2, 1.5, 0.7);
    // the lamp's stain on the water: a patch of green from her side out toward the channel, shaking with the ripples
    const out = V3(-dz, 0, dx).multiplyScalar(-1), sc = V3(lampW.x + out.x * 8, 0.38, lampW.z + out.z * 8), sg = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
    const stain = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: brigU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv * 2. - 1.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`uniform float uTime, uK; varying vec2 vUv;
        void main(){ float r = length(vUv * vec2(1., 1.9));
          float sh = .55 + .45 * sin(vUv.x * 34. + uTime * 2.6 + 3. * sin(vUv.y * 9. + uTime * 1.3)) * sin(vUv.x * 13. - uTime * 1.7);
          gl_FragColor = vec4(vec3(.1, .88, .42) * smoothstep(1., .1, r) * sh * .55 * uK, 1.); }` }));
    stain.position.copy(sc); stain.scale.set(18, 1, 9); stain.rotation.y = Math.atan2(out.x, out.z) + Math.PI / 2; stain.renderOrder = 4; object.add(stain);
    updates.push((dt, time) => { brigU.uTime.value = time; ship.rotation.x = 0.012 * Math.sin(time * 0.5); ship.position.y = -0.5 + 0.08 * Math.sin(time * 0.6); });
    object.userData.lamp = lampW; object.userData.lantern = lanternW;
  }
  await ctx.yield();


  // ---- THE THREE FILES AND THEIR ROUND. The shore path runs round the island 9 m in from the water. On the south
  // face it is laid a second time 17 m further inland, and the two lines are joined at their ends into one closed
  // ROUND, all of it on ground that stands 75 m and more from the flight's line: found on the seed's own shore before
  // the wood is dealt and tested whole against the whole line (fileRound, above the forest). Three files walk the
  // round the same way at one pace on the world clock, a third of the round apart, from a start dealt by their
  // stream: six small walkers, nine larger with one lantern, four beasts. Nobody shrinks, sinks or is hidden by a
  // rule: a file is out of sight only where land or trees stand between. The path is bare: it bends round the hut,
  // and no tree or palm stands with its bark within 0.9 m of it. (stems: for the check on many seeds.)
  const stems = [[PLACES.hut[0], PLACES.hut[1], 3.6]];
  for (const t of trunks) stems.push([t.x, t.z, t.r]);
  for (const t of trees) stems.push([t.x, t.z, 1.2 * t.s]);
  for (const t of palms) stems.push([t.x, t.z, 0.45 * t.s]);
  await ctx.yield();
  {
    const walkers = [], third = round.len / 3;
    for (let f = 0; f < 3; f++) {
      const n = [6, 9, 4][f];
      for (let i = 0; i < n; i++) walkers.push({ s: f * third + i * (f === 2 ? 2.6 : 1.3) + S.files.range(-0.25, 0.25), tall: f === 0 ? S.files.range(1.0, 1.25) : f === 1 ? S.files.range(1.6, 1.9) : S.files.range(0.9, 1.3), beast: f === 2, ph: S.files() * TAU, lamp: f === 1 && i === 0 });
    }
    // where on the round the three files are at clock 0 is dealt by their stream (a third of the round kept between files)
    { const start = S.files() * round.len; for (const w of walkers) w.s += start; }
    const M = makeMesher();
    M.add(new THREE.CylinderGeometry(0.16, 0.2, 0.72, 6), mat(0, 0.62, 0), '#1d1b24'); M.add(new THREE.SphereGeometry(0.13, 6, 5), mat(0, 1.0, 0), '#221f26');
    for (const sd of [-1, 1]) M.box(0.11, 0.3, 0.12, mat(sd * 0.09, 0.14, 0), '#17161c');
    const folk = new THREE.InstancedMesh(M.build(), plainMat, 15); folk.frustumCulled = false; object.add(folk);
    const Mb = makeMesher();
    Mb.box(0.42, 0.42, 1.25, mat(0, 0.62, 0), '#1b1a1f'); Mb.box(0.3, 0.3, 0.4, mat(0, 0.78, 0.78), '#1f1d22');
    for (const [lx, lz] of [[-0.14, 0.45], [0.14, 0.45], [-0.14, -0.45], [0.14, -0.45]]) Mb.box(0.1, 0.45, 0.1, mat(lx, 0.22, lz), '#151418');
    const beasts = new THREE.InstancedMesh(Mb.build(), plainMat, 4); beasts.frustumCulled = false; object.add(beasts);
    Object.assign(dealt, { round, stems, palms, walkers, folk, beasts });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshBasicMaterial({ color: '#ffc46a', fog: false })); object.add(lamp);
    const pA = V3(), pB = V3();
    // a round that could not be laid on this shore leaves its files out (count 0): none is ever drawn off the round
    if (!round.n) { folk.count = 0; beasts.count = 0; lamp.visible = false; }
    else updates.push((dt, time) => {
      let nf = 0, nb = 0;
      for (const w of walkers) {
        round.at(w.s + time * 1.3, pA); round.at(w.s + time * 1.3 + 1.5, pB);
        const ry = Math.atan2(pB.x - pA.x, pB.z - pA.z), bob = 0.04 * Math.sin(time * 6.5 + w.ph), y = pA.y - 0.05;
        if (w.beast) beasts.setMatrixAt(nb++, mat(pA.x, y + bob, pA.z, ry, 0.03 * Math.sin(time * 6.5 + w.ph), 0, w.tall));
        else { folk.setMatrixAt(nf++, mat(pA.x, y + bob, pA.z, ry, 0, 0.05 * Math.sin(time * 3.25 + w.ph), w.tall)); if (w.lamp) lamp.position.set(pA.x + Math.cos(ry) * 0.4, y + 1.2 * w.tall, pA.z - Math.sin(ry) * 0.4); }
      }
      folk.instanceMatrix.needsUpdate = true; beasts.instanceMatrix.needsUpdate = true;
    });
  }
  await ctx.yield();

  // ---- on the rare visit: a kite with a long tail adrift over the lagoon, 30 m up, turning slowly on the evening air
  if (opts.rare) {
    const kite = new THREE.Group(), kg = new THREE.BufferGeometry();
    kg.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.3, 0, -0.85, 0.25, 0.12, 0, -1.2, 0, 0, 1.3, 0, 0, -1.2, 0, 0.85, 0.25, 0.12], 3));
    kg.setAttribute('color', new THREE.Float32BufferAttribute([0.75, 0.2, 0.14, 0.75, 0.2, 0.14, 0.75, 0.2, 0.14, 0.86, 0.72, 0.3, 0.86, 0.72, 0.3, 0.86, 0.72, 0.3], 3));
    kite.add(new THREE.Mesh(kg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide })));
    const tg = new THREE.PlaneGeometry(0.16, 12, 1, 24); tg.translate(0, -7.2, 0);
    const tail = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: '#d9c9a0', side: THREE.DoubleSide })), base = Float32Array.from(tg.attributes.position.array);
    kite.add(tail); object.add(kite);
    const kx = (PLACES.bowWest[0] + PLACES.rock[0]) / 2 - 20, kz = PLACES.rock[1] - 34, kph = S.kite() * TAU;
    updates.push((dt, time) => {
      kite.position.set(kx + 9 * Math.sin(time * 0.11 + kph), 30 + 3 * Math.sin(time * 0.17 + kph * 2), kz + 7 * Math.sin(time * 0.083 + 1.3 + kph));
      kite.rotation.set(0.5 + 0.12 * Math.sin(time * 0.9 + kph), 0.6 * Math.sin(time * 0.13 + kph), 0.2 * Math.sin(time * 0.7 + kph));
      const a = tg.attributes.position.array;
      for (let k = 0; k < a.length; k += 3) { const d = -(base[k + 1] + 1.2) / 12; a[k] = base[k] + d * 1.6 * Math.sin(time * 2.1 + d * 9 + kph); a[k + 2] = d * (2.2 + 0.9 * Math.sin(time * 1.4 + d * 6)); }
      tg.attributes.position.needsUpdate = true;
    });
  }

  // ---- the south face: the cave whose river falls 4 m to the sea, the hut going to decay on the cliff top, and the
  // round pool on the east height
  const fallU = { uTime: { value: 0 } };
  {
    const M = makeMesher(), [cvx, cvz0] = PLACES.cave; let cvz = cvz0; while (cvz < cvz0 + 40 && land.shore(cvx, cvz) > 0) cvz += 0.5;
    // the cave's mouth: a dark arch in the cliff's face above the waterline, the river's lip at its foot
    M.add(new THREE.CircleGeometry(3.1, 14, 0, Math.PI), mat(cvx, 3.6, cvz - 1.6, 0, -0.12), '#07080c'); M.box(6.2, 1.6, 0.3, mat(cvx, 2.9, cvz - 1.55, 0, -0.12), '#07080c');
    M.box(4.4, 0.5, 1.6, mat(cvx, 3.9, cvz - 1.2), '#4a463f');
    const fg = new THREE.PlaneGeometry(1.7, 4.6, 1, 6); fg.translate(0, 2.0, 0);
    const fall = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: fallU, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; vec3 p = position; p.z += (1. - uv.y) * (1. - uv.y) * 1.3; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragmentShader: /* glsl */`uniform float uTime; varying vec2 vUv;
        float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        void main(){ float x = vUv.x * 7., i = floor(x), f = fract(x); float a = mix(h1(i), h1(i + 1.), f * f * (3. - 2. * f));
          float s = .55 + .45 * sin((vUv.y * (5. + 3. * a) + uTime * (2.2 + a)) * 6.2832 * .5 + a * 30.);
          float edge = smoothstep(0., .3, vUv.x) * smoothstep(1., .7, vUv.x);
          gl_FragColor = vec4(vec3(.6, .7, .8) * (.45 + .55 * s), edge * (.25 + .5 * s * a) * smoothstep(1.02, .9, vUv.y)); }` }));
    fall.position.set(cvx, 0, cvz - 0.9); fall.renderOrder = 3; object.add(fall);
    // the hut: three leaning walls of poles and half a thatch, the other half fallen in
    const [hx, hz] = PLACES.hut, hy = land.height(hx, hz) - 0.1, hr = S.hut.range(-0.4, 0.4), H = (w, h, d, lx, ly, lz, col, ry = 0, rx = 0, rz = 0) => { const c = Math.cos(hr), sn = Math.sin(hr); M.box(w, h, d, mat(hx + lx * c + lz * sn, hy + ly, hz - lx * sn + lz * c, hr + ry, rx, rz), col); };
    H(4.4, 2.3, 0.2, 0, 1.15, -1.7, '#6a5a48', 0, 0.06); H(0.2, 2.2, 3.4, -2.2, 1.1, 0, '#62523f', 0, 0, 0.08); H(0.2, 1.5, 3.4, 2.2, 0.75, 0, '#6a5a48', 0, 0, -0.14);
    H(4.9, 0.18, 2.5, 0, 2.75, -0.95, '#8a7a50', 0, -0.62); H(4.6, 0.18, 2.4, 0.3, 1.05, 1.0, '#7a6c46', 0.12, 1.05); for (const px of [-2.2, 2.2]) H(0.18, 2.9, 0.18, px, 1.45, 1.6, '#4a3c2e', 0, 0, px * 0.04);
    // the pool: a round of calm water 5 m across its half, ringed with stones
    const [plx, , plz] = PLACES.pool, ply = land.height(plx, plz);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + S.hut.range(-0.1, 0.1), r = 5.3 + S.hut.range(-0.3, 0.4); M.add(new THREE.DodecahedronGeometry(S.hut.range(0.5, 0.9), 0), mat(plx + Math.cos(a) * r, ply + 0.1, plz + Math.sin(a) * r, a), '#6e675c'); }
    object.add(new THREE.Mesh(M.build(), plainMat));
    const pool = new THREE.Mesh(new THREE.CircleGeometry(5.2, 24).rotateX(-Math.PI / 2), shade.patch(new THREE.MeshStandardMaterial({ color: '#3a8f96', roughness: 0.12, metalness: 0.35 }))); pool.position.set(plx, ply + 0.3, plz); object.add(pool);
    updates.push((dt, time) => { fallU.uTime.value = time; });
  }
  await ctx.yield();

  const api = {
    object, radius: 95, height: 56, center: V3(PLACES.centre[0], 18, PLACES.centre[1]), ground: true, groundY: -0.4,
    land, terrain, shade, groundAt, lay, path,
    // for the gold lights' haunts: the great trees' crown tops, the well in the leaves, the route as points 2 m apart
    crowns, well, lane, laneFrom, dealt,
    // the one height of the sun on this visit (degrees)
    sunEl,
    anchors: {
      rock: V3(PLACES.rock[0], 2, PLACES.rock[1]), bowWest: V3(PLACES.bowWest[0], 0, PLACES.bowWest[1]), bowEast: V3(PLACES.bowEast[0], 0, PLACES.bowEast[1]),
      ring: V3(gx, 0, gz), mushroom: V3(PLACES.mushroom[0], 0, PLACES.mushroom[1]), redHouse: V3(...PLACES.redHouse), leafWell: V3(...PLACES.leafWell), shadeA: V3(PLACES.shadeA[0], 0, PLACES.shadeA[1]), shadeB: V3(PLACES.shadeB[0], 0, PLACES.shadeB[1]),
      creekAxis: V3(PLACES.creekDir[0], 0, PLACES.creekDir[1]), brig: V3(PLACES.brig[0], 0, PLACES.brig[1]), portalSeat: V3(...PLACES.portalSeat),
      lamp: object.userData.lamp, lantern: object.userData.lantern, fire: V3((mush.x + gx) / 2, mush.y + 6.5, (mush.z + gz) / 2), shower: V3(showerAt.x, SHOWER_BASE, showerAt.z), showerFar,
    },
    // the common glow of the lights gathered in the well: at the middle of their rounds, by their count
    wellGlow(g) { if (g && g.n) { shade.lamp(3, g.x, g.y, g.z, 26); wellGlowK = 0.45 * g.n; } },
    update(dt, time, camera) { for (const f of updates) f(dt, time, camera); },
    dispose() {},
  };
  return api;
}
