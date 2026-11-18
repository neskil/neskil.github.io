// SOWN WITH CLOTH: hero set piece, "inside the cone", and the STYLE KIT for the whole world.
// A project drawing on grey card: 98 violet wax-crayon ribbons strung from a ruled steel collar on a leaning
// tower of bedded rock (pencil, charcoal lee) down to a ring of roped stakes of 190 m radius, two access bays.
//
// SIZE AND PLACE. Local metres, origin = centre of the tower's foot on level ground (y 0), +Y up. The piece must be
// TRANSLATED ONLY (no rotation, no scale): wind and light are world directions. In the world it sits at (110, 0, 610).
// radius 190 (stake ring), height 170 (tower), collar centre about y 150, leaning 17-26 m mostly toward minus Z.
// It expects level ground at y 0 inside r 200 and bare card behind it.
//
// OPTS. palette (7 hex strings, the brief's order); detail 0.6-1 (thins ribbon rows and swifts, never a ribbon);
// wind 'steady' | 'gusty' | 'gale' (default: drawn from ctx.rng); style (a makeStyle() result to share one set of
// uniforms with the world; default: makes its own and returns it as hero.style); ground (default true: a drawn
// level disc of 520 m with hatching and the cone's contact shade; pass false in the world and give your land
// material contact: 1); route (your real route through the cone as local points, default FLY: the two bays are cut
// where it pierces the sheet of ribbons); bayNearWidth 22, bayFarWidth 40 (metres at the stake ring; the far bay is
// wider than the brief's 22 because the route leaves obliquely and 22 left under 2 m of clear air); sheet (default true: a card-coloured backdrop behind everything, harmless; pass false
// when the world has its own card sky).
//
// RETURNS { object, radius, height, center, anchors, style, setProgress(u), wind, update(dt, time, camera), dispose }.
// update: sets style.uniforms.uTime (the world's clock: cloth never stops) and uConePos; reads only
// camera.matrixWorld, and only to keep the sheet centred. setProgress(u): the route's u; the swifts burst off the
// collar from u 0.355 and settle by 0.51. Nothing else is keyed to u here.
//
// ANCHORS (local): bayNear (-70,14,-159) and bayFar (-70,45,121): the route's points through the two access bays
// (world (-10,14,441) and (-10,45,721)); bayNearStake, bayFarStake: the empty stake places; flyThrough: seven points
// of a safe line (approach, near bay, the left-handed sweep past the rock at (-100,30,0), far bay, climb-out), at
// least 8 m clear of every ribbon at its greatest belly and 55 m from the rock; collar: collar centre; gaze: a poi
// just under the collar (use u 0.31-0.37); summit, lean; viewpoints: three composed {pos, look}; stakes: the 98
// stake feet; ringR; portalSeat: where the route's exit ring is (the banner's summit, NOT on this piece), for reference.
//
// COST. About 140k triangles, 9 draw calls (tower, its contour, collar, ribbons, stake plates, foot rigs, swifts,
// ground, sheet), 6 shader programs, no lights, no textures, no fog, build about 200 ms in short steps.
//
// HOW THE STYLE IS MADE (exports; shade the whole world with these so the hero is not pasted in):
//  PALETTE, CRAYON, LIGHT_DIR, WIND_DIR, CONE   constants. Colours are written as they are (post.flat = 1: no inverse tone map).
//  STYLE_GLSL (fragment)  shared uniforms and: sw_tooth (card tooth fixed in the world, three pixels across at any
//      distance), sw_strokes / sw_hatchSet / sw_hatch (pencil hatching in strokes 2 to 4 pixels wide: of the
//      spacings 0.0625 to 64 m the two that stand about 7 and 28 pixels apart are drawn, cross-faded by the pixel's
//      footprint; ONE diagonal, laid in patches; a second set 30 degrees off it crosses the first only inside the
//      contact shades under cloth), sw_chalkStrokes (chalk laid in short broad touches), sw_draw (card, then pencil,
//      charcoal smudge, chalk), sw_laid / sw_laidE / sw_laidMass (CHARCOAL LAID IN STROKES: a tone is read once for
//      each stroke on its own centre line, so a dark ends in stroke tips with card between; the card material lays
//      every lee of land, horn and tower this way, three to six pixels wide at any distance), sw_coneContact,
//      sw_fieldContact and sw_bannerContact (the contact shades under the three works, by place).
//  STYLE_VERT_GLSL        sw_px(depth): a thousandth of the frame's height in metres, for marks that must not thin away.
//  CLOTH_GLSL (fragment)  sw_crayon: the three exact crayon tones by the fold (nothing mixed between them), laid in wax
//      strokes 2 to 4 pixels wide along the fall (sw_waxSet) that step every tone boundary, hairs of bare card between
//      some strokes, the card's tooth through lightly laid wax (the tooth lives in the cloth and moves with it), the
//      hem missed; its last argument says how much of this a cloth can carry (none when it is a few pixels wide).
//      A cloth may set before the call: sw_streak (how far a stroke's own pressure shifts the tone), sw_comb (how far
//      neighbouring strokes step a tone boundary apart), sw_strokeW (stroke width, 1 = 2 to 4 pixels) and sw_wax
//      (share of stroke joins left as a hair of card, share of bare specks).
//      sw_foldLine: one thin pencil line per fold, none on a cloth under 12 pixels wide. Any cloth: your own vertex
//      motion + these.
//  RIBBON_GLSL            sw_ribWave: the ribbon's travelling ripple (12 m/s, 9-14 m) and its twist: once or twice
//      along its length each ribbon turns over through its own edge to show its under face in the shade tone.
//  makeStyle({palette})   -> { uniforms, crayons, clothUniforms(work), cardMaterial(o), outlineOf(mesh, width),
//      ruledMaterial(o), ribbonMaterial(work) }. uniforms: uCard uGraphite uCharcoal uChalk (the sheet variants swap
//      these), uLightDir, uWindDir, uTime, uWind (0.6 steady, 1 gusty, 1.45 gale), uPencil (pencil pressure),
//      uRoute (the ROUTE'S OWN POINT at u, set by the world, for the world's own followers), uConePos, uConeBays and
//      uConeN (set by the hero), uField, uBannerC and uBannerO (set by the world). All hatching is complete from the
//      first frame: nothing is laid in flight.
//      cardMaterial({ lee, contact, bedTone, smudge, mass, rock, side }): land, rock, cloud, bird (smudge: charcoal
//      shades on level ground; mass 1 for the open land and 2 for the horn: THE LAND IN THREE STEPS BY NEARNESS, far
//      the outline alone, middle a light hatch on lee sides, near the lees laid in charcoal strokes and chalk in
//      strokes; rock 1 for the tower: its lee pressed in the same strokes, laid on a smooth leaning cone that stands
//      for the rock (uRockAxis: its lean and height, set in buildTower), one firm pencil line at each bed plane and
//      each ledge left as a level line of bare card through the dark). Geometry attributes: aTone (vec3: pencil tone, charcoal, chalk) and aBed
//      (bed coordinate, optional). outlineOf: the pencil contour (inside-out hull).
//      ruledMaterial({ chalk, heavy }): steel and rope; geometry from ruledBox, ruledTube, ruledRing (uv per face +
//      aSize). heavy 1 (the summit's steel): outlines 2 to 3 pixels, lee faces hatched, charcoal on the lee and rim.
//  ruledBox, ruledTube, ruledRing   geometry builders for ruled hardware.
//
// LAWFUL READINGS OF THE VIEW (owner's term D), all in shaders: the pixel's footprint (fwidth / dFdx of world
// position, of stroke and of cloth coordinates) to filter tooth, hatching, chalk, lines, wax strokes and rope turns; a slope across
// neighbouring pixels (fwidth of the cloth tone) for the pencil fold line; the direction from a thing to the eye
// (cameraPosition - P) for the rim line of ruled tubes; the projection matrix with a thing's own view depth (sw_px)
// for minimum mark widths and for the land's three steps by nearness; the eyelets of a ribbon are drawn at their
// true size and only while over two pixels across.
// Nothing reads the camera object except the sheet backdrop's centring. Nothing keeps its place on the screen.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as core from '../kit/core.js';

export const PALETTE = ['#DED6C4', '#77746E', '#262421', '#F3EFE4', '#16B3AE', '#5A2A9C', '#0F9B58'];
// crayon triples (shade, mid, light) per work; the mid tone comes from the palette, the others are fixed by the style note
export const CRAYON = {
  turquoise: ['#0C7C82', '#16B3AE', '#7FE0D6'],
  violet: ['#36156A', '#5A2A9C', '#A27FE0'],
  emerald: ['#076B3C', '#0F9B58', '#6FD79C'],
};
// the one implied light (upper port, plus X) and the ribbons' wind (WIND_DIR: the cone's ribbons keep this belly;
// the summit's cloth and the field's gusts take the world's own wind, lead-note-6 S1); world space, never cast
export const LIGHT_DIR = new THREE.Vector3(0.66, 0.72, 0.21).normalize();
export const WIND_DIR = new THREE.Vector3(-Math.sin(25 * Math.PI / 180), 0, -Math.cos(25 * Math.PI / 180));   // toward astern and starboard, 25 degrees off the course (Q1)

// the brief's route through the cone, local (world minus (60, 0, 600)); the bays are cut where a route pierces the cone
export const FLY = [[-70, 9, -260], [-70, 14, -159], [-90, 21, -85], [-100, 30, 0], [-91, 39, 68], [-70, 45, 121], [-62, 62, 200]];
// cone measurements (local metres; origin = centre of the tower's foot)
export const CONE = { ringR: 190, ribbons: 98, bayNearWidth: 22, bayFarWidth: 40, collarR: 16, collarY: 150, towerH: 170, footW: 4, topW: 1,
  bayNear: [-70, 14, -159], bayFar: [-70, 45, 121] };

// ------------------------------------------------------------------------------------------------
// STYLE_GLSL: everything a fragment shader needs to draw on the card. Declares the shared uniforms.
// ------------------------------------------------------------------------------------------------
export const STYLE_GLSL = /* glsl */`
uniform vec3 uCard, uGraphite, uCharcoal, uChalk;
uniform vec3 uLightDir, uWindDir;
uniform float uTime, uWind, uPencil;
uniform vec3 uConePos;
uniform vec4 uConeBays;
uniform vec2 uConeN;    // ribbons in the port arc and in the starboard arc
uniform vec4 uField;    // the sown field: half width (x), z0, z1, strength of its contact shade (0 = none)
uniform vec4 uBannerC;  // the banner's contact shade: half width, length of the cloth, height of the hoist, strength (0 = none)
uniform vec4 uBannerO;  // the banner's line in plan: the hoist's centre (x, z) and the way it streams (x, z)
float sw_h11(float n){ return fract(sin(n * 127.1 + 1.7) * 43758.5453); }
float sw_h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float sw_h31(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float sw_vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(sw_h21(i), sw_h21(i + vec2(1., 0.)), f.x), mix(sw_h21(i + vec2(0., 1.)), sw_h21(i + vec2(1., 1.)), f.x), f.y); }
float sw_vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  float a = mix(sw_h31(i), sw_h31(i + vec3(1., 0., 0.)), f.x), b = mix(sw_h31(i + vec3(0., 1., 0.)), sw_h31(i + vec3(1., 1., 0.)), f.x);
  float c = mix(sw_h31(i + vec3(0., 0., 1.)), sw_h31(i + vec3(1., 0., 1.)), f.x), d = mix(sw_h31(i + vec3(0., 1., 1.)), sw_h31(i + vec3(1., 1., 1.)), f.x);
  return mix(mix(a, b, f.y), mix(c, d, f.y), f.z); }
float sw_fbm2(vec2 p){ return sw_vn2(p) * .55 + sw_vn2(p * 2.13 + 7.1) * .3 + sw_vn2(p * 4.7 + 3.3) * .15; }
// pixel footprint in metres of a world position (filter by the pixel's footprint: lawful)
float sw_foot(vec3 P){ vec3 d = fwidth(P); return max(max(d.x, max(d.y, d.z)), 1e-5); }
// the pixel's SHORT side on the surface, in metres: it grows with distance alone, whatever the angle the surface is seen at
float sw_short(vec3 P){
  vec3 dx = dFdx(P), dy = dFdy(P);
  float A = dot(dx, dx), B = dot(dx, dy), C = dot(dy, dy);
  return sqrt(max(.5 * (A + C - sqrt(max((A - C) * (A - C) + 4. * B * B, 0.))), 1e-10));
}
// CARD TOOTH: grain with a place in the world, about three pixels across at any distance, 0..1
float sw_tooth(vec3 P, float fw){
  float l = log2(max(fw * 2.6, 1e-5)), l0 = floor(l), f = l - l0;
  float s0 = exp2(-l0);
  return mix(sw_vn3(P * s0), sw_vn3(P * s0 * .5 + 11.3), f);
}
// one set of parallel pencil strokes. c = metres across the strokes, a = metres along them, fwc = fwidth(c),
// t = tone wanted 0..1. Returns graphite coverage 0..1.
// A stroke runs 14 to 60 times its spacing before the hand lifts; it presses in the middle and lifts to nothing at
// both ends (its width and its weight taper over the last third of each end), and its weight breathes along its length.
float sw_strokes(float c, float a, float fwc, float period, float t){
  float x = c / period + .22 * (sw_vn2(vec2(a * .035, c * .13) / period) - .5);
  float id = floor(x), f = abs(fract(x) - .5);
  float r1 = sw_h11(id * 1.37 + period * 17.), r2 = sw_h11(id * 2.11 + period * 5.);
  float seg = a / (period * (14. + 46. * r2 * r2)) + r1 * 9.;
  float hl = .3 + .19 * sw_h11(id * 3.3 + floor(seg) * 1.9);
  float gap = 1. - smoothstep(hl * .42, hl, abs(fract(seg) - .5));          // the taper: 1 in the middle, 0 at the lifted ends
  float press = (.6 + .4 * sw_vn2(vec2(a / (period * 14.) + r2 * 31., id * .7))) * (.35 + .65 * gap);
  float want = clamp(t * 1.5 + .1, 0., 1.);
  float present = smoothstep(want + .02, want - .02, r2) * smoothstep(0., .3, gap);
  float px = period / max(fwc, 1e-5);
  float w = clamp(mix(.16, .42, t) * press, 1.15 / px, 3.2 / px);      // a stroke is 2 to 4 pixels wide in its middle, near or far
  float aa = .8 / px;
  float line = (1. - smoothstep(w * .5 - aa, w * .5 + aa, f)) * present * (.5 + .5 * press);
  float avg = mix(.2, .5, t) * want * .9;
  return mix(avg, line, smoothstep(2.5, 4.5, px));
}
// strokes at the drawing's own scale: of the stroke spacings 0.0625, 0.25, 1, 4, 16 and 64 m the two that stand about
// (and 256 m on a slope seen at a low angle) 7 and 28 pixels apart are drawn and cross-faded by the pixel's footprint (fc = fwidth of the across coordinate), so
// near ground and a flank a kilometre off are both hatched by the same hand; a spacing under 3 pixels has faded into
// its flat average.
float sw_hatchSet(float c, float a, float fc, float t){
  float lv = clamp(log2(max(fc, 1e-6) * 7.) * .5, -2., 3.999);
  float i0 = floor(lv), fr = lv - i0;
  float p0 = exp2(2. * i0), p1 = p0 * 4.;
  float wf = 1. - smoothstep(.5, 1., fr), wc = smoothstep(0., .5, fr);
  float h0 = sw_strokes(c, a, fc, p0, t);
  float h1 = sw_strokes(c, a, fc, p1, t);
  return max(h0 * wf, h1 * wc);
}
// HATCHING: ONE set of parallel strokes at one fixed diagonal (60 degrees to the course on level ground). A stroke is
// where an upright plane across that diagonal cuts the surface, so the strokes are parallel in plan and draped over the
// form: one direction across a whole flank, with no kink where the surface turns from facet to facet. Laid in patches
// (dense beside nearly bare). t = the half tone wanted. A second set, 30 degrees off the
// first, crosses it only where x says so: x is the contact shade under a cloth and nothing else, so no hillside is ever
// a lattice. With distance the strokes thin and at last leave one flat tone.
// ON THE HORN (sw_hornK 1, set by the card material from a vertex attribute that rises smoothly from the valley floor)
// the cutting planes lean over: they hold the line of sight of the valley (between the entry's and the last run's), so
// from the field and from beside the banner every stroke on every face of the peak lies at the hand's one slant,
// rising to the right, instead of running down the fall lines to meet at the summit.
float sw_hornK = 0.;
float sw_hatch(vec3 P, vec3 N, float t, float x){
  const vec3 d1 = vec3(.5, 0., -.866), e1 = vec3(.866, 0., .5);
  const vec3 d2 = vec3(.866, 0., -.5), e2 = vec3(.5, 0., .866);
  const vec3 dS = vec3(.585, .767, -.263), eS = vec3(-.7, .64, .31);
  // ON THE OPEN LAND THE HATCH IS LAID IN PATCHES OF THREE SLANTS (the twelfth review), 17 degrees apart, each patch
  // fading out toward its neighbours, so the strokes of a wide level floor never all run to one vanishing point
  float pq = sw_vn2(P.xz * .016 + 13.) * 3., pk = floor(pq), pf = pq - pk, land = 1. - sw_hornK;
  float rot = (pk - 1.) * .3 * land, patchW = mix(1., smoothstep(0., .16, pf) * smoothstep(1., .84, pf), land);
  float cl = dot(P, d1), al = dot(P, e1);
  float c1 = mix(cl * cos(rot) + al * sin(rot), dot(P, dS), sw_hornK), a1 = mix(al * cos(rot) - cl * sin(rot), dot(P, eS) - .35 * P.y, sw_hornK), c2 = dot(P, d2), a2 = dot(P, e2);
  vec3 dn = mix(d1, dS, sw_hornK); dn = dn / max(length(dn), 1e-4);
  // the hand's angle drifts a few degrees from patch to patch
  c1 += 2.2 * (sw_vn2(P.xz * .021) - .5);
  c2 += 2.2 * (sw_vn2(P.xz * .017 + 31.) - .5);
  float f1 = max(fwidth(c1), 1e-5), f2 = max(fwidth(c2), 1e-5);
  float flat1 = smoothstep(.97, .85, abs(dot(N, dn)));
  float pm = sw_vn2(P.xz * .035 + P.y * .02 + 7.);
  a1 += .35 * P.y;                                    // a stroke running down a steep face is still measured along its length
  float tp = clamp(t * (.3 + 1.4 * smoothstep(.25, .6, pm)), 0., 1.) * patchW;
  float avg = mix(.2, .5, tp) * clamp(tp * 1.5 + .1, 0., 1.) * .9;
  float h = mix(avg, sw_hatchSet(c1, a1, f1, tp), flat1);
  float hx = mix(.2, sw_hatchSet(c2, a2, f2, x * .8), smoothstep(.97, .85, abs(dot(N, d2))));
  h = max(h, hx * x);
  // depth is pressure: the strokes give way to their flat tone by the pixel's SHORT side on the surface (its footprint,
  // which grows with distance alone), not by its long side, so a slope seen at a low angle a few hundred metres off is
  // still hatched, at a wider spacing, while beyond about 1,400 m only the flat tone is left
  return clamp(mix(h, max(avg, .3 * x), max(smoothstep(3., 4.6, sw_short(P)), smoothstep(30., 60., f1))), 0., 1.);
}
// CHALK is laid in strokes too: broad ones at an angle of their own, the widest the pixel can hold, with card and pencil
// left between them. Returns the share of the chalk wanted that lies here, .3 to 1.
float sw_chalkStrokes(vec3 P){
  const vec3 d3 = vec3(.31, .2, .93), e3 = vec3(.95, 0., -.31);
  float c = dot(P, d3) + 3. * (sw_vn2(P.xz * .013 + 5.) - .5), a = dot(P, e3);
  // the pixel's short side on the ground: the same on every facet at one distance, so a touch runs on across facets
  vec3 dx = dFdx(P), dy = dFdy(P);
  float A = dot(dx, dx), B = dot(dx, dy), C = dot(dy, dy);
  float fm = sqrt(max(.5 * (A + C - sqrt((A - C) * (A - C) + 4. * B * B)), 1e-10));
  float fc = max(fwidth(c), 1e-5);
  // touches 3 to 6 pixels wide and some ten times as long, at the two sizes the pixel can hold; an even tone where a
  // slope seen edge on would crowd them
  float lv = log2(fm * 3.2), i0 = floor(lv), fr = lv - i0, p0 = exp2(i0), p1 = p0 * 2.;
  float n0 = sw_vn2(vec2(c / p0, a / (p0 * 11.) + 3.)), n1 = sw_vn2(vec2(c / p1 + 5., a / (p1 * 11.)));
  float k = smoothstep(.33, .55, mix(n0, n1, smoothstep(.15, .85, fr)));
  return .3 + .7 * mix(k, .5, smoothstep(.45, 1.1, fc / p0));
}
// lay pencil, then charcoal, then chalk on the card. All amounts 0..1. Depth is pressure: fw thins the pencil.
vec3 sw_draw(vec3 P, float fw, float pencil, float charcoal, float chalk){
  float th = sw_tooth(P, fw);
  vec3 col = uCard * (1. + (th - .5) * .05);
  float far = 1. - .55 * smoothstep(1.4, 4., fw);
  col = mix(col, uGraphite, clamp(pencil * uPencil * far * (.72 + .5 * th), 0., 1.));
  // the cores of the stumped masses are pressed solid and hold at any distance (Q2: real darks); their fringes thin
  float core = smoothstep(.6, .92, charcoal);
  float smudge = charcoal * (.82 + .3 * sw_vn3(P * .05)) * (1. - .3 * smoothstep(4., 9., fw) * (1. - core));
  col = mix(col, uCharcoal, clamp(smudge * mix(.6 + .55 * th, .95 + .1 * th, core) + .1 * core, 0., 1.));   // the pressed cores reach the charcoal itself
  col = mix(col, uChalk, clamp(chalk * (.45 + .8 * th), 0., 1.));
  return col;
}
// A TONE LAID IN STROKES (the squall, the land's and the tower's charcoal): cw is the place across the strokes in stroke
// pitches, fcw the pixel's footprint in the same measure (a slope across neighbouring pixels: lawful), k how far the
// tone stands over its threshold (0 at the stroke's point, 1 where it has its full width), full that width as a share
// of the stroke's pitch (over 1: neighbouring strokes close up solid). Under some three pixels to a stroke it gives
// way to its flat average.
float sw_laidE(float cw, float fcw, float k, float full, float soft){
  float f = abs(fract(cw) - .5) * 2., duty = clamp(k, 0., 1.) * full, e = clamp(soft * fcw, .02, 1.);
  return (1. - smoothstep(duty - e, duty + e, f)) * clamp(duty / e, 0., 1.);
}
float sw_laid(float cw, float fcw, float k, float full){ return sw_laidE(cw, fcw, k, full, 2.); }
// a charcoal mass laid in strokes of pitch p (metres across, c; a along them): the tone cT is read ONCE FOR EACH STROKE,
// on its own centre line (carried there by slope, the tone's own fall across the strokes, taken across neighbouring
// pixels), so the mass ends where its strokes end, each at a place of its own and tapering to a point. x: the open
// tone (strokes with card between them), y: the pressed core (strokes closed up until only a hair of card is left
// between some of them: sw_coreFull is the pressed stroke's width as a share of its pitch).
float sw_coreFull = .93;
vec2 sw_laidMass(float c, float a, float fc, float p, float cT, float slope){
  float cw = c / p, ci = floor(cw), hs = sw_h11(ci * 1.7 + p * 3.1);
  float n = cT + clamp(slope * (ci + .5 - cw) * p, -.3, .3) + .1 * (hs - .5) + .12 * (sw_vn2(vec2(ci * 3.7 + p, a / (p * 9.))) - .5);
  return vec2(sw_laidE(cw, fc / p, (n - .34) / .14, .56 + .28 * hs, 1.1), sw_laidE(cw, fc / p, (n - .62) / .1, sw_coreFull + .1 * hs, 1.1));
}
// CONTACT SHADE under the sown field (a soft edgeless smudge, heavier along the drilled rows) and under the banner
// (fainter the further the cloth flies above the land), by place, never cast.
float sw_fieldContact(vec3 P){
  float e = min(min(P.x + uField.x, uField.x - P.x), min(P.z - uField.y, uField.z - P.z));
  float edge = smoothstep(-.6, 1.6, e + 1.2 * (sw_vn2(P.xz * .31) - .5));
  edge *= .3 + .7 * smoothstep(uField.y + 10., uField.y + 170., P.z);      // the far end is drilled but not yet sown: furrows, little shade
  edge *= (.2 + .8 * smoothstep(4., 70., uField.x - abs(P.x))) * (.25 + .75 * smoothstep(2., 46., uField.z - P.z));   // the sides and the cone's end fray out pass by pass
  float fx = max(fwidth(P.x), 1e-5);
  float row = abs(fract(P.x / 1.1) - .5) * 1.1;
  float band = 1. - smoothstep(.12, .5, row);
  band = mix(.42, band, smoothstep(2.5, 5., 1.1 / fx));
  float leeE = -(P.x + uField.x);                    // metres outside the starboard edge
  // the lee band: 16 to 30 m wide by place; from high off it thins to a light tone (the pixel's size on the ground:
  // lawful), never a black wedge
  float fpl = max(max(fwidth(P.x), fwidth(P.z)), 1e-4);
  float leeB = step(0., leeE) * (1. - smoothstep(2. + 2. * min(fpl, .5), 16. + 8. * sw_vn2(P.xz * .05) + 8. * min(fpl, .5), leeE)) * smoothstep(-6., 4., min(P.z - uField.y, uField.z - P.z));
  return max(edge * (.5 + .42 * band) * (.85 + .3 * sw_vn2(P.xz * .07)), mix(.8, .3, smoothstep(.35, 1.1, fpl)) * leeB);
}
float sw_bannerHem = 0.;      // set by sw_bannerContact: the band of shade beside the port hem where the cloth passes close over the land
float sw_bannerGap = 0.;      // set by sw_bannerContact: metres from the land here up to the cloth's own line
float sw_bannerNarrow = 0.;   // set before the call: 1 on the horn, where the shade is a little narrower than the cloth
float sw_bannerContact(vec3 P){
  vec2 q = P.xz - uBannerO.xy;
  float s = dot(q, uBannerO.zw), x = dot(q, vec2(uBannerO.w, -uBannerO.z));
  float bq = max(s, 0.);
  // the cloth's own line (bannerY in the world): all but level for 80 m off the ring, the pour to 403 m, then all but level
  float by = uBannerC.z - .55 * (22. * log(1. + exp(min((bq - 80.) / 22., 20.))) - .572 - 22. * log(1. + exp(min((bq - 403.) / 22., 20.)))) - .012 * bq;
  x -= 24.3 * (log(1. + exp(min((bq - 640.) / 90., 20.))) - .000816);   // the cloth's swing to starboard past the cone (bannerLX in the world)
  float gap = max(by - P.y, 0.);
  sw_bannerGap = gap;
  float w = uBannerC.x * (1. - .4 * smoothstep(0., uBannerC.y, s));
  w *= 1. - .15 * sw_bannerNarrow;
  float lat = 1. - smoothstep(w * .8, w * 1.3 + gap * .04, abs(x - .06 * gap + (sw_vn2(P.xz * .02) - .5) * 14.));      // as wide as the cloth, and a little beyond each hem
  // (past the cone the cloth's far third flies thin and high and its shade is a light broken tone: the headland and
  // the cone's floor keep their card)
  float along = smoothstep(-4., 12., s) * (1. - smoothstep(uBannerC.y - 40., uBannerC.y + 30., s)) * (1. - .7 * smoothstep(520., 660., s));
  // BESIDE THE PORT HEM, where the cloth passes close over the land (the pour over the horn's snow), a band of shade
  // nine metres wide lies on the land just outside the cloth, broken along its length: the cloth is seen to hang over
  // the mountain, not to lie on it
  float w0 = uBannerC.x * (1. - .4 * smoothstep(0., uBannerC.y, s)) * (.55 + .45 * smoothstep(40., 260., s));
  sw_bannerHem = (1. - smoothstep(30., 90., gap)) * smoothstep(w0 - 5., w0 - 1., -x) * (1. - smoothstep(w0 + 5., w0 + 11., -x + (sw_vn2(P.xz * .09) - .5) * 5.))
    * smoothstep(.22, .42, sw_vn2(vec2(s * .045, 7.))) * along;
  // the shade is drawn, not cast: it keeps its weight however high the cloth flies (a little lighter under the far cloth)
  return lat * along * mix(1., .86, smoothstep(140., 420., gap));
}
// CONTACT SHADE of the ribbon cone on level ground, by place (never cast): 0..1 at world position P.
float sw_coneContact(vec3 P){
  vec2 q = P.xz - uConePos.xz;
  float r = length(q);
  float ang = (r > 1e-3) ? atan(q.y, q.x) : 0.;
  // two arcs of evenly spaced stakes between the bays: uConeBays = (first angle, span) of the port arc, then of the starboard arc
  float stA = uConeBays.y / max(uConeN.x - 1., 1.), stB = uConeBays.w / max(uConeN.y - 1., 1.);
  float xa = (mod(ang - uConeBays.x + .03, 6.2831853) - .03) / max(stA, 1e-4);
  float xb = (mod(ang - uConeBays.z + .03, 6.2831853) - .03) / max(stB, 1e-4);
  float inA = step(xa, uConeN.x - .5), inB = (1. - inA) * step(xb, uConeN.y - .5);
  float sl = mix(xb, xa, inA), n = mix(uConeN.y - 1., uConeN.x - 1., inA), st = mix(stB, stA, inA);
  float id = clamp(floor(sl + .5), 0., n);
  float bay = max(inA, inB);
  float lat = abs(sl - id) * r * st;
  float k = clamp((${CONE.ringR.toFixed(1)} - r) / 174., 0., 1.);
  float h = k * 150.;
  // under each ribbon ONE SHORT BAND of rubbed shade (the twelfth review): the ribbon's own width, begun at its stake
  // and lifting some 25 m in, where the cloth has climbed out of reach of the ground; torn at the edges, pressed
  // unevenly and broken along its length, each of a weight of its own. Nothing runs on in to the tower's foot.
  float hw = mix(2.2, 1.3, clamp(h / 30., 0., 1.));
  float torn = lat + (sw_vn2(vec2(r * .35, id * 7.1)) - .5) * 1.3;
  float s = (1. - smoothstep(hw * .55, hw + .7, torn)) * exp(-h / 11.) * smoothstep(-6., 1., ${CONE.ringR.toFixed(1)} - r - 2.) * step(r, ${CONE.ringR.toFixed(1)} + 1.5);
  s *= (.6 + .4 * sw_vn2(vec2(r * .09, id * 3.3))) * smoothstep(.16, .4, sw_vn2(vec2(r * .07 + id, id * 1.7)));
  return s * (.5 + .22 * sw_h11(id + n)) * bay;
}
`;

// vertex helpers: sw_px(viewDepth) = world size of one thousandth of the frame's height at that depth
// (a filter by the pixel's footprint, from the projection alone), used to keep thin marks from thinning away.
export const STYLE_VERT_GLSL = /* glsl */`
float sw_px(float depth){ return max(depth, .05) * 2. / max(projectionMatrix[1][1] * 1000., 1e-3); }
`;

const CARD_VERT = /* glsl */`
${STYLE_VERT_GLSL}
attribute vec3 aTone;
attribute float aBed;
uniform float uHull;
varying vec3 vP, vN, vTone;
varying float vBed, vPx;
void main(){
  vec3 p = position;
  #ifdef USE_INSTANCING
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.);
  vec3 wn = mat3(modelMatrix) * mat3(instanceMatrix) * normal;
  #else
  vec4 wp = modelMatrix * vec4(p, 1.);
  vec3 wn = mat3(modelMatrix) * normal;
  #endif
  vec4 mv = viewMatrix * wp;
  // uHull > 0: this is the pencil contour, the same form pushed out along its normal by uHull thousandths of the frame
  wp.xyz += normalize(wn + vec3(0., 1e-6, 0.)) * uHull * sw_px(-mv.z);
  vP = wp.xyz; vN = wn; vTone = aTone; vBed = aBed;
  vPx = sw_px(-mv.z);      // a thousandth of the frame's height at this thing's own view depth, in metres: its NEARNESS
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CARD_FRAG = /* glsl */`
${STYLE_GLSL}
uniform float uHull, uContact, uLee, uBedTone, uSmudge, uMass, uRock;
uniform vec4 uRockAxis;   // the tower (rock: 1): its lean at the top (x, z) and its height
varying vec3 vP, vN, vTone;
varying float vBed, vPx;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-6, 0.));
  float fw = sw_foot(vP);
  // THE ROCK'S STROKES LIE ON ITS WHOLE FORM (the eleventh review): on the tower the strokes' planes cut a smooth
  // leaning cone that stands for the rock (the place carried out along the radius from the tower's own axis to that
  // cone), not the stepped and jointed surface itself, so a stroke runs straight across ledges, joints and blocks and is
  // never bent into chevrons by them
  vec3 PS = vP;
  if (uRock > .5) {
    float yy = max(vP.y - uConePos.y, 0.), kA = pow(max(yy / max(uRockAxis.z, 1.), 1e-4), 1.3), sk = max(0., 1. - yy / 26.);
    vec2 axS = uConePos.xz + uRockAxis.xy * kA, qS = vP.xz - axS;
    PS.xz = axS + qS / max(length(qS), 1e-3) * (26. - 11. * clamp(yy / 150., 0., 1.) + 12. * sk * sk);
  }
  if (uHull > 0.) {  // contour: graphite of slightly uneven weight, breaking here and there
    float wgt = .78 + .22 * sw_vn3(vP * .21);
    float th = sw_tooth(vP, fw);
    gl_FragColor = vec4(mix(uCard, mix(uGraphite, uCharcoal, .4), clamp(wgt * (.8 + .4 * th), 0., 1.)), 1.);
    return;
  }
  float nl = dot(N, uLightDir);
  float lee = smoothstep(.34, -.5, nl);
  float under = smoothstep(-.05, -.75, N.y);
  // the pencil half tone: the tone baked at build, a little more on lee and under sides, thinning to bare card on the lit
  // shoulders of slopes. Its strokes are one set; the lee itself is massed in charcoal below.
  float lit = smoothstep(.35, .85, nl) * smoothstep(.985, .9, N.y);
  float mk = min(uMass, 1.), horn = step(1.5, uMass);
  sw_hornK = max(clamp(vBed, 0., 1.) * horn, uRock);      // the tower (rock: 1): every face hatched at the hand's slant, as the horn is
  float t = smoothstep(.06, .8, clamp(vTone.x * (1. - .85 * lit * mk * (1. - smoothstep(.12, .4, vTone.y))) + uLee * mix(.95 * lee + .4 * under, .45 * lee + .3 * under, mk) * (1. - horn) * (1. - .55 * uRock), 0., 1.));
  // S3: THE LAND IN THREE STEPS BY NEARNESS (land and horn, uMass over 0; vPx is the thing's own view depth through the
  // projection, lawful: see the head). NEAR (under some 750 m): crisp line, hatching, charcoal lees laid in strokes,
  // chalk. MIDDLE: firm line and light hatching on the lee sides only, the lees' charcoal strokes lifted to a pale tone. FAR (beyond some 1,600 to 2,100 m; T4: the middle ranges are inked):
  // the outline alone, no hatch, no fill, no chalk. Nothing far is dark, nothing near is pale.
  float nearK = 1. - smoothstep(.9, 1.6, vPx), farK = smoothstep(1.9, 2.5, vPx);
  t *= mix(1., mix(.75 * smoothstep(.25, -.25, nl), 1., nearK) * (1. - farK), mk);
  // the contact shade under the ribbons and under the banner is the darkest ground: hatched, CROSSED (the only crossing
  // in the drawing), then stumped
  float level = smoothstep(.5, .9, N.y);
  sw_bannerNarrow = sw_hornK * horn;
  float contactB = uContact * uBannerC.w * sw_bannerContact(vP) * smoothstep(-.25, .3, N.y), contactC = uContact * sw_coneContact(vP) * level;
  float contact = max(contactC, contactB);
  t = max(t, max(contactC * .97, contactB * .3));      // the banner's shade: a light pencil hatch one way under its rubbed charcoal (below)
  float pencil = sw_hatch(PS, N, t, smoothstep(.22, .6, contactC)) * step(.02, t);
  // on the open land the pencil lightens with distance by the pixel's short side (sw_draw lightens it by the long side,
  // which would leave every slope seen at a low angle a whisper): the long side's share is taken back out here
  pencil *= mix(1., (1. - .5 * smoothstep(3., 5., sw_short(vP))) / (1. - .55 * smoothstep(1.4, 4., fw)), mk);
  // bed lines: one pencil line at each half-integer of the bed coordinate, never under 1.5 px, flat tone when crowded
  float fb = max(fwidth(vBed), 1e-5);
  float dl = abs(fract(vBed) - .5) / fb;
  float bw = .9 + 1.3 * sw_vn3(vP * .13 + 5.);
  float bline = (1. - smoothstep(bw * .5, bw * .5 + 1., dl)) * (.45 + .55 * sw_vn3(vP * .07 + 9.)) * smoothstep(.34, .2, fb);
  // THE TOWER'S STRATA (S4, rock: 1): one firm pencil line along every bed PLANE (the ledge between two beds, at each
  // whole number of the bed coordinate), each bed's line of a weight of its own, a little uneven, broken where the hand
  // lifted; none in the middle of a bed's face
  float bedId = floor(vBed + .5), dPl = min(fract(vBed), 1. - fract(vBed)) / fb;
  float bOn = smoothstep(.2, .3, sw_vn3(vec3(vP.xz * .08, bedId * 3.7)));
  float sline = (1. - smoothstep(bw * .5 + .2, bw * .5 + 1.2, dPl)) * (.62 + .38 * sw_h11(bedId * 2.3 + 1.)) * (.8 + .2 * sw_vn3(vP * .07 + 9.)) * bOn;
  bline = mix(bline, sline, uRock);
  // T2: the tower's faces that turn toward the light are bare card (its lines and its ledges' shades draw it there)
  pencil *= 1. - uRock * mix(.9, .98, smoothstep(-.3, .2, nl));
  bline = mix(.3, bline, smoothstep(.34, .2, fb)) * uBedTone;
  pencil = max(pencil, bline);
  // charcoal: stumped lee and under sides. On the land (uMass 1) it is gathered into big edgeless masses in the lee
  // gullies, whose cores reach the charcoal itself (Q2: the card is the sheet's middle tone, not its whole range)
  float mass = smoothstep(.36, .66, sw_fbm2(vP.xz * .0062 + vP.y * .004 + 2.3));
  float charcoal = clamp(vTone.y * mix(1., .5 + .6 * mass, mk) + uLee * (lee * mix(lee * .85, (.35 + .65 * lee) * (.6 + .4 * mass), mk) + under * .35), 0., 1.);   // on the land a ridge's whole lee carries the tone, so its strokes stand together as one mass
  // R4: on the land and on the horn these masses are DRAWN, in two steps with hard torn edges: a fringe of charcoal
  // strokes at the hand's one slant with the card left between them, and a core pressed solid; far off the strokes
  // close into one flat tone
  charcoal = mix(charcoal, vTone.y, horn);            // the horn (mass: 2): its masses are laid at build, vertex by vertex
  // THE TOWER'S LEE (rock: 1; T2): hatched in open charcoal strokes; the port faces of its blocks (the joints
  // that turn toward the light) and the tops of its ledges are left bare card
  float rockLit = max(smoothstep(-.12, .38, nl) * .75, smoothstep(.3, .7, N.y));
  charcoal *= 1. - uRock * rockLit;
  // S3: no charcoal on the middle and far land. The tone itself is hardly lowered with distance (a tone lowered to its
  // threshold leaves single strokes standing apart, which read as trees): the strokes laid from it are LIFTED instead
  // (midK, below), so a middle lee is the same mass of strokes, pale, and a far one is not there
  float midK = smoothstep(1.5, 2.1, vPx) * mk;
  charcoal *= 1. - .25 * midK;
  // (the open land's own lees stay strokes with the card between them: only the horn, the rock and the contact shades
  // are pressed solid, so no hill is one closed black shape)
  charcoal = mix(charcoal, min(charcoal, .84), mk * (1. - horn));
  // T2: THE TOWER IS NOT BLACK. Its lee is hatched in open charcoal strokes with the card between them; only the
  // under sides of its ledges are pressed
  charcoal = mix(charcoal, min(charcoal, .43 + .4 * under), uRock);
  // THE BANNER'S SHADE (the twelfth review: the cloth has weight) is RUBBED: one broad band of charcoal rubbed into the
  // card under the cloth's own line, as wide as the cloth, on valley floor, hill and snow alike, mid grey under the
  // high cloth and pressed dark where the cloth passes close over the land (on the horn), torn at its edges, the
  // card's tooth through it; it keeps its weight at any distance and no chalk is laid in it. It is laid over the
  // land's own strokes (below), never as strokes of its own: long parallel strokes on a level floor run to a point.
  float nearB = max(1. - smoothstep(60., 200., sw_bannerGap), sw_hornK * horn);
  float tornB = smoothstep(.3, .42, contactB + (sw_vn2(vP.xz * .09 + 2.) - .5) * .45 + (sw_vn2(vP.xz * .31 + 9.) - .5) * .2);
  float shadeB = max(contactB * tornB, uContact * uBannerC.w * sw_bannerHem * smoothstep(-.25, .3, N.y)) * (mix(.46, .8, nearB) + .16 * sw_vn2(vP.xz * .013 + 4.));
  float keepB = smoothstep(.2, .5, shadeB);
  sw_coreFull = mix(.93, 1.25, mk);
  {
    // EVERY DARK IS LAID IN STROKES (S3, S4; the tenth review: no closed dark shape with a smooth outline): charcoal
    // strokes at the hand's one slant, three to six pixels wide at any distance (two pitches cross-faded by the
    // pixel's footprint across the strokes), the tone read once for each stroke, so a lee ends in stroke tips with
    // card between them and its core is the same strokes closed up
    float cL = mix(dot(PS, vec3(.5, 0., -.866)), dot(PS, vec3(.585, .767, -.263)), sw_hornK) + 2.2 * (sw_vn2(PS.xz * .021) - .5) + 1.7;
    float aL = mix(dot(PS, vec3(.866, 0., .5)) + .35 * PS.y, dot(PS, vec3(-.7, .64, .31)), sw_hornK) + 9.;
    float cT = charcoal + .14 * (sw_vn2(vP.xz * .028 + vP.y * .02) - .5) + .09 * (sw_vn2(vP.xz * .11 + vP.y * .07 + 5.) - .5);
    float fcL = max(fwidth(cL), 1e-5);
    vec2 gC = vec2(dFdx(cL), dFdy(cL)), gT = vec2(dFdx(cT), dFdy(cT));
    float slope = dot(gT, gC) / max(dot(gC, gC), 1e-8);
    float lv = log2(fcL * 9.), i0 = floor(lv);
    vec2 laid = mix(sw_laidMass(cL, aL, fcL, exp2(i0), cT, slope), sw_laidMass(cL, aL, fcL, exp2(i0 + 1.), cT, slope), smoothstep(.25, .75, lv - i0));
    // THE LEES ARE MASSES (the twelfth review): on land and horn the open strokes are a rubbed mid grey fringe (the
    // card's tooth through them), under them a soft rubbed tone, and the core is the same strokes pressed until they
    // close, so a lee is one dark shape with a torn edge and no stroke stands alone as a black mark
    float rub = .34 * smoothstep(.3, .6, cT);
    float laidT = mix(max(laid.x * .9, laid.y), max(max(laid.x * .5, rub), laid.y), mk);
    charcoal = mix(charcoal, laidT * (1. - midK), max(mk, uRock));
  }
  // and every ledge stays in the dark as one level line of bare card with a touch of chalk: the top of each bed, two
  // pixels and more (the bed coordinate's slope across neighbouring pixels), its weight a little uneven
  float lwB = max(mix(.07, .21, uRock), 2.2 * fb), fbed = fract(vBed);
  float ledge = uRock * (1. - smoothstep(lwB, lwB + fb, fbed)) * (.7 + .3 * sw_vn3(vP * .09 + 3.)) * smoothstep(.3, .15, fb);
  charcoal *= 1. - .94 * ledge;
  // light shades on the level ground (o.smudge): masses with a place in the world, never laid as darks
  charcoal = max(charcoal, shadeB);
  charcoal = max(charcoal, uSmudge * smoothstep(.5, .78, sw_fbm2(vP.xz * .017 + 3.7)) * smoothstep(.8, .97, N.y));
  charcoal = max(charcoal, contactC);
  charcoal = max(charcoal, uContact * uField.w * sw_fieldContact(vP) * level);
  // chalk: touches on the land. On the horn (P5) the snow is laid solid where it is whole and seen from far off (white
  // chalk pressed flat on the lit faces, so the peak is plainly a snow peak from the field); seen nearer (by the
  // pixel's footprint: under about a metre and a half of rock to the pixel) the chalk is laid in strokes over a light
  // scumble, and close to (under half a metre) it is bare card with the chalk in touches, never a white field
  float cs = sw_chalkStrokes(vP);
  float chalkFar = smoothstep(.34, .7, vTone.z) * smoothstep(.6, 1.6, fw);
  float chalkK = mix(mix(1., cs, max(mk, uRock * (1. - ledge))), mix(mix((cs - .3) * 1.3, .4 + .6 * cs, smoothstep(.08, .4, fw)), 1.25, chalkFar), horn);
  float chalkT = (1. - .96 * keepB) * max(vTone.z, uRock * max(.8 * ledge, .8 * smoothstep(.05, .5, nl)));
  gl_FragColor = vec4(sw_draw(vP, fw, pencil, charcoal, chalkT * chalkK * mix(1., 1. - .85 * farK, mk)), 1.);
}`;

// RULED hardware: card fill, a light even tone on lee faces, straight pencil lines of even weight along every
// face edge (uv 0..1 per face, aSize = that face's size in metres) and round the turn of every tube (the rim
// test shades by the direction from the thing to the eye: lawful).
const RULED_VERT = /* glsl */`
${STYLE_VERT_GLSL}
attribute vec3 aSize;
varying vec3 vP, vN;
varying vec2 vUv;
varying vec3 vSize;
void main(){
  #ifdef USE_INSTANCING
  vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.);
  vec3 wn = mat3(modelMatrix) * mat3(instanceMatrix) * normal;
  #else
  vec4 wp = modelMatrix * vec4(position, 1.);
  vec3 wn = mat3(modelMatrix) * normal;
  #endif
  vec4 mv = viewMatrix * wp;
  // thin parts keep at least ~1.6 thousandths of the frame: push the surface out along its normal when far
  float grow = max(0., 1.6 * sw_px(-mv.z) - aSize.z) * step(.001, aSize.z);
  wp.xyz += normalize(wn + vec3(0., 1e-6, 0.)) * grow * .5;
  vP = wp.xyz; vN = wn; vUv = uv; vSize = aSize;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const RULED_FRAG = /* glsl */`
${STYLE_GLSL}
uniform float uChalkGlance, uHeavy;
varying vec3 vP, vN;
varying vec2 vUv;
varying vec3 vSize;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-6, 0.));
  float fw = sw_foot(vP);
  vec3 V = cameraPosition - vP;
  V = V / max(length(V), 1e-4);
  vec2 m = min(vUv, 1. - vUv) * vSize.xy;
  float lw = max(.018, mix(1.5, 2.7, uHeavy) * fw);
  float e = min(m.x, m.y);
  float line = 1. - smoothstep(lw * .6, lw, e);
  float rim = (vSize.z > .001 && vSize.z < 900.) ? smoothstep(mix(.62, .5, uHeavy), mix(.86, .74, uHeavy), 1. - abs(dot(N, V))) : 0.;
  // a part thinner than three pixels is one pencil line
  float thin = smoothstep(3.5, 1.5, min(vSize.x, vSize.y) / fw);
  float lee = smoothstep(.2, -.5, dot(N, uLightDir));
  float tone = lee * .5 * (1. - thin);
  float pencil = max(max(line, rim) * .95, max(tone * .55, thin * .8));
  float glance = uChalkGlance * smoothstep(.75, .97, dot(N, uLightDir)) * (1. - line) * (1. - thin * .5);
  float charcoal = lee * lee * .18 * (1. - thin);
  if (uHeavy > 0.) {
    // heavy pencil (the summit steel): hatching across the shaded face at the hand's one slant, charcoal on the lee side
    // and where the outline turns from the light
    float hc = dot(vP, vec3(.61, .5, -.61));
    float hatch = sw_hatchSet(hc, dot(vP, vec3(.5, -.7, .5)), max(fwidth(hc), 1e-5), .75) * smoothstep(.05, .5, lee) * (1. - thin);
    pencil = max(pencil, hatch * .9 * uHeavy);
    charcoal = max(charcoal, uHeavy * max(.55 * lee * lee * (1. - thin), max(line, rim) * smoothstep(.1, .6, lee) * .85));
  }
  gl_FragColor = vec4(sw_draw(vP, fw, pencil, charcoal, glance), 1.);
}`;

// ------------------------------------------------------------------------------------------------
// CLOTH_GLSL (fragment): wax crayon on card. Any cloth in the world calls sw_crayon with
//   cl    cloth coordinates in metres (x across, y along the fall: strokes run along y)
//   v     smooth tone 0..1 by the fold (under .38 shade, to .68 mid, above light)
//   hem   metres to the nearest hem (pass 99. for none), eye = 0..1 eyelet ring coverage worked out by the caller
//   uShade/uMid/uLight are that work's three crayons.
// It lays ragged three-tone crayon along the fall, lets the tooth and the card through, misses the hem in
// places, and draws every fold boundary again as a pencil line (a slope taken across neighbouring pixels: lawful).
// ------------------------------------------------------------------------------------------------
export const CLOTH_GLSL = /* glsl */`
uniform vec3 uShade, uMid, uLight;
// one pencil fold line where the fold coordinate g crosses a whole number: about 1.5 pixels wide whatever the distance,
// none on a cloth narrower than about 12 pixels (wpx = the cloth's width in pixels), none where the folds crowd closer
// than a few pixels. A slope taken across neighbouring pixels: lawful.
float sw_foldLine(float g, float wpx){
  float fg = max(fwidth(g), 1e-5);
  float d = abs(fract(g + .5) - .5) / fg;
  return (1. - smoothstep(.5, 1.15, d)) * smoothstep(12., 18., wpx) * (1. - smoothstep(.22, .45, fg));
}
// sw_streak: how strongly the long soft streaks fray the tones (1 for ribbons and blades; a very large cloth sets it lower
// before the call so its folds stay three flat tones)
float sw_streak = 1.;
// sw_wax: (the share of joins between strokes that may leave a hair of bare card, the share of the bare specks of tooth);
// (.38, 1.) for ribbons and blades; a very large cloth sets both lower before the call
vec2 sw_wax = vec2(.38, 1.);
// sw_comb: how far one wax stroke carries its tone past its neighbours (.2 for ribbons and blades: a tone edge steps a
// little from stroke to stroke). A very large cloth sets it higher, so that its tones MEET IN STROKES: along every edge
// between two tones the strokes of both run on side by side, and inside a broad tone single strokes of the next one lie.
// sw_strokeW: the strokes' width, in units of the 2 to 4 pixels of ribbons and blades.
float sw_comb = .2;
float sw_strokeW = 1.;
// sw_tip: 0 for ribbons and blades. A very large cloth seen close sets it toward 1: a stroke then carries its tone in
// its middle and lets go toward its two edges, so where its pressure falls away along its length it ends in a point,
// never on a square cut.
float sw_tip = 0.;
// sw_hemPx: the hem line's width, in units of the one-pixel line of a small cloth (a ribbon beside the eye sets it higher)
float sw_hemPx = 1.;
// one lattice of wax strokes side by side, each p cloth metres wide (x across the fall, y along it, fx = fwidth(x)).
// Returns the hair of bare card left where two neighbouring strokes fail to meet, 0..1: hair thin (one to two pixels),
// on fewer than half of the joins, and only along stretches of them. press = this stroke's pressure, .35 to 1,
// breathing along its length.
float sw_waxSet(float x, float y, float fx, float p, float seed, out float press){
  float q = x / p + .2 * (sw_vn2(vec2(y / (p * 60.), x / p * .31 + seed * 9.)) - .5);
  float id = floor(q), f = fract(q);
  press = .35 + .65 * sw_vn2(vec2(y / (p * 45.) + sw_h11(id * 1.731 + seed * 61. + p * 13.) * 17., id * .37));
  press = .68 + (press - .68) * mix(1., 1.35 * (1. - (2. * f - 1.) * (2. * f - 1.)), sw_tip);
  float e = min(f, 1. - f) * p / fx;
  float idE = f < .5 ? id : id + 1.;
  float rE = sw_h11(idE * 2.37 + seed * 29. + p * 7.);
  float open = smoothstep(.4, .56, sw_vn2(vec2(y / (p * 30.) + rE * 23., idE * .91)));
  float hw = .3 + .5 * rE;
  return (1. - smoothstep(hw, hw + .45, e)) * step(rE, sw_wax.x) * open;
}
// cl: cloth metres (x across, y along the fall); v: tone by the fold; hem: metres to the hem (99. = none);
// fold: pencil fold-line coverage 0..1 from sw_foldLine (0. = none); grain: 0..1, how much of the wax's own texture this
// cloth can carry here (0 for a cloth only a few pixels wide, which stays three flat tones)
vec3 sw_crayon(vec2 cl, float v, float hem, vec3 P, float fw, float seed, float fold, float grain){
  float fx = max(fwidth(cl.x), 1e-5), fy = max(fwidth(cl.y), 1e-5);
  // long soft streaks along the fall, three widths of them, fray the edge between two tones so it is never a contour
  float s0 = sw_vn2(vec2(cl.x * .62 + seed * 5., cl.y * .004 + 1.));
  float s1 = sw_vn2(vec2(cl.x * 2.3 + seed * 13., cl.y * .012));
  float s2 = sw_vn2(vec2(cl.x * 7.5 + seed * 7., cl.y * .03 + 3.));
  float k0 = smoothstep(2.5, 5., (1. / .62) / fx), k1 = smoothstep(2.5, 5., (1. / 2.3) / fx), k2 = smoothstep(2.5, 5., (1. / 7.5) / fx);
  float st = .5 + (s0 - .5) * .9 * k0 * (1. - .5 * k1) + (s1 - .5) * .9 * k1 * (1. - .4 * k2) + (s2 - .5) * .8 * k2;
  // THE WAX STROKES: side by side along the fall, 2 to 4 pixels wide whatever the distance (the two stroke widths the
  // pixel can hold, cross-faded by its footprint). A stroke shifts the tone a little, so tone edges step from stroke to
  // stroke; between some strokes a hair of bare card; and the card's tooth, which lives in the cloth and moves with it,
  // shows through wherever a stroke was laid lightly.
  float lv = log2(fx * 3.4 * sw_strokeW), i0 = floor(lv), fr = lv - i0, p0 = exp2(i0), p1 = p0 * 2.;
  float pr0, pr1;
  float h0 = sw_waxSet(cl.x, cl.y, fx, p0, seed, pr0), h1 = sw_waxSet(cl.x, cl.y, fx, p1, seed, pr1);
  float w1 = smoothstep(.15, .85, fr);
  float hair = mix(h0, h1, w1), press = mix(pr0, pr1, w1);
  float vv = v + (st - .5) * .44 * sw_streak + (press - .68) * sw_comb * grain;
  vec3 col = mix(uShade, uMid, smoothstep(.37, .39, vv));
  col = mix(col, uLight, smoothstep(.67, .69, vv));
  float fcl = max(fx, fy);
  // the tooth under the wax: fine, and drawn out a little along the stroke that skipped over it
  float th = sw_tooth(vec3(cl.x, cl.y * .4, seed * 91.), fcl * .55);
  // a cloth that can carry less grain has fewer bare specks and hairs, never fainter ones: only the three wax tones and
  // the card itself lie inside a cloth
  float skip = smoothstep(.02, -.02, th - mix(-.05, mix(.37, .2, press) * sw_wax.y, grain));
  // the hem is missed in places: bare card along it for a stretch
  float hw = sw_vn2(vec2(cl.y * .33 + seed * 5., seed * 3.));
  float hemMiss = (1. - smoothstep(0., max(.17, 2.5 * fw), hem - .1 * hw)) * smoothstep(.45, .55, sw_vn2(vec2(cl.y * .8, cl.x * 2. + seed)));
  col = mix(col, uCard, clamp(max(max(hair * smoothstep(.35, .5, grain), skip), hemMiss), 0., 1.));
  // the hem's pencil line, and each fold drawn once more as one thin pencil line over the wax
  float hl = (1. - smoothstep(max(.012, .6 * fw) * sw_hemPx, max(.03, 1.3 * fw) * sw_hemPx, abs(hem - .17))) * smoothstep(.5, .25, fw);
  col = mix(col, mix(uGraphite, uCharcoal, .6), clamp(max(fold * (.6 + .4 * s2), hl * min(.8 * sw_hemPx, 1.)), 0., 1.));
  return col;
}
`;

// RIBBON_GLSL (vertex and fragment): the travelling ripple and slow twist of one ribbon.
// d metres from the foot fixing, L length, a across -1..1, rnd (phase, wavelength 9..14, twist phase, amplitude).
// Returns (displacement along the normal, its slope along the ribbon, twist angle).
export const RIBBON_GLSL = /* glsl */`
vec3 sw_ribWave(float d, float L, float a, vec4 rnd, float time, float wind){
  // the ripple grows with the height above the foot: near its stake the cloth is held and only sways
  float env = smoothstep(1., 16., d) * smoothstep(.5, 12., L - d) * mix(.42, 1., smoothstep(10., 80., d));
  float k = 6.2832 / max(rnd.y, 1.);
  float ed = .45 + .75 * abs(a);
  float ph = k * (d - 12. * time) + rnd.x + a * .55;
  float ph2 = k * 2.3 * (d - 15. * time) + rnd.x * 3.1 - a * 1.5;
  float A = rnd.w * (.55 + .45 * wind);
  float fineK = smoothstep(18., 90., d);
  float disp = env * A * (sin(ph) + .2 * ed * fineK * sin(ph2));
  float slope = env * A * k * (cos(ph) + .46 * ed * fineK * cos(ph2));
  float tw = sin(6.2832 * (d - 9. * time) / 160. + rnd.z) * .6 + sin(6.2832 * (d - 9. * time) / 71. + rnd.z * 2.7) * .4;
  // S7: NO RIBBON IS A FLAT BAR. Each turns over once or twice along its length: in a twisted stretch it comes round
  // through its own edge to show its under face (150 degrees) and back
  float twist = env * 2.6 * smoothstep(.1, .8, tw);
  return vec3(disp, slope, twist);
}
`;

export const RIBBON_VERT = /* glsl */`
${RIBBON_GLSL}
uniform float uTime, uWind;
uniform vec3 uLightDir, uWindDir;
attribute vec3 iFoot, iTop;
attribute vec4 iRnd;
attribute vec3 iW;
varying vec3 vP, vT, vB, vNn;
varying vec4 vRnd;
varying vec4 vCl;   // x across metres (ungathered), y metres along, z a, w half width here
varying vec3 vMisc; // L, sgn, seed
void main(){
  float a = position.x, s = position.y, pl = position.z;
  vec3 ch = iTop - iFoot;
  float L = max(length(ch), 1.);
  vec3 t = ch / L;
  vec3 b = normalize(cross(t, vec3(0., 1., 0.)) + vec3(1e-6, 0., 0.));
  vec3 n = cross(b, t);
  float d = s * L;
  vec3 wperp = uWindDir - t * dot(uWindDir, t);
  float arch = 4. * s * (1. - s);
  float belly = iW.z * (.8 + .2 * uWind) * (1. + .12 * sin(uTime * .37 + iRnd.x));
  vec3 base = iFoot + t * d + (vec3(0., -1.3, 0.) + wperp * belly) * arch;
  float hwFull = mix(iW.x, iW.y, s);
  float gF = smoothstep(1.5, 13., d), gT = smoothstep(.5, 5., L - d);
  float hw = hwFull * mix(.07, 1., gF) * mix(.3, 1., gT);
  vec3 w = sw_ribWave(d, L, a, iRnd, uTime, uWind);
  float lb = dot(b, uLightDir);
  float sgn = lb < 0. ? -1. : 1.;
  float cs = cos(w.z), sn = sin(w.z) * sgn;
  vec3 across = b * cs - n * sn, nrm = n * cs + b * sn;
  float cup = (1. - a * a) * .2 * hw * gF * gT;
  float zig = pl * hwFull * (.2 * (1. - gF) * smoothstep(.3, 2.5, d) + .1 * (1. - gT));
  vec3 p = base + across * (a * hw) + nrm * (w.x + cup + zig);
  vec4 wp = modelMatrix * vec4(p, 1.);
  vP = wp.xyz; vT = t; vB = b; vNn = n; vRnd = iRnd;
  vCl = vec4(a * hwFull, d, a, hw);
  vMisc = vec3(L, sgn, fract(iRnd.x * .731));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

export const RIBBON_FRAG = /* glsl */`
${STYLE_GLSL}
${CLOTH_GLSL}
${RIBBON_GLSL}
varying vec3 vP, vT, vB, vNn;
varying vec4 vRnd;
varying vec4 vCl;
varying vec3 vMisc;
void main(){
  float d = vCl.y, a = vCl.z, hw = vCl.w, L = vMisc.x, sgn = vMisc.y, seed = vMisc.z;
  float fw = sw_foot(vP);
  vec3 w = sw_ribWave(d, L, a, vRnd, uTime, uWind);
  float n0 = dot(vNn, uLightDir);
  float tl = dot(vT, uLightDir) < 0. ? -1. : 1.;
  float gF = smoothstep(1.5, 13., d), gT = smoothstep(.5, 5., L - d);
  // the ribbon's width in pixels (a slope across neighbouring pixels: lawful)
  float wpx = 2. / max(fwidth(a), 1e-5);
  // lengthwise folds: two or three long ones that wander down the ribbon, each with its trough in the shade tone on one
  // side of its pencil line; many more where the cloth is gathered to a fixing. The mid tone holds the rest; the slow
  // twist turns whole stretches to the light tone, and the ripple only nudges the tone.
  float g = a * 1.15 + .3 + .22 * sin(d * .031 + seed * 40.) + .09 * sin(d * .083 + seed * 17.);
  float q = fract(g);
  float gg = fract(a * 4.5 + .5) - .5;
  float gather = 1. - gF * gT;
  float twl = sin(clamp(w.z, 0., 1.5)) * max(abs(dot(vB, uLightDir)), .5) * (1. - smoothstep(1.5, 1.75, w.z));
  float back = smoothstep(1.62, 1.9, w.z);      // the under face, turned to the eye by the twist: the shade tone
  float v = .52 + .07 * n0 - .1 * w.y * tl + .46 * twl + .05 * a * sgn - .22 * smoothstep(.6, .9, q) + .06 * (1. - smoothstep(0., .22, abs(q - .28)));
  v = mix(v, .5 + gg * .62, gather);
  v = mix(v, .1 + .12 * (1. - smoothstep(0., .22, abs(q - .28))), back * (1. - gather));
  // beside the eye (60 pixels wide and more) a ribbon is drawn as one cloth: heavier fold lines, a hem line two pixels
  // wide, single strokes of the light and the shade tone lying in the mid tone with pointed ends, hairs of card between
  float near = smoothstep(55., 140., wpx);
  float fold = max(sw_foldLine(g, wpx) * (1. - gather), sw_foldLine(a * 4.5 + .5, wpx) * gather * .8) * (1. + .6 * near);
  float hem = (1. - abs(a)) * hw;
  sw_hemPx = 1. + near;
  sw_comb = mix(.2, .5, near);
  sw_tip = near;
  // a ribbon seen large (from about 25 pixels wide; beside the eye in the bays it is 60 and more) is pressed hard: the
  // wax fills the tooth, so only a few hairs and hardly a speck of bare card are left in it and it stays cloth, not
  // speckle
  sw_wax = vec2(.38, 1.) * mix(1., mix(.13, .4, near), smoothstep(22., 70., wpx));
  vec3 col = sw_crayon(vCl.xy, v, mix(99., hem, gF * gT * smoothstep(.14, .07, fw)), vP, fw, seed, fold, smoothstep(12., 40., wpx));
  // THE HEM'S OUTER EDGE (the ninth review): beside the eye the cloth's own edge is ruled too, so the hem is a doubled line
  float fh = max(fwidth(hem), 1e-4), fd = max(fwidth(d), 1e-4);
  // (S7: and from eight pixels wide every ribbon carries one pencil edge, along the hem turned from the light)
  col = mix(col, mix(uGraphite, uCharcoal, .6), (1. - smoothstep(max(.02, .8 * fh), max(.045, 1.7 * fh), hem)) * .85 * max(near, smoothstep(7., 12., wpx) * step(a * sgn, 0.)) * gF * gT);
  // eyelets along both hems, 2.4 m apart: a charcoal ring about a hole of bare card, AT ITS TRUE SIZE (S7: 17 cm
  // across) and drawn only while that is over two pixels (fe: a pixel in eyelet radii, by the footprint across the
  // hem and along the ribbon, slopes across neighbouring pixels: lawful); whole from three pixels up; no floor
  float fe = max(fh, fd) / .085, el = length(vec2(hem - .2, (fract(d / 2.4) - .5) * 2.4)) / .085;
  float eOn = (1. - smoothstep(.62, 1., fe)) * gF * gT;
  col = mix(col, uCard, (1. - smoothstep(.68 - .5 * fe, .68 + .5 * fe, el)) * .9 * eOn);
  col = mix(col, uCharcoal, (1. - smoothstep(max(.3 - .5 * fe, 0.), .5 + .5 * fe, abs(el - 1.))) * .88 * eOn);
  // lashings: crossing turns of rope over the gathered neck for 3 m at each fixing (rope is bare card between two ruled
  // pencil edges; the gathered cloth shows between the turns)
  float dn = min(d, (L - d) * 1.7);
  float neck = smoothstep(.3, .4, dn) * (1. - smoothstep(3., 3.15, dn));
  float u1 = fract(dn * 2.4 + a * .9), u2 = fract(dn * 2.4 - a * .9 + .5);
  float fr = max(fwidth(dn * 2.4), 1e-4);
  float dq = min(min(u1, 1. - u1), min(u2, 1. - u2));
  float rw = max(.2, 1.1 * fr);
  float rope = 1. - smoothstep(rw, rw + fr, dq);
  float redge = rope * smoothstep(rw - 1.6 * fr, rw - .6 * fr, dq);
  col = mix(col, mix(uCard, mix(uGraphite, uCharcoal, .3), max(redge, .12)), rope * neck);
  gl_FragColor = vec4(col, 1.);
}`;

// ------------------------------------------------------------------------------------------------
// makeStyle(opts): the shared uniforms and the material factories for the whole world.
// ------------------------------------------------------------------------------------------------
export function makeStyle(opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const col = (h) => new THREE.Color(h);
  const uniforms = {
    uCard: { value: col(pal[0]) }, uGraphite: { value: col(pal[1]) }, uCharcoal: { value: col(pal[2]) }, uChalk: { value: col(pal[3]) },
    uLightDir: { value: LIGHT_DIR.clone() }, uWindDir: { value: WIND_DIR.clone() },
    uTime: { value: 0 }, uWind: { value: 1 }, uPencil: { value: 1 },
    uRoute: { value: new THREE.Vector3() }, uConePos: { value: new THREE.Vector3() }, uConeBays: { value: new THREE.Vector4(-1.89, 3.75, 2.04, 2.21) }, uConeN: { value: new THREE.Vector2(61, 37) },
    uField: { value: new THREE.Vector4(210, -40, 380, 0) }, uBannerC: { value: new THREE.Vector4(26, 700, 421, 0) }, uBannerO: { value: new THREE.Vector4(0, 1370, 0, -1) },
  };
  const crayons = {
    turquoise: [col(CRAYON.turquoise[0]), col(pal[4]), col(CRAYON.turquoise[2])],
    violet: [col(CRAYON.violet[0]), col(pal[5]), col(CRAYON.violet[2])],
    emerald: [col(CRAYON.emerald[0]), col(pal[6]), col(CRAYON.emerald[2])],
  };
  const clothUniforms = (work) => ({ ...uniforms, uShade: { value: crayons[work][0] }, uMid: { value: crayons[work][1] }, uLight: { value: crayons[work][2] } });
  // land, rock, cloud, bird: card with hatching, charcoal and chalk. Geometry may carry aTone (vec3: extra pencil
  // tone, charcoal, chalk) and aBed (bed coordinate; a pencil line at every half-integer). o.contact = cone contact
  // shade on level ground, o.lee = strength of the drawn lee shading, o.bedTone = weight of bed lines, o.smudge = soft
  // charcoal masses on level ground, o.mass = 1 for the open land: the lee massed in a few charcoal smudges kept lighter
  // than the contact shades, bare card on lit shoulders, chalk laid in strokes.
  function cardMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uHull: { value: o.hull ?? 0 }, uContact: { value: o.contact ?? 0 }, uLee: { value: o.lee ?? 1 }, uBedTone: { value: o.bedTone ?? 0 }, uSmudge: { value: o.smudge ?? 0 }, uMass: { value: o.mass ?? 0 }, uRock: { value: o.rock ?? 0 }, uRockAxis: { value: new THREE.Vector4(0, 0, 170, 0) } },
      vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, side: o.side ?? THREE.FrontSide, fog: false,
    });
  }
  // the pencil contour of a closed form: the same geometry drawn inside out, pushed out by `width` thousandths of the frame's height
  function outlineOf(mesh, width = 2.6) {
    const m = new THREE.Mesh(mesh.geometry, cardMaterial({ hull: width, side: THREE.BackSide }));
    m.frustumCulled = false; m.matrixAutoUpdate = mesh.matrixAutoUpdate; m.matrix.copy(mesh.matrix);
    m.position.copy(mesh.position); m.quaternion.copy(mesh.quaternion); m.scale.copy(mesh.scale);
    return m;
  }
  // ruled hardware (steel, stakes, plates, ropes): geometry from ruledBox / ruledTube below. o.chalk = chalk glance on lit faces.
  // o.heavy = 1: steel seen large and close (the summit frame): outlines two to three pixels wide, charcoal down the lee
  // side of every member and pencil hatching across its shaded face.
  function ruledMaterial(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: { ...uniforms, uChalkGlance: { value: o.chalk ?? 0 }, uHeavy: { value: o.heavy ?? 0 } },
      vertexShader: RULED_VERT, fragmentShader: RULED_FRAG, side: o.side ?? THREE.FrontSide, fog: false,
    });
  }
  // the ribbons' own material (instanced strip; see buildRibbons). Other cloth: write a vertex shader for its motion
  // and call sw_crayon from CLOTH_GLSL in the fragment shader with clothUniforms(work).
  function ribbonMaterial(work = 'violet') {
    return new THREE.ShaderMaterial({ uniforms: clothUniforms(work), vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, side: THREE.DoubleSide, fog: false });
  }
  return { palette: pal, uniforms, crayons, clothUniforms, cardMaterial, outlineOf, ruledMaterial, ribbonMaterial };
}

// ruled geometry helpers: every face carries uv 0..1 and aSize (face width, face height, thickness-if-tube) in metres
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v0 = new THREE.Vector3(), _v1 = new THREE.Vector3(), _up = new THREE.Vector3(0, 1, 0);
export function ruledBox(w, h, d, matrix) {
  const g = new THREE.BoxGeometry(w, h, d);
  const sz = new Float32Array(24 * 3);
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { sz[(f * 4 + k) * 3] = dims[f][0]; sz[(f * 4 + k) * 3 + 1] = dims[f][1]; sz[(f * 4 + k) * 3 + 2] = 0; }
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 3));
  if (matrix) g.applyMatrix4(matrix);
  return g;
}
export function ruledTube(p0, p1, r, seg = 7, r1 = r) {
  _v0.copy(p1).sub(p0);
  const len = Math.max(_v0.length(), 1e-3);
  const g = new THREE.CylinderGeometry(r1, r, len, seg, 1, false);
  const n = g.attributes.position.count, sz = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { sz[i * 3] = 1e3; sz[i * 3 + 1] = len; sz[i * 3 + 2] = Math.min(2 * Math.min(r, r1), 800); }
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 3));
  _q.setFromUnitVectors(_up, _v0.multiplyScalar(1 / len));
  _v1.copy(p0).add(p1).multiplyScalar(0.5);
  g.applyMatrix4(_m4.compose(_v1, _q, new THREE.Vector3(1, 1, 1)));
  return g;
}
// a ring of box section about the Y axis at height y: outer/inner/top/bottom faces ruled along the ring
export function ruledRing(R, y, w, h, seg = 96) {
  const pos = [], nor = [], uv = [], sz = [], idx = [];
  const prof = [[R + w / 2, y - h / 2], [R + w / 2, y + h / 2], [R - w / 2, y + h / 2], [R - w / 2, y - h / 2]];
  const fn = [[1, 0], [0, 1], [-1, 0], [0, -1]], fs = [h, w, h, w];
  for (let f = 0; f < 4; f++) {
    const a = prof[f], b = prof[(f + 1) % 4], base = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      pos.push(a[0] * c, a[1], a[0] * s, b[0] * c, b[1], b[0] * s);
      nor.push(fn[f][0] * c, fn[f][1], fn[f][0] * s, fn[f][0] * c, fn[f][1], fn[f][0] * s);
      uv.push(0.5, 0, 0.5, 1); sz.push(1e3, fs[f], 0, 1e3, fs[f], 0);
      if (i < seg) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 3));
  g.setIndex(idx);
  return g;
}

// ------------------------------------------------------------------------------------------------
// the leaning tower of bedded rock
// ------------------------------------------------------------------------------------------------
function towerShape(rng) {
  const H = CONE.towerH;
  const leanA = -Math.PI / 2 - 0.84 + rng.range(-0.3, 0.3);         // down the wind: toward minus Z and minus X
  const leanM = rng.range(17, 26);
  const lean = new THREE.Vector3(Math.cos(leanA) * leanM, 0, Math.sin(leanA) * leanM);
  const beds = [];
  let y = -9;
  while (y < H + 30) { beds.push(y); y += rng.range(2.4, 7.5) * (rng.chance(0.2) ? 2.0 : 1); }
  const setback = beds.map(() => rng.range(-1, 1));
  const dipX = rng.range(-0.09, 0.09), dipZ = rng.range(-0.05, 0.11);
  const waist = rng.range(0.9, 1.08), shoulderY = rng.range(96, 122), shoulder = rng.range(0.06, 0.16);
  const axisAt = (yy, out = new THREE.Vector3()) => { const k = Math.pow(Math.max(yy, 0) / H, 1.3); return out.set(lean.x * k, yy, lean.z * k); };
  const profile = (yy) => {
    let r = 27 * waist + (15 - 27 * waist) * Math.min(yy / 150, 1);
    if (yy < 26) { const k = 1 - yy / 26; r += 13 * k * k + (40 - 27 * waist - 13) * k * k * k; }
    r *= 1 + shoulder * Math.exp(-((yy - shoulderY) * (yy - shoulderY)) / 500);
    if (yy > 150) { const k = (yy - 150) / (H - 150); r = 15 * (1 - 0.5 * k) * (k > 0.86 ? 1 - 0.72 * (k - 0.86) / 0.14 : 1); }
    return r;
  };
  return { H, lean, beds, setback, dipX, dipZ, axisAt, profile };
}

async function buildTower(ctx, shape, style) {
  const { H, beds, setback, dipX, dipZ, axisAt, profile } = shape;
  const noise = ctx.noise, NA = 88;
  // rows: a tight pair at every bed plane (a crisp ledge), fill rows between so no gap exceeds 3.2 m
  const rows = [];
  for (let b = 0; b < beds.length - 1; b++) {
    const y0 = beds[b], y1 = beds[b + 1];
    if (y1 < 0.5 || y0 > H - 1.5) continue;
    const a = Math.max(y0 + 0.16, 0), c = Math.min(y1 - 0.16, H - 1.2);
    const nfill = Math.max(0, Math.ceil((c - a) / 3.8) - 1);
    for (let k = 0; k <= nfill + 1; k++) rows.push({ y: a + ((c - a) * k) / (nfill + 1), bed: b, f: k / (nfill + 1) });
  }
  rows.push({ y: H - 0.5, bed: beds.length - 2, f: 1 });
  rows[0].y = 0;
  const NR = rows.length, nv = NR * NA + 1;
  const pos = new Float32Array(nv * 3), tone = new Float32Array(nv * 3), bed = new Float32Array(nv);
  const ax = new THREE.Vector3();
  for (let j = 0; j < NR; j++) {
    const row = rows[j], yy = row.y;
    axisAt(yy, ax);
    const pr = profile(yy), sb = setback[row.bed];
    const taper = yy > 150 ? 1 - 0.45 * (yy - 150) / 20 : 1, crag = yy > 153 ? 1.9 : 1;
    for (let i = 0; i < NA; i++) {
      const th = (i / NA) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
      const big = noise.fbm3(c * 1.3 + 4.1, s * 1.3, yy * 0.016, 3);                 // buttresses and gullies
      const block = noise.n3(c * 4.6, s * 4.6, row.bed * 7.31);                      // joints: each bed breaks its own way
      const blk = Math.tanh(block * 7);                                               // crisp joints: a block's face is flat, its step sharp
      const fine = noise.n3(c * 13, s * 13, yy * 0.21);
      const under = (1 - row.f) * (1 - row.f);                                        // beds undercut at their base
      let r = pr * (1 + 0.2 * big * crag) + taper * (sb * 2.3 + blk * 0.6 + fine * 0.06 - under * 1.1 * (0.5 + 0.5 * sb));
      const skirt = Math.max(0, 1 - yy / 22);
      r += skirt * skirt * (4 + 5 * noise.n3(c * 2.2, s * 2.2, 3.3));                 // scree apron
      const seat = Math.exp(-Math.pow((yy - 153.5) / 5.2, 4));                          // a seat cut for the steel collar
      r = r * (1 - seat) + Math.min(r, 14.3) * seat;
      r = Math.max(r, 1.2);
      const o = (j * NA + i) * 3;
      const x = ax.x + c * r, z = ax.z + s * r;
      pos[o] = x; pos[o + 2] = z;
      pos[o + 1] = Math.max(0, yy - (c * r * dipX + s * r * dipZ) * Math.min(1, yy / 14));
      const nl = (c * LIGHT_DIR.x + 0.3 * LIGHT_DIR.y + s * LIGHT_DIR.z) / 1.044;
      const lee = core.smoothstep(0.45, -0.55, nl - 0.25 * big);
      tone[o] = 0.05 + Math.max(0, -0.3 * big) + skirt * 0.08 + 0.72 * lee;                            // S4: bare card on the lit side, hatching on the lee
      tone[o + 1] = Math.min(1, Math.max(0, -big - 0.3) * 0.4 + 0.96 * lee * (0.4 + 0.6 * lee) + 0.25 * under * lee * (1 - skirt));   // charcoal over the whole lee side and under the ledges: pressed nearly solid in the deep lee, open strokes ending in tips toward the light (laid by the material)
      tone[o + 2] = 0.85 * core.smoothstep(0.45, 0.9, nl + 0.2 * big) * core.smoothstep(0.1, 0.7, blk) * (1 - skirt);   // chalk on the lit edges of the blocks
      bed[j * NA + i] = row.bed + row.f * 0.999;
    }
    if ((j & 15) === 15) await ctx.yield();
  }
  axisAt(H, ax);
  pos[(nv - 1) * 3] = ax.x; pos[(nv - 1) * 3 + 1] = H + 1.4; pos[(nv - 1) * 3 + 2] = ax.z;
  tone[(nv - 1) * 3] = 0.1; bed[nv - 1] = beds.length - 1.001;
  const idx = [];
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) {
    const a = j * NA + i, b = j * NA + ((i + 1) % NA), c = a + NA, d = b + NA;
    idx.push(a, c, b, b, c, d);
  }
  for (let i = 0; i < NA; i++) idx.push((NR - 1) * NA + i, nv - 1, (NR - 1) * NA + ((i + 1) % NA));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTone', new THREE.BufferAttribute(tone, 3));
  g.setAttribute('aBed', new THREE.BufferAttribute(bed, 1));
  g.setIndex(idx);
  await ctx.yield();
  g.computeVertexNormals();
  await ctx.yield();
  // ledge tops and the apron catch the light: bare card there
  const nrm = g.attributes.normal.array;
  for (let k = 0; k < nv; k++) tone[k * 3] = Math.max(0, tone[k * 3] - 0.5 * core.smoothstep(0.35, 0.85, nrm[k * 3 + 1]) * (1 - tone[k * 3 + 1]));
  const mesh = new THREE.Mesh(g, style.cardMaterial({ bedTone: 1, lee: 0, rock: 1 }));
  mesh.material.uniforms.uRockAxis.value.set(shape.lean.x, shape.lean.z, H, 0);
  mesh.frustumCulled = false;
  return mesh;
}

// level drawn ground for the viewer and for worlds that want it (opts.ground): card, hatching, contact shade
function buildGround(ctx, style, R) {
  const NRr = 14, NAa = 72, pos = [], tone = [], idx = [];
  for (let j = 0; j <= NRr; j++) for (let i = 0; i < NAa; i++) {
    const r = R * Math.pow(j / NRr, 1.4), th = (i / NAa) * Math.PI * 2;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    pos.push(x, 0, z);
    const n = ctx.noise.fbm2(x * 0.011 + 9, z * 0.011, 3);
    tone.push(0.1 + 0.5 * core.smoothstep(-0.15, 0.5, n) + 0.5 * Math.exp(-Math.pow((r - 46) / 16, 2)) * (0.5 - 0.5 * Math.cos(th)), Math.max(0, 0.55 * Math.exp(-Math.pow((r - 40) / 12, 2)) * -Math.cos(th)), 0);
  }
  for (let j = 0; j < NRr; j++) for (let i = 0; i < NAa; i++) {
    const a = j * NAa + i, b = j * NAa + ((i + 1) % NAa), c = a + NAa, d = b + NAa;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, style.cardMaterial({ contact: 1, lee: 0 }));
  m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------
// steel: the collar on the rock, and the kit at every ribbon foot (stake, anchor plate, turnbuckle, rope, thimble)
// ------------------------------------------------------------------------------------------------
function ruledTorus(R, r, radial, tubular, matrix) {
  const g = new THREE.TorusGeometry(R, r, radial, tubular);
  const n = g.attributes.position.count, sz = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { sz[i * 3] = 1e3; sz[i * 3 + 1] = 1e3; sz[i * 3 + 2] = 2 * r; }
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 3));
  if (matrix) g.applyMatrix4(matrix);
  return g;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TR = (x, y, z, rx = 0, ry = 0, rz = 0) => new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V(1, 1, 1));

function buildCollar(shape, style, rng) {
  const c = shape.axisAt(CONE.collarY), R = CONE.collarR, parts = [];
  parts.push(ruledRing(R + 0.75, 0, 0.38, 0.38, 100));        // the lashing rail the ribbons are bound to
  parts.push(ruledRing(R, 2.0, 1.2, 2.6, 100));               // the collar: a box girder ring above the rail
  parts.push(ruledRing(R - 0.2, 7.2, 0.5, 0.5, 72));          // upper chord of the lattice
  const nb = 20, off = rng.range(0, 1), Ru = R - 0.2;
  for (let i = 0; i < nb; i++) {
    const th = ((i + off) / nb) * Math.PI * 2, th2 = ((i + off + 0.5) / nb) * Math.PI * 2, th3 = ((i + off + 1) / nb) * Math.PI * 2;
    const cs = Math.cos(th), sn = Math.sin(th), c2 = Math.cos(th2), s2 = Math.sin(th2), c3 = Math.cos(th3), s3 = Math.sin(th3);
    parts.push(ruledTube(V(cs * R, 3.3, sn * R), V(cs * Ru, 7.2, sn * Ru), 0.2, 5));                         // posts
    parts.push(ruledTube(V(cs * R, 3.3, sn * R), V(c2 * Ru, 7.2, s2 * Ru), 0.13, 4));                        // lacing
    parts.push(ruledTube(V(c2 * Ru, 7.2, s2 * Ru), V(c3 * R, 3.3, s3 * R), 0.13, 4));
    parts.push(ruledTube(V(cs * Ru, 7.2, sn * Ru), V(cs * 8.5, 15.5, sn * 8.5), 0.2, 5));                    // hanger up to the crown
    parts.push(ruledBox(1.3, 0.22, 1.3, TR(cs * 8.9, 15.0, sn * 8.9, 0, -th, 0)));                           // its anchor plate
    parts.push(ruledBox(3.2, 0.5, 0.7, TR(cs * (R - 1.9), 0.9, sn * (R - 1.9), 0, -th, 0)));                 // bearing stub onto the seat
    parts.push(ruledBox(0.6, 3.2, 1.6, TR(cs * R, 2.0, sn * R, 0, -th, 0)));                                  // splice plate
    parts.push(ruledTube(V(cs * (R + 0.75), 0, sn * (R + 0.75)), V(cs * R, 0.9, sn * R), 0.12, 4));           // rail bracket
  }
  const g = mergeGeometries(parts, false);
  g.translate(c.x, c.y, c.z);
  const m = new THREE.Mesh(g, style.ruledMaterial({ chalk: 0.5, side: THREE.DoubleSide }));
  m.frustumCulled = false;
  return m;
}

// the foot kit in two pieces. ground: plate and raked stake, origin at the stake, +Z toward the tower.
// rig: shackle, eye bolt, turnbuckle, thimble and doubled rope, built along +Z from the shackle to the bound neck.
const KIT = { eye: [0, 0.78, -0.3], reach: 4.6, scale: 1.7 };
function footKitGeometry() {
  const ground = [], rig = [];
  ground.push(ruledBox(1.7, 0.09, 1.7, TR(0, 0.045, -0.1)));
  for (const [x, z] of [[-0.62, -0.72], [0.62, -0.72], [-0.62, 0.52], [0.62, 0.52]]) ground.push(ruledBox(0.16, 0.12, 0.16, TR(x, 0.14, z, 0, 0.6, 0)));
  const head = V(0, 1.25, -0.62);
  ground.push(ruledTube(V(0, -0.1, 0.02), head, 0.11, 6));
  ground.push(ruledBox(0.3, 0.1, 0.3, new THREE.Matrix4().compose(head, new THREE.Quaternion().setFromUnitVectors(_up, head.clone().normalize()), V(1, 1, 1))));
  ground.push(ruledTorus(0.13, 0.03, 4, 6, TR(KIT.eye[0], KIT.eye[1], KIT.eye[2] + 0.02, 0, Math.PI / 2, 0)));
  const at = (t, sx = 0) => V(sx, 0, t);
  // the rig from the stake's eye to the cloth's neck: shackle, a turnbuckle (two threaded rods in a frame with a block at
  // each end and one in the middle), shackle, then two ropes to the eyelets of the gathered neck
  rig.push(ruledTorus(0.17, 0.045, 4, 6, TR(0, 0, 0.16, 0, Math.PI / 2, 0)));
  rig.push(ruledTube(at(0.28), at(0.62), 0.045, 5));
  rig.push(ruledBox(0.5, 0.16, 0.14, TR(0, 0, 0.66)));
  rig.push(ruledTube(at(0.66, 0.2), at(1.5, 0.2), 0.04, 5));
  rig.push(ruledTube(at(0.66, -0.2), at(1.5, -0.2), 0.04, 5));
  rig.push(ruledBox(0.2, 0.2, 0.2, TR(0, 0, 1.08)));
  rig.push(ruledBox(0.5, 0.16, 0.14, TR(0, 0, 1.5)));
  rig.push(ruledTube(at(1.5), at(1.86), 0.045, 5));
  rig.push(ruledTorus(0.16, 0.042, 4, 6, TR(0, 0, 1.98, 0, Math.PI / 2, 0)));
  rig.push(ruledTube(at(2.06, 0.05), at(KIT.reach + 0.3, 0.12), 0.06, 5));
  rig.push(ruledTube(at(2.06, -0.05), at(KIT.reach + 0.3, -0.12), 0.06, 5));
  return { ground: mergeGeometries(ground, false), rig: mergeGeometries(rig, false) };
}

// ------------------------------------------------------------------------------------------------
// the ninety-eight ribbons (one instanced strip) and their foot kits (one instanced mesh)
// ------------------------------------------------------------------------------------------------
// where a polyline (local points) pierces the cone's sheet of ribbons: [inward crossing, outward crossing] as angles
function bayAngles(c, route) {
  const f = (x, y, z) => { const t = Math.min(Math.max((y - 1.3) / (c.y - 1.5), 0), 1); return [Math.hypot(x - t * c.x, z - t * c.z) - (CONE.ringR - (CONE.ringR - CONE.collarR - 0.75) * t), Math.atan2(z - t * c.z, x - t * c.x)]; };
  const res = [null, null, null, null];
  let prev = null;
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1], n = Math.max(2, Math.ceil(a.distanceTo(b) / 0.5));
    for (let k = 0; k <= n; k++) {
      const u = k / n, x = a.x + (b.x - a.x) * u, y = a.y + (b.y - a.y) * u, z = a.z + (b.z - a.z) * u;
      const cur = f(x, y, z);
      if (prev && prev[0] > 0 && cur[0] <= 0 && res[0] === null) { res[0] = cur[1]; res[2] = V(x, y, z); }
      if (prev && prev[0] <= 0 && cur[0] > 0 && res[0] !== null && res[1] === null) { res[1] = prev[1]; res[3] = V(x, y, z); }
      prev = cur;
    }
  }
  if (res[0] === null) { res[0] = f(...CONE.bayNear)[1]; res[2] = V(...CONE.bayNear); }
  if (res[1] === null) { res[1] = f(...CONE.bayFar)[1]; res[3] = V(...CONE.bayFar); }
  return res;
}
function ribbonSlots(shape, rng, wind, route, bays) {
  const c = shape.axisAt(CONE.collarY), out = [];
  // the two bays are put where the route pierces the cone, so the empty place is where the traveller passes
  const [thN, thF, crossN, crossF] = bayAngles(c, route);
  const dN = bays.near / 2 / CONE.ringR, dF = bays.far / 2 / CONE.ringR, wrap = (x) => ((x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const a0 = thN + dN, spanA = wrap(thF - dF - a0), b0 = thF + dF, spanB = wrap(thN - dN - b0);
  // the 98 ribbons are shared between the two arcs by their lengths, so neighbours stand about 12 m apart on both
  const angles = [], nA = Math.min(Math.max(Math.round(CONE.ribbons * spanA / (spanA + spanB)), 2), CONE.ribbons - 2), nB = CONE.ribbons - nA;
  for (let k = 0; k < nA; k++) angles.push(a0 + (spanA * k) / (nA - 1));
  for (let k = 0; k < nB; k++) angles.push(b0 + (spanB * k) / (nB - 1));
  out.bays = { thN, thF, a0, spanA, b0, spanB, crossN, crossF, nA, nB };
  for (let i = 0; i < angles.length; i++) {
    const th = angles[i], cs = Math.cos(th), sn = Math.sin(th);
    const stake = V(cs * CONE.ringR, 0, sn * CONE.ringR);
    const top = V(c.x + cs * (CONE.collarR + 0.75), c.y - 0.2, c.z + sn * (CONE.collarR + 0.75));
    const h = V(c.x - stake.x, 0, c.z - stake.z).normalize();
    const yaw = Math.atan2(h.x, h.z);
    // the two feet of the near bay, which the route passes between, are drawn large (the twelfth review): stake, plate,
    // turnbuckle and roped neck 1.8 times the size of the rest
    const ks = KIT.scale * (i === 0 || i === angles.length - 1 ? 1.8 : 1);
    const eye = stake.clone().addScaledVector(h, KIT.eye[2] * ks); eye.y = KIT.eye[1] * ks;
    const dir = top.clone().sub(eye).normalize();
    const foot = eye.clone().addScaledVector(dir, KIT.reach * ks);
    out.push({ i, th, stake, top, foot, eye, dir, yaw, ks,
      rnd: [th * 3 + rng.range(0, 2.2), rng.range(9, 14), th * 2 + rng.range(0, 1.6), rng.range(0.34, 0.52)],
      belly: rng.range(2, 3) * wind });
  }
  return out;
}

async function buildRibbons(ctx, slots, style, detail) {
  // strip: 5 across (a = -1..1, alternate pleat sign), rows crowded toward both fixings where the cloth is gathered
  const L0 = 232, ds = [0, 0.4, 1.3, 2.2, 3.4, 5, 7, 9.5, 13];
  // rows 1.75 m apart over the ribbon's first 62 m (the stretch that passes beside the eye in the bays, where a ripple
  // must bend the hem and never kink it), 3.6 m apart above
  const dk = detail < 0.8 ? 0.75 : 1, nNear = Math.round(28 * dk), nFar = Math.round(45 * dk);
  for (let k = 1; k <= nNear; k++) ds.push(13 + (49 * k) / nNear);
  for (let k = 1; k <= nFar; k++) ds.push(62 + ((L0 - 68) * k) / (nFar + 1));
  ds.push(L0 - 6, L0 - 4, L0 - 2.4, L0 - 1.2, L0 - 0.4, L0);
  const NA = 5, NS = ds.length, pos = new Float32Array(NA * NS * 3), idx = [];
  for (let j = 0; j < NS; j++) for (let i = 0; i < NA; i++) {
    const o = (j * NA + i) * 3;
    pos[o] = -1 + (2 * i) / (NA - 1); pos[o + 1] = ds[j] / L0; pos[o + 2] = (i & 1) ? -1 : 1;
  }
  for (let j = 0; j < NS - 1; j++) for (let i = 0; i < NA - 1; i++) {
    const a = j * NA + i, b = a + 1, c = a + NA, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  const n = slots.length, foot = new Float32Array(n * 3), top = new Float32Array(n * 3), rnd = new Float32Array(n * 4), w = new Float32Array(n * 3);
  slots.forEach((s, k) => {
    s.foot.toArray(foot, k * 3); s.top.toArray(top, k * 3); rnd.set(s.rnd, k * 4);
    w[k * 3] = CONE.footW / 2; w[k * 3 + 1] = CONE.topW / 2; w[k * 3 + 2] = s.belly;
  });
  g.setAttribute('iFoot', new THREE.InstancedBufferAttribute(foot, 3));
  g.setAttribute('iTop', new THREE.InstancedBufferAttribute(top, 3));
  g.setAttribute('iRnd', new THREE.InstancedBufferAttribute(rnd, 4));
  g.setAttribute('iW', new THREE.InstancedBufferAttribute(w, 3));
  g.instanceCount = n;
  const ribbons = new THREE.Mesh(g, style.ribbonMaterial('violet'));
  ribbons.frustumCulled = false;
  await ctx.yield();
  const kit = footKitGeometry(), mat = style.ruledMaterial({ chalk: 0.35, side: THREE.DoubleSide });
  const ground = new THREE.InstancedMesh(kit.ground, mat, n), rig = new THREE.InstancedMesh(kit.rig, mat, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = V(1, 1, 1), zAxis = V(0, 0, 1), e = new THREE.Euler();
  slots.forEach((s, k) => {
    one.setScalar(s.ks);
    ground.setMatrixAt(k, m.compose(s.stake, q.setFromEuler(e.set(0, s.yaw, 0)), one));
    rig.setMatrixAt(k, m.compose(s.eye, q.setFromUnitVectors(zAxis, s.dir), one));
  });
  ground.frustumCulled = false; rig.frustumCulled = false;
  return { ribbons, ground, rig };
}

// eighty swifts: pencil ticks wheeling round the collar; uBurst (0..1, set from the route's u) throws them outward.
// THE SWIFTS KEEP OFF THE FLOWN LINE, by place (note 9, V3): the world hands the part the flown line where it passes
// through the swifts' air as a short row of points (uLine, at most SWIFT_LINE of them, uLineN in use; uLineT the row's
// own direction at each point; all set once at build, in the part's own frame). After a swift's place c is worked
// out the nearest point bq of the row's straight pieces is found; a place under SWIFT_OFF (12 m) from it is moved
// straight out from bq to 12 m, leant up as the cranes' keep-off is: to (c - bq) is added the row's upward normal
// there (straight up less its part along the row, made unit) times SWIFT_LEAN times (1 - d / 12) squared. A place at
// 12 m is not moved. Where that sum lies ALONG the row (its part along the row's direction a tenth of its length or
// more: about the one place 2.5 m under the row where the way out and the lean undo each other, and beyond the row's
// two ends) the place goes straight up the normal instead, as it does when the sum is nothing: so from every place
// under 12 m the place given is 12 m from bq and no more than 6 degrees off square to the row, never along it.
// With no line handed uLineN is 0 and nothing is moved.
const SWIFT_LINE = 24, SWIFT_OFF = 12, SWIFT_LEAN = 4;
const SWIFT_VERT = /* glsl */`
${STYLE_VERT_GLSL}
#define SWIFT_LINE ${SWIFT_LINE}
#define SWIFT_OFF ${SWIFT_OFF.toFixed(1)}
#define SWIFT_LEAN ${SWIFT_LEAN.toFixed(1)}
uniform float uTime, uBurst, uLineN;
uniform vec3 uCentre;
uniform vec3 uLine[SWIFT_LINE];
uniform vec3 uLineT[SWIFT_LINE];
attribute vec4 iOrb;   // radius, height, phase, speed
varying float vK;
void main(){
  float r = iOrb.x * (1. + uBurst * (1.2 + fract(iOrb.z * 3.7) * 2.2)) * (1. + .22 * sin(uTime * .7 + iOrb.z * 5.));
  float ang = iOrb.z + uTime * iOrb.w / max(iOrb.x, 1.);
  float tilt = fract(iOrb.z * 1.9) * 1.2 - .6;
  vec3 c = uCentre + vec3(cos(ang) * r, iOrb.y + sin(ang * 2. + iOrb.z) * 5. + tilt * sin(ang) * 9. + uBurst * 14. * fract(iOrb.z * 7.3), sin(ang) * r);
  float bd = 1e12;
  vec3 bq = c;
  vec3 bt = vec3(0., 0., 1.);
  for (int k = 0; k < SWIFT_LINE - 1; k++) {
    if (float(k) + 1.5 < uLineN) {
      vec3 e = uLine[k + 1] - uLine[k];
      float s = clamp(dot(c - uLine[k], e) / max(dot(e, e), 1e-6), 0., 1.);
      vec3 q = uLine[k] + e * s;
      vec3 w = c - q;
      float d2 = dot(w, w);
      if (d2 < bd) { bd = d2; bq = q; bt = mix(uLineT[k], uLineT[k + 1], s); }
    }
  }
  if (bd < SWIFT_OFF * SWIFT_OFF) {
    float g = 1. - sqrt(bd) / SWIFT_OFF;
    bt = normalize(bt);
    vec3 nu = vec3(0., 1., 0.) - bt * bt.y;
    nu /= max(length(nu), 1e-4);
    vec3 w = (c - bq) + nu * (SWIFT_LEAN * g * g);
    float wl = length(w);
    c = bq + ((wl > 1e-4 && abs(dot(w, bt)) < .1 * wl) ? w / wl : nu) * SWIFT_OFF;
  }
  float dirS = iOrb.w < 0. ? -1. : 1.;
  vec3 fwd = normalize(vec3(-sin(ang), .25 * cos(ang * 2. + iOrb.z), cos(ang)) * dirS);
  vec3 sideV = normalize(cross(fwd, vec3(0., 1., 0.)));
  vec3 upV = cross(sideV, fwd);
  float flap = sin(uTime * 17. + iOrb.z * 40.) * step(.35, fract(uTime * .21 + iOrb.z));   // flicker, then glide
  vec4 mvc = viewMatrix * modelMatrix * vec4(c, 1.);
  float sc = max(1., 1.5 * sw_px(-mvc.z) / .18);
  vec3 p = c + (fwd * position.z + sideV * position.x + upV * (abs(position.x) * (.25 + .7 * flap))) * sc;
  vK = position.y;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(p, 1.);
}`;
const SWIFT_FRAG = /* glsl */`
uniform vec3 uGraphite, uCharcoal;
varying float vK;
void main(){ gl_FragColor = vec4(mix(uCharcoal, uGraphite, vK), 1.); }`;
function buildSwifts(style, rng, centre, count) {
  // a swept crescent: body tick and two scythe wings (x = span, z = along the body, y = tone)
  const P = [0, 0, 0.42, 0.09, 0, 0.05, -0.09, 0, 0.05,   0, 0, -0.5, 0.06, 0, 0.05, -0.06, 0, 0.05,
    0.05, 0, 0.16, 0.62, 1, -0.02, 0.98, 1, -0.42,   0.05, 0, 0.16, 0.98, 1, -0.42, 0.2, 0, 0.0,
    -0.05, 0, 0.16, -0.98, 1, -0.42, -0.62, 1, -0.02,   -0.05, 0, 0.16, -0.2, 0, 0.0, -0.98, 1, -0.42];
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const orb = new Float32Array(count * 4);
  for (let k = 0; k < count; k++) { orb[k * 4] = rng.range(19, 46); orb[k * 4 + 1] = rng.range(-9, 24); orb[k * 4 + 2] = rng.range(0, 6.283); orb[k * 4 + 3] = rng.range(13, 22) * (rng.chance(0.8) ? 1 : -1); }
  g.setAttribute('iOrb', new THREE.InstancedBufferAttribute(orb, 4));
  g.instanceCount = count;
  const u = style.uniforms;
  const mat = new THREE.ShaderMaterial({ uniforms: { uTime: u.uTime, uGraphite: u.uGraphite, uCharcoal: u.uCharcoal, uBurst: { value: 0 }, uCentre: { value: centre.clone() },
    uLine: { value: new Float32Array(SWIFT_LINE * 3) }, uLineT: { value: new Float32Array(SWIFT_LINE * 3) }, uLineN: { value: 0 } },   // the flown line's row: empty until the world hands one (setFlownLine)
    vertexShader: SWIFT_VERT, fragmentShader: SWIFT_FRAG, side: THREE.DoubleSide, fog: false });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  return m;
}

// ------------------------------------------------------------------------------------------------
// buildHero
// ------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const windName = opts.wind ?? rng.pick(['gusty', 'gusty', 'steady', 'gale']);
  const wind = windName === 'steady' ? 0.6 : windName === 'gale' ? 1.45 : 1;
  const style = opts.style ?? makeStyle({ palette: opts.palette });
  style.uniforms.uWind.value = wind;
  const object = new THREE.Group();
  object.name = 'sown-with-cloth:ribbon-cone';

  const shape = towerShape(rng);
  await ctx.yield();
  const tower = await buildTower(ctx, shape, style);
  object.add(tower, style.outlineOf(tower, 3.4));
  await ctx.yield();
  const collar = buildCollar(shape, style, rng);
  object.add(collar);
  await ctx.yield();
  const route = (opts.route && opts.route.length > 1) ? opts.route.map((p) => (p.isVector3 ? p : V(p[0], p[1], p[2]))) : FLY.map((p) => V(...p));
  const slots = ribbonSlots(shape, rng, Math.min(wind, 1.2), route, { near: opts.bayNearWidth ?? CONE.bayNearWidth, far: opts.bayFarWidth ?? CONE.bayFarWidth });
  style.uniforms.uConeBays.value.set(slots.bays.a0, slots.bays.spanA, slots.bays.b0, slots.bays.spanB);
  style.uniforms.uConeN.value.set(slots.bays.nA, slots.bays.nB);
  const rb = await buildRibbons(ctx, slots, style, detail);
  object.add(rb.ribbons, rb.ground, rb.rig);
  await ctx.yield();
  const collarC = shape.axisAt(CONE.collarY);
  const swifts = buildSwifts(style, rng, collarC.clone().add(V(0, 6, 0)), Math.round(80 * detail));
  object.add(swifts);
  let ground = null, sheet = null;
  if (opts.ground !== false) { ground = buildGround(ctx, style, 520); object.add(ground); }
  if (opts.sheet !== false) {
    // the bare card behind everything (drawn first, no depth): the sky of this world is the sheet itself
    sheet = new THREE.Mesh(new THREE.SphereGeometry(2400, 16, 8), new THREE.MeshBasicMaterial({ color: style.uniforms.uCard.value, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false }));
    sheet.renderOrder = -0.5; sheet.frustumCulled = false; object.add(sheet);
  }
  await ctx.yield();

  const anchors = {
    bayNear: V(...CONE.bayNear), bayFar: V(...CONE.bayFar),
    bayNearStake: V(Math.cos(slots.bays.thN) * CONE.ringR, 0, Math.sin(slots.bays.thN) * CONE.ringR), bayFarStake: V(Math.cos(slots.bays.thF) * CONE.ringR, 0, Math.sin(slots.bays.thF) * CONE.ringR),
    flyThrough: FLY.map((p) => V(...p)), bayNearCrossing: slots.bays.crossN, bayFarCrossing: slots.bays.crossF,
    collar: collarC.clone(), gaze: collarC.clone().add(V(0, -6, 0)),
    summit: shape.axisAt(CONE.towerH), lean: shape.lean.clone(),
    viewpoints: [{ pos: V(-70, 9, -330), look: V(0, 80, 0) }, { pos: V(-96, 26, -40), look: collarC.clone() }, { pos: V(-70, 14, -168), look: V(-80, 30, -60) }],
    portalSeat: { position: V(-60, 408, 770), facing: V(0, 0, -1), note: 'the summit ring of the banner, not on this piece' },
    ringR: CONE.ringR, stakes: slots.map((s) => s.stake.clone()),
  };

  let progress = 0;
  const u = style.uniforms;
  function setProgress(p) {
    progress = p;
    const a = Math.min(Math.max((p - 0.355) / 0.02, 0), 1), b = Math.min(Math.max((p - 0.42) / 0.09, 0), 1);
    swifts.material.uniforms.uBurst.value = a * a * (3 - 2 * a) * (1 - b * b * (3 - 2 * b));
  }
  // THE SWIFTS' AIR, in the part's own frame (what SWIFT_VERT can make of buildSwifts' draws at the burst's full): a
  // wheel of up to r metres about the collar's axis (46 x 4.4 x 1.22), between the heights y0 and y1 (the swifts'
  // centre, 6 m over the collar, less 9 + 5 + 5.4 and plus 24 + 5 + 5.4 + 14)
  const swiftAir = { x: collarC.x, z: collarC.z, r: 46 * (1 + 1.2 + 2.2) * 1.22, y0: collarC.y + 6 - 19.4, y1: collarC.y + 6 + 48.4, line: SWIFT_LINE, off: SWIFT_OFF };
  // the flown line handed by the world, once, at build: a row of 2 to SWIFT_LINE points in the part's own frame (each
  // with x, y, z). The row's direction at each point is the chord across its neighbours, made unit. A row of fewer
  // than 2 points (or none) leaves the swifts' keep-off idle.
  function setFlownLine(points) {
    const un = swifts.material.uniforms, L = un.uLine.value, T = un.uLineT.value, n = points ? Math.min(points.length, SWIFT_LINE) : 0;
    L.fill(0); T.fill(0); un.uLineN.value = 0;
    if (n < 2) return;
    for (let k = 0; k < n; k++) { L[k * 3] = points[k].x; L[k * 3 + 1] = points[k].y; L[k * 3 + 2] = points[k].z; }
    for (let k = 0; k < n; k++) {
      const a = Math.max(k - 1, 0) * 3, b = Math.min(k + 1, n - 1) * 3, x = L[b] - L[a], y = L[b + 1] - L[a + 1], z = L[b + 2] - L[a + 2], l = Math.hypot(x, y, z) || 1;
      T[k * 3] = x / l; T[k * 3 + 1] = y / l; T[k * 3 + 2] = z / l;
    }
    un.uLineN.value = n;
  }
  return {
    object, radius: CONE.ringR, height: CONE.towerH, center: V(0, 78, 0), anchors, style, setProgress, setFlownLine, swiftAir, wind: windName,
    update(dt, time, camera) {
      u.uTime.value = time;
      u.uConePos.value.setFromMatrixPosition(object.matrixWorld);
      if (sheet && camera) sheet.position.setFromMatrixPosition(camera.matrixWorld).sub(u.uConePos.value);
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}
