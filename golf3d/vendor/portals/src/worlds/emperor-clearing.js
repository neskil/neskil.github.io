// "The Huddle" (emperor-clearing): a snow petrel fights up a ground blizzard over fast ice, skims a pavement of
// four thousand emperor penguins, and then the wind dies and the snow is drawn aside like a curtain.
//
// MAP OF THIS FILE (in order)
//   1. constants: axes, wind, H (hero position), portal seat, path points (makePts)
//   2. SF_GLSL            the ONE fog chunk shared by every material, the sky dome and the hero (opts.fog):
//                         clear-air haze + the analytic length of the view ray inside the snow layer, a convex
//                         wedge: under a ragged, billowing top (uSfTop, 58 m) and under its leaning rear face,
//                         which rises downwind from a foot line at wind coordinate uSfEdge by uSfLean metres per
//                         metre. It is a GROUND blizzard: dense in its lowest ten metres (uSfHs) under a thin
//                         veil (uSfThin) that, from inside, is mostly open above a few degrees of elevation
//                         (level torn rags of it drift round the horizon), so from the first frame the violet
//                         sky, its cloud and the top of the berg stand clear over a pale drift that hides the
//                         plain and the cliff's foot; from behind, the wall is a thick drift at its foot under
//                         translucent folded veils (slate, each fold's upper edge pearl). While it blows the
//                         murk glows faintly toward the notch (uSfGlow, uSfGlowDir), and at all times warmly round the
//                         low moon (uMoonDir, uMoonCol: in FOGU, so every material has them). As it LEAVES it is a
//                         wall (uSfWall): a firm face (firmer still within 60 m), dense right up to a torn top that is
//                         read where the ray meets the face, a slate body with billows read on a turned lattice (sfVR:
//                         no level or upright cell edge) and a narrow, broken pearl rim on the tongues that stand up.
//                         Every noise on the wall is let go where one pixel spans it (fp). Seen from behind, toward
//                         the face's own horizon (the rays that run level with the leaning face: one straight line in
//                         the picture) the face is read with a wobble in the direction itself and the wall thins to
//                         nothing, so its edge against the sky is billowed and feathered. Uniforms: `FOGU`.
//   3. WL_GLSL            the light uniforms shared BY REFERENCE with the hero (hero.uniforms: uKeyDir,
//                         uKeyCol, uSkyCol, uGroundCol, uRimCol, uSat) and the two-act saturation clamp
//   4. makeSkyDome        own dome: violet twilight gradient (deeper once the snow has gone), a lilac-rose band
//                         opposite the sun, pin-point stars, the gold moon low in the north-north-west (bearing 351,
//                         its haze kept tight so the sheets keep their colour away from it), a pearl
//                         veil and the nacreous sheets (uLensA/B/C arrays; [0..2] are the bank over the departing
//                         wall, bearings 122 to 176, which the parting snow uncovers first): each has a sinuous hem
//                         (soft on the dim sheets far from the sun and on small scraps), the pearl core along it and
//                         low ribs above, closed by a soft upper edge (a lens, not a curtain of rays), in pastel zones
//                         that lie parallel to the hem (a small scrap is an oval smudge with its bands curved
//                         round its middle); ribs and colour bands move on
//                         their own clocks (uRayT, uCreep: twice as fast once the snow has gone); and a
//                         stand-in for the ice below the horizon for the portal preview (eye under the ice)
//   5. makeGround         900 m disc + the displaced sastrugi ribbon under the approach. ONE relief field, gSas
//                         in the shader and sasJS in JS (the same arithmetic): drifts strung along the wind, each
//                         with a rounded nose upwind, a soft foot, a rounded and notched crest, tailing away
//                         downwind. The ribbon is displaced by it (heightAt; its lattice is laid along the wind
//                         so crests follow mesh edges; from two metres beside the path the drifts stand half as
//                         tall again, to 0.8 m) and both meshes are shaded from it (a lit ramp, an indigo lee
//                         behind every ridge a forearm high, a crest line of one width (crestD: metres from the
//                         lane noise's 0.5 line), torn plumes of spindrift off the crests while it blows).
//                         AT ARM'S LENGTH the surface is matte, with a fine wind crust that is the same in every
//                         direction (no painted spindles or ripples: what stands up from the snow there is modelled,
//                         5b) and files of footprints; the moon tints
//                         every flank that faces it gold (goldF, laid on after the clamp), and its path is a loose
//                         scatter of unequal gold sparks on the crest lines, big and small (gSpark: one sliver 16-50 cm
//                         long to a lit cell of a slipped, warped lattice; one bright and a few faint to a ridge, most
//                         of the crest dark; far off a thin gold thread, goldGl), with single flashing crystals;
//                         ice panes (uPaneA/B: none within 11 m of the path), painted snow snakes, the colony
//                         stain (STAIN_GLSL from the part)
//   5b. makeSastrugi      the modelled sastrugi: wind-carved ridges 2.5 to 8 m long and 0.3 to 0.6 m tall, each its
//                         own small mesh strung along the wind (a blunt nose upwind, a creased crest running down to
//                         a pointed tail, a long lit ramp and a short violet lee), standing on the ribbon's drifts and
//                         on the plain. They are laid in a BAND beside the route (within 15.5 m of it on the approach,
//                         within 26 m of the low leg from the tail to the cliff's foot: a limit of cost, the same
//                         along each leg, with ridges fewer and lower toward its edge), keep off the bare ice, the
//                         slabs and the colony's ground, are trodden flat along every line a bird walks and dip
//                         where the lens passes over them. build() lays them last, from the last fork of ctx.rng
//   6. makeCliff, makeBlocks   the berg face with its notch: OPAQUE, modelled ice at every distance (buttresses
//                         standing proud between deep clefts away from the notch, benches, fissures, a spreading
//                         foot; never flattened or banded by distance). CLIFF_FRAG: strata that dip and rise along
//                         the berg, a firn band hanging down the top in tongues of unequal depth, upright fluting,
//                         jade bands, melt scallops of mixed size from a warped cCell that
//                         at the close pass are also flat facets, a few large planes among fields of small ones, each
//                         with its own frost grain, a faint shade in the creases, a few thin BRIGHT edges and pinches
//                         of lodged snow; soft turquoise light in the fissures (broken along its length, hidden where the snow hides the face), pin points of glitter
//                         sinking down it, and the ring's light playing over the ice either side of the notch (uRing));
//                         slabs along the approach (full plate) and the rubble ridge (a coarser plate); build() adds
//                         'foreground-ice', twenty slabs either side of the last approach (u 0.80-0.905)
//   7. makeShells, makeStreamers, makeCurtain (a few separate rags hanging off the fog's rear face), makeVeils
//      (eight short spindrift veils at the lip of the face at the horns and crest highs (none hangs down the dark
//      face: there it read as a pale ray drawn over the cliff), thinning out as the camera closes on them; each of the
//      two horns also flies a banner of spindrift, a soft faint wedge several metres thick, torn by scrolling noise;
//      drawn premultiplied so they never darken a cloud; half as thick right of the notch), makePetrels (sixteen
//      wheeling round the horns), makePetrelPass (six that overtake the lens on its left at 32-39 s, 9 to 20 m off,
//      and fly up to the north horn at 17 m/s). The petrel (petrelGeometry, PETREL_WING, PETREL_FRAG) is a shaded
//      bird: a gull's M wing of three panels a side that beats, facet light, grey underwing, dark flight feathers,
//      black bill and eye; in the pass it banks its back toward the lens
//      the weather and the air
//   8. build(ctx)         seeded moods (cloud / hour / storm / season / berg) -> path -> hero placement ->
//                         cast (stragglers, walkers) -> pois (one gaze function, `gazeAt`) -> post -> update
//
// WHERE THINGS ARE SET
//   path            makePts below: level entry at 1.2 m, a rise to 6 m at 80 m (gaze swung right to the berg), back
//                   down to 1.5 m and held there until the tail tip, the lift over the huddle (higher in July: no
//                   tail), the spiral, a drop to 3.5 m across the tail at 29.4 s (TAILZ; in July a file of
//                   latecomers stands there), a low leg over the walkers, then the last four points collinear: a
//                   straight 34 degree climb into the notch. The length is kept at 504 m: times are u x 42 s
//   pois            build(): TWO pois. 'gaze' (weight 0.8, the whole flight): its `at` solves for the engine's blend so the
//                   sweeping camera's gaze lands exactly on `gazeAt`. 'route hold' (u 0.34-0.62, applied first): solved for the
//                   STEADY camera, which through the spiral then turns no faster than the route (33 degrees a second where
//                   the gaze poi alone whipped it round at 52.7); the gaze poi undoes it exactly for the sweeping camera
//   hero placement  build(): hero.object.position = H, no rotation; hero ground is off, the stain is painted
//                   by the world's ground shader
//   seeded moods    build(): `mood` object (cloud, hour, storm, season, berg); ctx.vary.hour/density/rare
//   exposure/grade  build(): `post` (bloom only reaches cloud cores, steam rims and the portal)
//   fog             FOGU values are written every frame in update()
//   scripted moments (all keyed to u; t = u * 42 s)
//     uSfEdge       the foot of the snow layer's rear face (toward bearing 150; it crosses the camera at about
//                   20 s, is whisked 79 m downwind of it by 21 s, past the notch: the ring and the cliff north of it stand clear,
//                   the wall beside them; then it leaves at 12 to 20 m/s)
//     uSfLean       slope of that face: 1.5 while it passes over, 3.2 by 21 s (a wall), 4 by 26.5 s
//     uSfWall, uSfTop   19.8-21 s: the thin drift gathers into a wall 37 m high with a torn pearl top
//     uSfGlow       the glow in the murk toward the ring, from the first frame until the wind dies (19.5-22 s)
//     portal-fog-patch  a camera-facing disc in front of the engine's ring that draws the same fog and writes
//                   depth: a soft cover while it blows (uCover: the ring is a dim glow in the notch), then only
//                   where the fog is thick, so the ring emerges through the ragged face (hidden after 27.5 s)
//     uSfDense      whiteout density (gust pulses are in the shader, from uSfTime), with a lull from 11.5 to 16.5 s
//                   in which the huddle's dark band hardens ahead
//     stragglers    files placed for the camera at 3.4, 6.7, 8.3, 9.4, 10.5, 12.3, 13.2 s (and 14.3 s in July)
//     gaze          gazeAt: right and level on the rise (4.3-9.4 s), level on the huddle's band until 14 s, down to
//                   the birds at the pavement, round over the right shoulder as the wind dies (16.2-21.8 s, turned
//                   by bearing, never faster than 50 degrees a second) to look downwind over the crowd at the
//                   departing wall by 21.8 s, the huddle through the spiral, across the tail at 29.4 s, the cliff's
//                   foot under the ring at 33 s (ring high in the frame over the rubble and the foreground ice), a
//                   look left at the north horn's far shoulder at 36.5 s (the ring right of centre), then the ring.
//                   camera.bank is 0.55: the horizon never rolls more than nine degrees
//     uPassT        the petrels' pass (makePetrelPass): six birds placed from gazeAt itself, 32-39 s
//     uSteamAmt     steam: a little more in the lull, thin wisps for the first seconds after the wind dies
//     uCalm / uFlow wind dying at 20 s: snakes, shells, streamers, particles; the relief is drawn more quietly
//     hero.setProgress(u)   spiral, tucked heads, steam, beak wave, saturation clamp, storm -> pearl light
//     uVeil         spindrift veils sinking down the cliff after the wind stops
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, STAIN_GLSL } from '../parts/emperor-clearing.js';

const PALETTE = ['#8E8CA6', '#23233A', '#D6D9EA', '#3F6FA3', '#F3A6C8', '#8FE6C4', '#4AB2FF'];
const DEG = Math.PI / 180;
const DURATION = 42;
const bearingXZ = (deg) => [Math.sin(deg * DEG), -Math.cos(deg * DEG)];
const WIND = bearingXZ(150);                       // blowing toward bearing 150: (0.5, 0.866)
const WPERP = [-WIND[1], WIND[0]];
const H = new THREE.Vector3(-4, 0, -220);
const PORTAL = new THREE.Vector3(120, 44, -220);
const CLIFF = { x0: 116, k: 0.0009, zN: -220, vMin: -290, vMax: 190 };
const cliffX = (z) => CLIFF.x0 - CLIFF.k * (z - CLIFF.zN) * (z - CLIFF.zN);
// The path. The approach is four different looks: a level skim at 1.2 m (entry, then a file of birds at arm's length), a rise
// to 6 m at 80 m that shows the plain, the berg and the sky over the drift, a drop back to 1.5 m among the ridges, then the
// lift over the huddle (in July, with no tail to fly up, a higher look at the whole disc first). After the spiral it swoops to
// 8 m over the walkers and climbs the last 60 m dead straight into the notch (the last four points are collinear).
const makePts = (july) => [[0, 1.2, 0], [0, 1.3, -30], [0.4, 1.55, -46], [3, 6.2, -79], [4, 2.2, -106], [3, 1.5, -126], [-2, 1.4, -150], [0.6, july ? 2.6 : 1.5, -160.5], [2, july ? 5.5 : 3.2, july ? -169 : -168],
  [-1, 3.2, -202], [-4, 3.2, -220], [-9, 3.4, -238], [-32, 5.5, -236], [-46, 8, -220], [-38, 10.5, -196], [-24, 6.2, TAILZ - 1.2], [-9, 3.6, TAILZ], [12, 4.4, TAILZ + 1],
  [30, 7, -172], [62, 8.3, -196.1], [73, 11.75, -200.65], [84.75, 19.81, -205.49], [96.5, 27.87, -210.32], [120, 44, -220]];
const TAILZ = -180;                                // where the path crosses the huddle's tail, low, at 29.4 s
// the moon: bearing 351, 7.5 degrees up, over the open plain left of the berg (the one warm light in the place)
const MOON = new THREE.Vector3(Math.sin(351 * DEG) * Math.cos(7.5 * DEG), Math.sin(7.5 * DEG), -Math.cos(351 * DEG) * Math.cos(7.5 * DEG));
const FOOT_S21 = -192;                             // wind coordinate the snow layer's foot would have at 21 s at a steady 20 m/s; the gust that
                                                   // ends the storm whisks it 54 m further (update(): uSfEdge), so at 21 s it stands at -138,
                                                   // 79 m downwind of the camera (at -217), which it crossed at about 19.9 s

// ---------------------------------------------------------------- 2. the one fog
const SF_GLSL = /* glsl */`
uniform float uSfEdge, uSfLean, uSfDense, uSfHaze, uSfTime, uSfTop, uSfThin, uSfHs, uSfWall;
uniform vec3 uSfColA, uSfColB, uSfHazeCol, uSfGlow, uSfGlowDir, uMoonDir, uMoonCol;
uniform vec2 uSfKey;
float sfHash(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.y); }
float sfVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(sfHash(i), sfHash(i + vec2(1.0, 0.0)), f.x), mix(sfHash(i + vec2(0.0, 1.0)), sfHash(i + vec2(1.0, 1.0)), f.x), f.y); }
float sfTear(vec2 p){ return smoothstep(0.15, 0.9, sfVN(p)) - 0.45; }
// the same noise read on a turned, sheared lattice with a second octave: no cell edge runs level or upright on a wall
float sfVR(vec2 p){ vec2 q = vec2(p.x*0.8 + p.y*0.6, p.y*0.8 - p.x*0.6); return 0.68*sfVN(q) + 0.32*sfVN(q*2.13 + vec2(17.3, 5.1)); }   // rounded tongues thrown up from a level edge (gentle: steep ones are saw teeth)
float sfRamp(float x){ return x < 0.0 ? 0.0 : (x < 1.0 ? 0.5*x*x : x - 0.5); }
// rgb = fog colour, a = amount. hz scales the clear-air haze (0 for the sky dome).
// The snow layer is a convex wedge: under a ragged, billowing top (uSfTop) and under its REAR FACE, a slope that
// rises downwind from a foot line at wind coordinate uSfEdge (uSfLean m up per metre). It is a GROUND blizzard:
// thick in its lowest ten metres (uSfHs) and a thin veil above (uSfThin) that is mostly open above a few degrees
// of elevation, so from inside the sky stands clear over the drift and from behind the wall is a dense drift at
// its foot under translucent, folded veils.
vec4 sfFogRay(vec3 C, vec3 P, float hz){
  vec3 d = P - C; float D = max(length(d), 1e-3); vec3 n = d/D;
  vec2 W = vec2(0.5, 0.8660254), X = vec2(-0.8660254, 0.5);
  float sC = dot(C.xz, W) - uSfEdge, lC = dot(C.xz, X), nl = dot(n.xz, X);
  float ns = dot(n.xz, W);
  float hC = C.y - uSfLean*sC, nh = n.y - uSfLean*ns;
  // seen from behind, the rays that run level with the leaning face never meet it: in the picture they are one straight
  // line (the face's own horizon), with the whole wall on one side of it and clear air on the other. Near that line
  // the face is read with a slow wobble in the direction itself, and (below) the wall thins away toward it: a billowed,
  // feathered edge against the sky, never a straight slant
  float gzOut = smoothstep(0.0, 4.0, hC);
  float gz = gzOut*(1.0 - smoothstep(0.06, 0.5, abs(nh)));
  nh += gz*(0.22*(sfVN(vec2(n.x*4.3 + n.y*2.7 + 2.0, n.z*4.3 - n.y*1.9 + uSfTime*0.03)) - 0.5) + 0.09*(sfVN(vec2(n.x*11.0 - n.y*5.0 + 9.0, n.z*11.0 + n.y*7.0 - uSfTime*0.05)) - 0.5));
  nh = abs(nh) < 2e-3 ? (nh < 0.0 ? -2e-3 : 2e-3) : nh;
  float ny = abs(n.y) < 1e-3 ? 1e-3 : n.y;
  // raggedness is read where the ray meets the nominal face and the nominal top (fixed in the world, not in the view)
  float tF = clamp(-hC/nh, 0.0, min(D, 420.0));
  float latF = lC + nl*tF, yF = clamp(C.y + n.y*tF, 0.0, 110.0);
  float lod = 1.0 - smoothstep(110.0, 300.0, tF);      // far along the wall the fine detail would only alias: let it go
  // fp: how many metres along the wall one pixel covers where the ray meets it. Seen at a slant (the wall running
  // away into the distance) that grows fast, and every term is let go before a pixel spans a third of its wavelength:
  // without this the far wall breaks into marbled glassy panes
  float fp = tF*0.0024*(1.0 + abs(nl)/max(abs(nh), 0.02));
  float f90 = 1.0 - smoothstep(10.0, 34.0, fp), f40 = 1.0 - smoothstep(4.5, 15.0, fp), f22 = 1.0 - smoothstep(2.5, 8.0, fp), f3 = 1.0 - smoothstep(0.35, 1.2, fp);
  float rag = (sfVN(vec2(latF*0.011, yF*0.016 + 3.0)) - 0.5)*26.0*(0.35 + 0.65*lod)*f90
            + (sfVN(vec2(latF*0.045 + 7.0, yF*0.06)) - 0.5)*10.0*lod*f22
            + (sfVN(vec2(latF*0.3 + yF*0.05, yF*0.03 + 5.0)) - 0.5)*5.0*(1.0 - smoothstep(50.0, 170.0, tF))*smoothstep(0.12, 0.5, abs(ns))*f3
            + (sfVN(vec2(latF*0.024 + 1.7, yF*0.033 + 9.0)) - 0.5)*15.0*f40    // lumps
            + (sfVN(vec2(latF*0.041 + 2.0, yF*0.052 - uSfTime*0.03)) - 0.5)*20.0*f22*(1.0 - smoothstep(300.0, 420.0, tF));   // slow billows
  // (as a firm departing wall the face only billows gently: the big raggedness, read on the nominal face, would
  // fold a steep firm face into saw teeth; its torn edge is the top's own)
  // (for its first two seconds, while it still leans at 3.2, it keeps 0.4 of it: its edge against the sky is billowed, never one straight slant)
  hC += uSfLean*rag*mix(1.0, mix(0.4, 0.16, smoothstep(3.2, 4.0, uSfLean)), uSfWall);
  float tT = clamp((uSfTop - C.y)/ny, 0.0, min(D, 420.0));
  // (as a departing wall its top is read where the ray meets the face, so the torn edge is one line along the
  // wall; read on the top plane it would be corrugated along the wind and fan out in spikes from the vanishing point)
  float latT = mix(lC + nl*tT, latF, uSfWall);
  float fpT = mix(tT*0.0024*(1.0 + abs(nl)/max(abs(ny), 0.02)), fp, uSfWall);
  float top = uSfTop + (sfVN(vec2(latT*0.012, 11.0)) - 0.5)*36.0*(1.0 - smoothstep(10.0, 34.0, fpT))
            + (sfVN(vec2(latT*0.05, 4.0)) - 0.5)*14.0*(1.0 - smoothstep(2.5, 8.0, fpT))
            + (sfVN(vec2(latT*0.03 + 9.0, uSfTime*0.06)) - 0.5)*18.0*(1.0 - smoothstep(4.0, 13.0, fpT))
            // as it leaves it stands as a wall, and its top is torn: tongues a few metres across, some thrown up, drifting along it
            + uSfWall*(sfTear(vec2(latT*0.07 + 2.0, 7.0 + uSfTime*0.05))*10.0*(1.0 - smoothstep(1.0, 3.5, fpT))
                     + (sfVN(vec2(latT*0.21 + 5.0, 3.0 - uSfTime*0.11)) - 0.5)*4.6*(1.0 - smoothstep(0.35, 1.2, fpT))
                     + (sfVN(vec2(latT*0.8 + 9.0, 5.0 + uSfTime*0.2)) - 0.5)*1.7*(1.0 - smoothstep(0.12, 0.45, fpT)));
  float t0 = 0.0, t1 = D;
  float ty = (top - C.y)/ny;
  if (ny > 0.0) t1 = min(t1, ty); else t0 = max(t0, ty);
  float tf = -hC/nh;
  if (nh < 0.0) t0 = max(t0, tf); else t1 = min(t1, tf);
  float tIn = max(t0, 0.0);
  float kOut = smoothstep(0.0, 6.0, tIn);
  if (C.z > 0.0 && n.z < 0.0) t0 = max(t0, -C.z/n.z);   // seen through the previous portal: the snow starts at the entry plane
  t1 = max(t1, t0);
  // density ramps up over the first 20 m under the face, so the wall is feathered wherever it is seen
  float R = mix(28.0, 7.0, uSfWall*kOut) + 0.08*min(tIn, 400.0);   // and more softly the further away its edge is seen (as a departing wall: a firm face)
  float x0 = -(hC + nh*t0)/R, x1 = -(hC + nh*t1)/R;
  float len = max((sfRamp(x1) - sfRamp(x0))*R/(-nh), 0.0);
  // the layer thins toward its top as it does under its face: no crisp corner where the top meets the face
  // (and over more height the further off the wall stands, so its far reach has no hard top)
  len *= smoothstep(0.0, mix(24.0 + 0.1*min(tIn, 400.0), 1.6 + 0.022*min(tIn, 400.0), uSfWall*kOut), top - (C.y + n.y*0.5*(t0 + t1)));
  // a ground blizzard: the mean of exp(-y/uSfHs) along the ray's stretch inside the layer, over a thin veil
  float ya = clamp(C.y + n.y*t0, 0.0, 300.0), yb = clamp(C.y + n.y*t1, 0.0, 300.0);
  float xh = max(abs(yb - ya)/uSfHs, 1e-3);
  float thin = mix(uSfThin, 0.62, uSfWall*kOut);         // the departing wall has a body all the way up
  len *= thin + (1.0 - thin)*exp(-min(ya, yb)/uSfHs)*(1.0 - exp(-xh))/xh;
  float cz = mix(3.5, 8.0, kOut);                      // the nearest metres stay clear, without a step (more of them
  len -= cz*(1.0 - exp(-len/cz));                      // at the foot of the departing wall: birds there keep their darks)
  // gust walls: bands across the wind that march downwind every four seconds
  vec3 M = C + n*min(D, 34.0);
  float g = sfVN(vec2((dot(M.xz, W) - uSfTime*20.0)/80.0, dot(M.xz, X)/150.0 + 2.0));
  g = 0.6*g + 0.4*sfVN(vec2((dot(M.xz, W) - uSfTime*26.0)/23.0, dot(M.xz, X)/40.0));
  float dens = uSfDense*(0.42 + 1.75*g*g);
  // it is a GROUND blizzard: above a few degrees of elevation the veil is mostly open sky, with torn rags of it
  // lying in level layers and drifting round the horizon (read in direction space, so they never fan out as
  // streaks from the wind's vanishing point)
  float upK = smoothstep(0.03, 0.2, n.y)*(1.0 - kOut);
  vec2 dh = n.xz/max(length(n.xz), 1e-3);
  float gw = sfVN(dh*1.3 + vec2(n.y*2.0 + 3.0, uSfTime*0.02));
  float gn = 0.5*sfVN(vec2(dh.x*2.6 + 3.0 + uSfTime*0.03, n.y*7.5 + 1.2*gw)) + 0.5*sfVN(vec2(dh.y*2.6 + 11.0 - uSfTime*0.02, n.y*7.5 + 5.0 + 1.2*gw));
  gn = mix(gn, 0.8, smoothstep(0.55, 0.85, n.y));
  dens *= mix(1.0, mix(0.5, 0.05, smoothstep(0.33, 0.5, gn)), upK);
  // seen from outside, the face of the snow layer: billows and hanging fringes
  // (read on the nominal face, which is smooth across the screen, and let go with the same footprint)
  float f33 = 1.0 - smoothstep(4.0, 13.0, fp), f10 = 1.0 - smoothstep(1.2, 4.0, fp);
  float bil = 0.6*mix(0.5, sfVR(vec2(latF*0.03, yF*0.045 - uSfTime*0.02)), f33) + 0.4*mix(0.5, sfVR(vec2(latF*0.1 + 3.0, yF*0.12 - uSfTime*0.05)), f10);
  float bilU = 0.6*mix(0.5, sfVR(vec2(latF*0.03, (yF + 5.0)*0.045 - uSfTime*0.02)), f33) + 0.4*mix(0.5, sfVR(vec2(latF*0.1 + 3.0, (yF + 5.0)*0.12 - uSfTime*0.05)), f10);
  float frg = mix(0.5, sfVR(vec2(latF*0.21 + 2.2*bil + yF*0.07, yF*0.045 + 5.0)), f3);   // torn wisps that lean and break, not upright bars
  float lodE = 1.0 - smoothstep(120.0, 320.0, tIn);
  bil = mix(0.5, bil, lodE); bilU = mix(0.5, bilU, lodE); frg = mix(0.5, frg, lodE);
  dens *= mix(1.0, clamp((0.2 + 1.5*bil)*(0.76 + 0.48*frg), 0.24, 1.7)*mix(1.0, 0.4, smoothstep(50.0, 280.0, tIn)), kOut);   // folds thicken and thin the veil (nothing punches a hole); its far reach is haze
  // the departing wall is dense right up to its torn top (its foot stays a feathered drift)
  dens *= mix(1.0, mix(1.5, 4.5, smoothstep(3.0, 14.0, C.y + n.y*tIn))*mix(1.6, 1.0, smoothstep(60.0, 140.0, tIn)), uSfWall*kOut);   // (and a firm body where it stands close: nothing shows through it)
  dens *= 1.0 - 0.94*gzOut*smoothstep(15.0, 130.0, tIn)*(1.0 - smoothstep(0.1, 0.5, abs(nh)));   // (toward the face's own horizon the wall thins to nothing)
  float tS = dens*len, tH = uSfHaze*hz*D;
  vec2 dx = n.xz/max(length(n.xz), 1e-3);
  float glow = 0.5 + 0.5*dot(dx, uSfKey);
  float up = n.y;
  float crown = smoothstep(10.0, 56.0, yF);
  // inside, the murk is a slate band on the horizon, darker than the snow under it and paler than the sky over it,
  // palest on the key side; from outside the wall is slate, and the upper edge of every fold catches the pearl light
  float kIn = 0.03 + 0.58*glow*glow - 0.8*(g - 0.45) - 0.7*max(up, 0.0)*(1.0 - 0.5*glow) + 0.3*(gn - 0.5)*upK;
  float lit = smoothstep(-0.02, 0.14, bil - bilU)*lodE;
  float kFace = 0.15 + 0.14*glow*glow + 0.46*lit*(0.55 + 0.45*crown) + 0.24*crown*bil + 0.14*(frg - 0.5) + 0.22*smoothstep(60.0, 380.0, tIn);
  // the wall's torn top catches the pearl light: a pale crest along it, above a slate body
  float yIn = C.y + n.y*tIn;
  // (a narrow rim, bright only on the tongues that stand up and broken between them, fading along the wall: one even
  // band of it is a white ribbon drawn across the sky)
  float crB = smoothstep(0.3, 0.72, sfVN(vec2(latT*0.045 + 13.0, 3.0 + uSfTime*0.04)))*(0.55 + 0.45*sfVN(vec2(latT*0.19 + 5.0, 9.0 - uSfTime*0.07)));
  float crest = (1.0 - smoothstep(1.5, 9.0, top - yIn))*smoothstep(-3.0, 1.0, top - yIn)*uSfWall*kOut*(1.0 - 0.9*smoothstep(110.0, 260.0, tIn))*(0.38 + 0.62*crB);
  kFace = mix(kFace, kFace*0.3, uSfWall*(1.0 - crest)) + 0.62*crest*(0.7 + 0.6*bil);
  float k = clamp(mix(kIn, kFace, kOut), 0.1*kOut, 1.0 + 0.1*kOut*crown);
  // act one: a darker gust wall stands above the horizon, so the upper frame is never one flat grey
  k -= (1.0 - kOut)*0.3*smoothstep(0.5, 0.75, g)*smoothstep(0.02, 0.2, up)*(1.0 - smoothstep(0.35, 0.7, up));
  vec3 sc = mix(uSfColA, uSfColB, max(k, 0.0));
  // while it blows, the murk glows toward the notch: the light of the ring and the pearl bank soaking through
  float gd = max(dot(n, uSfGlowDir), 0.0); float g4 = gd*gd; g4 *= g4; float g16 = g4*g4; g16 *= g16;
  sc += uSfGlow*(0.7*g16 + 0.3*g4)*(1.0 - kOut);
  sc += vec3(0.25, 0.21, 0.25)*crest + vec3(0.15, 0.12, 0.14)*crest*crest*crest;
  // the low moon soaks through the drift: a warm bloom in the murk round it
  float md = max(dot(n, uMoonDir), 0.0); float m4 = md*md; m4 *= m4; float m16 = m4*m4; m16 *= m16; float m64 = m16*m16; m64 *= m64;
  sc += uMoonCol*(0.5*m64 + 0.2*m16 + 0.02*m4);
  vec3 col = (sc*tS + uSfHazeCol*tH)/max(tS + tH, 1e-5);
  return vec4(col, 1.0 - exp(-(tS + tH)));
}
vec3 sfApply(vec3 col, vec3 P){ vec4 f = sfFogRay(cameraPosition, P, 1.0); return mix(col, f.rgb, f.a); }
`;

// ---------------------------------------------------------------- 3. shared light
const WL_GLSL = /* glsl */`
uniform vec3 uKeyDir, uKeyCol, uSkyCol, uGroundCol, uRimCol;
uniform float uSat;
vec3 wGrade(vec3 c){ float l = dot(c, vec3(0.2126, 0.7152, 0.0722)); return mix(l*vec3(0.97, 0.96, 1.09), c, uSat); }
`;
const WORLD_VERT = /* glsl */`
varying vec3 vWp, vN, vLp;
void main(){
  vec4 lp = vec4(position, 1.0); vec3 n = normal;
  #ifdef USE_INSTANCING
    lp = instanceMatrix*lp; n = mat3(instanceMatrix)*n;
  #endif
  vLp = position;
  vec4 wp = modelMatrix*lp; vWp = wp.xyz; vN = mat3(modelMatrix)*n;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

const GROUND_VERT = /* glsl */`
attribute float aRel;
varying vec3 vWp, vN, vLp; varying float vRel;
void main(){
  vLp = position; vRel = aRel;
  vec4 wp = modelMatrix*vec4(position, 1.0); vWp = wp.xyz; vN = mat3(modelMatrix)*normal;
  gl_Position = projectionMatrix*viewMatrix*wp;
}`;

// ---------------------------------------------------------------- 4. sky dome
const SKY_FRAG = /* glsl */`
uniform vec3 uZenith, uMid, uArch, uShadow, uBelt, uPearl, uPink, uMint, uBlue, uCone;
uniform vec2 uSun;
uniform float uTime, uStars, uVivid, uRibF, uRayF, uCoreK, uWave, uFlow, uSnake, uSat, uMoonK, uVeilK, uCreep, uRayT;
uniform vec3 uSnowC, uSkyCol, uGroundCol, uKeyCol;
uniform vec4 uLensA[LENS_N], uLensB[LENS_N], uLensC[LENS_N];
${SF_GLSL}
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  float y = max(d.y, 0.0);
  vec2 dx = d.xz/max(length(d.xz), 1e-3);
  float sunSide = 0.5 + 0.5*dot(dx, uSun);
  vec3 sky = mix(uMid, uZenith, smoothstep(0.06, 0.62, y));
  float anti = 1.0 - sunSide;
  float arch = exp(-y*5.5)*(0.25 + 0.75*sunSide*sunSide);
  sky = mix(sky, uArch, arch);
  sky = mix(sky, uShadow, exp(-y*10.0)*anti*0.85);
  // opposite the sun: a lilac-rose band above the slate Earth shadow, the first sky the snow uncovers
  float bz = (y - 0.2)/0.13;
  sky = mix(sky, uBelt, exp(-bz*bz)*anti*anti*0.55);
  sky += uArch*0.25*exp(-y*16.0)*sunSide;
  // a few faint stars
  vec2 sp = d.xz/(0.35 + y)*11.0; vec2 sc = floor(sp);
  float sh = sfHash(sc + 3.7);
  vec2 so = vec2(sfHash(sc + 11.1), sfHash(sc + 27.3))*0.6 + 0.2;
  float st = (1.0 - smoothstep(0.012, 0.05, length(fract(sp) - so)))*step(0.8, sh)*smoothstep(0.2, 0.55, y);     // points (as discs they were dust on the lens)
  sky += vec3(0.8, 0.82, 1.0)*st*uStars*1.5*(0.6 + 0.4*sin(uTime*2.0 + sh*90.0));
  // the moon, low over the plain in the north-north-west: old gold, a soft limb, a warm halo
  float mdt = dot(d, uMoonDir);
  float mdisc = smoothstep(0.99950, 0.99972, mdt);
  float mlimb = clamp((mdt - 0.99950)/0.0005, 0.0, 1.0);
  vec3 mcol = vec3(1.5, 1.08, 0.62)*(0.72 + 0.28*mlimb)*(0.86 + 0.2*sfVN(d.xy*260.0 + d.z*190.0));
  float mh1 = max(mdt, 0.0); float mh2 = mh1*mh1; mh2 *= mh2; mh2 *= mh2; mh2 *= mh2; float mh3 = mh2*mh2; mh3 *= mh3; mh3 *= mh3; mh3 *= mh3;
  sky += uMoonCol*(1.1*mh3*mh3 + 0.5*mh3 + 0.07*mh2)*uMoonK;
  sky = mix(sky, mcol, mdisc*uMoonK);
  float cone = 1.0 - smoothstep(0.93, 0.985, dot(d, uCone));
  // a thin pearl veil joins the lenses into one bank on the sun side
  vec2 vp = d.xz/(0.3 + y);
  vec2 vq = vec2(dot(vp, vec2(-uSun.y, uSun.x)), dot(vp, uSun));
  float vw = sfVN(vec2(vq.x*0.9 + 3.0, vq.y*1.3));
  float vn = sfVN(vec2(vq.x*1.3 + 2.0*vw, vq.y*3.4 + uTime*0.008)) *(0.55 + 0.45*sfVN(vec2(vq.x*4.0, vq.y*11.0 + 4.0)));
  float veil = smoothstep(0.14, 0.56, vn)*smoothstep(0.07, 0.2, y)*(1.0 - smoothstep(0.42, 0.7, y))*smoothstep(0.4, 0.88, sunSide)*cone;
  vec3 veilC = uPearl*0.5 + 0.3*uVivid*mix(uPink, uMint, smoothstep(0.3, 0.7, vw));
  veil *= 0.85 + 0.15*smoothstep(0.2, 0.8, sfVN(vec2((vq.x + 0.09*sfVN(vq*2.7 + 5.0))*17.0 + 5.0*vw, vq.y*3.0 + 9.0)));   // faint, irregular ribbing
  sky = mix(sky, veilC, veil*0.34*uVeilK);
  // nacreous sheets: lee-wave cloud lit from below the horizon, hanging like curtains. Each has a crisp, sinuous
  // hem (folded like cloth, never a closed outline) with the pearl core lying along it, and above the hem it is
  // combed into fine upright rays of unequal height; soft pastel zones (pink, mint, blue) lie in layers above the
  // hem and creep through it. Both ends fade out.
  for (int i = 0; i < LENS_N; i++) {
    vec3 c = uLensA[i].xyz; float cd = dot(d, c);
    if (cd > 0.25) {
      float sd = uLensA[i].w;
      float x = dot(d, uLensB[i].xyz)*uLensB[i].w/cd, yy = dot(d, uLensC[i].xyz)*uLensC[i].w/cd;
      if (abs(x) < 1.0 && abs(yy - 0.6) < 2.6) {
        float wn = sfVN(vec2(x*2.2 + sd*31.0, sd*17.0 + uTime*0.01));
        float hem = -0.55 + 0.22*sin(x*2.3 + sd*40.0) + 0.1*sin(x*6.1 + sd*17.0 + uTime*0.02)
                  + uWave*4.0*(0.6*sin(x*uRibF*0.16*(0.8 + 0.4*wn) + sd*13.0 + uTime*0.03) + 0.4*sin(x*uRibF*0.071 + sd*29.0)) + 0.3*(wn - 0.5);
        float hgt = yy - hem;                                   // height above the hem, in half-heights of the sheet
        if (hgt > 0.0) {
          float rf = uRayF/uLensB[i].w;
          float ray = 0.65*sfVN(vec2(x*rf + sd*57.0 + uRayT*0.22, sd*9.0)) + 0.35*sfVN(vec2(x*rf*0.27 + sd*21.0 - uRayT*0.07, 4.0));
          float amp = sfVN(vec2(x*1.6 + sd*11.0 - uTime*0.04, 2.0));      // bright and faint stretches along the sheet
          float rayH = 0.3*sfVN(vec2(x*rf + sd*57.0 + uRayT*0.22, sd*9.0)) + 0.7*sfVN(vec2(x*rf*0.27 + sd*21.0 - uRayT*0.07, 4.0));
          float reach = (0.36 + 0.2*rayH*rayH)*(0.5 + 0.86*amp);           // how high the sheet stands: a smooth, gently scalloped top (a lens of cloud; tall narrow ribs were a curtain of rays)
          float sw = smoothstep(0.30, 0.78, dot(normalize(c.xz + vec2(1e-4)), uSun));
          if (i < 3) sw = i == 0 ? 0.86 : 0.7;                // the bank the parting snow uncovers first
          float ends = 1.0 - smoothstep(0.5, 1.0, abs(x));
          // a small scrap (under seven degrees tall) and any sheet far from the sun has a soft lower edge: a crisp
          // hem under a faint body is only a white squiggle on the sky
          float small = i < 3 ? 0.0 : smoothstep(14.0, 20.0, uLensC[i].w);
          float hemW = mix(mix(0.4, 0.07, sw), 1.0, small);
          reach = mix(reach, 0.75 + 0.5*amp, small);             // (a scrap is one soft smudge: a thin bright hem on it is a squiggle)
          // above the ribs a second, soft edge closes the sheet: a lens with its bands lying along the hem
          float body = smoothstep(0.0, hemW, hgt)*exp(-1.1*hgt/max(reach, 0.05))*(1.0 - smoothstep(1.6*reach, 3.4*reach, hgt))*ends*ends*(0.3 + 0.7*smoothstep(0.15, 0.6, amp + 0.3*ray));
          // (a scrap is an oval, and its colour bands curve round its middle: level stripes in a square patch were a small flag)
          float rs = length(vec2(x*1.1, (hgt - 0.75)*0.8));
          body *= mix(1.0, 1.0 - smoothstep(0.35, 0.95, rs), small);
          float xb = mod(mix(hgt*1.9, rs*2.3, small) + uCreep + sd*3.0 + 0.35*(wn - 0.5), 3.0);
          vec3 wj = 0.5 + 0.5*cos(2.0944*(vec3(xb) - vec3(0.0, 1.0, 2.0))); wj *= wj;
          vec3 hue = (uPink*wj.x + uMint*wj.y + uBlue*wj.z)/max(wj.x + wj.y + wj.z, 1e-3);
          float kc = (1.0 - smoothstep(0.02, 0.38, hgt))*smoothstep(0.2, 0.7, amp)*sw*sw*(1.0 - small);
          vec3 col = mix(mix(uPearl*0.7, hue*0.96, 0.88), uPearl*mix(0.8, uCoreK, kc), kc*0.85);
          col *= 0.87 + 0.17*smoothstep(0.25, 0.75, ray);                  // the ribs: fine and shallow
          float lum = dot(col, vec3(0.3, 0.55, 0.15));
          col = mix(vec3(lum)*vec3(0.56, 0.54, 0.68)*0.78, mix(vec3(lum), col, uVivid), sw);
          col = min(col, vec3(mix(0.9, 2.0, smoothstep(0.1, 0.2, d.y))));    // nothing low on the horizon burns out
          float a = body*mix(0.36, 0.94, sw)*(1.0 - 0.45*small)*cone*smoothstep(0.03, 0.12, d.y)*(1.0 - smoothstep(0.66, 0.82, d.y));
          sky = mix(sky, col, a);
          sky += uPearl*0.05*sw*kc*body*cone;                 // the core's own glow
        }
      }
    }
  }
  sky = mix(uSfHazeCol, sky, smoothstep(-0.03, 0.02, d.y));
  vec3 Pf = cameraPosition + d*900.0;
  // below the horizon: a stand-in for the ice, only ever seen when the eye of the previous world's portal sits
  // lower than the ice itself (the entry is 1.2 m up), where the real ground cannot be drawn
  if (d.y < -0.002) {
    float hC = max(cameraPosition.y, 1.2);
    float tg = min(hC/(-d.y), 900.0);
    vec2 gp = cameraPosition.xz + d.xz*tg;
    vec2 ge = vec2((gp.y + 52.0)/34.0, (gp.x - 14.5)/2.6);
    float gi = smoothstep(0.0, 0.15, 1.0 - dot(ge, ge));
    vec2 gq = vec2(dot(gp, vec2(-0.8660254, 0.5)), dot(gp, vec2(0.5, 0.8660254)));
    float gy = gq.y - uFlow;
    float gs = sfVN(vec2(gq.x*0.42 + 1.9*sfVN(vec2(gy*0.035, gq.x*0.07)), gy*0.03));
    float gb = smoothstep(mix(0.4, 0.6, gi), mix(0.62, 0.74, gi), gs)*uSnake;
    vec3 snow = uSnowC*(uSkyCol*0.85 + uGroundCol*0.25 + uKeyCol*0.6);
    vec3 gcol = mix(snow*(0.8 + 0.25*sfVN(gq*vec2(0.6, 0.16))), vec3(0.012, 0.02, 0.04) + snow*0.08, gi);
    gcol = mix(gcol, snow*1.2, gb*mix(0.3, 0.9, gi));
    float gl = dot(gcol, vec3(0.2126, 0.7152, 0.0722));
    gcol = mix(gl*vec3(0.97, 0.96, 1.09), gcol, uSat);
    sky = mix(sky, gcol, 1.0 - smoothstep(-0.012, -0.002, d.y));
    Pf = cameraPosition + d*tg;
  }
  vec4 f = sfFogRay(cameraPosition, Pf, 0.0);
  gl_FragColor = vec4(mix(sky, f.rgb, f.a), 1.0);
}`;

function makeSkyDome(rng, mood, FOGU, time, ground) {
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const deep = mood.hour === 'deep';
  // lens list: [bearing, elevation, width, height] in degrees. [0] is the lens the parting snow uncovers first,
  // low in the upwind sky where the camera looks at 21 s; the rest stack on the sun side either side of the exit.
  const lenses = [[150 + rng.range(-2, 2), 35.5, 46, 9.5], [122, 31, 30, 7], [176, 31.5, 26, 6]];
  if (mood.cloud === 'sheet') {
    lenses.push([36 + rng.range(-4, 4), 23, 64, 18], [104, 18, 34, 7], [-10, 15, 28, 6], [96, 42, 30, 6]);
  } else if (mood.cloud === 'scales') {
    // fish skin: three shingled rows of four scales, each a small sheet with its own crisp rim and comb of rays
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
      lenses.push([-8 + c * 37 + (r % 2) * 18 + rng.range(-4, 4), 31 - r * 8.6 + rng.range(-1.2, 1.2), rng.range(36, 46), rng.range(8.5, 11)]);
    }
  } else {
    // one bank with a hierarchy: a great sheet, two middling ones, and scraps trailing off
    lenses.push([37, 15, 70, 12.5], [50, 25.5, 40, 8.5], [108, 19, 40, 9], [22, 32, 21, 5.5], [117, 28.5, 20, 5], [97, 36, 18, 4.5], [-18, 16, 22, 5]);
    for (let i = 3; i < lenses.length; i++) { const l = lenses[i]; l[0] += rng.range(-3, 3); l[1] += rng.range(-1.5, 1.5); l[2] *= rng.range(0.9, 1.12); }
  }
  const N = lenses.length, A = [], B = [], Cc = [];
  for (const [bz, el, w, h] of lenses) {
    const b = bearingXZ(bz), ce = Math.cos(el * DEG);
    const c = new THREE.Vector3(b[0] * ce, Math.sin(el * DEG), b[1] * ce);
    const tilt = rng.range(-0.12, 0.12);
    const a = new THREE.Vector3(Math.cos(bz * DEG), 0, Math.sin(bz * DEG)).applyAxisAngle(c, tilt).normalize();
    const up = new THREE.Vector3().crossVectors(a, c).normalize();
    A.push(new THREE.Vector4(c.x, c.y, c.z, rng()));
    B.push(new THREE.Vector4(a.x, a.y, a.z, 1 / Math.tan(w * 0.5 * DEG)));
    Cc.push(new THREE.Vector4(up.x, up.y, up.z, 1 / Math.tan(h * 0.5 * DEG)));
  }
  const exit = new THREE.Vector3(51, 35, -21).normalize();
  const sun = bearingXZ(50);
  const uniforms = Object.assign({
    uZenith: { value: deep ? C('#2A2158') : C('#2B2250') }, uMid: { value: deep ? C('#35285F') : C('#4B3A7A') },
    uArch: { value: deep ? C('#6E6688') : C('#9C94B4') }, uShadow: { value: deep ? C('#262A48') : C('#363A62') },
    uBelt: { value: deep ? C('#6A4E86') : C('#9478A8') },
    uPearl: { value: C('#F4ECF6') }, uPink: { value: C(PALETTE[4]) }, uMint: { value: C(PALETTE[5]) }, uBlue: { value: C(PALETTE[6]) },
    uCone: { value: exit }, uSun: { value: new THREE.Vector2(sun[0], sun[1]) }, uTime: time,
    uStars: { value: deep ? 1.0 : 0.5 }, uVivid: { value: deep ? 1.0 : 0.84 }, uRibF: { value: mood.cloud === 'scales' ? 26 : mood.cloud === 'sheet' ? 80 : 46 }, uRayF: { value: 64 },
    uCoreK: { value: deep ? 1.3 : 1.4 }, uWave: { value: mood.cloud === 'sheet' ? 0.05 : 0.03 }, uMoonK: { value: 1 }, uVeilK: { value: 1 }, uCreep: { value: 0 }, uRayT: { value: 0 },
    uLensA: { value: A }, uLensB: { value: B }, uLensC: { value: Cc },
  }, ground, FOGU);
  const mat = new THREE.ShaderMaterial({
    uniforms, defines: { LENS_N: N }, side: THREE.BackSide, depthWrite: false, depthTest: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix*viewMatrix*vec4(cameraPosition + position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: SKY_FRAG,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1000, 40, 20), mat);
  mesh.renderOrder = -1; mesh.frustumCulled = false; mesh.name = 'sky-dome';
  return { object: mesh, uniforms };
}

// ---------------------------------------------------------------- 5. ground: fast ice, sastrugi, panes, snakes, stain
const NP = 14;
const GROUND_FRAG = /* glsl */`
uniform vec4 uPaneA[NP], uPaneB[NP];
uniform vec3 uH, uSnow, uStainCol, uShadowCol, uCliff;
uniform vec2 uWind, uCliffV;
uniform float uFlow, uCalm, uSnake, uTime;
${WL_GLSL}
${SF_GLSL}
${STAIN_GLSL}
varying vec3 vWp, vN, vLp; varying float vRel;
// sastrugi in wind coordinates (q.x across the wind, q.y downwind), 0..1: wind-carved ridges along the wind (the
// crest is where the lane noise crosses 0.5). Along the wind every ridge is a string of spindles: each starts with
// a rounded nose on its upwind end and narrows to a point over seven metres downwind (thr is the lane level the snow
// must exceed; where it is high the ridge is thin and low, and at the top it is gone). The cross-section is a
// drift's: a long soft ramp from the foot that steepens to a rounded crest (never a prism with two flat flanks), and
// the crest is notched and broken along its length, so no ridge is a ribbon of one height.
// lf.x = meander in metres, lf.y = how tall the field stands here (both slow, taken once per pixel). gCrest is 1 on
// the crest line. makeGround's sasJS is the same arithmetic: the ribbon is displaced by the field this shades.
float gCrest, gPeak, gS0;
float gSas(vec2 q, vec2 lf){
  float qx = q.x + lf.x;
  float a = sfVN(vec2(qx*0.46, q.y*0.065 + 3.0));
  float s0 = 2.0*a - 1.0;
  gS0 = s0;                                           // signed: 0 on the crest line (main() turns it into metres from that line)
  float r = 1.3 - sqrt(s0*s0 + 0.09);                 // the crest is rounded over a forearm's length: a drift, not a knife
  gCrest = r;
  float s = fract(q.y*0.105 + 2.6*sfVN(vec2(qx*0.37 + 9.0, q.y*0.016)));
  float tri = s < 0.24 ? 1.0 - s/0.24 : (s - 0.24)/0.76;
  float thr = 0.46 + 0.68*tri*tri*(3.0 - 2.0*tri);
  float h = clamp((r - thr)/0.64, 0.0, 1.0);
  gPeak = clamp((1.0 - thr)/0.64, 0.0, 1.0)*lf.y;        // how tall this ridge's crest stands here
  h *= 0.58 + 0.42*smoothstep(0.22, 0.7, sfVN(vec2(qx*0.8 + 4.0, q.y*0.47)));
  return h*(h + 0.08)/(h + 0.3)*1.2*lf.y;             // a soft foot that steepens up the ramp
}
// the moon's glints, in the same wind coordinates: long cells laid along the wind (f = cells per metre across and
// along it), every column slipped along the wind by its own amount and the whole lattice warped, so no two crests
// break at the same place. Nine cells in ten are lit (a spark shows only where a crest crosses it), and a lit cell holds ONE spark 16 to 50 cm long, lying
// anywhere along it and dying away toward the cell's sides. Returns x: the squared distance along the crest from the spark's middle, in half-lengths (main()
// adds the distance across the crest: a spark is a spindle with soft ends, never a dash or a round bead), y: lit, and
// flashing as the lens moves, z: its brightness, a cubed hash (many faint, few bright).
vec3 gSpark(vec2 q, vec2 f, float seed, float px){
  float cx = q.x*f.x + 1.3*sfVN(q*vec2(0.9, 0.35) + seed);
  float cl = floor(cx);
  float cy = q.y*f.y + 7.0*sfHash(vec2(cl, seed)) + 0.8*sfVN(q*vec2(0.7, 0.4) + seed + 27.0);
  vec2 bi = vec2(cl, floor(cy));
  float bh = sfHash(bi + seed);
  float l0 = fract(bh*7.3);
  float len = min((0.16 + 0.34*l0*l0)*f.y, 0.9);                          // the spark's length, in cells (16 to 50 cm: seen along its crest a shorter one is a round bead)
  float ctr = mix(0.5*len + 0.03, 0.97 - 0.5*len, sfHash(bi + seed + 3.9));
  float t = (fract(cy) - ctr)/(0.5*len + px*f.y);
  float b0 = fract(bh*13.1);
  float tw = 0.5 + 0.5*sin(bh*90.0 + dot(cameraPosition.xz, vec2(1.3, 1.9))*(1.0 + 2.0*b0) + uTime*(1.0 + b0));
  // (across the wind the spark has a width of its own, three fifths of its length, about a line set anywhere across its cell:
  // where a crest lies flat a spark would otherwise fill its cell and show as a hard-cornered square or a round disc. x
  // carries that too, so every spark is a closed sliver; a crest that only grazes it lights a faint one)
  float hw = min(max(0.3*len/f.y, 0.05)*f.x, 0.48);
  float xs = (fract(cx) - mix(hw, 1.0 - hw, sfHash(bi + seed + 11.3)))/hw;
  return vec3(t*t + xs*xs, step(0.1, bh)*(0.6 + 0.4*tw*tw)*(0.55 + 0.45*b0), b0*b0*b0);
}
void main(){
  vec2 p = vWp.xz;
  float px = max(fwidth(p.x), fwidth(p.y));
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-4, 0.0));
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec2 W = uWind, X = vec2(-W.y, W.x);
  vec2 q = vec2(dot(p, X), dot(p, W));
  float fine = 1.0 - smoothstep(0.04, 0.4, px), mid = 1.0 - smoothstep(0.12, 1.3, px);
  // bare ice panes: listed ellipses near the approach, noise panes far out on the plain
  float ice = -1.0;
  for (int i = 0; i < NP; i++) {
    vec2 d = p - uPaneA[i].xy;
    vec2 e = vec2(d.x*uPaneA[i].z + d.y*uPaneA[i].w, -d.x*uPaneA[i].w + d.y*uPaneA[i].z)/uPaneB[i].xy;
    ice = max(ice, 1.0 - dot(e, e));
  }
  float edgeN = (sfVN(q*vec2(0.9, 0.25)) - 0.5)*0.5 + (sfVN(q*vec2(3.1, 0.8) + 4.0) - 0.5)*0.2*fine;
  float iceM = smoothstep(0.0, 0.05 + px*0.14, ice + edgeN - 0.12);
  float hudD = length(p - uH.xz);
  float farP = sfVN(q*vec2(0.036, 0.011) + 5.0) + 0.25*(sfVN(q*vec2(0.16, 0.05)) - 0.5);
  float farOK = max(smoothstep(24.0, 34.0, abs(p.x)), (1.0 - smoothstep(-190.0, -160.0, p.y)))*smoothstep(62.0, 80.0, hudD);
  // far panes: their edge widens with the pixel and they dissolve before they can alias at a grazing angle
  iceM = max(iceM, smoothstep(0.66, 0.7 + px*0.035, farP)*farOK*(1.0 - smoothstep(2.5, 7.0, px)));
  iceM *= 1.0 - smoothstep(0.03, 0.1, vLp.y - 0.02);
  // sastrugi: low ridges along the wind, lit from the key side
  vec3 st = ecStain(p - uH.xz, px);
  // the relief is shaded from the field itself, tapped a pixel apart (wider with distance, so it cannot alias):
  // a lit flank on the key side of every crest, an indigo lee on the other, and the crest a thin pale line
  vec2 fq = vec2(fwidth(q.x), fwidth(q.y));
  vec2 lf = vec2(2.4*(sfVN(vec2(q.x*0.13 + 5.0, q.y*0.028)) - 0.5) + 0.8*(sfVN(vec2(q.x*0.5 + 2.0, q.y*0.11)) - 0.5),
                 0.45 + 0.55*smoothstep(0.26, 0.66, sfVN(q*vec2(0.07, 0.03) + 17.0)));
  vec2 eq = vec2(max(0.05, fq.x*0.75), max(0.07, fq.y*0.75));
  float h0 = gSas(q, lf); float crestR = gCrest, peak = gPeak, sA = gS0;
  float hx = gSas(q + vec2(eq.x, 0.0), lf); float sB = gS0;
  float hy = gSas(q + vec2(0.0, eq.y), lf); float sC = gS0;
  // metres from the crest line: the lane noise over its own slope, so the line keeps one width and a flat stretch of
  // the noise near 0.5 (a plateau, not a crest) is never taken for one
  float crestD = abs(sA)/max(length(vec2(sB - sA, sC - sA)/eq), 0.25);
  float relF = (1.0 - smoothstep(0.9, 2.8, fq.x))*(1.0 - iceM)*(1.0 - 0.8*st.x)*(1.0 - st.z)*vRel;
  // a ridge's thin tail and the last hand's height of any foot are not drawn: they would only be hairlines on the snow
  relF *= mix(smoothstep(0.02, 0.2, max(h0, max(hx, hy))), 1.0, uCalm);
  vec2 gq = vec2(hx - h0, (hy - h0)*0.45)/eq*0.56;       // (a ridge's blunt nose is shaded gently: steeply, it stands up as a dark streak)
  vec2 gpw = X*gq.x + W*gq.y;
  vec3 Ns = normalize(vec3(-gpw.x, 1.0, -gpw.y));
  // (seen from the air under the pearl light the same ridges are drawn more quietly)
  // and while it blows, gently: a soft gradient up each ramp, quieter still within a few metres of the lens)
  float dCam = length(cameraPosition - vWp);
  float nearK = 1.0 - smoothstep(5.0, 16.0, dCam);
  float real = clamp((dot(Ns, uKeyDir) - uKeyDir.y)*mix(1.8, 2.4, uCalm), -1.0, 1.0)*relF*mix(1.0, 0.4, uCalm);
  float fine2 = 1.0 - smoothstep(0.015, 0.14, px);
  // AT ARM'S LENGTH THE SNOW IS MATTE: no painted spindles or ripples (they ran along the wind, and seen at a grazing
  // angle from 1.2 m they were drawn out into a fan of pleats and long glossy smears). What stands up from the snow
  // there is modelled: the ribbon's drifts and the knife-crested sastrugi of makeSastrugi. The surface itself carries
  // only a fine wind crust, the same in every direction; files of footprints where birds have walked in up the wind
  float crust = (sfVN(p*5.3 + 9.0) - 0.5)*0.6 + (sfVN(p*13.0 + 3.0) - 0.5)*0.4;
  float tu = q.x/6.5 + 0.35*sfVN(vec2(q.y*0.06, 3.0)); float tc = floor(tu), tx = (fract(tu) - 0.5)*6.5;
  float lr = step(0.5, fract(q.y*1.1 + tc*0.37));
  vec2 fd = vec2(tx - (lr - 0.5)*0.26, (fract(q.y*2.2 + tc*0.74) - 0.5)/2.2*0.62);
  float fprint = (1.0 - smoothstep(0.05, 0.085 + px, length(fd)))*step(0.5, sfHash(vec2(tc, 9.0)))*(1.0 - smoothstep(0.02, 0.1, px));
  float drift = sfVN(vec2(q.x*0.2, q.y*0.025)) - 0.5;
  vec3 alb = uSnow*(0.84 + 0.14*sfVN(p*0.11 + 4.0) + 0.2*drift + 0.1*(h0 - 0.3)*relF);
  alb *= 1.0 - 0.14*relF*(1.0 - smoothstep(0.0, 0.3, h0));                 // the troughs between ridges hold less light
  alb *= 1.0 + 0.09*crust*fine2;
  alb *= 1.0 - 0.42*fprint*(1.0 - iceM);
  alb = mix(alb, uStainCol*(0.8 + 0.4*sfVN(p*2.3)), st.x*0.85);
  alb = mix(alb, uSnow*1.08, st.y*0.75);
  alb = mix(alb, uShadowCol*0.5, st.z*0.9);
  // the cliff foot: tide crack and contact shade
  float cv = p.y - uCliff.z;
  float cd = (uCliff.x - uCliff.y*cv*cv) - p.x;
  float along = smoothstep(uCliffV.x, uCliffV.x + 40.0, cv)*(1.0 - smoothstep(uCliffV.y - 60.0, uCliffV.y - 10.0, cv));
  float crack = (1.0 - smoothstep(0.25, 0.7 + px, abs(cd - 13.0 - 5.0*(sfVN(vec2(p.y*0.07, 2.0)) - 0.5))))*along;
  float foot = (1.0 - smoothstep(0.0, 22.0, cd))*along;
  alb = mix(alb, vec3(0.012, 0.03, 0.05), crack*0.9);
  float key = max(0.3 + uKeyDir.y*0.9 + mix(max(real, 0.0)*0.62 + min(real, 0.0)*0.85, real, uCalm), 0.0);
  vec3 col = alb*(uSkyCol*0.78 + uGroundCol*0.25 + uKeyCol*key)*(1.0 - 0.45*foot);
  col += uRimCol*max(real*0.6, 0.0)*0.11*(1.0 - st.x)*(1.0 - st.z);
  col += uRimCol*smoothstep(0.12, 0.5, real)*0.1;                       // the crest's lit flank
  float wl1 = mix(0.07, 0.035, nearK) + fq.x*1.3;
  float cl1 = (1.0 - smoothstep(wl1*0.4, wl1, crestD))*smoothstep(0.08, 0.3, h0)*relF;
  col += uRimCol*cl1*mix(0.16, 0.5, nearK)*mix(0.85, 1.0, uCalm);   // the crest line: a sharp wind-cut edge at arm's length
  // the side away from the key: a soft violet shade while it blows (snow, not plastic), deeper under the pearl light
  // (a thin low tail casts none: its lee would only be a dark crease drawn across the snow)
  // (and at arm's length only a ridge that stands a forearm high has one: there the lee of a low one is a crack)
  float leeK = smoothstep(0.02, mix(mix(0.7, 0.4, nearK), 0.24, uCalm), -real)*mix(smoothstep(mix(0.1, 0.16, nearK), mix(0.34, 0.4, nearK), peak), 1.0, uCalm);
  col *= mix(vec3(1.0), mix(mix(vec3(0.62, 0.64, 0.9), vec3(0.5, 0.52, 0.86), nearK), vec3(0.36, 0.39, 0.62), uCalm), leeK*mix(0.5, 1.0, smoothstep(2.0, 6.0, dCam)));   // (paler within a few metres of the lens: a deep lee there is a dark slit)
  // the low moon: warm light on every flank that looks at it, a path of gold glitter across the snow toward it,
  // and single crystals that flash and go out as the lens moves
  float snowK = (1.0 - st.x)*(1.0 - st.z);
  vec2 mdir = uMoonDir.xz/max(length(uMoonDir.xz), 1e-3), vdir = -V.xz/max(length(V.xz), 1e-3);
  float lane = smoothstep(0.94, 0.999, dot(mdir, vdir));                    // the stripe of snow between the lens and the moon
  float laneW = smoothstep(0.78, 0.99, dot(mdir, vdir));                    // and the broad path round it
  vec3 Nm = Ns;
  float mdif = max(dot(Nm, uMoonDir), 0.0);
  // every flank that looks at the moon is gold
  col += alb*uMoonCol*(mdif*1.5 + mix(0.9, 1.7, nearK)*smoothstep(0.1, 0.55, dot(Ns, uMoonDir))*relF);
  vec3 Hm = normalize(uMoonDir + V);
  float mh = max(dot(Nm, Hm), 0.0); float ms = mh*mh; ms *= ms; ms *= ms; ms *= ms; float ms2 = ms*ms; ms2 *= ms2;
  // (single crystals: read on a turned lattice that is warped by most of a cell, each one anywhere in its cell, so they
  // are a random dusting; on the plain lattice they lay in straight, evenly spaced rows like a halftone screen)
  vec2 gwp = p + 0.05*vec2(sfVN(p*2.9 + 5.0), sfVN(p*2.9 + 31.0)) + 0.02*vec2(sfVN(p*9.7 + 11.0), sfVN(p*9.7 + 57.0));
  vec2 gcl = mat2(0.8, -0.6, 0.6, 0.8)*gwp*23.0; vec2 gid = floor(gcl); float gh = sfHash(gid + 7.7);
  vec2 gjt = vec2(sfHash(gid + 1.3), sfHash(gid.yx + 5.9))*0.76 + 0.12;
  float gpt = (1.0 - smoothstep(0.0, 0.12 + px*4.0, length(fract(gcl) - gjt)))*(0.35 + 0.65*sfHash(gid + 23.1));
  float tw = 0.5 + 0.5*sin(gh*90.0 + dot(cameraPosition.xz, vec2(1.7, 2.3))*(2.0 + 3.0*gh) + uTime*1.3);
  float glint = gpt*step(0.76, gh)*tw*tw*(1.0 - smoothstep(0.012, 0.035, px));      // (gone before a cell is under three pixels: there the lit cells themselves were the dots, in rows)
  // THE MOON'S PATH is a loose scatter of unequal sparks on the crests (gSpark above): per ridge one bright glint and
  // two or three faint ones, no two the same distance apart, and most of the crest dark. Each is a spindle lying on
  // its crest line, the bright ones longer and fatter. The scatter thins out in patches (long
  // dark gaps); only far off, where a spark is under a pixel, does a crest keep a thin thread of gold
  float bfade = 1.0 - smoothstep(0.025, 0.11, px);
  vec3 spA = gSpark(q, vec2(3.1, 1.15), 13.7, px), spB = gSpark(q, vec2(4.7, 2.3), 61.3, px);
  float kcA = smoothstep(0.08, 0.3, h0)*relF*(0.55 + 0.45*nearK);
  float dA = crestD/(wl1*0.9); dA *= dA;
  float wA = 0.55 + 0.7*spA.z, wB = 0.55 + 0.7*spB.z;                    // a brighter spark is a fatter one (always a sliver: several times longer than wide)
  float cvA = (1.0 - smoothstep(0.08, 1.0, spA.x + dA/(wA*wA)))*kcA*spA.y;
  float cvB = (1.0 - smoothstep(0.08, 1.0, spB.x + dA/(wB*wB)))*kcA*spB.y*0.85;
  float pathK = (0.2*laneW + 0.8*laneW*laneW)*smoothstep(0.2, 0.5, sfVN(q*vec2(1.3, 0.42) + 71.0))*bfade;
  float sparkCv = max(cvA, cvB)*pathK, sparkB = cvA > cvB ? spA.z : spB.z;
  float thread = 0.3*(1.0 + smoothstep(0.35, 0.7, sfVN(q*vec2(1.5, 0.9) + 51.0)))*smoothstep(3.0, 8.0, dCam)*(1.0 - bfade);
  float clG = (1.0 - smoothstep(wl1*0.6, wl1*2.6, crestD))*kcA;
  float crestGl = clG*thread*(0.2*laneW + 0.8*laneW*laneW);
  col += uMoonCol*snowK*(1.0 - iceM)*(ms*0.4 + ms2*0.8 + lane*(0.08 + 1.5*glint));
  col += uRimCol*glint*0.22*step(0.9, gh)*snowK*(1.0 - iceM);
  vec3 goldGl = uMoonCol*snowK*(1.0 - iceM)*crestGl*5.0;
  sparkCv *= snowK*(1.0 - iceM);
  // the moon-gold flank: every flank that looks at the moon, most of all in its path (a tint, laid on after the clamp
  // with the glints: added as light before it, a lit flank only clipped to white)
  float goldF = smoothstep(0.15, 0.36, dot(Ns, uMoonDir))*relF*mix(0.45, 1.0, nearK)*(0.55 + 0.45*laneW)*snowK*(1.0 - iceM)*(1.0 - 0.6*uCalm);
  // black-blue ice: dark body, cracks, a sheen of the sky on the key side
  float fr = 1.0 - clamp(V.y, 0.0, 1.0); fr = fr*fr; fr = fr*fr;
  vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
  float tk = clamp(dot(normalize(R + vec3(0.0, 1e-4, 0.0)), uKeyDir), 0.0, 1.0);
  vec3 refl = mix(uSkyCol*0.9, uKeyCol*0.75, tk*tk);
  vec2 c1 = vec2(dot(p, vec2(0.92, 0.39)), dot(p, vec2(-0.39, 0.92)));
  float l1 = abs(fract(c1.x*0.11 + 0.9*sfVN(c1*vec2(0.05, 0.16))) - 0.5)/0.11;
  float l2 = abs(fract(c1.y*0.07 + 1.1*sfVN(c1.yx*vec2(0.04, 0.13) + 9.0)) - 0.5)/0.07;
  float lw = 0.03 + px*1.2;
  float crk = ((1.0 - smoothstep(0.0, lw, l1))*0.7 + (1.0 - smoothstep(0.0, lw, l2))*0.5)*(1.0 - smoothstep(0.3, 1.5, px));
  float frost = smoothstep(0.55, 0.92, sfVN(vec2(q.x*1.3, q.y*0.16) + 13.0))*0.25;
  vec3 iceC = vec3(0.008, 0.014, 0.03)*(0.6 + 0.8*sfVN(p*0.05)) + (uSkyCol*0.25 + uKeyCol*0.12)*vec3(0.5, 0.75, 1.0)*0.08;
  iceC += refl*(0.03 + 0.26*fr);                       // polished: at a grazing angle it mirrors the sky
  iceC = mix(iceC, col*0.8, clamp(crk*0.55 + frost, 0.0, 0.85));
  col = mix(col, iceC, iceM);
  // snow snakes: sinuous streaks of drift pouring downwind over everything
  float qy = q.y - uFlow;
  float sn = sfVN(vec2(q.x*0.42 + 1.9*sfVN(vec2(qy*0.035, q.x*0.07)), qy*0.03));
  float body = smoothstep(mix(0.4, 0.6, iceM), mix(0.62, 0.74, iceM), sn);
  float fil = 0.3 + 0.7*sfVN(vec2(q.x*3.6 + 2.0*sfVN(vec2(qy*0.09, 5.0)) + 1.5*sfVN(vec2((q.y - uFlow*1.25)*0.33, q.x*0.6)), (q.y - uFlow*1.25)*0.42));
  fil = mix(fil, 0.62, 0.55*fine2);
  float fil2 = mix(1.0, min(1.7*sfVN(vec2(q.x*9.0 + 3.0*sfVN(vec2(q.x*1.3, (q.y - uFlow*1.4)*0.5)), (q.y - uFlow*1.4)*0.7)), 1.25), 0.75*fine);
  // (no fine grain racing under the lens: what is left there is drawn out along the wind)
  fil2 *= mix(1.0, 0.72 + 0.56*sfVN(vec2(q.x*14.0, (q.y - uFlow*1.4)*0.9)), fine2*smoothstep(0.004, 0.02, px));
  // on snow close to the lens the drift thins to a few long wisps, so the ridges and their light show through it
  float snake = body*fil*fil2*uSnake*mid*mix(1.0, 0.12, fine2*(1.0 - iceM));
  vec3 snowLit = uSnow*(uSkyCol*0.85 + uGroundCol*0.25 + uKeyCol*(0.45 + uKeyDir.y*0.9));
  col = mix(col, snowLit*1.25, clamp(snake*mix(0.2, 1.1, iceM), 0.0, 0.94));
  // spindrift smoking off the crests while it blows: pale torn plumes that hug each crest and stream along it,
  // feathering the line where the lit flank meets the shade
  // (at arm's length they are separate torn plumes with clear crest between them: a blanket there hides the edge)
  float smk = smoothstep(0.45, 0.95, crestR)*smoothstep(0.1, 0.45, h0)*relF*(1.0 - uCalm);
  float smn = sfVN(vec2(q.x*1.6 + 3.0, (q.y - uFlow*0.9)*0.22))*(0.4 + 0.9*sfVN(vec2(q.x*4.5, (q.y - uFlow*1.2)*0.6 + 7.0)));
  col = mix(col, snowLit*1.18, clamp(smk*smoothstep(mix(0.14, 0.3, nearK), mix(0.5, 0.56, nearK), smn)*0.75*mid, 0.0, 0.7));
  // (the glints are the one warm accent: laid on after the snow's clamp and its storm greying, so they stay gold)
  col = min(wGrade(col), vec3(0.72))*mix(vec3(1.0), vec3(1.12, 0.92, 0.66), clamp(goldF, 0.0, 1.0)*(1.0 - clamp(snake, 0.0, 1.0))) + goldGl*(1.0 - 0.8*clamp(snake, 0.0, 1.0));
  // the sparks are GOLD, not white: they take the snow's place (added to it as light they only burnt out to cream)
  col = mix(col, vec3(1.7, 0.98, 0.38)*(uMoonCol.r*3.4)*(0.8 + 1.4*sparkB), clamp(sparkCv*(1.0 - 0.8*clamp(snake, 0.0, 1.0)), 0.0, 1.0));
  gl_FragColor = vec4(sfApply(col, vWp), 1.0);
}`;

// sfHash / sfVN / gSas in JS, in single precision like the shader, so the ribbon's relief is the field its shader shades
const f32 = Math.fround, frc = (x) => f32(x - Math.floor(x));
function sfHashJS(x, y) {
  let px = frc(f32(x * f32(0.1031))), py = frc(f32(y * f32(0.1030)));
  const d = f32(f32(px * f32(py + f32(33.33))) + f32(py * f32(px + f32(33.33))));
  px = f32(px + d); py = f32(py + d);
  return frc(f32(f32(px + py) * py));
}
function sfVNJS(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
  const a = sfHashJS(ix, iy), b = sfHashJS(ix + 1, iy), c = sfHashJS(ix, iy + 1), d = sfHashJS(ix + 1, iy + 1);
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
}
function sasJS(qx0, qy) {
  const lfx = 2.4 * (sfVNJS(qx0 * 0.13 + 5, qy * 0.028) - 0.5) + 0.8 * (sfVNJS(qx0 * 0.5 + 2, qy * 0.11) - 0.5);
  const lfy = 0.45 + 0.55 * smoothstep(0.26, 0.66, sfVNJS(qx0 * 0.07 + 17, qy * 0.03 + 17));
  const qx = qx0 + lfx;
  const a = sfVNJS(qx * 0.46, qy * 0.065 + 3), s0 = 2 * a - 1, r = 1.3 - Math.sqrt(s0 * s0 + 0.09);
  const ph = qy * 0.105 + 2.6 * sfVNJS(qx * 0.37 + 9, qy * 0.016), sw = ph - Math.floor(ph);
  const tri = sw < 0.24 ? 1 - sw / 0.24 : (sw - 0.24) / 0.76, thr = 0.46 + 0.68 * tri * tri * (3 - 2 * tri);
  let h = clamp((r - thr) / 0.64, 0, 1);
  h *= 0.58 + 0.42 * smoothstep(0.22, 0.7, sfVNJS(qx * 0.8 + 4, qy * 0.47));
  return h * (h + 0.08) / (h + 0.3) * 1.2 * lfy;
}

function paneMaskJS(panes, x, z) {
  let m = -1;
  for (const p of panes) {
    const dx = x - p.x, dz = z - p.z, ex = (dx * p.c + dz * p.s) / (p.a + 1.6), ez = (-dx * p.s + dz * p.c) / (p.b + 1.6);
    m = Math.max(m, 1 - ex * ex - ez * ez);
  }
  return m;
}

// What BufferGeometry.computeVertexNormals() does for an indexed geometry (three r170): the same arithmetic in the same
// order on the same 32-bit arrays, so every normal comes out bit for bit the same, but done in slices with the page
// handed back in between (the library call is one uninterruptible step of 5 to 25 ms on these grids).
async function vertexNormalsInSlices(ctx, g) {
  const pos = g.getAttribute('position').array, ix = g.index.array, nrm = new Float32Array(pos.length);
  for (let i = 0; i < ix.length; i += 3) {
    if (i % 9000 === 0) await ctx.yield();
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2];
    const ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
    const x = cy * az - cz * ay, y = cz * ax - cx * az, z = cx * ay - cy * ax;
    const n0 = nrm[a] + x, n1 = nrm[a + 1] + y, n2 = nrm[a + 2] + z, n3 = nrm[b] + x, n4 = nrm[b + 1] + y, n5 = nrm[b + 2] + z, n6 = nrm[c] + x, n7 = nrm[c + 1] + y, n8 = nrm[c + 2] + z;
    nrm[a] = n0; nrm[a + 1] = n1; nrm[a + 2] = n2; nrm[b] = n3; nrm[b + 1] = n4; nrm[b + 2] = n5; nrm[c] = n6; nrm[c + 1] = n7; nrm[c + 2] = n8;
  }
  for (let o = 0; o < nrm.length; o += 3) {
    if (o % 18000 === 0) await ctx.yield();
    const x = nrm[o], y = nrm[o + 1], z = nrm[o + 2], k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1);
    nrm[o] = x * k; nrm[o + 1] = y * k; nrm[o + 2] = z * k;
  }
  const attr = new THREE.BufferAttribute(nrm, 3); attr.needsUpdate = true;
  g.setAttribute('normal', attr);
}

async function makeGround(ctx, rng, noise, path, U, FOGU, extra, flats) {
  // ice panes: [0] is the entry wedge, a long lens of black ice out to the right of the path; the rest are wind-polished lenses beside the approach
  // (none lies within eleven metres of the path: the snow under the lens is always lit, wind-packed snow, and a
  // pane is only ever seen as a dark polished sliver out on the plain)
  const panes = [{ x: 14.5, z: -52, a: 34, b: 2.6, ang: Math.atan2(-0.04, -1) }];
  const wa = Math.atan2(WIND[0], WIND[1]);
  let guard = 0;
  while (panes.length < NP && guard++ < 400) {
    const z = rng.range(-150, 12), x = rng.range(-38, 38), a = rng.range(6, 19), b = a * rng.range(0.2, 0.34);
    if (path.nearestXZ(x, z).dist < b + 11) continue;
    if (panes.some((p) => Math.hypot(p.x - x, p.z - z) < p.a * 0.6 + a + 2 && Math.abs(p.x - x) < p.b + b + 5)) continue;
    panes.push({ x, z, a, b, ang: wa + rng.range(-0.12, 0.12) });
  }
  while (panes.length < NP) panes.push({ x: 0, z: 5000, a: 1, b: 1, ang: 0 });
  for (const p of panes) { p.s = Math.sin(p.ang); p.c = Math.cos(p.ang); }
  // pane frame: e.x runs along the pane's long axis (direction (sin, cos) in xz)
  const paneA = panes.map((p) => new THREE.Vector4(p.x, p.z, p.s, p.c)), paneB = panes.map((p) => new THREE.Vector4(p.a, p.b, 0, 0));
  for (const p of panes) { const s = p.s, c = p.c; p.c = s; p.s = c; }   // JS mask uses the same frame as the shader

  let lastRel = 1;       // how much of the field's relief the last heightAt() kept (the ribbon carries it to the shader as aRel)
  const heightAt = (x, z) => {
    const qx = x * WPERP[0] + z * WPERP[1], qy = x * WIND[0] + z * WIND[1];
    // knife-crested spindles along the wind, blunt on their upwind end and tailing away downwind over eight metres:
    // the field GROUND_FRAG shades (gSas)
    let h = 0.56 * sasJS(qx, qy);
    h *= 1 - smoothstep(-0.25, 0.25, paneMaskJS(panes, x, z));
    h *= 1 - smoothstep(12, 16, Math.abs(x));
    h *= (1 - smoothstep(18, 25, z)) * smoothstep(-166, -148, z);
    const near = path.nearestXZ(x, z);
    // under the path the whole field stands lower (scaled, never clipped: a clipped ridge is a flat-topped ribbon)
    // and beside it, from two metres out, the drifts stand half as tall again (to 0.8 m): at arm's length they are
    // ridges with a silhouette, not marks on a floor
    const aside = smoothstep(2.0, 5.0, near.dist), amp = 1 + 0.5 * aside;
    const cap = near.y - 0.68 - 0.1 * (1 - smoothstep(1.5, 5, near.dist)) + 0.42 * aside;
    const sc = clamp(cap / (0.56 * amp), 0, 1) * amp;
    h = Math.max(0, h * sc);
    let fk = Math.min(sc, 1.25);
    for (const f of flats) {       // pressed flat where birds stand
      const dx = f[0] - x, dz = f[1] - z; if (dx > 2.4 || dx < -2.4 || dz > 2.4 || dz < -2.4) continue;
      const k = smoothstep(0.9, 2.4, Math.sqrt(dx * dx + dz * dz));
      if (h > 0.01) h *= k;
      fk *= k;
    }
    lastRel = fk;
    return h;
  };
  // The ribbon's lattice is laid along the wind: its rows are 0.94 m apart and its columns are spaced so that one row
  // upwind is exactly two columns across, and every cell is a parallelogram with two sides along the wind. A crest
  // that runs with the wind then lies along mesh edges and stays a clean line (on a square grid it climbs in steps).
  const nz = 204, x0 = -16, z0 = 25, z1 = -167, dzr = (z0 - z1) / nz, dxr = dzr * (WIND[0] / WIND[1]) / 2, nx = Math.ceil(32 / dxr) + 2;
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3), rel = new Float32Array((nx + 1) * (nz + 1)), idx = [];
  for (let j = 0; j <= nz; j++) {
    await ctx.yield();
    for (let i = 0; i <= nx; i++) {
      const x = x0 + i * dxr, z = z0 - j * dzr, o = (j * (nx + 1) + i) * 3;
      pos[o] = x; pos[o + 1] = heightAt(x, z) + 0.02; pos[o + 2] = z; rel[o / 3] = lastRel;
    }
  }
  await ctx.yield();
  for (let j = 0; j < nz; j++) for (let i = 2; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = (j + 1) * (nx + 1) + i - 2, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  await ctx.yield();
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); rg.setAttribute('aRel', new THREE.BufferAttribute(rel, 1)); rg.setIndex(idx); await ctx.yield(); await vertexNormalsInSlices(ctx, rg); await ctx.yield();
  // the plain: a polar grid, flat
  const dp = [], dn = [], di = [], rings = [0, 30, 70, 130, 220, 360, 560, 900, 1500], seg = 48;
  for (let r = 0; r < rings.length; r++) for (let s = 0; s < seg; s++) {
    const a = (s / seg) * Math.PI * 2; dp.push(Math.cos(a) * rings[r] + 20, 0, Math.sin(a) * rings[r] - 170); dn.push(0, 1, 0);
  }
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < seg; s++) {
    const a = r * seg + s, b = r * seg + (s + 1) % seg, c = a + seg, d = b + seg; di.push(a, b, c, b, d, c);
  }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3)); dg.setAttribute('normal', new THREE.Float32BufferAttribute(dn, 3)); dg.setAttribute('aRel', new THREE.Float32BufferAttribute(new Float32Array(dp.length / 3).fill(1), 1)); dg.setIndex(di);
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const uniforms = Object.assign({
    uPaneA: { value: paneA }, uPaneB: { value: paneB }, uH: { value: H },
    uSnow: { value: C(PALETTE[2], 0.8) }, uStainCol: { value: new THREE.Color(0.2, 0.185, 0.19) }, uShadowCol: { value: C(PALETTE[1]) },
    uCliff: { value: new THREE.Vector3(CLIFF.x0, CLIFF.k, CLIFF.zN) }, uCliffV: { value: new THREE.Vector2(CLIFF.vMin, CLIFF.vMax) },
    uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) },
    uHud: U.uHud, uTailSeg: U.uTailSeg,
    uKeyDir: U.uKeyDir, uKeyCol: U.uKeyCol, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uRimCol: U.uRimCol, uSat: U.uSat,
  }, extra, FOGU);
  const mat = new THREE.ShaderMaterial({ uniforms, defines: { NP }, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG });
  const ribbon = new THREE.Mesh(rg, mat); ribbon.name = 'sastrugi-ribbon';
  const mat2 = mat.clone(); mat2.uniforms = uniforms; mat2.polygonOffset = true; mat2.polygonOffsetFactor = 1; mat2.polygonOffsetUnits = 2;
  const disc = new THREE.Mesh(dg, mat2); disc.name = 'ice-plain'; disc.frustumCulled = false;
  const group = new THREE.Group(); group.add(disc, ribbon);
  return { object: group, heightAt, panes };
}

// ---------------------------------------------------------------- 5b. sastrugi: modelled, knife-crested
// The wind-carved ridges are GEOMETRY, not shading: each is its own small mesh lying along the wind, 2.5 to 8 m long and
// 0.3 to 0.6 m tall, with a blunt steep nose on its upwind end, a crest that is a hard crease (the two flanks do not
// share its vertices) running down to a pointed tail, one flank a long concave ramp (the one that looks at the key and
// the moon) and the other, the lee, short and steep. They stand on the snow under them (the ribbon's drifts on the
// approach, heightAt under every vertex; the level plain elsewhere; feet sunk five centimetres), keep off the bare ice
// and the slabs, are trodden flat wherever a bird walks (the bird's own line decides, never the ridge), and are scaled
// down (never clipped) where the lens passes over them: under the track they are noses 0.7 m below it.
// THE BAND. They stand only beside the route: within 15.5 m of it on the approach (the ribbon's ground) and within 26 m
// of the low leg from the tail to the cliff's foot. That is a limit of cost, not a rule of the snow (a field over the
// whole plain does not fit the build): a band along the route's line, the same along the whole of each leg. Toward the
// band's outer edge, the colony's trodden ground and the cliff's foot a ridge stands lower, and one left under a hand
// high is not built, so the band has no edge. Every distance is in metres from a place (the route's line in the plan,
// the huddle, the face), the same from every eye: nothing here knows the lens, and no ridge sinks or hides with distance.
// Shading (SAS_FRAG): the plain's own matte snow, a lit flank on the key side, gold on the flank that looks at the
// moon, a short violet lee, and ONE thin crest line that is pearl, and gold in long slivers where it lies in the
// moon's path; it is 3 cm wide, drawn a pixel and a quarter wide at least, and dimmed to its own share of the pixel
// once it is under a third of one (far ridges keep their flanks, never a bright wire).
const SAS_VERT = /* glsl */`
attribute vec3 aT;
varying vec3 vWp, vN, vT;
void main(){
  vWp = position; vN = normal; vT = aT;
  gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0);
}`;
const SAS_FRAG = /* glsl */`
uniform vec3 uSnow; uniform vec2 uWind; uniform float uCalm;
${WL_GLSL}
${SF_GLSL}
varying vec3 vWp, vN, vT;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-4, 0.0));
  vec2 p = vWp.xz, W = uWind, X = vec2(-W.y, W.x);
  vec2 q = vec2(dot(p, X), dot(p, W));
  float t = vT.x;
  float pxm = max(length(fwidth(vWp)), 1e-4);
  float fine2 = 1.0 - smoothstep(0.015, 0.14, pxm);
  // the same snow as the plain it stands on (GROUND_FRAG's albedo), with the wind's etching on the flanks: thin level
  // strata a few centimetres apart, broken along the ridge
  float drift = sfVN(vec2(q.x*0.2, q.y*0.025)) - 0.5;
  vec3 alb = uSnow*(0.84 + 0.14*sfVN(p*0.11 + 4.0) + 0.2*drift);
  alb *= 1.0 + 0.09*((sfVN(p*5.3 + 9.0) - 0.5)*0.6 + (sfVN(p*13.0 + 3.0) - 0.5)*0.4)*fine2;
  float lay = sfVN(vec2(vWp.y*31.0 + 2.0*sfVN(q*vec2(0.9, 0.3)), q.y*0.35 + vT.z*17.0));
  alb *= 1.0 + (0.12 + 0.34*smoothstep(0.25, 0.7, 1.0 - N.y))*(lay - 0.5)*fine2*smoothstep(0.1, 0.5, t);      // (plainest on the steep lee face: wind-cut layers, not a flat slab)
  alb *= mix(0.9, 1.0, smoothstep(0.0, 0.45, t));                      // a contact shade where it rises from the plain
  float real = clamp((dot(N, uKeyDir) - uKeyDir.y)*mix(1.8, 2.4, uCalm), -1.0, 1.0);
  // (the shaded flank takes the plain's light on its lower half: its shade is a band under the crest, not a dark slab)
  // and BOTH flanks start from the plain's own tone at the foot: the lit ramp brightens up to the crest, the lee deepens up
  // to it (one flat tone from foot to crest was a sheet of cut paper lying on the snow, with a hard outline)
  float rampT = smoothstep(0.0, 0.9, t);
  real = max(real, 0.0)*mix(0.1, 1.0, rampT*rampT) + min(real, 0.0)*smoothstep(0.0, 0.62, t);
  float key = max(0.3 + uKeyDir.y*0.9 + mix(max(real, 0.0)*0.7 + min(real, 0.0)*0.55, real*0.7, uCalm), 0.0);
  vec3 col = alb*(uSkyCol*0.78 + uGroundCol*0.25 + uKeyCol*key);
  col += uRimCol*smoothstep(0.12, 0.5, real)*0.1;
  // the lee: short (it is the steep flank's own width) and violet
  float leeK = smoothstep(0.02, mix(0.4, 0.26, uCalm), -real);
  col *= mix(vec3(1.0), mix(vec3(0.62, 0.63, 0.9), vec3(0.46, 0.49, 0.72), uCalm), leeK);
  // the moon: gold on the flank that looks at it
  float mface = smoothstep(0.1, 0.55, dot(N, uMoonDir))*mix(0.15, 1.0, rampT);
  col += alb*uMoonCol*(max(dot(N, uMoonDir), 0.0)*1.5 + 1.0*mface);
  vec2 mdir = uMoonDir.xz/max(length(uMoonDir.xz), 1e-3), vdir = -V.xz/max(length(V.xz), 1e-3);
  float laneW = smoothstep(0.78, 0.99, dot(mdir, vdir));
  float goldF = mface*(0.55 + 0.45*laneW)*(1.0 - 0.6*uCalm);
  col = min(wGrade(col), vec3(0.72))*mix(vec3(1.0), vec3(1.09, 0.95, 0.77), clamp(goldF, 0.0, 1.0));      // (a paler gold than the plain's: many small flanks in full gold were a scatter of cream patches)
  // the crest line: its distance from the crest in pixels (t runs 0 at the foot to 1 on the crest), 3 cm wide and never
  // drawn under a pixel and a quarter; where its true width is under a third of a pixel it keeps only that share of its
  // light; none on the low nose and the last of the tail
  float tpx = max(fwidth(t), 1e-5), wpx = max(0.03/pxm, 1.25);
  float line = (1.0 - smoothstep(0.35*wpx, wpx, (1.0 - t)/tpx))*smoothstep(0.05, 0.16, vT.y)*min(0.09/pxm, 1.0);
  col += uRimCol*line*mix(0.34, 0.2, uCalm);
  float brk = 0.3 + 0.7*smoothstep(0.3, 0.62, sfVN(vec2(q.y*0.55 + vT.z*37.0, vT.z*11.0)));
  col = mix(col, vec3(1.3, 0.82, 0.36)*(uMoonCol.r*2.6), clamp(line*brk*(0.35 + 0.65*laneW)*(1.0 - 0.5*uCalm)*0.9, 0.0, 1.0));
  gl_FragColor = vec4(sfApply(col, vWp), 1.0);
}`;

// metres from a place to a stretch of line, and between two stretches (0 where they cross), in the plan
function ptSeg(px, pz, ax, az, bx, bz) {
  const ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez, k = l2 > 1e-9 ? clamp(((px - ax) * ex + (pz - az) * ez) / l2, 0, 1) : 0;
  return Math.hypot(px - ax - ex * k, pz - az - ez * k);
}
function segSeg(ax, az, bx, bz, cx, cz, dx, dz) {
  const s1 = (bx - ax) * (cz - az) - (bz - az) * (cx - ax), s2 = (bx - ax) * (dz - az) - (bz - az) * (dx - ax);
  const s3 = (dx - cx) * (az - cz) - (dz - cz) * (ax - cx), s4 = (dx - cx) * (bz - cz) - (dz - cz) * (bx - cx);
  if (s1 * s2 < 0 && s3 * s4 < 0) return 0;
  return Math.min(ptSeg(ax, az, cx, cz, dx, dz), ptSeg(bx, bz, cx, cz, dx, dz), ptSeg(cx, cz, ax, az, bx, bz), ptSeg(dx, dz, ax, az, bx, bz));
}

async function makeSastrugi(ctx, rng, ground, env, U, FOGU, extra) {
  // env, all of it places: near (the route's line: metres from it in the plan and its height there), leg (the low leg's
  // three knots), colony (0 on the huddle's ground, 1 clear of it), walks (the lines birds walk: [ax, az, bx, bz, how
  // far a bird strays from it]), solids (slabs)
  const heightAt = ground.heightAt, panes = ground.panes, Z_HI = 15, Z_LO = -166, BAND = 15.5, LEG = 26;
  const ridges = [];
  // the snow a ridge stands on: the ribbon's drifts on its own ground, the level plain everywhere else
  const baseAt = (x, z) => (x > -16 && x < 16 && z < 25 && z > -166 ? heightAt(x, z) : 0);
  // bare ice: the listed panes and the far panes of the plain (GROUND_FRAG's farP and farOK, the same arithmetic), with a
  // hand's margin for their ragged edge
  const iceAt = (x, z) => {
    if (paneMaskJS(panes, x, z) > 0.42) return true;
    const far = Math.max(smoothstep(24, 34, Math.abs(x)), 1 - smoothstep(-190, -160, z)) * smoothstep(62, 80, Math.hypot(x - H.x, z - H.z));
    if (far < 0.02) return false;
    const qx = x * WPERP[0] + z * WPERP[1], qy = x * WIND[0] + z * WIND[1];
    return sfVNJS(qx * 0.036 + 5, qy * 0.011 + 5) + 0.25 * (sfVNJS(qx * 0.16, qy * 0.05) - 0.5) > 0.62;
  };
  const onIce = (x, z, L, w, dx, dz) => {
    for (let k = -2; k <= 2; k++) for (let j = -1; j <= 1; j++) if (iceAt(x + dx * L * k * 0.25 + dz * w * j * 0.9, z + dz * L * k * 0.25 - dx * w * j * 0.9)) return true;
    return false;
  };
  // can there be bare ice within `reach` metres of a place at all? (a listed pane's own box, the far panes' own ground)
  const iceNear = (x, z, reach) => {
    for (const p of panes) if (Math.abs(p.x - x) < p.a + 2 + reach && Math.abs(p.z - z) < p.a + 2 + reach) return true;
    return Math.hypot(x - H.x, z - H.z) > 62 - reach && (Math.abs(x) > 24 - reach || z < -160 + reach);
  };
  const SLIDE = [0, -1.5, 1.5, -3, 3];
  const tryRidge = (x0, z0, L, hh, w, yaw, asym, sd, field) => {
    const dx = WIND[0] * Math.cos(yaw) - WIND[1] * Math.sin(yaw), dz = WIND[0] * Math.sin(yaw) + WIND[1] * Math.cos(yaw);
    // a ridge that would lie on bare ice is slid along its own line until its end is at the ice's edge: a pane of ice
    // has ridges running off it on both sides, their tails at its rim
    let x = x0, z = z0;
    if (iceNear(x0, z0, L * 0.5 + 4)) {
      let clear = false;
      for (let i = 0; i < 5 && !clear; i++) { x = x0 + dx * SLIDE[i]; z = z0 + dz * SLIDE[i]; clear = !onIce(x, z, L, w, dx, dz); }
      if (!clear) return false;
    }
    for (const b of env.solids) { const ex = b.x - x, ez = b.z - z; if (Math.abs(ex * dx + ez * dz) < L * 0.5 + 0.5 * b.w + 0.7 && Math.abs(ex * dz - ez * dx) < w + 0.5 * b.w + 0.7) return false; }
    for (let i = ridges.length - 1; i >= 0; i--) {
      const r = ridges[i], ex = r.x - x, ez = r.z - z; if (ex > 9 || ex < -9 || ez > 9 || ez < -9) continue;
      if (Math.abs(ex * dx + ez * dz) < (L + r.L) * 0.5 + 0.3 && Math.abs(ex * dz - ez * dx) < (w + r.w) * 0.72) return false;
    }
    ridges.push({ x, z, L, h: hh, w, dx, dz, asym, sd, field });
    return true;
  };
  // THE FIELD IS STRUNG ALONG THE WIND: rows a ridge's width apart across the wind, and along each row one ridge after
  // another, each 2.5 to 8 m long with a gap behind its tail, every row slipped by its own amount. (l, s) are wind
  // coordinates: l across the wind, s down it. Three passes beside the approach, nearest the route's line first: the
  // strip it runs over (to 3.6 m from it), the near field (to 6.5 m), then FEWER AND LARGER ridges out to the band's
  // edge; and one over the plain under the low leg. `keep` gives how tall a ridge may stand at a place (0: none; under 1
  // toward the band's edge, the colony and the face). Every candidate is one try: nothing is sampled again and again
  let made = 0;
  const strings = async (dl, x0, x1, z0, z1, gen, keep, field) => {
    const cs = [[x0, z0], [x0, z1], [x1, z0], [x1, z1]].map(([x, z]) => x * WPERP[0] + z * WPERP[1]);
    for (let l = Math.min(...cs) + rng() * dl; l < Math.max(...cs); l += dl) {
      // the stretch of this row inside the box x0..x1, z0..z1
      const sa = Math.max(Math.min((x0 - l * WPERP[0]) / WIND[0], (x1 - l * WPERP[0]) / WIND[0]), Math.min((z0 - l * WPERP[1]) / WIND[1], (z1 - l * WPERP[1]) / WIND[1]));
      const sb = Math.min(Math.max((x0 - l * WPERP[0]) / WIND[0], (x1 - l * WPERP[0]) / WIND[0]), Math.max((z0 - l * WPERP[1]) / WIND[1], (z1 - l * WPERP[1]) / WIND[1]));
      for (let sC = sa + rng() * 5; sC < sb;) {
        if (made++ % 40 === 0) await ctx.yield();
        const g = gen(), jl = rng.range(-0.18, 0.18) * dl, yaw = rng.range(-0.13, 0.13), asym = rng.range(0.25, 0.62), sd = rng();
        const s = sC + g.L * 0.5, x = (l + jl) * WPERP[0] + s * WIND[0], z = (l + jl) * WPERP[1] + s * WIND[1];
        const hh = g.h * (0.75 + 0.25 * Math.min(g.L / 6, 1)) * keep(x, z);
        if (hh >= 0.11) tryRidge(x, z, g.L, hh, g.w, yaw, asym, sd, field);
        sC += g.L + g.gap;
      }
    }
  };
  // beside the approach: lower toward the band's edge (from 10 m out), toward the colony, and over the band's two ends
  const app = (x, z, d) => (1 - smoothstep(10, BAND, d)) * smoothstep(Z_LO, Z_LO + 14, z) * (1 - smoothstep(Z_HI - 8, Z_HI, z)) * env.colony(x, z);
  const inZ = (z) => z > Z_LO && z < Z_HI;
  await strings(1.3, -6.5, 8.5, Z_LO, Z_HI, () => { const L = 2.6 + 5.2 * Math.pow(rng(), 1.3); return { L, h: rng.range(0.3, 0.5), w: clamp(0.09 * L, 0.42, 0.85) * rng.range(0.8, 1.2), gap: rng.range(0.4, 2.2) }; },
    (x, z) => { if (!inZ(z)) return 0; const d = env.near(x, z).dist; return d <= 3.6 ? app(x, z, d) : 0; }, 0);
  await strings(1.7, -10, 12, Z_LO, Z_HI, () => { const L = 2.5 + 5.5 * Math.pow(rng(), 1.6); return { L, h: rng.range(0.3, 0.56), w: clamp(0.1 * L, 0.42, 0.85) * rng.range(0.8, 1.2), gap: rng.range(0.5, 3) }; },
    (x, z) => { if (!inZ(z)) return 0; const d = env.near(x, z).dist; return d > 3.2 && d < 6.5 ? app(x, z, d) : 0; }, 0);
  await strings(3.0, -19, 21, Z_LO, Z_HI, () => { const L = 4.5 + 3.5 * Math.pow(rng(), 1.25); return { L, h: rng.range(0.38, 0.6), w: clamp(0.12 * L, 0.6, 1.0) * rng.range(0.85, 1.2), gap: rng.range(2, 7) }; },
    (x, z) => { if (!inZ(z)) return 0; const d = env.near(x, z).dist; return d >= 6 && d <= BAND ? app(x, z, d) : 0; }, 0);
  const nApp = ridges.length;
  // under the low leg: lower toward the band's edge (from 16 m out), toward the colony and toward the face (the rubble's ground)
  const lg = env.leg, legD = (x, z) => Math.min(ptSeg(x, z, lg[0][0], lg[0][2], lg[1][0], lg[1][2]), ptSeg(x, z, lg[1][0], lg[1][2], lg[2][0], lg[2][2]));
  await strings(2.2, Math.min(lg[0][0], lg[1][0], lg[2][0]) - LEG, Math.max(lg[0][0], lg[1][0], lg[2][0]) + LEG, Math.min(lg[0][2], lg[1][2], lg[2][2]) - LEG, Math.max(lg[0][2], lg[1][2], lg[2][2]) + LEG,
    () => { const L = 3.2 + 4.8 * Math.pow(rng(), 1.2); return { L, h: rng.range(0.4, 0.6), w: clamp(0.11 * L, 0.5, 0.95) * rng.range(0.85, 1.2), gap: rng.range(1, 4.5) }; },
    (x, z) => { const d = legD(x, z); return d <= LEG ? (1 - smoothstep(16, LEG, d)) * env.colony(x, z) * smoothstep(24, 32, cliffX(z) - x) : 0; }, 1);
  await ctx.yield();
  // one mesh for the approach's ridges and one for the low leg's
  const chunks = [{ pos: [], nrm: [], aT: [], idx: [] }, { pos: [], nrm: [], aT: [], idx: [] }], built = [0, 0];
  // a ridge has at most twelve rings of six vertices. RG: each ring's profile height, left foot, right foot, crest (x, z
  // each) and the snow's height under the three; P, NR: the ring vertices and their summed face normals
  const RG = new Float64Array(12 * 10), CAP = new Float64Array(12), P = new Float64Array(12 * 18), NR = new Float64Array(12 * 18), TS = [0, 0.45, 1, 1, 0.45, 0], mine = [];
  const put = (o, x, y, z) => { P[o] = x; P[o + 1] = y; P[o + 2] = z; };
  // one face (wound to look up), its normal summed into its three vertices: the crest's two copies keep a flank's normal each
  const face = (ch, base, i0, i1, i2) => {
    const a = i0 * 3, b = i1 * 3, c = i2 * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; ch.idx.push(base + i0, base + i2, base + i1); } else ch.idx.push(base + i0, base + i1, base + i2);
    NR[a] += nx; NR[a + 1] += ny; NR[a + 2] += nz; NR[b] += nx; NR[b + 1] += ny; NR[b + 2] += nz; NR[c] += nx; NR[c + 1] += ny; NR[c + 2] += nz;
  };
  let done = 0;
  for (const r of ridges) {
    if (done++ % 3 === 0) await ctx.yield();
    const far = env.near(r.x, r.z).dist > 9;
    const seg = clamp(Math.round(r.L * 1.1 + 2) - (far ? 3 : 0), 4, 11), px = r.dz, pz = -r.dx;      // (px, pz): across the ridge
    const ph1 = r.sd * 40, ph2 = r.sd * 91, ph3 = r.sd * 17;
    // the lines birds walk within reach of this ridge
    mine.length = 0;
    for (const w of env.walks) if (ptSeg(r.x, r.z, w[0], w[1], w[2], w[3]) < r.L * 0.5 + 4 + w[4]) mine.push(w);
    // first pass over the rings: where they stand, how tall the profile is, how much room the lens leaves over it, and
    // how much of it the birds have left (trodden to nothing where a bird's line comes within a hand of the ring's own
    // foot-to-foot line, whole 1.3 m clear of it)
    for (let k = 0; k <= seg; k++) {
      const s = Math.pow(k / seg, 1.35), a = (s - 0.5) * r.L, o = k * 10;
      const me = 0.2 * r.w * Math.sin(s * 5.5 + ph1) + 0.07 * r.w * Math.sin(s * 13 + ph2);
      const cx = r.x + r.dx * a + px * me, cz = r.z + r.dz * a + pz * me;
      let prof = Math.min(1, Math.pow(s / 0.07, 0.6)) * (1 - 0.9 * Math.pow(s, 1.25)) * (0.85 + 0.15 * Math.sin(s * 8 + ph2)) * (1 - 0.3 * Math.pow(Math.max(0, Math.sin(s * 19 + ph3)), 3));
      if (k === 0 || k === seg) prof = 0;
      const Ws = r.w * (0.3 + 0.7 * smoothstep(0, 0.16, s)) * (1 - 0.84 * Math.pow(s, 1.4)), co = -(0.42 + 0.5 * r.asym) * Ws * (0.45 + 0.55 * (1 - s));      // (the crest stands toward the south-west foot: the flank away from the key and the moon is the SHORT steep one, a violet lee a forearm wide, and the lit flank the long ramp)
      const lx = cx - px * Ws, lz = cz - pz * Ws, rx = cx + px * Ws, rz = cz + pz * Ws, kx = cx + px * co, kz = cz + pz * co;
      const bC = baseAt(kx, kz);
      let c = 1;
      if (prof > 0) {
        const n = env.near(kx, kz), room = n.y - 0.7 + 0.5 * smoothstep(1.5, 3.5, n.dist) - bC;
        c = clamp(room / (prof * r.h), 0, 1);
        for (let i = 0; i < mine.length && c > 0; i++) { const w = mine[i]; c = Math.min(c, smoothstep(0.45 + w[4], 1.3 + w[4], segSeg(lx, lz, rx, rz, w[0], w[1], w[2], w[3]))); }
      }
      CAP[k] = c; RG[o] = prof; RG[o + 1] = lx; RG[o + 2] = lz; RG[o + 3] = rx; RG[o + 4] = rz; RG[o + 5] = kx; RG[o + 6] = kz; RG[o + 8] = bC;
    }
    // where the lens passes over a ridge, or a bird's line crosses it, its crest dips in a long saddle (each ring no
    // taller than the room over it, eased over its neighbours: never clipped level), and a ridge left under a hand
    // high is not built
    let top = 0;
    for (let k = 0; k <= seg; k++) {
      let c = 1; for (let j = 0; j <= seg; j++) c = Math.min(c, CAP[j] + 0.2 * Math.abs(j - k));
      RG[k * 10] *= c; top = Math.max(top, RG[k * 10] * r.h);
    }
    if (top < 0.11) continue;
    const ch = chunks[r.field], base = ch.pos.length / 3, nv = (seg + 1) * 6, sunk = 0.05; built[r.field]++;
    for (let k = 0; k <= seg; k++) {
      const g = k * 10, o = k * 18, Hh = RG[g] * r.h, lx = RG[g + 1], lz = RG[g + 2], rx = RG[g + 3], rz = RG[g + 4], kx = RG[g + 5], kz = RG[g + 6], bC = RG[g + 8], bL = baseAt(lx, lz), bR = baseAt(rx, rz);
      // left foot, left mid, crest (left copy), crest (right copy), right mid, right foot. The flank is concave: a soft foot
      // that steepens to the crest
      put(o, lx, bL - sunk, lz);
      put(o + 3, lerp(lx, kx, 0.58), lerp(bL, bC, 0.58) + (Hh > 0 ? 0.38 * Hh : -sunk), lerp(lz, kz, 0.58));
      put(o + 6, kx, bC + (Hh > 0 ? Hh : -sunk), kz); put(o + 9, kx, bC + (Hh > 0 ? Hh : -sunk), kz);
      put(o + 12, lerp(rx, kx, 0.58), lerp(bR, bC, 0.58) + (Hh > 0 ? 0.38 * Hh : -sunk), lerp(rz, kz, 0.58));
      put(o + 15, rx, bR - sunk, rz);
      for (let j = 0; j < 6; j++) { ch.pos.push(P[o + j * 3], P[o + j * 3 + 1], P[o + j * 3 + 2]); ch.aT.push(TS[j], Hh, r.sd); }
    }
    NR.fill(0, 0, nv * 3);
    for (let k = 0; k < seg; k++) for (let jj = 0; jj < 4; jj++) {
      const a = k * 6 + (jj < 2 ? jj : jj + 1), b = a + 1, c = a + 6, d = c + 1;      // (no face between the crest's two copies)
      face(ch, base, a, b, c); face(ch, base, b, d, c);
    }
    for (let i = 0; i < nv; i++) {
      let nx = NR[i * 3], ny = NR[i * 3 + 1], nz = NR[i * 3 + 2]; const j = i % 6, l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      if (j === 0 || j === 5) { ny += 1.2; const l2 = Math.hypot(nx, ny, nz); nx /= l2; ny /= l2; nz /= l2; }      // the foot runs out into the plain
      ch.nrm.push(nx, ny, nz);
    }
  }
  await ctx.yield();
  const C = (hx, k = 1) => new THREE.Color(hx).multiplyScalar(k);
  const uniforms = Object.assign({ uSnow: { value: C(PALETTE[2], 0.8) }, uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) },
    uKeyDir: U.uKeyDir, uKeyCol: U.uKeyCol, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uRimCol: U.uRimCol, uSat: U.uSat }, extra, FOGU);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: SAS_VERT, fragmentShader: SAS_FRAG });
  const group = new THREE.Group(); group.name = 'sastrugi'; group.userData.ridges = { approach: built[0], lowLeg: built[1], tried: ridges.length, triedApproach: nApp };
  for (const ch of chunks) {
    if (!ch.idx.length) continue;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(ch.pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(ch.nrm, 3));
    g.setAttribute('aT', new THREE.Float32BufferAttribute(ch.aT, 3)); g.setIndex(ch.idx);
    g.computeBoundingSphere(); await ctx.yield();
    const m = new THREE.Mesh(g, mat); m.name = 'sastrugi-ridges'; group.add(m);
  }
  return { object: group };
}

// ---------------------------------------------------------------- 6. the berg face, slabs and rubble
const ICE_COMMON = /* glsl */`
uniform vec3 uBlue, uBlueDeep, uJade, uFirn, uSnow, uTurq;
uniform float uTime, uGlow, uBerg;
${WL_GLSL}
${SF_GLSL}
`;
const CLIFF_VERT = /* glsl */`
attribute vec4 aA;
varying vec3 vWp, vN; varying vec4 vA;
void main(){ vA = aA; vec4 wp = modelMatrix*vec4(position, 1.0); vWp = wp.xyz; vN = mat3(modelMatrix)*normal; gl_Position = projectionMatrix*viewMatrix*wp; }`;
const CLIFF_FRAG = /* glsl */`
${ICE_COMMON}
uniform vec3 uRing;
varying vec3 vWp, vN; varying vec4 vA;
// scallops: x = squared distance to the nearest cell centre (a cup with crisp crests between cups), yz = the
// vector to that centre (the cup's slope), so one lookup gives the relief and its normal
float cRidge; vec2 cId;
vec3 cCell(vec2 p){
  vec2 i = floor(p), f = fract(p); vec3 best = vec3(4.0, 0.0, 0.0); float d2 = 4.0; cId = i;
  for (int a = -1; a <= 1; a++) for (int b = -1; b <= 1; b++) {
    vec2 g = vec2(float(a), float(b)), r = g + vec2(sfHash(i + g), sfHash(i + g + 17.3))*0.8 + 0.1 - f;
    float d = dot(r, r);
    if (d < best.x) { d2 = best.x; best = vec3(d, r); cId = i + g; } else if (d < d2) d2 = d;
  }
  cRidge = sqrt(d2) - sqrt(best.x);                  // 0 on the crest between two cups
  return best;
}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-4, 0.0));
  float y = vWp.y, fisA = vA.y, top = vA.z, v = vA.w;
  float px = length(fwidth(vWp));
  // (the face keeps its modelled relief at every distance: flattened toward one plane and banded in level courses it
  // read from the plain as translucent sheets laid over the ice)
  float farK = smoothstep(45.0, 95.0, length(cameraPosition - vWp));
  float lineFade = 1.0 - smoothstep(0.12, 0.7, px);
  float b0 = sfVN(vec2(v*0.55, y*0.55)) + 0.5*sfVN(vec2(v*1.9, y*1.4));
  float bv = sfVN(vec2((v + 0.25)*0.55, y*0.55)) + 0.5*sfVN(vec2((v + 0.25)*1.9, y*1.4));
  float by = sfVN(vec2(v*0.55, (y + 0.25)*0.55)) + 0.5*sfVN(vec2(v*1.9, (y + 0.25)*1.4));
  // a slow swell of the face: gentle at mid distance, halved again far off, and gone at the close pass, where the
  // face is fractured into flat facets instead (below)
  N = normalize(N - vec3(0.0, by - b0, bv - b0)*0.9*(1.0 - smoothstep(0.1, 0.9, px))*mix(0.3, 1.0, smoothstep(0.03, 0.09, px))*mix(1.0, 0.4, smoothstep(0.1, 0.18, px)));
  // crisp near-field relief: melt scallops 1-3 m across (stretched along the strata on a tabular face)
  float k1 = 1.0 - smoothstep(0.08, 0.55, px), k2 = 1.0 - smoothstep(0.04, 0.3, px);
  vec2 sp = vec2(v, y*mix(1.9, 1.0, uBerg));
  // the cup lattice is warped over eight metres, and large shallow cups give way to fields of small ones (cm)
  sp += (vec2(sfVN(vec2(v*0.13 + 3.0, y*0.13)), sfVN(vec2(v*0.13 + 31.0, y*0.13 + 7.0))) - 0.5)*2.8;
  sp += (vec2(sfVN(sp*0.85 + 5.0), sfVN(sp*0.85 + 41.0)) - 0.5)*0.75;        // and again over a metre: no straight edges
  float cm = smoothstep(0.34, 0.66, sfVN(vec2(v*0.1 + 13.0, y*0.12)));
  vec3 c1 = cCell(sp*0.42 + 3.0); float e1 = cRidge/0.42; vec2 id1 = cId;
  vec3 c2 = cCell(sp*1.05 + vec2(11.0, 5.0)); float e2 = cRidge/1.05; vec2 id2 = cId;
  // the close pass: every cell is also a flat facet with its own tilt, so the face breaks into crisp planes with a
  // dark crease between them, and a few facets hold a fleck of bright snow
  vec2 t1 = vec2(sfHash(id1 + 3.3), sfHash(id1 + 19.1)) - 0.5, t2 = vec2(sfHash(id2 + 5.7), sfHash(id2 + 23.9)) - 0.5;
  float kf = 1.0 - smoothstep(0.045, 0.16, px);
  // (a few large conchoidal planes among fields of small ones: which layer leads changes from patch to patch)
  float fA = 0.95*mix(0.3, 1.0, cm), fB = 0.6*mix(1.5, 0.5, cm);
  N = normalize(N + vec3(0.0, t1.y*fA + t2.y*fB, t1.x*fA + t2.x*fB)*kf);
  // fine frost inside each plane: its grain is the plane's own, so it breaks at every edge
  float fz0 = sfVN(vec2(v, y)*9.0 + id2*3.7), fzv = sfVN(vec2(v + 0.04, y)*9.0 + id2*3.7), fzy = sfVN(vec2(v, y + 0.04)*9.0 + id2*3.7);
  float kz = 1.0 - smoothstep(0.02, 0.07, px);
  N = normalize(N - vec3(0.0, fzy - fz0, fzv - fz0)*2.2*kz);
  float sm = 0.3 + 0.7*smoothstep(0.3, 0.68, sfVN(vec2(v*0.035 + 9.0, y*0.07)));                 // scalloped in patches
  float crease = (1.0 - smoothstep(0.0, 0.035 + px*1.5, e1))*0.34 + (1.0 - smoothstep(0.0, 0.02 + px*1.5, e2))*0.2;
  crease *= (0.3 + 0.7*sm)*smoothstep(0.25, 0.6, sfVN(sp*0.6 + 21.0));          // broken: never a closed net
  float fleck = step(0.8, sfHash(id2 + 41.3))*(1.0 - smoothstep(0.0003, 0.0009 + px*0.03, (c2.y*c2.y*0.2 + c2.z*c2.z*2.6)*(0.6 + 1.6*sfHash(id2 + 2.9))))*kf;   // (a pinch of snow lying along a ledge, a short level dash: round and a hand across it was a white disc)
  vec2 cg = c1.yz*0.42*k1*2.2*mix(0.3, 1.0, cm) + c2.yz*1.05*k2*mix(1.0, 0.22, cm);
  N = normalize(N + vec3(0.0, cg.y*mix(1.9, 1.0, uBerg), cg.x)*mix(0.6, 0.8, uBerg)*sm*mix(1.0, 0.6, kf));
  float cup = mix(1.0, sqrt(c1.x), k1*sm*mix(0.3, 1.0, cm))*mix(1.0, 0.75 + 0.35*sqrt(c2.x), k2*sm*mix(1.0, 0.3, cm));
  // the strata dip and rise by a few metres along the berg (it has tilted and settled): no course runs dead level
  float wav = y + 2.6*sfVN(vec2(v*0.02, y*0.08)) + 0.7*sfVN(vec2(v*0.11, y*0.3)) + 7.0*(sfVN(vec2(v*0.0085 + 4.0, 1.5)) - 0.5)*smoothstep(30.0, 70.0, abs(v));
  // strata that read at 100 m: a pale firn cap, compressed blue below, two jade bands of marine ice
  float firn = smoothstep(23.5, 27.5, wav + 2.5*sfVN(vec2(v*0.06, 2.0)))*(1.0 - uBerg);
  vec3 alb = mix(uBlueDeep, uBlue, smoothstep(0.0, 24.0, wav));
  float j1 = (wav - 9.0)/2.5, j2 = (wav - 17.5)/1.9;
  float jade = clamp(exp(-j1*j1) + exp(-j2*j2), 0.0, 1.0)*(1.0 - uBerg);
  jade = max(jade, uBerg*smoothstep(0.52, 0.72, sfVN(vec2(v*0.013 + 3.0, y*0.035))));
  alb = mix(alb, uJade, jade*0.8);
  alb = mix(alb, uFirn*1.08, firn*0.92);
  // a paler band of firn along the top eight metres, whatever the berg: its lower edge is ragged and distinct
  // (it hangs down the face in tongues of unequal depth, so its edge never repeats the skyline below itself)
  float fEdge = top - 5.0 - 8.0*sfVN(vec2(v*0.05, 5.0)) - 2.6*sfVN(vec2(v*0.31, 2.0));
  alb = mix(alb, uFirn*1.02, smoothstep(fEdge, fEdge + 2.6, y)*(0.78 - 0.34*uBerg));
  // layering: two noise-warped band systems (no regular sine), each faded before it can alias
  float s1 = sfVN(vec2(v*0.03, wav*0.85)), s2 = sfVN(vec2(v*0.09 + 5.0, wav*2.6 + 1.5*s1));
  float lf1 = 1.0 - smoothstep(0.3, 1.3, px), lf2 = 1.0 - smoothstep(0.08, 0.4, px);
  alb *= 1.0 + ((s1 - 0.5)*0.42*lf1 + (s2 - 0.5)*0.24*lf2)*(1.0 - uBerg)*(0.55 + 0.45*firn);
  float band = sfVN(vec2(v*0.004, wav*0.55));
  alb *= 0.72 + 0.5*band;
  float flute = sfVN(vec2(v*0.8, y*0.045)) + 0.5*sfVN(vec2(v*2.3, y*0.12))*lineFade;
  // fluting: upright runnels down the face; from the plain they are what carves it into columns
  float flF = sfVN(vec2(v*0.26 + 2.0*sfVN(vec2(v*0.05, y*0.03)), y*0.012 + 7.0));
  alb *= (0.86 + 0.18*flute)*(1.0 - 0.26*farK*(1.0 - smoothstep(0.1, 0.42, abs(flF - 0.5)))*(1.0 - smoothstep(0.86, 1.0, y/max(top, 1.0))));
  float nearK = 1.0 - smoothstep(0.03, 0.25, px);
  alb *= 1.0 + nearK*(0.16*sfVN(vec2(v*3.3, y*3.3)) + 0.2*sfVN(vec2(v*9.0, y*7.0)) - 0.18);
  // the cups are deeper, clearer ice: darker in the middle, paler toward the crests
  alb *= mix(0.92 + 0.14*cup, 0.78 + 0.36*cup, uBerg);
  float snowM = smoothstep(mix(0.5, 0.6, farK), mix(0.8, 0.9, farK), N.y + 0.2*(sfVN(vWp.xz*0.4) - 0.5));   // (from the plain only true ledges hold snow: a pale patch on every swell reads as a sheet laid over the face)
  snowM = max(snowM, 1.0 - smoothstep(0.6, 3.5 + 2.0*sfVN(vec2(v*0.15, 1.0)), y));
  alb *= 1.0 - 0.3*crease*kf*(1.0 - snowM);                 // (a faint shade in the crease: dark seams were cracked glaze)
  alb *= 1.0 + kz*0.3*(fz0 - 0.5)*(1.0 - snowM);
  snowM = max(snowM, fleck);
  alb = mix(alb, uSnow, snowM);
  vec3 hemi = mix(uGroundCol + uKeyCol*0.17, uSkyCol*1.25, N.y*0.5 + 0.5);
  float kd = max(dot(N, uKeyDir), 0.0);
  float west = clamp(0.4 - N.x*0.6, 0.0, 1.0);
  vec3 col = alb*(hemi*(0.75 + 0.55*west) + uKeyCol*kd*0.9);
  // the face is lit by the sky alone, so the relief is drawn by what looks up and what looks down
  col *= 0.8 + 0.3*smoothstep(-0.45, 0.35, N.y);
  col *= 1.0 - 0.6*fisA*(1.0 - snowM);
  col *= 0.72 + 0.28*smoothstep(0.0, 9.0, y);
  // the ice carries its own colour: light soaks through the blue and the jade whatever the sky is doing
  col += (uBlue*0.03 + uJade*0.09*jade)*uGlow*(1.0 - snowM)*(1.0 - firn)*(1.0 - smoothstep(fEdge, fEdge + 1.6, y))*(0.45 + 0.55*uSat);
  float fl = sfVN(vec2(v*0.33, y*0.028));
  float line = (1.0 - smoothstep(0.0, 0.04 + px*0.03, abs(fl - 0.5)))*lineFade;
  float breathe = 0.64 + 0.36*sin(uTime*1.1 + v*0.07 + y*0.05);
  // in a fissure the glow is a faint breath of colour and one or two thin bright seams winding through it
  // the seam is the 0.5 line of a noise; dividing by the noise's slope turns it into metres from that line, so the
  // thread keeps one width (0.1 m) and cannot balloon into a patch where the noise lies flat
  float sn0 = sfVN(vec2(v*0.21 + 7.0, y*0.21));
  vec2 sg = vec2(sfVN(vec2((v + 0.5)*0.21 + 7.0, y*0.21)) - sn0, sfVN(vec2(v*0.21 + 7.0, (y + 0.5)*0.21)) - sn0)*2.0;
  float sgl = length(sg);
  float tw = 0.14 + px*1.5;                                    // half-width: 14 cm of soft light, never under a pixel and a half (a hair line is neon wire drawn on the ice)
  float thread = (1.0 - smoothstep(tw*0.1, tw, abs(sn0 - 0.5)/max(sgl, 0.02)))*smoothstep(0.012, 0.04, sgl)*min(0.2/tw, 1.0)*(1.0 - smoothstep(0.3, 1.0, px))
               *smoothstep(0.3, 0.62, sfVN(vec2(v*0.55 + 31.0, y*0.55 + 3.0)));      // broken along its length
  float sFloor = mix(0.05, 0.15, smoothstep(0.08, 0.22, px));    // far off the fissure keeps a breath of colour; close to, only the threads
  float seam = smoothstep(0.45, 0.9, fisA)*sqrt(sFloor + (1.0 - sFloor)*thread);
  float glow = min(seam*seam*mix(1.7, 1.45, uBerg) + line*0.06*(1.0 - firn), 0.8)*breathe*(1.0 - snowM);
  vec4 fogc = sfFogRay(cameraPosition, vWp, 1.0);
  float clr = 1.0 - fogc.a; clr *= clr;                         // the glow is in the ice: where the snow hides the face it is hidden too
  col += uTurq*glow*uGlow*smoothstep(1.0, 7.0, y)*(1.0 - smoothstep(top - 5.0, top - 0.5, y))*clr;
  float fr = 1.0 - clamp(dot(N, V), 0.0, 1.0); fr = fr*fr*fr;
  float ledge = smoothstep(0.12, 0.62, N.y)*(1.0 - snowM);
  col += uRimCol*(fr*(0.1 + 0.4*ledge) + ledge*0.022);
  col += alb*uMoonCol*(max(dot(N, uMoonDir), 0.0)*1.3 + 0.5*ledge);       // the moon grazes the face: warm on every ledge and snow cap
  // thin pearl light on the lower rim of each cup, the ledge that looks up at the sky: arcs, never a closed net
  float kc = 1.0 - smoothstep(0.05, 0.3, px);
  float crest = (1.0 - smoothstep(0.02, 0.09 + px, e1))*smoothstep(0.3, 0.8, c1.z/max(sqrt(c1.x), 1e-3))*kc*cm
              + 0.5*(1.0 - smoothstep(0.01, 0.05 + px, e2))*smoothstep(0.3, 0.8, c2.z/max(sqrt(c2.x), 1e-3))*k2*(1.0 - cm);
  col += uRimCol*crest*sm*0.055*(1.0 - snowM) + uRimCol*fleck*0.2;
  // the edges between planes are thin and BRIGHT: they catch the ring's light (broken, never a closed net)
  float edgeL = (1.0 - smoothstep(0.0, 0.012 + px*1.1, e1))*smoothstep(0.52, 0.74, sfVN(sp*0.33 + 21.0))*smoothstep(0.42, 0.66, sfVN(sp*1.9 + 47.0))*(0.4 + 0.6*cm)*kf;   // (broken again along its length: short bright nicks, no net of seams)
  col += mix(uRimCol, uTurq*1.6, 0.35)*edgeL*0.2*(1.0 - snowM);
  // the ring's light plays over the ice either side of the notch: a slow shimmer of mint on every plane that looks at
  // it, gone within forty metres (the ice right behind the ring stays dark)
  vec3 rv = uRing - vWp; float rd = length(rv);
  float rsh = sfVN(vec2(v*0.11 + uTime*0.35, y*0.09 - uTime*0.5))*(0.6 + 0.8*sfVN(vec2(v*0.31 - uTime*0.6, y*0.27 + uTime*0.25 + 9.0)));
  col += mix(uTurq, uRimCol, 0.4)*(0.2 + 0.8*smoothstep(0.0, 0.5, dot(N, rv/max(rd, 1e-3))))*rsh*0.4*smoothstep(7.0, 13.0, rd)*exp(-rd*rd/1150.0)*(1.0 - 0.5*snowM)*uGlow;
  // glitter sinking down the face
  vec2 gc = vec2(v, y + uTime*3.2)*1.6; vec2 gi = floor(gc);
  float gh = sfHash(gi + 5.3);
  vec2 gj = vec2(sfHash(gi + 3.1), sfHash(gi + 9.7))*0.6 + 0.2;
  float spark = step(0.84, gh)*(0.4 + 0.6*fract(gh*37.0))*(1.0 - smoothstep(0.008, 0.02 + px*0.9, length(fract(gc) - gj)))*(0.5 + 0.5*sin(uTime*6.0 + gh*200.0));
  col += uRimCol*spark*(1.0 - smoothstep(0.08, 0.26, px))*smoothstep(2.0, 8.0, y)*2.4*smoothstep(5.0, 16.0, length(cameraPosition - vWp));   // at arm's length they would be dots
  col = min(wGrade(col), vec3(1.2));
  gl_FragColor = vec4(mix(col, fogc.rgb, fogc.a), 1.0);
}`;
const BLOCK_FRAG = /* glsl */`
${ICE_COMMON}
uniform vec2 uWind;
varying vec3 vWp, vN, vLp;
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-4, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-4, 0.0));
  float n1 = sfVN(vLp.xy*2.6 + vLp.z*3.7 + vWp.xz*0.13);
  vec3 alb = mix(uBlueDeep*0.55, uBlue*0.75, n1*n1);
  alb = mix(alb, uJade*0.6, uBerg*0.5*sfVN(vWp.xz*0.05));
  float c = sfVN(vLp.xy*5.1 + vLp.z*6.3 + 7.0);
  alb += uFirn*0.22*(1.0 - smoothstep(0.0, 0.05, abs(c - 0.5)));
  alb *= 0.8 + 0.3*sfVN(vec2(vLp.x*9.0 + vLp.z*5.0, vLp.y*1.3));
  vec3 w3 = normalize(vec3(uWind.x, -0.35, uWind.y));
  float grain = sfVN(vWp.xz*3.1 + vWp.y*2.3);
  float snowM = smoothstep(0.5, 0.8, N.y + 0.3*(grain - 0.5));
  // rime only where a face looks into the wind, broken by a coarse noise so no whole facet turns white
  float rimeN = sfVN(vLp.xy*3.1 + vLp.z*2.3 + vWp.xz*0.41);
  float rime = smoothstep(0.5, 0.95, dot(N, -w3) + 0.7*(rimeN - 0.5))*(0.35 + 0.3*grain);
  snowM = max(max(snowM, rime), 1.0 - smoothstep(0.03, 0.3 + 0.45*rimeN, vWp.y));
  alb = mix(alb, uSnow, snowM);
  vec3 hemi = mix(uGroundCol*1.2, uSkyCol*1.1, N.y*0.5 + 0.5);
  float kd = clamp((dot(N, uKeyDir) + 0.15)/1.15, 0.0, 1.0);
  vec3 col = alb*(hemi + uKeyCol*kd);
  col *= 0.5 + 0.5*smoothstep(0.0, 0.8, vWp.y);
  float fr = 1.0 - clamp(dot(N, V), 0.0, 1.0); fr = fr*fr*fr;
  col += uRimCol*fr*(0.06 + 0.3*snowM) + uTurq*uGlow*0.05*fr*(1.0 - snowM);
  col += alb*uMoonCol*max(dot(N, uMoonDir), 0.0)*2.2;
  col = min(wGrade(col), vec3(0.72));
  gl_FragColor = vec4(sfApply(col, vWp), 1.0);
}`;

function iceUniforms(U, FOGU, time, mood) {
  const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const desat = (c, k) => { const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; return c.lerp(new THREE.Color(l, l, l * 1.1), k); };
  return Object.assign({
    uBlue: { value: desat(C(PALETTE[3], 0.95), 0.36) }, uBlueDeep: { value: desat(C('#16335E', 0.8), 0.3) }, uJade: { value: desat(C('#4E9C8E', 0.84), 0.33) },
    uFirn: { value: C(PALETTE[2], 0.8) }, uSnow: { value: C(PALETTE[2], 0.8) }, uTurq: { value: C('#58D8CC', 0.75) },
    uTime: time, uGlow: { value: mood.hour === 'deep' ? 1.25 : 0.9 }, uBerg: { value: mood.berg === 'overturned' ? 1 : 0 },
    uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) }, uRing: { value: PORTAL },
    uKeyDir: U.uKeyDir, uKeyCol: U.uKeyCol, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uRimCol: U.uRimCol, uSat: U.uSat,
  }, FOGU);
}

function cliffTopAt(noise, mood) {
  const smooth = mood.berg === 'overturned';
  return (v) => {
    const av = Math.abs(v);
    let t = (smooth ? 38 : 40) + (smooth ? 7 : 4) * noise.n2(v * 0.012, 3.1) + (smooth ? 0.5 : 1.5) * noise.n2(v * 0.06, 8.2);
    const hx = (av - 21) / 12; t += (smooth ? 15 : 14) * Math.exp(-hx * hx);
    t = Math.min(t, 36 + Math.max(av - 2.5, 0) / 0.8);
    t *= (1 - smoothstep(110, 190, v)) * (1 - smoothstep(225, 290, -v));
    return Math.max(t, 1.2);
  };
}

async function makeCliff(ctx, noise, mood, ice) {
  const topAt = cliffTopAt(noise, mood);
  const vs = [];
  for (let v = CLIFF.vMin; v <= CLIFF.vMax + 0.01;) { vs.push(v); v += Math.abs(v) < 31 ? 0.75 : 1.6; }
  const JF = 40, back = [2, 6, 16, 40, 90, 170], rows = JF + 1 + back.length, nc = vs.length;
  const pos = new Float32Array(nc * rows * 3), aA = new Float32Array(nc * rows * 4), idx = [];
  const smooth = mood.berg === 'overturned';
  for (let i = 0; i < nc; i++) {
    if (i % 8 === 0) await ctx.yield();
    const v = vs[i], top = topAt(v), bx = CLIFF.x0 - CLIFF.k * v * v, z = CLIFF.zN + v;
    let dTop = 0;
    for (let j = 0; j < rows; j++) {
      const o = (i * rows + j);
      let y, d, fis = 0;
      if (j <= JF) {
        const f = j / JF; y = top * f;
        fis = (1 - smoothstep(0, 0.11, Math.abs(noise.n2(v * 0.055 + 20, y * 0.006)))) * smoothstep(0.03, 0.15, f) * (1 - smoothstep(0.8, 0.97, f));
        if (Math.abs(v) < 16) fis *= 0.3;
        const bulge = 2.4 * noise.n2(v * 0.03, y * 0.05) + 0.9 * noise.n2(v * 0.11, y * 0.18 + 4);
        const ledge = smooth ? 0.9 * noise.n2(v * 0.2, y * 0.2 + 9) : 0.42 * noise.n2(v * 0.018, y * 0.2 + 5) + 0.3;   // benches several rows deep: never a row-by-row zigzag
        const crown = f > 0.9 ? 2.2 * Math.pow((f - 0.9) / 0.1, 2) : 0;
        const apron = f < 0.08 ? -6 * Math.pow(1 - f / 0.08, 2) : 0;
        // buttresses and clefts away from the notch: upright columns of ice standing proud of the face between deep
        // recesses (several columns of the mesh wide), so the berg is carved in the round when seen from the plain
        const nb = Math.abs(noise.n2(v * 0.043 + 50, y * 0.0045 + 3)), awayN = smoothstep(30, 48, Math.abs(v));
        const cleft = (1 - smoothstep(0.02, 0.3, nb)) * smoothstep(0.04, 0.2, f) * (1 - smoothstep(0.8, 0.98, f)) * awayN;
        const butt = smoothstep(0.3, 0.85, nb) * (1 - smoothstep(0.7, 0.98, f)) * (0.4 + 0.6 * smoothstep(0, 0.3, f)) * awayN;
        fis = Math.max(fis, 0.5 * cleft);
        d = 0.05 * y + bulge + ledge + 3.6 * fis + crown + apron + 2.6 * cleft - 1.5 * butt;
        dTop = d;
      } else {
        d = dTop + back[j - JF - 1]; y = top + (j - JF) * 0.25 + 0.5 * noise.n2(v * 0.05, d * 0.05);
        if (Math.abs(v) < 20) y = top;
      }
      pos[o * 3] = bx + d; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z;
      aA[o * 4] = Math.min(j / JF, 1); aA[o * 4 + 1] = fis; aA[o * 4 + 2] = top; aA[o * 4 + 3] = v;
    }
  }
  for (let i = 0; i < nc - 1; i++) for (let j = 0; j < rows - 1; j++) {
    const a = i * rows + j, b = a + 1, c = a + rows, d = c + 1; idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aA', new THREE.BufferAttribute(aA, 4)); g.setIndex(idx); await ctx.yield(); await vertexNormalsInSlices(ctx, g); await ctx.yield();
  const mat = new THREE.ShaderMaterial({ uniforms: ice, vertexShader: CLIFF_VERT, fragmentShader: CLIFF_FRAG });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'berg-face'; mesh.frustumCulled = false;
  return { object: mesh, topAt };
}

// a thick fractured plate of pressure ice: a 4 x 6 x 2 box whose outline is cut by smooth noise, with a slanted
// broken top, chamfered rims and warped faces. Normals are smooth within each face and crisp along the box edges.
function blockGeometry(sx = 4, sy = 6, sz = 2) {
  const g = new THREE.BoxGeometry(1, 1, 1, sx, sy, sz); g.translate(0, 0.5, 0);
  const p = g.getAttribute('position');
  const hv = (a, k) => { let n = Math.imul(a * 73 + k * 151 + 1013, 2654435761) >>> 0; n ^= n >>> 15; n = Math.imul(n, 2246822519) >>> 0; n ^= n >>> 13; return (n >>> 0) / 4294967296 - 0.5; };
  const sn = (t, k) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return hv(i, k) * (1 - u) + hv(i + 1, k) * u; };
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const hTop = 0.66 + 0.34 * smoothstep(-0.5, 0.25, x) - 0.1 * smoothstep(0.25, 0.5, x) + 0.16 * sn(x * 3.3 + 1.7, 1);
    const wS = 1 - 0.2 * y * y + 0.14 * sn(y * 2.7 + 0.4, 2);
    const rimX = smoothstep(0.55, 1, Math.abs(x) * 2), rimY = smoothstep(0.7, 1, y);
    let nx = x * wS + 0.1 * y + 0.07 * sn(y * 4.6 + (x > 0 ? 3 : 9), 3) * rimX;
    let ny = y * hTop + 0.05 * sn(x * 5.1 + y * 2.3, 4) * y;
    const thick = (1 - 0.5 * rimX * rimX) * (1 - 0.55 * rimY * rimY) * (0.82 + 0.4 * sn(x * 2.2 + y * 1.6 + 5, 5));
    let nz = z * thick * (1 - 0.25 * y) + 0.16 * sn(x * 2.4 + 2.2, 6) * sn(y * 2.9 + 0.7, 7) * 2 + 0.05 * sn(x * 6.3 + y * 5.1, 8);
    if (y < 0.01) ny = -0.15;
    p.setXYZ(i, nx, ny, nz);
  }
  g.computeVertexNormals();
  return g;
}

async function makeBlocks(ctx, rng, path, ice, topAt, density) {
  const list = [];
  // the entry slab, then nineteen more along the approach, none within 6.5 m of the path
  list.push({ x: -6.2, z: -23.5, h: 4.6, w: 3.6, t: 1.0, yaw: 0.42, tilt: 0.3, roll: 0.1 });
  let guard = 0;
  while (list.length < 20 && guard++ < 600) {
    const z = rng.range(-150, -30), x = rng.range(-17, 17);
    const n = path.nearestXZ(x, z); if (n.dist < 6.5 || n.dist > 15) continue;
    if (list.some((b) => Math.hypot(b.x - x, b.z - z) < 9)) continue;
    const hh = rng.range(1, 3);
    list.push({ x, z, h: hh, w: hh * rng.range(0.6, 1.1), t: rng.range(0.42, 0.78) * (0.55 + 0.45 * hh), yaw: rng.range(0, Math.PI * 2), tilt: rng.range(0.2, 0.6), roll: rng.range(-0.25, 0.25) });
  }
  await ctx.yield();
  const nR = Math.round(230 * density);
  for (let i = 0; i < nR; i++) {
    const v = lerp(CLIFF.vMin + 20, CLIFF.vMax - 8, (i + rng()) / nR);
    if (topAt(v) < 3) continue;
    const z = CLIFF.zN + v, cd = rng.range(1.5, 11) + (rng.chance(0.15) ? rng.range(3, 9) : 0), s = rng.range(1.6, 4.2) * (cd > 11 ? 0.6 : 1);
    list.push({ x: CLIFF.x0 - CLIFF.k * v * v - cd, z, h: s, w: s * rng.range(0.6, 1.3), t: s * rng.range(0.25, 0.6), yaw: rng.range(0, Math.PI * 2), tilt: rng.range(0.1, 1.1), roll: rng.range(-0.5, 0.5) });
  }
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({ uniforms: ice, vertexShader: WORLD_VERT, fragmentShader: BLOCK_FRAG, side: THREE.DoubleSide });
  // the twenty slabs beside the approach keep the full plate; the rubble along the cliff foot, never seen from
  // nearer than 30 m, is cut from a coarser one
  const nSlab = Math.min(20, list.length);
  const slabs = new THREE.InstancedMesh(blockGeometry(), mat, nSlab), rubble = new THREE.InstancedMesh(blockGeometry(3, 4, 1), mat, Math.max(list.length - nSlab, 1));
  await ctx.yield();
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  list.forEach((b, i) => {
    e.set(b.tilt, b.yaw, b.roll, 'YXZ'); q.setFromEuler(e); s.set(b.w, b.h, b.t); p.set(b.x, -0.1, b.z);
    if (i < nSlab) slabs.setMatrixAt(i, m.compose(p, q, s)); else rubble.setMatrixAt(i - nSlab, m.compose(p, q, s));
  });
  rubble.count = list.length - nSlab;
  const group = new THREE.Group(); group.name = 'slabs-and-rubble';
  for (const im of [slabs, rubble]) { im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; group.add(im); }
  return { object: group, list };
}

// ---------------------------------------------------------------- 7. weather and air
const SNOWLIT = /* glsl */`vec3 snowLit(float k){ return uSnowC*(uSkyCol*0.9 + uGroundCol*0.3 + uKeyCol*k); }`;

// three shells of drifting snow just above the ice, following the camera
function makeShells(shared) {
  const pos = [], idx = [], ys = [0.12, 0.24, 0.38];
  ys.forEach((y, k) => { pos.push(-1, y, -1, 1, y, -1, 1, y, 1, -1, y, 1); idx.push(k * 4, k * 4 + 2, k * 4 + 1, k * 4, k * 4 + 3, k * 4 + 2); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vWp; void main(){ vWp = vec3(position.x*95.0 + cameraPosition.x, position.y, position.z*95.0 + cameraPosition.z); gl_Position = projectionMatrix*viewMatrix*vec4(vWp, 1.0); }`,
    fragmentShader: /* glsl */`
uniform vec3 uSnowC; uniform vec2 uWind; uniform float uFlow, uSnake;
${WL_GLSL}
${SF_GLSL}
${SNOWLIT}
varying vec3 vWp;
void main(){
  vec2 W = uWind, X = vec2(-W.y, W.x); vec2 q = vec2(dot(vWp.xz, X), dot(vWp.xz, W));
  float lay = vWp.y*7.0;
  float qy = q.y - uFlow*(1.0 + vWp.y*0.5);
  float sn = sfVN(vec2(q.x*0.4 + 1.8*sfVN(vec2(qy*0.035, q.x*0.07 + lay)), qy*0.03 + lay));
  float fil = sfVN(vec2(q.x*2.8 + 2.0*sfVN(vec2(qy*0.09, 5.0 + lay)), qy*0.2));
  float dist = length(cameraPosition - vWp);
  float a = smoothstep(0.38, 0.62, sn)*(0.25 + 0.75*fil)*uSnake;
  a *= smoothstep(5.0, 20.0, dist)*(1.0 - smoothstep(45.0, 92.0, dist))*(0.5 - 0.6*vWp.y);
  if (a < 0.004) discard;
  vec3 col = min(wGrade(snowLit(0.55)*1.3), vec3(0.72));
  gl_FragColor = vec4(sfApply(col, vWp), a);
}`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 2; m.name = 'snow-snakes';
  return m;
}

// ribbons of blowing snow racing past the lens
function makeStreamers(rng, shared, count) {
  const seg = 20, pos = [], idx = [];
  for (let i = 0; i <= seg; i++) pos.push(i / seg, -0.5, 0, i / seg, 0.5, 0);
  for (let i = 0; i < seg; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const sd = new Float32Array(count * 4), rn = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    sd[i * 4] = rng(); sd[i * 4 + 1] = 0.35 + Math.pow(rng(), 1.7) * 7.5; sd[i * 4 + 2] = rng(); sd[i * 4 + 3] = rng.range(60, 120);
    rn[i * 4] = rng.range(0.3, 1.3); rn[i * 4 + 1] = rng.range(0.85, 1.3); rn[i * 4 + 2] = rng(); rn[i * 4 + 3] = rng.range(0.45, 1);
  }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 4)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rn, 4)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 aSeed, aRnd;
uniform float uFlow, uStream; uniform vec2 uWind;
varying vec2 vUv; varying vec3 vWp; varying vec3 vS;
void main(){
  vec2 W = uWind, X = vec2(-W.y, W.x);
  float BL = 84.0, BS = 280.0;
  float camL = dot(cameraPosition.xz, X), camS = dot(cameraPosition.xz, W);
  float l = camL + mod(aSeed.x*BL - camL + BL*0.5, BL) - BL*0.5;
  float s = camS + mod(aSeed.z*BS + uFlow*aRnd.y - camS + BS*0.5, BS) - BS*0.5;
  float sx = s + (position.x - 0.5)*aSeed.w;
  float und = sin(sx*0.07 + aRnd.z*6.283)*0.5 + sin(sx*0.19 + aRnd.z*17.0)*0.18;
  float ll = l + sin(sx*0.045 + aRnd.z*9.0)*1.3;
  vec3 c = vec3(X.x*ll + W.x*sx, aSeed.y + und*(0.25 + 0.15*aSeed.y), X.y*ll + W.y*sx);
  vec3 toCam = cameraPosition - c;
  float dist = length(toCam);
  vec3 side = normalize(cross(vec3(W.x, 0.0, W.y), toCam) + vec3(0.0, 1e-4, 0.0));
  vec3 wp = c + side*position.y*aRnd.x*(2.2 + dist*0.04);
  float wrap = smoothstep(0.0, 0.14, 0.5 - abs(s - camS)/BS)*smoothstep(0.0, 0.1, 0.5 - abs(l - camL)/BL);
  vUv = vec2(position.x, position.y*2.0); vWp = wp;
  // (none below the eye: seen from above, a ribbon is only a thin line drawn across the snow)
  vS = vec3(aRnd.w*wrap*smoothstep(1.2, 5.0, dist)*uStream*smoothstep(-0.5, 0.5, c.y - cameraPosition.y)*(1.0 - smoothstep(2.0, 3.6, c.y - cameraPosition.y)), aRnd.z, aSeed.w);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSnowC; uniform float uFlow;
${WL_GLSL}
${SF_GLSL}
${SNOWLIT}
varying vec2 vUv; varying vec3 vWp; varying vec3 vS;
void main(){
  float ac = 1.0 - vUv.y*vUv.y; ac *= ac;
  float al = sin(3.14159*clamp(vUv.x, 0.0, 1.0)); al = sqrt(max(al, 0.0));
  float n = sfVN(vec2(vUv.x*vS.z*0.16 - uFlow*0.02 + vS.y*40.0, vUv.y*1.6 + vS.y*9.0));
  float n2 = sfVN(vec2(vUv.x*vS.z*0.6 + vS.y*7.0, vUv.y*3.0));
  float a = ac*al*smoothstep(0.2, 0.85, n*0.75 + n2*0.4)*vS.x*0.3;
  if (a < 0.004) discard;
  vec3 col = min(wGrade(snowLit(0.6)*1.45), vec3(0.72));
  gl_FragColor = vec4(sfApply(col, vWp), a);
}`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 4; m.name = 'streamers';
  return m;
}

// the fringes of the departing snow layer: six streaked sheets leaning with the fog's rear face (same slope,
// same raggedness as sfFogRay), each visible only where it lies within a few metres of that face. They hang
// in the clear air just behind the wall as trailing wisps and give its face streaks and parallax.
function makeCurtain(shared) {
  const pos = [], idx = [], offs = [-27, -19, -12, -5, 3, 12];
  offs.forEach((o, k) => { pos.push(-0.5, 0, o, 0.5, 0, o, 0.5, 1, o, -0.5, 1, o); idx.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
uniform float uSfEdge, uSfLean; uniform vec2 uWind;
varying vec3 vWp; varying vec3 vUv;
void main(){
  vec2 W = uWind, X = vec2(-W.y, W.x);
  float y = position.y*112.0 - 2.0;
  float lat = -106.5 + position.x*820.0, s = uSfEdge + position.z + y/uSfLean;
  vWp = vec3(X.x*lat + W.x*s, y, X.y*lat + W.y*s);
  vUv = vec3(position.x + 0.5, position.y, position.z);
  gl_Position = projectionMatrix*viewMatrix*vec4(vWp, 1.0);
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSnowC; uniform float uTime, uCurtain; uniform vec2 uWind;
${WL_GLSL}
${SF_GLSL}
${SNOWLIT}
varying vec3 vWp; varying vec3 vUv;
void main(){
  float u = vUv.x*820.0, y = vWp.y, id = vUv.z;
  vec2 X = vec2(-uWind.y, uWind.x);
  float lat = dot(vWp.xz, X);
  // height above the ragged face (the two broad terms of sfFogRay's raggedness): > 0 in the clear air behind the wall
  float rag = (sfVN(vec2(lat*0.011, y*0.016 + 3.0)) - 0.5)*26.0 + (sfVN(vec2(lat*0.045 + 7.0, y*0.06)) - 0.5)*10.0
            + (sfVN(vec2(lat*0.024 + 1.7, y*0.033 + 9.0)) - 0.5)*15.0;
  float hh = uSfLean*(rag - id);
  float near = smoothstep(-16.0, -3.0, hh)*(1.0 - smoothstep(3.0, 20.0, hh));
  // soft hanging rags, torn along their length and drifting down
  float n = sfVN(vec2(u*0.028 + id*1.3 + y*0.02, y*0.016 - uTime*0.03));
  float st = sfVN(vec2(u*0.085 + id*0.5 + y*0.05, y*0.03 - uTime*0.06));
  float st2 = sfVN(vec2(u*0.24 + id*2.1 + y*0.12, y*0.06 - uTime*0.1));
  float a = smoothstep(0.4, 0.9, n*0.72 + st*0.38 + st2*0.06)*near;
  // torn: no rag is wider than about fifteen metres, and each is broken along its fall
  a *= smoothstep(0.34, 0.62, sfVN(vec2(u*0.07 + id*3.7, y*0.05 - uTime*0.02)));
  // only a few separate rags hang off the wall: broad stretches of every sheet are empty
  a *= smoothstep(0.46, 0.7, sfVN(vec2(u*0.0075 + id*0.61, y*0.011 + id*0.3)));
  float topE = uSfTop - 23.0 + 30.0*sfVN(vec2(lat*0.012, 11.0)) + 14.0*sfVN(vec2(lat*0.05, 4.0));
  a *= 1.0 - smoothstep(topE - 22.0, topE, y);
  a *= smoothstep(0.0, 0.12, vUv.x)*(1.0 - smoothstep(0.88, 1.0, vUv.x))*smoothstep(5.0, 17.0, y);   // none over the plain at the wall's foot: there a rag is only a smear
  float dist = length(cameraPosition - vWp);
  vec3 Vc = (cameraPosition - vWp)/max(dist, 1e-3);
  a *= smoothstep(12.0, 45.0, dist)*(1.0 - smoothstep(170.0, 330.0, dist))*smoothstep(0.5, 0.82, abs(dot(Vc, normalize(vec3(uWind.x, -1.0/uSfLean, uWind.y)))))*uCurtain*0.1;
  if (a < 0.004) discard;
  float hk = clamp(y/max(topE, 1.0), 0.0, 1.0);
  vec3 col = snowLit(0.2 + 0.5*hk)*0.85 + uRimCol*(0.08 + 0.26*smoothstep(0.45, 0.95, hk));
  col = min(wGrade(col), vec3(0.9));
  vec4 f = sfFogRay(cameraPosition, vWp, 1.0);
  gl_FragColor = vec4(mix(col, f.rgb, f.a*0.85), a);
}`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 5; m.name = 'snow-curtain';
  return m;
}

// spindrift off the cliff top: a few separate plumes at the horns and the crest's high points, each blown out
// from the lip, collapsing into a thin tail of glitter that sinks down the face. Clear ice between them.
function makeVeils(rng, shared, topAt, count) {
  const g = new THREE.InstancedBufferGeometry();
  const vp = [], vi = [], VS = 12;
  for (let i = 0; i <= VS; i++) vp.push(-0.5, i / VS, 0, 0.5, i / VS, 0);
  for (let i = 0; i < VS; i++) { const o = i * 2; vi.push(o, o + 1, o + 3, o, o + 3, o + 2); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); g.setIndex(vi);
  const a = new Float32Array(count * 8), b = new Float32Array(count * 8);
  const spots = [-22, 21, -150, -112, -78, -50, 53, 86];   // [0] the north horn, [1] the south horn
  let n = 0;
  for (let i = 0; i < count; i++) {
    let v = spots[i % spots.length] + (i < 2 ? rng.range(-1.5, 1.5) : rng.range(-9, 9));
    // climb to the local high point of the crest
    for (let k = 0; k < 6; k++) { const up = topAt(v + 2), dn = topAt(v - 2), here = topAt(v); if (up > here && up >= dn) v += 2; else if (dn > here) v -= 2; }
    if (Math.abs(v) < 19) v = (v < 0 ? -1 : 1) * 20;
    const top = topAt(v); if (top < 12) continue;
    a[n * 4] = CLIFF.x0 - CLIFF.k * v * v - rng.range(2.5, 4.5); a[n * 4 + 1] = top; a[n * 4 + 2] = CLIFF.zN + v; a[n * 4 + 3] = rng.range(9, 14);
    b[n * 4] = rng(); b[n * 4 + 1] = rng.range(0.6, 1); b[n * 4 + 2] = rng.range(0.7, 1.3); b[n * 4 + 3] = 0; n++;
  }
  // a banner of spindrift off each horn, anchored on the peak itself (its randoms are derived, not drawn)
  // (only the two horns fly one: above the long crest the others were pale ribbons adrift in the sky. The north
  // horn's is short, so it has dissolved nine metres before the ring's axis)
  for (let i = 0, nv = Math.min(n, 2); i < nv; i++) {
    a[n * 4] = a[i * 4] + 6; a[n * 4 + 1] = a[i * 4 + 1]; a[n * 4 + 2] = a[i * 4 + 2]; a[n * 4 + 3] = a[i * 4 + 3];
    b[n * 4] = (b[i * 4] * 7.31) % 1; b[n * 4 + 1] = (b[i * 4 + 1] * 3.17) % 1; b[n * 4 + 2] = i === 0 ? 0.45 : 1; b[n * 4 + 3] = 1; n++;
  }
  g.setAttribute('aV', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aR', new THREE.InstancedBufferAttribute(b, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
attribute vec4 aV, aR; uniform float uTime;
varying vec3 vWp; varying vec4 vU; varying float vK;
void main(){
  // aR.w = 0: a veil hanging down the face from the lip.  aR.w = 1: a wisp of spindrift that leaves the crest and is
  // drawn out downwind (to the right as the camera sees it) as a banner: it lifts a few metres, levels off, frays and dissolves
  float f = position.y, out2 = (1.0 - f)*(1.0 - f);
  vec3 veil = vec3(aV.x - 2.0 - 5.0*out2 + sin(uTime*0.2 + aR.x*30.0 + f*2.0)*0.8, f*aV.y, aV.z + position.x*aV.w*(0.55 + 0.45*f) + 4.0*out2*(aR.y - 0.3));
  // (a plume, not a thread: two metres thick where it leaves the crest and eight to ten further out, and never
  // thinner than a few pixels however far off it is seen)
  float len = (13.0 + 7.0*aR.y)*mix(0.7, 1.0, aR.z);
  vec3 root = vec3(aV.x - 1.0 + 5.0*f, aV.y - 0.8 + (2.0 + 2.0*aR.x)*(1.0 - exp(-2.2*f)) + 1.0*f*sin(uTime*0.5 + aR.x*40.0 + f*6.0), aV.z - 0.5 + len*f);
  float thick = max((2.6 + 6.5*f)*(0.75 + 0.5*aR.y)*mix(0.7, 1.0, aR.z), length(cameraPosition - root)*0.012);
  vec3 wisp = root + vec3(0.0, position.x*thick*(1.0 + 0.4*position.x), 0.0);
  vWp = mix(veil, wisp, aR.w); vK = aR.w;
  vU = vec4(position.x, position.y, aR.x, aV.y);
  gl_Position = projectionMatrix*viewMatrix*vec4(vWp, 1.0);
}`,
    fragmentShader: /* glsl */`
uniform float uTime, uVeil;
${WL_GLSL}
${SF_GLSL}
varying vec3 vWp; varying vec4 vU; varying float vK;
void main(){
  float y = vWp.y, zz = vWp.z, top = vU.w;
  float px = length(fwidth(vWp));
  float fall = uTime*5.5;
  float n = sfVN(vec2(zz*0.22 + vU.z*30.0, (y + fall)*0.07)), n2 = sfVN(vec2(zz*0.9 + vU.z*11.0, (y + fall*1.3)*0.16));
  float body = smoothstep(0.3, 0.8, n*0.7 + n2*0.45);
  // the veil is thickest in the top two fifths of the face and is gone before the lip; below it only a thin tail
  float plume = smoothstep(top*0.8, top*0.95, y)*(1.0 - smoothstep(0.84, 0.99, vU.y));
  float ex = clamp(1.0 - 4.0*vU.x*vU.x, 0.0, 1.0);
  float tail = 0.0;   // (no tail down the face: against the dark ice it read as a pale ray drawn over the cliff)
  float a = body*(ex*ex*plume + tail*(1.0 - plume))*smoothstep(0.02, 0.2, vU.y)*uVeil;
  // the wisp: streaks drawn along its length, streaming away from the crest, torn, fading out well before its end
  float t = vU.y;
  // (both edges feathered and eaten by the same scrolling noise that tears its body; brightest at the crest)
  float w1 = sfVN(vec2(t*3.4 - uTime*0.45 + vU.z*30.0, vU.x*2.6 + vU.z*7.0)), w2 = sfVN(vec2(t*5.0 - uTime*0.95 + vU.z*11.0, vU.x*13.0 + 3.0));
  float aw = smoothstep(0.25, 0.85, w1*0.6 + w2*0.5 + 0.25*ex)*ex*ex*smoothstep(0.0, 0.12, t)*(1.0 - t)*(1.0 - t)*uVeil*1.2;
  a = mix(a, aw, vK); plume = mix(plume, 0.6, vK);
  vec2 gc = vec2(zz, y + fall*0.8)*2.4; vec2 gi = floor(gc);
  float gh = sfHash(gi + vU.z*57.0);
  vec2 gj = vec2(sfHash(gi + 3.1), sfHash(gi + 9.7))*0.6 + 0.2;
  float spark = step(0.925, gh)*(1.0 - smoothstep(0.03, 0.14, length(fract(gc) - gj)))*(0.5 + 0.5*sin(uTime*5.0 + gh*200.0));
  spark *= (1.0 - smoothstep(0.05, 0.2, px))*ex*ex*(1.0 - smoothstep(top*0.98, top*1.08, y))*uVeil*(1.0 - vK);
  vec3 col = wGrade(uRimCol*(0.62 + 0.4*plume) + uSkyCol*0.4);
  float al = clamp(a*0.2 + spark*0.8, 0.0, 1.0);
  al *= smoothstep(22.0, 85.0, length(cameraPosition - vWp))*mix(1.0, 0.5, step(-220.0, zz)*(1.0 - vK));
  if (al < 0.004) discard;
  // laid over what is behind it more than it covers it (premultiplied, a third of its own cover), so a plume
  // brightens the ice and never darkens a cloud
  gl_FragColor = vec4(sfApply(col + wGrade(uRimCol)*spark*1.6, vWp)*al, al*0.35);
}`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 3; m.name = 'spindrift-veils';
  return m;
}

// snow petrels wheeling round the horns of the notch, never nearer than 9 m to the portal's axis
const PETREL_FRAG = /* glsl */`
${WL_GLSL}
${SF_GLSL}
varying vec3 vWp, vN, vL; varying float vC;
// a SHADED bird, never a white blade: every facet takes its own light (the wing is bent at the wrist, so its two
// halves differ), the underwing is grey, the flight feathers along the trailing edge and the tips are darker, the
// bill and the eye are black
void main(){
  vec3 up = normalize(vN + vec3(0.0, 1e-4, 0.0));
  vec3 V = normalize(cameraPosition - vWp + vec3(0.0, 1e-4, 0.0));
  vec3 N = normalize(cross(dFdx(vWp), dFdy(vWp)) + up*1e-6);
  if (dot(N, V) < 0.0) N = -N;
  float under = 1.0 - smoothstep(-0.2, 0.2, dot(N, up));
  float w = clamp(abs(vL.x)/0.58, 0.0, 1.0), wing = smoothstep(0.05, 0.12, abs(vL.x));
  vec3 alb = vec3(0.8, 0.8, 0.83);
  alb *= mix(1.0, 0.56, under*wing);                                       // the underwing in its own shade
  alb *= 1.0 - 0.34*wing*(1.0 - smoothstep(-0.05, 0.0, vL.z - 0.06*w));    // flight feathers
  alb *= 1.0 - 0.3*smoothstep(0.72, 1.0, w);
  alb *= 1.0 - 0.22*(1.0 - wing)*(1.0 - smoothstep(-0.04, 0.0, vL.y));             // the belly
  alb = mix(alb, vec3(0.03), smoothstep(0.55, 0.9, vC));
  alb = mix(alb, vec3(0.02), 1.0 - smoothstep(0.011, 0.02, length(vec3(abs(vL.x) - 0.04, vL.y - 0.026, vL.z - 0.105))));
  float kd = clamp(dot(N, uKeyDir)*0.5 + 0.5, 0.0, 1.0);
  vec3 col = alb*(mix(uGroundCol*1.5, uSkyCol*1.2, N.y*0.5 + 0.5) + uKeyCol*0.8*kd)*mix(0.55, 1.0, kd);
  col += alb*uMoonCol*max(dot(N, uMoonDir), 0.0)*1.2;
  col *= 1.12/(1.0 + dot(col, vec3(0.3, 0.55, 0.15)));                      // white with form: nothing on it burns out
  gl_FragColor = vec4(sfApply(wGrade(col), vWp), 1.0);
}`;
// the bird: a body of two rings, a tail fan, and a wing of three panels a side (arm, hand, tip) with the wrist carried
// forward; aW runs 0 at the root to 1 at the tip and PETREL_WING bends the wing by it
const PETREL_WING = /* glsl */`
  float w = abs(aW);
  vec3 q = position; q.y += 0.27*w*(1.62 - w) + flap*0.34*w*w;      // a gull's M: the arm rises 30 degrees to the wrist, the hand lies level, and beats
`;
function petrelGeometry() {
  const pos = [], col = [], aw = [], idx = [];
  const V = (x, y, z, c, w) => { pos.push(x, y, z); col.push(c); aw.push(w); return pos.length / 3 - 1; };
  const nose = V(0, 0, 0.2, 1, 0), tail = V(0, 0.005, -0.25, 0, 0);
  const r1 = [V(0.07, 0, 0.06, 0, 0), V(0, 0.07, 0.05, 0, 0), V(-0.07, 0, 0.06, 0, 0), V(0, -0.066, 0.05, 0, 0)];
  const r2 = [V(0.058, 0, -0.08, 0, 0), V(0, 0.056, -0.08, 0, 0), V(-0.058, 0, -0.08, 0, 0), V(0, -0.05, -0.08, 0, 0)];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    idx.push(r1[i], r1[j], nose, r1[j], r1[i], r2[i], r1[j], r2[i], r2[j], r2[j], r2[i], tail);
  }
  const tl = V(0.08, 0.006, -0.31, 0, 0), tr = V(-0.08, 0.006, -0.31, 0, 0), tb = V(0, 0.02, -0.12, 0, 0); idx.push(tb, tl, tr);
  for (const s of [1, -1]) {
    const a = V(s * 0.04, 0.02, 0.1, 0, 0), b = V(s * 0.04, 0.02, -0.085, 0, 0), c = V(s * 0.27, 0.02, 0.135, 0, s * 0.48), d = V(s * 0.27, 0.02, -0.035, 0, s * 0.48);
    const f = V(s * 0.43, 0.02, 0.085, 0, s * 0.76), h = V(s * 0.42, 0.02, -0.03, 0, s * 0.76), e = V(s * 0.58, 0.02, -0.035, 0.35, s);
    idx.push(a, c, b, b, c, d, c, f, d, d, f, h, f, e, h);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 1)); g.setIndex(idx);
  return g;
}
// THE PASS (32-39 s): a few petrels come by the lens from behind on its left, a wingspan filling a quarter of the
// frame, and fly on up the dark face to the north horn. list: [x, y, z, seconds, vx, vy, vz] = where a bird is at
// that second and its velocity; uPassT is the flight's clock (u x 42 s), so a still at any u finds them in place.
// Each also weaves and beats its wings on world time. Their lines stay left of the ring on screen and at least
// nine metres from its axis.
function makePetrelPass(shared, list) {
  const g = petrelGeometry(), n = list.length;
  const o = new Float32Array(n * 4), v = new Float32Array(n * 4);
  list.forEach((b, i) => { o.set([b[0], b[1], b[2], b[3]], i * 4); v.set([b[4], b[5], b[6], 0.13 + 0.61 * ((i * 0.618) % 1)], i * 4); });
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(o, 4)); g.setAttribute('aP', new THREE.InstancedBufferAttribute(v, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: shared, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 aO, aP; attribute float aCol, aW; uniform float uTime, uPassT;
varying vec3 vWp, vN, vL; varying float vC;
void main(){
  float dtm = uPassT - aO.w, ph = aP.w*40.0;
  vec3 vel = aP.xyz; float sp = max(length(vel), 1e-3);
  vec3 fw = vel/sp, rt = normalize(vec3(-fw.z, 0.0, fw.x) + vec3(1e-4, 0.0, 0.0)), up = cross(rt, fw);
  float wv = sin(uTime*0.9 + ph), wv2 = sin(uTime*1.3 + ph*1.7);
  vec3 c = aO.xyz + vel*dtm + rt*wv*1.1 + up*wv2*0.55;
  float glide = smoothstep(-0.2, 0.6, sin(uTime*0.7 + ph*2.3));
  float flap = sin(uTime*(8.0 + 2.0*fract(ph*0.31)) + ph)*(0.6 + 0.4*glide);
${PETREL_WING}
  // it banks its back toward a lens that is level with it or above it (a wing seen along its own plane is a scratch)
  vec3 vd = normalize(cameraPosition - c + vec3(0.0, 1e-4, 0.0));
  float bank = 0.25 + 0.35*sin(uTime*0.9 + ph) - 0.6*dot(rt, vd)*smoothstep(-0.45, 0.05, dot(up, vd)), cb = cos(bank), sb = sin(bank);
  q.xy = vec2(q.x*cb - q.y*sb, q.x*sb + q.y*cb);
  // (gone before it comes and once it is a speck over the horn: it shrinks to nothing, far from the lens)
  float sc = 2.0*smoothstep(-3.0, -2.2, dtm)*(1.0 - smoothstep(5.2, 6.6, dtm));
  vec3 wp = c + (rt*q.x + up*q.y + fw*q.z)*sc;
  vWp = wp; vC = aCol; vL = position; vN = normalize(up*cb - rt*sb);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: PETREL_FRAG,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'petrel-pass';
  return m;
}
function makePetrels(rng, shared, count) {
  const g = petrelGeometry();
  const o = new Float32Array(count * 4), p = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const south = i % 2 === 0, vz = (south ? 1 : -1) * rng.range(21, 26), z = CLIFF.zN + vz;
    o[i * 4] = CLIFF.x0 + rng.range(-7, 5); o[i * 4 + 1] = rng.range(44, 60); o[i * 4 + 2] = z; o[i * 4 + 3] = rng.range(5, 9.5);
    p[i * 4] = rng() * 6.283; p[i * 4 + 1] = rng.sign() * rng.range(0.55, 0.9); p[i * 4 + 2] = rng.range(1, 3.5); p[i * 4 + 3] = rng.range(1.9, 2.4);
  }
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(o, 4)); g.setAttribute('aP', new THREE.InstancedBufferAttribute(p, 4)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    uniforms: shared, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 aO, aP; attribute float aCol, aW; uniform float uTime;
varying vec3 vWp, vN, vL; varying float vC;
void main(){
  float a = aP.x + uTime*aP.y;
  vec3 c = aO.xyz + vec3(cos(a)*aO.w, sin(a*0.7 + aP.x*3.0)*aP.z, sin(a)*aO.w*0.8);
  float sg = aP.y < 0.0 ? -1.0 : 1.0;
  vec2 f = normalize(vec2(-sin(a)*aO.w, cos(a)*aO.w*0.8))*sg;
  float flap = sin(uTime*(7.0 + 2.0*fract(aP.x*3.1)) + aP.x*20.0)*(0.3 + 0.7*smoothstep(-0.3, 0.5, sin(uTime*0.55 + aP.x*11.0)));
${PETREL_WING}
  float bank = 0.5*sg, cb = cos(bank), sb = sin(bank);
  q.xy = vec2(q.x*cb - q.y*sb, q.x*sb + q.y*cb);
  vec3 fw = vec3(f.x, 0.0, f.y), rt = vec3(-f.y, 0.0, f.x);
  vec3 wp = c + (rt*q.x + vec3(0.0, 1.0, 0.0)*q.y + fw*q.z)*aP.w;
  vWp = wp; vC = aCol; vL = position; vN = normalize(vec3(-sb*rt.x, cb, -sb*rt.z));
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
}`,
    fragmentShader: PETREL_FRAG,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'snow-petrels';
  return m;
}

// ---------------------------------------------------------------- 8. the world
export default {
  id: 'emperor-clearing',
  name: 'The Huddle',
  category: 'ocean',
  weirdness: 0.1,
  media: ['air', 'snow'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, vary = ctx.vary || {};
    const detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);

    // ---- seeded moods
    const mr = rng.fork('moods');
    const sr = mr();
    const mood = {
      cloud: mr.pick(['scales', 'sheet', 'train', 'train']),
      hour: vary.hour === 'night' ? 'deep' : (vary.hour && vary.hour !== 'any') ? 'bright' : (mr.chance(0.5) ? 'deep' : 'bright'),
      storm: mr.pick(['blizzard', 'blizzard', 'snowfall', 'rime']),
      season: sr < 0.5 ? 'august' : sr < 0.8 ? 'september' : 'july',
      berg: mr.chance(0.62) ? 'tabular' : 'overturned',
      rare: !!vary.rare,
    };
    const deep = mood.hour === 'deep';
    const STORM = {
      // sat is the floor of the saturation clamp while it blows: the snow, the murk and the birds keep a slate-violet
      // cast under a sky that already shows its colour above the drift
      blizzard: { dense: 0.036, colA: '#56527E', colB: '#C4C2D8', sat: 0.55, snake: 1, stream: 1 },
      snowfall: { dense: 0.032, colA: '#514E78', colB: '#BDBBD2', sat: 0.55, snake: 0.6, stream: 0.55 },
      rime: { dense: 0.044, colA: '#4E5A84', colB: '#B4C4E0', sat: 0.6, snake: 0.45, stream: 0.4 },
    }[mood.storm];

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#2a2940');
    await ctx.yield();
    const path = makePath(makePts(mood.season === 'july'));
    await ctx.yield();
    const AHEAD = 25;

    // ---- shared uniforms
    const time = { value: 0 };
    const sunB = bearingXZ(50);
    const FOGU = {
      uSfEdge: { value: FOOT_S21 - 21 * 20 }, uSfLean: { value: 1.5 }, uSfDense: { value: STORM.dense }, uSfHaze: { value: 0.0012 }, uSfTime: time, uSfTop: { value: 58 },
      uSfThin: { value: 0.15 }, uSfHs: { value: 10 }, uSfWall: { value: 0 },
      uMoonDir: { value: MOON.clone() }, uMoonCol: { value: C('#FFB878', 0.42) }, uSfGlow: { value: new THREE.Color(0, 0, 0) }, uSfGlowDir: { value: new THREE.Vector3(0.45, 0.17, -0.87).normalize() },
      uSfColA: { value: C(STORM.colA) }, uSfColB: { value: C(STORM.colB) }, uSfHazeCol: { value: C('#6F6C96', deep ? 0.6 : 0.95) },
      uSfKey: { value: new THREE.Vector2(sunB[0], sunB[1]) },
    };
    const moon0 = FOGU.uMoonCol.value.clone();
    const glow0 = C('#BFEBD9', 0.26).lerp(C('#F3A6C8', 0.26), 0.38);      // the ring's mint and the bank's rose, soaking through the snow
    const fogA0 = C(STORM.colA), fogB0 = C(STORM.colB), fogA1 = C('#474C72', deep ? 0.66 : 0.88), fogB1 = C('#D9D2E2', deep ? 0.6 : 0.72);

    // ---- the hero: the huddle at H, no rotation, sharing the world's fog
    const hero = await buildHero(ctx, {
      palette: PALETTE, season: mood.season, duration: DURATION, ground: false, rareBreak: mood.rare,
      fog: { uniforms: FOGU, parsVertex: '', vertex: '', parsFragment: SF_GLSL, fragment: 'gl_FragColor.rgb = sfApply(gl_FragColor.rgb, vWp);' },
    });
    hero.object.position.copy(H);
    scene.add(hero.object);
    const U = hero.uniforms;
    U.uEcMoonDir = FOGU.uMoonDir; U.uEcMoonCol = FOGU.uMoonCol;      // the same uniform objects: the birds take the moon's warm rim
    await ctx.yield();

    const wx = { uFlow: { value: 0 }, uCalm: { value: 0 }, uSnake: { value: 1 }, uStream: { value: 1 }, uCurtain: { value: 1 }, uVeil: { value: 0 }, uCover: { value: 1 }, uPassT: { value: 0 }, uTime: time };
    const shared = Object.assign({
      uSnowC: { value: C(PALETTE[2], 0.8) }, uWind: { value: new THREE.Vector2(WIND[0], WIND[1]) },
      uKeyDir: U.uKeyDir, uKeyCol: U.uKeyCol, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uRimCol: U.uRimCol, uSat: U.uSat,
    }, wx, FOGU);

    // ---- cast on the approach: forty stragglers in files, leaning into the wind (hero-local coordinates)
    const fdir = [-WIND[0], -WIND[1]], upYaw = Math.atan2(fdir[0], fdir[1]), DRIFT = 0.2;
    const cr = rng.fork('cast'), strag = [];
    const addFile = (x, z, n, tPass, back, gap = 1, under = false, dir = fdir) => {
      for (let i = 0; i < n; i++) {
        const k = (back ? -1 : 1) * i * gap * cr.range(0.85, 1.2);
        strag.push({ wx: x + dir[0] * k + cr.range(-0.15, 0.15), wz: z + dir[1] * k + cr.range(-0.1, 0.1), yaw: upYaw + cr.range(-0.3, 0.3), scale: cr.range(0.93, 1.07), lean: 0.26 + cr.range(-0.06, 0.06), walk: 1, tPass, under });
      }
    };
    addFile(-2.6, -19.6, 3, 1.0, false);          // the entry group, beside the entry slab on the path side
    const tp = new THREE.Vector3(), tt = new THREE.Vector3();
    // files placed for the camera: [seconds at which it is seen, metres ahead of the lens then, metres to the right
    // of the path, birds, file runs back toward the lens?, spacing]. 3.4 s: three at arm's length on the paler side;
    // 6.7 s: five seen from the rise; 8.3 and 9.4 s: passing close on the drop; 10.5 s: a file strung out ahead on
    // the left among the ridges (along the path, not the wind: a file that marches upwind there is seen end-on, one
    // bird hiding the next); 12.3 and 13.2 s: the last before the huddle
    [[3.36, 6.6, 2.35, 3, true, 1], [6.72, 13.5, 5.2, 5, true, 1.25], [8.3, 0, -3.4, 2, false, 1], [9.4, 0, 2.6, 3, true, 1],
      [10.5, 4.9, -2.35, 4, false, 2.0, 1], [12.3, 0, 3.2, 3, true, 1], [13.15, 0, -3.1, 2, false, 1]].forEach(([t, ahead, lat, n, back, gap, along]) => {
      path.pointAt(t / DURATION, tp); path.tangentAt(t / DURATION, tt); tt.y = 0; tt.normalize();
      addFile(tp.x + tt.x * ahead - tt.z * lat, tp.z + tt.z * ahead + tt.x * lat, n, t, back, gap, false, along ? [tt.x, tt.z] : fdir);
    });
    // July (one disc, no tail to fly up): a file of four strung out ahead of the lens at 14.3 s, walking in toward
    // the huddle, dark in front of its band. The camera crosses them at 5.5 m
    if (mood.season === 'july') { path.pointAt(14.28 / DURATION, tp); addFile(tp.x + 0.5, tp.z - 11, 4, 14.28, false, 2.5, true); }
    const late = [];
    if (mood.season === 'july') {
      // (their own generator: no draw from the cast's)
      const lr = rng.fork('latecomers');
      for (let i = 0; i < 64; i++) {
        const f = (i + lr.range(0, 0.8)) / 64, z = lerp(49, 23.5, f), x = lerp(5.6, 3.2, f) + lr.range(-1.15, 1.15) + 0.9 * Math.sin(z * 0.31);
        late.push({ x, z, yaw: Math.PI + lr.range(-0.25, 0.25), scale: lr.range(0.93, 1.07), lean: 0.1 + lr.range(-0.03, 0.05), walk: 1 });
      }
    }
    let guard = 0;
    while (strag.length < 40 && guard++ < 300) {
      const z = cr.range(-150, -30), x = cr.range(-15, 15), n = path.nearestXZ(x, z);
      if (n.dist < 4.5 || n.dist > 13 || strag.some((b) => Math.hypot(b.wx - x, b.wz - z) < 6)) continue;
      addFile(x, z, Math.min(cr.int(2, 5), 40 - strag.length), n.u * DURATION, x > 0);
    }
    const flats = [];
    for (const b of strag) {
      const pn = path.nearestXZ(b.wx, b.wz);
      if (!b.under && pn.dist < 2) { path.pointAt(pn.u, tp); b.wx += (b.wx >= tp.x ? 1 : -1) * (2.05 - pn.dist); }   // birds keep 2 m clear of the lens
      flats.push([b.wx, b.wz], [b.wx - fdir[0] * DRIFT * 15, b.wz - fdir[1] * DRIFT * 15]);
      b.x = b.wx - fdir[0] * DRIFT * Math.min(b.tPass, 15) - H.x; b.z = b.wz - fdir[1] * DRIFT * Math.min(b.tPass, 15) - H.z;
    }
    await ctx.yield();
    const stragglers = hero.makeBirds(strag, 0); stragglers.name = 'stragglers'; hero.object.add(stragglers);
    const latecomers = late.length ? hero.makeBirds(late, 0) : null;
    if (latecomers) { latecomers.name = 'latecomers'; hero.object.add(latecomers); }

    // ---- ground (flattened under the stragglers), cliff, slabs and rubble
    await ctx.yield();
    const ground = await makeGround(ctx, rng.fork('ground'), noise, path, U, FOGU, wx, flats);
    scene.add(ground.object);
    await ctx.yield();
    const ice = iceUniforms(U, FOGU, time, mood);
    const cliff = await makeCliff(ctx, noise, mood, ice); scene.add(cliff.object);
    await ctx.yield();
    const blocks = await makeBlocks(ctx, rng.fork('blocks'), path, ice, cliff.topAt, density); scene.add(blocks.object);

    await ctx.yield();
    // ---- walkers and tobogganers between the huddle and the cliff (hero-local, moved on the CPU)
    const wr = rng.fork('walkers'), files = [], walkers = [];
    const nFiles = 10, nWalk = Math.round(150 * density);
    for (let f = 0; f < nFiles; f++) {
      const b = bearingXZ(lerp(66, 150, (f + wr.range(0.15, 0.85)) / nFiles));
      let r1 = 30; while (r1 < 150 && cliffX(H.z + b[1] * r1) - (H.x + b[0] * r1) > 17) r1 += 2;
      files.push({ dx: b[0], dz: b[1], r0: 16.5, L: r1 - 16.5, tob: (mood.season === 'september' ? wr.chance(0.5) : wr.chance(0.25)), dirn: wr.chance(0.72) ? 1 : -1 });
    }
    for (let i = 0; i < nWalk; i++) {
      const f = files[i % nFiles], grp = Math.floor(i / nFiles / 4);
      walkers.push({ f, off: (grp * 0.37 + wr.range(0, 0.1)) * f.L + (i % 4) * 1.4, lat: wr.range(-0.35, 0.35), s: wr.range(0.93, 1.07),
        x: 0, z: 0, yaw: 0, scale: 1, lean: f.tob ? 1.38 : 0.1, walk: f.tob ? 0 : 1, headUp: 1 });
    }
    const walkMesh = hero.makeBirds(walkers, 2); walkMesh.name = 'walkers'; hero.object.add(walkMesh);
    // ---- a broken line of pressure ice across the foreground of the last approach (33-37 s): slabs two to five metres
    // tall either side of the path, 7.5 m clear of it and off the walkers' lanes, so the lower edge of the cliff views
    // is a dark, snow-capped rock line (their own generator; the slabs' geometry and material)
    {
      const fr = rng.fork('foreground'), fgl = [];
      let fg = 0;
      while (fgl.length < 20 && fg++ < 700) {
        const uu = fr.range(0.8, 0.905), lat = fr.sign() * fr.range(7.5, 20), hh = fr.range(2.2, 4.9), ww = fr.range(0.7, 1.2), th = fr.range(0.5, 0.8), yaw = fr.range(0, Math.PI * 2), tilt = fr.range(0.15, 0.6), roll = fr.range(-0.3, 0.3);
        path.pointAt(uu, tp); path.tangentAt(uu, tt); tt.y = 0; tt.normalize();
        const x = tp.x - tt.z * lat, z = tp.z + tt.x * lat, rx = x - H.x, rz = z - H.z;
        if (path.nearestXZ(x, z).dist < 7.5 || cliffX(z) - x < 16 || fgl.some((b) => Math.hypot(b.x - x, b.z - z) < 5.5)) continue;
        if (files.some((f) => rx * f.dx + rz * f.dz > 10 && Math.abs(rx * f.dz - rz * f.dx) < 3.2)) continue;
        fgl.push({ x, z, h: hh, w: hh * ww, t: th * (0.55 + 0.45 * hh), yaw, tilt, roll });
      }
      const src = blocks.object.children[0], fgm = new THREE.InstancedMesh(src.geometry, src.material, Math.max(fgl.length, 1));
      const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
      fgl.forEach((b, i) => { e4.set(b.tilt, b.yaw, b.roll, 'YXZ'); q4.setFromEuler(e4); s4.set(b.w, b.h, b.t); p4.set(b.x, -0.1, b.z); fgm.setMatrixAt(i, m4.compose(p4, q4, s4)); });
      fgm.count = fgl.length; fgm.instanceMatrix.needsUpdate = true; fgm.frustumCulled = false; fgm.name = 'foreground-ice'; scene.add(fgm);
    }
    const wInst = walkMesh.geometry.getAttribute('aInst'); wInst.setUsage(THREE.DynamicDrawUsage);
    const moveWalkers = (t) => {
      const a = wInst.array;
      for (let i = 0; i < walkers.length; i++) {
        const w = walkers[i], f = w.f, sp = f.tob ? 1.7 : 0.42;
        let d = (w.off + t * sp * f.dirn) % f.L; if (d < 0) d += f.L;
        const r = f.r0 + d, o = i * 4;
        a[o] = f.dx * r - f.dz * w.lat; a[o + 1] = f.dz * r + f.dx * w.lat; a[o + 2] = Math.atan2(f.dx * f.dirn, f.dz * f.dirn);
        a[o + 3] = w.s * smoothstep(0, 2.5, d) * smoothstep(0, 2.5, f.L - d);
      }
      wInst.needsUpdate = true;
    };
    moveWalkers(0);
    await ctx.yield();

    // ---- sky, weather, air
    const sky = makeSkyDome(rng.fork('sky'), mood, FOGU, time, { uFlow: wx.uFlow, uSnake: wx.uSnake, uSnowC: shared.uSnowC, uSkyCol: U.uSkyCol, uGroundCol: U.uGroundCol, uKeyCol: U.uKeyCol, uSat: U.uSat }); scene.add(sky.object);
    const skyU = sky.uniforms, skyZ0 = skyU.uZenith.value.clone(), skyM0 = skyU.uMid.value.clone(), skyZ1 = C(deep ? '#14103A' : '#1A1546'), skyM1 = C(deep ? '#251B50' : '#30256A'), viv0 = skyU.uVivid.value, viv1 = deep ? 1.2 : 1.0;
    scene.add(makeShells(shared));
    await ctx.yield();
    scene.add(makeStreamers(rng.fork('streamers'), shared, Math.round(40 * Math.max(detail, 0.75))));
    await ctx.yield();
    const curtain = makeCurtain(shared); scene.add(curtain);
    scene.add(makeVeils(rng.fork('veils'), shared, cliff.topAt, 8));
    scene.add(makePetrels(rng.fork('petrels'), shared, 16));
    await ctx.yield();
    const big = mood.storm === 'snowfall';
    const blow = fx.makeParticles({
      rng: rng.fork('blow'), count: Math.round((mood.storm === 'rime' ? 3200 : 6000) * detail * density), box: [64, 26, 64], time, fog: false,
      mode: big ? 'billboard' : 'streak', shape: big ? 'flake' : 'streak', stretch: 0.06,
      velocity: big ? [5.5, -3.2, 9.5] : [WIND[0] * 20, -0.5, WIND[1] * 20], velocityRandom: big ? [2.5, 1.2, 2.5] : [3, 1.4, 3], turbulence: [0.7, 0.3, 0.6],
      size: big ? [0.06, 0.17] : [0.03, 0.075], colors: ['#c8c7d6', '#e2e1ec', '#a9a7bb'], intensity: 0.8, opacity: 0.85, additive: 0.1, near: [0.6, 3],
    });
    scene.add(blow.object);
    await ctx.yield();
    const glitter = fx.makeParticles({
      // (pin points: none is drawn within five metres of the lens, where a crystal is a soft oval like dust on the glass)
      rng: rng.fork('glitter'), preset: 'snow', count: Math.round(5600 * detail * density), box: [80, 50, 80], time, fog: false, shape: 'sparkle',
      velocity: [0.15, -0.8, 0.25], velocityRandom: [0.25, 0.3, 0.25], turbulence: [0.3, 0.1, 0.5], size: [0.008, 0.021], twinkle: 0.7,
      colors: ['#f4ecf6', '#f3c9dc', '#c6efe0'], intensity: 2.6, opacity: 0.9, additive: 0.8, near: [5, 12],
    });
    glitter.setOpacity(0); scene.add(glitter.object);
    await ctx.yield();
    // ---- the modelled sastrugi beside the route (their generator is the LAST fork taken from ctx.rng: no earlier deal changes)
    {
      // the route's line in half metres of route metres, produced 25 m back through the entry along its own first heading
      // (the eye of the world before arrives along it): metres from it in the plan, and its height there
      const RN = Math.ceil(path.length / 0.5), RB = 50, rx = new Float32Array(RB + RN + 1), ry = new Float32Array(RB + RN + 1), rz = new Float32Array(RB + RN + 1);
      path.pointAt(0, tp); path.tangentAt(0, tt); tt.y = 0; tt.normalize();
      for (let i = 0; i < RB; i++) { rx[i] = tp.x - tt.x * (RB - i) * 0.5; ry[i] = tp.y; rz[i] = tp.z - tt.z * (RB - i) * 0.5; }
      for (let i = 0; i <= RN; i++) { if (i % 200 === 0) await ctx.yield(); path.posAtDist(Math.min(i * 0.5, path.length), tp); rx[RB + i] = tp.x; ry[RB + i] = tp.y; rz[RB + i] = tp.z; }
      const nearOut = { dist: 0, y: 0 };
      const near = (x, z) => {      // (every four metres first, then every half metre round the nearest of those)
        let best = Infinity, bi = 0;
        for (let i = 0; i < rx.length; i += 8) { const dx = rx[i] - x, dz = rz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
        for (let i = Math.max(bi - 8, 0), i1 = Math.min(bi + 8, rx.length - 1); i <= i1; i++) { const dx = rx[i] - x, dz = rz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
        nearOut.dist = Math.sqrt(best); nearOut.y = ry[bi]; return nearOut;
      };
      // the low leg: the three knots of the path that follow its crossing of the tail (beyond the tail, the turn, the foot of the climb)
      const knots = makePts(mood.season === 'july'), iT = knots.findIndex((k) => k[2] === TAILZ), leg = knots.slice(iT + 1, iT + 4);
      // the colony's ground: nothing within 12 m of the huddle's own outline (the stain's reach), whole from 18 m; on a day
      // of the rare break the flock opens out from H to as much as 1.6 times each bird's distance, and that ground is the colony's too
      const hud = U.uHud.value, ts = U.uTailSeg.value, tail = hud.y > 0.5;
      const colony = (x, z) => {
        const lx = x - H.x, lz = z - H.z;
        let sd = Math.hypot(lx, lz) - hud.x;
        if (tail) { const ex = ts.z - ts.x, ez = ts.w - ts.y, k = clamp(((lx - ts.x) * ex + (lz - ts.y) * ez) / (ex * ex + ez * ez), 0, 1); sd = Math.min(sd, Math.hypot(lx - ts.x - ex * k, lz - ts.y - ez * k) - lerp(hud.z, 1.1, k)); }
        let c = smoothstep(12, 18, sd);
        if (mood.rare) {
          let sr = Math.hypot(lx, lz) - 1.6 * (hud.x + 4.5);
          if (tail) sr = Math.min(sr, ptSeg(lx, lz, ts.x, ts.y, 1.6 * ts.z, 1.6 * ts.w) - (2 * hud.z + 1));
          c *= smoothstep(4, 10, sr);
        }
        return c;
      };
      // the lines birds walk: each straggler's three metres up the wind, each latecomer's shuffle (and, on a day of the rare
      // break, its way out from H), the walkers' files from the huddle's rim to their far ends
      const walks = [], wk = mood.rare ? 1.6 : 1;
      for (const b of strag) { const ax = b.x + H.x, az = b.z + H.z; walks.push([ax, az, ax + fdir[0] * DRIFT * 15, az + fdir[1] * DRIFT * 15, 0]); }
      for (const b of late) walks.push([H.x + b.x, H.z + b.z - 0.12 * (DURATION - 29.4), H.x + b.x * wk, H.z + b.z * wk + 0.12 * 29.4, mood.rare ? 0.7 : 0]);
      for (const f of files) walks.push([H.x + f.dx * 8, H.z + f.dz * 8, H.x + f.dx * (f.r0 + f.L) * wk, H.z + f.dz * (f.r0 + f.L) * wk, 0.35 * wk]);
      // slabs: the twenty beside the approach and the foreground ice (read back from its own instances)
      const solids = blocks.list.slice(0, 20).map((b) => ({ x: b.x, z: b.z, w: b.w }));
      const fgm = scene.getObjectByName('foreground-ice'), fm = new THREE.Matrix4();
      for (let i = 0; i < fgm.count; i++) { fgm.getMatrixAt(i, fm); const e = fm.elements; solids.push({ x: e[12], z: e[14], w: Math.hypot(e[0], e[1], e[2]) }); }
      await ctx.yield();
      const sas = await makeSastrugi(ctx, rng.fork('sastrugi'), ground, { near, leg, colony, walks, solids }, U, FOGU, { uCalm: wx.uCalm });
      scene.add(sas.object);
    }
    await ctx.yield();

    // The exit ring is the engine's and is not fogged. A patch in front of it carries the snow's fog along the rays
    // to the ring and writes depth where that fog is thick, so the ring emerges through the ragged face as it leaves.
    const occluder = new THREE.Mesh(new THREE.CircleGeometry(20, 32), new THREE.ShaderMaterial({
      uniforms: Object.assign({ uPortal: { value: PORTAL }, uCover: wx.uCover }, FOGU), transparent: true, depthWrite: true,
      vertexShader: /* glsl */`varying vec3 vWp; varying vec2 vL;
void main(){ vL = position.xy/20.0; vec4 wp = modelMatrix*vec4(position, 1.0); vWp = wp.xyz; gl_Position = projectionMatrix*viewMatrix*wp; }`,
      fragmentShader: /* glsl */`uniform vec3 uPortal; uniform float uCover;
${SF_GLSL}
varying vec3 vWp; varying vec2 vL;
void main(){
  vec3 dv = vWp - cameraPosition; float dl = max(length(dv), 1e-3);
  vec4 f = sfFogRay(cameraPosition, cameraPosition + dv*(length(uPortal - cameraPosition)/dl), 0.0);
  float nz = sfVN(vWp.yz*0.8 + vWp.x*0.6);
  float a = smoothstep(0.12, 0.92, f.a + 0.3*(nz - 0.5)*smoothstep(0.3, 0.6, f.a))*(1.0 - smoothstep(0.45, 0.62, length(vL)));
  a = max(a, uCover*0.72*(1.0 - smoothstep(0.2, 0.6, length(vL))));   // while it blows the ring is only a soft glow in the notch
  if (a < 0.03) discard;
  gl_FragColor = vec4(f.rgb, a);
}`,
    }));
    occluder.renderOrder = 6; occluder.frustumCulled = false; occluder.name = 'portal-fog-patch'; scene.add(occluder);
    const Z = new THREE.Vector3(0, 0, 1), Y_UP = new THREE.Vector3(0, 1, 0);
    // two real lights, only for rides and companions that the engine adds to this scene
    const hemi = new THREE.HemisphereLight('#8E8CA6', '#23233A', 1.0), key = new THREE.DirectionalLight('#E9D8F0', 0.4);
    key.position.set(sunB[0] * 50, 24, sunB[1] * 50); scene.add(hemi, key);

    // ---- gaze: the direction we want (gazeAt), then two pois solved so that the engine's blend lands on it (see below)
    const W0 = 0.8, gp = new THREE.Vector3(), ga = new THREE.Vector3(), gg = new THREE.Vector3(), gt = new THREE.Vector3(), gout = new THREE.Vector3();
    const HUD_T = new THREE.Vector3(H.x + 10, 8, H.z + 4), hudT = new THREE.Vector3();
    const NHORN = new THREE.Vector3(cliffX(H.z - 36) + 2, 40, H.z - 36);     // the north horn's far shoulder: looking at it, the ring leaves the middle of the frame
    const TAU = Math.PI * 2;
    // turn the gaze from `gg` to `gt` by bearing and elevation (k 0..1); way = 1 goes round clockwise (bearing rising),
    // way = 0 the short way. Two directions far apart are never blended through their midpoint (which whips round)
    const swing = (k, way) => {
      const b0 = Math.atan2(gg.x, -gg.z), e0 = Math.asin(clamp(gg.y, -1, 1)), b1 = Math.atan2(gt.x, -gt.z), e1 = Math.asin(clamp(gt.y, -1, 1));
      let db = b1 - b0; db -= TAU * Math.floor(db / TAU); if (!way && db > Math.PI) db -= TAU;
      const b = b0 + db * k, e = e0 + (e1 - e0) * k, ce = Math.cos(e);
      gg.set(Math.sin(b) * ce, Math.sin(e), -Math.cos(b) * ce);
    };
    const gazeAt = (u) => {
      const t = u * DURATION, d = u * path.length;
      path.posAtDist(d, gp); path.posAtDist(d + AHEAD, ga); ga.sub(gp).normalize(); gg.copy(ga);
      // on the rise the gaze swings right and levels: the plain under the drift, the berg and the sky over it
      const k0 = smoothstep(4.3, 6.3, t) * (1 - smoothstep(7.4, 9.4, t));
      if (k0 > 0) { gt.set(0.4, 0.015, -0.91).normalize(); gg.lerp(gt, k0 * 0.92).normalize(); }
      // the gaze stays level on the huddle's band until the lens is at the tail tip, then drops to the birds as they
      // come under it (July, with no tail: at the body's rim)
      const k1 = (mood.season === 'july' ? smoothstep(15.3, 17.0, t) : smoothstep(14.0, 15.7, t)) * (1 - smoothstep(18.2, 21.2, t));
      if (k1 > 0) { gt.copy(ga); gt.y = 0; gt.normalize().multiplyScalar(8.5).add(gp); gt.y = 0.9; gt.sub(gp).normalize(); gg.lerp(gt, k1).normalize(); }
      // THE REVEAL: as the wind dies the gaze comes round over the right shoulder, across the cliff's glow in the
      // murk, and by 21 s looks straight downwind over the crowd at the departing wall; then it holds the huddle
      // through the spiral and lets go of it over the tail
      // (the sweep takes five and a half seconds and is never faster than fifty degrees a second)
      const kin = smoothstep(16.2, 21.8, t), kout = 1 - smoothstep(27.6, 30.2, t);
      if (kin > 0 && kout > 0) {
        hudT.copy(HUD_T); hudT.y += 3.2 * (1 - smoothstep(21.2, 24.5, t));
        gt.copy(hudT).sub(gp).normalize();
        if (kout < 1) swing(kout, 0); else swing(kin, 1);
      }
      // over the tail: the body ahead on the left, the cliff and the ring coming in on the right
      const kt = smoothstep(27.6, 30.2, t) * (1 - smoothstep(30.6, 33.4, t));
      if (kt > 0) { gt.set(H.x + 74, 6, H.z - 6).sub(gp).normalize(); swing(kt, 0); }
      // then the ring, seen from below (the gaze rests under it, on the face), a look left at the north horn and the
      // pearl bank behind it as the climb begins, and the ring itself for the last 40 m
      const k3 = smoothstep(30.6, 34.2, t);
      if (k3 > 0) {
        // (from 33 to 35 s it rests lower still, on the cliff's foot: the ring high in the frame, the rubble line and
        // the broken ice of the foreground along its lower edge)
        gt.copy(PORTAL); gt.y -= 11 * (1 - smoothstep(37.0, 39.0, t)) + 11 * smoothstep(30.6, 33.2, t) * (1 - smoothstep(34.4, 36.6, t));
        const kl = smoothstep(34.4, 36.3, t) * (1 - smoothstep(36.9, 39.2, t));
        gt.lerp(NHORN, kl).sub(gp).normalize(); swing(k3 * 0.96, 0);
      }
      return gg;
    };
    // TWO pois, applied by the engine in this order. The second is the gaze: its target is solved so that the sweeping
    // camera's blend lands exactly on gazeAt(u), whatever the first has done. The first, 'route hold', is live only
    // through the spiral (u HOLD_A..HOLD_B) and exists for the STEADY camera, which keeps 0.35 of every poi's weight and
    // looks 85 m down the route: there the route turns left while the reveal's sweep goes round to the right, the
    // gaze poi passes behind the steady camera's own heading and whips it from one side of the route to the other
    // (52.7 degrees a second). The hold is solved so that, after both pulls, the steady camera looks along its own
    // chord turned by an offset that goes evenly from what it is at HOLD_A to what it is at HOLD_B: it then turns
    // no faster than the route does (33 degrees a second). The sweeping camera is unchanged: the gaze poi undoes
    // the hold exactly (it has the reach: weight 0.8). STEADY_AHEAD and STEADY_W are the engine's steady-camera rules
    // (engine.js _pose); if they change, the steady camera only loses some of this smoothing.
    const HOLD_A = 0.34, HOLD_B = 0.62, HOLD_FADE = 0.143, HOLD_W = 0.8, STEADY_W = 0.35;
    const STEADY_AHEAD = Math.min(AHEAD * 3.4, Math.max(AHEAD, path.length * 0.22));
    const qg = new THREE.Vector3(), qa = new THREE.Vector3(), qp = new THREE.Vector3(), qc = new THREE.Vector3(), q1 = new THREE.Vector3(), q2 = new THREE.Vector3(),
      qd = new THREE.Vector3(), qs = new THREE.Vector3(), qw = new THREE.Vector3(), gout1 = new THREE.Vector3();
    // the direction a poi of weight w must lie in so that normalize((1 - w) from + w poi) is `to`; out of reach, the
    // gaze poi aims at `to` itself (as it always has) and the hold pulls square across (the most it can turn it)
    const solveDir = (from, to, w, out, square) => {
      const c = to.dot(from), disc = w * w - (1 - w) * (1 - w) * (1 - c * c);
      if (w < (square ? 0.002 : 0.02)) return out.copy(to);
      if (disc <= 0) return square ? out.copy(to).addScaledVector(from, -c).normalize() : out.copy(to);
      return out.copy(to).multiplyScalar((1 - w) * c + Math.sqrt(disc)).addScaledVector(from, -(1 - w)).normalize();
    };
    const guardOf = (u) => smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u));
    const holdBell = (u) => { const w = (HOLD_B - HOLD_A) * HOLD_FADE; return smoothstep(HOLD_A, HOLD_A + w, u) * (1 - smoothstep(HOLD_B - w, HOLD_B, u)); };
    const chords = (u) => {      // qp: the lens; qa: the sweeping camera's chord; qc: the steady camera's (longer, flattened)
      const d = u * path.length; path.posAtDist(d, qp); path.posAtDist(d + AHEAD, qa); qa.sub(qp).normalize();
      path.posAtDist(d + STEADY_AHEAD, qc); qc.sub(qp).normalize(); qc.y *= 0.55; qc.normalize();
    };
    const brgOf = (v) => Math.atan2(v.x, -v.z);
    // where the steady camera looks with the gaze poi alone, as [bearing off its own chord, elevation]
    const steadyOff = (u) => {
      qg.copy(gazeAt(u)); chords(u); const w = W0 * guardOf(u); solveDir(qa, qg, w, q2, false);
      qs.copy(qc).multiplyScalar(1 - STEADY_W * w).addScaledVector(q2, STEADY_W * w).normalize();
      let db = brgOf(qs) - brgOf(qc); db -= TAU * Math.round(db / TAU); return [db, Math.asin(clamp(qs.y, -1, 1))];
    };
    const [offA, elA] = steadyOff(HOLD_A), [offB, elB] = steadyOff(HOLD_B);
    let solvedU = -1;
    const solvePois = (u) => {
      if (u === solvedU) return; solvedU = u;
      qg.copy(gazeAt(u)); chords(u);
      const guard = guardOf(u), w1 = holdBell(u) * HOLD_W * guard, w2 = W0 * guard;
      if (w1 < 0.002) { q1.copy(qc); solveDir(qa, qg, w2, q2, false); return; }
      const k = (u - HOLD_A) / (HOLD_B - HOLD_A), b = brgOf(qc) + offA + (offB - offA) * k, e = elA + (elB - elA) * k, ce = Math.cos(e), a = STEADY_W * w2;
      qs.set(Math.sin(b) * ce, Math.sin(e), -Math.cos(b) * ce);      // where the steady camera is to look
      q1.copy(qc);
      for (let i = 0; i < 4; i++) {      // the gaze poi depends (weakly) on where the hold leaves the sweeping camera, the hold on the gaze poi: four rounds settle it
        qd.copy(qa).multiplyScalar(1 - w1).addScaledVector(q1, w1).normalize();
        solveDir(qd, qg, w2, q2, false);
        const c = qs.dot(q2);      // qw: where the hold must leave the steady camera so that the gaze poi then brings it onto qs
        qw.copy(qs).multiplyScalar(a * c + Math.sqrt(Math.max((1 - a) * (1 - a) - a * a * (1 - c * c), 0))).addScaledVector(q2, -a).normalize();
        solveDir(qc, qw, STEADY_W * w1, q1, true);
      }
      qd.copy(qa).multiplyScalar(1 - w1).addScaledVector(q1, w1).normalize(); solveDir(qd, qg, w2, q2, false);
    };
    const holdAt = (tm, u) => { solvePois(u); return gout1.copy(qp).addScaledVector(q1, 60); };
    const poiAt = (tm, u) => { solvePois(u); return gout.copy(qp).addScaledVector(q2, 60); };
    const pois = [{ at: holdAt, from: HOLD_A, to: HOLD_B, fade: HOLD_FADE, weight: HOLD_W }, { at: poiAt, from: -1, to: 2, weight: W0 }];

    // ---- the petrels' pass: each bird is put on screen where the lens will be looking ([second, screen x, screen y
    // (-1..1), metres ahead]) and flies from there in a straight line to a point over the north horn's far side
    {
      const tf = Math.tan(31 * DEG), rgt = new THREE.Vector3(), upv = new THREE.Vector3(), p0 = new THREE.Vector3(), list = [];
      for (const [t0, sx, sy, z0, t1, X, Y, Zt] of [[32.0, -0.62, 0.1, 15, 36.8, 114, 50, -250], [32.8, -0.8, 0.25, 14, 37.6, 113, 50, -258], [33.5, -0.6, -0.05, 17, 38.0, 113, 51, -254], [34.3, -0.85, 0.3, 15, 38.6, 113, 52, -262], [34.9, -0.62, 0.05, 16, 39.0, 112, 49, -256],
        [35.6, -0.75, 0.2, 15, 39.6, 112, 50, -260]]) {
        const g = gazeAt(t0 / DURATION);
        rgt.crossVectors(g, Y_UP).normalize(); upv.crossVectors(rgt, g);
        p0.copy(gp).addScaledVector(g, z0).addScaledVector(rgt, sx * z0 * tf * 16 / 9).addScaledVector(upv, sy * z0 * tf);
        const k = 17 / Math.max(Math.hypot(X - p0.x, Y - p0.y, Zt - p0.z), 1);      // (t1 is no longer used: every bird flies at 17 m/s, five faster than the lens, and so stays within twenty metres of it for nearly three seconds)
        list.push([p0.x, p0.y, p0.z, t0, (X - p0.x) * k, (Y - p0.y) * k, (Zt - p0.z) * k]);
      }
      scene.add(makePetrelPass(shared, list));
    }

    // ---- per-frame staging
    const tmpA = new THREE.Color(), tmpB = new THREE.Color();
    const desat = (c, s) => { const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; c.r = lerp(l * 0.97, c.r, s); c.g = lerp(l * 0.96, c.g, s); c.b = lerp(l * 1.09, c.b, s); return c; };
    const hourSky = deep ? 0.78 : 1.12, hourKey = deep ? 0.86 : 1.0;
    let flowLag = 0;
    const occ = new THREE.Vector3();
    const update = (dt, tm, camera, u) => {
      const t = clamp(u, 0, 1) * DURATION, d = Math.min(Math.max(dt || 0, 0), 0.1);
      time.value = tm;
      const calm = smoothstep(20, 21.6, t), open = smoothstep(20.0, 22.6, t);      // (open: the storm's flat light gives way to the pearl light as the wall leaves: by 21 s the cliff beside it is already dark and crisp)
      wx.uCalm.value = calm;
      flowLag += d * 20 * 0.95 * calm; wx.uFlow.value = 20 * tm - flowLag;
      wx.uSnake.value = STORM.snake * (1 - 0.8 * calm) * (1 - 0.3 * smoothstep(24, 36, t));      // (a last thin drift still creeps over the plain under the cliff)
      wx.uStream.value = STORM.stream * (1 - calm);
      wx.uVeil.value = smoothstep(21.5, 27, t);
      wx.uPassT.value = t;
      skyU.uCreep.value = tm / 20 * (1 + smoothstep(19.4, 21.0, t));      // the sheets' colour bands creep twice as fast once the snow has gone
      skyU.uRayT.value = tm * (1 + smoothstep(19.4, 21.0, t));           // and so do their ribs (both change pace inside the reveal's sweep)
      // the foot of the snow's rear face: whisked off the camera as the wind dies (79 m downwind of it by 21 s, past the notch, behind
      // the crowd), then drawn away at 20 m/s; it stands as a wall with a body and a torn top, lower as it settles
      FOGU.uSfEdge.value = FOOT_S21 + 20 * (t - 21) + 54 * smoothstep(19.6, 21.0, t) * (1 - smoothstep(23, 33, t));
      FOGU.uSfWall.value = smoothstep(19.8, 20.8, t);
      FOGU.uSfTop.value = lerp(58, 37, smoothstep(20.0, 21.0, t));
      FOGU.uSfLean.value = lerp(lerp(1.5, 3.2, smoothstep(20.2, 21.0, t)), 4, smoothstep(22, 26.5, t));   // the leaning rear face rears up into a wall as it leaves
      // a lull as the huddle comes up: from 11.5 s its dark band hardens across the view ahead
      FOGU.uSfDense.value = STORM.dense * lerp(0.35, 1, smoothstep(0.8, 6, t)) * lerp(1, 0.3, smoothstep(11.5, 13.2, t) * (1 - smoothstep(15, 16.5, t)));
      const cm = camera.matrixWorld.elements, camS = cm[12] * WIND[0] + cm[14] * WIND[1];
      curtain.visible = FOGU.uSfEdge.value - camS > -260;
      hero.setProgress(u); hero.update(dt, tm, camera);
      const sat = Math.max(U.uSat.value, STORM.sat); U.uSat.value = sat;
      const sk = lerp(1.5, 1, open);
      { const c = U.uSkyCol.value, l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722, m = 0.45 * open; c.r = lerp(c.r, l * 0.85, m); c.g = lerp(c.g, l * 0.97, m); c.b = lerp(c.b, l * 1.3, m);
        // while it blows the fill is the violet of the sky over the drift: every lee side and shadow is indigo, not grey
        const m1 = 0.7 * (1 - open); c.r = lerp(c.r, l * 0.84, m1); c.g = lerp(c.g, l * 0.74, m1); c.b = lerp(c.b, l * 1.7, m1); }
      U.uSkyCol.value.multiplyScalar(sk * lerp(1, hourSky, open)); U.uKeyCol.value.multiplyScalar(sk * lerp(1, hourKey, open)); U.uGroundCol.value.multiplyScalar(sk);
      // the fog patch in front of the exit ring faces the camera until the snow has left the notch
      occluder.visible = t < 27.5;
      wx.uCover.value = 1 - smoothstep(20.3, 22.5, t);
      wx.uCurtain.value = 1 - 0.7 * smoothstep(19.8, 20.8, t);            // the wall's own torn top is its fringe now
      occ.set(cm[12], cm[13], cm[14]).sub(PORTAL).normalize();
      FOGU.uSfGlowDir.value.copy(occ).negate();
      FOGU.uSfGlow.value.copy(glow0).multiplyScalar((1 - smoothstep(19.5, 22, t)) * (deep ? 1 : 0.85));
      if (occluder.visible) {
        // (a 20 m disc: the ring's own 6 m lies well inside its solid middle)
        occluder.position.copy(PORTAL).addScaledVector(occ, 11);
        occluder.quaternion.setFromUnitVectors(Z, occ);
      }
      U.uSteamRim.value *= deep ? 0.8 : 0.62;
      // the torn steam shows along the band in the lull; released, the columns start as thin wisps and fill out
      // as the camera draws away from them (close to the lens a full column is a pale sheet across the crowd)
      U.uSteamAmt.value = 1 + 0.3 * smoothstep(11.5, 13, t) * (1 - smoothstep(15.5, 17, t)) - 0.5 * smoothstep(20.3, 21.2, t) * (1 - smoothstep(22.6, 25, t));
      desat(FOGU.uSfColA.value.copy(fogA0).lerp(fogA1, open), Math.max(sat, 0.85));   // the murk keeps its slate-violet
      desat(FOGU.uSfColB.value.copy(fogB0).lerp(fogB1, open), Math.max(sat, 0.85));
      // once the snow has gone the sky is deeper and the sheets more vivid on it; the moon is muted while it blows
      skyU.uZenith.value.copy(skyZ0).lerp(skyZ1, open); skyU.uMid.value.copy(skyM0).lerp(skyM1, open); skyU.uVivid.value = lerp(viv0, viv1, open); skyU.uVeilK.value = lerp(1, 0.5, open);
      FOGU.uMoonCol.value.copy(moon0).multiplyScalar(lerp(0.8, 1, open));
      blow.setOpacity(0.85 * (1 - calm)); glitter.setOpacity(0.9 * smoothstep(21, 25.5, t));
      stragglers.position.set(fdir[0] * DRIFT * Math.min(t, 15), 0, fdir[1] * DRIFT * Math.min(t, 15));
      stragglers.visible = !(mood.rare && t > 20.2);
      if (latecomers) latecomers.position.z = -0.12 * (t - 29.4);        // shuffling in toward the disc
      moveWalkers(tm);
      hemi.intensity = lerp(1.0, deep ? 0.7 : 1.1, open); key.intensity = lerp(0.4, 1.2, open);
      tmpA.set('#8E8CA6'); tmpB.set('#5a4f9a'); hemi.color.copy(tmpA).lerp(tmpB, open);
    };
    { const c0 = new THREE.Object3D(); c0.position.copy(path.pointAt(0)); c0.updateMatrixWorld(); update(0, 0, c0, 0); }

    return {
      scene, path, duration: DURATION,
      camera: { fov: 62, near: 0.2, far: 4000, lookAhead: AHEAD, sway: 1.8, bank: 0.55 },      // (bank: the horizon never rolls more than nine degrees)
      pois,
      portal: { shape: 'circle', radius: 6, color: '#D8F6EA', glow: 1, revealDistance: 300, tilt: true },
      post: { exposure: 1.0, bloom: { strength: 0.3, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.03, contrast: 1.06, tint: '#ffffff', shadowTint: '#05040c', vignette: 0.4, grain: 0.03, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
