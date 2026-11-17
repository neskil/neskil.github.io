// WOOL ON THE THORN (carded-moor): a needle-felted Highland grouse moor crossed a metre above the heather inside a
// covey of red grouse, down a burn and up to the Snag, a granite tor that has caught a cloud like fleece on a thorn.
// Frame: -Z north, +X east (downwind: the gale blows toward +X). Datum 0 = the bog. The hero (src/parts/carded-moor.js)
// stands at HERO with its own frame unrotated. Everything is shaded by the hero's FELT chunk (style 'none').
// Flight (u): 0-0.20 over the brow and the heather shoulder with the covey, 0.20-0.42 bog (hares, then hinds on the peat
// ridge), 0.42-0.62 down the burn between cut peat banks (ewe at the water's edge at 0.51, stell, rowan; the rare eagle
// stoops past and flares in front of the lens at 0.55), 0.62-0.746 one straight ramp up a glen with the Snag standing
// over it and growing all the way (fox on its outcrop at 0.716), lift-off at 0.746, the stags on their crag against the
// wool at 0.78-0.81. THE CROWN (u 0.80-1): the land itself rises under the pull-up as a steep heather nose to a crest
// between the two thorns (crownY: the crest runs GAP under the fly line), and the fleece is heaped on its lee (east) side
// and up the east thorn. So the lens stays BELOW the cloud all the way: up the nose with two more stags on its brow and
// the ravens (or the eagle) over the thorn tips (0.84-0.88), over the brow in clear air (0.90-0.92: only a few fine wisps
// stream off the heather either side), then 60 m over heather with a fifth stag on a crag by the west thorn, the wool
// tower on the right (heaped billows down to a metre, seen from 7 m), the open moor on the left and the portal between the
// thorns, which stand to +97 and +91 so they show over the nose from the ramp. The portal's light stands up between
// the thorns as a glint from the bog onward. The covey is scheduled (CK): close and large over the first brow, far and
// small at 0.08 and on the ramp, gone over the bog and the burn. Heather cushions are instanced in 30 m segments: smooth mounds with a camera-
// facing fibre halo and lee shade near the lens, plainer ones further out, painted ones in the ground beyond. From the
// burn's foot on, a field of cheap mounds runs 56-80 m either side of the line and up under the tor (thinned by chance, so
// it has no edge), because the ramp and the hill are seen from the air after lift-off; the ground paints the same mounds
// (irregular, domed, lee-shaded, in the same purples and blaeberry greens) between and beyond them. The burn's toe slopes
// carry their own pass of small sphagnum cushions, deer-grass and rushes; the left bank dips before the stell so the fold
// is seen from the water. Hares (u 0.195-0.31) run on fixed landing points and tire, so the lens gains on them: at u 0.25
// the nearest three are 5-7.5 m ahead-right. Everything added after the first layout draws from forks of `fx`, so the
// first layout's random stream (pools, rocks, ewes, birds) is unchanged.
// ROUND 6: the light is an event. The morning look has a 15 degree sun from the east: every mound carries a lit crown
// and a shaded lee (gSun in FELT; moundSun for the built ones, the same in the ground's paint), the land bakes cast shade
// (sunAt: the burn's sunward bank, the hag, the dyke, the Snag hill's west flank), cloud shadows drift (feltS), the sky warms
// toward the sun and thin mist sheets lie in the bog and the far hollows. The lens flies `flyPath` (the land is still laid
// from `path`): it comes in 7 m up looking over five ewes, a drystone dyke and the misted bog at the Snag in a gap of the
// far hills (u 0-0.05), stoops over six ewes in the lee of the dyke (0.08), and meets sixteen hinds that stand at the
// bog's edge (0.16) and then gallop beside it and up a peat hag (0.17-0.40). The burn wanders in S-bends between gravel
// bars over a fine bed mesh; its water shows the cobbles near the lens and the sky further off, with white water at three
// riffles and two falls. Bracken beds stand on the lower ramp. All of this draws from `nx`, a stream of its own.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { Geo } from '../kit/fauna/common.js';
import { buildHero, FELT, lightFor } from '../parts/carded-moor.js';

const DUR = 40, HERO = [-41, 62, -838], AZ = 0.3927;      // (round 7: the Snag's hill stands 24 m higher)
const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

// five curated looks (hour + weather + season); pal = the brief's seven in order
const LOOKS = {
  morning: { hour: 'morning', light: 'early', weather: 'gale', season: 'august', zen: '#6397d2', hor: '#f3dcb2', pad: '#eadfdc', fog: '#cdbfc6', fogDen: 0.0004, mist: [0.9, 0.0075, 0.85], mistCol: '#f0dfc6', exposure: 1.0, sun: 2.3, stars: 0, sh: 1, cloud: 0.55, term: 0.7, glow: ['#ffc98e', 0.55], sheets: 1,
    pal: ['#8B5FA3', '#6E8B3D', '#3E2C22', '#F3EDE0', '#8E8A90', '#A9C3D6', '#8A4526'], bell: '#9c4a93', young: '#6f8a44', sat: 1.1, name: 'Wool on the Thorn' },
  gold: { hour: 'gold', weather: 'gale', season: 'august', zen: '#6f86c6', hor: '#f2c08c', pad: '#f0cdb8', fog: '#d9b5a8', fogDen: 0.00037, mist: [2.5, 0.011, 0.5], mistCol: '#efd2b8', exposure: 1.0, sun: 2.2, stars: 0, sh: 1, cloud: 0.3, term: 0.7, glow: ['#ffb070', 0.5], sheets: 1.15,
    pal: ['#8B5FA3', '#6E8B3D', '#3E2C22', '#F3EDE0', '#8E8A90', '#A9C3D6', '#8A4526'], bell: '#9c4a93', young: '#6f8a44', sat: 1.08, name: 'Wool on the Thorn: First Gold' },
  moon: { hour: 'moon', weather: 'gale', season: 'august', zen: '#0a1130', hor: '#2b3a6a', pad: '#39466f', fog: '#1d2a50', fogDen: 0.00042, mist: [-3, 0.004, 0.3], mistCol: '#3d4f86', exposure: 1.3, sun: 3.0, stars: 1, sh: 0.6, cloud: 0.25, term: 0.5, glow: ['#5a6aa8', 0.25], sheets: 0.7,
    pal: ['#8B5FA3', '#6E8B3D', '#3E2C22', '#F3EDE0', '#8E8A90', '#A9C3D6', '#8A4526'], bell: '#9c4a93', young: '#6f8a44', sat: 1.0, name: 'Wool on the Thorn: Full Moon' },
  hillfog: { hour: 'morning', weather: 'fog', season: 'june', zen: '#9db4c8', hor: '#e6e1d6', pad: '#cfcdd4', fog: '#cfcbcf', fogDen: 0.0005, mist: [4.5, 0.02, 0.8], mistCol: '#dedad2', exposure: 0.98, sun: 1.6, stars: 0, sh: 0.2, cloud: 0, term: 0.15, glow: ['#ffffff', 0], sheets: 0,
    pal: ['#55683f', '#7c9a3f', '#3E2C22', '#F3EDE0', '#8E8A90', '#A9C3D6', '#8A4526'], bell: '#7a4a7c', young: '#86a04a', sat: 1.08, name: 'Wool on the Thorn: Hill Fog' },
  rut: { hour: 'morning', weather: 'shower', season: 'rut', zen: '#7790b4', hor: '#e6d8be', pad: '#c4c0cc', fog: '#c0b8c0', fogDen: 0.00046, mist: [-3, 0.004, 0.3], mistCol: '#dcd3c8', exposure: 1.0, sun: 1.7, stars: 0, sh: 0.6, cloud: 0.85, term: 0.5, glow: ['#e8d2b0', 0.3], sheets: 0.6,
    pal: ['#9b5f6c', '#8f8438', '#3E2C22', '#F3EDE0', '#8E8A90', '#A9C3D6', '#8A4526'], bell: '#b06a3a', young: '#b08a34', sat: 1.1, name: 'Wool on the Thorn: The Rut' },
};

// ---------------------------------------------------------------- shared GLSL
const NAP_V = /* glsl */`float nap(vec3 w){ float a = w.x - uTime * 14., c = w.z; return sin(a * .1047 + sin(c * .021) * 1.7 + sin(c * .057 + a * .013) * .8); }`;
const VERT_PARS = /* glsl */`
#include <common>
#include <fog_pars_vertex>
uniform float uTime, uWindK;
varying vec3 vWorld, vObj, vNrm, vCol;
` + NAP_V;
// scene fog (own density uniform: the three.js one is steered for the hero) plus a wool-mist layer pooled in the hollows
const ATMOS = /* glsl */`
uniform vec4 uMist; uniform vec3 uMistCol; uniform float uFogBase;
vec3 atmos(vec3 c){
  #ifdef USE_FOG
  float d = vFogDepth;
  float a = clamp(-uMist.z * (cameraPosition.y - uMist.x), -20., 0.), b = clamp(-uMist.z * (vWorld.y - uMist.x), -20., 0.), t = b - a;
  float f = abs(t) > 1e-3 ? (exp(b) - exp(a)) / t : exp(a);
  float drift = .65 + .7 * vn3(vec3(vWorld.x * .035 - uTime * .07, vWorld.y * .12, vWorld.z * .035 + uTime * .02));
  c = mix(c, uMistCol, (1. - exp(-uMist.y * d * max(f, 0.) * drift)) * uMist.w);
  c = mix(c, fogColor, 1. - exp(-uFogBase * uFogBase * d * d));
  #endif
  return c; }
// The light event. uShade = (how hard a mound shades its neighbour, cloud shadows, how hard a lee face goes dark). Broad cloud
// shadows cross the moor with the gale (never over the Snag's own hill), and a face turned from the low sun loses the sun.
uniform vec4 uShade; uniform vec2 uHeroXZ;
float cloudSun(vec3 w){ vec2 p = w.xz - vec2(uTime * 5.5, uTime * 1.2);
  float n = vn3(vec3(p * .0043, 1.7)) * .62 + vn3(vec3(p * .0105 + 31., 4.3)) * .38;
  return 1. - uShade.y * smoothstep(110., 300., distance(w.xz, uHeroXZ)) * smoothstep(150., 310., distance(w.xz, vec2(0., -70.))) * smoothstep(.47, .66, n); }
// the two cairn stacks throw one long shadow down-sun across the hill and the moor (uTower: x, z, top, half-width)
uniform vec4 uTower;
float towerSun(vec3 w){ vec2 sd = normalize(uSunDir.xz + vec2(1e-5, 0.)), tp = uTower.xy - w.xz; float al = dot(tp, sd), pr = abs(tp.x * sd.y - tp.y * sd.x);
  float hr = w.y + al * uSunDir.y / max(length(uSunDir.xz), .05);
  return 1. - uShade.x * .72 * smoothstep(10., 34., al) * (1. - smoothstep(uTower.w + .012 * al, uTower.w + 7. + .04 * al, pr)) * (1. - smoothstep(uTower.z - 34., uTower.z, hr)); }
vec3 feltS(vec3 base, vec3 N, vec3 V, vec3 obj, vec3 world, float grain, float ao, float napK){
  gSun *= cloudSun(world) * mix(1., smoothstep(-.3, .22, dot(N, uSunDir)), uShade.z);
  return felt(base, N, V, obj, world, grain, ao, napK); }
#define felt feltS
`;
const FRAG_PARS = /* glsl */`
#include <common>
#include <fog_pars_fragment>
varying vec3 vWorld, vObj, vNrm, vCol;
` + FELT + ATMOS;
const VN_END = /* glsl */`vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;

// ---------------------------------------------------------------- small geometry helpers
class Buf {
  constructor(layout) { this.layout = layout; this.d = {}; this.keys = Object.keys(layout); this.sz = this.keys.map((k) => layout[k]); this.arr = this.keys.map((k) => (this.d[k] = [])); this.idx = []; this.n = 0; }
  push(v) { const K = this.keys; for (let j = 0; j < K.length; j++) { const a = v[K[j]], d = this.arr[j], n = this.sz[j]; for (let i = 0; i < n; i++) d.push(a[i]); } return this.n++; }
  build(normals = false) {
    const g = new THREE.BufferGeometry();
    for (const k in this.layout) g.setAttribute(k, new THREE.BufferAttribute(new Float32Array(this.d[k]), this.layout[k]));
    g.setIndex(this.n > 65535 ? new THREE.BufferAttribute(new Uint32Array(this.idx), 1) : new THREE.BufferAttribute(new Uint16Array(this.idx), 1));
    if (normals) g.computeVertexNormals();
    return g;
  }
  // the same geometry with its normals, handing the page back between the copy and the normals
  async buildAsync(ctx) { const g = this.build(false); await ctx.yield?.(); g.computeVertexNormals(); return g; }
}
function icoData(detail) {
  let g = new THREE.IcosahedronGeometry(1, detail); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g, 1e-4);
  const o = { pos: g.attributes.position.array.slice(), idx: Array.from(g.index.array) }; g.dispose(); return o;
}

export default {
  id: 'carded-moor',
  name: 'Wool on the Thorn',
  category: 'wilderness',
  weirdness: 0.35,
  media: ['air'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();
    const disposables = [];

    // ---------------------------------------------------------------- the look of this visit
    const lr = rng.fork('covey');
    let lookId;
    if (vary.hour === 'night') lookId = 'moon';
    else if (vary.hour === 'dawn' || vary.hour === 'golden') lookId = 'gold';
    else if (vary.hour === 'day') lookId = lr.pick(['morning', 'morning', 'hillfog', 'rut']);
    else lookId = lr.pick(['morning', 'morning', 'morning', 'gold', 'gold', 'moon', 'hillfog', 'rut', 'rut']);
    const LK = LOOKS[lookId], night = lookId === 'moon';
    const cast = { harrier: lr.chance(0.3), eagle: lr.chance(0.3), foxSide: lr.chance(0.7) ? 1 : -1, tallStell: lr.range(0.9, 1.15) };
    const rare = !!vary.rare;
    const fx = lr.fork('more');      // everything added later draws from forks of this, so the first layout stays as it was
    const pal = LK.pal.map((h) => new THREE.Color(h));
    const [cHeather, cMoss, cPeat, cWhite, cGranite, cSky, cRusset] = pal;
    const L = lightFor(LK.light || LK.hour);
    if (lookId === 'hillfog') { L.sunColor.multiplyScalar(0.82); L.fill.multiplyScalar(1.25); }
    if (lookId === 'rut') { L.sunColor.multiplyScalar(0.93); L.fill.multiplyScalar(1.1); }
    if (night) { L.sunColor.multiplyScalar(1.5); L.fill.multiplyScalar(1.7); L.bounce.multiplyScalar(1.6); L.rim.multiplyScalar(1.5); }
    const fogCol = C(LK.fog), mistCol = C(LK.mistCol);
    scene.fog = new THREE.FogExp2(fogCol, LK.fogDen);
    // uniforms shared by every material of this file (one object per uniform, so one write updates them all)
    const SH = {
      uTime: { value: 0 }, uWindK: { value: 1 }, uSunDir: { value: L.sunDir.clone() }, uSunCol: { value: L.sunColor.clone() }, uFillCol: { value: L.fill.clone() },
      uBounceCol: { value: L.bounce.clone() }, uRimCol: { value: L.rim.clone() }, uMist: { value: new THREE.Vector4(LK.mist[0], LK.mist[1], LK.mist[2], 0.92) },
      uMistCol: { value: mistCol }, uFogBase: { value: LK.fogDen },
      uShade: { value: new THREE.Vector4(LK.sh, LK.cloud, LK.term, 0) }, uHeroXZ: { value: new THREE.Vector2(HERO[0], HERO[2]) },
      uTower: { value: new THREE.Vector4(HERO[0], HERO[2], HERO[1] + 152, 13 + 15 * Math.abs(Math.cos(AZ) * L.sunDir.z + Math.sin(AZ) * L.sunDir.x) / Math.max(0.05, Math.hypot(L.sunDir.x, L.sunDir.z))) },
    };
    // everything this round adds draws from forks of `nx`, a stream of its own, so no earlier layout moves
    const nx = makeRng(hashSeed('r6:' + ctx.seed));
    const n7 = makeRng(hashSeed('r7:' + ctx.seed));      // (round 7's own stream)
    const sunXZ = new THREE.Vector2(L.sunDir.x, L.sunDir.z).normalize(), sunTan = L.sunDir.y / Math.max(0.05, Math.hypot(L.sunDir.x, L.sunDir.z));
    const U = (extra = {}) => ({ ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...SH, ...extra });
    const feltMat = (o) => { const m = new THREE.ShaderMaterial({ fog: true, ...o, uniforms: U(o.uniforms || {}) }); return m; };

    // ---------------------------------------------------------------- the camera path (the hero's fly line is analytic)
    const Ax = Math.sin(AZ), Az = Math.cos(AZ);
    const fly = (s, y) => [HERO[0] + Ax * s, HERO[1] + y, HERO[2] + Az * s];
    // The approach is one straight heather ramp from the tarn at the burn's foot to a knee under the fleece's south lip:
    // nothing convex lies between the lens and the Snag, so it stands over the ramp from the foot on. rampY = local height.
    const RAMP_K = 64, RAMP_M = 0.29165, sp = (t) => (t + Math.sqrt(t * t + 196)) * 0.5;
    const rampY = (s) => 3.2 * Math.exp(-s * s / 1100) - 0.00006 * Math.min(s, 110) ** 2 - 0.006 * Math.max(0, s - 110) - RAMP_M * sp(s - RAMP_K);
    const S_AIR = 222;
    // `path` is the line the land is laid from (the ground lies 1.5 m under it over the heath). The lens flies `flyPath`: the same
    // line, but it comes in 7 m above the heather shoulder, with the bog, its mist, the burn and the whole of the Snag's hill
    // in view from the first frame, and stoops to the heather tops over the first eighth of the journey.
    const OPEN_Y = [15.4, 18.6, 15.4, 10.8, 7.1];
    const pathPts = (open) => [
      [0, open[0], 22], [0, open[1], -10], [0, open[2], -48], [1, open[3], -92], [10, open[4], -128], [32, 3.2, -160], [60, 1.6, -190], [88, 1.5, -222], [108, 1.4, -258], [114, 1.2, -298], [108, 0.6, -336],
      [104, -3.6, -388], [101, -8.2, -442], [95, -13.4, -495],
      // up the ramp 1.6 m over the heather, then the pull-up into the wool
      fly(339, rampY(339) + 1.6), fly(315, rampY(315) + 1.6), fly(290, rampY(290) + 1.6), fly(265, rampY(265) + 1.6), fly(242, rampY(242) + 1.75), fly(S_AIR, rampY(S_AIR) + 2.3),
      fly(195, -28.5), fly(168, -10.5), fly(141, 8.5), fly(115, 27), fly(90, 38), fly(60, 41.75), fly(30, 44.4), fly(0, 47),
    ];
    await ctx.yield();
    const path = makePath(pathPts([11.6, 11.3, 10.3, 9.0, 6.6]));
    await ctx.yield();
    const flyPath = makePath(pathPts(OPEN_Y)), PLF = flyPath.length;
    await ctx.yield();
    const PL = path.length, NS = 512;
    const sx = new Float32Array(NS + 1), sy = new Float32Array(NS + 1), sz = new Float32Array(NS + 1), stx = new Float32Array(NS + 1), stz = new Float32Array(NS + 1);
    { const p = new THREE.Vector3(), t = new THREE.Vector3();
      for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, p); path.tangentAt(i / NS, t); const hl = Math.hypot(t.x, t.z) || 1; sx[i] = p.x; sy[i] = p.y; sz[i] = p.z; stx[i] = t.x / hl; stz[i] = t.z / hl; } }
    // ROUND 14: THE ROUTE'S OWN LINE, for three bodies that are kept off the lens BY PLACE (two ewes, the far coveys, the pipits).
    // The lens flies flyPath itself (the engine's sway only turns it), so a body's skin is clear of the lens wherever it is clear of
    // that line. rl*: the line at RLN + 1 places evenly spaced along its length, a metre or a little less apart. lineNear: the sample nearest a spot in plan. lineAir: the least distance
    // in space from a point to the line's chords within w samples of i0. linePlan: the nearest place of the whole line in plan
    // (LP: metres from it, the line's own height and heading there, the side the spot is on (+ = right of travel), the chord).
    const RLN = Math.ceil(PLF), rlx = new Float64Array(RLN + 1), rly = new Float64Array(RLN + 1), rlz = new Float64Array(RLN + 1), LP = { d: 0, y: 0, tx: 0, tz: 0, side: 1, i: 0 };
    { const p = new THREE.Vector3(); for (let i = 0; i <= RLN; i++) { flyPath.posAtDist(PLF * i / RLN, p); rlx[i] = p.x; rly[i] = p.y; rlz[i] = p.z; } }
    const lineNear = (x, z) => { let best = Infinity, bi = 0; for (let i = 0; i <= RLN; i += 8) { const dx = rlx[i] - x, dz = rlz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      for (let i = Math.max(0, bi - 8), b = Math.min(RLN, bi + 8); i <= b; i++) { const dx = rlx[i] - x, dz = rlz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } return bi; };
    const lineAir = (x, y, z, i0, w) => { let best = Infinity;
      for (let i = Math.max(0, i0 - w), b = Math.min(RLN - 1, i0 + w - 1); i <= b; i++) { const ax = rlx[i], ay = rly[i], az = rlz[i], vx = rlx[i + 1] - ax, vy = rly[i + 1] - ay, vz = rlz[i + 1] - az;
        const t = clamp(((x - ax) * vx + (y - ay) * vy + (z - az) * vz) / (vx * vx + vy * vy + vz * vz), 0, 1), dx = x - ax - vx * t, dy = y - ay - vy * t, dz = z - az - vz * t, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
      return Math.sqrt(best); };
    const linePlan = (x, z) => { const i0 = lineNear(x, z); let best = Infinity;
      for (let i = Math.max(0, i0 - 2), b = Math.min(RLN - 1, i0 + 1); i <= b; i++) { const ax = rlx[i], az = rlz[i], vx = rlx[i + 1] - ax, vz = rlz[i + 1] - az, l2 = vx * vx + vz * vz, t = clamp(((x - ax) * vx + (z - az) * vz) / l2, 0, 1), dx = x - ax - vx * t, dz = z - az - vz * t, d = dx * dx + dz * dz;
        if (d < best) { best = d; const l = Math.sqrt(l2); LP.y = lerp(rly[i], rly[i + 1], t); LP.tx = vx / l; LP.tz = vz / l; LP.side = dx * -vz + dz * vx < 0 ? -1 : 1; LP.i = i; } }
      LP.d = Math.sqrt(best); return LP; };
    // (lineSag: how far the line itself bows off the table's chords: the most found at the chords' middles: the table's own
    // error, which every test below gives away on the safe side)
    const lineSag = (() => { const p = new THREE.Vector3(); let s = 0; for (let i = 0; i < RLN; i++) { flyPath.posAtDist(PLF * (i + 0.5) / RLN, p); s = Math.max(s, lineAir(p.x, p.y, p.z, i, 1)); } return s; })();
    // nearest path sample in plan: { d, lat (+ = right of travel), fi (fractional sample index), u }
    const NR = { d: 0, lat: 0, fi: 0, u: 0, y: 0 };
    const near = (x, z) => {
      let best = Infinity, bi = 0;
      for (let i = 0; i <= NS; i += 8) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      const a = Math.max(0, bi - 8), b = Math.min(NS, bi + 8);
      for (let i = a; i <= b; i++) { const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
      const dx = x - sx[bi], dz = z - sz[bi], al = dx * stx[bi] + dz * stz[bi];
      NR.d = Math.sqrt(best); NR.lat = dx * -stz[bi] + dz * stx[bi]; NR.fi = clamp(bi + al / (PL / NS), 0, NS); NR.u = NR.fi / NS;
      const i0 = Math.min(NS - 1, Math.floor(NR.fi)); NR.y = lerp(sy[i0], sy[i0 + 1], NR.fi - i0);
      return NR;
    };
    const uAt = (x, z) => near(x, z).u;
    const U_BOG = uAt(32, -160), U_BURN = uAt(108, -336), U_FOOT = uAt(89, -525), U_AIR = uAt(...fly(S_AIR, 0).filter((v, i) => i !== 1)), U_SEAT = 1;
    const U_EAGLE = clamp(0.55, U_BURN + 0.04, U_FOOT - 0.03), U_STAG = uAt(HERO[0] + Math.cos(AZ) * 10.5 + Ax * 169, HERO[2] - Math.sin(AZ) * 10.5 + Az * 169);
    const U_STEP1 = lerp(U_BURN, U_FOOT, 0.33), U_STEP2 = lerp(U_BURN, U_FOOT, 0.7), U_STELL = lerp(U_BURN, U_FOOT, 0.62);
    // a point beside the path: d metres along, lat metres to the right
    const beside = (d, lat, out) => { const fi = clamp(d / PL, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(fi)), f = fi - i;
      const x = lerp(sx[i], sx[i + 1], f), z = lerp(sz[i], sz[i + 1], f), tx = lerp(stx[i], stx[i + 1], f), tz = lerp(stz[i], stz[i + 1], f);
      out.x = x - tz * lat; out.z = z + tx * lat; return out; };
    await ctx.yield();

    // ---------------------------------------------------------------- the land: moor, bog, knoll, gully, glen and the Snag hill
    const HX = HERO[0], HY = HERO[1], HZ = HERO[2], o1 = rng.range(0, 100), o2 = rng.range(0, 100);
    const Rx = Math.cos(AZ), Rz = -Math.sin(AZ);          // right of the final approach (east, downwind); A = from the tor back toward the arriving lens
    // The crown: the Snag's hill ends in a steep heather nose that climbs under the pull-up to a crest between the two thorns.
    // The fleece is heaped against its lee (east) side, so the last 110 m are flown over purple heather with the wool lapping
    // at the right, the moor open on the left and the thorns and the portal ahead. Its crest is laid a set clearance under the
    // path (GAP by distance s from the tor along the approach line), its width by CW; its flanks fall at about 39 degrees.
    const TS = [], TY = []; for (let i = Math.floor(NS * 0.76); i <= NS; i++) { TS.push((sx[i] - HX) * Ax + (sz[i] - HZ) * Az); TY.push(sy[i] - HY); }
    const pathYs = (s) => { const n = TS.length - 1; if (s <= TS[n]) return TY[n]; if (s >= TS[0]) return TY[0]; let a = 0, b = n; while (b - a > 1) { const m = (a + b) >> 1; if (TS[m] >= s) a = m; else b = m; } return lerp(TY[a], TY[b], (TS[a] - s) / Math.max(1e-6, TS[a] - TS[b])); };
    const tab = (T, s) => { if (s <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (s <= T[i][0]) { const a = T[i - 1], b = T[i]; return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0])); } return T[T.length - 1][1]; };
    const GAP = [[0, 5.8], [60, 3.1], [80, 3.7], [96, 5.5], [110, 9.5], [119, 13], [130, 17], [144, 20.5], [160, 21.5], [174, 34]], CW = [[10, 26], [30, 20], [64, 13], [96, 9.5], [130, 8], [174, 7]];
    let crownOn = true;
    const crownY = (lx, lz) => { const s = lx * Ax + lz * Az, lat = lx * Rx + lz * Rz; if (s > 174 || s < -90 || Math.abs(lat) > 120) return -1e3;
      const sc = Math.max(s, 0), d = Math.max(0, Math.hypot(lat, Math.min(s, 0)) - tab(CW, sc));
      return pathYs(sc) - tab(GAP, sc) - 0.82 * (Math.sqrt(d * d + 16) - 4) + 0.45 * noise.n2(lx * 0.11 + o2, lz * 0.11) * smoothstep(1, 7, Math.abs(lat)); };
    const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k, 0, 1); return lerp(b, a, h) - k * h * (1 - h); };
    const smax = (a, b, k) => -smin(-a, -b, k);
    const hillG = (lx, lz) => {   // the hill under the tor, local height: the hero's rounded top and a spur under the fly line
      const r = Math.hypot(lx, lz), cs = r > 1e-3 ? (lx * Ax + lz * Az) / r : 0, wA = smoothstep(0.45, 0.93, cs), th = Math.atan2(lz, lx);
      const slope = 0.25 + 0.06 * noise.n2(Math.cos(th) * 1.2 + o1, Math.sin(th) * 1.2), r0 = 150 + 20 * noise.n2(Math.cos(th) * 1.5 + o2, Math.sin(th) * 1.5);
      // under the approach: the straight ramp (rampY)
      return 3.2 * Math.exp(-r * r / 1100) - 0.00006 * Math.min(r, 110) ** 2 - 0.006 * Math.max(0, r - 110) - lerp(slope * sp(r - r0), RAMP_M * sp(r - RAMP_K), wA);
    };
    const BOG = { x: 80 + rng.range(-6, 6), z: -250, rx: 1.12, r: 128 }, KNOLL = { x: 38 + rng.range(-8, 8), z: -262 + rng.range(-8, 8), r: rng.range(34, 42), h: rng.range(9, 14) };
    const baseH = (x, z) => {
      let h = 12 + 20 * noise.fbm2(x * 0.0024 + o1, z * 0.0024, 3) + 4 * noise.fbm2(x * 0.011, z * 0.011 + o1, 2);
      // (the far hills stand back in a broad saddle behind the Snag as the entry sees it, so the cairns and the wool stand against the sky)
      const sad = z < -1000 ? 1 - 0.8 * smoothstep(-1000, -1250, z) * Math.exp(-(((x + 41 * (22 - z) / 860) / (250 - 0.1 * (z + 838))) ** 2)) : 1;
      h += smoothstep(650, 2100, Math.hypot(x - 20, z + 420)) * (95 + 80 * noise.fbm2(x * 0.0011 + 7 + o2, z * 0.0011, 2)) * sad;
      h = lerp(h, 8, Math.exp(-(x * x + (z + 10) * (z + 10)) / 14400));
      h = lerp(h, 0, smoothstep(BOG.r + 45, BOG.r - 25, Math.hypot((x - BOG.x) / BOG.rx, z - BOG.z)));
      h += KNOLL.h * Math.exp(-((x - KNOLL.x) ** 2 + (z - KNOLL.z) ** 2) / (KNOLL.r * KNOLL.r));
      h += 290 * smoothstep(-1350, -2150, z) * (0.72 + 0.5 * noise.fbm2(x * 0.0013 + o1, z * 0.0013 + 3, 3)) * Math.exp(-(((x + 90) / 1700) ** 2)) * sad;   // grey-lilac hills behind the tor
      h = smin(h, -21.5 + 0.02 * Math.abs(x - 89) + 0.0026 * (z + 527) * (z + 527), 14);
      // a shallow glen runs from the tarn up to the tor along the approach, so the ramp is the high ground in it
      const ls = (x - HX) * Ax + (z - HZ) * Az, ll = (x - HX) * Az - (z - HZ) * Ax;
      const wG = smoothstep(440, 335, ls) * smoothstep(-40, 50, ls) * (1 - smoothstep(64, 200, Math.abs(ll)));
      if (wG > 0) h = lerp(h, Math.min(h, HY + rampY(Math.max(ls, 0)) - 6), wG);
      h = smax(h, HY + hillG(x - HX, z - HZ), 10);
      if (crownOn) { const c = crownY(x - HX, z - HZ); if (c > -500) h = smax(h, HY + c, 5); }
      return h;
    };
    // The hinds' ridge is a peat hag 11 m left of the line (the first layout had it at 17 m, lower-sloped). `legacy` = the land
    // as the first layout knew it (that ridge, a straight burn): its accept-and-reject tests are still made against that land,
    // so its random stream, and with it every rock, ewe and bird it placed, stays where it was.
    let legacy = false;
    const U_R0 = U_BOG + 0.085, U_R1 = U_BURN - 0.004, RIDGE_LAT = -11, RIDGE_SIG = 4.4, RIDGE_H = 4.6;
    const ridgeW = (u) => smoothstep(U_R0 - 0.03, U_R0, u) * (1 - smoothstep(U_R1 - 0.02, U_R1 + 0.012, u));
    const stepDrop = (u) => { let s = 0; for (const us of [U_STEP1, U_STEP2]) { const dm = (u - us) * PL; if (dm > -1.2) s += 1.5 * smoothstep(-1.2, 1.2, dm) * (1 - smoothstep(6, 55, dm)); } return s; };
    // The burn wanders: its centre swings up to 3.2 m either side of the line (mea, metres to the right) in bends 34 m and 15 m
    // long, it widens into pools on the straights and narrows in the bends, and three stony riffles cross it. The banks stay where they were; the toe slopes take up the difference.
    const DB0 = U_BURN * PL, DB1 = U_FOOT * PL, mph = [nx.range(0, 6.28), nx.range(0, 6.28), nx.range(0, 6.28)];
    const meaK = (d) => smoothstep(DB0 + 6, DB0 + 34, d) * (1 - smoothstep(DB1 - 30, DB1 - 6, d));
    const mea = (d) => meaK(d) * (2.35 * Math.sin((d - DB0) * 0.185 + mph[0]) + 0.85 * Math.sin((d - DB0) * 0.41 + mph[1]));
    const hwN = (d) => { const u = d / PL, w = (0.9 + 0.75 * smoothstep(U_BURN - 0.008, U_BURN + 0.03, u)) * (1 + 0.45 * smoothstep(0.5, 1.4, stepDrop(u))) * (1 + 0.28 * Math.sin((d - DB0) * 0.21 + mph[2]) + 0.14 * Math.sin((d - DB0) * 0.57 + mph[0] * 2)), me = Math.abs(mea(d)); return Math.min(w * (1 - 0.3 * Math.min(1, me / 3)), 4.5 - me); };
    const RIFF = [0.43 * PL + 12, 0.52 * PL + 13, lerp(DB0, DB1, 0.87)].map((d) => d + nx.range(-1, 1)), riffAt = (d) => { let r = 0; for (const q of RIFF) r = Math.max(r, Math.exp(-(((d - q) / 3.0) ** 2))); return r; };
    const waterY = (d) => { const i = clamp(d / PL * NS, 0, NS), i0 = Math.min(NS - 1, Math.floor(i)); return lerp(sy[i0], sy[i0 + 1], i - i0) - 1.5 - 0.17 - stepDrop(d / PL); };
    // A stag stands on a slab on the burn's right-hand bar (or in its shallows), 13.5 m ahead of the lens at u 0.52: dark and
    // rim-lit, a quarter of the frame tall, against the bright water and the haze down the gully.
    const BST = { d: 0.52 * PL + 13.5, lat: 0, x: 0, z: 0, y: 0, yaw: 0 };
    // peat pools of the bog
    const pools = [];
    for (let i = 0, n = Math.round(34 * dens), tries = 0; pools.length < n && tries < 600; tries++) {
      const a = rng.range(0, 6.2832), rr = Math.sqrt(rng()) * (BOG.r - 22), x = BOG.x + Math.cos(a) * rr * BOG.rx, z = BOG.z + Math.sin(a) * rr, r = rng.range(1, 2.4) * (rng.chance(0.3) ? 1.7 : 1);
      if (Math.hypot(x - KNOLL.x, z - KNOLL.z) < KNOLL.r * 1.5 + r) continue;
      const n2 = near(x, z); if (n2.u < U_BOG - 0.01 || n2.u > U_BURN - 0.01) continue; if (ridgeW(n2.u) > 0.05 && n2.lat > -30 - r && n2.lat < -6 + r) continue;
      if (n2.d > 12 && rng.chance(0.45)) continue;      // keep more of them near the path, where they slide under the lens
      let ok = true; for (const p of pools) if (Math.hypot(x - p.x, z - p.z) < r + p.r + 2.5) { ok = false; break; } if (!ok) continue;
      pools.push({ x, z, r, y: -0.12, sd: rng.range(0, 99) });
    }
    // the burn's banks: a wet margin, a mossy toe slope, then a cut peat face (its own mesh, built further down) whose foot
    // wanders between 5.7 and 7 m from the water, and the heather top behind its lip
    const BANK_H = 3.25, bankA = (d, side) => 6.3 + 0.55 * noise.n2(d * 0.085 + 3.1, side * 5.7 + o1) + 0.22 * noise.n2(d * 0.3, side * 9.3 + o2);
    // HI: what the last call of H found. a = metres from the line, ac = from the burn's centre, e = from the water's edge, hw = the burn's half-width
    const HI = { u: 0, a: 999, d: 999, lat: 0, wB: 0, wc: 0, bA: 5.5, ac: 99, e: 99, hw: 1, i: 0 };
    const H0 = (x, z) => {
      let h = baseH(x, z); HI.d = 999; HI.wB = 0; HI.wc = 0; HI.a = 999; HI.ac = 99; HI.e = 99; HI.leg = legacy;
      if (x < -330 || x > 400 || z > 240 || z < -1060) return h;
      const n = near(x, z), d = n.d; if (d > 140) return h;
      const u = n.u, a = Math.abs(n.lat); HI.u = u; HI.a = a; HI.d = d; HI.lat = n.lat; HI.i = clamp(Math.round(n.fi), 0, NS);
      const wAir = 1 - smoothstep(U_AIR - 0.02, U_AIR + 0.012, u);
      const wB = smoothstep(U_BURN - 0.012, U_BURN + 0.022, u) * (1 - smoothstep(U_FOOT - 0.03, U_FOOT + 0.004, u)); HI.wB = wB;
      let prof = n.y - 1.5;
      if (wB > 0) { const bA = bankA(u * PL, n.lat < 0 ? -1 : 1); HI.bA = bA;
        // the left bank dips for 30 m before the stell (a sheep track down to the water), so the fold shows from the burn
        const dip = n.lat < 0 ? 1 - 0.6 * smoothstep(U_STELL - 0.05, U_STELL - 0.036, u) * (1 - smoothstep(U_STELL - 0.004, U_STELL + 0.01, u)) : 1;
        if (legacy) prof += wB * (0.95 * smoothstep(2.3, bA - 0.3, a) + (BANK_H - 0.95) * dip * smoothstep(bA + 0.8, bA + 2.2, a) + 0.085 * Math.max(0, a - 7.8) - 0.25 * (1 - smoothstep(1.6, 2.6, a)) - stepDrop(u) * (1 - smoothstep(3, 9, a)));
        else { const dd = u * PL, me = mea(dd), hw = hwN(dd), lc = n.lat - me, ac = Math.abs(lc), sc = lc < 0 ? -1 : 1, e = ac - hw; HI.ac = ac; HI.e = e; HI.hw = hw;
          // from the water's edge a mossy toe rises to the foot of the bank on that side; the bed is a dish, shallow on the riffles, with a low shoulder at its rim
          const toe = 0.95 * smoothstep(0, 1, (e - 0.45) / Math.max(1.4, bankA(dd, sc) - 0.75 - sc * me - hw));
          const bed = -(0.46 - 0.2 * riffAt(dd)) * (1 - smoothstep(hw * 0.4, hw + 0.2, ac)) + 0.09 * Math.exp(-(((e - 0.6) / 0.45) ** 2));
          prof += wB * (toe + (BANK_H - 0.95) * dip * smoothstep(bA + 0.8, bA + 2.2, a) + 0.085 * Math.max(0, a - 7.8) + bed - stepDrop(u) * (1 - smoothstep(5, 10, a))); } }
      const rw = ridgeW(u); if (rw > 0) prof += RIDGE_H * rw * Math.exp(-(((n.lat - (legacy ? -17 : RIDGE_LAT)) / (legacy ? 6.2 : RIDGE_SIG)) ** 2)) * (0.85 + 0.3 * noise.n2(x * 0.05, z * 0.05 + o1));
      const wc = (1 - smoothstep(lerp(9, 14, wB), lerp(60, 115, wB), d)) * wAir; HI.wc = wc;
      h = lerp(h, prof, wc);
      h += (0.2 * noise.n2(x * 0.31 + o1, z * 0.31) + 0.11 * noise.n2(x * 0.9, z * 0.9 + o2)) * smoothstep(1.2, 5, a);
      if (u > U_BOG - 0.03 && u < U_BURN + 0.02) for (let i = 0; i < pools.length; i++) { const p = pools[i], dd = Math.hypot(x - p.x, z - p.z); if (dd < p.r + 3) h = lerp(h, p.y - 0.1, 1 - smoothstep(p.r * 0.9, p.r + 3, dd)); }
      // never into the lens's own corridor (the burn's banks stand closer than the heath's cushions; the hag's face begins 3 m to the left)
      if (a < lerp(9, 2.4, wB) && u > 0.004) h = Math.min(h, n.y - 1.42 + (legacy || rw <= 0 || n.lat > 0 ? 0 : RIDGE_H * 1.25 * rw * smoothstep(2.6, 8.5, a)));
      return h;
    };
    // the land falls away behind the entry: we arrive over the brow of a hill, so a camera that looks in through the
    // previous portal sees a heather face rising to the brow, and the ground is 8.5 m under the entry axis at the entry plane
    const H = (x, z) => { const h = H0(x, z); return z > 2 ? h - Math.min(70, 7.4 * smoothstep(2, 22, z) + 0.3 * Math.max(0, z - 22)) : h; };
    { BST.lat = clamp(mea(BST.d) + hwN(BST.d) + 1.5, 2.8, 4.8); const q = beside(BST.d, BST.lat, { x: 0, z: 0 }), j = clamp(Math.round(BST.d / PL * NS), 0, NS); BST.x = q.x; BST.z = q.z; BST.y = H(q.x, q.z);
      BST.yaw = Math.atan2(stz[j], -stx[j]) - 0.4; }      // (broadside: it faces the water, turned a little downstream)
    const stagNearB = (x, z, r) => Math.hypot(x - BST.x, z - BST.z) < r;
    const Hplain = (x, z) => { crownOn = false; const h = H(x, z); crownOn = true; return h; };      // the land without the crown (keeps the first layout's choices where they hang on a height)
    const Hl = (x, z) => { legacy = true; const h = H(x, z); legacy = false; return h; };            // the land as the first layout knew it (see `legacy`)
    // The dyke: a drystone wall that comes down the shoulder from the right, crosses the line 94 m in (through a tumbled gap) and
    // runs on down to the bog on the left, toward the Snag. wallAt: metres from its line, where along it (0..1), and its height there.
    const WALL = { x0: 25, z0: -24, x1: -40, z1: -150 }, WQ = { d: 99, t: 0, h: 0, s: 0 }; WALL.len = Math.hypot(WALL.x1 - WALL.x0, WALL.z1 - WALL.z0); WALL.dx = (WALL.x1 - WALL.x0) / WALL.len; WALL.dz = (WALL.z1 - WALL.z0) / WALL.len;
    WALL.tGap = (WALL.x0 - 0.5) / (WALL.x0 - WALL.x1);
    const wallH = (t) => 1.38 * smoothstep(0, 0.05, t) * (1 - 0.8 * smoothstep(0.86, 1, t)) * (1 - 0.86 * Math.exp(-(((t - WALL.tGap) * WALL.len / 2.3) ** 2))) * (0.9 + 0.14 * noise.n2(t * 37, 5.5));
    const wallAt = (x, z) => { const s = (x - WALL.x0) * WALL.dx + (z - WALL.z0) * WALL.dz, t = clamp(s / WALL.len, 0, 1); WQ.s = s; WQ.t = t; WQ.d = Math.hypot(x - WALL.x0 - WALL.dx * t * WALL.len, z - WALL.z0 - WALL.dz * t * WALL.len); WQ.h = wallH(t); return WQ; };
    // Direct sun on the ground at a spot (0..1), from what stands up-sun of it: the burn's sunward bank, the hag, the dyke. Read after H(x, z).
    const sunAt = (x, z) => { if (LK.sh < 0.5) return 1; let s = 1;
      if (HI.d < 140) { const sr = sunXZ.x * -stz[HI.i] + sunXZ.y * stx[HI.i], sg = sr < 0 ? -1 : 1, k = smoothstep(0.25, 0.6, Math.abs(sr)) * LK.sh;
        if (HI.wB > 0) s *= 1 - 0.78 * k * HI.wB * smoothstep(HI.bA - 8.2, HI.bA - 4.6, HI.lat * sg) * (1 - smoothstep(HI.bA + 1.2, HI.bA + 2.4, HI.lat * sg));
        const rw = ridgeW(HI.u); if (rw > 0 && sg > 0) s *= 1 - 0.75 * k * rw * smoothstep(RIDGE_LAT - 1, RIDGE_LAT - 3.5, HI.lat) * (1 - smoothstep(RIDGE_LAT - 9, RIDGE_LAT - 17, HI.lat)); }
      if (z > -170 && z < 0) { const sl = 1.25 / sunTan, px = x + sunXZ.x * sl * 0.5, pz = z + sunXZ.y * sl * 0.5, q = wallAt(px, pz), across = Math.abs((px - WALL.x0) * -WALL.dz + (pz - WALL.z0) * WALL.dx), cr = Math.abs(sunXZ.x * -WALL.dz + sunXZ.y * WALL.dx);
        if (q.s > 0 && q.s < WALL.len) s *= 1 - 0.72 * LK.sh * (q.h / 1.38) * (1 - smoothstep(sl * 0.36 * cr, sl * 0.56 * cr + 0.4, across)); }
      { const r = Math.hypot(x - HX, z - HZ); if (r < 250 && r > 20) s *= 1 - 0.5 * LK.sh * smoothstep(0.05, -0.55, ((x - HX) * sunXZ.x + (z - HZ) * sunXZ.y) / r) * smoothstep(20, 60, r) * (1 - smoothstep(170, 250, r)); }
      return s; };
    // bracken beds on the lower two thirds of the ramp (0..1). Read after H(x, z).
    const BRK_O = nx.range(0, 100), DF0 = U_FOOT * PL, DA0 = U_AIR * PL;
    const brackenAt = (x, z) => { if (HI.d > 52) return 0; const d = HI.u * PL, k = smoothstep(DF0 + 3, DF0 + 13, d) * (1 - smoothstep(DA0 - 40, DA0 - 12, d)); if (k <= 0) return 0;
      const n = noise.n2(x * 0.023 + BRK_O, z * 0.023) * 0.62 + noise.n2(x * 0.064, z * 0.064 + BRK_O) * 0.3;
      return k * smoothstep(-0.1, 0.1, n + 0.3 * (1 - smoothstep(0, 70, d - DF0))) * (1 - smoothstep(24, 48, HI.d)); };
    await ctx.yield();

    // the mesh: a grid warped to follow the path in plan, fine under the camera and coarse toward the far hills
    const lats = [0]; { let s = 1.6, x = 0; for (let k = 0; x < 2400; k++) { if (k >= 9) s *= 1.15; x += s; lats.push(x); } }
    const colsX = [...lats.slice(1).reverse().map((v) => -v), ...lats], rowsZ = [];
    { const south = []; let s = 3.4, z = 44; while (z < 520) { s *= 1.16; z += s; south.unshift(z); } rowsZ.push(...south);
      for (z = 44; z >= -856; z -= 3.85) rowsZ.push(z); s = 3.85; z = rowsZ[rowsZ.length - 1]; while (z > -2800) { s *= 1.14; z -= s; rowsZ.push(z); } }
    const pxAtZ = (z) => { if (z >= sz[0]) return sx[0]; if (z <= sz[NS]) return sx[NS]; let a = 0, b = NS; while (b - a > 1) { const m = (a + b) >> 1; if (sz[m] >= z) a = m; else b = m; } return lerp(sx[a], sx[b], (sz[a] - z) / Math.max(1e-6, sz[a] - sz[b])); };
    const NXg = colsX.length, NZg = rowsZ.length, tPos = new Float32Array(NXg * NZg * 3), tZone = new Float32Array(NXg * NZg * 4), tAo = new Float32Array(NXg * NZg), tSun = new Float32Array(NXg * NZg), tBed = new Float32Array(NXg * NZg * 3);
    const MCx = HX + Rx * 50 + Ax * 38, MCz = HZ + Rz * 50 + Az * 38;     // centre of the fleece mound (it shades the hill under it)
    // the wool's shadow on the land under and a little down-sun of it; the crest stands in the sun above the wool's edge
    const fleeceShade = (x, z, h) => 1 - 0.42 * smoothstep(92, 40, Math.hypot(x - MCx + 12, z - MCz + 5)) * (1 - smoothstep(HY + 18, HY + 31, h));
    for (let j = 0, k = 0; j < NZg; j++) {
      const z = rowsZ[j], px = pxAtZ(z);
      for (let i = 0; i < NXg; i++, k++) {
        const lat = colsX[i], x = lat + px * (1 - smoothstep(150, 900, Math.abs(lat))), h = H(x, z);
        // (the burn's bed and margins are a finer mesh of their own, laid on the true ground: this one is sunk under it there)
        tPos[k * 3] = x; tPos[k * 3 + 1] = HI.wB > 0.03 && HI.ac < HI.hw + 3 ? h - 0.6 * smoothstep(0.03, 0.3, HI.wB) * (1 - smoothstep(HI.hw + 1.5, HI.hw + 3, HI.ac)) : h; tPos[k * 3 + 2] = z;
        tSun[k] = sunAt(x, z); tBed[k * 3 + 2] = brackenAt(x, z);
        const rb = Math.hypot((x - BOG.x) / BOG.rx, z - BOG.z), rh = Math.hypot(x - HX, z - HZ);
        let sph = smoothstep(BOG.r + 6, BOG.r - 26, rb) * (1 - smoothstep(1.5, 5, h)), peat = 0, green = smoothstep(235, 150, rh) * 0.75;
        if (HI.d < 140) {
          const bw = HI.wB * HI.wc;
          peat = Math.max(peat, bw * Math.max(smoothstep(-0.6, -0.1, HI.e) * (1 - smoothstep(0.5, 1.3, HI.e)) * 0.8, smoothstep(HI.bA - 0.5, HI.bA + 0.2, HI.a) * (1 - smoothstep(HI.bA + 1.5, HI.bA + 2.6, HI.a)) * 0.95));
          sph = Math.max(sph, bw * (1 - smoothstep(HI.bA - 0.6, HI.bA + 0.1, HI.a)) * smoothstep(0.4, 1.3, HI.e) * 0.9);
          const rw = ridgeW(HI.u); if (rw > 0) peat = Math.max(peat, rw * 0.78 * smoothstep(2.8, 1.2, Math.abs(Math.abs(HI.lat - RIDGE_LAT) - 3.6)));
        }
        green = Math.max(green, smoothstep(-13, -19, h) * 0.7);
        peat = clamp(peat + 0.25 * sph * smoothstep(0.1, 0.5, noise.n2(x * 0.06 + o2, z * 0.06)), 0, 1); sph *= 1 - peat; green *= (1 - peat) * (1 - sph);
        tZone[k * 4] = Math.max(0, 1 - sph - peat - green); tZone[k * 4 + 1] = sph; tZone[k * 4 + 2] = peat; tZone[k * 4 + 3] = green;
        tAo[k] = fleeceShade(x, z, h) * (1 - 0.16 * HI.wB * (1 - smoothstep(2, 8, HI.a)));
      }
      await ctx.yield();
    }
    await ctx.yield();
    const tIdx = new Uint32Array((NXg - 1) * (NZg - 1) * 6);
    for (let j = 0, q = 0; j < NZg - 1; j++) for (let i = 0; i < NXg - 1; i++) { const a = j * NXg + i, b = a + 1, c = a + NXg, d = c + 1; tIdx[q++] = a; tIdx[q++] = b; tIdx[q++] = c; tIdx[q++] = b; tIdx[q++] = d; tIdx[q++] = c; }
    const tGeo = new THREE.BufferGeometry();
    tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3)); tGeo.setAttribute('aZone', new THREE.BufferAttribute(tZone, 4)); tGeo.setAttribute('aAo', new THREE.BufferAttribute(tAo, 1)); tGeo.setAttribute('aSun', new THREE.BufferAttribute(tSun, 1)); tGeo.setAttribute('aBed', new THREE.BufferAttribute(tBed, 3));
    tGeo.setIndex(new THREE.BufferAttribute(tIdx, 1)); await ctx.yield(); tGeo.computeVertexNormals();
    await ctx.yield();
    const H2 = /* glsl */`
      float h21(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
      float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
    `;
    // the muirburn quilt (strips 36 m by 150 m of heather at different ages) and the sphagnum cushions, shared by ground and plants
    const QUILT = /* glsl */`uniform vec3 uHeather, uBell, uYoung, uBurnt, uPeat, uMoss, uWine, uGold, uGrass;
      float qBurnt;
      vec3 quilt(vec2 p){
        vec2 wq = p + (vec2(vn2(p * .013), vn2(p * .013 + 7.3)) - .5) * 46.;
        vec2 q = vec2(.83 * wq.x + .56 * wq.y, -.56 * wq.x + .83 * wq.y);
        float cx = q.x / 36., ci = floor(cx), ry = q.y / 150. + h21(vec2(ci, 3.7)), ri = floor(ry);
        float age = h21(vec2(ci, ri)), tone = h21(vec2(ri, ci) + 9.1), fx = fract(cx), fy = fract(ry);
        float ed = smoothstep(0., .1, fx) * (1. - smoothstep(.9, 1., fx)) * smoothstep(0., .03, fy) * (1. - smoothstep(.97, 1., fy));
        vec3 hq = age < .1 ? uBurnt : age < .3 ? uYoung : age < .44 ? mix(uHeather, uBell, .7) : uHeather * (.76 + .46 * tone);
        hq = mix(uHeather * .84, hq, ed); qBurnt = age < .1 ? ed : 0.;
        return mix(hq, uBell, smoothstep(.62, .8, vn2(p * .045 + 3.)) * .45); }
      float blaeBand(vec2 p){ float r = distance(p, vec2(${HX.toFixed(1)}, ${HZ.toFixed(1)})) + 3. * sin(p.x * .045 + .8) + 2.5 * sin(p.y * .031 - p.x * .02); return clamp(max(1. - abs(r - 107.) / 50., 1. - abs(r - 152.) / 20.), 0., 1.); }
      vec3 sphag(vec2 p){ float n1 = vn2(p * .42 + 3.1), n2 = vn2(p * .36 + 17.7), n3 = vn2(p * 1.3); vec3 c = mix(uMoss, uWine, smoothstep(.56, .68, n1) * .85); c = mix(c, uGold, smoothstep(.64, .76, n2) * .7); return c * (.82 + .36 * n3); }
    `;
    const cBrack = C(LK.season === 'rut' ? '#a8742c' : LK.season === 'june' ? '#5f8a34' : '#7f8a36'), cBurnt = C('#6e4e44'), cPeatL = cPeat.clone().multiplyScalar(1.7).lerp(C('#4a3a52'), 0.25), cWine = C('#7c3a55'), cGold = C('#a48a3a'), cGrass = cMoss.clone().lerp(C('#9aa85a'), 0.3);
    const QU = { uHeather: { value: cHeather }, uBell: { value: C(LK.bell) }, uYoung: { value: C(LK.young) }, uBurnt: { value: cBurnt }, uPeat: { value: cPeatL }, uMoss: { value: cMoss }, uWine: { value: cWine }, uGold: { value: cGold }, uGrass: { value: cGrass }, uBrack: { value: cBrack } };
    const terrainMat = feltMat({
      uniforms: QU,
      vertexShader: VERT_PARS + /* glsl */`attribute vec4 aZone; attribute float aAo, aSun; attribute vec3 aBed; varying vec4 vZone; varying float vAo, vSunA; varying vec3 vBed;
        void main(){ vObj = position; vCol = vec3(1.); vZone = aZone; vAo = aAo; vSunA = aSun; vBed = aBed; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vNrm = normalize(mat3(modelMatrix) * normal);
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + H2 + QUILT + /* glsl */`varying vec4 vZone; varying float vAo, vSunA; varying vec3 vBed; uniform vec3 uBrack;
        float nub(vec2 p, out vec2 g){ vec2 c = floor(p), f = fract(p) - .5; vec2 j = (vec2(h21(c), h21(c + 17.3)) - .5) * .42; vec2 v = f - j; float d = max(0., 1. - dot(v, v) * 5.5); g = v * d; return d; }
        // Painted cushions, for where the instanced ones thin out and stop: the same mounds seen from above (their size, their
        // purples and blaeberry greens, a domed normal, a lee shade). One mound to a cell, anywhere in it and overlapping its
        // neighbours (the nearest of nine is taken), so no lattice shows however far off they are.
        float mound(vec2 p, out vec2 g, out vec2 id){ vec2 c = floor(p), f = fract(p); float best = 0.; g = vec2(0.); id = c;
          for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 o = vec2(float(i), float(j)), cc = c + o; float r = mix(.42, .66, h21(cc + 21.3));
            vec2 v = f - o - vec2(h21(cc), h21(cc + 17.3)); float d = 1. - dot(v, v) / (r * r); if (d > best) { best = d; g = v / r; id = cc; } }
          return best; }
        void main(){
          vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
          vec2 p = vWorld.xz; float fw = abs(dFdx(p.x)) + abs(dFdy(p.x)) + abs(dFdx(p.y)) + abs(dFdy(p.y));
          vec3 hq = quilt(p);
          // nubs (the fine heather texture between and on the mounds)
          float nf = 1. - smoothstep(.05, .3, fw);
          vec2 g1, g2, g3; float n1 = nub(p * 2.3, g1), n2 = nub(p * 3.9 + 3.7, g2) * .8, n3 = nub(p * 7.3 + 9.1, g3) * .55;
          float nb = max(n1, max(n2, n3)); vec2 ng = n1 >= nb ? g1 : n2 >= nb ? g2 : g3 * .6;
          // sphagnum cushions in moss green, wine and gold
          vec3 sphC = sphag(p);
          vec3 blae = mix(uGrass, uMoss, .6) * vec3(.6, .6, .5);
          float bandK = smoothstep(.76, .84, blaeBand(p)), gShare = vZone.w * mix(.03, 1.3, bandK);
          // cut peat on a slope shows its layers (the hinds' ridge is a hag, like the burn's banks)
          float sy = vWorld.y * 3.1 + (vn2(p * .35) - .5) * 1.3, fws = abs(dFdx(sy)) + abs(dFdy(sy)), bK = (1. - smoothstep(.35, 1.1, fws)) * (1. - smoothstep(.82, .97, N.y));
          vec3 peatC = uPeat * (.8 + .4 * vn2(p * .7)) * mix(1., (.74 + .46 * h21(vec2(floor(sy), 4.7))) * (1.06 - .3 * smoothstep(.2, .7, abs(fract(sy) - .5) * 2.)), bK);
          vec3 base = hq * vZone.x + sphC * vZone.y + peatC * vZone.z + mix(hq, blae, .03 + .72 * bandK) * vZone.w;
          float nubK = nf * (vZone.x + vZone.y * .8 + vZone.w * .6) * smoothstep(.6, .9, N.y);
          mat2 RM = mat2(.8, -.6, .6, .8); vec2 sxz = normalize(uSunDir.xz + vec2(1e-4, 0.)) * 1.25;      // (sxz: toward the sun, 1.25 long)
          vec2 gc, id, g0, i0; float nc = mound(RM * p * .45 + 5.3, gc, id), lee = smoothstep(0., .4, mound(RM * (p + sxz) * .45 + 5.3, g0, i0)); gc = gc * RM;
          // held while a mound is still a few pixels wide and a pixel deep, then the ground takes their mean tone
          float fa = length(dFdx(p)), fb = length(dFdy(p)), cK = (1. - smoothstep(.5, 1.1, min(fa, fb))) * (1. - smoothstep(1.4, 3.4, max(fa, fb))) * clamp(vZone.x + vZone.w, 0., 1.) * smoothstep(.6, .9, N.y) * (1. - vBed.z);
          float hc = h21(id + 3.7), hk = h21(id + 11.9), inM = smoothstep(0., .22, nc);
          vec3 mc = (hk < gShare ? blae * 1.06 : hk > .93 ? uBell : hq) * (.84 + .36 * hc);
          vec3 gap = mix(base * vec3(.66, .62, .86), vec3(.34, .29, .6), .42) * (1. - .24 * lee);      // (deep lavender between the mounds, never black, on burnt strips too)
          base = mix(base * .9, mix(gap, mc * (.8 + .32 * nc) * 1.1, inM), cK);
          N = normalize(N + vec3(gc.x, 0., gc.y) * (1.1 * cK * inM));
          // the low sun: a painted mound is lit on its crown and its sunward side, as the built ones are; what stands up-sun shades the rest (aSun)
          gSun = vSunA * towerSun(vWorld) * mix(1., mix(.3, smoothstep(-.14, .16, nc * 1.05 + .34 * dot(gc, sxz) - .5), inM), cK * uShade.x);
          // bracken beds: a gold-green litter combed downwind, in place of the mounds
          float brN = vn2(vec2(p.x * .35 + p.y * .2, p.y * 2.3)) * .6 + vn2(p * 1.9 + 7.) * .4;
          base = mix(base, uBrack * (.6 + .62 * brN), vBed.z * .9);
          // the burn's bed: felt pebbles in buff and grey, dark and brown where they are wet
          { float gK = 1. - smoothstep(.04, .22, fw); vec2 pa = p * 4.3 + 1.7, pb = p * 7.9 + 5.3, qa, qb; float ba = nub(pa, qa), bb = nub(pb, qb) * .8; bool big = ba >= bb;
            float pk = max(ba, bb), tone = big ? h21(floor(pa) + 5.) : h21(floor(pb) + 9.); vec2 pg = big ? qa : qb * .6;
            vec3 peb = mix(vec3(.3, .275, .27), vec3(.6, .56, .5), tone) * mix(.8, .5 + .55 * smoothstep(0., .5, pk), gK);
            base = mix(base, peb, vBed.x);
            N = normalize(N + vec3(pg.x, 0., pg.y) * (1.4 * vBed.x * gK));
            base *= mix(vec3(1.), vec3(.36, .31, .32), vBed.y); }
          gRimK = .4;                                                   // flat ground seen at a grazing angle is not a silhouette: little fuzz rim
          // far hills are modelled by the light: sunward faces warmer and paler, lee sides lavender, the nap bands plainer
          float farK = smoothstep(200., 800., length(cameraPosition - vWorld)), sunF = dot(N, uSunDir);
          base *= 1. + farK * .34 * clamp(sunF * 1.6 - .5, -1., 1.);
          base = mix(base, base * vec3(.82, .85, 1.14), farK * .55 * (1. - smoothstep(-.15, .4, sunF)));
          base *= mix(1., .84 + .25 * nb, nubK) * (.94 + .12 * vn2(p * .9 + 5.));
          N = normalize(N + vec3(ng.x, 0., ng.y) * 1.05 * nubK);
          gl_FragColor = vec4(atmos(felt(base, N, V, vWorld, vWorld, 1.7, vAo, mix(1.25, 2., farK))), 1.);
        }`,
    });
    const terrain = new THREE.Mesh(tGeo, terrainMat); terrain.name = 'moor'; terrain.frustumCulled = false; scene.add(terrain);
    // The burn's bed and wet margins: a fine mesh of their own (0.7 m by 0.75 m) laid on the true ground, so the water's edge
    // wanders with the channel, cuts under the mossy toes and breaks round the gravel bars. aBed: gravel, wet.
    let burnBed;
    { const NB = 17, bb = new Buf({ position: 3, aZone: 4, aAo: 1, aSun: 1, aBed: 3 }), dA = (U_BURN - 0.012) * PL, dB = (U_FOOT + 0.006) * PL, Q = { x: 0, z: 0 }; let prev = -1, k = 0;
      for (let d = dA; d <= dB + 0.4; d += 0.75, k++) { const me = mea(d), W = hwN(d) + 3.1, base = bb.n, wy = waterY(d), rf = riffAt(d);
        for (let q = 0; q < NB; q++) { const lat = me + (q / (NB - 1) * 2 - 1) * W; beside(d, lat, Q); const h = H(Q.x, Q.z), e = HI.e, bw = HI.wB * HI.wc, wB = HI.wB, a = HI.a, bA = HI.bA;
          const peat = clamp(bw * Math.max(smoothstep(-0.6, -0.1, e) * (1 - smoothstep(0.5, 1.3, e)) * 0.8, smoothstep(bA - 0.5, bA + 0.2, a) * 0.95), 0, 1), sph = (1 - peat) * bw * (1 - smoothstep(bA - 0.6, bA + 0.1, a)) * smoothstep(0.4, 1.3, e) * 0.9;
          const dep = wy - h, gravel = wB * smoothstep(-0.55, -0.12, dep) * (0.8 + 0.2 * rf), wet = wB * smoothstep(-0.22, 0.0, dep);
          bb.push({ position: [Q.x, h + 0.02 - (q === 0 || q === NB - 1 ? 0.55 : 0) - 0.7 * (1 - smoothstep(0.1, 0.35, wB)), Q.z], aZone: [Math.max(0, 1 - sph - peat), sph, peat, 0], aAo: [1 - 0.16 * wB * (1 - smoothstep(2, 8, a))], aSun: [sunAt(Q.x, Q.z)], aBed: [gravel, wet, 0] }); }
        if (prev >= 0) for (let q = 0; q < NB - 1; q++) bb.idx.push(prev + q, prev + q + 1, base + q, prev + q + 1, base + q + 1, base + q);
        prev = base; if (k % 16 === 15) await ctx.yield(); }
      await ctx.yield();
      burnBed = new THREE.Mesh(await bb.buildAsync(ctx), terrainMat); burnBed.name = 'burn-bed'; burnBed.frustumCulled = false; scene.add(burnBed); }
    await ctx.yield();

    // ---------------------------------------------------------------- the felted sky
    const skyU = { uZen: { value: C(LK.zen) }, uHor: { value: C(LK.hor, night ? 1 : 0.86) }, uPad: { value: C(LK.pad, night ? 1 : 0.9) }, uFogC: { value: fogCol }, uSunDir: SH.uSunDir, uSunC: { value: night ? C('#dfe6ff') : lookId === 'gold' ? C('#ffd9a8') : C('#fff3dc') },
      uSunI: { value: LK.sun }, uStars: { value: LK.stars }, uTime: SH.uTime, uSkyMist: { value: 0 }, uMistCol: SH.uMistCol, uGlow: { value: new THREE.Vector4(...C(LK.glow[0]).toArray(), LK.glow[1]) }, uHeroG: { value: new THREE.Vector4(0, 0, -1, 0) }, uHeroC: { value: night ? C('#aebcf0') : C('#fff0d2') } };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: skyU,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`uniform vec3 uZen, uHor, uPad, uFogC, uSunDir, uSunC, uMistCol; uniform float uSunI, uStars, uTime, uSkyMist; uniform vec4 uGlow, uHeroG; uniform vec3 uHeroC; varying vec3 vDir;
        const vec4 PADS[9] = vec4[9](vec4(-.5, -4.4, 1.5, 1.), vec4(1.7, -3., 1.1, .6), vec4(-2.7, -2.7, 1.3, .7), vec4(3.8, -5.2, 2., .9), vec4(-2.2, -6.6, 1.5, .8), vec4(4.6, -1.2, 1.4, .7), vec4(-.95, -2.3, 1., .5), vec4(-.9, -1.5, .5, .27), vec4(-.25, -1.75, .6, .3));` + H2 + /* glsl */`
        void main(){ vec3 d = normalize(vDir + vec3(0., 1e-5, 0.)); float h = d.y, t = pow(clamp(h, 0., 1.), .55);
          vec2 sp = d.xz / (abs(h) + .22);
          float st = vn2(vec2(sp.x * .7 - uTime * .004, sp.y * 3.2)) * .6 + vn2(vec2(sp.x * 1.6 - uTime * .007, sp.y * 7. + 4.)) * .4;
          float st2 = vn2(vec2(sp.x * .22 - uTime * .003, sp.y * 1.25 + 9.));
          // wool-blue carded down to cream in broad streaks that run with the wind
          float mixT = clamp(t * 1.15 + ((st - .5) * .8 + (st2 - .5) * .5) * (1. - .55 * t), 0., 1.);
          vec3 c = mix(uHor, uZen, mixT);
          // the low sun warms the sky's rim on its own side
          { float az = dot(normalize(d.xz + vec2(1e-5, 0.)), normalize(uSunDir.xz + vec2(1e-5, 0.))) * .5 + .5; c = mix(c, uGlow.rgb, uGlow.a * az * az * sqrt(az) * exp(-max(h, 0.) * 4.5)); }
          // while the Snag is far off the sky is bright behind it, so it stands dark in a gap of light
          { float hg = max(dot(d, uHeroG.xyz), 0.), h8 = hg * hg; h8 *= h8; h8 *= h8; float h32 = h8 * h8; h32 *= h32; c = mix(c, uHeroC, uHeroG.w * (h32 * h32 * h32 * .6 + h32 * .3)); }
          // nine felt pads of different sizes, high up: lit cream on top, lavender underneath (the side toward the horizon)
          vec2 pp = d.xz / max(h, .06); float pad = 0., padSh = 0.;
          for (int i = 0; i < 9; i++) { float fi = float(i); vec4 P = PADS[i]; vec2 pc = P.xy + vec2(uTime * .012, 0.);
            vec2 e = (pp - pc) / P.zw; float r = dot(e, e) + (vn2(pp * 2.3 + fi * 9.) - .5) * .6 + (vn2(pp * 6.1 + fi * 3.) - .5) * .2, m = 1. - smoothstep(.45, 1.05, r);
            if (m > pad) { pad = m; padSh = smoothstep(-.35, .75, dot(pp - pc, normalize(pc)) / P.w); } }
          vec3 padC = mix(mix(uPad, uSunC, .22) * 1.06, uPad * vec3(.68, .7, .92), padSh * .85) * (.93 + .14 * st);
          c = mix(c, padC, pad * .9 * smoothstep(.05, .15, h));
          c *= .975 + .05 * vn2(sp * 60.);
          float sd = dot(d, uSunDir);
          c = mix(c, uSunC * uSunI, smoothstep(.99912, .99956, sd)) + uSunC * pow(max(sd, 0.), 48.) * .1 * uSunI;
          vec3 g = d * 70., ci = floor(g), cf = fract(g) - .5; float hs = fract(sin(dot(ci, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
          c += step(.94, hs) * (1. - smoothstep(0., .09, dot(cf, cf))) * (.6 + .4 * sin(uTime * 1.3 + hs * 40.)) * uStars * vec3(.75, .82, 1.) * smoothstep(.03, .2, h) * (1. - pad);
          c = mix(c, uFogC, (1. - smoothstep(0., .1, h)) * .4);
          c = mix(uFogC, c, smoothstep(-.05, .02, h));
          c = mix(c, uMistCol, (1. - exp(-uSkyMist / max(h, .03))) * .92);
          gl_FragColor = vec4(c, 1.); }`,
    });
    const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(3800, 4), skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ---------------------------------------------------------------- the Snag
    // the stags stand on a stacked crag beside the pull-up, level with the lens as it passes and dark against the wool before that
    const stagXZ = [Rx * 10.5 + Ax * 169, Rz * 10.5 + Az * 169], CRAG_H = 11.5, cragG = H(HX + stagXZ[0], HZ + stagXZ[1]);
    const stagSeat = new THREE.Vector3(stagXZ[0], cragG - HY + CRAG_H, stagXZ[1]);
    // three more of the bachelor group, each on a slab of its own: two on the brow of the nose (on the skyline all the way up
    // the climb, left of the line), one on the crest beside the west thorn, looking across the portal
    // (the last stands on a crag of two slabs, so from the crest it is dark against the far moor and the sky, never against stone)
    const STAG2 = [[-7.5, 102, -1, 0.25, 1.0, 0], [-6.2, 96, 0.85, -0.5, 0.92, 0], [-12.5, 29, 0.8, 0.55, 1.04, 2.9]].map(([lat, s0, dR, dA, size, lift]) => {
      const lx = Rx * lat + Ax * s0, lz = Rz * lat + Az * s0, g = H(HX + lx, HZ + lz);
      return { lat, s: s0, g, lift, x: lx, y: g - HY + lift + 0.74, z: lz, yaw: Math.atan2(Rx * dR + Ax * dA, Rz * dR + Az * dA), size }; });
    // boulders ringing the tor's foot, most of them on the side the journey sees, with raw wool caught on their lee sides
    const footRocks = []; { const RF = fx.fork('foot');
      for (let i = 0; i < 32; i++) { const a = i < 22 ? Math.atan2(Az, Ax) + RF.range(-1.5, 1.5) : RF.range(0, 6.2832), rr = RF.range(33, 54), r = RF.range(1.3, 3.2) * (i % 5 === 0 ? 1.3 : 1), x = HX + Math.cos(a) * rr, z = HZ + Math.sin(a) * rr, h = H(x, z);
        const b = { x, y: h + r * 0.3, z, rx: r * RF.range(0.95, 1.3), ry: r * RF.range(0.6, 0.85), rz: r, yaw: RF.range(0, 6.28), tx: RF.range(-0.2, 0.2), tz: RF.range(-0.2, 0.2), det: r > 3.4 ? 3 : 2, seed: RF.range(0, 99), moss: 0.5, r, tuft: RF.chance(0.65) };
        const fl = (x - HX) * Rx + (z - HZ) * Rz, fs = (x - HX) * Ax + (z - HZ) * Az;      // (on the crest they stand back from the line: none in the lens's lap)
        if (path.isClear(x, b.y, z, r * 1.3, 8) && (fs < -8 || Math.abs(fl) > r * 1.3 + 7.5)) footRocks.push(b); } }
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: LK.pal, hour: LK.hour, weather: LK.weather, season: LK.season, approach: AZ, cap: false, passage: false, thornTops: [97, 91], thornRise: [71, 49], stagSeat, stagScale: 1.5, moreStags: STAG2.concat([{ x: BST.x - HX, y: BST.y + 0.6 - HY, z: BST.z - HZ, yaw: BST.yaw, size: 0.97 }]), light: lookId === 'morning' ? { ...L, sunColor: L.sunColor.clone().multiplyScalar(0.88) } : L, ground: (lx, lz) => H(HX + lx, HZ + lz) - HY,
      footWool: footRocks.map((b) => ({ x: b.x - HX, y: b.y - HY, z: b.z - HZ, r: b.r, tuft: b.tuft })) });
    hero.object.position.set(HX, HY, HZ); scene.add(hero.object); if (hero.parts?.stags) hero.parts.stags.scale.setScalar(1.5); hero.object.updateMatrixWorld(true);
    const heroGaze = new THREE.Vector3(HX + Rx * 13 + Ax * 16, HY + 57, HZ + Rz * 13 + Az * 16);      // (the thorns stand to +97 now: the gaze sits higher on them)
    const heroCentre = new THREE.Vector3(HX + Rx * 13 + Ax * 16, HY + 46, HZ + Rz * 13 + Az * 16), crestLook = new THREE.Vector3(HX, HY + 53, HZ), browStags = new THREE.Vector3(HX + (STAG2[0].x + STAG2[1].x) / 2, HY + STAG2[1].y + 2.2, HZ + (STAG2[0].z + STAG2[1].z) / 2), stagWorld = new THREE.Vector3(HX + stagSeat.x, HY + stagSeat.y + 1.9, HZ + stagSeat.z);
    await ctx.yield();

    const beaconU = { uTime: SH.uTime, uK: { value: 1 }, uCol: { value: C(night ? '#dfe6ff' : '#fff1d8').multiplyScalar(night ? 0.9 : 1.5) }, uAt: { value: new THREE.Vector3(HX, HY + 50, HZ) } };
    { const g = new THREE.PlaneGeometry(2, 1, 1, 6); g.translate(0, 0.5, 0);
      const beacon = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: beaconU,
        vertexShader: /* glsl */`uniform vec3 uAt; varying vec2 vP; void main(){ vP = position.xy; vec3 toC = cameraPosition - uAt; vec3 side = normalize(vec3(toC.z, 0., -toC.x) + vec3(1e-4, 0., 0.));
          vec3 wp = uAt + side * position.x * 6.5 + vec3(0., position.y * 36., 0.); gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uK, uTime; varying vec2 vP;
          void main(){ float a = exp(-vP.x * vP.x * 7.) * smoothstep(0., .12, vP.y) * (1. - smoothstep(.45, 1., vP.y)) * (.8 + .2 * sin(uTime * 1.7 + vP.y * 11.)) * uK; gl_FragColor = vec4(uCol * a, 1.); }` }));
      beacon.frustumCulled = false; beacon.renderOrder = 4; beacon.name = 'portal-glint'; scene.add(beacon); }
    await ctx.yield();

    // ---------------------------------------------------------------- instancing helpers
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), v4 = new THREE.Vector3(), s4 = new THREE.Vector3(), c4 = new THREE.Color(), P2 = { x: 0, z: 0 };
    const instanced = (geo, mat, list, name) => {
      if (!list.length) list.push({ x: 0, y: -900, z: 0, sx: 0.001, sy: 0.001, sz: 0.001, r: 0, g: 0, b: 0 });
      const im = new THREE.InstancedMesh(geo, mat, list.length);
      for (let i = 0; i < list.length; i++) { const o = list[i]; e4.set(o.rx || 0, o.yaw || 0, o.rz || 0, 'YXZ'); m4.compose(v4.set(o.x, o.y, o.z), q4.setFromEuler(e4), s4.set(o.sx, o.sy, o.sz)); im.setMatrixAt(i, m4); im.setColorAt(i, c4.setRGB(o.r ?? 1, o.g ?? 1, o.b ?? 1)); }
      im.frustumCulled = false; im.name = name; scene.add(im); return im;
    };
    const inPool = (x, z, pad) => { for (let i = 0; i < pools.length; i++) { const p = pools[i]; if (Math.hypot(x - p.x, z - p.z) < p.r + pad) return true; } return false; };
    const D_AIR = U_AIR * PL, D_BOG = U_BOG * PL, D_BURN = U_BURN * PL, D_FOOT = U_FOOT * PL;
    // what grows at a spot: 0 heather, 1 sphagnum, 2 blaeberry / grass, -1 nothing (water)
    const hwAt = (u) => (0.9 + 0.75 * smoothstep(U_BURN - 0.008, U_BURN + 0.03, u)) * (1 + 0.45 * smoothstep(0.5, 1.4, stepDrop(u)));     // half-width of the burn
    // blaeberry grows in contour belts round the Snag's hill (the same belts in the ground's paint), not as confetti: one
    // 20 m wide across the upper nose, one 8 m wide lower down; the crest, the lower nose and the ramp are purple
    // (round 7: two contour belts round the Snag, 20 and 8 m wide with wandering edges, so the nose shows ling crossed by one olive band)
    const blaeBand = (x, z) => { const r = Math.hypot(x - HX, z - HZ) + 3 * Math.sin(x * 0.045 + 0.8) + 2.5 * Math.sin(z * 0.031 - x * 0.02); return clamp(Math.max(1 - Math.abs(r - 107) / 50, 1 - Math.abs(r - 152) / 20), 0, 1); }, inBlae = (x, z) => blaeBand(x, z) > 0.8;
    const groundKind = (x, z, h, R = rng) => {
      if (HI.wB > 0.4 && (HI.leg ? HI.a < 2.5 : HI.e < 0.25)) return -1;
      const rb = Math.hypot((x - BOG.x) / BOG.rx, z - BOG.z); if (rb < BOG.r - 10 && h < 2.2) return inPool(x, z, 0.3) ? -1 : 1;
      if (Math.hypot(x - HX, z - HZ) < 215 && R() < (inBlae(x, z) ? 0.93 : 0.03)) return 2;
      if (HI.wB > 0.4 && (HI.leg ? HI.a < 4 : HI.e < 1.5)) return 2;
      return 0;
    };

    // ---------------------------------------------------------------- heather, sphagnum and blaeberry cushions under the lens
    // Each cushion is a soft dome with a flared skirt that lies on the slope of the ground; its vertices are pushed out
    // into four or five low merged nubs in the vertex shader (seeded per instance), so no two mounds match. A second
    // strip per cushion is laid on its silhouette as seen from the lens and combed into short hairs in the fragment
    // shader: the fuzz halo. The path is cut into 30 m segments: fine domes and halos near the lens, coarser domes
    // beyond, and the ground's painted nubs after that.
    const domeGeo = (rings, S, hem) => { const b = new Buf({ position: 3, aSk: 1 }); b.push({ position: [0, 1, 0], aSk: [0] });
      const prof = []; for (let r = 0; r < rings; r++) { const ph = (r + 1) / rings * 1.22; prof.push([Math.sin(ph), Math.cos(ph), 0]); }
      for (const h of hem) prof.push(h);
      for (let r = 0; r < prof.length; r++) for (let i = 0; i < S; i++) { const a = (i + r * 0.5) / S * 6.2832; b.push({ position: [Math.cos(a) * prof[r][0], prof[r][1], Math.sin(a) * prof[r][0]], aSk: [prof[r][2]] }); }
      for (let i = 0; i < S; i++) b.idx.push(0, 1 + (i + 1) % S, 1 + i);
      for (let r = 0; r < prof.length - 1; r++) for (let i = 0; i < S; i++) { const a = 1 + r * S + i, a2 = 1 + r * S + (i + 1) % S, c = a + S, c2 = a2 + S; if (r % 2) b.idx.push(a, a2, c2, a, c2, c); else b.idx.push(a, a2, c, a2, c2, c); }
      return b.build(false); };
    const domeHi = domeGeo(3, 12, [[1.08, 0.15, 0.45], [1.25, 0.04, 0.8], [1.42, 0, 1]]), domeMid = domeGeo(2, 9, [[1.12, 0.1, 0.5], [1.4, 0, 1]]), domeLo = domeGeo(1, 7, [[1.3, 0, 1]]), domeToe = domeGeo(2, 10, [[1.3, 0, 1]]);
    const shadeGeo = (() => { const b = new Buf({ position: 3 }); b.push({ position: [0, 1, 0] }); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; b.push({ position: [Math.cos(a), 0, Math.sin(a)] }); } for (let i = 0; i < 8; i++) b.idx.push(0, 1 + (i + 1) % 8, 1 + i); return b.build(false); })();
    const FIN_N = 18, finGeo = (() => { const b = new Buf({ position: 3 }); for (let i = 0; i <= FIN_N; i++) for (let v = 0; v < 2; v++) b.push({ position: [i / FIN_N, v, 0] });
      for (let i = 0; i < FIN_N; i++) { const a = i * 2; b.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } return b.build(false); })();
    const finLo = (() => { const b = new Buf({ position: 3 }), n = 12; for (let i = 0; i <= n; i++) for (let v = 0; v < 2; v++) b.push({ position: [i / n, v, 0] });
      for (let i = 0; i < n; i++) { const a = i * 2; b.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } return b.build(false); })();
    const SEGL = 30, NSEG = Math.ceil((PL + 2) / SEGL), cSeg = Array.from({ length: NSEG }, () => ({ core: [], side: [], outer: [], toe: [], outerB: [] }));
    const D_CLIMB = D_FOOT + 6;
    // the crown's own cover: from S_C0 back along the approach to behind the thorns. dOfS = how far along the path the lens is at s
    const S_C0 = 121, I_T0 = Math.floor(NS * 0.76);
    const dOfS = (s) => { const n = TS.length - 1; if (s <= TS[n]) return PL - 0.01; let a = 0, b = n; while (b - a > 1) { const m = (a + b) >> 1; if (TS[m] >= s) a = m; else b = m; } return (I_T0 + a + (TS[a] - s) / Math.max(1e-6, TS[a] - TS[b])) / NS * PL; };
    const D_C0 = dOfS(S_C0);
    const inCrown = (x, z) => { const lx = x - HX, lz = z - HZ, s = lx * Ax + lz * Az, lat = lx * Rx + lz * Rz; if (s > S_C0 || s < -40) return false; return Math.abs(lat) < tab(CW, Math.max(s, 0)) + 15; };
    const EWE_D = 0.5 * PL + 11.5, TARN = beside(D_FOOT + 3, 4.5, { x: 0, z: 0 });
    // two ewes stand at the water's edge (one ahead of the lens at u 0.50, one at 0.52): [metres along, metres right of the line]
    const eweSpots = [[EWE_D, 1], [0.52 * PL + 15, -1]].map(([d, sd]) => [d, mea(d) + sd * (hwN(d) + 1.2)]), eweNear = (d, lat) => eweSpots.some((q) => Math.abs(d - q[0]) < 1.9 && Math.abs(lat - q[1]) < 1.7);
    // R: the random stream (the first layout's own, or a fork for what was added later); toeRad: a moss cushion of this radius on the burn's toe slope
    // opt: { x, z } an explicit spot (else `lat` beside the path at `d`), kind, skip (make the draws, lay nothing), big, y (stand it at this height)
    const putCushion = (d, lat, dense, lip, wide = 0, R = rng, toeRad = 0, nearOnly = false, opt = null) => {
      beside(d, lat, P2); if (opt && opt.x !== undefined) { P2.x = opt.x; P2.z = opt.z; }
      const x = P2.x, z = P2.z, fixY = !!opt && opt.y !== undefined, leg = R === rng;      // (the first layout's own calls are tested against the land it knew)
      let h = leg ? Hl(x, z) : H(x, z); if (fixY) h = opt.y;
      const a = HI.d < 900 ? HI.a : Math.abs(lat); let kind = groundKind(x, z, h, R); if (kind < 0 && !(opt && opt.kind !== undefined)) return;
      if (kind === 0 && d > D_CLIMB && R() < (inBlae(x, z) ? 0.8 : 0.015)) kind = 2;
      if (opt && opt.kind !== undefined) kind = opt.kind;
      let toe = false;                                                     // the burn's banks: moss cushions on the toe slope (their own pass), nothing on the peat face
      if (HI.wB > 0.4 && HI.d < 900 && !lip && !fixY) { if (leg ? a < 2.7 : HI.e < 0.3) return; if (a < HI.bA - 0.5) { if (!toeRad && R.chance(0.4)) return; toe = true; kind = R.chance(0.6) ? 1 : 2; } else if (a < HI.bA + 0.75) return; }
      if (toeRad && !toe) return;
      if (leg && !fixY) { if (HI.d < 140 && (HI.wB > 0 || ridgeW(HI.u) > 0)) h = H(x, z); if (kind === 1 && h > 2.1) kind = 0; }      // now the land as it is (it differs only by the burn and the hag): heather, not bog moss, on the hag
      const bk0 = fixY ? 0 : brackenAt(x, z), sun0 = sunAt(x, z), nearLip = HI.wB > 0.4 && HI.d < 900 && a > HI.bA - 0.5 && a < HI.bA + 4.5;      // (no shade disc at the burn's lip: it would hang out over the cut)
      const rad = toeRad || (dense ? (Math.abs(lat) < 2.2 ? R.range(0.78, 1.05) : R.range(0.95, 1.4)) : R.range(1.0, 1.7)) * (kind === 1 ? 0.9 : 1) * (toe ? 0.5 : lip ? 0.8 : 1);
      const hh = (kind === 1 ? R.range(0.3, 0.46) : R.range(0.5, 0.78)) * Math.min(1, 0.6 + a * 0.13) * (toe ? (toeRad ? 0.85 : 0.6) : 1), tv = R.range(0.8, 1.2);
      const bg = opt && opt.big ? opt.big : 1;
      const o = { x, y: h - 0.04, z, sx: rad * bg * R.range(0.88, 1.18), sy: hh * (opt && opt.tall ? opt.tall : 1), sz: rad * bg * R.range(0.88, 1.18), yaw: R.range(0, 6.28), r: tv, g: tv * R.range(0.93, 1.05), b: tv * R.range(0.96, 1.06), kind, sd: R(), gx: 0, gz: 0 };
      if (opt && opt.tint) { o.r *= opt.tint[0]; o.g *= opt.tint[1]; o.b *= opt.tint[2]; }
      if (opt && opt.y !== undefined) { o.gx = opt.gx || 0; o.gz = opt.gz || 0; }
      else if (dense || R !== rng) { o.gx = clamp((H(x + 0.7, z) - H(x - 0.7, z)) / 1.4, -0.9, 0.9); o.gz = clamp((H(x, z + 0.7) - H(x, z - 0.7)) / 1.4, -0.9, 0.9); }
      if (wide > 0 && !toe) { const hs = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453, fr = hs - Math.floor(hs); if (fr < 0.62 * smoothstep(0.55, 1.02, Math.abs(lat) / wide)) return; }
      if (toe && !toeRad) return;                                          // (the first layout's half-size toe pads: replaced by the toe pass)
      if (opt && opt.skip) return;
      if (z > -165 && z < -10) { const q = wallAt(x, z); if (q.d < 0.45 + 0.7 * Math.max(o.sx, o.sz) && q.s > -1 && q.s < WALL.len + 1) return; }      // none in the dyke
      if (bk0 > 0.4) { const hs = Math.sin(x * 7.31 + z * 3.77) * 4375.8545; if (hs - Math.floor(hs) < (dense ? 0.78 : 0.6) * bk0) return; }      // bracken beds take the place of most mounds
      if (fixY || nearLip) o.ns = true; o.cs = Math.round((1 - sun0) * 8);
      if (toeRad) { const q = R(), k = 0.88; if (q < 0.26) { o.r *= 1.3 * k; o.g *= 0.6 * k; o.b *= 0.85 * k; } else if (q < 0.4) { o.r *= 1.22 * k; o.g *= 0.98 * k; o.b *= 0.6 * k; } else { o.r *= k; o.g *= k; o.b *= k; } }
      if (toeRad && stagNearB(x, z, 2.6 + rad)) return;                    // (the burn stag's slab stands clear)
      const fs = fleeceShade(x, z, h); o.r *= fs; o.g *= fs; o.b *= fs;
      const sg = cSeg[clamp(Math.floor(d / SEGL), 0, NSEG - 1)]; (toeRad ? sg.toe : dense ? (Math.abs(lat) < 5.6 ? sg.core : sg.side) : nearOnly ? sg.outerB : sg.outer).push(o);
    };
    { const STEP = 1.72 / Math.sqrt(Math.max(0.6, detail)); let row = 0;
      for (let d = 0.6; d < D_AIR + 116; d += STEP, row++) {
        // the brow we arrive over and the ramp under the pull-up are seen from above: cover them wider
        const wide = 7.9 + 8 * (1 - smoothstep(42, 72, d)) + 3.5 * smoothstep(D_AIR - 40, D_AIR + 10, d);
        for (let lat = -wide + (row % 2) * STEP * 0.5; lat <= wide; lat += STEP) { if (rng.chance(0.1)) continue; putCushion(d + rng.range(-0.62, 0.62), lat + rng.range(-0.62, 0.62), true, false, wide); }
        for (let k = 0, nk = d > D_AIR - 30 ? 12 : 2; k < nk; k++) if (rng.chance(0.62 * detail)) putCushion(d + rng.range(-1, 1), (rng.chance(0.5) ? 1 : -1) * (wide + 0.7 + (k < 2 ? 19 : 52) * Math.pow(rng(), 1.3)), false, false);
        await ctx.yield();
      }
      // a row of heather on the lip of each peat bank, overhanging the cut face
      for (let d = D_BURN + 6, k = 0; d < D_FOOT - 4; d += 1.2, k++) { for (const sd of [-1, 1]) { if (rng.chance(0.1)) continue; putCushion(d + rng.range(-0.3, 0.3), sd * (bankA(d, sd) + rng.range(0.85, 1.3)), true, true); }
        if (k % 20 === 19) await ctx.yield(); } }
    { // The hinds' ridge is a peat hag: heather mounds crowd its near slope and overhang its crest (clear of the hinds' own lane),
      // so the deer bound along a heathery skyline and not a bare bank.
      const RR = fx.fork('ridge');
      for (let d = (U_R0 - 0.03) * PL, k = 0; d < (U_R1 + 0.012) * PL; d += 1.5, k++) { const rw = ridgeW(d / PL);
        for (let j = 0; j < 4; j++) { const lat = [-4.9, -6.3, -7.7, -15.6][j] - (k % 2) * 0.6, q = RR(), jd = RR.range(-0.6, 0.6), jl = RR.range(-0.5, 0.5), bg = RR.range(1.0, 1.45), tl = RR.range(1.0, 1.35);
          if (rw < 0.25 || q < 0.1) continue; putCushion(d + jd, lat + jl, true, false, 0, RR, 0, false, { big: j ? bg : 0.9, tall: j ? tl : 0.8 }); }
        { const q = RR(), jd = RR.range(-0.6, 0.6), jl = RR.range(0, 1.6), bg = RR.range(1.0, 1.4); if (rw > 0.25 && q > 0.3) putCushion(d + jd, -13.6 - jl, true, false, 0, RR, 0, false, { big: bg }); }
        if (k % 12 === 11) await ctx.yield(); } }
    { // The banks are felt like the rest: big heather and blaeberry mounds stand on each lip and overhang the cut, a second row
      // rises behind them, and moss, blaeberry and heather cushions bulge from the face itself, so no bank shows a straight
      // edge or a flat slab; the peat is seen between them.
      const RL = fx.fork('lips'), P3 = { x: 0, z: 0 };
      for (let d = D_BURN + 3, k = 0; d < D_FOOT - 1; d += 1.0, k++) { for (const sd of [-1, 1]) { const bA = bankA(d, sd);
          beside(d, sd * (bA - 0.35), P3); const y0 = H(P3.x, P3.z), wB = HI.wB; beside(d, sd * (bA + 2.6), P3); const y1 = H(P3.x, P3.z), hF = y1 - y0;
          const j = clamp(Math.round(d / PL * NS), 0, NS), ox = -stz[j] * sd, oz = stx[j] * sd;        // away from the water
          const q1 = RL(), q2 = RL(), q3 = RL(), dj = RL.range(-0.4, 0.4), lj = RL.range(0, 1), bg = RL.range(1.5, 2.15), tl = RL.range(0.92, 1.25), fy = RL.range(0.22, 0.66), fb = RL.range(0.75, 1.2);
          if (wB < 0.3 || hF < 0.7) continue;
          if (k % 2 === 0 && q1 > 0.06) { beside(d + dj, sd * (bA + 0.8 + 0.75 * lj), P3);             // on the lip, bulging over it
            putCushion(d + dj, sd * (bA + 0.6), true, true, 0, RL, 0, false, { x: P3.x, z: P3.z, y: y1 - 0.36, kind: q2 < 0.6 ? 0 : 2, big: Math.min(bg, 1.5), tall: tl, gx: ox * 0.5, gz: oz * 0.5 }); }      // (it drapes over the edge: its rim falls toward the water)
          if (k % 2 === 1 && q1 > 0.2) putCushion(d + dj, sd * (bA + 2.5 + 1.3 * lj), true, true, 0, RL, 0, false, { kind: q2 < 0.5 ? 0 : 2, big: bg * 0.9, tall: tl });      // behind the lip
          if (q3 < 0.72) { beside(d - dj, sd * (bA + 0.08 - 0.3 * (fy - 0.45)), P3);                        // bulging from the face
            const tint = fy < 0.42 ? (q2 < 0.3 ? [1.25, 0.62, 0.84] : q2 < 0.5 ? [1.2, 0.98, 0.62] : [1, 1, 1]) : [1, 1, 1];
            putCushion(d - dj, sd * bA, true, true, 0, RL, 0, false, { x: P3.x, z: P3.z, y: y0 + hF * fy - 0.35, kind: fy < 0.42 ? 1 : q2 < 0.55 ? 2 : 0, big: fb, tall: 0.85, tint, gx: ox * 0.4, gz: oz * 0.4 }); } }
        if (k % 12 === 11) await ctx.yield(); } }
    { // the burn's toe slopes: small sphagnum and moss cushions shoulder to shoulder between the water's edge and the foot of the peat face
      const RT = fx.fork('toe');
      for (let d = D_BURN + 2, k = 0; d < D_FOOT + 3; d += 0.85, k++) { const me = mea(d), hw = hwN(d);
        for (const sd of [-1, 1]) { const top = bankA(d, sd) - 0.4 - sd * me;      // from the burn's centre to the foot of this bank
          for (let lc = hw + 0.75 + RT.range(0, 0.35); lc < top; lc += RT.range(0.8, 1.1)) { const rad0 = RT.range(0.36, 0.7) * (RT.chance(0.22) ? 1.4 : 1), lat = me + sd * lc, low = Math.abs(lat) < 1.9;
            // (nothing tall under the lens: where the burn swings aside, the line crosses a bar of low pads and stones)
            if (RT.chance(0.07) || Math.abs(lat) < 0.8 || eweNear(d, lat)) continue; putCushion(d + RT.range(-0.3, 0.3), lat, true, false, 0, RT, low ? Math.min(rad0, 0.42) : rad0, false, low ? { tall: 0.55 } : null); } }
        if (k % 10 === 9) await ctx.yield(); } }
    { // The ramp and the hill under the pull-up are seen from the air: cheap mounds out to 60-80 m either side of the line, thinning
      // with distance from it by chance, so the cover has no edge (the ground paints the same mounds beyond and between).
      const RO = fx.fork('field'), G = 3.0, dk = Math.min(1, detail);
      for (let d = D_FOOT - 4, row = 0; d < D_AIR + 208; d += G, row++) {
        const rows = d < D_AIR + 113, wide = 7.9 + 3.5 * smoothstep(D_AIR - 40, D_AIR + 10, d), Lmax = lerp(56, 80, smoothstep(D_AIR - 70, D_AIR + 20, d));
        for (let lat = -Lmax + (row % 2) * G * 0.5; lat <= Lmax; lat += G) { const al = Math.abs(lat) - (rows ? wide : 0); if (al < -1.2) continue;
          const t = clamp(al / (Lmax - wide), 0, 1), keep = (0.06 + 0.9 * Math.pow(1 - t * t * (3 - 2 * t), 1.5)) * dk, jd = RO.range(-1.2, 1.2), jl = RO.range(-1.2, 1.2);
          if (RO.chance(1 - keep)) continue;
          beside(d + jd, lat + jl, P2); if (Math.hypot(P2.x - HX, P2.z - HZ) < 24 || Math.hypot(P2.x - stagWorld.x, P2.z - stagWorld.z) < 8.5 || Math.hypot(P2.x - TARN.x, P2.z - TARN.z) < 8.4) continue;
          putCushion(d + jd, lat + jl, false, false, 0, RO, 0, RO.chance(0.45), { skip: inCrown(P2.x, P2.z) }); }
        if (row % 3 === 2) await ctx.yield(); } }
    { // The crown: the nose under the pull-up, the crest between the thorns and their flanks, laid in the tor's own frame (s back
      // along the approach, lat to the right). Fine mounds within 16 m of the line (they get halos and lee shade when the lens is
      // low over them again), cheap ones on the flanks; ling and bell heather with a fifth of blaeberry, so the end is purple.
      const RC = fx.fork('crown'), G = 1.8;
      for (let s0 = S_C0 - 0.9, row = 0; s0 > -38; s0 -= G, row++) { const sc = Math.max(s0, 0), w = tab(CW, sc), d = dOfS(s0), eastMax = sc < 70 ? Math.min(w + 12, 26) : w + 15;
        for (let lat = -(w + 15) + (row % 2) * G * 0.5; lat <= eastMax; lat += G) { const jl = lat + RC.range(-0.62, 0.62), js = s0 + RC.range(-0.62, 0.62), fine = Math.abs(jl) < 16, pick = RC(), miss = RC.chance(fine ? 0.08 : 0.42);
          if (miss || (s0 < 0 && Math.hypot(jl, js) > 39) || Math.hypot(Math.abs(jl) - 15.7, js) < 7.2) continue;
          if (STAG2.some((q) => Math.hypot(jl - q.lat, js - q.s) < (q.lift ? 3.3 : 2.3))) continue;
          const cx = HX + Rx * jl + Ax * js, cz = HZ + Rz * jl + Az * js;
          putCushion(d, jl, fine, false, 0, RC, 0, false, { x: cx, z: cz, kind: pick < (inBlae(cx, cz) ? 0.93 : 0.02) ? 2 : 0 }); }
        if (row % 2 === 1) await ctx.yield(); } }
    const CUSH = /* glsl */`attribute vec4 aInst; uniform vec3 uSunDir; uniform vec4 uShade, uTower;
      float towerSunV(vec3 w){ vec2 sd = normalize(uSunDir.xz + vec2(1e-5, 0.)), tp = uTower.xy - w.xz; float al = dot(tp, sd), pr = abs(tp.x * sd.y - tp.y * sd.x);
        float hr = w.y + al * uSunDir.y / max(length(uSunDir.xz), .05);
        return 1. - uShade.x * .72 * smoothstep(10., 34., al) * (1. - smoothstep(uTower.w + .012 * al, uTower.w + 7. + .04 * al, pr)) * (1. - smoothstep(uTower.z - 34., uTower.z, hr)); }
      float lobes(vec3 d, float sd){ float l = 0.;
        for (int k = 0; k < 5; k++) { float fk = float(k), a = sd * 6.2832 + fk * 1.571 + sin(sd * 40. + fk * 2.) * .5, el = k == 4 ? 1.15 + .3 * fract(sd * 5.7) : .25 + .5 * fract(sd * 7.3 + fk * .37);
          vec3 c = vec3(cos(a) * cos(el), sin(el), sin(a) * cos(el)), e = d - c; l = max(l, (.66 + .34 * fract(sd * 3.1 + fk * .61)) * exp(-dot(e, e) * 2.7)); }
        return l; }
      // a point of the unit mound from its template position (on the unit sphere over the dome, beyond it on the skirt); w = nub height
      vec4 cushP(vec3 p, float sd){ vec3 d = normalize(p + vec3(0., 1e-5, 0.)); float k = smoothstep(.03, .42, p.y), l = lobes(d, sd) * k, r = mix(.96, .82 + .3 * l, k);
        return vec4(p.x * r, p.y * r * (.88 + .24 * l), p.z * r, l); }
      // to world: the base lies on the slope of the ground (aInst.zw) and the crown leans with the gusts
      vec3 cushW(mat4 im, vec3 p0){ vec4 wp = im * vec4(p0, 1.); vec2 off = wp.xz - im[3].xz;
        wp.y += dot(off, aInst.zw) * (1. - smoothstep(.1, .8, p0.y));
        wp.x += (.05 + .06 * nap(wp.xyz)) * max(p0.y, 0.) * uWindK * length(im[1].xyz) * 1.6; return wp.xyz; }
      float moundSun(float y, vec3 dW, float hgt){ float sw = dot(normalize(dW.xz + vec2(1e-5, 0.)), normalize(uSunDir.xz + vec2(1e-4, 0.)));
        return smoothstep(-.14, .16, y * 1.05 + .42 * sw - .5 + (hgt - .62) * .6); }
      vec3 cushGround(float kind, vec2 cp, out float flat_){ vec3 qc = quilt(cp); flat_ = kind < .5 ? qBurnt : 0.;
        return kind < .5 ? qc * (1. + .25 * flat_) : kind < 1.5 ? sphag(cp) : mix(uGrass, uMoss, .6) * vec3(.6, .6, .5); }
    `;
    const cushMat = feltMat({ uniforms: QU,
      vertexShader: VERT_PARS + H2 + QUILT + CUSH + /* glsl */`attribute float aSk; varying float vSun;
        void main(){ mat4 im = modelMatrix * instanceMatrix; float kind = aInst.x, cs = floor(aInst.y), sd = aInst.y - cs, flat_; vec3 ground = cushGround(kind, im[3].xz, flat_);
          float pl = length(position); vec3 d = position / max(pl, 1e-4), t1 = normalize(cross(d, vec3(0., 1., .13))), t2 = cross(d, t1);
          vec4 l0 = cushP(position, sd); vec3 p0 = l0.xyz, p1 = cushP(normalize(d + t1 * .09) * pl, sd).xyz, p2 = cushP(normalize(d + t2 * .09) * pl, sd).xyz;
          vec3 n = normalize(cross(p1 - p0, p2 - p0) + d * 1e-4); n *= sign(dot(n, d) + 1e-5); n = normalize(n * .62 + d * .5);
          n = normalize(mix(n, normalize(vec3(d.x * .5, 1., d.z * .5)), smoothstep(0., .7, aSk)));
          p0.y *= 1. - .6 * flat_;
          vObj = (im * vec4(p0, 1.)).xyz; vec4 wp = vec4(cushW(im, p0), 1.);
          // the low sun: a mound is lit on its crown and its sunward side; its foot and its lee stand in the shade of the next (cs: cast shade from further off)
          vSun = (1. - cs * .125) * towerSunV(im[3].xyz) * mix(1., moundSun(p0.y, mat3(im) * d, length(im[1].xyz)), uShade.x);
          float shade = mix(.74, 1., smoothstep(0., .55, position.y)) * (.82 + .26 * l0.w);
          vCol = mix(ground * instanceColor * 1.02 * shade, ground * .9, smoothstep(.3, 1., aSk)); vWorld = wp.xyz;
          vec3 s2 = vec3(dot(im[0].xyz, im[0].xyz), dot(im[1].xyz, im[1].xyz), dot(im[2].xyz, im[2].xyz)); vNrm = normalize(mat3(im) * (n / max(s2, vec3(1e-6))));
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + /* glsl */`varying float vSun;
        void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)); gSun = vSun;
          // carded flecks: every mound is two or three purples (or greens), not one
          vec3 q = vObj * 4.6; float fwq = abs(dFdx(q.x)) + abs(dFdy(q.x)) + abs(dFdx(q.z)) + abs(dFdy(q.z)), fd = 1. - smoothstep(.5, 1.6, fwq);
          // (no fragment is discarded: a nibbled outline is a stair-stepped one. The outline is softened by the halo strips instead.)
          // far off, where a mound is a few pixels, its lit crown and shaded lee draw together so the field does not sparkle
          gSun = mix(mix(vSun, .5, .45), vSun, 1. - smoothstep(.7, 2.4, fwq));
          float f1 = vn3(q * vec3(1., 2.2, 1.)), f2 = vn3(q.zyx * 1.9 + 11.3);
          vec3 c = mix(vCol, vCol * vec3(.66, .58, .84), smoothstep(.52, .7, f1) * .8 * fd);
          c = mix(c, vCol * vec3(1.2, 1.06, 1.12) + vec3(.02, .004, .014), smoothstep(.6, .78, f2) * .7 * fd);
          gRimK = .7; gRimW = .1;
          gl_FragColor = vec4(atmos(felt(c, N, V, vObj, vWorld, 2.6, 1., 1.25)), 1.); }`,
    });
    // the fuzz halo: a strip on each mound's outline as the lens sees it, combed into short curved hairs of the mound's own colour
    const finMat = feltMat({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...QU, uHair: { value: new THREE.Vector2(0.155, 55) } },
      vertexShader: VERT_PARS + H2 + QUILT + CUSH + /* glsl */`uniform vec2 uHair; uniform vec3 uSunCol, uFillCol; varying vec2 vF; varying float vA;
        void main(){ mat4 im = modelMatrix * instanceMatrix; vec3 c0 = im[3].xyz, ax = im[0].xyz, ay = im[1].xyz, az = im[2].xyz; float kind = aInst.x, cs = floor(aInst.y), sd = aInst.y - cs, flat_;
          vec3 ground = cushGround(kind, c0.xz, flat_);
          // the lens in the mound's unit space, and the circle where lines from it touch the unit sphere
          vec3 rel = cameraPosition - c0, cu = vec3(dot(rel, ax) / max(dot(ax, ax), 1e-6), dot(rel, ay) / max(dot(ay, ay), 1e-6), dot(rel, az) / max(dot(az, az), 1e-6));
          float L2 = max(dot(cu, cu), 1.3); vec3 cn = normalize(cu + vec3(0., 1e-4, 0.));
          vec3 e1 = normalize(cross(vec3(0., 1., 0.), cn) + vec3(1e-4, 0., 0.)), e2 = cross(cn, e1);
          float a = (position.x * 1.24 - .12) * 3.14159, rad = sqrt(1. - 1. / L2), v = position.y;
          vec3 d = cn * inversesqrt(L2) + rad * (cos(a) * e1 + sin(a) * e2);
          vec3 p0 = cushP(d, sd).xyz; p0.y *= 1. - .6 * flat_;
          vec3 w = cushW(im, p0), dirO = normalize(mat3(im) * d + vec3(0., 1e-4, 0.));
          float len = max(uHair.x * (.7 + .6 * fract(sd * 13.7)) * (.6 + .5 * length(ay)), distance(cameraPosition, c0) * .0046);
          w += dirO * (len * v - .03) + vec3(.4, -.1, 0.) * (len * v * v * (.6 + .4 * nap(w)) * uWindK);
          vA = smoothstep(.04, .26, d.y) * (1. - smoothstep(72., 96., distance(cameraPosition, w))) * smoothstep(0., .04, position.x) * (1. - smoothstep(.96, 1., position.x));
          vF = vec2(a * rad * (length(ax) + length(az)) * .5, v);
          float key = dot(dirO, uSunDir) * .5 + .5;
          float sv = (1. - cs * .125) * towerSunV(c0) * mix(1., moundSun(p0.y, mat3(im) * d, length(ay)), uShade.x);
          vCol = (ground * instanceColor * 1.3 + .07) * (uSunCol * (.25 + .75 * key) * sv + uFillCol * .8);
          vWorld = w; vObj = w; vNrm = dirO; vec4 wp = vec4(w, 1.);
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + H2 + /* glsl */`varying vec2 vF; varying float vA;
        void main(){ float u = vF.x * 55., v = vF.y, fw = abs(dFdx(u)) + abs(dFdy(u));
          float u1 = u + v * v * 2.2, u2 = u * 1.31 + 17.3 - v * v * 1.4;
          float l1 = .35 + .65 * h21(vec2(floor(u1), 7.3)), l2 = .3 + .7 * h21(vec2(floor(u2), 3.1));
          float w1 = .5 * max(0., 1. - v / l1), w2 = .5 * max(0., 1. - v / l2);
          float h1 = (1. - smoothstep(w1 * .7, w1 + .08, abs(fract(u1) - .5))) * step(v, l1), h2 = (1. - smoothstep(w2 * .7, w2 + .08, abs(fract(u2) - .5))) * step(v, l2);
          float hair = max(h1, h2 * .85), soft = (1. - v) * (1. - v) * .72;
          float al = mix(max(hair, soft * (1. - v)), soft * 1.25, smoothstep(.3, 1.1, fw)) * vA * (1. - .3 * v);
          if (al < .02) discard;
          gl_FragColor = vec4(atmos(vCol), clamp(al, 0., 1.)); }`,
    });
    const shadeMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6,
      uniforms: { uCol: { value: night ? C('#05061a') : C('#33255e') }, uSunXZ: { value: new THREE.Vector2(L.sunDir.x, L.sunDir.z).normalize() }, uK: { value: night ? 0.42 : lookId === 'hillfog' ? 0.26 : 0.44 } },
      vertexShader: /* glsl */`attribute vec4 aInst; uniform vec2 uSunXZ; varying float vA;
        void main(){ mat4 im = modelMatrix * instanceMatrix; vec3 c = im[3].xyz; float r = (length(im[0].xyz) + length(im[2].xyz)) * .68, hgt = length(im[1].xyz);
          vec2 off = position.xz * r * (1. + .8 * abs(dot(normalize(position.xz + 1e-4), uSunXZ))) - uSunXZ * (r * .42 + hgt * 1.25);
          vec3 wp = vec3(c.x + off.x, c.y + .1 + dot(off, aInst.zw), c.z + off.y);
          vA = position.y * (1. - smoothstep(45., 75., distance(wp, cameraPosition)));
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; uniform float uK; varying float vA; void main(){ float a = vA * vA * (3. - 2. * vA) * uK; if (a < .004) discard; gl_FragColor = vec4(uCol, a); }` });
    const segMesh = (base, mat, list, name, order) => { if (!list.length) return null;
      const g = new THREE.BufferGeometry(); g.setAttribute('position', base.attributes.position); if (base.attributes.aSk) g.setAttribute('aSk', base.attributes.aSk); g.setIndex(base.index);
      const ai = new Float32Array(list.length * 4); for (let i = 0; i < list.length; i++) { const o = list[i]; ai[i * 4] = o.kind; ai[i * 4 + 1] = Math.min(o.sd, 0.999) + (o.cs || 0); ai[i * 4 + 2] = o.gx; ai[i * 4 + 3] = o.gz; }
      g.setAttribute('aInst', new THREE.InstancedBufferAttribute(ai, 4));
      const im = new THREE.InstancedMesh(g, mat, list.length);
      for (let i = 0; i < list.length; i++) { const o = list[i]; e4.set(0, o.yaw, 0, 'YXZ'); m4.compose(v4.set(o.x, o.y, o.z), q4.setFromEuler(e4), s4.set(o.sx, o.sy, o.sz)); im.setMatrixAt(i, m4); im.setColorAt(i, c4.setRGB(o.r, o.g, o.b)); }
      im.frustumCulled = false; im.name = name; im.visible = false; if (order) im.renderOrder = order; scene.add(im); return im; };
    for (let i = 0; i < NSEG; i++) { const sg = cSeg[i], all = sg.core.concat(sg.side);
      sg.hi = segMesh(domeHi, cushMat, sg.core, 'cushions', 0); sg.midC = segMesh(domeMid, cushMat, sg.core, 'cushions-mid', 0); sg.midS = segMesh(domeMid, cushMat, sg.side, 'cushions-mid', 0);
      await ctx.yield();
      sg.lo = segMesh(domeLo, cushMat, all, 'cushions-far', 0); sg.out = segMesh(domeLo, cushMat, sg.outer, 'cushions-outer', 0); sg.outB = segMesh(domeLo, cushMat, sg.outerB, 'cushions-outer', 0);
      await ctx.yield();
      sg.shade = segMesh(shadeGeo, shadeMat, all.filter((o) => !o.ns), 'cushion-shade', 1); sg.fin = segMesh(finGeo, finMat, sg.core, 'cushion-halo', 2); sg.finS = i * SEGL < D_C0 - 40 ? segMesh(finLo, finMat, sg.side, 'cushion-halo', 2) : null; sg.finM = i * SEGL < 230 || i * SEGL > D_C0 - 60 ? segMesh(finLo, finMat, sg.core, 'cushion-halo', 2) : null;
      await ctx.yield();
      sg.toeM = segMesh(domeToe, cushMat, sg.toe, 'cushions-toe', 0); sg.toeL = segMesh(domeLo, cushMat, sg.toe, 'cushions-toe-far', 0); sg.toeS = segMesh(shadeGeo, shadeMat, sg.toe, 'cushion-shade', 1); sg.toeF = segMesh(finLo, finMat, sg.toe, 'cushion-halo', 2);
      await ctx.yield(); }
    // which segments draw what, from how far along the path the lens is
    // (once the lens has lifted off the ramp the mounds are far below it: no fine domes or halos then)
    const cushLOD = (D) => { const aloft = D > D_AIR + 16 && D < D_C0 + 4; for (let i = 0; i < NSEG; i++) { const sg = cSeg[i], d0 = i * SEGL, d1 = d0 + SEGL, hiS = !aloft && d1 > D - 8 && d0 < D + 30, midS = !hiS && d1 > D - 14 && d0 < D + 76, inR = d1 > D - 14 && d0 < D + 300;
      if (sg.hi) sg.hi.visible = hiS; if (sg.midC) sg.midC.visible = midS; if (sg.midS) sg.midS.visible = hiS || midS; if (sg.lo) sg.lo.visible = inR && !hiS && !midS; if (sg.out) sg.out.visible = inR && d0 < D + 155; if (sg.outB) sg.outB.visible = inR && d0 < D + 105;
      if (sg.shade) sg.shade.visible = hiS || (d1 > D - 8 && d0 < D + 62); if (sg.fin) sg.fin.visible = hiS; if (sg.finS) sg.finS.visible = (hiS || midS) && d0 < D + 44; if (sg.finM) sg.finM.visible = midS && d0 < D + 44;
      const toeN = d1 > D - 4 && d0 < D + 13; if (sg.toeM) sg.toeM.visible = toeN; if (sg.toeL) sg.toeL.visible = !toeN && d1 > D - 14 && d0 < D + 72; if (sg.toeS) sg.toeS.visible = toeN; if (sg.toeF) sg.toeF.visible = toeN; } };
    cushLOD(0);
    await ctx.yield();

    // ---------------------------------------------------------------- sprigs: cotton-grass, rushes, deer-grass and stray fibres (camera-facing blades)
    const sprigGeo = (blades, head) => { const b = new Buf({ position: 3, aUV: 4 });
      for (const bl of blades) { const base = b.n; for (let k = 0; k <= bl.segs; k++) { const t = k / bl.segs, r = bl.lean * t * t, o = bl.o || [0, 0, 0]; for (const sd of [-1, 1]) b.push({ position: [o[0] + Math.cos(bl.yaw) * r, o[1] + t * bl.h, o[2] + Math.sin(bl.yaw) * r], aUV: [sd, t, 0, 0] }); }
        for (let k = 0; k < bl.segs; k++) { const a = base + k * 2; b.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      if (head) { const base = b.n; for (const [hx, hv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) b.push({ position: head, aUV: [hx, 1, 1, hv] }); b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); }
      return b.build(false); };
    const sprigMat = (o) => feltMat({ side: THREE.DoubleSide,
      uniforms: { uSprig: { value: new THREE.Vector4(o.sway, o.gust, o.width, o.head || 0) }, uFlut: { value: new THREE.Vector3(o.flutX, o.flutY, o.freq) }, uHead: { value: o.headCol || C('#ffffff') }, uTip: { value: o.tip }, uFar: { value: new THREE.Vector2(o.far * 0.7, o.far) } },
      vertexShader: VERT_PARS + /* glsl */`attribute vec4 aUV; uniform vec4 uSprig; uniform vec3 uFlut; uniform vec2 uFar; varying vec3 vQ; varying float vT;
        void main(){ mat4 im = modelMatrix * instanceMatrix; float t = aUV.y, hgt = length(im[1].xyz), tt = t * t;
          vec4 wp = im * vec4(position, 1.); float sd = im[3].x * 1.7 + im[3].z * 2.3, g = nap(wp.xyz) * .5 + .5;
          float bend = (uSprig.x + uSprig.y * g) * uWindK;
          wp.x += bend * tt * hgt + sin(uTime * uFlut.z + sd + t * 2.) * uFlut.x * tt * hgt;
          wp.y += -bend * bend * tt * hgt * .3 + sin(uTime * uFlut.z * 1.3 + sd * 1.7 + t * 3.) * uFlut.y * tt * hgt;
          wp.z += sin(uTime * uFlut.z * .6 + sd * 1.3) * uFlut.x * tt * hgt;
          vec3 toC = cameraPosition - wp.xyz; float dist = length(toC); toC /= max(dist, 1e-3);
          float far = 1. - smoothstep(uFar.x, uFar.y, dist);
          vec3 ax = normalize(mat3(im) * vec3(0., 1., 0.) + vec3(bend * t * 1.5, 1e-4, 0.));
          vec3 side = normalize(cross(ax, toC) + vec3(1e-4, 0., 0.));
          if (aUV.z > .5) { float hw = max(uSprig.w * 1.5, dist * .0034) * far; vec3 upc = normalize(cross(toC, side) + vec3(0., 1e-4, 0.)); wp.xyz += (side * aUV.x + upc * aUV.w) * hw; }
          else { float w = max(uSprig.z * (1. - .8 * t), dist * .0022) * far; wp.xyz += side * aUV.x * w * .5; }
          wp.y -= (1. - far) * hgt * t;
          vQ = vec3(aUV.x, aUV.w, aUV.z); vT = t; vCol = instanceColor; vObj = wp.xyz; vWorld = wp.xyz; vNrm = vec3(0., 1., 0.);
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + /* glsl */`uniform vec3 uHead, uTip; varying vec3 vQ; varying float vT;
        void main(){ vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)), N = normalize(vec3(0., .8, 0.) + V * .6); vec3 base; float ao = 1.;
          if (vQ.z > .5) { vec2 hq = vec2(clamp(vQ.x, -1., 1.) * .8 - .16, clamp(vQ.y, -1., 1.) * 1.25 + .1); float an = atan(hq.y, hq.x + 1e-4), r2 = dot(hq, hq) / (.5 + .2 * sin(an * 5. + vWorld.x * 3.) + .14 * sin(an * 9. + 1.7) + .16 * hq.x);
            if (r2 > 1.) discard; base = uHead * (1. - .3 * r2); N = normalize(N + vec3(vQ.x, vQ.y, 0.) * .4); }
          else { base = mix(vCol, uTip, vT * vT); ao = .5 + .5 * vT; }
          gl_FragColor = vec4(atmos(felt(base, N, V, vWorld * 3., vWorld, 1., ao, 1.)), 1.); }`,
    });
    // cotton-grass: a real plant that is already wool
    const cottonList = [], june = LK.season === 'june';
    for (let i = 0, n = Math.round(2500 * dens * detail * (june ? 1.5 : 1)); i < n; i++) {
      let x, z;
      if (i % 5 < 3 && pools.length) { const p = pools[rng.int(0, pools.length - 1)], a = rng.range(0, 6.2832), r = p.r * 1.12 + 0.25 + rng.range(0, 1.7) * rng(); x = p.x + Math.cos(a) * r; z = p.z + Math.sin(a) * r; }
      else { const d = rng.range(D_BOG - 14, D_BURN + 6), lat = (rng.chance(0.5) ? 1 : -1) * (1.0 + 11 * Math.pow(rng(), 1.6)); beside(d, lat, P2); x = P2.x; z = P2.z; }
      if ((i & 255) === 255) await ctx.yield();
      if (inPool(x, z, 0.1)) continue; const hT = Hl(x, z); if (HI.d < 0.9 || hT > 2.4) continue;
      const hh = rng.range(0.34, 0.56), tv = rng.range(0.8, 1.1), yaw = rng.range(0, 6.28), h = HI.d < 140 && (HI.wB > 0 || ridgeW(HI.u) > 0) ? H(x, z) : hT; if (h > 3) continue;
      cottonList.push({ x, y: h + 0.05, z, sx: 1, sy: hh, sz: 1, yaw, r: 0.33 * tv, g: 0.36 * tv, b: 0.16 * tv });
    }
    // drifts of it, thick as a flock, where the heath runs down into the bog
    { const RCo = nx.fork('cotton'), Q = { x: 0, z: 0 };
      for (let g = 0; g < 7; g++) { const d0 = D_BOG - 25 + g * 17 + RCo.range(-5, 5), l0 = (g % 2 ? 1 : -1) * RCo.range(4, 11);
        for (let i = 0; i < Math.round(130 * detail); i++) { const a = RCo.range(0, 6.2832), r = 5.5 * Math.sqrt(RCo()), hh = RCo.range(0.36, 0.6), tv = RCo.range(0.8, 1.1), yaw = RCo.range(0, 6.28); beside(d0 + Math.cos(a) * r * 1.6, l0 + Math.sin(a) * r, Q);
          if (inPool(Q.x, Q.z, 0.1)) continue; const h = H(Q.x, Q.z); if (h > 3 || HI.d < 0.9) continue;
          cottonList.push({ x: Q.x, y: h + 0.05, z: Q.z, sx: 1, sy: hh, sz: 1, yaw, r: 0.33 * tv, g: 0.36 * tv, b: 0.16 * tv }); }
        await ctx.yield(); } }
    const cottonMesh = instanced(sprigGeo([{ yaw: 0, lean: 0.12, h: 1, segs: 2 }], [0.12, 1.02, 0]), sprigMat({ sway: 0.2, gust: 0.42, width: 0.022, head: 0.062, flutX: 0.05, flutY: 0.02, freq: 6.5, headCol: cWhite.clone().multiplyScalar(0.8), tip: C('#8a7a3a'), far: 95 }), cottonList, 'cotton-grass');
    await ctx.yield();
    // tufts: copper-tipped deer-grass in the bog and moor grass among the heather (two meshes, drawn only near their stretch)
    const tuftGeo = sprigGeo([0, 1, 2, 3].map((k) => ({ yaw: k * 1.571 + 0.3, lean: 0.34 + 0.12 * (k % 2), h: 1 - 0.14 * (k % 3), segs: 2 })), null);
    const tuftA = [], tuftB = [];
    for (let i = 0, n = Math.round(1500 * detail); i < n; i++) {
      if ((i & 255) === 255) await ctx.yield();
      const m = i % 3; let d, lat;
      if (m < 2) { d = rng.range(D_BOG - 10, D_BURN + 8); lat = (rng.chance(0.5) ? 1 : -1) * (0.8 + 12 * Math.pow(rng(), 1.5)); }
      else { d = rng.range(0, D_AIR + 60); lat = (rng.chance(0.5) ? 1 : -1) * (0.6 + 9 * Math.pow(rng(), 1.4)); }
      beside(d, lat, P2); if (inPool(P2.x, P2.z, 0.05)) continue; const h = H(P2.x, P2.z); if (HI.wB > 0.3 && HI.a < HI.bA + 0.8) continue;
      const tv = rng.range(0.75, 1.15), hh = rng.range(0.26, 0.48), col = m < 2 ? [0.26, 0.28, 0.1] : [0.3, 0.3, 0.14];
      (d < D_BURN + 8 ? tuftA : tuftB).push({ x: P2.x, y: h - 0.03, z: P2.z, sx: hh * 0.8, sy: hh, sz: hh * 0.8, yaw: rng.range(0, 6.28), r: col[0] * tv, g: col[1] * tv, b: col[2] * tv });
    }
    await ctx.yield();
    { const RR2 = fx.fork('ridge-tufts');        // deer-grass and moor grass up the face of the hinds' ridge
      for (let i = 0; i < Math.round(170 * detail); i++) { const d = RR2.range((U_R0 - 0.02) * PL, (U_R1 + 0.006) * PL), lat = -RR2.range(3.4, 12.0), tv = RR2.range(0.75, 1.15), hh = RR2.range(0.3, 0.56), yaw = RR2.range(0, 6.28);
        beside(d, lat, P2); if (inPool(P2.x, P2.z, 0.05)) continue; const h = H(P2.x, P2.z);
        tuftA.push({ x: P2.x, y: h - 0.03, z: P2.z, sx: hh * 0.8, sy: hh, sz: hh * 0.8, yaw, r: 0.27 * tv, g: 0.28 * tv, b: 0.11 * tv }); } }
    await ctx.yield();
    const tuftMat = sprigMat({ sway: 0.16, gust: 0.36, width: 0.04, flutX: 0.045, flutY: 0.015, freq: 7.5, tip: LK.season === 'august' ? C('#b0703a') : C('#c08a3a'), far: 80 });
    const tuftMeshA = instanced(tuftGeo, tuftMat, tuftA, 'tufts'), tuftMeshB = instanced(tuftGeo, tuftMat, tuftB, 'tufts');
    const tuftC = [], rushMore = [], RT2 = fx.fork('toe-sprigs');       // deer-grass and rushes among the cushions of the toe slopes
    for (let d = D_BURN + 3, k = 0; d < D_FOOT + 2; d += 1.0, k++) { if (k % 40 === 39) await ctx.yield();
      for (const sd of [-1, 1]) { const me = mea(d), lo = hwN(d) + 0.85, top = bankA(d, sd) - 0.45 - sd * me; if (top - 0.05 <= lo) continue;
        for (let j = 0; j < 3; j++) { const dd = d + RT2.range(-0.5, 0.5), lat = me + sd * RT2.range(lo, top), tv = RT2.range(0.75, 1.15), hh = j < 2 ? RT2.range(0.3, 0.5) : RT2.range(0.42, 0.72), yaw = RT2.range(0, 6.28);
          if (j === 1) continue; if (eweNear(dd, lat) || Math.abs(lat) < (j < 2 ? 0.9 : 1.6)) continue;
          beside(dd, lat, P2); const h = H(P2.x, P2.z); if (HI.wB < 0.25 || stagNearB(P2.x, P2.z, 2.6)) continue;
          if (j < 2) tuftC.push({ x: P2.x, y: h - 0.03, z: P2.z, sx: hh * 0.8, sy: hh, sz: hh * 0.8, yaw, r: 0.26 * tv, g: 0.28 * tv, b: 0.1 * tv });
          else if (k % 2 === 0) rushMore.push({ x: P2.x, y: h - 0.04, z: P2.z, sx: hh * 0.62, sy: hh, sz: hh * 0.62, yaw, r: 0.1 * tv, g: 0.2 * tv, b: 0.075 * tv }); } } }
    const tuftMeshC = instanced(tuftGeo, tuftMat, tuftC, 'tufts');
    await ctx.yield();
    // soft rush: a clump every stride along both edges of the burn, and more up the mossy toe of each bank
    const rushList = [];
    for (let d = D_BURN + 1, k = 0; d < D_FOOT + 9; d += 0.8, k++) { if (k % 50 === 49) await ctx.yield(); for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) {
      const u = d / PL, hw = hwAt(u), dd = d + rng.range(-0.3, 0.3); if (j === 1 && rng.chance(0.55)) continue;
      const bA = bankA(dd, sd), hi = Math.max(hw + 0.9, bA - 0.25), al = j === 0 ? hw + rng.range(0.12, 0.75) : rng.range(hw + 0.8, hi);
      beside(dd, sd * al, P2); Hl(P2.x, P2.z); if (HI.wB < 0.25) continue;
      const tv = rng.range(0.75, 1.2), hh0 = j === 0 ? rng.range(0.55, 0.95) : rng.range(0.4, 0.7), yaw = rng.range(0, 6.28);
      // (where the burn runs now: the same clump, the same way out from the water's edge)
      const me = mea(dd), hn = hwN(dd), lat = me + sd * (j === 0 ? hn + al - hw : hn + 0.8 + (al - hw - 0.8) / Math.max(0.1, hi - hw - 0.8) * Math.max(0.1, bA - 0.25 - sd * me - hn - 0.8)), hh = Math.abs(lat) < 1.5 ? Math.min(hh0, 0.42) : hh0;
      beside(dd, lat, P2); const h = H(P2.x, P2.z); if (stagNearB(P2.x, P2.z, 2.4)) continue;
      rushList.push({ x: P2.x, y: h - 0.04, z: P2.z, sx: hh * 0.62, sy: hh, sz: hh * 0.62, yaw, r: 0.1 * tv, g: 0.2 * tv, b: 0.075 * tv });
    } }
    const rushMesh = instanced(sprigGeo([0, 1, 2, 3].map((k) => ({ yaw: k * 1.571 + 0.4, lean: 0.2 + 0.16 * (k % 2), h: 1 - 0.16 * (k % 3), segs: 2 })), null),
      sprigMat({ sway: 0.14, gust: 0.34, width: 0.034, flutX: 0.04, flutY: 0.012, freq: 6.5, tip: C('#8a6a34'), far: 90 }), rushList.concat(rushMore), 'rushes');
    await ctx.yield();
    // stray fibres: wool caught on the rowan, the stell and the boulders, streaming downwind
    const fibGeo = sprigGeo([{ yaw: 1.2, lean: 0.45, h: 1, segs: 3 }], null), fibList = [];
    const fibMat = sprigMat({ sway: 0.04, gust: 0.1, width: 0.02, flutX: 0.04, flutY: 0.16, freq: 9, tip: cWhite.clone().multiplyScalar(0.8), far: 60 });

    await ctx.yield();
    // ---------------------------------------------------------------- felt granite: boulders, the fox's seat, the stags' crag, the stell
    // three meshes, drawn only near their stretch: A = the heath, the bog and the tor's own scatter (always), B = the burn, C = the ramp
    const ICO = [null];
    for (let det = 1; det <= 3; det++) { ICO.push(icoData(det)); await ctx.yield(); }
    const rockBufA = new Buf({ position: 3, color: 3, aAo: 1 }), rockBufB = new Buf({ position: 3, color: 3, aAo: 1 }), rockBufC = new Buf({ position: 3, color: 3, aAo: 1 }), rockBufB2 = new Buf({ position: 3, color: 3, aAo: 1 }), rockBufD = new Buf({ position: 3, color: 3, aAo: 1 }), rockBufS = new Buf({ position: 3, color: 3, aAo: 1 }), rockBufE = new Buf({ position: 3, color: 3, aAo: 1 }); let rockBuf = rockBufB;
    const D_BMID = lerp(D_BURN, D_FOOT, 0.5);     // the burn's stones in two halves and the ramp's small stones on their own, each drawn only when near
    const cGranDark = cGranite.clone().multiplyScalar(0.6).lerp(C('#5a5878'), 0.35), cWet = cGranite.clone().multiplyScalar(0.3).lerp(C('#2a2c44'), 0.4), cLichen = cGranite.clone().lerp(C('#c9c4b0'), 0.5), cMossy = cGranite.clone().lerp(cMoss, 0.55);
    const pushRock = (b) => {
      const I = ICO[b.det || 2], n = I.pos.length / 3, base = rockBuf.n, ex = b.ex || 3.2, tone = (0.74 + 0.24 * ((b.seed * 7.13) % 1)) * (b.tone || 1);
      q4.setFromEuler(e4.set(b.tx || 0, b.yaw || 0, b.tz || 0, 'YXZ'));
      for (let i = 0; i < n; i++) {
        let dx = I.pos[i * 3], dy = I.pos[i * 3 + 1], dz = I.pos[i * 3 + 2];
        const m = Math.pow(Math.abs(dx) ** ex + Math.abs(dy) ** ex + Math.abs(dz) ** ex, -1 / ex); dx *= m; dy *= m; dz *= m;
        const nz = noise.fbm3(dx * 1.3 + b.seed, dy * 1.3, dz * 1.3 + b.seed * 0.7, 2), k = 1 + 0.12 * nz + 0.025 * noise.n3(dx * 4.1 + b.seed, dy * 4.1, dz * 4.1);
        v4.set(dx * b.rx * k, dy * b.ry * k, dz * b.rz * k).applyQuaternion(q4);
        const upF = clamp(dy * 1.4 + 0.2, 0, 1);
        c4.copy(cGranite).multiplyScalar(tone * (0.92 + 0.14 * nz)).lerp(cLichen, clamp(upF * (0.05 + 0.5 * noise.n3(dx * 2 + 5, dy * 2, dz * 2 + b.seed)), 0, 0.4));
        if (b.moss) c4.lerp(cMossy, clamp(upF * b.moss * (0.5 + noise.n3(dx * 1.7, b.seed, dz * 1.7)), 0, 0.7));
        c4.lerp(cGranDark, clamp((0.45 - dy) * 0.45, 0, 0.7));
        if (b.wetY !== undefined) c4.lerp(cWet, 0.85 * smoothstep(b.wetY + 0.17, b.wetY + 0.04, b.y + v4.y));       // a stone in the burn: dark below the waterline
        rockBuf.push({ position: [b.x + v4.x, b.y + v4.y, b.z + v4.z], color: [c4.r, c4.g, c4.b], aAo: [clamp(0.5 + 0.5 * (dy * 0.5 + 0.5) + 0.15 * upF, 0.45, 1)] });
      }
      for (let i = 0; i < I.idx.length; i++) rockBuf.idx.push(base + I.idx[i]);
    };
    const rockAt = (d, lat, r, o = {}) => { beside(d, lat, P2); const h = H(P2.x, P2.z), ry = r * (o.flat || rng.range(0.6, 0.85)), y = h + ry * (o.sit ?? 0.45);
      if (!o.low && (!path.isClear(P2.x, y, P2.z, r * 1.25, 6) || Math.hypot(P2.x - stagWorld.x, P2.z - stagWorld.z) < 13 + r)) return null;
      const b = { x: P2.x, y, z: P2.z, rx: r * rng.range(1.0, 1.35), ry, rz: r * rng.range(0.9, 1.1), yaw: rng.range(0, 6.28), tx: rng.range(-0.15, 0.15), tz: rng.range(-0.15, 0.15), det: o.det || 2, seed: rng.range(0, 99), moss: o.moss ?? 0.5, ex: o.ex, wetY: o.wet ? waterY(d) + 0.03 : undefined };
      pushRock(b); return b; };
    // wool snagged on a boulder: a few long fibres streaming off its crown
    const woolOn = (b, n) => { for (let k = 0; k < n; k++) { const len = rng.range(0.5, 1.5) * Math.min(1.6, 0.6 + b.ry), tv = rng.range(0.66, 0.82);
      fibList.push({ x: b.x + rng.range(-0.5, 0.5) * b.rx, y: b.y + b.ry * rng.range(0.55, 0.92), z: b.z + rng.range(-0.5, 0.5) * b.rz, sx: len, sy: len, sz: len, yaw: rng.range(-0.6, 0.6), rz: -rng.range(0.8, 1.35), r: tv, g: tv * 0.97, b: tv * 0.9 }); } };
    // the burn: boulders on the banks, stones in the water that the roving parts round, small stones on the mossy toes
    for (let i = 0; i < 18; i++) { if (i % 3 === 0) await ctx.yield(); const d = rng.range(D_BURN + 12, D_FOOT - 4), sd = rng.chance(0.5) ? 1 : -1, r = rng.range(0.35, 0.72), hi = Math.max(3.0, bankA(d, sd) - 0.6 - r * 0.5), al = rng.range(2.9, hi), me = mea(d), lo2 = hwN(d) + 0.5, lat = me + sd * (lo2 + (al - 2.9) / Math.max(0.1, hi - 2.9) * Math.max(0.2, bankA(d, sd) - 0.6 - r * 0.5 - sd * me - lo2));
      rockBuf = d < D_BMID ? rockBufB : rockBufB2; const b = rockAt(d, lat, r, { low: true, moss: 0.95, sit: 0.3 }); if (b && rng.chance(0.5)) woolOn(b, 3); }
    await ctx.yield();
    { rockBuf = BST.d < D_BMID ? rockBufB : rockBufB2; const RS2 = n7.fork('burn-stag');
      pushRock({ x: BST.x, y: BST.y + 0.22, z: BST.z, rx: 2.15, ry: 0.5, rz: 1.6, yaw: BST.yaw + 1.5708, tx: 0.03, tz: -0.02, det: 3, seed: RS2.range(0, 99), moss: 0.35, ex: 3.4, wetY: waterY(BST.d) + 0.03 });
      pushRock({ x: BST.x - 1.5, y: BST.y + 0.1, z: BST.z + 1.3, rx: 0.8, ry: 0.32, rz: 0.6, yaw: RS2.range(0, 6.28), tx: 0.05, tz: 0.04, det: 2, seed: RS2.range(0, 99), moss: 0.4, wetY: waterY(BST.d) + 0.03 }); }
    const wStones = [];
    for (let i = 0; i < 15; i++) { if (i % 5 === 4) await ctx.yield(); const d = D_BURN + 16 + (i + rng.range(0.1, 0.9)) * (D_FOOT - D_BURN - 26) / 15, u = d / PL; if (stepDrop(u) > 0.25 || Math.abs((u - U_STEP1) * PL) < 5 || Math.abs((u - U_STEP2) * PL) < 5) continue;
      rockBuf = d < D_BMID ? rockBufB : rockBufB2; const r = rng.range(0.4, 0.6), lc = (i % 2 ? 1 : -1) * rng.range(0.35, Math.max(0.4, hwAt(u) - 0.55)) * hwN(d) / hwAt(u), b = rockAt(d, mea(d) + lc, r, { low: true, det: i % 2 ? 2 : 3, moss: 0.25, flat: 0.7, sit: 0.8, wet: true });
      wStones.push({ d, lat: lc, r: Math.max(b.rx, b.rz) }); }
    await ctx.yield();
    // stones across the riffles and on the lips of the two falls: the water breaks white round them
    { const RF2 = nx.fork('riffle'), Q = { x: 0, z: 0 };
      for (const [dq, n] of [...RIFF.map((d) => [d, 7]), [U_STEP1 * PL - 1.6, 6], [U_STEP2 * PL - 1.6, 6]]) for (let i = 0; i < n; i++) { if (i === 0) await ctx.yield(); const d = dq + RF2.range(-2.2, 2.2), hw = hwN(d), lc = (i / (n - 1) * 2 - 1) * (hw + 0.3) + RF2.range(-0.3, 0.3), r = RF2.range(0.2, 0.42), ry = r * RF2.range(0.55, 0.75);
        beside(d, mea(d) + lc, Q); const h = H(Q.x, Q.z); rockBuf = d < D_BMID ? rockBufB : rockBufB2;
        pushRock({ x: Q.x, y: h + ry * 0.55, z: Q.z, rx: r * RF2.range(1, 1.35), ry, rz: r * RF2.range(0.9, 1.1), yaw: RF2.range(0, 6.28), tx: RF2.range(-0.15, 0.15), tz: RF2.range(-0.15, 0.15), det: 1, seed: RF2.range(0, 99), moss: 0.2, wetY: waterY(d) + 0.03 });
        if (Math.abs(lc) < hw) wStones.push({ d, lat: lc, r: r * 1.1 }); } }
    await ctx.yield();
    for (let i = 0, n = Math.round(135 * detail); i < n; i++) { if (i % 10 === 9) await ctx.yield(); const d = rng.range(D_BURN + 3, D_FOOT + 6), sd = rng.chance(0.5) ? 1 : -1, hw = hwAt(d / PL), r = rng.range(0.11, 0.3) * (rng.chance(0.12) ? 1.6 : 1);
      rockBuf = d < D_BMID ? rockBufB : rockBufB2; const hi = Math.max(hw + 0.3, bankA(d, sd) - 0.3), al = rng.range(hw + 0.15, hi), me = mea(d), hn = hwN(d), lat = me + sd * (hn + 0.15 + (al - hw - 0.15) / Math.max(0.1, hi - hw - 0.15) * Math.max(0.15, bankA(d, sd) - 0.3 - sd * me - hn - 0.15));
      const b = rockAt(d, lat, r, { low: true, det: 1, moss: 0.5, sit: 0.25, flat: rng.range(0.55, 0.8) }); if (b && rng.chance(0.16)) woolOn(b, 2); }
    await ctx.yield();
    rockBuf = rockBufC;
    // the ramp: big boulders well off the line, wool-fringed ones close beside it, two stacked outcrops that break the skyline early on
    for (let i = 0; i < 16; i++) { if (i % 4 === 3) await ctx.yield(); const r = rng.range(1.2, 3.1); rockAt(rng.range(D_FOOT + 14, D_AIR + 45), (rng.chance(0.5) ? 1 : -1) * (rng.range(8.5, 30) + r), r, { det: r > 2.3 ? 3 : 2 }); }
    await ctx.yield();
    rockBuf = rockBufD;
    for (let i = 0; i < 18; i++) { if (i % 4 === 3) await ctx.yield(); const r = rng.range(0.8, 1.6), b = rockAt(rng.range(D_FOOT + 10, D_AIR + 16), (rng.chance(0.5) ? 1 : -1) * (rng.range(5.6, 11) + r), r, { low: true, det: 2, moss: 0.55, sit: 0.36 }); if (b) woolOn(b, 5); }
    rockBuf = rockBufC;
    for (const [dd, lat, r] of [[38, -12.5, 2.9], [78, 13.5, 2.5]]) { const d = D_FOOT + dd, b = rockAt(d, lat, r, { low: true, det: 3, flat: 0.72, sit: 0.5, moss: 0.4, ex: 3.4 }); woolOn(b, 9);
      beside(d, lat, P2); const top = { x: P2.x + 0.4, y: b.y + b.ry * 0.9 + r * 0.42, z: P2.z - 0.3, rx: r * 0.74, ry: r * 0.46, rz: r * 0.62, yaw: rng.range(0, 6.28), tx: 0.06, tz: -0.05, det: 2, seed: rng.range(0, 99), moss: 0.25, ex: 3.6 }; pushRock(top); woolOn(top, 6);
      rockAt(d - r * 1.3, lat + Math.sign(lat) * r * 0.9, r * 0.5, { low: true, det: 2, flat: 0.7, sit: 0.35 }); }
    rockBuf = rockBufD; await ctx.yield();
    for (let i = 0, n = Math.round(72 * detail); i < n; i++) { if (i % 12 === 11) await ctx.yield(); const r = rng.range(0.2, 0.55) * (rng.chance(0.15) ? 1.5 : 1);
      const b = rockAt(rng.range(D_FOOT + 2, D_AIR + 40), (rng.chance(0.5) ? 1 : -1) * (1.2 + 7.5 * Math.pow(rng(), 1.2)), r, { low: true, det: 1, moss: 0.35, sit: 0.2, flat: rng.range(0.5, 0.75) }); if (b && rng.chance(0.3)) woolOn(b, 2); }
    await ctx.yield();
    rockBuf = rockBufC;
    // the stags' crag: three stacked woolsack slabs
    { let y = cragG - 0.9; const RY = [2.55, 2.25, 1.9], RX = [6.4, 5.6, 5.0];
      for (let k = 0; k < 3; k++) { const top = k === 2; pushRock({ x: stagWorld.x + (top ? 0.2 : rng.range(-0.7, 0.7)), y: y + RY[k], z: stagWorld.z + (top ? 0.2 : rng.range(-0.7, 0.7)), rx: RX[k] * rng.range(0.96, 1.06), ry: RY[k], rz: RX[k] * 0.8, yaw: rng.range(0, 6.28), tx: rng.range(-0.04, 0.04), tz: rng.range(-0.04, 0.04), det: 3, seed: rng.range(0, 99), moss: k === 0 ? 0.5 : 0.25, ex: 3.6 }); y += RY[k] * 2 * 0.86; }
      for (let k = 0; k < 4; k++) { const a = rng.range(0, 6.2832), rr = rng.range(6.2, 8.5), r = rng.range(1.0, 2.0), x = stagWorld.x + Math.cos(a) * rr, z = stagWorld.z + Math.sin(a) * rr; if (!path.isClear(x, H(x, z) + r * 0.3, z, r * 1.3, 6)) continue;
        pushRock({ x, y: H(x, z) + r * 0.3, z, rx: r * 1.2, ry: r * 0.7, rz: r, yaw: rng.range(0, 6.28), tx: rng.range(-0.15, 0.15), tz: rng.range(-0.15, 0.15), det: 2, seed: rng.range(0, 99), moss: 0.5 }); } }
    // the fox's seat: a small stacked outcrop beside the ramp, tall enough to set the fox against the wool of the Snag
    const D_FOX = clamp(0.7 * PL + 12, D_FOOT + 30, D_AIR - 26), U_FOX = D_FOX / PL, foxLat = 7.4;
    const foxRock = (() => { const b0 = rockAt(D_FOX, foxLat + 0.5, 2.35, { low: true, det: 3, flat: 0.66, sit: 0.42, moss: 0.4, ex: 3.4 }); woolOn(b0, 6);
      rockAt(D_FOX - 3.4, foxLat + 2.6, 1.3, { low: true, det: 2, flat: 0.7, sit: 0.35, moss: 0.5 }); rockAt(D_FOX + 3.0, foxLat - 0.4, 0.95, { low: true, det: 2, flat: 0.7, sit: 0.3, moss: 0.5 });
      beside(D_FOX, foxLat, P2); const top = { x: P2.x, y: b0.y + b0.ry * 0.86 + 0.62, z: P2.z, rx: 1.75, ry: 0.78, rz: 1.45, yaw: rng.range(0, 6.28), tx: 0.05, tz: -0.04, det: 3, seed: rng.range(0, 99), moss: 0.25, ex: 3.8 };
      pushRock(top); return top; })();
    await ctx.yield();
    // the stell: a round drystone sheepfold on the left bank
    rockBuf = rockBufS;
    const D_STELL = lerp(D_BURN, D_FOOT, 0.62), stell = beside(D_STELL, -16.5, { x: 0, z: 0 });
    { const gate = Math.atan2(sz[Math.round(D_STELL / PL * NS)] - stell.z, sx[Math.round(D_STELL / PL * NS)] - stell.x) + 0.9;
      for (let c = 0; c < 5; c++) { const nS = 38, hC = 0.5 * cast.tallStell;
        for (let i = 0; i < nS; i++) { const a = (i + (c % 2) * 0.5 + rng.range(-0.12, 0.12)) / nS * 6.2832; let da = Math.abs(a - gate) % 6.2832; if (da > 3.1416) da = 6.2832 - da; if (da < 0.2) continue;
          const rr = 6 + rng.range(-0.08, 0.08), x = stell.x + Math.cos(a) * rr, z = stell.z + Math.sin(a) * rr, h = H(x, z);
          pushRock({ x, y: h + hC * (c + 0.5) - 0.04, z, rx: rng.range(0.42, 0.56), ry: hC * rng.range(0.5, 0.62), rz: rng.range(0.3, 0.4), yaw: -a + 1.5708 + rng.range(-0.15, 0.15), tx: rng.range(-0.06, 0.06), tz: rng.range(-0.06, 0.06), det: 1, seed: rng.range(0, 99), moss: c === 4 ? 0.5 : 0.1, ex: 2.6, tone: rng.range(0.85, 1.12) }); }
        await ctx.yield(); } }
    // the heath, the bog and the tor's own scatter
    await ctx.yield();
    rockBuf = rockBufA;
    for (let i = 0; i < 9; i++) { const r = rng.range(0.8, 2); rockAt(rng.range(20, D_BURN), (rng.chance(0.5) ? 1 : -1) * (rng.range(9, 40) + r), r, {}); }
    for (let i = 0; i < 13; i++) { const a = rng.range(0, 6.2832), rr = rng.range(24, 62), x = HX + Math.cos(a) * rr, z = HZ + Math.sin(a) * rr, r = rng.range(1.3, 3.4), h = H(x, z);
      if (!path.isClear(x, Hplain(x, z) + r * 0.3, z, r * 1.3, 8)) continue;
      pushRock({ x, y: h + r * 0.28, z, rx: r * rng.range(0.9, 1.3), ry: r * rng.range(0.55, 0.8), rz: r, yaw: rng.range(0, 6.28), tx: rng.range(-0.2, 0.2), tz: rng.range(-0.2, 0.2), det: 2, seed: rng.range(0, 99), moss: 0.6 }); }
    for (const b of footRocks) pushRock(b);
    await ctx.yield();
    for (let i = 0, n = Math.round(50 * detail); i < n; i++) { const r = rng.range(0.2, 0.55) * (rng.chance(0.15) ? 1.5 : 1);
      const b = rockAt(rng.range(4, D_BOG - 8), (rng.chance(0.5) ? 1 : -1) * (1.2 + 7.5 * Math.pow(rng(), 1.2)), r, { low: true, det: 1, moss: 0.35, sit: 0.2, flat: rng.range(0.5, 0.75) }); if (b && rng.chance(0.3)) woolOn(b, 2); }
    { // the crown: woolsack outcrops breaking out of the nose's flanks, wool-snagged boulders beside the crest, stones in the heather
      const RK = fx.fork('crown-rocks'), wool = (b, n) => { for (let k = 0; k < n; k++) { const len = RK.range(0.5, 1.5) * Math.min(1.6, 0.6 + b.ry), tv = RK.range(0.66, 0.82);
        fibList.push({ x: b.x + RK.range(-0.5, 0.5) * b.rx, y: b.y + b.ry * RK.range(0.55, 0.92), z: b.z + RK.range(-0.5, 0.5) * b.rz, sx: len, sy: len, sz: len, yaw: RK.range(-0.6, 0.6), rz: -RK.range(0.8, 1.35), r: tv, g: tv * 0.97, b: tv * 0.9 }); } };
      const rock = (lat, s0, r, o = {}) => { const x = HX + Rx * lat + Ax * s0, z = HZ + Rz * lat + Az * s0, ry = r * (o.flat || RK.range(0.6, 0.85)), y = (o.y ?? H(x, z)) + ry * (o.sit ?? 0.4);
        const b = { x, y, z, rx: r * RK.range(1.0, 1.35), ry, rz: r * RK.range(0.9, 1.1), yaw: RK.range(0, 6.28), tx: RK.range(-0.12, 0.12), tz: RK.range(-0.12, 0.12), det: o.det || 2, seed: RK.range(0, 99), moss: o.moss ?? 0.45, ex: o.ex };
        pushRock(b); return b; };
      rockBuf = rockBufE;
      for (const [lat, s0, r] of [[-14.5, 112, 2.7], [12.5, 133, 2.5], [-17, 84, 2.3], [-13, 146, 2.2]]) {       // stacked outcrops
        const b0 = rock(lat, s0, r, { det: 3, flat: 0.7, sit: 0.3, ex: 3.4 }); wool(b0, 7);
        const top = rock(lat + 0.4, s0 - 0.3, r * 0.72, { det: 3, flat: 0.62, y: b0.y + b0.ry * 0.86, sit: 0.9, moss: 0.25, ex: 3.6 }); wool(top, 5);
        rock(lat + Math.sign(lat) * r * 1.1, s0 + r * 1.2, r * 0.5, { flat: 0.7, sit: 0.3 }); }
      for (const q of STAG2) { if (q.lift) { const b0 = { x: HX + q.x - 0.3, y: q.g + q.lift * 0.36, z: HZ + q.z + 0.2, rx: 3.3, ry: q.lift * 0.66, rz: 2.7, yaw: q.yaw + 0.9, tx: 0.03, tz: -0.03, det: 3, seed: RK.range(0, 99), moss: 0.5, ex: 3.4 }; pushRock(b0); wool(b0, 4); }
        const b = { x: HX + q.x, y: q.g + q.lift - 0.05, z: HZ + q.z, rx: 2.3, ry: 0.92, rz: 1.8, yaw: q.yaw + 1.5708, tx: 0, tz: 0, det: 3, seed: RK.range(0, 99), moss: 0.3, ex: 3.4 };
        pushRock(b); rock(q.lat - 2.3, q.s - 1.6, 0.9, { flat: 0.7, sit: 0.3 }); }
      await ctx.yield();
      for (let i = 0; i < 16; i++) { const s0 = RK.range(8, 150), w = tab(CW, s0), sd = i % 3 === 0 ? 1 : -1, r = RK.range(1.0, 2.6) * (s0 < 76 ? 0.72 : 1), lat = sd * (Math.max(w * 0.7, r + (s0 < 76 ? 13 : 8.5)) + RK.range(0, sd > 0 ? 6 : 16));
        if (Math.hypot(Math.abs(lat) - 15.7, s0) < r + 9 || STAG2.some((q) => Math.hypot(lat - q.lat, s0 - q.s) < r + 9)) continue; const b = rock(lat, s0, r, { det: r > 2 ? 3 : 2, sit: 0.32 }); if (RK.chance(0.7)) wool(b, 5); }
      for (let i = 0; i < 46; i++) { const s0 = RK.range(-6, 118), r = RK.range(0.2, 0.55) * (RK.chance(0.15) ? 1.5 : 1), lat = (RK.chance(0.5) ? 1 : -1) * (1.6 + 9 * Math.pow(RK(), 1.2));
        const b = rock(lat, s0, r, { det: 1, flat: RK.range(0.5, 0.75), sit: 0.2, moss: 0.35 }); if (RK.chance(0.35)) wool(b, 2); }
      await ctx.yield(); }
    // ---------------------------------------------------------------- the march dyke: a drystone wall across the heath, tumbled where the line crosses it
    const rockBufW = new Buf({ position: 3, color: 3, aAo: 1 }); let dyke;
    { const RW = nx.fork('dyke'), wb = new Buf({ position: 3, aUV: 3 }), nxw = -WALL.dz, nzw = WALL.dx, PRO = [[-0.44, -0.3, 0], [-0.31, 0, 0.9], [-0.2, 0, 1], [0.2, 0, 1], [0.31, 0, 0.9], [0.44, -0.3, 0]]; let prev = -1;
      for (let s = 0, k = 0; s <= WALL.len; s += 0.5, k++) { const cx = WALL.x0 + WALL.dx * s, cz = WALL.z0 + WALL.dz * s, g = H(cx, cz), hT = wallH(s / WALL.len) * (0.94 + 0.12 * ((k * 0.618) % 1)), base = wb.n;
        for (const [o, dy, hk] of PRO) { const x = cx + nxw * o, z = cz + nzw * o, y = hk > 0 ? g + hT * hk : Math.min(g, H(x, z)) + dy; wb.push({ position: [x, y, z], aUV: [s, y - g, hT] }); }
        if (prev >= 0) for (let q = 0; q < 5; q++) wb.idx.push(prev + q, prev + q + 1, base + q, prev + q + 1, base + q + 1, base + q);
        prev = base; if (k % 40 === 39) await ctx.yield(); }
      // stones fallen in the gap, and through-stones standing proud of the cope
      rockBuf = rockBufW; const sG = WALL.tGap * WALL.len, wy = Math.atan2(WALL.dx, WALL.dz);
      for (let i = 0; i < 44; i++) { const gap = i < 16, s = gap ? sG + RW.range(-4.5, 4.5) : RW.range(4, WALL.len - 16), off = gap ? RW.range(-2.6, 2.6) * (1 - 0.6 * RW()) : RW.range(-0.08, 0.08), r = gap ? RW.range(0.16, 0.36) : RW.range(0.15, 0.22);
        const x = WALL.x0 + WALL.dx * s + nxw * off, z = WALL.z0 + WALL.dz * s + nzw * off, g = H(x, z);
        pushRock({ x, y: gap ? g + r * 0.3 : g + wallH(s / WALL.len) + r * 0.2, z, rx: r * RW.range(0.5, 0.8), ry: r * (gap ? RW.range(0.55, 0.8) : RW.range(1.0, 1.5)), rz: r * RW.range(0.9, 1.4), yaw: wy + (gap ? RW.range(0, 6.28) : RW.range(-0.3, 0.3)),
          tx: RW.range(-0.25, 0.25), tz: RW.range(-0.25, 0.25), det: 1, seed: RW.range(0, 99), moss: gap ? 0.6 : 0.2, tone: RW.range(0.85, 1.1) }); }
      await ctx.yield();
      // coursed stone in felt: rows of long stones with dark joints, a cope of upright ones, lichen above and moss at the foot
      const wallMat = feltMat({ uniforms: { uStone: { value: cGranite.clone().multiplyScalar(0.95) }, uLich: { value: cLichen }, uMossW: { value: cMossy } },
        vertexShader: VERT_PARS + /* glsl */`attribute vec3 aUV; varying vec3 vUV;
          void main(){ vObj = position; vCol = vec3(1.); vUV = aUV; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vNrm = normalize(mat3(modelMatrix) * normal);
            ${VN_END} }`,
        fragmentShader: FRAG_PARS + H2 + /* glsl */`uniform vec3 uStone, uLich, uMossW; varying vec3 vUV;
          void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
            float s = vUV.x, y = max(vUV.y, 0.), top = vUV.z, fw = abs(dFdx(s)) + abs(dFdy(s)) + abs(dFdx(y)) + abs(dFdy(y)), kd = 1. - smoothstep(.03, .2, fw);
            float cope = smoothstep(top - .21, top - .17, y), row = floor(y / .19), fy = fract(y / .19);
            float sx = s / mix(.34, .6, h21(vec2(row, 3.1))) + h21(vec2(row, 7.7)) * 3., cx = s / .17;
            float tone = mix(h21(vec2(floor(sx), row)), h21(vec2(floor(cx), 91.)), cope), jx = mix(fract(sx), fract(cx), cope);
            float joint = max(1. - smoothstep(0., .12, min(jx, 1. - jx)), (1. - smoothstep(0., .17, min(fy, 1. - fy))) * (1. - cope));
            vec3 base = uStone * mix(.87, .64 + .5 * tone, kd);
            base = mix(base, uLich, smoothstep(.55, .75, vn2(vec2(s * 1.3, y * 2.4 + 3.))) * .4 * smoothstep(.3, .8, y));
            base = mix(base, uMossW, (1. - smoothstep(.05, .4, y + (vn2(vec2(s * 2.1, 5.)) - .5) * .3)) * .6);
            base *= 1. - .5 * joint * kd;
            float ao = mix(.7, 1., smoothstep(0., .45, y));
            gl_FragColor = vec4(atmos(felt(base, N, V, vWorld * 5., vWorld, 1.6, ao, 1.)), 1.); }` });
      dyke = new THREE.Mesh(await wb.buildAsync(ctx), wallMat); dyke.name = 'dyke'; dyke.frustumCulled = false; scene.add(dyke); }
    await ctx.yield();
    const rockMat = feltMat({ vertexColors: true,
      vertexShader: VERT_PARS + /* glsl */`attribute float aAo; varying float vAo;
        void main(){ vObj = position; vCol = color; vAo = aAo; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vNrm = normalize(mat3(modelMatrix) * normal);
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + /* glsl */`varying float vAo;
        void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
          // close to, felt granite is speckled (dark and pale flecks a few centimetres across) and blotched with lichen on its upper faces
          vec3 q = vObj * 19.; float fq = abs(dFdx(q.x)) + abs(dFdy(q.x)) + abs(dFdx(q.y)) + abs(dFdy(q.y)) + abs(dFdx(q.z)) + abs(dFdy(q.z)), kd = 1. - smoothstep(.5, 1.7, fq), kl = 1. - smoothstep(.9, 3., fq);
          float s1 = vn3(q), s2 = vn3(q * 1.63 + 13.1), li = vn3(vObj * 3.7 + 5.) + .3 * (vn3(vObj * 9.) - .5);
          vec3 base = vCol * (1. + (smoothstep(.6, .78, s1) * .22 - smoothstep(.64, .82, s2) * .34) * kd);
          base = mix(base, vec3(.5, .52, .4) * (.8 + .4 * s1), smoothstep(.56, .7, li + (s2 - .5) * .12 * kd) * .42 * smoothstep(-.2, .5, N.y) * kl);
          gl_FragColor = vec4(atmos(felt(base, N, V, vObj, vWorld, 1.5, vAo, .55)), 1.); }`,
    });
    await ctx.yield();
    const rocksA = new THREE.Mesh(await rockBufA.buildAsync(ctx), rockMat); rocksA.name = 'rocks'; rocksA.frustumCulled = false; scene.add(rocksA);
    await ctx.yield();
    const rocksB = new THREE.Mesh(await rockBufB.buildAsync(ctx), rockMat); rocksB.name = 'rocks'; rocksB.frustumCulled = false; scene.add(rocksB);
    await ctx.yield();
    const rocksC = new THREE.Mesh(await rockBufC.buildAsync(ctx), rockMat); rocksC.name = 'rocks'; rocksC.frustumCulled = false; scene.add(rocksC);
    await ctx.yield();
    const rocksB2 = new THREE.Mesh(await rockBufB2.buildAsync(ctx), rockMat); rocksB2.name = 'rocks'; rocksB2.frustumCulled = false; scene.add(rocksB2);
    await ctx.yield();
    const rocksS = new THREE.Mesh(await rockBufS.buildAsync(ctx), rockMat); rocksS.name = 'stell'; rocksS.frustumCulled = false; scene.add(rocksS);
    await ctx.yield();
    const rocksD = new THREE.Mesh(await rockBufD.buildAsync(ctx), rockMat); rocksD.name = 'rocks'; rocksD.frustumCulled = false; scene.add(rocksD);
    await ctx.yield();
    const rocksE = new THREE.Mesh(await rockBufE.buildAsync(ctx), rockMat); rocksE.name = 'rocks'; rocksE.frustumCulled = false; scene.add(rocksE);
    await ctx.yield();
    const rocksW = new THREE.Mesh(await rockBufW.buildAsync(ctx), rockMat); rocksW.name = 'rocks'; rocksW.frustumCulled = false; scene.add(rocksW);
    await ctx.yield();

    // ---------------------------------------------------------------- the burn's cut peat banks: a face with strata, an undercut and a turf lip
    const bankBuf = new Buf({ position: 3, aB: 3 });      // aB: height up the face 0..1, kind (0 buried toe, 1 face, 2 turf), distance along the path
    { const PROF = [[-0.6, -0.3, 0, 0], [-0.05, 0.08, 0.05, 0.4], [0.2, 0.34, 0.3, 1], [0.2, 0.6, 0.6, 1], [0.08, 0.83, 0.85, 1], [-0.24, 0.93, 0.95, 1.5], [-0.14, 1.04, 1, 2], [0.9, 1.06, 1, 2], [2.6, 1.0, 1, 2]];   // across from the foot, height share, t, kind
      for (const sd of [-1, 1]) { let prev = -1;
        for (let d = D_BURN - 6, k = 0; d < D_FOOT + 8; d += 1.25, k++) { const bA = bankA(d, sd); beside(d, sd * (bA - 0.35), P2); const y0 = H(P2.x, P2.z), wB = HI.wB; beside(d, sd * (bA + 2.6), P2); const y1 = H(P2.x, P2.z) + 0.02, hF = y1 - y0;
          if (wB < 0.3 || hF < 0.7) { prev = -1; continue; }
          const base = bankBuf.n, slump = 0.3 * noise.n2(d * 0.5 + 40, sd * 3.3), wob = noise.n2(d * 1.1, sd * 7.7 + 11);
          for (let q = 0; q < PROF.length; q++) { const pf = PROF[q], mid = q > 0 && q < 6 ? 1 : 0, ac = bA + pf[0] + mid * (slump + 0.1 * wob * (q % 2 ? 1 : -1)), yy = q === 8 ? y1 - 0.15 : y0 + hF * pf[1] + (q === 5 || q === 6 ? 0.08 * wob : 0);
            beside(d, sd * ac, P2); bankBuf.push({ position: [P2.x, yy, P2.z], aB: [pf[2], pf[3], d] }); }
          if (prev >= 0) for (let q = 0; q < PROF.length - 1; q++) { if (sd < 0) bankBuf.idx.push(prev + q, base + q, prev + q + 1, prev + q + 1, base + q, base + q + 1); else bankBuf.idx.push(prev + q, prev + q + 1, base + q, prev + q + 1, base + q + 1, base + q); }
          prev = base; if (k % 40 === 39) await ctx.yield(); } } }
    const bankMat = feltMat({ side: THREE.DoubleSide, uniforms: { ...QU, uPeatD: { value: cPeat.clone().multiplyScalar(1.7).lerp(C('#5a3a40'), 0.3) }, uPeatL: { value: cPeat.clone().multiplyScalar(2.4).lerp(C('#8a6248'), 0.4) } },
      vertexShader: VERT_PARS + /* glsl */`attribute vec3 aB; varying vec3 vB;
        void main(){ vObj = position; vCol = vec3(1.); vB = aB; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vNrm = normalize(mat3(modelMatrix) * normal);
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + H2 + QUILT + /* glsl */`uniform vec3 uPeatD, uPeatL; varying vec3 vB;
        void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
          float t = vB.x, kind = vB.y, al = vB.z;
          // strata: level layers of darker and lighter peat, a little wavy, faded before they can alias
          float sy = vWorld.y * 3.1 + (vn2(vec2(al * .35, vWorld.y * .8)) - .5) * 1.3, fws = abs(dFdx(sy)) + abs(dFdy(sy));
          float band = smoothstep(.2, .7, abs(fract(sy) - .5) * 2.), bandK = 1. - smoothstep(.35, 1.1, fws), lay = h21(vec2(floor(sy), 4.7));
          vec3 peat = mix(uPeatD, uPeatL, mix(.5, .28 + .5 * lay, bandK)) * mix(1., 1.06 - .26 * band, bandK);
          peat *= .86 + .28 * vn2(vec2(al * 2.1, vWorld.y * 6.));
          // moss creeps up from the toe in ragged patches and hangs from the ledges of the strata: dark where it thins at its
          // lower edge, lighter on the crown under each ledge; the turf of the top hangs over the lip
          float frs = fract(sy), hang = smoothstep(.35, .95, frs) * bandK, drift = vn2(vec2(al * .23, 5.5));
          vec2 mq = vec2(al * 2.7, vWorld.y * 4.2); float fwm = abs(dFdx(mq.x)) + abs(dFdy(mq.x)) + abs(dFdx(mq.y)) + abs(dFdy(mq.y)), km = 1. - smoothstep(.4, 1.3, fwm);
          float m1 = vn2(vec2(al * .85 + 3., vWorld.y * 1.5 + al * .2)), m2 = mix(.5, vn2(mq + 7.), km), m3 = mix(.5, vn2(mq * 3.1 + 19.), km * km);
          float field = m1 * .62 + m2 * .32 + m3 * .12 + hang * .13 + (drift - .5) * .3 - t * .36 + .14;
          float pad = smoothstep(.5, .54, field), thick = smoothstep(.5, .72, field);
          vec3 moss = mix(uMoss * .5, mix(uMoss, uGrass, m2 * .7) * .98, clamp(thick * .55 + hang * .5, 0., 1.)) * (.82 + .36 * m3);
          peat *= 1. - .3 * smoothstep(.42, .5, field) * (1. - pad);
          float mk = max(pad, 1. - smoothstep(.02, .12, t));
          float tk = smoothstep(1.15, 1.65, kind + (vn2(vec2(al * 2.3, 9.)) - .5) * .5);
          vec3 base = mix(mix(peat, moss, mk * .9), quilt(vWorld.xz) * .92, tk);
          float ao = mix(.7, 1., smoothstep(0., .25, t)) * mix(1., .78, smoothstep(.68, .9, t) * (1. - tk));
          // the bank that faces away from the sun is lit by the sunlit one across the water: no black slab
          base *= 1. + .95 * smoothstep(.55, .05, dot(N, uSunDir) * .5 + .5);
          gl_FragColor = vec4(atmos(felt(base, N, V, vObj, vWorld, 2.4, ao, .4)), 1.); }`,
    });
    await ctx.yield();
    const banks = new THREE.Mesh(await bankBuf.buildAsync(ctx), bankMat); banks.name = 'peat-banks'; banks.frustumCulled = false; scene.add(banks);
    // wool snagged along the lips of the banks, streaming out over the burn
    for (let d = D_BURN + 10; d < D_FOOT - 6; d += rng.range(3.5, 8)) { const sd = rng.chance(0.5) ? 1 : -1; beside(d, sd * (bankA(d, sd) - 0.15), P2); const y = H(P2.x, P2.z); beside(d, sd * (bankA(d, sd) + 2.6), v4); const yTop = H(v4.x, v4.z);
      for (let k = 0; k < 4; k++) { const len = rng.range(0.5, 1.3), tv = rng.range(0.66, 0.82); fibList.push({ x: P2.x + rng.range(-0.25, 0.25), y: lerp(y, yTop, 0.9) + rng.range(-0.1, 0.12), z: P2.z + rng.range(-0.25, 0.25), sx: len, sy: len, sz: len, yaw: rng.range(-0.6, 0.6), rz: -rng.range(0.9, 1.4), r: tv, g: tv * 0.97, b: tv * 0.9 }); } }
    await ctx.yield();

    // ---------------------------------------------------------------- water as roving: peat pools, the burn, the tarn at its foot
    const waterBuf = new Buf({ position: 3, aW: 4, aD: 3 });   // aW: across (-1..1) or radial (0..1), along (m), kind (0 pool, 1 burn), foam; aD: strand shift, the across direction
    const tarn = beside(D_FOOT + 3, 4.5, { x: 0, z: 0 }); tarn.r = 7.5; tarn.y = sy[Math.round(U_FOOT * NS)] - 1.5 + 0.1; tarn.sd = 7;
    for (const p of [...pools, tarn]) { const S = 18, base = waterBuf.n; waterBuf.push({ position: [p.x, p.y + 0.05, p.z], aW: [0, p.sd * 13, 0, 0], aD: [0, 0, 0] });
      for (let r = 0; r < 2; r++) for (let i = 0; i < S; i++) { const a = i / S * 6.2832, rr = p.r * (1 + 0.16 * noise.n2(Math.cos(a) * 1.3 + p.sd, Math.sin(a) * 1.3)) * (r ? 1.3 : 1); waterBuf.push({ position: [p.x + Math.cos(a) * rr, p.y + (r ? -0.4 : 0.05), p.z + Math.sin(a) * rr], aW: [r ? 1.3 : 1, p.sd * 13 + Math.cos(a) * rr, 0, 0], aD: [0, 0, 0] }); }
      for (let i = 0; i < S; i++) { const j = (i + 1) % S; waterBuf.idx.push(base, base + 1 + j, base + 1 + i, base + 1 + i, base + 1 + j, base + 1 + S + i, base + 1 + j, base + 1 + S + j, base + 1 + S + i); } }
    // the burn follows its channel: nine across, wider than the water so the bed cuts its edge; aW: metres across, metres along, 1, foam; aD: depth, sun, riffle
    { const dA = (U_BURN - 0.008) * PL, dB = (U_FOOT + 0.004) * PL, NL = 9, Q = { x: 0, z: 0 }; let prev = -1, k = 0;
      for (let d = dA; d <= dB; d += 0.62, k++) { const u = d / PL, me = mea(d), hw = hwN(d) + 0.75, y = waterY(d), base = waterBuf.n, rf = riffAt(d);
        let foam0 = rf; for (const us of [U_STEP1, U_STEP2]) { const dm = (u - us) * PL; foam0 += smoothstep(-1.5, 0.3, dm) * (1 - smoothstep(1.5, 9, dm)); }
        for (let q = 0; q < NL; q++) { const lm = (q / (NL - 1) * 2 - 1) * hw; let foam = foam0;
          for (const st of wStones) { const dd = d - st.d; if (dd < -3 || dd > 8) continue; const dl = lm - st.lat, r = st.r;
            foam += (1 - smoothstep(r * 0.8, r * 2.3, Math.hypot(dd * 0.9, dl))) * 0.9 + (dd > 0 ? Math.exp(-dl * dl / (r * r * 1.1)) * Math.exp(-dd / 2.4) * 0.75 : 0); }
          beside(d, me + lm, Q); const dep = y - H(Q.x, Q.z);
          waterBuf.push({ position: [Q.x, y, Q.z], aW: [lm, d, 1, Math.min(1, foam)], aD: [dep, sunAt(Q.x, Q.z), rf] }); }
        if (prev >= 0) for (let q = 0; q < NL - 1; q++) waterBuf.idx.push(prev + q, prev + q + 1, base + q, prev + q + 1, base + q + 1, base + q);
        prev = base; if (k % 30 === 29) await ctx.yield(); } }
    const waterMat = feltMat({
      uniforms: { uDeep: { value: night ? C('#1c2444') : C('#5f7392').lerp(C(LK.zen), 0.25).multiplyScalar(0.8) }, uMid: { value: night ? C('#33416e') : C('#9dbbd6').lerp(C(LK.zen), 0.3).multiplyScalar(0.8) },
        uPale: { value: night ? C('#6a78a8') : C('#ece4d2').multiplyScalar(0.8) }, uFoam: { value: cWhite.clone().multiplyScalar(night ? 0.6 : 0.9) }, uRim: { value: cPeatL.clone().lerp(C('#8a86a0'), 0.45) },
        uSkyR: { value: C(LK.zen).lerp(C(LK.hor), 0.12).multiplyScalar(night ? 1.6 : 1.3).lerp(C('#dcefff'), night ? 0 : 0.22) }, uSlate: { value: night ? C('#18203e') : C('#42608c').lerp(C(LK.zen), 0.2) }, uBedC: { value: cPeat.clone().lerp(C('#70462a'), 0.45).multiplyScalar(night ? 0.6 : 1) } },
      vertexShader: VERT_PARS + /* glsl */`attribute vec4 aW; attribute vec3 aD; varying vec4 vW; varying vec3 vD;
        void main(){ vObj = position; vCol = vec3(1.); vW = aW; vD = aD; vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vNrm = vec3(0., 1., 0.);
          ${VN_END} }`,
      // The burn is clear peaty water in felt: a brown bed seen through the shallows, the sky lying soft on the deeper water (more of
      // it the lower the eye), round ripples that slide with the current, glints, and teased white wool where it runs over the
      // riffles, falls at the steps and parts round the stones. No strands, no stripes. The pools keep their roving.
      fragmentShader: FRAG_PARS + H2 + /* glsl */`uniform vec3 uDeep, uMid, uPale, uFoam, uRim, uSkyR, uBedC, uSlate; varying vec4 vW; varying vec3 vD;
        void main(){ vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)), N = normalize(vec3(0., .55, 0.) + V * .8); vec3 base; vec3 obj; float lit = 1.;
          if (vW.z > .5) {
            float dep = vD.x, fo = clamp(vW.w, 0., 1.); vec2 q = vec2(vW.x, vW.y - uTime * 2.1);
            float fwq = abs(dFdx(vW.x)) + abs(dFdy(vW.x)) + abs(dFdx(vW.y)) + abs(dFdy(vW.y)), kq = 1. - smoothstep(.25, 1.2, fwq), kp = 1. - smoothstep(.05, .22, fwq), ks = 1. - smoothstep(.06, .3, fwq);
            // the bed shows only through the last few centimetres at the edge: felt cobbles, dark and wet
            vec2 pw = vWorld.xz * 2.6, pc = floor(pw), pf = fract(pw) - .5 - (vec2(h21(pc), h21(pc + 17.3)) - .5) * .4; float pk = max(0., 1. - dot(pf, pf) * 5.);
            vec3 under = mix(vec3(.2, .15, .12), vec3(.55, .44, .31), h21(pc + 5.)) * mix(.75, .45 + .6 * smoothstep(0., .5, pk), kp);
            under = mix(under, uBedC, .4) * .5;
            // ripples: soft bars across the flow, bent and broken, never along it
            float ph = q.y * 2.4 + 1.6 * sin(q.x * 1.3 + q.y * .35) + 3. * vn2(q * vec2(.7, .5));
            float rip = (sin(ph) * .22 * (.4 + .6 * vn2(q * vec2(.9, .6) + 11.)) + (vn2(q * vec2(2.3, 1.6) + 4.) - .5) * .9) * kq;
            float fres = 1. - clamp(V.y, 0., 1.); fres *= fres;
            // slate under the eye, sky-blue where the view grazes it and on every ripple that tilts to the sky, a pale glint on the crests
            vec3 wcol = mix(uSlate, uSkyR, clamp(.24 + .72 * fres + rip * .7, 0., 1.));
            wcol = mix(wcol, uPale, smoothstep(.62, 1., rip * .5 + .5) * .3);
            float deepK = smoothstep(.0, .09, dep);
            base = mix(under, wcol, (.66 + .34 * fres) * deepK);
            base *= mix(.42, 1., smoothstep(.0, .075, dep));              // the thin dark wet line where it meets a bar
            // white water: teased streaks drawn out along the flow, thickening into a fleece on the riffles, at the falls and round the stones
            float fq = vn2(q * vec2(3.1, 1.7) + 2.) * .6 + vn2(q * vec2(7.3, 3.6) + 9.) * .4;
            float sq = mix(.5, vn2(vec2(q.x * 5.2, q.y * .5) + 3.) * .62 + vn2(vec2(q.x * 10.4 + 7., q.y * 1.05)) * .38, ks);
            float foam = mix(fo * .55, smoothstep(.62 - .56 * fo, .82 - .5 * fo, mix(fq, sq, .55) + rip * .1), kq) * smoothstep(0., .1, fo) * smoothstep(-.01, .04, dep);
            foam = max(foam, smoothstep(.7, .84, sq + rip * .08) * (.3 + .5 * fo) * deepK);
            base = mix(base, uFoam, clamp(foam, 0., .92));
            lit = mix(.6, 1., vD.y);                                         // water in the bank's shade is deep slate
            gSun = mix(1., vD.y, .85); gRimK = .3;
            N = normalize(vec3(rip * .16, 1., rip * .22) * .62 + V * .5);
            obj = vec3(q.x * 1.6, 0., q.y); }
          else { vec2 p = vWorld.xz - vec2(uTime * .35, 0.); float st = vn2(vec2(p.x * .5, p.y * 2.6 + vW.y)) * .6 + vn2(vec2(p.x * 1.4, p.y * 7.)) * .4;
            float fres = 1. - clamp(V.y, 0., 1.); fres *= fres;
            base = mix(uDeep * .8, mix(uMid, uSkyR, .35 + .5 * fres), smoothstep(.36, .7, st) * .85) + uPale * smoothstep(.68, .86, st) * .3; base = mix(base, uRim, smoothstep(.72, 1.02, vW.x) * .85); obj = vec3(p.x, 0., p.y); }
          // water shows the sky, not the sun's colour: the warm key is taken back out, so blue stays blue under a low sun
          float k0 = uSunDir.y * .5 + .5; k0 = k0 * sqrt(k0) * gSun; vec3 L0 = uSunCol * k0 + uFillCol * (1. - .45 * k0) + vec3(1e-3);
          base *= lit * vec3(.9) / L0;
          gl_FragColor = vec4(atmos(felt(base, N, V, obj, vWorld, 2.2, 1., .3)), 1.); }`,
    });
    await ctx.yield();
    const water = new THREE.Mesh(waterBuf.build(false), waterMat); water.name = 'water'; water.frustumCulled = false; scene.add(water);
    await ctx.yield();

    // ---------------------------------------------------------------- felt bodies: one vertex frame for plants and animals
    // body: GLSL that poses `p` and `n` (model space: nose +Z, up +Y) from aAnim / aPivot / aPose before the instance transform
    const bodyMat = (body, o = {}) => feltMat({ vertexColors: true, side: o.side ?? THREE.FrontSide, uniforms: o.uniforms || {},
      vertexShader: VERT_PARS + /* glsl */`attribute vec4 aAnim; attribute vec3 aPivot; attribute vec4 aPose; ${o.pars || ''}
        void rotX(inout vec3 q, float a){ float c = cos(a), s = sin(a); q.yz = vec2(c * q.y - s * q.z, s * q.y + c * q.z); }
        void rotY(inout vec3 q, float a){ float c = cos(a), s = sin(a); q.xz = vec2(c * q.x + s * q.z, -s * q.x + c * q.z); }
        void rotZ(inout vec3 q, float a){ float c = cos(a), s = sin(a); q.xy = vec2(c * q.x - s * q.y, s * q.x + c * q.y); }
        void main(){ vec3 p = position, n = normal;
          #ifdef USE_INSTANCING
          mat4 im = modelMatrix * instanceMatrix;
          #else
          mat4 im = modelMatrix;
          #endif
          float sd = im[3].x * 1.7 + im[3].z * .9;
          ${body}
          vObj = position; vCol = color; vec4 wp = im * vec4(p, 1.); vWorld = wp.xyz; vNrm = normalize(mat3(im) * n + vec3(0., 1e-5, 0.));
          ${VN_END} }`,
      fragmentShader: FRAG_PARS + /* glsl */`${o.fragPars || ''}
        void main(){ vec3 N = normalize(vNrm + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)); vec3 base = vCol;
          ${o.frag || ''}
          gl_FragColor = vec4(atmos(felt(base, N, V, vObj, vWorld, ${(o.grain || 9).toFixed(1)}, 1., .25)), 1.); }`,
    });
    const poseAttr = (geo, count) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); a.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('aPose', a); return a; };

    // ---------------------------------------------------------------- the rowan: wind-flagged, berried, wool snagged on its twigs
    // (it stands on the lip of the right bank 36 m beyond the lens at u 0.52, whole in the frame from the stell on; the first layout had it nearer and further back)
    const RS = 1.7, D_ROWAN = 0.52 * PL + 36, rowanOld = beside(lerp(D_BURN, D_FOOT, 0.585), 10.8, { x: 0, z: 0 }), rowanAt = beside(D_ROWAN, bankA(D_ROWAN, 1) + 1.7, { x: 0, z: 0 }); rowanAt.y = H(rowanAt.x, rowanAt.z) - 0.1;
    { const g = new Geo(), cBark = C('#6a6470'), cBarkD = C('#3c3640'), cLeaf = cMoss.clone().multiplyScalar(0.62), cLeafL = cMoss.clone().lerp(C('#b8c070'), 0.35).multiplyScalar(0.9), cBerry = C('#c8301a'), tips = [];
      const trunk = [[0, 0, 0], [0.08, 0.8, 0.03], [0.3, 1.55, 0.02], [0.72, 2.2, -0.05], [1.3, 2.75, -0.02]];
      g.tube(trunk, [0.24, 0.19, 0.14, 0.1, 0.055], 8, cBarkD, cBark);
      for (let i = 0; i < 13; i++) { const k = 1 + (i % 4), b = trunk[k], az = rng.range(-1.9, 1.9), len = rng.range(0.9, 1.7) * (1 - 0.1 * k), up = rng.range(0.25, 0.9);
        const e = [b[0] + Math.cos(az) * len * 0.75 + len * 0.55, b[1] + up * len, b[2] + Math.sin(az) * len * 0.75], mid = [(b[0] + e[0]) / 2 - 0.1, (b[1] + e[1]) / 2 + 0.18 * len, (b[2] + e[2]) / 2];
        g.tube([b, mid, e], [0.06, 0.04, 0.018], 5, cBark, cBarkD); tips.push(e);
        for (let j = 0; j < 3; j++) { const r = rng.range(0.4, 0.7); g.blob(e[0] + rng.range(-0.35, 0.5), e[1] + rng.range(-0.1, 0.35), e[2] + rng.range(-0.4, 0.4), r * 1.25, r * 0.6, r, j % 2 ? cLeaf : cLeafL, cLeaf.clone().multiplyScalar(0.6), 7, 4); }
        for (let j = 0; j < 3; j++) g.blob(e[0] + rng.range(-0.4, 0.5), e[1] - rng.range(0.05, 0.42), e[2] + rng.range(-0.45, 0.45), 0.17, 0.14, 0.17, cBerry, cBerry.clone().multiplyScalar(0.6), 5, 3); }
      g.anim([0, g.n], (x, y) => [Math.pow(clamp(y / 3.6, 0, 1), 1.6) + 0.15 * clamp(x / 2.5, 0, 1), 0, 0, 0]);
      const rowan = new THREE.Mesh(g.build(), bodyMat(/* glsl */`float w = aAnim.x, gst = nap(vec3(im[3].xyz)) * .5 + .5;
          p.x += (.22 + .3 * gst) * w * uWindK + sin(uTime * 5.1 + position.y * 2.3 + position.z * 3.1) * .07 * w;
          p.y += sin(uTime * 6.3 + position.x * 3.7) * .05 * w - (.1 + .1 * gst) * w * w; p.z += sin(uTime * 3.7 + position.y * 1.9) * .09 * w;`, { grain: 6 }));
      rowan.position.set(rowanAt.x, rowanAt.y, rowanAt.z); rowan.scale.setScalar(RS); rowan.frustumCulled = false; rowan.name = 'rowan'; scene.add(rowan);
      for (const e of tips) for (let j = 0; j < 3; j++) { const len = rng.range(1.0, 2.4), tv = rng.range(0.66, 0.8);
        fibList.push({ x: rowanAt.x + (e[0] + rng.range(-0.2, 0.3)) * RS + 0.3, y: rowanAt.y + (e[1] + rng.range(-0.25, 0.2)) * RS - 0.1, z: rowanAt.z + (e[2] + rng.range(-0.3, 0.3)) * RS, sx: len, sy: len, sz: len, yaw: rng.range(-0.4, 0.4), rz: -rng.range(1.0, 1.4), r: tv, g: tv * 0.97, b: tv * 0.9 }); }
    }
    instanced(fibGeo, fibMat, fibList, 'fibres');
    await ctx.yield();

    // ---------------------------------------------------------------- loose fibres on the gale (a box of ribbons that wraps round the camera)
    { const b = new Buf({ position: 3, aUV: 2, aSeed: 4 }), n = Math.round(520 * detail);
      for (let i = 0; i < n; i++) { const sd = [rng(), rng(), rng(), rng()], len = rng.range(0.5, 1.6), base = b.n;
        const wd = []; for (let k = 0; k < 6; k++) wd.push(rng.range(0.012, 0.03));
        for (let k = 0; k <= 6; k++) for (const v of [-1, 1]) b.push({ position: [(k / 6) * len, (wd[0] + wd[3]) * 0.5, len], aUV: [k / 6, v], aSeed: sd });
        for (let k = 0; k < 6; k++) { const a = base + k * 2; b.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uTime: SH.uTime, uWindK: SH.uWindK, uCol: { value: cWhite.clone().multiplyScalar(0.8).multiply(L.sunColor.clone().multiplyScalar(0.62).add(L.fill)) } },
        vertexShader: /* glsl */`attribute vec2 aUV; attribute vec4 aSeed; uniform float uTime, uWindK; varying vec2 vUV; varying float vA;
          void main(){ vec3 box = vec3(64., 15., 64.); float u = aUV.x;
            vec3 b = fract(aSeed.xyz + vec3(uTime * 14. * uWindK / box.x, -uTime * .02, sin(uTime * .11 + aSeed.w * 6.) * .02) - cameraPosition / box);
            vec3 c = cameraPosition + (b - .5) * box + vec3(position.x, sin(u * 2.6 + uTime * 4. + aSeed.w * 40.) * .07 * position.z + sin(uTime * 1.3 + aSeed.w * 17.) * .5, sin(u * 2.1 - uTime * 3.1 + aSeed.w * 23.) * .09 * position.z);
            vec3 toC = cameraPosition - c; float dist = length(toC); vec3 side = normalize(cross(vec3(1., 0., 0.), toC / max(dist, 1e-3)) + vec3(0., 1e-4, 0.));
            float wd = max(position.y, dist * .0026); c += side * aUV.y * wd * .5;
            vec3 e = abs(b - .5) * 2.; vA = (1. - smoothstep(.75, 1., max(e.x, max(e.y, e.z)))) * smoothstep(1.2, 3.5, dist) * min(1., position.y / max(dist * .0026, 1e-4) + .25);
            vUV = aUV; gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.); }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUV; varying float vA;
          void main(){ float a = (1. - vUV.y * vUV.y) * vA * smoothstep(0., .3, vUV.x) * (1. - smoothstep(.6, 1., vUV.x)); if (a < .01) discard; gl_FragColor = vec4(uCol, a * .8); }`,
      });
      const air = new THREE.Mesh(b.build(false), mat); air.frustumCulled = false; air.renderOrder = 5; air.name = 'air-fibres'; scene.add(air); }

    // ---------------------------------------------------------------- soft blob shadows (ground everything that stands or bounds)
    const SHN = 96, shadowGeo = (() => { const b = new Buf({ position: 3, aA: 1 }); b.push({ position: [0, 0, 0], aA: [1] }); for (let i = 0; i < 10; i++) { const a = i / 10 * 6.2832; b.push({ position: [Math.cos(a), 0, Math.sin(a)], aA: [0] }); } for (let i = 0; i < 10; i++) b.idx.push(0, 1 + (i + 1) % 10, 1 + i); return b.build(false); })();
    const shadowMesh = new THREE.InstancedMesh(shadowGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uCol: { value: night ? C('#04050e') : C('#1c1530') } },
      vertexShader: /* glsl */`attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol, vA * vA * (3. - 2. * vA) * .5); }` }), SHN);
    shadowMesh.frustumCulled = false; shadowMesh.renderOrder = 1; shadowMesh.name = 'shadows'; scene.add(shadowMesh);
    let shN = 0; const sunAz = Math.atan2(-L.sunDir.x, -L.sunDir.z), SHL = clamp(0.5 / sunTan, 1, 2.4);      // (shadows run long under a low sun)
    const setShadow = (i, x, y, z, rw, rl) => { const len = rl * SHL; e4.set(0, sunAz, 0); m4.compose(v4.set(x - sunXZ.x * len * 0.5, y + 0.1, z - sunXZ.y * len * 0.5), q4.setFromEuler(e4), s4.set(rw, 1, len)); shadowMesh.setMatrixAt(i, m4); };
    const addShadow = (x, y, z, rw, rl) => { if (shN < SHN) setShadow(shN, x, y, z, rw, rl); return shN++; };
    addShadow(rowanAt.x + 1.2, rowanAt.y + 0.1, rowanAt.z, 3.2, 4.6); addShadow(BST.x, BST.y + 0.06, BST.z, 1.9, 2.6);
    if (foxRock) addShadow(foxRock.x, foxRock.y - 2.6, foxRock.z, 4.2, 5.6);
    addShadow(stagWorld.x, cragG, stagWorld.z, 8.5, 11);
    await ctx.yield();

    // ---------------------------------------------------------------- birds
    // a plain builder for the small and far birds (pipits, far coveys, ravens, harrier); the escort grouse and the eagle have their own below
    const birdGeo = (o) => { const g = new Geo(), Lb = o.len, W = o.span / 2, pl = o.plump ?? 1, sides = o.sides || 9, ch = o.chord ?? 1;
      g.loft([{ z: -0.5 * Lb, y: 0, rx: 0, ry: 0 }, { z: -0.36 * Lb, y: 0, rx: 0.1 * Lb, ry: 0.09 * Lb }, { z: -0.12 * Lb, y: -0.01 * Lb, rx: 0.2 * Lb * pl, ry: 0.19 * Lb * pl }, { z: 0.14 * Lb, y: 0, rx: 0.19 * Lb * pl, ry: 0.18 * Lb * pl },
        { z: 0.32 * Lb, y: 0.04 * Lb, rx: 0.11 * Lb, ry: 0.11 * Lb }, { z: 0.42 * Lb, y: 0.07 * Lb, rx: 0.08 * Lb, ry: 0.085 * Lb }, { z: 0.5 * Lb, y: 0.06 * Lb, rx: 0, ry: 0 }], { sides, top: o.body, belly: o.belly, shade: [-0.5, 0.2] });
      g.tube([[0, 0.06 * Lb, 0.47 * Lb], [0, 0.04 * Lb, 0.58 * Lb]], [0.028 * Lb, 0], 4, o.beak);
      const tl = o.tailLen ?? 1, tw = o.tail ?? 1;
      g.fan([[0, 0.02 * Lb, -0.36 * Lb], [0.14 * Lb * tw, 0.015 * Lb, -0.7 * Lb * tl], [0, 0.03 * Lb, -0.8 * Lb * tl], [-0.14 * Lb * tw, 0.015 * Lb, -0.7 * Lb * tl]], o.tailC || o.body, o.tailC || o.body);
      if (o.legs) for (const sx2 of [-1, 1]) g.blob(sx2 * 0.07 * Lb, -0.17 * Lb, -0.14 * Lb, 0.04 * Lb, 0.05 * Lb, 0.09 * Lb, o.legs, null, 5, 3);
      const x0 = 0.1 * Lb * pl, XS = [0, 0.3, 0.62, 0.86, 1], lead = (o.lead || [0.17, 0.21, 0.19, 0.12, 0.0]), trail = (o.trail || [-0.17, -0.2, -0.19, -0.14, -0.03]);
      const eL = [], eT = [], cL = [], cT = [];
      for (let k = 0; k < 5; k++) { const x = x0 + XS[k] * (W - x0), y = 0.05 * Lb - 0.04 * Lb * XS[k] * XS[k]; eL.push([x, y, lead[k] * Lb * ch + 0.04 * Lb]); eT.push([x, y, trail[k] * Lb * ch + 0.04 * Lb]);
        const tip = o.tip && XS[k] > 0.8 ? o.tip : o.wing; cL.push(tip); cT.push(tip.clone().multiplyScalar(0.78)); }
      const wr = g.strip(eT, eL, cT, cL); g.anim(wr, (x) => [clamp((x - x0) / (W - x0), 0, 1), 1, 0, 0]); g.pivot(wr, x0, 0.05 * Lb, 0.04 * Lb); g.glow(wr, 1); g.mirror(wr);
      return g.build(); };
    // a surface from rows of points (rows run from the trailing edge forward, points from left to right), one colour per point
    const grid = (g, rows, cols) => { const ids = rows.map((row, j) => row.map((p, i) => g.v(p[0], p[1], p[2], cols[j][i]))), start = ids[0][0];
      for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < rows[j].length - 1; i++) g.quad(ids[j][i], ids[j + 1][i], ids[j + 1][i + 1], ids[j][i + 1]); return [start, g.n]; };
    // wing pose: aPose = phase, flap amplitude, glide bias. uStroke = swing at the root, more at the tip, tip lag, centre of the stroke;
    // uTwist = leading edge down on the downstroke, up on the upstroke; uBar = feather bars (frequency, strength) and how far the underside goes to uUnder
    const birdBody = /* glsl */`vGlow = aGlow;
      if (abs(aAnim.y) > .5) { float wg = aAnim.x, ph = aPose.x, dn = max(0., -cos(ph));
        float ang = (sin(ph) * (uStroke.x + uStroke.y * wg) + sin(ph - 1.) * uStroke.z * wg * wg + uStroke.w * (.3 + .7 * wg)) * aPose.y + aPose.z * (.35 + .9 * wg);
        float tw = (uTwist.x * dn - uTwist.y * (1. - dn)) * aPose.y * (.3 + .7 * wg);
        vec3 q = p - aPivot; rotX(q, tw); rotX(n, tw); rotZ(q, ang * aAnim.y); p = aPivot + q; rotZ(n, ang * aAnim.y); }`;
    const birdMat = (under, o = {}) => bodyMat(birdBody, { side: THREE.DoubleSide, grain: 14,
      uniforms: { uUnder: { value: under }, uTwist: { value: new THREE.Vector2(...(o.twist || [0.2, 0.12])) }, uStroke: { value: new THREE.Vector4(...(o.stroke || [0.3, 0.8, 0.5, 0])) }, uBar: { value: new THREE.Vector3(...(o.bar || [100, 0, 1])) } },
      pars: 'attribute float aGlow; uniform vec2 uTwist; uniform vec4 uStroke; varying float vGlow;', fragPars: 'uniform vec3 uUnder, uBar; varying float vGlow;',
      frag: /* glsl */`float under = step(dot(N, V), 0.); N = mix(N, -N, under);
          float bz = vObj.z * uBar.x + sin(vObj.x * uBar.x * .45) * .8, bw = abs(dFdx(bz)) + abs(dFdy(bz));
          base *= 1. - uBar.y * smoothstep(.1, .7, sin(bz)) * (1. - smoothstep(.7, 2.4, bw));
          base = mix(base, uUnder, vGlow * under * uBar.z); gRimK = 1.5; gRimW = .25;` });
    // a flock drawn as one instanced mesh, posed on the CPU each frame
    const makeBirds = (geo, mat, count, name) => { const mesh = new THREE.InstancedMesh(geo, mat, count), pose = poseAttr(geo, count); mesh.frustumCulled = false; mesh.name = name; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      for (let i = 0; i < count; i++) { m4.makeScale(0.0001, 0.0001, 0.0001); m4.setPosition(0, -900, 0); mesh.setMatrixAt(i, m4); mesh.setColorAt(i, c4.setRGB(1, 1, 1)); }
      scene.add(mesh);
      return { mesh, count,
        set(i, x, y, z, dx, dy, dz, roll, scale, phase, amp, bias) { const hl = Math.hypot(dx, dz) || 1e-4; e4.set(-Math.atan2(dy, hl), Math.atan2(dx, dz), roll, 'YXZ'); m4.compose(v4.set(x, y, z), q4.setFromEuler(e4), s4.set(scale, scale, scale)); mesh.setMatrixAt(i, m4);
          pose.array[i * 4] = phase; pose.array[i * 4 + 1] = amp; pose.array[i * 4 + 2] = bias; },
        done() { mesh.instanceMatrix.needsUpdate = true; pose.needsUpdate = true; } }; };
    // (round 14) a bird's reach: how far its skin can be from its own middle, measured on its geometry at size 1. A wing's vertex
    // swings about its pivot whatever the stroke and the twist, so its reach is the pivot's own plus the length of its arm.
    const birdReach = (geo) => { const P = geo.attributes.position.array, A = geo.attributes.aAnim.array, V = geo.attributes.aPivot.array; let r = 0;
      for (let i = 0; i < P.length; i += 3) { const k = i / 3 * 4 + 1; r = Math.max(r, Math.abs(A[k]) > 0.5 ? Math.hypot(V[i], V[i + 1], V[i + 2]) + Math.hypot(P[i] - V[i], P[i + 1] - V[i + 1], P[i + 2] - V[i + 2]) : Math.hypot(P[i], P[i + 1], P[i + 2])); }
      return r; };
    // red grouse of our own covey, made to be seen from behind and a little above: a barred russet back, a small head with red
    // wattles carried over the shoulders, a short dark tail fan with a pale tip band, broad bowed wings with white linings
    const cGrouse = cRusset.clone().lerp(cPeat, 0.3).multiplyScalar(0.86), cGrouseD = cGrouse.clone().lerp(cPeat, 0.6).multiplyScalar(0.8), cWing = cRusset.clone().lerp(cPeat, 0.5).multiplyScalar(0.8), cUnder = cWhite.clone().multiplyScalar(0.8);
    const cTail = cPeat.clone().multiplyScalar(0.72), cTailTip = cRusset.clone().lerp(cWhite, 0.6).multiplyScalar(0.8);
    await ctx.yield();
    const coveyGeo = (() => { const g = new Geo(), Lb = 0.4, W = 0.33;
      g.loft([{ z: -0.46 * Lb, y: 0, rx: 0, ry: 0 }, { z: -0.36 * Lb, y: 0.005 * Lb, rx: 0.11 * Lb, ry: 0.1 * Lb }, { z: -0.14 * Lb, y: 0, rx: 0.2 * Lb, ry: 0.185 * Lb }, { z: 0.1 * Lb, y: 0.005 * Lb, rx: 0.2 * Lb, ry: 0.19 * Lb }, { z: 0.27 * Lb, y: 0.035 * Lb, rx: 0.145 * Lb, ry: 0.15 * Lb },
        { z: 0.38 * Lb, y: 0.085 * Lb, rx: 0.085 * Lb, ry: 0.09 * Lb }, { z: 0.44 * Lb, y: 0.1 * Lb, rx: 0, ry: 0 }], { sides: 10, top: cGrouse, belly: cGrouseD, shade: [-0.5, 0.2] });
      g.blob(0, 0.135 * Lb, 0.44 * Lb, 0.078 * Lb, 0.074 * Lb, 0.09 * Lb, cGrouse, cGrouseD, 7, 4);
      g.tube([[0, 0.13 * Lb, 0.51 * Lb], [0, 0.11 * Lb, 0.59 * Lb]], [0.03 * Lb, 0], 4, C('#2a2420'));
      for (const sx2 of [-1, 1]) { g.blob(sx2 * 0.04 * Lb, 0.19 * Lb, 0.46 * Lb, 0.02 * Lb, 0.016 * Lb, 0.03 * Lb, C('#b3261c'), null, 4, 3);
        g.blob(sx2 * 0.07 * Lb, -0.17 * Lb, -0.14 * Lb, 0.04 * Lb, 0.05 * Lb, 0.09 * Lb, cUnder, null, 5, 3); }
      { const NT = 9, RR = [1, 0.86, 0.8, 0.16], CC = [cTailTip, cTailTip, cTail, cGrouseD], rows = RR.map(() => []), cols = RR.map(() => []);
        for (let j = 0; j < RR.length; j++) for (let i = 0; i < NT; i++) { const a = (i / (NT - 1) - 0.5) * 1.75, r = RR[j] * 0.44 * Lb * (j < 2 ? 1 - 0.05 * (i % 2) : 1); rows[j].push([Math.sin(a) * r, 0.03 * Lb - r * 0.42, -0.33 * Lb - Math.cos(a) * r * 0.9]); cols[j].push(CC[j]); }
        grid(g, rows, cols); }
      const x0 = 0.1 * Lb, XS = [0, 0.24, 0.5, 0.74, 0.92, 1], lead = [0.15, 0.2, 0.2, 0.165, 0.1, 0.02], trail = [-0.2, -0.25, -0.26, -0.23, -0.16, -0.05], CH = 1.45 * Lb, zc = 0.04 * Lb;
      const rows = [[], [], []], cols = [[], [], []], cFl = cWing.clone().multiplyScalar(0.7), cCov = cGrouse.clone().multiplyScalar(0.92);
      for (let k = 0; k < XS.length; k++) { const x = x0 + XS[k] * (W - x0), y = 0.06 * Lb - 0.05 * Lb * XS[k] * XS[k], zl = lead[k] * CH + zc, zt = trail[k] * CH + zc;
        rows[0].push([x, y - 0.012 * Lb, zt]); rows[1].push([x, y + 0.012 * Lb, lerp(zl, zt, 0.42)]); rows[2].push([x, y, zl]);
        cols[0].push(cFl); cols[1].push(XS[k] > 0.8 ? cFl : cWing); cols[2].push(XS[k] > 0.8 ? cWing : cCov); }
      const wr = grid(g, rows, cols); g.anim(wr, (x) => [clamp((x - x0) / (W - x0), 0, 1), 1, 0, 0]); g.pivot(wr, x0, 0.06 * Lb, zc); g.glow(wr, 1); g.mirror(wr);
      return g.build(); })();
    const grouseFar = () => birdGeo({ len: 0.4, span: 0.66, plump: 0.98, body: cGrouse, belly: cGrouseD, beak: C('#2a2420'), wing: cWing, tailC: cTail, legs: cUnder, tail: 1.3, tailLen: 0.9, chord: 1.45 });
    await ctx.yield();
    const NCOVEY = clamp(Math.round(9 * dens), 7, 12);
    const covey = makeBirds(coveyGeo, birdMat(cUnder, { twist: [0.6, 0.15], stroke: [0.2, 0.5, 0.2, -0.12], bar: [200, 0.34, 0.85] }), NCOVEY, 'covey');
    const coveyB = []; for (let i = 0; i < NCOVEY; i++) coveyB.push(i === 0 ? { ahead: 3.5, side: 0.2, up: -0.42, ph: 0, sd: 0.3, keep: 1 }
      : { ahead: rng.range(4.2, 7.8), side: (i % 2 ? 1 : -1) * rng.range(1.4, 5.0), up: rng.range(-0.4, 0.75), ph: rng.range(0, 6.28), sd: rng(), keep: i < 3 ? 1 : 0, burstA: rng.range(8, 16), burstS: rng.range(-4.5, 4.5) });
    await ctx.yield();
    const FARN = 24, far = makeBirds(grouseFar(), birdMat(cUnder, { twist: [0.3, 0.2] }), FARN, 'far-coveys'), farC = [];
    for (let c = 0; c < 3; c++) { const d = [rng.range(70, 130), rng.range(D_BOG + 30, D_BURN - 20), D_FOOT + rng.range(60, 85)][c], lat = c === 2 ? 0 : (c === 0 ? -1 : rng.chance(0.5) ? 1 : -1) * rng.range(34, 70), a = beside(d, lat, { x: 0, z: 0 }), ang = rng.range(-0.5, 0.5) + (lat < 0 ? 0 : 3.14);
      // the third covey crosses the ramp downwind, high enough to be seen against the sky and the wool from below
      farC.push({ x: a.x, z: a.z, dx: c === 2 ? 1 : Math.cos(ang), dz: c === 2 ? 0.12 : Math.sin(ang) * 0.6 - 0.5, T: rng.range(9, 13), ph: rng(), birds: Array.from({ length: 8 }, () => ({ a: rng.range(-9, 9), s: rng.range(-5, 5), u: c === 2 ? rng.range(5, 9) : rng.range(0.9, 2.2), ph: rng.range(0, 6.28) })) }); }
    for (const c of farC) { const l = Math.hypot(c.dx, c.dz); c.dx /= l; c.dz /= l; }
    // ROUND 14, F2: OVER OUR LINE THE COVEY RISES. The first two coveys run 210 m low over the quilt through a point 34 to 70 m beside
    // the line, so most runs cross it, and at the lens's own height. Each run is walked here, a quarter of a metre at a time, against
    // the route's whole line as dealt: where a bird of the covey comes within reach of the line in plan (2 m of clear air and its own
    // reach, wings at their widest, at the size update draws it: 1.7, and half a step of the walk more: what the walk cannot see
    // between two of its places, in plan), the covey must fly high enough for that bird's lowest skin to
    // be FAR_OVER m over the line's own height there. r0..r1: the stretch of the run (the law's dist) from the first such place to the
    // last, whole (two crossings, or a run along the line, are one stretch), and one step of the walk more at either end; rise: the
    // most any bird needs in it, and half the most that need changes from one walked place to the next (what the walk cannot see
    // between its steps). Update adds the rise to every bird's height over the ground across the stretch and eases it in and out over
    // FAR_EASE m of run on either side; where the stretch stands within FAR_EASE m of an end of the run (dist -105 or 105, where the
    // birds have no size), the run ends before the ease does (at the -105 end the covey sets out with the ease-in part done). A covey that never comes within reach keeps a rise of nothing, and so
    // does the third, which is dealt high. Nothing is dealt here.
    const FAR_OVER = 4, FAR_EASE = 40, FAR_STEP = 0.25, farReach = birdReach(far.mesh.geometry) * 1.7;
    for (let c = 0; c < 3; c++) { const F = farC[c]; F.r0 = 0; F.r1 = 0; F.rise = 0; if (c === 2) continue; let on = false, most = 0, jump = 0; const was = F.birds.map(() => NaN);
      for (let D = -105; D <= 105; D += FAR_STEP) for (let k = 0; k < F.birds.length; k++) { const b = F.birds[k], x = F.x + F.dx * (D + b.a) - F.dz * b.s, z = F.z + F.dz * (D + b.a) + F.dx * b.s; if (linePlan(x, z).d > 2 + farReach + lineSag + FAR_STEP / 2) { was[k] = NaN; continue; }
        const need = LP.y + FAR_OVER + farReach + lineSag - H(x, z) - b.u; if (!on) { on = true; F.r0 = D - FAR_STEP; } F.r1 = D + FAR_STEP; most = Math.max(most, need); if (was[k] === was[k]) jump = Math.max(jump, Math.abs(need - was[k])); was[k] = need; }
      if (most > 0) F.rise = most + jump / 2;
      await ctx.yield(); }
    await ctx.yield();
    // pipits (or curlew-pale plover in June) flicking up from the heather ahead
    const NPIP = Math.round(40 * Math.max(0.75, detail)), pipCol = june ? C('#b89a5a') : C('#7a6a4a');
    const pipits = makeBirds(birdGeo({ len: june ? 0.3 : 0.17, span: june ? 0.6 : 0.27, plump: 0.9, sides: 5, body: pipCol, belly: pipCol.clone().lerp(cWhite, 0.5), beak: C('#3a3020'), wing: pipCol.clone().multiplyScalar(0.8), tailLen: 1.1 }), birdMat(pipCol.clone().lerp(cWhite, 0.6).multiplyScalar(0.8)), NPIP, 'pipits'), pipB = [];
    for (let i = 0; i < NPIP; i++) { const a = beside(rng.range(25, D_AIR + 20), (rng.chance(0.5) ? 1 : -1) * rng.range(5, 26), { x: 0, z: 0 }); pipB.push({ x: a.x, z: a.z, y: H(a.x, a.z), T: rng.range(2.8, 5.2), ph: rng(), h: rng.range(1.6, 4.2), az: rng.range(0, 6.28) }); }
    // ROUND 14, F3: A PIPIT HOPS AWAY FROM OUR LINE, NOT ACROSS IT. Each bird's hop is (hx, hz) on the ground and its heading (fx, fz):
    // as dealt, 8 m along x and 3 sin(az) along z, which is what update flew. A hop whose spot stands farther from the line in plan
    // than the hop's length, the bird's reach, PIP_AIR and lineSag together is not walked; nor is one whose part across our way does
    // not point toward the line at the line's nearest place to its spot (it points away, or is nothing: a presumption, not a test). Every other hop is walked here whole
    // (PIP_WALK steps, with update's own rise and the size it is drawn at) against the route's whole line; where the bird's skin (its reach from its
    // geometry, wings at their widest) would come within PIP_AIR m of the line (give or take half the bird's longest step between two
    // walked places, which the walk cannot see), the hop is split at the line's nearest place to the bird's spot into the part along
    // our way and the part across it, and the part across, if it points toward the line, is mirrored to point away.
    // The heading turns with the hop. The spot, the rise, the beat and the clock are as dealt; nothing is dealt here.
    // A turned bird hops where it was not dealt to hop, which on the burn's bank is uphill. Its turned hop is walked once more, over
    // the ground (PIP_WALK steps): gl is the most the ground stands over its spot along the hop, and 1 / gk the latest phase by which
    // a lift that begins at nothing and never falls, gl (1 - (1 - tb gk)^2), must be whole so as to be no less than the ground's rise
    // at every walked place (the walk does not see between two places: where the ground there is no higher than at the higher of
    // the two, the lift falls short by no more than it grows in one step). Update adds that lift to the bird's dealt height: it
    // starts from its spot as dealt and is never lower than its dealt course. A bird left as dealt keeps gl = 0.
    // (The walk against the line above is of the hop as dealt; the turned hop is walked over the ground only.)
    const PIP_AIR = 2, PIP_WALK = 512, pipReach = birdReach(pipits.mesh.geometry) * 1.3, pipG = new Float64Array(PIP_WALK + 1);
    for (let i = 0; i < NPIP; i++) { const B = pipB[i]; B.hx = 8; B.hz = Math.sin(B.az) * 3; B.fx = 0.9; B.fz = Math.sin(B.az) * 0.35; B.gl = 0; B.gk = 0;
      if (linePlan(B.x, B.z).d > Math.hypot(B.hx, B.hz) + pipReach + PIP_AIR + lineSag) continue;
      const ux = -LP.tz * LP.side, uz = LP.tx * LP.side, ac = B.hx * ux + B.hz * uz; if (ac >= 0) continue;   // (ux, uz): from the line toward the spot
      let air = Infinity, move = 0, px = 0, py = 0, pz = 0; for (let q = 0; q <= PIP_WALK; q++) { const tb = q / PIP_WALK, x = B.x + B.hx * tb, y = B.y + 0.4 + B.h * Math.sin(Math.PI * tb) * (0.8 + 0.2 * Math.sin(tb * 31 + i)), z = B.z + B.hz * tb;
        air = Math.min(air, lineAir(x, y, z, lineNear(x, z), 4) - pipReach * smoothstep(0, 0.08, tb) * (1 - smoothstep(0.86, 1, tb))); if (q) move = Math.max(move, Math.hypot(x - px, y - py, z - pz)); px = x; py = y; pz = z; }
      if (air - move / 2 < PIP_AIR + lineSag) { const fc = B.fx * ux + B.fz * uz; B.hx -= 2 * ac * ux; B.hz -= 2 * ac * uz; B.fx -= 2 * fc * ux; B.fz -= 2 * fc * uz;
        let top = 0; for (let q = 0; q <= PIP_WALK; q++) { const tb = q / PIP_WALK; top = Math.max(top, pipG[q] = H(B.x + B.hx * tb, B.z + B.hz * tb) - B.y); }
        if (top > 0) { let by = 1; for (let q = 1; q <= PIP_WALK; q++) if (pipG[q] > 0) by = Math.min(by, q / PIP_WALK / (1 - Math.sqrt(1 - pipG[q] / top))); B.gl = top; B.gk = 1 / by; } } }
    await ctx.yield();
    // the golden eagle: golden nape and head, a white-based tail with a dark end band, wings in three tones with separate black fingers
    const cRaven = night ? C('#1a1c2c') : C('#16141c'), cEagle = C('#4f331b'), cEagleD = C('#2a1b10'), cGoldN = C('#c99a4e'), cTawny = C('#8f6a3c'), cPaleF = C('#a89270'), cFing = C('#17110c'), cTailW = cWhite.clone().multiplyScalar(0.72);
    const eagleGeo = () => { const g = new Geo(), Lb = 0.9, W = 1.075;
      const body = g.loft([{ z: -0.42 * Lb, y: 0, rx: 0, ry: 0 }, { z: -0.34 * Lb, y: 0, rx: 0.09 * Lb, ry: 0.08 * Lb }, { z: -0.12 * Lb, y: -0.01 * Lb, rx: 0.16 * Lb, ry: 0.15 * Lb }, { z: 0.12 * Lb, y: 0, rx: 0.165 * Lb, ry: 0.155 * Lb }, { z: 0.28 * Lb, y: 0.03 * Lb, rx: 0.115 * Lb, ry: 0.115 * Lb },
        { z: 0.4 * Lb, y: 0.06 * Lb, rx: 0.075 * Lb, ry: 0.08 * Lb }, { z: 0.46 * Lb, y: 0.07 * Lb, rx: 0, ry: 0 }], { sides: 10, top: cEagle, belly: cEagleD, shade: [-0.5, 0.2] });
      g.paint(body, (x, y, z, col) => { if (z > 0.2 * Lb && y > 0.02 * Lb) col.lerp(cGoldN, clamp((z - 0.2 * Lb) / (0.14 * Lb), 0, 0.9)); });
      g.blob(0, 0.09 * Lb, 0.47 * Lb, 0.076 * Lb, 0.072 * Lb, 0.1 * Lb, cGoldN, cEagle, 8, 5);
      g.tube([[0, 0.085 * Lb, 0.545 * Lb], [0, 0.075 * Lb, 0.605 * Lb], [0, 0.04 * Lb, 0.64 * Lb]], [0.034 * Lb, 0.028 * Lb, 0], 5, C('#d9ac3c'), C('#2a2018'));
      for (const sx2 of [-1, 1]) g.blob(sx2 * 0.06 * Lb, -0.13 * Lb, -0.2 * Lb, 0.035 * Lb, 0.035 * Lb, 0.09 * Lb, C('#c9a03a'), null, 5, 3);
      { const NT = 11, RR = [1, 0.97, 0.7, 0.62, 0.14], CC = [cPaleF, cEagleD, cEagleD, cTailW, cTailW], rows = RR.map(() => []), cols = RR.map(() => []);
        for (let j = 0; j < RR.length; j++) for (let i = 0; i < NT; i++) { const a = (i / (NT - 1) - 0.5) * 1.5, r = RR[j] * 0.56 * Lb * (j < 2 ? 1 - 0.04 * (i % 2) : 1); rows[j].push([Math.sin(a) * r, 0.02 * Lb - r * 0.2, -0.34 * Lb - Math.cos(a) * r * 0.95]); cols[j].push(CC[j]); }
        grid(g, rows, cols); g.blob(0, 0.03 * Lb, -0.4 * Lb, 0.085 * Lb, 0.05 * Lb, 0.12 * Lb, cEagle, cEagle, 6, 3); }
      const x0 = 0.12 * Lb, XS = [0, 0.14, 0.3, 0.48, 0.66, 0.82, 0.94, 1], lead = [0.2, 0.25, 0.27, 0.27, 0.255, 0.23, 0.2, 0.16], trail = [-0.2, -0.25, -0.26, -0.26, -0.25, -0.23, -0.19, -0.14], CH = 1.5 * Lb, zc = 0.04 * Lb;
      const FR = [0, 0.3, 0.55, 0.78, 1], rows = FR.map(() => []), cols = FR.map(() => []);      // chord rows: trailing edge, flight-feather bases, greater coverts, the tawny covert bar, leading edge
      for (let k = 0; k < XS.length; k++) { const t = XS[k], x = x0 + t * (W - x0), y = 0.05 * Lb - 0.03 * Lb * t * t, zl = lead[k] * CH + zc, zt = trail[k] * CH + zc;
        for (let j = 0; j < 5; j++) rows[j].push([x, y + 0.015 * Lb * Math.sin(FR[j] * 3.1416), lerp(zt, zl, FR[j])]);
        cols[0].push(cEagleD.clone().lerp(cFing, smoothstep(0.55, 0.8, t))); cols[1].push(cPaleF.clone().lerp(cTailW, 0.55 * smoothstep(0.5, 0.7, t) * (1 - smoothstep(0.85, 0.97, t))).lerp(cFing, smoothstep(0.88, 1, t)));
        cols[2].push(cEagle.clone().lerp(cEagleD, 0.35)); cols[3].push(cTawny.clone().lerp(cEagle, 0.25 + 0.75 * smoothstep(0.55, 0.85, t))); cols[4].push(cEagle.clone().lerp(cEagleD, 0.4)); }
      const wr = grid(g, rows, cols); g.anim(wr, (x) => [clamp((x - x0) / (W - x0), 0, 1), 1, 0, 0]); g.pivot(wr, x0, 0.05 * Lb, zc); g.glow(wr, 1); g.mirror(wr);
      { const NF = 7, zl = lead[7] * CH + zc, zt = trail[7] * CH + zc, yb = 0.02 * Lb, cF2 = cFing.clone().multiplyScalar(0.85);
        for (let f = 0; f < NF; f++) { const t = f / (NF - 1), zb = lerp(zl, zt, 0.04 + 0.9 * t), wB = (zl - zt) / NF * 0.44, len = W * (0.4 - 0.2 * t), sweep = lerp(0.18, -0.85, t) * len;
          const xs = [W * 0.955, W * 0.955 + len * 0.4, W * 0.955 + len * 0.75, W * 0.955 + len], zs = [zb, zb + sweep * 0.3, zb + sweep * 0.66, zb + sweep], ws = [wB, wB * 1.05, wB * 0.8, wB * 0.25], ys = [0, 0.012, 0.035, 0.07];
          const fr = g.strip(xs.map((x, k) => [x, yb + ys[k] * Lb, zs[k] - ws[k]]), xs.map((x, k) => [x, yb + ys[k] * Lb, zs[k] + ws[k]]), cF2, cFing);
          g.anim(fr, () => [1, 1, 0, 0]); g.pivot(fr, x0, 0.05 * Lb, zc); g.glow(fr, 1); g.mirror(fr); } }
      return g.build(); };
    const eagleMat = () => birdMat(cEagle.clone().lerp(C('#b89868'), 0.5), { twist: [0.25, 0.1], stroke: [0.25, 0.55, 0.3, 0.05], bar: [84, 0.14, 0.4] });
    await ctx.yield();
    // ravens tumbling at the thorns, or a golden eagle soaring over the tor
    const thornMid = new THREE.Vector3(HX, HY + 52, HZ), BIG = cast.eagle ? 1 : 4;
    const bigGeo = cast.eagle ? eagleGeo()
      : birdGeo({ len: 0.62, span: 1.25, plump: 0.8, body: cRaven, belly: cRaven, beak: C('#0c0c10'), wing: cRaven.clone().lerp(C('#3a3a66'), 0.25), tailC: cRaven, tail: 1.3, tailLen: 1.15, chord: 1.25, lead: [0.2, 0.24, 0.22, 0.16, 0.04], trail: [-0.2, -0.22, -0.2, -0.16, -0.08] });
    const bigBirds = makeBirds(bigGeo, cast.eagle ? eagleMat() : birdMat(cRaven.clone().lerp(C('#3a3a66'), 0.2), { twist: [0.3, 0.2] }), BIG, 'ravens');
    const ravB = []; for (let i = 0; i < BIG; i++) ravB.push({ ph: rng.range(0, 6.28), r: rng.range(7, 13), sp: rng.range(0.5, 0.8), h: rng.range(-2, 5), sd: rng() });
    await ctx.yield();
    // one more big bird where the visit calls for it: the stooping eagle (rare) or the harrier quartering the bog
    const hunterKind = rare ? 'eagle' : cast.harrier ? 'harrier' : null; let hunter = null;
    if (hunterKind) { const cH = C('#aab0bc');
      hunter = hunterKind === 'eagle' ? makeBirds(eagleGeo(), eagleMat(), 1, 'hunter')
        : makeBirds(birdGeo({ len: 0.5, span: 1.15, plump: 0.75, body: cH, belly: cWhite.clone().multiplyScalar(0.75), beak: C('#2a2420'), wing: cH, tip: C('#15151c'), tailC: cH, tailLen: 1.3, chord: 1.1 }), birdMat(cWhite.clone().multiplyScalar(0.75), { twist: [0.3, 0.2] }), 1, 'hunter'); }
    await ctx.yield();

    // ---------------------------------------------------------------- hares and hinds: bounders on baked landing points (no skating)
    const hareGeo = (() => { const g = new Geo(), c = C('#8c7662'), cb = C('#b9a992'), cd = C('#17130f'), cw = cWhite.clone().multiplyScalar(0.8);
      g.loft([{ z: -0.3, y: 0.2, rx: 0, ry: 0 }, { z: -0.26, y: 0.21, rx: 0.07, ry: 0.08 }, { z: -0.14, y: 0.22, rx: 0.1, ry: 0.115 }, { z: 0.04, y: 0.21, rx: 0.085, ry: 0.095 }, { z: 0.18, y: 0.22, rx: 0.07, ry: 0.08 }, { z: 0.27, y: 0.26, rx: 0.045, ry: 0.055 }, { z: 0.31, y: 0.28, rx: 0, ry: 0 }], { sides: 9, top: c, belly: cb });
      g.blob(0, 0.3, 0.33, 0.048, 0.052, 0.075, c, cb, 7, 4);
      for (const s of [-1, 1]) {
        g.tube([[s * 0.025, 0.34, 0.31], [s * 0.036, 0.42, 0.26], [s * 0.04, 0.475, 0.2]], [0.016, 0.021, 0.007], 5, c, cd, { flatten: 0.5 });
        const hl = g.tube([[s * 0.075, 0.2, -0.17], [s * 0.085, 0.1, -0.1], [s * 0.085, 0.03, -0.2], [s * 0.085, 0.0, -0.06]], [0.05, 0.035, 0.022, 0.018], 5, c, cb); g.anim(hl, (x, y) => [clamp((0.2 - y) / 0.2, 0, 1), -1, 0, 0]); g.pivot(hl, s * 0.075, 0.2, -0.17);
        const fl = g.tube([[s * 0.05, 0.18, 0.16], [s * 0.05, 0.09, 0.18], [s * 0.05, 0.0, 0.17]], [0.03, 0.02, 0.016], 5, c, cb); g.anim(fl, (x, y) => [clamp((0.18 - y) / 0.18, 0, 1), 1, 0, 0]); g.pivot(fl, s * 0.05, 0.18, 0.16); }
      g.blob(0, 0.26, -0.31, 0.052, 0.052, 0.046, cw, cw, 6, 3);
      return g.build(); })();
    await ctx.yield();
    // A red deer hind, made to be read at a fifth of the frame: a deep-chested body in red-brown with a paler belly, a thick neck
    // that grows out of the chest, a long wedge of a head darkening to the muzzle, broad leaf-shaped ears held out to the sides
    // (no upright spike anywhere on the head), legs in the coat's colour to the knee and the hock with dark cannons and hooves
    // below, the joints bent, and the cream rump patch round a short tail.
    const hindGeo = (() => { const g = new Geo(), c = LK.season === 'rut' ? C('#6b4632') : C('#7a4a2c'), cb = c.clone().lerp(C('#d8c4a0'), 0.42), cd = C('#2b211c'), cr = C('#e4d4ae'), cn = c.clone().lerp(cd, 0.16), ce = c.clone().lerp(cb, 0.3);
      const body = g.loft([{ z: -0.75, y: 1.02, rx: 0, ry: 0 }, { z: -0.65, y: 1.02, rx: 0.165, ry: 0.205 }, { z: -0.38, y: 1.0, rx: 0.23, ry: 0.275 }, { z: 0.02, y: 0.96, rx: 0.225, ry: 0.265 }, { z: 0.4, y: 0.965, rx: 0.22, ry: 0.305 }, { z: 0.63, y: 1.03, rx: 0.165, ry: 0.25 }, { z: 0.75, y: 1.08, rx: 0, ry: 0 }], { sides: 12, top: c, belly: cb });
      g.paint(body, (x, y, z, col) => { if (z < -0.5 && y > 0.86) col.lerp(cr, clamp((-0.5 - z) * 9, 0, 0.94) * clamp((y - 0.86) * 8, 0, 1)); });
      const neck = g.tube([[0, 0.97, 0.42], [0, 1.19, 0.61], [0, 1.41, 0.76], [0, 1.57, 0.85]], [0.265, 0.195, 0.14, 0.108], 10, cn, c, { flatten: 0.76 });
      g.paint(neck, (x, y, z, col) => { if (y - (z - 0.42) * 1.25 < 0.9) col.lerp(cb, 0.35); });      // (the throat is paler)
      g.blob(0, 1.605, 0.935, 0.088, 0.097, 0.155, c, cb, 9, 5);
      g.tube([[0, 1.595, 1.0], [0, 1.55, 1.14], [0, 1.523, 1.245], [0, 1.515, 1.28]], [0.08, 0.064, 0.052, 0], 8, c, cd);
      for (const s of [-1, 1]) {
        g.blob(s * 0.078, 1.635, 0.99, 0.017, 0.02, 0.024, cd, null, 5, 3);
        // the ear: a leaf, broad face forward, held out and a little up
        const ear = g.tube([[s * 0.06, 1.65, 0.875], [s * 0.165, 1.69, 0.855], [s * 0.28, 1.725, 0.84], [s * 0.36, 1.735, 0.83]], [0.012, 0.03, 0.025, 0], 6, ce, ce, { flatten: 3 });      // (thin fore and aft, 18 cm tall: the leaf's face is to the front)
        g.paint(ear, (x, y, z, col) => { if (z > 0.855) col.lerp(cb, 0.45); });
        const fx = s * 0.135, fl = g.tube([[fx, 0.95, 0.44], [fx, 0.73, 0.47], [fx, 0.5, 0.505], [fx, 0.31, 0.455], [fx, 0.08, 0.45], [fx, 0, 0.49]], [0.1, 0.076, 0.054, 0.036, 0.034, 0.046], 6, c, c);
        g.paint(fl, (x, y, z, col) => { col.copy(c).lerp(cd, smoothstep(0.52, 0.36, y) * 0.92); }); g.anim(fl, (x, y) => [clamp((0.95 - y) / 0.95, 0, 1), 1, 0, 0]); g.pivot(fl, fx, 0.95, 0.46);
        const hx = s * 0.145, hl = g.tube([[hx, 1.0, -0.48], [hx, 0.77, -0.42], [hx, 0.58, -0.5], [hx, 0.49, -0.6], [hx, 0.27, -0.555], [hx, 0.07, -0.53], [hx, 0, -0.49]], [0.145, 0.115, 0.074, 0.052, 0.037, 0.034, 0.046], 6, c, c);
        g.paint(hl, (x, y, z, col) => { col.copy(c).lerp(cd, smoothstep(0.54, 0.4, y) * 0.92); if (y > 0.8 && z < -0.56) col.lerp(cr, 0.5); }); g.anim(hl, (x, y) => [clamp((0.98 - y) / 0.98, 0, 1), -1, 0, 0]); g.pivot(hl, hx, 0.98, -0.5); }
      g.tube([[0, 1.07, -0.71], [0, 0.99, -0.8], [0, 0.87, -0.8]], [0.05, 0.045, 0], 5, cr, c.clone().lerp(cd, 0.5));
      return g.build(); })();
    await ctx.yield();
    const BOUND = /* glsl */`float f = aPose.x, air = sin(f * 3.1416) * aPose.w, lw = smoothstep(0., .3, aAnim.x) * aPose.w;
      if (aAnim.y > .5) { float a = mix(.5, -1., smoothstep(0., .55, f)) + .85 * smoothstep(.62, 1., f); vec3 q = p - aPivot; rotX(q, a * lw); p = aPivot + q; }
      else if (aAnim.y < -.5) { float a = mix(1., -.75, smoothstep(.04, .8, f)); vec3 q = p - aPivot; rotX(q, a * lw); p = aPivot + q; }
      p.y *= 1. - .16 * aPose.z + .05 * air; p.z *= 1. + .1 * aPose.z + .06 * air;
      vec3 qb = p - uHip; rotX(qb, -aPose.y); p = uHip + qb; rotX(n, -aPose.y);`;
    const CAMV = PL / DUR;
    // o: count, d0 (path distance of the route's start), len, lat(r, i), bl [min,max], hop, v, bases [min,max], scale, hip, shadow [w, l]
    const makeBounders = (geo, o, name, R = rng) => {
      const mesh = new THREE.InstancedMesh(geo, bodyMat(BOUND, { grain: o.grain, uniforms: { uHip: { value: o.hip } }, pars: 'uniform vec3 uHip;' }), o.count), pose = poseAttr(geo, o.count), list = [];
      mesh.frustumCulled = false; mesh.name = name; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
      for (let i = 0; i < o.count; i++) { const bl = R.range(o.bl[0], o.bl[1]), K = Math.ceil(o.len / bl) + 1, land = new Float32Array(K * 3);
        for (let k = 0; k < K; k++) { const r = k * bl + R.range(-0.25, 0.25); beside(o.d0 + r, o.lat(r, i), P2); land[k * 3] = P2.x; land[k * 3 + 2] = P2.z; land[k * 3 + 1] = H(P2.x, P2.z); }
        list.push({ bl, K, land, base: o.baseOf ? o.baseOf(i) : lerp(o.bases[0], o.bases[1], (i + R.range(0.1, 0.9)) / o.count), hop: o.hop * R.range(0.8, 1.2), sc: o.scale * R.range(0.9, 1.08), sh: addShadow(0, -900, 0, 0.01, 0.01) });
        mesh.setColorAt(i, c4.setRGB(1, 1, 1)); m4.makeScale(0.0001, 0.0001, 0.0001); m4.setPosition(0, -900, 0); mesh.setMatrixAt(i, m4); }
      // where bounder i is on the ground at T (its landing-to-landing line), and how far it is shown
      const at = (i, T, out) => { const a = list[i], Tc = Math.max(0, T); let p = (a.base + o.v * Tc - (o.slow ? o.slow(Tc) : 0)) / a.bl; if (T <= 0) p = Math.floor(p);
        const vis = smoothstep(0, 1.2, p) * (1 - smoothstep(a.K - 2.6, a.K - 1.3, p)); p = clamp(p, 0, a.K - 1.001); const k = Math.floor(p), f = p - k, L0 = k * 3, L1 = L0 + 3, ld = a.land;
        out.set(lerp(ld[L0], ld[L1], f), lerp(ld[L0 + 1], ld[L1 + 1], f), lerp(ld[L0 + 2], ld[L1 + 2], f)); return vis; };
      return { mesh, at, update(T) {      // T: seconds on this group's clock (keyed to u, plus still-camera time)
        const run = smoothstep(-0.05, 0.3, T), Tc = Math.max(0, T);
        for (let i = 0; i < list.length; i++) { const a = list[i]; let p = (a.base + o.v * Tc - (o.slow ? o.slow(Tc) : 0)) / a.bl; if (T <= 0) p = Math.floor(p);
          const vis = smoothstep(0, 1.2, p) * (1 - smoothstep(a.K - 2.6, a.K - 1.3, p)) * (o.hide ? smoothstep(-0.2, 0.2, T) : 1) * (o.lead ? smoothstep(3.0, 4.4, o.lead(i, Tc)) : 1);      // (o.lead: one about to be overtaken goes to ground rather than be cut by the frame's edge)
          if (vis < 0.002) { m4.makeScale(0.0001, 0.0001, 0.0001); m4.setPosition(0, -900, 0); mesh.setMatrixAt(i, m4); if (a.sh < SHN) setShadow(a.sh, 0, -900, 0, 0.01, 0.01); continue; }
          p = clamp(p, 0, a.K - 1.001); const k = Math.floor(p), f = p - k, L0 = k * 3, L1 = L0 + 3, L2 = Math.min(a.K - 1, k + 2) * 3, ld = a.land;
          const x = lerp(ld[L0], ld[L1], f), z = lerp(ld[L0 + 2], ld[L1 + 2], f), gy = lerp(ld[L0 + 1], ld[L1 + 1], f), y = gy + 4 * a.hop * f * (1 - f) * run;
          const dx = lerp(ld[L1] - ld[L0], ld[L2] - ld[L1] || ld[L1] - ld[L0], f * 0.6), dz = lerp(ld[L1 + 2] - ld[L0 + 2], ld[L2 + 2] - ld[L1 + 2] || ld[L1 + 2] - ld[L0 + 2], f * 0.6);
          const s = a.sc * vis; e4.set(0, Math.atan2(dx, dz), 0); m4.compose(v4.set(x, y, z), q4.setFromEuler(e4), s4.set(s, s, s)); mesh.setMatrixAt(i, m4);
          pose.array[i * 4] = f; pose.array[i * 4 + 1] = Math.atan2(4 * a.hop * (1 - 2 * f) + (ld[L1 + 1] - ld[L0 + 1]), a.bl) * 0.75 * run; pose.array[i * 4 + 2] = (Math.max(0, 1 - f * 7) + Math.max(0, 1 - (1 - f) * 7)) * run; pose.array[i * 4 + 3] = run;
          if (a.sh < SHN) { const k2 = 1 - 0.5 * Math.sin(f * Math.PI) * run; setShadow(a.sh, x, gy, z, o.shadow[0] * s * k2, o.shadow[1] * s * k2); } }
        mesh.instanceMatrix.needsUpdate = true; pose.needsUpdate = true; } };
    };
    await ctx.yield();
    // Six hares bolt from the cushions ahead-right as we reach the bog and are slowly overtaken: at u 0.25 the nearest three are
    // 5-7.5 m ahead, strung out on three bearings to the right of the lead grouse; they tire, so the lens gains on them faster and
    // faster and has passed the last by about u 0.31. ahead(T) = HARE_A[i] + closing(T25) - closing(T); the lanes are exact at u 0.25.
    // (the lens closes on them quickly as they bolt, then they hold their distance from about u 0.22 to 0.26, near and large, before they tire)
    const U_HARE = U_BOG - 0.005, HARE_T25 = (0.25 - U_HARE) * DUR, hareSlow = (T) => 3.2 * smoothstep(0, 0.95, T) + 0.45 * T + 1.2 * Math.max(0, T - 2.5) ** 2;
    const HARE_A = [5.6, 6.9, 8.0, 9.2, 10.2, 11.4], HARE_LANE = [1.0, 0.3, 1.3, 2.9, 0.8, 2.2], HARE_BACK = 3;
    const hareBase = (i) => HARE_A[i] + hareSlow(HARE_T25) + HARE_BACK;
    const hareR = (i, ahead) => { const cl = Math.max(0, HARE_A[i] + hareSlow(HARE_T25) - ahead); let a = 0, b = 12; for (let k = 0; k < 28; k++) { const m = (a + b) * 0.5; if (hareSlow(m) < cl) a = m; else b = m; } return hareBase(i) + CAMV * a - cl; };   // route distance at which hare i is `ahead` of the lens
    const HR = HARE_A.map((a, i) => [hareR(i, a), hareR(i, 5.2), hareR(i, 2.2), hareR(i, -2)]);
    if (!cast.harrier) for (let i = 0; i < 6; i++) { const bl = rng.range(3.3, 3.9), K = Math.ceil(128 / bl) + 1; for (let k = 0; k < K; k++) rng.range(-0.25, 0.25); rng.range(0.1, 0.9); rng.range(0.8, 1.2); rng.range(0.9, 1.08); }   // (the draws of the first hares, so everything after them stays put)
    const hares = cast.harrier ? null : makeBounders(hareGeo, { count: 6, d0: U_HARE * PL - HARE_BACK, len: 172, bl: [3.3, 3.9], hop: 0.42, v: CAMV, slow: hareSlow, baseOf: hareBase, scale: 1.58, hip: new THREE.Vector3(0, 0.2, -0.05), shadow: [0.22, 0.5], grain: 16, hide: true, lead: (i, T) => HARE_A[i] + hareSlow(HARE_T25) - hareSlow(T),
      lat: (r, i) => -(HARE_LANE[i] + 0.32 * Math.sin((r - HR[i][0]) / 5.5) + Math.max(0, 2.95 - HARE_LANE[i]) * smoothstep(HR[i][1], HR[i][2], r) + Math.max(0, r - HR[i][3]) * 0.25) }, 'hares', fx.fork('hares'));
    { const HIND_LEN = (U_R1 + 0.004) * PL - D_BOG;       // (the draws of the first layout's sixteen hinds, so everything after them stays put)
      for (let i = 0; i < 16; i++) { const bl = rng.range(4.0, 4.8), K = Math.ceil(HIND_LEN / bl) + 1; for (let k = 0; k < K; k++) rng.range(-0.25, 0.25); rng.range(0.1, 0.9); rng.range(0.8, 1.2); rng.range(0.9, 1.08); } }
    await ctx.yield();
    // Sixteen hinds stand at the bog's edge where we come down off the shoulder (u 0.16: the nearest 18 m ahead-left), gather speed
    // from a standstill as we reach them and gallop beside us, on to the peat hag and along its crest against the sky, the lens
    // gaining slowly: from u 0.25 to 0.36 four or five are 8-20 m ahead-left. They drop over the hag's far end at the burn's head.
    const U_HIND = 0.162, D_HN = U_HIND * PL - 10, HN_LEN = (U_R1 + 0.004) * PL - D_HN, H_RAMP = 0.8, H_V = CAMV - 1.25;
    const H_KNEE = (0.25 - U_HIND) * DUR;      // (past the knee they hold their lead, so the lens never draws level and cuts them at the frame's edge)
    const hindSlow = (T) => T < H_RAMP ? CAMV * T - H_V * T * T / (2 * H_RAMP) : (CAMV - H_V * 0.5) * H_RAMP + 1.25 * (Math.min(T, H_KNEE) - H_RAMP) - 0.5 * Math.max(0, T - H_KNEE);
    const hinds = makeBounders(hindGeo, { count: 16, d0: D_HN, len: HN_LEN, lat: (r, i) => { const d = D_HN + r, rw = ridgeW(d / PL), off = ((i * 7) % 5 - 2) * 0.55; return lerp(-9.6 - off * 2.3, RIDGE_LAT + off, rw) - Math.max(0, r - (HN_LEN - 26)) * 0.85; },
      bl: [6.4, 7.4], hop: 0.7, v: CAMV, slow: hindSlow, baseOf: (i) => 32 + 15 * (((i * 5) % 16) + 0.5) / 16, scale: 1.3, hip: new THREE.Vector3(0, 0.95, -0.1), shadow: [0.5, 1.15], grain: 9 }, 'hinds', nx.fork('hinds'));
    await ctx.yield();
    // where the gaze leans while they run: a point on their line 15 m ahead of the lens
    const herdPts = [], herdV = new THREE.Vector3(), HU0 = 0.1, HU1 = 0.42;
    { const cp = new THREE.Vector3(), ct = new THREE.Vector3(), hp = new THREE.Vector3();
      for (let k = 0; k <= 48; k++) { const u = HU0 + (HU1 - HU0) * k / 48, T = (u - U_HIND) * DUR; flyPath.posAtDist(u * PLF, cp); flyPath.tangentAtDist(u * PLF, ct); const hl = Math.hypot(ct.x, ct.z) || 1; let sw = 0, ax = 0, ay = 0, az = 0;
        for (let i = 0; i < 16; i++) { const vis = hinds.at(i, T, hp), al = ((hp.x - cp.x) * ct.x + (hp.z - cp.z) * ct.z) / hl; if (al < 5 || al > 36) continue; const wq = vis / (1 + ((al - 11) / 6) ** 2); sw += wq; ax += hp.x * wq; ay += hp.y * wq; az += hp.z * wq; }
        const d = u * PL + 17; beside(d, lerp(-9.6, RIDGE_LAT, ridgeW(d / PL)), P2); const fy = H(P2.x, P2.z) + 1.5, kf = clamp(sw / 0.6, 0, 1);      // (no hind near: a point on their line)
        herdPts.push(lerp(P2.x, ax / Math.max(sw, 1e-3), kf), lerp(fy, ay / Math.max(sw, 1e-3) + 1.5, kf), lerp(P2.z, az / Math.max(sw, 1e-3), kf)); }
      for (let pass = 0; pass < 2; pass++) { const q = herdPts.slice(); for (let k = 1; k < 48; k++) for (let c = 0; c < 3; c++) herdPts[k * 3 + c] = 0.25 * q[k * 3 - 3 + c] + 0.5 * q[k * 3 + c] + 0.25 * q[k * 3 + 3 + c]; } }
    const herdAt = (u) => { const f = clamp((u - HU0) / (HU1 - HU0), 0, 0.9999) * 48, k = Math.floor(f) * 3, t = f - Math.floor(f); return herdV.set(lerp(herdPts[k], herdPts[k + 3], t), lerp(herdPts[k + 1], herdPts[k + 4], t), lerp(herdPts[k + 2], herdPts[k + 5], t)); };
    await ctx.yield();

    // ---------------------------------------------------------------- blackface ewes on the burn banks, and the fox on its boulder
    const GRAZE = /* glsl */`float alert = 1. - smoothstep(13., 30., distance(cameraPosition, im[3].xyz));
      float lift = max(alert, smoothstep(.55, .9, sin(uTime * .37 + sd * 3.1) * .5 + .5));
      float dip = uGraze.x * (1. - lift) * (1. + .035 * sin(uTime * 9. + sd)), w = aAnim.x;
      float tr = (uGraze.y + sin(uTime * .6 + sd) * .3 * lift * step(.5, uGraze.x)) * w;
      vec3 q = p - aPivot; rotX(q, dip * w); rotX(n, dip * w); rotY(q, tr); rotY(n, tr); p = aPivot + q;
      p.x += sin(uTime * 2.1 + sd + position.z * 6.) * .06 * aAnim.z; p.y += sin(uTime * 1.3 + sd) * .012 * aAnim.z;`;
    const grazeMat = (dip, grain, frag = '') => bodyMat(GRAZE, { grain, uniforms: { uGraze: { value: new THREE.Vector2(dip, 0) } }, pars: 'uniform vec2 uGraze;', frag });
    const eweGeo = (() => { const g = new Geo(), cf = cWhite.clone().multiplyScalar(0.76), cs = cf.clone().multiply(C('#b9b3d6')).multiplyScalar(1.25), ck = C('#19171c'), ch = C('#b5a88c');
      g.loft([{ z: -0.52, y: 0.62, rx: 0, ry: 0 }, { z: -0.46, y: 0.62, rx: 0.2, ry: 0.21 }, { z: -0.2, y: 0.63, rx: 0.3, ry: 0.29 }, { z: 0.15, y: 0.62, rx: 0.3, ry: 0.3 }, { z: 0.38, y: 0.64, rx: 0.24, ry: 0.25 }, { z: 0.5, y: 0.68, rx: 0, ry: 0 }], { sides: 10, top: cf, belly: cs });
      for (const [x, y, z] of [[-0.12, 0.84, -0.22], [0.13, 0.85, 0.02], [-0.08, 0.86, 0.24], [0.1, 0.8, -0.38]]) g.blob(x, y, z, 0.17, 0.1, 0.19, cf, cs, 6, 3);
      for (const s of [-1, 1]) for (const z of [0.32, -0.36]) g.tube([[s * 0.16, 0.42, z], [s * 0.16, 0.2, z], [s * 0.16, 0, z + 0.015]], [0.065, 0.04, 0.046], 5, ck, ck);
      g.tube([[0, 0.72, -0.5], [0, 0.56, -0.56]], [0.05, 0.03], 4, cf);
      const n0 = g.n;
      g.tube([[0, 0.72, 0.4], [0, 0.8, 0.52], [0, 0.86, 0.62]], [0.15, 0.115, 0.09], 7, cf, ck);
      g.blob(0, 0.88, 0.7, 0.075, 0.085, 0.12, ck, ck, 7, 4);
      g.tube([[0, 0.87, 0.76], [0, 0.83, 0.88], [0, 0.82, 0.93]], [0.066, 0.05, 0], 6, ck, C('#3a3438'));
      for (const s of [-1, 1]) { const pts = []; for (let k = 0; k <= 6; k++) { const t = k / 6, a = t * 4.6; pts.push([s * (0.08 + 0.09 * t), 0.94 + 0.075 * Math.cos(a) - 0.04, 0.63 - 0.085 * Math.sin(a) - 0.02 * t]); }
        g.tube(pts, [0.034, 0.032, 0.03, 0.026, 0.02, 0.013, 0], 5, ch, ch.clone().multiplyScalar(0.7));
        const ear = g.tube([[s * 0.07, 0.9, 0.64], [s * 0.15, 0.89, 0.62], [s * 0.2, 0.86, 0.61]], [0.02, 0.03, 0], 4, ck, ck, { flatten: 0.5 }); g.anim(ear, () => [1, 0, 0.25, 0]); }
      for (let i = n0; i < g.n; i++) { g.a[i * 4] = clamp((g.p[i * 3 + 2] - 0.38) / 0.16, 0, 1); g.pv[i * 3] = 0; g.pv[i * 3 + 1] = 0.7; g.pv[i * 3 + 2] = 0.38; }
      return g.build(); })();
    await ctx.yield();
    // ROUND 14, F1: THE TWO WATER'S-EDGE EWES STAND EWE_AIR m CLEAR OF OUR LINE, BY PLACE. Each is dealt a spot 1.2 m outside the burn's
    // edge on her own bank (eweSpots), nose to the water, and the burn runs under our line: on most seeds her head stood in the lens's
    // way. Her skin is measured here as it is drawn: every vertex of her model at her dealt size and turn, the head's at every pose
    // the grazing law can give them (eweSkin: lift 0..1 in 9 steps, dip, turn in 9 steps, the ears' flick), against the route's whole line (eweClear).
    //   1. Where her dealt spot is clear she is not moved at all.
    //   2. Else she walks ALONG the burn, EWE_STEP m of the land's line at a time, to the nearest place within EWE_REACH m (downstream
    //      first where two are as near) at which she is clear, still 1.2 m outside the burn's edge, on her own bank and her own side of
    //      our line, and not within 2.6 + s m (s: her size) of the burn stag's slab.
    //   3. Else she steps straight up her own bank from her dealt spot, 5 cm at a time, to the first place that is clear; at the 400th
    //      step (20 m up the bank from her dealt spot) she is stood there, clear or not.
    // Her turn is taken from the land's line's direction in plan (stx, stz) at the place she stands, by the law that turned her before (eweYaw); her size and
    // tint are as dealt, and so is every stream: the place is chosen after her two numbers are drawn, and at the deal no other ewe
    // is tested against the new place (eweOK reads the dealt one, x0 z0), so nothing downstream of her is dealt differently. (When
    // every ewe is dealt, the last pass of round 17, below, tests a moved ewe's new place against every other ewe.)
    const EWE_AIR = 2.5, EWE_STEP = 0.25, EWE_REACH = 10;
    const eweSkin = (() => { const P = eweGeo.attributes.position.array, A = eweGeo.attributes.aAnim.array, V = eweGeo.attributes.aPivot.array, rest = [], all = [];
      for (let i = 0; i < P.length; i += 3) { const k = i / 3 * 4, w = A[k], ear = A[k + 2], x = P[i], y = P[i + 1], z = P[i + 2]; rest.push(x, y, z); if (w === 0 && ear === 0) continue;
        for (let a = 0; a <= 8; a++) for (const kf of [0.965, 1.035]) for (let b = -4; b <= 4; b++) { const lift = a / 8; if ((lift === 0 && b > -4) || (lift === 1 && kf > 1)) continue;
          const dip = 1.05 * (1 - lift) * kf * w, tr = b * 0.075 * lift * w, c1 = Math.cos(dip), s1 = Math.sin(dip), c2 = Math.cos(tr), s2 = Math.sin(tr), qx = x - V[i], qy = y - V[i + 1], qz = z - V[i + 2];
          const y2 = c1 * qy - s1 * qz, z2 = s1 * qy + c1 * qz, X = V[i] + c2 * qx + s2 * z2, Y = V[i + 1] + y2, Z = V[i + 2] - s2 * qx + c2 * z2;      // GRAZE: rotX by the dip, rotY by the turn, about the pivot
          if (ear > 0) { for (const ex of [-1, 1]) for (const ey of [-1, 1]) all.push(X + ex * 0.06 * ear, Y + ey * 0.012 * ear, Z); } else all.push(X, Y, Z); } }
      return [new Float32Array(rest), new Float32Array(all)]; })();
    const eweClear = (x, z, yaw, s) => { const y = H(x, z) - 0.03, i0 = lineNear(x, z), c = Math.cos(yaw) * s, sn = Math.sin(yaw) * s;
      for (const p of eweSkin) for (let j = 0; j < p.length; j += 3) if (lineAir(x + p[j] * c + p[j + 2] * sn, y + p[j + 1] * s, z - p[j] * sn + p[j + 2] * c, i0, 6) < EWE_AIR + lineSag) return false;
      return true; };
    const eweYaw = (e, d) => { const j = clamp(Math.round(d / PL * NS), 0, NS); return e === 0 ? Math.atan2(stz[j], -stx[j]) + 0.25 : Math.atan2(-stz[j], stx[j]) - 0.3; };
    const eweStand = (e, s) => { const d0 = eweSpots[e][0], lat0 = eweSpots[e][1], sd = e === 0 ? 1 : -1, ok = (d, lat) => { beside(d, lat, P2); return eweClear(P2.x, P2.z, eweYaw(e, d), s); };
      if (ok(d0, lat0)) return null;
      for (let k = 1; k * EWE_STEP <= EWE_REACH; k++) for (const way of [1, -1]) { const d = d0 + way * k * EWE_STEP, lat = mea(d) + sd * (hwN(d) + 1.2); if (lat * sd > 0 && ok(d, lat) && !stagNearB(P2.x, P2.z, 2.6 + s)) return { d, lat, how: 1, by: way * k * EWE_STEP }; }
      for (let k = 1; ; k++) { const lat = lat0 + sd * k * 0.05; if (ok(d0, lat) || k === 400) return { d: d0, lat, how: 2, by: k * 0.05 }; } };
    const eweList = [], headI = Math.round(D_STELL / PL * NS);
    const eweOK = (x, z) => { if (Math.hypot(x - rowanOld.x, z - rowanOld.z) < 5.5) return false; const ds = Math.hypot(x - stell.x, z - stell.z); if (ds < 7.4 && ds > 4.6) return false; for (const e of eweList) if (Math.hypot(x - e.x0, z - e.z0) < 1.8) return false; return true; };
    // (edge: 0 or 1 for the two water's-edge ewes, who may be stood at a new place: st, null where the dealt one holds; sh: the
    // index addShadow gives her shadow, kept for the last pass of round 17)
    const addEwe = (x, z, yaw, k = 1, R = rng, list = eweList, edge = -1) => { if (R === rng && !eweOK(x, z)) return; const s = R.range(0.92, 1.1) * k, tv = R.range(0.9, 1.06); if (Math.hypot(x - rowanAt.x, z - rowanAt.z) < 4.2) return;
      const x0 = x, z0 = z, st = edge < 0 ? null : eweStand(edge, s); if (st) { beside(st.d, st.lat, P2); x = P2.x; z = P2.z; yaw = eweYaw(edge, st.d); }
      const y = H(x, z); list.push({ x, y: y - 0.03, z, sx: s, sy: s, sz: s, yaw, r: tv, g: tv, b: tv, x0, z0, st, sh: addShadow(x, y, z, 0.62 * s, 0.95 * s) }); };
    // one ewe down on the mossy toe of the right bank, broadside to us, 10 m ahead of the lens at u 0.50; four more on the lips of the banks
    { const d = eweSpots[0][0]; beside(d, eweSpots[0][1], P2); addEwe(P2.x, P2.z, eweYaw(0, d), 1.55, rng, eweList, 0); }
    for (const [dd, lat, turn] of [[9.5, -10.0, 2.5], [14.5, 10.2, -2.4], [21, -10.6, 1.2], [-16, 10.0, 2.0]]) { const d = U_EAGLE * PL + dd, j = clamp(Math.round(d / PL * NS), 0, NS); beside(d, lat, P2); addEwe(P2.x, P2.z, Math.atan2(stx[j], stz[j]) + turn, 1.32); }
    for (let i = 0; i < 6; i++) { const a = rng.range(0, 6.2832), r = i < 2 ? rng.range(1, 3.6) : rng.range(7.9, 11); addEwe(stell.x + Math.cos(a) * r, stell.z + Math.sin(a) * r, rng.range(0, 6.28)); }
    for (let i = 0, n = Math.round(30 * dens) - 6, tries = 0; i < n && tries < 300; tries++) { const d = i === 0 ? D_STELL + 12 : rng.range(D_BURN + 10, D_FOOT - 12), lat = i === 0 ? 10.4 : (rng.chance(0.5) ? 1 : -1) * (10.0 + 11 * Math.pow(rng(), 2));
      beside(d, lat, P2); const j = clamp(Math.round(d / PL * NS), 0, NS), before = eweList.length; addEwe(P2.x, P2.z, Math.atan2(stx[j], stz[j]) + (rng.chance(0.5) ? 1.5708 : -1.5708) + rng.range(-0.7, 0.7)); if (eweList.length > before) i++; }
    await ctx.yield();
    // this round's ewes: a second at the water's edge (left bank, ahead of the lens at u 0.52), and six in the sun on the lee side of the dyke
    const eweNew = [], eweWall = [], RE = nx.fork('ewes');
    { const d = eweSpots[1][0]; beside(d, eweSpots[1][1], P2); addEwe(P2.x, P2.z, eweYaw(1, d), 1.5, RE, eweNew, 1); }
    for (const [s, off, turn] of [[47, 1.7, 1.45], [43.2, 2.9, -1.7], [50.6, 3.5, 1.2], [56.2, 2.3, -1.4], [39.5, 4.6, 2.2], [60.5, 4.2, 1.75]]) { const x = WALL.x0 + WALL.dx * s - WALL.dz * off, z = WALL.z0 + WALL.dz * s + WALL.dx * off; addEwe(x, z, turn + RE.range(-0.25, 0.25), 1.45, RE, eweWall); }
    // and five on the open heath under the lens as it comes in
    for (const [x, z, turn] of [[-4.5, -13.5, 2.0], [2.5, -17, -1.2], [6.5, -21.5, 0.9], [-1.5, -23.5, 2.6], [-8.5, -20, 1.4]]) addEwe(x, z, turn + RE.range(-0.3, 0.3), 1.45, RE, eweWall);
    // ROUND 17, THE EWES' LAST PASS: A MOVED WATER'S-EDGE EWE WITHIN EWE_APART m OF ANOTHER EWE WALKS ON TO A PLACE EWE_APART m AND MORE
    // FROM EVERY OTHER EWE WHERE ONE IS WITHIN REACH; WHERE NONE IS SHE IS LEFT AND COUNTED. BY PLACE. Every ewe of the
    // world is dealt by now (eweList, eweNew, eweWall; the wall's and the heath's ewes are dealt above, before the patch block, for
    // this). For each of the two water's-edge ewes that eweStand moved (st not null), in the order they were dealt: where no other
    // ewe, as each now stands, is within EWE_APART m of her in plan (eweOK's own 1.8 m), nothing of hers is touched. Else she walks
    // on along the burn from the place she stands (st.d), EWE_STEP m of the land's line at a time, to the nearest place within
    // EWE_REACH m of the place she stands (downstream first where two are as near) at which she is, as in eweStand's walk along
    // the burn, 1.2 m outside the burn's edge, on her own bank and her own side of our line, clear by eweClear and not within
    // 2.6 + s m of the burn stag's slab, and at which no other ewe is within EWE_APART m either. There her place, her height, her
    // turn (eweYaw), st.d (the patch block below reads it, with her place) and st.lat (kept beside it; nothing reads it after her
    // deal) are set, and her shadow (setShadow at sh, the index kept at the deal) where sh is under SHN; her size and tint are as
    // dealt; nothing is drawn from any stream. Where there is no such place she is left
    // where eweStand put her, counted in scene.userData.ewePass.left and named by a console.warn; ewePass.on counts the ewes who
    // walked on. (A ewe who stepped up her bank stands at her dealt d, where eweStand's walk found no place within EWE_REACH m:
    // where another ewe is within EWE_APART m of her this walk tests the same places and finds none, so she is left and counted;
    // where none is she is untouched and not counted, as any other.)
    const EWE_APART = 1.8, ewePass = scene.userData.ewePass = { on: 0, left: 0 };
    [eweList[0], eweNew[0]].forEach((e, k) => { if (!e || !e.st) return; const s = e.sx, sd = k === 0 ? 1 : -1, d1 = e.st.d;
      const near = (x, z) => { for (const l of [eweList, eweNew, eweWall]) for (const o of l) if (o !== e && Math.hypot(x - o.x, z - o.z) < EWE_APART) return true; return false; };
      if (!near(e.x, e.z)) return;
      for (let n = 1; n * EWE_STEP <= EWE_REACH; n++) for (const way of [1, -1]) { const d = d1 + way * n * EWE_STEP, lat = mea(d) + sd * (hwN(d) + 1.2); if (!(lat * sd > 0)) continue; beside(d, lat, P2);
        if (near(P2.x, P2.z) || !eweClear(P2.x, P2.z, eweYaw(k, d), s) || stagNearB(P2.x, P2.z, 2.6 + s)) continue;
        const y = H(P2.x, P2.z); e.x = P2.x; e.y = y - 0.03; e.z = P2.z; e.yaw = eweYaw(k, d); e.st.d = d; e.st.lat = lat; if (e.sh < SHN) setShadow(e.sh, e.x, y, e.z, 0.62 * s, 0.95 * s); ewePass.on++; return; }
      ewePass.left++; console.warn(`carded-moor, seed ${ctx.seed}: the water's-edge ewe ${k} stands within ${EWE_APART} m of another ewe and finds no place clear of the line and of the others within ${EWE_REACH} m along the burn; she is left where she stands`); });
    // (round 14) where a water's-edge ewe now stands at a new place, the toe slope's moss cushions, deer-grass and the added rushes
    // (rushMore) within her patch there (eweNear's own measure, about her new spot) are taken away, as none were laid at her dealt
    // one; the rushes of rushList (the burn's edge and the clumps up the toe of each bank) stay, as they do at her dealt spot. Her
    // dealt patch stays bare.
    for (const e of [eweList[0], eweNew[0]]) { if (!e || !e.st) continue; const j = clamp(Math.round(e.st.d / PL * NS), 0, NS), tx = stx[j], tz = stz[j];
      const inPatch = (o) => { const dx = o.x - e.x, dz = o.z - e.z; return Math.abs(dx * tx + dz * tz) < 1.9 && Math.abs(dz * tx - dx * tz) < 1.7; }, gone = (im, i) => { im.setMatrixAt(i, m4.makeScale(0.001, 0.001, 0.001).setPosition(0, -900, 0)); im.instanceMatrix.needsUpdate = true; };
      for (let si = clamp(Math.floor((e.st.d - 4) / SEGL), 0, NSEG - 1), sl = clamp(Math.floor((e.st.d + 4) / SEGL), 0, NSEG - 1); si <= sl; si++) { const sg = cSeg[si]; sg.toe.forEach((o, i) => { if (inPatch(o)) for (const im of [sg.toeM, sg.toeL, sg.toeS, sg.toeF]) gone(im, i); }); }
      tuftC.forEach((o, i) => { if (inPatch(o)) gone(tuftMeshC, i); }); rushMore.forEach((o, i) => { if (inPatch(o)) gone(rushMesh, rushList.length + i); }); }
    const eweGraze = grazeMat(1.05, 7, 'N = normalize(N + uSunDir * .62); base *= 1.06;'), eweMesh = instanced(eweGeo, eweGraze, eweList.concat(eweNew), 'ewes'), eweMeshW = instanced(eweGeo, eweGraze, eweWall, 'ewes');
    const wallLook = new THREE.Vector3(WALL.x0 + WALL.dx * 50 - WALL.dz * 3, 0, WALL.z0 + WALL.dz * 50 + WALL.dx * 3); wallLook.y = H(wallLook.x, wallLook.z) + 0.8;
    await ctx.yield();
    const foxGeo = (() => { const g = new Geo(), c = cRusset.clone().lerp(C('#c8621f'), 0.55).multiplyScalar(lookId === 'gold' ? 0.64 : 0.84), cw = cWhite.clone().multiplyScalar(0.8), ck = C('#17130f');
      const torso = g.tube([[0, 0.12, -0.17], [0, 0.3, -0.07], [0, 0.46, 0.05], [0, 0.57, 0.12]], [0.15, 0.145, 0.115, 0.08], 9, c, c);
      g.paint(torso, (x, y, z, col) => { const fr = z - (-0.17 + (y - 0.12) * 0.62); if (fr > 0.04 && y > 0.2) col.lerp(cw, clamp((fr - 0.04) * 14, 0, 0.9)); });
      for (const s of [-1, 1]) { g.blob(s * 0.115, 0.13, -0.1, 0.085, 0.125, 0.17, c, c, 6, 4); g.tube([[s * 0.065, 0.42, 0.11], [s * 0.065, 0.2, 0.16], [s * 0.065, 0.0, 0.17], [s * 0.065, 0.0, 0.22]], [0.046, 0.034, 0.03, 0.02], 5, c, ck); }
      const n0 = g.n;
      g.blob(0, 0.665, 0.17, 0.088, 0.082, 0.1, c, cw, 8, 4);
      g.tube([[0, 0.655, 0.22], [0, 0.625, 0.33], [0, 0.615, 0.375]], [0.056, 0.03, 0.012], 6, c, ck);
      for (const s of [-1, 1]) g.tube([[s * 0.05, 0.72, 0.14], [s * 0.062, 0.79, 0.135], [s * 0.068, 0.845, 0.13]], [0.036, 0.026, 0], 4, c, ck, { flatten: 0.45 });
      for (let i = n0; i < g.n; i++) { g.a[i * 4] = 1; g.pv[i * 3] = 0; g.pv[i * 3 + 1] = 0.57; g.pv[i * 3 + 2] = 0.12; }
      const brush = g.tube([[0, 0.1, -0.27], [0.17, 0.085, -0.31], [0.31, 0.085, -0.18], [0.35, 0.08, 0.02], [0.29, 0.075, 0.17]], [0.06, 0.095, 0.105, 0.085, 0.02], 7, c, cw);
      g.anim(brush, (x, y, z) => [0, 0, clamp((z + 0.27) / 0.44, 0, 1), 0]);
      return g.build(); })();
    await ctx.yield();
    const foxMat = grazeMat(0, 12), fox = new THREE.Mesh(foxGeo, foxMat); fox.name = 'fox'; fox.frustumCulled = false; fox.scale.setScalar(2.35);
    const foxPos = foxRock ? new THREE.Vector3(foxRock.x, foxRock.y + foxRock.ry * 0.93, foxRock.z) : new THREE.Vector3(0, -900, 0);
    { const j = clamp(Math.round(D_FOX / PL * NS) - 10, 0, NS); fox.position.copy(foxPos); fox.rotation.y = Math.atan2(sx[j] - foxPos.x, sz[j] - foxPos.z) + 0.5; scene.add(fox); }
    const foxLook = foxPos.clone().setY(foxPos.y + 1.0);
    shadowMesh.count = Math.min(shN, SHN); shadowMesh.instanceMatrix.needsUpdate = true;
    await ctx.yield();

    // ---------------------------------------------------------------- bracken on the ramp: beds of arching fronds where the heather gives way
    const brackenSeg = [];       // three stretches, each drawn only while it is ahead
    { const RB = nx.fork('bracken'), fb = new Buf({ position: 3, aUV: 4 }), lists = [[], [], []], Q = { x: 0, z: 0 }, bSpan = (DA0 - 15 - DF0) / 3; let nB = 0;
      for (let f = 0; f < 4; f++) { const yaw = f * 1.571 + 0.4 + 0.35 * Math.sin(f * 2.3), cy = Math.cos(yaw), sy2 = Math.sin(yaw), len = 1 - 0.12 * (f % 2), base = fb.n;
        for (let k = 0; k <= 4; k++) { const t = k / 4, r = 0.08 + len * Math.pow(t, 1.25), y = 0.78 * Math.sin(Math.min(t * 2.05, 2.5)) * (0.9 + 0.1 * (f % 3));
          for (const sd of [-1, 1]) fb.push({ position: [cy * r - sy2 * sd * 0.3, y, sy2 * r + cy * sd * 0.3], aUV: [sd, t, f, 0] }); }
        for (let k = 0; k < 4; k++) { const a = base + k * 2; fb.idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
      for (let i = 0, n = Math.round(2600 * detail); i < n && nB < 660 * detail; i++) { const d = RB.range(DF0 + 3, DA0 - 12), lat = (RB.chance(0.5) ? 1 : -1) * RB.range(2.6, 46), sc = RB.range(0.8, 1.35), yaw = RB.range(0, 6.28), tv = RB.range(0.78, 1.15), pick = RB();
        beside(d, lat, Q); const h = H(Q.x, Q.z), bk = brackenAt(Q.x, Q.z); if (pick > bk * 1.15 - 0.2) continue;
        lists[clamp(Math.floor((d - DF0 - 3) / bSpan), 0, 2)].push({ x: Q.x, y: h - 0.05, z: Q.z, sx: sc, sy: sc * RB.range(0.85, 1.2), sz: sc, yaw, r: tv, g: tv * RB.range(0.92, 1.06), b: tv * RB.range(0.85, 1.1) }); nB++;
        if ((i & 255) === 255) await ctx.yield(); }
      const brMat = feltMat({ side: THREE.DoubleSide, uniforms: { uBrack: QU.uBrack, uRib: { value: C('#5a4a26') } },
        vertexShader: VERT_PARS + /* glsl */`attribute vec4 aUV; varying vec3 vQ;
          void main(){ mat4 im = modelMatrix * instanceMatrix; float t = aUV.y, hgt = length(im[1].xyz); vec4 wp = im * vec4(position, 1.);
            float sd = im[3].x * 1.3 + im[3].z * 2.1 + aUV.z, g = nap(wp.xyz) * .5 + .5, bend = (.1 + .26 * g) * uWindK * t * t * hgt;
            wp.x += bend + sin(uTime * 3.1 + sd + t * 2.) * .035 * t * hgt; wp.y += sin(uTime * 4.3 + sd * 1.7) * .03 * t * t * hgt - bend * .25;
            vQ = vec3(aUV.x, t, aUV.z); vCol = instanceColor; vObj = wp.xyz; vWorld = wp.xyz; vNrm = normalize(mat3(im) * vec3(position.x * .35, 1., position.z * .35));
            ${VN_END} }`,
        // a frond is a card: its outline is cut here (a long triangle of paired pinnae, a midrib)
        fragmentShader: FRAG_PARS + H2 + /* glsl */`uniform vec3 uBrack, uRib; varying vec3 vQ;
          void main(){ float t = vQ.y, ax = abs(vQ.x), env = (1.02 - t) * smoothstep(.04, .3, t) * 1.15, pf = fract(t * 10. + vQ.z * .37), tooth = 1. - abs(pf - .5) * 1.5;
            float fw = abs(dFdx(t)) + abs(dFdy(t)), kd = 1. - smoothstep(.03, .12, fw);
            if (ax > max(env * mix(.72, .25 + .75 * tooth, kd), .05)) discard;
            vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)), N = normalize(vNrm + vec3(0., 1e-5, 0.));
            vec3 base = uBrack * vCol * (.72 + .5 * t) * (.86 + .28 * vn2(vec2(t * 23. + vQ.z * 5., vQ.x * 4.)));
            base = mix(base, uRib, (1. - smoothstep(.03, .09, ax)) * .7);
            gl_FragColor = vec4(atmos(felt(base, N, V, vWorld * 4., vWorld, 1.2, .62 + .38 * t, 1.)), 1.); }` });
      const bGeo = fb.build(false); for (let s = 0; s < 3; s++) brackenSeg.push({ mesh: instanced(bGeo, brMat, lists[s], 'bracken'), d0: DF0 + 3 + s * bSpan, d1: DF0 + 3 + (s + 1) * bSpan }); }
    await ctx.yield();

    // ---------------------------------------------------------------- mist lying in the hollows: thin teased sheets a little over the ground
    if (LK.sheets > 0) { const RM = nx.fork('mist'), mb = new Buf({ position: 3, aUV: 4 }), NQ = 8;
      const sheet = (cx, cz, rx, rz, yaw, level, lift, k) => { const base = mb.n, c = Math.cos(yaw), s = Math.sin(yaw), sd = RM.range(0, 50);
        for (let j = 0; j <= NQ; j++) for (let i = 0; i <= NQ; i++) { const a = i / NQ * 2 - 1, b = j / NQ * 2 - 1, x = cx + a * c * rx - b * s * rz, z = cz + a * s * rx + b * c * rz, g = H(x, z);
          mb.push({ position: [x, Math.max(level, g + 0.6), z], aUV: [a, b, sd, k * clamp((level - g) / lift, 0, 1)] }); }
        for (let j = 0; j < NQ; j++) for (let i = 0; i < NQ; i++) { const a = base + j * (NQ + 1) + i, b = a + 1, c2 = a + NQ + 1, d = c2 + 1; mb.idx.push(a, c2, b, b, c2, d); } };
      // over the bog
      for (let i = 0; i < 5; i++) { const a = RM.range(0, 6.2832), rr = Math.sqrt(RM()) * (BOG.r - 30), lift = RM.range(1.5, 2.3); sheet(BOG.x + Math.cos(a) * rr * BOG.rx, BOG.z + Math.sin(a) * rr, RM.range(55, 95), RM.range(30, 50), RM.range(-0.4, 0.4), lift - 0.1, lift, 1); }
      await ctx.yield();
      // in the low ground of the far moor, wherever the land around stands higher
      for (let i = 0, n = 0; i < 60 && n < 7; i++) { if (i % 8 === 7) await ctx.yield(); const x = RM.range(-520, 620), z = RM.range(-1250, -140), r = RM.range(70, 140), lift = RM.range(2.5, 4.5), g = H(x, z); if (HI.d < 70 || Math.hypot(x - HX, z - HZ) < 240) continue;
        let lo = 0; for (let q = 0; q < 4; q++) if (H(x + Math.cos(q * 1.571 + 0.5) * r, z + Math.sin(q * 1.571 + 0.5) * r) > g + 2.5) lo++;
        if (lo < 3) continue; sheet(x, z, r * 1.25, r * 0.8, RM.range(-0.5, 0.5), g + lift, lift, 0.9); n++; }
      await ctx.yield();
      // and round the foot of the Snag's hill, on the side the journey sees
      for (let i = 0; i < 3; i++) { const a = Math.atan2(Az, Ax) + (i - 1) * 0.85 + RM.range(-0.2, 0.2), rr = RM.range(255, 310), x = HX + Math.cos(a) * rr, z = HZ + Math.sin(a) * rr, g = H(x, z); if (HI.d < 45) continue; sheet(x, z, RM.range(90, 130), RM.range(45, 60), a + 1.571, g + 3.2, 3.2, 0.5); }
      const mistSh = new THREE.Mesh(mb.build(false), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uTime: SH.uTime, uCol: { value: mistCol.clone().lerp(L.sunColor.clone().multiplyScalar(1 / Math.max(L.sunColor.r, 1e-3)), 0.35).multiplyScalar(night ? 0.55 : 1.02) }, uK: { value: 0.5 * LK.sheets } },
        vertexShader: /* glsl */`attribute vec4 aUV; varying vec4 vUV; varying vec3 vW; void main(){ vUV = aUV; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform float uTime, uK; uniform vec3 uCol; varying vec4 vUV; varying vec3 vW;` + H2 + /* glsl */`
          void main(){ vec2 p = vW.xz - vec2(uTime * 1.6, uTime * .3); float n = vn2(vec2(p.x * .018 + vUV.z, p.y * .05)) * .6 + vn2(vec2(p.x * .05, p.y * .13 + vUV.z)) * .4;
            float dist = distance(cameraPosition, vW), r2 = dot(vUV.xy, vUV.xy);
            float a = vUV.w * (1. - smoothstep(.35, 1., r2)) * smoothstep(.22, .72, n) * smoothstep(10., 48., dist) * (1. - smoothstep(1100., 2000., dist)) * uK;
            gl_FragColor = vec4(uCol, a); }` }));
      mistSh.frustumCulled = false; mistSh.renderOrder = 3; mistSh.name = 'mist-sheets'; scene.add(mistSh); }
    await ctx.yield();

    // ---------------------------------------------------------------- a passing shower: hanging skeins of grey roving (the rut look)
    if (LK.weather === 'shower') { const b = new Buf({ position: 3, aUV: 3 });
      for (let i = 0; i < 6; i++) { const cx = rng.range(-500, 600), cz = rng.range(-1250, -250), w = rng.range(90, 170) * 2.6, top = rng.range(190, 260) + 50, hgt = top - rng.range(20, 60), base = b.n, sd = rng.range(0, 50);
        if (Math.hypot(cx - HX, cz - HZ) < 260 || Math.abs(cx - 60) < 140) { i--; continue; }
        for (const [qx, qy] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) b.push({ position: [cx + qx * w * 0.5, top - (1 - qy) * hgt, cz + qx * w * 0.12], aUV: [qx, qy, sd] }); b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3); }
      const skeins = new THREE.Mesh(b.build(false), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: SH.uTime, uCol: { value: C('#7d7a90') } },
        vertexShader: /* glsl */`attribute vec3 aUV; uniform float uTime; varying vec3 vUV; void main(){ vUV = aUV; vec3 p = position; p.x += (1. - aUV.y) * 40. + mod(uTime * 2., 200.) - 100.; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uCol; varying vec3 vUV;` + H2 + /* glsl */`
          void main(){ float st = vn2(vec2(vUV.x * 1.5 + vUV.z, vUV.y * .9 + uTime * .1)) * .6 + vn2(vec2(vUV.x * 4. + vUV.z * 3., vUV.y * 1.7 + uTime * .16)) * .4;
            float ex = 1. - vUV.x * vUV.x, veil = smoothstep(.2, .8, st) * ex * ex * smoothstep(0., .55, vUV.y) * (1. - smoothstep(.62, .86, vUV.y)) * .42;
            // the grey felt pad the rain hangs from
            vec2 e = vec2(vUV.x, (vUV.y - .87) / .13); float cap = (1. - smoothstep(.35, 1., dot(e, e) + (vn2(vUV.xy * vec2(3., 9.) + vUV.z) - .5) * .5)) * .8;
            gl_FragColor = vec4(mix(uCol, uCol * 1.22 + .04, cap * smoothstep(.84, .95, vUV.y)), max(veil, cap)); }` }));
      skeins.frustumCulled = false; skeins.renderOrder = 2; skeins.name = 'skeins'; scene.add(skeins); }

    // ---------------------------------------------------------------- runtime
    const camP = new THREE.Vector3(), tA = new THREE.Vector3(), tB = new THREE.Vector3(), pA = new THREE.Vector3(), pB = new THREE.Vector3();
    const seatR = new THREE.Vector3(HX - Rx * 15 + Ax * 17, HY + 62, HZ - Rz * 15 + Az * 17), rvC = new THREE.Vector3();      // (round the west thorn, which stands in the open)
    const bellU = (x, a, b, w) => smoothstep(a, a + w, x) * (1 - smoothstep(b - w, b, x));
    let lastU = -1, tau = 0;
    const heroGlowAt = new THREE.Vector3(HX, HY + 96, HZ), heroGlowK = Math.min(0.8, LK.glow[1] * 1.5);
    // The covey is not a fixed ornament in the middle of the frame. Keyed to u: [u, metres further ahead, drift to the right,
    // spread, shown]. It bursts round the lens and the lead bird is near and large over the first heather; it draws far ahead
    // over the bog and drops into the heather; it flushes again from the head of the burn and whirrs away down it; a third time
    // from the tarn it climbs the ramp beside us; it swings wide and is gone before the stags, and the ravens have the crest.
    // On the eagle's visit it stays close down the burn so the stoop has birds to scatter.
    const CK = [[0, 4.6, 1.2, 0.5, 1], [0.05, 4.6, 1.2, 0.5, 1], [0.085, 7, 2.0, 0.9, 1], [0.13, 20, -5, 1.4, 1], [0.19, 34, -8, 1.6, 1], [0.25, 52, -12, 1.8, 1], [0.31, 66, -10, 1.8, 0.6], [0.345, 74, -8, 1.8, 0],
      [0.395, 12, 0, 0.6, 0], [0.415, 10, 0, 0.55, 1], [0.44, 17, 0, 0.6, 1],
      ...(rare ? [[0.475, 12, 0, 0.6, 1], [0.5, 5, 0, 0.7, 1], [0.6, 4, 0, 0.8, 1], [0.63, 8, -3, 1, 1]] : [[0.475, 30, 0, 0.6, 1], [0.5, 44, 0, 0.6, 0.4], [0.515, 50, 0, 0.6, 0], [0.575, 14, -3, 0.8, 0], [0.595, 12, -4, 0.9, 1], [0.63, 11, -4, 1, 1]]),
      [0.68, 15, -1.5, 1, 1], [0.72, 14, -1.5, 1, 1], [0.765, 10, -6, 1.2, 1], [0.8, 24, -12, 1.5, 1], [0.83, 40, -18, 1.8, 0.5], [0.85, 48, -20, 1.8, 0], [1.01, 48, -20, 1.8, 0]];
    const ckv = [0, 0, 0, 0], coveyAt = (u) => { let i = 1; while (i < CK.length - 1 && CK[i][0] < u) i++; const a = CK[i - 1], b = CK[i], t = smoothstep(a[0], b[0], u); for (let k = 0; k < 4; k++) ckv[k] = lerp(a[k + 1], b[k + 1], t); return ckv; };
    const flockY = (x, z, y, clear) => Math.max(y, H(x, z) + clear);
    const update = (dt, time, camera, u) => {
      SH.uTime.value = time;
      camP.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(camP);
      // a clock that keeps scripted animals moving when the camera is held still (never while only seen through a portal)
      const du = u - lastU; if (lastU < 0 || Math.abs(du) > 0.02 || u <= 0) tau = 0; else { const sp = Math.abs(du) * PL / Math.max(dt, 1e-3); tau = sp < 6 ? tau + dt * (1 - sp / 6) : Math.max(0, tau - dt * 0.5); } lastU = u;
      // mist seen from inside: the sky, and the fog the hero's own materials use
      // (down in the burn's gully the pooled mist is thinned, so the far end of the valley is land and not a white wall)
      const mk = LK.mist, mkD = mk[1] * (LK.weather === 'fog' ? 1 : 1 - 0.7 * bellU(u, U_BURN - 0.04, U_FOOT + 0.07, 0.05)); SH.uMist.value.y = mkD;
      const camMist = mkD * (Math.max(0, mk[0] - camP.y) + Math.min(1, Math.exp(-mk[2] * (camP.y - mk[0]))) / mk[2]);
      skyU.uSkyMist.value = camMist;
      { const g = skyU.uHeroG.value, dx = heroGlowAt.x - camP.x, dy = heroGlowAt.y - camP.y, dz = heroGlowAt.z - camP.z, dl = Math.hypot(dx, dy, dz) || 1; g.set(dx / dl, dy / dl, dz / dl, heroGlowK * smoothstep(330, 620, dl)); }
      const dH = Math.max(1, camP.distanceTo(heroCentre)), tauH = Math.min(camMist / Math.max(0.06, (heroCentre.y - camP.y) / dH), mkD * dH);
      scene.fog.density = Math.sqrt(LK.fogDen * LK.fogDen * dH * dH + tauH) / dH;
      hero.update(dt, time, camera);
      beaconU.uK.value = smoothstep(120, 260, camP.distanceTo(beaconU.uAt.value)) * 0.85;
      const D = u * PL, DF = u * PLF;
      cushLOD(D); cottonMesh.visible = D > D_BOG - 150 && D < D_BURN + 16;
      // what is far behind or far ahead is not drawn (same materials either way, so nothing is compiled by this)
      const burnNear = D > D_BURN - 110 && D < D_FOOT + 60; rocksB.visible = burnNear && D < D_BMID + 70; rocksS.visible = D > D_STELL - 112 && D < D_STELL + 26; rocksB2.visible = D > D_BMID - 105 && D < D_FOOT + 60; rocksD.visible = D > D_FOOT - 80; rocksE.visible = D > D_FOOT - 20; rocksC.visible = D > D_BURN - 30; eweMesh.visible = D > D_BURN - 150 && D < D_FOOT + 90; banks.visible = rushMesh.visible = tuftMeshC.visible = burnNear;
      tuftMeshA.visible = D < D_BURN + 70; tuftMeshB.visible = D > D_BURN - 40;

      // the covey
      const b0 = smoothstep(0, 0.045, u), peel = smoothstep(0.865, 0.935, u), scat = rare ? bellU(u, U_EAGLE - 0.035, U_EAGLE + 0.07, 0.03) : 0;
      const foxW = bellU(u, U_FOX - 0.075, U_FOX + 0.03, 0.025), stagW = bellU(u, U_STAG - 0.085, U_STAG + 0.03, 0.025), hareW = hares ? bellU(u, U_HARE - 0.015, U_HARE + 0.14, 0.02) : 0;
      const ck = coveyAt(u), ckA = ck[0], ckB = ck[1], ckS = ck[2], ckV = ck[3], farK = smoothstep(8, 30, ckA), leadIn = bellU(u, 0.004, 0.055, 0.014);
      for (let i = 0; i < NCOVEY; i++) { const B = coveyB[i], cyc = (time / 3.2 + B.sd * 5) % 1;
        let amp = Math.max(smoothstep(0, 0.06, cyc) * (1 - smoothstep(0.4, 0.5, cyc)), 1 - smoothstep(0.03, 0.09, u), scat, 0.85 * farK, 1 - ckV);
        let ahead = B.ahead + ckA * (1 + 0.25 * (B.sd - 0.5)) + 0.5 * Math.sin(time * 0.7 + B.ph) - (i === 0 ? 0.9 * leadIn : 0), side = B.side * ckS * (1 + 1.7 * peel + 2.4 * scat) + ckB + 0.3 * Math.sin(time * 0.9 + B.ph * 2) - (i === 0 ? 3.4 * peel + 2.6 * scat : 0),
          up = B.up + 0.14 * Math.sin(time * 1.3 + B.ph) - 0.2 * (1 - amp) - 0.45 * scat + 0.9 * (1 - b0) * B.keep + 0.5 * farK * B.sd - 1.6 * (1 - ckV), sc = ckV;
        side = lerp(side, -Math.abs(B.side) * 0.7 - 1.0 - (i === 0 ? 0.8 : 0), foxW); side = lerp(side, -Math.abs(B.side) * 0.8 - 1.4 - (i === 0 ? 1.0 : 0), stagW); up -= 0.35 * Math.max(foxW, stagW); if (i > 0 && B.side > 0) up = lerp(up, 0.8 + 0.5 * B.sd, hareW);
        if (!B.keep && b0 < 1) { const tb = (time / 4 + B.sd) % 1, bs = smoothstep(0, 0.1, tb) * (1 - smoothstep(0.8, 1, tb));
          ahead = lerp(B.burstA + 3 + 22 * tb, ahead, b0); side = lerp(B.burstS * (1 + tb), side, b0); up = lerp(-1.3 + 3.4 * smoothstep(0, 0.4, tb), up, b0); sc = lerp(bs, sc, b0); amp = lerp(1, amp, b0); }
        if (u < 0.09) { const lim = 0.36 * ahead, kl = 1 - smoothstep(0.06, 0.09, u); side = lerp(side, clamp(side, -lim, lim), kl); }      // (over the first brow no bird flies at the frame's edge)
        flyPath.posAtDist(DF + ahead, pA); flyPath.tangentAtDist(DF + ahead, tA); flyPath.tangentAtDist(DF + ahead + 7, tB);
        const hl = Math.hypot(tA.x, tA.z) || 1, rx = -tA.z / hl, rz = tA.x / hl, x = pA.x + rx * side, z = pA.z + rz * side, y = u < U_AIR ? flockY(x, z, pA.y + up, 0.5) : pA.y + up;
        covey.set(i, x, y, z, tA.x - 0.13, tA.y + 0.21 + (1 - b0) * 0.2, tA.z, clamp((tA.x * tB.z - tA.z * tB.x) * 3.5, -0.6, 0.6) + 0.12 * Math.sin(time * 1.1 + B.ph), sc * 1.5, time * 44 + B.ph, amp, -0.42 * (1 - amp)); }
      covey.done();
      // far coveys whirring low over the quilt
      // (round 14) over our line the covey rises: the build's three numbers a covey (r0, r1, rise), eased in and out over FAR_EASE m
      // of the run (cut short where the run itself ends sooner); climb is the rise's own slope along the run, which tilts each body by
      // that slope (the ground's own slope under the bird does not tilt it, as before). A covey with no rise is as it was.
      for (let c = 0, k = 0; c < farC.length; c++) { const F = farC[c], tb = (time / F.T + F.ph) % 1, dist = (tb - 0.5) * 210, fade = smoothstep(0, 0.08, tb) * (1 - smoothstep(0.9, 1, tb)); let rise = 0, climb = 0;
        if (F.rise > 0) { const ta = clamp((dist - F.r0) / FAR_EASE + 1, 0, 1), tc = clamp((dist - F.r1) / FAR_EASE, 0, 1), ka = ta * ta * (3 - 2 * ta), kc = 1 - tc * tc * (3 - 2 * tc); rise = F.rise * ka * kc; climb = F.rise * 6 * (ta * (1 - ta) * kc - ka * tc * (1 - tc)) / FAR_EASE; }
        for (const b of F.birds) { const x = F.x + F.dx * (dist + b.a) - F.dz * b.s, z = F.z + F.dz * (dist + b.a) + F.dx * b.s, cyc = (time / 3 + b.ph) % 1;
          far.set(k++, x, H(x, z) + b.u + rise, z, F.dx, climb, F.dz, 0.1 * Math.sin(time + b.ph), 1.7 * fade, time * 44 + b.ph, cyc < 0.5 ? 1 : 0.1, cyc < 0.5 ? 0 : -0.22); } }
      far.done();
      // pipits flicking up (round 14: the hop and the heading as the build left them, two numbers each a bird; a turned bird's height
      // takes the build's lift over the ground of its turned hop, gl and gk; a bird left as dealt has none)
      for (let i = 0; i < NPIP; i++) { const B = pipB[i], tb = (time / B.T + B.ph) % 1, fl = Math.sin(tb * 31 + i) > -0.2 ? 1 : 0.1, sl = Math.max(0, 1 - tb * B.gk);
        pipits.set(i, B.x + B.hx * tb, (B.gl > 0 ? B.y + B.gl * (1 - sl * sl) : B.y) + 0.4 + B.h * Math.sin(Math.PI * tb) * (0.8 + 0.2 * Math.sin(tb * 31 + i)), B.z + B.hz * tb, B.fx, Math.cos(Math.PI * tb) * 0.7, B.fz, 0, smoothstep(0, 0.08, tb) * (1 - smoothstep(0.86, 1, tb)) * 1.3, time * 75 + i, fl, fl > 0.5 ? 0 : -0.5); }
      pipits.done();
      // ravens tumbling beside the thorns, or the eagle soaring over the tor
      const rvK = smoothstep(0.815, 0.85, u), rvOut = smoothstep(0.955, 0.995, u);
      for (let i = 0; i < BIG; i++) { const B = ravB[i];
        if (cast.eagle) { const a = time * 0.22 + B.ph; bigBirds.set(i, thornMid.x + Math.cos(a) * 30, thornMid.y + 34 + 3 * Math.sin(time * 0.3), thornMid.z + Math.sin(a) * 30, -Math.sin(a), 0, Math.cos(a), 0.45, 1.7, time * 2, 0.06, 0.14); }
        else { // they tumble beside the thorns; while the lens climbs the nose and crosses the crest they play on the wind ahead of it, left of the line
          if (i === 0) { const dR = Math.min(PLF, DF + 17); flyPath.posAtDist(dR, pB); flyPath.tangentAtDist(dR, tB); const hl = Math.hypot(tB.x, tB.z) || 1, lt = -9 - 30 * rvOut;
            rvC.set(lerp(seatR.x, pB.x - tB.z / hl * lt, rvK), lerp(seatR.y, pB.y + 2.6 + 12 * rvOut, rvK), lerp(seatR.z, pB.z + tB.x / hl * lt, rvK)); }
          const a = time * B.sp + B.ph, a2 = a + 0.05, r = B.r * 0.42, px = (q) => rvC.x + Rx * Math.cos(q) * r + Ax * Math.sin(q) * r * 1.6, pz = (q) => rvC.z + Rz * Math.cos(q) * r + Az * Math.sin(q) * r * 1.6, py = (q) => rvC.y + B.h * (1 - 0.4 * rvK) + 2.6 * Math.sin(q * 2 + B.sd * 6);
          const tum = smoothstep(0.7, 0.95, Math.sin(time * 0.8 + B.sd * 9));
          bigBirds.set(i, px(a), py(a), pz(a), px(a2) - px(a), py(a2) - py(a), pz(a2) - pz(a), 0.5 + tum * 2.6 * Math.sin(time * 3 + B.sd), 1 + 0.6 * rvK, time * 21 + B.ph, 0.75 * (1 - tum), tum * -0.5); } }
      bigBirds.done();
      if (hunter) {
        if (hunterKind === 'eagle') { const s = clamp((u - (U_EAGLE - 0.05)) / 0.1 + tau * 0.08, 0, 1.2), k = smoothstep(0, 0.5, s), o = Math.max(0, s - 0.5);
          // it stoops past us from above and behind onto the covey, flares 7 m ahead with its back and fanned tail to the lens, misses, and rows away up the gully
          const ahead = lerp(15, 7.2, k) + o * (8 + 36 * o), lat = lerp(-7, 0.15, k) + o * 8, hy = 0.75 + 19 * Math.pow(1 - k, 1.5) + o * (5 + 22 * o);
          flyPath.posAtDist(DF + ahead, pA); flyPath.tangentAtDist(DF + ahead, tA); const hl = Math.hypot(tA.x, tA.z) || 1, rx = -tA.z / hl, rz = tA.x / hl;
          const flare = smoothstep(0.3, 0.5, s) * (1 - 0.55 * smoothstep(0.62, 0.95, s)), drift = 0.5 * (1 - k) + 0.35 * o;
          const bank = -0.35 * (1 - k) + 0.3 * smoothstep(0.6, 0.9, s), beat = lerp(0.04, 0.36, smoothstep(0.4, 0.55, s)) + 0.25 * smoothstep(0.62, 0.8, s), vis = smoothstep(0, 0.08, s) * (1 - smoothstep(0.95, 1.15, s));
          hunter.set(0, pA.x + rx * lat, pA.y + hy, pA.z + rz * lat, tA.x / hl + rx * drift, lerp(-0.8, 1.15, flare), tA.z / hl + rz * drift, bank, vis * 1.9, time * 9, beat, lerp(-0.5, 0.16, smoothstep(0.3, 0.5, s))); }
        else { const P = (t, out) => { beside(D_BOG + 75 + 62 * Math.sin(t * 0.13), 12 + 8 * Math.sin(t * 0.31), out); return out; }, a = P(time, pA), b = P(time + 0.2, pB), gl = Math.sin(time * 0.9) > 0.3 ? 0.1 : 0.55;
          hunter.set(0, a.x, H(a.x, a.z) + 2.4 + 0.5 * Math.sin(time * 0.5), a.z, b.x - a.x, 0, b.z - a.z, 0.2 * Math.sin(time * 0.31), 1.25, time * 17, gl, 0.26); }
        hunter.done(); }
      // hares, hinds, their shadows; the fox's head follows us
      eweMesh.visible = D > D_BURN - 8 && D < D_FOOT + 45; eweMeshW.visible = dyke.visible = rocksW.visible = D < 280; for (let i = 0; i < 3; i++) { const b = brackenSeg[i]; b.mesh.visible = D > b.d0 - 120 && D < b.d1 + 10; } burnBed.visible = D > D_BURN - 220 && D < D_FOOT + 80;
      if (hares) { hares.mesh.visible = D > D_BOG - 60 && D < D_BURN + 40; hares.update((u - U_HARE) * DUR + tau); }
      hinds.mesh.visible = D < D_BURN + 8; hinds.update((u - U_HIND) * DUR + tau);
      shadowMesh.instanceMatrix.needsUpdate = true;
      if (foxRock) { let a = Math.atan2(camP.x - foxPos.x, camP.z - foxPos.z) - fox.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); foxMat.uniforms.uGraze.value.y = clamp(a, -1.5, 1.5); }
    };

    return {
      scene, path: flyPath, duration: DUR, title: LK.name,
      camera: { fov: 54, near: 0.2, far: 4500, lookAhead: 24, sway: 0.5, bank: 0.4 },
      pois: [
        { at: heroGaze, from: -0.05, to: 0.15, weight: 0.5, fade: 0.2 },      // the opening: the Snag on its hill, in the gap of the far hills
        { at: wallLook, from: 0.035, to: 0.125, weight: 0.3, fade: 0.3 },     // the ewes in the lee of the dyke
        { at: (t, u) => herdAt(u), from: 0.1, to: 0.415, weight: 0.76, fade: 0.2 },      // the hinds, from where they stand to the end of their run
        { at: heroGaze, from: 0.365, to: U_AIR + 0.035, weight: 0.5, fade: 0.2 },      // then the Snag, from the head of the burn to the lift-off
        { at: foxLook, from: U_FOX - 0.07, to: U_FOX + 0.018, weight: 0.4 },
        { at: stagWorld, from: U_STAG - 0.085, to: U_STAG + 0.012, weight: 0.42 },
        { at: browStags, from: 0.828, to: 0.888, weight: 0.36 },      // the two stags on the brow, on the skyline left of the line
        { at: crestLook, from: 0.815, to: 0.955, weight: 0.42 },      // up the nose the gaze settles on the thorns, a little under the line of the climb
      ],
      portal: { shape: 'circle', radius: 7, color: night ? '#dfe6ff' : '#fff1d8', glow: 0.8, revealDistance: 260, tilt: true },
      post: { exposure: LK.exposure, bloom: { strength: 0.22, radius: 0.6, threshold: 0.92 },
        grade: { saturation: LK.sat, contrast: 1.05, tint: lookId === 'gold' ? '#fff3e4' : night ? '#e6ecff' : '#ffffff', shadowTint: '#0d0a1e', vignette: 0.3, grain: 0.03, aberration: 0 } },
      // linger over the dyke and its ewes, beside the hinds and the hares, and on the ramp and the pull-up, where the Snag fills more of the sky with every second; a little quicker over the links
      pace: (u) => 1 - 0.08 * bellU(u, 0.03, 0.12, 0.03) - 0.1 * bellU(u, 0.15, 0.31, 0.04) + 0.08 * bellU(u, 0.33, 0.43, 0.04) - 0.1 * bellU(u, 0.46, 0.57, 0.035) - 0.16 * bellU(u, 0.6, 0.9, 0.05),
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); for (const d of disposables) d.dispose(); },
    };
  },
};
