// WHERE THE HORSES ARE BLUE: hero set piece. After Franz Marc (1880 to 1916); walks into "The Tower of Blue Horses", 1913.
// The tower: four ultramarine horses standing one above another on a stair of red and violet backs, the lowest with the
// pale crescent on its breast and five stars down its flank; behind, a red hill and a yellow hill cut from the horse's own
// topline, one yellow arc of cloud over the port shoulder, one green wedge of light leaning across all of it.
//
// HOW THE STYLE IS MADE (use these for the whole world, so the hero is not pasted in)
//   makeStyleUniforms(palette)  one uniform set for every material: uTime, the deep/hue/light/neighbour tables per hue index,
//                               uLine, uViewH, uStride (gallop phase in cycles = distance / 38), uLiftTop. Pass it back in as
//                               opts.uniforms, or read hero.uniforms. Call hero.update(dt, time, camera) every frame.
//   STYLE_COMMON_GLSL / STYLE_GLSL  the paint. bandPaint(hueIx, s, a, across, seed) is the ONE shading routine: unlit; colour =
//                               deep -> hue -> light partner over s (0 at the contour, 1 at the crown), the crown sliding along
//                               the arc with time (uHeave scales its speed, uCrownK its wavelength per metre), a brush drag
//                               streaked along a, and a neighbour hue dragged over the edge in patches. lineKeep() breaks lines.
//   HULL_GLSL                   hullWidth(): the contour is an inverted hull pushed along the normal in world space, 0.08 m
//                               wobbled, never under 1.7 px, never over 0.6 percent of frame height.
//   HORSE_GLSL                  horsePose(): gait, breath, ear flick, tail, neck about pivots stored per vertex (no skeleton).
//   bandMaterial(U, { horse, heave, crownK, hullWidth, side, liteCap })   the one material (crownK about 5 / the band's length
//                               in metres; heave 1/3 for hills; liteCap 0.8 on animals so the hue stays the hue). The paint is
//                               three loads of the brush (deep, hue, a flat matte light swell) meeting in dragged edges, no ramp.
//                               Lobes are [angle, half width, strength]: one light swell off centre over a plateau of the hue.
//   makeBandGeo / loftBand / finishBandGeo / curveOf / capProfile   the lofter: every form is one swept arc. loftBand paints
//                               aBand = (hue index, s, a in metres, across in metres) and aPart = (kind, limb, weight, hull)
//                               and appends the hull as reversed triangles in the SAME geometry (one draw, FrontSide).
//   makeHorseGeometry({ lod, side }) / makeHorseGeometryAsync(opts, ctx.yield)   the unit horse (withers y = 1; scale 9 herd,
//                               14 tower). lod 1 = 2,770 triangles + as many of hull; lod 0.6 = 1,380 + hull; tower uses 1.5.
//                               Instance it with aInst = (stride phase offset, gallop 0..1, neck lowered rad, seed) and
//                               aInst2 = (marks 0|1, hue override or -1, head-lift mask, 0) as InstancedBufferAttributes.
//   addHillBack(G, {...}) / horseTopline(u)   a ridge whose crest is the horse's back, scaled.
//   makeWedgeGeometry(W, L) / wedgeMaterial(U, hex, { W, L, phase, strength, on })   a leaning slab of tinted air that
//                               multiplies what is behind it; uniforms.uWedgeOn hides it. Draw last (renderOrder 50).
//   PALETTE, HUE, pig(hex), makeBandTable   exact colour: the world returns post.flat = 1, so a hex written is the hex shown.
//
// buildHero(ctx, opts): opts.palette (7 hex), opts.detail (0.6..1, thins bushes), opts.uniforms (shared style uniforms),
//   opts.mirror (true flips the tower in X: heads bow to +X, marked flank and pass side on -X), opts.ground (false: no pasture
//   mound), opts.backdrop (false: no red/yellow hill and cloud arc; build your own with addHillBack), opts.wedge (false).
//   opts.lod (1.5: mesh density of the four horses; the world passes 1.75 for the 7 m pass).
// Local frame: origin at the foot centre, +Y up, front +Z. Seen from the front the heads bow to the viewer's LEFT (-X) and the
//   crescent/stars and the 7 m pass are on the viewer's RIGHT (+X). Lowest hooves at y 9, top ears about y 68; radius 32
//   (crag foot about 55; hills at z -150 and -420 when backdrop is on). Expects pasture at about y 0 to 3 round the foot.
// Returns { object, radius, height, center, anchors, uniforms, horses (InstancedMesh, 4), horseGeometry, horseMaterial,
//   bandMaterial, layout, wedge, setProgress(u), update, dispose }.
// anchors (local): ledges[4] { position, yaw, scale } (hooves of each horse); closestPass (camera point 7 m off the marked
//   flank); flyThrough (9 points: approach from the front right, past breast and flank, round the rump end, climbing behind;
//   6 m clear of everything); viewpoints { reveal, front, closest, behind }; top (ears); wedge { position, lean, width, length };
//   cloudArc { center, radius }. No portal seat: the portal is 640 m further on.
// Motion: the paint slides on every band from the first frame (uTime); flanks breathe, ears flick, tails swish, weight
//   shifts; the top horse lifts its head: on a slow cycle, or once between u 0.12 and 0.36 after setProgress(u).
// Cost: about 71k triangles, 5 draw calls (horses, crag, pasture, hills, wedge), no lights, no textures, build about 80 ms.
import * as THREE from 'three';

export const PALETTE = ['#1B3FA6', '#5B8FD9', '#D8341F', '#F2C21B', '#1E8C55', '#6A3B8F', '#14183A'];
// hue indices of the band material (aBand.x)
export const HUE = { BLUE: 0, LBLUE: 1, RED: 2, YELLOW: 3, GREEN: 4, VIOLET: 5, LINE: 6, PALE: 7 };

// exact colour: post.flat = 1, so the linear value of a hex IS the hex on screen. No inverse tone map.
export function pig(hex) { return new THREE.Color(hex); }
const mixc = (a, b, t) => a.clone().lerp(b, t);

// deep / hue / light triples per hue index (styleNote (2): light partners), from the seven pigments only.
export function makeBandTable(palette = PALETTE) {
  const [B, LB, R, Y, G, V, K] = palette.map(pig), W = new THREE.Color(1, 1, 1);
  const deep = [mixc(B, K, 0.62), mixc(B, LB, 0.25), mixc(R, V, 0.62), mixc(Y, R, 0.5), mixc(G, K, 0.5), mixc(V, K, 0.55), K.clone(), LB.clone()];
  const hue = [B, LB, R, Y, G, V, K, mixc(LB, W, 0.22)].map((c) => c.clone());
  const lite = [LB.clone(), mixc(LB, W, 0.4), Y.clone(), mixc(Y, W, 0.4), mixc(G, Y, 0.8), LB.clone(), mixc(K, B, 0.3), mixc(LB, W, 0.4)];
  const nbr = [mixc(G, B, 0.35), B, V, R, Y, R, K, LB].map((c) => c.clone());
  return { deep, hue, lite, nbr };
}

// one set of uniforms for the whole world: every band, hull and wedge material made here shares these objects.
export function makeStyleUniforms(palette = PALETTE) {
  const t = makeBandTable(palette);
  return {
    uTime: { value: 0 },
    uDeep: { value: t.deep }, uHue: { value: t.hue }, uLite: { value: t.lite },
    uLine: { value: pig(palette[6]) }, uNbr: { value: t.nbr },
    uViewH: { value: 450 },      // drawing buffer height in pixels (contour width limits)
    uLiteCap: { value: 0.94 },   // how far a crown goes to its light partner (animals less: bandMaterial({ liteCap }))
    uHeave: { value: 1 },        // speed of the sliding crown (hills pass 1/3 through the factory)
    uStride: { value: 0 },       // gallop stride phase in cycles, common to the herd (distance / 38 m)
    uLiftTop: { value: 0 },      // head lift (radians) of the horses whose aInst2.z is 1
    uGreen: { value: pig(palette[4]) }, uViolet: { value: pig(palette[5]) },
  };
}

// ---- GLSL: the paint -------------------------------------------------------------------------------------------
// bandPaint(hue index, s, a, across, seed): the one shading routine. s = 0 at the contour, 1 at the crown.
export const STYLE_COMMON_GLSL = /* glsl */`
uniform float uTime, uHeave, uCrownK, uLiteCap;
uniform vec3 uDeep[8], uHue[8], uLite[8], uNbr[8];
uniform vec3 uLine, uGreen, uViolet;
float mHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float mNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mHash(i), mHash(i + vec2(1., 0.)), f.x), mix(mHash(i + vec2(0., 1.)), mHash(i + vec2(1., 1.)), f.x), f.y); }
`;
// fragment only (uses fwidth): STYLE_GLSL = common + bandPaint + lineKeep
export const STYLE_GLSL = STYLE_COMMON_GLSL + /* glsl */`
// brush drag: streaks long along the arc (a), narrow across; fades to its average when finer than ~3 px
float mDrag(float a, float across, float seed, float fw){
  // each grain of the bristles gives way by itself when it is finer than about 3 px (the fine one first): never a stipple
  float n1 = mNoise(vec2(a * 0.22 + seed * 7.1, across * 5.5 + seed * 3.3)) - 0.5, n2 = mNoise(vec2(a * 0.6 + seed, across * 13. - seed * 5.)) - 0.5;
  return n1 * 0.65 * (1. - smoothstep(0.06, 0.18, fw)) + n2 * 0.35 * (1. - smoothstep(0.02, 0.06, fw));
}
// bandPaintW: the same with the screen-space width of s and of across given by the caller (for s that jumps from one
// back to the next, where fwidth would spike along every crest)
vec3 bandPaintW(float hueIx, float s, float a, float across, float seed, float fw0, float fw){
  int i = int(clamp(hueIx + 0.5, 0., 7.));
  vec3 deep = uDeep[i], hue = uHue[i], lite = uLite[i];
  float drag = mDrag(a, across, seed, fw) * (1. - smoothstep(0.25, 0.8, fwidth(a)));   // (a flank seen end on: the streaks along it are finer than a pixel and would stipple)
  // the crown slides along the arc and back, like muscle under a hide
  float slide = 2.4 * sin(uTime * 0.6 * uHeave + seed * 6.283);
  float crown = 0.79 + 0.21 * sin(a * uCrownK + slide + seed * 4.);
  float fs = min(fw0, 0.2);
  float sc = clamp(s * crown + drag * 0.2, 0., 1.), sl = clamp(sc + drag * 0.16, 0., 1.);
  // three loads of the brush: the deep along the contour, the hue, the light swell. Each meets the next in a crisp step
  // whose border the drag of the bristles makes ragged (a ramp reads as gloss); finer than a few pixels the steps soften (fs)
  float tDeep = 0.25 * smoothstep(0.0, 0.2, sc) + 0.75 * smoothstep(0.125 - fs, 0.15 + fs, sc);
  float tLite = 0.3 * smoothstep(0.515 - fs, 0.54 + fs, sl) + 0.7 * smoothstep(0.655 - fs, 0.68 + fs, sl);   // a flat matte swell with one half-tone rim, no bright core
  // a form only a few pixels across is one solid load of its hue: far horses and far backs stay at full pigment strength
  float small = smoothstep(0.03, 0.09, fw0);
  tDeep = mix(tDeep, 0.84 + 0.16 * tDeep, small); tLite *= 1. - 0.6 * small;
  vec3 c = mix(deep, hue, tDeep);
  c = mix(c, lite, tLite * uLiteCap);
  // the hand's fault: a neighbour hue dragged a hand's width over the edge, in patches along the arc
  float dragPatch = smoothstep(0.60, 0.68, mNoise(vec2(a * 0.11 + seed * 31., seed * 17.)));
  float edge = (1. - smoothstep(0.03, 0.13 + drag * 0.08, s)) * dragPatch;
  c = mix(c, uNbr[i], edge * 0.6 * (1. - smoothstep(0.03, 0.09, fw0)));      // (not on forms a few pixels across: it would speckle)
  c = mix(c, drag > 0. ? lite : deep, abs(drag) * 0.2 * smoothstep(0.1, 0.3, sc));   // the brush, loaded unevenly: streaks of the light and of the deep along the arc
  c *= 1. + drag * 0.07;                       // the 3 percent drag of the bristles
  return c;
}
// Rows of overlapping backs laid over a sheet (x metres along, zr rows up). Each back is an arc whose crest bows toward
// +zr; it stands over the row behind and is covered by the row in front, and within a row one back overlaps its neighbour.
// Returns how far (in rows) the pixel lies below the crest of the back that owns it; id is that back's lot, slope the
// crest's slope (rows per metre) for the hairline. No derivative is taken in here.
float backRows(float x, float zr, float D, float salt, out float id, out float slope){
  const float H = 1.75;
  float r0 = ceil(zr - H), dWin = 0., hit = 0.; id = 0.; slope = 0.;
  for (int k = 0; k < 4; k++) {
    float row = r0 + float(k);
    float Lc = D * (3.4 + 2.8 * mHash(vec2(row, 7.3 + salt))), o = mHash(vec2(row, 3.7 + salt)) * 900.;
    float g = (x + o) / Lc, ci0 = floor(g), nb = g - ci0 < 0.5 ? -1. : 1.;
    float pa = mHash(vec2(row * 1.3 + ci0, 1.9 + salt)), pb = mHash(vec2(row * 1.3 + ci0 + nb, 1.9 + salt));
    for (int j = 0; j < 2; j++) {
      float ci = (j == 0 ? pa > pb : pa <= pb) ? ci0 : ci0 + nb;
      float hk = mHash(vec2(ci * 2.3 + 5.1, row * 1.7 + 0.3 + salt));
      float xc = (ci + 0.36 + 0.28 * hk) * Lc - o, Rw = Lc * (0.62 + 0.14 * fract(hk * 7.7));
      float e = (x - xc) / Rw, ht = H * (0.72 + 0.28 * fract(hk * 13.1));
      float d = row + ht * (1. - e * e) * (1. - 0.22 * e) - 0.35 - zr;
      if (hit < 0.5 && d > 0.) { hit = 1.; dWin = d; id = hk; slope = abs(ht * (2. * e + 0.22 * (1. - 3. * e * e)) / Rw); }
    }
  }
  return dWin;
}
vec3 bandPaint(float hueIx, float s, float a, float across, float seed){ return bandPaintW(hueIx, s, a, across, seed, fwidth(s), fwidth(across) + 1e-5); }
// broken hairline: 1 = draw the contour, 0 = the fifth of its length where the hand lifts
float lineKeep(float a, float seed){
  float n = mNoise(vec2(a * 0.16 + seed * 13.7, seed * 5.1));
  return step(0.2, n);
}
`;

// vertex helper shared by everything that carries a contour hull: world-space push along the normal, held
// between 1.5 px and 0.6 percent of frame height.
export const HULL_GLSL = /* glsl */`
uniform float uViewH, uHullFar;
float hullWidth(float base, float viewDepth, float wob){
  float px = 2. * max(viewDepth, 0.1) / max(projectionMatrix[1][1] * uViewH, 1.);   // metres per pixel at this depth
  float w = base * wob;
  // uHullFar 1 (animals): a body only a few pixels across is drawn without its line, as one load of paint, so that a far
  // horse stays ultramarine and does not go navy under its own contour
  return clamp(w, 1.7 * px, max(1.8 * px, 0.006 * uViewH * px)) * (1. - step(1e-3, uHullFar) * smoothstep(0.3, 0.62, px * uHullFar));   // uHullFar: 0 never, else 21 / the animal's height in metres
}
`;

// ---- GLSL: the horse's pose (no skeleton: parts turn about pivots stored per vertex) --------------------------------
// aPart = (kind, limb phase | ear amount, weight, hull)   kind 0 body, 1 neck chain, 2 upper leg, 3 lower leg, 4 tail
// aInst = (stride phase offset, gallop 0..1, neck lowered in radians, seed 0..1)      per instance
// aInst2 = (marks 0|1, hue override or -1, head-lift mask, spare)                     per instance
export const HORSE_GLSL = /* glsl */`
uniform float uStride, uLiftTop;
void rotX(inout vec3 p, inout vec3 n, vec3 piv, float ang){
  float c = cos(ang), s = sin(ang); vec3 q = p - piv;
  p = piv + vec3(q.x, q.y * c - q.z * s, q.y * s + q.z * c);
  n = vec3(n.x, n.y * c - n.z * s, n.y * s + n.z * c);
}
void horsePose(inout vec3 p, inout vec3 n, vec4 part, vec3 piv, vec3 piv2, vec4 inst, vec4 inst2){
  float kind = part.x, g = inst.y, seed = inst.w, w = part.z;
  float ph0 = (uStride + inst.x) * 6.2831853;
  float t = uTime;
  if (kind < 0.5) {                                   // body: the flank swells and sinks
    p += n * w * 0.02 * sin(t * 0.9 + seed * 6.283);
  } else if (kind < 1.5) {                            // neck, head, mane, ears
    float flick = max(0., sin(t * 0.61 + seed * 40.)); flick = flick * flick; flick = flick * flick; flick = flick * flick;
    p.z -= part.y * 0.07 * flick * sin(t * 9.);
    float ang = inst.z - uLiftTop * inst2.z + 0.025 * sin(t * 0.47 + seed * 9.) - g * (0.2 + 0.05 * sin(ph0 + 1.2));
    rotX(p, n, piv, ang * w);
  } else if (kind < 3.5) {                            // legs
    float ph = ph0 + part.y * 6.2831853;
    float hind = piv.z > 0. ? 1. : -1.;
    // in the run the legs are drawn long under the heavy haunch: stretched down from the hip (the body is lifted to match below)
    float lk = 1. + 0.15 * g; p.y = piv.y + (p.y - piv.y) * lk; piv2.y = piv.y + (piv2.y - piv.y) * lk;
    float st = sin(seed * 31. + part.y * 17.);                                        // standing: no two legs parallel, a decided angle at knee and hock
    float A = -0.62 * sin(ph) * g + (0.03 * sin(t * 0.31 + seed * 5. + part.y * 6.283) + 0.085 * st) * (1. - g);
    if (kind > 2.5) { float K = hind * (1.25 * g * max(0., cos(ph)) + (0.16 + 0.1 * st) * (1. - g)); rotX(p, n, piv2, K * w); }
    rotX(p, n, piv, A);
  } else {                                            // tail: hangs and swishes, streams in the gallop
    p.x += sin(t * 1.3 + seed * 9. - w * 2.2) * w * w * 0.11 * (1. - g);
    rotX(p, n, piv, w * (g * (0.5 + 0.1 * sin(ph0 * 2. - w * 3.)) + 0.05 * sin(t * 0.8 + seed * 3.) * (1. - g)));
  }
  // the whole body rocks once a stride
  vec3 c0 = vec3(0., 0.75, 0.);
  rotX(p, n, c0, 0.075 * g * sin(ph0 + 0.6));
  p.y += 0.055 * g * sin(ph0 - 0.4) + 0.105 * g;
}
`;

const BAND_VERT = /* glsl */`
attribute vec4 aBand, aPart;
#ifdef HORSE
attribute vec3 aPiv, aPiv2;
attribute vec4 aInst, aInst2;
varying vec4 vInst2; varying vec3 vRest; varying float vKind;
#endif
uniform float uHullW;
#ifdef SWAY
uniform float uSway;
#endif
varying vec4 vBand; varying float vHull, vSeed, vFace;
#ifdef FLANK
varying float vTop;
#endif
void main(){
  vec3 p = position, n = normal;
  #ifdef FLANK
  vTop = aPart.z;
  #endif
  float seed = aPart.y;
  #ifdef HORSE
  seed = aInst.w; vInst2 = aInst2; vRest = position; vKind = aPart.x;
  horsePose(p, n, aPart, aPiv, aPiv2, aInst, aInst2);
  #endif
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
  mm = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = mm * vec4(p, 1.);
  #ifdef SWAY
  {                                                   // leaf fans nod in order along the course (aPart.z: 0 root, 1 tip)
    vec3 o = mm[3].xyz; seed = fract(seed + dot(o.xz, vec2(0.137, 0.291)));
    float ph = uTime * 1.25 - o.z * 0.045 + o.x * 0.02, k = aPart.z * aPart.z;
    wp.xz += vec2(sin(ph), cos(ph * 0.83)) * k * uSway; wp.y -= k * uSway * 0.5 * (0.5 + 0.5 * sin(ph));
  }
  #endif
  vec3 wn = mat3(mm) * n; wn = wn / max(length(wn), 1e-6);
  vec4 vp = viewMatrix * wp;
  { vec3 tv = wp.xyz - cameraPosition; vFace = dot(wn, tv) / max(length(tv), 1e-4); }   // under 0: the surface here faces the lens
  if (aPart.w > 0.5) {
    float wob = 0.62 + 0.9 * mNoise(vec2(aBand.z * 0.21 + seed * 11., seed * 3.7));
    wp.xyz += wn * hullWidth(uHullW, -vp.z, wob);
    vp = viewMatrix * wp;
  }
  vBand = aBand; vHull = aPart.w; vSeed = seed;
  gl_Position = projectionMatrix * vp;
}`;

const BAND_FRAG = /* glsl */`
varying vec4 vBand; varying float vHull, vSeed, vFace;
#ifdef FLANK
varying float vTop; uniform float uFlankD, uViewH;
#endif
#ifdef EDGE
uniform float uEdgeW;
#endif
#ifdef HORSE
varying vec4 vInst2; varying vec3 vRest; varying float vKind;
uniform float uSide;
float starIn(vec2 q, float R){
  float ang = (dot(q, q) < 1e-10 ? 0. : atan(q.y, q.x)) + 1.5708;
  float a = abs(mod(ang, 1.2566371) - 0.6283185), rho = length(q);
  vec2 pt = rho * vec2(cos(a), sin(a)), T = vec2(R, 0.), I = R * 0.42 * vec2(0.809, 0.588), e = I - T;
  return (e.x * (pt.y - T.y) - e.y * (pt.x - T.x)) / max(length(e), 1e-5);
}
#endif
void main(){
  // the contour is the far shell seen past the form's edge. Where a great back folds through itself the shell turns its face to
  // the lens over a whole patch (it stood as a dark spike on the hill): there, and on the near side of two-sided hills, it is left out.
  if (vHull > 0.5) { if (!gl_FrontFacing || vFace < -0.2 || lineKeep(vBand.z, vSeed) < 0.5) discard; gl_FragColor = vec4(uLine, 1.); return; }
  float hueIx = vBand.x, s = vBand.y;
  #ifdef HORSE
  if (vInst2.y > -0.5 && hueIx < 0.5) hueIx = vInst2.y;
  #endif
  #ifdef FLANK
  // a hill's flank is not one flat tone: it is rows of smaller backs standing one over another up to the crest, each with
  // its deep edge, its light swell and its hairline (rows finer than 3 px give way to the plain back)
  float zr = -abs(vBand.w - vTop) / uFlankD, fz = fwidth(zr), fx = fwidth(vBand.z), fid, fsl;
  // the lot that lays out the rows is the part's seed, a whole number of 256ths (addHillBack): rounded here, because a varying that
  // is the same at all three corners still wavers in its last bits from pixel to pixel, and a hash turns that into a stipple
  float fd0 = backRows(vBand.z, zr, uFlankD, floor(vSeed * 256. + 0.5) * (37. / 256.), fid, fsl);
  float fd = max(fz + fsl * fx, 1e-5);
  // (a flank seen end on: its rows are crossed along their length faster than three pixels a row, and they give way too)
  float fkeep = (1. - smoothstep(0.07, 0.15, fd)) * smoothstep(0.45, 1.1, -zr);
  float s2 = pow(smoothstep(0., 0.42, fd0), 0.8) * (1. - 0.72 * smoothstep(0.42, 0.85, fd0));
  s = mix(s, max(s2, 0.03) * (0.45 + 0.55 * smoothstep(0.02, 0.2, s)), fkeep);
  #endif
  #ifdef FLANK
  vec3 c = bandPaintW(hueIx, s, vBand.z, vBand.w, vSeed, mix(fwidth(vBand.y), 2.5 * fd, fkeep), fz * uFlankD + 1e-5);
  {
    float wA = clamp(0.3 / uFlankD / fd, 0.9, max(1.2, 0.006 * uViewH));
    c = mix(c, uLine, (1. - smoothstep(wA, wA + 1., fd0 / fd)) * lineKeep(vBand.z * 0.7 + fid * 90., vSeed) * fkeep);
  }
  #else
  vec3 c = bandPaint(hueIx, s, vBand.z, vBand.w, vSeed);
  #endif
  #ifdef HORSE
  // the patch of reflected colour under the belly
  float belly = (1. - smoothstep(0.515, 0.555, vRest.y + 0.05 * (mNoise(vec2(vBand.z * 0.5, vSeed * 9.)) - 0.5))) * step(vKind, 0.5) * step(vBand.x, 0.5) * step(abs(vRest.z + 0.04), 0.36);
  c = mix(c, mix(uGreen, uViolet, step(0.5, fract(vSeed * 7.3))), belly * 0.45);
  if (vInst2.x > 0.5 && vKind < 0.5) {               // the picture's own marks: crescent on the breast, stars down the flank
    float aa = fwidth(vRest.y) * 1.2 + 1e-5, m = 0.;
    if (vRest.z > 0.40) {
      vec2 q = vec2(vRest.x * uSide, vRest.y) - vec2(0.015, 0.79);
      float d1 = 0.118 - length(q), d2 = length(q - vec2(0.050, 0.030)) - 0.104;
      m = smoothstep(0., aa, min(d1, d2));
    } else if (vRest.x * uSide > 0.08) {
      vec2 zy = vRest.zy; float d = -1.;
      d = max(d, starIn(zy - vec2(0.270, 0.930), 0.060));
      d = max(d, starIn(zy - vec2(0.110, 0.860), 0.050));
      d = max(d, starIn(zy - vec2(-0.050, 0.800), 0.056));
      d = max(d, starIn(zy - vec2(-0.170, 0.715), 0.044));
      d = max(d, starIn(zy - vec2(-0.480, 0.720), 0.054));
      m = smoothstep(0., aa, d);
    }
    c = mix(c, bandPaint(7., 0.55 + 0.4 * s, vBand.z, vBand.w, vSeed + 0.37), m);
  }
  #endif
  #ifdef EDGE
  {                                                   // flat blades carry no hull: the hairline is drawn from s
    float fe = fwidth(s) * 1.5 + 1e-5, w0 = max(uEdgeW, fe);
    c = mix(c, uLine, (1. - smoothstep(w0, w0 + fe, s)) * lineKeep(vBand.z * 3. + vSeed * 40., vSeed));
  }
  #endif
  gl_FragColor = vec4(c, 1.);
}`;

// The ONE material of the world. opts: { horse: bool (gait + per-instance attributes), heave: crown speed factor
// (hills 1/3), hullWidth: metres (0.08), sway: metres (leaf fans nod; aPart.z = 0 root .. 1 tip), edge: s width of a
// hairline drawn in the fragment for flat blades without a hull }. Unlit, opaque, no fog, no lights. Geometry needs aBand and aPart.
export function bandMaterial(U, opts = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...U, uHeave: opts.heave !== undefined ? { value: opts.heave } : U.uHeave, uLiteCap: opts.liteCap !== undefined ? { value: opts.liteCap } : U.uLiteCap, uHullW: { value: opts.hullWidth ?? 0.08 }, uSide: { value: opts.side ?? 1 }, uCrownK: { value: opts.crownK ?? 0.55 },
      uSway: { value: opts.sway ?? 0 }, uEdgeW: { value: opts.edge ?? 0.07 }, uHullFar: { value: opts.hullFar ?? (opts.horse ? 1 : 0) }, uFlankD: { value: opts.flank || 30 } },
    defines: { ...(opts.horse ? { HORSE: 1 } : {}), ...(opts.flank ? { FLANK: 1 } : {}), ...(opts.sway ? { SWAY: 1 } : {}), ...(opts.edge ? { EDGE: 1 } : {}) },
    vertexShader: STYLE_COMMON_GLSL + HULL_GLSL + (opts.horse ? HORSE_GLSL : '') + BAND_VERT,
    fragmentShader: STYLE_GLSL + BAND_FRAG,
    side: opts.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });
  return m;
}

// ---- the band lofter: every form in this world is one swept arc ------------------------------------------------------
// A BandGeo collects parts; loftBand() sweeps an elliptical section along a curve and paints the two coordinates into
// each vertex: s (0 at the contour, 1 at the crown; from lobes given per part, never from a light) and a (metres along).
export function makeBandGeo() { return { pos: [], nor: [], band: [], part: [], piv: [], piv2: [], idx: [], n: 0 }; }
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _t = new THREE.Vector3(), _n1 = new THREE.Vector3(), _n2 = new THREE.Vector3();
export function curveOf(pts) { const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.5); return (t, out) => c.getPoint(t, out); }
export const capProfile = (t, c0 = 0.2, c1 = 0.2) => {
  let k = 1;
  if (c0 > 0 && t < c0) { const x = 1 - t / c0; k *= Math.sqrt(Math.max(0, 1 - x * x)); }
  if (c1 > 0 && t > 1 - c1) { const x = 1 - (1 - t) / c1; k *= Math.sqrt(Math.max(0, 1 - x * x)); }
  return k;
};
const DEF_LOBES = [[0.38, 1.35], [Math.PI - 0.38, 1.35]];
// o: { at(t,out) | pts, rad(t)->[ra,rb], ref:[x,y,z], hue, lobes:[[theta,width]..], ends:[e0,e1], nSeg, nRing, kind, limb,
//      weight(t), piv, piv2, hull, unit (metres per unit, for a), sFloor, a0 }
export function loftBand(G, o) {
  const at = o.at || curveOf(o.pts), nSeg = o.nSeg, nRing = o.nRing, unit = o.unit ?? 1;
  const ref = new THREE.Vector3().fromArray(o.ref || [0, 1, 0]), lobes = o.lobes || DEF_LOBES, ends = o.ends || [0.14, 0.14];
  const piv = o.piv || [0, 0, 0], piv2 = o.piv2 || piv, hull = o.hull !== false;
  const kindOf = typeof o.kind === 'function' ? o.kind : null;
  let flip = 0;
  const frame = (t, C, N1, N2) => {
    const h = 0.004; at(Math.min(1, t + h), _a); at(Math.max(0, t - h), _b); at(t, C);
    _t.subVectors(_a, _b); if (_t.lengthSq() < 1e-12) _t.set(0, 0, 1); _t.normalize();
    N2.copy(ref).addScaledVector(_t, -ref.dot(_t)); if (N2.lengthSq() < 1e-10) N2.set(1, 0, 0); N2.normalize();
    N1.crossVectors(N2, _t).normalize();
    if (!flip) flip = N1.x < -1e-4 ? -1 : 1;
    if (flip < 0) N1.negate();
  };
  const sq = o.sq ?? 1, sp = (v) => (sq === 1 ? v : Math.sign(v) * Math.pow(Math.abs(v), sq));
  const mk = () => ({ C: new THREE.Vector3(), N1: new THREE.Vector3(), N2: new THREE.Vector3(), r: [0, 0] });
  const F = mk(), Fa = mk(), Fb = mk();
  const setF = (t, f) => { frame(t, f.C, f.N1, f.N2); const r = o.rad(t); f.r[0] = r[0]; f.r[1] = r[1]; };
  const surf = (f, th, out) => out.copy(f.C).addScaledVector(f.N1, f.r[0] * sp(Math.cos(th))).addScaledVector(f.N2, f.r[1] * sp(Math.sin(th)));
  const P = new THREE.Vector3(), Pt0 = new THREE.Vector3(), Pt1 = new THREE.Vector3(), Pa = new THREE.Vector3(), Pb = new THREE.Vector3(), N = new THREE.Vector3(), C0 = new THREE.Vector3();
  const base = G.n, row = nRing + 1; let arc = o.a0 || 0; const prev = new THREE.Vector3();
  const th0 = o.seam ?? -Math.PI / 2;                      // the seam of the across coordinate sits under the part
  let rAcross = 0.02; for (let i = 0; i <= 8; i++) { const r = o.rad(i / 8); rAcross = Math.max(rAcross, (r[0] + r[1]) * 0.5); }   // strokes run true along the arc
  for (let i = 0; i <= nSeg; i++) {
    const t = i / nSeg, ht = 0.01;
    setF(t, F); setF(Math.min(1, t + ht), Fa); setF(Math.max(0, t - ht), Fb);
    const rm = (F.r[0] + F.r[1]) * 0.5;
    C0.copy(F.C); if (i > 0) arc += C0.distanceTo(prev) * unit; prev.copy(C0);
    const eF = (ends[0] > 0 ? THREE.MathUtils.smoothstep(t, 0, ends[0]) : 1) * (ends[1] > 0 ? THREE.MathUtils.smoothstep(1 - t, 0, ends[1]) : 1);
    const w = o.weight ? o.weight(t) : (o.w ?? 1), limb = typeof o.limb === 'function' ? o.limb(t) : (o.limb ?? 0);
    const hOn = !o.hullEnds || (t > o.hullEnds[0] && t < o.hullEnds[1]) ? 1 : 0;      // no contour where a part tapers to less than the line's own width (it would stand as a dark spike)
    for (let j = 0; j <= nRing; j++) {
      const th = th0 + (j / nRing) * Math.PI * 2;
      surf(F, th, P); surf(Fa, th, Pt1); surf(Fb, th, Pt0); surf(F, th + 0.05, Pa); surf(F, th - 0.05, Pb);
      N.crossVectors(Pa.sub(Pb), Pt1.sub(Pt0));
      _a.subVectors(P, C0);
      if (N.lengthSq() < 1e-14 || rm < 1e-4) { N.subVectors(Fa.C, Fb.C).multiplyScalar(t < 0.5 ? -1 : 1); if (N.lengthSq() < 1e-14) N.set(0, 1, 0); }
      else if (N.dot(_a) < 0) N.negate();
      N.normalize();
      let s = 0; const tw = Math.PI * 2;
      for (const L of lobes) { let d = Math.abs(((th - L[0]) % tw + tw + Math.PI) % tw - Math.PI) / L[1]; if (d < 1) s = Math.max(s, (L[2] ?? 1) * Math.cos(d * Math.PI * 0.5)); }
      s = Math.min(o.sMax ?? 1, Math.max(o.sFloor ?? 0, s * eF));
      for (let h = 0; h < (hull ? 2 : 1); h++) {
        G.pos.push(P.x, P.y, P.z); G.nor.push(N.x, N.y, N.z);
        G.band.push(o.hue, s, arc, (th - th0) * rAcross * unit);
        G.part.push(kindOf ? kindOf(t) : (o.kind ?? 0), limb, o.flank ? Math.PI * rAcross * unit : w, h * hOn);
        G.piv.push(piv[0], piv[1], piv[2]); G.piv2.push(piv2[0], piv2[1], piv2[2]);
      }
    }
  }
  // winding: outward by test on the middle ring
  const k = hull ? 2 : 1, vi = (i, j, h) => base + (i * row + j) * k + h;
  let vote = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), Cc = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < nSeg; i++) for (let j = 0; j < nRing; j += 2) {
    const a = vi(i, j, 0) * 3, b = vi(i + 1, j, 0) * 3, c = vi(i, j + 1, 0) * 3;
    A.set(G.pos[a], G.pos[a + 1], G.pos[a + 2]); B.set(G.pos[b], G.pos[b + 1], G.pos[b + 2]).sub(A); Cc.set(G.pos[c], G.pos[c + 1], G.pos[c + 2]).sub(A);
    nn.set(G.nor[a], G.nor[a + 1], G.nor[a + 2]); vote += B.cross(Cc).dot(nn);
  }
  const ccw = vote > 0;
  for (let i = 0; i < nSeg; i++) for (let j = 0; j < nRing; j++) {
    for (let h = 0; h < k; h++) {
      const a = vi(i, j, h), b = vi(i + 1, j, h), c = vi(i, j + 1, h), d = vi(i + 1, j + 1, h);
      if (ccw !== (h === 1)) G.idx.push(a, b, c, c, b, d); else G.idx.push(a, c, b, c, d, b);
    }
  }
  G.n += (nSeg + 1) * row * k;
  return arc;
}
export function finishBandGeo(G) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(G.nor, 3));
  g.setAttribute('aBand', new THREE.Float32BufferAttribute(G.band, 4));
  g.setAttribute('aPart', new THREE.Float32BufferAttribute(G.part, 4));
  g.setAttribute('aPiv', new THREE.Float32BufferAttribute(G.piv, 3));
  g.setAttribute('aPiv2', new THREE.Float32BufferAttribute(G.piv2, 3));
  g.setIndex(G.n > 65535 ? new THREE.Uint32BufferAttribute(G.idx, 1) : new THREE.Uint16BufferAttribute(G.idx, 1));
  g.computeBoundingSphere(); g.computeBoundingBox();
  return g;
}

// ---- the horse: one drawing, lofted from swept arcs ------------------------------------------------------------------
// Unit horse: withers at y = 1, hooves at y = 0, head toward +Z, neck bowed and head tucked and turned to +X.
// Barrel, two haunches, shield breast, two shoulder blades set at an angle against it, neck, head, ears, mane, tail; each leg is
// ONE tapering blade bent at an angular knee or hock (the rings below the joint are kind 3 and turn about it), on a dark wedge of hoof.
// Scale by 9 (herd) or 13.5 (tower) in the instance matrix. lod 1 = about 2,900 triangles + as many of hull, lod 0.6 = 1,300.
function horseSpecs(opts) {
  const lod = opts.lod ?? 1, unit = opts.unit ?? 10, G = makeBandGeo();
  const q = (n) => Math.max(3, Math.round(n * lod)), qr = (n) => Math.max(6, Math.round(n * (0.4 + 0.6 * lod)));
  const B = HUE.BLUE, K = HUE.LINE, lerp = THREE.MathUtils.lerp, ss = THREE.MathUtils.smoothstep;
  const specs = [], L = (o) => specs.push({ unit, ...o });
  // How a part is painted: one light swell, off centre (up, and stronger on the marked side), over a broad plateau of the
  // hue; everything else, the underside and the far edge, is the deep. Lobes are [angle round the section, half width, strength].
  const PI = Math.PI, body = (side, up = 0.5) => [side > 0 ? up : PI - up, 1.95, 0.43];
  // barrel
  L({ pts: [[0, 0.80, -0.46], [0, 0.745, -0.06], [0, 0.765, 0.36]], rad: (t) => { const k = capProfile(t, 0.22, 0.22); return [0.272 * k, 0.262 * k]; }, ref: [0, 1, 0], hue: B, nSeg: q(10), nRing: qr(16), kind: 0, w: 1, ends: [0.2, 0.2], sq: 0.9,
    lobes: [[0.42, 0.8], [PI - 0.5, 0.72, 0.96], body(1), body(-1)] });
  // haunches: two heavy round lobes, croup to stifle; the croup's plane breaks against the buttock
  for (const sx of [1, -1]) {
    L({ pts: [[0.07 * sx, 0.90, -0.16], [0.115 * sx, 0.885, -0.44], [0.15 * sx, 0.66, -0.595], [0.155 * sx, 0.47, -0.52]],
      rad: (t) => { const k = capProfile(t, 0.3, 0.12); const r = lerp(0.235, 0.108, ss(t, 0.45, 1)) * k; return [r * 0.92, r * 1.08]; },
      ref: [0, 1, -1], hue: B, nSeg: q(10), nRing: qr(14), kind: 0, w: 0.35, ends: [0.2, 0.1], sq: 0.86,
      lobes: [[sx > 0 ? 0.5 : PI - 0.6, sx > 0 ? 0.9 : 0.78, sx > 0 ? 1 : 0.5], body(sx, 0.45)] });   // the light sits on one haunch only, high: from astern no pair of pale ovals
  }
  // breast: the shield
  L({ pts: [[0, 1.03, 0.26], [0, 0.83, 0.435], [0, 0.55, 0.39]], rad: (t) => { const k = capProfile(t, 0.3, 0.25); return [lerp(0.29, 0.15, t * t) * k, lerp(0.22, 0.12, t) * k]; },
    ref: [0, 0, 1], hue: B, nSeg: q(8), nRing: qr(14), kind: 0, w: 0.6, ends: [0.2, 0.22], sq: 0.8, lobes: [[PI / 2 - 0.5, 0.8], [PI / 2, 2.0, 0.43]] });
  // shoulders: a slanting blade from the withers to the point of the shoulder, set at an angle against the shield
  for (const sx of [1, -1]) {
    L({ pts: [[0.115 * sx, 1.0, 0.16], [0.185 * sx, 0.84, 0.27], [0.178 * sx, 0.63, 0.345]], rad: (t) => { const k = capProfile(t, 0.3, 0.3); return [0.085 * k, lerp(0.17, 0.12, t) * k]; },
      ref: [0, 0.5, 1], hue: B, nSeg: q(6), nRing: qr(10), kind: 0, w: 0.5, ends: [0.2, 0.2], sq: 0.75,
      lobes: [[sx > 0 ? 0.3 : PI - 0.4, sx > 0 ? 0.8 : 0.7, sx > 0 ? 1 : 0.95], body(sx, 0.3)] });
  }
  // neck: one strong arc; then the head, tucked down and turned away
  const neckPts = [[0, 0.84, 0.25], [0.0, 1.14, 0.415], [0.03, 1.385, 0.60], [0.085, 1.475, 0.81], [0.14, 1.40, 0.93]];
  const neckAt = curveOf(neckPts), neckRad = (t) => { const k = capProfile(t, 0.12, 0.2); return [lerp(0.18, 0.062, Math.pow(t, 0.85)) * k, lerp(0.245, 0.095, Math.pow(t, 0.9)) * k]; };
  const WITH = [0, 0.93, 0.25], nw = (t) => ss(t, 0.0, 0.45);
  L({ at: neckAt, rad: neckRad, ref: [0, 0.3, -1], hue: B, nSeg: q(12), nRing: qr(14), kind: 1, weight: nw, piv: WITH, ends: [0.1, 0.12], sq: 0.86,
    lobes: [[0.35, 0.78], [PI - 0.45, 0.7, 0.96], body(1, 0.3), body(-1, 0.3)] });
  L({ pts: [[0.11, 1.45, 0.89], [0.18, 1.30, 0.995], [0.25, 1.06, 0.965], [0.30, 0.87, 0.86]],
    rad: (t) => { const k = capProfile(t, 0.22, 0.12); return [lerp(0.08, 0.046, ss(t, 0.1, 0.8)) * k, (lerp(0.142, 0.058, ss(t, 0.12, 0.72)) + 0.014 * ss(t, 0.78, 0.95)) * k]; },
    ref: [0.3, 0.1, 1], hue: B, nSeg: q(9), nRing: qr(12), kind: 1, w: 1, piv: WITH, ends: [0.15, 0.12], sq: 0.8, lobes: [[0.7, 0.6, 0.9], body(1, 0.4), body(-1, 0.4)] });
  // ears: two pointed leaves
  for (const sx of [1, -1]) {
    const bx = 0.105 + 0.055 * sx;
    L({ pts: [[bx, 1.46, 0.83], [bx + 0.02 * sx, 1.57, 0.835], [bx + 0.035 * sx, 1.665, 0.86]], rad: (t) => { const r = 0.05 * Math.sin(Math.PI * Math.min(1, 0.25 + t * 0.75)); return [r * 0.55, r]; },
      ref: [0, 0, 1], hue: B, nSeg: 4, nRing: 6, kind: 1, w: 1, limb: (t) => t, piv: WITH, ends: [0, 0.3], sFloor: 0.25 });
  }
  // cropped mane: a dark crest standing on the arc of the neck
  const m0 = new THREE.Vector3(), m1 = new THREE.Vector3(), m2 = new THREE.Vector3();
  const maneAt = (t, out) => {
    const tn = lerp(0.10, 0.90, t); neckAt(tn, m0); neckAt(Math.min(1, tn + 0.01), m1); neckAt(Math.max(0, tn - 0.01), m2);
    m1.sub(m2).normalize(); m2.set(0, 0.3, -1); m2.addScaledVector(m1, -m2.dot(m1)).normalize();
    return out.copy(m0).addScaledVector(m2, neckRad(tn)[1] * 0.97);
  };
  L({ at: maneAt, rad: (t) => { const k = capProfile(t, 0.15, 0.15); return [0.032 * k, 0.058 * k]; }, ref: [0, 0.3, -1], hue: K, nSeg: q(12), nRing: 6, kind: 1,
    weight: (t) => nw(lerp(0.10, 0.90, t)), piv: WITH, hull: false, sFloor: 0.2 });
  // tail: one hanging band, pointed
  const DOCK = [0, 0.93, -0.66];
  L({ pts: [[0, 0.95, -0.62], [0, 0.86, -0.80], [0, 0.56, -0.865], [0, 0.26, -0.80]], rad: (t) => { const k = capProfile(t, 0.2, 0); return [lerp(0.05, 0.072, ss(t, 0, 0.5)) * k * (1 - ss(t, 0.5, 1) * 0.97), 0.04 * k * (1 - t * 0.8)]; },
    ref: [0, 1, -1], hue: B, nSeg: q(10), nRing: 8, kind: 4, weight: (t) => t, piv: DOCK, ends: [0.1, 0.1], lobes: [[Math.PI / 2, 1.5], [-Math.PI / 2, 1.5]], sMax: 0.46 });   // one band of the hue: never a pale oval on the rump from astern
  // legs: each one tapering blade from the body to the fetlock, bent at an angular knee or hock, standing on a small dark
  // wedge of hoof. One loft per leg: the rings below the joint turn about it in the gait (kind 3), so no joint shows.
  const legs = [[1, 1, 0.0], [-1, 1, 0.12], [1, -1, 0.5], [-1, -1, 0.62]];
  for (const [sx, fz, ph] of legs) {
    const x = 0.158 * sx, fore = fz > 0, tJ = 0.5;
    const hip = fore ? [x, 0.70, 0.27] : [x * 0.9, 0.78, -0.42], joint = fore ? [x * 0.97, 0.335, 0.31] : [x, 0.345, -0.63];
    const pts = fore ? [[x * 1.05, 0.76, 0.265], [x * 1.0, 0.53, 0.30], joint, [x * 0.96, 0.19, 0.288], [x * 0.96, 0.062, 0.305]]
      : [[x * 0.97, 0.66, -0.485], [x, 0.50, -0.545], joint, [x, 0.20, -0.572], [x, 0.062, -0.535]];
    L({ pts, rad: (t) => { const k = capProfile(t, 0.2, 0);
        const r = lerp(fore ? 0.112 : 0.128, 0.05, ss(t, 0.04, tJ)) - 0.013 * ss(t, tJ, 0.8) + 0.007 * ss(t, 0.86, 1) + (fore ? 0.004 : 0.012) * Math.exp(-Math.pow((t - tJ) / 0.07, 2));
        return [r * 0.72 * k, r * 1.16 * k]; },
      ref: [0, 0, 1], hue: B, nSeg: q(11), nRing: qr(9), kind: (t) => (t > tJ + 0.02 ? 3 : 2), weight: (t) => ss(t, tJ, tJ + 0.14), limb: ph, piv: hip, piv2: joint, ends: [0.16, 0], sq: 0.72,
      lobes: [[sx > 0 ? 0.5 : PI - 0.6, 0.7, sx > 0 ? 0.95 : 0.85], body(sx, 0.2)] });
    const hz = fore ? 0.305 : -0.535, xx = pts[4][0];
    L({ pts: [[xx, 0.078, hz], [xx, 0.04, hz + 0.012], [xx, 0.0, hz + 0.026]], rad: (t) => { const r = lerp(0.036, 0.05, t) * capProfile(t, 0.25, 0.02); return [r * 0.95, r * 1.45]; },
      ref: [0, 0, 1], hue: K, nSeg: 2, nRing: qr(8), kind: 3, limb: ph, piv: hip, piv2: joint, hull: false, sFloor: 0.2, sq: 0.7 });
  }
  return { G, specs };
}
function finishHorse(G, opts) {
  if ((opts.side ?? 1) > 0) {            // default drawing: head turned to -X (the viewer's left, seen from the front)
    for (const arr of [G.pos, G.nor, G.piv, G.piv2]) for (let i = 0; i < arr.length; i += 3) arr[i] = -arr[i];
    for (let i = 0; i < G.idx.length; i += 3) { const t = G.idx[i + 1]; G.idx[i + 1] = G.idx[i + 2]; G.idx[i + 2] = t; }
  }
  const g = finishBandGeo(G);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.8, 0), 1.6);
  return g;
}

// ---- the tower ---------------------------------------------------------------------------------------------------------
function towerLayout(rng, side) {
  const S = 14, psi = THREE.MathUtils.degToRad(rng.range(52, 62)), dy = rng.range(11.8, 12.4), y0 = 9;
  const h = new THREE.Vector3(-Math.sin(psi) * side, 0, Math.cos(psi)), p = new THREE.Vector3(-Math.cos(psi) * side, 0, -Math.sin(psi));
  const step = p.clone().multiplyScalar(8.8).addScaledVector(h, -5.2);
  const base = new THREE.Vector3(0, y0, 0).addScaledVector(step, -1.5); base.y = y0;
  const horses = [];
  for (let i = 0; i < 4; i++) {
    const pos = base.clone().addScaledVector(step, i); pos.y = y0 + dy * i;
    const jit = rng.range(-0.07, 0.07), sc = S * rng.range(0.975, 1.03), yaw = Math.atan2(h.x, h.z) + jit;
    const hd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    horses.push({ pos, yaw, scale: sc, h: hd, neck: rng.range(-0.03, 0.10) + (i === 3 ? 0.06 : 0), seed: rng(), phase: rng() });
  }
  return { S, psi, dy, y0, h, p, step, horses, side };
}

async function addCrag(G, lay, rng, yieldFn) {
  const V = HUE.VIOLET, R = HUE.RED, lerp = THREE.MathUtils.lerp, H = lay.horses, sd = lay.side;
  // four slabs, each one tall arc lying along its horse and standing behind the slab below: a stair of backs
  for (let i = 0; i < 4; i++) {
    const c = H[i].pos.clone().addScaledVector(lay.p, 1.1), h = H[i].h, yL = H[i].pos.y, rb = (yL + 9) * 0.5, yT = yL - rb + 0.3;
    const P = (along, drop, back = 0) => [c.x + h.x * along + lay.p.x * back, yT - drop, c.z + h.z * along + lay.p.z * back];
    const d0 = rng.range(7, 12) + i * 2, d1 = rng.range(5, 9) + i * 2, L0 = [25, 27.5, 22, 17][i], L1 = 20 + i * 2;   // the upper slabs end sooner behind their horses: from the rear quarter the lower horses are seen past them
    loftBand(G, { pts: [P(-L0 - 7, d0 + 12 + i * 5, 3), P(-L0, d0 * 0.4, 1), P(-10, 0), P(0, 0), P(9, 0), P(L1 - 4, d1 * 0.35, 1), P(L1 + 3, d1 + 10 + i * 5, 4)],
      rad: (t) => { const k = capProfile(t, 0.17, 0.17); return [(4.6 + i * 0.25) * k, rb * (0.25 + 0.75 * k)]; }, ref: [0, 1, 0], hue: i % 2 ? V : R, sMax: i % 2 ? 0.84 : 1, nSeg: 26, nRing: 26, sq: 0.66,
      ends: [0.1, 0.1], lobes: [[sd > 0 ? 0.2 : Math.PI - 0.2, 1.25], [Math.PI / 2, 0.5], [sd > 0 ? Math.PI - 0.55 : 0.55, 0.95, 0.9]], limb: rng() });
    await yieldFn();
  }
  // leaning buttress arcs: Marc's rocks are backs too. They fan from the foot and lean on the stair's two ends.
  const nB = 7;
  for (let k = 0; k < nB; k++) {
    const endSide = k % 2 ? 1 : -1, lvl = Math.min(3, Math.floor(k / 2)), hr = H[lvl];
    const along = endSide > 0 ? rng.range(15, 22) + lvl * 2 : -rng.range(24, 30) - lvl * 2;
    const topP = hr.pos.clone().addScaledVector(hr.h, along).addScaledVector(lay.p, rng.range(-1, 4)); topP.y = hr.pos.y - (endSide > 0 ? rng.range(5, 10) : rng.range(12, 17));
    const out = new THREE.Vector3().copy(hr.h).multiplyScalar(endSide * rng.range(14, 24)).addScaledVector(lay.p, -rng.range(4, 14));
    const foot = topP.clone().add(out); foot.y = -5;
    const midP = topP.clone().lerp(foot, 0.5); midP.y = topP.y * 0.72 + rng.range(0, 4); midP.addScaledVector(out, -0.12);
    const r0 = rng.range(5.5, 8.5), hue = rng.chance(0.45) ? V : R, ph = rng();
    loftBand(G, { pts: [[foot.x, foot.y, foot.z], [midP.x, midP.y, midP.z], [topP.x, topP.y, topP.z]],
      rad: (t) => { const kk = capProfile(t, 0, 0.3); return [lerp(r0 * 1.3, r0 * 0.7, t) * kk, lerp(r0 * 1.5, r0 * 0.8, t) * kk]; },
      ref: [0, 1, 0.01], hue, sMax: hue === V ? 0.66 : 1, nSeg: 10, nRing: 16, sq: 0.85, ends: [0, 0.2], lobes: [[0.3, 1.3], [Math.PI - 0.3, 1.3], [Math.PI / 2, 0.6]], limb: ph });
    if (k % 2) await yieldFn();
  }
  // the back of the stair: three backs leaning on it, so the far side is arcs too
  for (let k = 0; k < 3; k++) {
    const hr = H[3], al = [-16, 2, 17][k] + rng.range(-3, 3), topY = hr.pos.y - [16, 7, 20][k] - rng.range(0, 4), r0 = rng.range(8, 11);
    const tp = hr.pos.clone().addScaledVector(hr.h, al).addScaledVector(lay.p, 6.5), ft = tp.clone().addScaledVector(lay.p, rng.range(26, 36)).addScaledVector(hr.h, rng.range(-8, 8));
    loftBand(G, { pts: [[ft.x, -6, ft.z], [lerp(ft.x, tp.x, 0.6), topY * 0.74, lerp(ft.z, tp.z, 0.6)], [tp.x, topY, tp.z]],
      rad: (t) => { const kk = capProfile(t, 0, 0.3); return [lerp(r0 * 1.5, r0 * 0.8, t) * kk, lerp(r0 * 1.4, r0 * 0.75, t) * kk]; },
      ref: [0, 1, 0.01], hue: k === 1 ? R : (rng.chance(0.5) ? R : V), nSeg: 10, nRing: 16, sq: 0.85, ends: [0, 0.2], lobes: [[0.3, 1.3], [Math.PI - 0.3, 1.3], [Math.PI / 2, 0.6]], limb: rng() });
  }
}

export function makeHorseGeometry(opts = {}) { const { G, specs } = horseSpecs(opts); for (const sp of specs) loftBand(G, sp); return finishHorse(G, opts); }
// the same in short steps: await makeHorseGeometryAsync(opts, ctx.yield)
export async function makeHorseGeometryAsync(opts = {}, yieldFn) {
  const { G, specs } = horseSpecs(opts);
  for (let i = 0; i < specs.length; i++) { loftBand(G, specs[i]); if (yieldFn) await yieldFn(); }
  return finishHorse(G, opts);
}

/*EXTRAS_BEGIN*/
// the horse's own topline, rump to poll (u 0..1 -> height in withers units): every hill crest in this world is cut from it
const _top = new THREE.CatmullRomCurve3([[0, 0.30], [0.07, 0.78], [0.19, 1.045], [0.33, 1.02], [0.47, 0.975], [0.58, 1.0], [0.70, 1.19], [0.80, 1.39], [0.88, 1.44], [0.95, 1.31], [1, 0.9]].map((p) => new THREE.Vector3(p[0], p[1], 0)));
const _tp = new THREE.Vector3();
export function horseTopline(u) { return _top.getPoint(THREE.MathUtils.clamp(u, 0, 1), _tp).y; }

// a hill as an animal's back: one lofted arc whose crest is the topline scaled. o: { cx, z, width, scale (metres per
// withers unit), baseY, flip (head end to -X), hue, depth, nSeg, yaw }
export function addHillBack(G, o) {
  const w = o.width, sc = o.scale, rb = o.rb ?? sc * 0.9, flip = o.flip ? -1 : 1, cy = Math.cos(o.yaw || 0), sy = Math.sin(o.yaw || 0);
  const dip = o.dip ?? 0;   // dip: metres the two ends dive (the tube is open-ended: bury the ends)
  const at = (t, out) => { const u = t, x = (u - 0.5) * w * flip, e = 1 - THREE.MathUtils.smoothstep(Math.min(u, 1 - u), 0, o.dipRange ?? 0.13), y = (o.baseY ?? 0) + (horseTopline(0.04 + u * 0.93) - 0.30) * sc - rb - dip * e * e; return out.set(o.cx + x * cy, y, o.z + x * sy); };
  return loftBand(G, { at, rad: (t) => { const k = capProfile(t, 0.1, 0.1); return [(o.depth ?? sc * 0.35) * (0.04 + 0.96 * k), rb * (0.04 + 0.96 * k)]; }, ref: [0, 1, 0], hue: o.hue,
    nSeg: o.nSeg ?? 40, nRing: o.nRing ?? 12, ends: [0.14, 0.14], lobes: [[Math.PI - 0.95, 0.56], [0.95, 0.56], [Math.PI - 0.6, 1.7, 0.46], [0.6, 1.7, 0.46]], limb: Math.round((o.seed ?? 0.3) * 256) / 256, sFloor: 0.04, hull: o.hull, flank: true, hullEnds: [0.115, 0.885] });
}

// a wedge of tinted air: a thin leaning slab that MULTIPLIES the paint behind it. One crisp edge (x = -W/2), the other
// fades over 4 m. uWedgeOn 0..1 hides it by uniform (never by visible).
export function makeWedgeGeometry(W = 20, L = 160, T = 0.6) { const g = new THREE.BoxGeometry(W, L, T); g.userData.W = W; g.userData.L = L; return g; }
export function wedgeMaterial(U, hue, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uTint: { value: pig(hue) }, uWedgeOn: { value: opts.on ?? 1 }, uW: { value: opts.W ?? 20 }, uL: { value: opts.L ?? 160 }, uPh: { value: opts.phase ?? 0 }, uStrength: { value: opts.strength ?? 0.3 } },
    vertexShader: /* glsl */`uniform float uTime, uPh, uL; varying vec2 vP;
      void main(){ vP = position.xy; vec3 p = position;
        float a = 0.06 * sin(uTime * 0.33 + uPh * 6.283), c = cos(a), s = sin(a);     // leans a few degrees
        p.xy = vec2(p.x * c - p.y * s, p.x * s + p.y * c); p.x += 4. * sin(uTime * 0.27 + uPh * 4.);   // and slides
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.); }`,
    fragmentShader: /* glsl */`uniform vec3 uTint; uniform float uWedgeOn, uW, uL, uStrength; varying vec2 vP;
      void main(){ float k = (1. - smoothstep(uW * 0.5 - 4., uW * 0.5, vP.x)) * (1. - smoothstep(uL * 0.5 - 12., uL * 0.5, abs(vP.y)));
        gl_FragColor = vec4(mix(vec3(1.), uTint, uStrength * k * uWedgeOn), 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, side: THREE.FrontSide,
  });
}

async function addExtras(ctx, root, U, lay, rng, o) {
  const sd = o.side, CG = o.CG, lerp = THREE.MathUtils.lerp, H = lay.horses, out = {};
  // bushes at the foot: single violet or green swells
  const nBush = Math.round(9 * o.detail);
  for (let i = 0; i < nBush; i++) {
    const ang = rng.range(-0.9, 2.2) * sd + Math.PI * 0.5, rr = rng.range(30, 52), x = Math.cos(ang) * rr + H[0].pos.x * 0.5, z = Math.sin(ang) * rr * 0.8 - 2;
    const r = rng.range(3.2, 6.5), hgt = r * rng.range(1.0, 1.5), hue = rng.chance(0.5) ? HUE.GREEN : HUE.VIOLET, lean = rng.range(-0.25, 0.25) * r;
    loftBand(CG, { pts: [[x, -1.5, z], [x + lean * 0.5, hgt * 0.5, z], [x + lean, hgt, z]], rad: (t) => { const k = capProfile(t, 0.35, 0.55); return [r * k, r * 0.9 * k]; }, ref: [0, 0, 1], hue,
      nSeg: 7, nRing: 12, ends: [0, 0.3], lobes: [[Math.PI / 2 - 0.5, 1.5], [-Math.PI / 2, 1.0]], limb: rng(), sFloor: 0.05 });
  }
  await ctx.yield();
  // the pasture mound the crag stands on (opts.ground === false leaves it out: the world's own pasture takes over)
  if (o.ground !== false) {
    const G2 = makeBandGeo();
    for (let i = 0; i < 3; i++) {
      const cx = [0, -70, 78][i] * sd, cz = [6, 44, 30][i], R0 = [92, 60, 54][i], top = [1.2, -0.6, -0.9][i];
      loftBand(G2, { pts: [[cx, top - 26, cz], [cx, top - 13, cz], [cx, top, cz]], rad: (t) => { const k = Math.sqrt(Math.max(0, 1 - t * t)); return [R0 * k, R0 * 0.8 * k]; }, ref: [0, 0, 1],
        hue: i === 2 ? HUE.YELLOW : HUE.GREEN, nSeg: 10, nRing: 56, ends: [0, 0], lobes: [[Math.PI / 2 - 0.6 * sd, 2.6]], limb: rng(), sFloor: 0.1,
        hull: i > 0 });
    }
    const gm = new THREE.Mesh(finishBandGeo(G2), bandMaterial(U, { crownK: 0.05, heave: 1 / 3 })); gm.frustumCulled = false; root.add(gm); out.ground = gm;
    await ctx.yield();
  }
  // behind: a red hill and a yellow hill repeat the backs, and the one yellow arc of cloud bends over the port shoulder
  if (o.backdrop !== false) {
    const G3 = makeBandGeo();
    addHillBack(G3, { cx: 30 * sd, z: -150, width: 300, scale: 68, baseY: -8, flip: sd < 0, hue: HUE.RED, depth: 22, seed: rng() });
    await ctx.yield();
    addHillBack(G3, { cx: -70 * sd, z: -420, width: 760, scale: 170, baseY: -30, flip: sd > 0, hue: HUE.YELLOW, depth: 50, seed: rng(), nSeg: 48 });
    await ctx.yield();
    const ac = new THREE.Vector3(-34 * sd, 14, -70), aR = 72; out.arcAnchor = { center: ac, radius: aR };
    loftBand(G3, { at: (t, v) => { const a = lerp(0.12, Math.PI - 0.12, t); return v.set(ac.x + Math.cos(a) * aR * sd, ac.y + Math.sin(a) * aR * 0.9, ac.z); },
      rad: (t) => { const k = capProfile(t, 0.08, 0.08); return [3.5 * k, 7.5 * k]; }, ref: [0, 0, 1], hue: HUE.YELLOW, nSeg: 40, nRing: 8, ends: [0.05, 0.05], lobes: [[Math.PI / 2, 1.5]], limb: rng(), sFloor: 0.25 });
    const hm = new THREE.Mesh(finishBandGeo(G3), bandMaterial(U, { crownK: 0.022, heave: 1 / 3, hullWidth: 0.3 })); hm.frustumCulled = false; root.add(hm); out.hills = hm;
    await ctx.yield();
  }
  // the green wedge that leans across horses and hills together
  if (o.wedge !== false) {
    const W = 22, L = 190, lean = THREE.MathUtils.degToRad(rng.range(24, 32)) * sd;
    const wm = new THREE.Mesh(makeWedgeGeometry(W, L), wedgeMaterial(U, o.palette[4], { W, L, phase: rng() }));
    wm.position.set(H[1].pos.x - 2 * sd, 40, H[0].pos.z + 14); wm.rotation.z = lean; wm.renderOrder = 50; wm.frustumCulled = false; root.add(wm);
    out.wedge = wm; out.wedgeAnchor = { position: wm.position.clone(), lean, width: W, length: L };
  }
  return out;
}
/*EXTRAS_END*/

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? 1, side = opts.mirror ? -1 : 1;
  const palette = (opts.palette && opts.palette.length >= 7) ? opts.palette : PALETTE;
  const U = opts.uniforms || makeStyleUniforms(palette);
  const root = new THREE.Group(); root.name = 'tower-of-blue-horses';
  const lay = towerLayout(rng, side);
  await ctx.yield();

  // the four horses: one instanced draw, hull included
  const hg = await makeHorseGeometryAsync({ lod: opts.lod ?? 1.5, side }, ctx.yield);
  await ctx.yield();
  const horseMat = bandMaterial(U, { horse: true, side, liteCap: 0.8, hullFar: 1.5 });
  const inst = new Float32Array(16), inst2 = new Float32Array(16);
  const horses = new THREE.InstancedMesh(hg, horseMat, 4);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Sc = new THREE.Vector3();
  lay.horses.forEach((hr, i) => {
    E.set(0, hr.yaw, 0); Q.setFromEuler(E); Sc.setScalar(hr.scale); M.compose(hr.pos, Q, Sc); horses.setMatrixAt(i, M);
    inst.set([hr.phase, 0, hr.neck, hr.seed], i * 4); inst2.set([i === 0 ? 1 : 0, -1, i === 3 ? 1 : 0, 0], i * 4);
  });
  hg.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));
  hg.setAttribute('aInst2', new THREE.InstancedBufferAttribute(inst2, 4));
  horses.frustumCulled = false; horses.instanceMatrix.needsUpdate = true; root.add(horses);
  await ctx.yield();

  // the crag
  const CG = makeBandGeo(); await addCrag(CG, lay, rng, ctx.yield);
  await ctx.yield();
  const bandMat = bandMaterial(U, { crownK: 0.09, heave: 0.6 });
  const extras = await addExtras(ctx, root, U, lay, rng, { ...opts, detail, side, palette, CG, bandMat });
  const crag = new THREE.Mesh(finishBandGeo(CG), bandMat); crag.frustumCulled = false; root.add(crag);
  await ctx.yield();

  const low = lay.horses[0], topH = lay.horses[3], nr = new THREE.Vector3(Math.cos(low.yaw), 0, -Math.sin(low.yaw)).multiplyScalar(side);
  const earsY = topH.pos.y + topH.scale * 1.665;
  const at = (a, b, y) => low.pos.clone().addScaledVector(low.h, a).addScaledVector(nr, b).setY(low.pos.y + y);
  const anchors = {
    ledges: lay.horses.map((hr) => ({ position: hr.pos.clone(), yaw: hr.yaw, scale: hr.scale })),
    closestPass: at(4, 11.5, 6),
    flyThrough: [at(60, 34, -2), at(30, 18, 3), at(13, 12, 5.5), at(4, 11.5, 6), at(-8, 12, 8), at(-22, 16, 13), at(-40, 14, 22), at(-56, -4, 32), at(-60, -30, 42)],
    viewpoints: { reveal: new THREE.Vector3(18 * side, 12, 150), front: new THREE.Vector3(10 * side, 16, 78), closest: at(6, 11.5, 6), behind: new THREE.Vector3(-20 * side, 44, -78) },
    top: new THREE.Vector3(topH.pos.x, earsY, topH.pos.z),
    wedge: extras?.wedgeAnchor || null, cloudArc: extras?.arcAnchor || null,
  };
  let progress = null; const size = new THREE.Vector2();
  return {
    object: root, radius: 32, height: earsY, center: new THREE.Vector3(0, earsY * 0.52, 0), anchors,
    uniforms: U, horses, horseGeometry: hg, horseMaterial: horseMat, bandMaterial: bandMat, layout: lay, wedge: extras?.wedge || null,
    setProgress(u) { progress = u; },
    update(dt, time) {
      U.uTime.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uViewH.value = size.y; }
      const b = progress == null ? Math.pow(Math.max(0, Math.sin(time * 0.37)), 6) : THREE.MathUtils.smoothstep(progress, 0.12, 0.22) * (1 - THREE.MathUtils.smoothstep(progress, 0.27, 0.36));
      U.uLiftTop.value = 0.24 * b;
      if (extras?.update) extras.update(dt, time, progress);
    },
    dispose() {}, ground: false, groundY: 0,
  };
}
