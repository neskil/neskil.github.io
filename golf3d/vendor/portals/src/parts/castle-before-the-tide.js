// THE DRIP CATHEDRAL: hero set piece of "castle-before-the-tide" and the home of that world's style.
//
// WHAT IT IS. A horseshoe mound of patted wet sand (150 m wide, 250 m long, crest 30 m) open toward +Z, a nave trench
// 40 m wide between its arms, and eighteen drip spires on the crest: eight on the port arm (-X), seven on the
// starboard arm (+X), three on the head, 38 to 90 m tall, each a stack of 40-70 lopsided blobs with dribbled tongues;
// four fork, one is kinked. Spire 0 (first on the port arm, nearest +Z) is still being made: gobbets fall onto it
// every 1.2 s of the journey and it grows from 48 m to about 70 m. In the head wall is the scooped tunnel mouth with
// sixteen cockles round it; a notch scooped through the starboard arm lets one bar of sun rake the ring.
//
// SPACE. Origin = centre of the nave floor (y 0 = the court), +Y up, front = +Z (the open end, where the camera comes
// from). The world's course runs +Z with the sea to +X, so the world places it with object.rotation.y = Math.PI and
// position about (0, 8, 402): head wall at world z 465, arm ends at z 285. Then call hero.setSun(sunDirection(), centre).
// radius 112, height 122 (highest tip about 120 above the nave floor). It expects the court (flat sand, y 0 local)
// around it out to 75 m, where its own dry apron ends, and nothing solid along anchors.flyThrough.
//
// opts: palette (7 hex: wet, dry, shadow slate, water, foam/cream, sky, rust-rose; default = the brief's),
//   detail 0.6-1 (thins trickle grains), sun (Vector3 toward the sun in the hero's LOCAL space; it also aims the
//   notch), shadowLight (false: the piece adds no light; the world must then own exactly one shadow-casting
//   DirectionalLight), focus ('grow' | 'mouth' | 'nave' | 'file': set-piece viewer only, also ?cbtFocus=).
//
// RETURNS { object, radius, height, center, anchors, update, dispose, ground, groundY } plus
//   setProgress(u)   call every frame with the path's u. The drying clock is u itself; the gobbets run on a journey
//                    clock in real seconds (one lands every 1.2 s after a 4.5 s fall from 150 m above its place, at its
//                    true size of 3 m, a dark teardrop with a pale sunward edge) that loops on world time while u = 0
//                    and is held within -6 .. +3 s of u*42, so the spire is 48 m at the entry and about 70 m at
//                    the exit whatever the pace. Until it is first called the piece loops by itself (viewer).
//   setSun(dirWorld, centreWorld, half = 165, depth = 420)   world-space sun and the box its 2048 shadow map covers;
//                    the world widens it over the whole castle once, in build().
//   sun              the one DirectionalLight (intensity 0: it lights nothing, it only draws the shadow map)
//   reflection       a 13k-triangle silhouette of all eighteen spires, NOT in the object: add it under the water with
//                    scale.y = -1 for the mirrors
//   materials { sand, tint, drip, grains }, meshes { mound, spires[5], stem, drips, trickles, mouth, shells }, style
// anchors (local space; transform with object.localToWorld):
//   portalSeat { position, facing, radius 7 }   centre of the 14 m portal just inside the mouth (tunnel radius 7.5)
//   flyThrough [9 points]   a safe camera line, over 6 m clear: court -> 12 m above the crest beside the growing
//                    spire (12 m from the axis of its low fork) -> down into the nave -> level, straight to the mouth
//   growingSpire { foot, topAtArrival, topAtLeaving, footRadius }
//   forkLandings [{ position, journeySecond }]   five gobbets (journey seconds 21-31) land on a fork just begun on
//                    the nave side of the growing spire, at camera height; dripPass = the camera point beside them
//   spires [{ arm, foot, tip, footRadius }], notch { through, toward }, naveAxis [2], naveFloorY, crestY,
//   viewpoints { reveal, nave, threeQuarter }, footprint { halfWidth, zFront, zBack },
//   saddle   a hollow the heel of a hand pressed into the port crest between the growing spire and its neighbour:
//                    from the fly-through line it is a window on whatever lies to port of the mound
//
// THE STYLE, and what to shade the rest of the world with (all exported):
//   hero.style.uniforms   ONE SET PER BUILD (makeStyleUniforms(), made inside buildHero: two builds of the world in
//                    one page no longer share a sun or a clock). Never clone it: pigments, sky, uSunDir (world), uTime,
//                    uT, uDryClock, uWetY ... Shade with hero.sandMaterial(o) and hero.slumpDepthMaterial(), which are
//                    bound to that set. (STYLE.uniforms is only a default set for a viewer that has no hero.)
//   STYLE_GLSL       cbtWetness(P, N, edge, age) = THE RULE: sand is wet (dark ochre) or dry (pale biscuit), never
//                    between; any face steeper than 34 degrees is wet, the rest dries in islands that spread from
//                    arrises as uDryClock rises, a crust creeps over each lip and lets go on a 12 s cycle, and
//                    everything below uWetY (+ a ragged 2 m wick) is wet. cbtShade(base, wet, fresh, P, N, sun) =
//                    the one light: flat pigment where lit, slate #5C6078 laid over the sand where the cast shadow or
//                    the turn of the form puts it, sky sheen on wet, 3.7 cm grains and eased quartz glints inside
//                    25 m, bleach toward the horizon colour with distance (no fog). cbtSky(dir) = the sky gradient.
//   SHADOW_GLSL      cbtSun(shadowCoord): 16-tap smooth lookup of the one sun's shadow map
//   sandMaterial({ tint, drip, hole, side })   the material for everything: plain = the sand rule (geometry needs
//                    position, normal, aD = vec2(arris 0..1, freshly-wetted 0..1)); tint = any other pigment through
//                    the same light (vec4 aTint = linear rgb + wetness): shells, wrack, birds, hoppers
//                    options: hand (palm prints, heel and four fingers, pressed into every steep face as relief the
//                    one light and the sky fill both draw; six tapering arm furrows round the mouth, slate-floored with a lit lip), drib (blobs of slurry: runnels,
//                    lumps, and a pale cap from the baked weight aD.x), ripple, slump, hole
//   cbtHeadSun(P)    the light of the head wall worked out, not looked up (the sun grazes it at ten degrees): the shaft
//                    through the notch, the collar's shadow, the starboard crest's shadow line; uses uMouthW / uMouthN,
//                    which setSun() fills in world space. cbtSunN(shadowCoord, vNs) takes the receiver's normal in
//                    shadow-map space, so there are no hairlines along triangle edges
//   dripDepthMaterial(), DRIP_GLSL   the falling-and-landing morph, for the colour and the shadow pass alike
//   sunDirection(elev, starboard), PALETTE, SKY, JOURNEY_SECONDS
// Colours are written as plain linear values for post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1,
// contrast: 1, vignette: 0, grain: 0 } }; there is no inverse tone map in use (uInvTone stays 0; set it to 1 with
// uExposure only if the world must keep the filmic pipeline).
//
// COST: about 165k triangles in 11 draw calls (22 with the shadow pass), 7 programs, no textures, about 300 ms of
// build in short steps (longest about 25 ms). Slope rule kept at build: every dry form (talus cones, apron, crest
// hummocks, trickle cones) is generated under tan 34.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeRng, hashSeed } from '../kit/core.js';

export const PALETTE = ['#8E6A3A', '#E6D3AA', '#5C6078', '#86C9B4', '#F7F3E8', '#C6D8E2', '#C98A6B'];
export const SKY = { horizon: '#EEF1EC', zenith: '#B7CEDD' };
export const JOURNEY_SECONDS = 42;
const hyp = (a, b, c = 0) => Math.sqrt(a * a + b * b + c * c);
const SLOPE = Math.cos(34 * Math.PI / 180);      // n.y of a 34 degree face: the angle of repose of the dry state
const TAN34 = Math.tan(34 * Math.PI / 180);

// sun as the brief states it: 12 degrees up, 100 degrees to starboard of the course (world +Z), world space, toward the sun
export function sunDirection(elevDeg = 12, starboardDeg = 100) {
  const e = elevDeg * Math.PI / 180, a = starboardDeg * Math.PI / 180;
  return new THREE.Vector3(-Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).normalize();
}

// ---------------------------------------------------------------------------------------------------------
// THE STYLE. One set of uniforms per build, shared by every material of that build (same objects, never cloned).
// Colours are linear values meant for post.flat = 1 (what is written is what is shown). If the world keeps the
// tone-mapped pipeline instead, set uInvTone to 1 and uExposure to post.exposure: every pixel is then passed
// through the inverse of the engine's curve so the named pigments still land on their hex.
export const makeStyleUniforms = () => ({
    uWetC: { value: new THREE.Color(PALETTE[0]) },      // wet sand
    uDryC: { value: new THREE.Color(PALETTE[1]) },      // dry sand
    uShadeC: { value: new THREE.Color(PALETTE[2]) },    // the shadow slate
    uSkyLo: { value: new THREE.Color(SKY.horizon) },
    uSkyHi: { value: new THREE.Color(SKY.zenith) },
    uSunDir: { value: new THREE.Vector3(0.96, 0.21, 0.17).normalize() },   // WORLD space, toward the sun
    uTime: { value: 0 },          // seconds, ambient loops (glints, trickles)
    uT: { value: 0 },             // journey seconds = progress * 42: drips, slumps, anything keyed to the camera
    uDryClock: { value: 0.66 },   // 0 all wet .. 1 everything that may dry has dried; pale islands spread as it rises
    uWetY: { value: -1000 },      // WORLD y of the water line: sand below it (plus a ragged 2 m wick) is wet
    uShBias: { value: 0.3 },      // shadow normal offset in metres
    uInvTone: { value: 0 }, uExposure: { value: 1 },
    // THE TIDE (set by the world; the defaults mean "no water anywhere", so the piece alone is unchanged).
    // uSea: x = beach front now (water where -x + lobes < front), y = furthest front ever (wet sand), z = sea level y,
    //       w = front a few seconds ago (the mirror the backwash leaves)
    // uMoat[i]: x = tongue front now as the oval angle (water where angle > x; it runs from the port end to starboard),
    //       y = fill level y, z = furthest angle ever, w = seep level y (standing water before the tongue)
    // uCourt: x = front now on the court's run coordinate, y = furthest ever, z = level y
    uSea: { value: new THREE.Vector4(-1e5, -1e5, -1000, -1e5) },
    uMoat: { value: [new THREE.Vector4(10, -1000, 10, -1000), new THREE.Vector4(10, -1000, 10, -1000), new THREE.Vector4(10, -1000, 10, -1000)] },
    uMoatR: { value: new THREE.Vector3(340, 258, 193) },   // oval radius of the three moat centre lines
    uCourt: { value: new THREE.Vector4(-1e5, -1e5, 8.1, 0) },
    uTs: { value: 0 },             // journey second BY POSITION (the world sets it from u): slumps, which must happen where the camera is
    uMouthW: { value: new THREE.Vector4(0, -1e4, 0, 0) },   // WORLD centre of the cockle ring's plane (xyz) and 1 when the piece has been placed
    uMouthN: { value: new THREE.Vector3(0, 0, 1) },          // WORLD normal of that plane (out of the head wall)
    uRipple: { value: 1 }, uGlint: { value: 1 }, uBleach: { value: 1110 },   // metres over which distance bleaches (a sea fret shortens it)
    uShK: { value: 0.6 },          // how much slate the shadow keeps on the darkest sand (black sand lowers it, so shadow stays darker than lit)
    uFoamW: { value: new THREE.Color(PALETTE[4]) },      // the white of the foam, for the collar a front leaves on a standing face
});
// the default set (the set-piece viewer, and any material made without { uniforms }). buildHero() makes a FRESH set for
// every build and hands it back as hero.style.uniforms, so two instances of the world never write each other's light.
export const STYLE = { uniforms: makeStyleUniforms() };

const M3 = (e) => new THREE.Matrix3().fromArray(e).invert().elements.map((v) => v.toFixed(6)).join(',');
const ACES_IN_INV = M3([0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777]);
const ACES_OUT_INV = M3([1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602]);

const SADDLE_DEPTH = 6.5, SADDLE_NARROW = 1;      // the heel of a hand pressed the port crest down
export const STYLE_GLSL = /* glsl */`
  uniform vec3 uWetC, uDryC, uShadeC, uSkyLo, uSkyHi, uSunDir;
  uniform float uTime, uT, uDryClock, uWetY, uInvTone, uExposure, uRipple, uBleach, uGlint, uShK;
  uniform vec4 uSea, uCourt, uMoat[3], uMouthW; uniform vec3 uMoatR, uMouthN;
  uniform vec3 uFoamW;
  float cbtH31(vec3 p){ p = fract(p*vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y)*p.z); }
  float cbtN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(mix(cbtH31(i), cbtH31(i + vec3(1,0,0)), f.x), mix(cbtH31(i + vec3(0,1,0)), cbtH31(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(cbtH31(i + vec3(0,0,1)), cbtH31(i + vec3(1,0,1)), f.x), mix(cbtH31(i + vec3(0,1,1)), cbtH31(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float cbtBleach(float dist){ return (1. - exp(-max(dist - clamp(700. - uBleach, 150., 200.), 0.)/max(uBleach, 1.)))*0.9; }      // nothing within 150 m, a third gone by 600 m (uBleach 1110); a fret (short uBleach) starts 200 m out
  // the sky of this world: a plain bleached gradient, used for sheen and mirrors too
  vec3 cbtSky(vec3 d){ float h = clamp(d.y, 0., 1.); vec3 c = mix(uSkyLo, uSkyHi, smoothstep(0., 1., sqrt(h)));
    // the horizon's chalk white is cleaner and a little brighter on the sun's side (no disc, no band of another colour)
    float sl = max(dot(d.xz, uSunDir.xz)/max(length(d.xz)*length(uSunDir.xz), 1e-4), 0.);
    return c*(1. + 0.08*sl*sl*(1. - smoothstep(0., 0.42, h))); }
  // inverse of the engine's filmic curve (only used when uInvTone = 1): display-linear colour -> scene value
  vec3 cbtToScene(vec3 D){
    vec3 y = clamp(mat3(${ACES_OUT_INV})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
    return max(mat3(${ACES_IN_INV})*v, 0.)*(0.6/max(uExposure, 0.05));
  }
  // THE LIE OF THE BEACH, shared by the sand and the water. The castle is a family of ovals round (0, 385), 0.76 as
  // wide as long: cbtOval = (oval radius, angle: 0 on the approach axis, positive to port = +X). cbtBase = the smooth
  // beach (falls 1 in 40 to port, lifts 1 in 60 to starboard; the court is a table at y 8). cbtLobes = the ragged,
  // lobed offset of every wet front in metres. cbtCourtRun = the order in which the court and nave flood.
  vec2 cbtOval(vec2 p){ vec2 q = vec2(p.x/0.76 + 1e-5, 385. - p.y); return vec2(length(q), atan(q.x, q.y)); }
  float cbtBase(vec2 p){ float b = p.x > 0. ? -p.x*0.025 - 1.4*smoothstep(3., 24., p.x) : min(-p.x/60., 5.); return max(b, -12.); }
  float cbtLobes(vec2 p){ return (cbtN3(vec3(p*0.09, 1.7)) - 0.5)*11. + (cbtN3(vec3(p*0.37, 5.1)) - 0.5)*3. + (cbtN3(vec3(p*1.3, 8.3)) - 0.5)*0.8; }
  float cbtCourtRun(vec2 p){ return (p.y - 250.) - 0.5*p.x; }
  // the crown of the ramp through gate 3 floods with the court (its wandering edges are the world's: the same sines);
  // beside the crown the moat and the sea keep their own water
  float cbtRamp(vec2 p, float rho){ float w = abs(p.x) + 0.6*sin(p.y*0.31 + (p.x > 0. ? 3.4 : 1.3)) + 0.4*sin(p.y*0.83 + (p.x > 0. ? 0.5 : 2.6)); return step(w, 5.25)*step(rho + 0.4*cbtLobes(p), 197.)*step(161., rho)*step(p.y, 385.); }
  // the highest water that has ever stood at this place (world y; -1000 = never), n = 0..1 wick noise
  float cbtWetLine(vec3 P, float n){
    vec2 o = cbtOval(P.xz); float lob = cbtLobes(P.xz), wl = -1000.;
    if (o.x < 161. || cbtRamp(P.xz, o.x) > 0.5) { if (cbtCourtRun(P.xz) + lob < uCourt.y) wl = (o.x < 161. ? uCourt.z + 0.15 : 9.4) + 0.7*n; }
    else {
      if (-P.x + lob < uSea.y) wl = max(cbtBase(P.xz) + 0.45, uSea.z) + 1.1*n;
      for (int i = 0; i < 3; i++) {
        float r = i == 0 ? uMoatR.x : i == 1 ? uMoatR.y : uMoatR.z;
        float dm = o.x - r; if (i == 2 && dm > 0.) dm *= 0.62;      // moat 3 is dug wider on its outer side
        if (abs(dm) < 10. + 0.45*lob) wl = max(wl, (o.y + lob*0.004 > uMoat[i].z ? uMoat[i].y : uMoat[i].w) + 0.3 + 1.7*n);      // (the damp band ends in lobes, never on an arc)
      }
    }
    return wl;
  }
  bool cbtCut = false;      // set by a material that cuts pixels away (the mound's mouth, the gaps between falling grains): a pixel that is cut is still carried to the last derivative, for its neighbours' sake, and is cut there; on the way it is spared whatever feeds no derivative
  // THE COLLAR ON A FACE. Where a front of the tide reaches the foot of a standing face (a turret's drum, a wall, a
  // moat's bank, the nave's wall) it leaves a bright foam line at the waterline, never taller than a quarter of a metre,
  // and above that a hand of lace whose holes run all the way down and which frays to nothing within a metre of the
  // waterline (a metre and a half inside the curtain: the mound's foot, the nave's walls). Never a white wall: nothing
  // above the foam line is whole. It reads the fronts the water itself reads (uSea, uCourt, uMoat) and nothing else:
  // f = metres behind the front here, hgt = metres above the water that stands or runs at this foot (gy = the level
  // of a swash's film on the sand at this foot, given by the caller; the sea's own level where that is higher). Returns the white.
  float cbtWick = 0.;      // the wick above the collar: how far the damp has climbed the face here (0..1), left by cbtCollar; the sand there is wet sand
  float cbtCollar(vec3 P, float ny, float fy, float gy){
    cbtWick = 0.;
    if (cbtCut || abs(ny) > 0.8) return 0.;      // (nor on a pixel that is cut: the collar takes no derivative and feeds none)
    vec2 o = cbtOval(P.xz); float f = -1., hgt = 1e3, run = 12., lob = cbtLobes(P.xz);
    if (o.x < 161.) { hgt = P.y - uCourt.z; f = uCourt.x - (cbtCourtRun(P.xz) + lob); run = 40.; }
    else {
      float hs = P.y - max(gy, uSea.z);
      if (hs < 4.) { hgt = hs; f = uSea.x - (-P.x + lob); }
      for (int i = 0; i < 3; i++) {
        float r = i == 0 ? uMoatR.x : i == 1 ? uMoatR.y : uMoatR.z;
        float dm = o.x - r; if (i == 2 && dm > 0.) dm *= 0.62;
        float fm = (o.y - uMoat[i].x)*r*0.8, hm = P.y - uMoat[i].y;
        if (abs(dm) < 9.5 && fm > 0. && hm < 4. && hm < hgt) { f = fm; hgt = hm; run = 60.; }
      }
    }
    if (hgt > 5.2 || f < 0.) return 0.;
    float hc = 1. + 2.*cbtN3(vec3(P.xz*0.21, 5.));
    // the damp wicks up the face above the foam and stays when the foam has fallen back; its upper edge is soft and follows the grain (teeth of 0.4 m and of 1.7 m)
    cbtWick = smoothstep(0., 0.1*run, f)*(1. - smoothstep(-0.2, 0.2, hgt - 1.25*hc - 0.5 - 0.7*(cbtN3(vec3(P.xz*0.6, P.y*0.5)) - 0.5) - 0.35*(cbtN3(P*2.3) - 0.5)))*(1. - smoothstep(0.6, 0.8, abs(ny)));
    float slap = 0.5 + 0.5*sin(uTime*1.3 + 6.2832*cbtN3(vec3(P.xz*0.07, 3.)));      // where the water stands, the swell still slaps the foot now and again
    float surge = smoothstep(0., 0.1*run, f)*(0.42 + 0.58*max(exp(-f/max(run, 1.)), 0.8*slap*slap));
    float edge = 1./max(fy*0.9, 0.02);                                           // (fy = this pixel's height on the face, taken by the caller)
    // the foam line: 0.05 to 0.25 m of whole white standing on the water
    float lineH = 0.25*surge*(0.5 + 0.5*cbtN3(vec3(P.xz*1.1, uTime*0.7)));
    float a = smoothstep(-1., 1., (lineH - hgt)*edge);
    // the lace above it: holes a quarter of a metre across from the waterline up, more of them the higher, nothing left at its top; it frays as the front goes on
    float top = (o.x < 161. ? 1.5 : 1.)*smoothstep(0., 0.1*run, f)*(0.55 + 0.45*max(exp(-f/max(run, 1.)), 0.8*slap*slap))*(0.6 + 0.4*cbtN3(vec3(P.xz*0.21, 5.)));
    float up = clamp(hgt/max(top, 0.05), 0., 1.), fray = smoothstep(0.3*run, 1.6*run, f);
    float lace = cbtN3(vec3((P.x + P.z)*3.1, P.y*4.2 + uTime*0.35, (P.z - P.x)*3.1));
    lace = mix(lace, 0.5, smoothstep(0.05, 0.16, fy));      // (under three pixels a hole gives way to its mean: far off the collar is the foam line and a breath of white over it, never a dotted fringe)
    a = max(a, smoothstep(0.46, 0.6, lace + 0.1 - 0.12*up - 0.08*fray)*(1. - smoothstep(0.55, 1., up))*smoothstep(-1., 1., (top - hgt)*edge));
    // (nothing of it lower than 0.6 m under the water)
    return a*step(-0.6, hgt)*(1. - smoothstep(0.6, 0.8, abs(ny)));
  }
  // THE HAND. One palm print per cell (7 x 9.6 m, three staggered layers; a print never reaches its cell's edge): a shallow bowl with four finger grooves.
  // q = (metres along the face, metres up it), fine = 0..1 keeps the grooves (0 when they are under three pixels).
  float cbtPalmSoft = 0.03;     // how soft a print's edges are, in the print's own coordinate: a pixel and a half of it (set by the material from the pixel's footprint before it asks for prints)
  float cbtPalm(vec2 q, float fine){
    float d = 0., sf = cbtPalmSoft;
    for (int k = 0; k < 3; k++) {
      vec2 A = q + float(k)*vec2(2.33, 3.2), c = floor(A/vec2(7.0, 9.6));
      float r = cbtH31(vec3(c, float(k)*7. + 3.)), r2 = fract(r*7.13), r3 = fract(r*13.7);
      vec2 l = A - (c + 0.5)*vec2(7.0, 9.6) + (vec2(r, r2) - 0.5)*vec2(0.3, 1.0);
      float t = (r3 - 0.5)*0.6, cs = cos(t), sn = sin(t), sz = 0.8 + 0.25*fract(r*31.7);
      vec2 u = vec2(l.x*cs + l.y*sn, -l.x*sn + l.y*cs)/(vec2(2.3, 3.5)*sz);
      if (abs(u.x) < 1. && abs(u.y) < 1. && fract(r*57.3) > 0.08) {
        // a pressed print is crisp: the heel a dish with a firm rim, the four fingers flat-floored grooves with firm sides
        // and rounded tips; every edge is as soft as a pixel and a half and no softer, so the print neither smears close to nor glitters far off
        vec2 hq = vec2(u.x/0.78, (u.y + 0.42)/0.52); float eh = dot(hq, hq), heel = 0.72*smoothstep(0., 0.62 + 2.*sf, 1. - eh);   // the heel of the hand
        float env = smoothstep(-0.2 - sf, -0.1 + sf, u.y)*(1. - smoothstep(0.66 + 0.2*cos(u.x*2.2) - sf, 0.8 + 0.2*cos(u.x*2.2) + sf, u.y))*(1. - smoothstep(0.74 - sf, 0.8 + sf, abs(u.x)));
        float fx = smoothstep(0.34 - sf, 0.6 + sf, 0.5 + 0.5*cos((u.x*2.5 + 0.5)*6.2832));                             // four fingers
        float fing = env*mix(0.14, 0.05 + fx*0.21, fine);
        d = max(d, max(heel, fing)*(0.75 + 0.25*r));
      }
    }
    return d;
  }
  // press a depth h (metres, positive = pushed in) into the surface: the normal it leaves (screen-space, no tangents)
  vec3 cbtBump(vec3 P, vec3 N, float h){
    vec3 dpx = dFdx(P), dpy = dFdy(P); float hx = dFdx(h), hy = dFdy(h);
    vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
    if (abs(det) < 1e-12) return N;
    vec3 g = (hx*r1 + hy*r2)/det;
    float gl = length(g); g *= min(1., 1.6/max(gl, 1e-4));                 // never past about 58 degrees
    vec3 n = N + g; return n/max(length(n), 1e-4);
  }
  // dribbled slurry: runnels and ridges running down a steep face (0 groove .. 1 ridge), lumps between them
  float cbtDrib(vec3 P, vec3 N){
    vec3 w = N*N; float wx = w.x/max(w.x + w.z, 1e-4);
    float wob = 0.7*cbtN3(vec3(P.y*0.16, P.x*0.21, P.z*0.21)) + 0.5*cbtN3(P*vec3(0.5, 0.2, 0.5));
    float a = 0.5 + 0.5*cos((P.z + wob)*4.6), b = 0.5 + 0.5*cos((P.x + wob)*4.6 + 1.7);
    return mix(b, a, smoothstep(0.25, 0.75, wx));
  }
  // THE ONE BAR OF SUN on the head wall. The sun grazes that wall at ten degrees, which no shadow map can draw
  // (a texel smears into two metres), so inside the zone round the mouth the light is worked out: the shaft through
  // the notch in the starboard arm, the shadow the pressed collar throws on the wall behind it, and the top of the
  // wall above the starboard crest's shadow. Returns (zone weight, lit).
  vec2 cbtHeadSun(vec3 P){
    if (uMouthW.w < 0.5) return vec2(0.);
    vec3 d = P - uMouthW.xyz, T = vec3(uMouthN.z, 0., -uMouthN.x); T /= max(length(T), 1e-4);
    float dn = dot(d, uMouthN), lat = dot(d, T);
    float zone = (1. - smoothstep(2.6, 4.6, dn))*smoothstep(-30., -27., dn)*(1. - smoothstep(24., 27., abs(lat)))*(1. - smoothstep(21., 24., d.y));
    if (zone < 0.001) return vec2(0.);
    vec2 sh2 = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
    // ONE bar with clean edges: the notch's two sides, drawn out along the wall by the grazing sun, bound it left and
    // right (30 m, the ring and a little more); its top falls away from the sun at the sun's own slope; everything
    // else on the head wall is in the shade of the starboard file and the head's own spires
    float rag = (cbtN3(P*0.45) - 0.5)*0.5 + (cbtN3(P*1.7) - 0.5)*0.15;
    float ls = lat*sign(dot(T.xz, sh2) + 1e-5);                            // metres along the wall toward the sun
    float bar = 1. - smoothstep(18.4, 19.2, abs(lat) + rag);
    float tanE = uSunDir.y/max(length(uSunDir.xz), 1e-4);
    bar *= 1. - smoothstep(-0.4, 0.4, d.y - (15. + ls*tanE + rag));
    return vec2(zone, bar);
  }
  float cbtTide = 0.;           // (out of cbtWetnessY) 1 where the sand is wet because water has stood or run there
  float cbtRippled = 0.;        // 0..1, set by a material where it draws ripples: there the drying front follows the ripples' own crests, a clean ragged line, and is not broken up by islands as small as a ripple
  // THE RULE. Returns wetness 0 (dry, pale) or 1 (wet, dark), hard-edged along a ragged front.
  //  P world position, N unperturbed world normal, edge 0..1 = how much of an arris this is (dries first),
  //  age 0..1 = how recently it was wetted (1 = just now, cannot dry yet)
  float cbtWetnessY(vec3 P, float ny, float edge, float age){
    vec3 fq3 = fwidth(P); float fqm = max(max(fq3.x, fq3.y), fq3.z);      // this pixel's footprint in metres
    // (the teeth of a front are noise of 0.43 m and 1.1 m: each gives way to its mean when a tooth is under three pixels, so a far front is ragged, never dithered)
    float rag = cbtN3(P*0.55)*0.6 + mix(cbtN3(P*2.3), 0.5, smoothstep(0.07, 0.16, fqm))*0.4;
    float ph = fract(uTime*0.085 + cbtN3(P*0.13 + 21.)*2.3 + rag*0.25);
    float crust = smoothstep(0., 0.82, ph)*(1. - smoothstep(0.88, 1., ph));   // a crust dries out over the lip for ten seconds, then lets go
    float s = ny - ${SLOPE.toFixed(4)} + (rag - 0.5)*0.07 + 0.085*(crust - 0.45);   // steeper than 34 degrees: always wet
    float canDry = smoothstep(-1., 1., s/max(fwidth(s)*0.9, 0.002));
    float thr = cbtN3(P*0.21 + 9.)*0.55 + mix(cbtN3(P*0.9 + 4.), 0.5, max(smoothstep(0.18, 0.42, fqm), 0.75*cbtRippled))*0.3 + rag*0.15*(1. - 0.6*cbtRippled) - edge*0.55 + age*1.2;
    float c = uDryClock - thr;                                             // pale islands grow from arrises as the clock rises
    float dried = smoothstep(-1., 1., c/max(fwidth(c)*0.9, 0.004));
    float wk = cbtN3(vec3(P.xz*0.35, 3.));
    float wl = max(uWetY + 0.4 + 2.2*wk, cbtWetLine(P, wk)) - P.y;         // water line and its wick
    float above = 1. - smoothstep(-1., 1., wl/max(fwidth(wl)*0.9, 0.01));
    cbtTide = 1. - above;
    return 1. - canDry*dried*above;
  }
  float cbtWetness(vec3 P, vec3 N, float edge, float age){ return cbtWetnessY(P, N.y, edge, age); }
  // THE SHADING, for every surface of the world. base = pigment (linear), wet 0..1 (sheen), fresh 0..1 (glossy new
  // slurry), sh = 1 lit .. 0 in cast shadow. Grains resolve near the camera and average out with distance.
  float cbtGrainFar = 24.;      // metres within which single grains turn the light (a material may set it before shading)
  float cbtGrainK = 0.;         // the surface's own speckle (relative), set by a material so that shade keeps the grain as the sun does
  float cbtSheen = 0.;          // 0..1, set by a material: a flat the tide has wetted mirrors the sky at grazing angles
  float cbtDeep = 1.;           // 1 for sand (the deeper shade of wet sand in cast shadow); a material of another pigment sets it to 0
  vec3 cbtPrintD = vec3(0.);    // set by a material that presses palm prints: the face's own normal less the normal its prints leave (0 where no print is)
  float cbtPrintSh = 1.;        // and the cast shadow of that face before the print lays its own crescent of shade in it
  vec3 cbtShadeC(vec3 base, float wet, float fresh, vec3 P, vec3 N, float sh, float cav){
    vec3 fp = fwidth(P);      // (this pixel's footprint, for the glitter below: taken first and for every pixel, so that a pixel that is cut gives it to its neighbours and is shaded no further)
    if (cbtCut) return vec3(0.);
    vec3 V = cameraPosition - P; float dist = length(V); V /= max(dist, 1e-3);
    float gf = (1. - smoothstep(7., cbtGrainFar, dist))*(1. - 0.8*fresh), cf = 1. - smoothstep(60., 220., dist);
    vec3 cell = floor(P*27.);
    float r0 = cbtH31(cell);
    vec3 gn = vec3(r0, cbtH31(cell + 3.1), cbtH31(cell + 7.7)) - 0.5;
    vec3 cn = vec3(cbtN3(P*2.6), cbtN3(P*2.6 + 11.), cbtN3(P*2.6 + 23.)) - 0.5;
    vec3 n2 = N + gn*0.85*gf + cn*0.32*cf*(1. - 0.7*fresh); n2 /= max(length(n2), 1e-3);
    float ndl = dot(n2, uSunDir), big = dot(N, uSunDir);
    float ndt = mix(big, ndl, 0.4 + 0.6*gf);                             // grains decide the terminator near the camera, lumps count for less far off
    float lit = smoothstep(-0.07, 0.16, ndt)*smoothstep(-0.10, 0.04, big)*sh;
    float gk = ((r0 - 0.5)*0.17 - 0.3*step(0.94, cbtH31(cell + 5.9)))*gf + (cbtN3(P*0.8) - 0.5)*0.04;
    base *= 1. + gk;
    base *= 1. - 0.58*fresh;
    // one low sun: flats take the pigment as written, a face the sun meets squarely is brighter and faintly lemon,
    // a face it only grazes is duller, so every turret and blob has a lit side before its shadow side
    vec3 litC = base*(mix(0.76, 1., smoothstep(-0.02, 0.2, ndl)) + 0.14*(1. - 0.55*wet)*smoothstep(0.2, 0.8, ndl))*mix(vec3(1.), vec3(1.03, 1.015, 0.93), smoothstep(0.1, 0.6, ndl));
    litC *= mix(vec3(1.), vec3(1.012, 1.022, 0.95), smoothstep(0.1, 0.6, ndl));      // the lemon a little clearer against the slate (green rises with red, blue falls: never orange)
    float up = clamp(n2.y*0.5 + 0.5, 0., 1.);
    float fill = (0.6 + 0.45*up)*(1. - 0.52*cav);                        // the large soft sky draws the form inside a shadow: faces turned up are lighter, hollows darker
    float lum = dot(base, vec3(0.3, 0.5, 0.2));
    vec2 sh2 = uSunDir.xz/max(length(uSunDir.xz), 1e-4);
    fill *= 1. + 0.3*clamp(dot(n2.xz, sh2), -1., 1.);                     // (two tones of slate: the sky on the sun's side is the brighter half)
    // shade is drawn, not laid flat: every grain, speck and print the sun would show is there in two tones of slate
    fill *= 1. + 2.6*gk + 1.5*cbtGrainK + 0.55*step(0.95, cbtH31(cell + 2.3))*gf;
    vec3 shT = uShadeC*mix(vec3(0.9, 0.94, 1.13), vec3(1.), smoothstep(0.2, 0.55, lum));      // blue-violet over ochre, the brief's slate on pale sand
    vec3 shC = shT*(uShK*0.95 + 0.7*lum)*max(fill, 0.3);                  // slate laid over the sand's own colour
    shC += base*uShadeC*0.3*max(-dot(n2.xz, sh2), 0.)*(1. - up*0.5)*(1. - 0.3*cav);     // a little light handed back by the sunlit sand opposite
    // IN SHADE A PRINT ONLY DARKENS: where the face without its print would lie in shade, no part of the print (its rim,
    // its finger grooves) is paler than that face is beside it; tone on tone, two close tones of slate. Where the sun is
    // on the face (the bar on the head wall, any lit wall) the print is drawn as it was.
    float printK = 0., printFr = 0.;
    if (dot(cbtPrintD, cbtPrintD) > 1e-9) {
      vec3 Nf = N + cbtPrintD; Nf /= max(length(Nf), 1e-4);
      vec3 n0 = Nf + gn*0.85*gf + cn*0.32*cf*(1. - 0.7*fresh); n0 /= max(length(n0), 1e-3);
      float big0 = dot(Nf, uSunDir), up0 = clamp(n0.y*0.5 + 0.5, 0., 1.);
      float lit0 = smoothstep(-0.07, 0.16, mix(big0, dot(n0, uSunDir), 0.4 + 0.6*gf))*smoothstep(-0.10, 0.04, big0)*cbtPrintSh;
      float fill0 = (0.6 + 0.45*up0)*(1. + 0.3*clamp(dot(n0.xz, sh2), -1., 1.))*(1. + 2.6*gk + 1.5*cbtGrainK + 0.55*step(0.95, cbtH31(cell + 2.3))*gf);
      vec3 shC0 = shT*(uShK*0.95 + 0.7*lum)*max(fill0, 0.3) + base*uShadeC*0.3*max(-dot(n0.xz, sh2), 0.)*(1. - up0*0.5);
      printK = 1. - lit0;
      shC = mix(shC, min(shC, shC0), printK);
      printFr = 1. - max(dot(Nf, V), 0.); printFr *= printFr; printFr *= printFr;
    }
    // THE DARK: one further step of the same blue-violet, only where the sand is both wet and in cast shadow (the nave's
    // floor and lower faces, the shaded side of every wet wall and blob); its edges are the cast edges; never darker
    // than half the slate's value
    // (the floor bounds the deepening, never the shade itself: the step can only darken, and only down to the floor;
    // shade that is already at or under the floor, as on black sand, stays exactly as it was drawn)
    shC = min(shC, max(shC*(1. - 0.42*cbtDeep*clamp(wet, 0., 1.)*(1. - sh)), uShadeC*0.23));
    vec3 col = mix(shC, litC, lit);
    float fr = 1. - max(dot(N, V), 0.); fr *= fr; fr *= fr;
    if (printK > 0.) fr = mix(fr, min(fr, printFr), printK);      // (nor does a print's rim take more sky in shade than the face beside it)
    vec3 R = reflect(-V, N); R.y = abs(R.y);
    col = mix(col, cbtSky(R), min(fr*(0.34*wet + 0.4*fresh + 0.55*cbtSheen), 0.92));      // faint sheen of sky at grazing angles; a tide-wet flat is a mirror far off
    float sp = max(dot(R, uSunDir), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    col += vec3(1., 0.98, 0.9)*sp*sp*fresh*sh*0.55;                     // wet gloss of a blob that has just landed
    float tw = smoothstep(0.2, 1., 0.5 + 0.5*sin(uTime*1.7 + r0*311.));
    col += vec3(1., 0.98, 0.92)*step(0.988, cbtH31(cell + 13.3))*tw*lit*(1. - wet)*(1. - smoothstep(6., 25., dist))*0.5;   // quartz glints
    // sand in a low sun glitters at any distance: sparks one to two pixels across (the cells grow with the pixel's
    // footprint, so nothing shimmers), each easing in and out on its own clock
    { float pm = max(max(fp.x, fp.y), fp.z);
      float lv = floor(log2(max(pm, 0.004)/0.004)), cs = 1./(0.0062*exp2(lv));
      vec3 gc = floor(P*cs) + lv*17.; float gh = cbtH31(gc), g2 = cbtH31(gc + 9.7);
      float tw2 = smoothstep(0.5, 1., 0.5 + 0.5*sin(uTime*(1.1 + 2.2*g2) + g2*97.));
      col += vec3(1., 0.98, 0.9)*step(0.98, gh)*tw2*lit*(0.17 + 0.15*wet)*clamp(0.08 + 2.4*lum, 0., 1.)*uGlint; }
    col = mix(col, uSkyLo, cbtBleach(dist));     // distance bleaches: a third gone by 600 m
    return uInvTone > 0.5 ? cbtToScene(col) : col;
  }
  vec3 cbtShade(vec3 base, float wet, float fresh, vec3 P, vec3 N, float sh){ return cbtShadeC(base, wet, fresh, P, N, sh, 0.); }
`;

// A falling gobbet and the blob it becomes are one instance: 'ball' in the air, 'land' once it has hit, a skirt that
// sags afterwards. inst = (journey second at which it lands, seed). Used by the colour and the depth program alike.
export const DRIP_GLSL = /* glsl */`
  vec3 cbtDrip(vec3 land, vec3 ball, vec3 nLand, vec2 inst, float T, out vec3 nrm, out float fresh, out float age, out float lift){
    float t = T - inst.x;
    float air = clamp(-t/4.5, 0., 1.), vis = step(-4.5, t);
    float s = clamp(t/0.7, 0., 1.); s = 1. - (1. - s)*(1. - s);
    float sag = smoothstep(0.1, 3.8, t);
    vec3 wob = ball*(1. + 0.07*sin(T*5.3 + inst.y*40. + ball.y*3.));
    float tau = 1. - air;                                                              // 0 let go .. 1 landed
    wob.xz *= 1. - 0.82*smoothstep(0., 1., ball.y); wob.y *= ball.y > 0. ? 1.7 + 2.6*tau : 1.;   // a teardrop with a tail that draws out as it gathers speed
    vec3 L = land;
    L.y = land.y < 0. ? land.y*mix(0.2, 1., sag) : land.y*(1. + 0.3*(1. - sag));       // the skirt creeps down, the crown settles
    L.xz *= mix(0.86, 1., sag) + 0.27*sin(s*3.14159)*(1. - sag); L.y *= 1. - 0.24*sin(s*3.14159)*(1. - sag);      // the splat: out and flat for a moment
    vec3 nb = ball + vec3(0., 1e-3, 0.); nb /= max(length(nb), 1e-4);
    vec3 nm = mix(nb, nLand, s); nrm = nm/max(length(nm), 1e-4);
    lift = (1. - 0.3*tau - 0.7*tau*tau)*150.*step(1e-4, air);                         // it falls as things fall: slow at the top, fast at the bottom (let go 150 m up: above any frame of the approach)
    fresh = (1. - smoothstep(1.5, 9., t));
    age = 1. - smoothstep(7., 24., t);
    return mix(wob, L, s)*vis;
  }
`;

// A form sitting down, for the colour and the depth program alike. pos = the form, fan = what it becomes, sl = (journey
// second it starts, how far below its foot the fan rests). Walls go foot first within 3.5 s. A bucket turret (instanced)
// goes the way a real one does: the foot darkens and runs out into a skirt, and the drum that still stands rides down
// into it, notched rim and all, tilting toward the side that went first (3.4 s in all).
export const SLUMP_GLSL = /* glsl */`
  vec3 cbtSlump(vec3 pos, vec3 fan, vec2 sl, float ts, out float k, out float st, out float h){
    st = ts - sl.x; h = clamp((pos.y - fan.y)/10., 0., 1.);
    #ifdef USE_INSTANCING
      st += 0.03*clamp(pos.x, -7., 7.);
      float S = -7. + 23.*smoothstep(-0.8, 3.4, st);            // how far it has sat down (the side that went first is lower: the rim tilts)
      k = smoothstep(pos.y - 0.5, pos.y + 3.0, S);               // what reaches the ground runs out into the fan (nothing, until it starts); above it the drum stays a drum
      vec3 q = pos; q.y -= max(S, 0.); q.xz *= 1. + 0.05*smoothstep(0., 2., st);
      vec3 fn = fan - vec3(0., sl.y, 0.); fn.xz *= mix(0.42, 1., smoothstep(0.2, 4.8, st));      // the skirt runs out as the drum comes down
      return mix(q, fn, k);
    #else
      k = clamp((st - 0.9*h)/2.6, 0., 1.); k = k*k*(3. - 2.*k);
      return mix(pos, fan - vec3(0., sl.y, 0.), k);
    #endif
  }
`;

const SAND_VERT = /* glsl */`
  #include <common>
  #include <shadowmap_pars_vertex>
  uniform float uShBias, uT, uTs; uniform vec3 uSunDir;
  attribute vec2 aD;
  #ifdef TINT
    attribute vec4 aTint; varying vec4 vTint;
  #endif
  #ifdef DRIP
    attribute vec3 aBall; attribute vec2 aLand; varying float vAir;
    ${DRIP_GLSL}
  #endif
  #ifdef SLUMP
    attribute vec3 aFan, aFanN; attribute vec2 aSlump;
    ${SLUMP_GLSL}
  #endif
  #ifdef BUCKET
    attribute vec2 aFoot; varying vec3 vSunL, vBk;
  #endif
  varying vec3 vW, vN, vD, vL, vNs; varying vec4 vSh;
  void main(){
    vec3 p = position, n = normal; float fresh = 0., age = aD.y, lift = 0.;
    #ifdef SLUMP
      float sk, st, sh_;
      { p = cbtSlump(position, aFan, aSlump, uTs, sk, st, sh_);
        n = mix(normal, aFanN, sk); n /= max(length(n), 1e-4);
        float wetS = smoothstep(-3., -0.3, st)*(1. - smoothstep(0.12, 0.5, sh_ - 0.27*max(st, 0.)));          // the foot darkens before it goes, and the dark climbs the drum as it rides down
        #ifdef USE_INSTANCING
          wetS *= 1. - smoothstep(2.0, 3.2, st - 1.0*(1. - sh_));                         // what was the dry top lies pale on the fan; its margin stays dark a while
          fresh = max(sk, 0.75*wetS*(1. - sh_))*wetS;
        #else
          fresh = sk*(1. - smoothstep(5., 16., st));
        #endif
        age = max(age, wetS); }
    #endif
    #ifdef DRIP
      p = cbtDrip(position, aBall, normal, aLand, uT, n, fresh, age, lift);
      vAir = step(1e-3, lift);
    #endif
    vL = p;
    vec4 lp = vec4(p, 1.); vec3 ln = n;
    #ifdef USE_INSTANCING
      lp = instanceMatrix*lp; ln = mat3(instanceMatrix)*ln;
    #endif
    vec4 wp = modelMatrix*lp; wp.y += lift;
    vec3 wn = mat3(modelMatrix)*ln; wn /= max(length(wn), 1e-5);
    vW = wp.xyz; vN = wn; vD = vec3(aD.x, age, fresh);
    #ifdef BUCKET
      vSunL = uSunDir; vBk = vec3(0., aFoot);      // aFoot = where the ground meets the cast, outside and inside the wall (local y)
      #ifdef USE_INSTANCING
        vSunL = uSunDir*mat3(modelMatrix*instanceMatrix);      // the sun in the turret's own frame
      #endif
      #ifdef SLUMP
        vBk.x = sk;
      #endif
    #endif
    #ifdef TINT
      vTint = aTint;
    #endif
    vSh = vec4(0.); vNs = vec3(0., 0., 1.);
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
      vec3 so = wn*uShBias;
      #ifdef SUNSHIFT
        so += uSunDir*(1.5*(1. - abs(wn.y)));      // upright faces the low sun grazes are looked up a little toward it: no blotches of self-shadow
      #endif
      vSh = directionalShadowMatrix[0]*(wp + vec4(so, 0.));
      vNs = transpose(inverse(mat3(directionalShadowMatrix[0])))*wn;      // this surface's normal in the shadow map's own space
    #endif
    gl_Position = projectionMatrix*viewMatrix*wp;
  }
`;

// cast shadow of the one sun (1 lit .. 0 shadowed): sixteen taps on the 4 x 4 texels round the point, weighted by a
// cubic B-spline, so the edge is a smooth ramp two texels wide with no stair-steps at the closest pass. Each tap is
// compared on the receiver's own plane (its depth slope across the map), so walls the low sun only grazes do not speckle.
export const SHADOW_GLSL = /* glsl */`
  #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    float cbtRow(vec2 b, float dx, vec4 w, float z, float gz){
      return w.x*texture2DCompare(directionalShadowMap[0], b, z) + w.y*texture2DCompare(directionalShadowMap[0], b + vec2(dx, 0.), z + gz)
           + w.z*texture2DCompare(directionalShadowMap[0], b + vec2(2.*dx, 0.), z + 2.*gz) + w.w*texture2DCompare(directionalShadowMap[0], b + vec2(3.*dx, 0.), z + 3.*gz);
    }
    vec4 cbtBsp(float f){ float f2 = f*f, f3 = f2*f; return vec4((1. - f)*(1. - f)*(1. - f), 3.*f3 - 6.*f2 + 4., -3.*f3 + 3.*f2 + 3.*f + 1., f3)/6.; }
  #endif
  // ns = the receiver's normal in shadow-map space (vNs of the sand vertex shader); pass vec3(0.) to have the slope
  // measured from screen derivatives instead (fine on one flat sheet such as the water)
  float cbtSunN(vec4 sc, vec3 ns){
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
      vec3 c = sc.xyz/max(sc.w, 1e-4);
      vec3 cx = dFdx(c), cy = dFdy(c);
      if (c.x < 0.003 || c.x > 0.997 || c.y < 0.003 || c.y > 0.997 || c.z > 1.) return 1.;
      float det = cx.x*cy.y - cx.y*cy.x; det = abs(det) < 1e-12 ? 1e-12 : det;
      vec2 g = clamp(vec2(cy.y*cx.z - cx.y*cy.z, cx.x*cy.z - cy.x*cx.z)/det, -5., 5.);   // depth slope of this surface per unit of map uv
      if (dot(ns, ns) > 1e-12) { float nz = abs(ns.z) < 1e-6 ? (ns.z < 0. ? -1e-6 : 1e-6) : ns.z; g = clamp(-ns.xy/nz, -5., 5.); }   // from the normal: no jump at triangle edges
      vec2 sz = directionalLightShadows[0].shadowMapSize;
      vec2 uv = c.xy*sz - 0.5, f = fract(uv), b = (floor(uv) - 0.5)/sz, d = 1./sz;
      float z = c.z + directionalLightShadows[0].shadowBias + dot(g, b - c.xy) - 0.6*(abs(g.x)*d.x + abs(g.y)*d.y);
      vec4 wx = cbtBsp(f.x), wy = cbtBsp(f.y); vec2 gd = g*d;
      return wy.x*cbtRow(b, d.x, wx, z, gd.x) + wy.y*cbtRow(b + vec2(0., d.y), d.x, wx, z + gd.y, gd.x)
           + wy.z*cbtRow(b + vec2(0., 2.*d.y), d.x, wx, z + 2.*gd.y, gd.x) + wy.w*cbtRow(b + vec2(0., 3.*d.y), d.x, wx, z + 3.*gd.y, gd.x);
    #else
      return 1.;
    #endif
  }
  float cbtSun(vec4 sc){ return cbtSunN(sc, vec3(0.)); }
`;

const SAND_FRAG = /* glsl */`
  #include <common>
  #include <packing>
  #include <shadowmap_pars_fragment>
  ${STYLE_GLSL}
  ${SHADOW_GLSL}
  varying vec3 vW, vN, vD, vL, vNs; varying vec4 vSh;
  #ifdef BUCKET
    varying vec3 vSunL, vBk;
  #endif
  #ifdef TINT
    varying vec4 vTint;
  #endif
  #ifdef DRIP
    varying float vAir;
  #endif
  #ifdef HOLE
    uniform vec4 uHole;       // local x, y, z of the mouth centre and its radius
  #endif
  void main(){
    #ifdef HOLE
      // (the round mouth is decided here and cut further down, straight after the shading: the shading takes this pixel's
      // footprint by a derivative, and a derivative taken after a cut is not defined for the pixels round the hole)
      cbtCut = length(vL.xy - uHole.xy) < uHole.w && vL.z < uHole.z + 3. && vL.z > uHole.z - 12.;
    #endif
    vec3 N = vN/max(length(vN), 1e-5); if (!gl_FrontFacing) N = -N;
    float sh = cbtSunN(vSh, vNs);
    #ifdef SUNSHIFT
      sh = mix(sh, smoothstep(0.3, 0.7, sh), 1. - smoothstep(0.3, 0.7, abs(vN.y)/max(length(vN), 1e-4)));      // upright faces of the outworks are passed at nine metres: their cast shadows get a clean edge
    #endif
    vec2 hs = cbtHeadSun(vW); sh = mix(sh, hs.y, hs.x);
    float edge = max(vD.x, 0.), cav = 0., gouge = 0., patTop = 0., grainH = 0., arris = 0.;
    vec3 Ng = N;
    vec3 fpw = fwidth(vW); float pm = max(max(fpw.x, fpw.y), fpw.z);
    #ifdef HAND
      { // every steep face keeps the palm that patted it; round the mouth the gouges of the arm that scooped it
        // (a print is laid by the face's own directions: along it and up it. Up a face that leans further back than about fifty degrees the
        // upright coordinate would draw a print out to half as long again or more, so such a face keeps none)
        float steep = 1. - smoothstep(0.5, 0.72, abs(N.y)), fine = 1. - smoothstep(0.1, 0.3, pm), keep = 1. - smoothstep(0.5, 1.4, pm);      // (a print is 4.6 m across: it is on its way to its mean under nine pixels and is the mean under three and a half, so a far wall never beats into stripes)
        cbtPalmSoft = clamp(1.5*pm/2.3, 0.02, 0.45);
        vec3 w2 = N*N; float wx = w2.x/max(w2.x + w2.z, 1e-4);
        float hp = mix(cbtPalm(vec2(vW.x, vW.y*1.04), fine), cbtPalm(vec2(vW.z + 31., vW.y*1.04 + 2.), fine), smoothstep(0.3, 0.7, wx));
        // the lip of each print nearest the sun lays a crescent of shade inside it, so a face the sun meets squarely is still drawn
        vec2 sT = mix(uSunDir.xy, uSunDir.zy, smoothstep(0.3, 0.7, wx)); sT *= 0.7/max(length(sT), 1e-4);
        float hpS = hp;
        if (!cbtCut && steep*keep > 0.02) hpS = mix(cbtPalm(vec2(vW.x, vW.y*1.04) + sT, fine), cbtPalm(vec2(vW.z + 31., vW.y*1.04 + 2.) + sT, fine), smoothstep(0.3, 0.7, wx));
        #ifdef RIPPLE
          { // patted tops: the walls' tops and the crown of the ramp keep the palm too (plan coordinates)
            vec2 ov = cbtOval(vW.xz); float flatT = smoothstep(0.84, 0.94, abs(N.y));
            float rampT = (1. - smoothstep(4.0, 5.2, abs(vW.x)))*smoothstep(157., 163., ov.x)*(1. - smoothstep(208., 216., ov.x))*step(vW.z, 385.);
            patTop = flatT*max(rampT, smoothstep(3.4, 4.4, vW.y - cbtBase(vW.xz))*smoothstep(161., 165., ov.x))*(1. - smoothstep(0.7, 1.8, pm));
            if (patTop > 0.02) { vec2 s2 = uSunDir.xz*(0.8/max(length(uSunDir.xz), 1e-4));
              float ht = cbtPalm(vW.xz*vec2(1.15, 1.) + vec2(1.3, 17.), fine), htS = cbtPalm((vW.xz + s2)*vec2(1.15, 1.) + vec2(1.3, 17.), fine);
              hp = mix(hp, ht, patTop); hpS = mix(hpS, htS, patTop); }
            steep = max(steep, patTop); }
        #endif
        float cres = smoothstep(0.05, 0.17, hp - hpS)*(1. - smoothstep(0.5, 0.9, hp))*steep*keep*(1. - hs.x*(1. - hs.y));      // (inside the worked-out light of the head wall only where the bar of sun lies: there it draws the prints; never in its worked-out shade)
        cbtPrintSh = sh;
        sh *= 1. - 0.85*cres;
        vec3 md = vW - uMouthW.xyz, mT = vec3(uMouthN.z, 0., -uMouthN.x);
        float mx = dot(md, mT); mx = abs(mx) < 1e-4 ? 1e-4 : mx; float mr = length(vec2(mx, md.y)), mth = atan(md.y, mx);
        // six furrows an arm dragged toward the mouth: each starts between two shells, widest at the collar, and tapers
        // to nothing within two ring radii; ragged edges; the floor lies in the shade of its sunward lip (a cast shadow
        // like any other, never darker), the lip away from the sun catches the light
        float mz = uMouthW.w*smoothstep(9.9, 11.4, mr)*(1. - smoothstep(22., 26., mr))*smoothstep(-24., -15., dot(md, uMouthN))*(1. - smoothstep(4., 8., dot(md, uMouthN)));
        float gW = mix(1.7, 0.14, smoothstep(11., 25., mr)), gRag = 0.34*(cbtN3(vec3(mx, md.y, 5.)*0.8) - 0.5) + 0.13*(cbtN3(vec3(mx, md.y, 9.)*2.7) - 0.5);
        float gph = cos(mth*3. + 0.4 + 0.9*(cbtN3(vec3(mx, md.y, 2.)*0.12) - 0.5)), gLat = mr*abs(gph)/3. + gRag, gg = 1. - smoothstep(0.3*gW, gW, gLat);
        vec2 gS = vec2(dot(uSunDir, mT), uSunDir.y); gS *= 0.45/max(length(gS), 1e-4);                     // 0.45 m toward the sun, in the wall's plane
        float mxS = mx + gS.x; mxS = abs(mxS) < 1e-4 ? 1e-4 : mxS; float mrS = length(vec2(mxS, md.y + gS.y)), mthS = atan(md.y + gS.y, mxS);
        float ggS = gg; if (!cbtCut) ggS = 1. - smoothstep(0.3*gW, gW, mrS*abs(cos(mthS*3. + 0.4 + 0.9*(cbtN3(vec3(mxS, md.y + gS.y, 2.)*0.12) - 0.5)))/3. + gRag);
        float gFloor = max(smoothstep(0.55, 0.9, gg), smoothstep(0.06, 0.3, gg - ggS)), gLip = smoothstep(0.08, 0.35, ggS - gg)*(1. - smoothstep(0.75, 1., gg));
        hp = mix(hp, max(hp*(1. - gg), gg*0.42), mz); gouge = mz*keep*gLip; sh *= 1. - 0.96*mz*keep*gFloor;
        { float lvh = log2(max(pm, 0.008)/0.008), l0h = floor(lvh), c0h = 1./(0.021*exp2(l0h));
          float spk = mix(cbtH31(floor(vW*c0h) + l0h*13.), cbtH31(floor(vW*c0h*0.5) + (l0h + 1.)*13.), lvh - l0h);
          grainH = ((spk - 0.5)*0.3 - 0.18*step(0.9, spk) + 0.13*step(spk, 0.07))*(1. - smoothstep(0.1, 0.24, pm));
          grainH += 0.42*gouge;                                                                                  // the lip away from the sun catches the light
          cbtGrainFar = 36.; }
        cav = min(hp*steep*keep, 2.);
        cbtPrintD = N;
        N = cbtBump(vW, N, cav*mix(0.62, 1.1, mz));
        cbtPrintD = cbtPrintD - N;
        cav = min(cav + 0.7*cres, 2.);      // in shade the same crescent is the darker of two tones of slate
      }
    #endif
    N = N + uSunDir*(0.5*hs.x*hs.y); N /= max(length(N), 1e-4);      // inside the bar the collar is turned a little to the sun, like its shells
    float freshB = vD.z, ageB = vD.y, grainB = grainH;
    #ifdef BUCKET
      { // A BUCKET CAST, seen from nine metres. vL = the turret's own space (y up from its foot), vSunL the sun there.
        float keepB = (1. - vBk.x)*(1. - smoothstep(0.3, 0.7, pm));                       // not while it sits down, nor when it is a few pixels tall
        float ang = atan(vL.z, vL.x + 1e-5), rad = max(length(vL.xz), 0.5), hy = vL.y;
        float sideF = (1. - smoothstep(0.35, 0.6, abs(Ng.y)))*keepB;
        vec2 er = vec2(cos(ang), sin(ang)), sl2 = vSunL.xz/max(length(vSunL.xz), 1e-4);
        float tS = dot(sl2, vec2(-er.y, er.x)), rS = max(dot(sl2, er), 0.07), sg = tS < 0. ? -1. : 1.;
        // the sand it is made of: a speckle of pale and dark about three pixels across at whatever distance we pass
        float lv = log2(max(pm, 0.008)/0.008), l0 = floor(lv), c0 = 1./(0.021*exp2(l0));
        float spk = mix(cbtH31(floor(vL*c0) + l0*13.), cbtH31(floor(vL*c0*0.5) + (l0 + 1.)*13.), lv - l0);
        grainB = ((spk - 0.5)*0.34 - 0.2*step(0.9, spk) + 0.15*step(spk, 0.07))*keepB*(1. - smoothstep(0.1, 0.24, pm));
        // two mould seams, a bead a hand proud from foot to rim: the low sun lays a slate line beside each
        float sS = rad*er.y*(er.x > 0. ? 1. : -1.), seamOn = sideF*(1. - smoothstep(12.2, 12.7, hy));
        float bead = exp(-sS*sS/0.07);
        float ls = max(min(0.34*abs(tS)/rS, 1.6), 2.2*pm), sd = -sS*sg;
        float seamSh = smoothstep(0.1, 0.24, sd)*(1. - smoothstep(0.2 + ls, 0.38 + ls, sd))*seamOn;
        // the rim ring, the step the bucket's base left under the top, lying in its own shade
        float rw = max(0.13, 1.4*pm), ring = (1. - smoothstep(rw*0.6, rw, abs(hy - 11.35)))*sideF;
        // each notch of the rim throws a short tooth down the face
        float an = (fract(ang/0.7853982 + 0.5) - 0.5)*0.7853982*rad, sn = -an*sg;
        float ln = clamp(0.95*abs(tS)/rS, 0.5, 1.7)*clamp((hy - 12.2)/1.3, 0., 1.);
        float tooth = smoothstep(0.3, 0.45, sn)*(1. - smoothstep(0.3 + ln, 0.45 + ln, sn))*step(12.2, hy)*sideF;
        sh *= 1. - 0.92*max(max(seamSh, ring*0.85), tooth);
        N = cbtBump(vW, N, (-0.26*bead*seamOn + 0.15*ring + (cbtN3(vL*1.1 + 3.) - 0.5)*0.14)*keepB);
        // the lowest two metres have drawn water up: darker, glossy, along a ragged line
        vec2 toC = vec2(0., 385.) - vW.xz; toC /= max(length(toC), 1e-3);
        float wd = mix(vBk.y, vBk.z, smoothstep(-0.25, 0.25, dot(Ng.xz, toC))) + 0.9 + 1.0*(cbtN3(vec3(vL.xz*0.33, 2.)) - 0.5) + 0.4*(cbtN3(vec3(vL.xz*1.5, 7.)) - 0.5) - hy;
        float wick = smoothstep(-1., 1., wd/max(fwidth(wd)*0.9, 0.02))*sideF;
        freshB = max(freshB, 0.45*wick); ageB = max(ageB, wick);
        cbtGrainFar = 36.;
        // edges draw themselves in biscuit: the rim, its notches and the two seam beads have dried to a ragged pale line
        { float fe = fwidth(vD.x), eth = clamp(0.8 - 2.*fe, 0.3, 0.8) + (cbtN3(vL*1.7 + 5.) - 0.5)*0.2;
          arris = smoothstep(-1., 1., (vD.x - eth)/max(fe*0.9, 0.01))*keepB*(1. - wick)*(1. - smoothstep(0.1, 0.5, vD.y)); }
      }
    #endif
    #ifdef DRIB
      float ridge = cbtDrib(vW, Ng), capS = 0.;
      { // dribbled slurry: runnels down every flank, lumps between them; fades under three pixels
        float flank = 1. - smoothstep(0.45, 0.9, Ng.y), keep = 1. - smoothstep(0.12, 0.4, pm);
        float lump = cbtN3(vW*0.8 + 7.);
        cav = (1. - ridge)*flank*keep*smoothstep(0.25, 0.7, cbtN3(vW*0.23 + 5.));      // dribbles come in patches
        N = cbtBump(vW, N, (cav*0.17 + (lump - 0.5)*0.5*keep));
        cav *= 0.7;
      }
    #endif
    #ifdef RIPPLE
      { // wind and swash ripples on every flat: real little ridges for the one light, crests drying first.
        // Finer than about three pixels they are replaced by their average (nothing shimmers).
        float flat_ = smoothstep(0.90, 0.985, N.y)*uRipple*(1. - patTop);
        vec2 rp = vW.xz + 2.4*vec2(cbtN3(vec3(vW.xz*0.06, 2.)), cbtN3(vec3(vW.xz*0.06, 7.))) + 0.5*cbtN3(vec3(vW.xz*0.31, 4.));
        float ph = rp.x*1.02 + rp.y*0.29 + 1.6*cbtN3(vec3(vW.xz*0.045, 9.));
        float fw = fwidth(ph), keep = flat_*(1. - smoothstep(0.1, 0.26, fw));      // (a ripple under about six pixels is on its way to its mean; under four it is the mean)
        float sn = sin(ph*6.2832), cs = cos(ph*6.2832);
        float steep = 0.5 + 0.5*sn;                                                       // asymmetric: a long back and a short lee
        // and the long bars the backwash leaves, nine metres apart, which carry the pattern into the middle distance
        float ph2 = vW.x*0.105 + vW.z*0.024 + 2.2*cbtN3(vec3(vW.xz*0.017, 5.));
        float fw2 = fwidth(ph2), keep2 = flat_*(1. - smoothstep(0.12, 0.3, fw2));
        float sn2 = sin(ph2*6.2832), cs2 = cos(ph2*6.2832);
        N = N + vec3(0.74, 0., 0.21)*(-cs*(0.15 + 0.13*steep)*keep - cs2*0.12*keep2); N /= max(length(N), 1e-4);
        edge = max(edge, max(keep*smoothstep(0.1, 0.9, sn)*0.6, keep2*smoothstep(0.2, 0.9, sn2)*0.5)) - keep*smoothstep(0.2, 0.95, -sn)*0.22 - keep2*smoothstep(0.3, 0.95, -sn2)*0.3;
        cbtRippled = keep;
      }
    #endif
    #ifdef TINT
      if (vD.x > 1.5) { N = N + uSunDir*1.25; N /= max(length(N), 1e-4); }   // the cockles of the ring are turned to the shaft of sun
      float gl = clamp(vTint.a - 1., 0., 1.);                          // aTint.a above 1 = glassy: smooth, glossy, no grains
      cbtDeep = 0.;
      vec3 col = cbtShade(vTint.rgb/(1. - 0.58*gl), min(vTint.a, 1.), gl, vW, N, sh);   // any other pigment of the world, same light
      #ifdef HOLE
        if (cbtCut) discard;      // (the mouth, cut here: no derivative is taken below)
      #endif
    #else
      #ifdef DRIB
        // every blob shows both states: its top third has dried to a pale cap with a ragged edge that runs further
        // down the ridges between the runnels; the overhung flank stays dark (vD.x = baked cap weight)
        { float cph = fract(uTime*0.085 + cbtN3(vW*0.13 + 21.)*2.3);                      // the cap's edge creeps down as it dries, then lets go
          capS = 0.3*(smoothstep(0., 0.82, cph)*(1. - smoothstep(0.88, 1., cph)) - 0.5); }
        capS += vD.x + (cbtN3(vW*0.9 + 3.) - 0.5)*0.5 + (cbtN3(vW*3.1) - 0.5)*0.16 + (ridge - 0.5)*0.3*(1. - smoothstep(0.12, 0.4, pm));
        float lie = Ng.y > -0.12 ? max(Ng.y, 0.42 + 0.75*capS) : Ng.y;
        float w = cbtWetnessY(vW, lie, 0.75, vD.y);
        { // where a crust is letting go, its grains run down the runnels of the dark flank below: pale dashes, a hand wide
          float gph = fract(uTime*0.085 + cbtN3(vW*0.13 + 21.)*2.3 + 0.1), go = (1. - smoothstep(0.5, 0.62, gph))*smoothstep(0., 0.04, gph);
          float dash = smoothstep(0.52, 0.66, cbtN3(vec3(vW.x*2.6, vW.y*0.8 + uTime*2.6, vW.z*2.6)))*smoothstep(0.4, 0.7, 1. - ridge);
          w *= 1. - go*dash*(1. - smoothstep(0.45, 0.9, Ng.y))*step(-0.35, Ng.y)*(1. - smoothstep(0.12, 0.4, pm))*(1. - vD.z); }
        vec3 col = cbtShadeC(mix(uDryC, uWetC, w), w, vD.z, vW, N, sh, cav);
        #ifdef HOLE
          if (cbtCut) discard;      // (the mouth, cut here: no derivative is taken below)
        #endif
        #ifdef DRIP
          // a gobbet in the air: wet and dark, with the low sun bright along its sunward edge
          col = mix(col, mix(uDryC, vec3(1.), 0.3), 0.85*vAir*smoothstep(0.35, 0.75, dot(N, uSunDir)));
        #endif
      #else
        float w = cbtWetness(vW, abs(Ng.y) > 0.86 ? N : Ng, edge, ageB);
        #ifdef RIPPLE
          { // a wall's crest and the edge of the causeway's crown are pale ragged lines; flats the tide has wetted mirror the sky
            float fe = fwidth(vD.x), eth = clamp(0.62 - 2.*fe, 0.3, 0.62) + (cbtN3(vW*1.3 + 5.) - 0.5)*0.3;
            arris = smoothstep(-1., 1., (vD.x - eth)/max(fe*0.9, 0.01))*smoothstep(0.45, 0.8, vW.y - cbtBase(vW.xz))*(1. - smoothstep(0.1, 0.5, ageB))*(1. - cbtTide);
            float ovx = cbtOval(vW.xz).x, dry_ = smoothstep(-0.6, 0.6, -vW.x + cbtLobes(vW.xz) - uSea.x);      // (not under the sheet itself: there the water is the mirror)
            cbtSheen = cbtTide*smoothstep(0.93, 0.99, Ng.y)*dry_*step(161., ovx)*(1. - cbtRamp(vW.xz, ovx)); }
        #endif
        w *= 1. - arris; cbtGrainK = grainB;
        #if defined( HAND ) || defined( BUCKET )
          // the foot of this face where a front has reached it (walls, banks, turrets, the mound): the damp that has wicked
          // up it makes the sand there wet sand, before any light falls on it (the darker ochre in the sun, the wet slate in shade)
          float footY = cbtBase(vW.xz) + 0.1;
          #ifdef BUCKET
            { // (a bucket cast knows where the ground meets it: the film lies on that ground, and no higher over the
              // beach than the water's own sheet is laid: the sheet's rule, ground + 0.06 held under the beach + 0.45)
              vec2 toF = vec2(0., 385.) - vW.xz; toF /= max(length(toF), 1e-3);
              footY = min(vW.y - (vL.y - mix(vBk.y, vBk.z, smoothstep(-0.25, 0.25, dot(Ng.xz, toF)))) + 0.06, cbtBase(vW.xz) + 0.45); }
          #endif
          float cl = cbtCollar(vW, Ng.y, fpw.y, footY);
          w = max(w, cbtWick);
        #endif
        vec3 col = cbtShadeC(mix(uDryC, uWetC, w)*(1. + grainB)*(1. - 0.8*clamp(-vD.x, 0., 1.)), w, freshB, vW, N, sh, cav);
        #ifdef HOLE
          if (cbtCut) discard;      // (the mouth, cut here: no derivative is taken below)
        #endif
        #if defined( HAND ) || defined( BUCKET )
          // and the white collar the front leaves there (in cast shadow it is the foam's own shaded white)
          if (cl > 0.001) { vec3 fc = mix(mix(uShadeC*2.1, uFoamW, 0.35), uFoamW, sh); col = mix(col, mix(fc, uSkyLo, cbtBleach(length(cameraPosition - vW))), cl); }
        #endif
      #endif
    #endif
    gl_FragColor = vec4(col, 1.);
  }
`;

// sandMaterial(): the one sand. Geometry needs position, normal and aD (vec2: arris 0..1, freshness 0..1).
//   { tint: true }  -> pigment and wetness come from a vec4 attribute aTint (linear rgb, wet) instead of the sand rule:
//                      shells, wrack, birds, hoppers, foam; same sun, same slate shadow, same bleach
//   { drip: true }  -> instanced falling-and-landing blobs (needs aBall, per-instance aLand); see dripDepthMaterial
//   { hole: Vector4 } -> discards a round mouth (local x, y, z, radius)
export function sandMaterial(o = {}) {
  const defines = {};
  if (o.tint) defines.TINT = 1;
  if (o.drip) defines.DRIP = 1;
  if (o.slump) defines.SLUMP = 1;      // needs aFan, aFanN (the form after it has sat down) and aSlump (journey second, seed), per vertex or per instance
  if (o.ripple) defines.RIPPLE = 1;    // sand ripples on every flat part of the surface
  if (o.hand) defines.HAND = 1;        // palm dents with finger grooves on every steep face, gouges round the mouth
  if (o.drib) defines.DRIB = 1;        // dribbled blobs: runnels, lumps, a pale cap from the baked weight aD.x
  if (o.bucket) defines.BUCKET = 1;    // a bucket cast seen close: grain speckle, mould seams, rim ring, notch teeth, a wick line (per-instance float aFoot)
  if (o.sunShift) defines.SUNSHIFT = 1;   // outworks only: the shadow lookup of upright faces is taken 1.5 m toward the sun
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.lights), ...(o.uniforms ?? STYLE.uniforms) };
  if (o.hole) { defines.HOLE = 1; uniforms.uHole = { value: o.hole }; }
  return new THREE.ShaderMaterial({ uniforms, defines, vertexShader: SAND_VERT, fragmentShader: SAND_FRAG, lights: true,
    side: o.side ?? THREE.FrontSide });
}
// depth program for the shadow pass of anything made with { slump: true } (set as mesh.customDepthMaterial)
export function slumpDepthMaterial(SU = STYLE.uniforms) {
  return new THREE.ShaderMaterial({ uniforms: { uTs: SU.uTs },
    vertexShader: /* glsl */`
      uniform float uTs; attribute vec3 aFan; attribute vec2 aSlump;
      ${SLUMP_GLSL}
      void main(){
        float k, st, h;
        vec4 lp = vec4(cbtSlump(position, aFan, aSlump, uTs, k, st, h), 1.);
        #ifdef USE_INSTANCING
          lp = instanceMatrix*lp;
        #endif
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*lp; }`,
    fragmentShader: /* glsl */`
      #include <packing>
      void main(){ gl_FragColor = packDepthToRGBA(gl_FragCoord.z); }` });
}
// depth program for the shadow pass of drip instances (set as mesh.customDepthMaterial)
export function dripDepthMaterial(SU = STYLE.uniforms) {
  return new THREE.ShaderMaterial({ uniforms: { uT: SU.uT },
    vertexShader: /* glsl */`
      uniform float uT; attribute vec3 aBall; attribute vec2 aLand;
      ${DRIP_GLSL}
      void main(){ vec3 n; float a, b, lift;
        vec3 p = cbtDrip(position, aBall, normal, aLand, uT, n, a, b, lift);
        vec4 wp = modelMatrix*instanceMatrix*vec4(p, 1.); wp.y += lift;
        gl_Position = projectionMatrix*viewMatrix*wp; }`,
    fragmentShader: /* glsl */`
      #include <packing>
      void main(){ gl_FragColor = packDepthToRGBA(gl_FragCoord.z); }` });
}

// ---------------------------------------------------------------------------------------------------------
// LAYOUT (local space: the horseshoe opens toward +Z, the head wall and the tunnel mouth are at -Z; port arm is -X)
const NAVE = 20, HEAD_Z = -63, CORNER = 6, ARM_END = 117, CREST = 30, CREST_D = 21;
const MOUTH = new THREE.Vector3(0, 8, HEAD_Z);
const MOUTH_SHEAR = 0.15;      // the collar leans 8.5 degrees toward the sun, so the bar of light through the notch reaches every shell

// the nave outline (a U with rounded corners), sampled port end -> round the head -> starboard end
function makeOutline(step) {
  const pts = [], zc = HEAD_Z + CORNER, xc = NAVE - CORNER;
  const push = (x, z, nx, nz) => pts.push({ x, z, nx, nz, a: 0 });
  const nA = Math.round((ARM_END + 14 - zc) / step), nC = Math.round((Math.PI / 2 * (CORNER + 22)) / (step * 1.15)), nH = Math.round(2 * xc / step);
  for (let i = 0; i < nA; i++) push(-NAVE, lerp(ARM_END + 14, zc, i / nA), -1, 0);
  for (let i = 0; i < nC; i++) { const t = (i / nC) * Math.PI / 2; push(-xc - Math.cos(t) * CORNER, zc - Math.sin(t) * CORNER, -Math.cos(t), -Math.sin(t)); }
  for (let i = 0; i < nH; i++) push(lerp(-xc, xc, i / nH), HEAD_Z, 0, -1);
  for (let i = 0; i < nC; i++) { const t = (i / nC) * Math.PI / 2; push(xc + Math.sin(t) * CORNER, zc - Math.cos(t) * CORNER, Math.sin(t), -Math.cos(t)); }
  for (let i = 0; i <= nA; i++) push(NAVE, lerp(zc, ARM_END + 14, i / nA), 1, 0);
  for (let i = 1; i < pts.length; i++) pts[i].a = pts[i - 1].a + hyp(pts[i].x - pts[i - 1].x + (pts[i].nx - pts[i - 1].nx) * CREST_D, pts[i].z - pts[i - 1].z + (pts[i].nz - pts[i - 1].nz) * CREST_D);
  return pts;
}

// overlapping palm dents, 7 m long, each with four shallow finger grooves (a = along the wall, v = up it; metres)
function palmDent(a, v, seed) {
  let d = 0;
  for (let k = 0; k < 2; k++) {
    const ca = 5.2, cv = 6.4, A = a + k * 2.6 + seed, V = v + k * 3.2;
    const ia = Math.floor(A / ca), iv = Math.floor(V / cv);
    const h = Math.sin(ia * 127.1 + iv * 311.7 + k * 74.7 + seed) * 43758.5453, r = h - Math.floor(h);
    const r2 = (r * 7.13) % 1, r3 = (r * 13.7) % 1;
    const la = (A - (ia + 0.5) * ca) + (r - 0.5) * 1.6, lv = (V - (iv + 0.5) * cv) + (r2 - 0.5) * 1.6;
    const tilt = (r3 - 0.5) * 0.7, ua = la * Math.cos(tilt) + lv * Math.sin(tilt), uv = -la * Math.sin(tilt) + lv * Math.cos(tilt);
    const e = (ua / 2.3) ** 2 + (uv / 3.5) ** 2;
    if (e < 1) { const bowl = (1 - e) * (1 - e); d = Math.max(d, bowl * (0.55 + 0.25 * r) * (1 + 0.22 * Math.cos(ua * 5.46))); }
  }
  return d;
}

// The mound: nave floor, foot cone, patted inner wall, crest, patted outer flank and its dry apron, as one grid
// (columns along the outline, rows across it). feet = [{x, z, r}] spire feet, which raise dry hummocks on the crest.
async function buildMound(ctx, L) {
  const { noise } = ctx, out = L.outline, nc = out.length;
  const rows = [];
  for (const t of [0, 0.25, 0.42]) rows.push({ k: 'floor', t });
  rows.push({ k: 'abs', d: -9.5, y: 0 }, { k: 'abs', d: -7.2, y: 0 }, { k: 'abs', d: -5.6, y: 0 }, { k: 'abs', d: -4.2, y: 0 }, { k: 'abs', d: -2.6, y: 0.85 }, { k: 'abs', d: -1.0, y: 1.7 });
  for (let i = 0; i <= 13; i++) rows.push({ k: 'wall', q: i / 13 });
  rows.push({ k: 'top', d: 6.5, dy: -0.5 }, { k: 'top', d: 7.8, dy: 0 });
  for (const d of [9.6, 12, 14.5, 17, 19.5, 22, 24.5, 27, 29.5, 32, 34]) rows.push({ k: 'top', d, dy: 0 });
  rows.push({ k: 'top', d: 35.4, dy: -0.6 });
  for (let i = 0; i <= 17; i++) rows.push({ k: 'flank', q: i / 17 });
  rows.push({ k: 'abs', d: 52.2, y: 3.4 }, { k: 'abs', d: 54, y: 2.4 }, { k: 'abs', d: 56.2, y: 1.2 }, { k: 'abs', d: 58.5, y: 0.25 }, { k: 'abs', d: 61, y: 0 }, { k: 'abs', d: 63.5, y: 0 }, { k: 'abs', d: 66.5, y: 0 }, { k: 'abs', d: 71, y: -0.3 });
  const nr = rows.length, pos = new Float32Array(nc * nr * 3), aD = new Float32Array(nc * nr * 2);
  const sx = L.sunH.x, sz = L.sunH.y;
  const crestLine = [];
  // talus: real cones of dry sand leaning against the foot of both faces (apex on the face, 30 degree sides)
  const total = out[nc - 1].a, conesOut = [], conesIn = [];
  for (let a = L.rng.range(0, 10); a < total; a += L.rng.range(9, 24)) conesOut.push({ a, h: L.rng.range(3, 7) + (L.rng.chance(0.3) ? L.rng.range(3, 7) : 0) });
  for (let a = L.rng.range(0, 10); a < total; a += L.rng.range(8, 20)) conesIn.push({ a, h: L.rng.range(1.6, 4.2) + (L.rng.chance(0.2) ? 3 : 0) });
  const talus = (list, a, d, dAt, C) => { let y = -9; for (const k of list) { if (Math.abs(k.a - a) > 26) continue; const h = Math.min(k.h, C * 0.45); y = Math.max(y, h - 0.56 * hyp(k.a - a, d - dAt(h, C))); } return y; };
  const dIn = (h, C) => -0.4 + 6.2 * clamp((h - 1.7) / Math.max(C - 2.4, 1), 0, 1), dOut = (h, C) => 36.4 + 14.6 * (1 - clamp((h - 4.2) / Math.max(C - 5.8, 1), 0, 1));
  await ctx.yield();
  for (let c = 0; c < nc; c++) {
    const o = out[c];
    let Ccol = 0;
    let cTop = [0, -1e9, 0];
    for (let r = 0; r < nr; r++) {
      const R = rows[r]; let d, y, wetBias = 0;
      // crest height for this column at offset dd from the nave outline
      const crestAt = (dd) => {
        const px = o.x + o.nx * dd, pz = o.z + o.nz * dd;
        const sd = px < 0 ? Math.exp(-(((pz - L.saddle.z) / (L.saddle.w * SADDLE_NARROW)) ** 2)) : 0;      // the saddle: the heel of a hand pressed the port crest down here
        return { E: 1, C: CREST + (3.4 * noise.fbm2(px * 0.02 + 7, pz * 0.02, 3) + 1.6 * noise.n2(o.a * 0.055, 2.5)) * (1 - sd) - L.saddle.depth * sd, px, pz, sd };
      };
      if (r === 0) Ccol = crestAt(20).C;
      if (R.k === 'floor') {
        const ax = 0, az = Math.max(o.z, HEAD_Z + NAVE);            // medial axis of the nave
        const x = lerp(ax, o.x, R.t), z = lerp(az, o.z, R.t);
        const fur = Math.cos((Math.abs(x) / NAVE) * Math.PI * 4.0);   // four finger furrows each side, running into the mouth
        y = 0.0 + 0.2 * fur * smoothstep(0.02, 0.3, R.t) + 0.1 * noise.n2(x * 0.08, z * 0.08);      // always under the swash (0.4): no islands
        if (Math.abs(x) < 9 && z < HEAD_Z + 8) y = Math.min(y, 0.2);
        pos.set([x, y, z], (c * nr + r) * 3); aD.set([0, 0.62], (c * nr + r) * 2); continue;
      }
      if (R.k === 'abs') {
        d = R.d; const cr = crestAt(d < 0 ? 4 : 44); y = R.y * Math.min(1, cr.E * 5) * (0.75 + 0.5 * noise.n2(cr.px * 0.11, cr.pz * 0.11 + 5));
        if (d < 0 && Math.abs(o.x) < 13 && o.nz < -0.5) y *= smoothstep(8, 12.5, Math.abs(o.x));   // no cone across the mouth
        if (d > 60) y = R.y;
      } else if (R.k === 'wall') {
        const cr = crestAt(4), q = R.q, v = q * cr.C;
        d = -0.4 + 6.2 * q + 0.35 * Math.sin(q * 3.1) + 1.1 * noise.n2(o.a * 0.05, 4.5 + q * 0.5) * Math.sin(q * 2.8 + 0.2) + 0.7 * palmDent(o.a, v * 1.02, 3.3) * smoothstep(0, 0.08, q) * (1 - smoothstep(0.9, 1, q));
        y = 1.7 * Math.min(1, cr.E * 5) + (cr.C - 2.4) * q; y = Math.max(y, 0);
        if (Math.abs(o.x) < 12 && o.nz < -0.5) d += 0;
      } else if (R.k === 'top') {
        d = R.d; const cr = crestAt(d); y = cr.C + R.dy * Math.min(1, cr.E * 3) + 0.9 * noise.fbm2(cr.px * 0.09, cr.pz * 0.09 + 31, 2) * cr.E;
        let hum = 0;
        for (const f of L.feet) { const dist = hyp(cr.px - f.x, cr.pz - f.z); hum = Math.max(hum, Math.min(f.r * 0.5, (f.r + 5.5 - dist) * 0.52)); }
        y += Math.max(hum, 0) * cr.E * (1 - 0.85 * cr.sd);
      } else {
        const cr = crestAt(40), q = R.q, v = (1 - q) * cr.C;
        d = 36.4 + 14.6 * q - 0.5 * Math.sin(q * 3.1) + 2.6 * noise.n2(o.a * 0.04, 9.5 + q * 0.4) * Math.sin(q * 2.6 + 0.3) - 0.85 * palmDent(o.a * 1.35 + 40, v * 1.05, 8.1) * smoothstep(0, 0.1, q) * (1 - smoothstep(0.88, 1, q));
        // patted up in courses: two or three ledges run along the flank, flat enough to dry pale
        const ph = 1.2 + 2.6 * noise.n2(o.a * 0.028, 17.5), amp = 0.82 * smoothstep(-0.35, 0.3, noise.n2(o.a * 0.045, 61.5 + q * 1.3)), st = q - amp * Math.sin(15.08 * q + ph) / 15.08;
        y = lerp(cr.C - 1.6, 4.2 * Math.min(1, cr.E * 5), clamp(st, 0, 1)); y = Math.max(y, 0);
      }
      const mouthZone = Math.abs(o.x) < 15 && o.nz < -0.5;
      if (d < 3 && !mouthZone && o.nz === 0 && o.z > HEAD_Z + CORNER + 9) { const t = talus(conesIn, o.a, d, dIn, Ccol); if (t > y) { y = t; wetBias = -0.2; } }
      if (d > 40) { const t = talus(conesOut, o.a, d, dOut, Ccol); if (t > y) { y = t; wetBias = -0.2; } }
      if (d < -5 || d > 62) wetBias = 0.35;
      // the open end of each arm is a rounded nose: the whole section shrinks to nothing
      const kn = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(o.z - 103, 0) / 27.5, 2)));
      if (kn < 1) { d = CREST_D + (d - CREST_D) * (0.04 + 0.96 * kn); y *= Math.pow(kn, 0.75); }
      let x = o.x + o.nx * d, z = o.z + o.nz * d;
      // an inward offset deeper than the corner radius would fold over itself: keep it inside the offset outline
      if (d < 0) { const lim = Math.max(NAVE + d, 0.5); x = clamp(x, -lim, lim); z = Math.max(z, HEAD_Z - d); }
      if (d < 8 && z < HEAD_Z + 16 && Math.abs(x) > 9) {              // the corner cones: smooth, dry, 31 degrees
        const cx = (NAVE - 1.2) * Math.sign(x), cz = HEAD_Z + 1.2, t = 2.9 - 0.47 * hyp(x - cx, z - cz) + 0.12 * noise.n2(x * 0.3, z * 0.3);
        if (t > y) { y = t; wetBias = -0.25; }
      }
      // the notch: a scooped pass through the starboard arm, on the line from the mouth toward the sun
      const al = x * sx + (z - HEAD_Z - 1.5) * sz, la = Math.abs((z - HEAD_Z - 1.5) * sx - x * sz);
      // (a slot the edge of a hand chopped: floor low enough for the dawn sun, sides at 70 degrees)
      if (x > 14 && al > 14) { const yN = 1.3 + 0.085 * Math.max(al - 20, 0) + Math.max(la - 2.6, 0) * 2.7 + 0.5 * (la / 2.6) ** 2 * Math.min(1, la / 2.6); if (yN < y) { y = lerp(y, yN, smoothstep(14, 19, al)); wetBias = 0.3; } }
      pos.set([x, y, z], (c * nr + r) * 3); aD.set([0, wetBias], (c * nr + r) * 2);
      if (R.k === 'top' && y > cTop[1]) cTop = [x, y, z];
    }
    if (c % 10 === 4) crestLine.push(cTop);      // the highest point of the crest, every 17 m along it
    await ctx.yield();
  }
  await ctx.yield();
  const gi = gridIndex(nc, nr, false);
  await ctx.yield();
  // (normals and arrises in short steps: the mound is the biggest grid of the world)
  const nrm = new Float32Array(pos.length);
  for (let k = 0; k < gi.length; k += 12000) { accumNormals(nrm, pos, gi, k, Math.min(gi.length, k + 12000)); await ctx.yield(); }
  unitNormals(nrm);
  await ctx.yield();
  const geo = gridGeometry(pos, aD, nc, nr, false, 2.2, true, gi, nrm);
  for (let c = 0; c < nc; c += 32) { gridArris(geo, nc, nr, false, 2.2, c, Math.min(nc, c + 32)); await ctx.yield(); }
  geo.userData.crestLine = crestLine;
  return geo;
}

// mergeGeometries in short steps, for indexed parts that share their attributes: one pause after each part
async function mergeSteps(geos, pause) {
  const names = Object.keys(geos[0].attributes), out = new THREE.BufferGeometry(), arrs = {};
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  for (const n of names) arrs[n] = new Float32Array(nv * geos[0].attributes[n].itemSize);
  const idx = new Uint32Array(ni); let vo = 0, io = 0;
  for (const g of geos) {
    for (const n of names) arrs[n].set(g.attributes[n].array, vo * g.attributes[n].itemSize);
    const gi = g.index.array; for (let k = 0; k < gi.length; k++) idx[io + k] = gi[k] + vo;
    vo += g.attributes.position.count; io += gi.length;
    await pause();
  }
  for (const n of names) out.setAttribute(n, new THREE.BufferAttribute(arrs[n], geos[0].attributes[n].itemSize));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}

// Grid of nc columns x nr rows (vertex = c*nr + r) -> indexed geometry with smooth normals and the arris attribute
// aD.x, measured from the real convexity of the surface (ridges and shoulders dry first). wrap joins the last column
// to the first. aD.y (freshness) is taken as given.
function gridIndex(nc, nr, wrap) {
  const cols = wrap ? nc : nc - 1, idx = new Uint32Array(cols * (nr - 1) * 6);
  let k = 0;
  for (let c = 0; c < cols; c++) {
    const c1 = (c + 1) % nc;
    for (let r = 0; r < nr - 1; r++) {
      const a = c * nr + r, b = c1 * nr + r, d = c * nr + r + 1, e = c1 * nr + r + 1;
      idx[k++] = a; idx[k++] = b; idx[k++] = d; idx[k++] = b; idx[k++] = e; idx[k++] = d;
    }
  }
  return idx;
}
function gridGeometry(pos, aD, nc, nr, wrap, edgeGain, later = false, idx = gridIndex(nc, nr, wrap), nrm = smoothNormals(pos, idx)) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  g.setAttribute('aD', new THREE.BufferAttribute(aD, 2));
  if (!later) gridArris(g, nc, nr, wrap, edgeGain);
  return g;
}
// area-weighted vertex normals on plain typed arrays (several times quicker than computeVertexNormals)
function smoothNormals(pos, idx) { const n = new Float32Array(pos.length); accumNormals(n, pos, idx, 0, idx.length); return unitNormals(n); }
function accumNormals(n, pos, idx, k0, k1) {
  for (let k = k0; k < k1; k += 3) {
    const a = idx[k] * 3, b = idx[k + 1] * 3, c = idx[k + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const x = uy * vz - uz * vy, y = uz * vx - ux * vz, z = ux * vy - uy * vx;
    n[a] += x; n[a + 1] += y; n[a + 2] += z; n[b] += x; n[b + 1] += y; n[b + 2] += z; n[c] += x; n[c + 1] += y; n[c + 2] += z;
  }
}
function unitNormals(n) {
  for (let i = 0; i < n.length; i += 3) { const l = Math.max(hyp(n[i], n[i + 1], n[i + 2]), 1e-9); n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
  return n;
}
function gridArris(g, nc, nr, wrap, edgeGain, c0 = 0, c1 = nc) {
  const nrm = g.attributes.normal.array, pos = g.attributes.position.array, aD = g.attributes.aD.array;
  for (let c = c0; c < c1; c++) for (let r = 0; r < nr; r++) {
    const i = c * nr + r, cm = wrap ? (c + nc - 1) % nc : Math.max(c - 1, 0), cp = wrap ? (c + 1) % nc : Math.min(c + 1, nc - 1);
    let lx = 0, ly = 0, lz = 0, len = 0;
    for (let q = 0; q < 4; q++) { const j = q === 0 ? cm * nr + r : q === 1 ? cp * nr + r : q === 2 ? c * nr + Math.max(r - 1, 0) : c * nr + Math.min(r + 1, nr - 1); const dx = pos[j * 3] - pos[i * 3], dy = pos[j * 3 + 1] - pos[i * 3 + 1], dz = pos[j * 3 + 2] - pos[i * 3 + 2]; lx += dx; ly += dy; lz += dz; len += hyp(dx, dy, dz); }
    const conv = -(lx * nrm[i * 3] + ly * nrm[i * 3 + 1] + lz * nrm[i * 3 + 2]) / Math.max(len, 1e-3);
    aD[i * 2] = clamp(conv * edgeGain, 0, 1);
  }
}

// One drip spire: a stack of squashed, lopsided blobs of dribbled slurry, fat and sagging at the foot, beads at the
// tip. Every blob is five rings: a neck tucked under, an overhung lip with dribbled tongues that sag over the blob
// below, the bulge, a shoulder, and a nearly flat top that the next neck sits on. o: { H, R0, tipR, pow, lean, kink,
// segs, maxBlobs, ox, oy, oz, fresh }. Returns { geo, blobs:[{x,y,z,r,h}], top:{x,y,z,r} }.
let spirePause = null;                // set by buildHero: hands the page back between the two halves of a spire
async function buildSpire(rng, o) {
  const segs = o.segs ?? 9, blobs = [];
  let y = 0, cx = 0, cz = 0;
  const leanA = rng.range(0, Math.PI * 2), lean = o.lean ?? rng.range(0, 0.05), wob = rng.range(0.25, 0.6);
  const p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28), bumpF = rng.range(2, 5), bumpA = rng.range(0.12, 0.42);
  const kinkAt = o.kink ? rng.range(0.4, 0.6) : 2;
  const est = o.H / (o.maxBlobs ?? 58);
  while (y < o.H && blobs.length < 90) {
    const f = y / o.H;
    let env = o.tipR + (o.R0 - o.tipR) * Math.pow(1 - f, o.pow) * (1 + bumpA * Math.sin(f * bumpF * 6.28 + p1) * (1 - f));
    env = Math.max(env, o.tipR) + o.R0 * 0.3 * Math.exp(-f * 16);                 // the foot spreads
    const r = env * rng.range(0.74, 1.26);
    let h = Math.max(r * rng.range(0.5, 0.72), est * rng.range(0.75, 1.1));    // slender tips become taller beads
    h = Math.min(h, r * 1.5 + 0.2);
    cx += Math.cos(leanA) * lean * h + rng.range(-1, 1) * r * 0.16 * wob; cz += Math.sin(leanA) * lean * h + rng.range(-1, 1) * r * 0.16 * wob;
    if (f > kinkAt && blobs.length && !blobs.kinked) { blobs.kinked = true; const ka = rng.range(0, 6.28); cx += Math.cos(ka) * r * 0.85; cz += Math.sin(ka) * r * 0.85; }
    const t1 = rng.range(0, 6.28), t2 = rng.range(0, 6.28);
    blobs.push({ x: cx, y, z: cz, r, h, a1: rng.range(0, 6.28), a2: rng.range(0, 6.28), lop: rng.range(0.08, 0.2) + 0.12 * (1 - f) * (1 - f),
      t1, t2, t3: (t1 + t2) * 0.5 + Math.PI + 0.7 * Math.sin(t1 * 7), tw: rng.range(0.35, 0.8), td: rng.range(0.6, 1.5), td2: rng.range(0.3, 1.1) });
    y += h * rng.range(0.82, 0.98);
  }
  // fat blobs near the foot get more segments and a rounder section than the beads above them
  let split = blobs.findIndex((B, b) => b >= 2 && B.r < (o.fatR ?? 2.0)); if (split < 0) split = blobs.length;
  const RV5 = [[0.5, 0.0, 0.5, 1], [0.92, 0.08, 1, 0], [1.0, 0.32, 0.45, 0.1], [0.88, 0.58, 0.08, 0.72], [0.56, 0.8, 0, 1]];   // radius, height, pull of the tongues, cap weight (1 = dries pale)
  const RV4 = [[0.5, 0.0, 0.5, 1], [0.95, 0.12, 1, 0], [1.0, 0.46, 0.3, 0.3], [0.62, 0.82, 0, 1]];
  const part = (b0, b1, sg, RV, last) => {
    const nb = b1 - b0, nv = RV.length, nr = nb * nv + 2, pos = new Float32Array(sg * nr * 3), aD = new Float32Array(sg * nr * 2), cap = new Float32Array(sg * nr);
    for (let s = 0; s < sg; s++) {
      const th = (s / sg) * Math.PI * 2;
      for (let b = b0; b < b1; b++) {
        const B = blobs[b], below = b > 0 ? blobs[b - 1].h : 1.5;
        const lob = 1 + B.lop * Math.cos(th - B.a1) + B.lop * 0.5 * Math.cos(2 * th - B.a2);
        const tw = Math.max(B.tw * 0.62, 4.6 / sg);                // dribbled tongues: three to a blob, as narrow as the mesh can draw
        const d1 = Math.atan2(Math.sin(th - B.t1), Math.cos(th - B.t1)) / tw, d2 = Math.atan2(Math.sin(th - B.t2), Math.cos(th - B.t2)) / (tw * 0.8), d3 = Math.atan2(Math.sin(th - B.t3), Math.cos(th - B.t3)) / (tw * 0.9);
        const tongue = Math.max(Math.exp(-d1 * d1) * B.td, Math.exp(-d2 * d2) * B.td2, Math.exp(-d3 * d3) * 0.5 * (B.td + B.td2));
        for (let j = 0; j < nv; j++) {
          const rv = RV[j], rr = B.r * (j === 0 && b === 0 && o.skirt ? 0.9 : rv[0]) * lob * (1 + 0.14 * tongue * rv[2]);
          const yy = B.y + B.h * rv[1] - tongue * rv[2] * Math.min(below, B.h * 1.4) * 0.95;
          const v = s * nr + 1 + (b - b0) * nv + j, i = v * 3;
          pos[i] = o.ox + B.x + Math.cos(th) * rr; pos[i + 1] = o.oy + yy; pos[i + 2] = o.oz + B.z + Math.sin(th) * rr;
          aD[v * 2 + 1] = (o.fresh ?? 0) * smoothstep(0.55, 1, (B.y + B.h) / o.H); cap[v] = rv[3];
        }
      }
      const B0 = blobs[b0], BT = blobs[b1 - 1];
      const skR = b0 ? 0.3 : o.skirt ? 1.3 * (1 + 0.16 * Math.cos(3 * th + B0.a1)) : 0.9, skY = b0 ? B0.h * 1.5 : o.skirt ? 2.3 * (1 + 0.3 * Math.cos(3 * th + B0.a1)) : 3;   // o.skirt: the foot sags out over what it stands on
      pos.set([o.ox + B0.x + Math.cos(th) * B0.r * skR, o.oy + B0.y - skY, o.oz + B0.z + Math.sin(th) * B0.r * skR], s * nr * 3);
      const capR = last ? (o.capR ?? 0.04) : BT.r * 0.3, capY = last ? BT.h * (o.capR ? 0.98 : 1.12) : BT.h * 1.05;
      pos.set([o.ox + BT.x + Math.cos(th) * capR, o.oy + BT.y + capY, o.oz + BT.z + Math.sin(th) * capR], (s * nr + nr - 1) * 3);
      aD[(s * nr + nr - 1) * 2 + 1] = o.fresh ?? 0; cap[s * nr + nr - 1] = 1;
    }
    // rows run upward and columns counter-clockwise seen from above, so the grid would face inward: reverse the rows
    const g = gridGeometry(flipRows(pos, sg, nr, 3), flipRows(aD, sg, nr, 2), sg, nr, true, 1.6), cf = flipRows(cap, sg, nr, 1), A = g.attributes.aD.array;
    for (let i = 0; i < cf.length; i++) A[i * 2] = cf[i];          // aD.x of a blob is its cap weight, not its convexity
    return g;
  };
  const parts = [];
  if (split > 0) parts.push(part(0, split, o.segsFat ?? 18, RV5, split === blobs.length));
  if (spirePause) await spirePause();
  if (split < blobs.length) parts.push(part(split, blobs.length, segs, RV4, true));
  if (spirePause) await spirePause();
  const geo = parts.length > 1 ? mergeGeometries(parts, false) : parts[0];
  const nb = blobs.length;
  for (const B of blobs) { B.x += o.ox; B.y += o.oy; B.z += o.oz; }
  const T = blobs[nb - 1];
  return { geo, blobs, top: { x: T.x, y: T.y + T.h, z: T.z, r: T.r } };
}
function flipRows(arr, nc, nr, n) {
  const out = new Float32Array(arr.length);
  for (let c = 0; c < nc; c++) for (let r = 0; r < nr; r++) for (let k = 0; k < n; k++) out[(c * nr + r) * n + k] = arr[(c * nr + (nr - 1 - r)) * n + k];
  return out;
}

// Unit gobbet: 'position' is the blob after landing (radius 1, crown at 0.5, a lobed skirt hanging below 0), 'aBall'
// the same vertices as a ball in the air.
function dripGeometry(rng, segs = 14) {
  const land = [[0.55, -0.12, 0.3], [1.0, -0.22, 1], [1.07, 0.06, 0.2], [0.86, 0.33, 0], [0.46, 0.47, 0], [0.02, 0.5, 0]];
  const lat = [-1.25, -0.72, -0.1, 0.5, 1.05, 1.5], nr = land.length;
  const pos = new Float32Array(segs * nr * 3), ball = new Float32Array(segs * nr * 3), aD = new Float32Array(segs * nr * 2);
  const t1 = rng.range(0, 6.28), t2 = t1 + rng.range(1.6, 3.4), t3 = t2 + rng.range(1.2, 2.2);
  for (let s = 0; s < segs; s++) {
    const th = (s / segs) * Math.PI * 2;
    const g = (t, w) => Math.exp(-((Math.atan2(Math.sin(th - t), Math.cos(th - t)) / w) ** 2));
    const tongue = Math.max(g(t1, 0.55), 0.75 * g(t2, 0.4), 0.55 * g(t3, 0.7));
    for (let j = 0; j < nr; j++) {
      const r = j, i = (s * nr + (nr - 1 - r)) * 3, L = land[r];
      const rr = L[0] * (1 + 0.1 * Math.cos(th * 2 + t1)) * (1 + 0.12 * tongue * L[2]);
      pos[i] = Math.cos(th) * rr; pos[i + 1] = L[1] - tongue * L[2] * 0.85; pos[i + 2] = Math.sin(th) * rr;
      const cl = Math.cos(lat[r]) * 0.8, sl = Math.sin(lat[r]) * 0.8;
      ball[i] = Math.cos(th) * cl; ball[i + 1] = sl + 0.1; ball[i + 2] = Math.sin(th) * cl;
    }
  }
  const geo = gridGeometry(pos, aD, segs, nr, true, 1.2), CAPW = [0, 0, 0.1, 0.62, 1, 1];
  for (let s = 0; s < segs; s++) for (let r = 0; r < nr; r++) geo.attributes.aD.array[(s * nr + (nr - 1 - r)) * 2] = CAPW[r];
  geo.setAttribute('aBall', new THREE.BufferAttribute(ball, 3));
  return geo;
}

// A cockle, 2.6 m across, lying in its local XY plane: hinge at the origin, ribs fanning toward +Y, dome toward +Z.
// aTint = cream with rust-rose growth bands, darker in the grooves between the 13 ribs.
function shellGeometry(rng, cream, rose) {
  const ribs = 13, nc = ribs * 2 + 1, nr = 6, pos = [], tint = [], idx = [];
  const bands = [rng.range(0.3, 0.45), rng.range(0.55, 0.7), rng.range(0.8, 0.9)], roseAmt = rng.range(0.55, 1);
  for (let c = 0; c < nc; c++) {
    const u = c / (nc - 1) * 2 - 1, phi = u * 1.2, rib = (c % 2 === 1) ? 1 : 0;
    for (let r = 0; r < nr; r++) {
      const v = r / (nr - 1), len = 2.55 * (1 - 0.16 * u * u) * (0.12 + 0.88 * v);
      const dome = 0.62 * Math.sin(Math.PI * Math.pow(v, 0.75) * 0.93 + 0.1) * (1 - 0.55 * u * u) + rib * 0.1 * (0.3 + v);
      pos.push(Math.sin(phi) * len * 1.02, Math.cos(phi) * len - 0.35, dome);
      let band = 0; for (const b of bands) band = Math.max(band, 1 - Math.min(1, Math.abs(v - b) / 0.07));
      const k = clamp(band * roseAmt + (v < 0.14 ? 0.7 : 0), 0, 1), sh = rib ? 1 : 0.8;
      tint.push(lerp(cream.r, rose.r, k) * sh, lerp(cream.g, rose.g, k) * sh, lerp(cream.b, rose.b, k) * sh, 0);
    }
  }
  for (let c = 0; c < nc - 1; c++) for (let r = 0; r < nr - 1; r++) { const a = c * nr + r, b = a + nr; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTint', new THREE.Float32BufferAttribute(tint, 4));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array(nc * nr * 2), 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// The mouth: a pressed collar that the shells are seated on, and the scooped tunnel behind it with finger gouges
// running in. Lathed about the mouth axis (local z through MOUTH), in mound-local coordinates.
function mouthGeometry(ctx) {
  const { noise } = ctx, segs = 44, prof = [[13.6, -5.2], [12.7, -1.6], [11.3, 0.9], [9.6, 2.0], [8.5, 2.15], [7.8, 1.7], [7.62, 0.6], [7.6, -2], [7.5, -8], [7.2, -16], [6.6, -26], [0.0, -27.5]];
  const nr = prof.length, pos = new Float32Array(segs * nr * 3), aD = new Float32Array(segs * nr * 2);
  for (let s = 0; s < segs; s++) {
    const th = (s / segs) * Math.PI * 2;
    for (let r = 0; r < nr; r++) {
      const P = prof[r], inside = r >= 7 ? 1 : 0;
      const gouge = inside * 0.3 * Math.pow(Math.abs(Math.cos(th * 5.5 + 0.4)), 3) * (r < nr - 1 ? 1 : 0);
      const lump = (1 - inside) * 0.5 * noise.n3(Math.cos(th) * 2.2, Math.sin(th) * 2.2, r * 0.7);
      const rr = P[0] + gouge + lump, i = (s * nr + r) * 3;
      pos[i] = MOUTH.x + Math.cos(th) * rr; pos[i + 1] = MOUTH.y + Math.sin(th) * rr; pos[i + 2] = MOUTH.z + P[1] + lump * 0.4 - Math.cos(th) * rr * MOUTH_SHEAR * (r <= 6 ? 1 : r === 7 ? 0.45 : 0);
      aD[(s * nr + r) * 2 + 1] = inside * 0.7;
    }
  }
  const g = gridGeometry(pos, aD, segs, nr, true, 1.4);
  for (let s = 0; s < segs; s++) for (let r = 8; r < nr; r++) g.attributes.aD.array[(s * nr + r) * 2] = -Math.min(1, (r - 7) * 0.3);
  return g;
}

// Trickles: grains of dry sand let go down pre-placed chutes (a quadratic curve each), in bursts. One instanced quad
// per grain, never thinner than 1.6 px. chutes = [{p0, p1, p2}] in local space.
async function trickleMesh(rng0, chutes, perChute, SU, pause, oldPer = perChute) {
  // (the grains have their own stream of chance; the piece's stream is drawn exactly as often as it used to be, so
  // that the shells made after this are the shells they were)
  const rng = rng0.fork ? rng0.fork('trickles') : rng0;
  if (rng0.fork) { let k = -1; for (const C of chutes) if (C.old) k += 2 + 9 * Math.max(4, Math.round(oldPer * C.old)); for (let i = 0; i < k; i++) rng0(); }      // (the fork itself took one draw)
  let n = 0; for (const C of chutes) { C.n = Math.max(3, Math.round(perChute * (C.many ?? 1))); n += C.n; }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const a0 = new Float32Array(n * 3), a1 = new Float32Array(n * 3), a2 = new Float32Array(n * 3), ap = new Float32Array(n * 4), al = new Float32Array(n);
  for (let c = 0, i = 0; c < chutes.length; c++) {
    if (pause && c % 16 === 15) await pause();
    if (pause && chutes[c].own && c % 4 === 3) await pause();      // (this round's chutes carry more grains each: a pause after every four)
    const C = chutes[c], gate = rng(), sp = rng.range(0.16, 0.26);
    for (let k = 0; k < C.n; k++, i++) {
      const j = () => rng.range(-0.14, 0.14);
      a0.set([C.p0.x + j(), C.p0.y, C.p0.z + j()], i * 3); a1.set([C.p1.x + j(), C.p1.y, C.p1.z + j()], i * 3);
      a2.set([C.p2.x + j() * 3, C.p2.y, C.p2.z + j() * 3], i * 3);
      ap.set([rng(), sp * rng.range(0.85, 1.15), gate, rng.range(0.07, 0.11)], i * 4); al[i] = C.litY ?? -1e4;
    }
  }
  g.setAttribute('aP0', new THREE.InstancedBufferAttribute(a0, 3)); g.setAttribute('aP1', new THREE.InstancedBufferAttribute(a1, 3));
  g.setAttribute('aP2', new THREE.InstancedBufferAttribute(a2, 3)); g.setAttribute('aPh', new THREE.InstancedBufferAttribute(ap, 4));
  g.setAttribute('aLitY', new THREE.InstancedBufferAttribute(al, 1));   // local y above which this chute is in the sun (walls of the nave); -1e4 = always
  g.instanceCount = n;
  if (pause) await pause();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...SU, uViewH: { value: 450 } },
    vertexShader: /* glsl */`
      uniform float uTime, uViewH;
      attribute vec3 aP0, aP1, aP2; attribute vec4 aPh; attribute float aLitY;
      varying vec3 vW; varying vec4 vQ;
      void main(){
        float t = fract(uTime*aPh.y + aPh.x), q = t*t, tb = max(t - 0.05, 0.), qb = tb*tb;
        float burst = smoothstep(0.1, 0.5, sin(uTime*0.45 + aPh.z*6.283 - t*1.5)*0.5 + 0.5);    // a crust lets go, runs, stops
        vec3 p = mix(mix(aP0, aP1, q), mix(aP1, aP2, q), q), pb = mix(mix(aP0, aP1, qb), mix(aP1, aP2, qb), qb);      // the head of the thread, and where it was a moment ago
        vec4 mv = viewMatrix*modelMatrix*vec4(p, 1.), mb = viewMatrix*modelMatrix*vec4(pb, 1.);
        float d = max(-mv.z, 0.1);
        float pxm = d/max(uViewH*projectionMatrix[1][1]*0.5, 1.);                                   // metres to a pixel at this depth
        float W = max(aPh.w, mix(2.3, 1.25, smoothstep(50., 150., d))*pxm)*burst*smoothstep(0., 0.04, t)*(1. - smoothstep(0.93, 1., t));      // a grain is never under two pixels across
        W *= step(fract(aPh.x*7.31 + aPh.z*3.), clamp(42./d, 0.04, 1.));                             // far off only a few of the threads are drawn: a spire never wears a cloud of them
        vec2 dir = mb.xy - mv.xy; float dl = length(dir); dir = dl > 1e-4 ? dir/dl : vec2(0., 1.);
        float L = clamp(dl, 5.*W, 22.*W);                                                            // five or six grains long
        mv.xy += vec2(dir.y, -dir.x)*position.x*W + dir*position.y*L;      // (this way round the quad faces us)
        vW = (modelMatrix*vec4(mix(p, pb, position.y), 1.)).xyz;
        vQ = vec4(position.x, position.y*L/max(2.6*W, 1e-5), smoothstep(aLitY - 0.6, aLitY + 0.6, p.y), aPh.x*91.7);
        gl_Position = projectionMatrix*mv;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vW; varying vec4 vQ;
      void main(){
        float c = floor(vQ.y), h = cbtH31(vec3(c, vQ.w, 1.7)), h2 = fract(h*7.13);
        vec2 g = vec2(vQ.x - (h - 0.5)*0.9, (fract(vQ.y) - 0.5)*2.6 - (h2 - 0.5)*0.9);            // one grain to a cell, each a little out of line
        float grain = step(dot(g, g), 0.3 + 0.3*h2)*step(0.2, fract(h*13.7));
        float core = step(abs(vQ.x - (h - 0.5)*0.5), 0.4)*step(0.3, fract(h*5.3));                    // the thread itself, broken: fine sand running between the grains
        cbtCut = grain + core < 0.5;      // (between the grains: decided here, cut below, once the shading has taken this pixel's footprint: a derivative taken after a cut is not defined)
        vec3 n = uSunDir + vec3(0., 0.6, 0.); n /= max(length(n), 1e-4);
        vec3 col = cbtShade(uDryC, 0., 0., vW, n, vQ.z);
        if (cbtCut) discard;
        gl_FragColor = vec4(col, 1.);
      }` });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.castShadow = false;
  return m;
}

// PLUMES OF THE DRY BREEZE (that edition only). Each plume is fastened to a crest of the world and is ONE ribbon of
// blown sand: densest at its root on the crest, it runs downwind, widens, thins and sinks over its own length (15 to
// 30 m). A plume is two crossed bands standing in the world (one upright, one lying, both along the wind), so it has
// its shape from every side; the sand in it is drawn as streaks running down the wind. No grain is anywhere else in
// the air. crests = [{ p: Vector3 (the crest, in the mesh's own space), len, sink, gone (journey second after which
// the crest is no longer there: a turret that sits down; default never) }], wind = unit Vector3 (the way the gust
// blows), rng = a stream of its own. Gusts travel down the wind on the world's clock: plumes swell and slacken in turn.
export async function plumeMesh(rng, crests, wind, SU, pause) {
  const SEG = 4, P = [], I = [];
  for (let pl = 0; pl < 2; pl++) { const b = P.length / 3;
    for (let k = 0; k <= SEG; k++) { const sq = k / SEG; P.push(sq * sq * 0.6 + sq * 0.4, -1, pl, sq * sq * 0.6 + sq * 0.4, 1, pl); }
    for (let k = 0; k < SEG; k++) { const a = b + k * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
  const g = new THREE.InstancedBufferGeometry(), n = Math.max(1, crests.length);
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
  const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 4);
  for (let c = 0; c < crests.length; c++) {
    if (pause && c % 60 === 59) await pause();
    const C = crests[c];
    a0.set([C.p.x, C.p.y, C.p.z, C.gone ?? 1e6], c * 4); a1.set([C.len, C.sink, rng(), rng() * 6.2832], c * 4);
  }
  g.setAttribute('aP0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aRun', new THREE.InstancedBufferAttribute(a1, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...SU, uViewH: { value: 450 }, uWind: { value: wind.clone().normalize() } },
    vertexShader: /* glsl */`
      uniform float uTime, uTs, uViewH; uniform vec3 uWind;
      attribute vec4 aP0, aRun;
      varying vec3 vW; varying vec4 vQ; varying float vOn;
      void main(){
        float s = position.x, c = position.y;
        vec3 side = vec3(-uWind.z, 0., uWind.x);
        float gust = 0.6 + 0.4*sin(uTime*0.8 - dot(aP0.xyz, uWind)*0.045 + aRun.w);
        float len = aRun.x*(0.55 + 0.45*gust);
        vec3 ctr = aP0.xyz + uWind*(len*s) + vec3(0., 1.1*s*(1. - s)*gust - aRun.y*s*s, 0.) + side*(0.7*s*sin(uTime*1.1 + aRun.w*3. + s*4.));
        vec4 mv0 = viewMatrix*modelMatrix*vec4(ctr, 1.);
        float pxm = max(-mv0.z, 0.1)/max(uViewH*projectionMatrix[1][1]*0.5, 1.);              // metres to a pixel at this depth
        float wT = 0.14 + 0.055*len*s, w = max(wT, 1.5*pxm);      // (the ribbon's own width; where that is under a pixel and a half it is drawn that wide and as much fainter, so its cover on screen is its true cover: a far plume is a breath, never a wire)
        vec3 p = ctr + (position.z < 0.5 ? vec3(0., 1., 0.) : side)*(c*w);
        vW = (modelMatrix*vec4(p, 1.)).xyz;
        vQ = vec4(s, c, len, aRun.z);
        vOn = (0.45 + 0.55*gust)*(1. - smoothstep(aP0.w - 0.4, aP0.w + 0.4, uTs))*(wT/w);
        gl_Position = projectionMatrix*viewMatrix*vec4(vW, 1.);
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vW; varying vec4 vQ; varying float vOn;
      void main(){
        float s = vQ.x, c = vQ.y;
        float env = (1. - smoothstep(0.45, 1., abs(c)))*smoothstep(0., 0.02, s)*(1. - s)*(1. - 0.55*s);      // densest at the crest, thinning to nothing
        float along = s*vQ.z;
        float n1 = cbtN3(vec3(along*0.45 - uTime*2.4, c*(1.5 + 4.*s) + vQ.w*17., vQ.w*5.));      // streaks of sand drawn out down the wind
        float n2 = cbtN3(vec3(along*1.6 - uTime*4.2, c*(4. + 6.*s) + vQ.w*3., 2.));
        float a = env*smoothstep(0.36, 0.62, 0.62*n1 + 0.38*n2 + 0.6*env - 0.22)*vOn;
        if (a < 0.02) discard;
        float dist = length(cameraPosition - vW);
        vec3 col = mix(mix(uDryC, vec3(1.), 0.22), uSkyLo, cbtBleach(dist));
        gl_FragColor = vec4(col, min(a, 0.72));
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.castShadow = false; m.name = 'crest-plumes';
  return m;
}

// The two cones at the foot of the head wall, one in each corner of the nave: dry sand that ran down the wall and lies
// at thirty degrees, round, with a ragged foot. Their own small mesh (the mound's grid folds in the corners).
function cornerCones(noise) {
  const SEG = 24, RINGS = 7, pos = [], aD = [], idx = [];
  for (const sx of [-1, 1]) {
    const cx = sx * (NAVE - 3.9), cz = HEAD_Z + 2.3, H = 5.3, b0 = pos.length / 3;
    pos.push(cx, H, cz); aD.push(1, -0.25);
    for (let k = 1; k <= RINGS; k++) for (let s = 0; s < SEG; s++) {
      const th = s / SEG * 6.2832, t = k / RINGS, rag = 1 + (0.13 * noise.n2(Math.cos(th) * 1.7 + sx * 5, Math.sin(th) * 1.7 + 3) + 0.06 * noise.n2(Math.cos(th) * 5.1, Math.sin(th) * 5.1 + sx * 9)) * t;
      const r = 9.9 * t * rag, x = cx + Math.cos(th) * r, z = cz + Math.sin(th) * r;
      const y = H * (1 - Math.pow(t, 0.92)) - 0.42 * t * t + 0.1 * noise.n2(x * 0.45, z * 0.45) * t * (1 - t) * 4;      // 30 degrees at the top, easing out at the foot
      pos.push(x, y, z); aD.push(0.9 - 0.5 * t, k === RINGS ? 0.2 : -0.25);
      const a = b0 + 1 + (k - 1) * SEG + s, b = b0 + 1 + (k - 1) * SEG + (s + 1) % SEG;
      if (k === 1) idx.push(b0, b, a); else { const c = a - SEG, d = b - SEG; idx.push(c, d, a, d, b, a); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(aD, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// a small dry cone (never steeper than 34 degrees) where a trickle comes to rest
function coneGeometry(rng, x, y, z, r) {
  const segs = 7, h = r * TAN34 * 0.8, pos = [x, y + h, z], idx = [];
  for (let s = 0; s < segs; s++) { const th = (s / segs) * 6.2832, rr = r * rng.range(0.8, 1.2); pos.push(x + Math.cos(th) * rr, y - 0.15, z + Math.sin(th) * rr); idx.push(0, 1 + (s + 1) % segs, 1 + s); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array((segs + 1) * 2).fill(0).map((v, i) => (i % 2 === 0 ? 1 : 0)), 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('drip-cathedral') : ctx.rng;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const U = makeStyleUniforms(), mk = (o = {}) => sandMaterial({ ...o, uniforms: U });      // this build's own light
  U.uWetC.value.set(pal[0]); U.uDryC.value.set(pal[1]); U.uShadeC.value.set(pal[2]);
  const sunLocal = (opts.sun ? opts.sun.clone() : new THREE.Vector3(0.963, 0.208, 0.170)).normalize();
  U.uSunDir.value.copy(sunLocal);
  const sunH = new THREE.Vector2(sunLocal.x, sunLocal.z).normalize();
  const object = new THREE.Group(); object.name = 'drip-cathedral';
  const sand = mk(), blobMat = mk({ drib: true });
  await ctx.yield();

  // ---- where the eighteen stand: eight on the port arm (-X), seven on the starboard arm, three on the head
  const spots = [];
  for (let i = 0; i < 8; i++) spots.push({ arm: 'port', x: -NAVE - CREST_D + rng.range(-4.5, 4.5), z: i ? lerp(71, -38, (i - 1) / 6) + rng.range(-3, 3) : 98 });
  for (let i = 0; i < 7; i++) spots.push({ arm: 'star', x: NAVE + CREST_D + rng.range(-4.5, 4.5), z: lerp(95, -27, i / 6) + rng.range(-4, 4) });
  spots.push({ arm: 'head', x: -31 + rng.range(-3, 3), z: -79 + rng.range(-3, 3) }, { arm: 'head', x: rng.range(-4, 4), z: -86 + rng.range(-2, 3) }, { arm: 'head', x: 27 + rng.range(-2, 3), z: -82 + rng.range(-3, 2) });
  const kinked = rng.int(2, 6), forked = new Set([rng.int(1, 7), rng.int(8, 11), rng.int(12, 14), rng.int(15, 17)]);
  spots.forEach((s, i) => {
    const toHead = smoothstep(100, -40, s.z);
    s.H = i === 16 ? 90 : i === 0 ? 48 : clamp(lerp(40, 66, toHead) + rng.range(-8, 16) + (i % 2 ? 7 : -4), 38, 84);
    s.kind = i === 0 ? 'grow' : i === 16 ? 'tall' : rng.pick(['fat', 'needle', 'plain', 'plain', 'needle', 'fat', 'plain']);
    s.R0 = (i === 0 ? 9.2 : 5.2 + s.H * 0.045) * rng.range(0.9, 1.15) * (s.kind === 'fat' ? 1.22 : s.kind === 'needle' ? 0.88 : 1);
    if (s.kind === 'fat') s.H = Math.max(38, s.H * 0.8);
    s.oy = CREST - 0.8;
  });
  const saddle = { z: (spots[0].z - spots[0].R0 + spots[1].z + spots[1].R0) / 2, w: clamp((spots[0].z - spots[0].R0 - spots[1].z - spots[1].R0) * 0.5, 4, 7), depth: SADDLE_DEPTH };
  await ctx.yield();
  const L = { rng, outline: makeOutline(1.75), feet: spots.map((s) => ({ x: s.x, z: s.z, r: s.R0 })), sunH, saddle };
  await ctx.yield();

  const mound = new THREE.Mesh(await buildMound(ctx, L), mk({ hand: true, hole: new THREE.Vector4(MOUTH.x, MOUTH.y, MOUTH.z, 7.7) }));
  mound.castShadow = true; mound.receiveShadow = true; object.add(mound);
  await ctx.yield();

  // ---- seventeen finished spires (merged per file) and the stem of the one still being made
  const groups = { port: [], port2: [], star: [], star2: [], head: [] }, chutes = [], spires = [];
  spirePause = () => ctx.yield();
  let stem = null;
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i], grow = i === 0;
    const sp = await buildSpire(rng, { H: s.H, R0: s.R0, tipR: grow ? 2.0 : rng.range(0.42, 0.62), pow: grow ? 1.5 : s.kind === 'fat' ? rng.range(1.1, 1.5) : s.kind === 'needle' ? rng.range(2.7, 3.4) : rng.range(1.6, 2.4), kink: i === kinked,
      maxBlobs: grow ? 30 : 56, fatR: i < 3 ? 1.25 : 2.0, segs: grow ? 16 : s.arm === 'port' ? 11 : 8, segsFat: grow ? 30 : s.arm === 'port' ? (i < 3 ? 26 : 22) : 16, ox: s.x, oy: s.oy, oz: s.z, fresh: grow ? 0.55 : 0, capR: grow ? 1.2 : 0, lean: grow ? 0.01 : (i % 5 === 3 ? rng.range(0.07, 0.11) : undefined) });
    s.blobs = sp.blobs; s.top = sp.top; spires.push(s);
    await ctx.yield();
    const list = grow ? (stem = [sp.geo]) : groups[s.arm === 'head' ? 'head' : s.arm + (s.z < 30 ? '2' : '')];
    if (!grow) list.push(sp.geo);
    if (forked.has(i)) {                                           // a fork: a second, slighter stack that left the first part-way up
      const k = Math.floor(sp.blobs.length * rng.range(0.22, 0.4)), B = sp.blobs[k], a = rng.range(0, 6.28);
      const fk = await buildSpire(rng, { H: (s.H - (B.y - s.oy)) * rng.range(0.45, 0.7), R0: B.r * 0.62, tipR: 0.42, pow: 1.6, lean: 0.16, maxBlobs: 22,
        ox: B.x + Math.cos(a) * B.r * 0.7, oy: B.y + 1.5, oz: B.z + Math.sin(a) * B.r * 0.7 });
      list.push(fk.geo);
      await ctx.yield();
    }
    // chutes: a crust on a shoulder lets go and runs down to a wider blob below, mostly on the sunlit side
    const nCh = grow ? 12 : i < 4 ? 13 : 9, old = grow || i < 4 ? 3.4 : 0.8, many = grow || i < 4 ? 3.0 : s.arm === 'star' ? 0.8 : 3.4;      // (thick on the port file and the head, which the look up from the nave holds)
    for (let c = 0; c < nCh; c++) {
      const k = rng.int(6, Math.max(7, Math.floor(sp.blobs.length * 0.7))), m = k - rng.int(3, 6), B = sp.blobs[Math.min(k, sp.blobs.length - 1)], M = sp.blobs[Math.max(m, 0)];
      const a = Math.atan2(sunH.y, sunH.x) + rng.range(-1.9, 1.9), ca = Math.cos(a), sa = Math.sin(a);
      const r2 = Math.max(M.r * 0.72, B.r * 0.9 + 0.3), onCap = r2 <= M.r * 0.84;      // the grains come to rest on the cap of a wider blob below
      const p0 = new THREE.Vector3(B.x + ca * B.r * 0.86, B.y + B.h * 0.8, B.z + sa * B.r * 0.86), p2 = new THREE.Vector3(M.x + ca * r2, M.y + M.h * 0.72, M.z + sa * r2);
      const p1 = new THREE.Vector3(lerp(p0.x, p2.x, 0.7) + ca * 0.6, p0.y - 0.2, lerp(p0.z, p2.z, 0.7) + sa * 0.6);
      chutes.push({ p0, p1, p2, many, old });
      const cr = rng.range(0.9, 1.7); if (onCap) list.push(coneGeometry(rng, p2.x, p2.y + 0.05, p2.z, Math.min(cr, M.r * 0.24)));
    }
    await ctx.yield();
  }
  // a fork just begun on the nave side of the growing spire, at the height the camera passes: a third of the
  // gobbets of the linger land on it, about 11 m from the fly-through line
  const grower = spires[0];
  const fB = grower.blobs.find((B) => B.y - grower.oy > 5.5) ?? grower.blobs[3], fa = rng.range(-0.1, 0.5);
  const fork = await buildSpire(rng, { H: 4.4, R0: 3.2, tipR: 2.0, pow: 1.2, lean: 0.02, maxBlobs: 3, segs: 11, segsFat: 20, fresh: 0.55, capR: 1.1, skirt: true,
    ox: fB.x + Math.cos(fa) * fB.r * 0.82, oy: fB.y + fB.h * 0.4, oz: fB.z + Math.sin(fa) * fB.r * 0.82 });
  stem.push(fork.geo);
  // ---- the piece's own line through the nave and the portal's seat (local): known as soon as the fork stands
  const gx = grower.x, gz = grower.z;
  const passX = Math.max(fork.top.x + 12, gx + 19);      // the linger runs 12 m from the fork's axis, about 9 m from its flank
  const flyThrough = [[0, 6, 184], [-4, 18, 154], [passX * 0.75, 34, 126], [passX, 42, gz + 4], [passX, 42, gz - 20], [-10, 33, 46], [-3, 17, 20], [0, 8, 0], [0, 8, HEAD_Z - 1.2]].map((p) => new THREE.Vector3(...p));
  const portalSeat = { position: new THREE.Vector3(0, MOUTH.y, HEAD_Z - 1.2), facing: new THREE.Vector3(0, 0, 1), radius: 7 };
  // THE COURSE'S LINE in plan, in the piece's own space, as points no more than 2 m of route apart. A world lays its
  // course along the piece's line and says where it runs: opts.course is asked once, here, with the piece's object,
  // its line and the seat, and answers with the points of its course in the world's space (the object then stands in
  // its place). A piece that stands alone has its own line, joined straight and stepped the same way.
  const courseXZ = [];
  if (opts.course) for (const p of opts.course(object, flyThrough, portalSeat.position)) { const q = object.worldToLocal(p.clone()); courseXZ.push(q.x, q.z); }
  else for (let k = 0; k + 1 < flyThrough.length; k++) { const a = flyThrough[k], b = flyThrough[k + 1], n = Math.ceil(a.distanceTo(b) / 2); for (let j = k ? 1 : 0; j <= n; j++) courseXZ.push(lerp(a.x, b.x, j / n), lerp(a.z, b.z, j / n)); }
  const offCourse = (x, z) => { let d = 1e18; for (let q = 0; q < courseXZ.length; q += 2) d = Math.min(d, (courseXZ[q] - x) ** 2 + (courseXZ[q + 1] - z) ** 2); return Math.sqrt(d); };
  await ctx.yield();
  // MORE TRICKLES, of their own stream of chance (spire-trickles), each fixed to a wet flank and ending in a pale cone.
  // ON THE SPIRES, by one rule of the place: a finished spire carries eight where its axis stands within 40 m, in
  // plan, of the course's line (the nearest of the line's points above), and carries them on its side turned to the
  // nave: a spire beside the nave turns to the nave's middle line (so the starboard file's side is the mirror of the
  // port file's), a spire behind the head wall turns down the nave.
  // AT THE SADDLE AND ON THE DOME, further down, which are things of their own place: the saddle is the heel of a hand
  // pressed into the port crest, the dome is the rounded end of the port arm beside it. Down the saddle's two sides
  // and down the dome's fall lines (faces steeper than 34 degrees, so wet) the crust at the rim pales and lets go, and
  // the grains lie as a cone where a floor or a ledge holds them.
  const trng = makeRng(hashSeed('spire-trickles:' + ctx.seed)), moreChutes = [], saddleCones = [];
  for (let i = 1; i < spires.length; i++) {
    const s = spires[i]; if (offCourse(s.x, s.z) > 40) continue;
    const list = groups[s.arm === 'head' ? 'head' : s.arm + (s.z < 30 ? '2' : '')], toNave = s.z < HEAD_Z ? Math.PI / 2 : s.x < 0 ? 0 : Math.PI;
    for (let c = 0; c < 8; c++) {
      const k = trng.int(3, Math.max(4, Math.floor(s.blobs.length * 0.55))), B = s.blobs[Math.min(k, s.blobs.length - 1)];
      let m = Math.min(k, s.blobs.length - 1) - 1; while (m > 0 && s.blobs[m].r < B.r * 1.12 + 0.4 && k - m < 7) m--;
      const M = s.blobs[Math.max(m, 0)], a = toNave + trng.range(-1.4, 1.4), ca = Math.cos(a), sa = Math.sin(a);
      const r2 = Math.max(M.r * 0.7, B.r * 0.95 + 0.4);
      const p0 = new THREE.Vector3(B.x + ca * B.r * 0.9, B.y + B.h * 0.75, B.z + sa * B.r * 0.9), p2 = new THREE.Vector3(M.x + ca * r2, M.y + M.h * 0.72, M.z + sa * r2);
      const p1 = new THREE.Vector3(lerp(p0.x, p2.x, 0.65) + ca * 0.5, lerp(p0.y, p2.y, 0.25), lerp(p0.z, p2.z, 0.65) + sa * 0.5);
      moreChutes.push({ p0, p1, p2, many: 2.0, own: true });
      // (a cone where the grains come to rest on the cap of a wider blob: its radius is a drawn 0.9 to 1.6 m and never over
      // 0.24 of the cap's, so the draw is taken only where the cap is wide enough for it to tell)
      const capR = M.r * 0.24;
      if (r2 <= M.r * 0.86) list.push(coneGeometry(trng, p2.x, p2.y + 0.05, p2.z, capR > 0.9 ? Math.min(trng.range(0.9, 1.6), capR) : capR));
    }
    await ctx.yield();
  }
  { const mp = mound.geometry.attributes.position, near = [];
    for (let v = 0; v < mp.count; v++) { const x = mp.getX(v), z = mp.getZ(v); if (x < -NAVE - 4 && x > -NAVE - 80 && z > saddle.z - saddle.w * 3.4 && z < ARM_END + 40) near.push(x, mp.getY(v), z); }
    await ctx.yield();
    const moundY = (x, z) => { let best = 1e9, y = CREST; for (let q = 0; q < near.length; q += 3) { const d = (near[q] - x) ** 2 + (near[q + 2] - z) ** 2; if (d < best) { best = d; y = near[q + 1]; } } return y; };
    // NO CONE AFLOAT. A cone stands only where its whole base lies on the mound's sand, above the highest level the
    // water round the piece reaches during the flight (opts.waterTop, the piece's own y; none when the piece stands
    // alone): two heights, taken at the cone's own place (its middle and seven points of its rim). The sand's height is
    // the mound's own surface there, read from its triangles; where the mound has none there is no sand of the piece to
    // stand on. A cone that fails is not built: nothing is made for it and nothing is drawn for it.
    const waterTop = opts.waterTop ?? -1e9, mi = mound.geometry.index.array, tris = [];
    for (let t = 0; t < mi.length; t += 3) { const a = mi[t], b = mi[t + 1], c = mi[t + 2], ax = mp.getX(a), bx = mp.getX(b), cx = mp.getX(c);
      if (Math.max(ax, bx, cx) < -NAVE - 4 && Math.min(ax, bx, cx) > -NAVE - 80 && Math.max(mp.getZ(a), mp.getZ(b), mp.getZ(c)) > saddle.z - saddle.w * 3.4) tris.push(ax, mp.getY(a), mp.getZ(a), bx, mp.getY(b), mp.getZ(b), cx, mp.getY(c), mp.getZ(c)); }
    await ctx.yield();
    const sandAt = (x, z) => { let y = -1e9;
      for (let q = 0; q < tris.length; q += 9) {
        const x0 = tris[q], z0 = tris[q + 2], e1x = tris[q + 3] - x0, e1z = tris[q + 5] - z0, e2x = tris[q + 6] - x0, e2z = tris[q + 8] - z0, det = e1x * e2z - e1z * e2x;
        if (Math.abs(det) < 1e-9) continue;
        const u = ((x - x0) * e2z - (z - z0) * e2x) / det, v = ((z - z0) * e1x - (x - x0) * e1z) / det;
        if (u >= 0 && v >= 0 && u + v <= 1) y = Math.max(y, tris[q + 1] + u * (tris[q + 4] - tris[q + 1]) + v * (tris[q + 7] - tris[q + 1]));
      }
      return y; };
    const stands = (x, z, r) => { if (sandAt(x, z) <= waterTop) return false; for (let k = 0; k < 7; k++) { const th = (k / 7) * 6.2832; if (sandAt(x + Math.cos(th) * r * 1.2, z + Math.sin(th) * r * 1.2) <= waterTop) return false; } return true; };
    for (let c = 0; c < 14; c++) {
      const side = c % 2 ? 1 : -1, x = -NAVE - trng.range(8, 34), z0 = saddle.z + side * saddle.w * trng.range(1.2, 1.55), z2 = saddle.z + side * saddle.w * trng.range(0.2, 0.42), zm = lerp(z0, z2, 0.55);
      const p0 = new THREE.Vector3(x, moundY(x, z0) + 0.12, z0), p2 = new THREE.Vector3(x + trng.range(-0.6, 0.6), moundY(x, z2) + 0.1, z2);
      moreChutes.push({ p0, p1: new THREE.Vector3(x, moundY(x, zm) + 0.3, zm), p2, many: 2.4, own: true });
      const rs = trng.range(1.0, 1.9);
      if (stands(p2.x, p2.z, rs)) saddleCones.push(coneGeometry(trng, p2.x, p2.y + 0.02, p2.z, rs));
    }
    await ctx.yield();
    // the dome: the rounded end of the port arm beside the saddle, and its seaward flank. Crusts let go down its fall lines too:
    // each chute starts a little under the crest, runs down the flank to the first ledge or foot that can hold dry sand and ends there in a pale cone
    for (let c = 0; c < 18; c++) {
      const onNose = c % 3 > 0, cx = -NAVE - CREST_D, cz = onNose ? ARM_END - 14 : trng.range(saddle.z + saddle.w * 2.2, ARM_END - 14);
      const th = onNose ? trng.range(0.1, 1.75) : trng.range(-0.25, 0.25), dx = -Math.cos(th), dz = Math.sin(th);      // (from seaward round toward the entry)
      const yT = CREST - trng.range(2.5, 9); let run = 4;
      const at = (e) => { const x = cx + dx * e, z = cz + dz * e; return new THREE.Vector3(x, moundY(x, z), z); };
      let d = 2; while (d < 44 && at(d).y > yT) d += 1.5;
      // (dry sand rests at thirty-four degrees and no steeper: the chute runs down the flank to the first place flat enough to hold what falls, and the cone stands there)
      while (run < 34 && (at(d + run).y - at(d + run + 1.5).y > 0.8 || at(d + run - 1.5).y - at(d + run).y > 1.0)) run += 1.5;
      // (where the flank falls steep all the way to the ward there is no such place: that chute runs ten metres and what it sheds goes on down to the tide, with no cone)
      const held = run < 34 && at(d + run).y >= 3;
      if (!held) { run = 10; while (run > 4 && at(d + run).y < 3) run -= 1; }
      const p0 = at(d), p1 = at(d + run * 0.55), p2 = at(d + run);
      if (p0.y - p2.y < 2) { await ctx.yield(); continue; }
      p0.y += 0.12; p1.y += 0.3; p2.y += 0.1;
      moreChutes.push({ p0, p1, p2, many: 2.4, own: true });
      // (the cone's radius is drawn only for a chute that holds a cone; the test of standing reads it)
      if (held) { const rc = trng.range(0.8, 1.4); if (stands(p2.x, p2.z, rc)) saddleCones.push(coneGeometry(trng, p2.x, p2.y + 0.02, p2.z, rc)); }
      if (c % 2) await ctx.yield();
    }
    await ctx.yield(); }
  const spireMeshes = [];
  for (const key of ['port', 'port2', 'star', 'star2', 'head']) {
    const geo = await mergeSteps(groups[key].map((g) => { g.deleteAttribute('uv'); return g; }), () => ctx.yield());
    const m = new THREE.Mesh(geo, blobMat); m.castShadow = true; m.receiveShadow = true; m.name = 'spires-' + key; object.add(m); spireMeshes.push(m);
    await ctx.yield();
  }
  await ctx.yield();
  const stemMesh = new THREE.Mesh(mergeGeometries(stem, false), blobMat); stemMesh.castShadow = true; stemMesh.receiveShadow = true; object.add(stemMesh);

  // ---- the one still being made: 35 gobbets, one every 1.2 s of the journey, each falls 4.5 s, lands, sags and sets
  const ND = 35, FORK = [17, 19, 21, 23, 25], dripGeo = dripGeometry(rng, 16), drips = new THREE.InstancedMesh(dripGeo, mk({ drip: true, drib: true }), ND);
  const aLand = new Float32Array(ND * 2), M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), V3 = new THREE.Vector3(), S3 = new THREE.Vector3();
  let dy = grower.top.y - 0.35, dx = grower.top.x, dz = grower.top.z, fy = fork.top.y - 0.3, fx = fork.top.x, fz = fork.top.z, nTop = 0;
  const rise = 22.6 / (ND - FORK.length - 1), forkLandings = [];
  for (let i = 0; i < ND; i++) {
    const onFork = FORK.includes(i), r = (onFork ? 1.9 : lerp(2.15, 1.5, i / (ND - 1))) * rng.range(0.92, 1.1);
    Q.setFromAxisAngle(V3.set(0, 1, 0), rng.range(0, 6.28));
    if (onFork) {
      fx += rng.range(-0.25, 0.25); fz += rng.range(-0.25, 0.25);
      M4.compose(V3.set(fx, fy, fz), Q, S3.set(r, r, r)); forkLandings.push({ position: new THREE.Vector3(fx, fy, fz), journeySecond: 0.9 + i * 1.2 });
      fy += r * 0.66;
    } else {
      dx += rng.range(-0.3, 0.3); dz += rng.range(-0.3, 0.3);
      M4.compose(V3.set(dx, dy, dz), Q, S3.set(r, r, r));
      nTop++; dy += (nTop < ND - FORK.length ? rise : 0.5 * r);
    }
    drips.setMatrixAt(i, M4);
    aLand[i * 2] = 0.9 + i * 1.2; aLand[i * 2 + 1] = rng();
  }
  const gTopLeaving = dy;
  dripGeo.setAttribute('aLand', new THREE.InstancedBufferAttribute(aLand, 2));
  drips.customDepthMaterial = dripDepthMaterial(U); drips.castShadow = true; drips.receiveShadow = true; drips.frustumCulled = false;
  object.add(drips);
  await ctx.yield();

  { const tanE = sunLocal.y / Math.max(hyp(sunLocal.x, sunLocal.z), 1e-3), wr = rng.fork ? rng.fork('wall-chutes') : rng;
    for (let k = 0; k < 22; k++) {
      const side = k % 2 ? 1 : -1, z = lerp(96, -44, (k + wr.range(0, 0.9)) / 22), dz = wr.range(-1.5, 1.5), top = CREST - wr.range(0.5, 9), foot = wr.range(1.6, 3.4);
      const xw = (y) => side * (NAVE - 0.4 + 6.2 * clamp((y - 1.7) / (CREST - 2.4), 0, 1) - 1.4);     // a little proud of the leaning face
      const litY = side < 0 ? CREST - (46 + 2 * NAVE) * 0.5 * tanE - 2 : 1e4;                          // port face: sunlit above the starboard crest's shadow
      chutes.push({ p0: new THREE.Vector3(xw(top), top, z), p1: new THREE.Vector3(xw(lerp(top, foot, 0.55)), lerp(top, foot, 0.55), z + dz * 0.6), p2: new THREE.Vector3(xw(foot) - side * 0.8, foot, z + dz), many: 3.6, old: 4.2, litY });
    }
    // and low on the last three spires of the port file, which the look up from the nave holds: on the blobs just above
    // us a crust lets go and runs down the dark flank as a thread (drawn from the wall chutes' own stream of chance)
    for (const i of [5, 6, 7]) { const sp = spires[i]; for (let c = 0; c < 7; c++) {
      const k = Math.min(wr.int(2, 12), sp.blobs.length - 1), B = sp.blobs[k], drop = wr.range(4, 8);
      const a = wr.range(-1.2, 1.2), ca = Math.cos(a), sa = Math.sin(a);      // (the nave side: local +X)
      // it pours off the lip and falls clear, in front of the overhung flank, onto the wider blobs below
      const p0 = new THREE.Vector3(B.x + ca * B.r * 1.02, B.y + B.h * 0.14, B.z + sa * B.r * 1.02);
      chutes.push({ p0, p1: new THREE.Vector3(p0.x + ca * 0.5, p0.y - drop * 0.35, p0.z + sa * 0.5), p2: new THREE.Vector3(p0.x + ca * 0.8, p0.y - drop, p0.z + sa * 0.8), many: 4.6 });
    } } }
  // and off every finished tip the breeze takes a few grains at a time: they stream to port, sinking (seen against the sky).
  // Grains in the air belong to the dry breeze edition only: in the clear and in the fret (opts.breeze false) these
  // streams are not made and nothing is drawn for them. A piece that stands alone stands in the breeze.
  if (opts.breeze ?? true) for (let i = 1; i < spires.length; i++) { const T = spires[i].top, wx = -sunLocal.x, wz = -sunLocal.z, wl = Math.max(hyp(wx, wz), 1e-3), ax = wx / wl, az = wz / wl;
    chutes.push({ p0: new THREE.Vector3(T.x, T.y - 0.4, T.z), p1: new THREE.Vector3(T.x + ax * 5, T.y + 0.5, T.z + az * 5), p2: new THREE.Vector3(T.x + ax * 15, T.y - 3.5, T.z + az * 15), many: 3.2 }); }
  await ctx.yield();
  const trickles = await trickleMesh(rng, chutes, Math.round(13 * detail), U, () => ctx.yield(), Math.round(24 * detail)); object.add(trickles);
  await ctx.yield();
  const trickles2 = await trickleMesh(trng, moreChutes, Math.round(13 * detail), U, () => ctx.yield()); trickles2.name = 'more-trickles'; object.add(trickles2);
  if (saddleCones.length) { const sCones = new THREE.Mesh(mergeGeometries(saddleCones, false), sand); sCones.receiveShadow = true; sCones.name = 'saddle-cones'; object.add(sCones); }
  await ctx.yield();

  // ---- the mouth in the head wall and its sixteen cockles, hinges inward
  const mouth = new THREE.Mesh(mouthGeometry(ctx), mk({ hand: true })); mouth.castShadow = true; mouth.receiveShadow = true; object.add(mouth);
  await ctx.yield();
  const cones = new THREE.Mesh(cornerCones(ctx.noise), mouth.material); cones.receiveShadow = true; cones.name = 'corner-cones'; object.add(cones);
  await ctx.yield();
  const cream = new THREE.Color(pal[4]).lerp(new THREE.Color(pal[1]), 0.25), rose = new THREE.Color(pal[6]);
  const variants = [0, 1, 2, 3].map(() => shellGeometry(rng, cream, rose)), shellGeos = [];
  await ctx.yield();
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), tilt = 0.42;
  for (let k = 0; k < 16; k++) {
    const phi = (k + 0.5) / 16 * Math.PI * 2 + rng.range(-0.05, 0.05), c = Math.cos(phi), s = Math.sin(phi), tl = tilt + rng.range(-0.12, 0.12);
    Y.set(c * Math.cos(tl), s * Math.cos(tl), -Math.sin(tl)); Z.set(c * Math.sin(tl), s * Math.sin(tl), Math.cos(tl)); X.crossVectors(Y, Z);
    const sc = 0.98 * rng.range(0.92, 1.08), rr = 8.7 + rng.range(-0.15, 0.3);
    M4.makeBasis(X, Y, Z).scale(S3.set(sc, sc, sc * 1.15)).setPosition(MOUTH.x + c * rr, MOUTH.y + s * rr, MOUTH.z + 2.22);      // (seated on the collar, not sunk into its lumps: each shell's edge is whole)
    const sg = variants[k % 4].clone().applyMatrix4(M4), sp = sg.attributes.position;
    for (let v = 0; v < sp.count; v++) sp.setZ(v, sp.getZ(v) - (sp.getX(v) - MOUTH.x) * MOUTH_SHEAR);
    sg.computeVertexNormals(); sg.attributes.aD.array.fill(2); shellGeos.push(sg);   // aD.x = 2: a shell of the ring, which the bar of sun always finds
    await ctx.yield();
  }
  const shells = new THREE.Mesh(mergeGeometries(shellGeos, false), mk({ tint: true, side: THREE.DoubleSide }));
  shells.castShadow = true; shells.receiveShadow = true; shells.name = 'cockle-ring'; object.add(shells);
  variants.forEach((g) => g.dispose());
  await ctx.yield();

  // ---- the one sun: the only shadow light of the world. The world coder widens its box over the whole castle.
  let sun = null;
  if (opts.shadowLight !== false) {
    sun = new THREE.DirectionalLight('#ffffff', opts.lightIntensity ?? 0);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0;
    object.add(sun); object.add(sun.target);
  }
  const fitSun = (dirWorld, centerWorld, half = 165, depth = 420) => {
    U.uSunDir.value.copy(dirWorld).normalize();
    object.updateMatrixWorld(true);
    // the plane the cockles lie in (it leans toward the sun by MOUTH_SHEAR), for the worked-out light of the head wall
    V3.set(MOUTH.x, MOUTH.y, MOUTH.z + 2.1); object.localToWorld(V3); U.uMouthW.value.set(V3.x, V3.y, V3.z, 1);
    U.uMouthN.value.set(MOUTH_SHEAR, 0, 1).normalize().transformDirection(object.matrixWorld);
    if (!sun) return;
    sun.target.position.copy(object.worldToLocal(V3.copy(centerWorld)));
    sun.position.copy(object.worldToLocal(V3.copy(centerWorld).addScaledVector(U.uSunDir.value, depth)));
    const cam = sun.shadow.camera; cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half; cam.near = 10; cam.far = depth * 2; cam.updateProjectionMatrix();
    sun.target.updateMatrixWorld(true); sun.updateMatrixWorld(true);
  };
  fitSun(sunLocal, new THREE.Vector3(0, 40, 0));

  // ---- a 13k silhouette of all eighteen for the world's mirrors: one six-sided ring per blob, tinted pale and dark
  // in turn. NOT added to the object: the world adds hero.reflection under its water with scale.y = -1.
  const rp = [], rt = [], ri = [], wetC = U.uWetC.value, dryC = U.uDryC.value;
  for (const sp of spires) {
    const base = rp.length / 3, nb = sp.blobs.length;
    for (let b = 0; b <= nb; b++) {
      const B = sp.blobs[Math.min(b, nb - 1)], top = b === nb, c = b % 2 ? dryC : wetC;
      for (let k = 0; k < 6; k++) { const th = k / 6 * 6.2832 + b * 0.5, r = top ? 0.05 : B.r; rp.push(B.x + Math.cos(th) * r, B.y + (top ? B.h : B.h * 0.4), B.z + Math.sin(th) * r); rt.push(c.r, c.g, c.b, b % 2 ? 0 : 1); }
      if (b < nb) for (let k = 0; k < 6; k++) { const a = base + b * 6 + k, a2 = base + b * 6 + (k + 1) % 6; ri.push(a, a + 6, a2, a2, a + 6, a2 + 6); }
    }
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3)); rg.setAttribute('aTint', new THREE.Float32BufferAttribute(rt, 4));
  rg.setAttribute('aD', new THREE.Float32BufferAttribute(new Float32Array(rp.length / 3 * 2), 2)); rg.setIndex(ri); rg.computeVertexNormals();
  const reflection = new THREE.Mesh(rg, shells.material); reflection.name = 'spire-silhouettes'; reflection.frustumCulled = false;
  await ctx.yield();

  // ---- anchors (local space)
  const gTop48 = grower.top.y, gTop70 = gTopLeaving;
  const anchors = {
    portalSeat,
    naveFloorY: 0, crestY: CREST,
    naveAxis: [new THREE.Vector3(0, 8, ARM_END), MOUTH.clone()],
    flyThrough,
    growingSpire: { foot: new THREE.Vector3(gx, CREST, gz), topAtArrival: new THREE.Vector3(grower.top.x, gTop48, grower.top.z), topAtLeaving: new THREE.Vector3(dx, gTop70, dz), footRadius: grower.R0 },
    dripPass: new THREE.Vector3(passX, 42, fork.top.z + 8),   // camera point 11-12 m from where the fork's gobbets land
    forkLandings,                                                                    // [{ position, journeySecond }] the five low landings beside the line
    spires: spires.map((s) => ({ arm: s.arm, foot: new THREE.Vector3(s.x, CREST, s.z), tip: new THREE.Vector3(s.top.x, s.top.y, s.top.z), footRadius: s.R0 })),
    saddle: new THREE.Vector3(-NAVE - CREST_D, CREST - saddle.depth, saddle.z),      // the window on the inner ward, port crest
    notch: { through: new THREE.Vector3(20 + 21 * sunH.x, 11, HEAD_Z + 1.5 + 4 + 21 * sunH.y), toward: sunLocal.clone() },
    viewpoints: { reveal: new THREE.Vector3(0, 36, 150), nave: new THREE.Vector3(0, 8, 10), threeQuarter: new THREE.Vector3(-150, 60, 230) },
    footprint: { halfWidth: 86, zFront: 131, zBack: -129 },
    // the crests of the piece (local): every finished spire's tip and two of its shoulders, and the mound's crest line
    // every 17 m; r = the half width of the form there. The dry breeze takes its plumes of grains from them.
    crests: [...spires.slice(1).flatMap((sp) => [0.42, 0.7, 1].map((q) => { const B = sp.blobs[Math.min(sp.blobs.length - 1, Math.floor(sp.blobs.length * q))]; return q === 1 ? { p: new THREE.Vector3(sp.top.x, sp.top.y, sp.top.z), r: 0.3 } : { p: new THREE.Vector3(B.x, B.y + B.h * 0.8, B.z), r: B.r }; })),
      ...(mound.geometry.userData.crestLine ?? []).map((c) => ({ p: new THREE.Vector3(c[0], c[1], c[2]), r: 0 }))],
  };

  // viewer aid only: ?cbtFocus=grow|mouth|nave|file makes the set-piece viewer orbit one part closely
  let focus = opts.focus; try { focus = focus ?? new URLSearchParams(globalThis.location?.search ?? '').get('cbtFocus'); } catch (e) { focus = null; }
  const FOCUS = { grow: [new THREE.Vector3(gx, gTop48 + 3, gz), 9, 16], mouth: [new THREE.Vector3(0, 8, HEAD_Z), 20, 10], nave: [new THREE.Vector3(0, 26, 30), 34, 30],
    file: [new THREE.Vector3(spires[10].x, CREST + 14, spires[10].z), 13, 24], fork: [new THREE.Vector3(fork.top.x, fork.top.y + 3, fork.top.z), 5, 9] }[focus];
  let auto = true, prog = 0, clock = 0, lastT = null;
  const clockSlack = opts.clockSlack ?? [6, 3];      // how far the gobbet clock may run behind / ahead of progress * 42 (a world that feeds real journey seconds tightens it)
  const size = new THREE.Vector2();
  const hero = {
    object, radius: 112, height: 122, center: new THREE.Vector3(0, 42, 5), anchors, ground: true, groundY: -0.6,
    sun, reflection, style: { uniforms: U }, sandMaterial: mk, slumpDepthMaterial: () => slumpDepthMaterial(U), materials: { sand, tint: shells.material, drip: drips.material, grains: trickles.material },
    meshes: { mound, spires: spireMeshes, stem: stemMesh, drips, trickles, mouth, shells },
    // u = 0..1 along the world's path: gobbets fall and land on it, and the drying clock creeps
    setProgress(u) { auto = false; prog = clamp(u, 0, 1); U.uDryClock.value = 0.52 + 0.36 * prog; },
    // sun direction in WORLD space (toward the sun) and the centre / half size of the box its shadow map covers
    setSun(dirWorld, centerWorld, half, depth) { fitSun(dirWorld, centerWorld ?? object.localToWorld(new THREE.Vector3(0, 40, 0)), half, depth); },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (auto) { const u = Math.min((time % 46) / JOURNEY_SECONDS, 1); U.uT.value = u * JOURNEY_SECONDS; U.uDryClock.value = 0.52 + 0.36 * u; }
      else { const nom = prog * JOURNEY_SECONDS, step = lastT === null ? 0 : clamp(time - lastT, 0, 2);       // world time, so a held position still drips
        // while the world is only seen through the previous portal (u = 0) the gobbets keep falling: a 1.2 s loop that ends just
        // before the first one lands, each taking the next one's place; the journey clock takes over within its slack
        clock = prog <= 0 ? -0.3 + (((time % 1.2) + 1.2) % 1.2) : clamp(clock + step, nom - clockSlack[0], nom + clockSlack[1]); U.uT.value = clock; }
      lastT = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); trickles.material.uniforms.uViewH.value = size.y; }
      trickles2.material.uniforms.uViewH.value = trickles.material.uniforms.uViewH.value;
    },
    dispose() { if (!reflection.parent) rg.dispose(); if (drips.customDepthMaterial) drips.customDepthMaterial.dispose(); },
  };
  if (FOCUS) { hero.center = FOCUS[0]; hero.radius = FOCUS[1]; hero.height = FOCUS[2]; }
  return hero;
}
