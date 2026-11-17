// THE BONE GARDEN: hero set piece for the world "whale-fall-garden".
//
// What it is
//   The 27 m skeleton of a blue whale lying on its back on a seamount terrace, and the crimson plush of
//   bone worms that grows on it. BUILD SCALE: 4 units = 1 apparent metre (the skeleton is ~108 u long).
//   Tail vertebrae (waisted drums with rimmed end plates and wing-like processes), a 36 u tunnel of 15
//   rib pairs whose tips miss each other overhead (one rib fallen outward into the mat, one a broken
//   stub), the 24 u skull lying palate-up and tipping 22 degrees over the shoulder of the terrace, and
//   beyond it the two jawbones standing on rock horns as a pointed arch. Also: one flipper spread on the
//   silt with its finger bones in order, both shoulder blades, scattered chevron bones, the fallen
//   baleen heap, and (opts.bed) the stained bed itself: silt ripples, sulphide-black halo, mat lace. The
//   stain is drawn as a living mat: its outline runs out in tongues and feathers into the silt, it is
//   mottled inside with windows of silt, and a ragged pale band of mat rims it at every range.
//   Over the bones: 15,200 tufts of six tapered blades (real geometry, opaque; a third of them on the
//   spine, weighted to the tail drums the lens skims) plus a deep matt crimson coat in the bone shader
//   (uCoat, feathered edge), so every red patch carries tufts and far bones look furred without them.
//   The skull's back is the occiput: one broad smooth dome (half an ellipsoid 10.8 u wide, lofted in
//   rings round the foramen's own axis, its foot standing in the silt) that closes the trough's back end.
//   The foramen is a single dark hollow 1.6 u wide at its centre, turned back and up toward a lens in the
//   nave: its outline is uneven, its mouth bevelled (a broad lip, paler on the upper edge, the dark
//   deepening by degrees inside); the condyles are two low shaded swellings beside it; three fine sutures
//   cross the dome (the bone shader draws them in the dome's own frame: uniforms uOccC, uOccB, uOccU); a
//   clear ragged band of white and sulphur mat rings the foot (vertex kind 0.3 tells the bone shader),
//   plush sits in the creases, the crown is bare chalk for the world's anemones, with finer pores when
//   the lens is within 20 u. In the 'reef' age the bone shader raises a low crust in relief (pale coral
//   buds, dull sponge clumps) in two or three soft-edged zones to a rib, chalk between them; the world
//   plants real coral and sponge on top.
//   Far off (beyond ~50 u, full by ~125 u) the piece is drawn to be read as a whole: bones swell by half
//   a pixel a side (BONE_VERT, uPx) so a rib never thins below about two pixels, their light goes to the
//   mean of lit top and shaded flank, bones, plush and the stained halo take a little less fog
//   (uniform uFarCut, opts.farCut, default 0.32), and the bed draws the stain's pale mat outline whole.
//   Where a bone is thin in the picture (by the pixel's own footprint on it, vl*uPx: full where a rib is
//   two and a half pixels wide or fewer, nothing where it is nine or more) it keeps the brightness of its
//   lit top (BONE_FRAG "thin"); no bone is thicker for it.
//   Tone: the chalk is the brightest thing on the bed. A chalk face turned full to the key reaches the
//   brief's peak in every light (uniform uChalkTop, set from the key's colour by the chalk's whenever the
//   light is set, unless opts.chalkTop gives it) and ends in a soft shoulder under 0.9, never clipped;
//   no silt, pale rim or mat of the bed is paler than a step under it (BED_TONE, uniform uBedTone: knee
//   and top of the bed's albedo; the chunk is in WFG_GLSL as bedTone, for a world's own floor).
//
// Local space
//   Origin on the bed under the middle of the spine, +Y up. The spine runs along X: tail tip at x = +56,
//   rib tunnel x = +7 .. -27, skull x = -28 .. -51, jaw arch near x = -62 on the slope (y about -12).
//   West (the way the camera flies, tail to jaw) is -X; south is +Z (the flipper and the baleen lie
//   there); the cliff would be at -Z. The spine is bowed sideways about 10 u (sign varies with seed:
//   anchors.bowSign), so use the anchors, not these round numbers. The bed here is level along the
//   terrace: the brief's 6 degree westward fall is left to the world (tilt hero.object, or ignore it).
//
// Motion (all in shaders, driven from update())
//   - gusts of current run down the skeleton from jaw to tail every 5 s: the tufts lay over and lighten,
//     and the velvet coat lightens with them (uniform uGustAmp; hero.setGust(a)); tufts tremble between gusts
//   - the flinch: hero.disturb(i, localPos, reach) (i = 0..3; hero.disturbWorld takes world space) says
//     where an animal touches the plush this frame (shark snout, two fin tips, nearest crab). The tufts
//     within reach snap into the bone in 0.12 s, stay in for 1.5 s and regrow over 5 s, leaving a bare
//     chalk print in the coat; cyan sparks (additive points, intensity 3.2, the only pixels that bloom)
//     flicker round each fresh print. Up to 16 prints live at once. Call disturb(i, null) to lift away.
//     It is driven by where you put the animals, so it coincides with the camera when they do; there is
//     no wall-clock event. Until disturb() is first called a demo runs (a crab on one rib, a fin along
//     the cage): pass opts.demo = false to switch it off.
//   - the baleen fronds lift and settle; the mat lace shimmers.
//
// anchors (all local space, THREE.Vector3 unless noted)
//   portalSeat    { position, normal, radius 7, tiltDeg 35 }: the ring 60 u down a straight 35 degree line
//                 from straightStart, over the slope; normal faces back up the line toward the camera.
//   flyThrough    ordered points for the camera from the tail turn to the portal: above the tail, 2.1 u
//                 over the tail drums (the keel), the nave centre line (y 5.6), 4.8 u over the palate,
//                 archPass, straightStart, portal. Clear by >= 1.8 u inside the cage (the brief's
//                 corridor), 6 u elsewhere. Check with path.distanceTo against anchors.ribs[].points.
//   naveLine / naveEntry / naveExit / naveClear   the tunnel's centre line, 9 points.
//   sharkLine     the same line at y 8.7: where a belly passes 1.4 u over the lens, under the slot of light.
//   spineTop      top of every vertebra, tail -> head (crab walks, keel run).   skullLine, skullTip
//   occiput       [[position, normal], ...] up to eight drawn points on the crown of the skull's back (anemones, singly)
//   occiput2      five more such points, drawn (the world plants them from its own stream)
//   occiputSeat   [position, normal, yaw]: a drawn seat on the crown and its drawn yaw (a brooding octopus)
//   foramen       the middle of the foramen's mouth: plant nothing within 2 u of it, the hollow must stay dark
//   archPass      the point between the jawbones to fly through; archFeet[2], archTips[2]; straightStart
//   ribs          [{ index (0 = tail end), side (+1 south / -1 north), fallen, stub, points[11] }]: rib
//                 centre lines, head to tip, for crabs, squat lobsters and fin tips to follow
//   octopusSeats  [{ position, side, rib }]: three in the angle between rib heads and spine, one on the palate
//   scapulae[2]   table tops for sponges.   flipperLine[5], baleen (centre of the heap, for the hagfish)
//   viewpoints    { reveal, tailLow, naveMid, archView }: composed camera positions
//   heading (unit vector the skull points along), bowSign, age
//
// opts
//   palette   brief palette [chalk, crimson, peacock, abyss, coral pink, sulphur, spark cyan]
//   age       'crimson' | 'white' | 'reef' (default: by seed, 60 / 20 / 20). white = fewer worms, whiter
//             bone, heavy mat; reef = bones budded with pink-white coral and yellow sponge, worms in hollows
//   bed       false to leave the floor to the world (use hero.groundHeight(x, z) for its height; the bones
//             are seated on it). true (default): keep the world's own floor ~0.4 u below groundHeight inside
//             the bed (184 x 100 u), whose ragged edge is cut by discard so that floor shows beyond it
//   light     { dir, key, sky, bounce, shadow, crimson, silt, keyScale ... } see Lighting; also hero.setLight(o)
//   gust (1), tufts (count multiplier), tuftSize (1), sparks (count multiplier, 5 for the night variation),
//   bow, bowSign, silt (hex), demo
//
// World hooks added by the world builder: no lamp anywhere (the light chunk has the one key, the sky and the bounce); the
//   fog chunk is the scene's own FogExp2 from the lens out (the brief's numbers).
//   uniforms.uFogLow (rgb, amount): fog colour when the gaze goes steeply down
//   (0 = plain scene fog); uniforms.uFogUp (rgb, amount): fog colour when it goes up (the paler water overhead); uniforms.uPale (x, z, reach,
//   gain): a patch of paler silt on the bed; uniforms.uCloud (x, z, half length, strength): a shadow sliding over the bones; the
//   export WFG_GLSL and hero.glsl (noise, plush, light, fog chunks, the bed's tone) so the world shades its own things alike; hero.feet.
// Also returned: uniforms (shared by every material), groundHeight(x, z) (exact) and groundFast(x, z) (read
//   bilinearly from the bed's own height grid inside the bed, exact outside: for per-vertex and per-instance
//   lookups), bed, plush, plushGLSL (float
//   wfgBare(vec3 localPos), float wfgGust(vec3 localPos) and their uniforms, for anemones or crabs that
//   should move with the same gust), stats, setLight, setGust, disturb, disturbWorld.
//
// Size: radius 30 / center are for the viewer's orbit; the piece spans x -72 .. +56 (portal seat at about
//   x -124, y -50), 14 u high at the ribs, 20 u jaw arch.
// Cost: ~148k triangles (bones 49k, tufts 91k at detail 1 and never fewer than 9,000 tufts, bed 7.4k),
//   6 draw calls (spine, ribs, skull-and-jaws, plush, bed, sparks), no lights, no textures, ~200-300 ms
//   build with a yield every few milliseconds.
// Lighting: the piece is self-shaded (ShaderMaterials with scene fog) so it looks the same whatever
//   lights the world has: one key from straight above leaning 6 degrees east (uKeyDir, hero-local),
//   near-white so chalk stays the brightest thing (lit tops reach 0.85 to 0.9 linear under a soft shoulder, never clipped), a peacock sky
//   term for flanks, a pale cyan bounce from below, blue in the hollows. Crimson is lit by the
//   luminance of the ambient (the long-exposure white balance), so it falls to oxblood, not black.
//   For the hour variations call setLight({ dir, key, sky, bounce, shadow }). Wants post exposure
//   ~1.1 and a bloom threshold >= 0.95 so only the sparks bloom.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EDE6D2', '#B3122E', '#0B6E86', '#031B2A', '#F29AB2', '#E8C23A', '#5CFFE6'];
const NPRINT = 16;            // bare prints kept alive at once
const S_RIB0 = 49.2, RIB_GAP = 2.4, NRIB = 15, S_SKULL = 84.6, SKULL_LEN = 24, SKULL_TILT = 22 * Math.PI / 180;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- shared GLSL
const NOISE_GLSL = /* glsl */`
float wfgHash(vec3 p){ p = fract(p*0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float wfgNoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(wfgHash(i), wfgHash(i + vec3(1,0,0)), f.x), mix(wfgHash(i + vec3(0,1,0)), wfgHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(wfgHash(i + vec3(0,0,1)), wfgHash(i + vec3(1,0,1)), f.x), mix(wfgHash(i + vec3(0,1,1)), wfgHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float wfgFbm(vec3 p){ return 0.5*wfgNoise(p) + 0.3*wfgNoise(p*2.03 + 3.1) + 0.2*wfgNoise(p*4.1 + 7.7); }
`;
// bare prints left where an animal touched the plush, and the gust that runs from jaw (-X) to tail (+X)
const PLUSH_GLSL = /* glsl */`
uniform vec4 uPrints[${NPRINT}];
uniform float uPrintAge[${NPRINT}];
uniform float uTime;
uniform float uGustAmp;
float wfgBare(vec3 p){
  float b = 0.0;
  for (int i = 0; i < ${NPRINT}; i++) {
    vec4 pr = uPrints[i];
    float a = uPrintAge[i];
    float d = length(p - pr.xyz);
    float k = (1.0 - smoothstep(pr.w*0.7, pr.w*1.12, d))*smoothstep(0.0, 0.12, a)*(1.0 - smoothstep(1.5, 7.0, a));
    b = max(b, k);
  }
  return b;
}
float wfgGust(vec3 p){
  float ph = uTime*0.2 - (p.x + 70.0)/150.0 + 0.035*sin(p.z*0.21 + p.y*0.17);
  float s = 0.5 + 0.5*sin(6.2831853*ph);
  float g = s*s*s*s;
  float f = 0.5 + 0.5*sin(uTime*1.3 + p.x*0.9 + p.z*0.7 + p.y*0.5);
  return uGustAmp*(0.82*g + 0.18*f*f);
}
`;

// Fog: the scene's own fog, but its colour falls from the scene fog colour at eye level to uFogLow.rgb when the
// gaze goes steeply down (uFogLow.a = how much; 0 keeps plain scene fog) and rises to uFogUp.rgb when it goes up
// (uFogUp.a = how much), the way the world's dome does. The world's shaders use the same chunks.
const FOG_PARS_VERT = /* glsl */`
#include <fog_pars_vertex>
varying float vFogY;
`;
const FOG_PARS_FRAG = /* glsl */`
#include <fog_pars_fragment>
uniform vec4 uFogLow; uniform vec4 uFogUp; varying float vFogY;
// k scales the amount of fog (1 = the scene's own). The pale bones, their plush and the stained halo take a little
// less fog far off (wfgFar), the way a long exposure balanced on bone pulls them out of the water.
vec3 wfgFogK(vec3 col, float k){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float f = 1.0 - exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      float f = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    vec3 c = mix(fogColor, uFogLow.rgb, uFogLow.a*(1.0 - smoothstep(-0.8, -0.05, vFogY)));
    c = mix(c, uFogUp.rgb, uFogUp.a*smoothstep(-0.04, 0.8, vFogY));      // the paler water overhead (the dome's own rise)
    col = mix(col, c, f*k);
  #endif
  return col;
}
vec3 wfgFog(vec3 col){ return wfgFogK(col, 1.0); }
float wfgFar(float d){ return smoothstep(50.0, 125.0, d); }
`;
const FOG_FRAG = /* glsl */`gl_FragColor.rgb = wfgFog(gl_FragColor.rgb);`;

const BONE_VERT = /* glsl */`
attribute vec4 aFx;      // fur, ao, kind (0 bone, 1 rock, 2 baleen), height above the bed
attribute float aSway;
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying vec4 vFx;
uniform float uTime; uniform vec3 uCamL; uniform float uPx;
${FOG_PARS_VERT}
void main(){
  vec3 p = position;
  float sw = aSway*(0.6 + 0.4*sin(uTime*0.7 + p.x*0.4 + p.z*0.3));
  p += vec3(0.55, 0.35, 0.12*sin(uTime*1.1 + p.x))*sw*(0.5 + 0.5*sin(uTime*0.45 + p.z*0.6 + p.x*0.25));
  // far off a rib is thinner than a pixel: swell the bones by about half a pixel each side so the hoops still read
  float dc = length(uCamL - p);
  p += normal*(dc*uPx*0.55*smoothstep(45.0, 120.0, dc)*step(aFx.z, 0.5));
  vCol = color; vPos = position; vN = normal; vFx = aFx;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
  vFogY = normalize(p - uCamL + vec3(0.0, 1e-5, 0.0)).y;
}`;

// THE BED'S TONE, one law for the hero's bed and the world's floor (the world's ground shader takes this chunk): chalk is
// the brightest thing on the bed, so no silt, pale rim or mat is paler than uBedTone.y, a clear step under the bone's lit
// tops. An albedo under the knee (uBedTone.x: plain silt and everything darker, the black halo with it) is left as it
// is; above the knee it is pressed under the top, the order kept (a mat stays paler than a rim, a rim than the silt),
// its colour unchanged.
const BED_TONE = /* glsl */`
uniform vec2 uBedTone;   // knee, top (albedo, by luminance)
vec3 wfgBedTone(vec3 a){
  float l = dot(a, vec3(0.2126, 0.7152, 0.0722)), k = uBedTone.x, w = max(uBedTone.y - uBedTone.x, 1e-3);
  float l2 = k + w*(1.0 - exp(-max(l - k, 0.0)/w));
  return l > k ? a*(l2/l) : a;
}
`;
const LIGHT_PARS = /* glsl */`
uniform vec3 uKeyDir; uniform vec3 uKey; uniform vec3 uSky; uniform vec3 uBounce; uniform vec3 uShadow; uniform vec3 uCamL;
uniform vec4 uCloud;     // a shadow sliding over the bed: centre x, centre z, half length, strength
float wfgCloud(vec3 p){ float a = (p.x - uCloud.x)/max(uCloud.z, 1.0), b = (p.z - uCloud.y)/max(uCloud.z*0.3, 1.0); return 1.0 - uCloud.w*exp(-(a*a*a*a + b*b)); }
`;
// what a world needs to shade its own things the same way (noise, plush gust and prints, the light uniforms, fog)
export const WFG_GLSL = { noise: NOISE_GLSL, plush: PLUSH_GLSL, light: LIGHT_PARS, fogParsVert: FOG_PARS_VERT, fogParsFrag: FOG_PARS_FRAG, fogFrag: FOG_FRAG, bedTone: BED_TONE };

const BONE_FRAG = /* glsl */`
varying vec3 vCol; varying vec3 vPos; varying vec3 vN; varying vec4 vFx;
uniform vec3 uCrimson; uniform vec3 uCoat; uniform vec3 uPink; uniform vec3 uYellow; uniform vec3 uMatA; uniform vec3 uMatB;
uniform float uMatAmt; uniform float uCrust; uniform float uFurGain; uniform float uFarCut; uniform float uPx; uniform float uChalkTop;
uniform vec4 uOccC; uniform vec3 uOccB; uniform vec3 uOccU;      // the occiput's dome: centre, lateral axis, up-and-forward axis (for its sutures)
${LIGHT_PARS}
${NOISE_GLSL}
${PLUSH_GLSL}
${FOG_PARS_FRAG}
void main(){
  vec3 n = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing) n = -n;
  vec3 vd = uCamL - vPos; float vl = length(vd); vec3 v = vd/max(vl, 1e-4);
  float n1 = wfgFbm(vPos*1.1), n2 = wfgNoise(vPos*6.5), n3 = wfgNoise(vPos*21.0);
  float n4 = wfgNoise(vPos*3.7 + 7.0);
  float fine = 1.0 - smoothstep(18.0, 70.0, vl);            // fade the finest grain with distance (no shimmer)
  // bump from the grain
  n = normalize(n + (vec3(n2, n4, n3) - 0.5)*0.35*fine + vec3(0.0, 1e-5, 0.0));
  float kind = vFx.z;
  float rock = 1.0 - smoothstep(0.4, 0.6, abs(kind - 1.0));
  float bal = smoothstep(1.5, 1.9, kind);
  // chalk
  vec3 alb = vCol*(0.80 + 0.22*n1 + 0.07*(n2 - 0.5));
  alb *= 1.0 - 0.30*smoothstep(0.58, 0.82, n3)*fine;                           // pores
  // thin: how thin the bone is in the picture, by the pixel's own footprint (vl*uPx: the units of bone under one pixel, so
  // it holds at every picture size and from every eye). 0 while a rib (0.9 u across) is nine pixels wide or more, 1 where
  // it is two and a half or fewer: there its pixels are shared with the black halo beside it
  float thin = smoothstep(0.10, 0.36, vl*uPx);
  float pit = smoothstep(0.66, 0.76, n4)*smoothstep(0.35, 0.6, n2)*(1.0 - thin);            // worm borings (grain finer than a pixel is left out: it would only speckle a thin bone grey)
  alb = mix(alb, alb*vec3(0.30, 0.40, 0.50), pit*0.85);
  float streak = wfgNoise(vec3(vPos.x*5.0, vPos.y*0.6, vPos.z*5.0));           // weathering streaks
  alb *= 0.90 + 0.14*streak;
  // old-reef crust, in relief: fist-sized pale coral buds and small clumps of dull sponge, gathered in zones, each
  // standing off the bone (the normal is pushed by the gradient of its height, so tops catch the light and the
  // undersides shade) with a dark skirt where it meets the chalk. Chalk stays the largest surface.
  // (it lies in two or three zones to a rib, a few units long, chalk between them: the low-frequency mask zone; all
  // its edges are soft and ragged, shaped by fbm, never by one octave's lattice)
  float crustOn = uCrust*(1.0 - rock)*(1.0 - bal)*(1.0 - 0.85*clamp(kind*3.3, 0.0, 1.0));      // (the occiput's dome stays one smooth chalk surface)
  float zone = smoothstep(0.47, 0.60, wfgFbm(vPos*0.24 + 31.0) + 0.04*(n4 - 0.5));
  crustOn *= zone;
  float cz = wfgFbm(vPos*0.55 + 23.0);
  float budH = smoothstep(0.58, 0.84, wfgNoise(vPos*1.6 + 11.0) + 0.10*(n2 - 0.5))*smoothstep(0.42, 0.56, cz)*crustOn;
  float spgH = smoothstep(0.26, 0.58, wfgFbm(vPos*0.95 + 5.0)*(0.55 + 0.45*wfgNoise(vPos*2.3 + 9.0))*1.5 + 0.06*(n2 - 0.5))*(1.0 - smoothstep(0.44, 0.58, cz))*crustOn;
  float hc = budH + 0.4*spgH;
  vec3 dpx = dFdx(vPos), dpy = dFdy(vPos);
  vec3 r1 = cross(dpy, n), r2 = cross(n, dpx);
  float det = dot(dpx, r1);
  vec3 grad = (dFdx(hc)*r1 + dFdy(hc)*r2)*(det < 0.0 ? -1.0 : 1.0);
  n = normalize(n - grad*(0.24*(1.0 - smoothstep(16.0, 50.0, vl))/max(abs(det), 1e-10)) + vec3(0.0, 1e-5, 0.0));
  vec3 budCol = mix(uPink, vec3(0.80, 0.76, 0.72), 0.22 + 0.34*n3)*(0.82 + 0.30*n2);
  alb = mix(alb, budCol, smoothstep(0.05, 0.6, budH)*0.6);
  alb *= 1.0 - 0.10*smoothstep(0.02, 0.25, budH)*(1.0 - smoothstep(0.25, 0.7, budH));
  float pore = smoothstep(0.60, 0.74, wfgNoise(vPos*17.0 + 3.0))*fine;
  alb = mix(alb, uYellow*0.50*(0.80 + 0.4*n2)*(1.0 - 0.5*pore), smoothstep(0.05, 0.7, spgH)*0.47);
  alb *= 1.0 - 0.04*smoothstep(0.02, 0.2, spgH)*(1.0 - smoothstep(0.2, 0.5, spgH));
  // bacterial mat climbing from the bed, and its tide line
  // (kind 0 .. 0.4 on a bone marks a foot that keeps a broad, ragged band of mat in every age: the skull's dome)
  float mb = clamp(kind*3.3, 0.0, 1.0)*(1.0 - rock)*(1.0 - bal);
  float h = vFx.w;
  // the dome near the lens: finer pores (within 20 u), and three fine sutures (one up the middle above the foramen,
  // two running down and out from it), never thinner than a pixel and a third, gone by 60 u
  float nearK = (1.0 - smoothstep(8.0, 20.0, vl))*mb;
  float n5 = wfgNoise(vPos*74.0);
  alb *= 1.0 - 0.24*smoothstep(0.60, 0.84, n5)*nearK;
  n = normalize(n + (vec3(n5, wfgNoise(vPos*74.0 + 5.0), n3) - 0.5)*0.16*nearK + vec3(0.0, 1e-5, 0.0));
  vec3 od = vPos - uOccC.xyz;
  float ox = dot(od, uOccB), oy = dot(od, uOccU);
  float s1 = ox + 0.10*sin(oy*7.0 + 1.3) + 0.04*sin(oy*19.0);
  float s2 = (oy - 1.75) + 0.42*abs(ox) + 0.08*sin(ox*8.0) + 0.035*sin(ox*21.0 + 2.0);
  float w1 = max(0.020, 1.3*fwidth(s1)), w2 = max(0.020, 1.3*fwidth(s2));
  float sut = max((1.0 - smoothstep(w1*0.4, w1, abs(s1)))*smoothstep(0.95, 1.25, oy), (1.0 - smoothstep(w2*0.4, w2, abs(s2)))*smoothstep(0.10, 0.30, abs(ox))*(1.0 - smoothstep(3.9, 4.4, abs(ox))));
  sut *= mb*uOccC.w*(1.0 - smoothstep(30.0, 60.0, vl));
  alb *= 1.0 - 0.50*sut;
  float mAmt = max(uMatAmt, 1.5*mb)*mix(1.0, smoothstep(0.14, 0.30, vFx.y), mb);      // (no mat inside the foramen: the hollow stays dark)
  float mt = (1.0 - smoothstep(mix(0.1, 0.55, mb), mix(1.5, 1.25, mb), h*mix(1.0, 0.50, mb) + (n1 - 0.5)*mix(2.2, 1.5, mb) + (n4 - 0.5)*0.8*mb + (n2 - 0.5)*0.22*mb))*mAmt;      // (on the dome the band climbs higher, and its edge is crisp and ragged)
  vec3 matCol = mix(uMatA, uMatB, smoothstep(0.42, 0.62, wfgNoise(vPos*0.8 + 3.0)));
  matCol = mix(matCol, mix(uMatA*1.22, uMatB*vec3(1.70, 1.36, 0.50), smoothstep(0.34, 0.56, wfgNoise(vPos*1.1 + 13.0))), mb);      // the dome's band: whiter whites, stronger sulphur
  float mtE = clamp(mt, 0.0, 1.0);
  alb = mix(alb, matCol*(0.75 + 0.3*n2), mtE*mix(0.85, 0.97, mb));
  alb *= 1.0 - 1.6*mb*mtE*(1.0 - mtE);                                         // a thin shade along the band's ragged edge: the mat lies on the bone
  // where the mat lies thick over the dome (the white fall) the dome still reads as bone: its sutures show through
  // the mat, fainter, thin sulphur stains gather in soft patches, and the mat sinks grey into the dome's shallow dimples
  alb *= 1.0 - 0.34*sut*mtE;
  float dstain = smoothstep(0.50, 0.72, wfgFbm(vPos*0.62 + 41.0) + 0.08*(n2 - 0.5))*mb*mtE;
  alb = mix(alb, uMatB*vec3(1.45, 1.22, 0.58)*(0.72 + 0.3*n2), dstain*0.30);
  alb *= 1.0 - 0.16*smoothstep(0.52, 0.70, wfgFbm(vPos*1.7 + 77.0))*mb*mtE*(1.0 - dstain);
  float tide = (h - 1.5 - n1*1.6)/0.22; tide = exp(-tide*tide)*min(mAmt, 1.0);
  alb = mix(alb, matCol*0.8, tide*0.5);
  alb *= 1.0 - 0.30*mb*(1.0 - smoothstep(0.0, 0.5, vFx.w));                    // the band darkens where it meets the silt
  alb = mix(alb, vec3(0.030, 0.040, 0.046)*(0.5 + 1.1*n1 + 0.5*n3), rock);
  alb = mix(alb, vec3(0.030, 0.027, 0.024)*(0.5 + 1.0*streak), bal);
  // light: one cold key from above, sky and bounce as a hemisphere, blue in every hollow
  float ndl = dot(n, uKeyDir);
  float key = smoothstep(-0.30, 1.0, ndl); key *= key;
  // far off a hoop is a pixel or two wide: its lit top and its shaded flank cannot be told apart, so it takes their mean
  float far = wfgFar(vl)*(1.0 - rock)*(1.0 - bal);
  key = mix(key, max(key, 0.60), far);
  // a thin bone keeps the brightness of its lit top: where it is a pixel or two wide (thin) its light is that of a face
  // turned up to the key, without contact shade, so the line does not grey out against the halo; no bone is thicker for it
  float thinB = thin*(1.0 - rock)*(1.0 - bal);
  key = mix(key, max(key, 0.88), thinB);
  key *= wfgCloud(vPos);
  float ao = mix(vFx.y, max(vFx.y, 0.8), far); ao = mix(ao, max(ao, 0.95), thinB);
  vec3 hemi = mix(uBounce, uSky, smoothstep(-1.0, 1.0, n.y));
  vec3 hemiW = vec3(dot(hemi, vec3(0.25, 0.5, 0.25)))*1.7;
  // white-balanced on bone: the shaded chalk keeps a hint of warmth instead of taking the water's colour
  vec3 amb = mix(hemi, hemiW*vec3(1.05, 1.0, 0.93), 0.62*(1.0 - rock)*(1.0 - bal));
  vec3 lit = uKey*key*mix(0.45, 1.0, ao) + amb*mix(0.30, 1.0, ao);
  // the long exposure is balanced on bone: a chalk face turned full to the key reaches the design's peak (uChalkTop: the
  // share of the key added there, by the cube of the key, so flanks and hollows keep their tone and the forms their depth)
  lit += uKey*(uChalkTop*key*key*key*ao*(1.0 - rock)*(1.0 - bal));
  vec3 col = alb*lit;
  col = mix(col, uShadow*(0.6 + 0.8*alb.g), (1.0 - ao)*0.35*(1.0 - key));
  float spec = pow(max(dot(reflect(-uKeyDir, n), v), 0.0), 18.0);
  col += uKey*spec*bal*0.12;
  // the plush: a crimson velvet coat with a fuzz rim, bared where an animal has just touched it
  float bare = wfgBare(vPos);
  float gust = wfgGust(vPos);
  // (a deep, matt, mottled coat with a ragged, feathered edge against the chalk, darker than the tuft tips above it)
  float fm = smoothstep(0.40, 0.60, vFx.x*uFurGain + (n2 - 0.5)*0.30 + (n4 - 0.5)*0.16 + (n3 - 0.5)*0.30*fine)*(1.0 - bare)*(1.0 - rock)*(1.0 - bal);
  fm *= mix(0.80 + 0.20*n4, 1.0, 1.0 - fine);
  vec3 fur = mix(uCoat, uCrimson, far)*(0.22 + 0.30*n2 + 0.18*n3*fine + 0.30*gust)*(1.0 + 0.6*far);
  float rim = 1.0 - abs(dot(n, v)); rim = rim*rim;
  vec3 furLit = fur*(uKey*key*0.95 + hemiW)*mix(0.5, 1.0, ao) + mix(uCrimson, uPink, 0.35)*rim*(0.25 + 0.75*key)*(uKey*0.5 + hemi)*0.26;
  col = mix(col, furLit, fm);
  // the edge of a fresh print: chalk shows a touch brighter
  col += alb*uKey*0.06*bare*(1.0 - rock);
  // never clipped: the chalk's light ends in a soft shoulder under 0.9 (the design's peak), the three channels pressed
  // alike so its hint of warmth is kept; nothing of the bone reaches the bloom's threshold
  float mx = max(col.r, max(col.g, col.b));
  col *= mx > 0.78 ? (0.78 + 0.12*(1.0 - exp(-(mx - 0.78)/0.12)))/mx : 1.0;
  gl_FragColor = vec4(wfgFogK(col, 1.0 - uFarCut*wfgFar(vFogDepth)*(1.0 - rock)), 1.0);
}`;

const TUFT_VERT = /* glsl */`
attribute vec3 iPos; attribute vec3 iNrm; attribute vec4 iDat;   // iDat: size, yaw, seed, shade
varying vec3 vCol;
uniform vec3 uCrimson; uniform vec3 uPink; uniform float uPx;
${LIGHT_PARS}
${PLUSH_GLSL}
${FOG_PARS_VERT}
void main(){
  vec3 n = normalize(iNrm + vec3(0.0, 1e-5, 0.0));
  vec3 ax = abs(n.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t1 = normalize(cross(n, ax)); vec3 t2 = cross(n, t1);
  float phi = position.x + iDat.y;
  vec3 r = cos(phi)*t1 + sin(phi)*t2;
  vec3 side = cross(n, r);
  float tip = position.y;
  float bare = wfgBare(iPos);
  float gust = wfgGust(iPos);
  float len = iDat.x*(0.75 + 0.5*fract(iDat.z*7.31 + position.x))*(1.0 - 0.94*bare);
  float dist = length(uCamL - iPos);
  float wid = max(0.115*iDat.x, dist*uPx*0.9)*(1.0 - 0.8*bare);
  float spread = 0.42 + 0.38*fract(iDat.z*3.17 + position.x*1.7);
  vec3 dir = n*cos(spread) + r*sin(spread);
  // the current lays the plumes over toward the tail (+X) and they tremble
  vec3 flow = vec3(1.0, 0.12, 0.0);
  flow -= n*dot(flow, n)*0.8;
  float flut = sin(uTime*3.1 + iDat.z*40.0 + position.x*2.0)*0.10 + sin(uTime*1.7 + iPos.x*1.3 + iPos.y)*0.08;
  dir = normalize(dir + flow*(0.18 + 0.95*gust) + side*flut + vec3(0.0, 1e-4, 0.0));
  vec3 p = iPos + n*(dist*uPx*0.55*smoothstep(45.0, 120.0, dist) - 0.03) + side*position.z*wid + dir*len*tip;
  float ndl = dot(normalize(n + dir*0.6*tip), uKeyDir);
  float key = smoothstep(-0.35, 1.0, ndl); key *= key; key *= wfgCloud(iPos);
  vec3 hemi = mix(uBounce, uSky, smoothstep(-1.0, 1.0, n.y + 0.3*tip));
  vec3 c = mix(uCrimson*0.26, mix(uCrimson, uPink, 0.04 + 0.2*gust)*0.88, tip)*(0.55 + 0.4*iDat.w)*(0.7 + 0.5*fract(iDat.z*13.7 + position.x*0.61));
  vec3 hemiW = vec3(dot(hemi, vec3(0.25, 0.5, 0.25)))*1.7;
  vCol = c*(uKey*key*0.86 + hemiW*1.08 + 0.04)*(1.0 + 0.35*smoothstep(50.0, 125.0, dist));
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
  vFogY = normalize(p - uCamL + vec3(0.0, 1e-5, 0.0)).y;
}`;
const TUFT_FRAG = /* glsl */`
varying vec3 vCol; uniform float uFarCut;
${FOG_PARS_FRAG}
void main(){ gl_FragColor = vec4(wfgFogK(vCol, 1.0 - uFarCut*wfgFar(vFogDepth)), 1.0); }`;

const SPARK_VERT = /* glsl */`
attribute vec2 aLife;    // born (seconds), length (seconds)
attribute float aSize;
varying float vA;
uniform float uTime; uniform float uPxScale;
void main(){
  float a = (uTime - aLife.x)/max(aLife.y, 0.05);
  vA = a > 0.0 && a < 1.0 ? sin(3.14159*sqrt(clamp(a, 0.0, 1.0))) : 0.0;
  vec4 mv = modelViewMatrix*vec4(position, 1.0);
  gl_Position = projectionMatrix*mv;
  gl_PointSize = vA > 0.0 ? clamp(aSize*uPxScale/max(-mv.z, 0.2), 2.5, 28.0) : 0.0;
}`;
const SPARK_FRAG = /* glsl */`
varying float vA; uniform vec3 uSpark;
void main(){
  vec2 q = gl_PointCoord - 0.5; float d = dot(q, q)*4.0;
  float s = (1.0 - smoothstep(0.0, 1.0, d)); s *= s;
  gl_FragColor = vec4(uSpark*s*vA, 1.0);
}`;

const BED_VERT = /* glsl */`
attribute vec3 aBed;     // halo 0..1, edge fade 0..1, rock 0..1
varying vec3 vPos; varying vec3 vN; varying vec3 vBed;
uniform vec3 uCamL;
${FOG_PARS_VERT}
void main(){
  vPos = position; vN = normal; vBed = aBed;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
  vFogY = normalize(position - uCamL + vec3(0.0, 1e-5, 0.0)).y;
}`;
const BED_FRAG = /* glsl */`
varying vec3 vPos; varying vec3 vN; varying vec3 vBed;
uniform vec3 uSilt; uniform vec3 uMatA; uniform vec3 uMatB; uniform float uMatAmt; uniform float uTime; uniform float uFarCut; uniform vec4 uPale;
${LIGHT_PARS}
${NOISE_GLSL}
${BED_TONE}
${FOG_PARS_FRAG}
void main(){
  vec3 q = vec3(vPos.x, 0.0, vPos.z);
  float n1 = wfgFbm(q*0.22), n2 = wfgNoise(q*1.7 + 4.0), n3 = wfgNoise(q*7.0);
  if (vBed.y < 0.02 + 0.5*n1 + 0.25*n2) discard;                 // ragged edge so the world's own floor takes over
  float vl = length(uCamL - vPos);
  // current ripples, crests 2 u apart, running across the flow
  float rp = vPos.x*3.14159 + (n1 - 0.5)*7.0 + sin(vPos.z*0.35)*1.2;
  float rip = sin(rp), ripd = cos(rp);
  float ripAmt = (1.0 - smoothstep(30.0, 110.0, vl))*(1.0 - vBed.z);
  vec3 n = normalize(vN + vec3(-ripd*0.33*ripAmt, 0.0, (n2 - 0.5)*0.30*ripAmt) + vec3(0.0, 1e-5, 0.0));
  // the stain is a living mat, not a painted patch: its outline runs out in tongues (n0), it feathers into the silt
  // over several units (the squared ramp), and inside it is mottled, with silt showing through in windows
  float n0 = wfgFbm(q*0.075 + 17.0), n5 = wfgNoise(q*0.5 + 40.0);
  float nearK = 1.0 - smoothstep(22.0, 60.0, vl);                  // 1 under the lens, 0 seen from the approach
  float halo = clamp(vBed.x*1.15 + (n1 - 0.5)*0.5 + (n2 - 0.5)*mix(0.05, 0.16, nearK) + (n0 - 0.5)*0.55, 0.0, 1.0);
  halo = smoothstep(0.04, 0.85, halo);
  vec2 dpl = (vPos.xz - uPale.xy)/max(uPale.z, 1.0);
  float pale = 1.0 + uPale.w*exp(-dot(dpl, dpl));
  vec3 alb = uSilt*(0.72 + 0.4*n1 + 0.12*n3 + 0.07*rip*ripAmt)*pale;
  float farB = wfgFar(vl);
  // from the approach the stain is one calm dark shape (a velvet of sulphide black, a little olive where the mat is
  // thick); under the lens it keeps its mottle and its windows of silt
  float stain = halo*halo*(3.0 - 2.0*halo)*mix(0.94, 0.74 + 0.26*smoothstep(0.28, 0.62, n5 + 0.2*(n2 - 0.5)), nearK);
  vec3 stainCol = mix(vec3(0.018, 0.026, 0.034), vec3(0.060, 0.066, 0.056), smoothstep(0.35, 0.8, n1 + 0.4*(n5 - 0.5)))*mix(0.95 + 0.25*n2, 0.6 + 0.8*n2 + 0.5*n3, nearK);
  alb = mix(alb, stainCol, stain*mix(0.92, 0.86, farB));          // sulphide-black stain
  // the mat's own texture: a fine net of paler wrinkles over the black, strongest where the mat is thickest
  float wr = abs(wfgNoise(q*1.25 + 61.0) - 0.5) + 0.5*abs(wfgNoise(q*2.9 + 5.0) - 0.5);
  alb += vec3(0.030, 0.037, 0.036)*(1.0 - smoothstep(0.03, 0.14, wr))*stain*(1.0 - smoothstep(70.0, 150.0, vl));
  // mat lace: clumps of white and sulphur mat with frayed, filamentous edges, thickest round the rim of the stain
  vec3 qw = q + (vec3(n2, 0.0, n1) - 0.5)*1.6;
  float p1 = wfgFbm(qw*0.42 + 9.0);
  float w1 = wfgNoise(qw*1.9 + 4.0), w3 = wfgNoise(qw*4.3 + 21.0);
  float near = 1.0 - smoothstep(24.0, 95.0, vl);
  float rimBand = smoothstep(0.04, 0.3, halo)*(1.0 - mix(0.94*smoothstep(0.40, 0.72, halo), 0.7*smoothstep(0.55, 0.95, halo), nearK));
  float core = smoothstep(0.57, 0.64, p1 + 0.05*(n3 - 0.5));
  float fringe = smoothstep(0.44, 0.56, p1)*(1.0 - core);
  float fil = (1.0 - smoothstep(0.02, 0.07, abs(w1 - 0.5)))*smoothstep(0.35, 0.6, w3)*near;
  float speck = smoothstep(0.80, 0.86, w3)*near;
  float shim = 0.88 + 0.12*sin(uTime*0.8 + w1*20.0);
  float lace = max(core*(0.75 + 0.25*w3), fringe*max(fil, speck*0.8))*rimBand*uMatAmt*shim;
  // the stain's pale outline: a ragged band of sulphur-white mat along its edge, drawn whole from far off so the black
  // shape has a light, unbroken rim at range
  float edge = smoothstep(0.02, 0.15, halo)*(1.0 - smoothstep(0.24, 0.52, halo));
  float edgeK = mix(0.64 + 0.36*smoothstep(0.22, 0.60, p1 + 0.18*(n2 - 0.5)), 0.22 + 0.78*smoothstep(0.26, 0.66, p1 + 0.30*(n2 - 0.5) + 0.22*(n3 - 0.5)), nearK);
  lace = max(lace, edge*edgeK*mix(0.78, 1.0, farB)*clamp(uMatAmt*1.3, 0.0, 1.0)*shim);
  vec3 matCol = mix(uMatA, mix(uMatA, uMatB, 0.55), smoothstep(0.46, 0.64, wfgNoise(q*0.21 + 3.0)));      // white, warming to pale sulphur in places
  alb = mix(alb, matCol*(0.6 + 0.4*n3), clamp(lace, 0.0, 1.0)*0.85);
  alb = wfgBedTone(alb);                                          // the bed's tone: silt, rims and mat keep under the chalk (the clams below are animals, not bed)
  // small animals on the mat: white clams, singly and in little beds, each a pale oval with a dark gape, sitting in the
  // black just inside the rim (one to a cell of a jittered grid, most cells empty)
  vec2 cq = vPos.xz*0.9 + (vec2(n2, n1) - 0.5)*0.5;
  vec2 ci = floor(cq), cf = fract(cq) - 0.5;
  float ch = wfgHash(vec3(ci, 7.0)), ch2 = wfgHash(vec3(ci, 19.0));
  vec2 co = (vec2(ch2, wfgHash(vec3(ci, 31.0))) - 0.5)*0.5;
  float ca = ch*6.2831853; vec2 cd = cf - co; cd = vec2(cos(ca)*cd.x + sin(ca)*cd.y, cos(ca)*cd.y - sin(ca)*cd.x);
  float cr = length(cd*vec2(1.0, 1.55))/(0.15 + 0.10*ch2);
  float bedK = smoothstep(0.45, 0.62, wfgNoise(q*0.16 + 27.0));                // the clams gather in beds
  float clamOn = step(0.86 - 0.34*bedK, ch)*smoothstep(0.22, 0.42, halo)*(1.0 - smoothstep(0.80, 0.97, halo))*(1.0 - smoothstep(45.0, 100.0, vl))*(1.0 - vBed.z);
  float clam = (1.0 - smoothstep(0.75, 1.0, cr))*clamOn;
  alb = mix(alb, vec3(0.50, 0.50, 0.46)*(0.75 + 0.35*ch2)*(1.0 - 0.35*smoothstep(0.3, 1.0, cr)), clam);
  alb *= 1.0 - 0.75*clam*(1.0 - smoothstep(0.03, 0.10, abs(cd.y)))*(1.0 - smoothstep(0.5, 0.8, abs(cd.x)/(0.15 + 0.10*ch2)));      // the gape
  alb *= 1.0 - 0.45*clamOn*smoothstep(0.85, 1.05, cr)*(1.0 - smoothstep(1.05, 1.5, cr));                                             // the dent it sits in
  vec3 bas = vec3(0.030, 0.040, 0.046)*(0.5 + 1.1*n1 + 0.5*n3);
  bas = wfgBedTone(mix(bas, uSilt*(0.66 + 0.36*n1 + 0.1*n3)*pale, smoothstep(0.22, 0.6, n2 + 0.3*n3)*0.8));      // silt lies in drifts on the rock of the slope
  alb = mix(alb, bas, vBed.z);
  float ndl = dot(n, uKeyDir);
  float key = smoothstep(-0.2, 1.0, ndl); key *= key; key *= wfgCloud(vPos);
  vec3 hemi = mix(uBounce, uSky, smoothstep(-1.0, 1.0, n.y));
  vec3 col = alb*(uKey*key + hemi);
  gl_FragColor = vec4(wfgFogK(col, 1.0 - uFarCut*wfgFar(vFogDepth)*max(halo, clamp(lace, 0.0, 1.0))*(1.0 - vBed.z)), 1.0);
}`;

// ---------------------------------------------------------------- geometry accumulator
// Every bone is a closed loft of rings; per-vertex scalars: ao, fur, kind, tint, sway.
const A = [1, 1, 0, 1, 0];
class Geo {
  constructor() { this.p = []; this.a = []; this.i = []; this.n = 0; }
  v(x, y, z) { this.p.push(x, y, z); this.a.push(A[0], A[1], A[2], A[3], A[4]); return this.n++; }
}
function loft(g, rings, attr, flip = 0) {
  const nr = rings.length, m = rings[0].length / 3, base = g.n, i0 = g.i.length;
  let cx = 0, cy = 0, cz = 0;
  for (let r = 0; r < nr; r++) {
    const R = rings[r];
    for (let k = 0; k < m; k++) { attr(r / (nr - 1), k / m, r, k); g.v(R[k * 3], R[k * 3 + 1], R[k * 3 + 2]); cx += R[k * 3]; cy += R[k * 3 + 1]; cz += R[k * 3 + 2]; }
  }
  cx /= nr * m; cy /= nr * m; cz /= nr * m;
  for (let r = 0; r < nr - 1; r++) for (let k = 0; k < m; k++) {
    const a = base + r * m + k, b = base + r * m + (k + 1) % m, c = a + m, d = b + m;
    g.i.push(a, b, d, a, d, c);
  }
  for (let e = 0; e < 2; e++) {           // caps: a fan to the ring's centroid
    const R = rings[e ? nr - 1 : 0]; let x = 0, y = 0, z = 0;
    for (let k = 0; k < m; k++) { x += R[k * 3]; y += R[k * 3 + 1]; z += R[k * 3 + 2]; }
    attr(e, 0, e ? nr - 1 : 0, -1);
    const c = g.v(x / m, y / m, z / m), o = base + (e ? (nr - 1) * m : 0);
    for (let k = 0; k < m; k++) { const a = o + k, b = o + (k + 1) % m; if (e) g.i.push(c, a, b); else g.i.push(c, b, a); }
  }
  // make the winding face outward whatever order the rings came in
  let vol = 0; const P = g.p;
  for (let t = i0; t < g.i.length; t += 3) {
    const a = g.i[t] * 3, b = g.i[t + 1] * 3, c = g.i[t + 2] * 3;
    const ax = P[a] - cx, ay = P[a + 1] - cy, az = P[a + 2] - cz, bx = P[b] - cx, by = P[b + 1] - cy, bz = P[b + 2] - cz, qx = P[c] - cx, qy = P[c + 1] - cy, qz = P[c + 2] - cz;
    vol += ax * (by * qz - bz * qy) + ay * (bz * qx - bx * qz) + az * (bx * qy - by * qx);
  }
  if ((vol < 0) !== !!flip) for (let t = i0; t < g.i.length; t += 3) { const s = g.i[t + 1]; g.i[t + 1] = g.i[t + 2]; g.i[t + 2] = s; }
}
// a tube along center(t) -> [x,y,z]; sect(t, ang, k) -> [alongN, alongB]; N is `ref` made square to the tangent
const _s2 = [0, 0];
function tube(g, n, m, center, ref, sect, attr) {
  const rings = [];
  for (let j = 0; j <= n; j++) {
    const t = j / n, p = center(t), p0 = center(Math.max(0, t - 0.02)), p1 = center(Math.min(1, t + 0.02));
    let tx = p1[0] - p0[0], ty = p1[1] - p0[1], tz = p1[2] - p0[2]; const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const rf = typeof ref === 'function' ? ref(t) : ref;
    const d = rf[0] * tx + rf[1] * ty + rf[2] * tz;
    let nx = rf[0] - tx * d, ny = rf[1] - ty * d, nz = rf[2] - tz * d; const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const R = new Array(m * 3);
    for (let k = 0; k < m; k++) {
      const s = sect(t, (k / m) * TAU, k);
      R[k * 3] = p[0] + nx * s[0] + bx * s[1]; R[k * 3 + 1] = p[1] + ny * s[0] + by * s[1]; R[k * 3 + 2] = p[2] + nz * s[0] + bz * s[1];
    }
    rings.push(R);
  }
  loft(g, rings, attr);
}
const table = (tb, x) => { for (let i = 1; i < tb.length; i++) if (x <= tb[i][0]) return lerp(tb[i - 1][1], tb[i][1], (x - tb[i - 1][0]) / Math.max(1e-6, tb[i][0] - tb[i - 1][0])); return tb[tb.length - 1][1]; };
const bez = (a, b, c, d, t) => { const u = 1 - t; return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d; };

// ---------------------------------------------------------------- the bones
function makeBuilders(W) {
  const { NZ, M, groundH, feet } = W;
  // lumpy ellipsoid (knobs, ear bones, carpals)
  function blob(g, c, rx, ry, rz, seed, attr, nLat = 5, nLon = 8) {
    const rings = [];
    for (let j = 0; j < nLat; j++) {
      const th = Math.PI * (0.14 + 0.72 * j / (nLat - 1)), R = new Array(nLon * 3);
      for (let k = 0; k < nLon; k++) {
        const ph = (k / nLon) * TAU, dx = Math.sin(th) * Math.cos(ph), dy = Math.cos(th), dz = Math.sin(th) * Math.sin(ph);
        const q = 1 + 0.2 * NZ.n3(dx * 1.4 + seed, dy * 1.4 - seed, dz * 1.4 + seed * 0.37);
        R[k * 3] = c[0] + dx * rx * q; R[k * 3 + 1] = c[1] + dy * ry * q; R[k * 3 + 2] = c[2] + dz * rz * q;
      }
      rings.push(R);
    }
    loft(g, rings, attr);
  }
  // small hourglass bone between two points (phalanges, chevrons, limb bones)
  function bone2(g, P0, P1, r0, r1, flat, seed, attr, n = 5, m = 6) {
    const prof = [[0, 0.7], [0.1, 1.08], [0.28, 0.8], [0.5, 0.66], [0.72, 0.8], [0.9, 1.08], [1, 0.7]];
    tube(g, n, m, (t) => [lerp(P0[0], P1[0], t), lerp(P0[1], P1[1], t), lerp(P0[2], P1[2], t)], [0, 1, 0],
      (t, a) => { const r = lerp(r0, r1, t) * table(prof, t) * (1 + 0.1 * NZ.n2(t * 3 + seed, a)); _s2[0] = Math.cos(a) * r * flat; _s2[1] = Math.sin(a) * r; return _s2; }, attr);
  }

  // one vertebra: a waisted drum with rimmed, dished end plates and two wing-like transverse processes
  const VPROF = [[-0.44, 0.45], [-0.5, 0.88], [-0.46, 1.0], [-0.35, 1.0], [-0.26, 0.78], [0, 0.62], [0.26, 0.78], [0.35, 1.0], [0.46, 1.0], [0.5, 0.88], [0.44, 0.45]];
  function vertebra(g, F, R, len, wing, o) {
    const cr = Math.cos(o.roll), sr = Math.sin(o.roll), cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw), cy = R * 0.84 + o.dy;
    const loc = (a, b, c) => { const b1 = b * cr - c * sr, c1 = b * sr + c * cr; return M(F, a * cyw - b1 * syw, a * syw + b1 * cyw + o.db, cy + c1 + groundH0(F)); };
    const rings = [], m = 12;
    for (let j = 0; j < VPROF.length; j++) {
      const R1 = new Array(m * 3), a = VPROF[j][0] * len, rr = VPROF[j][1] * R;
      for (let k = 0; k < m; k++) {
        const an = (k / m) * TAU, q = rr * (1 + 0.05 * Math.sin(k * 2.3 + o.seed * 9) + 0.04 * NZ.n2(o.seed * 5 + j, k * 0.9));
        const p = loc(a, Math.cos(an) * q, Math.sin(an) * q * 0.94); R1[k * 3] = p[0]; R1[k * 3 + 1] = p[1]; R1[k * 3 + 2] = p[2];
      }
      rings.push(R1);
    }
    loft(g, rings, (t, u, j, k) => {
      const end = j <= 1 || j >= VPROF.length - 2, rim = j === 2 || j === 3 || j === 7 || j === 8;
      const low = k < 0 ? 0 : Math.sin(u * TAU);
      A[0] = (end ? 0.5 : rim ? 1 : 0.82) * (low < -0.3 ? 0.6 : 1); A[1] = end ? 0.25 : rim ? 0.7 : 1; A[2] = 0; A[3] = o.tint; A[4] = 0;
    });
    if (wing > R * 0.9) for (let sd = -1; sd <= 1; sd += 2) {
      const tipY = 0.22 - cy, sweep = o.sweep * sd, wl = wing * (sd > 0 ? o.wl : o.wr);
      tube(g, 4, 6, (t) => loc(o.back * t * t, sd * (R * 0.62 + (wl - R * 0.62) * t), R * 0.1 + (tipY - R * 0.1) * Math.pow(t, 1.3) + sweep * t), M(F, 1, 0, 0).map((v, i) => v - M(F, 0, 0, 0)[i]),
        (t, a) => { const fl = 1 + 0.35 * smoothstep(0.7, 1, t); _s2[0] = Math.cos(a) * lerp(0.46, 0.25, t) * R * fl; _s2[1] = Math.sin(a) * lerp(0.2, 0.1, t) * R; return _s2; },
        (t) => { A[0] = 0.6 + 0.4 * t; A[1] = 0.85; A[2] = 0; A[3] = o.tint * 0.98; A[4] = 0; });
    }
    const c = loc(0, 0, 0); feet.push(c[0], c[2], R + wing * 0.8);
    return loc(0, 0, R * 0.95);
  }
  const groundH0 = (F) => groundH(F.x, F.z);

  // one rib: a flattened, twisted, tapering blade with a double head and gnawed edges
  const RW = [[0, 0.46], [0.04, 0.66], [0.1, 0.36], [0.3, 0.47], [0.6, 0.45], [0.85, 0.31], [1, 0.15]];
  const RT = [[0, 0.4], [0.05, 0.5], [0.1, 0.27], [0.25, 0.165], [0.6, 0.145], [1, 0.095]];
  function rib(g, F, side, o) {
    const k = o.k, wk = 0.7 + 0.3 * k, b0 = 1.25, y0 = 1.55;
    const pb = [b0, 9.0 * wk, 7.4 * wk * o.bulge, o.gap], py = [y0, 0.9, 10.5 * k, o.top * k];
    const uMax = o.stub ? o.stub : 1;
    const center = (t) => {
      const u = t * uMax, db = bez(pb[0], pb[1], pb[2], pb[3], u) - b0, dy = bez(py[0], py[1], py[2], py[3], u) - y0, a = -o.lean * Math.pow(u, 1.5);
      if (o.fallen) {   // lies in the mat, hollow side toward the tail
        const p = M(F, a + 0.4 - db * 0.85, side * (b0 + 1.2 + dy * 0.98), 0);
        p[1] = groundH(p[0], p[2]) + 0.3 + 0.25 * Math.sin(u * 3.0); return p;
      }
      const p = M(F, a, side * (b0 + db), 0); p[1] = y0 + dy + groundH0(F); return p;
    };
    const h = M(F, 1, 0, 0), h0 = M(F, 0, 0, 0), ref = o.fallen ? [0, 1, 0] : [h[0] - h0[0], 0, h[2] - h0[2]];
    const n = o.stub ? 8 : 24;
    tube(g, n, 8, center, ref, (t, a, kk) => {
      const u = t * uMax, c = Math.cos(a), s = Math.sin(a);
      let wd = table(RW, u) * o.thick, th = table(RT, u) * o.thick;
      if (u > 0.13) wd *= 1 - 0.42 * Math.max(0, NZ.n2(u * 10 + o.seed * 31, c > 0 ? 3.3 : 8.1)) * Math.abs(c);
      if (o.stub && t > 0.9) { const j = 0.45 + 0.55 * ((kk * 7 + 3) % 5) / 4; wd *= j; th *= j; }
      const tw = o.twist * u, ct = Math.cos(tw), st = Math.sin(tw);
      let x = c * wd, y = s * th;
      if (o.fallen) { const q = x; x = y; y = q; }
      _s2[0] = x * ct - y * st; _s2[1] = x * st + y * ct; return _s2;
    }, (t, u2) => {
      const u = t * uMax, c = Math.cos(u2 * TAU);
      A[0] = 0.5 + 0.5 * smoothstep(0.02, 0.22, u); A[1] = (1 - 0.62 * c * c * c * c) * (1 - 0.7 * smoothstep(0.6, 1, u)) * (u < 0.03 ? 0.4 : 1);
      A[2] = 0; A[3] = o.tint; A[4] = 0;
    });
    const hd = center(0.03);
    const kn = M(F, 0.3, side * 0.55, 0);
    blob(g, [kn[0] + (hd[0] - M(F, 0, side * b0, 0)[0]), hd[1] - 0.3, kn[2] + (hd[2] - M(F, 0, side * b0, 0)[2])], 0.5 * o.thick, 0.42 * o.thick, 0.5 * o.thick, o.seed * 13, () => { A[0] = 0.55; A[1] = 0.6; A[2] = 0; A[3] = o.tint; A[4] = 0; }, 4, 6);
    const pts = [];
    for (let j = 0; j <= 10; j++) { const p = center(j / 10); pts.push(new THREE.Vector3(p[0], p[1], p[2])); if (o.fallen || j === 0) feet.push(p[0], p[2], 1.2); }
    return pts;
  }
  return { blob, bone2, vertebra, rib };
}

// vertex normals exactly as BufferGeometry.computeVertexNormals makes them (area-weighted face normals, summed), with a
// pause every few thousand triangles so that a big mesh never holds the page
async function pausedNormals(geo, pause) {
  const P = geo.attributes.position.array, I = geo.index.array, N = new Float32Array(P.length);
  for (let t = 0; t < I.length; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[c] - P[b], uy = P[c + 1] - P[b + 1], uz = P[c + 2] - P[b + 2], vx = P[a] - P[b], vy = P[a + 1] - P[b + 1], vz = P[a + 2] - P[b + 2];
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
    N[a] += x; N[a + 1] += y; N[a + 2] += z; N[b] += x; N[b + 1] += y; N[b + 2] += z; N[c] += x; N[c + 1] += y; N[c + 2] += z;
    if (t % 9000 === 8997) await pause();
  }
  for (let v = 0; v < N.length; v += 3) { const l = Math.hypot(N[v], N[v + 1], N[v + 2]) || 1; N[v] /= l; N[v + 1] /= l; N[v + 2] /= l; if (v % 45000 === 44997) await pause(); }
  geo.setAttribute('normal', new THREE.BufferAttribute(N, 3));
}

function makeHeadBuilders(W, B) {
  const { NZ, M, groundH, feet, rng } = W;
  const { blob, bone2 } = B;
  const gauss = (x, c, w) => Math.exp(-((x - c) / w) * ((x - c) / w));

  // the skull: a long shallow trough lying palate-up, vomer keel down the middle, tipped over the terrace shoulder
  async function skull(g, F0, o) {
    const ct = Math.cos(SKULL_TILT), st = Math.sin(SKULL_TILT), yb = groundH(F0.x, F0.z) + 1.75;
    const sk = (u, v, w) => { const q = u / SKULL_LEN, wd = w - o.droop * q * q; return M(F0, u * ct + wd * st, v, yb - u * st + wd * ct); };
    const hw = (u) => (u < 3 ? lerp(2.3, 5.2, smoothstep(-0.5, 3, u)) : 5.2 * Math.pow(Math.max(0, 1 - (u - 3) / 21.2), 0.72) * 0.94 + 0.2);
    const wTop = (u, vp, H) => {
      const q = u / SKULL_LEN, v = vp * H, av = Math.abs(vp);
      const rim = (2.0 - 1.35 * q) * av * av * av * (1 + 0.22 * NZ.n2(u * 0.45 + o.seed, vp > 0 ? 2.2 : 6.6)) * (0.22 + 0.78 * smoothstep(0.8, 5.0, u));      // the trough's raised edges die away toward the back, which is a dome
      const keel = (1.6 - 1.05 * q) * smoothstep(1.2, 4, u) * gauss(v, 0, 0.55);
      const pmx = 0.34 * gauss(Math.abs(v), 0.33 * H + 0.5, 0.42) * smoothstep(4.5, 8, u) * (1 - q);
      const cran = 2.0 * (1 - smoothstep(0.4, 5.2, u)) * (1 - vp * vp) * (0.8 + 0.3 * NZ.n2(u * 0.9 + 3, v * 0.9 + o.seed));
      return 0.25 * (1 - 0.5 * q) + rim + keel + pmx + cran;
    };
    const wBot = (u, vp) => -(0.55 + 1.5 * (1 - smoothstep(0, 6, u))) * Math.pow(Math.max(0, 1 - vp * vp), 0.6) * (0.3 + 0.7 * (1 - u / SKULL_LEN));
    // the trough: close rings where the back flares so it shades smoothly (its back end is buried in the occiput below)
    const nU = 58, nT = 25, nB = 11, m = nT + nB + 2, rings = [], at = [];
    const facAt = (u) => 0.42 + 0.58 * Math.pow(Math.sin(Math.PI * 0.5 * clamp(u / 2.6, 0, 1)), 0.75);
    const sect = (u, k, out) => {             // one point of the section at u: [v, w, ao, fur]
      const fac = facAt(u), H = hw(u) * fac; let vp, w, ao, fur;
      if (k < nT) {
        vp = -1 + 2 * k / (nT - 1); w = wTop(u, vp, H) * fac;
        const fl = 0.25 * (1 - 0.5 * u / SKULL_LEN) * fac;
        ao = 0.32 + 0.68 * smoothstep(0.05, 1.1, w - fl); fur = 1 - 0.75 * smoothstep(0.35, 1.0, w - fl);
      } else if (k === nT || k === m - 1) { vp = k === nT ? 1 : -1; w = -0.14 * fac; ao = 0.6; fur = 0.2; }
      else { vp = 1 - 2 * (k - nT) / (nB + 1); w = wBot(u, vp) * fac - 0.14 * fac; ao = 0.45; fur = 0.3; }
      out[0] = vp * H; out[1] = w; out[2] = ao; out[3] = fur; return out;
    };
    const sc4 = [0, 0, 0, 0];
    for (let j = 0; j <= nU; j++) {
      const R = new Array(m * 3), u = 1.3 + (SKULL_LEN - 1.3) * Math.pow(j / nU, 1.45);      // (it starts 1.3 u in, clear of the foramen's floor)
      for (let k = 0; k < m; k++) { sect(u, k, sc4); const p = sk(u, sc4[0], sc4[1]); R[k * 3] = p[0]; R[k * 3 + 1] = p[1]; R[k * 3 + 2] = p[2]; at.push(sc4[2], sc4[3]); }
      rings.push(R);
      if (j % 8 === 7) await W.pause();
    }
    loft(g, rings, (t, u, j, k) => { const q = (j * m + Math.max(0, k)) * 2; A[0] = at[q]; A[1] = at[q + 1]; A[2] = 0; A[3] = o.tint; A[4] = 0; });
    await W.pause();
    // THE OCCIPUT: the back of the skull, one broad smooth dome (half an ellipsoid 10.8 u wide, its foot in the silt)
    // closing the trough's back end. It is lofted in rings round the foramen's own axis, which points back and up
    // toward a lens in the nave: ring 0 is the bottom of the foramen (a dark hollow 1.6 u wide and 0.9 u deep, its
    // walls near black), then its lip, then the dome spreading out to where it sinks into the trough and the bed.
    // The condyles are two low swellings on the lip's flanks. Plush gathers in the creases (the foot, the seam with the
    // trough's rims), mat rings the foot (kind 0.3: see the bone shader), the crown is bare chalk.
    const UC = 2.5, WC = 0.25, RU = 3.4, RV = 5.4, RWU = 2.25, RWD = 3.2, EL = 24 * Math.PI / 180;
    const aU = -Math.cos(EL), aW = Math.sin(EL), cU = Math.sin(EL), cW = Math.cos(EL);      // the axis a, and c (up and forward); b is +v
    // the foramen's angular radius: an oval, wider than tall, its outline uneven by about 15 % (no draw from the stream)
    const fz = o.seed * 40;
    const thF = (ph) => (1 + 0.085 * Math.sin(2 * ph + fz) + 0.06 * Math.sin(3 * ph + fz * 1.7 + 1) + 0.04 * Math.sin(5 * ph + fz * 2.9 + 2)) / Math.hypot(Math.cos(ph) / 0.145, Math.sin(ph) / 0.215);
    const domeDir = (th, ph, out) => { const ct = Math.cos(th), sn = Math.sin(th); out[0] = aU * ct + cU * sn * Math.sin(ph); out[1] = sn * Math.cos(ph); out[2] = aW * ct + cW * sn * Math.sin(ph); return out; };
    const dd = [0, 0, 0];
    // (below its middle the dome spreads a little, so its foot stands in the silt as a wall, not an undercut egg)
    const domeAt = (th, ph, q) => { domeDir(th, ph, dd); const fl = q * (1 + 0.16 * smoothstep(0, -0.55, dd[2])); return sk(UC + RU * dd[0] * fl, RV * dd[1] * fl, WC + (dd[2] > 0 ? RWU : RWD) * dd[2] * q); };
    const TR = [0.08, 0.40, 0.66, 0.84, 0.96, 1.07, 1.22, 1.45], NO = 20, mD = 48, THMAX = 126 * Math.PI / 180, dRings = [], dAt = [];
    const cdL = domeDir(0.335, -0.26, [0, 0, 0]), cdR = domeDir(0.335, Math.PI + 0.26, [0, 0, 0]);      // where the condyles swell
    const gy0 = groundH(F0.x, F0.z);
    for (let r = 0; r < TR.length + NO; r++) {
      const R = new Array(mD * 3);
      for (let k = 0; k < mD; k++) {
        const ph = (k / mD) * TAU, tf = thF(ph);
        let th, tr;
        if (r < TR.length) { tr = TR[r]; th = tf * tr; } else { const f = Math.pow((r - TR.length + 1) / NO, 1.25); th = lerp(tf * 1.45, THMAX, f); tr = th / tf; }
        // a bevelled mouth: the wall eases out into the dome over a broad lip (to 1.22 of the radius), raised a little on
        // its upper edge, which catches the light (upK), while the hollow darkens by degrees inward
        const hollow = 1 - smoothstep(0.30, 1.22, tr);
        const upK = smoothstep(-0.25, 0.6, Math.sin(ph));
        const lipK = Math.exp(-((tr - 1.12) / 0.17) * ((tr - 1.12) / 0.17));
        domeDir(th, ph, dd);
        // condyles: two low swellings on the lip's flanks, a little below the foramen's middle
        const gL = ((dd[0] - cdL[0]) ** 2 + (dd[1] - cdL[1]) ** 2 + (dd[2] - cdL[2]) ** 2) / (0.135 * 0.135), gR = ((dd[0] - cdR[0]) ** 2 + (dd[1] - cdR[1]) ** 2 + (dd[2] - cdR[2]) ** 2) / (0.135 * 0.135);
        const cond = (Math.exp(-gL) + Math.exp(-gR)) * smoothstep(1.05, 1.4, tr);
        const condSh = clamp(Math.exp(-gL / 3.4) + Math.exp(-gR / 3.4) - 1.25 * (Math.exp(-gL) + Math.exp(-gR)), 0, 1);      // the shade in the groove round each
        const lump = 0.030 * NZ.n3(dd[0] * 1.3 + o.seed * 7, dd[1] * 1.3, dd[2] * 1.3 - o.seed * 3) + 0.012 * NZ.n3(dd[0] * 4.1, dd[1] * 4.1 + o.seed * 5, dd[2] * 4.1);
        const q = 1 - 0.26 * hollow + (0.012 + 0.030 * upK) * lipK + 0.185 * cond + lump * (1 - hollow);
        const p = domeAt(th, ph, q);
        R[k * 3] = p[0]; R[k * 3 + 1] = p[1]; R[k * 3 + 2] = p[2];
        const hgt = p[1] - gy0, up = dd[2];                                     // rough height over the bed; how far up the dome
        // creases: the foot above the mat, the seam where the dome sinks into the trough
        const foot = smoothstep(0.7, 1.5, hgt) * (1 - smoothstep(1.7, 2.6, hgt)) * (1 - smoothstep(0.1, 0.5, up));
        const seam = smoothstep(96, 112, th * 180 / Math.PI);
        const patch = smoothstep(0.30, 0.56, 0.5 + 0.5 * NZ.n3(dd[0] * 2.3 + 9, dd[1] * 2.3 + o.seed * 11, dd[2] * 2.3));
        const tuftK = smoothstep(0.52, 0.66, 0.5 + 0.5 * NZ.n3(dd[0] * 3.4 - 5, dd[1] * 3.4 + o.seed * 17, dd[2] * 3.4 + 2));      // the plush sits in separate tufts along the foot, the mat shows between
        const crease = clamp(Math.max(foot * tuftK, seam * 0.9 * (0.35 + 0.65 * patch)), 0, 1);
        const dark = Math.pow(1 - smoothstep(0.42, 1.10, tr), 0.8) * (1 - 0.30 * (1 - upK) * smoothstep(0.6, 1.0, tr));      // 1 deep in the hollow, easing to 0 on the lip (the lower wall, which faces the light, a little less)
        const ao = lerp(lerp(0.60 + 0.38 * smoothstep(-0.5, 0.5, up), 0.5, 0.6 * crease) * (1 - 0.55 * condSh) * (1 + 0.10 * lipK * upK), 0.10, dark);
        const fur = dark > 0.02 || tr < 1.3 ? 0 : (crease > 0.3 ? 1 + 0.95 * crease : 0.22 * patch * (1 - smoothstep(0.2, 0.7, up)));
        dAt.push(ao, fur, lerp(o.tint * (1 + 0.10 * lipK * upK), 0.10, dark));
      }
      dRings.push(R);
      if (r % 5 === 4) await W.pause();
    }
    loft(g, dRings, (t, u, j, k) => { const q = (j * mD + Math.max(0, k)) * 3; A[0] = dAt[q]; A[1] = dAt[q + 1]; A[2] = 0.3; A[3] = dAt[q + 2]; A[4] = 0; });
    await W.pause();
    // where the crown's animals sit: every point is drawn, by angles of the dome (th from the foramen's axis, ph round
    // it: 90 is straight up the dome's middle), from one stream of its own (the skull's seed and a name).
    // First the octopus's seat with its yaw (any bearing) and five points (the world plants anemones on them from its
    // own stream): 44 to 82 degrees from the axis, 40 to 124 round it.
    // Then, after them (so the seat and the five keep their draws), up to eight more for anemones standing singly on
    // the dome's upper back face, clear of the foramen:
    //   th 44 to 96: at 44 degrees every bearing of the upper face lies 2.1 u or more from the middle of the foramen's
    //   mouth (nothing is planted within 2 u of it), and at 96 the seam with the trough begins, where plush fills the
    //   crease;
    //   ph 30 to 150: the face that looks up, 30 degrees or more above the dome's level on either side, where its wall
    //   stands 2.1 u or more over the bed, clear of the foot's plush and above all but the ragged upper edge of its mat.
    // Each of the eight lies at least 1.5 u from every point drawn before it (the seat, the five, the earlier ones of
    // the eight): one that falls nearer is drawn again, up to 20 times, from the same stream, and left out if none fits.
    const occ = [], nrmAt = (th, ph) => { const p0 = domeAt(th, ph, 1), d0 = domeDir(th, ph, [0, 0, 0]), p1 = sk(UC + RU * d0[0] + 0.3 * d0[0] / RU, RV * d0[1] + 0.3 * d0[1] / RV, WC + (d0[2] > 0 ? RWU : RWD) * d0[2] + 0.3 * d0[2] / (d0[2] > 0 ? RWU : RWD));
      return [new THREE.Vector3(p0[0], p0[1], p0[2]), new THREE.Vector3(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]).normalize()]; };
    const flipV = o.seed > 0.5 ? 1 : -1;
    const RO = makeRng(hashSeed('wfg-crown:' + o.seed)), crownAt = (t0, t1, p0, p1) => { const td = RO.range(t0, t1), pd = RO.range(p0, p1); return nrmAt(td * Math.PI / 180, (flipV > 0 ? pd : 180 - pd) * Math.PI / 180); };
    const occSeat = crownAt(44, 82, 40, 124).concat(RO() * TAU), occ2 = [0, 0, 0, 0, 0].map(() => crownAt(44, 82, 40, 124));
    { const drawn = [occSeat[0]].concat(occ2.map((c) => c[0]));
      for (let k = 0; k < 8; k++) for (let t = 0; t <= 20; t++) { const c = crownAt(44, 96, 30, 150); if (drawn.every((q) => q.distanceTo(c[0]) >= 1.5)) { occ.push(c); drawn.push(c[0]); break; } } }
    // the dome's own frame, for the sutures the bone shader draws on it: centre, lateral axis, up-and-forward axis
    const oc0 = sk(UC, 0, WC), ob = sk(UC, 1, WC), ou = sk(UC + cU, 0, WC + cW);
    const frame = { c: new THREE.Vector3(oc0[0], oc0[1], oc0[2]), b: new THREE.Vector3(ob[0] - oc0[0], ob[1] - oc0[1], ob[2] - oc0[2]).normalize(), u: new THREE.Vector3(ou[0] - oc0[0], ou[1] - oc0[1], ou[2] - oc0[2]).normalize() };
    const ax = sk(1, 0, 0), a0 = sk(0, 0, 0), ref = [ax[0] - a0[0], ax[1] - a0[1], ax[2] - a0[2]];
    for (let sd = -1; sd <= 1; sd += 2) {
      // eye arch (supraorbital process)
      const e0 = sk(4.4, sd * 4.3, 1.0), e1 = sk(6.4, sd * (5.2 + 3.3), 0.3);
      tube(g, 7, 8, (t) => [lerp(e0[0], e1[0], t), lerp(e0[1], e1[1], t) + 0.9 * Math.sin(Math.PI * t), lerp(e0[2], e1[2], t)], ref,
        (t, a) => { const fl = 1 + 0.5 * smoothstep(0.6, 1, t) - 0.25 * Math.sin(Math.PI * t); _s2[0] = Math.cos(a) * 1.25 * fl * (1 + 0.15 * NZ.n2(t * 4, a + sd)); _s2[1] = Math.sin(a) * lerp(0.5, 0.32, t); return _s2; },
        (t) => { A[0] = 0.65 + 0.35 * t; A[1] = 0.8; A[2] = 0; A[3] = o.tint * 1.02; A[4] = 0; });
    }
    const line = [];
    for (let u = 1; u <= SKULL_LEN; u += 2.3) { const p = sk(u, 0, wTop(u, 0, hw(u)) ); line.push(new THREE.Vector3(p[0], p[1], p[2])); feet.push(p[0], p[2], hw(u) + 1.2); }
    const seat = sk(8.5, 2.3 * (o.seed > 0.5 ? 1 : -1), 0.6);
    const tip = sk(SKULL_LEN, 0, 0.3);
    const fm = domeAt(0, 0, 1);                                              // the middle of the foramen's mouth
    return { line, seat: new THREE.Vector3(seat[0], seat[1], seat[2]), tip: new THREE.Vector3(tip[0], tip[1], tip[2]), occ, occ2, occSeat, frame, foramen: new THREE.Vector3(fm[0], fm[1], fm[2]) };
  }

  // the two jawbones standing as a pointed arch on rock horns
  function jaws(g, FA, o) {
    const hx = FA.hx, hz = FA.hz, out = { feet: [], tips: [] };
    const yf = [0, 0];
    for (let q = 0; q < 2; q++) { const p = M(FA, 0, (q ? 1 : -1) * o.half, 0); yf[q] = groundH(p[0], p[2]) + o.horn; }
    const yT = (yf[0] + yf[1]) * 0.5 + o.top;
    for (let q = 0; q < 2; q++) {
      const sd = q ? 1 : -1, y0 = yf[q], sx = o.seed + q * 5.3;
      const center = (t) => { const p = M(FA, sd * o.cross * t * t + o.lean * t, bez(sd * o.half, sd * (o.half + 2.7), sd * (o.half - 1.9), sd * 0.4, t), 0); p[1] = bez(y0, y0 + 8, yT - 4.2, yT, t); return p; };
      tube(g, 32, 10, center, [hx, 0, hz], (t, a) => {
        const c = Math.cos(a), s = Math.sin(a);
        let rn = lerp(0.66, 0.2, Math.pow(t, 0.8)) * (1 + 0.5 * gauss(t, 0, 0.06)), rb = lerp(1.0, 0.26, Math.pow(t, 0.9)) * (1 + 0.4 * gauss(t, 0, 0.05));
        if (s * sd > 0) rb *= 1 + 1.25 * gauss(t, 0.15, 0.05);                 // the raised hook at the hinge
        rb *= 1 - 0.3 * Math.max(0, NZ.n2(t * 9 + sx, s > 0 ? 1.5 : 4.5)) * Math.abs(s) * smoothstep(0.22, 0.4, t);
        _s2[0] = c * rn; _s2[1] = s * rb; return _s2;
      }, (t, u) => { const s = Math.sin(u * TAU); A[0] = 0.55 + 0.45 * smoothstep(0, 0.12, t); A[1] = (0.95 - 0.4 * s * s * s * s) * (t < 0.04 ? 0.3 : 1); A[2] = 0; A[3] = o.tint * (q ? 1 : 0.97); A[4] = 0; });
      const f = center(0);
      blob(g, [f[0], f[1] + 0.1, f[2]], 1.15, 0.85, 1.25, sx, () => { A[0] = 0.6; A[1] = 0.4; A[2] = 0; A[3] = o.tint; A[4] = 0; }, 5, 9);
      // the rock horn it stands on
      const gy = groundH(f[0], f[2]);
      tube(g, 6, 9, (t) => [f[0] + 1.6 * (1 - t) * hx * -1 + 0.5 * NZ.n2(t * 2, sx), lerp(gy - 2.2, y0 - 0.35, t), f[2] + 0.5 * NZ.n2(t * 2 + 9, sx)], [1, 0, 0],
        (t, a) => { const r = lerp(4.2, 1.25, Math.pow(t, 0.7)) * (1 + 0.28 * NZ.n2(Math.cos(a) * 1.3 + sx, Math.sin(a) * 1.3 + t * 2.2)); _s2[0] = Math.cos(a) * r; _s2[1] = Math.sin(a) * r; return _s2; },
        (t) => { A[0] = 0.5 + 0.5 * t; A[1] = 0; A[2] = 1; A[3] = 1; A[4] = 0; });
      feet.push(f[0], f[2], 3.5);
      const tp = center(1);
      out.feet.push(new THREE.Vector3(f[0], f[1], f[2])); out.tips.push(new THREE.Vector3(tp[0], tp[1], tp[2]));
    }
    return out;
  }

  // a flipper spread on the silt, finger bones still in order like a hand
  function flipper(g, O, dir, o) {
    const dx = Math.cos(dir), dz = Math.sin(dir);
    const P = (p, q, lift = 0) => { const x = O[0] + p * dx - q * dz, z = O[1] + p * dz + q * dx; return [x, groundH(x, z) + 0.26 + lift, z]; };
    const at = (ao, fur) => () => { A[0] = ao; A[1] = fur; A[2] = 0; A[3] = o.tint; A[4] = 0; };
    bone2(g, P(0, 0, 0.35), P(2.7, 0.1, 0.2), 0.85, 0.75, 0.75, 1, at(0.8, 0.8), 6, 8);
    bone2(g, P(3.0, -0.6, 0.1), P(7.3, -1.0), 0.52, 0.62, 0.55, 2, at(0.85, 0.7), 6, 7);
    bone2(g, P(3.0, 0.6, 0.1), P(7.1, 0.9), 0.45, 0.5, 0.55, 3, at(0.85, 0.7), 6, 7);
    for (let c = 0; c < 5; c++) blob(g, P(7.9 + 0.35 * (c % 2), -1.3 + c * 0.65), 0.36, 0.24, 0.34, c * 3.1 + o.seed, at(0.8, 0.4), 4, 6);
    const counts = [4, 7, 6, 3], fan = [-0.17, -0.05, 0.07, 0.24];
    for (let d = 0; d < 4; d++) {
      let p = 8.75, q = -1.25 + d * 0.83, len = 1.3 - 0.08 * Math.abs(d - 1), r = 0.25;
      const ca = Math.cos(fan[d]), sa = Math.sin(fan[d]);
      for (let k = 0; k < counts[d]; k++) {
        const jp = rng.range(-0.05, 0.05), jq = rng.range(-0.07, 0.07);
        const p1 = p + len * ca, q1 = q + len * sa;
        bone2(g, P(p + jp, q + jq), P(p1 + jp, q1 + jq), r, r * 0.88, 0.62, d * 9 + k, at(0.9, 0.35), 4, 6);
        p = p1 + 0.16 * ca; q = q1 + 0.16 * sa; len *= 0.87; r *= 0.9;
      }
    }
    const tips = [];
    for (let k = 0; k <= 4; k++) { const c = P(k * 4, 0); feet.push(c[0], c[2], 2.2); tips.push(new THREE.Vector3(c[0], c[1], c[2])); }
    return tips;
  }

  // a shoulder blade: a fan-shaped plate, flat enough to be a sponge table
  function scapula(g, C, yaw, o) {
    const rings = [], nA = 14, m = nA * 2, Rr = o.size, th0 = 1.08;
    const cyw = Math.cos(yaw), syw = Math.sin(yaw), gy = groundH(C[0], C[1]);
    for (let j = 0; j < 6; j++) {
      const r = lerp(0.2, 1, j / 5), R = new Array(m * 3);
      for (let k = 0; k < m; k++) {
        const top = k < nA, f = top ? k / (nA - 1) : 1 - (k - nA) / (nA - 1), th = (f * 2 - 1) * th0;
        const edge = 1 + 0.13 * NZ.n2(th * 1.3 + o.seed, 1.7) * (j === 5 ? 1 : 0.5) - 0.25 * smoothstep(0.75, 1, Math.abs(th) / th0) * r;
        const px = Math.cos(th) * r * Rr * edge, pz = Math.sin(th) * r * Rr * edge;
        const ridge = 0.5 * gauss(th, 0.28, 0.13) * (0.4 + r) + 0.25 * (1 - r);
        const yy = (top ? 0.3 + ridge + 0.22 * (1 - r * r) + 0.1 * NZ.n2(px * 0.9 + o.seed, pz * 0.9) : -0.26) * (1 - 0.6 * smoothstep(0.8, 1, Math.abs(th) / th0)) * (j === 5 ? 0.45 : 1) + o.tilt * px;
        R[k * 3] = C[0] + px * cyw - pz * syw; R[k * 3 + 1] = gy + 0.55 + o.lift + yy; R[k * 3 + 2] = C[1] + px * syw + pz * cyw;
      }
      rings.push(R);
    }
    loft(g, rings, (t, u, j, k) => { A[0] = k >= nA ? 0.45 : 0.95; A[1] = 0.3; A[2] = 0; A[3] = o.tint; A[4] = 0; });
    feet.push(C[0] + 0.5 * Rr * cyw, C[1] + 0.5 * Rr * syw, Rr * 0.8);
    return new THREE.Vector3(C[0] + 0.55 * Rr * cyw, gy + 0.9 + o.lift + o.tilt * 0.55 * Rr, C[1] + 0.55 * Rr * syw);
  }

  // a scattered chevron bone: a small V
  function chevron(g, C, yaw, sz, seed) {
    const gy = groundH(C[0], C[1]) + 0.16, at = () => { A[0] = 0.85; A[1] = 0.5; A[2] = 0; A[3] = 0.97; A[4] = 0; };
    for (let sd = -1; sd <= 1; sd += 2) {
      const a = yaw + sd * 0.5;
      bone2(g, [C[0], gy + 0.1, C[1]], [C[0] + Math.cos(a) * sz, gy, C[1] + Math.sin(a) * sz], 0.2 * sz, 0.13 * sz, 0.7, seed + sd, at, 4, 6);
    }
    feet.push(C[0], C[1], sz + 0.6);
  }

  // the fallen baleen: a frayed black heap like burnt palm fronds, lifting in the current
  function baleen(g, C, o) {
    const n = o.count;
    for (let i = 0; i < n; i++) {
      const ang = rng.range(0, TAU), rad = Math.sqrt(rng()) * 1.0, bx = C[0] + Math.cos(ang) * rad * 5.5, bz = C[1] + Math.sin(ang) * rad * 3.2;
      const dirA = rng.range(-0.9, 0.9) + (rng.chance(0.3) ? Math.PI : 0), len = rng.range(3, 7.5), arch = rng.range(0.3, 1.9), swy = rng.range(0.4, 1), gy = groundH(bx, bz);
      const strands = 2 + (rng() < 0.6 ? 1 : 0);
      for (let s = 0; s < strands; s++) {
        const fr = (s - (strands - 1) / 2) * rng.range(0.16, 0.3), wob = rng.range(0, 9);
        tube(g, 5, 3, (t) => {
          const a = dirA + fr * t * t * 1.6, d = len * t * (1 - 0.12 * Math.abs(fr));
          return [bx + Math.cos(a) * d + fr * 0.6, gy + 0.12 + arch * Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.1)) + 0.15 * Math.sin(t * 6 + wob), bz + Math.sin(a) * d];
        }, [0, 1, 0], (t, a) => { const w = lerp(0.4, 0.07, t * t); _s2[0] = Math.cos(a) * 0.06; _s2[1] = Math.sin(a) * w; return _s2; },
        (t) => { A[0] = 0.5 + 0.5 * t; A[1] = 0; A[2] = 2; A[3] = 1; A[4] = t * t * swy; });
      }
      if (i % 4 === 0) feet.push(bx, bz, 3.0);
    }
  }
  return { skull, jaws, flipper, scapula, chevron, baleen };
}

const AGES = {
  crimson: { furBias: 0.02, tufts: 1.0, mat: 0.75, crust: 0, white: 0.0, hollow: 0 },
  white: { furBias: -0.30, tufts: 0.42, mat: 1.7, crust: 0, white: 0.55, hollow: 0 },
  reef: { furBias: -0.05, tufts: 0.40, mat: 0.5, crust: 1, white: 0.15, hollow: 1 },
};

export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const rng = ctx.rng.fork('whale-fall-garden');
  const NZ = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const ageRoll = rng();
  const ageName = AGES[opts.age] ? opts.age : (ageRoll < 0.6 ? 'crimson' : ageRoll < 0.8 ? 'white' : 'reef');
  const age = AGES[ageName];
  const bowSign = opts.bowSign ?? (rng.chance(0.5) ? 1 : -1);
  const bow = opts.bow ?? rng.range(8.5, 11.5);
  const fallenIdx = rng.int(7, 9), stubIdx = rng.int(2, 4), fallenSide = 1, stubSide = -1;
  const flipSide = 1;                                   // the flipper lies to the south (+Z)

  // ---- the spine's line: s = 0 at the tail tip, growing toward the head (-X); bowed like a drawn bow
  const zc = (s) => bowSign * bow * (0.5 - ((s - 54) / 54) * ((s - 54) / 54));
  const frameAt = (s) => {
    const sc = Math.min(s, S_SKULL), dz = -2 * bowSign * bow * (sc - 54) / (54 * 54), l = Math.hypot(1, dz), hx = -1 / l, hz = dz / l;
    const ex = s - sc;
    return { x: 56 - sc + hx * ex, z: zc(sc) + hz * ex, hx, hz, lx: hz, lz: -hx, s };
  };
  const M = (F, a, b, y) => [F.x + a * F.hx + b * F.lx, y, F.z + a * F.hz + b * F.lz];
  const F0 = frameAt(S_SKULL), FS = frameAt(S_SKULL - 2.2);
  // the bed: a terrace that rolls over like a shoulder into a 35 degree slope under the skull
  const groundH = (x, z) => {
    const d = (x - FS.x) * FS.hx + (z - FS.z) * FS.hz, b = Math.abs((x - FS.x) * FS.lx + (z - FS.z) * FS.lz);
    const prof = d > 0 ? -0.7 * (d - 12 * (1 - Math.exp(-d / 12))) : 0;
    const off = smoothstep(7, 20, b) * (0.4 + 0.6 * smoothstep(0, 30, d));
    return prof + 0.9 * NZ.fbm2(x * 0.045 + 3.3, z * 0.045 - 1.7, 3) * off + 0.12 * NZ.n2(x * 0.21, z * 0.21);
  };
  // the bed's height on the bed mesh's own grid: groundFast(x, z) reads it bilinearly (exact groundH outside the bed),
  // for the per-vertex and per-instance lookups that do not need the last few centimetres
  const GX = 88, GZ = 42, gx0 = -106, gx1 = 78, gzm = zc(54) * 0.35, gz0 = gzm - 50, gz1 = gzm + 50;
  const hGrid = new Float32Array((GX + 1) * (GZ + 1));
  await ctx.yield();
  for (let j = 0, v = 0; j <= GZ; j++) { const z = lerp(gz0, gz1, j / GZ); for (let i = 0; i <= GX; i++, v++) hGrid[v] = groundH(lerp(gx0, gx1, i / GX), z); if (j % 2 === 1) await ctx.yield(); }
  const groundFast = (x, z) => {
    const fx = (x - gx0) / (gx1 - gx0) * GX, fz = (z - gz0) / (gz1 - gz0) * GZ;
    if (!(fx >= 0 && fx < GX && fz >= 0 && fz < GZ)) return groundH(x, z);
    const i = fx | 0, j = fz | 0, a = fx - i, b = fz - j, v = j * (GX + 1) + i;
    return (hGrid[v] * (1 - a) + hGrid[v + 1] * a) * (1 - b) + (hGrid[v + GX + 1] * (1 - a) + hGrid[v + GX + 2] * a) * b;
  };
  const feet = [];
  const W = { NZ, M, groundH, feet, rng, pause: () => ctx.yield() };
  const B = makeBuilders(W), HB = makeHeadBuilders(W, B);
  const tintOf = () => rng.range(0.93, 1.04);
  await ctx.yield();

  // ---- spine: vertebrae laid from the skull back to the tail tip, never quite in line
  const gSpine = new Geo(), spineTop = [];
  {
    let s = S_SKULL - 0.9, i = 0;
    while (s > 0.6 && i < 70) {
      const R = lerp(0.24, 1.0, Math.pow(smoothstep(0, 46, s), 0.85)) * (s > 80 ? 0.9 : 1), len = 1.2 * R + 0.42;
      const tail = 1 - smoothstep(10, 40, s), mess = 0.35 + 0.65 * tail;
      const inCage = s > S_RIB0 - 1.5;
      const wing = inCage ? 1.9 : s < 3.5 ? 0 : (0.95 + 1.6 * smoothstep(4, 26, s)) * (0.85 + 0.15 * Math.sin(s * 0.2));
      const o = { roll: rng.gauss() * 0.10 * mess + (rng.chance(0.08 * mess) ? rng.range(-0.7, 0.7) : 0), yaw: rng.gauss() * 0.08 * mess, db: rng.gauss() * 0.14 * mess,
        dy: rng.range(-0.12, 0.02) * R, seed: rng(), tint: tintOf(), sweep: rng.range(-0.15, 0.15), back: rng.range(-0.5, 0.1), wl: rng.range(0.85, 1.1), wr: rng.range(0.85, 1.1) };
      const drop = rng.chance(0.05) && !inCage;         // a missing drum here and there
      if (!drop) { const top = B.vertebra(gSpine, frameAt(s - len * 0.5), R, len, wing, o); spineTop.push(new THREE.Vector3(top[0], top[1], top[2])); }
      s -= len + rng.range(0.14, 0.3) + (tail > 0.5 && rng.chance(0.12) ? rng.range(0.3, 0.9) : 0); i++;
      if (i % 3 === 0) await ctx.yield();
    }
    const nChev = 9 + rng.int(0, 4);
    for (let c = 0; c < nChev; c++) {
      const F = frameAt(rng.range(4, 42)), sd = rng.sign(), p = M(F, 0, sd * rng.range(2.6, 6.5), 0);
      HB.chevron(gSpine, [p[0], p[2]], rng.range(0, TAU), rng.range(0.7, 1.15), c * 3.7);
    }
  }
  spineTop.reverse();                                    // tail -> head, the way the camera flies
  await ctx.yield();

  // ---- ribs, flipper, shoulder blades
  const gRibs = new Geo(), ribs = [];
  for (let i = 0; i < NRIB; i++) {
    const F = frameAt(S_RIB0 + i * RIB_GAP + rng.range(-0.18, 0.18));
    const k = 0.66 + 0.34 * Math.pow(Math.sin(Math.PI * (i + 0.8) / 16.2), 0.8);
    for (let sd = -1; sd <= 1; sd += 2) {
      const fallen = i === fallenIdx && sd === fallenSide, stub = i === stubIdx && sd === stubSide;
      const o = { k: k * rng.range(0.95, 1.05), gap: rng.range(0.6, 2.4), top: rng.range(11.6, 14.3), bulge: rng.range(0.9, 1.1), lean: rng.range(0.2, 3.2), twist: rng.range(0.35, 0.8) * sd,
        thick: rng.range(0.92, 1.12), seed: rng(), tint: tintOf(), fallen, stub: stub ? rng.range(0.2, 0.3) : 0 };
      const pts = B.rib(gRibs, F, sd, o);
      ribs.push({ index: i, side: sd, fallen, stub: !!stub, points: pts });
      await ctx.yield();
    }
    await ctx.yield();
  }
  const FF = frameAt(S_RIB0 + 12.3 * RIB_GAP), fo = M(FF, 0, flipSide * 9.6, 0);
  const flipDir = Math.atan2(FF.lz * flipSide - 0.5 * FF.hz, FF.lx * flipSide - 0.5 * FF.hx) + rng.range(-0.15, 0.15);
  const flipperLine = HB.flipper(gRibs, [fo[0], fo[2]], flipDir, { tint: 0.99, seed: rng() });
  const scapulae = [];
  for (let sd = -1; sd <= 1; sd += 2) {
    const FSc = frameAt(S_RIB0 + (sd > 0 ? 14.8 : 12.4) * RIB_GAP), c = M(FSc, 0, sd * (sd > 0 ? 12.5 : 10.8), 0);
    scapulae.push(HB.scapula(gRibs, [c[0], c[2]], rng.range(0, TAU), { size: rng.range(4.2, 5.0), tilt: rng.range(-0.06, 0.08), lift: rng.range(0, 0.35), seed: rng() * 9, tint: tintOf() }));
  }
  await ctx.yield();

  // ---- skull, jaw arch on its rock horns, the fallen baleen
  const gHead = new Geo();
  const skull = await HB.skull(gHead, F0, { droop: 1.7, seed: rng(), tint: 1.0 });
  await ctx.yield();
  const FA = frameAt(S_SKULL + SKULL_LEN * Math.cos(SKULL_TILT) + 11.5);
  const arch = HB.jaws(gHead, FA, { half: 8, top: rng.range(19, 21), horn: 4.2, cross: rng.range(-0.9, 0.9), lean: rng.range(-1.2, 1.2), seed: rng() * 9, tint: 1.0 });
  const FBn = frameAt(S_SKULL + 10), bc = M(FBn, 0, flipSide * 11.5, 0);
  HB.baleen(gHead, [bc[0], bc[2]], { count: 34 });
  await ctx.yield();

  // ---- shared uniforms (the same objects in every material, so one update drives them all)
  const key = new THREE.Color('#CFEFF2').lerp(new THREE.Color('#fff6e8'), 0.7).multiplyScalar(1.12);
  const U = {
    uTime: { value: 0 }, uGustAmp: { value: opts.gust ?? 1 },
    uPrints: { value: Array.from({ length: NPRINT }, () => new THREE.Vector4(0, -999, 0, 1)) },
    uPrintAge: { value: new Array(NPRINT).fill(1000) },
    uKeyDir: { value: new THREE.Vector3(Math.sin(0.105), Math.cos(0.105), 0) },
    uKey: { value: key }, uSky: { value: pal[2].clone().multiplyScalar(0.62) },
    uBounce: { value: new THREE.Color('#BFEFF0').multiplyScalar(0.17) }, uShadow: { value: new THREE.Color('#06323F') },
    uCamL: { value: new THREE.Vector3(0, 40, 80) },
    uCrimson: { value: pal[1].clone() }, uCoat: { value: pal[1].clone().lerp(new THREE.Color('#8E1226'), 0.65) }, uFarCut: { value: opts.farCut ?? 0.32 }, uOccC: { value: new THREE.Vector4(skull.frame.c.x, skull.frame.c.y, skull.frame.c.z, 1) }, uOccB: { value: skull.frame.b }, uOccU: { value: skull.frame.u }, uPink: { value: pal[4].clone() }, uYellow: { value: pal[5].clone().multiplyScalar(0.8) },
    uMatA: { value: new THREE.Color('#E9EEE4').multiplyScalar(0.74) }, uMatB: { value: pal[5].clone().lerp(new THREE.Color('#F2EBC0'), 0.5).multiplyScalar(0.5) },
    uMatAmt: { value: age.mat }, uCrust: { value: age.crust }, uFurGain: { value: 1 },
    uChalkTop: { value: opts.chalkTop ?? 0.30 }, uBedTone: { value: new THREE.Vector2(0.12, 0.23) },      // the chalk's peak (set from the key below, chalkTop) and the bed's tone (see BONE_FRAG, BED_TONE)
    uPx: { value: 0.003 }, uPxScale: { value: 300 }, uSpark: { value: pal[6].clone().multiplyScalar(3.2) },
    uSilt: { value: new THREE.Color(opts.silt ?? '#8FA3A0').multiplyScalar(0.34) },
    uFogLow: { value: new THREE.Vector4(0, 0, 0, 0) }, uFogUp: { value: new THREE.Vector4(0, 0, 0, 0) }, uPale: { value: new THREE.Vector4(0, 0, 30, 0) }, uCloud: { value: new THREE.Vector4(0, 0, 60, 0) },
  };
  if (opts.light) applyLight(U, opts.light);
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const boneMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: BONE_VERT, fragmentShader: BONE_FRAG, fog: true, vertexColors: true, side: THREE.DoubleSide });

  // ---- bake colour, plush mask and height above the bed into each bone mesh
  const chalk = pal[0].clone().multiplyScalar(0.9).lerp(new THREE.Color(0.8, 0.8, 0.8), age.white);
  // the chalk's peak follows the key: a chalk face turned full to the key comes to the same height in every light
  // (key by chalk, brightest channel, times 1 + uChalkTop = 1.03, which the shoulder in BONE_FRAG lands under 0.9).
  // The share is held between 0.05 and 0.6: a dim key (the moon's) takes the 0.6 and comes a little short of that
  const chalkTop = () => {
    if (opts.chalkTop !== undefined) return;
    const k = U.uKey.value, m = Math.max(k.r * chalk.r, k.g * chalk.g, k.b * chalk.b, 0.4);
    U.uChalkTop.value = Math.min(0.6, Math.max(0.05, 1.03 / m - 1));
  };
  chalkTop();
  const furMask = (x, y, z) => smoothstep(-0.25, 0.2, NZ.fbm3(x * 0.3, y * 0.3, z * 0.3, 3) + age.furBias);
  async function finish(g) {
    const n = g.n, pos = new Float32Array(g.p);
    await ctx.yield();
    const col = new Float32Array(n * 3), fx = new Float32Array(n * 4), sway = new Float32Array(n);
    let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    for (let v = 0; v < n; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2], ao = g.a[v * 5], fur = g.a[v * 5 + 1], kind = g.a[v * 5 + 2], tint = g.a[v * 5 + 3];
      const nn = NZ.n3(x * 0.45, y * 0.45, z * 0.45), n2 = NZ.n3(x * 0.11 + 5, y * 0.11, z * 0.11), t = tint * (0.95 + 0.07 * nn);
      col[v * 3] = Math.min(0.8, chalk.r * t * (1 + 0.035 * n2)); col[v * 3 + 1] = Math.min(0.8, chalk.g * t); col[v * 3 + 2] = Math.min(0.8, chalk.b * t * (1 - 0.06 * n2));
      let f = fur > 1 ? fur - 1 : fur * furMask(x, y, z);
      if (age.hollow && fur <= 1) f *= clamp(1.75 - 1.5 * ao, 0, 1);
      fx[v * 4] = f; fx[v * 4 + 1] = ao; fx[v * 4 + 2] = kind; fx[v * 4 + 3] = y - groundFast(x, z);
      sway[v] = g.a[v * 5 + 4];
      if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; if (z < bz0) bz0 = z; if (z > bz1) bz1 = z;
      if (v % 200 === 199) await ctx.yield();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aFx', new THREE.BufferAttribute(fx, 4));
    geo.setAttribute('aSway', new THREE.BufferAttribute(sway, 1));
    await ctx.yield();
    geo.setIndex(n > 65535 ? new THREE.BufferAttribute(new Uint32Array(g.i), 1) : new THREE.BufferAttribute(new Uint16Array(g.i), 1));
    await ctx.yield();
    await pausedNormals(geo, ctx.yield);
    await ctx.yield();
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3((bx0 + bx1) / 2, (by0 + by1) / 2, (bz0 + bz1) / 2), 0.5 * Math.hypot(bx1 - bx0, by1 - by0, bz1 - bz0) + 2);      // from the bake loop's bounds (+2 for the far-off swelling)
    return geo;
  }
  const object = new THREE.Group(); object.name = 'whale-fall-garden-hero';
  const meshes = [];
  for (const [g, name] of [[gSpine, 'spine'], [gRibs, 'ribs'], [gHead, 'skull-and-jaws']]) {
    const mesh = new THREE.Mesh(await finish(g), boneMat); mesh.name = name; object.add(mesh); meshes.push(mesh);
  }

  // ---- the plush: tufts of tapered blades seated on the furred parts of the bones
  const tuftN = Math.round(Math.max(9000, 15200 * detail) * age.tufts * (opts.tufts ?? 1));
  const iPos = new Float32Array(tuftN * 3), iNrm = new Float32Array(tuftN * 3), iDat = new Float32Array(tuftN * 4);
  {
    const share = [0.33, 0.46, 0.21], xCage = frameAt(S_RIB0).x; let w = 0;      // spine (weighted to the tail drums the lens skims), ribs, skull and jaws
    for (let q = 0; q < 3; q++) {
      const geo = meshes[q].geometry, P = geo.attributes.position.array, Nn = geo.attributes.normal.array, FX = geo.attributes.aFx.array, I = geo.index.array;
      const nt = I.length / 3, cum = new Float32Array(nt); let acc = 0;
      for (let t = 0; t < nt; t++) {
        const a = I[t * 3], b = I[t * 3 + 1], c = I[t * 3 + 2];
        const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
        const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx, ar = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
        const f = (FX[a * 4] + FX[b * 4] + FX[c * 4]) / 3;
        acc += ar * (f > 0.42 ? f : 0) * (q === 0 && P[a * 3] > xCage ? 2.0 : 1); cum[t] = acc;
        if (t % 1500 === 1499) await ctx.yield();
      }
      await ctx.yield();
      const want = q === 2 ? tuftN - w : Math.round(tuftN * share[q]);
      for (let k = 0; k < want && acc > 0; k++, w++) {
        let px = 0, py = 0, pz = 0, nx = 0, ny = 1, nz = 0;
        for (let tries = 0; tries < 4; tries++) {
          const r = rng() * acc; let lo = 0, hi = nt - 1;
          while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
          let u = rng(), v = rng(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
          const a = I[lo * 3], b = I[lo * 3 + 1], c = I[lo * 3 + 2], wa = 1 - u - v;
          px = P[a * 3] * wa + P[b * 3] * u + P[c * 3] * v; py = P[a * 3 + 1] * wa + P[b * 3 + 1] * u + P[c * 3 + 1] * v; pz = P[a * 3 + 2] * wa + P[b * 3 + 2] * u + P[c * 3 + 2] * v;
          nx = Nn[a * 3] * wa + Nn[b * 3] * u + Nn[c * 3] * v; ny = Nn[a * 3 + 1] * wa + Nn[b * 3 + 1] * u + Nn[c * 3 + 1] * v; nz = Nn[a * 3 + 2] * wa + Nn[b * 3 + 2] * u + Nn[c * 3 + 2] * v;
          if (FX[a * 4] * wa + FX[b * 4] * u + FX[c * 4] * v > 0.5) break;
        }
        const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        iPos[w * 3] = px; iPos[w * 3 + 1] = py; iPos[w * 3 + 2] = pz; iNrm[w * 3] = nx / nl; iNrm[w * 3 + 1] = ny / nl; iNrm[w * 3 + 2] = nz / nl;
        iDat[w * 4] = rng.range(0.30, 0.52) * (opts.tuftSize ?? 1) * (q === 0 ? lerp(0.45, 1, smoothstep(0, 44, 56 - px)) : 1); iDat[w * 4 + 1] = rng() * TAU; iDat[w * 4 + 2] = rng(); iDat[w * 4 + 3] = rng();
        if (k % 150 === 149) await ctx.yield();
      }
    }
  }
  const BLADES = 6, tv = new Float32Array(BLADES * 9);
  for (let b = 0; b < BLADES; b++) { const ph = (b / BLADES) * TAU + (b % 2) * 0.35; tv.set([ph, 0, -1, ph, 0, 1, ph, 1, 0], b * 9); }
  const tuftGeo = new THREE.InstancedBufferGeometry();
  tuftGeo.setAttribute('position', new THREE.BufferAttribute(tv, 3));
  tuftGeo.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
  tuftGeo.setAttribute('iNrm', new THREE.InstancedBufferAttribute(iNrm, 3));
  tuftGeo.setAttribute('iDat', new THREE.InstancedBufferAttribute(iDat, 4));
  tuftGeo.instanceCount = tuftN;
  tuftGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(-10, 0, 0), 90);
  const tuftMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: TUFT_VERT, fragmentShader: TUFT_FRAG, fog: true, side: THREE.DoubleSide });
  const tufts = new THREE.Mesh(tuftGeo, tuftMat); tufts.name = 'plush'; tufts.frustumCulled = false; object.add(tufts);
  await ctx.yield();

  // ---- the bed under the bones: silt ripples, the black halo, mat lace (opts.bed === false leaves it to the world)
  let bed = null;
  if (opts.bed !== false) {
    const nx = GX, nz = GZ, x0 = gx0, x1 = gx1, zm = gzm, z0 = gz0, z1 = gz1;
    const bp = new Float32Array((nx + 1) * (nz + 1) * 3), ba = new Float32Array((nx + 1) * (nz + 1) * 3), bi = [];
    const nf = feet.length / 3;
    for (let j = 0, v = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++, v++) {
        const x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz);
        let dm = 1e9;
        for (let f = 0; f < nf; f++) { const fx = x - feet[f * 3], fz = z - feet[f * 3 + 1], d = Math.sqrt(fx * fx + fz * fz) - feet[f * 3 + 2]; if (d < dm) dm = d; }
        const d = (x - FS.x) * FS.hx + (z - FS.z) * FS.hz;
        const rr = Math.hypot((x - (x0 + x1) / 2) / ((x1 - x0) / 2), (z - zm) / 50);
        bp[v * 3] = x; bp[v * 3 + 1] = hGrid[v] - 0.02; bp[v * 3 + 2] = z;
        ba[v * 3] = 1 - smoothstep(0.5, 15, dm); ba[v * 3 + 1] = 1.35 * (1 - smoothstep(0.55, 1, rr));
        const bl = (x - FS.x) * FS.lx + (z - FS.z) * FS.lz, shoulder = Math.exp(-(bl / 30) * (bl / 30));      // under the skull and the last straight the shoulder keeps its pale silt
        ba[v * 3 + 2] = smoothstep(0.15, 0.5, smoothstep(8, 34, d) * 0.9 * (1 - 0.75 * shoulder) + 0.45 * NZ.fbm2(x * 0.06, z * 0.06, 3) - 0.2);
      }
      await ctx.yield();
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; bi.push(a, c, b, b, c, d); }
    const bg = new THREE.BufferGeometry();
    bg.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bg.setAttribute('aBed', new THREE.BufferAttribute(ba, 3)); bg.setIndex(bi);
    await ctx.yield();
    await pausedNormals(bg, ctx.yield);
    bg.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, -10, zm), 125);
    const bedMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: BED_VERT, fragmentShader: BED_FRAG, fog: true });
    bed = new THREE.Mesh(bg, bedMat); bed.name = 'bed'; object.add(bed);
    await ctx.yield();
  }

  // ---- cyan sparks at the edge of each fresh print (pooled points, the only pixels that bloom)
  const perPrint = Math.min(40, Math.max(4, Math.round(14 * (opts.sparks ?? 1)))), NS = perPrint * 22;
  const sp = new Float32Array(NS * 3), sl = new Float32Array(NS * 2).fill(-100), ss = new Float32Array(NS);
  for (let i = 0; i < NS; i++) ss[i] = rng.range(0.1, 0.26);
  const sg = new THREE.BufferGeometry();
  const spA = new THREE.BufferAttribute(sp, 3), slA = new THREE.BufferAttribute(sl, 2);
  spA.setUsage(THREE.DynamicDrawUsage); slA.setUsage(THREE.DynamicDrawUsage);
  sg.setAttribute('position', spA); sg.setAttribute('aLife', slA); sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  sg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-10, 0, 0), 120);
  const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sparks.name = 'sparks'; sparks.frustumCulled = false; object.add(sparks);
  let sparkPtr = 0, lcg = Math.floor(rng() * 1e9) >>> 0;
  const rnd = () => { lcg = (Math.imul(lcg, 1664525) + 1013904223) >>> 0; return lcg / 4294967296; };

  // ---- prints and disturbers
  const dist = Array.from({ length: 4 }, () => ({ on: false, p: new THREE.Vector3(), last: new THREE.Vector3(0, -999, 0), r: 2 }));
  let printPtr = 0, demo = opts.demo !== false, now = 0, demoN = -1e9;
  const born = new Float64Array(NPRINT).fill(-1000);
  const hash = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  function stamp(p, r) {
    const q = printPtr; printPtr = (printPtr + 1) % NPRINT;
    U.uPrints.value[q].set(p.x, p.y, p.z, r); born[q] = now;
    for (let k = 0; k < perPrint; k++) {
      const i = sparkPtr; sparkPtr = (sparkPtr + 1) % NS;
      const a = rnd() * TAU, c = rnd() * 2 - 1, s = Math.sqrt(1 - c * c), rr = r * (0.75 + 0.3 * rnd());
      sp[i * 3] = p.x + Math.cos(a) * s * rr; sp[i * 3 + 1] = p.y + c * rr * 0.7; sp[i * 3 + 2] = p.z + Math.sin(a) * s * rr;
      sl[i * 2] = now + rnd() * 1.2; sl[i * 2 + 1] = 0.3 + rnd() * 0.3;
    }
    spA.needsUpdate = true; slA.needsUpdate = true;
  }
  const _v = new THREE.Vector3(), _v2 = new THREE.Vector2(), _sc = new THREE.Vector3();
  const standing = ribs.filter((r) => !r.fallen && !r.stub);
  const demoRib = standing[Math.floor(standing.length * 0.45)], demoSide = standing.filter((r) => r.side === 1);
  const along = (pts, u, out) => { const f = clamp(u, 0, 1) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)); return out.lerpVectors(pts[i], pts[i + 1], f - i); };

  // ---- anchors (local space)
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const naveY = 5.6, sEnd = S_RIB0 + (NRIB - 1) * RIB_GAP;
  const naveLine = []; for (let i = 0; i <= 8; i++) naveLine.push(V(M(frameAt(lerp(S_RIB0 - 1.5, sEnd + 1.5, i / 8)), 0, 0, naveY)));
  const archFeetY = (arch.feet[0].y + arch.feet[1].y) / 2;
  const archPass = V(M(FA, 0, 0, archFeetY + 7.6));
  const c35 = Math.cos(35 * Math.PI / 180), s35 = Math.sin(35 * Math.PI / 180);
  const straightStart = archPass.clone().add(new THREE.Vector3(FA.hx * 13, -3.8, FA.hz * 13));
  const portalPos = straightStart.clone().add(new THREE.Vector3(FA.hx * c35 * 60, -s35 * 60, FA.hz * c35 * 60));
  const fly = [];
  { const Ft = frameAt(0);
    fly.push(V(M(Ft, -30, -26, 26)), V(M(Ft, -22, -8, 12)), V(M(Ft, -9, 0, 4.2)));
    for (let i = 1; i < spineTop.length - 1; i += 5) { const p = spineTop[i]; if (p.x > frameAt(S_RIB0 - 3).x) fly.push(new THREE.Vector3(p.x, p.y + 2.1, p.z)); }
    for (const p of naveLine) fly.push(p.clone());
    for (let i = 2; i < skull.line.length; i += 2) fly.push(skull.line[i].clone().add(new THREE.Vector3(0, 4.8, 0)));
    fly.push(archPass.clone(), straightStart.clone(), portalPos.clone()); }
  const seats = [];
  for (const [ri, sd] of [[3, 1], [7, -1], [11, 1]]) { const F = frameAt(S_RIB0 + ri * RIB_GAP + 1.2); seats.push({ position: V(M(F, 0, sd * 2.7, 1.5 + groundH(F.x, F.z))), side: sd, rib: ri }); }
  seats.push({ position: skull.seat.clone(), side: 0, rib: -1 });
  const Fm = frameAt(40);
  const anchors = {
    portalSeat: { position: portalPos, normal: new THREE.Vector3(-FA.hx * c35, s35, -FA.hz * c35), radius: 7, tiltDeg: 35 },
    flyThrough: fly,
    naveLine, naveEntry: naveLine[0], naveExit: naveLine[naveLine.length - 1], naveClear: 1.8,
    sharkLine: naveLine.map((p) => new THREE.Vector3(p.x, 8.7, p.z)),
    spineTop, skullLine: skull.line, skullTip: skull.tip, occiput: skull.occ, occiput2: skull.occ2, occiputSeat: skull.occSeat, foramen: skull.foramen,
    archPass, archFeet: arch.feet, archTips: arch.tips, straightStart,
    ribs, octopusSeats: seats, scapulae, flipperLine, baleen: new THREE.Vector3(bc[0], groundH(bc[0], bc[2]) + 0.8, bc[2]),
    viewpoints: {
      reveal: V(M(Fm, 0, -62, 52)), tailLow: V(M(frameAt(0), -12, 0, 5)), naveMid: naveLine[4],
      archView: skull.line[Math.min(3, skull.line.length - 1)].clone().add(new THREE.Vector3(0, 5.5, 0)),
    },
    heading: new THREE.Vector3(FA.hx, 0, FA.hz), bowSign, age: ageName,
  };

  const center = new THREE.Vector3(-6, 3, zc(54) * 0.5), radius = 30, height = 16;
  return {
    object, radius, height, center, anchors, ground: false, groundY: 0,
    uniforms: U, age: ageName, groundHeight: groundH, groundFast, bed, plush: tufts, plushGLSL: PLUSH_GLSL, glsl: WFG_GLSL, feet,
    stats: { tufts: tuftN, boneTriangles: (gSpine.i.length + gRibs.i.length + gHead.i.length) / 3 },
    setLight(o) { applyLight(U, o); chalkTop(); },
    setGust(a) { U.uGustAmp.value = a; },
    // an animal touching the plush: i = 0..3, p in the hero's local space (null to lift it away), r = reach in units
    disturb(i, p, r = 2) { demo = false; const d = dist[i & 3]; if (!p) { d.on = false; return; } d.on = true; d.p.copy(p); d.r = r; },
    disturbWorld(i, p, r = 2) { if (!p) return this.disturb(i, null); object.updateWorldMatrix(true, false); _v.copy(p); object.worldToLocal(_v); this.disturb(i, _v, r / Math.max(1e-4, object.getWorldScale(_sc).x)); demo = false; },
    update(dt, time, camera) {
      now = time; U.uTime.value = time;
      object.updateWorldMatrix(true, false);
      camera.getWorldPosition(_v); object.worldToLocal(_v); U.uCamL.value.copy(_v);
      const hpx = ctx.renderer ? ctx.renderer.getDrawingBufferSize(_v2).y : 900, e5 = camera.projectionMatrix.elements[5] || 1.6, sc = object.getWorldScale(_sc).x || 1;
      U.uPx.value = 2 / (e5 * hpx * sc); U.uPxScale.value = e5 * hpx * 0.5 * sc;
      if (demo && demoRib) {   // viewer only, a pure function of time: a crab on one rib, a fin brushing along the cage
        const n = Math.floor(time / 0.45);
        if (n !== demoN) {
          demoN = n;
          for (let k = 0; k < NPRINT; k++) {
            const m = n - k, tk = m * 0.45, pr = U.uPrints.value[k];
            if (m & 1) { along(demoRib.points, 0.5 + 0.38 * Math.sin(tk * 0.33), _v); pr.set(_v.x, _v.y, _v.z, 1.5); }
            else { const q = ((tk * 0.11) % 1 + 1) % 1, rb = demoSide[Math.min(demoSide.length - 1, Math.floor(q * demoSide.length))]; along(rb.points, 0.5 + 0.12 * Math.sin(tk * 0.9), _v); pr.set(_v.x, _v.y, _v.z, 2.3); }
            born[k] = tk;
            for (let j = 0; j < perPrint; j++) {
              const i = k * perPrint + j, a = hash(m, j) * TAU, c = hash(m + 0.5, j) * 2 - 1, sn = Math.sqrt(1 - c * c), rr = pr.w * (0.75 + 0.3 * hash(m, j + 0.5));
              sp[i * 3] = pr.x + Math.cos(a) * sn * rr; sp[i * 3 + 1] = pr.y + c * rr * 0.7; sp[i * 3 + 2] = pr.z + Math.sin(a) * sn * rr;
              sl[i * 2] = tk + hash(m + 0.25, j) * 1.2; sl[i * 2 + 1] = 0.3 + hash(m + 0.75, j) * 0.3;
            }
          }
          spA.needsUpdate = true; slA.needsUpdate = true;
        }
      }
      const ages = U.uPrintAge.value;
      for (let i = 0; i < NPRINT; i++) { const a = now - born[i]; if (a < 0) born[i] = -1000; ages[i] = a < 0 ? 1000 : Math.min(a, 1000); }
      for (const d of dist) if (d.on && d.last.distanceTo(d.p) > d.r * 0.55) { d.last.copy(d.p); stamp(d.p, d.r); }
    },
    dispose() {},
  };
}

function applyLight(U, o) {
  if (o.dir) U.uKeyDir.value.copy(o.dir).normalize();
  for (const [k, u] of [['key', 'uKey'], ['sky', 'uSky'], ['bounce', 'uBounce'], ['shadow', 'uShadow'], ['crimson', 'uCrimson'], ['silt', 'uSilt']]) {
    if (o[k] !== undefined) U[u].value.set(o[k]); if (o[k + 'Scale']) U[u].value.multiplyScalar(o[k + 'Scale']);
  }
}
