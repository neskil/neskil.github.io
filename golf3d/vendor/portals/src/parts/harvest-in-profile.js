// HARVEST IN PROFILE: the hero. After Giuseppe Arcimboldo (1526 or 1527 to 1593): nobody's head in profile, 500 m tall,
// built wholly of whole vegetables, each a glossy specimen pressed into the next, before THE PAINTED SKY OF AN OLD PANEL (ruling 8 part 5: a departure from
// the painter's own dark grounds, and said as one. See hpGround below).
//
// FRAME (the lead's ruling, NOT the usual "front toward +Z"): origin on the ground under the head's axis, +y up from the
// river (y 0), +x EAST = the way the face looks, +z south; the near (flown, lit) side is -z. Place the object at the world
// origin unrotated; if it is moved, write the new foot into STYLE.uOrigin.
// SIZE: radius about 260 (bust 250 by 430 at the foot, a terrace near y 152 since ruling 7), height 500, centre (0, 300, 0). The head is THE SAME ON EVERY SEED
// (ruling); ctx.rng only deals the brimstones' courses.
// COST (c13, measured: shots/harvest-in-profile/tmp/c13/hero.mjs): 141,006 triangles in skin, leaf and earth and 1,088 in the eight brimstones, 4 draw
// calls; + 17,488 and 3 calls with opts.mirror. Build in node, no page: 0.20 s (0.24 s with the mirror) once warm, 0.46 s the first, cold; 580 calls of
// ctx.yield (645 with the mirror), the longest stretch between two 10 to 17 ms warm, 38 ms cold. No lights, no shadow map, no fog.
// SECTION 181: none brought in (the hashes' constants are the world's own; the usual light weights, a ray against a ball and an ellipsoid, a grid of pieces by place are general methods in this file's own words).
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera), dispose(), mats, meshes,
//   mirror, bounds, specimens, pigments, triangles, ground, groundY }
// opts: palette (the brief's seven hexes: tomato, beet, gold, savoy, lettuce, cream, umber), detail (0.6 to 1, thins every
//   mesh), mirror (true: also build the turned-over proxy for the river), mirrorStrength (0.55), mirrorRipple (1.4 m), mirrorSquash (1: the proxy's height under the water as a share of the head's),
//   brimstones (8).
// No progress hook: by the owner's term c nothing on the head acts, so nothing is keyed to arrival. update() writes
//   STYLE.uTime and eight reused instance matrices (the brimstones, by place and clock); it never reads the camera.
// THE READINGS OF THE VIEW, ALL OF THEM (c12; each with its line in the handoff, FIX 13). AS LIGHT DOES: the direction to the eye for the
//   highlights and sheens (not on the cherries of the eyes, whose light is painted by place), for the grape's amber rim (light through its
//   body, strongest against the sun) and for the painted ground behind a piece, the colour a piece lost BY PLACE goes into; and which side of
//   a leaf or a wing faces the eye (gl_FrontFacing: its normal, its relief's sign, one leaf's pale side). AS A FILTER: the pixel's footprint
//   (fwidth and the texture's own level), by which every drawn pattern finer than the picture's grain goes over to ITS OWN MEAN (never to the
//   bare skin, to full brightness or to nothing: amendment 1 of ruling 11), and the neighbours' differences that give the relief its slope.
//   THE MEANS, each written at its place (c13): the quilted leaf's lit-through light 0.835 of itself (0.7 + 0.3 x 0.45); the bust's beds: their bands' share 0.885,
//   their far cover 0.8956 of the plants' own and the three pigments' weights 0.3396, 0.2101, 0.3503, all by count; the plants' cover and cover times light by
//   their size (K5). ON THE PAGE at 640 and 1,920 across the leaf's mean tone differs by 0.08, 0.30, 0.35 and 0.37 of 255 on the four leaf rects (the quilted leaf at 3,044 m, the leaf at 1,190 m, the vine leaves on the water at 560 m, the kale at 2,799 m; they were 1.07, 0.41, 1.73 and 0.91 until c14 set the ribs' filter to the ribs' own mean), the beds' by 0.12 to 1.43 on rects
//   of a bed or more (five); a rect of some thirty plants by 2.68 (2.83 with no ribs drawn at all: not the ribs'; 2.50 while c13's ribs, heavier at 1,920 than at 640, hid a part), as it did before the means were set: the sample's own departure, not the filter's.
//   NO TERM HERE FADES A THING BY THE EYE'S BEARING OR BY ITS DISTANCE FROM THE LENS. What is untrue and kept: a leaf and a wing are sheets
//   with no thickness; seen edge on they are a line, and nothing hides that. The honest mend would be an edge of their own (a rim of triangles).
//
// ANCHORS (local = world frame above):
//   portalSeat { position (56, 257, 0), normal (+1, 0, 0), radius 12 }: the round, 48 m inside the lips, facing east.
//   mouth: the hollow's box (x 25..125, y 240..274, half width 25), lips, the round. Measured clear radius on the axis 15 m.
//   features: named points (eye, cheek, ear, noseTip, lips, chin, crown ...), for gazes and creature stations.
//   THE PROFILE (ruling 7 part 4, the nose by ruling 8 part 1), front x by level: forehead 97 (y 400 to 420), brow 105 to 107
//     (370 to 380), bridge 89 (360), the gourd's back 135 (340), 147 (330), 153 (320), its blunt end 155 (310), 151 (300),
//     141 (290), under it 121 (280), the mouth's lining 99 to 115 (250 to 270), lower lip 127 (220), notch 121 (210), chin
//     133 (190), beard 115; the neck 78 m from front to back between y 152 and 213; the nape turned in at y 245. Seen from
//     the east the gourd is 24 m wide at y 340, 46 at 330, 52 to 54 at 310 to 320: widest low down.
//   flyThrough: the world's line near the head as it stands after the lead's ruling 3, in order (reveal, vine, low before
//     and beneath the chin, the climb, the hairpin's west point behind the ear, over the shoulder, eye abeam, east, front,
//     the axis, lips, the round). On the world's true line (c9) the head's true triangles are never nearer than 70 m at
//     either eye, 26 m at the gourd (its blossom end), 24 m at the upper lip under it, and 14 m inside the mouth (a half
//     arch of the lining).
//   viewpoints: eye and target for stills 34, 43, 52, 61, 70, 87, 94 as ruling 2's line had them (34, 87 and 94 still hold).   sunDir, bustHeight(x, z).
//
// THE STYLE, exported so the whole world is shaded by one routine:
//   PALETTE, PIGMENTS, SUN_DIR, STYLE (the shared uniform objects: give them to every material, write uTime once).
//   GROUND_GLSL (hpGround(dir): THE GROUND IS A PAINTED SKY by world direction alone: a low band of light, straw toward
//     the sun's bearing and grey blue-green north and south, a slate blue over it, a blue-black umber overhead and nearly
//     down to the level in the west; uG0 the deep, uG1 the body, uG2 the light), makeGroundDome() (the dome that carries it;
//     no disc, no star, nothing that moves).
//   GLAZE_VERT, GLAZE_FRAG, glazeMaterial('SKIN' | 'LEAF' | 'EARTH', { sway, ripple, dim, flap, sun, gloss, cut, top, garden }): the glaze
//     (gloss scales the two highlights, 0.2 on the doubles; cut is the level under which EARTH is not drawn, top the level over which it is not). Flat post:
//     a hex written is the hex shown; there is no inverse tone map. Needs attributes color, aUv, aMat, aPat, aShade.
//   makeGlazeTexture / makeGlazeTextureAsync: the one mipmapped 256 pattern texture.
//   Geo, surf, lathe, leaf, headOf, makeSpecimens(P) (tomato, onion, gourd, husked, courgette, pepper, physalis, courgetteFlower,
//     beet, lemon, pod, fennel, celery, cutCabbage, chard, kale, stalk), trumpet (a squash flower), peaFlower (a runner bean's), seat, aim,
//     frame, leafFrame: the generators, for the garden's cast.
//   bakeShade(geos, bounds, sun, tick): cast shade, crease and bounce into aShade (c13: a vertex asks only the pieces of its own cell on a sheet across the sun; the same bytes). bustHeight, MOUTH.
// WHAT IT EXPECTS AROUND IT: post { flat: 1, bloom: { strength: 0 }, grade neutral }; the dome; the garden planted over the
//   bust (it is soil painted in beds here, by the ruling "the shoulders are ground"); the river sheet over the mirror; the
//   engine's round at portalSeat with its veil (glow 0) and the world's own gold rim #E0A12B round it.
import * as THREE from 'three';
import { makeRng } from '../kit/core.js';

// ---------------------------------------------------------------- pigments
export const PALETTE = ['#C4301C', '#7B1E33', '#E0A12B', '#4F6B33', '#A9BE55', '#E6DAB2', '#1C160F'];
export const PIGMENTS = { // the brief's seven are overridable through opts.palette; the rest are the manner's fixed extras
  tomato: '#C4301C', beet: '#7B1E33', gold: '#E0A12B', savoy: '#4F6B33', lettuce: '#A9BE55', cream: '#E6DAB2', umber: '#1C160F',
  lemon: '#E3C12F', copper: '#C8862F', muscat: '#B8AE4C', bottle: '#2F4A22', violet: '#5A2A4E', bloom: '#8C8EA6', husk: '#C9A25A',
  soil: '#5A4030', glaze: '#3A2412', hi: '#FFF4DC', deep: '#0F0C09', lift: '#2A2217', veil: '#8E5A1E',
};
export const SUN_DIR = new THREE.Vector3(0.569, 0.669, -0.478).normalize(); // direction TO the sun, world frame (+x east = the way the face looks)

// Shared uniforms: every glaze material of the world must hold THESE objects (glazeMaterial does), so one write moves all.
let glazeUsers = 0;   // heads alive on the one pattern texture (a world may follow itself)
export const STYLE = {
  uTime: { value: 0 }, uSun: { value: SUN_DIR.clone() }, uTex: { value: null },
  uOrigin: { value: new THREE.Vector3() },          // world position of the head's foot (the fade by place is measured from it)
  uFade: { value: new THREE.Vector2(700, 2400) },    // NO EDGE OF THE WORLD: planted land and water sink into the ground's own colour over 1,700 m, between these distances from the foot
  uHi: { value: new THREE.Color(PIGMENTS.hi) }, uGlaze: { value: new THREE.Color(PIGMENTS.glaze) },
  uBloom: { value: new THREE.Color(PIGMENTS.bloom) }, uCream: { value: new THREE.Color(PIGMENTS.cream) },
  uWine: { value: new THREE.Color(PIGMENTS.beet) }, uMuscat: { value: new THREE.Color(PIGMENTS.muscat) },
  uThru: { value: new THREE.Color(PIGMENTS.lettuce).lerp(new THREE.Color(PIGMENTS.lemon), 0.22).multiplyScalar(1.18) },   // a garden leaf with the sun behind it: lettuce warmed with lemon, a little over the pigment's own value (clamped to the pigment's range on the screen)
  uViolet: { value: new THREE.Color(PIGMENTS.violet) }, uSoil: { value: new THREE.Color(PIGMENTS.soil) },
  uBedA: { value: new THREE.Color(PIGMENTS.savoy) }, uBedB: { value: new THREE.Color(PIGMENTS.lettuce) }, uBedC: { value: new THREE.Color(PIGMENTS.bottle) },   // the painted beds' three pigments (a world gives its own earth materials three uniforms of its own for its edition)
  uG0: { value: new THREE.Color(PIGMENTS.deep) }, uG1: { value: new THREE.Color('#33424A') }, uG2: { value: new THREE.Color('#988C6A') },   // the painted sky's three: the deep (a blue-black umber overhead), the body (a slate blue with green and grey in it), the light (a pale straw low toward the sun, under 0.58 of white with the brushed fields over it)
};

// ---------------------------------------------------------------- GLSL
// hpGround(dir): THE GROUND IS A PAINTED SKY OF AN OLD PANEL (ruling 8 part 5), by world direction alone. A departure from the
// painter's own dark grounds, and said as one: the head now stands before a sky as a panel painter laid it, not before black.
// BY HEIGHT: a low band of light from the level to about 8 degrees; over it a slate blue with green and grey in it (uG1, the
// body) that deepens upward to about 35 degrees; above about 50 degrees a blue-black umber (uG0, the deep). One slow blended
// turn, no line. BY BEARING: the low band is warmest and lightest toward the sun's bearing (SUN_DIR's x and z), a pale straw
// (uG2, the light, at most 0.58 of white) that goes to a pale green-blue above; south and north it is a grey blue-green
// (0.30 to 0.38); in the west, behind the head, the deep comes nearly down to the level. Three long soft level bars lie low
// toward the sun, a little darker than the band they cross, and are the only cloud. The brushed fields stay. BELOW THE LEVEL
// the low band's own tone, a little darker and greyer, turned in over 2 degrees: land and water lost into it carry no line.
// No disc, no moon, no star, nothing that moves, nothing by the lens. The further tones are constants of the law.
export const GROUND_GLSL = /* glsl */`
uniform vec3 uG0, uG1, uG2;
// one long low bar: cb its bearing on the level circle, q = (its height, its half thickness, its half length as a chord); a flat tone with soft edges, flatter below than above, thinning and fading to both ends
float hpBar(vec2 hz, float up, vec2 cb, vec3 q) { float t = 1.0 - smoothstep(0.3 * q.z, q.z, length(hz - cb)), dq = up - q.x;
  return t * (1.0 - smoothstep(0.45, 1.25, abs(dq) / (q.y * (0.35 + 0.65 * t) * (dq > 0.0 ? 1.3 : 0.7)))); }
vec3 hpGround(vec3 d) {
  vec2 hz = d.xz / max(length(d.xz), 1e-4);                 // the level heading: +x east, +z south
  const vec2 SB = vec2(0.766, -0.643);                      // the sun's bearing
  const vec3 AWAY = vec3(0.0730, 0.1550, 0.1580), SUNB = vec3(0.2754, 0.1716, 0.0672), MIDA = vec3(0.0176, 0.0578, 0.0685), MIDS = vec3(0.0513, 0.0976, 0.0887);
  const vec3 DEEP = vec3(0.0080, 0.0452, 0.0578), TOP = vec3(0.0044, 0.0296, 0.0423), BARA = vec3(0.1200, 0.2000, 0.1950), BARS = vec3(0.3049, 0.1907, 0.0785), HAZA = vec3(0.0482, 0.0931, 0.1170), HAZS = vec3(0.1170, 0.1170, 0.0931);
  float up = d.y, e = max(up, 0.0), b = dot(hz, SB), ws = smoothstep(0.2, 0.95, b);
  vec3 c = mix(AWAY, SUNB, ws);                                                             // the low band by bearing: pale cool green-blue away from the sun, straw to pale gold toward it
  c = mix(c, mix(MIDA, MIDS, ws), smoothstep(mix(0.09, 0.14, ws), mix(0.3, 0.4, ws), e));   // the band turns into the body, a deep saturated blue-green (later and higher toward the sun)
  c = mix(c, DEEP, smoothstep(0.34, 0.6, e));                                                // the body deepens upward
  c = mix(c, TOP, smoothstep(0.62, 0.92, e));                                                 // and the top is the deepest
  float bars = 0.0;
  if (up > 0.05 && up < 0.30) {                                                             // nine long low bars, 6 to 14.5 degrees up, each at its own bearing, height, thickness and length
    bars = max(bars, hpBar(hz, up, vec2(0.6157, -0.7880), vec3(0.120, 0.017, 0.50)));
    bars = max(bars, hpBar(hz, up, vec2(0.9613, -0.2756), vec3(0.205, 0.019, 0.46)));
    bars = max(bars, hpBar(hz, up, vec2(0.9511, 0.3090), vec3(0.150, 0.016, 0.44)));
    bars = max(bars, hpBar(hz, up, vec2(0.5000, 0.8660), vec3(0.105, 0.020, 0.62)));
    bars = max(bars, hpBar(hz, up, vec2(-0.2756, 0.9613), vec3(0.185, 0.018, 0.52)));
    bars = max(bars, hpBar(hz, up, vec2(-0.7880, 0.6157), vec3(0.125, 0.021, 0.66)));
    bars = max(bars, hpBar(hz, up, vec2(-0.9945, -0.1045), vec3(0.215, 0.017, 0.48)));
    bars = max(bars, hpBar(hz, up, vec2(-0.6691, -0.7431), vec3(0.140, 0.020, 0.58)));
    bars = max(bars, hpBar(hz, up, vec2(-0.1392, -0.9903), vec3(0.250, 0.016, 0.42)));
  }
  c = mix(c, mix(BARA, BARS, ws), bars * 0.6);                                             // flat soft tones a step lighter than the sky behind, warm toward the sun
  c = mix(c, mix(HAZA, HAZS, ws), 1.0 - smoothstep(0.022, 0.058, up));                        // at and under the level a strip of haze, darker than the band and bluer: land and water are lost into it
  // brushed fields a few hundred metres across, 3 to 5 percent apart, some olive, some red-brown
  float f1 = sin(d.x * 5.1 + d.y * 3.3 + 1.7) * sin(d.z * 4.3 - d.y * 2.9 + 0.4);
  float f2 = sin(d.z * 7.7 + d.x * 2.1 + 4.0) * sin(d.y * 6.1 + d.x * 3.7 + 2.2);
  c *= 1.0 + 0.045 * f1;
  c += c * vec3(0.05, -0.01, -0.04) * f2 + c * vec3(-0.03, 0.03, -0.02) * f1 * f2;
  return c;
}`;

export const GLAZE_VERT = /* glsl */`
attribute vec2 aUv; attribute vec4 aMat; attribute vec4 aPat; attribute vec3 aShade;
uniform float uTime, uSway, uRipple, uFlap;
varying vec3 vW, vN, vC, vSh; varying vec2 vUv; varying vec4 vMat, vPat;
void main() {
  vec3 p = position;
  #ifdef USE_INSTANCING
    float fa = uFlap * (0.15 + 0.85 * sin(uTime * 8.0 + instanceMatrix[3].x * 1.7 + instanceMatrix[3].y));   // wings (0 on everything that is not a creature)
    p = vec3(p.x * cos(fa), p.y + abs(p.x) * sin(fa), p.z);
  #endif
  #ifdef USE_INSTANCING
    vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vN = mat3(modelMatrix) * (mat3(instanceMatrix) * normal);
  #else
    vec4 w = modelMatrix * vec4(p, 1.0);
    vN = mat3(modelMatrix) * normal;
  #endif
  // garden leaves sway by place and the world's clock (uSway is 0 on the head: the land does not act)
  float k = uSway * aUv.y * 0.012;
  w.x += k * sin(uTime * 0.9 + w.x * 0.031 + w.z * 0.017);
  w.z += k * sin(uTime * 0.7 + w.z * 0.027 - w.x * 0.013 + 1.3);
  w.x += uRipple * (1.0 + max(0.0, -w.y) * 0.006) * sin(uTime * 1.3 + w.z * 0.07 + w.y * 0.11);   // the mirror's ripple, by place and clock (0 everywhere else)
  vW = w.xyz; vC = color; vSh = aShade; vUv = aUv; vMat = aMat; vPat = aPat;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// Forms: SKIN (glossy bodies, husks, cut faces), LEAF (two-sided, veined, lit through), EARTH (matt soil with furrows by place).
// aMat = (gloss 0..1, light-through 0..1 (on EARTH: painted beds 0..1), seed 0..1, special: 0 none, 1 cut face, 2 straw with a rim toward the sun (SKIN), 3 light painted by place (the eye), 4 wine ribs, 5 dark back, 6 a skin body lit through (grapes), 7 a petal lit through in its own pigment (LEAF), 8 a leaf with quiet ribs: the lining, a butterfly's wing (LEAF), 9 / 10 / 11 a broad leaf laid out round its stalk, its outline cut in the glaze: squash (palmate ribs, a pale star), vine (palmate, toothed), bean (a heart; pinnate ribs) (LEAF; leaf() writes them from o.shape))
// aPat = (pores 0..1 (on LEAF: the blade's half width in metres, written by leaf()), rib width in metres or 0 (on LEAF: the side ribs' spacing in metres / 3.2, 0 for a blade with no ribs), blister 0..1 (on LEAF: how far the blade is quilted between its ribs), bloom film 0..1)   aShade = (sun visibility, crease, bounce), baked
// aUv  = the piece's own coordinates in metres: SKIN (round the girth, along the axis); LEAF (across from the midrib, along it) (c15: reader187 in the comments below is the paper design/asb/harvest/c14/means187-table.txt.)
export const GLAZE_FRAG = /* glsl */`
uniform sampler2D uTex; uniform vec3 uSun, uOrigin, uHi, uGlaze, uBloom, uCream, uWine, uMuscat, uViolet, uSoil;
uniform vec2 uFade; uniform float uTime, uDim, uGloss, uCut, uTop, uGarden; uniform vec3 uBedA, uBedB, uBedC, uThru;
varying vec3 vW, vN, vC, vSh; varying vec2 vUv; varying vec4 vMat, vPat;
${GROUND_GLSL}
float hpH(vec2 p) { return fract(sin(dot(p, vec2(146.57, 293.83))) * 40129.3187); } float hpCov(float c, float a, float b) { float t = clamp((c - a) / max(b - a, 1e-6), 0.0, 1.0); return min(c, b) - (b - a) * t * t * t * (1.0 - 0.5 * t); } float hpNet(vec2 p) { vec2 st = p * 256.0 - 0.5, i = floor(st), f = st - i, f2 = f * f, f3 = f2 * f, w0 = (1.0 - 3.0 * f + 3.0 * f2 - f3) / 6.0, w1 = (4.0 - 6.0 * f2 + 3.0 * f3) / 6.0, w3 = f3 / 6.0, g0 = w0 + w1, g1 = 1.0 - g0, a = (i - 0.5 + w1 / g0) / 256.0, b = (i + 1.5 + w3 / g1) / 256.0; return g0.y * (g0.x * textureLod(uTex, a, 0.0).b + g1.x * textureLod(uTex, vec2(b.x, a.y), 0.0).b) + g1.y * (g0.x * textureLod(uTex, vec2(a.x, b.y), 0.0).b + g1.x * textureLod(uTex, b, 0.0).b); }   // hpH: the world's own constants (c13). hpCov (c14, G1): the cover of 1 - smoothstep(a, b, x) from 0 to c, exactly. hpNet (c14, G3): the pattern's cell edge (blue) read by a cubic B-spline of its finest level (four linear taps: exact), so it turns smoothly between texels
// a dot kept inside its own cell (so none is cut at a cell's edge or at the girth's join): g the place in cells, n the cells round the girth (an integer), r the greatest radius in cells (at most 0.29), fw the pixel's footprint in cells. x: its crisp cover, y: its soft dome.
vec2 hpCrk(float d, float hw, float e, float k) { return vec2(clamp((min(d + 0.5 * e, hw) - max(d - 0.5 * e, -hw)) / e, 0.0, 1.0), clamp((min(d + 0.5 * e, 0.5 * hw) - max(d - 0.5 * e, -0.5 * hw)) / e, 0.0, 1.0)) * k; } vec2 hpRing(float ang, float ax, float fa, float fx, float n, float c, float w, float sd) { float g = ang * n, i = floor(g), q = g - i, fg = fa * n + 1e-5, far = smoothstep(0.5, 1.0, fg), a0 = 0.15 * hpH(vec2(i, c * 31.0 + sd)), ln = 0.35 + 0.5 * hpH(vec2(i, c * 31.0 + sd + 11.0)), s = clamp((q - a0) / ln, 0.0, 1.0); return hpCrk(ax - c - (1.0 - far) * (0.0168 * (mix(hpH(vec2(i, sd + 5.0)), hpH(vec2(i, sd + 6.0)), s) - 0.5) + 0.3 * w * sin(9.0 * s + 3.0 * i + sd)), w * mix(pow(sin(3.14159265 * (0.96 * s + 0.02)), 0.6), 0.7574, far), fx, mix(clamp((min(q + 0.5 * fg, a0 + ln) - max(q - 0.5 * fg, a0)) / fg, 0.0, 1.0), 0.6, far)); } vec2 hpRay(float ang, float ax, float fa, float fx, float sd) { float g = ang * 5.0, i = floor(g), fg = fa * 5.0 + 1e-5, far = smoothstep(0.5, 1.0, fg), lo = 1.267 + 0.028 * hpH(vec2(i, sd + 7.0)), s = clamp((ax - lo) / (1.3468 - lo), 0.0, 1.0), k = clamp((min(ax + 0.5 * fx, 1.3468) - max(ax - 0.5 * fx, lo)) / fx, 0.0, 1.0); return mix(hpCrk(g - i - 0.3 - 0.4 * hpH(vec2(i, sd + 8.0)) - 0.0955 * (hpH(vec2(i, sd + 9.0)) - 0.5) * s - 0.00836 * sin(9.0 * s + 3.0 * i + sd), 0.02785 * pow(sin(3.14159265 * (0.96 * s + 0.02)), 0.6), fg, k), vec2(0.0422, 0.0211) * k, far); }   // (c14, G4) A CORK CRACK PAINTED IN A SKIN. hpCrk: its exact share of this pixel (d the place across it, hw its half breadth, e the pixel's reach across, k its share along): x the whole crack, y its dark bed (the middle half). hpRing: n cracks round the girth at the axis place c (in radii), each an arc inside its own n-th. hpRay: five cracks down the meridians from the shoulder to the star. Where a pixel holds a whole n-th of the girth each goes to its mean (an arc 0.6 of its n-th, 0.7574 of its breadth)
// (c15) L180's rays: own mean 0.0422 of a fifth of the girth, dark bed 0.0211 (reader187: 0.04219, 0.02109). (c12) A SOWING OF DOTS ONLY AVERAGES: where the dots are finer than the picture's grain their cover goes over into the sowing's
// own mean (seven cells in ten carry one, of mean square radius 0.62 r r: 1.36 r r of the skin), never to the bare skin; the dome's
// relief goes to nought, which is its mean. The filter is the same for every cell (by the sowing's mean radius), so no dot blinks.
vec2 hpDot(vec2 g, float n, float r, float fw) { vec2 id = floor(g); id.x = mod(id.x, n); vec2 o = (vec2(hpH(id), hpH(id + 17.3)) - 0.5) * 0.3;
  float rr = r * (0.55 + 0.45 * hpH(id + 5.1)), dd = length(fract(g) - 0.5 - o), on = step(0.3, hpH(id + 9.7)), fd = 1.0 - smoothstep(0.3, 0.8, fw / (1.55 * r));
  return vec2(mix(1.36 * r * r, (1.0 - smoothstep(rr - fw, rr + fw, dd)) * on, fd), (1.0 - smoothstep(0.0, rr * 1.2, dd)) * on * fd); }
void main() {
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  #ifdef LEAF
    if (!gl_FrontFacing) N = -N;
  #endif
  vec3 Vv = cameraPosition - vW; vec3 V = Vv / max(length(Vv), 1e-4);
  float gloss = vMat.x * uGloss, thru = vMat.y, seed = vMat.z, spec = vMat.w;
  vec2 uv = vUv + seed * 37.0;
  vec4 ta = texture2D(uTex, uv / 19.2);            // cells 1.2 m apart: pores
  vec4 tb = texture2D(uTex, uv / 173.0 + 0.31);    // slow drift: bloom film, tint, scuffs
  vec4 tc = texture2D(uTex, uv / 64.0 + 0.57);     // cells 4 m: blisters, netting
  vec3 skin = vC * (0.88 + 0.24 * tb.r);
  float h = 0.0;                                   // painted relief in metres
  float pxv = fwidth(vUv.y), px = max(fwidth(vUv.x), pxv);             // the pixel's footprint in metres: relief finer than 3 pixels is left to its flat tint (pxv: its reach along the piece alone)
    // (c12, amendment 1 of ruling 11) EVERY PATTERN BELOW THAT THE FOOTPRINT LETS GO GOES OVER TO ITS OWN MEAN, reckoned from the pattern texture itself: pores 0.2306, lenticels 0.0526, the blemish 0.2697, a leaf's swell 0.76 (a fanned leaf 0.534, the vine's 0.385), the quilting 0.6366, the blisters 0.55 and 0.45, a skin's ribs 0.2229 and 0.7, the net 0.261, the cut face's folds 0.66, the film 0.934. Only the relief (h) goes to nought, which is its mean.
  float pf = 1.0 - smoothstep(0.1, 0.3, px), bf = 1.0 - smoothstep(0.35, 1.0, px);
  #ifdef LEAF
    float pores = 0.0, hb = 0.0; vec2 gs = vec2(0.0);
  #else
    float pores = (vMat.w > 5.5 && vMat.w < 6.5) || (vMat.w > 1.5 && vMat.w < 2.5) ? 0.0 : vPat.x, tieK = 0.0;   // (c13, K1) a straw body's aPat.x is its tie's place, never pores; tieK: the tie's share of this pixel
  #endif
  float pit = (1.0 - smoothstep(0.0, 0.5, ta.g)) * pores;
  h -= pit * 0.07 * pf; skin *= 1.0 - 0.34 * mix(0.2306 * pores, pit, 1.0 - smoothstep(0.5, 1.2, px));   // (the fine speckle is seen while a pore's cell is over a pixel: at 150 m it is four); own mean 0.2306 of pores (reader187: 0.2292)
  float cf = 1.0 - smoothstep(1.0, 2.6, px);                           // the coarse order: lenticels 4 m apart, held to a footprint of 1 to 2.6 m
  float pit2 = (1.0 - smoothstep(0.03, 0.22, tc.g)) * smoothstep(0.35, 0.65, tb.r + 0.4 * tc.a) * pores;   // in drifts, never an even sowing
  h -= pit2 * cf * 0.3 * bf; skin *= 1.0 - 0.3 * mix(0.0526 * pores, pit2, cf);   // own mean 0.0526 of pores (reader187: 0.0507, joint over the three reads)
  float mot = smoothstep(0.42, 0.7, tc.r) * smoothstep(0.35, 0.6, tb.a);   // the glaze lies thicker in patches (a painter's blemish), by the piece's own coordinates
  #ifndef LEAF
    if (pores > 0.0 || spec < 5.5 || spec > 6.5) { skin = mix(skin, skin * vec3(0.8, 0.74, 0.7), mix(0.2697, mot, cf) * 0.5); skin *= 1.0 + 0.1 * mix(0.0357, tc.a - 0.5, cf); }   // own means 0.2697 and 0.0357 (reader187: 0.2693, 0.0357)
  #endif
  #ifdef LEAF
    // A LEAF IS A SPECIMEN ONE COULD PICK, not a ruled plane. Its coordinates are metres from the stalk (across, along); aPat.x
    // is the blade's half width. PINNATE: one pale midrib that tapers, side ribs that leave it alternately, arch toward the tip,
    // FORK half way out and are lost before the rim. PALMATE (special 9: squash, vine): five main ribs fanned from the stalk
    // with a pale star where they meet, each carrying its own side ribs. Between the ribs the blade SWELLS (each half of the
    // blade is a soft pillow: a lit crown falling into a glazed hollow at the midrib and under the rim) and, where aPat.z asks,
    // is QUILTED (a pillow between every two side ribs, blisters on it). The swell and the quilting are relief the light turns
    // on, never a drawn line: every rib is pale paint with a soft shoulder, and there is no dark contour anywhere.
    float Wl = vPat.x, sp = max(vPat.y, 0.5) * 3.2, ribbed = step(0.01, vPat.y), fan = 0.0, edge = 1.0, swl = 0.0, rr = length(vUv);
    vec2 lv = vUv;
    float cutR = 1e9, wvn = 0.0;                                       // the outline of a broad leaf laid out round its stalk (special 9 squash, 10 vine, 11 bean): cut here, so a few triangles carry a true outline
    if (spec > 8.5) {
      float th = rr < 1e-3 ? 0.0 : atan(vUv.x, vUv.y), tha = abs(th), lobe = 0.5 + 0.5 * cos(th * 6.8296), notch = 1.0 - 0.75 * smoothstep(2.3, 2.76, tha);
      if (spec < 9.5) cutR = Wl * (0.8 + 0.22 * pow(lobe + 1e-4, 0.7)) * notch;                    // five blunt lobes about a deep notch
      else if (spec < 10.5) cutR = Wl * (0.5 + 0.56 * pow(lobe + 1e-4, 0.9)) * (1.12 - 0.17 * tha) * notch * (1.0 + 0.05 * (abs(fract(th * 5.5) - 0.5) * 4.0 - 1.0));   // five pointed lobes, toothed
      else if (spec < 11.5) cutR = Wl * 1.45 * (0.4 + 0.6 * pow(0.5 + 0.5 * cos(th) + 1e-4, 1.5) + 0.22 * exp(-th * th / 0.03)) * (1.0 - 0.45 * smoothstep(2.1, 2.9, tha));   // a heart with two round lobes and a drawn point
      else {   // (c12, F4) 17 / 18 A BUTTERFLY'S WING, its length in aPat.x, the angle from its axis toward its leading edge: the forewing's hooked point, the hindwing's one tooth; veins fanned from the root, a brown margin, one orange spot. All by the piece's own coordinates; a vein or a spot finer than the pixel is widened and thinned by px, its mean NOT kept.
        cutR = spec < 17.5 ? Wl * (0.74 + 0.26 * exp(-(th - 0.38) * (th - 0.38) / 0.0121) - 0.05 * exp(-(th - 0.16) * (th - 0.16) / 0.0144) + 0.03 * exp(-(th + 0.3) * (th + 0.3) / 0.04)) * pow((1.0 - smoothstep(0.40, 0.56, th)) * smoothstep(-0.56, -0.30, th) + 1e-6, 0.55)
          : Wl * (0.86 + 0.14 * exp(-(th - 0.02) * (th - 0.02) / 0.0049) - 0.06 * pow(tha + 1e-5, 1.5)) * pow((1.0 - smoothstep(0.42, 0.62, th)) * smoothstep(-0.62, -0.2, th) + 1e-6, 0.5);
        float wu = rr / max(cutR, 1e-3), wd = abs(fract(th * 9.0 + 0.5) - 0.5) / 9.0 * rr, ww = 0.008 * Wl, sr = 0.05, sf = px / max(Wl, 0.05);
        wvn = (1.0 - smoothstep(ww * 0.4, ww + px * 1.5, wd)) * min(1.0, 2.0 * ww / (px * 1.5 + ww)) * smoothstep(0.2, 0.42, wu);   // CODE MATTER, not mended in c15: at 1.5 px = ww a filtered vein covers 1.71 times the drawn 0.7 ww a side
        skin = mix(skin, skin * vec3(0.72, 0.86, 0.5), 0.6 * (1.0 - smoothstep(0.0, 0.42, wu)));                                  // greener by the body
        skin = mix(skin, skin * vec3(0.5, 0.5, 0.25), 0.55 * wvn);                                                               // the veins
        skin = mix(skin, skin * vec3(0.5, 0.38, 0.2), 0.6 * smoothstep(0.88, 0.98, wu) + 0.4 * smoothstep(0.8, 1.0, wu) * wvn);   // the margin, darker where a vein meets it
        skin = mix(skin, vec3(0.67, 0.23, 0.02), (1.0 - smoothstep(sr * 0.6, sr * 1.2 + sf, length(vUv - Wl * vec2(0.03, 0.5)) / max(Wl, 0.05))) * min(1.0, sr * sr / ((sr + 0.5 * sf) * (sr + 0.5 * sf))));   // the spot (see L242)
      }   // CODE MATTER, not mended in c15: filtered, a vein's cover (L237) falls to 0.29 of the drawn at 1.5 px = 40 ww (0.6 along the wing); the spot (L241) is 1.03 times its drawn 0.0065 Wl Wl at sf 0.01, 1.40 times at sf 1 (reader187)
      if (spec < 10.5) {
        float kf = clamp(floor(th / 0.92 + 0.5), -2.0, 2.0), dth = clamp(th - kf * 0.92, -0.46, 0.46);
        lv = rr * vec2(sin(dth), cos(dth)); fan = 1.0;
        edge = 1.0 - smoothstep(0.24, 0.42, abs(dth));                 // a side rib is lost before the next main rib's field begins
        swl = (0.5 - 0.5 * cos(6.8296 * dth)) * rr * 0.42;              // the panel between two main ribs swells, more toward the rim
        float dT = abs(th - kf * 0.92) < 0.46 ? 1.434 * sin(6.8296 * dth) : 0.0, dR = (0.5 - 0.5 * cos(6.8296 * dth)) * 0.42, sT = sin(th), cT = cos(th);
        gs = vec2(cT * dT + sT * dR, cT * dR - sT * dT);                // its slope along the piece's own coordinates
      }
    }
    if (fan < 0.5 && Wl > 0.01) { float sN = clamp(abs(vUv.x) / max(Wl, 0.01), 0.0, 1.0); swl = 4.0 * sN * (1.0 - sN) * Wl; gs.x = 4.0 * (1.0 - 2.0 * sN) * (vUv.x < 0.0 ? -1.0 : 1.0) * step(sN, 0.999) * smoothstep(0.0, 0.22, sN); }   // (the midrib lies in a soft valley, never a hard fold)
    float ax = abs(lv.x), fwx = fwidth(lv.x) + 1e-4;
    float star = fan * (1.0 - smoothstep(0.25 * sp, 1.7 * sp, rr));   // CODE MATTER, not mended in c15: L256's clip loses up to 12.8 parts in 100 of the mid rib's drawn cover (room 0.675 mw, footprint 0.45 mw); 0.725 is true (reader187)
    float mw = 0.15 * sp * clamp(1.2 - lv.y / (7.0 * sp), 0.22, 1.2) * (1.0 + 1.2 * star);   // the midrib is thick at the foot and thins to the tip
    float mwW = 0.55 * mw + 2.0 * fwx, mwA = max(0.725 * mw - 0.5 * mwW, 0.0), room = fan > 0.5 ? 0.444 * rr : (Wl > 0.01 ? Wl : 1e9); float mid = (1.0 - smoothstep(mwA, mwA + mwW, ax)) * min(1.0, hpCov(room, 0.45 * mw, mw) / max(hpCov(room, mwA, mwA + mwW), 1e-5));   // (c14, G1) THE RIB KEEPS ITS OWN MEAN: drawn, a rib covers 0.725 of its width either side (full to 0.45, gone at 1). c13 began its soft edge at the same 0.45 and ended it three footprints further out, so the filtered rib covered 2.0 to 2.45 widths for the drawn 1.45. Now the soft edge (its own 0.55 of a width and two footprints) lies ABOUT the rib's own half-point, so its cover is the drawn cover; a rib finer than that edge is a hairline scaled by the share of cover it has (hpCov: reckoned inside the room it has, to the next main rib's field or the blade's half width)
    float sc = lv.y - ax * 0.85 - 0.22 * ax * ax / sp + min(sp, 4.0) * (1.1 * (tb.g - 0.5) + 0.3 * (tc.r - 0.5));   // side ribs leave the midrib, arch toward the tip and wander (by 4 m at most: on a leaf 100 m long a wider wander broke the pillows into noise)
    float sv = sc / sp + step(0.0, lv.x) * 0.5, fwv = fwidth(sc) / sp + 1e-4;
    float fk = smoothstep(0.75, 1.5, ax / sp);                          // where a side rib forks in two
    float tpr = (1.0 - smoothstep(0.4, 2.4, ax / sp)) * (Wl > 0.01 && fan < 0.5 ? 1.0 - smoothstep(0.5, 0.86, ax / max(Wl, 0.01)) : 1.0);   // ... and dies out before the rim
    float wv = 0.1 * (0.25 + 0.75 * tpr) * (1.0 - 0.35 * fk), dv = abs(abs(fract(sv) - 0.5) - 0.17 * fk);   // CODE MATTER, not mended in c15: L262's clip loses up to 5.6 parts in 100 of the side ribs' cover; 1.4 widths is true (reader187)
    float wvW = 0.6 * wv + 2.5 * fwv, wvA = max(0.7 * wv - 0.5 * wvW, 0.0), fkd = 0.17 * fk; float side = (1.0 - smoothstep(wvA, wvA + wvW, dv)) * min(1.0, (hpCov(fkd, 0.4 * wv, wv) + hpCov(0.5 - fkd, 0.4 * wv, wv)) / max(hpCov(fkd, wvA, wvA + wvW) + hpCov(0.5 - fkd, wvA, wvA + wvW), 1e-5)) * tpr * smoothstep(mw, mw * 2.0 + fwx, ax) * edge;   // (c14, G1) the side ribs likewise: 1.4 widths a rib, reckoned over their own spacing (half of it either side, less the fork's reach), so where the footprint holds a whole spacing they are their mean and never nothing (c13: half as much again at eight pixels a spacing, a third at one)
    float vein = max(max(mid, side) * ribbed, wvn);                            // aPat.y 0: a blade with no ribs (a wing, a body in this form)
    // the broad relief (kept apart: the one point of light sits on it, not on the blisters)
    float swf = 1.0 - smoothstep(0.1, 0.3, px / max(fan > 0.5 ? rr * 0.42 : Wl, 0.05));   // a blade under about six pixels wide is its flat mean
    float qf = 1.0 - smoothstep(0.12, 0.45, px / sp), pile = smoothstep(mw, mw * 3.0 + 0.2 * sp, ax) * tpr * edge, pil = abs(cos(3.14159 * sv)) * pile * qf;   // the pillow between two side ribs
    float swn = swl / max(fan > 0.5 ? rr * 0.42 : Wl, 0.05);            // 0 in the hollows, 1 on the crown of the swell
    hb = ribbed * (gl_FrontFacing ? 1.0 : -1.0) * 0.1 * sp * pil * vPat.z; gs *= ribbed * (gl_FrontFacing ? 1.0 : -1.0) * 0.2 * swf;   // L269's swell: mean 0.76 pinnate, 0.534 fanned, 0.385 vine (reader187: 0.747 to 0.777, 0.5336, 0.3849)
    skin = mix(skin, mix(skin * vec3(0.4, 0.52, 0.36) + uGlaze * 0.07, skin * 1.1, mix(fan > 0.5 ? (spec < 9.5 ? 0.534 : 0.385) : 0.76, smoothstep(0.0, 0.85, swn), swf)), ribbed * 0.9);   // a lit crown; bottle green and brown glaze in the hollows
    skin *= 1.0 - 0.3 * vPat.z * ribbed * (1.0 - mix(0.6366 * pile, pil, qf)) * tpr;   // THE QUILTING between the side ribs: each pillow's foot holds the dark glaze (ruling 8 part 4); own mean 0.6366 of pile (reader187: 0.63662)
    // CODE MATTER, not mended in c15: qf is in pil already (L266) and mixes again in the line above, so mid-fade the quilting's mean dips to 0.4775 of pile (at qf 0.5) against its own 0.6366 (reader187)
    // NO SPECKLE: a blister is drawn only while its cell is over about eight pixels (the 1.2 m order goes first, the 4 m order later), and it is a soft swell
    float lf1 = 1.0 - smoothstep(0.05, 0.15, px), lf2 = 1.0 - smoothstep(0.28, 0.75, px), lfm = max(lf1, lf2);
    float b1 = (1.0 - smoothstep(0.05, 0.62, ta.g)) * lf1, b2 = (1.0 - smoothstep(0.1, 0.55, tc.g)) * lf2;   // CODE MATTER, not mended in c15: lf2 is in b2 and lfm mixes again (L278): crowns' weight 0.3635 at lf2 0.5, not 0.45 (reader187)
    float bl = max(b1 * 0.6, b2) * (1.0 - vein);                      // swollen cells between the ribs
    h += (bl * 0.2 * vPat.z + vein * 0.03 * sp) * lfm;                 // a rib stands a little proud, with a soft shoulder
    float blm = bl + 0.104 * (1.0 - lf1) * (1.0 - vein); skin *= 1.0 - vPat.z * 0.2 * mix(0.55, 1.0 - blm, lfm);             // the hollows between blisters hold the darker glaze; own mean 0.55 (reader187: 0.5528, fine order let go 0.5501)
    skin = mix(skin, skin * 1.16 + vec3(0.008, 0.016, 0.0), vPat.z * mix(0.45, blm, lfm) * 0.6);   // and each blister's crown is a paler green; own mean 0.45 (reader187: 0.4472, fine order let go 0.4499)
    skin *= 0.9 + 0.2 * tb.a;                                          // a leaf is never one even green
    vec3 ribc = spec > 3.5 && spec < 4.5 ? uWine : uCream;
    if (spec > 4.5 && spec < 5.5 && !gl_FrontFacing) skin *= vec3(0.3, 0.42, 0.3);       // special 5: a leaf whose pale underside is its face; the back is the dark upper side
    float vk = spec > 7.5 && spec < 8.5 ? 0.16 : spec > 3.5 && spec < 4.5 ? 0.9 : 0.5;   // special 8: a lining leaf, its ribs held back
    skin = mix(skin, ribc * (0.75 + 0.25 * tb.r), max(max(mid * vk, side * vk * (spec > 3.5 && spec < 4.5 ? 0.3 : 0.62)) * ribbed, star * 0.22));
    if (rr > cutR) discard;   // ribs are pale paint (special 4: one thick wine midrib, its side ribs barely tinted); the pale star at a palmate leaf's stalk
  #else
    float rw = max(vPat.y, 0.05);
    float rr = abs(fract(vUv.x / rw) - 0.5) * 2.0;
    float fr = fwidth(vUv.x / rw) * 2.0 + 1e-4;
    float gv = smoothstep(0.4, 1.0, rr), rfd = 1.0 - smoothstep(0.14, 0.36, fr);                               // a rib is a broad swelling with a soft groove either side, never a ruled hairline
    float rib = step(0.01, vPat.y) * gv * gv * rfd;
    skin *= 1.0 - (rw > 4.0 ? 0.3 : 0.15) * step(0.01, vPat.y) * mix(0.2229, gv * gv, rfd); skin = mix(skin, skin * 1.1 + 0.015, step(0.01, vPat.y) * mix(0.7, 1.0 - gv, rfd) * 0.5);   // own means 0.2229 and 0.7 (reader187: 0.22286, 0.7)
    h -= rib * min(0.5, 0.2 * rw) * (rw > 4.0 ? 0.3 : 1.0) * (1.0 - smoothstep(0.07, 0.2, fr));   // a broad groove is painted more than it is cut: a cut one glints in dots
    if (spec > 1.5 && spec < 2.5) {                 // (c12, W4) STRAW IS DRAWN: every rib a bundle of stalks of its own tone, pale to tawny, a dark line between two; a bundle finer than two pixels goes into the mean it had, the line between two with the ribs' own fade (rfd); each factor's mean is 1
      float sid = floor(vUv.x / rw), tn = hpH(vec2(sid, 3.1 + floor(seed * 40.0)));
      skin *= mix(1.0, 0.66 + 0.68 * tn, 1.0 - smoothstep(0.5, 1.2, fr)) * mix(1.0, (1.0 - 0.3 * gv * gv) * 1.072, rfd);
      if (vPat.x > 0.5) {                           // (c13, K1) THE SHEAF'S TIE IS DRAWN: a band of twisted straw 1.8 m broad at the waist (aPat.x: its place along the piece), darker and browner than the straw it binds.
        // It lies in the sheaf's own skin, so it follows every lobe (c12's ring of 6 or 10 flat sides was pierced by them: a zigzag). Its edge is the band's exact share of the footprint
        // (a box of the pixel's own reach along the piece), so a band finer than the pixel goes over into ITS OWN MEAN; its twisted strands (each factor's mean 1) go first.
        float e2 = max(pxv, 0.02), dT = vUv.y - vPat.x, tie = clamp((min(dT + 0.5 * e2, 0.9) - max(dT - 0.5 * e2, -0.9)) / e2, 0.0, 1.0);
        float tws = 0.5 + 0.5 * sin(6.2831853 * (vUv.x / (2.0 * rw) + dT * 0.9));
        skin = mix(skin, skin * vec3(0.3, 0.2, 0.12) * mix(1.0, 0.78 + 0.44 * tws, 1.0 - smoothstep(0.2, 0.55, px)), tie); tieK = tie;
      }
    }
    float nz = spec > 11.5 ? 0.0 : vPat.z, ne = max(0.175, 1.65 * px), net = nz > 0.0 ? smoothstep(0.723 - ne, 0.723 + ne, hpNet(uv / 64.0 + 0.57)) * nz : 0.0; h += net * 0.35 * bf; skin = mix(skin, skin * 1.25 + 0.04, mix(0.261 * nz, net, 1.0 - smoothstep(0.2, 0.6, px)) * 0.5);   // (c14, G3) THE NET: c13 read the cell edge linear between its 0.25 m texels and raised 0.35 m of relief on a 0.32 m ramp of it: every texel a facet (steps), and dots where the ramp was finer than the pixel. Now the edge is read smoothly (hpNet) and the ramp is never finer than three pixels; by count its own mean stays 0.261 (0.249 to 0.266 as it broadens)
    if (spec > 11.5) {                              // THE KINDS' OWN DRAWINGS (c11): by the piece's own coordinates in its own radii (aPat.z: its radius), an integer count round the girth, crisp to the picture's grain.
      // (c12) A DRAWING ONLY AVERAGES: c11 switched these off where a pixel held more than 1.2 to 1.45 m of skin (kf) and let each stroke go to the BARE skin
      // where it was finer than a pixel, so a 640 picture and a 1920 picture of the same place showed two different bodies. Now each stroke, where it is finer
      // than the grain, goes over into ITS OWN MEAN TINT (its mean breadth times its mean strength, the same for every stroke of the kind), at any distance.
      float Rk = max(vPat.z, 0.5), ang = vUv.x / (6.2831853 * Rk), ax = vUv.y / Rk;
      float fa = fwidth(ang) + 1e-5, fx = fwidth(ax) + 1e-5, sd = seed * 40.0;
      if (spec < 12.5) {                            // 12 TOMATO: short pale gold strokes down the meridians to the shoulder, at 36 places round the girth, and gold flecks
        float g = ang * 36.0 + 0.10 * sin(ax * 5.0 + sd), id = mod(floor(g), 36.0), fw = fwidth(g) + 1e-4;
        float w = mix(0.11, 0.24, hpH(vec2(id, 3.7))), lo = mix(0.1, 0.8, hpH(vec2(id, 8.1))), top = 1.0 - smoothstep(1.2, 1.36, ax);
        float st = (1.0 - smoothstep(w - fw, w + fw, abs(fract(g) - 0.5))) * step(0.3, hpH(vec2(id, 1.3))) * smoothstep(lo, lo + 0.3, ax) * top;
        st = mix(0.245 * smoothstep(0.1, 1.1, ax) * top, st, 1.0 - smoothstep(0.35, 0.9, fw / 0.35)); skin = mix(skin, skin * vec3(1.1, 2.6, 1.0) + vec3(0.05, 0.06, 0.0), 0.75 * st);   // strokes' own mean 0.245 (reader187: 0.2450)
        vec2 dk = hpDot(vec2(ang * 60.0, ax * 9.55), 60.0, 0.2, max(fa * 60.0, fx * 9.55)); skin = mix(skin, skin * 1.3 + vec3(0.10, 0.07, 0.01), 0.45 * dk.x);
        { float sq = floor(sd + 0.5); vec2 ck = hpRing(ang, ax, fa, fx, 5.0, 1.337, 0.0098, sq); if (spec > 12.1) ck = max(hpRing(ang, ax, fa, fx, 6.0, 1.3608, 0.0098, sq), max(hpRing(ang, ax, fa, fx, 7.0, 1.302, 0.0196, sq), hpRay(ang, ax, fa, fx, sq)));   // (c14, G4) THE CORK CRACKS ARE PAINTED HERE, in the tomato's own skin (c13: raised ribbons that tapered to nothing: finer than the grain they drew as dots). One ring of five; the hero's (special 12.25) two rings of six and seven and five down the shoulder. Each is its exact share of the pixel, so a crack finer than the grain goes over into ITS OWN MEAN: pale lips, a dark bed, matt. The seed is ROUNDED before it feeds the hash: a varying is not the same number in every pixel, and a hash of it tears the crack into specks
          float tn = 0.88 + 0.24 * tb.r; skin = skin * (1.0 - ck.x) + vec3(0.3490, 0.1756, 0.0358) * tn * (ck.x - ck.y) + vec3(0.2262, 0.1048, 0.0230) * tn * ck.y; gloss = mix(gloss, 0.08 * uGloss, ck.x); }
      } else if (spec < 13.5) {                     // 13 GOURD: long stripes of unlike breadth with wavering edges, deeper and greener, and pale flecks standing a little proud.
        // Eleven on a smooth gourd; on a RIBBED one (aPat.y: a rib's breadth in metres, a whole number of them round the girth) one stripe lies in each furrow, and
        // the ribs carry WARTS: pale raised domes of unlike size, each inside its own cell
        float ribbed = step(0.01, vPat.y), ns = mix(11.0, floor(6.2831853 * Rk / max(vPat.y, 0.05) + 0.5), ribbed);
        float g = ang * ns + 0.5 * ribbed + 0.07 * sin(ax * 2.6 + sd) + 0.03 * sin(ax * 7.3 + sd * 1.7), id = mod(floor(g), ns), fw = fwidth(g) + 1e-4;
        float w = mix(0.11, 0.34, hpH(vec2(id, 4.9)));
        float st = (1.0 - smoothstep(w - fw - 0.02, w + fw + 0.02, abs(fract(g) - 0.5))) * (0.6 + 0.4 * hpH(vec2(id, 2.2)));
        st = mix(0.36, st, 1.0 - smoothstep(0.35, 0.9, fw / 0.45));   // the stripes' own mean 0.36: mean breadth 0.45 of the period at a mean strength of 0.8 (reader187: 0.3600 by the rule, 0.3508 over a smooth gourd's eleven)
        skin = mix(skin, skin * vec3(0.52, 0.80, 0.42), 0.8 * st);
        vec2 dk = hpDot(vec2(ang * 31.0, ax * 4.93), 31.0, 0.2, max(fa * 31.0, fx * 4.93));
        skin = mix(skin, skin * 1.45 + 0.03, 0.7 * dk.x); h += dk.y * 0.2 * bf;
        if (ribbed > 0.5) { vec2 wt = hpDot(vec2(ang * 19.0 + 0.4, ax * 3.02 + 0.3), 19.0, 0.27, max(fa * 19.0, fx * 3.02));
          skin = mix(skin, skin * vec3(1.22, 1.18, 0.8) + vec3(0.05, 0.045, 0.0), 0.8 * wt.x); h += wt.y * 0.55 * bf; }
      } else if (spec < 14.5) {                     // 14 BEETROOT: uneven rings round the girth with earth in them, each broken at its own places
        float g = ax * 2.6 + 0.22 * sin(ang * 6.2831853 * 3.0 + sd) + 0.1 * sin(ang * 6.2831853 * 7.0 + 1.7), id = floor(g), fw = fwidth(g) + 1e-4;
        float w = mix(0.10, 0.22, hpH(vec2(id, 6.3)));
        float st = (1.0 - smoothstep(w - fw, w + fw, abs(fract(g) - 0.5))) * smoothstep(-0.2, 0.3, sin(ang * 6.2831853 * (2.0 + floor(3.0 * hpH(vec2(id, 0.7)))) + id * 2.4));
        float fd = 1.0 - smoothstep(0.35, 0.9, fw / 0.32);
        vec3 ink = mix(0.5 * (skin * 1.8 + vec3(0.030, 0.018, 0.012)) + 0.5 * mix(skin * 0.45, uSoil, 0.35), hpH(vec2(id, 5.2)) > 0.5 ? skin * 1.8 + vec3(0.030, 0.018, 0.012) : mix(skin * 0.45, uSoil, 0.35), fd);
        st = mix(0.18, st, fd);   // CODE MATTER, not mended in c15: this flat 0.18 stands against the rings' own mean 0.155 (mean breadth 0.32 of the period x the breaks' mean 0.484; reader187: 0.1549)
        skin = mix(skin, ink, 0.8 * st); h -= st * 0.15 * bf * fd;
      } else if (spec < 15.5) {                     // 15 LEMON: the peel's dimples in two orders
        vec2 d1 = hpDot(vec2(ang * 31.0, ax * 4.93), 31.0, 0.27, max(fa * 31.0, fx * 4.93)), d2 = hpDot(vec2(ang * 79.0 + 0.37, ax * 12.57 + 0.61), 79.0, 0.27, max(fa * 79.0, fx * 12.57));
        float dmp = max(d1.x, 0.7 * d2.x); skin = mix(skin, skin * vec3(0.66, 0.74, 0.5), 0.75 * dmp); h -= (d1.y * 0.22 + d2.y * 0.08) * bf;   // CODE MATTER, not mended in c15: both sowings flat give 0.0991, drawn mean 0.1614 (reader187)
      } else {                                      // 16 FENNEL: fine green veins up the sheaths, 26 round the girth, each of its own breadth, each broken at its own heights
        float g = ang * 26.0 + 0.05 * sin(ax * 3.1 + sd), id = mod(floor(g), 26.0), fw = fwidth(g) + 1e-4;
        float w = mix(0.11, 0.2, hpH(vec2(id, 2.9))), foot = smoothstep(0.12, 0.4, ax);
        float st = (1.0 - smoothstep(w - fw, w + fw, abs(fract(g) - 0.5))) * foot * (0.55 + 0.45 * smoothstep(-0.3, 0.3, sin(ax * (2.0 + 3.0 * hpH(vec2(id, 7.7))) + id * 1.9)));
        st = mix(0.24 * foot, st, 1.0 - smoothstep(0.35, 0.9, fw / 0.31));   // the veins' own mean 0.24 of foot: mean breadth 0.31 of the period at a mean strength of 0.775 (reader187: 0.24025 by the rule, 0.2393 over this hash's 26)
        skin = mix(skin, skin * vec3(0.55, 0.78, 0.42), 0.8 * st);
      }
    }
    if (spec > 0.5 && spec < 1.5) {                 // the cut face: a maze of cream folds in violet, a cream heart at the foot
      vec2 q = vUv; float ang = abs(q.x) + abs(q.y + 20.0001) < 1e-3 ? 0.0 : atan(q.x, q.y + 20.0001);
      float d = length(vec2(q.x * 1.12, q.y + 10.0)) + 2.3 * sin(ang * 9.0 + q.y * 0.21) + 1.4 * sin(ang * 17.0 - q.x * 0.33) + 1.5 * sin(q.x * 0.5 + q.y * 0.37);
      float band = abs(fract(d / 5.2) - 0.5) * 2.0, fb = fwidth(d / 5.2) * 2.0 + 1e-4;
      float fold = mix(0.66, smoothstep(0.34 - fb, 0.34 + fb, band), 1.0 - smoothstep(0.2, 0.34, fb));   // the folds' own mean 0.66: band is even on 0 to 1 and the fold is cut at 0.34 (reader187: 0.6600)
      float heart = 1.0 - smoothstep(0.0, 1.0, (abs(q.x) * (1.6 + 0.05 * (q.y + 31.0)) - 7.0 + (q.y + 31.0) * 0.22) / 3.0);
      heart *= 1.0 - smoothstep(-2.0, 6.0, q.y);
      skin = mix(uCream * (0.82 + 0.2 * ta.a), uViolet * (0.8 + 0.5 * tb.r), fold * (1.0 - heart));
      h += (1.0 - smoothstep(0.34 - 3.0 * fb, 0.34 + 3.0 * fb, band)) * (1.0 - heart) * 0.5 * bf * (1.0 - smoothstep(0.15, 0.4, fb)); gloss = mix(0.75, 0.35, fold);   // the folds' relief has a soft edge of its own and keeps out of the cream heart
    }
  #endif
  #ifdef EARTH
    if (vW.y < uCut || vW.y > uTop) discard;        // no land is drawn under the river's level: the doubles show through the sheet right up to the shore (uTop: the bank's own double keeps under it)
    float bedk = vPat.y < 0.005 ? 0.0 : 1.0;
    float fu = (vW.y - uOrigin.y) * 0.5 + 0.02 * (vW.x * 0.7 + vW.z) + 2.5 * tb.a + 1.25 * bedk * vUv.x;      // beds terraced along the contours; aPat.y (0 on the bust) rules furrows across a garden bed's own coordinate
    float fur = 0.5 + 0.5 * sin(fu * 0.9), ffu = fwidth(fu);
    // (c12, W4) THE FURROW IS DRAWN on a garden's beds (bedk; the bust's earth has none): a dark cut line in every trough, soft toward the
    // ridge; the ridge's crown dry and pale, broken into clods; between them fine rake lines, four to a furrow. By the bed's own coordinate
    // alone. Where a furrow is finer than the picture's grain each goes over into the mean it had (the norm 1.023 holds the furrow's mean
    // where c11's was; the rake lines' mean is 1), so the land far off is c11's.
    float fuk = (1.0 - smoothstep(0.6, 1.6, ffu)) * mix(1.0, clamp(vPat.y * 0.8, 0.0, 1.0), bedk), fud = bedk * fuk * (1.0 - smoothstep(0.35, 1.0, ffu));
    float grv = 1.0 - smoothstep(0.02, 0.3, fur), crs = smoothstep(0.62, 0.95, fur), rke = 0.5 + 0.5 * sin(fu * 3.6 + 3.0 * ta.g);
    fur = mix(0.5, fur, fuk);   // the furrow's own mean 0.5 (reader187: 0.5), so the next line's 0.72 + 0.4 fur goes to 0.92; drawn, with L375's cut, clods and norm 1.023, the joint mean is 0.9209 (reader187: 0.92087)
    skin *= 0.72 + 0.4 * fur; h += fur * 0.8 * bf; skin *= 0.85 + 0.3 * ta.a;
    skin *= mix(1.0, (1.0 - 0.42 * grv) * (1.0 + 0.18 * crs * (0.6 + 0.8 * ta.r)) * 1.023, fud) * mix(1.0, 0.9 + 0.2 * rke, fud * (1.0 - smoothstep(0.12, 0.4, ffu)));
    // PAINTED BEDS IN OIL (aMat.y on EARTH: how much): where the land runs on beyond the dealt plants it is painted as long
    // curved beds, 38 m wide, each of one pigment, unlike its neighbour, broken where it lies fallow. Within about 250 m a plant
    // is a soft round (two sizes) or a broad leaf touching the next, of unlike size, set off the row by the pattern's own
    // jitter, lit on its sunward side and going to its glazed shade on the other, dark soil
    // between. Further out the texture's own mipmaps and the footprint melt the plants into their bed's stroke of paint, the
    // strokes into the land's mean. No outline of a plot, no lattice, no drawn sign. EARTH's coordinates are
    // (0.34 x + 0.94 z, 0.94 x - 0.34 z) everywhere, so the sun lies one way in them.
    vec2 bv = vUv + 55.0 * vec2(sin(vUv.y / 260.0 + 1.3), sin(vUv.x / 310.0));
    float fwa = fwidth(vUv.x), fwb = fwidth(vUv.y), fmax = sqrt(max(fwa, fwb) * min(fwa, fwb)) + 1e-4;   // the footprint's mean (seen from high and aslant a bed keeps its plants as far as the picture can carry them)
    vec4 tw = texture2D(uTex, bv / 2900.0 + 0.21);                     // slow fields: where a bed bends, where it lies fallow
    vec4 tq = texture2D(uTex, bv / 640.0 + 0.63);                       // where a stroke breaks, how thick its paint lies
    float turned = step(0.5, tw.a), seam = smoothstep(0.0, 0.035, abs(tw.a - 0.5));   // the beds of one piece of land run across those of the next: the piece's edge is the slow field's own contour (no straight line), and a path of soil lies along it
    float bd = mix(bv.x, bv.y + 13.0, turned) / 38.0 + 1.6 * tw.r + 0.55 * (tq.a - 0.5), bq = fract(bd);   // no two beds of one width, no edge ruled
    float hb = fract(sin(floor(bd) * 13.4617 + 4.1) * 39847.6291), big = step(0.5, fract(hb * 7.31)), broad = step(0.66, fract(hb * 3.77));   // the world's own constants (c13)
    vec3 bc = hb < 0.45 ? uBedA : hb < 0.67 ? uBedB : uBedC;
    float cell = mix(10.0, 17.0, big);
    vec2 pu = (bv + hb * 190.0) / (16.0 * cell);
    const vec2 SUN_UV = vec2(-0.345, 0.939);
    vec4 pg = texture2D(uTex, pu);
    float g1 = texture2D(uTex, pu + SUN_UV * (0.3 / 16.0)).g;
    float fpl = fmax / cell, fine = smoothstep(0.16, 0.36, fpl), fbed = smoothstep(0.2, 0.55, fmax / 38.0);
    float rad = mix(0.46 + 0.16 * tb.r, 0.66 + 0.2 * tb.r, broad);
    float disc = 1.0 - smoothstep(rad - 0.07 - fpl, rad + 0.03 + fpl, pg.g);          // BEDS ONE CAN COUNT: a round plant has a crisp outline while it is over five pixels across
    float lam = clamp(0.6 + 2.6 * (g1 - pg.g), 0.2, 1.15) * mix(1.0, 1.0 - 0.55 * smoothstep(0.55, 0.95, pg.b), broad);   // lit toward the sun, glazed away from it; a broad leaf has dark seams where it meets the next
    // (c13, F2) THE SOIL BETWEEN TWO BEDS KEEPS ITS OWN MEAN: across a bed the paint's share is 0.885 (the soil's 0.115). The footprint widens the strip's two edges inward by eb, so the
    // strip is made as much shallower as it is wider, 0.115 / (0.115 + eb): the share stays 0.885 at every footprint (counted, shots/harvest-in-profile/tmp/c13/beds.mjs; bare, c12's fell to 0.685 at eb 0.2).
    float eb = min(fmax / 38.0, 0.415);
    float bandm = (1.0 - (1.0 - smoothstep(0.02, 0.07 + eb, bq) * (1.0 - smoothstep(0.9 - eb, 0.96, bq))) * (0.115 / (0.115 + eb))) * smoothstep(0.26, 0.42, tq.r + 0.3 * (hb - 0.5)) * seam;   // soil between beds; broken strokes
    // (c13, K5) THE PAINTED PLANTS GO TO THEIR OWN MEAN: the cover and the cover times light that this very pattern comes to over the pattern texture, reckoned from the texture itself
    // (design/asb/harvest/c13/painter-k5-beds.mjs) as the plant's size runs with tb.r: round beds' cover 0.565 to 0.858 (0.727 at the middle), cover times light 0.422 to 0.572 (0.510);
    // broad beds' 0.907 to 0.997 (0.977) and 0.552 to 0.575 (0.571). (c12's were set by hand: cover 0.8 and 0.9, light 0.66 + 0.3 tq.a, so 0.657 and 0.739: a bed grew paler as it shrank.)
    // The product itself is mixed, so the tone is the pattern's own at every step of the way; where the plants are drawn (fine 0) the lines are c12's.
    float ownC = mix(0.565 + tb.r * (0.354 - 0.061 * tb.r), 0.907 + tb.r * (0.191 - 0.101 * tb.r), broad), ownP = mix(0.422 + tb.r * (0.2 - 0.05 * tb.r), 0.552 + tb.r * (0.054 - 0.031 * tb.r), broad), cvf = mix(disc, ownC, fine);
    vec3 pcol = bc * (0.62 + 0.4 * tb.r) * (0.78 + 0.34 * fract(hb * 13.7)) * (fine > 0.0 ? mix(disc * lam, ownP, fine) / max(cvf, 1e-3) : lam);
    // (c13, F2) THE BEDS GO OVER INTO THE LAND'S OWN MEAN (fbed): what is given up is only what a bed has of its own (its number's pigment and tone, its edges); the fallow patches, the paths
    // and the plants' size stay as the slow fields have them. Counted on this build's constants over the bust's own painted earth (177,651 m2, 18 beds; by painted area the pigments' shares
    // are 0.410, 0.168, 0.422, big 0.569, broad 0.158; shots/harvest-in-profile/tmp/c13/beds.mjs): the paint's cover is 0.4497 of the painted land, so the beds' share is 0.8956 of the
    // unbroken stroke; the three pigments weigh 0.3396, 0.2101, 0.3503 (each bed's own tone times its cover). (c12's far land was set by hand: cover 0.612, an even 0.2745 of each pigment.)
    // Cover times pigment is mixed, so the land's tone is its pattern's own at every step of the way; where fbed is 0 the lines are as they were.
    float cvn = cvf * bandm, cov = cvn;   // CODE MATTER, not mended in c15: the next lines' 0.8956 and weights 0.3396, 0.2101, 0.3503 are one build's count over its 18 beds, NOT RECOUNTED (it needs the bust's mesh), and no bed's own mean;
    if (fbed > 0.0) { float cvb = cvf * 0.8956 * seam * smoothstep(0.2, 0.5, tq.r); cov = mix(cvn, cvb, fbed);   // by the pattern over every bed number: 0.877, weights 0.3725, 0.2222, 0.3533; a bed's own share 0.605 to 1.006 (reader187)
      pcol = mix(pcol * cvn, (uBedA * 0.3396 + uBedB * 0.2101 + uBedC * 0.3503) * (0.62 + 0.4 * tb.r) * (ownP / max(ownC, 1e-3)) * cvb, fbed) / max(cov, 1e-4); }
    float cover = cov * thru;
    skin = mix(skin * (1.0 - 0.55 * thru), pcol, cover); gloss = mix(gloss, 0.1 * uGloss, cover);   // dark soil between; painted land is matt (no sheen lies on a field; uGloss 0 on the world's own land: seen from high up, the one hard point of a level field is drawn out into a pale streak hundreds of metres long toward the sun)
  #endif
  float film = vPat.w * mix(0.934, smoothstep(0.3, 0.62, tb.a + 0.25 * ta.a), 1.0 - smoothstep(8.0, 24.0, px));    // bloom: the only blue, always a film, wiped in patches; own mean 0.934 (reader187: 0.9306)
  skin = mix(skin, uBloom, film * 0.5); gloss *= 1.0 - 0.85 * film;
  // relief tilts the normal so each pit and rib takes its own light
  vec3 dpx = dFdx(vW), dpy = dFdy(vW);
  #ifdef LEAF
    { vec2 ua = vec2(dFdx(vUv.x), dFdy(vUv.x)), ub = vec2(dFdx(vUv.y), dFdy(vUv.y)); float dj = ua.x * ub.y - ua.y * ub.x;   // THE BLADE'S OWN SWELL first: a leaf is doubly curved. Its slope is known
      if (abs(dj) > 1e-12) { vec3 Tu = (dpx * ub.y - dpy * ub.x) / dj, Tv = (dpy * ua.x - dpx * ua.y) / dj;                    // in the piece's own coordinates, so the normal turns smoothly (no screen-space step)
        N = normalize(N - (gs.x * Tu / max(dot(Tu, Tu), 1e-6) + gs.y * Tv / max(dot(Tv, Tv), 1e-6)) * 1.6 + N * 1e-6); }
      h += hb; }                                                                           // the pillows between the side ribs go with the fine relief (the one point of light stays on the swell)
  #endif
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 N0 = N;
  N = normalize(abs(det) * N - sign(det) * (dhx * r1 + dhy * r2) * 1.6 + N * 1e-6);
  // one sun, shade baked by place; the shade is the piece's own colour under a brown glaze, never grey
  float ndl = mix(dot(N0, uSun), dot(N, uSun), 0.4);                    // the turn follows the piece's own curve; its relief (pores, ribs, blisters) tilts it a little (a short turn on the relief alone broke into blocks)
  // ONE HARD KEY (ruling 7): a lit face at the full pigment, A SHORT TURN (about a tenth of a round thing's width), then a
  // DEEP WARM UMBER shade side that keeps a trace of the piece's own hue and stands one step over the ground, never grey.
  #if defined(EARTH)
    float lit = smoothstep(-0.1, 0.48, ndl) * vSh.x;                      // the turning shade falls quickly
    vec3 shade = skin * (0.15 + 0.12 * uGarden) + uGlaze * 0.13;        // (the land keeps its own softer turn and shade: the world's land glaze is this form)
    shade += (skin * 0.6 + vec3(0.07, 0.035, 0.01)) * vec3(1.0, 0.76, 0.5) * smoothstep(0.15, -0.75, N0.y) * 0.2;
    vec3 col = mix(shade, skin * vec3(1.06, 1.02, 0.94), lit);
  #else
    vec3 hue = skin / max(max(skin.r, max(skin.g, skin.b)), 0.06);     // the piece's own hue at full strength: the trace that the shade keeps
    float under = smoothstep(0.15, -0.75, N0.y) * (1.0 - 0.6 * smoothstep(30.0, 300.0, vW.y - uOrigin.y));   // an underside, more the nearer it hangs over the lit land
    #ifdef LEAF
      float lit = (spec > 6.5 ? smoothstep(-0.18, 0.5, ndl) : smoothstep(-0.04, 0.3, ndl)) * vSh.x;   // a leaf turns from its lit swell to its glazed hollow (a petal later: it is thin)
      vec3 shade = uGlaze * 0.14 + hue * (0.015 + 0.007 * uGarden);     // deep bottle green under the glaze (uGarden: a garden leaf in another body's shade keeps a little more of its green)
      float fresh = clamp((skin.g - max(skin.r, skin.b)) * 8.0, 0.0, 1.0);
      vec3 litc = skin * vec3(1.06, 1.1, 0.94) + skin.g * vec3(0.15, 0.4, 0.0) * fresh;   // the lit swell of a green leaf is a fresh full green, never olive
    #else
      float lit = smoothstep(-0.02, 0.2, ndl) * vSh.x;
      vec3 shade = uGlaze * 0.3 + hue * (0.012 + 0.006 * uGarden);       // (uGarden: a garden body seen from its shade side keeps a little more of its hue)
      vec3 litc = skin * vec3(1.14, 1.03, 0.86) * (0.74 + 0.36 * smoothstep(0.1, 0.95, ndl));   // the face turned full to the sun is the richest
    #endif
    shade += (skin * 0.5 + vec3(0.02, 0.01, 0.003)) * vec3(1.0, 0.76, 0.5) * under * 0.2;   // a faint warm bounce from the lit land on undersides: under a fifth of the key
    // THE SKY'S OWN REFLEX (c11), by the surface's normal alone: a face turned to the low warm band takes its straw, a face turned from it the cool green-blue, a face turned up the deep blue-green of the top
    float nh = length(N0.xz); vec3 fill = mix(vec3(0.030, 0.085, 0.095), vec3(0.150, 0.110, 0.050), smoothstep(-0.4, 0.9, dot(N0.xz, vec2(0.766, -0.643)))) * (0.6 * nh) + vec3(0.012, 0.050, 0.062) * (0.5 + 0.5 * N0.y);
    shade += (skin * 0.5 + vec3(0.05)) * fill * 0.6;
    vec3 col = mix(shade, litc, lit);
    #ifndef LEAF
      col += skin * vec3(1.0, 0.46, 0.14) * (0.26 * smoothstep(-0.3, 0.0, ndl) * (1.0 - smoothstep(0.04, 0.4, ndl)) * vSh.x);   // THE WARM TURN (c11): at the line where the lit face gives way to the shade the skin burns a deep orange, by the sun and the normal alone
    #endif
  #endif
  #ifdef LEAF
    if (spec < 6.5 || spec > 7.5) col = mix(col, skin * vec3(0.5, 0.62, 0.42) + uGlaze * 0.04, 0.5 * (1.0 - abs(2.0 * lit - 1.0)));   // between the lit swell and the glazed hollow a leaf passes through bottle green
  #endif
  // THE ROUND'S OWN WARM GOLD LIGHT in the mouth (baked by distance from the round's seat into vSh.z): the lining's own pigment
  // under a gold light, its ribs and blisters taking it each at its own tilt, so the folds of the leaves stay seen
  col += min((skin * 0.45 + vec3(0.24, 0.13, 0.035)) * vec3(1.0, 0.74, 0.36) * (vSh.z * 3.0 * clamp(1.0 + 1.6 * dot(N - N0, uSun), 0.5, 1.5)), vec3(0.66, 0.46, 0.18));
  #ifdef LEAF
    vec3 thc = spec > 6.5 ? skin * 1.25 + vec3(0.1, 0.06, 0.0) : mix(skin, uMuscat, 0.6);   // special 7: a petal glows in its own pigment
    float thk = smoothstep(0.0, 0.7, -ndl) * (spec > 6.5 ? 0.35 + 0.65 * vSh.x : vSh.x) * 0.85;
    // IN THE GARDEN (uGarden, 0 on the head) a leaf seen against the sun GLOWS where it comes through: yellow green (uThru, lettuce
    // warmed with lemon), sooner as the leaf turns from the sun, and kept under another leaf's shade (the light comes through
    // that one too); a petal or a straw ear (special 7) glows at its pigment's full strength
    thc = mix(thc, spec > 6.5 ? skin * 1.45 + vec3(0.1, 0.06, 0.0) : mix(skin * 1.6, uThru, 0.62), uGarden);
    thk = mix(thk, smoothstep(-0.12, 0.42, -ndl) * (0.5 + 0.5 * vSh.x), uGarden);
    // (c13, F1) the quilt in the lit-through light goes to ITS OWN MEAN: blm is the quilt with its faded relief made up (its mean over the pattern 0.45, as the skin's
    // line above has it) and lfm the share of it still drawn at this footprint, so the light settles at 0.7 + 0.3 * 0.45 = 0.835 of itself (c12 took the bare bl, and
    // a quilted leaf grew lighter as it shrank)
    vec3 lth = thc * thru * thk * (1.0 - 0.8 * vein) * mix(1.0, 0.7 + 0.3 * mix(0.45, blm, lfm), vPat.z) * (1.0 - 0.3 * step(0.01, vPat.y) * (1.0 - smoothstep(0.0, 0.6, swl / max(Wl, 0.05)))); col = spec > 6.5 ? min(col + lth, max(col, skin)) : col + lth;   // lit through (special 7, ruling 4 part 5: a petal's lit-through sum is capped at its own pigment)
  #else
    if (spec > 5.5 && spec < 6.5) {                // special 6: A GRAPE. The light passes through it: muscat green gold in its body, an AMBER RIM where the sun comes
      float rim = clamp(1.0 - dot(N0, V), 0.0, 1.0), back = smoothstep(-0.5, 0.6, -dot(V, uSun));      // out again round its edge (strongest seen against the sun), and a soft bloom on the side turned up
      col = mix(col, mix(skin, uMuscat, 0.5) * (0.46 + 0.5 * lit) * (0.8 + 0.2 * rim), 0.6 * thru);     // its neighbours' shade never makes a flat face of it
      col += mix(skin, uMuscat, 0.5) * thru * (0.04 + 0.7 * smoothstep(-0.2, 0.7, -ndl)) * (0.5 + 0.5 * vSh.x) * 0.6;
      col += vec3(0.92, 0.45, 0.06) * thru * rim * sqrt(rim) * (0.6 + 0.4 * back) * (0.6 + 0.4 * vSh.x) * 0.95;
      col = mix(col, uBloom * (0.5 + 0.5 * lit), 0.16 * thru * smoothstep(0.0, 0.8, N0.y) * (1.0 - rim));
    }
    if (spec > 1.5 && spec < 2.5) col += mix(skin, uCream, 0.45 * (1.0 - tieK)) * smoothstep(-0.3, 0.06, ndl) * (1.0 - smoothstep(0.1, 0.6, ndl)) * (0.3 + 0.7 * vSh.x) * 0.8;   // special 2: straw (stooks, rick): a bright rim where the body turns from the sun, by the sun's direction alone: seen against the light it is the body's lit edge
  #endif
  #ifdef LEAF
    col = mix(uGlaze * 0.2 + hue * 0.012, col, 0.3 + 0.7 * vSh.y);        // where leaf lies on leaf, or under a skin, the seam goes to the glaze in the leaf's own deep green (a soft edge: no dark line is drawn on a leaf)
  #elif defined(EARTH)
    col = mix(uGlaze * 0.34, col, 0.16 + 0.84 * vSh.y);                // the narrow brown seam where pieces press: dark
  #else
    col = mix(uGlaze * 0.3, col, 0.06 + 0.94 * vSh.y);                 // THE SEAM GOES TO THE DARK where two pieces press, so each stands round from the next
  #endif
  vec3 Ve = spec > 2.5 && spec < 3.5 ? normalize(vec3(0.35, 0.1, -0.93)) : V;   // the eye's light is painted by place
  vec3 Hh = normalize(uSun + Ve + vec3(0.0, 1e-5, 0.0));
  float nd0 = max(dot(N0, Hh), 0.0);
  float m2 = nd0 * nd0, m8 = m2 * m2 * m2 * m2, n64 = m8 * m8 * m8 * m8 * m8 * m8 * m8 * m8;
  float n256 = n64 * n64 * n64 * n64;
  #ifdef LEAF
    float hard = smoothstep(0.55, 0.9, n256 * n256) * min(0.75, gloss * 1.2 + 0.25 * step(0.01, vPat.y)) * (spec > 6.5 && spec < 8.5 ? 0.0 : 1.0);   // ONE HARD POINT on a leaf that faces the sun: on the blade's swell, not on its blisters
  #else
    float hard = smoothstep(0.3, 0.8, n256 * n256) * gloss;           // ONE SMALL TIGHT LIGHT (ruling 8 part 4: two thirds of its old width) where the one sun gives it (on the piece's own curve, not on its relief)
  #endif
  float lg = smoothstep(0.0, 0.3, ndl) * ((spec > 5.5 && spec < 6.5) || (spec > 2.5 && spec < 3.5) ? max(vSh.x, 0.7) : vSh.x) * (0.3 + 0.7 * vSh.y);   // (a grape's and the eye cherry's one small light is the sky's mirror: it stays under another piece's shade; the body does not)
  #if defined(LEAF)
    float wax = m8 * (0.08 + 0.3 * gloss) * (1.0 - vein) * step(0.01, vPat.y) * (spec > 6.5 && spec < 8.5 ? 0.0 : 1.0);   // a broad waxy sheen along the swell beside the ribs
    col += (uHi * hard * 0.8 + mix(skin, uHi, 0.3) * vec3(1.0, 0.95, 0.8) * wax) * lg;
  #elif defined(EARTH)
    col += vec3(1.0, 0.82, 0.55) * m8 * m8 * 0.16 * gloss * (0.25 + 0.75 * skin) * lg;   // soil: a faint soft sheen and no point of light
  #else
    col += (uHi * (hard * 0.85 + n64 * n64 * n64 * n64 * 0.1 * gloss) + skin * vec3(1.0, 0.9, 0.72) * m8 * m8 * 0.05 * gloss) * lg;   // the highlight, its soft halo, and one broad sheen IN THE SKIN'S OWN PIGMENT (a pale sheen turned tomato red to coral)
  #endif
  float f = smoothstep(uFade.x, uFade.y, length(vW.xz - uOrigin.xz));  // distance is stated by place: lost into the ground
  vec3 gd = -V; gd.y = mix(min(gd.y, 0.02), gd.y, smoothstep(0.75, 1.0, f)); col = mix(col, hpGround(gd), f) * uDim;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- pattern texture and materials
// One 256 texture with mipmaps, made at build: R slow value noise, G distance to the nearest cell centre (16 cells a tile),
// B cell edge, A a second noise. The mipmaps are what stop shimmer; nothing finer than about 0.3 m is drawn.
function* glazeTextureSteps() {
  const S = 256, r = makeRng('harvest-glaze-texture'), data = new Uint8Array(S * S * 4), C = 16;
  const pts = new Float32Array(C * C * 2); for (let i = 0; i < pts.length; i++) pts[i] = r();
  const lat = (n) => { const a = new Float32Array(n * n); for (let i = 0; i < a.length; i++) a[i] = r(); return a; };
  const L = [[8, lat(8), 0.5], [16, lat(16), 0.3], [32, lat(32), 0.2]], L2 = [[4, lat(4), 0.55], [8, lat(8), 0.3], [32, lat(32), 0.15]];
  const vn = (Ls, x, y) => { let s = 0; for (const [n, a, w] of Ls) { const fx = x * n, fy = y * n, ix = Math.floor(fx), iy = Math.floor(fy); let tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty); const i0 = ix % n, i1 = (ix + 1) % n, j0 = iy % n, j1 = (iy + 1) % n; s += w * ((a[j0 * n + i0] * (1 - tx) + a[j0 * n + i1] * tx) * (1 - ty) + (a[j1 * n + i0] * (1 - tx) + a[j1 * n + i1] * tx) * ty); } return s; };
  for (let y = 0; y < S; y++) { if (y % 24 === 23) yield null; for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S, cx = Math.floor(u * C), cy = Math.floor(v * C); let d1 = 9, d2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = (cx + i + C) % C, gy = (cy + j + C) % C, k = (gy * C + gx) * 2;
      const dx = (cx + i + 0.15 + 0.7 * pts[k]) - u * C, dy = (cy + j + 0.15 + 0.7 * pts[k + 1]) - v * C, d = Math.sqrt(dx * dx + dy * dy);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    const o = (y * S + x) * 4;
    data[o] = 255 * vn(L, u, v); data[o + 1] = 255 * Math.min(1, d1); data[o + 2] = 255 * Math.max(0, 1 - (d2 - d1) * 2.2); data[o + 3] = 255 * vn(L2, u, v);
  } }
  const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.anisotropy = 4; t.needsUpdate = true; yield t;
}
export function makeGlazeTexture() { let t = null; for (const r of glazeTextureSteps()) t = r; return t; }
export async function makeGlazeTextureAsync(tick) { let t = null; for (const r of glazeTextureSteps()) { t = r; if (!r) await tick(); } return t; }

// glazeMaterial('SKIN' | 'LEAF' | 'EARTH', { sway }): the one routine the whole world is shaded by. Unlit by three.js, no fog,
// vertex colours are the pigment. sway 0 on the head and the creatures; AS BUILT 5 on the garden's leaves (leafMat, mirLeaf, farLeaf) and 2 on the belt's crowns (c15: this line said about 1 on garden leaves); same program, another uniform.
export function glazeMaterial(form = 'SKIN', o = {}) {
  if (!STYLE.uTex.value) STYLE.uTex.value = makeGlazeTexture();
  const m = new THREE.ShaderMaterial({
    name: 'glaze-' + form, vertexShader: GLAZE_VERT, fragmentShader: GLAZE_FRAG, vertexColors: true,
    defines: { [form]: 1 }, side: form === 'LEAF' ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: { ...STYLE, uSway: { value: o.sway || 0 }, uRipple: { value: o.ripple || 0 }, uFlap: { value: o.flap || 0 }, uDim: { value: o.dim ?? 1 }, uGloss: { value: o.gloss ?? 1 }, uCut: { value: o.cut ?? -0.35 }, uTop: { value: o.top ?? 1e6 }, uGarden: { value: o.garden || 0 }, ...(o.sun ? { uSun: { value: o.sun } } : {}) },
  });
  return m;
}

// The painted sky (the picture's ground) as a dome of about 1,000 triangles that follows the lens by its own vertex shader (position + cameraPosition, drawn at the far plane): no call is needed and the world makes none.
export function makeGroundDome() {
  const m = new THREE.ShaderMaterial({
    name: 'painted-ground', side: THREE.BackSide, depthWrite: false, depthTest: false, uniforms: { uG0: STYLE.uG0, uG1: STYLE.uG1, uG2: STYLE.uG2 },
    vertexShader: 'varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }',
    fragmentShader: GROUND_GLSL + ' varying vec3 vD; void main(){ vec3 d = vD / max(length(vD), 1e-4); gl_FragColor = vec4(hpGround(d), 1.0); }',
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), m);
  dome.renderOrder = -10; dome.frustumCulled = false; return dome;
}

// ---------------------------------------------------------------- geometry
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sst = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const TAU = Math.PI * 2;

// Geo: a growing vertex store all generators write into. Each piece also leaves an ellipsoid for the shade bake.
export class Geo {
  constructor(cap = 60000) {
    this.cap = cap; this.n = 0; this.ni = 0;
    this.pos = new Float32Array(cap * 3); this.nor = new Float32Array(cap * 3); this.col = new Float32Array(cap * 3);
    this.uv = new Float32Array(cap * 2); this.mat = new Float32Array(cap * 4); this.pat = new Float32Array(cap * 4);
    this.shade = new Float32Array(cap * 3).fill(1); this.pid = new Uint16Array(cap); this.idx = new Uint32Array(cap * 6);
  }
  toGeometry() {
    const g = new THREE.BufferGeometry(), n = this.n, A = (a, k) => new THREE.BufferAttribute(a.slice(0, n * k), k);
    g.setAttribute('position', A(this.pos, 3)); g.setAttribute('normal', A(this.nor, 3)); g.setAttribute('color', A(this.col, 3));
    g.setAttribute('aUv', A(this.uv, 2)); g.setAttribute('aMat', A(this.mat, 4)); g.setAttribute('aPat', A(this.pat, 4)); g.setAttribute('aShade', A(this.shade, 3));
    g.setIndex(new THREE.BufferAttribute(this.idx.slice(0, this.ni), 1));
    return g;
  }
}
const _S = { x: 0, y: 0, z: 0, r: 1, g: 1, b: 1, a: 0, b2: 0 };

// surf: a parametric sheet. o.f(u, v, S) writes S.x,y,z (piece space), S.r,g,b (linear pigment) and S.a, S.b2 (the piece's own
// coordinates in metres). o.wrap closes it round u (a lathe); o.M seats it. Normals come from the seated grid itself.
// Returns the vertex range. Triangles: 2 * nu * nv.
const MAT0 = [0.5, 0, 0, 0], PAT0 = [0, 0, 0, 0];
export function surf(G, o) {
  const wrap = !!o.wrap, nu = Math.max(wrap ? 3 : 1, Math.round(o.nu) || 0), nv = Math.max(1, Math.round(o.nv) || 0), cu = wrap ? nu : nu + 1, cv = nv + 1, base = G.n, M = o.M, f = o.f;
  if (G.n + cu * cv > G.cap || G.ni + nu * nv * 6 > G.cap * 6) return [base, base];
  const P = G.pos, Nn = G.nor, C = G.col, U = G.uv, Gm = G.mat, Gp = G.pat, mat = o.mat || MAT0, pat = o.pat || PAT0, pid = o.pid || 0;
  const m0 = mat[0], m1 = mat[1], m2 = mat[2], m3 = mat[3], p0 = pat[0], p1 = pat[1], p2 = pat[2], p3 = pat[3], e = M ? M.elements : null;
  for (let j = 0; j < cv; j++) for (let i = 0; i < cu; i++) {
    const k = base + j * cu + i, k3 = k * 3, k4 = k * 4; f(i / nu, j / nv, _S); let x = _S.x, y = _S.y, z = _S.z;
    if (e) { const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]), X = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w, Y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w; z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w; x = X; y = Y; }
    P[k3] = x; P[k3 + 1] = y; P[k3 + 2] = z;
    C[k3] = _S.r; C[k3 + 1] = _S.g; C[k3 + 2] = _S.b; U[k * 2] = _S.a; U[k * 2 + 1] = _S.b2;
    Gm[k4] = m0; Gm[k4 + 1] = m1; Gm[k4 + 2] = m2; Gm[k4 + 3] = m3; Gp[k4] = p0; Gp[k4 + 1] = p1; Gp[k4 + 2] = p2; Gp[k4 + 3] = p3; G.pid[k] = pid;
  }
  const at = (i, j) => base + j * cu + (wrap ? (i + cu) % cu : Math.min(cu - 1, Math.max(0, i)));
  for (let j = 0; j < cv; j++) { const rc = base + (j > 0 ? j - 1 : 0) * cu, rd = base + (j < cv - 1 ? j + 1 : j) * cu, r0 = base + j * cu;
    for (let i = 0; i < cu; i++) {
      const il = wrap ? (i + cu - 1) % cu : (i > 0 ? i - 1 : 0), ir = wrap ? (i + 1) % cu : (i < cu - 1 ? i + 1 : i);
      const a = (r0 + il) * 3, b = (r0 + ir) * 3, c = (rc + i) * 3, d = (rd + i) * 3, k = (r0 + i) * 3;
      const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[d] - P[c], vy = P[d + 1] - P[c + 1], vz = P[d + 2] - P[c + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (l > 1e-9) { nx /= l; ny /= l; nz /= l; } else { nx = ny = nz = 0; }
      Nn[k] = nx; Nn[k + 1] = ny; Nn[k + 2] = nz;
    } }
  for (const j of [0, cv - 1]) {             // poles: where a row collapses to a point, take the mean of the next row's normals
    const a0 = at(0, j) * 3, a1 = at(Math.floor(cu / 2), j) * 3;
    if (Math.hypot(P[a0] - P[a1], P[a0 + 1] - P[a1 + 1], P[a0 + 2] - P[a1 + 2]) > 1e-3) continue;
    const jj = j === 0 ? 1 : cv - 2; let sx = 0, sy = 0, sz = 0;
    for (let i = 0; i < cu; i++) { const k = at(i, jj) * 3; sx += Nn[k]; sy += Nn[k + 1]; sz += Nn[k + 2]; }
    const l = Math.hypot(sx, sy, sz) || 1;
    for (let i = 0; i < cu; i++) { const k = at(i, j) * 3; Nn[k] = sx / l; Nn[k + 1] = sy / l; Nn[k + 2] = sz / l; }
  }
  let q = G.ni; const I = G.idx;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = at(i, j), b = wrap ? at(i + 1, j) : a + 1, c = at(i, j + 1), d = wrap ? at(i + 1, j + 1) : c + 1;
    I[q++] = a; I[q++] = b; I[q++] = c; I[q++] = b; I[q++] = d; I[q++] = c;
  }
  G.ni = q; G.n = base + cu * cv; return [base, G.n];
}

// ---------------------------------------------------------------- the four generators
const hsh = (x, y) => { const s = Math.sin(x * 141.79 + y * 318.23) * 44213.6189; return s - Math.floor(s); };   // the world's own constants (c13)
const vnz = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return (hsh(ix, iy) * (1 - fx) + hsh(ix + 1, iy) * fx) * (1 - fy) + (hsh(ix, iy + 1) * (1 - fx) + hsh(ix + 1, iy + 1) * fx) * fy; };
// seat(x, y, z, yaw, pitch, roll, scale): a piece's matrix. A lathe's axis is its +Y (stalk end at t = 1); a leaf runs along +Y, face +Z.
export function seat(x, y, z, rx = 0, ry = 0, rz = 0, s = 1) {
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));
}
function addBound(G, M, rx, ry, rz, range, cy = 0, cast = 1) {   // an ellipsoid in piece space, kept for the shade bake
  const E = new THREE.Matrix4().makeTranslation(0, cy, 0).scale(new THREE.Vector3(rx, ry, rz)); if (M) E.premultiply(M);
  G.bounds.push({ inv: E.clone().invert().elements, a: range[0], b: range[1], cast }); return G.bounds.length - 1;
}

// BENT LATHE. o: L length, R greatest radius, nu, nv, prof(t) 0..1 radius, sect(th, t) lobe multiplier, bend(t) -> [x, z] metres,
// col(t, th, S), sx/sz squash, ease (rows gathered at the ends), M, mat, pat. Piece coords: girth and axis in metres.
// twist(t) (c12): radians by which the mesh's columns turn round the axis along its length, so that a drawing that runs
// aslant up the body (a sheath's edge) lies along the mesh's own columns and never crosses them in steps. Shape, colour and
// drawing are still asked by the true angle th; the piece's own coordinates stay with the column.
export function lathe(G, o) {
  const L = o.L, R = o.R, prof = o.prof, sect = o.sect, bend = o.bend, col = o.col, sx = o.sx || 1, sz = o.sz || 1, c0 = o.c || [1, 1, 1];
  if (!G.bounds) G.bounds = [];
  const pid = o.pid ?? (G.bounds.length + 1), q0 = G.ni;
  const range = surf(G, { nu: o.nu, nv: o.nv, wrap: true, M: o.M, mat: o.mat, pat: o.pat, pid, f: (u, v, S) => {
    const t = o.ease ? 0.5 - 0.5 * Math.cos(Math.PI * v) : v, th = u * TAU + (o.twist ? o.twist(t) : 0);
    let r = R * prof(t); if (sect) r *= sect(th, t);
    S.x = r * Math.cos(th) * sx; S.z = -r * Math.sin(th) * sz; S.y = (t - 0.5) * L;
    if (bend) { const b = bend(t); S.x += b[0]; S.z += b[1]; if (b.length > 2) S.y += b[2]; }
    S.a = u * TAU * R; S.b2 = t * L;
    if (col) col(t, th, S); else { S.r = c0[0]; S.g = c0[1]; S.b = c0[2]; }
  } });
  if (o.bound !== false) addBound(G, o.M, R * sx * (o.bk || 0.94), L * 0.5 * (o.bk || 0.94), R * sz * (o.bk || 0.94), range, 0, o.cast ?? 1);
  if (o.soft && range[1] > range[0]) (G.soft || (G.soft = [])).push([range[0], range[1], o.soft, q0, G.ni]);   // (c12) its baked shade is eased over its own mesh, o.soft times (see bakeShade)
  return range;
}
const ball = (t) => Math.sqrt(Math.max(0, 1 - (2 * t - 1) * (2 * t - 1)));          // a sphere's profile
const sup = (n) => (t) => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), n)), 1 / n); // a fuller, flatter-ended body

// SWEPT LEAF. o: L, W (half width), nu across, nv along, width(t) 0..1, curl (radians the midrib turns over its length),
// cup (how far the edges rise, in W), frill [amplitude m, waves], twist, col(t, s, S), M, mat, pat (pat[1] * 3.2 = the side ribs' spacing in metres; 0: no ribs).
// o.shape ('bean' | 'squash' | 'vine'): A BROAD LEAF LAID OUT ROUND ITS STALK instead of swept along its midrib: nu steps round
// the stalk, nv rings from it to the rim. The mesh is a fan standing a little outside the outline; THE OUTLINE ITSELF IS CUT IN
// THE GLAZE (a heart with its two lobes and a drawn point; five blunt lobes about a deep notch; five pointed toothed lobes),
// so a few triangles carry a true outline at any nearness, and the blade is curved both ways (cupped across, bowed along by
// curl, domed from the stalk by o.dome, the rim waved). The piece runs from its foot along +Y, face +Z, about 2 W long (o.L
// only sets the bow's arc); its coordinates are metres from the stalk. The glaze is told the blade's half width in aPat.x.
const SHAPES = {   // T: the half angle the blade spans round its stalk; y0: the stalk's place from the foot, in W; r(angle from the tip): the outline in W (the glaze cuts the same curve); spec: the glaze's special
  bean: { T: 2.72, y0: 0.3, spec: 11, r: (a) => 1.45 * (0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.cos(a), 1.5) + 0.22 * Math.exp(-a * a / 0.03)) * (1 - 0.45 * sst(2.1, 2.9, Math.abs(a))) },
  squash: { T: 2.76, y0: 0.94, spec: 9, r: (a) => (0.8 + 0.22 * Math.pow(0.5 + 0.5 * Math.cos(a * 6.8296), 0.7)) * (1 - 0.75 * sst(2.3, 2.76, Math.abs(a))) },
  vine: { T: 2.76, y0: 0.88, spec: 10, r: (a) => (0.5 + 0.56 * Math.pow(0.5 + 0.5 * Math.cos(a * 6.8296), 0.9)) * (1.12 - 0.17 * Math.abs(a)) * (1 - 0.75 * sst(2.3, 2.76, Math.abs(a))) * 1.05 },
  // (c12, F4) A BUTTERFLY'S WINGS, laid out round the wing's root (W: the wing's length; a: the angle from its axis toward its
  // leading edge): the forewing with a hooked point and a hollow under it, the hindwing round with one small tooth. A fan of
  // five to eight steps carries each; the outline, the veins, the brown margin and the orange spot are the glaze's.
  wingF: { T: 0.56, y0: 0, spec: 17, pad: 1.09, r: (a) => (0.74 + 0.26 * Math.exp(-(a - 0.38) * (a - 0.38) / 0.0121) - 0.05 * Math.exp(-(a - 0.16) * (a - 0.16) / 0.0144) + 0.03 * Math.exp(-(a + 0.3) * (a + 0.3) / 0.04)) * Math.pow(sst(0.56, 0.40, a) * sst(-0.56, -0.30, a), 0.55) },
  wingH: { T: 0.62, y0: 0, spec: 18, pad: 1.09, r: (a) => (0.86 + 0.14 * Math.exp(-(a - 0.02) * (a - 0.02) / 0.0049) - 0.06 * Math.pow(Math.abs(a), 1.5)) * Math.pow(sst(0.62, 0.42, a) * sst(-0.62, -0.2, a), 0.5) },
};
const rimsOf = (sh, nu) => { const tab = sh.rims || (sh.rims = {}); if (tab[nu]) return tab[nu]; const da = 2 * sh.T / nu, out = tab[nu] = new Float32Array(nu + 1);   // the mesh's rim at each step round the stalk (made once per count): outside the outline over the whole step either side
  for (let i = 0; i <= nu; i++) { let m = 0; for (let k = -3; k <= 3; k++) m = Math.max(m, sh.r(-sh.T + (i + k / 6) * da)); out[i] = m * (sh.pad || 1.04) / Math.cos(Math.min(1, da / 2)); } return out; };
export function leaf(G, o) {
  const L = o.L, W = o.W, wf = o.width, curl = o.curl || 0, cup = o.cup || 0, fr = o.frill || [0, 0], col = o.col, c0 = o.c || [1, 1, 1], c1 = o.c1 || c0;
  if (!G.bounds) G.bounds = [];
  const pid = o.pid ?? (G.bounds.length + 1), tw = o.twist || 0, lift = o.lift || 0, sh = o.shape ? SHAPES[o.shape] : null, pat = o.pat ? [W, o.pat[1], o.pat[2], o.pat[3]] : [W, 0, 0, 0], mat = sh ? [o.mat ? o.mat[0] : 0.5, o.mat ? o.mat[1] : 0, o.mat ? o.mat[2] : 0, sh.spec] : o.mat;
  const nuR = Math.max(1, Math.round(o.nu) || 0), waves = sh ? Math.max(1, Math.min(Math.round(fr[1] * 2), Math.floor(nuR / 4))) : 0, rims = sh ? rimsOf(sh, nuR) : null, dome = o.dome ?? 0.1;
  const put = (x, y, h, S) => {                                        // the blade's own plane (x across, y along from the foot) bowed along the arc, h off it
    const a = curl * y / L, ok = Math.abs(curl) > 1e-3;
    S.x = x; S.y = (ok ? L * Math.sin(a) / curl : y) - Math.sin(a) * h; S.z = (ok ? L * (1 - Math.cos(a)) / curl : 0) + Math.cos(a) * h; };
  const range = surf(G.L || G, { nu: o.nu, nv: o.nv, wrap: false, M: o.M, mat, pat, pid, f: sh ? (u, v, S) => {
    const th = (u * 2 - 1) * sh.T, rho = Math.pow(v, 0.8), rad = rho * W * rims[Math.round(u * nuR)], x = rad * Math.sin(th), yl = rad * Math.cos(th), y = yl + sh.y0 * W, t = Math.min(1, Math.max(0, y / L)), sx = x / W;
    let h = cup * W * sx * sx - dome * W * rho * rho + fr[0] * rho * rho * Math.sin(u * TAU * waves + (o.ph || 0)) + lift * t * t * L + tw * x * (t - 0.3);
    if (o.rib) h -= o.rib * Math.exp(-(x * x) / (o.rib * o.rib * 4)) * sst(-0.1, 0.1, yl / L);
    put(x, y, h, S); S.a = x; S.b2 = yl;
    if (col) col(t, Math.max(-1, Math.min(1, sx)), S); else { const k = sst(0.1, 1, rho) * 0.6 + 0.4 * t; S.r = c0[0] + (c1[0] - c0[0]) * k; S.g = c0[1] + (c1[1] - c0[1]) * k; S.b = c0[2] + (c1[2] - c0[2]) * k; }
  } : (u, v, S) => {
    const s = u * 2 - 1, w = W * wf(v), x = s * w;
    let h = cup * W * (x / W) * (x / W) + fr[0] * s * s * Math.sin(fr[1] * v * TAU + s * 2.3 + (o.ph || 0)) + lift * v * v * L + tw * x * (v - 0.3);
    if (o.rib) h -= o.rib * Math.exp(-(x * x) / (o.rib * o.rib * 4));   // a raised midrib on the back
    put(x, v * L, h, S); S.a = x; S.b2 = v * L;
    if (col) col(v, s, S); else { const k = sst(0.1, 1, Math.abs(s)) * 0.5 + 0.5 * v; S.r = c0[0] + (c1[0] - c0[0]) * k; S.g = c0[1] + (c1[1] - c0[1]) * k; S.b = c0[2] + (c1[2] - c0[2]) * k; }
  } });
  if (o.bound) addBound(G, o.M, W * 0.8, L * 0.45, Math.max(W * 0.25, L * 0.12), range, L * 0.5, o.cast ?? 1);
  return range;
}
const leafShape = (a = 0.5, b = 1.2) => (t) => Math.pow(Math.sin(Math.PI * Math.pow(Math.min(1, t * 0.97 + 0.015), a)), b) * 0.98 + 0.02; // widest early for small a

// CLUSTER: a whole head (cabbage, lettuce, cauliflower): a heart and wrapper leaves that hug it, never symmetric.
// o: R, M, kind 'savoy' | 'lettuce' | 'red' | 'cauli', leaves, det (0.5..1.5 mesh density), key (constant per individual), P pigments.
export function headOf(G, o) {
  const R = o.R, kind = o.kind || 'savoy', P = o.P, det = o.det || 1, key = o.key || 1, n = o.leaves || 9;
  const K = { savoy: [P.savoy, P.lettuce, P.bottle, 0.3, 0.9, 0.62], lettuce: [P.lettuce, P.cream, P.savoy, 0.35, 0.5, 0.0], red: [P.violet, P.beet, P.violet, 0.5, 0.15, 0.7], cauli: [P.cream, P.cream, P.savoy, 0.15, 0.0, 0.0] }[kind];
  const cA = K[0], cB = K[1], cD = K[2], M = o.M;
  const pidH = (G.bounds || (G.bounds = [])).length + 1;
  lathe(G, { L: R * 1.75, R: R * 0.9, nu: Math.round((kind === 'cauli' ? 20 : 14) * det), nv: Math.round((kind === 'cauli' ? 12 : 8) * det), ease: 1, M, prof: sup(2.3), bound: false,
    sect: kind === 'cauli' ? (th, t) => 1 + 0.07 * Math.sin(th * 7 + t * 23 + key) * Math.sin(t * 19 + th * 3) : (th, t) => 1 + 0.035 * Math.sin(th * 5 + t * 9 + key),
    mat: [K[3], 0, hsh(key, 1), 0], pat: kind === 'cauli' ? [0.9, 0, 1, 0] : [0, 0, K[4], K[5] * (kind === 'savoy' ? 0.3 : 1)],
    col: (t, th, S) => { const k = kind === 'cauli' ? 0.15 * vnz(th * 3, t * 9) : sst(0.35, 1, t) * (kind === 'savoy' ? 0.85 : 0.7); const c = mix3(cA, kind === 'savoy' ? mix3(cB, P.cream, 0.4) : cB, k); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  const tmp = new THREE.Matrix4(), nl = kind === 'cauli' ? Math.max(5, n - 3) : n;
  for (let i = 0; i < nl; i++) {
    const ring = i < nl * 0.45 ? 0 : 1, az = (i * 2.39996 + hsh(key, i) * 0.9), open = kind === 'lettuce' ? 0.3 + 0.25 * hsh(i, key) : kind === 'cauli' ? 0.42 : kind === 'savoy' ? 0.02 + 0.05 * hsh(i, key + 2) + ring * (hsh(i, key + 12) < 0.4 ? 0.34 : 0.07) : 0.07 + 0.15 * ring * hsh(i, key + 2);   // a savoy is closed: wrapper leaves hug the heart, two or three outer ones lie back
    const Rl = R * (1.0 + 0.08 * ring + 0.1 * hsh(key + 5, i)), arc = (kind === 'cauli' ? 1.5 : 2.25 - ring * 0.25 + 0.4 * hsh(i, key + 9)) * (1 - open * 0.5), Ll = Rl * arc;
    // leaf space: base at the head's foot, running outward then up; +Z (the face) looks toward the heart
    tmp.makeRotationY(az).multiply(new THREE.Matrix4().makeTranslation(0, -R * 0.88, 0)).multiply(new THREE.Matrix4().makeRotationX(-(Math.PI / 2 - 0.12 + open * 0.5))).multiply(new THREE.Matrix4().makeRotationZ((hsh(i, key + 3) - 0.5) * 0.5));
    if (M) tmp.premultiply(M);
    const vn = kind === 'red' || kind === 'cauli' ? 0 : (o.vein || 0), crm = mix3(P.cream, cB, 0.25);   // (c12, W4) o.vein: a broad cream midrib painted into the leaf, widest at the foot (the glaze's own ribs are finer than the grain of a small picture); o.bold: the glaze's ribs and the quilting between them so much broader; o.blunt: the wrapper leaves round at the tip (0.8 as it was: pointed); o.even: the leaves nearer one another in tone (0: as it was)
    const dk0 = kind === 'savoy' ? [1.08, 0.74, 0.92, 0.58][i % 4] + 0.08 * (hsh(key + 7, i) - 0.5) : 0.75 + 0.35 * hsh(key + 7, i), dk = o.even ? 0.9 + (dk0 - 0.9) * (1 - o.even) : dk0, ca = mix3(cD, cA, dk * (1 - 0.3 * ring)), cb = kind === 'red' ? cA : mix3(cA, cB, kind === 'savoy' ? 0.06 + 0.2 * hsh(i, key + 4) : 0.25 + 0.5 * hsh(i, key + 4));   // a savoy's lit swell is savoy green
    const nvl = Math.max(4, Math.round((kind === 'savoy' ? 14 : 12) * det)), fw = Math.min(kind === 'savoy' ? 3.2 + 1.5 * hsh(i, key) : 2 + 1.2 * hsh(i, key), nvl / 5.5);   // the crinkle never has fewer than five rows of the mesh to a wave: a finer one would break into facets
    leaf(G, { L: Ll, W: Rl * (0.8 + 0.2 * hsh(i, key + 6)), nu: Math.round((kind === 'savoy' ? 10 : 8) * det), nv: nvl, M: tmp.clone(),
      width: leafShape(0.62, o.blunt || 0.8), curl: arc, cup: (kind === 'savoy' ? 0.6 + 0.5 * open : 0.42) + 0.1 * hsh(i, key + 8), frill: [R * (kind === 'red' ? 0.06 : kind === 'savoy' ? 0.075 + 0.2 * open : 0.24), fw], ph: i * 1.7, lift: kind === 'savoy' ? (open < 0.2 ? 0.05 : -0.3 * open) : -(kind === 'red' ? 0.12 : 0.4) * open,
      rib: det >= 1.4 ? R * 0.035 : 0, pid: pidH, col: (v, sA, S) => { const e = Math.abs(sA), k = sst(0.0, 0.45, v) * (0.55 + 0.45 * sst(0.55, 1, e) + 0.3 * sst(0.8, 1, v)), c0 = mix3(mix3(ca, cD, 0.6), kind === 'red' ? mix3(cA, P.bloom, 0.35) : cb, Math.min(1, k)), c = vn ? mix3(c0, crm, vn * (1 - sst(0.06, 0.6, e)) * sst(0.0, 0.14, v) * (1 - 0.5 * v)) : c0; S.r = c[0]; S.g = c[1]; S.b = c[2]; }, mat: [K[3] * 0.8, kind === 'red' ? 0.1 : kind === 'savoy' ? 0.12 : 0.4, hsh(key, i + 20), kind === 'red' ? 4 : 0], pat: [0, R * (kind === 'savoy' ? 0.115 : 0.16) * (o.bold || 1), K[4], K[5] * (kind === 'savoy' ? (hsh(i, key + 1) < 0.34 ? 1.05 : 0.3 + 0.35 * hsh(i, key + 13)) : 0.5 + 0.5 * hsh(i, key + 1))] });
  }
  addBound(G, M, R * 1.02, R * 0.98, R * 1.02, [0, 0]);   // one bound for the whole head (its leaves carry the heart's number), so they do not shade one another to mud
  return pidH;
}

// ---------------------------------------------------------------- specimens (each a portrait of its kind, whole and only turned)
// makeSpecimens(P): P = pigments as linear [r,g,b]. Every function takes (G, M, size..., key) and writes one specimen with its
// stalk, calyx or root plate. det scales mesh density (chosen at build by distance from the flown line, never switched).
const T4 = (...m) => m.reduce((a, b) => a.clone().multiply(b));
const RX = (a) => new THREE.Matrix4().makeRotationX(a), RY = (a) => new THREE.Matrix4().makeRotationY(a), RZ = (a) => new THREE.Matrix4().makeRotationZ(a), TR = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
export function makeSpecimens(P) {
  const setc = (S, c) => { S.r = c[0]; S.g = c[1]; S.b = c[2]; };
  const cork = mix3(P.copper, P.soil, 0.55), corkD = mix3(P.soil, P.glaze, 0.35), stalkG = mix3(P.savoy, P.lettuce, 0.35);
  const Sp = {};
  // a short corked stalk, bent; t = 1 is the cut end
  Sp.stalk = (G, M, L, R, bendX = 0.3, c = stalkG, det = 1, own = G.bounds.length) => lathe(G, { pid: own, L, R, nu: Math.round(10 * det), nv: Math.round(8 * det), M, bound: false, prof: (t) => (0.75 + 0.25 * (1 - t) * (1 - t) + 0.25 * sst(0.85, 1, t)) * (t > 0.995 ? 0 : 1), sect: (th) => 1 + 0.08 * Math.cos(th * 5), bend: (t) => [bendX * L * t * t, 0], mat: [0.25, 0, 0.3, 0], pat: [0, 1.2, 0, 0], col: (t, th, S) => setc(S, mix3(c, cork, sst(0.8, 1, t) * 0.8 + 0.2 * vnz(th * 3, t * 8))) });

  // onLathe(o, th, t): a point and the outward normal on a lathe's skin, in piece space (lathe()'s own formula; t is the true t)
  const onLathe = (o, th, t) => { const pt = (a, b) => { let r = o.R * o.prof(b); if (o.sect) r *= o.sect(a, b); let x = r * Math.cos(a) * (o.sx || 1), z = -r * Math.sin(a) * (o.sz || 1), y = (b - 0.5) * o.L; if (o.bend) { const e = o.bend(b); x += e[0]; z += e[1]; if (e.length > 2) y += e[2]; } return [x, y, z]; };
    const q = pt(th, t), a = pt(th + 0.02, t), b = pt(th, Math.min(1, t + 0.01)), u = [a[0] - q[0], a[1] - q[1], a[2] - q[2]], w = [b[0] - q[0], b[1] - q[1], b[2] - q[2]];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], l = Math.hypot(n[0], n[1], n[2]) || 1; return { p: q, n: [n[0] / l, n[1] / l, n[2] / l] }; };
  // A CORK CRACK lying on a skin: a ribbon from a to b (each [th, t]) with half width (wTh, wT), dark down the middle, raised lips
  Sp.crack = (G, M, o, a, b, wTh, wT, key, pid) => surf(G, { nu: 8, nv: 2, wrap: false, M, pid, mat: [0.08, 0, hsh(key, 1), 0], pat: [0.5, 0, 0, 0], f: (u, v, S) => {
    const tp = Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.96 + 0.02)), 0.6), wob = 0.5 * Math.sin(u * 9 + key * 3), th = a[0] + (b[0] - a[0]) * u + wTh * ((v - 0.5) * 2 * tp + wob * 0.6) , t = Math.min(0.999, a[1] + (b[1] - a[1]) * u + wT * ((v - 0.5) * 2 * tp + wob * 0.6));
    const q = onLathe(o, th, t), lift = 0.18 + 0.22 * (v === 0.5 ? 0 : 1) * tp; S.x = q.p[0] + q.n[0] * lift; S.y = q.p[1] + q.n[1] * lift; S.z = q.p[2] + q.n[2] * lift; S.a = u * 9; S.b2 = v * 2;
    setc(S, v === 0.5 ? mix3(corkD, cork, 0.4) : mix3(cork, P.husk, 0.25 + 0.4 * hsh(key, Math.round(u * 8)))); } });   // (c12) the crack's bed is dark cork, not black: from the front c11's read as inked worms on the cheek
  // A DROP standing on a skin (4 m across): a glossy dome, dark where the light enters, bright on the rim away from the sun
  const sunL = new THREE.Vector3();
  Sp.drop = (G, M, o, th, t, R, base, key, pid) => { const q = onLathe(o, th, t), Md = T4(M, frame([q.p[0] + q.n[0] * R * 0.3, q.p[1] + q.n[1] * R * 0.3, q.p[2] + q.n[2] * R * 0.3], q.n, [1, 0.2, 0.1]));
    sunL.copy(SUN_DIR).transformDirection(Md.clone().invert()); const sl = Math.hypot(sunL.x, sunL.z) || 1;
    lathe(G, { pid, L: R * 0.84, R, nu: 12, nv: 5, M: Md, bound: false, prof: (tt) => Math.sqrt(Math.max(0, 1 - tt * tt)) * (0.86 + 0.14 * sst(0, 0.25, tt)), sect: (a) => 1 + 0.07 * Math.sin(a * 2 + key), mat: [1, 0, hsh(key, 2), 0], pat: [0, 0, 0, 0],
      col: (tt, a, S) => { const k = 0.5 - 0.5 * (Math.cos(a) * sunL.x - Math.sin(a) * sunL.z) / sl; setc(S, mix3(mix3(base, P.glaze, 0.45), mix3(base, P.hi, 0.42), k * k * (1 - 0.7 * tt))); } }); };

  // BEEFSTEAK TOMATO: flat-topped, deeply ribbed from the star to the blossom scar, a green star, corky ring cracks round the
  // stalk painted in its own glaze (c14, G4); hero = true adds the cracks' second ring, radial cracks and four drops (the near cheek)
  Sp.tomato = (G, M, D, key = 1, det = 1, hero = false) => {
    const R = D / 2, L = D * 0.7, nr = 9 + Math.floor(hsh(key, 3) * 3), wv = (th) => 0.5 + 0.5 * Math.cos(th * nr + 1.3 * Math.sin(th * 2 + key) + key), pid = G.bounds.length + 1; if (det < 0.5) hero = false;
    const o = { L, R, nu: Math.round(72 * det), nv: Math.round(40 * det), ease: 1, M, prof: sup(2.3), mat: [0.95, 0, hsh(key, 1), hero ? 12.25 : 12], pat: [0.45, 0, R, 0.04],
      sect: (th, t) => { const w = wv(th), d = 0.06 + 0.15 * sst(0.4, 1, t) + 0.07 * sst(0.45, 0.05, t); return 1 - d * w * w * w * (0.6 + 0.8 * hsh(Math.floor(th * nr / TAU + 0.5), key)) + 0.03 * Math.sin(th * 2 + key * 3); },
      bend: (t) => [0, 0, -L * 0.13 * sst(0.8, 1, t) + L * 0.05 * sst(0.2, 0, t)],
      col: (t, th, S) => { const w = wv(th), w3 = w * w * w;
        let c = mix3(P.tomato, P.gold, 0.05 * sst(0.9, 1, t) + 0.04 * vnz(th * 2, t * 5 + key)); c = mix3(c, mix3(P.tomato, P.beet, 0.6), 0.35 * sst(0.35, 0, t) + 0.3 * w3);
        c = mix3(c, mix3(P.gold, P.lettuce, 0.5), 0.5 * sst(0.66, 0.93, t) * (0.3 + 0.7 * sst(0.3, 0.7, vnz(th * 2.6 + key, 1.7))) * (1 - 0.5 * w3));   // GREEN-GOLD SHOULDERS, a clear step from the red (ruling 8 part 4)
        c = mix3(c, P.gold, 0.3 * sst(0.2, 0.02, t) * (1 - w3) * (0.5 + 0.5 * vnz(th * 7, key)));                                       // pale streaks to the blossom end
        setc(S, mix3(c, corkD, sst(0.03, 0.008, t) * 0.9 + 0.5 * sst(0.975, 0.995, t))); } };                                             // the blossom scar; cork under the star
    lathe(G, o);                                                      // a tomato of under half detail (the far cheek on a light build) is never the hero's: one ring of cracks, no drop
    for (let i = 0; i < 6; i++) leaf(G, { L: R * (0.42 + 0.2 * hsh(i, key)), W: R * 0.1, nu: 4, nv: Math.round(8 * det), M: T4(M, TR(0, L * 0.375, 0), RY(i * TAU / 6 + 0.5 * hsh(key, i)), RX(-Math.PI / 2 - 0.1)), width: leafShape(0.5, 1.4), curl: -0.75 - 0.5 * hsh(i, key + 1), cup: 0.5, twist: 0.4 * (hsh(i, key + 2) - 0.5), c: P.bottle, c1: P.savoy, pid: G.bounds.length, mat: [0.3, 0.3, 0.1 * i, 0], pat: [0, 3, 0, 0] });
    Sp.stalk(G, T4(M, TR(0, L * 0.36 + R * 0.12, 0)), R * 0.3, R * 0.045, 0.5, stalkG, det);
    // (c14, G4) THE CORK CRACKS ARE NO LONGER RIBBONS LAID ON THE SKIN (c13: 18 on a hero's, 5 on another, 32 triangles each, 1.4 to 4.4 m broad and tapered to nothing: where
    // a ribbon was finer than the picture's grain it drew as dots). They are painted in the tomato's own glaze (special 12; 12.25 on a hero's: GLAZE_FRAG, hpRing and hpRay), each its exact
    // share of the pixel, so at any size a crack is a line or its own mean. Their places are dealt by the glaze's own hash, so each lies elsewhere than c13's; counts, rings and breadths are c13's.
    if (hero) for (const [th, t, r] of [[0.9, 0.9, 2.1], [2.3, 0.84, 1.7], [4.4, 0.93, 1.4], [5.5, 0.8, 2.0]]) Sp.drop(G, M, o, th, t, r, P.tomato, th * 3 + key, pid);
  };

  // SPANISH ONION: coppery paper skin, veins as meridians meeting at the dry root plate and at the drawn neck (a topknot)
  Sp.onion = (G, M, D, key = 1, det = 1) => {
    const R = D / 2, L = D * 1.22, body = sup(2.15);
    lathe(G, { L, R, nu: Math.round(80 * det), nv: Math.round(52 * det), M, mat: [0.6, 0, hsh(key, 2), 0], pat: [0.3, 7.85, 0, 0], bk: 0.8,
      prof: (t) => { const a = Math.min(1, t / 0.8); return Math.max(body(a) * (1 - 0.1 * sst(0.0, 0.06, 0.06 - t)), (0.2 - 0.11 * sst(0.72, 1, t)) * sst(0.5, 0.74, t) * (t > 0.997 ? 0 : 1)); },
      sect: (th, t) => 1 + 0.02 * Math.sin(th * 3 + key) + 0.012 * Math.sin(th * 23) * sst(0.6, 0.9, t) * 4,
      bend: (t) => [L * 0.07 * sst(0.75, 1, t), L * 0.03 * sst(0.8, 1, t)],
      col: (t, th, S) => { const st = vnz(th * 9 + key, t * 1.4), st2 = vnz(th * 14, t * 2.2 + 4);
        let c = mix3(P.copper, P.gold, 0.55 * st); c = mix3(c, mix3(P.copper, P.umber, 0.55), 0.5 * sst(0.55, 0.85, vnz(th * 11 + 3, t * 1.1 + key))); c = mix3(c, P.cream, 0.55 * sst(0.5, 0.85, st2) + 0.5 * sst(0.07, 0.0, t)); /* PAPERY STREAKS along it: brown where the skin lies double, pale where it has lifted */ c = mix3(c, cork, 0.55 * sst(0.84, 1, t) + 0.3 * sst(0.6, 0.85, vnz(th * 2.1 + 7, t * 3.3))); setc(S, c); } });
    for (let i = 0; i < 9; i++) { const az = i * 2.4 + key; leaf(G, { L: R * (0.22 + 0.12 * hsh(i, key)), W: R * 0.012 + 0.45, nu: 2, nv: 5, M: T4(M, TR(Math.cos(az) * R * 0.07, -L * 0.5 * 0.985, Math.sin(az) * R * 0.07), RY(-az), RX(Math.PI - 0.5 - 0.5 * hsh(i, 7))), width: (t) => 1 - 0.7 * t, curl: 0.9 * (hsh(i, key) - 0.3), c: P.cream, c1: cork, pid: G.bounds.length, mat: [0.1, 0, 0, 0], pat: [0, 9, 0, 0] }); }
  };

  // HORN PEPPER, hung stalk up (t = 1): broad at the shoulder, running to a hooked point; a green cap and a bent stalk
  Sp.pepper = (G, M, L, R, key = 1, det = 1, o = {}) => {   // o.hook: how far the point hooks (1); o.taper: the power of its taper (0.72; lower is a blunter, fuller body); o.sx, o.sz: its section flattened (1, 1)
    const hook = o.hook ?? 1, taper = o.taper ?? 0.72;
    lathe(G, { L, R, sx: o.sx || 1, sz: o.sz || 1, nu: Math.round(48 * det), nv: Math.round(56 * det), M, mat: [1, 0, hsh(key, 4), 0], pat: [0.05, 0, 0, 0], bk: 0.7,
      prof: (t) => Math.pow(Math.min(1, t * 1.25 + 0.004), taper) * (1 - 0.3 * sst(0.9, 1, t) * sst(0.9, 1, t)) * (0.92 + 0.08 * Math.sin(t * 7 + key)) * (t > 0.999 ? 0 : 1),
      sect: (th, t) => 1 - 0.11 * sst(0.25, 1, t) * Math.pow(0.5 + 0.5 * Math.cos(th * 3 + 0.8 * t + key), 2) + 0.05 * Math.sin(th + t * 5),
      bend: (t) => { const k = sst(0.42, 0, t); return [L * 0.2 * hook * k * k - L * 0.035 * Math.sin(t * 5.5), L * 0.03 * Math.sin(t * 4 + key)]; },
      col: (t, th, S) => { let c = mix3(P.gold, P.tomato, 0.14 * sst(0.3, 0, t) + 0.16 * vnz(th * 1.5 + key, t * 4)); c = mix3(c, P.lemon, 0.25 * vnz(th * 2 + 9, t * 3)); setc(S, mix3(c, P.lettuce, 0.6 * sst(0.9, 0.99, t))); } });
    lathe(G, { pid: G.bounds.length, L: R * 0.5, R: R * 0.78, nu: Math.round(24 * det), nv: 6, M: T4(M, TR(0, L * 0.5 - R * 0.06, 0)), bound: false, prof: (t) => (1 - 0.75 * t * t) * (t > 0.99 ? 0.3 : 1), sect: (th) => 1 + 0.1 * Math.cos(th * 6), mat: [0.45, 0, 0.5, 0], pat: [0, 1.5, 0, 0], col: (t, th, S) => setc(S, mix3(P.savoy, P.lettuce, 0.3 + 0.3 * t)) });
    Sp.stalk(G, T4(M, TR(0, L * 0.5 + R * 0.35, 0), RZ(-0.25)), R * 1.5, R * 0.2, -0.55, stalkG, det * 1.4);
  };

  // BOTTLE GOURD, hung stalk up (t = 1): a narrow neck (0.4 of the belly) bowed a little, the belly low (widest a third up
  // from the blossom end), a blunt round end with the dry scar in a shallow dimple; three to five low uneven lobes by key;
  // a short woody stalk in a corky collar; one bruise, one healed crack, two drops. Warm buff to yellow-green, paler in
  // broad soft patches, pores, russet at both ends, a warm flush on the side o.sun (the angle round the body that faces the sun).
  // (c12, W3) A GOURD FIRST: ten lengthwise ribs with a furrow between each (true shape; the glaze lays one green stripe in every
  // furrow and warts on the ribs), a green-to-yellow mottle (yellow at the blossom end, green toward the neck, the border between
  // them broken in patches), and the dry scar a small one in its dimple where the ribs meet (c11's russet end read as a brown smudge
  // 20 m across from the front).
  Sp.gourd = (G, M, L, R, key = 1, det = 1, o = {}) => {   // o.sx, o.sz: its section; o.bow: how far the neck bows toward +X (in R)
    const nl = 3 + Math.floor(hsh(key, 1) * 2.99), bow = (o.bow ?? 0.2) * R, sunTh = o.sun ?? 0.6, pid = G.bounds.length + 1, TB = 0.34, NR = 10;
    const gold = mix3(P.lemon, P.husk, 0.3), green = mix3(P.savoy, P.lettuce, 0.4), deep = mix3(P.savoy, P.bottle, 0.3);
    const ribF = (th) => { const a = th * NR, w = 0.5 + 0.5 * Math.cos(a); return Math.pow(w, 1.6) * (0.65 + 0.35 * hsh(((Math.floor(a / TAU + 0.5) % NR) + NR) % NR, key + 5)); };   // 1 in a furrow's bed, 0 on a rib's crest; each furrow of its own depth
    const buff = mix3(P.husk, P.cream, 0.14), yg = mix3(P.muscat, P.lettuce, 0.4), furrow = mix3(P.savoy, P.muscat, 0.4), russet = mix3(cork, P.copper, 0.3), warm = mix3(P.gold, P.copper, 0.5);
    const lobe = (th) => { const a = th * nl + key + 0.7 * Math.sin(th + key * 2), w = 0.5 + 0.5 * Math.cos(a); return w * w * (0.45 + 0.55 * hsh(Math.floor(a / TAU + 0.5) + 3, key)); };
    const body = { L, R, sx: o.sx || 1, sz: o.sz || 1, nu: Math.round(60 * det), nv: Math.round(40 * det), ease: 1, M, mat: [0.7, 0, hsh(key, 4), 13], pat: [0.4, TAU * R / NR, R, 0], bk: 0.8, cast: o.cast ?? 1,   // (c12: 60 by 40, six columns to a rib; c11's 48 by 50 is the same 4,800 triangles)
      prof: (t) => { const end = Math.pow(Math.max(0, 1 - Math.pow(Math.max(0, 1 - t / TB), 2.5)), 0.4), neck = 0.4 + 0.03 * Math.sin(t * 9 + key) - 0.04 * sst(0.78, 0.92, t);
        return (t < TB ? end : 1 + (neck - 1) * sst(TB, 0.76, t)) * (1 - 0.7 * sst(0.95, 1, t)) * (t > 0.999 ? 0 : 1); },
      sect: (th, t) => 1 - 0.05 * sst(0.01, 0.16, t) * sst(0.8, 0.4, t) * lobe(th) - 0.085 * ribF(th) * sst(0.0, 0.05, t) * sst(0.9, 0.55, t) + 0.02 * Math.sin(th * 2 + key * 3) + 0.012 * Math.sin(th * 3 + t * 7),
      bend: (t) => [bow * sst(0.36, 1, t) + R * 0.03 * Math.sin(t * 5 + key), R * 0.04 * Math.sin(t * 3.1 + key * 2), L * 0.02 * sst(0.04, 0, t)],
      col: (t, th, S) => { const pa = vnz(th * 1.4 + key, t * 3.2), pb = vnz(th * 2.3 + 5, t * 5 + key), pc = vnz(th * 4.3 + 9, t * 11 + key * 2), fl = Math.pow(0.5 + 0.5 * Math.cos(th - sunTh), 2) * sst(0.06, 0.4, t);
        const gk = sst(0.42, 0.66, 0.62 * pb + 0.2 * pc + 0.62 * (t - 0.12) - 0.1 * fl);                                    // THE MOTTLE: how green (0 the yellow of the blossom end, 1 the green of the neck), its border broken in patches of two sizes
        let c = mix3(mix3(gold, yg, 0.25 + 0.3 * pa), mix3(green, deep, 0.6 * sst(0.45, 0.8, pc) * sst(0.3, 0.7, t)), gk);
        c = mix3(c, furrow, 0.3 * lobe(th) * sst(0.04, 0.22, t) * sst(0.97, 0.6, t) * (0.55 + 0.45 * pb));                         // a greener cast in the hollows between its low lobes
        c = mix3(c, mix3(P.cream, P.husk, 0.3), 0.3 * sst(0.55, 0.8, pa) * (1 - 0.6 * gk));                                  // paler mottling in broad soft patches on the yellow
        c = mix3(c, warm, 0.3 * fl);                                                                                        // the flush toward the sun
        c = mix3(c, mix3(P.soil, P.copper, 0.3), 0.5 * Math.exp(-(Math.pow(th - 2.1, 2) / 0.05 + Math.pow(t - 0.45, 2) / 0.003)));   // one bruise
        c = mix3(c, russet, Math.min(0.85, 0.4 * sst(0.012, 0.002, t) + 0.75 * sst(0.9, 0.985, t) + 0.2 * sst(0.62, 0.8, vnz(th * 6 + 1, t * 16)) * (sst(0.1, 0.02, t) + sst(0.8, 0.95, t))));   // russet at the neck, a trace round the scar
        setc(S, mix3(c, corkD, sst(0.0012, 0.0002, t))); } };                                                               // the dry scar: the pole alone, in its dimple
    lathe(G, body);
    lathe(G, { pid, L: R * 0.13, R: R * 0.17, nu: Math.round(14 * det), nv: 4, M: T4(M, TR(bow, L * 0.5 - R * 0.035, 0)), bound: false, prof: (t) => Math.sqrt(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.02)))), sect: (th) => 1 + 0.12 * Math.cos(th * 5 + key), mat: [0.1, 0, 0.5, 0], pat: [0.5, 0, 0, 0], col: (t, th, S) => setc(S, mix3(cork, corkD, 0.3 + 0.5 * vnz(th * 4, t * 3))) });   // the corky collar
    Sp.stalk(G, T4(M, TR(bow, L * 0.5 + R * 0.01, 0), RZ(o.lean ?? 0.3)), R * 0.5, R * 0.075, o.hookS ?? -0.5, mix3(cork, P.soil, 0.35), det * 1.3, pid);
    if (det < 0.5) return body;                                           // the river's double carries no crack and no drop
    Sp.crack(G, M, body, [sunTh + 0.5, 0.3], [sunTh + 1.1, 0.215], 0, 0.011, key + 2, pid);
    for (const [th, t, r] of [[sunTh + 0.25, 0.43, 1.9], [sunTh + 1.3, 0.14, 1.5]]) Sp.drop(G, M, body, th, t, r, buff, th * 3 + key, pid);
    return body;
  };

  // PHYSALIS: a paper husk split in four and curled back round an amber berry; its light is painted by place (special 3)
  Sp.physalis = (G, M, D, key = 1, det = 1, closed = false, berry = 1) => {   // berry: the berry's size (1: 0.44 of the husk)   // closed: the husk whole, its four ribbed panels drawn to a point over the berry (which is not made)
    const R = D / 2, pid = G.bounds.length + 1;
    if (!closed) lathe(G, { L: D * 0.44 * berry, R: D * 0.22 * berry, nu: Math.round(28 * det), nv: Math.round(18 * det), ease: 1, M: T4(M, TR(0, D * 0.2, 0)), prof: ball, bound: false, mat: [0.9, 0, 0.2, 3], pat: [0, 0, 0, 0],
      col: (t, th, S) => setc(S, mix3(mix3(P.gold, P.tomato, 0.28), P.husk, 0.25 * vnz(th * 2, t * 4))) });
    for (let i = 0; i < 4; i++) { const open = closed ? 1.67 : 0.62 + 0.3 * hsh(i, key);
      leaf(G, { L: R * (closed ? 1.95 : 1.75), W: R * (closed ? 0.78 : 0.6), nu: Math.round(10 * det), nv: Math.round(18 * det), M: T4(M, RY(i * TAU / 4 + 0.35 * hsh(key, i) + 0.3), RX(open * 0.72), TR(0, 0, -R * 0.05)), width: leafShape(0.48, 1.25), curl: closed ? -2.45 - 0.1 * hsh(i, key + 1) : 0.7 + 0.8 * hsh(i, key + 1), cup: closed ? -0.55 : -0.75, frill: [R * 0.05, 3], ph: i, twist: 0.25 * (hsh(i, 3) - 0.5), rib: R * 0.03,
        col: (v, s, S) => setc(S, mix3(mix3(P.husk, P.cream, 0.25 + 0.3 * vnz(s * 3 + i, v * 6)), P.copper, 0.3 * sst(0.75, 1, v) + 0.35 * sst(0.2, 0, v))), pid, mat: [0.12, 0.45, 0.1 * i, 3], pat: [0, R * 0.2, 0.3, 0] }); }
    Sp.stalk(G, T4(M, TR(0, -R * 0.3, 0), RX(Math.PI)), R * 0.5, R * 0.06, 0.4, cork, det, pid);
    addBound(G, M, R * 0.6 * berry, R * 0.6 * berry, R * 0.6 * berry, [0, 0], D * 0.15, 0.6);
  };

  // CLOSED COURGETTE FLOWER: a twisted gold spindle on a ribbed green base; no hairs
  Sp.courgetteFlower = (G, M, L, R, key = 1, det = 1) => {
    lathe(G, { L, R, nu: Math.round(40 * det), nv: Math.round(44 * det), M, mat: [0.4, 0.3, hsh(key, 5), 0], pat: [0, 2.4, 0, 0], bk: 0.75,
      prof: (t) => (0.42 + 0.58 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (1 - 0.25 * t)) * (0.03 + 0.97 * sst(1.0, 0.72, t)) * sst(0, 0.03, t + 0.012),
      sect: (th, t) => 1 + (0.06 + 0.16 * t) * Math.cos(th * 5 + t * 5.5 + key),
      bend: (t) => [L * 0.2 * Math.sin(Math.PI * t), L * 0.05 * Math.sin(t * 5)],
      col: (t, th, S) => { const str = 0.5 + 0.5 * Math.cos(th * 5 + t * 5.5 + key); let c = mix3(P.gold, mix3(P.gold, P.tomato, 0.35), 0.5 * sst(0.55, 1, t) + 0.2 * vnz(th * 3, t * 7)); c = mix3(c, P.lettuce, sst(0.4, 0.12, t)); setc(S, mix3(c, P.savoy, sst(0.5, 0.15, t) * str * 0.8)); } });
    for (let i = 0; i < 5; i++) leaf(G, { L: L * 0.26, W: R * 0.16, nu: 2, nv: 6, M: T4(M, TR(0, -L * 0.47, 0), RY(i * TAU / 5 + key), TR(0, 0, R * 0.36), RX(0.3)), width: (t) => 1 - 0.85 * t, curl: -0.5, c: P.savoy, c1: P.lettuce, pid: G.bounds.length, mat: [0.3, 0.2, 0, 0], pat: [0, 5, 0, 0] });
    Sp.stalk(G, T4(M, TR(0, -L * 0.5, 0), RX(Math.PI)), L * 0.2, R * 0.2, 0.2, stalkG, det);
  };

  // A DARK CHERRY SEATED IN AN OPENED LANTERN HUSK (the eyes; ruling 8 part 2). M: +Y out of the hollow, +X up. The cherry
  // (D across) is near black, wine red where the sun reaches it, glossy, with one small highlight painted by place (special 3)
  // and its own short stalk leaning out at one side. The husk is pale paper split in four: two long panels laid out level to
  // either side (the opening's corners) and two blunt ones curled close over the fruit above and below, so the cup's opening is
  // a level almond about 1.8 D long and 0.85 D high. o.turn: the husk turned about its axis; o.lids: how far round the fruit
  // the upper and the lower panel reach (radians); o.lean: the cherry's own axis [about Z, about X]; o.bloom: a sloe's film.
  Sp.husked = (G, M, D, key = 1, det = 1, o = {}) => {
    const rb = D / 2, pid = G.bounds.length + 1, turn = o.turn ?? 0, lids = o.lids || [2.3, 2.05], lean = o.lean || [-0.75, 0.5], rho = rb + 0.9;
    const wine = mix3(P.beet, P.deep, 0.5), black = mix3(P.violet, P.deep, 0.86), paper = mix3(P.husk, P.cream, 0.45);
    const Mb = T4(M, TR(0, rb + 1, 0), RZ(lean[0]), RX(lean[1])), sb = new THREE.Vector3().copy(SUN_DIR).transformDirection(Mb.clone().invert());   // the sun in the cherry's own space: wine red is painted only on the side turned to it
    lathe(G, { L: D * 0.97, R: rb, nu: Math.round(30 * det), nv: Math.round(20 * det), ease: 1, M: Mb, bound: false, pid, mat: [1, 0, hsh(key, 2), 3], pat: [0, 0, 0, o.bloom ?? 0],
      prof: (t) => ball(t) * (1 - 0.1 * sst(0.9, 1, t)), bend: (t) => [0, 0, -D * 0.04 * sst(0.88, 1, t)],
      col: (t, th, S) => { const k = ball(t) * (Math.cos(th) * sb.x - Math.sin(th) * sb.z) + (2 * t - 1) * sb.y; setc(S, mix3(mix3(black, wine, sst(0.25, 0.9, k) * (0.7 + 0.3 * vnz(th * 1.5 + key, t * 3))), cork, 0.45 * sst(0.955, 1, t))); } });
    Sp.stalk(G, T4(Mb, TR(0, D * 0.42, 0)), D * 0.4, D * 0.022, 0.55, mix3(stalkG, cork, 0.55), det, pid);
    for (let i = 0; i < 4; i++) { const lid = i & 1, th = lid ? lids[i >> 1] : 0, Ll = lid ? rho * th : rb * (1.95 + 0.25 * hsh(i, key)), tilt = lid ? 1.5 : 1.0 + 0.22 * hsh(i, key + 2);
      leaf(G, { L: Ll, W: lid ? rb * (0.98 - 0.1 * (i >> 1)) : rb * 0.62, nu: Math.round(10 * det), nv: Math.round((lid ? 20 : 14) * det), M: T4(M, RY(turn + i * TAU / 4 + 0.12 * (hsh(key, i) - 0.5)), RX(tilt)),
        width: lid ? (t) => Math.pow(Math.sin(Math.PI * 0.5 * Math.min(1, t / 0.42 + 0.02)), 0.7) * (1 - 0.34 * sst(0.72, 1, t)) : leafShape(0.48, 1.25), curl: lid ? -th : 0.35 + 0.4 * hsh(i, key + 1), cup: lid ? -0.5 : -0.7,
        frill: [rb * (lid ? 0.045 : 0.08), 3], ph: i + key, twist: 0.2 * (hsh(i, 3 + key) - 0.5), rib: rb * 0.05, pid, mat: [0.12, 0.45, 0.1 * i, 3], pat: [0, rb * 0.34, 0.3, 0],
        col: (v, s, S) => setc(S, mix3(mix3(paper, P.cream, 0.5 * vnz(s * 3 + i, v * 6 + key)), P.copper, 0.28 * sst(0.2, 0, v) + (lid ? 0.1 : 0.3) * sst(0.8, 1, v))) }); }
    Sp.stalk(G, T4(M, TR(0, -rb * 0.2, 0), RX(Math.PI)), rb * 0.8, rb * 0.1, 0.4, cork, det, pid);
    addBound(G, M, rb * 0.95, rb * 0.95, rb * 0.95, [0, 0], rb + 1, 0.6);
  };

  // A DARK COURGETTE, bowed (the brows): bottle green going to black green in its furrows, five low ribs, pale flecks, a thick
  // five-sided stalk (t = 1) and its withered flower, small and tan, still on the blossom end (t = 0). o.bow: its arch (in L).
  Sp.courgette = (G, M, L, R, key = 1, det = 1, o = {}) => {
    const bow = (o.bow ?? 0.14) * L, pid = G.bounds.length + 1, dk = mix3(P.bottle, P.deep, 0.38), gr = mix3(P.bottle, P.savoy, 0.45);
    lathe(G, { L, R, nu: Math.round(26 * det), nv: Math.round(40 * det), M, mat: [0.72, 0, hsh(key, 5), 0], pat: [0.8, 0, 0, 0], bk: 0.7, cast: o.cast ?? 1,
      prof: (t) => Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.97 + 0.015))), 0.3) * (0.8 + 0.2 * sst(0.75, 0.3, t) + 0.05 * Math.sin(t * 9 + key)) * (1 - 0.3 * sst(0.9, 1, t)),
      sect: (th, t) => 1 + 0.06 * Math.cos(th * 5 + key) + 0.02 * Math.sin(th * 11 + t * 7),
      bend: (t) => [bow * (Math.sin(Math.PI * t) - 0.64) + L * (o.sag ?? 0.03) * sst(0.5, 0, t), L * 0.025 * Math.sin(t * 5 + key)],
      col: (t, th, S) => { const rib = 0.5 + 0.5 * Math.cos(th * 5 + key), fl = sst(0.62, 0.8, vnz(th * 9 + key, t * 30)); let c = mix3(dk, gr, 0.75 * rib * (0.6 + 0.4 * vnz(th * 2, t * 6)));
        c = mix3(c, P.lettuce, 0.3 * fl + 0.25 * sst(0.07, 0, t)); setc(S, mix3(c, mix3(P.muscat, P.savoy, 0.5), 0.5 * sst(0.9, 1, t))); } });
    lathe(G, { pid, bound: false, L: L * 0.13, R: R * 0.5, nu: Math.round(10 * det), nv: Math.round(8 * det), M: T4(M, TR(-bow * 0.64 + L * (o.sag ?? 0.03), -L * 0.545, 0), RZ(0.5 * Math.sin(key * 2)), RX(Math.PI)), mat: [0.1, 0, 0.3, 0], pat: [0, 1.4, 0, 0],
      prof: (t) => (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.2))) * (1 - 0.8 * sst(0.6, 1, t)) * (t > 0.995 ? 0 : 1), sect: (th, t) => 1 + 0.3 * Math.cos(th * 5 + t * 6 + key),
      col: (t, th, S) => setc(S, mix3(mix3(P.husk, P.copper, 0.4 + 0.4 * vnz(th * 3, t * 6)), P.soil, 0.5 * sst(0.5, 1, t))) });
    Sp.stalk(G, T4(M, TR(-bow * 0.64, L * 0.49, 0)), R * 1.5, R * 0.34, 0.35, mix3(stalkG, P.bottle, 0.4), det, pid);
  };
  return moreSpecimens(Sp, P, setc, cork, stalkG);
}
function moreSpecimens(Sp, P, setc, cork, stalkG) {
  const magenta = mix3(P.beet, P.tomato, 0.35);
  // BEETROOT with earth on it: t = 0 the tap root, t = 1 the crown with a trimmed sheaf of stalks (never pale at the cut)
  Sp.beet = (G, M, L, R, key = 1, det = 1, sheaf = 6) => {
    lathe(G, { L, R, nu: Math.round(40 * det), nv: Math.round(36 * det), M, mat: [0.38, 0, hsh(key, 6), 14], pat: [0.45, 0, R, 0.1], bk: 0.85,
      prof: (t) => Math.max(sup(2.2)(Math.min(1, Math.max(0, (t - 0.16) / 0.84))), 0.3 * Math.pow(Math.max(0, t / 0.3), 1.6) * sst(0.36, 0.18, t) + 0.012 * sst(0, 0.01, t)) * (1 + 0.04 * Math.sin(t * 40)),
      sect: (th, t) => 1 + 0.05 * Math.sin(th * 2 + key) + 0.03 * Math.sin(th * 5 + t * 6),
      bend: (t) => [L * 0.1 * sst(0.3, 0, t) * Math.sin(key), L * 0.08 * sst(0.3, 0, t) * Math.cos(key)],
      col: (t, th, S) => { const e = sst(0.42, 0.7, vnz(th * 2.3 + key, t * 5.5)) * 0.8 + 0.5 * sst(0.25, 0, t); let c = mix3(P.beet, P.violet, 0.4 * vnz(th * 4, t * 9 + key)); c = mix3(c, magenta, 0.62 * sst(0.62, 0.96, t) * (0.6 + 0.4 * vnz(th * 3 + key, 2.2))); setc(S, mix3(c, P.soil, Math.min(0.85, e))); } });   // a rose shoulder under the sheaf, earth lower down
    for (let i = 0; i < sheaf; i++) { const az = i * 2.4 + key, rr = R * 0.13 * Math.sqrt(i + 0.5) / Math.sqrt(sheaf);
      lathe(G, { pid: G.bounds.length, L: R * (0.75 + 0.5 * hsh(i, key)), R: R * 0.075, nu: Math.round(8 * det), nv: 5, M: T4(M, TR(Math.cos(az) * rr, L * 0.47, Math.sin(az) * rr), RZ(0.3 * Math.cos(az) * (0.4 + i / sheaf)), RX(0.3 * Math.sin(az) * (0.4 + i / sheaf)), TR(0, R * 0.35, 0)), bound: false, prof: (t) => (1 - 0.3 * t) * (t > 0.99 ? 0 : 1), sect: (th) => 1 + 0.2 * Math.cos(th * 2), mat: [0.5, 0, 0.1 * i, 0], pat: [0, 0.9, 0, 0], col: (t, th, S) => setc(S, mix3(magenta, P.beet, 0.5 * hsh(i, key) + 0.4 * t)) }); }
  };
  // LEMON laid lengthways: nipple at t = 1, a green flush, pores, one glossy leaf at the stem end
  Sp.lemon = (G, M, L, R, key = 1, det = 1) => {
    lathe(G, { L, R, nu: Math.round(48 * det), nv: Math.round(44 * det), ease: 1, M, mat: [0.8, 0, hsh(key, 7), 15], pat: [1, 0, R, 0],
      prof: (t) => Math.max(sup(2.05)(Math.min(1, t / 0.93)), 0.2 * sst(0.8, 0.93, t) * sst(1.0, 0.97, t) + 0.08 * sst(1, 0.985, t) * sst(0.8, 0.9, t)) * (1 + 0.012 * Math.sin(t * 31)),
      sect: (th, t) => 1 + 0.025 * Math.sin(th * 3 + key) + 0.015 * Math.sin(th * 7 + t * 9),
      col: (t, th, S) => { const g = sst(0.45, 0.8, vnz(th * 1.3 + key, t * 2.5)) * 0.5 + 0.8 * sst(0.6, 0.93, t) + 0.3 * sst(0.08, 0, t); setc(S, mix3(mix3(P.lemon, P.gold, 0.25 * vnz(th * 3, t * 6)), mix3(P.lettuce, P.savoy, 0.35 * sst(0.75, 1, t)), Math.min(0.85, g))); } });   // ITS GREEN END: the nipple's third is unripe green
    leaf(G, { L: R * 2.3, W: R * 0.62, nu: Math.round(8 * det), nv: Math.round(14 * det), M: T4(M, TR(0, -L * 0.47, R * 0.1), RX(Math.PI * 0.62), RZ(0.5)), width: leafShape(0.6, 1.1), curl: 0.55, cup: 0.3, twist: 0.25, rib: R * 0.04, c: P.bottle, c1: P.savoy, pid: G.bounds.length, mat: [0.75, 0.25, 0.4, 0], pat: [0, R * 0.12, 0, 0] });
    Sp.stalk(G, T4(M, TR(0, -L * 0.5, 0), RX(Math.PI)), R * 0.35, R * 0.07, 0.3, cork, det);
  };
  // BEAN POD: bowed, lumped over its beans, a hooked stalk; wax (gold) or runner (green)
  Sp.pod = (G, M, L, R, key = 1, det = 1, wax = true, round = false, dark = 0) => {   // dark: a runner bean gone to bottle green (the near eye's lid)   // round: a hanging pod of the nave, round in section, swollen over each bean (never fewer than eight sides)
    const nb = 5 + Math.floor(hsh(key, 1) * 3), bow = (0.1 + 0.14 * hsh(key, 2)) * L, ca = wax ? mix3(P.gold, P.lemon, 0.55) : mix3(P.lettuce, P.bottle, dark), cb = wax ? P.gold : mix3(P.savoy, mix3(P.bottle, P.deep, 0.4), dark);
    lathe(G, { L, R, nu: round ? Math.max(8, Math.round(16 * det)) : Math.round(16 * det), nv: Math.round(44 * det), M, sz: round ? 0.9 : 0.62, mat: [round ? 0.8 : 0.6, 0, hsh(key, 8), 0], pat: [0.1, 0, 0, 0.25], bk: 0.62,
      prof: (t) => ((round ? 0.5 : 0.66) + (round ? 0.5 : 0.34) * Math.pow(Math.abs(Math.sin(Math.PI * (t * nb * 0.94 + 0.03))), 0.7)) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, t * 0.985 + 0.01))), 0.42) * (0.82 + 0.18 * hsh(Math.floor(t * nb * 0.94 + 0.03), key)),
      bend: (t) => [bow * (4 * t * (1 - t) - 0.5) + L * 0.05 * sst(0.9, 1, t), L * 0.03 * Math.sin(t * 6 + key)],
      col: (t, th, S) => { const seam = Math.pow(Math.abs(Math.cos(th)), 14); setc(S, mix3(mix3(ca, cb, 0.6 * vnz(th + key, t * 7) + 0.25 * sst(0.9, 1, t)), wax ? cork : P.bottle, 0.4 * seam + 0.5 * sst(0.05, 0, t))); } });
    Sp.stalk(G, T4(M, TR(bow * -0.5 + L * 0.05, L * 0.495, 0)), R * 1.3, R * 0.16, 0.7, stalkG, det);
  };
  // FENNEL BULB: flattened, sheath over sheath (three stepped edges round the girth, each with a pale lip over a shaded step),
  // a rounded white foot on a brown root plate (t = 0), cut stalk stubs fanned at t = 1
  Sp.fennel = (G, M, L, R, key = 1, det = 1, soft = 0) => {
    const edge = (th, t) => Math.sin(th * 1.5 + 0.6 + key + 0.7 * t), pale = mix3(P.cream, P.lettuce, 0.22);
    // (c12, F2) THE MESH TURNS WITH THE SHEATHS: a sheath's edge climbs aslant (0.7 t in its phase), and on an upright mesh its
    // step and its pale lip crossed the columns as a stair; the columns now climb with it (twist), so each edge lies along one
    // column from foot to top. The green veins are the glaze's alone (special 16, drawn by the pixel along the same columns):
    // c11's 26 vertex ribs stood 1.35 to 2.5 columns apart and broke into teeth along the mesh's diagonals. TESTED: the turn and
    // the wash alone did NOT take the saw seen from 3,200 m on off the far jaw; that was its cast shade's edge on its coarse mesh,
    // and is cured by `soft` (the passes of easing over this body's own baked shade: see bakeShade's tail).
    lathe(G, { L, R, nu: Math.round(64 * det), nv: Math.round(34 * det), M, sz: 0.66, mat: [0.5, 0, hsh(key, 9), 16], pat: [0.3, 9, R, 0], twist: (t) => -0.7 * t / 1.5, soft,
      prof: (t) => Math.sin(Math.PI * 0.5 * Math.pow(Math.min(1, t / 0.4), 0.6)) * (1 - 0.34 * sst(0.5, 1, t)) * (t > 0.996 ? 0 : 1) * (1 + 0.015 * Math.sin(t * 17 + key)),
      sect: (th, t) => { const e = edge(th, t); return 1 + 0.1 * Math.sign(e) * sst(0, 0.16, Math.abs(e)) * sst(0.06, 0.35, t) + 0.025 * Math.sin(th * 4 + key); },
      col: (t, th, S) => { const e = edge(th, t), lip = sst(0.3, 0.0, Math.abs(e)) * sst(0.06, 0.35, t);
        let c = mix3(mix3(pale, P.lettuce, 0.2 + 0.65 * sst(0.2, 0.95, t)), P.savoy, 0.22 * vnz(th * 3 + key, t * 3) + 0.25 * sst(0.75, 1, t));
        c = mix3(c, P.savoy, 0.16 * sst(0.1, 0.4, t) * (0.6 + 0.4 * vnz(th * 5, t * 4 + key)));   // a soft green wash where c11's vertex ribs ran (their mean): the veins themselves are drawn by the glaze
        c = mix3(c, e > 0 ? P.cream : P.bottle, lip * (e > 0 ? 0.45 : 0.6)); setc(S, mix3(c, cork, sst(0.035, 0.01, t) * 0.85)); } });
    for (let i = 0; i < 5; i++) { const Ls = L * (0.42 + 0.34 * hsh(i, key));
      lathe(G, { pid: G.bounds.length, L: Ls, R: R * (0.15 + 0.05 * hsh(i, key + 1)), nu: Math.round(12 * det), nv: 7, M: T4(M, TR((i - 2) * R * 0.3, L * 0.44, 0), RZ(-(i - 2) * 0.24), RX(0.12 * (hsh(i, 3) - 0.5)), TR(0, Ls * 0.5, 0)), bound: false, sz: 0.7, prof: (t) => (1 - 0.25 * t) * (t > 0.99 ? 0 : 1), sect: (th) => 1 + 0.07 * Math.cos(th * 9), mat: [0.45, 0, 0.1 * i, 0], pat: [0, 1.6, 0, 0],
        col: (t, th, S) => setc(S, mix3(mix3(P.lettuce, P.savoy, 0.2 + 0.4 * t), mix3(P.lettuce, P.cream, 0.35), sst(0.9, 0.99, t))) }); }
  };
  // CELERY STALK: a ribbed crescent, pale at the foot; a head of celery is a ring of these
  Sp.celery = (G, M, L, R, key = 1, det = 1) => lathe(G, { L, R, nu: Math.round(22 * det), nv: Math.round(16 * det), M, sz: 0.6, mat: [0.55, 0, hsh(key, 10), 0], pat: [0, 2.6, 0, 0], bk: 0.8,
    prof: (t) => (1.05 - 0.4 * t) * (0.6 + 0.4 * sst(0, 0.08, t)) * (t > 0.995 || t < 0.005 ? 0 : 1), sect: (th) => 1 + 0.08 * Math.cos(th * 5 + key) - 0.24 * Math.pow(Math.max(0, Math.sin(th)), 3),
    bend: (t) => [0, L * 0.05 * Math.sin(t * 3 + key)], col: (t, th, S) => setc(S, mix3(mix3(P.cream, P.lettuce, 0.62 + 0.33 * sst(0.1, 0.8, t)), P.savoy, 0.25 * vnz(th * 2 + key, t * 4) + 0.12 * (0.5 - 0.5 * Math.cos(th * 5 + key)))) });   // pale lettuce green, a little deeper in the grooves between its ribs
  // HALF A RED CABBAGE, cut face outward (+Y of the piece): a bloomed dome behind, the wet maze on a dished plate in front
  const maze = (x, y) => { const ang = Math.atan2(x, y + 20.0001); return Math.hypot(x * 1.12, y + 10) + 2.3 * Math.sin(ang * 9 + y * 0.21) + 1.4 * Math.sin(ang * 17 - x * 0.33) + 1.5 * Math.sin(x * 0.5 + y * 0.37); };
  Sp.cutCabbage = (G, M, H, W, key = 1, det = 1) => {         // H tall (the piece's -Z is up the face), W across
    const a = W / 2, b = H / 2, pid = G.bounds.length + 1;
    lathe(G, { L: a * 1.5, R: 1, sx: a, sz: b, nu: Math.round(40 * det), nv: Math.round(14 * det), M: T4(M, TR(0, -a * 0.75, 0)), bound: false, prof: (t) => Math.sqrt(Math.max(0, 1 - (1 - t) * (1 - t))) * (1 + 0.02 * Math.sin(t * 20)), sect: (th, t) => 1 + 0.03 * Math.sin(th * 6 + t * 5), mat: [0.5, 0, 0.3, 0], pat: [0, 4, 0.3, 0.75],
      col: (t, th, S) => { S.a = th * a; S.b2 = t * a * 1.5; setc(S, mix3(P.violet, P.beet, 0.3 * vnz(th * 3, t * 5))); } });
    surf(G, { nu: Math.round(56 * det), nv: Math.round(26 * det), wrap: true, M, mat: [0.7, 0, 0, 1], pat: [0, 0, 0, 0], pid, f: (u, v, S) => {
      const th = u * TAU, r = 1 - v, x = Math.cos(th) * a * r, y = Math.sin(th) * b * r, d = maze(x, y), band = Math.abs((d / 5.2) % 1 - 0.5) * 2;
      S.x = x; S.z = -y; S.y = -1.2 * (1 - r * r) + 0.9 * sst(0.2, 0.6, band) * sst(1, 0.9, r) - 0.9; S.a = x; S.b2 = y; S.r = P.violet[0]; S.g = P.violet[1]; S.b = P.violet[2]; } });
    // (c13, K4) THE DOME WEARS AN OUTER LEAF ON EACH FLANK. Seen along the cut (the ear from the front, 3,043 m) the dome's side was a flat mauve slab: its ribs of 4 m are filtered
    // away at that distance and its bloom is one even film. A wrapper leaf in the LEAF form (a pale midrib, side ribs, a swell either side of it) lies on each flank as an exact
    // offset of the dome's own surface (its lobes included), 1.0 m clear and a little more at its free rim; toward the cut its blade ends 0.05 rad short of the rim, cut with the head.
    // Its foot is low on the face, its tip high; it carries the dome's own number, so the bake does not shade it by its own head. 120 triangles each; nothing moves, nothing is read.
    { const D = a * 1.5, fc = 0.16, Wl = a * 0.5, Lm = (a + b) / 2, wfl = leafShape(0.62, 0.6);
      for (const sd of [-1, 1]) surf(G.L || G, { nu: 5, nv: 12, wrap: false, M, mat: [0.25, 0.1, hsh(key, 31 + sd), 0], pat: [Wl, Wl * 0.16, 0.3, 0.3], pid, f: (u, v, S) => {
        const s = u * 2 - 1, be = -1.3 + 2.5 * v, cb = Math.cos(be), mf = cb * Math.hypot(a * Math.sin(fc), D * Math.cos(fc)), w0 = Wl * wfl(v), w = sd * s < 0 ? Math.min(w0, (fc - 0.05) * mf) : w0;
        const ph = fc + sd * s * w / mf, yy = Math.sin(ph) * cb, t = 1 - yy, th = Math.atan2(Math.sin(be), sd * Math.cos(ph) * cb), k = (1 + 0.02 * Math.sin(t * 20)) * (1 + 0.03 * Math.sin(th * 6 + t * 5));
        const x = sd * a * Math.cos(ph) * cb * k, y = -D * yy, z = -b * Math.sin(be) * k, nx = x / (a * a), ny = y / (D * D), nz = z / (b * b), nl = Math.hypot(nx, ny, nz), q = Math.abs(s) * w / w0, off = 1.0 + 1.1 * q * q * (0.4 + 0.6 * v);
        S.x = x + nx / nl * off; S.y = Math.min(-0.3, y + ny / nl * off); S.z = z + nz / nl * off; S.a = s * w; S.b2 = (be + 1.3) * Lm;
        setc(S, mix3(mix3(P.violet, P.beet, 0.2 + 0.6 * vnz(s * 2 + key, v * 7)), P.bloom, 0.22 * sst(0.1, 0.9, v) * (0.4 + 0.6 * q))); } }); }
    addBound(G, M, a * 0.97, a * 0.72, b * 0.97, [0, 0], -a * 0.74);
  };
  // CHARD LEAF on its stalk (stalk up when hung): dark, blistered, wine ribs
  Sp.chard = (G, M, L, W, key = 1, det = 1, o = {}) => leaf(G, { L, W, nu: Math.round(8 * det), nv: Math.round((o.rows || 17) * det), M, width: (t) => t < 0.22 ? 0.13 + 0.05 * t : (0.16 + 0.84 * Math.pow(Math.sin(Math.PI * Math.min(1, (t - 0.22) / 0.78 * 0.96 + 0.02)), 0.7)), curl: o.curl ?? 0.5, cup: o.cup ?? 0.25, frill: [W * (o.frill ?? 0.22), 2.2 + 0.8 * hsh(key, 1)], ph: key, twist: 0.2 * (hsh(key, 2) - 0.5), rib: W * 0.07, bound: o.bound, cast: o.cast ?? 0.8,
    col: (v, s, S) => { const st = sst(0.3, 0.2, v) + sst(0.14, 0.05, Math.abs(s)) * 0.0; setc(S, mix3(mix3(mix3(o.c || P.bottle, o.c1 || P.savoy, 0.3 + 0.5 * vnz(s * 2 + key, v * 6)), P.lettuce, 0.22 * sst(0.25, 0.9, Math.abs(s))), o.stalk || P.beet, Math.min(1, st))); }, mat: [0.6, 0.45, hsh(key, 3), 4], pat: [0, W * 0.3, 0.8, 0] });
  // KALE LEAF: upright, deeply frilled, bloomed blue-green
  Sp.kale = (G, M, L, W, key = 1, det = 1) => leaf(G, { L, W, nu: Math.round(8 * det), nv: Math.round(16 * det), M, width: leafShape(0.7, 0.6), curl: 0.5 + 0.5 * hsh(key, 1), cup: 0.2, frill: [W * 0.28, 2.5 + hsh(key, 2)], ph: key * 3, rib: W * 0.06, c: P.bottle, c1: mix3(P.bottle, P.savoy, 0.7), mat: [0.08, 0.3, hsh(key, 4), 0], pat: [0, W * 0.22, 0.6, 0.3] });
  return Sp;
}

// ---------------------------------------------------------------- the garden's flowers (for the world's cast)
// A SQUASH FLOWER: one deep gold trumpet, a ribbed tube flaring into five pointed lobes that curve back; a petal lit through
// in its own pigment (special 7). M: the flower's seat, +Y out of the throat; R its half width. One sheet: 2 * nu * nv triangles.
export function trumpet(G, P, M, R, key = 1, det = 1) {
  const nu = det > 0.8 ? 20 : 10, nv = det > 0.8 ? 6 : 4, deep = mix3(P.gold, P.tomato, 0.16), pale = mix3(P.gold, P.lemon, 0.35), green = mix3(P.lettuce, P.gold, 0.35), H = R * 1.15;
  surf(G.L || G, { nu, nv, wrap: true, M, pid: (G.bounds || (G.bounds = [])).length, mat: [0.3, 0.75, hsh(key, 1), 7], pat: [R * 0.55, R * 0.2, 0.25, 0], f: (u, v, S) => {
    const th = u * TAU + key, lobe = 0.5 + 0.5 * Math.cos(5 * (u * TAU)), fl = sst(0.25, 0.78, v), tip = sst(0.62, 1, v);
    const r = R * (0.16 + 0.5 * fl + (0.1 + 0.36 * lobe) * tip) * (1 + 0.05 * Math.sin(u * TAU * 2 + key)), y = H * (Math.pow(v, 0.75) * 0.8 - 0.42 * tip * tip * (0.35 + 0.65 * lobe)) + 0.06 * R * Math.cos(10 * u * TAU) * fl * (1 - tip);
    S.x = r * Math.cos(th); S.z = -r * Math.sin(th); S.y = y;
    S.a = (0.5 - Math.abs((u * 5) % 1 - 0.5)) * TAU / 5 * r; S.b2 = v * R * 1.5;                      // each lobe carries its own midrib down the tube
    const c = mix3(mix3(green, pale, sst(0.0, 0.3, v)), deep, sst(0.3, 0.75, v) * (0.75 + 0.25 * lobe) + 0.15 * (hsh(key, 3) - 0.5)); S.r = c[0]; S.g = c[1]; S.b = c[2]; } });
  lathe(G, { pid: G.bounds.length, L: R * 0.55, R: R * 0.1, nu: 5, nv: 2, M: T4(M, TR(0, R * 0.32, 0)), bound: false, prof: (t) => Math.sin(Math.PI * Math.min(1, t * 0.96 + 0.02)), c: mix3(P.gold, P.copper, 0.5), mat: [0.3, 0, 0, 0], pat: [0.5, 0, 0, 0] });
}
// A RUNNER BEAN'S FLOWER: a small scarlet pea flower at tomato red: the broad standard folded back, and the keel with its
// wings thrust forward under it. M: its seat, +Y up the standard, +Z the way it faces; s its height. 20 triangles.
export function peaFlower(G, P, M, s, key = 1) {
  const red = P.tomato, dk = mix3(P.tomato, P.beet, 0.3), m = [0.5, 0.7, hsh(key, 2), 7];
  leaf(G, { L: s, W: s * 0.62, nu: 2, nv: 3, M: T4(M, RX(-0.25)), width: (t) => 0.3 + 0.7 * Math.sin(Math.PI * Math.min(1, t * 0.8 + 0.12)), curl: -0.9, cup: -0.5, c: red, c1: red, pid: 0, mat: m, pat: [0, 0, 0, 0] });
  leaf(G, { L: s * 0.8, W: s * 0.34, nu: 2, nv: 2, M: T4(M, TR(0, s * 0.05, 0), RX(1.25 + 0.3 * hsh(key, 3))), width: (t) => 0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.1)), curl: -0.7, cup: 0.9, c: dk, c1: red, pid: 0, mat: m, pat: [0, 0, 0, 0] });
}

// ---------------------------------------------------------------- the head: frame, lofts, core
// World frame of the ruling, unchanged: +x east (the way the face looks), +y up from the river, +z south; the near side is -z.
// aim(): seat a piece at (x, y, z) with its +Y axis along (dx, dy, dz), rolled about that axis.
export function aim(x, y, z, dx, dy, dz, roll = 0, s = 1) {
  const d = new THREE.Vector3(dx, dy, dz).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), roll));
  return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(s, s, s));
}
// bustHeight(x, z): the shoulders are ground. A hill that falls to the river's level 215 either side; ruling 7 part 4: over
// y 120 it eases to a broad terrace near y 152 (it was a dome to 204, into which the head sank with no neck), so that the
// neck stands 60 m clear between the shoulders and the jaw. Under y 120 it is the hill of before, to the metre.
export function bustHeight(x, z) {
  const q = Math.pow(Math.pow(Math.abs(x + 45) / 125, 2.6) + Math.pow(Math.abs(z) / 215, 2.6), 1 / 2.6);
  const h = q >= 1 ? 0 : 204 * Math.pow(1 - q * q, 0.8);
  return h < 120 ? h : 120 + 36 * (1 - Math.exp(-(h - 120) / 36));
}
export const NECK = { x: -26, rx: 31, rz: 29, y0: 138, y1: 216 };   // the neck's column: its axis, the ring its stalks stand on, where it shows between collar and jaw
const EYE = { y: 350, z: 48, ry: 22, rz: 26, deep: 24 };             // the two hollows pressed into the lining for the eyes
const HEAD_LOFT = [[215, -72, 58, 56, 2.3], [290, -88, 74, 72, 2.3], [370, -96, 68, 74, 2.2], [440, -72, 42, 58, 2.0], [478, -20, 6, 12, 2.0]];
function loftAt(y) {            // eased between stations: [back, front, half width, n]
  const T = HEAD_LOFT; let i = 0; while (i < T.length - 2 && y > T[i + 1][0]) i++;
  const a = T[i], b = T[i + 1], k = sst(a[0], b[0], y) * 0.5 + 0.5 * Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0])));
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k, a[4] + (b[4] - a[4]) * k];
}
export const MOUTH = { x0: 25, x1: 125, y0: 240, y1: 274, halfW: 25, round: [56, 257, 0], roundR: 12 };

async function buildCore(G, E, P, tick, q = 1) {
  // the bust: garden soil with furrows, never a smooth form (EARTH), painted in beds (the world plants it: the shoulders are
  // ground). A polar sheet from the rim to under the neck.
  const rb = surf(E, { nu: Math.round(72 * q), nv: Math.round(26 * q), wrap: true, mat: [0.05, 0, 0.2, 0], pat: [0.3, 0, 0, 0], pid: 0, f: (u, v, S) => {
    const th = u * TAU, q = 1 - 0.93 * Math.pow(v, 0.8), c = Math.cos(th), s = Math.sin(th);
    const r = q / Math.pow(Math.pow(Math.abs(c), 2.6) + Math.pow(Math.abs(s), 2.6), 1 / 2.6);
    const x = -45 + 125 * r * c, z = -215 * r * s, lump = 5 * (vnz(x * 0.02 + 3, z * 0.02) - 0.5) + 2.5 * (vnz(x * 0.06, z * 0.06 + 9) - 0.5);
    S.x = x; S.z = z; S.y = bustHeight(x, z) * (1 + lump * 0.012) + lump * sst(0, 0.3, v) - 2 * (1 - sst(0, 0.04, v)) * 3;
    S.a = x * 0.34 + z * 0.94; S.b2 = x * 0.94 - z * 0.34; const k = vnz(x * 0.015 + 1, z * 0.015 + 5); const cc = mix3(mix3(P.soil, P.glaze, 0.45 + 0.4 * k), P.copper, 0.08 * vnz(x * 0.05, z * 0.04)); S.r = cc[0]; S.g = cc[1]; S.b = cc[2]; } });
  for (let k = rb[0]; k < rb[1]; k++) E.mat[k * 4 + 1] = 0.9 * sst(150, 138, E.pos[k * 3 + 1]) * sst(2, 10, E.pos[k * 3 + 1]);   // the shoulders are ground: beds are painted on them to the neck
  await tick();
  // the head's core, LINED WITH RIBBED LEAF (the ruling: "the recesses are lined with ribbed leaf"): any gap between pieces
  // shows a savoy leaf in its baked shade, never a bare post and never the ground behind. One upright leaf to every four
  // columns of the sheet: midrib on the first (pushed out), edges tucked in on the third, so the veins are true
  // between vertices. The mouth is a pocket pressed into it (no triangle stands in the hollow).
  const M = MOUTH, dark = mix3(P.glaze, P.umber, 0.72), NU = 4 * Math.round(17 * q);
  surf(G.L, { nu: NU, nv: Math.round(48 * q), wrap: true, mat: [0.3, 0, 0.5, 8], pat: [0, 9, 0.2, 0], pid: 0, f: (u, v, S) => {
    // (the first three rows are THE HEAD'S UNDERSIDE: from the neck's ring out to the jaw's rim, so the head ends in a floor of leaf over the neck and does not stand open)
    const fl = Math.min(1, v / 0.0625), vv = Math.max(0, (v - 0.0625) / 0.9375), y = 212 + 266 * (1 - Math.pow(1 - vv, 1.35)) + 5 * (1 - fl) * (1 - fl), th = u * TAU, Lf = loftAt(y), c = Math.cos(th), s = Math.sin(th), n = Lf[3], col4 = Math.round(u * NU) & 3, odd = col4 === 2;
    const r = 1 / Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), 1 / n), cx = (Lf[0] + Lf[1]) / 2, ax = (Lf[1] - Lf[0]) / 2;
    const lump = 1 + [0.03, 0, -0.04, 0][col4] + 0.02 * (vnz(th * 5, y * 0.05) - 0.5);
    let x = cx + ax * r * c * lump, z = -Lf[2] * r * s * lump; const k = v > 0.999 ? 0 : 1; x = cx + (x - cx) * k; z *= k;
    if (fl < 1) { const w = Math.sin(fl * Math.PI / 2); x = (NECK.x + (NECK.rx - 5) * c) * (1 - w) + x * w; z = -(NECK.rz - 5) * s * (1 - w) + z * w; }
    const inE = x > 20 ? sst(1, 0.5, Math.hypot((y - EYE.y) / EYE.ry, (Math.abs(z) - EYE.z) / EYE.rz)) : 0; x -= EYE.deep * inE;   // the eye's hollow
    if (x > 20) x += 31 * sst(24, 9, Math.abs(z)) * sst(286, 304, y) * sst(372, 352, y);   // a ridge of the lining behind the nose: no light comes through between the gourd's back and the cheeks
    const inM = sst(M.y0 - 9, M.y0 - 3, y) * sst(M.y1 + 12, M.y1 + 7, y) * sst(M.halfW + 9, M.halfW + 3, Math.abs(z));
    if (x > M.x0) x = x + (M.x0 - 3 - x) * inM;
    S.x = x; S.y = y; S.z = z; S.a = [0, 6, 12, 6][col4]; S.b2 = y + 14 * vnz(th * 3, 0.5);
    const li = Math.floor(u * NU / 4 + 0.375), ov = (((y + li * 37.3) / 84) % 1 + 1) % 1;             // each strip is leaf over leaf: a shaded foot under the lit rim of the one below
    const lf = mix3(mix3(mix3(P.savoy, P.lettuce, 0.08 + 0.3 * vnz(th * 4 + 2, y * 0.04) + 0.3 * sst(0.8, 0.98, ov)), P.bottle, odd ? 0.6 : col4 ? 0.25 : 0.1), mix3(P.bottle, P.glaze, 0.45), 0.75 * sst(0.2, 0.0, ov));
    const cc = mix3(mix3(lf, mix3(P.bottle, P.deep, 0.7), 0.95 * Math.max(sst(0, 0.3, inE), x > 20 ? sst(1.5, 1.05, Math.hypot((y - EYE.y) / EYE.ry, (Math.abs(z) - EYE.z) / EYE.rz)) * 0.8 : 0)), mix3(P.glaze, P.copper, 0.3), inM * 0.45); S.r = cc[0]; S.g = cc[1]; S.b = cc[2]; } });
  // neck core (hidden by the celery)
  lathe(G, { pid: 0, L: 112, R: 1, sx: NECK.rx - 6, sz: NECK.rz - 6, nu: 24, nv: 4, M: seat(NECK.x, 188, 0), prof: () => 1, c: dark, mat: [0, 0, 0, 0], pat: [0, 0, 0, 0], bound: false });
  G.bounds.push(...[[-14, 352, 0, 82, 122, 80], [NECK.x, 196, 0, NECK.rx + 2, 62, NECK.rz + 2], [-45, 22, 0, 118, 131, 205]].map(([x, y, z, a, b, c]) => ({ inv: new THREE.Matrix4().makeTranslation(x, y, z).scale(new THREE.Vector3(a, b, c)).invert().elements, a: 0, b: 0, cast: 1, core: 1 })));
}

// frame(): seat a piece at p with its +Y along yd and its +X as near xh as it can be (a lathe bends toward +X; a leaf's
// face is X x Y). leafFrame(): a leaf from p running along yd with its upper face toward `face`.
export function frame(p, yd, xh = [1, 0, 0], s = 1) {
  const Y = new THREE.Vector3(...yd).normalize(), X = new THREE.Vector3(...xh); X.addScaledVector(Y, -X.dot(Y));
  if (X.lengthSq() < 1e-6) X.set(Y.y, -Y.x, 0.001); X.normalize(); const Z = new THREE.Vector3().crossVectors(X, Y);
  return new THREE.Matrix4().makeBasis(X.multiplyScalar(s), Y.multiplyScalar(s), Z.multiplyScalar(s)).setPosition(p[0], p[1], p[2]);
}
export const leafFrame = (p, yd, face, s = 1) => { const Y = new THREE.Vector3(...yd), F = new THREE.Vector3(...face), X = new THREE.Vector3().crossVectors(Y, F); return frame(p, yd, [X.x, X.y, X.z], s); };

// THE FEATURES, by hand, constant on every seed (assembly A as ruled). Near side is -z (north); the far side is other individuals.
async function assembleHead(G, P, Sp, d, tick) {
  const dome = (az, el, k = 0.82) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [-15 + 100 * k * Math.cos(e) * Math.cos(a), 392 + 92 * k * Math.sin(e), -92 * k * Math.cos(e) * Math.sin(a)]; };
  // forehead, brow, eyes, nose
  Sp.onion(G, frame([44, 424, -2], [-0.3, 0.87, 0.38], [-1, 0, 0]), 100, 11, d); await tick();
  // (ruling 8 parts 1 and 2. BROW: one arched dark courgette either side, ribbed, its withered flower small at the outer end,
  // standing out 14 to 18 m beyond the hollow's rim so that its shade falls into the hollow by the bake; the two unlike.
  // EYES: BOTH OPEN, two hollows pressed 24 m into the lining and lined dark, nothing in them held lit by rule; in each ONE
  // dark glossy cherry, near black with wine red on its sunward side and one small highlight, seated in its opened pale
  // husk as in a cup whose level almond opening is the only light thing in the hollow; a dark runner bean (near) and a bay
  // leaf (far) bowed over as lids. A husked cherry, not a human eye: no white, no ring, nothing that turns or follows.
  // NOSE: ONE LARGE BOTTLE GOURD hung from between the brows, its stalk end UP and sunk at the bridge (about 81, 362), its
  // narrow neck (0.4 of the belly) slanting down and forward to the belly at two thirds of its length (radius 28.5 m) and a
  // BLUNT ROUND blossom end (146, 293) over the upper lip: front x 155 at y 310, 151 at y 300; never a point, never a hook.)
  Sp.courgette(G, frame([96, 377, -57], [0.26, 0, 0.97], [0.3, 1, 0]), 78, 7.5, 3, d, { bow: 0.14 });
  Sp.courgette(G, frame([94, 376, 56], [0.3, 0, -0.95], [0.22, 1, 0.1]), 71, 6.9, 8, d * 0.6, { bow: 0.2, sag: 0.06 }); await tick();
  Sp.husked(G, frame([56, 349, -43], [0.82, 0.06, -0.57], [0, 1, 0]), 26.5, 2, d * 1.1, { turn: 0.1 });
  Sp.pod(G, frame([81, 363, -53.6], [0.14, 0, 1], [0.55, 0.83, 0]), 42, 5.2, 20.5, d * 0.8, false, false, 0.85);   // the lid: a dark runner bean bowed over the cherry's upper front, clear under the brow
  Sp.husked(G, frame([57, 351, 42], [0.84, 0, 0.54], [0.12, 1, 0]), 24, 7, d * 0.8, { turn: -0.22, lids: [2.12, 2.2], lean: [0.6, -0.7], bloom: 0.2 });   // the far eye: a tenth smaller, its husk turned the other way, a sloe's film on it
  leaf(G, { L: 46, W: 7.5, nu: 6, nv: 14, M: leafFrame([75, 359.5, 75], [0.2, 0.1, -1], [0.5, 0.86, 0]), width: leafShape(0.6, 1.1), curl: -0.75, cup: 0.35, twist: 0.3, rib: 0.4, c: mix3(P.bottle, P.deep, 0.35), c1: P.bottle, bound: true, cast: 0.8, mat: [0.7, 0.1, 0.6, 0], pat: [0, 1.1, 0, 0] }); await tick();   // the far eye's lid is another thing: a dark bay leaf arched over its sloe
  Sp.gourd(G, frame([113.5, 327.5, -2], [-65, 69, 4], [69, 65.0, 0]), 95, 28.5, 4, d, { sx: 1.03, sz: 0.96, bow: -0.3, sun: 0.5 });   // it leans: its blossom end lies 4 m north of the axis
  await tick();
  // cheeks, jaw
  Sp.tomato(G, frame([54, 302, -64], [0.38, 0.42, -0.82], [1, 0, 0]), 80, 1, d, true); await tick();
  Sp.tomato(G, frame([52, 298, 64], [0.86, 0.34, 0.38], [0, 0, 1]), 80, 5, d * 0.6, true);   // the far cheek is another individual, turned to show its star and its cork scars where the near one shows its flank
  await tick();
  Sp.fennel(G, frame([38, 256, -60], [-0.47, 0.78, -0.39], [0.68, 0.6, 0.39]), 86, 38, 2, d);
  Sp.fennel(G, frame([36, 249, 62], [-0.25, 0.66, 0.7], [1, 0, 0.2]), 78, 34, 6, d * 0.55, 2);   // the far jaw: turned a quarter (its narrow side to the front), cut stubs outward, 6 m lower await tick();
  // lips (two beets above, one long one below, sheaves drawn forward at the corners), chin
  Sp.beet(G, frame([105, 291, -16], [0.5, 0.05, -0.86], [0, 1, 0]), 48, 17.5, 1, d, 6); await tick();   // (c12) a yield between the two lips: together they held the page 26 to 36 ms
  Sp.beet(G, frame([104, 289.5, 15], [-0.55, 0.3, -0.78], [0.2, 1, 0]), 38, 14.5, 2.3, d * 0.8, 5);   // the far upper lip: a smaller beet, its root thrust forward and outward where the near one's points in
  await tick();
  Sp.beet(G, frame([106, 224, 2], [0.3, 0.04, -0.95], [0, 1, 0.1]), 74, 17, 3.1, d, 7);
  Sp.lemon(G, frame([100, 192, -3], [0.93, -0.2, -0.3], [0, 1, 0]), 72, 24, 2, d); await tick();   // the chin stands out two thirds as far as the nose, a notch between it and the lip
  // beard: two hands of bean pods, bowed and splayed, no two parallel
  for (let i = 0; i < 13; i++) {
    const wax = i < 7, j = wax ? i - 3 : i - 9.5, L = (wax ? 68 : 80) + 20 * hsh(i, 3), za = j * (wax ? 0.2 : 0.23) + (wax ? 0 : 0.1), xa = (wax ? 0.2 : -0.06) + 0.22 * (hsh(i, 5) - 0.5) + (wax ? 0 : 0.07 * j);
    const dir = [Math.sin(xa), -Math.cos(xa) * Math.cos(za), Math.sin(za)], top = [(wax ? 88 : 70) + 5 * hsh(i, 7), 194 + 4 * hsh(i, 9), j * (wax ? 8.5 : 10)];
    Sp.pod(G, frame([top[0] + dir[0] * L * 0.5, top[1] + dir[1] * L * 0.5, top[2] + dir[2] * L * 0.5], [-dir[0], -dir[1], -dir[2]], [1, 0, 0.6 * (hsh(i, 11) - 0.5)]), L, wax ? 7.5 : 8.6, i + 1.5, d * (wax ? 0.85 : 0.7), wax);
    if (i % 4 === 3) await tick();
  }
  // ear: half a red cabbage, cut face to the north
  Sp.cutCabbage(G, frame([-5, 330, -99], [-0.12, 0.06, -1], [-1, 0, 0]), 62, 50, 1, d);
  Sp.cutCabbage(G, frame([-8, 328, 97], [-0.2, 0.1, 1], [1, 0, 0]), 58, 48, 2, d * 0.55); await tick();
  // crown: 17 whole heads; lettuces forward as the brim, savoys behind going into the dark, two red cabbages, one cauliflower
  const CROWN = [[-52, 38, 22, 'lettuce'], [52, 40, 22, 'lettuce'], [-28, 66, 19, 'lettuce'], [42, 68, 19, 'lettuce'], [-58, 8, 19, 'lettuce'],
    [-104, 30, 22.5, 'savoy'], [100, 34, 22.5, 'savoy'], [-148, 36, 22.5, 'savoy'], [142, 40, 22, 'savoy'], [182, 56, 22, 'savoy'], [178, 22, 22.5, 'savoy'], [108, 66, 21, 'savoy'], [-98, 2, 22, 'savoy'], [-80, 82, 20, 'savoy'],
    [-76, 40, 22, 'red'], [128, 26, 21, 'red'], [-124, 58, 22.5, 'cauli'], [-150, 8, 22.5, 'savoy']];
  for (let i = 0; i < CROWN.length; i++) {
    const [az, el, R, kind] = CROWN[i], p = dome(az, el), n = dome(az, el, 1.6), near = az < 0 || el > 60;
    const yd = [n[0] - p[0] + 30 * (hsh(i, 1) - 0.5), n[1] - p[1] + 10, n[2] - p[2] + 30 * (hsh(i, 2) - 0.5)];
    headOf(G, { R, kind, M: frame(p, yd, [hsh(i, 3) - 0.5, 0, hsh(i, 4) - 0.5]), key: i * 3.7 + 1, leaves: 9, det: d * (near ? 0.85 : 0.6), P }); await tick();
  }
}

// nape, neck, collar, bust, and the mouth's lining
async function assembleRest(G, P, Sp, d, tick) {
  const crimson = mix3(P.beet, P.tomato, 0.45), pale = mix3(P.lettuce, P.cream, 0.3);
  // nape: a plume of chard, stalks up
  for (let i = 0; i < 30; i++) { const tier = i % 3, az = (96 + Math.floor(i / 3) * 16.5 + tier * 6) * Math.PI / 180, c = Math.cos(az), sn = -Math.sin(az), rr = [84, 76, 70][tier], top = [-15 + rr * c, [404, 366, 326][tier] - 6 * hsh(i, 2), 0.84 * rr * sn];
    const out = [0.3, 0.2, -0.12][tier];                                // (ruling 7: the lowest tier turns IN under the head, so the back of the head is a round cap over the neck and does not run down into the shoulders)
    Sp.chard(G, leafFrame(top, [c * out + 0.15 * (hsh(i, 3) - 0.5), -0.95, sn * out], [c, -0.15, sn]), [92, 96, 76][tier] + [20, 20, 14][tier] * hsh(i, 4), 24 + 8 * hsh(i, 5), i + 1, d * (sn < 0.2 ? 0.9 : 0.6), { curl: tier === 2 ? -0.55 - 0.3 * hsh(i, 6) : [0.3, 0.18][tier] + 0.3 * hsh(i, 6), cup: 0.45 + 0.2 * hsh(i, 7), frill: 0.11, rows: 18, cast: 0.3, bound: true }); if (i % 10 === 9) await tick(); }
  await tick();
  for (let i = 0; i < 8; i++) { const sg = i < 4 ? 1 : -1, az = sg * (62 + (i % 4) * 9.5) * Math.PI / 180, c = Math.cos(az), sn = -Math.sin(az), top = [-15 + 80 * c, 398 - 5 * hsh(i, 12), 0.82 * 80 * sn];
    Sp.chard(G, leafFrame(top, [c * 0.3, -0.95, sn * 0.3], [c, -0.1, sn]), 52 + 14 * hsh(i, 14), 17 + 5 * hsh(i, 15), i + 60, d * (sg > 0 ? 0.8 : 0.55), { curl: 0.3 + 0.3 * hsh(i, 16), cup: 0.4, frill: 0.11, cast: 0.3, bound: true }); }
  // neck: one head of celery (a ring of ribbed stalks); its leaves line the recess under the jaw
  // (seen from beneath and from the north the stalks are six to nine ribbed crescents of unlike width, leaning, their heads
  // at unlike heights under the jaw and their feet on the terrace where it falls away: no level edge and no band)
  // (ruling 7: A NARROW COLUMN: ten upright stalks on a ring 31 by 29 m, 78 m from front to back where the head is 200 and
  // more, standing clear from the terrace at 150 to the jaw at 213, the painted sky before and behind it)
  for (let i = 0; i < 10; i++) { const a = (i + 0.35 * (hsh(i, 21) - 0.5)) / 10 * TAU + 0.2, c = Math.cos(a), s = Math.sin(a), cf = Math.max(0, c), rr = 1 + 0.1 * (hsh(i, 22) - 0.5), R = 10.5 + 3.5 * hsh(i, 23);
    const x = NECK.x + NECK.rx * rr * c, z = -NECK.rz * rr * s, top = 262 - 30 * cf + 14 * (hsh(i, 1) - 0.5), foot = bustHeight(x, z) - 5 - 7 * hsh(i, 3), L = top - foot;
    const ln = [0.05 * c + 0.07 * (hsh(i, 2) - 0.5), 1, -0.05 * s + 0.07 * (hsh(i, 24) - 0.5)];
    Sp.celery(G, frame([x + ln[0] * L * 0.1, (top + foot) / 2, z + ln[2] * L * 0.1], ln, [-s, 0, -c]), L, R, i + 1, d * (s > -0.2 ? 1 : 0.7)); }
  for (let i = 0; i < 6; i++) { const z = (i - 2.5) * 13 + 5 * (hsh(i, 31) - 0.5);      // its leaves under the jaw: unlike in length, fall and turn, so their ends make no line
    Sp.chard(G, leafFrame([27 - Math.abs(z) * 0.3, 235 + 8 * (hsh(i, 32) - 0.5), z], [0.6 + 0.3 * (hsh(i, 33) - 0.5), -0.8, z * 0.012 + 0.3 * (hsh(i, 34) - 0.5)], [0.75, 0.55, 0]), 32 + 30 * hsh(i, 8), 11 + 5 * hsh(i, 35), i + 20, d * 0.7, { c: P.savoy, c1: P.lettuce, stalk: pale, curl: -0.25 - 0.6 * hsh(i, 36), cup: 0.3 + 0.2 * hsh(i, 37) }); }
  await tick();
  // collar: a planted bed of kale on the north-west and west of the terrace only
  for (let i = 0; i < 11; i++) { const a = (98 + i * 8.6 + 4 * hsh(i, 1)) * Math.PI / 180, rr = 108 + 26 * hsh(i, 2) * (i % 2 ? 1 : 0.3), x = -20 + rr * Math.cos(a), z = -rr * Math.sin(a) * 1.25, y = bustHeight(x, z) - 2;
    for (let k = 0; k < 5; k++) { const b = k * TAU / 5 + i, lean = 0.8 + 0.5 * hsh(i, k); Sp.kale(G, leafFrame([x + 2 * Math.cos(b), y, z + 2 * Math.sin(b)], [Math.cos(b) * lean, 1, Math.sin(b) * lean], [-Math.cos(b), 0.3, -Math.sin(b)]), 36 + 14 * hsh(k, i), 12 + 4 * hsh(i, k + 3), i * 5 + k + 1, d * 0.85); } }
  await tick();
  // bust: ONE rhubarb plant fanned from the neck's foot, crimson stalks showing, leaves lying down over the shoulders
  [25, 62, 98, -30, -68, -105, -142, 0].forEach((deg, i) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), x = NECK.x + (NECK.rx + 9) * c, z = -(NECK.rz + 9) * s, L = i === 7 ? 70 : 118 + 30 * hsh(i, 1);
    const x2 = x + c * L * 0.6, z2 = z - s * L * 0.6, slope = (bustHeight(x2, z2) - bustHeight(x, z)) / (L * 0.6);
    Sp.chard(G, leafFrame([x, bustHeight(x, z) + 6, z], [c, slope * 0.5 + 0.22, -s], [0, 1, 0]), L, (i === 7 ? 30 : 50) + 10 * hsh(i, 2), i + 40, d, { c: P.bottle, c1: P.savoy, stalk: crimson, curl: -0.75 - 0.3 * hsh(i, 3), cup: 0.12, bound: true });
    lathe(G, { pid: 0, L: L * 0.3, R: 4.5, nu: 8, nv: 4, M: frame([x + c * L * 0.14, bustHeight(x, z) + 8 + L * 0.03, z - s * L * 0.14], [c, 0.2, -s]), bound: false, sz: 0.7, prof: (t) => (t > 0.99 || t < 0.01 ? 0 : 1), sect: (th) => 1 + 0.1 * Math.cos(th * 7), mat: [0.7, 0, 0.1 * i, 0], pat: [0, 1.4, 0, 0], col: (t, th, S) => { const cc = mix3(crimson, P.beet, 0.5 * hsh(i, 9)); S.r = cc[0]; S.g = cc[1]; S.b = cc[2]; } }); });
  await tick();
  // the mouth: a vault of savoy undersides (half arches from either wall, ribs branching), a floor of leaves laid crosswise.
  // THE LINING COMES FORWARD TO THE LIPS (ruling 8 part 3): two more pairs of half arches under the upper lip's beets, shorter
  // and less turned (their tips stay 14 m from the axis), and three leaves laid askew over the lower beet's inner face, unlike
  // in length and turn (none lengthwise, none in the middle alone: no tongue; nothing pale in a row: no teeth)
  const under = mix3(P.savoy, P.lettuce, 0.45), M = MOUTH;
  for (let k = -2; k < 8; k++) for (const sgn of [-1, 1]) { const x = 86 - k * 8.7 + (sgn > 0 ? 4.3 : 0), key = k * 2 + (sgn > 0 ? 1 : 0) + 40 * (k < 0), fw = k < 0 ? 1 : 0, cu = fw ? mix3(under, P.bottle, 0.3 + 0.2 * hsh(key, 4)) : under;
    leaf(G, { L: fw ? 35 - 4 * hsh(key, 5) : 62, W: fw ? 9 : 10.5, nu: Math.round(6 * d), nv: Math.round((fw ? 12 : 16) * d), M: leafFrame([x, 243, sgn * 27.5], [(fw ? 0.22 : 0.04) * (hsh(key, 1) - 0.5), 1, -sgn * 0.06], [0, 0, -sgn]), width: (t) => 0.75 + 0.25 * Math.sin(Math.PI * t) - 0.3 * t * t, curl: fw ? 1.08 + 0.1 * hsh(key, 2) : 1.62 + 0.1 * hsh(key, 2), cup: -0.25, frill: [1.6, 3], ph: key, rib: 1.2, c: cu, c1: mix3(cu, P.bottle, 0.5), pid: 0, mat: [0.2, 0.2, hsh(key, 3), 5], pat: [0, 3.2, 0.7, 0] }); }
  [[96.5, 1, 40, 0.3], [101, -1, 31, -0.24], [98.5, 1, 24, 0.5]].forEach(([x, sgn, L, turn], j) => { const dx = 106 - x, y = 224 + Math.sqrt(289 - dx * dx) + 0.6;
    leaf(G, { L, W: 9.5 - 1.5 * j, nu: Math.round(6 * d), nv: Math.round(10 * d), M: leafFrame([x - turn * L * 0.4, y, -sgn * L * (0.5 - 0.12 * j)], [turn, 0.08, sgn], [0, 1, 0]), width: (t) => 0.62 + 0.38 * Math.sin(Math.PI * t), curl: -0.3 - 0.1 * j, cup: 0.14, twist: 0.25 * turn, frill: [0.8, 2.5], ph: j + 20, c: mix3(P.savoy, P.bottle, 0.25 + 0.2 * j), c1: P.savoy, pid: 0, mat: [0.5, 0.2, hsh(j, 16), 0], pat: [0, 3.2, 0.6, 0] }); });
  for (let k = 0; k < 7; k++) { const x = 90 - k * 10.5, sgn = k % 2 ? 1 : -1;
    leaf(G, { L: 58, W: 10.5, nu: Math.round(6 * d), nv: Math.round(12 * d), M: leafFrame([x, 236.6 + 0.4 * (k % 3), -sgn * 29], [0.08 * (hsh(k, 5) - 0.5), 0.02, sgn], [0, 1, 0]), width: (t) => 0.7 + 0.3 * Math.sin(Math.PI * t), curl: 0.1, cup: 0.1, frill: [0.8, 2.5], ph: k, c: mix3(P.savoy, P.bottle, 0.3), c1: P.savoy, pid: 0, mat: [0.55, 0.2, hsh(k, 6), 0], pat: [0, 3.5, 0.6, 0] }); }
}

// THE SHADE BAKE: cast shade (toward the sun against every other piece's ellipsoid, at full depth, its edge a sixth of a radius wide), crease (how near the
// vertex lies to a neighbour) and bounce (the round's warmth inside the mouth). Runs of slice vertices, a yield between.
export async function bakeShade(geos, bounds, sun, tick, slice = 600, part = slice) {   // slice: vertices per run; part (c12): a yield after each part of a run, a multiple of 32 so that the blocks of 32 stay where they were and the answer is the same
  const nb = bounds.length, E = new Float64Array(nb * 16), cst = new Float64Array(nb), cor = new Uint8Array(nb), M = MOUTH;
  for (let b = 0; b < nb; b++) { const e = bounds[b].inv, o = b * 16; for (let k = 0; k < 15; k++) E[o + k] = e[k];
    const sx = e[0] * sun.x + e[4] * sun.y + e[8] * sun.z, sy = e[1] * sun.x + e[5] * sun.y + e[9] * sun.z, sz = e[2] * sun.x + e[6] * sun.y + e[10] * sun.z;
    E[o + 3] = sx; E[o + 7] = sy; E[o + 11] = sz; E[o + 15] = 1 / (sx * sx + sy * sy + sz * sz); cst[b] = bounds[b].cast ?? 1; cor[b] = bounds[b].core ? 1 : 0; }
  // (c13, F4) THE PIECES BY PLACE. Every sunward ray runs the same way, so seen along the sun each piece's reach is a patch on a flat sheet and each vertex a point on it. A piece
  // can crease a vertex only within 1.31 of its radii and shade it only where the vertex's ray passes within 1.07 of them, so its patch is the outline of 1.35 radii (its box on
  // the sheet, a little over). A coarse grid over the sheet lists for each cell the pieces whose patch touches it, and a vertex asks its own cell's pieces only (c12 asked every
  // piece near its block of 32 vertices, a ring round a body: most of them). The answers are minima over the pieces that pass the vertex's own tests, so the pieces left out
  // could not have won and every baked byte stays: sums of every array, before and after, on seeds 3, 7, 21 in shots/harvest-in-profile/fix14/f4-sums-*.txt.
  const sn = [sun.x, sun.y, sun.z], an = [0, 0, 0]; an[Math.abs(sn[0]) < Math.abs(sn[1]) ? (Math.abs(sn[0]) < Math.abs(sn[2]) ? 0 : 2) : (Math.abs(sn[1]) < Math.abs(sn[2]) ? 1 : 2)] = 1;
  const crs = (p, q) => { const x = p[1] * q[2] - p[2] * q[1], y = p[2] * q[0] - p[0] * q[2], z = p[0] * q[1] - p[1] * q[0], l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
  const U = crs(sn, an), V = crs(sn, U), U0 = U[0], U1 = U[1], U2 = U[2], V0 = V[0], V1 = V[1], V2 = V[2];   // two ways across the sun's own way: the sheet
  const rect = new Float64Array(nb * 4), whole = []; let u0 = 1e30, u1 = -1e30, v0 = 1e30, v1 = -1e30;
  for (let b = 0; b < nb; b++) { const o = b * 16, a = E[o], bb = E[o + 4], c = E[o + 8], d = E[o + 1], e = E[o + 5], f = E[o + 9], g = E[o + 2], h = E[o + 6], i = E[o + 10];
    const A = e * i - f * h, B = f * g - d * i, C = d * h - e * g, id = 1 / (a * A + bb * B + c * C), tx = E[o + 12], ty = E[o + 13], tz = E[o + 14];   // the piece's own space turned back into the world's
    const m00 = A * id, m01 = (c * h - bb * i) * id, m02 = (bb * f - c * e) * id, m10 = B * id, m11 = (a * i - c * g) * id, m12 = (c * d - a * f) * id, m20 = C * id, m21 = (bb * g - a * h) * id, m22 = (a * e - bb * d) * id;
    const cx = -(m00 * tx + m01 * ty + m02 * tz), cy = -(m10 * tx + m11 * ty + m12 * tz), cz = -(m20 * tx + m21 * ty + m22 * tz);
    const hu = 1.35 * Math.hypot(m00 * U0 + m10 * U1 + m20 * U2, m01 * U0 + m11 * U1 + m21 * U2, m02 * U0 + m12 * U1 + m22 * U2) * 1.001 + 0.01, hv = 1.35 * Math.hypot(m00 * V0 + m10 * V1 + m20 * V2, m01 * V0 + m11 * V1 + m21 * V2, m02 * V0 + m12 * V1 + m22 * V2) * 1.001 + 0.01;
    const cu = cx * U0 + cy * U1 + cz * U2, cv = cx * V0 + cy * V1 + cz * V2;
    if (!(Math.abs(hu) + Math.abs(hv) + Math.abs(cu) + Math.abs(cv) < 1e12)) { whole.push(b); rect[b * 4] = 1; rect[b * 4 + 1] = 0; continue; }   // a piece with no true size: every vertex asks it, as before
    rect[b * 4] = cu - hu; rect[b * 4 + 1] = cu + hu; rect[b * 4 + 2] = cv - hv; rect[b * 4 + 3] = cv + hv;
    if (cu - hu < u0) u0 = cu - hu; if (cu + hu > u1) u1 = cu + hu; if (cv - hv < v0) v0 = cv - hv; if (cv + hv > v1) v1 = cv + hv; }
  if (!(u1 > u0 && v1 > v0)) { u0 = v0 = 0; u1 = v1 = 1; }
  const GN = Math.max(4, Math.min(64, Math.ceil(2 * Math.sqrt(nb)))), iu = GN / (u1 - u0), iv = GN / (v1 - v0), start = new Int32Array(GN * GN + 1), nwh = whole.length;
  const cellOf = (x, i) => Math.max(0, Math.min(GN - 1, Math.floor(x * i)));   // the same reckoning for a patch's edges and for a vertex: a vertex inside a patch falls in a cell the patch is listed in
  for (let b = 0; b < nb; b++) { if (rect[b * 4] > rect[b * 4 + 1]) continue; const i0 = cellOf(rect[b * 4] - u0, iu), i1 = cellOf(rect[b * 4 + 1] - u0, iu), k0 = cellOf(rect[b * 4 + 2] - v0, iv), k1 = cellOf(rect[b * 4 + 3] - v0, iv);
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) start[k * GN + i + 1]++; }
  for (let c = 0; c < GN * GN; c++) start[c + 1] += start[c];
  const list = new Int32Array(start[GN * GN]), fill = start.slice(0, GN * GN);
  for (let b = 0; b < nb; b++) { if (rect[b * 4] > rect[b * 4 + 1]) continue; const i0 = cellOf(rect[b * 4] - u0, iu), i1 = cellOf(rect[b * 4 + 1] - u0, iu), k0 = cellOf(rect[b * 4 + 2] - v0, iv), k1 = cellOf(rect[b * 4 + 3] - v0, iv);
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) list[fill[k * GN + i]++] = b; }
  // one run of vertices, with no waiting inside it
  const run = (G, j0, j1) => { const pos = G.pos, nor = G.nor, pid = G.pid, shade = G.shade, leafy = geos.some((g) => g.L === G);
    for (let i0 = j0; i0 < j1; i0 += 32) {
      const i1 = Math.min(j1, i0 + 32);
      for (let i = i0; i < i1; i++) {
        const px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2], own = pid[i] - 1; let cast = 1, crease = 1;
        if (i > i0 && px === pos[i * 3 - 3] && py === pos[i * 3 - 2] && pz === pos[i * 3 - 1] && pid[i] === pid[i - 1]) { shade[i * 3] = shade[i * 3 - 3]; shade[i * 3 + 1] = shade[i * 3 - 2]; shade[i * 3 + 2] = shade[i * 3 - 1]; continue; }   // a sheet's pole: the same point again
        const pu = px * U0 + py * U1 + pz * U2, pv = px * V0 + py * V1 + pz * V2; let s0 = 0, s1 = 0;
        if (pu >= u0 && pu <= u1 && pv >= v0 && pv <= v1) { const cc = cellOf(pv - v0, iv) * GN + cellOf(pu - u0, iu); s0 = start[cc]; s1 = start[cc + 1]; }
        for (let k = s0; k < s1 + nwh; k++) { const b = k < s1 ? list[k] : whole[k - s1]; if (b === own) continue; const o = b * 16;
          const qx = E[o] * px + E[o + 4] * py + E[o + 8] * pz + E[o + 12], qy = E[o + 1] * px + E[o + 5] * py + E[o + 9] * pz + E[o + 13], qz = E[o + 2] * px + E[o + 6] * py + E[o + 10] * pz + E[o + 14];
          const q2 = qx * qx + qy * qy + qz * qz; if (q2 > 60) continue;
          const sx = E[o + 3], sy = E[o + 7], sz = E[o + 11], t = -(qx * sx + qy * sy + qz * sz) * E[o + 15];
          let c2 = q2; if (t > 0) { const ax = qx + t * sx, ay = qy + t * sy, az = qz + t * sz; c2 = ax * ax + ay * ay + az * az; }
          if (c2 < 1.13) { const s = 1 - cst[b] * (1 - sst(0.9, 1.06, Math.sqrt(c2))); if (s < cast) cast = s; }
          if (q2 < 1.7 && cor[b] === 0) { const c = sst(0.95, 1.24, Math.sqrt(q2)); if (c < crease) crease = c; }
        }
        if (px > 14 && px < 140 && py > 208 && py < 432 && pz > 3) cast = Math.min(cast, 1 - 0.5 * sst(3, 24, pz) * sst(14, 40, px) * sst(432, 405, py) * sst(208, 222, py));   // BY PLACE: the nose and the brow throw their shade on the face's south half, so that from the front it turns from light into the ground
        let bounce = 0;
        // THE ROUND'S OWN GOLD LIGHT (ruling 8 part 3), by distance from its seat alone: full within 12 m of it, nine tenths at 20 m,
        // over a half at the lips' inner faces (52 m), a third at 80 m, a quarter at 105 m and from there eased to none at 150 m (c12: the comment said none beyond 80 m); a skin takes it only where it faces the round (a lip's outer
        // face none), a leaf on either face. The hollow's edge in height and width is a soft one, and nothing ends at a line in x.
        { const dx = px - M.round[0], dy = py - M.round[1], dist = Math.sqrt(dx * dx + dy * dy + pz * pz) + 1e-6;
          if (dist < 150) { const face = -(nor[i * 3] * dx + nor[i * 3 + 1] * dy + nor[i * 3 + 2] * pz) / dist, thr = 0.10 + (1 - 0.10) * sst(-0.3, 0.3, dx / dist);
            bounce = 0.5 * thr * Math.exp(-Math.max(0, dist - 12) / 69) * sst(150, 105, dist) * (leafy ? 0.3 + 0.7 * Math.abs(face) : sst(-0.25, 0.6, face));
            if (px > M.x0 - 6 && px < 138 && py > M.y0 - 12 && py < M.y1 + 19 && Math.abs(pz) < M.halfW + 11) { const w = sst(M.y0 - 11, M.y0 - 6, py) * sst(M.y1 + 18, M.y1 + 10, py) * sst(M.halfW + 10, M.halfW + 4, Math.abs(pz));
              bounce = Math.max(bounce, thr * w * Math.exp(-Math.max(0, dist - 12) / 28) * sst(80, 62, dist) * (leafy ? 0.62 + 0.38 * Math.abs(face) : sst(-0.1, 0.5, face)));
              crease = Math.max(crease, 0.7 * w * sst(106, 92, px)); cast *= 1 - w * sst(100, 84, px); } } }
        shade[i * 3] = cast; shade[i * 3 + 1] = crease; shade[i * 3 + 2] = bounce;
      }
    } };
  for (const G of geos) for (let j0 = 0; j0 < G.n; j0 += slice) { const j1 = Math.min(G.n, j0 + slice); for (let a = j0; a < j1; a += part) { run(G, a, Math.min(j1, a + part)); await tick(); } }
  // A LEAF IS SHADED SMOOTHLY: cast shade and crease, known only at its vertices, are eased over each leaf's own mesh, so
  // that a neighbour's shade falls across a blade as a soft glaze and never as a stepped dark edge along the mesh's diagonals
  for (const G of geos) { const Lf = G.L; if (!Lf || !geos.includes(Lf) || !Lf.n) continue; easeShade(Lf); await tick(); }
  // (c12, F2) A COARSE SKIN ASKS FOR THE SAME: where a body's mesh is coarser than its neighbour's penumbra (a penumbra 6 m broad on
  // quads 6 m by 4 m: the far jaw's bulb), the shade's edge ran along the mesh's diagonals as a saw (seen from 3,200 m on). Such a
  // body names its own run of vertices (lathe's o.soft: the passes) and its shade is eased over that run alone; no other skin changes.
  for (const G of geos) if (G.soft) { for (const [v0, v1, n, q0, q1] of G.soft) for (let k = 0; k < n; k++) easeShade(G, v0, v1, q0, q1); await tick(); }
}
function easeShade(Lf, v0 = 0, v1 = Lf.n, q0 = 0, q1 = Lf.ni) {   // every vertex (of the run v0..v1, whose triangles are the run q0..q1 of the index) takes 0.8 of the mean of its neighbours along the mesh's edges
  const sh = Lf.shade, I = Lf.idx, nn = v1 - v0, acc = new Float32Array(nn * 2), cnt = new Uint16Array(nn);
  for (let q = q0; q < q1; q += 3) { const a = I[q], b = I[q + 1], c = I[q + 2]; if (a === b || b === c || a === c || a < v0 || a >= v1 || b < v0 || b >= v1 || c < v0 || c >= v1) continue;
    const a0 = sh[a * 3], a1 = sh[a * 3 + 1], b0 = sh[b * 3], b1 = sh[b * 3 + 1], c0 = sh[c * 3], c1 = sh[c * 3 + 1], ia = a - v0, ib = b - v0, ic = c - v0;
    acc[ia * 2] += b0 + c0; acc[ia * 2 + 1] += b1 + c1; acc[ib * 2] += a0 + c0; acc[ib * 2 + 1] += a1 + c1; acc[ic * 2] += a0 + b0; acc[ic * 2 + 1] += a1 + b1; cnt[ia] += 2; cnt[ib] += 2; cnt[ic] += 2; }
  for (let i = 0; i < nn; i++) if (cnt[i]) { const k = (i + v0) * 3; sh[k] = 0.2 * sh[k] + 0.8 * acc[i * 2] / cnt[i]; sh[k + 1] = 0.2 * sh[k + 1] + 0.8 * acc[i * 2 + 1] / cnt[i]; }
}

// ---------------------------------------------------------------- buildHero
export async function buildHero(ctx, opts = {}) {
  const tick = ctx && ctx.yield ? () => ctx.yield() : async () => {};
  const d = Math.min(1, Math.max(0.6, opts.detail ?? 1)), pal = opts.palette || PALETTE;
  const hexes = { ...PIGMENTS }; ['tomato', 'beet', 'gold', 'savoy', 'lettuce', 'cream', 'umber'].forEach((k, i) => { if (pal[i]) hexes[k] = pal[i]; });
  const P = {}; for (const k in hexes) P[k] = lin(hexes[k]);
  STYLE.uCream.value.set(hexes.cream); STYLE.uWine.value.set(hexes.beet);
  const Sp = makeSpecimens(P);
  if (!STYLE.uTex.value) STYLE.uTex.value = await makeGlazeTextureAsync(tick);
  glazeUsers++; await tick();
  const G = new Geo(Math.round(46000 * d + 6000)); G.L = new Geo(Math.round(42000 * d + 8000)); G.bounds = [];
  const E = new Geo(2400); E.bounds = G.bounds;
  await buildCore(G, E, P, tick); await tick();
  await assembleHead(G, P, Sp, d, tick);
  await assembleRest(G, P, Sp, d, tick);
  await bakeShade([G, G.L, E], G.bounds, SUN_DIR, tick, 600, 160);   // (c12) the head's runs in parts of 160: one run of 600 held the page 29 to 41 ms
  const object = new THREE.Group(); object.name = 'harvest-head';
  const mats = { skin: glazeMaterial('SKIN'), leaf: glazeMaterial('LEAF'), earth: glazeMaterial('EARTH') };
  const meshes = {};
  for (const [name, geo, mat] of [['skin', G, mats.skin], ['leaf', G.L, mats.leaf], ['earth', E, mats.earth]]) {
    const g = geo.toGeometry(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-20, 250, 0), 340); g.boundingBox = new THREE.Box3(new THREE.Vector3(-260, -10, -230), new THREE.Vector3(160, 510, 230));
    await tick(); const m = new THREE.Mesh(g, mat); m.name = 'head-' + name; m.frustumCulled = false; object.add(m); meshes[name] = m; await tick();
  }
  const rng = ctx && ctx.rng ? ctx.rng : makeRng('harvest-head');
  const moths = makeBrimstones(P, rng, opts.brimstones ?? 8); object.add(moths); await tick();
  // THE MIRROR (opts.mirror): the whole head again at about a tenth of the triangles, turned over about the river's level
  // (y 0), dimmed to 55 percent and rippled sideways by place and clock. The world lays its river sheet over it; the banks hide the rest.
  let mirror = null;
  if (opts.mirror) {
    const Gm = new Geo(22000); Gm.L = new Geo(22000); Gm.bounds = []; const Em = new Geo(700); Em.bounds = Gm.bounds;
    await buildCore(Gm, Em, P, tick, 0.5); await assembleHead(Gm, P, Sp, 0.3, tick); await assembleRest(Gm, P, Sp, 0.3, tick);
    await bakeShade([Gm, Gm.L, Em], Gm.bounds, SUN_DIR, tick);
    mirror = new THREE.Group(); mirror.name = 'harvest-head-mirror'; mirror.scale.y = -(opts.mirrorSquash ?? 1);
    const o = { dim: opts.mirrorStrength ?? 0.55, ripple: opts.mirrorRipple ?? 1.4, gloss: 0.2, cut: -1e6, sun: new THREE.Vector3(SUN_DIR.x, -SUN_DIR.y, SUN_DIR.z) };
    for (const [name, geo, form] of [['skin', Gm, 'SKIN'], ['leaf', Gm.L, 'LEAF'], ['earth', Em, 'EARTH']]) {
      const g = geo.toGeometry(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(-20, 250, 0), 340);
      const m = new THREE.Mesh(g, glazeMaterial(form, o)); m.name = 'mirror-' + name; m.frustumCulled = false; mirror.add(m); await tick();
    }
    object.add(mirror);
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V(56, 257, 0), normal: V(1, 0, 0), radius: 12 },           // the round, facing east, 48 inside the lips
    mouth: { ...MOUTH, lips: V(104, 257, 0) },
    features: { crown: V(-15, 500, 0), forehead: V(46, 414, -6), brow: V(98, 381, -57), eye: V(78, 350, -58), eyeFar: V(78, 351, 55), noseRoot: V(88, 364, -1), noseTip: V(146, 293, -4),
      cheek: V(54, 302, -64), cheekFar: V(53, 300, 63), ear: V(-5, 330, -99), jaw: V(38, 256, -60), lips: V(104, 257, 0), chin: V(100, 192, -3), beard: V(88, 150, 0), nape: V(-105, 340, 0), neck: V(NECK.x, 185, 0) },
    // the brief's line where it nears the head (legs d to i), all with 20 m or more of clear air on the true triangles
    flyThrough: [V(173, 30, -519), V(279, 125, -262), V(239, 84, -30), V(98, 190, -240), V(-110, 358, -252), V(40, 373, -161), V(97, 361, -129), V(300, 326, -117), V(402, 270, -15), V(218, 257, 0), V(125, 257, 0), V(56, 257, 0)],
    viewpoints: { reveal34: { eye: V(173, 30, -519), at: V(36, 160, 0) }, vine43: { eye: V(277, 105, -323), at: V(30, 300, 0) }, beard52: { eye: V(184, 175, -129), at: V(104, 232, -2) },
      ear61: { eye: V(12, 242, -278), at: V(15, 292, -85) }, eye70: { eye: V(68, 332, -211), at: V(86, 331, -35) }, front87: { eye: V(402, 270, -15), at: V(100, 296, 0) }, mouth94: { eye: V(218, 257, 0), at: V(56, 257, 0) } },
    sunDir: SUN_DIR.clone(), bustHeight,
  };
  return {
    object, radius: 260, height: 500, center: V(0, 300, 0), anchors, mats, meshes, mirror, bounds: G.bounds, specimens: Sp, pigments: P,
    triangles: (G.ni + G.L.ni + E.ni) / 3,
    update(dt, time, camera) { STYLE.uTime.value = time; moths.userData.fly(time); },
    dispose() { if (--glazeUsers <= 0 && STYLE.uTex.value) { glazeUsers = 0; STYLE.uTex.value.dispose(); STYLE.uTex.value = null; } },
    ground: true, groundY: 0,
  };
}

// BRIMSTONES before the face (span 5): own meshes in the LEAF glaze, wings beaten in the vertex shader (uFlap), each on a
// closed course by place and the world's clock, in mid-motion at any clock; none comes within 25 m of the flown line.
// Local frame of the insect: +Z forward, wings out along X, +Y up.
function makeBrimstones(P, rng, n) {
  const G = new Geo(400); G.bounds = []; const wing = mix3(P.lemon, P.lettuce, 0.08);
  // (c12, F4) four wings each of its own drawn shape (SHAPES.wingF, wingH: the glaze cuts the outline and draws the veins, the margin and the spot), two-sided (the LEAF form); a fan of 8 steps each: 64 triangles the four (c11: 192). The leading edge is the piece's +x on both sides (the right wing is turned over, not mirrored).
  for (const sg of [-1, 1]) for (const hind of [0, 1]) { const a = hind ? 2.4 : 1.22;
    leaf(G, { shape: hind ? 'wingH' : 'wingF', L: hind ? 2.1 : 2.7, W: hind ? 2.1 : 2.7, nu: 8, nv: 1, dome: 0, M: sg > 0 ? T4(RY(a - Math.PI), RX(-Math.PI / 2)) : T4(RY(-a), RX(Math.PI / 2)), pid: 0, c: mix3(wing, P.lettuce, 0.3), c1: wing, mat: [0.12, 0.8, 0.3], pat: [0, 0, 0, 0] }); }
  lathe(G, { pid: 0, L: 2.6, R: 0.22, nu: 6, nv: 6, M: RX(Math.PI / 2), bound: false, prof: (t) => Math.sin(Math.PI * Math.min(1, t * 0.98 + 0.01)) * (t > 0.6 ? 1.2 : 0.8), c: mix3(P.glaze, P.lemon, 0.3), mat: [0.3, 0, 0, 0], pat: [0, 0, 0, 0] });
  for (let i = 0; i < G.n; i++) G.shade[i * 3 + 2] = 0;
  const mesh = new THREE.InstancedMesh(G.toGeometry(), glazeMaterial('LEAF', { flap: 1.05 }), Math.max(1, n)); mesh.name = 'brimstones'; mesh.frustumCulled = false;
  const C = [[152, 338, -122], [170, 362, -134], [146, 306, -118], [182, 330, -140], [160, 286, -128], [138, 384, -126], [150, 300, -146], [176, 352, -132]];   // in the air north-east of the face: from the line beside the eye and from the line before the face they stand on the dark ground, never over the face
  const course = []; for (let i = 0; i < n; i++) { const c = C[i % C.length]; course.push({ c, r: 3.5 + 3 * rng(), w: (0.35 + 0.3 * rng()) * (rng() < 0.5 ? -1 : 1), ph: rng() * TAU, tilt: rng() * TAU }); }
  const m = new THREE.Matrix4(), e = new THREE.Euler(), q = new THREE.Quaternion(), v = new THREE.Vector3(), v2 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const at = (k, a, o) => { const ct = Math.cos(k.tilt), st = Math.sin(k.tilt), x = Math.cos(a) * k.r, z = Math.sin(a) * k.r * 0.7; return o.set(k.c[0] + x * ct - z * st, k.c[1] + 1.6 * Math.sin(2 * a + k.ph) + 0.5 * Math.sin(5 * a), k.c[2] + x * st + z * ct); };
  mesh.userData.fly = (time) => { for (let i = 0; i < n; i++) { const k = course[i], a = time * k.w + k.ph; at(k, a, v); at(k, a + 0.06 * Math.sign(k.w), v2);
    e.set(-0.3, Math.atan2(v2.x - v.x, v2.z - v.z), 0, 'YXZ'); q.setFromEuler(e); m.compose(v, q, one); mesh.setMatrixAt(i, m); }
    mesh.instanceMatrix.needsUpdate = true; };
  mesh.userData.fly(0); return mesh;
}
