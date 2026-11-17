// THE GARDEN UNDERFOOT hero set piece: THE CARPET ITSELF, a Persian four-fold garden knotted in wool,
// built 300 times life size, whose pool, canals, cypresses and animals live only as dye in fixed knots.
//
// WHAT IT IS
//   One carpet 480 m wide (x) and 780 m long (z): 800 by 1,300 knots of 0.6 m. Border 60 m (edge
//   binding, diamond guard, main border of palmettes and rosettes on a running vine whose buds march
//   round the carpet, crenellated inner guard, corner rosettes), flat-woven bands 9 m deep at both ends,
//   and the field: two pale canals 24 m wide crossing in an eight-lobed pool 200 m across with a
//   rosette island 44 m across; in each quarter four cypresses in relief (two rows of two), six
//   blossoming trees whose flowers open and close in four stepped frames, striped flower beds and a
//   millefleur ground. Woven creatures, all moved by recolouring whole knots: five carp circling the
//   rosette, a sixth pacing the camera down the north canal, four pairs of ducks (14 m) trailing chevron wakes,
//   six gazelles (34 m, saffron in an indigo outline, each on a scalloped ivory reserve that steps with it) stepping and grazing in the beds, four birds hopping between the trees, lotus
//   drifting a knot at a time, ripple rings and canal scales marching outward from the pool.
//   Within ~48 m of the camera the knots are real geometry: blunt square tufts 2.4 m high (3 m where
//   the design is cut in relief, 4.3 m on the cypresses, which also throw an 11 m shadow away from the sun
//   and show a lit and a lee flank at every distance) on the strict knot grid, each dyed by the same function, leaning
//   with the nap. Beyond that the same pattern is a flat knot shader with pillow relief and relief
//   shadows; under 2.5 px per knot it stops snapping and softens (no sparkle).
//
// SPACE   Hero-local = the brief's world moved by (0, 0, +390): place object.position at (0, 0, -390).
//   x east, +z south (front, where the camera enters), y up. Carpet x -240..240, z -390..390. Pool
//   centre = origin. Brief's north canal run is local z -110..-310, x 0. Do not rotate or scale the
//   object (light and dye use position - object.position). The backing plane lies at y = 0.2, tuft
//   tops at 2.6 (3.2 in relief). radius is returned as 110 (the pool and its rim, the heart of the piece;
//   the whole carpet is anchors.halfWidth 240 by anchors.halfLength 390) and height as 150 = the viewing
//   height of the brief's apex (the piece itself is 3.2 m high: anchors.pileTop), so the part viewer
//   orbits the pool from the heights the flight uses.
//
// OPTS
//   palette   7 hex strings, brief order: ivory, madder, indigo, pale blue, saffron, sage, walnut
//   (colourways: spring = madder field; winter = ivory field in a madder border, indigo beds striped madder, saffron
//   and ivory, bare boughs with madder berries, frozen canals; night = indigo field, madder border and beds, woven lamps)
//   variant   'spring' | 'winter' | 'night' (default: from ctx.vary.hour: dawn -> winter, night ->
//             night, golden -> spring in amber light, else by seed mostly spring)
//   rare      stage the pile wave (default ctx.vary.rare). The wave crosses the field on setProgress u 0.47..0.60 (the whole carpet 0.45..0.62).
//   lead      'carp' | 'ducks': who paces the camera down the north canal (default by seed)
//   tufts     max tuft instances (default 8200; quality.detail shrinks the tuft radius 48 -> 36 m and the count with it)
//
// API (besides the contract fields)
//   setProgress(u)   call every frame with path u. Drives the rare wave only; everything else is
//                    ambient. The pacing carp follows the CAMERA (no u needed): when the camera is
//                    under 40 m and over the north canal the sixth carp slides out 14 m ahead, 3 m right.
//   setLighting({ sunDir:[x,y,z], sunColor, skyColor, bounceColor (THREE.Color or hex, HDR ok),
//                 window:{ x, zc, hz, y0, y1, cell, bar }, creep, branch, leaf, posts, mullions:[zCentre, halfCentreLight, halfPost, transomSpacing], transoms:[firstAboveSill, halfThickness, extraWidthOfTheSouthLight], lattice (0..1: how much of the fine lattice's net the wool keeps), branchLine, sway, cloud, ambTint (the cast of the wool's shade, a THREE.Color) }) retint / re-aim the analytic
//                    light. window is the lattice opening in hero-local coordinates.
//   setWave(x|null)  place the rare wave front by hand (local x), null = back to setProgress.
//   pacer            Vector3 (hero-local), where the pacing carp (or the leading duck) is now: something to aim a gaze at.
//   variant, uniforms (shared: uTime, palette, sun, lattice, creatures), glsl { common, light, nap,
//   dye } so the room, cat and chair can be lit by the SAME lattice pool: include glsl.common +
//   glsl.light, spread hero.lightUniforms into the material, and call gcSun(localPos) (0..1 sun
//   visibility through the lattice incl. branch) then colour = albedo * (uSunCol * gcSun * ndl + uSkyCol
//   * up + uBounceCol * down).
//   setLamps([{ p, reach, color, wrap }])  up to 2 warm lights of the room (a stove, a lantern): gcWarm(P, N) is their soft
//                    pool on any surface; the wool takes it on top of sun and sky.
//   setOccluders([{ a, b, r }])  up to 15 capsules (hero-local) for the things standing on the carpet: gcSun then
//                    carries their soft sun shadow and gAO their contact darkening. A material skips its own
//                    capsules with a uOccSkip vec2 (first index, one past the last). gcLat(P) is the lattice alone,
//                    gcLattice(w, blur) the mask at a window point, gcBranch(w) the branch's signed distance.
//   setGarden({ water, beds, shadow, tufts })  THE RISING GARDEN (the world stands wool trees, a gate and a fountain up from the
//                    pile in mid-flight and drives this): water 0..1 sinks the canals and the pool 3 m and turns them to
//                    flowing silk (a frozen winter canal thaws), beds 0..1 swells the flower beds 5 m into relief, shadow 0..1
//                    lays the long shadows of the standing trees (uniforms.uGT[i] = foot x, z, height now, radius; a negative
//                    radius is a round crown on a thin trunk), tufts 0.3..1 thins the tuft disc. gcLift(q) (in glsl.common) is
//                    the ground's height above the flat pile, for things that must ride it.
//   makeWeaveMaterial({ back:true })  the same weave for the rolled runner: geometry needs attribute
//                    'uv' = carpet coordinates in metres (x, z) and normals; back = dim knot bumps.
//
// ANCHORS (hero-local; add object.position for world space)
//   entry        (0, 9, 435): the brief's entry point, heading -z
//   apex         (140, 150, 100): top of the climbing arc; garden reads whole from here
//   pool         (0, 0, 0) centre; poolRadius 100; rosetteRadius 22; carpRing 52 (radius of the carp)
//   poolPass     (-20, 60, -10): the 60 m pass over the rosette
//   canalRun     [(0, 11, -130), (-8, 9.2, -165), (0, 14, -210)]: the pacing run and the close pass
//   closePass    cypress on the west bank of the north canal: centre (-27, 3.2, -160), 34 by 13 m
//   portalSeat   { position (0, 35, -316), facing (0, 0, 1) }: brief's portal inside the roll's hollow
//   rollAxis     { from (0, 35, -310), to (0, 35, -460), radius 35, hollow 11 }: where the runner lies
//   flyThrough   ordered points of the brief's flight, all >= 6 m above the tuft tops
//   cat (-150, 0, -250)  chairLegs  slippers (195, 0, -130)  yarn (150, 0, 240)  fringeGate (0, 0, 395)
//   cypresses[16], trees[24], beds[...]: centres of the woven things, for pois and for dust shafts
//   window       default lattice window used by the light (local): x 680, z -49..1151 (see LIGHT)
//
// COST   plane 96 x 156 quads (30k tris) + up to 8,200 tufts of 18 tris (148k, only when the camera is
//   under 60 m; zero above) + selvedge ropes (3.7k): <= 182k triangles, 3 draw calls, no textures, no
//   lights. Build 50-90 ms. update() refills the tuft wedge on the CPU (one pass over ~26k knots, only
//   when the camera has moved two knots or turned 2 degrees). While the garden stands (setGarden) the wedge of
//   tufts is drawn half as deep, so that the world's rising garden fits in the same budget.
// LIGHT  Self-lit (linear HDR, scene fog aware, ignores scene lights): sun * lattice mask + sky + bounce.
//   Plus up to two warm lights of the room (setLamps: a stove, a lantern), soft pools with no shadows, laid on the wool
//   on top of sun and sky: in the winter and night colourways they hold warm against the window's cold light.
//   The lattice mask projects the point along the sun ray to the window plane x = window.x and reads a
//   star-and-hexagon (kagome) bar pattern with a penumbra that widens with distance, plus a swaying
//   branch, plus the window's heavy frame (mullions and transoms, uMul / uMul2): bars of shade tens of
//   metres wide that survive the penumbra and cut the pool of light into long lozenges. NOTE the brief's literal window (z -100..-620 world) with its sun (0.74, 0.31, 0.60) would
//   put the pool north of world z = -650; the default window here is widened so the pool covers the
//   whole carpet as the brief's light paragraph asks. Wants thin warm fog, bloom ~0.2.
// STYLE  Knotted wool, no textures. Every colour comes from gcDye(q, t): q is a knot centre in
//   metres, shapes are signed distances softened only by gW (0.3 near = crisp knots; pixel width far).
//   Things move by re-evaluating gcDye with centres snapped to 0.6 m in JS. Wool is matte: value =
//   dye * abrash * nap sheen (0.72..1.2 by lean vs eye) * knot pillow * (sun + ambient); tufts add
//   20:1 fibre streaks, 0.3 dark roots, a paler speckled cut top and a soft rim. No specular anywhere.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EDE3CC', '#A6321F', '#1B2A52', '#6F93B8', '#E0A228', '#5E7B4A', '#8A6238'];
const KNOT = 0.6, HALF_W = 240, HALF_L = 390, BASE_Y = 0.2, NCR = 24;
const VIEW = 0, TEST_RARE = false;   // artist's test switches for the part viewer: view 0 final, 1 pool, 2 canal bank, 3 prairie
const TEST_VARIANT = '';              // force 'spring' | 'winter' | 'night' while testing

// ---------------------------------------------------------------------------------------------------
// GLSL: shared uniforms and helpers
const GC_COMMON = /* glsl */`
#define NCR ${NCR}
#define NOC 15
#define NLAMP 2
uniform float uTime;
uniform vec3 uPal[7];
uniform vec3 uGround, uBorderG, uWaterC, uBedC;
uniform float uWinter, uNight;
uniform vec4 uCrA[NCR];
uniform vec4 uCrB[NCR];
uniform float uPacerK;   // the size of the carp that leads the canal run (creature 5): larger while it is seen from high up
uniform vec3 uSunDir, uSunCol, uSkyCol, uBounceCol;
uniform vec4 uWin;      // window plane x, z centre, half z, creep (m)
uniform vec4 uWin2;     // y0, y1, cell, bar half width
uniform vec4 uBranch;   // sway (m), strength, leaf amount, spacing of the window posts (0 = none)
uniform vec4 uBrA;      // the branch outside the window in window coordinates (z, y): foot xy, tip zw
uniform vec4 uMul;      // the window's mullions: z of the centre light, half its width, half a post's width, spacing of the transoms (0 = none)
uniform vec4 uMul2;     // transoms: height of the first above the sill, half their thickness; z = how much wider the second light south of the centre one is (m)
uniform vec4 uOccA[NOC];   // things standing on the carpet, as capsules: end a, radius
uniform vec4 uOccB[NOC];   // end b, on
uniform vec2 uOccSkip;     // a material skips its own occluders: first index, one past the last
uniform float uPenK;       // penumbra width (1 on the wool; standing things take a wider, softer one)
uniform float uCloud;      // depth of the soft shade that drifts past the window (thin cloud over a low sun), 0 = none
uniform vec4 uWave;     // front x, lift (m), half length, on
uniform vec3 uAmbTint;  // the cast of the shade on the wool (the warm bounce off the oak boards): multiplies the wool's ambient only
uniform vec4 uLampP[NLAMP];   // the warm lights of the room (stove, lantern): position, reach (m)
uniform vec4 uLampC[NLAMP];   // their colour (linear HDR, already flickering), wrap
float gcHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float gcNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gcHash(i), gcHash(i + vec2(1., 0.)), f.x), mix(gcHash(i + vec2(0., 1.)), gcHash(i + vec2(1., 1.)), f.x), f.y); }
float gcSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.); return length(pa - ba * h); }
// warm light of the stove and the lantern on a surface at P with normal N: a soft pool, no shadows
vec3 gcWarm(vec3 P, vec3 N){
  vec3 s = vec3(0.);
  for (int i = 0; i < NLAMP; i++) {
    vec3 d = uLampP[i].xyz - P;
    float dist = sqrt(max(dot(d, d), 1e-3));
    float w = uLampC[i].w;
    float ndl = clamp((dot(N, d) / dist + w) / (1. + w), 0., 1.);
    float q = dist / max(uLampP[i].w, 1.);
    s += uLampC[i].rgb * ndl / (1. + q * q) * (1. - smoothstep(1.1, 3., q));
  }
  return s;
}
// THE RISING GARDEN (driven by the world through setGarden): uGar.x = how far the canals and the pool have sunk and filled
// with silk water (and, in winter, thawed), uGar.y = how far the flower beds have swollen, uGar.w = strength of the long
// shadows of the trees that stand up from the pile; uGT[i] = one standing tree: foot x, z, height now (0 = flat), radius
// (negative: a round crown on a thin trunk).
#define NGT 40
uniform vec4 uGar;
uniform vec4 uGT[NGT];
float gcFieldK(vec2 q){ return (1. - smoothstep(170., 179., abs(q.x))) * (1. - smoothstep(320., 329., abs(q.y))); }
float gcWaterD(vec2 q){ vec2 A = abs(q); vec2 p = A; if (p.y > p.x) p = p.yx;
  float dP = min(length(p) - 80., min(length(p - vec2(74., 0.)) - 26., length(p - vec2(52.33, 52.33)) - 26.));
  return min(min(A.x, A.y) - 12., dP); }
float gcBedD(vec2 q){ vec2 A = abs(q);
  float dA = max(max(abs(mod(A.x - 24., 44.) - 19.) - 19., abs(A.y - 279.) - 39.), max(24. - A.x, A.x - 156.));
  float dB = max(max(abs(A.x - 142.) - 30., abs(mod(A.y - 22., 50.) - 22.) - 22.), max(22. - A.y, A.y - 122.));
  return min(dA, dB); }
// how far the ground at q stands above (beds) or below (water) the flat pile, in metres
float gcLift(vec2 q){
  float w = gcWaterD(q);
  float sink = -3.2 * uGar.x * (1. - smoothstep(-4.5, 0.6, w)) * gcFieldK(q) * smoothstep(20., 24., length(q));
  float b = 1. - smoothstep(-12., 0.5, gcBedD(q));
  return sink + 5. * uGar.y * b * (2. - b);
}
// the long shadows of the standing trees on the ground at q (1 = open)
float gcTreeSh(vec2 q){
  if (uGar.w < 0.01) return 1.;
  vec2 d = -normalize(uSunDir.xz + vec2(1e-4, 0.));
  float cot = min(length(uSunDir.xz) / max(uSunDir.y, 0.05), 3.2);
  float sh = 1.;
  for (int i = 0; i < NGT; i++) {
    vec4 T = uGT[i];
    if (T.z < 0.5) continue;
    vec2 v = q - T.xy;
    float L = T.z * cot;
    float t = clamp(dot(v, d), 0., L), k = t / max(L, 1.);
    float w = T.w > 0. ? T.w * (1. - 0.8 * k) : 1.6 - T.w * smoothstep(0.42, 0.7, k) * (1. - smoothstep(0.93, 1.06, k) * 0.5);
    float pen = 1.2 + t * 0.05;
    sh *= 1. - (0.9 - 0.45 * k) * (1. - smoothstep(w - pen, w + pen, length(v - d * t)));
  }
  return mix(1., sh, uGar.w);
}
float gcWaveLift(float x){ float s = (x - uWave.x) / max(uWave.z, 1.); return uWave.w * uWave.y * exp(-s * s * 2.2); }
// the rolling wave's light: x = sun multiplier (lit east face, shaded lee), y = pale crest where the nap turns, z = sky light left in the lee
vec3 gcWaveLight(float x){ float s = (x - uWave.x) / max(uWave.z, 1.);
  float lee = uWave.w * (1. - smoothstep(-0.25, 0.05, s)) * exp(-s * s * 0.9);
  return vec3(clamp(1. + uWave.w * 2.6 * max(s, 0.) * exp(-s * s * 6.) - 0.97 * lee, 0.03, 1.6), 1. + 0.75 * uWave.w * exp(-s * s * 26.), 1. - 0.7 * lee); }
// the crest of the rolling wave, where the pile turns over and shows its pale sides (0..1)
float gcWaveCrest(float x){ float s = (x - uWave.x) / max(uWave.z, 1.) - 0.05; return uWave.w * exp(-s * s * 30.); }
`;

// GLSL: the analytic light. gcSun(P): share of the sun reaching hero-local point P through the lattice.
const GC_LIGHT = /* glsl */`
float gAO;   // contact darkening of the last gcSun / gcOcc (1 = open)
float gBars, gBrD;   // of the last gcLattice: 1 in an opening and 0 on a bar; signed distance to the branch
float gLatK = 1.;     // how much of the fine lattice's own pattern the next gcLattice keeps (the wool sets it from uLatK; 1 = all)
// signed distance (m) to the branch outside the window, in window coordinates w = (z, y)
float gcBranch(vec2 w){
  float sw = uBranch.x, lf = uBranch.z;
  vec2 a = uBrA.xy, b = uBrA.zw + vec2(0., sw);
  vec2 ab = b - a;
  float hh = clamp(dot(w - a, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
  float db = length(w - a - ab * hh) - mix(13., 5., hh);
  vec2 n = vec2(-ab.y, ab.x) * 0.1;
  vec2 t1 = mix(a, b, 0.62) + n * 2.6 + vec2(0., sw * 0.7);
  db = min(db, gcSeg(w, mix(a, b, 0.45), t1) - 4.);
  db = min(db, length(w - b - vec2(-10., 12. + sw * 0.5)) - 34. * lf);
  db = min(db, length(w - t1 - vec2(4., 6.)) - 27. * lf);
  db = min(db, length(w - mix(a, b, 0.5) + n * 1.5 - vec2(0., sw * 0.25)) - 22. * lf);
  db = min(db, length(w - mix(a, b, 0.84) + n * 2.0 - vec2(sw * 0.3, sw * 0.6)) - 19. * lf);
  return db + (gcNoise((w - vec2(0., sw * 0.5)) * 0.085 + vec2(uTime * 0.35, -uTime * 0.27)) - 0.5) * 13. * lf;   // the leaves stir
}
// share of the sun passing the lattice at window point w = (z, y), seen through a penumbra of blur metres
float gcLattice(vec2 w, float blur){
  float env = min(uWin.z - abs(w.x - uWin.y), min(w.y - uWin2.x, uWin2.y - w.y));
  float e = smoothstep(-blur * 2., blur * 2., env);
  vec2 g = (w + vec2(0., uWin.w)) / max(uWin2.z, 1.);
  float d0 = abs(fract(g.y) - 0.5);
  float d1 = abs(fract(g.x * 0.866 + g.y * 0.5) - 0.5);
  float d2 = abs(fract(-g.x * 0.866 + g.y * 0.5 + 0.5) - 0.5);
  float d = min(d0, min(d1, d2)) * uWin2.z - uWin2.w;
  float bars = smoothstep(-blur, blur, d);
  // the coarse frame: heavy mullions (a wide centre light, narrower lights either side) and transoms. Their shadows are
  // tens of metres wide, so they outlive the penumbra that blurs the fine lattice: the long bars of shade on the wool
  float sp = max(uBranch.w, 1.);
  float um = abs(w.x - uMul.x) - uMul.y;
  // south of the centre light the third post stands further off (one wide light over the south border): the clear stretch
  // between the second post and the third is drawn out by uMul2.z, the posts themselves keep their width
  um -= uMul2.z * step(uMul.x, w.x) * clamp((um - sp - 20.) / max(sp + uMul2.z - 40., 1.), 0., 1.);
  float dpost = abs(mod(max(um, -0.5 * sp) + 0.5 * sp, sp) - 0.5 * sp) - uMul.z;
  float st = max(uMul.w, 1.);
  float dtr = abs(mod(w.y - uWin2.x - uMul2.x + 0.5 * st, st) - 0.5 * st) - uMul2.y;
  dpost = min(dpost, mix(1e3, dtr, step(1.5, uMul.w)));
  float bc = min(blur * 1.6, 5. + blur * 0.3);
  float posts = mix(1., smoothstep(-bc, bc, dpost), step(1.5, uBranch.w));
  gBars = bars * e * posts; gBrD = gcBranch(w);
  float br = 1. - uBranch.y * (1. - smoothstep(-blur * 3. - 4., blur * 3. + 4., gBrD));
  float cl = 1. - uCloud * smoothstep(0.38, 0.72, gcNoise(w * vec2(0.0035, 0.002) + vec2(uTime * 0.03, uTime * 0.004)));
  // on dark wool the net of the fine lattice reads as blotches: there it is taken toward its own mean, a soft dapple, and
  // the posts' long bars carry the shade
  return e * mix(0.34, 1., mix(0.45, bars, gLatK)) * mix(0.03, 1., posts) * br * cl;
}
// the lattice alone at hero-local point P
float gcLat(vec3 P){
  float t = (uWin.x - P.x) / max(uSunDir.x, 0.05);
  vec3 h = P + uSunDir * t;
  return gcLattice(vec2(h.z, h.y), 0.5 + max(t, 0.) * 0.0021 * uPenK);
}
// soft sun shadow of the capsules (returned) and their contact darkening (gAO)
float gcOcc(vec3 P){
  float sh = 1.; gAO = 1.;
  for (int i = 0; i < NOC; i++) {
    vec4 A = uOccA[i], B = uOccB[i];
    float fi = float(i);
    if (B.w < 0.5 || (fi >= uOccSkip.x && fi < uOccSkip.y)) continue;
    vec3 pa = P - A.xyz, ba = B.xyz - A.xyz;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0., 1.);
    float d = length(pa - ba * h);
    gAO *= mix(0.42, 1., smoothstep(A.w * 0.9, A.w * 1.75, d));
    vec3 pp = pa - uSunDir * dot(pa, uSunDir), bp = ba - uSunDir * dot(ba, uSunDir);
    float h2 = clamp(dot(pp, bp) / max(dot(bp, bp), 1e-4), 0., 1.);
    float d2 = length(pp - bp * h2);
    float along = dot(ba * h2 - pa, uSunDir);
    float pen = 1.2 + max(along, 0.) * 0.035;
    float s = smoothstep(A.w - pen, A.w + pen * 1.5, d2);
    sh *= mix(1., mix(0.06, 1., s), smoothstep(-A.w * 0.2, A.w * 0.6, along));
  }
  return sh;
}
// share of the sun reaching hero-local point P: through the lattice, past the branch, past the things on the carpet
float gcSun(vec3 P){ return gcLat(P) * gcOcc(P); }
`;

// GLSL: the nap. gcNap(q, t): unit lean of the pile (xz); gcSheen: value multiplier by lean vs eye.
const GC_NAP = /* glsl */`
vec2 gcNap(vec2 q, float t){
  // the lie of the pile wanders only a little, so the ground keeps one value and it is the strokes and the canal bands that turn pale
  float a = (gcNoise(q * 0.011 + vec2(t * 0.013, -t * 0.009)) - 0.5) * 1.7;
  a += (gcNoise(q * 0.035 + vec2(-t * 0.02, t * 0.016) + 7.3) - 0.5) * 0.9;
  vec2 A = abs(q);
  float canal = 1. - smoothstep(10., 16., min(A.x, A.y));
  float s = max(A.x, A.y);
  float bandC = smoothstep(0.55, 1., sin(s * 0.045 - t * 0.55 + gcNoise(q * 0.02) * 2.));
  a += canal * bandC * 2.6;
  // the strokes: bands where the pile has been turned over, crossing the carpet one after another as if a hand were smoothing it
  float st = mod(dot(q, vec2(0.83, 0.56)) - t * 16., 420.) - 210.;
  a += 2.9 * exp(-st * st / 900.);
  float sw = (q.x - uWave.x) / max(uWave.z, 1.);
  a += uWave.w * 3.1 * exp(-sw * sw * 3.);
  return vec2(sin(a), cos(a));
}
float gcSheen(vec2 lean, vec3 toEye){ return mix(1.22, 0.8, 0.5 + 0.5 * dot(lean, toEye.xz)); }
float gcKnot(vec2 f){ vec2 c = f - 0.5; float slot = smoothstep(0.39, 0.5, max(abs(c.x), abs(c.y)));
  float pil = 1.04 + 0.8 * dot(c, uSunDir.xz) - 0.2 * (1. - smoothstep(0.0, 0.09, abs(c.y)));   // pillow, and the groove between the knot's two ends
  return mix(pil, 0.42, slot); }
`;

// GLSL: the dye. Part A: helpers, the fixed shapes, relief, the woven creatures.
const GC_DYE_A = /* glsl */`
float gW;      // edge softening in metres: 0.3 at knot scale, the pixel footprint far away
float gGlow;   // emissive share of the last gcDye (night lamps, moths)
float gLobe;   // of the last gcReserve: +1 on a lobe of the scalloped edge, -1 between two
float gcIn(float d){ return clamp(0.5 - d / gW, 0., 1.); }
float gcBand(float d, float a, float b){ return gcIn(d - b) * (1. - gcIn(d - a)); }
float gcBox(vec2 p, vec2 h){ vec2 d = abs(p) - h; return max(d.x, d.y); }
float gcEll(vec2 p, vec2 r){ return (length(p / r) - 1.) * min(r.x, r.y); }
float gcPool(vec2 q){ vec2 p = abs(q); if (p.y > p.x) p = p.yx;
  return min(length(p) - 80., min(length(p - vec2(74., 0.)) - 26., length(p - vec2(52.33, 52.33)) - 26.)); }
float gcCypress(vec2 A, out vec2 l){
  l = A - vec2(A.x < 90. ? 27. : 153., A.y < 180. ? 160. : 200.);
  float s = (l.y + 4.) / (l.y > -4. ? 21. : 11.);
  float wd = 6.6 * (l.y > -4. ? max(1. - s * s, 0.) : sqrt(max(1. - s * s, 0.)));
  return max(abs(l.x) - wd, (abs(s) - 1.) * 11.);
}
// border frame: x = depth into the border from the edge, y = coordinate along it, z = 1 on the long sides
vec3 gcBorder(vec2 q){ vec2 A = abs(q); float ex = 240. - A.x, ez = 390. - A.y;
  return ex < ez ? vec3(ex, q.y, 1.) : vec3(ez, q.x, 0.); }
float gcPalmette(vec3 b, vec2 A, out vec2 pp, out float alt){
  float cell = b.z > 0.5 ? 39. : 40.;
  float ci = floor(b.y / cell); alt = mod(ci, 2.);
  pp = vec2(b.y - (ci + 0.5) * cell, (b.x - 30.) * (alt > 0.5 ? 1. : -1.));
  float d = min(gcEll(pp - vec2(0., -1.), vec2(7.2, 9.6)), length(pp - vec2(0., 8.2)) - 3.6);
  float corner = step(180., A.x) * step(330., A.y);
  vec2 cq = abs(A - vec2(210., 360.)); if (cq.y > cq.x) cq = cq.yx;
  float dc = min(length(cq) - 5., min(gcEll(cq - vec2(9., 0.), vec2(5., 2.9)), gcEll(vec2(cq.x + cq.y, cq.y - cq.x) * 0.7071 - vec2(9., 0.), vec2(5., 2.9))));
  return mix(d, dc, corner);
}
// 1 where the pile is cut high (3 m): cypresses, the pool rim, palmettes and corner rosettes
float gcRelief(vec2 q){
  vec2 A = abs(q); vec2 l; float al;
  vec3 b = gcBorder(q);
  if (b.x < 60.) return gcIn(gcPalmette(b, A, l, al) - 0.6) * step(14.4, b.x) * step(b.x, 45.6);
  float r = gcIn(gcCypress(A, l));
  return max(r, gcBand(gcPool(q), -0.6, 3.0) * step(12.6, min(A.x, A.y)));
}
// the cypresses are cut highest of all: x = the long shadow they throw away from the sun, y = 1 on the sunward flank
// falling to 0 on the lee flank, z = 1 on the cypress itself
vec3 gcCyRelief(vec2 q, vec2 sd){
  vec2 l;
  float d0 = gcCypress(abs(q), l);
  float d1 = gcCypress(abs(q + sd * 2.2), l);
  float dm = min(min(d1, gcCypress(abs(q + sd * 4.4), l)), min(gcCypress(abs(q + sd * 6.6), l), gcCypress(abs(q + sd * 8.8), l)));
  float dl = gcCypress(abs(q + sd * 11.2), l);
  float inC = gcIn(d0), w = gW + 0.6;
  float sh = max(1. - smoothstep(-w, w, dm), 0.55 * (1. - smoothstep(-w, w * 2.5, dl)));
  return vec3(sh * (1. - inC), clamp(0.5 + (d1 - d0) * 0.2, 0., 1.), inC);
}
// a reserve (the medallion an animal stands on): an ellipse with a scalloped edge of sixteen lobes; pe in metres from its centre
float gcReserve(vec2 pe, vec2 r){
  vec2 e = pe / r; float pl = max(length(e), 1e-3);
  vec2 c1 = e / pl;
  vec2 c2 = vec2(c1.x * c1.x - c1.y * c1.y, 2. * c1.x * c1.y);
  vec2 c4 = vec2(c2.x * c2.x - c2.y * c2.y, 2. * c2.x * c2.y);
  vec2 c8 = vec2(c4.x * c4.x - c4.y * c4.y, 2. * c4.x * c4.y);
  gLobe = c8.x * c8.x - c8.y * c8.y;
  return (pl - 1.) * min(r.x, r.y) + 1.1 * gLobe;
}
// the woven creatures: centres and frames come from JS, already snapped to whole knots
void gcCreatures(vec2 q, inout vec3 col){
  vec3 I = uPal[0], M = uPal[1], N = uPal[2], B = uPal[3], S = uPal[4], G = uPal[5], W = uPal[6];
  for (int i = 0; i < NCR; i++) {
    vec4 ca = uCrA[i], cb = uCrB[i];
    vec2 d = q - ca.xy;
    if (i == 5) d /= max(uPacerK, 1.);
    if (cb.x < 0.5 || dot(d, d) > 1400.) continue;
    float flip = cb.z < 0. ? -1. : 1.;
    float keep = clamp(abs(cb.z), 0., 1.);                 // 1 = full dye, less = dim shape under ice
    float l = dot(d, ca.zw), w = (d.y * ca.z - d.x * ca.w) * flip;
    float fr = cb.y;
    vec3 c = col; float m = 0.;
    if (cb.x < 1.5) {                                      // carp, 16 m: l forward
      float w2 = w - fr * 0.6 * clamp((-l - 2.) / 3., 0., 2.);
      float dB = gcEll(vec2(l - 0.6, w2), vec2(6.3, 2.35));
      float dT = max(abs(w2) - (-l - 4.4) * 0.8, max(-l - 8.8, l + 4.8));
      float dF = gcEll(vec2(l - 1.6, abs(w2) - 2.5), vec2(1.7, 1.0));
      float dd = min(dB, min(dT, dF));
      m = gcIn(dd - 0.6);
      c = N;
      c = mix(c, S, gcIn(dd));
      c = mix(c, M, gcIn(max(dB, 0.25 - sin(l * 1.05 + cb.w * 2.4))) * step(-0.5, w2));
      c = mix(c, M, gcIn(dT + 0.3));
      c = mix(c, I, gcIn(max(dB + 0.3, w2 + 1.0)));
      c = mix(c, I, gcIn(gcBox(vec2(l - 6.3, w2), vec2(0.5, 0.75))));
      c = mix(c, N, gcIn(gcBox(vec2(l - 4.5, abs(w2) - 1.05), vec2(0.3))));
      gGlow = max(gGlow, m * 0.09 * uNight);
    } else if (cb.x < 2.5) {                               // duck, 14 m, with its chevron wake
      float k = 1.55; vec2 p = vec2(l, w) / k;
      float dB = k * gcEll(vec2(p.x + 0.6, p.y), vec2(3.4, 2.1));
      float dH = k * (length(vec2(p.x - 3.3, p.y)) - 1.5);
      float dK = k * gcBox(vec2(p.x - 5.2, p.y), vec2(0.75, 0.5));
      float dd = min(dB, min(dH, dK));
      float arm = abs(abs(w) - (-l - 2.4) * 0.5) - 0.6;
      float dash = abs(mod(-l - fr * 0.6, 4.8) - 2.4) - 1.5;
      float wk = gcIn(max(max(arm, dash), max(l + 6., -l - 35.)));
      m = max(gcIn(dd - 0.6), wk);
      c = mix(I, N, gcIn(dd - 0.6));
      c = mix(c, cb.w > 0.5 ? I : mix(W, I, 0.35), gcIn(dB));
      c = mix(c, W, gcIn(k * gcEll(vec2(p.x + 1.2, p.y), vec2(2.1, 1.0))));
      c = mix(c, cb.w > 0.5 ? G : W, gcIn(dH));
      c = mix(c, S, gcIn(dK));
    } else if (cb.x < 3.5) {                               // gazelle, 34 m, side elevation (w is up), on a scalloped reserve that steps with it
      float k = 1.7;
      float graze = step(9.5, fr), sf = fr - 10. * graze;
      vec2 p = vec2(l, w) / k;
      vec2 hd = mix(vec2(8.7, 4.7), vec2(9.5, -4.2), graze);
      float dB = k * min(gcEll(p - vec2(-2.5, 0.9), vec2(3.7, 3.1)), gcEll(p - vec2(2.3, 0.7), vec2(4.4, 2.8)));   // haunch and barrel
      float dN = k * (gcSeg(p, vec2(5.3, 1.6), hd) - 1.2);
      float dH = k * gcEll(p - hd - vec2(0.9, -0.1), vec2(2.1, 1.3));
      float dHorn = k * (min(gcSeg(p, hd + vec2(-0.2, 1.0), hd + vec2(-2.3, 3.4)), gcSeg(p, hd + vec2(-2.3, 3.4), hd + vec2(-1.5, 5.4))) - 0.42);
      float o = mod(sf + step(0.2, p.x), 2.) < 0.5 ? 1.75 : 0.5;   // two pairs of legs that open and close in turn as it strides
      float lx = abs(abs(p.x - 0.2) - 4.2) - o;
      float legX = abs(lx) - 0.56;
      float dL = k * max(legX, max(p.y + 0.6, -p.y - 7.3));
      float dHf = k * max(legX, max(p.y + 6.4, -p.y - 7.3));
      float dTl = k * gcEll(p - vec2(-6.5, 2.7), vec2(1.3, 0.8));
      float dA = min(min(dB, dN), min(min(dH, dL), dTl));
      float dR = gcReserve(vec2(l - 2.6, w - 0.6), vec2(23., 18.5));
      m = gcIn(dR - 0.8);
      c = mix(N, mix(I, S, 0.1 + 0.45 * uNight), gcIn(dR));
      c = mix(c, M, gcBand(dR, -3.1, -1.9));
      c = mix(c, mix(G, N, 0.3), gcIn(max(abs(dR + 5.4) - 0.6, 0.3 - gLobe)));
      // a saffron animal in an indigo outline one knot wide: ivory belly and scut, indigo horns, hooves and eye, a madder collar
      c = mix(c, N, gcIn(min(dA, dHorn) - 0.75));
      c = mix(c, S, gcIn(dA));
      c = mix(c, I, gcIn(max(dB + 0.5, (p.y + 0.55) * k)));
      c = mix(c, M, gcIn(max(dN, abs(dot(p - vec2(6.6, 2.7), vec2(0.6, 0.8))) * k - 0.5)));
      c = mix(c, N, gcIn(min(dHf, dHorn)));
      c = mix(c, I, gcIn(dTl + 0.3));
      c = mix(c, N, gcIn(k * (length(p - hd - vec2(1.1, 0.3)) - 0.4)));
    } else if (cb.x < 4.5) {                               // small ivory bird, 5 m
      float dB = gcEll(vec2(l, w), vec2(2.0, 1.35));
      float dT = gcBox(vec2(l + 2.7, w), vec2(1.2, 0.5));
      float dK = gcBox(vec2(l - 2.4, w), vec2(0.6, 0.3));
      float dd = min(dB, min(dT, dK));
      m = gcIn(dd - 0.6);
      c = mix(N, I, gcIn(dd));
      c = mix(c, S, gcIn(dK));
      c = mix(c, M, gcIn(gcBox(vec2(l - 0.2, abs(w) - 0.5), vec2(0.6, 0.3))));
    } else if (cb.x < 5.5) {                               // crane (winter), side elevation
      float k = 1.6; vec2 p = vec2(l, w) / k;
      float dB = k * gcEll(p, vec2(4.4, 2.4));
      vec2 hd = mix(vec2(5.6, 8.6), vec2(7.4, -5.6), step(9.5, fr));
      float dN = k * (gcSeg(p, vec2(3.2, 1.2), hd) - 0.7);
      float dH = k * gcEll(p - hd - vec2(0.7, 0.), vec2(1.4, 0.9));
      float dK = k * gcBox(p - hd - vec2(2.9, -0.1), vec2(1.1, 0.3));
      float o = mod(fr, 2.) < 0.5 ? 1.5 : 0.4;
      float dL = k * max(abs(abs(p.x) - o) - 0.36, max(p.y + 1.5, -p.y - 8.6));
      float dP = k * gcEll(p - vec2(-4.4, -0.8), vec2(2.2, 1.5));
      float dR = gcReserve(vec2(l - 2., w - 0.5), vec2(20., 18.5));
      m = gcIn(dR - 0.8);
      c = mix(N, mix(B, I, 0.25), gcIn(dR));
      c = mix(c, M, gcBand(dR, -3.1, -1.9));
      c = mix(c, S, gcIn(max(abs(dR + 5.4) - 0.6, 0.3 - gLobe)));
      float dA = min(min(dB, dN), min(min(dH, dK), min(dL, dP)));
      c = mix(c, N, gcIn(dA - 0.6));
      c = mix(c, N, gcIn(dL));
      c = mix(c, I, gcIn(min(dB, min(dN, dH))));
      c = mix(c, N, gcIn(dP + 0.3));
      c = mix(c, M, gcIn(k * (length(p - hd - vec2(0.5, 0.5)) - 0.6)));
      c = mix(c, S, gcIn(dK));
    } else {                                               // moth (night): two pale wings that open and close
      float op = fr > 0.5 ? 1. : 0.45;
      float dd = max(abs(l) - 2.7 * op, abs(w) - 2.4 + abs(l) * 0.55);
      m = gcIn(dd);
      c = mix(I, B, 0.3);
      c = mix(c, N, gcIn(gcBox(vec2(l, w), vec2(0.3, 1.2))));
      gGlow = max(gGlow, m * 0.35);
    }
    col = mix(col, c, m * keep);
  }
}
`;

// GLSL: the dye. Part B: gcDye(q, t) -> rgb dye and pile height (m) at knot centre q (hero-local x, z).
const GC_DYE_B = /* glsl */`
vec4 gcDye(vec2 q, float t){
  gGlow = 0.;
  vec3 I = uPal[0], M = uPal[1], N = uPal[2], B = uPal[3], S = uPal[4], G = uPal[5], W = uPal[6];
  vec2 A = abs(q);
  vec3 b = gcBorder(q);
  float high = 0., tall = 0.;
  vec3 col;
  float frz = uWinter * (1. - uGar.x);                    // how frozen the water is: the winter canals thaw while the garden stands
  float flow = 1. - frz;
  if (b.x < 60.) {
    // ---------------- border ----------------
    float bd = b.x, along = b.y;
    float cell = b.z > 0.5 ? 39. : 40.;
    float dirS = b.z > 0.5 ? (q.x < 0. ? -1. : 1.) : (q.y < 0. ? 1. : -1.);
    float v = bd - 30.;
    col = uBorderG;
    float ph = along * 3.14159265 / cell;
    float vy = 11. * sin(ph);
    float cs = cos(ph);
    float dv = abs(v - vy) / sqrt(1. + 0.78 * cs * cs) - 0.7;
    float sl = mod(along, 13.) - 6.5;
    col = mix(col, mix(G, I, 0.3), gcIn(gcEll(vec2(sl, abs(v - vy) - 2.5), vec2(2.3, 1.1))));
    col = mix(col, mix(G, I, mix(0.0, 0.45, uNight)), gcIn(dv));
    float sb = mod(along * dirS - 0.6 * floor(t * 2.5), 13.) - 6.5;
    float bud = gcIn(max(abs(sb) - 1.1, dv - 0.8));
    col = mix(col, S, bud);
    gGlow = max(gGlow, bud * uNight * 0.5);
    vec2 pp; float alt;
    float dp = gcPalmette(b, A, pp, alt);
    float corner = step(180., A.x) * step(330., A.y);
    float dcal = gcEll(vec2(abs(pp.x) - 6.4, pp.y + 9.0), vec2(4.6, 2.2)) + corner * 99.;
    col = mix(col, G, gcIn(dcal));
    col = mix(col, I, gcIn(dp - 0.6));
    col = mix(col, mix(N, B, alt * 0.55 * (1. - corner)), gcIn(dp));
    float heart = mix(gcEll(pp - vec2(0., -1.6), vec2(3.9, 5.7)), length(A - vec2(210., 360.)) - 3.6, corner);
    col = mix(col, S, gcIn(heart));
    col = mix(col, M, gcIn(heart + 1.8));
    col = mix(col, I, gcIn(length(pp - vec2(0., 8.2)) - 1.5) * (1. - corner));
    high = gcIn(dp - 0.6);
    // guards
    float gu = mod(along, 6.) - 3., gi = mod(floor(along / 6.), 2.);
    float dia = abs(gu) + abs(bd - 7.8) - 3.1;
    vec3 g1 = mix(I, gi > 0.5 ? M : N, gcIn(dia));
    g1 = mix(g1, S, gcIn(dia + 2.2));
    col = mix(col, g1, gcBand(bd, 3., 12.6));
    float tz = bd - 51.9;
    float cr = mod(along, 7.2) < 3.6 ? tz : -tz;
    vec3 g2 = mix(I, N, gcIn(cr));
    g2 = mix(g2, S, gcIn(abs(abs(tz) - 2.4) - 0.3) * gcIn(abs(mod(along, 3.6) - 1.8) - 0.3));
    col = mix(col, g2, gcBand(bd, 46.8, 57.));
    col = mix(col, N, max(gcBand(bd, 12.6, 14.4), gcBand(bd, 45.6, 46.8)));
    col = mix(col, N, max(gcIn(bd - 1.8), gcBand(bd, 57., 58.2)));
    col = mix(col, I, max(gcBand(bd, 1.8, 3.), gcBand(bd, 58.2, 60.3)));
    high *= step(14.4, bd) * step(bd, 45.6);
    // flat-woven bands at both ends
    float ez = 390. - A.y;
    float kil = gcIn(ez - 9.);
    vec3 kc = mix(I, B, gcBand(mod(ez, 3.), 0.9, 1.8));
    kc = mix(kc, M, gcBand(ez, 4.2, 4.8));
    kc = mix(kc, N, gcBand(ez, 8.4, 9.));
    col = mix(col, kc, kil);
    high *= 1. - kil;
    return vec4(col, mix(mix(2.4, 3.0, high), 0.7, kil));
  }
  // ---------------- field ----------------
  float dC = min(A.x, A.y) - 12.;
  float dP = gcPool(q);
  float dW = min(dC, dP);
  float quad = step(0., q.x) * 13. + step(0., q.y) * 29.;
  col = uGround;
  // millefleur sprigs on the open ground
  { float row = floor(A.y / 9.6);
    vec2 A2 = vec2(A.x + mod(row, 2.) * 4.8, A.y);
    vec2 sid = floor(A2 / 9.6); vec2 sp = A2 - (sid + 0.5) * 9.6;
    float hs = gcHash(sid + quad);
    vec3 pc = hs < 0.33 ? mix(I, M, uWinter) : (hs < 0.66 ? S : mix(B, N, uWinter * 0.6));
    float on = step(0.2, fract(hs * 7.13));
    col = mix(col, mix(G, N, uWinter * 0.7), gcIn(gcBox(abs(sp) - vec2(1.5), vec2(0.45))) * on);
    col = mix(col, pc, gcIn(min(gcBox(sp, vec2(2.1, 0.45)), gcBox(sp, vec2(0.45, 2.1)))) * on);
    col = mix(col, mix(N, M, step(0.5, hs)), gcIn(gcBox(sp, vec2(0.45))) * on);
  }
  // striped flower beds
  { float dA = max(gcBox(vec2(mod(A.x - 24., 44.) - 19., A.y - 279.), vec2(19., 39.)), max(24. - A.x, A.x - 156.));
    float dB = max(gcBox(vec2(A.x - 142., mod(A.y - 22., 50.) - 22.), vec2(30., 22.)), max(22. - A.y, A.y - 122.));
    float dBed = min(dA, dB);
    float sv = mod(dA < dB ? A.y : A.x, 21.6);
    vec3 bc = uBedC;
    bc = mix(bc, M, gcBand(sv, 0., 3.6));
    bc = mix(bc, S, gcBand(sv, 7.2, 10.8));
    bc = mix(bc, I, gcBand(sv, 14.4, 18.));
    float tick = gcIn(abs(mod((dA < dB ? A.x : A.y) + 1.2, 4.8) - 2.4) - 0.3) * gcIn(abs(mod(sv, 7.2) - 5.4) - 0.3);
    bc = mix(bc, mix(N, G, 0.4), tick);
    col = mix(col, I, gcIn(dBed - 1.2));
    col = mix(col, N, gcIn(dBed - 0.6));
    col = mix(col, bc, gcIn(dBed));
  }
  // blossoming trees: 2 by 3 in each quarter
  { vec2 tp = vec2(A.x - 54., A.y - 135.);
    vec2 tid = clamp(floor(tp / vec2(36., 30.)), vec2(0.), vec2(1., 2.));
    vec2 tl = tp - (tid + 0.5) * vec2(36., 30.);
    vec2 cl = tl - vec2(0., 2.5);
    float dcr = length(cl) - 9.6;
    float dtr = gcBox(tl - vec2(0., -10.), vec2(0.9, 3.4));
    col = mix(col, W, gcIn(dtr));
    // spring: a sage crown, scalloped in ivory
    vec3 cc = mix(G, mix(G, N, 0.55), gcBand(dcr, -4.5, -3.3));
    float leaf = gcIn(dcr) * flow;
    col = mix(col, I, gcIn(dcr - 0.6) * flow);
    col = mix(col, cc, leaf);
    // winter: bare boughs
    float bw = min(gcBox(tl - vec2(0., 1.), vec2(0.5, 9.)), max(abs(abs(tl.x) - (tl.y + 5.) * 0.75) - 0.5, max(-tl.y - 5., tl.y - 5.5)));
    bw = min(bw, max(abs(abs(tl.x) - (tl.y - 1.) * 0.7) - 0.5, max(1. - tl.y, tl.y - 10.)));
    col = mix(col, N, gcIn(bw) * uWinter);
    // flowers on an 8-knot grid inside the crown, opening and closing in four stepped frames
    vec2 fid = floor(cl / 4.8 + 0.5); vec2 fl = cl - fid * 4.8;
    float h = gcHash(fid * 3.7 + tid * 11.3 + quad + 5.);
    float tri = 1. - abs(2. * fract(t * 0.05 + h) - 1.);
    float fr = floor(clamp((tri - 0.25) / 0.6, 0., 0.999) * 4.);
    float inC = step(length(fid * 4.8), 7.2);
    float fd = abs(fl.x) + abs(fl.y) - (0.5 + 0.62 * fr);
    vec3 fc = mix(I, M, step(2.5, fr));
    fc = mix(fc, mix(M, S, step(2.5, fr)), gcIn(fd + 1.3) * step(1.5, fr));
    fc = mix(fc, mix(I, S * 1.2, 0.5), uNight * 0.5);
    fc = mix(fc, M, uWinter);                                // winter: madder berries left on the bare boughs
    col = mix(col, fc, gcIn(fd) * inC * mix(1., step(0.6, h) * step(fr, 1.5), uWinter));
  }
  // cypresses: indigo and sage feathers in a saffron outline, cut in relief
  { vec2 l; float dcy = gcCypress(A, l);
    float chev = fract((l.y - abs(l.x) * 1.15) / 4.8);
    float fe = clamp((abs(chev - 0.5) - 0.33) / max(gW / 4.8, 1e-3) + 0.5, 0., 1.);
    vec3 body = mix(N * 0.8, mix(G, N, 0.35), uNight);       // dark indigo spires (sage where the ground itself is indigo)
    vec3 cy = mix(body, mix(mix(G, I, uWinter * 0.75), mix(G, I, 0.4), uNight), fe);
    cy = mix(cy, mix(body, G, 0.5), gcIn(abs(l.x) - 0.3));
    // winter: a bare tree inside the saffron outline: indigo boughs and a trunk on pale blue, madder berries a knot or two at a time
    vec3 cyW = mix(mix(I, B, 0.45), N * 1.15, fe);
    float bh = gcHash(floor((l + vec2(40.)) / 1.8));
    cyW = mix(cyW, M, mix(step(0.78, bh), 0.2, smoothstep(0.6, 1.5, gW)) * (1. - fe));
    cyW = mix(cyW, N * 1.15, gcIn(abs(l.x) - 0.5));
    cy = mix(cy, cyW, uWinter);
    col = mix(col, W, gcIn(gcBox(l - vec2(0., -17.), vec2(0.9, 2.2))));
    col = mix(col, cy, gcIn(dcy));
    col = mix(col, S, gcBand(dcy, -1.35, 0.05));
    tall = gcIn(dcy);
    high = max(high, tall);
  }
  // water: canals and pool
  { float inW = gcIn(dW);
    vec3 wc = uWaterC;
    float sC = max(A.x, A.y), aC = A.x < A.y ? q.x : q.y;
    float wy = sC - 0.6 * floor(t * 1.4) * flow;
    float row = floor(wy / 3.6);
    float wx = aC + mod(row, 2.) * 2.4 + 60.;
    float hw = gcHash(vec2(floor(wx / 4.8), row));
    float dash = gcIn(gcBox(vec2(mod(wx, 4.8) - 2.4, mod(wy, 3.6) - 1.8), vec2(1.5, 0.3)));
    vec3 canal = mix(wc, hw > 0.5 ? mix(wc, I, 0.7) : mix(wc, N, 0.4), dash * mix(1., step(0.8, hw), frz));
    // winter: the ice. Pale cracks stepping slantwise across the canal, and a slow band of sheen sliding along it
    float ch = gcHash(vec2(floor(sC / 13.2), 3.));
    float cx = mod(sC + ch * 7., 13.2) - 6.6 + aC * (ch > 0.5 ? 1. : -1.);
    float crack = gcIn(abs(cx) - 0.6) * step(0.2, ch);
    // a second, finer set of cracks the other way, and the sheen: a pale band that slides along the canal a knot at a time
    float ch2 = gcHash(vec2(floor((sC + 4.) / 19.2), 8.));
    float cx2 = mod(sC + 4. + ch2 * 9., 19.2) - 9.6 - aC * (ch2 > 0.5 ? 0.6 : -0.6);
    float crack2 = gcIn(abs(cx2) - 0.42) * step(0.2, ch2);
    float glint = gcBand(mod(sC - 0.6 * floor(t * 2.), 72.), 0., 6.);
    vec3 ice = mix(wc, B, 0.42) * 0.94;                        // the ice lies a shade deeper than the frozen pool, so that its cracks show
    canal = mix(canal, mix(ice, mix(ice, I, 0.5), dash * step(0.8, hw)), frz);
    canal = mix(canal, mix(B, N, 0.45), frz * gcIn(abs(cx - 1.2) - 0.3) * step(0.2, ch) * 0.8);
    canal = mix(canal, mix(ice, I, 0.8), frz * glint);
    canal = mix(canal, I * 1.04, frz * max(crack, crack2));
    float r = length(q);
    float rr = mod(r - 0.6 * floor(t * 1.6) * flow, 14.4);
    vec3 pool = mix(wc, mix(wc, I, 0.65), gcBand(rr, 0., 1.2));
    pool = mix(pool, mix(wc, N, 0.35), gcBand(rr, 7.2, 8.4));
    wc = mix(canal, pool, gcIn(dP + 1.));
    // lotus, drifting a knot at a time
    vec2 lid = floor(q / 30. + 0.5);
    float lh = gcHash(lid + 3.);
    float lr = length(lid * 30.);
    vec2 off = (vec2(lh, fract(lh * 9.7)) - 0.5) * 9. + 0.6 * floor(vec2(sin(t * 0.11 + lh * 40.), cos(t * 0.09 + lh * 17.)) * 5. * flow);
    vec2 ll = q - lid * 30. - off;
    float dl = max(length(ll) - 4.3, -max(abs(ll.y) - ll.x * 0.4, -ll.x));
    float lon = step(62., lr) * step(lr, 70.) * step(0.3, lh) * (1. - frz);
    wc = mix(wc, N, gcIn(dl - 0.6) * lon);
    wc = mix(wc, mix(G, I, 0.15), gcIn(dl) * lon);
    float dbud = abs(ll.x + 1.6) + abs(ll.y - 1.4) - 1.5;
    wc = mix(wc, lh > 0.65 ? I : M, gcIn(dbud) * lon);
    wc = mix(wc, S, gcIn(dbud + 1.1) * lon);
    // the rosette island
    vec2 p8 = A; if (p8.y > p8.x) p8 = p8.yx;
    vec2 p8r = vec2(p8.x + p8.y, p8.y - p8.x) * 0.7071;
    float pet = min(gcEll(p8 - vec2(11.5, 0.), vec2(6.6, 3.5)), gcEll(p8r - vec2(11.5, 0.), vec2(6.6, 3.5)));
    vec2 p16 = vec2(p8.x * 0.9239 + p8.y * 0.3827, abs(p8.y * 0.9239 - p8.x * 0.3827));
    float pet2 = gcEll(p16 - vec2(7., 0.), vec2(3.8, 1.9));
    vec3 isl = mix(I, B, gcBand(r, 17.4, 18.6));
    isl = mix(isl, N, gcIn(pet - 0.6));
    isl = mix(isl, M, gcIn(pet));
    isl = mix(isl, I, gcIn(pet2 - 0.5));
    isl = mix(isl, S, gcIn(pet2));
    isl = mix(isl, N, gcIn(r - 4.2));
    isl = mix(isl, S, gcIn(r - 3.0));
    isl = mix(isl, M, gcIn(r - 1.2));
    wc = mix(wc, N, gcIn(r - 22.));
    wc = mix(wc, S, gcIn(r - 21.4));
    wc = mix(wc, isl, gcIn(r - 20.2));
    col = mix(col, wc, inW);
    // banks and the pool rim
    float nearB = 1. - smoothstep(0.3, 0.8, gW);            // at tuft scale the bank's two dark lines are slate blue, not indigo: seen along the canal from just above they would read as a black trench
    col = mix(col, mix(uWaterC, N, 0.6 - 0.42 * nearB), gcBand(dW, -1.2, 0.));
    col = mix(col, I, gcBand(dW, 0., 1.2));
    col = mix(col, mix(N, mix(B, I, 0.25), 0.62 * nearB), gcBand(dW, 1.2, 2.4));
    float rim = step(12.6, min(A.x, A.y));
    col = mix(col, S, gcBand(dP, 2.4, 3.6) * rim * gcIn(-dC));
    high = max(high, gcBand(dP, -0.6, 3.0) * rim);
  }
  gcCreatures(q, col);
  // night: woven lamps along the canals, rings of glowing knots that swell and shrink a knot at a time
  { float sC = max(A.x, A.y);
    vec2 lp = vec2(min(A.x, A.y) - 17.4, mod(sC, 36.) - 18.);
    float lhs = gcHash(vec2(floor(sC / 36.), quad));
    float k = floor(1.5 + 1.5 * sin(t * 0.9 + lhs * 6.28));
    float lr = length(lp);
    float ring = gcIn(abs(lr - (2.1 + 0.6 * k)) - 0.6);
    float core = gcIn(lr - 0.9);
    float lon = uNight * step(108., sC) * step(sC, 324.);
    float halo = clamp(1. - lr / 15., 0., 1.); halo *= halo * lon;
    col = mix(col, mix(col, S, 0.6), halo);
    col = mix(col, S, max(ring, core) * lon);
    gGlow = max(gGlow, max(max(ring, core) * lon * 1.3, halo * 0.5));
  }
  // winter: single ivory knots of snow stepping down row by row
  { vec2 kk = floor(q / 0.6);
    vec2 sc = floor(kk / 12.);
    float sh = gcHash(sc + 91.);
    vec2 kin = kk - sc * 12.;
    float rowS = mod(floor(t * 3. + sh * 12.), 12.);
    float fl = step(abs(kin.x - floor(sh * 11.99)), 0.5) * step(abs(kin.y - rowS), 0.5);
    col = mix(col, I, fl * uWinter * step(gW, 0.5) * step(0.35, sh));
  }
  return vec4(col, mix(mix(2.4, 3.0, high), 4.3, tall));
}
`;

// ---------------------------------------------------------------------------------------------------
// Shaders. The flat knot grid (also the weave of the rolled runner with GC_WEAVE defined).
const FLAT_VERT = /* glsl */`
${GC_COMMON}
uniform vec4 uShell;   // weave only: this shell (0 = the skin, 1 = the outermost), the pile's height in metres, 1 if the piece wears shells at all, fill light
varying vec3 vP; varying vec3 vN; varying vec2 vQ;
#include <fog_pars_vertex>
void main(){
  vec3 P = position;
  #ifdef GC_WEAVE
    vQ = uv; vN = normal;
    P += normal * (uShell.x * uShell.y);                    // a shell of pile over the weave (the border gate): pushed out along the normal
  #else
    P.y += gcWaveLift(P.x) + gcLift(P.xz); vQ = P.xz; vN = vec3(0., 1., 0.);
  #endif
  vP = P;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FLAT_FRAG = /* glsl */`
${GC_COMMON}
${GC_LIGHT}
${GC_NAP}
${GC_DYE_A}
${GC_DYE_B}
uniform vec3 uCam; uniform vec4 uTuft; uniform float uBack; uniform float uLatK;
uniform vec4 uShell;   // weave only: this shell (0 = the skin, 1 = the outermost), the pile's height in metres, 1 if the piece wears shells at all, fill light
varying vec3 vP; varying vec3 vN; varying vec2 vQ;
#include <fog_pars_fragment>
void main(){
  vec2 p = vQ;
  vec2 fw2 = fwidth(p);
  float fwMax = max(max(fw2.x, fw2.y), 1e-4), fwMin = max(min(fw2.x, fw2.y), 1e-4);
  float fw = sqrt(fwMax * fwMin);
  float far = smoothstep(0.2, 0.38, fwMax);
  vec2 kc = (floor(p / 0.6) + 0.5) * 0.6;
  vec2 q = mix(kc, p, far);
  gW = max(0.3, fw * 1.6);
  vec4 dye = gcDye(q, uTime);
  float glow = gGlow;
  float detail = 1. - smoothstep(0.1, 0.24, fwMax);
  float ks = mix(0.84, gcKnot(fract(p / 0.6)), detail);
  vec2 sd = normalize(uSunDir.xz + vec2(1e-4, 0.));
  float r0 = gcRelief(q), r1 = gcRelief(q + sd * 0.75);
  float sh = max(max(r1, gcRelief(q + sd * 1.5)), max(gcRelief(q + sd * 2.4), gcRelief(q + sd * 3.3)));
  float shadow = clamp(sh - r0, 0., 1.), edge = clamp(r0 - r1, 0., 1.);
  vec3 toEye = normalize(uCam - vP);
  float sheen = gcSheen(gcNap(q, uTime), toEye);
  float abr = (0.95 + 0.1 * gcHash(kc) * detail + 0.05 * (1. - detail)) * (0.95 + 0.1 * gcNoise(vec2(p.y * 0.05, 3.7)));
  vec3 amb = uSkyCol * 0.76 + uBounceCol * 0.42;
  #ifdef GC_WEAVE
    vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
    float ndl = clamp(dot(N, uSunDir) * 0.75 + 0.25, 0., 1.);
    float up = 0.5 + 0.5 * N.y;
    amb = uSkyCol * (0.25 + 0.6 * up) + uBounceCol * (0.75 - 0.6 * up);
    vec2 f = fract(p / 0.6);
    float bump = 0.72 + 0.4 * sin(f.x * 3.14159) * (0.6 + 0.4 * sin(f.y * 3.14159));
    vec3 base = mix(dye.rgb, mix(dye.rgb * 0.62 + uPal[0] * 0.2, uPal[0] * 0.8, 0.12), uBack);
    float kk = mix(ks, mix(0.9, bump, detail), uBack);
    float sunW = gcSun(vP);
    // a standing piece of the carpet (the border gate) is pile all round: blunt tufts on the knot grid, cut into the shells
    // where the knots can be told apart, dark at the root and paler at the tip; its shaded faces take the light thrown back
    // off the sunlit wool around it
    float tuftE = max(abs(fract(p.x / 0.6) - 0.5), abs(fract(p.y / 0.6) - 0.5));
    if (uShell.x > 0.001 && tuftE > mix(0.6, 0.47 - 0.19 * uShell.x, detail)) discard;
    float pileK = mix(1., uShell.x > 0.001 ? (0.6 + 0.55 * uShell.x) * (0.88 + 0.24 * gcHash(kc + 5.)) : 0.4, detail * uShell.z);
    kk = mix(kk, 1., detail * uShell.z);
    vec3 c = base * abr * kk * pileK * (uSunCol * sunW * ndl + (amb + gcWarm(vP, N)) * gAO + (uSunCol * 0.2 + uBounceCol * 0.55) * uShell.w);
  #else
    vec3 wl = gcWaveLight(p.x);
    amb *= uAmbTint;
    dye.rgb = mix(dye.rgb, uPal[0] * 1.04 + dye.rgb * 0.12, 0.62 * gcWaveCrest(p.x));
    vec3 cyr = gcCyRelief(q, sd);
    gLatK = uLatK;
    float sunRaw = gcSun(vP);
    // the rising garden: the swollen beds and the sunk banks take the low sun on the flank that faces it, the trees lay their long shadows
    float gOn = step(0.002, uGar.x + uGar.y);
    float lE = gcLift(q + vec2(1.6, 0.)) - gcLift(q - vec2(1.6, 0.)), lS = gcLift(q + vec2(0., 1.6)) - gcLift(q - vec2(0., 1.6));
    vec3 gN = normalize(vec3(-lE, 3.2, -lS));
    float slopeK = mix(1., clamp(dot(gN, uSunDir) / max(uSunDir.y, 0.05), 0.12, 2.1), gOn);
    float tsh = gcTreeSh(q);
    float silk = uGar.x * (1. - smoothstep(-1.6, -0.2, gcWaterD(q))) * gcFieldK(q) * smoothstep(21., 23., length(q));
    sunRaw *= tsh;
    float sun = sunRaw * slopeK * (1. - 0.8 * shadow) * (1. + 0.3 * edge) * wl.x * (1. - 0.86 * cyr.x) * mix(1., mix(0.42, 1.55, cyr.y), cyr.z);
    float ambK = gAO * (0.72 + 0.28 * tsh) * (1. - 0.3 * shadow) * wl.z * (1. - 0.3 * cyr.x) * mix(1., mix(0.75, 1.1, cyr.y), cyr.z);
    ks = mix(ks, 0.97, silk); sheen = mix(sheen, 1., silk);
    vec3 warm = gcWarm(vec3(vP.x, 2.6, vP.z), vec3(0., 1., 0.)) * gAO * (1. - 0.45 * shadow) * mix(1., 0.8, cyr.x) * (0.35 + 0.65 * tsh);   // a standing tree's long shadow takes some of the lamps' light too, or the warm pool would wash it out
    vec3 c = dye.rgb * abr * sheen * wl.y * ks * (1. + 0.05 * r0) * (uSunCol * sun + amb * ambK + warm);
    c += (dye.rgb * 0.5 + uPal[0] * 0.2) * uSunCol * sunRaw * cyr.z * smoothstep(0.7, 1., cyr.y) * 0.9;
    float pr = uTuft.z * (1. - smoothstep(uTuft.x, uTuft.y, length(p - uCam.xz)));
    c = mix(c, dye.rgb * amb * 0.22, pr * 0.92 * (1. - silk));
    if (silk > 0.001) {
      // silk water: slow bands of lustre sliding outward from the pool, fine threads lying along the flow, the pale window in it at a glance
      vec2 A2 = abs(q);
      float sAl = max(A2.x, A2.y), aAc = A2.x < A2.y ? q.x : q.y;
      float inPool = 1. - smoothstep(-6., 4., gcPool(q));
      float along = mix(sAl, length(q), inPool), across = mix(aAc, 0.2 * length(q), inPool);
      float n1 = gcNoise(vec2(across * 0.16, along * 0.045 - uTime * 0.11));
      float bandS = 0.5 + 0.5 * sin(along * 0.21 - uTime * 0.85 + n1 * 5.);
      float thr = gcNoise(vec2(across * 2.3 + n1 * 2., along * 0.11 - uTime * 0.22));
      vec3 wN = normalize(vec3((n1 - 0.5) * 0.5 + (thr - 0.5) * 0.22, 1., (bandS - 0.5) * 0.3));
      vec3 R = reflect(-toEye, wN);
      float fres = 1. - clamp(toEye.y, 0., 1.); fres = fres * fres * fres;
      float sd = max(dot(R, uSunDir), 0.); sd *= sd; sd *= sd; sd *= sd; sd *= sd;
      vec3 deep = mix(dye.rgb * (vec3(0.72, 0.9, 1.12) + uPal[3] * 0.35), uPal[3] * vec3(0.8, 1.02, 1.3), 0.42 * (1. - smoothstep(0.02, 0.2, length(dye.rgb - uWaterC)))) * abr;   // open water (not a carp, a duck or a lotus) is drawn toward a clear silk blue
      vec3 sc = deep * (0.82 + 0.3 * bandS * bandS + 0.16 * (thr - 0.5)) * (uSunCol * sun + amb * ambK + warm);
      sc += (uSkyCol * 1.5 + uPal[3] * 0.3) * (0.1 + 0.9 * fres) * (0.3 + 0.5 * bandS + 0.3 * thr) * gAO * 0.55;
      sc += uSunCol * sunRaw * (sd * 1.3 + 0.1 * bandS * bandS * bandS);
      c = mix(c, sc, silk);
    }
  #endif
  c += dye.rgb * glow * 4.;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// The tufts: blunt square prisms on the knot grid, dyed at their own knot in the vertex shader.
const TUFT_VERT = /* glsl */`
${GC_COMMON}
${GC_LIGHT}
${GC_NAP}
${GC_DYE_A}
${GC_DYE_B}
attribute vec2 aKnot; attribute float aKind;
uniform vec3 uCam; uniform vec4 uTuft; uniform float uLatK;
varying vec3 vCol; varying vec3 vN; varying vec3 vP; varying vec4 vUvk; varying vec2 vF; varying vec3 vL; varying float vGlow; varying vec3 vWarm;
#include <fog_pars_vertex>
void main(){
  vec2 kc = aKnot;
  gW = 0.3;
  vec4 dye = gcDye(kc, uTime);
  vGlow = gGlow;
  float h = gcHash(kc * 1.7 + 0.3);
  float pr = uTuft.z * (1. - smoothstep(uTuft.x, uTuft.y, length(kc - uCam.xz)));
  float H = dye.a * (0.94 + 0.12 * h) * (0.95 + 0.1 * gcNoise(kc * 0.31)) * pr;
  vec2 lean = gcNap(kc, uTime);
  float yy = position.y;
  float wsc = smoothstep(0., 0.05, pr);
  // the cut is a little ragged: each corner of the top stands at its own height
  float rag = step(0.99, yy) * (fract(h * 17.3 + position.x * 3.7 + position.z * 9.1) - 0.5) * 0.07;
  // the rising garden: the tufts ride the swollen beds; where the canals have turned to silk water they sink away
  float silkT = uGar.x * (1. - smoothstep(-1.6, -0.2, gcWaterD(kc))) * gcFieldK(kc) * smoothstep(21., 23., length(kc));
  H *= 1. - silkT;
  vec3 P = vec3(kc.x + position.x * 0.6 * wsc, ${BASE_Y.toFixed(2)} + 0.03 + (yy + rag) * H + gcWaveLift(kc.x) + gcLift(kc), kc.y + position.z * 0.6 * wsc);
  P.xz += (lean * 0.42 + (vec2(h, fract(h * 7.31)) - 0.5) * 0.16) * (yy * yy * min(H, 2.7) / 2.4);
  vec2 sd = normalize(uSunDir.xz + vec2(1e-4, 0.));
  float r0 = gcRelief(kc), r1 = gcRelief(kc + sd * 0.75);
  float sh = max(max(r1, gcRelief(kc + sd * 1.5)), max(gcRelief(kc + sd * 2.4), gcRelief(kc + sd * 3.3)));
  float shadow = clamp(sh - r0, 0., 1.), edge = clamp(r0 - r1, 0., 1.);
  vec3 root = vec3(kc.x, 0., kc.y);
  float sheen = gcSheen(lean, normalize(uCam - root));
  float abr = (0.95 + 0.1 * gcHash(kc)) * (0.95 + 0.1 * gcNoise(vec2(kc.y * 0.05, 3.7)));
  vec3 wl = gcWaveLight(kc.x);
  vec3 cyr = gcCyRelief(kc, sd);
  dye.rgb = mix(dye.rgb, uPal[0] * 1.04 + dye.rgb * 0.12, 0.62 * gcWaveCrest(kc.x));
  vCol = dye.rgb * abr * sheen * wl.y * (1. + 0.05 * r0);
  gLatK = uLatK;
  float tshT = gcTreeSh(kc);
  float lE = gcLift(kc + vec2(1.6, 0.)) - gcLift(kc - vec2(1.6, 0.)), lS = gcLift(kc + vec2(0., 1.6)) - gcLift(kc - vec2(0., 1.6));
  float slopeT = mix(1., clamp(dot(normalize(vec3(-lE, 3.2, -lS)), uSunDir) / max(uSunDir.y, 0.05), 0.12, 2.1), step(0.002, uGar.x + uGar.y));
  float sunT = gcSun(root) * tshT * slopeT;
  vL = vec3(sunT * (1. - 0.8 * shadow) * (1. + 0.3 * edge) * wl.x * (1. - 0.86 * cyr.x) * mix(1., mix(0.6, 1.3, cyr.y), cyr.z),
    gAO * (0.72 + 0.28 * tshT) * (1. - 0.3 * shadow) * wl.z * (1. - 0.3 * cyr.x), pr);
  vWarm = gcWarm(vec3(kc.x, 2.6, kc.y), vec3(0., 1., 0.)) * gAO * (1. - 0.45 * shadow) * mix(1., 0.8, cyr.x) * (0.35 + 0.65 * tshT);
  vN = normal; vP = P; vF = position.xz * 1.3514 + 0.5; vUvk = vec4(uv.x, yy, aKind, h);
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const TUFT_FRAG = /* glsl */`
${GC_COMMON}
${GC_NAP}
uniform vec3 uCam;
varying vec3 vCol; varying vec3 vN; varying vec3 vP; varying vec4 vUvk; varying vec2 vF; varying vec3 vL; varying float vGlow; varying vec3 vWarm;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 amb = (uSkyCol * 0.76 + uBounceCol * 0.42) * uAmbTint;
  float yy = vUvk.y, pr = vL.z, hh = vUvk.w, prd = pr * pr;
  vec3 col = vCol * mix(1., 0.88 + 0.24 * fract(hh * 5.7), prd);
  vec3 c;
  if (vUvk.z > 0.5) {
    // the cut top: fibre ends seen end-on, stippled and matte, fraying darker at its edge; it takes the low sun at a glance, so no highlight
    float st = 0.74 + 0.48 * gcNoise(vF * 5. + hh * 50.);
    float dots = 0.8 + 0.2 * step(0.4, gcNoise(vF * 13. + hh * 20.));
    vec2 e = abs(vF - 0.5);
    float fray = 1. - 0.34 * smoothstep(0.26, 0.5, max(e.x, e.y));
    c = col * 0.92 * mix(1., st * dots * fray, prd) * (uSunCol * vL.x * mix(1., 0.82, pr) + amb * vL.y + vWarm);
  } else {
    // flank and shoulder: fibres running up, dark at the root where the neighbours shade it, lit on the side toward the sun
    float streak = 0.5 + 0.62 * gcNoise(vec2(vUvk.x * 8. + hh * 31., yy * 0.6 + hh * 9.)) + 0.3 * gcNoise(vec2(vUvk.x * 27. + hh * 13., yy * 1.9 + hh * 5.));
    float g = mix(0.16, 1., smoothstep(0.3, 1., yy));
    float dH = dot(N.xz, normalize(uSunDir.xz + vec2(1e-4, 0.)));
    float face = max(0.74 + 0.92 * dH, 0.04) * (0.25 + 0.75 * g);
    c = col * 0.92 * mix(1., streak, prd) * (uSunCol * vL.x * mix(1., face, pr) + (amb * vL.y + vWarm) * mix(1., 0.22 + 0.78 * g, pr));
  }
  vec3 V = normalize(uCam - vP);
  float rim = 1. - abs(dot(N, V)); rim *= rim;
  c += vCol * amb * rim * 0.16 * pr;
  c += vCol * vGlow * 4.;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// The selvedge: a madder wool rope whipped along both long sides.
const ROPE_VERT = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal; vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const ROPE_FRAG = /* glsl */`
${GC_COMMON}
${GC_LIGHT}
varying vec3 vP; varying vec3 vN; varying vec2 vUv;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float s = vUv.y * 0.9 + vUv.x * 2.;
  float strand = abs(fract(s) - 0.5) * 2.;
  float fib = 0.82 + 0.36 * gcNoise(vec2(s * 30., vUv.y * 2. - vUv.x * 9.));
  float val = (0.5 + 0.5 * smoothstep(0.0, 0.7, strand)) * fib;
  vec3 col = uPal[1] * (0.92 + 0.16 * gcHash(vec2(floor(s), 2.)));
  float ndl = clamp(dot(N, uSunDir) * 0.7 + 0.3, 0., 1.);
  float up = 0.5 + 0.5 * N.y;
  float sunR = gcSun(vP);
  vec3 c = col * val * (uSunCol * sunR * ndl + gAO * (uSkyCol * (0.2 + 0.6 * up) + uBounceCol * (0.6 - 0.5 * up) + gcWarm(vP, N)));
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const snap = (v) => Math.floor(v / KNOT) * KNOT + KNOT * 0.5;
const hash1 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const pingPong = (x, len) => { const m = ((x % (2 * len)) + 2 * len) % (2 * len); return m < len ? m : 2 * len - m; };
const asColor = (c) => (c && c.isColor) ? c.clone() : new THREE.Color(c);

// unit tuft: four upright flanks, four shoulders leaning in to a small blunt cut top (18 triangles). The shoulders
// leave a dark V between neighbours (the root gap) and give every tuft a flank toward the sun and one away from it.
function tuftGeometry() {
  const pos = [], nor = [], uv = [], kind = [], idx = [];
  const b = 0.48, s = 0.475, t = 0.37, ys = 0.76;
  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  for (let f = 0; f < 4; f++) {
    const [nx, nz] = dirs[f], tx = -nz, tz = nx, o = pos.length / 3;
    const add = (half, y, sg, u, ny) => { pos.push(nx * half + tx * half * sg, y, nz * half + tz * half * sg); nor.push(nx, ny, nz); uv.push(u, y); kind.push(0); };
    add(b, 0, -1, 0, 0.1); add(b, 0, 1, 1, 0.1); add(s, ys, 1, 1, 0.3); add(s, ys, -1, 0, 0.3); add(t, 1, 1, 0.89, 0.6); add(t, 1, -1, 0.11, 0.6);
    idx.push(o, o + 2, o + 1, o, o + 3, o + 2, o + 3, o + 4, o + 2, o + 3, o + 5, o + 4);
  }
  const o = pos.length / 3;
  const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (const [sx, sz] of cs) { pos.push(sx * t, 1, sz * t); nor.push(0, 1, 0); uv.push(0.5 + sx * 0.5, 1); kind.push(1); }
  idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  g.setIndex(idx);
  return g;
}

// a twisted rope along z at x = side * (HALF_W + 1.3): 7 sides, gently wandering
function ropeGeometry(rng) {
  const pos = [], nor = [], uv = [], idx = [];
  const SEG = 132, RAD = 7, r = 1.55;
  for (let s = -1; s <= 1; s += 2) {
    const base = pos.length / 3, ph = rng.range(0, 6);
    for (let i = 0; i <= SEG; i++) {
      const z = -HALF_L + (2 * HALF_L * i) / SEG;
      const cx = s * (HALF_W + 1.25) + Math.sin(z * 0.045 + ph) * 0.35 + Math.sin(z * 0.013 + ph * 2) * 0.5;
      const cy = BASE_Y + 1.3 + Math.sin(z * 0.07 + ph) * 0.12;
      for (let j = 0; j <= RAD; j++) {
        const a = (j / RAD) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        const rr = r * (1 + 0.07 * Math.sin(a * 3 + z * 1.4)) * Math.max(0.03, Math.sqrt(smoothstep(0, 4, HALF_L - Math.abs(z))));
        pos.push(cx + ca * rr, cy + sa * rr * 0.92, z); nor.push(ca, sa, 0); uv.push(j / RAD, z / 3.2);
      }
    }
    for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) {
      const a = base + i * (RAD + 1) + j, b = a + RAD + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const LOOKS = {
  // sun colour, sky colour, bounce colour (linear HDR), lattice strength of the branch
  spring: { sun: [1.0, 0.8, 0.5], sky: [0.25, 0.32, 0.47], bounce: [0.36, 0.26, 0.16] },
  golden: { sun: [1.1, 0.66, 0.3], sky: [0.25, 0.26, 0.36], bounce: [0.4, 0.25, 0.13] },
  winter: { sun: [0.7, 0.68, 0.66], sky: [0.2, 0.28, 0.48], bounce: [0.2, 0.22, 0.28] },
  night: { sun: [0.3, 0.42, 0.7], sky: [0.12, 0.17, 0.32], bounce: [0.1, 0.1, 0.14] },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('garden-carpet-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const vary = ctx.vary || {};
  const hexes = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  // wool is a matte scatterer: pull each dye a little toward its own grey so nothing goes neon under ACES
  const pal = hexes.slice(0, 7).map((h) => { const c = new THREE.Color(h), l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    return c.lerp(new THREE.Color(l, l, l), 0.27).multiplyScalar(0.82); });
  const [IV, MA, IN, BL, SA, SG] = pal;
  // ---- the seeded look ----
  const hour = vary.hour || 'any';
  const roll = rng();
  const variant = TEST_VARIANT || opts.variant || (hour === 'dawn' ? 'winter' : hour === 'night' ? 'night' : hour === 'golden' || hour === 'day' ? 'spring'
    : (roll < 0.5 ? 'spring' : roll < 0.78 ? 'winter' : 'night'));
  const look = LOOKS[variant === 'spring' && hour === 'golden' ? 'golden' : variant] || LOOKS.spring;
  const rare = TEST_RARE || (opts.rare ?? !!vary.rare);
  const lead = opts.lead || (rng.chance(0.3) ? 'ducks' : 'carp');
  const winter = variant === 'winter' ? 1 : 0, night = variant === 'night' ? 1 : 0;
  const mixc = (a, b, t) => a.clone().lerp(b, t);
    // winter: an ivory field inside a madder border, indigo beds striped madder, saffron and ivory; night: indigo field, madder border and beds
  const ground = winter ? IV.clone().multiplyScalar(0.93) : night ? mixc(IN, BL, 0.1) : mixc(MA, IN, rng.range(0.0, 0.12));
  const borderG = winter ? mixc(MA, IN, 0.1) : night ? mixc(MA, IN, 0.34) : mixc(MA, IN, rng.range(0.2, 0.45));
  const waterC = winter ? mixc(BL, IV, 0.3) : night ? mixc(BL, IV, 0.2).multiplyScalar(0.8) : mixc(BL, IV, 0.12);
  const bedC = winter ? mixc(IN, BL, 0.12) : night ? mixc(MA, IN, 0.4) : SG.clone();

  const NC = NCR;
  const crA = [], crB = [];
  for (let i = 0; i < NC; i++) { crA.push(new THREE.Vector4(0, 0, 1, 0)); crB.push(new THREE.Vector4(0, 0, 1, 0)); }
  const sunDir = V3(0.74, 0.31, 0.60).normalize();
  const occA = [], occB = [];
  const NOCC = 15;
  for (let i = 0; i < NOCC; i++) { occA.push(new THREE.Vector4(0, -999, 0, 1)); occB.push(new THREE.Vector4(0, -999, 0, 0)); }
  const gardenTrees = []; for (let i = 0; i < 40; i++) gardenTrees.push(new THREE.Vector4(0, 0, 0, 1));
  let tuftK = 1, lastTuftK = 1;                              // the world thins the tuft disc while the garden stands (its triangles go to the trees)
  const lampP = [new THREE.Vector4(0, -999, 0, 100), new THREE.Vector4(0, -999, 0, 100)], lampC = [new THREE.Vector4(0, 0, 0, 0.5), new THREE.Vector4(0, 0, 0, 0.5)];
  // shared uniform objects: every material of the piece (and of the room, if it wants) holds these
  const shared = {
    uTime: { value: 0 }, uPal: { value: pal },
    uGround: { value: ground }, uBorderG: { value: borderG }, uWaterC: { value: waterC }, uBedC: { value: bedC },
    uWinter: { value: winter }, uNight: { value: night },
    uCrA: { value: crA }, uCrB: { value: crB },
    uSunDir: { value: sunDir }, uSunCol: { value: new THREE.Color().fromArray(look.sun) },
    uSkyCol: { value: new THREE.Color().fromArray(look.sky) }, uBounceCol: { value: new THREE.Color().fromArray(look.bounce) },
    uWin: { value: new THREE.Vector4(680, 551, 600, 0) }, uWin2: { value: new THREE.Vector4(150, 800, 18, 2.7) },
    uBranch: { value: new THREE.Vector4(0, 0.55, 1, 100) }, uBrA: { value: new THREE.Vector4(221, 190, 521, 400) }, uMul: { value: new THREE.Vector4(551, 105, 15, 0) }, uMul2: { value: new THREE.Vector4(0, 6, 0, 0) },
    uOccA: { value: occA }, uOccB: { value: occB }, uOccSkip: { value: new THREE.Vector2(-1, -1) }, uPenK: { value: 1 }, uLatK: { value: 1 }, uCloud: { value: 0 }, uLampP: { value: lampP }, uLampC: { value: lampC }, uWave: { value: new THREE.Vector4(-9999, 13, 46, 0) }, uAmbTint: { value: new THREE.Color(1, 1, 1) },
    uCam: { value: V3(0, 100, 400) }, uTuft: { value: new THREE.Vector4(34, 48, 1, 0) },
    uGar: { value: new THREE.Vector4(0, 0, 0, 0) }, uGT: { value: gardenTrees }, uPacerK: { value: 1 },
  };
  const mkUniforms = (extra = {}) => Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), shared, extra);

  const object = new THREE.Group(); object.name = 'garden-carpet-hero';

  // ---- the flat knot grid ----
  await ctx.yield?.();
  const planeGeo = new THREE.PlaneGeometry(2 * HALF_W, 2 * HALF_L, 96, 156);
  await ctx.yield?.();   // 15,000 vertices: made in one step, turned and placed in the next
  planeGeo.rotateX(-Math.PI / 2); planeGeo.translate(0, BASE_Y, 0);
  await ctx.yield?.();
  const flatMat = new THREE.ShaderMaterial({ uniforms: mkUniforms({ uBack: { value: 0 }, uShell: { value: new THREE.Vector4(0, 0, 0, 0) } }), vertexShader: FLAT_VERT, fragmentShader: FLAT_FRAG, fog: true });
  const plane = new THREE.Mesh(planeGeo, flatMat); plane.frustumCulled = false; plane.name = 'carpet';
  object.add(plane);
  await ctx.yield?.();

  // ---- the tufts ----
  const fadeEnd = lerp(38, 54, clamp((detail - 0.6) / 0.4, 0, 1));
  shared.uTuft.value.set(fadeEnd - 19, fadeEnd, 1, 0);
  const MAXT = Math.max(1000, Math.round(opts.tufts ?? 9800 * (fadeEnd / 54) * (fadeEnd / 54)));
  const tuftGeo = tuftGeometry();
  const knotArr = new Float32Array(MAXT * 2);
  const knotAttr = new THREE.InstancedBufferAttribute(knotArr, 2); knotAttr.setUsage(THREE.DynamicDrawUsage);
  tuftGeo.setAttribute('aKnot', knotAttr);
  tuftGeo.instanceCount = 0;
  const tuftMat = new THREE.ShaderMaterial({ uniforms: mkUniforms(), vertexShader: TUFT_VERT, fragmentShader: TUFT_FRAG, fog: true });
  const tufts = new THREE.Mesh(tuftGeo, tuftMat); tufts.frustumCulled = false; tufts.name = 'tufts';
  object.add(tufts);
  await ctx.yield?.();

  // ---- the selvedge ropes ----
  const ropeMat = new THREE.ShaderMaterial({ uniforms: mkUniforms(), vertexShader: ROPE_VERT, fragmentShader: ROPE_FRAG, fog: true, side: THREE.DoubleSide });
  const rope = new THREE.Mesh(ropeGeometry(rng), ropeMat); rope.frustumCulled = false; rope.name = 'selvedge';
  object.add(rope);
  await ctx.yield?.();

  // ---- the woven creatures (positions snapped to whole knots here, drawn by gcCreatures) ----
  const carpDir = rng.chance(0.5) ? 1 : -1;
  const carp = [];
  for (let i = 0; i < 5; i++) carp.push({ r: 44 + i * 3.4 + rng.range(-1, 1), a0: (i / 5) * Math.PI * 2 + rng.range(-0.25, 0.25), w: rng.range(0.085, 0.115), seed: rng.range(0, 6), out: rng.range(0.5, 1) });
  const duckArms = [[0, -1], [0, 1], [1, 0], [-1, 0]];   // north, south, east, west
  const ducks = duckArms.map((d, j) => ({ d, off: rng.range(0, 300), speed: rng.range(2.0, 2.8), side: rng.chance(0.5) ? 1 : -1 }));
  const quads = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  const walkers = [];
  for (let i = 0; i < 6; i++) {
    const [sx, sz] = quads[i % 4];
    // one in the far beds of every quarter (the south-east one keeps to the beds the climb passes over), and two in the
    // beds beside the east arm of the cross canal, the ones nearest the eye when the garden is seen whole
    walkers.push(i < 4
      ? { sx, sz, az: 262 + rng.int(0, 2) * 14.4 + 2.1, x0: i === 0 ? 56 : 40, x1: i === 0 ? 122 : 140, off: rng.range(0, 200), per: rng.range(16, 26) }
      : { sx: 1, sz: i === 4 ? 1 : -1, az: 44 + (i === 4 ? 0 : rng.int(0, 1) * 50), x0: 130, x1: 154, off: rng.range(0, 90), per: rng.range(14, 22) });
  }
  const tsOut = [0, 0];
  const treeSpot = (k) => { const q = quads[k & 3], t = (k >> 2) % 6; tsOut[0] = q[0] * (72 + (t % 2) * 36); tsOut[1] = q[1] * (150 + ((t / 2) | 0) * 30 + 2.5); return tsOut; };
  const birds = []; for (let i = 0; i < 4; i++) birds.push({ k: rng.range(0, 100), q: i });
  const camL = V3(), fwd = V3(), pacer = V3(0, 0, -150);
  let waveU = -1, waveManual = null, progressSeen = false, swayAmp = 1;

  const FR4 = [-1, 0, 1, 0], pkA = [0, 0], pkB = [0, 0];
  const pickSpot = (out, nn, i, bq) => { const h = hash1(nn, i * 7.7 + bq.k), sp = treeSpot(bq.q + 4 * Math.floor(h * 6)); out[0] = sp[0] + (hash1(nn, 3.3 + i) - 0.5) * 12; out[1] = sp[1] + (hash1(nn, 8.1 + i) - 0.5) * 12; return out; };
  function setCr(i, type, x, z, dx, dz, frame, flipKeep, extra) {
    crA[i].set(snap(x), snap(z), dx, dz); crB[i].set(type, frame, flipKeep, extra);
  }
  function simulate(time) {
    const tq = winter ? time * 0.45 : time;
    // the rare wave: scatter the carp as the front crosses the pool
    const wv = shared.uWave.value;
    const sc = wv.w > 0.01 ? smoothstep(-70, 20, wv.x) * (1 - smoothstep(140, 420, wv.x)) : 0;
    for (let i = 0; i < 5; i++) {
      const c = carp[i];
      const r = c.r + sc * 12 * c.out;
      const stepA = KNOT / r;
      const a = Math.floor((c.a0 + carpDir * c.w * tq) / stepA) * stepA + sc * Math.sin(c.seed * 9) * 0.5;
      const aq = Math.round(a / (Math.PI / 36)) * (Math.PI / 36) + sc * carpDir * -1.1;
      const fr = FR4[Math.floor(tq * 3 + i * 1.3) & 3];
      // as the front crosses the pool the carp bolt east ahead of it, strung out, and fall back into their ring behind it
      const x0 = Math.cos(a) * r, z0 = Math.sin(a) * r, flee = sc > 0.5 ? 1 : 0;
      const x = x0 + sc * Math.max(0, Math.min(wv.x + 26, 52) + i * 9 - x0), z = z0 * (1 - 0.72 * sc);
      setCr(i, 1, x, z, flee ? 1 : -Math.sin(aq) * carpDir, flee ? 0 : Math.cos(aq) * carpDir, fr, winter ? 0.82 : 1, c.seed);
    }
    // the pacer: the sixth carp (or the north pair of ducks) waits at the mouth of the north canal, and as the camera comes
    // down over the pool's north lobe it sets off ahead of it: far enough ahead to lie in the lower middle of a gaze that
    // looks down the canal from high up (twice the camera's height), 30 m ahead on the canal run
    // itself. Seen from high up the carp is drawn larger (uPacerK), and comes down to its own 27 knots as the camera does.
    const eng = (1 - smoothstep(50, 64, camL.y)) * (1 - smoothstep(40, 70, Math.abs(camL.x))) * smoothstep(16, -22, camL.z) * (1 - smoothstep(330, 372, -camL.z));
    const ahead = Math.max(lerp(8, 30, smoothstep(-85, -128, camL.z)), camL.y * 2.0);
    const idleZ = -84 - pingPong(tq * 3.2, 30);
    const pz = lerp(idleZ, Math.max(camL.z - ahead, -372), eng), px = lerp(0, clamp(camL.x * 0.35 + 1.5, -4.5, 4.5), eng);
    shared.uPacerK.value = lead === 'carp' ? 1 + 1.0 * smoothstep(15, 40, camL.y) * eng : 1;
    pacer.set(px, 2.6, pz);
    const pfr = FR4[Math.floor(tq * 3.5) & 3];
    if (lead === 'carp') setCr(5, 1, px, pz, 0, -1, pfr, winter ? 0.82 : 1, 2.2);
    else setCr(5, 1, 0, 120 + pingPong(tq * 3, 190), 0, 1, pfr, winter ? 0.82 : 1, 2.2);
    // ducks: a pair on each arm of the canals, turning at the ends
    for (let j = 0; j < 4; j++) {
      const k = ducks[j], long = k.d[0] === 0, s0 = long ? 124 : 112, len = long ? 180 : 52;
      const ph = (winter ? 0.2 : 1) * time * k.speed + k.off;
      let s = s0 + pingPong(ph, len);
      let dirn = (((ph % (2 * len)) + 2 * len) % (2 * len)) < len ? 1 : -1;
      let ax = 3.3 * k.side;
      if (j === 0 && lead === 'ducks') { s = -pz; dirn = 1; ax = px - 3; }
      const fr = Math.floor(time * 4) % 8;
      for (let m = 0; m < 2; m++) {
        const sm = s - m * 13.2 * dirn, am = ax + (m ? -6.6 * k.side : 0);
        const x = long ? am : k.d[0] * sm, z = long ? k.d[1] * sm : am;
        setCr(6 + j * 2 + m, 2, x, z, k.d[0] * dirn, k.d[1] * dirn, fr, 1, m ? 0 : 1);
      }
    }
    // gazelles (cranes in winter): two knots a stride, stopping to graze
    for (let i = 0; i < 6; i++) {
      const g = walkers[i], T = g.per, tt = time + g.off;
      const cyc = Math.floor(tt / T), ph = tt - cyc * T, walkT = T * 0.62;
      const tau = cyc * walkT + Math.min(ph, walkT);
      const stride = Math.floor(tau * 1.15);
      const span = g.x1 - g.x0, pp = stride * 1.2;
      const m = ((pp % (2 * span)) + 2 * span) % (2 * span);
      const dirn = m < span ? 1 : -1, ax = g.x0 + (m < span ? m : 2 * span - m);
      const graze = ph > walkT + 0.8 && ph < T - 0.8 ? 10 : 0;
      const dx = dirn * g.sx;
      setCr(14 + i, winter ? 5 : 3, g.sx * ax, g.sz * g.az, dx, 0, (stride & 3) + graze, -dx, 0);
    }
    // birds hop between the blossoming trees (moths at night)
    for (let i = 0; i < 4; i++) {
      const bq = birds[i], tt = time / 2.6 + bq.k, n = Math.floor(tt), f = Math.floor(clamp((tt - n - 0.72) / 0.28, 0, 0.999) * 4) / 4;
      const a = pickSpot(pkA, n, i, bq), b = pickSpot(pkB, n + 1, i, bq);
      const x = lerp(a[0], b[0], f), z = lerp(a[1], b[1], f);
      let dx = b[0] - a[0], dz = b[1] - a[1]; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
      const dq = Math.round(Math.atan2(dz, dx) / (Math.PI / 4)) * (Math.PI / 4);
      setCr(20 + i, night ? 6 : 4, x, z + (f > 0 && f < 0.75 ? -1.2 : 0), Math.cos(dq), Math.sin(dq), Math.floor(time * 4) & 1, 1, 0);
    }
  }

  // ---- the tuft wedge: every knot within fadeEnd of the camera's ground point, inside the view ----
  let lastKx = 1e9, lastKz = 1e9, lastYaw = 1e9;
  function refill(camera) {
    const g = tuftGeo;
    const on = 1 - smoothstep(38, 60, camL.y);
    shared.uTuft.value.z = on;
    const fadeNow = fadeEnd * tuftK;
    shared.uTuft.value.x = fadeNow - 19 * tuftK; shared.uTuft.value.y = fadeNow;
    if (on <= 0.001) { g.instanceCount = 0; lastKx = 1e9; return; }
    camera.getWorldDirection(fwd);
    let fx = fwd.x, fz = fwd.z; const fl = Math.hypot(fx, fz);
    if (fl < 0.05) { fx = 0; fz = -1; } else { fx /= fl; fz /= fl; }
    const yaw = Math.round(Math.atan2(fx, fz) / 0.035);
    const kx0 = Math.floor(camL.x / KNOT), kz0 = Math.floor(camL.z / KNOT);
    // refill only when the camera has moved two knots or turned two degrees: the disc fades out over its last 19 m and the
    // wedge is cut 9 m behind the eye, so a knot or two of lag never shows
    if (Math.abs(kx0 - lastKx) < 2 && Math.abs(kz0 - lastKz) < 2 && yaw === lastYaw && Math.abs(tuftK - lastTuftK) < 0.02) return;
    lastKx = kx0; lastKz = kz0; lastYaw = yaw; lastTuftK = tuftK;
    const R = fadeNow + 0.5, back = 9.5, cosH = Math.cos(1.0), R2 = R * R;
    const apx = camL.x - fx * back, apz = camL.z - fz * back;
    const n = Math.ceil(R / KNOT) + 1, maxX = HALF_W - 0.01, maxZ = HALF_L - 0.01;
    let c = 0;
    for (let iz = -n; iz <= n && c < MAXT; iz++) {
      const z = (kz0 + iz + 0.5) * KNOT;
      if (z < -maxZ || z > maxZ) continue;
      const dz = z - camL.z, ez = z - apz;
      for (let ix = -n; ix <= n; ix++) {
        const x = (kx0 + ix + 0.5) * KNOT;
        if (x < -maxX || x > maxX) continue;
        const dx = x - camL.x;
        if (dx * dx + dz * dz > R2) continue;
        const ex = x - apx, dot = ex * fx + ez * fz;
        if (dot < 0 || dot * dot < cosH * cosH * (ex * ex + ez * ez)) continue;
        if (c >= MAXT) break;
        knotArr[c * 2] = x; knotArr[c * 2 + 1] = z; c++;
      }
    }
    g.instanceCount = c;
    knotAttr.needsUpdate = true;
  }

  // ---- per-frame ----
  const origin = V3();
  function placeWave(u) {
    const wv = shared.uWave.value;
    if (waveManual !== null) { wv.x = waveManual; wv.w = 1; return; }
    // the front crosses the field (x -180 to 180) between u 0.47 and 0.60 and is under the pool's centre at 0.535; it gathers
    // on the west border from 0.44 and dies on the east border by 0.64
    const w = (u - 0.415) / 0.24;
    if (!rare || w < 0.04 || w > 0.96) { wv.w = 0; wv.x = -9999; return; }
    wv.x = -330 + 660 * w;
    wv.w = smoothstep(0.04, 0.2, w) * (1 - smoothstep(0.8, 0.96, w));
  }
  function update(dt, time, camera) {
    shared.uTime.value = time;
    if (camera) {
      object.getWorldPosition(origin);
      camera.getWorldPosition(camL).sub(origin);
      shared.uCam.value.copy(camL);
    }
    shared.uWin.value.w = -time * 0.21;
    shared.uBranch.value.x = swayAmp * (14 * Math.sin(time * 0.6) + 6 * Math.sin(time * 1.7 + 1));
    if (!progressSeen) placeWave(rare ? 0.43 + ((time % 16) / 16) * 0.22 : -1);
    simulate(time);
    if (camera) refill(camera);
  }
  function setProgress(u) { progressSeen = true; waveU = u; placeWave(u); }
  function setWave(x) { waveManual = (x === null || x === undefined) ? null : x; placeWave(waveU); }
  function setLighting(o = {}) {
    if (o.sunDir) sunDir.fromArray(o.sunDir).normalize();
    if (o.sunColor !== undefined) shared.uSunCol.value.copy(asColor(o.sunColor));
    if (o.skyColor !== undefined) shared.uSkyCol.value.copy(asColor(o.skyColor));
    if (o.bounceColor !== undefined) shared.uBounceCol.value.copy(asColor(o.bounceColor));
    if (o.window) {
      const w = o.window, a = shared.uWin.value, b = shared.uWin2.value;
      a.set(w.x ?? a.x, w.zc ?? a.y, w.hz ?? a.z, a.w);
      b.set(w.y0 ?? b.x, w.y1 ?? b.y, w.cell ?? b.z, w.bar ?? b.w);
    }
    if (o.branch !== undefined) shared.uBranch.value.y = o.branch;
    if (o.leaf !== undefined) shared.uBranch.value.z = o.leaf;
    if (o.posts !== undefined) shared.uBranch.value.w = o.posts;
    if (o.mullions) shared.uMul.value.fromArray(o.mullions);
    if (o.transoms) shared.uMul2.value.set(o.transoms[0], o.transoms[1], o.transoms[2] || 0, 0);
    if (o.branchLine) shared.uBrA.value.fromArray(o.branchLine);
    if (o.sway !== undefined) swayAmp = o.sway;
    if (o.cloud !== undefined) shared.uCloud.value = o.cloud;
    if (o.lattice !== undefined) shared.uLatK.value = o.lattice;
    if (o.ambTint !== undefined) shared.uAmbTint.value.copy(asColor(o.ambTint));
  }
  // things standing on the carpet (hero-local capsules { a:[x,y,z], b:[x,y,z], r }, at most 14): they shade the wool and darken it at their feet
  function setOccluders(list = []) {
    for (let i = 0; i < NOCC; i++) {
      const o = list[i];
      if (!o) { occB[i].w = 0; continue; }
      const b = o.b || o.a;
      occA[i].set(o.a[0], o.a[1], o.a[2], o.r); occB[i].set(b[0], b[1], b[2], 1);
    }
  }
  // the room's warm lights (at most 2): [{ p:[x,y,z] hero-local, reach, color:[r,g,b] linear HDR, wrap }]; the world may
  // rewrite uniforms.uLampC[i] every frame to make them flicker
  function setLamps(list = []) {
    for (let i = 0; i < 2; i++) {
      const o = list[i];
      if (!o) { lampC[i].set(0, 0, 0, 0.5); continue; }
      lampP[i].set(o.p[0], o.p[1], o.p[2], o.reach ?? 200); lampC[i].set(o.color[0], o.color[1], o.color[2], o.wrap ?? 0.5);
    }
  }
  // the rising garden: { water, beds, shadow, tufts } (each 0..1; tufts = share of the tuft disc's radius kept). The trees
  // are written straight into uniforms.uGT[i] (x, z, height now, radius) by the world.
  function setGarden(o = {}) {
    const g = shared.uGar.value;
    if (o.water !== undefined) g.x = o.water;
    if (o.beds !== undefined) g.y = o.beds;
    if (o.shadow !== undefined) g.w = o.shadow;
    if (o.tufts !== undefined) tuftK = clamp(o.tufts, 0.3, 1);
  }
  function makeWeaveMaterial(o = {}) {
    const sk = o.occSkip || [-1, -1];
    return new THREE.ShaderMaterial({ uniforms: mkUniforms({ uBack: { value: o.back ? 1 : 0 }, uOccSkip: { value: new THREE.Vector2(sk[0], sk[1]) }, uPenK: { value: o.penumbra ?? 1 },
      uShell: { value: new THREE.Vector4(o.shell ?? 0, o.pile ?? 0, o.pile ? 1 : 0, o.fill ?? 0) } }), defines: { GC_WEAVE: 1 },
      vertexShader: FLAT_VERT, fragmentShader: FLAT_FRAG, fog: true, side: o.side ?? THREE.DoubleSide });
  }

  // ---- anchors (hero-local) ----
  const cypresses = [], trees = [], beds = [];
  for (const [sx, sz] of quads) {
    for (const ax of [27, 153]) for (const az of [160, 200]) cypresses.push(V3(sx * ax, 3.2, sz * az));
    for (const ax of [72, 108]) for (const az of [152.5, 182.5, 212.5]) trees.push(V3(sx * ax, 2.6, sz * az));
    for (const ax of [43, 87, 131]) beds.push(V3(sx * ax, 2.6, sz * 279));
    for (const az of [44, 94]) beds.push(V3(sx * 142, 2.6, sz * az));
  }
  const anchors = {
    entry: V3(0, 9, 435), apex: V3(140, 150, 100), pool: V3(0, 0, 0), poolRadius: 100, rosetteRadius: 22, carpRing: 52,
    poolPass: V3(-20, 60, -10), canalRun: [V3(0, 11, -130), V3(-8, 9.2, -165), V3(0, 14, -210)],
    closePass: { position: V3(-27, 3.2, -160), length: 34, width: 13 },
    portalSeat: { position: V3(0, 35, -316), facing: V3(0, 0, 1) },
    rollAxis: { from: V3(0, 35, -310), to: V3(0, 35, -460), radius: 35, hollow: 11 },
    flyThrough: [V3(0, 9, 435), V3(0, 9, 374), V3(0, 9, 287), V3(60, 60, 205), V3(140, 150, 100), V3(70, 96, 40), V3(-20, 60, -10),
      V3(-60, 16, -30), V3(0, 11, -130), V3(-8, 9.2, -165), V3(0, 14, -210), V3(0, 35, -316)],
    cat: V3(-150, 0, -250), chairLegs: [V3(-212, 0, 140), V3(-212, 0, -10)], slippers: V3(195, 0, -130), yarn: V3(150, 0, 240),
    fringeGate: V3(0, 0, 395), cypresses, trees, beds,
    window: { x: 680, zc: 551, hz: 600, y0: 150, y1: 800, cell: 18, bar: 2.7 },
    sunDir: sunDir.clone(), pileTop: BASE_Y + 3.03, tuftTop: BASE_Y + 2.43, halfWidth: HALF_W, halfLength: HALF_L, knot: KNOT,
  };

  await ctx.yield?.();
  update(0, 0, null);
  await ctx.yield?.();
  const view = VIEW === 1 ? { radius: 70, height: 150, center: V3(0, 0, 0) }
    : VIEW === 2 ? { radius: 2, height: 26, center: V3(-14, 2, -160) }
      : VIEW === 3 ? { radius: 4, height: 30, center: V3(60, 2, 285) }
        : { radius: 110, height: 150, center: V3(0, 0, 0) };
  return {
    object, radius: view.radius, height: view.height, center: view.center, anchors,
    update, dispose() {}, ground: true, groundY: 0,
    setProgress, setLighting, setWave, makeWeaveMaterial, setOccluders, setLamps, setGarden,
    variant, lead, rare, uniforms: shared, pacer,
    lightUniforms: { uSunDir: shared.uSunDir, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol, uBounceCol: shared.uBounceCol,
      uWin: shared.uWin, uWin2: shared.uWin2, uBranch: shared.uBranch, uBrA: shared.uBrA, uMul: shared.uMul, uMul2: shared.uMul2, uOccA: shared.uOccA, uOccB: shared.uOccB, uLampP: shared.uLampP, uLampC: shared.uLampC, uTime: shared.uTime },
    glsl: { common: GC_COMMON, light: GC_LIGHT, nap: GC_NAP, dye: GC_DYE_A + GC_DYE_B },
  };
}
