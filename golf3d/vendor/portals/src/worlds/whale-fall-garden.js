// THE BONE GARDEN (whale-fall-garden): two hundred metres down, a blue whale's skeleton has become a garden.
// BUILD SCALE: 4 units = 1 apparent metre. World space == the hero's local space (the hero sits at the origin,
// unrotated): the spine runs along X (tail +56, skull -51, jaw arch -62), west is -X, the cliff is north (-Z: the camera
// enters beside it, flying east) and turns away north-east past x = 94.
//
// MAP OF THIS FILE (in order)
//   1. MOODS            the seeded looks (peacock noon, jade bloom, violet dawn, moon): fog colour and density, the
//                       dome (glow, and up: how pale the water overhead is), the light given to hero.setLight, snow,
//                       exposure, shadow tint, the grade's saturation (sat) and belly (how strongly the bounce lights
//                       the sixgill's underside). pickMood() honours
//                       ctx.vary.hour. The violet water's colours are chosen through the tone map (see the note
//                       there). The age of the fall (crimson / white / reef) is drawn in build() (rng.fork('age'))
//                       and given to the hero; for 'reef' the garden step plants coral and sponge on the ribs and
//                       spine (search "old reef").
//   2. GLSL             shaders for everything that is not the hero. All of them take the hero's shared uniform
//                       objects (light, uTime, uCamL, fog) and the hero's fog chunk, so hero and world shade alike.
//   3. Geo              a small mesh accumulator (tubes, lathes) and the builders: coral trees (with the clearance
//                       rule o.clear), sponges (vase, ruffle, cushion, bun), anemones (stalk, round head, frill),
//                       octopus, crab, sea star, shell (a dome on a dark apron), fish (grenadier / ratfish), the
//                       sixgill's lofted body and its foil fins.
//   4. build(ctx)       hero -> THE PATH (search "THE PATH") -> THE FLIGHT'S SPEEDS (the duration, the seconds flown
//                       at u) -> floor and cliff -> garden (coral, sponge, anemones) -> animals (octopuses, crabs and
//                       squat lobsters, sea stars, brittle stars, shells, hagfish, grenadiers or ratfish) -> the
//                       sixgill and its route (search "SIXGILL ROUTE") -> rare whale -> snow (three depths: far dim
//                       flakes tinted to the water, big soft flocs, soft round near flakes), silt puffs, the portal's
//                       fan of light -> gaze (pois) -> post (search "POST").
//   5. update()         hero.update first (it sets uTime / uCamL / pixel scale for every shader), then the fog by the
//                       eye's height, the sixgill by the flight (u), what is shown by the eye's distance, the rare
//                       whale by the flight (u).
//
// WHERE THINGS ARE SET
//   path:      "THE PATH": a level entry (LEVEL u, 70 u up) due east along the cliff, the wall 22 u or more to port
//              and its overhang above, past the coral tree on its prow ("ENTRY TREE": PX2, PZ2, a bump in cliffZ, the
//              brief's 14 m ahead of the entry and 14 u to port). Abeam of the rib cage (X_FLANK) the line tips into
//              ONE descending right-hand arc at an even 27.3 degrees: on along the wall, then round the tail in the
//              half-turn the geometry gives (radius about 30 u: the circle that touches the entry line and comes out
//              along the keel), easing out low over the bed onto the hero's anchors.flyThrough at its point JOIN
//              (keel, nave, palate, arch, 60 u straight at 35 degrees to anchors.portalSeat). `arc` keeps the
//              line's plan (arc.plan(run), arc.tanAt(run), arc.rEnd: the run at the join) for whatever is sited
//              beside it. The route has the length these points give it, and the duration is what the speeds give.
//              wall0 / zRel / eastOf lay out the terrace's north-east corner (the brink, "CORNER SPUR": SX2, SZ2).
//              Past the ring the wall turns away north-west (in cliffZ).
//   hero:      hero.object at the origin; anchors are used as they are. The bed (opts.bed) is the hero's; this
//              world's floor lies 0.42 u under hero.groundHeight and shows beyond the bed's ragged edge.
//   pace:      "THE FLIGHT'S SPEEDS": vAt(d), speeds in u/s by place (the brief's), anchored at the route's own
//              landmarks (dTip where the line tips, dTop the top of the turn, dTail the join, the nave's mouth, the
//              arch, the last straight's middle third). DURATION is their sum over the route; tOf(u) is the seconds flown at u and
//              uAtSec(s) the place the flight has reached at a second of the design's 48.
//   pois:      search "gaze": the approach's target is the skeleton itself (the point it rests on slides along the
//              curve by the eye's distance to the tail's tip), the pull rising from where the route
//              passes the entry tree and handing over, across one tail's length of flight, to the fixed target at the
//              rib arch's tail end (weight 0.7), which lets go by a third of a tail's length past the join.
//   streams:   the garden's draws come from rng.fork('garden') (R). Loops whose number of draws depends on where the
//              route runs have streams of their own (streamOf: 'cliff-coral', 'bed-scatter', 'bed-approach',
//              'reef-sprigs'), and so have two lots: the grove of the descent ('grove': its trees, their boulders and
//              their sponges) and the fifteen sponges strewn on the open bed ('strewn': where each lies and its size).
//              Trees, sponges, anemones and octopuses are rolled in full whether they are planted or not (an unplanted
//              one goes to gDump, never drawn), and a ring tree's build is its own draw wherever the route runs, so R
//              has taken the same number of draws by the end of the trees whatever the route. (A ring or row tree
//              that is not planted has no sponges by it: R rolls two sponges fewer for each.) RY ('wfg-staging2'):
//              the ring's shoulder, the reef's cushions, the crown's five anemones. 'entry-fan': the entry tree's fan.
//   placed:    ringTrees (first entries: the seeded ring round the fall, fourteen by density, each the build of its
//              own draw; last entries: two rows either side of the final straight), the grove of the descent (search
//              "GROVE": trees of the fuller build on the strip of terrace between the foot of the corner spur and
//              the tip of the tail, eight to twelve of them standing on most seeds, seated by its own stream), the corner
//              spur's tree, the basalt stacks beyond the seaward edge (search "stacks": pale cut-outs behind the
//              skeleton), the pale silt of the shoulder under the final straight (hero uniform uPale), the crown of
//              the skull's back (anchors.occiput: up to eight anemones, occiput2: five more; anchors.occiputSeat: the
//              brooding octopus). Every tree beside the approach keeps each branch 6 u or more from the line
//              (clearOf, coralTree's o.clear: a branch that would come nearer is cut short or left out).
//   scattered: the grenadiers / ratfish (seventeen, one to each seventeenth of the route's length from the entry on,
//              8 u or more off the line: search "seventeen"); the first scatter of sea stars, shells and brittle
//              stars (near the bones and beside the route from a tail's length before the join to the ring); "BED LIFE": more
//              of them, with white crabs walking and squat lobsters on the grove's trees, on the bed under the descent
//              (thickening toward the fall) and on the ring's shoulder; the bacterial mat in pale-rimmed, feathered
//              patches that thicken toward the fall on every side (groundMat uFall: a rule of the ground shader, no
//              placed patch).
//   shown by distance: the bed's small life away from the bones (eyeCull, cullBy: each mesh has a tight sphere and is
//              shown while the eye is within reach of it: 80 u for brittle stars, whose shader folds them away
//              by then, 110 for shells, 140 for stars and crabs); the wall east of x = 80 is a mesh with its own
//              sphere, left out by the renderer's frustum test when it is behind the lens. All share the first
//              meshes' materials: no program is made after build().
//   water:     the dome (DOME_FRAG) and the hero's fog chunk share uFogLow (abyss colour below the horizon) and
//              uFogUp (paler water overhead), so far things melt into the water that is behind them. No lamp anywhere:
//              the ring glows as the engine's portal does, and a fan of its light stands in the snow (fx god rays),
//              of one strength from every eye.
//   moods:     MOODS + pickMood; exposure, fog, bloom and grade: "POST" at the end of build(). update() sets
//              scene.fog.density by the eye's height over the bed: the brief's density within 14 u of the bed, a
//              fifth thinner from 44 u up (clear water over the layer of drifting silt).
//   tone:      laws of the place, the same at every spot and every clock (none reads where the eye is on its flight; a
//              grain is faded by the pixel's own footprint on the surface). THE SHADE OF ROCK, NEAR BY (LIT: wfgShade,
//              wfgNear, uniform uShade, set in build() from the mood's grade): a rock face in shade, seen through
//              clear water, falls to the mood's shadow tint and stops there; far off (by the fog's own law taken on
//              the true distance from the eye to the rock) the shade is gone and the fog takes a dark rock toward
//              the water's blue. It holds for this file's rock: the cliff, its overhang, the wall past the tail, the outcrops and
//              the slope (GROUND_FRAG) and the boulders and the stacks (STATIC_FRAG). The hero's own rock (the parts
//              file: the two rock horns under the jaw arch, the rock of its own bed) is outside it, with its own light.
//              THE BASALT'S LIGHT (GROUND_FRAG): the crust is albedo only and takes the rock's own light; on the
//              wall near by (wallK by place, wfgNear) it grows in patches, in plates of many sizes, dense on ledge
//              tops and faces turned up, nothing on undersides, bare basalt between (wfgPlate, uCrustLit), and the
//              silt at the wall's foot throws its bounce up the first metres of the face (uFoot); the bed's rock
//              and far rock keep the thin film of crust they always had. The coral rooted in the cliff's face is
//              paler, toward the entry tree's own tone, and every coral rooted on the wall's rock (by the wall's own
//              place, wallK, at the coral's root) takes the bounce the wall throws back (STATIC_VERT vWall, uWallCoral).
//              THE BED'S TONE (the hero's chunk G.bedTone, uniform uBedTone): no silt, rim or mat
//              of the floor is paler than a step under the chalk's lit tops. THE ANEMONE'S PLUME (STATIC_FRAG): the
//              white anemones' heads are lobed and feathered, a step under the chalk, each grain faded by the footprint.
//   scripted moments and their uniforms (each by the flight, u; none by the world's clock):
//     - the sixgill: sharkAt(u) places shark.group on SIXGILL ROUTE (the far-side cruise beside the bones, round the
//       skull inside the jaw arch, up the nave to meet the lens at the middle of the rib tunnel (dMeet), belly over
//       the lens, away over the tail). Before the join its place is the seconds flown (tOf) at 1.2 m/s, backward
//       from where the join finds it; from the join on, the lens's own distance to the meeting. With no rare
//       whale, hero.uniforms.uCloud carries the sixgill's own soft shadow on the bed until it rounds the skull.
//       sharkMat.uniforms.uSwim (phase, amplitude, bend). Its snout and fin tips call hero.disturb(0..2), so the
//       plush flinches and sparks where it brushes; the nearest crab is disturber 3. Its look: BODY_FRAG (head,
//       mouth, nostrils, eye, six gill slits a side that carry on underneath, pale undersides to the roots of the
//       paired fins), SHARK_PROF, SHARK_FINS (fins are two-skinned foil sections in bodyGeo, thick at the root,
//       cupped, the trailing edge drawn in, their edges welded round).
//     - the beds' crabs walk and the trees' lobsters sway with their branch: bedStep(lot, time).
//     - silt puffs: puffs.geometry aLife is restamped as the shark's tail passes each site (others loop on time).
//     - rare (ctx.vary.rare): the living whale crosses the bright water broadside ahead of the entry (W0 -> W1)
//       over the design's 1 to 12 s, and its shadow runs the skeleton from tail to jaw over its 9 to 12 s
//       (hero.uniforms.uCloud): both by uAtSec.
import * as THREE from 'three';
import { makePath, makeRng, hashSeed, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, WFG_GLSL as G } from '../parts/whale-fall-garden.js';

const TAU = Math.PI * 2;
const PALETTE = ['#EDE6D2', '#B3122E', '#0B6E86', '#031B2A', '#F29AB2', '#E8C23A', '#5CFFE6'];

// ---------------------------------------------------------------- 1. MOODS
// up: how far the water overhead goes from the fog colour toward the glow (the dome's rise, and the fog's); sat: the
// grade's saturation for that water; belly: the gain on the bounce that lights the sixgill from below. (The basalt's
// crusts are the same in every mood, as on the site; its light is the mood's own, and so is the shade its flanks fall
// to: the mood's shadowTint as the grade shows it, uShade in build().)
const MOODS = {
  peacock: { title: 'The Bone Garden', fog: '#0B6E86', density: 0.0065, low: '#031B2A', glow: '#1C9AB0', glowGain: 1.55, up: 0.6, lean: 6, leanZ: 0,
    key: '#E9F3EF', keyScale: 1.12, sky: '#0B6E86', skyScale: 0.62, bounce: '#C6EEE8', bounceScale: 0.26, shadow: '#06323F',
    snow: 1, snowCol: ['#d9f2f2', '#bfe6ea', '#f1f6ee'], exposure: 1.15, shadowTint: '#06323F', sparks: 1, belly: 1.8, sat: 1.08 },
  jade: { title: 'The Bone Garden, Green Season', fog: '#0D766F', density: 0.0074, low: '#03241F', glow: '#35B79A', glowGain: 1.45, up: 0.55, lean: 6, leanZ: 0,
    key: '#EEF4E2', keyScale: 1.14, sky: '#0E7F78', skyScale: 0.48, bounce: '#C6F0DC', bounceScale: 0.26, shadow: '#06382F',
    snow: 2.3, snowCol: ['#e2f4dc', '#c9ecd0', '#f4f6e4'], exposure: 1.2, shadowTint: '#06382F', sparks: 1, belly: 1.8, sat: 1.08 },
  // indigo-violet: the colours are chosen through the tone map (which crushes a pure blue to primary blue with no red in
  // it): this fog shows as about #1B2C6B at eye level, the water overhead as a paler lilac-blue
  violet: { title: 'The Bone Garden at First Light', fog: '#3B4267', density: 0.0062, low: '#16183E', glow: '#7C7CD4', glowGain: 1.05, up: 0.6, lean: 25, leanZ: 0.35,
    key: '#EFE4FF', keyScale: 1.18, sky: '#3A469A', skyScale: 0.6, bounce: '#D8CCFF', bounceScale: 0.28, shadow: '#1A1850',
    snow: 1, snowCol: ['#e6defa', '#cfd0f4', '#f6eef6'], exposure: 1.22, shadowTint: '#141238', sparks: 1.5, belly: 1.6, sat: 1.05 },
  moon: { title: 'The Bone Garden by Moonlight', fog: '#1C3F60', density: 0.0064, low: '#030B16', glow: '#86A9C9', glowGain: 0.9, up: 0.5, lean: 12, leanZ: -0.3,
    key: '#E3EDF6', keyScale: 0.98, sky: '#24506F', skyScale: 0.62, bounce: '#C9DCEC', bounceScale: 0.26, shadow: '#0A2238',
    snow: 0.9, snowCol: ['#e4eef6', '#c6d8e8', '#f4f6f8'], exposure: 1.3, shadowTint: '#0A2238', sparks: 5, belly: 1.9, sat: 1.08 },
};
function pickMood(rng, hour) {
  const r = rng();                                           // always one draw, whatever the hour
  if (hour === 'night') return 'moon';
  if (hour === 'dawn' || hour === 'golden') return 'violet';
  if (hour === 'day') return r < 0.62 ? 'peacock' : 'jade';
  return r < 0.42 ? 'peacock' : r < 0.64 ? 'jade' : r < 0.84 ? 'violet' : 'moon';
}

// ---------------------------------------------------------------- 2. GLSL
const EPS = 'vec3(0.0, 1e-5, 0.0)';
const FOGV = /* glsl */`
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
`;
// shared fragment lighting: one key from above, hemisphere of sky and bounce, the long-exposure white balance
const LIT = /* glsl */`
${G.light}
${G.noise}
${G.fogParsFrag}
// THE SHADE OF ROCK, NEAR BY: a rock face in shade falls TO the mood's shadow colour and stops there, never under it to
// black (uShade: the scene value that the grade shows as the mood's shadow tint, worked out in build() from the
// grade's own numbers). Light above the shade is kept, so relief, ledges and crusts stand on it. It is a law of the rock
// seen through clear water (wfgNear(d), d the true distance from the eye to the pixel's own place, the same whichever
// way the lens looks: the fog's own law and density taken on that distance: 1 while such a fog would leave the rock
// 93 parts in a hundred or more of its own light, 0 once it would leave 72 or fewer; with the moods' fogs that is
// whole to 9 to 14 m and gone by 19 to 29 m). Farther off there is no shade and the fog takes a dark rock toward the
// water's blue, as it always did.
uniform vec3 uShade;
float wfgNear(float d){
  #if defined(USE_FOG) && defined(FOG_EXP2)
    return smoothstep(0.72, 0.93, exp(-fogDensity*fogDensity*d*d));
  #else
    return 1.0;
  #endif
}
vec3 wfgShade(vec3 col, float d){ vec3 sh = uShade*wfgNear(d); return pow(col*col*col + sh*sh*sh, vec3(1.0/3.0)); }
vec3 wLit(vec3 alb, vec3 n, vec3 p, float ao, float vivid){
  float ndl = dot(n, uKeyDir);
  float key = smoothstep(-0.30, 1.0, ndl); key *= key; key *= wfgCloud(p);
  vec3 hemi = mix(uBounce, uSky, smoothstep(-1.0, 1.0, n.y));
  vec3 hemiW = vec3(dot(hemi, vec3(0.25, 0.5, 0.25)))*1.6;
  vec3 amb = mix(hemi, hemiW, vivid);
  vec3 col = alb*(uKey*key*mix(0.45, 1.0, ao) + amb*mix(0.30, 1.0, ao));
  return mix(col, uShadow*(0.6 + 0.8*alb.g), (1.0 - ao)*0.35*(1.0 - key));
}
`;

// the dome: the water colour at eye level, rising to a paler patch overhead (uUp, then the glow where the light
// comes down) and falling to the abyss colour below the horizon; the fog chunk makes the same rise and fall, so far
// things melt into whatever water is behind them. Slow billows keep the open water from being one flat tone.
const DOME_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix*vec4(mat3(modelViewMatrix)*position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const DOME_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec3 uFogCol; uniform vec4 uFogLow; uniform vec4 uFogUp; uniform vec3 uGlow; uniform vec3 uGlowDir; uniform float uTime;
${G.noise}
void main(){
  vec3 d = normalize(vDir + ${EPS});
  vec3 col = mix(uFogCol, uFogLow.rgb, uFogLow.a*(1.0 - smoothstep(-0.8, -0.05, d.y)));
  col = mix(col, uFogUp.rgb, uFogUp.a*smoothstep(-0.04, 0.8, d.y));
  float c = max(dot(d, uGlowDir), 0.0);
  float spot = smoothstep(0.58, 1.0, c); spot = spot*spot;
  float wide = smoothstep(0.0, 1.0, c);
  float breathe = 1.0 + 0.04*sin(uTime*0.698);
  float dap = 0.82 + 0.36*wfgNoise(vec3(d.xz*3.0/max(d.y + 0.35, 0.2), uTime*0.16));
  col += uGlow*(0.50*spot*dap + 0.20*wide*wide)*breathe;
  float hz = wfgFbm(vec3(d.xz*2.3/max(abs(d.y) + 0.5, 0.3), uTime*0.035 + d.y*1.7));
  col *= 0.90 + 0.20*hz;
  gl_FragColor = vec4(col, 1.0);
}`;

// floor and cliff: silt with the bed's own ripples, basalt with ledges and crusts
const GROUND_VERT = /* glsl */`
attribute vec3 aG;       // rock 0..1, ao, unused (0)
varying vec3 vPos; varying vec3 vN; varying vec3 vG;
uniform vec3 uCamL;
${G.fogParsVert}
void main(){
  vPos = position; vN = normal; vG = aG;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
  ${FOGV}
  vFogY = normalize(position - uCamL + ${EPS}).y;
}`;
const GROUND_FRAG = /* glsl */`
varying vec3 vPos; varying vec3 vN; varying vec3 vG;
uniform vec3 uSilt; uniform vec3 uMatA; uniform vec3 uMatB; uniform float uMatAmt; uniform float uTime;
uniform vec3 uRock; uniform vec3 uPink; uniform vec3 uYellow; uniform vec4 uProw;     // the entry prow: x, z, reach, unused
uniform vec4 uPale;      // a patch of paler silt: x, z, reach, gain
uniform vec4 uFall;      // the fall's own ellipse on the bed (centre x, z, half length, half width): the mat lies in pale-rimmed patches that thicken toward it
uniform vec3 uFoot;      // the wall's foot: the height of the terrace's silt at the foot of the cliff, how far up its bounce reaches (u), its strength
uniform vec2 uCrustLit;  // the wall's growth: its albedo's gain near by, and how much of the rock a plate hides (its thickness)
uniform vec4 uTree;      // the entry tree: its foot on the prow, and its height (u)
${LIT}
${G.bedTone}
// THE WALL'S PLATES, one size of them: a ball of growth to a jittered cell of a turned lattice (as the coral's polyps
// are dealt: no rows, no print), there or not by the growth's density, of its own drawn size, its edge pushed in and
// out by up to three tenths of its radius by a grain finer than itself (wob: lobes and a ragged rim, no disc). The
// rock's face cuts the balls, so the plates of one size of cell run from the ball's own width down to nothing. A
// plate is all pink or all gold (pinkShare: how many are pink here). seen: 1 where the pixel sees the plates, going
// to 0 as its footprint grows from a quarter of the cell to two thirds of it: then the cell's mean cover stands in
// (0.238: the mean share of a cell that its ball fills). Returns (pink, gold).
vec2 wfgPlate(vec3 q, float dens, float pinkShare, float wob, float seen){
  vec3 ci = floor(q);
  float there = 0.2 + 0.8*dens, sz = mix(0.7, 1.0, dens);
  float r = mix(0.24, 0.5, wfgHash(ci + 23.0))*sz;
  vec3 o = (vec3(wfgHash(ci), wfgHash(ci + 17.0), wfgHash(ci + 31.0)) - 0.5)*2.0*(0.5 - r);
  float d = length(fract(q) - 0.5 - o) + (wob - 0.5)*r;
  float c = (1.0 - smoothstep(0.86*r, r, d))*step(wfgHash(ci + 41.0), there);
  float isPink = step(wfgHash(ci + 5.0), pinkShare);
  return mix(there*0.238*sz*sz*sz*vec2(pinkShare, 1.0 - pinkShare), c*vec2(isPink, 1.0 - isPink), seen);
}
void main(){
  vec3 q = vec3(vPos.x, 0.0, vPos.z);
  float n1 = wfgFbm(q*0.22), n2 = wfgNoise(q*1.7 + 4.0), n3 = wfgNoise(q*7.0);
  float vl = length(uCamL - vPos);
  vec3 gn = normalize(vN + ${EPS});
  float rock = smoothstep(0.35, 0.65, vG.x + (n2 - 0.5)*0.3);
  float up = smoothstep(0.55, 0.9, gn.y);
  float near = 1.0 - smoothstep(24.0, 95.0, vl);
  // current ripples: the same wave as the hero's bed, so the two join without a seam
  float rp = vPos.x*3.14159 + (n1 - 0.5)*7.0 + sin(vPos.z*0.35)*1.2;
  float rip = sin(rp), ripd = cos(rp);
  float ripAmt = (1.0 - smoothstep(30.0, 110.0, vl))*(1.0 - rock)*up;
  vec3 n = normalize(gn + vec3(-ripd*0.33*ripAmt, 0.0, (n2 - 0.5)*0.30*ripAmt) + ${EPS});
  vec2 dpl = (vPos.xz - uPale.xy)/max(uPale.z, 1.0);
  vec3 silt = uSilt*(0.72 + 0.4*n1 + 0.12*n3 + 0.07*rip*ripAmt)*(1.0 + uPale.w*exp(-dot(dpl, dpl)));
  // burrows: pin holes with pale rims, and darker drifts of fallen snow in the troughs
  float bur = wfgNoise(q*3.1 + 31.0);
  float nearB = 1.0 - smoothstep(10.0, 42.0, vl);
  float hole = smoothstep(0.905, 0.93, bur)*nearB, rimB = smoothstep(0.80, 0.905, bur)*(1.0 - hole)*nearB;
  silt *= 1.0 + 0.22*rimB;
  silt = mix(silt, silt*0.5, hole*0.6);
  silt *= 0.78 + 0.44*smoothstep(0.3, 0.7, wfgNoise(q*0.06 + 12.0));
  // the trails animals have left: soft meandering furrows
  float tr1 = abs(wfgNoise(q*0.085 + 50.0) - 0.5), tr2 = abs(wfgNoise(q*0.14 + 71.0) - 0.5);
  float trail = (1.0 - smoothstep(0.0, 0.05, tr1)) + 0.7*(1.0 - smoothstep(0.0, 0.065, tr2));
  silt *= 1.0 - 0.11*min(trail, 1.0)*(1.0 - smoothstep(90.0, 170.0, vl));
  // stray rags of bacterial mat away from the bones
  // (the patch fields are read at a point pushed about by finer noise and carry fine grain of their own, and every
  // edge is a wide soft band: a patch feathers into the silt, with no step of one octave's lattice in its outline)
  vec3 qw = q + vec3(wfgNoise(q*1.3 + 8.0) - 0.5, 0.0, n2 - 0.5)*1.9 + vec3(wfgNoise(q*4.3 + 2.0) - 0.5, 0.0, n3 - 0.5)*0.5;
  float fineM = (n3 - 0.5)*0.07 + (wfgNoise(q*2.9 + 15.0) - 0.5)*0.06;
  float p1 = wfgFbm(qw*0.42 + 9.0);
  vec2 dfl = (vPos.xz - uFall.xy)/max(uFall.zw, vec2(1.0));
  float mz = (1.0 - smoothstep(0.85, 2.3, length(dfl)))*(1.0 - rock);      // 1 at the edge of the stain, falling to nothing a fall's length away on every side
  float pm = p1 + fineM + 0.10*mz;
  float mat = smoothstep(0.63, 0.79, pm)*min(uMatAmt, 1.0)*near;
  vec3 matCol = mix(uMatA, uMatB, smoothstep(0.42, 0.58, wfgNoise(q*0.21 + 3.0)));
  float mrim = smoothstep(0.575, 0.665, pm)*(1.0 - smoothstep(0.665, 0.77, pm))*mz*near;      // a ragged pale rim round each patch
  silt = mix(silt, uSilt*vec3(1.55, 1.58, 1.50)*(0.8 + 0.4*n3), mrim*0.55);
  silt = mix(silt, matCol*(0.6 + 0.4*n3), mat*(0.40 + 0.35*mz)*(0.88 + 0.12*sin(uTime*0.8 + n2*20.0)));
  // toward the fall the mat also lies in broader sheets, 8 to 15 u across, lacy inside (windows of silt), each with a
  // ragged pale rim: they read from high on the dive, where the small rags have melted away
  float p2 = wfgFbm(qw*0.15 + 27.0) + 0.05*mz + 0.6*fineM;
  float far2 = 1.0 - smoothstep(120.0, 210.0, vl);
  float sheet = smoothstep(0.58, 0.67, p2)*mz*far2*min(uMatAmt, 1.0);
  float srim = smoothstep(0.53, 0.60, p2)*(1.0 - smoothstep(0.60, 0.675, p2))*mz*far2;
  silt = mix(silt, uSilt*vec3(1.50, 1.54, 1.46)*(0.85 + 0.3*n3), srim*0.45);
  silt = mix(silt, matCol*(0.62 + 0.38*n3), sheet*smoothstep(0.36, 0.56, p1 + 0.2*(n2 - 0.5))*0.55*(0.9 + 0.1*sin(uTime*0.7 + n2*17.0)));
  silt = wfgBedTone(silt);                                                     // the bed's tone (the hero's law): silt, rims and mat keep under the chalk
  // basalt: columns, cracks, silt on every ledge, crusts of pink, yellow and white life
  // fp: the pixel's own footprint on the rock (units of rock under one pixel, longer where the face is seen aslant).
  // Grain finer than the footprint is faded to its mean by it, at every range and every picture size.
  float fp = max(length(dFdx(vPos)), length(dFdy(vPos)));
  float r1 = wfgFbm(vPos*0.13), r2 = wfgNoise(vPos*0.9), r3 = mix(0.5, wfgNoise(vPos*4.0), 1.0 - smoothstep(0.08, 0.25, fp));
  float colm = wfgNoise(vec3(vPos.x*0.55, vPos.y*0.07, vPos.z*0.55));
  float crack = 1.0 - smoothstep(0.0, 0.09, abs(colm - 0.5));
  float strat = 0.85 + 0.3*wfgNoise(vec3(vPos.x*0.03, vPos.y*0.5, vPos.z*0.03));
  vec3 bas = uRock*(0.45 + 0.9*r1 + 0.6*r2*r3)*strat;
  bas *= 1.0 - 0.28*crack*(1.0 - up);
  vec2 dpw = (vPos.xz - uProw.xy)/max(uProw.z, 1.0);
  float pw = exp(-dot(dpw, dpw));                                              // round the entry prow the ledges are dusted paler and crusted thicker
  // the silt that lies on a ledge's top (ledge): the top faces the key and its silt is as pale as the bed's
  float ledge = smoothstep(0.30, 0.8, gn.y)*smoothstep(0.2 - 0.12*pw, 0.55 - 0.15*pw, r2 + 0.3*r3)*0.9;
  bas = mix(bas, silt*(0.9 + 0.55*pw), ledge);
  float c1 = wfgNoise(vPos*0.62 + 17.0), c2 = wfgNoise(vPos*0.85 + 41.0), c3 = wfgNoise(vPos*1.9 + 63.0);
  float side = 1.0 - 0.6*up;
  float zone = wfgNoise(vPos*0.11 + 5.0), cz1 = smoothstep(0.30, 0.55, zone);      // crusts gather in zones, not everywhere
  // THE WALL, by place (wallK): 1 on the cliff's face (within 14 u of the line the cliff is built on, fading out by 22 u)
  // and under its overhang (above y 84 to 92), 0 on the bed's own rock: the outcrops and the slope. A prow that stands
  // out from the face fades with it: the entry prow's top is whole at its tree's foot (14.3 u out) and about a third
  // (0.35) at its tip (18.8 u out).
  // wk: the wall near by (wallK by wfgNear). What follows for the wall near by leaves the bed's rock and every far rock
  // as they were.
  float ww = vPos.x - 94.0, wallZ = -88.0 - 0.5*(ww + sqrt(ww*ww + 144.0));
  float wallK = max(1.0 - smoothstep(14.0, 22.0, vPos.z - wallZ), smoothstep(84.0, 92.0, vPos.y));
  float wk = wallK*wfgNear(vl);
  // the thin film of crust on the bed's rock and on far rock: the patches the crusts always lay in (pinkW, goldW,
  // whiteW), faded to their mean by the pixel's footprint
  float pinkW = smoothstep(0.68 - 0.07*pw, 0.75 - 0.07*pw, c1 + 0.12*r3)*0.6*side*max(cz1, pw);
  float goldW = smoothstep(0.73 - 0.06*pw, 0.79 - 0.06*pw, c2 + 0.10*r3)*0.7*side*(1.0 - 0.6*cz1);
  float whiteW = smoothstep(0.82, 0.86, c3)*0.7*(1.0 - smoothstep(0.18, 0.50, fp));
  float kPatch = 1.0 - smoothstep(0.5, 1.3, fp);
  float pinkK = mix(0.09*side*max(cz1, pw), pinkW, kPatch), goldK = mix(0.06*side*(1.0 - 0.6*cz1), goldW, kPatch);
  // THE WALL'S GROWTH (the wall near by): it grows where growth grows, by one law for the whole wall (no part of the
  // wall is favoured: its threshold leaves about four tenths of the wall near by, by area, with no growth at all). dens:
  // a slow field of the place (zone, 9 u or 2.3 m to a cell, its edge ragged by the basalt's own relief field r1) says
  // where a patch is, and the rock's own facing how dense: full on a ledge's top and a face turned up, half on a sheer flank
  // and there only in a patch's heart, nothing on an underside. Inside a patch the growth stands in plates of three
  // sizes of cell (4.2, 1.5 and 0.55 u: plates from a metre across down to a few centimetres, few big, many small), pink
  // or gold plate by plate (sp: a slower field says which leads), bare basalt between them. Each size fades to its mean
  // cover by the pixel's own footprint. Under the entry tree the colony shades the crust out: no growth within a fifth
  // of the tree's height of its foot, the wall's own growth again from three fifths of it.
  float dens = 0.0;
  if (wk > 0.001) {
    float lean = smoothstep(-0.15, 0.45, gn.y);
    dens = smoothstep(0.38, 0.56, zone + 0.30*(r1 - 0.5) + 0.30*(lean - 0.5))*smoothstep(-0.30, 0.0, gn.y)*mix(0.5, 1.0, lean);
    dens *= smoothstep(0.2*uTree.w, 0.6*uTree.w, length(vPos - uTree.xyz));
    float sp = smoothstep(0.30, 0.70, wfgNoise(vPos*0.07 + 31.0));
    vec3 pq = vec3(dot(vPos, vec3(0.80, 0.36, -0.48)), dot(vPos, vec3(-0.12, 0.88, 0.46)), dot(vPos, vec3(0.59, -0.31, 0.75)));
    vec2 g1 = wfgPlate(pq/4.2, dens, sp, 0.65*c1 + 0.35*c3, 1.0 - smoothstep(1.0, 2.9, fp));
    vec2 g2 = wfgPlate(pq/1.5, dens, sp, 0.65*c3 + 0.35*r3, 1.0 - smoothstep(0.38, 1.05, fp));
    vec2 g3 = wfgPlate(pq/0.55, dens, sp, r3, 1.0 - smoothstep(0.14, 0.38, fp));
    vec2 grow = (1.0 - (1.0 - g1)*(1.0 - g2)*(1.0 - g3))*(uCrustLit.y*smoothstep(0.02, 0.12, dens));
    pinkK = mix(pinkK, grow.x, wk); goldK = mix(goldK, grow.y, wk);
    whiteW *= mix(1.0, smoothstep(0.1, 0.5, dens), wk);                         // the white specks keep to the patches
  }
  float gain = 1.0 + (uCrustLit.x - 1.0)*wk;
  vec3 pinkC = mix(uPink, vec3(0.5, 0.3, 0.4), 0.4)*0.30*(0.6 + 0.7*r3)*gain, goldC = uYellow*0.40*(0.6 + 0.6*r3)*gain;
  bas = mix(bas, pinkC, pinkK);
  bas = mix(bas, goldC, goldK);
  bas = mix(bas, vec3(0.40, 0.42, 0.40)*(0.7 + 0.5*r3), whiteW);
  vec3 alb = mix(silt, bas, rock);
  // THE BASALT'S LIGHT, one law for every rock face of the ground (the cliff along the entry, its overhang, the wall past
  // the tail, the outcrops, the slope). The crust is albedo and nothing more: it takes the rock's own light, by the
  // same normal, key, occlusion and shadow as the basalt it grows on (wLit), bright on a ledge's top and a face turned
  // up, falling with the rock to the shade on a flank and in a recess. A ledge's top takes the key and wears the bed's
  // silt. On the wall near by (wk) the pale silt at its foot throws its bounce up the first metres of the face (uFoot:
  // faces that stand upright or look down take it, a top or a slope does not). What is left in shade falls to the
  // mood's shadow colour and stops there, near by (wfgShade).
  vec3 col = wLit(alb, n, vPos, vG.y, 0.8*rock);
  float footK = exp(-abs(vPos.y - uFoot.x)/max(uFoot.y, 1.0))*(1.0 - smoothstep(0.0, 0.5, gn.y))*wk;
  col = mix(col, wfgShade(col + alb*uBounce*(uFoot.z*footK), vl), rock);
  gl_FragColor = vec4(col, 1.0);
  ${G.fogFrag}
}`;

// coral, sponge, anemone, boulders: one merged, vertex-coloured mesh that leans and trembles in the current
const STATIC_VERT = /* glsl */`
attribute vec4 aSway;    // pivot xyz, reach of the sway in units
attribute float aK;      // 0 coral, 1 sponge, 2 anemone, 3 rock
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying vec2 vK; varying vec3 vRest; varying vec2 vWall;
${G.light}
${G.plush}
${G.fogParsVert}
void main(){
  vec3 p = position;
  // vWall.x: 1 for a thing rooted in the cliff's own face or at its very foot: its pivot stands within 13 u of the cliff's foot line (the line
  // cliffZ is built on; between its foot and its overhang the face's relief stands at most 12 u out from that line),
  // or up under the overhang (above y 90). 0 for what stands out on a prow, a spur or the terrace.
  // vWall.y: how far the thing's own root stands on the wall's rock: the ground's own wallK (GROUND_FRAG) at its pivot,
  // 1 within 14 u of the cliff's line or above y 92, fading to 0 by 22 u out and under y 84. One rule for the hangers
  // and for whatever is rooted on the wall's ledges, prows or foot (the entry tree among them); what is rooted farther
  // out, on the terrace or the bed, takes none.
  float ww = aSway.x - 94.0, wallZ = -88.0 - 0.5*(ww + sqrt(ww*ww + 144.0));
  vWall.x = max(1.0 - smoothstep(12.6, 13.6, aSway.z - wallZ), smoothstep(90.0, 93.0, aSway.y));
  vWall.y = max(1.0 - smoothstep(14.0, 22.0, aSway.z - wallZ), smoothstep(84.0, 92.0, aSway.y));
  float w = aSway.w;
  float g = wfgGust(aSway.xyz);
  float ph = aSway.x*0.37 + aSway.z*0.23;
  float shy = 1.0 - 0.85*wfgBare(aSway.xyz)*step(1.5, aK)*step(aK, 2.5);
  vec3 lean = vec3(0.45 + 1.0*g, -0.14, 0.2*sin(uTime*0.6 + ph));
  float osc = 0.6 + 0.4*sin(uTime*0.8 + ph + p.y*0.3);
  p += (lean*osc + vec3(0.12, 0.0, 0.3)*sin(uTime*1.7 + ph*3.0 + p.x*1.3 + p.y*0.9))*w;
  p = mix(aSway.xyz, p, mix(1.0, shy, step(1e-4, w)));
  vCol = color; vPos = p; vN = normal; vK = vec2(aK, w); vRest = position;      // vRest: patterns stay on the skin while it sways
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  ${FOGV}
  vFogY = normalize(p - uCamL + ${EPS}).y;
}`;
const STATIC_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying vec2 vK; varying vec3 vRest; varying vec2 vWall;
uniform float uTime; uniform vec2 uWallCoral;
${LIT}
void main(){
  vec3 n = normalize(vN + ${EPS});
  if (!gl_FrontFacing) n = -n;
  vec3 vd = uCamL - vPos; float vl = length(vd); vec3 v = vd/max(vl, 1e-4);
  float n1 = wfgNoise(vRest*1.3), n2 = wfgNoise(vRest*5.5), n3 = wfgNoise(vRest*15.0), n4 = wfgNoise(vRest*5.5 + 9.0);
  float fine = 1.0 - smoothstep(22.0, 85.0, vl);
  float k = vK.x;
  float isCoral = 1.0 - smoothstep(0.4, 0.6, k), isSponge = 1.0 - smoothstep(0.4, 0.6, abs(k - 1.0));
  float isAnem = 1.0 - smoothstep(0.4, 0.6, abs(k - 2.0)), isRock = smoothstep(2.4, 2.6, k);
  n = normalize(n + (vec3(n2, n3, n4) - 0.5)*fine*(0.55*isCoral + 0.4*isSponge + 0.5*isRock) + ${EPS});
  vec3 alb = vCol*(0.80 + 0.28*n1 + 0.14*(n2 - 0.5));
  alb *= 1.0 + uWallCoral.x*vWall.x*isCoral;                                   // the coral hung off the cliff is lit pale pink from above as the entry tree is (the tree's own paleness)
  // polyps: round, one to a jittered cell, standing proud of the branch (the normal leans out round each), pale with a
  // darker mouth, opening and closing in turn; beyond about 45 u they melt into a soft mottle
  float pNear = (1.0 - smoothstep(14.0, 46.0, vl))*isCoral;
  // (the lattice is turned off the axes; a third of the cells are empty; each polyp has its own size, 0.10 to 0.27 of a
  // cell, and the small ones stray further from the cell's middle: no two rows alike, nothing like a print)
  vec3 pq = vec3(dot(vRest, vec3(0.80, 0.36, -0.48)), dot(vRest, vec3(-0.12, 0.88, 0.46)), dot(vRest, vec3(0.59, -0.31, 0.75)))*4.3;
  vec3 pci = floor(pq);
  float pr0 = 0.10 + 0.17*wfgHash(pci + 23.0);
  vec3 pv = fract(pq) - 0.5 - (vec3(wfgHash(pci), wfgHash(pci + 17.0), wfgHash(pci + 31.0)) - 0.5)*2.0*(0.47 - pr0);
  float pd = length(pv);
  float open = 0.5 + 0.5*sin(uTime*0.9 + wfgHash(pci + 5.0)*6.2831853 + vRest.y*0.8);
  float pr = pr0*(0.72 + 0.28*open);
  float polyp = (1.0 - smoothstep(pr - 0.04, pr + 0.03, pd))*pNear*step(0.34, wfgHash(pci + 41.0));
  n = normalize(n + pv*(polyp*smoothstep(0.03, pr, pd)*1.6/max(pd, 0.04)) + ${EPS});
  alb = mix(alb, vec3(0.80, 0.74, 0.70), polyp*(0.45 + 0.55*open)*0.9);
  alb *= 1.0 - 0.45*polyp*(1.0 - smoothstep(0.02, 0.08, pd));
  float pol = smoothstep(0.60, 0.76, n3)*fine*isCoral*(1.0 - pNear);
  alb = mix(alb, vec3(0.74, 0.70, 0.66), pol*0.55);
  alb *= 1.0 - 0.55*smoothstep(0.66, 0.78, n2)*isSponge*fine;                  // sponge pores
  // THE ANEMONE'S PLUME: the white anemone's head is no plain white ball. It is lobed like a cauliflower (dark creases
  // between lobes a fifth of a unit across, n2) and feathered (the plume's own grain, n3), and it stands a step under the
  // chalk's lit tops (its lit side ends in a soft shoulder of its own, below). Each grain is faded to its mean by the
  // pixel's own footprint on it (fpA), at every range and size
  float fpA = max(length(dFdx(vRest)), length(dFdy(vRest)));
  float lobe = 1.0 - smoothstep(0.0, 0.10, abs(n2 - 0.5));
  alb *= 1.0 - isAnem*(1.0 - mix(0.86, 1.0 - 0.55*lobe, 1.0 - smoothstep(0.05, 0.16, fpA))*mix(0.72, 0.50 + 0.44*n3, 1.0 - smoothstep(0.02, 0.07, fpA)));
  alb *= 1.0 - isRock*(0.5*smoothstep(0.5, 0.7, n2));
  vec3 col = wLit(alb, n, vPos, 1.0, 0.7*(1.0 - isRock));
  float rim = 1.0 - abs(dot(n, v)); rim = rim*rim*rim;
  col += alb*uKey*rim*(0.25 + 0.75*smoothstep(-0.2, 0.8, n.y))*(0.50*isCoral + 0.55*isAnem + 0.15*isSponge);
  col += vCol*uKey*0.23*isCoral;                                               // the top light soaks through the soft coral: candy pink, never grey
  col += alb*uBounce*(uWallCoral.y*vWall.y*isCoral);                           // THE WALL'S BOUNCE ON ITS CORAL: the wall is lit rock now, no black, and throws the water's bounce back on every coral rooted on its rock (vWall.y), one strength for all
  float mxA = max(col.r, max(col.g, col.b));                                   // the anemone's shoulder: its lit side rolls off from 0.34 to 0.52 at most,
  col *= mix(1.0, mxA > 0.34 ? (0.34 + 0.18*(1.0 - exp(-(mxA - 0.34)/0.18)))/mxA : 1.0, isAnem);      // a clear step under the chalk's 0.9 in every light
  col = mix(col, wfgShade(col, vl), isRock);                                       // boulders and stacks: the rock's shade (LIT)
  gl_FragColor = vec4(col, 1.0);
  ${G.fogFrag}
}`;

// instanced small things (shells, sea stars, crabs and squat lobsters, grenadiers / ratfish): position + quaternion
// per instance, simple part animation chosen by aAnim.x (1 leg, 2 claw, 3 tail scull, 4 arm tip, 5 wing fin)
const INST_VERT = /* glsl */`
attribute vec4 iPos;     // xyz, scale
attribute vec4 iQuat;
attribute vec4 iDat;     // phase, pose, tint mix, speed
attribute vec4 aAnim;    // kind, phase, amount, unused
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying vec3 vL;
uniform float uTime; uniform vec3 uCamL; uniform vec3 uTintA; uniform vec3 uTintB; uniform float uBob;
${G.fogParsVert}
vec3 qrot(vec4 q, vec3 v){ return v + 2.0*cross(q.xyz, cross(q.xyz, v) + q.w*v); }
void main(){
  vec3 p = position;
  float t = uTime*iDat.w + iDat.x;
  float kind = aAnim.x;
  if (kind > 0.5 && kind < 1.5) {
    float a = sin(t*6.0 + aAnim.y)*0.30*aAnim.z; float c = cos(a), s = sin(a);
    p.xz = vec2(c*p.x - s*p.z, s*p.x + c*p.z);
    p.y += max(0.0, cos(t*6.0 + aAnim.y))*0.07*aAnim.z;
  } else if (kind > 1.5 && kind < 2.5) {
    float lift = iDat.y*(0.42 + 0.22*sin(t*1.3 + aAnim.y)) + (1.0 - iDat.y)*0.16*max(0.0, sin(t*2.3 + aAnim.y));
    p.y += lift*aAnim.z; p.x -= lift*aAnim.z*0.35;
  } else if (kind > 2.5 && kind < 3.5) {
    p.z += sin(t*2.4 - p.x*1.5)*aAnim.z*0.2;
  } else if (kind > 3.5 && kind < 4.5) {
    p.y += aAnim.z*(0.08 + 0.10*sin(t*0.7 + aAnim.y));
  } else if (kind > 4.5) {
    p.y += aAnim.z*sin(t*1.5 + aAnim.y)*0.55*iDat.y;
  }
  vL = position;
  vec3 wp = iPos.xyz + qrot(iQuat, p*iPos.w);
  wp.y += uBob*sin(uTime*0.5 + iDat.x*3.0);
  vN = qrot(iQuat, normal); vPos = wp;
  vCol = color*mix(uTintA, uTintB, iDat.z);
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.0);
  ${FOGV}
  vFogY = normalize(wp - uCamL + ${EPS}).y;
}`;
const INST_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying vec3 vL;
uniform float uGloss;
${LIT}
void main(){
  vec3 n = normalize(vN + ${EPS});
  if (!gl_FrontFacing) n = -n;
  vec3 vd = uCamL - vPos; float vl = length(vd); vec3 v = vd/max(vl, 1e-4);
  float fine = 1.0 - smoothstep(10.0, 45.0, vl);
  float m1 = wfgNoise(vL*7.0 + 3.0), m2 = wfgNoise(vL*23.0);
  vec3 alb = vCol*(0.82 + 0.3*(m1 - 0.5)*fine + 0.2*(m2 - 0.5)*fine);
  n = normalize(n + (vec3(m2, m1, wfgNoise(vL*23.0 + 5.0)) - 0.5)*0.3*fine + ${EPS});
  vec3 col = wLit(alb, n, vPos, 0.55 + 0.45*smoothstep(-0.6, 0.4, n.y), 0.75);
  float rim = 1.0 - abs(dot(n, v)); rim = rim*rim;
  col += alb*uKey*rim*0.22*(0.3 + 0.7*smoothstep(-0.2, 0.8, n.y));
  float spec = max(dot(reflect(-uKeyDir, n), v), 0.0); spec *= spec; spec *= spec; spec *= spec;
  col += uKey*spec*uGloss;
  gl_FragColor = vec4(col, 1.0);
  ${G.fogFrag}
}`;

// brittle stars: three arms out of the silt per star, waving in the current, never thinner than 1.5 px
const BRITTLE_VERT = /* glsl */`
attribute vec4 iPos;     // xyz, arm length
attribute vec4 iDat;     // yaw, phase, tint, lean
varying vec3 vCol; varying float vT;
uniform vec3 uTintA; uniform vec3 uTintB; uniform float uPx;
${G.light}
${G.plush}
${G.fogParsVert}
void main(){
  float arm = position.x, t = position.y, sd = position.z;
  float a = iDat.x + arm*2.2 + 0.6*sin(arm*5.0 + iDat.y);
  float g = wfgGust(iPos.xyz);
  vec3 d0 = vec3(cos(a)*0.5, 0.86, sin(a)*0.5);
  vec3 flow = vec3(0.55 + 0.9*g, -0.25, 0.0)*iDat.w;
  float wv = sin(uTime*1.5 + iDat.y + arm*2.1 - t*3.2)*0.34*t + sin(uTime*0.6 + iDat.y*2.0 + arm)*0.18*t;
  vec3 sidew = vec3(-sin(a), 0.0, cos(a));
  vec3 c = iPos.xyz + iPos.w*(d0*t + flow*t*t*0.6 + sidew*wv + vec3(0.0, 0.10*sin(uTime*1.1 + iDat.y + arm*3.0)*t, 0.0));
  vec3 tang = normalize(d0 + flow*t*1.2 + sidew*wv*0.8 + ${EPS});
  vec3 vd0 = uCamL - iPos.xyz; float farK = 1.0 - smoothstep(38.0, 78.0, length(vd0));
  c = mix(iPos.xyz, c, farK);
  vec3 vd = uCamL - c; float dist = length(vd);
  vec3 sdv = normalize(cross(tang, vd/max(dist, 1e-4)) + ${EPS});
  float wid = max(0.034*iPos.w*(1.0 - 0.75*t), dist*uPx*0.8)*farK;
  vec3 p = c + sdv*sd*wid;
  float thin = clamp(0.034*iPos.w/max(dist*uPx*0.8, 1e-5), 0.25, 1.0);
  vec3 base = mix(uTintA, uTintB, iDat.z);
  vec3 hemi = mix(uBounce, uSky, 0.8);
  vec3 hemiW = vec3(dot(hemi, vec3(0.25, 0.5, 0.25)))*1.6;
  vCol = base*(uKey*(0.30 + 0.45*t)*wfgCloud(c) + mix(hemi, hemiW, 0.7))*mix(0.5, 1.0, thin);
  vT = t;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  ${FOGV}
  vFogY = normalize(p - uCamL + ${EPS}).y;
}`;
const BRITTLE_FRAG = /* glsl */`
varying vec3 vCol; varying float vT;
${G.fogParsFrag}
void main(){
  float band = 0.82 + 0.18*sin(vT*40.0);
  gl_FragColor = vec4(vCol*band, 1.0);
  ${G.fogFrag}
}`;

// the sixgill (and the rare living whale): a lofted body that swims by a travelling wave and bends through turns
const BODY_VERT = /* glsl */`
attribute vec4 aB;       // t along the body (0 snout .. 1 tail tip), lateral -1..1, height -1 belly .. 1 back, fin 0/1
varying vec3 vPos; varying vec3 vN; varying vec3 vL; varying vec4 vB;
uniform vec3 uCamL; uniform vec4 uSwim; uniform float uLen;     // uSwim: phase, amplitude, bend, unused
${G.fogParsVert}
void main(){
  vec3 p = position;
  float t = aB.x;
  float amp = uSwim.y*(0.010 + 0.10*t*t)*uLen;
  float ph = uSwim.x - t*5.4;
  float xr = max(0.0, 0.32*uLen - p.x);
  p.z += amp*sin(ph) + uSwim.z*xr*xr/uLen;
  float sl = amp*cos(ph)*5.4/uLen - 2.0*uSwim.z*xr/uLen;       // dz/dx, to turn the normal with the body
  vec3 nn = normalize(vec3(normal.x - normal.z*sl, normal.y, normal.z + normal.x*sl) + ${EPS});
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vPos = wp.xyz; vN = mat3(modelMatrix)*nn; vL = position; vB = aB;
  vec4 mvPosition = viewMatrix*wp;
  ${FOGV}
  vFogY = normalize(wp.xyz - uCamL + ${EPS}).y;
}`;
const BODY_FRAG = /* glsl */`
varying vec3 vPos; varying vec3 vN; varying vec3 vL; varying vec4 vB;
uniform vec3 uTop; uniform vec3 uBelly; uniform vec3 uEye; uniform float uFeat; uniform float uTime; uniform float uLen; uniform float uBG;
${LIT}
// freckles: one round spot to a jittered cell, of mixed size, two thirds of the cells filled (never square)
float frk(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p) - 0.5 - (vec3(wfgHash(i), wfgHash(i + 13.0), wfgHash(i + 29.0)) - 0.5)*0.5;
  float r = 0.17 + 0.20*wfgHash(i + 7.0);
  return (1.0 - smoothstep(r*0.65, r, length(f)))*step(0.34, wfgHash(i + 3.0));
}
void main(){
  vec3 n = normalize(vN + ${EPS});
  if (!gl_FrontFacing) n = -n;
  vec3 vd = uCamL - vPos; float vl = length(vd); vec3 v = vd/max(vl, 1e-4);
  float tb = vB.x, lat = vB.y, hgt = vB.z, fin = min(vB.w, 1.0), finU = clamp(vB.w - 1.0, 0.0, 1.0);      // finU: 0 leading edge .. 1 trailing edge
  vec3 ls = vL*(20.0/max(uLen, 1.0));
  float m1 = wfgFbm(ls*0.55), m2 = wfgNoise(ls*2.6 + 7.0), m3 = wfgNoise(ls*9.0);
  float fine = 1.0 - smoothstep(25.0, 90.0, vl);
  float head = (1.0 - smoothstep(0.0, 0.25, tb))*uFeat;
  // brown-grey above, pale below: the pale of the belly comes well up the lower flank and under the whole head
  float back = smoothstep(-0.72, 0.16, hgt + 0.3*(m1 - 0.5) + 0.10*head);
  // a paired fin (pectoral, pelvic: hgt runs -0.62 at its root to -0.3) carries the belly's pale tone onto the underside of its root
  float pfin = fin*step(-0.9, hgt)*step(hgt, -0.25)*(1.0 - smoothstep(-0.4, 0.1, n.y))*(1.0 - smoothstep(-0.62, -0.34, hgt));
  vec3 alb = mix(uBelly, uTop, max(back, fin*(1.0 - 0.85*pfin)));
  alb *= 0.78 + 0.34*m1 + 0.12*(m3 - 0.5)*fine;
  // freckles on the back and flanks: small round spots of two sizes (frk above)
  float fq = 0.4 + 0.6*fine;
  float fr = max(frk(ls*2.3 + 7.0), 0.85*frk(ls*3.9 + 2.0))*fq;
  alb *= 1.0 - 0.58*fr*(0.35 + 0.65*back)*uFeat;
  alb *= 1.0 - 0.40*max(frk(ls*2.7 + 31.0), 0.8*frk(ls*4.4 + 3.0))*fq*(1.0 - back)*(1.0 - fin)*uFeat;            // the freckles carry on under the belly, fainter
  alb *= 1.0 - 0.45*smoothstep(0.45, 1.0, finU)*fin*(1.0 - 0.6*pfin);                                       // fins darken to the trailing edge
  alb = mix(alb, uBelly*0.8, smoothstep(0.74, 0.80, wfgNoise(ls*3.4 + 19.0))*0.30*back*(1.0 - head)*uFeat);
  float ndv0 = abs(dot(n, v));
  // six gill slits each side: long dark curved bars from under the throat (they all but meet below) up the flank
  // behind the jaw, each with a pale flap edge behind it, pumping in turn. gw is how many slits one pixel spans:
  // before they could break into dots they melt into one soft shade. They fade where the skin turns edge-on to the
  // lens, except underneath, where the lens looks up at them as the fish comes over
  float gs = (tb - 0.170 - 0.018*hgt*hgt + 0.006*hgt)/0.0165;
  float gw = fwidth(gs);
  float under = 1.0 - smoothstep(-0.5, 0.0, n.y);
  float slitMask = step(0.0, gs)*step(gs, 6.0)*smoothstep(0.05, 0.30, abs(lat))*(1.0 - smoothstep(0.20, 0.55, hgt))*(1.0 - fin)*uFeat*mix(smoothstep(0.02, 0.15, ndv0), 1.0, under);
  float gfr = fract(gs) - 0.5, gf = abs(gfr);
  float pump = 0.5 + 0.5*sin(uTime*1.5 - floor(gs)*0.55);
  float shw = 0.17 + 0.07*pump;
  float sharp = 1.0 - smoothstep(shw - 0.5*gw - 0.03, shw + 0.5*gw + 0.03, gf);
  float slit = mix(sharp, 2.0*shw, smoothstep(0.35, 0.9, gw))*slitMask;
  float flap = smoothstep(shw, shw + 0.06, gfr)*(1.0 - smoothstep(shw + 0.08, shw + 0.24, gfr))*slitMask*(1.0 - smoothstep(0.25, 0.6, gw));
  alb = mix(alb, alb*1.35 + 0.02, flap*0.6);
  alb = mix(alb, alb*0.13, slit*0.95);
  // the underslung mouth: a dark crescent under the snout, corners swept back, a pale lip ahead of it and behind
  float mz = 0.030 + 0.050*lat*lat;
  float mMask = smoothstep(0.30, 0.55, -hgt)*(1.0 - smoothstep(0.80, 0.97, abs(lat)))*(1.0 - fin)*uFeat;
  float mouth = (1.0 - smoothstep(0.0045, 0.0105, abs(tb - mz)))*mMask;
  float lip = max(1.0 - smoothstep(0.005, 0.017, abs(tb - mz + 0.014)), 0.6*(1.0 - smoothstep(0.004, 0.013, abs(tb - mz - 0.013))))*mMask*(1.0 - mouth);
  alb = mix(alb, uBelly*1.45, lip*0.75);
  alb = mix(alb, vec3(0.012, 0.010, 0.012), mouth*0.90);
  // nostril pits either side of the snout
  vec2 np = vec2((tb - 0.016)/0.007, (abs(lat) - 0.52)/0.13);
  float nost = (1.0 - smoothstep(0.55, 1.0, length(np)))*(1.0 - smoothstep(0.1, 0.45, abs(hgt + 0.05)))*(1.0 - fin)*uFeat;
  alb = mix(alb, vec3(0.015, 0.012, 0.012), nost*0.85);
  n = normalize(n + (vec3(m3, m2, wfgNoise(ls*9.0 + 4.0)) - 0.5)*0.22*fine + ${EPS});
  // light: the top light on the back; the bounce (pale light thrown up off bone and silt, uBG its gain) is strongest
  // straight below and wraps up the flanks and round the blunt head, because the lit ribs stand on either side: it is
  // what models the belly, the throat, the gills and the undersides of the fins. A cold rim from above on the back.
  float ndl = dot(n, uKeyDir);
  float key = smoothstep(-0.30, 1.0, ndl); key *= key; key *= wfgCloud(vPos);
  float dn = 1.0 - smoothstep(-1.0, 0.9, n.y);
  vec3 hemi = uBounce*uBG*dn*(0.5 + 0.5*dn) + uSky*smoothstep(-0.6, 1.0, n.y);
  vec3 hemiW = vec3(dot(hemi, vec3(0.25, 0.5, 0.25)))*1.6;
  vec3 col = alb*(uKey*key + mix(hemi, hemiW, 0.6));
  float rim = 1.0 - abs(dot(n, v)); rim = rim*rim*rim;
  col += (uBounce*uBG*0.6 + uSky*0.5)*rim*0.20*(0.4 + 0.6*min(alb.g*4.0, 1.4))*uFeat;
  col += uKey*rim*smoothstep(0.1, 0.9, n.y)*0.10;
  float spec = max(dot(reflect(-uKeyDir, n), v), 0.0); spec *= spec; spec *= spec; spec *= spec;
  col += uKey*spec*0.08*(1.0 - 0.7*head);
  // one fluorescent green eye each side
  vec2 e = vec2((tb - 0.064)/0.0105, (hgt - 0.06)/0.17);
  float ed = length(e);
  float eye = (1.0 - smoothstep(0.75, 1.0, ed))*smoothstep(0.45, 0.7, abs(lat))*(1.0 - fin)*uFeat;
  float pupil = 1.0 - smoothstep(0.10, 0.22, length(e*vec2(0.9, 2.2)));
  col = mix(col, uEye*(0.75 + 0.25*sin(uTime*2.1))*(1.0 - 0.9*pupil) + uKey*0.25*(1.0 - smoothstep(0.2, 0.5, length(e - vec2(0.3, 0.35)))), eye);
  gl_FragColor = vec4(col, 1.0);
  ${G.fogFrag}
}`;

// brooding octopuses: mantles breathe, arm tips curl, the pupil stays on the lens
const OCTO_VERT = /* glsl */`
attribute vec4 aC;       // body centre xyz, phase
attribute vec4 aO;       // part (0 mantle, 1 arm, 2 eye), along 0..1, around 0..1, arm phase
varying vec3 vPos; varying vec3 vN; varying vec4 vO; varying vec3 vL;
uniform float uTime; uniform vec3 uCamL;
${G.fogParsVert}
void main(){
  vec3 r = position - aC.xyz;
  float br = sin(uTime*1.15 + aC.w);
  float arm = step(0.5, aO.x)*step(aO.x, 1.5);
  r *= 1.0 + 0.075*br*mix(0.35 + 0.65*smoothstep(-0.3, 0.7, r.y), 0.22, arm);
  float al = aO.y;
  float cu = arm*al*al*0.26*sin(uTime*0.7 + aC.w*1.7 + aO.w + al*2.0);
  vec3 rn = normalize(vec3(r.x, 0.0, r.z) + vec3(1e-4, 0.0, 0.0));
  r += vec3(-rn.z, 0.0, rn.x)*cu + vec3(0.0, cu*0.6, 0.0);
  vec3 p = aC.xyz + r;
  vPos = p; vN = normal; vO = aO; vL = position - aC.xyz;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  ${FOGV}
  vFogY = normalize(p - uCamL + ${EPS}).y;
}`;
const OCTO_FRAG = /* glsl */`
varying vec3 vPos; varying vec3 vN; varying vec4 vO; varying vec3 vL;
uniform vec3 uSkin; uniform vec3 uUnder; uniform float uTime;
${LIT}
void main(){
  vec3 n = normalize(vN + ${EPS});
  if (!gl_FrontFacing) n = -n;
  vec3 vd = uCamL - vPos; float vl = length(vd); vec3 v = vd/max(vl, 1e-4);
  float fine = 1.0 - smoothstep(8.0, 40.0, vl);
  float m1 = wfgNoise(vL*3.1 + 5.0), m2 = wfgNoise(vL*11.0), m3 = wfgNoise(vL*27.0);
  float arm = step(0.5, vO.x)*step(vO.x, 1.5), eyeP = step(1.5, vO.x);
  vec3 alb = uSkin*(0.70 + 0.40*m1 + 0.18*(m2 - 0.5)*fine);
  // mottle (dark mauve blotches), pale papillae, and the creases of a soft wrinkled skin
  float blot = smoothstep(0.50, 0.70, wfgNoise(vL*5.3 + 13.0) + 0.25*(m2 - 0.5));
  alb = mix(alb, uSkin*vec3(0.50, 0.36, 0.58), blot*mix(0.35, 0.8, fine));
  alb = mix(alb, uSkin*vec3(1.25, 1.15, 1.2), smoothstep(0.70, 0.80, m3)*0.55*fine*(1.0 - blot));
  float wr = abs(wfgNoise(vL*vec3(8.0, 3.2, 8.0) + 2.0) - 0.5)*2.0;
  float crease = (1.0 - smoothstep(0.0, 0.16, wr))*fine*(1.0 - eyeP)*(1.0 - arm*0.6);
  alb *= 1.0 - 0.42*crease;
  // arms turned inside out: the pale underside outward, two rows of suckers
  float ar = vO.z, under = arm*(1.0 - smoothstep(0.16, 0.30, abs(ar - 0.5)));
  alb = mix(alb, uUnder*(0.85 + 0.2*m2), under);
  float rowA = abs(ar - 0.44), rowB = abs(ar - 0.56);
  float cell = fract(vO.y*20.0 + step(rowB, rowA)*0.5) - 0.5;
  float sd = length(vec2(min(rowA, rowB)/0.045, cell*1.9));
  float suck = (1.0 - smoothstep(0.55, 0.85, sd))*under*fine*(1.0 - smoothstep(0.85, 1.0, vO.y));
  alb = mix(alb, vec3(0.80, 0.76, 0.78), suck*0.9);
  alb = mix(alb, uUnder*0.35, (1.0 - smoothstep(0.12, 0.3, sd))*suck);
  n = normalize(n + (vec3(m2, m3, wfgNoise(vL*11.0 + 8.0)) - 0.5)*0.55*fine*(1.0 - eyeP) + ${EPS});
  vec3 col = wLit(alb, n, vPos, (0.5 + 0.5*smoothstep(-0.7, 0.3, n.y))*(1.0 - 0.35*crease), 0.8);
  float ndv = abs(dot(n, v));
  float rim = 1.0 - ndv; rim = rim*rim;
  col += uSkin*uKey*rim*0.28*(0.3 + 0.7*smoothstep(-0.2, 0.8, n.y));
  float spec = max(dot(reflect(-uKeyDir, n), v), 0.0); spec *= spec; spec *= spec; spec *= spec; spec *= spec;
  col += uKey*spec*0.22;
  // the eye (vO.y = height on the eyeball, -1..1): a hood of skin over its top, a pale gold iris, and a dark
  // horizontal slit of pupil across the part that faces whoever looks
  vec3 iris = vec3(0.62, 0.52, 0.30)*(uKey*0.5 + 0.35)*(0.8 + 0.4*m2);
  float pup = (1.0 - smoothstep(0.10, 0.24, abs(vO.y + 0.05)))*smoothstep(0.30, 0.62, ndv);
  float hood = smoothstep(0.30, 0.52, vO.y + 0.25*(m1 - 0.5));
  vec3 eyeCol = mix(iris, vec3(0.01, 0.01, 0.015), pup) + uKey*spec*0.5;
  col = mix(col, mix(eyeCol, col*0.8, hood), eyeP);
  gl_FragColor = vec4(col, 1.0);
  ${G.fogFrag}
}`;

// hagfish: a tube bent along a curve that ties and unties itself
const HAG_VERT = /* glsl */`
attribute vec4 iPos;     // xyz, length
attribute vec4 iDat;     // yaw, phase, tint, speed
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying float vS;
uniform float uTime; uniform vec3 uCamL; uniform vec3 uTintA; uniform vec3 uTintB;
${G.fogParsVert}
vec3 hagC(float s, float t, float k){
  float w = 6.2831853*s;
  vec3 loose = vec3((s - 0.5), 0.10 + 0.05*sin(w*1.5 + t*0.8), 0.13*sin(w*1.2 - t*1.6));
  vec3 knot = vec3(0.22*sin(w) + 0.30*sin(w*2.0 + t*0.3), 0.16 + 0.12*cos(w*3.0), 0.22*cos(w) - 0.30*cos(w*2.0 + t*0.3))*0.62;
  return mix(loose, knot, k);
}
void main(){
  float s = position.x, t = uTime*iDat.w + iDat.y;
  float k = smoothstep(-0.15, 0.75, sin(t*0.42 + iDat.y*3.0));
  vec3 c = hagC(s, t, k);
  vec3 tg = normalize(hagC(s + 0.02, t, k) - hagC(s - 0.02, t, k) + vec3(1e-5, 0.0, 0.0));
  vec3 b1 = normalize(cross(tg, vec3(0.0, 1.0, 0.0)) + vec3(0.0, 0.0, 1e-4));
  vec3 b2 = cross(b1, tg);
  float rad = 0.034*(1.0 - 0.6*smoothstep(0.75, 1.0, s))*(0.55 + 0.45*smoothstep(0.0, 0.06, s));
  vec3 nl = b1*position.y + b2*position.z;
  vec3 lp = c + nl*rad;
  float cy = cos(iDat.x), sy = sin(iDat.x);
  vec3 wp = iPos.xyz + iPos.w*vec3(cy*lp.x - sy*lp.z, lp.y, sy*lp.x + cy*lp.z);
  vN = vec3(cy*nl.x - sy*nl.z, nl.y, sy*nl.x + cy*nl.z);
  vPos = wp; vS = s;
  vCol = mix(uTintA, uTintB, iDat.z);
  vec4 mvPosition = modelViewMatrix*vec4(wp, 1.0);
  ${FOGV}
  vFogY = normalize(wp - uCamL + ${EPS}).y;
}`;
const HAG_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying float vS;
${LIT}
void main(){
  vec3 n = normalize(vN + ${EPS});
  vec3 v = normalize(uCamL - vPos + ${EPS});
  vec3 alb = vCol*(0.8 + 0.3*wfgNoise(vPos*6.0));
  alb = mix(alb, vCol*1.5, (1.0 - smoothstep(-0.5, 0.3, n.y))*0.5);
  alb *= 1.0 - 0.5*(1.0 - smoothstep(0.0, 0.03, abs(fract(vS*26.0) - 0.5) - 0.38))*step(0.1, vS);    // slime pores
  vec3 col = wLit(alb, n, vPos, 1.0, 0.8);
  float spec = max(dot(reflect(-uKeyDir, n), v), 0.0); spec *= spec; spec *= spec; spec *= spec; spec *= spec;
  col += uKey*spec*0.5;
  gl_FragColor = vec4(col, 1.0);
  ${G.fogFrag}
}`;

// silt puffs: soft round sprites that swell and fade where a claw or a tail has touched the bed
const PUFF_VERT = /* glsl */`
attribute vec3 aLife;    // born (s), life (s), period (s; 0 = one shot)
attribute float aSize;
varying float vA; varying vec3 vC;
uniform float uTime; uniform float uPxScale; uniform vec3 uSilt; uniform vec3 uKey; uniform vec3 uSky;
${G.fogParsVert}
void main(){
  float age = uTime - aLife.x;
  if (aLife.z > 0.0) age = mod(max(age, 0.0), aLife.z);
  float a = age/max(aLife.y, 0.05);
  float on = step(0.0, a)*step(a, 1.0);
  float aa = clamp(a, 0.0, 1.0);
  vA = on*sin(3.14159*sqrt(aa))*(1.0 - aa)*0.5;
  vec3 p = position + vec3(0.9*aa, 0.25 + 1.3*sqrt(aa), 0.0)*aSize;
  vC = uSilt*(uKey*0.7 + uSky)*1.3;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  ${FOGV}
  vFogY = -0.3;
  gl_PointSize = on > 0.0 ? clamp(aSize*(0.6 + 2.2*sqrt(aa))*uPxScale/max(-mvPosition.z, 0.3), 2.0, 120.0) : 0.0;
}`;
const PUFF_FRAG = /* glsl */`
varying float vA; varying vec3 vC;
${G.fogParsFrag}
void main(){
  vec2 q = gl_PointCoord - 0.5; float d = dot(q, q)*4.0;
  float s = 1.0 - smoothstep(0.0, 1.0, d); s *= s;
  float al = s*vA;
  gl_FragColor = vec4(wfgFog(vC)*al, al);
}`;

// ---------------------------------------------------------------- 3. geometry accumulator and builders
class Geo {      // typed arrays that double when full (plain arrays with push cost a tenth of the build)
  constructor(cap = 2048) { this.cap = cap; this.p = new Float32Array(cap * 3); this.c = new Float32Array(cap * 3); this.a = new Float32Array(cap * 4); this.b = new Float32Array(cap * 4); this.i = new Uint32Array(cap * 6); this.ni = 0; this.n = 0; this.col = [1, 1, 1]; this.A = [0, 0, 0, 0]; this.B = [0, 0, 0, 0]; }
  v(x, y, z) {
    if (this.n === this.cap) { const cap = this.cap * 2; for (const [k, sz] of [['p', 3], ['c', 3], ['a', 4], ['b', 4]]) { const t = new Float32Array(cap * sz); t.set(this[k]); this[k] = t; } this.cap = cap; }
    const n = this.n, n3 = n * 3, n4 = n * 4, p = this.p, c = this.c, a = this.a, b = this.b, col = this.col, A = this.A, B = this.B;
    p[n3] = x; p[n3 + 1] = y; p[n3 + 2] = z; c[n3] = col[0]; c[n3 + 1] = col[1]; c[n3 + 2] = col[2];
    a[n4] = A[0]; a[n4 + 1] = A[1]; a[n4 + 2] = A[2]; a[n4 + 3] = A[3]; b[n4] = B[0]; b[n4 + 1] = B[1]; b[n4 + 2] = B[2]; b[n4 + 3] = B[3];
    return this.n++;
  }
  tri(a, b, c) { let i = this.i; const k = this.ni; if (k + 3 > i.length) { const t = new Uint32Array(i.length * 2); t.set(i); this.i = i = t; } i[k] = a; i[k + 1] = b; i[k + 2] = c; this.ni = k + 3; }
  build(o = {}) {
    const g = new THREE.BufferGeometry(), n = this.n;
    g.setAttribute('position', new THREE.BufferAttribute(this.p.subarray(0, n * 3), 3));      // views, not copies
    if (o.color !== false) g.setAttribute('color', new THREE.BufferAttribute(this.c.subarray(0, n * 3), 3));
    if (o.a) g.setAttribute(o.a, new THREE.BufferAttribute(this.a.subarray(0, n * 4), 4));
    if (o.b) {
      const size = o.bSize || 4, src = this.b;
      if (size === 4) g.setAttribute(o.b, new THREE.BufferAttribute(src.subarray(0, n * 4), 4));
      else { const arr = new Float32Array(n * size); if (size === 1) for (let k = 0; k < n; k++) arr[k] = src[k * 4]; else for (let k = 0; k < n; k++) for (let j = 0; j < size; j++) arr[k * size + j] = src[k * 4 + j]; g.setAttribute(o.b, new THREE.BufferAttribute(arr, size)); }
    }
    const idx = this.i.subarray(0, this.ni);
    g.setIndex(n > 65535 ? new THREE.BufferAttribute(idx.slice(), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
    return g;
  }
}
const _t = new THREE.Vector3(), _u = new THREE.Vector3(), _w = new THREE.Vector3(), _q = new THREE.Vector3();
// vertex normals exactly as BufferGeometry.computeVertexNormals makes them (area-weighted face normals, summed), with a
// pause every few thousand triangles so that a big mesh never holds the page
async function normalsY(geo, pause) {
  const P = geo.attributes.position.array, I = geo.index.array, N = new Float32Array(P.length);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[c] - P[b], uy = P[c + 1] - P[b + 1], uz = P[c + 2] - P[b + 2], vx = P[a] - P[b], vy = P[a + 1] - P[b + 1], vz = P[a + 2] - P[b + 2];
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
    N[a] += x; N[a + 1] += y; N[a + 2] += z; N[b] += x; N[b + 1] += y; N[b + 2] += z; N[c] += x; N[c + 1] += y; N[c + 2] += z;
    if (t % 9000 === 8997) await pause();
  }
  for (let v = 0; v < N.length; v += 3) { const l = Math.hypot(N[v], N[v + 1], N[v + 2]) || 1; N[v] /= l; N[v + 1] /= l; N[v + 2] /= l; if (v % 60000 === 59997) await pause(); }
  geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
}
// a tube through pts (Vector3[]): rad(i) radius, o.onRing(i), o.onVert(i, j, around), o.seam (no wrap, so an
// "around" attribute can run 0..1), o.ref (which way angle 0 points), o.cap (length of the pointed end cap)
function tube(g, pts, rad, sides, o = {}) {
  const n = pts.length, per = o.seam ? sides + 1 : sides, base = g.n;
  _t.subVectors(pts[1], pts[0]).normalize();
  if (o.ref) _u.copy(o.ref); else _u.set(Math.abs(_t.y) < 0.9 ? 0 : 1, Math.abs(_t.y) < 0.9 ? 1 : 0, 0);
  for (let i = 0; i < n; i++) {
    _t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]).normalize();
    _u.addScaledVector(_t, -_u.dot(_t)); if (_u.lengthSq() < 1e-8) _u.set(_t.y, -_t.x, 0.01); _u.normalize();
    _w.crossVectors(_t, _u);
    if (o.onRing) o.onRing(i);
    const r = rad(i);
    for (let j = 0; j < per; j++) {
      const ang = (j / sides) * TAU, rr = o.rf ? r * o.rf(i, ang) : r, cs = Math.cos(ang) * rr, sn = Math.sin(ang) * rr;
      if (o.onVert) o.onVert(i, j, j / sides);
      g.v(pts[i].x + _u.x * cs + _w.x * sn, pts[i].y + _u.y * cs + _w.y * sn, pts[i].z + _u.z * cs + _w.z * sn);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * per + j, b = base + i * per + (o.seam ? j + 1 : (j + 1) % sides), c = a + per, d = b + per;
    g.tri(a, b, c); g.tri(b, d, c);
  }
  if (o.cap !== undefined) {
    if (o.onRing) o.onRing(n - 1);
    if (o.onVert) o.onVert(n - 1, 0, 0.5);
    const e = pts[n - 1], tip = g.v(e.x + _t.x * o.cap, e.y + _t.y * o.cap, e.z + _t.z * o.cap), r0 = base + (n - 1) * per;
    for (let j = 0; j < sides; j++) g.tri(r0 + j, r0 + (o.seam ? j + 1 : (j + 1) % sides), tip);
  }
  return base;
}
// a lathe about +Y at centre c: prof = [[r, y], ...]; o.rf(k, ang) radius multiplier; o.onRing(k)
function lathe(g, c, prof, sides, o = {}) {
  const base = g.n, n = prof.length, ca = Math.cos(o.yaw || 0), sa = Math.sin(o.yaw || 0), sx = o.sx || 1, sz = o.sz || 1;
  for (let k = 0; k < n; k++) {
    if (o.onRing) o.onRing(k);
    for (let j = 0; j < sides; j++) {
      const ang = (j / sides) * TAU, r = prof[k][0] * (o.rf ? o.rf(k, ang) : 1), lx = Math.cos(ang) * r * sx, lz = Math.sin(ang) * r * sz;
      g.v(c.x + lx * ca - lz * sa, c.y + prof[k][1], c.z + lx * sa + lz * ca);
    }
  }
  for (let k = 0; k < n - 1; k++) for (let j = 0; j < sides; j++) {
    const a = base + k * sides + j, b = base + k * sides + (j + 1) % sides, cc = a + sides, d = b + sides;
    g.tri(a, cc, b); g.tri(b, cc, d);
  }
  if (o.top !== undefined) { if (o.onRing) o.onRing(n - 1); const tip = g.v(c.x, c.y + o.top, c.z), r0 = base + (n - 1) * sides; for (let j = 0; j < sides; j++) g.tri(r0 + j, tip, r0 + (j + 1) % sides); }
  return base;
}

// bubblegum coral: a thick, knobby fan of branches with club tips. o: { depth, sides, col (Color), sway, trop (Vector3),
// smooth (rounded, knobbly branches for a tree seen close; the skeleton and its rng draws are the same either way),
// clear(point, radius) -> true where a branch would come too near the lens's line: the branch is cut short there and
// ends in a club (or is left out if not even its first joint is clear), and nothing grows from it. Every branch is
// still rolled in full, so the draws from rng are the same wherever the tree stands. o.off: roll it, draw nothing.
// o.twig: the sides of the end twigs of a plain (not smooth) tree, where fewer than o.sides will do. }
function coralTree(g, rng, basePos, dir0, H, o) {
  const fanN = new THREE.Vector3(rng.range(-1, 1), rng.range(-0.15, 0.15), rng.range(-1, 1)).normalize();
  if (o.fan) fanN.copy(o.fan);
  const col = o.col, pale = col.clone().lerp(new THREE.Color(0.75, 0.62, 0.62), 0.45);
  g.B = [0, 0, 0, 0];
  const branch = (p, d, len, r, depth, dead) => {
    let segs = depth === 0 ? 5 : 4; const pts = [p.clone()], rads = [r], q = p.clone(), dd = d.clone();
    for (let s = 1; s <= segs; s++) {
      dd.x += rng.gauss() * 0.16; dd.y += rng.gauss() * 0.16; dd.z += rng.gauss() * 0.16;
      dd.addScaledVector(o.trop, 0.14).addScaledVector(fanN, -dd.dot(fanN) * 0.7).normalize();
      q.addScaledVector(dd, len / segs); pts.push(q.clone());
      rads.push(r * lerp(1, 0.76, s / segs) * (1 + 0.26 * (rng() - 0.5)));
    }
    let terminal = depth >= o.depth, cut = false;
    if (!dead && o.clear) { let i = 1; while (i <= segs && !o.clear(pts[i], rads[i])) i++; if (i <= segs) { cut = true; if (i < 3) dead = true; else { segs = i - 1; pts.length = i; rads.length = i; terminal = true; } } }
    if (terminal) rads[segs] *= 1.3;
    const end = pts[segs];
    if (o.tips && !dead) {            // perches for squat lobsters: club tips and forks [x, y, z, radius, sway reach, pivot x, y, z] (the reach as ringCol below sets it)
      const e = terminal ? end : p, rr = terminal ? rads[segs] : r * 1.25;
      if (terminal || depth >= 1) o.tips.push([e.x, e.y, e.z, rr, o.sway * Math.pow(clamp(e.distanceTo(basePos) / H, 0, 1.2), 1.7), basePos.x, basePos.y, basePos.z]);
    }
    const ringCol = (pt, tp) => {
      const hf = clamp(pt.distanceTo(basePos) / H, 0, 1.2), sh = 0.55 + 0.45 * smoothstep(0, 0.5, hf);
      g.col = [lerp(col.r, pale.r, tp) * sh, lerp(col.g, pale.g, tp) * sh, lerp(col.b, pale.b, tp) * sh];
      g.A = [basePos.x, basePos.y, basePos.z, o.sway * Math.pow(hf, 1.7)];
    };
    if (dead) { /* rolled, not drawn */ } else if (o.smooth) {
      // the same skeleton, drawn round: a curve through the joints, twice the rings, the radius swelling and narrowing
      // in knobs, and (on a twig) a club tip closed by a dome instead of a point. No draw from rng here.
      // (twigs take fewer rings and sides than the trunk: they are a tenth of its width)
      const cv = new THREE.CatmullRomCurve3(pts, false, 'centripetal'), NS = terminal ? segs + 2 : segs * 2, sp = [], sr = [], ph = (p.x * 12.9898 + p.y * 78.233 + p.z * 37.719) % TAU;
      const sides = depth === 0 ? o.sides : depth === 1 ? o.sides - 1 : terminal ? Math.max(5, o.sides - 3) : o.sides - 2;
      for (let i = 0; i <= NS; i++) {
        const f = (i / NS) * segs, k = Math.min(segs - 1, Math.floor(f)), e = f - k, m = e * e * (3 - 2 * e);
        sp.push(cv.getPoint(i / NS)); sr.push(lerp(rads[k], rads[k + 1], m) * (1 + 0.11 * Math.sin(f * 3.8 + ph) + 0.05 * Math.sin(f * 8.6 + ph * 2.3)));
      }
      if (terminal) {
        const tg = sp[NS].clone().sub(sp[NS - 1]).normalize(), re = sr[NS];
        sp.push(sp[NS].clone().addScaledVector(tg, re * 0.55), sp[NS].clone().addScaledVector(tg, re * 0.95)); sr.push(re * 0.86, re * 0.5);
      }
      const last = sp.length - 1;
      tube(g, sp, (i) => sr[i], sides, { cap: sr[last] * (terminal ? 0.45 : 0.8), onRing: (i) => ringCol(sp[i], terminal ? Math.min(1, i / NS) * 0.5 : 0) });
    } else tube(g, pts, (i) => rads[i], terminal && o.twig ? o.twig : o.sides, { cap: rads[segs] * 0.8, onRing: (i) => ringCol(pts[i], terminal ? (i / segs) * 0.5 : 0) });
    if (depth >= o.depth) return;
    if (cut) dead = true;
    const nb = depth === 0 ? 3 : (rng.chance(0.35) ? 3 : 2);
    for (let k = 0; k < nb; k++) {
      const ang = (k - (nb - 1) / 2) * rng.range(0.6, 0.85) + rng.gauss() * 0.12;
      const nd = dd.clone().applyAxisAngle(fanN, ang).addScaledVector(fanN, rng.gauss() * 0.14).normalize();
      branch(q, nd, len * rng.range(0.6, 0.82), rads[rads.length - 1] * 0.8, depth + 1, dead);
    }
    if (depth < o.depth - 1 || rng.chance(0.5)) {      // a side branch from the middle
      const m = pts[2], nd = dd.clone().applyAxisAngle(fanN, rng.sign() * rng.range(0.8, 1.2)).normalize();
      branch(m, nd, len * rng.range(0.45, 0.6), rads[Math.min(2, rads.length - 1)] * 0.68, Math.max(depth + 1, o.depth), dead);
    }
  };
  branch(basePos, dir0.clone().normalize(), H * 0.42, H * (o.thick || 0.05), 0, !!o.off);
}
// yellow vase and ruffle sponges; cushion = a low closed lens with a rounded underside (for the tops of bones);
// cushion 2 = a small round bun with a dark mouth on top. A vase stands on a pinched foot, swells, and flares to a
// round lip (nine sides, the lobes shallow), with the inside turned down into a throat that darkens to the bottom.
function sponge(g, rng, c, s, col, cushion = false) {
  const ruff = rng.chance(0.45) || cushion, ph = rng() * TAU, lobes = rng.int(4, 7), yaw = rng() * TAU;
  const prof = cushion === 2 ? [[5, 2], [42, 0], [58, 16], [62, 40], [52, 66], [34, 82], [19, 88], [13, 84], [8, 70]].map(([r, y]) => [r / 100, y / 100])      // a small round bun, taller than it is wide; the last three rings are its mouth
    : cushion ? [[0.06, 0.04], [0.62, 0.0], [0.93, 0.17], [1.0, 0.38], [0.84, 0.55], [0.5, 0.63], [0.12, 0.6]]
    : ruff ? [[0.2, 0], [0.26, 0.1], [0.5, 0.3], [0.9, 0.62], [1.05, 0.8], [1.0, 0.84], [0.62, 0.54], [0.12, 0.14]]
    : [[0.2, 0], [0.17, 0.1], [0.3, 0.42], [0.48, 0.86], [0.63, 1.13], [0.72, 1.22], [0.66, 1.25], [0.42, 0.86], [0.09, 0.22]];
  const P = prof.map(([r, y]) => [r * s, y * s]), lip = cushion === 2 ? 6 : cushion ? 99 : 5, n = P.length;
  g.B = [1, 0, 0, 0];
  lathe(g, c, P, 9, { yaw, sx: 1, sz: rng.range(0.75, 1), rf: (k, ang) => 1 + (cushion ? 0.12 : ruff ? 0.2 : 0.035) * Math.sin(ang * lobes + ph) * (cushion ? (k > lip ? 0 : 1) : Math.min(1, P[k][1] / s)),
    onRing: (k) => {
      const out = Math.min(1, k / Math.max(1, Math.min(lip, n - 1) - 1)), deep = k > lip ? (k - lip) / (n - 1 - lip) : 0;      // deep: 0 at the lip, 1 at the bottom of the throat
      const sh = cushion === 2 ? (k > lip ? 0.5 - 0.34 * deep : 0.46 + 0.54 * Math.min(1, k / 3)) : cushion ? 0.46 + 0.54 * Math.min(1, k / 3) : k > lip ? 0.62 - 0.44 * deep : k === lip ? 1.06 : 0.58 + 0.42 * out;
      g.col = [col.r * sh, col.g * sh * (k > lip ? 0.94 : 1), col.b * sh * 0.9]; g.A = [c.x, c.y, c.z, (!cushion && Math.abs(k - lip) <= 1) ? 0.05 * s : 0]; } });
}
// white plumose anemone: a short pale stalk under a round white ball of plume twice its width, with a short frill of
// tentacles round it that trembles in the gust
function anemone(g, rng, c, s, nrm) {
  const ax = nrm.clone().normalize(), ex = new THREE.Vector3(Math.abs(ax.y) < 0.9 ? 0 : 1, Math.abs(ax.y) < 0.9 ? 1 : 0, 0).cross(ax).normalize(), ez = new THREE.Vector3().crossVectors(ax, ex);
  const P = (r, a, h) => _q.copy(c).addScaledVector(ex, Math.cos(a) * r).addScaledVector(ez, Math.sin(a) * r).addScaledVector(ax, h);
  g.B = [2, 0, 0, 0];
  const base = g.n, tone = rng.range(0.92, 1.04), hgt = s * rng.range(0.28, 0.40), rb = s * 0.31, hc = hgt + rb * 0.75, a0 = rng() * TAU;
  for (let k = 0; k < 2; k++) for (let j = 0; j < 5; j++) {
    const sh = k ? 0.72 : 0.48; g.col = [0.80 * tone * sh, 0.80 * tone * sh, 0.76 * tone * sh]; g.A = [c.x, c.y, c.z, 0];
    P(s * (k ? 0.14 : 0.18), (j / 5) * TAU, k * hgt); g.v(_q.x, _q.y, _q.z);
  }
  for (let j = 0; j < 5; j++) { const a = base + j, b = base + (j + 1) % 5; g.tri(a, a + 5, b); g.tri(b, a + 5, b + 5); }
  const b0 = g.n;
  // the ball: three rings of seven and a cap, each ring turned half a step from the one below (a round head, shaded darker underneath)
  for (let k = 0; k < 3; k++) for (let j = 0; j < 7; j++) {
    const el = [-0.62, -0.04, 0.58][k], sh = [0.58, 0.76, 0.88][k]; g.col = [sh * tone, sh * tone, sh * 0.97 * tone]; g.A = [c.x, c.y, c.z, 0.03 * s];
    P(rb * Math.cos(el) * (0.94 + 0.12 * rng()), a0 + ((j + 0.5 * k) / 7) * TAU, hc + rb * Math.sin(el)); g.v(_q.x, _q.y, _q.z);
  }
  g.col = [0.90 * tone, 0.90 * tone, 0.87 * tone]; g.A = [c.x, c.y, c.z, 0.05 * s];
  P(0, 0, hc + rb * 1.0); const cap = g.v(_q.x, _q.y, _q.z);
  for (let k = 0; k < 2; k++) for (let j = 0; j < 7; j++) { const a = b0 + k * 7 + j, b = b0 + k * 7 + (j + 1) % 7; g.tri(a, a + 7, b); g.tri(b, a + 7, b + 7); }
  for (let j = 0; j < 7; j++) g.tri(b0 + 14 + j, cap, b0 + 14 + (j + 1) % 7);
  const nT = 8;
  for (let k = 0; k < nT; k++) {
    const a = a0 + (k / nT) * TAU + rng() * 0.35, el = rng.range(-0.1, 0.95), len = s * rng.range(0.15, 0.25), da = 0.5, r1 = rb * 0.8;
    g.col = [0.70 * tone, 0.71 * tone, 0.69 * tone]; g.A = [c.x, c.y, c.z, 0.03 * s];
    P(r1, a - da, hc + rb * 0.1); const i0 = g.v(_q.x, _q.y, _q.z);
    P(r1, a + da, hc + rb * 0.1); const i1 = g.v(_q.x, _q.y, _q.z);
    g.col = [0.88 * tone, 0.88 * tone, 0.85 * tone]; g.A = [c.x, c.y, c.z, 0.12 * s];
    P(rb + Math.cos(el) * len, a, hc + rb * 0.1 + Math.sin(el) * len); const i2 = g.v(_q.x, _q.y, _q.z);
    g.tri(i0, i1, i2);
  }
}
// a brooding octopus: a lumpy mantle, eight arms curled back over it unevenly (around = 0.5 is the suckered side,
// each arm with its own reach, sideways wander and curl of the tip), two hooded eyes (aO.y = height on the eyeball)
function octopus(g, rng, c, s, yaw) {
  const phase = rng() * TAU, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const R = (x, y, z) => new THREE.Vector3(c.x + x * cy - z * sy, c.y + y, c.z + x * sy + z * cy);
  g.A = [c.x, c.y, c.z, phase];
  const lump = [rng.range(0.9, 1.1), rng.range(0.9, 1.1), rng() * TAU];
  const prof = [[0.55, -0.38], [0.80, -0.16], [0.86, 0.12], [0.76, 0.40], [0.56, 0.64], [0.30, 0.82]].map(([r, y]) => [r * s * 0.8, y * s * 0.9 + s * 0.12]);
  g.B = [0, 0, 0, 0];
  lathe(g, c, prof, 12, { yaw, sz: 1.12 * lump[0], sx: 0.94 * lump[1], top: s * 0.93, rf: (k, ang) => 1 + 0.08 * Math.sin(ang * 3 + lump[2] + k) + 0.05 * Math.sin(ang * 7 + k * 1.9 + lump[2] * 2) + 0.03 * Math.sin(ang * 5 - k * 2.6) });
  for (let a = 0; a < 8; a++) {
    const phi = (a + 0.5) / 8 * TAU + rng.range(-0.2, 0.2), reach = rng.range(0.75, 1.25), lift = rng.range(0.8, 1.2), wig = rng.range(-0.9, 0.9), aph = rng() * TAU, curl = rng.range(-1, 1);
    const ctrl = [[0.42, -0.26], [0.92, -0.36], [1.16, -0.10], [1.08, 0.30], [0.84, 0.58], [0.60, 0.66], [0.50 + 0.14 * curl, 0.52 - 0.10 * curl], [0.58 + 0.22 * curl, 0.38 - 0.06 * Math.abs(curl)]];
    const cv = new THREE.CatmullRomCurve3(ctrl.map(([r, y], i) => { const f = i / 7, ph2 = phi + wig * f * f + 0.5 * curl * Math.max(0, f - 0.7); return R(Math.cos(ph2) * r * s * reach, y * s * lift, Math.sin(ph2) * r * s * reach); }));
    const N = 8, pts = cv.getPoints(N);
    g.B = [1, 0, 0, aph];
    tube(g, pts, (i) => s * lerp(0.17, 0.032, Math.pow(i / N, 0.8)) * (1 + 0.10 * Math.sin(i * 1.9 + aph)), 6, { seam: true, ref: new THREE.Vector3(0, 1, 0), cap: s * 0.05,
      onVert: (i, j, ar) => { g.B = [1, i / N, ar, aph]; } });
  }
  for (let e = -1; e <= 1; e += 2) {
    const ec = R(e * 0.40 * s, 0.50 * s, 0.50 * s), base = g.n, er = 0.155 * s;
    for (let k = 0; k < 3; k++) for (let j = 0; j < 6; j++) { const el = -0.5 + k * 0.6, a = (j / 6) * TAU; g.B = [2, Math.sin(el), 0, 0]; g.v(ec.x + Math.cos(a) * Math.cos(el) * er, ec.y + Math.sin(el) * er, ec.z + Math.sin(a) * Math.cos(el) * er); }
    g.B = [2, 1, 0, 0];
    const top = g.v(ec.x, ec.y + er, ec.z);
    for (let k = 0; k < 2; k++) for (let j = 0; j < 6; j++) { const a = base + k * 6 + j, b = base + k * 6 + (j + 1) % 6; g.tri(a, a + 6, b); g.tri(b, a + 6, b + 6); }
    for (let j = 0; j < 6; j++) g.tri(base + 12 + j, top, base + 12 + (j + 1) % 6);
  }
}

// base meshes for the instanced animals (unit size; +Z is forward for the crab, +X for the fish)
function crabGeo() {
  const g = new Geo(), O = new THREE.Vector3(0, 0, 0);
  g.A = [0, 0, 0, 0];
  const shell = (k) => { const sh = [0.5, 0.82, 1.0, 0.92][k]; g.col = [sh, sh * 0.97, sh * 0.94]; };
  lathe(g, O, [[0.30, -0.10], [0.50, 0.0], [0.38, 0.13], [0.16, 0.19]], 8, { sz: 0.78, top: 0.2, onRing: shell, rf: (k, ang) => 1 + 0.08 * Math.cos(ang * 2) + 0.05 * Math.sin(ang * 5) });
  for (let sd = -1; sd <= 1; sd += 2) {
    for (let k = 0; k < 4; k++) {
      const z = (k - 1.7) * 0.2, ph = (k + (sd > 0 ? 0 : 1)) * Math.PI;
      const pts = [new THREE.Vector3(sd * 0.36, 0.0, z), new THREE.Vector3(sd * 0.78, 0.24, z * 1.7 - 0.03), new THREE.Vector3(sd * 1.06, -0.30, z * 2.1 - 0.06)];
      tube(g, pts, (i) => [0.065, 0.05, 0.016][i], 3, { onRing: (i) => { g.A = [1, ph, i * 0.5, 0]; const sh = [0.8, 0.95, 0.7][i]; g.col = [sh, sh * 0.96, sh * 0.92]; } });
    }
    const cp = [new THREE.Vector3(sd * 0.30, 0.02, 0.26), new THREE.Vector3(sd * 0.50, 0.08, 0.56), new THREE.Vector3(sd * 0.34, 0.06, 0.86)];
    tube(g, cp, (i) => [0.07, 0.085, 0.10][i], 4, { cap: 0.26, onRing: (i) => { g.A = [2, sd > 0 ? 0 : 1.7, i * 0.5, 0]; const sh = [0.85, 1, 1.05][i]; g.col = [sh, sh * 0.95, sh * 0.9]; } });
    g.A = [0, 0, 0, 0]; g.col = [0.05, 0.05, 0.06];                      // eye stalk
    const e0 = g.v(sd * 0.13, 0.13, 0.33), e1 = g.v(sd * 0.19, 0.13, 0.31), e2 = g.v(sd * 0.16, 0.25, 0.36), e3 = g.v(sd * 0.16, 0.12, 0.38);
    g.tri(e0, e1, e2); g.tri(e1, e3, e2); g.tri(e3, e0, e2);
  }
  const geo = g.build({ a: 'aAnim' }); geo.computeVertexNormals(); return geo;
}
function starGeo() {
  const g = new Geo();
  g.A = [0, 0, 0, 0]; g.col = [1, 0.95, 0.9];
  const c = g.v(0, 0.16, 0);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU, a1 = a + TAU / 10, a0 = a - TAU / 10;
    g.col = [0.62, 0.55, 0.5]; g.A = [0, 0, 0, 0];
    const v0 = g.v(Math.cos(a0) * 0.34, 0.0, Math.sin(a0) * 0.34), v1 = g.v(Math.cos(a1) * 0.34, 0.0, Math.sin(a1) * 0.34);
    g.col = [1, 0.95, 0.9]; g.A = [4, k * 1.3, 0.35, 0];
    const r = g.v(Math.cos(a) * 0.5, 0.15, Math.sin(a) * 0.5);
    g.col = [0.85, 0.8, 0.74]; g.A = [4, k * 1.3, 1, 0];
    const t = g.v(Math.cos(a) * 1.0, 0.03, Math.sin(a) * 1.0);
    g.tri(c, r, v0); g.tri(c, v1, r); g.tri(r, t, v0); g.tri(r, v1, t);
  }
  const geo = g.build({ a: 'aAnim' }); geo.computeVertexNormals(); return geo;
}
// a clam valve or a crumb of bone: a low ribbed dome with an off-centre boss, sitting in the silt on a dark apron
// (its contact shadow); the rings shade from the dark foot to the pale crown
function shellGeo() {
  const g = new Geo(), N = 6;
  g.A = [0, 0, 0, 0];
  const rings = [[1.34, 0.15, 0.07, 0], [1.0, 0.16, 0.20, 0], [0.80, 0.40, 0.80, 0.06]];
  for (let k = 0; k < rings.length; k++) {
    const [r, y, sh, off] = rings[k];
    for (let j = 0; j < N; j++) {
      const a = ((j + 0.5 * k) / N) * TAU, rr = r * (1 + 0.10 * Math.sin(a * 2 + 0.6)), s2 = sh * (k > 1 ? 0.9 + 0.1 * (j % 2) : 1);
      g.col = [s2, s2, s2 * 0.96]; g.v(Math.cos(a) * rr + off, y, Math.sin(a) * rr * 0.84);
    }
  }
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < N; j++) { const p = k * N + j, q = k * N + (j + 1) % N; g.tri(p, p + N, q); g.tri(q, p + N, q + N); }
  g.col = [1, 1, 0.97];
  const apex = g.v(0.16, 0.60, 0), r0 = (rings.length - 1) * N;
  for (let j = 0; j < N; j++) g.tri(r0 + j, apex, r0 + (j + 1) % N);
  const geo = g.build({ a: 'aAnim' }); geo.computeVertexNormals(); return geo;
}
// grenadier / ratfish: a big rounded head with a large eye, a body tapering to a long soft whip of a tail, a tall first
// dorsal and long low fins running to the tail tip, leaf-shaped pectoral wings (iDat.y sets their beat). Fins are
// rounded strips that darken to their edges; nothing is a flat card.
function fishGeo() {
  const g = new Geo();
  // t along the body (0 snout .. 1 tail tip), half height, half width, how much of the tail scull it takes
  const rows = [[0, 0.012, 0.012, 0], [0.018, 0.050, 0.040, 0], [0.05, 0.088, 0.066, 0], [0.10, 0.116, 0.084, 0], [0.17, 0.128, 0.088, 0.01], [0.25, 0.120, 0.078, 0.04], [0.34, 0.100, 0.060, 0.10],
    [0.44, 0.076, 0.042, 0.20], [0.56, 0.050, 0.026, 0.36], [0.68, 0.030, 0.014, 0.55], [0.82, 0.015, 0.007, 0.78], [1.0, 0.004, 0.003, 1.0]];
  const yOf = (t) => 0.012 * Math.sin(Math.min(t, 0.5) * Math.PI) - 0.02 * t * t;
  const pts = rows.map((r) => new THREE.Vector3(0.5 - r[0], yOf(r[0]), 0));
  tube(g, pts, (i) => rows[i][1], 10, { ref: new THREE.Vector3(0, 1, 0),
    rf: (i, ang) => { const c = Math.cos(ang), sn = Math.sin(ang), k = rows[i][2] / rows[i][1]; return k / Math.max(1e-4, Math.hypot(k * c, sn)) * (c < 0 ? 0.88 : 1); },
    onVert: (i, j, ar) => { const top = Math.cos(ar * TAU), t = rows[i][0], sh = (0.50 + 0.50 * smoothstep(0.45, -0.7, top)) * (1 - 0.22 * smoothstep(0.02, 0.0, t)) * (0.92 + 0.08 * Math.sin(t * 60)); g.col = [sh, sh, sh * 1.02]; g.A = [3, 0, rows[i][3], 0]; } });
  // a fin as a strip along the back or belly: n spans from x0 to x1, height h(f) (f = 0..1 along it), raked aft, pale
  // at the root and dark at the edge
  const strip = (x0, x1, sgn, n, h) => {
    const b0 = g.n;
    for (let i = 0; i <= n; i++) {
      const f = i / n, x = lerp(x0, x1, f), t = 0.5 - x; let k = 0; while (k < rows.length - 2 && rows[k + 1][0] < t) k++;
      const ff = clamp((t - rows[k][0]) / (rows[k + 1][0] - rows[k][0]), 0, 1), hb = lerp(rows[k][1], rows[k + 1][1], ff), wgt = lerp(rows[k][3], rows[k + 1][3], ff), hh = h(f);
      g.col = [0.50, 0.50, 0.52]; g.A = [3, 0, wgt, 0]; g.v(x, yOf(t) + sgn * hb * 0.92, 0);
      g.col = [0.24, 0.24, 0.27]; g.A = [3, 0, Math.min(1, wgt + 0.25 * hh), 0]; g.v(x - 0.5 * hh, yOf(t) + sgn * (hb * 0.92 + hh), 0);
    }
    for (let i = 0; i < n; i++) { const a = b0 + i * 2; g.tri(a, a + 1, a + 2); g.tri(a + 1, a + 3, a + 2); }
  };
  strip(0.30, 0.13, 1, 6, (f) => 0.115 * Math.pow(Math.sin(Math.PI * Math.min(1, f * 0.9 + 0.08)), 0.7) * (1 - 0.45 * f));      // first dorsal: tall, rounded
  strip(0.09, -0.5, 1, 9, (f) => 0.040 * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * f)), 0.5) * (1 - 0.8 * f));                 // second dorsal, to the tail tip
  strip(0.12, -0.5, -1, 9, (f) => 0.052 * Math.pow(Math.sin(Math.PI * (0.06 + 0.94 * f)), 0.5) * (1 - 0.8 * f));                // anal fin, to the tail tip
  for (let sd = -1; sd <= 1; sd += 2) {
    // pectoral wing: a leaf of five spans, widest a third of the way out, closing to a rounded tip
    const b0 = g.n, n = 5, rx = 0.25, ry = -0.035, rz = sd * 0.078, dx = -0.115, dy = -0.045, dz = sd * 0.20;
    for (let i = 0; i <= n; i++) {
      const f = i / n, w = 0.058 * Math.pow(Math.sin(Math.PI * (0.10 + 0.86 * f)), 0.8), cx = rx + dx * f, cyy = ry + dy * f, cz = rz + dz * f, sh = 0.62 - 0.30 * f;
      g.A = [5, 0, f * 0.35, 0];
      g.col = [sh * 0.7, sh * 0.7, sh * 0.74]; g.v(cx + w, cyy + w * 0.25, cz);
      g.col = [sh, sh, sh * 1.03]; g.v(cx, cyy, cz);
      g.col = [sh * 0.6, sh * 0.6, sh * 0.64]; g.v(cx - w, cyy - w * 0.25, cz);
    }
    for (let i = 0; i < n; i++) for (let q = 0; q < 2; q++) { const a = b0 + i * 3 + q; g.tri(a, a + 1, a + 3); g.tri(a + 1, a + 4, a + 3); }
    // the big eye: a dark dome in a pale ring
    const ex = 0.5 - 0.085, ey = 0.040, ez = sd * 0.074, e0 = g.n, EN = 8;
    g.A = [3, 0, 0, 0];
    for (let rI = 0; rI < 2; rI++) for (let j = 0; j < EN; j++) { const a = (j / EN) * TAU, rr = rI ? 0.026 : 0.040, sh = rI ? 0.03 : 0.95; g.col = [sh, sh, sh * (rI ? 1.2 : 0.95)]; g.v(ex + Math.cos(a) * rr, ey + Math.sin(a) * rr, ez + sd * (rI ? 0.016 : 0.004)); }
    g.col = [0.02, 0.02, 0.03]; const ec = g.v(ex, ey, ez + sd * 0.026);
    for (let j = 0; j < EN; j++) { const a = e0 + j, b = e0 + (j + 1) % EN; g.tri(a, b, a + EN); g.tri(b, b + EN, a + EN); g.tri(a + EN, b + EN, ec); }
  }
  const geo = g.build({ a: 'aAnim' }); geo.computeVertexNormals(); return geo;
}
function instanced(base, n, attrs) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index;
  for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4));
  g.instanceCount = n;
  return g;
}
const quatTo = (() => { const m = new THREE.Matrix4(), x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3(), q = new THREE.Quaternion();
  // orientation with local +Y along up and local +Z as near fwd as possible
  return (up, fwd) => { y.copy(up).normalize(); x.crossVectors(y, fwd); if (x.lengthSq() < 1e-6) x.set(1, 0, 0).cross(y); x.normalize(); z.crossVectors(x, y); m.makeBasis(x, y, z); return q.setFromRotationMatrix(m); }; })();

// a lofted swimmer along -X..+X (snout at +X): prof rows [t, halfWidth, dorsal, ventral, squareness, yOffset] in body
// lengths; fins: { t0, t1, ang (deg round the section: 90 top, -90 belly, 0 flank), side (+1/-1/0), out [x, y, z] in
// body lengths (tip offset from the root's middle), tipChord }
function bodyGeo(L, prof, rings, sides, fins) {
  const g = new Geo();
  const at = (t) => { let k = 0; while (k < prof.length - 2 && prof[k + 1][0] < t) k++; const a = prof[k], b = prof[k + 1], f = clamp((t - a[0]) / (b[0] - a[0]), 0, 1), s = f * f * (3 - 2 * f), m = lerp(f, s, 0.5);
    return [lerp(a[1], b[1], m) * L, lerp(a[2], b[2], m) * L, lerp(a[3], b[3], m) * L, lerp(a[4], b[4], m), lerp(a[5], b[5], m) * L]; };
  const surf = (t, ang, out) => { const [w, d, v, e, y0] = at(t), c = Math.cos(ang), s = Math.sin(ang), pc = Math.sign(c) * Math.pow(Math.abs(c), e), ps = Math.sign(s) * Math.pow(Math.abs(s), e);
    return out.set((0.5 - t) * L, y0 + (s > 0 ? d : v) * ps, w * pc); };
  const base = g.n, P = new THREE.Vector3();
  for (let i = 0; i <= rings; i++) {
    const t = Math.pow(i / rings, 1.15) * 0.999 + 0.0005;
    for (let j = 0; j < sides; j++) { const ang = (j / sides) * TAU; surf(t, ang, P); g.A = [t, Math.cos(ang), Math.sin(ang), 0]; g.v(P.x, P.y, P.z); }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) { const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides; g.tri(a, b, c); g.tri(b, d, c); }
  const A = new THREE.Vector3(), B = new THREE.Vector3(), M = new THREE.Vector3(), FN = new THREE.Vector3(), SP = new THREE.Vector3(), weld = [];
  for (const f of fins) {
    const sides2 = f.side === 0 ? [0] : [1, -1];
    for (const sd of sides2) {
      const ang = (f.side === 0 ? f.ang : (sd > 0 ? f.ang : 180 - f.ang)) * Math.PI / 180, nu = f.round ? 8 : 6, nv = f.round ? 7 : 5, starts = [];
      surf(f.t0, ang, A); surf(f.t1, ang, B); M.lerpVectors(A, B, 0.5);
      const tipX = M.x + f.out[0] * L, tipY = M.y + f.out[1] * L, tipZ = M.z + f.out[2] * L * (f.side === 0 ? 1 : sd), chord = (f.tipChord ?? 0.25) * (A.x - B.x);
      // two skins about the fin's own plane: a foil section (a blunt, rounded leading edge, fullest a third of the way
      // back, thinning to nothing at the trailing edge), full at the root, closing round the tip. Where the two skins
      // meet (front, back, tip) their normals are joined afterwards (weld), so the edge shades as a round, not a crease
      FN.set(A.x - B.x, A.y - B.y, A.z - B.z).cross(SP.set(tipX - M.x, tipY - M.y, tipZ - M.z)).normalize();
      for (let layer = 1; layer >= -1; layer -= 2) {
        const b0 = g.n; starts.push(b0);
        for (let v = 0; v <= nv; v++) for (let u = 0; u <= nu; u++) {
          const fu = u / nu, fv = v / nv, tt = lerp(f.t0, f.t1, fu); surf(tt, ang, P);
          const k = Math.pow(fv, 0.85), lead = 1 - 0.5 * fv * fv * (1 - fu), rnd = f.round ? Math.sqrt(Math.max(0, 1 - Math.pow(fv, 5))) : 1;
          // (scoop: the trailing edge is drawn in toward the root between root and tip, a soft concave curve; cup: the
          // fin is hollowed a little along its span, like a hand held flat)
          const tx = tipX + (0.5 - fu) * chord, xm = lerp(M.x, tipX, k * (1 - 0.25 * fv * fv)), x = xm + (lerp(P.x, tx, k * lead) - xm) * rnd + (f.scoop || 0) * (A.x - B.x) * Math.sin(Math.PI * Math.min(1, fv * 1.15)) * fu * fu,
            y = lerp(P.y, tipY, k) - (f.sag || 0) * L * Math.sin(Math.PI * fv) - (f.cup || 0) * L * Math.sin(Math.PI * fu) * Math.sin(Math.PI * Math.min(1, fv * 1.3)), z = lerp(P.z, tipZ, k);
          const th = (f.thick ?? 0.009) * L * 0.5 * layer * 2.6 * Math.sqrt(fu) * (1 - fu) * Math.pow(Math.max(0, 1 - fv * fv), 0.75);
          g.A = [clamp(0.5 - x / L, 0, 1), f.side === 0 ? 0 : sd, f.side === 0 ? Math.sign(Math.sin(ang)) : lerp(-0.62, -0.3, smoothstep(0, 0.5, fv)), 1 + fu]; g.v(x + FN.x * th, y + FN.y * th, z + FN.z * th);      // (a paired fin's third value runs from -0.62 at its root to -0.3: the shader pales the root's underside)
        }
        for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) { const a = b0 + v * (nu + 1) + u, b = a + 1, c = a + nu + 1, d = c + 1; if (layer > 0) { g.tri(a, b, c); g.tri(b, d, c); } else { g.tri(a, c, b); g.tri(b, c, d); } }
      }
      for (let v = 0; v <= nv; v++) for (let u = 0; u <= nu; u++) if (u === 0 || u === nu || v === nv) weld.push(starts[0] + v * (nu + 1) + u, starts[1] + v * (nu + 1) + u);
    }
  }
  const geo = g.build({ color: false, a: 'aB' }); geo.computeVertexNormals(); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), L);
  const N = geo.attributes.normal.array;
  for (let i = 0; i < weld.length; i += 2) {
    const a = weld[i] * 3, b = weld[i + 1] * 3; let x = N[a] + N[b], y = N[a + 1] + N[b + 1], z = N[a + 2] + N[b + 2]; const l = Math.hypot(x, y, z);
    if (l < 0.05) continue;
    x /= l; y /= l; z /= l;
    // (three parts the edge's own outward direction, one part each skin's: a round edge, not a knife)
    for (const o of [a, b]) { const nx = N[o] + 3 * x, ny = N[o + 1] + 3 * y, nz = N[o + 2] + 3 * z, m = Math.hypot(nx, ny, nz) || 1; N[o] = nx / m; N[o + 1] = ny / m; N[o + 2] = nz / m; }
  }
  return geo;
}
const SHARK_PROF = [[0, 0.006, 0.004, 0.004, 0.8, 0], [0.012, 0.063, 0.019, 0.015, 0.70, 0], [0.04, 0.094, 0.031, 0.024, 0.66, 0], [0.085, 0.107, 0.043, 0.033, 0.68, 0],
  [0.15, 0.105, 0.057, 0.045, 0.78, 0], [0.23, 0.096, 0.068, 0.062, 0.88, 0], [0.33, 0.088, 0.071, 0.068, 0.95, 0], [0.46, 0.073, 0.064, 0.061, 1, 0],
  [0.58, 0.055, 0.050, 0.047, 1, 0.002], [0.68, 0.039, 0.038, 0.033, 1, 0.006], [0.76, 0.027, 0.028, 0.023, 1, 0.012], [0.82, 0.018, 0.024, 0.018, 1, 0.020],
  [0.90, 0.007, 0.030, 0.024, 1, 0.050], [1.0, 0.002, 0.012, 0.014, 1, 0.105]];
const SHARK_FINS = [
  { t0: 0.25, t1: 0.365, ang: -28, side: 1, out: [-0.165, -0.07, 0.135], tipChord: 0.10, sag: 0.012, thick: 0.024, round: 1, scoop: 0.2, cup: 0.007 },      // pectorals: swept, a little bowed and cupped, a thick rounded root thinning to a soft trailing edge and a rounded tip
  { t0: 0.665, t1: 0.74, ang: 90, side: 0, out: [-0.055, 0.05, 0], tipChord: 0.3 },                          // the one dorsal, far back
  { t0: 0.545, t1: 0.625, ang: -50, side: 1, out: [-0.045, -0.03, 0.036], tipChord: 0.22, sag: 0.004, thick: 0.02, round: 1, scoop: 0.16, cup: 0.004 },      // pelvics: small rounded paddles, thick at the root
  { t0: 0.715, t1: 0.775, ang: -90, side: 0, out: [-0.04, -0.03, 0], tipChord: 0.3 },                        // anal
  { t0: 0.83, t1: 0.905, ang: -90, side: 0, out: [-0.02, -0.055, 0], tipChord: 0.45 },                       // lower tail lobe
];
const WHALE_PROF = [[0, 0.004, 0.003, 0.003, 0.9, 0], [0.03, 0.026, 0.014, 0.022, 0.85, 0], [0.10, 0.052, 0.030, 0.050, 0.85, 0], [0.25, 0.066, 0.050, 0.070, 0.92, 0],
  [0.42, 0.064, 0.056, 0.060, 1, 0], [0.62, 0.044, 0.046, 0.040, 1, 0], [0.80, 0.020, 0.024, 0.020, 1, 0], [0.93, 0.009, 0.011, 0.011, 1, 0], [1.0, 0.003, 0.003, 0.003, 1, 0]];
const WHALE_FINS = [
  { t0: 0.27, t1: 0.33, ang: -35, side: 1, out: [-0.07, -0.03, 0.10], tipChord: 0.2 },
  { t0: 0.74, t1: 0.79, ang: 90, side: 0, out: [-0.03, 0.022, 0], tipChord: 0.3 },
  { t0: 0.895, t1: 0.995, ang: 0, side: 1, out: [-0.075, 0, 0.125], tipChord: 0.07, thick: 0.006 },      // swept flukes, a notch between them
];

// ---------------------------------------------------------------- 4. the world
export default {
  id: 'whale-fall-garden',
  name: 'The Bone Garden',
  category: 'ocean',
  weirdness: 0.15,
  media: ['underwater'],
  async build(ctx) {
    const rng = ctx.rng, NZ = ctx.noise;
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = clamp(vary.density ?? 1, 0.7, 1.3), densG = Math.min(dens, 1.05);      // densG: the trees and sponges stop multiplying past 1.05 (the triangle budget)
    const scene = new THREE.Scene();
    const moodName = pickMood(rng.fork('sea'), vary.hour || 'any'), mood = MOODS[moodName];
    const castR = rng.fork('cast'), scarlet = castR.chance(0.4), ratfish = castR.chance(0.45);
    const R = rng.fork('garden');
    const ageRoll = rng.fork('age')(), age = ageRoll < 0.6 ? 'crimson' : ageRoll < 0.8 ? 'white' : 'reef';      // the age of the fall
    scene.fog = new THREE.FogExp2(mood.fog, mood.density);
    const pal = PALETTE.map((h) => new THREE.Color(h));

    // ---- the hero, at the origin: world space is its local space
    const hero = await buildHero(ctx, { palette: PALETTE, bed: true, demo: false, sparks: mood.sparks, age });
    scene.add(hero.object);
    const U = hero.uniforms, A = hero.anchors, gh = hero.groundFast || hero.groundHeight;      // the bed's height (read from the hero's grid inside the bed)
    const leanA = mood.lean * Math.PI / 180;
    const keyDir = new THREE.Vector3(Math.sin(leanA), Math.cos(leanA), mood.leanZ * Math.sin(leanA)).normalize();
    hero.setLight({ dir: keyDir, key: mood.key, keyScale: mood.keyScale, sky: mood.sky, skyScale: mood.skyScale, bounce: mood.bounce, bounceScale: mood.bounceScale, shadow: mood.shadow });
    const glowC = new THREE.Color(mood.glow).multiplyScalar(mood.glowGain), upC = new THREE.Color(mood.fog).lerp(glowC, mood.up);      // the water overhead
    { const low = new THREE.Color(mood.low); U.uFogLow.value.set(low.r, low.g, low.b, 1); U.uFogUp.value.set(upC.r, upC.g, upC.b, 1); }
    { const sA = A.straightStart, sB = A.portalSeat.position; U.uPale.value.set(lerp(sA.x, sB.x, 0.42), lerp(sA.z, sB.z, 0.42), 36, 0.8); }      // pale silt on the shoulder under the last straight
    // the shade of rock (LIT's wfgShade): the scene value that the grade shows as the mood's own shadow tint. The grade
    // (POST below) multiplies by the exposure, runs the filmic curve (fit, of the value over 0.6), turns the contrast
    // about one half and adds half the shadow tint in the darks: so the tint is shown where the curve gives
    // (tint/2 - 1/2)/contrast + 1/2, and the scene value is the curve's inverse of that (found by halving), channel by
    // channel. One shade for the rock of this file (the ground's and the garden's: GROUND_FRAG, STATIC_FRAG), at every
    // spot and every clock; it reads no eye. The hero's own rock (the parts file) does not take it.
    const CONTRAST = 1.06;
    { const fit = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081), tint = new THREE.Color(mood.shadowTint);
      const inv = (t) => { const want = (0.5 * t - 0.5) / CONTRAST + 0.5; let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (fit(m) < want) lo = m; else hi = m; } return lo * 0.6 / mood.exposure; };
      U.uShade = { value: new THREE.Vector3(inv(tint.r), inv(tint.g), inv(tint.b)) }; }
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const mat = (vs, fs, extra = {}, o = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U, ...extra }, vertexShader: vs, fragmentShader: fs, fog: true, ...o });
    await ctx.yield();

    // ---- THE PATH. Entry over the terrace's north side, level and due east along the cliff (the wall 22 u to port, its
    // overhang above; Z_IN, H_IN), LEVEL u of level run, the coral tree on its prow ahead to port. Abeam of the rib cage
    // (X_FLANK) the line tips over, rounded over 24 u of run (RND), into ONE descending right-hand arc: on east along
    // the wall, then round the tail in the turn the geometry gives (the circle that touches the entry line and comes
    // out at the join along the keel: its radius is about 30 u), falling an even 27.3 degrees (DIVE; the curve through
    // the stations never passes 28) until it eases out, the slope running down in a straight ramp to EASE_END over the
    // last EASE u of run, onto the keel at the join. From the join on the route is the hero's anchors.flyThrough (keel,
    // nave, palate, arch, 60 u straight at 35 degrees to anchors.portalSeat). The route has the length these points
    // give it; nothing is tuned to a length.
    const fly = A.flyThrough, JOIN = 5, G = fly[JOIN];
    const keel = new THREE.Vector3().subVectors(fly[JOIN], fly[JOIN + 1]).setY(0).normalize();
    const sS = A.straightStart, pEnd = A.portalSeat.position;
    const Z_IN = -60, H_IN = 70, X_FLANK = -16, LEVEL = 62;
    const DIVE = Math.tan(27.3 * Math.PI / 180), EASE_END = 0.11, EASE = [26, 70], RND = [-6, 18];
    // the low run's last station, 6.5 u before the join and 0.7 u over it: it sets the curve through the join
    const Q0 = new THREE.Vector3(G.x + (0.85 * keel.x + 0.15 * Math.SQRT1_2) * 6.5, G.y + 0.7, G.z + (0.85 * keel.z - 0.15 * Math.SQRT1_2) * 6.5);
    const arc = (() => {
      let ex = Q0.x - G.x, ez = Q0.z - G.z; const el = Math.hypot(ex, ez) || 1; ex /= el; ez /= el;      // the way back along the keel at the join
      const R = (Q0.z - Z_IN) / (1 + ex), cx = Q0.x + R * ez, cz = Q0.z - R * ex, TH = (Math.atan2(-ez, -ex) + TAU) % TAU;      // the turn: radius, centre, angle turned (about 160 to 190 degrees with the tail's bow)
      // r = run (distance in plan) from where the line would tip over if it were not rounded. The tip stands abeam of the
      // rib cage; it moves west or east only as far as the ease-out needs to stay between EASE[0] and EASE[1] u long.
      const r0 = (RND[0] + RND[1]) / 2, easeOf = (rEnd) => (DIVE * (rEnd - r0) - (H_IN - Q0.y)) / (0.5 * (DIVE - EASE_END));
      let xTip = X_FLANK, E = easeOf(cx - xTip + R * TH);
      const Ec = clamp(E, EASE[0], EASE[1]); xTip += (E - Ec) * 0.5 * (DIVE - EASE_END) / DIVE; E = Ec;
      const rTop = cx - xTip, rEnd = rTop + R * TH, rF = rEnd - E, hF = Q0.y + 0.5 * (DIVE + EASE_END) * E;
      const plan = (r) => { if (r <= rTop) return [xTip + r, Z_IN]; const th = Math.min(TH, (r - rTop) / R); return [cx + R * Math.sin(th), cz - R * Math.cos(th)]; };
      const hgt = (r) => {
        if (r <= RND[0]) return H_IN;
        if (r < RND[1]) return H_IN - DIVE * (r - RND[0]) * (r - RND[0]) / (2 * (RND[1] - RND[0]));
        if (r <= rF) return H_IN - DIVE * (r - r0);
        const e = r - rF; return hF - DIVE * e + 0.5 * (DIVE - EASE_END) * e * e / E;
      };
      // stations: three on the level run, four through the rounded tip, one every 13 u or so down the straight, one
      // every 10 u or so round the turn
      const xIn = xTip + RND[0] - LEVEL, rs = []; for (let k = 0; k <= 3; k++) rs.push(lerp(xIn - xTip, RND[0], k / 3));
      rs.push(0, 6, 12, RND[1]);
      const nE = Math.max(1, Math.round((rTop - RND[1]) / 13)); for (let k = 1; k < nE; k++) rs.push(lerp(RND[1], rTop, k / nE));
      const nA = Math.max(6, Math.round(R * TH / 10.5)); for (let k = 0; k < nA; k++) rs.push(rTop + (k / nA) * R * TH);
      const pts = rs.map((r) => { const [x, z] = plan(r); return new THREE.Vector3(x, hgt(r), z); });
      // tanAt(r): the line's level heading at run r (unit x, z); starboard of it is (-z, x)
      const tanAt = (r) => { if (r <= rTop) return [1, 0]; const th = Math.min(TH, (r - rTop) / R); return [Math.cos(th), Math.sin(th)]; };
      return { pts, R, cx, cz, TH, xTip, xIn, rTop, rEnd, plan, tanAt, hgt, top: new THREE.Vector3(cx, hgt(rTop), Z_IN), dTip: LEVEL };
    })();
    await ctx.yield();
    const path = (() => {
      const pp = arc.pts.slice(); pp.push(Q0);
      for (let i = JOIN; i < fly.length - 1; i++) pp.push(fly[i].clone());
      pp.push(sS.clone().lerp(pEnd, 1 / 3), sS.clone().lerp(pEnd, 2 / 3), pEnd.clone());
      return makePath(pp);
    })();
    const L = path.length;
    await ctx.yield();
    // where the path passes six landmarks: one scan of the path for all of them (the last is the top of the turn, where
    // the line leaves the wall; it lies before the join)
    const marks = [G, A.naveEntry, A.naveExit, A.archPass, sS, arc.top], markU = [0, 0, 0, 0, 0, 0], markD = [1e9, 1e9, 1e9, 1e9, 1e9, 1e9];
    for (let i = 0; i <= 600; i++) { path.pointAt(i / 600, _q); for (let m = 0; m < 6; m++) { const d = _q.distanceToSquared(marks[m]); if (d < markD[m]) { markD[m] = d; markU[m] = i / 600; } } }
    await ctx.yield();
    const [uTail, uNave0, uNave1, uArch, uStraight, uTop] = markU;           // uTail: the join, where the keel run begins
    const dTail = uTail * L, dTip = arc.dTip, dTop = uTop * L;               // in units along the route: the join, where the line begins to tip, the top of the turn
    // ---- THE FLIGHT'S SPEEDS, by place (u/s; 4 u = 1 m). The brief's: the level entry at 3 m/s; 4.5 m/s from the tip
    // down the wall; slowing round the turn to 1.7 m/s at the join (the slowing ends at the join itself, dTail: the keel
    // run is flown at one speed from its first point); and from the join on, anchored at the hero's own
    // places and measured in the hero's own dimensions: 1.7 m/s along the keel; 1.375 m/s in the nave, the change
    // taking from a quarter of the nave's length before its mouth to an eighth of it inside (one station of the hero's
    // nave line); 1.7 m/s again from half the skull's length before the jaw arch to half the skull's length down the
    // last straight; 2.1 m/s by the ring, the change taking the middle third of the last straight (between the two
    // stations the path has on it). The duration is what these speeds give the route's length (worked out as the
    // engine does it: 64 equal steps of u, the mean speed of each), so the engine flies exactly them.
    // tailLen: the tail, its tip to the nave's mouth (about 48 u); naveLen: the nave, mouth to exit (about 37 u);
    // skullLen: the skull's line, its back to its tip (about 23 u); lastLen: the last straight (60 u)
    const tailLen = A.spineTop[0].distanceTo(A.naveEntry), naveLen = A.naveEntry.distanceTo(A.naveExit), skullLen = A.skullLine[0].distanceTo(A.skullTip), lastLen = sS.distanceTo(pEnd);
    const vAt = (d) => {
      let v = 12;
      v = lerp(v, 18, smoothstep(dTip - 6, dTip + 30, d));
      v = lerp(v, 6.8, smoothstep(dTop - 14, dTail, d));
      v = lerp(v, 5.5, smoothstep(uNave0 * L - naveLen / 4, uNave0 * L + naveLen / 8, d));
      v = lerp(v, 6.8, smoothstep(uArch * L - skullLen / 2, uStraight * L + skullLen / 2, d));
      return lerp(v, 8.5, smoothstep(L - lastLen * 2 / 3, L - lastLen / 3, d));
    };
    const PN = 64, vS = new Float32Array(PN + 1), tS = new Float32Array(PN + 1);      // vS: speed at each step of u; tS: the seconds flown by then
    for (let i = 0; i <= PN; i++) vS[i] = vAt(i / PN * L);
    for (let i = 0; i < PN; i++) tS[i + 1] = tS[i] + (L / PN) * 2 / (vS[i] + vS[i + 1]);
    const DURATION = tS[PN];
    const tOf = (u) => { const x = clamp(u, 0, 1) * PN, i = Math.min(PN - 1, Math.floor(x)); return tS[i] + (tS[i + 1] - tS[i]) * (x - i); };      // seconds flown at u
    // the place the flight has reached at a second of the design's 48: the same share of this flight's time
    const uAtSec = (sec) => { const t = sec / 48 * DURATION; let i = 0; while (i < PN - 1 && tS[i + 1] < t) i++; return clamp((i + (t - tS[i]) / Math.max(1e-6, tS[i + 1] - tS[i])) / PN, 0, 1); };
    const pace = (u) => { const x = clamp(u, 0, 1) * PN, i = Math.min(PN - 1, Math.floor(x)); return (vS[i] + (vS[i + 1] - vS[i]) * (x - i)) * DURATION / L; };
    // the layout of the terrace's north-east corner, in fixed numbers (the brink, the corner spur, the bed north-east of
    // the tail): sAt(s, side) is a point s u out from (GX0, 0) along the diagonal to the north-east, side u to its north-west
    const GX0 = 43.6, BX = Math.SQRT1_2, BZ = -Math.SQRT1_2, sAt = (s, side) => [GX0 + BX * s - BX * side, BZ * s + BZ * side];
    const [SX2, SZ2] = sAt(90, 15);                    // where the corner spur's nose and its tree stand (CORNER SPUR below)
    const X_IN = arc.xIn, PX2 = X_IN + 56, PZ2 = Z_IN - 14, PROW_H = 15;      // the entry tree's prow (ENTRY TREE below): the brief's 14 m (56 u) ahead of the entry, 14 u to port of the line
    // streams of their own (none is forked from ctx.rng, so making one shifts no other): RY for the life of the bed
    // north-east of the tail and of the ring's shoulder and the reef's cushions; one for each loop whose number of draws
    // depends on the route (streamOf below), so that a change to the route re-deals that loop and nothing after it
    const streamOf = (name) => makeRng(hashSeed('wfg-' + name + ':' + ctx.seed));
    const RY = makeRng(hashSeed('wfg-staging2:' + ctx.seed));
    const offLine = (margin) => (p, r) => path.distanceTo(p.x, p.y, p.z) < margin + r;      // is a branch of radius r at p within `margin` u of the route?
    await ctx.yield();

    // ---- floor: the hero's bed profile carried out over the terrace, banked against the cliff, plunging in the west
    const bedC = { x: -14, z: (A.naveLine[4].z) * 0.35 };
    const bedR = (x, z) => { const a = (x - bedC.x) / 92, b = (z - bedC.z) / 50; return Math.sqrt(a * a + b * b); };
    const outcrop = (x, z) => smoothstep(0.02, 0.34, NZ.fbm2(x * 0.03 + 11, z * 0.03 - 4, 3)) * smoothstep(1.0, 1.4, bedR(x, z));
    // the cliff's foot line: due west behind the skeleton (the entry runs along it), turning away north-east past
    // x = 94, where the terrace ends in a brink; zRel(x, z) is z measured from that line (-88 at the wall)
    const wall0 = (x) => { const w = x - 94; return -88 - 0.5 * (w + Math.sqrt(w * w + 144)); };
    const zRel = (x, z) => z - wall0(x) - 88;
    const eastOf = (x, z) => (x - GX0) * BX + z * BZ - 104;            // how far out past the terrace's north-east brink
    const floorY = (x, z) => {
      let y = gh(x, z) - 0.42;
      const bank = smoothstep(-50, -88, zRel(x, z)); y += 16 * bank * bank;
      const dw = -116 - x; if (dw > 0) y -= dw < 10 ? 0.06 * dw * dw : 1.2 * (dw - 10) + 6;            // the plunge beyond the ring: the abyss
      const ds = z - 96; if (ds > 0) y -= ds < 20 ? 0.0125 * ds * ds : 0.5 * (ds - 20) + 5;              // the terrace's seaward edge
      const de = eastOf(x, z); if (de > 0) y -= de < 10 ? 0.045 * de * de : 0.9 * (de - 10) + 4.5;      // the north-east brink
      y += 1.4 * NZ.fbm2(x * 0.012 + 40, z * 0.012, 2) * smoothstep(0.9, 1.6, bedR(x, z));
      return y;
    };
    const rockAt = (x, z, oc = outcrop(x, z)) => {
      const d = -26 - x, nearLine = Math.exp(-(((z - sS.z) / 42) ** 2)) * smoothstep(-66, -84, x);        // the slope under the last straight keeps its silt
      let r = smoothstep(0.15, 0.5, smoothstep(8, 34, d) * 0.9 * (1 - 0.93 * nearLine) + 0.45 * NZ.fbm2(x * 0.06, z * 0.06, 3) - 0.2);
      r = Math.max(r, smoothstep(-66, -80, zRel(x, z)), oc, smoothstep(100, 125, z), smoothstep(2, 16, eastOf(x, z)));
      return r;
    };
    const surfYp = (pth, x, z, oc) => {                    // the floor with its outcrops (kept off the low parts of the route pth)
      let y = floorY(x, z);
      if (oc > 0.01) { const nr = pth.nearestXZ(x, z), keep = Math.max(smoothstep(8, 18, nr.dist), smoothstep(12, 22, nr.y - y)); y += 3.4 * oc * (0.6 + 0.4 * NZ.n2(x * 0.1, z * 0.1)) * keep; }
      return y;
    };
    const surfY = (x, z, oc = outcrop(x, z)) => surfYp(path, x, z, oc);
    const axis = (a, b, d0, d1, fine, coarse) => { const out = []; let v = a; while (v < b) { out.push(v); v += (v >= d0 && v < d1) ? fine : coarse; } out.push(b); return out; };
    let floor;
    {
      const xs = axis(-296, -125, 0, 0, 9, 9).concat(axis(-116, 340, -116, 126, 3.0, 12)), zs = axis(-262, 230, -68, 64, 2.6, 12), nx = xs.length, nz = zs.length;
      const pos = new Float32Array(nx * nz * 3), ag = new Float32Array(nx * nz * 3);
      for (let j = 0, v = 0; j < nz; j++) {
        for (let i = 0; i < nx; i++, v++) {
          const x = xs[i], z = zs[j], oc = outcrop(x, z), y = surfY(x, z, oc);
          pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
          ag[v * 3] = rockAt(x, z, oc); ag[v * 3 + 1] = 1 - 0.35 * smoothstep(-70, -88, zRel(x, z)) - 0.25 * oc * (1 - oc) * 4 * 0.5; ag[v * 3 + 2] = 0;
          if (i % 40 === 39) await ctx.yield();
        }
        await ctx.yield();
      }
      const idx = new Uint16Array((nz - 1) * (nx - 1) * 6);
      for (let j = 0, q = 0; j < nz - 1; j++) { for (let i = 0; i < nx - 1; i++, q += 6) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[q] = a; idx[q + 1] = c; idx[q + 2] = b; idx[q + 3] = b; idx[q + 4] = c; idx[q + 5] = d; } if (j % 16 === 15) await ctx.yield(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.BufferAttribute(ag, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      await normalsY(g, ctx.yield);
      await ctx.yield();
      // uFoot: the terrace's silt at the foot of the cliff (the floor's height on the wall's foot line abeam of the fall's
      // centre), its reach 12 u (3 m), its strength 2: what the shader adds to a face is the rock's albedo by twice the
      // water's bounce colour at that height, falling to 37 parts in a hundred (1/e) of it for every 12 u above or below,
      // in full on a face that stands upright or looks down and none on one turned up (on the wall only, near by). uCrustLit: the
      // wall's growth near by: its albedo's gain, and how much of the rock a plate hides. uTree: the entry tree's foot and
      // height, for the growth its colony shades out (set where the tree is planted, below).
      var uTree = { value: new THREE.Vector4(0, -1e4, 0, PROW_H) };
      var groundMat = mat(GROUND_VERT, GROUND_FRAG, { uTree, uRock: { value: new THREE.Color(0.088, 0.104, 0.122) }, uProw: { value: new THREE.Vector4(PX2 + 4, PZ2 - 4, 62, 0) },
        uFall: { value: new THREE.Vector4(bedC.x, bedC.z, 92, 50) }, uFoot: { value: new THREE.Vector3(floorY(bedC.x, wall0(bedC.x)), 12, 2) }, uCrustLit: { value: new THREE.Vector2(1.5, 0.9) } });
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(25, -60, -16), 520);
      floor = new THREE.Mesh(g, groundMat); floor.name = 'floor'; scene.add(floor);
    }
    await ctx.yield();

    // ---- the cliff: black basalt along the north, turning away north-east past the terrace's corner; an overhang above,
    // the coral tree's prow (PX2, PZ2) beside the entry and a second, lower spur at the corner (SX2, SZ2)
    let spurReach = 0, prowReach = 0;
    const cliffZ = (x, y) => {
      let z = wall0(x) + 6 * NZ.fbm2(x * 0.011 + 7.7, y * 0.02, 3);
      const px = PX2;
      z += prowReach * Math.exp(-(((x - px) / 8.5) ** 2)) * (1 - smoothstep(56, 63, y));      // (prowReach: set below so that the prow ends 4.5 u past its tree, 9.5 u short of the line and 10 u under it)
      // CORNER SPUR: a low nose of rock off the wall's foot at the terrace's north-east corner, its top at y 13, about
      // 45 u north-east of the turn's eastmost point (spurReach: set below so that the nose ends 3.5 u past its tree,
      // whatever the wall's own wander there)
      z += spurReach * Math.exp(-(((x - SX2) / 6.5) ** 2)) * (1 - smoothstep(9.5, 15.5, y));
      z += 27 * smoothstep(92, 122, y) * (0.8 + 0.2 * NZ.n2(x * 0.03, 5.5));
      z += 10 * smoothstep(26, -6, y);
      z -= Math.max(0, y - 122) * 4;
      { const f = y / 13 + 0.35 * NZ.n2(x * 0.02, y * 0.01), fr = f - Math.floor(f); z += 3.2 * fr * fr * fr * (1 - Math.exp(-(((x - px) / 12) ** 2))) * (1 - Math.exp(-(((x - SX2) / 11) ** 2))); }      // ledges: flat tops that catch the light
      z += 1.6 * Math.abs(Math.sin(x * 0.42 + 2.5 * NZ.n2(x * 0.05, y * 0.03))) + 1.5 * NZ.fbm2(x * 0.09, y * 0.09, 3);
      // past the ring the wall turns away north-west, so the water behind the ring is open on both sides; the scene's
      // fog takes the wall there
      { const w = -135 - x; z -= 0.9 * (w + Math.sqrt(w * w + 900)) * smoothstep(-60, -100, x); }
      return z;
    };
    spurReach = SZ2 + 3.5 - cliffZ(SX2, 11); prowReach = PZ2 + 4.5 - cliffZ(PX2, 52);
    {
      const xs = axis(-340, -104, -214, -104, 7, 14).concat(axis(-100, 62, 0, 0, 2.7, 2.7), axis(66.5, 240, 0, 0, 4.5, 4.5), axis(249, 330, 0, 0, 9, 9)), ys = axis(-130, 134, 14, 120, 2.8, 6).flatMap((y) => (y === 8 ? [5, 8, 11] : [y])), nx = xs.length, ny = ys.length;      // (two more rows where the corner spur's top lies)
      const pos = new Float32Array(nx * ny * 3), ag = new Float32Array(nx * ny * 3);
      for (let j = 0, v = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++, v++) {
          const x = xs[i], y = ys[j], z = cliffZ(x, y);
          pos[v * 3] = x; pos[v * 3 + 1] = y; pos[v * 3 + 2] = z;
          ag[v * 3] = 1; ag[v * 3 + 1] = clamp(0.62 + 0.3 * NZ.fbm2(x * 0.09, y * 0.09, 3), 0.35, 0.92); ag[v * 3 + 2] = 0;
        }
        await ctx.yield();
      }
      const idx = new Uint16Array((ny - 1) * (nx - 1) * 6);
      for (let j = 0, q = 0; j < ny - 1; j++) { for (let i = 0; i < nx - 1; i++, q += 6) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[q] = a; idx[q + 1] = b; idx[q + 2] = c; idx[q + 3] = b; idx[q + 4] = d; idx[q + 5] = c; } if (j % 16 === 15) await ctx.yield(); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aG', new THREE.BufferAttribute(ag, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      await normalsY(g, ctx.yield);
      await ctx.yield();
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -150), 480);
      // the wall east of x = 80 (the corner and the north-east wall) is a mesh of its own on the same vertices, with its
      // own bounding sphere: the renderer's frustum test leaves it out whenever it lies behind the lens
      const iE = xs.findIndex((x) => x > 80) - 1, nW = iE * (ny - 1) * 6, idxW = new Uint16Array(nW), idxE = new Uint16Array(idx.length - nW);
      for (let j = 0, q = 0, a = 0, b = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++, q += 6) for (let c = 0; c < 6; c++) { if (i < iE) idxW[a++] = idx[q + c]; else idxE[b++] = idx[q + c]; }
      g.setIndex(new THREE.BufferAttribute(idxW, 1));
      const gE = new THREE.BufferGeometry(); for (const key in g.attributes) gE.setAttribute(key, g.attributes[key]); gE.setIndex(new THREE.BufferAttribute(idxE, 1)); gE.boundingSphere = g.boundingSphere;
      const cliff = new THREE.Mesh(g, groundMat); cliff.name = 'cliff'; scene.add(cliff);
      { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (let j = 0; j < ny; j++) for (let i = iE; i < nx; i++) { const v = (j * nx + i) * 3; x0 = Math.min(x0, pos[v]); x1 = Math.max(x1, pos[v]); z0 = Math.min(z0, pos[v + 2]); z1 = Math.max(z1, pos[v + 2]); }
        gE.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 2, (z0 + z1) / 2), 0.5 * Math.hypot(x1 - x0, 264, z1 - z0) + 2); }
      const cliffE = new THREE.Mesh(gE, groundMat); cliffE.name = 'cliff-east'; scene.add(cliffE);
    }
    const cliffN = (x, y, out) => { const e = 0.8, zx = (cliffZ(x + e, y) - cliffZ(x - e, y)) / (2 * e), zy = (cliffZ(x, y + e) - cliffZ(x, y - e)) / (2 * e); return out.set(-zx, -zy, 1).normalize(); };
    await ctx.yield();

    // ---- the dome: 200 m of water overhead
    const fogCol = new THREE.Color(mood.fog);
    const glowDir = keyDir.clone().lerp(new THREE.Vector3(0, 1, 0), 0.25).normalize();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), new THREE.ShaderMaterial({
      uniforms: { uFogCol: { value: fogCol }, uFogLow: U.uFogLow, uFogUp: U.uFogUp, uGlow: { value: glowC }, uGlowDir: { value: glowDir }, uTime: U.uTime },
      vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
    dome.renderOrder = -1; dome.frustumCulled = false; dome.name = 'dome'; scene.add(dome);
    await ctx.yield();

    // ---- the garden: bubblegum coral, sponges, boulders (one merged mesh), then the anemones on every knuckle
    // uWallCoral: how much paler the coral rooted in the cliff is (toward the entry tree's own tone), and the strength of
    // the bounce that the wall throws back on every coral rooted on its rock (the coral's albedo by 1.2 of the water's
    // own bounce colour, on every face of it; the same for a hanger, a coral on a ledge and the entry tree)
    const staticMat = mat(STATIC_VERT, STATIC_FRAG, { uWallCoral: { value: new THREE.Vector2(0.5, 1.2) } }, { vertexColors: true, side: THREE.DoubleSide });
    const pink = pal[4].clone().multiplyScalar(0.66), yellow = pal[5].clone().multiplyScalar(0.62);
    const UP = new THREE.Vector3(0, 1, 0), gS = new Geo(), gDump = new Geo();      // gDump: what a seeded stream still rolls where there is no room for it now (never drawn)
    // naveZ: the nave's centre line at x; radial: the way out from that line through a point on a rib
    const naveZ = (x) => { const nl = A.naveLine; let k = 0; while (k < nl.length - 2 && nl[k + 1].x > x) k++; const f = clamp((nl[k].x - x) / Math.max(1e-3, nl[k].x - nl[k + 1].x), -1, 2); return lerp(nl[k].z, nl[k + 1].z, f); };
    const radial = (p, out) => out.set(0, p.y - 5.6, p.z - naveZ(p.x)).normalize();
    const boulder = (c, s, g = gS, rs = R) => {      // (rs: the stream it is dealt from)
      g.B = [3, 0, 0, 0]; g.A = [c.x, c.y, c.z, 0];
      const ph = rs() * TAU;
      lathe(g, c, [[1.25 * s, -0.5 * s], [1.15 * s, 0.1 * s], [0.8 * s, 0.5 * s], [0.35 * s, 0.72 * s]], 7, { top: 0.78 * s, yaw: ph, sz: rs.range(0.7, 1), rf: (k, ang) => 1 + 0.16 * Math.sin(ang * 3 + ph) + 0.1 * Math.sin(ang * 5 + k),
        onRing: (k) => { const sh = 0.05 + 0.03 * k; g.col = [sh * 0.85, sh, sh * 1.1]; } });
    };
    const treeCol = (rs = R) => pink.clone().multiplyScalar(rs.range(0.85, 1.1)).lerp(new THREE.Color(0.55, 0.16, 0.2), rs.range(0, 0.25));
    const spongeSpots = [], treeTips = [], treeAt = [], SPUR_H = 9.4;      // treeTips: club tips of the grove's trees (squat lobsters sit there)
    const clearOf = offLine(6);      // the clearance rule of every tree beside the approach: no branch within 6 u of the line (coralTree's o.clear)
    // ENTRY TREE, alone on its prow: the light-on-dark shape seen through the previous portal. The brief's 14 m (56 u)
    // ahead of the entry, on a ledge 14 u to port of the line and about 11 u under it; its fan stands on a bearing of
    // its own draw (stream 'entry-fan': one draw, any bearing), every branch 6 u or more clear of the line
    const ledgeTop = (x, z, lo, hi) => { for (let k = 0; k < 18; k++) { const m = (lo + hi) / 2; if (cliffZ(x, m) > z) lo = m; else hi = m; } return lo; };
    {
      const base = new THREE.Vector3(PX2, ledgeTop(PX2, PZ2, 44, 68) - 0.5, PZ2);
      coralTree(gS, R, base, new THREE.Vector3(0.04, 1, -0.06), PROW_H, { depth: 3, sides: 9, smooth: true, col: new THREE.Color(1.0, 0.33, 0.45), sway: 1.5, trop: UP, fan: new THREE.Vector3(1, 0, 0).applyAxisAngle(UP, streamOf('entry-fan')() * TAU), thick: 0.062, clear: clearOf });
      treeAt.push([base.x, base.z, PROW_H]);
      uTree.value.set(base.x, base.y, base.z, PROW_H);      // the tree's foot and height, for the ground's growth under it
      await ctx.yield();
      spongeSpots.push([base.x + 3.6, base.y - 1.2, base.z + 0.6, 1.2], [base.x - 3.0, base.y - 0.6, base.z + 2.6, 0.9], [base.x + 1.5, base.y - 3.0, base.z + 5.2, 1.4]);
      // the second tree, on the corner spur's nose at the terrace's north-east corner (45 u or more from the line)
      const b2 = new THREE.Vector3(SX2, ledgeTop(SX2, SZ2, 2, 24) - 0.4, SZ2);
      coralTree(gS, R, b2, new THREE.Vector3(0.1, 1, 0.12), SPUR_H, { depth: 3, sides: 8, smooth: true, col: new THREE.Color(0.95, 0.38, 0.50), sway: 1.1, trop: UP, fan: new THREE.Vector3(0.74, 0, -0.67), thick: 0.060 });
      treeAt.push([b2.x, b2.z, SPUR_H]);
      spongeSpots.push([b2.x + 3.0, b2.y - 0.8, b2.z + 1.0, 1.5], [b2.x - 2.6, b2.y - 0.5, b2.z + 2.4, 1.1], [b2.x + 0.5, b2.y - 2.2, b2.z + 4.6, 1.7], [b2.x - 5, b2.y - 3.5, b2.z + 5.5, 1.3]);
    }
    await ctx.yield();
    // corals hung from the cliff and its overhang (stream 'cliff-coral': where one may hang depends on where the entry
    // tree and the line are, so the loop has a stream of its own and re-deals nothing else)
    const RC = streamOf('cliff-coral'), nCliff = Math.round(27 * densG), nrm = new THREE.Vector3();
    for (let k = 0, tries = 0; k < nCliff && tries < 400; tries++) {
      if (tries % 8 === 7) await ctx.yield();
      const front = k < 9;                                       // the first few hang where the entry looks: the wall ahead, to port of the line
      const mid = !front && k < 17;                              // the next few on the wall beside the level run, the rest anywhere behind the skeleton and round the corner
      const x = front ? RC.range(PX2 + 14, PX2 + 96) : mid ? RC.range(X_IN - 6, PX2 - 14) : RC.range(-150, 100), y = front ? RC.range(40, 96) : mid ? RC.range(36, 100) : RC.range(40, 114), H = front ? RC.range(6.5, 11) : RC.range(4.5, 9.5);
      if ((Math.abs(x - PX2) < 13 && y > 44 && y < 84) || (Math.abs(x - SX2) < 10 && y < 34)) continue;      // (nothing hangs into the entry tree or the spur's)
      const hang = y > 98, z = cliffZ(x, y), dir = cliffN(x, y, nrm).clone().multiplyScalar(hang ? 0.45 : 0.8).add(new THREE.Vector3(0, hang ? -0.85 : 0.55, 0)).normalize();
      coralTree(gS, RC, new THREE.Vector3(x, y, z - 0.4), dir, H, { depth: 2, sides: 5, col: treeCol(RC), sway: 0.55 + 0.06 * H, trop: hang ? new THREE.Vector3(0, -1, 0) : UP, thick: 0.055, clear: clearOf });
      if (RC.chance(0.5)) spongeSpots.push([x + RC.range(-4, 4), y + RC.range(-3, 3), 0, RC.range(0.9, 1.9), 1]);
      k++;
      await ctx.yield();
    }
    await ctx.yield();
    // the ring of trees round the bones, each on its boulder: a seeded ring round the fall, one tree to each equal
    // share of the bearings, 1.02 to 1.3 times the ring's radius out, each of its own drawn height and its own drawn
    // build (two orders of branch, or three for two in five): a ring tree is the same tree wherever the route runs.
    // Which of them stand is decided below.
    const ringTrees = [];
    {
      const nRing = Math.round(14 * densG);
      for (let k = 0; k < nRing; k++) {
        const a = (k + R.range(0.15, 0.85)) / nRing * TAU, rr = R.range(1.02, 1.3);
        ringTrees.push([bedC.x + 4 + Math.cos(a) * 100 * rr, bedC.z + Math.sin(a) * 58 * rr, R.range(5, 10), R.chance(0.4) ? 3 : 2]);
      }
    }
    const nRingAll = ringTrees.length;
    // on the slope either side of the last straight (never in front of the ring: tops stay under the line, 11 u or more to the side)
    { const hx = A.heading.x, hz = A.heading.z;
      for (const [t, side, H, dp] of [[1, 13.5, 9, 3], [8, -14, 10, 3], [15, 12, 8.5, 3], [22, -13, 9.5, 3], [29, 13, 9, 3], [35, -12.5, 8.5, 2], [41, 13.5, 8, 2], [46, -15, 7.5, 2],
        [4, -24, 13, 2], [11, 23, 14, 2], [19, -26, 12.5, 2], [26, 25, 13, 2], [33, -23, 11, 2], [39, 24, 12, 2], [47, 21, 10, 2], [53, -19, 11, 2], [58, 16, 9.5, 2], [65, -17, 10.5, 2], [72, 20, 10, 2]]) ringTrees.push([sS.x + hx * t - hz * side, sS.z + hz * t + hx * side, H, dp, 1]); }
    // Every tree is rolled in full whether it is planted or not (an unplanted one goes to gDump, never drawn), each
    // the build of its own draw, so R takes the same draws here wherever the route runs. Unplanted: in the wall's
    // bank, a ring tree west of the skull, or one whose crown would reach the line (its trunk's middle nearer the line
    // than 0.6 of its height and 7 u; a row tree: 0.42 of its height and 6 u). A ring tree keeps every branch 6 u
    // clear of the line (clearOf), wherever it stands.
    for (let k = 0; k < ringTrees.length; k++) {
      await ctx.yield();
      const [x, z, H, depth, staged] = ringTrees[k], y = surfY(x, z), s = H * 0.2;
      const out = (k < nRingAll && x < -62) || zRel(x, z) < -58 || path.distanceTo(x, y + H * 0.55, z) < (staged ? H * 0.42 + 6 : H * 0.6 + 7), gT = out ? gDump : gS;
      boulder(new THREE.Vector3(x, y + 0.3 * s, z), s, gT); if (!out) treeAt.push([x, z, H]);
      coralTree(gT, R, new THREE.Vector3(x, y + 0.85 * s, z), new THREE.Vector3(R.range(-0.15, 0.15), 1, R.range(-0.15, 0.15)), H, { depth, sides: depth === 3 ? 6 : 5, twig: k < nRingAll ? 5 : 0, col: treeCol(), sway: 0.25 + 0.035 * H, trop: UP, thick: 0.05, clear: k < nRingAll ? clearOf : null });
      for (let q = 0; q < 2; q++) { const a = R() * TAU, d = s * R.range(1.1, 1.9), sz = R.range(0.9, 2.2); if (!out) spongeSpots.push([x + Math.cos(a) * d, 0, z + Math.sin(a) * d, sz, 2]); }
      await ctx.yield();
    }
    // THE GROVE OF THE DESCENT: a lot of its own, from a stream of its own ('grove'), dealt after the ring and the rows
    // so that R is not touched by it. Its ground is a strip of the terrace said by two places of the garden: from the
    // foot of the cliff's lower spur at the corner (the spur the second coral tree stands on; its foot is where the
    // face of its nose meets the floor) to the tip of the tail (the first point of the spine's top line), 28 u to either
    // side of the straight ground line between them. Each tree is a drawn share along that line, a drawn side distance
    // across the whole strip (-28 to 28 u) and a drawn height (7 to 13 u): every die is drawn before any test, and
    // every tree is rolled in full (its boulder, the tree, its two sponges) whether it stands or not, an unplanted one
    // into gDump. Unplanted: in the wall's bank, on the bones' bed (inside the bed's own ellipse, 92 by 50 u), nearer
    // than 9 u to a tree already standing, or one whose crown would reach the line (the stand-off every tree has: the
    // only thing in the lot that reads the route). Thirty-six are drawn, by density (eight to twelve of them stand on most seeds).
    // Every grove tree is the fuller build (three orders of branch, six sides, twigs of five), keeps every branch 6 u
    // clear of the line (clearOf) and, where it stands, gives its club tips to the squat lobsters (treeTips), whatever
    // its distance from the line. Two sponges by each, as by a ring tree, their places and their bodies from the
    // grove's stream (every one rolled; those of an unplanted tree into gDump).
    {
      const RG = streamOf('grove'), nGrove = Math.round(36 * densG), tip = A.spineTop[0];
      let fz = SZ2; for (let k = 0; k < 6; k++) fz = cliffZ(SX2, floorY(SX2, fz));      // the spur's foot: the face of its nose at the floor's own height there
      const gx = tip.x - SX2, gz = tip.z - fz, gl = Math.hypot(gx, gz) || 1;
      for (let k = 0; k < nGrove; k++) {
        await ctx.yield();
        const f = RG(), side = RG.range(-28, 28), H = RG.range(7, 13), x = SX2 + gx * f - gz / gl * side, z = fz + gz * f + gx / gl * side, y = surfY(x, z), s = H * 0.2;
        const out = zRel(x, z) < -58 || bedR(x, z) < 1 || treeAt.some(([tx, tz]) => (x - tx) * (x - tx) + (z - tz) * (z - tz) < 81) || path.distanceTo(x, y + H * 0.55, z) < H * 0.6 + 7, gT = out ? gDump : gS;
        boulder(new THREE.Vector3(x, y + 0.3 * s, z), s, gT, RG); if (!out) treeAt.push([x, z, H]);
        coralTree(gT, RG, new THREE.Vector3(x, y + 0.85 * s, z), new THREE.Vector3(RG.range(-0.15, 0.15), 1, RG.range(-0.15, 0.15)), H, { depth: 3, sides: 6, twig: 5, col: treeCol(RG), sway: 0.25 + 0.035 * H, trop: UP, thick: 0.05, clear: clearOf, tips: out ? null : treeTips });
        for (let q = 0; q < 2; q++) { const a = RG() * TAU, d = s * RG.range(1.1, 1.9), sz = RG.range(0.9, 2.2); spongeSpots.push([x + Math.cos(a) * d, 0, z + Math.sin(a) * d, sz, 2, RG, out]); }
        await ctx.yield();
      }
    }
    // basalt stacks beyond the terrace's seaward edge: they stand 180-250 u from the glide and the keel run, where the
    // fog has taken most of them, so they read as pale blue cut-outs behind the skeleton (depth, not detail)
    { const RS = rng.fork('stacks');
      for (const [x, z, r, h] of [[80, 150, 16, 58], [14, 146, 20, 76], [-36, 160, 24, 94], [-80, 130, 16, 64], [-120, 114, 13, 50]]) {
        const c = new THREE.Vector3(x + RS.range(-4, 4), surfY(x, z) - 8, z + RS.range(-4, 4)), ph = RS() * TAU, rr = r * RS.range(0.9, 1.1), hh = h * RS.range(0.9, 1.12);
        const STK = (c, rr, hh, ph) =>
          lathe(gS, c, [[1.0, 0], [0.92, 0.12], [0.8, 0.3], [0.76, 0.46], [0.6, 0.6], [0.54, 0.76], [0.36, 0.86], [0.27, 0.95]].map(([a, b]) => [a * rr, b * hh]), 12, { top: hh * 0.99, yaw: ph, sz: RS.range(0.7, 0.95),
          rf: (k, ang) => 1 + 0.26 * Math.sin(ang + ph + k * 0.5) + 0.15 * Math.sin(ang * 3 + k * 1.7) + 0.10 * Math.sin(ang * 5 - k * 2.3), onRing: (k) => { const sh = 0.05 + 0.012 * k; gS.col = [sh * 0.85, sh, sh * 1.1]; } });
        gS.B = [3, 0, 0, 0]; gS.A = [c.x, c.y, c.z, 0];
        STK(c, rr, hh, ph);
        const ba = RS() * TAU;
        STK(new THREE.Vector3(c.x + Math.cos(ba) * rr * 1.05, c.y, c.z + Math.sin(ba) * rr * 1.05), rr * RS.range(0.6, 0.8), hh * RS.range(0.45, 0.62), ph + 2.1);
      }
      await ctx.yield(); }
    { const RW = streamOf('strewn'); for (let q = 0; q < 15; q++) { const a = RW() * TAU, rr = RW.range(0.6, 1); spongeSpots.push([bedC.x + Math.cos(a) * 92 * rr, 0, bedC.z + Math.sin(a) * 50 * rr, RW.range(1.0, 2.3), 2]); } }      // strewn on the open bed (stream 'strewn'): a drawn bearing from the bed's centre and a drawn share (0.6 to 1: outside the bones) of the bed's own radius on that bearing (92 by 50 u)
    // sponges: on the shoulder blades, by the trees, on cliff ledges and outcrops
    for (const sc of A.scapulae) for (let q = 0; q < 4; q++) spongeSpots.push([sc.x + R.range(-2.2, 2.2), sc.y + 0.05, sc.z + R.range(-2.2, 2.2), R.range(0.7, 1.5)]);
    for (let q = 0, tries = 0; q < Math.round(34 * densG) && tries < 400; tries++) {
      if (tries % 40 === 39) await ctx.yield();
      const x = R.range(-40, 120), z = R.range(-58, 80);
      if (outcrop(x, z) < 0.5) continue;
      spongeSpots.push([x, 0, z, R.range(1.2, 3.0), 2]); q++;
    }
    // Every sponge is rolled (an undrawn one goes to gDump): undrawn where it would stand within 5 u of the line, or on
    // the bed under a stretch of the line that is lower than 16 u over it. A spot's sixth and seventh values (the
    // grove's): the stream its body is rolled from instead of R, and whether its tree is not planted (then it is undrawn)
    let spN = 0;
    for (const sp of spongeSpots) {
      if (++spN % 8 === 0) await ctx.yield();
      let [x, y, z, s, mode, rs = R, off = false] = sp;
      if (mode === 1) z = cliffZ(x, y) - 0.2; else if (mode === 2) y = surfY(x, z) - 0.3;
      let out = off || path.distanceTo(x, y + s * 0.6, z) < s + 5;
      if (mode === 2 && !out) { const nr = path.nearestXZ(x, z); out = nr.dist < 8 && nr.y - y < 16; }
      sponge(out ? gDump : gS, rs, new THREE.Vector3(x, y, z), s, yellow.clone().multiplyScalar(rs.range(0.8, 1.15)));
    }
    await ctx.yield();
    // the old reef: real growth on the bones. Thirty small pale coral trees stand off the ribs and the spine (outward
    // along radial(), or up), clear of the lens by 1.9 u, from a stream of their own ('reef-sprigs': how many tries they
    // take depends on the line); the bone shader adds the low crust.
    if (hero.age === 'reef') {
      const spots = [], rp = new THREE.Vector3(), rn = new THREE.Vector3(), tipP = new THREE.Vector3();
      for (const rb of A.ribs) if (!rb.stub) for (let i = 1; i < rb.points.length; i++) spots.push([rb.points[i], rb.fallen ? 1 : 0]);
      for (const t of A.spineTop) spots.push([t, 1]);
      for (const sc of A.scapulae) spots.push([sc, 2], [sc, 2]);
      const RR = streamOf('reef-sprigs'); let nCo = 0;
      for (let tries = 0; tries < 900 && nCo < 30; tries++) {
        if (tries % 6 === 5) await ctx.yield();
        const [P, kind] = RR.pick(spots);
        if (kind === 0) { radial(P, rn); if (RR.chance(0.2)) rn.multiplyScalar(-1); rn.x += RR.range(-0.4, 0.4); rn.y += RR.range(0.1, 0.6); } else rn.set(RR.range(-0.3, 0.3), 1, RR.range(-0.3, 0.3));
        rn.normalize();
        rp.copy(P).addScaledVector(rn, kind === 0 ? 0.12 : 0.02);
        if (kind === 2) { rp.x += RR.range(-2.6, 2.6); rp.z += RR.range(-2.6, 2.6); }
        else if (kind === 1) { rp.x += RR.range(-0.4, 0.4); rp.z += RR.range(-0.8, 0.8); }
        const H = RR.range(1.2, 2.2);
        tipP.copy(rp).addScaledVector(rn, H * 0.6);
        if (rn.y < 0.3 || rp.distanceToSquared(A.foramen) < 6 || path.distanceTo(tipP.x, tipP.y, tipP.z) < 1.9 + H * 0.62 || path.distanceTo(rp.x, rp.y, rp.z) < 2.3) continue;      // sprigs stand on rib tops and the spine, never off a flank
        const c = new THREE.Color(0.86, 0.50, 0.58).lerp(new THREE.Color(0.80, 0.76, 0.72), RR.range(0.1, 0.55)).multiplyScalar(RR.range(0.8, 0.95));
        coralTree(gS, RR, rp.clone(), rn.clone().lerp(UP, 0.25), H, { depth: 2, sides: 5, col: c, sway: 0.05 + 0.03 * H, trop: UP, thick: 0.06 });
        nCo++;
      }
      // the cushions (stream RY): small round buns tucked in the angle of rib head and spine and along the outer flanks of
      // the ribs, none above 0.68 of a rib's length (the tips stay bare chalk), clear of the lens by 1.9 u
      for (let k = 0, tries = 0; k < 36 && tries < 400; tries++) {
        if (tries % 8 === 7) await ctx.yield();
        const rb = RY.pick(A.ribs), P = rb.points, low = RY.chance(0.45), f = low ? RY.range(0, 0.12) : RY.range(0.14, 0.68), sz = RY.range(0.55, 0.9), jx = RY.range(-0.35, 0.35), tint = RY.range(0.85, 1.1);
        if (rb.stub || rb.fallen) continue;
        const fi = f * (P.length - 1), i = Math.min(P.length - 2, Math.floor(fi)); rp.lerpVectors(P[i], P[i + 1], fi - i); radial(rp, rn);
        if (low) { rp.x += jx * 2; rp.y += 0.22; rp.z -= Math.sign(rn.z || 1) * 0.3; }
        else { rp.addScaledVector(rn, 0.12 + 0.2 * sz); rp.x += jx * 0.5; rp.y -= 0.3 * sz; }
        if (path.distanceTo(rp.x, rp.y + sz * 0.4, rp.z) < 1.9 + sz) continue;
        sponge(gS, RY, rp.clone(), sz, yellow.clone().multiplyScalar(tint), 2);
        k++;
      }
    }
    await ctx.yield();
    {
      const g = gS.build({ a: 'aSway', b: 'aK', bSize: 1 });
      await ctx.yield();
      await normalsY(g, ctx.yield);
      await ctx.yield();
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(40, 30, -40), 360);      // the whole terrace and cliff: always in view
      const m = new THREE.Mesh(g, staticMat); m.name = 'coral-and-sponge'; scene.add(m);
    }
    await ctx.yield();

    // anemones on the knuckles of bone
    const gA = new Geo(), an = new THREE.Vector3(), ap = new THREE.Vector3();
    const anem = (p, n, s) => anemone(path.distanceTo(p.x, p.y, p.z) > 1.9 + s && p.distanceToSquared(A.foramen) > 3.6 ? gA : gDump, R, p, s, n);      // (each is rolled whether it stands or not; nothing grows in the foramen: the hollow stays dark)
    const aSize = () => R.range(0.34, 0.62);
    let anN = 0;
    for (const t of A.spineTop) { if (++anN % 8 === 0) await ctx.yield(); const n = R.int(1, 3); for (let q = 0; q < n; q++) anem(ap.set(t.x + R.range(-0.5, 0.5), t.y - 0.04, t.z + R.range(-0.7, 0.7)), an.set(R.range(-0.2, 0.2), 1, R.range(-0.3, 0.3)), aSize()); }
    await ctx.yield();
    for (const rb of A.ribs) {
      if (++anN % 3 === 0) await ctx.yield();
      const P = rb.points, m = rb.stub ? 2 : 6;
      for (let q = 0; q < m; q++) {
        const i = rb.stub ? q : (q < 2 ? q : R.int(2, P.length - 1));
        radial(P[i], an); if (rb.fallen) an.set(0, 1, 0); else if (R.chance(0.3)) an.multiplyScalar(-1);
        an.x += R.range(-0.4, 0.4); an.normalize();
        anem(ap.copy(P[i]).addScaledVector(an, 0.3), an, aSize());
      }
    }
    await ctx.yield();
    await ctx.yield();
    for (const t of A.skullLine) if (t.distanceToSquared(A.foramen) > 25) for (let q = 0; q < 3; q++) anem(ap.set(t.x + R.range(-1, 1), t.y + 0.05, t.z + R.range(-2.4, 2.4)), an.set(0, 1, 0), aSize());
    await ctx.yield();
    for (const sc of A.scapulae) for (let q = 0; q < 6; q++) anem(ap.set(sc.x + R.range(-3, 3), sc.y + 0.02, sc.z + R.range(-3, 3)), an.set(0, 1, 0), aSize());
    // the crown of the skull's back: an anemone standing alone at each of the hero's drawn points (up to eight, each
    // 1.5 u or more from the others, the five and the seat), and the octopus on its own seat (the hero's draw, with its yaw)
    const occ = A.occiput || [], occSeat = A.occiputSeat || null;
    for (const oc of occ) anem(ap.copy(oc[0]).addScaledVector(oc[1], -0.06), oc[1], R.range(0.62, 0.9));
    for (const oc of A.occiput2 || []) {      // five more at the hero's drawn points (stream RY)
      const sz = RY.range(0.66, 0.92); ap.copy(oc[0]).addScaledVector(oc[1], -0.06);
      anemone(path.distanceTo(ap.x, ap.y, ap.z) > 1.9 + sz && ap.distanceToSquared(A.foramen) > 3.6 ? gA : gDump, RY, ap, sz, oc[1]);
    }
    for (const t of A.flipperLine) for (let q = 0; q < 2; q++) anem(ap.set(t.x + R.range(-0.8, 0.8), t.y + 0.25, t.z + R.range(-0.8, 0.8)), an.set(0, 1, 0), aSize());
    for (const t of A.archTips) for (let q = 0; q < 3; q++) anem(ap.set(t.x + R.range(-0.4, 0.4), t.y - q * 1.2, t.z + R.range(-0.4, 0.4)), an.set(R.range(-1, 1), 0.6, R.range(-1, 1)).normalize(), aSize());
    {
      const g = gA.build({ a: 'aSway', b: 'aK', bSize: 1 });
      await ctx.yield();
      await normalsY(g, ctx.yield); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-10, 0, 0), 95);
      const m = new THREE.Mesh(g, staticMat); m.name = 'anemones'; scene.add(m);
    }
    await ctx.yield();

    // ---- brooding octopuses: the hero's four seats, then under bone edges and at the cliff foot
    const gO = new Geo(), octoAt = [];
    {
      const white = hero.age === 'white';
      for (const st of A.octopusSeats) octoAt.push([st.position.x, st.position.y + 0.45, st.position.z, 1.12, Math.atan2(st.side || 0.3, 0.4)]);
      if (occSeat) octoAt.push([occSeat[0].x, occSeat[0].y + 0.34, occSeat[0].z, 0.86, occSeat[2], 1]);      // its yaw: drawn with its seat from the hero's stream for the crown (one draw, any bearing)
      const ST = A.spineTop, picks = [0.12, 0.26, 0.4, 0.52].concat(white ? [0.2, 0.33, 0.46] : []);
      picks.forEach((f, k) => { const t = ST[Math.floor(f * ST.length)], sd = k % 2 ? 1 : -1, x = t.x + R.range(-1, 1), z = t.z + sd * R.range(4.2, 5.2); octoAt.push([x, gh(x, z) + 0.72, z, R.range(0.95, 1.15), R() * TAU]); });
      for (const sc of A.scapulae) octoAt.push([sc.x + 4.6, gh(sc.x + 4.6, sc.z + 1.5) + 0.7, sc.z + 1.5, 1.05, R() * TAU]);
      const fl = A.flipperLine[2]; octoAt.push([fl.x + 2.4, gh(fl.x + 2.4, fl.z) + 0.72, fl.z, 1.0, R() * TAU]);
      octoAt.push([PX2 + 3.2, ledgeTop(PX2 + 3.2, PZ2 + 3.4, 44, 68) + 0.5, PZ2 + 3.4, 1.3, 0.6], [SX2 - 2.2, ledgeTop(SX2 - 2.2, SZ2 + 1.6, 2, 24) + 0.5, SZ2 + 1.6, 1.2, 0.9]);
      for (let k = 0; k < (white ? 5 : 2); k++) { const x = R.range(-20, 50), z = R.range(-52, -40); octoAt.push([x, floorY(x, z) + 0.75, z, 1.1, R() * TAU]); }
      for (const o of octoAt) { const near = path.distanceTo(o[0], o[1], o[2]) < (o[5] ? 1.85 + o[3] * 0.95 : 2.4 + o[3] * 1.25); octopus(near ? gDump : gO, R, new THREE.Vector3(o[0], o[1], o[2]), o[3], o[4]); await ctx.yield(); }      // (one too near the line is rolled and not drawn)
      const g = gO.build({ color: false, a: 'aC', b: 'aO' });
      await ctx.yield();
      await normalsY(g, ctx.yield); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(40, 20, -30), 230);
      const om = new THREE.Mesh(g, mat(OCTO_VERT, OCTO_FRAG, { uSkin: { value: new THREE.Color('#C9B3D6').multiplyScalar(0.72) }, uUnder: { value: new THREE.Color(0.66, 0.56, 0.60) } }, { side: THREE.DoubleSide }));
      om.name = 'octopuses'; scene.add(om);
    }
    await ctx.yield();

    // ---- crabs (walking the bones) and squat lobsters (claws out on rib tips, the skull and the boulders)
    const instMat = (extra) => mat(INST_VERT, INST_FRAG, { uTintA: { value: new THREE.Color(1, 1, 1) }, uTintB: { value: new THREE.Color(1, 1, 1) }, uBob: { value: 0 }, uGloss: { value: 0.12 }, ...extra }, { vertexColors: true, side: THREE.DoubleSide });
    const standing = A.ribs.filter((r) => !r.stub);
    const nCrab = Math.round(60 * dens), nLob = Math.round(80 * dens), nCL = nCrab + nLob;
    const cPos = new Float32Array(nCL * 4), cQuat = new Float32Array(nCL * 4), cDat = new Float32Array(nCL * 4), walkers = [];
    {
      const ST = A.spineTop, SK = A.skullLine;
      for (let k = 0; k < nCrab; k++) {
        const r = R(); let pts, mode;
        if (r < 0.42) { const i0 = R.int(0, ST.length - 4); pts = ST.slice(i0, i0 + R.int(3, 4)); mode = 0; }
        else if (r < 0.9) { const rb = R.pick(standing), i0 = rb.fallen ? 0 : R.int(0, 6); pts = rb.points.slice(i0, i0 + R.int(3, 5)); mode = rb.fallen ? 0 : 1; }
        else { const i0 = Math.max(2, R.int(0, Math.max(0, SK.length - 4))); pts = SK.slice(i0, i0 + 3); mode = 0; }      // (the line's first two points lie under the occiput's dome)
        if (pts.length < 2) pts = ST.slice(0, 3);
        walkers.push({ pts, mode, rate: R.range(0.10, 0.22), ph: R() * 10, inner: mode === 1 && R.chance(0.3) ? -1 : 1, lift: mode === 1 ? 0.56 : 0.2, side: R.range(-0.25, 0.25) });
        cPos[k * 4 + 3] = R.range(0.42, 0.6); cDat[k * 4] = R() * TAU; cDat[k * 4 + 1] = 0; cDat[k * 4 + 2] = 0; cDat[k * 4 + 3] = R.range(0.8, 1.3); cQuat[k * 4 + 3] = 1;
      }
      const tmpN = new THREE.Vector3(), tmpF = new THREE.Vector3();
      for (let k = nCrab; k < nCL; k++) {
        const r = R(); let x, y, z;
        tmpN.set(0, 1, 0);
        if (r < 0.5) { const rb = R.pick(standing), P = rb.points, i = rb.fallen ? R.int(2, 9) : R.int(6, P.length - 1); radial(P[i], tmpN); if (rb.fallen) tmpN.set(0, 1, 0); x = P[i].x + tmpN.x * 0.5; y = P[i].y + tmpN.y * 0.5; z = P[i].z + tmpN.z * 0.5; }
        else if (r < 0.7) { const t = R.pick(A.spineTop); x = t.x + R.range(-0.4, 0.4); y = t.y + 0.1; z = t.z + R.range(-0.9, 0.9); }
        else if (r < 0.85) { const t = R.pick(SK); x = t.x + R.range(-1, 1); y = t.y + 0.14; z = t.z + R.range(-2.2, 2.2); }
        else { const sc = R.pick(A.scapulae); x = sc.x + R.range(-3, 3); y = sc.y + 0.12; z = sc.z + R.range(-3, 3); }
        const a = R() * TAU, q = quatTo(tmpN, tmpF.set(Math.cos(a), 0.2, Math.sin(a)));
        cPos[k * 4] = x; cPos[k * 4 + 1] = y; cPos[k * 4 + 2] = z; cPos[k * 4 + 3] = R.range(0.36, 0.5);
        cQuat[k * 4] = q.x; cQuat[k * 4 + 1] = q.y; cQuat[k * 4 + 2] = q.z; cQuat[k * 4 + 3] = q.w;
        cDat[k * 4] = R() * TAU; cDat[k * 4 + 1] = 1; cDat[k * 4 + 2] = 1; cDat[k * 4 + 3] = R.range(0.5, 1.1);
      }
    }
    await ctx.yield();
    const crabG = instanced(crabGeo(), nCL, { iPos: cPos, iQuat: cQuat, iDat: cDat });
    crabG.attributes.iPos.setUsage(THREE.DynamicDrawUsage); crabG.attributes.iQuat.setUsage(THREE.DynamicDrawUsage);
    crabG.boundingSphere = new THREE.Sphere(new THREE.Vector3(-10, 0, 0), 100);
    const crabMesh = new THREE.Mesh(crabG, instMat({ uTintA: { value: scarlet ? new THREE.Color(0.62, 0.07, 0.06) : new THREE.Color(0.70, 0.70, 0.66) }, uTintB: { value: new THREE.Color(0.74, 0.40, 0.22) }, uGloss: { value: 0.3 } }));
    crabMesh.name = 'crabs'; crabMesh.frustumCulled = false; scene.add(crabMesh);
    await ctx.yield();

    // ---- sea stars, shells and bone crumbs, brittle stars: scattered near the bones and beside the route from one
    // tail's length (tailLen, about 48 u) before the join to the ring: the three scatters end where the route comes
    // within the ring's own radius of its seat (dRing; the anchor's radius, 7 u), one rule for the three, since the
    // route's last stretch is the ring's own and nothing is dealt beside it
    const feet = hero.feet, nFeet = feet.length / 3;
    const onBone = (x, z, pad) => { for (let f = 0; f < nFeet; f++) { const dx = x - feet[f * 3], dz = z - feet[f * 3 + 1], r = feet[f * 3 + 2] + pad; if (dx * dx + dz * dz < r * r) return true; } return false; };
    // a point of silt near the route (or near the bones): returns y, or null where it is rock, bone or the bed's ragged edge
    const siltY = (x, z, pad) => { const br = bedR(x, z); if (br > 0.76 && br < 0.93) return null; const oc = outcrop(x, z); if (rockAt(x, z, oc) > 0.45) return null; if (br <= 0.76) return onBone(x, z, pad) ? null : gh(x, z) - 0.03; return surfY(x, z, oc) + 0.02; };
    // (dA, dB: the stretch of the route, in units along it, beside which the rest lie. Where a point is tried comes
    // from the stream 'bed-scatter': how many tries a point takes depends on the route, so these draws are its own;
    // what is put there is still dealt from the garden's stream, a fixed number of draws to each)
    const RSC = streamOf('bed-scatter'), dRing = L - A.portalSeat.radius;
    const scatter = async (n, sigma, dA, dB, pad, put, nearP = 0.45) => {
      const tmp = new THREE.Vector3();
      for (let k = 0, tries = 0; k < n && tries < n * 4; tries++) {
        if (tries % 30 === 29) await ctx.yield();
        const nearBones = RSC.chance(nearP);
        let x, z;
        if (nearBones) { const a = RSC() * TAU, rr = Math.min(0.78, Math.abs(RSC.gauss()) * 0.34 + 0.05); x = bedC.x + Math.cos(a) * 92 * rr; z = bedC.z + Math.sin(a) * 50 * rr; }
        else { path.posAtDist(RSC.range(dA, dB), tmp); x = tmp.x + RSC.gauss() * sigma; z = tmp.z + RSC.gauss() * sigma; }
        const y = siltY(x, z, pad);
        if (y === null) continue;
        put(k, x, y, z); k++;
      }
    };
    const up = new THREE.Vector3(), fw = new THREE.Vector3();
    const hdS = pEnd.clone().sub(sS).normalize(), perpS = new THREE.Vector3(-hdS.z, 0, hdS.x).normalize();      // the last straight's heading, and its level normal
    // What lies on the bed far from the bones is drawn while the eye is near enough to make it out (eyeCull: each such
    // mesh has a tight sphere of its own and is shown while the eye is within `reach` of that sphere; the renderer's
    // frustum test leaves out what is behind the lens). The first scatter is split at X_SLOPE into the terrace and the slope.
    const X_SLOPE = -70, eyeCull = [], REACH = { star: 140, shell: 110, brittle: 80, crab: 140 };
    const cullBy = (m, P, n, reach, pad = 1.5, stride = 4) => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (let k = 0; k < n; k++) { const x = P[k * stride], y = P[k * stride + 1], z = P[k * stride + 2]; if (y < -900) continue; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
      if (x0 > x1) x0 = x1 = y0 = y1 = z0 = z1 = 0;
      const c = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), r = 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0) + pad;
      m.geometry.boundingSphere = new THREE.Sphere(c, r); m.frustumCulled = true; eyeCull.push([m, c, (r + reach) * (r + reach)]);
    };
    const splitX = (n, arrs) => [0, 1].map((w) => { const ix = []; for (let k = 0; k < n; k++) if ((arrs.iPos[k * 4] < X_SLOPE ? 1 : 0) === w) ix.push(k); const o = { n: ix.length };
      for (const key in arrs) { const a = new Float32Array(Math.max(1, ix.length) * 4); for (let i = 0; i < ix.length; i++) for (let c = 0; c < 4; c++) a[i * 4 + c] = arrs[key][ix[i] * 4 + c]; o[key] = a; } return o; });
    let starM = null, shellM = null, britM = null;
    const floorN = (x, z, out) => { const e = 0.7; return out.set(gh(x - e, z) - gh(x + e, z), 2 * e, gh(x, z - e) - gh(x, z + e)).normalize(); };
    {
      const n = Math.round(150 * dens), P = new Float32Array(n * 4), Q = new Float32Array(n * 4), D = new Float32Array(n * 4);
      for (let k = 0; k < n; k++) { P[k * 4 + 1] = -999; Q[k * 4 + 3] = 1; }
      await scatter(n, 20, dTail - tailLen, dRing, 0.9, (k, x, y, z) => {
        floorN(x, z, up); const a = R() * TAU, q = quatTo(up, fw.set(Math.cos(a), 0, Math.sin(a)));
        P.set([x, y, z, R.range(0.55, 1.15)], k * 4); Q.set([q.x, q.y, q.z, q.w], k * 4); D.set([R() * TAU, 0, R(), R.range(0.6, 1.2)], k * 4);
      });
      const g = instanced(starGeo(), n, { iPos: P, iQuat: Q, iDat: D }); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 260);
      const m = new THREE.Mesh(g, instMat({ uTintA: { value: new THREE.Color(0.78, 0.30, 0.08) }, uTintB: { value: new THREE.Color(0.80, 0.46, 0.16) } })); m.name = 'sea-stars'; m.frustumCulled = false; scene.add(m); starM = m;
    }
    await ctx.yield();
    {
      const white = hero.age === 'white';
      const n = Math.round((white ? 1050 : 800) * dens * lerp(0.6, 1, detail)), P = new Float32Array(n * 4), Q = new Float32Array(n * 4), D = new Float32Array(n * 4);
      for (let k = 0; k < n; k++) { P[k * 4 + 1] = -999; Q[k * 4 + 3] = 1; }
      await scatter(n, 22, dTail - tailLen, dRing, 0.1, (k, x, y, z) => {
        floorN(x, z, up); up.x += R.range(-0.5, 0.5) * 0.3; up.z += R.range(-0.5, 0.5) * 0.3; const a = R() * TAU, q = quatTo(up, fw.set(Math.cos(a), 0, Math.sin(a)));
        const kind = R(); P.set([x, y, z, kind < 0.45 ? R.range(0.16, 0.34) : R.range(0.08, 0.24)], k * 4); Q.set([q.x, q.y, q.z, q.w], k * 4);
        D.set([R() * TAU, 0, kind < (white ? 0.6 : 0.45) ? R.range(0, 0.12) : R.range(0.3, 1), 0], k * 4);
      });
      const [e, w] = splitX(n, { iPos: P, iQuat: Q, iDat: D });
      const g = instanced(shellGeo(), e.n, { iPos: e.iPos, iQuat: e.iQuat, iDat: e.iDat }); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 260);
      const m = new THREE.Mesh(g, instMat({ uTintA: { value: new THREE.Color(0.47, 0.47, 0.44) }, uTintB: { value: new THREE.Color(0.09, 0.10, 0.10) } })); m.name = 'shells'; m.frustumCulled = false; scene.add(m); shellM = m;
      const gw = instanced(g, w.n, { iPos: w.iPos, iQuat: w.iQuat, iDat: w.iDat }); gw.boundingSphere = g.boundingSphere;
      const mw = new THREE.Mesh(gw, m.material); mw.name = 'shells-slope'; scene.add(mw); cullBy(mw, w.iPos, w.n, REACH.shell);
    }
    await ctx.yield();
    {
      const n = Math.round(2200 * dens * lerp(0.5, 1, (detail - 0.6) / 0.4)), P = new Float32Array(n * 4), D = new Float32Array(n * 4);
      for (let k = 0; k < n; k++) P[k * 4 + 1] = -999;
      await scatter(n, 15, dTail - tailLen, dRing, 0.25, (k, x, y, z) => { P.set([x, y - 0.04, z, R.range(0.45, 1.0)], k * 4); D.set([R() * TAU, R() * TAU, R(), R.range(0.6, 1.2)], k * 4); }, 0.22);
      const base = new THREE.BufferGeometry(), bv = [], bi = [], SEG = 3;
      for (let arm = 0; arm < 3; arm++) {
        const b0 = bv.length / 3;
        for (let s = 0; s < SEG; s++) bv.push(arm, s / SEG, -1, arm, s / SEG, 1);
        bv.push(arm, 1, 0);
        for (let s = 0; s < SEG - 1; s++) { const a = b0 + s * 2; bi.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        const a = b0 + (SEG - 1) * 2; bi.push(a, a + 1, a + 2);
      }
      base.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bv), 3)); base.setIndex(bi);
      const [e, w] = splitX(Math.min(n, 2000), { iPos: P, iDat: D });      // the densest seeds draw no more than 2000 (the triangle budget)
      const g = instanced(base, e.n, { iPos: e.iPos, iDat: e.iDat }); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 260);
      const m = new THREE.Mesh(g, mat(BRITTLE_VERT, BRITTLE_FRAG, { uTintA: { value: new THREE.Color(0.27, 0.27, 0.25) }, uTintB: { value: new THREE.Color(0.34, 0.24, 0.17) } }, { side: THREE.DoubleSide }));
      m.name = 'brittle-stars'; m.frustumCulled = false; scene.add(m); britM = m;
      const gw = instanced(base, w.n, { iPos: w.iPos, iDat: w.iDat }); gw.boundingSphere = g.boundingSphere;
      const mw = new THREE.Mesh(gw, m.material); mw.name = 'brittle-stars-slope'; scene.add(mw); cullBy(mw, w.iPos, w.n, REACH.brittle);
    }
    await ctx.yield();

    // ---- BED LIFE: the bed under the descent and the ring's shoulder carry sea stars, shells, brittle stars and white
    // crabs of their own, and squat lobsters ride the trees of the descent's grove (treeTips), swaying with them
    // (bedStep repeats STATIC_VERT's sway on the CPU). Lot 0, the descent (stream 'bed-approach': it follows the line):
    // beside the line from 150 u of run before the join (on the leg along the wall) round the turn to 14 u before it,
    // thickening toward the fall (four to five times as many to the unit by the tail as at the far end), up to 30 u
    // outside the line and 40 u inside it. Lot 1, the shoulder (stream RY): under and beside the last straight and on
    // down the slope past the ring. Each is a small mesh on the first scatter's geometry and material (no new program),
    // shown by the eye's distance (cullBy).
    const lobs = [], bedWalk = [[], []], bedCrab = [null, null];
    {
      const lotN = lerp(1, 0.45, smoothstep(1.0, 1.2, dens));      // (the densest seeds take fewer: the triangle budget)
      const RB = streamOf('bed-approach'), lotR = [RB, RY];
      const spot = (lot, sig) => {
        for (let t = 0; t < 14; t++) {
          let x, z;
          if (lot === 0) { const q = RB(), r = arc.rEnd - 14 - 136 * (0.35 * q + 0.65 * q * q), lat = clamp(RB.gauss() * sig, -30, 40), [x0, z0] = arc.plan(r), [tx, tz] = arc.tanAt(r); x = x0 - tz * lat; z = z0 + tx * lat; }
          else { const t2 = RY.range(-12, 84), w = RY.gauss() * sig; x = sS.x + hdS.x * t2 + perpS.x * w; z = sS.z + hdS.z * t2 + perpS.z * w; }
          const y = siltY(x, z, 0.6);
          if (y !== null) return [x, y, z];
        }
        return null;
      };
      const lotMesh = (src, name, lot, n, sig, reach, fill, quat = true) => {
        const P = new Float32Array(Math.max(1, n) * 4), Q = new Float32Array(Math.max(1, n) * 4), D = new Float32Array(Math.max(1, n) * 4); let c = 0;
        for (let k = 0; k < n; k++) { const p = spot(lot, sig); if (!p) continue; fill(p, c, P, Q, D, lotR[lot]); c++; }
        const g = instanced(src.geometry, c, quat ? { iPos: P, iQuat: Q, iDat: D } : { iPos: P, iDat: D });
        const m = new THREE.Mesh(g, src.material); m.name = name; scene.add(m); cullBy(m, P, c, reach);
      };
      const starFill = ([x, y, z], k, P, Q, D, rs) => { floorN(x, z, up); const a = rs() * TAU, q = quatTo(up, fw.set(Math.cos(a), 0, Math.sin(a))); P.set([x, y, z, rs.range(0.6, 1.25)], k * 4); Q.set([q.x, q.y, q.z, q.w], k * 4); D.set([rs() * TAU, 0, rs(), rs.range(0.6, 1.2)], k * 4); };
      const shellFill = ([x, y, z], k, P, Q, D, rs) => { floorN(x, z, up); up.x += rs.range(-0.15, 0.15); up.z += rs.range(-0.15, 0.15); const a = rs() * TAU, q = quatTo(up, fw.set(Math.cos(a), 0, Math.sin(a)));
        P.set([x, y, z, rs.range(0.12, 0.34)], k * 4); Q.set([q.x, q.y, q.z, q.w], k * 4); D.set([rs() * TAU, 0, rs.chance(0.5) ? rs.range(0, 0.12) : rs.range(0.3, 1), 0], k * 4); };
      const britFill = ([x, y, z], k, P, Q, D, rs) => { P.set([x, y - 0.04, z, rs.range(0.5, 1.05)], k * 4); D.set([rs() * TAU, rs() * TAU, rs(), rs.range(0.6, 1.2)], k * 4); };
      lotMesh(starM, 'sea-stars-approach', 0, Math.round(120 * lotN), 21, REACH.star, starFill); lotMesh(starM, 'sea-stars-shoulder', 1, Math.round(30 * lotN), 13, REACH.star, starFill);
      await ctx.yield();
      lotMesh(shellM, 'shells-approach', 0, Math.round(190 * lotN), 19, REACH.shell, shellFill); lotMesh(shellM, 'shells-shoulder', 1, Math.round(50 * lotN), 13, REACH.shell, shellFill);
      await ctx.yield();
      lotMesh(britM, 'brittle-stars-approach', 0, Math.round(640 * lotN), 13, REACH.brittle, britFill, false); lotMesh(britM, 'brittle-stars-shoulder', 1, Math.round(220 * lotN), 13, REACH.brittle, britFill, false);
      await ctx.yield();
      // white crabs walking short beats on the silt (bedWalk), and on lot 0 the squat lobsters on the trees (lobs)
      for (let lot = 0; lot < 2; lot++) {
        const nC = Math.round((lot === 0 ? 18 : 9) * lotN), tips = lot === 0 ? treeTips : [], nL = Math.min(tips.length, Math.round(22 * lotN)), n = nC + nL;
        const P = new Float32Array(n * 4), Q = new Float32Array(n * 4), D = new Float32Array(n * 4), ext = [], rs = lotR[lot];
        for (let k = 0; k < nC; k++) {
          const a = spot(lot, lot === 0 ? 12 : 8) || [pEnd.x, -999, pEnd.z], ang = rs() * TAU, len = rs.range(2.5, 5), bx = a[0] + Math.cos(ang) * len, bz = a[2] + Math.sin(ang) * len, by = siltY(bx, bz, 0.6), b = by === null ? a : [bx, by, bz];
          bedWalk[lot].push({ a, b, rate: rs.range(0.10, 0.2), ph: rs() * 10 }); ext.push(a[0], a[1], a[2], b[0], b[1], b[2]);
          P[k * 4 + 3] = rs.range(0.55, 0.8); Q[k * 4 + 3] = 1; D.set([rs() * TAU, 0, 0, rs.range(0.8, 1.3)], k * 4);
        }
        for (let k = nC; k < n; k++) {
          const t = tips.splice(rs.int(0, tips.length - 1), 1)[0], a = rs() * TAU, sc = rs.range(0.42, 0.58), q = quatTo(up.set(0, 1, 0), fw.set(Math.cos(a), 0.2, Math.sin(a)));
          lobs.push({ k, x: t[0], y: t[1] + t[3] * 0.85, ty: t[1], z: t[2], w: t[4], ph: t[5] * 0.37 + t[7] * 0.23, px: t[5], py: t[6], pz: t[7] }); ext.push(t[0], t[1], t[2]);
          P.set([t[0], t[1] + t[3] * 0.85, t[2], sc], k * 4); Q.set([q.x, q.y, q.z, q.w], k * 4); D.set([rs() * TAU, 1, 1, rs.range(0.5, 1.1)], k * 4);
        }
        const g = instanced(crabG, n, { iPos: P, iQuat: Q, iDat: D }); g.attributes.iPos.setUsage(THREE.DynamicDrawUsage); g.attributes.iQuat.setUsage(THREE.DynamicDrawUsage);
        const m = new THREE.Mesh(g, crabMesh.material); m.name = lot === 0 ? 'crabs-approach' : 'crabs-shoulder'; scene.add(m); cullBy(m, ext, ext.length / 3, REACH.crab, 3, 3);
        bedCrab[lot] = { P, Q, g, m };
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- hagfish knotting in the fallen baleen
    {
      const n = 14, P = new Float32Array(n * 4), D = new Float32Array(n * 4), b = A.baleen;
      for (let k = 0; k < n; k++) { const a = R() * TAU, r = Math.sqrt(R()) * 4.2, x = b.x + Math.cos(a) * r, z = b.z + Math.sin(a) * r * 0.8; P.set([x, Math.max(b.y, gh(x, z) + 0.5) + R.range(0, 1.1), z, R.range(1.8, 2.4)], k * 4); D.set([R() * TAU, R() * TAU, R(), R.range(0.7, 1.2)], k * 4); }
      const SG = 14, SD = 6, hv = [], hi = [];
      for (let s = 0; s <= SG; s++) for (let j = 0; j < SD; j++) { const a = (j / SD) * TAU; hv.push(s / SG, Math.cos(a), Math.sin(a)); }
      for (let s = 0; s < SG; s++) for (let j = 0; j < SD; j++) { const a = s * SD + j, c = s * SD + (j + 1) % SD; hi.push(a, c, a + SD, c, c + SD, a + SD); }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hv), 3)); base.setIndex(hi);
      const g = instanced(base, n, { iPos: P, iDat: D }); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(b.x, b.y, b.z), 12);
      const m = new THREE.Mesh(g, mat(HAG_VERT, HAG_FRAG, { uTintA: { value: new THREE.Color(0.36, 0.26, 0.30) }, uTintB: { value: new THREE.Color(0.50, 0.36, 0.38) } }, { side: THREE.DoubleSide }));
      m.name = 'hagfish'; m.frustumCulled = false; scene.add(m);
    }
    // ---- grenadiers (or ghost-pale ratfish), seventeen, hanging nose-down in loose company along the whole route, from
    // the entry on. The route's length is cut into seventeen equal runs and one fish hangs somewhere in each: 8 to 15 u
    // to one side of the line or the other and never nearer than 8 u to any point of it (13 or more from the rib cage to
    // the jaw arch, clear of the bones), 2.5 to 5 u over the silt, or, where the bed lies far under the line (beside the
    // wall, over the slope of the last straight), 9 to 14 u under the line; never in the wall or in a tree; each on a
    // heading of its own draw, every one the species' own size.
    {
      const n = 17, P = new Float32Array(n * 4), Q = new Float32Array(n * 4), D = new Float32Array(n * 4), tmp = new THREE.Vector3(), tg = new THREE.Vector3(), q = new THREE.Quaternion(), X = new THREE.Vector3(1, 0, 0);
      for (let k = 0; k < n; k++) {
        const d = (k + R.range(0.15, 0.85)) / n * L, over = R.range(2.5, 5), under = R.range(9, 14), lat0 = R.range(8, 15); let sd = R.chance(0.5) ? 1 : -1, x = 0, y = 0, z = 0;
        path.posAtDist(d, tmp); path.tangentAtDist(d, tg);
        const hl = Math.hypot(tg.x, tg.z) || 1, nx = tg.z / hl, nz = -tg.x / hl;
        for (let t = 0, flipped = false, lat = Math.max(lat0, tmp.x < 12 && tmp.x > -72 ? 13 : 0); t < 16; t++) {
          x = tmp.x + nx * sd * lat; z = tmp.z + nz * sd * lat; y = Math.max(surfY(x, z) + over, tmp.y - under);
          const inWall = z < cliffZ(x, y) + 9, inTree = treeAt.some(([tx, tz, th]) => (x - tx) * (x - tx) + (z - tz) * (z - tz) < (0.4 * th + 2.5) * (0.4 * th + 2.5));
          if (inWall && !flipped) { sd = -sd; flipped = true; continue; }
          if (inWall || inTree || path.distanceTo(x, y, z) < 8) { lat += 2.5; continue; }
          break;
        }
        const yaw = R.range(0, TAU), pit = R.range(0.5, 0.85);
        q.setFromUnitVectors(X, tg.set(Math.cos(yaw) * Math.cos(pit), -Math.sin(pit), Math.sin(yaw) * Math.cos(pit)));
        P.set([x, y, z, ratfish ? R.range(2.6, 3.2) : R.range(2.2, 2.8)], k * 4); Q.set([q.x, q.y, q.z, q.w], k * 4); D.set([R() * TAU, ratfish ? 1 : 0.2, R(), R.range(0.7, 1.1)], k * 4);
      }
      const g = instanced(fishGeo(), n, { iPos: P, iQuat: Q, iDat: D }); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 200);
      const m = new THREE.Mesh(g, instMat({ uTintA: { value: ratfish ? new THREE.Color(0.50, 0.54, 0.60) : new THREE.Color(0.34, 0.33, 0.34) }, uTintB: { value: ratfish ? new THREE.Color(0.60, 0.59, 0.64) : new THREE.Color(0.46, 0.44, 0.42) }, uBob: { value: 0.3 }, uGloss: { value: 0.35 } }));
      m.name = ratfish ? 'ratfish' : 'grenadiers'; m.frustumCulled = false; scene.add(m);
    }
    await ctx.yield();

    // ---- the sixgill. SIXGILL ROUTE: the far-side cruise, westward along the side of the bones away from the wall and
    // the descending lens (FAR: six stations, each 0.75 m inside the far edge of the stain, the edge being 3 m beyond the
    // outermost bone there, and never more than 2.5 m beyond the far rib tips, so over the spread flipper it keeps to the
    // ribs and passes above the finger bones; 2 to 2.4 m over the bed), round the skull inside the jaw arch, up the
    // palate into the nave along anchors.sharkLine, out over the tail and away above the lens
    const SL = 20;
    const sharkMat = mat(BODY_VERT, BODY_FRAG, { uSwim: { value: new THREE.Vector4(0, 1, 0, 0) }, uLen: { value: SL }, uFeat: { value: 1 },
      uBG: { value: mood.belly },
      uTop: { value: new THREE.Color(0.215, 0.180, 0.148) }, uBelly: { value: new THREE.Color(0.315, 0.288, 0.252) }, uEye: { value: new THREE.Color(0.20, 1.0, 0.40).multiplyScalar(0.9) } }, { side: THREE.DoubleSide });
    await ctx.yield();
    const shark = new THREE.Mesh(bodyGeo(SL, SHARK_PROF, 50, 24, SHARK_FINS), sharkMat);
    shark.name = 'sixgill'; shark.frustumCulled = false; scene.add(shark);
    await ctx.yield();
    const shl = A.sharkLine, sk = A.skullLine, skT = A.skullTip;
    const stainZ = (x) => { let z = 90; while (z > 0 && !onBone(x, z, 12)) z -= 0.5; return z; };      // the stain's far edge at x
    const FAR = [[64, 9.5], [40, 9], [16, 8.5], [-8, 9], [-30, 9.5], [-46, 8]].map(([x, y]) => [x, y, Math.min(stainZ(x) - 3, naveZ(clamp(x, -27, 7)) + 6.4 + 10)]), iSkull = FAR.length;
    await ctx.yield();
    const routePts = FAR.concat([[skT.x - 7, 4.2, skT.z + 12], [skT.x - 8.5, 2.6, skT.z + 1.5],
      [skT.x - 1, 5.0, skT.z + 0.6], [sk[Math.floor(sk.length / 2)].x, 8.0, sk[Math.floor(sk.length / 2)].z]]).map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    for (let i = shl.length - 1; i >= 0; i--) routePts.push(shl[i].clone());
    const e0 = shl[0];
    routePts.push(new THREE.Vector3(e0.x + 12, 9.8, e0.z - 1), new THREE.Vector3(e0.x + 28, 13.5, e0.z - 5), new THREE.Vector3(e0.x + 50, 22, e0.z - 13), new THREE.Vector3(e0.x + 84, 35, e0.z - 28), new THREE.Vector3(e0.x + 130, 46, e0.z - 46));
    const route = new THREE.CatmullRomCurve3(routePts, false, 'centripetal');
    const routeLen = route.getLength();
    await ctx.yield();
    // the meeting, by the route's own landmarks: its head reaches the lens at the middle of the nave
    const dMeet = lerp(uNave0, uNave1, 0.5) * L;
    let sMeet = 0, sSkull = 0;
    { const pm = path.posAtDist(dMeet, new THREE.Vector3()); let best = 1e9, bestK = 1e9; const pk = routePts[iSkull];
      for (let i = 0; i <= 500; i++) { route.getPointAt(i / 500, _q); const d = (_q.x - pm.x) ** 2 + (_q.z - pm.z) ** 2 + (_q.y > 12 ? 1e6 : 0); if (d < best) { best = d; sMeet = (i / 500) * routeLen; } const dk = _q.distanceToSquared(pk); if (dk < bestK) { bestK = dk; sSkull = (i / 500) * routeLen; } } }      // sSkull: where it comes round the skull's tip
    await ctx.yield();
    // Where it is on its route is a matter of the flight, never of the world's clock. From the join on: by the lens's
    // own distance to the meeting (so it comes up the nave to the lens on every visit). Before the join: by the
    // seconds flown (tOf), backward from where the join finds it, at the unhurried speed it has there (1.2 m/s).
    const sJoin = sMeet + (dTail - dMeet) * 0.71, vShark = 0.71 * vAt(dTail), tJoin = tOf(uTail);
    const sP = new THREE.Vector3(), sT = new THREE.Vector3(), sZ = new THREE.Vector3(), sY = new THREE.Vector3(), sTail = new THREE.Vector3(), sM = new THREE.Matrix4();
    const snout = new THREE.Vector3(), finL = new THREE.Vector3(), finR = new THREE.Vector3();
    let sharkS = 0;
    const sharkAt = (u, time) => {
      const rel = u * L - dMeet;
      const s = clamp(u < uTail ? sJoin - vShark * (tJoin - tOf(u)) : rel < 0 ? sMeet + rel * 0.71 : rel < 30 ? sMeet + rel * 0.78 : sMeet + 23.4 + (rel - 30) * 1.4, 8, routeLen - 0.5); sharkS = s;
      const sp = Math.max(0.5, s - 0.18 * SL);
      route.getPointAt(sp / routeLen, sP); route.getTangentAt(sp / routeLen, sT);
      sZ.crossVectors(sT, UP).normalize(); sY.crossVectors(sZ, sT);
      shark.position.copy(sP).addScaledVector(sT, -0.32 * SL);
      shark.quaternion.setFromRotationMatrix(sM.makeBasis(sT, sY, sZ));
      shark.updateMatrixWorld();
      route.getPointAt(Math.max(0, sp - 0.5 * SL) / routeLen, sTail);
      const off = sTail.sub(sP).addScaledVector(sT, 0.5 * SL).dot(sZ);
      const sw = sharkMat.uniforms.uSwim.value;
      sw.x = time * 1.5 + s * 0.3; sw.y = 1; sw.z = clamp(4 * off / SL, -0.9, 0.9);
      route.getPointAt(s / routeLen, snout);
      if (snout.x < shl[0].x + 5 && snout.x > shl[shl.length - 1].x - 5 && snout.y > 6) {
        hero.disturb(0, snout, 2.3);
        finL.set(2.1, -2.0, 4.0).applyMatrix4(shark.matrixWorld); finR.set(2.1, -2.0, -4.0).applyMatrix4(shark.matrixWorld);
        const inCage = finL.x < shl[0].x && finL.x > shl[shl.length - 1].x;
        hero.disturb(1, inCage ? finL : null, 1.8); hero.disturb(2, inCage ? finR : null, 1.8);
      } else { hero.disturb(0, null); hero.disturb(1, null); hero.disturb(2, null); }
    };

    // ---- the rare event: the living over the dead
    let whale = null;
    // (it crosses the bright water ahead of the entry, broadside, out from the wall over the terrace: its middle 37 to
    // 44 m ahead of the entry point and 12 m above eye level, its flukes clear of the overhang's lip; both it and its
    // shadow go by the place the flight has reached at the design's seconds, uAtSec)
    const W0 = new THREE.Vector3(X_IN + 150, H_IN + 48, Z_IN + 70), W1 = new THREE.Vector3(X_IN + 175, H_IN + 42, Z_IN + 190), wDir = W1.clone().sub(W0).normalize();
    const uW0 = uAtSec(1), uW1 = uAtSec(12), uSh0 = uAtSec(9);
    if (vary.rare) {
      const wm = mat(BODY_VERT, BODY_FRAG, { uSwim: { value: new THREE.Vector4(0, 0.3, 0, 0) }, uLen: { value: 112 }, uFeat: { value: 0 },
        uTop: { value: new THREE.Color(0.035, 0.05, 0.06) }, uBelly: { value: new THREE.Color(0.13, 0.17, 0.19) }, uEye: { value: new THREE.Color(0, 0, 0) }, uBG: { value: 1.35 } }, { side: THREE.DoubleSide });
      whale = new THREE.Mesh(bodyGeo(112, WHALE_PROF, 30, 14, WHALE_FINS), wm);
      whale.name = 'living-whale'; whale.frustumCulled = false; scene.add(whale);
      sZ.crossVectors(wDir, UP).normalize(); sY.crossVectors(sZ, wDir);
      whale.quaternion.setFromRotationMatrix(sM.makeBasis(wDir, sY, sZ));
    }
    await ctx.yield();

    // ---- marine snow, silt puffs, the fan of light from the ring
    // three depths of snow. Far: many dim flakes tinted well toward the water, soft discs never smaller than two soft
    // pixels (they are the haze, not stars). Middle: big soft flocs. Near (below):
    // soft round flakes drifting close past the lens.
    const snowN = lerp(0.55, 1, (detail - 0.6) / 0.4), farCol = mood.snowCol.map((h) => new THREE.Color(h).lerp(upC.clone().lerp(new THREE.Color(mood.low), 0.35), 0.7));
    const snow = fx.makeParticles({ rng: rng.fork('snow'), preset: 'snow', count: Math.round(4000 * Math.min(mood.snow, 2) * snowN), box: [180, 120, 180],
      velocity: [2.5, -0.75, 0.4], velocityRandom: [0.7, 0.35, 0.5], turbulence: [0.9, 0.35, 0.3], size: [0.09, 0.30], colors: farCol, intensity: 0.44, opacity: 0.75,
      additive: 0.15, shape: 'disc', core: 0.06, near: [6, 22], minAngle: 0.0046, time: U.uTime });
    snow.object.name = 'marine-snow'; scene.add(snow.object);
    const flocs = fx.makeParticles({ rng: rng.fork('flocs'), preset: 'snow', count: Math.round(1500 * Math.sqrt(mood.snow) * snowN), box: [120, 84, 120],
      velocity: [3.0, -0.6, 0.6], velocityRandom: [0.9, 0.4, 0.6], turbulence: [1.4, 0.5, 0.35], size: [0.22, 0.72], colors: mood.snowCol, intensity: 0.72, opacity: 0.5,
      additive: 0.15, shape: 'disc', near: [2.5, 10], core: 0.2, time: U.uTime });
    flocs.object.name = 'snow-flocs'; scene.add(flocs.object);
    await ctx.yield();
    const NP = 40, NLOOP = 26, pPos = new Float32Array(NP * 3), pLife = new Float32Array(NP * 3), pSize = new Float32Array(NP), puffS = [], fired = [];
    for (let k = 0; k < NP; k++) {
      if (k < NLOOP) {
        const f = R.int(0, nFeet - 1), a = R() * TAU, r = feet[f * 3 + 2] + 0.6, x = feet[f * 3] + Math.cos(a) * r, z = feet[f * 3 + 1] + Math.sin(a) * r;
        pPos.set([x, gh(x, z) + 0.15, z], k * 3); pLife.set([-R.range(0, 12), R.range(3, 4.5), R.range(6, 13)], k * 3); pSize[k] = R.range(0.8, 1.5);
      } else {
        const s = sMeet - 34 + (k - NLOOP) * 6.5; route.getPointAt(clamp(s / routeLen, 0, 1), _q);
        const x = _q.x + R.range(-1, 1), z = _q.z + R.range(-2, 2);
        pPos.set([x, gh(x, z) + 0.4, z], k * 3); pLife.set([-100, R.range(4, 5.5), 0], k * 3); pSize[k] = R.range(1.6, 2.4); puffS.push(s); fired.push(false);
      }
    }
    const puffG = new THREE.BufferGeometry();
    puffG.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pLifeA = new THREE.BufferAttribute(pLife, 3); pLifeA.setUsage(THREE.DynamicDrawUsage);
    puffG.setAttribute('aLife', pLifeA); puffG.setAttribute('aSize', new THREE.BufferAttribute(pSize, 1));
    puffG.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 200);
    const puffs = new THREE.Points(puffG, mat(PUFF_VERT, PUFF_FRAG, {}, { transparent: true, depthWrite: false, premultipliedAlpha: true }));
    puffs.name = 'silt-puffs'; puffs.frustumCulled = false; puffs.renderOrder = 2; scene.add(puffs);
    // the fan of the ring's light: one strength from every eye (how a ray fades close to an eye, or seen end on, is the
    // kit's own rule for every god ray)
    const back = sS.clone().sub(pEnd).normalize();
    const fan = fx.makeGodRays({ rng: rng.fork('fan'), position: pEnd.clone().addScaledVector(back, 3).toArray(), direction: back.clone().multiplyScalar(0.8).add(new THREE.Vector3(0, 0.5, 0)).normalize().toArray(),
      radius: 6, count: 14, length: 86, width: [2.2, 14], color: '#9FE8FF', intensity: 0.42, falloff: 1.5, speed: 0.6, near: [1.5, 6], fogAmount: 0.45, time: U.uTime });
    fan.object.name = 'portal-fan'; scene.add(fan.object);
    // a third, close layer of snow so that flakes are always drifting past the lens: soft round flakes, never streaks
    const nearSnow = fx.makeParticles({ rng: rng.fork('near-snow'), preset: 'snow', count: Math.round(1300 * Math.sqrt(mood.snow) * snowN), box: [46, 32, 46],
      velocity: [2.8, -0.7, 0.5], velocityRandom: [0.8, 0.35, 0.5], turbulence: [1.0, 0.4, 0.4], size: [0.06, 0.19], colors: mood.snowCol, intensity: 0.6, opacity: 0.5,
      additive: 0.2, shape: 'disc', core: 0.16, near: [1.4, 6], minAngle: 0.003, time: U.uTime });
    nearSnow.object.name = 'near-snow'; scene.add(nearSnow.object);
    await ctx.yield();

    // ---- gaze. Two targets, never more than weight 1 between them.
    // (1) The approach: the gaze is held on the skeleton (the design: "gaze held on the rib cage as the skeleton wheels
    // and grows"). ONE ramp turns it there, the designers' own: the pull rises from the place where the route passes the
    // entry tree (dTree: the route's nearest point to the tree's base, in units along it), not from the entry, over one
    // tail's length of flight. (The round's second ramp inside the target, a share of the angle by the eye's distance to
    // the tail's tip from 156 to 82 u, is gone; with it the swing onto the bones comes about two units of route sooner,
    // and the look is still part-way between the line of travel and the bones for some 18 u while the pull's own
    // weight rises.) The point it rests on slides from the middle of the curve to the rib arch's tail end as the eye closes
    // on the tail's tip from 95 to 30 u (the end of the skeleton it will round; that distance falls from the entry
    // until the eye passes the tip, well under 30 u by then), so the bones wheel round a held centre while they grow.
    // (2) The first hands over to the fixed target at the rib arch's tail end (weight 0.7) over one tail's length of
    // flight (HAND = tailLen, about 48 u), done two thirds of a tail's length before the join; the fixed target lets go
    // over the next tail's length, done a third of a tail's length past the join. Pace: THE FLIGHT'S SPEEDS above.
    const camP = new THREE.Vector3(), gaze = new THREE.Vector3(), tailTip = A.spineTop[0], HAND = tailLen, dTree = path.nearestXZ(PX2, PZ2).u * L;
    const archEnd = new THREE.Vector3(7, 6.5, naveZ(7));
    const gazeAt = (time, u) => {
      path.pointAt(u, camP);
      const dT = camP.distanceTo(tailTip), kk = smoothstep(95, 30, dT), tx = lerp(-6, 7, kk);
      gaze.set(tx, lerp(3, 6.5, kk), naveZ(clamp(tx, -27, 7))).sub(camP).normalize();
      return gaze.multiplyScalar(40).add(camP);
    };
    const pois = [{ at: gazeAt, from: dTree / L, to: (dTail - HAND * 2 / 3) / L, weight: 1, fade: HAND / (dTail - HAND * 2 / 3 - dTree) },
      { at: archEnd, from: (dTail + HAND / 3 - 2 * HAND) / L, to: (dTail + HAND / 3) / L, weight: 0.7, fade: 0.5 }];

    // ---- per-frame work
    const camW = new THREE.Vector3(), wk = new THREE.Vector3(), wn = new THREE.Vector3(), wt = new THREE.Vector3(), wf = new THREE.Vector3(), nearCrab = new THREE.Vector3();
    const crabStep = (time) => {
      let best = 1e9;
      for (let k = 0; k < nCrab; k++) {
        const w = walkers[k], P = w.pts, n = P.length - 1, tt = time * w.rate + w.ph, tri = Math.abs((((tt % 2) + 2) % 2) - 1), f = smoothstep(0.08, 0.92, tri) * n;
        const i = Math.min(n - 1, Math.floor(f));
        wk.lerpVectors(P[i], P[i + 1], f - i); wt.subVectors(P[i + 1], P[i]);
        if (w.mode === 1) radial(wk, wn).multiplyScalar(w.inner); else wn.set(0, 1, 0);
        wf.crossVectors(wn, wt); if (wf.lengthSq() < 1e-6) wf.set(0, 0, 1);
        if (w.mode !== 1) wk.addScaledVector(wf.normalize(), w.side);
        const d = wk.distanceToSquared(camW); if (d < best) { best = d; nearCrab.copy(wk); }
        wk.addScaledVector(wn, w.lift * cPos[k * 4 + 3] / 0.6);
        const q = quatTo(wn, wf);
        cPos[k * 4] = wk.x; cPos[k * 4 + 1] = wk.y; cPos[k * 4 + 2] = wk.z;
        cQuat[k * 4] = q.x; cQuat[k * 4 + 1] = q.y; cQuat[k * 4 + 2] = q.z; cQuat[k * 4 + 3] = q.w;
      }
      crabG.attributes.iPos.needsUpdate = true; crabG.attributes.iQuat.needsUpdate = true;
      hero.disturb(3, best < 60 * 60 ? nearCrab : null, 0.85);
    };
    crabStep(0);
    // the crabs of the two beds walk their beats; the lobsters on the trees move with the branch under them
    const bedStep = (lot, time) => {
      const W = bedWalk[lot], c = bedCrab[lot], P = c.P, Q = c.Q;
      for (let k = 0; k < W.length; k++) {
        const w = W[k], tt = time * w.rate + w.ph, tri = Math.abs((((tt % 2) + 2) % 2) - 1), f = smoothstep(0.08, 0.92, tri);
        wt.set(w.b[0] - w.a[0], 0, w.b[2] - w.a[2]); wn.set(0, 1, 0); wf.crossVectors(wn, wt); if (wf.lengthSq() < 1e-6) wf.set(0, 0, 1);
        const q = quatTo(wn, wf);
        P[k * 4] = lerp(w.a[0], w.b[0], f); P[k * 4 + 1] = lerp(w.a[1], w.b[1], f) + 0.33 * P[k * 4 + 3]; P[k * 4 + 2] = lerp(w.a[2], w.b[2], f);
        Q[k * 4] = q.x; Q[k * 4 + 1] = q.y; Q[k * 4 + 2] = q.z; Q[k * 4 + 3] = q.w;
      }
      if (lot === 0) {
        const t = U.uTime.value, ga = U.uGustAmp.value;
        for (const l of lobs) {
          const gs = 0.5 + 0.5 * Math.sin(TAU * (t * 0.2 - (l.px + 70) / 150 + 0.035 * Math.sin(l.pz * 0.21 + l.py * 0.17))), gf = 0.5 + 0.5 * Math.sin(t * 1.3 + l.px * 0.9 + l.pz * 0.7 + l.py * 0.5);
          const g = ga * (0.82 * gs * gs * gs * gs + 0.18 * gf * gf), osc = 0.6 + 0.4 * Math.sin(t * 0.8 + l.ph + l.ty * 0.3), wob = Math.sin(t * 1.7 + l.ph * 3 + l.x * 1.3 + l.ty * 0.9);
          P[l.k * 4] = l.x + ((0.45 + g) * osc + 0.12 * wob) * l.w; P[l.k * 4 + 1] = l.y - 0.14 * osc * l.w; P[l.k * 4 + 2] = l.z + (0.2 * Math.sin(t * 0.6 + l.ph) * osc + 0.3 * wob) * l.w;
        }
      }
      c.g.attributes.iPos.needsUpdate = true; c.g.attributes.iQuat.needsUpdate = true;
    };
    bedStep(0, 0); bedStep(1, 0);

    // ---- POST: exposure, fog (set with the mood above), bloom and grade
    const post = { exposure: mood.exposure, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 },
      grade: { saturation: mood.sat, contrast: CONTRAST, tint: '#ffffff', shadowTint: mood.shadowTint, vignette: 0.35, grain: 0.02, aberration: 0 } };

    return {
      scene, path, duration: DURATION, pace, title: mood.title,
      camera: { fov: 62, near: 0.2, far: 1400, lookAhead: 16, sway: 0.25, bank: 0.5 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#9FE8FF', glow: 0.8, revealDistance: 140, tilt: true },
      post,
      ride: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);                       // sets uTime, uCamL and the pixel scale for every shader here
        camera.getWorldPosition(camW);
        // the water is clearer high over the bed than down in the layer of drifting silt that hangs over it: the brief's
        // fog within 14 u of the bed, a fifth thinner from 44 u up (a uniform, no new program)
        scene.fog.density = mood.density * lerp(1, 0.8, smoothstep(14, 44, camW.y - floorY(camW.x, camW.z)));
        dome.position.copy(camW);
        sharkAt(u, time);
        crabStep(time);
        for (const e of eyeCull) e[0].visible = camW.distanceToSquared(e[1]) < e[2];      // the bed's small life, by the eye's distance (meshes shown or hidden: no new program)
        for (let lot = 0; lot < 2; lot++) if (bedCrab[lot].m.visible) bedStep(lot, time);
        const tailS = sharkS - SL;
        let dirty = false;
        for (let i = 0; i < puffS.length; i++) {
          if (tailS >= puffS[i] && !fired[i]) { fired[i] = true; pLife[(NLOOP + i) * 3] = time + (i % 3) * 0.25; dirty = true; }
          else if (tailS < puffS[i] - 2 && fired[i]) fired[i] = false;
        }
        if (dirty) pLifeA.needsUpdate = true;
        if (whale) {
          const f = clamp((u - uW0) / (uW1 - uW0), 0, 1);
          whale.position.lerpVectors(W0, W1, f).addScaledVector(wDir, Math.sin(time * 0.1) * 2);
          whale.material.uniforms.uSwim.value.x = time * 0.8;
          const c = U.uCloud.value, k = clamp((u - uSh0) / (uW1 - uSh0), 0, 1);      // its shadow runs the skeleton from tail to jaw in one pass, the design's 9 to 12 s
          c.set(lerp(120, -100, k), 0, 22, 0.72 * smoothstep(0, 0.12, k) * (1 - smoothstep(0.84, 1, k)));
        }
        // the sixgill's own soft shade on the bed while she cruises the open bed (it fades as she comes round the skull):
        // h is her height over the bed under her; the shade lies off from her by the key's lean (h times the level part of
        // the key's direction over its upright part), wider (9 + 0.6 h) and fainter the higher she swims, never darker than it was
        if (!whale) { const c = U.uCloud.value, sp = shark.position, h = Math.max(0, sp.y - floorY(sp.x, sp.z)); c.set(sp.x - h * keyDir.x / keyDir.y, sp.z - h * keyDir.z / keyDir.y, 9 + 0.6 * h, 0.34 * (1 - smoothstep(sSkull - 24, sSkull, sharkS)) * (1 - smoothstep(4, 22, h) * 0.6)); }
        snow.update(dt, time, camera); flocs.update(dt, time, camera); nearSnow.update(dt, time, camera);
        fan.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};
