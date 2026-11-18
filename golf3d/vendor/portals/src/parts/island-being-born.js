// THE ISLAND BEING BORN: hero set piece for the world "island-being-born".
//
// What it is
//   A Surtseyan eruption seen from its own breach. A horseshoe tuff CONE (bedded black and brown-grey
//   ash, rills, slump scars, wave-cut cliff, surf, sulphur patches, ash avalanches) with two mouths in
//   its flooded crater. From the black vent K a fan of cock's-tail JETS fires every 3 s: glowing
//   bombs leading black feathered tails that sag, pale and rain out; splashes and steam plumes where
//   bombs land. Over K a boiling ash-black TRUNK, over the steam pit W a boiling white one, lit
//   geometry with a hard terminator; they braid at 650 m into one COLUMN that leans downwind to an
//   anvil at ~6 km, with a slate ASH CURTAIN under its lee. LIGHTNING forks in the black trunk and
//   lights the turrets. After every fourth (big) volley a base SURGE races out over the lagoon and
//   through the breach: a wall of ~250 small overlapping grey lobes in four stepped rows (skirt, face,
//   crest, body) with a sprite fringe on its crest and a mist skirt at its foot; lobes melt away before
//   they are within ~50 m of the camera. THE SLOT WALLS (the closest pass): the ~75 lobes that face the slot
//   are finely tessellated, boil in a domed cauliflower form and are studded with ~300 TURRETS (and up to ~230 more that only
//   exist during the climb: on the roof by the portal, across seams, and the turrets of the line), small lobes
//   (7 to 20 m caps) that stand ALL ROUND their lobe, wherever its surface is the cloud's own outside (each lobe deals its
//   turrets' places from its own stream; none is turned toward the route, the eye or the portal: see TURRETS in buildClouds);
//   a turret rides its lobe's boil (attribute aKid) and swells on its own beat, and sheds two noise-eroded wisps from its outline. Every lobe is shaded
//   by the true normal of its boiling surface (computed in the vertex shader), so the mesh's own turrets carry
//   sunlit caps and crescent shadows; shadowed faces keep form from light thrown back by the sunlit steam below
//   and, on the black wall, by the white wall across the slot. The root burst is a low black dome and a ring
//   of many small soft steam domes under a sprite skirt. The ASH CURTAIN is two wide soft veils hung across
//   the wind 1.6 and 2.3 km downwind, bowed round the island, so it is never seen edge-on: each fades to nothing at
//   both side edges and its top (uv across and up, one noise per sheet), carries short soft falling streaks, is fogged per
//   pixel and is cut by the surge's mist.
//   WHERE THE DETAIL GOES IS A RULE IN SPACE: a lobe's distance and bearing to the climb line (CL_A + t CL_D, the straight
//   line the route climbs up the slot). Fine meshes (built twice: very fine for the climb, a coarse twin for everywhere else)
//   go to the upper slot's 26 nearest lobes, the 12 nearest of the line's first third, the 5 nearest left anywhere along it and
//   the roof ring's 5; the four nearest of all have a finer mesh still (3,920 triangles). TURRETS OF THE LINE (up to 230) are seated
//   on those lobes, the nearer the more (3 to 11), all round each by the same rule as every other turret.
//   Their seats are not fixed: the vertex shader works out the lobe's boiling surface in the turret's direction and stands the
//   turret 0.6 sunk in it (a fixed seat was buried, or hung clear over a hollow of the boil): low domes, not warts. The roof
//   ring's own turrets are seated the same way and keep to the side of their lobe the sun does not reach.
//   FORM: within 190 to 340 m the slot's lobes and turrets darken in their seams whatever
//   the sun's angle (broad soft blue-grey valleys and lit caps on steam: cauliflower domes; blue-black seams and charcoal caps
//   with a cold sky sheen on ash), so a front-lit face is still a crowd of turrets; the range grows with height (0.7 m for every
//   metre above 200 m), so the braid over the portal has that form from the whole climb while nothing changes as seen from the
//   sea. During the climb every lobe that is not one of the very fine ones has its second octave of cells (10 to 18 m) promoted
//   from a crinkle to turrets (kind 0.75: full seams, steeper domes). The roof ring's five lobes do not rise and sink
//   (a lobe being born under the ring hung below the portal as a pale ball), and every other lobe is born from nothing deep
//   inside its trunk and sinks back to nothing (at 0.42 of its size a newborn showed through the braid as a bare ball).
//   THE ANVIL is one shelf: fourteen lobes fill the smear between its scattered top lobes, which from the slot (its line of
//   sight runs downwind under the braid) were bare pale balls hanging in the sky below the portal; above 3 km a lobe's cells
//   are 0.4 of its radius (95 m cells are under a pixel from 8 km below: each lobe shaded as one smooth ball). Above 3 km the faces
//   that look down are in the shelf's own shade (no sun, no moon, no bounce from the trunks): the anvil seen up the slot is a slate
//   underside with lit flanks, and every cell of it has a paler crown and a deep seam (see "THE ANVIL" in CLOUD_FRAG): a crowd of
//   billows by day and by moonlight, not a bunch of smooth balls.
//   THE CORES (a tube inside each trunk and the column, dark between the lobes) keep to 0.66 to 0.8 of their radius: boiling
//   to 1.23 like a lobe they stood proud of the lobes, broad smooth faces 20 segments round beside the climb and the portal.
//   They take no sun or moon (kind -0.25): what shows of one through a gap is the shadow colour, the bottom of a crevice.
//
// Local space
//   Origin = centre of the island at still sea level (brief's C), +Y up, front +Z. No rotation is
//   needed: place hero.object at world (120, 0, -800) and the brief's coordinates line up
//   (local = world - C). The breach opens toward B = (-0.741, 0, 0.671); K = +P*130, W = -P*130 with
//   P = (0.671, 0, 0.741). Seen from the breach: black right, white left, slot between.
//
// Clocks (nothing here depends on wall time once the world drives it)
//   hero.setClock(sec | null)   the eruption clock. Volley n fires at clock = 3 n; n % 4 == 0 is a full
//                               420 m volley; its surge starts at 3 n + timeline.surgeDelay and runs
//                               12 s at 30 m/s from K. null (default) = follow update()'s time.
//   hero.setBriefTime(sec)      shorthand: clock = timeline.clockAtBriefTime(sec) = sec + 24.5, which puts a big
//                               volley's collapse at the brief's 22 s of 50 (surge reaches the breach axis
//                               (-246,223) about 9 s later). The piece keeps no table of its own between the
//                               flight's places and seconds: the world has the one map (from its pace) and
//                               drives setClock with it.
//   hero.surge(clock)           -> { active, radius, height, center:Vector3(K), strength } for the fog
//                               ramp and sea whitening.   hero.surgeArrival(x, z) seconds after the
//                               surge starts that its front reaches local (x, z).
//   hero.heightAt(x, z)         cone height (m, negative under water) for shoal maps and foam.
//   hero.setLight({ sunDir, sunColor, skyColor, sunIntensity, skyIntensity, night })
//   hero.setHaze(color, density)                 distance haze (exp2), the piece's own: scene.fog is NOT read.
//   hero.setMist(density, top, color, radius)    the surge's mist: a cylinder of that radius round K (world
//                               space), below `top` metres; fogs only the part of each sight line inside it.
//                               ONE FOG LAW ON A SIGHT LINE (the surge round of 11 Oct): THE LAYER'S TOP IS LEVEL. The line of ibFogV
//                               that gave it a slow billow by place (0.2 of the top either way, read at the body's own place) is out.
//                               Why: the world's sky veil and its sea now take this same law, and a law that gives two bodies on one sight line
//                               two tops cannot give the sky behind them the mist of either; read anywhere along the sight line
//                               instead, a top that differs from bearing to bearing made the sky's mist flip, bearing by bearing, for
//                               an eye at the top's own height. And the cylinder's side is soft for an eye outside it (the last line
//                               but one of ibFogV: the mist thins to nothing over the body's outer 80 m): a hard side is a soft step
//                               on a body but a straight upright edge on open sky. Nothing else of the fog (the haze, the two tops,
//                               the density, the tone, who reads it) is changed; for an eye 30 m and more behind the front only the
//                               top's billow differs from the live version's.
//   hero.setSurgeColor(color)   albedo of the surge lobes.   hero.uniforms.uSurge.y = surge strength (0 hides it).
//   hero.setSurgeShown(bool)    draw none of the surge's mesh while no surge is out (the world does: it saves 33k triangles).
//   hero.setNear(bool)          the 43 trunk lobes nearest the climb line and the roof ring's 5 exist twice (and, on 980-triangle meshes, the lobes of the trunks' heads and the column's first ring above the braid: params.topLobes): fine meshes (2,420
//                               triangles each, three octaves of real relief: a face is a dozen turrets) for the climb,
//                               coarse twins for everywhere else. false (default) shows the twins. Swap out of sight.
//   hero.setNearGrow(k)         0..1 (default 1): at 0 the fine lobes carry only their twins' relief and the climb-only turrets are
//                               drawn in to nothing; ease it to 1 after the swap, so nothing pops.
//
// anchors (local space)
//   ventK, ventW        the two mouths at sea level.      breachDir   unit vector out of the breach.
//   jetsMid             K + 200 m: gaze target for the jets.   slotMid  centre of the slot at 250 m.
//   portalSeat          { position (37,430,-33), normal (toward the climbing camera), radius 9,
//                         pitchDeg 58 }: the brief's portal, in the top of the slot.
//   roof                the slate braid 220 m beyond the portal along the climb.
//   flyThrough          the brief's path in local space: run-in (its first 80 m turned 8 degrees to
//                       starboard, so the entry axis passes between the two trunks), round the left horn,
//                       breach axis, 58 degree climb up the slot. Clearance: > 60 m from the cone, >= 45 m
//                       from either trunk's lobes, >= 22 m from any turret (jets never aim across the slot;
//                       lightning stays inside the black trunk below 420 m and away from the portal).
//   viewpoints          { entry, jadeLine, heldBreath, slotBase }.
//
// opts
//   palette      [cobalt, jade, ashBlack, steamWhite, shadowBlueGrey, ochre, bombOrange]
//   sunDir       Vector3 toward the sun (default 28 degrees up, behind the breach camera)
//   sunColor, skyColor, sunIntensity (1), skyIntensity (1), night (false: true = moonlit balance)
//   lean         column lean in degrees (default per seed 18-30; 'light' wind 12, 'strong' 40)
//   age          0..1 (default per seed): 0 = low 80 m cone and wide breach, 1 = 150 m, narrow breach
//   columnHeight metres (default 6000)      curtain (true)   seaFoam (true: surf, cascade, surge wash)
//
// Size: cone base 660-700 m across, 80-150 m high; trunks to 650 m; column to columnHeight leaning
//   ~0.45 x height downwind (+x, -z). radius/height returned (340 / 560) frame cone + trunks + jets.
// Cost: ~263k triangles with the coarse twins, ~400k with the fine lobes (clouds 153 to 158k + coarse twins 21 to 25k or fine ~170k, the fine set carrying
//   the climb-only turrets and the turrets of the line; surge 39k while shown; jets 10k), 13 draw calls (cone, clouds, near or far lobes, surge, jets, bombs, bomb glow, puffs, lightning, curtain, wash, soft edges), no lights, no pictures: two small data maps (1408 x 112) of the inner wall's relief and one table (2048 x 8) of the beds' stack, and the crest line (1408 x 1), baked from the height field. Build ~500 ms here plus ~300 ms for the maps, yielding throughout.
//   JETS: a tail is the ejecta that left with its bomb, each part at its own fraction of the bomb's speed (the live version's
//   own tail: ibTail(v0, age, tau), its width, alpha, outline and paling): a blunt black cypress, 2 to 5 m in half-width at the
//   bomb and 19 to 32 m lower down, lumpy outline, brown-grey sheath. Each part pales and rains out once it is falling (root
//   first), an old tail pales to brown-grey and thins to a veil: none is solid after 5.8 s, none is left after 8 to 11 s, and what
//   falls has gone before it is 10 m above the sea. From 0.88 of its rise the bomb also trails a thin line of steam (the same
//   mesh's second set of ribbons). Ash tails fade seen within 41 to 18 degrees of end-on, steam within 26 to 8; both within 70-150 m.
//   The fan is +-72 degrees round the across-breach axis, away from the slot, and the fingers leave the black trunk's rim 82 m from K.
//   TURRETS also sit on the seams where two of the upper slot's fine lobes meet (params.creaseTurrets).
//   The WASH mesh also carries the CRATER LAKE as the climb sees it from above (milky jade, ochre threads, foam round the vents).
//   Its other two rings (cascade, surge whitening) are wound facing down and so do not show from above the water: the lake
//   draws the cascade's streaks itself, and the world greys the sea under the surge.
//   The sheet ends at the lake's shore (by the ground's height), so the cone's own surf shows round it.
//   THE CONE'S GROUND HAS TWO LAWS, parted by the height field's own crest line (the map uCrest; see the cone's fragment shader).
//   OUTSIDE the crest, the whole outer flank, it is drawn as it always was: broad warped beds, fine beds that fade with distance.
//   INSIDE the crest THE INNER WALL IS BEDDED ASH as falls lay it (the table uBeds): beds of unequal thickness, black and
//   brown-grey, that drape the wall, pinch out, and are offset and tilted in a slump's block; and it is shaded per pixel from maps
//   baked in buildCone: gullies that head under the rim, join downward and end in fans, the slump scars' dropped blocks and
//   rubble, the true normal, hollows darker, and the ash avalanches as tongues of dry ash that trickle down the gullies at 2.2 m
//   of height a second. The inner wall's law comes in over the first 6 m of ground inside the crest line.
//   params.turrets / params.slotLobes / params.lineTurrets / params.lowLobes / params.upLobes report the counts.
//   RANDOM STREAMS: the trunks, the column, bombs, puffs, lightning and the curtain draw from the piece's own stream in that order;
//   the root bursts, the surge and the soft sprites (lobewisps, fringe, kidwisps) each have a fork of their own; the anvil's
//   shelf and EVERY LOBE'S TURRETS are dealt from a stream made of that lobe's own seed (a seam's from its two lobes' seeds).
//   SPRITES: a bomb's splash is a crown that fans outward, solid at the root, torn to shreds and drops at the tips, on a mist foot; a fumarole's wisp is a
//   wide soft plume leaning downwind; a bomb's steam trail is cut by the surge's mist like everything else.
// Lighting: unlit by the scene: every shader takes the sun/sky from setLight() so steam peaks at
//   albedo 0.78 under a key of intensity 1 and shadows stay blue-grey. Atmosphere: setHaze / setMist above.
//   Bombs emit ~4.5, lightning ~6 (these are the only things meant to bloom).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1B4FA8', '#3FA98C', '#15161A', '#F1EEE6', '#7F93AD', '#B58A3A', '#FF5A1F'];
const BX = -0.741, BZ = 0.671, PX = 0.671, PZ = 0.741;      // breach axis B, across-breach axis P
const VENT_OFF = 130, PERIOD = 3, BIG_EVERY = 4, SLOTS = 8, FINGERS = 10, GRAV = 9.81;
const SURGE_DELAY = 13, SURGE_SPEED = 30, SURGE_R0 = 50, SURGE_LIFE = 12;

// ---------------------------------------------------------------- shared GLSL
const NOISE_GLSL = /* glsl */`
float ibH13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float ibH11(float n){ n = fract(n*0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
float ibH12(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y)*q.z); }
float ibVN(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(ibH13(i), ibH13(i + vec3(1,0,0)), f.x), mix(ibH13(i + vec3(0,1,0)), ibH13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(ibH13(i + vec3(0,0,1)), ibH13(i + vec3(1,0,1)), f.x), mix(ibH13(i + vec3(0,1,1)), ibH13(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float ibVN2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(ibH12(i), ibH12(i + vec2(1,0)), f.x), mix(ibH12(i + vec2(0,1)), ibH12(i + vec2(1,1)), f.x), f.y);
}
// billow, 0..1. dm 0: the ridged form the far lobes are built from. dm 1: the cauliflower form of the slot's lobes and
// turrets: a sharp crease where the noise crosses its middle value, and either side of it the surface domes up steeply and rounds over.
float ibBillow(vec3 p, float dm){ float a = abs(2.0*ibVN(p) - 1.0), b = 1.0 - min(a*1.9, 1.0); return mix(1.0 - a, 1.0 - b*b, dm); }
`;
const LIGHT_PARS = /* glsl */`
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uSkyCol; uniform float uNight;
`;
// The piece's own atmosphere (scene.fog is not read): a thin haze by distance, 2 km deep (uHaze: rgb, density) and
// the SURGE MIST, thick ash-laden air filling a cylinder round the vent (uMistCyl: x, z, radius) up to
// uMist.y (uMist.x = density): only the part of the sight line that runs inside it is fogged, so the wall
// comes on through clear air, the trunks overhead ghost through from inside, and the camera bursts out of its top.
// THIS IS THE ONE FOG LAW OF A SIGHT LINE THROUGH THE SURGE'S MIST: the world file copies the mist's half of ibFogV letter for letter
// (its MIST_LAW, mistShare) with these same uniforms (uMist, uMistCyl, uMistCol); its sky veil reads it for a point 3,000 m off and its
// sea for the water's own point. Whoever retunes it here retunes it there. Two lines of it differ from the live version before this round: the top is level (no billow by place), and the side is soft (see below).
const FOG_PV = /* glsl */`
uniform vec4 uHaze; uniform vec4 uMist; uniform vec4 uMistCyl; varying vec2 vFog;
vec2 ibFogV(vec3 wp){
  vec3 d = wp - cameraPosition; float dist = length(d), cy = cameraPosition.y;
  // the stretch of the sight line (0..1) below the layer top (two tops averaged, so the bank's upper edge is soft) ...
  // (THE TOP IS LEVEL: every body on one sight line, and the sky behind them (the world's sky veil copies this law for a point 3,000 m off),
  // stand under one top and take one mist. The live version gave the top a slow billow read at the body's own place: a trunk's flank and
  // the sky beside it then stood under tops up to 0.4 of the layer apart, an outline of tone alone; and read anywhere along the sight line,
  // a top that differs from bearing to bearing made the sky's mist flip between bearings for an eye at the top's own height. uMistCyl.w, the
  // billow's time, is no longer read, and setMist no longer writes it)
  float top = uMist.y;
  float ta = top*0.62, tb = top*1.38, dyq = abs(d.y) < 1e-3 ? 1e-3 : d.y;
  float ha = cy < ta ? (d.y > 0.0 ? clamp((ta - cy)/dyq, 0.0, 1.0) : 1.0) : (d.y < 0.0 ? 1.0 - clamp((ta - cy)/dyq, 0.0, 1.0) : 0.0);
  float hb = cy < tb ? (d.y > 0.0 ? clamp((tb - cy)/dyq, 0.0, 1.0) : 1.0) : (d.y < 0.0 ? 1.0 - clamp((tb - cy)/dyq, 0.0, 1.0) : 0.0);
  // ... and inside the surge's cylinder round the vent (uMistCyl: centre x, z, radius)
  vec2 a = cameraPosition.xz - uMistCyl.xy;
  float A = dot(d.xz, d.xz), B = dot(a, d.xz), C = dot(a, a) - uMistCyl.z*uMistCyl.z, disc = B*B - A*C, t0 = 0.0, t1 = 0.0;
  if (A < 1e-6) { t1 = C < 0.0 ? 1.0 : 0.0; }
  else if (disc > 0.0) { float sq = sqrt(disc); t0 = clamp((-B - sq)/A, 0.0, 1.0); t1 = clamp((-B + sq)/A, 0.0, 1.0); }
  // (a camera below a top sees the low stretch first, one above it sees it last)
  float fa = cy < ta ? max(min(t1, ha) - t0, 0.0) : max(t1 - max(t0, 1.0 - ha), 0.0);
  float fb = cy < tb ? max(min(t1, hb) - t0, 0.0) : max(t1 - max(t0, 1.0 - hb), 0.0);
  // (the haze is a layer 2 km deep: only the stretch of the sight line below it counts. Hazed by its whole 8 km, the anvil seen
  // up the slot was two thirds horizon colour, each lobe a pale smooth disc against the darker sky overhead; nothing below 2 km changes)
  float hf = cy < 2000.0 ? (d.y > 0.0 ? clamp((2000.0 - cy)/dyq, 0.0, 1.0) : 1.0) : (d.y < 0.0 ? 1.0 - clamp((2000.0 - cy)/dyq, 0.0, 1.0) : 0.0);
  // (THE BODY'S SIDE IS SOFT, SEEN FROM OUTSIDE: for an eye outside the cylinder the mist thins to nothing over the body's outer 80 m,
  // by how near the sight line passes the vent's axis in plan. With a hard side, a line that just grazed the cylinder took a quarter of
  // the mist within a metre of its edge: on a body that is a soft step, but on open sky, which now takes this same law, it stood as a
  // straight upright edge of tone. An eye inside sees no side: the thinning eases out over the first 30 m the eye stands inside the body)
  float side = smoothstep(0.0, 80.0, uMistCyl.z - sqrt(max(dot(a, a) - B*B/max(A, 1e-6), 0.0))*clamp((length(a) - uMistCyl.z)/30.0 + 1.0, 0.0, 1.0));
  float L = dist*0.5*(fa + fb)*uMist.x*side, hz = dist*hf*uHaze.w;
  return vec2(1.0 - exp(-hz*hz), 1.0 - exp(-L*L));
}
`;
const FOG_V = /* glsl */`vFog = ibFogV(cameraPosition + transpose(mat3(viewMatrix))*mvPosition.xyz);`;
const FOG_PF = /* glsl */`uniform vec4 uHaze; uniform vec4 uMist; uniform vec3 uMistCol; varying vec2 vFog;
`;
const FOG_F = /* glsl */`gl_FragColor.rgb = mix(mix(gl_FragColor.rgb, uHaze.rgb, vFog.x), uMistCol, vFog.y);`;

// ---------------------------------------------------------------- column profile (JS)
function slotHalf(y) { return y < 250 ? 55 + 20 * (y / 250) : 75 * Math.max(0, 1 - Math.pow(Math.min(1, (y - 250) / 400), 1.6)); }
function trunkR(y) { return y < 250 ? 75 - 5 * (y / 250) : 70 + 100 * smoothstep(0, 1, (y - 250) / 400); }
function columnR(y) { return 215 + Math.max(0, y - 650) * 0.15; }
function leanOff(y, tanLean) { const d = Math.max(0, y - 300); return tanLean * d * d / (d + 200); }

// ---------------------------------------------------------------- the cone's height field
function makeConeField(noise, P) {
  const thB = Math.atan2(BZ, BX);
  // (coneH.wall: after a call, the wall's own places at that point, read off the very terms that shape it: cut = the metres the
  // thread rills have taken out there (inside and outside the rim), s = how far down the inner wall the point lies (0 at the rim's
  // crest, 1 at the wall's foot; under 0 outside the rim), gate = 1 on the cone and 0 in the breach, scarI = the number of the slump
  // scar that is deepest there and scarU = how far round the wall from that scar's axis, in the scar's own widths, with its side's
  // sign, rr = the crest line's distance from the island's middle on that bearing (where s is 0: the outer flank's law ends and
  // the inner wall's begins); nothing of the height changes)
  const wall = { cut: 0, s: -1, gate: 1, scarI: -1, scarU: 0, rr: 0 };
  coneH.wall = wall;
  return coneH;
  function coneH(x, z) {
    wall.cut = 0; wall.s = -1; wall.scarI = -1; wall.scarU = 0;
    const r = Math.hypot(x, z), th = Math.atan2(z, x);
    let d = Math.abs(th - thB); if (d > Math.PI) d = 2 * Math.PI - d;
    const cx = Math.cos(th), sz = Math.sin(th);
    const nA = noise.n2(cx * 1.7 + P.o1, sz * 1.7 - P.o1), nB = noise.n2(cx * 4.3 - P.o2, sz * 4.3 + P.o2);
    const Hc = lerp(P.hornH, P.backH, smoothstep(0.42, 2.5, d)) * (1 + 0.10 * nA + 0.05 * nB);
    const Rr = P.rimR * (1 + 0.05 * nA + 0.02 * nB), Rb = P.baseR * (1 + 0.07 * nB + 0.04 * noise.n2(cx * 2.6 + 9, sz * 2.6));
    wall.rr = Rr;
    let h;
    if (r >= Rr) {
      const t = clamp((r - Rr) / (Rb - Rr), 0, 1.6);
      h = Hc * Math.pow(Math.max(0, 1 - t), 1.45) - 5 * t * t;
      // rills: radial gullies that deepen down the flank
      const flank = smoothstep(0.02, 0.25, t) * (1 - smoothstep(0.75, 1.0, t));
      const g = Math.abs(noise.n2(th * P.rillF + nA * 2, r * 0.004 + P.o1));
      h -= (1 - smoothstep(0, 0.32, g)) * 7.5 * flank * (Hc / 110);
      wall.cut = (1 - smoothstep(0, 0.32, g)) * 7.5 * flank * (Hc / 110);
    } else {
      const s = (Rr - r) / P.innerW;
      h = Hc * (1 - Math.pow(smoothstep(0, 1, s), 0.75)) - 9 * smoothstep(0.55, 1.15, s);
      let sc = 0;
      for (let i = 0; i < P.scars.length; i++) { const S = P.scars[i]; let a = Math.abs(th - S.th); if (a > Math.PI) a = 2 * Math.PI - a; sc += S.depth * Math.exp(-(a * a) / (S.w * S.w)); }
      h -= sc * Math.sin(Math.PI * clamp(s, 0, 1)) * (Hc / 110);
      const g = Math.abs(noise.n2(th * P.rillF * 1.6 - 4, r * 0.006));
      h -= (1 - smoothstep(0, 0.3, g)) * 4 * Math.sin(Math.PI * clamp(s, 0, 1));
      wall.cut = (1 - smoothstep(0, 0.3, g)) * 4 * Math.sin(Math.PI * clamp(s, 0, 1)); wall.s = s;
      for (let i = 0, best = 0; i < P.scars.length; i++) { const S = P.scars[i]; let a = th - S.th; a -= 2 * Math.PI * Math.round(a / (2 * Math.PI)); const e = S.depth * Math.exp(-(a * a) / (S.w * S.w)); if (e > best) { best = e; wall.scarI = i; wall.scarU = a / S.w; } }
    }
    // rounded crest
    h -= 5 * Math.exp(-((r - Rr) * (r - Rr)) / 90) * (Hc / 110);
    h += (2.2 * noise.fbm2(x * 0.03, z * 0.03, 3) + 5 * (noise.ridged2(x * 0.011 + 5, z * 0.011, 3) - 0.45)) * smoothstep(-2, 14, h);
    // the breach: a flaring channel along B
    const al = x * BX + z * BZ, pe = Math.abs(x * PX + z * PZ);
    const half = P.breachW * 0.5 + Math.max(0, al - 150) * 0.35 + 14 * nB;
    const pj = pe + 20 * noise.fbm2(x * 0.021 + 3, z * 0.021, 3);
    const m = lerp(1, smoothstep(half - 28, half + 55, pj) * (0.9 + 0.1 * smoothstep(half + 20, half + 90, pj)), smoothstep(-30, 40, al));
    h = lerp(-9, h, m);
    wall.cut *= m; wall.gate = m;
    // wave-cut platform and a 4 m cliff
    if (h > 0) { const b = smoothstep(0.7, 2.1, h); h = h * lerp(0.4, 1, b) + 4 * b; }
    return h;
  }
}

// ---------------------------------------------------------------- CONE mesh + material
async function buildCone(ctx, coneH, P, fumaroles, U, pal) {
  const NA = 176, NR = 84, R0 = 62, R1 = P.baseR * 1.2;
  const nv = (NA + 1) * (NR + 1);
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), dat = new Float32Array(nv * 2);
  // radial rows packed toward the rim and the shore
  const rows = [];
  for (let j = 0; j <= NR; j++) { const t = j / NR; rows.push(lerp(R0, R1, 0.5 * t + 0.5 * smoothstep(0, 1, t) * (0.35 + 0.65 * t))); }
  let k = 0;
  for (let i = 0; i <= NA; i++) {
    const th = (i % NA) / NA * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    for (let j = 0; j <= NR; j++, k++) {
      const r = rows[j], x = c * r, z = s * r, h = coneH(x, z);
      const e = 1.5, hx = coneH(x + e, z) - h, hz = coneH(x, z + e) - h;
      const il = 1 / Math.hypot(hx, e, hz);
      pos[k * 3] = x; pos[k * 3 + 1] = Math.max(h, -9); pos[k * 3 + 2] = z;
      nor[k * 3] = -hx * il; nor[k * 3 + 1] = e * il; nor[k * 3 + 2] = -hz * il;
      let st = 0;
      for (let f = 0; f < fumaroles.length; f++) { const F = fumaroles[f], dx = x - F.x, dz = z - F.z; st = Math.max(st, Math.exp(-(dx * dx + dz * dz) / (F.r * F.r))); }
      dat[k * 2] = st; dat[k * 2 + 1] = r < P.rimR ? 1 : 0;
    }
    await ctx.yield();
  }
  const idx = new Uint32Array(NA * NR * 6); let q = 0;
  for (let i = 0; i < NA; i++) for (let j = 0; j < NR; j++) {
    const a = i * (NR + 1) + j, b = a + NR + 1;
    idx[q++] = a; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b + 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('aData', new THREE.BufferAttribute(dat, 2));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 40, 0), R1 + 40);
  // THE INNER WALL'S OWN RELIEF, PER PIXEL. The grid's triangles are 7 m round the wall and 8 m down it: the mesh carries the cone's
  // form and the slump scars' hollows, nothing finer, and it keeps the height field's own heights (hero.heightAt). What is finer is
  // worked out here once, over the inner wall (the way round x radius RM0..RM1, 0.85 m x 1.07 m a cell), and handed to the fragment
  // shader in two small maps:
  //   uRelief: the ground's height (m), its normal's x and z, and how far the bedding has slipped there (m: nought outside a slump);
  //   uRill: the thread down a gully's floor (1 on its line, 0 at its banks), that gully's own number as a hash, the hollow (how far
  //     the point lies below (+) or stands above (-) the mean of the wall 9 m either side of it round the wall, in units of 3 m:
  //     a gully's floor, a rib), and the share of loose ash and rubble lying on the beds (a gully's fan, a slump's toe).
  // THE GROUND OF THE MAPS is the height field with its thread rills' cut added back (the rills: 1 to 2 m across, 5 m apart, ruled
  // down the fall line; the mesh's vertices carry them but lie too far apart to draw them). The cut is taken before the field's
  // roughness by height and its platform step, so this is the field without its rills exactly only above 14 m of ground. Then
  // (every hash below is of the thing's own number: a scar's, a head's, a bed's; no stream is drawn on):
  // 1. EACH SLUMP SCAR'S BLOCK: inside an arched head scarp and two side scarps (ragged by the place's noise) the block has dropped
  //    2.5 to 5.5 m at its head and bulges at its toe, hummocky; its bedding has slipped 4 to 10 m and tilted 6 to 11 degrees along
  //    the wall (all by the scar's own number), and rubble lies on its lower third.
  // 2. THE GULLIES, AS WATER CUTS THEM: a head every 5 m of the rim on average (unequally: each head's place round the rim and how far
  //    below the crest it starts are a hash of its own number; most start in the top fifth of the wall, a few as low as half way).
  //    From each head a line runs down the ground's own fall, turned aside by the place's noise (5 m over 28 m and 0.8 m over 9 m:
  //    no wall is a ruled plane) by at most 0.8 of that fall, so it never climbs and never stops in a pit, and turning only a little
  //    at each 0.6 m step; where it comes within two cells of an older line it JOINS it. A gully's water is the count of heads
  //    above it: its depth is the root of that count in metres (to 6.5 m) and its half width 1.3 m times the cube root (to 5 m),
  //    so the many thin heads gather downward into fewer, deeper trunks.
  // 3. EACH GULLY THAT RUNS OUT BY ITSELF ENDS IN A FAN: from a height of 7 m plus 2.2 m times the root of its water it shallows,
  //    and a low cone of dry ash up to 1.2 m thick widens under it to the wall's foot (0.8 of the fall below its apex either side).
  const TW = 1408, TH = 112, RM0 = 124, RM1 = 244, nT = TW * TH, dR = (RM1 - RM0) / TH, da0 = Math.PI * 2 / TW, noise = ctx.noise;
  const hsh = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const hT = new Float32Array(nT), sT = new Float32Array(nT), gateT = new Float32Array(nT), zT = new Float32Array(nT), slipT = new Float32Array(nT), debT = new Float32Array(nT);
  for (let j = 0, o = 0; j < TH; j++) {
    const r = RM0 + (j + 0.5) * dR;
    for (let i = 0; i < TW; i++, o++) {
      const th = (i + 0.5) * da0, x = Math.cos(th) * r, z = Math.sin(th) * r, wl = coneH.wall;
      let h = coneH(x, z) + wl.cut; const s = wl.s; sT[o] = s; gateT[o] = wl.gate;
      if (wl.scarI >= 0 && s > 0 && s < 1.2 && h > -2) {
        const n = wl.scarI, u = wl.scarU, inn = smoothstep(0, 0.08, 1.15 * Math.sqrt(clamp((s - 0.06) / 0.26, 0, 1)) - Math.abs(u) - 0.1 * noise.n2(x / 7 + 3 * n, z / 7)) * wl.gate;
        if (inn > 0) {
          const drop = 2.5 + 3 * hsh(n * 5 + 1), toe = smoothstep(0.6, 0.82, s) * (1 - smoothstep(0.95, 1.12, s));
          h += inn * (-drop * (1 - smoothstep(0.3, 0.72, s)) + 0.55 * drop * toe + (0.9 * noise.n2(x / 5.5, z / 5.5) + 0.5 * noise.n2(x / 2.4 + 9, z / 2.4)) * (0.25 + 0.75 * smoothstep(0.35, 0.8, s)));
          if (inn > 0.5) slipT[o] = 4 + 6 * hsh(n * 5 + 2) + (hsh(n * 5 + 3) < 0.5 ? -1 : 1) * (0.1 + 0.1 * hsh(n * 5 + 4)) * u * P.scars[n].w * r;
          debT[o] = inn * Math.max(0.9 * smoothstep(0.62, 0.8, s) * (1 - smoothstep(1.02, 1.14, s)), 0.25 * smoothstep(0.25, 0.6, s));
        }
      }
      hT[o] = h; zT[o] = 5 * noise.n2(x / 28 + 11, z / 28) + 0.8 * noise.n2(x / 9 - 7, z / 9 + 23);
    }
    if (j % 3 === 2) await ctx.yield();
  }
  // the gullies' lines (pI, pJ: each line's points in cells, 0.6 m apart), who joins whom and where
  const wrapI = (i) => ((i % TW) + TW) % TW;
  const cellAt = (A, fi, fj) => { const i0 = Math.floor(fi), j0 = clamp(Math.floor(fj), 0, TH - 2), a = fi - i0, b = clamp(fj - j0, 0, 1), ia = wrapI(i0), ib = wrapI(i0 + 1); return lerp(lerp(A[j0 * TW + ia], A[j0 * TW + ib], a), lerp(A[(j0 + 1) * TW + ia], A[(j0 + 1) * TW + ib], a), b); };
  const pI = [], pJ = [], pStart = [], pLen = [], pJoin = [], pJoinK = [], own = new Int32Array(nT), ownK = new Int32Array(nT);
  const NH = Math.round(Math.PI * 2 * P.rimR / 5);
  for (let n = 0; n < NH; n++) {
    const s0 = 0.05 + 0.45 * hsh(n * 3 + 12) * hsh(n * 3 + 12);
    let fi = (n + 0.2 + 0.6 * hsh(n * 3 + 11)) / NH * TW - 0.5, fj = -1;
    const ci = wrapI(Math.round(fi));
    for (let j = TH - 2; j > 0; j--) if (sT[j * TW + ci] >= 0 && sT[j * TW + ci] <= s0 && sT[(j - 1) * TW + ci] > s0) { fj = j; break; }
    if (fj < 0 || gateT[fj * TW + ci] < 0.6 || hT[fj * TW + ci] < 12) continue;
    const id = pStart.length, a0 = pI.length; let va = 0, vr = -1, joined = -1, joinK = 0;
    for (let k = 0; k < 700; k++) {
      const j = Math.round(fj), i = wrapI(Math.round(fi)); if (j < 2 || j > TH - 3) break;
      const o = j * TW + i; if (hT[o] < 5 || gateT[o] < 0.35) break;
      let hit = -1; for (let d = 0; d < 5 && hit < 0; d++) { const q = j * TW + wrapI(i + ((d + 1) >> 1) * (d & 1 ? 1 : -1)); if (own[q] && own[q] !== id + 1) hit = q; }
      pI.push(fi); pJ.push(fj);
      if (hit >= 0) { joined = own[hit] - 1; joinK = ownK[hit]; break; }
      own[o] = id + 1; ownK[o] = k;
      const da = (RM0 + (fj + 0.5) * dR) * da0, hx = 0.35 * (cellAt(hT, fi + 1, fj) - cellAt(hT, fi - 1, fj)) / (2 * da), hy = 0.35 * (cellAt(hT, fi, fj + 1) - cellAt(hT, fi, fj - 1)) / (2 * dR), hl = Math.hypot(hx, hy);
      if (hl < 0.02) break;
      let nx = (cellAt(zT, fi + 1, fj) - cellAt(zT, fi - 1, fj)) / (2 * da), ny = (cellAt(zT, fi, fj + 1) - cellAt(zT, fi, fj - 1)) / (2 * dR); const nl = Math.hypot(nx, ny), nk = Math.min(1, 0.8 * hl / Math.max(nl, 1e-6));
      const gx = hx + nx * nk, gy = hy + ny * nk, gl = Math.hypot(gx, gy);
      va = 0.6 * va - 0.4 * gx / gl; vr = 0.6 * vr - 0.4 * gy / gl; const vl = Math.hypot(va, vr); va /= vl; vr /= vl;
      fi += va * 0.6 / da; fj += vr * 0.6 / dR;
    }
    pStart.push(a0); pLen.push(pI.length - a0); pJoin.push(joined); pJoinK.push(joinK);
    if (n % 40 === 39) await ctx.yield();
  }
  // each gully's water: its own head and all that join it (a later line can only join an earlier one)
  const nP = pStart.length, qEnd = new Float32Array(nP).fill(1), adds = []; for (let p = 0; p < nP; p++) adds.push([]);
  for (let p = nP - 1; p >= 0; p--) if (pJoin[p] >= 0) { qEnd[pJoin[p]] += qEnd[p]; adds[pJoin[p]].push(pJoinK[p], qEnd[p]); }
  // cut the gullies, lay their threads and their fans
  const carve = new Float32Array(nT), thread = new Float32Array(nT), label = new Int32Array(nT), fan = new Float32Array(nT);
  for (let p = 0; p < nP; p++) {
    const a0 = pStart[p], ad = adds[p], ends = pJoin[p] < 0, yApex = 7 + 2.2 * Math.sqrt(qEnd[p]);
    for (let k = 0; k < pLen[p]; k++) {
      let q = 1; for (let m = 0; m < ad.length; m += 2) q += ad[m + 1] * smoothstep(-8, 8, k - ad[m]);      // (a tributary's water comes in over 10 m of the gully)
      const fi = pI[a0 + k], fj = pJ[a0 + k], i0 = Math.round(fi), j0 = clamp(Math.round(fj), 0, TH - 1), da = (RM0 + (fj + 0.5) * dR) * da0, hh = hT[j0 * TW + wrapI(i0)];
      const grow = smoothstep(0, 12, k * 0.6), out = ends ? smoothstep(yApex * 0.45, yApex, hh) : 1;
      const D = Math.min(Math.sqrt(q), 6.5) * grow * out, Wd = Math.min(1.3 * Math.cbrt(q), 5) * (0.5 + 0.5 * grow), Wt = Math.min(Wd, 1 + 0.25 * Math.sqrt(q)), Wf = ends && hh < yApex ? 0.8 * (yApex - hh) : 0;
      const Rs = Math.max(Wd, Wf), ni = Math.ceil(Rs / da), nj = Math.ceil(Rs / dR);
      for (let dj = -nj; dj <= nj; dj++) {
        const j = j0 + dj; if (j < 0 || j >= TH) continue;
        for (let di = -ni; di <= ni; di++) {
          const o = j * TW + wrapI(i0 + di), dx = (i0 + di - fi) * da, dy = (j - fj) * dR, d2 = dx * dx + dy * dy;
          if (d2 < Wd * Wd) { const u = 1 - d2 / (Wd * Wd); if (D * u * u > carve[o]) carve[o] = D * u * u; }
          if (d2 < Wt * Wt) { const u = (1 - d2 / (Wt * Wt)) * grow; if (u > thread[o]) { thread[o] = u; label[o] = p + 1; } }
          if (d2 < Wf * Wf) { const u = 1 - d2 / (Wf * Wf); if (u > fan[o]) fan[o] = u; }
        }
      }
    }
    if (p % 6 === 5) await ctx.yield();
  }
  // (the two cells either side of a thread carry its gully's number too, so the number does not blur at the thread's edge)
  for (let pass = 0; pass < 2; pass++) { const prev = label.slice(); for (let o = 0; o < nT; o++) if (!prev[o]) { const j = (o / TW) | 0, i = o - j * TW; label[o] = prev[j * TW + (i + 1) % TW] || prev[j * TW + (i + TW - 1) % TW]; } }
  await ctx.yield();
  for (let o = 0; o < nT; o++) { const f = fan[o] * smoothstep(1.5, 4, hT[o]); hT[o] += 1.2 * f - carve[o] * (1 - 0.7 * f); debT[o] = Math.max(debT[o], f); }
  const relief = new Uint16Array(nT * 4), rill = new Uint8Array(nT * 4), half = THREE.DataUtils.toHalfFloat;
  for (let j = 0; j < TH; j++) {
    const r = RM0 + (j + 0.5) * dR, da = r * da0, jm = Math.max(0, j - 1), jp = Math.min(TH - 1, j + 1), win = Math.max(2, Math.round(9 / da)), row = j * TW;
    let sum = 0; for (let k = -win; k <= win; k++) sum += hT[row + (k + TW) % TW];
    for (let i = 0; i < TW; i++) {
      const o = row + i, th = (i + 0.5) * da0, c = Math.cos(th), sn = Math.sin(th);
      const hr = (hT[jp * TW + i] - hT[jm * TW + i]) / ((jp - jm) * dR), ht = (hT[row + (i + 1) % TW] - hT[row + (i + TW - 1) % TW]) / (2 * da);
      const hx = hr * c - ht * sn, hz = hr * sn + ht * c, il = 1 / Math.hypot(hx, 1, hz);
      relief[o * 4] = half(hT[o]); relief[o * 4 + 1] = half(-hx * il); relief[o * 4 + 2] = half(-hz * il); relief[o * 4 + 3] = half(slipT[o]);
      rill[o * 4] = Math.round(255 * clamp(thread[o], 0, 1)); rill[o * 4 + 1] = Math.round(255 * (label[o] * 0.618034 % 1));
      rill[o * 4 + 2] = Math.round(127.5 + 127.5 * clamp((sum / (2 * win + 1) - hT[o]) / 3, -1, 1)); rill[o * 4 + 3] = Math.round(255 * clamp(debT[o], 0, 1));
      sum += hT[row + (i + win + 1) % TW] - hT[row + (i - win + TW) % TW];
    }
    if (j % 8 === 7) await ctx.yield();
  }
  // THE BEDS' STACK, as ash falls lay it: one table for the whole inner wall, read by the bedding's height (uBeds: 0.14 m a cell from 64 m
  // under the sea to 222 m). Bed after bed upward, each by its OWN NUMBER: 10 in a hundred are thick (3 to 6.5 m), the rest thin
  // (0.4 to 2.4 m, most of them under a metre: the square of a hash). Brown-grey ash or black: 38 in a hundred of the stack's
  // height is brown-grey, more and less in packages (the share swings by 22 over 23 m of bedding and by 10 over 9 m), and 32 more
  // between 76-92 m and 108-124 m of bedding, a paler package high in the stack; a bed is brown-grey when the brown-grey laid so
  // far has fallen behind that share by a part of the bed's own thickness (a quarter to three quarters, by its number), so the
  // share holds over every stretch of the stack whatever the beds' thicknesses. Each bed has its own shade, and its foot carries
  // a ledge's shadow 0.4 m high, strong or faint by its number. The table's eight rows hold the same stack averaged over 0.14,
  // 0.28 ... 18 m of bedding, for a pixel that covers as much of it.
  const BW = 2048, BL = 8, BT0 = -64, BDT = 0.14, beds = new Uint8Array(BW * BL * 4);
  {
    const nF = BW * 4, ft = BDT / 4, tone = new Float32Array(nF + 1), ledge = new Float32Array(nF + 1);
    for (let t = BT0 - 12, k = 0, i = 0, want = 0, got = 0; i < nF; k++) {
      const top = t + (hsh(k * 7 + 0.5) > 0.9 ? 3 + 3.5 * hsh(k * 7 + 1.5) : 0.4 + 2 * hsh(k * 7 + 1.5) * hsh(k * 7 + 1.5));
      want += (0.38 + 0.32 * smoothstep(76, 92, t) * (1 - smoothstep(108, 124, t)) + 0.22 * Math.sin(t * 0.273 + 1) + 0.1 * Math.sin(t * 0.69 + 4)) * (top - t);
      const brown = want - got > (top - t) * (0.25 + 0.5 * hsh(k * 7 + 2.5)); if (brown) got += top - t;
      const tn = brown ? 0.55 + 0.45 * hsh(k * 7 + 3.5) : 0.1 * hsh(k * 7 + 3.5), lg = 0.4 + 0.6 * hsh(k * 7 + 4.5);
      for (; i < nF && BT0 + (i + 0.5) * ft < top; i++) { const d = BT0 + (i + 0.5) * ft - t; tone[i + 1] = tone[i] + tn; ledge[i + 1] = ledge[i] + (d >= 0 ? lg * (1 - smoothstep(0.05, 0.4, d)) : 0); }
      t = top;
    }
    for (let l = 0; l < BL; l++) for (let x = 0; x < BW; x++) {
      const a = clamp(x * 4 + 2 - (2 << l), 0, nF), b = clamp(x * 4 + 2 + (2 << l), 0, nF), o = (l * BW + x) * 4;
      beds[o] = Math.round(255 * (tone[b] - tone[a]) / (b - a)); beds[o + 1] = Math.round(255 * (ledge[b] - ledge[a]) / (b - a)); beds[o + 3] = 255;
    }
  }
  await ctx.yield();
  const mapOf = (data, type, w, h, wrapS) => { const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, type); t.magFilter = t.minFilter = THREE.LinearFilter; t.wrapS = wrapS; t.wrapT = THREE.ClampToEdgeWrapping; t.generateMipmaps = false; t.needsUpdate = true; return t; };
  U.uRelief = { value: mapOf(relief, THREE.HalfFloatType, TW, TH, THREE.RepeatWrapping) }; U.uRill = { value: mapOf(rill, THREE.UnsignedByteType, TW, TH, THREE.RepeatWrapping) }; U.uReliefR = { value: new THREE.Vector2(RM0, 1 / (RM1 - RM0)) };
  U.uBeds = { value: mapOf(beds, THREE.UnsignedByteType, BW, BL, THREE.ClampToEdgeWrapping) };
  // THE CREST LINE (uCrest): on each of the maps' own bearings, the height field's crest line (coneH.wall.rr: where its outer
  // flank's law ends and its inner wall's begins) as metres beyond 230 from the island's middle. The fragment shader parts its
  // two laws by it.
  const crest = new Uint16Array(TW * 4);
  for (let i = 0; i < TW; i++) { const th = (i + 0.5) * da0; coneH(Math.cos(th) * 150, Math.sin(th) * 150); crest[i * 4] = half(coneH.wall.rr - 230); }
  U.uCrest = { value: mapOf(crest, THREE.HalfFloatType, TW, 1, THREE.RepeatWrapping) };
  const mat = new THREE.ShaderMaterial({
    // both sides: the grid's triangles wind clockwise seen from above, so with front faces alone only the far side of the
    // cone was ever drawn (the same silhouette from the sea, but from the climb the crater's wall and floor were missing)
    fog: false, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uAsh: { value: pal.ash.clone() }, uOchre: { value: pal.ochre.clone() }, uJade: { value: pal.jade.clone() },
    }]),
    vertexShader: /* glsl */`
      attribute vec2 aData; varying vec3 vP; varying vec3 vN; varying vec2 vD; varying vec3 vW;
      ${FOG_PV}
      void main(){
        vP = position; vN = normal; vD = aData;
        vec4 wp = modelMatrix*vec4(position, 1.0); vW = wp.xyz;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAsh, uOchre, uJade; uniform float uTime;
      uniform sampler2D uRelief, uRill, uBeds, uCrest; uniform vec2 uReliefR;
      ${LIGHT_PARS}
      varying vec3 vP; varying vec3 vN; varying vec2 vD; varying vec3 vW;
      ${FOG_PF}
      ${NOISE_GLSL}
      // A TONGUE OF DRY ASH in one gully of the inner wall (chute: the thread down the gully's floor, 1 on its line; num: the gully's
      // own number as a hash). The gully is cut into stretches of 40 m of height that slide down it at 2.2 m of height a second (2.6 m
      // a second along a wall of 59 degrees: a trickle); a hash of the stretch's number and the gully's says whether it carries a tongue (the
      // share that do) and how long a one: a front cut across the thread downhill (ragged by the grain), a tail that thins to a
      // thread uphill, its edge broken by the grain.
      float ibTrickle(float chute, float num, float yb, float g1, float g2, float g3, float share, float thin){
        float ph = (yb + 2.2*uTime)/40.0 + num*37.0 + (g1 - 0.5)*0.1, c = floor(ph), q = ph - c;
        float h = ibH12(vec2(c + 0.5, num*91.7 + 3.0));
        float run = smoothstep(0.0, 0.08, q)*(1.0 - smoothstep(0.15, mix(0.45, 0.98, h/share), q));
        return step(h, share)*run*smoothstep(0.0, 0.25, chute - mix(thin, 0.9, q) + (g2 - 0.5)*0.3)*(0.7 + 0.6*g3);
      }
      void main(){
        vec3 p = vP; float y = p.y;
        float r = length(p.xz), th = atan(p.z, p.x + 1e-4);
        float g1 = ibVN(p*0.23), g2 = ibVN(p*0.9), g3 = ibVN(p*3.3);
        float grain = g1*0.45 + g2*0.35 + g3*0.2;
        // THE CREST LINE PARTS TWO LAWS. kIn is 0 on the height field's crest line and everywhere outside it, and rises to 1 over
        // the first 6 m of ground inside it (uCrest: the crest's distance from the island's middle on this bearing, less 230 m; the
        // quarter metre is more than the map can be out by, so no pixel at or outside the crest has any weight). Where kIn is 0, the
        // whole outer flank with its rills, its cliff and its surf, the colour comes from the OUTER LAW's block and from the lines
        // after the inner wall's blocks, and those are the lines the cone was always drawn by, operation for operation: nothing of
        // the inner wall's law is added, mixed in or multiplied on. The INNER WALL's own terms (w to ft below, two map reads among
        // them) are worked out at every cone pixel and USED only where kIn is over 0, in its blocks; from 0 to 1 the two laws are
        // mixed by kIn, and where kIn is 1 the outer law's block is not run at all.
        float kIn = smoothstep(0.25, 6.0, texture2D(uCrest, vec2(th*0.15915494, 0.5)).r + 230.0 - r);
        float fw = fwidth(y)*1.7;
        float tone = 0.0, lane = 0.0;
        if (kIn < 1.0) {
          // THE OUTER LAW. bedding: broad warped beds plus fine beds that fade with distance
          float warp = (g1 - 0.5)*7.0 + (ibVN(p*0.045) - 0.5)*22.0;
          float bed = ibVN(vec3(p.xz*0.006, (y + warp)*0.21));
          float fine = sin((y + warp*0.6)*1.7 + g2*1.5)*(1.0 - smoothstep(0.25, 1.3, fw));
          tone = clamp(smoothstep(0.34, 0.66, bed) + fine*0.22, 0.0, 1.0);
          // ash avalanches trickling down the ground within the plain 230 m circle (vD.y): where that circle lies outside the
          // crest, and through the first 6 m inside the crest
          // (each trickle wanders down the wall, breaks and fans out: never a ruled line)
          float lth = th + (g1 - 0.5)*0.045 + (ibVN(p*0.06) - 0.5)*0.11;
          lane = smoothstep(0.62, 0.84, ibVN2(vec2(lth*34.0, 2.7 + y*0.012)))*vD.y*smoothstep(4.0, 22.0, y);
          float flow = ibVN2(vec2(lth*120.0, r*0.07 + uTime*1.5))*ibVN2(vec2(lth*30.0, r*0.02 + uTime*0.45));
          lane = lane*smoothstep(0.18, 0.5, flow);
        }
        vec3 brown = vec3(0.105, 0.088, 0.072);
        // THE INNER WALL reads its own relief per pixel from the two maps (see buildCone): the ground's height and normal, its
        // hollows, the gullies' threads, the slumps' slipped bedding, the loose ash. A gully's head is 2.6 m across and the map's
        // cell 0.85 m: as the pixel's footprint on the wall grows from 1.5 m to 3.5 m the relief melts back into the mesh's own
        // (w). The map is read at every cone pixel; it counts only inside the crest (kIn) and within the plain 230 m circle (vD.y);
        // elsewhere the ground is the mesh's.
        float w = kIn*vD.y*(1.0 - smoothstep(1.5, 3.5, max(length(dFdx(p)), length(dFdy(p)))));
        vec2 ruv = vec2(th*0.15915494, (r - uReliefR.x)*uReliefR.y);
        vec4 rl = texture2D(uRelief, ruv);
        float yb = mix(y, rl.r, w);
        // THE BEDS OF THE INNER WALL, AS ASH FALLS LAY THEM. The bedding's height t is the ground's height, plus the DRAPE (the
        // beds mantle the wall: they sag and rise by place, 18 m over 80 m and 7 m over 20 m, and dip outward from the island's
        // middle by 0.2), plus the slip of a slump's block. Every 9 m or so of bedding one band of beds (its own number) PINCHES
        // OUT along stretches of the wall (where its own noise by place says so) and up to 3 m of the stack is missing there,
        // the beds above sagging into the gap up to the next band. The stack itself is the table uBeds (see buildCone): unequal
        // beds, black and brown-grey, read at the row whose averaging matches the bedding a pixel covers (ft).
        float t = yb + 18.0*(ibVN2(p.xz*0.0125) - 0.5) + 7.0*(ibVN2(vec2(p.x*0.8 + p.z*0.6, p.z*0.8 - p.x*0.6)*0.05 + 17.0) - 0.5) + 0.2*(r - 230.0) + rl.a*w + (g2 - 0.5)*0.3;
        float ft = fwidth(t);
        vec3 Nb = vN; float ledge = 0.0, hol = 0.0;
        if (kIn > 0.0) {
          vec4 rk = texture2D(uRill, ruv);
          float deb = rk.a*w; hol = max(rk.b*2.0 - 1.0, 0.0)*w;
          float b0 = floor(t/9.0), tc0 = (b0 + 0.25 + 0.5*ibH11(b0*7.31 + 2.0))*9.0;
          if (t < tc0) { b0 -= 1.0; tc0 = (b0 + 0.25 + 0.5*ibH11(b0*7.31 + 2.0))*9.0; }
          float tc1 = (b0 + 1.25 + 0.5*ibH11((b0 + 1.0)*7.31 + 2.0))*9.0;
          float gap = 3.0*smoothstep(0.5, 0.78, ibVN2(p.xz*0.022 + b0*vec2(13.7, 7.1)));
          float lod = clamp(log2(max(ft, 0.14)/0.14), 0.0, 6.999), l0 = floor(lod), bu = (t + gap*(1.0 - (t - tc0)/(tc1 - tc0)) + 64.0)/286.72;
          vec4 bd = mix(texture2D(uBeds, vec2(bu, (l0 + 0.5)*0.125)), texture2D(uBeds, vec2(bu, (l0 + 1.5)*0.125)), lod - l0);
          // (loose ash and rubble lie on the beds in a gully's fan and on a slump's toe: unbedded, blocks of both ashes 1 to 4 m across)
          tone = mix(tone, mix(bd.r, smoothstep(0.47, 0.67, g1*0.5 + g2*0.5), deb*0.9), kIn);
          brown = mix(brown, vec3(0.106, 0.088, 0.070)*1.52, kIn);
          // THE BEDS STEP SOFTLY: under each bed's foot the face turns down a little (ledge), into less of the sun and less of the
          // sky. The normal is the map's at this pixel, so the gullies and the scars are relief under the day's key.
          ledge = bd.g*(1.0 - deb)*kIn;
          Nb = mix(vN, vec3(rl.g, sqrt(max(1.0 - rl.g*rl.g - rl.b*rl.b, 0.0)), rl.b), w) - vec3(0.0, 0.55*ledge, 0.0);
          // ash avalanches trickling down the inner wall, laid by the wall's own places: each gully's thread is a chute (its number
          // from the map; a third of its stretches carry a tongue)
          lane = mix(lane, ibTrickle(rk.r, rk.g, yb, g1, g2, g3, 0.35, 0.35)*w*smoothstep(2.0, 7.0, yb), kIn);
        }
        vec3 alb = mix(uAsh*1.9 + 0.012, brown, tone)*(0.55 + 0.9*grain);
        // slope: steep faces (rills, scars, cliff) show darker, fresher ash
        vec3 N = normalize(Nb + (vec3(g2, g3, ibVN(p*0.9 + 7.0)) - 0.5)*0.34);
        float steep = 1.0 - smoothstep(0.55, 0.9, vN.y);
        alb *= mix(1.0, 0.62, steep);
        // (inside the crest a hollow, a gully's floor or a scar's foot, is darker by how deep it lies: hol, 0..1, the metres the
        // point lies below the wall's mean 9 m either side, over 3)
        if (kIn > 0.0) alb *= 1.0 - 0.5*hol;
        // sulphur-ochre fumarole patches
        float stain = smoothstep(0.25, 0.75, vD.x + (g2 - 0.5)*0.7 + (g1 - 0.5)*0.5);
        alb = mix(alb, uOchre*(0.14 + 0.2*g3), stain*0.75*smoothstep(0.3, 0.6, g2*0.6 + g1*0.5));
        alb = mix(alb, vec3(0.30, 0.29, 0.24), smoothstep(0.85, 1.05, vD.x + (g3 - 0.5)*0.4)*0.4);
        // the ash avalanches (lane: the outer law's and the inner wall's, worked out above)
        alb = mix(alb, vec3(0.15, 0.14, 0.125), lane*0.5);
        // wet band and waterline
        float wetN = y + (g2 - 0.5)*2.5;
        float wet = 1.0 - smoothstep(1.0, 6.5, wetN);
        alb *= mix(1.0, 0.42, wet);
        float ndl = dot(N, uSunDir);
        float lit = smoothstep(-0.02, 0.3, ndl)*(0.5 + 0.5*clamp(ndl, 0.0, 1.0));
        // the crater bowl shades itself: darker low on the inner wall
        float bowl = mix(1.0, 0.74 + 0.26*smoothstep(0.0, 70.0, y), vD.y);
        vec3 col = alb*(uSunCol*lit*bowl + uSkyCol*(0.26 + 0.2*N.y)*bowl);
        if (kIn > 0.0) col = alb*(uSunCol*lit*bowl + uSkyCol*(0.26 + 0.2*N.y)*bowl*(1.0 - 0.4*ledge));      // (inside the crest the face under a ledge sees less of the sky)
        vec3 V = normalize(cameraPosition - vW);
        float fr = pow(max(1.0 - clamp(dot(N, V), 0.0, 1.0), 0.0), 3.0);
        col += uSkyCol*fr*(0.03 + 0.16*wet);                        // cold sky sheen on wet faces
        // surf: pulsing swash on the platform, contact darkening just above it
        float pulse = 0.7 + 0.6*sin(uTime*0.8 + th*9.0 + g1*5.0);
        float swash = (1.0 - smoothstep(0.1, 0.9 + pulse, y))*smoothstep(-1.6, 0.2, y);
        float lace = smoothstep(0.35, 0.7, ibVN2(vec2(th*r*0.16, r*0.33 - uTime*0.7 + g1*3.0)) + swash*0.35 - 0.2);
        col = mix(col, (uSunCol*(0.35 + 0.4*lit) + uSkyCol*0.3)*0.74, swash*lace);
        col = mix(col, uJade*0.25*(uSunCol*0.5 + uSkyCol*0.5), (1.0 - smoothstep(-3.5, -0.4, y))*0.9);
        col = max(col, vec3(0.0055, 0.006, 0.0075)*(1.0 - uNight*0.6));
        gl_FragColor = vec4(col, 1.0);
        ${FOG_F}
      }`,
  });
  mat.uniforms.uTime = U.uTime; mat.uniforms.uSunDir = U.uSunDir; mat.uniforms.uSunCol = U.uSunCol; mat.uniforms.uSkyCol = U.uSkyCol; mat.uniforms.uNight = U.uNight;
  mat.uniforms.uRelief = U.uRelief; mat.uniforms.uRill = U.uRill; mat.uniforms.uReliefR = U.uReliefR; mat.uniforms.uBeds = U.uBeds; mat.uniforms.uCrest = U.uCrest;
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'cone';
  return mesh;
}

// ---------------------------------------------------------------- CLOUDS: lobes (trunks, column, bursts, surge)
// A lobe is a unit icosphere whose vertices carry the lobe's centre, radius, phase and roll direction;
// the vertex shader boils it. Tubes (the crevice-dark cores) use the same attributes with a radial dir.
async function unitSphere(ctx, detail) {
  // an icosphere with shared vertices (welded here on integer keys: the addon's mergeVertices is too slow for the fine ones).
  // It yields after making the geometry and every 1,500 vertices of the weld: the fine one is too long for one build step.
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position.array, n = p.length / 3;
  await ctx.yield();
  const map = new Map(), pos = [], idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    if (i % 1500 === 1499) await ctx.yield();
    const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
    const key = (Math.round(x * 4096) + 4100) * 67240000 + (Math.round(y * 4096) + 4100) * 8200 + Math.round(z * 4096) + 4100;
    let v = map.get(key);
    if (v === undefined) { v = pos.length / 3; map.set(key, v); pos.push(x, y, z); }
    idx[i] = v;
  }
  g.dispose();
  return { pos: new Float32Array(pos), idx, nv: pos.length / 3 };
}
function makeLobeBuffers(maxV, maxI) {
  return { pos: new Float32Array(maxV * 3), cen: new Float32Array(maxV * 3), lobe: new Float32Array(maxV * 4), out: new Float32Array(maxV * 3), tone: new Float32Array(maxV * 3), kid: new Float32Array(maxV * 4), idx: new Uint32Array(maxI), nv: 0, ni: 0 };
}
// the part of a unit sphere above y = cut (a turret's cap: its seat is buried in its parent lobe)
function capOf(S, cut) {
  const map = new Int32Array(S.nv).fill(-1), pos = [], idx = [];
  for (let t = 0; t < S.idx.length; t += 3) {
    const a = S.idx[t], b = S.idx[t + 1], c = S.idx[t + 2];
    if (S.pos[a * 3 + 1] + S.pos[b * 3 + 1] + S.pos[c * 3 + 1] < cut * 3) continue;
    for (let k = 0; k < 3; k++) { const v = S.idx[t + k]; if (map[v] < 0) { map[v] = pos.length / 3; pos.push(S.pos[v * 3], S.pos[v * 3 + 1], S.pos[v * 3 + 2]); } idx.push(map[v]); }
  }
  return { pos: new Float32Array(pos), idx: new Uint32Array(idx), nv: pos.length / 3 };
}
function pushVert(B, dx, dy, dz, L) {
  const v = B.nv++;
  B.pos[v * 3] = dx; B.pos[v * 3 + 1] = dy; B.pos[v * 3 + 2] = dz;
  B.cen[v * 3] = L.x; B.cen[v * 3 + 1] = L.y; B.cen[v * 3 + 2] = L.z;
  B.lobe[v * 4] = L.r; B.lobe[v * 4 + 1] = L.phase; B.lobe[v * 4 + 2] = L.rate; B.lobe[v * 4 + 3] = L.seed;
  B.out[v * 3] = L.ox; B.out[v * 3 + 1] = L.oy; B.out[v * 3 + 2] = L.oz;
  B.tone[v * 3] = L.tone; B.tone[v * 3 + 1] = L.mode; B.tone[v * 3 + 2] = L.occ;
  // a turret (kid) rides its parent lobe: offset from the parent's centre in parent radii, own radius as a share of the parent's
  B.kid[v * 4] = L.kx || 0; B.kid[v * 4 + 1] = L.ky || 0; B.kid[v * 4 + 2] = L.kz || 0; B.kid[v * 4 + 3] = L.kw || 1;
  return v;
}
// L.axis (unit vector): the sphere (or cap) is turned so that its +Y points along it
function pushLobe(B, S, L) {
  const base = B.nv, A = L.axis;
  if (A) {
    let tx = A[2], ty = 0, tz = -A[0]; let l = Math.hypot(tx, tz);
    if (l < 1e-3) { tx = 1; tz = 0; l = 1; }
    tx /= l; tz /= l;
    const ux = ty * A[2] - tz * A[1], uy = tz * A[0] - tx * A[2], uz = tx * A[1] - ty * A[0];      // t x axis
    for (let i = 0; i < S.nv; i++) { const x = S.pos[i * 3], y = S.pos[i * 3 + 1], z = S.pos[i * 3 + 2]; pushVert(B, tx * x + A[0] * y + ux * z, ty * x + A[1] * y + uy * z, tz * x + A[2] * y + uz * z, L); }
  } else for (let i = 0; i < S.nv; i++) pushVert(B, S.pos[i * 3], S.pos[i * 3 + 1], S.pos[i * 3 + 2], L);
  for (let i = 0; i < S.idx.length; i++) B.idx[B.ni++] = base + S.idx[i];
}
// a tube: rows of rings; axisFn(y) -> [x, z], radFn(y) -> radius
function pushTube(B, y0, y1, rows, segs, axisFn, radFn, tone, toneTop) {
  const base = B.nv, L = { phase: 0.5, rate: 0, mode: 0, occ: 0.55, ox: 0, oy: 1, oz: 0 };
  for (let j = 0; j <= rows; j++) {
    const y = lerp(y0, y1, j / rows), a = axisFn(y);
    L.x = a[0]; L.y = y; L.z = a[1]; L.r = radFn(y); L.seed = y * 0.0045; L.tone = lerp(tone, toneTop, smoothstep(380, 700, y));
    for (let i = 0; i <= segs; i++) { const t = (i % segs) / segs * Math.PI * 2; pushVert(B, Math.cos(t), 0, Math.sin(t), L); }
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < segs; i++) {
    const a = base + j * (segs + 1) + i, b = a + segs + 1;
    B.idx[B.ni++] = a; B.idx[B.ni++] = b; B.idx[B.ni++] = a + 1; B.idx[B.ni++] = a + 1; B.idx[B.ni++] = b; B.idx[B.ni++] = b + 1;
  }
}
function lobeGeometry(B, cx, cy, cz, rad, kids) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(B.pos.subarray(0, B.nv * 3), 3));
  geo.setAttribute('aCenter', new THREE.BufferAttribute(B.cen.subarray(0, B.nv * 3), 3));
  geo.setAttribute('aLobe', new THREE.BufferAttribute(B.lobe.subarray(0, B.nv * 4), 4));
  geo.setAttribute('aOut', new THREE.BufferAttribute(B.out.subarray(0, B.nv * 3), 3));
  geo.setAttribute('aTone', new THREE.BufferAttribute(B.tone.subarray(0, B.nv * 3), 3));
  if (kids) geo.setAttribute('aKid', new THREE.BufferAttribute(B.kid.subarray(0, B.nv * 4), 4));
  geo.setIndex(new THREE.BufferAttribute(B.idx.subarray(0, B.ni), 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), rad);
  return geo;
}

const CLOUD_FRAG = /* glsl */`
  uniform vec3 uSteam, uShadow, uAsh, uFlashCol, uSurgeCol; uniform vec3 uFlashPos[2]; uniform float uFlashI[2]; uniform float uTime;
  ${LIGHT_PARS}
  varying vec3 vLp; varying vec3 vN; varying vec3 vW; varying vec4 vT;   // vT: tone, occlusion, 1/cell size, kind (1 turret, -1 root burst, 0 lobe)
  ${FOG_PF}
  ${NOISE_GLSL}
  vec3 ibH33(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx)*p.zyx); }
  // cellular turrets: xyz = offset from the nearest cell centre (a ready-made dome normal), w = distance to the crease
  vec4 ibCell(vec3 p, out vec3 rn){      // rn: from p to the nearest cell's centre
    vec3 i = floor(p), f = fract(p), acc = vec3(0.0); float d1 = 9.0, d2 = 9.0, ws = 0.0; rn = vec3(0.0);
    for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec3 g = vec3(float(x), float(y), float(z)); vec3 r = g + ibH33(i + g) - f; float d = dot(r, r);
      float w = exp(-11.0*d); acc += w*r; ws += w;          // smooth blend: round domes, soft valleys, no facets
      if (d < d1) { d2 = d1; d1 = d; rn = r; } else if (d < d2) { d2 = d; }
    }
    return vec4(-acc/max(ws, 1e-6), sqrt(d2) - sqrt(d1));
  }
  void main(){
    vec3 q = vLp*vT.z;
    // (the footprint leans to the geometric mean of the two screen directions, so a face seen at a grazing angle keeps its
    // turrets, with 45% of the larger one mixed in, so a face seen nearly edge-on fades to smooth before it can streak)
    float fqa = length(dFdx(q)), fqb = length(dFdy(q));
    float fq = 2.4*mix(sqrt(fqa*fqb), max(fqa, fqb), 0.45);      // (partly the larger one: on a face seen edge-on the cells melt away before they can smear into bands)
    float o1 = 1.0 - smoothstep(0.45, 1.3, fq), o2 = 1.0 - smoothstep(0.16, 0.5, fq), o3 = 1.0 - smoothstep(0.05, 0.17, fq);
    // the lookups are bent by a slow warp, so the creases between turrets wander instead of ruling a honeycomb
    vec3 qw = q + 0.3*sin(q.yzx*1.7 + 1.3) + 0.15*sin(q.zxy*3.9 + 4.1);
    vec3 rn1, rnx;
    vec4 c1 = ibCell(qw + vec3(0.0, -uTime*0.03, 0.0), rn1);
    #ifdef IB_OCT2
    vec4 c2 = ibCell(qw*2.7 + 7.3 + 0.35*sin(q.zxy*5.3), rnx);
    vec4 c3 = vec4(0.0, 0.0, 0.0, 0.5);
    if (o3 > 0.01) c3 = ibCell(qw*6.9 + 3.1 + 0.3*sin(q.yzx*13.0), rnx);      // the third octave only exists at the closest pass
    #else
    vec4 c2 = vec4(0.0, 0.0, 0.0, 0.5), c3 = vec4(0.0, 0.0, 0.0, 0.5);
    #endif
    vec3 Ng = normalize(vN);
    float burst = step(vT.w, -0.5);
    // FORM (the slot's lobes and their turrets, within 190 to 340 m: the climb, not the breach): where the light is frontal (the walls seen up the slot with the sun behind the eye,
    // the sunlit wall seen square on, the moonlit wall) a turret has no terminator, so its crevices carry it: the seam round
    // every cell goes to the shadow colour, and the cap stays the brightest thing on it
    // (the range grows with height, 0.7 m for every metre above 200 m: the roof over the portal, 650 m up, is a crowd of turrets from the
    // whole climb, by day and by moon, while from the sea, which is always further from a lobe than that, nothing changes)
    float hiK = 0.7*clamp(vW.y - 200.0, 0.0, 600.0);      // (no more above 800 m)
    float formK = smoothstep(0.2, 0.5, vT.w)*(1.0 - smoothstep(190.0 + hiK, 340.0 + hiK, distance(vW, cameraPosition)));
    // every cell is a dome: lit cap, crescent of shade in its lee. On steam in the form range the dome is the nearest cell's
    // own (a round cap: its normal leans away from that cell's centre in step with the distance from it, as a ball's does, and comes
    // upright again in the last tenth before the seam, inside the seam's shade), and the finer crinkles are halved. A flat cap
    // folded steeply at straight seams was crumpled foil at close range; the blended normal alone, upright over half of every
    // cell, was crumpled glass
    float sK = formK*(1.0 - clamp(vT.x, 0.0, 1.0));
    // EVERY LOBE THAT IS NOT ONE OF THE VERY FINE ONES, on the climb (kind 0.75, see CLOUD_VERT): their own cells are 25 to 95 m, a broad
    // smooth face beside the camera or behind the fine lobes. On them the second octave (cells of 10 to 18 m) is promoted from a crinkle to the turrets: full seams,
    // a steeper dome, shaded flanks. It is an amplitude, not a size: it fades in with the form range and nothing swims.
    float pK = formK*smoothstep(0.55, 0.72, vT.w)*step(vT.w, 0.9);
    vec3 n0 = Ng + mix(c1.xyz*1.6, rn1*(-(0.8 + 1.3*length(rn1))*smoothstep(0.0, 0.1, c1.w)), sK)*o1 + c2.xyz*(mix(1.35*(1.0 - 0.75*sK), 2.0, pK*(1.0 - 0.5*sK))*o2) + c3.xyz*(0.65*o3*(1.0 - 0.9*sK));
    vec3 N = n0/max(length(n0), 1e-4);
    float dome = clamp(1.0 - 2.2*dot(c1.xyz, c1.xyz), 0.0, 1.0);
    float cr1 = mix(1.0, smoothstep(-0.05, mix(0.5, 0.38, formK), c1.w), o1);
    // (steam at close range: the two finer octaves of creases are a web of thin dark cracks on a white face, crumpled cellophane.
    // There they only tint: the form is the first octave's domes, with wide soft seams)
    float crease = cr1*mix(1.0, smoothstep(-0.1, 0.5, c2.w), 0.8*o2*(1.0 - 0.7*sK))*mix(1.0, smoothstep(-0.1, 0.45, c3.w), 0.7*o3*(1.0 - 0.85*sK));
    float creaseF = cr1*mix(1.0, smoothstep(-0.1, 0.5, c2.w), mix(0.4, 1.0, pK)*o2);      // the seams at a turret's own scale (the finest crinkles only shade)
    float seamF = mix(1.0, smoothstep(-0.05, 0.62, c1.w), o1)*mix(1.0, smoothstep(-0.05, 0.6, c2.w), mix(0.12, 0.8, pK)*o2);      // on steam the seams are broad and soft: a blue-grey valley round every dome
    float occ = (0.35 + 0.65*crease)*mix(1.0, 0.6 + 0.4*dome, o1)*smoothstep(-0.05, 0.5, vT.y);
    float ndl = dot(N, uSunDir), ndg = dot(Ng, uSunDir);
    vec3 V = normalize(cameraPosition - vW);
    float rim = pow(max(1.0 - clamp(dot(N, V), 0.0, 1.0), 0.0), 2.5);
    float fl = 0.0;
    for (int i = 0; i < 2; i++) { vec3 d = vW - uFlashPos[i]; fl += uFlashI[i]/(1.0 + dot(d, d)/3800.0); }      // (a flash lights the turrets round its bolt, not the whole trunk)
    #ifdef IB_SURGE
    // the base surge is dust, not steam: pale warm grey, a wide soft terminator, a lit crest and a dark foot
    float hgt = clamp(vW.y/34.0, 0.0, 1.0);
    float soft = smoothstep(-0.45, 0.5, ndg*0.45 + ndl*0.55);
    occ = mix(1.0, occ, 0.7);
    vec3 alb = uSurgeCol*(0.56 + 0.66*hgt)*(0.72 + 0.28*occ);
    vec3 col = alb*(uSunCol*soft*(0.7 + 0.3*occ)*1.15 + uSkyCol*(0.62 + 0.3*N.y)*(0.5 + 0.5*occ));
    col *= mix(0.5, 1.0, smoothstep(0.5, 11.0, vW.y));
    col += uFlashCol*fl*(0.08 + 0.3*(1.0 - occ));
    #else
    // a crisp terminator on the lobe with a narrow penumbra, crescent shadows in each turret's lee
    // (steam at close range, with the sun behind the eye and the walls seen from below: the light grazes every face, and a crisp
    // terminator there is a patchwork of hard-edged flakes. Its penumbra is three times wider: each dome shades over, lit top to blue-grey flank)
    float lit = smoothstep(mix(-0.1, -0.24, sK), mix(0.2, 0.42, sK), ndg*0.5 + ndl*0.5)*smoothstep(mix(-0.3, -0.4, sK), mix(0.16, 0.4, sK), ndl)*mix(0.6 + 0.4*clamp(ndl, 0.0, 1.0), 0.36 + 0.64*clamp(ndl, 0.0, 1.0), uNight);      // (a turret's cap is brighter than its flank: form on the sunlit wall)
    lit *= mix(0.64, 0.8, uNight) + mix(0.36, 0.2, uNight)*crease;      // (by moonlight the crescents are softer: with so little fill they would be black blotches)
    lit *= 1.0 - formK*mix(mix(0.62, 0.72, clamp(vT.x, 0.0, 1.0)), 0.6, uNight)*(1.0 - mix(seamF, creaseF, clamp(vT.x, 0.0, 1.0))*(0.4 + 0.6*smoothstep(-0.05, 0.5, vT.y)));      // (the seams between turrets, and the seam round a turret's foot, are in shade whatever the sun's angle)
    // (steam, front-lit: every turret is a bright cap that falls away to blue-grey flanks, so the face is matte and round, not glassy)
    lit *= 1.0 - formK*(1.0 - clamp(vT.x, 0.0, 1.0))*mix(0.4, 0.3, uNight)*(1.0 - smoothstep(0.0, 0.8, c1.w))*o1;      // (the flank falls away over most of the dome: broad shading, a lit top)
    lit *= 1.0 - pK*(1.0 - clamp(vT.x, 0.0, 1.0))*0.18*(1.0 - smoothstep(0.0, 0.7, c2.w))*o2;
    // (and the crown of every steam turret the sun reaches is the brightest thing on its face: cream caps over blue-grey seams)
    lit = mix(lit, 1.0, 0.5*formK*(1.0 - clamp(vT.x, 0.0, 1.0))*dome*seamF*smoothstep(0.0, 0.35, ndl)*smoothstep(0.1, 0.5, vT.y));
    // light thrown back up from the sunlit turrets and sea below: the shadowed undersides keep their form
    float bn = max(dot(N, normalize(vec3(uSunDir.x, -0.45, uSunDir.z))), 0.0); bn *= bn;
    float tone = clamp(vT.x, 0.0, 1.0);
    // (a core, kind -0.25, is the bottom of the crevices between the lobes: no sun or moon reaches it. Lit like a lobe, the stretch
    // of it that shows through a gap beside the portal was a broad pale face by moonlight)
    lit *= 1.0 - step(vT.w, -0.1)*(1.0 - burst);
    // THE ANVIL'S UNDERSIDE (the column above 3 km): a shelf 6 km up and a kilometre thick is lit on its top and its flanks; the
    // faces that look down are in its own shade. Lit like any lobe they were, seen from the slot (whose line of sight runs
    // downwind under the braid), a bunch of bare pale balls hanging in the sky under the portal, solid pale blue by moonlight.
    float under = smoothstep(3000.0, 4200.0, vW.y)*(1.0 - smoothstep(-0.35, 0.45, N.y));
    lit *= 1.0 - under; bn *= 1.0 - under;      // (nor does the light thrown back by the sunlit turrets of the trunks reach it)
    // steam: lit white (albedo <= 0.78), blue-grey shadow with a little warm bounce off the lit turrets beside it.
    // ash: near-black with form, brown-grey rims, blue-black shadow
    vec3 steamLit = uSteam*0.985*uSunCol*(mix(0.62, 0.56, formK) + mix(0.38, 0.44, formK)*occ);
    float skyL = dot(uSkyCol, vec3(0.3, 0.5, 0.2));
    vec3 shC = mix(uShadow, vec3(dot(uShadow, vec3(0.3, 0.5, 0.2))), 0.3)*(skyL*1.9)*mix(uSkyCol/max(skyL, 1e-3), vec3(1.0), 0.5);
    float shF = mix(0.34 + 0.12*uNight, 0.3, formK);
    vec3 steamSh = shC*(shF + (1.0 - shF)*occ)*(0.72 + 0.28*N.y) + uSteam*uSunCol*(0.075*smoothstep(-0.7, 0.0, ndg)*(0.4 + 0.6*occ))
      + mix(uSteam, uShadow, 0.4)*uSunCol*(mix(0.27, 0.58, formK)*bn*(0.2 + 0.8*occ))      // (beside the climb the faces that look down are full in the light the sunlit steam and sea throw back up: pearl, not slate)
      + uSteam*uSunCol*(0.17*uNight*(0.45 + 0.55*occ)*(1.0 - 0.8*under));      // by moonlight the shade is filled by the moonlit steam all round: grey-blue, never black blotches
    // (charcoal, not brown rock: only thin brown-grey rims, the sun's warmth half taken out of its lit faces, and the light the
    // white wall throws back across the slot is cool)
    float capK = formK*dome*creaseF;      // the crown of a turret
    vec3 ashAlb = mix(uAsh*3.0 + 0.026, vec3(0.118, 0.11, 0.104), clamp(rim*0.35 + dome*0.16 - 0.05 + capK*0.28, 0.0, 1.0));
    float sunL = dot(uSunCol, vec3(0.3, 0.5, 0.2));
    vec3 ashSun = mix(uSunCol, vec3(sunL), 0.5);
    vec3 ashLit = ashAlb*ashSun*(mix(0.4, 0.22, formK) + mix(0.6, 0.78, formK)*occ)*mix(1.3, 1.4, formK) + uSkyCol*vec3(0.8, 0.93, 1.2)*(0.03*capK*max(N.y, 0.0));      // (charcoal caps with a cold sheen of sky, blue-black seams)
    vec3 ashSh = (ashAlb*0.4 + vec3(0.002, 0.004, 0.009))*(0.22 + 0.78*occ)*uSkyCol*1.9*(0.74 + 0.26*N.y) + uSkyCol*vec3(0.85, 0.96, 1.15)*rim*(0.026 + 0.07*occ)
      + vec3(0.034, 0.034, 0.038)*sunL*(bn*occ);
    float wb = max(dot(N, vec3(${(-PX * 0.97).toFixed(4)}, -0.22, ${(-PZ * 0.97).toFixed(4)})), 0.0);      // toward the white trunk across the slot: its sunlit steam throws light back
    float wbw = clamp(wb*wb*0.9 + 0.22*smoothstep(-0.5, 0.3, dot(N, vec3(${(-PX).toFixed(4)}, 0.0, ${(-PZ).toFixed(4)}))), 0.0, 1.0);      // (each turret has a side that faces the white wall and a side that does not: that is the black wall's relief)
    ashSh += ashAlb*mix(uSunCol, uSkyCol, 0.6)*vec3(0.9, 0.97, 1.08)*(2.3*wbw*(mix(0.2, 0.06, formK) + mix(0.8, 0.94, formK)*occ));
    ashSh += uSkyCol*vec3(0.8, 0.93, 1.2)*(0.022*capK*max(N.y, 0.0));
    // the vent's own dull glow on the undersides of the lowest black lobes (bombs leave it incandescent), gone by 300 m up
    ashSh += vec3(1.0, 0.36, 0.1)*(0.02*(1.0 - smoothstep(-0.7, 0.15, N.y))*exp(-max(vW.y, 0.0)/170.0)*(0.4 + 0.6*occ));
    vec3 col = mix(mix(steamSh, steamLit, lit), mix(ashSh, ashLit, lit), tone);
    // THE ANVIL (above 3 km) has no mesh for turrets: its cells (0.4 of a lobe's radius) carry them in tone, a paler crown on every
    // cell and a deep seam round it, so that from 6 km below, by day and by moonlight, the shelf is a crowd of billows continuous
    // with the column, not a bunch of smooth balls
    float anv = smoothstep(3000.0, 4200.0, vW.y)*o1;
    col *= mix(1.0, (0.42 + 0.78*smoothstep(-0.02, 0.5, c1.w))*(0.8 + 0.3*dome), anv);
    // lightning inside: strongest in the crevices, falling off with distance
    // (in the form range the flash follows the turrets: their caps take it and their seams stay dark. Poured into the crevices
    // as it is from afar, it flattened a black lobe beside the climb to one violet sheet for the length of a flash)
    col += uFlashCol*fl*(mix(0.10, 0.26*mix(seamF, creaseF, tone), formK) + 0.5*(1.0 - occ)*(1.0 - 0.75*formK) + 0.25*rim)*mix(1.0, 0.3, tone)*mix(1.0, 0.25, burst);
    #endif
    gl_FragColor = vec4(col, 1.0);
    ${FOG_F}
  }`;


const CLOUD_VERT_HEAD = /* glsl */`
  attribute vec3 aCenter; attribute vec4 aLobe; attribute vec3 aOut; attribute vec3 aTone;
  uniform float uTime, uClock; uniform vec4 uSurge;      // uSurge: ring radius, strength, K.x, K.z
  varying vec3 vLp; varying vec3 vN; varying vec3 vW; varying vec4 vT;
  ${FOG_PV}
  ${NOISE_GLSL}
  // the boiling surface: radius factor of a lobe in direction dir (x), and its three billow octaves (yzw)
  vec4 ibDisp(vec3 dir, vec3 sd, float tf, float w2, float w3, float dm){
    float n1 = ibBillow(dir*1.25 + sd + vec3(0.0, -tf*0.11, 0.0), dm);
    float n2 = ibBillow(dir*2.9 - sd + vec3(0.0, -tf*0.17, 0.0), dm);
    float n3 = ibBillow(dir*6.1 + sd.zxy + vec3(0.0, -tf*0.2, 0.0), dm);     // turrets within turrets
    return vec4(0.66 + 0.42*n1 + w2*n2 + w3*n3, n1, n2, n3);
  }
`;
const CLOUD_VERT_TAIL = /* glsl */`
    vec3 dir = position;
    vec3 sd = vec3(aLobe.w*17.0, aLobe.w*5.3, aLobe.w*-9.1);
    float tf = uTime*flowK;
    vec4 D0 = ibDisp(dir, sd, tf, w2, w3, domeK);
    float d = D0.x, n1 = D0.y, n2 = D0.z, n3 = D0.w;
    // (a core tube keeps to 0.66 to 0.8 of its radius: swelling to 1.23 like a lobe it stood proud of its own trunk's lobes, and
    // beside the climb it was a broad smooth face 20 segments round, in front of the turrets that should wall the way to the portal)
    d = mix(d, 0.66 + (d - 0.66)*0.25, tubeK);
    // the true normal of the boiling surface, from two neighbours on the sphere: the mesh's own turrets take
    // light and shade and move their terminators as they roll (a bare sphere normal shades a lobe like plaster)
    vec3 ref = abs(dir.y) > 0.85 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    vec3 t1 = normalize(cross(ref, dir)), t2 = cross(dir, t1);
    vec3 da = normalize(dir + t1*0.07), db = normalize(dir + t2*0.07);
    // (only the octaves this lobe's mesh can carry go into the normal: wn = their weights; a coarse lobe shades by its big billows alone)
    float dn = 0.66 + 0.42*n1 + wn.x*n2 + wn.y*n3;
    vec3 pa = da*ibDisp(da, sd, tf, wn.x, wn.y, domeK).x - dir*dn, pb = db*ibDisp(db, sd, tf, wn.x, wn.y, domeK).x - dir*dn;
    vec3 nd = cross(pa, pb); nd = nd/max(length(nd), 1e-5);
    vec3 nm = mix(dir, nd, nrmK); nm = nm/max(length(nm), 1e-4);
    vec3 lp = c + dir*(r*sc*d);
    vLp = mix(mat3(modelMatrix)*(dir*(r*d)) + sd*3.1 + drift, mat3(modelMatrix)*lp, tubeK);
    vN = normalize(mat3(modelMatrix)*nm);
    float cell = min(max(r*cellK, cellMin), cellMax);
    cell = mix(cell, 34.0, tubeK);      // (a core's cells are the size of the lobes' own turrets: where it shows it is the shaded bottom of a crowd of them, not one face)
    // (a big lobe's triangles are too coarse to carry the fine octaves of the occlusion: they would show as dark polygons)
    float occHi = 1.0 - smoothstep(34.0, 60.0, r);
    vT = vec4(tone, ((n1*0.62 + mix(0.5, n2, occHi)*0.26 + mix(0.5, n3, occHi)*0.12)*aTone.z - (1.0 - sc)*0.3)*seat, 2.1/cell, kind);
    vec4 wp = modelMatrix*vec4(lp, 1.0); vW = wp.xyz;
    vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
    ${FOG_V}
  }`;
// trunks, column and the root bursts
const CLOUD_VERT = CLOUD_VERT_HEAD + /* glsl */`
  uniform float uNearK;       // 0..1: how far the fine lobes' extra relief and the climb-only turrets have grown out (see setNearGrow)
  attribute vec4 aKid;        // a turret on a lobe: xyz = its seat (offset from the parent's centre, in parent radii), w = its radius / the parent's (1 = not a turret)
  void main(){
    float R = aLobe.x, tone = aTone.x, mode = aTone.y, flowK = 1.0;
    float kid = step(aKid.w, 0.99), slotK = step(0.2, mode)*step(mode, 0.5), fineK = step(0.35, mode)*step(mode, 0.5);
    float domeK = max(slotK, kid), nrmK = mix(0.22, mix(0.8, 0.5, kid), domeK);
    float xK = step(0.43, mode)*step(mode, 0.5), cellMax = mix(95.0, 19.0, xK);      // (on the very fine lobes a cell is a 12 to 19 m turret however big the lobe: a 100 m roof lobe is not five 45 m faces)
    // (the anvil's lobes, 400 m and more across and only ever seen from 8 km below, up the slot: with 95 m cells, under a pixel there,
    // they were pale smooth balls under the portal; their cells are 0.4 of their radius, a dozen billows across each, above 3 km)
    cellMax = max(cellMax, R*0.4*smoothstep(3000.0, 4200.0, aCenter.y));
    float cellMin = mode > 0.5 ? 24.0 : max(13.0*kid, 12.0*xK), cellK = mix(mix(1.0, mix(0.68, 0.56, fineK), slotK), 0.5, xK);      // (finer cells on the finest lobes: a face beside the climb is many turrets)
    float w2 = mix(0.10, mix(0.15, 0.17, xK), max(fineK, kid)), w3 = mix(mix(0.05, 0.085, xK), 0.02, kid);
    w3 *= mix(1.0, 1.0 - smoothstep(36.0, 62.0, R), fineK*(1.0 - kid));      // (a 100 m lobe's triangles are too big for the third octave: it would show as facets)
    // (a fine lobe starts with its coarse twin's relief and grows its own; a climb-only turret, mode 0.05, grows out of its lobe)
    float nk = mix(1.0, uNearK, fineK*(1.0 - kid)), growK = mix(1.0, uNearK, step(0.03, mode)*step(mode, 0.1));
    w2 = mix(0.10, w2, nk); w3 = mix(0.05, w3, nk);
    vec2 wn = vec2(w2*slotK, w3*fineK*nk);
    float live = step(1e-5, aLobe.z)*step(mode, 0.5);
    float tubeK = (1.0 - step(1e-5, aLobe.z))*step(mode, 0.1);
    float p = fract(aLobe.y + uTime*aLobe.z);
    float env = mix(1.0, smoothstep(0.0, 0.3, p)*(1.0 - smoothstep(0.72, 1.0, p)), live);
    // (a lobe is born from nothing and sinks to nothing, deep inside its trunk: at 0.42 of its size, the least it used to be,
    // a newborn lobe seen through a gap where the trunks braid was a bare pale ball hanging in the top of the slot)
    float sc = mix(0.42, 1.0, env)*mix(smoothstep(0.0, 0.25, env), 1.0, step(780.0, aCenter.y));      // (the column's great lobes, above the braid, keep to 0.42: they are too few to come and go)
    // a turret swells and sinks on its own beat while it rides its lobe
    // (and grows with it: on a lobe that is still small a full-size turret was as big as the lobe, a bare ball in the wall)
    float r = R*aKid.w*growK*(1.0 + kid*0.13*sin(uTime*(0.5 + 0.5*fract(aLobe.w*7.7)) + aLobe.w*50.0))*mix(1.0, smoothstep(0.42, 0.7, sc), kid);
    // A turret's seat. Most are fixed (aKid.xyz = offset in lobe radii, under 0.9). A TURRET OF THE VIEWS (|aKid.xyz| >= 1: its
    // direction, times 1 + its lobe's seed) is seated on its lobe's boiling surface as it is at this moment: the lobe's own
    // radius in that direction is worked out here, and the turret stands a third sunk in it, so it is always a dome proud of
    // the face with a dark seam round its foot, and it heaves as the boil passes under it.
    float kl = length(aKid.xyz), seatC = kid*step(0.99, kl), deepK = step(1.995, kl);      // (|aKid.xyz| >= 2: seated deeper, a low dome: the walls and the roof seen from below, where a proud turret alone on a face is a wart)
    vec3 kd = aKid.xyz/max(kl, 1e-4);
    // (a lobe is born 0.6 radii inside its trunk and wells out as it swells: born nearer the surface, the small lobes at the
    // far end of the slot hung in its top as pale balls under the portal)
    vec3 c = aCenter + live*(vec3(0.0, (p - 0.5)*R*1.6, 0.0) + aOut*(((env - 0.55)*0.45 - 0.35*(1.0 - env)*(1.0 - env))*R)) + aKid.xyz*(R*sc*(1.0 - seatC));
    if (seatC > 0.5) {
      float ps = kl - 1.0 - deepK, f3 = 1.0 - smoothstep(36.0, 62.0, R);
      float pd = ibDisp(kd, vec3(ps*17.0, ps*5.3, ps*-9.1), uTime, mix(0.10, 0.17, uNearK), mix(0.05, 0.085*f3, uNearK), 1.0).x;      // (its lobe is one of the very fine ones: the same weights as below)
      c += kd*(sc*(R*pd - mix(0.35, 0.6, deepK)*r));
    }
    // far off, the lobes shade as before (a turret keeps its own form out to 500 m: at 300 m it showed as a bare ball)
    // (both ranges grow with height like the fragment shader's form range: see hiK there)
    vec3 cwn = (modelMatrix*vec4(c, 1.0)).xyz; float hiV = 0.7*clamp(cwn.y - 200.0, 0.0, 600.0);
    nrmK = mix(0.22, nrmK, 1.0 - smoothstep(mix(140.0, 300.0, kid) + hiV, mix(300.0, 520.0, kid) + hiV, distance(cwn, cameraPosition)));
    float seat = mix(1.0, mix(smoothstep(-0.6, 0.25, dot(position, kd)), smoothstep(mix(0.05, 0.3, deepK), mix(0.7, 0.9, deepK), dot(position, kd)), seatC), kid);      // dark where a turret meets its lobe
    float kind = mode > 0.5 ? -1.0 : max(kid, mix(0.5*slotK, 0.75, uNearK*(1.0 - xK)));      // (1 turret, 0.5 a lobe that walls the slot, 0 any other lobe: both ease to 0.75 for the climb unless very fine; -1 root burst)
    kind = mix(kind, -0.25, tubeK);      // (a core: always in the lobes' shade, see CLOUD_FRAG)
    flowK = 1.0 + 0.8*kid;
    vec3 drift = vec3(0.0);
    if (mode > 0.5) {                       // root burst, keyed to the volley clock (aLobe.z = how far this lobe is thrown, aLobe.y = its delay)
      float vol = floor(uClock/3.0), ph = fract(uClock/3.0), tau = max(ph*3.0 - aLobe.y*0.35, 0.0);
      float big = 1.0 + 0.4*step(mod(vol, 4.0), 0.5);
      float e1 = 1.0 - exp(-tau*1.9);
      float life = smoothstep(0.0, 0.09, tau/3.0)*(1.0 - smoothstep(0.5, 0.97, ph));
      float reach = (mode > 1.5 ? 95.0 : r*2.6)*aLobe.z;
      c = aCenter + aOut*(reach*e1*big) + vec3(0.0, mode > 1.5 ? r*0.22*e1 : 0.0, 0.0);
      // the black dome's lobes never show as small balls: they keep their size, rise out of the sea and sink back into it
      if (mode < 1.5) { sc = (0.66 + 0.34*e1)*big; c.y -= r*1.75*(1.0 - life); }
      else sc = life*(0.5 + 0.5*e1)*big;
      flowK = 3.0;
    }
`+ CLOUD_VERT_TAIL;
// the base surge: a wall of many small rolling lobes in stepped rows, riding a ring whose radius is a uniform.
// aOut = (cos, height factor, sin), aLobe = (size factor, phase, roll rate, seed), aTone.y = how far behind the front.
const SURGE_VERT = CLOUD_VERT_HEAD + /* glsl */`
  void main(){
    float tone = aTone.x, flowK = 4.0, cellMin = 0.0, cellK = 1.0, cellMax = 95.0, nrmK = 0.0, domeK = 0.0, w2 = 0.10, w3 = 0.05, seat = 1.0, kind = 0.0, tubeK = 0.0; vec2 wn = vec2(0.0);
    float rho = max(uSurge.x - aTone.y, 4.0);
    float grow = clamp(rho*0.07 + 5.0, 6.0, 17.0);            // the wall is born low and stands 35-40 m by the lagoon's middle
    float r = grow*aLobe.x;
    vec2 cxz = uSurge.zw + vec2(aOut.x, aOut.z)*rho;
    // the surge is held in by the crater and pours out through the breach
    float dC = length(cxz), al = dot(cxz, vec2(${BX}, ${BZ})), pe = abs(dot(cxz, vec2(${PX}, ${PZ})));
    float inside = max(1.0 - smoothstep(168.0, 204.0, dC), smoothstep(-30.0, 50.0, al)*(1.0 - smoothstep(66.0, 104.0 + max(al - 150.0, 0.0)*0.3, pe)));
    float roll = 0.88 + 0.12*sin(uTime*aLobe.z*6.2832 + aLobe.y*6.2832);
    // nothing solid ever reaches the lens: a lobe melts away inside the mist before it is 50 m off
    vec3 cw = (modelMatrix*vec4(cxz.x, grow*aOut.y, cxz.y, 1.0)).xyz;
    float nearK = smoothstep(1.5*r + 42.0, 1.5*r + 82.0, distance(cw, cameraPosition));
    float sc = uSurge.y*inside*roll*nearK;
    vec3 c = vec3(cxz.x, grow*aOut.y*(0.35 + 0.65*sc) + r*0.1*sin(uTime*aLobe.z*4.0 + aLobe.w*40.0), cxz.y);
    vec3 drift = vec3(aOut.x, -1.0, aOut.z)*(uTime*2.0);
`+ CLOUD_VERT_TAIL;

function makeCloudMaterial(vert, U, pal, surge) {
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: {
      uSteam: { value: pal.steam.clone() }, uShadow: { value: pal.shadow.clone() }, uAsh: { value: pal.ash.clone() }, uFlashCol: { value: new THREE.Color('#D9C8FF') }, uSurgeCol: U.uSurgeCol,
    },
    vertexShader: vert, fragmentShader: CLOUD_FRAG,
  });
  mat.defines = {}; if (U.fine) mat.defines.IB_OCT2 = 1; if (surge) mat.defines.IB_SURGE = 1;
  for (const k of ['uTime', 'uClock', 'uSurge', 'uSunDir', 'uSunCol', 'uSkyCol', 'uNight', 'uFlashPos', 'uFlashI', 'uNearK']) mat.uniforms[k] = U[k];
  return mat;
}
// lobes are listed first (so the random draws keep their order), then written into buffers of exactly the right size
async function fillLobes(ctx, list, extraV, extraI) {
  let nv = extraV, ni = extraI;
  for (let i = 0; i < list.length; i++) { nv += list[i].S.nv; ni += list[i].S.idx.length; }
  const B = makeLobeBuffers(nv, ni);
  return { B, async run() { let w = 0; for (let i = 0; i < list.length; i++) { pushLobe(B, list[i].S, list[i].L); w += list[i].S.nv; if (w > 1400) { w = 0; await ctx.yield(); } } } };
}

// the climb line up the slot (local space), from the slot's base to the slate roof; the portal sits at t = 0.685 along it
const CL_A = [-150, 22, 136], CL_D = [273, 595, -247], CL_L2 = 273 * 273 + 595 * 595 + 247 * 247, CL_LEN = Math.sqrt(CL_L2), CL_PORTAL = 0.685;
function climbNear(x, y, z, out) {
  const t = clamp(((x - CL_A[0]) * CL_D[0] + (y - CL_A[1]) * CL_D[1] + (z - CL_A[2]) * CL_D[2]) / CL_L2, 0, 1);
  out.x = CL_A[0] + CL_D[0] * t; out.y = CL_A[1] + CL_D[1] * t; out.z = CL_A[2] + CL_D[2] * t; out.t = t;
  out.d = Math.hypot(x - out.x, y - out.y, z - out.z);
  return out;
}

// The route (local space): anchors.flyThrough. Its last three points are the climb line above (CL_A, then on toward CL_A + CL_D).
const FLY = [[-120, 2.4, 800], [-109, 2.4, 720], [-135, 2.4, 550], [-180, 2.4, 400], [-230, 2.6, 300], [-246, 2.8, 223], [-189, 3.2, 171], [-150, 22, 136], [-80, 178, 73], [37, 430, -33]];

async function buildClouds(ctx, rng, G, U, pal) {
  const S7 = await unitSphere(ctx, 6);
  await ctx.yield();
  const S5 = await unitSphere(ctx, 5);
  await ctx.yield();
  const SXX = await unitSphere(ctx, 13);         // 3,920 triangles: the four lobes nearest the climb line (a face passed at 45 m keeps round turrets, not facets)
  await ctx.yield();
  const SX = await unitSphere(ctx, 10);          // 2,420 triangles (it was 2,880: the difference pays for the trunks' heads and the first ring of the column, below): a 40 m lobe carries its own 10 to 20 m turrets as real relief
  await ctx.yield();
  const S3 = await unitSphere(ctx, 3), S2 = await unitSphere(ctx, 2), S1 = await unitSphere(ctx, 1);
  const CAP3 = capOf(S3, -0.25), CAP3B = capOf(S3, -0.3);
  await ctx.yield();
  const near = { x: 0, y: 0, z: 0, t: 0, d: 0 };
  const nT = 96, nC = 65;
  const wind = G.wind, tl = G.tanLean;
  const trunkAxis = (s, y) => {
    const o = (slotHalf(y) + trunkR(y) * (1 - 0.45 * smoothstep(450, 700, y))) * s, l = leanOff(y, tl);
    return [PX * o + wind[0] * l, PZ * o + wind[1] * l];
  };
  const colAxis = (y) => { const l = leanOff(y, tl); return [wind[0] * l, wind[1] * l]; };
  G.trunkAxis = trunkAxis; G.colAxis = colAxis; G.slotLobes = [];
  let list = []; const slotE = [], roofL = [], nearList = [], farList = [];
  // the two trunks: stratified rings of turrets. The lobes that wall the slot (the closest pass) are finely tessellated.
  for (let t = 0; t < 2; t++) {
    const s = t === 0 ? 1 : -1, rowsN = 12, per = nT / rowsN;
    for (let j = 0; j < rowsN; j++) {
      const a0 = rng() * 6.283;
      for (let i = 0; i < per; i++) {
        const y = Math.max(8, (j + rng.range(0.1, 0.9)) / rowsN * 700), ang = a0 + (i + rng.range(-0.3, 0.3)) / per * 6.283;
        const r = rng.range(22, 44) * (1 + y / 1000) * (rng.chance(0.18) ? 1.35 : 1), R = trunkR(y) * (y > 450 ? 1.08 : 1), ax = trunkAxis(s, y);
        const dx = Math.cos(ang), dz = Math.sin(ang), k = R - 1.02 * r;
        const mix = smoothstep(400, 700, y);
        const L = {
          x: ax[0] + dx * k, y, z: ax[1] + dz * k, r, phase: rng(), rate: rng.range(0.13, 0.22) * 34 / r, seed: rng.range(0, 1),
          ox: dx * 0.92, oy: 0.38, oz: dz * 0.92, tone: s > 0 ? lerp(1, rng.range(0.45, 0.75), mix) : lerp(0, rng.range(0.05, 0.3), mix), mode: 0, occ: 1,
        };
        climbNear(L.x, L.y, L.z, near);
        const slot = (dx * PX + dz * PZ) * s < -0.25 || near.d - r < 105;
        const back = dx * BX + dz * BZ;      // how far it faces away from the breach (never seen closer than 600 m below the braid)
        const E = { S: slot ? S5 : (y < 450 && back < -0.75) ? S1 : (y < 450 && back < -0.4) || y >= 450 ? S2 : S3, L };
        if (slot) { G.slotLobes.push(L); climbNear(L.x, L.y, L.z, near); L.clear = near.d - r; L.mode = 0.25; slotE.push(E); }
        list.push(E);
      }
    }
  }
  await ctx.yield();
  // no slot lobe may swell to within 42 m of the climb line below the portal (a face that near fills a third of the frame as one smooth sheet): it is made smaller
  const trunkE = list.slice();
  for (const E of slotE) {
    const L = E.L; climbNear(L.x, L.y, L.z, near); L.ct = near.t;
    const keep = near.t > 0.5 ? 50 : 42;      // (further off beside the last third of the climb, where the eye rests on the walls)
    if (near.t > 0.15 && near.t < 0.9 && near.d - 1.23 * L.r < keep) { L.r = Math.max(18, (near.d - keep) / 1.23); L.clear = near.d - L.r; }
    L.pri = L.clear - (near.t > 0.45 ? 40 : 0) - (near.t > 0.62 ? 20 : 0);
  }
  slotE.sort((a, b) => a.L.pri - b.L.pri);
  await ctx.yield();
  // root bursts at K: a low black dome of small turrets and a ragged ring of flashed steam thrown out over the lagoon
  const rb = rng.fork('bursts');
  G.burstPuffs = [];
  {
    const ax = trunkAxis(1, 0);
    for (let i = 0; i < 18; i++) {
      const ang = (i + rb.range(-0.3, 0.3)) / 18 * 6.283, dx = Math.cos(ang), dz = Math.sin(ang), r = rb.range(11, 18), up = rb.range(0.3, 0.8);
      list.push({ S: S2, L: { x: ax[0] + dx * rb.range(26, 44), y: rb.range(6, 16), z: ax[1] + dz * rb.range(26, 44), r, phase: rb(), rate: rb.range(1.0, 1.3), seed: rb(), ox: dx * 0.8, oy: up, oz: dz * 0.8, tone: 1, mode: 1, occ: 1 } });
    }
    // the flashed-steam ring: many small soft domes (fine caps, none bigger than 12 m), under a translucent sprite skirt
    for (let i = 0; i < 52; i++) {
      const ang = (i + rb.range(-0.45, 0.45)) / 52 * 6.283, dx = Math.cos(ang), dz = Math.sin(ang), r = rb.range(6.5, 11.5), reach = rb.range(0.5, 1.08);
      list.push({ S: CAP3B, L: { x: ax[0] + dx * 58, y: -r * rb.range(0.12, 0.34), z: ax[1] + dz * 58, r, phase: rb(), rate: reach, seed: rb(), ox: dx, oy: 0, oz: dz, tone: rb.range(0, 0.06), mode: 2, occ: 1, axis: [0, 1, 0] } });
    }
    for (let i = 0; i < 84; i++) {
      const ang = (i + rb.range(-0.5, 0.5)) / 84 * 6.283, dx = Math.cos(ang), dz = Math.sin(ang);
      G.burstPuffs.push({ x: ax[0] + dx * 58, z: ax[1] + dz * 58, dx, dz, reach: rb.range(0.5, 1.2), size: rb.range(14, 25), seed: rb() });
    }
  }
  await ctx.yield();
  // the column: rising rings that grow with height, sheared into an anvil at the top
  const rowsC = 13, perC = nC / rowsC, roofE = [], colE = [];
  for (let j = 0; j < rowsC; j++) {
    const a0 = rng() * 6.283, f = j / (rowsC - 1);
    for (let i = 0; i < perC; i++) {
      const anvil = smoothstep(0.8, 1, f);
      let y = 650 + (G.colH - 650) * Math.pow((j + rng.range(0.15, 0.85)) / rowsC, 1.45);
      const Rc = columnR(y), ang = a0 + (i + rng.range(-0.3, 0.3)) / perC * 6.283, r = Rc * rng.range(0.44, 0.62) * (1 - 0.25 * anvil);
      const dx = Math.cos(ang), dz = Math.sin(ang), ax = colAxis(y), k = Rc - 0.8 * r;
      const sm = anvil * rng.range(0.2, 2.6) * Rc;                    // downwind smear
      if (anvil > 0) y = lerp(y, G.colH * 0.93, anvil * 0.8) + rng.range(-0.1, 0.1) * Rc;
      const lee = dx * PX + dz * PZ;
      // the lowest ring is the slate roof over the portal, looked straight up at for the whole climb: fine mesh, domed boil, turrets (below).
      // Its five lobes do not rise and sink like the rest (rate 0): a lobe being born under the ring hung in the top of the slot as
      // a bare ball with its turrets round it. They stand where they are and boil in place, so the roof is always whole.
      const E = { S: S2, L: {
        x: ax[0] + dx * k + wind[0] * sm, y, z: ax[1] + dz * k + wind[1] * sm, r, phase: rng(), rate: rng.range(0.1, 0.16) * 60 / r, seed: rng.range(0, 1),
        ox: dx * 0.9, oy: 0.42, oz: dz * 0.9, tone: clamp((0.3 + 0.3 * lee + rng.range(-0.08, 0.08)) * (1 - 0.6 * smoothstep(900, 3800, y)) + 0.16 * (1 - smoothstep(650, 1000, y)), 0, 1), mode: j === 0 ? 0.45 : 0, occ: 1,
      } };
      // (the roof ring is 100 m lobes seen from 150 m: it is in the near / far sets too, or its faces are smooth sheets)
      if (j === 0) { E.L.rate = 0; roofL.push(E.L); roofE.push(E); nearList.push({ S: SX, L: E.L }); farList.push({ S: S2, L: Object.assign({}, E.L, { mode: 0.25 }) }); } 
      // (the first ring above the braid, 105 to 150 m lobes seen from 400 m all the way up the slot and beside the portal at its end: on
      // their 180 triangles with 95 m cells they were the broad smooth sheets left of the portal. For the climb they have a finer
      // mesh and turret-sized cells; for everything else they are as they were.)
      else if (j === 1) { roofE.push(E); nearList.push({ S: S7, L: Object.assign({}, E.L, { mode: 0.45 }) }); farList.push({ S: S2, L: E.L }); }
      else { list.push(E); colE.push(E); }
    }
  }
  // THE ANVIL'S SHELF. The top two rings are smeared up to 2.6 column radii downwind, each lobe by its own amount, which
  // left the far ones standing alone: from the slot, whose line of sight runs downwind under the braid, they were three or
  // four bare pale balls in the sky below the portal (solid pale blue by moonlight). Fourteen more lobes in two staggered
  // rows fill the smear from the column's head to its tip, so the anvil is one shelf with a scalloped edge. (Their numbers
  // come from a private stream seeded by a lobe already made: the shared stream's order is untouched.)
  {
    const ra = makeRng(Math.floor((roofL.length ? roofL[0].seed : 0.5) * 1e9) + 17), yA = G.colH * 0.93, RcA = columnR(yA), axA = colAxis(yA);
    for (let i = 0; i < 14; i++) {
      const sm = (0.15 + 2.5 * i / 13) * RcA, lat = ((i & 1) ? 0.36 : -0.36) * RcA + ra.range(-0.1, 0.1) * RcA, r = RcA * ra.range(0.42, 0.52);
      list.push({ S: S2, L: {
        x: axA[0] + wind[0] * sm - wind[1] * lat, y: yA + ra.range(-0.1, 0.04) * RcA, z: axA[1] + wind[1] * sm + wind[0] * lat, r, phase: ra(), rate: ra.range(0.1, 0.16) * 60 / r, seed: ra.range(0, 1),
        ox: wind[0] * 0.5, oy: 0.42, oz: wind[1] * 0.5, tone: ra.range(0.08, 0.16), mode: 0, occ: 1,
      } });
    }
  }
  await ctx.yield();
  // THE UPPER SLOT (what the last third of the climb flies beside and looks straight at): its 26 nearest lobes (and the roof ring's five) are built
  // twice. `near` is the very fine mesh (mode 0.45: three billow octaves of real relief, so a face is a dozen turrets with
  // lit caps and crescent shadows, never a smooth sheet); `far` is a coarse twin for the run-in, where they are 500 m off.
  // The world swaps them (hero.setNear) while the camera is inside the surge.
  let lowE;
  {
    const upper = slotE.filter((E) => E.L.ct > 0.3 && E.L.ct < 0.97 && E.L.clear < 130).sort((a, b) => a.L.clear - b.L.clear).slice(0, 26);
    for (const E of upper) { E.fine = true; E.L.mode = 0.45; nearList.push({ S: SX, L: E.L }); farList.push({ S: S3, L: Object.assign({}, E.L, { mode: 0.25 }) }); }
    // FINE MESHES BY DISTANCE TO THE CLIMB LINE. Every trunk lobe, whichever way it faces, has its clearance from the line
    // (E.cl) and where along the line it stands (E.ct). After the upper slot's 26: the twelve nearest of the line's first third
    // (from the surge's top up: the walls the climb bursts out between) and then the five nearest left anywhere along it are
    // built twice as well (very fine for the climb, a coarse twin for everywhere else).
    for (const E of trunkE) { const L = E.L; climbNear(L.x, L.y, L.z, near); E.cl = near.d - L.r; E.ct = near.t; }
    const promote = (E) => {
      const L = E.L;
      if (L.clear === undefined) { L.clear = E.cl; L.ct = E.ct; L.pri = L.clear; E.promoted = true; G.slotLobes.push(L); slotE.push(E); }
      E.fine = true; L.mode = 0.45; nearList.push({ S: SX, L }); farList.push({ S: S5, L: Object.assign({}, L, { mode: 0.25 }) });
    };
    lowE = trunkE.filter((E) => !E.fine && E.ct > 0.03 && E.ct <= 0.3).sort((a, b) => a.cl - b.cl).slice(0, 12);
    for (const E of lowE) promote(E);
    const upE = trunkE.filter((E) => !E.fine && E.ct > 0.03 && E.ct < 0.97).sort((a, b) => a.cl - b.cl).slice(0, 5);
    for (const E of upE) promote(E);
    G.upLobes = upE.length; G.lowLobes = lowE.length;
    // the four of all the very fine lobes that stand nearest the line have a finer mesh still
    { const six = nearList.filter((N) => N.S === SX && N.L.clear !== undefined && N.L.rate > 0).sort((a, b) => a.L.clear - b.L.clear).slice(0, 4); for (const N of six) N.S = SXX; }
    // THE TRUNKS' HEADS: every other lobe above 420 m that stands within 160 m of the last two fifths of the climb line, on the
    // sides of its trunk that do not wall the slot. They were made for views from 600 m (180 triangles, cells as wide as the
    // lobe), but the top of the climb passes them at 150 to 300 m, where a flank of one is a broad smooth sheet with folds.
    // For the climb each has a finer mesh, the slot's domed boil and cells half its radius; for everything else it is as it was.
    let topN = 0;
    for (const E of trunkE) {
      const L = E.L; if (E.fine || L.clear !== undefined || L.y < 420) continue;
      climbNear(L.x, L.y, L.z, near); if (near.t < 0.6 || near.d - L.r > 160) continue;
      E.fine = true; topN++; nearList.push({ S: S7, L: Object.assign({}, L, { mode: 0.4 }) }); farList.push({ S: E.S, L });
    }
    G.topLobes = topN;
    list = list.filter((E) => !E.fine);
  }
  for (let i = 0, k = 0; i < slotE.length && k < 10; i++) if (!slotE[i].fine) { slotE[i].S = S7; slotE[i].L.mode = 0.4; k++; }
  await ctx.yield();
  // TURRETS STAND ALL ROUND THEIR LOBE, WHEREVER ITS SURFACE IS THE CLOUD'S OWN. A turret's seat is a direction from its lobe's
  // centre (the lobe's outward normal at that place, which is also the turret's axis), dealt evenly over the whole sphere
  // from THE LOBE'S OWN STREAM (its seed and the number of the set). It stands there if that point of the lobe is outside every
  // other lobe of the trunks and the column and outside their dark cores (a turret buried in the cloud would be seen from
  // nowhere), if it is far enough from the turrets the lobe already has, and if it is no nearer the climb line than 22 m
  // (12 m beyond the portal, where nobody flies): a margin in metres. Nothing is turned toward the route, the eye or the
  // portal. Turrets ride their lobe's boil (aKid) and swell on their own beat. HOW MANY a lobe gets is level of detail, a
  // rule in space: the nearer the lobe stands to the climb line, the more.
  G.kids = [];
  const bodyL = trunkE.map((E) => E.L).concat(roofE.map((E) => E.L), colE.map((E) => E.L));
  const lobeRng = (L, set) => makeRng(Math.floor(clamp(L.seed, 0, 0.999999) * 1e9) + set);
  const dirOn = (rs) => { const y = rs.range(-1, 1), a = rs.range(0, 6.2832), h = Math.sqrt(Math.max(0, 1 - y * y)); return [h * Math.cos(a), y, h * Math.sin(a)]; };
  const neighbours = (L, L2) => bodyL.filter((M) => M !== L && M !== L2 && Math.hypot(M.x - L.x, M.y - L.y, M.z - L.z) < L.r + M.r);
  const inCore = (x, y, z) => {
    if (y < 720) for (let s = -1; s <= 1; s += 2) { const ax = trunkAxis(s, y); if (Math.hypot(x - ax[0], z - ax[1]) < trunkR(y) - 27) return true; }
    if (y > 600) { const ax = colAxis(y); if (Math.hypot(x - ax[0], z - ax[1]) < columnR(y) * 0.62) return true; }
    return false;
  };
  // is the point of lobe L in direction d on the outside of the cloud? (nb: the lobes that touch L)
  const exposed = (L, d, nb) => {
    const x = L.x + d[0] * L.r, y = L.y + d[1] * L.r, z = L.z + d[2] * L.r;
    for (let i = 0; i < nb.length; i++) { const M = nb[i], dx = x - M.x, dy = y - M.y, dz = z - M.z, rr = 0.85 * M.r; if (dx * dx + dy * dy + dz * dz < rr * rr) return false; }
    return !inCore(x, y, z);
  };
  const crowded = (got, d, sep) => { for (const g of got) if (g[0] * d[0] + g[1] * d[1] + g[2] * d[2] > sep) return true; return false; };
  // (the margin from the climb line: the turret's place at `reach` lobe radii, less its own swollen radius)
  const clearOf = (L, d, reach, cr) => { climbNear(L.x + d[0] * reach * L.r, L.y + d[1] * reach * L.r, L.z + d[2] * reach * L.r, near); return near.d - cr >= (near.t < CL_PORTAL + 0.03 ? 22 : 12); };
  // (seated by the shader: aKid.xyz = its direction times 2 + its lobe's seed, and the vertex shader stands it on the lobe's
  // boiling surface, 0.6 sunk in it: on a fixed seat a turret over a hollow of the boil stood clear of its lobe)
  const riding = (L, d, cr, sd, mode) => { const ks = 2 + clamp(L.seed, 0, 0.99);
    return { x: L.x, y: L.y, z: L.z, r: L.r, phase: L.phase, rate: L.rate, seed: sd, ox: L.ox, oy: L.oy, oz: L.oz, tone: L.tone, mode, occ: 1, kx: d[0] * ks, ky: d[1] * ks, kz: d[2] * ks, kw: cr / L.r, axis: d, view: true }; };
  {
    // THE SLOT'S TURRETS (8 to 20 m), on every lobe that walls the slot above the surge: the upper slot first (it is looked
    // at for the last five seconds), then nearest first, until the budget is spent
    const KID_MAX = 300;
    const isUp = (E) => (E.L.ct > 0.5 && E.L.ct < 0.93 && E.L.clear < 150 ? 1 : 0);
    const order = slotE.filter((E) => !E.promoted).sort((a, b) => (isUp(b) - isUp(a)) || (a.L.pri - b.L.pri));
    let done = 0;
    for (const E of order) {
      const L = E.L;
      if (L.y < 120 || G.kids.length >= KID_MAX) continue;
      const want = isUp(E) ? (L.clear < 115 ? 12 : 8) : Math.ceil((L.clear < 70 ? 11 : L.clear < 110 ? 8 : L.clear < 160 ? 5 : 3) * (L.ct < 0.3 ? 0.6 : 1));
      const rs = lobeRng(L, 101), nb = neighbours(L), got = L.kd || (L.kd = []); let n = 0;
      for (let tr = 0; tr < want * 14 && n < want; tr++) {
        const d = dirOn(rs), cr = clamp(L.r * rs.range(0.17, 0.38), 7, 20), sd = rs(), seatK = rs.range(0.72, 0.82);
        if (!exposed(L, d, nb) || crowded(got, d, 0.87) || !clearOf(L, d, seatK, cr * 1.35)) continue;
        got.push(d); n++;
        const Kd = { x: L.x, y: L.y, z: L.z, r: L.r, phase: L.phase, rate: L.rate, seed: sd, ox: L.ox, oy: L.oy, oz: L.oz, tone: L.tone, mode: 0, occ: 1,
          kx: d[0] * seatK, ky: d[1] * seatK, kz: d[2] * seatK, kw: cr / L.r, axis: d };
        G.kids.push(Kd); list.push({ S: CAP3, L: Kd });
      }
      if ((++done & 3) === 0) await ctx.yield();
    }
  }
  await ctx.yield();
  // (The roof over the portal is seen from below, in shade: slate. A turret on the side of a roof lobe that faces the sun
  // stood out of that shade as one tan blob beside the ring, so the roof's turrets keep to the side the sun does not reach:
  // a rule of the light.)
  const SUNV = G.sun, roofSun = (d) => d[0] * SUNV.x + d[1] * SUNV.y + d[2] * SUNV.z > -0.3;
  for (const L of roofL) {
    const rs = lobeRng(L, 211), nb = neighbours(L), got = L.kd || (L.kd = []); let n = 0;
    for (let tr = 0; tr < 90 && n < 5; tr++) {
      const d = dirOn(rs), cr = clamp(L.r * rs.range(0.13, 0.24), 12, 21), sd = rs();
      if (roofSun(d) || !exposed(L, d, nb) || crowded(got, d, 0.9)) continue;
      got.push(d); n++;
      const Kd = riding(L, d, cr, sd, 0); G.kids.push(Kd); list.push({ S: CAP3, L: Kd });      // (these shed no wisps)
    }
  }
  // CLIMB-ONLY TURRETS. These are in the near mesh, which is drawn on the climb only (so the breach, where the stones and
  // the surge are also on screen, does not pay for them): six more on each roof lobe that stands within 200 m of the portal;
  // TURRETS IN THE CREASES (where two of the upper slot's fine lobes meet, their line of intersection is a straight seam
  // between two broad faces: up to three small turrets are seated on each seam's circle, wherever it runs on the outside of
  // the cloud; they ride one of the two lobes); and THE TURRETS OF THE LINE: three to eleven 7 to 14 m turrets on every very fine
  // lobe, the nearer the climb line the more (below).
  await ctx.yield();
  {
    let made = 0;
    for (const L of roofL) {
      if (Math.hypot(L.x - 37, L.y - 430, L.z + 33) - L.r > 200) continue;
      L.ct = 0.99;      // (the roof lobes that hang beside the portal count as upper slot, for the seams below)
      const rs = lobeRng(L, 307), nb = neighbours(L), got = L.kd || (L.kd = []); let n = 0;
      for (let tr = 0; tr < 110 && n < 6; tr++) {
        const d = dirOn(rs), cr = clamp(L.r * rs.range(0.1, 0.17), 10, 19), sd = rs();
        if (roofSun(d) || !exposed(L, d, nb) || crowded(got, d, 0.93)) continue;
        got.push(d); n++; made++;
        const Kd = riding(L, d, cr, sd, 0.05); G.kids.push(Kd); nearList.push({ S: CAP3, L: Kd });
      }
    }
    G.climbKids = made;
  }
  await ctx.yield();
  {
    const fine = nearList.filter((E) => E.L.mode === 0.45 && E.L.ct !== undefined && E.L.ct > 0.55);
    let made = 0;
    for (let i = 0; i < fine.length && made < 54; i++) for (let j = i + 1; j < fine.length && made < 54; j++) {
      const A = fine[i].L, Bq = fine[j].L, dx = Bq.x - A.x, dy = Bq.y - A.y, dz = Bq.z - A.z, d = Math.hypot(dx, dy, dz), ra = A.r * 0.95, rb2 = Bq.r * 0.95;
      if (d > ra + rb2 - 4 || d < Math.abs(ra - rb2) + 4 || (A.tone > 0.5) !== (Bq.tone > 0.5)) continue;
      // the seam is a circle round the line from A to Bq: its points are A + (u ca + (e cos + g sin) sa) ra
      const ca = clamp((d * d + ra * ra - rb2 * rb2) / (2 * d * ra), -0.95, 0.95), sa = Math.sqrt(1 - ca * ca), ux = dx / d, uy = dy / d, uz = dz / d;
      let ex = uy * 0 - uz * 1, ey = uz * 0 - ux * 0, ez = ux * 1 - uy * 0; let el = Math.hypot(ex, ey, ez);      // u x (0, 1, 0)
      if (el < 1e-3) { ex = 1; ey = 0; ez = 0; el = 1; } ex /= el; ey /= el; ez /= el;
      const gx = uy * ez - uz * ey, gy = uz * ex - ux * ez, gz = ux * ey - uy * ex;
      // (the pair's own stream: the two lobes' seeds)
      const rc = makeRng(Math.floor(clamp(A.seed, 0, 0.999999) * 1e6) * 1000 + Math.floor(clamp(Bq.seed, 0, 0.999999) * 997) + 503), nb = neighbours(A, Bq), got = [];
      for (let tr = 0; tr < 24 && got.length < 3; tr++) {
        const ph = rc.range(0, 6.2832), cr = clamp(Math.min(A.r, Bq.r) * rc.range(0.2, 0.3), 7, 15), sd = rc(), cp = Math.cos(ph), sp = Math.sin(ph);
        const q = [ux * ca + (ex * cp + gx * sp) * sa, uy * ca + (ey * cp + gy * sp) * sa, uz * ca + (ez * cp + gz * sp) * sa];
        if (!exposed(A, q, nb) || crowded(got, q, 0.8) || !clearOf(A, q, 0.95, cr * 1.35)) continue;
        got.push(q); made++;
        const Kd = { x: A.x, y: A.y, z: A.z, r: A.r, phase: A.phase, rate: A.rate, seed: sd, ox: A.ox, oy: A.oy, oz: A.oz, tone: A.tone, mode: 0.05, occ: 1,
          kx: q[0] * 0.8, ky: q[1] * 0.8, kz: q[2] * 0.8, kw: cr / A.r, axis: q };
        G.kids.push(Kd); nearList.push({ S: CAP3, L: Kd });
        (A.kd || (A.kd = [])).push(q);
        if (made >= 54) break;
      }
    }
    G.creaseKids = made;
  }
  await ctx.yield();
  {
    // TURRETS OF THE LINE: every very fine lobe (the upper slot's, the lower slot's, the roof ring's) gets more turrets by its
    // distance to the climb line: the nearer the lobe stands, the more of them (3 to 11; up to 230 in all), all round it by the rule
    // above. The vertex shader seats each on its lobe's boiling surface, 0.6 sunk in it: low domes that heave with the boil.
    const seatLine = (L, want) => {
      const rs = lobeRng(L, 401), nb = neighbours(L), got = L.kd || (L.kd = []); let n = 0;
      const sep = Math.max(0.9, Math.cos(Math.min(0.45, 26 / L.r)));
      for (let tr = 0; tr < want * 30 && n < want; tr++) {
        const d = dirOn(rs), cr = clamp(L.r * rs.range(0.15, 0.28), 7, 14), sd = rs();
        // (it rides its lobe's boil, which can stand 1.33 radii out: even there it stays clear of the line)
        if ((L.rate === 0 && roofSun(d)) || !exposed(L, d, nb) || crowded(got, d, sep) || !clearOf(L, d, 1.33, cr * 1.3)) continue;
        got.push(d); n++;
        const Kd = riding(L, d, cr, sd, 0.05); G.kids.push(Kd); nearList.push({ S: CAP3, L: Kd });
      }
      return n;
    };
    const fineL = nearList.filter((N) => (N.S === SX || N.S === SXX) && N.L.mode === 0.45).map((N) => N.L);
    for (const L of fineL) { climbNear(L.x, L.y, L.z, near); L.lineD = near.d - L.r; }
    fineL.sort((a, b) => a.lineD - b.lineD);
    let made = 0, done = 0;
    for (const L of fineL) { if (made >= 230) break; made += seatLine(L, Math.min(230 - made, clamp(Math.round(12 - L.lineD / 16), 3, 11))); if ((++done & 1) === 0) await ctx.yield(); }
    G.lineKids = made;
  }
  await ctx.yield();
  const F = await fillLobes(ctx, list, 2 * 31 * 21 + 23 * 21 + 8, (2 * 30 * 20 + 22 * 20) * 6), B = F.B;
  // crevice-dark cores
  pushTube(B, -12, 720, 30, 20, (y) => trunkAxis(1, y), (y) => trunkR(y) - 27, 1.0, 0.62);
  pushTube(B, -12, 720, 30, 20, (y) => trunkAxis(-1, y), (y) => trunkR(y) - 27, 0.0, 0.2);
  pushTube(B, 600, G.colH * 0.97, 22, 20, colAxis, (y) => columnR(y) * 0.62, 0.36, 0.36);
  await ctx.yield();
  await F.run();
  const top = colAxis(G.colH);
  const geo = lobeGeometry(B, top[0] * 0.5, G.colH * 0.5, top[1] * 0.5, G.colH, true);
  const cmat = makeCloudMaterial(CLOUD_VERT, U, pal, false);
  const mesh = new THREE.Mesh(geo, cmat); mesh.name = 'clouds'; mesh.frustumCulled = false;
  await ctx.yield();
  const NF = await fillLobes(ctx, nearList, 0, 0); await NF.run();
  const nearMesh = new THREE.Mesh(lobeGeometry(NF.B, 0, 350, 0, 900, true), cmat); nearMesh.name = 'cloudsNear'; nearMesh.frustumCulled = false; nearMesh.visible = false;
  await ctx.yield();
  const FF = await fillLobes(ctx, farList, 0, 0); await FF.run();
  const farMesh = new THREE.Mesh(lobeGeometry(FF.B, 0, 350, 0, 900, true), cmat); farMesh.name = 'cloudsFar'; farMesh.frustumCulled = false;
  await ctx.yield();
  // THE SURGE: four stepped rows of small overlapping lobes (skirt, face, crest, body), packed four times
  // denser in the sector that pours through the breach toward the camera than round the back of the crater
  const rs = rng.fork('surge');
  const sect = Math.atan2(223 - PZ * VENT_OFF, -246 - PX * VENT_OFF), SW = 1.12;      // from K toward the breach axis, +-64 degrees
  G.surgeSect = sect; G.surgeSW = SW;
  const ROWS = [{ lag: 0, hf: [0.24, 0.4], sz: [0.62, 0.86] }, { lag: 8, hf: [0.8, 1.08], sz: [0.86, 1.12] }, { lag: 18, hf: [1.55, 1.95], sz: [0.8, 1.06] }, { lag: 31, hf: [1.15, 1.6], sz: [0.95, 1.2] }];
  const slist = [];
  for (let k = 0; k < 4; k++) {
    const R = ROWS[k], nD = 50, nSp = 12;
    for (let i = 0; i < nD + nSp; i++) {
      const dense = i < nD;
      const ang = dense ? sect + ((i + rs.range(-0.35, 0.35) + 0.5 * (k & 1)) / nD * 2 - 1) * SW : sect + SW + (i - nD + rs.range(0.2, 0.8)) / nSp * (6.2832 - 2 * SW);
      slist.push({ S: k < 3 ? S2 : S1, L: {      // (skirt, face and crest rows are whole balls: a cap's open underside showed as a dark mouth in the wall where a neighbour had melted away)
        x: 0, y: 0, z: 0, r: rs.range(R.sz[0], R.sz[1]) * (dense ? 1 : 1.7), phase: rs(), rate: rs.range(0.25, 0.5), seed: rs(),
        ox: Math.cos(ang), oy: rs.range(R.hf[0], R.hf[1]), oz: Math.sin(ang), tone: 0.7, mode: R.lag + rs.range(-3, 3), occ: 1,
      } });
    }
  }
  const SF = await fillLobes(ctx, slist, 0, 0); await SF.run();
  const surge = new THREE.Mesh(lobeGeometry(SF.B, 0, 0, 0, 700), makeCloudMaterial(SURGE_VERT, U, pal, true)); surge.name = 'surge'; surge.frustumCulled = false;
  return { mesh, surge, nearMesh, farMesh };
}

// ---------------------------------------------------------------- JETS: volleys, bombs, splashes
// Everything about a finger is a pure function of (volley number, finger index, clock): no CPU state.
const FINGER_GLSL = /* glsl */`
uniform float uClock, uSeed; uniform vec3 uVent; uniform vec2 uWind;
const float IB_G = ${GRAV};
// launch velocity of finger f in the volley held by slot s; age since it fired; show 0/1; big 0/1
vec3 ibFinger(float f, float s, out float age, out float show, out float big, out float hs){
  float n = floor(uClock/${PERIOD}.0);
  float N = n - mod(n - s, ${SLOTS}.0);
  age = uClock - N*${PERIOD}.0;
  big = step(mod(N, ${BIG_EVERY}.0), 0.5);
  vec2 k = vec2(N*1.371 + uSeed*13.7, f*7.31 + 1.7);
  float h1 = ibH12(k), h2 = ibH12(k + 19.19), h3 = ibH12(k + 41.7);
  hs = h3;
  float count = 7.0 + floor(ibH11(N*0.731 + uSeed*3.1 + 5.0)*3.99);
  show = step(f, count - 0.5);
  float tilt = mix(0.15, 0.5, h2);
  // 190 to 350 m high; EVERY FOURTH VOLLEY IS A FULL 420 M: each of its fingers is thrown at the speed that carries it, at its
  // own tilt, to between 400 and 420 m (most of them within 8 m of the 420)
  float speed = mix(mix(64.0, 86.0, h1), sqrt(2.0*IB_G*(420.0 - 20.0*h1*h1))/cos(tilt), big);
  // fan away from the slot: azimuth within +-72 degrees of the across-breach axis P (none leans across the slot or the portal)
  float az = ${Math.atan2(PZ, PX).toFixed(4)} + ((f + h3)/${FINGERS}.0 - 0.5)*2.5;
  return speed*vec3(sin(tilt)*cos(az), cos(tilt), sin(tilt)*sin(az));
}
// where the ejecta that left with a fraction of the bomb's speed is now (tau 0 = bomb, 1 = slowest)
vec3 ibTail(vec3 v0, float age, float tau, out float fall){
  float fsp = 1.0 - 0.93*pow(max(tau, 0.0), 0.8);                 // the slowest ejecta barely leaves the rim: a jet stays rooted while it rises
  vec3 v = v0*fsp;
  float vt = mix(2400.0, 15.0, sqrt(max(tau, 0.0)));           // fine ash falls at terminal speed
  float ta = v.y/IB_G, y;
  fall = max(age - ta, 0.0);
  if (age < ta) y = v.y*age - 0.5*IB_G*age*age;
  else { float kq = IB_G/vt; y = 0.5*v.y*ta - vt*(fall - (1.0 - exp(-kq*fall))/kq); }
  float kd = 0.012 + 0.15*tau;
  float th = (1.0 - exp(-kd*age))/kd;
  vec2 xz = v.xz*th + uWind*(tau*age*2.4) + v0.xz/max(length(v0.xz), 1e-3)*82.0;   // fingers leave the rim of the black trunk
  return uVent + vec3(xz.x, y, xz.y);
}
vec3 ibLand(vec3 v0, out float tl){ tl = 2.0*v0.y/IB_G; float th = (1.0 - exp(-0.012*tl))/0.012; vec2 o = v0.xz/max(length(v0.xz), 1e-3)*82.0; return uVent + vec3(v0.x*th + o.x, 0.0, v0.z*th + o.y); }
`;
function fingerUniforms(mat, U) { for (const k of ['uClock', 'uSeed', 'uVent', 'uWind', 'uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uNight']) mat.uniforms[k] = U[k]; }
function instFingers(geo, extra) {
  const n = SLOTS * FINGERS, a = new Float32Array(n * 2);
  for (let s = 0; s < SLOTS; s++) for (let f = 0; f < FINGERS; f++) { a[(s * FINGERS + f) * 2] = f; a[(s * FINGERS + f) * 2 + 1] = s; }
  const g = new THREE.InstancedBufferGeometry(); g.index = geo.index;
  for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
  g.setAttribute('aInst', new THREE.InstancedBufferAttribute(a, 2));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 200, 0), 1200);
  if (extra) extra(g);
  return g;
}

// THE JETS' TAILS. A tail is the ejecta that left the vent with its bomb, each part with its own fraction of the bomb's speed
// (ibTail(v0, age, tau): tau 0 is the bomb, tau 1 the slowest ash, which barely leaves the rim), so each part rises to its own
// height, hangs and falls back at its own terminal speed, drawn downwind as it goes. The tail is a blunt black cypress, 2 to 5 m
// in half-width at the bomb, swelling within the first fifth of its length to 19 to 32 m lower down, pinched at the root,
// with a lumpy outline in a brown-grey sheath. Every part pales and rains out once it is falling, the root first (the tail
// has left the rim by 4.5 to 5 s), and an old tail pales to brown-grey and thins to a veil from 3.5 s of age: none is solid
// after 5.8 s, none is left after 8 to 11 s. The tail's lines (its place, width, alpha, outline, paling) are the live version's
// own; the volleys that feed them (ibFinger: speeds, the full 420 m volley, the fan) and the rim's 82 m are this one's.
// From 0.88 of its rise the bomb also trails a thin line of steam (the second set of ribbons, kind 1).
function buildJets(U, pal) {
  const SEG = 30, rib = new THREE.PlaneGeometry(2, 1, 1, SEG); rib.translate(0, 0.5, 0); rib.deleteAttribute('normal'); rib.deleteAttribute('uv');
  const n = SLOTS * FINGERS, a = new Float32Array(n * 2 * 3);
  for (let k = 0; k < 2; k++) for (let s = 0; s < SLOTS; s++) for (let f = 0; f < FINGERS; f++) { const i = (k * n + s * FINGERS + f) * 3; a[i] = f; a[i + 1] = s; a[i + 2] = k; }
  const geo = new THREE.InstancedBufferGeometry(); geo.index = rib.index; geo.setAttribute('position', rib.attributes.position);
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(a, 3)); geo.instanceCount = n * 2; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 200, 0), 1200);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uAsh: { value: pal.ash.clone() }, uSteam: { value: pal.steam.clone() }, uShadow: { value: pal.shadow.clone() } }]),
    vertexShader: /* glsl */`
      attribute vec3 aInst; uniform float uTime;
      varying vec4 vJ; varying vec3 vSide; varying vec3 vView; varying vec4 vA;   // ash: vJ = across, tau, seed, seconds falling; vA = alpha, age of the volley, 0, -.  steam: vJ = across, along, seed, 0; vA = alpha, age of the steam, 1, when it was shed
      ${FOG_PV}
      ${NOISE_GLSL}
      ${FINGER_GLSL}
      // where the steam the bomb shed ts seconds after launch hangs now, s seconds later
      vec3 ibTrail(vec3 v0, float ts, float s){
        float fl; vec3 p = ibTail(v0, ts, 0.0, fl);
        p.xz += uWind*(1.5*s); p.y += 1.0*s;
        return p;
      }
      void main(){
        float age, show, big, hs, fall = 0.0, f2;
        vec3 v0 = ibFinger(aInst.x, aInst.y, age, show, big, hs);
        float kind = aInst.z, tau, ta = v0.y/IB_G, tStop = 0.88*ta, ts = 0.0, s = 0.0;
        vec3 p, p2;
        if (kind < 0.5) {
          tau = position.y*position.y*0.4 + position.y*0.6;
          p = ibTail(v0, age, tau, fall);
          p2 = ibTail(v0, age, tau + 0.03, f2);
        } else {
          tau = position.y;
          float te = min(age, 2.0*ta), span = clamp(age - tStop, 0.0, 2.0), ts2 = te - (tau + 0.03)*span;
          ts = te - tau*span; s = age - ts;
          p = ibTrail(v0, ts, s); p2 = ibTrail(v0, ts2, age - ts2);
        }
        vec3 T = p - p2; float tlen = length(T); T = tlen > 1e-3 ? T/tlen : vec3(0.0, 1.0, 0.0);
        vec4 wp = modelMatrix*vec4(p, 1.0);
        vec3 toCam = cameraPosition - wp.xyz; float dist = length(toCam); toCam /= max(dist, 1e-3);
        vec3 Tw = mat3(modelMatrix)*T;
        vec3 side = cross(Tw, toCam); side = side/max(length(side), 1e-3);
        float w, alive;
        if (kind < 0.5) {
          // cypress taper: 2 to 5 m half-width at the bomb, swelling down the tail, pinched at the root
          w = mix(3.0, 24.0, pow(tau, 0.42))*(0.72 + 0.11*min(age, 9.0))*(1.0 - 0.3*smoothstep(0.85, 1.0, tau));
          w *= 1.0 + 0.5*smoothstep(0.0, 6.0, fall);
          w = max(w, dist*0.0016);
          // each part of the tail pales and rains out once it is falling; the whole finger is gone by ~21 s
          alive = (1.0 - smoothstep(1.0, 3.6 + 2.0*(1.0 - tau), fall))*smoothstep(0.0, 0.5, age)*(1.0 - smoothstep(17.0, 21.0, age));
          // nothing lies on the sea as a sheet: what is falling thins from 70 m above the water and has gone by 10 m
          alive *= mix(1.0, smoothstep(10.0, 70.0, p.y), smoothstep(0.5, 3.0, fall));
          // a ribbon seen end-on fades instead of collapsing to a sliver
          alive *= 1.0 - smoothstep(0.75, 0.95, abs(dot(Tw, toCam)));
        } else {
          w = (0.6 + 1.7*(1.0 - exp(-s/1.5)))*1.7;
          alive = smoothstep(0.0, 0.7, age - tStop)*(1.0 - smoothstep(0.6, 2.2, s))*smoothstep(4.0, 30.0, p.y)*smoothstep(110.0, 300.0, dist)*0.34;
          w = max(w, dist*0.0011);
          w *= mix(0.2, 1.0, smoothstep(0.0, 0.22, tau)*(1.0 - smoothstep(0.7, 1.0, tau)));      // (a wisp that tapers away at both ends, never a ruled line of one width)
          alive *= 1.0 - smoothstep(0.9, 0.99, abs(dot(Tw, toCam)));
        }
        wp.xyz += side*(position.x*w*show);
        wp.y = max(wp.y, 0.3);
        // one near the lens fades before it can show as a polygon
        alive *= smoothstep(70.0, 150.0, dist);
        vJ = vec4(position.x, tau, hs*37.0 + aInst.x*3.1, fall);
        vSide = side; vView = toCam;
        vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
        vA = vec4(alive*show, mix(age, s, kind), kind, ts);
        ${FOG_V}
        vA.x *= mix(1.0, 1.0 - vFog.y, step(0.5, kind));      // (a steam trail seen through the surge's mist was a ruled white line)
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uAsh, uSteam, uShadow; uniform float uTime;
      ${LIGHT_PARS}
      varying vec4 vJ; varying vec3 vSide; varying vec3 vView; varying vec4 vA;
      ${FOG_PF}
      ${NOISE_GLSL}
      void main(){
        // (the across and along coordinates are clamped to their own range before anything is worked out from them: on a thin
        // ribbon an antialiased sample can run past the vertices' values)
        float x = clamp(vJ.x, -1.0, 1.0), tau = clamp(vJ.y, 0.0, 1.0), e = abs(x), sd = vJ.z;
        if (vA.z > 0.5) {      // the steam a bomb trails from 0.88 of its rise: a wisp that has dissolved before its outline and before both its ends
          float fadeE = 1.0 - smoothstep(0.62, 0.97, e);
          float len = vA.w*3.4 + sd, tt = uTime*0.22;
          float n1 = ibVN2(vec2(len*0.55 - e*0.8 + tt*0.3, x*1.3 + sd));
          float n2 = ibVN2(vec2(len*1.6 - e*1.4 - tt, x*3.0 - sd));
          vec3 N = normalize(vSide*(x*0.95 + (n1 - 0.5)*0.9) + vView*sqrt(max(1.0 - x*x*0.9, 0.02)));
          float lit = smoothstep(-0.15, 0.4, dot(N, uSunDir));
          float a = (1.0 - smoothstep(0.25, 0.9, e + (n1 - 0.5)*0.6))*(0.3 + 0.7*smoothstep(0.25, 0.7, n2))*vA.x*smoothstep(0.0, 0.15, tau)*(1.0 - smoothstep(0.7, 1.0, tau))*fadeE;
          if (a < 0.004) discard;
          gl_FragColor = vec4(mix(uShadow*uSkyCol*1.5, uSteam*uSunCol*0.9, 0.35 + 0.65*lit), a);
        } else {
          float len = tau*26.0 + vJ.z, tt = uTime*0.3;
          // a jet of ash, not a feather: a solid black body with a lumpy, turbulent outline (billows of two sizes that
          // roll slowly back down the tail) inside a thinner brown-grey cloud of fine ash
          float n1 = ibVN2(vec2(len*0.6 - tt - e*0.7, x*1.3 + vJ.z));
          float n2 = ibVN2(vec2(len*1.7 - tt*1.8 - e*1.2, x*3.0 - vJ.z));
          float n3 = ibVN2(vec2(len*0.45, x*7.0 + vJ.z*2.0));
          float edge = e + (n1 - 0.5)*0.6 + (n2 - 0.5)*0.3;
          float core = 1.0 - smoothstep(0.5, 0.74, edge);
          float sheath = (1.0 - smoothstep(0.45, 1.0, e + (n1 - 0.5)*0.5))*(0.3 + 0.25*n2);
          // rain-out: the body breaks into pale falling streaks
          // (a tail whose root has already rained out is old: it pales to brown-grey and thins to a veil, so what hangs
          // in the air late in a volley is drifting ash, not a dark frond)
          float old = smoothstep(3.5, 8.5, vA.y);
          float pale = max(smoothstep(0.3, 4.0, vJ.w), 0.85*old);
          core *= mix(1.0, smoothstep(0.42, 0.8, n3)*0.5, pale);
          float a = max(core, sheath*(1.0 - 0.5*pale))*(1.0 - 0.62*old);
          a *= vA.x;
          if (a < 0.004) discard;
          // fake round shading across the ribbon, each billow lit on its sunward side
          vec3 N = normalize(vSide*(x*0.95 + (n1 - 0.5)*0.9) + vView*sqrt(max(1.0 - x*x*0.9, 0.02)));
          float ndl = dot(N, uSunDir);
          float lit = smoothstep(-0.15, 0.4, ndl);
          vec3 alb = mix(uAsh*1.5 + 0.006, vec3(0.25, 0.225, 0.2), pale*0.9);
          alb = mix(vec3(0.12, 0.105, 0.09)*(1.0 + pale), alb, core);                       // the cloud of fine ash round the body is brown-grey
          alb *= 0.75 + 0.5*n2;
          // (the sheath takes the sky's light without its blue: lit by the sky's own colour it was a pale violet pane against the sky)
          vec3 skyJ = mix(vec3(dot(uSkyCol, vec3(0.3, 0.5, 0.2)))*vec3(1.06, 1.0, 0.92), uSkyCol, 0.25 + 0.75*core);
          gl_FragColor = vec4(alb*(uSunCol*lit*(0.5 + 0.5*n1) + skyJ*0.55), a);
        }
        ${FOG_F}
      }`,
  });
  fingerUniforms(mat, U);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'jets'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

function buildBombs(rng, U, pal) {
  // a lumpy 80-triangle clast
  const ico = new THREE.IcosahedronGeometry(1, 1); ico.deleteAttribute('uv'); ico.deleteAttribute('normal');
  const g0 = mergeVertices(ico, 1e-4), p = g0.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.72 + 0.5 * rng(); p.setXYZ(i, p.getX(i) * k * 1.15, p.getY(i) * k * 0.85, p.getZ(i) * k); }
  const mat = new THREE.ShaderMaterial({
    fog: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBomb: { value: pal.bomb.clone() } }]),
    vertexShader: /* glsl */`
      attribute vec2 aInst; uniform float uTime; varying vec3 vL; varying float vHot;
      ${FOG_PV}
      ${NOISE_GLSL}
      ${FINGER_GLSL}
      void main(){
        float age, show, big, hs, fall, tl;
        vec3 v0 = ibFinger(aInst.x, aInst.y, age, show, big, hs);
        vec3 c = ibTail(v0, age, 0.0, fall);
        ibLand(v0, tl);
        show *= step(age, tl)*step(0.15, age);
        // tumble
        float a1 = age*(2.0 + 3.0*hs) + hs*40.0, a2 = age*(1.3 + 2.0*fract(hs*7.0));
        vec3 q = position; float cs = cos(a1), sn = sin(a1);
        q = vec3(q.x*cs - q.y*sn, q.x*sn + q.y*cs, q.z); cs = cos(a2); sn = sin(a2);
        q = vec3(q.x, q.y*cs - q.z*sn, q.y*sn + q.z*cs);
        vec4 wc = modelMatrix*vec4(c, 1.0);
        float dist = distance(wc.xyz, cameraPosition);
        float size = (1.0 + 0.5*hs)*max(1.0, dist*0.0058)*show;      // 2-3 m across, never under ~3 px
        vL = position; vHot = 1.0 - 0.35*smoothstep(4.0, 16.0, age);
        vec4 mvPosition = viewMatrix*(wc + vec4(mat3(modelMatrix)*q*size, 0.0)); gl_Position = projectionMatrix*mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBomb; varying vec3 vL; varying float vHot;
      ${FOG_PF}
      ${NOISE_GLSL}
      void main(){
        float crust = smoothstep(0.45, 0.7, ibVN(vL*2.3 + 3.0));
        vec3 col = uBomb*mix(4.6, 0.5, crust*0.8)*vHot + vec3(0.6, 0.35, 0.1)*(1.0 - crust)*vHot;
        gl_FragColor = vec4(col, 1.0);
        ${FOG_F}
      }`,
  });
  fingerUniforms(mat, U);
  const mesh = new THREE.Mesh(instFingers(g0), mat); mesh.name = 'bombs'; mesh.frustumCulled = false;
  // a small additive halo so each bomb reads as a point of fire at 300-800 m without clipping
  const quad = new THREE.PlaneGeometry(2, 2); quad.deleteAttribute('normal'); quad.deleteAttribute('uv');
  const gmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uBomb: { value: pal.bomb.clone() } },
    vertexShader: /* glsl */`
      attribute vec2 aInst; uniform float uTime; varying vec2 vQ; varying float vK;
      ${FOG_PV}
      ${NOISE_GLSL}
      ${FINGER_GLSL}
      void main(){
        float age, show, big, hs, fall, tl;
        vec3 v0 = ibFinger(aInst.x, aInst.y, age, show, big, hs);
        vec3 c = ibTail(v0, age, 0.0, fall);
        ibLand(v0, tl);
        show *= step(age, tl)*smoothstep(0.1, 0.5, age);
        vec4 mv = viewMatrix*modelMatrix*vec4(c, 1.0);
        float size = max(4.0, -mv.z*0.0075)*show;
        vec4 mvPosition = mv; ${FOG_V}
        mv.xy += position.xy*size; vQ = position.xy; vK = show*(1.0 - 0.3*smoothstep(4.0, 16.0, age))*(1.0 - vFog.x)*(1.0 - vFog.y);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uBomb; varying vec2 vQ; varying float vK;
      void main(){ float d = dot(vQ, vQ); float g = exp(-d*5.5)*1.5 + exp(-d*1.8)*0.22; g *= 1.0 - smoothstep(0.7, 1.0, d);
        gl_FragColor = vec4(uBomb*g*vK, 1.0); }`,
  });
  fingerUniforms(gmat, U);
  const glow = new THREE.Mesh(instFingers(quad), gmat); glow.name = 'bombGlow'; glow.frustumCulled = false; glow.renderOrder = 5;
  return { mesh, glow };
}

// splashes, drifting steam plumes (per finger) and fumarole wisps (fixed sites): one instanced draw
function buildPuffs(rng, U, pal, fumaroles, coneH) {
  const quad = new THREE.PlaneGeometry(2, 2); quad.deleteAttribute('normal'); quad.deleteAttribute('uv');
  const nF = SLOTS * FINGERS, nW = fumaroles.length * 2, n = nF * 2 + nW;
  const inst = new Float32Array(n * 4), site = new Float32Array(n * 4);
  let k = 0;
  for (let kind = 0; kind < 2; kind++) for (let s = 0; s < SLOTS; s++) for (let f = 0; f < FINGERS; f++, k++) { inst[k * 4] = f; inst[k * 4 + 1] = s; inst[k * 4 + 2] = kind; inst[k * 4 + 3] = rng(); }
  for (let i = 0; i < nW; i++, k++) {
    const F = fumaroles[i >> 1], a = rng() * 6.283, d = rng.range(0, 0.6) * F.r, x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d;
    inst[k * 4 + 2] = 2; inst[k * 4 + 3] = rng();
    site[k * 4] = x; site[k * 4 + 1] = Math.max(1, coneH(x, z)); site[k * 4 + 2] = z; site[k * 4 + 3] = rng.range(16, 30);
  }
  const geo = new THREE.InstancedBufferGeometry(); geo.index = quad.index; geo.setAttribute('position', quad.attributes.position);
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4)); geo.setAttribute('aSite', new THREE.InstancedBufferAttribute(site, 4));
  geo.instanceCount = n; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 50, 0), 1200);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSteam: { value: pal.steam.clone() }, uShadow: { value: pal.shadow.clone() } }]),
    vertexShader: /* glsl */`
      attribute vec4 aInst; attribute vec4 aSite; uniform float uTime; uniform vec3 uSunDir;
      varying vec4 vQ; varying vec3 vK;     // vQ: quad xy, kind, seed.  vK: alpha, phase, lit side
      ${FOG_PV}
      ${NOISE_GLSL}
      ${FINGER_GLSL}
      void main(){
        float kind = aInst.z, age, show, big, hs, tl, alpha = 0.0, ph = 0.0;
        vec3 c; vec2 sz;
        if (kind < 1.5) {
          vec3 v0 = ibFinger(aInst.x, aInst.y, age, show, big, hs);
          c = ibLand(v0, tl); float ts = age - tl;
          if (kind < 0.5) {                 // splash crown, 12 m
            ph = clamp(ts/2.6, 0.0, 1.0);
            float up = sin(min(ph*1.25, 1.0)*3.1416);
            sz = vec2(4.5 + 6.0*ph, 0.6 + 6.6*sqrt(max(up, 0.0)));
            c.y += sz.y*0.92; alpha = show*step(0.0, ts)*(1.0 - smoothstep(0.75, 1.0, ph));
          } else {                          // steam plume drifting downwind
            ph = clamp((ts - 0.6)/13.0, 0.0, 1.0);
            float rr = 6.0 + 26.0*sqrt(ph); sz = vec2(rr, rr*1.15);
            c += vec3(uWind.x, 0.0, uWind.y)*(ph*60.0) + vec3(0.0, 4.0 + rr*0.9 + ph*30.0, 0.0);
            alpha = show*smoothstep(0.0, 0.08, ph)*(1.0 - smoothstep(0.3, 1.0, ph))*0.6;
          }
        } else {                            // fumarole wisp
          ph = fract(uTime*0.07 + aInst.w);
          sz = vec2(aSite.w*0.62, aSite.w); c = aSite.xyz + vec3(0.0, sz.y*0.9, 0.0);
          alpha = 0.34;
        }
        vec4 wc = modelMatrix*vec4(c, 1.0);
        vec3 toCam = cameraPosition - wc.xyz; vec3 right = cross(vec3(0.0, 1.0, 0.0), toCam); right = right/max(length(right), 1e-3);
        wc.xyz += right*(position.x*sz.x) + vec3(0.0, position.y*sz.y, 0.0);
        if (kind > 1.5) { float yq = position.y*0.5 + 0.5; wc.xyz += vec3(uWind.x, 0.0, uWind.y)*(yq*yq*sz.y*0.6); }      // a fumarole's plume leans away downwind as it rises
        vQ = vec4(position.xy, kind, aInst.w*31.0); vK = vec3(alpha, ph, dot(right, uSunDir));
        vec4 mvPosition = viewMatrix*wc; gl_Position = projectionMatrix*mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSteam, uShadow; uniform float uTime;
      ${LIGHT_PARS}
      varying vec4 vQ; varying vec3 vK;
      ${FOG_PF}
      ${NOISE_GLSL}
      void main(){
        vec2 q = vQ.xy; float kind = vQ.z, sd = vQ.w, a;
        float yy = q.y*0.5 + 0.5;
        if (kind < 0.5) {                   // a ragged crown: many fine fingers of spray that break into drops, over a low wide lobe of mist
          // (the water fans outward as it rises; each finger is solid at its root, torn into shreds toward its tip and drops beyond it)
          float xs = q.x/(0.5 + 0.8*yy);
          float f1 = ibVN2(vec2(xs*4.0 + sd, 1.0 + sd)), f2 = ibVN2(vec2(xs*10.0 - sd*3.0, 5.0 + sd)), f3 = ibVN2(vec2(xs*23.0 + sd*7.0, 9.0 - sd));
          float top = max(mix(0.3, 1.0, smoothstep(0.2, 0.8, f1*0.5 + f2*0.32 + f3*0.18))*(1.0 - 0.6*min(xs*xs, 1.0)), 0.05), tt = yy/top;
          float tear = ibVN2(vec2(xs*31.0 + sd, yy*15.0 - vK.y*9.0))*0.6 + ibVN2(vec2(xs*67.0 - sd, yy*36.0 - vK.y*15.0))*0.4;
          float thr = mix(0.08, 0.7, smoothstep(0.3, 1.2, tt));
          float spray = smoothstep(thr, thr + 0.2, tear)*(1.0 - smoothstep(0.95, 1.4, tt))*(1.0 - smoothstep(0.55, 1.0, abs(xs)));
          float mist = (1.0 - smoothstep(0.0, 0.36, yy + (f2 - 0.5)*0.14))*(1.0 - smoothstep(0.35, 1.0, abs(q.x)))*0.46*(0.7 + 0.3*tear);
          a = min(max(spray*0.8, mist), 0.8);
        } else if (kind < 1.5) {            // round billow with an eroded rim
          float d = length(q) + (ibVN2(q*2.3 + sd + vec2(0.0, -uTime*0.06)) - 0.5)*0.55 + (ibVN2(q*5.5 - sd) - 0.5)*0.2;
          a = 1.0 - smoothstep(0.35, 0.85, d);
        } else {                            // a fumarole's plume: wide and soft from the foot up, torn into shreds, thinning as it rises
          float sway = (ibVN2(vec2(yy*2.2 - uTime*0.22 + sd, sd)) - 0.5)*0.7*yy;
          float w = mix(0.3, 0.95, yy);
          float body = 1.0 - smoothstep(w*0.12, w, abs(q.x - sway));
          float tex = ibVN2(vec2((q.x - sway)*2.6 + sd, yy*3.6 - uTime*0.5 + sd))*0.6 + ibVN2(vec2((q.x - sway)*6.5 - sd, yy*8.0 - uTime*0.9))*0.4;
          a = body*smoothstep(0.3, 0.85, tex + 0.3*(1.0 - yy))*smoothstep(0.0, 0.12, yy)*(1.0 - smoothstep(0.35, 1.0, yy));
        }
        a *= vK.x*(1.0 - smoothstep(0.8, 1.0, max(abs(q.x), abs(q.y))));
        if (a < 0.004) discard;
        float lit = clamp(0.62 + 0.3*q.x*vK.z + 0.25*q.y, 0.0, 1.0);
        vec3 col = mix(uShadow*uSkyCol*1.5, uSteam*uSunCol*0.95, lit);
        gl_FragColor = vec4(col, a);
        ${FOG_F}
      }`,
  });
  fingerUniforms(mat, U);
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'puffs'; mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- SOFT EDGES: one instanced draw of noise-eroded sprites
// kind 0: wisps torn off the silhouettes of the lobes that wall the slot (they ride their lobe's boil).
// kind 1: the translucent skirt of the root burst's steam ring.  kind 2 / 3: the surge's crest fringe and
// the ground-hugging mist skirt that runs ahead of its foot.
function buildSoftEdges(rng, G, U, pal) {
  const quad = new THREE.PlaneGeometry(2, 2); quad.deleteAttribute('normal'); quad.deleteAttribute('uv');
  const cen = [], lb = [], od = [], sdv = [], nr = [];
  // (three loops, three streams: how many lobes or turrets there are moves nothing in the others)
  const rl = rng.fork('lobewisps'), rf = rng.fork('fringe');
  for (const L of G.slotLobes) {
    const ol = Math.hypot(L.ox, L.oz) || 1, tn = L.tone > 0.5 ? 0.5 : 0;
    for (let k = 0; k < 5; k++) {
      let dx = L.ox / ol + rl.range(-1.1, 1.1), dy = rl.range(-0.8, 1.0), dz = L.oz / ol + rl.range(-1.1, 1.1); const l = Math.hypot(dx, dy, dz) || 1;
      cen.push(L.x, L.y, L.z, L.r); lb.push(L.phase, L.rate, rl(), 0 + tn); od.push(L.ox, L.oy, L.oz); sdv.push(dx / l, dy / l, dz / l, rl.range(0.3, 0.5)); nr.push(dx / l, dy / l, dz / l);
    }
  }
  // two small wisps torn off each turret: they sit on its outline, so the walls' silhouettes end in bumps and shreds
  const rw = rng.fork('kidwisps');
  for (const Kd of G.kids) {
    if (Kd.view) continue;      // (a turret seated by the shader heaves with its lobe's boil: a wisp could not follow it)
    const tn = Kd.tone > 0.5 ? 0.5 : 0, kl = Math.hypot(Kd.kx, Kd.ky, Kd.kz) || 1;
    for (let k = 0; k < 2; k++) {
      let dx = Kd.kx / kl + rw.range(-1.2, 1.2), dy = Kd.ky / kl + rw.range(-1.2, 1.2), dz = Kd.kz / kl + rw.range(-1.2, 1.2); const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
      const q = Kd.kw * 0.95 / 0.94;
      cen.push(Kd.x, Kd.y, Kd.z, Kd.r); lb.push(Kd.phase, Kd.rate, rw(), 0 + tn); od.push(Kd.ox, Kd.oy, Kd.oz);
      sdv.push(Kd.kx / 0.94 + dx * q, Kd.ky / 0.94 + dy * q, Kd.kz / 0.94 + dz * q, Kd.kw * rw.range(0.5, 0.85)); nr.push(dx, dy, dz);
    }
  }
  for (const P of G.burstPuffs) { cen.push(P.x, 0, P.z, P.size); lb.push(0, P.reach, P.seed, 1); od.push(P.dx, 0, P.dz); sdv.push(0, 0, 0, 0); nr.push(0, 1, 0); }
  for (let i = 0; i < 190; i++) {
    const crest = i < 115, ang = G.surgeSect + rf.range(-1, 1) * G.surgeSW;
    cen.push(crest ? rf.range(9, 26) : rf.range(-10, -1), 0, 0, crest ? rf.range(0.9, 1.5) : rf.range(0.95, 1.5));
    lb.push(0, 0, rf(), crest ? 2 : 3); od.push(Math.cos(ang), crest ? rf.range(1.9, 2.55) : rf.range(0.12, 0.3), Math.sin(ang)); sdv.push(0, 0, 0, 0); nr.push(0, 1, 0);
  }
  const n = lb.length / 4, geo = new THREE.InstancedBufferGeometry(); geo.index = quad.index; geo.setAttribute('position', quad.attributes.position);
  geo.setAttribute('aCen', new THREE.InstancedBufferAttribute(new Float32Array(cen), 4)); geo.setAttribute('aLb', new THREE.InstancedBufferAttribute(new Float32Array(lb), 4));
  geo.setAttribute('aOd', new THREE.InstancedBufferAttribute(new Float32Array(od), 3)); geo.setAttribute('aSd', new THREE.InstancedBufferAttribute(new Float32Array(sdv), 4));
  geo.setAttribute('aNr', new THREE.InstancedBufferAttribute(new Float32Array(nr), 3));
  geo.instanceCount = n; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 250, 0), 1200);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uSteam: { value: pal.steam.clone() }, uShadow: { value: pal.shadow.clone() }, uAsh: { value: pal.ash.clone() }, uSurgeCol: U.uSurgeCol },
    vertexShader: /* glsl */`
      attribute vec4 aCen; attribute vec4 aLb; attribute vec3 aOd; attribute vec4 aSd; attribute vec3 aNr;
      uniform float uTime, uClock; uniform vec4 uSurge; uniform vec3 uSunDir;
      varying vec4 vQ; varying vec3 vK;      // vQ: quad xy, seed, alpha.  vK: tone (0 steam, 1 ash, 2 surge), sunward, sun across
      ${FOG_PV}
      void main(){
        float kind = floor(aLb.w + 0.01), tone = fract(aLb.w + 0.01)*2.0, size, alpha, squash = 1.0;
        vec3 c, nrm;
        if (kind < 0.5) {
          float r = aCen.w, p = fract(aLb.x + uTime*aLb.y);
          float live = step(1e-5, aLb.y), env = mix(1.0, smoothstep(0.0, 0.3, p)*(1.0 - smoothstep(0.72, 1.0, p)), live), sc = mix(0.42, 1.0, env);
          c = aCen.xyz + live*(vec3(0.0, (p - 0.5)*r*1.6, 0.0) + aOd*(((env - 0.55)*0.45 - 0.35*(1.0 - env)*(1.0 - env))*r)) + aSd.xyz*(r*sc*0.94);
          size = r*sc*aSd.w; nrm = aNr; alpha = 0.8*smoothstep(0.45, 0.75, sc);
        } else if (kind < 1.5) {
          float vol = floor(uClock/3.0), ph = fract(uClock/3.0);
          float big = 1.0 + 0.4*step(mod(vol, 4.0), 0.5), e1 = 1.0 - exp(-ph*5.7);
          c = vec3(aCen.x, aCen.w*0.2, aCen.z) + aOd*(95.0*aLb.y*e1*big);
          size = aCen.w*(0.55 + 0.45*e1)*big; squash = 0.55; nrm = vec3(aOd.x*0.5, 0.85, aOd.z*0.5);
          alpha = 0.7*smoothstep(0.0, 0.07, ph)*(1.0 - smoothstep(0.45, 0.97, ph));
        } else {
          float rho = max(uSurge.x - aCen.x, 4.0), grow = clamp(rho*0.07 + 5.0, 6.0, 17.0);
          vec2 cxz = uSurge.zw + aOd.xz*rho;
          float dC = length(cxz), al = dot(cxz, vec2(${BX}, ${BZ})), pe = abs(dot(cxz, vec2(${PX}, ${PZ})));
          float inside = max(1.0 - smoothstep(168.0, 204.0, dC), smoothstep(-30.0, 50.0, al)*(1.0 - smoothstep(66.0, 104.0 + max(al - 150.0, 0.0)*0.3, pe)));
          float crest = step(kind, 2.5);
          c = vec3(cxz.x, grow*aOd.y, cxz.y); size = grow*aCen.w; squash = mix(0.42, 0.8, crest);
          alpha = uSurge.y*inside*mix(0.5, 0.66, crest); tone = 2.0;
          nrm = normalize(vec3(aOd.x*0.4, mix(0.3, 1.0, crest), aOd.z*0.4));
        }
        vec4 wc = modelMatrix*vec4(c, 1.0);
        vec3 toCam = cameraPosition - wc.xyz; float dist = length(toCam); toCam /= max(dist, 1e-3);
        if (kind < 0.5) alpha *= 1.0 - smoothstep(0.3, 0.8, abs(dot(nrm, toCam)));       // wisps show on the silhouette only
        alpha *= smoothstep(size*0.8 + 8.0, size*0.8 + 38.0, dist);                       // never a card at the lens
        vec3 right = cross(vec3(0.0, 1.0, 0.0), toCam); right = right/max(length(right), 1e-3); vec3 up = cross(toCam, right);
        wc.xyz += right*(position.x*size) + up*(position.y*size*squash);
        vQ = vec4(position.xy, aLb.z*31.0, alpha);
        vK = vec3(tone, smoothstep(-0.5, 0.6, dot(nrm, uSunDir)), dot(right, uSunDir));
        vec4 mvPosition = viewMatrix*wc; gl_Position = projectionMatrix*mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSteam, uShadow, uAsh, uSurgeCol; uniform float uTime;
      ${LIGHT_PARS}
      varying vec4 vQ; varying vec3 vK;
      ${FOG_PF}
      ${NOISE_GLSL}
      void main(){
        vec2 q = vQ.xy; float sd = vQ.z;
        float n = ibVN2(q*1.9 + sd + vec2(0.0, -uTime*0.07))*0.6 + ibVN2(q*4.7 - sd + vec2(uTime*0.05, 0.0))*0.4;
        float d = length(q) + (n - 0.5)*0.95;
        float a = (1.0 - smoothstep(0.22, 0.8, d))*vQ.w*(1.0 - smoothstep(0.75, 1.0, max(abs(q.x), abs(q.y))));
        if (a < 0.004) discard;
        float lit = clamp(vK.y*(0.7 + 0.6*n) + 0.25*q.x*vK.z + 0.2*q.y, 0.0, 1.0);
        float skyL = dot(uSkyCol, vec3(0.3, 0.5, 0.2));
        vec3 steam = mix(mix(uShadow, vec3(dot(uShadow, vec3(0.3, 0.5, 0.2))), 0.3)*skyL*1.8, uSteam*uSunCol*0.93, lit);
        vec3 ash = mix(uAsh*0.9*uSkyCol*1.9, (uAsh*3.0 + 0.03)*uSunCol*1.1, lit);
        vec3 srg = uSurgeCol*(uSunCol*lit*0.95 + uSkyCol*0.8)*(0.8 + 0.3*n);
        vec3 col = vK.x > 1.5 ? srg : mix(steam, ash, clamp(vK.x, 0.0, 1.0));
        gl_FragColor = vec4(col, a);
        ${FOG_F}
      }`,
  });
  for (const k of ['uTime', 'uClock', 'uSurge', 'uSunDir', 'uSunCol', 'uSkyCol', 'uNight']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'softEdges'; mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- LIGHTNING: prebuilt branched ribbons inside the black trunk
function buildLightning(rng, G, U) {
  const pos = [], tan = [], sid = [], idx = [], mids = [];
  const strand = (pts, bolt, w0, w1) => {
    const base = pos.length / 3;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], t = i / (pts.length - 1);
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(tx, ty, tz) || 1; tx /= l; ty /= l; tz /= l;
      for (let s = -1; s <= 1; s += 2) { pos.push(pts[i][0], pts[i][1], pts[i][2]); tan.push(tx, ty, tz); sid.push(s, bolt, lerp(w0, w1, t)); }
      if (i > 0) { const v = base + i * 2; idx.push(v - 2, v - 1, v, v, v - 1, v + 1); }
    }
  };
  const pointAt = (y, ang, k) => { const ax = G.trunkAxis(1, y), R = trunkR(y) * k; return [ax[0] + Math.cos(ang) * R, y, ax[1] + Math.sin(ang) * R]; };
  for (let b = 0; b < 12; b++) {
    const y0 = rng.range(50, 250), len = rng.range(90, 170), a0 = rng() * 6.283, da = rng.range(-0.9, 0.9), k0 = rng.range(0.72, 0.98);
    const n = 15, pts = []; let jx = 0, jy = 0, jz = 0;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), p = pointAt(y0 + len * t, a0 + da * t, k0 + 0.1 * Math.sin(t * 5 + b));
      jx += rng.range(-7, 7); jy += rng.range(-5, 5); jz += rng.range(-7, 7); jx *= 0.8; jy *= 0.8; jz *= 0.8;
      pts.push([p[0] + jx, p[1] + jy, p[2] + jz]);
    }
    strand(pts, b, 1, 0.75);
    mids.push(new THREE.Vector3(pts[7][0], pts[7][1], pts[7][2]));
    for (let br = 0; br < 2; br++) {
      const s = pts[rng.int(3, 11)], d = [rng.range(-1, 1), rng.range(-0.6, 0.9), rng.range(-1, 1)], bp = []; let q = [s[0], s[1], s[2]];
      for (let i = 0; i < 7; i++) { bp.push([q[0], q[1], q[2]]); q = [q[0] + d[0] * 9 + rng.range(-5, 5), q[1] + d[1] * 9 + rng.range(-4, 4), q[2] + d[2] * 9 + rng.range(-5, 5)]; }
      strand(bp, b, 0.6, 0.2);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3)); geo.setAttribute('aSide', new THREE.Float32BufferAttribute(sid, 3));
  geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(87, 220, 96), 400);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uBolt: U.uBolt, uFlashCol: { value: new THREE.Color('#D9C8FF') } },
    vertexShader: /* glsl */`
      attribute vec3 aTan; attribute vec3 aSide; uniform vec4 uBolt; varying vec2 vX;
      ${FOG_PV}
      void main(){
        float s = abs(aSide.y - uBolt.x) < 0.5 ? uBolt.y : (abs(aSide.y - uBolt.z) < 0.5 ? uBolt.w : 0.0);
        vec4 wp = modelMatrix*vec4(position, 1.0);
        vec3 toCam = cameraPosition - wp.xyz; float dist = length(toCam);
        vec3 side = cross(mat3(modelMatrix)*aTan, toCam); side = side/max(length(side), 1e-3);
        wp.xyz += side*(aSide.x*max(2.2, dist*0.0045)*aSide.z*2.4);
        vFog = ibFogV(wp.xyz);
        vX = vec2(aSide.x, s*(1.0 - vFog.y));
        gl_Position = s > 0.003 ? projectionMatrix*viewMatrix*wp : vec4(2.0, 2.0, 2.0, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uFlashCol; varying vec2 vX;
      void main(){ float x = abs(vX.x); float core = 1.0 - smoothstep(0.12, 0.34, x); float halo = exp(-x*x*7.0)*(1.0 - smoothstep(0.7, 1.0, x));
        gl_FragColor = vec4(uFlashCol*(core*6.0 + halo*1.3)*vX.y, 1.0); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'lightning'; mesh.frustumCulled = false; mesh.renderOrder = 6;
  return { mesh, mids };
}

// ---------------------------------------------------------------- ASH CURTAIN + sea wash (cascade into the steam pit, surge whitening)
function buildCurtain(rng, G, U) {
  // two wide sheets hung ACROSS the wind, 1.6 and 2.3 km downwind of the island and bowed round it like a bay: from the
  // run-in, the breach and the climb they are always seen face on, never as a pane or an edge. Each sheet's own u runs 0..1
  // from end to end (its seed is a separate attribute), so both ends and the top of both sheets fade to exactly nothing:
  // there is no edge anywhere. Its atmosphere is worked out per pixel: thin haze by distance, and seen through the surge's mist it
  // simply is not there (it used to take the mist's colour per vertex, on a grid 2 km wide: a pale pillar between the trunks).
  const NU = 30, NV = 10, pos = [], uv = [], sheet = [], idx = [], tl = Math.max(G.tanLean, 0.2);
  for (let k = 0; k < 2; k++) {
    const base = pos.length / 3, ph = rng() * 6, s0 = k ? 2350 : 1650, half = k ? 1300 : 980, off = k ? -280 : 240;
    for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
      const u = i / NU, v = j / NV, w = u * 2 - 1, s = s0 - 400 * w * w + Math.sin(u * 5 + ph) * 70;
      const yTop = Math.min(G.colH * 0.8, 480 + s / tl - 0.55 * columnR(500 + s / tl));
      const sB = s + 320 * v * v, lat = off + w * half;
      pos.push(G.wind[0] * sB - G.wind[1] * lat, lerp(yTop, -6, v), G.wind[1] * sB + G.wind[0] * lat); uv.push(u, v); sheet.push(k * 3.7 + 0.3);
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = base + i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setAttribute('aSheet', new THREE.Float32BufferAttribute(sheet, 1)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSlate: { value: new THREE.Color('#5B6470') } }]),
    vertexShader: /* glsl */`
      attribute float aSheet; varying vec4 vUv; varying vec3 vWp;
      ${FOG_PV}
      void main(){ vUv = vec4(uv, mix(1.0, 0.4, smoothstep(40.0, 120.0, cameraPosition.y)), aSheet);      // thinner seen from inside the slot
        vec4 wp = modelMatrix*vec4(position, 1.0); vWp = wp.xyz; vFog = vec2(0.0);
        gl_Position = projectionMatrix*viewMatrix*wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSlate; uniform float uTime;
      ${LIGHT_PARS}
      varying vec4 vUv; varying vec3 vWp;
      ${FOG_PV}
      ${NOISE_GLSL}
      void main(){
        float u = vUv.x, v = vUv.y, sd = vUv.w;
        // one soft slate veil: slow heavier and thinner patches (as wide as they are tall, so they never line up into panes
        // or bands), and FALLING STREAKS: shafts of heavier fall 70 m wide and a few hundred metres long that slide down the
        // sheet. They are short, irregular and gentle (a fifth of the veil's weight), and melt away where one would be under
        // three pixels wide: the long ruled stripes they once were showed between the trunks as banding.
        float body = ibVN2(vec2(u*5.0 + sd*3.0 + v*1.7, v*2.6 - uTime*0.02))*0.65 + ibVN2(vec2(u*11.0 - v*2.0 + sd, v*5.5 - uTime*0.035))*0.35;
        float nz = ibVN2(vec2(u*9.0 + sd*5.0, v*4.0 + sd));
        float side = smoothstep(0.0, 0.44, min(u, 1.0 - u)*(0.8 + 0.4*nz));      // exactly nothing at both ends of both sheets
        float top = smoothstep(0.0, 0.42, v*(0.8 + 0.4*nz));                     // and at the top
        float su = u*28.0 + sd*9.0 + (nz - 0.5)*0.8, sk = 1.0 - smoothstep(0.12, 0.4, fwidth(su));
        float st = ibVN2(vec2(su, v*6.0 - uTime*0.16))*0.6 + ibVN2(vec2(su*2.3 + 5.0, v*11.0 - uTime*0.27))*0.4;
        float fall = mix(1.0, 0.8 + 0.2*smoothstep(0.3, 0.72, st), sk);
        float a = (0.72 + 0.28*smoothstep(0.2, 0.8, body))*fall*side*top*(1.0 - 0.3*smoothstep(0.7, 1.0, v));
        vec3 col = uSlate*(uSunCol*0.33 + uSkyCol*0.46)*mix(1.0, 1.07 - 0.14*smoothstep(0.3, 0.72, st), sk);      // (slate-blue, darker than the sky beside it: the jets stand black against it)
        // Haze by its true distance. The surge's mist is measured over the first 60 m of the sight line only, and any mist
        // there takes the curtain away (it is 2 km behind it). Measured at the curtain itself, the slow billow of the mist's
        // top (a pattern in world space, 130 m across) was printed on the sheet as faint upright bands 15 pixels apart.
        vec3 dv = vWp - cameraPosition; float dl = max(length(dv), 1.0), hz = dl*uHaze.w;
        float mist = ibFogV(cameraPosition + dv*(60.0/dl)).y;
        gl_FragColor = vec4(mix(col, uHaze.rgb, 1.0 - exp(-hz*hz)), a*0.74*vUv.z*pow(max(1.0 - mist, 0.0), 25.0));
      }`,
  });
  for (const k of ['uTime', 'uSunDir', 'uSunCol', 'uSkyCol', 'uNight']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'ashCurtain'; mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}

function buildWash(U, pal) {
  const pos = [], dat = [], idx = [];
  const ring = (kind, rows, segs) => {
    const base = pos.length / 3;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= segs; i++) { const a = (i % segs) / segs * 6.2832; pos.push(Math.cos(a), 0, Math.sin(a)); dat.push(j / rows, kind, i / segs); }
    // (the lake's ring is wound to face up: it is seen from above. The other two face down, as they always have.)
    for (let j = 0; j < rows; j++) for (let i = 0; i < segs; i++) { const a = base + j * (segs + 1) + i, b = a + segs + 1; if (kind > 1.5) idx.push(a, a + 1, b, a + 1, b + 1, b); else idx.push(a, b, a + 1, a + 1, b, b + 1); }
  };
  ring(0, 5, 56); ring(1, 5, 72); ring(2, 7, 64);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('aDat', new THREE.Float32BufferAttribute(dat, 3)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSteam: { value: pal.steam.clone() }, uJade: { value: pal.jade.clone() }, uOchre: { value: pal.ochre.clone() }, uPit: { value: new THREE.Vector2(-PX * VENT_OFF, -PZ * VENT_OFF) } }]),
    vertexShader: /* glsl */`
      attribute vec3 aDat; uniform vec4 uSurge; uniform vec2 uPit; uniform float uWashY;
      varying vec3 vD; varying vec2 vXZ;
      ${FOG_PV}
      void main(){
        float t = aDat.x; vec3 p;
        if (aDat.y < 0.5) { float r = mix(52.0, 138.0, t); p = vec3(uPit.x + position.x*r, uWashY - 5.0*(1.0 - smoothstep(0.0, 0.45, t)), uPit.y + position.z*r); }
        else if (aDat.y < 1.5) { float r = max(uSurge.x + mix(-150.0, 10.0, t), 1.0); p = vec3(uSurge.z + position.x*r, uWashY + 0.15, uSurge.w + position.z*r); }
        else { float r = 232.0*t; p = vec3(position.x*r, uWashY + 0.45, position.z*r); }       // the crater lake, as the climb sees it from above
        vD = aDat; vXZ = p.xz;
        vec4 mvPosition = modelViewMatrix*vec4(p, 1.0); gl_Position = projectionMatrix*mvPosition;
        ${FOG_V}
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSteam, uJade, uOchre; uniform vec4 uSurge; uniform float uTime;
      uniform sampler2D uRelief; uniform vec2 uReliefR;
      ${LIGHT_PARS}
      varying vec3 vD; varying vec2 vXZ;
      ${FOG_PF}
      ${NOISE_GLSL}
      void main(){
        float t = vD.x, a; vec3 tintC = uSteam;
        if (vD.y > 1.5) {     // THE CRATER LAKE from above: milky jade water marbled darker and paler, sulphur-ochre threads and
          // foam lines drawn round the two vents. It is drawn for a high eye only (hi, as it always was: from the breach the sea's
          // own surface is the picture).
          float hi = smoothstep(50.0, 170.0, cameraPosition.y);
          float dC = length(vXZ), al = dot(vXZ, vec2(${BX}, ${BZ})), pe = abs(dot(vXZ, vec2(${PX}, ${PZ})));
          float n = ibVN2(vXZ*0.016 + vec2(uTime*0.012, 0.0))*0.8 + ibVN2(vXZ*0.047 - vec2(0.0, uTime*0.02))*0.2;
          vec2 kq = vXZ - vec2(${(PX * VENT_OFF).toFixed(1)}, ${(PZ * VENT_OFF).toFixed(1)}), wq = vXZ + vec2(${(PX * VENT_OFF).toFixed(1)}, ${(PZ * VENT_OFF).toFixed(1)});
          float rk = length(kq), rw = length(wq);
          float rings = ibVN2(vec2(rk*0.075 - uTime*0.25, atan(kq.y, kq.x + 1e-3)*2.0))*0.5 + ibVN2(vec2(rw*0.09 + uTime*0.2, atan(wq.y, wq.x + 1e-3)*2.0))*0.5;
          float thr = smoothstep(0.7, 0.8, ibVN2(vXZ*vec2(0.016, 0.085) + 7.0 + n));
          // the green of oxidised copper, deeper and darker toward the middle of the lake, paler and milkier in the shallows
          tintC = mix(uJade*0.68, uJade*1.05 + vec3(0.02, 0.05, 0.02), smoothstep(0.25, 0.8, n))*mix(0.72, 1.0, smoothstep(15.0, 150.0, dC + (n - 0.5)*40.0));
          tintC = mix(tintC, uSteam, 0.06);      // milky
          // by moonlight the water is a darker silver-jade, and the foam, the cascade and the streaks lie on it as they do by day
          tintC = mix(tintC, vec3(0.3, 0.46, 0.36)*(0.8 + 0.4*n), 0.55*uNight);
          tintC = mix(tintC, uOchre*0.9, thr*0.2);
          tintC = mix(tintC, vec3(0.2, 0.2, 0.2), 0.3*smoothstep(0.62, 0.8, ibVN2(vXZ*vec2(0.02, 0.11) + 19.0 + n)));      // threads of fallen ash
          // soft rings of foam drawn round the two vents
          float foam = smoothstep(0.6, 0.84, rings*0.7 + n*0.3)*(1.0 - 0.6*smoothstep(50.0, 170.0, min(rk, rw)));
          tintC = mix(tintC, uSteam, foam*0.5);
          // the sea pouring over the sill into the steam pit: white streaks running inward (the lake lies over the cascade's own ring)
          vec2 dw = wq/max(rw, 1e-3);
          float cs = ibVN(vec3(dw*9.0, rw*0.05 + uTime*0.9))*0.6 + ibVN(vec3(dw*23.0, rw*0.11 + uTime*1.7))*0.4;
          float casc = smoothstep(0.58, 0.84, cs + 0.3*(1.0 - smoothstep(50.0, 135.0, rw)))*(1.0 - smoothstep(92.0, 138.0, rw))*smoothstep(36.0, 54.0, rw);
          tintC = mix(tintC, uSteam, casc*0.6);
          a = hi*(0.72 + 0.2*foam)*max(1.0 - smoothstep(168.0, 196.0, dC + (n - 0.5)*30.0), smoothstep(-30.0, 50.0, al)*(1.0 - smoothstep(62.0, 96.0, pe + (n - 0.5)*24.0)))*(1.0 - smoothstep(0.86, 1.0, t));
          // THE SHEET ENDS WHERE THE LAKE DOES: it lies 1.35 m over the sea's mean level and so covered the wall's foot up to that
          // height, the cone's own surf (its swash and lace, between 1.6 m under the sea and 2 m over it) with it. Where the wall's
          // ground (the cone's relief map: its height in metres) comes up through the last 2.2 m under the sea's level the sheet
          // thins to nothing, by the ground alone, and the surf line shows round the lake's shore as it does from the water.
          a *= 1.0 - smoothstep(-2.4, -0.2, texture2D(uRelief, vec2(atan(vXZ.y, vXZ.x + 1e-4)*0.15915494, (dC - uReliefR.x)*uReliefR.y)).r);
        } else
        if (vD.y < 0.5) {     // the sea pouring over the sill into the steam pit: white streaks running inward
          float st = ibVN2(vec2(vD.z*150.0, t*5.0 + uTime*1.1))*0.6 + ibVN2(vec2(vD.z*420.0, t*11.0 + uTime*1.9))*0.4;
          a = smoothstep(0.62 - 0.5*(1.0 - t), 0.9 - 0.4*(1.0 - t), st + 0.25)*(1.0 - smoothstep(0.55, 1.0, t));
        } else {              // whitened, flattened sea under and behind the surge front
          float n = ibVN2(vXZ*0.09 + uTime*0.05)*0.6 + ibVN2(vXZ*0.31 - uTime*0.08)*0.4;
          a = smoothstep(0.0, 0.25, t)*(1.0 - smoothstep(0.9, 1.0, t))*(0.25 + 0.75*t)*smoothstep(0.2, 0.6, n + 0.35*t)*uSurge.y*0.9;
          a = max(a, smoothstep(0.74, 0.88, t)*(1.0 - smoothstep(0.93, 1.0, t))*smoothstep(0.1, 0.45, n + 0.25)*uSurge.y);
          float dC = length(vXZ), al = dot(vXZ, vec2(${BX}, ${BZ})), pe = abs(dot(vXZ, vec2(${PX}, ${PZ})));
          a *= mix(1.0, 0.06 + 0.62*smoothstep(0.42, 0.62, ibVN2(vXZ*0.021 + 3.0)*0.65 + ibVN2(vXZ*0.06 + 11.0)*0.35), smoothstep(60.0, 200.0, cameraPosition.y));
          a *= max(1.0 - smoothstep(175.0, 215.0, dC), smoothstep(-30.0, 50.0, al)*(1.0 - smoothstep(80.0, 125.0 + max(al - 150.0, 0.0)*0.3, pe)));
        }
        if (a < 0.004) discard;
        gl_FragColor = vec4(tintC*(uSunCol*0.62 + uSkyCol*0.4), a);
        ${FOG_F}
      }`,
  });
  for (const k of ['uTime', 'uSurge', 'uWashY', 'uSunDir', 'uSunCol', 'uSkyCol', 'uNight', 'uRelief', 'uReliefR']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'wash'; mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------- buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('island-being-born');      // one draw from the shared stream; everything else is private
  const detail = ctx.quality?.detail ?? 1;
  const hex = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const pal = { cobalt: new THREE.Color(hex[0]), jade: new THREE.Color(hex[1]), ash: new THREE.Color(hex[2]), steam: new THREE.Color(hex[3]), shadow: new THREE.Color(hex[4]), ochre: new THREE.Color(hex[5]), bomb: new THREE.Color(hex[6]) };

  // per-seed character
  const age = opts.age ?? (rng.chance(0.3) ? rng.range(0.05, 0.35) : rng.range(0.7, 1));
  const leanDeg = opts.lean === 'light' ? 12 : opts.lean === 'strong' ? 40 : (typeof opts.lean === 'number' ? opts.lean : rng.range(18, 30));
  const P = {
    backH: lerp(82, 150, age), hornH: lerp(40, 62, age), breachW: lerp(255, 196, age), rimR: 230, baseR: lerp(322, 336, age), innerW: 85,
    rillF: rng.range(11, 17), o1: rng.range(-50, 50), o2: rng.range(-50, 50), scars: [],
  };
  const thB = Math.atan2(BZ, BX), nSc = rng.int(3, 5);
  for (let i = 0; i < nSc; i++) P.scars.push({ th: thB + Math.PI + rng.range(-1.9, 1.9), w: rng.range(0.12, 0.26), depth: rng.range(9, 20) });
  const G = { wind: [0.8, -0.6], tanLean: Math.tan(leanDeg * Math.PI / 180), colH: opts.columnHeight ?? 6000, sun: (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.653, 0.469, 0.592)).normalize() };
  const coneH = makeConeField(ctx.noise, P);
  // fumarole sites: one on each horn's inner slope (they steam ~90 m either side of the breach line), the rest round the rim
  const fumaroles = [];
  for (let i = 0; i < 8; i++) {
    let x, z;
    if (i < 2) { const s = i ? 1 : -1, al = rng.range(150, 205), pe = s * (P.breachW * 0.5 + rng.range(38, 62)); x = BX * al + PX * pe; z = BZ * al + PZ * pe; }
    else { const th = thB + (i % 2 ? 1 : -1) * rng.range(0.75, 2.9), r = rng.range(188, 262); x = Math.cos(th) * r; z = Math.sin(th) * r; }
    fumaroles.push({ x, z, r: rng.range(15, 27) });
  }
  const K = new THREE.Vector3(PX * VENT_OFF, 0, PZ * VENT_OFF), W = new THREE.Vector3(-PX * VENT_OFF, 0, -PZ * VENT_OFF);
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(-0.653, 0.469, 0.592)).normalize();
  const U = {
    uTime: { value: 0 }, uClock: { value: 0 }, uSeed: { value: rng.range(0, 100) }, uVent: { value: K.clone() }, uWind: { value: new THREE.Vector2(G.wind[0], G.wind[1]) },
    uSurge: { value: new THREE.Vector4(SURGE_R0, 0, K.x, K.z) }, uWashY: { value: opts.washY ?? 0.9 },
    uHaze: { value: new THREE.Vector4(0.75, 0.84, 0.93, 0) }, uMist: { value: new THREE.Vector4(0, 40, 0, 0) }, uMistCyl: { value: new THREE.Vector4(0, 0, 1, 0) }, uMistCol: { value: new THREE.Color('#8C8A86') }, uSurgeCol: { value: new THREE.Color('#ACAAA5') },
    uSunDir: { value: sunDir }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uSkyCol: { value: new THREE.Color(1, 1, 1) }, uNight: { value: 0 },
    fine: detail >= 0.8, uFlashPos: { value: [new THREE.Vector3(), new THREE.Vector3()] }, uFlashI: { value: [0, 0] }, uBolt: { value: new THREE.Vector4(-1, 0, -1, 0) }, uNearK: { value: 0 },
  };
  const light = { sunColor: new THREE.Color(opts.sunColor ?? '#FFF4E0'), skyColor: new THREE.Color(opts.skyColor ?? '#B9C0C8'), sunIntensity: opts.sunIntensity ?? 1, skyIntensity: opts.skyIntensity ?? 1 };
  function setLight(o = {}) {
    if (o.sunDir) U.uSunDir.value.copy(o.sunDir).normalize();
    if (o.night !== undefined) { U.uNight.value = o.night ? 1 : 0; if (o.night) { light.sunColor.set('#A9BCE8'); light.sunIntensity = 0.38; light.skyIntensity = 0.16; } }
    if (o.sunColor) light.sunColor.set(o.sunColor);
    if (o.skyColor) light.skyColor.set(o.skyColor);
    if (o.sunIntensity !== undefined) light.sunIntensity = o.sunIntensity;
    if (o.skyIntensity !== undefined) light.skyIntensity = o.skyIntensity;
    U.uSunCol.value.copy(light.sunColor).multiplyScalar(light.sunIntensity);
    U.uSkyCol.value.copy(light.skyColor).multiplyScalar(light.skyIntensity);
  }
  setLight({ night: !!opts.night });

  const object = new THREE.Group(); object.name = 'island-being-born';
  await ctx.yield();
  const cone = await buildCone(ctx, coneH, P, fumaroles, U, pal); object.add(cone);
  await ctx.yield();
  const clouds = await buildClouds(ctx, rng, G, U, pal); object.add(clouds.mesh, clouds.farMesh, clouds.nearMesh, clouds.surge);
  await ctx.yield();
  const jets = buildJets(U, pal); object.add(jets);
  const bombs = buildBombs(rng, U, pal); object.add(bombs.mesh, bombs.glow);
  await ctx.yield();
  const puffs = buildPuffs(rng, U, pal, fumaroles, coneH); object.add(puffs);
  const bolts = buildLightning(rng, G, U); object.add(bolts.mesh);
  await ctx.yield();
  if (opts.curtain !== false) object.add(buildCurtain(rng, G, U));
  if (opts.seaFoam !== false) object.add(buildWash(U, pal));
  await ctx.yield();
  object.add(buildSoftEdges(rng.fork('soft'), G, U, pal));
  await ctx.yield();

  // every shader here shares the piece's own haze and surge mist
  object.traverse((o) => { if (o.material && o.material.uniforms) { o.material.uniforms.uHaze = U.uHaze; o.material.uniforms.uMist = U.uMist; o.material.uniforms.uMistCyl = U.uMistCyl; o.material.uniforms.uMistCol = U.uMistCol; } });

  // ---- clocks
  let clockOverride = null, lightningGain = 1, nearOn = false, nearGrow = 1;
  const seedF = U.uSeed.value;
  const hsh = (n, k) => { const x = Math.sin(n * 127.1 + k * 311.7 + seedF) * 43758.5453; return x - Math.floor(x); };
  const surgeOut = { active: false, radius: SURGE_R0, height: 0, strength: 0, center: K.clone() };
  function surge(clock) {
    const t = clock - SURGE_DELAY, ts = t - Math.floor(t / (PERIOD * BIG_EVERY)) * PERIOD * BIG_EVERY;
    surgeOut.radius = SURGE_R0 + SURGE_SPEED * ts;
    surgeOut.strength = smoothstep(0, 0.9, ts) * (1 - smoothstep(SURGE_LIFE - 2.6, SURGE_LIFE - 0.1, ts));
    surgeOut.height = clamp(surgeOut.radius * 0.085 + 9, 11, 31) * 1.35 * surgeOut.strength;
    surgeOut.active = surgeOut.strength > 0.01;
    return surgeOut;
  }
  const timeline = {
    period: PERIOD, bigEvery: BIG_EVERY, surgeDelay: SURGE_DELAY, surgeSpeed: SURGE_SPEED, surgeLife: SURGE_LIFE, surgeR0: SURGE_R0, flightBig: 18.5,
    clockAtBriefTime: (sec) => sec + 24.5,
  };
  const camPos = new THREE.Vector3(), kW = new THREE.Vector3();
  function update(dt, time, camera) {
    const clock = clockOverride ?? time;
    U.uTime.value = time; U.uClock.value = clock;
    const s = surge(clock); U.uSurge.value.x = s.radius; U.uSurge.value.y = s.strength;
    // lightning: one possible flash per 0.75 s slot (so never more than two a second), 0.1 s rise, ~0.3 s decay
    const f = Math.floor(clock / 0.75);
    for (let i = 0; i < 2; i++) {
      const fi = f - i, on = hsh(fi, 1) < 0.86, t = clock - (fi * 0.75 + hsh(fi, 2) * 0.3);
      let e = 0;
      if (on && t > 0) e = (t < 0.1 ? smoothstep(0, 0.1, t) : Math.exp(-(t - 0.1) / 0.11)) * (0.6 + 0.4 * hsh(fi, 4)) * lightningGain;
      const b = Math.floor(hsh(fi, 3) * 12) % 12;
      if (i === 0) { U.uBolt.value.x = b; U.uBolt.value.y = e; } else { U.uBolt.value.z = b; U.uBolt.value.w = e; }
      U.uFlashPos.value[i].copy(bolts.mids[b]).applyMatrix4(object.matrixWorld); U.uFlashI.value[i] = e * 1.6;
    }
    if (camera) camera.getWorldPosition(camPos);
  }

  const cl = Math.cos(58 * Math.PI / 180), sl = Math.sin(58 * Math.PI / 180);
  const anchors = {
    ventK: K.clone(), ventW: W.clone(), breachDir: new THREE.Vector3(BX, 0, BZ),
    jetsMid: new THREE.Vector3(K.x + 20, 200, K.z + 20), slotMid: new THREE.Vector3(0, 250, 0),
    portalSeat: { position: new THREE.Vector3(37, 430, -33), normal: new THREE.Vector3(-0.74 * cl, -sl, 0.67 * cl).normalize(), radius: 9, pitchDeg: 58 },
    roof: new THREE.Vector3(123, 617, -111),
    flyThrough: FLY.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    viewpoints: {
      entry: new THREE.Vector3(-120, 2.4, 800), jadeLine: new THREE.Vector3(-150, 2.4, 470),
      heldBreath: new THREE.Vector3(-246, 2.8, 223), slotBase: new THREE.Vector3(-150, 40, 136),
    },
  };
  return {
    object, radius: 340, height: 560, center: new THREE.Vector3(0, 200, 0), anchors,
    update, dispose() {}, ground: true, groundY: 0,
    setClock(sec) { clockOverride = sec; }, setBriefTime(sec) { clockOverride = timeline.clockAtBriefTime(sec); },
    // (uNearK is 0 whenever the coarse twins are shown: the turrets that ride the very fine lobes work their seats out from it)
    setNear(on) { nearOn = !!on; clouds.nearMesh.visible = nearOn; clouds.farMesh.visible = !nearOn; U.uNearK.value = nearOn ? nearGrow : 0; }, setNearGrow(k) { nearGrow = k; U.uNearK.value = nearOn ? nearGrow : 0; },
    setSurgeShown(on) { clouds.surge.geometry.setDrawRange(0, on ? Infinity : 0); },      // its 33k triangles are only drawn while a surge is out (the mesh stays in the scene: only its draw range changes)
    setLight, setLightningGain(k) { lightningGain = k; }, setWashHeight(y) { U.uWashY.value = y; },
    setHaze(color, density) { U.uHaze.value.set(color.r, color.g, color.b, density); },
    setMist(density, top, color, radius) { U.uMist.value.x = density; U.uMist.value.y = top; if (color) U.uMistCol.value.copy(color); kW.copy(K).applyMatrix4(object.matrixWorld); U.uMistCyl.value.set(kW.x, kW.z, radius ?? 1e5, 0); },
    setSurgeColor(color) { U.uSurgeCol.value.copy(color); },
    surge, surgeArrival(x, z) { return Math.max(0, (Math.hypot(x - K.x, z - K.z) - SURGE_R0) / SURGE_SPEED); },
    heightAt: coneH, timeline, uniforms: U, params: { age, leanDeg, breachWidth: P.breachW, coneHeight: P.backH, wind: G.wind.slice(), detail, turrets: G.kids.length, creaseTurrets: G.creaseKids, climbTurrets: G.climbKids, lineTurrets: G.lineKids, lowLobes: G.lowLobes, upLobes: G.upLobes, topLobes: G.topLobes, slotLobes: G.slotLobes.length, nearTriangles: clouds.nearMesh.geometry.index.count / 3 },
    trunkRadius: trunkR, slotHalfWidth: slotHalf,
  };
}
