// Hero set piece for "Ribs of the Unfinished Ship" (world id hull-in-frames).
//
// WHAT IT IS
//   A great wooden ship standing in frames, built 8 times life size, and the steaming ironwood plank that is
//   carried the length of it and bent home at the bow. Everything is shaded by ONE light model shared with the
//   world: warm brown shade with three fills, plus thousands of round "coins" of sun thrown by pinholes in a
//   thatch roof that the hero never draws (the coins are worked out analytically, see LIGHT below).
//
// COORDINATES (the brief's own, so the world adds hero.object at the origin unrotated)
//   x to starboard, y up, bow toward -z, sand at y = 0. Origin = heel of the sternpost. The stern (the side the
//   camera enters from) faces +Z. Ribs: 70 pairs from z = -60 to -385. Stem foot at z = -430, head (0,95,-470).
//   hero.object must stay at the origin, unrotated and unscaled (the plank is posed in world space).
//   True half-length 235; radius 130 is a viewing radius for the set-piece viewer, height 96, center (0, 36, -215).
//
// PARTS (all children of hero.object)
//   ribs        70 pairs of swept crescents, three scarfed lengths each, trenails, adze scallops in the shader (sharper,
//               with fibre and growth lines, within about 30 m of the eye); the ten port ribs the plank is bent to have
//               their upper scarf just above eye height there, bound with rattan and pinned with dark trenails
//               (one sleeve of tight turns each, round domed trenails). Every rib HEAD is worked: adzed to a blunt
//               point round a flat of pale end grain (rings, checks: caps flagged in uv.x, see sweep), one in four cut
//               to a stepped tongue, most bound below the head with a rattan sleeve
//   backbone    keel on blocks, keelson, floor timbers, sternpost, counter timbers, stem with garland
//   rudder      rudder post and blade hung in rope slings behind the sternpost; turns slowly (own Object3D); dark straps
//               with pale studs, trenail rows, two rope slings round the blade; three rattan wooldings on the sternpost
//   skin        bilge strakes up to y 14, ribbands outside the ribs, cross-spalls at the heads, rattan lashings
//   rope        the ridge rope, from x = 6 at the stern tripod (z 100) up to a ridge pole high over the hull and down
//               to x = -6 at the bow (z -420): its points are ROPE, or opts.rope ([x, y, z] by falling z); the slings
//               of the carried plank run up to it, so it must stay above the whole flight
//   carried     THE VEHICLE: plank 40 x 2.4 x 0.5 m (80 segments), two rope slings, bamboo traveller, steam (thin
//               ribbons that rise and thin out, never puffs), drips under it, nine turned pegs. Its wet black face shows
//               every coin of sun as a tight glint ringed with dark water and mirrors the roof's points of day.
//               hero.carried is that Object3D. The hero places it itself (see RIDING).
//   berth       five rope windlasses (mesh 'windlasses') and nine 3 m pegs on the port ribs at z -354..-394
//   threads     pencils of light: ribbons from the brightest pinholes down through the smoke (additive)
//
// LIGHT (no three.js lights are used or needed; scene lights are ignored by these materials)
//   hero.light = { uniforms, glsl, apply(look) }.
//   glsl is a fragment chunk that declares the uniforms below and  float hifCoin(vec3 worldPos)  (0..1, the soft
//   disc of every pinhole whose ray reaches worldPos) and  vec3 hifShade(vec3 worldNormal, vec3 worldPos)  (the
//   shade fills). A surface is  albedo * (hifShade(n, p) + uCoinCol * hifCoin(p) * max(dot(n, uSunDir), 0.)).
//   The world's own materials should include hero.light.glsl and spread hero.light.uniforms into their uniforms
//   (the SAME objects, by reference) so sand, posts, bamboo, smoke and dust carry the same coins. Thatch can draw
//   the pinholes as points of day with  hifCoin  evaluated at the roof itself.
//   uniforms: uTime, uSunDir (to the sun), uCoinCol (HDR, about 4x the shade), uRoof (ridge y, roof slope,
//   cell size, share of cells with a hole), uFillUp, uFillDown, uFillPort, uFillStar, uWetAll (0..1 wets all
//   timber), uGlaze (light added whatever the timber's colour: the indigo of moonlit wood; zero by day), uEmber (the
//   orange glow of the bending fire on whatever stands near the trough astern; part of hifShade), uForm (x: how
//   far a face turned fore or aft, the flank of a rib, falls into brown shade; y: gain on faces turned inboard; z:
//   fall-off of every face turned away from the roof and the sand; hifFormK(n) is that factor alone, for materials
//   that want the fills without it), uThinA / uThinB (two places where the thatch has worn thin: cell x, cell y,
//   radius in cells, gain; nearly every cell there has its pinhole, so coins and pencils stand in a dense cluster;
//   set from opts.thin). There is no daylight term from the stern gable and no second wide shaft.
//   vec4 hifHole(vec2 cell) gives one pinhole (centre in cell units, hole radius in m, open 0..1); roof point of a
//   cell-space position c is x = c.x * cell / 1.25, z = c.y * cell, y = ridge - slope * abs(x).
//   apply('noon' | 'rain' | 'night') sets them for the three looks of the brief; opts.look picks one at build.
//   Fog: every material has fog: true and uses the scene fog (FogExp2 or linear).
//
// RIDING (the scripted moments)
//   hero.setProgress(u) is called by the world every frame with the path progress; hero.update(dt, time, camera)
//   then poses the plank from camera.matrixWorld exactly as the brief says:
//     u == 0          hidden, not carried (portal picture)
//     0.12 .. 0.24    rises from 34 m back and 16 m low, 4 m to port of the eye (clear of the sternpost)
//     0.205 .. 0.285  swings out to its riding place
//     0.285 .. 0.69   riding: centre = eye + 4 m left, 5 m down, 10 m ahead along the line of travel (the world
//                     passes that direction to setProgress; without it the camera's level heading is used). It sways
//                     1.2 m to port and back every 9 s, yaws slowly 3 degrees either way about the point abeam of
//                     the eye (no set to port) and dips. Nothing of it comes nearer the eye than 6.4 m or crosses
//                     the middle of the view. Only the pegs' heads show while riding. The
//                     three offsets are hero.ride { left, down, ahead } (opts.ride sets them); the world may change
//                     them every frame (it runs the plank out ahead as it comes up). ride.rise (default 4) is how far
//                     to port of the eye it comes up before it swings out. It comes up fore end first and levels.
//   The u given to setProgress is the STORY's clock, not necessarily the path's: the world may map its path progress
//   onto these keys (it berths the plank a little later along its own path).
//     0.688 .. 0.712  three hauling lines come taut from blocks high on the port ribs to the plank's ends and middle
//     0.69 .. 0.765   blends to the berth pose, on edge against the port ribs; slings let go 0.718 .. 0.745 (before the
//                     eye crosses beneath the rope to follow it)
//     0.80 .. 0.87    uBend curves it to the ribs; five windlass sticks turn; nine pegs are knocked home 0.8065 .. 0.874
//                     (three blows each, one blow every quarter of a hundredth of the path, each peg struck 6 to 9 m
//                     ahead of an eye that follows the brief's path); from 0.765 the steam rises as a sheaf of fine
//                     threads from each glint lying on the berthed plank
//   The nine pegs ride on the plank, started in their holes (they stand 2.6 m off its upper face), and are knocked
//   through into the ribs at the berth. The world may add a puff of dust per knock; none is built here.
//   If setProgress is never called (the set-piece viewer) the plank is posed for a virtual eye on the brief's path
//   at opts.demoU (default 0.42, riding amidships; 0.84 shows it half bent at the berth).
//
// ANCHORS (local = world space)
//   portalSeat { position (-9.5,34,-446), facing (0,0,1) }   between stem and gantry, 14 m portal
//   flyThrough  the path points (the brief's: in from astern, past the sternpost, up into the ribcage, down the nave)
//   haulBlocks  the three blocks on the port ribs that the hauling lines lead through
//   ridgeRope   [from, to]            sternMark  the black upright seen from the entry (sternpost + rudder)
//   towerSite   where the staging tower goes       coilSite   the hanging rattan coils
//   berth       { from, to }  inner face of the port ribs where the plank lands
//   stemGarland the frangipani garland             gantry { upright x, bar y }  the world builds the gantry
//   ribAt(i, side, y) -> Vector3  inner face of rib i (0..69), side -1 port / +1 starboard, at height y
//   halfBreadth(z, y) -> metres   inner half-breadth of the hull, for seating staging, props and birds
//
// OPTS  palette (7 hex strings, the brief's by default), look ('noon' | 'rain' | 'night'), path (the flight's
//       points), rope (the ridge rope's points), ride ({ left, down, ahead, rise }), spallSkip ([z high, z low]: no
//       cross-spalls between them), paleRibs (true: every rib and strake is pale new timber, a step lighter and
//       yellower than the shed round it; the world sets it with teak by day), day (true: the day looks' tones: ironwood
//       a step lighter so its form shows), thin ([[x, y, z, radius m, gain], ...] up to two thin places in the thatch,
//       given by a point their rays fall on), sun ([x, y, z] to the sun, when the world moves it),
//       teak (true/false, otherwise by seed), garland ('frangipani' | 'palm', otherwise by seed),
//       threads (false to leave the pencils out), demoU, newRibs (how many pairs at the bow are new pale timber; at least 10).
//       By seed: ironwood or teak ribs, how many new pale ribs at the bow, rib crooks and head heights, scarf
//       places, which strakes are fresh, frangipani or plaited-palm garland.
// COST  about 120k triangles, 25 draw calls, no lights, no textures. Build about 400 ms on the test machine, in short steps.
// EXPECTS a dim warm fog (FogExp2 about 0.0022, colour near #9A8468 by day), exposure about 1.05, bloom 0.4 at
//       threshold 1. Coins on new timber are meant to glow a little; nothing else in the hero exceeds 1.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#3A2A20', '#C8A46A', '#8B8277', '#FFE6A8', '#8A7A50', '#E8DBBE', '#3FC4BE'];
const N_RIBS = 70, RIB_Z0 = -60, RIB_DZ = 4.7, RIB_SIDED = 1.8, RIB_MOULD = 2.6;
const PATH = [[6, 24, 85], [6.5, 24, 55], [9, 24, 25], [9.5, 26, -5], [9.5, 30, -35], [9.5, 34, -65], [9.5, 32.5, -125], [9.5, 31, -190], [9.5, 31.5, -250], [8, 33, -300], [0, 34, -345],
  [-7.5, 34, -374], [-9.5, 34, -392], [-9.5, 34, -420], [-9.5, 34, -446]];
// the ridge rope when the world gives none: from the stern tripod to the bow A-frame, about 18 m above the path
const ROPE = [[6, 42, 100], [4.3, 42.6, 25], [2.2, 52.6, -65], [-0.7, 49.6, -190], [-4.3, 52.6, -345], [-6, 52, -420]];
const PORTAL_Z = -446;

// ---------------------------------------------------------------- the shared light model (GLSL)
const LIGHT_GLSL = /* glsl */`
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uCoinCol;
uniform vec4 uRoof;
uniform vec3 uFillUp;
uniform vec3 uFillDown;
uniform vec3 uFillPort;
uniform vec3 uFillStar;
uniform float uWetAll;
uniform vec3 uGlaze;
uniform vec3 uEmber;
uniform vec3 uForm;
uniform vec4 uThinA;
uniform vec4 uThinB;
vec3 hifHash3(vec2 c) {
  vec3 p = fract(vec3(c.xyx) * vec3(0.1031, 0.1030, 0.0973) + 0.031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.xxy + p.yzz) * p.zyx);
}
// pinhole of roof cell c: xy = centre in cell units (it sways), z = hole radius in metres, w = open (0..1, winks)
vec4 hifHole(vec2 c) {
  vec3 h = hifHash3(c);
  vec3 g = hifHash3(c + 71.7);
  float ph = g.x * 6.2832;
  // many small holes and a few big ones (the big ones sit nearer the middle of their cell and stir less)
  float big = fract(h.z * 17.31 + g.x * 5.77);
  big = big * big * big;
  float keep = 1. - 0.6 * big;
  vec2 ctr = c + 0.5 + (h.xy - 0.5) * 0.5 * keep
    + 0.3 * vec2(sin(uTime * (0.35 + 0.3 * g.y) + ph), cos(uTime * (0.27 + 0.25 * g.z) + ph * 1.7)) * (0.4 + 0.6 * g.y) * keep;
  float wink = g.z < 0.143 ? smoothstep(-0.25, 0.25, sin(uTime * (0.5 + g.x) + ph * 3.)) : 1.;
  // the thatch is denser in some places and thinner in others: the coins come in drifts
  float drift = 0.5 + 0.5 * sin(c.x * 0.37 + 1.9 * sin(c.y * 0.151 + 0.7)) * sin(c.y * 0.233 + 1.6 * sin(c.x * 0.117 + 2.1));
  float share = uRoof.w * mix(0.3, 1.75, drift * drift * (3. - 2. * drift));
  // two places where the thatch has worn thin (cell x, cell y, radius in cells, how much thinner): there nearly every
  // cell has its pinhole, so the coins and their pencils of light stand in a dense cluster
  vec2 dA = (c - uThinA.xy) / max(uThinA.z, 0.5), dB = (c - uThinB.xy) / max(uThinB.z, 0.5);
  share += uThinA.w * exp(-dot(dA, dA)) + uThinB.w * exp(-dot(dB, dB));
  return vec4(ctr, mix(0.07, 1.12, big), step(h.z, share) * wink);
}
// soft disc of sun from every roof pinhole whose ray passes through p (world space)
float hifCoin(vec3 p) {
  float sgn = p.x < 0. ? -1. : 1.;
  float den = max(uSunDir.y + uRoof.y * uSunDir.x * sgn, 0.25);
  float t = max((uRoof.x - uRoof.y * abs(p.x) - p.y) / den, 0.);
  vec3 q = p + uSunDir * t;
  float cell = max(uRoof.z, 0.1);
  vec2 uv = vec2(q.x * 1.25, q.z) / cell;
  vec2 base = floor(uv - 0.5);
  float grow = 0.0027 * t;
  float acc = 0.;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      vec4 hole = hifHole(base + vec2(float(i), float(j)));
      float r = min(hole.z + grow, 1.5) / cell;
      float d = length(uv - hole.xy);
      acc = max(acc, hole.w * (1. - smoothstep(r * 0.62, r * 1.08, d)));
    }
  }
  return acc;
}
// Form (uForm): nothing but the roof decides what is lit, so a face that looks up at it is the lit one; a face turned
// from the roof falls off (uForm.z); a timber's fore and aft flanks, which look only at the next timber, fall further
// into warm brown shade (uForm.x); the face that looks in at the nave takes the fills in full (uForm.y).
// hifFormK is the grey part of that, for cloth and mats that hang square to the nave and must not go dark.
float hifFormK(vec3 n) {
  float ay = min(abs(n.y), 1.);
  return (1. - uForm.z * (1. - ay * ay)) * (1. - 0.9 * uForm.x * min(n.z * n.z, 1.) * (1. - 0.6 * ay));
}
// the shade: dim brown from the thatch above, sand bounce from below, green from port, turquoise from starboard forward
vec3 hifShade(vec3 n, vec3 p) {
  float up = n.y * 0.5 + 0.5;
  vec3 c = mix(uFillDown, uFillUp, up * up * (3. - 2. * up));
  c += uFillPort * max(-n.x, 0.) * (0.55 + 0.45 * max(-n.x, 0.));
  float fwd = smoothstep(-60., -300., p.z);
  c += uFillStar * max(n.x, 0.) * (0.3 + 0.7 * fwd);
  float ay = min(abs(n.y), 1.);
  float inb = max(-n.x * (p.x < 0. ? -1. : 1.), 0.) * (1. - smoothstep(34., 50., abs(p.x)));
  c *= (1. - uForm.z * (1. - ay * ay)) * (vec3(1.) - uForm.x * min(n.z * n.z, 1.) * (1. - 0.6 * ay) * vec3(0.8, 0.9, 1.0)) * (1. + uForm.y * min(inb, 1.));
  // the bending fire astern: a low orange glow on whatever stands near the trough, strongest from below
  vec3 de = p - vec3(6., 0.6, clamp(p.z, 31., 73.));
  float ed = dot(de, de);
  c += uEmber * (0.35 + 0.65 * max(-dot(n, de) / sqrt(ed + 0.01), 0.)) / (1. + 0.008 * ed) * (1. - 0.85 * smoothstep(9., 42., p.y));
  return c;
}
`;

// ---------------------------------------------------------------- wood material
const WOOD_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec3 aCol;
uniform float uBend;
uniform float uBendOn;
uniform float uBelly;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vWp;
varying vec3 vWn;
varying vec3 vVp;
void main() {
  vec3 pos = position;
  vec3 nrm = normal;
  if (uBendOn > 0.5) {
    // the plank: local x runs along it (-20..20, +x forward), y through its thickness.
    // The forward end stands 4 m proud along y by a parabola that uBend draws in.
    float s = clamp((pos.x + 20.) / 40., 0., 1.);
    float k = (1. - uBend) * 4.0 * s * s;
    pos.y += k - uBelly * 4. * s * (1. - s);
    nrm.x -= ((1. - uBend) * 0.2 * s - uBelly * 0.1 * (1. - 2. * s)) * nrm.y;
    nrm = normalize(nrm);
  }
  #ifdef USE_INSTANCING
    vec4 wp = modelMatrix * instanceMatrix * vec4(pos, 1.);
    vWn = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * nrm);
  #else
    vec4 wp = modelMatrix * vec4(pos, 1.);
    vWn = normalize(mat3(modelMatrix) * nrm);
  #endif
  vCol = aCol;
  vUv = uv;
  vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  vVp = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const WOOD_FRAG = /* glsl */`
#include <fog_pars_fragment>
${LIGHT_GLSL}
uniform float uWet;
uniform float uScallop;
uniform float uSlide;
uniform float uWrap;
uniform float uNode;
uniform float uGrainK;
uniform float uTwist;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vWp;
varying vec3 vWn;
varying vec3 vVp;
float wHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030) + 0.017); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float wNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wHash(i), wHash(i + vec2(1., 0.)), f.x), mix(wHash(i + vec2(0., 1.)), wHash(i + vec2(1., 1.)), f.x), f.y);
}
// adze scallops: shallow dishes in staggered rows along the timber; returns height, y = cell tone
vec2 wScallop(vec2 uv) {
  vec2 g = uv * vec2(0.62, 1.9);
  g += vec2(wNoise(uv * 0.83 + 3.1), wNoise(uv * 0.71 + 17.3)) * vec2(0.9, 0.7);
  float row = floor(g.y);
  g.x += wHash(vec2(row, 3.7)) * 3.1;
  vec2 c = floor(g), f = fract(g) - 0.5;
  float tone = wHash(c + 11.3);
  f += (vec2(tone, wHash(c + 5.1)) - 0.5) * 0.34;
  float d = dot(f, f) * 4.;
  return vec2(clamp(d, 0., 1.4), tone);
}
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  float dist = length(vVp);
  // bump from the scallops and the grain, faded where they would alias
  float fine = 1. - smoothstep(60., 190., dist);
  vec2 sc = wScallop(vUv);
  float grain = wNoise(vec2(vUv.x * 0.22, vUv.y * 6.5)) * 0.6 + wNoise(vec2(vUv.x * 0.9, vUv.y * 19.)) * 0.4;
  grain = mix(0.5, grain, uGrainK);                                      // pegs and ropes: plain, no figure
  // within a few metres of the eye: the fibre of the wood and the wandering lines of its growth, sharp, and the
  // adze's dishes cut deeper (not on bamboo, whose uv runs the other way)
  float nearK = (1. - smoothstep(9., 36., dist)) * (1. - uNode);
  float fib = wNoise(vec2(vUv.x * 1.9, vUv.y * 47.)) * 0.65 + wNoise(vec2(vUv.x * 5.3 + 3., vUv.y * 120.)) * 0.35;
  float ringL = abs(fract(vUv.y * 2.9 + 1.1 * wNoise(vec2(vUv.x * 0.31, vUv.y * 1.7 + 5.))) - 0.5);
  float ringK = smoothstep(0.41, 0.5, ringL);
  float hgt = (sc.x * 0.042 * uScallop * (1. + 1.4 * nearK) + grain * 0.035 * uGrainK + (fib * 0.014 - ringK * 0.012) * nearK * uGrainK) * fine;
  // sawn and adzed ends (their uv is the section's own, 1000 along): no scallops
  float endF = step(900., vUv.x);
  hgt *= 1. - endF;
  vec3 dpx = dFdx(vVp), dpy = dFdy(vVp);
  float hx = dFdx(hgt), hy = dFdy(hgt);
  vec3 vn = normalize(mat3(viewMatrix) * n);
  vec3 r1 = cross(dpy, vn), r2 = cross(vn, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (hx * r1 + hy * r2);
  vec3 bn = abs(det) * vn - grad;
  float bl = length(bn);
  vn = bl > 1e-6 ? bn / bl : vn;
  n = normalize(mix(n, normalize((vec4(vn, 0.) * viewMatrix).xyz + n * 1e-4), fine));

  float wet = max(uWet, uWetAll);
  vec3 alb = vCol * (0.78 + 0.34 * grain) * (0.97 + 0.06 * sc.y * uScallop);
  alb *= 1. - 0.1 * uScallop * fine * smoothstep(0.8, 1.3, sc.x);       // dark ridge between scallops
  alb *= 1. + nearK * uGrainK * (0.28 * (fib - 0.5) - 0.13 * ringK);
  alb *= 1. + nearK * uScallop * (0.16 * (sc.y - 0.5) - 0.2 * smoothstep(0.84, 1., sc.x) * (1. - smoothstep(1., 1.28, sc.x)));
  alb *= mix(1., 0.86 + 0.28 * wNoise(vUv * 0.07 + vWp.zy * 0.013), 1.);  // broad staining
  alb *= 1. - uWrap * 0.45 * smoothstep(0.35, 0.5, abs(fract(vUv.y * 5.5) - 0.5));
  // rope: three strands laid up, a dark groove between them (uTwist = turns of the lay per unit of v; 0 for timber)
  alb *= 1. - min(uTwist, 1.) * 0.5 * smoothstep(0.3, 0.5, abs(fract(vUv.y * uTwist + vUv.x * 0.9) - 0.5));
  // bamboo: a thin dark ring at each node with a pale shoulder, and every internode its own tone and streaks
  float nd = abs(fract(vUv.y * 5.5) - 0.5);
  float ring = smoothstep(0.455, 0.49, nd);
  alb *= 1. + uNode * (0.3 * smoothstep(0.34, 0.45, nd) * (1. - ring) - 0.6 * ring);
  alb *= 1. + uNode * (0.5 * wHash(vec2(floor(vUv.y * 5.5 + 0.5), 3.1)) - 0.25 + 0.3 * (wNoise(vec2(vUv.x * 4.5, vUv.y * 0.7)) - 0.5));
  // end grain: growth rings round a heart that lies off the middle of the section, a few drying checks across them,
  // the saw's or the adze's fine tooth
  vec2 eu = vec2(vUv.x - 1000., vUv.y);
  float eh = fract(vCol.r * 91.7 + vCol.g * 57.3);
  vec2 ed = eu - (vec2(eh, fract(eh * 7.31)) - 0.5) * 3.4;
  float er = length(ed) * 1.7 + 0.5 * wNoise(eu * 1.4 + eh * 31.);
  float ringE = smoothstep(0.2, 0.5, abs(fract(er) - 0.5));
  float checkE = smoothstep(0.74, 0.88, wNoise(vec2(atan(ed.y, ed.x + 1e-3) * 3.5, er * 0.2 + eh * 9.)));
  float ringFar = 1. - smoothstep(40., 110., dist);
  vec3 endAlb = vCol * mix(0.84, 0.64 + 0.36 * ringE, ringFar) * (1. - 0.5 * checkE * ringFar) * (0.88 + 0.24 * wNoise(eu * 5.));
  alb = mix(alb, endAlb, endF);
  alb = mix(alb, alb * alb * 1.15 + alb * 0.1, wet * 0.9);

  vec3 cp = vWp + vec3(0., 0., uSlide);
  float coin = hifCoin(cp);
  float ndl = max(dot(n, uSunDir), 0.);
  float lit = coin * smoothstep(-0.28, -0.08, dot(normalize(vWn), uSunDir));
  // a grazing ray still makes a bright streak on a flank, and sunlit timber glows a little from within
  // (on dark ironwood the coin is a blazing oval: the black timber gives back more of it as a glow than as colour)
  float darkK = 1. - smoothstep(0.035, 0.2, max(vCol.r, max(vCol.g, vCol.b)));
  vec3 col = alb * (hifShade(n, vWp) + uCoinCol * lit * (0.52 + 0.58 * ndl)) + uCoinCol * lit * vec3(0.036, 0.021, 0.008) * (1. + 1.3 * darkK);
  // and its adzed faces keep a dull polish: each dish that tips toward the roof gives back a little of its light
  vec3 vS = normalize(cameraPosition - vWp);
  float sh8 = max(dot(n, normalize(vS + vec3(0., 1., 0.))), 0.);
  sh8 *= sh8; sh8 *= sh8; sh8 *= sh8;
  col += darkK * (uFillUp + uFillDown) * 0.03 * sh8 * fine * (1. - endF);
  // glaze: light that does not take the timber's own colour (moonlit indigo at night; zero by day)
  col += uGlaze * ((0.35 + 0.65 * (n.y * 0.5 + 0.5)) * (0.7 + 0.5 * grain) + coin * 5. * (0.25 + 0.75 * ndl));
  // wet sheen: the roof and its points of day mirrored in the film of water
  vec3 v = normalize(cameraPosition - vWp);
  float fres = 1. - max(dot(n, v), 0.);
  fres = fres * fres * fres;
  vec3 hv = normalize(v + uSunDir + vec3(0., 1e-4, 0.));
  float spec = max(dot(n, hv), 0.);
  spec = spec * spec; spec = spec * spec; spec = spec * spec; spec = spec * spec;
  col += wet * (uFillUp * 0.55 * fres * (0.4 + 0.6 * max(n.y, 0.)) + uCoinCol * coin * spec * 0.7);
  // lagoon light: a cool rim on whatever stands between the eye and the starboard side, forward of amidships
  float fwdR = smoothstep(-150., -300., vWp.z) * (1. - smoothstep(-410., -450., vWp.z)) * smoothstep(8., 26., vWp.x) * smoothstep(0.1, 0.6, -v.x);
  float fr = 1. - abs(dot(n, v));
  col += uFillStar * (0.25 + alb * 2.5) * fwdR * fr * fr * 1.7;
  gl_FragColor = vec4(max(col, vec3(0.)), 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- the plank's own material
// Near-black wet ironwood. Its face is a film of water over soaked black timber, which drinks the light: a coin of
// sun that falls on it does not lie there as a broad pale disc but shows as a TIGHT GLINT, a small crisp round image
// of its pinhole with a hot heart, ringed by the dark of the standing water round it. The film also mirrors the shed
// in small sharp points: the roof's points of day when the face looks up, the coins lying on the sand when the board
// stands on edge; and close to the eye the sheen breaks into thin bright lines along the grain. The sawn ends and
// the two long edges are paler, so the board keeps a crisp outline. uv.x = metres along (0..40), uv.y = metres round
// the section (the wet face is 0.1..2.36). PLANK_COIN is shared with the steam, whose threads rise from the glints
// once the board stands on edge at the berth.
const PLANK_COIN = /* glsl */`
uniform float uFaceY;
uniform vec4 uBerth;
// The glints that lie on the face while the board stands on edge at the berth: one to each 2.2 m of its length, a
// few cells left dark, each a small round image of a pinhole that drifts a hand's breadth and now and then winks.
// s = metres along the berth (uBerth = its start (x, z) and heading). Returns the glint of that cell: x = its place
// along, y = its height above the face's middle line, z = its radius, w = lit (0..1).
vec4 hifOwnSpot(float s) {
  float i = floor(s / 2.2);
  vec2 h = fract(sin(vec2(i * 12.9898 + 3.1, i * 78.233 + 1.7)) * 43758.5453);
  float h3 = fract(h.x * 7.3 + h.y * 3.1);
  float cs = (i + 0.5 + (h.x - 0.5) * 0.45) * 2.2 + 0.14 * sin(uTime * (0.3 + 0.3 * h.y) + i * 2.1);
  float cy = (h.y - 0.5) * 1.5 + 0.07 * sin(uTime * (0.24 + 0.3 * h.x) + i * 1.3);
  float wink = h3 > 0.86 ? smoothstep(-0.25, 0.25, sin(uTime * (0.5 + h.x) + i * 3.)) : 1.;
  float sz = fract(h3 * 5.7);
  return vec4(cs, cy, 0.055 + 0.21 * sz * sz, step(0.28, h3) * wink * (0.5 + 0.7 * fract(h3 * 9.1)));
}
// one glint, d from its centre, radius r, aa = a pixel's width there: x = its crisp disc, y = the ring of standing
// water round it (out to 2.3 r), z = 1 at its heart falling to 0 at its edge
vec3 hifSpot(float d, float r, float aa, float on) {
  float e = max(aa, r * 0.07);
  return on * vec3(1. - smoothstep(r - e, r + e, d), 1. - smoothstep(r * 1.25, r * 2.3, d), clamp(1. - d / max(r, 1e-4), 0., 1.));
}
// the roof's pinholes as glints on the board: the same holes, places, sway and winks as hifCoin, drawn tight
vec3 hifRoofSpots(vec3 p, float aa) {
  float sgn = p.x < 0. ? -1. : 1.;
  float den = max(uSunDir.y + uRoof.y * uSunDir.x * sgn, 0.25);
  float t = max((uRoof.x - uRoof.y * abs(p.x) - p.y) / den, 0.);
  vec3 q = p + uSunDir * t;
  float cell = max(uRoof.z, 0.1);
  vec2 uv = vec2(q.x * 1.25, q.z) / cell;
  vec2 base = floor(uv - 0.5);
  float grow = 0.0027 * t;
  vec3 acc = vec3(0.);
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      vec2 cc = base + vec2(float(i), float(j));
      vec4 hole = hifHole(cc);
      // (no two glints alike: each pinhole's image has its own size and strength)
      vec3 hv = hifHash3(cc + 5.3);
      float r = clamp(0.5 * (hole.z + grow) * (0.4 + 1.5 * hv.x * hv.x), 0.06, 0.46) / cell;
      acc = max(acc, hifSpot(length(uv - hole.xy), r, aa / cell, hole.w * (0.45 + 0.75 * hv.y)));
    }
  }
  return acc;
}
// On the upright face at the berth a pinhole's ray would only graze: there the face keeps its own glints (hifOwnSpot).
// nh = the face's level normal, k = how upright, aa = a pixel's width on the face in metres.
vec3 hifPlankSpots(vec3 p, vec3 nh, float k, float aa) {
  vec3 q = p + nh * ((p.y - uFaceY) * 0.9 * k);
  vec3 c = max(hifRoofSpots(q, aa), 0.9 * hifRoofSpots(q + vec3(1.7, 0., 2.3), aa));
  float s = dot(p.xz - uBerth.xy, uBerth.zw);
  vec4 o = hifOwnSpot(s);
  vec3 own = hifSpot(length(vec2(s - o.x, p.y - uFaceY - o.y)), o.z, aa, o.w);
  return mix(c, own, k);
}
`;
const PLANK_FRAG = /* glsl */`
#include <fog_pars_fragment>
${LIGHT_GLSL}
${PLANK_COIN}
uniform vec3 uSheen;
uniform float uGloss;
uniform vec3 uEdge;
varying vec3 vCol;
varying vec2 vUv;
varying vec3 vWp;
varying vec3 vWn;
varying vec3 vVp;
float wHash(vec2 p) { p = fract(p * vec2(0.1031, 0.1030) + 0.017); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
float wNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wHash(i), wHash(i + vec2(1., 0.)), f.x), mix(wHash(i + vec2(0., 1.)), wHash(i + vec2(1., 1.)), f.x), f.y);
}
void main() {
  vec3 n = normalize(vWn);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(cameraPosition - vWp);
  float px = vUv.x, pv = vUv.y;
  float edge = max(smoothstep(2.3, 2.42, pv) * (1. - smoothstep(2.86, 2.96, pv)), max(smoothstep(5.12, 5.24, pv), 1. - smoothstep(0.05, 0.15, pv)));
  // (the two sawn ends are flagged: their uv is the section's own, 1000 along)
  float capK = step(900., px);
  vec2 eu = vec2(px - 1000., pv);
  float endK = smoothstep(19.25, 19.5, abs(px - 20.)) * (1. - capK);
  float pale = max(edge * 0.8, endK * 0.4) * (1. - capK);
  float grain = wNoise(vec2(px * 0.3, pv * 7.)) * 0.6 + wNoise(vec2(px * 1.1, pv * 9.)) * 0.4;
  vec3 alb = vCol * (0.75 + 0.5 * grain);
  // close to the eye: the long straight grain of ironwood, and a dark line at each arris so the board's section reads
  float nearP = 1. - smoothstep(10., 36., length(vVp));
  float lg = wNoise(vec2(px * 0.33, pv * 27.)) * 0.6 + wNoise(vec2(px * 1.2, pv * 63.)) * 0.4;
  alb *= 1. + nearP * 1.1 * (lg - 0.45);
  alb = alb * alb * 2.4 + alb * 0.3;                                    // soaked: darker and richer
  float arris = max(1. - smoothstep(0.02, 0.09, abs(pv - 0.12)), 1. - smoothstep(0.02, 0.09, abs(pv - 2.34))) * (1. - capK);
  // (the pale edges keep the saw's tooth: fine cross marks)
  alb = mix(alb, uEdge * (0.8 + 0.4 * grain) * (1. + 0.5 * nearP * (lg - 0.5)) * (0.86 + 0.28 * wNoise(vec2(px * 7.5, pv * 2.3))), pale);
  // the sawn ends: dark ironwood end grain, soaked like the faces; growth rings round a heart that lies off the board,
  // a few checks across them, the saw's fine tooth, and a darker wet rim where the water stands along the arrises
  vec2 eg = vec2(eu.x * 1.3 - 2.6, eu.y * 0.34 + 0.5);
  float er = length(eg) * 3.4 + 0.45 * wNoise(eu * 2.1);
  float ringE = smoothstep(0.25, 0.5, abs(fract(er) - 0.5));
  float checkE = smoothstep(0.8, 0.9, wNoise(vec2(atan(eg.y, eg.x + 1e-3) * 9., er * 0.15)));
  float rimE = max(smoothstep(0.5, 0.72, abs(eu.x)), smoothstep(3.25, 3.52, abs(eu.y)));
  vec3 endAlb = (alb * 2.6 + vec3(0.05, 0.022, 0.012)) * (0.5 + 0.5 * ringE) * (1. - 0.5 * checkE) * (0.85 + 0.3 * wNoise(vec2(eu.x * 9., eu.y * 40.))) * (1. - 0.5 * rimE);
  alb = mix(alb, endAlb, capK);
  alb *= 1. - 0.55 * arris * nearP;
  float upright = 1. - smoothstep(0.3, 0.75, abs(n.y));
  vec3 nh = vec3(n.x, 0., n.z);
  float dist = length(vVp);
  // (every screen-space derivative this shader needs is taken here, before any loop)
  float aa = 0.75 * length(fwidth(vWp));
  // the film mirrors the shed. Up: the thatch and its points of day. Down: the sand and the coins that lie on it.
  vec3 rr = reflect(-v, n);
  rr.xz += (vec2(wNoise(vec2(px * 0.8, pv * 5.)), wNoise(vec2(px * 0.8 + 7.3, pv * 5. + 3.1))) - 0.5) * 0.012;
  float cellM = max(uRoof.z, 0.1);
  float dP = max(rr.y + uRoof.y * rr.x, 0.04), dM = max(rr.y - uRoof.y * rr.x, 0.04);
  float tP = (uRoof.x - uRoof.y * vWp.x - vWp.y) / dP, tM = (uRoof.x + uRoof.y * vWp.x - vWp.y) / dM;
  float tR = clamp(mix(tM, tP, step(0., vWp.x + rr.x * tP)), 0., 900.);
  vec3 qR = vWp + rr * tR;
  vec2 uvR = vec2(qR.x * 1.25, qR.z) / cellM;
  float aaR = clamp(length(fwidth(uvR)) * 1.1, 1e-4, 4.);
  vec2 bR = floor(uvR - 0.5);
  float accR = 0.;
  for (int j = 0; j < 2; j++) {
    for (int i = 0; i < 2; i++) {
      vec2 cR = bR + vec2(float(i), float(j));
      vec4 hole = hifHole(cR);
      // (no two of the mirrored points alike: half of them are lost in the grain, the rest differ in size and strength)
      vec3 hv = hifHash3(cR + 19.3);
      float r0 = (0.1 + 0.5 * hole.z) * (0.55 + 1.3 * hv.z) / cellM;
      float w = max(r0, aaR);
      accR = max(accR, hole.w * step(0.5, hv.x) * (0.2 + 1.7 * hv.y * hv.y) * (1. - smoothstep(w * 0.55, w * 1.15, length(uvR - hole.xy))) * min(1., (r0 * r0) / (w * w) * 2.5));
    }
  }
  accR *= smoothstep(0.06, 0.22, rr.y) * step(abs(qR.x), 96.) * step(-500., qR.z) * step(qR.z, 115.);
  float tG = clamp((vWp.y - 1.) / max(-rr.y, 0.05), 0., 400.);
  vec3 qG = vWp + rr * tG;
  float coinG = hifCoin(qG) * smoothstep(0.05, 0.2, -rr.y) * step(abs(qG.x), 86.) * exp(-tG * 0.006);
  // a coin of sun on the board: a tight glint, the standing water dark round it
  vec3 spot = hifPlankSpots(vWp, nh, upright, aa);
  float nds = dot(n, uSunDir);
  float ndl = max(nds, 0.);
  float faceK = mix(smoothstep(-0.28, -0.08, nds), 1., upright);
  float lit = spot.x * faceK;
  float rimK = spot.y * (1. - spot.x) * faceK;
  // the timber's own answer to a coin, eased where it is pale so the long edges never burn out
  vec3 cl = uCoinCol * lit * (0.42 + 0.58 * ndl);
  cl /= 1. + 0.5 * pale * max(cl.r, max(cl.g, cl.b));
  vec3 col = alb * (hifShade(n, vWp) * (0.55 + 0.45 * pale) + cl);
  col += uGlaze * 0.5 * ((0.35 + 0.65 * (n.y * 0.5 + 0.5)) + lit * 3. * (0.25 + 0.75 * ndl));
  // the film: a cool sheen at a glancing angle, broad slow streaks in it; close to the eye it breaks into thin bright
  // lines where the water stands on the ridges of the grain
  float f = 1. - max(dot(n, v), 0.);
  float f2 = f * f;
  float f5 = f2 * f2 * f;
  float fres = 0.035 + 0.965 * f5;
  float streak = wNoise(vec2(px * 0.055 - uTime * 0.06, pv * 0.9 + 3.)) * 0.65 + wNoise(vec2(px * 0.19 + uTime * 0.04, pv * 2.1 + 9.)) * 0.35;
  streak = smoothstep(0.2, 0.8, streak);
  float wetF = 1. - pale;
  float lines = smoothstep(0.38, 0.9, wNoise(vec2(px * 0.11 + 11., pv * 15.))) * (0.6 + 0.4 * smoothstep(0.3, 0.75, wNoise(vec2(px * 0.5 + 3., pv * 37.))));
  float lineK = mix(1., 0.5 + 1.35 * lines, 1. - smoothstep(12., 40., dist)) * (1. - capK);
  // (the highlights take the colour of the coins: warm on the black, never white scratches)
  vec3 warmS = uCoinCol / max(max(uCoinCol.r, uCoinCol.g), max(uCoinCol.b, 1e-3));
  vec3 sheenC = mix(uSheen, warmS * vec3(1., 0.9, 0.7) * dot(uSheen, vec3(0.4, 0.4, 0.2)) * 1.25, 0.6);
  col += sheenC * min(fres, 0.38) * (0.15 + 1.1 * streak * streak) * wetF * lineK * (1. - 0.6 * upright);
  // a few long warm reflections of the lit shed lie along the wet face and slide as the eye moves
  float longR = smoothstep(0.58, 0.84, wNoise(vec2(px * 0.04 + rr.x * 2.5 + 3.7, pv * 1.7 + 1.3))) * smoothstep(0.3, 0.7, wNoise(vec2(px * 0.21 - uTime * 0.05, pv * 0.6 + 7.)));
  col += warmS * vec3(1.0, 0.74, 0.42) * (0.045 + 0.3 * f2) * longR * wetF * (1. - capK) * (0.45 + 0.55 * lineK) * (1. + 1.6 * upright);
  // on edge it takes the shed's own warm shade: a soft glow in the wet, fuller toward its upper edge, broken only
  // by those few long reflections (never a field of fine pale lines)
  float hy = clamp((vWp.y - uFaceY) / 2.4 + 0.5, 0., 1.);
  col += uFillDown * vec3(1.0, 0.78, 0.5) * 0.085 * upright * wetF * (0.25 + 1.5 * hy * hy) * (0.45 + 0.55 * streak) * (0.7 + 0.3 * lineK);
  // seen from above (the hoist): the wet face gives back the pale light of the open sides, streaked along the grain
  col += uFillUp * 0.06 * max(n.y, 0.) * wetF * (0.35 + 1.1 * streak) * (0.4 + 0.6 * lineK);
  // the mirrored points of day and coins: small, sharp, sliding over the face as the eye moves
  // (the sand's coins come back dim and warm, broken into slivers by the grain: never as a second set of discs)
  col += wetF * (1. - capK) * uCoinCol * (accR * (0.15 + 0.5 * f5) + coinG * vec3(0.36, 0.3, 0.2) * (0.05 + 0.22 * f5) * (0.2 + 2.2 * lines)) * (0.75 + 0.5 * streak);
  // the ring of standing water round a glint drinks the sheen; then the glint itself, hot at its heart
  col *= 1. - 0.85 * rimK * wetF;
  vec3 warm = uCoinCol / max(max(uCoinCol.r, uCoinCol.g), max(uCoinCol.b, 1e-3));
  col += warm * vec3(1., 0.86, 0.6) * lit * uGloss * (0.66 + 1.4 * spot.z * spot.z) * (0.55 + 0.45 * wetF) * (0.8 + 0.4 * lg);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------- geometry helpers
function makeAcc() { return { pos: [], nrm: [], col: [], uv: [], idx: [], n: 0 }; }
function accGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nrm, 3));
  g.setAttribute('aCol', new THREE.Float32BufferAttribute(acc.col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(acc.uv, 2));
  g.setIndex(acc.n > 65535 ? new THREE.Uint32BufferAttribute(acc.idx, 1) : new THREE.Uint16BufferAttribute(acc.idx, 1));
  g.computeBoundingSphere();
  g.computeBoundingBox();
  return g;
}
// profile: list of { a, b, na, nb, v } going counter-clockwise in the (a, b) plane; faces are unshared (hard bevels)
function profRect(wa, wb, c) {
  const pts = [[wa - c, -wb], [wa, -wb + c], [wa, wb - c], [wa - c, wb], [-wa + c, wb], [-wa, wb - c], [-wa, -wb + c], [-wa + c, -wb]];
  const out = []; let v = 0;
  for (let j = 0; j < 8; j++) {
    const p = pts[j], q = pts[(j + 1) % 8];
    const ea = q[0] - p[0], eb = q[1] - p[1], l = Math.hypot(ea, eb) || 1;
    out.push({ a: p[0], b: p[1], na: eb / l, nb: -ea / l, v }, { a: q[0], b: q[1], na: eb / l, nb: -ea / l, v: v + l });
    v += l;
  }
  out.pairs = true;
  return out;
}
function profRound(r, n, squash = 1) {
  const out = [];
  for (let j = 0; j <= n; j++) { const t = (j / n) * Math.PI * 2; out.push({ a: Math.cos(t) * r, b: Math.sin(t) * r * squash, na: Math.cos(t), nb: Math.sin(t), v: t * r }); }
  out.pairs = false;
  return out;
}
const _T = new THREE.Vector3(), _A = new THREE.Vector3(), _B = new THREE.Vector3(), _R = new THREE.Vector3();
// frames along a polyline from a reference "up": A = across, B = the other axis (A x B = tangent)
function framesFrom(P, ref) {
  const A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    _T.copy(P[Math.min(i + 1, P.length - 1)]).sub(P[Math.max(i - 1, 0)]).normalize();
    const b = new THREE.Vector3().copy(ref).addScaledVector(_T, -ref.dot(_T));
    if (b.lengthSq() < 1e-6) b.set(1, 0, 0).addScaledVector(_T, -_T.x);
    b.normalize();
    const a = new THREE.Vector3().crossVectors(b, _T).normalize();
    A.push(a); B.push(b);
  }
  return { A, B };
}
// sweep a profile along P with per-ring axes; o: { sa(i), sb(i), col(i, j) -> [r,g,b] or [r,g,b], u0, caps, tw }
// o.nT (number or (i) -> number) leans the normals of ring i along the sweep (chamfers, domed heads); caps: 'end' closes
// the far end only; capFlag marks a cap as END GRAIN for the wood shader (its uv.x is the section's own plus 1000);
// capCol gives the cap its own colour.
function sweep(acc, P, A, B, prof, o = {}) {
  const m = prof.length, base = acc.n;
  let u = o.u0 || 0;
  const cc = [0, 0, 0];
  for (let i = 0; i < P.length; i++) {
    if (i > 0) u += P[i].distanceTo(P[i - 1]);
    const sa = o.sa ? o.sa(i) : 1, sb = o.sb ? o.sb(i) : 1, p = P[i], a = A[i], b = B[i];
    const nt = typeof o.nT === 'function' ? o.nT(i) : (o.nT || 0);
    if (nt) _T.crossVectors(a, b);
    for (let j = 0; j < m; j++) {
      const q = prof[j];
      acc.pos.push(p.x + a.x * q.a * sa + b.x * q.b * sb, p.y + a.y * q.a * sa + b.y * q.b * sb, p.z + a.z * q.a * sa + b.z * q.b * sb);
      let nx = a.x * q.na + b.x * q.nb, ny = a.y * q.na + b.y * q.nb, nz = a.z * q.na + b.z * q.nb;
      if (nt) { nx += _T.x * nt; ny += _T.y * nt; nz += _T.z * nt; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; }
      acc.nrm.push(nx, ny, nz);
      const c = typeof o.col === 'function' ? o.col(i, j, cc) : o.col;
      acc.col.push(c[0], c[1], c[2]);
      acc.uv.push(u, q.v + (o.v0 || 0));
    }
  }
  const step = prof.pairs ? 2 : 1, lim = prof.pairs ? m : m - 1;
  for (let i = 0; i < P.length - 1; i++) {
    for (let j = 0; j < lim; j += step) {
      const v00 = base + i * m + j, v01 = v00 + 1, v10 = v00 + m, v11 = v10 + 1;
      acc.idx.push(v00, v01, v10, v01, v11, v10);
    }
  }
  acc.n += P.length * m;
  if (o.caps !== false) {
    for (let e = o.caps === 'end' ? 1 : 0; e < 2; e++) {
      const i = e ? P.length - 1 : 0, p = P[i], a = A[i], b = B[i], sa = o.sa ? o.sa(i) : 1, sb = o.sb ? o.sb(i) : 1;
      _T.crossVectors(a, b).multiplyScalar(e ? 1 : -1);
      const c = o.capCol || (typeof o.col === 'function' ? o.col(i, 0, cc) : o.col), k = o.capCol ? 1 : o.capTone ?? 1.25, fl = o.capFlag ? 1000 : 0;
      const cb = acc.n; let cnt = 0;
      for (let j = 0; j < m; j += step) {
        const q = prof[j];
        acc.pos.push(p.x + a.x * q.a * sa + b.x * q.b * sb, p.y + a.y * q.a * sa + b.y * q.b * sb, p.z + a.z * q.a * sa + b.z * q.b * sb);
        acc.nrm.push(_T.x, _T.y, _T.z); acc.col.push(c[0] * k, c[1] * k, c[2] * k); acc.uv.push(q.a * sa * 3 + fl, q.b * sb * 3); cnt++;
      }
      for (let j = 1; j < cnt - 1; j++) { if (e) acc.idx.push(cb, cb + j, cb + j + 1); else acc.idx.push(cb, cb + j + 1, cb + j); }
      acc.n += cnt;
    }
  }
}
// a chamfered beam between two points; up = rough direction of its "b" axis
function beam(acc, p0, p1, wa, wb, c, col, up, o = {}) {
  const P = [p0, p1], f = framesFrom(P, up || _R.set(0, 1, 0));
  sweep(acc, P, f.A, f.B, profRect(wa, wb, c), { col, u0: o.u0 || 0, caps: o.caps, capTone: o.capTone });
}
// a round bar (rope, bamboo, peg) along a polyline
function bar(acc, P, r, sides, col, o = {}) {
  const f = framesFrom(P, o.up || _R.set(0.13, 1, 0.21));
  sweep(acc, P, f.A, f.B, profRound(r, sides), { col, sa: o.taper, sb: o.taper, u0: o.u0 || 0, caps: o.caps, nT: o.nT, capTone: o.capTone, capFlag: o.capFlag });
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// A sleeve of tight rattan turns round a timber: ONE band that follows the timber's own section (half-sizes ha along z,
// hb along bd; the loop lies square to the timber), w wide along it, lens-shaped so it lies only a little proud at its
// middle and dies into the wood at its edges, corners eased. uv.y runs across the band, `turns` to the metre.
function sleeve(acc, c, bd, ha, hb, w, thick, col, turns = 4, u0 = 0) {
  const r = Math.min(ha, hb) * 0.34, cs = [[ha - r, -hb], [ha, -hb + r], [ha, hb - r], [ha - r, hb], [-ha + r, hb], [-ha, hb - r], [-ha, -hb + r], [-ha + r, -hb], [ha - r, -hb]];
  const P = cs.map(([sz, sb]) => V(c.x + bd.x * sb, c.y + bd.y * sb, c.z + sz)), A = [], B = [], n = P.length - 1;
  for (let k = 0; k <= n; k++) {
    const kk = k % n, [sz, sb] = cs[kk], az = Math.pow(Math.abs(sz) / ha, 3) * Math.sign(sz), ab = Math.pow(Math.abs(sb) / hb, 3) * Math.sign(sb);
    const a = V(bd.x * ab, bd.y * ab, az + bd.z * ab).normalize();
    _T.copy(P[(kk + 1) % n]).sub(P[(kk + n - 1) % n]).normalize();
    A.push(a); B.push(new THREE.Vector3().crossVectors(_T, a).normalize());
  }
  const prof = [], m = 8;
  for (let j = 0; j <= m; j++) { const t = (j / m) * Math.PI * 2; prof.push({ a: Math.cos(t), b: Math.sin(t), na: Math.cos(t) * 0.8 + 0.2, nb: Math.sin(t) * 0.75, v: Math.sin(t) * w * 0.5 * turns }); }
  prof.pairs = false;
  sweep(acc, P, A, B, prof, { sa: () => thick, sb: () => w * 0.5, col, caps: false, u0 });
}
function hexLin(h) { const c = new THREE.Color(h); return [c.r, c.g, c.b]; }
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mulC = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

function makeWood(shared, o = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: WOOD_VERT, fragmentShader: WOOD_FRAG, fog: true, side: o.side ?? THREE.FrontSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared,
      uWet: { value: o.wet || 0 }, uScallop: { value: o.scallop ?? 1 }, uSlide: { value: 0 }, uWrap: { value: o.wrap || 0 }, uNode: { value: o.node || 0 }, uGrainK: { value: o.grainK ?? 1 }, uTwist: { value: o.twist || 0 }, uBend: { value: 1 }, uBelly: { value: 0 }, uBendOn: { value: 0 } },
  });
}

// ---------------------------------------------------------------- the hull form
const KEEL_Y = 6.7;                       // centreline of the floor timbers where they cross the keel
function halfB(z) {                       // inner half-breadth at y 34
  const w = z > -220 ? clamp((z + 220) / 160, 0, 1.3) : clamp((-220 - z) / 165, 0, 1.3);
  return z > -220 ? 37 - 17 * Math.pow(w, 2.1) : 37 - 20 * Math.pow(w, 2.1);
}
function sheerY(z) {
  const w = z > -220 ? clamp((z + 220) / 160, 0, 1.3) : clamp((-220 - z) / 165, 0, 1.3);
  return z > -220 ? 64 + 12 * w * w : 64 + 14 * w * w;
}
// centreline of a starboard rib at z: dense list of [x, y] from the keel to the head (top = sheer + ext)
function sectionCurve(z, ext = 0, wob = null) {
  const w = z > -220 ? clamp((z + 220) / 160, 0, 1) : clamp((-220 - z) / 165, 0, 1);
  const Bc = halfB(z) + RIB_MOULD * 0.5, e = 2 / lerp(2.7, 1.45, w * w), top = sheerY(z) + ext;
  const flare = lerp(-1.6, 3.2, w), out = [];
  const M1 = 40, M2 = 22;
  for (let k = 0; k <= M1; k++) {
    const th = (k / M1) * Math.PI * 0.5;
    const x = Bc * Math.pow(Math.sin(th), e), y = KEEL_Y + (34 - KEEL_Y) * (1 - Math.pow(Math.cos(th), e));
    out.push([x, y]);
  }
  for (let k = 1; k <= M2; k++) {
    const t = k / M2, y = 34 + (top - 34) * t, tt = (y - 34) / (sheerY(z) - 34);
    out.push([Bc + flare * tt * tt, y]);
  }
  if (wob) for (let k = 3; k < out.length; k++) { const s = k / out.length; out[k][0] += wob.a * Math.sin(s * wob.f + wob.p) * Math.min(1, (k - 3) / 6); }
  return out;
}
// inner half-breadth (to the inside face of the ribs) at height y, for any z in the ribbed length
function halfBreadthAt(z, y) {
  const c = sectionCurve(z, 8);
  for (let k = c.length - 1; k > 0; k--) {
    if ((c[k - 1][1] - y) * (c[k][1] - y) <= 0 && c[k][1] !== c[k - 1][1]) {
      const t = (y - c[k - 1][1]) / (c[k][1] - c[k - 1][1]);
      const dx = c[k][0] - c[k - 1][0], dy = c[k][1] - c[k - 1][1], l = Math.hypot(dx, dy) || 1;
      return lerp(c[k - 1][0], c[k][0], t) - (RIB_MOULD * 0.5) * Math.abs(dy / l) - (RIB_MOULD * 0.5) * 0.0;
    }
  }
  return halfB(z);
}
// resample a dense [x,y] list between weighted params w0..w1 into n+1 Vector3 at depth z, mirrored by side
function resample(dense, cum, w0, w1, n, side, z) {
  const P = [], tot = cum[cum.length - 1];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const target = lerp(w0, w1, i / n) * tot;
    while (k < cum.length - 2 && cum[k + 1] < target) k++;
    const t = clamp((target - cum[k]) / Math.max(cum[k + 1] - cum[k], 1e-6), 0, 1);
    P.push(V(side * lerp(dense[k][0], dense[k + 1][0], t), lerp(dense[k][1], dense[k + 1][1], t), z));
  }
  return P;
}
function weights(dense) {
  const cum = [0];
  for (let k = 1; k < dense.length; k++) {
    const dx = dense[k][0] - dense[k - 1][0], dy = dense[k][1] - dense[k - 1][1];
    let turn = 0;
    if (k < dense.length - 1) {
      const a0 = Math.atan2(dy, dx), a1 = Math.atan2(dense[k + 1][1] - dense[k][1], dense[k + 1][0] - dense[k][0]);
      turn = Math.abs(a1 - a0);
    }
    cum.push(cum[k - 1] + Math.hypot(dx, dy) + 9 * turn);
  }
  return cum;
}
const Z_AXIS = new THREE.Vector3(0, 0, 1);
function ribFrames(P) {                   // A = along the keel (sided), B = in the rib's own plane (moulded)
  const A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    _T.copy(P[Math.min(i + 1, P.length - 1)]).sub(P[Math.max(i - 1, 0)]).normalize();
    A.push(Z_AXIS); B.push(new THREE.Vector3().crossVectors(_T, Z_AXIS).normalize());
  }
  return { A, B };
}

// ---------------------------------------------------------------- ribs
async function buildRibs(H) {
  const { rng, C, group, mats } = H;
  H.headLash = makeAcc();
  const CHUNKS = 5, accs = [];
  for (let c = 0; c < CHUNKS; c++) accs.push(makeAcc());
  const nNew0 = Math.max(rng.int(5, 11), 10), nNew = Math.max(H.newRibs || 0, nNew0), teak = H.teak;     // the plank's berth is always on new ribs
  const prof = profRect(0.55, RIB_MOULD * 0.5, 0.2);
  H.ribs = [];
  for (let i = 0; i < N_RIBS; i++) {
    const z = RIB_Z0 - RIB_DZ * i, acc = accs[Math.min(CHUNKS - 1, Math.floor(i / (N_RIBS / CHUNKS)))];
    const isNew = i >= N_RIBS - nNew;
    const pairTone = rng.range(0.82, 1.18);
    const info = { z, dense: [], ext: [] };
    for (let s = 0; s < 2; s++) {
      const side = s ? 1 : -1;
      const ext = rng.chance(0.14) ? rng.range(-9, -3) : rng.range(0.5, 6.5);
      const wob = { a: rng.range(0.1, 0.42), f: rng.range(5, 11), p: rng.range(0, 6.28) };
      if (i >= N_RIBS - 10 && side < 0) wob.a *= 0.35;
      const dense = sectionCurve(z, ext, wob), cum = weights(dense);
      info.dense[s] = dense; info.ext[s] = ext;
      const f1 = rng.range(0.25, 0.33) + (i & 1) * 0.05, ov = 0.034; let f2 = rng.range(0.6, 0.68) - (i & 1) * 0.05;
      const rankS = i >= N_RIBS - 10 && side < 0;
      if (rankS) {
        // the upper scarf of these ribs sits just above the eye as it flies the berth (y 35.4 to 38.4), not up under the sheer
        const yS = 35.4 + 1.5 * ((i * 5) % 3); let ks = 1; while (ks < dense.length - 1 && dense[ks][1] < yS) ks++;
        f2 = Math.max(cum[ks] / cum[cum.length - 1], f1 + 0.14);
        (H.rankScarf || (H.rankScarf = [])).push({ z, x: dense[ks][0], y: dense[ks][1] });
      }
      const cuts = [[0, f1 + ov, 6], [f1 - ov, f2 + ov, 8], [f2 - ov, 1, 8]];
      const flip = (i + s) & 1 ? 1 : -1;
      const piecePale = [false, false, false];
      for (let pc = 0; pc < 3; pc++) {
        const [w0, w1, n] = cuts[pc];
        const P = resample(dense, cum, w0, w1, n, side, z + (pc === 1 ? -0.46 : 0.46) * flip * (i >= N_RIBS - 10 && side < 0 ? 0.6 : 1));
        const f = ribFrames(P);
        let pale = isNew ? rng.chance(0.85) : rng.chance(teak ? 0.2 : 0.045);
        if (teak) pale = !pale;
        // the rank the plank is bent to (port side, the last ten): new timber every one, close in tone
        const rank = i >= N_RIBS - 10 && side < 0;
        if (rank) pale = true;
        // opts.paleRibs: the whole hull stands in pale new timber (one length in nine an older, browner piece), the
        // newest pairs at the bow the palest; nothing here is drawn from the random stream
        const ph = Math.abs(Math.sin(i * 12.9898 + s * 78.233 + pc * 37.719) * 43758.5453) % 1;
        if (H.paleRibs) pale = true;
        piecePale[pc] = pale;
        const tone = rank ? lerp(1.12, pairTone * rng.range(0.85, 1.15), 0.3) : pairTone * rng.range(0.85, 1.15);
        const mixR = rng();
        const older = H.paleRibs && !isNew && !rank && ph < 0.11;
        // by day: pale new teak is a pale, dry yellow (so the shade on it can be brown and the fills can colour it),
        // dark ironwood a step lifted from black (so its flanks keep their brown and its inner faces take the fills)
        const base = older ? mulC(mixC(C.iron, C.newWood, 0.62), tone * 0.95)
          : pale ? mulC(mixC(C.newWood, C.pale, H.paleRibs ? 0.54 + 0.3 * mixR : mixR * 0.3), tone * (H.paleRibs ? (isNew || rank ? 0.88 : 0.76 + 0.08 * ph) : teak && !isNew && !rank ? 0.64 : H.day ? 0.84 : 0.76))
          : mulC(mixC(C.iron, C.ash, mixR * 0.22), tone * (H.day ? 1.62 : 1));
        const mould = pc === 0 ? 1 : pc === 1 ? 0.93 : 0.86, tip = pc === 2 ? 0.8 : 1;
        sweep(acc, P, f.A, f.B, prof, {
          sb: (j) => mould * (pc === 2 ? lerp(1, tip, j / n) : 1), u0: rng.range(0, 40), v0: rng.range(0, 9), capTone: pale ? 1.15 : 2.1, capFlag: true,
          col: (j, q, cc) => { const k = 0.9 + 0.2 * Math.sin(j * 1.7 + i + pc * 2.1); cc[0] = base[0] * k; cc[1] = base[1] * k; cc[2] = base[2] * k; return cc; },
        });
        if (pc === 2) {
          // THE HEAD of the rib: worked timber, not a sawn-off box. Most are adzed to a blunt point, four chamfers
          // round a small flat of pale end grain; about one in four is cut to a step, half its moulding standing on
          // as a tongue for the next futtock; and under most heads a sleeve of rattan binds the timber against
          // splitting. (Nothing here is drawn from the build's random stream: each head's own number comes from its
          // place.)
          const e = P.length - 1, pe = P[e], a = f.A[e], b = f.B[e], tt = new THREE.Vector3().crossVectors(a, b).normalize();
          const hh = Math.abs(Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1, h2 = (hh * 7.31) % 1, h3 = (hh * 23.7) % 1, mEnd = mould * tip;
          const endC = mulC(mixC(mulC(base, pale ? 1.25 : 2.6), C.pale, pale ? 0.3 : 0.55), 0.85 + 0.3 * h3), flank = mixC(mulC(base, 1.25), C.newWood, pale ? 0.1 : 0.3);
          if (hh < 0.26) {
            const sd = h2 < 0.5 ? 1 : -1, hg = 1.0 + 1.5 * h3, hb2 = RIB_MOULD * 0.25 * mEnd;
            const c0 = pe.clone().addScaledVector(b, sd * hb2), c1 = c0.clone().addScaledVector(tt, hg * 0.82), c2 = c0.clone().addScaledVector(tt, hg);
            sweep(acc, [c0, c1, c2], [a, a, a], [b, b, b], profRect(0.55, hb2, 0.14), { col: flank, u0: 3 + hh * 30, caps: 'end', capFlag: true, capCol: endC,
              sa: (j) => (j === 2 ? 0.78 : 1), sb: (j) => (j === 2 ? 0.78 : 1), nT: (j) => (j ? 0.9 : 0) });
          } else {
            const hg = 0.45 + 0.45 * h3, kq = 0.6 + 0.14 * h2;
            sweep(acc, [pe, pe.clone().addScaledVector(tt, hg)], [a, a], [b, b], prof, { col: flank, u0: 3 + hh * 30, caps: 'end', capFlag: true, capCol: endC,
              sa: (j) => (j ? kq : 1), sb: (j) => mEnd * (j ? kq : 1), nT: 0.9 });
          }
          if (h2 > 0.3) {
            const dn = 1.5 + 1.6 * h3, cB = pe.clone().addScaledVector(tt, -dn), wS = 0.75 + 0.7 * hh;
            sleeve(H.headLash, cB, b, 0.56, RIB_MOULD * 0.5 * mEnd + 0.01, wS, 0.06, mulC(mixC(C.rattan, C.ash, 0.15 + 0.3 * h3), 0.5 + 0.3 * h2), 2.2, i * 3.1 + s);
          }
        }
      }
      // trenails through each scarf
      for (let q = 0; q < 2; q++) {
        const wj = q ? f2 : f1;
        for (let m = 0; m < 2; m++) {
          const p = resample(dense, cum, wj + (m ? 0.018 : -0.018), wj + 0.05, 1, side, z)[0];
          if (side < 0 && i >= 50) {
            // (the ribs the eye passes closest: round, seated on the timber's face, each end spread by the mallet into a
            // low smooth dome with one split across it; dark heartwood in pale new timber, pale in the old dark ribs)
            const inPale = piecePale[q] || piecePale[q + 1], tc = inPale ? mulC(mixC(C.iron, C.newWood, 0.22), 1.5) : mulC(mixC(C.peg, C.iron, 0.4), 0.9);
            const zf = 0.55 + 0.46 * (i >= N_RIBS - 10 ? 0.6 : 1);
            bar(acc, [-zf - 0.17, -zf - 0.15, -zf - 0.1, -zf - 0.03, -zf, zf, zf + 0.03, zf + 0.1, zf + 0.15, zf + 0.17].map((dz) => V(p.x, p.y, z + dz)), 1, 10,
              (j, q2, cc) => { const e = j < 5 ? j : 9 - j, k = e === 4 ? 0.5 : (q2 === 3 && e < 3 ? 0.45 : [1.05, 1.0, 0.9, 0.62][e]); cc[0] = tc[0] * k; cc[1] = tc[1] * k; cc[2] = tc[2] * k; return cc; },
              { up: _R.set(0, 1, 0), u0: 1000, capFlag: true, taper: (j) => [0.07, 0.16, 0.23, 0.22, 0.15, 0.15, 0.22, 0.23, 0.16, 0.07][j], nT: (j) => [-2.4, -1.2, -0.4, 0.6, 0, 0, -0.6, 0.4, 1.2, 2.4][j], capTone: 1 });
          } else bar(acc, [V(p.x, p.y, z - 1.35), V(p.x, p.y, z + 1.35)], 1, 5, C.peg, { up: _R.set(0, 1, 0), taper: () => 0.2 });
        }
        if (rankS && q) {
          // dark ironwood trenails driven through both futtocks of the scarf: small round domes seated on the face,
          // slightly mushroomed, one split across each, the shank darker
          const dk = mulC(mixC(C.iron, C.newWood, 0.16), 1.45), zf = 0.55 + 0.46 * 0.6;
          for (let m = 0; m < 2; m++) {
            const p = resample(dense, cum, wj + (m ? 0.0118 : -0.0118), wj + 0.05, 1, side, z)[0], zo = (m - 0.5) * 0.1;
            bar(acc, [-zf - 0.22, -zf - 0.2, -zf - 0.14, -zf - 0.04, -zf, zf, zf + 0.04, zf + 0.14, zf + 0.2, zf + 0.22].map((dz) => V(p.x, p.y, z + dz + zo)), 1, 12,
              (j, q2, cc) => { const e = j < 5 ? j : 9 - j, k = e === 4 ? 0.5 : (q2 === 4 + m * 5 && e < 3 ? 0.42 : [1.08, 1.0, 0.88, 0.6][e]); cc[0] = dk[0] * k; cc[1] = dk[1] * k; cc[2] = dk[2] * k; return cc; },
              { up: _R.set(0, 1, 0), u0: 1000, capFlag: true, taper: (j) => [0.09, 0.22, 0.32, 0.31, 0.2, 0.2, 0.31, 0.32, 0.22, 0.09][j], nT: (j) => [-2.4, -1.2, -0.4, 0.6, 0, 0, -0.6, 0.4, 1.2, 2.4][j], capTone: 1 });
          }
        }
      }
    }
    H.ribs.push(info);
    if ((i & 1) === 1) await H.ctx.yield();   // a pair of ribs per step
  }
  for (let c = 0; c < CHUNKS; c++) {
    const m = new THREE.Mesh(accGeometry(accs[c]), mats.wood);
    m.name = 'ribs' + c; group.add(m);
    await H.ctx.yield();
  }
}

// ---------------------------------------------------------------- backbone: keel, keelson, sternpost, counter, stem
const STERN_RAKE = 0.185, STERN_HALF = 1.4;      // (the sternpost: 2.8 m sided, a third narrower than the keel it stands on)
const ROPE_X0 = 6, ROPE_X1 = -6;          // the ridge rope's x at the stern tripod (z 100) and at the bow tripod (z -420)
const RIDE = { left: 4, down: 5, ahead: 10 };          // where the plank's centre rides from the eye (hero.ride; the world may change it)
function stemPoint(t, out = new THREE.Vector3()) {      // t 0..1 from the foot (0,0,-430) through (0,34,-446) to the head (0,95,-470)
  const y = 95 * t, s = y / 95;
  const z = -430 - 40 * s - 22.5 * s * (1 - s);           // passes z = -446.. at y 34 (s = 0.358): -430 -14.3 -5.2 = -449.5, close to the brief
  return out.set(0, y, z + 3.4 * Math.sin(s * Math.PI));  // nudged aft so it meets (0,34,-446)
}
async function buildBackbone(H) {
  const { rng, C, group, mats } = H;
  const acc = makeAcc(), UP = V(0, 1, 0), ZV = V(0, 0, 1), XV = V(1, 0, 0);
  // building blocks under the keel
  for (let z = -6; z > -428; z -= rng.range(13, 17)) {
    const t = rng.range(0.8, 1.15), c0 = mulC(mixC(C.iron, C.ash, 0.45), t);
    beam(acc, V(-2.6, 0.7, z), V(2.6, 0.7, z), 0.8, 0.7, 0.14, c0, ZV, { u0: rng.range(0, 30) });
    beam(acc, V(-1.1, 2.0, z - 1.3), V(-1.1, 2.0, z + 1.3), 0.75, 0.6, 0.14, mulC(c0, 1.15), UP, { u0: rng.range(0, 30) });
    beam(acc, V(1.1, 2.0, z - 1.3), V(1.1, 2.0, z + 1.3), 0.75, 0.6, 0.14, mulC(c0, 0.9), UP, { u0: rng.range(0, 30) });
  }
  // keel (three scarfed lengths) and keelson (five), each length its own tone
  const run = (z0, z1, n, y, wa, wb, colA) => {
    const L = (z1 - z0) / n;
    for (let k = 0; k < n; k++) {
      const a = z0 + L * k + (k ? 0.12 : 0), b = z0 + L * (k + 1) - (k < n - 1 ? 0.12 : 0), P = [];
      for (let j = 0; j <= 4; j++) P.push(V(0, y, lerp(a, b, j / 4)));
      const tone = rng.range(0.8, 1.2), f = { A: P.map(() => XV), B: P.map(() => UP) };
      // A x B must equal the tangent (-z): x cross y = +z, so run the points bow to stern
      P.reverse();
      sweep(acc, P, f.A, f.B, profRect(wa * rng.range(0.96, 1.04), wb, 0.22), { col: (j, q, cc) => { const m = tone * (0.92 + 0.16 * Math.sin(j * 2.3 + k)); cc[0] = colA[0] * m; cc[1] = colA[1] * m; cc[2] = colA[2] * m; return cc; }, u0: rng.range(0, 50), capTone: 1.8 });
    }
  };
  run(2, -431, 3, 4.0, 1.15, 1.4, C.iron);
  run(-50, -394, 5, 9.0, 1.25, 1.0, mixC(C.iron, C.newWood, 0.18));
  // sternpost, raking aft, with its knee on the keel
  const post = (z0, y0, y1, half, col, n = 7, tip = 0.82, uo = null) => {
    const P = [];
    for (let j = 0; j <= n; j++) { const y = lerp(y0, y1, j / n); P.push(V(0, y, z0 + STERN_RAKE * (y - y0))); }
    const f = { A: P.map(() => XV), B: [] };
    for (let j = 0; j <= n; j++) { _T.copy(P[Math.min(j + 1, n)]).sub(P[Math.max(j - 1, 0)]).normalize(); f.B.push(new THREE.Vector3().crossVectors(_T, XV).normalize()); }
    sweep(acc, P, f.A, f.B, profRect(half, half * 1.08, 0.32), { sa: (j) => lerp(1, tip, j / n), sb: (j) => lerp(1, tip, j / n), u0: uo ?? rng.range(0, 30), capTone: uo === null ? 2.2 : 1,
      col: (j, q, cc) => { const m = 0.9 + 0.2 * Math.sin(j * 1.9 + z0); cc[0] = col[0] * m; cc[1] = col[1] * m; cc[2] = col[2] * m; return cc; } });
  };
  const blackK = H.day ? 1.3 : H.teak ? 0.56 : 0.86;      // (black ironwood. In rain and by night near-black as ever (C.iron is a lighter brown where the ribs are teak). By day it takes four fifths of the day lift the ribs' ironwood takes (1.62), so its faces stand just clear of black in the shade and it is still the black upright from astern)
  post(0, 2.6, 72, STERN_HALF, mulC(C.iron, blackK));
  // the builders' colours painted round the sternpost at eye height and round the head of the stem: red, white, blue
  const PAINT = [[0.6, 0.04, 0.03], [0.8, 0.77, 0.68], [0.03, 0.13, 0.55]];
  for (let b = 0; b < 3; b++) { const y0 = 33.2 + b * 2.3, hf = STERN_HALF * lerp(1, 0.82, (y0 - 2.6) / 69.4) + 0.09; post(STERN_RAKE * (y0 - 2.6), y0, y0 + 2.2, hf, PAINT[b], 1, 1, 7 + b * 3); }
  {
    const P = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8, a = t * Math.PI * 0.5; P.push(V(0, 6.6 + 24 * (1 - Math.cos(a)) , -26 + 26.6 * Math.sin(a) + STERN_RAKE * 24 * (1 - Math.cos(a)) - 2.3 * t)); }
    const f = { A: P.map(() => XV), B: [] };
    for (let j = 0; j <= 8; j++) { _T.copy(P[Math.min(j + 1, 8)]).sub(P[Math.max(j - 1, 0)]).normalize(); f.B.push(new THREE.Vector3().crossVectors(_T, XV).normalize()); }
    sweep(acc, P, f.A, f.B, profRect(1.5, 1.3, 0.25), { col: mulC(mixC(C.iron, C.ash, 0.2), 1.1), sb: (j) => 1 + 0.5 * Math.sin((j / 8) * Math.PI), u0: 7, capTone: 1.9 });
  }
  // counter timbers: a fan of curved beams 40 m overhead, tied by an arch board
  const heads = [];
  for (let k = -2; k <= 2; k++) {
    const P = [], spread = k * 7.2;
    for (let j = 0; j <= 6; j++) { const t = j / 6; P.push(V(spread * (0.12 + 0.88 * Math.sin(t * 1.35)), 60 + 9 * t + 5 * t * t + Math.abs(k) * 0.8 * t, 9.5 + 34 * t - 5 * t * t)); }
    const f = framesFrom(P, UP);
    const col = mulC(k === 0 || rng.chance(0.3) ? mixC(C.newWood, C.iron, 0.25) : C.iron, rng.range(0.85, 1.15));
    sweep(acc, P, f.A, f.B, profRect(0.9, 1.25, 0.2), { col, sb: (j) => lerp(1.15, 0.7, j / 6), u0: rng.range(0, 30), capTone: 1.7 });
    heads.push(P[6].clone(), P[4].clone());
  }
  for (let r = 0; r < 2; r++) {
    const P = [];
    for (let k = 0; k < 5; k++) P.push(heads[k * 2 + r].clone().add(V(0, r ? -1.9 : 1.6, 0)));
    const f = framesFrom(P, UP);
    sweep(acc, P, f.A, f.B, profRect(r ? 0.6 : 0.75, 0.55, 0.15), { col: mulC(mixC(C.newWood, C.iron, r ? 0.6 : 0.1), 0.9), u0: 3 });
  }
  H.counter = { left: heads[2].clone(), right: heads[6].clone() };
  await H.ctx.yield();
  // stem and its apron
  for (let pass = 0; pass < 2; pass++) {
    const n = pass ? 7 : 14, P = [];
    for (let j = 0; j <= n; j++) {
      const t = pass ? lerp(0.07, 0.29, j / n) : lerp(0.028, 1, j / n);
      stemPoint(t, _T); P.push(V(0, _T.y, _T.z + (pass ? lerp(3.6, 2.5, j / n) : 0)));
    }
    if (pass) { P.unshift(V(0, 6.6, -402), V(0, 6.4, -414)); }
    const m = P.length - 1, f = { A: P.map(() => XV), B: [] };
    for (let j = 0; j <= m; j++) { _T.copy(P[Math.min(j + 1, m)]).sub(P[Math.max(j - 1, 0)]).normalize(); f.B.push(new THREE.Vector3().crossVectors(_T, XV).normalize()); }
    // the apron (pass 1) is the same dark ironwood as the stem and runs out to nothing against it, so the garland
    // above stays the brightest thing beside the ring
    const col = pass ? mulC(mixC(C.iron, C.newWood, 0.1), 0.95) : mulC(C.iron, 1.05);
    sweep(acc, P, f.A, f.B, profRect(pass ? 1.55 : 2.0, pass ? 1.5 : 2.3, pass ? 0.42 : 0.3), { u0: rng.range(0, 20), capTone: pass ? 1.15 : 2.0,
      sa: (j) => (pass ? lerp(1, 0.55, smoothstep(0.45, 1, j / m)) : lerp(1, 0.72, j / m)), sb: (j) => (pass ? lerp(0.9, 0.16, smoothstep(0.35, 1, j / m)) : lerp(1, 0.7, j / m)),
      col: (j, q, cc) => { const k = 0.88 + 0.24 * Math.sin(j * 1.3 + pass); cc[0] = col[0] * k; cc[1] = col[1] * k; cc[2] = col[2] * k; return cc; } });
  }
  // grey iron straps round the sternpost between its wooldings, where the eye passes it close to port
  for (const y0 of [15.4, 20.2, 31.0]) { const hf = STERN_HALF * lerp(1, 0.82, (y0 - 2.6) / 69.4) + 0.07; post(STERN_RAKE * (y0 - 2.6), y0, y0 + 0.75, hf, mulC(C.ash, 0.66), 1, 1, 3 + y0); }
  // trenails in stem and sternpost
  for (let k = 0; k < 9; k++) { stemPoint(0.1 + k * 0.045, _T); bar(acc, [V(-2.25, _T.y, _T.z + 1.6), V(2.25, _T.y, _T.z + 1.6)], 1, 5, C.peg, { taper: () => 0.24 }); }
  for (let k = 0; k < 6; k++) { const y = 9 + k * 4.2; bar(acc, [V(-STERN_HALF - 0.3, y, STERN_RAKE * y - 1.0), V(STERN_HALF + 0.3, y, STERN_RAKE * y - 1.0)], 1, 5, C.peg, { taper: () => 0.24 }); }
  // the rope slings that hang the rudder from the counter (static: they meet on its axis)
  const rh = V(0, 65.5, 16 + STERN_RAKE * 62.5);
  for (const e of [H.counter.left, H.counter.right]) {
    const P = [];
    for (let j = 0; j <= 5; j++) { const t = j / 5; P.push(V(lerp(rh.x, e.x, t), lerp(rh.y, e.y - 1, t) - 1.2 * Math.sin(t * Math.PI), lerp(rh.z, e.z, t))); }
    bar(acc, P, 0.24, 6, C.rope);
  }
  const mesh = new THREE.Mesh(accGeometry(acc), mats.wood); mesh.name = 'backbone'; group.add(mesh);
  await H.ctx.yield();

  // the rudder: post and planked blade, turning slowly on its own axis
  const ra = makeAcc(), rud = new THREE.Group(); rud.name = 'rudder';
  beam(ra, V(0, 0, 0), V(0, 62.5, 0), 1.15, 1.15, 0.34, mulC(C.iron, blackK * (H.day ? 0.78 : 1.08)), ZV, { u0: 4, capTone: 2.2 });
  let zc = 1.1;
  // (the blade is black ironwood like the post, each board its own near-black: with the sternpost it is the one black
  // upright of the first view; coins, the fire's glow, grey straps with pale studs and rope slings are what show on it)
  // (a leaf-shaped blade: its foot is cut away upward to the trailing edge as its head is, so from astern the sand
  // shows under the whole of it)
  const BLADE_FOOT = [3.0, 3.4, 5.6, 8.4, 10.6];
  for (let b = 0; b < 5; b++) {
    const wdt = [2.5, 2.4, 2.3, 2.1, 1.9][b], top = 22.4 - b * b * 0.5 - rng.range(0, 0.8), bot = BLADE_FOOT[b];
    const tone = rng.range(0.8, 1.2), col = mulC(b === 2 || rng.chance(0.25) ? mixC(C.iron, C.ash, 0.16) : C.iron, tone * blackK * (H.day ? 0.7 : 1.05));
    beam(ra, V(0, bot, zc + wdt * 0.5), V(0, top, zc + wdt * 0.5), wdt * 0.5 - 0.05, 0.55 - b * 0.05, 0.12, col, XV, { u0: rng.range(0, 30), capTone: 1.9 });
    zc += wdt;
  }
  // iron-dark straps across the boards, a row of pale studs along each; trenail heads down the boards between them
  for (const y of [5.4, 10.2, 15.6]) for (const sx of [-1, 1]) {
    const zEnd = y < 7 ? 5.9 : y < 13 ? 10.2 : zc - 4.4, drop = y < 13 && y > 7 ? 0.5 : 0.8;
    beam(ra, V(sx * 0.72, y, -0.6), V(sx * 0.66, y - drop, zEnd), 0.13, 0.42, 0.05, mulC(C.ash, 0.62), UP, { u0: y });
    for (let k = 0; k < 6; k++) { const t = (k + 0.5) / 6, zz = lerp(-0.6, zEnd, t), yy = y - drop * t; bar(ra, [V(sx * 0.6, yy, zz), V(sx * 0.98, yy, zz)], 1, 6, mulC(C.peg, 1.1), { up: UP, taper: (j) => (j ? 0.2 : 0.14) }); }
  }
  for (let b = 0; b < 5; b++) for (const y of [7.4, 12.9, 18.4]) {
    const zz = 1.1 + [1.25, 3.7, 6.05, 8.25, 10.25][b] + 0.5 * Math.sin(b * 2.1 + y), top = 22.4 - b * b * 0.5;
    if (y < top - 3 && y > BLADE_FOOT[b] + 1) bar(ra, [V(-0.7, y, zz), V(0.7, y, zz)], 1, 5, mixC(C.peg, C.iron, 0.25), { up: UP, taper: () => 0.15 });
  }
  // two rope slings round the blade, each with a tail (their own mesh in the rudder's frame, so they turn with it)
  const rr = makeAcc();
  for (const [y, dz] of [[13.3, 0], [18.9, -4.6]]) {
    const ze = zc + 0.3 + dz, P = [];
    for (const [sx, yy, zz] of [[1, 0, -1.45], [1, -0.5, ze * 0.5], [1, -1.2, ze], [0, -1.35, ze + 0.45], [-1, -1.2, ze], [-1, -0.5, ze * 0.5], [-1, 0, -1.45], [0, 0.1, -1.6], [1, 0, -1.45]]) P.push(V(sx * (zz < 0 ? 1.4 : 0.88), y + yy, zz));
    bar(rr, P, 0.2, 6, mulC(C.rope, 1.5), { up: UP, caps: false });
    bar(rr, [V(0.95, y - 0.3, ze * 0.3), V(1.15, y - 1.6, ze * 0.3 + 0.3), V(1.0, y - 4.2, ze * 0.3 + 0.1), V(1.1, y - 5.6, ze * 0.3 + 0.5)], 0.17, 6, mulC(C.rope, 1.4), { up: UP });
  }
  bar(ra, [V(0, 62.5, 0), V(0, 63.4, 0)], 1.5, 8, C.rope);
  const rm = new THREE.Mesh(accGeometry(ra), mats.wood); rud.add(rm);
  rud.add(new THREE.Mesh(accGeometry(rr), mats.rope(0.2, 3)));
  rud.position.set(0, 3, 16);
  H.rudder = rud; H.rudderRake = Math.atan(STERN_RAKE); rud.rotation.set(H.rudderRake, 0, 0);
  H.rudderPose = { yaw: -0.46 };          // hero.rudder: how far the blade lies over (radians, - to port); the world may turn it
  group.add(rud);
  await H.ctx.yield();
}

// ---------------------------------------------------------------- skin: bilge strakes, ribbands, cross-spalls, lashings
// point on the OUTSIDE of the fair hull (starboard) at height y on the upper branch: { x, y, nx, ny }
function outerAt(z, y) {
  const c = sectionCurve(z, 8);
  for (let k = c.length - 1; k > 0; k--) {
    if ((c[k - 1][1] - y) * (c[k][1] - y) <= 0 && c[k][1] !== c[k - 1][1]) {
      const t = (y - c[k - 1][1]) / (c[k][1] - c[k - 1][1]);
      const dx = c[k][0] - c[k - 1][0], dy = c[k][1] - c[k - 1][1], l = Math.hypot(dx, dy) || 1;
      const nx = dy / l, ny = -dx / l;
      return { x: lerp(c[k - 1][0], c[k][0], t) + nx * RIB_MOULD * 0.5, y: y + ny * RIB_MOULD * 0.5, nx, ny };
    }
  }
  return { x: halfB(z) + RIB_MOULD, y, nx: 1, ny: 0 };
}
const _q0 = new THREE.Vector3(), _q1 = new THREE.Vector3(), _q2 = new THREE.Vector3();
function quad(acc, a, b, c, d, n, col, u0, u1, v0, v1) {      // a-b along u at v0, d-c along u at v1; wound to face n
  _q0.subVectors(b, a); _q1.subVectors(d, a); _q2.crossVectors(_q0, _q1);
  const flip = _q2.dot(n) < 0, i = acc.n;
  acc.pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
  for (let k = 0; k < 4; k++) { acc.nrm.push(n.x, n.y, n.z); acc.col.push(col[0], col[1], col[2]); }
  acc.uv.push(u0, v0, u1, v0, u1, v1, u0, v1);
  if (flip) acc.idx.push(i, i + 2, i + 1, i, i + 3, i + 2); else acc.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  acc.n += 4;
}
async function buildSkin(H) {
  const { rng, C, group, mats } = H;
  // ---- bilge strakes: unshared quads per rib bay so plank butts stay crisp
  const pa = makeAcc(), NS = 12, GAP = 0.07;
  const stations = [];
  for (let i = -1; i <= N_RIBS; i++) {
    const z = RIB_Z0 - RIB_DZ * clamp(i, -0.45, N_RIBS - 0.55), c = sectionCurve(z, 0), arc = [0];
    let k14 = c.length - 1;
    for (let k = 1; k < c.length; k++) { arc.push(arc[k - 1] + Math.hypot(c[k][0] - c[k - 1][0], c[k][1] - c[k - 1][1])); if (c[k][1] >= 14.6 && k14 === c.length - 1) k14 = k; }
    const a0 = 1.6, a1 = arc[k14], edges = [];
    for (let s = 0; s <= NS; s++) {
      const target = lerp(a0, a1, s / NS); let k = 1; while (k < k14 && arc[k] < target) k++;
      const t = clamp((target - arc[k - 1]) / Math.max(arc[k] - arc[k - 1], 1e-5), 0, 1);
      const dx = c[k][0] - c[k - 1][0], dy = c[k][1] - c[k - 1][1], l = Math.hypot(dx, dy) || 1, nx = dy / l, ny = -dx / l, off = RIB_MOULD * 0.5 + 0.3;
      edges.push({ x: lerp(c[k - 1][0], c[k][0], t) + nx * off, y: lerp(c[k - 1][1], c[k][1], t) + ny * off, nx, ny, tx: dx / l, ty: dy / l });
    }
    stations.push({ z, edges });
  }
  await H.ctx.yield();
  for (let side = -1; side <= 1; side += 2) {
    for (let s = 0; s < NS; s++) {
      // the upper strakes are still going on: they stop short of the ends by a few bays
      const short = Math.max(0, s - (NS - 4));
      const i0 = short ? rng.int(2, 7) * short : 0, i1 = stations.length - 1 - (short ? rng.int(2, 8) * short : 0);
      let tone = rng.range(0.75, 1.2), butt = i0 + rng.int(5, 11), fresh = rng.chance(0.22 + 0.2 * short), uo = rng.range(0, 60);
      for (let i = i0; i < i1; i++) {
        if (i === butt) { tone = rng.range(0.75, 1.2); butt = i + rng.int(6, 12); fresh = rng.chance(0.22 + 0.2 * short); uo = rng.range(0, 60); }
        const A = stations[i], B = stations[i + 1], e0 = A.edges[s], e1 = A.edges[s + 1], f0 = B.edges[s], f1 = B.edges[s + 1];
        const col = mulC(fresh ? mixC(C.newWood, C.pale, 0.15) : mixC(C.iron, C.newWood, H.paleRibs ? 0.72 : 0.3), tone * (fresh ? 0.8 : 1));
        const n = _R.set(side * (e0.nx + e1.nx) * 0.5, (e0.ny + e1.ny) * 0.5, 0).normalize().clone();
        const zb = i === butt - 1 || i === i1 - 1 ? 0.06 : 0, za = i === i0 ? 0 : 0;
        quad(pa, V(side * (e0.x + e0.tx * GAP), e0.y + e0.ty * GAP, A.z - za), V(side * (f0.x + f0.tx * GAP), f0.y + f0.ty * GAP, B.z + zb),
          V(side * (f1.x - f1.tx * GAP), f1.y - f1.ty * GAP, B.z + zb), V(side * (e1.x - e1.tx * GAP), e1.y - e1.ty * GAP, A.z - za), n, col, uo - A.z, uo - B.z, s * 2.7, s * 2.7 + 2.4);
      }
    }
    await H.ctx.yield();
  }
  const planks = new THREE.Mesh(accGeometry(pa), mats.woodDouble); planks.name = 'strakes'; group.add(planks);

  // ---- ribbands (fair battens outside the ribs) and cross-spalls at the heads
  const acc = makeAcc(), la = makeAcc();
  const RB_Y = [21, 31.5, 42, 52];
  for (let side = -1; side <= 1; side += 2) {
    for (let r = 0; r < RB_Y.length; r++) {
      const P = [], A = [], B = [], yb = RB_Y[r] + rng.range(-1.2, 1.2);
      // (the port ribband at y 31.5 has been taken off abreast of the berth, where the plank is going on in its place)
      const jA = r === 3 ? rng.int(0, 3) : -1, jB = side < 0 && r === 1 ? 31 : 35 + (r === 3 ? -rng.int(0, 4) : 0);
      for (let j = jA; j <= jB; j++) {
        const z = Math.max(RIB_Z0 - RIB_DZ * (j * 2 + 0.0) + (j === -1 ? -3 : 0), RIB_Z0 - RIB_DZ * (N_RIBS - 1) - 2.2), o = outerAt(z, yb);
        P.push(V(side * (o.x + o.nx * 0.42), o.y + o.ny * 0.42, z));
        B.push(V(side * o.nx, o.ny, 0));
      }
      for (let j = 0; j < P.length; j++) { _T.copy(P[Math.min(j + 1, P.length - 1)]).sub(P[Math.max(j - 1, 0)]).normalize(); A.push(new THREE.Vector3().crossVectors(B[j], _T).normalize()); B[j].crossVectors(_T, A[j]).normalize(); }
      const tone = rng.range(0.8, 1.1), col = mulC(mixC(mixC(C.newWood, C.bamboo, rng.range(0.3, 0.7)), C.ash, 0.5), tone * 0.7);
      sweep(acc, P, A, B, profRect(0.68, 0.42, 0.1), { u0: rng.range(0, 40), capTone: 1.3, col: (j, q, cc) => { const k = 0.85 + 0.3 * Math.sin(j * 0.9 + r * 2 + side); cc[0] = col[0] * k; cc[1] = col[1] * k; cc[2] = col[2] * k; return cc; } });
    }
    await H.ctx.yield();
  }
  // lashings: a flat band of rattan round rib and ribband at every crossing
  const lash = (c, t, bdir, ha, hb, col, thick = 0.12, wide = 0.32, tgt = la) => {       // c centre, t rib tangent, bdir moulded axis, half-sizes along z and along bdir
    const P = [];
    for (let k = 0; k <= 4; k++) { const sz = [1, 1, -1, -1, 1][k], sb = [-1, 1, 1, -1, -1][k]; P.push(V(c.x + bdir.x * hb * sb, c.y + bdir.y * hb * sb, c.z + sz * ha)); }
    const f = framesFrom(P, t);
    sweep(tgt, P, f.A, f.B, profRound(1, 4), { sa: () => thick, sb: () => wide, col, caps: false, u0: c.z });
  };
  H.lash = lash; H.lashAcc = la;
  if (H.headLash) { const hl = H.headLash, o = la.n; for (const k of ['pos', 'nrm', 'col', 'uv']) for (let q = 0; q < hl[k].length; q++) la[k].push(hl[k][q]); for (let q = 0; q < hl.idx.length; q++) la.idx.push(hl.idx[q] + o); la.n += hl.n; }
  const nl = Math.max(0.5, H.detail);
  for (let i = 0; i < N_RIBS; i++) {
    const z = RIB_Z0 - RIB_DZ * i;
    for (let side = -1; side <= 1; side += 2) {
      for (let r = 0; r < RB_Y.length; r++) {
        if (nl < 1 && ((i + r) % 2) && r !== 1) continue;
        const o = outerAt(z, RB_Y[r]), tl = Math.hypot(o.ny, o.nx) || 1;
        const t = _T.set(-o.ny * side / tl, o.nx / tl, 0).clone(), bd = V(side * o.nx, o.ny, 0);
        const c = V(side * (o.x - o.nx * 0.9), o.y - o.ny * 0.9, z);
        const lc = mulC(mixC(C.rattan, C.ash, rng.range(0.1, 0.5)), rng.range(0.6, 0.95) * 0.78);
        if (side < 0 && r === 1 && i > 62) continue;
        // (port, forward, where the eye flies beside them: one rounded sleeve of turns; elsewhere the plain band)
        if (side < 0 && i >= 50) sleeve(la, c, bd, 1.16, 1.95, 0.72, 0.075, lc, 4, z + r);
        else lash(c, t, bd, 1.16, 1.95, lc);
      }
    }
    if ((i & 15) === 15) await H.ctx.yield();
  }
  // cross-spalls tying the heads
  for (let i = 1; i < N_RIBS; i += rng.int(3, 5)) {
    const R = H.ribs[i], top = Math.min(sheerY(R.z) + R.ext[0], sheerY(R.z) + R.ext[1]) - rng.range(1.5, 3.2), o = outerAt(R.z, top);
    const xin = o.x - o.nx * RIB_MOULD - 0.2 + 3.0, zz = R.z + 1.5 * ((i & 1) ? 1 : -1);
    const col = mulC(mixC(mixC(C.newWood, C.bamboo, rng.range(0.2, 0.6)), C.ash, 0.3), rng.range(0.6, 0.85));
    // (none where the plank and its slings come down through the heads on their way to the berth: the same draws, built into nothing)
    const off = H.spallSkip && R.z < H.spallSkip[0] && R.z > H.spallSkip[1];
    beam(off ? makeAcc() : acc, V(-xin, top, zz), V(xin, top + rng.range(-0.5, 0.5), zz), 0.42, 0.62, 0.1, col, V(0, 1, 0), { u0: rng.range(0, 30), capTone: 1.3 });
    for (const sx of [-1, 1]) lash(V(sx * (xin - 3.6), top, R.z + 0.75 * ((i & 1) ? 1 : -1)), V(0, 1, 0), V(sx, 0, 0), 1.75, 1.5, mulC(C.rattan, rng.range(0.7, 1)), 0.12, 0.32, off ? makeAcc() : la);
  }
  const rb = new THREE.Mesh(accGeometry(acc), mats.wood); rb.name = 'ribbands'; group.add(rb);
  await H.ctx.yield();
}

// ---------------------------------------------------------------- the vehicle: ridge rope, plank, slings, traveller, pegs, steam
// The steam is THREADS, not puffs: each instance is one thin ribbon (position.x = side -1/1, position.y = 0..1 along)
// that leaves the wet face, climbs, curls and thins out. Carried, the threads stream aft and up off the whole face;
// at the berth they rise from the glints that lie on it (two or three to a glint). A wisp travels up its thread and
// fades, so the steam is always rising. Every ribbon keeps at least a pixel and a half of width.
const STEAM_VERT = /* glsl */`
#include <fog_pars_vertex>
${LIGHT_GLSL}
${PLANK_COIN}
attribute vec4 aSeed;
uniform float uSteam;
uniform float uWisp;
uniform float uBend;
uniform float uBelly;
varying float vX;
varying float vA;
varying vec3 vWp;
varying float vLit;
vec3 hifThread(float t, vec3 wb, vec3 aft, vec3 nW, float len, float ph) {
  vec3 p = wb + nW * (0.04 + 0.35 * t * mix(0.4, 1., uWisp)) + aft * (t * len * mix(0.75, 0.05, uWisp));
  p.y += t * len * mix(0.55, 1., uWisp);
  // (carried, the threads lie back in long easy curls; at the berth they climb and curl tighter)
  float amp = (0.07 + 0.42 * t) * t * mix(1.1, 1., uWisp), fq = mix(0.55, 1., uWisp);
  p.x += amp * sin(t * 6.3 * fq + ph - uTime * 1.6);
  p.z += amp * cos(t * 4.9 * fq + ph * 1.7 - uTime * 1.25);
  p.y += amp * 0.5 * sin(t * 5.1 * fq + ph * 2.3 - uTime * 1.4);
  return p;
}
void main() {
  float t = position.y;
  float cyc = aSeed.x + uTime * (0.16 + 0.12 * aSeed.y);
  float life = fract(cyc), gen = floor(cyc);
  float x0 = mix(-19., 19.5, fract(aSeed.z + gen * 0.618 * (1. - uWisp)));
  float zAc = (aSeed.w - 0.5) * 2.0;
  // at the berth every thread rises from one of the glints that lie on the face (hifOwnSpot's own places)
  vec3 w0 = (modelMatrix * vec4(x0, 0.3, 0., 1.)).xyz;
  float sB0 = dot(w0.xz - uBerth.xy, uBerth.zw);
  vec4 own = hifOwnSpot(sB0);
  float zs = (modelMatrix * vec4(0., 0., 1., 0.)).y;
  // (a sheaf of fine threads to each glint, their feet spread over it and a little beyond)
  x0 += (own.x - sB0 + (aSeed.y - 0.5) * 0.9) * uWisp;
  zAc = mix(zAc, own.y * (zs < 0. ? -1. : 1.) + (aSeed.w - 0.5) * 0.4, uWisp);
  // it leaves the face where the board is (bent or not)
  float sB = clamp((x0 + 20.) / 40., 0., 1.);
  float yB = (1. - uBend) * 4.0 * sB * sB - uBelly * 4. * sB * (1. - sB);
  vec3 wb = (modelMatrix * vec4(x0, 0.27 + yB, zAc, 1.)).xyz;
  vec3 nW = normalize(mat3(modelMatrix) * vec3(0., 1., 0.));
  vec3 aft = -normalize(mat3(modelMatrix) * vec3(1., 0., 0.));
  float len = mix(2.6, 5.0, uWisp) * (0.6 + 0.8 * aSeed.y);
  float ph = aSeed.x * 40.;
  vec3 p0 = hifThread(t, wb, aft, nW, len, ph);
  vec3 p1 = hifThread(t + 0.03, wb, aft, nW, len, ph);
  vec4 mvPosition = viewMatrix * vec4(p0, 1.);
  vec3 tv = (viewMatrix * vec4(p1 - p0, 0.)).xyz;
  vec2 sd = vec2(-tv.y, tv.x);
  float sl = length(sd);
  sd = sl > 1e-5 ? sd / sl : vec2(1., 0.);
  float dist = -mvPosition.z;
  float hw = max((0.02 + 0.055 * t) * (0.7 + 0.6 * aSeed.w) * mix(1.6, 8. + 24. * t, uWisp), 0.0021 * dist * (1. + 1.2 * uWisp));
  mvPosition.xy += sd * position.x * hw;
  // a wisp climbs the thread and thins out as it goes
  float c = life * 1.5 - 0.2;
  float wisp = 1. - smoothstep(0.22, 0.5, abs(t - c));
  float thin = smoothstep(0., 0.07, t) * (1. - t) * (1. - 0.6 * t);
  // at the berth a thread is vapour, not a hair: brightest at its foot on the glint, gone within a few metres
  thin *= mix(1., 0.3 * (1. - 0.6 * t), uWisp);
  float shown = mix(0.8, own.w * step(fract(aSeed.x * 7.31 + aSeed.w * 3.7), 0.62), uWisp);
  vA = min(uSteam, mix(1.5, 4., uWisp)) * mix(1.9, 1., uWisp) * wisp * thin * shown * smoothstep(2.5, 7., dist) * (0.6 + 0.4 * aSeed.w);
  vLit = own.w * uWisp * (1. - 0.7 * t);
  vX = position.x;
  vWp = p0;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const STEAM_FRAG = /* glsl */`
#include <fog_pars_fragment>
${LIGHT_GLSL}
varying float vX;
varying float vA;
varying vec3 vWp;
varying float vLit;
void main() {
  float prof = 1. - vX * vX;
  prof *= prof;
  // lit from the pinhole rays it drifts through: a thread inside a coin's pencil is the brightest thing on the board
  float coin = max(max(hifCoin(vWp), 0.9 * hifCoin(vWp + vec3(1.7, 0., 2.3))), vLit);
  vec3 col = (uFillUp + uFillDown) * 0.34 + uCoinCol * coin * 0.2;
  gl_FragColor = vec4(col, min(vA * prof * (0.15 + 0.2 * coin), 0.42));
  #include <fog_fragment>
}
`;
// Drips: beads of water that gather under the board (along its lower arris once it stands on edge), hang a moment and
// fall: each a small bright bead drawn out a little by its fall, gone within a few metres, and faded out near the eye.
const DRIP_VERT = /* glsl */`
#include <fog_pars_vertex>
attribute vec4 aSeed;
uniform float uTime;
uniform float uDrip;
uniform float uWisp;
uniform float uBend;
uniform float uBelly;
varying vec2 vQ;
varying float vA;
varying vec3 vWp;
void main() {
  float cyc = aSeed.x + uTime * (0.5 + 0.45 * aSeed.y);
  float life = fract(cyc), gen = floor(cyc);
  float x0 = mix(-19.6, 19.6, fract(aSeed.z + gen * 0.618));
  float sB = clamp((x0 + 20.) / 40., 0., 1.);
  float yB = (1. - uBend) * 4.0 * sB * sB - uBelly * 4. * sB * (1. - sB);
  float zs = (modelMatrix * vec4(0., 0., 1., 0.)).y;
  vec3 lp = vec3(x0, mix(-0.27, (aSeed.w - 0.5) * 0.4, uWisp) + yB, mix((aSeed.w - 0.5) * 2.2, zs < 0. ? 1.22 : -1.22, uWisp));
  vec4 wp = modelMatrix * vec4(lp, 1.);
  float tf = max(life - 0.3, 0.) * 1.5;
  wp.y -= 0.06 * smoothstep(0., 0.3, life) + 7. * tf * tf;
  vec4 mvPosition = viewMatrix * wp;
  float dist = -mvPosition.z;
  float w = max(0.03 + 0.014 * aSeed.y, 0.0023 * dist);
  float lenK = w + clamp(tf * 0.3, 0., 0.2);
  vec2 upV = (viewMatrix * vec4(0., 1., 0., 0.)).xy;
  float ul = length(upV);
  upV = ul > 1e-4 ? upV / ul : vec2(0., 1.);
  mvPosition.xy += vec2(upV.y, -upV.x) * position.x * w + upV * position.y * lenK;
  vQ = position.xy;
  vA = uDrip * smoothstep(0., 0.25, life) * (1. - smoothstep(0.72, 1., life)) * smoothstep(3.5, 9., dist);
  vWp = wp.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const DRIP_FRAG = /* glsl */`
#include <fog_pars_fragment>
${LIGHT_GLSL}
varying vec2 vQ;
varying float vA;
varying vec3 vWp;
void main() {
  float a = vA * (1. - smoothstep(0.45, 1., abs(vQ.x))) * (1. - smoothstep(0.55, 1., abs(vQ.y)));
  // a bead holds the shed's light; one that falls through a pinhole's ray flashes
  vec3 col = (uFillUp + uFillDown) * 0.42 * (0.6 + 0.4 * vQ.y) + uCoinCol * hifCoin(vWp) * 0.3 + uGlaze * 6.;
  gl_FragColor = vec4(col, a * 0.85);
  #include <fog_fragment>
}
`;
function pathYAt(path, z) {
  for (let k = 0; k < path.length - 1; k++) {
    const a = path[k], b = path[k + 1];
    if (z <= a[2] && z >= b[2]) return lerp(a[1], b[1], smoothstep(0, 1, (a[2] - z) / Math.max(a[2] - b[2], 1e-4)));
  }
  return z > path[0][2] ? path[0][1] : path[path.length - 1][1];
}
async function buildVehicle(H) {
  const { rng, C, group, mats, shared } = H;
  const XV = V(1, 0, 0), UP = V(0, 1, 0), ZV = V(0, 0, 1);
  // ---- ridge rope, 18 m above the path, tripod to gantry; a strand twist is drawn by the wood grain
  const ra = makeAcc(), RP = [];
  // the rope is a list of [x, y, z] from stern to bow (z falling); between them it hangs a little
  const RQ = H.ropePts;
  const ropeAt = (z, c) => {
    let k = 0; while (k < RQ.length - 2 && z < RQ[k + 1][2]) k++;
    const a = RQ[k], b = RQ[k + 1], t = clamp((a[2] - z) / Math.max(a[2] - b[2], 1e-4), 0, 1);
    return lerp(a[c], b[c], t) - (c === 1 ? 1.6 * Math.sin(t * Math.PI) : 0);
  };
  H.ropeY = (z) => ropeAt(z, 1);
  H.ropeX = (z) => ropeAt(z, 0);
  for (let z = 100; z >= -420; z -= 10) RP.push(V(H.ropeX(z), H.ropeY(z), z));
  bar(ra, RP, 0.3, 6, mulC(C.rope, 0.62));
  const rope = new THREE.Mesh(accGeometry(ra), mats.rope(0.3, 4)); rope.name = 'ridgeRope'; group.add(rope);

  const carried = new THREE.Group(); carried.name = 'carried'; carried.visible = false; group.add(carried);
  const node = new THREE.Group(); node.name = 'plank'; carried.add(node);
  // ---- the plank: x along (+x forward), y through the thickness, z across; 80 segments so uBend curves it
  const pa = makeAcc(), PP = [];
  for (let j = 0; j <= 80; j++) PP.push(V(-20 + j * 0.5, 0, 0));
  const pcol = mulC(C.iron, 0.9), endc = mixC(C.iron, C.newWood, 0.6);
  rng.range(0, 60);                       // (a draw kept from the earlier build; uv.x is now metres from the plank's after end, for its own shader)
  sweep(pa, PP, PP.map(() => UP), PP.map(() => ZV), profRect(0.25, 1.2, 0.07), { u0: 0, capTone: 1, capFlag: true, capCol: pcol,
    sb: (j) => 1 - 0.035 * Math.pow(Math.abs(j - 40) / 40, 3),
    col: (j, q, cc) => { const k = 0.8 + 0.3 * Math.sin(j * 0.37 + 1.3) * Math.sin(j * 0.11) + (j % 80 === 0 ? 0.6 : 0); const e = j === 0 || j === 80 ? 1 : 0; cc[0] = lerp(pcol[0] * k, endc[0], e); cc[1] = lerp(pcol[1] * k, endc[1], e); cc[2] = lerp(pcol[2] * k, endc[2], e); return cc; } });
  const plank = new THREE.Mesh(accGeometry(pa), mats.plank); plank.frustumCulled = false; node.add(plank);
  // ---- nine pegs started in their holes (instanced so each can be knocked home)
  const ga = makeAcc();
  // trenails TURNED on the pole lathe: a point, a long dark shank, a bead and a groove under the head, and a head like
  // a low button: a straight rim, a crisp chamfer that catches the light, and a shallow dome with the tool's rings
  // on it round the dark prick of the lathe centre. Warm red-brown heartwood, not grey.
  {
    const heart = mixC(C.iron, [0.39, 0.14, 0.05], 0.62), shank = mulC(heart, 0.42), bead = mulC(heart, 0.85), groove = mulC(heart, 0.3);
    const rimC = mulC(heart, 1.12), edgeC = mulC(mixC(heart, C.newWood, 0.55), 1.5), top = mulC(heart, 0.8), dot = mulC(heart, 0.25);
    //            point  shank         bead               groove      under  rim         chamfer     dome: tool rings          centre
    // (driven home, everything from the bead up stands clear of the plank's face)
    const py = [-1.5, -1.18, 1.14, 1.2, 1.25, 1.3, 1.32, 1.34, 1.36, 1.39, 1.42, 1.42, 1.52, 1.52, 1.57, 1.57, 1.6, 1.6, 1.618, 1.618, 1.63, 1.63];
    const pr = [0.08, 0.2, 0.2, 0.24, 0.27, 0.24, 0.2, 0.185, 0.2, 0.31, 0.36, 0.36, 0.36, 0.36, 0.31, 0.31, 0.225, 0.225, 0.135, 0.135, 0.05, 0.05];
    const pt = [-0.3, 0, 0, -0.9, 0, 0.9, 0.5, 0, -0.9, -1.6, -0.7, 0, 0, 1, 1, 3, 3, 4, 4, 5, 5, 6];
    const pc = [shank, shank, shank, bead, bead, bead, groove, groove, groove, rimC, rimC, rimC, rimC, edgeC, edgeC, top, top, mulC(top, 0.8), mulC(top, 1.06), mulC(top, 0.84), top, dot];
    bar(ga, py.map((y) => V(0, y, 0)), 1, 16,
      // (one drying check runs in from the rim across the head; the shank keeps a little figure)
      (j, q, cc) => { const c = pc[j], k = j >= 9 && j <= 18 && q === 5 ? 0.84 : j < 3 ? 0.9 + 0.2 * ((q * 5 + j * 3) % 4) / 3 : 1; cc[0] = c[0] * k; cc[1] = c[1] * k; cc[2] = c[2] * k; return cc; },
      { up: ZV, taper: (j) => pr[j], nT: (j) => pt[j], capTone: 1 });
  }
  const pegs = new THREE.InstancedMesh(accGeometry(ga), mats.peg, 9); pegs.frustumCulled = false; node.add(pegs);
  H.pegX = []; for (let k = 0; k < 9; k++) H.pegX.push(-17.6 + k * 4.4 + rng.range(-0.5, 0.5));
  H.pegZ = H.pegX.map((x, k) => (k & 1 ? 0.45 : -0.45) + rng.range(-0.12, 0.12));
  // ---- steam: thin threads off the wet face (one ribbon of 9 segments to each), and the drips under it
  const NST0 = Math.round(150 * Math.max(0.6, H.detail)), NST = Math.round(NST0 * 1.8), sg = new THREE.InstancedBufferGeometry();
  {
    const SEG = 9, sp = [], si = [];
    for (let k = 0; k <= SEG; k++) sp.push(-1, k / SEG, 0, 1, k / SEG, 0);
    for (let k = 0; k < SEG; k++) { const b = k * 2; si.push(b, b + 1, b + 3, b, b + 3, b + 2); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
  }
  // (the first NST0 threads keep the draws of the earlier build; the rest take their seeds from a fixed hash, so nothing after them changes)
  const seeds = new Float32Array(NST * 4); for (let k = 0; k < NST * 4; k++) { const hsh = Math.sin(k * 12.9898 + 4.1) * 43758.5453; seeds[k] = k < NST0 * 4 ? rng() : hsh - Math.floor(hsh); }
  sg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4)); sg.instanceCount = Math.round(NST0 * 1.2);
  mats.steam = new THREE.ShaderMaterial({ vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uSteam: { value: 1 }, uFlow: { value: 9 }, uRise: { value: 1 }, uWisp: { value: 0 }, uBend: mats.plank.uniforms.uBend, uBelly: mats.plank.uniforms.uBelly, uFaceY: mats.plank.uniforms.uFaceY, uBerth: mats.plank.uniforms.uBerth } });
  const steam = new THREE.Mesh(sg, mats.steam); steam.frustumCulled = false; steam.renderOrder = 3; node.add(steam);
  {
    const NDR = Math.round(56 * Math.max(0.6, H.detail)), dg = new THREE.InstancedBufferGeometry(), ds = new Float32Array(NDR * 4);
    dg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); dg.setIndex([0, 1, 2, 0, 2, 3]);
    for (let k = 0; k < NDR * 4; k++) { const hsh = Math.sin(k * 78.233 + 9.7) * 43758.5453; ds[k] = hsh - Math.floor(hsh); }
    dg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(ds, 4)); dg.instanceCount = NDR;
    mats.drip = new THREE.ShaderMaterial({ vertexShader: DRIP_VERT, fragmentShader: DRIP_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uDrip: { value: 1 }, uWisp: mats.steam.uniforms.uWisp, uBend: mats.plank.uniforms.uBend, uBelly: mats.plank.uniforms.uBelly } });
    const drips = new THREE.Mesh(dg, mats.drip); drips.name = 'drips'; drips.frustumCulled = false; drips.renderOrder = 3; node.add(drips);
  }
  await H.ctx.yield();
  // ---- traveller: three lashed bamboos under the rope, two rope rings over it, two hooks
  const ta = makeAcc(), trav = new THREE.Group(); trav.name = 'traveller';
  for (let b = 0; b < 3; b++) {
    const ox = [-0.5, 0.5, 0][b], oy = [-1.9, -1.9, -1.1][b], L = 15 + rng.range(-1, 1.5), P = [], n = 22;
    for (let j = 0; j <= n; j++) P.push(V(ox, oy + 0.25 * Math.sin((j / n) * Math.PI) , -L + (2 * L * j) / n));
    const col = mulC(mixC(C.bamboo, C.newWood, rng.range(0.1, 0.5)), rng.range(0.8, 1.05));
    bar(ta, P, 0.5, 7, [0, 0, 0], { up: UP, taper: (j) => (j % 3 === 0 ? 1.13 : 1) * (0.86 + 0.14 * j / n) });
    const cnt = (n + 1) * 8 + 14, c0 = ta.col.length - cnt * 3;
    for (let q = 0; q < cnt; q++) { const ring = Math.floor(q / 8), dark = ring <= n && ring % 3 === 0 ? 0.6 : 1; ta.col[c0 + q * 3] = col[0] * dark; ta.col[c0 + q * 3 + 1] = col[1] * dark; ta.col[c0 + q * 3 + 2] = col[2] * dark; }
  }
  for (const z of [-13, -7, 0, 7, 13]) { const P = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 2; P.push(V(Math.cos(a) * 1.15, -1.6 + Math.sin(a) * 1.0, z)); } bar(ta, P, 0.15, 4, mulC(C.rattan, 0.8), { up: ZV, caps: false }); }
  for (const z of [-11, 11]) { const P = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * Math.PI * 2; P.push(V(Math.cos(a) * 0.55, -0.4 + Math.sin(a) * 0.95, z)); } bar(ta, P, 0.2, 5, C.rope, { up: ZV, caps: false }); }
  for (const z of [-14, 14]) bar(ta, [V(0, -2.3, z), V(0, -3.6, z)], 0.3, 6, mulC(C.iron, 0.8), { up: ZV });
  trav.add(new THREE.Mesh(accGeometry(ta), mats.plain)); carried.add(trav);
  // ---- four sling ropes: unit bars stretched between hook and plank edge every frame
  const ua = makeAcc(); bar(ua, [V(0, 0, 0), V(0, -0.25, 0), V(0, -0.5, 0), V(0, -0.75, 0), V(0, -1, 0)], 0.2, 6, mulC(C.rope, 0.82), { up: ZV });
  const ug = accGeometry(ua), slings = [], slingMat = mats.rope(0.2, 3);
  for (let k = 0; k < 4; k++) { const m = new THREE.Mesh(ug, slingMat); m.frustumCulled = false; carried.add(m); slings.push(m); }
  // ---- three hauling lines: from the plank's ends and middle to blocks on the port ribs; taut while it swings to its berth
  const hauls = [];
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(ug, slingMat); m.frustumCulled = false; m.visible = false; carried.add(m); hauls.push(m); }
  // ---- windlass sticks at the berth (their rope loops are with the lashings)
  const wa = makeAcc(); bar(wa, [V(0, -2.4, 0), V(0, -2.1, 0), V(0, 2.1, 0), V(0, 2.4, 0)], 1, 6, mixC(C.bamboo, C.newWood, 0.4), { up: ZV, taper: (j) => [0.12, 0.2, 0.17, 0.1][j] });
  const sticks = new THREE.InstancedMesh(accGeometry(wa), mats.plain, 5); sticks.frustumCulled = false; group.add(sticks);
  Object.assign(H, { carried, node, plank, pegs, steam, trav, slings, hauls, sticks, rope });
  await H.ctx.yield();
}

// ---------------------------------------------------------------- pencils of light through the smoke
const THREAD_VERT = /* glsl */`
#include <fog_pars_vertex>
${LIGHT_GLSL}
attribute vec2 aCell;
varying vec2 vQ;
varying float vA;
varying vec3 vWp;
void main() {
  vec4 hole = hifHole(aCell);
  float cell = max(uRoof.z, 0.1);
  vec3 q = vec3(hole.x * cell / 1.25, 0., hole.y * cell);
  q.y = uRoof.x - uRoof.y * abs(q.x);
  float tEnd = q.y / max(uSunDir.y, 0.2);
  float t = position.y * tEnd;
  vec3 wp = q - uSunDir * t;
  vec3 toCam = cameraPosition - wp;
  float dist = length(toCam);
  vec3 sideV = cross(uSunDir, toCam / max(dist, 1e-3));
  float sl = length(sideV);
  sideV = sl > 1e-4 ? sideV / sl : vec3(1., 0., 0.);
  // From high on the hoist the pencils would stand in an even curtain between the eye and the ship: there only a few
  // of them are kept, broader and brighter (hiK = how high the eye is; it eases in and out as the eye rises and dives).
  float hiK = smoothstep(46., 62., cameraPosition.y);
  float pick = fract(sin(dot(aCell, vec2(12.9898, 78.233))) * 43758.5453);
  float th = mix(1.2, 0.05, hiK);
  float keep = 1. - smoothstep(th - 0.05, th + 0.05, pick);
  float w0 = (min(hole.z, 0.7) + 0.0027 * t) * (1. + 0.5 * hiK);
  float w = max(w0, 0.0019 * dist);
  wp += sideV * position.x * w;
  vQ = vec2(position.x, position.y);
  // the biggest holes make the brightest pencils; close to the eye a pencil thins out so it never veils the view
  // (a pencil seen nearly end-on, or within a few metres of the eye, would be a bright smear: it fades out)
  vA = hole.w * smoothstep(0.1, 0.55, hole.z) * smoothstep(8., 34., dist) * (w0 / max(w, 1e-3)) * smoothstep(0.1, 0.42, sl) * keep * (1. + 0.8 * hiK);
  vWp = wp;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const THREAD_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform float uTime;
uniform vec3 uCoinCol;
uniform float uThread;
varying vec2 vQ;
varying float vA;
varying vec3 vWp;
void main() {
  float across = 1. - vQ.x * vQ.x;
  // smoke hangs in layers; they creep, so the pencils brighten and fade along their length
  float lay = 0.5 + 0.5 * sin(vWp.y * 0.21 + sin(vWp.z * 0.011 + uTime * 0.05) * 2.3 + vWp.x * 0.03);
  // the smoke of the bending fire hangs between 45 and 90 m: there a ray is a pencil of light; below it only a
  // faint thread of sawdust
  float high = smoothstep(36., 50., vWp.y) * (1. - smoothstep(86., 100., vWp.y));
  float smoke = 0.05 + 0.17 * smoothstep(12., 38., vWp.y) + 0.85 * high * (0.3 + 0.7 * lay * lay);
  float sparkle = 1. + 0.35 * sin(vWp.y * 0.31 + uTime * 1.7 + vWp.z * 0.2) * sin(vWp.y * 0.13 - uTime * 0.9 + vWp.x * 0.3);
  float a = vA * across * across * smoke * sparkle * uThread;
  // (light seen in smoke is paler and bluer than the coin it makes on timber)
  vec3 pc = mix(uCoinCol, vec3(dot(uCoinCol, vec3(0.3, 0.5, 0.2))) * vec3(0.9, 1.0, 1.14), 0.55);
  gl_FragColor = vec4(pc * a, 1.);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float ff = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb *= 1. - ff * 0.85;
  #endif
}
`;
function buildThreads(H) {
  const { rng, shared, group } = H;
  const N = Math.round(780 * Math.max(0.5, H.detail)), SEG = 5;
  const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [];
  for (let j = 0; j <= SEG; j++) pos.push(-1, j / SEG, 0, 1, j / SEG, 0);
  for (let j = 0; j < SEG; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const cells = new Float32Array(N * 2), seen = new Set();
  for (let k = 0; k < N; k++) {
    let cx, cz, tries = 0;
    do { cx = rng.int(-17, 16); cz = rng.int(-154, 8); tries++; } while (seen.has(cx * 1000 + cz) && tries < 8);
    seen.add(cx * 1000 + cz); cells[k * 2] = cx; cells[k * 2 + 1] = cz;
  }
  // every cell of the two thin places in the thatch has its pencil too (nothing here is drawn from the random stream)
  const extra = [];
  for (const tp of H.thin) {
    const R = Math.ceil(tp[2] * 1.35);
    for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
      const cx = Math.round(tp[0]) + dx, cz = Math.round(tp[1]) + dz;
      if (dx * dx + dz * dz > R * R || seen.has(cx * 1000 + cz)) continue;
      seen.add(cx * 1000 + cz); extra.push(cx, cz);
    }
  }
  const NT = N + extra.length / 2, cellsAll = new Float32Array(NT * 2);
  cellsAll.set(cells); cellsAll.set(extra, N * 2);
  g.setAttribute('aCell', new THREE.InstancedBufferAttribute(cellsAll, 2)); g.instanceCount = NT;
  const mat = new THREE.ShaderMaterial({ vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG, fog: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uThread: H.uThread } });
  const m = new THREE.Mesh(g, mat); m.name = 'threads'; m.frustumCulled = false; m.renderOrder = 4; group.add(m);
  H.threads = m;
}

// ---------------------------------------------------------------- the garland on the stem
// A wreath of two rows round the stem at eye height, a swag hanging across its port and after faces (the faces the
// camera sees) and two tails: about 7.5 m from top to bottom, so it reads from the middle of the nave.
function buildGarland(H) {
  const { rng, C, group, mats } = H;
  const acc = makeAcc(), g = new THREE.Group(); g.name = 'garland';
  const c = stemPoint(34 / 95), palm = H.palmGarland;
  const UPV = V(0, 1, 0);
  // one flower (five white petals round a yellow heart) or one plaited palm star, facing `out`
  const flower = (ctr, out, R) => {
    const ax = new THREE.Vector3().crossVectors(UPV, out); if (ax.lengthSq() < 1e-4) ax.set(1, 0, 0); ax.normalize();
    const ay = new THREE.Vector3().crossVectors(out, ax);
    const spin = rng.range(0, 6.28), petals = palm ? 4 : 5, k = rng.range(0.82, 1);
    const heart = palm ? mulC(C.bamboo, 1.1) : [0.86, 0.52, 0.05], tip = palm ? mulC(mixC(C.newWood, C.pale, 0.55), 1.25 * k) : [0.92 * k, 0.9 * k, 0.8 * k];
    for (let p = 0; p < petals; p++) {
      const b = palm ? spin + p * 1.571 + rng.range(-0.2, 0.2) : spin + (p / petals) * Math.PI * 2, wdt = palm ? 0.24 : 0.66, i0 = acc.n;
      const dir = ax.clone().multiplyScalar(Math.cos(b)).addScaledVector(ay, Math.sin(b)), lat = ax.clone().multiplyScalar(-Math.sin(b)).addScaledVector(ay, Math.cos(b));
      const rr = palm ? R * 1.7 : R;
      const pts = [ctr.clone(), ctr.clone().addScaledVector(dir, rr * 0.6).addScaledVector(lat, rr * wdt * 0.5).addScaledVector(out, 0.14 * rr),
        ctr.clone().addScaledVector(dir, rr).addScaledVector(out, palm ? -0.2 : 0.3 * rr), ctr.clone().addScaledVector(dir, rr * 0.6).addScaledVector(lat, -rr * wdt * 0.5).addScaledVector(out, 0.14 * rr)];
      for (let q = 0; q < 4; q++) { acc.pos.push(pts[q].x, pts[q].y, pts[q].z); acc.nrm.push(out.x, out.y, out.z); const cl = q === 0 ? heart : tip; acc.col.push(cl[0], cl[1], cl[2]); acc.uv.push(q, p); }
      acc.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3); acc.n += 4;
    }
  };
  // flowers strung along a line of twine; `outAt` gives the way they face
  const strand = (P, n, R, outAt) => {
    bar(acc, P, 0.12, 4, mulC(C.rattan, 0.7), { up: UPV, caps: false });
    const m = P.length - 1;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n * m, i = Math.min(Math.floor(t), m - 1), f = t - i;
      const ctr = P[i].clone().lerp(P[i + 1], f), out = outAt(ctr).normalize();
      ctr.addScaledVector(out, 0.25).add(V(rng.range(-0.12, 0.12), rng.range(-0.18, 0.18), rng.range(-0.12, 0.12)));
      out.add(V(rng.range(-0.3, 0.3), rng.range(-0.2, 0.45), rng.range(-0.3, 0.3))).normalize();
      flower(ctr, out, R * rng.range(0.85, 1.2));
    }
  };
  const radial = (p) => V(p.x, 0.15, p.z * 0.9);
  // the wreath: two rows round the stem
  for (let row = 0; row < 2; row++) {
    const P = [];
    for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2 + row * 0.13; P.push(V(Math.sin(a) * 2.5, (row ? -0.85 : 0.2) - 1.2 * (0.5 + 0.5 * Math.cos(a)) + 0.4 * Math.sin(a * 2), Math.cos(a) * 2.9)); }
    strand(P, palm ? 18 : 30, 0.62, radial);
  }
  // the swag across the port and after faces, and two tails
  {
    const P = [], A0 = V(-2.65, -0.6, -0.9), B0 = V(1.5, -1.6, 2.75);
    for (let k = 0; k <= 12; k++) { const t = k / 12, a = Math.PI * 0.5 * t; P.push(V(lerp(A0.x, B0.x, t) - 0.9 * Math.sin(Math.PI * t), lerp(A0.y, B0.y, t) - 4.2 * 4 * t * (1 - t), lerp(A0.z, B0.z, Math.sin(a)) + 0.7 * Math.sin(Math.PI * t))); }
    strand(P, palm ? 12 : 22, 0.7, (p) => V(p.x - 0.4, 0.1, p.z + 0.6));
    const T1 = [], T2 = [];
    for (let k = 0; k <= 6; k++) { const t = k / 6; T1.push(V(-2.75 - 0.25 * t, -1.2 - 6.2 * t, 0.9 + 0.5 * Math.sin(t * 2.5))); T2.push(V(-0.7 + 0.3 * Math.sin(t * 3), -1.9 - 4.6 * t, 3.05 + 0.25 * t)); }
    strand(T1, palm ? 6 : 11, 0.66, (p) => V(-1, 0.1, 0.45));
    strand(T2, palm ? 5 : 8, 0.62, (p) => V(-0.35, 0.1, 1));
  }
  g.add(new THREE.Mesh(accGeometry(acc), mats.cloth));
  g.position.set(0, c.y + 1.6, c.z + 0.3); g.rotation.x = -0.36;
  group.add(g); H.garland = g;
}

// ---------------------------------------------------------------- looks
const LOOKS = {
  // form: [flank shade, inboard gain, fall-off of faces turned from the roof] (see hifShade)
  noon: { coin: [1.0, 0.86, 0.5], gain: 5.7, up: [0.55, 0.62, 0.6], down: [0.86, 0.69, 0.44], port: [0.2, 0.56, 0.2], star: [0.12, 0.5, 0.58], wet: 0, holes: 0.42, thread: 0.06, steam: 1, ember: [3.0, 0.84, 0.14], form: [0.62, 0.8, 0.34], sheen: [0.05, 0.07, 0.075], gloss: 0.72 },
  rain: { coin: [0.8, 0.92, 1.0], gain: 4.4, up: [0.34, 0.38, 0.4], down: [0.62, 0.62, 0.56], port: [0.14, 0.34, 0.2], star: [0.1, 0.36, 0.4], wet: 1, holes: 0.5, thread: 0.06, steam: 1.9, ember: [2.4, 0.63, 0.09], form: [0.4, 0.55, 0.14], sheen: [0.07, 0.1, 0.12], gloss: 0.7 },
  night: { coin: [0.62, 0.74, 1.0], gain: 7.0, up: [0.5, 0.65, 1.3], down: [0.4, 0.52, 1.0], port: [0.05, 0.14, 0.2], star: [0.08, 0.2, 0.3], glaze: [0.012, 0.02, 0.05], wet: 0, holes: 0.42, thread: 0.026, steam: 0.8, ember: [8.0, 1.9, 0.2], form: [0.3, 0.3, 0.1], sheen: [0.04, 0.06, 0.14], gloss: 0.5 },
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map(hexLin);
  const detail = ctx.quality?.detail ?? 1;
  const group = new THREE.Group(); group.name = 'hull-in-frames';
  const shared = {
    uTime: { value: 0 }, uSunDir: { value: new THREE.Vector3(0.10, 0.985, 0.14).normalize() }, uCoinCol: { value: new THREE.Color() },
    uRoof: { value: new THREE.Vector4(118, 0.75, 3.2, 0.42) }, uFillUp: { value: new THREE.Color() }, uFillDown: { value: new THREE.Color() },
    uFillPort: { value: new THREE.Color() }, uFillStar: { value: new THREE.Color() }, uWetAll: { value: 0 }, uGlaze: { value: new THREE.Color(0, 0, 0) },
    uEmber: { value: new THREE.Color(0, 0, 0) }, uForm: { value: new THREE.Vector3(0.34, 0.3, 0.3) },
    uThinA: { value: new THREE.Vector4(0, 0, 1, 0) }, uThinB: { value: new THREE.Vector4(0, 0, 1, 0) },
  };
  if (opts.sun) shared.uSunDir.value.set(opts.sun[0], opts.sun[1], opts.sun[2]).normalize();
  // opts.thin: up to two places [x, y, z, radius in m, gain] that a dense cluster of pinhole rays falls on: the roof
  // cell each ray comes from is worked out here (along the sun's ray up to the thatch)
  const thin = [];
  for (let k = 0; k < Math.min(2, (opts.thin || []).length); k++) {
    const [tx, ty, tz, tr, tg] = opts.thin[k], sd = shared.uSunDir.value, R = shared.uRoof.value;
    const den = Math.max(sd.y + R.y * sd.x * (tx < 0 ? -1 : 1), 0.25), tt = Math.max((R.x - R.y * Math.abs(tx) - ty) / den, 0);
    const cx = (tx + sd.x * tt) * 1.25 / R.z, cz = (tz + sd.z * tt) / R.z, rc = tr / R.z;
    thin.push([cx, cz, rc, tg]); (k ? shared.uThinB : shared.uThinA).value.set(cx, cz, rc, tg);
  }
  const uThread = { value: 0.07 };
  let steamGain = 1, lookNow = LOOKS.noon;
  const apply = (name) => {
    const L = LOOKS[name] || LOOKS.noon; lookNow = L;
    shared.uCoinCol.value.setRGB(L.coin[0] * L.gain, L.coin[1] * L.gain, L.coin[2] * L.gain);
    shared.uFillUp.value.setRGB(...L.up); shared.uFillDown.value.setRGB(...L.down); shared.uFillPort.value.setRGB(...L.port); shared.uFillStar.value.setRGB(...L.star);
    shared.uWetAll.value = L.wet; shared.uGlaze.value.setRGB(...(L.glaze || [0, 0, 0])); shared.uRoof.value.w = L.holes; uThread.value = L.thread; steamGain = L.steam;
    shared.uEmber.value.setRGB(...(L.ember || [0, 0, 0]));
    shared.uForm.value.set(...(L.form || [0.34, 0.3, 0.3]));
  };
  apply(opts.look || 'noon');
  const teak = opts.teak ?? rng.chance(0.35);
  const C = {
    iron: mixC(mulC(pal[0], teak ? 2.4 : 1.75), mulC(pal[2], 0.3), 0.2), newWood: mulC(pal[1], 0.82), pale: mulC(pal[5], 0.8), ash: mulC(pal[2], 0.8), bamboo: mulC(pal[4], 1.05),
    rattan: mulC(pal[1], 0.9), rope: mulC(mixC(pal[1], pal[2], 0.55), 0.6), peg: mulC(mixC(pal[1], pal[5], 0.4), 0.9), white: mulC(pal[5], 0.92),
  };
  const mats = {
    wood: makeWood(shared, { scallop: 1 }), woodDouble: makeWood(shared, { scallop: 0.6, side: THREE.DoubleSide }),
    plank: new THREE.ShaderMaterial({ vertexShader: WOOD_VERT, fragmentShader: PLANK_FRAG, fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, uBend: { value: 1 }, uBelly: { value: 0 }, uBendOn: { value: 1 },
        uSheen: { value: new THREE.Color(0, 0, 0) }, uGloss: { value: 0 }, uFaceY: { value: 30 }, uBerth: { value: new THREE.Vector4(-23.7, -354, 0.236, -0.972) }, uEdge: { value: new THREE.Color(...mulC(mixC(C.newWood, C.pale, 0.35), 0.8)) } } }),
    peg: makeWood(shared, { scallop: 0, grainK: 0.3 }),
    // rope of radius r laid up in `strands` (same program as the timber; only uniforms differ)
    rope: (r, strands) => makeWood(shared, { scallop: 0, grainK: 0.35, twist: strands / (2 * Math.PI * r) }),
    plain: makeWood(shared, { scallop: 0 }), lash: makeWood(shared, { scallop: 0, wrap: 1 }), cloth: makeWood(shared, { scallop: 0, side: THREE.DoubleSide }),
  };
  mats.plank.uniforms.uSheen.value.setRGB(...lookNow.sheen); mats.plank.uniforms.uGloss.value = lookNow.gloss;
  const H = { ctx, rng, C, group, mats, shared, detail, teak, uThread, thin, day: !!opts.day, path: opts.path || PATH, palmGarland: rng.chance(0.4), newRibs: opts.newRibs || 0, ropePts: opts.rope || ROPE, spallSkip: opts.spallSkip || null, paleRibs: !!opts.paleRibs };
  if (opts.garland) H.palmGarland = opts.garland === 'palm';
  await ctx.yield();
  await buildRibs(H);
  await buildBackbone(H);
  await buildSkin(H);
  await buildVehicle(H);
  buildGarland(H);
  if (opts.threads !== false) buildThreads(H);
  await ctx.yield();

  // ---- the berth on the port ribs, the windlass loops, and the lashings mesh
  // The plank lands on the last seven port ribs (63..69) and runs 8 m on past the last of them toward the stem, its
  // hood end left wild: so that, seen from where the camera slows, its whole length lies ahead and leads to the portal.
  const ZF = -354, ZT = -394, YB = 30, RIB_A = 63, RIB_B = 69;
  const bFrom = V(-halfBreadthAt(ZF, YB), YB, ZF), bTo = V(-halfBreadthAt(ZT, YB), YB, ZT);
  const bX = bTo.clone().sub(bFrom).normalize(), bY = V(-bX.z, 0, bX.x).normalize(), bZ = new THREE.Vector3().crossVectors(bX, bY);
  if (bY.x < 0) { bY.multiplyScalar(-1); bZ.multiplyScalar(-1); }
  const bMid = bFrom.clone().add(bTo).multiplyScalar(0.5);
  const belly = clamp(halfBreadthAt((ZF + ZT) / 2, YB) + bMid.x, 0, 2.5);
  // how far the plank's centreline must stand in from the chord so that, bent home, it clears every rib it lies on
  let proud = 0.3;
  for (let r = RIB_A; r <= RIB_B; r++) {
    const zr = RIB_Z0 - RIB_DZ * r, xl = clamp((zr - bMid.z) / bX.z, -20, 20), sN = (xl + 20) / 40;
    const chordX = bMid.x + bX.x * xl, dev = halfBreadthAt(zr, YB) + chordX;          // rib face outboard of the chord by dev
    proud = Math.max(proud, 0.25 + 0.08 + belly * 4 * sN * (1 - sN) - dev * Math.abs(bY.x));
  }
  mats.plank.uniforms.uFaceY.value = YB;
  { const bl = Math.hypot(bTo.x - bFrom.x, bTo.z - bFrom.z); mats.plank.uniforms.uBerth.value.set(bFrom.x, bFrom.z, (bTo.x - bFrom.x) / bl, (bTo.z - bFrom.z) / bl); }
  const berthPos = bMid.clone().addScaledVector(bY, proud), berthQ = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(bX, bY, bZ));
  const stickAt = [], wl = makeAcc();
  // nine pegs on seven ribs: two ribs take a second peg, lower on the face
  const PEG_RIB = [63, 64, 64, 65, 66, 67, 67, 68, 69], WIND_RIB = [63, 65, 66, 68, 69];
  for (let k = 0; k < 9; k++) {
    const zr = RIB_Z0 - RIB_DZ * PEG_RIB[k], twin = k > 0 && PEG_RIB[k - 1] === PEG_RIB[k];
    H.pegX[k] = clamp((zr - bMid.z) / bX.z, -19.2, 19.2) + (twin ? 0.12 : -0.05);
    H.pegZ[k] = (twin ? 0.62 : PEG_RIB[k + 1] === PEG_RIB[k] ? -0.62 : (k & 1 ? 0.3 : -0.3)) + H.pegZ[k] * 0.3;
  }
  for (let w = 0; w < 5; w++) {
    const zr = RIB_Z0 - RIB_DZ * WIND_RIB[w];
    // a rope windlass: one turn round the rib above the plank and one below it, joined across the plank's
    // inner face by a doubled rope that the stick twists tight
    const xin = halfBreadthAt(zr, YB), x0 = -(xin + 2.9), x1 = -(xin - 1.35);
    for (let turn = 0; turn < 2; turn++) {
      const P = [], hz = 1.15, y = YB + (turn ? -1.5 : 1.5), r = 0.45;
      const cs = [[x0 + r, -hz], [x1 - r, -hz], [x1, -hz + r], [x1, hz - r], [x1 - r, hz], [x0 + r, hz], [x0, hz - r], [x0, -hz + r], [x0 + r, -hz]];
      for (const q of cs) P.push(V(q[0], y + 0.06 * Math.sin(q[0] * 3 + turn), zr + q[1]));
      bar(wl, P, 0.1, 6, mulC(C.rope, 1.25 - 0.2 * turn), { up: V(0, 1, 0), caps: false });
    }
    for (const dz of [0.55, 1.0]) bar(wl, [V(x1, YB + 1.5, zr + dz), V(x1 + 0.12, YB, zr + 0.78 + (dz - 0.78) * 0.4), V(x1, YB - 1.5, zr + dz)], 0.095, 6, mulC(C.rope, 1.15), { up: V(0, 0, 1) });
    stickAt.push(V(x1 + 0.15, YB + (w & 1 ? 0.35 : -0.35), zr + 0.78));
  }
  // the blocks the hauling lines lead through, lashed high on three of the berth's ribs (a strop round the rib, a wooden shell)
  const haulBlock = [], haulX = [18.6, 0.5, -18.6];
  for (const [rib, yb] of [[69, 46.5], [66, 49.5], [63, 46.5]]) {
    const zr = RIB_Z0 - RIB_DZ * rib, xb = -(halfBreadthAt(zr, yb) - 0.75), zb = zr + 1.15;
    haulBlock.push(V(xb, yb, zb));
    bar(wl, [V(xb - 0.1, yb + 0.9, zb), V(xb, yb + 0.55, zb), V(xb, yb - 0.55, zb), V(xb - 0.1, yb - 0.9, zb)], 1, 7, mulC(C.iron, 1.5), { up: V(0, 0, 1), taper: (j) => [0.22, 0.5, 0.5, 0.22][j] });
    bar(wl, [V(xb - 1.2, yb + 1.0, zr - 1.2), V(xb + 0.1, yb + 1.0, zr - 1.2), V(xb + 0.1, yb + 1.0, zr + 1.2), V(xb - 1.2, yb + 1.0, zr + 1.2)], 0.1, 5, mulC(C.rope, 1.2), { up: V(0, 1, 0), caps: false });
  }
  const wlMesh = new THREE.Mesh(accGeometry(wl), mats.rope(0.1, 3)); wlMesh.name = 'windlasses'; group.add(wlMesh);
  // rattan round the scarfs of the ribs the plank is bent to, and three wooldings on the sternpost
  for (const sc of H.rankScarf || []) {
    const o = outerAt(sc.z, sc.y), tl = Math.hypot(o.nx, o.ny) || 1, t = V(o.ny / tl, o.nx / tl, 0), bd = V(-o.nx, o.ny, 0);
    // ONE sleeve of tight rattan turns that follows the rib's own section, only a little proud of it and rounded,
    // its edges dying into the wood; how wide it is, where it sits and its tone differ from rib to rib; the tail of
    // the last turn is tucked under and hangs from a small round knot
    const hs = Math.abs(Math.sin(sc.z * 12.9898) * 43758.5453) % 1, h2 = (hs * 7.3) % 1, off0 = (h2 - 0.5) * 0.7, wS = 1.05 + 1.0 * hs, hb = 1.3;
    const cS = V(-sc.x + t.x * off0, sc.y + t.y * off0, sc.z), tone = 0.42 + 0.2 * h2;
    sleeve(H.lashAcc, cS, bd, 0.9, hb, wS, 0.06, (i, j, cc) => { const k = tone * (0.86 + 0.28 * ((j * 5 + (i & 1) + Math.floor(hs * 9)) % 4) / 3); cc[0] = C.rattan[0] * k; cc[1] = C.rattan[1] * k; cc[2] = C.rattan[2] * k; return cc; }, 4.2, sc.z);
    const k0 = V(cS.x + t.x * wS * 0.3 - bd.x * (hb + 0.07), cS.y + t.y * wS * 0.3 - bd.y * (hb + 0.07), sc.z + 0.25 + 0.45 * hs);
    bar(H.lashAcc, [k0, k0.clone().add(V(0.1, -0.35, 0.08)), k0.clone().add(V(0.2, -0.9 - 0.5 * hs, 0.2)), k0.clone().add(V(0.22, -1.5 - 0.8 * hs, 0.16))], 0.05, 5, mulC(C.rattan, 0.62), { taper: (j) => 1 - 0.18 * j });
    bar(H.lashAcc, [k0.clone().add(V(0, 0.09, -0.08)), k0.clone().add(V(0.03, 0, 0)), k0.clone().add(V(0, -0.09, 0.08))], 1, 7, mulC(C.rattan, 0.5), { taper: (j) => [0.05, 0.1, 0.05][j], nT: (j) => [-1.2, 0, 1.2][j] });
  }
  for (const y0 of [10.3, 26.7, 43.5]) for (let b = 0; b < 6; b++) {
    const y = y0 + b * 0.4, hf = STERN_HALF * lerp(1, 0.82, (y - 2.6) / 69.4);
    H.lash(V(0, y, STERN_RAKE * (y - 2.6)), V(0, 1, 0), V(1, 0, 0), hf * 1.08 + 0.11, hf + 0.11, mulC(mixC(C.rattan, C.iron, 0.45), 0.5 + 0.09 * ((b * 3 + (y0 | 0)) % 3)), 0.1, 0.21);
  }
  const lashMesh = new THREE.Mesh(accGeometry(H.lashAcc), mats.lash); lashMesh.name = 'lashings'; group.add(lashMesh);
  await ctx.yield();

  // ---- pose state (everything below is allocated once; update() creates nothing)
  let progress = null, travel = null;
  const ride = { ...RIDE, ...(opts.ride || {}) };
  const pegS = new THREE.Vector3(1, 1, 1);
  const demoU = opts.demoU ?? 0.42;
  const eye = new THREE.Vector3(), head = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const ridePos = new THREE.Vector3(), rideQ = new THREE.Quaternion(), qa = new THREE.Quaternion(), m4 = new THREE.Matrix4(), e3 = new THREE.Euler();
  const hook = new THREE.Vector3(), foot = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);
  const sx = new THREE.Vector3(), sy = new THREE.Vector3(), sz = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), qi = new THREE.Quaternion();
  const cum = [0];
  for (let k = 1; k < H.path.length; k++) cum.push(cum[k - 1] + Math.hypot(H.path[k][0] - H.path[k - 1][0], H.path[k][1] - H.path[k - 1][1], H.path[k][2] - H.path[k - 1][2]));
  const pathAt = (u, out) => {
    const d = clamp(u, 0, 1) * cum[cum.length - 1]; let k = 0;
    while (k < cum.length - 2 && cum[k + 1] < d) k++;
    const t = (d - cum[k]) / Math.max(cum[k + 1] - cum[k], 1e-4), a = H.path[k], b = H.path[k + 1];
    return out.set(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
  };
  // peg k (0 = aftmost) takes three knocks over PEG_DU of the path, starting at PEG_U0 + k * PEG_DU; each is struck
  // 6 to 9 m ahead of the eye. knock() returns 0..3: whole part = knocks landed, fraction = progress of the next.
  const PEG_U0 = 0.8065, PEG_DU = 0.0075;
  const knock = (u, k) => clamp((u - (PEG_U0 + k * PEG_DU)) / PEG_DU, 0, 1) * 3;
  let ubNow = 1, blNow = 0;
  const bendY = (x, ub, bl) => { const s = clamp((x + 20) / 40, 0, 1); return (1 - ub) * 4 * s * s - bl * 4 * s * (1 - s); };
  const pu = mats.plank.uniforms;

  function update(dt, time, camera) {
    shared.uTime.value = time;
    // (the blade lies over to port, so from astern its whole planked breadth shows beside the post: one broad dark upright)
    H.rudder.rotation.set(H.rudderRake, H.rudderPose.yaw + 0.07 * Math.sin(time * 0.23) + 0.03 * Math.sin(time * 0.61 + 1), 0);
    H.garland.rotation.set(-0.36 + 0.025 * Math.sin(time * 0.8), 0.03 * Math.sin(time * 0.53 + 2), 0.02 * Math.sin(time * 1.1));
    const u = progress === null ? demoU : progress;
    // the eye and its level heading
    if (progress === null || !camera) {
      pathAt(u, eye); pathAt(Math.min(u + 0.01, 1), head); head.sub(eye); if (head.lengthSq() < 1e-8) head.set(0, 0, -1);
    } else {
      const e = camera.matrixWorld.elements; eye.set(e[12], e[13], e[14]); head.set(-e[8], -e[9], -e[10]);
      // the plank hangs along the line of travel, not along the gaze: when the eye turns to look at something it stays put
      if (travel) head.copy(travel);
    }
    head.y = 0; if (head.lengthSq() < 1e-6) head.set(0, 0, -1); head.normalize();
    right.crossVectors(head, up).normalize();
    H.carried.visible = u > 0.12;
    // riding pose: 4 m left, 5 m down, 10 m ahead; rising out of the steam over u 0.12..0.24
    const rise = smoothstep(0.12, 0.24, u), sway = Math.sin(time * 0.698), blend = smoothstep(0.69, 0.765, u);
    // it comes up past the sternpost 4 m to port of the eye and swings out to its riding place once it is clear of the stern
    const out = smoothstep(0.205, 0.285, u);
    ridePos.copy(eye).addScaledVector(right, -lerp(ride.rise ?? 4, ride.left, out)).addScaledVector(head, ride.ahead - 34 * (1 - rise));
    ridePos.y += -lerp(5, ride.down, out) - 16 * (1 - rise) * (1 - rise);
    const rideZ = ridePos.z, rideX = ridePos.x;
    // THE DESIGN'S FIGURES: a pendulum sway of 1.2 m every 9 s, all of it to port of the riding place (so the plank's
    // nearest part is never less than the 6.4 m of its riding place from the eye), and a slow yaw of 3 degrees about
    // the point of the plank that is abeam of the eye (its nose swings, the part beside the eye stays put); no set to
    // either side: it hangs along the line of travel, pointing at the bow. A dip as the rope gives.
    const yawA = 0.0524 * Math.sin(time * 0.31 + 0.7) * rise;
    ridePos.addScaledVector(right, -(0.6 * (1 + sway) + ride.ahead * Math.sin(yawA)) * rise); ridePos.y -= 0.45 * Math.pow(Math.sin(time * 0.37), 2) + 0.12 * sway * sway;
    m4.makeBasis(head, up, right); rideQ.setFromRotationMatrix(m4);
    // (it comes up fore end first, its after end still in the steam, and levels as it is run out ahead)
    e3.set(-0.05 * sway, yawA, 0.012 * Math.sin(time * 0.53) + 0.12 * (1 - smoothstep(0.215, 0.315, u))); qa.setFromEuler(e3); rideQ.multiply(qa);
    H.node.position.copy(ridePos).lerp(berthPos, blend);
    // (a small lift only, and its fore end led off to port early: through the swing a clear band of nave stays
    // between its tip and the ring)
    H.node.position.y += 1.0 * Math.sin(blend * Math.PI) * (blend < 1 ? 1 : 0);
    H.node.position.addScaledVector(right, -4.5 * Math.sin(blend * Math.PI) * (1 - blend));
    H.node.quaternion.copy(rideQ).slerp(berthQ, blend);
    H.node.updateMatrixWorld(true);
    const home = smoothstep(0.8, 0.87, u), ub = Math.max(1 - smoothstep(0.705, 0.765, u), home), bl = belly * home;
    pu.uBend.value = ub; pu.uBelly.value = bl; ubNow = ub; blNow = bl;
    // steam: streaming aft while the board is carried, lifting off the face in slow wisps once it is on the ribs
    mats.steam.uniforms.uSteam.value = steamGain * (1 - 0.35 * smoothstep(0.86, 0.95, u)) * (0.45 + 0.55 * rise + 0.6 * (1 - rise)) * (1 + 1.0 * blend);
    mats.steam.uniforms.uFlow.value = lerp(16, 1.0, blend);
    mats.steam.uniforms.uRise.value = lerp(1, 1.45, blend);
    mats.steam.uniforms.uWisp.value = blend;
    mats.drip.uniforms.uDrip.value = 0.7 + 0.3 * steamGain;
    // pegs: knocked home in turn, three knocks each
    for (let k = 0; k < 9; k++) {
      const t = knock(u, k), kn = Math.min(Math.floor(t), 3), fr = t - Math.floor(t);
      const depth = Math.min(1, (kn + (kn < 3 ? smoothstep(0, 0.35, fr) : 0)) / 3);
      // while riding their heads lie flush with the wet face; they are drawn out to be struck as the plank swings to its berth
      const pg = smoothstep(0.7, 0.76, u);
      pegS.set(1, lerp(0.3, 1, pg), 1);
      tmp.set(H.pegX[k], lerp(-0.14, 1.35, pg) - 2.3 * depth + bendY(H.pegX[k], ub, bl), H.pegZ[k]);
      m4.compose(tmp, qi, pegS); H.pegs.setMatrixAt(k, m4);
    }
    H.pegs.instanceMatrix.needsUpdate = true;
    // traveller on the rope above the plank; it stops short of the bow
    const tz = Math.max(rideZ, -338), tx = H.ropeX(tz);
    H.trav.position.set(tx, H.ropeY(tz), tz);
    H.trav.rotation.set(0, (ROPE_X0 - ROPE_X1) / 520, 0.03 * sway);
    // slings: hook to plank edge, let go at the berth and swing back
    const rel = smoothstep(0.718, 0.745, u), calm = 1 - smoothstep(0.8, 0.97, u);
    for (let k = 0; k < 4; k++) {
      const fwd = k < 2 ? 1 : -1, edge = k & 1 ? 1 : -1;
      hook.set(H.ropeX(tz - 14 * fwd), H.trav.position.y - 3.6, tz - 14 * fwd);
      foot.set(14 * fwd, -0.2, 1.22 * edge).applyMatrix4(H.node.matrixWorld);
      // let go, the slings are hauled up short and swing: their feet stay well above the eye, which passes beneath
      tmp2.set(hook.x + edge * 0.5 + 1.6 * calm * Math.sin(time * 0.9 + fwd), hook.y - 6.5, hook.z + 2.0 * calm * Math.sin(time * 0.7 + fwd * 2 + 1));
      foot.lerp(tmp2, rel);
      tmp.subVectors(foot, hook); const len = Math.max(tmp.length(), 0.01); tmp.multiplyScalar(1 / len);
      const s = H.slings[k]; s.position.copy(hook); s.quaternion.setFromUnitVectors(DOWN, tmp); s.scale.set(1, len, 1);
    }
    // windlass sticks: two turns as the plank is drawn in
    for (let k = 0; k < 5; k++) {
      const a = 0.6 + k * 1.1 + smoothstep(0.795 + k * 0.004, 0.865 + k * 0.002, u) * Math.PI * 4 + 0.05 * Math.sin(time * 1.3 + k);
      sy.copy(bZ).multiplyScalar(Math.cos(a)).addScaledVector(bX, Math.sin(a)); sz.copy(bY); sx.crossVectors(sy, sz);
      m4.makeBasis(sx, sy, sz); m4.setPosition(stickAt[k]); H.sticks.setMatrixAt(k, m4);
    }
    H.sticks.instanceMatrix.needsUpdate = true;
    // hauling lines: they take the plank as the traveller stops (thin at first, so nothing pops), stay taut while it
    // swings and turns on edge, and are left made fast up the ribs once it lies on them
    const hk = smoothstep(0.688, 0.712, u);
    for (let k = 0; k < 3; k++) {
      const s = H.hauls[k]; s.visible = hk > 0.01;
      if (!s.visible) continue;
      foot.set(haulX[k], -0.3 + bendY(haulX[k], ub, bl), k === 1 ? 1.1 : 0).applyMatrix4(H.node.matrixWorld);
      tmp.subVectors(foot, haulBlock[k]); const len = Math.max(tmp.length(), 0.01); tmp.multiplyScalar(1 / len);
      s.position.copy(haulBlock[k]); s.quaternion.setFromUnitVectors(DOWN, tmp); s.scale.set(hk, len, hk);
    }
  }
  update(0, 0, null);

  const anchors = {
    portalSeat: { position: V(-9.5, 34, PORTAL_Z), facing: V(0, 0, 1) },
    flyThrough: H.path.map((p) => V(p[0], p[1], p[2])),
    ridgeRope: [V(ROPE_X0, H.ropeY(100), 100), V(ROPE_X1, H.ropeY(-420), -420)],
    sternMark: V(0, 30, 10), towerSite: V(24, 0, -150), coilSite: V(-8.5, 36, -200),
    berth: { from: bFrom.clone(), to: bTo.clone() }, stemGarland: H.garland.position.clone(), gantry: { uprightX: -18, barY: 43.5, z: PORTAL_Z },
    counter: [H.counter.left.clone(), H.counter.right.clone()], haulBlocks: haulBlock.map((q) => q.clone()),
    ribAt: (i, side, y, out = new THREE.Vector3()) => { const z = RIB_Z0 - RIB_DZ * clamp(Math.round(i), 0, N_RIBS - 1); return out.set(side * halfBreadthAt(z, y), y, z); },
    halfBreadth: halfBreadthAt, sheer: sheerY,
  };
  return {
    object: group, radius: 130, height: 96, center: new THREE.Vector3(0, 36, -215), anchors, ground: true, groundY: 0,
    carried: H.carried, ride, rudder: H.rudderPose, light: { uniforms: shared, glsl: LIGHT_GLSL, apply, threadGain: uThread }, materials: mats,
    // u = path progress; dir (optional Vector3, kept by reference) = the direction of travel there
    setProgress(u, dir) { progress = u; travel = dir || null; }, setLook: apply, update, dispose() {},
    // geometry and material helpers for the world, so shed, staging and props are built and shaded like the ship
    tools: { makeAcc, accGeometry, sweep, beam, bar, profRect, profRound, framesFrom, makeWood, hexLin, mixC, mulC, C, berthPos, bX, bY, bZ, pegX: H.pegX, knock, PEG_U0, PEG_DU,
      // where peg k enters the plank's face at the berth, as the plank lies now (the world puts its puff of dust there)
      // a point of the carried plank (x metres forward of its middle, y above its face, z across) in the world, as it hangs now
      plankAt: (x, y, z, out) => out.set(x, y, z).applyMatrix4(H.node.matrixWorld),
      pegAt: (k, out) => out.copy(berthPos).addScaledVector(bX, H.pegX[k]).addScaledVector(bY, 0.3 + bendY(H.pegX[k], ubNow, blNow)).addScaledVector(bZ, H.pegZ[k]) },
  };
}
