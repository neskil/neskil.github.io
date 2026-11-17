// THE SUN PRINT (sun-print-meadow): the style kit of the cyanotype world, and its hero, the dandelion clock.
//
// ============================ STYLE KIT: makeStyle(ctx, opts) -> style (one per world) ============================
// opts: palette (the brief's 7 hex strings), light [x,y,z] toward the unseen light (default behind/right, 62 deg up),
//       brush [x,z] streak direction, exposure (post exposure the inks are solved for, default 1), whiteCap (1.0),
//       far (220), ghost (0.72), wake (4 s), window (160 m), bufferSize (1024; the world asks for 2048 off phones), lead (45 m),
//       band (the bare margin's greatest height is about 2.5 x this, in degrees; it wanders down to nothing, see sp_margin), gain.
// style.palette   { prussian, deep, coat1, paper, milk, sensitiser, exposed }: the brief's colours as THREE.Color (reference).
// style.ink(hex)  the linear value that leaves ACES as that hex (the materials already use it; do not feed hex in raw).
// style.density({ kind, ... })  THE one white material; alpha is density, normal blending, no depth write, unsorted.
//     kind 'solid'  closed mesh with normals, e.g. style.tube(pts, radii): chord density 1-exp(-k*|n.v|); k, hollow (0..0.9 = pipe)
//     kind 'card'   sheet with uv, e.g. style.blade(pts, widths, side) or style.cards([{c,u,v}]): alpha/max(|n.v|,0.3);
//                   alpha (0.2-0.4), pattern 'vein' | 'ring' | 'disc' | glsl setting `pat`, map (canvas, r = vein density)
//     kind 'thread' style.threads([{pts,w,w1,a,a1}]): camera-facing ribbons, never under 1.6 px (lose alpha, not width)
//     small: true   part scales away between 150 and 180 m.  pre / move: GLSL hooks (declarations / statements changing
//                   pos, dir, wid, alp in object space after the instance matrix): sway, uncoiling, flight go here.
//     Every density is multiplied by exp(-d/far) and by `ghost` until the second rinse front has passed it.
//     Colour: a card's film is the milk ink (uMilk) and piles up to milky blue, never to cream; its pattern (veins, rims,
//     seeds), threads and solids are paper white, and where a single layer is nearly solid (alpha > 0.72) the white is
//     lifted by opts.core (1.0; judged before distance thins it) so that cores leave the tone curve at the paper's own hex. style.glsl = { noise, front }.
// style.paper()   material for the sheet (any mesh at y 0, renderOrder > the sky's): coat, streaks, tide lines, both
//                 rinse lips with bubbles, the sensitised patch, the ragged coat edge, and the exposure buffer E.
// style.makeSky() the dome (kept on the camera by style.update): flat brushed coat, zenith deepening, and the bare margin as
//                 dry-brush hairs along the horizon (rows a quarter of a degree tall, each ending at its own place).
//                 (ROUND 4: no sensitiser is drawn any more, anywhere; uSens, uGrey, uSensAt, uSensW and uExpose are kept
//                 only so that callers need not change. The lip is a line in stretches, gone by 70 m; the sky's bare
//                 margin is short soft dashes, never a line along the horizon.)
//                 The ground's coat runs out past the horizon everywhere; the dry sensitiser patch is clear yellow-green
//                 with paper-pale shadows, the blue coming up along the brush tracks ahead of rinse one's lip.
// style.shadow({ pattern: 'disc' | 'flat' | 'star' | glsl setting `den`, soft, alpha, pre, move }) + style.exposure.add(mesh)
//                 a proxy sheared along the light onto y 0 and MIN-blended into E. Shadows are white and exist only on paper.
// style.exposure  { add, compile(), preroll(camera, fn, steps, sub), stamp(), texel, wake, hold (1 = the cloud: nothing prints back), size, lead }
// style.rinse(i, nx, nz, offset)  rinse front i (1 | 2): the line dot(n, xz) = offset, water behind it. Defaults: both done.
// style.uniforms  shared; drive uExpose (0..1 greying of dry sensitiser), uSensAt (x, z, radius of the yellow-green patch;
//                 default none), uSheet (x, z, half-size of the coat, 600), uSkyRinse (0..1 arc of the 2nd rinse up the sky),
//                 uBand (margin deg, gap azimuth, gap half-width: no margin hairs behind a white hero; the inner 3/4 of the gap is clear), uGhost.
//                 uStar (x, z, radius, phase): a 22-spoke star shadow drawn on the paper where it is now, with no history.
// style.update(dt, time, camera)  once a frame, AFTER every mover (and hero.update) has been placed. style.dispose().
// Rules of the styleNote -> how: two inks + white = ink() values in paper()/makeSky(), white = uWhite everywhere else;
// nothing lit = no lights, no normals used except as density; line = thread or fwidth vein; shadow = E only; distance
// thins = exp(-d/far) on alpha, paper sinks to `deep`; hand's errors = sp_streak, tide, bubbles, bristle edge;
// motion = E, which rises 1/wake per second. The cold-press grain pass is the world's (not here).
//
// ============================ HERO: buildHero(ctx, opts) ============================
// The clock: hollow stalk 22 m, bract collar, pitted heart, 180 seeds (achene, 5 m beak, star of 90 filaments), ~8.1 m radius.
// Local frame = the brief's world frame, place it unrotated: camera comes up +Z on the +X side, the exit is at opts.exit.
// opts: style (the world's shared instance; without it the hero makes its own, plus a sheet and sky, and loops the show),
//       palette, detail (0.6-1: filaments per star), exit [-42,20,54], passRadius 26, passY 20, heartY 22, shedCount 70.
// Returns { object, radius 11, height 31, center, anchors, style, update, dispose, setProgress(u), setShed(seconds) }.
// setProgress(u 0..1) -> shed time -1..11 s (brief 28 s..40 s): 0 s first seed lets go, 4 s seventy are loose, they fly
//   at 13 m/s down the lane beside/above the camera line and converge through the portal ring. Never wall-clock.
// (The world now routes its own course: one long straight that passes the heart at passRadius and ends at opts.exit, which is
//  exactly anchors.lane extended backward. anchors.flyThrough below is the older, tighter swing, kept for the stand-alone viewer.)
// anchors (local): heart; globeRadius; shadowCentre (on the paper); portalSeat { position, facing }; flyThrough (ordered
//   points: straight approach at x = passRadius, 60 deg arc round the heart at passRadius, tangent run to the exit);
//   lane { start, dir, length } (the last straight); wind; viewpoints { reveal, blaze, swing }.
// Cost: 39.8k triangles, 6 draws (+3 proxy draws into E, 400 triangles); standalone adds sheet and sky. Build ~60 ms.
// Assumes post: exposure 1, bloom strength 0 (paper does not glow), saturation 1, contrast 1, little or no vignette.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEF_PALETTE = ['#0B3C6F', '#06213F', '#1F5C97', '#F3F1E8', '#A9C4DE', '#C6CF6A', '#9DB0A0'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the print
// ---------------------------------------------------------------------------------------------------------
const GLSL_NOISE = /* glsl */`
float sp_h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sp_vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sp_h21(i), sp_h21(i + vec2(1., 0.)), f.x), mix(sp_h21(i + vec2(0., 1.)), sp_h21(i + vec2(1., 1.)), f.x), f.y); }
`;

// The two rinse fronts are straight lines travelling over the paper: R = (nx, nz, offset, phase).
// sp_front() > 0 where the water has already passed.
const GLSL_FRONT = /* glsl */`
uniform vec4 uR1, uR2;
float sp_front(vec4 R, vec2 p){
  vec2 n = R.xy; float q = dot(vec2(-n.y, n.x), p);
  return R.z - dot(n, p) + 2.2 * sin(q * 0.045 + R.w) + 1.1 * sin(q * 0.13 - R.w * 1.7) + 3. * (sp_vn(p * 0.05) - .5);
}
`;

// The coat: what the brush left on the sheet. Used by the paper plane and by the sky (the same sheet stood up).
const GLSL_COAT = /* glsl */`
uniform vec3 uCoat1, uPruss, uDeep, uPaper, uSens, uGrey, uMilk;
uniform vec2 uSensW;            // the sensitised band beyond rinse one's lip: (half-width across the course m, depth beyond the lip m)
uniform float uViewH;
uniform float uTime, uExpose, uSkyRinse;
uniform vec3 uSensAt, uSheet;   // (x, z, radius) of the still-sensitised patch; (x, z, radius) of the coated sheet
uniform vec2 uBrush;            // the one direction every streak runs
uniform vec4 uStar;             // our own star's shadow as it lies now: (x, z, radius m, spoke phase); radius 0 = none
uniform vec3 uBand;             // bare margin at the horizon: (height deg, azimuth of a gap where the coat reaches the ground, gap half-width rad)
// the uneven margin: 0 where the brush ran the coat right out to the edge, 1 where it stopped well short
float sp_margin(float az){ return smoothstep(0.47, 0.8, sp_vn(vec2(az * 3.1 + 1.7, 3.3)) * 0.65 + sp_vn(vec2(az * 9.3, 8.1)) * 0.35); }
// a few bubbles dried into the coat: thin pale rings, a seventh of the cells of a loose grid (g: cells, fw: width of one pixel in cells)
float sp_ring(vec2 g, float fw){
  vec2 id = floor(g); float h = sp_h21(id + 2.7);
  vec2 d = fract(g) - .5 - (vec2(sp_h21(id + 3.1), sp_h21(id + 9.7)) - .5) * .6;
  float r = 0.035 + 0.075 * sp_h21(id + 5.5);
  return (1. - smoothstep(0., fw * 1.5 + 0.004, abs(length(d) - r))) * step(0.86, h) * (1. - smoothstep(0.015, 0.05, fw));
}
float sp_streak(vec2 p){
  vec2 q = vec2(dot(p, uBrush), dot(p, vec2(-uBrush.y, uBrush.x)));
  return sp_vn(vec2(q.x * 0.008, q.y * 0.33)) * .55 + sp_vn(vec2(q.x * 0.02 + 7., q.y * 1.4)) * .3 + sp_vn(vec2(q.x * 0.05 + 3., q.y * 5.)) * .15 - .5;
}
// lip of a rinse sheet: a 3 m band 8 percent lighter, one thin white line, a few bubbles that drift and pop
vec3 sp_lip(vec3 c, float s, float fw, vec2 p, float k){     // k: 1 near, 0 far (a lip half a kilometre off is not a line on the horizon)
  float band = smoothstep(0., .3, s) * (1. - smoothstep(2., 3.2, s));
  c *= 1. + 0.08 * band;
  float line = 1. - smoothstep(0., fw * 1.5 + 1e-4, abs(s - 0.12));
  c = mix(c, uPaper, line * 0.75 * k);
  vec2 g = p / 2.6 + vec2(0.07, 0.05) * uTime, id = floor(g);
  float h = sp_h21(id), life = sp_h21(id + 17.3) * 16. + 1.;
  vec2 d = (fract(g) - .5 - (vec2(sp_h21(id + 3.1), sp_h21(id + 9.7)) - .5) * .62) * 2.6;
  float r = 0.1 + 0.24 * sp_h21(id + 5.5), pop = smoothstep(life - 1.2, life, s);
  float ring = 1. - smoothstep(0., fw * 1.4 + 0.02, abs(length(d) - r * (1. + pop * .6)));
  c = mix(c, uPaper, ring * step(0.87, h) * smoothstep(.3, 1., s) * (1. - pop) * 0.65);
  return c;
}
// p: metres on the sheet; E: exposure, 1 where light reached (ink), 0 in shadow (bare paper); far: 0..1 sinking to deep blue
vec3 sp_paper(vec2 p, float E, float Ec, float far, float dist){
  float s1 = sp_front(uR1, p), s2 = sp_front(uR2, p);
  float fw1 = fwidth(s1), fw2 = fwidth(s2);
  float st = sp_streak(p);
  vec3 ink = mix(uCoat1, uPruss, smoothstep(0., 5., s2));
  float bs = sp_vn(vec2(dot(p, uBrush) * 0.012 + 5., dot(p, vec2(-uBrush.y, uBrush.x)) * 2.6));     // single bristle tracks
  ink = mix(ink, uDeep, far) * (1. + 0.22 * st + 0.09 * (smoothstep(0.62, 0.78, bs) - smoothstep(0.2, 0.36, 1. - bs)) * (1. - far));
  float tn = sp_vn(p * 0.011 + 3.7) + 0.15 * sp_vn(p * 0.06);
  float tw = fwidth(tn) * 1.6 + 1e-4;
  float tide = (1. - smoothstep(0., tw, abs(tn - 0.66))) * 0.34 + (1. - smoothstep(0., 0.05, tn - 0.66)) * step(0.66, tn) * 0.1;   // a hard edge, a pale wash inside it
  ink *= 1. + (tide + 0.3 * sp_ring(p / 13., fwidth(p.x) / 13. + fwidth(p.y) / 13.)) * (1. - far);
  float sh = max(1. - E, 0.);
  // our own star: its spokes are drawn where it is now and leave nothing behind (only its small eye writes a wake into E)
  { vec2 sq = (p - uStar.xy) / max(uStar.z, 0.01); float sr = length(sq), sa = (sr < 1e-4) ? 0. : atan(sq.y, sq.x);
    float sk = abs(fract(sa * 3.5014 + uStar.w) - .5) * 2., sv = sk * max(sr, .2);
    // how far the spoke pattern turns across one pixel, taken from the position itself (no seam, and it knows which way the
    // paper is foreshortened): spokes that run up the picture stay crisp, those squeezed sideways go to their own average
    vec2 sdx = dFdx(sq), sdy = dFdy(sq);
    float sdk = 7. * (abs(sq.x * sdx.y - sq.y * sdx.x) + abs(sq.x * sdy.y - sq.y * sdy.x)) / max(sr * sr, 2e-3);
    float sw = min(max(sr, .2) * sdk + sk * fwidth(sr), 0.5) * 0.7 + 0.01;
    float sund = smoothstep(0.55, 1.3, sdk);
    float spoke = mix((1. - smoothstep(0.045 - sw * 0.2, 0.045 + sw, sv)) * min(1., 0.09 / max(sw, 0.09) + 0.35), 0.42, sund) * (1. - smoothstep(0.62, 1., sr)) * 0.85;
    sh = max(sh, max(spoke, 0.1 * (1. - smoothstep(0.3, 1., sr))) * step(sr, 1.) * step(1e-3, uStar.z)); }
  // the comb: the fine wakes of the clock's seeds have a channel of their own, so they stay lines; they fade out before the lower edge of the picture
  { float cs = max(1. - Ec, 0.); sh = max(sh, cs * smoothstep(0.03, 0.075, gl_FragCoord.y / max(uViewH, 1.))); }
  float shw = sh * sqrt(sh);
  // a wake is bright at its head and sinks back evenly to the eye; its half-tone is the cyanotype's own milky blue (never a grey)
  vec3 wet = mix(mix(ink, uMilk, smoothstep(0., 0.62, shw) * 0.85), uPaper * (1. + 0.6 * smoothstep(0.8, 1., shw)), smoothstep(0.3, 0.92, shw));
  // (No sensitiser is left on the sheet: the print is two inks and nothing else. What tells the water's edge is tone alone:
  //  beyond the first rinse's lip the coat is a little under-developed, a pale breath of the milk ink that comes up along the
  //  brush tracks hair by hair and is gone within a dozen metres; a soft exposure edge, never a shape.)
  vec2 bq = vec2(dot(p, uBrush), dot(p, vec2(-uBrush.y, uBrush.x)));
  float dn = sp_vn(vec2(bq.x * 0.02, bq.y * 0.9)) * .5 + sp_vn(vec2(bq.x * 0.05 + 5., bq.y * 2.3 + 2.)) * .5;
  float un = (1. - smoothstep(-0.6, 0.6, s1)) * exp(min(s1, 0.) / 9.) * (1. - smoothstep(30., 75., dist));
  vec3 c = mix(wet, uMilk, un * (0.1 + 0.3 * smoothstep(0.35, 0.75, dn)) * (1. - smoothstep(0.1, 0.5, sh)));
  // a lip is a line only near us and only in stretches (the water's edge is ragged): running away it breaks up and is gone by 70 m
  float lk = (1. - smoothstep(22., 70., dist)) * smoothstep(0.3, 0.62, sp_vn(p * 0.035 + 3.)); lk *= lk;       // (round 5: the stretches are tens of metres long with soft ends; the old ones broke every metre or two across the brush tracks and read as a dashed line)
  c = sp_lip(c, s1, fw1, p, lk); c = sp_lip(c, s2, fw2, p + 31., lk);
  // (the coat runs out past the horizon everywhere: the uneven margin is the sky's, as dry-brush hairs, see sp_sky)
  return c;
}
// the sky: flat coat, brushed, a ragged edge and three degrees of bare paper at the horizon
vec3 sp_sky(vec3 dir){
  float el = degrees(asin(clamp(dir.y, -1., 1.)));
  float az = (abs(dir.x) + abs(dir.z) < 1e-4) ? 0. : atan(dir.x, dir.z);
  vec2 w = vec2(sin(az) * 1.6 + cos(az) * 0.9, cos(az) * 1.3 - sin(az) * 0.7);
  float st = sp_vn(vec2(w.x * 1.1, el * 0.42 + w.y)) * .5 + sp_vn(vec2(w.x * 1.4 + 9., el * 1.3 + w.y)) * .3 + sp_vn(vec2(w.y * 3. + 4., el * 4.1 + w.x * 2.)) * .2 - .5;
  float arc = uSkyRinse * 150. - 12. - (el + 22. * (1. - cos(az - 3.6)) + 5. * sp_vn(vec2(az * 3., 2.)));
  vec3 c = mix(uCoat1, uPruss, smoothstep(0., 7., arc));
  c = mix(c, uDeep, 0.6 * smoothstep(24., 90., el) * smoothstep(-4., 14., arc + 20.));
  float bs = sp_vn(vec2(w.x * 2.6 + 5., el * 9. + w.y * 14.));
  c *= 1. + 0.27 * st + 0.08 * (smoothstep(0.62, 0.78, bs) - smoothstep(0.2, 0.36, 1. - bs));
  float tn = sp_vn(vec2(az * 1.9 + 4.2, el * 0.06 + 2.)) + 0.18 * sp_vn(vec2(az * 7., el * 0.21));
  float tw = fwidth(tn) * 1.6 + 1e-4;
  c *= 1. + (1. - smoothstep(0., tw, abs(tn - 0.7))) * 0.3 + (1. - smoothstep(0., 0.05, tn - 0.7)) * step(0.7, tn) * 0.08
     + 0.3 * sp_ring(vec2(az * 57.3, el) / 9., fwidth(el) / 9.);
  float lipw = fwidth(arc);
  c = mix(c, uPaper, (1. - smoothstep(0., lipw * 1.2 + 1e-4, abs(arc - 0.3))) * 0.2 * step(0.001, uSkyRinse) * step(uSkyRinse, 0.999));
  // (round 5: NO margin is drawn. The dry-brush hairs read as rows of dashes along the horizon, and a real strip of bare paper a
  // degree tall read as a stray white bar. The coat runs to the horizon everywhere; uBand is kept only for the interface.)
  vec3 o = c;
  // well below the horizon (only ever seen through a portal whose lower rim dips under the sheet): the coat again, not bare paper
  return mix(o, c, 1. - smoothstep(-2.8, -1.5, el));
}
`;

// One vertex shader for everything drawn as density. Hooks: PRE (declarations) and MOVE (statements that may change
// pos, dir, wid, alp in the mesh's object space, after the instance matrix): flight, uncoiling, sway live there.
const DENSITY_VERT = /* glsl */`
uniform float uViewH, uTime;
#ifdef SP_THREAD
attribute vec3 aTan; attribute vec3 aSW;   // tangent; (side -1..1, width m, alpha)
#endif
varying vec3 vWp; varying vec3 vN; varying vec2 vUv; varying float vA; varying float vX;
//PRE
void main(){
  vec3 pos = position; float alp = 1., wid = 0.;
  #ifdef SP_THREAD
  vec3 dir = aTan; wid = aSW.y; alp = aSW.z;
  #else
  vec3 dir = normal;
  #endif
  #ifdef USE_INSTANCING
  pos = (instanceMatrix * vec4(pos, 1.)).xyz; dir = mat3(instanceMatrix) * dir;
  #endif
  //MOVE
  vec4 wp = modelMatrix * vec4(pos, 1.);
  vec3 wd = mat3(modelMatrix) * dir;
  vec3 toC = cameraPosition - wp.xyz; float d = max(length(toC), 0.05);
  vX = 0.;
  #ifdef SP_THREAD
  vec3 side = cross(wd, toC); side = side / max(length(side), 1e-5);
  float pxm = uViewH * 0.5 * projectionMatrix[1][1] / d;   // pixels per metre here
  float wpx = wid * pxm, w2 = max(wpx, 1.6);
  alp *= wpx / w2;                                          // never thinner than 1.6 px: lose density, not width
  wp.xyz += side * aSW.x * 0.5 * w2 / max(pxm, 1e-4);
  vX = aSW.x;
  #endif
  #ifdef SP_SMALL
  alp *= 1. - smoothstep(150., 180., d);
  #endif
  vWp = wp.xyz; vN = wd; vUv = uv; vA = alp;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const DENSITY_FRAG = /* glsl */`
uniform vec3 uWhite, uMilk; uniform float uFar, uK, uA, uGhost, uTime, uHollow, uCore, uTone;
#ifdef SP_MAP
uniform sampler2D uMap;
#endif
varying vec3 vWp; varying vec3 vN; varying vec2 vUv; varying float vA; varying float vX;
${GLSL_NOISE}${GLSL_FRONT}
void main(){
  vec3 V = cameraPosition - vWp; float d = length(V);
  float nv = abs(dot(vN, V)) / max(length(vN) * d, 1e-5);
  float a = vA; float wsh = 1.;                 // wsh: how much of this density is drawing (white) and not film (milk)
  #if defined(SP_THREAD)
  a *= 1. - smoothstep(0.3, 1., abs(vX));
  #elif defined(SP_SOLID)
  // chord through a solid of revolution (dense core, soft edge); uHollow > 0 makes it a pipe with bright walls
  a *= 1. - exp(-uK * (nv - sqrt(max(uHollow * uHollow - 1. + nv * nv, 0.))));
  #else
  a *= uA / max(nv, 0.3);                     // a sheet: denser edge-on
  float pat = 0.;
  //PATTERN
  #ifdef SP_MAP
  pat = max(pat, texture2D(uMap, vUv).r);
  #endif
  { float ap = pat * 0.9 * vA; a = min(a, 0.85); wsh = clamp(ap / max(max(a, ap), 1e-4), 0., 1.); wsh *= wsh; a = max(a, ap); }
  #endif
  float a0 = clamp(a, 0., 1.);                // how solid this layer is in itself, before distance thins it
  a *= exp(-d / uFar);                        // distance thins, it never hazes
  a *= mix(uGhost, 1., smoothstep(0., 6., sp_front(uR2, vWp.xz)));
  a = clamp(a, 0., 1.);
  // a film piles up to milky blue and stops there; only veins, rims, threads and solid cores are paper white, and a
  // core that is truly solid is the bare paper itself (uCore lifts it to the paper's own hex through the tone curve)
  // (uTone: a thread or a solid at part density is the same half-tone, milky blue, and runs to white only as it nears solid)
  wsh *= mix(1., smoothstep(0.3, 0.82, a), uTone);
  vec3 col = mix(uMilk, uWhite, wsh) * (1. + uCore * wsh * smoothstep(0.62, 0.94, a0));
  gl_FragColor = vec4(col, a);
}`;

// Patterns for cards (uv in 0..1): statements that set "pat" (0..1 vein density) and may scale "a" (the film).
const PATTERNS = {
  // a leaf or wing: midrib up v, paired side veins, film fading to the edge
  vein: /* glsl */`{ vec2 q = vUv; float x = abs(q.x - .5) * 2.; float fy = fwidth(q.y) + 1e-4, fx = fwidth(x) + 1e-4;
    float rib = 1. - smoothstep(0.02, 0.02 + fx * 1.5, x);
    float sv = abs(fract(q.y * 9. - x * 1.6) - .5) * 2.; float side = (1. - smoothstep(0.1, 0.1 + fy * 30., sv)) * (1. - x);
    float outl = 1. - smoothstep(0.86, 1., x / max(sin(q.y * 3.14159) * 0.98 + 0.02, 0.02));
    pat = max(rib, side * .7) * outl; a *= outl; }`,
  // a ring with a milky middle: a seed's socket on the heart, a pod's rim, a floret
  ring: /* glsl */`{ float r = length(vUv - .5) * 2.; float fr = fwidth(r) + 1e-4;
    pat = (1. - smoothstep(0.1, 0.1 + fr * 1.5, abs(r - 0.78))) ; a *= 1. - smoothstep(0.86, 0.9 + fr, r); pat *= 1. - smoothstep(0.9, 0.9 + fr, r); }`,
  // a soft round dab
  disc: /* glsl */`{ float r = length(vUv - .5) * 2.; a *= 1. - smoothstep(0.55, 1., r); }`,
};

// ---------------------------------------------------------------------------------------------------------
// makeStyle: the print's inks, materials, exposure buffer and geometry helpers. One instance per world.
// ---------------------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const pal = opts.palette || DEF_PALETTE;
  const C = (h) => new THREE.Color(h);
  const gain = opts.gain ?? 1;
  const palette = { prussian: C(pal[0]), deep: C(pal[1]), coat1: C(pal[2]), paper: C(pal[3]), milk: C(pal[4]), sensitiser: C(pal[5]), exposed: C(pal[6]) };
  // ink(hex, cap): the linear colour that comes out of the pipeline (ACES at opts.exposure, default 1) as that hex.
  // Dark blues need more red and green than their hex, and paper white would need ~2.1, so it is scaled down to `cap`
  // (opts.whiteCap, default 1.0: nothing here glows) keeping its tint.
  const expo = opts.exposure ?? 1, whiteCap = opts.whiteCap ?? 1.0;
  const tm = (c) => { const v = c.map((x) => x * expo / 0.6);
    const i = [0.59719 * v[0] + 0.35458 * v[1] + 0.04823 * v[2], 0.076 * v[0] + 0.90834 * v[1] + 0.01566 * v[2], 0.0284 * v[0] + 0.13383 * v[1] + 0.83777 * v[2]]
      .map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081));
    return [1.60475 * i[0] - 0.53108 * i[1] - 0.07367 * i[2], -0.10208 * i[0] + 1.10813 * i[1] - 0.00605 * i[2], -0.00327 * i[0] - 0.07276 * i[1] + 1.07602 * i[2]]; };
  const solve = (T) => { const c = T.slice(); for (let it = 0; it < 600; it++) { const o = tm(c); let err = 0; for (let k = 0; k < 3; k++) { err = Math.max(err, Math.abs(T[k] - o[k])); c[k] = Math.max(0, c[k] + 0.6 * (T[k] - o[k])); } if (err < 2e-7) break; } return c; };
  const inkMemo = {};
  const ink = (hex, cap = 8) => { const key = hex + '/' + cap; if (inkMemo[key]) return inkMemo[key].clone(); const t = new THREE.Color(hex), T = [t.r, t.g, t.b]; let c = solve(T), lo = 0.3, hi = 1;
    if (Math.max(...c) > cap) { for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; c = solve(T.map((x) => x * m)); if (Math.max(...c) > cap) hi = m; else lo = m; } c = solve(T.map((x) => x * lo)); }
    return (inkMemo[key] = new THREE.Color().setRGB(c[0] * gain, c[1] * gain, c[2] * gain, THREE.LinearSRGBColorSpace)).clone(); };
  const L = new THREE.Vector3(...(opts.light || [-0.30, 0.883, -0.36])).normalize();   // toward the unseen light: behind, right, 62 deg up
  const brush = new THREE.Vector2(...(opts.brush || [0.94, 0.34])).normalize();
  const U = {
    uTime: { value: 0 }, uViewH: { value: 720 }, uFar: { value: opts.far ?? 220 }, uGhost: { value: opts.ghost ?? 0.72 },
    uWhite: { value: ink(pal[3], whiteCap) }, uPaper: { value: ink(pal[3], whiteCap) }, uMilk: { value: ink(pal[4], whiteCap) }, uCore: { value: opts.core ?? 1.0 },
    uCoat1: { value: ink(pal[2]) }, uPruss: { value: ink(pal[0]) }, uDeep: { value: ink(pal[1]) },
    uSens: { value: ink(pal[5], whiteCap) }, uGrey: { value: ink(pal[6], whiteCap) },
    uR1: { value: new THREE.Vector4(0, 1, 1e5, 0) }, uR2: { value: new THREE.Vector4(0, 1, 1e5, 1.3) },   // both rinses done by default
    uExpose: { value: 1 }, uSkyRinse: { value: 1 },
    uSensAt: { value: new THREE.Vector3(0, 0, -1e4) }, uSheet: { value: new THREE.Vector3(0, 0, 600) },
    uBrush: { value: brush }, uLight: { value: L }, uBand: { value: new THREE.Vector3(opts.band ?? 2.7, 0, 0) },
    uStar: { value: new THREE.Vector4(0, 0, 0, 0) }, uSensW: { value: new THREE.Vector2(12, 7) },
    uE: { value: null }, uEWin: { value: new THREE.Vector3(0, 0, 1 / 160) }, uETx: { value: 1 / (opts.bufferSize || 1024) },
  };
  const hook = (src, o) => src.replace('//PRE', o.pre || '').replace('//MOVE', o.move || '').replace('//PATTERN', o.pattern ? (PATTERNS[o.pattern] || o.pattern) : '');

  // density({ kind: 'thread' | 'solid' | 'card', k, alpha, pattern, map, small, pre, move, uniforms })
  //   thread: geometry from threads(); solid: any closed mesh with normals (FrontSide); card: any sheet with uv.
  function density(o = {}) {
    const kind = o.kind || 'card';
    const defines = {};
    if (kind === 'thread') defines.SP_THREAD = 1; else if (kind === 'solid') defines.SP_SOLID = 1;
    if (o.small) defines.SP_SMALL = 1;
    if (o.map) defines.SP_MAP = 1;
    return new THREE.ShaderMaterial({
      defines, uniforms: { ...U, uK: { value: o.k ?? 3.2 }, uHollow: { value: o.hollow ?? 0 }, uA: { value: o.alpha ?? 0.3 }, uTone: { value: o.tone ?? 0 }, uMap: { value: o.map || null }, ...(o.uniforms || {}) },
      vertexShader: hook(DENSITY_VERT, o), fragmentShader: hook(DENSITY_FRAG, o),
      transparent: true, depthWrite: false, depthTest: true, blending: THREE.NormalBlending,
      side: kind === 'solid' ? THREE.FrontSide : THREE.DoubleSide,
    });
  }

  // the paper: a plane at y 0 (any mesh; the shader reads world xz)
  function paper(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { ...U, ...(o.uniforms || {}) },
      vertexShader: /* glsl */`varying vec3 vWp; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uE; uniform vec3 uEWin; uniform float uETx; varying vec3 vWp;
        ${GLSL_NOISE}${GLSL_FRONT}${GLSL_COAT}
        void main(){
          vec2 p = vWp.xz; vec2 e = (p - uEWin.xy) * uEWin.z;             // -0.5..0.5 inside the exposure window
          float inwin = 1. - smoothstep(0.42, 0.5, max(abs(e.x), abs(e.y)));
          vec2 eu = e + .5; float tx = uETx * 0.8;
          vec2 Es = (texture2D(uE, eu).rg * 2. + texture2D(uE, eu + vec2(tx, tx)).rg + texture2D(uE, eu + vec2(-tx, tx)).rg + texture2D(uE, eu + vec2(tx, -tx)).rg + texture2D(uE, eu - vec2(tx, tx)).rg) / 6.;
          float E = mix(1., Es.x, inwin), Ec = mix(1., Es.y, inwin);
          float far = smoothstep(140., 560., length(cameraPosition - vWp));
          gl_FragColor = vec4(sp_paper(p, E, Ec, far, length(cameraPosition - vWp)), 1.);
        }`,
    });
  }
  // the sky: the same sheet stood up. makeSky() returns a dome that update() keeps on the camera.
  const skies = [];
  function makeSky(radius = 2400) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 24), new THREE.ShaderMaterial({
      uniforms: U, side: THREE.BackSide, depthWrite: false, depthTest: false,
      vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`varying vec3 vDir; ${GLSL_NOISE}${GLSL_FRONT}${GLSL_COAT}
        void main(){ vec3 d = vDir / max(length(vDir), 1e-4); gl_FragColor = vec4(sp_sky(d), 1.); }`,
    }));
    m.renderOrder = -10; m.frustumCulled = false; skies.push(m); return m;
  }

  // ---- the exposure buffer E: 1 where the light reached the paper, 0 in shadow; prints back to 1 over `wake` seconds
  const N = opts.bufferSize || 1024, WIN = opts.window || 160, r = ctx.renderer;
  const rtOpts = { depthBuffer: false, stencilBuffer: false, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, type: THREE.UnsignedByteType };
  const rts = [new THREE.WebGLRenderTarget(N, N, rtOpts), new THREE.WebGLRenderTarget(N, N, rtOpts)];
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const copyMat = new THREE.ShaderMaterial({
    uniforms: { uPrev: { value: null }, uScroll: { value: new THREE.Vector2() }, uRise: { value: 0 } }, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }`,
    fragmentShader: `uniform sampler2D uPrev; uniform vec2 uScroll; uniform float uRise; varying vec2 vUv;
      void main(){ vec2 q = vUv + uScroll; float inside = step(0., q.x) * step(q.x, 1.) * step(0., q.y) * step(q.y, 1.);
        vec3 e = mix(vec3(1.), texture2D(uPrev, q).rgb, inside); gl_FragColor = vec4(min(vec3(1.), e + uRise), 1.); }`,
  });
  const copyMesh = new THREE.Mesh(tri, copyMat); copyMesh.frustumCulled = false;
  const copyScene = new THREE.Scene(); copyScene.add(copyMesh);
  const proxyScene = new THREE.Scene(), flatCam = new THREE.Camera();
  const SHADOW_PAT = {
    disc: `{ float r = length(vUv - .5) * 2.; den = 1. - smoothstep(1. - uSoft, 1., r); }`,
    flat: `{ den = 1. - smoothstep(1. - uSoft, 1., abs(vUv.x - .5) * 2.); }`,
    star: `{ vec2 q = vUv - .5; float r = length(q) * 2.; float an = (r < 1e-4) ? 0. : atan(q.y, q.x);
      float sp = abs(fract(an * 3.5014 + vPh) - .5) * 2.;                       // 22 spokes
      float spoke = (1. - smoothstep(0.1, 0.1 + uSoft, sp * max(r, .25))) * (1. - smoothstep(0.7, 1., r)) * 0.32;   // (faint: a spoke's streak is gone in a second,
      den = max(max(spoke, 0.05 * (1. - smoothstep(0.3, 1., r))), 1. - smoothstep(0.06, 0.2, r)); }`,                 // so each star draws ONE fine wake, from its eye)
  };
  // shadow({ pattern: 'disc' | 'flat' | 'star' | glsl, soft, alpha, pre, move, uniforms }): a proxy drawn into E.
  // The vertex shader shears the proxy along the light onto y 0. Add the mesh with exposure.add(mesh).
  function shadow(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { uLight: U.uLight, uEWin: U.uEWin, uTime: U.uTime, uSoft: { value: Math.max(o.soft ?? 0.3, 0.01) }, uDen: { value: o.alpha ?? 1 }, ...(o.uniforms || {}) },
      vertexShader: hook(/* glsl */`uniform vec3 uLight, uEWin; uniform float uTime; varying vec2 vUv; varying float vA; varying float vPh;
        //PRE
        void main(){ vec3 pos = position; vec3 dir = vec3(0., 1., 0.); float alp = 1., wid = 0., pha = 0.;
          #ifdef USE_INSTANCING
          pos = (instanceMatrix * vec4(pos, 1.)).xyz;
          #endif
          //MOVE
          vec4 wp = modelMatrix * vec4(pos, 1.);
          vec2 g = wp.xz - uLight.xz * (max(wp.y, 0.) / max(uLight.y, 0.2));
          vUv = uv; vA = alp; vPh = pha;
          gl_Position = vec4((g - uEWin.xy) * uEWin.z * 2., 0., 1.); }`, o),
      fragmentShader: /* glsl */`uniform float uSoft, uDen; varying vec2 vUv; varying float vA; varying float vPh;
        void main(){ float den = 1.; ${SHADOW_PAT[o.pattern] || o.pattern || ''}
          float sh_v = 1. - clamp(den * vA * uDen, 0., 1.);
          gl_FragColor = ${o.chan === 'comb' ? 'vec4(1., sh_v, 1., 1.)' : 'vec4(sh_v, 1., sh_v, 1.)'}; }`,
      side: THREE.DoubleSide, depthTest: false, depthWrite: false, transparent: true,
      blending: THREE.CustomBlending, blendEquation: THREE.MinEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
  }
  const _p = new THREE.Vector3(), _f = new THREE.Vector3(), _sz = new THREE.Vector2();
  let cur = 0, first = true, riseAcc = 0, pcx = 0, pcz = 0;
  const exposure = {
    scene: proxyScene, wake: opts.wake ?? 4, hold: 0, lead: opts.lead ?? 45, size: WIN, texel: WIN / N,
    add(mesh) { mesh.frustumCulled = false; proxyScene.add(mesh); return mesh; },
    // (a program belongs to the kind of buffer it draws into: compile with the buffer set, or the real ones are made on first use)
    compileInto(fn) { if (!r) return; const prevRT = r.getRenderTarget(); r.setRenderTarget(rts[0]); try { fn(); } catch (e) { /* compiled on first use instead */ } finally { r.setRenderTarget(prevRT); } },
    compileCopy() { if (r && r.compile) exposure.compileInto(() => r.compile(copyScene, flatCam)); },
    compile() { if (r && r.compile) exposure.compileInto(() => { r.compile(proxyScene, flatCam); r.compile(copyScene, flatCam); }); },
    get texture() { return rts[cur].texture; },
    // preroll(camera, fn): write the last `wake` seconds of history in one go, so the first frame already has its wakes.
    // fn(offset) must put every mover where it was `offset` seconds ago (offset <= 0, ending at 0).
    // `sub` extra stamps of the proxies between steps (no copy pass, so cheap) keep a fast mover's wake from breaking into dots.
    preroll(camera, fn, steps = 64, sub = 1) { const span = exposure.wake;
      for (let i = steps; i >= 0; i--) { fn(-span * i / steps); exposure.render(i === steps ? 0 : span / steps, camera);
        if (i > 0) for (let k = 1; k < sub; k++) { fn(-span * (i - k / sub) / steps); exposure.stamp(); } } },
    stamp() { if (!r) return; const prevRT = r.getRenderTarget(), prevAuto = r.autoClear;
      r.autoClear = false; r.setRenderTarget(rts[cur]); r.render(proxyScene, flatCam); r.setRenderTarget(prevRT); r.autoClear = prevAuto; },
    render(dt, camera) {
      if (!r) return;
      camera.getWorldPosition(_p); camera.getWorldDirection(_f);
      const texel = WIN / N;
      const cx = Math.round((_p.x + _f.x * exposure.lead) / texel) * texel, cz = Math.round((_p.z + _f.z * exposure.lead) / texel) * texel;
      riseAcc += (1 - exposure.hold) * Math.min(dt, 0.1) / Math.max(exposure.wake, 0.1);
      const q = Math.floor(riseAcc * 255) / 255; riseAcc -= q;                 // whole 8-bit steps only, so slow frames and fast agree
      copyMat.uniforms.uPrev.value = rts[cur].texture;
      copyMat.uniforms.uScroll.value.set(first ? 9 : (cx - pcx) / WIN, first ? 9 : (cz - pcz) / WIN);
      copyMat.uniforms.uRise.value = q;
      pcx = cx; pcz = cz; first = false; cur = 1 - cur;
      U.uEWin.value.set(cx, cz, 1 / WIN);
      const prevRT = r.getRenderTarget(), prevAuto = r.autoClear;
      r.autoClear = false; r.setRenderTarget(rts[cur]);
      r.render(copyScene, flatCam); r.render(proxyScene, flatCam);
      r.setRenderTarget(prevRT); r.autoClear = prevAuto;
      U.uE.value = rts[cur].texture;
    },
  };
  U.uE.value = rts[0].texture;

  // ---- geometry helpers
  // threads([{ pts: [[x,y,z], ...], w, w1, a, a1 }]): camera-facing ribbons for density({kind:'thread'}); w in metres, a = density
  function threads(lines) {
    let nv = 0, ni = 0;
    for (const l of lines) { nv += l.pts.length * 2; ni += (l.pts.length - 1) * 6; }
    const pos = new Float32Array(nv * 3), tan = new Float32Array(nv * 3), sw = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
    const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let v = 0, k = 0;
    for (const l of lines) {
      const P = l.pts, n = P.length, w0 = l.w ?? 0.05, w1 = l.w1 ?? w0, a0 = l.a ?? 0.6, a1 = l.a1 ?? a0;
      for (let i = 0; i < n; i++) {
        const A = P[Math.max(i - 1, 0)], B = P[Math.min(i + 1, n - 1)], t = n > 1 ? i / (n - 1) : 0;
        let tx = B[0] - A[0], ty = B[1] - A[1], tz = B[2] - A[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        for (let s = -1; s <= 1; s += 2) {
          pos.set(P[i], v * 3); tan[v * 3] = tx; tan[v * 3 + 1] = ty; tan[v * 3 + 2] = tz;
          sw[v * 3] = s; sw[v * 3 + 1] = w0 + (w1 - w0) * t; sw[v * 3 + 2] = a0 + (a1 - a0) * t;
          uv[v * 2] = s * 0.5 + 0.5; uv[v * 2 + 1] = t; v++;
        }
        if (i < n - 1) { const b = v - 2; idx[k++] = b; idx[k++] = b + 1; idx[k++] = b + 2; idx[k++] = b + 1; idx[k++] = b + 3; idx[k++] = b + 2; }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.BufferAttribute(tan, 3));
    g.setAttribute('aSW', new THREE.BufferAttribute(sw, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }
  // tube(pts, radii, sides): a stem as a solid of revolution along a polyline, for density({kind:'solid'})
  function tube(pts, radii, sides = 12) {
    const n = pts.length, pos = [], nor = [], uv = [], idx = [];
    const T = new THREE.Vector3(), Nn = new THREE.Vector3(1, 0, 0), Bn = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      a.fromArray(pts[Math.max(i - 1, 0)]); b.fromArray(pts[Math.min(i + 1, n - 1)]); T.subVectors(b, a).normalize();
      Bn.crossVectors(T, Nn); if (Bn.lengthSq() < 1e-6) Bn.set(0, 0, 1); Bn.normalize(); Nn.crossVectors(Bn, T).normalize();
      const rad = Array.isArray(radii) ? radii[i] : radii;
      for (let j = 0; j <= sides; j++) {
        const an = (j / sides) * TAU, c = Math.cos(an), s = Math.sin(an);
        const nx = Nn.x * c + Bn.x * s, ny = Nn.y * c + Bn.y * s, nz = Nn.z * c + Bn.z * s;
        pos.push(pts[i][0] + nx * rad, pts[i][1] + ny * rad, pts[i][2] + nz * rad); nor.push(nx, ny, nz); uv.push(j / sides, i / (n - 1));
      }
      if (i < n - 1) for (let j = 0; j < sides; j++) { const p = i * (sides + 1) + j, q = p + sides + 1; idx.push(p, p + 1, q, p + 1, q + 1, q); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    return g;
  }
  // cards([{ c: [x,y,z], u: [x,y,z], v: [x,y,z] }]): quads (centre, half-width vector, half-height vector) for density({kind:'card'})
  function cards(list) {
    const n = list.length, pos = new Float32Array(n * 12), nor = new Float32Array(n * 12), uv = new Float32Array(n * 8), idx = [];
    list.forEach((q, i) => {
      const { c, u, v } = q, nx = u[1] * v[2] - u[2] * v[1], ny = u[2] * v[0] - u[0] * v[2], nz = u[0] * v[1] - u[1] * v[0], nl = Math.hypot(nx, ny, nz) || 1;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([su, sv], j) => {
        const o = (i * 4 + j) * 3;
        pos[o] = c[0] + u[0] * su + v[0] * sv; pos[o + 1] = c[1] + u[1] * su + v[1] * sv; pos[o + 2] = c[2] + u[2] * su + v[2] * sv;
        nor[o] = nx / nl; nor[o + 1] = ny / nl; nor[o + 2] = nz / nl; uv[(i * 4 + j) * 2] = su * .5 + .5; uv[(i * 4 + j) * 2 + 1] = sv * .5 + .5;
      });
      idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
    return g;
  }
  // blade(pts, widths, side): a fixed (not camera-facing) strip for density({kind:'card'}): petals, pinnae, wings, bracts.
  // side is one [x,y,z] or one per point; uv.x runs across, uv.y along.
  function blade(pts, widths, side) {
    const n = pts.length, list = [];
    for (let i = 0; i < n; i++) { const s = Array.isArray(side[0]) ? side[i] : side, w = (Array.isArray(widths) ? widths[i] : widths) * 0.5;
      list.push([pts[i][0] - s[0] * w, pts[i][1] - s[1] * w, pts[i][2] - s[2] * w], [pts[i][0] + s[0] * w, pts[i][1] + s[1] * w, pts[i][2] + s[2] * w]); }
    const pos = [], uv = [], idx = [];
    list.forEach((p, i) => { pos.push(p[0], p[1], p[2]); uv.push(i & 1, (i >> 1) / (n - 1)); });
    for (let i = 0; i < n - 1; i++) { const b2 = i * 2; idx.push(b2, b2 + 1, b2 + 2, b2 + 1, b2 + 3, b2 + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }

  return {
    palette, ink, uniforms: U, light: L, density, paper, makeSky, shadow, exposure, threads, tube, cards, blade, patterns: PATTERNS,
    glsl: { noise: GLSL_NOISE, front: GLSL_FRONT },     // for the world's own materials that must follow the rinse fronts
    // rinse(1 | 2, nx, nz, offset): the front is the line dot(n, xz) = offset, water behind it; move offset to slide it
    rinse(i, nx, nz, offset) { const R = (i === 2 ? U.uR2 : U.uR1).value, l = Math.hypot(nx, nz) || 1; R.x = nx / l; R.y = nz / l; R.z = offset; },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (r) { r.getDrawingBufferSize(_sz); U.uViewH.value = _sz.y; }
      camera.getWorldPosition(_p); for (const s of skies) s.position.copy(_p);
      exposure.render(dt, camera);
    },
    dispose() { rts[0].dispose(); rts[1].dispose(); tri.dispose(); copyMat.dispose();
      proxyScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); },
  };
}

// ---------------------------------------------------------------------------------------------------------
// The hero: the dandelion clock
// ---------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = Math.min(1, Math.max(0.6, opts.detail ?? ctx.quality?.detail ?? 1));
  const standalone = !opts.style;
  const style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const object = new THREE.Group(), inner = new THREE.Group(); object.add(inner);
  const HY = opts.heartY ?? 22, HR = 1.5, ACH = 0.7, BEAK = 5, TIP = ACH + BEAK, SR = 1.2, NSEED = 180;
  const exit = opts.exit || [-42, 20, 54], passR = opts.passRadius ?? 26, passY = opts.passY ?? 20;
  const heart = new THREE.Vector3(0, HY, 0);

  // ---- stalk: a hollow pipe, bright at its walls, bowing a little on its way up (the bow is seeded)
  const bowA = rng.range(0, TAU), bow = rng.range(0.6, 1.7), bow2 = rng.range(-0.5, 0.5);
  const sp = [], sr = [], NS = 22, topY = HY - HR * 0.55;
  for (let i = 0; i <= NS; i++) {
    const t = i / NS, s = Math.sin(Math.PI * t) * bow + Math.sin(TAU * t) * bow2;
    sp.push([Math.cos(bowA) * s, topY * t, Math.sin(bowA) * s]);
    sr.push(0.82 + 0.34 * Math.pow(1 - t, 6) + 0.5 * Math.pow(t, 14));     // flared foot, receptacle swelling at the top
  }
  const stalkGeo = style.tube(sp, sr, 14);
  const stalk = new THREE.Mesh(stalkGeo, style.density({ kind: 'solid', k: 2.4, hollow: 0.74 }));
  inner.add(stalk);
  // fine ribs running up the stalk: white threads on the milky pipe
  const ribs = [];
  for (let j = 0; j < 9; j++) {
    const an = (j / 9) * TAU + rng.range(-0.1, 0.1), pts = [];
    for (let i = 0; i <= NS; i += 2) pts.push([sp[i][0] + Math.cos(an) * sr[i] * 0.97, sp[i][1], sp[i][2] + Math.sin(an) * sr[i] * 0.97]);
    ribs.push({ pts, w: 0.045, a: 0.5 });
  }

  // ---- heart: a dome that is only milky by itself; the seed bodies standing on it make it solid, so it shows pitted when bare
  const heartGeo = new THREE.SphereGeometry(HR, 28, 18); heartGeo.scale(1, 0.88, 1); heartGeo.translate(0, HY, 0);
  const heartMesh = new THREE.Mesh(heartGeo, style.density({ kind: 'solid', k: 1.6 }));
  inner.add(heartMesh);

  // seed directions: a Fibonacci sphere that leaves the cap around the stalk bare
  const dirs = [], GA = Math.PI * (3 - Math.sqrt(5)), rot0 = rng.range(0, TAU);
  for (let i = 0; i < NSEED; i++) {
    const y = 1 - ((i + 0.5) / NSEED) * 1.8, rr = Math.sqrt(Math.max(0, 1 - y * y)), an = i * GA + rot0;
    const d = new THREE.Vector3(Math.cos(an) * rr + rng.range(-0.035, 0.035), y + rng.range(-0.035, 0.035), Math.sin(an) * rr + rng.range(-0.035, 0.035)).normalize();
    dirs.push(d);
  }
  // sockets: a ring where every seed stands
  const padList = [], up = new THREE.Vector3(0, 1, 0), tu = new THREE.Vector3(), tv = new THREE.Vector3();
  for (const d of dirs) {
    tu.crossVectors(Math.abs(d.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : up, d).normalize(); tv.crossVectors(d, tu);
    const c = [d.x * HR * 1.02, HY + d.y * HR * 0.9, d.z * HR * 1.02], h = 0.2;
    padList.push({ c, u: [tu.x * h, tu.y * h, tu.z * h], v: [tv.x * h, tv.y * h, tv.z * h] });
  }
  const pads = new THREE.Mesh(style.cards(padList), style.density({ kind: 'card', alpha: 0.08, pattern: 'ring' }));
  inner.add(pads);
  await ctx.yield();

  // ---- bracts: the reflexed green collar under a clock, here milky blades with a white midrib, hanging down the stalk
  const nBr = rng.int(13, 18), brGeos = [];
  for (let j = 0; j < nBr; j++) {
    const an = (j / nBr) * TAU + rng.range(-0.12, 0.12), ca = Math.cos(an), sa = Math.sin(an);
    const len = rng.range(2.4, 3.6), droop = rng.range(0.75, 1.1), pts = [], wd = [], NB = 6;
    for (let i = 0; i <= NB; i++) {
      const t = i / NB, out = 1.05 + Math.sin(t * 1.9) * len * 0.42, dy = -0.5 - (t * t * droop + t * 0.25) * len * 0.8;
      pts.push([ca * out, HY + dy - HR * 0.3, sa * out]); wd.push(0.62 * Math.sin(Math.PI * (0.12 + 0.88 * t)) + 0.02);
    }
    brGeos.push(style.blade(pts, wd, [-sa, 0, ca]));
  }
  const bractGeo = mergeGeometries(brGeos); brGeos.forEach((g) => g.dispose());
  const bracts = new THREE.Mesh(bractGeo, style.density({ kind: 'card', alpha: 0.3, pattern: 'vein',
    move: 'pos.xz += pos.xz / max(length(pos.xz), 1e-3) * 0.12 * sin(uTime * 0.9 + pos.y * 1.7 + atan(pos.z, pos.x + 1e-4) * 3.) * uv.y;' }));
  inner.add(bracts);
  const ribMesh = new THREE.Mesh(style.threads(ribs), style.density({ kind: 'thread' }));
  inner.add(ribMesh);
  await ctx.yield();

  // ---- the seed: achene, beak and a star of filaments, +Y outward from the heart. One geometry, 180 instances.
  const nF = Math.round(90 * detail), fA = Math.min(0.95, 0.78 * 90 / nF), cone = rng.range(64, 72), lines = [];
  lines.push({ pts: [[0, 0, 0], [0, 0.3, 0]], w: 0.07, w1: 0.2, a: 0.95 }, { pts: [[0, 0.3, 0], [0, ACH, 0]], w: 0.2, w1: 0.045, a: 0.95 });
  lines.push({ pts: [0, 1, 2, 3].map((i) => [0.1 * Math.sin(Math.PI * i / 3), ACH + BEAK * i / 3, 0]), w: 0.045, w1: 0.03, a: 0.8 });
  for (let i = 0; i < nF; i++) {
    const az = ((i + rng()) / nF) * TAU, th = (cone + rng.range(0, 16)) * Math.PI / 180, len = SR * rng.range(0.86, 1.06);
    const dx = Math.cos(az) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(az) * Math.sin(th);
    lines.push({ pts: [[dx * 0.03, TIP + dy * 0.03, dz * 0.03], [dx * len, TIP + dy * len, dz * len]], w: 0.034, w1: 0.018, a: fA, a1: fA * 0.75 });
  }
  const seedGeo = style.threads(lines);

  // which seeds let go: the downwind (exit) side only, outermost first, slowly and then in a rush
  const Wn = new THREE.Vector3(exit[0], 0, exit[2]).normalize();
  const nShed = Math.min(NSEED, opts.shedCount ?? 70), order = dirs.map((d, i) => ({ i, s: d.dot(Wn) + 0.35 * d.y * (1 - Math.abs(d.y)) + rng.range(0, 0.22) })).sort((a, b) => b.s - a.s);
  const release = new Float32Array(NSEED).fill(1e4);
  const relOrder = order.slice(0, nShed).map((o) => ({ i: o.i, k: o.s + rng.range(0, 0.3) })).sort((a, b) => b.k - a.k);
  relOrder.forEach((o, k) => { release[o.i] = 5.4 * Math.pow(k / Math.max(nShed - 1, 1), 0.6) + (k ? rng.range(-0.04, 0.04) : 0); });       // (over five and a half seconds: the first are well down the lane, their lines on the paper, while the last still stand)
  // a seeded few are already gone before we arrive: bare sockets on the weather side
  const gone = rng.int(0, 9), gdir = new THREE.Vector3(rng.range(-1, 1), rng.range(0.1, 1), rng.range(-1, 1)).normalize();
  dirs.map((d, i) => ({ i, s: d.dot(gdir) })).sort((a, b) => b.s - a.s).slice(0, gone).forEach((o) => { if (release[o.i] > 1e3) release[o.i] = -1e3; });

  const seedData = new Float32Array(NSEED * 4), m4 = new THREE.Matrix4(), bx = new THREE.Vector3(), bz = new THREE.Vector3();
  const seedU = { uShed: { value: -1 }, uLaneA: { value: new THREE.Vector3() }, uLaneW: { value: new THREE.Vector3() }, uLaneL: { value: 60 }, uTipY: { value: TIP } };
  const SEED_PRE = /* glsl */`
    attribute vec4 aSeed;   // (release time s, phase, lane offset sideways m, lane offset up m)
    uniform float uShed, uLaneL, uTipY; uniform vec3 uLaneA, uLaneW;
    vec3 sp_fly(vec3 c0, vec3 ax, float tf, vec4 sd){
      float lift = 1.4 * (1. - exp(-tf * 1.6));                       // pulls free along its own beak
      float d = 13. * (tf - 1.5 * (1. - exp(-tf / 1.5)));             // then the air takes it, up to 13 m/s
      vec3 side = vec3(-uLaneW.z, 0., uLaneW.x), rel = c0 + ax * lift - uLaneA;
      float s0 = dot(rel, uLaneW); vec3 l0 = rel - uLaneW * s0;
      float along = s0 + d, b = smoothstep(0., 44., d);
      vec3 lt = (side * sd.z + vec3(0., sd.w, 0.)) * mix(1., 0.42, smoothstep(uLaneL - 34., uLaneL, along));
      vec3 lat = mix(l0, lt, b);
      lat.y += 4.5 * sin(3.14159 * b) * step(0., -sd.z * dot(l0, side));    // those that must cross our line go over it
      float ph = sd.y * 6.283;
      lat += (side * sin(tf * 0.9 + ph) + vec3(0., sin(tf * 1.3 + ph * 2.), 0.)) * 0.5 * min(tf * .5, 1.);
      return uLaneA + uLaneW * along + lat;
    }`;
  const SEED_MOVE = /* glsl */`
    float tf = uShed - aSeed.x, ph = aSeed.y * 6.283, sy = length(instanceMatrix[1].xyz);
    vec3 home = instanceMatrix[3].xyz, ax = instanceMatrix[1].xyz / max(sy, 1e-4), rel0 = pos - home;
    float tr = (0.012 + 0.06 * smoothstep(-1.4, 0., tf)) * sin(uTime * (1.3 + aSeed.y) + ph);   // trembles before it goes
    pos += cross(vec3(uLaneW.z, 0., -uLaneW.x), rel0) * tr + cross(vec3(0., 1., 0.), rel0) * 0.012 * sin(uTime * 0.7 + ph * 3.);
    if (tf > 0.) {
      vec3 q = position - vec3(0., uTipY, 0.); q.y *= sy;                 // seed-local, about the star's centre
      vec3 ay = mix(ax, vec3(0.14 * sin(tf * 1.1 + ph), 1., 0.14 * cos(tf * 0.9 + ph)), smoothstep(0.1, 2.4, tf));
      ay = ay / max(length(ay), 1e-3);                                    // the beak tips to hang below its star
      vec3 ex = instanceMatrix[0].xyz; ex = ex - ay * dot(ex, ay); ex = ex / max(length(ex), 1e-3);
      vec3 ez = cross(ex, ay);
      float spin = tf * (0.5 + aSeed.y) * (aSeed.y > .5 ? 1. : -1.), cs = cos(spin), sn = sin(spin);
      vec3 q2 = vec3(q.x * cs - q.z * sn, q.y, q.x * sn + q.z * cs), t2 = vec3(aTan.x * cs - aTan.z * sn, aTan.y, aTan.x * sn + aTan.z * cs);
      vec3 c = sp_fly(home + ax * uTipY * sy, ax, tf, aSeed);
      pos = c + ex * q2.x + ay * q2.y + ez * q2.z; dir = ex * t2.x + ay * t2.y + ez * t2.z;
      alp *= 1. - smoothstep(uLaneL - 1., uLaneL + 2.5, dot(c - uLaneA, uLaneW));     // gone through the ring
    }`;
  const seeds = new THREE.InstancedMesh(seedGeo, style.density({ kind: 'thread', tone: 0.2, pre: SEED_PRE, move: SEED_MOVE, uniforms: seedU }), NSEED);      // (tone: a filament at part density, at the clock's rim, is the print's milky blue, never a neutral grey)
  for (let i = 0; i < NSEED; i++) {
    const d = dirs[i], roll = rng.range(0, TAU), sy = rng.range(0.9, 1.07);
    tu.crossVectors(Math.abs(d.y) > 0.95 ? bx.set(1, 0, 0) : up, d).normalize(); tv.crossVectors(d, tu);
    bx.copy(tu).multiplyScalar(Math.cos(roll)).addScaledVector(tv, Math.sin(roll)); bz.crossVectors(bx, d);
    m4.makeBasis(bx, d.clone().multiplyScalar(sy), bz).setPosition(d.x * HR * 0.97, HY + d.y * HR * 0.86, d.z * HR * 0.97);
    seeds.setMatrixAt(i, m4);
    const la = rng.range(-0.5, Math.PI + 0.5), lr = rng.range(3.6, 10.5);
    seedData.set([release[i], rng(), Math.cos(la) * lr, Math.sin(la) * lr * 0.75 + 0.8], i * 4);
  }
  const aSeed = new THREE.InstancedBufferAttribute(seedData, 4);
  seedGeo.setAttribute('aSeed', aSeed);
  seeds.frustumCulled = false; inner.add(seeds);
  await ctx.yield();

  // ---- the line the camera leaves on (tangent to a circle of passR round the heart, ending at the exit) and the seeds' lane along it
  const D = Math.hypot(exit[0], exit[2]), phi = Math.atan2(exit[2], exit[0]), a2 = phi - Math.acos(Math.min(1, passR / D));
  const T2 = new THREE.Vector3(Math.cos(a2) * passR, passY, Math.sin(a2) * passR), W = new THREE.Vector3(-Math.sin(a2), 0, Math.cos(a2));
  const laneL = Math.sqrt(Math.max(1, D * D - passR * passR));
  seedU.uLaneA.value.copy(T2); seedU.uLaneW.value.copy(W); seedU.uLaneL.value = laneL;
  const fly = [[passR, passY, -75], [passR, passY, -40], [passR, passY, -14]];
  for (let a = 0; a < a2 - 0.05; a += 0.2) fly.push([Math.cos(a) * passR, passY, Math.sin(a) * passR]);
  fly.push(T2.toArray(), T2.clone().addScaledVector(W, laneL * 0.35).toArray(), T2.clone().addScaledVector(W, laneL * 0.7).toArray(), [exit[0], exit[1], exit[2]]);

  await ctx.yield();

  // ---- what it leaves on the paper: proxies drawn into the exposure buffer (white shadow, white wakes)
  const L = style.light, shadowAt = new THREE.Vector3(-L.x * HY / L.y, 0, -L.z * HY / L.y);
  const quad = (h) => style.cards([{ c: [0, 0, 0], u: [h, 0, 0], v: [0, 0, h] }]);
  const starGeo = quad(SR * 1.12); starGeo.setAttribute('aSeed', aSeed);
  const starShadow = new THREE.InstancedMesh(starGeo, style.shadow({ pattern: 'star', soft: 0.3, alpha: 0.9, pre: SEED_PRE, uniforms: seedU, move: /* glsl */`
    float tf = uShed - aSeed.x, sy = length(instanceMatrix[1].xyz), spin = 0.;
    vec3 ax = instanceMatrix[1].xyz / max(sy, 1e-4), c = instanceMatrix[3].xyz + ax * uTipY * sy;
    if (tf > 0.) { c = sp_fly(c, ax, tf, aSeed); spin = tf * (0.5 + aSeed.y) * (aSeed.y > .5 ? 1. : -1.);
      alp *= 1. - smoothstep(uLaneL - 1., uLaneL + 2.5, dot(c - uLaneA, uLaneW)); }
    float cs = cos(spin), sn = sin(spin);
    pos = c + vec3(position.x * cs - position.z * sn, 0., position.x * sn + position.z * cs); pha = aSeed.y * 7.;
    alp *= 0.7 * (1. - smoothstep(0., 0.6, tf));` }), NSEED);       // (standing seeds only: they are the star-edged rim of the globe's shadow)
  starShadow.instanceMatrix = seeds.instanceMatrix;
  // A seed in flight writes ONE fine line: a stylus a hand's width across, laid along its own travel, in the comb's channel of E.
  const FLY_AT = /* glsl */`float tf = uShed - aSeed.x, sy = length(instanceMatrix[1].xyz), fa = 0., spin = 0.;
    vec3 ax = instanceMatrix[1].xyz / max(sy, 1e-4), c0 = instanceMatrix[3].xyz + ax * uTipY * sy, c = c0;
    if (tf > 0.) { c = sp_fly(c0, ax, tf, aSeed); spin = tf * (0.5 + aSeed.y) * (aSeed.y > .5 ? 1. : -1.);
      fa = smoothstep(0.25, 1., tf) * (1. - smoothstep(uLaneL - 1., uLaneL + 2.5, dot(c - uLaneA, uLaneW))); }`;
  // THE COMB (round 5). The line is drawn on the paper itself, as a ribbon laid along the seed's own shadow track: every point of
  // it is where the star's shadow was `age` seconds ago (the flight is a pure function of shed time, so the track is exact,
  // unbroken at any speed and the same in a still as in the flight). Paper white at the head, sinking through the milk ink to
  // nothing over `wake` seconds; never under 1.4 px wide and never over 2.6. What was written under the cloud (uCloud: shed time
  // the light came back, strength) does not sink until the light returns, and then all of it sinks together.
  const NSEG = 28, penGeo = new THREE.BufferGeometry();
  { const pp = [], ix = []; for (let i = 0; i <= NSEG; i++) { pp.push(-1, 0, i / NSEG, 1, 0, i / NSEG); if (i < NSEG) { const b = i * 2; ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
    penGeo.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3)); penGeo.setIndex(ix); penGeo.setAttribute('aSeed', aSeed); }
  const combU = { uSpan: { value: style.exposure.wake }, uWake: { value: style.exposure.wake }, uCloud: { value: new THREE.Vector2(1e4, 0) } };
  const penShadow = new THREE.InstancedMesh(penGeo, new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...seedU, ...combU, uLight: style.uniforms.uLight, uPaper: style.uniforms.uPaper, uMilk: style.uniforms.uMilk, uViewH: style.uniforms.uViewH },
    vertexShader: /* glsl */`uniform vec3 uLight; uniform float uViewH, uSpan, uWake; uniform vec2 uCloud; varying float vA; varying float vX; ${SEED_PRE}
      vec3 sp_track(vec3 c0, vec3 ax, float t, vec4 sd){ vec3 cl = sp_fly(c0, ax, max(t, 0.), sd), c = (modelMatrix * vec4(cl, 1.)).xyz; float ly = max(uLight.y, 0.2);
        return vec3(c.x - uLight.x * max(c.y, 0.) / ly, dot(cl - uLaneA, uLaneW), c.z - uLight.z * max(c.y, 0.) / ly); }       // (ground x, metres down the lane, ground z)
      void main(){
        float tf = uShed - aSeed.x, sy = length(instanceMatrix[1].xyz);
        vec3 ax = instanceMatrix[1].xyz / max(sy, 1e-4), c0 = instanceMatrix[3].xyz + ax * uTipY * sy;
        float age = position.z * uSpan, t0 = tf - age;
        vec3 g0 = sp_track(c0, ax, t0, aSeed), g1 = sp_track(c0, ax, t0 + 0.12, aSeed);
        vec4 p0 = projectionMatrix * viewMatrix * vec4(g0.x, 0.03, g0.z, 1.), p1 = projectionMatrix * viewMatrix * vec4(g1.x, 0.03, g1.z, 1.);
        float asp = projectionMatrix[1][1] / max(projectionMatrix[0][0], 1e-4), front = step(0.5, p0.w) * step(0.5, p1.w);
        vec2 dd = (p1.xy / max(p1.w, 0.5) - p0.xy / max(p0.w, 0.5)) * vec2(asp, 1.); float dl = length(dd);
        dd = dl > 1e-6 ? dd / dl : vec2(0., 1.);
        float pxm = uViewH * 0.5 * projectionMatrix[1][1] / max(p0.w, 0.5), wpx = clamp(0.3 * pxm, 1.25, 1.5) + 0.85;       // (+0.9: the soft edge)
        vec2 off = vec2(-dd.y, dd.x) * position.x * wpx / max(uViewH, 1.);
        float fresh = 1. - clamp(age / max(uWake, 0.1), 0., 1.);
        float held = uCloud.y * step(tf - age, uCloud.x) * (1. - smoothstep(uSpan * 0.9, uSpan, age));
        float a = max(fresh * (0.75 + 0.25 * fresh) * (1. - smoothstep(uLaneL - 15., uLaneL - 3., g0.y)), 0.8 * held);      // (a sinking line tapers out before the ring, where they all close up: seen end-on there they would stack into bars; what the cloud holds runs right under it)
        a *= smoothstep(0.3, 1.5, t0) * (1. - smoothstep(uLaneL - 1., uLaneL + 2.5, g0.y)) * front * smoothstep(7., 16., p0.w);      // (a line passing under our own feet is not drawn: it would be a bold bar cut by the frame)
        float mine = step(aSeed.x, 1e3) * step(0., tf) * step(0.42, aSeed.y);     // (three seeds in five draw a line, so there is blue between one line and the next where they close on the ring)                    // (a seed that never flies, or has not gone yet, draws nothing: the whole ribbon is put out of the picture)
        vA = a * mine; vX = position.x;
        gl_Position = mine > 0.5 ? p0 + vec4(off.x / asp, off.y, 0., 0.) * p0.w : vec4(2., 2., 2., 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uPaper, uMilk; uniform float uViewH; varying float vA; varying float vX;
      void main(){ float a = vA * (1. - smoothstep(0.35, 1., abs(vX))) * smoothstep(0.03, 0.075, gl_FragCoord.y / max(uViewH, 1.));
        gl_FragColor = vec4(mix(uMilk, uPaper, smoothstep(0.3, 0.75, a)), a); }` }), NSEED);
  penShadow.instanceMatrix = seeds.instanceMatrix; penShadow.frustumCulled = false; penShadow.userData.onPaper = true; inner.add(penShadow);
  // and at the head of each line its star, drawn on the paper where it is now (no history, so no tab and no halo behind it)
  const headGeo = quad(SR); headGeo.setAttribute('aSeed', aSeed);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...seedU, uLight: style.uniforms.uLight, uPaper: style.uniforms.uPaper, uMilk: style.uniforms.uMilk },
    vertexShader: /* glsl */`uniform vec3 uLight; varying vec2 vUv; varying float vA; varying float vPh; ${SEED_PRE}
      void main(){ ${FLY_AT}
        float cs = cos(spin), sn = sin(spin);
        vec4 wp = modelMatrix * vec4(c + vec3(position.x * cs - position.z * sn, 0., position.x * sn + position.z * cs), 1.);
        vec2 g = wp.xz - uLight.xz * (max(wp.y, 0.) / max(uLight.y, 0.2));
        vUv = uv; vPh = aSeed.y * 7.;
        vec4 cw = modelMatrix * vec4(c, 1.); vec2 cg = cw.xz - uLight.xz * (max(cw.y, 0.) / max(uLight.y, 0.2));
        vec4 cc = projectionMatrix * viewMatrix * vec4(cg.x, 0.03, cg.y, 1.);
        vA = fa * smoothstep(-0.95, -0.86, cc.y / max(cc.w, 1e-3));          // a star whose centre is at the lower edge of the picture is not drawn cut in half
        gl_Position = projectionMatrix * viewMatrix * vec4(g.x, 0.03, g.y, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uPaper, uMilk; varying vec2 vUv; varying float vA; varying float vPh;
      void main(){ vec2 q = (vUv - .5) * 2.; float r = length(q); float an = (r < 1e-4) ? 0. : atan(q.y, q.x);
        float sv = abs(fract(an * 1.7507 + vPh) - .5) * 2. * max(r, .2);       // eleven rays: few enough to stay drawn at a grazing angle
        vec2 qdx = dFdx(q), qdy = dFdy(q); float lp = max(fwidth(q.x), fwidth(q.y));
        float dk = 3.5 * (abs(q.x * qdx.y - q.y * qdx.x) + abs(q.x * qdy.y - q.y * qdy.x)) / max(r * r, 2e-3);
        float sw = min(max(r, .2) * dk + sv / max(r, .2) * fwidth(r), 0.5) * 0.7 + 0.01, und = smoothstep(0.55, 1.3, dk);
        float spoke = mix((1. - smoothstep(0.05 - sw * 0.2, 0.05 + sw, sv)) * min(1., 0.09 / max(sw, 0.09) + 0.3), 0.2, und) * (1. - smoothstep(0.6, 1., r));
        float eye = 1. - smoothstep(0.13, 0.17 + lp * 1.5, r);
        float al = max(spoke * 0.9, eye) * vA;                               // (the print's own half-tone: milk at part density, paper where it is solid; never a grey)
        gl_FragColor = vec4(mix(uMilk, uPaper, smoothstep(0.25, 0.7, al)), al); }` }), NSEED);
  heads.instanceMatrix = seeds.instanceMatrix; heads.frustumCulled = false; heads.userData.onPaper = true; inner.add(heads);
  const discU = { uWn: { value: new THREE.Vector2(Wn.x, Wn.z) }, uGone: { value: 0 } };
  const discGeo = quad(8.9); discGeo.translate(0, HY, 0);
  const discShadow = new THREE.Mesh(discGeo, style.shadow({ uniforms: discU, pattern: /* glsl */`{ vec2 q = (vUv - .5) * 2.; float r = length(q);
    float an = (r < 1e-4) ? 0. : atan(q.y, q.x), tooth = 1. - abs(fract(an * 4.7746) - .5) * 2.; float re = mix(0.66, 1., tooth * tooth);   // thirty points: the rim is the outermost stars' rays
    float body = 0.46 * (1. - smoothstep(re - 0.1, re, r)) + 0.16 * (1. - smoothstep(0., 0.8, r));
    body *= 1. - 0.8 * uGone * smoothstep(-0.25, 0.5, dot(q, uWn) / max(r, 1e-3));
    den = max(body, 1. - smoothstep(0.16, 0.25, r)); }`.replace('{', '{ ') }));
  discShadow.material.fragmentShader = discShadow.material.fragmentShader.replace('uniform float uSoft, uDen;', 'uniform float uSoft, uDen, uGone; uniform vec2 uWn;');
  const stalkShadow = new THREE.Mesh(stalkGeo, style.shadow({ pattern: '{ den = 0.92; }' }));
  const proxies = [starShadow, discShadow, stalkShadow];
  for (const p of proxies) { p.matrixAutoUpdate = false; style.exposure.add(p); }

  // ---- seen alone (no opts.style): stand it on its own sheet under its own sky and run the show on a loop
  if (standalone || opts.backdrop) {
    const sheet = new THREE.Mesh(new THREE.CircleGeometry(1400, 48), style.paper()); sheet.rotation.x = -Math.PI / 2; sheet.renderOrder = -0.4; object.add(sheet);
    style.uniforms.uSheet.value.z = opts.sheetRadius ?? 1150;
    const sky = style.makeSky(); sky.renderOrder = -0.5; object.add(sky);
  }
  if (standalone) style.exposure.compile();
  await ctx.yield();

  const SHED_SPAN = 11;       // seconds of shed time covered by setProgress 0..1 (brief: 29 s to 40 s)
  let driven = false, lastT = -1e3;
  const demoShed = (t) => ((t * 0.75) % 13) - 3.5;
  const hero = {
    object, radius: 11, height: HY + 9, center: new THREE.Vector3(0, HY - 3, 0), ground: false, groundY: 0, style,
    anchors: {
      heart: heart.clone(), globeRadius: 8.1, shadowCentre: shadowAt,
      portalSeat: { position: new THREE.Vector3(exit[0], exit[1], exit[2]), facing: W.clone().negate() },
      flyThrough: fly.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
      lane: { start: T2.clone(), dir: W.clone(), length: laneL }, wind: W.clone(),
      viewpoints: { reveal: new THREE.Vector3(passR, passY, -75), blaze: new THREE.Vector3(passR, passY, -45), swing: new THREE.Vector3(Math.cos(a2 * 0.5) * passR, passY, Math.sin(a2 * 0.5) * passR) },
    },
    // shed time in seconds: 0 = the first seed lets go, 4 = seventy are loose, ~11 = the last has gone through the ring
    setShed(sec) { driven = true; seedU.uShed.value = sec; },
    comb: combU,          // uSpan (seconds of track drawn), uWake (seconds a line takes to sink), uCloud (shed time the light returned, strength of what the cloud held)
    setProgress(u) { hero.setShed(-1 + Math.min(1, Math.max(0, u)) * (SHED_SPAN + 1)); },
    update(dt, time, camera) {
      if (standalone) {
        if (!driven) seedU.uShed.value = demoShed(time);
        style.rinse(2, 0.5, -0.86, -70 + ((time * 7) % 210));
      }
      discU.uGone.value = Math.min(1, Math.max(0, seedU.uShed.value / 5.5));
      inner.rotation.x = 0.010 * Math.sin(time * 0.53) + 0.004 * Math.sin(time * 1.31);       // a light air from the south-east
      inner.rotation.z = 0.012 * Math.sin(time * 0.41 + 1.3) + 0.004 * Math.sin(time * 1.07);
      object.updateMatrixWorld(true);
      for (const p of proxies) { p.matrix.copy(inner.matrixWorld); p.matrixWorld.copy(inner.matrixWorld); }
      if (standalone) {
        if (Math.abs(time - lastT) > 1) style.exposure.preroll(camera, (o) => { if (!driven) seedU.uShed.value = demoShed(time + o); style.uniforms.uTime.value = time + o; });
        lastT = time; style.update(dt, time, camera);
      }
    },
    dispose() { if (standalone) style.dispose(); else for (const p of proxies) style.exposure.scene.remove(p); starGeo.dispose(); discGeo.dispose(); penGeo.dispose(); proxies.forEach((p) => p.material.dispose()); },
  };
  return hero;
}
