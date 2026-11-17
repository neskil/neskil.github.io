// THE FRIEZE WITHOUT END: hero set piece + style kit. A lapis cylinder seal 160 m across rolls over wet
// clay and prints one raised picture every 503 m: lower register (x -113..40) palm, ibex, scale mountain, ibex,
// bull and a rayed sun disc beside it, three field fillers; upper register (x 44..140)
// a file of six walking beasts going with the seal (no figures of people, no bird: the brief); river band and rope on the sun side, rosettes and rope on the far side.
// Seal and print read the SAME texture, so they cannot disagree.
// TONE (round three): the band dries wet -> leather 200 m behind the seal and leather -> bone 760 m behind; it never
// bleaches to the plain's chalk in view. Whatever stands above 0.9 m is one whole tone drier than its ground (hard
// contour), except in the fresh 70-96 m behind the contact line; sun-facing flanks print in the palest tone (the lit
// lip); shade is 0.45 of the displayed value leaned to the sky (fzShade). The sky carries flat banks of dust and a
// low sun disc with one ring.
// ROUND FIVE: drawPicture queues every tool stamp and works the queue off between yields (no build step over ~16 ms);
// the wet line halts 205 m behind the seal's resting place and the two older lines close up as it slows (setProgress),
// so the band behind the stopped seal steps wet, leather, bone, chalk; no lit lip on wet clay and the satin streak only
// on clay still dark (a fresh figure is three tones); the cap's granules catch the sun in their turn (fzGold3g).
// ROUND SEVEN: a deeper relief (the baked cast shade is 1.4 times as long as the true sun's and fzShade is 0.39 of the
// displayed value); gold and lapis set into the print (uniform uInlay, filled by drawPicture: a gold boss in the sun
// disc, the star, the rosette and the fruit of the mountain's tree, a lapis eye in every beast, the sun's ring of twelve
// in lapis); on the drum, clay stands dried in every hollow of the figure field (x > -110), so each figure rides round
// as a crisp silhouette in two flat tones (STONE_FRAG, figm); the water in the river grooves is drawn in the clay's
// own tones (dark wet clay, thin running threads of cream).
//
// FRAME ("course" frame = hero.object local; place the object by TRANSLATION ONLY at the brief's world
//   (0,0,1000), the seal's contact point at rest). Local = brief world - (0,0,1000). +Z is the course (the
//   seal rolls toward +Z), axis along X at y 80, sun toward -X at 12 degrees, gold portal cap at x -172.
//   NOTE the piece is met from -Z (its printed side), so "front" here is -Z, not +Z.
//
// export function makeStyle(ctx, opts) -> style      (sync and cheap; opts: palette, stone, sunElevation, and the
//   world's variations: cream / haze / glow hexes and night (hour), weather 'still' | 'breeze' (uWind 2) | 'rain'
//   (drop craters instead of cracks), ghost (the second roll: a half-height first impression 6 m aside through the
//   oldest repeat, FZ_GHOST), creature 0..1 (cast: ibex, bull, palm | oryx, lion, palm | stag, lion, reeds))
//   palette     { wet, leather, bone, chalk, stone, gold, sky, cream, haze, vein, shadeOf(c) } linear Colors
//   uniforms    shared by every material: uTime, uContact (course z of the contact line), uFronts (course z of
//               the three drying lines), uOrigin (world position of the course origin), uCamPos, uSunDir, uPic
//   glsl        { common, surface, stone }: the GLSL every material is built from (fzDry, fzToneOf, fzShade,
//               fzHazed, fzSurface, fzLapis, fzGold3) for a world shader that must match the hand exactly
//   await picture()   draws the ONE picture into a float height field with three tools only (ball drill, wheel,
//               graver) and packs an RGBA8 texture 2012 x 1360 (4 px/m, repeat in z): R+B height (fzH), G the
//               sun's cast shadow on the print, A the same sun inside the seal's hollows. Yields often. Must
//               be awaited before the first frame (buildHero does). heightAt(x, z) reads it on the CPU.
//   materials   clay      the printed ground; use with friezeGeometry(repeats) (displaced in the vertex shader)
//               clayFree  any other clay thing (crumbs, bow waves): two tones by facing the sun, tone by the same
//                         drying lines; works on Mesh and InstancedMesh. clayFreeBiased(m) pins the dryness.
//               plain     the unprinted plain, the damp bed ahead of the seal, and the backing under the print
//               stone     the seal's drum (sealGeometry()); gold: three-tone gold; goldCap: + lapis inlay rings
//               sky       dome (makeSky() gives the mesh; update() keeps it on the camera)
//               dust      soft cream haze for ribbons and sprites (alpha from uv; uniforms.uOpacity)
//   makeNearPatches(levels, n, cell)  nested fine ground under the lens (n*n*2 triangles each): add the meshes
//               to the hero object. The coarse tiles alone are right for views beyond ~100 m.
//               Under the lens the grid carries PLATEAUS (the highest of nine taps reaching 1.3 m past a crest), so
//               every painted edge lies on level grid. ROUND FIVE: all tone and shade on the print is read from the
//               picture per pixel; nothing in CLAY_FRAG depends on the grid's own height (that drew combs on the
//               scales). Far tiles carry a five-tap tent. Shade is fzShade: 0.6 of the DISPLAYED value leaned a
//               tenth to the sky (#7E6B55 -> #584F43). With opts.ghost a second mask (pic2, R8) holds the ghost's
//               own baked shadow. After rain (uRain) cracks give way to drop craters drawn as crescents of shade.
//   makePlates(count, x0, x1, z0, z1, rng, all, loft)  curled plates of long-dry clay that lift and tumble downwind
//               (uTime); all = 1: live everywhere (the plain), loft: how high the lifted ones fly
//   setProgress(u)  0..1 along the flight: seal position, turn and drying lines are functions of u ONLY (t = 42u s;
//               axis z 700 -> 1000 world at 10 m/s to t 27, eased to rest at t 36 = u 0.857; lines follow at
//               200 / 330 / 620 m, each reaching relief tops early, and keep coming after the seal stops). sealZ(u), contactZ, rollAngle.
//   update(dt, time, camera, object)  drives uTime, uCamPos, uOrigin, sky and patches. Call every frame
//               (hero.update does it). figures: layout of the picture; figures.toCourse(pz, k) -> course z.
//
// export async function buildHero(ctx, opts) -> { object, radius 190, height 160, center, anchors, style,
//     update(dt,time,camera), setProgress(u), dispose(), ground: false }
//   opts: palette (7 hex, brief order), detail 0.6..1, style (shared instance), repeats (503 m printed tiles kept
//   behind the seal: 1 here, the world wants 3), nearPatch (false | true | levels), sky (true: adds the dome),
//   plain (true), stone 'lapis' | 'carnelian' | 'serpentine' (seeded when absent, mostly lapis).
//   Until setProgress is called the piece plays a slow demo roll from `time` (the viewer only).
//   anchors (course frame): portalSeat { position (-172,80,0), facing (-1,0,0), radius 7 } on the bore of the
//     near cap, valid once the seal rests (u >= 0.857); bore; capCentre; flyThrough (the brief's path, >= 6 m
//     clear); viewpoints; slip[k] the overshot foreleg in repeats 1..3; seams; sealAxisAt(u); figures.
// COST (repeats 1, no patches): ~150k triangles, 11 draw calls with sky and plain, one 2012x1360 RGBA8
//   texture, no lights, ~300 ms build in steps under 25 ms. Each further repeat 54k, each near patch 41k.
// POST assumed: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';
import { makeRng } from '../kit/core.js';

export const PITCH = 503, WIDTH = 340, SEAL_R = PITCH / (2 * Math.PI), RELIEF = 5;
const PXM = 4, CW = PITCH * PXM, CH = WIDTH * PXM, SEAM0 = 57;   // pic z = course z + SEAM0 (mod 503)
const DEFAULT_PALETTE = ['#7E6B55', '#A68E6E', '#D6C6A5', '#E4D8BD', '#1F3C88', '#D1A640', '#C9D8D6'];
const STONES = { lapis: null, carnelian: ['#A8321E', '#E9B48C', '#D1A640'], serpentine: ['#2F5D4A', '#B9CDB4', '#C9CCD0'] };

// ---- GLSL shared by every material of the style -------------------------------------------------
const GLSL_COMMON = /* glsl */`
uniform float uTime, uContact, uSunTan, uStart, uWind, uPixel;
uniform vec3 uFronts, uOrigin, uTone[4], uSky, uCream, uHaze, uCamPos; uniform vec4 uGhost;
uniform sampler2D uPic;
float fzH(vec4 t){ return t.r + (t.b - 0.5) * 0.00392157; }   // height 0..1: byte + residual, filters exactly
float fzHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float fzNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(fzHash(i), fzHash(i + vec2(1., 0.)), f.x), mix(fzHash(i + vec2(0., 1.)), fzHash(i + vec2(1., 1.)), f.x), f.y); }
float fzFbm(vec2 p){ return 0.5 * fzNoise(p) + 0.3 * fzNoise(p * 2.13 + 7.1) + 0.2 * fzNoise(p * 4.37 + 3.7); }
vec2 fzPicUv(vec2 xz){ return vec2((xz.y + ${SEAM0}.) / ${PITCH}., (xz.x + ${WIDTH / 2}.) / ${WIDTH}.); }
vec3 fzToneOf(vec3 s){ return mix(mix(mix(uTone[0], uTone[1], s.x), uTone[2], s.y), uTone[3], s.z); }
// shaded clay: the SAME value at 0.6 leaned a tenth to the sky, worked out in DISPLAY terms (the flat switch shows
// linear colour as its sRGB hex, so 0.6 of the linear value would print at 0.8): #7E6B55 -> #584F43
vec3 fzShade(vec3 c, float sh){
  vec3 d = 0.39 * pow(max(c, vec3(0.)), vec3(0.4545)) + 0.08 * pow(max(uSky, vec3(0.)), vec3(0.4545));      // round seven: a deeper shade (0.45 before), one flat tone
  return mix(c, pow(d, vec3(2.2)), sh); }
vec3 fzHazed(vec3 c, vec3 wp){ float d = length(wp - uCamPos) / 2000.; return mix(c, uHaze, 1. - exp(-d * d * d)); }
`;
// fine surface of the clay: striations along the course, pinholes, two scales of cracks that widen with age.
// Everything fades by fwidth before it can shimmer; contrast stays under 8 percent.
const GLSL_SURF = /* glsl */`
uniform vec3 uSunDir; uniform float uRain;
// dryness 0 wet .. 3 chalk at course point xz, height h (m): three ragged lines, relief tops first
vec4 fzDry(vec2 xz, float h){
  float rag = (fzFbm(xz * 0.011) - 0.5) * 64. + (fzNoise(xz * 0.09) - 0.5) * 9.;
  // relief dries from its tops down: each line reaches a height h this many metres early (the long-dry line by
  // the most, so through the whole bone-dry stretch a figure stands chalk on bone, graded by its contours)
  vec3 z = vec3(xz.y + rag) - h * vec3(22., 26., 58.);
  vec3 w = clamp(fwidth(z) * 0.75, 0.15, 5.);           // hard lines: a pixel of filtering and no more
  vec3 s = 1. - smoothstep(uFronts - w, uFronts + w, z);   // x: past wet line, y: past leather line, z: past bone line
  return vec4(s, uFronts.z - xz.y - rag);              // w: metres behind the long-dry line (the ground's own age)
}
float fzVor(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(fzHash(i + g), fzHash(i + g + 17.3)); float d = length(g + o - f);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  return d2 - d1; }
float fzSurface(vec2 xz, float age, float wet){
  float px = max(fwidth(xz.x), fwidth(xz.y));
  float m = 1.;
  float fine = 1. - smoothstep(0.05, 0.35, px);
  m -= 0.045 * fine * (fzNoise(vec2(xz.x * 5., xz.y * 0.16)) - 0.5) * 2.;            // drag striations, along Z
  vec2 pc = xz * 1.7; float ph = fzHash(floor(pc));
  m -= 0.07 * fine * step(0.9, ph) * (1. - smoothstep(0.1, 0.22, length(fract(pc) - 0.5)));   // pinholes
  float a = clamp(age, 0., 1.) * (1. - wet);
  m += 0.02 * (fzNoise(xz * 0.05) - 0.5);
  return m; }
// cracks of the drying clay, two scales of irregular plates; the line widens with age. Returned as a 0..1
// SHADE amount: a crack is drawn in the shadow tone like every other line of the style. Thin lines are
// weighted by their share of the pixel, so they fade with distance instead of sparkling.
// after rain the old clay is pocked with drop craters instead of cracking: drawn like the drilled balls in
// reverse, a hard crescent of shade under the sunward lip and the thin shade of the raised rim on the lee.
// Three sizes; each is dropped when its bowl is under a pixel and a half.
float fzCrater(vec2 xz, float px){
  float s = 0.;
  for (int k = 0; k < 3; k++) {
    float cell = k == 0 ? 9. : (k == 1 ? 3.7 : 1.5);
    vec2 q = xz / cell + float(k) * 17.3, ci = floor(q);
    vec2 o = (vec2(fzHash(ci + 2.1), fzHash(ci + 9.7)) - 0.5) * 0.3;
    float rr = 0.15 + 0.19 * fzHash(ci + 5.5), e = px / cell + 0.003;
    vec2 f = fract(q) - 0.5 - o;
    float on = step(0.16, fzHash(ci + 1.3)) * (1. - smoothstep(0.3 * rr, 0.75 * rr, e));
    float bowl = 1. - smoothstep(rr - e, rr + e, length(f));
    float lit = 1. - smoothstep(rr * 0.96 - e, rr * 0.96 + e, length(f - vec2(rr * 0.56, 0.)));
    float lee = (1. - smoothstep(rr * 1.07 - e, rr * 1.07 + e, length(f - vec2(rr * 0.2, 0.)))) * (1. - bowl);
    s = max(s, on * max(bowl * (1. - lit), 0.45 * lee * step(0.5, fzHash(ci + 7.7))));
  }
  return s; }
float fzCrack(vec2 xz, float age, float wet){
  float px = max(fwidth(xz.x), fwidth(xz.y));
  float a = clamp(age, 0., 1.) * (1. - wet);
  if (uRain > 0.5) return 0.9 * fzCrater(xz, px) * smoothstep(0.03, 0.3, a);
  float w1 = 0.018 + 0.022 * a, w2 = 0.035 + 0.04 * a, p1 = px * 0.11 + 1e-4, p2 = px * 0.45 + 1e-4;
  float c1 = clamp((w1 - fzVor(xz * 0.11)) / p1 + 0.5, 0., 1.) * clamp(2. * w1 / p1, 0., 1.) * (1. - smoothstep(1.2, 3.5, px));
  float c2 = clamp((w2 - fzVor(xz * 0.45 + 31.)) / p2 + 0.5, 0., 1.) * clamp(2. * w2 / p2, 0., 1.) * (1. - smoothstep(0.3, 1., px));
  return 0.6 * max(c1, 0.7 * c2) * smoothstep(0.03, 0.3, a); }      // a crack is a thin line of shade, held under the figures' own
`;
const CLAY_VERT = /* glsl */`
attribute float aTile; uniform float uTileZ;
#ifdef FZ_PATCH
  uniform vec4 uPatch;     // centre x, centre z, cell, half size
#endif
varying vec3 vL; varying vec3 vW;
${GLSL_COMMON}
float fzH1(vec2 xz, float lod){        // the ground's height (metres), the ghost included
  float h = fzH(textureLod(uPic, fzPicUv(xz), lod)) * ${RELIEF}.;
  #ifdef FZ_GHOST
    h = max(h, fzH(textureLod(uPic, fzPicUv(xz - uGhost.xy), lod)) * ${(RELIEF / 2).toFixed(2)} * uGhost.z * (1. - smoothstep(uGhost.w - 50., uGhost.w, xz.y)));
  #endif
  return h; }
// the height the grid carries: five taps over one cell (a tent two cells wide that does not sit on the mip
// lattice), so a chamfer always spans two cells and no ridge is combed or stepped by the grid
float fzHv(vec2 xz, float lod, float r){
  return 0.36 * fzH1(xz, lod) + 0.16 * (fzH1(xz + vec2(r, r), lod) + fzH1(xz + vec2(-r, r), lod) + fzH1(xz + vec2(r, -r), lod) + fzH1(xz - vec2(r, r), lod)); }
// Under the lens the grid carries the highest of nine taps within 0.85 of a cell instead: every flat crest is a
// true plateau that reaches a little past its chamfer, so the tone edge along a crest lies on level ground and
// stays a ruled line, and the grid's stepping is all on the wall below it, which CLAY_FRAG shades in one tone.
float fzHp(vec2 xz, float lod, float r){
  float a = 0.71 * r, h = fzH1(xz, lod);
  h = max(h, max(max(fzH1(xz + vec2(r, 0.), lod), fzH1(xz - vec2(r, 0.), lod)), max(fzH1(xz + vec2(0., r), lod), fzH1(xz - vec2(0., r), lod))));
  return max(h, max(max(fzH1(xz + vec2(a, a), lod), fzH1(xz - vec2(a, a), lod)), max(fzH1(xz + vec2(a, -a), lod), fzH1(xz + vec2(-a, a), lod)))); }
void main(){
  #ifdef FZ_PATCH
    vec3 p = vec3(clamp(position.x * uPatch.z + uPatch.x, -${WIDTH / 2}., ${WIDTH / 2}.), 0., position.z * uPatch.z + uPatch.y);
    float tap = max(0.85 * uPatch.z, 1.3), lod = log2(max(uPatch.z, 0.26) * ${PXM}.) - 1.;
  #else
    vec3 p = position; p.z += uTileZ - aTile * ${PITCH}.;
    float tap = position.x < -100. ? 1.1 : 1.4, lod = position.x < -100. ? 2.4 : (position.x < 0. ? 2.9 : 3.2);
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 L = wp.xyz - uOrigin;
  #ifdef FZ_PATCH
    // round four: the plateau reaches 1.3 m past every crest, to the FOOT of its chamfer, so the whole painted figure
    // (pale top, lit lip, shade line: all per pixel from the picture) lies on level ground and every edge of it is a
    // ruled line; the grid's stepping is all on the wall outside the foot, which is painted as the ground it stands
    // on (sun side) or as the shade it stands in (lee side) and so cannot be seen
    float h = fzHp(L.xz, lod, tap);
  #else
    float h = fzHv(L.xz, lod, tap);
  #endif
  wp.y += h + 0.07;          // the print lies a finger above its backing plain: the two never fight for depth
  vL = vec3(L.x, h, L.z); vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const CLAY_FRAG = /* glsl */`
varying vec3 vL; varying vec3 vW;
${GLSL_COMMON}
${GLSL_SURF}
uniform vec4 uHole; uniform float uHoleM, uCellF; uniform vec4 uInlay[16]; uniform vec3 uStone, uGold;
#ifdef FZ_GHOST
  uniform sampler2D uPic2;
#endif
// ROUND EIGHT: under the lens the picture is read through a cubic B-spline (four bilinear taps), so the height and
// everything cut from it (the pale top's contour, the lit lip, the shade) is a smooth field: a straight wheel-cut
// has ruled edges at any size. (A threshold on plain bilinear taps kinks at every texel: the teeth of a comb.)
vec4 fzPicC(vec2 uv){
  vec2 sz = vec2(${CW}., ${CH}.), st = uv * sz - 0.5, i = floor(st), f = st - i, f2 = f * f, f3 = f2 * f;
  vec2 w0 = (1. - f) * (1. - f) * (1. - f) / 6., w1 = (3. * f3 - 6. * f2 + 4.) / 6., w3 = f3 / 6., w2 = 1. - w0 - w1 - w3;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 p0 = (i - 0.5 + w1 / max(g0, vec2(1e-4))) / sz, p1 = (i + 1.5 + w3 / max(g1, vec2(1e-4))) / sz;
  return g0.y * (g0.x * textureLod(uPic, p0, 0.) + g1.x * textureLod(uPic, vec2(p1.x, p0.y), 0.))
       + g1.y * (g0.x * textureLod(uPic, vec2(p0.x, p1.y), 0.) + g1.x * textureLod(uPic, p1, 0.)); }
vec4 fzPicN(vec2 uv, float bs, float kC){
  vec4 t = texture2D(uPic, uv, bs);
  #ifdef FZ_PATCH
    t = mix(t, fzPicC(uv), kC);
  #endif
  return t; }
void main(){
  if (vL.z > uContact || vL.z < uStart) discard;
  if (uHole.w > 0. && max(abs(vL.x - uHole.x), abs(vL.z - uHole.y)) < uHole.w - uHoleM) discard;   // a finer patch has this ground
  vec2 xz = vL.xz, uv = fzPicUv(xz);
  // a level sharper under the lens (shadows stay a drawing at grazing angles), the true level far off: a mask taken
  // sharper than the pixel there breaks into speckle, and the far band must be a line drawing
  float cd = length(vW - uCamPos), far = smoothstep(300., 700., cd), bs = -1. + smoothstep(220., 520., cd) + 0.8 * smoothstep(450., 1000., cd);     // far off a level blurrier still: only the big shapes and their shade stay
  float kC = 1. - smoothstep(75., 112., cd), nearK = 1. - smoothstep(70., 120., cd);
  vec4 t = fzPicN(uv, bs, kC);
  // ROUND EIGHT, the far band as a clean drawing: beyond 400 m the picture is read once more at the level of the
  // pixel's LONG side (the anisotropic lookup above is sharper than the pixel grid there, and a threshold on it
  // breaks into ragged blotches): only shapes larger than a pixel are left, and their shade is cut on that smooth
  // field, so every far edge is a curve and what is too small to draw is not drawn
  vec2 tq = uv * vec2(${CW}., ${CH}.);
  float lodF = log2(max(max(length(dFdx(tq)), length(dFdy(tq))), 1.)), farK = smoothstep(380., 620., cd);
  vec4 tF = textureLod(uPic, uv, lodF + 0.3);
  float h0 = fzH(t), h = h0 * ${RELIEF}.;
  // the slope, taken across three texels and centred: the chamfer of a thin wheel-cut is only two and a half
  // texels wide, and a one-sided difference draws its shade line as texel stairs (a comb down every limb)
  float e = 1. / ${CW}., ez = 1.5 / ${CW}., ex = 1.5 / ${CH}.;
  float hzp = fzH(fzPicN(uv + vec2(ez, 0.), bs, kC)), hzm = fzH(fzPicN(uv - vec2(ez, 0.), bs, kC));
  float hxp = fzH(fzPicN(uv + vec2(0., ex), bs, kC)), hxm = fzH(fzPicN(uv - vec2(0., ex), bs, kC));
  float hz = hzp - hzm, hx = hxp - hxm;
  vec3 N = normalize(vec3(-hx * ${(RELIEF * PXM / 3).toFixed(3)}, 1., -hz * ${(RELIEF * PXM / 3).toFixed(3)}));
  float hsm = (0.5 * h0 + 0.125 * (hzp + hzm + hxp + hxm)) * ${RELIEF}.;      // the height the drying lines read: smooth across a chamfer
  // ROUND FIVE: every tone and every shade on the print is read from the PICTURE at the pixel and from nothing else.
  // (Round four also shaded "the wall", wherever the ground grid stood above the picture; the grid's height changes
  // cell by cell, so the terminator of every drilled scale was a comb and the limbs had ragged lips.) The grid only
  // gives the relief its parallax; its plateau reaches past every chamfer, so each painted edge lies on level grid.
  // far off the mask is cut over the whole width its value changes in a pixel, so the shade of a figure too small for
  // the pixel grid is a grey of its true cover and never a flipping dot (the far band is a line drawing, not dither)
  float sw = clamp(fwidth(t.g) * 0.8, 0.006, mix(0.03, 0.5, far));
  float sh = smoothstep(0.052 - min(sw, 0.05), 0.052 + sw, t.g);
  #ifdef FZ_GHOST
  {   // the second roll: a first impression a little out of true, half as high, ironed out by the fresh print
    float gm = uGhost.z * (1. - smoothstep(uGhost.w - 50., uGhost.w, xz.y));
    vec2 gu = fzPicUv(xz - uGhost.xy);
    float g0 = fzH(texture2D(uPic, gu, bs)) * 0.5 * gm;
    if (g0 > h0) {
      hz = (fzH(texture2D(uPic, gu + vec2(e * 2., 0.), -1.)) * 0.5 * gm - g0); hx = (fzH(texture2D(uPic, gu + vec2(0., e * ${(CW / CH * 2).toFixed(4)}), -1.)) * 0.5 * gm - g0);
      N = normalize(vec3(-hx * ${(RELIEF * PXM / 2).toFixed(1)}, 1., -hz * ${(RELIEF * PXM / 2).toFixed(1)}));
      h0 = g0; h = h0 * ${RELIEF}.; hsm = h;
    }
    // its own shade, baked like the picture's (the same horizon sweep at half height, uPic2): a ruled hard
    // edge, half as long, and only where the ghost's horizon stands above the ground that is really there
    float g2 = texture2D(uPic2, gu, -1.).r, gw = clamp(fwidth(g2) * 0.35, 0.004, 0.02);
    float gs = smoothstep(0.04 - gw, 0.04 + gw, g2 * 0.4 * gm + g0 - h0);
    sh = max(sh, gs);
  }
  #endif
  // the facing says shade too: clay turned from the sun, and the steep flanks of a wheel-cut that the raking
  // sun only grazes (less than half the light flat ground takes), so a limb lying along the light is still
  // drawn, by a hard line down each side of its crest
  float nls = dot(N, uSunDir), fnl = fwidth(nls) * 0.7 + 0.008;
  // (round eight: under the lens only what is turned AWAY from the sun is shade; the flanks of a cut lying along the
  // light were a rim of a third tone down both sides of every limb)
  float thrN = mix(0.5 * uSunDir.y, -0.04, nearK);
  sh = max(sh, 1. - smoothstep(thrN - fnl, thrN + fnl, nls));
  { float wF = clamp(fwidth(tF.g) * 0.9, 0.012, 0.2);
    sh = mix(sh, smoothstep(0.09 - wF, 0.09 + wF, tF.g), farK);
    hsm = mix(hsm, fzH(tF) * ${RELIEF}., farK); }
  vec4 d = fzDry(xz, hsm);
  float wet = 1. - d.x, age = (d.w + 320.) / 320.;
  // THE PICTURE IS A PICTURE: whatever stands above a metre is one whole tone drier than the ground it stands on
  // (pale figures on dark clay, cut by a hard contour), except in the fresh print right behind the seal
  float fl = fwidth(hsm) * 0.7 + 0.03;
  float lift = smoothstep(0.9 - fl, 0.9 + fl, hsm) * (1. - smoothstep(uContact - 5., uContact - 1.5, xz.y));      // round eight: a fresh figure has its paler top from the contact line on (three tones the moment it comes out from under the drum)
  // round eight: under the lens the shaded FLANK of a cut (steep clay turned from the sun) takes the ground's shade
  // tone, the same as the cast shade lying beside it, so no limb has a rim of a third tone; broad shade on a figure's
  // top (the lee half of a drilled dome, a shadow falling across a body) keeps the figure's own
  float steep = smoothstep(1.1, 2., length(vec2(hx, hz)) * ${(RELIEF * PXM / 3).toFixed(3)});
  vec3 dl = mix(d.xyz, vec3(1., d.x, d.y), lift * (1. - sh * nearK * steep));
  vec3 col = fzToneOf(dl) * fzSurface(xz, age, wet);
  sh = max(sh, fzCrack(xz, age, wet));
  // the lit lip: the flank of every cut that faces the raking sun prints in the palest tone, hard-edged
  float lipM = smoothstep(0.56 - fnl, 0.56 + fnl, nls) * (1. - sh) * (1. - wet) * (1. - far);        // round five: no lit lip on wet clay (its one highlight is the satin streak)
  col = mix(col, mix(uTone[3], uCream, 0.6), lipM);
  // round seven: gold and lapis set into the print (flat, a cut edge, shaded by the same baked shade as the clay)
  float ipx = max(fwidth(xz.x), fwidth(xz.y)) * 0.7 + 0.02, inG = 0., inL = 0.;
  vec2 pq = vec2(fract(uv.x) * ${PITCH}., xz.x);
  for (int i = 0; i < 16; i++) {
    vec4 s = uInlay[i]; float dz = pq.x - s.x; dz -= ${PITCH}. * floor(dz / ${PITCH}. + 0.5);
    float m = 1. - smoothstep(s.z - ipx, s.z + ipx, length(vec2(dz, pq.y - s.y)));
    inG = max(inG, m * step(0.5, s.w) * step(s.w, 1.5)); inL = max(inL, m * step(1.5, s.w));
  }
  { vec2 sq = pq - uInlay[0].xy; sq.x -= ${PITCH}. * floor(sq.x / ${PITCH}. + 0.5);            // the sun's ring of twelve drilled dots, lapis
    float sa = floor(atan(sq.y, sq.x + (sq.x >= 0. ? 1e-4 : -1e-4)) / 0.5235988 + 0.5) * 0.5235988;
    inL = max(inL, (1. - smoothstep(2.5 - ipx, 2.5 + ipx, length(sq - 18.5 * vec2(cos(sa), sin(sa))))) * step(0.5, uInlay[0].w)); }
  col = mix(mix(col, uGold, inG), uStone, inL);
  // water lying in the river grooves of the wet stretch, running back toward -Z and sinking away at its end.
  // It lies only where a ridge of the river band stands on BOTH sides of it, so every edge of it is a ridge.
  float lvl = 0.75 * clamp((xz.y - uFronts.x) / 70., 0., 1.), fwh = fwidth(h) + 0.02, water = 0.;
  if (xz.x > -155.8 && xz.x < -112. && wet > 0.01 && lvl > 0.01 && h < lvl + 0.3) {      // its outer bank is the ruled line inside the rope (x -156.3), whole
    float hl = 0., hr = 0.;
    for (int k = 1; k <= 9; k++) {
      float dd = float(k) * ${(1.5 / WIDTH).toFixed(6)};
      hl = max(hl, max(fzH(textureLod(uPic, uv - vec2(0., dd), 2.)), 1. - step(${(14.2 / WIDTH).toFixed(5)}, uv.y - dd)));     // (that thin line was found by some taps and missed by others: a comb of dark strokes)
      hr = max(hr, fzH(textureLod(uPic, uv + vec2(0., dd), 2.)) * step(uv.y + dd, ${(56.5 / WIDTH).toFixed(5)}));
    }
    water = step(lvl + 0.12, min(hl, hr) * ${RELIEF}.) * wet * (1. - smoothstep(lvl - fwh, lvl + fwh, h));
  }
  float thr = fzNoise(vec2(xz.x * 1.3, xz.y * 0.07 + uTime * 0.9)) * 0.6 + fzNoise(vec2(xz.x * 3.1, xz.y * 0.19 + uTime * 1.7)) * 0.4;
  float fthr = fwidth(thr) * 0.7 + 0.004;
  vec3 wcol = mix(uTone[0], uCream, 0.7 * smoothstep(0.64 - fthr, 0.64 + fthr, thr));       // round seven: the clay's own tones, wet and dark, with thin running threads of cream
  col = mix(col, wcol, water);
  col = fzShade(col, sh * (1. - 0.5 * water));
  // one satin streak of sky cream on wet clay: a hard-edged band down the sunward flank of every
  // crest (it slides a little with the eye, as satin does), capped at 1
  vec3 V = normalize(uCamPos - vW + vec3(0., 1e-3, 0.));
  vec3 Sg = normalize(uSunDir + vec3(0., 0.45, 0.) + 0.2 * vec3(V.x, 0., V.z));
  float sp = dot(N, Sg), fs = fwidth(sp) * 0.7 + 0.006;
  float streak = smoothstep(0.7 - fs, 0.7 + fs, sp) * wet * (1. - sh) * (1. - water) * (1. - lift * (1. - smoothstep(uContact - 70., uContact - 45., xz.y))) * (1. - max(inG, inL));     // and the streak only on clay that is still dark: a fresh figure is three tones
  col = min(col + uCream * 0.4 * streak, vec3(1.));
  float seam = abs(fract(uv.x + 0.5) - 0.5) * ${PITCH}.;
  col *= 1. - 0.16 * (1. - smoothstep(0.12, 0.12 + fwidth(xz.y) * 1.2 + 0.05, seam));
  gl_FragColor = vec4(fzHazed(col, vW), 1.);
}`;
// free clay: plates, crumbs, bow waves, strings. Two tones by facing the sun; tone by the same drying lines.
const FREE_VERT = /* glsl */`
varying vec3 vL; varying vec3 vW; varying vec3 vN;
uniform vec3 uOrigin;
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
    p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * p; vW = wp.xyz; vL = wp.xyz - uOrigin; vN = mat3(modelMatrix) * n;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FREE_FRAG = /* glsl */`
varying vec3 vL; varying vec3 vW; varying vec3 vN;
uniform float uDryBias;
${GLSL_COMMON}
${GLSL_SURF}
void main(){
  vec3 N = vN * (gl_FrontFacing ? 1. : -1.); float ln = length(N); N = ln > 1e-5 ? N / ln : vec3(0., 1., 0.);
  vec4 d = fzDry(vL.xz + vec2(0., uDryBias), 0.);
  vec3 col = fzToneOf(d.xyz) * fzSurface(vL.xz + vL.y * 0.7, (d.w + 260.) / 380., 1. - d.x);
  float nl = dot(N, uSunDir), fn = fwidth(nl) + 0.01, sh = 1. - smoothstep(-fn, fn, nl);
  col = fzShade(col, sh);
  // wet clay keeps its one satin streak of sky cream here too: a hard band down the sunward shoulder
  vec3 V = normalize(uCamPos - vW + vec3(0., 1e-3, 0.));
  vec3 Sg = normalize(uSunDir + vec3(0., 0.45, 0.) + 0.2 * vec3(V.x, 0., V.z));
  float sp = dot(N, Sg), fs = fwidth(sp) * 0.7 + 0.006;
  col = min(col + uCream * 0.4 * smoothstep(0.9 - fs, 0.9 + fs, sp) * (1. - d.x) * (1. - sh), vec3(1.));
  gl_FragColor = vec4(fzHazed(col, vW), 1.);
}`;
// plates of long-dry clay: lie, curl at the edges, lift, tumble away downwind (+X), and begin again.
// Per-instance aPlate = (course x, course z, size m, seed 0..1). Shaded by FREE_FRAG like all free clay.
const PLATE_VERT = /* glsl */`
attribute vec4 aPlate; uniform float uPlateAll, uLoft, uPlateRate;
varying vec3 vL; varying vec3 vW; varying vec3 vN;
${GLSL_COMMON}
void main(){
  float seed = aPlate.w, size = aPlate.z;
  float ph = fract(uTime * uWind * uPlateRate * (0.03 + 0.03 * fract(seed * 7.13)) + seed);
  float lift = smoothstep(0.6, 1., ph), curl = smoothstep(0., 0.6, ph) * 0.8 + lift * 0.5;
  float live = max(uPlateAll, step(aPlate.y, uFronts.z - 15.)) * (1. - smoothstep(0.93, 1., ph)) * smoothstep(0., 0.04, ph);
  float ry = seed * 39.7, cy = cos(ry), sy = sin(ry);
  // round eight (FZ_PLATE_BIG): a plate the size of one cell of the cracked plain curls only a little (its shade lies
  // right beside it) and draws in as it curls, so the darker bed it is leaving shows round it (FZ_PLATE_BED: that bed,
  // a flat patch of bone-dry clay that opens as the plate curls and closes when the skin has formed again)
  #ifdef FZ_PLATE_BIG
    float shrink = 1. - 0.3 * curl, ck = 0.1;
  #else
    float shrink = 1., ck = 0.3;
  #endif
  #ifdef FZ_PLATE_BED
    shrink = smoothstep(0.02, 0.2, ph) * (1. - smoothstep(0.9, 1., ph)); live = 1.; curl = 0.; lift = 0.;
  #endif
  vec3 p = vec3(position.x * cy - position.z * sy, 0., position.x * sy + position.z * cy) * size * live * shrink;
  float r2 = dot(position.xz, position.xz) * 4.;
  p.y = curl * r2 * size * ck;
  vec3 n = normalize(vec3(-(position.x * cy - position.z * sy) * curl * 8. * ck, 1., -(position.x * sy + position.z * cy) * curl * 8. * ck));
  float a = lift * (5. + 9. * fract(seed * 3.7)), ca = cos(a), sa = sin(a);
  p = vec3(p.x * ca - p.y * sa, p.x * sa + p.y * ca, p.z); n = vec3(n.x * ca - n.y * sa, n.x * sa + n.y * ca, n.z);
  float ground = fzH(textureLod(uPic, fzPicUv(aPlate.xy), 2.)) * ${RELIEF}.;
  vec3 L = vec3(aPlate.x, ground + 0.06, aPlate.y) + p;
  L += lift * lift * vec3(50. + 60. * fract(seed * 5.3), (3. + 12. * fract(seed * 9.1)) * uLoft, 14. * (fract(seed * 2.9) - 0.3)) + vec3(0., sin(lift * 3.14159) * 5. * min(1., uLoft), 0.);
  #ifdef FZ_PLATE_SHADE
    // round eight: the plate's own shade, laid on the ground where the raking sun puts it (a line here is a shadow)
    L.x += max(L.y - ground - 0.06, 0.) / max(uSunTan, 0.05); L.y = ground + 0.09; n = vec3(0., 1., 0.);
  #endif
  #ifdef FZ_PLATE_BED
    L.y = ground + 0.03;
  #endif
  vec4 wp = modelMatrix * vec4(L, 1.);
  vW = wp.xyz; vL = wp.xyz - uOrigin; vN = n;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const PLATE_SHADE_FRAG = /* glsl */`
varying vec3 vL; varying vec3 vW; varying vec3 vN;
${GLSL_COMMON}
void main(){
  #ifdef FZ_PLATE_BED
    gl_FragColor = vec4(fzHazed(uTone[2], vW), 1.);
  #else
    gl_FragColor = vec4(fzHazed(fzShade(uTone[3], 1.), vW), 1.);
  #endif
}`;
const PLAIN_VERT = /* glsl */`
varying vec3 vL; varying vec3 vW; uniform vec3 uOrigin;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vL = wp.xyz - uOrigin; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const PLAIN_FRAG = /* glsl */`
varying vec3 vL; varying vec3 vW;
${GLSL_COMMON}
${GLSL_SURF}
void main(){
  vec2 xz = vL.xz;
  // the prepared bed ahead of the seal: smooth damp clay inside the strip, ragged at its edges
  float rag = (fzNoise(xz * 0.03) - 0.5) * 14.;
  float ew = fwidth(xz.x) + 0.3;
  float bed = (1. - smoothstep(${WIDTH / 2 + 22}. - ew, ${WIDTH / 2 + 22}. + ew, abs(xz.x) + rag)) * smoothstep(uContact - 2., uContact + 2., xz.y)
            * (1. - smoothstep(uContact + 700., uContact + 1100., xz.y + rag * 6.));
  vec3 col = mix(uTone[3] * fzSurface(xz, 1., 0.), uTone[1] * fzSurface(xz, 0., 1.), bed);
  col = fzShade(col, fzCrack(xz, 1., 0.) * (1. - bed));
  // under the printed strip the plain is only a backing (polygon offset): same tone, so no seam can show
  if (abs(xz.x) < ${WIDTH / 2}. && xz.y <= uContact && xz.y > uStart) col = fzToneOf(fzDry(xz, 0.).xyz);
  gl_FragColor = vec4(fzHazed(col, vW), 1.);
}`;
// the seal: a grid (x, phi) wrapped in the vertex shader and sunk by the same picture, so a hollow lifts
// off the very relief it printed. Rolling is a scroll of the picture round the drum; nothing is rotated.
const STONE_VERT = /* glsl */`
varying vec3 vW; varying vec2 vUv; varying float vPhi;
${GLSL_COMMON}
void main(){
  float phi = position.y;
  vUv = vec2((uContact - ${SEAL_R.toFixed(4)} * phi + ${SEAM0}.) / ${PITCH}., (position.x + ${WIDTH / 2}.) / ${WIDTH}.);
  float h = fzH(textureLod(uPic, vUv, 3.)) * ${RELIEF}.;
  float r = ${SEAL_R.toFixed(4)} - h;
  vec4 wp = modelMatrix * vec4(position.x, ${SEAL_R.toFixed(4)} - r * cos(phi), uContact - r * sin(phi), 1.);
  vW = wp.xyz; vPhi = phi;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const GLSL_STONE = /* glsl */`
uniform vec3 uStone, uVein, uGold, uSunDir;
float fzN3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float n = i.x + i.y * 57. + i.z * 113.;
  vec4 a = fract(sin(vec4(n, n + 1., n + 57., n + 58.)) * 43758.5453), b = fract(sin(vec4(n + 113., n + 114., n + 170., n + 171.)) * 43758.5453);
  vec4 m = mix(a, b, f.z); vec2 m2 = mix(m.xy, m.zw, f.y); return mix(m2.x, m2.y, f.x); }
vec3 fzGold3g(vec3 N, float g){     // g 0..1: the granule is catching the sun (its third tone spreads; eased by the caller)
  float nl = dot(N, uSunDir), f = fwidth(nl) + 0.02;
  float hi = dot(N, normalize(uSunDir + vec3(0., 0.6, 0.))), fh = fwidth(hi) + 0.01, th = 0.93 - 0.22 * g;
  vec3 c = mix(uGold * 0.56, uGold, smoothstep(0.12 - f, 0.12 + f, nl));
  return mix(c, mix(uGold, uCream, 0.5 + 0.4 * g), smoothstep(th - fh, th + fh, hi)); }
vec3 fzGold3(vec3 N){ return fzGold3g(N, 0.); }
vec3 fzLapisV(vec3 q, float lit, float veins){   // q: a point fixed in the stone (metres); lit 0..1; veins 0 | 1
  float mott = fzN3(q * 0.035) - 0.5;
  vec3 c = uStone * (1. + 0.16 * mott);
  // calcite: flat veins cutting through the block, so on the drum they run as broken arcs
  vec3 wq = q + 20. * (vec3(fzN3(q * 0.017), fzN3(q * 0.017 + 5.), fzN3(q * 0.017 + 11.)) - 0.5);
  float t1 = dot(wq, vec3(0.0085, 0.0062, 0.0071)), t2 = dot(wq, vec3(-0.0041, 0.0093, -0.0057)) + 0.37;
  float px = length(fwidth(q)) + 1e-4, vw = max(0.16, 0.45 * px);
  float d1 = abs(fract(t1) - 0.5) / max(fwidth(t1), 1e-6) * px, d2 = abs(fract(t2) - 0.5) / max(fwidth(t2), 1e-6) * px;
  float m1 = smoothstep(0.5, 0.62, fzN3(q * 0.016 + floor(t1) * 7.3)), m2 = smoothstep(0.54, 0.66, fzN3(q * 0.016 + floor(t2) * 5.1 + 30.));
  float vein = max((1. - smoothstep(vw, vw + px * 0.8, d1)) * m1, (1. - smoothstep(vw, vw + px * 0.8, d2)) * m2);
  c = mix(c, uVein, vein * 0.6 * veins);
  return mix(mix(c * 0.52, uSky * 0.4, 0.06), c, lit); }
vec3 fzLapis(vec3 q, float lit){ return fzLapisV(q, lit, 1.); }
`;
const STONE_FRAG = /* glsl */`
varying vec3 vW; varying vec2 vUv; varying float vPhi;
${GLSL_COMMON}
${GLSL_STONE}
void main(){
  vec4 t = texture2D(uPic, vUv);
  float e = 2. / ${CW}.;
  float h0 = fzH(t);
  float hz = (fzH(texture2D(uPic, vUv + vec2(e, 0.))) - h0) * ${(RELIEF * PXM / 2).toFixed(1)};
  float hx = (fzH(texture2D(uPic, vUv + vec2(0., e * ${(CW / CH).toFixed(4)}))) - h0) * ${(RELIEF * PXM / 2).toFixed(1)};
  float cp = cos(vPhi), sp = sin(vPhi);
  vec3 N = normalize(vec3(0., -cp, -sp) + hx * vec3(1., 0., 0.) - hz * vec3(0., sp, -cp));
  float nl = dot(N, uSunDir);
  float lit = smoothstep(-0.05, 0.09, nl);
  float cw = clamp(fwidth(t.a) * 0.8, 0.006, 0.03);
  lit *= 1. - smoothstep(0.052 - cw, 0.052 + cw, t.a);      // shade cast into the hollows, hard-edged, wherever the sun reaches (the sunward walls of the shaded flank too)
  float pz = fract(vUv.x) * ${PITCH}., psi = fract(vUv.x) * 6.2831853;
  float x = (vUv.y - 0.5) * ${WIDTH}.;
  vec3 q = vec3(x, cos(psi) * ${SEAL_R.toFixed(2)}, sin(psi) * ${SEAL_R.toFixed(2)});
  vec3 col = fzLapis(q, lit);
  // pyrite: thresholded cells; each catches the sun as its turn comes (a glint lasts seconds, eased)
  vec2 pc = vec2(x / 2.3, fract(vUv.x) * 220.); vec2 ci = floor(pc), cf = fract(pc) - 0.5;
  float hh = fzHash(ci + 3.7);
  vec2 off = (vec2(fzHash(ci + 11.), fzHash(ci + 23.)) - 0.5) * 0.5;
  float rad = 0.06 + 0.1 * fzHash(ci + 5.1), dd = length(cf - off), fp = fwidth(dd) + 0.01;
  float fleck = step(0.93, hh) * (1. - smoothstep(rad - fp, rad + fp, dd)) * (1. - smoothstep(0.12, 0.5, fwidth(pc.x)));
  float ang = vPhi + hh * 62.83 + uTime * 0.16;
  float gl = smoothstep(0.86, 0.985, cos(ang));
  col = mix(col, mix(uGold * (0.45 + 0.4 * lit), mix(uGold, uCream, 0.6), gl * (0.35 + 0.65 * lit)), fleck);
  // wet clay left in the hollows of the rising flank: ONE flat opaque clay tone with a cut edge. It fills a
  // hollow to the brim at the contact line, keeps only to the deep parts as the flank climbs, and slides down
  // and out (the edge creeps by a scrolling noise). Two tones by the sun, like all clay.
  float h = h0 * ${RELIEF}.;
  float creep = fzNoise(vec2(x * 0.16, pz * 0.16 - uTime * 0.45)) - 0.5 + 0.5 * (fzNoise(vec2(x * 0.5, pz * 0.5 - uTime * 0.9)) - 0.5);
  float lvlc = mix(0.55, 5.4, smoothstep(0.12, 2.5, vPhi + creep * 0.7)) + creep * 0.8;
  float mask = h - lvlc - hz * 0.9;                       // it hangs toward the lower lip of each hollow
  float fm = fwidth(mask) * 0.7 + 0.01;
  float clay = smoothstep(-fm, fm, mask) * step(0., vPhi) * (1. - step(3.2, vPhi));
  float fc = fwidth(vPhi) + 0.002;
  clay = max(clay, 1. - smoothstep(0.045 - fc, 0.045 + fc, vPhi + creep * 0.05));        // the smear along the contact line itself
  col = mix(col, fzShade(uTone[0], 1. - smoothstep(0.4, 0.6, lit)), clay);
  // ROUND SEVEN: in the figure field (never the river band or the rope by the rim) clay has dried in every hollow, so each
  // figure rides round the drum as its own crisp silhouette in two flat tones: leather clay, and the hard shade the
  // hollow's sunward wall throws into it (the same baked sweep as on the print)
  float ff = fwidth(h) * 0.7 + 0.03, fx = fwidth(x) + 0.05;
  float figm = smoothstep(0.9 - ff, 0.9 + ff, h) * smoothstep(-110. - fx, -110. + fx, x);
  col = mix(col, fzShade(uTone[1], 1. - smoothstep(0.4, 0.6, lit)), figm);
  gl_FragColor = vec4(fzHazed(col, vW), 1.);
}`;
const BORE_PROUD = 16, BORE_MOUTH = 11.5;      // the cord hole's collar: metres proud of the cap, radius of its mouth
const GOLD_FRAG = /* glsl */`
varying vec3 vL; varying vec3 vW; varying vec3 vN;
${GLSL_COMMON}
${GLSL_STONE}
uniform float uRoll;
void main(){
  vec3 N = vN; float ln = length(N); N = ln > 1e-5 ? N / ln : vec3(0., 1., 0.);
  // the granules catch the sun in their turn, like the pyrite: each of 26 sectors of each ring spreads its palest
  // tone for a second or so every eight (eased; the sectors are fixed in the cap, so it is the same turning or at rest)
  vec2 gp = vec2(vL.y - ${SEAL_R.toFixed(4)}, vL.z - uContact); float gr = length(gp), ga = atan(gp.y, gp.x + 1e-5) - uRoll;
  float gph = fzHash(vec2(floor(gr / 6.5), floor(fract(ga / 6.2831853) * 26.)) + 3.1);
  float glint = smoothstep(0.5, 1., sin(uTime * 0.8 + gph * 6.2831853)) * step(abs(vL.x), 176. + ${BORE_PROUD.toFixed(1)});
  #ifdef FZ_CAP
    glint = 0.;                 // the granules only: the flat of the cap keeps its tone
  #endif
  vec3 col = fzGold3g(N, glint);
  #ifdef FZ_CAP
    vec2 rp = vec2(vL.y - ${SEAL_R.toFixed(4)}, vL.z - uContact); float r = length(rp), fr = fwidth(r) + 0.03;
    float lit = smoothstep(-0.05, 0.09, dot(N, uSunDir));
    if (abs(N.x) > 0.8) {
      float k = (r - 18.) / 13.; float bandC = abs(fract(k) - 0.5) * 13.;     // granule rings at r 18, 31, 44, 57, 70
      float inlay = (1. - smoothstep(3.4 - fr, 3.4 + fr, bandC)) * step(18., r) * step(r, 80.2);
      float a = atan(rp.y, rp.x + 1e-5) - uRoll;
      vec3 lap = fzLapisV(vec3(r * cos(a), r * sin(a), 7.), lit, 0.);      // round eight: no calcite in the inlay (a vein cut by five gold rings read as a scratch across the cap)
      // pyrite in the inlay: each fleck catches the sun in its turn, slowly (a glint lasts seconds)
      vec2 pc = vec2(r * cos(a), r * sin(a)) / 1.9 + 40., ci = floor(pc); float hh = fzHash(ci + 3.7);
      float pd = length(fract(pc) - 0.5 - (vec2(fzHash(ci + 11.), fzHash(ci + 23.)) - 0.5) * 0.5), fp = fwidth(pd) + 0.01;
      float fleck = step(0.9, hh) * (1. - smoothstep(0.1 + 0.1 * fzHash(ci + 5.1) - fp, 0.1 + 0.1 * fzHash(ci + 5.1) + fp, pd)) * (1. - smoothstep(0.15, 0.6, fwidth(pc.x)));
      lap = mix(lap, mix(uGold * 0.7, mix(uGold, uCream, 0.6), smoothstep(0.8, 0.98, cos(hh * 62.83 + uTime * 0.5))), fleck);
      col = mix(col, lap, inlay);
      if (N.x > 0.) {                     // far cap: its granule rings are drawn, not built
        float rk = clamp(floor(k + 0.5), 0., 4.) * 13. + 18., n = floor(6.2832 * rk / 3.3);
        vec2 g = vec2(r - rk, (fract(a / 6.2832 * n) - 0.5) * 3.3);
        float gd = length(g), fg = fwidth(r) + 0.03;
        float dot1 = 1. - smoothstep(1.45 - fg, 1.45 + fg, gd);
        float hiS = 1. - smoothstep(0.7 - fg, 0.7 + fg, length(g - vec2(0.3, 0.)));
        col = mix(col, mix(uGold * 0.56, mix(uGold, uCream, 0.5), hiS), dot1);
      }
    }
    if (r < 7.6) col = fzLapis(vec3(vL.x, rp), 0.) * (0.55 + 0.45 * smoothstep(-170., -120., -abs(vL.x)));   // inside the bore
    float dp = clamp((-172. - vL.x) / ${BORE_PROUD.toFixed(1)}, 0., 1.), fd = fwidth(dp) * 1.2 + 0.003;        // inside the collar: 0 at the bottom, 1 at the mouth
    if (vL.x < -172.03 && r < ${(BORE_MOUTH + 0.2).toFixed(1)} && dot(N.yz, rp) < 0.) {      // the drill's wall inside the collar
      float sunl = smoothstep(-0.22, 0.22, -rp.x / max(r, 1e-3));                                       // the lower wall is in the sun, the upper in the lip's shade
      float tone = 0.5 + 0.24 * smoothstep(0.333 - fd, 0.333 + fd, dp) + 0.26 * smoothstep(0.667 - fd, 0.667 + fd, dp);   // three steps, darker toward the bottom
      col = fzLapisV(vec3(vL.x, rp), sunl, 0.) * tone;
      float dr = min(abs(dp - 0.333), abs(dp - 0.667)), wr = max(0.016, fd * 1.3);                      // a gold line where the drill stepped
      col = mix(col, uGold * (0.5 + 0.5 * sunl), (1. - smoothstep(wr - fd, wr + fd, dr)) * 0.9);
    }
  #endif
  gl_FragColor = vec4(fzHazed(col, vW), 1.);
}`;
const SKY_VERT = /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p; }`;
const SKY_FRAG = /* glsl */`varying vec3 vD; uniform vec3 uSky, uHaze, uSunDir, uSkyGlow, uTone[4]; uniform float uTime;
float skHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float skNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(skHash(i), skHash(i + vec2(1., 0.)), f.x), mix(skHash(i + vec2(0., 1.)), skHash(i + vec2(1., 1.)), f.x), f.y); }
void main(){ float l = length(vD); vec3 d = l > 1e-4 ? vD / l : vec3(0., 1., 0.);
  vec3 c = mix(uHaze, uSky, smoothstep(0.0, 0.5, d.y));
  vec2 s = uSunDir.xz; float sl = length(s); s = sl > 1e-4 ? s / sl : vec2(-1., 0.);
  float hl = length(d.xz); vec2 dh = hl > 1e-4 ? d.xz / hl : vec2(0., 1.); float side = dot(dh, s);
  float glow = smoothstep(0.1, 1., side) * (1. - smoothstep(0.02, 0.42, abs(d.y)));
  c = mix(c, uSkyGlow, glow * 0.75);
  // DUST DRAWN IN THE STYLE: flat banks of afternoon dust lying in strata over the plain, each one tone with a cut,
  // scalloped edge, drifting slowly downwind; darker and denser toward the ground
  float az = atan(dh.x, dh.y), el = d.y / max(hl, 0.05), fe = fwidth(el) * 1.2 + 1e-4;       // the seam of az lies astern (-Z), where no view looks
  vec3 dustA = mix(uHaze, uTone[1], 0.5), dustB = mix(uHaze, uTone[1], 0.26);
  for (int i = 0; i < 3; i++) {
    float fi = float(i), e0 = 0.05 + 0.075 * fi, th = 0.022 - 0.004 * fi;
    float q = az * (5. + 2. * fi) + uTime * (0.045 + 0.015 * fi) + fi * 3.7;
    float n = skNoise(vec2(q, fi * 7.3)) * 0.65 + skNoise(vec2(q * 2.7 + 5., fi * 3.1)) * 0.35;
    float w = th * (0.2 + 1.6 * n) * smoothstep(0.28, 0.5, skNoise(vec2(q * 0.31 + 9., fi)) + 0.25 * n);
    float dd = abs(el - e0 - 0.012 * sin(q * 0.7)) - w;
    c = mix(c, i == 0 ? dustA : dustB, (1. - smoothstep(-fe, fe, dd)) * (0.9 - 0.2 * fi));
  }
  // the low sun: a pale flat disc and one cut ring, the sun disc of the frieze itself
  float sd = acos(clamp(dot(d, normalize(uSunDir)), -1., 1.)), fs = fwidth(sd) + 1e-4;
  float disc = 1. - smoothstep(0.036 - fs, 0.036 + fs, sd), ring = (1. - smoothstep(0.004 - fs, 0.004 + fs, abs(sd - 0.062)));
  c = mix(c, mix(uSkyGlow, vec3(1.), 0.5), max(disc, 0.8 * ring));
  gl_FragColor = vec4(c, 1.); }`;
const DUST_VERT = /* glsl */`varying vec2 vUv; varying vec3 vW;
void main(){ vUv = uv; vec4 p = vec4(position, 1.);
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
  #endif
  vec4 wp = modelMatrix * p; vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const DUST_FRAG = /* glsl */`varying vec2 vUv; varying vec3 vW; uniform float uOpacity;
${GLSL_COMMON}
void main(){ float a = sin(clamp(vUv.y, 0., 1.) * 3.14159) * smoothstep(0., 0.12, vUv.x) * (1. - vUv.x);
  a *= 0.55 + 0.45 * fzNoise(vec2(vUv.x * 9. - uTime * 0.35, vUv.y * 3. + vW.x * 0.01));
  gl_FragColor = vec4(uHaze, clamp(a * uOpacity, 0., 1.)); }`;

// ---- the style -------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const rng = ctx.rng.fork('frieze-style');
  const stoneName = opts.stone || (rng() < 0.76 ? 'lapis' : rng.pick(['carnelian', 'serpentine']));
  const st = STONES[stoneName];
  const C = (h) => new THREE.Color(h);
  const palette = { wet: C(hex[0]), leather: C(hex[1]), bone: C(hex[2]), chalk: C(hex[3]), stone: C(st ? st[0] : hex[4]),
    gold: C(st ? st[2] : hex[5]), sky: C(hex[6]), cream: C(opts.cream || '#EDE4CF'), haze: C(opts.haze || opts.cream || '#EDE4CF'), glow: C(opts.glow || '#F8F2E2'), vein: C(st ? st[1] : '#E9EEF0'), stoneName };
  palette.shadeOf = (c) => { const o = new THREE.Color(), f = (v, k) => Math.pow(0.39 * Math.pow(Math.max(v, 0), 0.4545) + 0.08 * Math.pow(Math.max(k, 0), 0.4545), 2.2); return o.setRGB(f(c.r, palette.sky.r), f(c.g, palette.sky.g), f(c.b, palette.sky.b)); };
  if (opts.night) { if (st) { palette.stone.multiplyScalar(0.55); palette.gold.multiplyScalar(0.68); } palette.vein.multiplyScalar(0.62); }   // moonlight: nothing lamplit
  const elev = (opts.sunElevation ?? 12) * Math.PI / 180;
  const sunDir = new THREE.Vector3(-Math.cos(elev), Math.sin(elev), 0);

  // one picture, RGBA8: R height byte, B its residual (fzH() rebuilds 16-bit height), G shadow field.
  const pic = new THREE.DataTexture(null, CW, CH, THREE.RGBAFormat, THREE.UnsignedByteType);     // filled by picture()
  pic.wrapS = THREE.RepeatWrapping; pic.wrapT = THREE.ClampToEdgeWrapping;
  pic.magFilter = THREE.LinearFilter; pic.minFilter = THREE.LinearMipmapLinearFilter; pic.generateMipmaps = true;
  pic.anisotropy = 8;
  // the second roll only: the ghost's own cast shadow (the same sweep at half height), one byte a texel
  const pic2 = opts.ghost ? new THREE.DataTexture(null, CW, CH, THREE.RedFormat, THREE.UnsignedByteType) : null;
  if (pic2) { pic2.wrapS = THREE.RepeatWrapping; pic2.wrapT = THREE.ClampToEdgeWrapping; pic2.magFilter = THREE.LinearFilter; pic2.minFilter = THREE.LinearMipmapLinearFilter; pic2.generateMipmaps = true; pic2.anisotropy = 8; }

  const uniforms = {
    uTime: { value: 0 }, uContact: { value: -60 }, uFronts: { value: new THREE.Vector3(-230, -390, -680) },
    uOrigin: { value: new THREE.Vector3() }, uCamPos: { value: new THREE.Vector3(0, 30, -700) },
    uTone: { value: [palette.wet, palette.leather, palette.bone, palette.chalk] },
    uSky: { value: palette.sky }, uCream: { value: palette.cream }, uHaze: { value: palette.haze },
    uSunTan: { value: Math.tan(elev) }, uSunDir: { value: sunDir }, uPic: { value: pic }, uPic2: { value: pic2 },
    uTileZ: { value: -563 }, uStart: { value: -563 }, uRoll: { value: 0 },
    uWind: { value: opts.weather === 'breeze' ? 2 : 1 }, uRain: { value: opts.weather === 'rain' ? 1 : 0 }, uSkyGlow: { value: palette.glow },
    uPixel: { value: 0.0024 }, uStrLive: { value: 1 }, uInlay: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 0, 0)) },                      // radians a pixel subtends (update() keeps it from the drawing buffer)
    uGhost: { value: new THREE.Vector4(-5, -7.5, opts.ghost ? 1 : 0, -560) }, uStone: { value: palette.stone }, uVein: { value: palette.vein }, uGold: { value: palette.gold },
  };
  const U = (extra) => Object.assign({}, uniforms, extra || {});
  const mat = (vertexShader, fragmentShader, o = {}) => new THREE.ShaderMaterial(Object.assign({ uniforms: U(o.extra), vertexShader, fragmentShader }, o.props || {}));
  const materials = {
    clay: mat(CLAY_VERT, CLAY_FRAG, { extra: { uHole: { value: new THREE.Vector4() }, uHoleM: { value: 4 }, uCellF: { value: 0 } }, props: { defines: opts.ghost ? { FZ_GHOST: 1 } : {}, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: 2 } }),
    clayFree: mat(FREE_VERT, FREE_FRAG, { extra: { uDryBias: { value: 0 } }, props: { side: THREE.DoubleSide } }),
    plain: mat(PLAIN_VERT, PLAIN_FRAG, { props: { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 6 } }),
    stone: mat(STONE_VERT, STONE_FRAG),
    gold: mat(FREE_VERT, GOLD_FRAG),
    goldCap: mat(FREE_VERT, GOLD_FRAG, { props: { defines: { FZ_CAP: 1 } } }),
    sky: mat(SKY_VERT, SKY_FRAG, { props: { side: THREE.BackSide, depthWrite: false, depthTest: false } }),
    dust: mat(DUST_VERT, DUST_FRAG, { extra: { uOpacity: { value: 0.5 } }, props: { transparent: true, depthWrite: false, side: THREE.DoubleSide } }),
  };
  // a clay material pinned to one dryness whatever the lines do (bias in metres: +2000 = always wet)
  materials.clayFreeBiased = (bias) => { const m = materials.clayFree.clone(); m.uniforms = U({ uDryBias: { value: bias } }); return m; };

  const cast = opts.creature === undefined ? null : opts.creature < 0.5 ? 'ibex' : opts.creature < 0.75 ? 'oryx' : 'stag';
  const style = { cast, palette, uniforms, materials, sunDir, glsl: { common: GLSL_COMMON, surface: GLSL_SURF, stone: GLSL_STONE }, data: null, height: null, pic, pic2, figures: null, repeats: 1, contactZ: -60, rollAngle: 0, progress: null };

  // seal axis (course z) as a function of u only
  style.sealZ = (u) => { const t = 42 * u; if (t <= 27) return -300 + 10 * t; const k = clamp((t - 27) / 9, 0, 1); return -30 + 30 * (1 - (1 - k) * (1 - k) * (1 - k)); };
  const dzCell = PITCH / 201;
  style.setProgress = (u, demo = false) => {
    style.progress = u; if (!demo) style.driven = true;
    const zc = style.sealZ(u), zv = -300 + 420 * u;
    style.contactZ = zc; style.rollAngle = (zc + 300) / SEAL_R;
    uniforms.uContact.value = zc; uniforms.uRoll.value = style.rollAngle;
    // round five: the wet line comes to within 205 m of the seal's resting place and then only creeps, so the title
    // view keeps a dark satin stretch at the drum's foot (wet, leather, bone, chalk in clear steps down the band)
    const zw = zv - 190 < -205 ? zv - 190 : -205 + 0.15 * (zv - 190 + 205);
    // and as the seal slows the two older lines close up behind it (140 and 200 m nearer by the time it rests), so the
    // band behind the stopped seal steps through all four values within the first repeat and a half
    const late = smoothstep(0.7, 0.86, u);
    uniforms.uFronts.value.set(Math.min(zw, zc - 12), Math.min(zv - 660 + 140 * late, zc - 24), Math.min(zv - 840 + 200 * late, zc - 36));   // round four: all three lines cross the journey
    const tz = Math.ceil(zc / dzCell) * dzCell - PITCH;           // tiles stay on one lattice: no swimming
    uniforms.uTileZ.value = tz; uniforms.uStart.value = tz - (style.repeats - 1) * PITCH;
  };
  const _v = new THREE.Vector3();
  let skyMesh = null; const rings = [];
  const _sz = new THREE.Vector2();
  style.update = (dt, time, camera, object) => {
    uniforms.uTime.value = time;
    if (camera && ctx.renderer) uniforms.uPixel.value = 2 / Math.max(1, camera.projectionMatrix.elements[5] * ctx.renderer.getDrawingBufferSize(_sz).y);
    if (camera) { uniforms.uCamPos.value.setFromMatrixPosition(camera.matrixWorld); if (skyMesh) { skyMesh.position.copy(uniforms.uCamPos.value); if (skyMesh.parent) skyMesh.parent.worldToLocal(skyMesh.position); } }
    if (object) { object.updateWorldMatrix(true, false); uniforms.uOrigin.value.setFromMatrixPosition(object.matrixWorld); }
    if (camera) for (const r of rings) {                   // fine patches ride under and ahead of the lens, each on its own lattice
      const e = camera.matrixWorld.elements, c = r.u.value.z * 2, fl = Math.hypot(e[8], e[10]) || 1;
      const px = uniforms.uCamPos.value.x - uniforms.uOrigin.value.x - e[8] / fl * r.ahead, pz = uniforms.uCamPos.value.z - uniforms.uOrigin.value.z - e[10] / fl * r.ahead;
      r.u.value.x = Math.round(px / c) * c; r.u.value.y = Math.round(pz / c) * c;
    }
  };
  style.makeSky = (radius = 2600) => {
    skyMesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 12), materials.sky);
    skyMesh.renderOrder = -0.5; skyMesh.frustumCulled = false; return skyMesh;
  };
  // fine ground under the lens: `levels` nested square patches of n x n cells (cell, 2 cell, ...), each
  // snapped to its own lattice and cut out of the next coarser one. Returns the meshes (n*n*2 triangles each).
  style.makeNearPatches = (levels = 2, n = 144, cell = 0.7) => {
    // the grid written straight into typed arrays (PlaneGeometry builds it by pushing to lists: one 20 ms step)
    const geo = new THREE.BufferGeometry(), n1 = n + 1, gp = new Float32Array(n1 * n1 * 3), gi = new Uint32Array(n * n * 6);
    for (let j = 0, k = 0; j < n1; j++) for (let i = 0; i < n1; i++) { gp[k++] = i - n / 2; gp[k++] = 0; gp[k++] = j - n / 2; }
    for (let j = 0, k = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * n1 + i, b = a + 1, c = a + n1, d = c + 1; gi[k++] = a; gi[k++] = c; gi[k++] = b; gi[k++] = b; gi[k++] = c; gi[k++] = d; }
    geo.setAttribute('position', new THREE.BufferAttribute(gp, 3)); geo.setIndex(new THREE.BufferAttribute(gi, 1));
    const meshes = []; let prev = null;
    for (let l = 0; l < levels; l++) {
      const c = cell * (1 << l), half = n * c / 2, uP = { value: new THREE.Vector4(0, -1e5, c, half) };
      const m = mat(CLAY_VERT, CLAY_FRAG, { extra: { uPatch: uP, uHole: { value: prev ? prev.value : new THREE.Vector4() }, uHoleM: { value: c * 2 }, uCellF: { value: (Math.max(0.85 * c, 1.3) + c - 0.1) / 1.35 } },
        props: { defines: opts.ghost ? { FZ_PATCH: 1, FZ_GHOST: 1 } : { FZ_PATCH: 1 }, polygonOffset: l > 0, polygonOffsetFactor: 0, polygonOffsetUnits: l } });
      const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; meshes.push(mesh);
      rings.push({ u: uP, ahead: half * 0.62 }); prev = uP;
    }
    materials.clay.uniforms.uHole.value = prev.value;
    return meshes;
  };
  // curled plates over the long-dry ground: count instances scattered in course rect [x0,x1] x [z0,z1].
  // They only show behind the long-dry line and loop on uTime (ambient, not a scripted moment).
  style.makePlates = (count, x0, x1, z0, z1, prng = rng, all = 0, loft = 1, big = false) => {
    const g = new THREE.InstancedBufferGeometry(), b = new THREE.PlaneGeometry(1, 1, 2, 2); b.rotateX(-Math.PI / 2);
    const pa = b.attributes.position; for (let i = 0; i < pa.count; i++) if (Math.abs(pa.getX(i)) > 0.4 || Math.abs(pa.getZ(i)) > 0.4) pa.setXYZ(i, pa.getX(i) * (0.75 + prng() * 0.5), 0, pa.getZ(i) * (0.75 + prng() * 0.5));
    g.setAttribute('position', pa); g.setIndex(b.index);
    const arr = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) { arr[i * 4] = lerp(x0, x1, prng()); arr[i * 4 + 1] = lerp(z0, z1, prng()); arr[i * 4 + 2] = 2.2 + prng() * prng() * 5; arr[i * 4 + 3] = prng(); }
    g.setAttribute('aPlate', new THREE.InstancedBufferAttribute(arr, 4)); g.instanceCount = count;
    const mesh = new THREE.Mesh(g, mat(PLATE_VERT, FREE_FRAG, { extra: { uDryBias: { value: all ? -4000 : 0 }, uPlateAll: { value: all }, uLoft: { value: loft }, uPlateRate: { value: big ? 2.2 : 1 } }, props: { side: THREE.DoubleSide, defines: big ? { FZ_PLATE_BIG: 1 } : {} } }));
    mesh.frustumCulled = false; return mesh;
  };
  // the shade those plates throw: a second mesh on the same instances, flattened onto the ground down-sun. Draw it
  // before the plates (renderOrder) so a plate lying on its own shade covers it.
  style.makePlateShade = (plates, bed = false) => {
    const u = plates.material.uniforms;
    const m = new THREE.Mesh(plates.geometry, mat(PLATE_VERT, PLATE_SHADE_FRAG, { extra: { uPlateAll: u.uPlateAll, uLoft: u.uLoft, uPlateRate: u.uPlateRate },
      props: { side: THREE.DoubleSide, defines: Object.assign({}, plates.material.defines, bed ? { FZ_PLATE_BED: 1 } : { FZ_PLATE_SHADE: 1 }), polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: bed ? -1 : -2 } }));
    m.frustumCulled = false; return m;
  };
  // printed ground: `repeats` tiles of 503 m, 2.5 m cells (finer toward the river side), kept behind the contact line by setProgress
  style.friezeGeometry = (repeats = 1, cellsX = 136, cellsZ = 201) => {
    style.repeats = repeats;
    const g = new THREE.InstancedBufferGeometry(), nx = cellsX + 1, nz = cellsZ + 1;
    const pos = new Float32Array(nx * nz * 3), idx = new Uint32Array(cellsX * cellsZ * 6);
    for (let j = 0, k = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const t = i / cellsX; pos[k++] = t < 0.37 ? -170 + (t / 0.37) * 70 : t < 0.66 ? -100 + ((t - 0.37) / 0.29) * 100 : ((t - 0.66) / 0.34) * 170; pos[k++] = 0; pos[k++] = (j / cellsZ) * PITCH; }
    for (let j = 0, k = 0; j < cellsZ; j++) for (let i = 0; i < cellsX; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setAttribute('aTile', new THREE.InstancedBufferAttribute(Float32Array.from({ length: repeats }, (_, i) => i), 1));
    g.instanceCount = repeats;
    style.setProgress(style.progress ?? 0.6, true);
    return g;
  };
  // seal drum: position = (x, phi, 0); wrapped and sunk in STONE_VERT
  style.sealGeometry = (cellsX = 136, cellsA = 176) => {
    const g = new THREE.BufferGeometry(), nx = cellsX + 1, na = cellsA + 1;
    const pos = new Float32Array(nx * na * 3), idx = new Uint32Array(cellsX * cellsA * 6);
    for (let j = 0, k = 0; j < na; j++) for (let i = 0; i < nx; i++) { pos[k++] = -WIDTH / 2 + (i / cellsX) * WIDTH; pos[k++] = (j / cellsA) * Math.PI * 2; pos[k++] = 0; }
    for (let j = 0, k = 0; j < cellsA; j++) for (let i = 0; i < cellsX; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  };
  style.heightAt = (x, z) => {
    const i = ((Math.round((z + SEAM0) * PXM) % CW) + CW) % CW, j = clamp(Math.round((x + WIDTH / 2) * PXM), 0, CH - 1);
    return style.height ? style.height[j * CW + i] / 255 * RELIEF : 0;
  };
  let picPromise = null;
  style.picture = () => (picPromise ||= drawPicture(ctx, style, rng.fork('picture')));
  style.setProgress(0.6, true);
  return style;
}

// ---- the picture: one height field, three tools ------------------------------------------------------
// Tools are stamped as a max into a float array (4 px per metre), so they never pile up and nothing is
// quantised. Coordinates: p = [pz, x] in metres, pz 0..503 from the seam along the course, x -170..170
// (figures stand on x -113, heads toward +x). Heights are in 0..255 units = 0..5 m.
async function drawPicture(ctx, style, rng) {
  await ctx.yield();
  const H = style.height = new Float32Array(CW * CH);
  await ctx.yield();
  style.data = style.pic.image.data = new Uint8Array(CW * CH * 4);
  await ctx.yield();
  const lut = (fn) => { const a = new Float32Array(258); for (let k = 0; k < 258; k++) a[k] = fn(Math.min(1, Math.sqrt(k / 256))); return a; };
  const LB = lut((r) => Math.sqrt(1 - r * r) * (1 - 0.13 * Math.exp(-((r - 0.62) ** 2) / 0.004)));   // ball drill, one tool ring
  const LW = lut((r) => Math.min(1, (1 - r) / 0.42));                                                // wheel: flat crest, chamfered flanks
  const LG = lut((r) => Math.pow(Math.cos(r * Math.PI / 2), 0.8));                                   // graver: shallow swelling
  // THE LOADER'S RULE: no tool cuts when it is called. Every stamp is queued (the rng draws stay in the callers, in
  // their old order) and flush() works the queue off a few at a time with a yield between, so no step of the build
  // can come near the limit however busy the machine is. Stamps are a max, so their order cannot matter.
  const Q = [];
  const flush = async () => { for (let i = 0; i < Q.length; i++) { Q[i](); if (i % 3 === 2) await ctx.yield(); } Q.length = 0; await ctx.yield(); };
  const disc = (L, pz, x, rad, h) => {
    const cx = pz * PXM, cy = (x + WIDTH / 2) * PXM, r = rad * PXM, r2 = r * r, k = 256 / r2, amp = h * 255;
    const y0 = Math.max(0, Math.ceil(cy - r)), y1 = Math.min(CH - 1, Math.floor(cy + r));
    for (let y = y0; y <= y1; y++) {
      const dy = y - cy, dy2 = dy * dy, w = Math.sqrt(Math.max(0, r2 - dy2)), row = y * CW;
      for (let xx = Math.ceil(cx - w), x1 = Math.floor(cx + w); xx <= x1; xx++) {
        const dx = xx - cx, v = amp * L[((dx * dx + dy2) * k) | 0], i = row + (xx < 0 ? xx + CW : xx >= CW ? xx - CW : xx);
        if (v > H[i]) H[i] = v;
      }
    }
  };
  const ball = (p, rad, h = 1) => { const a = p[0], b = p[1]; Q.push(() => disc(LB, a, b, rad, h)); };
  // wheel-cut: a straight ridge tapering in width (w0 -> w1 metres) and height
  // It is cut as ONE pass of the wheel (the distance to the stroke's axis, not a row of stamps), so the crest
  // is flat, the chamfers are ruled straight and the shade down its flanks is one clean line.
  const wheel = (p0, p1, w0, w1 = w0, h0 = 0.8, h1 = h0) => { const a = [p0[0], p0[1]], b = [p1[0], p1[1]]; Q.push(() => wheelNow(a, b, w0, w1, h0, h1)); };
  const wheelNow = (p0, p1, w0, w1, h0, h1) => {
    const ax = p0[0] * PXM, ay = (p0[1] + WIDTH / 2) * PXM, bx = p1[0] * PXM, by = (p1[1] + WIDTH / 2) * PXM;
    const dx = bx - ax, dy = by - ay, l2 = Math.max(dx * dx + dy * dy, 1e-6), r0 = w0 / 2 * PXM, r1 = w1 / 2 * PXM, rm = Math.max(r0, r1);
    const y0 = Math.max(0, Math.ceil(Math.min(ay, by) - rm)), y1 = Math.min(CH - 1, Math.floor(Math.max(ay, by) + rm));
    const x0 = Math.ceil(Math.min(ax, bx) - rm), x1 = Math.floor(Math.max(ax, bx) + rm);
    for (let y = y0; y <= y1; y++) {
      const py = y - ay, row = y * CW;
      for (let xx = x0; xx <= x1; xx++) {
        const px = xx - ax; let t = (px * dx + py * dy) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex = px - t * dx, ey = py - t * dy, r = r0 + (r1 - r0) * t, q = (ex * ex + ey * ey) / (r * r);
        if (q >= 1) continue;
        const v = (h0 + (h1 - h0) * t) * 255 * LW[(q * 256) | 0], i = row + (xx < 0 ? xx + CW : xx >= CW ? xx - CW : xx);
        if (v > H[i]) H[i] = v;
      }
    }
  };
  // a swept wheel-cut through several points (Catmull-Rom), taper over the whole length
  const sweep = (pts, w0, w1, h0 = 0.8, h1 = h0) => {
    const P = (i) => pts[clamp(i, 0, pts.length - 1)], segs = pts.length - 1;
    for (let s = 0; s < segs; s++) {
      const a = P(s - 1), b = P(s), c = P(s + 1), d = P(s + 2);
      const len = Math.hypot(c[0] - b[0], c[1] - b[1]), n = Math.max(2, Math.ceil(len * PXM / Math.max(0.25, Math.min(w0, w1) * PXM * 0.024)));
      const f = (i, t, t2, t3) => 0.5 * (2 * b[i] + (c[i] - a[i]) * t + (2 * a[i] - 5 * b[i] + 4 * c[i] - d[i]) * t2 + (3 * b[i] - a[i] - 3 * c[i] + d[i]) * t3);
      const nk = n + (s === segs - 1 ? 1 : 0);
      for (let k0 = 0; k0 < nk; k0 += 48) Q.push(() => {        // a few dozen stamps to a step (the loader's rule)
        for (let k = k0; k < Math.min(nk, k0 + 48); k++) { const t = k / n, t2 = t * t, t3 = t2 * t, T = (s + t) / segs; disc(LW, f(0, t, t2, t3), f(1, t, t2, t3), lerp(w0, w1, T) / 2, lerp(h0, h1, T)); }
      });
    }
  };
  // graver: an oval swelling, semi-axes la x lb metres, turned by rot
  const graver = (p, la, lb, rot, h) => { const a = [p[0], p[1]]; Q.push(() => graverNow(a, la, lb, rot, h)); };
  const graverNow = (p, la, lb, rot, h) => {
    const cx = p[0] * PXM, cy = (p[1] + WIDTH / 2) * PXM, A = la * PXM, B = lb * PXM, m = Math.max(A, B), co = Math.cos(rot), si = Math.sin(rot), amp = h * 255;
    for (let y = Math.max(0, Math.ceil(cy - m)), y1 = Math.min(CH - 1, Math.floor(cy + m)); y <= y1; y++) {
      const dy = y - cy, row = y * CW;
      for (let xx = Math.ceil(cx - m), x1 = Math.floor(cx + m); xx <= x1; xx++) {
        const dx = xx - cx, u = (dx * co + dy * si) / A, w = (dy * co - dx * si) / B, d2 = u * u + w * w;
        if (d2 >= 1) continue;
        const v = amp * LG[(d2 * 256) | 0], i = row + (xx < 0 ? xx + CW : xx >= CW ? xx - CW : xx);
        if (v > H[i]) H[i] = v;
      }
    }
  };
  // a figure frame: a along the course (times dir), b up from the ground line x = -113
  const frame = (z0, dir = 1, s = 1, base = -113) => { const F = (a, b) => [z0 + dir * a * s, base + b * s]; F.s = s; F.dir = dir; F.rot = (th) => Math.atan2(Math.sin(th), dir * Math.cos(th)); return F; };
  const J = (v) => (rng() - 0.5) * 2 * v;
  const tools = { ball, wheel, sweep, graver, frame, J, rng, disc: (L, pz, x, rad, h) => { Q.push(() => disc(L, pz, x, rad, h)); }, LW };
  const fig = { pitch: PITCH, seam0: SEAM0 };

  for (const side of [-1, 1]) for (let k = 0; k < 21; k += 3) { drawBorders(tools, fig, side, k, k + 3); await flush(); }
  const river = drawRiver(tools, fig); for (let i = 0; i < 6; i++) { river(i); await flush(); }
  const cast = style.cast;                          // the seed's cast: ibex, bull, palm | oryx, lion, palm | stag, lion, reeds
  (cast === 'stag' ? drawReeds : drawPalm)(tools, fig, 60 + J(4)); await flush();
  const zM = 236 + J(3), reach = 99 + J(2), hornRoll = rng() < 0.72 ? 0 : 1, hornStyle = cast === 'stag' ? 2 : cast === 'oryx' ? 1 : cast === 'ibex' ? 0 : hornRoll;
  drawIbex(tools, fig, zM - reach, 1, true, hornStyle); await flush();
  drawMountain(tools, fig, zM); await flush();
  drawIbex(tools, fig, zM + reach, -1, false, hornStyle); await flush();
  const zB = 430 + J(4);
  drawBull(tools, fig, zB, cast === 'stag' || cast === 'oryx'); await flush();
  drawSun(tools, fig, zB + 27); await flush();                    // (the bird on the bull's back is cut, as the brief says)
  for (let k = 0; k < 6; k++) { drawFile(tools, fig, k); await flush(); }
  drawFillers(tools, fig); await flush();

  // strip edges fall to zero; then the sun's horizon sweep along x gives the cast-shadow field, and the pack
  const data = style.data;
  for (let j = 0; j < 14; j++) { const f = Math.max(0, (j - 2) / 11); for (const o of [j * CW, (CH - 1 - j) * CW]) for (let i = 0; i < CW; i++) H[o + i] *= f; }
  await ctx.yield();
  const decS = style.uniforms.uSunTan.value * (255 / RELIEF) / PXM, dec = decS * 0.7, hor = new Float32Array(CW), hol = new Float32Array(CW).fill(-1e3);
  for (let j = 0; j < CH; j++) {
    for (let i = 0, o = j * CW, q = o * 4; i < CW; i++, q += 4) {
      const h = H[o + i]; let sdw = hor[i] - dec; if (sdw < h) sdw = h; hor[i] = sdw;
      const r = (h + 0.5) | 0, v = (sdw - h) * 1.25;       // gentle gain: the mask ramps over a whole chamfer, so its edge is a ruled line, never texel stairs
      let sh2 = hol[i] - decS; if (sh2 < -h) sh2 = -h; hol[i] = sh2; const v2 = (sh2 + h) * 1.25;        // the same sun inside the seal's hollows
      data[q] = r; data[q + 1] = v > 255 ? 255 : v; data[q + 2] = (h - r + 0.5) * 255; data[q + 3] = v2 > 255 ? 255 : v2;
    }
    if (j % 24 === 23) await ctx.yield();
  }
  style.pic.needsUpdate = true;
  if (style.pic2) {                 // the ghost's shadow: heights halved, the same sun; 255 = 2 m of horizon over the ghost
    await ctx.yield();
    const d2 = style.pic2.image.data = new Uint8Array(CW * CH); hor.fill(0);
    for (let j = 0; j < CH; j++) {
      for (let i = 0, o = j * CW; i < CW; i++) {
        const h = H[o + i] * 0.5; let sdw = hor[i] - dec; if (sdw < h) sdw = h; hor[i] = sdw;
        const v = (sdw - h) * 2.5; d2[o + i] = v > 255 ? 255 : v;
      }
      if (j % 24 === 23) await ctx.yield();
    }
    style.pic2.needsUpdate = true;
  }
  // ROUND SEVEN, the seal-cutter's two other stuffs set into the print: a gold disc in the sun's boss and in the heart
  // of a star or rosette, a lapis eye in every beast (uInlay: picture z, x, radius, 1 gold | 2 lapis; CLAY_FRAG)
  { const I = style.uniforms.uInlay.value; let n = 0; const set = (p, r, k) => { if (p && n < I.length) I[n++].set(p[0], p[1], r, k); };
    set(fig.sun && fig.sun.at, 11.4, 1);
    for (const ib of fig.ibex || []) set(ib.head, 2.5, 2);
    set(fig.bull && fig.bull.eye, 2.2, 2);
    for (const f of fig.file || []) set([f.at[0] + 32.49, f.at[1] + 24.48], 2, 2);
    for (const f of fig.fillers || []) if (f.kind === 'star' || f.kind === 'rosette') set(f.at, f.kind === 'star' ? 3.7 : 5.5, 1);
    for (const t of (fig.mountain && fig.mountain.tips) || []) set(t, 2.6, 1); }      // the fruit of the tree on the peak, gold
  fig.toCourse = (pz, k = 0) => pz - SEAM0 - k * PITCH;      // course z of picture z in the k-th repeat behind z 446
  style.figures = fig;
  return style.pic;
}

// rope borders (12 m wide, twist pitch 24 m, out of step by 1.5 m at the seam), the seam's hairline ridge
function drawBorders(T, fig, side, k0 = 0, k1 = 21) {
  const { wheel, sweep, J } = T, pitch = (PITCH + 1.5) / 21, lerp = (a, b, t) => a + (b - a) * t;
  {
    const x0 = side * 166.2, x1 = side * 160.2;
    for (let k = k0; k < k1; k++) {
      // one strand of the twist: an S laid across the border from its outer edge to its inner, fat in the middle
      // and tapering to both ends, so every strand stands clear of the next with a groove of shade between
      const z = 3 + k * pitch + J(0.5), w = 6.3 + J(0.4), n = 150;
      for (let i = 0; i <= n; i++) {
        const t = i / n, sn = Math.sin(Math.PI * t), cx = (x0 + x1) / 2 + (x0 - x1) * 0.73 * Math.cos(Math.PI * t);
        T.disc(T.LW, z + t * 26, cx, (2.7 + (w + 0.7 - 2.7) * sn) / 2, 0.78 * (0.5 + 0.5 * Math.sqrt(sn)));
      }
    }
    if (k1 === 21) wheel([0, side * 156.3], [PITCH, side * 156.3], 1.3, 1.3, 0.3);       // the cap's edge line inside the rope
  }
  if (side > 0 || k1 < 21) return;
  const pts = []; for (let i = 0; i <= 12; i++) pts.push([0.4 + J(0.5), -154 + i * 25.6]);
  sweep(pts, 1.5, 1.5, 0.16, 0.16);                                        // the seam: one hairline each turn
  fig.rope = { pitch, width: 12 };
}

// river band, x -158..-113: wheel-cut ridges running with the course, and fish at least 45 m apart
function drawRiver(T, fig) {
  const { ball, wheel, sweep, graver, J, rng } = T, lanes = 5, x0 = -151.5, dx = 8.4, waves = 6;
  const ph = [], amp = [];
  for (let i = 0; i < lanes; i++) { ph.push(rng() * 6.283); amp.push(1.6 + rng() * 1.1); }
  const xr = (i, z) => x0 + i * dx + amp[i] * Math.sin(z / PITCH * 6.2832 * waves + ph[i]) + 0.7 * Math.sin(z / PITCH * 6.2832 * 17 + ph[i] * 3);
  const hgts = []; for (let i = 0; i < lanes; i++) hgts.push(0.34 + rng() * 0.1);
  fig.fish = [];
  const fishes = () => {
  const n = 7, step = PITCH / n;
    for (let k = 0; k < n; k++) {
      const lane = (k * 2 + 1) % (lanes - 1), z = 26 + k * step + J(7), x = (xr(lane, z) + xr(lane + 1, z)) / 2, L = 18;
      graver([z, x], L * 0.42, 2.5, 0, 0.62);                                             // body
      ball([z + L * 0.27, x + 0.55], 0.75, 0.95);                                        // eye
      wheel([z - L * 0.36, x], [z - L * 0.5, x + 2.3], 1.5, 0.7, 0.6, 0.45);             // tail, two cuts
      wheel([z - L * 0.36, x], [z - L * 0.5, x - 2.3], 1.5, 0.7, 0.6, 0.45);
      wheel([z + L * 0.02, x + 2.0], [z - L * 0.1, x + 3.3], 1.1, 0.6, 0.5, 0.4);        // fin
      fig.fish.push([z, x]);
    }
  };
  fig.river = { x0: -158, x1: -113 };
  return (i) => {                       // one lane per call, then the fish: lets the caller yield between
    if (i >= lanes) return fishes();
    const hgt = hgts[i], pts = [];
    for (let z = 0; z <= PITCH + 0.01; z += PITCH / 96) pts.push([z, xr(i, z)]);
    sweep(pts, 2.6, 2.6, hgt, hgt);
  };
}

// date palm, 150 m root to crown: wheel-cut trunk with drilled scars, nine tapering fronds, two date clusters
function drawPalm(T, fig, z0) {
  const { ball, wheel, sweep, frame, J, rng } = T, F = frame(z0, 1, 1);
  const lean = J(3), top = 97 + J(3);
  ball(F(0, 3), 8.5, 0.8); ball(F(-9, 2.5), 4, 0.7); ball(F(9, 2.5), 4, 0.7);          // root bole
  wheel(F(0, 4), F(lean, top), 12.5, 7.5, 0.72, 0.8);
  for (let b = 12, k = 0; b < top - 6; b += 7.2, k++) {                                // leaf scars, drilled either side
    const t = b / top, s = k % 2 ? 1 : -1; ball(F(lean * t + s * (2.3 - t * 0.8), b), 1.9 - t * 0.5, 1);
  }
  const crown = [lean, top + 1];
  ball(F(crown[0], crown[1]), 6.2, 1);
  for (let i = 0; i < 9; i++) {
    const a = (i - 4) / 4 * 1.42 + J(0.04), len = 52 - Math.abs(i - 4) * 2.2 + J(2), droop = Math.sign(a) * (0.25 + Math.abs(a) * 0.3);
    const pts = [];
    for (let k = 0; k <= 4; k++) { const t = k / 4, aa = a + droop * t * t, r = len * t; pts.push(F(crown[0] + Math.sin(aa) * r, crown[1] + Math.cos(aa) * r * (i === 4 ? 1 : 1.0))); }
    sweep(pts, 5.4, 1.3, 0.95, 0.6);
  }
  fig.dates = [];
  for (const s of [-1, 1]) {                                                             // date clusters: drilled balls 2.5 m across
    const c = [crown[0] + s * (15 + J(1.5)), crown[1] - 15 + J(1.5)];
    wheel(F(crown[0] + s * 3, crown[1] - 3), F(c[0], c[1] + 6), 2.2, 1.4, 0.7, 0.6);
    for (let r = 0, w = 1; r < 5; r++) { w = [2, 3, 3, 2, 1][r]; for (let q = 0; q < w; q++) ball(F(c[0] + (q - (w - 1) / 2) * 2.6, c[1] + 5 - r * 2.3), 1.3, 1); }
    fig.dates.push(F(c[0], c[1]));
  }
  fig.palm = { z: z0, root: F(0, 0), crown: F(crown[0], crown[1]) };
}

// reed clump in the palm's place (the stag's country): seven wheel-cut stems, a drilled head and two leaf cuts on each
function drawReeds(T, fig, z0) {
  const { ball, wheel, frame, J } = T, F = frame(z0, 1, 1);
  ball(F(0, 3), 8, 0.8); ball(F(-8, 2.5), 4, 0.7); ball(F(8, 2.5), 4, 0.7);
  const tips = [];
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) / 3 * 0.44 + J(0.03), len = 142 - Math.abs(i - 3) * 9 + J(4), tip = [Math.sin(a) * len, 4 + Math.cos(a) * len];
    wheel(F(Math.sin(a) * 4, 5), F(tip[0], tip[1]), 5.6, 2.4, 0.9, 0.72);
    for (let k = 0; k < 4; k++) ball(F(Math.sin(a) * (len - 2 - k * 4.4), 4 + Math.cos(a) * (len - 2 - k * 4.4)), 3.3 - k * 0.3, 1);       // the head: four drill holes
    for (const [t, sgn] of [[0.34, 1], [0.58, -1]]) { const b = [Math.sin(a) * len * t, 4 + Math.cos(a) * len * t], aa = a + sgn * 0.5; wheel(F(b[0], b[1]), F(b[0] + Math.sin(aa) * 19, b[1] + Math.cos(aa) * 19), 3.4, 1.1, 0.8, 0.55); }
    tips.push(F(tip[0], tip[1]));
  }
  fig.dates = [tips[1], tips[5]];
  fig.palm = { z: z0, root: F(0, 0), crown: tips[3] };
}

// rearing ibex, 120 m hoof to horn tip, forelegs on the mountain: balls for joints, wheel-cuts for limbs
// and horn, one graver swelling for the body. slip: the lower foreleg's cut runs on through its knee ball and 16 m out the far side.
function drawIbex(T, fig, z0, dir, slip, hornStyle) {
  const { ball, wheel, sweep, graver, frame, J } = T, F = frame(z0, dir, 1), P = (p) => F(p[0], p[1]);
  const hip = [3 + J(1), 29 + J(1)], sh = [31 + J(1), 77 + J(1)];
  const th = Math.atan2(sh[1] - hip[1], sh[0] - hip[0]);
  graver(F((hip[0] + sh[0]) / 2 + 1.5, (hip[1] + sh[1]) / 2 - 1), 35, 13, F.rot(th), 0.64);
  ball(P(hip), 10.5, 0.84); ball(P(sh), 9.5, 0.84);
  const hocks = [[-7 + J(1), 15], [9 + J(1), 14.5]], hooves = [[-2, 2.4], [15, 2.4]];
  for (let i = 0; i < 2; i++) {
    wheel(P(hip), P(hocks[i]), 6.4, 4.2, 0.8); wheel(P(hocks[i]), P(hooves[i]), 3.8, 3, 0.8);
    ball(P(hocks[i]), 3.3, 1); ball(P(hooves[i]), 3.2, 1);
  }
  // round eight: the slipped foreleg's knee hangs BELOW its hoof (a sharp bend, 80 degrees), so the cut that ran on
  // through the knee ball goes out into open ground under the belly, clear of both upper legs, and can be read
  const knees = [slip ? [49 + J(1), 52 + J(1)] : [49 + J(1), 69 + J(1)], [50 + J(1), 87 + J(1)]], fh = [[61, 58], [69, 80.5]];
  for (let i = 0; i < 2; i++) {
    wheel(P(sh), P(knees[i]), 5.6, 3.8, 0.8);
    let k = knees[i];
    if (slip && i === 0) {                         // the cutter's wheel ran on: 16 m past the joint, one tapering stroke
      const dx = k[0] - fh[i][0], dy = k[1] - fh[i][1], l = Math.hypot(dx, dy);
      k = [k[0] + dx / l * 16, k[1] + dy / l * 16]; fig.slip = P(knees[i]); fig.slipTip = P(k);
      wheel(P(knees[i]), P(k), 3.4, 0.9, 0.8, 0.66);         // one tapering stroke, joined to the leg through the ball
    }
    wheel(P(fh[i]), P(knees[i]), 3, 3.4, 0.8);
    ball(P(knees[i]), 4.3, 1); ball(P(fh[i]), 3.1, 1);
  }
  const head = [38 + J(1), 100 + J(0.8)];
  wheel(F(sh[0] + 1, sh[1] + 4), P(head), 10, 6.6, 0.78);
  ball(P(head), 6.4, 0.94);
  wheel(F(head[0] + 3, head[1] - 1), F(head[0] + 13, head[1] - 5.5), 5.2, 3.3, 0.86);
  ball(F(head[0] + 13.6, head[1] - 5.8), 2.2, 1);                                    // muzzle
  wheel(F(head[0] - 4, head[1] + 2.5), F(head[0] - 11.5, head[1] - 0.5), 2.8, 1.2, 0.72);   // ear
  wheel(F(head[0] + 8, head[1] - 6.5), F(head[0] + 6.5, head[1] - 14), 2.3, 1, 0.7);        // beard
  if (hornStyle === 0) {
    const c = 1 + J(0.08), hp = [[head[0] - 1, head[1] + 5], [head[0] - 7 * c, head[1] + 16], [head[0] - 21 * c, head[1] + 19.6], [head[0] - 36 * c, head[1] + 11], [head[0] - 44 * c, head[1] - 3]];
    sweep(hp.map(P), 5.6, 1.7, 0.96, 0.7);
    for (let i = 1; i < 8; i++) { const t = i / 8.5, a = 0.25 + t * 2.4, r = 21.5; ball(F(head[0] - 21 * c + Math.cos(a + 0.35) * -r * c * -1 * 1.0, head[1] - 2 + Math.sin(a + 0.35) * r * 1.03), 1.9 - t * 0.7, 1); }
  } else if (hornStyle === 2) {                 // stag: a swept beam and five wheel-cut tines, a drilled point on each
    const beam = [[head[0] - 1, head[1] + 5], [head[0] - 9, head[1] + 17], [head[0] - 23, head[1] + 25], [head[0] - 39, head[1] + 27]];
    sweep(beam.map(P), 5, 2, 0.96, 0.75);
    const tines = [[-3, 9, 9, 12], [-10, 18, 5, 14], [-18, 22.5, 3, 13], [-27, 26, 0, 12], [-36, 27, -5, 9]];
    for (const [a, b, da, db] of tines) { const tip = F(head[0] + a + da + J(0.8), head[1] + b + db + J(0.8)); wheel(F(head[0] + a, head[1] + b), tip, 3.2, 1.3, 0.9, 0.7); ball(tip, 1.5, 1); }
  } else {
    wheel(F(head[0] - 1, head[1] + 5), F(head[0] - 30, head[1] + 20), 4.4, 1.4, 0.95, 0.7);
    wheel(F(head[0] - 3, head[1] + 3.5), F(head[0] - 33, head[1] + 13), 3.6, 1.2, 0.85, 0.6);
  }
  wheel(F(hip[0] - 8, hip[1] + 6), F(hip[0] - 14.5, hip[1] + 13), 3.2, 1.4, 0.76);         // tail
  (fig.ibex ||= []).push({ z: z0, dir, hooves: P(hooves[0]), head: P(head) });
}

// the mountain, 110 m long and 140 m tall: drilled scales 16 m across, a three-branched tree on the peak
function drawMountain(T, fig, zc) {
  const { ball, wheel, frame, J } = T, F = frame(zc, 1, 1), rows = 10, step = 11.6;
  for (let k = 0; k < rows; k++) {
    const b = 9 + k * step, hw = 47 * Math.pow(1 - k / (rows - 0.4), 0.82), n = Math.max(1, Math.round((2 * hw) / 14.6) + 1);
    for (let q = 0; q < n; q++) ball(F(n === 1 ? 0 : (q / (n - 1) - 0.5) * 2 * hw + J(0.5), b + J(0.4)), 8, 1);
  }
  const top = 9 + (rows - 1) * step + 7;
  wheel(F(0, top), F(0, top + 10), 3.4, 2.6, 0.85);
  const tips = [];
  for (const s of [-1, 0, 1]) { const tip = F(s * (6.5 + J(0.6)), top + 17 + (s === 0 ? 2 : 0)); wheel(F(0, top + 9), tip, 2.4, 1.4, 0.8, 0.7); ball(tip, 2.1, 1); tips.push(tip); }
  fig.mountain = { z: zc, peak: F(0, top + 19), tips };
}

// striding humped bull, 90 m long. The eye's drill hole sits off-centre: the hand's fault, every turn.
function drawBull(T, fig, zc, lion = false) {
  const { ball, wheel, sweep, graver, frame, J } = T, F = frame(zc - 6, 1, 0.9), P = (p) => F(p[0], p[1]);
  graver(F(-2, 35), 33, 14.5, F.rot(0.05), 0.66);
  if (!lion) ball(F(17, 50), 10.5, 0.86);                                            // hump
  ball(F(-25, 37), 10, 0.82); ball(F(21, 32), 9.5, 0.82);                            // haunch, shoulder
  const legs = [[[22, 27], [31 + J(1), 14.5], [35, 2.6]], [[19, 27], [14 + J(1), 14], [9, 2.6]], [[-23, 28], [-15 + J(1), 14], [-11, 2.6]], [[-26, 28], [-33 + J(1), 14.5], [-39, 2.6]]];
  for (const [a, k, h] of legs) { wheel(P(a), P(k), 6.2, 4.2, 0.8); wheel(P(k), P(h), 3.8, 3.1, 0.8); ball(P(k), 3.3, 1); ball(P(h), 3.4, 1); }
  wheel(F(27, 42), F(40, 41), 12, 9, 0.76);                                          // neck
  const head = [43, 40];
  ball(P(head), 7.4, 0.9);
  wheel(F(46, 37), F(53, 30.5), 6.2, 4.4, 0.84); ball(F(53.8, 29.6), 2.6, 1);        // muzzle
  ball(F(head[0] + 3.4, head[1] + 3.6), 1.7, 1);                                     // the eye, off-centre
  if (lion) {                                                                        // striding lion: a drilled mane, a raised tail
    for (let i = 0; i < 9; i++) { const a = 0.5 + i / 8 * 3.5; ball(F(36 + Math.cos(a) * 11.5, 41.5 + Math.sin(a) * 11.5), 3.3, 0.98); }
    for (let i = 0; i < 5; i++) { const a = 1.0 + i / 4 * 2.4; ball(F(31 + Math.cos(a) * 17, 41 + Math.sin(a) * 15), 2.6, 0.92); }
    ball(F(39.5, 46.5), 2.1, 1);                                                     // ear
    sweep([F(-34, 42), F(-45, 47), F(-53, 58), F(-49, 69), F(-41, 71)], 2.8, 1.8, 0.82, 0.74); ball(F(-39, 70.5), 3, 1);   // tail and tuft
  } else {
    sweep([F(40, 46), F(42, 55), F(50, 60), F(58, 57)], 3.6, 1.3, 0.95, 0.75);       // horn, a crescent
    wheel(F(38, 44), F(31, 47.5), 2.8, 1.3, 0.72);                                   // ear
    sweep([F(-34, 42), F(-41, 36), F(-43, 24), F(-42, 13)], 2.6, 1.6, 0.8, 0.7); ball(F(-42, 10.5), 2.7, 1);   // tail and tuft
  }
  fig.bull = { z: zc, eye: F(head[0] + 3.4, head[1] + 3.6) };
}

// the sun disc above the bull: one deep drill hole, a ring of twelve small ones, eight wheel-cut rays
function drawSun(T, fig, z0) {
  const { ball, wheel } = T, c = [z0, 2];
  ball(c, 12.5, 1);
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; ball([c[0] + Math.cos(a) * 18.5, c[1] + Math.sin(a) * 18.5], 2.8, 0.95); }
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * 6.2832; wheel([c[0] + Math.cos(a) * 23.5, c[1] + Math.sin(a) * 23.5], [c[0] + Math.cos(a) * 35.5, c[1] + Math.sin(a) * 35.5], 5.4, 1.6, 0.92, 0.6); }
  fig.sun = { at: c };
}

// the upper register: a file of six walking beasts to the turn, going with the seal (no figures of people: the
// brief's rule). Each is 70 m long and stands 85 m to its horn tips: a graver's body, drilled haunch, shoulder,
// knees and hooves, wheel-cut limbs and neck; by turns a goat with a swept horn, a gazelle with two straight
// horns and a ram with a drilled curl. The stride differs a little beast to beast.
function drawFile(T, fig, k) {
  const { ball, wheel, sweep, graver, frame, J, rng } = T;
  if (fig.fileShift === undefined) { fig.fileShift = Math.floor(rng() * 3); fig.file = []; }
  const z0 = 44 + k * PITCH / 6 + J(1.5), G = frame(z0, 1, 0.9, 44), P = (p) => G(p[0], p[1]), v = (k + fig.fileShift) % 3, st = J(2.2);
  graver(G(-1, 45), 29, 12.5, G.rot(0.04), 0.7);                                      // body
  ball(G(-20, 46), 9.6, 0.84); ball(G(18, 47), 9.8, 0.84);                            // haunch, shoulder
  const legs = [[[19, 40], [25 + st, 22.5], [21 + st * 1.6, 3.4]], [[15, 40], [9 - st, 21.5], [12 - st * 1.5, 3.4]],
    [[-18, 40], [-11 + st, 22], [-15 + st * 1.6, 3.4]], [[-22, 40], [-29 - st, 22.5], [-25 - st * 1.5, 3.4]]];
  for (const [a, kn, h] of legs) { wheel(P(a), P(kn), 5.8, 4.2, 0.8); wheel(P(kn), P(h), 3.8, 3.1, 0.8); ball(P(kn), 3.2, 1); ball(P(h), 3.4, 1); }
  wheel(G(22, 52), G(32, 67), 10, 6.6, 0.78);                                         // neck
  const head = [34.5, 70];
  ball(P(head), 6.4, 0.92);
  wheel(G(38, 69), G(45.5, 63.5), 5.4, 3.4, 0.84); ball(G(46.3, 62.9), 2.3, 1);       // muzzle
  ball(G(head[0] + 1.6, head[1] + 2.2), 1.5, 1);                                      // eye
  wheel(G(31.5, 74), G(25.5, 78.5), 2.8, 1.3, 0.74);                                  // ear
  sweep([G(-28, 50), G(-34.5, 47), G(-36.5, 39)], 2.6, 1.5, 0.8, 0.68);               // tail
  if (v === 0) sweep([G(35, 75.5), G(32, 87), G(23, 93), G(13, 90), G(8, 82)], 3.4, 1.3, 0.92, 0.7);          // goat: one swept horn
  else if (v === 1) { wheel(G(35.5, 75.5), G(39.5, 95), 3, 1.2, 0.9, 0.65); wheel(G(33, 75.5), G(29, 94), 3, 1.2, 0.9, 0.65); }   // gazelle
  else { const pts = []; for (let i = 0; i <= 8; i++) { const a = 1.9 - i / 8 * 4.6, r = 9.5 - i * 0.55; pts.push(G(27.5 + Math.cos(a) * r, 76 + Math.sin(a) * r)); }
    sweep(pts, 3.6, 1.6, 0.92, 0.74); ball(G(27.5, 76), 2.4, 1); }                    // ram: a curl round a drilled boss
  fig.file.push({ at: G(0, 45), kind: v });
}

// field fillers above the figures, as seal-cutters set them: star, rosette, crescent, seven dots; one wavy
// wheel-cut under the far rope. Their places are fixed, which motif sits where is the seed's.
function drawFillers(T, fig) {
  const { ball, wheel, sweep, J, rng } = T;
  const motifs = {
    star: (z, x) => { ball([z, x], 4.2, 1); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832 + 0.2, l = i % 2 ? 11 : 17; wheel([z + Math.cos(a) * 3, x + Math.sin(a) * 3], [z + Math.cos(a) * l, x + Math.sin(a) * l], 4, 1.3, 0.9, 0.6); } },
    rosette: (z, x) => { ball([z, x], 6.2, 1); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; ball([z + Math.cos(a) * 12.6, x + Math.sin(a) * 12.6], 4.4, 0.95); } },
    crescent: (z, x) => { for (const sgn of [-1, 1]) { const pts = []; for (let k = 0; k <= 5; k++) { const a = -1.5708 + sgn * k / 5 * 1.85; pts.push([z + Math.cos(a) * 13, x + Math.sin(a) * 13 + 4]); } sweep(pts, 6.4, 1.4, 0.92, 0.6); } },
    dots: (z, x) => { for (let i = 0; i < 7; i++) ball([z + (i < 4 ? (i - 1.5) * 9 : (i - 5) * 9), x + (i < 4 ? 4.2 : -4.2)], 3.9, 1); },
  };
  const slots = [[100, -72], [367, -30], [24, -72]];
  const names = rng.shuffle(['star', 'rosette', 'crescent', 'dots']);
  fig.fillers = slots.map(([z, x], i) => { const p = [z + J(3), x + J(3)]; motifs[names[i]](p[0], p[1]); return { kind: names[i], at: p }; });
  // the far border inside the rope: a row of drilled rosettes (a ball and six round it), 21 to the turn
  for (let k = 0; k < 21; k++) { const z = 12 + k * PITCH / 21, x = 149.5; ball([z, x], 2.6, 0.95); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.2832 + 0.3; ball([z + Math.cos(a) * 5.1, x + Math.sin(a) * 5.1], 2.2, 0.9); } }
  wheel([0, 140.5], [PITCH, 140.5], 1.5, 1.5, 0.34);
  wheel([0, 42], [PITCH, 42], 2.2, 2.2, 0.4);                                    // the register line the men walk on
}

// clay strings between the fresh print and the rising drum: stretched with the gap, snapped, drawn back
const STRING_VERT = /* glsl */`
attribute vec3 aStr;      // x along the seal, phase 0..1, snap point 0..1
uniform float uStrLive;   // 1 while the seal rolls, 0 at rest (every thread has parted and drawn back by then)
varying vec3 vW; varying float vShade;
${GLSL_COMMON}
void main(){
  // round eight: a thread is drawn out for 50 m of the seal's travel (the gap it spans grows to 17 m), fixed where it
  // stands on the print; it necks, parts between 35 and 50 m and each half draws back to its own end
  float ph = fract(aStr.y + uContact / 50.);
  float d = 4. + ph * 50.;                                    // metres behind the contact line
  float zc = uContact - d;
  float ground = fzH(textureLod(uPic, fzPicUv(vec2(aStr.x, zc)), 0.)) * ${RELIEF}.;
  float gap = ${SEAL_R.toFixed(2)} - sqrt(max(${(SEAL_R * SEAL_R).toFixed(1)} - d * d, 1.));    // the drum's own rise at that distance
  float top = ground + gap + 0.3;
  float t = position.y;                                       // 0 at the print, 1 at the drum
  float snap = 0.45 + 0.5 * aStr.z;
  float cut = step(snap, ph);                                 // parted: each half draws back to its own end and is gone
  float back = clamp((ph - snap) * 7., 0., 1.) * cut;
  float tt = mix(t, t < 0.5 ? t * (1. - back) : 1. - (1. - t) * (1. - back), cut);
  float mid = 1. - abs(2. * t - 1.);                          // 0 at the two roots, 1 in the middle
  float thin = mix(1., 0.16, mid * (0.4 + 0.6 * clamp(ph / snap, 0., 1.)));        // it necks as it stretches
  float wdt = (1.1 + 0.7 * fract(aStr.z * 7.3)) * mix(thin, 1. - 0.75 * mid, cut) * (1. - back) * uStrLive * smoothstep(0., 0.04, ph);
  vec3 L = vec3(aStr.x, mix(ground - 0.2, top, tt), zc - sin(t * 3.14159) * 0.5 * (1. - cut));
  float px = length((modelMatrix * vec4(L, 1.)).xyz - uCamPos) * uPixel;
  wdt = max(wdt, px * mix(3.6, 1.8, mid) * step(0.02, wdt));  // never under a pixel and a half, and still thicker at the roots
  L.x += position.x * wdt;
  vec4 wp = modelMatrix * vec4(L, 1.);
  vW = wp.xyz; vShade = 0.35 + 0.65 * t;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const STRING_FRAG = /* glsl */`
varying vec3 vW; varying float vShade;
${GLSL_COMMON}
// round eight: a thread of wet clay drawn out in the sun that shines along the gap: the wet tone with its satin streak
// of sky cream (the palest thing under the drum, so it shows against the dark), in shade only in its last metre under the stone
void main(){ gl_FragColor = vec4(fzHazed(mix(min(uTone[0] + uCream * 0.4, vec3(1.)), fzShade(uTone[0], 1.), step(0.93, vShade)), vW), 1.); }`;

// ---- the hero ----------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts);
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const rng = ctx.rng.fork('frieze-hero');
  const root = new THREE.Group(); root.name = 'frieze-without-end';
  const M = style.materials, R = SEAL_R;
  await style.picture();
  await ctx.yield();

  if (opts.sky !== false) root.add(style.makeSky());
  await ctx.yield();
  let plain = null;
  if (opts.plain !== false) {
    plain = new THREE.Mesh(new THREE.PlaneGeometry(7000, 7000), M.plain);
    plain.rotation.x = -Math.PI / 2; plain.position.set(0, 0, -300); plain.frustumCulled = false; root.add(plain);
  }
  await ctx.yield();
  const frieze = new THREE.Mesh(style.friezeGeometry(opts.repeats ?? 1), M.clay); frieze.frustumCulled = false; root.add(frieze);
  await ctx.yield();
  const wantPatch = opts.nearPatch ?? 0;
  if (wantPatch) for (const m of style.makeNearPatches(wantPatch === true ? 2 : wantPatch, Math.round(72 * (0.5 + 0.5 * detail)) * 2)) { root.add(m); await ctx.yield(); }
  await ctx.yield();
  const seal = new THREE.Mesh(style.sealGeometry(), M.stone); seal.frustumCulled = false; root.add(seal);
  await ctx.yield();

  // caps: one mesh that turns with the seal. Near cap (x -172): gold disc with the 14 m bore; far cap drawn.
  const parts = [];
  const disc = (x, rIn, face) => { const g = rIn > 0 ? new THREE.RingGeometry(rIn, R + 0.7, 96, 1) : new THREE.CircleGeometry(R + 0.7, 96); g.rotateY(face * Math.PI / 2); g.translate(x, 0, 0); return g; };
  const band = (x0, x1, r, seg = 96) => { const g = new THREE.CylinderGeometry(r, r, Math.abs(x1 - x0), seg, 1, true); g.rotateZ(Math.PI / 2); g.translate((x0 + x1) / 2, 0, 0); return g; };
  parts.push(disc(-172, 7, -1), band(-172, -169.6, R + 0.7), disc(172, 0, 1), band(169.6, 172, R + 0.7));
  parts.push(band(-172, -112, 7, 48));
  const end = new THREE.CircleGeometry(7, 32); end.rotateY(-Math.PI / 2); end.translate(-112, 0, 0); parts.push(end);
  // THE CORD HOLE HAS A COLLAR AND A DEPTH. A gold collar stands 16 m proud of the near cap about the hole, part of the
  // caps' own mesh, so it turns with the seal as they do; its rim carries the 44 granules. Inside it the drill's wall
  // goes down to the 14 m hole in lapis, 23 m across at the mouth and 15 m at the bottom. The sun comes in over the
  // upper lip: the lower wall is lit, the upper in shade, and the wall is a tone darker at each of the drill's three
  // steps toward the bottom (GOLD_FRAG). The hole itself stands where it stood, at the bottom of the collar.
  { const cone = (xa, ra, xb, rb, inward) => { const g = new THREE.CylinderGeometry(ra, rb, xb - xa, 72, 1, true); g.rotateZ(Math.PI / 2); g.translate((xa + xb) / 2, 0, 0);
      if (inward) { const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i)); } return g; };
    const rim = new THREE.RingGeometry(BORE_MOUTH, BORE_MOUTH + 2.4, 72, 1); rim.rotateY(-Math.PI / 2); rim.translate(-172 - BORE_PROUD, 0, 0);
    parts.push(cone(-172 - BORE_PROUD, BORE_MOUTH, -172, 7.5, true), rim, cone(-172 - BORE_PROUD, BORE_MOUTH + 2.4, -172, BORE_MOUTH + 4.5, false)); }
  const caps = new THREE.Mesh(mergeGeometries(parts.map((g) => g.index ? g.toNonIndexed() : g)), M.goldCap);
  M.goldCap.side = THREE.DoubleSide; caps.frustumCulled = false; root.add(caps);
  await ctx.yield();

  // granulation: five rings of 3 m granules, a rim ring, and the bore collar of 44 at 1.2 m
  const rings = [[18, 1.5], [31, 1.5], [44, 1.5], [57, 1.5], [70, 1.5], [79.3, 1.1], [BORE_MOUTH + 1.2, 0.6, -172 - BORE_PROUD]];      // the 44 stand on the collar's rim
  const spots = [];
  for (const [r, s, gx = -172] of rings) {
    const n = s === 0.6 ? 44 : Math.floor((2 * Math.PI * r) / (s * 2.1)), a0 = rng() * 6.283;
    for (let i = 0; i < n; i++) spots.push([r, a0 + (i / n) * 6.2832, s, gx]);
  }
  // two meshes: the rings we pass closest (collar and the two inner rings) are rounder
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2), v = new THREE.Vector3(), sc = new THREE.Vector3();
  for (const inner of [true, false]) {
    const set = spots.filter(([r]) => (r < 35) === inner), fine = inner && detail >= 0.8;
    const gran = new THREE.InstancedMesh(new THREE.SphereGeometry(1, fine ? 12 : 8, fine ? 4 : 3, 0, Math.PI * 2, 0, Math.PI / 2), M.gold, set.length);
    set.forEach(([r, a, s, gx], i) => { gran.setMatrixAt(i, m4.compose(v.set(gx, r * Math.cos(a), r * Math.sin(a)), q, sc.set(s, s * 0.85, s))); });
    gran.frustumCulled = false; caps.add(gran);
  }
  await ctx.yield();

  // bow waves: wet clay squeezed out sideways at each end as a lumpy roll of four fat folds, the highest riding
  // against the cap, each a rounded bead of its own (creases where they meet); they slump when the seal stops
  // and trail behind into the rope border. Analytic round sections, so the sun's two tones and the satin streak
  // draw every fold.
  const bowParts = [], FOLDS = [[176.6, 4.9, 6.1], [183.4, 3.1, 4.3], [188.7, 1.9, 3.1], [192.8, 1.0, 2.1]];
  // round four: every fold is a fat sausage with BLUNT ends (a half ball at each, never a point): the first fold
  // reaches furthest ahead and trails furthest behind, each further one is shorter, so the ends lie stepped
  for (const side of [-1, 1]) {
    for (let f = 0; f < FOLDS.length; f++) {
      const [a0, c0, r0] = FOLDS[f], nz = 46, na = 12, pos = [], idx = [], p1 = rng() * 6.283, p2 = rng() * 6.283, p3 = rng() * 6.283;
      const zb = -56 + f * 7, zf = 36 - f * 6.5, capR = r0 * 1.25, er = 0.62;       // back end, front end, length of the round end, its girth
      for (let j = 0; j <= nz; j++) {
        const s = j / nz, z = zb + (zf - zb) * (0.5 - 0.5 * Math.cos(Math.PI * s));  // rings crowd toward the two ends
        const e = Math.min(1, Math.min(z - zb, zf - z) / capR), round = Math.sqrt(Math.max(0, 1 - (1 - e) * (1 - e)));
        const env = (er + (1 - er) * smoothstep(zb + 6, zb + 46, z)) * (1 - (1 - er) * smoothstep(zf - 30, zf - 4, z));
        const lump = 1 + 0.13 * Math.sin(z * 0.2 + p1) + 0.06 * Math.sin(z * 0.47 + p2), k = env * lump;
        const a = 172.4 + (a0 - 172.4) * smoothstep(0, 0.75, k) * (0.6 + 0.4 * k) + 0.5 * Math.sin(z * 0.17 + p3) * k, c = c0 * k, r = Math.max(r0 * k * round, 0.02);
        const th0 = -Math.asin(Math.min(1, c0 / r0)) - 0.15, th1 = Math.PI - th0;
        for (let i = 0; i <= na; i++) {
          const th = lerp(th0, th1, i / na);
          pos.push(side * Math.max(172.4, a + r * Math.cos(th)), c * (0.35 + 0.65 * round) + r * Math.sin(th) - 0.3, z);
        }
      }
      for (let j = 0; j < nz; j++) for (let i = 0; i < na; i++) { const a = j * (na + 1) + i, b = a + 1, c = a + na + 1, d = c + 1; if (side < 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); bowParts.push(g);
    }
    await ctx.yield();
  }
  const bow = new THREE.Mesh(mergeGeometries(bowParts), M.clayFreeBiased(3000)); bow.frustumCulled = false; bow.position.y = 0.02; root.add(bow);

  // clay strings along the trailing contact line
  const nStr = Math.round(30 * detail), sg = new THREE.InstancedBufferGeometry();
  { const pos = [], idx = [], seg = 8;
    for (let j = 0; j <= seg; j++) pos.push(-0.5, j / seg, 0, 0.5, j / seg, 0);
    for (let j = 0; j < seg; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setIndex(idx);
    const arr = new Float32Array(nStr * 3);
    for (let i = 0; i < nStr; i++) { const x = rng.range(-168, 168); arr[i * 3] = i % 5 < 3 ? -112 + (x + 168) / 336 * 112 : x; arr[i * 3 + 1] = rng(); arr[i * 3 + 2] = rng.range(0.35, 0.95); }      // round eight: three in five are gathered over the lower register on the river side, where the low views look
    sg.setAttribute('aStr', new THREE.InstancedBufferAttribute(arr, 3)); sg.instanceCount = nStr; }
  const strings = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: style.uniforms, vertexShader: STRING_VERT, fragmentShader: STRING_FRAG, side: THREE.DoubleSide }));
  strings.frustumCulled = false; root.add(strings);
  // SIXTY MORE THREADS stand along the whole contact line, from rope to rope (x -166 to 166): a lot of their own beside
  // the thirty above, on the same strip and the same material, so each is drawn out, necks and parts by the seal's own
  // travel as those do. They are dealt from a stream of their own, named here and nowhere else.
  { const nStr2 = Math.round(60 * detail), sg2 = new THREE.InstancedBufferGeometry(), tr = makeRng('frieze-without-end:threads:' + (ctx.seed ?? 0));
    sg2.setAttribute('position', sg.attributes.position); sg2.setIndex(sg.index);
    const arr = new Float32Array(nStr2 * 3);
    for (let i = 0; i < nStr2; i++) { arr[i * 3] = tr.range(-166, 166); arr[i * 3 + 1] = tr(); arr[i * 3 + 2] = tr.range(0.35, 0.95); }
    sg2.setAttribute('aStr', new THREE.InstancedBufferAttribute(arr, 3)); sg2.instanceCount = nStr2;
    const more = new THREE.Mesh(sg2, strings.material); more.frustumCulled = false; root.add(more); }
  await ctx.yield();

  const place = () => {
    const zc = style.contactZ, u = style.progress ?? 0.6;
    caps.position.set(0, R, zc); caps.rotation.x = style.rollAngle;
    const speed = (style.sealZ(u + 0.004) - style.sealZ(u - 0.004)) / (0.008 * 42);
    bow.position.z = zc; bow.scale.y = 0.42 + 0.58 * clamp(speed / 10, 0, 1);
    style.uniforms.uStrLive.value = clamp(speed / 2.5, 0, 1);
  };
  place();
  await ctx.yield();
  const fig = style.figures, k3 = [1, 2, 3];
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V(-172, R, 0), facing: V(-1, 0, 0), radius: 7 },      // upright circle on the bore, seal at rest
    bore: { position: V(-172, R, 0), direction: V(1, 0, 0), radius: 7, depth: 60 },
    capCentre: V(-172, R, 0),
    flyThrough: [[-150, 30, -1000], [-150, 30, -880], [-110, 26, -670], [-150, 22, -500], [-120, 14, -350], [-165, 13, -200], [-250, 36, -130], [-310, 66, -70], [-290, 78, -22], [-240, R, 0], [-172, R, 0]].map((p) => V(...p)),
    viewpoints: { entry: V(-150, 30, -1000), flank: V(-120, 14, -350), rope: V(-165, 13, -200), cap: V(-310, 66, -70) },
    slip: k3.map((k) => V(fig.slip[1], 4, fig.toCourse(fig.slip[0], k))),          // the overshot foreleg in repeats 1..3 behind the rest
    seams: [-SEAM0, -SEAM0 - PITCH, -SEAM0 - 2 * PITCH],
    sealAxisAt: (u) => V(0, R, style.sealZ(u)),
    figures: fig,
  };
  return {
    object: root, radius: 190, height: 160, center: V(0, 70, -60), anchors, style, ground: false, groundY: 0,
    setProgress(u) { style.setProgress(u); place(); },
    update(dt, time, camera) {
      if (!style.driven) style.setProgress(0.52 + 0.4 * ((time / 70) % 1), true);    // viewer only: a slow demo roll
      place();
      style.update(dt, time, camera, root);
    },
    dispose() { for (const k in M) M[k].dispose?.(); style.pic.dispose(); style.pic2?.dispose(); },
  };
}
