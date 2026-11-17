// Hero set piece for "pointillist-nursery" (Nursery of Dots): ROUNDING THE TIP.
//
// A dust pillar 1,600 m tall, leaning 12 degrees toward the star cluster (upper left = -X, +Y, a
// little +Z), ending in fingers; on a thin neck above it a dark egg-shaped globule 520 m across,
// hollow and open on its lit side. A veil of dabs covers the opening and peels away; inside is a
// tilted protoplanetary disc 300 m across (rings, three dark gaps, a planet clump with a spiral
// wake in the middle gap) round a newborn star, and two 900 m jets along the disc axis.
//
// STYLE (how it is done, so the world can match it): everything is a dab or a painted hull.
//   * A dab is ONE instanced triangle, camera facing, with an oval inscribed in the fragment shader
//     (discard outside, opaque, depth written, never additive, unsorted). Its colour is exactly one
//     of 12 fixed pigments (uniform uPig[12], see makePigments) picked per dab by hash from weights
//     that depend on how much the surface faces the cluster (pickPigment). Lit = orange/lemon/gold
//     with ultramarine pricked through; shade = ultramarine/violet; never black, never blended.
//     About one dab in three or four has a smaller partner of its complement 0.6 widths away.
//   * Dabs keep a steady size on screen: world sizes come in generations (about 60, 12, 2.5, 0.6 m);
//     a dab shrinks to nothing under ~3 px, and once it passes 7 % of frame height it shrinks while
//     being pushed sideways off the view axis, so near dabs part round the lens. Fast camera motion
//     stretches dabs into dashes (never past 2.2:1). Each dab has bristle furrows, a dithered edge and
//     an impasto ridge (light upper-left, dark lip lower-right, fixed in screen space), in three flat
//     tones whose contrast grows with the dab's size on screen (6 % under 10 px, 20 % over 40 px).
//   * Under the dabs sit low-poly hulls shaded by HULL_FS: two crossfading octaves of a jittered
//     hex grid of dots in the same pigments on #141A3C priming, cell size chosen from distance so
//     the dots stay ~9 px. Solid forms are therefore opaque and never show flat colour.
//   * Light is painted: the hero ignores scene lights completely. The linen weave is a post effect
//     the world should add; bloom should be off except a whisper (threshold ~1.0): only the new
//     star and jets exceed 1.0 (emissive ~1.6-2.6), every pigment stays under 0.8.
//
// opts: palette (7 hex strings: priming, ultramarine, violet, viridian, rose, orange, lemon),
//       progress (0..1 initial value of setProgress, default 0.72), tadpoles (count, default seeded
//       28-48), dabScale (default seeded 0.9-1.2), density (0.5-1, scales dab counts).
//
// PROGRESS (never wall-clock): hero.setProgress(u), u 0..1 =
//   0.00-0.60 the veil peels off the opening (centre first; the tattered edge stays),
//   0.45-0.55 the star's dabs go orange -> lemon and it starts to warm the dots near it,
//   0.55-0.80 both jets draw out to 900 m behind blunt caps,
//   0.55-1.00 the light front runs out along the jets, turning violet dots rose then orange.
//   hero.setStage({ peel, star, jets, front, reveal }) overrides the stages individually (each 0..1);
//   reveal parts the camera-wrapping box of dabs (mode 6) in a cone toward the globule.
//   Map the brief's 25 s..31 s onto u. Ambient motion (breathing, spray, shedding, orbits, knots,
//   tadpoles) runs on the `time` passed to update().
//
// SIZE: origin at the pillar's base centre, +Y up, front +Z. radius/height/center returned describe
//   the focus (the globule: radius 330, height 560, centre ~(-335,1935,62)); the whole piece spans
//   anchors.bounds (radius ~1,000, y 0..2,650) because of the pillar and jets.
//
// ANCHORS (local space; `dir`/`normal` are unit vectors):
//   globuleCenter / starPos  centre of the globule = the new star.
//   discNormal               disc axis = upper jet direction (50 degrees above level, up-left-front).
//   discRadius, gaps         disc size and [{ r, width }] of the dark gaps.
//   portalSeat { position, normal, radius } centre of the portal (up to 28 m across: the disc's dabs part within
//                            38 m of it, and a ring of lemon dabs at 27 m with violet partners at 36 m marks it) lying in the middle gap in the
//                            disc plane; normal points back up at the arriving camera (= discNormal).
//                            The star is 80 m to the camera's left as it goes through.
//   flyThrough               ordered points: up the lit rim 15 m off the crust, level arc to the
//                            right over the tip, then the dive parallel to the jet axis (80 m from
//                            it), dead straight for the last 260 m, through the portal seat and 40 m
//                            beyond. Clear of the hulls by > 6 m; dabs on the line part round the lens.
//   rimLine                  points ON the lit rim crust (bottom to top), for spray/close passes.
//   tipTop                   top of the pillar proper (where the neck starts).
//   viewpoints { entry, overTip, dive }  good camera positions looking at globuleCenter.
//   clusterDir               direction to the five-star cluster (the painted key light).
//   jets [{ root, dir, length, rootRadius, endRadius }]  upper then lower.
//   tadpoles                 Vector3 centres of the tadpole globules.
//   bounds { radius, minY, maxY, center }  whole piece.
//
// COST: ~123k triangles (115k dabs + 8k hull), 9 draw calls, no lights, no textures, ~400 ms build.
// FOR THE WORLD: the returned `kit` lets the world paint more of the same canvas with the same shaders
//   and shared uniforms: kit.Bank, kit.dabMesh(bank, mode, push) (mode 0 crust, 1 looping spray,
//   5 tadpoles, 6 a box of dabs that wraps round the camera: iAux = (box size, drift x, y, z)),
//   kit.hullMat(mode, side), kit.gridGeometry, kit.mergeGrids, kit.pickPigment, kit.COMPLEMENT, kit.P.
//   opts.manner 0 round dots, 1 square tesserae, 2 comma dashes; opts.primeK scales the priming.
// LIGHTING: none needed (self-shaded, painted). Supports scene fog but wants none or very thin.
import * as THREE from 'three';
import { lerp, clamp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#141A3C', '#2B3FA8', '#5B3C9E', '#1F8F78', '#E0607E', '#F28A2E', '#FFF4C2'];

// pigment indices
const P_PRIME = 0, P_DVIOLET = 1, P_ULTRA = 2, P_VIOLET = 3, P_VIRID = 4, P_PULTRA = 5,
  P_ROSE = 6, P_PROSE = 7, P_ORANGE = 8, P_GOLD = 9, P_LEMON = 10, P_PVIRID = 11;
const COMPLEMENT = [P_ORANGE, P_LEMON, P_ORANGE, P_LEMON, P_ROSE, P_GOLD, P_VIRID, P_PVIRID, P_ULTRA, P_ULTRA, P_VIOLET, P_PROSE];

function makePigments(pal) {
  const c = pal.map((h) => new THREE.Color(h));
  const [prime, ultra, violet, virid, rose, orange, lemon] = c;
  const mix = (a, b, t) => a.clone().lerp(b, t);
  const list = [
    prime, mix(violet, prime, 0.3), ultra, violet, virid, mix(ultra, lemon, 0.35),
    rose, mix(rose, lemon, 0.45), orange, mix(orange, lemon, 0.5), lemon, mix(virid, lemon, 0.45),
  ];
  // keep every pigment under ~0.8 so nothing blooms by itself
  return list.map((k) => new THREE.Vector3(k.r, k.g, k.b).multiplyScalar(0.8));
}

// same rule in JS and GLSL: l = how much the surface faces the cluster (0..1), h = hash
function pickPigment(l, h) {
  // A form is modelled the painters' way, by which pigments its dabs take, from the one key direction (toward the
  // cluster): lemon and gold where it faces the key, then orange, then rose; the body colour (violet and ultramarine)
  // across the turn; a massed shade on the side away; and a narrow band of reflected warm light just inside the far
  // edge, before the deepest dark. Neighbours in a band are close in value.
  // (each band shares a pigment with the next, so the form grades lemon, gold, orange, rose, violet, ultramarine)
  if (l > 0.88) return h < 0.42 ? P_LEMON : P_GOLD;
  if (l > 0.78) return h < 0.65 ? P_ORANGE : P_GOLD;
  if (l > 0.66) return h < 0.6 ? P_ROSE : P_ORANGE;
  if (l > 0.5) return h < 0.55 ? P_VIOLET : h < 0.92 ? P_ULTRA : P_ROSE;
  if (l > 0.2) return h < 0.35 ? P_DVIOLET : h < 0.85 ? P_ULTRA : P_VIOLET;   // the shade is a mass: no pale or green dab breaks it
  if (l > 0.1) return h < 0.5 ? P_VIOLET : h < 0.74 ? P_ROSE : P_ULTRA;
  return h < 0.6 ? P_DVIOLET : P_ULTRA;
}

const GLSL_COMMON = /* glsl */`
uniform float uTime, uPxScale, uStar, uFront, uManner, uPrimeK, uStorm, uReveal;
uniform vec2 uRes;
uniform vec3 uStarPos, uAxis, uE1, uE2, uL;
uniform vec3 uPig[12];
float pickPig(float l, float h){
  if (l > .88) return h < .42 ? 10. : 9.;
  if (l > .78) return h < .65 ? 8. : 9.;
  if (l > .66) return h < .6 ? 6. : 8.;
  if (l > .5) return h < .55 ? 3. : h < .92 ? 2. : 6.;
  if (l > .2) return h < .35 ? 1. : h < .85 ? 2. : 3.;
  if (l > .1) return h < .5 ? 3. : h < .74 ? 6. : 2.;
  return h < .6 ? 1. : 2.;
}
// the new star's painted light: cool pigments near it (or inside the jets' light front) turn rose, then orange
float starWarm(vec3 p){
  vec3 rel = p - uStarPos; float al = dot(rel, uAxis); float pr = length(rel - uAxis * al);
  float w = uStar * (1. - smoothstep(90., 420., length(rel)));
  float j = (1. - smoothstep(25., 150., pr)) * step(abs(al), uFront * 900.) * step(0.001, uFront) * 0.85;
  return max(w, j);
}
// aerial perspective the painter's way: with distance more dabs are swapped (never blended) for ultramarine and its pale tint
float farPig(float pig, float dist, float h){
  float far = smoothstep(900., 4500., dist);
  if (h < far * .65) pig = pig > 4.5 ? 5. : 2.;
  return pig;
}
float warmPig(float pig, float w, float hh){
  if (pig < 5.5) { if (hh < w) pig = (hh < w * 0.6 && w > 0.55) ? 8. : 6.; }
  else if (pig < 7.5 && hh < w * 0.7) pig = 8.;
  return pig;
}
`;

// ---------- the deck's rule, one text for the far wall's shader (the world) and for the dabs that lie on the deck ----------
// deckPick: the deck's tiers of pigment, deep to light, by the tone T (0..5) of the place and a hash. Neighbours in a
//   tier are close in value: the deep (priming, dark violet); the hollows (dark violet, ultramarine, violet); the body
//   (violet beside ultramarine) and its edge toward the light (pale ultramarine laid beside them); the slopes turned to the cluster (pale ultramarine, rose, a little orange and pale rose); the crests
//   (pale rose, pale ultramarine, gold, a prick of lemon). uLandWarm is the share of warm pigment the canvas allows;
//   uLandDeep is the canvas's deep pigment (the dark violet; ultramarine on the cream canvas, where the dark violet is pale).
// deckAir: the law of distance, by the metres from the eye to the place painted and nothing else: 0 beside us, a half
//   at 10 km, toward 1 at the level line. deckFarT: with distance the tone of a place draws toward the pale middle
//   tier (the wall's own), so the ground goes paler and its neighbours closer in value.
export const DECK_GLSL = /* glsl */`
uniform float uLandWarm, uLandDeep;
float deckPick(float T, float h, float air){
  float w = uLandWarm * (1. - .8 * air);   // (the warm dots are sparser far off)
  if (T < 1.) return h < .6 ? 0. : uLandDeep;
  if (T < 2.1) return h < .42 ? uLandDeep : h < .8 ? 2. : 3.;
  if (T < 2.85) return h < .56 ? 3. : 2.;
  if (T < 3.2) return h < .45 ? 5. : h < .75 ? 2. : 3.;   // (the edge: the pale beside the body, one hue in two values, as on the wall)
  float pu = .54 + .28 * air, ro = pu + .28 * (1. - .65 * air);   // (far off the lit slopes are the wall's own pale tier: pale ultramarine, a little rose)
  if (T < 4.1) return h < pu ? 5. : h < ro ? 6. : h < ro + .14 * w ? 8. : 7.;
  return h < .36 ? 7. : h < .64 ? 5. : h < .64 + .22 * w ? 9. : h < .64 + .36 * w ? 10. : 7.;
}
float deckAir(float t){ return t * t / (t * t + 1e8); }
float deckFarT(float T, float a){ return mix(T, 3.9, .95 * a); }
`;

const DAB_VS = /* glsl */`
${GLSL_COMMON}
${DECK_GLSL}
uniform float uPeel, uJet, uPush, uOvalX, uEmis;
uniform vec3 uCamVel, uWind, uTail;
attribute vec3 iPos; attribute vec4 iData; attribute vec4 iAux;
varying vec2 vUv; varying vec2 vQ; varying vec3 vCol; varying float vH; varying float vPx;
#include <fog_pars_vertex>
vec3 curl(vec3 p){ return vec3(sin(p.y * 1.7 + p.z * 1.3), sin(p.z * 1.9 + p.x * 1.1), sin(p.x * 1.5 + p.y * 2.1)); }
void main(){
  float size = iData.x, hsh = iData.y, pig = iData.z, rot = iData.w;
  float sc = 1., emis = 1., capK = 1., pull = 0., starK = 1.;
  vec2 vo = vec2(0.);
  float hh = fract(hsh * 17.31);
  vec3 p = iPos;
#if MODE == 0
  // surface crust: drift a little along the flow, each on its own slow phase
  if (iAux.w < 1.9) p += iAux.xyz * (sin(uTime * (0.3 + hh * 0.5) + hsh * 50.) * size * 0.3);
  if (iAux.w > 1.9) {
    // the star as the far view sees it: a loaded lemon disc with a ring of orange dabs and violet partners outside
    // them, laid facing the lens (iAux.xy), larger from across the nebula; inside 150 m the 6 m cluster takes over
    float sd = length(p - cameraPosition);
    starK = mix(1., 1.9, smoothstep(320., 900., sd));
    vo = iAux.xy * starK; capK = 3.4; pull = 40.;
    sc = starK * smoothstep(70., 150., sd) * mix(iAux.w > 2.5 ? .0 : .5, 1., uStar);
    if (iAux.w < 2.5) { pig = uStar > .5 ? pig : 8.; emis = 1.1 + .9 * uStar; }
    else emis = iAux.w < 3.5 ? 1. + .25 * uStar : 1.;
    sc *= 1. + .05 * sin(uTime * 1.1 + hsh * 40.);
  }
  else if (iAux.w > 0.) { pig = (uStar > hh * 0.8 + 0.1) ? 10. : 8.; emis = 1.1 + 0.6 * iAux.w * uStar * uEmis; }
  else if (iAux.w < -.5 && iAux.w > -1.5) {   // the beacon round the portal seat: a bright wave runs round the ring
    float bw = sin(uTime * 1.3 - rot * 2.);
    emis = 1.3 + .2 * bw; sc = 1. + .1 * bw;
  }
  else if (iAux.w < -3.5) {                    // the beacon's far generation: a few loaded lemon dabs that hold from across the nebula
    emis = 1.3 + .16 * sin(uTime * 1.3 - rot * 2.);
    sc = smoothstep(300., 520., length(p - cameraPosition));
  }
  else if (iAux.w < -2.5) sc = smoothstep(680., 1100., length(p - cameraPosition));   // the egg's far contour gives way to the fine one
  else if (iAux.w < -.1 && iAux.w > -.4) {
    // a dab of the deck carries the tone of the place it lies on (fifty steps to a tier) and, where the place has a
    // light of its own (a burning rim near by, a bank of gas overhead), the pigment of that light; 15 = none. Its
    // pigment is picked here, by the deck's rule and the law of distance, as the far wall's shader picks its dots:
    // far off the place is paler and its own light sparser.
    float own = mod(pig, 16.), air = deckAir(length(p - cameraPosition));
    pig = deckPick(deckFarT(floor(pig / 16.) / 50., air), hh, air);
    if (pig < .5) pig = uLandDeep;                // (a dab is never the priming)
    if (own < 14.5 && fract(hsh * 71.3) > .7 * air) pig = own;
    // (a dab of a knot, its shadow or its streamer, iAux.w = -0.3: it would come to nothing between 8.4 and 8.9 km from
    // the eye, by the metres from the eye to the dab and nothing else; a guard so that the lens's far distance never
    // cuts a knot: the knots stand on the carpet, where none lies that far from an eye of the route)
    if (iAux.w < -.28) sc *= 1. - smoothstep(8400., 8900., length(p - cameraPosition));
  }
#elif MODE == 1
  // spray: looping flow paths off the rim and fingers
  float life = fract(uTime * iAux.w + hsh * 7.3);
  float len = length(iAux.xyz);
  p = iPos + iAux.xyz * life + curl(iPos * 0.013 + life * 2. + hsh * 6.) * len * 0.13 * life;
  sc = smoothstep(0., .12, life) * (1. - smoothstep(.6, 1., life));
  // while we look back at the globule, the spray between the lens and it parts: the egg is the figure, not the weather
  vec3 cd = uStarPos - cameraPosition; vec3 pd = p - cameraPosition;
  float cl = max(length(cd), 1.), pl = max(length(pd), 1e-3);
  sc *= 1. - uReveal * smoothstep(.5, .82, dot(cd, pd) / (cl * pl)) * (1. - smoothstep(.45, .7, pl / cl));
#elif MODE == 2
  // veil: peel time per dab; loopers (iAux.y) shed for ever
  vec3 rn = iPos - uStarPos; vec3 n = rn / max(length(rn), 1e-3);
  float tl = clamp((uPeel * 1.95 - iAux.x) / 0.5, 0., 1.);   // all but the fringe along the lip lifts away
  float lp = fract(uTime * 0.06 + hsh * 9.);
  float loopOn = step(0.5, iAux.y);
  tl = mix(tl, lp, loopOn);
  p += n * (sin(uTime * 1.3 + hsh * 60.) * 2.5 + 46. * tl) + uWind * (tl * tl * 470.)
     + curl(iPos * 0.012 + uTime * 0.1) * 30. * tl;
  // a lifted dab thins as it goes, so the peel is a clean edge travelling outward and not a cloud across the mouth
  sc = (1. - smoothstep(.3, .9, tl)) * mix(1., smoothstep(0., .08, lp), loopOn);
#elif MODE == 3
  // disc: Keplerian orbits, inner rings faster; iAux = (r, theta0, height, kind)
  float rr = iAux.x;
  float om = 0.7 * pow(45. / max(mix(rr, 80., step(0.5, iAux.w) * step(iAux.w, 1.5)), 22.), 1.5);
  float th = iAux.y + uTime * om;
  p = uStarPos + (uE1 * cos(th) + uE2 * sin(th)) * rr + uAxis * (iAux.z * (1. + 0.15 * sin(uTime * 0.7 + hsh * 30.)));
  sc = smoothstep(31., 38., length(p - uStarPos - uE1 * 80.));   // the rings part round the portal seat: a clean dark pool in the groove
  if (iAux.w > 1.5) sc *= smoothstep(300., 520., length(p - cameraPosition));   // the far generation resolves into the fine one
#elif MODE == 4
  // jets: iAux = (s0, angle, radial 0..1, sign)
  float s = mod(iAux.x + uTime * 260., 900.);
  float jl = uJet * 900.;
  float hd = jl - s;
  float capk = 1. - smoothstep(0., 50., hd);
  float R = mix(8., 40., s / 900.) * (1. + .5 * capk);     // a tapering cone, 8 m at the root and 40 m at the far end
  float knot = smoothstep(.7, 1., sin(s * 0.021 - uTime * 6.5 + iAux.w));
  float an = iAux.y + s * 0.012;
  p = uStarPos + uAxis * (iAux.w * (s + 5.)) + (uE1 * cos(an) + uE2 * sin(an)) * (R * iAux.z * (1. + 0.5 * knot));
  // a stroke of gold and orange with a lemon core and lemon knots, violet beside it; it leaves the star as a thread
  sc = step(0., hd) * (1. - smoothstep(850., 900., s)) * smoothstep(0., 70., s) * (1. + 0.7 * capk + 1.6 * knot) * mix(.85, 1.5, s / 900.);
  if (rot > 50.) sc *= smoothstep(260., 520., length(p - cameraPosition));   // the far generation gives way to the fine one
  // orange, lemon and gold beside ultramarine and violet all the way out: a lemon core, lemon knots, a violet cap
  if (hd < 34. && hh < .55) pig = 3.;                       // the blunt cap is tipped with violet
  else if (pig < 7.5 && iAux.z < .35 && hd > 60.) pig = 9.; // the core is all warm; the cool dabs lie in the sheath beside the orange
  else if (pig < 7.5 && s < 160.) pig = hh < .55 ? 8. : 9.; // the root is all fire, so the star's disc stands clear of it
  else if (pig > 7.5 && ((knot > 0.5 && iAux.z < .62) || iAux.z < .24)) pig = 10.;
  else if (pig > 9.5) pig = hh < .6 ? 8. : 9.;              // lemon is kept for the core and the knots
  emis = pig > 7.5 ? 0.95 + 0.36 * uEmis * knot : 1.;
#elif MODE == 5
  // tadpoles: iPos = centre, iAux.xyz = (along tail, lateral, lateral), w = phase
  float fr = fract(uTime * 0.011 + iAux.w);
  vec3 b1 = normalize(cross(uTail, vec3(0., 1., 0.))); vec3 b2 = cross(uTail, b1);
  float wag = sin(uTime * 1.9 - iAux.x * 0.3 + iAux.w * 40.) * iAux.x * 0.14;
  p = iPos + uTail * ((fr - 0.5) * 150. + iAux.x) + b1 * (iAux.y + wag) + b2 * iAux.z;
  sc = smoothstep(0., .1, fr) * (1. - smoothstep(.9, 1., fr));
#elif MODE == 6
  // a box of dabs wrapped round the camera, drifting on the gas flow; thinned into loose banks
  float bx = iAux.x;
  vec3 w0 = iPos * bx + iAux.yzw * uTime;
  p = cameraPosition + (fract((w0 - cameraPosition) / bx + 0.5) - 0.5) * bx;
  p += curl(p * (3.0 / bx) + uTime * 0.05 + hsh * 6.) * size * 1.5;
  float bank = sin(p.x * 5.1 / bx + 1.3) * sin(p.y * 4.3 / bx + hsh) * sin(p.z * 4.7 / bx + 2.1);
  sc = smoothstep(0.0, 0.3, bank + (hh - 0.5) * 0.4) * step(fract(hsh * 43.7), uStorm) * smoothstep(250., 400., length(p - uStarPos))
     * (1. - smoothstep(0.36, 0.5, length(p - cameraPosition) / bx));
  // the storm parts in front of the globule while we round the tip, so the egg reads as one dark mass
  vec3 cd = uStarPos - cameraPosition; vec3 pd = p - cameraPosition;
  float ca = dot(cd, pd) / (max(length(cd), 1.) * max(length(pd), 1e-3));
  sc *= 1. - uReveal * smoothstep(.5, .82, ca);
#endif
  vec4 mv = modelViewMatrix * vec4(p, 1.);
  mv.xyz *= 1. - min(.3, pull / max(length(mv.xyz), 1.));
  mv.xy += vo;
  float dist = max(length(mv.xyz), 0.01);
#if MODE != 4
  float wm = starWarm(p);
#if MODE == 3
  wm *= .8;                                   // the disc keeps some ultramarine beside the orange
#endif
#if MODE == 0
  if ((iAux.w < -.5 && iAux.w > -1.5) || iAux.w < -3.5 || iAux.w > 1.9) wm = 0.;   // the beacon keeps its lemon and violet beside the star
  if (iAux.w < -1.5) wm *= .16;               // the egg's shell stays a dark mass round the lit hollow: the star only pricks it with rose
#endif
  pig = warmPig(pig, wm, hh);
#if MODE == 0
  // (a dab of the deck, iAux.w = -0.25 or -0.3, keeps the tier of tone it was laid in: the deck cools with distance by its tone)
  if (emis < 1.05 && !(iAux.w < -.1 && iAux.w > -.4)) pig = farPig(pig, dist, fract(hsh * 71.3));
#elif MODE != 3
  if (emis < 1.05) pig = farPig(pig, dist, fract(hsh * 71.3));
#endif
#endif
  vec3 col = uPig[int(pig + 0.5)];
  float breathe = 1. + 0.08 * sin(uTime * (0.4 + hh) + hsh * 90.);

  float px = size * sc * uPxScale / dist;
  float sFar = smoothstep(1.8, 4.2, px);
#if MODE == 0 || MODE == 1
  float capPx = uRes.y * 0.055;               // crust and spray never swell into petals: the next, finer generation takes over
#elif MODE == 4
  float capPx = uRes.y * 0.065;
#else
  float capPx = uRes.y * 0.07;                // nothing swells past 7 % of the frame's height: it parts instead
#endif
  capPx *= capK;
  float sNear = 1. - smoothstep(capPx * 0.85, capPx * 1.5, px);
  vec2 ax = mv.xy; float axl = max(length(ax), 1e-3);
  mv.xy += ax / axl * (1. - sNear) * size * 1.2;
  float r = 0.5 * size * sc * sFar * sNear;
  mv.xyz *= 1. - min(0.5, uPush * size / dist);
  float Z = max(-mv.z, 0.01);
  vec2 m = (-uCamVel.xy - mv.xy * uCamVel.z / Z) / Z;
  float ml = length(m);
  float st = 1. + min(0.8, ml * 1.2);
  vec2 dir = vec2(cos(rot), sin(rot));
  if (ml > 0.25) dir = m / ml;
#if MODE == 0
  // a dab that lies on a form is a stroke laid along its row on the surface (iAux.xyz, a direction fixed in the world:
  // a ring round a pillar, a band round the egg), and a stroke seen end on is as short as it looks
  else if (iAux.w < .5 && (iAux.w > -.1 || (iAux.w < -1.5 && iAux.w > -2.5))) {
    vec2 sd = (viewMatrix * vec4(iAux.xyz, 0.)).xy; float sl = length(sd);
    if (sl > .08) { dir = sd / sl; st *= .62 + .38 * min(sl, 1.); }
  }
#endif
#if MODE == 3
  // every dab of the disc is a stroke laid along its orbit, so the rings read as rings from any distance
  vec2 td = (viewMatrix * vec4(uE2 * cos(th) - uE1 * sin(th), 0.)).xy;
  float tdl = length(td);
  if (tdl > .08) dir = td / tdl;
#endif
#if MODE == 4
  vec2 jd = (viewMatrix * vec4(uAxis, 0.)).xy;   // every dab of a jet is a stroke laid along the jet
  float jdl = length(jd);
  if (jdl > .08) { dir = jd / jdl; st = max(st, 1.45); }
#endif
  vec2 q = position.xy;
  vec2 off = dir * (q.x * min(st * uOvalX, 2.2)) + vec2(-dir.y, dir.x) * q.y;   // a stroke, never a streak
  mv.xy += off * r;
  vUv = q; vQ = off; vCol = col * breathe * emis; vH = hsh;
  vPx = 2. * r * uPxScale / Z;                // the dab's width on screen, for the depth of its impasto
  gl_Position = projectionMatrix * mv;
  vec4 mvPosition = mv;
  #include <fog_vertex>
}`;

const DAB_FS = /* glsl */`
uniform float uManner;
varying vec2 vUv; varying vec2 vQ; varying vec3 vCol; varying float vH; varying float vPx;
#include <fog_pars_fragment>
void main(){
  float d = length(vUv);
  if (uManner > 1.5) {
    // a round-headed stroke, gently bent: the head (left) a little wider than the tail, both ends blunt
    vec2 c = vUv; c.y += 0.26 * c.x * c.x - 0.1;
    float wy = mix(1.3, 1.85, smoothstep(-.5, .9, c.x));
    d = length(vec2(max(abs(c.x) - .34, 0.) / .66, c.y * wy));
  }
  else if (uManner > 0.5) { vec2 a = abs(vUv); d = max(a.x, a.y) * 1.36 + 0.05 * a.x * a.y; }
  float edge = 0.9 + 0.09 * sin(vUv.x * 9. + vH * 31.) * sin(vUv.y * 11. + vH * 17.);
  if (d > edge) discard;
  // impasto, deeper the larger the dab stands on screen: a light ridge where the paint piled up toward the studio
  // light (upper left), a dark lip on the lower right, and the furrows the bristles left along the stroke.
  // Three flat tones of the one pigment, not a gradient: paint, not a lit sphere.
  float big = smoothstep(10., 40., vPx);
  float amp = mix(.06, .2, big);
  vec2 qn = vQ / max(length(vQ), 1e-4);
  float side = dot(qn, vec2(-0.707, 0.707));
  float dn = d / edge;
  float ridge = smoothstep(.42, .8, dn) * side;
  float nb = 5. + floor(vH * 2.99);                                   // five to seven furrows
  float fur = sin(vUv.y * nb * 3.4 + vH * 40. + .9 * sin(vUv.x * 2.6 + vH * 9.));
  fur *= (.55 + .45 * sin(vUv.x * 1.7 + vH * 23.)) * (1. - .6 * smoothstep(.55, .95, dn));
  float v = ridge * 1.25 + fur * (.3 + .4 * big);
  float tone = v > .42 ? 1. : v < -.42 ? -1. : 0.;
  tone = mix(v, tone, .75);
  vec3 col = vCol;
  vec3 hi = max(col, mix(col * 1.1, vec3(.84, .8, .7), .62 * amp));   // toward the pale tint beside it, never past it
  vec3 lo = col * (1. - 1.5 * amp);
  col = tone > 0. ? mix(col, hi, tone) : mix(col, lo, -tone);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// Painted hulls: two crossfading octaves of jittered hex dots, sized from distance (~9 px cells).
const HULL_VS = /* glsl */`
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying float vDist;
#include <fog_pars_vertex>
void main(){
  vP = position; vN = normal; vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  vDist = length(mvPosition.xyz);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const HULL_FS = /* glsl */`
${GLSL_COMMON}
uniform vec3 uGapR, uGapW;
varying vec3 vP; varying vec3 vN; varying vec2 vUv; varying float vDist;
#include <fog_pars_fragment>
float gBowl = 0.;   // how far the star's light has taken the inside of the egg (set in main)
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// g in cell units; returns (hash, hash2, mask)
vec3 dotCell(vec2 g, float wrapN, float rad, float seed){
  float row = floor(g.y); g.x += 0.5 * mod(row, 2.);
  vec2 id = floor(g); vec2 f = fract(g) - 0.5;
  id.x = mod(id.x, wrapN);
  float h = h21(id + seed), h2 = h21(id + seed + 17.3);
  vec2 j = (vec2(h, h2) - .5) * .42;
  vec2 fj = f - j; float dl = uManner > 0.5 && uManner < 1.5 ? max(abs(fj.x), abs(fj.y)) * 1.12 : length(fj);
  if (dl < rad * (0.84 + 0.4 * h2)) return vec3(h, h2, 1.);
  // second grid in the interstices: smaller dabs, so the priming only pricks through
  vec2 gg = g + 0.5; vec2 id2 = floor(gg); vec2 f2 = fract(gg) - 0.5; id2.x = mod(id2.x, wrapN);
  float k = h21(id2 + seed + 71.), k2 = h21(id2 + seed + 33.);
  return vec3(k, k2, step(length(f2), rad * 0.7 * (0.8 + 0.4 * k2)));
}
float discPick(float r, float h){
  vec3 g = step(abs(vec3(r) - uGapR), uGapW * 0.5);
  if (g.x + g.y + g.z > 0.5) return h < .4 ? 1. : h < .75 ? 2. : 3.;
  if (r < 26.) return h < .5 ? 10. : h < .8 ? 9. : 8.;
  if (mod(floor(r / 13.), 2.) < .5) return h < .5 ? 8. : h < .7 ? 9. : h < .9 ? 2. : 10.;
  return h < .5 ? 2. : h < .72 ? 5. : h < .9 ? 8. : 3.;
}
vec3 shadeCell(vec3 c, float l, float warm, float r){
#if HMODE == 1
  float pig = discPick(r, c.x);
  float e = pig > 7.5 ? 1. + 0.2 * uStar * (1. - smoothstep(20., 120., r)) : 1.;
  return uPig[int(pig + .5)] * (0.88 + 0.2 * c.y) * e;
#else
  float pig = pickPig(l + (c.y - 0.5) * 0.14, c.x);   // (a dot strays at most into the band next to its own)
  pig = warmPig(pig, warm, fract(c.x * 17.31));
  float hb = fract(c.x * 29.7 + c.y * 5.3);
  if (hb < gBowl) pig = hb < gBowl * .38 ? 8. : hb < gBowl * .46 ? 9. : 6.;
  pig = farPig(pig, vDist, fract(c.x * 71.3 + c.y * 3.1));
  return uPig[int(pig + .5)] * (0.86 + 0.22 * c.y);
#endif
}
void main(){
  vec3 N = normalize(vN);
  float l = dot(N, uL) * 0.5 + 0.44 + 0.06 * sin(vP.y * 0.02 + vP.x * 0.013);
  float warm = starWarm(vP);
  float r = 0.;
#if HMODE == 2
  vec3 gd = vP - uStarPos; gd /= max(length(gd), 1e-3);
  float rag = 0.09 * sin(gd.x * 9. + gd.y * 5.) * sin(gd.z * 8. - gd.y * 6.) + 0.04 * sin(gd.x * 23. + gd.z * 19.);
  if (dot(gd, uAxis) > 0.42 + rag) discard;
  // (the hollow is a solid banded bowl: rings round the jet axis, the deepest shade and the rose of the turn by turns, so that what the
  // lifting veil uncovers is a body and not a hole)
  if (!gl_FrontFacing) { l = 0.03 + 0.66 * step(0., sin(acos(clamp(dot(gd, uAxis), -1., 1.)) * 26.)); warm = 0.; gBowl = uStar * (.34 + .5 * (1. - smoothstep(-.75, .3, dot(gd, uAxis)))); }   // the hollow takes the star's light: rose, then orange in its depth
  else { l -= 0.17; warm *= 0.2; }             // a dark egg: only the lip of the opening burns
#endif
#if HMODE == 1
  float cw = 8. * vDist / max(uPxScale, 1.);    // finer on the disc, so its rings and gaps survive distance
#else
  float cw = 12. * vDist / max(uPxScale, 1.);
#endif
  float L = log2(max(cw, 0.3)); float i = floor(L); float f = L - i; float cA = exp2(i);
  float radA = 0.47 * (1. - smoothstep(.45, 1., f)), radB = 0.47 * smoothstep(0., .55, f);
#if HMODE == 1
  vec3 rel = vP - uStarPos; vec2 pl = vec2(dot(rel, uE1), dot(rel, uE2));
  r = length(pl); float th = atan(pl.y, pl.x + 1e-5);
  float cB = cA * 2.;
  float rbA = (floor(r / cA) + 0.5) * cA, rbB = (floor(r / cB) + 0.5) * cB;
  float nA = max(6., floor(6.2832 * rbA / cA)), nB = max(6., floor(6.2832 * rbB / cB));
  float omA = 0.7 * pow(45. / max(rbA, 22.), 1.5), omB = 0.7 * pow(45. / max(rbB, 22.), 1.5);
  vec2 gA = vec2(fract((th - uTime * omA) / 6.2832 + 2.) * nA, fract(r / cA));
  vec2 gB = vec2(fract((th - uTime * omB) / 6.2832 + 2.) * nB, fract(r / cB));
  vec3 a = dotCell(gA, nA, radA, floor(r / cA) * 7.1), b = dotCell(gB, nB, radB, floor(r / cB) * 3.3 + 40.);
#else
  vec3 a = dotCell(vUv / cA, 1e6, radA, 0.), b = dotCell(vUv / (cA * 2.) + 3.7, 1e6, radB, 40.);
#endif
#if HMODE == 1
  if (length(pl - vec2(80., 0.)) < 37.) r = uGapR.y;   // the dark pool round the portal seat is painted as the groove is
#endif
  vec3 col = uPig[0] * uPrimeK;
  if (b.z > 0.5) col = shadeCell(b, l, warm, r);
  if (a.z > 0.5) col = shadeCell(a, l, warm, r);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// ---------- small build helpers ----------
class Bank { // instanced dab attributes, kept in typed arrays that grow, so making a mesh from them copies nothing slowly
  constructor() { this.n = 0; this.cap = 2048; this.pos = new Float32Array(this.cap * 3); this.data = new Float32Array(this.cap * 4); this.aux = new Float32Array(this.cap * 4); }
  add(x, y, z, size, hash, pig, rot, a0 = 0, a1 = 0, a2 = 0, a3 = 0) {
    if (this.n === this.cap) {
      this.cap *= 2;
      const p = new Float32Array(this.cap * 3), d = new Float32Array(this.cap * 4), a = new Float32Array(this.cap * 4);
      p.set(this.pos); d.set(this.data); a.set(this.aux); this.pos = p; this.data = d; this.aux = a;
    }
    const i = this.n++, i3 = i * 3, i4 = i * 4, P = this.pos, D = this.data, A = this.aux;
    P[i3] = x; P[i3 + 1] = y; P[i3 + 2] = z;
    D[i4] = size; D[i4 + 1] = hash; D[i4 + 2] = pig; D[i4 + 3] = rot;
    A[i4] = a0; A[i4 + 1] = a1; A[i4 + 2] = a2; A[i4 + 3] = a3;
  }
  get count() { return this.n; }
}

// closed-in-u tube/sheet grid: fn(u, v, out) with u, v in 0..1; uv attribute in metres
function gridGeometry(nu, nv, fn, uMetres, vMetres) {
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), uv = new Float32Array((nu + 1) * (nv + 1) * 2);
  const idx = [], o = new THREE.Vector3();
  let k = 0, q = 0;
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    fn(i / nu, j / nv, o);
    pos[k++] = o.x; pos[k++] = o.y; pos[k++] = o.z; uv[q++] = (i / nu) * uMetres; uv[q++] = (j / nv) * vMetres;
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
    idx.push(a, d, b, a, c, d); // outward for (angle, height) tubes
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function mergeGrids(list) { // tiny merge for position/uv/index geometries
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    pos.set(g.attributes.position.array, vo * 3); uv.set(g.attributes.uv.array, vo * 2);
    const ia = g.index.array;
    for (let i = 0; i < ia.length; i++) idx[io + i] = ia[i] + vo;
    vo += g.attributes.position.count; io += ia.length; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeVertexNormals();
  return out;
}

const TAU = Math.PI * 2;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('nursery-hero') : ctx.rng;
  // Two streams. `rng` deals everything that has a seat (the pillar's and the egg's shape, the jet axis, the fingers,
  // the planets' clumps in the disc, the tadpoles round the egg) and every dab population that is laid as it always
  // was, in one fixed order of draws. `dr` paints the populations that have been repainted since, so that a change
  // in how many dabs one of them takes moves nothing that has a seat. (The world hands it in, forked from a stream
  // that has finished: a fork costs its parent a draw, so it cannot be taken from `rng` here.)
  const dr = opts.dabRng || (ctx.rng.fork ? ctx.rng.fork('nursery-hero-dabs') : rng);
  const noise = ctx.noise;
  const detail = (ctx.quality && ctx.quality.detail) || 1;
  const density = clamp(opts.density ?? 1, 0.4, 1) * (detail < 1 ? 0.5 + 0.5 * detail : 1);
  const palette = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const pigments = makePigments(palette);
  const dabScale = opts.dabScale ?? rng.range(0.9, 1.2);
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

  // ---------- frames ----------
  const L = V3(-0.75, 0.55, 0.35).normalize();            // to the cluster (painted key light)
  const Lh = V3(L.x, 0, L.z).normalize();
  const PH = 1600;
  const leanA = THREE.MathUtils.degToRad(rng.range(10.5, 13.5));
  const leanX = Math.tan(leanA) * PH * 0.97, leanZ = rng.range(30, 90);
  const s1 = rng.range(0, 9), s2 = rng.range(0, 9), o1 = rng.range(-40, 40), o2 = rng.range(-40, 40);
  const axisC = (v, out) => out.set(-leanX * v + 30 * Math.sin(v * 5 + s1) * v, v * PH, leanZ * v + 24 * Math.sin(v * 4 + s2) * v);
  const _c = V3(0, 0, 0);
  const pillarR = (v, a) => {
    let R = lerp(250, 178, v) * (1 - 0.5 * smoothstep(0.78, 1, v)) * (1 + 0.25 * Math.pow(1 - v, 3));
    if (v > 0.9) R *= Math.sqrt(Math.max(0, 1 - Math.pow((v - 0.9) / 0.1, 2)));
    const dx = Math.cos(a), dz = Math.sin(a);
    return R * (1 + 0.26 * noise.fbm3(dx * 1.4 + o1, v * 6 + o2, dz * 1.4, 3) + 0.07 * noise.n3(dx * 4 + o2, v * 22, dz * 4 + o1));
  };
  const pillar = (u, v, out) => { // u = angle/TAU, v = height 0..1
    const a = u * TAU, R = pillarR(v, a);
    axisC(v, _c);
    return out.set(_c.x + Math.cos(a) * R, _c.y, _c.z + Math.sin(a) * R * 0.8);
  };
  const tipTop = axisC(1, V3(0, 0, 0));

  // globule (egg) and its frames
  const egg = V3(rng.range(250, 268), rng.range(272, 292), rng.range(242, 258));
  const G = V3(tipTop.x - 5, PH + 78 + egg.y * 0.93, tipTop.z + 2);
  const og = rng.range(-30, 30);
  const globR = (d) => 1 + 0.07 * noise.fbm3(d.x * 2 + og, d.y * 2, d.z * 2 - og, 3);
  const _d = V3(0, 0, 0);
  const globule = (u, v, out) => {
    const lon = u * TAU - 0.6, lat = (v - 0.5) * Math.PI;
    _d.set(Math.cos(lon) * Math.cos(lat), Math.sin(lat), Math.sin(lon) * Math.cos(lat));
    const k = globR(_d);
    return out.set(G.x + _d.x * egg.x * k, G.y + _d.y * egg.y * k, G.z + _d.z * egg.z * k);
  };
  const jetAz = Math.atan2(0.6, -0.8) + rng.range(-0.18, 0.18), el = THREE.MathUtils.degToRad(50);
  const A = V3(Math.cos(el) * Math.cos(jetAz), Math.sin(el), Math.cos(el) * Math.sin(jetAz)).normalize();
  const E1 = V3(0, 0, 0).crossVectors(A.clone().negate(), V3(0, 1, 0)).normalize(); // camera's right in the dive
  const E2 = V3(0, 0, 0).crossVectors(A, E1).normalize();
  const spin = rng.sign();
  if (spin < 0) E2.negate();
  const gaps = [{ r: 45 + rng.range(-3, 3), width: rng.range(8, 11) }, { r: 80, width: 22 }, { r: 115 + rng.range(-4, 4), width: rng.range(9, 13) }];
  const inGap = (r) => gaps.some((g) => Math.abs(r - g.r) < g.width * 0.5);
  const discPick = (r, h) => {
    if (inGap(r)) return h < 0.55 ? P_DVIOLET : h < 0.85 ? P_ULTRA : P_DVIOLET;
    if (r < 26) return h < 0.5 ? P_LEMON : h < 0.8 ? P_GOLD : P_ORANGE;
    if (Math.floor(r / 13) % 2 === 0) return h < 0.5 ? P_ORANGE : h < 0.7 ? P_GOLD : h < 0.9 ? P_ULTRA : P_LEMON;
    return h < 0.5 ? P_ULTRA : h < 0.72 ? P_PULTRA : h < 0.9 ? P_ORANGE : P_VIOLET;
  };

  // fingers: tapered tubes off the pillar's shoulders; index 0 is the neck that carries the globule
  const fingers = [];
  const mkFrame = (D) => { const n1 = V3(0, 0, 0).crossVectors(D, Math.abs(D.y) > 0.9 ? V3(1, 0, 0) : V3(0, 1, 0)).normalize(); return [n1, V3(0, 0, 0).crossVectors(n1, D).normalize()]; }; // n1 x n2 = -D, so (angle, t) tubes face outward
  {
    const p0 = axisC(0.93, V3(0, 0, 0)), p1 = V3(G.x, G.y - egg.y * 0.9, G.z);
    const D = p1.clone().sub(p0), len = D.length(); D.normalize();
    fingers.push({ p0, D, len, bend: V3(0, 0, 0), fr: mkFrame(D), rad: (t) => 13 + 50 * Math.pow(1 - t, 2.2) + 34 * Math.pow(t, 5), neck: true, seed: rng.range(0, 50) });
    const nF = rng.int(4, 6), a0 = rng.range(0, TAU);
    for (let i = 0; i < nF; i++) {
      // crowd the fingers toward the lit side, like a hand reaching for the cluster
      const a = Math.atan2(Lh.z, Lh.x) + (i - (nF - 1) / 2) * rng.range(0.85, 1.15) + Math.sin(a0 + i) * 0.2;
      const v = rng.range(0.84, 0.91), root = V3(0, 0, 0);
      axisC(v, root); const R = pillarR(v, a) * 0.62;
      root.x += Math.cos(a) * R; root.z += Math.sin(a) * R * 0.8;
      const Df = V3(Math.cos(a) * 0.42 + Lh.x * 0.4, 1, Math.sin(a) * 0.42 + Lh.z * 0.4).normalize();
      const r0 = rng.range(34, 52), lenF = rng.range(150, 270) * (i === 0 || i === nF - 1 ? 0.75 : 1);
      const bend = V3(Lh.x, 0.15, Lh.z).multiplyScalar(rng.range(15, 45));
      const sd = rng.range(0, 50);
      fingers.push({ p0: root, D: Df, len: lenF, bend, fr: mkFrame(Df), seed: sd,
        rad: (t) => (r0 * (1 - 0.72 * Math.pow(t, 0.8)) + 4) * Math.sqrt(Math.max(0, 1 - Math.pow(t, 7))) });
    }
  }
  const finger = (f, u, t, out) => {
    const a = u * TAU, r = f.rad(t) * (1 + 0.22 * noise.n3(Math.cos(a) * 1.3 + f.seed, t * 5, Math.sin(a) * 1.3));
    const b = Math.sin(Math.PI * t * 0.5) * t;
    const ca = Math.cos(a) * r, sa = Math.sin(a) * r, s = f.len * t;
    return out.set(
      f.p0.x + f.D.x * s + f.bend.x * b + f.fr[0].x * ca + f.fr[1].x * sa,
      f.p0.y + f.D.y * s + f.bend.y * b + f.fr[0].y * ca + f.fr[1].y * sa,
      f.p0.z + f.D.z * s + f.bend.z * b + f.fr[0].z * ca + f.fr[1].z * sa);
  };
  await ctx.yield();

  // ---------- shared uniforms ----------
  const U = {
    uTime: { value: 0 }, uPxScale: { value: 400 }, uRes: { value: new THREE.Vector2(800, 450) },
    uStar: { value: 0 }, uFront: { value: 0 }, uPeel: { value: 0 }, uJet: { value: 0 },
    uStarPos: { value: G.clone() }, uAxis: { value: A.clone() }, uE1: { value: E1.clone() }, uE2: { value: E2.clone() },
    uL: { value: L.clone() }, uPig: { value: pigments }, uCamVel: { value: V3(0, 0, 0) },
    uWind: { value: V3(A.x * 0.55, A.y * 0.55 + 0.25, A.z * 0.55 + 0.75).normalize() },
    uTail: { value: L.clone().negate() }, uOvalX: { value: (opts.manner === 2 ? 1.55 : opts.manner === 1 ? 1.0 : rng.range(1.2, 1.4)) }, uEmis: { value: 1.25 },
    uStorm: { value: 1 }, uReveal: { value: 0 }, uManner: { value: opts.manner ?? 0 }, uPrimeK: { value: opts.primeK ?? 2.2 },
    uLandWarm: { value: 1 }, uLandDeep: { value: 1 },       // the deck's share of warm pigment and its deep pigment, by the canvas (the world sets them)
    uGapR: { value: V3(gaps[0].r, gaps[1].r, gaps[2].r) }, uGapW: { value: V3(gaps[0].width, gaps[1].width, gaps[2].width) },
  };
  const fogU = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mats = [];
  const shared = (extra) => { const u = { ...fogU, ...extra }; for (const k in U) u[k] = U[k]; return u; };
  const hullMat = (mode, side) => {
    const m = new THREE.ShaderMaterial({ uniforms: shared({}), vertexShader: HULL_VS, fragmentShader: HULL_FS, defines: { HMODE: mode }, fog: true, side });
    mats.push(m); return m;
  };
  const dabMat = (mode, push) => {
    const m = new THREE.ShaderMaterial({ uniforms: shared({ uPush: { value: push } }), vertexShader: DAB_VS, fragmentShader: DAB_FS, defines: { MODE: mode }, fog: true, side: THREE.DoubleSide });
    mats.push(m); return m;
  };

  // ---------- hulls ----------
  const root = new THREE.Group(); root.name = 'pointillist-nursery-hero';
  const hullParts = [gridGeometry(48, 40, pillar, 1280, 1536)];
  fingers.forEach((f) => hullParts.push(gridGeometry(12, f.neck ? 12 : 9, (u, t, o) => finger(f, u, t, o), 256, Math.max(64, Math.round(f.len / 64) * 64))));
  await ctx.yield();
  const pillarGeo = mergeGrids(hullParts);
  const pillarMesh = new THREE.Mesh(pillarGeo, hullMat(0, THREE.DoubleSide));
  await ctx.yield();
  const globGeo = mergeGrids([gridGeometry(44, 26, globule, 1536, 768)]);
  const globMesh = new THREE.Mesh(globGeo, hullMat(2, THREE.DoubleSide));
  const _t = V3(0, 0, 0);
  const discGeo = mergeGrids([gridGeometry(96, 1, (u, v, o) => {
    const th = u * TAU, r = lerp(7, 153, v);
    // the sheet lies 9 m under the dab layer (seen from the upper, camera side) so it never slices a dab
    return o.copy(G).addScaledVector(E1, Math.cos(th) * r).addScaledVector(E2, Math.sin(th) * r).addScaledVector(A, -9);
  }, 1, 1)]);
  const discMesh = new THREE.Mesh(discGeo, hullMat(1, THREE.DoubleSide));
  for (const m of [pillarMesh, globMesh, discMesh]) { m.frustumCulled = false; root.add(m); }
  await ctx.yield();

  // ---------- dab populations ----------
  const pa = V3(0, 0, 0), pb = V3(0, 0, 0), pc = V3(0, 0, 0), nn = V3(0, 0, 0), tu = V3(0, 0, 0), tv = V3(0, 0, 0);
  const sample = (fn, u, v) => { // -> pa (point), nn (outward normal), tu, tv (unit tangents)
    const e = 0.004, vv = Math.min(v, 1 - e);
    fn(u, vv, pa); fn(u + e, vv, pb); fn(u, vv + e, pc);
    tu.subVectors(pb, pa); tv.subVectors(pc, pa);
    nn.crossVectors(tv, tu);
    if (nn.lengthSq() < 1e-10) nn.set(0, 1, 0);
    nn.normalize(); tu.normalize(); tv.normalize();
  };
  const rotAt = (p, r = rng) => noise.n3(p.x * 0.004, p.y * 0.004, p.z * 0.004) * Math.PI + r.range(-0.35, 0.35);
  const N = (n) => Math.round(n * density);
  const surf = new Bank();
  const sink = { add() {} };                              // takes a dab and lays nothing
  // one dab on a surface and, now and then, its complementary partner 0.6 widths away; `r` is the stream it is drawn
  // from, `bank` where it is laid. In the shade the partner is a rare prick of orange: it is drawn seven times in a
  // hundred, as partners in the shade always were, and laid for half of those, so that the count of draws a dab
  // takes does not depend on how rare the prick is.
  const addSurfOn = (r, bank, p, n, t, flow, size, bias = 0, flag = 0) => {
    const l = n.dot(L) * 0.5 + 0.5 + bias + (r() - 0.5) * 0.16;
    const pig = pickPigment(l, r()), s = size * dabScale;
    bank.add(p.x + n.x * s * 0.15, p.y + n.y * s * 0.15, p.z + n.z * s * 0.15, s, r(), pig, rotAt(p, r), flow.x, flow.y, flow.z, flag);
    const x = r();
    if (x < (l > 0.76 ? 0.36 : 0.07)) {
      const k = 0.6 * s * r.sign(), h = r(), rot = rotAt(p, r);
      if (l > 0.76 || x < 0.035) bank.add(p.x + t.x * k + n.x * s * 0.2, p.y + t.y * k + n.y * s * 0.2, p.z + t.z * k + n.z * s * 0.2, s * 0.55, h, l > 0.76 ? COMPLEMENT[pig] : P_ORANGE, rot, flow.x, flow.y, flow.z, flag);
    }
  };
  const addSurf = (p, n, t, flow, size, bias, flag) => addSurfOn(rng, surf, p, n, t, flow, size, bias, flag);   // laid as it always was
  const paint = (p, n, t, flow, size, bias, flag) => addSurfOn(dr, surf, p, n, t, flow, size, bias, flag);      // a repainted population
  const pass = (p, n, t, flow, size, bias) => addSurfOn(rng, sink, p, n, t, flow, size, bias);                  // draws taken, nothing laid
  const litU = ((Math.atan2(Lh.z / 0.8, Lh.x) / TAU) + 1) % 1;
  // pillar: three generations plus a fine crust along the rim the camera climbs.
  // The three generations have been repainted (a darker body, a heavier seam held to the lit edge) and are laid from
  // `dr`. The stream `rng` first takes the draws they took before the repainting, dab for dab and laying nothing: the
  // planets' clumps and the tadpoles round the egg are dealt from it further down, and so keep their seats.
  for (let i = 0, n = N(2000); i < n; i++) { sample(pillar, rng(), rng.range(0.02, 0.99)); pass(pa, nn, tu, tv, rng.range(42, 68)); if ((i & 255) === 255) await ctx.yield(); }
  for (let i = 0, n = N(17000); i < n; i++) {
    const u = i % 2 ? rng() : litU + rng.gauss() * 0.13;
    sample(pillar, (u + 1) % 1, Math.pow(rng(), 0.6) * 0.99); pass(pa, nn, tu, tv, rng.range(8.5, 15));
    if ((i & 255) === 255) await ctx.yield();
  }
  for (let i = 0, n = N(2800); i < n; i++) {
    sample(pillar, (litU - 0.06 + rng.gauss() * 0.07 + 1) % 1, rng.range(0.06, 0.985)); pass(pa, nn, tu, tv, i % 2 ? rng.range(40, 60) : rng.range(22, 36), 0.22);
    if ((i & 255) === 255) await ctx.yield();
  }
  await ctx.yield();
  // Every generation lies in rows that follow the surface: rings round the pillar at even steps of height, each dab a
  // stroke laid along its ring (the ring's tangent is handed on as the dab's flow), so that close to the pillar it
  // still reads as a turned surface. The pigments are the modelling's own: no generation is pushed lighter or darker.
  const row = (v, m) => (Math.floor(v * PH / m) + 0.5) * m / PH;   // the middle of the row, m metres deep, that height v falls in
  for (let i = 0, n = N(2000); i < n; i++) { const u = dr(); sample(pillar, u, row(dr.range(0.02, 0.99), 52)); paint(pa, nn, tv, tu, dr.range(42, 68), 0); if ((i & 255) === 255) await ctx.yield(); }
  await ctx.yield();
  for (let i = 0, n = N(17000); i < n; i++) {
    const u = i % 2 ? dr() : litU + dr.gauss() * 0.075;
    sample(pillar, (u + 1) % 1, row(Math.pow(dr(), 0.6) * 0.99, 11)); paint(pa, nn, tv, tu, dr.range(8.5, 15), 0);
    if ((i & 255) === 255) await ctx.yield();
  }
  await ctx.yield();
  // the burning contour as the whole canvas sees it: a seam of mid-sized dabs down the lit edge
  for (let i = 0, n = N(5200); i < n; i++) {
    // (held to the lit edge, which is the left-hand contour as the entry sees it, and crowded there so it is unbroken)
    sample(pillar, (litU - 0.035 + dr.gauss() * 0.045 + 1) % 1, row(dr.range(0.06, 0.985), 30)); pa.addScaledVector(nn, 16); paint(pa, nn, tv, tu, i % 2 ? dr.range(36, 54) : dr.range(20, 32), 0.05);
    if ((i & 255) === 255) await ctx.yield();
  }
  await ctx.yield();
  // (the two fine generations of the rim are dealt from `rng` as they always were: each dab's draws are taken at the
  // place it was dealt, with the surface it had there, and the dab is then laid in the middle of its row)
  const n0 = V3(0, 0, 0);
  for (let i = 0, n = N(20000); i < n; i++) {
    const uq = (litU + rng.gauss() * 0.055 + 1) % 1, vq = rng.range(0.47, 0.985);
    sample(pillar, uq, vq); n0.copy(nn); sample(pillar, uq, row(vq, 2.7)); addSurf(pa, n0, tv, tu, rng.range(2, 3.3), 0.05);
    if ((i & 255) === 255) await ctx.yield();
  }
  for (let i = 0, n = N(4000); i < n; i++) {
    const uq = (litU + rng.gauss() * 0.013 + 1) % 1, vq = rng.range(0.55, 0.98);
    sample(pillar, uq, vq); n0.copy(nn); sample(pillar, uq, row(vq, 0.75)); addSurf(pa, n0, tv, tu, rng.range(0.5, 0.9), 0.08);
    if ((i & 255) === 255) await ctx.yield();
  }
  // a fine generation over the whole lit flank, so that large, middling and fine dabs are in view together on the approach
  for (let i = 0, n = N(6000); i < n; i++) { sample(pillar, (litU + dr.gauss() * 0.16 + 2) % 1, row(dr.range(0.55, 0.95), 2.7)); paint(pa, nn, tv, tu, dr.range(2, 3.2), 0); if ((i & 255) === 255) await ctx.yield(); }
  await ctx.yield();
  for (const f of fingers) {
    const fn = (u, t, o) => finger(f, u, t, o);
    for (let i = 0, n = N(420); i < n; i++) { sample(fn, rng(), rng.range(0.03, 0.97)); addSurf(pa, nn, tu, tv, rng.range(7, 12)); }
    await ctx.yield();
    for (let i = 0, n = N(1000); i < n; i++) { sample(fn, rng(), Math.pow(rng(), 0.7) * 0.98); addSurf(pa, nn, tu, tv, rng.range(2, 3.2)); if ((i & 255) === 255) await ctx.yield(); }
    await ctx.yield();
  }
  await ctx.yield();
  // globule shell (outside the opening)
  const rdir = (out, rs = rng) => { const y = rs.range(-1, 1), a = rs.range(0, TAU), r = Math.sqrt(1 - y * y); return out.set(Math.cos(a) * r, y, Math.sin(a) * r); };
  const shellPoint = (d, k, out) => { const g = globR(d) * k; return out.set(G.x + d.x * egg.x * g, G.y + d.y * egg.y * g, G.z + d.z * egg.z * g); };
  const dd = V3(0, 0, 0), ww = V3(0, 0, 0), pp = V3(0, 0, 0);
  const shellFrame = (d) => { // normal nn, tangent tu, flow tv (toward the wind, along the surface)
    nn.set(d.x / egg.x, d.y / egg.y, d.z / egg.z).normalize();
    tv.copy(U.uWind.value).addScaledVector(nn, -U.uWind.value.dot(nn));
    if (tv.lengthSq() < 1e-6) tv.set(1, 0, 0);
    tv.normalize(); tu.crossVectors(nn, tv).normalize();
  };
  // The egg is a banded body: its dabs lie in rings round the jet axis, each a stroke along its ring. `band` moves a
  // direction to the middle of the ring (dc deep, as a share of the radius) it falls in and returns the ring's number;
  // `ringDir` is the ring's tangent there.
  const band = (d, dc) => {
    const k = Math.floor(d.dot(A) / dc), c = clamp((k + 0.5) * dc, -0.995, 0.995);
    ww.copy(d).addScaledVector(A, -d.dot(A));
    if (ww.lengthSq() < 1e-8) ww.copy(E1);
    ww.normalize(); d.copy(ww).multiplyScalar(Math.sqrt(1 - c * c)).addScaledVector(A, c);
    return k;
  };
  const ring = V3(0, 0, 0), ringDir = (d) => { ring.crossVectors(A, d); if (ring.lengthSq() < 1e-8) ring.copy(E1); return ring.normalize(); };
  for (let i = 0, n = N(7400); i < n; i++) {
    rdir(dd); if (dd.dot(A) > 0.5) continue;
    shellFrame(dd); n0.copy(nn);                             // its draws and its pigment are those of the place it was dealt
    band(dd, i < 420 ? 0.13 : 0.045); shellPoint(dd, 1.0, pp); ringDir(dd);
    // (the shell stays dark, but toward the cluster it takes a burning band two or three dabs wide beside the lip)
    addSurf(pp, n0, ring, ring, i < 420 ? rng.range(26, 40) : rng.range(8.5, 14), -0.2 + 0.2 * smoothstep(0.42, 0.66, n0.dot(L)), -2);
    if ((i & 255) === 255) await ctx.yield();
  }
  // the dark face is not one flat mass: about one dab in eight is viridian or pale ultramarine
  for (let i = 0, n = N(950), guard = 0; i < n && guard < 20000; guard++) {
    rdir(dd); if (dd.dot(A) > 0.3 || dd.dot(L) > 0.25) continue;
    // (reflected light in the shade: viridian and rose, close in value, laid in the egg's rings)
    i++; band(dd, 0.045); shellPoint(dd, 1.012, pp); ringDir(dd);
    surf.add(pp.x, pp.y, pp.z, rng.range(8.5, 13) * dabScale, rng(), i % 5 < 2 ? P_VIRID : P_ROSE, rotAt(pp), ring.x, ring.y, ring.z, -2);
  }
  await ctx.yield();
  // the egg's painted contour: warm dabs crowd toward the lit lip in a band some eighty metres wide and stop there,
  // so that from in front the egg is a dark mass inside one burning ring, and from the side it is edged with orange
  // (only on the side turned to the cluster: the lip burns as a crescent there, and the rest of the egg is shade)
  // (which side a dab is on is settled with a draw from `dr`; the pigment then costs one draw of the dab's own stream
  // on either side)
  const litSide = () => nn.dot(L) > 0.55 + (dr() - 0.5) * 0.14;
  const shadePig = (rs = rng) => { const h = rs(); return h < 0.42 ? P_DVIOLET : h < 0.78 ? P_ULTRA : h < 0.96 ? P_VIOLET : P_ROSE; };
  const rimPig = (rs = rng) => { const h = rs(); return h < 0.46 ? P_ORANGE : h < 0.7 ? P_LEMON : h < 0.88 ? P_GOLD : h < 0.95 ? P_ROSE : P_ULTRA; };
  // (the contour band has been repainted narrower and is laid from `dr`; `rng` first takes the draws of the wider
  // band as it was, laying nothing, as for the pillar above)
  for (let i = 0, n = N(2600), guard = 0; i < n && guard < 200000; guard++) {
    rdir(dd); const c = dd.dot(A); if (c < 0.15 || c > 0.38) continue;
    if (rng() > 0.2 + 0.8 * smoothstep(0.15, 0.3, c)) continue;
    i++; shellPoint(dd, rng.range(1.0, 1.035), pp);
    const s = (rng() < 0.7 ? rng.range(6, 11) : rng.range(2.2, 3.6)) * dabScale;
    sink.add(pp.x, pp.y, pp.z, s, rng(), rimPig(), rotAt(pp));
  }
  for (let i = 0, n = N(2600), guard = 0; i < n && guard < 200000; guard++) {
    rdir(dd, dr); const c = dd.dot(A); if (c < 0.22 || c > 0.38) continue;
    if (dr() > 0.2 + 0.8 * smoothstep(0.22, 0.32, c)) continue;
    i++; band(dd, 0.03); shellFrame(dd); shellPoint(dd, dr.range(1.0, 1.035), pp); ringDir(dd);
    const s = (dr() < 0.7 ? dr.range(6, 11) : dr.range(2.2, 3.6)) * dabScale;
    surf.add(pp.x, pp.y, pp.z, s, dr(), litSide() ? rimPig(dr) : shadePig(dr), rotAt(pp, dr), ring.x, ring.y, ring.z, 0);
    if ((guard & 255) === 255) await ctx.yield();
  }
  for (let i = 0, guard = 0; i < 300 && guard < 20000; guard++) {   // the same contour for the far view: a few large dabs
    rdir(dd); const c = dd.dot(A); if (c < 0.2 || c > 0.46) continue;
    i++; shellFrame(dd); shellPoint(dd, 1.02, pp);
    surf.add(pp.x, pp.y, pp.z, rng.range(30, 46) * dabScale, rng(), litSide() ? rimPig() : shadePig(), rotAt(pp), tv.x, tv.y, tv.z, -3);
  }
  for (let i = 0, guard = 0; i < 260 && guard < 40000; guard++) {   // and the flank that faces the cluster, for the whole canvas
    rdir(dd, dr); const c = dd.dot(A); if (c < 0.05 || c > 0.47) continue;
    shellFrame(dd); if (nn.dot(L) < 0.62) continue;
    i++; shellPoint(dd, 1.085, pp);
    surf.add(pp.x, pp.y, pp.z, dr.range(26, 40) * dabScale, dr(), rimPig(dr), rotAt(pp, dr), tv.x, tv.y, tv.z, -3);
  }
  await ctx.yield();
  // the lit lip of the opening: a crowded burning contour so the mouth reads from any distance
  for (let i = 0, n = N(2600), guard = 0; i < n && guard < 200000; guard++) {
    rdir(dd); const c = dd.dot(A); if (c < 0.33 || c > 0.52) continue;
    i++; band(dd, 0.03); shellFrame(dd); shellPoint(dd, rng.range(1.0, 1.03), pp); ringDir(dd);
    const s = (rng() < 0.75 ? rng.range(5, 10) : rng.range(2, 3.4)) * dabScale;
    surf.add(pp.x, pp.y, pp.z, s, rng(), litSide() ? pickPigment(0.9, rng()) : shadePig(), rotAt(pp), ring.x, ring.y, ring.z, 0);
    if ((guard & 255) === 255) await ctx.yield();
  }
  await ctx.yield();
  // the burning lip: a band of loaded dabs round the lit half of the mouth, orange to lemon three to one with
  // ultramarine pricked through, thickest where the lip faces the cluster
  for (let i = 0, n = N(1700), guard = 0; i < n && guard < 200000; guard++) {
    rdir(dd, dr); const c = dd.dot(A); if (c < 0.35 || c > 0.47) continue;
    shellFrame(dd);
    if (dr() > smoothstep(0.42, 0.72, nn.dot(L))) continue;
    i++; band(dd, 0.04); shellPoint(dd, dr.range(1.05, 1.085), pp); ringDir(dd);
    const h = dr();
    surf.add(pp.x, pp.y, pp.z, dr.range(10, 14) * dabScale, dr(), h < 0.63 ? P_ORANGE : h < 0.84 ? P_LEMON : h < 0.9 ? P_GOLD : P_ULTRA, rotAt(pp, dr), ring.x, ring.y, ring.z, 0);
    if ((guard & 255) === 255) await ctx.yield();
  }
  await ctx.yield();
  // the new star: a 6 m cluster of dabs with a violet and orange halo
  surf.add(G.x, G.y, G.z, 10, rng(), P_ORANGE, 0.4, 0, 0, 0, 1);
  for (let i = 0; i < 150; i++) {
    const r = Math.abs(rng.gauss()) * 2.2;
    rdir(dd); surf.add(G.x + dd.x * r, G.y + dd.y * r, G.z + dd.z * r, rng.range(0.6, 2.6), rng(), P_ORANGE, rng.range(0, 3), dd.x, dd.y, dd.z, rng.range(0.6, 1));
  }
  for (let i = 0; i < 40; i++) {                // a hot lemon core, the only thing the whisper of bloom catches
    const r = 4 + Math.abs(rng.gauss()) * 9;
    rdir(dd); surf.add(G.x + dd.x * r, G.y + dd.y * r, G.z + dd.z * r, rng.range(3, 6), rng(), P_ORANGE, rng.range(0, 3), dd.x, dd.y, dd.z, 1.45);
  }
  // the star's far generation, laid facing the lens (MODE 0, iAux.w >= 2; iAux.xy = offset in the picture plane):
  // a loaded lemon disc some 30 m across, a ring of orange dabs 25 m out and their violet partners 34 m out
  surf.add(G.x, G.y, G.z, 30, dr(), P_LEMON, 0.5, 0, 0, 0, 2);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + 0.3; surf.add(G.x, G.y, G.z, dr.range(10, 13), dr(), i % 3 === 2 ? P_GOLD : P_LEMON, a, Math.cos(a) * 11, Math.sin(a) * 11, 0, 2); }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + dr.range(-0.04, 0.04), b = a + TAU / 28;
    surf.add(G.x, G.y, G.z, dr.range(7.5, 9), dr(), P_ORANGE, a + 1.57, Math.cos(a) * 25, Math.sin(a) * 25, 0, 3);
    surf.add(G.x, G.y, G.z, dr.range(6, 7.2), dr(), P_VIOLET, b + 1.57, Math.cos(b) * 34, Math.sin(b) * 34, 0, 4);
  }
  // the beacon: two rings of lemon and gold dabs lying in the disc plane round the portal seat
  // (the outer ring, 40 m out, alternates lemon with its complement, violet: a ringed target that is not the star)
  // (a ring of loaded lemon dabs 24 m out, each with a violet partner outside it, standing in the dark pool; and for the
  // far view a dozen dabs large enough to hold from across the nebula, which give way to the ring as we close)
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * TAU + rng.range(-0.02, 0.02);
    pp.copy(G).addScaledVector(E1, 80 + Math.cos(a) * 27).addScaledVector(E2, Math.sin(a) * 27).addScaledVector(A, 8 + rng.range(-0.5, 0.5));
    surf.add(pp.x, pp.y, pp.z, rng.range(8.5, 10), rng(), i % 4 ? P_LEMON : P_GOLD, a + Math.PI * 0.5, 0, 0, 0, -1);
    const b = a + TAU / 48;
    pp.copy(G).addScaledVector(E1, 80 + Math.cos(b) * 36).addScaledVector(E2, Math.sin(b) * 36).addScaledVector(A, 10 + rng.range(-0.5, 0.5));
    surf.add(pp.x, pp.y, pp.z, rng.range(6, 7.5), rng(), P_VIOLET, b + Math.PI * 0.5, 0, 0, 0, -1);
  }
  for (let i = 0; i < 44; i++) {                // a fine inner ring that still holds when the large dabs part round the lens
    const a = (i / 44) * TAU + rng.range(-0.02, 0.02);
    pp.copy(G).addScaledVector(E1, 80 + Math.cos(a) * 18).addScaledVector(E2, Math.sin(a) * 18).addScaledVector(A, 6 + rng.range(-0.4, 0.4));
    surf.add(pp.x, pp.y, pp.z, rng.range(2.6, 3.6), rng(), i % 3 ? P_LEMON : P_GOLD, a, 0, 0, 0, -1);
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    pp.copy(G).addScaledVector(E1, 80 + Math.cos(a) * 28).addScaledVector(E2, Math.sin(a) * 28).addScaledVector(A, 12);
    surf.add(pp.x, pp.y, pp.z, 21, rng(), i % 4 ? P_LEMON : P_GOLD, a + Math.PI * 0.5, 0, 0, 0, -4);
  }
  for (let i = 0; i < 170; i++) {               // and a lemon crescent laid along the dark groove either side of it
    const da = rng.gauss() * 0.5, r = 80 + rng.range(-7.5, 7.5), k = Math.min(1, Math.abs(da) / 0.9);
    if (Math.abs(da) * 80 < 48) continue;
    pp.copy(G).addScaledVector(E1, Math.cos(da) * r).addScaledVector(E2, Math.sin(da) * r).addScaledVector(A, 2 + rng.range(-0.5, 0.5));
    surf.add(pp.x, pp.y, pp.z, lerp(5.5, 2.2, k) * rng.range(0.8, 1.2), rng(), i % 4 ? P_LEMON : P_GOLD, da * 5, 0, 0, 0, -1);
  }
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU, r = 9 + (i % 2) * 3;
    pp.copy(G).addScaledVector(E1, Math.cos(a) * r).addScaledVector(E2, Math.sin(a) * r).addScaledVector(A, 1.5);
    surf.add(pp.x, pp.y, pp.z, rng.range(2.4, 3.4), rng(), i % 2 ? P_VIOLET : P_GOLD, a, 0, 0, 0, i % 2 ? 0 : 0.35);
  }
  await ctx.yield();

  // veil over the opening
  const veil = new Bank();
  for (let i = 0, n = N(12500); i < n; i++) {
    rdir(dd); const c = dd.dot(A); if (c < 0.3) { if (rng() < 0.9) { i--; } continue; }
    // (the veil lies in the egg's rings too, so the cap over the mouth is banded: every other ring a step lighter)
    const kRing = band(dd, 0.04);
    shellFrame(dd); shellPoint(dd, rng.range(0.99, 1.05), pp);
    const edge = 1 - (c - 0.3) / 0.7;
    const peel = 0.1 + edge * 1.9 + 0.4 * noise.n3(dd.x * 3 + og, dd.y * 3, dd.z * 3);
    // the veil is the egg's own dark skin, violet and ultramarine in rings, pricked with rose and orange: while it holds, the egg is a dark
    // banded cap inside its burning lip, and when it lifts the lit disc is uncovered behind it
    const l = Math.min(0.56, nn.dot(L) * 0.4 + 0.24 + (rng() - 0.5) * 0.1) + (dr() < 0.05 ? 0.1 : 0) + (kRing % 2 ? 0.06 : -0.06);   // (the prick is drawn from `dr`)
    veil.add(pp.x, pp.y, pp.z, (rng() < 0.7 ? rng.range(6, 13) : rng.range(2.5, 4)) * dabScale, rng(), pickPigment(l, rng()), rotAt(pp), peel, edge > 0.4 && rng() < 0.12 ? 1 : 0, 0, 0);
    if ((veil.count & 255) === 255) await ctx.yield();
  }

  // disc, planets and wakes
  const disc = new Bank();
  for (let i = 0, n = N(21000); i < n; i++) {
    const r = 8 + 144 * Math.sqrt(rng());
    if (inGap(r)) continue;
    const big = rng() < 0.3;
    const h = rng.gauss() * (big ? 0.5 : 1) * (3.5 + 4 * r / 150) + (big ? 2.5 : 0);
    disc.add(G.x, G.y, G.z, (big ? rng.range(6, 11) : rng.range(2, 3.4)) * dabScale, rng(), discPick(r, rng()), rng.range(0, 3), r, rng.range(0, TAU), h, 0);
    if ((i & 511) === 511) await ctx.yield();
  }
  // a far generation laid in clean rings, so the target reads from across the globule
  for (let i = 0, n = N(1500), guard = 0; i < n && guard < 20000; guard++) {
    const r = 10 + 140 * Math.sqrt(rng()), sz = rng.range(9, 14);
    if (gaps.some((g) => Math.abs(r - g.r) < g.width * 0.5 + sz * 0.3)) continue;
    i++;
    const pig = r < 26 ? (rng() < 0.6 ? P_LEMON : P_GOLD) : Math.floor(r / 13) % 2 === 0 ? (rng() < 0.7 ? P_ORANGE : P_GOLD) : (rng() < 0.75 ? P_ULTRA : P_VIOLET);
    disc.add(G.x, G.y, G.z, sz * dabScale, rng(), pig, rng.range(0, 3), r, rng.range(0, TAU), 3 + rng.range(-1, 1), 2);
  }
  await ctx.yield();
  const nPlanets = opts.planets ?? rng.int(1, 3);
  const planets = [];
  for (let k = 0; k < nPlanets; k++) {
    const th0 = rng.range(0, TAU) + k * 2.1;
    planets.push(th0);
    disc.add(G.x, G.y, G.z, 6, rng(), P_GOLD, 0.3, 80, th0, 0, 1);
    for (let i = 0; i < 46; i++) disc.add(G.x, G.y, G.z, rng.range(0.8, 2.2), rng(), rng() < 0.7 ? P_ORANGE : P_ULTRA, rng.range(0, 3), 80 + rng.gauss() * 1.4, th0 + rng.gauss() * 0.017, rng.gauss() * 1.4, 1);
    for (let i = 0, n = N(330); i < n; i++) { // spiral wake: inner arm leads, outer arm trails
      const d = rng.range(-10.5, 10.5), lag = -Math.sign(d) * 0.05 * Math.pow(Math.abs(d), 1.45);
      disc.add(G.x, G.y, G.z, rng.range(1, 2.6) * (1 - Math.abs(d) / 16), rng(), rng() < 0.6 ? P_LEMON : rng() < 0.5 ? P_PULTRA : P_GOLD, rng.range(0, 3), 80 + d, th0 + lag + rng.gauss() * 0.012, rng.gauss() * 1.2, 1);
    }
  }
  await ctx.yield();

  // jets
  const jets = new Bank();
  for (let i = 0, n = N(10000); i < n; i++) {
    const h = rng(), size = h < 0.35 ? rng.range(7, 12) : h < 0.9 ? rng.range(2.5, 4) : rng.range(0.7, 1.1);
    const h2 = rng(), pig = h2 < 0.32 ? P_ORANGE : h2 < 0.54 ? P_LEMON : h2 < 0.68 ? P_GOLD : h2 < 0.88 ? P_ULTRA : P_VIOLET;   // orange, lemon and gold with their complements beside them
    jets.add(G.x, G.y, G.z, size * dabScale, rng(), pig, rng.range(0, 3), rng.range(0, 900), rng.range(0, TAU), rng() < 0.7 ? 0.55 + 0.45 * Math.sqrt(rng()) : rng(), i % 2 ? 1 : -1);
    if ((i & 511) === 511) await ctx.yield();
  }

  for (let i = 0, n = N(3000); i < n; i++) { // a far generation so the strokes still read from kilometres away
    const h2 = rng();
    jets.add(G.x, G.y, G.z, rng.range(16, 26) * dabScale, rng(), h2 < 0.32 ? P_ORANGE : h2 < 0.54 ? P_LEMON : h2 < 0.68 ? P_GOLD : h2 < 0.88 ? P_ULTRA : P_VIOLET, 100 + rng.range(0, 3), rng.range(0, 900), rng.range(0, TAU), rng.range(0.08, 0.95), i % 2 ? 1 : -1);
  }
  // spray off the lit rim and fingertips, and thin streamers raining on the disc's edge
  const spray = new Bank();
  // a warm stream: only the pigments of the lit rim, so it reads against the blue wall as spray off a wave
  const sprayPig = (rs = rng) => { const h = rs(); return h < 0.46 ? P_ORANGE : h < 0.72 ? P_LEMON : h < 0.93 ? P_GOLD : P_ROSE; };
  const spraySize = () => { const h = rng(); return (h < 0.64 ? rng.range(2, 3.5) : h < 0.8 ? rng.range(6, 11) : h < 0.85 ? rng.range(14, 24) : rng.range(0.6, 1)) * dabScale; };
  const sprayVel = (n) => ww.set(-0.5 + n.x * 0.3 + rng.range(-0.15, 0.15), 0.75 + rng.range(-0.15, 0.2), 0.25 + n.z * 0.3 + rng.range(-0.15, 0.15)).normalize().multiplyScalar(rng.range(70, 190));   // (it stays by the rim it leaves: a burning fringe along the lit edge, and clear air beyond it)
  for (let i = 0, n = N(6000); i < n; i++) {
    sample(pillar, (litU + rng.gauss() * 0.07 + 1) % 1, rng.range(0.45, 0.99));
    sprayVel(nn); spray.add(pa.x + nn.x * 2, pa.y + nn.y * 2, pa.z + nn.z * 2, spraySize(), rng(), sprayPig(), rng.range(0, 3), ww.x, ww.y, ww.z, rng.range(0.05, 0.11));
    if ((i & 255) === 255) await ctx.yield();
  }
  for (let i = 0, n = N(1900); i < n; i++) {
    const f = fingers[1 + (i % (fingers.length - 1))];
    sample((u, t, o) => finger(f, u, t, o), rng(), rng.range(0.55, 0.99));
    sprayVel(nn); spray.add(pa.x, pa.y, pa.z, spraySize(), rng(), sprayPig(), rng.range(0, 3), ww.x, ww.y, ww.z, rng.range(0.05, 0.1));
  }
  await ctx.yield();
  // spray shed off the egg's lit lip and blown down-wind past its dark back
  // (repainted: thinner, and shed from the lit side only, so it is laid from `dr`; `rng` first takes the draws of the
  // spray as it was shed all round the lip, laying nothing, as for the pillar above)
  for (let i = 0, n = N(2000), guard = 0; i < n && guard < 100000; guard++) {
    rdir(dd); const c = dd.dot(A); if (c < -0.12 || c > 0.42) continue;
    i++; rng.range(-0.15, 0.15); rng.range(-0.15, 0.15); rng.range(-0.15, 0.15); rng.range(170, 430);
    const h = rng();
    sink.add(0, 0, 0, h < 0.5 ? rng.range(2.4, 3.8) : h < 0.9 ? rng.range(6, 11) : rng.range(14, 22), rng(), sprayPig(), rng.range(0, 3), 0, 0, 0, rng.range(0.045, 0.09));
  }
  for (let i = 0, n = N(1100), guard = 0; i < n && guard < 100000; guard++) {
    rdir(dd, dr); const c = dd.dot(A); if (c < 0.12 || c > 0.44) continue;
    shellFrame(dd); if (nn.dot(L) < 0.45) continue;
    i++; shellPoint(dd, 1.03, pp);
    ww.set(-L.x * 0.8 + nn.x * 0.45 + dr.range(-0.15, 0.15), -L.y * 0.8 + nn.y * 0.45 + dr.range(-0.15, 0.15), -L.z * 0.8 + nn.z * 0.45 + dr.range(-0.15, 0.15)).normalize().multiplyScalar(dr.range(170, 430));
    const h = dr();
    spray.add(pp.x, pp.y, pp.z, (h < 0.5 ? dr.range(2.4, 3.8) : h < 0.9 ? dr.range(6, 11) : dr.range(14, 22)) * dabScale, dr(), sprayPig(dr), dr.range(0, 3), ww.x, ww.y, ww.z, dr.range(0.045, 0.09));
    if ((guard & 255) === 255) await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0, n = N(1200); i < n; i++) {
    const a = Math.floor(rng() * 7) * (TAU / 7) + rng.gauss() * 0.05, r = rng.range(170, 235), h = rng.range(-90, 90) * (i % 2 ? 1 : 0.4);
    pp.copy(G).addScaledVector(E1, Math.cos(a) * r).addScaledVector(E2, Math.sin(a) * r).addScaledVector(A, h);
    ww.copy(G).addScaledVector(E1, Math.cos(a + 0.5) * 150).addScaledVector(E2, Math.sin(a + 0.5) * 150).sub(pp);
    const hh = rng();
    spray.add(pp.x, pp.y, pp.z, rng.range(2, 3.4) * dabScale, rng(), hh < 0.4 ? P_ROSE : hh < 0.7 ? P_VIRID : hh < 0.9 ? P_ULTRA : P_ORANGE, rng.range(0, 3), ww.x, ww.y, ww.z, rng.range(0.07, 0.13));
  }
  await ctx.yield();

  await ctx.yield();
  // tadpole globules: dark violet head, orange crescent toward the cluster, rose tail streaming away
  const tad = new Bank();
  const tadpoles = [];
  const nTad = opts.tadpoles ?? rng.int(28, 48);
  for (let k = 0, tries = 0; k < nTad && tries < 600; tries++) {
    rdir(dd); dd.x = -Math.abs(dd.x) * 0.9 + dd.x * 0.35; dd.normalize();
    if (dd.dot(A) > 0.3) continue;              // none in the cone over the mouth: the view into the egg stays open
    pp.copy(G).addScaledVector(dd, rng.range(330, 640));
    if (pp.y < 1380 || pp.y > 2300) continue;
    axisC(clamp(pp.y / PH, 0, 1), _c);
    if (pp.y < 1900 && Math.hypot(pp.x - _c.x, pp.z - _c.z) < 310) continue;
    const len = rng.range(10, 24), ph = rng();
    tadpoles.push(pp.clone()); k++;
    tad.add(pp.x, pp.y, pp.z, len * 0.36, rng(), P_VIOLET, 0.3, 0, 0, 0, ph);
    tad.add(pp.x, pp.y, pp.z, len * 0.24, rng(), P_DVIOLET, 1.2, len * 0.13, len * 0.05, -len * 0.04, ph);
    tad.add(pp.x, pp.y, pp.z, len * 0.2, rng(), P_ULTRA, 2.0, len * 0.05, -len * 0.09, len * 0.06, ph);
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; tad.add(pp.x, pp.y, pp.z, len * rng.range(0.1, 0.15), rng(), i % 3 ? P_ORANGE : P_LEMON, a, -len * 0.17, Math.cos(a) * len * 0.11, Math.sin(a) * len * 0.11, ph); }
    for (let i = 0; i < 18; i++) {
      const s = lerp(0.22, 1.7, i / 17) * len, w = len * 0.04 * (1 + i * 0.12);
      tad.add(pp.x, pp.y, pp.z, len * lerp(0.2, 0.06, i / 17), rng(), i % 5 === 4 ? P_VIRID : i % 7 === 3 ? P_PROSE : P_ROSE, rng.range(0, 3), s, rng.gauss() * w, rng.gauss() * w, ph);
    }
  }

  await ctx.yield();
  // ---------- dab meshes ----------
  const tri = new Float32Array([0, 2, 0, -1.7321, -1, 0, 1.7321, -1, 0]);
  const dabMesh = (bank, mode, push, parent = root) => {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(tri, 3));
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(bank.pos.slice(0, bank.count * 3), 3));
    g.setAttribute('iData', new THREE.InstancedBufferAttribute(bank.data.slice(0, bank.count * 4), 4));
    g.setAttribute('iAux', new THREE.InstancedBufferAttribute(bank.aux.slice(0, bank.count * 4), 4));
    g.instanceCount = bank.count;
    const m = new THREE.Mesh(g, dabMat(mode, push));
    m.frustumCulled = false; if (parent) parent.add(m);
    return m;
  };
  dabMesh(surf, 0, 0.6); await ctx.yield();
  dabMesh(spray, 1, 0); await ctx.yield(); dabMesh(veil, 2, 0.3); await ctx.yield();
  dabMesh(disc, 3, 0.25); await ctx.yield(); dabMesh(jets, 4, 0); await ctx.yield(); dabMesh(tad, 5, 0);
  const dabCount = surf.count + spray.count + veil.count + disc.count + jets.count + tad.count;
  await ctx.yield();

  // ---------- anchors ----------
  const hullPts = [];
  { const a = pillarGeo.attributes.position.array; for (let i = 0; i < a.length; i += 3) if (a[i + 1] > 700) hullPts.push(a[i], a[i + 1], a[i + 2]);
    const b = globGeo.attributes.position.array;
    for (let i = 0; i < b.length; i += 3) { dd.set(b[i] - G.x, b[i + 1] - G.y, b[i + 2] - G.z).normalize(); if (dd.dot(A) < 0.5) hullPts.push(b[i], b[i + 1], b[i + 2]); } }
  const hullDist = (p) => { let best = 1e12; for (let i = 0; i < hullPts.length; i += 3) { const dx = hullPts[i] - p.x, dy = hullPts[i + 1] - p.y, dz = hullPts[i + 2] - p.z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; } return Math.sqrt(best); };
  const clear = (p, dir, need) => { for (let i = 0; i < 60 && hullDist(p) < need; i++) p.addScaledVector(dir, 4); return p; };
  const S = G.clone().addScaledVector(E1, 80);                 // portal seat in the middle gap
  const Q = Lh.clone().addScaledVector(A, -Lh.dot(A)).normalize();
  const rimLine = [], flyThrough = [];
  for (const v of [0.5, 0.58, 0.66, 0.74, 0.82, 0.9]) { sample(pillar, litU, v); rimLine.push(pa.clone()); }
  for (const v of [0.56, 0.66, 0.76, 0.84]) { sample(pillar, litU, v); nn.y = 0; nn.normalize(); flyThrough.push(clear(pa.clone().addScaledVector(nn, 18), nn, 28)); }
  flyThrough.push(clear(tipTop.clone().addScaledVector(Lh, 250).add(V3(0, 90, 0)), Lh, 34));
  flyThrough.push(clear(G.clone().addScaledVector(Lh, 420).add(V3(0, -30, 0)), Lh, 60));
  flyThrough.push(G.clone().addScaledVector(A, 560).addScaledVector(Q, 230).addScaledVector(E1, 40));
  flyThrough.push(S.clone().addScaledVector(A, 1000).addScaledVector(Q, 60));
  flyThrough.push(S.clone().addScaledVector(A, 700), S.clone().addScaledVector(A, 260), S.clone(), S.clone().addScaledVector(A, -40));
  const anchors = {
    globuleCenter: G.clone(), starPos: G.clone(), discNormal: A.clone(), discRadius: 152, gaps,
    discE1: E1.clone(), discE2: E2.clone(),
    portalSeat: { position: S.clone(), normal: A.clone(), radius: 7 },
    flyThrough, rimLine, tipTop: tipTop.clone(), clusterDir: L.clone(),
    viewpoints: {
      entry: V3(tipTop.x + 250, 1300, 2300),
      overTip: G.clone().addScaledVector(Lh, 420).add(V3(0, 60, 0)),
      dive: S.clone().addScaledVector(A, 400),
    },
    jets: [{ root: G.clone(), dir: A.clone(), length: 900, rootRadius: 8, endRadius: 40 },
      { root: G.clone(), dir: A.clone().negate(), length: 900, rootRadius: 8, endRadius: 40 }],
    tadpoles,
    pillarPoint: (u, v, out) => pillar(u, v, out), axisAt: (v, out) => axisC(v, out), litU, hullDist,
    bounds: { radius: 1000, minY: 0, maxY: G.y + 900 * A.y, center: V3(G.x * 0.5, 1400, 0) },
  };

  // ---------- progress and animation ----------
  const stage = { peel: 0, star: 0, jets: 0, front: 0, reveal: 0 };
  const applyStage = () => { U.uPeel.value = stage.peel; U.uStar.value = stage.star; U.uJet.value = stage.jets; U.uFront.value = stage.front; U.uReveal.value = stage.reveal; };
  const setProgress = (u) => {
    u = clamp(u, 0, 1);
    stage.peel = smoothstep(0, 0.6, u); stage.star = smoothstep(0.45, 0.55, u);
    stage.jets = clamp((u - 0.55) / 0.25, 0, 1); stage.front = clamp((u - 0.55) / 0.45, 0, 1);
    applyStage();
  };
  const setStage = (s) => { for (const k in stage) if (s[k] !== undefined) stage[k] = clamp(s[k], 0, 1); applyStage(); };
  setProgress(opts.progress ?? 0.72);

  const res = new THREE.Vector2(), camPos = V3(0, 0, 0), lastPos = V3(0, 0, 0), vel = V3(0, 0, 0);
  const qInv = new THREE.Quaternion(), rootQ = new THREE.Quaternion();
  let lastCam = null;
  const update = (dt, time, camera) => {
    U.uTime.value = time;
    if (!camera) return;
    if (ctx.renderer && ctx.renderer.getDrawingBufferSize) ctx.renderer.getDrawingBufferSize(res); else res.set(1280, 720);
    U.uRes.value.copy(res);
    U.uPxScale.value = camera.projectionMatrix.elements[5] * res.y * 0.5;
    // camera velocity in view space, for the dash stretch; reset when the camera object changes
    camera.getWorldPosition(camPos);
    if (camera === lastCam && dt > 1e-4) {
      vel.subVectors(camPos, lastPos).divideScalar(dt);
      if (vel.length() > 1500) vel.set(0, 0, 0);
      camera.getWorldQuaternion(qInv); qInv.invert(); vel.applyQuaternion(qInv);
      U.uCamVel.value.lerp(vel, 1 - Math.exp(-dt * 16));
    } else U.uCamVel.value.set(0, 0, 0);
    lastCam = camera; lastPos.copy(camPos);
  };

  return {
    object: root,
    radius: 330, height: 560,
    center: G.clone(),
    anchors, update, setProgress, setStage, stage,
    uniforms: U, pigments, dabCount,
    kit: { Bank, DECK_GLSL, dabMesh: (bank, mode, push) => dabMesh(bank, mode, push, null), hullMat, gridGeometry, mergeGrids, pickPigment, COMPLEMENT,
      P: { PRIME: P_PRIME, DVIOLET: P_DVIOLET, ULTRA: P_ULTRA, VIOLET: P_VIOLET, VIRID: P_VIRID, PULTRA: P_PULTRA, ROSE: P_ROSE, PROSE: P_PROSE, ORANGE: P_ORANGE, GOLD: P_GOLD, LEMON: P_LEMON, PVIRID: P_PVIRID } },
    dispose() {},
    ground: false, groundY: 0,
  };
}
