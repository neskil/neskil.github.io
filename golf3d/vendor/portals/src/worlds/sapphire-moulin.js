// THE SAPPHIRE RACE (world "sapphire-moulin")
// Flat out down an electric-blue meltwater river sawn into the Greenland ice sheet, then over the lip
// and down a fluted moulin that darkens from aqua to ink. The camera rides an orange instrument drifter.
//
// World space == the hero's local space (hero.object sits at the origin, unrotated): the brink is at
// (0, -12, 0), the river flows toward -Z, right is +X. "s" everywhere is metres along the river
// centreline from the entry: lake 0..100, chute 100..160, five meanders 160..468, the hero's straight
// reach 468..581 (the lip), then the hero's arc and shaft axis down to the portal.
//
// MAP OF THIS FILE (in order)
//   1  constants, MOODS (sky, sun, fog, exposure, grade per seeded look), small GLSL
//   2  buildPlan()            the river centreline (curvature integrated; five bends that close on x = 0)
//   3  small factories        makeBag (merged vertex-coloured geometry), makePaint (drifter/camp shader),
//                             makeBurst (soft splash sprites), chunk geometry, terrain shader
//   4  build(ctx)
//      4a  seeded choices     mood (ctx.vary.hour or rng), season, livery, camp, rare event
//      4b  levels             waterY(s), rimY(s), halfW(s) (with THE CHAMBER: the canyon opens to half as wide again for
//                             30 m below bridge 3, round the biggest fall), lake shape, groundY()
//      4c  the route          makePath(...) from the centreline, then the world's own points over the lip: level
//                             over the hump of the brink, a 20 m arc that follows the falling water, a 68 m blend onto
//                             the shaft's axis, then THE FALL: straight down the axis to the portal seat (the part's
//                             moulinRoute gives the water, the axis and the seat before the hero exists)      <- PATH
//          hero               buildHero(...) with the mood's sun / sky colours and conduitDepth: the depth the route
//                             has reached at 34.5 s of its 40 (the brief: there the footwall steps away and the water
//                             peels off into the side conduit), and route: the centreline at every metre, which the
//                             hero's nine snow streamers keep 4.5 m from                     <- HERO PLACEMENT
//      4d  flight tables, pois   centreline metres of the camera along the path, where the staged things stand   <- POIS
//      4e  sky, fog, weather bank, nunataks                                         <- FOG set here
//      4f  ice sheet terrain  (own shader: sastrugi, rills, cryoconite, far lakes, crevasses, cloud shadows)
//      4g  melt lake          kit makeLake over the terrain bowl, on a grid built here in slices (depth and shore
//                             per vertex, as the kit would make them); the 'lake-slush' overlay on top draws foam lines,
//                             pancake slush with dark leads, and the wind ripple (facets and glints) within 25 m of the bow
//      4h  canyon             meander walls (hero.kit.buildCanyonWall), river ribbon (hero water shader),
//                             icicle fringes, spindrift ribbons, the blizzard's ground drift over the lake
//      4i  snow bridges: solid drifted snow on top, scalloped blue ice underneath, never see-through (bridgeGeo aIce);
//                             each carries hanging fringes of thin icicles (0.3 to 1.2 m, every root laid on the ice from the
//                             mesh's own section): along the upstream lip, along the edge of the opening, and a thinner one on
//                             the downstream lip, kept short over the lane and flagged -1 (hero: thin, pale, no frosted root);
//                             bridge 2 is THE GREAT ARCH with a second, slender arched rib beyond it; tributary falls (kit mist only: the
//                             kit's sheets and pool stay hidden; the foam apron is the river shader's: hero uPools / uPoolDir)
//      4j  chunks             rafts, floes (the first NEAR are small pancakes strung 4 to 8 m either side of the lane), the
//                             toppling slab, the bridge block, shaft companions, and THE GATE: two grounded bergs (five
//                             blocks) in the shallows either side of the outlet (CPU posed)
//      4k  bursts             splashes, the rare snow curtain, nose spray, the lip veil
//      4k' falls and sunbeam  'fall-strands' (each fall is three or four ROPES of opaque white water, every one a ribbon
//                             turned to the lens round its own ballistic centreline: they splay, two cross, they break into
//                             lengths and drops, each wandering off its line more the further it has fallen; the wall shows
//                             between them; one soft ribbon of blown mist per fall lies behind its ropes, aT.z = 10 + i),
//                             'fall-foot-i' (the boil: a looping burst of
//                             torn spray that buries each foot), 'fall-flecks-i' (beads thrown from the boil toward the lane),
//                             'sunbeam' (god-rays through the slot between the great arch and its rib: separate rays with
//                             lanes between, dissolving at the sides, under the slot and at the foot into sparkling motes;
//                             a shaft to an eye that stands off it by more than its own length, from two lengths the
//                             whole of it; to an eye within one length only its motes and air a little brighter)
//      4l  camp, flag line, gauging cable (a sagging catenary of dark rope with rime on top and orange / white pennants,
//                             slung between an A-frame of bamboo poles with a winch box and a back-stay on each rim; a drop
//                             line with two floats carries the sensor fish)
//      4m  the drifter rig    posed at the camera every frame
//      4n  air                snow / spindrift particles
//      4o  update()           SCRIPTED MOMENTS, all keyed to u through "sc" = centreline metres of the camera
//      4p  return             camera, portal, post (EXPOSURE, BLOOM, GRADE come from the mood)
//
// Uniforms that drive the scripted moments
//   hero.uniforms.uTime, uCamDepth (the hero sets it from the camera), uDrift (spindrift strength)
//   slabBurst / blockBurst / curtain .uniforms.uAge   seconds since the slab hit, the block burst, the bridge fell
//   spray.uniforms.uAlpha    nose spray (chute, slab wash, the lip)      veil.material.uniforms.uA  the lip veil
//   lipSpray.uniforms.uAlpha spray bursting off the brink around the nose (rig space); brinkSpray: torn spray standing
//                            on the brink in world space, rising only as the drifter closes on it; edgeSpray: the same
//                            torn strands standing further over, where the brink's curve has turned half way to the
//                            shaft's slope (one place in the world, set at build)
//   rig sink                 in the shaft the rig drops by up to 0.35 m when the ring lies below the gaze (the steady
//                            camera), so the hull never crowds the ring (update(): "sink")
//   uPull (paintRig, wakeU, spray, lipSpray)   0..0.5 through the brink: the drifter, its bow wave and its spray are drawn
//                            in front of the water (their depth is squeezed toward the lens), so the hull keeps its place
//                            in the bottom sixth of the frame while the gaze tips into the shaft, and is never cut by the
//                            surface, with either camera (update(): "OVER THE BRINK"). floatG only bobs and rolls.
//   veil.material.uniforms.uWat   water height / slope / z under the veil: it fades out toward the water in world space
//   makeBurst uniforms: uFloorY (sprites thin out above this level: the rare curtain and the bridge's splash stop at the
//                            water), uNear (metres over which sprites thin toward the lens: 12 for the slab's splash, so
//                            flying through it leaves the canyon readable), uStretch / uThin / uTorn (sprites drawn out
//                            along their flight and cut by noise into threads: torn water, not discs)
//   rare event (ctx.vary.rare): bridge 3 falls whole (bridge3 position / visible), blockBurst becomes its splash along the
//                            whole bridge at sFell, the block and brash chunks become its rocking wreckage, curtain = gold snow
//   THE FALL is the hero's: aqua, cobalt and ink by each wall point's own depth, the side conduit where the route is at
//   34.5 s, then quiet ink round the ring: see the hero's header. The world lays the route straight down the axis and
//   sends the companions on the conduit's side of the axis (4j) into its throat with the water; the rest drift out to
//   their own wall and are gone below it.
//   MOODS fields: warm (hero uWarm), drift / driftH (spindrift strength, height), groundDrift (blizzard sheet over
//   the lake), snowCap / snowOp (particle count cap, opacity), plumeTint / foamTint with plumeK / foamK (pale aqua spray at
//   twilight, cool whites brighter than the cloud in snowfall), fallCol / fallK / fallMist / fallMistOp (the tributary falls),
//   plumeKnee (hero uPlumeKnee: snowfall lets the lit heads go a step brighter than the cloud deck),
//   plumeShade / plumeSide (hero uPlumeShade / uPlumeSide: in a low sun the plume's shade flank is blue-violet, darker than
//   the pale sky, and shows on the right), beamWhite / beamK (the sunbeam: how far toward white, how strong), upGlow (hero
//   uUpGlow: at twilight the lit water throws a teal up-light on the foot of the walls and the underside of the arch)
//   paintRig.uniforms.uLit / uDay / uPortalK   drifter: sun on the lake, shade in the canyon, daylight dying in the shaft
//   chunk instance matrices  written every frame in poseChunks()
//   spindrift ribbons        aRib.w fades them to nothing over every snow bridge (4h ribGaps)
//   curtain uAlpha           the rare curtain thins by half once the bridge is down (update())
// Build steps: build() yields between and inside every long loop (terrain rows, lake grid, walls, chunks), and the
// hero does the same, so the longest step stays far under the limit.
// Kit workarounds: (4i) the kit waterfall's foam pool is a flat sheet just over the level water: the river's standing waves
// cut it into a comb, so it stays hidden and the river shader draws the apron on its own surface; the kit's falling sheets
// are a smooth translucent body that read from the river as a pane of glass, so they stay hidden too and the world draws
// the falling water itself as ropes (4k'). (4e) the sky dome's geometry is swapped for a skewed box, because the kit's fan dome goes flat
// when the view direction is exactly horizontal; the twilight sky is baked at 256 px because the kit's bake is one
// long step. (4g) makeLake's own grid does all its depth lookups in one call, so the grid is made here and passed in.
// Engine behaviour worked round: the camera that looks in through the previous world's portal has its near plane at the
// opening, which cuts away the lake surface between it and the entry point: the lower half of the opening showed the bare
// pale lake bed, and its lowest rays passed under the bed into the void (a black speck at the foot of the opening). So the
// deep bed is shaded in the lake's own deep colour (SHEET_FRAG uDeepBed; never seen under the opaque water in flight) and
// a floor of that colour lies under the lake (4g 'lake-floor').
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import { buildHero, runStepsAsync, gridNormalSteps, moulinRoute } from '../parts/sapphire-moulin.js';

const DEG = Math.PI / 180;
const PALETTE = ['#16A0F0', '#0B3FA8', '#5FD6E4', '#DDEBF3', '#3E3A38', '#FFC878', '#FF5E1A'];
const S_MIN = -90, S_CHUTE = 100, S_CAN = 160, S_REACH = 468, S_LIP = 581, DS = 0.5;
const L_LAKE = 2.4, CAM_H = 0.95, CAM_OUT = 2.6;
const ease = (t) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x); };

// ---------------------------------------------------------------- 1. seeded looks
// sunEl / sunAz: kit/sky convention (azimuth 0 = -Z, +90 = +X). The sun stays behind the left shoulder in every look.
const MOODS = {
  gilded: {
    title: 'The Sapphire Race', sunEl: 24, sunAz: -119, sunCol: '#FFE6C2', sunK: 1.15, skyCol: '#7FAEE6', skyK: 0.72,
    sky: { preset: 'day', zenith: '#2F6FC0', horizon: '#A9CCE8', horizonPow: 6.5, scatterColor: '#FFE2B8', scatter: 0.2, clouds: false, clouds2: false },
    cirrus: [0.44, '#FFF1DC', '#B9CCE4'], haze: '#BFD8EC', fog: 0.00035, bank: '#4C6A8C', bankTop: '#C9B79A', exposure: 1.0, drift: 1.15, warm: 1, plumeTint: '#FFFFFF', plumeK: 1.2, plumeShade: '#B6C0EA', plumeSide: 0.8, snow: 0.55, snowCol: ['#FFE9C4', '#FFD79A', '#FFFFFF'],
    grade: { saturation: 1.04, contrast: 1.06, vignette: 0.3, grain: 0.02 }, bloom: { strength: 0.34, radius: 0.6, threshold: 0.93 },
  },
  noon: {
    title: 'The Sapphire Race, High Noon', sunEl: 47, sunAz: -128, sunCol: '#FFF8EC', sunK: 1.22, skyCol: '#4C84E0', skyK: 0.62,
    sky: { preset: 'day', zenith: '#1B55BE', horizon: '#9CC8EE', horizonPow: 6, scatter: 0.12, clouds: false, clouds2: false },
    cirrus: [0.38, '#FFFFFF', '#C4D6EC'], haze: '#B4D4F0', fog: 0.0003, bank: '#3F648F', bankTop: '#E6EEF4', exposure: 0.96, drift: 0.55, warm: 0.12, plumeTint: '#FFFFFF', plumeK: 1.14, snow: 0.3, snowCol: ['#FFFFFF', '#E8F4FF', '#FFFFFF'],
    grade: { saturation: 1.08, contrast: 1.1, vignette: 0.3, grain: 0.02 }, bloom: { strength: 0.3, radius: 0.55, threshold: 0.94 },
  },
  midnight: {
    title: 'The Sapphire Race, Midnight Sun', sunEl: 6, sunAz: -132, sunCol: '#FF9C74', sunK: 1.25, skyCol: '#8088DC', skyK: 0.75,
    sky: { preset: 'goldenHour', zenith: '#3A4CA6', horizon: '#F2B49C', scatterColor: '#FF8E6A', scatter: 0.5, clouds: false, clouds2: false },
    cirrus: [0.5, '#FFB79A', '#8C84C0'], haze: '#E0B4B2', fog: 0.00045, bank: '#4F4A80', bankTop: '#FF9E86', exposure: 1.08, drift: 1.2, warm: 0.8, beamWhite: 0.72, beamK: 0.9, plumeTint: '#FFFFFF', plumeK: 1.24, plumeShade: '#9AA4E0', plumeSide: 0.9, snow: 0.6, snowCol: ['#FFC2A0', '#FF9E86', '#FFE0D0'],
    grade: { saturation: 1.1, contrast: 1.05, vignette: 0.34, grain: 0.022 }, bloom: { strength: 0.38, radius: 0.65, threshold: 0.92 },
  },
  overcast: {
    title: 'The Sapphire Race, Snowfall', sunEl: 32, sunAz: -119, sunCol: '#EEF2F6', sunK: 0.5, skyCol: '#8EA8CC', skyK: 1.0,
    sky: { preset: 'overcast', zenith: '#8A9DB8', horizon: '#C6D2DE' },
    haze: '#C4D0DC', fog: 0.0011, bank: '#6C8098', bankTop: '#B8C6D4', exposure: 1.05, drift: 0.45, warm: 0, snow: 2.2, snowCol: ['#FFFFFF', '#EAF2FA', '#FFFFFF'], fall: true,
    plumeTint: '#FFFFFF', plumeK: 1.5, plumeKnee: 0.44, plumeShade: '#8E9CC4', plumeSide: 0.5, foamTint: '#EAF2FA', foamK: 1.15, fallCol: '#EEF5FD', fallK: 1.3, fallMist: '#BCD6F6', fallMistOp: 0.12,      // cool whites against the grey cloud (the plume a clear step brighter than the deck, its hollows blue-grey and a step darker), blue in the mist
    grade: { saturation: 1.2, contrast: 1.08, vignette: 0.34, grain: 0.024 }, bloom: { strength: 0.3, radius: 0.6, threshold: 0.94 },
  },
  blizzard: {
    title: 'The Sapphire Race, Ground Blizzard', sunEl: 17, sunAz: -112, sunCol: '#FFDCA8', sunK: 1.2, skyCol: '#84AEE0', skyK: 0.72,
    sky: { preset: 'day', zenith: '#3470BC', horizon: '#E6CFA8', scatterColor: '#FFD9A0', scatter: 0.45, clouds: false, clouds2: false },
    cirrus: [0.5, '#FFE9C8', '#AEBED8'], haze: '#E4CFAC', fog: 0.0016, bank: '#55688A', bankTop: '#FFD9A0', exposure: 1.0, drift: 2.4, driftH: 1.7, groundDrift: 1, warm: 1, plumeTint: '#FFFFFF', plumeK: 1.3, snow: 2.8, snowCap: 2.7, snowOp: 0.85, snowCol: ['#FFE3B0', '#FFC878', '#FFF4E0'],
    grade: { saturation: 1.08, contrast: 1.05, vignette: 0.32, grain: 0.022 }, bloom: { strength: 0.36, radius: 0.65, threshold: 0.92 },
  },
  twilight: {
    title: 'The Sapphire Race, August Twilight', sunEl: 5, sunAz: -135, sunCol: '#7E9AE6', sunK: 0.42, skyCol: '#2C3F96', skyK: 0.42,
    sky: { preset: 'blueHour', zenith: '#0C1438', horizon: '#3F5FA8', aurora: 0.8, auroraAzimuth: 0, auroraSpread: 0.6, auroraColors: ['#3CFF9A', '#3A9BFF'], stars: 0.7, clouds: false, clouds2: false, bake: true, bakeSize: 256,
      bodyOverrides: { 0: { elevation: 19, azimuth: 15 } } },      // the moon near the line of travel: a wide lens stretches a disc in the corner of the frame
    cirrus: [0.3, '#5A6FB0', '#2A3668'], haze: '#34508C', fog: 0.0004, bank: '#101A3C', bankTop: '#2B7A6A', exposure: 1.2, drift: 0.7, warm: 0, upGlow: 0.34, plumeTint: '#A4E2F4', plumeK: 1.45, foamTint: '#86B4C6', snow: 0.4, snowCol: ['#9FC4FF', '#7CFFC0', '#DDEBFF'],
    grade: { saturation: 1.12, contrast: 1.05, vignette: 0.36, grain: 0.028 }, bloom: { strength: 0.42, radius: 0.7, threshold: 0.9 },
  },
};
const MOOD_ROLL = ['midnight', 'noon', 'overcast', 'gilded', 'noon', 'gilded', 'blizzard', 'midnight'];
const LIVERIES = { orange: ['#FF5E1A', '#1c1c20'], yellow: ['#FFC21A', '#1c1c20'], redwhite: ['#D8201C', '#E8ECEF'] };

// combed cirrus on a camera-centred dome (vDir = direction from the eye)
const CIRRUS_FRAG_BODY = /* glsl */`
void main(){
  vec3 d = normalize(vDir); float el = d.y;
  vec2 p = d.xz/max(d.y + 0.08, 0.05);
  vec2 q = vec2(p.x*0.906 + p.y*0.423, -p.x*0.423 + p.y*0.906) + vec2(uTime*0.004, uTime*0.0015);
  float streak = wFbm(vec2(q.x*0.55, q.y*3.2) + 0.6*wNoise(q*1.3));
  float patchM = wFbm(q*0.45 + 7.0);
  float c = smoothstep(1.0 - uCover, 1.28 - uCover, streak*0.65 + patchM*0.5);
  float a = c*smoothstep(0.1, 0.3, el)*(1.0 - smoothstep(0.75, 0.95, el))*0.75;
  gl_FragColor = vec4(mix(uShade, uLit, smoothstep(0.3, 0.9, streak)), a);
}`;
const HASH_GLSL = /* glsl */`
float wHash(vec2 p){ vec3 q = fract(vec3(p.xyx)*vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float wNoise(vec2 x){
  vec2 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), f.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float wFbm(vec2 p){ return 0.5*wNoise(p) + 0.3*wNoise(p*2.07 + 13.1) + 0.2*wNoise(p*4.3 + 5.7); }
`;

// ---------------------------------------------------------------- 2. the river centreline
// Heading th: direction of flow = (sin th, 0, -cos th), right = (cos th, 0, sin th); th = 0 is -Z.
// Five bends (left, right, left, right, left) of 38 / 76 / 76 / 76 / 38 degrees: the heading swings +-38
// degrees and both the net turn and the net sideways drift are zero, so the lake looks straight at the plume.
function buildPlan(rng) {
  const A = 38 * DEG, ramp = 7, gap = 6, j = rng.range(-2.5, 2.5);
  const R = [50, 46 + j, 44 - j * 0.6, 46 + j, 50], sign = [-1, 1, -1, 1, -1], ang = [A, 2 * A, 2 * A, 2 * A, A];
  const bends = []; let total = 4 * gap;
  for (let i = 0; i < 5; i++) total += R[i] * ang[i] + ramp;
  let s = S_CAN + (S_REACH - S_CAN - total) / 2;
  for (let i = 0; i < 5; i++) { const L = R[i] * ang[i] + ramp; bends.push({ s0: s, L, k: sign[i] / R[i], mid: s + L / 2, sign: sign[i] }); s += L + gap; }
  const kappa = (q) => {
    let k = 0;
    for (const b of bends) { const t = q - b.s0; if (t > 0 && t < b.L) k += b.k * smoothstep(0, ramp, t) * (1 - smoothstep(b.L - ramp, b.L, t)); }
    return k;
  };
  const n = Math.round((S_LIP - S_MIN) / DS) + 1, X = new Float32Array(n), Z = new Float32Array(n), TH = new Float32Array(n), K = new Float32Array(n);
  const i0 = Math.round((S_CAN - S_MIN) / DS), i1 = Math.round((S_REACH - S_MIN) / DS);
  let th = 0, x = 0, z = 0;
  for (let i = i0; i < n; i++) {
    const q = S_MIN + i * DS; X[i] = x; Z[i] = z; TH[i] = th; K[i] = kappa(q);
    const k = kappa(q + DS / 2), tm = th + k * DS / 2;
    x += Math.sin(tm) * DS; z -= Math.cos(tm) * DS; th += k * DS;
  }
  for (let i = i0 - 1; i >= 0; i--) { X[i] = X[i0]; Z[i] = Z[i0] + (i0 - i) * DS; TH[i] = 0; K[i] = 0; }
  const dx = -X[i1], dz = 113 - Z[i1];
  for (let i = 0; i < n; i++) { X[i] += dx; Z[i] += dz; }
  for (let i = i1; i < n; i++) { X[i] = 0; Z[i] = 113 - (i - i1) * DS; TH[i] = 0; K[i] = 0; }
  const at = (q, out = {}) => {
    const f = clamp((q - S_MIN) / DS, 0, n - 1.001), i = Math.floor(f), t = f - i;
    out.x = lerp(X[i], X[i + 1], t); out.z = lerp(Z[i], Z[i + 1], t); out.th = lerp(TH[i], TH[i + 1], t); out.k = lerp(K[i], K[i + 1], t);
    if (q < S_MIN) out.z += S_MIN - q;
    out.rx = Math.cos(out.th); out.rz = Math.sin(out.th);
    return out;
  };
  // curvature smoothed over +-6 m and scaled to -1..1: which way and how hard the river is turning
  const turn = (q) => clamp((kappa(q - 6) + 2 * kappa(q) + kappa(q + 6)) * 0.25 * 46, -1, 1);
  // nearest centreline point to (x, z) between s = 90 and the lip
  const tmp = {};
  const nearest = (px, pz) => {
    let best = 1e12, bi = 0;
    const a = Math.round((90 - S_MIN) / DS);
    for (let i = a; i < n; i += 4) { const ex = X[i] - px, ez = Z[i] - pz, d = ex * ex + ez * ez; if (d < best) { best = d; bi = i; } }
    for (let i = Math.max(a, bi - 4); i <= Math.min(n - 1, bi + 4); i++) { const ex = X[i] - px, ez = Z[i] - pz, d = ex * ex + ez * ez; if (d < best) { best = d; bi = i; } }
    tmp.d = Math.sqrt(best); tmp.s = S_MIN + bi * DS;
    return tmp;
  };
  return { at, turn, nearest, bends, kappa };
}

// ---------------------------------------------------------------- 3. small factories
// Merged geometry with vertex colour (aCol) and flutter (aFx = amount, phase, axis: 0 = wind, 1 = vertical).
function makeBag() {
  const P = [], N = [], C = [], F = [], I = [], v = new THREE.Vector3(), nm = new THREE.Matrix3(), col = new THREE.Color();
  return {
    add(geo, matrix, color, fxFn) {
      const base = P.length / 3, p = geo.attributes.position, nrm = geo.attributes.normal;
      nm.getNormalMatrix(matrix); col.set(color);
      for (let i = 0; i < p.count; i++) {
        const lx = p.getX(i), ly = p.getY(i), lz = p.getZ(i);
        const f = fxFn ? fxFn(lx, ly, lz) : null;
        v.set(lx, ly, lz).applyMatrix4(matrix); P.push(v.x, v.y, v.z);
        v.set(nrm.getX(i), nrm.getY(i), nrm.getZ(i)).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z);
        C.push(col.r, col.g, col.b);
        if (f) F.push(f[0], f[1], f[2]); else F.push(0, 0, 0);
      }
      if (geo.index) for (let i = 0; i < geo.index.count; i++) I.push(base + geo.index.getX(i)); else for (let i = 0; i < p.count; i++) I.push(base + i);
      geo.dispose();
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aCol', new THREE.Float32BufferAttribute(C, 3)); g.setAttribute('aFx', new THREE.Float32BufferAttribute(F, 3));
      g.setIndex(I);
      return g;
    },
  };
}
const TRS = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// One shader for everything painted or sewn: the drifter, the camp, flags, the cable, the nunataks.
// U = the hero's shared uniforms (sun, sky, time), so it always agrees with the ice around it.
function makePaint(U, o = {}) {
  return new THREE.ShaderMaterial({
    fog: o.fog ?? true, side: o.side ?? THREE.DoubleSide,
    uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
      uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uSnow: U.uSnow, uPortalCol: U.uPortalCol,
      uLit: { value: 1 }, uDay: { value: 1 }, uPortalK: { value: 0 }, uFlut: { value: new THREE.Vector3(1, 0.15, 0.35) },
      uScuff: { value: o.scuff ?? 0 }, uWet: { value: o.wet ?? 0 }, uAmb: { value: new THREE.Color(0, 0, 0) }, uPull: { value: 0 },
    }),
    vertexShader: /* glsl */`
attribute vec3 aCol; attribute vec3 aFx;
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vL;
uniform float uTime, uPull; uniform vec3 uFlut;
#include <common>
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float w = sin(uTime*11.0 + aFx.y) + 0.5*sin(uTime*17.3 + aFx.y*1.7);
  p += mix(uFlut, vec3(0.0, 1.0, 0.0), aFx.z)*aFx.x*w;
  vL = position; vCol = aCol;
  vec4 wp = modelMatrix*vec4(p, 1.0); vW = wp.xyz; vN = mat3(modelMatrix)*normal;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  gl_Position.z = mix(gl_Position.z, -gl_Position.w, uPull);      // uPull > 0: drawn in front of the water (the drifter over the brink)
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
varying vec3 vCol; varying vec3 vN; varying vec3 vW; varying vec3 vL;
uniform float uTime, uLit, uDay, uPortalK, uScuff, uWet; uniform vec3 uSun, uSunCol, uSkyCol, uSnow, uPortalCol, uAmb;
#include <common>
${HASH_GLSL}
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW + vec3(0.0, 1e-5, 0.0));
  float sc = wFbm(vL.xz*7.0 + vL.y*5.0);
  vec3 alb = vCol*(0.84 + 0.3*sc);
  float scuff = smoothstep(0.7, 0.86, wNoise(vL.xz*31.0 + vL.yx*9.0))*uScuff;
  alb = mix(alb, vec3(0.62, 0.6, 0.56), scuff*0.3);
  float ndl = max(dot(N, uSun), 0.0);
  vec3 fill = mix(uSkyCol, vec3(dot(uSkyCol, vec3(0.3, 0.5, 0.2))), 0.62)*1.7;
  vec3 col = alb*(uSunCol*ndl*uLit + fill*(0.8 + 0.45*N.y) + uSnow*0.24*(0.6 - 0.4*N.y)*(0.4 + 0.6*uLit));
  vec3 Hh = normalize(V + uSun);
  col += uSunCol*pow(max(dot(N, Hh), 0.0), 36.0)*0.3*uLit;
  col += uSkyCol*pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 4.0)*0.35;
  vec2 bc = vec2(vL.x*74.0, vL.z*74.0 + uTime*2.6);
  float bead = step(0.9, wHash(floor(bc)))*(1.0 - smoothstep(0.08, 0.2, length(fract(bc) - 0.5)))*uWet*smoothstep(0.2, 0.7, N.y);
  col += (uSkyCol*0.8 + uSunCol*uLit)*bead*0.3;
  col = col*uDay + alb*(uPortalCol*uPortalK + uAmb);
  col += uPortalCol*uPortalK*0.16*pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 2.0);      // a cyan rim from the ring, so black trim still reads against the ink
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`,
  });
}

// Soft sprite burst: splashes, the snow curtain, nose spray. Each sprite flies from uOrigin with its own velocity.
//   o: count, dir [x,y,z], spread (0 = beam, 1 = hemisphere), speed [a,b], size [start, growth], life, gravity, color, loop, delay, jitter,
//      stretch (0 = round; each sprite is drawn out along its own flight on screen by up to 1 + stretch), thin (width / length before
//      stretching), torn (0 = a soft disc; 1 = only the denser threads of the sprite survive, so it reads as torn water, not a puff)
function makeBurst(rng, o) {
  const n = o.count, vel = new Float32Array(n * 3), seed = new Float32Array(n * 3), off = new Float32Array(n * 3);
  const d = new THREE.Vector3(), base = new THREE.Vector3().fromArray(o.dir || [0, 1, 0]).normalize(), jit = o.jitter || [0, 0, 0];
  for (let i = 0; i < n; i++) {
    d.set(rng.gauss(), rng.gauss(), rng.gauss()).normalize().multiplyScalar(o.spread ?? 0.6).add(base).normalize().multiplyScalar(rng.range(o.speed[0], o.speed[1]));
    vel.set([d.x, d.y, d.z], i * 3); seed.set([rng(), rng.range(0.6, 1.4), rng()], i * 3);
    off.set([rng.range(-1, 1) * jit[0], rng.range(-1, 1) * jit[1], rng.range(-1, 1) * jit[2]], i * 3);
  }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.setAttribute('position', q.attributes.position); g.setIndex(q.index);
  g.setAttribute('aVel', new THREE.InstancedBufferAttribute(vel, 3)); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 3));
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 3));
  g.instanceCount = n;
  const uniforms = {
    uOrigin: { value: new THREE.Vector3() }, uAge: { value: -1 }, uLife: { value: o.life ?? 1.6 }, uG: { value: o.gravity ?? 7 },
    uSize: { value: new THREE.Vector2(o.size[0], o.size[1]) }, uCol: { value: new THREE.Color(o.color || '#ffffff') }, uAlpha: { value: o.alpha ?? 0.8 },
    uLoop: { value: o.loop ? 1 : 0 }, uDelay: { value: o.delay ?? 0.25 }, uDrag: { value: o.drag ?? 0.35 }, uOver: { value: o.over ?? 1 },
    uFloorY: { value: -1e5 }, uPull: { value: 0 }, uNear: { value: o.near ?? 1.4 },      // uFloorY: sprites thin out above this level (water); uPull as in makePaint
    uStretch: { value: o.stretch ?? 0 }, uThin: { value: o.thin ?? 1 }, uTorn: { value: o.torn ?? 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
attribute vec3 aVel; attribute vec3 aSeed; attribute vec3 aOff;
uniform vec3 uOrigin; uniform float uAge, uLife, uG, uLoop, uDelay, uDrag, uFloorY, uPull, uNear, uStretch, uThin; uniform vec2 uSize;
varying vec2 vUv; varying float vA; varying float vS; varying float vK;
void main(){
  float age = uLoop > 0.5 ? fract(uAge/uLife + aSeed.x)*uLife : uAge - aSeed.x*uDelay;
  float k = clamp(age/uLife, 0.0, 1.0);
  vec3 c = uOrigin + aOff + aVel*age*(1.0 - uDrag*k) + vec3(0.0, -0.5*uG*age*age, 0.0);
  float size = aSeed.y*(uSize.x + uSize.y*k);
  vA = step(0.0, age)*step(age, uLife)*pow(max(1.0 - k, 0.0), 1.3)*smoothstep(0.0, 0.08, k);
  vA *= smoothstep(0.0, 0.5*size, c.y - uFloorY);
  vec4 mv = modelViewMatrix*vec4(c, 1.0);
  vA *= smoothstep(0.25, uNear, -mv.z);
  // drawn out along its own flight as it lies on the screen: spray is strands, not discs
  vec3 vv = mat3(modelViewMatrix)*(aVel*(1.0 - 2.0*uDrag*k) + vec3(0.0, -uG*age, 0.0));
  float sp = length(vv.xy);
  vec2 dir = mix(vec2(0.0, 1.0), vv.xy/max(sp, 1e-3), step(1e-3, sp));
  float st = 1.0 + uStretch*clamp(1.6*sp/(sp + 4.0), 0.0, 1.0);
  mv.xy += (dir*position.y*st + vec2(dir.y, -dir.x)*position.x*uThin)*size;
  vUv = position.xy*2.0; vS = aSeed.z; vK = st;
  gl_Position = projectionMatrix*mv;
  gl_Position.z = mix(gl_Position.z, -gl_Position.w, uPull);
}`,
    fragmentShader: /* glsl */`
uniform vec3 uCol; uniform float uAlpha, uOver, uTorn;      // uOver: 1 = laid over the scene, 0 = only added (dim spray must not read as smoke)
varying vec2 vUv; varying float vA; varying float vS; varying float vK;
${HASH_GLSL}
void main(){
  float r = dot(vUv, vUv);
  float lump = 0.65 + 0.7*wNoise(vUv*2.3 + vS*40.0);
  float a = exp(-r*3.0*lump)*(1.0 - smoothstep(0.55, 1.0, r));
  // torn water: a noise that is stretched along the flight cuts the puff into threads and leaves holes in it
  float n = 0.6*wNoise(vec2(vUv.x*2.4, vUv.y*1.1*vK) + vS*53.0) + 0.4*wNoise(vec2(vUv.x*5.5, vUv.y*2.3*vK) + vS*91.0);
  float cut = smoothstep(0.43, 0.63, n + 0.3*(a - 0.35));
  a = mix(a, min(a*2.0, 1.0)*cut, uTorn)*vA*uAlpha;
  gl_FragColor = vec4(uCol*a, a*uOver);
}`,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.renderOrder = 7;
  q.dispose();
  return { mesh, uniforms };
}

// A lumpy block of ice for the hero's 'raft' ice variant (attributes aSurf, aIce as the hero's blocks).
function chunkGeometry(nz, rng) {
  const ico = new THREE.IcosahedronGeometry(1, 2); ico.deleteAttribute('uv'); ico.deleteAttribute('normal');
  const g = mergeVertices(ico, 1e-4), p = g.attributes.position, n = p.count; ico.dispose();
  // a broken block worn round by the water: the sphere cut by random planes (flat top and bottom first), the cuts
  // blended into each other so the edges are rounded, then pitted. No hard creases: at this vertex count they read as low-poly.
  const planes = [[0, 1, 0, 0.6], [0, -1, 0, 0.55]], v = new THREE.Vector3();
  for (let i = 0; i < 13; i++) { v.set(rng.gauss(), rng.gauss() * 0.55, rng.gauss()).normalize(); planes.push([v.x, v.y, v.z, rng.range(0.62, 0.98)]); }
  const surf = new Float32Array(n * 2), ice = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i)).normalize();
    let acc = Math.pow(1.2, -7);
    for (const q of planes) { const d = v.x * q[0] + v.y * q[1] + v.z * q[2]; if (d > 0.05) acc += Math.pow(q[3] / d, -7); }
    let r = Math.pow(acc, -1 / 7);
    r *= 1 + 0.07 * nz.n3(v.x * 2.3 + 3, v.y * 2.3, v.z * 2.3) + 0.035 * nz.n3(v.x * 5.1, v.y * 5.1 + 7, v.z * 5.1);
    const x = v.x * r, y = v.y * r, z = v.z * r;
    p.setXYZ(i, x, y, z);
    surf[i * 2] = Math.atan2(x, z) * 0.6 + y; surf[i * 2 + 1] = y; ice[i * 3] = 0.55; ice[i * 3 + 1] = 0; ice[i * 3 + 2] = 2.6;
  }
  g.setAttribute('aSurf', new THREE.BufferAttribute(surf, 2)); g.setAttribute('aIce', new THREE.BufferAttribute(ice, 3));
  g.computeVertexNormals();
  return g;
}

// The ice sheet's own shader. aGeo = (metres outside the canyon cut, metres inside the lake shore,
// rill coordinate along the canyon, distance to the canyon centreline).
const SHEET_VERT = /* glsl */`
attribute vec4 aGeo;
varying vec3 vP; varying vec3 vN; varying vec4 vGeo;
#include <common>
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal; vGeo = aGeo;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const SHEET_FRAG = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec4 vGeo;
uniform float uTime, uSeason, uLate, uLake, uSunK;
uniform vec3 uSun, uSunCol, uSkyCol, uSnow, uTurq, uCobalt, uElectric, uCryo, uMauve, uCrev, uDeepBed;
uniform vec4 uMouth; uniform vec4 uLakes[4];
#include <common>
${HASH_GLSL}
#include <fog_pars_fragment>
void main(){
  vec2 em = vec2(vP.x, vP.z - uMouth.x)/(uMouth.zw + 4.4);
  float e = dot(em, em);
  if (e < 1.0 && vP.z < 5.6) discard;
  if (abs(vP.x) < 5.5 && vP.z > 0.0 && vP.z < uMouth.y) discard;
  if (vGeo.x < 0.0) discard;
  float dist = length(cameraPosition - vP);
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  float rw = fwidth(vP.x) + fwidth(vP.z);
  // sastrugi: wind-carved ridges running with the katabatic wind (from -X)
  vec2 ws = vec2(vP.x*0.11, vP.z*0.5 + 0.3*wNoise(vP.xz*0.05));
  float s0 = wFbm(ws), s1 = wFbm(ws + vec2(0.035, 0.0)), s2 = wFbm(ws + vec2(0.0, 0.25));
  float nearK = (1.0 - smoothstep(60.0, 320.0, dist))*(1.0 - smoothstep(0.15, 0.7, rw*0.3));
  vec3 Np = normalize(N + vec3((s0 - s1)*3.2, 0.0, (s0 - s2)*1.6)*nearK);
  float under = smoothstep(0.05, 0.6, uLake - vP.y)*step(0.0, vGeo.y);
  vec3 snow = uSnow*0.78;
  vec3 alb = snow*(0.9 + 0.1*s0);
  float country = wFbm(vP.xz*0.011 + 3.0), farC = wFbm(vP.xz*0.0016 + 11.0);
  alb = mix(alb, mix(uSnow, uCryo, 0.38)*0.74, smoothstep(0.5, 0.72, country)*(0.3 + 0.4*uSeason));
  alb = mix(alb, mix(uSnow, uCryo, 0.34)*0.7, smoothstep(0.48, 0.66, farC)*0.45*smoothstep(250.0, 900.0, dist));
  alb = mix(alb, uMauve, uLate*0.3*smoothstep(0.4, 0.7, wFbm(vP.xz*0.03 + 9.0)));
  // blue ice margins: canyon edge, lake shore, the mouth
  float edge = max(1.0 - smoothstep(0.0, 9.0, vGeo.x), (1.0 - smoothstep(0.0, 6.0, -vGeo.y))*step(vGeo.y, 0.0));
  edge = max(edge, 1.0 - smoothstep(1.0, 1.7, e));
  alb = mix(alb, mix(uSnow, uTurq, 0.45)*0.7, edge*0.6*smoothstep(0.3, 0.7, wNoise(vP.xz*0.25) + edge*0.4));
  // blue rills running into the canyon like the barbs of a feather
  float tr = (vGeo.z + vGeo.w*0.55 + 9.0*wNoise(vP.xz*0.03) + 2.5*wNoise(vP.xz*0.13))/31.0;
  float tcell = floor(tr), tf = abs(fract(tr) - 0.5)*31.0;
  float rh = wHash(vec2(tcell, 5.0));
  float rw0 = 0.22 + 0.4*rh, rwid = max(rw0, rw*0.9);
  float rill = (1.0 - smoothstep(rwid, rwid + rw*0.9 + 0.05, tf))*(rw0/rwid)*step(0.3, rh)
    *smoothstep(9.0, 13.0, vGeo.w)*(1.0 - smoothstep(40.0 + 120.0*rh, 60.0 + 150.0*rh, vGeo.w))*(1.0 - under)*step(vGeo.y, 0.0);
  alb = mix(alb, uElectric*0.8, rill*0.8);
  // cryoconite holes: dark pocks with clear water lids
  vec2 pc = vP.xz*1.6; vec2 pcell = floor(pc);
  float ph = wHash(pcell);
  float pd = length(fract(pc) - 0.2 - 0.6*vec2(wHash(pcell + 17.0), wHash(pcell + 31.0))), pr = 0.06 + 0.16*wHash(pcell + 5.0);
  float paa = rw*0.9;
  float pock = (1.0 - smoothstep(pr, pr + 0.03 + paa, pd))*(pr/(pr + paa))*step(0.8 - 0.2*uSeason - 0.2*under, ph)
    *(1.0 - smoothstep(0.06, 0.3, rw))*max(smoothstep(0.45, 0.7, wNoise(vP.xz*0.07 + 4.0)), under);
  alb = mix(alb, uCryo*0.5, pock*0.8);
  // four far lakes: blue coins on the ice
  float lakeM = 0.0, lakeR = 1.0, aaK = clamp(rw*0.012, 0.03, 0.5);
  vec2 wob = 0.12*vec2(wNoise(vP.xz*0.01), wNoise(vP.xz*0.01 + 7.0));
  for (int i = 0; i < 4; i++) {
    vec2 q = (vP.xz - uLakes[i].xy)/uLakes[i].zw + wob; float lr = dot(q, q);
    float m = 1.0 - smoothstep(1.0 - aaK, 1.0 + aaK, lr);
    if (m > lakeM) { lakeM = m; lakeR = lr; }
  }
  alb = mix(alb, mix(uCobalt*1.15, uElectric*0.9, smoothstep(0.25, 1.0, lakeR)), lakeM);
  // the crevasse field to the right
  vec2 cq = vP.xz - uCrev.xy; float cm = 1.0 - smoothstep(0.55, 1.0, length(cq)/uCrev.z);
  float cc = (cq.x*0.6 + cq.y*0.8 + 14.0*wNoise(cq*0.006))/26.0; float cf = abs(fract(cc) - 0.5)*26.0, cid = floor(cc);
  float cw0 = 1.2 + 2.4*wHash(vec2(cid, 3.0)), cw = max(cw0, rw*0.9);
  float crev = (1.0 - smoothstep(cw, cw + rw*0.9 + 0.1, cf))*(cw0/cw)*cm*smoothstep(0.35, 0.6, wNoise(vec2(cid*3.1, (cq.x*0.8 - cq.y*0.6)*0.012)));
  alb = mix(alb, uCobalt*0.5, crev*0.85);
  // light: warm key, saturated blue fill, cloud shadows crawling on the far ice
  float ndl = max(dot(Np, uSun), 0.0), ndlG = max(dot(N, uSun), 0.0);
  float cloud = smoothstep(0.5, 0.75, wFbm(vP.xz*0.0011 + vec2(uTime*0.012, uTime*0.004)))*smoothstep(150.0, 500.0, dist)*0.55;
  vec3 col = alb*(uSunCol*(ndl*0.85 + 0.15*ndlG)*uSunK*(1.0 - cloud) + uSkyCol*(0.75 + 0.25*Np.y));
  float gs = wHash(floor(vP.xz*9.0)), gt = pow(max(sin(uTime*(2.0 + 3.0*gs) + gs*50.0), 0.0), 20.0);
  col += uSunCol*gt*step(0.9, wHash(floor(vP.xz*9.0) + 2.0))*(1.0 - smoothstep(0.05, 0.3, rw*4.5))*2.2*(1.0 - under)*(1.0 - lakeM);
  col = mix(col, col*vec3(0.8, 0.97, 1.06), under);
  // the deep bed carries the colour of the water over it. Under the lake it is never seen; it is for the camera that looks
  // in through the previous world's portal, whose near plane cuts the surface away and showed the bare pale bed
  col = mix(col, uDeepBed, smoothstep(1.4, 3.0, uLake - vP.y)*step(0.0, vGeo.y));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;
// The slate weather bank along the horizon ahead (follows the camera; uv.x = azimuth -1..1, uv.y = elevation 0..1).
const BANK_FRAG = /* glsl */`
varying vec2 vUv; uniform float uTime; uniform vec3 uBank, uBankTop, uHaze;
${HASH_GLSL}
void main(){
  float el = mix(-1.4, 7.6, vUv.y);
  float top = 4.3 + 1.5*(wFbm(vec2(vUv.x*6.0 + uTime*0.003, 1.0)) - 0.5)*2.0 - 2.2*vUv.x*vUv.x + 0.5*(wNoise(vec2(vUv.x*31.0 + uTime*0.006, 4.0)) - 0.5);
  float a = (1.0 - smoothstep(top - 0.9, top + 0.2, el))*(1.0 - smoothstep(0.62, 1.0, abs(vUv.x)));
  vec3 col = uBank*(0.88 + 0.24*wFbm(vec2(vUv.x*24.0 - uTime*0.004, el*0.8)));
  col = mix(col, uBankTop, smoothstep(top - 1.6, top, el)*0.3);
  col = mix(col, uHaze, (1.0 - smoothstep(-0.2, 1.8, el))*0.75);
  gl_FragColor = vec4(col, a);
}`;

// ---------------------------------------------------------------- 4. the world
export default {
  id: 'sapphire-moulin',
  name: 'The Sapphire Race',
  category: 'ocean',
  weirdness: 0.1,
  media: ['water'],
  async build(ctx) {
    const { rng, noise: nz } = ctx;
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, density = vary.density ?? 1;
    const scene = new THREE.Scene();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

    // ---- 4a. seeded choices: mood (hour), season, cast, rare event
    const hour = vary.hour || 'any';
    const roll = MOOD_ROLL[Math.floor(rng() * MOOD_ROLL.length)];
    const moodKey = hour === 'night' ? 'twilight' : hour === 'dawn' ? 'midnight' : hour === 'day' ? 'noon' : hour === 'golden' ? 'gilded' : roll;
    const mood = MOODS[moodKey];
    const season = rng.pick(['peak', 'early', 'peak', 'late']);
    const livery = LIVERIES[rng.pick(['orange', 'orange', 'yellow', 'redwhite'])];
    const campKind = rng.pick(['tents', 'tents', 'sledge']);
    const rare = !!vary.rare;
    const plan = buildPlan(rng.fork('plan'));
    const el = Math.max(mood.sunEl, 15) * DEG, az = mood.sunAz * DEG;      // the ice is lit from at least 15 degrees up, so the canyon keeps a sun-lit wall
    const sunDir = V3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();

    // ---- 4b. levels and the lake's shape
    const waterY = (s) => (s <= S_CHUTE ? L_LAKE : s < S_CAN ? L_LAKE - 5.98 * ease((s - S_CHUTE) / 60) : s <= S_REACH ? -9.74 + 0.02 * (S_REACH - s) : -12 + 0.02 * Math.max(S_LIP - s, 0));
    const sheetBase = (z) => (z <= 113 ? 0.01 * Math.max(z, 0) : 1.13 + 0.006 * (z - 113));
    const pc = {};
    const rimY = (s) => sheetBase(plan.at(s, pc).z);
    // THE CHAMBER: out from under bridge 3 the canyon opens for 30 m into a pool half as wide again (the biggest fall has
    // cut it), so the sun gets down the right wall and there is sky; it closes to the straight reach's width by its head.
    const sCham = plan.bends[4].mid + 4, chamber = (s) => smoothstep(sCham - 17, sCham - 6, s) * (1 - smoothstep(sCham + 4, sCham + 15, s));
    const halfW = (s) => lerp(6.2, 7, smoothstep(S_REACH - 30, S_REACH, s)) + (s < 108 ? 2.2 * ((108 - s) / 11) ** 2 : 0) + 4.4 * chamber(s);
    const superY = (s, lat) => -0.6 * plan.turn(s) * lat / 6.2;                     // the water climbs the outside of a bend
    const X0 = plan.at(0, pc).x, Z0 = plan.at(0, pc).z;
    // metres inside the shore (positive = water). The lake is an arrowhead that narrows to the outlet at s = 100.
    const lakeIn = (x, z) => {
      const s = Z0 - z; let w;
      if (s > 100) return -1 - (s - 100);
      if (s > 10) { const q = 100 - s; w = 6.5 + q * 0.35 + (q / 90) ** 2 * 22; }
      else { const q = (10 - s) / 85; w = q < 1 ? 60 * Math.sqrt(1 - q * q) : -(q - 1) * 85; }
      w += 6 * nz.fbm2(x * 0.03 + 40, z * 0.03, 2) * smoothstep(9, 30, w);
      return w - Math.abs(x - X0);
    };
    const lakeDepth = (x, z) => {
      const d = lakeIn(x, z); if (d <= 0) return d * 0.2;
      const s = Z0 - z;
      return Math.min(3.2, d * 0.11) + 1.9 * Math.exp(-(((x - X0) / 10) ** 2)) * smoothstep(0, 7, d) * smoothstep(-50, 25, s);
    };

    // nominal half-width of open water at lake metre s, 4 m in from the shore (floes, slush)
    const shoreW = (s) => (s > 10 ? 6.5 + (100 - s) * 0.35 + ((100 - s) / 90) ** 2 * 22 : 60 * Math.sqrt(Math.max(0, 1 - ((10 - s) / 85) ** 2))) - 4;

    // ---- 4c. the route: 0.95 m over the water on the outside of every bend, then the world's own line over the lip and
    // the shaft's axis. It is laid before the hero is built, because the hero's side conduit takes its depth from it.
    const camLat = (s) => -CAM_OUT * plan.turn(s) * (1 - smoothstep(S_REACH - 24, S_REACH, s));
    const camPos = (s, out = V3()) => {
      plan.at(s, pc); const lat = camLat(s);
      return out.set(pc.x + pc.rx * lat, waterY(s) + CAM_H + superY(s, lat), pc.z + pc.rz * lat);
    };
    const pts = [];
    for (let s = 0; s <= 550; s += 11) pts.push(camPos(s));
    pts.push(camPos(561));
    // THE LIP. The eye rides 1 m over the hump of the brink, then swings down a 20 m arc that starts on the water and
    // peels 3 m off the sheet as it steepens to the shaft's 68 degrees, and drifts out to the axis over the next 70 m.
    // (The hero's own fly-through points cut the corner of the brink, 0.45 m over the water: that sank the hull.)
    const surfY = moulinRoute.surfaceY, axD = V3(...moulinRoute.axisDir), PHI = Math.atan2(-axD.y, -axD.z), LEAN = axD.z / axD.y, R_LIP = 20;
    const axZ = (y) => moulinRoute.axisTop[2] + y * LEAN, zB = 0.5, yB = surfY(1.2) + 1.18;
    for (const z of [12, 6]) pts.push(V3(0, surfY(z) + CAM_H + 0.26 * (1 - smoothstep(0, 13, z)), z));
    pts.push(V3(0, yB, zB));
    for (const a of [12, 24, 36, 48, 60]) pts.push(V3(0, yB - R_LIP * (1 - Math.cos(a * DEG)), zB - R_LIP * Math.sin(a * DEG)));
    const yE = yB - R_LIP * (1 - Math.cos(PHI)), zE = zB - R_LIP * Math.sin(PHI), off0 = zE - axZ(yE);
    pts.push(V3(0, yE, zE));
    for (const t of [14, 30, 48, 68]) { const y = yE + t * axD.y; pts.push(V3(0, y, axZ(y) + off0 * (1 - smoothstep(0, 68, t)))); }
    // THE FALL: straight down the axis. The blend ends on the axis; from there the route is the axis itself to the portal
    // seat (one more point on it, 20 m on, so the last leg is a straight line from the blend's end).
    { const y = yE + 88 * axD.y; pts.push(V3(0, y, axZ(y))); }
    pts.push(V3(...moulinRoute.portalSeat));
    const path = makePath(pts);
    // The brief: "at 34.5 s the footwall steps away to the lower left and the water peels off into a side conduit". The
    // conduit's lip lies at the depth this route has reached at that share of its 40 s (world y is depth: the hero sits
    // at the origin, unrotated).
    const conduitDepth = -path.pointAt(34.5 / 40, V3()).y;
    await ctx.yield();
    // The route's centreline at every metre, for the hero: its nine streamers keep 4.5 m from this line over all their fall
    // and drift (hero "STREAMERS"). Read off the path as it lies; nothing of the route is changed for it.
    const routeLine = new Float32Array((Math.ceil(path.length) + 1) * 3);
    for (let i = 0, q = V3(); i * 3 < routeLine.length; i++) { path.posAtDist(Math.min(i, path.length), q); routeLine[i * 3] = q.x; routeLine[i * 3 + 1] = q.y; routeLine[i * 3 + 2] = q.z; }
    await ctx.yield();

    // ---- the hero: straight reach, brink, moulin, plume. World space is its local space.
    const hero = await buildHero({ ...ctx, rng: rng.fork('hero') }, {
      palette: PALETTE, sunDir, sunColor: mood.sunCol, skyColor: mood.skyCol, apron: false, season, portalColor: '#A8F0FF', conduitDepth, route: routeLine,
    });
    const U = hero.uniforms, A = hero.anchors, kit = hero.kit;
    U.uSunCol.value.multiplyScalar(mood.sunK / 1.15); U.uSkyCol.value.multiplyScalar(mood.skyK / 0.8);
    U.uDrift.value *= mood.drift; U.uLitY.value = L_LAKE - 0.4; U.uShaftFog.value = 0.0034;
    U.uWarm.value = mood.warm ?? 1; U.uDriftH.value = mood.driftH || 0;
    if (mood.plumeTint) U.uPlumeTint.value.set(mood.plumeTint).multiplyScalar(mood.plumeK || 1);
    if (mood.plumeShade) { U.uPlumeShade.value.set(mood.plumeShade); U.uPlumeSide.value = mood.plumeSide || 0; }      // low sun: a blue-violet shade flank, darker than the pale sky behind it
    if (mood.foamTint) U.uFoamTint.value.set(mood.foamTint).multiplyScalar(mood.foamK || 1);
    if (mood.plumeKnee) U.uPlumeKnee.value = mood.plumeKnee;
    U.uUpGlow.value = mood.upGlow || 0;      // twilight: the luminous water lights the canyon from below, the aurora rims what faces the sky
    const Y = () => ctx.yield();
    scene.add(hero.object);
    await ctx.yield();

    // ---- 4d. flight tables and gaze
    // centreline metres of the camera for every 2 m of path (sTab), and back (dOfS)
    const nTab = Math.ceil(path.length / 2) + 1, sTab = new Float32Array(nTab), tp = V3();
    let dLip = -1;
    for (let i = 0; i < nTab; i++) {
      const d = Math.min(i * 2, path.length); path.posAtDist(d, tp);
      if (dLip >= 0) sTab[i] = S_LIP + (d - dLip);
      else if (Z0 - tp.z < 95) sTab[i] = Z0 - tp.z;
      else { sTab[i] = Math.max(plan.nearest(tp.x, tp.z).s, i ? sTab[i - 1] : 0); if (tp.z <= 0.5) { dLip = d; sTab[i] = S_LIP; } }
      if (i % 80 === 79) await ctx.yield();
    }
    const sOfU = (u) => { const f = clamp(u, 0, 1) * path.length / 2, i = Math.min(Math.floor(f), nTab - 2); return lerp(sTab[i], sTab[i + 1], f - i); };
    const dOfS = (s) => { for (let i = 1; i < nTab; i++) if (sTab[i] >= s) return (i - 1 + (s - sTab[i - 1]) / Math.max(sTab[i] - sTab[i - 1], 1e-4)) * 2; return path.length; };
    const uS = (s) => clamp(dOfS(s) / path.length, 0, 1);

    // where the staged things stand (centreline metres)
    const B = plan.bends;
    const sCable = 166, sBridge = [B[1].s0 + 25, B[2].mid + 4, B[4].s0 + 3], bridgeLen = [7, 9.5, 14];
    const sFall = [B[1].s0 + B[1].L - 2, B[3].s0 + 16, B[4].mid + 6], fallSide = [1, 1, -1];      // inside wall of bends 2, 4, 5
    const sSlab = B[3].s0 + 22, slabSide = -1;                                                // outside (left) wall of bend 4, dead ahead out of bend 3
    const sSlabGo = sSlab - 35, sSlabHit = sSlab - 19;                                        // camera s when it starts / lands
    const sBlock = sBridge[2] - bridgeLen[2] / 2 - 0.5, sBlockGo = sBlock - 40, sBlockHit = sBlock - 20;
    const sFell = sBlockGo + 16;                                                              // rare event: camera s when the whole bridge meets the water
    const wallPoint = (s, lat, y, out = V3()) => { plan.at(s, pc); return out.set(pc.x + pc.rx * lat, y, pc.z + pc.rz * lat); };
    const plumeMid = A.plumeBase.clone().lerp(A.plumeTop, 0.45);
    const pois = [
      { at: plumeMid, from: uS(B[1].mid - 24), to: uS(B[1].mid + 14), weight: 0.4 },
      { at: wallPoint(sSlab, slabSide * 3.0, waterY(sSlab) + 2.8), from: uS(sSlabGo - 22), to: uS(sSlab - 9), weight: 0.55 },
      { at: wallPoint(sBlock, 0, waterY(sBlock) + 2.2), from: uS(sBlockGo - 4), to: uS(sBlock - 10), weight: 0.45 },
      // the far wall's sunlit crescent holds the gaze up through the brink, so the view tips over with the water and not before it
      { at: A.farWallCrescent.clone(), from: uS(S_LIP - 70), to: uS(S_LIP + 20), weight: 0.45 },
    ];
    await ctx.yield();

    // ---- 4e. sky, fog, the weather bank ahead, nunataks
    const sky = makeSky({ rng: rng.fork('sky'), ...mood.sky, sunElevation: mood.sunEl, sunAzimuth: mood.sunAz, renderer: ctx.renderer });
    // KIT WORKAROUND: the kit dome is a fan whose apex sits exactly at the zenith. When the view direction is exactly
    // horizontal (the level lake leg, and the camera that looks in through the portal) that apex lands on w = 0 and the
    // whole fan draws flat horizon colour. The kit lets a world swap the dome's geometry: a skewed box has no vertex
    // on the vertical axis, and the full material already shades below the horizon, so the lower fan is switched off.
    {
      const g = new THREE.BoxGeometry(400, 400, 400); g.rotateX(0.37); g.rotateY(0.53); g.rotateZ(0.21);
      sky.object.geometry.dispose(); sky.object.geometry = g;
      for (const c of sky.object.children) if (c.name === 'skyLower') c.visible = false;
    }
    scene.add(sky.object);
    await ctx.yield();
    const hazeCol = new THREE.Color(mood.haze);
    scene.fog = new THREE.FogExp2(hazeCol.clone(), mood.fog);
    const bank = new THREE.Mesh(new THREE.CylinderGeometry(6000, 6000, 947, 48, 1, true, Math.PI - 1.745, 3.49), new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uBank: { value: new THREE.Color(mood.bank) }, uBankTop: { value: new THREE.Color(mood.bankTop) }, uHaze: { value: hazeCol.clone() } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = vec2(uv.x*2.0 - 1.0, uv.y); gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
      fragmentShader: BANK_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    }));
    bank.frustumCulled = false; bank.renderOrder = -1; scene.add(bank);
    let cirrus = null;
    if (mood.cirrus) {
      cirrus = new THREE.Mesh(new THREE.SphereGeometry(5200, 32, 10, 0, Math.PI * 2, 0.25, 1.25), new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uCover: { value: mood.cirrus[0] }, uLit: { value: new THREE.Color(mood.cirrus[1]) }, uShade: { value: new THREE.Color(mood.cirrus[2]) } },
        vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
        fragmentShader: 'varying vec3 vDir; uniform float uTime, uCover; uniform vec3 uLit, uShade;\n' + HASH_GLSL + CIRRUS_FRAG_BODY,
        transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
      }));
      cirrus.frustumCulled = false; cirrus.renderOrder = -2; cirrus.name = 'cirrus'; scene.add(cirrus);
    }
    {
      // three dark teeth (and a fourth, lower) that stand clear above the weather bank: tall enough to break its skyline,
      // and drawn without the scene fog (a quarter of the haze is mixed into their colour instead) so they stay dark
      const bag = makeBag(), teeth = [[-1500, -1700, 330], [1250, -2100, 270], [1900, -2000, 150], [-2300, -1500, 135]];
      const toothCol = new THREE.Color('#0b0b10').lerp(new THREE.Color(mood.haze), 0.36);
      const massif = [];                                          // each tooth is a peak with two shoulders, not a lone pyramid
      for (const [x, z, h] of teeth) massif.push([x, z, h], [x + h * 0.75, z + h * 0.3, h * 0.56], [x - h * 0.6, z - h * 0.2, h * 0.4]);
      for (const [x, z, h] of massif) {
        const g = new THREE.ConeGeometry(h * 0.62, h, 9, 6), p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
          const y = p.getY(i), k = 0.75 + 0.75 * nz.n3(p.getX(i) * 0.012 + x, y * 0.03, p.getZ(i) * 0.012);
          p.setXYZ(i, p.getX(i) * k * 1.5, y + h * 0.18 * nz.n2(p.getX(i) * 0.013 + z, p.getZ(i) * 0.013), p.getZ(i) * k * 0.8);
        }
        g.computeVertexNormals();
        bag.add(g, TRS(x, sheetBase(z) + h * 0.42, z), toothCol);
        await ctx.yield();
      }
      const m = new THREE.Mesh(bag.build(), makePaint(U, { side: THREE.FrontSide, fog: false })); m.name = 'nunataks'; scene.add(m);
      m.material.uniforms.uDay.value = 0.62;
    }
    await ctx.yield();

    // ---- 4f. the ice sheet: one warped grid, fine round the lake and the canyon, coarse to the horizon
    const axisPts = (segs, grow, far) => {
      const a = [segs[0][0]];
      for (const [f, t, st] of segs) { const n = Math.round((t - f) / st); for (let i = 1; i <= n; i++) a.push(f + ((t - f) * i) / n); }
      let st = segs[segs.length - 1][2], v = a[a.length - 1];
      while (v < far) { st *= grow; v += st; a.push(v); }
      st = segs[0][2]; v = a[0];
      while (v > -far) { st *= grow; v -= st; a.unshift(v); }
      return a;
    };
    const mouth = A.mouth, zHead = plan.at(90, pc).z;
    const lakeDeep = moodKey === 'twilight' ? '#0B43AE' : '#0A3CA6';
    // the lake's body colour as the kit shades deep water (a little of the shallow turquoise and of the sky in it)
    const deepBed = new THREE.Color(lakeDeep).lerp(new THREE.Color('#5FD6E4'), 0.12).multiply(U.uSkyCol.value.clone().multiplyScalar(1.6).add(U.uSunCol.value.clone().multiplyScalar(0.15))).add(U.uSkyCol.value.clone().multiplyScalar(0.06));
    const lakeBed = (x, z) => { const d = lakeIn(x, z); return d <= 0 ? 0 : Math.min(3.2, d * 0.11) + 1.9 * Math.exp(-(((x - X0) / 10) ** 2)) * smoothstep(0, 7, d) * smoothstep(-50, 25, Z0 - z); };
    {
      const xs = axisPts([[-165, -40, 5], [-40, 40, 2.5], [40, 165, 5]], 1.28, 7000);
      const zs = axisPts([[-100, Z0 - 110, 5], [Z0 - 110, Z0 - 55, 2.5], [Z0 - 55, Z0 + 100, 5]], 1.28, 7000);
      const nx = xs.length, nzz = zs.length, pos = new Float32Array(nx * nzz * 3), geo = new Float32Array(nx * nzz * 4);
      for (let j = 0; j < nzz; j++) {
        const z = zs[j];
        for (let i = 0; i < nx; i++) {
          const x = xs[i], q = j * nx + i;
          let dC, sN;
          if (Math.abs(x) < 140 && z > -40 && z < zHead + 30) { const nr = plan.nearest(x, z); dC = nr.d; sN = nr.s; }
          else { const zc = clamp(z, 0, zHead); dC = Math.hypot(x, z - zc); sN = S_LIP - zc; }
          const dM = Math.max(0, Math.hypot(x / mouth.halfX, (z - mouth.center.z) / mouth.halfZ) - 1) * 20;
          const dAll = Math.min(dC, dM + 8);
          let y = sheetBase(z) + 0.35 * nz.fbm2(x * 0.02, z * 0.02, 3) * smoothstep(14, 60, dAll) + 1.6 * nz.fbm2(x * 0.004 + 9, z * 0.004, 2) * smoothstep(60, 240, dAll);
          const rFar = Math.hypot(x, z - 250);
          if (rFar > 500) y += 16 * nz.fbm2(x * 0.0008 + 3, z * 0.0008 + 7, 2) * smoothstep(500, 2600, rFar) + 120 * smoothstep(700, 4800, -z) * (0.75 + 0.25 * nz.n2(x * 0.0004, 5));
          if (dC < 30) y = lerp(rimY(sN) - 0.06, y, smoothstep(12, 30, dC));
          if (dM < 30) y = lerp(sheetBase(z) - 0.06, y, smoothstep(6, 30, dM));
          let dIn = -50;
          if (Math.abs(x - X0) < 200 && Z0 - z > -100 && Z0 - z < 112) {
            dIn = clamp(lakeIn(x, z), -50, 50);
            if (dIn > 0) y = L_LAKE - lakeBed(x, z);
            else if (dIn > -40) {
              const bankH = 1.3 + 1.3 * (0.5 + 0.5 * nz.fbm2(x * 0.045 + 7, z * 0.045, 2)) + 1.6 * Math.max(0, nz.n2(x * 0.021, z * 0.021 + 3)) * smoothstep(0, 14, -dIn);
              y = L_LAKE + Math.min(Math.max(y - L_LAKE, bankH) , -dIn * 1.1) * (dC < 16 ? smoothstep(9, 16, dC) * 0.6 + 0.4 : 1);
              if (dC < 30) y = Math.min(y, lerp(rimY(sN) - 0.06, y, smoothstep(12, 30, dC)));
            }
          }
          pos[q * 3] = x; pos[q * 3 + 1] = y; pos[q * 3 + 2] = z;
          geo[q * 4] = sN >= 97 ? dC - 8.2 * halfW(sN) / 7 : 60; geo[q * 4 + 1] = dIn; geo[q * 4 + 2] = sN; geo[q * 4 + 3] = dC;
        }
        await ctx.yield();
      }
      const idx = [];
      for (let j = 0; j < nzz - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
        if (geo[a * 4] < -2 && geo[b * 4] < -2 && geo[c * 4] < -2 && geo[d * 4] < -2) continue;
        idx.push(a, c, b, b, c, d);
      }
      await ctx.yield();
      // the same normals computeVertexNormals gives for these triangles, a few rows at a time
      const cut = (a, b, c, d) => !(geo[a * 4] < -2 && geo[b * 4] < -2 && geo[c * 4] < -2 && geo[d * 4] < -2);
      const nrm = await runStepsAsync(gridNormalSteps(pos, nx - 1, nzz - 1, 16, cut), Y);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('aGeo', new THREE.BufferAttribute(geo, 4));
      g.setIndex(idx);
      await ctx.yield();
      const lakes = [[-420, 40, 95, 60], [540, -260, 130, 75], [-760, -1500, 190, 120], [420, -2300, 230, 140]].map((l) => new THREE.Vector4(l[0], l[1], l[2], l[3]));
      const sheet = new THREE.Mesh(g, new THREE.ShaderMaterial({
        fog: true,
        uniforms: Object.assign({}, THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
          uTime: U.uTime, uSun: U.uSun, uSunCol: U.uSunCol, uSkyCol: U.uSkyCol, uSnow: U.uSnow, uTurq: U.uTurq, uCobalt: U.uCobalt, uElectric: U.uElectric,
          uCryo: U.uCryo, uMauve: U.uMauve, uSeason: U.uSeason, uLate: U.uLate, uMouth: U.uMouth, uLake: { value: L_LAKE }, uSunK: { value: 0.95 },
          uLakes: { value: lakes }, uCrev: { value: V3(650, 150, 380) }, uDeepBed: { value: deepBed },
        }),
        vertexShader: SHEET_VERT, fragmentShader: SHEET_FRAG,
      }));
      sheet.name = 'ice-sheet'; sheet.frustumCulled = false; scene.add(sheet);
    }
    await ctx.yield();

    // ---- 4g. the melt lake: kit lake over the terrain bowl; it thins out over the outlet where the river takes over
    const light = Water.waterLight(sky);
    const bankCol = new THREE.Color(mood.bank), shoreCol = new THREE.Color('#C8DCEC');
    // The lake's grid exactly as the kit would build it from depthAt (kit/water.js surfaceGeometry: depth, distance to
    // the shore, dry triangles dropped), but here, in slices, because 5.6k depth lookups in one kit call is a long step.
    const lakeGeo = new THREE.PlaneGeometry(344, 206, 96, 57); lakeGeo.rotateX(-Math.PI / 2);
    {
      const cx = X0, cz = Z0 - 5, n = 96, nq = 57, W1 = n + 1, sx = 344 / n, sz = 206 / nq, pos = lakeGeo.attributes.position;
      const dep = new Float32Array(pos.count), shore = new Float32Array(pos.count);
      const depthAt = (x, z) => { const d = lakeDepth(x, z); return d > 0 ? d * (1 - smoothstep(90, 100.5, Z0 - z)) - (Z0 - z > 100 ? 1 : 0) : d; };
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) + cx, z = pos.getZ(i) + cz; pos.setX(i, x); pos.setZ(i, z); dep[i] = depthAt(x, z);
        if (i % 100 === 99) await ctx.yield();
      }
      await ctx.yield();
      for (let j = 0; j <= nq; j++) for (let i = 0; i <= n; i++) {
        const k = j * W1 + i, i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nq, j + 1);
        const gx = (dep[j * W1 + i1] - dep[j * W1 + i0]) / ((i1 - i0) * sx), gz = (dep[j1 * W1 + i] - dep[j0 * W1 + i]) / ((j1 - j0) * sz);
        shore[k] = Math.max(-50, Math.min(500, dep[k] / Math.max(0.03, Math.hypot(gx, gz))));
      }
      await ctx.yield();
      lakeGeo.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1)); lakeGeo.setAttribute('aShore', new THREE.BufferAttribute(shore, 1));
      const src = lakeGeo.index.array, wet = [];
      for (let i = 0; i < src.length; i += 3) if (dep[src[i]] > 0 || dep[src[i + 1]] > 0 || dep[src[i + 2]] > 0) wet.push(src[i], src[i + 1], src[i + 2]);
      lakeGeo.setIndex(wet); lakeGeo.computeBoundingSphere();
      await ctx.yield();
    }
    const lake = Water.makeLake({
      rng: rng.fork('lake'), light, level: L_LAKE, center: [X0, Z0 - 5], width: 344, depth: 206, segments: 96, geometry: lakeGeo,
      deep: lakeDeep, shallow: '#5FD6E4', ripple: 2.6, windAngle: 0.25, reflectivity: moodKey === 'twilight' ? 0.6 : 0.42, clarity: 0.55, shoreFoam: 0.7, foamWidth: 2.2,
      // what the lake mirrors at grazing angles: the slate weather bank ahead (by day it stands a little taller in the
      // mirror than in the sky and is mirrored almost whole, so the far water stays dark blue and the plume stands on it)
      skyline: (a) => { const w = smoothstep(0.42, 0.8, -Math.sin(a)), tw = moodKey === 'twilight'; return { elevation: (tw ? 0.5 + 3.6 * w : 1.6 + 4.4 * w) * DEG, distance: 2500, color: shoreCol.clone().lerp(bankCol, tw ? w : 0.35 + 0.65 * w) }; },
      band: { color: mood.bank, top: mood.bank, amount: moodKey === 'twilight' ? 0.6 : 0.9 },
    });
    lake.object.name = 'lake'; scene.add(lake.object);
    {
      // a floor of the same deep colour 4 m under the deepest bed: the portal camera's lowest rays pass under the bed
      // (its near plane is the opening) and used to end in the void as a black speck at the foot of the opening
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(170, 176).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: deepBed, fog: false }));
      fl.position.set(X0, L_LAKE - 6.6, Z0); fl.name = 'lake-floor'; scene.add(fl);
    }
    await ctx.yield();
    {
      // break-up of the lake surface: foam lines that follow the streamlines into the outlet, and drifting slush bands
      const rows = [], nu = 28; for (let s = -14; s <= 100; s += 2) rows.push(s);
      const P = [], Q = [], I = [];
      for (const s of rows) { const w = shoreW(s) + 4; for (let i = 0; i <= nu; i++) { const a = (i / nu) * 2 - 1; P.push(X0 + a * w, L_LAKE + 0.012, Z0 - s); Q.push(a, s, w); } }
      for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 3)); g.setIndex(I);
      const slush = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uCol: { value: U.uSnow.value.clone().multiply(U.uSunCol.value.clone().multiplyScalar(0.42).add(U.uSkyCol.value.clone().multiplyScalar(0.75))) },
          // wind ripple by the bow: the lit facet (water blue under this sky), the dark one (deep lake), the glint (sun)
          uRipLit: { value: U.uElectric.value.clone().lerp(U.uTurq.value, 0.25).multiply(U.uSkyCol.value.clone().multiplyScalar(1.7).add(U.uSunCol.value.clone().multiplyScalar(0.3))) },
          uRipDark: { value: new THREE.Color(lakeDeep).multiply(U.uSkyCol.value.clone().multiplyScalar(0.55)) },
          uGlint: { value: U.uSunCol.value.clone().multiplyScalar(moodKey === 'twilight' ? 0.5 : 1.3) } },
        transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: 'attribute vec3 aQ; varying vec3 vQ; varying vec3 vW; void main(){ vQ = aQ; vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
        fragmentShader: /* glsl */`
varying vec3 vQ; varying vec3 vW; uniform float uTime; uniform vec3 uCol, uRipLit, uRipDark, uGlint;
${HASH_GLSL}
void main(){
  float flow = vQ.y - uTime*2.4, W = vQ.z; vec2 m = vec2(vQ.x*W, flow);
  // foam lines: many and thin (about 12 cm, whatever the lake's width here), converging on the outlet with the streamlines
  float la = vQ.x*26.0 + 0.9*wNoise(vec2(vQ.x*5.0, flow*0.045)) + 0.3*wNoise(vec2(vQ.x*11.0 + 3.0, flow*0.17));
  float aw = fwidth(la), d = abs(fract(la) - 0.5), wl = clamp(1.6/max(W, 4.0), 0.02, 0.2);
  float line = (1.0 - smoothstep(wl + aw*0.5, wl*2.0 + aw*1.5, d))*(wl*2.0/(wl*2.0 + aw*1.5));
  line *= smoothstep(3.0, 10.0, abs(vQ.x*W));                    // none beside the drifter, where one reads as a ruled stripe
  line *= smoothstep(0.4, 0.58, wNoise(vec2(floor(la)*7.3, flow*0.06)))*(0.4 + 0.6*wNoise(vec2(la*9.0, flow*1.3)))
    *smoothstep(0.22, 0.62, wNoise(vec2(la*2.3, flow*0.42)));     // torn into dashes, never a ruled stripe
  // slush: fields of pancake pieces 2-4 m across with dark leads between them, in bands that drift to the outlet
  float nearK = 1.0 - smoothstep(4.0, 16.0, abs(m.x));
  float zone = smoothstep(0.55 - 0.1*nearK, 0.66 - 0.1*nearK, wFbm(vec2(m.x*0.11, m.y*0.022)));
  vec2 pq = m*0.34 + 0.35*vec2(wNoise(m*0.21), wNoise(m*0.21 + 7.0));
  float caa = fwidth(pq.x) + fwidth(pq.y);
  vec2 pi = floor(pq), pf = fract(pq), pid = vec2(0.0); float d1 = 9.0, d2 = 9.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); vec2 c = o + 0.15 + 0.7*vec2(wHash(pi + o), wHash(pi + o + 17.3)) - pf; float d = dot(c, c);
    if (d < d1) { d2 = d1; d1 = d; pid = pi + o; } else if (d < d2) { d2 = d; }
  }
  float edgeD = sqrt(d2) - sqrt(d1);                              // 0 on the lead between two pieces
  float cake = smoothstep(0.05 + caa*0.25, 0.2 + caa*0.5, edgeD)*step(0.3, wHash(pid + 3.0));
  // wind ripple glints
  vec2 gc = vec2(m.x*1.7, m.y*0.8); float gh = wHash(floor(gc));
  float glint = step(0.8, gh)*pow(max(sin(uTime*(2.0 + 4.0*gh) + gh*60.0), 0.0), 6.0)*(1.0 - smoothstep(0.08, 0.4, length((fract(gc) - 0.5)*vec2(0.45, 1.0))))
    *(1.0 - smoothstep(0.25, 0.9, fwidth(gc.y)));
  // waterlogged rims, paler middles; far away the pieces melt into a thin even band; none in the drifter's own lane
  float piece = cake*(0.5 + 0.5*smoothstep(0.2, 0.45, edgeD))*(0.7 + 0.3*wHash(pid + 9.0))*(0.8 + 0.2*wNoise(m*3.0));
  piece = mix(0.36, piece, 1.0 - smoothstep(1.2, 3.0, caa));
  float a = clamp(line*0.34 + zone*piece*0.66*smoothstep(2.3, 4.3, abs(m.x)) + glint*0.5, 0.0, 0.85);
  float mask = (1.0 - smoothstep(0.86, 1.0, abs(vQ.x)))*smoothstep(-14.0, -4.0, vQ.y)*(1.0 - smoothstep(92.0, 100.0, vQ.y));
  a *= mask;
  // WIND RIPPLE BY THE BOW (the lower third of the frame is the water within five metres of the lens): crests about
  // half a metre apart running across the wind with a finer set riding them, shaded as facets: the lee faces take the sky,
  // the windward faces go deep, and the sharpest lee faces spark in the sun. Each octave fades before it can alias.
  float dW = length(cameraPosition - vW);
  float nearR = (1.0 - smoothstep(10.0, 26.0, dW))*smoothstep(0.5, 1.6, dW)*mask;
  vec2 rw = vec2(vW.x*0.5 - vW.z*0.866, vW.x*0.866 + vW.z*0.5);                // along and across the wind (it quarters the bow, so the crests lie across the gaze)
  vec2 r1 = vec2(rw.x*2.5 - uTime*2.4, rw.y*0.42 + 0.5*wNoise(rw*0.3)), r2 = vec2(rw.x*6.6 - uTime*4.6, rw.y*1.1 + 4.0);      // drawn out 6:1 across the wind: facets, not spots
  float k1 = 1.0 - smoothstep(0.35, 1.1, fwidth(r1.x) + fwidth(r1.y)), k2 = 1.0 - smoothstep(0.35, 1.1, fwidth(r2.x) + fwidth(r2.y));
  float sl = (wNoise(r1 + vec2(0.16, 0.0)) - wNoise(r1))*5.0*k1 + (wNoise(r2 + vec2(0.3, 0.0)) - wNoise(r2))*2.6*k2;
  float patchK = 0.45 + 0.55*smoothstep(0.3, 0.65, wNoise(rw*0.11 + vec2(uTime*0.05, 3.0)));      // cat's paws: the ripple comes in patches
  float aL = smoothstep(0.34, 0.6, sl)*0.3*nearR*patchK, aD = smoothstep(0.4, 0.7, -sl)*0.2*nearR*patchK;
  // dark leads between the pancake pieces: thin lines, only inside the slush fields
  aD = max(aD, zone*zone*(1.0 - smoothstep(0.012 + caa*0.1, 0.07 + caa*0.3, edgeD))*(1.0 - smoothstep(1.2, 3.0, caa))*smoothstep(2.3, 4.3, abs(m.x))*0.42*mask);
  vec2 sc = vec2(rw.x*6.0 - uTime*4.2, rw.y*2.2); float sh = wHash(floor(sc));
  float spark = step(0.62, sh)*pow(max(sin(uTime*(3.0 + 5.0*sh) + sh*70.0), 0.0), 8.0)*(1.0 - smoothstep(0.05, 0.24, length(fract(sc) - 0.5)))
    *smoothstep(0.3, 0.7, sl)*nearR*(1.0 - smoothstep(0.3, 1.0, fwidth(sc.x) + fwidth(sc.y)));
  vec4 rip = vec4(uRipLit*aL + uRipDark*aD, aL + aD);
  gl_FragColor = vec4(uCol*a + rip.rgb*(1.0 - a) + uGlint*spark*1.5, a + rip.a*(1.0 - a));
}`,
      }));
      slush.renderOrder = 1; slush.frustumCulled = false; slush.name = 'lake-slush'; scene.add(slush);
    }
    await ctx.yield();

    // ---- 4h. the canyon: chute and meanders in the hero's own ice, water and spindrift
    const stations = [];
    const station = (s) => { plan.at(s, pc); return { s, x: pc.x, z: pc.z, tx: Math.sin(pc.th), tz: -Math.cos(pc.th), water: waterY(s), rim: rimY(s), half: halfW(s) }; };
    for (let s = 97; s < S_REACH - 0.3; s += 0.7) stations.push(station(s));
    stations.push(station(S_REACH));
    const cornice = season === 'early' ? 1.5 : season === 'late' ? 0.6 : 1;
    const wallMat = kit.makeIceMaterial('wall'), wallGeo = [], icicles = [], np = kit.profile.length, ir = rng.fork('icicles');
    for (const side of [1, -1]) {
      const g = await kit.buildCanyonWallAsync({ stations, side, noise: nz, sunDir, cornice, alongStart: -(S_REACH - 97) }, Y);
      const m = new THREE.Mesh(g, wallMat); m.name = side > 0 ? 'meander-wall-right' : 'meander-wall-left'; scene.add(m); wallGeo.push(g);
      const p = g.attributes.position;
      for (let i = 3; i < stations.length - 3; i++) {
        const st = stations[i], a = i * 0.7 * side + (side > 0 ? 0 : 300);
        if (st.rim - st.water < 3.2 || nz.n2(a * 0.09, 12) < -0.15 || ir() > 0.36 * detail) continue;
        const ox = -st.tz * side, oz = st.tx * side, q = i * np + 13, off = ir.range(0.02, 0.3);
        const len = Math.min(2.4, 0.35 + Math.abs(ir.gauss()) * 0.75) * (0.7 + 0.5 * Math.max(0, nz.n2(a * 0.05, 30)));
        icicles.push([p.getX(q) + ox * off, p.getY(q) + 0.12, p.getZ(q) + oz * off, len, -ox * sunDir.x - oz * sunDir.z > 0.2 ? 1 : 0]);
      }
      await ctx.yield();
    }
    {
      // river ribbon in the hero's water shader: aFlow = (u, metres from the head of the straight reach, 0, tau)
      const rows = []; for (let s = 86; s < S_REACH - 0.4; s += 0.8) rows.push(s); rows.push(S_REACH);
      const nu = 20, nv = rows.length - 1, pos = new Float32Array((nu + 1) * (nv + 1) * 3), nrm = new Float32Array((nu + 1) * (nv + 1) * 3), fl = new Float32Array((nu + 1) * (nv + 1) * 4), idx = [];
      for (let j = 0; j <= nv; j++) {
        const s = rows[j], half = 8.4 * halfW(s) / 7, tn = plan.turn(s), wy = s < S_CHUTE ? L_LAKE - 0.12 * smoothstep(100, 92, s) - 0.02 : waterY(s);
        plan.at(s, pc);
        for (let i = 0; i <= nu; i++) {
          const u = (i / nu) * 2 - 1, q = j * (nu + 1) + i, lat = u * half;
          const ramp = 0.32 * Math.sin(s * 0.8 + 0.5 * u * u) * bell(s, 104, 162, 0.3) * (1 - u * u);
          pos[q * 3] = pc.x + pc.rx * lat; pos[q * 3 + 1] = wy - 0.6 * tn * u + ramp; pos[q * 3 + 2] = pc.z + pc.rz * lat;
          nrm[q * 3 + 1] = 1;
          fl[q * 4] = u; fl[q * 4 + 1] = s - S_REACH; fl[q * 4 + 2] = 0; fl[q * 4 + 3] = (s - S_REACH) / 16;
        }
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setAttribute('aFlow', new THREE.BufferAttribute(fl, 4));
      g.setIndex(idx);
      const mat = kit.makeWaterMaterial(); mat.side = THREE.DoubleSide;
      const river = new THREE.Mesh(g, mat); river.name = 'meander-river'; river.frustumCulled = false; scene.add(river);
    }
    await ctx.yield();
    {
      // spindrift ribbons: off the left (windward) rim into the slot, and streaming away from the right rim
      const P = [], R = [], I = [];
      const ribGaps = [[sBridge[0], bridgeLen[0]], [sBridge[1] + 2.5, bridgeLen[1] + 9], [sBridge[2], bridgeLen[2]]];
      if (season === 'early') ribGaps.push([B[0].s0 + 16, 5], [B[2].s0 + 9, 5.5]);
      const strip = (rows, seed) => {
        const base = P.length / 3, nu = rows[0].length - 1;
        for (const r of rows) for (const q of r) { P.push(q[0], q[1], q[2]); R.push(q[3], q[4], seed, q[5]); }
        for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, c, b, b, c, d); }
      };
      for (let layer = 0; layer < 2; layer++) {
        const lift = layer * 0.7, sd = rng(), left = [], right = [];
        for (let s = 122; s <= S_REACH; s += 2.5) {
          plan.at(s, pc); const k = halfW(s) / 7, rim = rimY(s), v = S_REACH - s + 113 + layer * 31, rl = [], rr = [];
          // no ribbon over a snow bridge: seen from the water its sagging edge was a pale ghost arc across the bridge's underside
          let fb = 1; for (const [bs, bl] of ribGaps) fb *= smoothstep(bl / 2 + 2.5, bl / 2 + 8, Math.abs(s - bs));
          for (let i = 0; i <= 7; i++) {
            const u = i / 7, la = (-14 + 16.5 * u) * k, lb = (5.5 + 13 * u) * k;
            rl.push([pc.x + pc.rx * la, rim + 0.8 + lift + 0.7 * Math.sin(Math.PI * u * 0.75) - 5.2 * Math.pow(Math.max(u - 0.55, 0) / 0.45, 1.8), pc.z + pc.rz * la, u, -v, fb]);
            rr.push([pc.x + pc.rx * lb, rim + 0.9 + lift + 1.6 * u, pc.z + pc.rz * lb, u * 0.9, v + 200, fb]);
          }
          left.push(rl); right.push(rr);
        }
        strip(left, sd); strip(right, sd + 0.37);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aRib', new THREE.Float32BufferAttribute(R, 4)); g.setIndex(I);
      const dm = kit.makeDriftMaterial(); dm.uniforms.uDrift = { value: U.uDrift.value };
      const drift = new THREE.Mesh(g, dm); drift.renderOrder = 3; drift.frustumCulled = false; drift.name = 'meander-spindrift'; scene.add(drift);
    }
    if (mood.groundDrift) {
      // ground blizzard: a low gold river of snow streaming across the lake and its banks, in three sheets that the
      // eye looks along, so the far shore and the rims dissolve in it
      const P = [], I = [], x0 = X0 - 150, x1 = X0 + 150, z0 = Z0 - 190, z1 = Z0 + 40, nx = 12, nzz = 10;
      for (let l = 0; l < 3; l++) {
        const base = P.length / 3, y = L_LAKE + [0.3, 1.9, 3.6][l];
        for (let j = 0; j <= nzz; j++) for (let i = 0; i <= nx; i++) P.push(lerp(x0, x1, i / nx), y + 0.25 * Math.sin(i * 1.7 + j * 2.3 + l), lerp(z0, z1, j / nzz));
        for (let j = 0; j < nzz; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; I.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
      const gd = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uCol: { value: U.uGold.value.clone().multiply(U.uSunCol.value).multiplyScalar(0.5).add(U.uSnow.value.clone().multiplyScalar(0.12)) } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
        vertexShader: 'varying vec3 vW; void main(){ vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
        fragmentShader: /* glsl */`
varying vec3 vW; uniform float uTime; uniform vec3 uCol;
${HASH_GLSL}
void main(){
  float dist = length(cameraPosition - vW);
  float lodz = 1.0 - smoothstep(0.3, 1.2, fwidth(vW.z)*0.9);
  float n = wFbm(vec2(vW.x*0.035 - uTime*0.55, vW.z*0.21 + vW.y*3.0));
  float fine = mix(0.5, wNoise(vec2(vW.x*0.16 - uTime*1.9, vW.z*0.9)), lodz);
  float a = smoothstep(0.3, 0.72, n*0.75 + fine*0.4)*smoothstep(1.5, 9.0, dist)*(1.0 - smoothstep(260.0, 420.0, dist));
  gl_FragColor = vec4(uCol*a, 1.0);
}`,
      }));
      gd.renderOrder = 3; gd.frustumCulled = false; gd.name = 'ground-drift'; scene.add(gd);
    }
    await ctx.yield();

    // ---- 4i. snow bridges (thick drifted plugs with scalloped blue undersides) and tributary falls
    const bridgeGeo = (list, addIcicles) => {
      const NV = 16, NA = 24, P = [], Sf = [], Ic = [], I = [];
      for (const b of list) {
        const base = P.length / 3, pw = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
        // (b.arch: how far the underside springs down toward the walls. The great arch springs from low on both walls.)
        const under = (ss, v, al) => waterY(ss) + b.h - (b.arch ? b.arch * (0.5 * v * v + 0.5 * v * v * v * v) : 1.5 * v * v * v * v) + 0.3 * nz.n2(ss * 0.5, v * 3 + 9) + 0.7 * (al / (b.len / 2)) ** 2;
        for (let iv = 0; iv <= NV; iv++) {
          const v = (iv / NV) * 2 - 1;
          for (let ia = 0; ia <= NA; ia++) {
            const phi = (ia / NA) * Math.PI * 2, ca = Math.cos(phi), sa = Math.sin(phi);
            const al = (b.len / 2) * pw(ca, 0.6) * (1 + 0.16 * nz.n2(b.s + v * 2.2, ca * 1.5)), ss = b.s + al;
            plan.at(ss, pc); const k = halfW(ss) / 7, lat = v * 7.7 * k;
            const top = rimY(ss) + 0.55 - b.sag * (1 - v * v) + 0.35 * nz.n2(ss * 0.3 + 5, v * 2);
            const un = under(ss, v, al), mid = (top + un) / 2, th = (top - un) / 2, y = mid + th * pw(sa, 0.75);
            P.push(pc.x + pc.rx * lat, y, pc.z + pc.rz * lat);
            Sf.push(ss + v * 3 + 900, y - waterY(ss));
            // SOLID, NOT GLASS. The body of a bridge is drifted snow: smooth and pale, sun-lit on top and on the face that
            // looks at the sun, blue-white in shade. Only its underside is old tunnel roof: scalloped blue ice in shadow
            // with a faint glow (it was lit from inside like the notch, and from the river it read as a pane of glass
            // with the wall showing through). So its outline is pale snow against the banded walls, dark blue below.
            const und = smoothstep(-0.12, -0.5, sa);
            Ic.push(lerp(0.3, 0.42, und), sa > -0.12 ? 40 : 0, lerp(Math.min(Math.max(top - y, 0) * 0.5, 0.3), 2.4 + (top - y) * 0.9, und));
          }
        }
        for (let iv = 0; iv < NV; iv++) for (let ia = 0; ia < NA; ia++) { const a = base + iv * (NA + 1) + ia, c = a + 1, d = a + NA + 1, e = d + 1; I.push(a, c, d, c, e, d); }
        if (addIcicles) {
          // HANGING FRINGES of thin spikes a hand apart, 0.3 to 1.2 m long, long and short in ragged runs: one along the
          // upstream lip of the underside (where the roof turns up into the face, and the melt drips), one along the edge
          // of the opening as the river sees it (just past the roof's lowest line, so from upstream its spikes hang into
          // the bright gap), and a thinner one on the downstream lip, seen from underneath against the sky. Every root is
          // laid ON the ice: its place is worked out from the same section as the mesh (phi round the section), and it is
          // sunk a hand into it, so none stands clear of the lip or floats under it. Scattered over the whole underside,
          // or hung from the level of its lowest line, they were stray pegs. (Short where the lens passes within 5 m: a
          // metre of icicle two metres from the eye was a flat teal blade.)
          // (On the great arch, its rib and bridge 3, seen from 20 m and more, two thirds of the spikes hang from the edge of
          // the opening, up to 1.5 m long, a ragged fringe against the bright gap, and only a third of the upstream lip's
          // are left on the face above: there they were a dotted line of pale ticks across the blue underside. The same
          // draws in the same order: two in three of the upstream lip's spikes are simply hung from the edge instead.)
          const nLip = Math.round((b.len < 5 ? 40 : 62) * detail), far = b.s !== sBridge[0];
          for (let lip0 = -1; lip0 <= 1; lip0++) for (let n = 0, nn = lip0 === 1 ? Math.round(nLip * 0.45) : nLip; n < nn; n++) {
            const lip = far && lip0 === -1 && n % 3 !== 0 ? 0 : lip0;
            const v = lerp(-0.72, 0.72, (n + ir()) / nn), phi = (lip === 0 ? 270 + ir.range(8, 30) : 270 + lip * ir.range(38, 50)) * DEG, ca = Math.cos(phi), sa = Math.sin(phi);
            const al = (b.len / 2) * pw(ca, 0.6) * (1 + 0.16 * nz.n2(b.s + v * 2.2, ca * 1.5)), ss = b.s + al;
            plan.at(ss, pc); const lat = v * 7.7 * halfW(ss) / 7;
            const top = rimY(ss) + 0.55 - b.sag * (1 - v * v) + 0.35 * nz.n2(ss * 0.3 + 5, v * 2);
            const un = under(ss, v, al), uy = (top + un) / 2 + ((top - un) / 2) * pw(sa, 0.75);
            const dLane = Math.hypot(lat - camLat(ss), uy - waterY(ss) - CAM_H);
            const run = 0.5 + 0.5 * nz.n2(v * 5.5 + b.s * 0.7, lip * 3.1 + (lip !== lip0 ? 1.7 : 0));
            const edge = far && lip === 0 ? 1.3 : 1;
            const len = Math.max(0.3, (0.3 + 0.9 * Math.pow(ir(), 1.6)) * (0.5 + 0.6 * run) * edge) * lerp(0.5, 1, smoothstep(2.4, 5.2, dLane));
            icicles.push([pc.x + pc.rx * lat, uy + 0.14, pc.z + pc.rz * lat, Math.min(len, far && lip === 0 ? 1.5 : 1.2), -1]);
          }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSurf', new THREE.Float32BufferAttribute(Sf, 2)); g.setAttribute('aIce', new THREE.Float32BufferAttribute(Ic, 3));
      g.setIndex(I); g.computeVertexNormals();
      if (g.attributes.normal.getY(Math.round(NV / 2) * (NA + 1) + Math.round(NA / 4)) < 0) { for (let i = 0; i < I.length; i += 3) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; } g.setIndex(I); g.computeVertexNormals(); }
      return g;
    };
    // Bridge 2 is THE GREAT ARCH, the landmark of the canyon's middle: 9.5 m of old tunnel roof, 4 m thick at the crown,
    // humped 0.7 m above the rims (its top climbs 0.7 m from where it meets either rim to its crown over mid-stream, and
    // no more: a higher hump roofed the slot over, and there is open sky over the arch and through it)
    // and springing from low on both walls, with a second, thinner rib 9 m beyond it (a slender arch itself, 2 m thick at
    // its crown and high under the rims: as a level slab it hung in the great arch's opening as a dark smooth blob). Between
    // the two the roof has fallen in: the sun comes through that slot as warm god-rays (4k' "sunbeam").
    const sRib = sBridge[1] + 9.3;
    const bridgeList = [{ s: sBridge[0], len: bridgeLen[0], h: 3.9, sag: 0.4 }, { s: sBridge[1], len: 9.5, h: 5.5, sag: -0.7, arch: 3.6 }, { s: sRib, len: 3.6, h: 6.3, sag: 0.9, arch: 2.4 }];
    if (season === 'early') bridgeList.push({ s: B[0].s0 + 16, len: 5, h: 4.1, sag: 0.8 }, { s: B[2].s0 + 9, len: 5.5, h: 4.0, sag: 1.0 });
    const bridges = new THREE.Mesh(bridgeGeo(bridgeList, true), wallMat); bridges.name = 'snow-bridges'; scene.add(bridges);
    await ctx.yield();
    const bridge3 = new THREE.Mesh(bridgeGeo([{ s: sBridge[2], len: bridgeLen[2], h: 3.8, sag: 0.7 }], !rare), wallMat); bridge3.name = 'bridge-3'; bridge3.frustumCulled = false; scene.add(bridge3);
    await ctx.yield();
    const icicleMesh = kit.makeIcicles(icicles, ir); icicleMesh.name = 'meander-icicles'; scene.add(icicleMesh);
    await ctx.yield();

    const falls = [], FALL_W = [2.2, 2.6, 4.0];      // fall 3 is the big one: it has cut the chamber
    for (let i = 0; i < 3; i++) {
      const s = sFall[i], side = fallSide[i]; plan.at(s, pc);
      const lat = side * 4.6 * halfW(s) / 7, top = rimY(s) + 0.6, h = top - waterY(s);
      const f = Water.makeWaterfall({
        rng: rng.fork('fall' + i), light, top: [pc.x + pc.rx * lat, top, pc.z + pc.rz * lat], height: h, width: FALL_W[i],
        dir: [-pc.rx * side, 0, -pc.rz * side], launch: 1.3, rainbow: 0, mistCount: Math.round(110 * detail), mistOpacity: i === 2 ? 0.13 : 0.2,
        tint: U.uElectric.value, color: new THREE.Color(mood.fallCol || '#e6f1f8').multiplyScalar(mood.fallK || 1), lipLength: 1.4, poolSize: 1.2,
        ...(mood.fallMist ? { mistColor: mood.fallMist, mistOpacity: mood.fallMistOp } : {}),
      });
      // The kit's foam pool is a flat sheet 8 cm over the level water: the river's standing waves cut it into a comb, and in
      // grey light it was a flat pale field. It stays hidden (never switched), and the river shader draws the apron on its
      // own surface instead (hero WATER_FRAG "FOAM APRONS"): churned white at the foot, flecks and blue water downstream.
      if (f.pool) f.pool.visible = false;
      // and its smooth translucent sheets read from the river as a pane of glass: hidden too (never switched). The water
      // is the world's own strands (4k' "FALL STRANDS"); the kit keeps the mist.
      if (f.sheets) f.sheets.visible = false;
      U.uPools.value[i].set(f.base.x, f.base.z, FALL_W[i] * 1.15, 1);
      U.uPoolDir.value[i].set(Math.sin(pc.th), -Math.cos(pc.th));
      f.object.name = 'tributary-fall-' + i; scene.add(f.object); falls.push(f);
      await ctx.yield();
    }
    await ctx.yield();

    // ---- 4j. chunks: river rafts, lake floes (both with foam collars), the slab, the bridge block, brash, shaft companions
    const cr = rng.fork('chunks');
    const nRaft = Math.round(64 * density * detail * (season === 'early' ? 1.4 : 1)), nFloe = Math.round(92 * detail), nBrash = 12, nShaft = 6;
    const iSlab = nRaft + nFloe, iBlock = iSlab + 1, iBrash = iBlock + 1, iShaft = iBrash + nBrash, iGate = iShaft + nShaft, nChunk = iGate + 5;
    // each berg is a tilted spire with a lower shoulder leaning on it (and a small block at the left one's foot): no level top
    const GATE = [[-9.7, 85, 4.4, 2.1, 0.17, 0.6, -0.36], [-11.7, 87.6, 2.4, 2.5, -0.2, 1.9, 0.3], [-8.7, 82.0, 1.25, 1.6, 0.32, 2.8, 0.22],
      [8.5, 91, 3.2, 1.85, -0.15, 2.1, 0.32], [10.4, 88.7, 1.8, 2.2, 0.26, 0.4, -0.24]];      // lateral m, lake metre s, height scale, width scale, tilt x, yaw, tilt z
    const chunks = new THREE.InstancedMesh(chunkGeometry(nz, rng.fork('chunk-shape')), kit.makeIceMaterial('raft'), nChunk);
    chunks.frustumCulled = false; chunks.name = 'ice-chunks'; scene.add(chunks);
    await ctx.yield();
    const cp = [];
    for (let i = 0; i < nChunk; i++) cp.push({ a: cr(), lane: cr.range(-1, 1), sz: cr.range(0.45, 1.3), yaw: cr.range(0, 6.28), spin: cr.range(-0.5, 0.5), flat: cr() < 0.55, ph: cr.range(0, 6.28), v: cr.range(1.4, 3.4) });
    const collars = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.1, 3.1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uSnow: U.uSnow, uSkyCol: U.uSkyCol, uSunCol: U.uSunCol, uLitY: U.uLitY },
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: /* glsl */`
varying vec2 vUv; varying float vId; varying float vY;
void main(){
  vec4 wp = modelMatrix*instanceMatrix*vec4(position.x, 0.0, position.z, 1.0); wp.y += 0.04;
  vUv = position.xz/1.55; vId = float(gl_InstanceID); vY = wp.y;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`,
      fragmentShader: /* glsl */`
varying vec2 vUv; varying float vId; varying float vY;
uniform float uTime, uLitY; uniform vec3 uSnow, uSkyCol, uSunCol;
${HASH_GLSL}
void main(){
  float r = length(vUv);
  float ring = smoothstep(0.5, 0.7, r)*(1.0 - smoothstep(0.78, 1.0, r));
  float n = wFbm(vUv*4.5 + vId*3.7 + vec2(uTime*0.35, -uTime*0.2));
  float a = ring*smoothstep(0.3, 0.62, n)*0.85;
  vec3 col = uSnow*(uSkyCol*1.25 + uSunCol*0.5*smoothstep(uLitY - 1.0, uLitY, vY));
  gl_FragColor = vec4(col*a, a);
}`,
    }), nRaft + nFloe);
    collars.instanceMatrix = chunks.instanceMatrix; collars.frustumCulled = false; collars.renderOrder = 2; collars.name = 'foam-collars'; scene.add(collars);
    await ctx.yield();
    const slabBase = wallPoint(sSlab, slabSide * (halfW(sSlab) - 1.3), waterY(sSlab) - 0.2), blockTop = wallPoint(sBlock, 0.6, rimY(sBlock) - 1.2);
    const slabYaw = -plan.at(sSlab, pc).th;
    const cM = new THREE.Matrix4(), cQ = new THREE.Quaternion(), cQ2 = new THREE.Quaternion(), cE = new THREE.Euler(), cV = V3(), cS = V3(), cA = V3(), ZAX = V3(0, 0, 1), YAX = V3(0, 1, 0);
    const setChunk = (i, x, y, z, sx, sy, sz) => { cM.compose(cV.set(x, y, z), cQ, cS.set(sx, sy, sz)); chunks.setMatrixAt(i, cM); };
    const NEAR = Math.min(26, nFloe);
    const poseChunks = (time, sc, cam) => {
      // river rafts: carried at 16 m/s, kept out of the camera's lane
      for (let i = 0; i < nRaft; i++) {
        const p = cp[i], s = S_CHUTE + ((p.a * 368 + time * 16) % 368), half = halfW(s);
        // a raft that rides within a few metres of the drifter's line is a small one (under about 2 m across), and its
        // edge keeps 1.5 m off the lens: big flat slabs filling a third of the frame read as low-poly
        let lat = p.lane * (half - 1.7); const cl = camLat(s), dl = lat - cl;
        const nearL = 1 - smoothstep(4, 10, Math.abs(dl)), sz = lerp(p.sz, Math.min(p.sz, 0.6), nearL), r = sz * (p.flat ? 1.3 : 0.95);
        if (Math.abs(dl) < 1.5 + r) lat = cl + (dl < 0 ? -1 : 1) * (1.5 + r);
        lat = clamp(lat, -half + 1.1, half - 1.1);
        plan.at(s, pc);
        // (a raft that drifts under a tributary fall is churned under its foam apron and comes up again beyond it)
        let kf = 1; for (let f = 0; f < 3; f++) if (lat * fallSide[f] > 0) kf = Math.min(kf, smoothstep(6, 11, Math.abs(s - sFall[f] - 3.5)));
        const k = smoothstep(S_CHUTE, S_CHUTE + 9, s) * (1 - smoothstep(S_REACH - 9, S_REACH - 1, s)) * sz * kf;
        // (beside the lane no raft lies level: it is a thick tilted block, not a disc)
        cQ.setFromEuler(cE.set(0.06 * Math.sin(time * 2.1 + p.ph) + 0.3 * nearL * Math.sin(p.ph * 3.1), p.yaw + time * p.spin, 0.06 * Math.cos(time * 1.7 + p.ph) + 0.3 * nearL * Math.cos(p.ph * 2.3)));
        setChunk(i, pc.x + pc.rx * lat, waterY(s) + superY(s, lat) + 0.04 + 0.1 * Math.sin(time * 1.9 + p.ph), pc.z + pc.rz * lat, p.flat ? k * 1.25 : k * 0.85, p.flat ? k * (0.3 + 0.3 * nearL) : k * 0.7, p.flat ? k * 1.25 : k * 0.85);
      }
      // lake floes drifting to the outlet, 1-2 m either side of the drifter and out across the lake
      for (let i = nRaft; i < iSlab; i++) {
        // the first NEAR of them are small crisp pancakes kept 4 to 8 m either side of the lane, evenly strung along the
        // lake and all drifting at the slush's pace, so there are always three or four in the water beside the bow
        const p = cp[i], n = i - nRaft, near = n < NEAR, f1 = (n * 0.618) % 1, f2 = (n * 0.377) % 1;
        const off = near ? 1.6 + 4.2 * f1 : Math.abs(p.lane) ** 1.9 * 20, sz = near ? 0.5 + 0.32 * f2 : off < 5 ? Math.min(p.sz, 0.85) : p.sz, r = sz * 1.5, sgn = near ? (n % 2 ? 1 : -1) : p.lane < 0 ? -1 : 1;
        const s = ((near ? (n / NEAR) * 108 + p.a * 3 + time * 2.4 : p.a * 108 + time * p.v) % 108) - 6;
        const room = Math.max(shoreW(s) - 2.5 - r, 0.5), lat = sgn * Math.min(1.5 + r + off, room);
        const k = smoothstep(-6, 2, s) * (1 - smoothstep(93, 101, s)) * sz * (room > 1.2 + r ? 1 : 0);
        cQ.setFromEuler(cE.set(0.03 * Math.sin(time * 1.3 + p.ph), p.yaw + time * p.spin * 0.3, 0.03 * Math.cos(time * 1.1 + p.ph)));
        setChunk(i, X0 + lat, L_LAKE + 0.05 + 0.03 * Math.sin(time * 1.4 + p.ph), Z0 - s, k * 1.5, k * (p.flat || near ? 0.3 : 0.55), k * (p.flat ? 1.5 : 1.1));
      }
      // the slab: leans on the outside wall of bend 4, peels off and topples toward mid-stream
      {
        const t = clamp((sc - sSlabGo) / (sSlabHit - sSlabGo), 0, 1), ang = (0.06 + 1.42 * t * t) * -slabSide, gone = 1 - smoothstep(1, 8, sc - sSlabHit);
        cQ.setFromAxisAngle(YAX, slabYaw).multiply(cQ2.setFromAxisAngle(ZAX, -ang));
        cA.set(0, 3.4, 0).applyQuaternion(cQ);
        setChunk(iSlab, slabBase.x + cA.x, slabBase.y + cA.y - 2.2 * (1 - gone), slabBase.z + cA.z, 1.5 * gone, 3.9 * gone, 2.9 * gone);
      }
      // the block that drops from the lip of bridge 3 (in the rare event the whole bridge goes instead)
      {
        if (rare) {
          const up = smoothstep(2, 12, sc - sFell); plan.at(sBridge[2] + 2.5, pc);
          cQ.setFromEuler(cE.set(0.16 * Math.sin(time * 2.1) - 0.5, 0.7, 0.14 * Math.cos(time * 1.7) + 0.42));      // a broken block on its edge, not a slab
          setChunk(iBlock, pc.x - pc.rx * 5.0, waterY(sBridge[2] + 2.5) - 0.9 + 0.85 * up + 0.14 * Math.sin(time * 2.4), pc.z - pc.rz * 5.0, 0.85 * up, 0.95 * up, 0.8 * up);
        } else {
          const t = clamp((sc - sBlockGo) / (sBlockHit - sBlockGo), 0, 1), gone = 1 - smoothstep(0, 5, sc - sBlockHit);
          cQ.setFromEuler(cE.set(t * t * 2.6, 0.7, t * 1.1));
          setChunk(iBlock, blockTop.x, lerp(blockTop.y, waterY(sBlock) + 0.2, t * t), blockTop.z, 2.0 * gone, 1.6 * gone, 1.8 * gone);
        }
      }
      // brash: rocking fragments left by both, clear of the drifter's lane
      for (let n = 0; n < nBrash; n++) {
        const i = iBrash + n, p = cp[i], forSlab = n < 7, wide = !forSlab && rare;      // rare: the broken bridge's brash, spread over its length
        const s0 = forSlab ? sSlab : wide ? sBridge[2] : sBlock, hit = forSlab ? sSlabHit : wide ? sFell + 1 : sBlockHit;
        const s = s0 + (p.a - 0.5) * (wide ? 15 : 9), grow = smoothstep(0, 9, sc - hit) * (wide ? 1.1 : 1), keep = wide ? 2.5 : 1.7;
        let lat = p.lane * 4.4; const cl = camLat(s); if (Math.abs(lat - cl) < keep) lat = cl + (lat < cl ? -keep : keep);
        plan.at(s, pc);
        // wreckage is tilted broken blocks (each lies 15 to 35 degrees off level and rocks about that), smaller beside the lane
        const tx = (0.26 + 0.35 * p.a) * (p.lane > 0 ? 1 : -1), tz = (0.26 + 0.35 * ((p.a * 7.3) % 1)) * (p.spin > 0 ? 1 : -1);
        cQ.setFromEuler(cE.set(tx + 0.2 * Math.sin(time * 2.6 + p.ph), p.yaw + time * p.spin, tz + 0.2 * Math.cos(time * 2.2 + p.ph)));
        const k = grow * (0.28 + 0.4 * p.sz) * lerp(0.55, 1, smoothstep(2.8, 6.5, Math.abs(lat - cl)));
        setChunk(i, pc.x + pc.rx * lat, waterY(s) + 0.05 + 0.16 * Math.sin(time * 3 + p.ph), pc.z + pc.rz * lat, k * 0.9, k * 0.85, k * 0.8);
      }
      // companions in the fall: blocks and one slush raft tumbling alongside, 3-5 m off the axis
      const camD = -cam.y, cdD = hero.conduitDepth;
      for (let n = 0; n < nShaft; n++) {
        const i = iShaft + n, p = cp[i];
        const D = camD + 7 + n * 4.5 + 5 * Math.sin(sc * 0.035 + p.ph) + (sc - S_LIP - 80) * 0.05 * (p.lane);
        // (they go where the water goes: over the last 18 m above the conduit's lip those on its side of the axis are
        // drawn low and left into its throat with the water; the others drift out toward their own wall; all are gone
        // 12 m below the lip, so nothing tumbles in the quiet ink)
        const ang = p.yaw * 0.5 + Math.PI * 0.95 + n * 0.9, rad = 3.3 + 1.6 * p.a, away = smoothstep(cdD - 18, cdD + 8, D), left = Math.cos(ang) < 0;
        // (a block's size is its own; the one slush raft, n === 2, crumbles as it falls: flat at the lip, a lump like the
        // rest by 140 m down)
        const k = smoothstep(16, 34, camD) * (1 - smoothstep(cdD - 4, cdD + 12, D)) * (0.35 + 0.5 * p.sz);
        const crumb = smoothstep(90, 140, D), wide = n === 2 ? lerp(1.6, 0.95, crumb) : 1, thick = n === 2 ? lerp(0.4, 0.8, crumb) : 0.8;
        cQ.setFromEuler(cE.set(time * (0.6 + p.spin), p.yaw + time * 0.4, time * (0.5 - p.spin)));
        setChunk(i, Math.cos(ang) * (rad + (left ? 0 : 3 * away)) - (left ? 9 * away : 0), -D, kit.axisZ(D) + Math.sin(ang) * (rad + (left ? 0 : 3 * away)) * 0.8 + (left ? 5.5 * away : 0), k * wide, k * thick, k * wide);
      }
      // the gate: two grounded bergs (five blocks) of old lake ice in the shallows either side of the outlet
      for (let n = 0; n < GATE.length; n++) {
        const g = GATE[n];
        cQ.setFromEuler(cE.set(g[4] + 0.008 * Math.sin(time * 0.7 + n), g[5], g[6] + 0.008 * Math.cos(time * 0.6 + n)));
        setChunk(iGate + n, X0 + g[0], L_LAKE - 0.45 + 0.55 * g[2], Z0 - g[1], g[3], g[2], g[3] * 0.85);
      }
      chunks.instanceMatrix.needsUpdate = true;
    };

    // ---- 4k. bursts: the slab's splash, the block's burst, the rare snow curtain
    const shade = U.uSnow.value.clone().multiply(U.uSkyCol.value.clone().multiplyScalar(1.5).add(U.uSunCol.value.clone().multiplyScalar(0.1)));
    const sprayOver = clamp((0.3 * shade.r + 0.5 * shade.g + 0.2 * shade.b) * 1.5, 0.12, 1);     // dim spray (twilight) is added, not laid over
    const gilt = U.uSnow.value.clone().multiply(U.uSunCol.value.clone().multiplyScalar(0.8).add(U.uSkyCol.value.clone().multiplyScalar(0.5)));
    const slabBurst = makeBurst(rng.fork('b1'), { count: 150, dir: [-slabSide * plan.at(sSlab, pc).rx * 0.5, 1, -slabSide * pc.rz * 0.5], spread: 0.8, speed: [3.5, 11.5], size: [0.6, 2.5], life: 1.7, gravity: 9, color: shade, alpha: 0.64, jitter: [2.6, 0.3, 2.2], over: sprayOver, near: 12, stretch: 1.5, thin: 0.6, torn: 0.85 });
    wallPoint(sSlab, slabSide * 1.6, waterY(sSlab) + 0.3, slabBurst.uniforms.uOrigin.value);
    await ctx.yield();
    // (rare event: the same burst is the whole bridge's splash, a wall of spray as long and as wide as the bridge)
    const blockBurst = makeBurst(rng.fork('b2'), rare
      ? { count: 230, dir: [0, 1, 0], spread: 0.75, speed: [5, 14], size: [0.9, 3.4], life: 2.3, gravity: 9, color: shade.clone().lerp(gilt, 0.65), alpha: 0.52, delay: 0.45, jitter: [5.5, 0.3, 6.5], over: sprayOver, near: 17, stretch: 1.4, thin: 0.65, torn: 0.8 }
      : { count: 80, dir: [0, 1, 0], spread: 0.9, speed: [2.5, 7.5], size: [0.45, 2.2], life: 1.4, gravity: 9, color: shade, alpha: 0.75, jitter: [0.8, 0.2, 0.8], over: sprayOver, near: 6, stretch: 1.4, thin: 0.65, torn: 0.8 });
    if (rare) { wallPoint(sBridge[2], 0, waterY(sBridge[2]) + 0.3, blockBurst.uniforms.uOrigin.value); blockBurst.uniforms.uFloorY.value = waterY(sBridge[2]); }
    else wallPoint(sBlock, 0.6, waterY(sBlock) + 0.3, blockBurst.uniforms.uOrigin.value);
    scene.add(slabBurst.mesh, blockBurst.mesh);
    await ctx.yield();
    let curtain = null;
    if (rare) {
      // gold-lit: the curtain falls through the sunbeam that the gap lets in
      const gold = U.uGold.value.clone().multiply(U.uSunCol.value).multiplyScalar(1.2).lerp(gilt, 0.25);
      curtain = makeBurst(rng.fork('b3'), { count: 280, dir: [0.3, -1, 0], spread: 0.6, speed: [0.4, 3.2], size: [0.5, 1.7], life: 3.4, gravity: 2.2, color: gold, alpha: 0.42, delay: 0.7, jitter: [5.5, 2.4, 6.5], drag: 0.2, near: 11, stretch: 0.8, thin: 0.7, torn: 0.9 });
      wallPoint(sBridge[2], 0, rimY(sBridge[2]) - 1.5, curtain.uniforms.uOrigin.value); scene.add(curtain.mesh);
      curtain.uniforms.uFloorY.value = waterY(sBridge[2]) + 0.3;      // the curtain thins out above the water: no sprite is cut by the surface
    }
    await ctx.yield();


    // ---- 4k'. the falls as falling water, and the sunbeam under the great arch
    // FALL ROPES: the kit's sheets are a smooth translucent body (from the river they read as a pane of glass, and a ribbon
    // of drawn stripes read as a net curtain), so each fall is built here as three or four separate ROPES of opaque white
    // water. Every rope has its own ballistic path from the cornice lip to its own landing place (they start close together,
    // splay, and two of them cross on the way down), a wander that grows as it falls, and its own thickness; each is a ribbon
    // turned to face the lens round its own centreline (so it is a round rope from every side, with real parallax between
    // ropes), and the shader gives it a solid white core with a torn edge, necks and lumps, breaks it into lengths and then
    // drops toward the foot, and flings beads beside it. Between the ropes there is nothing: the dark wall shows.
    // aT = (across -1..1, seconds of fall, seed, sun-lit 0/1), aR = (ribbon half-width m, fall time s).
    // Each foot is buried in a looping burst of torn spray ("fall-foot-i", the boil) and throws fast flecks toward the lane
    // ("fall-flecks-i"); the river shader's apron is the foam under them.
    const fallFeet = [];
    {
      const P = [], TG = [], T = [], R = [], I = [], NT = 22;
      // per rope: [start along (of the half width), landing along, landing out (m, toward the canyon's middle), core radius m]
      const ROPES = [
        [[-0.5, 0.45, 0.3, 0.34], [0.45, -0.6, -0.3, 0.27], [0.05, 0.95, 0.75, 0.15]],
        [[-0.55, 0.35, 0.35, 0.36], [0.5, -0.55, -0.3, 0.3], [0.0, 0.95, 0.8, 0.17]],
        [[-0.6, 0.2, 0.45, 0.5], [0.55, -0.6, -0.4, 0.4], [0.1, 0.85, 1.0, 0.3], [-0.2, -1.0, 0.25, 0.16]],
      ];
      for (let i = 0; i < 3; i++) {
        const sF = sFall[i], side = fallSide[i]; plan.at(sF, pc);
        const k = halfW(sF) / 7, top = rimY(sF) + 0.22, h = top - waterY(sF) - 0.05, tEnd = Math.sqrt(2 * h / 9.81);
        const ox = -pc.rx * side, oz = -pc.rz * side, axn = Math.sin(pc.th), azn = -Math.cos(pc.th);
        const lx = pc.x + pc.rx * side * 5.5 * k, lz = pc.z + pc.rz * side * 5.5 * k;      // just inside the cornice lip: the water comes out of the snow
        const bx = falls[i].base.x, bz = falls[i].base.z, hw = FALL_W[i] / 2;
        const ropes = ROPES[i].map((r, n) => ({ r, n })).sort((a, b) => a.r[2] - b.r[2]);      // nearest the wall first
        {
          // the mist veil (aT.z = 10 + i marks it): a ribbon as wide as the fall, down the middle of the ropes' paths, drawn first
          const base = P.length / 3, NM = 10;
          for (let j = 0; j <= NM; j++) {
            const t = tEnd * (j / NM) ** 0.8, qq = t / tEnd, c = [lerp(lx, bx + ox * 0.2, qq), top - 4.905 * t * t, lerp(lz, bz + oz * 0.2, qq)];
            const t2 = Math.min(t + 0.05, tEnd + 0.05), q2 = t2 / tEnd, dx = lerp(lx, bx + ox * 0.2, q2) - c[0], dy = (top - 4.905 * t2 * t2) - c[1], dz = lerp(lz, bz + oz * 0.2, q2) - c[2], dl = Math.hypot(dx, dy, dz) || 1;
            for (let e = -1; e <= 1; e += 2) { P.push(c[0], c[1], c[2]); TG.push(dx / dl, dy / dl, dz / dl); T.push(e, t, 10 + i, side > 0 ? 1 : 0); R.push(hw * 1.25, tEnd); }
          }
          for (let j = 0; j < NM; j++) { const q = base + j * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
        }
        for (const { r, n } of ropes) {
          const seed = i * 0.37 + n * 0.19 + 0.11, base = P.length / 3;
          const sx = lx + axn * r[0] * hw * 0.7, sz = lz + azn * r[0] * hw * 0.7, ex = bx + axn * r[1] * hw * 1.15 + ox * r[2], ez = bz + azn * r[1] * hw * 1.15 + oz * r[2];
          const C = [];
          for (let j = 0; j <= NT; j++) {
            const t = tEnd * (j / NT) ** 0.8, q = t / tEnd, wa = 0.75 * q * Math.sin(q * 7.5 + seed * 40) + 0.34 * Math.sqrt(q) * Math.sin(q * 15 + seed * 91), wo = 0.3 * q * Math.sin(q * 6.4 + seed * 63);
            C.push([lerp(sx, ex, q) + axn * wa + ox * wo, top - 4.905 * t * t, lerp(sz, ez, q) + azn * wa + oz * wo, t]);
          }
          for (let j = 0; j <= NT; j++) {
            const a = C[Math.max(j - 1, 0)], b = C[Math.min(j + 1, NT)], c = C[j], tl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
            for (let e = -1; e <= 1; e += 2) { P.push(c[0], c[1], c[2]); TG.push((b[0] - a[0]) / tl, (b[1] - a[1]) / tl, (b[2] - a[2]) / tl); T.push(e, c[3], seed, side > 0 ? 1 : 0); R.push(r[3] * 2.4, tEnd); }
          }
          for (let j = 0; j < NT; j++) { const q = base + j * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
        }
        const big = i === 2, sprayCol = side > 0 ? shade.clone().lerp(gilt, 0.5) : shade.clone().lerp(new THREE.Color(1, 1, 1).multiplyScalar(Math.max(shade.r, shade.g, shade.b)), 0.35);
        const fb = makeBurst(makeRng((ctx.seed ?? 1) + 8011 + i), { count: big ? 180 : 110, dir: [ox * 0.3, 1, oz * 0.3], spread: 0.85, speed: [1.6, big ? 5.6 : 4.6], size: [0.45, big ? 2.0 : 1.6], life: 0.9, gravity: 8,
          color: sprayCol, alpha: big ? 0.88 : 0.8, loop: true, jitter: [hw * 0.95, 0.25, hw * 0.95], over: sprayOver, near: 3.5, stretch: 1.5, thin: 0.56, torn: 0.9 });
        fb.uniforms.uOrigin.value.set(bx + ox * 0.2, waterY(sF) + 0.25, bz + oz * 0.2); fb.uniforms.uFloorY.value = waterY(sF) - 0.5;
        fb.mesh.name = 'fall-foot-' + i; fb.mesh.renderOrder = 4; scene.add(fb.mesh); fallFeet.push(fb);
        // flecks: beads of water thrown out of the boil toward the lane, drawn out along their flight
        const ff = makeBurst(makeRng((ctx.seed ?? 1) + 8111 + i), { count: big ? 56 : 36, dir: [ox * 0.9 + axn * 0.25, 0.75, oz * 0.9 + azn * 0.25], spread: 0.55, speed: [4.5, big ? 10.5 : 8.5], size: [0.1, 0.16], life: 0.8, gravity: 9,
          color: sprayCol.clone().multiplyScalar(1.15), alpha: 0.95, loop: true, jitter: [hw * 0.6, 0.3, hw * 0.6], over: 1, near: 1.2, stretch: 3.2, thin: 0.42, torn: 0.0, drag: 0.15 });
        ff.uniforms.uOrigin.value.set(bx + ox * 0.3, waterY(sF) + 0.4, bz + oz * 0.3); ff.uniforms.uFloorY.value = waterY(sF) - 0.2;
        ff.mesh.name = 'fall-flecks-' + i; ff.mesh.renderOrder = 5; scene.add(ff.mesh); fallFeet.push(ff);
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(TG, 3));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 4)); g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 2)); g.setIndex(I);
      const fallLit = new THREE.Color(mood.fallCol || '#eef5fb').multiply(U.uSunCol.value.clone().multiplyScalar(0.62).add(U.uSkyCol.value.clone().multiplyScalar(0.75))).multiplyScalar(mood.fallK || 1);
      // (in shade the water takes the sky's blue only a third of the way: white water in blue shadow, not a lilac pane)
      const skyL = U.uSkyCol.value.clone().multiplyScalar(1.5).add(U.uSunCol.value.clone().multiplyScalar(0.12)), skyM = Math.max(skyL.r, skyL.g, skyL.b);
      const fallShade = new THREE.Color(mood.fallCol || '#eef5fb').multiply(skyL.lerp(new THREE.Color(skyM, skyM, skyM), 0.72)).multiplyScalar((mood.fallK || 1) * 1.05);
      const strands = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uLit: { value: fallLit }, uShade: { value: fallShade } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: /* glsl */`
attribute vec3 aTan; attribute vec4 aT; attribute vec2 aR; uniform float uTime;
varying vec4 vT; varying vec3 vW; varying float vE;
void main(){
  vT = aT; vE = aR.y;
  float k = clamp(aT.y/aR.y, 0.0, 1.0);
  vec3 c = (modelMatrix*vec4(position, 1.0)).xyz;
  c.xz += k*k*0.11*vec2(sin(uTime*2.3 + aT.z*40.0 + aT.y*3.0), cos(uTime*1.9 + aT.z*23.0 + aT.y*2.6));      // the rope sways as it falls
  vec3 sd = cross(aTan, cameraPosition - c); sd /= max(length(sd), 1e-4);
  // (the ribbon widens toward the foot, where the rope has broken into flung water)
  vec3 wp = c + sd*aT.x*aR.x*(0.85 + 0.75*k*k);
  vW = wp; gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
        fragmentShader: /* glsl */`
varying vec4 vT; varying vec3 vW; varying float vE; uniform float uTime; uniform vec3 uLit, uShade;
${HASH_GLSL}
void main(){
  float x = vT.x, t = vT.y, sd = vT.z, q = clamp(t/vE, 0.0, 1.0), run = (t - uTime)*9.0;
  float aa = fwidth(x), lodR = 1.0 - smoothstep(0.3, 1.0, fwidth(run)*0.5), nearK = 1.0 - smoothstep(0.12, 0.4, aa);
  if (sd > 9.0) {
    // THE MIST between and behind the ropes: one torn, drifting veil per fall, a tenth as dense as the water
    float mn = 0.6*wNoise(vec2(x*1.7 + sd, run*0.07)) + 0.4*wNoise(vec2(x*4.1 - sd, run*0.16 + 3.0));
    float ma = smoothstep(0.38, 0.8, mn)*(1.0 - x*x)*(1.0 - x*x)*smoothstep(0.08, 0.4, q)*(1.0 - smoothstep(0.86, 1.0, q))*0.16*smoothstep(1.5, 5.0, length(cameraPosition - vW));
    gl_FragColor = vec4(mix(uShade, uLit, vT.w)*0.8*ma, ma);
    return;
  }
  // THE CORE: solid white water. It necks and swells along its length, its centre shivers, its edge is torn.
  float wide = 0.85 + 0.75*q*q;                                              // (the ribbon's own widening, undone for the core)
  float core = (0.14 + 0.32*wNoise(vec2(run*0.42, sd*17.0)))*mix(1.0, 0.7, smoothstep(0.0, 0.45, q))/wide;      // it necks to a third and swells
  float cx = (0.16*(wNoise(vec2(run*0.23, sd*31.0)) - 0.5)*2.0 + 0.05*sin(run*1.3 + sd*50.0))/wide;
  float d = abs(x - cx);
  float edgeN = mix(0.5, wNoise(vec2(x*5.0 + sd*9.0, run*1.25)), lodR*nearK);
  float cw = max(core, aa*1.3);
  float body = (1.0 - smoothstep(cw*(0.78 + 0.34*edgeN), cw*(0.9 + 0.5*edgeN) + aa, d))*max(sqrt(core/cw), 0.7);      // from far off: a white thread
  // BREAKING UP: below the first third the rope is torn into lengths with clean gaps, and near the foot into lumps and drops
  float br = smoothstep(0.2, 0.8, q);
  float lumpN = 0.62*wNoise(vec2(sd*23.0, run*0.55)) + 0.38*mix(0.5, wNoise(vec2(x*2.2 + sd*5.0, run*0.95)), lodR);
  body *= smoothstep(br*0.82 - 0.05, br*0.82 + 0.04, lumpN);
  // flung water beside the core: short streaks torn off it and beads thrown clear, more of both toward the foot
  float out1 = smoothstep(cw*0.8, cw*1.4, d)*(1.0 - smoothstep(0.55, 1.0, abs(x)));
  float tear = smoothstep(0.62 - 0.14*br, 0.86, wNoise(vec2(x*7.0 + sd*13.0, run*0.33)))*out1*(0.35 + 0.65*br)*nearK;
  vec2 bc = vec2(x*5.0 + sd*7.0, run*0.9); float bh = wHash(floor(bc));
  float bead = step(0.86 - 0.2*br, bh)*(1.0 - smoothstep(0.08, 0.3, length((fract(bc) - 0.5)*vec2(1.0, 0.45))))*out1*lodR*nearK;
  float a = clamp(body + tear*0.8 + bead*0.85, 0.0, 1.0);
  // the ends: out of the snow at the lip, and into the boil at the foot with no ruled edge
  a *= smoothstep(0.0, 0.07, t)*(1.0 - smoothstep(vE - 0.2 + 0.1*wNoise(vec2(x*3.0 + sd*11.0, uTime*3.0)), vE - 0.02, t));
  a *= smoothstep(0.6, 2.6, length(cameraPosition - vW));
  // white water with a body: fibres drawn out along the fall, the middle of the rope brightest, grey-blue in its hollows
  float fib = mix(0.5, wNoise(vec2(x*13.0 + sd*31.0, run*0.3)), lodR*nearK);
  float round = sqrt(max(1.0 - d*d/max(cw*cw*2.2, 1e-4), 0.0));
  // (held under 0.9: the rope is never flat white, its round and its fibres show inside it)
  vec3 col = mix(uShade, uLit, vT.w)*(0.56 + 0.3*round + 0.2*fib*body + 0.1*lumpN);
  col *= min(1.0, 0.9/max(max(col.r, col.g), max(col.b, 1e-3)));
  gl_FragColor = vec4(col*a, a);
}`,
      }));
      strands.renderOrder = 3; strands.frustumCulled = false; strands.name = 'fall-strands'; scene.add(strands);
    }
    await ctx.yield();
    // THE SUNBEAM. Between the great arch and its rib the roof has fallen in, and the sun comes down through the slot: a
    // beam of separate rays, 2 m deep, that crosses the canyon from the slot to the right wall (or the water, at noon), standing in
    // the spray. Each ray starts on the slot (aB.x = where across it) and runs with the sun's own direction until it meets
    // ice or water (aB.z = its length); five soft sheets a little apart, added to the scene. Warm in a low sun, white at noon,
    // a faint blue bar by twilight: the canyon's one change of light.
    // THE EYE AND THE BEAM (a rule of the beam itself, the same for every eye): light in mist is a shaft to an eye that
    // stands back from it; an eye within it or beside it sees no surface, only the motes that spark in it and air a little
    // brighter. The measure is the beam's own length (beamLen, its longest ray) against the eye's stand-off square to the
    // sheets (face times the lens's distance: a sight line runs the beam's depth over face inside that depth, so the
    // stand-off is small wherever the lit run is a large share of the sight line: an eye in the beam, close beside it, or
    // looking along its sheets from any distance). From two lengths off and more the whole shaft shows; within one length
    // none of its body does: the rays and their lanes are gone, the five sheets together add at most 0.04 (lit air with no
    // ray and no edge in it), and the motes spark as before.
    {
      const sSlot = sBridge[1] + 6.4, P = [], Bv = [], I = [], NL = 12, NT = 6;
      let beamLen = 0;
      // (it falls at least 38 degrees steep whatever the hour: the slot's own walls turn a low sun down into the canyon)
      const bel = Math.max(mood.sunEl, 38) * DEG, dl = V3(-Math.sin(az) * Math.cos(bel), -Math.sin(bel), Math.cos(az) * Math.cos(bel));
      plan.at(sSlot, pc); const k = halfW(sSlot) / 7, tx = Math.sin(pc.th), tz = -Math.cos(pc.th), y0 = rimY(sSlot) + 0.5, cx = pc.x, cz = pc.z, rx = pc.rx, rz = pc.rz;
      for (let l = 0; l < 5; l++) {
        const base = P.length / 3, sh = (l - 2) * 0.5;
        for (let a = 0; a <= NL; a++) {
          const u = (a / NL) * 2 - 1, la = (-0.4 + 4.4 * u) * k, x0 = cx + rx * la + tx * sh, z0 = cz + rz * la + tz * sh;
          let tm = 0.5;
          for (; tm < 46; tm += 0.3) {
            const x = x0 + dl.x * tm, y = y0 + dl.y * tm, z = z0 + dl.z * tm, nr = plan.nearest(x, z), hf = clamp((y - waterY(nr.s)) / Math.max(rimY(nr.s) - waterY(nr.s), 1), 0, 1);
            if (y < waterY(nr.s) + 0.15 || nr.d > lerp(7.4, 5.3, hf) * halfW(nr.s) / 7) break;
          }
          beamLen = Math.max(beamLen, tm);
          for (let j = 0; j <= NT; j++) { const t = tm * j / NT; P.push(x0 + dl.x * t, y0 + dl.y * t, z0 + dl.z * t); Bv.push(u, t, tm, l); }
        }
        for (let a = 0; a < NL; a++) for (let j = 0; j < NT; j++) { const q = base + a * (NT + 1) + j, b = q + 1, c = q + NT + 1, d = c + 1; I.push(q, c, b, b, c, d); }
        await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(Bv, 4)); g.setIndex(I);
      // (at midnight the sun is rose: the beam takes only a little of it, or it is a pink pane; mood.beamWhite / beamK)
      const warm = mood.warm ?? 1, sunMax = Math.max(U.uSunCol.value.r, U.uSunCol.value.g, U.uSunCol.value.b);
      const beamCol = U.uSunCol.value.clone().multiply(new THREE.Color(1, 1, 1).lerp(U.uGold.value.clone().multiplyScalar(1.25), 0.7 * warm)).lerp(new THREE.Color(1, 1, 1).multiplyScalar(sunMax), mood.beamWhite ?? 0.35).multiplyScalar(0.8 * (mood.beamK ?? 1));
      const bn = V3(rx, 0, rz).cross(dl).normalize();      // the sheets' normal
      const beam = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uCol: { value: beamCol }, uN: { value: bn }, uLen: { value: beamLen } },
        transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
        vertexShader: 'attribute vec4 aB; varying vec4 vB; varying vec3 vW; void main(){ vB = aB; vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
        fragmentShader: /* glsl */`
varying vec4 vB; varying vec3 vW; uniform float uTime, uLen; uniform vec3 uCol, uN;
${HASH_GLSL}
void main(){
  float u = vB.x, t = vB.y, L = vB.z;
  // GOD-RAYS: three or four separate rays of unequal width that keep their place along the whole beam (the same lanes in
  // every sheet, so they are shafts with depth), with lanes of no light at all between them, breathing as the spray drifts
  float rays = 0.62*wNoise(vec2(u*3.5 + 3.7 + vB.w*0.1, uTime*0.11)) + 0.38*wNoise(vec2(u*8.0 + vB.w*0.35, uTime*0.23 + 5.0));
  float lane = smoothstep(0.3, 0.72, rays); lane = lane*sqrt(lane);      // no light at all in the lanes between the rays
  // it dissolves at both sides, under the slot and at the foot: never a filled quadrilateral, no bright landing
  float edge = smoothstep(0.0, 1.0, 1.0 - abs(u));
  float env = edge*edge*smoothstep(0.0, 3.0, t)*(1.0 - smoothstep(L - 3.2, L - 0.2, t))*exp(-t/30.0);
  float a = lane*(0.5 + 0.5*wNoise(vec2(u*2.0 + uTime*0.2, t*0.35 - uTime*0.5)))*env;
  // motes: snow dust and droplets that spark as they cross the light; they reach a little past it on every side
  vec2 mc = vec2(u*38.0 + vB.w*5.0, t*5.2 + uTime*1.3); float mh = wHash(floor(mc));
  float mote = step(0.88, mh)*(1.0 - smoothstep(0.08, 0.3, length(fract(mc) - 0.5)))*pow(max(sin(uTime*(2.0 + 4.0*mh) + mh*50.0), 0.0), 4.0)
    *(1.0 - smoothstep(0.35, 1.1, fwidth(mc.x) + fwidth(mc.y)));
  float envM = sqrt(edge)*smoothstep(0.0, 1.5, t)*(1.0 - smoothstep(L - 1.2, L, t))*exp(-t/26.0);
  // a sheet seen edge-on, or five of them one behind the other, must not add up to a slab
  vec3 vd = cameraPosition - vW; float vl = max(length(vd), 1e-3), face = abs(dot(vd/vl, uN));
  // THE EYE AND THE BEAM: the shaft shows by the eye's stand-off square to this sheet, counted in the beam's own length
  // (none of it within one length, all of it from two); what is left near it is lit air: no ray, no lane, soft to every side
  float shaft = smoothstep(uLen, 2.0*uLen, abs(dot(vd, uN)));
  float air = 0.008*edge*smoothstep(0.0, 3.0, t)*(1.0 - smoothstep(L - 3.2, L - 0.2, t))*exp(-t/30.0);
  float foot = smoothstep(L*0.55, L*0.92, t);                       // twice the sparkle where the rays end, over the water
  // (the fade within 1.5 to 7 m of the lens stays, and it acts on every pass: the beam crosses the canyon, so the route
  // goes by or through it within those 7 m, and its motes and lit air thin to nothing toward the lens)
  a = (mix(air, a*(0.3 + 0.7*face), shaft) + mote*1.5*(1.0 + foot)*envM*(0.3 + 0.7*lane))*smoothstep(1.5, 7.0, vl);
  gl_FragColor = vec4(uCol*a, 1.0);
}`,
      }));
      beam.renderOrder = 6; beam.frustumCulled = false; beam.name = 'sunbeam'; scene.add(beam);
    }
    await ctx.yield();

    // ---- 4l. the camp on the right bank at the outlet, the flag line along the chute rim, the gauging cable
    const ORANGE = PALETTE[6];
    {
      const bag = makeBag(), gr = rng.fork('camp');
      const gY = (x, z) => { const d = lakeIn(x, z), y = sheetBase(z); if (d <= -40) return y; const bankH = 1.3 + 1.3 * (0.5 + 0.5 * nz.fbm2(x * 0.045 + 7, z * 0.045, 2)) + 1.6 * Math.max(0, nz.n2(x * 0.021, z * 0.021 + 3)) * smoothstep(0, 14, -d); return L_LAKE + Math.min(Math.max(y - L_LAKE, bankH), -d * 1.1); };
      const tent = (s, lat, yaw, col) => {
        const x = X0 + lat, z = Z0 - s, y = gY(x, z) - 0.12;
        const dome = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), p = dome.attributes.position;
        for (let i = 0; i < p.count; i++) {                       // pole ribs and sagging panels
          const a = Math.atan2(p.getZ(i), p.getX(i)), h = p.getY(i), k = 1 + 0.05 * Math.abs(Math.cos(a * 3)) * (1 - h) - 0.04 * Math.sin(h * 3.1);
          p.setXYZ(i, p.getX(i) * k, h, p.getZ(i) * k);
        }
        dome.computeVertexNormals();
        bag.add(dome, TRS(x, y, z, 0, yaw, 0, 2.5, 2.5, 2.5), col, (lx, ly, lz) => [0.03 * Math.sin(ly * 3.1) * (1 - ly), lx * 5 + lz * 3, 0]);
        bag.add(new THREE.CircleGeometry(0.8, 10, 0, Math.PI), TRS(x, y, z, 0, yaw, 0).multiply(TRS(-2.38, 0, 0, 0, -Math.PI / 2, 0, 1, 1.5, 1)).multiply(TRS(0, 0, 0, -0.33, 0, 0)), '#15120f');
        bag.add(new THREE.TorusGeometry(2.55, 0.3, 5, 18), TRS(x, y + 0.02, z, Math.PI / 2, 0, 0, 1, 1, 0.5), '#DDEBF3');
        for (let g = 0; g < 4; g++) {                             // guy lines as ribbons
          const a = yaw + 0.8 + g * 1.57, len = 2.7;
          bag.add(new THREE.CylinderGeometry(0.035, 0.035, len, 4), TRS(x + Math.cos(a) * 2.75, y + 0.95, z - Math.sin(a) * 2.75, 0, a, 0).multiply(TRS(0, 0, 0, 0, 0, 0.87)), '#E9E2C8', (lx, ly) => [0.02 * (1 - Math.abs(ly) / 1.35), g * 2, 1]);
        }
      };
      if (campKind === 'tents') { tent(84, 20.5, 0.3, ORANGE); await ctx.yield(); tent(93.5, 25.5, -0.5, ORANGE); }
      await ctx.yield();
      {
        // the sledge with fuel drums and a lashed tarp
        const s = campKind === 'tents' ? 76 : 86, lat = campKind === 'tents' ? 22 : 18.5, x = X0 + lat, z = Z0 - s, y = gY(x, z), M = TRS(x, y, z, 0, 0.5, 0);
        bag.add(new THREE.BoxGeometry(2.6, 0.12, 0.95), M.clone().multiply(TRS(0, 0.34, 0)), '#6b4a2c');
        for (const zz of [-0.42, 0.42]) bag.add(new THREE.BoxGeometry(3.0, 0.1, 0.07), M.clone().multiply(TRS(0.1, 0.05, zz)), '#3b2a1a');
        for (const xx of [-1, 0, 1]) bag.add(new THREE.BoxGeometry(0.07, 0.28, 0.9), M.clone().multiply(TRS(xx, 0.2, 0)), '#3b2a1a');
        const drums = ['#B8281C', '#2D5FA8', '#B8281C'];
        drums.forEach((c, i) => bag.add(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 12), M.clone().multiply(TRS(-0.85 + i * 0.62, 0.84, 0.02)), c));
        bag.add(new THREE.BoxGeometry(0.9, 0.5, 0.8, 3, 2, 3), M.clone().multiply(TRS(0.85, 0.65, 0)), ORANGE, (lx, ly) => [ly > 0.2 ? 0.015 : 0, lx * 9, 0]);
      }
      await ctx.yield();
      // eight bamboo poles with orange flags along the right cornice of the chute
      for (let i = 0; i < 8; i++) {
        const s = 102 + i * 7.6; plan.at(s, pc);
        const lat = 7.5 * halfW(s) / 7 + gr.range(-0.3, 0.3), x = pc.x + pc.rx * lat, z = pc.z + pc.rz * lat, y = rimY(s) + 0.45, lean = gr.range(-0.06, 0.06);
        bag.add(new THREE.CylinderGeometry(0.04, 0.055, 3.3, 5), TRS(x, y + 1.6, z, lean, 0, lean * 0.7), '#C9A45A');
        const flag = new THREE.PlaneGeometry(0.8, 0.46, 6, 2); flag.translate(0.42, 0, 0);
        bag.add(flag, TRS(x, y + 2.95, z, 0, -0.35 + gr.range(-0.15, 0.15), 0), ORANGE, (lx) => [0.13 * (lx / 0.8), i * 1.7 - lx * 8, 0]);
      }
      await ctx.yield();
      // the gauging cable: sagging across the canyon, bouncing, with the sensor fish skipping on the water
      {
        // (a thin black line with a dashed drop read as a debug line: it is a rimed hawser 16 cm thick on a true catenary,
        // hung with orange and white tag pennants that snap in the wind, made fast to an A-frame of bamboo with a winch box
        // and a back-stay on each rim; the drop line is a rope with two floats, the sensor fish half as big again)
        const s = sCable; plan.at(s, pc);
        const k = halfW(s) / 7, yEnd = rimY(s) + 2.0, yMid = waterY(s) + 4.0, n = 26, wLat = 6.7 * k, ca = 1.7, cden = Math.cosh(ca) - 1;
        const cabY = (v) => yMid + (yEnd - yMid) * (Math.cosh(ca * v) - 1) / cden;
        for (let i = 0; i < n; i++) {
          const v0 = (i / n) * 2 - 1, v1 = ((i + 1) / n) * 2 - 1, vm = (v0 + v1) / 2;
          const y0 = cabY(v0), y1 = cabY(v1), dl = (v1 - v0) * wLat, len = Math.hypot(dl, y1 - y0), bounce = () => [0.1 * (1 - vm * vm), 0.4, 1];
          const M = TRS(pc.x + pc.rx * vm * wLat, (y0 + y1) / 2, pc.z + pc.rz * vm * wLat, 0, -pc.th, Math.atan2(y1 - y0, dl));
          bag.add(new THREE.BoxGeometry(len * 1.04, 0.16, 0.13), M, '#2a2d34', bounce);
          bag.add(new THREE.BoxGeometry(len * 1.04, 0.05, 0.15), M.clone().multiply(TRS(0, 0.1, 0)), '#DDEBF3', bounce);      // rime on its upper side
          if (i % 2 === 1 && Math.abs(vm) < 0.86) {
            const flag = new THREE.PlaneGeometry(0.4, 0.56, 2, 3), fp = flag.attributes.position;
            for (let q = 0; q < fp.count; q++) { const fy = fp.getY(q) - 0.28; fp.setXYZ(q, fp.getX(q) * (1 + fy / 0.6), fy, 0); }      // a pennant: point down
            bag.add(flag, TRS(pc.x + pc.rx * vm * wLat, cabY(vm) - 0.08, pc.z + pc.rz * vm * wLat, 0, -pc.th, 0), (i >> 1) % 2 ? '#F2F4F6' : ORANGE, (lx, ly) => (ly > -0.02 ? [0.1 * (1 - vm * vm), 0.4, 1] : [0.1 * (-ly / 0.56), i * 1.3 + ly * 5, 0]));
          }
        }
        for (const sd of [-1, 1]) {
          const ax = pc.x + pc.rx * sd * wLat, az2 = pc.z + pc.rz * sd * wLat, tx = Math.sin(pc.th), tz = -Math.cos(pc.th), yb = rimY(s) + 0.5;
          for (const e of [-1, 1]) bag.add(new THREE.CylinderGeometry(0.06, 0.085, 2.3, 5), TRS(ax + tx * e * 0.42, yb + 0.95, az2 + tz * e * 0.42, 0, -pc.th, 0).multiply(TRS(0, 0, 0, e * 0.36, 0, 0)), '#C9A45A');
          bag.add(new THREE.BoxGeometry(0.5, 0.42, 0.62), TRS(ax + pc.rx * sd * 0.7, yb + 0.2, az2 + pc.rz * sd * 0.7, 0, -pc.th, 0), ORANGE);
          bag.add(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 4), TRS(ax + pc.rx * sd * 1.25, yb + 0.85, az2 + pc.rz * sd * 1.25, 0, -pc.th, 0).multiply(TRS(0, 0, 0, 0, 0, sd * 0.98)), '#E9E2C8');
        }
        const fv = -0.42, fy = cabY(fv), wy = waterY(s) + 0.2, fx0 = pc.x + pc.rx * fv * wLat, fz0 = pc.z + pc.rz * fv * wLat;
        bag.add(new THREE.BoxGeometry(0.1, fy - wy, 0.08), TRS(fx0, (fy + wy) / 2, fz0, 0, -pc.th, 0), '#2a2d34', () => [0.08, 0.4, 1]);
        for (const h of [0.38, 0.72]) bag.add(new THREE.SphereGeometry(0.15, 8, 6), TRS(fx0, lerp(wy, fy, h), fz0), h < 0.5 ? ORANGE : '#F2F4F6', () => [0.08, 0.4, 1]);
        bag.add(new THREE.SphereGeometry(1, 10, 8), TRS(fx0, wy + 0.08, fz0, 0, -pc.th, 0, 0.25, 0.25, 0.75), ORANGE, () => [0.11, 0.4, 1]);
      }
      await ctx.yield();
      const mat = makePaint(U); mat.uniforms.uFlut.value.set(-0.3, 0.3, 0.9);
      const camp = new THREE.Mesh(bag.build(), mat); camp.name = 'camp'; scene.add(camp);
    }
    await ctx.yield();

    // ---- 4m. the drifter: an orange instrument float built round the camera (rig space: eye at 0, looking -Z)
    const rig = new THREE.Group(); rig.name = 'drifter-rig'; scene.add(rig);
    const floatG = new THREE.Group(); rig.add(floatG);
    const paintRig = makePaint(U, { scuff: 1, wet: 1 }); paintRig.uniforms.uFlut.value.set(1, 0.45, 0);
    {
      const bag = makeBag(), HY = -0.9, HZ = -0.75;
      const deckY = (x, z) => HY + 0.2 * Math.sqrt(Math.max(0, 1 - (x / 0.56) ** 2 - ((z - HZ) / 1.05) ** 2));
      bag.add(new THREE.SphereGeometry(1, 28, 16), TRS(0, HY, HZ, 0, 0, 0, 0.56, 0.2, 1.05), livery[0]);
      bag.add(new THREE.TorusGeometry(1, 0.045, 6, 40), TRS(0, HY + 0.01, HZ, Math.PI / 2, 0, 0, 0.565, 1.06, 1), livery[1]);          // rub rail
      bag.add(new THREE.TorusGeometry(1, 0.03, 5, 40), TRS(0, HY + 0.13, HZ, Math.PI / 2, 0, 0, 0.43, 0.81, 1), livery[1] === '#1c1c20' ? '#E8ECEF' : livery[1]); // deck stripe
      bag.add(new THREE.BoxGeometry(0.3, 0.02, 0.3), TRS(0, deckY(0, -1.22) + 0.004, -1.22, 0.09, 0, 0), '#4a4e57');                // instrument plate
      bag.add(new THREE.CylinderGeometry(0.075, 0.088, 0.055, 16), TRS(-0.09, deckY(0, -1.2) + 0.045, -1.17, 0.09, 0, 0), '#0e0e10');    // GPS puck
      bag.add(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 10), TRS(-0.09, deckY(0, -1.2) + 0.078, -1.17, 0.09, 0, 0), '#6a6e76');
      bag.add(new THREE.SphereGeometry(0.052, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), TRS(0.1, deckY(0, -1.3) + 0.012, -1.3), '#dfe8ee');  // strobe dome (unlit)
      bag.add(new THREE.CylinderGeometry(0.058, 0.058, 0.014, 12), TRS(0.1, deckY(0, -1.3) + 0.012, -1.3), '#3a3d44');
      bag.add(new THREE.TorusGeometry(0.105, 0.013, 6, 18, Math.PI * 1.25), TRS(0, deckY(0, -1.6) - 0.01, -1.6, -1.05, 0, -0.39), '#E9E2C8');  // rope grab-loop
      // the stencilled number, 07, as seven-segment bars on the port deck
      const seg = (cx, cz, w, d) => bag.add(new THREE.BoxGeometry(w, 0.004, d), TRS(cx, deckY(cx, cz) + 0.003, cz, 0.1, 0, -cx * 0.55), livery[1] === '#E8ECEF' ? '#E8ECEF' : '#17171a');
      const dig = (cx, cz, on) => {
        const W = 0.05, Hh = 0.055, t = 0.014;
        const defs = [[0, -Hh, W, t], [0, 0, W, t], [0, Hh, W, t], [-W / 2, -Hh / 2, t, Hh], [W / 2, -Hh / 2, t, Hh], [-W / 2, Hh / 2, t, Hh], [W / 2, Hh / 2, t, Hh]];
        defs.forEach((dd, i) => { if (on[i]) seg(cx + dd[0], cz + dd[1], dd[2], dd[3]); });
      };
      dig(-0.3, -1.12, [1, 0, 1, 1, 1, 1, 1]); dig(-0.22, -1.12, [1, 0, 0, 0, 1, 0, 1]);
      await ctx.yield();
      // whip aerial with its pennant streaming back toward the lens
      const ax = 0.33, az2 = -1.42, ay = deckY(ax, az2), AL = 0.4;
      const whip = new THREE.CylinderGeometry(0.005, 0.011, AL, 5); whip.translate(0, AL / 2, 0);
      const MA = TRS(ax, ay, az2, 0.3, 0, -0.2);
      bag.add(whip, MA, '#17171a', (lx, ly) => [0.012 * (ly / AL) ** 2, 1.3, 0]);
      bag.add(new THREE.SphereGeometry(0.014, 6, 5), MA.clone().multiply(TRS(0, AL, 0)), ORANGE, () => [0.012, 1.3, 0]);
      const pen = new THREE.PlaneGeometry(0.24, 0.09, 7, 1), pp = pen.attributes.position;
      for (let i = 0; i < pp.count; i++) { const t = pp.getX(i) / 0.24 + 0.5; pp.setXYZ(i, t * 0.24, pp.getY(i) * (1 - 0.82 * t), 0); }
      bag.add(pen, MA.clone().multiply(TRS(0, AL - 0.05, 0)).multiply(TRS(0, 0, 0, 0, -Math.PI / 2 + 0.25, 0.22)), ORANGE, (lx) => [0.012 + 0.03 * (lx / 0.24), 1.3 - lx * 30, 0]);
      const hull = new THREE.Mesh(bag.build(), paintRig); hull.name = 'drifter'; hull.frustumCulled = false; floatG.add(hull);
    }
    await ctx.yield();
    // bow wave: a V of foam peeling off both shoulders
    const wakeU = { uTime: U.uTime, uA: { value: 1 }, uCol: { value: new THREE.Color(1, 1, 1) }, uPull: { value: 0 } };
    {
      const P = [], Q = [], I = [], n = 12;
      for (const sd of [-1, 1]) {
        const base = P.length / 3;
        for (let i = 0; i <= n; i++) {
          const t = i / n, cx = sd * (0.42 + 1.75 * t), cz = -1.45 + 1.9 * t, w = 0.1 + 0.75 * t, up = 0.16 * Math.sin(Math.PI * Math.min(t * 1.6, 1));
          P.push(cx - sd * w * 0.3, -0.9 + up * 0.4, cz - w * 0.2, cx + sd * w, -0.93 + up, cz + w * 0.5);
          Q.push(t, 0, sd, t, 1, sd);
        }
        for (let i = 0; i < n; i++) { const a = base + i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 3)); g.setIndex(I);
      const wake = new THREE.Mesh(g, new THREE.ShaderMaterial({
        uniforms: wakeU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: 'attribute vec3 aQ; varying vec3 vQ; uniform float uTime, uPull; void main(){ vQ = aQ; vec3 p = position; p.y += 0.03*sin(uTime*9.0 + aQ.x*14.0 + aQ.z)*aQ.y; gl_Position = projectionMatrix*modelViewMatrix*vec4(p, 1.0); gl_Position.z = mix(gl_Position.z, -gl_Position.w, uPull); }',
        fragmentShader: /* glsl */`
varying vec3 vQ; uniform float uTime, uA; uniform vec3 uCol;
${HASH_GLSL}
void main(){
  float n = wFbm(vec2(vQ.x*5.0 - uTime*3.2, vQ.y*2.6 + vQ.z*7.0));
  float a = smoothstep(0.28, 0.6, n + 0.25*(1.0 - vQ.x))*smoothstep(0.0, 0.08, vQ.x)*(1.0 - smoothstep(0.55, 1.0, vQ.x))*smoothstep(0.0, 0.25, vQ.y)*(1.0 - smoothstep(0.7, 1.0, vQ.y))*uA*0.85;
  gl_FragColor = vec4(uCol*a, a);
}`,
      }));
      wake.frustumCulled = false; wake.renderOrder = 8; wake.name = 'bow-wave'; rig.add(wake);
    }
    // nose spray (looping) and the veil of spray at the lip (capped at 60%, never white)
    const spray = makeBurst(rng.fork('spray'), { count: 110, dir: [0, 0.75, 0.3], spread: 0.9, speed: [1.4, 4.4], size: [0.025, 0.13], life: 0.6, gravity: 7, color: shade, alpha: 0, loop: true, jitter: [0.45, 0.04, 0.14], over: sprayOver });
    spray.uniforms.uOrigin.value.set(0, -0.82, -1.8); spray.mesh.renderOrder = 9; rig.add(spray.mesh);
    const lipCol = shade.clone().lerp(gilt, 0.45);
    const lipSpray = makeBurst(makeRng((ctx.seed ?? 1) + 7919), { count: 72, dir: [0, 0.8, -0.4], spread: 0.7, speed: [2.2, 6.5], size: [0.13, 0.6], life: 0.65, gravity: 6, color: lipCol, alpha: 0, loop: true, jitter: [0.55, 0.05, 0.25], over: sprayOver, stretch: 1.2, thin: 0.6, torn: 0.8 });
    lipSpray.uniforms.uOrigin.value.set(0, -0.84, -1.95); lipSpray.mesh.renderOrder = 9; rig.add(lipSpray.mesh);
    // torn spray standing on the brink itself (world space, so it is there whichever way the camera is tipped): it only
    // rises as the drifter closes on it, and thins within 5 m of the lens, so the far view keeps its clean bright curve
    const brinkSpray = makeBurst(makeRng((ctx.seed ?? 1) + 7927), { count: 110, dir: [0, 1, -0.45], spread: 0.32, speed: [2.2, 6.2], size: [0.4, 1.5], life: 0.9, gravity: 6, color: lipCol, alpha: 0, loop: true, jitter: [9, 0.1, 0.7], over: sprayOver, near: 6, stretch: 1.3, thin: 0.55, torn: 0.85 });
    brinkSpray.uniforms.uOrigin.value.set(0, surfY(0.4) + 0.15, 0.4); brinkSpray.mesh.renderOrder = 8; brinkSpray.mesh.name = 'brink-spray'; scene.add(brinkSpray.mesh);
    // and strands of spray torn off the sheet further over: they stand on the water where the brink's curve has turned
    // half way to the shaft's slope, one place in the world
    const edgeSpray = makeBurst(makeRng((ctx.seed ?? 1) + 7933), { count: 120, dir: [0, 0.9, -0.45], spread: 0.3, speed: [2.2, 6.0], size: [0.35, 1.4], life: 0.9, gravity: 6, color: lipCol, alpha: 0, loop: true, jitter: [9.5, 0.15, 0.8], over: sprayOver, near: 6, stretch: 1.3, thin: 0.55, torn: 0.85 });
    { const zEdge = -moulinRoute.brinkRadius * Math.sin(PHI / 2); edgeSpray.uniforms.uOrigin.value.set(0, surfY(zEdge) + 0.2, zEdge); } edgeSpray.mesh.renderOrder = 8; edgeSpray.mesh.name = 'edge-spray'; scene.add(edgeSpray.mesh);
    // The veil is torn spray standing 2.4 m ahead of the lens, thickest along the brink line, gone by the top fifth of
    // the frame and never more than 40%. It is not depth-tested: it fades out toward the water in world space instead
    // (uWat = surface height, its slope along z, and the z they were taken at, set every frame from kit.surfaceY), so the
    // plane never meets the water, or the hull, as a ruled line, whichever way the camera is tipped.
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(14.4, 8.1), new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uA: { value: 0 }, uWat: { value: V3(0, 0, 0) }, uCol: { value: hazeCol.clone().lerp(new THREE.Color('#ffffff'), 0.25).multiplyScalar(0.72).multiply(U.uFoamTint.value) } },
      transparent: true, depthWrite: false, depthTest: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
      vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }',
      fragmentShader: /* glsl */`varying vec2 vUv; varying vec3 vW; uniform float uTime, uA; uniform vec3 uCol, uWat;
${HASH_GLSL}
void main(){
  vec2 q = vUv*vec2(9.0, 5.0);
  float n = wFbm(q + vec2(0.0, -uTime*2.4)), n2 = wNoise(q*2.6 + vec2(uTime*0.8, -uTime*3.4));
  float torn = smoothstep(0.4, 0.74, n*0.72 + n2*0.4);
  float over = vW.y - (uWat.x + uWat.y*(vW.z - uWat.z));                     // metres above the water
  float a = uA*torn*smoothstep(0.39, 0.5, vUv.y)*(1.0 - smoothstep(0.53, 0.67, vUv.y))*smoothstep(0.15, 1.1, over);
  a *= 1.0 - smoothstep(0.8, 1.0, abs(vUv.x*2.0 - 1.0));
  gl_FragColor = vec4(uCol*a, a);
}`,
    }));
    veil.position.set(0, 0, -2.4); veil.renderOrder = 10; veil.frustumCulled = false; veil.visible = false; rig.add(veil);

    await ctx.yield();
    // ---- 4n. air: spindrift streaking across from the left (or falling snow), following the camera
    const snow = fx.makeParticles(mood.fall
      ? { rng: rng.fork('snow'), preset: 'snow', time: U.uTime, count: Math.round(4200 * detail), box: [56, 30, 56], velocity: [3.2, -1.7, -0.6], colors: mood.snowCol }
      : { rng: rng.fork('snow'), preset: 'snow', time: U.uTime, count: Math.round(2600 * detail * Math.min(mood.snow + 0.45, mood.snowCap || 1.6)), box: [58, 20, 58], mode: 'streak', shape: 'streak', stretch: 0.03,
        velocity: [11.5, -0.5, -2.2], velocityRandom: [3, 0.7, 1.6], turbulence: [0.9, 0.5, 0.9], size: [0.022, 0.05], colors: mood.snowCol, intensity: 1.35, opacity: 0.5, additive: 0.55 });
    scene.add(snow.object);
    await ctx.yield();

    // ---- 4o. update: everything scripted is keyed to sc, the camera's centreline metres (from u)
    const snowOp = mood.fall ? 0.92 : mood.snowOp || 0.5;
    const hF = V3(), hU = V3(), cp3 = V3(), camQ = new THREE.Quaternion();
    const update = (dt, time, camera, u) => {
      const sc = sOfU(u || 0);
      camera.getWorldPosition(cp3); camera.getWorldQuaternion(camQ);      // the camera behind a portal has only its world matrix set
      hF.set(0, 0, -1).applyQuaternion(camQ); hU.set(0, 1, 0).applyQuaternion(camQ);
      hero.update(dt, time, camera);                             // sets uTime and the shaft's ink fog from the camera's depth
      sky.update(dt, time, camera);
      bank.position.set(cp3.x, cp3.y + 326.5, cp3.z);
      if (cirrus) cirrus.position.copy(cp3);
      lake.update(dt, time, camera);
      for (const f of falls) f.update(dt, time, camera);
      for (const fb of fallFeet) fb.uniforms.uAge.value = time;
      snow.update(dt, time, camera);
      snow.setOpacity(snowOp * (1 - smoothstep(S_LIP + 2, S_LIP + 34, sc)));
      poseChunks(time, sc, cp3);
      // staged splashes (seconds at the nominal 22 m/s)
      slabBurst.uniforms.uAge.value = (sc - sSlabHit) / 22;
      blockBurst.uniforms.uAge.value = (sc - (rare ? sFell : sBlockHit)) / 22;
      if (curtain) {
        const age = (sc - sBlockGo) / 22, t = Math.max(age, 0);
        curtain.uniforms.uAge.value = age;
        curtain.uniforms.uAlpha.value = 0.42 * (1 - 0.5 * smoothstep(0.8, 1.25, age));      // flakes and streaks: the wall's bands stay readable through it
        // it falls whole, meets the water at about 0.8 s, and goes under behind its own spray
        bridge3.position.y = -4.2 * t * t - 6 * Math.max(t - 0.95, 0); bridge3.rotation.z = 0.05 * t * t; bridge3.visible = t < 1.42;
      }
      // the drifter rides with whichever camera we were handed. It is not drawn for the camera that looks in through
      // the previous world's portal (u = 0), and bobs up into the bottom of the frame over the first quarter second.
      const rise = 1 - smoothstep(0, 0.006, u || 0);
      rig.visible = (u || 0) > 0;
      // In the shaft the steady camera looks above the path, so the ring sits low in its frame, close over the hull: the
      // rig then sinks by up to 0.35 m (by how far below the gaze the ring lies), and the nose keeps to the foot of the frame.
      cA.copy(A.portalSeat.position).sub(cp3);
      const below = Math.atan2(-cA.dot(hU), Math.max(cA.dot(hF), 1e-3)) / DEG;
      const sink = 0.35 * smoothstep(5, 14, below) * smoothstep(S_LIP + 30, S_LIP + 52, sc);
      rig.position.copy(cp3).addScaledVector(hU, -0.55 * rise - sink); rig.quaternion.copy(camQ);
      const depth = Math.max(0, -cp3.y - 13), day = Math.exp(-depth / 50), onLake = 1 - smoothstep(S_CHUTE + 4, S_CHUTE + 38, sc);
      const chute = bell(sc, S_CHUTE, S_CAN + 10, 0.3), wash = bell(sc, sSlabHit + 18, sSlab + 16, 0.3), lip = bell(sc, S_LIP - 16, S_LIP + 44, 0.25);
      const inAir = smoothstep(S_LIP + 2, S_LIP + 30, sc);
      paintRig.uniforms.uLit.value = onLake;
      paintRig.uniforms.uDay.value = 0.05 + 0.95 * day;
      paintRig.uniforms.uAmb.value.setRGB(0.26, 0.34, 0.9).multiplyScalar(0.55 * smoothstep(15, 70, depth) * (1 - 0.8 * smoothstep(150, 250, depth)));
      paintRig.uniforms.uPortalK.value = 0.55 * smoothstep(120, 258, depth);
      // OVER THE BRINK. The hull is rigid to the camera, and the gaze tips down into the shaft before the water does
      // (long before, with the steady camera), so the nose would dip under the surface (kit.surfaceY). Lifting the hull
      // to keep it afloat swelled it to half the frame. Instead: (1) through the brink the drifter, its bow wave and its
      // spray are drawn in front of the water (uPull squeezes their depth toward the lens), so the nose stays where it
      // is all ride, in the bottom sixth of the frame, and the water never cuts it; (2) the float answers the curve with
      // a centimetre of lift and counter-pitch only; (3) what is left of the dip (lipDip, metres) throws foam and spray over the nose.
      let lipLift = 0, lipPitch = 0, lipDip = 0;
      const lipK = bell(sc, S_LIP - 62, S_LIP + 30, 0.12);
      const pull = 0.5 * smoothstep(S_LIP - 66, S_LIP - 56, sc) * (1 - smoothstep(S_LIP + 30, S_LIP + 44, sc));
      if (lipK > 0.001 && Math.abs(cp3.x) < 3) {
        const uy = Math.max(hU.y, 0.35);
        const nY = cp3.y - 0.9 * hU.y + 1.8 * hF.y, nZ = cp3.z - 0.9 * hU.z + 1.8 * hF.z, mY = cp3.y - 1.0 * hU.y + 0.75 * hF.y, mZ = cp3.z - 1.0 * hU.z + 0.75 * hF.z;
        const Ln = Math.max(0, surfY(nZ) - 0.03 - nY) / uy, Lm = Math.max(0, surfY(mZ) - 0.05 - mY) / uy;
        // lift L and pitch P with L + 1.8 P = Ln at the nose and L + 0.75 P = Lm amidships; never a negative lift
        let P = (Ln - Lm) / 1.05, L = Lm - 0.75 * P;
        if (P < 0) { P = 0; L = Lm; } else if (L < 0) { L = 0; P = Ln / 1.8; }
        lipPitch = clamp(P, 0, 0.012) * lipK; lipLift = clamp(L, 0, 0.015) * lipK;      // a breath of it: more and the deck climbs the frame
        lipDip = clamp(Ln * lipK - lipLift - 1.8 * lipPitch, 0, 1.5);
      }
      const plough = smoothstep(0.05, 0.5, lipDip) * (1 - inAir);
      paintRig.uniforms.uPull.value = pull; wakeU.uPull.value = pull; spray.uniforms.uPull.value = pull; lipSpray.uniforms.uPull.value = pull;
      floatG.position.y = 0.018 * Math.sin(time * 2.3) + 0.04 * chute * Math.sin(sc * 0.8) + 0.012 * Math.sin(sc * 0.37) + lipLift;
      floatG.rotation.x = 0.014 * Math.sin(time * 1.7) + 0.05 * chute * Math.sin(sc * 0.8 + 1) + 0.02 * wash * Math.sin(time * 9) + lipPitch;
      floatG.rotation.z = 0.018 * Math.sin(time * 1.3 + 1) + 0.07 * plan.turn(sc) + 0.03 * inAir * Math.sin(time * 0.9);
      wakeU.uA.value = (1 - smoothstep(S_LIP + 4, S_LIP + 15, sc)) * (0.6 + 0.4 * chute + 0.5 * plough);
      wakeU.uCol.value.copy(shade).lerp(gilt, onLake);
      spray.uniforms.uAge.value = time;
      spray.uniforms.uAlpha.value = Math.min(0.9, 0.6 * chute + 0.6 * wash + 0.7 * lip + 0.4 * plough) * (0.3 + 0.7 * day);
      spray.uniforms.uCol.value.copy(shade).lerp(gilt, onLake);
      lipSpray.uniforms.uAge.value = time;
      brinkSpray.uniforms.uAge.value = time; brinkSpray.uniforms.uAlpha.value = 0.5 * bell(sc, S_LIP - 24, S_LIP + 30, 0.25) * (0.3 + 0.7 * day);
      edgeSpray.uniforms.uAge.value = time; edgeSpray.uniforms.uAlpha.value = 0.55 * bell(sc, S_LIP - 3, S_LIP + 38, 0.3) * (0.3 + 0.7 * day);
      lipSpray.uniforms.uAlpha.value = Math.min(0.9, 0.75 * bell(sc, S_LIP - 9, S_LIP + 15, 0.3) + 0.3 * plough) * (0.3 + 0.7 * day);
      const va = 0.4 * bell(sc, S_LIP - 6, S_LIP + 7, 0.4);      // gone before the gaze is on the falling sheet: the torn sprays stand there instead
      veil.visible = va > 0.003; veil.material.uniforms.uA.value = va;
      if (va > 0.003) {
        const zc = cp3.z + 2.4 * hF.z;
        veil.material.uniforms.uWat.value.set(surfY(zc), clamp((surfY(zc + 0.6) - surfY(zc - 0.6)) / 1.2, -3, 3), zc);
      }
    };

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // ---- 4p. the contract
    return {
      scene, path, duration: 40, title: mood.title,
      camera: { fov: 68, near: 0.2, far: 12000, lookAhead: 16, sway: 0.3, bank: 1.5 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#A8F0FF', glow: 1, revealDistance: 280, tilt: true },
      post: { exposure: mood.exposure, bloom: mood.bloom, grade: mood.grade },
      ride: 'none',
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
