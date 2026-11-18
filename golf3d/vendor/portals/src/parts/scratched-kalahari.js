// THE QUIVER-TREE KOPPIE: hero set piece of "scratched-kalahari" (Night Scratched White).
//
// A dolerite koppie drawn as scratchboard: a hill of about 190 stacked round boulders carrying sixty quiver
// trees in flower, with a saddle notch between two boulder stacks on its summit and the two oldest trees
// leaning their domes together over it. Nothing is toned: every surface is solid black and earns white
// strokes (contour rings round the boulders, grain and diamond flakes down the trunks, one spike per leaf,
// stipple for the stars). The moonrise is a soft edge that walks down the hill and makes every stroke draw
// itself in from one end. Bats stream through the notch, an eagle-owl perched beside it turns its head and
// blinks its eyeshine, saddle grass leans in the gusts, flower spikes tremble, and (optionally, on by default)
// the Milky Way stands behind it as a column of swelling stipple with the Coalsack and the rift left black.
//
// LOCAL SPACE  origin at the base centre (street floor, y = 0), +Y up, front toward +Z: the camera arrives
//              from +Z flying toward -Z. East (the moon side) is -X. The hill runs from z = +95 (the long
//              north spur the camera climbs) to z = -62; the summit notch is at about (0, 21, -20).
// SIZE         footprint 130 m east-west by 160 m north-south (returned radius 42 frames it in the part viewer; the true bounding
//              radius about the origin is 95), height about 36 (tips of the notch trees); the sand apron with
//              its sparse strokes and tussocks reaches r = 210 and fades to bare black from r = 70 to 150.
// COST         about 122k triangles (boulders 46k, trees 55k, ground 9.5k, grass 9k), 9 draw calls (ground,
//              boulders, bark, ribbons, bats, owl head, eyeshine, sky stipple, bright stars), no lights, no
//              textures. Build about 380 ms.
// LIGHTING     None from the scene: it is self-shaded and wants a black scene, no fog (fog is supported and
//              simply greys the strokes), style 'none', bloom threshold >= 1 so that only the eyeshine and
//              meteor head (1.5) bloom; lines are written at 0.89 linear (hero.uniforms.uInk.value; the
//              brief's 0.92 is safe once the world's bloom threshold is 1 or more).
//
// HOW THE STYLE IS DONE (so the rest of the world can match it; the GLSL is exported as SCRATCH_GLSL)
//   * Every vertex carries aHatch = (h, a, h2, a2) in metres: h runs ACROSS the lie of the surface and a ALONG
//     it (boulders: height along a tilted axis and girth; bark: girth and length; ground: height and girth);
//     h2/a2 is a second set at about 65 degrees for cross-hatching. aSurf = (pale, toneScale, diamonds, seed).
//   * Lines are isolines of h. kSet() measures the screen gradient of h once, picks the two octaves of spacing
//     that bracket 6 design pixels (design pixel uPx = drawing-buffer height / 450) and cross-fades them, so
//     lines are ~1.4 px wide and never closer than ~4.5 px at any distance. Each line is cut into tapered
//     strokes by a hash of (line, cell along a); a stroke is kept when its hash is below the tone level.
//   * Tone is a level, not a colour: 0 black, 1 starlight (a quarter of the strokes, on sky-facing surfaces),
//     2 moonlit (all strokes), 3 square to the moon (the second set too). Pale things get a level more.
//   * The moon edge is a height: uPlane (local y). A stroke rooted `rev` = (y - uPlane) / 3 m above it is
//     drawn in up to that fraction of its length. Shadow sides stay black and unoutlined.
//   * Contours are a rim where N.V / |grad N.V| is under ~1.3 px, kept on sky-facing edges in starlight and
//     moon-facing edges in moonlight. At grazing angles the hatch fades and only that contour stays.
//   * Leaves, flower spikes and grass are single lance-shaped ribbons widened in clip space to stay at least
//     1.3 px wide, thinned by a per-stroke hash against distance, grown from the root as the moon edge passes.
//
// OPTS         palette      5 hex strings in brief order (black, white, ...); only [0] and [1] are authored.
//              hour         'night' (default: moonrise driven by setProgress), 'day' | 'golden' (moon already
//                           high: fully cross-hatched from the first frame, only the bright stars), 'dawn'
//                           (no moon: the same edge descends as first light from the east, stars thin out).
//              season       'winter' (default: flower spikes above every rosette) | 'summer' (no flowers,
//                           taller plumed grass).
//              weather      'clear' (default) | 'wind' (stronger gusts).
//              sky          true (default) adds the Milky Way dome and bright stars; pass false if the world
//                           draws its own sky (hero.sky is the group, hero.uniforms.uSkyDim thins it).
//              trees        number of quiver trees (default 60), boulders (default 190), bats (default 40).
//              moonFrom / moonTo   path-u window of the moonrise edge (default 0.50 .. 0.72).
//              progress     initial path progress (default 1: fully moonlit).
//              apronTone    starlight tone of the flat sand apron (default 0.17; the world passes its street tone).
//              Uniforms a world may set: uTilt (slope, z0, zmin, zmax: the moon edge leans along z), uHill (on the hill, south of the
//              gate z of uTiltX: slope along x, extra slope along z about z = 100, offset: the edge can cross the hill on a slant), uTiltX (the edge as a line
//              sweeping the flat street north of z = w: slope along z, z1, slope along x, gate z), uMoonFull
//              (how far moonlight lifts any surface to the full hatch), uFoot (Milky Way density at its foot), uBg (density of the field stars),
//              uGroundNear (extra starlit ground strokes close to the eye), uHillStarFar (x, y: the distance over which
//              the hill's starlit strokes drop out, so that from far off it is a black hole in the stars), uMetTail (how
//              much of the meteor's stroke stays drawn behind its head; 0.45 by default).
//
// PROGRESS     hero.setProgress(u), u = 0..1 along the world's path: the moon edge descends from the top of
//              the crowns at moonFrom to the street floor at moonTo; never the clock. hero.setMoonPlane(y)
//              sets the edge height directly (local metres; -10 = everything lit, 60 = nothing lit).
//              hero.setOwlShadow(worldPos, headingXZ, size) projects the flying owl's shadow (size 0 = off).
//              hero.setMeteor(x) x = 0..1 draws the meteor to the right of the notch (default: one every
//              11 s of world time). Ambient motion (gusts, bats, owl, star swell, flowers) uses time.
//
// ANCHORS (local space)
//   portalSeat   { position, facing, radius: 4.5, tilt: 6 deg }: centre of the 9 m portal circle in the notch,
//                its lowest edge on the saddle; facing is the unit vector back toward the arriving camera.
//   flyThrough   ordered Vector3 list: along the street at 2.5 m, the 13 degree climb up the moonlit north-
//                east flank of the spur (left, then right), and the last 60 m straight (heading 10 degrees
//                right of -Z, rising 6 degrees) into the notch. No boulder or trunk comes within 6.5 m of it
//                (4.5 m at the seat itself); crowns overhang to about 5 m above it near the notch.
//   beyond       point 60 m past the portal on the same line.
//   notch        { saddle, width: 10, leftStack, rightStack }: saddle floor point and the two stack tops.
//   notchTrees   [ { base, top } x2 ]: the two oldest trees.  heroTree { base, top, height }: the 7 m tree
//                8 m to the left of the climb.  owl: the perched eagle-owl.  summit: highest boulder top.
//   moonDir      unit vector TO the moon (east-north-east, 5 degrees up).  milkyWay: unit vector to the
//                foot of the Milky Way column on the horizon (-Z).  cross: direction of the Southern Cross.
//   batCloud     { center, radius }.  heightAt(x, z): hill surface height (function).
//   skyline      { profile: [[x, y, z]...] the hill's top line seen from far up the street, crowns: [{ base, top, center, r }] }.
//   viewpoints   { entry, foot, climb, notch, far }: good camera positions looking at `center`.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const INK = 0.89;      // just under the usual 0.9 bloom threshold; the brief's 0.92 is hero.uniforms.uInk.value

// ------------------------------------------------------------------------------------------------------------
// Shared GLSL: the scratchboard. Needs derivatives (WebGL2). All Direct3D-safe: no pow of negatives, guarded
// divisions and normalizes, derivatives taken outside any loop (there are no loops).
export const SCRATCH_COMMON = /* glsl */`
uniform float uPx, uPlane, uSoft, uStar, uMoonLvl, uTime, uInk;
uniform vec3 uMoonDir, uOwlSun;
uniform vec4 uOwl; uniform vec2 uOwlDir; uniform vec2 uFar; uniform vec2 uStarFar; uniform vec4 uTilt, uTiltX; uniform vec3 uHill; uniform float uMoonFull;
// the moon edge is a plane that may lean along the street: height measured against it (uTilt = slope, z0, zmin, zmax).
// On the street (north of uTiltX.w) the edge is also a line that sweeps over the ground: uTiltX = (slope along z, z1, slope along x, gate z)
float kEff(vec3 lp){ return lp.y + uTilt.x * (clamp(lp.z, uTilt.z, uTilt.w) - uTilt.y) + smoothstep(uTiltX.w, uTiltX.w + 16., lp.z) * (uTiltX.x * (lp.z - uTiltX.y) + uTiltX.z * lp.x) + (1. - smoothstep(uTiltX.w, uTiltX.w + 16., lp.z)) * (uHill.x * lp.x + uHill.y * (lp.z - 100.) + uHill.z); }
float kh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// the flying owl's shadow: signed distance in wingspans (negative inside; 9 when there is none). p world position.
float kOwlSd(vec3 p){
  if (uOwl.w < .01) return 9.;
  vec3 q = p - uOwl.xyz; float along = dot(q, uOwlSun);      // uOwlSun: the direction our shadow is thrown from (the moon's side, raised, so it lands a few wingspans ahead)
  q -= uOwlSun * along;
  // The shape lies across the beam with its wings level and its head up: we fly at the head of the beam, so from
  // where we are the gap on the ground is always this plan of an owl, whatever it falls on.
  vec3 rt = vec3(-uOwlSun.z, 0., uOwlSun.x); rt /= max(length(rt), 1e-3);
  vec3 fw = cross(rt, uOwlSun);
  vec2 s = vec2(dot(q, rt), dot(q, fw)) / uOwl.w;
  float body = length(vec2(s.x, s.y + .02) / vec2(.22, .32)) - 1.;
  float head = length(vec2(s.x, s.y - .34) / vec2(.2, .17)) - 1.;
  // broad round-tipped wings, swept a little back, the trailing edge scalloped between the feather tips
  float ax = abs(s.x), chord = .36 - .12 * ax + .025 * cos(ax * 31.) * step(s.y, .08 - .2 * ax * ax);
  float wing = length(vec2(s.x, s.y - .08 + .2 * ax * ax) / vec2(1., chord)) - 1.;
  float tail = length(vec2(s.x, s.y + .38) / vec2(.15 + .24 * clamp(-s.y - .22, 0., .4), .19)) - 1.;
  float sd = min(min(body, head), min(wing, tail));
  return along < 0. ? sd : 9.;
}
float kOwlShadow(vec3 p){ return 1. - smoothstep(-.25, .05, kOwlSd(p)); }
`;
export const SCRATCH_GLSL = SCRATCH_COMMON + /* glsl */`
// level (0..3) -> share of strokes kept in the first set
float kFrac(float L){ return L < 1. ? .25 * max(L, 0.) : mix(.25, 1., clamp(L - 1., 0., 1.)); }
// one octave: isolines of h at spacing S, cut into tapered strokes along a. w = screen gradient of h.
float kPat(float h, float a, float S, float w, float ks, float km, float grow, float seed, float len){
  float q = h / S; float k = floor(q + .5); float d = abs(q - k) * S / w;
  float ac = a / (S * len) + kh(vec2(k, seed)) * 7.31; float c = floor(ac); float t = ac - c;
  float r = kh(vec2(k * 1.37 + seed * 17., c + 3.));
  float tp = smoothstep(0., .3, t) * (1. - smoothstep(.5, 1., t));
  float star = step(r, ks);
  float moon = step(r, km) * (1. - smoothstep(grow - .1, grow, t));
  float hw = uPx * (.14 + .68 * tp);
  return (1. - smoothstep(hw - .55, hw + .55, d)) * max(star, moon) * smoothstep(0., .1, tp);
}
// a hatch set at constant screen density
float kSet(float h, float a, float S0, float ks, float km, float grow, float seed, float len){
  float w = max(length(vec2(dFdx(h), dFdy(h))), 1e-6);
  float L = log2(4.5 * uPx * w / S0); float o = floor(L); float f = L - o; float Sa = S0 * exp2(o);
  return mix(kPat(h, a, Sa, w, ks, km, grow, seed, len), kPat(h, a, Sa * 2., w, ks, km, grow, seed + 5., len), smoothstep(.2, .8, f));
}
// kMF scales how far moonlight lifts a sparse surface to the full hatch (a shader sets it below 1 for flat sand before calling kScratch)
float kMF = 1.;
// Wind ripples on flat sand: short broken dashes along wavy crests that run across the wind, in small lens-shaped patches
// with feathered edges, close to the eye only (further off a stroke across the view is foreshortened into a long ruled
// line). p = world xz, dens = share of the dashes kept (0..1).
float kRipple(vec2 p, float dens){
  float rh = p.y + .24 * sin(p.x * 1.5 + 2.1 * sin(p.y * .37)) + .12 * sin(p.x * .53 + p.y * 1.3);
  float rw = max(length(vec2(dFdx(rh), dFdy(rh))), 1e-6);
  float rL = max(log2(10. * uPx * rw / .12), 0.); float ro = floor(rL); float rS = .12 * exp2(ro);
  return mix(kPat(rh, p.x, rS, rw, dens, 0., 0., 3.7, 1.9), kPat(rh, p.x, rS * 2., rw, dens, 0., 0., 8.7, 1.9), smoothstep(.2, .8, rL - ro));
}
// where the ripples lie: patches a few metres across, densest at their middles, a quarter of the sand
float kRipMask(vec2 p, vec2 ph){
  float m = sin(p.x * .47 + 1.3 * sin(p.y * .21 + ph.x)) * sin(p.y * .33 + 1.1 * sin(p.x * .29 + ph.y));
  return smoothstep(-.02, .85, m);
}
// the flat sand's own strokes run down the street with the wind, a little aslant (x = across them, y = along them): seen
// from low over the ground they are short ticks near the eye and dots further off, never long ruled lines
vec2 kFlatHatch(vec2 p){
  float fa = p.x * .24 + p.y * .97;
  return vec2(.32 * (p.x * .97 - p.y * .24) + .04 * sin(fa * 1.1 + 1.7 * sin(p.x * .6)), fa);
}
// the whole scratch shade. hatch = (h, a, h2, a2), surf = (pale, toneScale, diamonds, seed), S0 base spacing (m),
// len = stroke length in spacings. Returns ink coverage 0..1.
float kScratch(vec4 hatch, vec4 surf, vec3 wp, vec3 N, vec3 V, float localY, float S0, float len){
  float ndv = dot(N, V);
  float nm = dot(N, uMoonDir);
  float rev = clamp((localY - uPlane) / uSoft, 0., 1.);
  float dist = length(cameraPosition - wp);
  float far = 1. - .7 * smoothstep(uFar.x, uFar.y, dist);
  float sfar = 1. - smoothstep(uStarFar.x, uStarFar.y, dist);      // starlight cannot draw what is far off: it stays a black shape until the moon
  float up = smoothstep(.1, .55, N.y);
  float Ls = uStar * up * (1. + .6 * surf.x) * surf.y * sfar;
  float Lm = (2. * smoothstep(-.06, .1, nm) + smoothstep(.42, .62, nm)) * uMoonLvl;
  float osd = kOwlSd(wp), osh = 1. - smoothstep(-.25, .05, osd), lit0 = step(1., Lm);
  Lm = mix(Lm, 0., osh);
  // moonlight is the full hatch whatever the surface's starlight tone (bare markings stay bare)
  Lm = (Lm + surf.x * smoothstep(.4, 1., Lm)) * mix(surf.y, max(surf.y, 1.), uMoonFull * kMF * smoothstep(.03, .25, surf.y));
  // round our own shadow the ground keeps every stroke, so the owl-shaped gap reads on the sparsest floor
  Lm = mix(Lm, max(Lm, 1.5), (1. - smoothstep(.08, .75, osd)) * (1. - osh) * lit0);
  float grow = rev * 1.25;
  float guard = smoothstep(.08, .3, ndv);
  float ks = kFrac(Ls) * far * (1. - osh), km = kFrac(Lm) * far * step(.001, rev);      // our shadow is a bare black gap: not even starlight strokes
  float ink = kSet(hatch.x, hatch.y, S0, ks, km, grow, surf.w, len) * guard;
  float k2 = clamp(Lm - 2., 0., 1.) * far * step(.001, rev);
  ink = max(ink, kSet(hatch.z, hatch.w, S0 * 1.15, 0., k2, grow, surf.w + 11., len * .8) * guard);
  // diamond bark plates
  vec2 u = vec2(hatch.x + hatch.y * .5, hatch.x - hatch.y * .5) / .26;
  vec2 wv = max(vec2(length(vec2(dFdx(u.x), dFdy(u.x))), length(vec2(dFdx(u.y), dFdy(u.y)))), vec2(1e-6));
  if (surf.z > .01) {
    vec2 k = floor(u + .5); vec2 dd = abs(u - k) / wv;
    vec2 cu = floor(u.yx);
    float r1 = kh(vec2(k.x + surf.w * 3., cu.x)), r2 = kh(vec2(k.y + 71. + surf.w * 3., cu.y));
    vec2 tt = fract(u.yx);
    float l1 = (1. - smoothstep(uPx * .7 - .5, uPx * .7 + .6, dd.x)) * step(r1, .62) * (1. - smoothstep(grow - .1, grow, tt.x));
    float l2 = (1. - smoothstep(uPx * .7 - .5, uPx * .7 + .6, dd.y)) * step(r2, .62) * (1. - smoothstep(grow - .1, grow, tt.y));
    float fine = 1. - smoothstep(.1, .22, max(wv.x, wv.y));
    float lit = max(smoothstep(-.1, .2, nm) * step(.001, rev) * uMoonLvl, .35 * uStar * up * sfar);
    ink = max(ink, max(l1, l2) * fine * guard * surf.z * step(.3, lit) * mix(.0, 1., lit) * (1. - osh));
  }
  // contour
  float gw = max(length(vec2(dFdx(ndv), dFdy(ndv))), 1e-5);
  float rim = 1. - smoothstep(uPx * 1.25, uPx * 1.25 + 1.3, ndv / gw);
  float rimGate = max(uStar * sfar * smoothstep(.15, .45, N.y) * min(surf.y, 1.), smoothstep(-.02, .16, nm) * smoothstep(0., .5, rev) * uMoonLvl);
  ink = max(ink, rim * rimGate * (1. - osh));
  return clamp(ink, 0., 1.);
}
`;

export const SURF_VERT = /* glsl */`
attribute vec4 aHatch; attribute vec4 aSurf;
varying vec4 vHatch; varying vec4 vSurf; varying vec3 vWPos; varying vec3 vWN; varying float vLY;
uniform mat4 uInvHero; uniform vec4 uTilt, uTiltX; uniform vec3 uHill;
#include <common>
#include <fog_pars_vertex>
void main(){
  vHatch = aHatch; vSurf = aSurf;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vec3 lp = (uInvHero * wp).xyz;
  vWPos = wp.xyz; vLY = lp.y + uTilt.x * (clamp(lp.z, uTilt.z, uTilt.w) - uTilt.y) + smoothstep(uTiltX.w, uTiltX.w + 16., lp.z) * (uTiltX.x * (lp.z - uTiltX.y) + uTiltX.z * lp.x) + (1. - smoothstep(uTiltX.w, uTiltX.w + 16., lp.z)) * (uHill.x * lp.x + uHill.y * (lp.z - 100.) + uHill.z);
  vWN = mat3(modelMatrix) * normal;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

export const SURF_FRAG = /* glsl */`
varying vec4 vHatch; varying vec4 vSurf; varying vec3 vWPos; varying vec3 vWN; varying float vLY;
uniform float uS0, uLen, uNearTone;
#include <common>
#include <fog_pars_fragment>
${SCRATCH_GLSL}
void main(){
  vec3 N = vWN / max(length(vWN), 1e-5);
  vec3 Vv = cameraPosition - vWPos; vec3 V = Vv / max(length(Vv), 1e-5);
  vec4 sf = vSurf; sf.y *= 1. + uNearTone * (1. - smoothstep(5., 30., length(Vv)));      // ground earns more strokes close to the eye
  float ink = kScratch(vHatch, sf, vWPos, N, V, vLY, uS0, uLen);
  gl_FragColor = vec4(vec3(uInk * ink), 1.);
  #include <fog_fragment>
}`;

// The hill's skin. Its strokes are contours of the smooth dome of the hill (no boulder noise, no saddle, no carved
// corridor), worked out per pixel from the local position, so they run as long unbroken curves round the hill
// whatever the ground mesh does: nothing of the mesh shows in the drawing. On the flat sand the same coordinate
// falls back to the street's slanted strokes. uDome = (lobe amplitude, lobe phase, second phase, extra bareness).
export const GROUND_VERT = /* glsl */`
attribute vec4 aSurf;
varying vec4 vSurf; varying vec3 vWPos; varying vec3 vWN; varying float vLY; varying vec3 vLP;
uniform mat4 uInvHero; uniform vec4 uTilt, uTiltX; uniform vec3 uHill;
#include <common>
#include <fog_pars_vertex>
void main(){
  vSurf = aSurf;
  vec4 wp = modelMatrix * vec4(position, 1.);
  vec3 lp = (uInvHero * wp).xyz; vLP = lp;
  vWPos = wp.xyz; vLY = lp.y + uTilt.x * (clamp(lp.z, uTilt.z, uTilt.w) - uTilt.y) + smoothstep(uTiltX.w, uTiltX.w + 16., lp.z) * (uTiltX.x * (lp.z - uTiltX.y) + uTiltX.z * lp.x) + (1. - smoothstep(uTiltX.w, uTiltX.w + 16., lp.z)) * (uHill.x * lp.x + uHill.y * (lp.z - 100.) + uHill.z);
  vWN = mat3(modelMatrix) * normal;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
export const GROUND_FRAG = /* glsl */`
varying vec4 vSurf; varying vec3 vWPos; varying vec3 vWN; varying float vLY; varying vec3 vLP;
uniform float uS0, uLen, uNearTone, uFlatMF; uniform vec4 uDome; uniform vec4 uRip; uniform vec2 uRipPh;
#include <common>
#include <fog_pars_fragment>
${SCRATCH_GLSL}
void main(){
  vec3 N = vWN / max(length(vWN), 1e-5);
  vec3 Vv = cameraPosition - vWPos; vec3 V = Vv / max(length(Vv), 1e-5);
  vec2 q = vLP.xz - vec2(3., -20.);
  vec2 sc = vec2(mix(66., 62., smoothstep(-10., 10., q.x)), mix(44., 116., smoothstep(-12., 12., q.y)));
  float d = length(q / sc);
  float ang = atan(q.x, abs(q.y) < 1e-4 ? 1e-4 : q.y);                  // seam due south, behind the notch
  float ss = smoothstep(.2, .7, d);
  d *= 1. + uDome.x * sin(ang * 3. + uDome.y) * ss + .045 * sin(ang * 5. + uDome.z) * ss;
  float hd = 21.6 * (1. - pow(max(d, 1e-4), 1.2));
  hd = .5 * (hd + sqrt(hd * hd + 1.));                                  // the foot of the hill is a soft bend, not a crease
  hd += .45 * sin(vLP.x * .043 + uDome.y) * sin(vLP.z * .037 + uDome.z);
  float along = ang * 46. + .35 * (-vLP.x * .83 + vLP.z * .55);
  // on the flat sand round the hill the strokes turn to run down the street, as the street's own do, and moonlight lifts them less (uFlatMF)
  float fl = uRip.w * (1. - smoothstep(.5, 2.2, hd)); vec2 fh = kFlatHatch(vLP.xz);
  vec4 hatch = vec4(mix(hd * 2.5 + .32 * (vLP.x * .55 + vLP.z * .83), fh.x, fl), mix(along, fh.y, fl), hd * 1.9 + .3 * (vLP.x * .9 - vLP.z * .42), vLP.x * .42 + vLP.z * .9);
  vec4 sf = vSurf; sf.x -= (uDome.w + .12) * smoothstep(.7, 2.5, hd);
  sf.y *= 1. + uNearTone * (1. - smoothstep(5., 30., length(Vv)));      // ground earns more strokes close to the eye
  kMF = mix(1., uFlatMF, fl);
  float ink = kScratch(hatch, sf, vWPos, N, V, vLY, uS0, hd > 1.6 ? uLen : 4.);      // long contour strokes on the hill, the street's short ones on the sand
  float lit = smoothstep(0., .5, (vLY - uPlane) / uSoft) * uMoonLvl;
  float rip = kRipple(vLP.xz, mix(uRip.x, uRip.y, lit) * kRipMask(vLP.xz, uRipPh) * fl * step(.03, sf.y));
  ink = max(ink, rip * (1. - smoothstep(uRip.z * .55, uRip.z, length(Vv))) * smoothstep(.1, .3, dot(N, V)) * (1. - kOwlShadow(vWPos)));
  gl_FragColor = vec4(vec3(uInk * ink), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------------------
// Ribbons: one lance-shaped stroke per leaf, flower spike and grass blade.
// aRib = (t along 0..1, side -1|0|1, hash, pale), aRib2 = (width m, phase, thinning hash, wind amplitude)
const RIB_VERT = /* glsl */`
attribute vec3 aRoot, aAxis, aNrm; attribute vec4 aRib, aRib2;
uniform vec2 uView; uniform vec3 uWindW; uniform float uThin, uGust; uniform mat4 uInvHero;
#include <common>
#include <fog_pars_vertex>
${SCRATCH_COMMON}
float kGust(vec2 xz, float t){
  float g = sin((xz.y + 6. * t) * .11 + sin(xz.x * .05) * 1.7) * .5 + .5;
  return g * (.6 + .4 * sin((xz.y + 6. * t) * .31 + xz.x * .13));
}
void main(){
  vec4 wr4 = modelMatrix * vec4(aRoot, 1.); vec3 wr = wr4.xyz;
  vec3 wP = (modelMatrix * vec4(position, 1.)).xyz;
  vec3 ax = mat3(modelMatrix) * aAxis;
  vec3 lr = (uInvHero * wr4).xyz;
  float t = aRib.x;
  float g = kGust(lr.xz, uTime);
  float sway = (g * .75 + .12 * sin(uTime * (2. + aRib2.y * 3.) + aRib2.y * 40.)) * aRib2.w * uGust;
  float L = length(ax);
  wP += uWindW * (sway * t * t * L); wP.y -= sway * sway * t * t * L * .35;
  vec3 n = mat3(modelMatrix) * aNrm; n /= max(length(n), 1e-5);
  float nm = dot(n, uMoonDir);
  float rev = clamp((kEff(lr) - uPlane) / uSoft, 0., 1.);
  float dist = length(cameraPosition - wr);
  float thin = min(1., uThin * uThin / max(dist * dist, 1.));
  float keepT = 1. - smoothstep(thin * .8, thin * 1.2, aRib2.z * .8);
  float ls = uStar * (.2 + .25 * aRib.w) * smoothstep(-.2, .6, n.y) * (1. - smoothstep(uStarFar.x, uStarFar.y, dist));
  float lm = (.22 + .78 * smoothstep(-.25, .35, nm)) * uMoonLvl;
  float grow = max(step(aRib.z, ls), step(aRib.z, lm) * rev) * keepT * (1. - kOwlShadow(wr));      // nothing is drawn inside our own shadow
  wP = mix(wr, wP, grow);
  vec4 mvPosition = viewMatrix * vec4(wP, 1.);
  vec4 c0 = projectionMatrix * mvPosition;
  vec4 c1 = projectionMatrix * viewMatrix * vec4(wP + ax * .25, 1.);
  vec2 s0 = c0.xy / max(abs(c0.w), 1e-4), s1 = c1.xy / max(abs(c1.w), 1e-4);
  vec2 d = (s1 - s0) * uView; float dl = length(d); d = dl > 1e-4 ? d / dl : vec2(1., 0.);
  float pxPerM = projectionMatrix[1][1] * uView.y * .5 / max(c0.w, .05);
  float hw = max(aRib2.x * .5 * pxPerM, .7 * uPx) * aRib.y;
  c0.xy += vec2(-d.y, d.x) * hw * 2. / uView * c0.w;
  if (grow < .02) c0 = vec4(2., 2., 2., 1.);
  gl_Position = c0;
  #include <fog_vertex>
}`;
export const RIB_FRAG = /* glsl */`
uniform float uInk;
#include <common>
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(vec3(uInk), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------------------
// Sky: stipple on a cube-face grid in three sizes, kept where a hash is below the Milky Way density.
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; p.z = p.w * .99995; gl_Position = p; }`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
uniform float uTime, uPx, uPixA, uInk, uSkyDim, uMeteor, uDawn, uMetW, uMetTail, uFoot, uBg;
uniform vec3 uMwA, uMwB, uMwN, uCoal, uLmc, uSmc, uMetA, uMetB, uDawnDir;
float h3(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float dens(vec3 d){
  float lat = asin(clamp(dot(d, uMwN), -1., 1.));
  float lon = atan(dot(d, uMwB), dot(d, uMwA) + 1e-5);
  float n = vn(d * 7.) * .6 + vn(d * 19.) * .4;
  float core = exp(-lat * lat / .022), halo = exp(-lat * lat / .2);
  float l1 = (lon - .85) / .7;
  float b = (core * (.3 + 1.1 * n * n) + halo * .13) * (.7 + .6 * exp(-l1 * l1) + uFoot * exp(-lon * lon / .09));      // uFoot: the column stands densest on the horizon
  // the Coalsack: a ragged patch where the stipple thins to a third (a clean round hole read as a blot on the sky)
  float cs = 1. - smoothstep(.015, .1, length(d - uCoal) * (.5 + 1.3 * vn(d * 13.)));
  b *= 1. - .66 * cs;
  float rift = (1. - smoothstep(.012, .05, abs(lat - .04 * sin(lon * 4.2) - .012))) * smoothstep(.8, 1., lon) * (1. - smoothstep(2.2, 2.7, lon));
  b *= 1. - .93 * rift;
  vec3 a = d - uLmc, c = d - uSmc;
  b += .75 * exp(-dot(a, a) / .0035) + .65 * exp(-dot(c, c) / .0014);
  return (.016 * uBg + b * mix(.75, 1., uBg)) * uSkyDim;
}
float layer(vec3 d, float N, float rad, float mul, float seed){
  vec3 a = abs(d); vec2 uv; float face; float sg;
  if (a.x >= a.y && a.x >= a.z) { uv = d.yz / max(a.x, 1e-5); sg = d.x > 0. ? 1. : -1.; face = 0.; }
  else if (a.y >= a.z) { uv = d.xz / max(a.y, 1e-5); sg = d.y > 0. ? 1. : -1.; face = 1.; }
  else { uv = d.xy / max(a.z, 1e-5); sg = d.z > 0. ? 1. : -1.; face = 2.; }
  vec2 g = uv * N * .5; vec2 c = floor(g);
  float fs = face * 7. + sg * 2. + seed;
  float r1 = h3(vec3(c, fs)), r2 = h3(vec3(c.yx + 13.7, fs + 1.)), r3 = h3(vec3(c + 29.3, fs + 2.));
  vec2 cuv = (c + .5 + (vec2(r1, r2) - .5) * .78) / (N * .5);
  vec3 cd = face < .5 ? vec3(sg, cuv.x, cuv.y) : (face < 1.5 ? vec3(cuv.x, sg, cuv.y) : vec3(cuv.x, cuv.y, sg));
  cd = normalize(cd);
  float rr = rad * uPx * uPixA * (.78 + .38 * sin(uTime * (.5 + r3 * 1.3) + r3 * 40.));
  float keep = step(fract(r3 * 7.13 + r1), dens(cd) * mul);
  return keep * (1. - smoothstep(rr - .5 * uPixA, rr + .5 * uPixA, length(d - cd)));
}
void main(){
  vec3 d = normalize(vDir);
  float s = max(layer(d, 54., 1.5, .2, 1.), max(layer(d, 104., 1.05, .5, 5.), layer(d, 200., .76, 1., 9.)));
  s *= smoothstep(-.012, .004, d.y);
  float col = s * uInk;
  // first light (dawn variation): stacked horizontal lines up the eastern sky
  if (uDawn > .001) {
    float az = max(dot(normalize(vec3(d.x, 0., d.z) + vec3(1e-5, 0., 0.)), uDawnDir), 0.);
    float top = uDawn * (.1 + .45 * az * az);
    float el = asin(clamp(d.y, -1., 1.));
    float q = el / (9. * uPx * uPixA); float k = floor(q + .5);
    float ln = 1. - smoothstep(.6 * uPx * uPixA, 1.2 * uPx * uPixA, abs(q - k) * 9. * uPx * uPixA);
    float keep = step(h3(vec3(k, floor(atan(d.x, d.z + 1e-5) * 9. + k * 3.7), 3.)), .8) * step(0., el) * (1. - smoothstep(top * .6, top, el));
    col = max(col * (1. - .8 * uDawn * step(el, top)), ln * keep * uInk);
  }
  if (uMeteor > 0. && uMeteor < 1.) {
    float cab = clamp(dot(uMetA, uMetB), -.999, .999), th = acos(cab);
    vec3 e2 = (uMetB - uMetA * cab) / sqrt(1. - cab * cab);
    float t = clamp(atan(dot(d, e2), max(dot(d, uMetA), 1e-4)) / th, 0., 1.);
    float dd = length(d - (uMetA * cos(t * th) + e2 * sin(t * th)));
    float head = uMeteor * 1.45, tail = head - uMetTail;
    float al = smoothstep(tail, head, t) * step(t, head) * (1. - smoothstep(.75, 1., uMeteor));
    float wpx = uPx * uPixA * (.2 + 1.1 * al) * uMetW;
    col = max(col, (1. - smoothstep(wpx - .5 * uPixA, wpx + .5 * uPixA, dd)) * step(.02, al) * (uInk + .6 * smoothstep(.9, 1., al)));
  }
  gl_FragColor = vec4(vec3(col), 1.);
}`;
// the sixty bright stars: four-point crosses and fat dots, sized in design pixels
const STAR_VERT = /* glsl */`
attribute vec2 aCorner; attribute vec4 aStar;
uniform vec2 uView; uniform float uPx, uTime, uStarDim;
varying vec2 vUv; varying float vKind; varying float vPx;
void main(){
  vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.); if (abs(c.w) < 1e-4) c.w = 1e-4; c.z = c.w * .9999;
  float sz = aStar.x * uPx * (.8 + .3 * sin(uTime * aStar.z * 1.6 + aStar.y)) * mix(1., uStarDim, step(aStar.w, 1.5) * step(aStar.x, 5.5));
  c.xy += aCorner * sz * 2. / uView * c.w;
  if (normalize(position).y < -.005 || sz < .3) c = vec4(2., 2., 2., 1.);
  vUv = aCorner; vKind = aStar.w; vPx = sz;
  gl_Position = c;
}`;
const STAR_FRAG = /* glsl */`
uniform float uInk; varying vec2 vUv; varying float vKind; varying float vPx;
void main(){
  vec2 a = abs(vUv); float aa = 1.2 / max(vPx, 1.);
  float core = 1. - smoothstep(.2 - aa, .2 + aa, length(a));
  float arm = max(1. - smoothstep(-aa, aa, a.y - .11 * (1. - a.x)), 1. - smoothstep(-aa, aa, a.x - .11 * (1. - a.y)));
  arm *= step(max(a.x, a.y), .98);
  float dotm = 1. - smoothstep(.42 - aa, .42 + aa, length(a));
  float m = vKind > .5 ? max(core, arm) : dotm;
  if (m < .02) discard;
  gl_FragColor = vec4(vec3(uInk * m), 1.);
}`;

// ------------------------------------------------------------------------------------------------------------
// Bats: looping through the notch on tilted ellipses, jinking, wings beating; all in the vertex shader.
// aBat = (phase, side * rx, rz, seed), aWing = (x along span, z along the body, unused)
const BAT_VERT = /* glsl */`
attribute vec4 aBat; attribute vec3 aWing;
uniform float uTime, uPx, uPixA; uniform vec3 uNotch;
#include <common>
#include <fog_pars_vertex>
vec3 batPos(float th, float sd){
  float rx = aBat.y, rz = aBat.z;
  vec3 p = uNotch + vec3(rx * (1. - cos(th)), 0., rz * sin(th));
  p.y += 6.5 + sd * 4.5 + (5. + sd * 12.) * (.5 - .5 * cos(th)) + 1.5 * sin(th * 3. + sd * 20.);      // over the top of the portal's disc, never across its centre
  p.x += (sd - .5) * 6. * cos(th);
  return p;
}
void main(){
  float sd = aBat.w;
  float sp = (11. + sd * 5.) / max(.5 * (abs(aBat.y) + aBat.z), 4.);
  float th = aBat.x + uTime * sp;
  vec3 p = batPos(th, sd), p2 = batPos(th + .03, sd);
  vec3 jk = vec3(sin(uTime * 5.3 + sd * 20.), sin(uTime * 7.1 + sd * 31.) * .7, sin(uTime * 4.1 + sd * 11.)) * .55;
  vec3 fw = p2 - p; fw /= max(length(fw), 1e-4);
  vec3 rt = cross(fw, vec3(0., 1., 0.)); rt /= max(length(rt), 1e-4);
  vec3 up = cross(rt, fw);
  float ph = sin(uTime * (13. + sd * 5.) + sd * 60.);
  float ang = ph * .95 * min(abs(aWing.x) * 4., 1.) + .15;
  float ax = abs(aWing.x);
  vec3 l = vec3(sign(aWing.x) * ax * cos(ang), ax * sin(ang), aWing.y);
  vec3 c = (modelMatrix * vec4(p + jk, 1.)).xyz;
  float dist = length(cameraPosition - c);
  float sc = max(1., dist * uPixA * uPx * 20. / .8);      // never under twenty design pixels across: a bat is a shape with two wings, not a tick
  vec3 wp = c + mat3(modelMatrix) * (rt * l.x + up * l.y + fw * l.z) * sc;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BAT_FRAG = /* glsl */`
uniform float uInk;
#include <common>
#include <fog_pars_fragment>
void main(){
  gl_FragColor = vec4(vec3(uInk), 1.);
  #include <fog_fragment>
}`;

// ------------------------------------------------------------------------------------------------------------
// geometry helpers
export class Surf {                      // accumulates a scratch surface: position, normal, aHatch, aSurf, index
  constructor() { this.p = []; this.n = []; this.h = []; this.s = []; this.i = []; this.count = 0; }
  v(x, y, z, nx, ny, nz, h, a, h2, a2, pale, tone, dia, seed) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.h.push(h, a, h2, a2); this.s.push(pale, tone, dia, seed);
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aHatch', new THREE.Float32BufferAttribute(this.h, 4));
    g.setAttribute('aSurf', new THREE.Float32BufferAttribute(this.s, 4));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
}
export class Ribs {                      // accumulates lance strokes
  constructor() { this.p = []; this.r = []; this.a = []; this.n = []; this.d = []; this.e = []; this.i = []; this.count = 0; }
  // root, tip, sideways bow (vec3 added at the middle), width (m), lighting normal, pale, wind amplitude, rng
  lance(rx, ry, rz, tx, ty, tz, bx, by, bz, width, nx, ny, nz, pale, wind, rng, mid = 0.42) {
    const ax = tx - rx, ay = ty - ry, az = tz - rz;
    const mx = rx + ax * mid + bx, my = ry + ay * mid + by, mz = rz + az * mid + bz;
    const h = rng(), h2 = rng(), ph = rng(), b = this.count;
    const put = (x, y, z, t, side) => {
      this.p.push(x, y, z); this.r.push(rx, ry, rz); this.a.push(ax, ay, az); this.n.push(nx, ny, nz);
      this.d.push(t, side, h, pale); this.e.push(width, ph, h2, wind); this.count++;
    };
    put(rx, ry, rz, 0, 0); put(mx, my, mz, mid, -1); put(mx, my, mz, mid, 1); put(tx, ty, tz, 1, 0);
    this.i.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('aRoot', new THREE.Float32BufferAttribute(this.r, 3));
    g.setAttribute('aAxis', new THREE.Float32BufferAttribute(this.a, 3));
    g.setAttribute('aNrm', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('aRib', new THREE.Float32BufferAttribute(this.d, 4));
    g.setAttribute('aRib2', new THREE.Float32BufferAttribute(this.e, 4));
    g.setIndex(new THREE.Uint32BufferAttribute(this.i, 1));
    return g;
  }
}
// unit icosphere templates (indexed, unique vertices) by subdivision
const _ico = new Map();
export function icoTemplate(detail) {
  if (_ico.has(detail)) return _ico.get(detail);
  const g = new THREE.IcosahedronGeometry(1, detail);
  const src = g.getAttribute('position'), map = new Map(), pos = [], idx = [];
  for (let i = 0; i < src.count; i++) {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const key = Math.round(x * 4096) + '_' + Math.round(y * 4096) + '_' + Math.round(z * 4096);
    let j = map.get(key);
    if (j === undefined) { j = pos.length / 3; map.set(key, j); pos.push(x, y, z); }
    idx.push(j);
  }
  g.dispose();
  const t = { pos: new Float32Array(pos), idx: new Uint16Array(idx), n: pos.length / 3 };
  _ico.set(detail, t);
  return t;
}
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// a small generator of its own for set pieces, so that adding one never moves anything drawn from the main one
function localRng(seed) {
  let a = seed >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  return r;
}

// one unique boulder into the surface builder; returns its highest point
function addBoulder(S, noise, rng, cx, cy, cz, r, detail, sq) {
  const T = icoTemplate(detail), n = T.n;
  const sx = r * rng.range(0.92, 1.14), sy = r * sq, sz = r * rng.range(0.92, 1.14);
  const yaw = rng() * TAU, cw = Math.cos(yaw), sw = Math.sin(yaw);
  const ox = rng() * 60, oy = rng() * 60, seed = rng() * 40;
  const ta = rng() * TAU, tt = rng.range(0.05, 0.42);
  const A = new THREE.Vector3(Math.sin(tt) * Math.cos(ta), Math.cos(tt), Math.sin(tt) * Math.sin(ta));
  const E1 = new THREE.Vector3(-1, 0, 0.7); E1.addScaledVector(A, -E1.dot(A)).normalize();
  const E2 = new THREE.Vector3().crossVectors(A, E1);
  const c65 = Math.cos(65 * DEG), s65 = Math.sin(65 * DEG);
  const A2 = new THREE.Vector3().copy(A).multiplyScalar(c65).addScaledVector(E2, s65);
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3);
  let top = -1e9, ti = 0;
  for (let i = 0; i < n; i++) {
    const dx = T.pos[i * 3], dy = T.pos[i * 3 + 1], dz = T.pos[i * 3 + 2];
    let k = 1 + 0.17 * noise.n3(dx * 1.1 + ox, dy * 1.1 + oy, dz * 1.1) + 0.055 * noise.n3(dx * 3.1 + oy, dy * 3.1, dz * 3.1 + ox);
    if (detail > 4) k += 0.018 * noise.n3(dx * 8 + ox, dy * 8, dz * 8 + oy);
    const x = dx * k * sx, y = (dy < 0 ? dy * 0.8 : dy) * k * sy, z = dz * k * sz;
    P[i * 3] = x * cw + z * sw; P[i * 3 + 1] = y; P[i * 3 + 2] = -x * sw + z * cw;
    if (y > top) { top = y; ti = i; }
  }
  const ix = T.idx;
  for (let f = 0; f < ix.length; f += 3) {
    const a = ix[f] * 3, b = ix[f + 1] * 3, c = ix[f + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[c] - P[a], vy = P[c + 1] - P[a + 1], vz = P[c + 2] - P[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    N[a] += nx; N[a + 1] += ny; N[a + 2] += nz; N[b] += nx; N[b + 1] += ny; N[b + 2] += nz; N[c] += nx; N[c + 1] += ny; N[c + 2] += nz;
  }
  const base = S.count;
  for (let i = 0; i < n; i++) {
    const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2];
    let nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2]; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const h = x * A.x + y * A.y + z * A.z + r * 1.3;
    const ang = Math.atan2(x * E2.x + y * E2.y + z * E2.z, x * E1.x + y * E1.y + z * E1.z);
    const h2 = x * A2.x + y * A2.y + z * A2.z + r * 1.3;
    const a2 = x * E1.x + y * E1.y + z * E1.z + r * 1.3;
    S.v(cx + x, cy + y, cz + z, nx, ny, nz, h, ang * r * 0.8, h2, a2, 0, 1, 0, seed);
  }
  for (let f = 0; f < ix.length; f += 3) S.tri(base + ix[f], base + ix[f + 1], base + ix[f + 2]);
  return { top: cy + top, tx: cx + P[ti * 3], tz: cz + P[ti * 3 + 2] };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('quiver-koppie') : ctx.rng;
  const noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const pal = opts.palette || ['#000000', '#FFFFFF', '#F2F2F2', '#B4B4B4', '#6A6A6A'];
  const inkV = INK * new THREE.Color(pal[1]).r;
  const hour = opts.hour || 'night', season = opts.season || 'winter', weather = opts.weather || 'clear';
  const moonFrom = opts.moonFrom ?? 0.5, moonTo = opts.moonTo ?? 0.72;
  const root = new THREE.Group(); root.name = 'quiver-koppie';

  // ---------------------------------------------------------------- the fly-through and the hill under it
  const SADDLE_Y = 21, PORTAL_R = 4.5;
  const seat = new THREE.Vector3(0, SADDLE_Y + PORTAL_R, -20);
  const fdir = new THREE.Vector3(Math.sin(10 * DEG) * Math.cos(6 * DEG), Math.sin(6 * DEG), -Math.cos(10 * DEG) * Math.cos(6 * DEG));
  const E = seat.clone().addScaledVector(fdir, -60);
  const flyThrough = [
    new THREE.Vector3(-2, 2.5, 190), new THREE.Vector3(-4, 2.5, 155), new THREE.Vector3(-8, 2.2, 124),
    new THREE.Vector3(-14, 3.5, 99), new THREE.Vector3(-16.5, 8.4, 76), new THREE.Vector3(-14.3, 13.8, 57),
    E, seat.clone().addScaledVector(fdir, -30), seat.clone(),
  ];
  const beyond = seat.clone().addScaledVector(fdir, 60);
  // dense samples (x, y, z, clearance) for clamping the ground and keeping solids away
  const PS = [];
  {
    const pts = flyThrough.concat([seat.clone().addScaledVector(fdir, 26)]);
    let total = 0; for (let i = 0; i < flyThrough.length - 1; i++) total += flyThrough[i].distanceTo(flyThrough[i + 1]);
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = a.distanceTo(b), n = Math.ceil(L / 2);
      for (let j = 0; j < n; j++) {
        const t = j / n, toEnd = Math.abs(total - (run + L * t));
        PS.push(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t, 4.5 + 2 * sstep(4, 24, toEnd));
      }
      run += L;
    }
  }
  const pathDist = (x, y, z) => {
    let best = 1e18;
    for (let i = 0; i < PS.length; i += 4) { const dx = PS[i] - x, dy = PS[i + 1] - y, dz = PS[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  };
  const ph1 = rng() * TAU, ph2 = rng() * TAU, nOff = rng() * 100, lob = rng.range(0.05, 0.09);
  const heightAt = (x, z) => {
    const dx = x - 3, dz = z + 20;
    let d = Math.hypot(dx / (dx < 0 ? 66 : 62), dz / (dz > 0 ? 116 : 44));
    const ang = Math.atan2(dz, dx);
    d *= 1 + lob * Math.sin(ang * 3 + ph1) * sstep(0.2, 0.7, d) + 0.045 * Math.sin(ang * 5 + ph2) * sstep(0.2, 0.7, d);
    d += 0.05 * noise.n2(x * 0.021 + nOff, z * 0.021);
    if (d >= 1) return 0;
    let h = 21.6 * (1 - Math.pow(Math.max(d, 0), 1.2));
    h += 0.7 * noise.fbm2(x * 0.07 + nOff, z * 0.07, 3) * sstep(0, 5, h);
    const ds = Math.hypot(x, z + 20);
    h = h + (SADDLE_Y - h) * sstep(11, 5, ds);
    // keep the camera corridor free
    let lim = 1e9;
    for (let i = 0; i < PS.length; i += 4) {
      const ddx = PS[i] - x, ddz = PS[i + 2] - z, q = ddx * ddx + ddz * ddz;
      if (q < 900) { const dq = Math.max(0, Math.sqrt(q) - 3), l = PS[i + 1] - PS[i + 3] + 0.05 * dq * dq; if (l < lim) lim = l; }
    }
    return Math.max(0, Math.min(h, Math.max(0, lim)));
  };

  // ---------------------------------------------------------------- ground: hill skin and sand apron
  const APRON = 210, GC = 14;        // apron radius, z of the ground grid centre
  let groundS = null;
  {
    const S = new Surf(), NR = 46, NA = 104, hs = new Float32Array((NR + 1) * NA);
    const rad = (i) => { const t = i / NR; return t < 0.72 ? 100 * (t / 0.72) : 100 + (APRON - 100) * Math.pow((t - 0.72) / 0.28, 1.6); };
    for (let i = 0; i <= NR; i++) {
      for (let j = 0; j < NA; j++) { const a = (j / NA) * TAU, r = rad(i); hs[i * NA + j] = heightAt(Math.sin(a) * r, GC + Math.cos(a) * r); }
      if ((i & 3) === 3) await ctx.yield();
    }
    await ctx.yield();
    const gseed = rng() * 30;
    for (let i = 0; i <= NR; i++) for (let j = 0; j < NA; j++) {
      const a = (j / NA) * TAU, r = rad(i), x = Math.sin(a) * r, z = GC + Math.cos(a) * r, y = hs[i * NA + j];
      let nx = 0, ny = 1, nz = 0;
      if (i > 0) {
        const i0 = i - 1, i1 = Math.min(NR, i + 1), jm = (j + NA - 1) % NA, jp = (j + 1) % NA, r0 = rad(i0), r1 = rad(i1);
        const rx = Math.sin(a) * (r1 - r0), ry = hs[i1 * NA + j] - hs[i0 * NA + j], rz = Math.cos(a) * (r1 - r0);
        const am = (jm / NA) * TAU, ap = (jp / NA) * TAU;
        const tx = (Math.sin(ap) - Math.sin(am)) * r, ty = hs[i * NA + jp] - hs[i * NA + jm], tz = (Math.cos(ap) - Math.cos(am)) * r;
        nx = ry * tz - rz * ty; ny = rz * tx - rx * tz; nz = rx * ty - ry * tx;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      }
      const onHill = sstep(0, 1.5, y);
      const flat = opts.apronTone ?? 0.17;
      const tone = flat + (0.92 - flat) * onHill - flat * sstep(opts.apronFade ? opts.apronFade[0] : 70, opts.apronFade ? opts.apronFade[1] : 150, r) * (1 - onHill);
      S.v(x, y, z, nx, ny, nz, y * 2.2 + 0.32 * (x * 0.55 + z * 0.83), -x * 0.83 + z * 0.55, y * 1.6 + 0.3 * (x * 0.9 - z * 0.42), x * 0.42 + z * 0.9, 0, Math.max(0, tone), 0, gseed);
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
      const j2 = (j + 1) % NA, a = i * NA + j, b = i * NA + j2, c = (i + 1) * NA + j, d = (i + 1) * NA + j2;
      S.tri(a, c, b); S.tri(b, c, d);
    }
    groundS = S;
  }
  await ctx.yield();

  // ---------------------------------------------------------------- boulders
  const boulders = [];       // { x, y, z, r, top }
  const BS = new Surf();
  const putBoulder = (x, y, z, r, det, sq, R = rng) => { const t = addBoulder(BS, noise, R, x, y, z, r, det, sq); const b = { x, y, z, r, top: t.top, tx: t.tx, tz: t.tz }; boulders.push(b); return b; };
  const stackTop = [];
  for (const sd of [-1, 1]) {      // the two stacks that make the notch
    const r0 = rng.range(3.0, 3.4), x0 = sd * (5.4 + r0 * 1.02);
    const b0 = putBoulder(x0, SADDLE_Y + r0 * 0.5, -20.5 + rng.range(-0.6, 0.6), r0, 7, 0.86);
    await ctx.yield();
    const r1 = rng.range(2.0, 2.5);
    putBoulder(x0 + sd * (r0 * 0.75), b0.top + r1 * 0.2, -22.5 + rng.range(-1, 1), r1, 7, 0.9);
    await ctx.yield();
    putBoulder(sd * (9.2 + rng.range(0, 1.2)), heightAt(sd * 10, -13.5) + 1.2, -13.6, rng.range(2.3, 2.8), 7, 0.82);
    await ctx.yield();
    putBoulder(sd * (8.6 + rng.range(0, 1.5)), heightAt(sd * 9, -27.5) + 1.1, -27.4, rng.range(2.4, 3.0), 7, 0.8);
    stackTop.push(new THREE.Vector3(x0, b0.top, b0.z));
    await ctx.yield();
  }
  await ctx.yield();
  const pathRight = [];             // big boulders 7-9 m to the right of the climb
  for (let k = 0; k < 8; k++) {
    const t = (k + rng.range(0.2, 0.8)) / 8, z = 96 - t * 66;
    let px = 0; { let best = 1e9; for (let i = 0; i < PS.length; i += 4) { const d = Math.abs(PS[i + 2] - z); if (d < best) { best = d; px = PS[i]; } } }
    const r = rng.range(1.7, 3.0), x = px + 7.4 + r + rng.range(0, 2.5), g = heightAt(x, z);
    if (pathDist(x, g + r * 0.5, z) < r * 1.15 + 6.6) continue;
    pathRight.push(putBoulder(x, g + r * 0.5, z, r, 5, rng.range(0.74, 0.92)));
    await ctx.yield();
  }
  await ctx.yield();
  {
    const want = Math.round((opts.boulders ?? 190) * (0.7 + 0.3 * detail)) - boulders.length;
    let placed = 0, tries = 0;
    while (placed < want && tries++ < 6000) {
      let x, z, g;
      if (placed < want - 14) {
        x = 3 + rng.range(-70, 68); z = -20 + rng.range(-46, 118); g = heightAt(x, z);
        if (g < 0.4 || rng() > 0.2 + 0.8 * Math.pow(g / 21, 0.6)) continue;
      } else {                       // a few strays on the sand at the foot
        const a = rng() * TAU, rr = rng.range(1.0, 1.16); x = 3 + Math.cos(a) * 66 * rr; z = -20 + Math.sin(a) * (Math.sin(a) > 0 ? 116 : 44) * rr; g = heightAt(x, z);
        if (g > 0.5) continue;
      }
      const u = rng(), r = 1.0 + 2.1 * u * u * (0.6 + 0.4 * sstep(0, 14, g)), sq = rng.range(0.7, 0.95);
      const y = g + r * sq * rng.range(0.3, 0.62);
      if (pathDist(x, y, z) < r * 1.2 + 6.6) continue;
      let ok = true;
      for (const b of boulders) { const dd = Math.hypot(b.x - x, b.y - y, b.z - z); if (dd < 0.62 * (b.r + r)) { ok = false; break; } }
      if (!ok) continue;
      const pd = pathDist(x, y, z), near = pd < 26, facing = z > 5 && pd < 75 && r > 1.5;      // the big ones that face the foot of the climb are rounder, so the cross-hatch bends round them
      const b = putBoulder(x, y, z, r, (near || facing) && r > 1.5 ? 4 : (r > 2.1 || near ? 3 : 2), sq);
      placed++;
      if (r > 1.8 && rng() < 0.45) {   // stacked: a smaller one riding on top
        const r2 = r * rng.range(0.5, 0.78), a = rng() * TAU, x2 = x + Math.cos(a) * r * 0.45, z2 = z + Math.sin(a) * r * 0.45, y2 = b.top + r2 * 0.45;
        if (pathDist(x2, y2, z2) > r2 * 1.2 + 6.6) { putBoulder(x2, y2, z2, r2, near ? 3 : 2, rng.range(0.75, 0.95)); placed++; }
      }
      if ((placed & 1) === 0) await ctx.yield();
    }
  }
  await ctx.yield();
  // At the foot of the climb three boulders lie close beside the path, where it leaves the sand; they draw from
  // their own generator so that nothing else on the hill moves.
  const srng = localRng(7919 + Math.floor(nOff * 1000));
  for (const [x, z, r] of [[-6.0, 92.5, 1.5], [-22.6, 88.5, 1.25], [-4.2, 83, 1.9]]) {
    const y = heightAt(x, z) + r * 0.42;
    if (pathDist(x, y, z) > r * 1.2 + 6.3) putBoulder(x, y, z, r, 5, 0.82, srng);
    await ctx.yield();
  }
  // The shoulder the climb passes over is stacked boulders, close beside and under the route from where it leaves
  // the sand to the approach of the notch: to every 4 m of the route a spot on either side of it, 2.5 to 7.5 m out,
  // and a spot for a lower boulder right under it. A boulder sits on the ground at each spot if its skin stays 4.2 m
  // or more from the route's line and it does not swallow a neighbour; on two in three of the side ones a smaller one rides.
  {
    let acc = 0;
    for (let i = 4; i < PS.length; i += 4) {
      const ex = PS[i] - PS[i - 4], ez = PS[i + 2] - PS[i - 2], el = Math.hypot(ex, ez) || 1;
      acc += Math.hypot(ex, PS[i + 1] - PS[i - 3], ez);
      if (PS[i + 2] > 74 || PS[i + 2] < -3 || acc < 4) continue;
      acc = 0;
      for (const sd of [-1, 1, 0]) {
        const off = sd ? sd * srng.range(2.5, 7.5) : srng.range(-2.2, 2.2), r = sd ? srng.range(1.2, 2.5) : srng.range(1.0, 1.5), sq = srng.range(0.74, 0.92), sink = srng.range(0.35, 0.6), ride = srng(), r2 = r * srng.range(0.5, 0.75), a = srng() * TAU;
        const x = PS[i] - ez / el * off + srng.range(-1, 1), z = PS[i + 2] + ex / el * off + srng.range(-1, 1), y = heightAt(x, z) + r * sq * sink;
        if (pathDist(x, y, z) < r * 1.08 + 4.2) continue;
        let ok = true;
        for (const b of boulders) if (Math.hypot(b.x - x, b.y - y, b.z - z) < 0.62 * (b.r + r)) { ok = false; break; }
        if (!ok) continue;
        const b = putBoulder(x, y, z, r, r > 1.5 ? 4 : 3, sq, srng);
        const x2 = x + Math.cos(a) * r * 0.5, z2 = z + Math.sin(a) * r * 0.5, y2 = b.top + r2 * 0.4;
        if (sd && ride < 0.66 && pathDist(x2, y2, z2) > r2 * 1.08 + 4.2) putBoulder(x2, y2, z2, r2, 3, 0.85, srng);
      }
      await ctx.yield();
    }
  }
  // The eagle-owl's perch: a boulder 8 to 9 m to the right of the path where it comes up to the notch (the
  // stacks of the notch are 20 to 30 m from the last stretch of the flight: an owl up there is a speck). It is laid
  // on the first of a few spots that is clear of every other boulder; if none is, the owl perches as it did.
  let owlStone = null;
  for (const b of boulders) {      // a boulder that already stands on the spot will do
    if (Math.hypot(b.tx - 6.6, b.tz + 9.5) > 2.2 || b.tz > -8 || b.top < 21.5 || b.top > 25.5 || (owlStone && b.top < owlStone.top)) continue;
    let free = true;
    for (const o of boulders) if (o !== b && Math.hypot(o.x - b.tx, o.y - (b.top + 0.35), o.z - b.tz) < o.r * 1.25) { free = false; break; }
    if (free) owlStone = b;
  }
  if (!owlStone) for (const [x, z] of [[6.6, -9.5], [6.2, -11], [7.6, -10.4], [6.4, -8]]) {
    const r = 1.4, y = heightAt(x, z) + r * 0.45;
    if (pathDist(x, y, z) < r * 1.2 + 6.3) continue;
    let ok = true;
    for (const b of boulders) if (Math.hypot(b.x - x, b.y - y, b.z - z) < 0.8 * (b.r + r)) { ok = false; break; }
    if (ok) { owlStone = putBoulder(x, y, z, r, 4, 0.84, srng); break; }
  }
  await ctx.yield();
  const boulderGeo = BS.build();
  await ctx.yield();
  // The hill's skin is not an even tone. Patches of it earn fewer strokes (a negative `pale` takes a level away),
  // and every boulder lays a bare black shadow down-moon, so that the cross-hatched boulders stand as the densest
  // shapes on the slope and the gaps under them read as shadow.
  {
    const gs = groundS.s, gp = groundS.p, n = groundS.count, mdx = -0.819, mdz = 0.574;
    for (let i = 0; i < n; i++) {
      const x = gp[i * 3], y = gp[i * 3 + 1], z = gp[i * 3 + 2];
      if (Math.hypot(x - 3, z + 20) > 135) continue;
      let sh = 0;
      for (const b of boulders) {
        const dx = b.x - x, dz = b.z - z, along = dx * mdx + dz * mdz;            // metres toward the moon to the boulder
        if (along < -b.r * 0.35 || along > b.r * 2.9) continue;
        const perp = Math.abs(dx * mdz - dz * mdx);
        if (perp > b.r * 1.15 || y > b.top - 0.1 * Math.max(0, along)) continue;
        const k = (1 - sstep(b.r * 0.6, b.r * 1.15, perp)) * (1 - sstep(b.r * 1.6, b.r * 2.9, along));
        if (k > sh) sh = k;
      }
      const patch = 0.5 + 0.5 * noise.fbm2(x * 0.05 + nOff * 1.7, z * 0.05 - nOff, 2);
      // the lower slope (what fills the bottom of the frame on the climb) is the patchiest: its barest patches lose the whole hatch
      const pp = sstep(0.3, 0.72, patch), band = sstep(24, 32, z) * (1 - sstep(48, 60, z));
      gs[i * 4] = -Math.max(sh * 2.4, sstep(0, 1.5, y) * ((0.55 + 0.45 * pp) * (0.72 + 0.4 * sstep(80, 52, z) + 0.24 * band) + 0.7 * band * pp * pp * pp) * (1 - 0.5 * sstep(30, 16, z)));
      if ((i & 63) === 0) await ctx.yield();
    }
    await ctx.yield();
    root.userData.groundGeo = groundS.build(); groundS = null;
  }
  await ctx.yield();

  // ---------------------------------------------------------------- quiver trees
  const BK = new Surf(), RB = new Ribs();
  const V3 = THREE.Vector3, _e1 = new V3(), _e2 = new V3(), _ax = new V3(), _u = new V3();
  // a tapering tube with girth/length hatch coordinates; flare(t) optionally scales the radius
  const addTube = (a, b, r0, r1, sides, segs, len0, dia0, dia1, seed, flare) => {
    _ax.subVectors(b, a); const L = _ax.length() || 1e-3; _ax.divideScalar(L);
    _u.set(0.31, 0.2, -0.93); if (Math.abs(_ax.dot(_u)) > 0.95) _u.set(1, 0, 0);
    _e1.crossVectors(_u, _ax).normalize(); _e2.crossVectors(_ax, _e1);
    const base = BK.count;
    for (let s = 0; s <= segs; s++) {
      const t = s / segs, r = (r0 + (r1 - r0) * t) * (flare ? flare(t) : 1), cx = a.x + _ax.x * L * t, cy = a.y + _ax.y * L * t, cz = a.z + _ax.z * L * t, al = len0 + L * t;
      for (let j = 0; j <= sides; j++) {
        const an = (j / sides) * TAU, c = Math.cos(an), sn = Math.sin(an);
        const nx = _e1.x * c + _e2.x * sn, ny = _e1.y * c + _e2.y * sn, nz = _e1.z * c + _e2.z * sn, girth = (j / sides - 0.5) * TAU * r0;
        BK.v(cx + nx * r, cy + ny * r, cz + nz * r, nx, ny, nz, girth, al, al * 0.9 + girth * 0.42, girth * 0.9 - al * 0.42, 1, 1, dia0 + (dia1 - dia0) * t, seed);
      }
    }
    for (let s = 0; s < segs; s++) for (let j = 0; j < sides; j++) {
      const p = base + s * (sides + 1) + j, q = p + sides + 1;
      BK.tri(p, p + 1, q); BK.tri(p + 1, q + 1, q);
    }
  };
  const flowers = season !== 'summer';
  const trees = [];
  // base position, height, lean (unit-ish xz vector * amount), hero detail?
  let trng = rng;
  const addTree = (bx, by, bz, H, leanX, leanZ, hero) => {
    const seed = trng() * 40, r0 = 0.5 * Math.min(1.15, H / 7.5) + 0.06;
    const levels = hero === 2 ? 6 : hero ? 5 : (H > 4.6 ? 4 : 3), sides = hero ? 6 : 4, segs = hero ? 2 : 1;
    const nLeaf = hero ? 11 : 7, perTip = levels === 3 ? 3 : 2, leafL = 0.42 + 0.03 * H;
    const base = new V3(bx, by - 0.3, bz), F = new V3(bx + leanX * H * 0.5, by + H * 0.42, bz + leanZ * H * 0.5);
    const crownC = new V3(F.x + leanX * H * 0.3, F.y + H * 0.2, F.z + leanZ * H * 0.3);
    const wob = trng() * 6;
    addTube(base, F, r0, r0 * 0.66, hero ? 12 : 7, hero ? 8 : 4, 0, 1, 0.8, seed, (t) => 1 + 0.28 * Math.pow(1 - t, 6) + 0.035 * Math.sin(t * 9 + wob));
    let top = F.y;
    const up = new V3(0, 1, 0), tmp = new V3(), tmp2 = new V3(), q = new THREE.Quaternion();
    const tip = (end, dir) => {
      for (let k = 0; k < perTip; k++) {
        let ex = end.x, ey = end.y, ez = end.z;
        if (k > 0) { tmp.set(trng() - 0.5, trng() * 0.3, trng() - 0.5).normalize(); const o = leafL * 0.8; ex += tmp.x * o; ey += tmp.y * o - 0.1; ez += tmp.z * o; }
        const ox = ex - crownC.x, oy = ey - crownC.y, oz = ez - crownC.z, ol = Math.hypot(ox, oy, oz) || 1;
        _u.set(0.3, 0.1, 0.9); _e1.crossVectors(_u, dir).normalize(); _e2.crossVectors(dir, _e1);
        const g0 = trng() * TAU;
        for (let l = 0; l < nLeaf; l++) {
          const th = 0.2 + 1.3 * Math.sqrt((l + 0.5) / nLeaf) + trng.range(-0.1, 0.1), az = g0 + l * 2.39996, st = Math.sin(th), ct = Math.cos(th);
          const dx = dir.x * ct + (_e1.x * Math.cos(az) + _e2.x * Math.sin(az)) * st, dy = dir.y * ct + (_e1.y * Math.cos(az) + _e2.y * Math.sin(az)) * st, dz = dir.z * ct + (_e1.z * Math.cos(az) + _e2.z * Math.sin(az)) * st;
          const ll = leafL * trng.range(0.8, 1.15);
          RB.lance(ex, ey, ez, ex + dx * ll, ey + dy * ll, ez + dz * ll, 0, -0.02 * ll, 0, 0.05, ox / ol * 0.75 + dx * 0.45, oy / ol * 0.75 + dy * 0.45, oz / ol * 0.75 + dz * 0.45, 0.6, 0.07, trng, 0.3);
        }
        if (flowers) {
          const nf = hero ? 2 : 1;
          for (let f = 0; f < nf; f++) {
            const sx = (trng() - 0.5) * 0.3, sz = (trng() - 0.5) * 0.3, fl = trng.range(0.34, 0.55);
            const x0 = ex + dir.x * 0.12, y0 = ey + dir.y * 0.12 + 0.05, z0 = ez + dir.z * 0.12;
            RB.lance(x0, y0, z0, x0 + (dir.x * 0.35 + sx) * fl, y0 + (0.8 + dir.y * 0.2) * fl, z0 + (dir.z * 0.35 + sz) * fl, 0, 0, 0, 0.06, ox / ol * 0.5, oy / ol * 0.5 + 0.6, oz / ol * 0.5, 1, 0.3, trng, 0.6);
          }
        }
        if (ey + leafL > top) top = ey + leafL;
      }
    };
    const branch = (p, dir, len, r, level, lenAcc, twist) => {
      const end = new V3().copy(p).addScaledVector(dir, len);
      addTube(p, end, r, r * 0.74, sides, segs, lenAcc, level === 1 ? 0.7 : 0, 0, seed + level);
      if (level >= levels) { tip(end, dir); return; }
      _u.set(0.2, 0.9, 0.37); if (Math.abs(dir.dot(_u)) > 0.9) _u.set(1, 0, 0);
      tmp.crossVectors(_u, dir).normalize(); tmp2.crossVectors(dir, tmp);
      const axs = new V3().copy(tmp).multiplyScalar(Math.cos(twist)).addScaledVector(tmp2, Math.sin(twist));
      const spread = (level === 1 ? 0.66 : 0.56) * trng.range(0.88, 1.14);
      for (const s of [-1, 1]) {
        q.setFromAxisAngle(axs, s * spread * trng.range(0.85, 1.15));
        const d2 = new V3().copy(dir).applyQuaternion(q); d2.y += level >= 2 ? 0.2 : 0.08; d2.normalize();
        branch(end, d2, (level === 1 ? H * 0.17 : len * (levels === 6 ? 0.82 : 0.88)) * trng.range(0.88, 1.1), r * 0.72, level + 1, lenAcc + len, twist + Math.PI / 2 + trng.range(-0.5, 0.5));
      }
    };
    const d0 = new V3(leanX * 1.2, 1, leanZ * 1.2).normalize();
    branch(F, d0, H * 0.11, r0 * 0.66, 1, F.distanceTo(base), trng() * TAU);
    const t = { base: new V3(bx, by, bz), top: new V3(crownC.x, top, crownC.z), height: top - by, crown: crownC, crownR: H * 0.44, r0 };
    trees.push(t); return t;
  };

  // the two oldest, on the stacks, leaning their domes together over the notch
  const notchTrees = [];
  for (let s = 0; s < 2; s++) {
    const sd = s === 0 ? -1 : 1, st = stackTop[s];
    const bx = st.x - sd * 0.5, bz = st.z + 1.2 * (rng() - 0.5);
    notchTrees.push(addTree(bx, st.y - 0.15, bz, rng.range(8.3, 9.2), -sd * rng.range(0.3, 0.36), rng.range(-0.04, 0.04), 2));
  }
  await ctx.yield();
  // the 7 m tree beside the climb (to the right, among the path-side boulders) and its neighbours
  const clearOf = (x, y, z, r) => pathDist(x, y, z) > r;
  const inBoulder = (x, z, y) => { for (const b of boulders) { if (Math.hypot(b.x - x, b.z - z) < b.r * 0.92 && y < b.top) return true; } return false; };
  let heroTree = null;
  for (let k = 0; k < 60 && !heroTree; k++) {
    const z = 55 + rng.range(-4, 4), x = -14.4 + 7.7 + rng.range(-0.2, 1.6), g = heightAt(x, z);
    if (inBoulder(x, z, g + 0.5) || !clearOf(x, g + 3, z, 7.2)) continue;
    heroTree = addTree(x, g, z, 7, rng.range(-0.05, 0.05), rng.range(-0.05, 0.05), 2);
  }
  await ctx.yield();
  {
    const want = Math.max(12, Math.round(opts.trees ?? 60)) - trees.length;
    let placed = 0, tries = 0, heroLeft = 5;
    while (placed < want && tries++ < 5000) {
      const x = 3 + rng.range(-62, 60), z = -20 + rng.range(-40, 108), g = heightAt(x, z);
      if (g < 1.2 || rng() > 0.35 + 0.65 * (g / 21)) continue;
      const H = 3.4 + 5.8 * Math.pow(rng(), 1.25) * (0.55 + 0.45 * sstep(2, 16, g));
      const pd = pathDist(x, g + H * 0.5, z);
      if (pd < 7.0 + 0.5 || pathDist(x, g + H * 0.75, z) < H * 0.42 + 4.5) continue;
      if (inBoulder(x, z, g + 0.6)) continue;
      let ok = true; for (const t of trees) { if (Math.hypot(t.base.x - x, t.base.z - z) < 3.2 + 0.3 * (t.height + H)) { ok = false; break; } }
      if (!ok) continue;
      const hero = heroLeft > 0 && pd < 22 && H > 4.5; if (hero) heroLeft--;
      addTree(x, g, z, H, rng.range(-0.08, 0.08), rng.range(-0.08, 0.08), hero);
      placed++;
      if ((placed & 1) === 0) await ctx.yield();
    }
  }
  await ctx.yield();
  // The grove at the foot of the climb: four of the tallest trees. Seen from the sand below they stand on the skyline
  // either side of the notch with their crowns against the Milky Way, and the climb passes between them. Each takes
  // the nearest free spot to its mark; they draw from their own generator.
  for (const [tx, tz, H, det] of [[-27, 64, 9.2, 2], [-24, 44, 9.6, 1], [2, 42, 9.6, 1], [4.5, 68, 9.0, 2]]) {
    for (let k = 0; k < 30; k++) {
      const a = k * 2.4, rr = 0.9 * Math.sqrt(k), x = tx + Math.cos(a) * rr, z = tz + Math.sin(a) * rr, g = heightAt(x, z);
      if (inBoulder(x, z, g + 0.6) || pathDist(x, g + H * 0.5, z) < 8 || pathDist(x, g + H * 0.75, z) < H * 0.42 + 4.5) continue;
      let ok = true; for (const t of trees) { if (Math.hypot(t.base.x - x, t.base.z - z) < 5.5) { ok = false; break; } }
      if (!ok) continue;
      trng = srng; addTree(x, g, z, H, srng.range(-0.05, 0.05), srng.range(-0.05, 0.05), det).setPiece = true; trng = rng;
      break;
    }
    await ctx.yield();
  }
  // Young quiver trees close under the route on the shoulder: 3.6 to 5.2 m tall, one to every 9 m of the climb on
  // alternate sides, 4 to 9 m out, each where its crown stays 2.8 m clear of the route's line and of every other tree.
  {
    let acc = 0, sd = 1;
    for (let i = 4; i < PS.length; i += 4) {
      const ex = PS[i] - PS[i - 4], ez = PS[i + 2] - PS[i - 2], el = Math.hypot(ex, ez) || 1;
      acc += Math.hypot(ex, PS[i + 1] - PS[i - 3], ez);
      if (PS[i + 2] > 72 || PS[i + 2] < 2 || acc < 9) continue;
      for (let k = 0; k < 10; k++) {
        const off = sd * srng.range(4, 9), H = srng.range(3.6, 5.2), x = PS[i] - ez / el * off, z = PS[i + 2] + ex / el * off + srng.range(-2, 2), g = heightAt(x, z);
        if (inBoulder(x, z, g + 0.6) || pathDist(x, g + H * 0.78, z) < H * 0.44 + 2.8 || pathDist(x, g + H * 0.4, z) < 4.4) continue;
        let ok = true; for (const t of trees) { if (Math.hypot(t.base.x - x, t.base.z - z) < 4) { ok = false; break; } }
        if (!ok) continue;
        trng = srng; addTree(x, g, z, H, srng.range(-0.06, 0.06), srng.range(-0.06, 0.06), 1).setPiece = true; trng = rng;
        acc = 0; sd = -sd;
        break;
      }
      await ctx.yield();
    }
  }
  // And taller ones beside it, 5.5 to 8 m, their crowns against the sky as we climb: one to every 11 m of the climb
  // on each side, 7.5 to 12 m out, by the hill's own rule for a tree near the route (trunk 7.5 m clear, crown 4.5 m).
  {
    let acc = 6;
    for (let i = 4; i < PS.length; i += 4) {
      const ex = PS[i] - PS[i - 4], ez = PS[i + 2] - PS[i - 2], el = Math.hypot(ex, ez) || 1;
      acc += Math.hypot(ex, PS[i + 1] - PS[i - 3], ez);
      if (PS[i + 2] > 70 || PS[i + 2] < 4 || acc < 11) continue;
      acc = 0;
      for (const sd of [-1, 1]) {
        for (let k = 0; k < 8; k++) {
          const off = sd * srng.range(7.5, 12), H = srng.range(5.5, 8), x = PS[i] - ez / el * off, z = PS[i + 2] + ex / el * off + srng.range(-3, 3), g = heightAt(x, z);
          if (inBoulder(x, z, g + 0.6) || pathDist(x, g + H * 0.5, z) < 7.5 || pathDist(x, g + H * 0.75, z) < H * 0.42 + 4.5) continue;
          let ok = true; for (const t of trees) { if (Math.hypot(t.base.x - x, t.base.z - z) < 5) { ok = false; break; } }
          if (!ok) continue;
          trng = srng; addTree(x, g, z, H, srng.range(-0.06, 0.06), srng.range(-0.06, 0.06), 1).setPiece = true; trng = rng;
          break;
        }
        await ctx.yield();
      }
    }
  }

  // ---------------------------------------------------------------- grass: silver bushman tussocks
  {
    const want = Math.round(900 * (0.5 + 0.5 * detail)), tall = season === 'summer' ? 1.35 : 1;
    let placed = 0, tries = 0;
    while (placed < want && tries++ < 9000) {
      let x, z;
      if (placed < 70) { x = rng.range(-9, 9); z = -20 + rng.range(-12, 16); }                     // the saddle
      else { const a = rng() * TAU, r = 20 + 150 * Math.pow(rng(), 0.8); x = Math.sin(a) * r; z = GC + Math.cos(a) * r; }
      const g = heightAt(x, z);
      if (g > 1 && placed >= 70 && rng() < 0.55) continue;
      if (inBoulder(x, z, g + 0.3)) continue;
      const nb = 5, hh = rng.range(0.6, 0.9) * tall, a0 = rng() * TAU;
      for (let b = 0; b < nb; b++) {
        const a = a0 + (b / nb) * TAU + rng.range(-0.4, 0.4), sp = rng.range(0.12, 0.5) * hh, bh = hh * rng.range(0.7, 1.05);
        const rx = x + Math.cos(a) * 0.06, rz = z + Math.sin(a) * 0.06;
        RB.lance(rx, g - 0.03, rz, rx + Math.cos(a) * sp, g + bh, rz + Math.sin(a) * sp, Math.cos(a) * sp * 0.22, bh * 0.1, Math.sin(a) * sp * 0.22, 0.035, Math.cos(a) * 0.25, 1, Math.sin(a) * 0.25, 0.4, 0.6, rng, 0.62);
      }
      placed++;
      if ((placed & 31) === 0) await ctx.yield();
    }
  }
  await ctx.yield();

  // the hill as it stands against the sky from far up the street (+Z): its top line over ground and boulders
  const skyline = { profile: [], crowns: trees.filter((t) => !t.setPiece).map((t) => ({ base: t.base.clone(), top: t.top.clone(), center: t.crown.clone(), r: t.crownR })) };
  for (let x = -70; x <= 72; x += 2.5) {
    let best = 0, bz = 14;
    for (let z = -62; z <= 98; z += 3) { const h = heightAt(x, z); if (h > best) { best = h; bz = z; } }
    for (const b of boulders) { const dx = Math.abs(b.x - x); if (dx < b.r) { const t = b.y + (b.top - b.y) * Math.sqrt(1 - (dx / b.r) * (dx / b.r)); if (t > best) { best = t; bz = b.z; } } }
    skyline.profile.push([x, best, bz]);
  }
  await ctx.yield();

  // ---------------------------------------------------------------- the perched eagle-owl
  const addBlob = (S, cx, cy, cz, rx, ry, rz, det, pale, seed) => {
    const T = icoTemplate(det), base = S.count;
    for (let i = 0; i < T.n; i++) {
      const dx = T.pos[i * 3], dy = T.pos[i * 3 + 1], dz = T.pos[i * 3 + 2];
      let nx = dx / rx, ny = dy / ry, nz = dz / rz; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const girth = Math.atan2(dx, dz) * rx, y = dy * ry;
      S.v(cx + dx * rx, cy + y, cz + dz * rz, nx, ny, nz, girth, y, y * 0.9 + girth * 0.42, girth * 0.9 - y * 0.42, pale, 1, 0, seed);
    }
    for (let f = 0; f < T.idx.length; f += 3) S.tri(base + T.idx[f], base + T.idx[f + 1], base + T.idx[f + 2]);
  };
  // perch: the highest boulder top near the notch that no other boulder or tree covers
  let perch = owlStone; const OS = 3.6;
  if (perch) { for (const t of trees) if (Math.hypot(t.base.x - perch.tx, t.base.z - perch.tz) < 1.6) { perch = null; break; } }
  if (!perch) {
    let best = -1e9;
    for (let i = 0; i < boulders.length; i++) {
      const b = boulders[i];
      if (i === 0 || i === 4 || Math.hypot(b.tx, b.tz + 18) > 17 || b.tz < -24) continue;
      let free = true;
      for (const o of boulders) { if (o !== b && Math.hypot(o.x - b.tx, o.y - (b.top + 0.35), o.z - b.tz) < o.r * 1.25) { free = false; break; } }
      for (const t of trees) { if (Math.hypot(t.base.x - b.tx, t.base.z - b.tz) < 1.6) free = false; }
      if (!free) continue;
      // on the near side of the right-hand stack, where the camera of the last stretch sees it large beside the portal
      const score = (b.tx > 3 ? 20 : 0) + 0.5 * b.top - 0.25 * Math.abs(b.tz + 12) - 0.3 * Math.abs(Math.abs(b.tx) - 8);
      if (score > best) { best = score; perch = b; }
    }
    if (!perch) perch = boulders[6] || boulders[0];
  }
  const owlPos = new V3(perch.tx, perch.top - 0.05, perch.tz);
  addBlob(BK, owlPos.x, owlPos.y + 0.2 * OS, owlPos.z, 0.15 * OS, 0.215 * OS, 0.118 * OS, 3, 0.5, 3.3);      // a broad body, wider than it is deep
  addBlob(BK, owlPos.x, owlPos.y + 0.03 * OS, owlPos.z - 0.09 * OS, 0.06 * OS, 0.05 * OS, 0.13 * OS, 2, 0.3, 5.1);      // tail
  const owlHead = new THREE.Group(); owlHead.position.set(owlPos.x, owlPos.y + 0.43 * OS, owlPos.z);
  const owlFace = perch === owlStone ? -0.6 : -0.25;      // on its stone beside the path it looks up the path, toward us as we come
  const HS = new Surf();
  addBlob(HS, 0, 0, 0, 0.108 * OS, 0.08 * OS, 0.09 * OS, 3, 0.7, 7.7);
  for (const sd of [-1, 1]) {            // ear tufts
    const b = HS.count, x = sd * 0.066 * OS, y = 0.045 * OS, e = 0.032 * OS;
    const tipx = sd * 0.118 * OS, tipy = 0.19 * OS;
    HS.v(x - e, y, 0.01, -sd * 0.3, 0.5, 0.8, 0, 0, 0, 0, 0.6, 1, 0, 1); HS.v(x + e, y, 0.01, sd * 0.6, 0.5, 0.6, e * 2, 0, 0.02, 0, 0.6, 1, 0, 1);
    HS.v(x, y, -e * 1.4, 0, 0.4, -0.9, e * 4, 0, 0.04, 0, 0.6, 1, 0, 1); HS.v(tipx, tipy, -0.005, sd * 0.4, 0.9, 0, e * 2, 0.1, 0.05, 0.1, 0.6, 1, 0, 1);
    HS.tri(b, b + 1, b + 3); HS.tri(b + 1, b + 2, b + 3); HS.tri(b + 2, b, b + 3);
  }

  await ctx.yield();
  // ---------------------------------------------------------------- shared uniforms and materials
  const TOP_Y = Math.max(...trees.map((t) => t.top.y), 30) + 1;
  const moonLocal = hour === 'day' || hour === 'golden' ? new V3(-0.819 * Math.cos(50 * DEG), Math.sin(50 * DEG), 0.574 * Math.cos(50 * DEG))
    : hour === 'dawn' ? new V3(-0.975, 0.2, 0.1).normalize() : new V3(-0.819 * Math.cos(5 * DEG), Math.sin(5 * DEG), 0.574 * Math.cos(5 * DEG));
  const U = {
    uPx: { value: 1 }, uPlane: { value: -10 }, uSoft: { value: 3 }, uStar: { value: 1 }, uMoonLvl: { value: 1 }, uTime: { value: 0 },
    uInk: { value: inkV }, uMoonDir: { value: moonLocal.clone() }, uOwlSun: { value: moonLocal.clone() }, uOwl: { value: new THREE.Vector4(0, 0, 0, 0) }, uOwlDir: { value: new THREE.Vector2(0, -1) },
    uFar: { value: new THREE.Vector2(260, 520) }, uStarFar: { value: new THREE.Vector2(1e5, 2e5) }, uTilt: { value: new THREE.Vector4(0, 0, -1e4, 1e4) }, uTiltX: { value: new THREE.Vector4(0, 0, 0, 1e5) }, uHill: { value: new THREE.Vector3(0, 0, 0) }, uMoonFull: { value: 0.8 }, uInvHero: { value: new THREE.Matrix4() }, uView: { value: new THREE.Vector2(800, 450) }, uPixA: { value: 0.0027 },
  };
  // the hill's own starlight reach (uniforms.uHillStarFar): a world that first shows the koppie from far off sets it
  // so that the hill is a black shape cut out of the stars until we are near or the moon draws it
  const hillFar = { value: new THREE.Vector2(1e5, 2e5) };
  const mk = (vs, fs, extra, o = {}) => new THREE.ShaderMaterial(Object.assign({
    uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), U, { uStarFar: hillFar }, extra), vertexShader: vs, fragmentShader: fs, fog: true,
  }, o));
  const groundNear = { value: 0 };
  const surfMat = (S0, len, near = { value: 0 }) => mk(SURF_VERT, SURF_FRAG, { uS0: { value: S0 }, uLen: { value: len }, uNearTone: near });
  const addMesh = (geo, mat, name, parent = root) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = false; parent.add(m); return m; };
  const domeU = { value: new THREE.Vector4(lob, ph1, ph2, 0) };
  // uRip = (ripple strokes kept in starlight, in moonlight, how far off they are drawn, 1 if the flat sand takes the street's strokes); the hero alone keeps its old flat
  const flatMF = { value: 1 }, ripU = { value: new THREE.Vector4(0, 0, 11, 0) }, ripPh = { value: new THREE.Vector2(0, 0) };
  addMesh(root.userData.groundGeo, mk(GROUND_VERT, GROUND_FRAG, { uS0: { value: 0.05 }, uLen: { value: 9 }, uNearTone: groundNear, uDome: domeU, uFlatMF: flatMF, uRip: ripU, uRipPh: ripPh }), 'ground'); delete root.userData.groundGeo;
  const boulderMat = surfMat(0.02, 8);
  addMesh(boulderGeo, boulderMat, 'boulders');
  await ctx.yield();
  addMesh(BK.build(), surfMat(0.012, 15), 'bark');
  await ctx.yield();
  const ribU = { uWindW: { value: new V3(0, 0, -1) }, uThin: { value: 95 }, uGust: { value: weather === 'wind' ? 1.9 : 1 } };
  addMesh(RB.build(), mk(RIB_VERT, RIB_FRAG, ribU, { side: THREE.DoubleSide }), 'ribbons');
  await ctx.yield();
  root.add(owlHead);
  addMesh(HS.build(), boulderMat, 'owl-head', owlHead);
  // eyeshine: two discs that never fall under 1.8 design px, blooming at 1.5
  const eyeU = { uGlow: { value: 1.5 }, uBlink: { value: 1 } };
  {
    const g = new THREE.BufferGeometry(), p = [], c = [];
    for (const sd of [-1, 1]) for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.push(sd * 0.04 * OS, 0.012 * OS, 0.075 * OS); c.push(q[0], q[1]); }
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aCorner', new THREE.Float32BufferAttribute(c, 2));
    g.setIndex([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7]);
    addMesh(g, mk(/* glsl */`
      attribute vec2 aCorner; uniform vec2 uView; uniform float uPx, uBlink; varying vec2 vC; varying float vF;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.);
        vec3 f = mat3(modelMatrix) * vec3(0., 0., 1.); vec3 v = cameraPosition - wp.xyz;
        vF = smoothstep(.05, .4, dot(f / max(length(f), 1e-5), v / max(length(v), 1e-5)));
        vec4 mvPosition = viewMatrix * wp; mvPosition.z += .06;
        vec4 c = projectionMatrix * mvPosition;
        float px = max(${(0.028 * OS).toFixed(4)} * projectionMatrix[1][1] * uView.y * .5 / max(c.w, .05), 1.5 * uPx);
        c.xy += aCorner * vec2(1., uBlink) * px * 2. / uView * c.w;
        vC = aCorner; gl_Position = c;
        #include <fog_vertex>
      }`, /* glsl */`
      uniform float uGlow; varying vec2 vC; varying float vF;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        float d = length(vC); if (d > 1. || vF < .02) discard;
        gl_FragColor = vec4(vec3(uGlow * vF), 1.);
        #include <fog_fragment>
      }`, eyeU), 'owl-eyes', owlHead);
  }

  await ctx.yield();
  // ---------------------------------------------------------------- bats
  const NOTCH = new V3(0, SADDLE_Y + 2.5, -20);
  const batU = { uNotch: { value: NOTCH.clone() } };
  {
    const nb = Math.max(0, Math.round(opts.bats ?? 40)), g = new THREE.BufferGeometry(), bat = [], wing = [], pos = [], idx = [];
    const half = [[0.02, 0.05], [0.2, 0.1], [0.42, -0.02], [0.24, -0.07], [0.1, -0.1], [0, -0.13]], tri = [0, 1, 3, 1, 2, 3, 0, 3, 4, 0, 4, 5];
    for (let b = 0; b < nb; b++) {
      const phase = rng() * TAU, rx = rng.sign() * rng.range(9, 34), rz = rng.range(20, 54), seed = rng();
      for (const sd of [-1, 1]) {
        const base = pos.length / 3;
        for (const h of half) { wing.push(sd * h[0] * 1.4, h[1] * 1.4, 0); bat.push(phase, rx, rz, seed); pos.push(0, 0, 0); }
        for (let k = 0; k < tri.length; k += 3) idx.push(base + tri[k], base + tri[k + 1], base + tri[k + 2]);
      }
      const base = pos.length / 3;
      for (const h of [[-0.04, 0.05], [0.04, 0.05], [0, 0.18]]) { wing.push(h[0], h[1], 0); bat.push(phase, rx, rz, seed); pos.push(0, 0, 0); }
      idx.push(base, base + 1, base + 2);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aBat', new THREE.Float32BufferAttribute(bat, 4));
    g.setAttribute('aWing', new THREE.Float32BufferAttribute(wing, 3));
    g.setIndex(idx);
    if (nb > 0) addMesh(g, mk(BAT_VERT, BAT_FRAG, batU, { side: THREE.DoubleSide }), 'bats');
  }

  await ctx.yield();
  // ---------------------------------------------------------------- sky: Milky Way stipple and bright stars
  const mwA = new V3(0, 0, -1), mwB = new V3(Math.sin(15 * DEG), Math.cos(15 * DEG), 0), mwN = new V3().crossVectors(mwA, mwB).normalize();
  const galDir = (lonDeg, latDeg) => { const lo = lonDeg * DEG, la = latDeg * DEG; return new V3().addScaledVector(mwA, Math.cos(la) * Math.cos(lo)).addScaledVector(mwB, Math.cos(la) * Math.sin(lo)).addScaledVector(mwN, Math.sin(la)).normalize(); };
  const azEl = (azLeftDeg, elDeg) => new V3(-Math.sin(azLeftDeg * DEG) * Math.cos(elDeg * DEG), Math.sin(elDeg * DEG), -Math.cos(azLeftDeg * DEG) * Math.cos(elDeg * DEG));
  const crossDir = galDir(40, 7.5);
  const skyU = {
    uTime: U.uTime, uPx: U.uPx, uPixA: U.uPixA, uInk: U.uInk, uSkyDim: { value: hour === 'day' || hour === 'golden' ? 0 : 1 }, uMeteor: { value: -1 }, uDawn: { value: 0 }, uMetW: { value: 1 }, uMetTail: { value: 0.45 }, uFoot: { value: 0 }, uBg: { value: 1 },
    uMwA: { value: mwA }, uMwB: { value: mwB }, uMwN: { value: mwN }, uCoal: { value: galDir(37, 2.2) }, uLmc: { value: azEl(40, 19) }, uSmc: { value: azEl(22, 30) },
    uMetA: { value: azEl(-11, 36) }, uMetB: { value: azEl(-26, 19) }, uDawnDir: { value: new V3(-1, 0, 0) },
  };
  const starU = { uView: U.uView, uPx: U.uPx, uTime: U.uTime, uInk: U.uInk, uStarDim: { value: 1 } };
  let sky = null;
  if (opts.sky !== false) {
    sky = new THREE.Group(); sky.name = 'sky';
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2400, 24, 14), new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false }));
    dome.renderOrder = -0.6; dome.frustumCulled = false; sky.add(dome);
    const p = [], c = [], st = [], idx = [], srng = rng.fork ? rng.fork('stars') : rng;
    const star = (d, size, kind) => {
      const b = p.length / 3, ph = srng() * TAU, rate = srng.range(0.3, 1.1);
      for (const q of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { p.push(d.x * 2300, d.y * 2300, d.z * 2300); c.push(q[0], q[1]); st.push(size, ph, rate, kind); }
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    star(galDir(43.2, 7.5), 7.5, 1); star(galDir(37.0, 7.6), 6.4, 1); star(galDir(40.4, 9.7), 6.8, 1); star(galDir(40.0, 5.4), 5.6, 1); star(galDir(41.6, 6.3), 2.4, 0);   // the Cross
    star(galDir(27.5, 3.6), 8.4, 1); star(galDir(31.6, 4.6), 6.8, 1);                                                                                           // the Pointers
    star(azEl(62, 13), 8.2, 1); star(azEl(-70, 24), 6.5, 1); star(azEl(8, 62), 6.2, 1);
    for (let i = 0; i < 50; i++) {
      const el = Math.asin(srng.range(0.03, 0.98)) / DEG, az = srng.range(-180, 180), d = azEl(az, el), size = 2.2 + 4 * Math.pow(srng(), 2.2);
      if (d.distanceTo(crossDir) < 0.14) continue;
      star(d, size, size > 4.4 ? 1 : 0);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aCorner', new THREE.Float32BufferAttribute(c, 2));
    g.setAttribute('aStar', new THREE.Float32BufferAttribute(st, 4)); g.setIndex(idx);
    const stars = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: starU, vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, depthWrite: false }));
    stars.renderOrder = -0.5; stars.frustumCulled = false; sky.add(stars);
    root.add(sky);
  }

  await ctx.yield();
  // ---------------------------------------------------------------- progress hooks
  let progress = opts.progress ?? 1, planeOverride = null, meteorOverride = null;
  const always = hour === 'day' || hour === 'golden';
  const applyProgress = () => {
    const f = Math.min(1, Math.max(0, (progress - moonFrom) / Math.max(1e-4, moonTo - moonFrom)));
    U.uPlane.value = planeOverride !== null ? planeOverride : always ? -10 : (f <= 0 ? TOP_Y + 30 : TOP_Y + (-4 - TOP_Y) * f);
    if (hour === 'dawn') { skyU.uDawn.value = f; skyU.uSkyDim.value = 1 - 0.92 * f; starU.uStarDim.value = 1 - f; }
  };
  applyProgress();

  // ---------------------------------------------------------------- anchors
  const summit = boulders.reduce((a, b) => (b.top > a.top ? b : a), boulders[0]);
  const anchors = {
    portalSeat: { position: seat.clone(), facing: fdir.clone().multiplyScalar(-1), radius: PORTAL_R, tilt: 6 * DEG },
    flyThrough: flyThrough.map((v) => v.clone()), beyond,
    notch: { saddle: new V3(0, SADDLE_Y, -20), width: 10, leftStack: stackTop[0].clone(), rightStack: stackTop[1].clone() },
    notchTrees: notchTrees.map((t) => ({ base: t.base.clone(), top: t.top.clone() })),
    heroTree: heroTree ? { base: heroTree.base.clone(), top: heroTree.top.clone(), height: heroTree.height } : null,
    owl: owlPos.clone().add(new V3(0, 0.4 * OS, 0)), summit: new V3(summit.x, summit.top, summit.z),
    moonDir: moonLocal.clone(), milkyWay: mwA.clone(), cross: crossDir.clone(),
    batCloud: { center: new V3(0, SADDLE_Y + 12, -20), radius: 60 }, heightAt, skyline,
    boulders: boulders.map((b) => ({ x: b.x, y: b.y, z: b.z, r: b.r, top: b.top })), trees: trees.map((t) => ({ x: t.base.x, y: t.base.y, z: t.base.z, top: t.top.y, r: t.crownR, cy: t.crown.y })),
    viewpoints: { entry: new V3(-2, 6, 300), foot: flyThrough[2].clone(), climb: flyThrough[4].clone(), notch: E.clone(), far: new V3(-125, 30, 165) },
  };

  // ---------------------------------------------------------------- per-frame
  const _m = new THREE.Matrix4(), _v = new V3(), _size = new THREE.Vector2(), windLocal = new V3(0.12, 0, -1).normalize();
  const hsh = (n) => { const s = Math.sin(n * 127.1 + 31.7) * 43758.5453; return s - Math.floor(s); };
  const update = (dt, time, camera) => {
    root.updateMatrixWorld();
    U.uInvHero.value.copy(root.matrixWorld).invert();
    U.uMoonDir.value.copy(moonLocal).transformDirection(root.matrixWorld);
    ribU.uWindW.value.copy(windLocal).transformDirection(root.matrixWorld);
    U.uTime.value = time;
    if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(_size); if (_size.y > 0) U.uView.value.copy(_size); }
    U.uPx.value = Math.max(0.6, U.uView.value.y / 450);
    if (camera) {
      U.uPixA.value = 2 / (Math.max(0.1, camera.projectionMatrix.elements[5]) * U.uView.value.y);
      if (sky) { _v.setFromMatrixPosition(camera.matrixWorld); sky.position.copy(root.worldToLocal(_v)); }
    }
    // the owl: saccades to a new bearing every 2.6 s, eased; blinks its eyeshine
    const k = time / 2.6, k0 = Math.floor(k), e = sstep(0, 0.22, k - k0);
    const a0 = (hsh(k0) - 0.5) * 1.5 + owlFace, a1 = (hsh(k0 + 1) - 0.5) * 1.5 + owlFace;
    owlHead.rotation.y = a0 + (a1 - a0) * e;
    owlHead.rotation.z = 0.12 * Math.sin(time * 0.7);
    const bl = (time + 1.3) % 4.7; eyeU.uBlink.value = 1 - 0.94 * sstep(0, 0.07, bl) * (1 - sstep(0.1, 0.22, bl));
    skyU.uMeteor.value = meteorOverride !== null ? meteorOverride : ((time + 4) % 11) / 1.3;
    applyProgress();
  };
  update(0, 0, null);

  return {
    object: root,
    radius: 42, height: TOP_Y - 1,
    center: new V3(0, 15, 12),
    anchors, uniforms: Object.assign({}, U, { uSkyDim: skyU.uSkyDim, uGust: ribU.uGust, uThin: ribU.uThin, uWindW: ribU.uWindW, uMeteor: skyU.uMeteor, uMetA: skyU.uMetA, uMetB: skyU.uMetB, uMetW: skyU.uMetW, uMetTail: skyU.uMetTail, uHillStarFar: hillFar, uDawn: skyU.uDawn, uStarDim: starU.uStarDim, uFoot: skyU.uFoot, uBg: skyU.uBg, uGroundNear: groundNear, uDome: domeU, uFlatMF: flatMF, uRip: ripU, uRipPh: ripPh }), sky, addBlob, topY: TOP_Y,
    setProgress(u) { progress = u; applyProgress(); },
    setMoonPlane(y) { planeOverride = y; applyProgress(); },
    setOwlShadow(worldPos, headingXZ, size = 1.6) { U.uOwl.value.set(worldPos.x, worldPos.y, worldPos.z, size); if (headingXZ) U.uOwlDir.value.set(headingXZ.x, headingXZ.y ?? headingXZ.z ?? -1).normalize(); },
    setMeteor(x) { meteorOverride = x; },
    update,
    dispose() {},
    ground: false, groundY: 0,
  };
}
