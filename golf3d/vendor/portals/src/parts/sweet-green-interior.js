// Hero set piece of the world "sweet-green-interior": the mandacaru, a smooth leaf-green cactus 127 m tall
// (trunk 22 m thick, some 20 arms that leave the trunk level and turn straight up), buttons, bud arms, pink egg
// fruit, roosting macaws, a pink cube house at its foot and, on the crown, one great flower whose yellow
// disc holds the exit ring.
//
// HOW THE STYLE IS MADE (and what the world coder shades everything else with)
//   One unlit ShaderMaterial, gradeMaterial({ mode }). colour = sgGrade(aMid, aBase, aRim, t): one pigment per
//   surface, turning from its broad chalky middle (pigment + at most 40 percent cream) through the pigment itself to its dark
//   rim (pigment + its dark partner): no light, no shadow, no outline, no fog, no texture. Run it under
//   post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }.
//   THE GRADE TURNS TOWARD THE EYE. It reads only the eye's PLACE (the built-in cameraPosition: the direction
//   from the surface point to the eye, and for a dome the eye's bearing on the map). It never reads the lens's
//   direction or the gaze, so it is the same on either ride and with the steady camera, and nothing else in
//   this file reads the eye at all: no body is placed, moved, hidden, sized or timed by where the eye is or looks.
//   THE PIXEL'S FOOTPRINT (fwidth: it changes with the resolution, the lens's field and the distance) is read by
//   drawn marks only, never by a body: the spacing of the brush ridges (sgRidge) and, on a scallop hill, the fade
//   of its plots and of their rows of plants into the hill's plain grade (sgQuilt). The world's sky and railway
//   read it for the sun's soft edge and for the rails and sleepers. Each derivative is taken once, outside any branch.
//   THE ROUTE'S METRES FLOWN move the burst of macaws at the fork and the petals (setClimb, setFlower): both are
//   given as shares of the climb line by the world and are laid out here in metres of that line.
//   t per mode (uniform uMode, set by the factory; attribute aG carries the baked datum):
//     mode 0 TUBE / BALL  aG = the form's own axis, unit length on a tube, fading to 0 on a round cap, 0 on a
//                         ball. t = distance across the form as the eye sees it (0 middle, 1 silhouette).
//     mode 1 DOME         aG = (x/R, 0, z/R) on the map, 0 on the crown, 1 at the foot; the pale centre shifts
//                         up to a quarter of the radius toward the eye's bearing (instance origin = dome centre).
//                         aG.y = 1 marks a tall dome (a hill), graded by height as well: pale crown, dark foot.
//     mode 2 FLAT FACE    aG = offset from the face's middle over its half size (|aG| reaches 1 at the edge,
//                         in the face's plane, any orientation); shifted a tenth toward the eye.
//   attributes: aMid, aBase, aRim (vec3 linear colour, per vertex via paint() or per instance via
//   paintInstances()), aG (vec3, per vertex; every builder below bakes it),
//   uv.x = metres across the form. Brush ridges run along the form's length, near or far: their
//   spacing is taken from the pixel's footprint (5 to 10 pixels, two octaves cross-faded), 5 to 7 percent deep;
//   the derivative is taken once, outside any branch.
//     mode 3 HEAP         aG.y = height in the form (-1 foot .. 1 top): flat pale above, one darker under-band along
//                         the foot, the same from every side (clouds, puffs). It reads nothing but the form.
//   gradeMaterial({ ground: true }) is the ground's variant: it takes the PAINTED SHADOWS (SHADOW_GLSL: one map of
//   the valley laid at build by the world, plus cloud and wagon shadows as numbers), a deeper tint of the ground's own
//   pigment cooled a little with the sky's blue. Shadows read the place (world x, z) and the sun's one direction
//   only, never the eye. gradeMaterial({ quilt: true }) makes a tall dome a SCALLOP HILL: one smooth dome, pale crown and
//   deep rim, with a round crown plot and two rings of six big plots lapped on it like fish scales (the lower ring turned
//   half a plot; each plot pale at its upper middle and darker toward its own lower edge), thin contour rows of small
//   round plants on about half of the plots (never under two pixels across), all in the dome's own map; a hill's far edge
//   darkens where it turns away from the eye's place (the grade's own rule, as on a tube).
//   A tube keeps its two darkest steps at BOTH true silhouettes however far the pale middle has walked (sgTube).
//   ramp: five seen steps; the pale band is the inner half of the form, the darkening is in the outer half. The pale middle sits a little off centre
//   and that offset walks slowly on the clock (STYLE.uTime), so the modelling drifts even when the eye is at rest.
//
// EXPORTS
//   PALETTE                 the brief's seven pigments (sky blue, leaf green, deep green, sugar pink, hot
//                           yellow, red earth, cream), the default of opts.palette.
//   makePigments(palette)   -> { blue, green, greenDark, greenPale, deep, pink, yellow, earth, cream } each
//                           { mid, rim } THREE.Color (linear) by the style's mixing rule; .mix(a, b, k) too.
//   STYLE                   shared uniforms { uTime, uBand, uOff }: set STYLE.uTime.value at every update
//                           (the hero's update() does it), pass the same object to every material.
//   GRADE_GLSL              fragment chunk: sgRamp(t), sgGrade(mid, base, rim, t), sgTube(...), sgRidge(...): for a
//                           sky, a pond or any special material that must grade the same way.
//   SHADOW_GLSL             fragment chunk: sgShadow(world xz) and its uniforms, for a special ground material.
//   gradeMaterial(o)        the material. o.mode 0|1|2|3, o.ground, o.quilt (fixed at build), o.side, o.vertexPre (GLSL run on pos, nrm, g before the
//                           transform: wings, rocking), o.uniforms (extra), o.vertexDecl (extra declarations).
//   tubeGeometry / ballGeometry / lensGeometry / boxFaceGeometry   builders that bake aG and uv for each mode.
//   paint(geometry, pig)    writes aMid / aBase / aRim per vertex from a pigment; paintInstances(geometry, n,
//                           pig | pig[]) writes them per instance. Merge painted geometries freely: one mesh
//                           can carry many pigments (the macaw is one geometry: blue, yellow, deep green).
//   planCactus, planDetails pure arithmetic (where every arm, bud, fruit, roost and the flower stands); the
//                           print-only clearance check runs them in node. _debug.hero: the last hero built.
//   buildHero(ctx, opts)    the piece.
//
// buildHero opts: sunDir or pickSun (optional, see the flower), palette (7 hex), detail 0.6..1 (thins buttons, bud arms, birds), turn +1|-1 (hand of the
//   climb; +1 passes the trunk on the eye's left when arriving from +Z), flowers (how many arm tips carry a small flower as well as
//   the great one; default 12).
//   THE BOUQUET: every small flower faces one place on the climb's line, the point 60 m of line before the ring, never
//   edge on to the line's end; each has a green cup and neck behind a domed disc and two whorls of cupped, curled
//   petals; each is sized so that no part of it comes within 6.5 m of the line. Each opens as the line comes within
//   70 m of it, over the next 30 m of line (one after another, as the climb finds them); the great one is opened by the
//   world. opts.pickSun(test) lets the world choose the sun's bearing: test(dir, need) answers { whole, eyes }: from
//   how many of the eyes (places set every 2 m of line along the whole last straight into the ring) the direction dir
//   stands 'need' radians clear of the trunk, the arms and the open great flower; test.hits(dir, within) lists the small
//   flowers that would come within that angle of dir from any of the same eyes. The flowers the world lists in 'drop'
//   are not built.
//   Bud arms are fat zeppelins (BUD_R) standing off the flesh on a short curved neck; round cream buttons with a
//   pink-cream rim (round ones within 14 m of the line, plainer ones beyond); the fork's two arms each carry a fruit.
// Size: radius 80, height 150 (trunk crown 124 m, tallest arms 127 m, flower centre 140 m). Cost: about 110k
// triangles in 11 meshes, no lights, no textures; it is built in short steps between
// yields (ctx.yield). Instance scale may be non-uniform; the mode 1 dome geometry has unit radius.
// It expects: flat ground at y 0 (red earth) for 90 m round it, nothing else inside 85 m of the trunk below
//   150 m except what follows the anchors. Local axes: origin at the trunk's foot, +Y up, FRONT = +Z: the
//   eye arrives from +Z flying toward -Z (so in a world whose course is +Z set object.rotation.y = Math.PI).
// ANCHORS (local space; hero.worldAnchors() returns them through object.matrixWorld)
//   flyThrough   ordered points of the climb: a level run-in at 14 m, the rising turn of 300 degrees (round
//                the trunk at 50 m, swinging out to 78 m, then in), a last straight of about 48 m at 30 degrees into
//                the ring. Everything here is placed by its distance from THIS line: 7 m of flesh either side
//                in the fork, 13 m or more elsewhere (ARM_CLEAR). Put these points into the world path unchanged.
//   fork         { position, p }: the point between the two arms (72 m up, FORK_Y), p = its share of flyThrough.
//   portalSeat   { position, normal, radius 7 }: the ring in the flower's throat; normal faces the arriving eye.
//   flowerCentre, crown, houseAt, shoulders (roost rows), tips (the arm tips round the flower).
// PROGRESS (functions of the route flown, never of time): hero.setClimb(p), p = share of flyThrough flown
//   (0 at its first point, 1 at the ring): the macaws on the fork's shoulders burst and outrun the eye upward
//   in lanes under the line, 6.8 m or more from it, and the small flowers open. hero.setFlower(o): 0 closed spindle,
//   1 open (the world opens it as we pass the fork). Until the world calls them they rest at climb 0.6 and flower 1.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

// dev handle (the last hero built), for the print-only checks and the set-piece viewer's fly-through test
export const _debug = { hero: null };

export const PALETTE = ['#58AEE0', '#2E9E4F', '#14603A', '#F09DBE', '#F6C52E', '#A8542F', '#F4ECD6'];

// Pigment rule: middle = pigment mixed with cream (40 percent; green 30, earth 28); rim = pigment mixed with its dark partner.
// Mixed as paint is judged, in display (sRGB) values, then handed to the shader as linear colours.
export function makePigments(palette = PALETTE) {
  const P = palette.map((h) => new THREE.Color(h));
  const hexMix = (a, b, k) => {
    const A = a.clone().convertLinearToSRGB(), B = b.clone().convertLinearToSRGB();
    return new THREE.Color().setRGB(lerp(A.r, B.r, k), lerp(A.g, B.g, k), lerp(A.b, B.b, k), THREE.SRGBColorSpace);
  };
  const [blue, green, deep, pink, yellow, earth, cream] = P;
  const pig = (p, dark, k, pale = 0.4) => ({ mid: hexMix(p, cream, pale), rim: hexMix(p, dark, k), base: p.clone() });
  return {
    blue: pig(blue, deep, 0.2), green: pig(green, deep, 0.7, 0.3), greenDark: { mid: hexMix(green, cream, 0.2), base: hexMix(green, deep, 0.34), rim: hexMix(green, deep, 0.85) },
    greenPale: { mid: hexMix(green, cream, 0.4), base: hexMix(green, cream, 0.14), rim: hexMix(green, deep, 0.5) }, deep: { mid: hexMix(deep, green, 0.5), rim: deep.clone(), base: hexMix(deep, green, 0.2) },
    pink: pig(pink, earth, 0.35), yellow: pig(yellow, earth, 0.35), earth: pig(earth, deep, 0.25, 0.28),
    cream: { mid: cream.clone(), rim: hexMix(cream, pink, 0.4), base: hexMix(cream, pink, 0.08) },
    flat: (c) => ({ mid: c.clone(), rim: c.clone(), base: c.clone() }), mix: hexMix, raw: { blue, green, deep, pink, yellow, earth, cream },
  };
}

export const STYLE = { uTime: { value: 0 }, uBand: { value: 0.7 }, uOff: { value: new THREE.Vector2(0.24, 0.14) } };

// ---------------------------------------------------------------------------------------------- the grade
export const GRADE_GLSL = /* glsl */`
uniform float uTime; uniform float uBand; uniform vec2 uOff;
// PAINT, NOT PLASTIC (lead's note 6a). pale middle 0 .. dark rim 1 in FIVE SEEN STEPS: the pale band is broad and
// chalky (half of the form's width), then four narrower steps to the rim; the edges between steps are soft (uBand is
// the share of each step given to its soft edge) and a slight slope inside each step keeps it from reading as print.
float sgRamp(float t) {
  t = clamp(t, 0., 1.);
  float w = 0.5 * uBand;
  float q = 0.25 * (smoothstep(0.5 - 0.11 * w, 0.5 + 0.11 * w, t) + smoothstep(0.66 - 0.09 * w, 0.66 + 0.09 * w, t)
    + smoothstep(0.79 - 0.08 * w, 0.79 + 0.08 * w, t) + smoothstep(0.9 - 0.07 * w, 0.9 + 0.07 * w, t));
  return mix(q, t * t, 0.14);
}
// the grade itself: pale middle -> the pigment -> its dark rim
vec3 sgGrade(vec3 mid, vec3 base, vec3 rim, float t) {
  float q = sgRamp(t);
  vec3 c = mix(mid, base, clamp(q * 2., 0., 1.));
  return mix(c, rim, clamp(q * 2. - 1., 0., 1.));
}
// distance across a tube or ball as the eye at 'eye' sees the point 'wp' (0 middle, 1 silhouette).
// ax = the form's axis times its weight (0 on a ball). Reads the eye's place only.
float sgTube(vec3 wp, vec3 n, vec3 ax, vec3 eye) {
  vec3 v = eye - wp; v = v / max(length(v), 1e-4);
  vec3 v0 = v;
  // the pale middle sits a little off centre, and the offset walks slowly round (the medium's own motion)
  float ph = uTime * 0.6 + wp.x * 0.045 + wp.z * 0.045;      // each form in its own time, like a hand, not a lamp
  vec3 side = cross(vec3(0., 1., 0.), v);
  v = v + side * (uOff.x * cos(ph)) + vec3(0., uOff.y * (0.6 + 0.4 * sin(ph * 0.7)), 0.);
  v = v / max(length(v), 1e-4);
  float wa = length(ax); vec3 a = ax / max(wa, 1e-4); wa = min(wa, 1.);
  vec3 vp = v - a * dot(v, a);
  wa *= smoothstep(0.05, 0.4, length(vp));          // looking down the axis: fall back to the ball rule
  vec3 ne = n - a * (dot(n, a) * wa), ve = v - a * (dot(v, a) * wa);
  float c = dot(ne, ve) / max(length(ne) * length(ve), 1e-4);
  c = clamp(c, 0., 1.);
  // (the edge of the form as the eye's place truly sees it keeps its two darkest steps on BOTH sides, however far the
  // pale middle has walked: a near form turns dark toward each of its own edges)
  vec3 v0e = v0 - a * (dot(v0, a) * wa);
  float c0 = clamp(dot(ne, v0e) / max(length(ne) * length(v0e), 1e-4), 0., 1.);
  return max(sqrt(max(1. - c * c, 0.)), 1. - 1.15 * (1. - sqrt(max(1. - c0 * c0, 0.))));
}
// brush ridges along the form's length, up to 7 percent deep, near and far: their spacing is chosen from the pixel's
// footprint (fw = fwidth of the across coordinate, taken by the caller OUTSIDE any branch) so that they lie 5 to 10
// pixels apart near and far; two octaves cross-fade as the form recedes, the way a hatch thins, so nothing pops.
float sgRidge(float across, float fw) {
  float L = log2(max(fw, 1e-7) * 5.), f = fract(L), p = exp2(floor(L));
  float x = across / p;
  float a = sin(x * 6.2832) + 0.45 * sin(x * 2.4166 + 1.7);
  float b = sin(x * 3.1416) + 0.45 * sin(x * 1.2083 + 1.7);
  return 1. + 0.05 * mix(a, b, f);
}
`;

export const SHADOW_GLSL = /* glsl */`
// PAINTED SHADOWS (lead's note 7a). The ground is given the shadows as a law of the place: one sun direction, read from
// a map of the valley laid at build (uShadow: every standing thing's shadow shape, soft-edged), plus the shapes that
// move: cloud shadows drifting on the clock and the wagons' shadows, which go with the cars. A shadow is a deeper tint of the
// ground's OWN pigment (toward its rim), never grey or black. It reads the place only (world x, z), never the eye.
uniform sampler2D uShadow; uniform vec4 uShRect; uniform vec4 uCloudSh[4]; uniform vec4 uCarSh[8]; uniform vec2 uCarSweep; uniform float uShAmt; uniform vec3 uShTint;
float sgShadow(vec2 p) {
  float s = textureLod(uShadow, (p - uShRect.xy) * uShRect.zw, 0.).r;
  for (int i = 0; i < 4; i++) {
    vec2 q = (p - uCloudSh[i].xy) / max(uCloudSh[i].zw, vec2(1.));
    s = max(s, 0.8 * (1. - smoothstep(0.7, 1., length(q))));
  }
  for (int i = 0; i < 8; i++) {
    vec2 a = uCarSh[i].zw, q = p - uCarSh[i].xy;
    vec2 l = vec2(dot(q, a), a.x * q.y - a.y * q.x), sw = vec2(dot(uCarSweep, a), a.x * uCarSweep.y - a.y * uCarSweep.x);
    l -= sw * clamp(dot(l, sw) / max(dot(sw, sw), 1e-4), 0., 1.);
    vec2 d = abs(l) - vec2((i == 0 || i == 4) ? 4.6 : 3.3, 1.45);
    float sd = length(max(d, 0.)) + min(max(d.x, d.y), 0.);
    s = max(s, 1. - smoothstep(-0.15, 0.5, sd));
  }
  return s;
}
`;

const GRADE_VERT = /* glsl */`
attribute vec3 aMid; attribute vec3 aBase; attribute vec3 aRim; attribute vec3 aG;
uniform float uTime;
uniform float uMode;
varying vec3 vMid; varying vec3 vBase; varying vec3 vRim; varying vec3 vN; varying vec3 vAx; varying vec3 vW; varying vec3 vF; varying vec2 vUv;
#ifdef SG_QUILT
varying vec4 vQ;
#endif
/*DECL*/
void main() {
  vec3 pos = position; vec3 nrm = normal; vec3 g = aG; vec3 mid = aMid; vec3 rim = aRim; vec3 bas = aBase;
  mat4 m = modelMatrix;
  #ifdef USE_INSTANCING
  m = modelMatrix * instanceMatrix;
  #endif
  /*PRE*/
  vec4 w = m * vec4(pos, 1.);
  mat3 m3 = mat3(m);
  vec3 s2 = max(vec3(dot(m3[0], m3[0]), dot(m3[1], m3[1]), dot(m3[2], m3[2])), vec3(1e-8));
  vN = m3 * (nrm / s2);
  vW = w.xyz; vUv = uv; vMid = mid; vRim = rim; vBase = bas; vAx = vec3(0.); vF = vec3(0.);
  #ifdef SG_QUILT
  vQ = vec4(0.);
  #endif
  if (uMode < 0.5) {
    float wa = length(g); vec3 a = m3 * g;
    vAx = a / max(length(a), 1e-4) * wa;
  } else if (uMode < 1.5) {
    // dome: the eye's bearing on the map, from the dome's own centre, in units of its radius
    vec3 d = cameraPosition - m[3].xyz;
    vec2 dl = vec2(dot(d, m3[0]), dot(d, m3[2])) / vec2(s2.x, s2.z);
    vec2 sh = dl / max(length(dl), 1.) * 0.25;
    float dph = uTime * 0.4 + m[3].x * 0.031 + m[3].z * 0.017;
    sh += 0.075 * vec2(cos(dph), sin(dph * 0.8));
    vF = vec3(g.x - sh.x, g.z - sh.y, g.y);
    #ifdef SG_QUILT
    vQ = vec4(g.x, g.z, floor(fract(m[3].x * 0.137 + m[3].z * 0.071) * 128.) / 128., 0.5 * (sqrt(s2.x) + sqrt(s2.z)));   // the dome's own map (unit radius), its own number, its radius in metres
    #endif
  } else if (uMode > 2.5) {
    vF = g;                                            // mode 3: aG.y = height in the form, -1 foot .. 1 top
  } else {
    // flat face: a tenth toward the eye, in the face's own plane
    vec3 d = cameraPosition - w.xyz; d = d / max(length(d), 1e-4);
    vec3 dl = vec3(dot(d, m3[0]), dot(d, m3[1]), dot(d, m3[2])) / sqrt(s2);
    dl -= nrm * dot(nrm, dl);
    vF = g - 0.1 * dl;
    // the pale middle also wanders a little in the face's own plane, on the clock (the medium's own motion)
    float fph = uTime * 0.45 + w.x * 0.05 + w.z * 0.04;
    vec3 fw3 = vec3(cos(fph), sin(fph * 0.8), cos(fph * 1.3 + 1.)); fw3 -= nrm * dot(nrm, fw3);
    vF += 0.09 * fw3;
  }
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const GRADE_FRAG = /* glsl */`
uniform float uMode;
varying vec3 vMid; varying vec3 vBase; varying vec3 vRim; varying vec3 vN; varying vec3 vAx; varying vec3 vW; varying vec3 vF; varying vec2 vUv;
${GRADE_GLSL}
#ifdef SG_GROUND
${SHADOW_GLSL}#endif
#ifdef SG_QUILT
// THE HILLS ARE HER SCALLOPS (lead's notes 7b and 8c). A tall dome is first of all ONE smooth form: its own grade by
// height (a pale crown over the upper half, stepping in five bands to a deep rim at the foot) and a deep far edge where
// it turns away from the eye's place, which lies against the pale middle of the hill behind. On it lie a few big
// rounded plots LAPPED LIKE FISH SCALES in the dome's own map: a crown plot, a ring of six under it, a ring of six
// under those, turned half a plot. Each plot is pale at its upper middle and darkens toward its own lower edge, which lies over the pale
// upper part of the plot below: there is no line round a plot and no straight side. Most plots are the hill's own
// green, some deeper, some paler, a few pink earth, yellow or cream. Rows of plants are thin lines of small dots
// along the dome's contours; their spacing is taken from the pixel's footprint (two octaves cross-faded), so that a
// dot is 2 to 5 pixels near and far and none is ever a large flat spot. Past the distance where a plot is a few
// pixels the hill is its plain grade. Derivatives are taken once, by the caller, outside any branch.
uniform vec3 uQMid[3]; uniform vec3 uQRim[3];
varying vec4 vQ;
float sgHash1(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
// one ring of n scales: x = how far the point lies inside the scale's lower edge (unit radius), y = the scale's number
vec2 sgScale(float r, float th, float n, float ph, float ro, float dp) {
  float a = th * n / 6.2832 + ph, f = fract(a) * 2. - 1.;
  float f2 = f * f; return vec2(ro - dp * f2 * (0.3 + 0.7 * f2) - r, mod(floor(a), n));
}
// rows of round plants on the contours, sp apart (unit radius); fr = the pixel's footprint
float sgRows(float r, float th, float sp, float fr) {
  float k = r / sp, i = floor(k), rowR = (i + 0.5) * sp;
  float nd = max(1., floor(6.2832 * rowR / (0.62 * sp)));
  vec2 c = vec2(fract(k) - 0.5, (fract(th / 6.2832 * nd + 0.37 * i) - 0.5) * 6.2832 * rowR / (nd * sp));
  float fa = fr / sp;
  return (1. - smoothstep(0.09 - fa, 0.09 + fa, length(c))) * (1. - smoothstep(0.045, 0.07, fa));
}
// a plot's pigment from its number h (0..1); h under 0.34 is the hill's own
void sgPlot(float h, out vec3 cm, out vec3 cb, out vec3 cr) {
  cm = vMid; cb = vBase; cr = vRim;
  if (h < 0.34) { }
  else if (h < 0.56) { cm = mix(vMid, vBase, 0.7); cb = mix(vBase, vRim, 0.45); }
  else if (h < 0.72) { cm = mix(vMid, uQMid[2], 0.4); cb = mix(vMid, vBase, 0.5); cr = mix(vBase, vRim, 0.75); }
  else if (h < 0.85) { cm = uQMid[0]; cb = mix(uQMid[0], uQRim[0], 0.45); cr = uQRim[0]; }
  else if (h < 0.94) { cm = uQMid[1]; cb = mix(uQMid[1], uQRim[1], 0.45); cr = uQRim[1]; }
  else { cm = mix(vMid, uQMid[2], 0.62); cb = mix(vMid, vBase, 0.4); cr = mix(vBase, vRim, 0.6); }
}
vec3 sgQuilt(vec3 plain, float t, vec2 fq, inout vec3 cBase, inout vec3 cRim) {
  // (the hill's own number is one of 128 exact steps, rounded again here: a varying carried across a triangle wobbles in
  // its last bits, and a hash of it would then pick two plots' pigments pixel by pixel)
  vec2 g = vQ.xy; float r = length(g), hh = floor(vQ.z * 128. + 0.5) / 128.;
  float th = (abs(g.x) + abs(g.y) > 1e-5) ? atan(g.y, g.x) : 0.;
  float fr = max(fq.x, fq.y) + 1e-6;
  // (the two rings have six plots each and the lower ring is turned half a plot, so every seam between two plots of a
  // ring lies under the middle of a plot of the ring above: no straight side is ever seen)
  vec2 s0 = vec2(0.47 - r, 0.);
  vec2 s1 = sgScale(r, th, 6., hh * 7., 0.75, 0.3);
  vec2 s2 = sgScale(r, th, 6., hh * 7. + 0.5, 0.96, 0.24);
  // which plot the point lies on: the innermost ring whose lower edge it is inside (soft over a pixel)
  float w0 = smoothstep(-fr, fr, s0.x), w1 = smoothstep(-fr, fr, s1.x) * (1. - w0), w2 = smoothstep(-fr, fr, s2.x) * (1. - w0) * (1. - smoothstep(-fr, fr, s1.x));
  float wf = max(1. - w0 - w1 - w2, 0.);
  float inside = w0 * s0.x / 0.13 + w1 * s1.x / 0.15 + w2 * s2.x / 0.17 + wf;
  float h = (s1.x > 0. && s0.x <= 0.) ? sgHash1(vec2(s1.y + 3., hh * 91.)) : sgHash1(vec2(s2.y + 31., hh * 57.));
  if (s0.x > 0. || (s1.x <= 0. && s2.x <= 0.)) h = 0.;
  vec3 cm, cb, cr; sgPlot(h, cm, cb, cr);
  // pale at its upper middle, darkening toward its own lower edge; the dome's own grade (five steps by height) over it
  float le = 1. - smoothstep(0., 1., inside);
  float ql = 0.5 * le * le, qd = sgRamp(t);
  float tt = 1. - (1. - ql) * (1. - 0.86 * qd);
  vec3 col = mix(mix(cm, cb, clamp(tt * 2., 0., 1.)), cr, clamp(tt * 2. - 1., 0., 1.));
  // thin contour rows of small round plants on about half of the plots
  float L = max(log2(fr * 48.), log2(5. / max(vQ.w, 1.))), sp = exp2(floor(L));     // (a plant is never under two pixels across)
  float mark = mix(sgRows(r, th, sp, fr), sgRows(r, th, sp * 2., fr), fract(L));
  mark *= step(0.42, fract(h * 7.31 + hh * 3.7)) * (1. - w0) * (1. - wf) * (1. - le);
  col = mix(col, mix(cb, cr, 0.7), 0.8 * mark);
  // too far to draw a plot: the hill's plain grade
  float far = smoothstep(0.04, 0.085, fr);
  col = mix(col, plain, far);
  cBase = mix(cb, cBase, far); cRim = mix(cr, cRim, far);
  // the deep far edge, where the dome turns away from the eye's place
  vec3 n = vN / max(length(vN), 1e-6), v = cameraPosition - vW; v = v / max(length(v), 1e-4);
  col = mix(col, vRim, 0.9 * (1. - smoothstep(0.03, 0.2, dot(n, v))));
  return col;
}
#endif
void main() {
  float fw = fwidth(vUv.x);
  #ifdef SG_QUILT
  vec2 fq = fwidth(vQ.xy);
  #endif
  float t;
  if (uMode < 0.5) {
    vec3 n = vN / max(length(vN), 1e-6);
    if (!gl_FrontFacing) n = -n;
    t = sgTube(vW, n, vAx, cameraPosition);
  } else if (uMode < 1.5) {
    float r = length(vF.xy);                           // a tall dome (vF.z = 1) steps down by HEIGHT, a flat disc by radius
    t = mix(r, 1. - pow(max(1. - r * r, 0.), 0.62), clamp(vF.z, 0., 1.));
  } else if (uMode < 2.5) {
    vec3 q = vF * vF;                                  // a rounded square: the rim runs along all the edges
    t = sqrt(sqrt(dot(q, q)));
  } else {
    // mode 3, a cut-out oval or heap (puffs, clouds): flat pale above, ONE darker under-band along its foot, the same from every side
    t = 1. - 0.52 * smoothstep(-0.56, -0.48, vF.y) - 0.28 * smoothstep(-0.82, -0.74, vF.y);
  }
  vec3 cMid = vMid, cBase = vBase, cRim = vRim;
  vec3 col = sgGrade(cMid, cBase, cRim, t);
  #ifdef SG_QUILT
  if (vF.z > 0.5) col = sgQuilt(col, t, fq, cBase, cRim);
  #endif
  col *= sgRidge(vUv.x, fw);
  #ifdef SG_GROUND
  // the shadow's colour: the ground's own pigment half way to its rim, cooled a little with the sky's blue so that
  // a shadow is never mistaken for the dark end of a plot's grade
  col = mix(col, mix(mix(cBase, cRim, 0.5), uShTint, 0.24), sgShadow(vW.xz) * uShAmt);
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

export function gradeMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...STYLE, uMode: { value: o.mode ?? 0 }, ...(o.uniforms || {}) },
    defines: { ...(o.ground ? { SG_GROUND: 1 } : {}), ...(o.quilt ? { SG_QUILT: 1 } : {}) },   // fixed at build: ground takes the painted shadows, quilt draws plots on tall domes
    vertexShader: GRADE_VERT.replace('/*DECL*/', o.vertexDecl || '').replace('/*PRE*/', o.vertexPre || ''),
    fragmentShader: GRADE_FRAG, side: o.side ?? THREE.FrontSide,
  });
}

export function paint(geo, pig) {
  const n = geo.attributes.position.count, a = new Float32Array(n * 3), b = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pig.mid.toArray(a, i * 3); pig.rim.toArray(b, i * 3); pig.base.toArray(c, i * 3); }
  geo.setAttribute('aMid', new THREE.BufferAttribute(a, 3)); geo.setAttribute('aRim', new THREE.BufferAttribute(b, 3)); geo.setAttribute('aBase', new THREE.BufferAttribute(c, 3));
  return geo;
}
// the same per instance: pigs = one pigment for all n, or an array of n pigments
export function paintInstances(geo, n, pigs) {
  const a = new Float32Array(n * 3), b = new Float32Array(n * 3), c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const pig = Array.isArray(pigs) ? pigs[i] : pigs; pig.mid.toArray(a, i * 3); pig.rim.toArray(b, i * 3); pig.base.toArray(c, i * 3); }
  geo.setAttribute('aMid', new THREE.InstancedBufferAttribute(a, 3)); geo.setAttribute('aRim', new THREE.InstancedBufferAttribute(b, 3)); geo.setAttribute('aBase', new THREE.InstancedBufferAttribute(c, 3));
  return geo;
}

// ---------------------------------------------------------------------------------------------- builders
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// A swollen tube along a centreline (mode 0). pts: Vector3[], radii: number[] (let them fall to ~0 at an end
// for a round or zeppelin tip: the normal and the axis weight follow the taper). Bakes normal, aG, uv.
export function tubeGeometry(pts, radii, radial = 18) {
  const n = pts.length, R = radial + 1;
  const pos = new Float32Array(n * R * 3), nor = new Float32Array(n * R * 3), ag = new Float32Array(n * R * 3), uv = new Float32Array(n * R * 2);
  const T = V(), N = V(), B = V(), t0 = V(), q = V(), r = V();
  let rMax = 0; for (const x of radii) rMax = Math.max(rMax, x);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.subVectors(b, a); const seg = Math.max(T.length(), 1e-6); T.multiplyScalar(1 / seg);
    if (i === 0) { N.set(Math.abs(T.y) > 0.9 ? 1 : 0, Math.abs(T.y) > 0.9 ? 0 : 1, 0); N.addScaledVector(T, -N.dot(T)).normalize(); }
    else { N.addScaledVector(T, -N.dot(T)); if (N.lengthSq() < 1e-8) N.copy(t0); N.normalize(); s += pts[i].distanceTo(pts[i - 1]); }
    t0.copy(N); B.crossVectors(T, N);
    const dr = (radii[Math.min(n - 1, i + 1)] - radii[Math.max(0, i - 1)]) / seg;
    const w = 1 / Math.sqrt(1 + dr * dr * 2.5);
    for (let j = 0; j < R; j++) {
      const th = (j / radial) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), k = (i * R + j) * 3;
      r.copy(N).multiplyScalar(c).addScaledVector(B, sn);
      q.copy(pts[i]).addScaledVector(r, radii[i]);
      pos[k] = q.x; pos[k + 1] = q.y; pos[k + 2] = q.z;
      r.addScaledVector(T, -dr).normalize();
      nor[k] = r.x; nor[k + 1] = r.y; nor[k + 2] = r.z;
      ag[k] = T.x * w; ag[k + 1] = T.y * w; ag[k + 2] = T.z * w;
      uv[(i * R + j) * 2] = th * rMax; uv[(i * R + j) * 2 + 1] = s;
    }
  }
  const idx = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * R + j, b = a + R;
    if (radii[i] > 1e-3) idx.push(a, a + 1, b); if (radii[i + 1] > 1e-3) idx.push(a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aG', new THREE.BufferAttribute(ag, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// A ball or egg (mode 0, aG = 0): radii rx, ry, rz; egg narrows it toward +y; round = true keeps the
// unit ball's normals on a flattened form (a wing, a cheek patch), so that it too grades middle to rim.
export function ballGeometry(rx, ry = rx, rz = rx, wseg = 10, hseg = 7, egg = 0, round = false) {
  const g = new THREE.SphereGeometry(1, wseg, hseg), p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), f = 1 - egg * y;          // egg: narrower toward +y
    p.setXYZ(i, x * rx * f, y * ry, z * rz * f);
    const l = Math.hypot(x / rx, y / ry, z / rz) || 1; if (round) nn.setXYZ(i, x, y, z); else nn.setXYZ(i, x / rx / l, y / ry / l, z / rz / l);
    u.setXY(i, u.getX(i) * 6.283 * Math.max(rx, rz), u.getY(i) * 3.14 * ry);
  }
  g.setAttribute('aG', new THREE.BufferAttribute(new Float32Array(p.count * 3), 3));
  return g;
}

// A fat paddle (petal, leaf) for mode 2: lies in local XY, grows along +Y from the origin, both faces.
// aG = (across / half width, along, 0): pale midrib, dark edge and tip.
export function lensGeometry(len, width, nu = 6, nv = 10, fat = 0.07, tipAt = 0.62) {
  const pos = [], nor = [], ag = [], uv = [], idx = [];
  const hw = (v) => { const a = v < tipAt ? v / tipAt : (1 - v) / (1 - tipAt); return width * 0.5 * Math.sqrt(Math.max(0, 1 - (1 - a) * (1 - a))) * (0.25 + 0.75 * Math.min(1, v * 6)) + (v < 0.12 ? width * 0.09 : 0) * (1 - v / 0.12); };
  for (let side = 0; side < 2; side++) {
    const sg = side ? -1 : 1, base = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const v = j / nv, a = (i / nu) * 2 - 1, h = hw(v), bulge = fat * width * (1 - a * a) * Math.sin(Math.PI * Math.min(1, v * 1.1 + 0.03));
      pos.push(a * h, v * len, sg * bulge); nor.push(0, 0, sg);
      ag.push(a, (v * 2 - 1) * 0.94, 0); uv.push(a * h, v * len);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = base + j * (nu + 1) + i, b = a + nu + 1;
      if (side) idx.push(a, b, a + 1, a + 1, b, b + 1); else idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// Flat faces for mode 2 from polygons (3 or 4 corners each, counter-clockwise seen from outside): a wall, a
// roof slope, a painted door. aG runs from 0 at the face's middle to 1 at its edges, in the face's own plane.
export function faceGeometry(polys) {
  const pos = [], nor = [], ag = [], uv = [], idx = [];
  const e1 = V(), e2 = V(), nn = V(), c = V(), d = V();
  for (const P of polys) {
    const base = pos.length / 3, k = P.length;
    e1.subVectors(P[1], P[0]); e2.subVectors(P[k - 1], P[0]); nn.crossVectors(e1, e2).normalize();
    c.set(0, 0, 0); for (const p of P) c.add(p); c.multiplyScalar(1 / k);
    const l1 = e1.length() * 0.5, l2 = e2.length() * 0.5; e1.normalize(); e2.addScaledVector(e1, -e2.dot(e1)).normalize();
    for (const p of P) {
      d.subVectors(p, c); pos.push(p.x, p.y, p.z); nor.push(nn.x, nn.y, nn.z);
      let a = d.dot(e1) / Math.max(l1, 1e-6), b = d.dot(e2) / Math.max(l2, 1e-6);
      if (k === 3) { const l = Math.hypot(a, b) || 1; a /= l; b /= l; }
      ag.push(e1.x * a + e2.x * b, e1.y * a + e2.y * b, e1.z * a + e2.z * b); uv.push(d.dot(e1), d.dot(e2));
    }
    for (let i = 1; i < k - 1; i++) idx.push(base, base + i, base + i + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

// the fork stands 72 m up the climb, as designed; everything that hangs on it (its two arms, their buds and fruit, the
// burst, the great flower's opening, the world's slowing and its looks) falls where that puts it
const OPEN_NEAR = 70, OPEN_RUN = 30;      // a small flower opens as the line comes within OPEN_NEAR m of it, over the next OPEN_RUN m of line
const FORK_Y = 72, ARM_CLEAR = 13;      // every arm but the fork's two stands 13 m and more from the line
// the climb, for turn = +1 (x is mirrored for -1): see ANCHORS in the header
const CLIMB = [[50, 14, 72], [50, 14, 52], [50, 14.4, 20], [50, 15.5, 12], [49.9, 18.5, 1], [48.7, 22.8, -9.9], [45.3, 27.1, -20.4], [39.7, 31.5, -29.8], [32.2, 35.9, -37.8], [23.2, 40.3, -44], [13, 44.7, -48.1], [2.1, 49.1, -49.8], [-8.8, 53.4, -49.1], [-19.4, 57.8, -46.2], [-29.4, 62.2, -41.6], [-38.9, 66.6, -36.1], [-48.1, 71.1, -29.5], [-56.4, 75.4, -22.3], [-64, 79.8, -14.4], [-70.8, 84.2, -5.8], [-75.7, 88.6, 4], [-76.2, 93, 14.9], [-71.5, 97.4, 24.7], [-62.7, 102.3, 31], [-51.8, 108.3, 32.4], [-41.5, 114.6, 28.8], [-31.9, 121, 23.4], [-22.4, 127.3, 17.9], [-12.8, 133.7, 12.4], [-3.3, 140, 6.9]];

// ---------------------------------------------------------------------------------------------- the plan
// Everything below is placed by its distance from the climb line (never by the eye): planCactus is pure
// arithmetic (no THREE objects on screen), so the print-only clearance check can run it in node.
function sampleClimb(turn) {
  const curve = new THREE.CatmullRomCurve3(CLIMB.map((p) => V(p[0] * turn, p[1], p[2])), false, 'centripetal');
  const pts = curve.getSpacedPoints(360), len = curve.getLength();
  return { pts, len, at: (p) => curve.getPointAt(clamp(p, 0, 1)), tan: (p) => curve.getTangentAt(clamp(p, 0, 1)) };
}
function distToLine(line, p, from = 0, to = 1e9) {            // least distance from p to the sampled climb
  let best = 1e9; const P = line.pts;
  for (let i = Math.max(0, from); i < Math.min(P.length, to); i++) { const d = P[i].distanceToSquared(p); if (d < best) best = d; }
  return Math.sqrt(best);
}
// centreline and radii of one arm: level from the trunk, a quarter bend, straight up, a zeppelin tip
function armLine(arm) {
  const { bearing, reach, h, top, r } = arm, bendR = r * 1.2 + 1.5, cx = Math.sin(bearing), cz = Math.cos(bearing);
  const pts = [], radii = [], kind = [];
  const put = (rad, y, rr, k) => { pts.push(V(cx * rad, y, cz * rad)); radii.push(rr); kind.push(k); };
  const runEnd = reach - bendR, nRun = Math.max(2, Math.round((runEnd - 6) / 4.5));
  for (let i = 0; i <= nRun; i++) put(lerp(6, runEnd, i / nRun), h, r * (0.94 + 0.06 * Math.sin((i / nRun) * Math.PI)), 0);
  for (let i = 1; i <= 7; i++) { const a = (i / 7) * Math.PI * 0.5; put(runEnd + Math.sin(a) * bendR, h + bendR - Math.cos(a) * bendR, r, 1); }
  const y0 = h + bendR, cap = r * 2.4, yc = top - cap, nUp = Math.max(1, Math.round((yc - y0) / 4.5));
  for (let i = 1; i <= nUp; i++) { const v = i / nUp; put(reach, lerp(y0, yc, v), r * (1 + 0.07 * Math.sin(v * Math.PI * 0.9)), 2); }
  const rc = radii[radii.length - 1];
  for (let i = 1; i <= 8; i++) { const a = (i / 8) * Math.PI * 0.5, x = Math.sin(a); put(reach, yc + cap * x, i === 8 ? 0 : rc * Math.pow(Math.cos(a), 0.8), 3); }
  arm.pts = pts; arm.radii = radii; arm.kind = kind; arm.bendR = bendR;
  arm.elbow = V(cx * reach, h + bendR, cz * reach); arm.tip = V(cx * reach, top, cz * reach); arm.dir = V(cx, 0, cz);
  return arm;
}
const armClear = (line, arm) => { let m = 1e9; for (let i = 0; i < arm.pts.length; i++) m = Math.min(m, distToLine(line, arm.pts[i]) - arm.radii[i]); return m; };
function armsApart(a, b) {
  let m = 1e9;
  for (let i = 0; i < a.pts.length; i++) { const p = a.pts[i]; if (p.x * p.x + p.z * p.z < 19 * 19) continue;
    for (let j = 0; j < b.pts.length; j++) { const q = b.pts[j]; if (q.x * q.x + q.z * q.z < 19 * 19) continue; m = Math.min(m, p.distanceTo(q) - a.radii[i] - b.radii[j]); } }
  return m;
}

export async function planCactus(rng, opts = {}, yieldFn = async () => {}) {
  const turn = opts.turn === -1 ? -1 : 1, line = sampleClimb(turn), arms = [];
  // the fork: the point of the climb 72 m up, and the two arms that stand 7 m of clear air either side of it
  let fi = 0; while (fi < line.pts.length - 1 && line.pts[fi].y < FORK_Y) fi++;
  const fp = line.pts[fi].clone(), ft = line.pts[fi + 1].clone().sub(line.pts[fi - 1]).normalize();
  const out = V(ft.z, 0, -ft.x).normalize(); if (out.dot(V(fp.x, 0, fp.z)) < 0) out.negate();
  const forkArm = (sgn, r, h, top) => { const c = fp.clone().addScaledVector(out, sgn * (7.3 + r * 1.07)); return armLine({ bearing: Math.atan2(c.x, c.z), reach: Math.hypot(c.x, c.z), h, top, r, fork: sgn }); };
  arms.push(forkArm(-1, 6.2, 44 + rng() * 3, 104 + rng() * 5), forkArm(1, 5.6, 25 + rng() * 3, 92 + rng() * 5));
  // three tiers, like a candelabra: an outer arm leaves low and passes under the elbows of the ones inside it
  const tryArm = (a, clear, minRise) => {
    const top0 = a.top;
    for (let q = 0; q < 4; q++) {
      for (let k = 0; k < 9; k++) {
        armLine(a);
        if (a.top - a.h < minRise + a.r * 2) break;
        let ok = armClear(line, a) >= clear;
        if (ok) for (const b of arms) if (armsApart(a, b) < 0.8) { ok = false; break; }
        if (ok) return true;
        a.top -= 5;
      }
      a.reach -= 3.5; a.top = top0;
    }
    return false;
  };
  const tiers = [
    { n: 6, reach: [19.5, 23], h: [66, 88], top: [119, 127], r: [5, 5.8], rise: 14 },
    { n: 7, reach: [27, 32], h: [42, 54], top: [82, 104], r: [5.2, 6.2], rise: 12 },
    { n: 7, reach: [34, 40], h: [15, 29], top: [46, 74], r: [5.2, 6.4], rise: 12 },
  ];
  for (const T of tiers) {
    const ph = rng() * 6.283;
    for (let i = 0; i < T.n; i++) {
      const jit = rng() - 0.5, u1 = rng(), u2 = rng(), u3 = rng(), u4 = rng();
      for (let k = 0; k < 5; k++) {
        const a = { bearing: ph + (i + jit * 0.5 + k * 0.37) * 6.283 / T.n, reach: lerp(T.reach[0], T.reach[1], u1), h: lerp(T.h[0], T.h[1], u2), top: lerp(T.top[0], T.top[1], u3), r: lerp(T.r[0], T.r[1], u4), tier: tiers.indexOf(T) };
        if (tryArm(a, ARM_CLEAR, T.rise)) { arms.push(a); break; }
      }
      await yieldFn();
    }
  }
  for (let i = 0; i < 90 && arms.length < 20; i++) {          // fill to 20 arms where room is left
    const T = tiers[1 + (i % 2)];
    const a = { bearing: rng() * 6.283, reach: lerp(T.reach[0], T.reach[1], rng()), h: lerp(T.h[0], T.h[1] + 8, rng()), top: lerp(T.top[0], T.top[1], rng()), r: lerp(T.r[0], T.r[1], rng()) * 0.94, tier: 1 + (i % 2) };
    if (tryArm(a, ARM_CLEAR, T.rise)) arms.push(a);
    if (i % 6 === 5) await yieldFn();
  }
  return { turn, line, arms, fork: { point: fp, tangent: ft, out, index: fi, p: fi / (line.pts.length - 1) } };
}

// a bud arm: a short neck out of the flesh, then a fat little zeppelin turned up, standing off the flesh
const BUD_R = [0.55, 0.6, 0.82, 1.08, 1.22, 1.25, 1.2, 1.06, 0.82, 0.47, 0], BUD_V = [0, 0.1, 0.22, 0.36, 0.5, 0.62, 0.74, 0.84, 0.92, 0.975, 1];
function budLine(b) {
  const pts = [], radii = [];
  for (let i = 0; i < BUD_V.length; i++) { const v = BUD_V[i]; pts.push(b.base.clone().addScaledVector(b.n, (0.3 + 3.5 * Math.sin(v * 1.5708)) * b.s).add(V(0, 3.3 * Math.pow(v, 1.7) * b.s, 0))); radii.push(BUD_R[i] * b.s); }
  return { pts, radii };
}
const budClear = (line, b) => { const L = budLine(b); let m = 1e9; for (let i = 0; i < L.pts.length; i++) m = Math.min(m, distToLine(line, L.pts[i]) - L.radii[i]); return m; };

// the surface axes of an arm at arc position i (fractional index): centre, tangent, and the two radial axes
function armAt(arm, fi, o) {
  const i = Math.min(arm.pts.length - 2, Math.floor(fi)), f = fi - i, a = arm.pts[i], b = arm.pts[i + 1];
  o.c.lerpVectors(a, b, f); o.t.subVectors(b, a).normalize();
  o.e.set(arm.dir.z, 0, -arm.dir.x); o.f.crossVectors(o.t, o.e).normalize();
  o.r = lerp(arm.radii[i], arm.radii[i + 1], f);
  return o;
}

// Buttons, bud arms, fruit, roosts and the flower: all placed by rule against the climb line.
export function planDetails(rng, plan, opts = {}) {
  const { line, arms, turn } = plan, detail = clamp(opts.detail ?? 1, 0.6, 1);
  const F = { c: V(), t: V(), e: V(), f: V(), r: 0 }, p = V(), n = V();
  const buttons = [], buds = [], fruits = [], roosts = [];
  const trunk = { pts: [], radii: [], dir: V(0, 0, 1), trunk: true };
  for (let y = -3; y <= 102; y += 5.25) { trunk.pts.push(V(0, y, 0)); trunk.radii.push(11 * (1 + 0.035 * Math.sin((y / 102) * Math.PI))); }
  for (let i = 1; i <= 9; i++) { const a = (i / 9) * Math.PI * 0.5; trunk.pts.push(V(0, 102 + 22 * Math.sin(a), 0)); trunk.radii.push(i === 9 ? 0 : 11 * Math.pow(Math.cos(a), 0.75)); }
  const all = [trunk, ...arms];
  for (const arm of all) {
    // buttons: six rows, 3 m apart along the form; only where the line comes within 34 m (further off a
    // 0.4 m dot is under 3 pixels and is left to the flat grade)
    const rows = arm.trunk ? 22 : 6, th0 = rng() * 6.283;
    let s = 1.5;
    for (let i = 0; i < arm.pts.length - 2; i++) {
      const seg = arm.pts[i].distanceTo(arm.pts[i + 1]);
      for (; s < seg; s += 3) {
        armAt(arm, i + s / seg, F);
        if (F.r < 1.2 || distToLine(line, F.c) > 34 + F.r) continue;
        for (let k = 0; k < rows; k++) {
          const th = th0 + (k / rows) * 6.283;
          n.copy(F.e).multiplyScalar(Math.cos(th)).addScaledVector(F.f, Math.sin(th));
          p.copy(F.c).addScaledVector(n, F.r - 0.02);
          if (p.x * p.x + p.z * p.z < 10.5 * 10.5 && !arm.trunk) continue;
          if (distToLine(line, p) > 30) continue;
          buttons.push({ p: p.clone(), n: n.clone() });
        }
      }
      s -= seg;
    }
    if (arm.trunk) continue;
    // bud arms: 3 m long, out and up, never toward the line (their tips keep 5.5 m)
    if (arm.fork) {
      const fk = plan.fork, back = V(-fk.tangent.x, 0, -fk.tangent.z).normalize(), inward = fk.out.clone().multiplyScalar(-arm.fork);
      for (const [dy, kb, ki, sc] of [[-9, 0.8, 0.45, 1.3], [5, 0.35, -0.75, 1.1]]) {
        let i = 0; while (i < arm.pts.length - 3 && arm.pts[i].y < fk.point.y + dy) i++;
        // (turned a little away from the line until its whole body keeps 5.6 m from it)
        for (const dk of [0, 0.25, 0.5, 0.8]) {
          n.copy(back).multiplyScalar(kb).addScaledVector(inward, ki - dk).normalize();
          const bud = { base: arm.pts[i].clone().addScaledVector(n, arm.radii[i] - 0.6), n: n.clone(), s: sc, arm };
          if (budClear(line, bud) >= 5.6) { buds.push(bud); break; }
        }
      }
    }
    const nb = Math.round((arm.fork ? 3 : 1 + rng() * 2.4) * detail);
    for (let b = 0, tries = 0; b < nb && tries < 30; tries++) {
      const fi = 3 + rng() * (arm.pts.length - 9), th = rng() * 6.283;
      armAt(arm, fi, F);
      n.copy(F.e).multiplyScalar(Math.cos(th)).addScaledVector(F.f, Math.sin(th));
      if (n.y < -0.3) continue;
      p.copy(F.c).addScaledVector(n, F.r + 1.6); p.y += 2.4;
      if (p.x * p.x + p.z * p.z < 16 * 16 || distToLine(line, p) < 6.5) continue;
      let hit = false; for (const o of arms) if (o !== arm) for (const q of o.pts) if (q.distanceTo(p) < 8.5) { hit = true; break; }
      if (hit) continue;
      { const bud = { base: F.c.clone().addScaledVector(n, F.r - 0.6), n: n.clone(), s: 0.8 + rng() * 0.5, arm }; if (budClear(line, bud) >= 6) buds.push(bud); } b++;
    }
    // fruit: pink eggs 2 m long near the tip, leaning out; and the roost row along the shoulder
    // (a fork arm also carries one beside the line, a little under the line's height there)
    if (arm.fork) {
      const fk = plan.fork, back = V(-fk.tangent.x, 0, -fk.tangent.z).normalize(), inward = fk.out.clone().multiplyScalar(-arm.fork);
      // (as near the line's own height at the fork as keeps it 7 m from the line)
      for (const [below, ki, kb] of arm.fork > 0 ? [[4, 0.4, 0.92], [5.5, 0.55, 0.84], [7, 0.75, 0.66]] : [[2.5, 0.75, 0.66]]) {
        let i = 0; while (i < arm.pts.length - 3 && arm.pts[i].y < fk.point.y - below) i++;
        n.copy(inward).multiplyScalar(ki).addScaledVector(back, kb).normalize();
        p.copy(arm.pts[i]).addScaledVector(n, arm.radii[i] * 0.92 + 0.8);
        if (distToLine(line, p) > 7) { fruits.push({ p: p.clone(), n: n.clone().add(V(0, 0.45, 0)).normalize(), s: 1.25, arm }); break; }
      }
    }
    const nf = arm.fork ? 2 : (rng() < 0.75 ? 1 : 2);
    for (let b = 0, tries = 0; b < nf && tries < 40; tries++) {
      const fi = arm.pts.length - 2 - (1.2 + rng() * 3.2), th = rng() * 6.283;
      armAt(arm, fi, F);
      n.copy(F.e).multiplyScalar(Math.cos(th)).addScaledVector(F.f, Math.sin(th)).addScaledVector(F.t, 0.5).normalize();
      p.copy(F.c).addScaledVector(n, F.r * 0.92 + 0.7);
      if (distToLine(line, p) < 6.5) continue;
      let hit = false; for (const q of fruits) if (q.p.distanceTo(p) < 2.6) hit = true;
      if (hit) continue;
      fruits.push({ p: p.clone(), n: n.clone(), s: 0.9 + rng() * 0.25, arm }); b++;
    }
    arm.shoulder = arm.elbow.clone().addScaledVector(arm.dir, -arm.bendR * 0.9); arm.shoulder.y = arm.h + arm.r * 0.98;
  }
  // roosts: rows of macaws on the level shoulders (the top line of the level run, eye toward the valley)
  const order = arms.filter((a) => !a.inner).sort((a, b) => a.h - b.h);
  const perRow = Math.max(3, Math.round(6 * detail));
  let quiet = 0;
  for (const arm of order) {
    const burst = !!arm.fork;
    if (!burst && quiet >= 48) continue;
    for (let k = 0; k < perRow + (burst ? 2 : 0); k++) {
      const rad = arm.reach - arm.bendR - 1.2 - k * (burst ? 2.8 : 1.75);
      if (rad < 19) break;
      p.set(arm.dir.x * rad, arm.h + arm.r * (0.94 + 0.06 * 0.9) + 0.36, arm.dir.z * rad);
      if (distToLine(line, p) < 5) continue;
      if (!burst) quiet++;
      roosts.push({ p: p.clone(), yaw: Math.atan2(arm.dir.x, arm.dir.z) + (rng() < 0.5 ? 1.57 : -1.57) + (rng() - 0.5) * 0.5, burst, ph: rng() * 6.283 });
    }
  }
  // the flower: its face looks back down the last straight of the climb; the ring sits in its throat
  const end = V(CLIMB[CLIMB.length - 1][0] * turn, CLIMB[CLIMB.length - 1][1], CLIMB[CLIMB.length - 1][2]);
  const prev = V(CLIMB[CLIMB.length - 3][0] * turn, CLIMB[CLIMB.length - 3][1], CLIMB[CLIMB.length - 3][2]);
  const d = end.clone().sub(prev).normalize(), face = d.clone().negate();
  const right = V().crossVectors(V(0, 1, 0), face).normalize(), up = V().crossVectors(face, right).normalize();
  const flower = { centre: end, face, right, up, back: d, discR: 10, hingeR: 8.7, petalLen: 16, petalW: 9.4 };
  return { trunk, buttons, buds, fruits, roosts, flower, detail };
}

// The macaw (shared with the world's pacing pair): a fat blue bean 1.4 m long, nose toward +Z, yellow cheek, one deep
// green dot for an eye. aPart marks the wings (+1 / -1); per instance aBird = (phase, fly 0..1). Toucan: pass body / bill pigments.
export function macawGeometry(pg, body = pg.blue, bill = pg.yellow) {
    const blueDk = body !== pg.blue ? body : { mid: pg.mix(pg.raw.blue, pg.raw.cream, 0.2), base: pg.raw.blue.clone(), rim: pg.mix(pg.raw.blue, pg.raw.deep, 0.45) };
    const part = (g, pig, x, y, z, k = 0) => { g.translate(x, y, z); paint(g, pig); g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(k), 1)); return g; };
    // (lead's note 8e: a clear bird, never a clump or a propeller: a bean body, a round head, a yellow breast and bill, a
    // long tail, and two long tapered wings that stay spread and beat slowly)
    const list = [part(ballGeometry(0.33, 0.34, 0.6, 9, 6), body, 0, 0, 0), part(ballGeometry(0.25, 0.25, 0.26, 8, 5), body, 0, 0.27, 0.47),
      part(ballGeometry(0.27, 0.2, 0.46, 7, 4), bill, 0, -0.17, 0.08), part(ballGeometry(0.14, 0.05, 0.8, 5, 4, 0, true), blueDk, 0, 0.02, -1.15), part(ballGeometry(0.09, 0.13, 0.15, 5, 3), bill, 0, 0.17, 0.72)];
    for (const sx of [1, -1]) {
      const wing = ballGeometry(0.06, 0.62, 0.36, 7, 6, 0.5, true); wing.rotateZ(-sx * Math.PI / 2);        // root broad, tip narrow, lying along x
      list.push(part(ballGeometry(0.035, 0.12, 0.13, 5, 3, 0, true), pg.yellow, sx * 0.232, 0.24, 0.5), part(ballGeometry(0.05, 0.05, 0.05, 4, 2), pg.flat(pg.raw.deep), sx * 0.225, 0.35, 0.6),
        part(wing, blueDk, sx * 0.74, 0.16, -0.06, sx));
    }
    const m = mergeGeometries(list, false); list.forEach((g) => g.dispose()); return m;
}
export function macawMaterial() {
  return gradeMaterial({ mode: 0, vertexDecl: 'attribute float aPart; attribute vec2 aBird;',
    vertexPre: `float wa = aPart * mix(-1.35, 0.14 + 0.5 * sin(uTime * 7. + aBird.x), aBird.y);
      if (abs(aPart) > 0.5) { vec2 wh = vec2(aPart * 0.22, 0.16);
        pos.x = wh.x + (pos.x - wh.x) * mix(0.3, 1., aBird.y);                      // folded short on the roost
        vec2 wq = pos.xy - wh; float wc = cos(wa), ws = sin(wa);
        pos.xy = wh + vec2(wc * wq.x - ws * wq.y, ws * wq.x + wc * wq.y); nrm.xy = vec2(wc * nrm.x - ws * nrm.y, ws * nrm.x + wc * nrm.y); }
      float rk = (1. - aBird.y) * 0.07 * sin(uTime * 1.3 + aBird.x);                 // roosting: rock as one piece
      pos.xy = vec2(pos.x - rk * pos.y, pos.y + rk * pos.x);` });
}

// ---------------------------------------------------------------------------------------------- the piece
const setInst = (geo, name, arr, size) => geo.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, tick = ctx.yield ? () => ctx.yield() : async () => {};
  const pg = opts.pigments || makePigments(opts.palette || PALETTE);
  const plan = await planCactus(rng, opts, tick);
  await tick();
  const det = planDetails(rng, plan, opts);
  await tick();
  const { arms, line, turn } = plan, fl = det.flower, group = new THREE.Group();
  const matTube = gradeMaterial({ mode: 0 }), matDome = gradeMaterial({ mode: 1 }), matFace = gradeMaterial({ mode: 2, side: THREE.DoubleSide });

  // --- body: trunk, arms, bud arms, the flower's neck and cup, the ring's bezel: one mesh, one grade
  const parts = [], neckPts = [];
  const greens = [pg.green, pg.greenDark, pg.greenPale];
  parts.push(paint(tubeGeometry(det.trunk.pts, det.trunk.radii, 36), pg.green));
  for (let i = 0; i < arms.length; i++) {
    const a = arms[i], k = a.fork ? 0 : (a.inner || a.tier === 0 ? 0 : Math.floor(rng() * 3));
    a.green = k; parts.push(paint(tubeGeometry(a.pts, a.radii, a.fork ? 30 : 20), greens[k]));
    if (i % 6 === 5) await tick();
  }
  for (const b of det.buds) {
    const L = budLine(b);          // (paler than the arm it stands on, so that it parts from it)
    parts.push(paint(tubeGeometry(L.pts, L.radii, 16), b.arm && b.arm.green === 2 ? pg.green : pg.greenPale));
  }
  await tick();
  {
    // neck: up out of the crown and over, into the back of the flower; then the cup that holds the disc
    const c = fl.centre, bk = fl.back, P0 = V(0, 116, 0), P3 = c.clone().addScaledVector(bk, 5.5), P1 = V(0, P3.y + 7, 0), P2 = P3.clone().addScaledVector(bk, 9);
    const curve = new THREE.CubicBezierCurve3(P0, P1, P2, P3), np = curve.getSpacedPoints(14); neckPts.push(...np);
    parts.push(paint(tubeGeometry(np, np.map((_, i) => 3.6 - 0.5 * Math.sin((i / 14) * Math.PI)), 18), pg.green));
    const cupR = [3.6, 5.4, 7.6, 9.2, 9.95, 9.9], cupD = [5.6, 4.6, 3.2, 1.8, 0.7, 0.1];
    parts.push(paint(tubeGeometry(cupD.map((x) => c.clone().addScaledVector(bk, x)), cupR, 32), pg.greenPale));
    const bez = [], br = [];
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * 6.2832; bez.push(c.clone().addScaledVector(fl.right, Math.cos(a) * 7.5).addScaledVector(fl.up, Math.sin(a) * 7.5).addScaledVector(fl.face, 0.35)); br.push(0.5); }
    parts.push(paint(tubeGeometry(bez, br, 8), pg.yellow));
  }
  const body = new THREE.Mesh(mergeGeometries(parts, false), matTube);
  for (const g of parts) g.dispose();
  group.add(body);
  await tick();

  // --- buttons: cream domes 0.4 m across (instanced), and fruit: pink eggs 2 m long
  const dummy = new THREE.Object3D(), qY = V(0, 1, 0), quat = new THREE.Quaternion();
  {
    const keep = det.buttons.filter((_, i) => det.detail >= 1 || (i % 5) < 5 * det.detail);
    const btnPig = { mid: pg.cream.mid, base: pg.cream.base, rim: pg.mix(pg.raw.cream, pg.raw.pink, 0.7) };       // a round cream dome with a pink-cream rim
    for (const near of [true, false]) {
      const list = keep.filter((bt) => (distToLine(line, bt.p) < 14) === near);
      const g = new THREE.SphereGeometry(near ? 0.29 : 0.22, near ? 12 : 7, near ? 4 : 2, 0, 6.2832, 0, 1.35); g.scale(1, 0.8, 1); g.translate(0, -0.05, 0);
      g.setAttribute('aG', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 3), 3));
      paintInstances(g, Math.max(1, list.length), btnPig);
      const m = new THREE.InstancedMesh(g, matTube, Math.max(1, list.length));
      dummy.position.set(0, 60, 0); dummy.scale.setScalar(0.001); dummy.updateMatrix(); m.setMatrixAt(0, dummy.matrix);
      list.forEach((bt, i) => { dummy.position.copy(bt.p); dummy.quaternion.setFromUnitVectors(qY, bt.n); dummy.scale.setScalar(1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
      m.frustumCulled = false; group.add(m);
    }
  }
  await tick();
  {
    const g = ballGeometry(0.62, 1.0, 0.62, 12, 8, 0.16);
    paintInstances(g, det.fruits.length, pg.pink);
    const m = new THREE.InstancedMesh(g, matTube, det.fruits.length);
    det.fruits.forEach((f, i) => { dummy.position.copy(f.p); dummy.quaternion.setFromUnitVectors(qY, f.n); dummy.scale.setScalar(f.s); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); });
    m.frustumCulled = false; group.add(m);
  }
  await tick();

  // --- the flower(s): a plain yellow disc (mode 1, its pale middle leans toward the eye) ringed by ten
  //     rigid cream paddles hinged on its rim (mode 2). Closed spindle at open 0, fanned at 1.
  // opts.sunDir (the sun's direction in the hero's own axes): the great flower turns one petal's middle line to where
  // the sun stands behind it, so that from the last straight the disc passes behind that petal and not through a gap
  const flowers = [{ c: fl.centre, face: fl.face, right: fl.right, up: fl.up, s: 1, openAt: -1, turn: 0.31 }];
  const nFlowers = opts.flowers === undefined ? 12 : (opts.flowers | 0);
  if (nFlowers > 1) {
    // the bouquet: a flower on each of (up to) eleven arm tips that stand 14.5 m or more from the line and 17 m or more
    // from the great flower's heart, the nearest to that heart first; each folds open as the line comes near it; the
    // great one is opened by the world (setFlower)
    const cand = arms.filter((a) => !a.fork).map((a) => { let bi = 0, bd = 1e9; line.pts.forEach((q, i) => { const d = q.distanceToSquared(a.tip); if (d < bd) { bd = d; bi = i; } }); return { a, d: Math.sqrt(bd), p: bi / (line.pts.length - 1) }; })
      .filter((x) => x.d > 14.5 && x.a.tip.distanceTo(fl.centre) > 17).sort((x, y) => x.a.tip.distanceTo(fl.centre) - y.a.tip.distanceTo(fl.centre)).slice(0, nFlowers - 1);
    // THE BOUQUET FACES THE WAY WE COME: every small flower looks at one place on the line, the point 60 m of line before
    // the ring (a place, not the eye), leaning a little out along its arm, so that none stands edge on to the line's
    // end. Each stands on a green cup a little off its arm tip and is as large as keeps its open petals 6.5 m
    // from the line (worked out from the place of the tip and the line, both whorls of petals sampled).
    const hFace = V(fl.face.x, 0, fl.face.z).normalize(), sp = V(), comeFrom = line.at(1 - 60 / line.len);
    const reach = (f, sc) => { let m = 1e9; for (const pa of [0.1, 0.5]) for (const k of [0.45, 0.75, 1]) for (let a = 0; a < 6.283; a += 0.35) {
      sp.copy(f.c).addScaledVector(f.right, Math.cos(a) * (fl.hingeR + fl.petalLen * k * Math.cos(pa)) * sc).addScaledVector(f.up, Math.sin(a) * (fl.hingeR + fl.petalLen * k * Math.cos(pa)) * sc).addScaledVector(f.face, fl.petalLen * k * Math.sin(pa) * sc);
      m = Math.min(m, distToLine(line, sp)); } return m; };
    for (const x of cand) {
      // (toward that place on the line, never tipped below 0.3 of upright, a little out along its arm)
      const face = comeFrom.clone().sub(x.a.tip).normalize(); face.y = Math.max(face.y, 0.3); face.addScaledVector(x.a.dir, 0.12).normalize(); if (face.dot(hFace) < 0.15) face.addScaledVector(hFace, 0.4).normalize();
      const right = V().crossVectors(V(0, 1, 0), face).normalize();
      const f = { c: V(), face, right, up: V().crossVectors(face, right).normalize(), s: 0.62, openAt: 0, tip: x.a.tip };
      for (; f.s > 0.3; f.s -= 0.04) { f.c.copy(x.a.tip).addScaledVector(face, 3.4 * f.s); if (reach(f, f.s) >= 6.5) break; }
      f.c.copy(x.a.tip).addScaledVector(face, 3.4 * f.s);
      if (reach(f, f.s) < 6.5) continue;
      // EACH OPENS AS WE COME NEAR IT: openAt is the share of the line at which the line first comes within OPEN_NEAR
      // metres of the flower's heart (found at the line's own even steps); its petals fold open over the next OPEN_RUN
      // metres of line. Each flower has its own place, so they open one after another as the climb finds them.
      let near = 0; while (near < line.pts.length - 1 && line.pts[near].distanceTo(f.c) > OPEN_NEAR) near++;
      f.openAt = near / (line.pts.length - 1);
      flowers.push(f);
    }
  }
  // THE SUN STANDS WHOLE BESIDE THE BOUQUET ALONG THE LAST STRAIGHT. opts.pickSun(test) lets the world choose the sun's one
  // direction with the hero's help. The eyes of the test are places on the hero's own line, one every 2 m of line along
  // the whole of its LAST STRAIGHT: the stretch that ends at the ring over which the line's direction stays within 2
  // degrees of its direction at the ring (found here by walking back from the ring in steps of 1 m of line).
  //   test(dir, need) -> { whole, eyes }: from how many of those eyes the direction dir stands 'need' radians and more
  //     clear of the trunk, every arm, the great flower's neck and the open great flower itself (its disc and its two
  //     whorls of petals, as the surfaces they are);
  //   test.hits(dir, within) -> the small flowers whose open petals or heart come within 'within' radians of dir as seen
  //     from ANY of the same eyes. The world returns { dir, drop }: the hero leaves out the flowers in drop.
  // A law of the place, fixed at build from the line and the cactus as they stand; it reads nothing of the eye.
  const sun = { straight: 0, eyes: [] };
  {
    const DEG = Math.PI / 180, te = line.tan(1);
    while (sun.straight < line.len - 1 && line.tan(1 - (sun.straight + 1) / line.len).angleTo(te) < 2 * DEG) sun.straight++;
    for (let m = sun.straight; m >= 0; m -= 2) sun.eyes.push(line.at(1 - m / line.len));
    // the open flower's own surface as points a step apart: the heart (domed on a small flower) and the two whorls
    const surface = (f, great, step, out) => {
      const ring = (rad, h) => { const n = Math.max(1, Math.ceil(6.2832 * rad / step)); for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; out.push({ c: f.c.clone().addScaledVector(f.right, Math.cos(a) * rad).addScaledVector(f.up, Math.sin(a) * rad).addScaledVector(f.face, h), r: step * 0.7 }); } };
      const dR = fl.discR * f.s; for (let r = 0; r <= dR; r += step) ring(r, great ? 0.3 : 3.4 * f.s * Math.pow(Math.max(0, 1 - (r / dR) ** 2), 0.7));
      for (const pa of [0.1, 0.5]) for (let y = 0; y <= fl.petalLen * f.s + 1e-6; y += step) ring(fl.hingeR * f.s + y * Math.cos(pa), y * Math.sin(pa) - 0.35 * f.s);
      return out;
    };
    const balls = surface(flowers[0], true, 2, []);
    for (const a of [det.trunk, ...arms]) for (let i = 0; i < a.pts.length; i++) balls.push({ c: a.pts[i], r: a.radii[i] + 0.5 });
    for (const q of neckPts) balls.push({ c: q, r: 3.6 });
    const small = flowers.map((f, i) => (i ? surface(f, false, 1.5, []) : []));
    const tv = V(); let pre = null, preNeed = -1;
    // for each eye and each ball: the direction to it and the cosine of (its angular radius + need)
    const prepare = (need) => {
      preNeed = need; pre = sun.eyes.map((E) => { const d = new Float32Array(balls.length * 4); balls.forEach((b, k) => { tv.subVectors(b.c, E); const l = tv.length(), al = l > b.r ? Math.asin(b.r / l) : Math.PI; d[k * 4] = tv.x / (l || 1); d[k * 4 + 1] = tv.y / (l || 1); d[k * 4 + 2] = tv.z / (l || 1); d[k * 4 + 3] = Math.cos(Math.min(Math.PI, al + need)); }); return d; });
    };
    const sunTest = (dir, need) => {
      if (need !== preNeed) prepare(need);
      let whole = 0;
      for (const d of pre) { let ok = true; for (let k = 0; k < d.length && ok; k += 4) if (d[k] * dir.x + d[k + 1] * dir.y + d[k + 2] * dir.z > d[k + 3]) ok = false; if (ok) whole++; }
      return { whole, eyes: sun.eyes.length };
    };
    sunTest.hits = (dir, within) => {
      const hits = [];
      for (let i = 1; i < flowers.length; i++) { let hit = false;
        for (const E of sun.eyes) { for (const b of small[i]) { tv.subVectors(b.c, E); const l = tv.length(); if (l <= b.r || tv.angleTo(dir) - Math.asin(b.r / l) < within) { hit = true; break; } } if (hit) break; }
        if (hit) hits.push(i); }
      return hits;
    };
    sun.test = sunTest; _debug.sunTest = sunTest;
    await tick();
    const pick = opts.pickSun ? await opts.pickSun(sunTest) : (opts.sunDir ? { dir: opts.sunDir, drop: [] } : null);
    await tick();
    if (pick) {
      sun.candidates = flowers.length; sun.dropped = pick.drop.length;
      for (const i of pick.drop.slice().sort((x, y) => y - x)) flowers.splice(i, 1);
      // (the great flower turns one petal's middle line to where the sun stands behind it, so that the disc goes behind a petal and not behind a gap between two)
      const a = Math.atan2(pick.dir.dot(fl.up), pick.dir.dot(fl.right)), st = 6.2832 / 10; flowers[0].turn = a - Math.round((a - 0.31) / st) * st;
    }
  }
  det.flowers = flowers;      // (for the world, which keeps its clouds and wheeling birds off them, and for the print-only checks)
  det.budLines = det.buds.map((b) => budLine(b)); det.neck = { pts: neckPts, radii: neckPts.map(() => 3.6) };
  // each small flower's cup and neck: a green calyx behind the disc, grown out of the arm's tip (one more smooth tube)
  { const cups = [], cupR = [3.0, 4.6, 7.2, 9.2, 10.05, 10.0], cupD = [6.4, 4.8, 3.2, 1.8, 0.7, 0.1];
    for (const f of flowers.slice(1)) cups.push(paint(tubeGeometry(cupD.map((d) => f.c.clone().addScaledVector(f.face, -d * f.s)), cupR.map((r) => r * f.s), 16), pg.greenPale));
    if (cups.length) { const cm = new THREE.Mesh(mergeGeometries(cups, false), matTube); cups.forEach((g) => g.dispose()); cm.frustumCulled = false; group.add(cm); } }
  const uOpen = { value: 1 }, uClimb = { value: 0.6 }, bas = new THREE.Matrix4(), rad = V(), tan = V(), pp = V();
  {
    const NP = 10;
    // (aPetal.y: under 0 on the great flower, which the world opens; on a small flower the share of the line at which it
    // begins to open; uOpenRun: OPEN_RUN metres as a share of the line)
    const mat = gradeMaterial({ mode: 2, uniforms: { uOpen, uClimb, uOpenRun: { value: OPEN_RUN / line.len } }, vertexDecl: 'attribute vec2 aPetal; uniform float uOpen; uniform float uClimb; uniform float uOpenRun;',
      vertexPre: `float po = aPetal.y < 0. ? uOpen : smoothstep(aPetal.y, aPetal.y + uOpenRun, uClimb);
        float pw = step(1.5, aPetal.x), px = aPetal.x - 2. * pw;      // pw: 1 on the inner whorl (every second petal), which stands up as a cup over the outer one
        po = smoothstep(px * 0.3, 0.7 + px * 0.3, po);
        // an open petal is cupped across its width and its tip curls back: modelled, never a flat cut-out
        pos.z += po * (0.05 * pos.x * pos.x - 2.6 * pos.y * pos.y * pos.y / 4096.);
        float pa = mix(2.06, mix(0.1, 0.5, pw), po) + 0.05 * po * sin(uTime * 1.2 + px * 6.2832), pc = cos(pa), ps = sin(pa);     // open petals rock, rigid
        pos.yz = vec2(pos.y * pc - pos.z * ps, pos.y * ps + pos.z * pc);
        nrm.yz = vec2(nrm.y * pc - nrm.z * ps, nrm.y * ps + nrm.z * pc);
        g.yz = vec2(g.y * pc - g.z * ps, g.y * ps + g.z * pc);` });
    const petalMesh = (list, nu, nv, pigs) => {
    const n = list.length * NP, g = lensGeometry(fl.petalLen, fl.petalW + 1.4, nu, nv, 0.06, 0.6), ap = new Float32Array(n * 2);
    paintInstances(g, n, pigs ? Array.from({ length: n }, (_, i) => pigs[Math.floor(i / NP)]) : pg.cream);
    const m = new THREE.InstancedMesh(g, mat, n);
    list.forEach((f, fi) => { for (let i = 0; i < NP; i++) {
      const an = (i / NP) * 6.2832 + (f.turn ?? 0.31);
      rad.copy(f.right).multiplyScalar(Math.cos(an)).addScaledVector(f.up, Math.sin(an)); tan.crossVectors(rad, f.face);
      bas.makeBasis(tan, rad, f.face).scale(V(f.s, f.s, f.s)); pp.copy(f.c).addScaledVector(rad, fl.hingeR * f.s).addScaledVector(f.face, -0.35 * f.s); bas.setPosition(pp);
      m.setMatrixAt(fi * NP + i, bas); ap[(fi * NP + i) * 2] = ((i * 7) % NP) / NP * 0.98 + 2 * (i % 2); ap[(fi * NP + i) * 2 + 1] = f.openAt;
    } });
    setInst(g, 'aPetal', ap, 2);
    m.frustumCulled = false; group.add(m);
    };
    petalMesh(flowers.slice(0, 1), 8, 18);
    if (flowers.length > 1) petalMesh(flowers.slice(1), 4, 8, flowers.slice(1).map((_, i) => [pg.pink, pg.yellow, pg.pink, pg.yellow, pg.cream][i % 5]));      // the small ones: pink and yellow in turn, every fifth cream (the great one is cream: the bouquet round it is colour)
    // the disc: flat to 8.6 m then rolled under at the rim
    const rr = [0, 3.5, 7, 8.7, 9.6, 10, 9.7], yy = [0.3, 0.3, 0.3, 0.26, 0.05, -0.5, -1.1], S = 44, pos = [], nor = [], ag = [], uvs = [], idx = [];
    for (let j = 0; j < rr.length; j++) for (let i = 0; i <= S; i++) {
      const th = (i / S) * 6.2832, c = Math.cos(th), s = Math.sin(th), sl = j < 4 ? 0 : j === 4 ? 0.5 : 1;
      pos.push(c * rr[j], yy[j], s * rr[j]); nor.push(c * sl, 1 - sl * 0.9, s * sl); ag.push(c * rr[j] / 10, 0, s * rr[j] / 10); uvs.push(th * 10, rr[j]);
    }
    for (let j = 0; j < rr.length - 1; j++) for (let i = 0; i < S; i++) { const q = j * (S + 1) + i, r2 = q + S + 1; idx.push(q, q + 1, r2, q + 1, r2 + 1, r2); }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    dg.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 3)); dg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); dg.setIndex(idx);
    const discMesh = (g, list, pigs) => { paintInstances(g, list.length, pigs); const dm = new THREE.InstancedMesh(g, matDome, list.length);
      list.forEach((f, i) => { bas.makeBasis(f.right, f.face, tan.crossVectors(f.right, f.face)).scale(V(f.s, f.s, f.s)); bas.setPosition(f.c); dm.setMatrixAt(i, bas); });
      dm.frustumCulled = false; group.add(dm); };
    discMesh(dg, flowers.slice(0, 1), pg.yellow);
    if (flowers.length > 1) {
      const dg2 = dg.clone(), q = dg2.attributes.position;
      for (let i = 0; i < q.count; i++) { const r2 = Math.min(1, Math.hypot(q.getX(i), q.getZ(i)) / 10); q.setY(i, q.getY(i) + 3.4 * Math.pow(Math.max(0, 1 - r2 * r2), 0.7)); }
      discMesh(dg2, flowers.slice(1), flowers.slice(1).map((_, i) => (i % 5 === 1 || i % 5 === 3 ? pg.pink : pg.yellow)));                              // (a yellow flower has a pink heart)
    }
  }
  await tick();

  // --- the pink house at its foot, 6 m tall, the size of its thumb: cube, red-earth wedge, painted door
  const houseAt = V(turn * (13 + rng() * 5), 0, 18 + rng() * 5), houseYaw = turn * (0.25 + rng() * 0.3);
  {
    const w = 2.7, d = 2.3, h = 4.1, top = 6, o = 0.3, e = 0.08, hp = rng() < 0.75 ? pg.pink : pg.yellow;
    const Q = (...a) => a.map((p) => V(p[0], p[1], p[2]));
    const walls = faceGeometry([Q([-w, 0, d], [w, 0, d], [w, h, d], [-w, h, d]), Q([w, 0, d], [w, 0, -d], [w, h, -d], [w, h, d]), Q([w, 0, -d], [-w, 0, -d], [-w, h, -d], [w, h, -d]), Q([-w, 0, -d], [-w, 0, d], [-w, h, d], [-w, h, -d])]);
    const W = w + o, D = d + o, roof = faceGeometry([Q([-W, h, D], [W, h, D], [W, top, 0], [-W, top, 0]), Q([W, h, -D], [-W, h, -D], [-W, top, 0], [W, top, 0]), Q([W, h, D], [W, h, -D], [W, top, 0]), Q([-W, h, -D], [-W, h, D], [-W, top, 0])]);
    const door = faceGeometry([Q([-0.65, 0, d + e], [0.65, 0, d + e], [0.65, 2.5, d + e], [-0.65, 2.5, d + e]), Q([w + e, 0, 0.5], [w + e, 0, -0.7], [w + e, 2.4, -0.7], [w + e, 2.4, 0.5])]);
    const shut = faceGeometry([Q([-2.1, 1.5, d + e], [-1.2, 1.5, d + e], [-1.2, 2.9, d + e], [-2.1, 2.9, d + e]), Q([1.2, 1.5, d + e], [2.1, 1.5, d + e], [2.1, 2.9, d + e], [1.2, 2.9, d + e]), Q([-w - e, 1.5, 0.6], [-w - e, 2.9, 0.6], [-w - e, 2.9, -0.6], [-w - e, 1.5, -0.6])]);
    const hg = mergeGeometries([paint(walls, hp), paint(roof, pg.earth), paint(door, pg.flat(pg.raw.deep)), paint(shut, pg.flat(pg.raw.blue))], false);
    const house = new THREE.Mesh(hg, matFace); house.position.copy(houseAt); house.rotation.y = houseYaw; group.add(house);
  }
  await tick();

  // --- macaws: fat blue beans 1.4 m long in profile, yellow cheek, one deep green dot for an eye; they
  //     sit in rows on the shoulders; the rows on the fork's shoulders burst with the climb (setClimb)
  const birds = det.roosts, nB = birds.length, bAttr = new Float32Array(nB * 2);
  const bg = macawGeometry(pg, opts.birdBody, opts.birdBill), matBird = macawMaterial();
  const birdMesh = new THREE.InstancedMesh(bg, matBird, nB), bFly = new THREE.InstancedBufferAttribute(bAttr, 2);
  bg.setAttribute('aBird', bFly); birdMesh.frustumCulled = false; group.add(birdMesh);
  let nBurst = 0;
  const mS = (m) => m / line.len;            // metres of the climb line as a share of it
  const seatQ = [], bursters = [], perches = arms.filter((a) => a.inner || a.tier === 0).map((a) => a.tip);
  const eul = new THREE.Euler(), side = V(), upv = V(), tg = V(), lp = V(), q1 = new THREE.Quaternion(), mtx = new THREE.Matrix4(), one = V(1, 1, 1), big = V(1.7, 1.7, 1.7), zAx = V(0, 0, 1);
  birds.forEach((b, i) => {
    seatQ.push(new THREE.Quaternion().setFromEuler(eul.set(0, b.yaw, 0)));
    if (b.burst) b.p.y += 0.28; mtx.compose(b.p, seatQ[i], b.burst ? big : one); birdMesh.setMatrixAt(i, mtx); bAttr[i * 2] = b.ph; bAttr[i * 2 + 1] = 0;
    if (b.burst && (nBurst++ % 2) === 0) {
      // lane: UNDER the line (the birds rise below us as the line climbs, and pass between the fork's arms with 2 m of
      // air either side), 6.8 m and more from the line, never more than 4.6 m to its side, 12 to
      // 39 m ahead of the eye's place on it, no two at one angle or one distance; each drifts a little and pulls ahead.
      // Each leaves its seat as the climb comes within 56 m of line of the fork's point, one after another 4.5 m of line apart.
      const k = bursters.length, pc = plan.fork.p;
      const rank = (k * 5) % 16, lat = (k % 2 ? 1 : -1) * [4.6, 3.1, 1.5][rank % 3], drop = Math.max(4.8 + (rank % 4) * 0.8, Math.sqrt(6.8 * 6.8 - lat * lat)), rho = Math.hypot(lat, drop), ang = Math.atan2(-drop, lat);
      bursters.push({ i, p0: pc - mS(56) + (k % 8) * mS(4.5) + ((k >> 3) & 1) * mS(2.25) + rng() * mS(1.5), ang, rho, lat, drop, lead: 12 + rank * 1.7 + rng() * 0.4, run: 30 + rng() * 30, pL: 1, perch: null, away: false, yaw: k * 1.9 });
    }
  });
  // where a bursting macaw is at climb share p: seat -> a lane that runs ahead of the eye and winds slowly
  // round the line -> a perch on an arm tip by the flower (or, where no tip can be reached in clear air, away)
  // (all in metres of line: it pulls ahead between 26 m and 112 m of line after it left its seat; the lanes end LANE_END
  // metres of line before the ring; past the fork, from 9 m to 34 m of line after its point, the lanes fan out)
  const LANE_END = 1 - mS(37.5);
  const aheadOf = (B, p) => (B.lead + B.run * smoothstep(B.p0 + mS(26), B.p0 + mS(112), p)) / line.len;
  function lanePoint(B, p, out) {
    const pl = Math.min(p + aheadOf(B, p), LANE_END), fan = smoothstep(plan.fork.p + mS(9), plan.fork.p + mS(34), pl);
    const la = B.lat * (1 + 1.05 * fan), dr = B.drop * (1 + 0.55 * fan), rho = Math.min(Math.hypot(la, dr), 11.2), ba = Math.atan2(-dr, la);
    tg.copy(line.tan(pl)); side.crossVectors(tg, zAx.set(0, 1, 0)).normalize(); upv.crossVectors(side, tg);
    return out.copy(line.at(pl)).addScaledVector(side, Math.cos(ba) * rho).addScaledVector(upv, Math.sin(ba) * rho);
  }
  function birdPose(B, p, pos, quat) {
    const seat = birds[B.i].p, a = smoothstep(B.p0, B.p0 + mS(11), p), land = smoothstep(B.pL - mS(3.5), B.pL + mS(26), p);     // off its seat over 11 m of line; onto its perch over 30 m
    lanePoint(B, p, lp);
    pos.lerpVectors(seat, lp, a); if (land > 0) pos.lerp(B.perch, land);
    if (quat) { quat.setFromUnitVectors(zAx.set(0, 0, 1), tg); quat.slerp(seatQ[B.i], 1 - a); if (land > 0 && !B.away) quat.slerp(q1.setFromEuler(eul.set(0, B.yaw, 0)), land); }
    return B.away ? a : a * (1 - land);
  }
  {
    const used = new Map(), E = V(), X = V(), tips = arms.filter((x) => x.tip.y > 96).map((x) => x.tip);
    for (const B of bursters) {
      B.pL = 1; for (let p = B.p0; p < 1; p += mS(0.75)) if (p + aheadOf(B, p) >= LANE_END) { B.pL = p; break; }       // (where its lane ends, found at steps of 0.75 m of line)
      lanePoint(B, 1, E);
      let found = null;
      for (let c = 0; c < tips.length && !found; c++) {
        const tip = tips[(c + B.i) % tips.length]; if ((used.get(tip) || 0) >= 3) continue;
        const k = used.get(tip) || 0; X.copy(tip).add(V(Math.cos(k * 2.1 + 0.4) * 1.5, 0.3 - 0.2 * k * 0.3, Math.sin(k * 2.1 + 0.4) * 1.5));
        let ok = true; for (let q = 0; q <= 16 && ok; q++) if (distToLine(line, lp.lerpVectors(E, X, q / 16)) < 5.2) ok = false;
        if (ok) { found = X.clone(); used.set(tip, k + 1); }
      }
      if (found) B.perch = found;
      else { B.away = true; B.perch = E.clone().add(X.subVectors(E, line.at(LANE_END)).normalize().multiplyScalar(70)).add(V(0, 35, 0)); }
    }
  }
  await tick();

  // --- anchors, progress, update
  const flyThrough = CLIMB.map((p) => V(p[0] * turn, p[1], p[2]));
  const anchors = {
    flyThrough,
    fork: { position: plan.fork.point.clone(), p: plan.fork.p },
    portalSeat: { position: fl.centre.clone().addScaledVector(fl.face, 0.5), normal: fl.face.clone(), radius: 7 },
    flowerCentre: fl.centre.clone(), crown: V(0, 130, 0), houseAt: houseAt.clone(),
    shoulders: arms.filter((a) => !a.inner).map((a) => a.shoulder.clone()), tips: perches.map((t) => t.clone()),
  };
  let climb = 0.6, climbDrawn = -1;
  const bp = V(), bq = new THREE.Quaternion();
  function placeBirds() {
    if (climb === climbDrawn) return;
    climbDrawn = climb;
    for (const B of bursters) { const fly = birdPose(B, climb, bp, bq); mtx.compose(bp, bq, big); birdMesh.setMatrixAt(B.i, mtx); bAttr[B.i * 2 + 1] = fly; }
    birdMesh.instanceMatrix.needsUpdate = true; bFly.needsUpdate = true;
  }
  placeBirds();
  const hero = {
    object: group, radius: 80, height: 150, center: V(0, 72, 0), anchors, ground: true, groundY: 0,
    plan, details: det, sun, style: { STYLE, matTube, matDome, matFace, pigments: pg },
    setClimb(p) { climb = clamp(p, 0, 1); uClimb.value = climb; },
    setFlower(o) { uOpen.value = clamp(o, 0, 1); },
    birdAt(k, p, out = V()) { birdPose(bursters[k], p, out, null); return out; }, burstCount: bursters.length,
    worldAnchors() {
      group.updateMatrixWorld(true);
      const M = group.matrixWorld, pt = (v) => v.clone().applyMatrix4(M), dr = (v) => v.clone().transformDirection(M);
      return { flyThrough: flyThrough.map(pt), fork: { position: pt(anchors.fork.position), p: anchors.fork.p },
        portalSeat: { position: pt(anchors.portalSeat.position), normal: dr(anchors.portalSeat.normal), radius: 7 },
        flowerCentre: pt(anchors.flowerCentre), crown: pt(anchors.crown), houseAt: pt(anchors.houseAt), shoulders: anchors.shoulders.map(pt), tips: anchors.tips.map(pt) };
    },
    update(dt, time) { STYLE.uTime.value = time; placeBirds(); },
    dispose() {},
  };
  _debug.hero = hero;
  return hero;
}
