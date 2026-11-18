// THE UPSIDE-DOWN POOLS (mirror-chimneys): two kilometres down, a 55 m sulphide tower with a mercury-bright pool
// of hot water hanging under each of its shelves. Lamp light only. We come in low over a fissure, through a notch in
// a pillow ridge past an abandoned lander, tour the tower from outside the rims of its shelves (the pools are seen from
// the side, whole, never from straight underneath) and leave, rising at 60 degrees, through a ring that touches the
// highest mirror.
//
// MAP OF THIS FILE (in order)
//   1. GLSL            one lamp chunk for everything (LAMP_GLSL from the part: two headlamps from the camera matrix,
//                      two lander lamps, red dying first). Shaders: BED (pillow basalt, mat, iron floc, and its pale
//                      long-view fill; HEM: the same, see-through, over the aprons), CRAWL (instanced shrimp / yeti crabs /
//                      snails, crabs, clams / mussels), FISH
//                      (eelpout; FISH_F its skin), SOFT (the swimmer, the lander), CRIT_F (the shared fragment of the cast and the lander),
//                      SWIM_F (the swimmer's wine-red, half transparent skin), BUB (bubbles: one camera-facing quad each,
//                      the sphere drawn per pixel), BELL (the rare mercury
//                      bell), BEAM + STAR (lander beams and lens; a beam is a true volume: its mesh is only the cone's
//                      hull, the fragment shader integrates the lit water along the sight line), FLOC (the snow: sparse,
//                      soft, lit only in the lamp cones), PLUME (lesser smokers: black knobbly ropes shaded per pixel, with
//                      an ember at the root), EMBER (a dull halo at each smoker's mouth), HAZE (the water itself: a dome
//                      round the eye, drawn behind everything, dim slate where the lamps look and over the field).
//   2. small builders  cell noise, lathe spires, the lander's parts, creature geometry
//   3. build(ctx)
//      3a seeded looks   LOOKS table: lamp colour, water (clear / snowblower / current), mineral, cast  -> `look`
//      3b path, pace     PTS (the way in: level out of the portal, a dip low along the fissure, the hero's notch anchors;
//                        then the tour table HX [bearing, radius, height], 21 to 28 m from the axis, outside every pass
//                        shelf's rim and 5 to 9 m below its mirror; the fall away FALL [x, y, z] out to the north vantage
//                        37-50 m from the tower; the knee and the rise to the seat), paceFn (speedAt), tourGaze (the GAZE
//                        table, keyed to the dome's bearing round the tower: across the field from the notch, out past
//                        the worm mound, the hero pool whole and from the side, then down and out past the trunk, which
//                        fills the left two fifths, the swimmer in open water to its right), inGaze (the way in, GAZE_IN
//                        keyed to u: the star in the V, the entry chimney right of centre, the lander low on the right)
//                        and fallGaze (first 9 degrees down at the tower's foot from the north; then the vantage picture:
//                        the tower from foot to crown in the left third, the ring top-centre, the lander's star low on
//                        the right, 15 degrees up; 38 round the knee so the first billows of the column stand over the ring)
//      3c hero           buildHero at the origin, unrotated; twelve pass thickets (THICKET_B) and one on the worm mound
//                        (MOUND); lander lamps via hero.setLander
//      3d bed            rawH(x,z): bowl, pillows, west plateau, ridge + notch (its north wall flared on the tower side, so
//                        the lander's star shows from the north vantage), fissure, hills at its end; carved under the path. Then the far hills' ground and the haze dome
//      3e chimneys       46 lesser chimneys (among them the tall east ring, three in the north-west foreground of the
//                        vantage, six on the plateau either side of the way in and five tall ones across the far north;
//                        the ones within 17 m of the path have more rows and half the bulge) and a second rank of seven
//                        tall ones (`vents2`, drawn from their own generator `xrng` so the older draws stay where they
//                        were) + the worm mound south of the tower and the entry chimney beside the fissure + a corbel
//                        ledge under each pass thicket (hero rock material; mound and ledges are also given to
//                        hero.mirrorRock so they show upside down in the sheets), the smokers' plumes, shimmer threads
//                        (broad ones over the fissure, a curtain of ten off F3's lip, and three feeders that climb from the
//                        bed into F3's pool)
//      3f lander, beams, star
//      3g cast           wall crawlers, crabs, clams, eelpout shoal (scatters at U_SHOAL) and loners by the shelves and the
//                        knee, the swimmer (one dumbo octopus in every look, octoGeo + SWIM_F: in open water to the right of
//                        the trunk as we pass F3, then on the lander's up-beam across the vantage), bubbles (seep beads beside the way in, fat
//                        columns close on the right of the rise), ember halos, floc (the box round the dome and a second
//                        box of big flakes over the fissure), rare bell (U_BELL, only when ctx.vary.rare: it lets go of
//                        F3's rim 26 m before we come abeam of it). ctx.vary.mood warms the embers and lifts the cold rims.
//      3h pois, post, update, return
//   WHERE THINGS ARE SET
//     path: PTS in 3b (HX, FALL, MOUND at the head of section 3). pois: the `pois` array in 3h. hero placement: 3c
//     (origin). seeded moods: LOOKS in 3a. exposure, bloom, grade: `post` in 3h. fog and background: 3a (scene.fog,
//     scene.background, both #03060C; the haze dome is drawn over the background).
//   UNIFORMS THAT DRIVE THE SCRIPTED MOMENTS (all set in update())
//     hero.lamps.uSurvey / uAbsorb   long-view clarity by u: clearest at the entry and the fall away, a little less round the
//                                    tour, lifted for the look across the field (from the reveal to the hero pool) and over the vantage
//     hero.setTowerLight             the tower's long-view light (warm face, cold lander side): 0.4, full at the reveal and from the fall away on
//     bed uVant, uFill               the bed's own long-view light: lander glow and pale fill across the vantage (uVant), the same
//                                    pale fill beyond the headlamps at the reveal and, weaker, round the tour; strongest while the
//                                    hero pool is seen whole, when the bed behind it is the backdrop (uFill)
//     haze uHaze                     strength of the water's glow (less only while we are seen through the last world's portal, u exactly 0)
//     beams uTaper                   1 = the up-beam drawn as a narrow core that thins toward the ring (the way in and the rise),
//                                    0 across the vantage where it is the long shaft
//     hero.setFieldRim               cold slate rim on the far chimneys: up a third from the reveal on, more while the hero pool is
//                                    seen whole, more than doubled on the rise
//     plumes uPlumeK                 the lesser smokers' cold rims: up on the way in, more from the reveal on
//     beams uShaft                   the lander's up-beam as a long drifting shaft from the star to the ring: 0 until we leave
//                                    F3, 1 across the vantage, eased to 0.45 round the knee as we climb in beside it
//     fishU.uBurst                   eelpout scatter, 0..3, from (u - U_SHOAL)
//     octo position, scale, uEyeL    swimmer: octoPos(u), one smooth curve through eight points keyed to u (U_SW), each set by its
//                                    angle to the right of the tower's axis as the dome sees it or on the sight line to the
//                                    lander's beam; a speck outside its window; uEyeL is the eye in its own frame (SWIM_F looks
//                                    through its skin with it)
//     bell position, scale, uRise    rare bell, from (u - U_BELL); its scale is next to nothing outside that window
//     floc uCen, uCamV               the snow box follows the camera (parked at the entry while u is 0); uCamV is our own
//                                    velocity, so the flakes streak the way they pass the dome
//     hero.update(parkCam)           headlamps parked at the entry pose while the world is seen through a portal
//     hero.setSmokeRim / setLander   cold rim on the smoke column for the long views; lander lamps eased down on the rise
//     beams uBeamK, uBeamIn          each lander cone thins as the eye comes into it (the lit snow shows the beam instead);
//                                    uBeamIn tells the shader whether the eye is inside the hull (it then counts far faces)
//   THE GAZE (pois, 3h): inGaze on the way in (the star, the entry chimney, the lander: GAZE_IN), tourGaze from the notch to F3 (the reveal with the tower whole, the field,
//   the mound, the hero pool, the trunk and the swimmer), then fallGaze from F3 to the ring. The camera never banks (camera.bank 0): the
//   pools are level. fallGaze is weight 1 and listed twice: for the default camera the second entry changes nothing, for
//   the steady camera (which calms every poi by 0.65) it takes the pull from 0.35 to 0.58.
//   THICKET_B (bearings) places the twelve worm thickets that stand on the trunk at eye height round the tour (hero
//   opts.passThickets); LEDGES (3c) is where the hero stood them, and 3e builds a ledge under each.
//   ADDED SINCE (a polish of the live version: no line of its code was changed or removed; one of its comments, the one
//   over addSpire, was put right)
//     THE FEET (3e)    every spire that stands on the bed (the 46 and their side pipes, the second rank, the worm mound and
//                      its shoulders, the entry chimney and its two) lets a talus apron of its own stone fall from every place
//                      of its lowest ring that stands over the bed, outward and down: at 35 degrees until it is under the bed
//                      where the fall has room (about half of the rays that hang); the others end early (at twice the foot's
//                      radius, a lip, the carve under the route, a seat, or a step past such a neighbour) and fall steeper, in
//                      one even slope. A fan long downhill, short uphill, lumpy; its stone is the foot's own, and the bed's
//                      own stone lies over it by each row's share of the fall (mesh 'apron-hems': the bed's shader, HEM), so
//                      what shows changes evenly from the foot's at the ring to the bed's where they meet; addSpire lists
//                      those rings in acc.feet. Only the corbel ledges, which stand out of the trunk, have none. The aprons
//                      come last in the mesh: every older vertex and index keeps its number. No chance is drawn. In 3g, once
//                      the crabs and clams are seated, every apron ends short of every seat, and a crab or a clam that the
//                      stone walls in under a foot is not drawn (THE APRONS AND THE SEATS).
//     (the roll of the spill lips leaning with the pool's swell is the part's: see its header.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep, makeRng } from '../kit/core.js';
import { buildHero, LAMP_GLSL, NOISE_GLSL, bearing } from '../parts/mirror-chimneys.js';

const PALETTE = ['#03060C', '#B8862F', '#7A3418', '#E9E2CF', '#C4D3DA', '#D21F2B', '#BFE6FF'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const RAD = Math.PI / 180, TAU = Math.PI * 2;
const f32 = (a, n) => new THREE.Float32BufferAttribute(a, n);

// =============================================================================================
// 1. GLSL
// =============================================================================================
const FOG_V = /* glsl */`#include <common>
#include <fog_pars_vertex>
`;
const FOG_F = /* glsl */`#include <common>
#include <fog_pars_fragment>
`;

// ---- the water's tone in a direction (see HAZE_F, which draws it behind everything; BED_F takes it where the bed ends): our own
// lamps scattered back round the gaze, the lit water lying over the field along the level of the eye, in slow drifting billows
const WATER_GLSL = /* glsl */`
vec3 mcWater(vec3 D, vec3 lampDir, float time, vec3 bg, vec3 hazeK, float haze){
  float fwd = max(dot(D, lampDir), 0.0);
  float n = mcN(D * 2.6 + vec3(time * 0.013, -time * 0.008, 0.0)), n2 = mcN(D * 7.0 + vec3(0.0, time * 0.02, 3.0));
  float lv = (D.y + 0.04) / 0.34;
  float h = clamp((0.16 + 0.60 * fwd * fwd * fwd + 0.46 * exp(-lv * lv)) * (0.78 + 0.34 * n + 0.10 * n2) * (1.0 - 0.6 * smoothstep(0.35, 1.0, D.y)), 0.0, 1.0);
  // (the grade's toe is steep: under about 0.055 everything is black and by 0.08 it is mid slate, so the whole of the haze
  // lives between these two colours)
  // (and the toe takes red first: at (0.050, 0.054, 0.060) the open water came out (0, 0, 30), black with a blue cast. These two
  // ends come out near (14, 23, 44) and (24, 35, 58): a dark slate with all three channels alive, in every look)
  return bg + mix(vec3(0.0668, 0.0650, 0.0674), vec3(0.0704, 0.0711, 0.0782), h) * hazeK * haze;
}`;
// ---- the bed: pillow basalt, white bacterial mat in the low places, orange iron floc in the hollows
const BED_V = /* glsl */`
${FOG_V}
attribute vec3 aBed; attribute float aSteep; varying vec3 vW; varying vec3 vN; varying vec3 vB; varying float vS;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vB = aBed; vS = aSteep;
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BED_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
${WATER_GLSL}
uniform float uTime, uFlow, uVant, uFill, uHaze; uniform vec3 uMat, uOchre, uRust, uHazeK; uniform vec4 uEnd;
varying vec3 vW; varying vec3 vN; varying vec3 vB; varying float vS;
void main(){
  vec3 N = normalize(vN); vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  float near = 1.0 - smoothstep(12.0, 38.0, dE);
  float fw = length(fwidth(vW)); float k1 = 1.0 - smoothstep(0.12, 0.45, fw), k2 = 1.0 - smoothstep(0.03, 0.12, fw);
  vec4 cv1 = mcCellV(vec3(vW.x * 0.8, vW.y * 0.35, vW.z * 0.8)); vec3 g1 = cv1.xyz * vec3(0.8, 0.35, 0.8); float c1 = cv1.w, dm1 = sqrt(max(1.0 - c1 * c1 * 1.5, 0.0));
  // THE GRAIN ON STEEP FACES: the pillows' cells above stand 2.3 times taller than wide (y is read at 0.35, x and z at 0.8). A
  // level bed, cut across them, never shows it; a wall shows pillows drawn out down the slope, and the mat in their seams as
  // long smears. Where the bed stands steep (vS: 0 up to 42 degrees from level, 1 from 60, from the bed's own normal) the
  // pillows are read round, with the grain of the level bed
  if (vS > 0.0) { vec4 cvS = mcCellV(vW * 0.8 + 4.0); float dmS = sqrt(max(1.0 - cvS.w * cvS.w * 1.5, 0.0)); g1 = mix(g1, cvS.xyz * 0.8, vS); c1 = mix(c1, cvS.w, vS); dm1 = mix(dm1, dmS, vS); }
  float dome = mix(0.6, dm1, k1);
  vec4 cv2 = mcCellV(vW * 3.3 + 2.0); float c2 = cv2.w, dm2 = sqrt(max(1.0 - c2 * c2 * 1.7, 0.0)); float d2 = mix(0.6, dm2, k2);
  float fine = mcF(vW * 6.0);
  float big = mcF(vW * 0.33 + 11.0);
  // the pillows' slopes come from the pillows themselves (smooth close to: screen differences shade in 2 x 2 pixel blocks);
  // only the grain still uses them, and only where a pixel is smaller than it
  float hk = 0.3 + 0.7 * near;
  float h = fine * 0.03 * near * (1.0 - smoothstep(0.010, 0.026, fw)) * hk;
  vec3 dpx = dFdx(vW), dpy = dFdy(vW); float hx = dFdx(h), hy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 sg = sign(det) * (hx * r1 + hy * r2);
  vec3 G = (g1 * (1.5 * 0.26 * k1 / max(dm1, 0.4)) * smoothstep(0.0, 0.25, dm1) + cv2.xyz * (5.61 * 0.06 * near * k2 / max(dm2, 0.4)) * smoothstep(0.0, 0.25, dm2)) * hk;
  G -= N * dot(G, N);
  N = normalize(abs(det) * (N - G * 1.2) - sg * 1.2 + N * 1e-5);
  float crack = smoothstep(0.62, 0.98, c1) * k1;
  // THE GRAIN'S RANGE: the fine grain (a sixth of a metre across) was the one term of the bed's tone that no range thinned.
  // Far off its period falls under two pixels and it crawls as the lens moves, most on a face turned to the eye. By the
  // distance from the eye alone, as a texture thins, it gives way to its own mean (0.469): from 60 m, where its period is
  // 2 pixels of a frame 1920 wide (0.65 of one 640 wide), to 100 m, where it is 1.2 (0.39). Within 60 m the line is not run
  // and the bed is as it was: 85 to 92 in 100 of the bed's pixels nearer than the last stretch (counted from the route); the
  // lander's ground, 50 to 71 m from the eye, loses 0.08 of its grain at most on the mean; the last stretch, 77 to 193 m
  // off, where the crawl was, loses 0.39 of it at 77 m and all of it from 100 m. (From 20 m, two pixels of a frame 640 wide, the lander's ground from the
  // vantage lost its grain whole, 0.15 of its fine contrast, and at 1920 the pillows 40 to 60 m off went smooth: not taken)
  if (dE > 60.0) fine = mix(fine, 0.469, smoothstep(60.0, 100.0, dE));
  vec3 glass = vec3(0.135, 0.135, 0.150) * (0.55 + 0.9 * fine) * (0.7 + 0.5 * d2);
  glass = mix(glass, uRust * 0.30, smoothstep(0.55, 0.8, big) * 0.5);
  // mat: in the seams between pillows, in the low places and along the fissure, stirring in the flow
  float seam = 1.0 - dome;
  float mm = vB.x * 1.25 + mix(0.32, seam, k1) * 0.85 + (mcF(vW * 0.7 + 3.0) - 0.5) * 0.9 - 0.20;      // (too far off to see the seams, the mat they hold still lies in pale patches)
  float matMask = smoothstep(0.22, 0.5, mm);
  float stir = mcN(vec3(vW.x * 1.9 - uTime * 0.8 * uFlow, vW.y * 1.5, vW.z * 1.9 + sin(uTime * 0.27 + vW.x * 0.4) * 0.25));
  float fur = mcN(vec3(vW.x * 8.0 - uTime * 0.7 * uFlow, vW.y * 8.0, vW.z * 15.0 + sin(uTime * 0.9 + vW.x) * 0.3));
  vec3 matc = uMat * (0.50 + 0.56 * stir + 0.24 * fur * near);          // the mat streams: light and dark run down the flow
  vec3 alb = mix(glass, matc, matMask);
  float fl = smoothstep(0.42, 0.68, vB.y + (mcF(vW * 1.2 + 17.0) - 0.5) * 0.9) * (1.0 - matMask * 0.8);
  alb = mix(alb, mix(uOchre, uRust, 0.35 + 0.4 * fine) * 0.85, fl * 0.85);
  alb *= mix(0.22, 1.0, vB.z) * (1.0 - 0.7 * crack * (1.0 - matMask));
  alb = mix(alb, vec3(dot(alb, vec3(0.35, 0.5, 0.15))) * vec3(0.66, 0.88, 1.16), smoothstep(18.0, 70.0, dE) * 0.85);      // beyond the lamps colour drifts to blue-grey (as on the rock): far floc under sodium lamps went olive
  vec3 E = mcLight(vW, N, dE);
  float mE = max(E.r, max(E.g, E.b)); E *= mE > 1.0 ? (1.0 + (mE - 1.0) * 0.45) / mE : 1.0;      // a knee: the mat under the lander's beam keeps its streaming pattern, it does not burn to a white plate
  vec3 col = alb * E;
  // across the north vantage (uVant) the bed between the tower and the lander has to read from 40 m with the lamps looking
  // up at the ring: the lander's lamps spill a pool of cold light on the ground round it, and the pale slate of the lit
  // water lies on every upward face, so the field is pale mat on dark pillows and never a black floor. Round the tour
  // (uFill) the same pale fill lies, weaker, on the bed beyond the headlamps' reach: the field is a floor, not a void
  vec3 Lp = uLandPos[1] - vW; float dl = length(Lp);
  float wrapL = 0.35 + 0.65 * max(dot(N, Lp / max(dl, 1e-3)), 0.0);
  vec3 fillC = mix(vec3(dot(uScatter, vec3(0.3333))), uScatter, 0.08) * (0.45 + 0.55 * N.y);
  col += alb * (uVant * uLandCol * uLandI * 0.20 * wrapL / (1.0 + dl * dl / 500.0) * exp(-uAbsorb * dE) + fillC * 17.0 * max(uVant, uFill * smoothstep(7.0, 24.0, dE)) * exp(-uAbsorb * dE * 0.4));
  col = mix(col, vec3(dot(col, vec3(0.30, 0.55, 0.15))) * vec3(0.74, 0.92, 1.14), smoothstep(18.0, 60.0, dE) * 0.8);      // far off, whatever lit it, the bed is blue-grey: sodium light on the slate fill went olive
  // glassy rind: a tight glint that turns with the lamps
  col += uLampCol * uLampI * (1.0 - matMask) * (1.0 - fl) * mcGlint(vW, N, V, 70.0) * 0.10 * exp(-uAbsorb * 2.0 * dE) / (1.0 + dE / uLampFall);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
  // THE BED'S END: the bed is a mesh and it stops (uEnd: its four ends). Over its last stretch, the last 18 m before an end
  // or from 102 m out from the middle (rawH raises the same stretch in hills), it takes the tone the water shows in its own
  // direction (mcWater, the dome's own law with the dome's own values): none where the stretch begins, its whole share from
  // seven tenths of the way up. THE SHARE (the far hills, see THE FAR HILLS: their ground wears this shader on the stretch and
  // beyond the end): 0.86 as far as the bed's end, 0.91 from 40 m beyond it, and all of it from 48 to 60 m beyond, where
  // that ground stops. So the hills keep 0.14 to 0.09 of their own tone and stand against the water as low, dim ground, the
  // nearer row the darker, and no edge stands where the ground ends. (In pictures: keeping 0.25 to 0.12 the crest stood 15
  // levels under the water behind it, keeping 0.14 to 0.06 it stood 7, as built 8.5 to 9.7; the site's bed end 33 to 35.) By the
  // fissure's mouth (west: within 24 m of z 4, the share whole from 46 m) the melt runs to all, as before. Nearer than the
  // stretch the weight is 0 and the line is not run: the bed is as it was. Nothing stands on the melting stretch or beyond
  // it (seeds 1 to 40: the chimneys' aprons reach 89 m out and stop 27 m short of an end)
  float bE = min(min(vW.x - uEnd.x, uEnd.y - vW.x), min(vW.z - uEnd.z, uEnd.w - vW.z)), rE = length(vW.xz), eE = max(-bE, rE - 118.0);
  float wEnd = smoothstep(0.0, 0.7, max(1.0 - smoothstep(0.0, 18.0, bE), smoothstep(102.0, 118.0, rE))) * mix(1.0, 0.86 + 0.05 * smoothstep(0.0, 40.0, eE) + 0.09 * smoothstep(48.0, 60.0, eE), vW.x < 0.0 ? smoothstep(24.0, 46.0, abs(vW.z - 4.0)) : 1.0);
  if (wEnd > 0.0) gl_FragColor.rgb = mix(gl_FragColor.rgb, mcWater(-V, uLampDir, uTime, fogColor, uHazeK, uHaze), wEnd);
}`;
// ---- the aprons' hem (THE FEET, "Its stone"): the bed's own two shaders, word for word, on an apron's vertices. aHem holds what
// aBed holds, the bed's three values under the vertex, and fourth how far the bed's stone lies over the rock there (the alpha)
const HEM_V = BED_V.replace('attribute vec3 aBed;', 'attribute vec4 aHem; varying float vIn;').replace('vB = aBed;', 'vB = aHem.xyz; vIn = aHem.w;');
const HEM_F = BED_F.replace('varying vec3 vB;', 'varying vec3 vB; varying float vIn;').replace('gl_FragColor = vec4(col, 1.0);', 'gl_FragColor = vec4(col, clamp(vIn, 0.0, 1.0));');

// ---- shared fragment of every creature and of the lander. vC albedo, vG gloss 0..1 (2 = a burning lens)
const CRIT_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform float uFoul, uSoft, uFish; uniform vec3 uMat;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vG; varying vec3 vL;
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  vec3 N = normalize(vN + V * 1e-4); if (dot(N, V) < 0.0) N = -N;
  float lens = step(1.5, vG), gloss = min(vG, 1.0);
  float thin = uSoft * (1.0 - smoothstep(0.06, 0.2, vG));          // soft bodies: gloss under 0.1 marks the thin parts (web, fins)
  vec3 alb = vC;
  // eelpout (uFish): a mottled grey back, a paler belly, a dark eye on each cheek (in the fish's own frame: z along, y back)
  float eyeF = 1.0 - smoothstep(0.013, 0.027, length(vec3(abs(vL.x) - 0.072, vL.y - 0.030, vL.z - 0.385)));
  alb *= mix(1.0, mix(1.12, 0.50 + 0.22 * mcF(vL * 21.0), smoothstep(-0.03, 0.07, vL.y)) * (1.0 - 0.92 * eyeF), uFish);
  float up = smoothstep(0.25, 0.9, N.y) * smoothstep(0.38, 0.6, mcF(vW * 3.1)) + 0.35 * smoothstep(0.55, 0.75, mcF(vW * 5.0 + 4.0));
  alb = mix(alb, uMat * 0.8, clamp(up, 0.0, 1.0) * uFoul * (1.0 - lens));
  vec3 E = mcLight(vW, normalize(N + V * mix(0.25, 0.04, uSoft)), dE);
  E /= 1.0 + mix(0.45, 0.22, uSoft) * max(max(E.r, E.g), E.b);          // a pale body a metre from the lamps must not burn out and bloom: nothing here glows
  float ndv = max(dot(N, V), 0.0);
  // a soft body is lit from where we sit, so its form has to come from the turn of the surface: a lit cheek facing us, the
  // flanks falling to a third, freckled in its own skin (vL, not the water it swims through)
  alb *= mix(1.0, (0.70 + 0.36 * mcF(vL * 9.0) + 0.26 * mcF(vL * 31.0 + 5.0)) * (0.26 + 0.74 * ndv * sqrt(ndv)), uSoft * (1.0 - lens));
  vec3 col = alb * E;
  col += uSoft * uScatter * 2.2 * vC * pow(max(1.0 - ndv, 0.0), 3.0);                                  // the slate of the water on the turning edge
  col += min(thin * vC * vec3(1.0, 0.50, 0.36) * mcLight(vW, V, dE) * (0.22 + 0.9 * pow(max(1.0 - ndv, 0.0), 1.5)), vec3(0.42, 0.26, 0.22));   // lamp light glowing through the thin web and fins (capped: a glow, never a lit sign)
  col += uLampCol * min(uLampI * gloss * mcGlint(vW, N, V, 46.0) * 0.45 * exp(-uAbsorb.y * 2.0 * dE) / (1.0 + dE / uLampFall), 1.2);
  col = mix(col, uLandCol * (3.5 + 3.0 * pow(max(dot(N, V), 0.0), 3.0)), lens);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- the eelpout's skin: CRIT_F with the fish's two lines written again, so that a fish that bolts past the dome is a fish and
// not a smooth spindle: a dark eye in a pale ring, the gill cover's edge, the mouth's cleft, dark saddles down the back, and the
// long fin apart from the body (the outer part of the tail's height: paler, rayed). All in the fish's own frame (vL)
// The saddles' and the rays' figures are choices of the drawing, not measures of an eelpout: the saddles from a noise whose
// cells are a fifteenth of the fish's length, 0.45 deep where it is dark; the rays 0.019 of its length apart (37 down the
// long fin), 0.44 to 1 of the fin's tone
const FISH_F = CRIT_F.replace(`  float eyeF = 1.0 - smoothstep(0.013, 0.027, length(vec3(abs(vL.x) - 0.072, vL.y - 0.030, vL.z - 0.385)));`, `  float eDf = length(vec3(abs(vL.x) - 0.074, vL.y - 0.030, vL.z - 0.385));
  float eyeF = 1.0 - smoothstep(0.019, 0.028, eDf), eyeR = (1.0 - smoothstep(0.036, 0.046, eDf)) * (1.0 - eyeF);
  float saddle = smoothstep(0.42, 0.62, mcN(vec3(vL.z * 15.0 + 0.5 * sin(vL.y * 38.0), 2.0, abs(vL.x) * 6.0)));
  float finF = smoothstep(0.050, 0.078, abs(vL.y)) * smoothstep(0.18, -0.10, vL.z), ray = 0.72 + 0.28 * sin(vL.z * 330.0 + abs(vL.y) * 70.0);
  float gill = (1.0 - smoothstep(0.004, 0.011, abs(vL.z - 0.292 + 9.0 * vL.y * vL.y))) * (1.0 - smoothstep(0.06, 0.085, abs(vL.y)));
  float mouth = (1.0 - smoothstep(0.003, 0.008, abs(vL.y + 0.012))) * smoothstep(0.405, 0.43, vL.z);`).replace(`  alb *= mix(1.0, mix(1.12, 0.50 + 0.22 * mcF(vL * 21.0), smoothstep(-0.03, 0.07, vL.y)) * (1.0 - 0.92 * eyeF), uFish);`, `  alb *= mix(1.0, mix(mix(1.12, (0.62 + 0.22 * mcF(vL * 21.0)) * (1.0 - 0.45 * saddle), smoothstep(-0.03, 0.07, vL.y)), 1.25 * ray, finF) * (1.0 - 0.5 * max(gill, mouth)) * (1.0 + 0.5 * eyeR) * (1.0 - 0.94 * eyeF), uFish);`);

// ---- the swimmer's skin: wine red and half transparent. Its form comes from our two lamps where they stand (the side turned
// to them lit, the far side falling to black), its parts are painted in its own frame (eight pale arms down the web, on both
// its faces; a dark eye in a pale ring low on each cheek; pale areolae), the gut shows faintly through the mantle (the sight
// line is followed through the skin to an ellipsoid of viscera, in the animal's own frame: uEyeL is the eye there), the
// turning edge takes a cold rim from the lander's lamps, brightest when
// the lander is behind it, and the lamps glow dimly through the thin web. Nothing in it reaches white: the
// rim is capped at a dim slate, the fins (vFin) take none of it, and the wet glint is a rose pin.
const SWIM_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform vec3 uEyeL;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vG; varying vec3 vL; varying float vFin;
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  vec3 N = normalize(vN + V * 1e-4); if (dot(N, V) < 0.0) N = -N;
  float ndv = max(dot(N, V), 0.0), rim1 = 1.0 - ndv;
  float thin = 1.0 - smoothstep(0.06, 0.2, vG), fin = clamp(vFin * 3.0, 0.0, 1.0);          // fin: 1 on the two ear fins (flat paddles: a rim term lit the whole of one as a white flap)
  // skin: freckled with dark chromatophores, faintly banded round the mantle
  float fr = mcF(vL * 11.0), sp = smoothstep(0.52, 0.70, mcN(vL * 46.0 + 3.0));
  vec3 alb = vC * (0.74 + 0.5 * fr) * (1.0 - 0.45 * sp) * (0.92 + 0.08 * sin(vL.y * 60.0 + fr * 4.0));
  // the eight arms: a pale line from the neck to each point of the web's rim (dArm: how far this point of the skin lies from
  // the nearest arm, in the animal's own units; a line 4 cm across on the 1.5 m animal), on the web's upper face and its
  // under face alike, and none at the mouth. Pale areolae: one in about half of the 19 cm cells of the skin, 6 to 10 cm across
  float ang = atan(vL.z / 0.94, vL.x), rad = length(vec2(vL.x, vL.z / 0.94));
  float dArm = abs(fract(ang * 1.2732395 + 0.5) - 0.5) * 0.7853982 * rad;
  float armL = (1.0 - smoothstep(0.008, 0.020, dArm)) * smoothstep(0.03, -0.07, vL.y) * smoothstep(0.05, 0.10, rad) * (1.0 - fin);
  vec4 cs = mcCellV(vL * 8.0);
  float spot = (1.0 - smoothstep(0.15, 0.27, cs.w)) * step(0.45, mcH(floor(vL * 8.0 + cs.xyz) + 0.5)) * (1.0 - fin);
  alb = mix(alb, vec3(0.72, 0.42, 0.37) * (0.85 + 0.3 * fr), max(armL * 0.7, spot * 0.4));
  // the core: how much of the viscera the sight line crosses behind this point of the skin
  vec3 dl = normalize(vL - uEyeL + vec3(1e-5, 0.0, 0.0)), rr = vec3(0.118, 0.160, 0.112);
  vec3 oc = (vL - vec3(0.0, 0.205, 0.0)) / rr, dc = dl / rr;
  float qa = dot(dc, dc), qb = dot(oc, dc), qd = qb * qb - qa * (dot(oc, oc) - 1.0);
  float core = qd > 0.0 ? clamp(2.0 * sqrt(qd) / qa / 0.26, 0.0, 1.0) * step(-0.05, (-qb - sqrt(qd)) / qa + 0.12) : 0.0;
  core *= 1.0 - thin;
  // a dull dark eye low on each cheek, painted (no bead, no highlight): a disc 15 cm across in a pale ring 3 cm wide
  vec3 ep = vec3(abs(vL.x) - 0.185, vL.y - 0.105, vL.z + 0.175); float eD = length(ep), eye = 1.0 - smoothstep(0.044, 0.056, eD), ering = (1.0 - smoothstep(0.066, 0.080, eD)) * (1.0 - eye);
  alb = mix(alb, vec3(0.74, 0.44, 0.39), ering * 0.85);
  alb = mix(alb, vec3(0.05, 0.012, 0.016), max(0.30 * core, eye * 0.95));      // (the gut is a faint darker heart inside the bell: at 0.88 it was a hole in the mantle)
  vec3 E = mcLight(vW, N, dE);                                            // each lamp from where it stands, on the skin's own turn
  float mE = max(max(E.r, E.g), E.b); E *= mE > 1.0 ? (1.0 + (mE - 1.0) * 0.5) / mE : 1.0;      // a knee over 1 (a metre or four from the lamps: lit, never burnt out)
  vec3 col = alb * E * 0.36;             // wine: the face turned to the lamps comes out near 0.2 at 4 to 5 m, the flank at half of it, the limb black (the grade lifts anything over 0.2 to rose and drops anything under 0.06 to black)
  // the turning edge: light from behind comes through it. Slate of the water, and the lander's cold lamps when they stand behind
  vec3 Ll = normalize(uLandPos[1] - vW); float back = max(dot(-V, Ll), 0.0);
  float edge = rim1 * rim1 * sqrt(rim1);
  // (a thin cold line and no more: capped well under white, and none on the fins. At 0.15 uncapped it ringed the mantle in grey-white)
  col += min(uLandCol * (0.16 + 0.84 * back * back) * edge * 0.06 * uLandI * (1.0 - 0.86 * thin) * mix(vec3(1.0), vC * 2.2, 0.25 + 0.65 * thin), vec3(0.085, 0.095, 0.115)) * (1.0 - fin);      // (the web is thin all over, not only at its edge: what comes through it is wine, and less)
  col += uScatter * 1.1 * vC * edge * (1.0 - fin);
  // the lamps through the thin web: a wine glow, capped
  col += min(thin * vC * vec3(1.0, 0.42, 0.34) * mcLight(vW, V, dE) * (0.05 + 0.25 * rim1), vec3(0.075, 0.020, 0.022));
  col += mix(uLampCol, vC * 2.4, 0.6) * min(uLampI * vG * mcGlint(vW, N, V, 420.0) * 0.5 * exp(-uAbsorb.y * 2.0 * dE) / (1.0 + dE / uLampFall), 0.05) * (1.0 - fin);   // a pin of wet glint, rose, never white
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- instanced crawlers on a surface: aPos xyz + seed, aNrm the surface normal. uv.x = limb weight, uv.y = limb phase
const CRAWL_V = /* glsl */`
${FOG_V}
attribute vec4 aPos; attribute vec3 aNrm; attribute vec4 aCol;
uniform float uTime, uSize, uRange, uSeethe, uWave;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vG; varying vec3 vL;
void main(){
  vL = position;
  float sd = aPos.w; vec3 n = normalize(aNrm + vec3(0.0, 1e-4, 0.0));
  vec3 t1 = normalize(cross(n, vec3(0.0, 1.0, 0.0)) + vec3(2e-3, 0.0, 1e-3)); vec3 t2 = normalize(cross(n, t1));
  float ph = sd * 61.0, f = (0.5 + fract(sd * 7.0)) * uSeethe;
  vec2 w = vec2(sin(uTime * f + ph) + 0.5 * sin(uTime * f * 2.3 + ph * 1.7), cos(uTime * f * 0.8 + ph * 2.1) + 0.5 * sin(uTime * f * 1.9 + ph)) * uRange * min(length(aNrm), 1.0);
  float hd = ph + sin(uTime * f * 0.6 + ph) * 2.0 * step(1e-4, uRange);
  float ca = cos(hd), sa = sin(hd);
  vec3 fwd = t1 * ca + t2 * sa, rt = t2 * ca - t1 * sa;
  float s = uSize * (0.7 + 0.6 * fract(sd * 13.0));
  vec3 lp = position;
  lp.y += uv.x * (0.5 + 0.5 * sin(uTime * (1.2 + 2.0 * fract(sd * 3.0)) * uWave + ph + uv.y * 3.14159)) * 0.55 * step(1e-4, uWave);
  lp *= s;
  vec3 p = aPos.xyz + t1 * w.x + t2 * w.y + rt * lp.x + n * lp.y + fwd * lp.z;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(rt * normal.x + n * normal.y + fwd * normal.z);
  vC = aCol.rgb * (0.8 + 0.4 * fract(sd * 29.0)); vG = aCol.a;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---- eelpout: hang tail-down in the shimmer, then dart out along aOut when uBurst passes their delay
const FISH_V = /* glsl */`
${FOG_V}
attribute vec4 aHome; attribute vec4 aOut; attribute vec4 aCol;
uniform float uTime, uBurst, uSize;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vG; varying vec3 vL;
void main(){
  vL = position;
  float sd = aHome.w;
  float k = clamp(uBurst - aOut.w, 0.0, 3.0) * step(aOut.w, 9.0);   // delay >= 9: this fish never bolts
  float go = 1.0 - exp(-k * 2.6);
  vec3 od = normalize(aOut.xyz + vec3(0.0, 1e-3, 0.0));
  vec3 hang = normalize(vec3(sin(sd * 40.0) * 0.25 + 0.2, 1.0, cos(sd * 31.0) * 0.25));
  vec3 A = normalize(mix(hang, od, smoothstep(0.0, 0.25, k)) + vec3(1e-4, 0.0, 0.0));
  vec3 ex = normalize(cross(A, vec3(0.31, 0.12, 0.94)) + vec3(1e-4, 0.0, 0.0)); vec3 ey = cross(A, ex);
  float dart = exp(-k * 1.5) * step(0.001, k);
  float tail = clamp(0.5 - position.z, 0.0, 1.0);
  float beat = sin(uTime * (2.2 + 9.0 * dart) + sd * 50.0 - tail * 5.0) * (0.035 + 0.10 * dart) * tail * tail * 2.0;
  vec3 lp = position; lp.x += beat;
  lp *= uSize * (0.8 + 0.4 * fract(sd * 9.0));
  vec3 base = aHome.xyz + od * go * (1.9 + 1.6 * fract(sd * 5.0)) + vec3(sin(uTime * 0.5 + sd * 20.0), sin(uTime * 0.37 + sd * 9.0), cos(uTime * 0.43 + sd * 14.0)) * 0.10;
  vec3 p = base + ex * lp.x + ey * lp.y + A * lp.z;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vW = wp.xyz; vN = normalize(ex * normal.x + ey * normal.y + A * normal.z);
  vC = aCol.rgb; vG = aCol.a;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---- soft bodies and rigid props placed by their matrix. uv.x = fin weight (rows), uv.y = skirt weight (pulses)
const SOFT_V = /* glsl */`
${FOG_V}
attribute vec4 aCol; uniform float uTime, uRow;
varying vec3 vW; varying vec3 vN; varying vec3 vC; varying float vG; varying vec3 vL; varying float vFin;
void main(){
  vL = position;
  vec3 lp = position;
  float fin = uv.x, sk = uv.y;
  vFin = uv.x * (1.0 - step(0.5, uv.y));                           // the swimmer's two ear fins (its arm tips also row, with uv.y 1)
  float st = sin(uTime * 2.6 * uRow - abs(lp.x) * 5.0);
  lp.y += fin * st * 0.16; lp.z += fin * cos(uTime * 2.6 * uRow - abs(lp.x) * 5.0) * 0.05;
  float pu = sin(uTime * 1.5 * uRow - lp.y * 2.0);
  lp.xz *= 1.0 + sk * 0.20 * pu; lp.y += sk * 0.05 * cos(uTime * 1.5 * uRow);
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0.0, 1e-5, 0.0));
  vC = aCol.rgb; vG = aCol.a;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// ---- bubbles: one camera-facing quad each; the fragment shader builds the sphere (its normal from the quad's own
// coordinate), so the outline is a true circle at any size and never a faceted disc. aB x, y0, z, seed; aB2 speed, column
// height, size at the foot, size at the top. Big ones are caps: the lower half is flattened.
const BUB_V = /* glsl */`
${FOG_V}
attribute vec4 aB; attribute vec4 aB2; uniform float uTime;
varying vec3 vCen; varying vec2 vQ; varying vec3 vSz;
void main(){
  float sd = aB.w, H = max(aB2.y, 0.1);
  float fr = fract(sd * 7.31 + uTime * aB2.x / H);
  float size = mix(aB2.z, aB2.w, fr * fr);
  float wob = sin(uTime * (5.0 + 4.0 * fract(sd * 3.0)) / (1.0 + size * 6.0) + sd * 40.0);
  float domeK = smoothstep(0.10, 0.22, size);
  float end = smoothstep(0.0, 0.03, fr) * (1.0 - smoothstep(0.96, 1.0, fr));
  vec3 c = vec3(aB.x, aB.y + fr * H, aB.z);
  c.x += sin(uTime * 1.3 + sd * 17.0 + fr * 9.0) * (0.05 + size * 0.5); c.z += cos(uTime * 1.1 + sd * 11.0 + fr * 7.0) * (0.05 + size * 0.5);
  vec2 rad = size * end * vec2((1.0 + 0.16 * wob) * (1.0 + 0.3 * domeK), 1.0 - 0.16 * wob);      // it wobbles: wider as it is lower
  vec4 mv = viewMatrix * modelMatrix * vec4(c, 1.0);
  mv.xy += position.xy * rad * 1.06;                              // (a margin for the soft edge)
  vCen = (modelMatrix * vec4(c, 1.0)).xyz; vQ = position.xy * 1.06; vSz = vec3(rad, size);
  vec4 mvPosition = mv; gl_Position = projectionMatrix * mv;
  #include <fog_vertex>
}`;
const BUB_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform float uBubWarm;
varying vec3 vCen; varying vec2 vQ; varying vec3 vSz;
void main(){
  float domeK = smoothstep(0.10, 0.22, vSz.z);
  vec2 q = vQ; q.y = q.y < 0.0 ? q.y / mix(1.0, 0.60, domeK) : q.y;          // a big one is a cap: round above, a shallow belly below
  float r2 = dot(q, q), r = sqrt(r2), fw = max(fwidth(r), 1e-4);
  float cov = 1.0 - smoothstep(1.0 - 1.5 * fw, 1.0, r);
  if (cov < 0.004) discard;
  vec3 nl = vec3(q, sqrt(max(1.0 - r2, 0.0)));
  vec3 N = normalize(nl * mat3(viewMatrix) + vec3(0.0, 1e-5, 0.0));          // out of the view frame into the world's
  vec3 vW = vCen + N * max(vSz.x, vSz.y);
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  float nv = nl.z, e1 = 1.0 - nv, e2 = e1 * e1;
  // a bubble under water is a mirror round its edge and clear in the middle; the band is brightest over its cap, where it
  // gives the lamps back, and all but gone underneath: a lit dome with a fine bright line round its outline, never a ring
  float cap = smoothstep(-0.35, 0.85, N.y), band = 1.0 - smoothstep(0.40, 0.92, nv);
  float rim = band * (0.20 + 0.80 * cap);
  float line = 0.5 * e2 * e2 * e2 * (0.45 + 0.55 * cap);
  float frost = 0.75 + 0.25 * mcN(vW * 60.0 / (1.0 + vSz.z * 20.0));
  vec3 E = mcLight(vW, V, dE) + mcLight(vW, -V, dE) * 0.6;
  float gl = mcGlint(vW, N, V, 150.0);                                       // one pin of glint
  // the side that faces the tower gives back its lit stone: a dim gold patch on the body of every bubble, so each is a small
  // lit dome with weight and not an outline
  // (placed on the face we see: toward the tower as the picture has it, and upward of the middle)
  vec2 tw = (mat3(viewMatrix) * vec3(-vCen.x, 0.0, -vCen.z)).xy; tw = tw / max(length(tw), 1e-3) + vec2(0.0, 0.7);
  vec2 qw = q - 0.40 * tw / max(length(tw), 1e-3); float warm = exp(-dot(qw, qw) / 0.075) * (0.35 + 0.65 * nv);
  // (the band gives back the lit water, brighter than the water behind it over the cap; underneath it is a thin dark edge)
  vec3 col = (vec3(0.80, 0.90, 0.96) * min(E, vec3(1.1)) * (rim * 0.66 + 0.05 + line) + vec3(0.185, 0.204, 0.240) * (rim * (0.55 + 1.05 * cap) + 1.5 * line) + vec3(1.0, 0.70, 0.38) * warm * uBubWarm * exp(-uAbsorb * dE)) * frost
           + uLampCol * min(uLampI * gl * 0.5 * exp(-uAbsorb.y * 2.0 * dE) / (1.0 + dE / uLampFall), 0.8);
  float a = clamp(band * 0.42 + rim * 0.48 + 0.05 + 0.45 * warm + gl * 0.5 + line, 0.0, 1.0) * cov;      // (the band always carries a little more than the water's own glow: a bubble is never a dark bead against it)
  gl_FragColor = vec4(col, a);
  #include <fog_fragment>
}`;

// ---- the rare mercury bell: a wobbling, rising drop of the pool with a tail. uRise 0..1
const BELL_V = /* glsl */`
${FOG_V}
uniform float uTime, uRise; varying vec3 vW; varying vec3 vN;
void main(){
  vec3 lp = position;
  float w1 = sin(uTime * 2.1 + lp.y * 1.6), w2 = sin(uTime * 1.6 + lp.x * 1.7 + 1.7), w3 = cos(uTime * 1.9 + lp.z * 1.8);
  float skirt = smoothstep(0.35, -0.25, lp.y);                                                    // the rim of the bell flares and ripples
  float ang = atan(lp.z, lp.x + step(abs(lp.x) + abs(lp.z), 1e-4) * 1e-3);                        // never atan(0, 0): the sphere's poles sit on the axis
  lp.xz *= (1.08 + 0.10 * w1) * (1.0 + 0.10 * skirt * (1.0 + 0.5 * sin(ang * 5.0 + uTime * 2.4)));
  lp.y = lp.y > 0.0 ? lp.y * (1.0 - 0.08 * w1) : lp.y * (0.55 + 0.06 * w2);                      // a bell: round above, a shallower bowl below
  lp.x += 0.06 * w3; lp.z += 0.06 * w2;
  vec3 n = normalize(vec3(normal.x, normal.y > 0.0 ? normal.y : normal.y * 1.7, normal.z) + vec3(w2, -w1, w3) * 0.14 + vec3(0.0, 1e-4, 0.0));
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BELL_F = /* glsl */`
${FOG_F}
${NOISE_GLSL}
${LAMP_GLSL}
uniform float uTime; uniform vec3 uBone, uCrimson; varying vec3 vW; varying vec3 vN;
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  vec3 N = normalize(vN + V * 1e-4); if (dot(N, V) < 0.0) N = -N;
  N = normalize(N + (vec3(mcN(vW * 2.3 + uTime * 0.6), mcN(vW * 2.3 + 7.0 - uTime * 0.5), mcN(vW * 2.3 + 13.0)) - 0.5) * 0.35);
  vec3 R = reflect(-V, N);
  // what a mirror drop shows down here: lit rock and worms below (warm, with red specks), black water above and around
  float below = smoothstep(0.1, -0.7, R.y);
  float tex = mcF(R * 3.0 + vW * 0.3);
  vec3 scene = mix(uBone * 0.55, vec3(0.42, 0.30, 0.14), tex) * below + uCrimson * smoothstep(0.66, 0.72, mcN(R * 9.0)) * below * 0.7;
  vec3 E = mcLight(vW, N, dE) + mcLight(vW, R, dE) * 0.8;
  float fres = pow(max(1.0 - max(dot(N, V), 0.0), 0.0), 3.0);
  vec3 col = scene * E * 1.1 + vec3(0.50, 0.66, 0.88) * E * (0.10 + 0.55 * fres);
  col += uLampCol * uLampI * (mcGlint(vW, N, V, 90.0) * 1.8 + mcGlint(vW, N, V, 22.0) * 0.22) * exp(-uAbsorb * 1.2 * dE) / (1.0 + dE / (uLampFall * 3.0));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- the lander's beams: true volumes. The mesh is only the cone's hull (uv.x along 0 lamp .. 1 end, uv.y which beam,
// normal.y -1 / +1 on the end caps); the fragment shader cuts the sight line by the cone exactly and adds up the lit water
// along it, so from beside it a beam is a soft shaft, from inside a faint haze, and never a card with an edge.
const BEAM_V = /* glsl */`
uniform vec3 uLandPos[2]; uniform vec3 uLandDir[2]; uniform float uLen[2];
varying vec3 vW; varying vec3 vN; varying float vBi;
void main(){
  int bi = int(uv.y + 0.5);
  vec3 d = normalize(uLandDir[bi]); vec3 ex = normalize(cross(d, vec3(0.13, 0.97, 0.21)) + vec3(1e-4, 0.0, 0.0)); vec3 ey = cross(d, ex);
  float t = uv.x, L = uLen[bi], k = bi == 0 ? 0.20 : 0.30, cap = abs(normal.y);
  float rad = (0.12 + t * L * k) * 1.012;                                  // the 22-gon stands just outside the true cone
  vec3 radial = ex * position.x + ey * position.z;
  vec3 p = uLandPos[bi] + d * (t * L) + radial * rad;
  vW = p; vN = (radial - d * k) * (1.0 - cap) + d * normal.y; vBi = uv.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const BEAM_F = /* glsl */`
${NOISE_GLSL}
uniform vec3 uLandPos[2]; uniform vec3 uLandDir[2]; uniform vec3 uLandCol; uniform float uLandI, uTime, uBeam, uShaft, uTaper; uniform vec3 uAbsorb; uniform float uLen[2]; uniform vec2 uBeamK, uBeamIn;
varying vec3 vW; varying vec3 vN; varying float vBi;
void main(){
  bool up = vBi > 0.5;
  vec3 A = up ? uLandPos[1] : uLandPos[0]; vec3 d = normalize(up ? uLandDir[1] : uLandDir[0]);
  float k = up ? 0.30 : 0.20, L = up ? uLen[1] : uLen[0], wIn = up ? uBeamIn.y : uBeamIn.x, dimK = up ? uBeamK.y : uBeamK.x;
  vec3 O = cameraPosition; vec3 D = vW - O; float dF = length(D); D /= max(dF, 1e-3);
  // each sight line is counted once: on the hull's near faces while the eye is outside the cone, on its far faces while inside
  // (uBeamIn eases from one to the other in a shell just outside the hull, where both are in view and show the same sum)
  float w = dot(vN, D) < 0.0 ? 1.0 - wIn : wIn;
  if (w < 0.004) discard;
  // where the sight line enters and leaves the cone (h^2 = cos^2 |x - apex|^2), cut to the beam's length
  float h0 = 0.12 / k, c2 = 1.0 / (1.0 + k * k);
  vec3 co = O - (A - d * h0);
  float dd = dot(D, d), cd = dot(co, d), dc = dot(D, co);
  float qa = dd * dd - c2, qb = dd * cd - dc * c2, qc = cd * cd - dot(co, co) * c2;
  qa = abs(qa) < 1e-5 ? (qa < 0.0 ? -1e-5 : 1e-5) : qa;
  float disc = qb * qb - qa * qc;
  float sq = sqrt(max(disc, 0.0));
  float r1 = (-qb - sq) / qa, r2 = (-qb + sq) / qa, lo = min(r1, r2), hi = max(r1, r2);
  float ta = lo, tb = hi;
  if (qa > 0.0) { if (dd > 0.0) { ta = hi; tb = 1e4; } else { ta = -1e4; tb = lo; } }
  float sd = abs(dd) < 1e-4 ? (dd < 0.0 ? -1e-4 : 1e-4) : dd;
  float s0 = (h0 - cd) / sd, s1 = (h0 + L - cd) / sd;
  ta = max(max(ta, min(s0, s1)), 0.5); tb = min(tb, max(s0, s1));
  float span = tb - ta;
  if (disc <= 0.0 || span <= 0.0) discard;
  float sh = up ? uShaft : 0.0;                                             // the up-beam seen from across the field: a shaft that holds all the way to the great pool
  float jit = 0.5 + 0.45 * (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5);   // a fine, even grain on steps that otherwise fall alike from pixel to pixel (the old hash drew arcs in the beam)
  vec3 drift = vec3(-uTime * 0.5, uTime * 0.14, 0.0);
  float pw = mix(1.55, 1.10, sh), aEnd = mix(0.55, 0.80, sh); vec3 ab = uAbsorb * mix(0.6, 0.35, sh);
  // the lit core is thin, so the steps are laid where the sight line passes closest to the beam's axis and close enough
  // together to resolve the core at any angle (steps spread evenly over the whole chord drew ribs across the beam)
  vec3 ow = O - A; float den = max(1.0 - dd * dd, 1e-4), sinA = sqrt(den);
  float tC = clamp((dd * dot(d, ow) - dot(D, ow)) / den, ta, tb);
  float sC = max(dot(O + D * tC - A, d), 0.0);
  float wC = (0.12 + k * sC) * 0.72 * mix(1.0, 0.66, uTaper) * mix(1.0, mix(0.40, 0.17, uTaper), smoothstep(10.0, mix(48.0, 58.0, uTaper), sC)) * mix(0.45, 1.0, smoothstep(5.0, 24.0, tC));
  float hw = clamp(2.6 * wC / sinA, 1.5, span);
  float t0 = max(ta, tC - hw), t1 = min(tb, tC + hw), dt = (t1 - t0) / 18.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 18; i++) {
    float t = t0 + dt * (float(i) + jit);
    vec3 X = O + D * t; vec3 rel = X - A; float s = dot(rel, d), R = 0.12 + k * max(s, 0.0);
    float q = length(rel - d * s) / R;
    float n = mcN(X * 0.42 + drift), n2 = mcN(X * 0.11 + drift * 0.4 + 7.0);
    // a shaft, not a fan: the lit core stays a few metres wide all the way up. uTaper (1 everywhere but across the north
    // vantage) draws it finer still toward its far end and dims its last third: seen from near its foot (the notch, the knee)
    // it is then a shaft that tapers to the ring, not a band of one thickness
    float wS = mix(1.0, mix(0.40, 0.17, uTaper), smoothstep(10.0, mix(48.0, 58.0, uTaper), s));
    float wE = mix(0.45, 1.0, smoothstep(5.0, 24.0, t));                        // and close to the eye it is a narrow core, not a band
    float qq = q / ((0.30 + 0.20 * n + 0.22 * n2) * mix(1.0, 0.66, uTaper) * wS * wE);                   // no edge at all: the light thins away from the axis, by a width that
    float edge = (exp(-qq * qq * 1.4) + 0.035 * exp(-q * q * 3.2) * (1.0 - smoothstep(6.0, 22.0, s))) * (1.0 - smoothstep(0.82, 1.0, q));   // billows with the lit snow, in a faint wide halo (the hull is where it has gone to nothing)
    float along = smoothstep(0.0, 0.8, s) * (1.0 - smoothstep(aEnd, 1.0, s / L)) * (1.0 - 0.8 * uTaper * smoothstep(0.40, 0.90, s / L)) / (pow(max(R, 1.0) / 3.0, pw) * max(wS, 0.40));
    acc += edge * along * (0.35 + 1.3 * n * mix(1.0, 1.25, sh)) * smoothstep(2.5, 15.0, t) * exp(-ab * t);   // and thins close to the eye: beside or inside it we see the lit snow, not a wall
  }
  vec3 Xm = O + D * (0.5 * (t0 + t1));
  float det = 0.82 + 0.36 * smoothstep(0.35, 0.9, mcN(Xm * 1.4 + drift * 2.0)) + sh * 0.5 * (mcN(Xm * 0.3 + drift * 0.9) - 0.4);   // drifts of lit snow in it
  float fs = max(dot(-D, d), 0.0); fs = fs * fs * fs;                       // looking up the beam: forward scatter
  vec3 col = uLandCol * uLandI * uBeam * 0.0105 * (1.0 + sh) * (1.0 + 1.4 * fs) * dt * acc * det * dimK * w * clamp(sinA * 1.7 + 0.18, 0.0, 1.0);      // (looked along, a beam is a long glow: eased, so from beside its lamp it stays a shaft)
  gl_FragColor = vec4(col, 1.0);
}`;

// ---- the lens star: two billboards, seen only from in front of each lamp
const STAR_V = /* glsl */`
uniform vec3 uLandPos[2]; uniform vec3 uLandDir[2]; uniform float uLandI;
varying vec2 vQ; varying float vK;
void main(){
  int bi = int(uv.x + 0.5);
  vec3 c = uLandPos[bi] + normalize(uLandDir[bi]) * 0.16;
  vec3 toC = cameraPosition - c; float d = length(toC); toC /= max(d, 1e-3);
  float facing = smoothstep(-0.1, 0.75, dot(toC, normalize(uLandDir[bi])));
  vec4 mv = viewMatrix * vec4(c, 1.0);
  float size = (1.0 + 0.075 * d) * (0.35 + 0.65 * facing);
  mv.xy += position.xy * size;
  vQ = position.xy; vK = facing * uLandI * 0.32 * smoothstep(1.0, 4.0, d) / (1.0 + d / 70.0);
  gl_Position = projectionMatrix * mv;
}`;
const STAR_F = /* glsl */`
uniform vec3 uLandCol; varying vec2 vQ; varying float vK;
void main(){
  float r = length(vQ);
  float g = exp(-r * r * 36.0) * 3.4 + exp(-r * 5.5) * 0.42;
  float sx = exp(-abs(vQ.y) * 46.0) * exp(-abs(vQ.x) * 2.6) * 0.8 + exp(-abs(vQ.x) * 46.0) * exp(-abs(vQ.y) * 4.0) * 0.4;
  float edge = 1.0 - smoothstep(0.7, 1.0, r);
  gl_FragColor = vec4(uLandCol * (g + sx) * vK * edge, 1.0);
}`;

// ---- floc: lit flakes in a box that wraps round uCen. aF = base (0..1)^3 + seed. Sized from the drawing buffer.
const FLOC_V = /* glsl */`
${FOG_V}
attribute vec4 aF; uniform vec3 uBox, uCen, uVel, uCamV; uniform float uTime, uBufH, uStreak, uSizeK, uReach;
varying vec3 vW; varying vec2 vQ; varying float vA;
void main(){
  float sd = aF.w, sp = 0.6 + 0.8 * fract(sd * 7.3);
  vec3 p = aF.xyz * uBox + uVel * uTime * sp + vec3(sin(uTime * 0.6 + sd * 40.0), sin(uTime * 0.45 + sd * 23.0), cos(uTime * 0.5 + sd * 31.0)) * 0.14;
  p = uCen + mod(p - uCen + 0.5 * uBox, uBox) - 0.5 * uBox;
  vec3 q = abs(p - uCen) / (0.5 * uBox);
  float edge = 1.0 - smoothstep(0.80, 1.0, max(q.x, max(q.y, q.z)));
  float d = distance(cameraPosition, p);
  float fr = fract(sd * 17.7);
  float big = 1.0 + 2.2 * (1.0 - smoothstep(0.7, 2.2, d)) * step(0.72, fract(sd * 3.9));   // a few at arm's length are large and out of focus
  float size = mix(0.009, 0.027, fr * fr) * uSizeK * big;
  float pxScale = uBufH * projectionMatrix[1][1] * 0.5;
  float px0 = size * pxScale / max(d, 0.05);
  float px = min(px0, 0.018 * uBufH); size = px * max(d, 0.05) / pxScale;   // never a white plate on the pane
  float k = max(px, 0.85) / max(px, 1e-3);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  vec3 vr = mat3(viewMatrix) * (uVel - uCamV);
  vec2 vd = vr.xy + mv.xy * vr.z / max(-mv.z, 0.4); float vl = length(vd);   // streaked by how they pass the dome (apparent motion)
  vec2 ax = vl > 1e-4 ? vd / vl : vec2(1.0, 0.0);
  float half0 = size * k, len = half0 + min(uStreak * vl * sp, 0.011 * max(d, 0.3));      // a short smear, not a streak: the snow must never read as static
  mv.xy += ax * position.x * len + vec2(-ax.y, ax.x) * position.y * half0;
  vW = p; vQ = position.xy;
  // only the snow the lamps reach: nothing beyond uReach and no flake too small to have a shape, so open water is
  // black water with soft flakes passing close, never a field of pinpoint stars
  vA = smoothstep(0.0010, 0.0034, px0 / uBufH) * edge * smoothstep(0.4, 2.4, d) * (1.0 - smoothstep(uReach * 0.30, uReach, d)) * min(1.0 / (k * k), 1.0) * sqrt(half0 / max(len, 1e-4)) / (big * big * sqrt(big));
  gl_Position = projectionMatrix * mv;
  vec4 mvPosition = mv;
  #include <fog_vertex>
}`;
const FLOC_F = /* glsl */`
${FOG_F}
${LAMP_GLSL}
uniform vec3 uFlocCol; uniform float uFlocI;
varying vec3 vW; varying vec2 vQ; varying float vA;
void main(){
  float r = length(vQ); float a = (1.0 - smoothstep(0.0, 1.0, r)); a = a * a * vA;        // a soft flake, no hard disc
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  // lamps only (no fill): a flake is bright in a beam and black outside it, so the snow shows the light
  vec3 a0 = normalize(uLampPos[0] - vW), a1 = normalize(uLampPos[1] - vW), b0 = normalize(uLandPos[0] - vW), b1 = normalize(uLandPos[1] - vW);
  // honest lamps (no survey reach), and the cone without its floor: outside the beams a flake is black
  vec3 E = uLampCol * uLampI * (max(mcSpot(vW, a0, uLampPos[0], uLampDir, 0.62, 0.93, uLampFall * 0.55, dE, 0.0) - 0.035, 0.0) + max(mcSpot(vW, a1, uLampPos[1], uLampDir, 0.62, 0.93, uLampFall * 0.55, dE, 0.0) - 0.035, 0.0))
         + uLandCol * uLandI * 0.95 * (max(mcSpot(vW, b0, uLandPos[0], uLandDir[0], 0.80, 0.97, uLandFall, dE, 0.0) - 0.03, 0.0) + max(mcSpot(vW, b1, uLandPos[1], uLandDir[1], 0.62, 0.95, uLandFall, dE, 0.0) - 0.03, 0.0));
  gl_FragColor = vec4(uFlocCol * min(E * 1.2, vec3(0.85)) * uFlocI * a, a * 0.4);        // soft and never white: a flake is dimmer than the rock behind it
  #ifdef USE_FOG
    gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);   // premultiplied: fade, never add the fog colour
  #endif
}`;

// ---- lesser smokers: opaque, displaced, leaning plumes, each a small copy of the main column: a black, knobbly rope with
// only its rims in lamp colour and a dull ember at its root. aPl = t along, seed, height, mouth radius; normal = radial
const PLUME_V = /* glsl */`
${FOG_V}
${NOISE_GLSL}
attribute vec4 aPl; uniform float uTime, uLeanT; varying vec3 vW; varying vec3 vN; varying float vB; varying float vT; varying float vSd; varying vec3 vQ;
float plB(vec3 q){ return 0.52 * abs(2.0 * mcN(q) - 1.0) + 0.30 * abs(2.0 * mcN(q * 2.3 + vec3(3.1, 7.7, 1.3)) - 1.0) + 0.18 * abs(2.0 * mcN(q * 5.1 + vec3(9.2, 1.4, 4.4)) - 1.0); }
void main(){
  float t = aPl.x, sd = aPl.y, H = aPl.z, r0 = aPl.w, h = t * H;
  float cl = smoothstep(0.84, 1.0, t);
  float rad = r0 * (0.7 + 5.2 * pow(t + 1e-4, 0.9)) * sqrt(max(1.0 - cl * cl, 0.0));          // it ends in a round head (pinched to a point over its top fifth it was a pennant)
  vec3 n = normal; vec3 tg = vec3(-n.z, 0.0, n.x);
  float ky = 1.6 / (0.5 + rad);                                      // (knobs about as tall as they are wide: at 0.9 they were drawn out up the plume and showed as stripes)
  vec3 q = vec3(n.x * 1.4 + sd * 9.0, h * ky - uTime * 1.1, n.z * 1.4 + sd * 5.0);
  float b = plB(q), ba = plB(q + tg * 0.196), bh = plB(q + vec3(0.0, 0.14, 0.0));
  float amp = 0.80 + 0.60 * b;                                       // (fuller still: at 0.58 + 1.15 b the necks pinched the tube flat, and from below the plumes were ribbons on poles)
  vec3 p = position + vec3(0.0, h, 0.0) + n * rad * amp;
  p.x += (uLeanT * 1.1 + 0.10) * h * h / (h + 2.5) + sin(h * 0.9 - uTime * 0.7 + sd * 20.0) * 0.12 * t * H;
  p.z += cos(h * 0.8 - uTime * 0.6 + sd * 13.0) * 0.10 * t * H;
  vec4 wp = modelMatrix * vec4(p, 1.0);
  // the billows' own slopes (round the plume and up it) tilt the normal: every knob gets a rim and a crease
  vW = wp.xyz; vN = normalize(n - tg * (10.0 * (ba - b) / amp) - vec3(0.0, 1.0, 0.0) * (rad * ky * 10.0 * (bh - b)) + vec3(0.0, 0.2, 0.0)); vB = b; vT = t; vSd = sd; vQ = q;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PLUME_F = /* glsl */`
${FOG_F}
${LAMP_GLSL}
${NOISE_GLSL}
uniform vec3 uSoot, uEmberC; uniform float uCore, uTime, uCold, uPlumeK; varying vec3 vW; varying vec3 vN; varying float vB; varying float vT; varying float vSd; varying vec3 vQ;
float plB(vec3 q){ return 0.52 * abs(2.0 * mcN(q) - 1.0) + 0.30 * abs(2.0 * mcN(q * 2.3 + vec3(3.1, 7.7, 1.3)) - 1.0) + 0.18 * abs(2.0 * mcN(q * 5.1 + vec3(9.2, 1.4, 4.4)) - 1.0); }
void main(){
  vec3 V = cameraPosition - vW; float dE = length(V); V /= max(dE, 1e-3);
  // the billows again, per pixel (the mesh carries only the big knobs): every cauliflower head gets its own rim and crease
  float e = 0.10, b0 = plB(vQ), fineB = plB(vQ * 3.1 + 11.0);
  vec3 gb = vec3(plB(vQ + vec3(e, 0.0, 0.0)), plB(vQ + vec3(0.0, e, 0.0)), plB(vQ + vec3(0.0, 0.0, e))) - b0;
  vec3 N = normalize(vN + V * 1e-4); vec3 gt = gb - N * dot(gb, N);
  N = normalize(N - gt * (0.42 / e) + vec3(0.0, 1e-5, 0.0));
  if (dot(N, V) < 0.0) N = normalize(N - 2.0 * dot(N, V) * V);
  float crease = smoothstep(0.02, 0.40, min(b0, vB + 0.15)) * (0.55 + 0.45 * fineB);
  float rim1 = max(1.0 - max(dot(N, V), 0.0), 0.0), rim = rim1 * rim1;
  vec3 E = mcLight(vW, N, dE), Eb = mcLight(vW, normalize(N - V * 1.2), dE);
  // black in the creases and at the heart; the shape is carried by the rims (milky smoke keeps a lit core)
  vec3 col = uSoot * (E * uCore * crease * crease + Eb * rim * 3.6 * crease) + mix(vec3(dot(uScatter, vec3(0.3333))), uScatter, 0.35 + 0.4 * uCold) * uCold * uPlumeK * mix(0.06 + 1.1 * rim, 0.18 + 2.8 * rim1 * rim1, smoothstep(8.0, 26.0, dE)) * mix(0.78 - 0.68 * uCold, 1.0, crease) * (1.0 - 0.8 * smoothstep(0.78, 1.0, vT)) * exp(-uAbsorb * dE * 0.6);      // (beyond the lamps the slate of the lit water behind models every billow: black smoke has to read against black water from 50 m)
  col *= 1.0 - 0.5 * smoothstep(0.6, 1.0, vT);                         // (and its cold fill thins away over the top fifth: the head goes dark into the water)
  // its own throat lights the root of the smoke from below: a dull ember that breathes (never a flash)
  float fl = 0.75 + 0.25 * sin(uTime * 2.3 + vSd * 40.0) * sin(uTime * 0.9 + vSd * 17.0);
  col += uEmberC * (exp(-vT * 11.0) * 0.55 + exp(-vT * 3.5) * 0.085) * (0.15 + 0.85 * crease) * fl;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// ---- ember glow at the mouth of each lesser smoker: a soft warm halo in the water (aE = centre, seed)
const EMBER_V = /* glsl */`
attribute vec4 aE; uniform float uTime; varying vec2 vQ; varying float vK;
void main(){
  vec4 mv = viewMatrix * vec4(aE.xyz, 1.0); float d = max(-mv.z, 0.1);
  mv.xy += position.xy * (0.85 + 0.018 * d);
  vQ = position.xy;
  vK = (0.75 + 0.25 * sin(uTime * 2.3 + aE.w * 40.0) * sin(uTime * 0.9 + aE.w * 17.0)) * smoothstep(2.0, 8.0, d) / (1.0 + d / 110.0);
  gl_Position = projectionMatrix * mv;
}`;
const EMBER_F = /* glsl */`
uniform vec3 uEmberC; varying vec2 vQ; varying float vK;
void main(){
  float r = length(vQ);
  float g = exp(-r * r * 10.0) * 0.50 + exp(-r * 3.4) * 0.14;
  gl_FragColor = vec4(uEmberC * g * vK * (1.0 - smoothstep(0.7, 1.0, r)), 1.0);
}`;

// ---- the water itself: a dome that rides with the eye and is drawn behind everything. Our own lamps scattered back from
// the snow ahead of us (a soft slate glow round the gaze), and the lit water lying over the vent field (a band along the
// level of the eye), in slow drifting billows. It is what black smoke, unlit chimneys and the tower's dark side stand against.
const HAZE_V = /* glsl */`
varying vec3 vD;
void main(){ vD = position; gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + position * 60.0, 1.0); }`;
const HAZE_F = /* glsl */`
${NOISE_GLSL}
${WATER_GLSL}
uniform vec3 uLampDir, uBg, uHazeK; uniform float uTime, uHaze;
varying vec3 vD;
void main(){
  vec3 D = normalize(vD + vec3(0.0, 1e-5, 0.0));
  gl_FragColor = vec4(mcWater(D, uLampDir, uTime, uBg, uHazeK, uHaze), 1.0);
}`;

// =============================================================================================
// 2. small builders
// =============================================================================================
function hash2(ix, iz, s) { let h = Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(s, 1274126177) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
// distances to the nearest and second nearest feature point of a jittered grid (pillow lobes and their seams)
const _cell = [0, 0];
function cell2(x, z, s) {
  const ix = Math.floor(x), iz = Math.floor(z); let d1 = 9, d2 = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = ix + i + 0.15 + 0.7 * hash2(ix + i, iz + j, s), cz = iz + j + 0.15 + 0.7 * hash2(ix + i, iz + j, s + 7), d = Math.hypot(cx - x, cz - z);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  _cell[0] = d1; _cell[1] = d2; return _cell;
}

// area-weighted vertex normals, in slices (computeVertexNormals on 40k triangles is one 30 ms step)
async function smoothNormals(pos, idx, pause) {
  const n = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
    if (i % 15000 === 14997) await pause();
  }
  for (let i = 0; i < n.length; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; if (i % 30000 === 29997) await pause(); }
  return n;
}

// one fused pipe of a chimney: a lobed, bulging lathe on a leaning axis with an open mouth. acc = { pos, mat, idx } and, where the caller keeps one, the list acc.feet
function addSpire(acc, nz, bx, by, bz, H, r0, lx, lz, o) {
  const cols = o.cols, rows = o.rows, base = acc.pos.length / 3, sd = o.sd, lob = 3 + Math.floor(sd * 2.99);
  let rTop = r0 * 0.3;
  for (let r = 0; r <= rows; r++) {
    const t = r / rows, y = t * H;
    const taper = o.mound ? lerp(1.1, 0.80, smoothstep(0.1, 1, t)) : o.flat ? lerp(0.32, 1, smoothstep(0, 0.6, t)) * lerp(1, 0.74, smoothstep(0.6, 1, t)) : 1 - 0.76 * Math.pow(t, 0.72);      // (flat = a ledge's buttress: a corbel that swells out of the wall. With a flared foot its skin lay nearly along the trunk's and the cut between them showed as stepped terraces)
    const rad = r0 * taper * (1 + (o.flat ? 0 : o.bulge ?? 0.20) * Math.sin(t * H * 1.9 + sd * 40) * (1 - 0.5 * t)) + (o.flat ? 0 : r0 * (o.mound ? 0.45 : 1.2) * Math.pow(1 - t, 6)) + (r === rows ? r0 * 0.05 : 0);
    if (r === rows) rTop = rad;
    for (let q = 0; q < cols; q++) {
      const a = q / cols * TAU, c = Math.cos(a), s = Math.sin(a);
      const n = nz.n3(c * 1.2 + sd * 30 + bx * 0.07, y * 0.55, s * 1.2 + bz * 0.07), n2 = nz.n3(c * 3.1 + sd * 11, y * 1.6, s * 3.1);
      const R = rad * (1 + 0.14 * Math.cos(lob * a + sd * 9 + t * 2.5)) * (1 + 0.26 * n + (o.flat ? 0.04 : 0.10) * n2);
      acc.pos.push(bx + lx * y + c * R, by + y, bz + lz * y + s * R);
      acc.mat.push(o.smoker ? 0.62 * smoothstep(0.62, 1, t) : 0.5 * sd * smoothstep(0.7, 1, t), (o.fresh ?? 0.5) * smoothstep(0.3, 1, t), lerp(0.25, 1, smoothstep(0, 0.2, t)) * (0.8 + 0.2 * n));
    }
  }
  // the mouth: a throat ring let into the top, then its floor
  for (let q = 0; q < cols; q++) { const a = q / cols * TAU; acc.pos.push(bx + lx * H + Math.cos(a) * rTop * 0.5, by + H - rTop * (o.mound ? 0.05 : 0.5), bz + lz * H + Math.sin(a) * rTop * 0.5); acc.mat.push(o.smoker ? 0.985 : 0.3, 0.9, o.mound ? 0.7 : 0.12); }
  acc.pos.push(bx + lx * H, by + H - rTop * (o.mound ? 0.08 : 0.9), bz + lz * H); acc.mat.push(o.smoker ? 1 : 0.3, 0.9, o.mound ? 0.6 : 0.08);
  for (let r = 0; r <= rows; r++) for (let q = 0; q < cols; q++) {
    const a = base + r * cols + q, b = base + r * cols + (q + 1) % cols, c = a + cols, d = b + cols; acc.idx.push(a, c, b, b, c, d);
  }
  const cen = base + (rows + 2) * cols, ring = base + (rows + 1) * cols;
  for (let q = 0; q < cols; q++) acc.idx.push(ring + q, cen, ring + (q + 1) % cols);
  if (acc.feet && !o.flat) acc.feet.push([base, cols, bx, by, bz]);      // a spire that stands on the bed: its lowest ring is listed, and a talus apron falls from it to the bed (3e, THE FEET)
  return { x: bx + lx * H, y: by + H, z: bz + lz * H, r: rTop };
}

// a little indexed mesh from rings lofted along z. rings: [z, rx, ry, cy, [r,g,b,gloss], limbWeight]
function loft(rings, sides, uvy = 0) {
  const pos = [], uv = [], col = [], idx = [];
  rings.forEach(([z, rx, ry, cy, c, w]) => { for (let q = 0; q < sides; q++) { const a = (q + 0.5) / sides * TAU; pos.push(Math.cos(a) * rx, cy + Math.sin(a) * ry, z); uv.push(w || 0, uvy); col.push(c[0], c[1], c[2], c[3]); } });
  for (let r = 0; r < rings.length - 1; r++) for (let q = 0; q < sides; q++) { const a = r * sides + q, b = r * sides + (q + 1) % sides, c = a + sides, d = b + sides; idx.push(a, b, c, b, d, c); }
  return { pos, uv, col, idx };
}
function joinParts(parts) {
  const pos = [], uv = [], col = [], idx = [];
  for (const p of parts) { const b = pos.length / 3; pos.push(...p.pos); uv.push(...p.uv); col.push(...p.col); for (const i of p.idx) idx.push(i + b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('uv', f32(uv, 2)); g.setAttribute('aCol', f32(col, 4)); g.setIndex(idx);
  g.computeVertexNormals(); return g;
}
function xform(p, fn) { for (let i = 0; i < p.pos.length; i += 3) { const r = fn(p.pos[i], p.pos[i + 1], p.pos[i + 2]); p.pos[i] = r[0]; p.pos[i + 1] = r[1]; p.pos[i + 2] = r[2]; } return p; }
// a thin two-sided strip through points (limbs, legs, arms); weight grows to the tip
function strip(pts, w0, w1, c, wTip, uvy = 0) {
  const pos = [], uv = [], col = [], idx = [], n = pts.length;
  for (let i = 0; i < n; i++) { const t = i / (n - 1), w = lerp(w0, w1, t), p = pts[i], q = pts[Math.min(i + 1, n - 1)], o = pts[Math.max(i - 1, 0)];
    let dx = q[0] - o[0], dz = q[2] - o[2]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    pos.push(p[0] - dz * w, p[1], p[2] + dx * w, p[0] + dz * w, p[1], p[2] - dx * w, p[0], p[1] + w * 1.2, p[2]);
    for (let k = 0; k < 3; k++) { uv.push(wTip * t, uvy); col.push(c[0], c[1], c[2], c[3]); } }
  for (let i = 0; i < n - 1; i++) { const a = i * 3; idx.push(a, a + 3, a + 2, a + 2, a + 3, a + 5, a + 2, a + 5, a + 1, a + 1, a + 5, a + 4); }
  return { pos, uv, col, idx };
}

function shrimpGeo() {       // 1 unit long, +z ahead, y out of the wall: an arched white body, a fanned tail that flicks
  const W = [0.93, 0.90, 0.86, 0.35], P = [0.95, 0.74, 0.70, 0.35];
  return joinParts([loft([[0.5, 0.02, 0.02, 0.10, W, 0], [0.28, 0.11, 0.10, 0.15, P, 0], [-0.05, 0.11, 0.10, 0.17, W, 0], [-0.4, 0.05, 0.035, 0.09, W, 0.25], [-0.5, 0.12, 0.008, 0.05, W, 0.5]], 3)]);
}
function yetiGeo() {         // a pale squat crab with two long bristled arms that wave
  const W = [0.92, 0.88, 0.74, 0.25], H = [0.80, 0.70, 0.45, 0.1], parts = [loft([[0.42, 0.05, 0.03, 0.10, W, 0], [0.25, 0.22, 0.10, 0.13, W, 0], [-0.1, 0.26, 0.12, 0.14, W, 0], [-0.4, 0.16, 0.08, 0.11, W, 0], [-0.5, 0.03, 0.02, 0.09, W, 0]], 6)];
  for (const s of [-1, 1]) {
    parts.push(strip([[s * 0.16, 0.14, 0.3], [s * 0.34, 0.2, 0.62], [s * 0.36, 0.22, 1.0], [s * 0.22, 0.2, 1.3]], 0.07, 0.05, H, 0.9, s > 0 ? 0 : 1));
    for (let k = 0; k < 3; k++) parts.push(strip([[s * 0.22, 0.1, 0.1 - k * 0.2], [s * 0.5, 0.12, 0.05 - k * 0.24], [s * 0.66, 0.0, 0.0 - k * 0.27]], 0.025, 0.012, W, 0.25, k * 0.6));
  }
  return joinParts(parts);
}
function snailGeo() {        // scaly-foot snail: a dark iron dome on a fringe of pale scales
  const D = [0.20, 0.17, 0.13, 0.9], S = [0.62, 0.54, 0.40, 0.3];
  return joinParts([xform(loft([[0.5, 0.36, 0.30, 0, S, 0], [0.42, 0.42, 0.36, 0.0, S, 0], [0.34, 0.36, 0.33, 0.0, D, 0], [0.12, 0.25, 0.25, 0.02, D, 0], [0.0, 0.03, 0.03, 0.04, D, 0]], 5), (x, y, z) => [x, (0.5 - z) * 1.1, y + 0.05])]);
}
function crabGeo() {         // a pale crab: a flat carapace, eight stepping legs, two claws held ahead
  const W = [0.90, 0.87, 0.80, 0.3], parts = [loft([[0.36, 0.10, 0.03, 0.16, W, 0], [0.2, 0.36, 0.10, 0.18, W, 0], [-0.05, 0.42, 0.12, 0.19, W, 0], [-0.3, 0.30, 0.09, 0.17, W, 0], [-0.4, 0.06, 0.03, 0.15, W, 0]], 6)];
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) { const z = 0.2 - k * 0.2; parts.push(strip([[s * 0.34, 0.16, z], [s * 0.68, 0.30, z + 0.03 - k * 0.04], [s * 0.98, 0.0, z + 0.05 - k * 0.09]], 0.035, 0.012, W, 0.22, k + (s > 0 ? 0 : 0.5))); }
    parts.push(strip([[s * 0.2, 0.15, 0.3], [s * 0.42, 0.18, 0.55], [s * 0.26, 0.14, 0.78]], 0.05, 0.085, W, 0.12, s > 0 ? 0.3 : 1.2));
  }
  return joinParts(parts);
}
function clamGeo(mussel) {   // two ribbed valves hinged at the back; the upper one gapes (uv.x)
  const C = mussel ? [0.36, 0.23, 0.09, 0.6] : [0.92, 0.90, 0.84, 0.25], L = mussel ? [0.20, 0.12, 0.05, 0.6] : [0.70, 0.66, 0.58, 0.2], sx = mussel ? 0.55 : 1, parts = [];
  for (const top of [0, 1]) {
    const pos = [], uv = [], col = [], idx = [], n = 7;
    pos.push(0, top ? 0.36 : 0.02, 0.05); uv.push(top ? 0.35 : 0, 0); col.push(...C);
    for (let q = 0; q <= n; q++) { const a = -0.15 * Math.PI + q / n * 1.3 * Math.PI, r = 0.5 * (1 + 0.06 * (q % 2)); pos.push(Math.cos(a) * r * sx, top ? 0.17 : 0.12, Math.sin(a) * r * 0.9 + 0.1);
      uv.push(top ? 0.5 * smoothstep(-0.3, 0.6, Math.sin(a)) : 0, 0); col.push(...(q % 2 ? C : L)); }
    for (let q = 0; q < n; q++) { if (top) idx.push(0, q + 2, q + 1); else idx.push(0, q + 1, q + 2); }
    parts.push({ pos, uv, col, idx });
  }
  return joinParts(parts);
}
function fishGeo() {         // eelpout: blunt head, eel body, one long fin all the way round the tail, two round breast fins
  const W = [0.55, 0.55, 0.58, 0.35], P = [0.58, 0.49, 0.48, 0.35], F = [0.40, 0.43, 0.48, 0.2], FP = [0.46, 0.47, 0.50, 0.08];      // (grey flesh: at 0.9 they were white blades)
  const parts = [loft([[0.5, 0.03, 0.025, 0, P, 0], [0.44, 0.085, 0.07, 0, P, 0], [0.31, 0.10, 0.10, 0, W, 0], [0.12, 0.072, 0.105, 0, W, 0], [-0.1, 0.048, 0.10, 0, W, 0], [-0.3, 0.026, 0.085, 0, F, 0], [-0.45, 0.008, 0.06, 0, F, 0], [-0.52, 0.003, 0.085, 0, F, 0]], 10)];      // (10 sides: at 6 a fish close to the dome was a faceted spindle)
  // the breast fins: thin round fans behind the gill covers, a sixth of the fish long, held out and back from the flanks
  for (const s of [-1, 1]) parts.push(xform(loft([[0, 0.008, 0.020, 0, FP, 0], [0.045, 0.006, 0.048, 0, FP, 0], [0.10, 0.005, 0.062, 0, FP, 0], [0.14, 0.003, 0.050, 0, FP, 0], [0.16, 0.002, 0.022, 0, FP, 0]], 6), (x, y, z) => [s * (0.086 + z * 0.62 + x), y - 0.028 - z * 0.12, 0.275 - z * 0.78]));
  return joinParts(parts);
}
function octoGeo(rng) {      // dumbo octopus, 1 unit across the web: a round mantle, a scalloped web on eight arms (uv.y), two round ear fins standing out from the mantle (uv.x)
  // wine red, darker toward the web. Colours carry gloss in a: 0.3 the body and the fins, under 0.1 the thin web (the lamps
  // glow dimly through it). No eyes: at the size it is seen a modelled eye read as a toy's dot (SWIM_F paints a dull one).
  const B = [0.50, 0.17, 0.17, 0.3], B2 = [0.40, 0.12, 0.13, 0.3], Wb = [0.34, 0.085, 0.10, 0.04], Arm = [0.50, 0.18, 0.16, 0.12], In = [0.10, 0.02, 0.03, 0.04], Ear = [0.46, 0.16, 0.16, 0.3];
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
  // profile [radius, y]: crown, a full mantle, a soft neck, then the web flaring to its rim
  const prof = [[0.0, 0.44], [0.07, 0.435], [0.14, 0.41], [0.20, 0.37], [0.245, 0.31], [0.27, 0.23], [0.275, 0.15], [0.262, 0.07], [0.25, 0.0], [0.268, -0.06], [0.31, -0.12], [0.37, -0.18], [0.43, -0.235], [0.48, -0.275], [0.505, -0.30]];
  const pos = [], uv = [], col = [], idx = [], n = 64, R = prof.length;      // (8 to an arm: at 5 the scallops were zigzags)
  prof.forEach(([r, y]) => { for (let q = 0; q < n; q++) {
    const a = q / n * TAU, sk = smoothstep(0.0, -0.3, y), arm = Math.pow(0.5 + 0.5 * Math.cos(8 * a), 3);      // 1 along each of the eight arms
    const rr = r * (1 + sk * (0.05 * arm + 0.085 * Math.cos(8 * a))) * (1 + 0.03 * Math.sin(3 * a + 1.0) * (1 - sk));      // (the rim between two arms stands a fifth nearer the axis than the arms' points, and 0.148 higher)
    pos.push(Math.cos(a) * rr, y - sk * sk * 0.080 * Math.cos(8 * a) + sk * 0.012 * arm, Math.sin(a) * rr * 0.94); uv.push(0, sk);
    col.push(...(sk > 0 ? mixc(mixc(B2, Wb, smoothstep(0.0, 0.45, sk)), Arm, arm * smoothstep(0.1, 0.5, sk)) : mixc(B, B2, smoothstep(0.3, 0.0, y))));
  } });
  for (let r = 0; r < R - 1; r++) for (let q = 0; q < n; q++) { const a = r * n + q, b = r * n + (q + 1) % n, c = a + n, d = b + n; idx.push(a, b, c, b, d, c); }
  // the inside of the web, wine in shadow (SWIM_F draws the arms across it), dark at the mouth
  const rim = (R - 1) * n, b0 = pos.length / 3;
  for (const [f, y] of [[0.55, -0.20], [0.12, -0.08]]) for (let q = 0; q < n; q++) { pos.push(pos[(rim + q) * 3] * f, y, pos[(rim + q) * 3 + 2] * f); uv.push(0, f); col.push(...(f > 0.3 ? [0.30, 0.085, 0.095, 0.04] : In)); }
  for (let q = 0; q < n; q++) { const a = rim + q, b = rim + (q + 1) % n, c = b0 + q, d = b0 + (q + 1) % n, e = c + n, g = d + n; idx.push(a, c, b, b, c, d, c, e, d, d, e, g); }
  const parts = [{ pos, uv, col, idx }];
  for (let k = 0; k < 8; k++) {        // the arm tips, curling out past the rim
    const a = k / 8 * TAU, c = Math.cos(a), s = Math.sin(a) * 0.94;
    parts.push(strip([[c * 0.50, -0.285, s * 0.50], [c * 0.56, -0.325, s * 0.56], [c * 0.60, -0.375, s * 0.60], [c * 0.615, -0.43, s * 0.615]], 0.026, 0.006, Arm, 0.35, 1));
  }
  for (const s of [-1, 1]) {
    // a fin: a round fleshy paddle on a stalk, 0.37 long (two thirds of the mantle's width) and 0.32 broad, set high on the
    // mantle's side, raised 20 degrees and its fore edge lifted 21, so that it stands clear of the mantle's outline from the
    // side as from the front; it rows (uv.x grows to the tip). (Long, pointed and raised it read as a cat's ears; short, flat
    // and drooping it lay edge-on to a level eye and could not be told from the mantle.)
    parts.push(xform(loft([[0.0, 0.034, 0.050, 0, B, 0], [0.05, 0.030, 0.078, 0, Ear, 0.2], [0.12, 0.034, 0.128, 0, Ear, 0.45], [0.20, 0.036, 0.158, 0, Ear, 0.75], [0.27, 0.030, 0.160, 0, Ear, 1.0], [0.32, 0.022, 0.130, 0, Ear, 1.15], [0.35, 0.013, 0.085, 0, Ear, 1.25], [0.365, 0.005, 0.035, 0, Ear, 1.3]], 12), (x, y, z) => [s * (0.235 + z * 0.94), 0.275 + x * s * 0.94 + z * 0.34 - y * 0.36, y * 0.93 - 0.03]));
  }
  void rng; return joinParts(parts);
}

// the abandoned lander (local: origin on the ground, y up, lamp bar at y 4.4). dirs are the two lamp directions.
async function landerGeo(dirA, dirB, pause) {
  const TI = [0.34, 0.36, 0.38, 0.7], DK = [0.07, 0.075, 0.08, 0.4], GL = [0.30, 0.42, 0.36, 1.0], YE = [0.62, 0.42, 0.06, 0.3], LENS = [1, 1, 1, 2], geos = [];
  const add = (g, c, m) => { if (m) g.applyMatrix4(m); const n = g.attributes.position.count, a = new Float32Array(n * 4); for (let i = 0; i < n; i++) a.set(c, i * 4);
    g.setAttribute('aCol', new THREE.BufferAttribute(a, 4)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2)); geos.push(g); };
  const up = V3(0, 1, 0), q = new THREE.Quaternion();
  const tube = (a, b, r, c, seg = 7) => { const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(r, r, L, seg, 1); g.applyQuaternion(q.setFromUnitVectors(up, d.normalize())); g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); add(g, c); };
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU + 0.5, c = Math.cos(a), s = Math.sin(a), foot = V3(c * 1.55, i === 1 ? -0.08 : 0.06, s * 1.55), knee = V3(c * 1.05, 0.85, s * 1.05), hub = V3(c * 0.55, 1.75, s * 0.55);
    tube(foot, knee, 0.05, TI); tube(knee, hub, 0.05, TI); tube(knee, V3(Math.cos(a + 2.094) * 1.05, 0.85, Math.sin(a + 2.094) * 1.05), 0.035, TI, 6);
    tube(hub, V3(Math.cos(a + 2.094) * 0.55, 1.75, Math.sin(a + 2.094) * 0.55), 0.035, TI, 6);
    tube(foot, V3(Math.cos(a + 1.05) * 0.5, 0.5, Math.sin(a + 1.05) * 0.5), 0.022, TI, 5);
    add(new THREE.CylinderGeometry(0.30, 0.34, 0.06, 12), TI, T(foot.x, foot.y - 0.03, foot.z));
    add(new THREE.SphereGeometry(0.09, 8, 6), TI, T(knee.x, knee.y, knee.z));
    await pause();
  }
  add(new THREE.TorusGeometry(1.05, 0.03, 5, 28).rotateX(Math.PI / 2), TI, T(0, 0.85, 0));
  add(new THREE.CylinderGeometry(0.17, 0.17, 1.25, 12).rotateZ(Math.PI / 2), DK, T(0.05, 1.12, 0.3));          // battery tube
  for (const s of [-1, 1]) { add(new THREE.SphereGeometry(0.17, 10, 6, 0, TAU, 0, Math.PI / 2).rotateZ(-s * Math.PI / 2), DK, T(0.05 + s * 0.625, 1.12, 0.3)); add(new THREE.TorusGeometry(0.18, 0.02, 4, 14).rotateY(Math.PI / 2), TI, T(0.05 + s * 0.35, 1.12, 0.3)); }
  add(new THREE.CylinderGeometry(0.46, 0.46, 0.10, 16), TI, T(-0.1, 0.52, -0.25));                                // sample carousel
  for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; add(new THREE.CylinderGeometry(0.05, 0.05, 0.34, 6), k % 3 ? GL : DK, T(-0.1 + Math.cos(a) * 0.36, 0.74, -0.25 + Math.sin(a) * 0.36)); }
  for (let k = 0; k < 4; k++) {                                                                                 // glass flotation spheres in hard hats
    const a = k / 4 * TAU + 0.4, x = Math.cos(a) * 0.5, z = Math.sin(a) * 0.5;
    add(new THREE.SphereGeometry(0.235, 14, 10), GL, T(x, 2.12, z)); add(new THREE.TorusGeometry(0.24, 0.022, 5, 16).rotateX(Math.PI / 2), YE, T(x, 2.12, z));
    add(new THREE.SphereGeometry(0.25, 10, 5, 0, TAU, 0, 0.9), YE, T(x, 2.115, z)); tube(V3(x, 1.75, z), V3(x, 1.9, z), 0.04, TI, 6);
    for (let j = 0; j < 3; j++) { const b = a + 1.2 + j * 2.1, e = 0.5 + j * 0.25; add(new THREE.ConeGeometry(0.035, 0.03, 6), [0.75, 0.70, 0.6, 0.2], T(x + Math.cos(b) * Math.cos(e) * 0.235, 2.12 - Math.sin(e) * 0.235 + 0.01, z + Math.sin(b) * Math.cos(e) * 0.235)); }
    await pause();
  }
  add(new THREE.TorusGeometry(0.55, 0.035, 5, 20).rotateX(Math.PI / 2), TI, T(0, 1.75, 0));
  tube(V3(0, 1.75, 0), V3(0, 4.4, 0), 0.04, TI, 7); tube(V3(0.5, 1.75, 0.1), V3(0, 3.3, 0), 0.02, TI, 5); tube(V3(-0.4, 1.75, -0.35), V3(0, 3.3, 0), 0.02, TI, 5);
  tube(V3(-0.2, 1.75, 0.5), V3(0, 2.0, 0), 0.03, TI, 5);
  tube(V3(0, 4.4, -0.6), V3(0, 4.4, 0.6), 0.035, TI, 7);                                                         // the lamp bar
  [dirA, dirB].forEach((d, i) => {
    const o = V3(0, 4.4, i ? 0.42 : -0.42), m = new THREE.Matrix4().makeRotationFromQuaternion(q.setFromUnitVectors(up, d.clone().normalize())).setPosition(o.clone().addScaledVector(d, 0.02));
    add(new THREE.CylinderGeometry(0.10, 0.075, 0.26, 12), DK, m.clone());
    add(new THREE.TorusGeometry(0.10, 0.018, 5, 14).rotateX(Math.PI / 2), TI, m.clone().multiply(T(0, 0.13, 0)));
    add(new THREE.CircleGeometry(0.092, 14).rotateX(-Math.PI / 2), LENS, m.clone().multiply(T(0, 0.132, 0)));
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; add(new THREE.BoxGeometry(0.012, 0.2, 0.03), TI, m.clone().multiply(new THREE.Matrix4().makeRotationY(a)).multiply(T(0.11, -0.01, 0))); }   // cooling fins
  });
  await pause();
  const g = mergeGeometries(geos, false); for (const x of geos) x.dispose(); return g;
}

// the seeded looks: lamp colour, water, mineral, cast. One is drawn per seed; ctx.vary.hour may warm the lamps.
const LOOKS = [
  { name: 'snowblower', lamp: '#EAF2FF', water: 'snow', mineral: 'sulphide', cast: 'snails' },
  { name: 'current', lamp: '#EAF2FF', water: 'current', mineral: 'white', cast: 'shrimp' },
  { name: 'sodium', lamp: '#FFD9A0', water: 'clear', mineral: 'ochre', cast: 'yeti' },
  { name: 'clear', lamp: '#EAF2FF', water: 'clear', mineral: 'ochre', cast: 'shrimp' },
  { name: 'sodium-white', lamp: '#FFD9A0', water: 'clear', mineral: 'white', cast: 'snails' },
];
const DUR = 54;
// the tour round the tower, by bearing, radius and height. It stays OUTSIDE the rims of the three pass shelves (19.4 to 20.4 m
// from the axis) and several metres under their pools, so that each pool is seen from the side and from below as an object:
// a lens of silver lying upside down in its bracket of rock, whole, with the trunk and its worms hanging in it. (Two earlier
// cuts ran under the pools, 4 m and then 6 m below them, and people who had not read the brief saw a pane of blue glass
// across the top of the frame three times running.) Low past the worm mound (MOUND) south of the tower, out and up past F2,
// highest abeam of F2 and F3 where the hero pool is seen whole, then sinking past F3's rim toward the north vantage.
const HX = [[32, 21.5, 7.4], [55, 21.6, 7.0], [78, 22.4, 7.2], [100, 23.6, 8.4], [124, 25.2, 12.0], [148, 26.0, 15.4], [170, 25.2, 16.2], [190, 24.6, 15.4], [208, 24.2, 14.2], [226, 25.0, 13.6], [246, 28.5, 13.4]];
// the fall away (x, y, z): out to the north until the tower stands whole, 37-40 m off, then round to the west and back in to
// the knee. From out there the tower from foot to crown, the ring in the great pool and the lander's star fit in one frame
// with the bed under them.
const FALL = [[7, 13.0, -38], [-3, 10.8, -46.5], [-17, 9.0, -47.5], [-26.5, 7.6, -37], [-25, 6.6, -21]];
// the worm mound: a beehive of old sulphide standing off the tower's south foot with a thicket on its crown, 7 m from the
// dome as we pass it (bearing, radius from the axis). It is the foreground of the look across the field.
const MOUND = [129, 17.4], MOUND_TOP = 8.6;
const hxY = (b) => { for (let i = 1; i < HX.length; i++) if (b <= HX[i][0]) return lerp(HX[i - 1][2], HX[i][2], clamp((b - HX[i - 1][0]) / (HX[i][0] - HX[i - 1][0]), 0, 1)); return HX[HX.length - 1][2]; };
// the worm thickets that stand between the dome and the trunk all the way up the helix (bearings): each is 3-5 m from the
// eye as we pass, and the ones ahead hang upside down in the mirror overhead
const THICKET_B = [46, 62, 80, 97, 114, 132, 150, 167, 184, 201, 218, 234];

// =============================================================================================
// 3. the world
// =============================================================================================
export default {
  id: 'mirror-chimneys',
  name: 'The Upside-Down Pools',
  category: 'ocean',
  weirdness: 0.45,
  media: ['underwater'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3);
    const C = (h) => new THREE.Color(h);

    // ---------------------------------------------------------------- 3a. seeded looks, scene, fog
    const look = { ...LOOKS[Math.min(LOOKS.length - 1, Math.floor(rng() * LOOKS.length))] };
    if (vary.hour === 'golden' || vary.hour === 'dawn') look.lamp = '#FFD9A0';
    else if (vary.hour === 'night') look.lamp = '#EAF2FF';
    const warm = look.lamp === '#FFD9A0', snow = look.water === 'snow', current = look.water === 'current';
    const rare = !!vary.rare, mood = clamp(vary.mood ?? 0.5, 0, 1);      // mood: how hot the field burns (ember glow) and how hard the cold light models the far chimneys
    const xrng = makeRng('mirror-chimneys-rank:' + (ctx.seed ?? 1));        // a stream of its own for things added later, so nothing older moves
    const scene = new THREE.Scene();
    scene.background = C(PALETTE[0]);
    scene.fog = new THREE.FogExp2(PALETTE[0], snow ? 0.0085 : 0.0055);
    const uTime = { value: 0 }, uVant = { value: 0 }, uFill = { value: 0 }, uHaze = { value: 0.55 };      // uVant: 0..1 across the north vantage (the bed's cold spill and fill); uFill: 0..1 round the tour (the bed's pale fill beyond the lamps)

    // ---------------------------------------------------------------- 3c. the hero (first: its anchors place the path)
    // the three thickets that stand 3 m from the dome at the shelf passes; each sits on a ledge built in 3e
    const passThickets = THICKET_B.map((b) => ({ b, y: hxY(b) - 0.4, off: 1.0, r: 1.35 }));        // the part stands each one 0.9 m off the trunk wall
    const moundAt = bearing(MOUND[0], MOUND[1], MOUND_TOP);
    passThickets.push({ p: [moundAt.x, MOUND_TOP - 0.1, moundAt.z], o: [0, 0], r: 1.75 });           // and one on the crown of the worm mound (3e builds the mound under it)
    const hero = await buildHero(ctx, { palette: PALETTE, mineral: look.mineral, lean: current ? 0.61 : undefined, lampColor: look.lamp, survey: 0,
      wormCount: Math.round(1000 * lerp(1, density, 0.5)), passThickets, wormReach: 9.5 });     // half the swing of the rest of the cast: every worm under a shelf is drawn twice
    const LEDGES = hero.passThickets.slice(0, THICKET_B.length);                                   // their feet (Vector3), for the ledges built in 3e
    scene.add(hero.object);
    const lamps = hero.lamps, AN = hero.anchors;
    const fieldRim0 = (look.mineral === 'white' ? 0.9 : look.mineral === 'sulphide' || warm ? 3.3 : 2.3) * lerp(0.9, 1.15, mood);      // (ochre under sodium lamps needs as much as black sulphide: its far chimneys went olive and sank)
    hero.setFieldRim(fieldRim0);
    await ctx.yield();

    // ---------------------------------------------------------------- 3b. path, pace
    const FT = AN.flyThrough, seat = AN.portalSeat.position.clone(), knee = FT[9].clone();
    const riseDir = seat.clone().sub(knee).normalize();
    // (the way in dips: level out of the portal, then low along the fissure with the entry chimney looming on the right, and up
    // again to the notch)
    const PTS = [V3(-86, 15, 4), V3(-74, 14.7, 4.7), V3(-65, 12.3, 5.3), V3(-55.5, 12.0, 3.9), FT[1], FT[2], ...HX.map(([b, r, y]) => bearing(b, r, y)), ...FALL.map((p) => V3(p[0], p[1], p[2])),
      knee, knee.clone().addScaledVector(riseDir, 9), knee.clone().addScaledVector(riseDir, 20), knee.clone().addScaledVector(riseDir, 32), seat];
    const path = makePath(PTS, { samples: 400 });
    const L = path.length;
    const NS = 400, samp = new Float32Array((NS + 1) * 3), _p = V3(), _t = V3();
    for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, _p); samp[i * 3] = _p.x; samp[i * 3 + 1] = _p.y; samp[i * 3 + 2] = _p.z; }
    const dOf = (v) => { let best = 1e9, bi = 0; for (let i = 0; i <= NS; i++) { const d = (samp[i * 3] - v.x) ** 2 + (samp[i * 3 + 1] - v.y) ** 2 + (samp[i * 3 + 2] - v.z) ** 2; if (d < best) { best = d; bi = i; } } return bi / NS * L; };
    const PF = hero.flanges, dNotch = dOf(FT[1]), dHelix = dOf(bearing(HX[0][0], HX[0][1], HX[0][2])), dF1 = dOf(bearing(PF[0].bearing, 18.4, hxY(PF[0].bearing))), dF2 = dOf(bearing(PF[1].bearing, 18.6, hxY(PF[1].bearing))), dF3 = dOf(bearing(PF[2].bearing, 19.6, hxY(PF[2].bearing))), dKnee = dOf(knee);
    const gs = (d, c, s) => Math.exp(-(((d - c) / s) ** 2));
    // 6 m/s in, easing to 4.3 round the tower; slower past the worm mound, abeam of the hero pool (seen whole) and alongside
    // F3 with the swimmer; a little faster out to the north vantage, then 4.4 up the rise
    const dMound = dOf(bearing(MOUND[0] - 24, 23.6, 8.6)), dView = dOf(bearing(160, 25.6, 15.8));
    const speedAt = (d) => {
      let v = lerp(6, 4.3, smoothstep(dNotch - 3, dHelix, d));
      v *= 1 - 0.24 * gs(d, dMound, 10) - 0.26 * gs(d, dView, 10) - 0.26 * gs(d, dF3 + 2, 9.5);
      v = lerp(v, 5.4, smoothstep(dF3 + 12, dF3 + 30, d));
      return lerp(v, 4.4, smoothstep(dKnee - 8, dKnee + 8, d));
    };
    const paceFn = (u) => speedAt(clamp(u, 0, 1) * L) / 4.4;
    // time -> u under that pace (the engine scales pace so the flight lasts DUR)
    const NT = 256, tAt = new Float32Array(NT + 1);
    for (let i = 1; i <= NT; i++) tAt[i] = tAt[i - 1] + 1 / paceFn((i - 0.5) / NT);
    const uAtTime = (sec) => { const x = sec / DUR * tAt[NT]; let i = 1; while (i < NT && tAt[i] < x) i++; return (i - 1 + (x - tAt[i - 1]) / Math.max(tAt[i] - tAt[i - 1], 1e-6)) / NT; };
    void uAtTime;
    const uF1 = dF1 / L, uF2 = dF2 / L, uF3 = dF3 / L, uKnee = dKnee / L, uNotch = dNotch / L, uHelix = dHelix / L;
    const U_SHOAL = uF1 - 0.022, uMound = dMound / L, uView = dView / L;
    void uF2;
    // THE TOUR'S GAZE, from the notch to F3: one table, keyed to where the dome is round the tower (its bearing), so it holds
    // whatever the route's length. Each row: [camera bearing, degrees the gaze is turned to the right of the tower's axis,
    // degrees it is tipped up]. Out of the notch the dome looks level across the field with the tower's foot in the left
    // third (rows 0-16); past the worm mound it turns further out, so the picture is the lit field past the mound's thicket
    // and the pool of F1 is overhead and out of frame (62-100); abeam of F2 it comes back in and up a little, and F3's pool
    // hangs whole in the middle of the frame, seen from the side and 6 m below, the trunk on its left (126-175); alongside F3
    // it tips down and looks 36 degrees out past the trunk: the gold trunk and its worm ledges fill the left two fifths of
    // the frame, the pool leaves by the top, and the swimmer hangs in the open water to the right of the trunk, against the
    // dark ridge (190-262). It never looks up into a pool from underneath.
    const GAZE = [[0, 10, 14], [5, 11, 14], [11, 24, 11], [19, 39, 6], [28, 44, 4], [42, 47, 3], [62, 59, -2], [84, 70, -5], [104, 76, -7], [128, 48, 4], [150, 32, 13], [170, 28, 12], [190, 29, 3], [210, 36, -6], [230, 36, -5], [262, 29, -3]];
    const _g = V3(), _gz = V3();
    const tableAt = (GAZE, b, k) => {      // Catmull-Rom through a table (column k), keyed to its first column
      const n = GAZE.length; if (b <= GAZE[0][0]) return GAZE[0][k]; if (b >= GAZE[n - 1][0]) return GAZE[n - 1][k];
      let i = 0; while (i < n - 2 && b > GAZE[i + 1][0]) i++;
      const p0 = GAZE[Math.max(i - 1, 0)], p1 = GAZE[i], p2 = GAZE[i + 1], p3 = GAZE[Math.min(i + 2, n - 1)], h = p2[0] - p1[0], t = (b - p1[0]) / h;
      const m1 = (p2[k] - p0[k]) / Math.max(p2[0] - p0[0], 1e-3) * h, m2 = (p3[k] - p1[k]) / Math.max(p3[0] - p1[0], 1e-3) * h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * p1[k] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[k] + (t3 - t2) * m2;
    };
    const gazeAt = (b, k) => tableAt(GAZE, b, k);
    // THE WAY IN: one gaze, keyed to u: [u, degrees to the right (south) of the entry axis, degrees up]. Straight down the
    // gash to the star at first; by u 0.08 turned 16 degrees right, so the entry chimney towers right of centre and the gash
    // sweeps away lower left to the star; then down and back as we come through the notch, so the lander hangs low on the
    // right under its own lamps with the tower's foot and shelves beyond; then tourGaze lifts to the tower whole. (It
    // replaces a poi fixed on the star, which swung the gaze at 20 degrees a second as we passed 3 m from it.)
    const GAZE_IN = [[0, 1, -4], [0.035, 1, -5], [0.06, 9, 0], [0.08, 17, 6], [0.098, 13, 0], [0.12, 9, -10], [0.135, 8, -7], [0.17, 9, 8]];
    const _gi = V3();
    const inGaze = (t, u) => {
      path.posAtDist(u * L, _gi); const az = tableAt(GAZE_IN, u, 1) * RAD, el = tableAt(GAZE_IN, u, 2) * RAD;
      return _gi.set(_gi.x + Math.cos(az) * Math.cos(el) * 30, _gi.y + Math.sin(el) * 30, _gi.z + Math.sin(az) * Math.cos(el) * 30);
    };
    const tourGaze = (t, u) => {
      path.posAtDist(u * L, _g); let b = Math.atan2(_g.z, -_g.x) / RAD; if (b < -60) b += 360;
      const az = Math.atan2(-_g.z, -_g.x) + gazeAt(b, 1) * RAD, el = gazeAt(b, 2) * RAD;
      return _gz.set(_g.x + Math.cos(az) * Math.cos(el) * 30, _g.y + Math.sin(el) * 30, _g.z + Math.sin(az) * Math.cos(el) * 30);
    };

    // lander: on the notch floor, 4 m to the right of the line and 2 m under the eye as we pass
    const landerPos = V3(-46, 7.05, 6.0);
    // THE FALL AWAY AND THE FIRST OF THE RISE: one gaze, weight 1 (the blend is in here; it is listed twice in `pois`, which
    // changes nothing for the default camera and lets the steady camera, which takes a third of each poi, follow it more
    // than half way). From uF3 + 0.06 the dome turns back toward the tower and holds this frame while we pull away north
    // and come round: 23 degrees up, aimed between the ring and the lander's lamp (a quarter of the way from the ring
    // to the lamp, at most 17 degrees), so the tower's lit flank stands in the left third from bed to crown, the ring and
    // the great pool are top-centre and the lamp is low on the right with its beam climbing to the ring. Coming in to the
    // knee the lamp falls behind: the gaze swings on to the ring's own bearing and lifts to 29 degrees, and up the first
    // third of the rise it tips the rest of the way on to the line of flight (the ring).
    const starPt = V3(landerPos.x, landerPos.y + 4.4, landerPos.z + 0.42), _fp = V3(), _fd = V3(), _fg = V3();
    const fallGaze = (t, u) => {
      path.posAtDist(u * L, _fp);
      path.posAtDist(Math.min(u * L + 9, L), _fd).sub(_fp); if (_fd.lengthSq() < 1e-4) path.tangentAtDist(u * L, _fd); _fd.normalize();
      const aR = Math.atan2(seat.z - _fp.z, seat.x - _fp.x); let gap = Math.atan2(starPt.z - _fp.z, starPt.x - _fp.x) - aR; gap = Math.atan2(Math.sin(gap), Math.cos(gap));
      const kB = smoothstep(uKnee - 0.075, uKnee - 0.015, u), kC = smoothstep(uKnee + 0.02, uKnee + 0.11, u), kIn = smoothstep(uF3 + 0.062, uF3 + 0.118, u);
      // (first down and in: until uF3 + 0.12 the dome looks 9 degrees down at the tower's foot (the ring is then clear of the frame's top edge), its talus and clam beds, the hero
      // pool above; then it lifts to 15 by uF3 + 0.19, and the tower stands from foot to crown with the ring and the star, once)
      let az = aR + Math.min(0.26 * Math.max(gap, 0), 17 * RAD) * (1 - kB) - 5 * RAD * kB, el = lerp(lerp(-9, 15, smoothstep(uF3 + 0.115, uF3 + 0.195, u)), 38, kB) * RAD;
      if (kIn < 1) {      // the turn: from the helix gaze round to the left, by angle (a straight blend of two views 100 degrees apart would dip and rush)
        _fg.copy(tourGaze(t, u)).sub(_fp).normalize(); const a0 = Math.atan2(_fg.z, _fg.x), e0 = Math.asin(clamp(_fg.y, -1, 1));
        const da = Math.atan2(Math.sin(az - a0), Math.cos(az - a0)); az = a0 + da * kIn; el = lerp(e0, el, kIn);
      }
      _fg.set(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
      return _fg.lerp(_fd, kC).normalize().multiplyScalar(30).add(_fp);
    };
    const dirA = V3(-88, 4.5, 3.5).sub(V3(-46, 11.5, 5.6)).normalize();                 // raking west along the fissure, toward the entry
    const dirB = AN.greatPool.clone().add(V3(1.5, -3.5, -1.0)).sub(V3(-46, 11.5, 6.4)).normalize();   // tilted up at the great flange
    const landI0 = snow ? 6.5 : 5.5;
    hero.setLander(null, dirA, dirB, landI0);
    lamps.uLandPos.value[0].set(landerPos.x, landerPos.y + 4.4, landerPos.z - 0.42).addScaledVector(dirA, 0.16);
    lamps.uLandPos.value[1].set(landerPos.x, landerPos.y + 4.4, landerPos.z + 0.42).addScaledVector(dirB, 0.16);
    lamps.uLandFall.value = 18; lamps.uScatter.value.multiplyScalar(5);     // a slate fill strong enough that the bed is never black on black
    lamps.uLampI.value = warm ? 2.0 : 1.8; lamps.uLampFall.value = 8;
    const absorb0 = lamps.uAbsorb.value.clone();
    hero.setRing(seat, AN.portalSeat.normal, AN.portalSeat.radius, PALETTE[6], 1.6);

    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const colors = { uOchre: { value: C(PALETTE[1]) }, uRust: { value: C(PALETTE[2]) }, uBone: { value: C(PALETTE[3]).multiplyScalar(0.9) }, uMat: { value: C(PALETTE[4]) }, uCrimson: { value: C(PALETTE[5]).multiplyScalar(1.25) } };
    const mkMat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, fog: true, uniforms: { ...fogU(), ...lamps, ...colors, uTime, ...extra }, ...o });

    // ---------------------------------------------------------------- 3d. the bed
    const uHazeK = { value: warm ? V3(0.88, 1.03, 1.33) : V3(1, 1, 1) };      // (the sodium looks' warm grade takes the blue out of the darks; this puts it back, so the water is the same slate in every look. The bed's end takes the same)
    const sd = Math.floor(rng() * 1000), NOTCH_Z = 2.4;
    const lines = (lo, d0, d1, hi, step, grow) => { const a = []; for (let v = d0; v <= d1 + 1e-6; v += step) a.push(v); let s = step, v = d0; while (v > lo) { s *= grow; v -= s; a.unshift(v); } s = step; v = a[a.length - 1]; while (v < hi) { s *= grow; v += s; a.push(v); } return a; };
    const gx = lines(-118, -74, 30, 112, 0.78, 1.09), gz = lines(-100, -32, 26, 100, 0.78, 1.10);
    const uEnd = { value: new THREE.Vector4(gx[0], gx[gx.length - 1], gz[0], gz[gz.length - 1]) };      // the mesh's own ends (see THE BED'S END)
    const rawH = (x, z, out) => {
      const r = Math.hypot(x, z);
      let c = cell2(x / 2.7 + 31.3, z / 2.7 + 17.1, sd); const p1 = Math.sqrt(Math.max(0, 1 - c[0] * c[0] * 1.7)), s1 = c[1] - c[0];
      c = cell2(x / 8.5 + 3.3, z / 8.5 + 9.1, sd + 3); const p2 = Math.sqrt(Math.max(0, 1 - c[0] * c[0] * 1.4));
      let h = Math.max(0, 1.9 * p2 + 1.0 * p1 + 1.1 * noise.fbm2(x * 0.03, z * 0.03, 3));
      h *= 0.08 + 0.92 * smoothstep(8.5, 22, r);
      h += 11 * Math.pow(smoothstep(58, 115, r), 1.6);
      const xr = -44 + 3.0 * Math.sin(z * 0.09 + 1.3) * smoothstep(8, 22, Math.abs(z - NOTCH_Z)) + 1.5 * Math.sin(z * 0.23), dxr = x - xr;
      h = lerp(h, 5.6 + 0.45 * h, smoothstep(6, -6, dxr));                                       // the west plateau
      // THE BED'S END, its hills (BED_F melts the same stretch toward the water, to a share): over the last 18 m before the mesh's own end, and
      // from 102 m out from the middle (all of it by 118), the bed rises in great pillows 26 m and 10 m across, 1 to 9 m high.
      // They are read at the point where this direction from the middle meets the mesh's end, so each runs out to the end as
      // one ridge and none fills the gap between two others. Without them the small pillows' tops, row behind row, make one
      // level line right round the field. They stand back from the fissure's mouth (west: none within 8 m of z 4, whole from
      // 18 m either side): there the bed's SHAPE is as it was, its tone melts with the rest of the stretch (BED_F). The mat
      // keeps to the field: its value in the bed's map falls by 1.2 times the hills' weight (out.end), so no pale web of it
      // lies on a hill's face. (A great pillow's two numbers: 2.2 sets its foot 0.67 of a cell from its middle, since
      // 1 - 2.2 c c is 0 at c = 0.674, so it meets the ground 17.5 m, or 6.7 m, out; 0.75 rounds its flank between the small
      // pillows' half round, 0.5, and a plain bowl turned over, 1: at half its radius it stands 0.81 of its height. Both
      // were taken by trial on the count of straight crest runs in stage g, not derived)
      const wr = Math.max(smoothstep(18, 0, Math.min(x - gx[0], gx[gx.length - 1] - x, z - gz[0], gz[gz.length - 1] - z)), smoothstep(102, 118, r)) * (x < 0 ? smoothstep(8, 18, Math.abs(z - 4)) : 1);
      if (wr > 0) { const k = Math.min(x > 0 ? gx[gx.length - 1] / x : x < 0 ? gx[0] / x : 1e9, z > 0 ? gz[gz.length - 1] / z : z < 0 ? gz[0] / z : 1e9), ex = x * k, ez = z * k;
        c = cell2(ex / 26 + 5.7, ez / 26 + 2.3, sd + 11); const hh = 5 * Math.pow(Math.max(0, 1 - c[0] * c[0] * 2.2), 0.75); c = cell2(ex / 10 + 3.1, ez / 10 + 8.7, sd + 17);
        h += wr * (1 + hh + 3 * Math.pow(Math.max(0, 1 - c[0] * c[0] * 2.2), 0.75)); }
      const crest = 20 + 2.5 * Math.sin(z * 0.11) + 1.8 * noise.n2(z * 0.07, 3.3), g = Math.exp(-((dxr / (dxr > 0 ? 7.5 : 9.5)) ** 2));
      h += (crest + 0.7 * p1 - h) * g;                                                           // the pillow ridge
      // (its north wall flares open on the tower side, so the lander's lamp is in sight from the far north of the field)
      const dz = Math.abs(z - NOTCH_Z), nf = 7 + Math.max(0, dz - 4.6) * (z < NOTCH_Z ? lerp(2.7, 1.1, smoothstep(0, 4, dxr)) : 2.7) + 0.35 * p1 + 30 * smoothstep(10, 22, Math.abs(dxr));
      const inNotch = h > nf ? 1 : 0; h = Math.min(h, nf);                                       // the V notch
      const zf = 3.0 + 1.6 * Math.sin(x * 0.19 + 0.5) + 0.7 * Math.sin(x * 0.47) + 0.6 * noise.n2(x * 0.9, 7.7);
      const fx = smoothstep(-114, -102, x) * (1 - smoothstep(-53, -46, x)), fw = 1.3 + 1.0 * (0.5 + 0.5 * Math.sin(x * 0.13 + 2)), df = Math.abs(z - zf);
      h -= 3.6 * fx * (1 - smoothstep(fw * 0.35, fw, df));                                       // the fissure
      if (out) { out.p1 = p1; out.p2 = p2; out.s1 = s1; out.lip = fx * (1 - smoothstep(fw * 0.6, fw + 2.4, df)); out.notch = inNotch * (1 - smoothstep(5, 7, dz)); out.end = wr; }
      return h;
    };
    // the bed stays 6.4 m under the path wherever the path passes over it
    const capAt = (x, z) => {
      let cap = 1e9;
      if (x < -97 || x > 36 || z < -48 || z > 26) return cap;
      for (let i = 0; i <= NS; i += 2) { const dx = samp[i * 3] - x, dzz = samp[i * 3 + 2] - z, d2 = dx * dx + dzz * dzz; if (d2 < 64) { const v = samp[i * 3 + 1] - 6.4 + Math.max(0, Math.sqrt(d2) - 4.5) * 1.6; if (v < cap) cap = v; } }
      return Math.max(cap, -0.3);
    };
    const groundY = (x, z, out) => Math.min(rawH(x, z, out), capAt(x, z));
    {
      const nx = gx.length, nzz = gz.length, pos = new Float32Array(nx * nzz * 3), att = new Float32Array(nx * nzz * 3), o = {};
      for (let j = 0; j < nzz; j++) {
        for (let i = 0; i < nx; i++) {
          const x = gx[i], z = gz[j], k = (j * nx + i) * 3, h = groundY(x, z, o), r = Math.hypot(x, z);
          pos[k] = x; pos[k + 1] = h; pos[k + 2] = z;
          att[k] = clamp(0.30 * (1 - o.p2) + 1.0 * o.lip + 0.25 * o.notch + 0.25 * (1 - smoothstep(9, 16, r)), 0, 1) - 1.2 * o.end;
          att[k + 1] = clamp((1 - o.p2) * 0.9 * (0.5 + 0.5 * noise.n2(x * 0.06 + 40, z * 0.06)) * (1 - o.lip), 0, 1);
          att[k + 2] = clamp(0.35 + 0.65 * smoothstep(0.02, 0.22, o.s1) * (0.6 + 0.4 * o.p1), 0, 1) * (0.45 + 0.55 * smoothstep(7, 13, r));
          if (i % 60 === 59) await ctx.yield();
        }
        await ctx.yield();
      }
      const idx = new Uint32Array((nx - 1) * (nzz - 1) * 6); let w = 0;
      for (let j = 0; j < nzz - 1; j++) {
        for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; if ((i + j) & 1) { idx[w++] = a; idx[w++] = c; idx[w++] = b; idx[w++] = b; idx[w++] = c; idx[w++] = d; } else { idx[w++] = a; idx[w++] = c; idx[w++] = d; idx[w++] = a; idx[w++] = d; idx[w++] = b; } }
        if (j % 30 === 29) await ctx.yield();
      }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aBed', new THREE.BufferAttribute(att, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const nrm = await smoothNormals(pos, idx, ctx.yield); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.boundingSphere = new THREE.Sphere(V3(0, 5, 0), 165);
      // THE GRAIN ON STEEP FACES (see BED_F): how steep the bed stands at each vertex, by its own normal
      const stp = new Float32Array(nx * nzz); for (let k = 0; k < stp.length; k++) stp[k] = smoothstep(0.26, 0.5, 1 - nrm[k * 3 + 1]);
      await ctx.yield();
      // (and there the mat's own value, which the map's plan lays in the seams of the great pillows, would be drawn out down the
      // slope with them: on a steep face it gives way to its mean over the field, so the mat lies by the round pillows' seams)
      for (let k = 0, n = 0; k < stp.length; k++) { if (!(stp[k] > 0)) continue; const x = pos[k * 3], z = pos[k * 3 + 2]; groundY(x, z, o);
        att[k * 3] = clamp(0.30 * lerp(1 - o.p2, 0.16, stp[k]) + 1.0 * o.lip + 0.25 * o.notch + 0.25 * (1 - smoothstep(9, 16, Math.hypot(x, z))), 0, 1) - 1.2 * o.end; if (++n % 150 === 0) await ctx.yield(); }
      g.setAttribute('aSteep', new THREE.BufferAttribute(stp, 1));
      await ctx.yield();
      const bed = new THREE.Mesh(g, mkMat(BED_V, BED_F, { uFlow: { value: current ? 2.6 : 1 }, uVant, uFill, uHaze, uHazeK, uEnd })); bed.name = 'bed'; scene.add(bed);
    }
    {
      // THE FAR HILLS, their ground. The bed's mesh stops, and out there its cells are 4 to 9 m wide: the hills of its last
      // stretch would end in a polygon's outline, and where their ridges run out side by side the tops made one ruled line
      // (stage g, were they to show: straight over a tenth of the frame's width at 17 places in 100). So the stretch and the
      // 62 m beyond the bed's end have a ground of their own in cells of 3.2 m, in the bed's own material (BED_F holds its
      // tone, the share of it kept against the water and where it melts away): where the stretch's hills stand (weight 0.3
      // and up) it lies 0.35 m over the bed's law and carries the same ridges on beyond the end; where they do not it lies
      // 3 m under. Beyond the end it adds great pillows read in plan, 20 m and 9 m across (the dome of the bed's end
      // hills), that grow with the distance out: 5 m each, and 0.25 and 0.12 m more per metre as far as 50 m out; they
      // rise over the first 12 m and sink over the last 12. Row stands behind row, the further the taller, so the skyline
      // is several rows' and never one ridge's top. By the fissure's mouth (west) they hold back: none of this ground
      // within 28 m of z 4, the pillows whole from 46 m. The bed's own mesh is not touched. 16,410 triangles, one draw call more
      const X0 = gx[0], X1 = gx[gx.length - 1], Z0 = gz[0], Z1 = gz[gz.length - 1], SB = 3.2, hx = [], hz = [], dome = (c) => Math.pow(Math.max(0, 1 - c[0] * c[0] * 2.2), 0.75);
      for (let v = X0 - 62; v < X1 + 62 + SB; v += SB) hx.push(v); for (let v = Z0 - 62; v < Z1 + 62 + SB; v += SB) hz.push(v);
      const nx = hx.length, nz = hz.length, pos = new Float32Array(nx * nz * 3), att = new Float32Array(nx * nz * 3), on = new Uint8Array(nx * nz), o = {}; let n = 0;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = hx[i], z = hz[j], k = (j * nx + i) * 3, r = Math.hypot(x, z), bF = Math.min(x - X0, X1 - x, z - Z0, Z1 - z); pos[k] = x; pos[k + 2] = z;
        if ((bF > 18 && r < 102) || (x < 0 && Math.abs(z - 4) < 28)) continue;
        const eF = Math.max(-bF, r - 118), gateH = x < 0 ? smoothstep(24, 46, Math.abs(z - 4)) : 1, gr = Math.min(eF, 50); let far = 0;
        if (eF > 0 && gateH > 0) far = gateH * smoothstep(0, 12, eF) * (1 - smoothstep(50, 62, eF)) * ((5 + 0.25 * gr) * dome(cell2(x / 20 + 1.9, z / 20 + 6.3, sd + 23)) + (5 + 0.12 * gr) * dome(cell2(x / 9 + 7.7, z / 9 + 0.9, sd + 29)));
        on[j * nx + i] = 1; pos[k + 1] = groundY(x, z, o) + far + 3.35 * smoothstep(0, 0.3, o.end * gateH) - 3;
        att[k] = clamp(0.30 * (1 - o.p2) + 1.0 * o.lip, 0, 1) - 1.2 * o.end; att[k + 1] = clamp((1 - o.p2) * 0.9 * (0.5 + 0.5 * noise.n2(x * 0.06 + 40, z * 0.06)) * (1 - o.lip), 0, 1); att[k + 2] = clamp(0.35 + 0.65 * smoothstep(0.02, 0.22, o.s1) * (0.6 + 0.4 * o.p1), 0, 1);
        if (++n % 60 === 0) await ctx.yield(); }
      const idx = []; for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; if (!(on[a] && on[b] && on[c] && on[d])) continue; if ((i + j) & 1) idx.push(a, c, b, b, c, d); else idx.push(a, c, d, a, d, b); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(), ia = new Uint32Array(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aBed', new THREE.BufferAttribute(att, 3)); g.setIndex(new THREE.BufferAttribute(ia, 1));
      const nrm = await smoothNormals(pos, ia, ctx.yield); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.boundingSphere = new THREE.Sphere(V3(0, 15, 0), 260);
      const stp = new Float32Array(nx * nz); for (let k = 0; k < stp.length; k++) stp[k] = smoothstep(0.26, 0.5, 1 - nrm[k * 3 + 1]); g.setAttribute('aSteep', new THREE.BufferAttribute(stp, 1));
      await ctx.yield();
      const hills = new THREE.Mesh(g, scene.getObjectByName('bed').material); hills.name = 'far-hills'; scene.add(hills);
    }
    {
      // the water (see HAZE_F): drawn first, behind everything, round whichever camera is drawing
      const haze = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), new THREE.ShaderMaterial({ vertexShader: HAZE_V, fragmentShader: HAZE_F, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false,
        uniforms: { uLampDir: lamps.uLampDir, uBg: { value: C(PALETTE[0]) }, uTime, uHaze, uHazeK } }));
      haze.name = 'water-haze'; haze.frustumCulled = false; haze.renderOrder = -10; scene.add(haze);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- 3e. lesser chimneys, pass ledges, plumes, shimmer
    const rockMat = hero.object.getObjectByName('spire').material;
    const threadMat = hero.object.getObjectByName('threads').material;
    const crng = rng.fork('chimneys'), vents = [], vents2 = [], acc = { pos: [], mat: [], idx: [] };
    acc.feet = [];      // the lowest ring of every spire that stands on the bed (addSpire fills it; THE FEET, below, lays a talus apron from each)
    {
      // [x, z] or [x, z, height, smoker]. The first ten stand 10-14 m outside the tour, south and east. The tall ones are the
      // east ring, 41-47 m out: the backdrop of the look across the field and of the hero pool seen whole (u 0.3-0.5).
      // The last three stand west of the north vantage, right of the lander's star as seen from it: silhouettes and one plume.
      const staged = [[-30, -7], [-27, 24], [-34, 18], [3, 35], [36, 9], [33, -14], [-38, -16], [-13, 34], [20.5, 31.5], [27, 25],
        [38, 17, 19, 1], [41, 3, 21, 0], [40, -9, 22, 1], [37, -22, 24, 1], [31, -33, 25, 0], [22, -41, 26, 1], [12, -46, 24, 1], [30, -45, 26, 1], [44, -30, 27, 1], [47, -14, 25, 1],
        [-36, -26, 12, 1], [-38, -39, 10, 0],
        // on the plateau either side of the way in (the first frames had nothing between the fissure and the tower but black)
        [-63, -15, 11, 1], [-77, 21, 9, 0], [-58, 23, 12, 1], [-83, -19, 8, 0], [-70, -30, 13, 1], [-66, 34, 10, 0],
        // tall ones across the far north, beyond the loop of the fall away: the backdrop of the right half of the frame while
        // we come out from under F3 (they are behind the dome at the north vantage)
        [-30, -53, 23, 1], [-15, -59, 27, 0], [-2, -58, 21, 1], [-45, -45, 19, 0], [11, -57, 25, 1]];
      const spots = [];
      const ok = (x, z) => path.nearestXZ(x, z).dist > 9.5 && !(x < -36 && Math.abs(z - NOTCH_Z) < 14) && Math.abs(x + 44) > 9 && !spots.some((v) => Math.hypot(v[0] - x, v[1] - z) < 6);
      for (const s of staged) if (ok(s[0], s[1])) spots.push([s[0], s[1], 1, s[2] || 0, s[3]]);
      // (no chance chimney between the north vantage and the tower's foot or the lander: from there the tower stands whole)
      const CLEAR = [[8, -40], [-3, -48], [-18, -49], [-28, -38], [-27, -20], [-40, 0], [-30, 4], [-10, -10], [0, -12], [10, -14]];
      const inClear = (x, z) => { let c = false; for (let i = 0, j = CLEAR.length - 1; i < CLEAR.length; j = i++) { const a = CLEAR[i], b = CLEAR[j]; if ((a[1] > z) !== (b[1] > z) && x < (b[0] - a[0]) * (z - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
      for (let tries = 0; spots.length < 46 && tries < 1200; tries++) {
        const r = 18 + 52 * Math.pow(crng(), 0.85), a = crng.range(0, TAU), x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (ok(x, z) && !inClear(x, z)) spots.push([x, z, 0]);
        if (tries % 120 === 119) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < spots.length; i++) {
        const [x, z, st, tall, sm] = spots[i], smoker = tall ? sm === 1 : i % 10 < 3, sdv = crng();
        const Hr = st ? crng.range(7, 14) : 3 + 12 * Math.pow(crng(), 1.5), H = tall || Hr, r0 = 0.55 + H * 0.085, by = groundY(x, z) - 0.5;
        const close = path.nearestXZ(x, z).dist < 17;      // (the ones we pass close to: twice the rows and half the stacked bulge, or their flanks are saw-toothed terraces)
        const top = addSpire(acc, noise, x, by, z, H, r0, crng.range(-0.07, 0.07), crng.range(-0.07, 0.07), { cols: 14, rows: close ? clamp(Math.round(H * 2.7), 14, 36) : clamp(Math.round(H * 1.8), 9, tall ? 32 : 24), smoker, sd: sdv, fresh: smoker ? 0.9 : 0.35, bulge: close ? 0.10 : 0.20 });
        const nSide = 1 + Math.floor(crng() * 2.99);
        for (let k = 0; k < nSide; k++) {
          const a = crng.range(0, TAU), H2 = H * crng.range(0.28, 0.7), o = r0 * crng.range(0.75, 1.1);
          addSpire(acc, noise, x + Math.cos(a) * o, by, z + Math.sin(a) * o, H2, r0 * crng.range(0.5, 0.72), Math.cos(a) * 0.1, Math.sin(a) * 0.1, { cols: 10, rows: close ? clamp(Math.round(H2 * 2.4), 8, 20) : clamp(Math.round(H2 * 1.6), 6, 14), smoker: false, sd: crng(), fresh: 0.3, bulge: close ? 0.10 : 0.20 });
        }
        vents.push({ x: top.x, y: top.y, z: top.z, r: top.r, smoker, H });
        if (i % 4 === 3) await ctx.yield();
      }
      // a second rank across the south and south-east of the field, tall, beyond the first: the right half of the frame as
      // the dome levels after the notch (u 0.20-0.30), and a cold-rimmed backdrop low on the right up the rise. They draw
      // from their own stream (xrng), so nothing that was already here moves.
      for (const [x, z, H, sm] of [[-6, 36, 17, 1], [9, 37, 21, 0], [24, 36, 24, 1], [-2, 47, 19, 1], [36, 28, 26, 0], [16, 50, 23, 1], [-22, 34, 14, 1]]) {
        if (path.nearestXZ(x, z).dist < 9.5 || spots.some((v) => Math.hypot(v[0] - x, v[1] - z) < 5)) continue;
        const r0 = 0.55 + H * 0.085, by = groundY(x, z) - 0.5, nSide = 1 + Math.floor(xrng() * 2.99);
        const top = addSpire(acc, noise, x, by, z, H, r0, xrng.range(-0.06, 0.06), xrng.range(-0.06, 0.06), { cols: 12, rows: clamp(Math.round(H * 1.2), 9, 26), smoker: sm === 1, sd: xrng(), fresh: sm ? 0.9 : 0.35 });
        for (let k = 0; k < nSide; k++) {
          const a = xrng.range(0, TAU), H2 = H * xrng.range(0.28, 0.7), o = r0 * xrng.range(0.75, 1.1);
          addSpire(acc, noise, x + Math.cos(a) * o, by, z + Math.sin(a) * o, H2, r0 * xrng.range(0.5, 0.72), Math.cos(a) * 0.1, Math.sin(a) * 0.1, { cols: 10, rows: clamp(Math.round(H2 * 1.6), 6, 14), smoker: false, sd: xrng(), fresh: 0.3 });
        }
        vents2.push({ x: top.x, y: top.y, z: top.z, r: top.r, smoker: sm === 1, H });
        await ctx.yield();
      }
      // a ledge under each pass thicket: a smooth, swelling beehive buttress standing out of the trunk (18 rows: at 9, with
      // the spires' stacked bulges, it showed as terraces at the closest pass)
      const ledgeIdx = [];
      {
        // the worm mound south of the tower (its thicket is one of the hero's): a broad beehive with two shoulders
        const i0 = acc.idx.length, by = groundY(moundAt.x, moundAt.z) - 0.6;
        addSpire(acc, noise, moundAt.x, by, moundAt.z, MOUND_TOP - by, 2.5, 0, 0, { cols: 18, rows: 22, smoker: false, sd: 0.37, fresh: 0.25, mound: true, bulge: 0.07 });
        for (const [a, hh, rr] of [[2.2, 0.62, 1.25], [4.6, 0.45, 1.05]]) addSpire(acc, noise, moundAt.x + Math.cos(a) * 2.0, by, moundAt.z + Math.sin(a) * 2.0, (MOUND_TOP - by) * hh, rr, Math.cos(a) * 0.08, Math.sin(a) * 0.08, { cols: 12, rows: 10, smoker: false, sd: 0.2 + 0.1 * a, fresh: 0.3, mound: true, bulge: 0.08 });
        ledgeIdx.push([i0, acc.idx.length, { x: moundAt.x, y: MOUND_TOP, z: moundAt.z }]);
        // the entry chimney: tall, smoking, on the plateau south of the fissure; it looms on the right as the dome runs low along the gash
        const ex = -52.5, ez = 14.0, eH = 15.5, er = 0.55 + eH * 0.085, eby = groundY(ex, ez) - 0.5;
        const top = addSpire(acc, noise, ex, eby, ez, eH, er, -0.03, -0.04, { cols: 16, rows: 34, smoker: true, sd: 0.61, fresh: 0.9, bulge: 0.1 });
        addSpire(acc, noise, ex - 1.5, eby, ez + 0.9, eH * 0.55, er * 0.66, -0.09, 0.05, { cols: 12, rows: 16, smoker: false, sd: 0.23, fresh: 0.3, bulge: 0.1 });
        addSpire(acc, noise, ex + 1.3, eby, ez - 1.2, eH * 0.36, er * 0.6, 0.08, -0.08, { cols: 12, rows: 12, smoker: false, sd: 0.82, fresh: 0.3, bulge: 0.1 });
        vents2.push({ x: top.x, y: top.y, z: top.z, r: top.r, smoker: true, H: eH });
      }
      for (const l of LEDGES) {
        const rr = Math.hypot(l.x, l.z) || 1, ox = l.x / rr, oz = l.z / rr, i0 = acc.idx.length;
        addSpire(acc, noise, l.x - ox * 0.75, l.y - 2.95, l.z - oz * 0.75, 3.0, 1.5, ox * 0.13, oz * 0.13, { cols: 16, rows: 18, smoker: false, sd: crng(), fresh: 0.2, flat: true });
        ledgeIdx.push([i0, acc.idx.length, l]);
      }
      // THE FEET. A spire's lowest ring lies at one height (the ground under its middle, less half a metre), 2 to 18 m across,
      // and the bed is not level under it: on the ridge's flank the entry chimney's foot hung 4 to 6 m over the ground, a
      // flat cut with water under it, and so, by less, did one spire in two of the field. What really lies under such a
      // chimney is talus, its own fallen pieces in a slope (the brief: "snapped spires and talus at the foot"). So from every
      // place of that ring that stands over the bed a TALUS APRON falls away, outward (along the line from the foot's middle
      // through that place) and down at 35 degrees, the angle of repose of loose angular blocks (scree lies at 33 to 37), until
      // it is 0.9 m under the bed (BURY: its lower edge is never seen; the line where it lands is where a 35 degree slope
      // meets the pillows). Where the bed at a place of the ring is at or above the ring nothing is added. So on level ground
      // the apron is a low collar, on a flank a fan that is long downhill and short uphill. A ray ends early, at its reach,
      //   - at twice the foot's own radius at that place (a spire sheds its pieces within its own width of its foot; what
      //     rolls further down a bed steeper than repose does not stay to make a slope),
      //   - before the fissure and its white lips (the bed's own lip attribute over 0),
      //   - before the level floor of the carve under the route (4.5 m level from the route's line, where the bed is carved:
      //     on the carve's bank it may lie, on its floor nothing is laid) and before 3 m of the line itself,
      //   - no more than one step further than the ray beside it (the step between their ends: the side of a pile lies at
      //     repose like its front, so its outline has no slot and no fin); a place of the ring that stands in the bed limits
      //     no ray beside it (nothing falls from it: held to it, a whole flank ended early and stood as one steep dark face),
      // and a ray that has not landed by its reach falls from the ring to 0.9 m under the bed at its reach in one even slope,
      // steeper than repose by what is missing: it thins to nothing there, with no cut face and no free edge (where the
      // rules leave a hanging place no reach at all, that even slope is the foot's own wall carried straight down).
      // Its surface is fallen pieces: every vertex is moved along the sheet's own normal by the world's noise in its own
      // metres (lumps 1 m and 0.37 m across, 0.35 and 0.15 m high; the rock shader's own knobs of 0.6 and 0.19 m lie on top),
      // from nothing at the ring to full 0.6 m down the sheet, on a mesh of rows 0.7 m apart (12 rows at most: up to 2.0 m
      // on the longest falls) and columns no wider than 0.9 m half way out (each place of the ring is split into up to 4
      // rays; up to 1.4 m where 4 are too few). Its stone: the apron hangs on the ring's own vertices and every row keeps
      // the foot's stone, all three values of aMat as the ring has them. FALLEN STONE ENDS IN THE BED: over the sheet lies
      // the bed's own stone, drawn by the bed's own shader with the bed's own three values at that place (read from the
      // bed's mesh), as far as the row has come of its ray's fall from the ring to where the sheet goes under the bed:
      // nothing at the ring, half at half that fall, wholly there and under the bed. So what shows changes evenly from the
      // foot's stone to the bed's over the whole fall, whatever its length and on every mineral, and where the sheet goes
      // under the bed it is the bed (mesh 'apron-hems': the aprons' own triangles once more, see-through by that share).
      // It is the spire's own geometry, drawn by the ground and the fixed places alone: nothing is seated, turned or sized by
      // it, and it draws no chance. Its vertices and triangles are laid after everything else of this mesh, so every vertex
      // and index that was here before keeps its place and its number (and the ledges' triangles given to the mirrors are
      // the same ones). acc.rays keeps every ray [first vertex, rows, ring x, ring z, cos, sin, reach, ring height, moved
      // in 3g, laid without lumps, its place round the ring, whether that place stands in the bed, the ring's three aMat
      // values there] and acc.fans every foot's apron [its first index, end, x, z, radius with reach, first ray, rows, rays
      // round, end of its rays, whether stone closes the foot all round], for 3g: once the cast is seated the aprons give
      // way to it (THE APRONS AND THE SEATS, after the clams).
      {
        const REPOSE = acc.repose = Math.tan(35 * RAD), BURY = 0.9, STEP = 0.3, o = {};
        acc.rays = []; acc.fans = []; acc.stp = []; acc.hem = new Array(acc.pos.length / 3 * 4).fill(0);      // (acc.hem: aHem of 'apron-hems', four values a vertex)
        // what the bed is at a place of the map, read from the bed's own mesh (the four vertices round the place): its height as it
        // is drawn (o.bh) and the three values of its aBed there (o.bm its mat, o.bf its floc, o.bs its own shade)
        const bedG = scene.getObjectByName('bed').geometry, bedP = bedG.attributes.position.array, bedA = bedG.attributes.aBed.array, bedT = bedG.attributes.aSteep.array, bedN = gx.length * 3;
        const lineOf = (g, v) => { let a = 0, b = g.length - 2; while (a < b) { const m = (a + b + 1) >> 1; if (g[m] <= v) a = m; else b = m - 1; } return a; };
        const bedAt = (x, z) => {
          const i = lineOf(gx, x), j = lineOf(gz, z), tx = clamp((x - gx[i]) / (gx[i + 1] - gx[i]), 0, 1), tz = clamp((z - gz[j]) / (gz[j + 1] - gz[j]), 0, 1), k = j * bedN + i * 3;
          o.bh = lerp(lerp(bedP[k + 1], bedP[k + 4], tx), lerp(bedP[k + bedN + 1], bedP[k + bedN + 4], tx), tz); o.bs = lerp(lerp(bedA[k + 2], bedA[k + 5], tx), lerp(bedA[k + bedN + 2], bedA[k + bedN + 5], tx), tz);
          o.bm = lerp(lerp(bedA[k], bedA[k + 3], tx), lerp(bedA[k + bedN], bedA[k + bedN + 3], tx), tz); o.bf = lerp(lerp(bedA[k + 1], bedA[k + 4], tx), lerp(bedA[k + bedN + 1], bedA[k + bedN + 4], tx), tz);
          o.bt = lerp(lerp(bedT[k / 3], bedT[k / 3 + 1], tx), lerp(bedT[(k + bedN) / 3], bedT[(k + bedN) / 3 + 1], tx), tz);      // (how steep the bed stands there: aSteep)
        };
        // how near a place is to the route's line: level distance (o.dh) and true distance (o.d3) to its samples
        const lineAt = (x, y, z) => { let dh = 1e9, d3 = 1e9; for (let i = 0; i <= NS; i++) { const dx = samp[i * 3] - x, dz = samp[i * 3 + 2] - z, dy = samp[i * 3 + 1] - y, h2 = dx * dx + dz * dz; if (h2 < dh) dh = h2; if (h2 + dy * dy < d3) d3 = h2 + dy * dy; } o.dh = Math.sqrt(dh); o.d3 = Math.sqrt(d3); };
        // how far a ray falls from the ring to its end: at repose if it lands, else what the bed asks (the end lies BURY under it)
        const fallOf = (px, pz, c, s, Lr, by) => Math.max(Lr * REPOSE, by - (groundY(px + c * Lr, pz + s * Lr) - BURY), 0);
        // one ray's rows, from its reach (also used again in 3g for a ray that gives way to a seat); ray[9]: no lumps. And each
        // row's stone (see THE FEET, "Its stone"): the ring's own, and in hem the bed's own three values under the row and the row's
        // share of the ray's fall from the ring to where its sheet goes under the bed (end, counted in rows: the rows are equal steps
        // of the fall; a toe that stays over the bed is the end): 0 at the ring, 1 there, over 1 under the bed (the shader stops it
        // at 1), and 1 all along a ray whose place of the ring stands in the bed
        acc.lay = (ray, pos, mat, hem) => {
          const [v0, NR, px, pz, c, s, Lr, by] = ray, fall = fallOf(px, pz, c, s, Lr, by), run = Math.hypot(Lr, fall) || 1, nh = fall / run, nv = Lr / run;
          bedAt(px, pz); let hp = by - o.bh, landed = !(hp > 0), end = landed ? 0 : NR;      // (hp: how far the row before stands over the bed)
          for (let j = 1; j <= NR; j++) {
            const f = j / NR, x = px + c * Lr * f, z = pz + s * Lr * f, y = by - fall * f, k = (v0 + j - 1) * 3;
            const lump = ray[9] ? 0 : (0.35 * noise.n3(x, y, z) + 0.15 * noise.n3(x * 2.7 + 11, y * 2.7, z * 2.7)) * smoothstep(0, 0.6, run * f);
            pos[k] = x + c * nh * lump; pos[k + 1] = y + nv * lump; pos[k + 2] = z + s * nh * lump;
            bedAt(pos[k], pos[k + 2]); const h = pos[k + 1] - o.bh, q = (v0 + j - 1) * 4;
            if (!landed && h <= 0) { end = j - 1 + hp / (hp - h); landed = true; } hp = h;
            mat[k] = ray[12]; mat[k + 1] = ray[13]; mat[k + 2] = ray[14];
            hem[q] = o.bm; hem[q + 1] = o.bf; hem[q + 2] = o.bs; acc.stp[v0 + j - 1] = o.bt;
          }
          for (let j = 1; j <= NR; j++) hem[(v0 + j - 1) * 4 + 3] = end > 0 ? j / end : 1;
        };
        // the side of a pile lies at repose like its front: round the ring a reach is longer than its neighbour's by no more than
        // the step between the two rays' ends (a place that stands in the bed, [11], limits none). rs: a foot's rays by their
        // place round the ring; returns the ones it shortened
        acc.ease = (rs, M, bx, bz) => {
          const out = [];
          for (const dir of [1, M - 1]) for (let n = 0, i = 0; n < 2 * M; n++, i = (i + dir) % M) {
            const a = rs[i], b = rs[(i + dir) % M]; if (!a || !b || a[11]) continue;
            const lim = a[6] + (Math.hypot(a[2] - bx, a[3] - bz) + a[6]) * TAU / M; if (b[6] > lim) { b[6] = lim; out.push(b); }
          }
          return out;
        };
        for (let fi = 0; fi < acc.feet.length; fi++) {
          const [b0, cols, bx, by, bz] = acc.feet[fi];
          let Rm = 0; for (let q = 0; q < cols; q++) Rm = Math.max(Rm, Math.hypot(acc.pos[(b0 + q) * 3] - bx, acc.pos[(b0 + q) * 3 + 2] - bz));
          const near = path.nearestXZ(bx, bz).dist < 3 * Rm + 6;      // (only a foot whose apron could come within 4.5 m of the line reads the line)
          const reach = (px, pz) => {
            const R0 = Math.hypot(px - bx, pz - bz) || 1e-3, c = (px - bx) / R0, s = (pz - bz) / R0;
            o.sit = by <= groundY(px, pz); if (o.sit) return 0;      // (o.sit: this place of the ring stands in the bed; nothing falls from it)
            for (let d = STEP; ; d += STEP) {
              const x = px + c * d, z = pz + s * d, y = by - d * REPOSE, h = rawH(x, z, o), cut = capAt(x, z);
              if (o.lip > 0) return d - STEP;
              if (near) { lineAt(x, y, z); if (o.d3 < 3.5 || (o.dh < 5 && cut < h)) return d - STEP; }      // (half a metre more than the rule: the tallest lump)
              if (y <= Math.min(h, cut) - BURY) return d;
              if (d >= 2 * R0) return 2 * R0;
            }
          };
          // the ring's own places first: their longest reach says how finely this apron is cut
          const L0 = [], S0 = []; let Lmax = 0, runMax = 0, shut = true;
          for (let q = 0; q < cols; q++) {
            const px = acc.pos[(b0 + q) * 3], pz = acc.pos[(b0 + q) * 3 + 2], R0 = Math.hypot(px - bx, pz - bz) || 1e-3; L0.push(reach(px, pz)); S0.push(o.sit); Lmax = Math.max(Lmax, L0[q]);
            runMax = Math.max(runMax, Math.hypot(L0[q], fallOf(px, pz, (px - bx) / R0, (pz - bz) / R0, L0[q], by)));
            bedAt(px, pz); acc.hem[(b0 + q) * 4] = o.bm; acc.hem[(b0 + q) * 4 + 1] = o.bf; acc.hem[(b0 + q) * 4 + 2] = o.bs; acc.hem[(b0 + q) * 4 + 3] = by > o.bh ? 0 : 1; acc.stp[b0 + q] = o.bt;      // (the ring's own share: none of the fall where it stands over the bed, all of it where it stands in it)
          }
          await ctx.yield();
          const k = clamp(Math.ceil(TAU * (Rm + 0.5 * Lmax) / cols / 0.9), 1, 4), M = cols * k, NR = clamp(Math.ceil(runMax / 0.7), 2, 12), P = [], vid = new Int32Array(M).fill(-1), r0 = acc.rays.length, t0 = acc.idx.length;
          for (let i = 0; i < M; i++) {
            const q = Math.floor(i / k), q1 = (q + 1) % cols, w = (i % k) / k, A = (b0 + q) * 3, B = (b0 + q1) * 3, px = lerp(acc.pos[A], acc.pos[B], w), pz = lerp(acc.pos[A + 2], acc.pos[B + 2], w);
            const Lq = w ? reach(px, pz) : L0[q]; P.push([0, 0, px, pz, 0, 0, Lq, 0, 0, 0, 0, w ? o.sit : S0[q]]);
          }
          acc.ease(P, M, bx, bz);
          if (k > 1) await ctx.yield();
          for (let q = 0; q < cols; q++) {
            const i0 = q * k, q1 = (q + 1) % cols; let any = false;
            for (let m = 0; m <= k; m++) if (P[(i0 + m) % M][6] > 0) any = true;
            if (!any) { for (let m = 0; m <= k; m++) if (!P[(i0 + m) % M][11]) shut = false; continue; }      // (an edge that hangs over the bed and sheds nothing: this foot is left open there)
            for (let m = 0; m <= k; m++) {
              const i = (i0 + m) % M; if (vid[i] >= 0) continue;
              const px = P[i][2], pz = P[i][3], R0 = Math.hypot(px - bx, pz - bz) || 1e-3, w = (i % k) / k, A = (b0 + Math.floor(i / k)) * 3, B = (b0 + (Math.floor(i / k) + 1) % cols) * 3;
              const ray = [vid[i] = acc.pos.length / 3, NR, px, pz, (px - bx) / R0, (pz - bz) / R0, P[i][6], by, 0, 0, i, P[i][11], lerp(acc.mat[A], acc.mat[B], w), lerp(acc.mat[A + 1], acc.mat[B + 1], w), lerp(acc.mat[A + 2], acc.mat[B + 2], w)];
              for (let j = 1; j <= NR; j++) { acc.pos.push(0, 0, 0); acc.mat.push(0, 0, 0); acc.hem.push(0, 0, 0, 0); }
              acc.rays.push(ray); acc.lay(ray, acc.pos, acc.mat, acc.hem);
            }
            // the ring's edge to the first row (a fan from either end of the edge: no new vertex on the ring), then the rows
            const h = k >> 1;
            for (let m = 0; m < k; m++) { const a = vid[(i0 + m) % M], b = vid[(i0 + m + 1) % M]; acc.idx.push(a, b0 + (m < h ? q : q1), b); for (let j = 1; j < NR; j++) acc.idx.push(a + j, a + j - 1, b + j, b + j, a + j - 1, b + j - 1); }
            acc.idx.push(vid[(i0 + h) % M], b0 + q, b0 + q1);
          }
          acc.fans.push([t0, acc.idx.length, bx, bz, Rm + Lmax, r0, NR, M, acc.rays.length, shut]);
        }
      }
      await ctx.yield();
      const cp = new Float32Array(acc.pos); await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(cp, 3)); g.setAttribute('aMat', f32(acc.mat, 3)); g.setIndex(acc.idx);
      await ctx.yield();
      g.setAttribute('normal', new THREE.BufferAttribute(await smoothNormals(cp, acc.idx, ctx.yield), 3)); g.boundingSphere = new THREE.Sphere(V3(0, 8, 0), 90);
      const m = new THREE.Mesh(g, rockMat); m.name = 'lesser-chimneys'; scene.add(m);
      // the aprons' hem (THE FEET, "Its stone"): the aprons' own triangles once more (the same vertices, normals and indices: they
      // lie last), in the bed's stone with the bed's own uniforms, see-through by aHem's share. It is the rock's own face, so it is
      // drawn before every other see-through thing, and one step of the depth buffer nearer than the rock it lies on
      {
        const hg = new THREE.BufferGeometry(), t0 = acc.fans.length ? acc.fans[0][0] : acc.idx.length; hg.setAttribute('position', g.getAttribute('position')); hg.setAttribute('normal', g.getAttribute('normal'));
        hg.setAttribute('aHem', new THREE.BufferAttribute(acc.hem = new Float32Array(acc.hem), 4)); hg.setAttribute('aSteep', new THREE.BufferAttribute(acc.stp = Float32Array.from({ length: cp.length / 3 }, (_, i) => acc.stp[i] || 0), 1)); hg.setIndex(g.index); hg.setDrawRange(t0, acc.idx.length - t0); hg.boundingSphere = g.boundingSphere;
        const hem = new THREE.Mesh(hg, mkMat(HEM_V, HEM_F, { uFlow: scene.getObjectByName('bed').material.uniforms.uFlow, uVant, uFill, uHaze, uHazeK, uEnd }, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
        hem.name = 'apron-hems'; hem.renderOrder = -1; scene.add(hem);
      }
      // the ledges under a pass shelf also show upside down in its mirror (same vertex data, their triangles only)
      hero.flanges.forEach((F, fi) => {
        if (!F.pass) return; const sub = [];
        for (const [i0, i1, l] of ledgeIdx) { const u = l.x * F.o[0] + l.z * F.o[1] - F.r0, v = l.x * F.t[0] + l.z * F.t[1]; if (l.y < F.yc && l.y > F.yc - 12 && u < F.Lr + 4 && Math.abs(v) < F.Lw + 6) for (let i = i0; i < i1; i++) sub.push(acc.idx[i]); }
        if (!sub.length) return;
        const gm = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'aMat']) gm.setAttribute(k, g.getAttribute(k)); gm.setIndex(sub);
        hero.mirrorRock(gm, fi);
      });
      await ctx.yield();
    }
    const uPlumeK = { value: 1 }, leanT = Math.tan(hero.lean ?? 0.2), uEmberC = { value: C('#FF8E3C').multiplyScalar(0.8 * lerp(0.85, 1.2, mood)) };
    {
      // plumes of the smokers
      const pos = [], nrm = [], apl = [], idx = [], rows = 18, cols = 16;
      for (const [list, rr] of [[vents, crng], [vents2, xrng]]) for (const v of list) {
        if (!v.smoker) continue;
        const rank = list === vents2, base = pos.length / 3, sdv = rr(), H = rr.range(5, 8) + v.H * 0.3 + (rank ? 2.5 : 0), r0 = Math.max(v.r * (rank ? 1.15 : 0.8), rank ? 0.34 : 0.22);      // (the field rank's smoke is seen from 25-40 m: fuller and taller)
        for (let r = 0; r <= rows; r++) for (let q = 0; q < cols; q++) { const a = q / cols * TAU; pos.push(v.x, v.y - 0.35, v.z); nrm.push(Math.cos(a), 0, Math.sin(a)); apl.push(r / rows, sdv, H, r0); }
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const a = base + r * cols + q, b = base + r * cols + (q + 1) % cols, c = a + cols, d = b + cols; idx.push(a, c, b, b, c, d); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('normal', f32(nrm, 3)); g.setAttribute('aPl', f32(apl, 4)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(V3(0, 10, 0), 95);
      const soot = look.mineral === 'white' ? C(PALETTE[4]).multiplyScalar(0.55) : new THREE.Color(0.10, 0.11, 0.125);
      const m = new THREE.Mesh(g, mkMat(PLUME_V, PLUME_F, { uLeanT: { value: leanT }, uSoot: { value: soot }, uEmberC, uCore: { value: look.mineral === 'white' ? 0.5 : 0.16 }, uCold: { value: look.mineral === 'white' ? 0.42 : 1 }, uPlumeK })); m.name = 'plumes'; scene.add(m);      // (uCold: the slate back-scatter that models far smoke; milky smoke over white stone takes less than half, or it turns into blue ribbons)
    }
    const zfAt = (x) => 3.0 + 1.6 * Math.sin(x * 0.19 + 0.5) + 0.7 * Math.sin(x * 0.47) + 0.6 * noise.n2(x * 0.9, 7.7);
    {
      // shimmer threads over the fissure and every quiet vent (the hero's thread shader, so they bend alike)
      const tp = [], ta = [], ti = [], seg = 12;
      // (broad: a seed of 1.x tells the part's thread shader to draw the ribbon half as wide again and brighter)
      const thread = (x, y, z, len, broad = 0, rr = crng) => { const b = tp.length / 3, sdv = broad ? 1.02 + 0.96 * rr() : rr();
        for (let i = 0; i <= seg; i++) for (let s = -1; s <= 1; s += 2) { tp.push(x, y, z); ta.push(i / seg, s, len, sdv); }
        for (let i = 0; i < seg; i++) { const a = b + i * 2; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
      const nF = Math.round(56 * detail);
      for (let i = 0; i < nF; i++) { const x = lerp(-100, -50, (i + crng()) / nF), z = zfAt(x) + crng.range(-0.8, 0.8); thread(x, groundY(x, z) + 0.6, z, crng.range(3, 7), 1); }
      for (const v of vents) { if (v.smoker) continue; for (let k = 0; k < 2; k++) thread(v.x + crng.range(-0.2, 0.2), v.y - 0.1, v.z + crng.range(-0.2, 0.2), crng.range(2.5, 6)); }
      for (const v of vents2) { if (v.smoker) continue; for (let k = 0; k < 2; k++) thread(v.x + xrng.range(-0.2, 0.2), v.y - 0.1, v.z + xrng.range(-0.2, 0.2), xrng.range(2.5, 6), 0, xrng); }
      {
        // a curtain of broad threads on the part of F3's spill lip that stands against open water as we come under it: of
        // 28 places along the arc, the ten that are best in frame (and clear of the trunk behind) from three stations
        const F = hero.flanges[2], pv = [0, 0, 0], cand = [], e1 = V3(), e2 = V3(), gd = V3(), dd = V3(), cam = V3(), tanV = Math.tan(37.5 * RAD);
        for (let i = 0; i < 28; i++) {
          const phi = F.phi0 + (i / 27 * 2 - 1) * F.phis * 0.94, e = F.E(phi), yl = F.yc + F.rl - F.skirt(phi);
          F.at(e - F.rl + (F.rl + 0.05) * 0.64, phi, yl + (F.rl + 0.05) * 0.77, pv);
          let score = 0;
          for (const uu of [uF3 - 0.04, uF3 - 0.015, uF3 + 0.01]) {
            path.pointAt(uu, cam); gd.copy(tourGaze(0, uu)).sub(cam).normalize(); e1.crossVectors(gd, V3(0, 1, 0)).normalize(); e2.crossVectors(e1, gd);
            dd.set(pv[0], pv[1] + 1.2, pv[2]).sub(cam); const dep = dd.dot(gd); if (dep < 4) continue;
            const sx = dd.dot(e1) / dep / (tanV * 1.6), sy = dd.dot(e2) / dep / tanV, far = cam.clone().addScaledVector(dd, 2.4);
            if (Math.abs(sx) < 0.9 && sy > -0.6 && sy < 0.8 && Math.hypot(far.x, far.z) > 10.5) score += 1.2 - Math.abs(sx) - 0.4 * Math.max(sy, 0);
          }
          cand.push([score, pv[0], pv[1], pv[2]]);
        }
        cand.sort((a, b) => b[0] - a[0]);
        for (let i = 0; i < 10; i++) { const c = cand[i]; thread(c[1] + xrng.range(-0.1, 0.1), c[2], c[3] + xrng.range(-0.1, 0.1), xrng.range(3.5, 6.5), 1, xrng); }
        // and the feeders: three threads of hot water that climb from cracks in the bed under the shelf all the way up into
        // its pool (a seed of 2.x keeps them lit to the top): silver ribbons dripping upward into the mirror
        let nFeed = 0;
        for (const [dphi, rho] of [[-0.42, 0.72], [0.02, 0.80], [0.40, 0.66], [-0.2, 0.6], [0.22, 0.58], [0, 0.5], [-0.5, 0.5], [0.5, 0.5]]) {
          const phi = F.phi0 + dphi * F.phis; F.at(rho * F.E(phi), phi, F.yc, pv);
          if (nFeed >= 3 || path.nearestXZ(pv[0], pv[2]).dist < 9.5) continue;      // (never a wire across the dome)
          nFeed++; const y0 = groundY(pv[0], pv[2]) + 0.3, b = tp.length / 3, sdv = 2.05 + 0.9 * ((dphi * 7.3 + 10.4) % 1);
          for (let i = 0; i <= seg; i++) for (let s = -1; s <= 1; s += 2) { tp.push(pv[0], y0, pv[2]); ta.push(i / seg, s, (F.yc - 0.15 - y0) / 0.98, sdv); }
          for (let i = 0; i < seg; i++) { const a = b + i * 2; ti.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(tp, 3)); g.setAttribute('aT', f32(ta, 4)); g.setIndex(ti);
      g.boundingSphere = new THREE.Sphere(V3(-20, 8, 0), 110);
      const m = new THREE.Mesh(g, threadMat); m.name = 'field-shimmer'; m.renderOrder = 3; scene.add(m);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- 3f. the lander, its beams and its star
    const lander = new THREE.Mesh(await landerGeo(dirA, dirB, ctx.yield), mkMat(SOFT_V, CRIT_F, { uFoul: { value: 1 }, uSoft: { value: 0 }, uFish: { value: 0 }, uRow: { value: 0 } }));
    lander.name = 'lander'; lander.position.copy(landerPos); scene.add(lander);
    await ctx.yield();
    const uBeam = { value: snow ? 1.4 : 1 }, uLen = { value: [34, 62] }, uBeamK = { value: new THREE.Vector2(1, 1) }, uBeamIn = { value: new THREE.Vector2(0, 0) }, uShaft = { value: 0 }, uTaper = { value: 1 };
    {
      // the hull of each cone (a closed frustum: side, lamp cap, end cap); the shader does the rest
      const pos = [], nrm = [], uv = [], idx = [], rows = 6, cols = 22;
      for (let bi = 0; bi < 2; bi++) { const base = pos.length / 3;
        for (let r = 0; r <= rows; r++) for (let q = 0; q < cols; q++) { const a = q / cols * TAU; pos.push(Math.cos(a), 0, Math.sin(a)); nrm.push(Math.cos(a), 0, Math.sin(a)); uv.push(r / rows, bi); }
        for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const a = base + r * cols + q, b = base + r * cols + (q + 1) % cols, c = a + cols, d = b + cols; idx.push(a, c, b, b, c, d); }
        for (const [t, ny] of [[0, -1], [1, 1]]) { const c0 = pos.length / 3; pos.push(0, 0, 0); nrm.push(0, ny, 0); uv.push(t, bi);
          for (let q = 0; q < cols; q++) { const a = q / cols * TAU; pos.push(Math.cos(a), 0, Math.sin(a)); nrm.push(0, ny, 0); uv.push(t, bi); }
          for (let q = 0; q < cols; q++) idx.push(c0, c0 + 1 + q, c0 + 1 + (q + 1) % cols); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', f32(pos, 3)); g.setAttribute('normal', f32(nrm, 3)); g.setAttribute('uv', f32(uv, 2)); g.setIndex(idx);
      const beamMat = new THREE.ShaderMaterial({ vertexShader: BEAM_V, fragmentShader: BEAM_F, uniforms: { uLandPos: lamps.uLandPos, uLandDir: lamps.uLandDir, uLandCol: lamps.uLandCol, uLandI: lamps.uLandI, uAbsorb: lamps.uAbsorb, uTime, uLen, uBeam, uBeamK, uBeamIn, uShaft, uTaper },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const beams = new THREE.Mesh(g, beamMat); beams.name = 'beams'; beams.frustumCulled = false; beams.renderOrder = 4; scene.add(beams);
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', f32([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0, -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      sg.setAttribute('uv', f32([0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0], 2)); sg.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
      const starMat = new THREE.ShaderMaterial({ vertexShader: STAR_V, fragmentShader: STAR_F, uniforms: { uLandPos: lamps.uLandPos, uLandDir: lamps.uLandDir, uLandCol: lamps.uLandCol, uLandI: lamps.uLandI },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      const star = new THREE.Mesh(sg, starMat); star.name = 'lens-star'; star.frustumCulled = false; star.renderOrder = 5; scene.add(star);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- 3g. the cast
    const wrng = rng.fork('cast');
    const instanced = (geo, attrs, count, mat, name, order = 0) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
      for (const [n, arr, sz] of attrs) g.setAttribute(n, new THREE.InstancedBufferAttribute(new Float32Array(arr), sz));
      g.instanceCount = count; const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = name; m.renderOrder = order; scene.add(m); return m;
    };
    const critMat = (vs, u) => mkMat(vs, CRIT_F, { uFoul: { value: 0 }, uSoft: { value: 0 }, uFish: { value: 0 }, ...u }, { side: THREE.DoubleSide });
    const crawlU = (size, range, seethe, wave) => ({ uSize: { value: size }, uRange: { value: range }, uSeethe: { value: seethe }, uWave: { value: wave } });
    {
      // seething on the hot wall under every pool: vent shrimp, or yeti crabs, or scaly-foot snails
      const cast = look.cast, n = Math.round((cast === 'yeti' ? 170 : cast === 'snails' ? 560 : 760) * detail * lerp(1, density, 0.6))      /* (the helix now passes 9 m off the wall: half the first cut's crowd reads the same) */, share = [0.2, 0.22, 0.3, 0.08, 0.06, 0.14];
      const pos = [], nrm = [];
      hero.flanges.forEach((F, fi) => {
        const th0 = Math.atan2(F.o[1], F.o[0]), half = F.Lw * 0.95 / 7.5, cnt = Math.round(n * share[fi]);
        for (let k = 0; k < cnt; k++) {
          const y = F.yc - 0.3 - 3.8 * Math.pow(wrng(), 1.5), th = th0 + (wrng() + wrng() - 1) * half, R = hero.trunkRadius(th, y) + (cast === 'yeti' ? 0.05 : 0.03);
          const sdw = wrng(); if (k & 1) continue;      // (every other one: the tour now passes 14 m and more off the wall, where half the crowd reads the same)
          pos.push(Math.cos(th) * R, y, Math.sin(th) * R, sdw); nrm.push(Math.cos(th), 0.12, Math.sin(th));
        }
      });
      const geo = cast === 'yeti' ? yetiGeo() : cast === 'snails' ? snailGeo() : shrimpGeo();
      const u = cast === 'yeti' ? crawlU(0.17, 0.10, 0.5, 1) : cast === 'snails' ? crawlU(0.07, 0.03, 0.25, 0) : crawlU(0.085, 0.16, 1.7, 3);
      instanced(geo, [['aPos', pos, 4], ['aNrm', nrm, 3]], pos.length / 4, critMat(CRAWL_V, u), 'wall-cast');
    }
    await ctx.yield();
    {
      // pale crabs sidling on the mat near the line, and on the lander
      const pos = [], nrm = [], n = Math.round(110 * detail * density);
      for (let k = 0, tries = 0; k < n && tries < n * 6; tries++) {
        const i = Math.floor(wrng.range(0.04, 0.82) * NS), a = wrng.range(0, TAU), rr = wrng.range(1, 12), x = samp[i * 3] + Math.cos(a) * rr, z = samp[i * 3 + 2] + Math.sin(a) * rr;
        if (Math.hypot(x, z) < 10.5) continue;
        pos.push(x, groundY(x, z) + 0.02, z, wrng()); nrm.push(0, 1, 0); k++;
      }
      for (const [x, y, z] of [[0, 4.44, 0.14], [0, 4.44, -0.22], [0.46, 2.37, 0.19], [-0.2, 2.37, 0.46], [0.05, 1.3, 0.3], [-0.1, 0.59, -0.25], [1.36, 0.08, 0.74], [-0.45, 1.3, 0.3]]) {
        pos.push(landerPos.x + x, landerPos.y + y, landerPos.z + z, wrng()); nrm.push(0, 0.1, 0);
      }
      instanced(crabGeo(), [['aPos', pos, 4], ['aNrm', nrm, 3]], pos.length / 4, critMat(CRAWL_V, crawlU(0.14, 0.3, 0.22, 2.2)), 'crabs');
    }
    await ctx.yield();
    {
      // clam (or mussel) beds in the pillow seams
      const pos = [], nrm = [], n = Math.round(1200 * detail * lerp(1, density, 0.6)), o = {};
      for (let tries = 0; pos.length / 4 < n && tries < 14000; tries++) {
        const i = Math.floor(wrng.range(0.2, 0.84) * NS), a = wrng.range(0, TAU), rr = 14 * Math.sqrt(wrng()), x = samp[i * 3] + Math.cos(a) * rr, z = samp[i * 3 + 2] + Math.sin(a) * rr;
        const r = Math.hypot(x, z);
        if (r > 8.8 && x > -36) { const h = groundY(x, z, o); if (o.s1 < 0.13 && h < 5) { pos.push(x, h + 0.03, z, wrng()); nrm.push(wrng.range(-0.3, 0.3), 1, wrng.range(-0.3, 0.3)); } }
        if (tries % 700 === 699) await ctx.yield();
      }
      const mussel = look.cast === 'snails';
      instanced(clamGeo(mussel), [['aPos', pos, 4], ['aNrm', nrm, 3]], pos.length / 4, critMat(CRAWL_V, crawlU(mussel ? 0.24 : 0.21, 0, 0.3, 0.45)), 'clams');
    }
    await ctx.yield();
    {
      // THE APRONS AND THE SEATS (see THE FEET, 3e). An apron is wider than the foot it falls from, and nothing that has a
      // seat may lie under one: no vent's mouth, no thicket, not the lander, no crab and no clam. The seats are read where
      // they were laid (nothing is moved, nothing is drawn): each with the margin its own body needs (a vent its mouth's
      // radius and 0.3 m; a thicket its radius, and each worm of the hero's own thickets its lean from base to tip; the
      // lander the circle of its footpads, 1.55 + 0.34 m, and 0.3 m; a crab or a
      // clam the furthest its body gets from its seat: the corner of its wander, 1.5 * sqrt(2) * uRange, and its largest
      // size, 1.3 * uSize: 0.82 m for a crab, 0.27 to 0.31 m for a clam). Wherever a triangle of an apron lies over a seat
      // or within that margin of it on the map, with the sheet above the seat, every ray that holds a corner of that
      // triangle ends that margin short of the seat (and thins to nothing there, as at any reach). A seat under the foot
      // itself, inside the ring, is not under the apron: it stays as it was (but for the crabs and clams walled in there).
      const lg = scene.getObjectByName('lesser-chimneys').geometry, cp = lg.attributes.position.array, seats = [], cut = [];
      // a crab or a clam whose seat lies under a foot (inside its ring on the map, lower than the ring) that stone closes all
      // round (its [9] in acc.fans: every edge of its ring sheds an apron or stands in the bed) is not there:
      // the stone fell on its place. It is not drawn and is no seat; the others keep their order and every value
      for (const nm of ['crabs', 'clams']) {
        const ig = scene.getObjectByName(nm).geometry, a = ig.attributes.aPos.array, b = ig.attributes.aNrm.array; let w = 0;
        for (let i = 0; i < ig.instanceCount; i++) {
          const x = a[i * 4], y = a[i * 4 + 1], z = a[i * 4 + 2]; let shut = false;
          for (let fi = 0; fi < acc.feet.length && !shut; fi++) {
            const f = acc.feet[fi], fan = acc.fans[fi], b0 = f[0], cols = f[1];
            if (!fan[9] || y >= f[3] || (x - fan[2]) * (x - fan[2]) + (z - fan[3]) * (z - fan[3]) > fan[4] * fan[4]) continue;
            for (let q = 0, p = cols - 1; q < cols; p = q++) { const qx = cp[(b0 + q) * 3], qz = cp[(b0 + q) * 3 + 2], px = cp[(b0 + p) * 3], pz = cp[(b0 + p) * 3 + 2]; if ((qz > z) !== (pz > z) && x < (px - qx) * (z - qz) / (pz - qz) + qx) shut = !shut; }
          }
          if (i % 200 === 199) await ctx.yield();
          if (shut) continue;
          if (w < i) { a.copyWithin(w * 4, i * 4, i * 4 + 4); b.copyWithin(w * 3, i * 3, i * 3 + 3); }
          w++;
        }
        if (w < ig.instanceCount) { ig.setAttribute('aPos', new THREE.InstancedBufferAttribute(a.slice(0, w * 4), 4)); ig.setAttribute('aNrm', new THREE.InstancedBufferAttribute(b.slice(0, w * 3), 3)); ig.instanceCount = w; }
        await ctx.yield();
      }
      for (const v of vents) seats.push([v.x, v.y, v.z, v.r + 0.3]); for (const v of vents2) seats.push([v.x, v.y, v.z, v.r + 0.3]);
      hero.passThickets.forEach((t, i) => seats.push([t.x, t.y, t.z, passThickets[i].r]));
      for (const T of hero.wormThickets) if (!T.pass) seats.push([T.center.x, T.center.y, T.center.z, T.radius]);      // (the hero's own thickets, the four round its foot among them: the part's record of each, its middle and its radius)
      // and each worm of those thickets by its own reach, from its base to its tip on the map (the part's 'tubeworms' mesh:
      // aBase, aAxis; the second value of aInfo is its thicket): a circle cannot clear the worm that stands against a ring,
      // where a ray with no reach is still a lumpy wall (the rule straightens it only over a seat itself)
      const wm = hero.object.getObjectByName('tubeworms');
      if (wm) { const wb = wm.geometry.attributes.aBase.array, wa = wm.geometry.attributes.aAxis.array, wi = wm.geometry.attributes.aInfo.array; for (let i = 0; i < wm.geometry.instanceCount; i++) if (!hero.wormThickets[wi[i * 3 + 1]].pass) seats.push([wb[i * 3], wb[i * 3 + 1], wb[i * 3 + 2], Math.hypot(wa[i * 3], wa[i * 3 + 2])]); }
      seats.push([landerPos.x, landerPos.y, landerPos.z, 1.55 + 0.34 + 0.3]);
      for (const nm of ['crabs', 'clams']) {
        const m = scene.getObjectByName(nm), a = m.geometry.attributes.aPos.array, mg = 1.5 * Math.SQRT2 * m.material.uniforms.uRange.value + 1.3 * m.material.uniforms.uSize.value;
        for (let i = 0; i < a.length; i += 4) seats.push([a[i], a[i + 1], a[i + 2], mg]);
      }
      const segD = (x, z, ax, az, bx, bz) => { const ux = bx - ax, uz = bz - az, t = clamp(((x - ax) * ux + (z - az) * uz) / (ux * ux + uz * uz || 1), 0, 1); return Math.hypot(x - ax - ux * t, z - az - uz * t); };
      // (the seats that stand within a foot's reach, found once: a reach only ever shrinks)
      let pairs = [], n = 0;
      for (const st of seats) { for (const fan of acc.fans) if (fan[1] > fan[0] && (st[0] - fan[2]) * (st[0] - fan[2]) + (st[2] - fan[3]) * (st[2] - fan[3]) <= (fan[4] + st[3]) * (fan[4] + st[3])) pairs.push([st, fan]); if (++n % 100 === 0) await ctx.yield(); }
      while (pairs.length) {      // (again after every re-laying, for the feet that moved, until no ray moves: a shortened ray changes the triangles beside it)
        const now = [], touched = new Set(); n = 0;
        for (const [[x, y, z, mg], fan] of pairs) {
          const [t0, t1, , , , r0, NR] = fan, v0 = acc.rays[r0][0];
          for (let t = t0; t < t1; t += 3) {
            // one triangle of the sheet as it lies on the map: is the seat under it, or within its margin of it, and the sheet above the seat?
            const a = acc.idx[t] * 3, b = acc.idx[t + 1] * 3, c = acc.idx[t + 2] * 3;
            if (Math.max(cp[a + 1], cp[b + 1], cp[c + 1]) <= y) continue;
            const d1 = (x - cp[b]) * (cp[a + 2] - cp[b + 2]) - (cp[a] - cp[b]) * (z - cp[b + 2]), d2 = (x - cp[c]) * (cp[b + 2] - cp[c + 2]) - (cp[b] - cp[c]) * (z - cp[c + 2]), d3 = (x - cp[a]) * (cp[c + 2] - cp[a + 2]) - (cp[c] - cp[a]) * (z - cp[a + 2]);
            const over = !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
            if (!over && Math.min(segD(x, z, cp[a], cp[a + 2], cp[b], cp[b + 2]), segD(x, z, cp[b], cp[b + 2], cp[c], cp[c + 2]), segD(x, z, cp[c], cp[c + 2], cp[a], cp[a + 2])) >= mg) continue;
            for (const k of [a, b, c]) {      // every ray that holds a corner of it ends its margin short of the seat
              if (k / 3 < v0) continue;
              const ray = acc.rays[r0 + Math.floor((k / 3 - v0) / NR)], al = (x - ray[2]) * ray[4] + (z - ray[3]) * ray[5];
              if (Math.max(al - mg, 0) < ray[6]) ray[6] = Math.max(al - mg, 0); else if (over && !ray[9]) ray[9] = 1; else if (over && ray[6] > 0) ray[6] = 0; else continue;      // (already as short as this seat asks and it still lies over the seat: that ray is laid without lumps, and if that is not enough, with no reach)
              now.push(ray); touched.add(fan);
            }
          }
          if (++n % 12 === 0) await ctx.yield();
        }
        for (const [, , bx, bz, , r0, , M, r1] of touched) { const rs = []; for (let i = r0; i < r1; i++) rs[acc.rays[i][10]] = acc.rays[i]; now.push(...acc.ease(rs, M, bx, bz)); }      // (and its neighbours come in with it)
        for (const ray of now) { acc.lay(ray, cp, lg.attributes.aMat.array, acc.hem); if (!ray[8]) { ray[8] = 1; cut.push(ray); } }
        pairs = pairs.filter((p) => touched.has(p[1]));
        await ctx.yield();
      }
      if (cut.length) lg.attributes.normal.array.set(await smoothNormals(cp, acc.idx, ctx.yield));
    }
    await ctx.yield();
    // eelpout: a shoal hanging in the line that bolts as we come, and loners hanging in the shimmer by the shelves
    const up = V3(0, 1, 0);
    const fishU = { uBurst: { value: 0 }, uSize: { value: 0.42 }, uSoft: { value: 0.6 }, uFish: { value: 1 } };      // (uSoft 0.6: shaded by the turn of the surface to the eye, as CRIT_F's soft bodies are. The swimmer no longer is: SWIM_F lights its skin from the lamps where they stand)
    {
      const home = [], out = [], T = V3(), e1 = V3(), e2 = V3(), c = V3(), d = V3();
      // the shoal hangs where the gaze (and so the lamps) will be just after U_SHOAL: ahead and a little under the centre of the gaze
      const uG = U_SHOAL + 0.015, cam = path.posAtDist(uG * L, V3());
      { const b = tourGaze(0, uG); T.set(b.x, b.y - 2.0, b.z).sub(cam).normalize(); }      // a little under the centre of the gaze
      c.copy(cam).addScaledVector(T, 4.3); e1.crossVectors(T, up).normalize(); e2.crossVectors(e1, T);
      for (let k = 0; k < 18; k++) {
        const a = k / 18 * TAU + wrng.range(-0.15, 0.15), rho = wrng.range(0.25, 1.4), al = wrng.range(-1.0, 1.0);
        d.copy(e1).multiplyScalar(Math.cos(a)).addScaledVector(e2, Math.sin(a));
        home.push(c.x + d.x * rho + T.x * al, c.y + d.y * rho + T.y * al, c.z + d.z * rho + T.z * al, wrng());
        const inw = -(d.x * c.x + d.z * c.z) / Math.hypot(c.x, c.z);          // > 0: this one would bolt toward the tower
        if (inw > 0) { d.x += c.x / Math.hypot(c.x, c.z) * inw * 0.8; d.z += c.z / Math.hypot(c.x, c.z) * inw * 0.8; }
        if (d.y > 0) d.y *= 0.25;                                          // the mirror is overhead
        d.addScaledVector(T, 0.45).normalize(); out.push(d.x, d.y, d.z, rho * 0.22 + wrng.range(0, 0.15));
      }
      for (let k = 0; k < 12; k++) {
        const dd = k < 6 ? lerp(dF2 + 4, dF3 - 3, k / 5) : lerp(dKnee - 8, dKnee + 12, (k - 6) / 5); path.posAtDist(dd, c); path.tangentAtDist(dd, T); e1.crossVectors(T, up).normalize();
        const side = k < 6 ? -1 : 1, lat = k < 6 ? wrng.range(3.8, 4.6) : wrng.range(3.6, 5.2), dy = wrng.range(-0.5, 2.2), sdv = wrng();
        if (k >= 3 && k < 6) {      // three hang off the bow under F3, low on the right of the hero frame (the lamps look up and in there, and that corner was empty water)
          path.posAtDist(dF3 + 4.9, c); path.tangentAtDist(dF3 + 4.9, T); e1.crossVectors(T, up).normalize();
          home.push(c.x + T.x * (4.6 + (k - 3) * 1.3) + e1.x * (1.9 - (k - 3) * 0.55), c.y + 0.4 - (k - 3) * 0.4, c.z + T.z * (4.6 + (k - 3) * 1.3) + e1.z * (1.9 - (k - 3) * 0.55), sdv); out.push(0, 1, 0, 99); continue;
        }
        home.push(c.x + e1.x * side * lat, c.y + dy, c.z + e1.z * side * lat, sdv); out.push(0, 1, 0, 99);
      }
      // THE CLEARANCE LAW (no body across the flown route), for all 30 eelpouts. A shoal fish that bolts comes to rest D metres
      // out along its out direction and hangs there for the rest of the flight, and the route goes on to the right of that
      // gaze: on each of seeds 1 to 40 four to six of the fish that bolted that way came to rest where the lens then passed
      // (fish 2 0.04 m from the lens at u 0.315 on seed 7), and the last of the three loners off the bow under F3 hung 1 m
      // from the lens at u 0.53: both inside the dome's glass. So, after every draw, each fish is flown against the whole
      // route by FISH_V's own law (its home, its out direction, its delay; uBurst from u and U_SHOAL as update() sets it;
      // hanging, then darting, then at rest; its body from nose to tail along its axis), and where its axis comes nearer
      // the lens than CLEAR:
      //  - a shoal fish's out direction is turned by the least turn that clears: rings of directions 2, 4, 6 ... degrees from
      //    its own, twelve round each ring, the first ring that holds a direction that clears, and of that ring the direction
      //    that clears by most. A turn never points a fish higher than it pointed (nor above level: the mirror is overhead)
      //    nor more toward the tower's axis than it pointed (the two rules of the draw above). Its home stays; only if no
      //    turn at all clears it does its home move as a loner's does, with the turns tried again after each step;
      //  - a loner never bolts, so its home moves, level, straight away from the route's nearest place (so on its own side
      //    of the route), 0.05 m at a time, by the least distance that clears.
      // No random draw is made here: the law reads the route, the dome and the fish, and nothing else.
      // CLEAR, to the body's axis: 1.1 (the dome's glass: R in src/rides/glass-dome.js) + 0.514 (the longest eelpout: fishGeo is
      // 1.02 long, nose z 0.5 to tail z -0.52, times uSize 0.42, times FISH_V's largest size 1.2) + 0.173 (FISH_V drifts a fish
      // 0.10 m on each axis by the clock, whatever the clock at entry) + 0.15 (the body's largest reach from its axis as
      // drawn at that size: the tail's tip in a dart, 0.143 m, with breast fins or without; at rest 0.055 m without them,
      // 0.104 m with them) + 0.05 (the route is tried every 0.025 m; a darting fish moves 0.065 m in that) = 1.99 m
      {
        const SZ = fishU.uSize.value * 1.2, CLEAR = 1.1 + 1.02 * SZ + 0.10 * Math.sqrt(3) + 0.15 + 0.05;
        const NR = Math.ceil(L / 0.025), RP = new Float32Array((NR + 1) * 3), q = V3(), o = V3(), f1 = V3(), f2 = V3(), cd = V3(), bd = V3();
        for (let i = 0; i <= NR; i++) { path.posAtDist(i / NR * L, q); RP[i * 3] = q.x; RP[i * 3 + 1] = q.y; RP[i * 3 + 2] = q.z; if (i % 2000 === 1999) await ctx.yield(); }
        // how near fish k's axis comes to the lens anywhere on the route if its out direction is v (away: from the lens to the fish there)
        const nearest = (k, v, away) => {
          const hx = home[k * 4], hy = home[k * 4 + 1], hz = home[k * 4 + 2], sd = Math.fround(home[k * 4 + 3]), dl = out[k * 4 + 3];
          const s5 = Math.fround(sd * 5), D = 1.9 + 1.6 * (s5 - Math.floor(s5)), reach = CLEAR + D + 0.52 * SZ;
          let ox = v.x, oy = v.y + 1e-3, oz = v.z, n = Math.hypot(ox, oy, oz); ox /= n; oy /= n; oz /= n;
          let gx = Math.sin(sd * 40) * 0.25 + 0.2, gy = 1, gz = Math.cos(sd * 31) * 0.25; n = Math.hypot(gx, gy, gz); gx /= n; gy /= n; gz /= n;
          let best = 1e9;
          for (let i = 0; i <= NR; i++) {
            const dx = hx - RP[i * 3], dy = hy - RP[i * 3 + 1], dz = hz - RP[i * 3 + 2]; if (dx * dx + dy * dy + dz * dz > reach * reach) continue;
            const kk = clamp(clamp((i / NR - U_SHOAL) / 0.012, 0, 3) - dl, 0, 3), go = (1 - Math.exp(-kk * 2.6)) * D, m = smoothstep(0, 0.25, kk);
            let ax = gx + (ox - gx) * m + 1e-4, ay = gy + (oy - gy) * m, az = gz + (oz - gz) * m; n = Math.hypot(ax, ay, az); ax /= n; ay /= n; az /= n;
            const rx = dx + ox * go, ry = dy + oy * go, rz = dz + oz * go, s = clamp(-(rx * ax + ry * ay + rz * az), -0.52 * SZ, 0.5 * SZ);
            const px = rx + ax * s, py = ry + ay * s, pz = rz + az * s, dd = Math.hypot(px, py, pz);
            if (dd < best) { best = dd; if (away) away.set(px, py, pz); }
          }
          return best;
        };
        for (let k = 0; k < 30; k++) {
          o.set(out[k * 4], out[k * 4 + 1], out[k * 4 + 2]);
          if (nearest(k, o) >= CLEAR) continue;
          const shoal = k < 18, tx = home[k * 4] / Math.hypot(home[k * 4], home[k * 4 + 2]), tz = home[k * 4 + 2] / Math.hypot(home[k * 4], home[k * 4 + 2]);
          const y0 = Math.max(o.y, 0), in0 = Math.max(-(o.x * tx + o.z * tz), 0);
          if (f1.crossVectors(o, up).lengthSq() < 1e-6) f1.set(1, 0, 0);
          f1.normalize(); f2.crossVectors(o, f1);
          for (let mv = 0, ok = false; !ok && mv < 200; mv++) {
            if (mv || !shoal) { nearest(k, o, q); if (q.setY(0).lengthSq() < 1e-8) q.set(tx, 0, tz); q.normalize(); home[k * 4] += q.x * 0.05; home[k * 4 + 2] += q.z * 0.05; }
            for (let th = shoal && !mv ? 2 : 0; th <= (shoal ? 180 : 0) && !ok; th += 2) {
              let far = 0;
              for (let j = 0; j < (th ? 12 : 1); j++) {
                cd.copy(o).multiplyScalar(Math.cos(th * RAD)).addScaledVector(f1, Math.sin(th * RAD) * Math.cos(j * TAU / 12)).addScaledVector(f2, Math.sin(th * RAD) * Math.sin(j * TAU / 12));
                if (cd.y > y0 + 1e-9 || -(cd.x * tx + cd.z * tz) > in0 + 1e-9) continue;
                const dd = nearest(k, cd); if (dd > far) { far = dd; bd.copy(cd); }
              }
              if (far >= CLEAR) { if (th) { out[k * 4] = bd.x; out[k * 4 + 1] = bd.y; out[k * 4 + 2] = bd.z; } ok = true; }
              if (th % 8 === 0) await ctx.yield();
            }
          }
        }
      }
      instanced(fishGeo(), [['aHome', home, 4], ['aOut', out, 4]], 30, mkMat(FISH_V, FISH_F, { uFoul: { value: 0 }, uSoft: { value: 0 }, uFish: { value: 0 }, ...fishU }, { side: THREE.DoubleSide }), 'eelpout');
    }
    // THE SWIMMER: one dumbo octopus, wine red and half transparent. It comes up out of the dark on the right as we come
    // abeam of F3 and hangs in OPEN WATER to the right of the trunk while we pass the shelf (U_SW[2..4], 5 m off, a tenth of
    // the frame wide, against the dark ridge; never in front of the lit trunk, where it read as a lump stuck on the tower),
    // keeps station as the dome turns back to the tower and then rows across the lander's up-beam at the north vantage,
    // sliding down the beam toward the star before it sinks away over the field. Its track is one smooth curve through eight
    // points, each set by its angle to the right of the tower's axis as the dome sees it (off) or on the sight line to a
    // point of the beam (onBeam: how far along the beam, metres from the eye), so neither the default nor the steady camera
    // cuts it with the frame's edge or lays it over the tower.
    const octoU = { uRow: { value: 1 }, uEyeL: { value: V3(0, 0, 5) } };
    const U_SW = [uF3 - 0.065, uF3 - 0.03, uF3 + 0.005, uF3 + 0.045, uF3 + 0.095, uF3 + 0.15, uF3 + 0.205, uF3 + 0.265], octoPts = [];
    {
      const gz = (uu) => (uu < uF3 + 0.03 ? tourGaze(0, uu) : fallGaze(0, uu));
      const seen = (uu, fwd, right, lift) => { const p = path.pointAt(uu, V3()), g = gz(uu).clone().sub(p).normalize(), r = V3().crossVectors(g, up).normalize(); return p.addScaledVector(g, fwd).addScaledVector(r, right).add(V3(0, lift, 0)); };
      const onBeam = (uu, s, dist, lift = 0) => { const p = path.pointAt(uu, V3()), b = lamps.uLandPos.value[1].clone().addScaledVector(dirB, s * 62); return p.addScaledVector(b.sub(p).normalize(), dist).add(V3(0, lift, 0)); };
      // off(u, a, d, lift): d metres from the dome, a degrees to the right of the tower's axis as the dome sees it. The trunk and its
      // foot end 18 to 24 degrees right of the axis from here, so at 51 the swimmer has open water all round it, whichever
      // camera is flying (the sweeping one looks 36 degrees right of the axis here, the steady one about 40)
      const off = (uu, a, d, lift) => { const p = path.pointAt(uu, V3()), ax = V3(-p.x, 0, -p.z).normalize(), r = V3().crossVectors(ax, up); return p.addScaledVector(ax, Math.cos(a * RAD) * d).addScaledVector(r, Math.sin(a * RAD) * d).add(V3(0, lift, 0)); };
      void seen;
      octoPts.push(off(U_SW[0], 60, 11.5, -4.0), off(U_SW[1], 54, 7.4, -1.7), off(U_SW[2], 51, 5.4, -0.3), off(U_SW[3], 51, 5.0, 0.45),
        off(U_SW[4], 41, 5.2, 1.0),      // (lifting as it goes: the lander's star comes round behind it at uF3 + 0.08, and it passes above the star)
        onBeam(U_SW[5], 0.44, 5.0), onBeam(U_SW[6], 0.37, 5.2), off(U_SW[7], 60, 16, -5));
    }
    const octoCurve = new THREE.CatmullRomCurve3(octoPts), _o2 = V3(), _o3 = V3();
    const octoPos = (u, out) => {
      const n = U_SW.length - 1;
      if (u <= U_SW[0]) out.copy(octoPts[0]).addScaledVector(_o2.copy(octoPts[0]).sub(octoPts[1]), (U_SW[0] - u) / (U_SW[1] - U_SW[0]));
      else if (u >= U_SW[n]) out.copy(octoPts[n]).addScaledVector(_o2.copy(octoPts[n]).sub(octoPts[n - 1]), (u - U_SW[n]) / (U_SW[n] - U_SW[n - 1]));
      else { let i = 0; while (i < n - 1 && u > U_SW[i + 1]) i++; octoCurve.getPoint((i + (u - U_SW[i]) / (U_SW[i + 1] - U_SW[i])) / n, out); }
      return out;
    };
    let octo; const OCTO_S = 1.5;      // 1.5 m across the web: a tenth of the frame wide at 5 m
    {
      octo = new THREE.Mesh(octoGeo(wrng), mkMat(SOFT_V, SWIM_F, octoU, { side: THREE.DoubleSide })); octo.name = 'swimmer';
      octo.scale.setScalar(OCTO_S);
      octoPos(U_SW[2], octo.position); octo.frustumCulled = false; scene.add(octo);
    }
    await ctx.yield();
    {
      // bubbles: the seep beside the right pane on the way in, columns up the rise (growing by merging), and under the shelves
      const b1 = [], b2 = [], rr = V3().crossVectors(riseDir, up).normalize();
      const lineZ = (x) => { let bz = 4, bd = 1e9; for (let i = 0; i <= 80; i++) { const d = Math.abs(samp[i * 3] - x); if (d < bd) { bd = d; bz = samp[i * 3 + 2]; } } return bz; };
      for (let k = 0; k < 60; k++) { const x = lerp(-86, -50, wrng()), z = lineZ(x) + wrng.range(1.5, 3.2); b1.push(x, 3 + wrng.range(0, 2), z, wrng()); b2.push(wrng.range(0.45, 0.8), 20, 0.04, wrng.range(0.14, 0.24)); }      // a chain of seep bubbles climbing past the right pane: 8 to 14 cm across at the eye's height
      for (let k = 0; k < 150; k++) {      // (they go on up beside the ring, clear of it, to the underside of the great flange)
        // (two in three are fat columns close by on the right, 2 to 3.2 m off the line, already domes at the foot of the rise: the right half of the frame all the way up;
        // they open out past the ring like the rest, so nothing crosses it)
        const s = lerp(3, 38, Math.pow(wrng(), 0.9)), f = Math.min(s / 36, 1.05), sd0 = wrng(), near = k % 3 !== 0, side = near ? 1 : sd0 < 0.72 ? 1 : -1.25;
        const lat = near ? wrng.range(2.0, 3.2) + 4.5 * smoothstep(22, 38, s) : (wrng.range(2.6, 4.2) + 2.2 * smoothstep(30, 40, s)) * side * (1 + 0.5 * f);
        b1.push(knee.x + riseDir.x * s + rr.x * lat, knee.y + riseDir.y * s - (near ? 8 : 6.5), knee.z + riseDir.z * s + rr.z * lat, wrng());
        b2.push(wrng.range(0.4, 0.7), near ? 12.5 : 12.5, near ? 0.10 + 0.08 * f : 0.04 + 0.11 * f, (near ? 0.36 + 0.30 * f : 0.12 + 0.60 * f * f) * wrng.range(0.55, 1));
      }
      for (const fi of [0, 2, 1]) { const F = hero.flanges[fi], th0 = Math.atan2(F.o[1], F.o[0]);
        for (let k = 0; k < 10; k++) { const th = th0 + wrng.range(-0.45, 0.45), R = hero.trunkRadius(th, F.yc - 3) + wrng.range(0.9, 2.6); b1.push(Math.cos(th) * R, F.yc - 7.2, Math.sin(th) * R, wrng()); b2.push(wrng.range(0.25, 0.4), 6.7, 0.02, wrng.range(0.05, 0.09)); } }
      const gi = new THREE.BufferGeometry(); gi.setAttribute('position', f32([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); gi.setIndex([0, 1, 2, 0, 2, 3]);      // one quad each (BUB_F draws the sphere)
      instanced(gi, [['aB', b1, 4], ['aB2', b2, 4]], b1.length / 4, mkMat(BUB_V, BUB_F, { uBubWarm: { value: warm ? 0.36 : 0.44 } }, { transparent: true, depthWrite: false }), 'bubbles', 2);
    }
    // floc: the snow that never stops. One box wraps round the camera; one stands over the fissure.
    const bufSize = new THREE.Vector2(), flocBlend = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor };
    const uBufH = { value: 450 }, flocCen = V3();
    const quad = new THREE.BufferGeometry(); quad.setAttribute('position', f32([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); quad.setIndex([0, 1, 2, 0, 2, 3]);
    {
      // a dull ember halo at the mouth of every lesser smoker: the field is dimly lit by its own glow, near and far
      const ae = []; for (const v of vents) if (v.smoker) ae.push(v.x, v.y + 0.25, v.z, wrng()); for (const v of vents2) if (v.smoker) ae.push(v.x, v.y + 0.25, v.z, xrng());
      const em = instanced(quad, [['aE', ae, 4]], ae.length / 4, new THREE.ShaderMaterial({ vertexShader: EMBER_V, fragmentShader: EMBER_F, uniforms: { uTime, uEmberC }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), 'embers', 5);
      em.visible = ae.length > 0;
    }
    const flocField = (count, u, name) => { const a = new Float32Array(count * 4); for (let i = 0; i < a.length; i++) a[i] = wrng();
      return instanced(quad, [['aF', a, 4]], count, mkMat(FLOC_V, FLOC_F, { uBufH, uFlocCol: { value: new THREE.Color(0.85, 0.86, 0.82) }, ...u }, flocBlend), name, 6); };
    const flocVel = current ? V3(2.6, -0.05, 0.25) : snow ? V3(0.55, -0.14, 0.06) : V3(0.5, -0.08, 0.06);
    const uCamV = { value: V3() };
    // (less than half the snow of the first cut, and less than half as bright: lit only in the headlamp cones within about
    // ten metres, so it shows the light and never sits on the picture like static)
    flocField(Math.min(3600, Math.round(2400 * detail * density * (snow ? 1.4 : 1))), { uBox: { value: V3(20, 13, 20) }, uCen: { value: flocCen }, uVel: { value: flocVel }, uCamV,
      uStreak: { value: current ? 0.03 : 0.014 }, uSizeK: { value: snow ? 1.3 : 1 }, uFlocI: { value: snow ? 0.66 : 0.56 }, uReach: { value: snow ? 11.5 : 9.5 } }, 'floc');
    await ctx.yield();
    // a plume of soft snow that lifts off the fissure and streams toward the notch: a box 8 m deep lying along the gash, its
    // top 1.5 m under the line of flight, so it is something we look down on and never specks over the whole frame. The
    // flakes are soft clumps 3 to 9 cm across (they have to read from 10 to 25 m), brightest where the lander's raking beam
    // crosses them.
    flocField(Math.round((snow ? 1300 : 900) * detail), { uBox: { value: V3(58, 8, 7) }, uCen: { value: V3(-74, 6.4, 3.2) }, uVel: { value: V3(current ? 1.6 : 0.6, snow ? 0.7 : 0.34, 0) }, uCamV,
      uStreak: { value: current ? 0.02 : 0.012 }, uSizeK: { value: 3.2 }, uFlocI: { value: snow ? 0.95 : 0.9 }, uReach: { value: 40 } }, 'fissure-floc');
    // the rare event: a bite of the hero flange's rim lets go and a mercury bell of the pool escapes upward
    const F3 = hero.flanges[2], bellU = { uRise: { value: 0 } }, BELL_PHI = 0.1, bellStart = V3().fromArray(F3.at(F3.E(BELL_PHI) * 1.04, BELL_PHI, F3.yc - 2.3, [0, 0, 0])),      // the bite: the middle of the outer rim, ahead and to the right as we come round under F2
      bellOut = [F3.o[0] * Math.cos(BELL_PHI) + F3.t[0] * Math.sin(BELL_PHI), F3.o[1] * Math.cos(BELL_PHI) + F3.t[1] * Math.sin(BELL_PHI)];
    const bell = new THREE.Mesh(new THREE.SphereGeometry(1, 30, 22), mkMat(BELL_V, BELL_F, bellU, { side: THREE.DoubleSide }));
    bell.name = 'mercury-bell'; bell.frustumCulled = false; bell.visible = rare; bell.position.copy(bellStart); bell.scale.setScalar(0.001); scene.add(bell);
    await ctx.yield();

    // ---------------------------------------------------------------- 3h. pois, post, update
    const octoAt = V3(), _om = new THREE.Matrix4();
    const _q = V3();
    const U_BELL = uF3 - 26 / L, BELL_SPAN = 19.5 / L;      // the rare bell lets go 26 m short of F3 (we are past the mound, turning to the hero pool), hangs off the rim while we come round and has gone up behind F3's rim 6.5 m short of it; no poi
    const pois = [
      { at: inGaze, from: 0.0, to: uNotch + 0.02, weight: 1, fade: 0.02 },                                    // the way in: the star in the V, the entry chimney, the lander (see GAZE_IN)
      { at: tourGaze, from: uNotch - 0.012, to: uF3 + 0.065, weight: 1, fade: 0.075 },                           // the tour: across the field, past the mound, the hero pool whole, down on to the trunk (see GAZE)
      { at: fallGaze, from: uF3 + 0.005, to: 0.95, weight: 1, fade: 0.05 },                                     // the fall away and the first of the rise (see fallGaze; until uF3 + 0.03 it is the helix gaze)
      { at: fallGaze, from: uF3 + 0.005, to: 0.95, weight: 1, fade: 0.05 },                                     // (again, for the steady camera)
    ];

    octoPos(0, octoAt);
    const parkCam = new THREE.PerspectiveCamera();
    path.pointAt(0, _p); path.tangentAt(0, _t); parkCam.position.copy(_p); parkCam.lookAt(_p.clone().add(_t)); parkCam.updateMatrixWorld(true);
    const _cp = V3(), _cd = V3();
    const bellU3 = (u) => smoothstep(uF3 - 0.07, uF3 - 0.03, u) * (1 - smoothstep(uF3 + 0.06, uF3 + 0.10, u));
    const update = (dt, time, camera, u) => {
      uTime.value = time;
      // seen through the previous world's portal (u is exactly 0) the lamps and the snow stay at the entry pose
      const cam = u > 0 ? camera : parkCam;
      hero.update(dt, time, cam);
      cam.getWorldPosition(_cp); cam.getWorldDirection(_cd);
      flocCen.copy(_cp).addScaledVector(_cd, 6);
      if (u > 0) path.tangentAt(u, uCamV.value).multiplyScalar(speedAt(u * L)); else uCamV.value.set(0, 0, 0);   // how the snow streams past the dome
      ctx.renderer.getDrawingBufferSize(bufSize); uBufH.value = bufSize.y;
      // long views (the way in, the field, the fall away) get clearer water and a longer reach; up the helix a little less,
      // with enough reach left that the tall chimneys of the east ring and their smoke stand dimly lit behind the shelves
      const far = Math.max(1 - smoothstep(uF1 - 0.04, uF1, u), smoothstep(uF3 + 0.01, uF3 + 0.08, u) * (1 - 0.45 * smoothstep(uKnee, uKnee + 0.1, u)));
      // (a little more under F3, where the tall north-east chimneys are the backdrop, and out at the north vantage, 40 m off)
      // (the helix now runs 18-20 m out, so the lamps must reach the trunk, its thickets and the chimneys of the field beyond)
      lamps.uSurvey.value = 0.80 + 0.05 * far + 0.22 * bellU3(u) + 0.15 * smoothstep(uF3 + 0.08, uF3 + 0.14, u) * (1 - smoothstep(uKnee, uKnee + 0.08, u));
      const fieldW = smoothstep(uNotch - 0.02, uNotch + 0.03, u) * (1 - smoothstep(uMound + 0.03, uView - 0.01, u));      // the level look across the field, from the reveal until the dome turns to the hero pool
      lamps.uSurvey.value += 0.22 * fieldW;
      const tourW = smoothstep(uNotch - 0.02, uNotch + 0.03, u);                                                    // from the reveal on, the field is always somewhere in frame
      uPlumeK.value = 1 + 0.5 * (1 - smoothstep(uNotch - 0.03, uNotch + 0.01, u)) + 1.3 * tourW;      // far smoke's cold rims: up for the way in, and held up from the reveal to the ring (no more on the rise: seen from below, filled with cold light, the plumes were striped flags)
      const revealW = smoothstep(uNotch - 0.07, uNotch - 0.01, u) * (1 - smoothstep(uHelix, uHelix + 0.07, u));       // the tower whole, from the notch
      const poolW = smoothstep(uView - 0.07, uView - 0.03, u) * (1 - smoothstep(uF3 - 0.02, uF3 + 0.02, u));          // the hero pool seen whole: the east ring and the bed behind it are the backdrop
      uFill.value = Math.max(revealW, lerp(0.7, 1.6, poolW) * tourW);
      uHaze.value = (snow ? 1.01 : 1) * lerp(0.55, 1, smoothstep(0, 0.004, u));                                       // (less only while we are seen through the last world's portal, under its grade: u is exactly 0 there. Ramped over u 0 to 0.03 it blacked out our own first second and a half)
      // the tower's long-view light (the part's ROCK_F): full at the reveal and from the fall away on, a breath of it between
      hero.setTowerLight(0.4 + 0.6 * Math.max(revealW, smoothstep(uF3 + 0.03, uF3 + 0.10, u)));
      uTaper.value = 1 - smoothstep(uF3 + 0.03, uF3 + 0.11, u) * (1 - smoothstep(uKnee - 0.10, uKnee - 0.045, u));
      uVant.value = smoothstep(uF3 + 0.04, uF3 + 0.12, u) * (1 - smoothstep(uKnee + 0.02, uKnee + 0.12, u));
      hero.setFieldRim(fieldRim0 * (1 + 0.35 * tourW + 0.6 * poolW + 0.95 * smoothstep(uKnee - 0.04, uKnee + 0.04, u)));      // up the rise the lamps look at the ring: the field below is drawn by its rims alone
      uShaft.value = smoothstep(uF3 + 0.03, uF3 + 0.11, u) * (1 - 0.55 * smoothstep(uKnee - 0.03, uKnee + 0.05, u));     // a shaft across the vantage; eased round the knee, where we climb in beside it
      lamps.uAbsorb.value.copy(absorb0).multiplyScalar(lerp(0.78, 0.6, far) - 0.1 * fieldW);
      // the cold light on the column: low in the helix, full for the reveal, more again on the fall away and the rise (we look
      // up its dark underside), easing a little toward the ring
      const farS = Math.max(1 - smoothstep(uF1 - 0.04, uF1, u), smoothstep(uF3 + 0.01, uF3 + 0.08, u));
      // (kept high round the knee and up the rise: the first billows of the column stand behind the ring there)
      hero.setSmokeRim((0.45 + 0.75 * farS) * (1 + 1.25 * smoothstep(uF3 + 0.06, uF3 + 0.14, u)) * lerp(0.94, 1.08, mood));
      hero.setLander(null, null, null, landI0 * (1 - 0.4 * smoothstep(uKnee, uKnee + 0.12, u)));
      for (let i = 0; i < 2; i++) {          // where the eye is against each lander cone
        const lp = lamps.uLandPos.value[i], ld = lamps.uLandDir.value[i], Lb = uLen.value[i]; _q.copy(_cp).sub(lp); const t = _q.dot(ld), rad = 0.12 + Math.max(t, 0) * (i ? 0.30 : 0.20) * 1.012;
        const perp = _q.addScaledVector(ld, -t).length(), ends = smoothstep(-2.0, -0.6, t) * (1 - smoothstep(Lb + 0.6, Lb + 2.0, t));
        // uBeamIn: 0 outside the hull, 1 from 0.6 m outside it inward (the shader then counts the hull's far faces instead of its near ones)
        uBeamIn.value.setComponent(i, (1 - smoothstep(rad + 0.6, rad + 2.0, perp)) * ends);
        // uBeamK: the haze thins as the eye comes into the cone (the lit snow shows the beam there instead)
        uBeamK.value.setComponent(i, lerp(1, 0.30, (1 - smoothstep(1.4, 6.0, perp / rad)) * ends));
      }
      fishU.uBurst.value = clamp((u - U_SHOAL) / 0.012, 0, 3);
      // the swimmer: on its track, bobbing with its fin beat, mantle tipped the way it is going; far from its moment it is a speck
      octoPos(u, octoAt); octoPos(u + 0.006, _o3).sub(octoAt); if (_o3.lengthSq() > 1e-8) _o3.normalize(); else _o3.set(1, 0, 0);
      octoAt.y += 0.10 * Math.sin(time * 2.6 - 1.2); octoAt.x += 0.10 * Math.sin(time * 0.5);
      octo.position.copy(octoAt);
      octo.quaternion.setFromUnitVectors(up, _o3.multiplyScalar(0.55).add(up).normalize());
      octo.scale.setScalar(OCTO_S * Math.max(0.02, smoothstep(U_SW[0] - 0.09, U_SW[0] - 0.03, u) * (1 - smoothstep(U_SW[7] + 0.02, U_SW[7] + 0.07, u))));
      octo.updateMatrixWorld(); octoU.uEyeL.value.copy(_cp).applyMatrix4(_om.copy(octo.matrixWorld).invert());      // the eye in the swimmer's own frame (SWIM_F looks through the skin with it)
      if (rare) {
        // it squeezes out from under the lip, slides clear of the shelf (so the lip never crops it from below) and rises slowly
        // It is seen from the side and from 10-25 m as we come round to the hero pool, so it is 5.6 m across, round
        // underneath, and it hangs level with the rim until the end, when it goes up behind it.
        const k = clamp((u - U_BELL) / BELL_SPAN, 0, 1), grow = smoothstep(0, 0.3, k) * (k < 0.999 ? 1 : 0), off = 4.6 * smoothstep(0, 0.3, k) + 1.2 * k;
        bell.scale.setScalar(Math.max(0.001, 2.8 * grow));
        bell.position.set(bellStart.x + bellOut[0] * off + leanT * 2 * k * k, bellStart.y + 1.6 * k + 14 * smoothstep(0.72, 1, k) * smoothstep(0.72, 1, k), bellStart.z + bellOut[1] * off);
        bellU.uRise.value = k;
      }
    };
    update(0, 0, parkCam, 0);

    return {
      scene, path, duration: DUR, pace: paceFn,
      ride: 'glass-dome',
      camera: { fov: 75, near: 0.2, far: 700, lookAhead: 9, sway: 0.35, bank: 0 },      // never banked: the pools are level ceilings and must read so
      pois,
      portal: { shape: 'circle', radius: 3.75, color: PALETTE[6], glow: 0.5, revealDistance: 90, tilt: true },
      post: { exposure: 1.1, bloom: { strength: 0.5, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.12, contrast: 1.1, tint: warm ? '#fff3e2' : '#f1f6ff', shadowTint: '#040a14', vignette: 0.26, grain: 0.024, aberration: 0 } },
      update,
      dispose() {},
    };
  },
};
