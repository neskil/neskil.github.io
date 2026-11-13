// THE FLOATING ISLANDS: hero set piece "The Sugar Cage" and the pastry cook's style kit (three stuffs and nothing else).
// WHAT IT IS  A meringue massif (a ring of seven curled, toasted peaks round a high hollow, parted in front by a
//   spoon-drag valley, 700 kisses on its slopes) under a cage of spun caramel that is THROWN WHILE WE WATCH: ~450
//   threads in 36 skeins (each two or three dark RIBS in a fan of a dozen pale HAIRS) that share a foot and land in
//   clusters at other feet (ribs and windows, not a mesh), each a
//   pale liquid line that whips over in 1.25 s, wobbles, then sets from the foot outward (darker front, frozen wobble,
//   slight sag). Pooled pads and rope coils at the feet, drips with swinging beads, one broken strand, the pouring
//   thread hanging through the crown onto a coil that stacks and slumps, a peak pulled out of the valley wall at 31 s,
//   and the exit hoop of pulled caramel in the hollow. The cage's amber shadow net lies on the white slopes.
// SIZE  radius 150 (feet stand at r 150..162), height 176 (uDome * 150), massif r ~126 and 134 high. Origin: sea level
//   at the massif's centre; FRONT (the valley mouth, the gate) is +Z, the camera flies toward -Z, so its right is +X,
//   where the sun must be (default sun = +X, 12 degrees up). If the world turns the hero by a about Y pass
//   opts.rotationY = a and give makeStyle a `sun` such that the sun stays on the camera's right.
// COST  ~215k triangles (kisses in two moulds: 170 triangles beside the climb, 66 elsewhere) + 7k again into the net
//   target (ribs only); 13 draw calls + 1 in the net pass (stage adds 11k and 2 calls). No lights. One 1024 RGBA8 target. Build ~100-300 ms, longest step < 30 ms.
// OPTS  palette (7 hexes, brief order), detail 0.6..1 (kisses, drips), style (a shared makeStyle()), stage (default
//   true: a custard disc, the steam sky and a flow texture for judging alone; the world passes false), rotationY,
//   duration (42: journey seconds for setProgress), kisses (700), net (1: strength of the amber net).
// PROGRESS  hero.setProgress(u) (journey seconds = u * duration) or hero.setClock(seconds): share of the cage standing
//   = hero.countAt(seconds): 14% before 0 s, 37% at 16 s (the reveal), 67% at 25 s (the gate), 87% at 31 s, the last
//   skein closes the crown at 37 s; the pulled peak rises at 28.5..30 s. Until either is called a 46 s demonstration
//   loop runs on world time. The clock is style.uniforms.uClock: every makeThreads() mesh in the world shares it.
// ANCHORS (hero space)  portalSeat {position (0,62,-18), normal (faces back down the path), radius 7, pitchDeg 6.4:
//   the hoop is built round it}; flyThrough (8 points: level in over the custard at x 0, between the gate feet at
//   z 150, up the valley, across the hollow, through the hoop; >= 6.5 m clear of meringue, kisses and glass);
//   gate {left, right, center} (the two feet 16 m apart); feet[]; viewpoints {reveal, crossing, gate, nave, hollow};
//   lookAt; crown; pour (where the pouring thread lands); pulledPeak; peaks[] {position, top, radius}; brokenStrand;
//   shore {x, z, r, rf} (an island entry for style.makeFlow: set x, z to where the hero stands); clock.
//   Also on the hero: heightAt(x, z) (massif surface, hero space), threads[] (for style.threadPoint), style.
//
// THE STYLE KIT: makeStyle(ctx, { palette, sun, far, dome }) -> everything the world is made of. All materials are
// unlit ShaderMaterials writing display colours (post = POST: flat 1, no bloom, neutral grade; nothing exceeds 1 but
// the glint added over white, which the flat switch clamps). Call style.update(dt, time, camera) every frame.
//   palette      custard, white, lilac, chestnut, caramelPale, caramelDark, duckEgg (the brief's seven) + trough,
//                gold, speck, apricot, cream, fresh, amber, amberLight (linear THREE.Colors)
//   uniforms     shared objects: uTime, uSun, uClock (journey s), uFill (0..1), uViewH, uDome, uFar (scales the
//                distance law), uNet/uNetMat/uNetAmt (amber net: the hero fills them), uFlow/uFlowExt/uCurrent
//   meringue({ instanced, coat })  MATT, TWO TONES by dot(n, sun) with a soft terminator; lilac shade, apricot bounce
//                under overhangs; toast = the aToast mesh mask through a hard stepped ramp (gold, chestnut) with
//                hairline cracks and syrup beads close up; pits and spoon striae (along aPull) as tone only; custard
//                coat below a scalloped line that lags the bob; amber net on the sun side; beyond 300 m toast goes,
//                then shade, then apricot. instanced: per-instance aBob (seed, bob m, period s, tilt rad) + matrix.
//   custard()    opaque satin: three swells in the vertex shader (style.swellAt(x, z, t) is the JS twin) and three
//                shorter rolls as tone only (each sinks into flat yellow where it would be a few pixels narrow); every
//                roll has a cream flank toward the sun and the lens and a deep lee; one broad cream sheen streak in the
//                middle distance; full-strength island shadows in palette.deep; black specks carried by the flow (two
//                phases) and drawn into ribbons ~8 m apart that go round every island, nearly clear between; raised
//                skin folds parallel to every shore within 7 m (5 m folds inside uniforms.uCollar = (x, z, radius), where
//                a course crosses the shore); no reflection, foam or sparkle. Any flat XZ grid.
//   makeFlow(islands, { size, width, cx, cz, casters, shadeSize })  async: builds and installs the flow / shore-distance
//                texture, then makeShade(): the islands' shadows on the custard (casters [{ x, z, r, h, round, len }]) and
//                the bend of the stream function, which gathers the specks into streamlines round every island.
//   thread / makeThreads(list, segs) / threadGeometry / threadPoint  caramel as opaque camera-facing ribbons with a
//                chord profile (pale edge, amber core, one cream glint that slides as we move), never under 1.5 px
//                (they pale instead); thrown and set by uClock; { pour: true } is a hanging, swaying pouring thread.
//   glass(o) / glassMeshes(geo, o) / glassBuilder()  thick caramel (hoop, pad, coil, drip, bead) drawn twice after
//                the opaques: MULTIPLIED over what is behind (tints it amber; order never matters) and ADDED for the
//                hard glint. tube()/lathe() build it; aG.y > 0 is a growth order revealed by o.grow, < 0 swings.
//   peakGeometry(o), quenelleGeometry(o)  the only two meringue shapes (kiss = small peak); emit aToast and aPull.
//   sky()        the steam dome: apricot to duck-egg, soft cream sun, rising steam streaks; follows the camera.
// FORM AND DARK (the polish round; all of it authored, none of it a light). Meringue: the shade deepens from lilac to
//   palette.shadeDeep at its core, a half tone before the terminator, a contact shade toward the sea, a third toast
//   step (palette.burnt). The massif (meringue({ massif: true })) carries aShade, the seven peaks' cast shadows worked
//   out once at build, and a CARAMEL SAUCE drawn in its shader: a pool round the hoop's foot in the hollow and a
//   stream down the spoon valley (uniforms.uSauce = (meander phase, amount)); kisses take the shade of where they stand
//   (in aBob.z) and each lays a soft lilac shadow (shadowBlob(), one instanced quad). Custard: a dark rim where every
//   island sits, slow ripple rings out to 15 m, caramel drawn on the skin as loose spirals, rings and round drops
//   (turns 4.6 m apart, so crossing one never flickers), a sliding gloss on the brows. Glass: one unbroken glint along
//   the upper sunward shoulder of every rope, a honey glow at its edge. pod(): an opaque dark stuff (kept, unused by the world).
// LATER ROUNDS. rope(o): set caramel as an OPAQUE round solid in three tones (deep amber belly, amber flank, honey back,
//   one cream glint) for rope rafts and hanging drops, so turns never multiply to black; its drops swing rigidly.
//   Meringue: a shade toward lilac where the form rolls away from the eye (holds a white outline against a pale sky);
//   on steep walls beside the lens under the cage the amber net is drawn as a few broad crossing bands, each with a
//   firm edge (round firm bars: with soft edges 0.6 to 1.2 m broad the bands 8 m from the eye read as a thing out of focus); the valley
//   wall that faces the sun is let into the light beside the climb (shadeAt's relief); kisses on the valley's walls are
//   scattered on the true surface, lean out of the slope and stand clear; uniforms.uTap (0..1) lays the rare event's
//   white wedge of plain sunlight on that wall. The sauce is a small pooled pad at the hoop's foot and one thread
//   down the valley (never a sheet). Custard: no rings round anything; the caramel on the skin is a hair thread.
//   Thread glint: one line with a sliding gap. The peak in the valley wall rises at 28.5..30 s at (-15, 66).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const POST = { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } };
export const PALETTE = ['#F3D77A', '#FBF7EF', '#CFC6D6', '#6B3A1C', '#F2B45A', '#8A3E12', '#BFDDE0'];

// ---------------------------------------------------------------------------------------------------------------
// GLSL shared by every material of the style
const G_COMMON = /* glsl */`
uniform float uTime; uniform vec3 uSun; uniform vec3 uApricot; uniform float uFar;
float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float h12(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 h22(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h12(i), h12(i + vec2(1,0)), f.x), mix(h12(i + vec2(0,1)), h12(i + vec2(1,1)), f.x), f.y); }
// the distance law: beyond 300 m toast goes first (x), then shade (y), and all of it pales into apricot (z)
vec3 farLaw(float d){ d *= uFar; return vec3(smoothstep(300., 620., d), smoothstep(480., 1000., d), .82 * smoothstep(300., 1500., d)); }
// the three custard swells (70 m crest to crest, one every 9 s, 1.2 m high in all): height in .x, slope in .yz
vec3 swell(vec2 p, float t){
  vec3 r = vec3(0.);
  vec2 d1 = vec2(.966, .259), d2 = vec2(.731, -.682), d3 = vec2(-.208, .978);
  float a1 = dot(p, d1) * .0898 - t * .698, a2 = dot(p, d2) * .1366 - t * .93, a3 = dot(p, d3) * .0571 - t * .52;
  r.x = .42 * sin(a1) + .13 * sin(a2) + .2 * sin(a3);
  r.yz = d1 * (.42 * .0898 * cos(a1)) + d2 * (.13 * .1366 * cos(a2)) + d3 * (.2 * .0571 * cos(a3));
  return r; }
`;
const swellJS = (x, z, t) => 0.42 * Math.sin((x * 0.966 + z * 0.259) * 0.0898 - t * 0.698) + 0.13 * Math.sin((x * 0.731 - z * 0.682) * 0.1366 - t * 0.93) + 0.2 * Math.sin((-x * 0.208 + z * 0.978) * 0.0571 - t * 0.52);

// MERINGUE. Geometry attributes: position, normal, aToast (0..1 mesh mask: tips and ridges), aPull (vec3, the way
// the spoon went: striae run along it). With { instanced: true } it also wants per-instance aBob (vec4: seed, bob
// amplitude m, period s, tilt rad) and uses instanceMatrix; the island then bobs, tilts and turns like a cork and
// the custard coat lags its bob. uCoat = world height of the custard coat line on a still (not instanced) form.
const MER_VERT = /* glsl */`
attribute float aToast; attribute vec3 aPull;
#ifdef INSTANCED
attribute vec4 aBob;
#endif
uniform float uCoat;
#ifdef MASSIF
attribute float aShade;
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vPull; varying float vToast; varying float vCoat; varying vec3 vL; varying float vShade;
${G_COMMON}
void main(){
  vec3 p = position, n = normal, pl = aPull; vL = position;
  float coat = uCoat; vShade = 0.;
#ifdef MASSIF
  vShade = aShade;                                    // the peaks' shadows lying on the massif (worked out once, at build)
#endif
#ifdef INSTANCED
  p = (instanceMatrix * vec4(p, 1.)).xyz; n = mat3(instanceMatrix) * n; pl = mat3(instanceMatrix) * pl;
  vec3 c = instanceMatrix[3].xyz; float ph = aBob.x * 6.2832, w = 6.2832 / max(aBob.z, 1.);
  if (aBob.y == 0. && aBob.w == 0.) vShade = clamp(aBob.z - 1., 0., 1.);   // a thing that neither bobs nor tilts (a kiss) keeps its cast shade in the period slot
  float bob = aBob.y * sin(uTime * w + ph), lag = aBob.y * sin((uTime - 1.3) * w + ph);
  float tx = aBob.w * sin(uTime * w * .61 + ph * 1.7), tz = aBob.w * sin(uTime * w * .47 + ph * 2.3), ty = uTime * .02 * (aBob.x - .5) * 4. * min(aBob.y, 1.);
  vec3 q = p - c; float cs = cos(ty), sn = sin(ty); q.xz = mat2(cs, -sn, sn, cs) * q.xz; n.xz = mat2(cs, -sn, sn, cs) * n.xz; pl.xz = mat2(cs, -sn, sn, cs) * pl.xz;
  q.y += q.x * tx + q.z * tz; n.xz -= vec2(tx, tz) * n.y; q.y += bob;
  p = c + q; coat = c.y + uCoat + 1.2 * aBob.y + max(bob - lag, 0.) * 1.6 + bob * .35;
#endif
  vec4 w4 = modelMatrix * vec4(p, 1.); vW = w4.xyz; vN = normalize(mat3(modelMatrix) * n); vPull = mat3(modelMatrix) * pl;
  vToast = aToast; vCoat = vW.y - coat;
  gl_Position = projectionMatrix * viewMatrix * w4;
}`;
const MER_FRAG = /* glsl */`
uniform vec3 uWhite, uLilac, uGold, uChestnut, uCustard, uTrough, uAmberLight, uShadeDeep, uBurnt, uDeep, uPale, uDark, uAmber, uCream; uniform sampler2D uNet; uniform mat4 uNetMat; uniform float uNetAmt;
uniform vec4 uSauce; uniform float uTap;
varying vec3 vW; varying vec3 vN; varying vec3 vPull; varying float vToast; varying float vCoat; varying vec3 vL; varying float vShade;
${G_COMMON}
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  float d = distance(cameraPosition, vW); vec3 far = farLaw(d);
  float near = 1. - smoothstep(35., 110., d), mid = 1. - smoothstep(90., 260., d);
  // spoon striae: tone only, noise squeezed along the pull
  vec3 pa = normalize(vPull + vec3(0., 1e-4, 0.)); vec3 ps = vW - pa * dot(vW, pa) * .96;
  float stria = vn3(ps * 1.25) - .5; float stria2 = vn3(ps * .45 + 7.) - .5;
  // two tones with a soft terminator one twentieth of the form wide
  float l = dot(n, uSun) + stria2 * .035 * mid;
  // FORM: every island is a round solid. The side away from the light deepens from lilac to a cool lilac-grey at its
  // core; the lit side takes a half tone before the terminator; a cast shade (vShade) is the paler lilac of open shade
  float lit = smoothstep(-.11, .13, l) * (1. - vShade * .96);
  float wedge = 0., tapAmb = 0.;
#ifdef MASSIF
  // THE TAP (rare): where a panel of the cage has broken, plain sunlight falls on the wall that faces the sun as a clean
  // white wedge, its point high up the valley, widening downhill as uTap goes 0..1; no amber bar crosses it
  { float fx = -vL.x * sign(uSun.x + 1e-4), t = clamp((66. - vL.y) / 50., 0., 1.), zc = 40. + 34. * t, hw = (1.2 + 15. * t) * uTap;
    float wa = fwidth(vL.z) + .15;
    wedge = (1. - smoothstep(hw - wa, hw + wa, abs(vL.z - zc))) * smoothstep(2.5, 5., fx) * step(.001, uTap) * step(vL.y, 66.) * smoothstep(-.3, .1, l);
    lit = max(lit, wedge);
    tapAmb = (1. - wedge) * uTap * smoothstep(2.5, 5., fx) * (1. - smoothstep(hw + 4., hw + 26., abs(vL.z - zc))) * step(vL.y, 80.); }   // beside it the wall is in the cage's amber light, which is what makes the wedge white
#endif
  float core = 1. - smoothstep(-.8, .12, l);
  vec3 shadeC = mix(uLilac, uShadeDeep, .38 + .62 * core) * (.95 + .07 * smoothstep(-.3, .9, n.y));
  vec3 litC = mix(mix(uWhite, uLilac, .3), uWhite, smoothstep(.08, .7, l));
  vec3 col = mix(shadeC, litC, lit);
  col = mix(col, mix(uLilac, uApricot, .55), (1. - smoothstep(-.75, -.1, n.y)) * (1. - lit) * .8);   // apricot bounce under overhangs
  // matt white turns a shade toward lilac where the form rolls away from the eye: it is what holds a white peak's outline against a pale sky
  { float rim = smoothstep(.7, .98, 1. - abs(dot(n, normalize(cameraPosition - vW + vec3(0., 1e-5, 0.))))); col = mix(col, mix(uWhite, uLilac, .8), rim * lit * .6 * (1. - far.y)); col = mix(col, uShadeDeep, rim * (1. - lit) * .45 * (1. - far.y)); }   // (and in shade, a deeper lilac: a kiss in shade is still round)
  float sb = clamp(stria * 2.6, -.5, .5);
  col *= 1. + sb * (.085 + .03 * (1. - lit)) * mid * (.35 + .65 * near) + stria2 * .035;
  // pinhole pits, close only
  vec3 pc = vW * 1.45, pi = floor(pc); float ph = h13(pi);
  vec3 pf = fract(pc) - .5 - (vec3(h13(pi + 3.1), h13(pi + 5.7), h13(pi + 9.2)) - .5) * .5;
  float pr = .07 + .1 * fract(ph * 7.3);
  float pit = (1. - smoothstep(pr * .6, pr, length(pf))) * step(.5, ph) * near;
  col = mix(col, col * vec3(.78, .75, .82), pit);
  // amber light through the cage, on the sun side only
  vec4 nc = uNetMat * vec4(vW, 1.); vec2 nuv = nc.xy * .5 + .5;
  float net = smoothstep(.04, .8, texture2D(uNet, nuv, -.35).r) * uNetAmt * step(abs(nc.x), 1.) * step(abs(nc.y), 1.);
  // on a steep wall beside the lens fine bars would be smeared pinstripes: there the wall is barred with a few BROAD bands of amber with white windows between.
  // (round firm bars) A BAND HAS AN EDGE: each band's edge is about two and a half pixels broad, 4 cm at least (e1, e2, e3: 1.2 times the band's own change across a pixel), never softer than the
  // soft edge it had before); each band keeps its place, its middle line, its breadth at half strength, its strength and its creep
  { float wall = (1. - smoothstep(34., 80., d)) * (1. - smoothstep(.5, .85, n.y));
    vec2 wp = vec2(vW.z, vW.y) + (vec2(vn2(vW.zy * .045), vn2(vW.yz * .05 + 7.)) - .5) * 10. + vec2(uTime * .25, 0.);   // the bars are arcs, and they creep
    float b1 = abs(fract(dot(wp, vec2(.94, .34)) / 12.) - .5) * 12., b2 = abs(fract(dot(wp, vec2(.5, -.87)) / 16. + .3) - .5) * 16., b3 = abs(fract(dot(wp, vec2(.77, .64)) / 25. + .6) - .5) * 25.;
    float e1 = clamp(fwidth(b1) * 1.2, .02, .4), e2 = clamp(fwidth(b2) * 1.2, .02, .3), e3 = clamp(fwidth(b3) * 1.2, .02, .6);
    float broad = max(1. - smoothstep(.95 - e1, .95 + e1, b1), max((1. - smoothstep(.6 - e2, .6 + e2, b2)) * .8, (1. - smoothstep(1.6 - e3, 1.6 + e3, b3)) * .9)) * uNetAmt * step(abs(nc.x), 1.) * step(abs(nc.y), 1.);   // (under the cage only)
    net = mix(net, broad * .9, wall); }
  net = max(net, tapAmb * .8);
  col = mix(col, col * uAmberLight, clamp(net, 0., 1.) * (1. - wedge) * lit * (1. - .45 * smoothstep(.55, .95, n.y)));   // on level ground the low sun draws the bars out long: paler there
  // toast: a mesh mask through a hard stepped ramp, gold then chestnut; hairline cracks show white beneath
  float tn = vToast + (vn3(vW * .9) - .5) * .22 + (vn3(vW * 4.) - .5) * .08 * mid;
  float aa = fwidth(tn) + 1e-4;
  float g1 = smoothstep(.46 - aa, .46 + aa, tn), g2 = smoothstep(.7 - aa, .7 + aa, tn);
  float g3 = smoothstep(.92 - aa, .92 + aa, tn);                        // the third step: burnt, where the flame stayed
  vec3 toast = mix(mix(uGold, uChestnut, g2), uBurnt, g3 * .85) * mix(.8, 1., lit);
  float cr = abs(vn3(vW * 1.5 + 11.) - .5 + (vn3(vW * 4.3 + 5.) - .5) * .3); float cw = clamp(fwidth(cr), .004, .05);
  float crack = (1. - smoothstep(cw * .8, cw * 1.9, cr)) * (1. - smoothstep(16., 55., d)) * g1;   // a hairline a pixel or two wide, white beneath
  float bead = step(.965, h13(floor(vW * 1.4))) * (1. - smoothstep(.1, .2, length(fract(vW * 1.4) - .5))) * near * g1;
  toast = mix(toast, uWhite * .97, crack); toast = mix(toast, vec3(.95, .62, .2), bead);
  col = mix(col, toast, g1 * (1. - far.x));
#ifdef MASSIF
  // CARAMEL SAUCE (hero space): poured in the hollow, it pools round the hoop's foot and runs down the spoon valley to
  // the sea: pale honey where it is thin at its edge, dark amber where it lies deep, one cream glint along its sunward
  // side, slow streaks sliding downhill. It gives the high ground a floor of its own colour.
  {
    float zc = vL.z, mx = -2.5 * sin(zc * .045 + uSauce.x) + 2.6 * (vn2(vec2(zc * .06, 7.)) - .5);
    mx += 4. * sin(zc * .19 + 2. * uSauce.x) * smoothstep(-12., 6., zc) * (1. - smoothstep(112., 130., zc));   // the poured thread swings from side to side as it runs, eased in below the pad and out between 112 and 130 m down the valley, where its run ends
    float hw = .4 + 1.5 * vn2(vec2(zc * .09, 3.)) * vn2(vec2(zc * .031, 8.)) * 2.;   // a poured thread running downhill: hair-fine in places, fat where it slows
    { float sw = smoothstep(-12., 6., zc) * (1. - smoothstep(112., 130., zc)), lm = 5. - hw; mx = mix(mx, mx / sqrt(1. + mx * mx / (lm * lm)), sw); }   // and it keeps to the spoon's corridor: at its full swing its edge stays within 5 m of the course line (no peak stands inside 4 m of that line, see heightAt's corridor); the limit eases off with the swing, over flat ground at both ends
    float dR = abs(vL.x - mx) - hw + 30. * (1. - smoothstep(-14., -7., zc)) + 30. * smoothstep(126., 134., zc);
    vec2 pp = vL.xz - vec2(0., -15.5);   // (never a sheet: only a small pooled pad where the hoop stands)
    float dP = length(pp * vec2(1., 1.25)) - (5.6 + 4. * (vn2(pp * .21 + 3.) - .5) + 1.6 * (vn2(pp * .6 + 11.) - .5));
    float ds = min(dR, dP), k = -ds, sa = fwidth(ds) + 1e-3;
    float mask = (1. - smoothstep(-sa, sa, ds)) * uSauce.y;
    vec3 sc = mix(uPale, mix(uAmber, uDark, .72), smoothstep(0., .7, k));
    sc *= .86 + .26 * vn2(vec2(vL.x * .9, zc * .1 - uTime * .35));
    sc = mix(sc, uPale, .3 * smoothstep(.55, .9, vn2(pp * .07 + vec2(uTime * .03, 0.))) * smoothstep(1.5, 4., k));
    float rr = length(vL.xz - vec2(0., -17.)); sc *= 1. + .09 * sin(rr * 1.5 - uTime * 1.1) * (1. - smoothstep(3., 15., rr));   // slow rings from the hoop's foot
    // GLOSS: at a grazing angle it takes the pale honey of the steam sky, and the ring's light lies on it as one long soft streak toward the lens
    vec3 vd = normalize(vW - cameraPosition + vec3(0., 1e-5, 0.)); vec3 Rr = reflect(vd, vec3(0., 1., 0.)); vec3 tr = normalize(vec3(0., 62., -18.) - vL);
    float fres = 1. - clamp(-vd.y, 0., 1.); fres *= fres; fres *= fres;
    sc = mix(sc, mix(uPale, uCream, .25), clamp(fres * .8, 0., .42) * smoothstep(.6, 2.6, k));
    float az = abs(Rr.x * tr.z - Rr.z * tr.x), st = (1. - smoothstep(0., .34, az)) * smoothstep(.1, .8, dot(Rr, tr)) * smoothstep(.5, 3., -dP);
    sc = mix(sc, vec3(1., .9, .66), st * st * .5);
    sc *= mix(.8, 1., lit);
    float gl = (1. - smoothstep(.05, .13, abs(k - .32))) * step(0., (vL.x - mx) * uSun.x) * smoothstep(.52, .66, vn2(vec2(zc * .22 - uTime * .22, vL.x * .12)));   // short glints on its sunward shoulder, never a line
    sc = mix(sc, uCream, gl * .9 * (1. - smoothstep(60., 140., d)));
    col = mix(col, col * uAmberLight, (1. - smoothstep(0., 1.6, ds)) * .7 * uSauce.y);   // the meringue beside it is stained
    col = mix(col, sc, mask);
  }
#endif
  // custard coat below a scalloped line
  float sc = vCoat + (vn3(vec3(vW.xz * .55, 3.)) - .5) * 1.5 + abs(sin(vn3(vec3(vW.xz * .23, 9.)) * 12.)) * .5;
  float ca = fwidth(sc) + 1e-4; float coat = 1. - smoothstep(-ca, ca, sc);
  col *= mix(vec3(.8, .765, .83), vec3(1.), smoothstep(-.3, 5., sc + (1. - lit) * 1.5));   // the contact shade: it darkens toward the sea it sits in
  col = mix(col, mix(mix(uDeep, uTrough, .45), mix(uTrough, uCustard, .7), lit), coat);
  col = mix(col, col * vec3(1., .985, .93), (1. - smoothstep(0., .7, sc)) * (1. - coat) * .8);  // the tide mark
  // distance: shade goes, then everything pales into apricot
  col = mix(col, mix(uWhite, col, .35 + .65 * lit), far.y);
  col = mix(col, uApricot, far.z);
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

// CUSTARD. A flat XZ grid (any size; the world snaps a 60k grid to the camera): swells in the vertex shader.
// uFlow is the data texture from style.makeFlow(): R shore distance / 16 m, GB flow (x,z) * .25 + .5 in units of the
// current, A the lee (where specks gather). uFlowExt = (centre x, centre z, 1 / width in metres).
const CUS_VERT = /* glsl */`
varying vec3 vW; varying vec3 vSw;
${G_COMMON}
void main(){
  vec4 w4 = modelMatrix * vec4(position, 1.); vSw = swell(w4.xz, uTime); w4.y += vSw.x; vW = w4.xyz;
  gl_Position = projectionMatrix * viewMatrix * w4;
}`;
const CUS_FRAG = /* glsl */`
uniform vec3 uCustard, uTrough, uSpeck, uCream, uAmberLight; uniform sampler2D uFlow, uShade; uniform vec3 uFlowExt; uniform vec2 uCurrent;
uniform sampler2D uNet; uniform mat4 uNetMat; uniform float uNetAmt; uniform vec3 uCollar, uDeep, uPale, uDark, uAmber;
varying vec3 vW; varying vec3 vSw;
${G_COMMON}
// CARAMEL DRAWN ON THE SKIN: where the cook's thread crossed the sea it lies as loose spirals and rings (one to a 46 m
// cell, most cells), a rope half a metre wide with turns 4.6 m apart (so crossing one never flickers), turning slowly.
// Returns (coverage, 0 at the rope's edge .. 1 at its heart, glint).
float cKr(vec2 p, vec3 collar){ return 1. - smoothstep(.85, 1., distance(p, collar.xy) / max(collar.z, 1.)); }
vec3 drizzle(vec2 p, float px){
  vec2 c = floor(p / 46.), f = p - (c + .5) * 46.; float h = h12(c + 3.7);
  if (h < .22) return vec3(0.);
  f -= (h22(c + 9.1) - .5) * 19.;
  float R = mix(6.5, 12.5, h12(c + 5.3)), r = length(f) + (vn2(f * .3 + h * 31.) - .5) * 1.4;
  float th = atan(f.y, abs(f.x) < 1e-4 ? 1e-4 : f.x) + uTime * .02 * (h - .68) * 6.;
  float dl, env;
  if (h > .8) { dl = min(abs(r - R), abs(r - R * .52)); env = 1.; }
  else { float P = 4.6, q = (r - P * th / 6.2832) / P; dl = abs(fract(q + .5) - .5) * P; env = (1. - smoothstep(R, R + .4, r)) * smoothstep(.8, 1.4, r); }
  float w = .09 + .2 * vn2(f * .55 + 5.) * vn2(f * .21 + 9.) * 2.;   // a poured thread: hair-fine, swelling and thinning along its length
  float cov = (1. - smoothstep(w - px * .7, w + px * .7, dl)) * env * clamp(w / max(px * .7, 1e-3), 0., 1.);
  float core = clamp(1. - dl / w, 0., 1.);
  return vec3(cov, core, smoothstep(.55, .8, core) * smoothstep(.62, .8, vn2(f * .5 + uTime * .08)) * (1. - smoothstep(.3, .9, px))); }
// and round DROPS of it, 0.4 to 1 m across, one to a 12 m cell in most cells: small dark things at every distance
vec3 drops(vec2 p, float px){
  vec2 c = floor(p / 12.), f = p - (c + .5) * 12.; float h = h12(c * 1.37 + 21.3);
  if (h < .3) return vec3(0.);
  f -= (h22(c + 4.4) - .5) * 7.; float rd = mix(.4, 1.05, fract(h * 9.7)), dd = length(f);
  float cov = (1. - smoothstep(rd - px * .7, rd + px * .7, dd)) * clamp(rd / max(px * .9, 1e-3), 0., 1.);
  return vec3(cov, clamp(1. - dd / rd, 0., 1.), 1. - smoothstep(rd * .14, rd * .22, length(f - vec2(.34, -.3) * rd))); }
float specks(vec2 uv, float px, float dens, float rs){
  vec2 c = floor(uv), f = fract(uv); vec2 h = h22(c); float k = h12(c + 17.3);
  float r = mix(.05, .2, k * k) * rs; float on = step(1. - dens, h12(c + 41.7));
  float dd = length(f - .5 - (h - .5) * .6);
  float cov = 1. - smoothstep(r - px, r + px, dd);
  return on * mix(cov, 3.14 * r * r, clamp(px * 2.2 - .15, 0., 1.)); }
void main(){
  vec3 V = vW - cameraPosition; float d = length(V); float dxz = length(V.xz) + 1e-3; vec3 far = farLaw(d);
  float px = length(fwidth(vW.xz));                    // metres of custard under one pixel (long at a grazing angle)
  vec2 fuv = (vW.xz - uFlowExt.xy) * uFlowExt.z + .5; vec4 fl = texture2D(uFlow, fuv);
  float inb = step(abs(fuv.x - .5), .499) * step(abs(fuv.y - .5), .499);
  float shore = mix(16., fl.r * 16., inb); vec2 flow = mix(uCurrent, (fl.gb - .5) * 4. * length(uCurrent), inb); float lee = fl.a * inb;
  // the second data texture: R = the islands' shadows lying away from the sun, G = how far the stream function is bent by the islands (m)
  vec4 sh4 = texture2D(uShade, fuv); float shade = sh4.r * inb;
  vec2 cdir = normalize(uCurrent + vec2(1e-4, 0.)); float along = dot(vW.xz, cdir), psi = dot(vW.xz, vec2(-cdir.y, cdir.x)) + sh4.g * inb;
  vec2 sx = normalize(uSun.xz + vec2(1e-4, 0.)); vec2 vx = V.xz / dxz;
  // SATIN. The surface is thick and slow: broad rolls, each with a cream flank toward the sun and the lens and a deep
  // lee and trough. The three swells (vertex) carry the far field; three shorter rolls are tone only and each sinks
  // into flat yellow where it would be narrower than a few pixels, so nothing ever shimmers.
  float hgt = smoothstep(-.6, .5, vSw.x); float sl = dot(vSw.yz, sx), sv = dot(vSw.yz, vx);
  float tone = 0., crest = 0.;
  { vec2 q = vec2(.26, .966); float ph = dot(vW.xz, q) * .2027 - uTime * .31, f = 1. - smoothstep(1.9, 5.2, px);
    tone += f * cos(ph) * (dot(q, vx) * .95 - dot(q, sx) * .8); crest += f * sin(ph); }
  { vec2 q = vec2(-.53, .848); float ph = dot(vW.xz, q) * .3307 + uTime * .27 + 1.7, f = 1. - smoothstep(1.2, 3.2, px);
    tone += .8 * f * cos(ph) * (dot(q, vx) * .95 - dot(q, sx) * .8); crest += .8 * f * sin(ph); }
  { vec2 q = vec2(.69, .724); float ph = dot(vW.xz, q) * .5712 - uTime * .36 + 4.1 + 1.3 * vn2(vW.xz * .03), f = 1. - smoothstep(.55, 1.6, px);
    tone += .6 * f * cos(ph) * (dot(q, vx) * .95 - dot(q, sx) * .8); crest += .6 * f * sin(ph); }
  float big = (-sl * 9. + sv * 6.) * (1. - smoothstep(6., 14., px));
  float kS = clamp(.47 + .36 * tone + big * .95 + .2 * (hgt - .5) + .1 * crest, 0., 1.); kS = kS * kS * (3. - 2. * kS);
  vec3 deep = uDeep;                                    // the deeper yellow of a shadow
  vec3 col = mix(mix(uTrough, deep, .5), uCustard, smoothstep(.02, .6, kS));
  col = mix(col, uCream, .32 * smoothstep(.58, .9, kS) + .2 * smoothstep(.86, .99, kS));   // the flank that faces the sun takes cream, its brow a satin light
  // the glossy skin: on the brow of a roll a soft white light that slides with it
  col = mix(col, mix(uCream, vec3(1.), .5), .5 * smoothstep(.9, .995, kS) * smoothstep(.35, .65, vn2(vW.xz * .16 + vec2(uTime * .1, -uTime * .06))) * (1. - smoothstep(1.5, 4., px)));
  col = mix(col, mix(uTrough, deep, .35), (1. - smoothstep(0., 8., shore)) * .6);
  // the wrinkled skin against every shore: raised folds parallel to it within 10 m, 1.6 m apart (inside uCollar's
  // circle, the massif's landing, they are 5 m folds, because there the course crosses them)
  float cK = 1. - smoothstep(.85, 1., distance(vW.xz, uCollar.xy) / max(uCollar.z, 1.));
  float wl = mix(1.6, 5.2, cK), wph = shore * 6.2832 / wl + vn2(vW.xz * .22) * 3.2 * mix(1., .35, cK);
  float wEnv = (1. - smoothstep(wl * 1.7, wl * 4.2, shore)) * smoothstep(.05, .5, shore) * (1. - smoothstep(wl * .2, wl * .6, px));
  float wr = sin(wph) * wEnv, wr2 = cos(wph) * wEnv;
  col = mix(col, mix(uTrough, deep, .45), clamp(-wr * .85, 0., 1.));
  col = mix(col, uCream, clamp(wr2 * .6, 0., 1.) * (1. - shade));
  col = mix(col, deep * vec3(.9, .82, .7), (1. - smoothstep(.0, 2.6, shore)) * .62);   // the contact shade: a dark rim of custard where each island sits in the sea
  // deeper-yellow shadows of the islands, several island-heights long at the golden hour: full strength, the rolls still showing in them
  col = mix(col, mix(deep * (.9 + .2 * kS), col * deep / max(uCustard, vec3(.02)), .6), shade);   // the same satin, deeper
  // one broad cream sheen: a soft streak a tenth of the frame high in the middle distance, lying toward the sun,
  // broken into lozenges by the rolls, never in shadow
  float dep = (cameraPosition.y - vW.y) / dxz;
  float band = smoothstep(.02, .045, dep) * (1. - smoothstep(.1, .19, dep));
  float hl = band * smoothstep(-.75, .35, dot(vx, sx)) * clamp(.34 + .95 * kS + .25 * tone, 0., 1.) * (1. - shade) * (1. - .5 * smoothstep(500., 1500., dxz));
  col = mix(col, mix(uCream, vec3(1.), .12), hl * .88);
  // VANILLA SPECKS carried by the flow (two phases that hand over so the pattern never stretches), drawn out into
  // STREAMLINES: ribbons a few metres wide, ten and more apart, that go round every island; almost none between them
  float T = 6., t1 = fract(uTime / T), t2 = fract(uTime / T + .5); float w1 = 1. - abs(2. * t1 - 1.);
  float rq = psi / 8.2 + (vn2(vec2(psi * .021, along * .0045)) - .5) * 2.6;
  float rw = .5 + .5 * cos(6.2832 * rq), thin = vn2(vec2(floor(rq + .5) * 7.3, along * .011 - uTime * .004));
  float strk = smoothstep(.62, .94, rw) * smoothstep(.14, .45, thin);
  float dens = clamp(.006 + .95 * strk + .55 * lee * strk + .12 * lee, 0., 1.);
  vec2 u1 = (vW.xz - flow * T * (t1 - .5)) * 3.1, u2 = (vW.xz - flow * T * (t2 - .5)) * 3.1 + 37.7;
  float sp = mix(specks(u2, px * 3.1, dens, 1.), specks(u1, px * 3.1, dens, 1.), w1);
  vec2 u3 = (vW.xz - flow * T * (t1 - .5)) * .6 + 5.3, u4 = (vW.xz - flow * T * (t2 - .5)) * .6 + 71.1;
  sp = max(sp, mix(specks(u4, px * .6, dens * .5, .42), specks(u3, px * .6, dens * .5, .42), w1));
  // far off they sink into a faint flow-line tone
  float spFar = smoothstep(60., 170., d);
  col = mix(col, uSpeck, sp * (1. - spFar) * .92);
  col = mix(col, mix(col, uSpeck, mix(.24, .09, step(dot(uCustard, vec3(.333)), dot(uSpeck, vec3(.333))))), strk * (.62 + .38 * spFar) * (1. - smoothstep(3., 8., px)) * (1. - far.y));   // each ribbon is also a faint stain, so it reads as a line at any distance
  // caramel drawn on the skin (rings and loose spirals), with its glint
  { vec3 dz = drizzle(vW.xz, px), dr = drops(vW.xz, px); if (dr.x > dz.x) dz = vec3(dr.x, dr.y * 1.3, dr.z * (1. - smoothstep(.4, 1.2, px)));
    float on = dz.x * smoothstep(.6, 2.5, shore) * (1. - far.y);
    col = mix(col, mix(mix(uPale, uAmber, .6), mix(uAmber, uDark, .75), smoothstep(.12, .6, dz.y)) * (1. - .3 * shade), on * .96);
    col = mix(col, uCream, dz.z * on * .8 * (1. - shade)); }
  // amber light through the cage
  vec4 nc = uNetMat * vec4(vW, 1.); float net = smoothstep(.04, .8, texture2D(uNet, nc.xy * .5 + .5, -.35).r) * uNetAmt * step(abs(nc.x), 1.) * step(abs(nc.y), 1.);
  col = mix(col, col * uAmberLight, clamp(net, 0., 1.) * .38 * (1. - smoothstep(.08, .4, nc.z)));
  col = mix(col, mix(uCustard, uApricot, .5), far.z * .9);
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

// STEAM SKY. A dome that follows the camera: apricot at the horizon to duck-egg by 35 degrees, a soft cream sun disc
// 5 degrees wide half sunk in haze, faint streaks of steam rising through the lowest 20 degrees. No cloud.
const SKY_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * mat3(modelMatrix) * position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uDuck, uCream, uCustard, uSteam;
varying vec3 vD;
${G_COMMON}
void main(){
  vec3 dir = normalize(vD + vec3(0., 1e-5, 0.)); float el = asin(clamp(dir.y, -1., 1.)) * 57.2958;
  vec3 col = mix(uApricot, uDuck, smoothstep(0., 35., el));
  vec2 hz = dir.xz / (length(dir.xz) + 1e-4);
  // steam: faint vertical streaks rising through the lowest 20-odd degrees (noise drawn out upward, sliding up)
  float st = smoothstep(.5, .8, vn3(vec3(hz * 19., el * .045 - uTime * .09))) * (.45 + .55 * vn3(vec3(hz * 5. + 3., el * .16 - uTime * .22)));
  float sEnv = (1. - smoothstep(9., 27., el)) * smoothstep(-1., 2.5, el);
  col = mix(col, uSteam, st * .7 * sEnv);
  float sd = acos(clamp(dot(dir, uSun), -1., 1.)) * 57.2958;
  float haze = smoothstep(0., 22., el);
  col = mix(col, uCream, (1. - smoothstep(2.1, 2.9, sd)) * mix(.45, .95, haze) + (1. - smoothstep(2., 16., sd)) * .16);
  col = mix(col, mix(uCustard, uApricot, .5), 1. - smoothstep(-6., 0., el));
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
}`;

// CARAMEL THREADS. Instanced camera-facing ribbons, opaque, depth-written, never under 1.5 px (they pale instead of
// thinning). position = (s 0..1, side -1/+1, 0). Per instance: aA foot, aB landing, aP = (throw time in journey
// seconds, seed, width m, height scale; a NEGATIVE height scale makes it a pouring thread hanging from aA to aB).
// A thrown thread is half an ellipse standing on its two ends; uClock (journey seconds) throws it (1.25 s of
// flight), then the setting front runs from the foot (1.6 s), freezing the wobble with a slight sag.
const THR_VERT = /* glsl */`
attribute vec3 aA, aB; attribute vec4 aP;
uniform float uClock, uViewH, uDome;
varying float vV; varying float vS; varying float vSet; varying float vThin; varying float vSeed; varying vec3 vW; varying float vPool; varying float vRib;
${G_COMMON}
vec3 arc(float s, float g, float age){
  vec3 A = aA, B = aB; float sd = aP.y;
  if (aP.w < 0.) {                                   // the pour: hangs, sways, and stirs its foot at 1.5 turns a second
    vec3 p = mix(A, B, s); float lo = s * s * s;
    p.xz += vec2(sin(uTime * .5 + s * 2.4 + sd * 9.), cos(uTime * .37 + s * 3.1)) * 5. * s * (1. - lo);
    p.xz += vec2(cos(uTime * 9.42), sin(uTime * 9.42)) * 1.5 * smoothstep(.985, 1., s);
    return p; }
  vec3 mid = (A + B) * .5, hf = (B - A) * .5; float th = 3.14159 * s;
  float hh = uDome * length(hf.xz) * aP.w * (.82 + .18 * g);
  vec3 p = mid - hf * cos(th) + vec3(0., hh * sin(th), 0.);
  vec3 lat = normalize(vec3(-hf.z, 0., hf.x) + vec3(1e-4, 0., 0.));
  float tf = min(age, 1.25 + s * 1.6);               // the wobble stops where the setting front has passed
  float env = sin(th); float sgn = sd > .5 ? 1. : -1.;
  float rg = smoothstep(.04, .12, aP.w);              // a height scale under .04 is a rigid sliver (a shard): no wobble, no sag
  float wob = sin(s * 13. + sd * 40. - tf * 6.) * 2.2 + sin(s * 29. + sd * 17. + tf * 9.) * .8;
  p += lat * env * rg * (wob + sgn * 30. * (1. - g) * (1. - g) + .7 * sin(uTime * .8 + sd * 37.));   // set sugar still trembles a hand's width in the warm air
  p.y += rg * (env * sin(s * 9. + sd * 23. + tf * 5.) * 1.4 - env * env * 2.5 * clamp((age - 1.25) / 1.6 - s, 0., 1.));
  return p; }
void main(){
  float age = uClock - aP.x; float g = clamp(age / 1.25, 0., 1.); g = g * g * (3. - 2. * g);
  if (aP.w < 0.) g = 1.;
  float s = min(position.x, g);
  vec3 p0 = arc(s, g, age), p1 = arc(min(s + .012, 1.012), g, age);
  vec4 w0 = modelMatrix * vec4(p0, 1.), w1 = modelMatrix * vec4(p1, 1.);
  vec3 tg = w1.xyz - w0.xyz; tg = normalize(tg + vec3(0., 1e-5, 0.));
  vec3 vd = isOrthographic ? vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]) : cameraPosition - w0.xyz;
  vec3 sdv = cross(tg, vd); sdv = normalize(sdv + vec3(1e-5, 0., 1e-5));
  float pool = aP.w < 0. ? 0. : 1.8 * exp(-s * 60.) + 1.1 * exp(-(1. - s) * 90.);
  float hw = .5 * aP.z * (1. + pool);
  vRib = smoothstep(.09, .16, aP.z);
#ifdef NET
  // only the ribs of a skein throw a bar of amber light (its first rib a broad one); the hairs let the sun through
  float hwMin = mix(.45, .75, smoothstep(.24, .27, aP.z)); hw = 0.; g *= step(.15, aP.z);
#else
  float dist = length((viewMatrix * w0).xyz);
  float hwMin = isOrthographic ? hw : (.78 + .45 * vRib) * dist * 2. / max(projectionMatrix[1][1] * uViewH, 1.);
#endif
#ifndef NET
  if (aP.w < 0.) hwMin *= 1. + .7 * smoothstep(1., 1.4, aP.z);   // the one fat pouring thread of the entry stays a plain amber line at any distance
#endif
  vThin = clamp(hw / max(hwMin, 1e-4), 0., 1.); hw = max(hw, hwMin) * step(1e-4, g);
  w0.xyz += sdv * hw * position.y;
  vV = position.y; vS = s; vSeed = aP.y; vW = w0.xyz; vPool = pool;
  vSet = aP.w < 0. ? .62 * smoothstep(.6, 1.2, aP.z) + .3 * smoothstep(1.2, 1.4, aP.z) : clamp((age - 1.25) / 1.6 - s + .04, 0., .08) * 12.5;
  gl_Position = projectionMatrix * viewMatrix * w0;
}`;
const THR_FRAG = /* glsl */`
uniform vec3 uPale, uDark, uCream, uFresh, uAmber; uniform float uFill;
varying float vV; varying float vS; varying float vSet; varying float vThin; varying float vSeed; varying vec3 vW; varying float vPool; varying float vRib;
${G_COMMON}
void main(){
#ifdef NET
  gl_FragColor = vec4(vec3(.5 + .5 * vSet) * (1. - vV * vV), 1.);
#else
  float c = sqrt(max(1. - vV * vV, 0.));
  float dk = .25 + .75 * uFill + (fract(vSeed * 7.31) - .5) * .8; vec3 setHair = mix(mix(uPale, uAmber, clamp(dk * 1.6, 0., 1.)), uDark, clamp(dk - .55, 0., .6));
  // hair-fine sugar is pale; a rib thinned only by distance keeps its amber
  vec3 fine = mix(uFresh, uPale, .45 + .55 * fract(vSeed * 13.7)); setHair = mix(uAmber, uDark, clamp(dk - .35, 0., .7));
  vec3 hair = mix(mix(uFresh, uPale, .25 * vRib), mix(fine, setHair, vRib), vSet);
  vec3 core = mix(mix(uFresh, uPale, .6), mix(uAmber, uDark, clamp(.12 + .3 * vPool + (vSeed - .5) * .3, 0., .8)), vSet);
  vec3 thick = mix(mix(uPale, uFresh, .55), core, smoothstep(.0, .75, c));     // pale edge, dark core
  // ONE glint line along each thread, unbroken but for a short gap or two that slide along it as we move
  float gl = (1. - smoothstep(.05, .09, abs(vV - .36))) * smoothstep(-.82, -.6, sin(vS * 11. + vSeed * 30. + dot(cameraPosition, vec3(.05, .03, .04)) - uTime * (.35 + .3 * vSeed)));
  thick = mix(thick, uCream, gl);
  vec3 col = mix(hair, thick, smoothstep(.45, 1., vThin));
  float d = distance(cameraPosition, vW); col = mix(col, uApricot, farLaw(d).z * .6);
  gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
#endif
}`;

// THICK CARAMEL GLASS (hoop, pad, coil, drip, bead). Drawn after the opaques, twice: once MULTIPLIED over what is
// behind it (order never matters), once ADDED for the one hard cream glint. Attributes: position, normal,
// aG = (dark 0 pale..1 pooled, growth order 0..1: fragments whose order exceeds uGrow are not there yet).
const GLS_VERT = /* glsl */`
attribute vec2 aG; uniform float uRide; uniform float uRideV;
varying vec3 vW; varying vec3 vN; varying vec2 vG;
${G_COMMON}
void main(){ vec4 w4 = modelMatrix * vec4(position, 1.);
  w4.y += uRide * swell(modelMatrix[3].xz, uTime).x;
  w4.y += uRideV * swell(w4.xz, uTime).x;   // rideV: every vertex rides its own swell (many rafts in one mesh)
  float sw = max(-aG.y, 0.);
#ifdef ROPE
  w4.xz += vec2(sin(uTime * 1.1 + modelMatrix[3].x * .7), cos(uTime * .9 + modelMatrix[3].z * .7)) * min(sw, 9.) * .045;   // a hanging drop swings as one rigid thing
#else
  w4.xz += vec2(sin(uTime * 1.1 + position.x * .7), cos(uTime * .9 + position.z * .7)) * sw * .07;
#endif
  //   // a negative growth order = metres below a pivot: drips and beads swing
  vW = w4.xyz; vN = normalize(mat3(modelMatrix) * normal); vG = aG;
  gl_Position = projectionMatrix * viewMatrix * w4; }`;
const GLS_FRAG = /* glsl */`
uniform vec3 uPale, uDark, uCream, uPod, uAmber; uniform float uGrow;
varying vec3 vW; varying vec3 vN; varying vec2 vG;
${G_COMMON}
void main(){
  if (vG.y > uGrow) discard;
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.)); vec3 v = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  float ndv = abs(dot(n, v));
  // ONE UNBROKEN GLINT: on a rope lying in turns the light sits along its upper, sunward shoulder all the way round
  vec3 Hg = normalize(vec3(uSun.x * .36, 1., uSun.z * .36)); float top = smoothstep(.93, .957, dot(n, Hg));
#ifdef POD
  // a vanilla pod (or any small dark thing that floats): nearly black, a warmer lit side, a waxy light along its back
  float lt = smoothstep(-.3, .7, dot(n, uSun));
  vec3 pc = mix(uPod, uPod * 2.4 + vec3(.05, .03, .01), lt * .75);
  pc *= .86 + .28 * step(.5, fract(atan(n.y, length(n.xz) + 1e-3) * 2.2 + vW.x * .0));   // (its long ribs)
  pc = mix(pc, uCream, top * .42);
  gl_FragColor = vec4(clamp(mix(pc, uApricot, farLaw(distance(cameraPosition, vW)).z), 0., 1.), 1.);
#else
#ifdef ROPE
  // SET CARAMEL AS A ROUND SOLID (rope rafts, hanging drops): opaque and depth-written, so turns that lie over one
  // another never multiply to black. Pale honey at its edge, amber at its heart, a deeper amber under its belly (never
  // darker than uDark), sunlight glowing through its sunward side, and ONE unbroken cream glint along its upper shoulder.
  float e = 1. - ndv, dk = clamp(vG.x, 0., 1.);
  // drawn in three tones by where the surface faces, as a cook would paint a rope of sugar: a deep amber belly where it
  // lies on the custard (which is what parts it from the yellow), an amber flank, a honey back, and the glint on the shoulder
  vec3 deepA = mix(uAmber, uDark, .85), flank = mix(uAmber, mix(uAmber, uDark, .55), dk), back = mix(mix(uPale, uAmber, .38), uAmber, dk * .7);
  vec3 rc = mix(deepA, flank, smoothstep(-.42, -.02, n.y));
  rc = mix(rc, back, smoothstep(.3, .62, n.y));
  rc = mix(rc, mix(uPale, uCream, .2), smoothstep(.7, .97, e) * .55 * smoothstep(-.1, .4, n.y));     // a pale honey edge where the light comes through
  rc = mix(rc, uPale, .28 * smoothstep(.3, .95, dot(n, uSun)) * (1. - dk * .6));                     // and through its sunward side
  float gw = fwidth(dot(n, Hg)) * 1.2 + .012; float gl = smoothstep(.925 - gw, .925 + gw, dot(n, Hg));
  rc = mix(rc, mix(uCream, vec3(1.), .4), gl * .95);
  gl_FragColor = vec4(clamp(mix(rc, uApricot, farLaw(distance(cameraPosition, vW)).z), 0., 1.), 1.);
#else
#ifdef GLINT
  vec3 hv = normalize(uSun + v + vec3(0., 1e-4, 0.)); float sp = dot(n, hv);
  float g = smoothstep(.972, .982, sp) + .5 * smoothstep(.9, .94, 1. - ndv) * smoothstep(.2, .6, n.y) + top * 1.3;
  float glow = (1. - ndv) * (1. - ndv) * .16 * (1. - clamp(vG.x, 0., 1.) * .6);   // light through the sugar: its edge glows honey
  gl_FragColor = vec4(uCream * clamp(g, 0., 1.) * .6 + uPale * glow, 1.);
#else
  float d = distance(cameraPosition, vW);
  vec3 bc = vW * 1.1, bi = floor(bc); float bub = step(.8, h13(bi)) * (1. - smoothstep(.12, .2, length(fract(bc) - .5))) * (1. - smoothstep(30., 80., d));
  vec3 tint = mix(uPale, uDark, clamp(vG.x + (vn3(vW * .5) - .5) * .25, 0., 1.));
  float thick = clamp(.3 + .95 * ndv - bub * .5, 0., 1.3);
  vec3 T = pow(tint, vec3(thick * 1.25));
  T = mix(T, vec3(1.), .7 * clamp(-vG.x, 0., 1.)) * mix(1., .55, clamp(vG.x - 1., 0., 1.));   // aG.x below 0: pulled thin and pale; above 1: pooled and darker still
  gl_FragColor = vec4(clamp(T, 0., 1.), 1.);
#endif
#endif
#endif
}`;

// ---------------------------------------------------------------------------------------------------------------
// THE STYLE KIT
export function makeStyle(ctx, opts = {}) {
  const pal = opts.palette || PALETTE, C = (h) => new THREE.Color(h);
  const palette = {
    custard: C(pal[0]), white: C(pal[1]), lilac: C(pal[2]), chestnut: C(pal[3]), caramelPale: C(pal[4]), caramelDark: C(pal[5]), duckEgg: C(pal[6]),
    trough: C('#E2B84C'), gold: C('#E0A85A'), speck: C('#2A1F1A'), apricot: C('#F6D9B8'), cream: C('#FFF3C4'), fresh: C('#FBDD98'), amberLight: C('#F9CA8C'), amber: C('#DC8A22'), steam: C('#FFF8EC'),
  };
  palette.shadeDeep = palette.lilac.clone().multiply(new THREE.Color(0.72, 0.7, 0.84));   // the core of a meringue's shade: a cool lilac-grey
  palette.burnt = C('#3B1D0D'); palette.pod = C('#3A2013');
  palette.deep = palette.trough.clone().multiply(new THREE.Color(0.74, 0.58, 0.36));   // the custard in shadow (a world that changes trough sets it again)
  // the sun stands at right angles to the course on the right, 12 degrees up; `opts.sun` (a world-space direction TO the sun) replaces it
  const sun = (opts.sun ? new THREE.Vector3().copy(opts.sun) : new THREE.Vector3(Math.cos(0.21), Math.sin(0.21), 0)).normalize();
  const blank = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); blank.needsUpdate = true;
  const calm = new THREE.DataTexture(new Uint8Array([255, 191, 128, 0]), 1, 1); calm.needsUpdate = true;   // far from any shore, flowing +X
  // shared uniforms: one object each, so setting .value once drives every material of the world
  const uniforms = {
    uTime: { value: 0 }, uSun: { value: sun }, uApricot: { value: palette.apricot }, uFar: { value: opts.far ?? 1 },
    uClock: { value: 0 },                 // journey seconds: throws and sets the threads (world: u * duration)
    uFill: { value: 0 },                  // 0..1 how full the cage is: set threads deepen from pale gold to amber
    uViewH: { value: 450 },               // drawing-buffer height in px (thread width floor); update() sets it
    uDome: { value: opts.dome ?? 170 / 150 },   // height of a thrown arc over half its span
    uNet: { value: blank }, uNetMat: { value: new THREE.Matrix4() }, uNetAmt: { value: 0 },   // the amber net: the hero fills these
    uFlow: { value: calm }, uShade: { value: blank }, uFlowExt: { value: new THREE.Vector3(0, 0, 1 / 1200) }, uCurrent: { value: new THREE.Vector2(1.6, 0) }, uCollar: { value: new THREE.Vector3(0, 0, 0) }, uDeep: { value: palette.deep },   // uCollar (x, z, radius): where shore wrinkles become broad folds
    uWhite: { value: palette.white }, uLilac: { value: palette.lilac }, uGold: { value: palette.gold }, uChestnut: { value: palette.chestnut },
    uCustard: { value: palette.custard }, uTrough: { value: palette.trough }, uSpeck: { value: palette.speck }, uCream: { value: palette.cream },
    uPale: { value: palette.caramelPale }, uDark: { value: palette.caramelDark }, uFresh: { value: palette.fresh }, uAmberLight: { value: palette.amberLight },
    uDuck: { value: palette.duckEgg }, uAmber: { value: palette.amber }, uSteam: { value: palette.steam },
    uShadeDeep: { value: palette.shadeDeep }, uBurnt: { value: palette.burnt }, uPod: { value: palette.pod }, uSauce: { value: new THREE.Vector4(0, 0, 0, 0) }, uTap: { value: 0 },   // uSauce (phase of the valley's meander, amount): the hero sets it
  };
  const U = (extra) => ({ ...uniforms, ...extra });   // shares the uniform OBJECTS, adds private ones
  const mk = (vs, fs, extra, o = {}) => new THREE.ShaderMaterial({ uniforms: U(extra), vertexShader: vs, fragmentShader: fs, ...o });
  const style = {
    palette, uniforms, sun, POST, swellAt: swellJS,
    // meringue({ instanced, coat }) : coat = world height of the custard coat line (default 1.2; -1e3 = none)
    meringue: (o = {}) => mk(MER_VERT, MER_FRAG, { uCoat: { value: o.coat ?? 1.2 } }, { defines: o.instanced ? { INSTANCED: 1 } : o.massif ? { MASSIF: 1 } : {} }),
    custard: () => mk(CUS_VERT, CUS_FRAG, {}),
    // threads: ONE opaque material for every makeThreads() mesh; threadNet is its twin drawn into the amber net
    thread: mk(THR_VERT, THR_FRAG, {}, { side: THREE.DoubleSide }),
    threadNet: mk(THR_VERT, THR_FRAG, {}, { side: THREE.DoubleSide, defines: { NET: 1 }, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, transparent: true }),
    // glass({ grow, ride }) returns the PAIR [multiply, glint]; put both on the same geometry (style.glassMeshes does it).
    // grow: a { value } uniform revealing the piece by its growth order; ride 1: the piece rides the swell at its origin.
    glass: (o = {}) => {
      const ex = { uGrow: o.grow || { value: 1 }, uRide: { value: o.ride ? 1 : 0 }, uRideV: { value: o.rideV ? 1 : 0 } };
      return [
        mk(GLS_VERT, GLS_FRAG, ex, { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }),
        mk(GLS_VERT, GLS_FRAG, ex, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, defines: { GLINT: 1 } }),
      ];
    },
    // pod(): an opaque, dark, floating stuff for the small things on the custard (vanilla pods); every vertex rides its own swell
    pod: () => mk(GLS_VERT, GLS_FRAG, { uGrow: { value: 1 }, uRide: { value: 0 }, uRideV: { value: 1 } }, { defines: { POD: 1 } }),
    // rope({ grow, ride, rideV }): set caramel as an OPAQUE round solid (rope rafts beside the lens, hanging drops): see ROPE in GLS_FRAG
    rope: (o = {}) => mk(GLS_VERT, GLS_FRAG, { uGrow: o.grow || { value: 1 }, uRide: { value: o.ride ? 1 : 0 }, uRideV: { value: o.rideV ? 1 : 0 } }, { defines: { ROPE: 1 } }),
    // shadowBlob(): a soft lilac shadow laid on white (multiplied over what is behind). An instanced quad in its own XZ
    // plane, x -0.25..1 along the shadow, z -0.5..0.5 across; per-instance aStr = strength.
    shadowBlob: () => mk(/* glsl */`attribute float aStr; varying vec2 vU; varying float vS;
void main(){ vU = position.xz; vS = aStr; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }`, /* glsl */`uniform vec3 uShadeDeep, uWhite; varying vec2 vU; varying float vS;
void main(){ float x = vU.x, z = abs(vU.y) * 2., w = mix(.95, .3, clamp(x, 0., 1.));
  float a = (1. - smoothstep(w * .4, w, z)) * smoothstep(-.25, -.02, x) * (1. - smoothstep(.4, 1., x)) * vS * .9;
  gl_FragColor = vec4(mix(vec3(1.), uShadeDeep / max(uWhite, vec3(.05)), a), 1.); }`, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor }),
    glassMeshes(geo, o = {}) {
      const [m, g] = o.materials || style.glass(o); const grp = new THREE.Group();
      const a = new THREE.Mesh(geo, m), b = new THREE.Mesh(geo, g); a.renderOrder = 5; b.renderOrder = 6; grp.add(a); if (!o.noGlint) grp.add(b); return grp;   // noGlint: far things that need no light on them
    },
    // the steam sky: add to the scene; update() keeps it on the camera
    sky() {
      const m = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 20), mk(SKY_VERT, SKY_FRAG, {}, { side: THREE.BackSide, depthWrite: false, depthTest: false }));
      m.renderOrder = -0.5; m.frustumCulled = false; style._skies.push(m); return m;
    },
    _skies: [],
    // drive once a frame (the hero's update() does NOT call this when it was handed opts.style: the world does)
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      const r = ctx.renderer; if (r && r.getDrawingBufferSize) uniforms.uViewH.value = r.getDrawingBufferSize(_v2).y;
      if (camera) { _v3.setFromMatrixPosition(camera.matrixWorld); for (const s of style._skies) s.position.copy(_v3); }
    },
  };
  addGeometryHelpers(style, ctx);
  return style;
}
const _v2 = new THREE.Vector2(), _v3 = new THREE.Vector3();

function addGeometryHelpers(style, ctx) {
  const geoFrom = (pos, idx, toast, pull) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aToast', new THREE.Float32BufferAttribute(toast, 1));
    g.setAttribute('aPull', new THREE.Float32BufferAttribute(pull, 3));
    g.setIndex(idx); g.computeVertexNormals(); return g;
  };
  // THE PULLED PEAK (also the kiss): a body swept along a spine that goes straight up and then curls over.
  // o: height, radius, curl (radians the tip turns through, 0..3.8), dir (azimuth the tip falls toward), radial,
  // rings, wob (0..1 lumpiness, needs rnd), rnd (a function 0..1), toast (0 none .. 1 normal .. 1.6 scorched), sink
  // (share of the height buried below y 0), bulge (0.3: the fat foot of a kiss; 0 for a cone that grows out of a mound),
  // taper (1.3 a drawn-out peak; 0.95 a plump kiss).
  style.peakGeometry = (o = {}) => {
    const H = o.height ?? 2, R = o.radius ?? H * 0.42, curl = o.curl ?? 2.6, dir = o.dir ?? 0, nr = o.radial ?? 6, ns = o.rings ?? 3;
    const rnd = o.rnd || (() => 0.5), wob = o.wob ?? 0, tk = o.toast ?? 1, sink = o.sink ?? 0.08, bulge = o.bulge ?? 0.3, taper = o.taper ?? 1.3;
    // prof(t): the body's radius / R along the spine (replaces the cone); toastFrom: where along the spine toast begins;
    // ridge { at (world azimuth at the foot, x = cos, z = sin), turn (radians it winds by the top, or by the share `by` of the spine), w (half width, rad), amp }: a
    // seam the spoon left running up the flank, proud of the surface and toasted in steps
    const prof = o.prof, tf0 = o.toastFrom ?? 0.52, rdg = o.ridge || null, wrapA = (x) => Math.atan2(Math.sin(x), Math.cos(x));
    const pos = [], idx = [], toast = [], pull = [];
    const cd = Math.cos(dir), sd = Math.sin(dir), ph1 = rnd() * 6.28, ph2 = rnd() * 6.28, lob = 0.5 + rnd();
    let yu = 0, ym = 0, tq = 0; for (let j = 1; j <= ns; j++) { const t = 1 - Math.pow(1 - j / ns, 1.7); yu += Math.cos(curl * Math.pow(smoothstep(0.42, 1, (t + tq) / 2), 2)) * (t - tq); tq = t; ym = Math.max(ym, yu); }
    let cx = 0, cy = -H * sink, cz = 0, tPrev = 0; const L = H * (1 + sink) / Math.max(ym, 0.3);
    for (let j = 0; j <= ns; j++) {
      const t = 1 - Math.pow(1 - j / ns, 1.7), e = smoothstep(0.42, 1, t), al = curl * e * e;
      const am = curl * Math.pow(smoothstep(0.42, 1, (t + tPrev) / 2), 2), dl = (t - tPrev) * L;
      cx += Math.sin(am) * cd * dl; cy += Math.cos(am) * dl; cz += Math.sin(am) * sd * dl; tPrev = t;
      const tx = Math.sin(al) * cd, ty = Math.cos(al), tz = Math.sin(al) * sd;
      const nx = Math.cos(al) * cd, ny = -Math.sin(al), nz = Math.cos(al) * sd;
      let r = prof ? R * prof(t) + H * 0.004 : R * Math.pow(1 - t, taper) * (1 + bulge * Math.exp(-Math.pow((t - 0.12) / 0.16, 2))) * (1 - 0.12 * Math.exp(-Math.pow((t - 0.42) / 0.14, 2))) + R * 0.02 * (1 - t) + H * 0.004;
      for (let i = 0; i < nr; i++) {
        const a = (i / nr) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
        let rr = r * (1 + wob * (0.09 * Math.sin(a * 2 + ph1 + t * 3 * lob) + 0.06 * Math.sin(a * 3 + ph2 - t * 5)) * (1 - t));
        // toast: the tip, and the back of the curl (the outside of the bend is what the flame reaches)
        let tt = clamp((smoothstep(tf0, 0.96, t) * (0.72 + 0.28 * -ca * Math.min(1, al)) + 0.1 * Math.sin(a * 2 + ph2) * t) * tk, 0, 1.2);
        if (rdg) {
          const da = wrapA(a + dir - (rdg.at + rdg.turn * (rdg.by ? smoothstep(0, rdg.by, t) : t))) / rdg.w, env = rdg.full ? smoothstep(0.02, 0.09, t) * (1 - smoothstep(0.72, 0.92, t)) : smoothstep(0.0, 0.1, t) * (1 - smoothstep(0.5, 0.82, t)), gs = Math.exp(-da * da);   // full: a torched seam drawn the whole way up the swirl, burnt at its heart
          rr *= 1 + (rdg.amp ?? 0.1) * gs * env * (0.75 + 0.25 * Math.sin(t * 31 + ph1));
          tt = Math.max(tt, env * Math.exp(-da * da * 1.7) * ((rdg.full ? 0.98 : 0.75) + 0.1 * Math.sin(t * 17 + ph2) + 0.05 * Math.sin(t * 43 + ph1)) * Math.min(tk, 1.1));
        }
        pos.push(cx + rr * (ca * nx - sa * sd), cy + rr * (ca * ny), cz + rr * (ca * nz + sa * cd));
        toast.push(tt);
        pull.push(tx, ty, tz);
      }
      if (j > 0) for (let i = 0; i < nr; i++) { const a = (j - 1) * nr + i, b = (j - 1) * nr + (i + 1) % nr, c = a + nr, d = b + nr; idx.push(a, c, b, b, c, d); }
    }
    const al = curl, tip = pos.length / 3;
    pos.push(cx + Math.sin(al) * cd * R * 0.03, cy + Math.cos(al) * R * 0.03, cz + Math.sin(al) * sd * R * 0.03); toast.push(Math.min(1.2, tk)); pull.push(0, 1, 0);
    for (let i = 0; i < nr; i++) idx.push(ns * nr + i, tip, ns * nr + (i + 1) % nr);
    const g = geoFrom(pos, idx, toast, pull); g.userData.tip = new THREE.Vector3(cx, cy, cz); return g;
  };
  // THE SPOONED QUENELLE: a smooth three-sided egg lying along X, one ridge up (the toasted one).
  // o: length, height, width, seg (along), radial, toast, rnd, slump (0..1 sags to one side: the hand does wrong)
  style.quenelleGeometry = (o = {}) => {
    const Ln = o.length ?? 34, H = o.height ?? 15, W = o.width ?? Ln * 0.5, nu = o.seg ?? 28, nr = o.radial ?? 20, tk = o.toast ?? 1, slump = o.slump ?? 0;
    const rnd = o.rnd || (() => 0.5), ph = rnd() * 6.28, sk = (rnd() - 0.5) * 0.3;
    const pos = [], idx = [], toast = [], pull = [];
    for (let j = 0; j <= nu; j++) {
      const u = -1 + 2 * j / nu, us = Math.sin(u * Math.PI / 2), env = Math.pow(Math.max(1 - Math.pow(Math.abs(us), 2.3), 0), 0.5);
      const x = us * Ln * 0.5 * (1 + sk * (1 - us * us));
      for (let i = 0; i < nr; i++) {
        const a = (i / nr) * Math.PI * 2, tri = 1 + 0.17 * Math.cos(3 * (a - Math.PI / 2)) + 0.03 * Math.sin(5 * a + ph + u * 2);
        const cy = Math.sin(a), cz = Math.cos(a);
        const y = env * tri * cy * H * 0.72 + H * 0.28 * env - slump * H * 0.25 * env * Math.max(cz, 0);
        pos.push(x, y, env * tri * cz * W * 0.5 + slump * W * 0.18 * env * (1 - cy));
        toast.push(clamp(smoothstep(0.86, 1.0, cy) * smoothstep(0.25, 0.8, env) * (0.75 + 0.2 * Math.sin(u * 7 + ph)) * tk, 0, 1.2));
        pull.push(1, 0, 0);
      }
      if (j > 0) for (let i = 0; i < nr; i++) { const a = (j - 1) * nr + i, b = (j - 1) * nr + (i + 1) % nr, c = a + nr, d = b + nr; idx.push(a, c, b, b, c, d); }
    }
    return geoFrom(pos, idx, toast, pull);
  };
  // GLASS BUILDER: accumulates caramel tubes (thread, coil, hoop, drip) and lathes (pad, bead) into one geometry.
  // tube(pts [[x,y,z],...], radius number|fn(k 0..1), { radial, dark number|fn, grow number|fn, closed })
  style.glassBuilder = () => {
    const pos = [], nor = [], gg = [], idx = []; const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), P = new THREE.Vector3(), Q = new THREE.Vector3();
    const f = (v, k) => (typeof v === 'function' ? v(k) : v);
    const api = {
      tube(pts, radius, o = {}) {
        const nr = o.radial ?? 5, n = pts.length, base = pos.length / 3, closed = !!o.closed;
        N.set(0.31, 0.9, 0.29);
        for (let j = 0; j < n; j++) {
          const a = pts[closed ? (j - 1 + n) % n : Math.max(j - 1, 0)], b = pts[closed ? (j + 1) % n : Math.min(j + 1, n - 1)];
          T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); if (T.lengthSq() < 1e-12) T.set(0, 1, 0); T.normalize();
          B.crossVectors(T, N); if (B.lengthSq() < 1e-8) B.set(1, 0, 0); B.normalize(); N.crossVectors(B, T).normalize();
          const k = j / (n - 1), r = f(radius, k), dk = f(o.dark ?? 0.5, k), gr = f(o.grow ?? 0, k);
          for (let i = 0; i < nr; i++) {
            const an = (i / nr) * Math.PI * 2, c = Math.cos(an), s = Math.sin(an);
            Q.copy(N).multiplyScalar(c).addScaledVector(B, s);
            pos.push(pts[j][0] + Q.x * r, pts[j][1] + Q.y * r, pts[j][2] + Q.z * r); nor.push(Q.x, Q.y, Q.z); gg.push(dk, gr);
          }
          if (j > 0) for (let i = 0; i < nr; i++) { const a0 = base + (j - 1) * nr + i, b0 = base + (j - 1) * nr + (i + 1) % nr; idx.push(a0, b0, a0 + nr, b0, b0 + nr, a0 + nr); }
        }
        if (closed) for (let i = 0; i < nr; i++) { const a0 = base + (n - 1) * nr + i, b0 = base + (n - 1) * nr + (i + 1) % nr, c0 = base + i, d0 = base + (i + 1) % nr; idx.push(a0, b0, c0, b0, d0, c0); }
        return api;
      },
      // a body of revolution about +Y at centre c: profile [[r, y], ...] from bottom to top (pad, bead, drop)
      lathe(c, profile, o = {}) {
        const nr = o.radial ?? 10, n = profile.length, base = pos.length / 3;
        for (let j = 0; j < n; j++) {
          const p0 = profile[Math.max(j - 1, 0)], p1 = profile[Math.min(j + 1, n - 1)]; let ny = p1[0] - p0[0], nx = -(p1[1] - p0[1]); const l = Math.hypot(nx, ny) || 1; nx /= -l; ny /= -l;
          for (let i = 0; i < nr; i++) {
            const an = (i / nr) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
            pos.push(c[0] + profile[j][0] * cs, c[1] + profile[j][1], c[2] + profile[j][0] * sn); nor.push(nx * cs, ny, nx * sn); gg.push(f(o.dark ?? 0.8, j / (n - 1)), f(o.grow ?? 0, j / (n - 1)));
          }
          if (j > 0) for (let i = 0; i < nr; i++) { const a0 = base + (j - 1) * nr + i, b0 = base + (j - 1) * nr + (i + 1) % nr; idx.push(a0, a0 + nr, b0, b0, a0 + nr, b0 + nr); }
        }
        return api;
      },
      get triangles() { return idx.length / 3; },
      build() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('aG', new THREE.Float32BufferAttribute(gg, 2)); g.setIndex(idx); return g;
      },
    };
    return api;
  };
  addThreadHelpers(style, ctx);
}

function addThreadHelpers(style, ctx) {
  // THREADS: list of { a:[x,y,z] foot, b:[x,y,z] landing, t0 (journey seconds it is thrown; <= -3 = always there),
  // seed 0..1, width m (0.2..0.5), hs height scale (~1), pour: true for a hanging pouring thread from a (top) to b }.
  // Returns a Mesh in the style.thread material (not frustum culled: the shader places it). segs = ribbon segments.
  style.threadGeometry = (list, segs = 48) => {
    const g = new THREE.InstancedBufferGeometry(), pos = [], idx = [];
    for (let j = 0; j <= segs; j++) { pos.push(j / segs, -1, 0, j / segs, 1, 0); if (j > 0) { const a = (j - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const n = list.length, A = new Float32Array(n * 3), B = new Float32Array(n * 3), P = new Float32Array(n * 4);
    list.forEach((t, i) => { A.set(t.a, i * 3); B.set(t.b, i * 3); P.set([t.t0 ?? -10, t.seed ?? 0.5, t.width ?? 0.26, (t.pour ? -1 : 1) * (t.hs ?? 1)], i * 4); });
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3)); g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4); return g;
  };
  style.makeThreads = (list, segs = 48) => { const m = new THREE.Mesh(style.threadGeometry(list, segs), style.thread); m.frustumCulled = false; return m; };
  // where a thrown thread stands once set (JS twin of the shader's arc without wobble): for seating drips and cameras
  style.threadPoint = (t, s, out = new THREE.Vector3()) => {
    const hx = (t.b[0] - t.a[0]) / 2, hy = (t.b[1] - t.a[1]) / 2, hz = (t.b[2] - t.a[2]) / 2, th = Math.PI * s, c = Math.cos(th), env = Math.sin(th), sd = t.seed ?? 0.5;
    const hl = Math.hypot(hx, hz) || 1, hh = style.uniforms.uDome.value * hl * (t.hs ?? 1), tf = 1.25 + s * 1.6;
    const wob = Math.sin(s * 13 + sd * 40 - tf * 6) * 2.2 + Math.sin(s * 29 + sd * 17 + tf * 9) * 0.8;
    return out.set(t.a[0] + hx - hx * c - (hz / hl) * env * wob, t.a[1] + hy - hy * c + hh * env + env * Math.sin(s * 9 + sd * 23 + tf * 5) * 1.4 - env * env * 2.5, t.a[2] + hz - hz * c + (hx / hl) * env * wob);
  };
  // FLOW: the custard's data texture. islands: [{ x, z, r, rf? }] (world metres, r = shore radius; rf(dx, dz) = an
  // uneven shore radius toward (dx, dz), as hero.shore gives for the massif). width = metres covered,
  // centred on (cx, cz). Sets style.uniforms.uFlow / uFlowExt itself and returns the texture. Potential flow of the
  // current (+X by default) round every island; R = distance to the nearest shore / 16 m; A = the lee.
  style.makeFlow = async (islands, o = {}) => {
    const N = o.size ?? 512, Wd = o.width ?? 1200, cx = o.cx ?? 0, cz = o.cz ?? 0, cur = style.uniforms.uCurrent.value, cl = cur.length() || 1;
    const ux = cur.x / cl, uz = cur.y / cl, data = new Uint8Array(N * N * 4), n = islands.length;
    for (let j = 0; j < N; j++) {
      const z = cz + ((j + 0.5) / N - 0.5) * Wd;
      // islands that can reach this row: beyond 6 radii an island changes neither the flow nor the 16 m shore band
      const row = [], lim = []; for (let k = 0; k < n; k++) { const is = islands[k], l = Math.max(is.r * 6, is.r + 17); if (Math.abs(z - is.z) <= l) { row.push(is); lim.push(l); } }
      const nr = row.length;
      for (let i = 0; i < N; i++) {
        const x = cx + ((i + 0.5) / N - 0.5) * Wd; let vx = ux, vz = uz, sh = 1e9, lee = 0;
        for (let k = 0; k < nr; k++) {
          const is = row[k], dx = x - is.x; if (dx > lim[k] || dx < -lim[k]) continue;
          const dz = z - is.z, d2 = dx * dx + dz * dz, rI = is.rf && d2 < is.r * is.r * 4 ? is.rf(dx, dz) : is.r, r2 = rI * rI;
          if (d2 > r2 * 36) { sh = Math.min(sh, Math.sqrt(d2) - rI); continue; }
          const d = Math.sqrt(d2) + 1e-6; sh = Math.min(sh, d - rI);
          const q = Math.min(r2 / d2, 1), ex = dx / d, ez = dz / d, c = ex * ux + ez * uz, s = -ex * uz + ez * ux;   // doublet: -q (cos2t, sin2t) in the current's frame
          const c2 = c * c - s * s, s2 = 2 * c * s; vx -= q * (c2 * ux - s2 * uz); vz -= q * (c2 * uz + s2 * ux);
          if (c > 0.2) lee = Math.max(lee, (c - 0.2) * 1.25 * Math.max(0, 1 - (d - rI) / (rI * 1.6)));
        }
        const o4 = (j * N + i) * 4;
        const c0 = sh / 16, c1 = vx * 0.25 + 0.5, c2 = vz * 0.25 + 0.5;   // (clamped by hand: this loop runs 600,000 times)
        data[o4] = c0 <= 0 ? 0 : c0 >= 1 ? 255 : c0 * 255; data[o4 + 1] = c1 <= 0 ? 0 : c1 >= 1 ? 255 : c1 * 255; data[o4 + 2] = c2 <= 0 ? 0 : c2 >= 1 ? 255 : c2 * 255; data[o4 + 3] = lee <= 0 ? 0 : lee >= 1 ? 255 : lee * 255;
      }
      if (ctx.yield) await ctx.yield();
    }
    const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
    style.uniforms.uFlow.value = tex; style.uniforms.uFlowExt.value.set(cx, cz, 1 / Wd);
    await style.makeShade(islands, o.casters || [], { size: o.shadeSize ?? 512, width: Wd, cx, cz });
    return tex;
  };
  // SHADE: the custard's second data texture, over the same ground as the flow (RG half float, linear).
  // R = the islands' shadows: each caster { x, z, r, h, round? } throws its outline away from the sun, h / tan(elevation)
  //     long (a cone's shadow tapers straight to a point; a round quenelle's is blunt), soft-edged, softer far out.
  // G = metres by which the islands bend the current's stream function, so specks can gather into streamlines that
  //     go round every island (the same doublets as the flow, faded out by 8 radii so nothing jumps).
  style.makeShade = async (islands, casters, o = {}) => {
    const N = o.size ?? 512, Wd = o.width ?? 1200, cx = o.cx ?? 0, cz = o.cz ?? 0, cur = style.uniforms.uCurrent.value, cl = cur.length() || 1;
    const ux = cur.x / cl, uz = cur.y / cl, sun = style.sun, sl = Math.hypot(sun.x, sun.z) || 1, dx0 = -sun.x / sl, dz0 = -sun.z / sl;
    const tanE = Math.max(sun.y / sl, 0.12), data = new Uint16Array(N * N * 2), f32 = new Float32Array(1), u32 = new Uint32Array(f32.buffer);
    const half = (v) => { f32[0] = v; const x = u32[0], e = (x >> 23) & 0xff, sg = (x >> 16) & 0x8000; return e < 113 ? sg : e > 142 ? sg | 0x7bff : sg | ((e - 112) << 10) | ((x >> 13) & 0x3ff); };   // float -> half float (tiny values to 0)
    const cs = casters.map((c) => { const L = Math.min(c.h * Math.min(1 / tanE, c.len ?? 3.6), 900), ex = c.x + dx0 * L, ez = c.z + dz0 * L, pad = c.r + 4 + L * 0.06; return { ...c, L, z0: Math.min(c.z, ez) - pad, z1: Math.max(c.z, ez) + pad, x0: Math.min(c.x, ex) - pad, x1: Math.max(c.x, ex) + pad }; });
    for (let j = 0; j < N; j++) {
      const z = cz + ((j + 0.5) / N - 0.5) * Wd, rowC = cs.filter((c) => z >= c.z0 && z <= c.z1), rowI = islands.filter((is) => Math.abs(z - is.z) <= is.r * 8);
      for (let i = 0; i < N; i++) {
        const x = cx + ((i + 0.5) / N - 0.5) * Wd; let sh = 0, dl = 0;
        for (let k = 0; k < rowC.length; k++) {
          const c = rowC[k]; if (x < c.x0 || x > c.x1) continue;
          const rx = x - c.x, rz = z - c.z, s = rx * dx0 + rz * dz0, l = Math.abs(-rx * dz0 + rz * dx0); let d;
          if (s <= 0) d = Math.sqrt(s * s + l * l) - c.r;
          else if (s >= c.L) d = Math.sqrt((s - c.L) * (s - c.L) + l * l);
          else { const q = s / c.L; d = l - c.r * lerp(1 - q, Math.sqrt(1 - q * q), +c.round || 0); }
          const pen = 1.0 + (s > 0 ? s : 0) * 0.014; if (d >= pen) continue; const v = d <= -pen ? 1 : 0.5 - d / (2 * pen), cov = v * v * (3 - 2 * v) * (1 - 0.35 * (s < 0 ? 0 : s > 500 ? 1 : s / 500));
          if (cov > sh) sh = cov;
        }
        for (let k = 0; k < rowI.length; k++) {
          const is = rowI[k], ddx = x - is.x, lim = is.r * 8; if (ddx > lim || ddx < -lim) continue;
          const ddz = z - is.z, d2 = ddx * ddx + ddz * ddz, r2 = is.r * is.r, d = Math.sqrt(d2); if (d >= lim) continue;
          const e0 = is.r * 4.5, wt = d <= e0 ? 0 : (d - e0) / (lim - e0), w = 1 - wt * wt * (3 - 2 * wt); dl -= (d2 > r2 ? r2 / d2 : 1) * (-ddx * uz + ddz * ux) * w;
        }
        const o2 = (j * N + i) * 2; data[o2] = half(sh); data[o2 + 1] = half(dl);
      }
      if (ctx.yield) await ctx.yield();
    }
    const tex = new THREE.DataTexture(data, N, N, THREE.RGFormat, THREE.HalfFloatType); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
    style.uniforms.uShade.value = tex; return tex;
  };
}

// ---------------------------------------------------------------------------------------------------------------
// THE HERO
const mergeMer = (geos) => {   // merge meringue geometries (position, normal, aToast, aPull; indexed) into one
  let nv = 0, ni = 0; for (const g of geos) { nv += g.attributes.position.count; ni += g.index.count; }
  const P = new Float32Array(nv * 3), Nn = new Float32Array(nv * 3), T = new Float32Array(nv), Pl = new Float32Array(nv * 3), I = new Uint32Array(ni), Sh = geos[0].attributes.aShade ? new Float32Array(nv) : null;
  let vo = 0, io = 0;
  for (const g of geos) {
    P.set(g.attributes.position.array, vo * 3); Nn.set(g.attributes.normal.array, vo * 3); T.set(g.attributes.aToast.array, vo); Pl.set(g.attributes.aPull.array, vo * 3);
    if (Sh && g.attributes.aShade) Sh.set(g.attributes.aShade.array, vo);
    const ix = g.index.array; for (let k = 0; k < ix.length; k++) I[io + k] = ix[k] + vo;
    vo += g.attributes.position.count; io += ix.length; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('normal', new THREE.BufferAttribute(Nn, 3));
  out.setAttribute('aToast', new THREE.BufferAttribute(T, 1)); out.setAttribute('aPull', new THREE.BufferAttribute(Pl, 3)); out.setIndex(new THREE.BufferAttribute(I, 1));
  if (Sh) out.setAttribute('aShade', new THREE.BufferAttribute(Sh, 1));
  return out;
};

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('sugar-cage') : ctx.rng, noise = ctx.noise, Y = async () => { if (ctx.yield) await ctx.yield(); };
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const ownStyle = !opts.style, style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const U = style.uniforms, root = new THREE.Group(); root.name = 'sugar-cage';
  const duration = opts.duration ?? 42, rotY = opts.rotationY ?? 0;
  // the sun in hero space (the world turns the hero by rotationY about Y)
  const sunL = style.sun.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), -rotY);
  const cageKind = opts.cage || 'dome';   // seeded variations may come later; the dome is the piece

  // ---- the massif: a ring ridge round a high hollow, parted in front (+Z) by the spoon-drag valley
  const p1 = rng.range(0, 6.28), p2 = rng.range(0, 6.28), p3 = rng.range(0, 6.28), ridgeR = 78, floorLo = 44, floorHi = 52;
  const shoreR = (ph) => 126 + 7 * Math.sin(3 * ph + p1) + 4.5 * Math.sin(5 * ph + p2);
  const valleyY = (z) => -2 + (132 - z) * 0.467;
  const hollowY = (z) => floorLo + (floorHi - floorLo) * smoothstep(42, -20, z);
  const heightAt0 = (x, z) => {
    const r = Math.hypot(x, z), ph = Math.atan2(x, z), sr = shoreR(ph);
    const ridge = 59 - 13 * Math.cos(7 * ph) + 4 * Math.sin(2 * ph + p3);
    let h;
    if (r > ridgeR) { const q = (r - ridgeR) / (sr - ridgeR); h = q < 1 ? ridge * Math.pow(1 - Math.pow(q, 1.8), 0.9) : -6 * smoothstep(1, 1.12, q) - 0.5; }
    else { const fl = hollowY(z); h = fl + (ridge - fl) * smoothstep(36, ridgeR, r) ** 1.4; }
    h += (noise.fbm2(x * 0.02 + 9, z * 0.02 - 4, 3)) * 2.2 * smoothstep(-2, 12, h);
    if (z > 18) {                                   // the spoon went up here: a U 30 m wide
      const vf = z > 42 ? valleyY(z) : lerp(hollowY(z), valleyY(42), smoothstep(18, 42, z));
      const w = (1 - smoothstep(8, 27, Math.abs(x + 2.5 * Math.sin(z * 0.045 + p1)))) * smoothstep(18, 40, z);
      h = lerp(h, Math.min(h, vf), w);
    }
    return h;
  };
  // seven curled peaks on the ridge; the tallest at the back, one scorched, the curls all thrown the same way round.
  // SPOONED, NOT SET DOWN: each peak's lower third is part of the massif's own surface. The height field rises into
  // the peak along the peak's own lumpy outline (cones[] keeps that outline, ring by ring), with a soft fillet where
  // it meets the ridge and the valley, and the cone's lowest rings are drawn in under it, so no rim, ledge or corner
  // shows anywhere: the cone only comes out of the field a third of the way up, where both lie the same way.
  const peaks = [], geos = [], cones = [], tall = rng.int(2, 4), scorched = rng.int(0, 6), turn = rng.chance(0.5) ? 1 : -1, PNR = 32, PNS = 22;
  for (let k = 0; k < 7; k++) {
    const front = k === 0 || k === 6, ph = (k + 0.5) * (Math.PI * 2 / 7) + (front ? (k === 0 ? 0.09 : -0.09) : rng.range(-0.07, 0.07));
    const rr = ridgeR + (front ? 3 : rng.range(-5, 6)), x = Math.sin(ph) * rr, z = Math.cos(ph) * rr, base = heightAt0(x, z);
    const total = k === tall ? 134 : front ? rng.range(104, 118) : rng.range(98, 126), y0 = base * 0.42, hgt = total - y0, rad = clamp(hgt * rng.range(0.34, 0.39), 30, 40);
    const g = style.peakGeometry({ height: hgt, radius: rad, curl: rng.range(2.4, 3.6), dir: -ph + (turn < 0 ? Math.PI : 0) + turn * rng.range(-0.9, 0.4),
      radial: PNR, rings: PNS, wob: 1, rnd: rng, toast: k === scorched ? 1.6 : rng.range(0.85, 1.1), sink: 0, bulge: 0 });
    g.translate(x, y0, z);
    await Y();
    const P = g.attributes.position.array, cone = { x, z, th0: Math.atan2(P[2] - z, P[0] - x), y: [], r: [], f: [], rmax: 0 };
    for (let j = 0; j <= 7; j++) {                      // the outline up to 48% of the spine (it is still upright there)
      const t = 1 - Math.pow(1 - j / PNS, 1.7), rj = new Float32Array(PNR); let ym = 0;
      for (let i = 0; i < PNR; i++) { const o = (j * PNR + i) * 3; rj[i] = Math.hypot(P[o] - x, P[o + 2] - z); ym += P[o + 1] / PNR; cone.rmax = Math.max(cone.rmax, rj[i]); }
      cone.y.push(ym); cone.r.push(rj); cone.f.push(lerp(1.0, 0.9, smoothstep(0.26, 0.5, t)));
      const fc = lerp(0.78, 1, smoothstep(0.06, 0.36, t));   // the cone's own low rings are drawn in under the field
      if (fc < 0.9995) for (let i = 0; i < PNR; i++) { const o = (j * PNR + i) * 3; P[o] = x + (P[o] - x) * fc; P[o + 2] = z + (P[o + 2] - z) * fc; }
    }
    g.computeVertexNormals(); cones.push(cone);
    geos.push(g); peaks.push({ x, z, base, height: hgt, top: total, radius: rad * 0.8 });
    await Y();
  }
  const coneY = (c, dx, dz, d) => {                     // height of a peak's outline over (dx, dz) from its axis; a flared skirt beyond its foot, a hidden shelf inside
    let fi = (Math.atan2(dz, dx) - c.th0) / (Math.PI * 2); fi = (fi - Math.floor(fi)) * PNR; const i0 = Math.floor(fi) % PNR, i1 = (i0 + 1) % PNR, w = fi - Math.floor(fi);
    let Ra = lerp(c.r[0][i0], c.r[0][i1], w) * c.f[0];
    if (d >= Ra) return c.y[0] - (d - Ra) * 1.9;
    for (let j = 1; j < c.y.length; j++) { const Rb = lerp(c.r[j][i0], c.r[j][i1], w) * c.f[j]; if (d >= Rb) return lerp(c.y[j - 1], c.y[j], (Ra - d) / Math.max(Ra - Rb, 1e-3)); Ra = Rb; }
    return c.y[c.y.length - 1];
  };
  const heightAt = (x, z) => {
    const h0 = heightAt0(x, z); let h = h0;
    for (const c of cones) {
      const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz); if (d > c.rmax + 12) continue;
      const cy = coneY(c, dx, dz, d), q = Math.max(7 - Math.abs(h - cy), 0) / 7; h = Math.max(h, cy) + q * q * 1.75;
    }
    // the spoon's course up the valley stays as it was drawn: no peak leans into the 6.5 m corridor
    return h0 + (h - h0) * (1 - (1 - smoothstep(4, 11, Math.abs(x))) * smoothstep(18, 34, z));
  };
  const NG = 124, EXT = 140, cell = (2 * EXT) / NG, hs = new Float32Array((NG + 1) * (NG + 1)), hsB = new Float32Array((NG + 1) * (NG + 1));
  for (let j = 0; j <= NG; j++) { for (let i = 0; i <= NG; i++) { hs[j * (NG + 1) + i] = heightAt0(-EXT + i * cell, -EXT + j * cell); hsB[j * (NG + 1) + i] = heightAt(-EXT + i * cell, -EXT + j * cell); } await Y(); }
  const H = (i, j) => hs[clamp(j, 0, NG) * (NG + 1) + clamp(i, 0, NG)];
  const pos = [], toast = [], pull = [], idx = [], vid = new Int32Array((NG + 1) * (NG + 1)).fill(-1);
  for (let j = 0; j <= NG; j++) {
    for (let i = 0; i <= NG; i++) {
      const x = -EXT + i * cell, z = -EXT + j * cell, h = H(i, j), r = Math.hypot(x, z);
      if (r > shoreR(Math.atan2(x, z)) * 1.12 + cell * 1.5) continue;
      const hb = hsB[j * (NG + 1) + i]; vid[j * (NG + 1) + i] = pos.length / 3; pos.push(x, hb, z);
      const cv = h - (H(i - 3, j) + H(i + 3, j) + H(i, j - 3) + H(i, j + 3) + H(i - 2, j - 2) + H(i + 2, j + 2) + H(i - 2, j + 2) + H(i + 2, j - 2)) / 8;   // ridges are convex
      toast.push(clamp(smoothstep(1.3, 4.2, cv) * 0.66 * smoothstep(20, 40, h) * (z > 14 ? smoothstep(22, 40, Math.abs(x)) : 1) * (1 - smoothstep(0.6, 2.6, hb - h)), 0, 1));
      const inV = (1 - smoothstep(14, 30, Math.abs(x))) * smoothstep(10, 30, z) + (1 - smoothstep(30, 60, r)), k = clamp(inV, 0, 1), rr = r || 1;
      const px = (x / rr) * 0.45 * (1 - k), py = 1 - k, pz = (z / rr) * 0.45 * (1 - k) + k, pl = Math.hypot(px, py, pz) || 1; pull.push(px / pl, py / pl, pz / pl);
    }
    if (j % 8 === 7) await Y();
  }
  await Y();
  for (let j = 0; j < NG; j++) for (let i = 0; i < NG; i++) {
    const a = vid[j * (NG + 1) + i], b = vid[j * (NG + 1) + i + 1], c = vid[(j + 1) * (NG + 1) + i], d = vid[(j + 1) * (NG + 1) + i + 1];
    if (a < 0 || b < 0 || c < 0 || d < 0) continue; idx.push(a, c, b, b, c, d);
  }
  await Y();
  const field = new THREE.BufferGeometry();
  field.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); field.setAttribute('aToast', new THREE.Float32BufferAttribute(toast, 1));
  field.setAttribute('aPull', new THREE.Float32BufferAttribute(pull, 3)); field.setIndex(idx); field.computeVertexNormals(); geos.push(field);
  await Y();
  // ---- the peaks' shadows on the massif: each vertex looks toward the sun (drawn at 42 degrees, so the shadows lie
  // as wedges across the hollow and the valley and the sun still comes in between the peaks) over the height field
  // and the seven cones. A soft edge that widens with distance. Kisses take the shade of where they stand.
  const sH = Math.hypot(sunL.x, sunL.z) || 1, sdx = sunL.x / sH, sdz = sunL.z / sH, tanS = 0.9, NG1 = NG + 1;
  const hB = (x, z) => { const fx = (x + EXT) / cell, fz = (z + EXT) / cell; if (fx < 0 || fz < 0 || fx >= NG || fz >= NG) return -5; const i = fx | 0, j = fz | 0, a = fx - i, b = fz - j, o = j * NG1 + i; return (hsB[o] * (1 - a) + hsB[o + 1] * a) * (1 - b) + (hsB[o + NG1] * (1 - a) + hsB[o + NG1 + 1] * a) * b; };
  const pkS = peaks.map((q) => ({ x: q.x, z: q.z, y0: q.top - q.height, h: q.height, R: q.radius / 0.8 }));
  const shadeAt = (x, y, z) => {
    let m = 1;
    for (let d = 5; d < 190; d += 3.5) {
      const px = x + sdx * d, pz = z + sdz * d, py = y + d * tanS; if (py > 138) break;
      let h = hB(px, pz);
      for (let k = 0; k < 7; k++) { const q = pkS[k], ex = px - q.x, ez = pz - q.z, e2 = ex * ex + ez * ez; if (e2 < q.R * q.R) { const hh = q.y0 + q.h * (1 - Math.pow(Math.sqrt(e2) / q.R, 0.77)); if (hh > h) h = hh; } }
      const v = (py - h) / (1.5 + d * 0.07); if (v < m) { m = v; if (m <= 0) break; }
    }
    // (authored: the sun is let into the nave. The valley wall that faces it stands in light beside the climb, so it can be barred with amber)
    const fx = -x * sdx, relief = smoothstep(3, 9, fx) * (1 - smoothstep(40, 62, fx)) * smoothstep(22, 40, z) * (1 - smoothstep(120, 138, z));
    return (1 - smoothstep(0, 1, m)) * (1 - 0.85 * relief);
  };
  for (const g of geos) {
    const P = g.attributes.position.array, n = P.length / 3, sh = new Float32Array(n);
    for (let i = 0; i < n; i++) { sh[i] = P[i * 3 + 1] < -1 ? 0 : shadeAt(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); if (i % 600 === 599) await Y(); }
    g.setAttribute('aShade', new THREE.BufferAttribute(sh, 1));
  }
  U.uSauce.value.set(p1, opts.sauce ?? 1, 0, 0);
  const massif = new THREE.Mesh(mergeMer(geos), style.meringue({ coat: 1.2, massif: true })); massif.name = 'massif'; root.add(massif);
  await Y();

  // ---- the camera line the piece is built round (hero space): in over the custard, between the gate feet, up the valley, across the hollow, through the ring
  const ringC = new THREE.Vector3(0, 62, -18), pourAt = new THREE.Vector3(rng.range(16, 26) * (rng.chance(0.5) ? 1 : -1), 0, rng.range(-46, -36)); pourAt.y = heightAt(pourAt.x, pourAt.z);
  const fly = [[0, 3, 330], [0, 3, 240], [0, 5, 172], [0, 8, 134], [0, 31, 90], [0, 55, 44], [0, 58.5, 13], [0, 62, -18]].map((p) => new THREE.Vector3(...p));
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3();
  const flyDist = (x, y, z) => { let m = 1e9; _c.set(x, y, z); for (let i = 0; i < fly.length - 1; i++) { _a.subVectors(fly[i + 1], fly[i]); const t = clamp(_b.subVectors(_c, fly[i]).dot(_a) / _a.lengthSq(), 0, 1); m = Math.min(m, _b.copy(fly[i]).addScaledVector(_a, t).distanceTo(_c)); } return m; };

  // ---- kisses: little pulled peaks standing on the slopes like tussocks, thickest beside the climb
  // The kiss is a PIPED TEARDROP: a round fat foot drawn up into a neck and a hooked tip toasted gold then chestnut. Two
  // moulds: a fine one (170 triangles, no facet at 6 m) for those beside the climb, a coarse one (66) for the rest.
  const nKiss = Math.round((opts.kisses ?? 700) * detail), PULL = [-15, 66];   // PULL: where the peak is pulled out of the left wall
  const kissProf = (t) => (0.74 * (1 - smoothstep(0.04, 0.56, t)) + 0.26 * Math.pow(1 - t, 0.75)) * (1 - 0.22 * (1 - smoothstep(0, 0.13, t)));
  const kissO = { height: 1, radius: 0.52, curl: 2.9, dir: 0, toast: 1.45, toastFrom: 0.4, sink: 0.1, prof: kissProf };   // every kiss carries a torched hook: the dark accent of the high ground
  const kissFine = style.peakGeometry({ ...kissO, radial: 10, rings: 8 }), kissCoarse = style.peakGeometry({ ...kissO, radial: 6, rings: 5 });
  const kissMat = style.meringue({ instanced: true, coat: -1e3 });
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), S = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), nrm = new THREE.Vector3();
  const kNear = [], kFar = []; let placed = 0;
  for (let tries = 0; placed < nKiss && tries < nKiss * 14; tries++) {
    if (tries % 40 === 39) await Y();
    const zone = rng(); let x, z;
    if (zone < 0.58) { x = rng.range(7, 36) * (rng.chance(0.5) ? 1 : -1); z = rng.range(24, 134); }
    else if (zone < 0.78) { const a = rng.range(0, 6.283), r = rng.range(14, 72); x = Math.sin(a) * r; z = Math.cos(a) * r; }
    else { const a = rng.range(0, 6.283), r = rng.range(60, 124); x = Math.sin(a) * r; z = Math.cos(a) * r; }
    let sc = rng.range(1, 3) * (rng.chance(0.08) ? 1.5 : 1); const yaw = rng.range(0, 6.283), sq = rng.range(0.8, 1.25), sd = rng();
    const h = heightAt0(x, z); if (h < 3) continue;
    nrm.set(heightAt0(x - 0.8, z) - heightAt0(x + 0.8, z), 1.6, heightAt0(x, z - 0.8) - heightAt0(x, z + 0.8)).normalize(); if (nrm.y < 0.5) continue;
    let fd = flyDist(x, h + sc * 0.6, z); if (fd < 16) { sc = Math.max(sc, 1.9 + sd * 1.1); fd = flyDist(x, h + sc * 0.6, z); }   // the ones we nearly touch are the big ones
    if (fd < 6.5 + sc * 0.5 || Math.hypot(x - ringC.x, z - ringC.z) < 11 || Math.hypot(x - pourAt.x, z - pourAt.z) < 7) continue;
    let inPeak = false; for (const p of peaks) if (Math.hypot(x - p.x, z - p.z) < p.radius * 0.95) inPeak = true; if (inPeak) continue;
    nrm.lerp(up, 0.8).normalize(); Q.setFromUnitVectors(up, nrm); Q2.setFromAxisAngle(up, yaw); Q.multiply(Q2);
    const hN = heightAt(x, z); placed++;
    let inside = false; for (const c of cones) { const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz); if (d < c.rmax + 2 && coneY(c, dx, dz, d) > h + sc) inside = true; }
    if (inside || Math.hypot(x - PULL[0], z - PULL[1]) < 5) continue;   // this one stood wholly inside a peak's foot and was never seen: it stays unseen (and none stands where the peak is pulled)
    M.compose(_a.set(x, hN - 0.05, z), Q, S.set(sc * sq, sc, sc * sq)); (fd < 19 ? kNear : kFar).push({ m: M.clone(), sd, sh: shadeAt(x, hN + sc * 0.6, z), x, z, y: hN, sc });
    if (tries % 60 === 59) await Y();
  }
  // and on the valley's WALLS (the massif's own steep slopes and the flanks of the two front peaks), where the scatter
  // above finds nothing to stand on: on a generator of their own (so nothing else of the piece moves), just outside the
  // corridor on both sides of the climb. On a wall a kiss is piped OUT of it: it leans with the slope and stands clear.
  const kWall = [];
  { let st = 0x9e3779b9; const wr = () => { st = (st + 0x6d2b79f5) | 0; let t = Math.imul(st ^ (st >>> 15), 1 | st); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const prior = [...kNear, ...kFar], wn = new THREE.Vector3();
    for (let i = 0, got = 0; i < 7000 && got < Math.round(185 * detail); i++) {
      if (i % 40 === 39) await Y();
      const x = (6 + wr() * 20) * (wr() < 0.5 ? 1 : -1), z = 34 + wr() * 96, sc = 1.3 + wr() * 1.25, yaw = wr() * 6.283, sq = 0.9 + wr() * 0.25, sd = wr();
      const hN = heightAt(x, z); if (hN < 3) continue;
      wn.set(heightAt(x - 0.8, z) - heightAt(x + 0.8, z), 1.6, heightAt(x, z - 0.8) - heightAt(x, z + 0.8)).normalize(); if (wn.y >= 0.62 || wn.y < 0.2) continue;
      if (wn.y >= 0.5 && hN < heightAt0(x, z) + 0.5) continue;                       // (a gentle slope of the massif itself: the scatter above has it)
      const fd = flyDist(x + wn.x * sc * 0.6, hN + sc * 0.5, z + wn.z * sc * 0.6); if (fd < 6.3 + sc * 0.55 || fd > 30 || Math.hypot(x - PULL[0], z - PULL[1]) < 5.5) continue;
      let hit = false; for (const k of prior) if (Math.abs(k.x - x) < 2.6 && Math.abs(k.z - z) < 2.6) { hit = true; break; } if (hit) continue;
      nrm.copy(wn).lerp(up, 0.4).normalize(); Q.setFromUnitVectors(up, nrm); Q2.setFromAxisAngle(up, yaw); Q.multiply(Q2);
      const o = sc * 0.12; M.compose(_a.set(x + wn.x * o - nrm.x * sc * 0.14, hN + wn.y * o - nrm.y * sc * 0.14, z + wn.z * o - nrm.z * sc * 0.14), Q, S.set(sc * sq, sc, sc * sq));
      const k = { m: M.clone(), sd, sh: shadeAt(x + wn.x * 1.5, hN + sc * 0.6, z + wn.z * 1.5), x, z, y: hN, sc, wall: 1 }; kWall.push(k); prior.push(k); got++;
    }
    await Y(); }
  for (const k of kWall) kNear.push(k);   // (the fine mould: they stand beside the lens)
  for (const [list, geo, name] of [[kNear, kissFine, 'kisses-near'], [kFar, kissCoarse, 'kisses']]) {
    const n = Math.max(list.length, 1), im = new THREE.InstancedMesh(geo, kissMat, n), bob = new Float32Array(n * 4);
    list.forEach((k, i) => { im.setMatrixAt(i, k.m); bob[i * 4] = k.sd; bob[i * 4 + 2] = 1 + k.sh * 0.999; });
    im.count = list.length; geo.setAttribute('aBob', new THREE.InstancedBufferAttribute(bob, 4)); im.instanceMatrix.needsUpdate = true; im.frustumCulled = false; im.name = name; root.add(im);
  }
  // every kiss lays a soft lilac shadow on the slope, away from the sun: it is what stands them on the ground
  { const all = [...kNear, ...kFar], n = Math.max(all.length, 1), sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute([-0.25, 0, -0.5, 1, 0, -0.5, 1, 0, 0.5, -0.25, 0, 0.5], 3)); sg.setIndex([0, 2, 1, 0, 3, 2]);
    const im = new THREE.InstancedMesh(sg, style.shadowBlob(), n), str = new Float32Array(n), X = new THREE.Vector3(), Yv = new THREE.Vector3(), Z = new THREE.Vector3();
    all.forEach((k, i) => {
      Yv.set(heightAt(k.x - 0.9, k.z) - heightAt(k.x + 0.9, k.z), 1.8, heightAt(k.x, k.z - 0.9) - heightAt(k.x, k.z + 0.9)).normalize();
      X.set(-sdx, 0, -sdz); X.addScaledVector(Yv, -X.dot(Yv)).normalize(); Z.crossVectors(X, Yv);
      M.makeBasis(X.multiplyScalar(k.sc * (k.wall ? 1.25 : 2.2)), Yv, Z.multiplyScalar(k.sc * (k.wall ? 0.95 : 1.1))); M.setPosition(k.x + Yv.x * 0.14, k.y + 0.05 + Yv.y * 0.14, k.z + Yv.z * 0.14);
      im.setMatrixAt(i, M); str[i] = (1 - 0.7 * k.sh) * (k.wall ? 0.6 : 1);
    });
    im.count = all.length; sg.setAttribute('aStr', new THREE.InstancedBufferAttribute(str, 1)); im.frustumCulled = false; im.renderOrder = 1; im.name = 'kiss-shadows'; root.add(im);
    await Y(); }
  root.userData.kissCounts = [kNear.length, kFar.length, kWall.length];
  await Y();

  // ---- the cage: skeins of six to ten threads sharing a foot, landing in clusters at other feet, so it has ribs and windows
  const NF = 36, feet = [], FR = () => rng.range(150, 162);
  feet.push({ a: 0.0533, r: 150.5 }, { a: -0.0533, r: 150.5 });               // the gate: two feet 16 m apart astride the course
  for (let k = 0; k < NF - 2; k++) feet.push({ a: 0.2 + (k + 0.5 + rng.range(-0.3, 0.3)) * ((Math.PI * 2 - 0.4) / (NF - 2)), r: FR() });
  for (const f of feet) { f.x = Math.sin(f.a) * f.r; f.z = Math.cos(f.a) * f.r; f.sun = (f.x * sunL.x + f.z * sunL.z) / f.r; f.n = 0; }
  const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a)), skeins = [];
  const nearestFoot = (ang) => { let b = 0, bd = 9; feet.forEach((f, i) => { const d = Math.abs(wrap(f.a - ang)); if (d < bd) { bd = d; b = i; } }); return b; };
  for (let k = 0; k < NF; k++) {
    const f = feet[k], n = rng.int(6, 10), th = [], crown = k >= NF - 1 ? 2 : k >= NF - 4 ? 1 : 0;     // the last skeins close the crown
    const side = (k < 2 ? (k === 0 ? 1 : -1) : rng.chance(0.5) ? 1 : -1), nCl = crown === 2 ? 1 : rng.chance(0.45) ? 2 : 1;
    // a skein is two or three dark RIBS (thick, landing close together) in a fan of pale HAIRS that spread as they rise
    const nRib = n >= 9 ? 3 : 2, nAll = n + 4;
    for (let c = 0, made = 0; c < nCl; c++) {
      const off = crown === 2 ? rng.range(-0.1, 0.1) : crown === 1 ? side * rng.range(0.22, 0.5) : side * rng.range(0.55, 1.75) * (c === 1 ? -0.8 : 1);
      const tf = feet[nearestFoot(f.a + Math.PI + off)], m = c === nCl - 1 ? nAll - made : Math.ceil(nAll / nCl);
      for (let i = 0; i < m; i++) {
        const rib = made + i < nRib, sp = rib ? 0.018 : 0.085, la = tf.a + rng.range(-sp, sp), lr = tf.r + (rib ? rng.range(-2.5, 3) : rng.range(-5, 6)), ft = rib ? 1.0 : 1.9;
        th.push({ a: [f.x + rng.range(-ft, ft), -0.4, f.z + rng.range(-ft, ft)], b: [Math.sin(la) * lr, -0.4, Math.cos(la) * lr], seed: rng(),
          width: rib ? (made + i === 0 ? rng.range(0.27, 0.31) : rng.range(0.17, 0.23)) : rng.range(0.03, 0.065), hs: rib ? rng.range(0.975, 1.04) : rng.range(0.925, 1.075), foot: k, land: feet.indexOf(tf), rib });
      }
      made += m;
    }
    const fx = f.x, fz = f.z; let mm = 0; for (const t of th) { const dx = t.b[0] - fx, dz = t.b[2] - fz, l = Math.hypot(dx, dz) || 1; mm += Math.abs(fx * dz - fz * dx) / l; }
    skeins.push({ th, key: crown * 10 + (1 - mm / th.length / 150) * 0.5 + (0.5 - 0.5 * f.sun) * 0.6 + rng.range(0, 0.25) + (k < 2 ? -0.35 : 0) });
  }
  skeins.sort((a, b) => a.key - b.key);
  const threads = []; for (const s of skeins) for (const t of s.th) threads.push(t);
  // no thread lands in the lane of the course. The gate's two feet stand astride it (it runs along x = 0 through the ring), and a
  // hair sent to a gate foot is dealt some 13 m to either side of that foot, so some came down on the course's own line and
  // stood across the lens as bars. A landing on the gate's side of the massif (z over 0: the course is nowhere else on that line)
  // nearer than 3 m to the line is moved off to its own side by the least distance, and by up to a metre more from the thread's
  // own seed (so those moved stand in a band a metre wide, not on one line). Nothing is dealt again or left out.
  for (const t of threads) if (t.b[2] > 0 && Math.abs(t.b[0]) < 3) t.b[0] = (t.b[0] < 0 ? -1 : 1) * (3 + ((t.seed * 7.31) % 1));
  const NT = threads.length, CNT = [[0, 0.14], [16, 0.367], [25, 0.667], [31, 0.867], [37, 1]];   // share of the cage standing at each journey second
  const countAt = (js) => { if (js <= 0) return CNT[0][1]; for (let i = 1; i < CNT.length; i++) if (js <= CNT[i][0]) return lerp(CNT[i - 1][1], CNT[i][1], (js - CNT[i - 1][0]) / (CNT[i][0] - CNT[i - 1][0])); return 1; };
  threads.forEach((t, i) => {
    const q = (i + 0.5) / NT; let ts = -10;
    if (q > CNT[0][1]) for (let c = 1; c < CNT.length; c++) if (q <= CNT[c][1]) { ts = lerp(CNT[c - 1][0], CNT[c][0], (q - CNT[c - 1][1]) / (CNT[c][1] - CNT[c - 1][1])); break; }
    if (i >= NT - 8) ts = Math.max(ts, 37 - 1.25 - (NT - 1 - i) * 0.14);     // the last skein lands at 37 s
    t.t0 = ts - 1.25; feet[t.foot].n++; feet[t.land].n++;
  });
  const pour = { a: [pourAt.x, 420, pourAt.z], b: [pourAt.x, pourAt.y + 1.6, pourAt.z], seed: rng(), width: 0.3, pour: true };
  const cage = style.makeThreads([...threads, pour], 36); cage.name = 'cage'; cage.renderOrder = 2; root.add(cage);
  await Y();

  // ---- thick glass: a pooled pad and a rope coil at every foot, the exit hoop, drips and their beads, one broken strand
  const GB = style.glassBuilder(), helix = (cx, cy, cz, r0, r1, turns, rise, per, tiltX = 0, tiltZ = 0) => {
    const pts = [], n = Math.round(turns * per);
    for (let i = 0; i <= n; i++) { const k = i / n, a = k * turns * 6.283, r = lerp(r0, r1, k), y = k * rise; pts.push([cx + Math.cos(a) * r + y * tiltX, cy + y, cz + Math.sin(a) * r + y * tiltZ]); }
    return pts;
  };
  feet.forEach((f, k) => {
    if (!f.n) return;
    const R = 2.6 + Math.min(f.n, 14) * 0.2 + rng.range(0, 0.8);
    GB.lathe([f.x, 0, f.z], [[0, -0.5], [R * 0.75, -0.5], [R, -0.1], [R * 0.92, 0.3], [R * 0.55, 0.62], [R * 0.25, 1.0], [0.5, 1.9], [0, 2.0]], { radial: 14, dark: (q) => 1 - 0.5 * q });
    const cr = R * rng.range(0.5, 0.7), tr = rng.range(0.2, 0.3), topple = k > 1 && rng.chance(0.12);
    if (topple) { const a = rng.range(0, 6.28); GB.tube(helix(f.x + Math.cos(a) * R * 1.1, 0.3, f.z + Math.sin(a) * R * 1.1, cr * 0.7, cr * 0.6, 2.2, 0.5, 14, Math.cos(a) * 3.2, Math.sin(a) * 3.2), tr, { radial: 4, dark: 0.55 }); }
    else GB.tube(helix(f.x, 0.55, f.z, cr, cr * 0.55, rng.range(1.8, 2.6), rng.range(1.0, 1.8), 14), tr, { radial: 4, dark: (q) => 0.7 - 0.3 * q });
  });
  await Y();
  // the hoop: pulled caramel with a 14 m opening, dark at its foot and pale at its crown, a thinner strand wound round it
  const rn = new THREE.Vector3(0, -7, 62).normalize(), ru = new THREE.Vector3(0, 1, 0).addScaledVector(rn, -rn.y).normalize(), rx = new THREE.Vector3().crossVectors(ru, rn);
  const hoop = [], wound = [], hp = rng.range(0, 6.28);
  for (let i = 0; i < 72; i++) { const a = (i / 72) * 6.283, rr = 7.85 + 0.2 * Math.sin(a * 3 + hp); hoop.push(_a.copy(ringC).addScaledVector(rx, Math.cos(a) * rr).addScaledVector(ru, Math.sin(a) * rr).toArray()); }
  for (let i = 0; i <= 150; i++) { const a = (i / 150) * 6.283 * 0.92 + 3.6, b = (i / 150) * 6.283 * 7, rr = 7.9 + Math.cos(b) * 0.82; _a.copy(ringC).addScaledVector(rx, Math.cos(a) * rr).addScaledVector(ru, Math.sin(a) * rr).addScaledVector(rn, Math.sin(b) * 0.82); wound.push(_a.toArray()); }
  const hoopDark = (k) => 0.45 - 1.05 * Math.sin(k * 6.283);   // the crown pulled thin and pale (below 0), the foot pooled dark (above 1)
  GB.tube(hoop, (k) => 0.64 - 0.2 * Math.sin(k * 6.283) + 0.07 * Math.sin(k * 31 + hp), { radial: 10, closed: true, dark: hoopDark });
  GB.tube(wound, 0.26, { radial: 4, dark: (k) => 0.4 - 0.8 * Math.sin(k * 6.283 * 0.92 + 3.6) });
  const ringFootY = heightAt(ringC.x, ringC.z);
  // the hoop stands on what a thread does when it lands: a rope coil stacked up to it, and three strands that ran down and set
  const hb = _a.copy(ringC).addScaledVector(ru, -7.85).toArray(), coilH = Math.max(hb[1] - ringFootY, 1);
  GB.tube(helix(hb[0], ringFootY - 0.3, hb[2], 3.3, 1.0, 5.2, coilH + 0.4, 14), (k) => 0.42 - 0.12 * k, { radial: 6, dark: (k) => 0.95 - 0.35 * k });
  for (const [dx, dz, w] of [[-4.2, 1.6, 0.2], [3.6, 2.4, 0.17], [1.2, -3.4, 0.15]]) { const fy = heightAt(hb[0] + dx, hb[2] + dz) - 0.2; GB.tube([[hb[0] + dx * 0.12, hb[1] + 0.2, hb[2] + dz * 0.12], [hb[0] + dx * 0.45, hb[1] - coilH * 0.45, hb[2] + dz * 0.45], [hb[0] + dx * 0.85, fy + 0.5, hb[2] + dz * 0.85], [hb[0] + dx * 1.25, fy, hb[2] + dz * 1.25]], (k) => w * (1 + 0.6 * k), { radial: 5, dark: 0.7 }); }
  await Y();
  // drips: strands 2 to 9 m long ending in a bead, hung on threads that already stand, some from the hoop
  const drip = (x, y, z, L, r) => {
    GB.tube([[x, y, z], [x, y - L * 0.35, z], [x, y - L * 0.7, z], [x, y - L, z]], (k) => r * (1 - 0.55 * k), { radial: 4, dark: 0.3, grow: (k) => -k * L });
    const br = r * rng.range(2.6, 3.8); GB.lathe([x, y - L - br * 1.5, z], [[0, 0], [br * 0.7, br * 0.3], [br, br * 0.9], [br * 0.75, br * 1.5], [br * 0.3, br * 2.2], [r * 0.5, br * 2.9]], { radial: 7, dark: 0.75, grow: -L });
  };
  const standing = threads.filter((t) => t.t0 < -5), nDrip = Math.round(34 * detail);
  for (let i = 0; i < nDrip && standing.length; i++) { const t = rng.pick(standing), s = rng.chance(0.5) ? rng.range(0.05, 0.3) : rng.range(0.7, 0.95); style.threadPoint(t, s, _b); drip(_b.x, _b.y, _b.z, rng.range(2, 9), rng.range(0.13, 0.2)); }
  for (const a of [3.75, 5.6]) { const rr = 7.85; _b.copy(ringC).addScaledVector(rx, Math.cos(a) * rr).addScaledVector(ru, Math.sin(a) * rr); drip(_b.x, _b.y - 0.5, _b.z, rng.range(1.2, 2.2), 0.14); }
  await Y();
  // the broken strand: thrown from beside the gate, it snapped a third of the way up and hangs
  const bk = { a: [Math.sin(0.19) * 153, -0.4, Math.cos(0.19) * 153], b: [Math.sin(3.6) * 155, -0.4, Math.cos(3.6) * 155], seed: rng(), hs: 1 }, bpts = [], bEnd = rng.range(0.24, 0.3);
  for (let i = 0; i <= 26; i++) bpts.push(style.threadPoint(bk, (i / 26) * bEnd, _b).toArray());
  const bl = bpts[bpts.length - 1]; for (let i = 1; i <= 7; i++) bpts.push([bl[0] + Math.sin(i * 0.5) * 1.6, bl[1] - i * 2.4 + i * i * 0.08, bl[2] + (1 - Math.cos(i * 0.5)) * 1.6]);
  GB.tube(bpts, (k) => 0.42 - 0.24 * k, { radial: 4, dark: 0.45 });
  GB.lathe([bk.a[0], 0, bk.a[2]], [[0, -0.5], [2.4, -0.5], [3.1, -0.1], [2.6, 0.35], [1.2, 0.8], [0.45, 1.6]], { radial: 12, dark: 0.9 });
  await Y();
  const glassGeo = GB.build();
  await Y();
  const glass = style.glassMeshes(glassGeo); glass.name = 'glass'; root.add(glass);
  await Y();
  // where the pour lands: a coil stack laid at 1.5 turns a second that slumps and starts again, beside one that toppled
  const PB = style.glassBuilder(), pourGrow = { value: 0 };
  PB.tube(helix(0, 0, 0, 2.3, 1.5, 6, 3.4, 16), 0.3, { radial: 5, dark: 0.35, grow: (k) => k });
  const pourCoil = style.glassMeshes(PB.build(), { grow: pourGrow }); pourCoil.position.copy(pourAt); pourCoil.position.y += 0.9; root.add(pourCoil);
  const PB2 = style.glassBuilder(); PB2.lathe([pourAt.x, pourAt.y - 0.3, pourAt.z], [[0, 0], [4.6, 0], [5.4, 0.5], [4.4, 0.95], [1.5, 1.3], [0, 1.4]], { radial: 14, dark: 0.8 });
  PB2.tube(helix(pourAt.x + 4.6, pourAt.y + 0.7, pourAt.z + 1.5, 1.9, 1.5, 3, 0.6, 14, 2.6, 1.2), 0.3, { radial: 5, dark: 0.5 });
  const pourPad = style.glassMeshes(PB2.build(), { materials: [glass.children[0].material, glass.children[1].material] }); root.add(pourPad);
  await Y();

  // ---- a peak pulled up out of the left valley wall as we climb past (journey second 31)
  const pullAt = new THREE.Vector3(PULL[0], 0, PULL[1]); pullAt.y = heightAt(pullAt.x, pullAt.z) - 0.6;
  const pulled = new THREE.Mesh(style.peakGeometry({ height: 9, radius: 3.3, curl: 2.9, dir: Math.PI * 0.35, radial: 14, rings: 12, wob: 1, rnd: rng, toast: 0.9 }), style.meringue({ coat: -1e3 }));
  pulled.position.copy(pullAt); pulled.name = 'pulled-peak'; root.add(pulled);

  // ---- the amber net: the cage drawn from the sun into one target, read by meringue and custard
  const ribs = [], ribAt = new Int32Array(threads.length).fill(-1); threads.forEach((t, i) => { if (t.rib) { ribAt[i] = ribs.length; ribs.push(t); } });
  const r = ctx.renderer; let rt = null, netScene = null, netCam = null, netMesh = null;
  if (r && r.compile) {
    rt = new THREE.WebGLRenderTarget(1024, 1024, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter }); rt.texture.anisotropy = 8;
    netScene = new THREE.Scene(); netMesh = new THREE.Mesh(style.threadGeometry(ribs, 32), style.threadNet); netMesh.frustumCulled = false; netMesh.matrixAutoUpdate = false; netScene.add(netMesh);
    netCam = new THREE.OrthographicCamera(-178, 178, 178, -178, 1, 1400);
    const prev = r.getRenderTarget(); r.setRenderTarget(rt); r.compile(netMesh, netCam, netScene); r.setRenderTarget(prev);   // compiled for the buffer it is drawn into
    U.uNet.value = rt.texture; U.uNetAmt.value = opts.net ?? 1;
    await Y();
  }

  // ---- the stage (for judging alone; the world passes stage: false and lays its own sea and sky from the kit)
  const shore = { x: 0, z: 0, r: 137, rf: (dx, dz) => { const c = Math.cos(rotY), s = Math.sin(rotY); return shoreR(Math.atan2(dx * c - dz * s, dx * s + dz * c)); } };
  if (opts.stage ?? true) {
    const sp = [], si = [], NA = 128, rad = []; for (let i = 0; i <= 38; i++) rad.push(i * 12); for (const x of [520, 640, 820, 1100, 1500, 2100]) rad.push(x);
    for (let j = 0; j < rad.length; j++) for (let i = 0; i < NA; i++) { const a = (i / NA) * 6.283; sp.push(Math.sin(a) * rad[j], 0, Math.cos(a) * rad[j]); if (j > 0) { const a0 = (j - 1) * NA + i, b0 = (j - 1) * NA + (i + 1) % NA; si.push(a0, a0 + NA, b0, b0, a0 + NA, b0 + NA); } }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); sg.setIndex(si);
    U.uCollar.value.set(0, 0, 148);
    const sea = new THREE.Mesh(sg, style.custard()); sea.name = 'stage-custard'; sea.frustumCulled = false; root.add(sea); root.add(style.sky());
    await Y();
    await style.makeFlow([shore, ...feet.filter((f) => f.n).map((f) => ({ x: f.x, z: f.z, r: 3.5 }))], { size: 384, width: 900, shadeSize: 256, casters: [{ x: 0, z: 0, r: 110, h: 56, round: 1 }, ...peaks.map((p) => ({ x: p.x, z: p.z, r: p.radius * 1.25 + 8, h: p.top, round: 0.5 }))] });
  }

  // ---- anchors (hero space)
  const anchors = {
    portalSeat: { position: ringC.clone(), normal: rn.clone(), radius: 7, pitchDeg: 6.4 },
    flyThrough: fly.map((p) => p.clone()),
    gate: { left: new THREE.Vector3(feet[1].x, 0, feet[1].z), right: new THREE.Vector3(feet[0].x, 0, feet[0].z), center: new THREE.Vector3(0, 6, 150.3) },
    feet: feet.filter((f) => f.n).map((f) => new THREE.Vector3(f.x, 0, f.z)),
    viewpoints: { reveal: new THREE.Vector3(0, 3, 390), crossing: new THREE.Vector3(0, 4, 220), gate: new THREE.Vector3(0, 6, 160), nave: new THREE.Vector3(0, 31, 90), hollow: new THREE.Vector3(0, 58.5, 13) },
    lookAt: new THREE.Vector3(0, 80, 0), crown: new THREE.Vector3(0, 176, 0), pour: pourAt.clone(), pulledPeak: pullAt.clone(),
    peaks: peaks.map((p) => ({ position: new THREE.Vector3(p.x, p.base, p.z), top: p.top, radius: p.radius })),
    brokenStrand: new THREE.Vector3(bl[0], bl[1], bl[2]), shore,
    clock: { duration, share: CNT, threads: NT },
  };

  // ---- life
  let manual = false, js = 0; const cMat = new THREE.Matrix4(), cPos = new THREE.Vector3();
  const drive = (time) => {
    U.uClock.value = js; U.uFill.value = countAt(js);
    const k = smoothstep(28.5, 30.0, js), late = Math.max(js - 30.0, 0);
    pulled.scale.set(1.25 - 0.25 * k, Math.max(0.02, k * (1 + 0.22 * Math.sin(k * Math.PI)) - 0.07 * Math.exp(-late * 1.6) * Math.sin(late * 8) * k), 1.25 - 0.25 * k); pulled.rotation.x = (1 - k) * 0.5;
    const cyc = (time % 5) / 5, sl = smoothstep(0.84, 1, cyc); pourGrow.value = Math.min(cyc / 0.8, 1); pourCoil.scale.set(1 + 0.5 * sl, 1 - 0.85 * sl, 1 + 0.5 * sl); pourCoil.rotation.z = 0.35 * sl;
  };
  const hero = {
    object: root, radius: 150, height: 176, center: new THREE.Vector3(0, 78, 0), anchors, style, ground: false, groundY: 0,
    heightAt, countAt, threads, shore,
    casters: [{ x: 0, z: 0, r: 110, h: 56, round: 1 }, ...peaks.map((p) => ({ x: p.x, z: p.z, r: p.radius * 1.25 + 8, h: p.top, round: 0.5 }))],   // what throws the massif's shadow on the custard (hero space, unrotated)
    setProgress(u) { manual = true; js = clamp(u, 0, 1) * duration; },      // journey u 0..1: throws the cage on the journey's clock
    setClock(seconds) { manual = true; js = seconds; },
    // re-time one thread of the cage (the world's rare event breaks a panel and mends it): t0 = journey second it is thrown
    setThrow(i, t0) {
      const ca = cage.geometry.attributes.aP; if (ca.array[i * 4] !== t0) { ca.array[i * 4] = t0; ca.needsUpdate = true; }
      const j = ribAt[i]; if (netMesh && j >= 0) { const na = netMesh.geometry.attributes.aP; if (na.array[j * 4] !== t0) { na.array[j * 4] = t0; na.needsUpdate = true; } }
    },
    update(dt, time, camera) {
      if (ownStyle) style.update(dt, time, camera);
      if (!manual) js = (8 + time * 1.0) % 46;                               // a demonstration loop until the world takes the clock
      drive(time);
      if (rt) {
        root.updateWorldMatrix(true, false); netMesh.matrix.copy(root.matrixWorld);
        cPos.set(0, 85, 0).applyMatrix4(root.matrixWorld); netCam.position.copy(cPos).addScaledVector(style.sun, 600); netCam.up.set(0, 1, 0); netCam.lookAt(cPos); netCam.updateMatrixWorld(true);
        U.uNetMat.value.multiplyMatrices(netCam.projectionMatrix, cMat.copy(netCam.matrixWorld).invert());
        const prev = r.getRenderTarget(), auto = r.autoClear, ca = r.getClearAlpha(); r.getClearColor(_col);
        r.autoClear = true; r.setClearColor(0x000000, 1); r.setRenderTarget(rt); r.clear(); r.render(netScene, netCam);
        r.setRenderTarget(prev); r.setClearColor(_col, ca); r.autoClear = auto;
      }
    },
    dispose() { if (rt) rt.dispose(); if (netMesh) netMesh.geometry.dispose(); style.threadNet.dispose(); },
  };
  drive(0);
  return hero;
}
const _col = new THREE.Color();
