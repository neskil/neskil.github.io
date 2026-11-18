// The Wine-Dark Cup: hero set piece "The Vine Ship" + the style kit of the world (Attic vase painting).
//
// THE HERO  A black-glaze galley 124 m long standing at the centre of the cup: boar-snout ram with a painted eye,
//   swan-neck stern, eleven hung shields, a rail on posts, steering oars, and a chalk-white sail 50 m square on a
//   braced yard. The mast is a twisting black strap that does not stop: at 95 m it forks into seven flat ribbon
//   arms (plus ~30 side branches ending in spiral tendrils) that spread to r ~300 m as a ceiling, carrying ~900
//   five-lobed leaf slabs with incised veins and 160 hanging bunches of forty purple discs (white dot on every
//   third grape). Under it lies a sea disc of running-wave scroll rings. All of it obeys one line, the reversal
//   front: on one side black-figure (glaze on clay), on the other red-figure (clay on glaze); the sail stays white.
//
// LOCAL SPACE  origin on the sea at the foot of the mast, +Y up. The hull's profile lies in the XY plane and
//   faces +Z; the BOW POINTS TO -X (ram tip x -59, stern curl x +65). Sea at y 0. radius 66 is the SHIP (so
//   the viewer frames it); the vine canopy reaches anchors.canopy.radius (~304). height 106.
// COST  ~111k triangles (51k grapes, 50k leaves, 7k vine, 4k ship), 7 draw calls (hull, rig, vine, leaves, grapes,
//   sea, the black well under the sea) + 2 with opts.mirror, + 1 with opts.kiln. One 2048x1024 mask canvas. No lights. Build ~250-400 ms here,
//   no step over 50 ms. opts.detail thins leaves and bunches.
//
// OPTS  style (the world's shared makeStyle instance; made here if absent), palette (6 hex, brief order),
//   detail (0.5-1), leaves (900), bunches (160), reach (292: vine radius), spin (0.011 rad/s: the ship and vine
//   turn; 0 to stop), sea (true; false if the world lays its own sea), seaRadius (200), kiln (adds the kiln-field
//   dome; default only when the hero made its own style, i.e. standalone), mirror (false: y-mirrored hull and rig under the sea, for the night reflection),
//   front (m: fixed position of the reversal line if nobody drives it; default 4 = through the ship),
//   frontNormal [x, z], frontFrom (130), frontTo (-420), frontWidth (2.5), reverseFrom / reverseTo (path u).
// PROGRESS  hero.setProgress(u): path u -> the reversal (line runs frontFrom..frontTo along frontNormal while u
//   goes reverseFrom 0.56 .. reverseTo 0.635). hero.setReversal(x 0..1) and hero.setFront(metres) drive it
//   directly. If the world owns the style and never calls these, the hero leaves style.setFront to the world.
//   Everything else is ambient and uses time: the kiln bar (once a minute), sail in three held poses, tendrils
//   adding one coil at a time, leaves tipping between two angles, bunches swinging in held steps, wave curls
//   stepping at eight a second on rings that turn against each other, the slow turn of ship and vine.
// ANCHORS (local, before the slow turn; the 80 m arc clears the hull at any angle of it)
//   flyThrough   camera line at y 2.5: 120 m of approach, a right-hand arc of 130 degrees at 80 m radius that
//                passes 21 m outside the ram tip, then away along +X. >= 14 m from the hull, 58 m under the bunches.
//   orbitRadius, arcFrom, arcTo   the arc (radians of atan2(z, x)).
//   ramTip, eye (on the +Z cheek; the same at -z), stemTop, sternTop, sailCenter, mastTop, railY.
//   canopy { yMin, yMax, radius, lowestBunch }, bunches [{ x, z, top, bottom }].
//   frontNormal, frontFrom, frontTo   the reversal line: night where dot(xz, normal) > d.
//   viewpoints { entry, broadside, underRam, underSail, under, far }.
//
// THE STYLE KIT  const style = makeStyle(ctx, { palette, startNight }); pass it to buildHero as opts.style.
//   style.palette   { clay, glaze, white, purple, brown, kiln }: the brief's colours (linear THREE.Color).
//   style.ink       the same, corrected so they come out right after ACES at exposure 1, plus ink.bar.
//   style.uniforms  shared by every material: uTime, uFront, uFlip, uKiln, uClay, uGlaze, uWhite, uPurple,
//                   uBrown, uBar, uAxis (style.setAxis(x, z): world xz of the cup's axis). Call style.update(dt, time, camera) every frame (the hero does it only for a
//                   style it made itself) and style.setFront(nx, nz, d, halfWidth) for the reversal line (world space).
//   style.glsl      GLSL to prepend to your own fragment shaders (bowl wall, bands): wdcNight(worldPos),
//                   wdcBar(...), wdcH/wdcN noise and  vec3 wdcResolve(fig, line, white, purple, dry, wp, N, Nb, V, wide)
//                   which turns "is this figure, line, added colour, dry brush" into the pixel. Spread
//                   style.uniforms into your material's uniforms. Output is linear, unlit, no fog.
//   style.slab(o)   the slab material for every figure. Geometry attributes: aSub (0 ground/cut edge, 1 figure,
//                   2 white, 3 purple), aL (metres to the nearest drawn line, 99 none), aPose (-1 or pose id), uv
//                   (metres along/across the brush, or mask uv). o: mask + maskSize (canvas: R glaze, G line,
//                   B white, G+B purple), poses / poseRate / grow / pingpong (held poses: a vertex shows when
//                   aPose equals the current pose, or <= it in grow mode), inst (per-instance aI = phase, rate
//                   scale, flag), tip, swing (aPivot), dot, lineW, dry, load, strokeW, wide, ghost.
//   style.sea(o)    the sea disc material (polar running-wave rings; alpha < 1 on night glaze for reflections).
//   style.kiln() / style.kilnDome()   the field above the rim (follows the camera; black after the reversal).
//   style.slabGeometry(outline, thick, o), style.ribbonGeometry(pts, widths, o), style.smoothOutline(ctrl, per).
//   style.setFront2(nx, nz, d, hw)   a second reversal line; night is where either line has passed (default: far away).
//   slab({ noEdgeBar })  no kiln bar on aSub 0 faces (for a slab so near the eye that a cut edge would carry the whole bar).
//   The bar is firm-edged everywhere (cream or black, never a brown gradient); wide < 0 passed to wdcResolve means none.
//   The dry brush is streaks, not a wash; clay carries a fixed screen speckle; the vine has a hoop at 0.77 reach and
//   thirteen weeping shoots beyond it, and its arms have 2.4 m glazed skirts so they are never a dotted line edge-on.
//   How each rule is kept: two substances = wdcResolve mixes only clay and glaze; white/purple only via aSub or
//   the mask's B channel; brown only as dry-brush thinning of glaze; a line is aL or mask G (incision by day,
//   raised bead that catches the bar by night, never under 1.5 px); no light but wdcBar; no fog anywhere.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const PALETTE = ['#D8703A', '#0D0B0A', '#EDE4D0', '#6B2342', '#7A4322', '#F0A868'];
const TAU = Math.PI * 2;

// ---------------------------------------------------------------------------------------------
// GLSL shared by every material of the world. wdcResolve() is the whole style in one function.
// ---------------------------------------------------------------------------------------------
const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec4 uFront;      // xz = unit normal of the reversal line, z = its distance along that normal, w = half width (m)
uniform vec4 uFront2;     // a second line of the same kind: night is where either line has passed
uniform float uFlip;      // 0: black-figure first (day), 1: red-figure first
uniform float uKiln;      // azimuth of the kiln highlight (radians), once round a minute
uniform vec2 uAxis;       // world xz of the cup's axis
uniform vec3 uClay, uGlaze, uWhite, uPurple, uBrown, uBar;
float wdcBarMask = 1.;     // a mask surface sets this to 0 round added colour: the bar never lies across white or purple
float wdcH(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float wdcN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wdcH(i), wdcH(i + vec2(1., 0.)), f.x), mix(wdcH(i + vec2(0., 1.)), wdcH(i + vec2(1., 1.)), f.x), f.y); }
// 0 = black-figure (glaze figures on clay), 1 = red-figure (clay figures on glaze)
float wdcNight(vec3 wp){
  float s = dot(wp.xz, uFront.xy) - uFront.z;
  float n = smoothstep(-uFront.w, uFront.w, s);
  float s2 = dot(wp.xz, uFront2.xy) - uFront2.z;
  n = max(n, smoothstep(-uFront2.w, uFront2.w, s2));
  return mix(n, 1. - n, uFlip);
}
// the kiln highlight: one soft cream bar in the mirror direction, sliding with position and view
float wdcBar(vec3 wp, vec3 N, vec3 V, float wide){
  if (wide < 0.) return 0.;                           // a surface the bar never lies on (the slipways under our keel)
  if (wide > 0.75) {                                  // sea, wall, kiln field: a spoke of light lying on the pot
    vec2 q = wp.xz - uAxis; vec2 kd = vec2(cos(uKiln), sin(uKiln));
    float hw = 2.5 + 0.035 * length(q);
    float ac = abs(q.x * kd.y - q.y * kd.x); float fa = max(fwidth(ac), 1e-4);
    float sb = (1. - smoothstep(hw - fa, hw + fa, ac)) * smoothstep(-hw, hw, dot(q, kd));       // firm edged: cream or black, never brown
    return sb * 0.8;
  }
  vec3 R = reflect(-V, N);
  float az = atan(R.z, R.x + (R.x < 0. ? -1e-4 : 1e-4));
  float k = mix(1., 0.22, wide);
  float ph = az + (dot(wp.xz, vec2(0.021, 0.013)) + wp.y * 0.017) * k - uKiln;
  float d = abs(fract(ph * 0.15915494 + 0.5) - 0.5) * 6.2831853;
  float w = mix(0.06, 0.13, wide);
  float fd = clamp(fwidth(ph), 1e-4, 0.5 * w);
  float b = 1. - smoothstep(w - fd, w + fd, d);       // a firm-edged bar: glaze is black or cream, never a brown gradient
  return b * 0.85;
}
// fig: 1 where the figure is (glaze by day), 0 on ground. line: the drawn line (0..1). white/purple: added colour.
// dry: 0..1 where the brush ran dry. Nb: normal tilted by the relief of the line (pass N if none).
vec3 wdcResolve(float fig, float line, float white, float purple, float dry, vec3 wp, vec3 N, vec3 Nb, vec3 V, float wide){
  float night = wdcNight(wp);
  float g = mix(fig * (1. - line), max(1. - fig, line * fig), night);      // amount of glaze on this pixel
  float burn = wdcN(wp.xz * 0.045 + wp.y * 0.06);
  vec3 clay = uClay * (0.95 + 0.1 * burn);
  clay *= 1. - 0.16 * step(0.988, wdcH(floor(gl_FragCoord.xy * 0.5) + 3.));      // the fixed fired-clay speckle
  float bead = night * line * fig;
  float bar = mix(wdcBar(wp, N, V, wide), 0.55 * wdcBar(wp, Nb, V, wide), bead) * wdcBarMask;
  float thin = dry * (1. - bead);
  vec3 glaze = mix(uGlaze, uBrown, thin) + uBar * bar * (1. - 0.75 * thin);
  vec3 col = mix(clay, glaze, g);
  col = mix(col, uPurple, purple);
  col = mix(col, uWhite, white);
  return col;
}
`;

const SLAB_VERT = /* glsl */`
attribute float aSub;     // 0 ground/edge (clay by day), 1 figure (glaze by day), 2 chalk white, 3 wine purple
attribute float aL;       // metres to the nearest drawn line (99 = none)
attribute float aPose;    // -1 always; else pose id
uniform vec4 uPose;       // n poses, rate (per s), mode (0 swap, 1 grow), ping-pong (0/1)
#ifdef WDC_INST
attribute vec4 aI;        // per instance: phase, rate scale, flag, spare
#endif
#ifdef WDC_SWING
attribute vec4 aPivot;    // per instance: pivot xyz (local), swing phase
#endif
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vSub; varying float vL; varying float vFlag;
uniform float uTime;
void main(){
  vec3 p = position; vec3 n = normal;
  float ph = 0.; float rs = 1.; vFlag = 0.;
  #ifdef WDC_INST
    ph = aI.x; rs = aI.y; vFlag = aI.z;
  #endif
  float st = floor(uTime * uPose.y * rs + ph);
  float nn = max(uPose.x, 1.);
  float per = uPose.w > 0.5 ? max(2. * nn - 2., 1.) : nn;
  float k = st - per * floor(st / per);
  if (uPose.w > 0.5 && k > nn - 0.5) k = per - k;
  float show = aPose < -0.5 ? 1. : (uPose.z > 0.5 ? step(aPose - 0.5, k) : 1. - step(0.5, abs(aPose - k)));
  #ifdef WDC_TIP
    float a = (k - 0.5) * 0.44 * (0.6 + 0.4 * sin(ph * 7.3));
    float ca = cos(a), sa = sin(a);
    p = vec3(p.x, p.y * ca - p.z * sa, p.y * sa + p.z * ca); n = vec3(n.x, n.y * ca - n.z * sa, n.y * sa + n.z * ca);
  #endif
  p *= show;
  vec4 lp = vec4(p, 1.);
  #ifdef USE_INSTANCING
    lp = instanceMatrix * lp; n = mat3(instanceMatrix) * n;
  #endif
  #ifdef WDC_SWING
    float ss = floor(uTime * 2.5 + aPivot.w);
    float sk = ss - 4. * floor(ss / 4.);
    float sw = (sk > 2.5 ? 0. : sk - 1.) * 0.07;
    vec3 q = lp.xyz - aPivot.xyz; float cs = cos(sw), sn = sin(sw);
    float ax = sin(aPivot.w * 3.1), az = cos(aPivot.w * 3.1);       // swing axis (horizontal)
    float along = q.x * az - q.z * ax;                               // horizontal offset across the axis
    float ny = q.y * cs - along * sn; float na = q.y * sn + along * cs;
    q += vec3(az, 0., -ax) * (na - along); q.y = ny;
    lp.xyz = aPivot.xyz + q;
  #endif
  vec4 wp = modelMatrix * lp;
  vW = wp.xyz; vN = mat3(modelMatrix) * n; vUv = uv; vSub = aSub; vL = aL;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

const SLAB_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec2 vUv; varying float vSub; varying float vL; varying float vFlag;
uniform vec4 uSurf;       // line half width (m), dry strength, brush load length (m), wide (0..1)
uniform vec4 uSurf2;      // ghost groove offset (m, 0 none), brush stroke width (m), dot radius (uv), spare
#ifdef WDC_MASK
uniform sampler2D uMask;  // R glaze, G line, B chalk white, G and B together = wine purple
uniform vec2 uMaskSize;   // metres covered by the mask (for the brush coordinates)
#endif
${GLSL_COMMON}
void main(){
  vec3 N = vN / max(length(vN), 1e-5);
  if (!gl_FrontFacing) N = -N;
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  float s = floor(vSub + 0.5);
  float fig = step(0.5, s);
  float white = 1. - step(0.5, abs(s - 2.));
  float purple = 1. - step(0.5, abs(s - 3.));
  float fw = fwidth(vL);
  float hw = max(uSurf.x, 0.75 * fw);
  float keep = 1. - smoothstep(0.7, 2.4, fw);
  float line = (1. - smoothstep(hw, hw + fw + 1e-4, abs(vL))) * keep;
  if (uSurf2.x > 0.) line = max(line, 0.5 * keep * (1. - smoothstep(hw * 0.5, hw * 0.5 + fw + 1e-4, abs(abs(vL) - uSurf2.x))));
  vec2 bu = vUv;
  #ifdef WDC_MASK
    vec4 m = texture2D(uMask, vUv);
    float mp = min(m.g, m.b);
    float face = fig;                                          // the cut edge (aSub 0) carries no drawing
    fig *= m.r; line = max(line, (m.g - mp) * face); white = max(white, (m.b - mp) * face); purple = max(purple, mp * face);
    bu = vUv * uMaskSize * face;
    float nearC = textureLod(uMask, vUv, 5.).b * face; float ncw = clamp(fwidth(nearC), 1e-3, 0.03);
    wdcBarMask = 1. - smoothstep(0.045 - ncw, 0.045 + ncw, nearC);          // firm edged: the highlight stops short of the eye and the shields
  #endif
  #ifdef WDC_DOT
    float dr = length(vUv - vec2(-0.22, 0.25)); float dfw = fwidth(dr);
    float rr = length(vUv); float rfw = fwidth(rr);
    float grape = 1. - step(1.5, vFlag);                       // flag 2 = the stalk: plain glaze
    purple *= grape * (1. - smoothstep(0.72, 0.72 + rfw + 1e-4, rr));
    white = max(white, step(0.5, vFlag) * grape * (1. - smoothstep(uSurf2.z, uSurf2.z + dfw + 1e-4, dr)));
    bu = vW.xy;
  #endif
  white *= 1. - 0.9 * line; purple *= 1. - 0.9 * line;          // a scratch goes through added colour too
  // relief of the line: tilt the normal by the world-space gradient of the line value
  float lx = dFdx(line), ly = dFdy(line); vec3 px = dFdx(vW), py = dFdy(vW);
  vec3 grad = lx * px / max(dot(px, px), 1e-8) + ly * py / max(dot(py, py), 1e-8);
  vec3 Nb = N - grad * 0.035; Nb /= max(length(Nb), 1e-4);
  // the brush running dry: each stroke thins toward the end of its load
  float sw = max(uSurf2.y, 0.5);
  float stroke = floor(bu.y / sw);
  float uu = bu.x + 53.7 * wdcH(vec2(stroke, 3.7));
  float load = fract(uu / max(uSurf.z, 1.));
  float lr = smoothstep(0.55, 1., load);                        // streaks of thin glaze, more of them toward the end of the load
  float sn = wdcN(vec2(uu * 0.022, bu.y * 17. / sw)); float sfw = clamp(fwidth(sn), 0.01, 0.3);
  float dry = uSurf.y * lr * smoothstep(1.02 - 0.44 * lr - sfw, 1.02 - 0.44 * lr + sfw, sn);      // at most two fifths thin: streaks with black between them
  float wd = uSurf.w;
  #ifdef WDC_NOEDGEBAR
    if (s < 0.5) wd = -1.;                                     // a slab so near the eye that its cut edge would carry the whole bar: none
  #endif
  gl_FragColor = vec4(wdcResolve(fig, line, white, purple, dry, vW, N, Nb, V, wd), 1.);
}
`;

// The sea: a flat disc drawn in polar coordinates. Rings of running-wave scroll, each ring turning at its own
// speed (alternate rings opposite ways), curls stepping forward at eight a second. Clay by day with glaze waves;
// by night the ground is mirror glaze (alpha uSeaNightAlpha so a y-mirrored set can show through) with clay waves.
const SEA_VERT = /* glsl */`
varying vec3 vW; varying vec3 vL;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vL = position; gl_Position = projectionMatrix * viewMatrix * wp; }
`;
const SEA_FRAG = /* glsl */`
varying vec3 vW; varying vec3 vL;
uniform vec4 uSea;        // r0 (first ring inner radius), pitch (m), band width (m), cell length (m)
uniform vec4 uSea2;       // ring speed (m/s), night alpha, outer radius, spare
${GLSL_COMMON}
void main(){
  vec2 p = vL.xz; float r = length(p);
  float fl = max(length(fwidth(p)), 1e-4);                               // long axis of the pixel footprint (m)
  float fw = max(sqrt(length(dFdx(p)) * length(dFdy(p))), 1e-4);         // its mean size: what decides when a band merges to a tone
  float ri = floor((r - uSea.x) / uSea.y);
  float t = (r - uSea.x - ri * uSea.y) / uSea.z;                    // 0..1 across the band (inner to outer)
  float rm = uSea.x + (ri + 0.5) * uSea.y;
  float dir = mod(ri, 2.) < 0.5 ? 1. : -1.;
  float cells = max(floor(6.2831853 * rm / uSea.w + 0.5), 3.);
  float spd = uSea2.x * (0.6 + 0.4 * wdcH(vec2(ri, 9.1))) * dir;
  float th = atan(p.y, p.x + (p.x < 0. ? -1e-4 : 1e-4)) + spd * uTime / max(rm, 1.);
  float sc = th * 0.15915494 * cells + dir * floor(uTime * 8.) * 0.03125;
  float cid = floor(sc); float su = fract(sc); if (dir < 0.) su = 1. - su;
  // one running-wave cell, in metres: x along the band, y across (0 at the trough side)
  float cw = 6.2831853 * rm / cells; float bw = uSea.z;
  vec2 q = vec2(su * cw, t * bw);
  vec2 c1 = vec2(0.58 * cw, 0.52 * bw); float r1 = 0.46 * bw;         // the body of the curl
  vec2 c2 = c1 + vec2(0.15, -0.13) * bw; float r2 = 0.31 * bw;       // the bite that hollows it into a hook
  float base = q.y - 0.22 * bw;                                         // solid foot of the wave
  float xe = max(c1.x - 0.22 * bw, 1e-3);
  float xr = clamp(q.x / xe, 0., 1.);
  float ramp = max(q.y - (0.22 + 0.52 * xr * xr) * bw, q.x - xe);    // the rising back
  float crest = max(min(length(q - c1) - r1, ramp), -(length(q - c2) - r2));
  float d = min(base, crest);
  float inBand = step(0., t) * step(t, 1.) * step(uSea.x, r) * step(r, uSea2.z);
  float ew = clamp(0.75 * length(vec2(dFdx(d), dFdy(d))), 1e-4, fl);      // the edge is filtered across itself, not along the view: crisp at grazing angles
  float wave = (1. - smoothstep(-ew, ew, d)) * inBand;
  float tone = 0.42 * inBand;                                           // what the band averages to far away
  float fig = mix(wave, tone, smoothstep(0.25 * bw, 0.8 * bw, fw));
  // a fine reserved line under each band: the groundline
  float gr = abs(r - uSea.x - ri * uSea.y + 0.9); float gw = clamp(fwidth(gr), 1e-4, fl); float gh = max(0.14, 0.8 * gw);
  float gl = 1. - smoothstep(gh - 0.5 * gw, gh + 0.5 * gw, gr);
  fig = max(fig, gl * step(uSea.x - 1., r) * step(r, uSea2.z + 1.) * (1. - smoothstep(0.5, 2., fw)));
  float lr = smoothstep(0.5, 1., fract(sc * 0.125 + wdcH(vec2(ri, 2.))));
  float sn = wdcN(vec2(sc * 0.9, t * 17.)); float sfw = clamp(fwidth(sn), 0.01, 0.3);
  float dry = 0.75 * lr * smoothstep(1.02 - 0.6 * lr - sfw, 1.02 - 0.6 * lr + sfw, sn) * (1. - smoothstep(0.15 * bw, 0.5 * bw, fw));   // streaks, not a wash
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  vec3 N = vec3(0., 1., 0.);
  vec3 col = wdcResolve(fig, 0., 0., 0., dry * fig, vW, N, N, V, 1.);     // dry streaks only in the waves' own glaze: the night mirror is plain black
  float night = wdcNight(vW);
  gl_FragColor = vec4(col, mix(1., mix(uSea2.y, 1., fig), night));
}
`;

// The kiln: the plain field above the rim. Pale clay by day, mirror black after the reversal. Far-plane dome.
const KILN_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }
`;
const KILN_FRAG = /* glsl */`
varying vec3 vD; uniform vec3 uKilnCol; uniform float uKilnR; uniform vec2 uRim; uniform float uKilnAvoid;
${GLSL_COMMON}
void main(){
  vec3 d = vD / max(length(vD), 1e-4);
  vec3 wp = cameraPosition + vec3(d.x, 0., d.z) * uKilnR;       // the field is a dome of radius uKilnR over the eye: the front closes over it
  float night = wdcNight(wp);
  float nw = clamp(fwidth(night), 1e-3, 0.5); night = smoothstep(0.5 - nw, 0.5 + nw, night);     // a hard join on the field too, never a gradient
  vec3 V = -d; vec3 N = vec3(-d.x, 0., -d.z); N /= max(length(N), 1e-3);
  // the kiln highlight on the mirror field: not a beam but the reflection of the kiln mouth, a short cream bar with
  // round ends that bends with the pot and slides round it, with a smaller echo on the far side
  float az = atan(d.z, d.x + (d.x < 0. ? -1e-4 : 1e-4)) - uKiln - 2.2;
  float el = asin(clamp(d.y, -1., 1.));
  float da = (fract(az * 0.15915494 + 0.5) - 0.5) * 6.2831853;
  // a low flat bar with round ends lying just over the rim and bending with it (uRim: the rim's radius and height;
  // its elevation is worked out where this direction meets the rim), never a crescent; it draws in to nothing as it
  // nears uKilnAvoid, the azimuth of the handle, so no light ever stands behind the way out
  vec2 rc = cameraPosition.xz - uAxis; vec2 dh = d.xz / max(length(d.xz), 1e-3); float rb = dot(rc, dh);
  float rT = -rb + sqrt(max(rb * rb - dot(rc, rc) + uRim.x * uRim.x, 0.));
  float elR = atan(uRim.y - cameraPosition.y, max(rT, 1.));
  float dv = abs(fract((uKiln + 2.2 - uKilnAvoid) * 0.15915494 + 0.5) - 0.5) * 6.2831853;
  float grow = smoothstep(0.5, 1.0, dv);
  float lz = length(vec2(max(abs(da) - 0.42 * grow, 0.) * 0.9, el - elR - 0.05)) - 0.024 * grow;
  float lw = clamp(fwidth(lz), 1e-4, 0.02);
  float sb = 1. - smoothstep(-lw, lw, lz);
  vec3 glaze = mix(uGlaze, uWhite * 0.93, sb);
  vec3 field = uKilnCol * (1. - 0.12 * step(0.988, wdcH(floor(gl_FragCoord.xy * 0.5) + 3.)));
  gl_FragColor = vec4(mix(field, glaze, night), 1.);
}
`;

// ---------------------------------------------------------------------------------------------
// Geometry helpers of the style (pure functions; no rng)
// ---------------------------------------------------------------------------------------------
// Closed outline from control points [x, y, sharp?]: Catmull-Rom through soft points, hard corners at sharp ones.
export function smoothOutline(ctrl, per = 5) {
  const n = ctrl.length, out = [];
  for (let i = 0; i < n; i++) {
    const p1 = ctrl[i], p2 = ctrl[(i + 1) % n];
    const p0 = p1[2] ? p1 : ctrl[(i - 1 + n) % n], p3 = p2[2] ? p2 : ctrl[(i + 2) % n];
    const straight = p1[2] && p2[2];
    const steps = straight ? 1 : per;
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  return out;
}

function finishGeo(P, Nn, U, S, L, Po, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('aSub', new THREE.Float32BufferAttribute(S, 1));
  g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 1));
  g.setAttribute('aPose', new THREE.Float32BufferAttribute(Po, 1));
  if (idx) g.setIndex(idx);
  return g;
}

// A figure slab: a polygon outline [[x, y], ...] in the XY plane, extruded `thick` along Z (centred on o.z).
// Faces carry substance o.sub (1 glaze figure, 2 white, 3 purple), the cut edge o.edgeSub (0 = bare clay).
// o.uvRect [x0, y0, w, h] maps the faces into a mask; otherwise uv = metres (the brush coordinates).
// o.pose = pose id for swapped poses (-1 = always shown). o.holes = [[...], ...]. o.back = false drops the back face.
export function slabGeometry(outline, thick = 0.5, o = {}) {
  const sub = o.sub ?? 1, edgeSub = o.edgeSub ?? 0, pose = o.pose ?? -1, z0 = o.z ?? 0, holes = o.holes || [];
  const c = outline.map((p) => new THREE.Vector2(p[0], p[1]));
  if (!THREE.ShapeUtils.isClockWise(c)) { /* counter-clockwise: as wanted */ } else c.reverse();
  const hs = holes.map((h) => { const v = h.map((p) => new THREE.Vector2(p[0], p[1])); if (!THREE.ShapeUtils.isClockWise(v)) v.reverse(); return v; });
  const tris = THREE.ShapeUtils.triangulateShape(c, hs);
  const all = c.concat(...hs);
  const P = [], Nn = [], U = [], S = [], L = [], Po = [], idx = [];
  const uvOf = (v) => (o.uvRect ? [(v.x - o.uvRect[0]) / o.uvRect[2], (v.y - o.uvRect[1]) / o.uvRect[3]] : [v.x, v.y]);
  const zf = z0 + thick / 2, zb = z0 - thick / 2, nA = all.length;
  for (const v of all) { P.push(v.x, v.y, zf); Nn.push(0, 0, 1); U.push(...uvOf(v)); S.push(sub); L.push(99); Po.push(pose); }
  for (const t of tris) idx.push(t[0], t[1], t[2]);
  if (o.back !== false) {
    for (const v of all) { P.push(v.x, v.y, zb); Nn.push(0, 0, -1); U.push(...uvOf(v)); S.push(o.backSub ?? sub); L.push(99); Po.push(pose); }
    for (const t of tris) idx.push(nA + t[0], nA + t[2], nA + t[1]);
  }
  if (thick > 0) {
    const loops = [c, ...hs];
    for (const lp of loops) {
      let run = 0;
      for (let i = 0; i < lp.length; i++) {
        const a = lp[i], b = lp[(i + 1) % lp.length];
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1e-6, nx = dy / len, ny = -dx / len;
        const k = P.length / 3;
        P.push(a.x, a.y, zf, b.x, b.y, zf, b.x, b.y, zb, a.x, a.y, zb);
        for (let j = 0; j < 4; j++) { Nn.push(nx, ny, 0); S.push(edgeSub); L.push(99); Po.push(pose); }
        U.push(run, 0, run + len, 0, run + len, thick, run, thick); run += len;
        idx.push(k, k + 2, k + 1, k, k + 3, k + 2);
      }
    }
  }
  return finishGeo(P, Nn, U, S, L, Po, idx);
}

// A flat ribbon lying in the plane whose normal is `up` (default +Y): pts = [Vector3], widths = [m] per point.
// Top face plus a skirt `thick` deep on both sides (the slab's cut edge). o.sub / o.edgeSub / o.pose as above;
// o.poseAt(i) gives a pose id per point (for tendrils that add one coil at a time, material in grow mode).
export function ribbonGeometry(pts, widths, o = {}) {
  const sub = o.sub ?? 1, edgeSub = o.edgeSub ?? 0, thick = o.thick ?? 0.5, up = o.up || new THREE.Vector3(0, 1, 0);
  const P = [], Nn = [], U = [], S = [], L = [], Po = [], idx = [];
  const t = new THREE.Vector3(), sd = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  let run = o.u0 ?? 0; const n = pts.length; const side = [];
  for (let i = 0; i < n; i++) {
    t.subVectors(pts[Math.min(i + 1, n - 1)], pts[Math.max(i - 1, 0)]);
    sd.crossVectors(t, up); if (sd.lengthSq() < 1e-10) sd.set(1, 0, 0); sd.normalize();
    if (i > 0) run += pts[i].distanceTo(pts[i - 1]);
    const w = widths[i] * 0.5, pose = o.poseAt ? o.poseAt(i) : (o.pose ?? -1);
    a.copy(pts[i]).addScaledVector(sd, -w); b.copy(pts[i]).addScaledVector(sd, w);
    side.push(a.clone(), b.clone(), sd.clone(), run, pose);
    P.push(a.x, a.y, a.z, b.x, b.y, b.z); Nn.push(up.x, up.y, up.z, up.x, up.y, up.z);
    U.push(run, -w, run, w); S.push(sub, sub); L.push(o.rib ? w : 99, o.rib ? w : 99); Po.push(pose, pose);
    if (o.rib) { P.push(pts[i].x, pts[i].y, pts[i].z); Nn.push(up.x, up.y, up.z); U.push(run, 0); S.push(sub); L.push(0); Po.push(pose); }
  }
  const per = o.rib ? 3 : 2;
  for (let i = 0; i < n - 1; i++) {
    const k = i * per, m = k + per;
    if (o.rib) idx.push(k, k + 2, m, m, k + 2, m + 2, k + 2, k + 1, m + 2, m + 2, k + 1, m + 1);
    else idx.push(k, k + 1, m, m, k + 1, m + 1);
  }
  if (thick > 0) {
    for (let e = 0; e < 2; e++) {
      const k0 = P.length / 3;
      for (let i = 0; i < n; i++) {
        const p = side[i * 5 + e], s2 = side[i * 5 + 2], r = side[i * 5 + 3], pose = side[i * 5 + 4], sg = e ? 1 : -1;
        P.push(p.x, p.y, p.z, p.x - up.x * thick, p.y - up.y * thick, p.z - up.z * thick);
        Nn.push(s2.x * sg, s2.y * sg, s2.z * sg, s2.x * sg, s2.y * sg, s2.z * sg);
        U.push(r, 0, r, thick); S.push(edgeSub, edgeSub); L.push(99, 99); Po.push(pose, pose);
      }
      for (let i = 0; i < n - 1; i++) { const k = k0 + i * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
    }
  }
  return finishGeo(P, Nn, U, S, L, Po, idx);
}

// ---------------------------------------------------------------------------------------------
// The style kit. One instance per world; pass it to buildHero as opts.style.
// ---------------------------------------------------------------------------------------------
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE;
  const C = (h) => new THREE.Color(h);
  const palette = { clay: C(hex[0]), glaze: C(hex[1]), white: C(hex[2]), purple: C(hex[3]), brown: C(hex[4]), kiln: C(hex[5]) };
  // inks: what the shader outputs so that, after ACES at exposure 1, the picture matches the palette by eye
  const ink = {
    clay: palette.clay.clone().multiply(new THREE.Color(INK.clay[0], INK.clay[1], INK.clay[2])),
    glaze: palette.glaze.clone().multiplyScalar(INK.glaze),
    white: palette.white.clone().multiply(new THREE.Color(INK.white[0], INK.white[1], INK.white[2])),
    purple: palette.purple.clone().multiply(new THREE.Color(INK.purple[0], INK.purple[1], INK.purple[2])),
    brown: palette.brown.clone().multiply(new THREE.Color(INK.brown[0], INK.brown[1], INK.brown[2])),
    kiln: palette.kiln.clone().multiply(new THREE.Color(INK.kiln[0], INK.kiln[1], INK.kiln[2])),
    bar: palette.white.clone().multiplyScalar(INK.bar),
  };
  const uniforms = {
    uTime: { value: 0 }, uFront: { value: new THREE.Vector4(0, -1, 60, 2.5) }, uFront2: { value: new THREE.Vector4(1, 0, 1e6, 2.5) }, uFlip: { value: opts.startNight ? 1 : 0 },
    uKiln: { value: 0 }, uAxis: { value: new THREE.Vector2(0, 0) }, uClay: { value: ink.clay }, uGlaze: { value: ink.glaze }, uWhite: { value: ink.white },
    uPurple: { value: ink.purple }, uBrown: { value: ink.brown }, uBar: { value: ink.bar },
  };
  const share = (own) => Object.assign({}, uniforms, own);
  const mats = [];
  // Slab material. o: mask (texture), maskSize [w, h] m, inst (per-instance aI), swing (aPivot), tip (leaf tipping),
  // dot (grape dot), lineW (half width m), dry (0..1), load (m), wide (0..1), ghost (m), strokeW (m), dotR,
  // poses, poseRate (per s), grow (bool), pingpong (bool), side.
  function slab(o = {}) {
    const defines = {};
    if (o.mask) defines.WDC_MASK = 1; if (o.inst || o.tip || o.dot) defines.WDC_INST = 1;
    if (o.swing) defines.WDC_SWING = 1; if (o.noEdgeBar) defines.WDC_NOEDGEBAR = 1; if (o.tip) defines.WDC_TIP = 1; if (o.dot) defines.WDC_DOT = 1;
    const m = new THREE.ShaderMaterial({
      defines, vertexShader: SLAB_VERT, fragmentShader: SLAB_FRAG, side: o.side ?? THREE.DoubleSide,
      uniforms: share({
        uSurf: { value: new THREE.Vector4(o.lineW ?? 0.09, o.dry ?? 0.6, o.load ?? 46, o.wide ?? 0) },
        uSurf2: { value: new THREE.Vector4(o.ghost ?? 0, o.strokeW ?? 4, o.dotR ?? 0.3, 0) },
        uPose: { value: new THREE.Vector4(o.poses ?? 1, o.poseRate ?? 8, o.grow ? 1 : 0, o.pingpong ? 1 : 0) },
        uMask: { value: o.mask || null }, uMaskSize: { value: new THREE.Vector2(...(o.maskSize || [1, 1])) },
      }),
    });
    m.extensions.derivatives = true; mats.push(m); return m;
  }
  // Sea disc material (see SEA_FRAG). o: r0, pitch, band, cell, speed (m/s), nightAlpha, outer.
  function sea(o = {}) {
    const m = new THREE.ShaderMaterial({
      vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, transparent: true, depthWrite: true,
      uniforms: share({
        uSea: { value: new THREE.Vector4(o.r0 ?? 22, o.pitch ?? 15, o.band ?? 6.5, o.cell ?? 11) },
        uSea2: { value: new THREE.Vector4(o.speed ?? 4.5, o.nightAlpha ?? 0.7, o.outer ?? 200, 0) },
      }),
    });
    m.extensions.derivatives = true; mats.push(m); return m;
  }
  // Kiln field: use on a sphere/box of any size centred on the origin (it follows the camera by itself).
  function kiln() {
    const m = new THREE.ShaderMaterial({
      vertexShader: KILN_VERT, fragmentShader: KILN_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: true,
      uniforms: share({ uKilnCol: { value: ink.kiln }, uKilnR: { value: 170 }, uRim: { value: new THREE.Vector2(392, 134) }, uKilnAvoid: { value: 99 } }),
    });
    mats.push(m); return m;
  }
  function kilnDome() {
    const d = new THREE.Mesh(new THREE.IcosahedronGeometry(10, 2), kiln());
    d.frustumCulled = false; d.renderOrder = -0.5; return d;
  }
  return {
    palette, ink, uniforms, glsl: GLSL_COMMON, slab, sea, kiln, kilnDome,
    slabGeometry, ribbonGeometry, smoothOutline,
    // the reversal line: night (red-figure) where dot(xz, n) > d; halfWidth softens it (m)
    setFront(nx, nz, d, halfWidth = 2.5) { const l = Math.hypot(nx, nz) || 1; uniforms.uFront.value.set(nx / l, nz / l, d, halfWidth); },
    setFront2(nx, nz, d, halfWidth = 2.5) { const l = Math.hypot(nx, nz) || 1; uniforms.uFront2.value.set(nx / l, nz / l, d, halfWidth); },
    setFlip(v) { uniforms.uFlip.value = v ? 1 : 0; },
    setAxis(x, z) { uniforms.uAxis.value.set(x, z); },      // world xz of the cup's axis (for the bar on sea and wall)
    update(dt, time) { uniforms.uTime.value = time; uniforms.uKiln.value = (time * TAU / 60) % TAU; },
    dispose() { for (const m of mats) m.dispose(); },
  };
}
// ink corrections (multipliers on the palette's linear values), tuned by eye through ACES at exposure 1
const INK = { clay: [1, 0.93, 1.55], glaze: 1, white: [1.17, 1.1, 0.95], purple: [0.85, 1.8, 1.65], brown: [1.5, 2.0, 2.4], kiln: [1.08, 0.8, 0.8], bar: 1.3 };

// ---------------------------------------------------------------------------------------------
// The Vine Ship: authored profile (bow drawn toward +x here; FX() turns it so the bow points to -X, mast at x 0)
// ---------------------------------------------------------------------------------------------
const FX = (x) => 4 - x;
const HULL_T = 8;                                   // thickness of the hull slab (m)
const MASK = { x0: -62, y0: -5, w: 130, h: 65, px: 2048, py: 1024 };
const EDGE = { x0: -27, y0: 35, per: 48, wx: -20, wy: 47 };      // where the edge's strip and the fillet's white lie in the mask (ship space, m)
const HULL_CTRL = [
  [63, 4.6, 1], [55, 0.6], [40, -1.6], [0, -2.4], [-34, -1.6],                       // ram tip, keel
  [-50, 3], [-58, 14], [-61, 28], [-59, 42], [-52, 52], [-43, 55.5], [-37, 52],        // stern sweeping up
  [-35.4, 46.2, 1], [-40.5, 48.6], [-46.5, 46.6], [-51.2, 40], [-52.6, 31], [-50, 25.6], // curl tip, inner neck
  [-44, 23.5], [-20, 22], [10, 22], [30, 23.4], [38, 25, 1],                         // the rail
  [38, 30.2, 1], [47.4, 30.6, 1], [50.6, 39], [49.8, 45.4], [46.6, 49.4, 1],           // forecastle, stempost horn
  [52.6, 45.6], [54.4, 38], [53.4, 30], [51.2, 22.6], [50.4, 16], [53.4, 10.8], [58.4, 8.2],  // cutwater, ram top
];
const RAIL = [[-44, 23.5], [-20, 22], [10, 22], [30, 23.4], [38, 25]];
function railY(x) {
  for (let i = 0; i < RAIL.length - 1; i++) {
    const a = RAIL[i], b = RAIL[i + 1];
    if (x <= b[0] || i === RAIL.length - 2) { const t = (x - a[0]) / (b[0] - a[0]); const s = t * t * (3 - 2 * t); return a[1] + (b[1] - a[1]) * (0.5 * t + 0.5 * s); }
  }
  return 22;
}

// The hull's drawing: R glaze, G incised/raised line, B chalk white, G+B wine purple (see SLAB_FRAG).
async function drawHullMask(ctx, rng, outline) {
  const cv = document.createElement('canvas'); cv.width = MASK.px; cv.height = MASK.py;
  const g = cv.getContext('2d');
  const s = MASK.px / MASK.w;
  const X = (x) => (FX(x) - MASK.x0) * s, Y = (y) => MASK.py - (y - MASK.y0) * (MASK.py / MASK.h);
  const GL = '#ff0000', LINE = '#ffff00', WHITE = '#ff00ff', PURPLE = '#ffffff', CLAY = '#000000';
  await ctx.yield?.();
  g.fillStyle = GL; g.fillRect(0, 0, MASK.px, MASK.py);
  await ctx.yield?.();
  g.lineCap = 'round'; g.lineJoin = 'round';
  const path = (pts, close) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); if (close) g.closePath(); };
  const stroke = (pts, w, col, close) => { path(pts, close); g.strokeStyle = col; g.lineWidth = w * s; g.stroke(); };
  const disc = (x, y, r, col) => { g.beginPath(); g.arc(X(x), Y(y), r * s, 0, TAU); g.fillStyle = col; g.fill(); };
  const ring = (x, y, r, w, col) => { g.beginPath(); g.arc(X(x), Y(y), r * s, 0, TAU); g.strokeStyle = col; g.lineWidth = w * s; g.stroke(); };
  // ghost sketch: the first outline, a hand's width off the final one (outline is already in ship space)
  const gx = 0.9 + rng() * 0.5, gy = 0.7 + rng() * 0.4;
  g.beginPath(); outline.forEach((p, i) => { const px = (p[0] + gx - MASK.x0) * s, py = MASK.py - (p[1] - gy - MASK.y0) * (MASK.py / MASK.h); i ? g.lineTo(px, py) : g.moveTo(px, py); });
  g.closePath(); g.strokeStyle = 'rgba(255,255,0,0.85)'; g.lineWidth = 0.3 * s; g.stroke();
  await ctx.yield?.();
  // rail: two incised lines following the sheer, then the wale lines
  const railLine = (dy, x0, x1) => { const p = []; for (let x = x0; x <= x1; x += 2) p.push([x, railY(x) - dy]); return p; };
  stroke(railLine(1.7, -45, 44), 0.34, LINE); stroke(railLine(2.9, -45, 46), 0.34, LINE);
  stroke([[-47, 9.6], [-20, 8.6], [20, 8.6], [46, 9.6]], 0.34, LINE);
  stroke([[-45, 8.1], [-20, 7.2], [20, 7.2], [44, 8.0]], 0.3, LINE);
  // oar ports and the hung shields, alternately chalk white and wine purple
  const nSh = 11;
  for (let i = 0; i < nSh; i++) {
    const x = -30 + i * 6, y = railY(x) - 7.4;
    if (i % 2 === 0) { disc(x, y, 2.75, WHITE); ring(x, y, 1.55, 0.36, GL); disc(x, y, 0.5, GL); }
    else { disc(x, y, 2.75, PURPLE); ring(x, y, 1.6, 0.34, LINE); disc(x, y, 0.5, LINE); }
    ring(x, y, 3.25, 0.3, LINE);
    if (i < nSh - 1) ring(x + 3, 12.2, 0.85, 0.3, LINE);
  }
  // the eye on the bow: white almond, black outline, purple iris, black pupil, a compass prick of bare clay
  const ex = 45.2, ey = 12.6;
  g.beginPath(); g.moveTo(X(ex - 6.6), Y(ey - 0.5));
  g.quadraticCurveTo(X(ex - 0.5), Y(ey + 5.4), X(ex + 6.2), Y(ey + 0.4));
  g.quadraticCurveTo(X(ex + 0.2), Y(ey - 4.6), X(ex - 6.6), Y(ey - 0.5)); g.closePath();
  g.fillStyle = WHITE; g.fill();
  disc(ex, ey + 0.1, 2.45, PURPLE); disc(ex, ey + 0.1, 1.25, GL); disc(ex, ey + 0.1, 0.22, CLAY);
  stroke([[ex - 8.2, ey + 3.2], [ex - 3, ey + 6.6], [ex + 3.4, ey + 6.4], [ex + 7.6, ey + 3.6]], 0.36, LINE);   // brow
  stroke([[ex - 7.8, ey - 0.6], [ex - 10.4, ey - 1.9]], 0.34, LINE);                                           // tear duct
  // the ram's bristles, the stempost fillet, the stern neck
  for (let i = 0; i < 3; i++) stroke([[52.5, 9.4 - i * 1.5], [60.2 - i * 0.6, 6.3 - i * 0.75]], 0.3, LINE);
  g.save(); g.translate(X(51.6), Y(40.6)); g.rotate(0.12); g.fillStyle = WHITE; g.fillRect(-4 * s, -0.9 * s, 8 * s, 1.8 * s); g.restore();
  stroke([[48.4, 33.2], [54.6, 33.2]], 0.32, LINE); stroke([[48.6, 34.6], [54.8, 34.6]], 0.32, LINE);
  const neck = [[-52, 12], [-55.6, 20], [-56.8, 29], [-55.4, 40.5], [-50.2, 48.6], [-43.4, 51.8], [-39.4, 50]];
  g.beginPath(); g.moveTo(X(neck[0][0]), Y(neck[0][1]));
  for (let i = 1; i < neck.length - 1; i++) { const a = neck[i], b = neck[i + 1]; g.quadraticCurveTo(X(a[0]), Y(a[1]), X((a[0] + b[0]) / 2), Y((a[1] + b[1]) / 2)); }
  g.strokeStyle = LINE; g.lineWidth = 0.34 * s; g.stroke();
  disc(-41.6, 50.9, 0.75, WHITE); disc(-45.2, 50.9, 0.75, WHITE); disc(-48.6, 49.4, 0.75, WHITE);
  for (let i = 0; i < 5; i++) stroke([[-58.6 + i * 0.5, 16 + i * 2.3], [-54.2 + i * 0.3, 15.2 + i * 2.3]], 0.28, LINE);
  await ctx.yield?.();
  // the strip the hull's cut edge reads: two border lines and a band of chevrons, 2.4 m apart (the period divides EDGE.per)
  { const ux = (x) => (x - MASK.x0) * s, uy = (y) => MASK.py - (y - MASK.y0) * (MASK.py / MASK.h);
    const seg = (pts, w) => { g.beginPath(); pts.forEach((q, i) => (i ? g.lineTo(ux(q[0]), uy(q[1])) : g.moveTo(ux(q[0]), uy(q[1])))); g.strokeStyle = LINE; g.lineWidth = w * s; g.stroke(); };
    g.lineCap = 'butt'; g.lineJoin = 'miter';
    const x0 = EDGE.x0 - 2.4, x1 = EDGE.x0 + EDGE.per + 9.6, y0 = EDGE.y0;
    seg([[x0, y0 + 0.75], [x1, y0 + 0.75]], 0.34); seg([[x0, y0 + HULL_T - 0.75], [x1, y0 + HULL_T - 0.75]], 0.34);
    for (let x = x0; x < x1 - 0.1; x += 2.4) seg([[x, y0 + 1.7], [x + 1.5, y0 + HULL_T / 2], [x, y0 + HULL_T - 1.7]], 0.36);
    g.fillStyle = WHITE; g.fillRect(ux(EDGE.wx), uy(EDGE.wy + 4), 4 * s, 4 * s); }
  await ctx.yield?.();
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  return tex;
}

function buildHullGeometry() {
  const outline = smoothOutline(HULL_CTRL, 5).map((p) => [FX(p[0]), p[1]]);
  const uvRect = [MASK.x0, MASK.y0, MASK.w, MASK.h];
  const parts = [slabGeometry(outline, HULL_T, { uvRect, edgeSub: 1 })];       // glazed edge: end-on the hull is still a black blade
  // the 8 m cut edge is painted too (end-on, under the ram, the bow is a drawn thing): it reads a strip of the mask
  // that lies in the empty air amidships (EDGE), a band of chevrons between two lines, run round the whole outline;
  // where the white fillet meets the edge of the stempost it wraps round it
  { const g0 = parts[0], nn = g0.getAttribute('normal'), uu = g0.getAttribute('uv'), pp = g0.getAttribute('position');
    const mu = (x) => (x - MASK.x0) / MASK.w, mv = (y) => (y - MASK.y0) / MASK.h;
    for (let i = 0; i < nn.count; i++) {
      if (Math.abs(nn.getZ(i)) > 0.5) continue;
      const run = uu.getX(i), len = uu.getX(i + 1) - run, r0 = run - EDGE.per * Math.floor(run / EDGE.per);
      const my = (pp.getY(i) + pp.getY(i + 1)) / 2, mx = (pp.getX(i) + pp.getX(i + 1)) / 2, fil = mx < -42 && my > 39.3 && my < 42.2;
      for (let j = 0; j < 4; j++) {
        const along = j === 1 || j === 2 ? r0 + len : r0, v = uu.getY(i + j) > 1 ? HULL_T : 0;
        if (fil) uu.setXY(i + j, mu(EDGE.wx + 2), mv(EDGE.wy + 2)); else uu.setXY(i + j, mu(EDGE.x0 + along), mv(EDGE.y0 + v));
      }
      i += 3;
    } }
  // rail fence: a top bar on posts, cut through so the clay sea shows between them
  const fo = [], holes = [];
  for (let x = -36; x <= 34; x += 2) fo.push([FX(x), railY(x) - 0.6]);
  for (let x = 34; x >= -36; x -= 2) fo.push([FX(x), railY(x) + 3.6]);
  for (let x = -35; x < 33; x += 4) {
    const a = x + 0.55, b = x + 3.45;
    holes.push([[FX(a), railY(a) + 0.7], [FX(b), railY(b) + 0.7], [FX(b), railY(b) + 2.7], [FX(a), railY(a) + 2.7]]);
  }
  parts.push(slabGeometry(fo, HULL_T - 0.5, { holes, uvRect }));
  // steering oars, one on each face (one deep over the hull)
  const oar = [[-45.2, 31.6], [-44.2, 31.2], [-52.6, 9], [-54.2, 4], [-56.4, -2.6], [-59.6, -2.2], [-57.6, 4.6], [-54.4, 9.6]].map((p) => [FX(p[0]), p[1]]);
  for (const sg of [-1, 1]) parts.push(slabGeometry(oar, 0.7, { z: sg * (HULL_T / 2 + 0.36), uvRect: [0, 0, 1e5, 1e5] }));
  const geo = mergeGeometries(parts, false);
  return { geo, outline };
}

const SAIL = { x0: -26, x1: 26, y0: 27.5, y1: 87.5, yard: 88.1 };
const FORK_Y = 95;

// The sail: a chalk-white slab in three held poses (slack, drawing, full), seams as incised lines.
function buildSailPose(pose) {
  const nx = 10, ny = 20, T = 1.0, P = [], Nn = [], U = [], S = [], L = [], Po = [], idx = [];
  const B = 2.5 + pose * 3.2, lift = 1.2 + pose * 1.7, pinch = 0.012 + 0.016 * pose;
  const pt = (i, j) => {
    const u = i / nx, v = j / ny, su = Math.sin(Math.PI * u), sv = Math.sin(Math.PI * Math.pow(v, 0.8));
    const yb = SAIL.y0 + lift * su;
    const x = (SAIL.x0 + (SAIL.x1 - SAIL.x0) * u) * (1 - pinch * 2 * Math.sin(Math.PI * v) * Math.abs(u - 0.5) * 2);
    return [x, SAIL.y1 + (yb - SAIL.y1) * v, B * Math.pow(su, 0.8) * sv];
  };
  for (let f = 0; f < 2; f++) {
    const k0 = P.length / 3, zo = f ? -T / 2 : T / 2;
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
      const p = pt(i, j); P.push(p[0], p[1], p[2] + zo); Nn.push(0, 0, f ? -1 : 1); U.push(p[0], p[1]); S.push(2); L.push(j % 2 ? 2.5 : 0); Po.push(pose);
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = k0 + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
      if (f) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
  }
  const rim = [];
  for (let i = 0; i <= nx; i++) rim.push(pt(i, 0));
  for (let j = 1; j <= ny; j++) rim.push(pt(nx, j));
  for (let i = nx - 1; i >= 0; i--) rim.push(pt(i, ny));
  for (let j = ny - 1; j >= 1; j--) rim.push(pt(0, j));
  for (let i = 0; i < rim.length; i++) {
    const a = rim[i], b = rim[(i + 1) % rim.length], k = P.length / 3;
    P.push(a[0], a[1], a[2] + T / 2, b[0], b[1], b[2] + T / 2, b[0], b[1], b[2] - T / 2, a[0], a[1], a[2] - T / 2);
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    for (let q = 0; q < 4; q++) { Nn.push(-dy / l, dx / l, 0); U.push(0, 0); S.push(0); L.push(99); Po.push(pose); }
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  return finishGeo(P, Nn, U, S, L, Po, idx);
}

// The mast: a black strap 4 m wide twisting as it climbs; its broad faces are glaze, its cut edges clay.
function buildMast(phase) {
  const P = [], Nn = [], U = [], S = [], L = [], Po = [], idx = [];
  const y0 = 18, y1 = FORK_Y + 2, n = 56, T = 1.3;
  const ring = (j) => {
    const y = y0 + (y1 - y0) * (j / n), a = phase + y * TAU / 34;
    const w = 2 + 1.1 * Math.max(0, (y - 86) / 10), c = Math.cos(a), s = Math.sin(a);
    return [[c * w - s * T / 2, s * w + c * T / 2], [-c * w - s * T / 2, -s * w + c * T / 2], [-c * w + s * T / 2, -s * w - c * T / 2], [c * w + s * T / 2, s * w - c * T / 2], y, c, s];
  };
  for (let f = 0; f < 4; f++) {
    const k0 = P.length / 3;
    for (let j = 0; j <= n; j++) {
      const r = ring(j), a = r[f], b = r[(f + 1) % 4], c = r[5], s = r[6];
      const nrm = f === 0 ? [-s, c] : f === 1 ? [-c, -s] : f === 2 ? [s, -c] : [c, s];
      P.push(a[0], r[4], a[1], b[0], r[4], b[1]);
      Nn.push(nrm[0], 0, nrm[1], nrm[0], 0, nrm[1]);
      U.push(r[4], -2, r[4], 2); const sub = f % 2 === 0 ? 1 : 0; S.push(sub, sub); L.push(99, 99); Po.push(-1, -1);
    }
    for (let j = 0; j < n; j++) { const k = k0 + j * 2; idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3); }
  }
  return finishGeo(P, Nn, U, S, L, Po, idx);
}

function buildRig(mastPhase, brace) {
  const braced = [buildSailPose(0), buildSailPose(1), buildSailPose(2)];
  const parts = [buildMast(mastPhase)];
  // the yard, with upturned ends
  const yd = smoothOutline([[-29.5, SAIL.yard + 1.6, 1], [-28.6, SAIL.yard - 0.2], [-20, SAIL.yard - 0.9], [20, SAIL.yard - 0.9], [28.6, SAIL.yard - 0.2], [29.5, SAIL.yard + 1.6, 1],
    [27.6, SAIL.yard + 1.2], [20, SAIL.yard + 0.9], [-20, SAIL.yard + 0.9], [-27.6, SAIL.yard + 1.2]], 3);
  braced.push(slabGeometry(yd, 2.2, {}));
  for (const g of braced) { g.rotateY(brace); parts.push(g); }   // the yard is braced round, so the sail shows from every side
  // stays and sheets: straps, never lines
  const strap = (a, b, w, z) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l * w / 2, ny = dx / l * w / 2;
    return slabGeometry([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], 0.6, { z });
  };
  parts.push(strap([0, 88], [FX(47.6), 47.5], 0.8, 0), strap([0, 88], [FX(-45), 53.6], 0.8, 0));
  const cb = Math.cos(brace), sb = Math.sin(brace), up = new THREE.Vector3(0, 0.25, 1).normalize();
  for (const [cx, rx] of [[SAIL.x0 + 0.4, FX(33)], [SAIL.x1 - 0.4, FX(-26)]]) {
    const a = new THREE.Vector3(cx * cb, SAIL.y0 + 0.8, -cx * sb), b = new THREE.Vector3(rx, railY(FX(rx)) + 0.4, Math.sign(-cx * sb) * 3);
    parts.push(ribbonGeometry([a, a.clone().lerp(b, 0.5), b], [0.7, 0.7, 0.7], { thick: 0.5, up }));
  }
  return mergeGeometries(parts, false);
}

// A five-lobed vine leaf, 6 m across, lying in its local XZ plane with the stalk at the origin and the tip
// toward +Z. Built as a fan round the vein junction so the five veins run along mesh edges (aL = 0 on them).
function buildLeafGeometry() {
  const P = [], Nn = [], U = [], S = [], L = [], Po = [], idx = [];
  const cz = 2.3, T = 0.17;
  const lobes = [[-128, 2.5], [-64, 3.15], [0, 3.7], [64, 3.15], [128, 2.5]];
  const rim = [];                                        // [x, z, distance to nearest vein]
  const pol = (deg, r) => { const a = deg * Math.PI / 180; return [Math.sin(a) * r, cz + Math.cos(a) * r]; };
  rim.push([...pol(-168, 1.0), 0.62]);
  for (let i = 0; i < lobes.length; i++) {
    const [deg, r] = lobes[i];
    rim.push([...pol(deg - 17, r * 0.74), Math.sin(17 * Math.PI / 180) * r * 0.74]);
    rim.push([...pol(deg, r), 0]);
    rim.push([...pol(deg + 17, r * 0.74), Math.sin(17 * Math.PI / 180) * r * 0.74]);
    if (i < lobes.length - 1) rim.push([...pol(deg + 32, 1.55), Math.sin(32 * Math.PI / 180) * 1.55]);
  }
  rim.push([...pol(168, 1.0), 0.62]);
  const v = (x, y, z, sub, l, ny) => { P.push(x, y, z); Nn.push(0, ny, 0); U.push(x, z); S.push(sub); L.push(l); Po.push(-1); return P.length / 3 - 1; };
  const c = v(0, 0, cz, 1, 0, 1);
  const r0 = P.length / 3;
  for (const p of rim) v(p[0], 0, p[1], 1, p[2], 1);
  for (let i = 0; i < rim.length - 1; i++) idx.push(c, r0 + i, r0 + i + 1);
  // the stalk
  const s0 = v(-0.2, 0, 0, 1, 99, 1), s1 = v(0.2, 0, 0, 1, 99, 1), s2 = v(0.24, 0, cz, 1, 99, 1), s3 = v(-0.24, 0, cz, 1, 99, 1);
  idx.push(s0, s1, s2, s0, s2, s3);
  // the cut edge: a skirt of bare clay under the rim
  for (let i = 0; i < rim.length - 1; i++) {
    const a = rim[i], b = rim[i + 1], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1;
    const k = P.length / 3;
    P.push(a[0], 0, a[1], b[0], 0, b[1], b[0], -T, b[1], a[0], -T, a[1]);
    for (let q = 0; q < 4; q++) { Nn.push(-dz / l, 0, dx / l); U.push(0, 0); S.push(0); L.push(99); Po.push(-1); }
    idx.push(k, k + 1, k + 2, k, k + 2, k + 3);
  }
  return finishGeo(P, Nn, U, S, L, Po, idx);
}

// A grape: a flat decagon (uv = -1..1 across it). Also used, stretched, as the bunch's stalk.
function buildDiscGeometry() {
  const P = [], Nn = [], U = [], S = [], L = [], Po = [], idx = [], n = 10;
  for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU, x = Math.cos(a) * 1.03, y = Math.sin(a) * 1.03; P.push(x, y, 0); Nn.push(0, 0, 1); U.push(x, y); S.push(3); L.push(99); Po.push(-1); }
  for (let i = 1; i < n - 1; i++) idx.push(0, i, i + 1);
  return finishGeo(P, Nn, U, S, L, Po, idx);
}

// Lay out the vine: seven arms from the fork, side branches, tendril spirals, leaf seats and bunch seats.
function layoutVine(rng, reach) {
  const arms = [], seats = [], hangs = [], tendrils = [];
  const walk = (x, z, y, head, len, w0, w1, wig, lam, curl, level) => {
    const pts = [], ws = [], hs = [], step = 5, n = Math.max(3, Math.round(len / step)), ph = rng() * TAU;
    for (let i = 0; i <= n; i++) {
      const s = i * step, f = i / n;
      const h = head + wig * Math.sin(s / lam + ph) * Math.min(1, s / 30) + curl * f * f;
      const yy = y + (level - y) * Math.min(1, s / 22) * Math.min(1, s / 22) * (3 - 2 * Math.min(1, s / 22));
      pts.push(new THREE.Vector3(x, yy, z)); ws.push(w0 + (w1 - w0) * Math.pow(f, 0.8)); hs.push(h);
      x += Math.cos(h) * step; z += Math.sin(h) * step;
    }
    return { pts, ws, hs };
  };
  const base = rng() * TAU;
  for (let a = 0; a < 7; a++) {
    const head = base + (a + (rng() - 0.5) * 0.45) * TAU / 7, level = 97.2 + ((a * 3) % 7) * 1.15;
    const len = reach * (0.74 + rng() * 0.26);
    const arm = walk(0, 0, FORK_Y + 0.5, head, len, 4.2, 1.5, 0.38 + rng() * 0.2, 26 + rng() * 14, (rng() - 0.5) * 0.7, level);
    arms.push(arm);
    const n = arm.pts.length, nb = 4 + Math.floor(rng() * 2);
    tendrils.push({ p: arm.pts[n - 1], h: arm.hs[n - 1], w: 1.5, r: 8 + rng() * 3, dir: rng() < 0.5 ? 1 : -1 });
    let sideSign = rng() < 0.5 ? 1 : -1;
    for (let b = 0; b < nb; b++) {
      const i = Math.floor(n * (0.16 + 0.68 * (b + 0.3 + rng() * 0.4) / nb)), p = arm.pts[i];
      const bl = 34 + rng() * 52 * (1 - 0.4 * i / n);
      const br = walk(p.x, p.z, p.y, arm.hs[i] + sideSign * (0.75 + rng() * 0.45), bl, arm.ws[i] * 0.62, 0.9, 0.3, 14 + rng() * 8, -sideSign * (0.5 + rng() * 0.8), level + 0.42 * (b + 1) * (b % 2 ? -1 : 1) * 0.5 + 0.3);
      arms.push(br);
      const m = br.pts.length;
      tendrils.push({ p: br.pts[m - 1], h: br.hs[m - 1], w: 0.9, r: 5 + rng() * 3, dir: -sideSign });
      sideSign = -sideSign;
    }
  }
  // the hoop and the brim: one wavy arm runs right round at three quarters of the reach, tying the seven arms into a
  // lattice, and from it shoots weep outward to the edge. Seen from the lip of the cup this is the wreath across the
  // kiln field; from the sea it is the crown of the vault.
  {
    const hoopR = reach * 0.767, n = 100, ph = rng() * TAU, pts = [], ws = [], hs = [];
    for (let i = 0; i <= n; i++) {
      const a = base + i / n * TAU, r = hoopR + 5.5 * Math.sin(a * 5 + ph);
      pts.push(new THREE.Vector3(Math.cos(a) * r, 99.4, Math.sin(a) * r)); ws.push(2.5); hs.push(a + Math.PI / 2);
    }
    arms.push({ pts, ws, hs });
    const NB = 13;
    for (let b = 0; b < NB; b++) {
      const a = base + (b + 0.25 + rng() * 0.5) / NB * TAU, r = hoopR + 5.5 * Math.sin(a * 5 + ph), sgn = b % 2 ? 1 : -1;
      const sh = walk(Math.cos(a) * r, Math.sin(a) * r, 99.4, a + sgn * (0.25 + rng() * 0.3), reach * (0.26 + rng() * 0.05), 2.3, 1.0, 0.3, 14 + rng() * 8, -sgn * (0.3 + rng() * 0.5), 99.8 + (b % 3) * 0.5);
      arms.push(sh);
      const m = sh.pts.length;
      tendrils.push({ p: sh.pts[m - 1], h: sh.hs[m - 1], w: 1.0, r: 5 + rng() * 2.5, dir: -sgn });
    }
  }
  // seats along every arm and branch: leaves alternate sides; bunches hang from beneath
  for (const arm of arms) {
    let side = rng() < 0.5 ? 1 : -1;
    for (let i = 2; i < arm.pts.length - 1; i++) {
      const p = arm.pts[i], h = arm.hs[i], w = arm.ws[i];
      const nl = rng() < 0.75 ? 2 : 1;
      for (let k = 0; k < nl; k++) {
        const along = (rng() - 0.5) * 4, yaw = h + side * (1.0 + rng() * 0.75);
        seats.push({ x: p.x + Math.cos(h) * along - Math.sin(h) * side * w * 0.4, y: p.y - 0.12 - rng() * 0.2, z: p.z + Math.sin(h) * along + Math.cos(h) * side * w * 0.4, yaw, s: 0.8 + rng() * 0.5, key: rng() });
        side = -side;
      }
      hangs.push({ x: p.x, y: p.y - 0.5, z: p.z, r: Math.hypot(p.x, p.z), key: rng(), drop: rng(), jit: rng(), ph: rng() });
    }
  }
  return { arms, seats, hangs, tendrils };
}

// ---------------------------------------------------------------------------------------------
// buildHero
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const style = opts.style || makeStyle(ctx, opts);
  const ownStyle = !opts.style;
  const detail = Math.min(1, Math.max(0.5, opts.detail ?? ctx.quality?.detail ?? 1));
  const reach = opts.reach ?? 292;
  const spin = opts.spin ?? 0.011;
  const object = new THREE.Group(); object.name = 'vine-ship';
  const turn = new THREE.Group(); object.add(turn);            // everything that turns with the ship
  const add = (mesh, parent = turn) => { mesh.frustumCulled = false; mesh.matrixAutoUpdate = true; parent.add(mesh); return mesh; };

  // --- the ship: one black slab with its drawing in a mask
  const mastPhase = rng() * TAU;
  const { geo: hullGeo, outline } = buildHullGeometry();
  await ctx.yield?.();
  const mask = await drawHullMask(ctx, rng, outline);
  await ctx.yield?.();
  const hullMat = style.slab({ mask, maskSize: [MASK.w, MASK.h], dry: 0.8, load: 58 + rng() * 14, strokeW: 5.5, wide: 0.12 });
  const hull = add(new THREE.Mesh(hullGeo, hullMat));
  const rigGeo = buildRig(mastPhase, (rng() < 0.5 ? -1 : 1) * (0.36 + rng() * 0.16));
  await ctx.yield?.();
  const rigMat = style.slab({ poses: 3, poseRate: 1.3, pingpong: true, dry: 0.5, load: 40, strokeW: 3, lineW: 0.13 });
  const rig = add(new THREE.Mesh(rigGeo, rigMat));

  // --- the vine: flat ribbon arms, tendrils that add one coil at a time
  const lay = layoutVine(rng, reach);
  await ctx.yield?.();
  const vineParts = [];
  let ai = 0;
  for (const arm of lay.arms) {
    vineParts.push(ribbonGeometry(arm.pts, arm.ws, { thick: 2.4, edgeSub: 1, u0: ai * 17 }));       // a strap: edge-on it is still 2.4 m of glaze, never a dotted line
    if (++ai % 8 === 0) await ctx.yield?.();
  }
  const COILS = 6;
  for (const t of lay.tendrils) {
    const px = -Math.sin(t.h) * t.dir, pz = Math.cos(t.h) * t.dir;            // toward the spiral's centre
    const cx = t.p.x + px * t.r, cz = t.p.z + pz * t.r;
    const a0 = Math.atan2(-pz, -px), turns = 2.55, per = 9;
    for (let k = 0; k < COILS; k++) {
      const pts = [], ws = [];
      for (let j = 0; j <= per; j++) {
        const f = (k + j / per) / COILS, a = a0 + t.dir * f * turns * TAU, rr = t.r * (1 - 0.86 * Math.pow(f, 0.8));
        pts.push(new THREE.Vector3(cx + Math.cos(a) * rr, t.p.y, cz + Math.sin(a) * rr)); ws.push(t.w * (1 - 0.5 * f));
      }
      vineParts.push(ribbonGeometry(pts, ws, { thick: 1.6, edgeSub: 1, pose: k }));
    }
    await ctx.yield?.();
  }
  // the fork: a boss where the seven arms leave the mast
  const boss = [];
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r = i % 2 ? 6.4 : 5.2; boss.push([Math.cos(a) * r, Math.sin(a) * r]); }
  const bossGeo = slabGeometry(boss, 1.6, {}); bossGeo.rotateX(-Math.PI / 2); bossGeo.translate(0, FORK_Y + 1.1, 0);
  vineParts.push(bossGeo);
  await ctx.yield?.();
  const vineGeo = mergeGeometries(vineParts, false);
  for (const g of vineParts) g.dispose();
  await ctx.yield?.();
  const vineMat = style.slab({ poses: COILS, poseRate: 0.9, grow: true, pingpong: true, dry: 0.7, load: 64, strokeW: 2.2 });
  const vine = add(new THREE.Mesh(vineGeo, vineMat));

  // --- leaves: five-lobed slabs tipping between two angles
  const leafGeo = buildLeafGeometry();
  await ctx.yield?.();
  const seats = lay.seats.slice().sort((a, b) => a.key - b.key);
  const nLeaf = Math.min(seats.length, Math.round((opts.leaves ?? 900) * detail));
  const leafMat = style.slab({ tip: true, poses: 2, poseRate: 0.9, dry: 0.35, load: 9, strokeW: 3, lineW: 0.07 });
  const leaves = add(new THREE.InstancedMesh(leafGeo, leafMat, nLeaf));
  const leafI = new Float32Array(nLeaf * 4);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v3 = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < nLeaf; i++) {
    const s = seats[i];
    q.setFromAxisAngle(Y, Math.PI / 2 - s.yaw); v3.set(s.x, s.y, s.z); sc.setScalar(s.s);
    leaves.setMatrixAt(i, m4.compose(v3, q, sc));
    leafI[i * 4] = s.key * 97; leafI[i * 4 + 1] = 0.5 + ((s.key * 7919) % 1); leafI[i * 4 + 2] = 0; leafI[i * 4 + 3] = 0;
    if (i % 300 === 299) await ctx.yield?.();
  }
  leafGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(leafI, 4));
  leaves.instanceMatrix.needsUpdate = true;
  await ctx.yield?.();

  // --- bunches: 160 triangles of forty purple discs, a white dot on every third grape, each on its stalk
  const hangs = lay.hangs.filter((h) => h.r > 46 && h.r < reach - 6).sort((a, b) => a.key - b.key);
  const chosen = [], wantB = Math.round((opts.bunches ?? 160) * detail);
  for (const h of hangs) {
    if (chosen.length >= wantB) break;
    let ok = true;
    for (const c of chosen) { const dx = c.x - h.x, dz = c.z - h.z; if (dx * dx + dz * dz < 19 * 19) { ok = false; break; } }
    if (ok) chosen.push(h);
  }
  await ctx.yield?.();
  const ROWS = [8, 7, 6, 5, 5, 4, 3, 2], PER = 41, GR = 0.84;
  const discGeo = buildDiscGeometry();
  const nDisc = chosen.length * PER;
  const discMat = style.slab({ dot: true, swing: true, dry: 0, dotR: 0.27 });
  const discs = add(new THREE.InstancedMesh(discGeo, discMat, nDisc));
  const dI = new Float32Array(nDisc * 4), dP = new Float32Array(nDisc * 4);
  const bx = new THREE.Vector3(), bz = new THREE.Vector3();
  let di = 0; const bunchInfo = [];
  for (let b = 0; b < chosen.length; b++) {
    const h = chosen[b];
    const stalk = 2.5 + h.drop * h.drop * Math.min(22, h.y - 12 - 61 - 2.5);
    const psi = Math.atan2(h.z, h.x) + Math.PI / 2 + (h.jit - 0.5) * 1.5;
    const rx = Math.cos(psi), rz = Math.sin(psi), top = h.y - stalk;
    bunchInfo.push({ x: h.x, z: h.z, top, bottom: top - 12 });
    const put = (ox, oy, sx, sy, flag) => {
      bx.set(rx * sx, 0, rz * sx); bz.set(-rz, 0, rx);
      m4.makeBasis(bx, v3.set(0, sy, 0), bz).setPosition(h.x + rx * ox, oy, h.z + rz * ox);
      discs.setMatrixAt(di, m4);
      dI[di * 4] = 0; dI[di * 4 + 1] = 1; dI[di * 4 + 2] = flag; dI[di * 4 + 3] = 0;
      dP[di * 4] = h.x; dP[di * 4 + 1] = h.y; dP[di * 4 + 2] = h.z; dP[di * 4 + 3] = h.ph * 40;
      di++;
    };
    put(0, h.y - stalk / 2 - 0.3, 0.3, stalk / 2 + 0.9, 2);
    let gi = 0;
    for (let r = 0; r < ROWS.length; r++) for (let i = 0; i < ROWS[r]; i++, gi++) {
      const ox = (i - (ROWS[r] - 1) / 2) * 1.5 + ((gi * 37 + b * 11) % 7 - 3) * 0.035;
      put(ox, top - 0.8 - r * 1.42 - ((gi * 13 + b) % 5) * 0.03, GR, GR, (gi + b) % 3 === 0 ? 1 : 0);
    }
    if (b % 24 === 23) await ctx.yield?.();
  }
  discGeo.setAttribute('aI', new THREE.InstancedBufferAttribute(dI, 4));
  discGeo.setAttribute('aPivot', new THREE.InstancedBufferAttribute(dP, 4));
  discs.instanceMatrix.needsUpdate = true;
  await ctx.yield?.();

  // --- the sea under it (opts.sea = false if the world lays its own), the kiln field, the mirrored set
  let sea = null, dome = null, mirror = null, well = null;
  if (opts.sea !== false) {
    const sg = new THREE.CircleGeometry(opts.seaRadius ?? 200, 128); sg.rotateX(-Math.PI / 2);
    sea = add(new THREE.Mesh(sg, style.sea({ outer: opts.seaRadius ?? 200 })), object); sea.renderOrder = 2;
    // the well under the sea: flat glaze behind the 70 percent night sea, so only the mirrored set shows through
    const wg = new THREE.CylinderGeometry(opts.seaRadius ?? 200, opts.seaRadius ?? 200, 150, 64, 1, false); wg.translate(0, -75.4, 0);
    well = add(new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: style.ink.glaze, side: THREE.BackSide, fog: false, toneMapped: false })), object);
  }
  if (opts.kiln ?? (ownStyle || DBG.kiln)) { dome = style.kilnDome(); object.add(dome); }
  if (opts.mirror || DBG.mirror) {
    mirror = new THREE.Group(); mirror.scale.set(1, -1, 0.985); turn.add(mirror);
    add(new THREE.Mesh(hullGeo, hullMat), mirror); add(new THREE.Mesh(rigGeo, rigMat), mirror);
  }
  await ctx.yield?.();

  // --- anchors (local space, before the slow turn of the ship; the arc is clear at any angle of the turn)
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ORBIT = 80, CAM_Y = 2.5, D2R = Math.PI / 180;
  const head = V(-Math.sin(140 * D2R), 0, Math.cos(140 * D2R)).normalize();          // heading at the start of the arc
  const arcStart = V(Math.cos(140 * D2R) * ORBIT, CAM_Y, Math.sin(140 * D2R) * ORBIT);
  const flyThrough = [arcStart.clone().addScaledVector(head, -120), arcStart.clone().addScaledVector(head, -60)];
  for (let a = 140; a <= 270; a += 13) flyThrough.push(V(Math.cos(a * D2R) * ORBIT, CAM_Y, Math.sin(a * D2R) * ORBIT));
  flyThrough.push(V(60, CAM_Y, -ORBIT), V(130, CAM_Y, -ORBIT));
  let lowest = 1e9; for (const b of bunchInfo) lowest = Math.min(lowest, b.bottom);
  const frontN = opts.frontNormal ? V(opts.frontNormal[0], 0, opts.frontNormal[1]).normalize() : head.clone();
  const frontFrom = opts.frontFrom ?? 130, frontTo = opts.frontTo ?? -420;
  const anchors = {
    flyThrough, orbitRadius: ORBIT, arcFrom: 140 * D2R, arcTo: 270 * D2R,
    ramTip: V(FX(63), 4.6, 0), eye: V(FX(45.2), 12.6, HULL_T / 2), sternTop: V(FX(-43), 55.5, 0), stemTop: V(FX(46.6), 49.4, 0),
    sailCenter: V(0, 56, 0), mastTop: V(0, FORK_Y, 0), railY: 22,
    canopy: { yMin: 96, yMax: 105.5, radius: reach + 12, lowestBunch: lowest },
    bunches: bunchInfo, frontNormal: frontN, frontFrom, frontTo,
    viewpoints: {
      entry: V(40, 122, 330), broadside: V(-20, 14, 150), underRam: V(-80, 2.5, 6), underSail: V(-30, 2.5, -74), under: V(30, 2.5, 60), far: V(150, 60, 420),
    },
  };

  // --- the reversal: hero.setReversal(x), x 0..1, carries the line from frontFrom to frontTo along frontNormal
  let frontD = DBG.front ?? opts.front ?? 4, driveFront = ownStyle || DBG.front != null || opts.front != null;
  const wn = new THREE.Vector3(), wo = new THREE.Vector3(), nm = new THREE.Matrix3();
  const applyFront = () => {
    object.updateWorldMatrix(true, false);
    wn.copy(frontN).applyMatrix3(nm.setFromMatrix4(object.matrixWorld)); wn.y = 0;
    const l = wn.length() || 1; wn.divideScalar(l); wo.setFromMatrixPosition(object.matrixWorld);
    style.setFront(wn.x, wn.z, frontD * l + wo.x * wn.x + wo.z * wn.z, opts.frontWidth ?? 2.5);
  };
  let R = 66, H = 106, center = V(0, 48, 0);          // radius = the ship; the canopy is anchors.canopy.radius
  if (DBG.close === 1) { R = reach + 12; } else if (DBG.close === 2) { R = 30; H = -75; center = V(0, 40, 0); } else if (DBG.close === 3) { R = 14; H = 10; center = V(-38, 14, 0); } else if (DBG.close === 4) { R = 150; H = 150; } else if (DBG.close === 5) { R = 40; H = -165; center = V(0, 85, 0); }
  return {
    object, radius: R, height: H, center, anchors, style, ground: false, groundY: 0,
    parts: { turn, hull, rig, vine, leaves, discs, sea, well, dome, mirror },
    setFront(d) { frontD = d; driveFront = true; },
    setReversal(x) { const t = Math.min(1, Math.max(0, x)); frontD = frontFrom + (frontTo - frontFrom) * t; driveFront = true; },
    setProgress(u) { const a = opts.reverseFrom ?? 0.56, b = opts.reverseTo ?? 0.635; this.setReversal((u - a) / Math.max(b - a, 1e-4)); },
    update(dt, time, camera) {
      turn.rotation.y = spin * time;
      if (ownStyle) style.update(dt, time, camera);
      if (driveFront) applyFront();
    },
    dispose() { if (ownStyle) style.dispose(); mask.dispose(); },
  };
}

// Debug flags for the set-piece viewer only (?wdcKiln=1&wdcFront=-40&wdcClose=1|2|3&wdcMirror=1); no effect in a world.
const DBG = (() => {
  try {
    const q = new URLSearchParams(globalThis.location?.search || '');
    const num = (k) => (q.get(k) == null ? null : Number(q.get(k)));
    return { kiln: q.get('wdcKiln') === '1', mirror: q.get('wdcMirror') === '1', front: num('wdcFront'), close: num('wdcClose') };
  } catch (e) { return {}; }
})();
