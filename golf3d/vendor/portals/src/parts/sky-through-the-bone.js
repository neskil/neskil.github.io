// Sky Through the Bone: hero set piece, after Georgia O'Keeffe.
// A bleached back bone (one vertebra) 250 m tall and 300 m across: a drum body on the ridge, a round canal
// 46 m wide and 70 m deep under an arch with a blunt crest, two wings sweeping out in S-curves with an oval
// gap of sky under each, the starboard wing snapped to a broken edge of open cells.
//
// HOW THE STYLE IS MADE (everything is unlit; post must be { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1,
// contrast: 1, vignette: 0, grain: 0 } }, colours are written as their hex, no tone map and no inverse):
//   A form is ONE hue ramp read by a baked "fold coordinate" aC (0 = the form's light, 1 = its dark), cut into
//   8 bands whose edges blend over 60 percent of a band, melting to satin beyond ~150 m or when a band gets thin
//   on screen. The medium moves by adding amp * sin(2 pi (w - phase)) to aC before the cut, where w is a baked
//   coordinate along the swell (aW.x) and phase = 2.5 u + a slow loop: the bands slide, contours never move.
//   Inside a bore the slide winds round the axis (aW.zw = cos, sin of the angle round the bore, aW.y = how much).
//   A bore also has a swell of its own: there the fold coordinate is the place ROUND the bore, three unequal swells
//   (three lines of the light, three of the dark between them) that wind along the bore and can be turned round its
//   axis (uniform uBoreTurn); it is worked out in the shaders (see THE BORE'S OWN SWELL in buildHero), and the
//   stretch of the fold coordinate near the lens (deep) is left out there, by the bore's weight.
//   No light, no normal, no fog: each form's aC carries its own tone axis, so no light direction can be found.
//
// EXPORTS FOR THE WORLD CODER
//   PALETTE                 the brief's seven hexes, in order [sky, boneWhite, lavender, red, ochre, greenWhite, violetBlack]
//   okUniforms              shared uniforms { uOkPhase, uOkSatin (metres: bands melt to satin between x and y), uOkViewH }; every material references the same objects.
//                           Call setOkPhase(u, time) once a frame (the hero's update() does NOT do it for you unless
//                           you leave opts.drivePhase at its default true).
//   STYLE_GLSL              fragment chunk: okBands(c, dist), okRamp3(a, b, c, t), okShade(light, mid, dark, c, slide, dist)
//   STYLE_VERT_GLSL         vertex chunk: okSlide(aW) -> the sine term (without amplitude), for your own vertex shaders
//   SKY_GLSL                okSky(dir, blue, pale): the flat turquoise with the three pale steps in the lowest 6 degrees (no mesa);
//                           the hero's nutrient holes paint it, your dome should call the same function.
//   RAMPS                   named three-stop ramps (bone, red, ochre, cloud, sage, stone, snag, wall) built from a palette
//   okMaterial(ramp, opts)  unlit ShaderMaterial for any mesh with attributes position, aC (float) and optionally aW (vec4);
//                           opts { palette, amp (slide amplitude, default 0.07), boreAmp, side, instanced (uses instanceMatrix),
//                           light/mid/dark (hex overrides), nearAmp/nearBands/nearReach (the near tone steps),
//                           deep/deepPivot (near the lens the fold coordinate is stretched about the pivot: the ramp's whole depth),
//                           boreK (the power the mesh's aC was raised to after the bake, 1 if none: the bore's swell is
//                           blended in before that power) }; a form with a bore sets uniforms uBoreW and uBoreL (its swells),
//                           and its world may turn the swells round the bore by the uniform uBoreTurn (radians)
//   okFlatMaterial(hex)     one flat pigment (ravens, the door reveal)
//   buildBoneGeometry(ctx, field, box, cell, opts)   async: extracts a welded surface from any implicit field(x, y, z)
//                           (negative inside) in short yielded steps and bakes aC and aW; use it for the ring bone and rib.
//                           opts { axis: [x,y,z] the form's own tone axis, y0, y1 height range for the height term,
//                           swell: (x,y,z) => w, bore: (x,y,z) => [m, cos, sin] or null, curvGain,
//                           boreC: the fold coordinate a bore's wall is drawn toward (0.5),
//                           boreLine: (what bore returned) => radians, baked as the attribute aBore (the angle round
//                           the bore of its first white line at that vertex's depth) }
//   F                       field primitives: smin, smax, ell, capsule, tube (elliptical swept polyline), make a bone from these
//   sutureRibbons(field, starts, rng, yieldFn)   async: dark S-curve hairlines walked across a field's surface; draw with
//   okLineMaterial(hex)     one flat pigment, kept at least 1.5 px wide (alpha thins by coverage instead). Set
//                           okUniforms.uOkViewH.value to the drawing buffer height in pixels (default 900) for exact widths.
//   holeDecals(field, seeds, rng, yieldFn) + okHoleMaterial(palette)   async: oval nutrient holes on a surface; thin ones paint okSky.
// The returned hero also carries field(x, y, z): metres to the bone in local space (negative inside), for clearances and ravens.
//
// buildHero(ctx, opts): opts { palette (7 hexes), detail 0.6..1 (grid cell, hole and suture counts), drivePhase (true),
//   boreStart, boreShares (two numbers 0..1 the world draws: where round the bore its first white line stands at the near
//   rim, in turns, and what sets the three swells' shares of the round; see THE BORE'S OWN SWELL in buildHero) }
// returns { object, radius 175, height 250, center, anchors, update, setProgress(u), dispose, ground, groundY }.
// Local frame: origin at the base centre on the ridge top, +Y up. The FRONT faces +Z: the camera arrives from +Z and
// flies through the canal toward -Z (the canal axis rises 12 degrees in the direction of travel). Starboard is +X:
// the starboard (+X) wing is the snapped one. In a world whose course is +Z, set object.rotation.y = Math.PI (+ the
// brief's 30 degree turn) and transform the anchors with object.matrixWorld.
// anchors (local): canalIn / canalOut (the two mouths on the axis), canalAxis (unit, direction of travel), canalRadius,
//   flyThrough (ordered points: approach below the starboard wing, under it at ~10 m, round to the axis, through the
//   canal and out; 6 m clear everywhere), wingUnder (closest-pass point under the starboard wing) and wingTip (the broken
//   edge), gapStarboard / gapPort (centres of the oval gaps of sky), crest (top), viewpoints.{foot, front, exit},
//   portalSeat (none on the hero: the door is the world's; given as the canal's far mouth for anyone who wants it).
// Cost at detail 1: about 68k triangles, 4 draw calls (bone, broken tip, sutures, holes), 3 programs, no lights, no textures.
// Expects around it: a ridge crest about 30 m high meeting it at y 0 (the drum goes 25 m below), nothing but sky behind.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const hyp2 = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);   // Math.hypot is slow in hot loops
export const PALETTE = ['#3F8FC4', '#EFE7D6', '#B9B4C2', '#B4472B', '#D9A05B', '#DDE5C8', '#2B2333'];

export const okUniforms = { uOkPhase: { value: 0 }, uOkSatin: { value: new THREE.Vector2(110, 210) }, uOkViewH: { value: 900 } };
/** phase = 2.5 u + a slow loop with no start (one band width in about four seconds). */
export function setOkPhase(u, time) { okUniforms.uOkPhase.value = 2.5 * u + time * 0.11; }

export const STYLE_GLSL = /* glsl */`
uniform float uOkPhase; uniform vec2 uOkSatin;
vec3 okRamp3(vec3 a, vec3 b, vec3 c, float t){ t = clamp(t, 0., 1.); return t < .5 ? mix(a, b, t * 2.) : mix(b, c, t * 2. - 1.); }
// 8 bands, each edge blended over 60 percent of a band; satin when far or when a band is under ~4 px (call outside loops)
float okBands(float c, float dist){
  float b = clamp(c, 0., 1.) * 8.;
  float hw = mix(.19, .3, smoothstep(30., 95., dist));              // each edge blended over 60 percent of a band; at arm's length the steps show plainer
  float st = floor(b) + smoothstep(.5 - hw, .5 + hw, fract(b));
  float melt = max(smoothstep(uOkSatin.x, uOkSatin.y, dist), smoothstep(.12, .3, fwidth(b)));
  return mix(st, b, melt) / 8.;
}
vec3 okShade(vec3 light, vec3 mid, vec3 dark, float c, float slide, float dist){
  return okRamp3(light, mid, dark, okBands(c + slide, dist));
}
`;
export const STYLE_VERT_GLSL = /* glsl */`
uniform float uOkPhase;
// aW = (w along the swell, bore weight, cos, sin of the angle round the bore). Returns the slide term in -1..1.
float okSlide(vec4 w){
  float ph = 6.2831853 * (w.x - uOkPhase);
  float a = sin(ph);
  float s2 = 2. * w.z * w.w, c2 = w.z * w.z - w.w * w.w;       // sin, cos of twice the bore angle: no atan, no seam
  float b = s2 * cos(ph) + c2 * sin(ph);
  return mix(a, b, clamp(w.y, 0., 1.));
}
`;
export const SKY_GLSL = /* glsl */`
vec3 okSky(vec3 dir, vec3 blue, vec3 pale){
  float e = dir.y / max(length(dir), 1e-4);                       // sine of elevation; 6 degrees = 0.1045
  float t = clamp(1. - e / .1045, 0., 1.) * 3.;
  float st = (floor(t) + smoothstep(.25, .75, fract(t))) / 3.;
  return mix(blue, pale, st);
}
`;
const lin = (hex) => new THREE.Color(hex);
const mixHex = (a, b, t) => lin(a).lerp(lin(b), t);
/** Named three-stop ramps (light, mid, dark) as linear THREE.Color, from a palette of the brief's seven hexes. */
export function RAMPS(pal = PALETTE) {
  const [, white, lav, red, ochre, gw, vb] = pal;
  return {
    bone: [lin(white), mixHex(white, lav, 0.5), lin(lav)],
    cloud: [lin(white), mixHex(white, lav, 0.45), lin(lav)],
    red: [lin(ochre), lin(red), mixHex(red, vb, 0.55)],
    ochre: [mixHex(ochre, white, 0.3), lin(ochre), mixHex(ochre, red, 0.6)],
    wall: [mixHex(ochre, white, 0.35), lin(ochre), mixHex(ochre, red, 0.35)],
    sage: [lin(gw), mixHex(gw, lav, 0.5), lin(lav)],
    stone: [mixHex(vb, lav, 0.45), mixHex(vb, lav, 0.12), lin(vb)],
    snag: [mixHex(white, lav, 0.3), lin(lav), mixHex(lav, vb, 0.25)],
  };
}

const OK_VERT = /* glsl */`
attribute float aC, aBore; attribute vec4 aW;
uniform float uAmp, uBoreAmp, uBoreTurn;
varying float vC, vSlide, vDist; varying vec2 vW, vBore;
${STYLE_VERT_GLSL}
void main(){
  vec4 p = vec4(position, 1.);
  #ifdef USE_INSTANCING
    p = instanceMatrix * p;
  #endif
  vec4 mv = modelViewMatrix * p;
  vC = aC; vSlide = okSlide(aW) * mix(uAmp, uBoreAmp, clamp(aW.y, 0., 1.));
  vW = vec2(aW.x, 1. - .75 * clamp(aW.y, 0., 1.));
  // THE BORE'S OWN SWELL, the vertex's part: cos, sin of the angle round the bore counted from the swell's first white
  // line. That line stands at aBore (its winding along the bore, baked) plus uBoreTurn, the angle the whole pattern
  // has gone round the axis (radians; whoever owns the clock sets it, the hero leaves it at nought): toward the rising
  // angle, the way the bore's slide itself travels round.
  float ba = aBore + uBoreTurn, bc = cos(ba), bs = sin(ba);
  vBore = vec2(aW.z * bc + aW.w * bs, aW.w * bc - aW.z * bs);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const OK_FRAG = /* glsl */`
uniform vec3 uLight, uMid, uDark, uNear, uBoreL; uniform vec2 uDeep, uBoreW; uniform float uBoreK;
varying float vC, vSlide, vDist; varying vec2 vW, vBore;
${STYLE_GLSL}
// THE BORE'S OWN SWELL (the rule and its reasons are in buildHero). x: the place round the bore in turns, 0..1, counted
// from the first white line. Three swells: white lines at 0, uBoreW.x and uBoreW.y, a lavender line in each at uBoreL.
// From a white line to the lavender line next to it the value goes 0 to 1 evenly, but for the ninth of the way next to
// each line, where it is rounded: a parabola that meets the even run at a sixteenth, where the end band stops, so no
// line is a crease, the rounding lies wholly inside the line's own band and the eight edges between stand evenly.
float okBoreFold(float x){
  float w0 = 0., w1 = uBoreW.x, l = uBoreL.x;
  if (x >= uBoreW.y) { w0 = uBoreW.y; w1 = 1.; l = uBoreL.z; } else if (x >= uBoreW.x) { w0 = uBoreW.x; w1 = uBoreW.y; l = uBoreL.y; }
  float t = clamp(x < l ? (x - w0) / max(l - w0, 1e-4) : (w1 - x) / max(w1 - l, 1e-4), 0., 1.);
  float e = min(t, 1. - t), r = e < .11111111 ? 5.0625 * e * e : .0625 + 1.125 * (e - .11111111);
  return t < .5 ? r : 1. - r;
}
// uNear = (amplitude, bands per swell, reach in metres): close to, the tone steps are 0.4 to 3 m wide and slide with the
// same phase; the term fades out with distance, so a contour never moves and the far form keeps its broad swell.
// uDeep = (gain, pivot): close to, the fold coordinate is stretched about the pivot so that the swell uses the ramp's
// whole depth (a dark hollow, a light crest); it eases off over the same reach, so the far form keeps its pale satin.
// In a bore (bw: its weight, read back from vW.y = 1 - .75 weight; under a hundred-thousandth counts as nought, so
// that nothing outside a bore is touched) the fold coordinate is the bone's own, which the bake has already drawn
// toward nought by the weight, plus weight x the bore's swell, added under the power uBoreK the attribute was raised
// to after the bake. The swell goes in as its uBoreK-th root, so that at weight 1 the ramp reads the swell itself,
// its eight edges evenly spread. And the stretch is left out by the weight (none of it at weight 1), so that there
// the bands stand evenly within each swell at every distance.
void main(){
  float nk = 1. - smoothstep(uNear.z * .4, uNear.z, vDist);
  float nr = uNear.x * vW.y * nk;
  float s2 = nr * sin(6.2831853 * (vW.x * uNear.y - uOkPhase * 1.3));
  float bw = clamp(((1. - vW.y) / .75 - 1e-5) / (1. - 1e-5), 0., 1.), c0 = vC;
  if (bw > 0.) {
    float x = abs(vBore.x) + abs(vBore.y) > 1e-4 ? fract(atan(vBore.y, vBore.x) / 6.2831853 + 1.) : 0.;
    float ik = 1. / max(uBoreK, 1e-3);
    c0 = pow(pow(max(vC, 0.), ik) + bw * pow(okBoreFold(x), ik), uBoreK);
  }
  float c = c0 + (c0 - uDeep.y) * uDeep.x * nk * (1. - bw);
  gl_FragColor = vec4(okShade(uLight, uMid, uDark, c, vSlide + s2, vDist), 1.);
}`;

/** Unlit graded material: reads the ramp by aC, bands slide by aW. ramp: a RAMPS name or [light, mid, dark] colours. */
export function okMaterial(ramp = 'bone', opts = {}) {
  const r = Array.isArray(ramp) ? ramp : RAMPS(opts.palette || PALETTE)[ramp];
  const c = (v, d) => (v ? new THREE.Color(v) : d.clone());
  return new THREE.ShaderMaterial({
    uniforms: {
      uOkPhase: okUniforms.uOkPhase, uOkSatin: okUniforms.uOkSatin,
      uLight: { value: c(opts.light, r[0]) }, uMid: { value: c(opts.mid, r[1]) }, uDark: { value: c(opts.dark, r[2]) },
      uNear: { value: new THREE.Vector3(opts.nearAmp ?? 0, opts.nearBands ?? 3, opts.nearReach ?? 120) }, uDeep: { value: new THREE.Vector2(opts.deep ?? 0, opts.deepPivot ?? 0.3) }, uAmp: { value: opts.amp ?? 0.07 }, uBoreAmp: { value: opts.boreAmp ?? opts.amp ?? 0.07 },
      uBoreK: { value: opts.boreK ?? 1 }, uBoreTurn: { value: 0 }, uBoreW: { value: new THREE.Vector2(1 / 3, 2 / 3) }, uBoreL: { value: new THREE.Vector3(1 / 6, 1 / 2, 5 / 6) },
    },
    vertexShader: OK_VERT, fragmentShader: OK_FRAG, side: opts.side ?? THREE.FrontSide,
  });
}
/** One flat pigment, unlit (ravens, the door reveal). */
export function okFlatMaterial(hex, opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(hex) } }, side: opts.side ?? THREE.DoubleSide,
    vertexShader: `void main(){ vec4 p = vec4(position, 1.);
      #ifdef USE_INSTANCING
        p = instanceMatrix * p;
      #endif
      gl_Position = projectionMatrix * modelViewMatrix * p; }`,
    fragmentShader: 'uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.); }',
  });
}

/** Field primitives (distances in metres, negative inside). */
export const F = {
  smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; },
  smax(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; },
  /** ellipsoid centred at c with radii r (axis aligned) */
  ell(x, y, z, cx, cy, cz, rx, ry, rz) {
    const a = (x - cx) / rx, b = (y - cy) / ry, c = (z - cz) / rz, k0 = Math.sqrt(a * a + b * b + c * c);
    if (k0 < 1e-3) return -Math.min(rx, ry, rz);
    const k1 = Math.sqrt(a * a / (rx * rx) + b * b / (ry * ry) + c * c / (rz * rz));
    return k0 * (k0 - 1) / Math.max(k1, 1e-6);
  },
  capsule(x, y, z, ax, ay, az, bx, by, bz, r) {
    const dx = bx - ax, dy = by - ay, dz = bz - az, px = x - ax, py = y - ay, pz = z - az;
    const t = clamp((px * dx + py * dy + pz * dz) / Math.max(dx * dx + dy * dy + dz * dz, 1e-6), 0, 1);
    return Math.hypot(px - dx * t, py - dy * t, pz - dz * t) - r;
  },
  /**
   * Prepare an elliptical swept tube: pts = [[x,y,z, ru, rv], ...] (ru along `wide`, rv across it), wide = [x,y,z]
   * the direction the section is broad in (made perpendicular to the centreline at each point). Returns an object for F.tube.
   */
  makeTube(pts0, wide, sub = 3) {
    const pts = [];                                             // Catmull-Rom the stations so a bend in the blade's own plane leaves no notch
    for (let i = 0; i < pts0.length - 1; i++) for (let k = 0; k < sub; k++) {
      const a = pts0[Math.max(i - 1, 0)], b = pts0[i], c = pts0[i + 1], d = pts0[Math.min(i + 2, pts0.length - 1)], t = k / sub, q = [];
      for (let m = 0; m < b.length; m++) q.push(0.5 * (2 * b[m] + (c[m] - a[m]) * t + (2 * a[m] - 5 * b[m] + 4 * c[m] - d[m]) * t * t + (3 * b[m] - a[m] - 3 * c[m] + d[m]) * t * t * t));
      pts.push(q);
    }
    pts.push(pts0[pts0.length - 1].slice());
    const n = pts.length, P = new Float64Array(n * 11), M = new Float64Array(n * 4);
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, n - 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1], tz = b[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const wd = pts[i].length > 7 ? [pts[i][5], pts[i][6], pts[i][7]] : wide;      // a point may carry its own broad direction (a twisting blade)
      const d = wd[0] * tx + wd[1] * ty + wd[2] * tz;
      let ux = wd[0] - d * tx, uy = wd[1] - d * ty, uz = wd[2] - d * tz; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
      P.set([pts[i][0], pts[i][1], pts[i][2], pts[i][3], pts[i][4], ux, uy, uz, tx, ty, tz], i * 11);
      cx += pts[i][0] / n; cy += pts[i][1] / n; cz += pts[i][2] / n;
    }
    let R = 0;
    for (let i = 0; i < n; i++) R = Math.max(R, Math.hypot(pts[i][0] - cx, pts[i][1] - cy, pts[i][2] - cz) + Math.max(pts[i][3], pts[i][4]));
    for (let i = 0; i < n - 1; i++) {                           // each segment's bounding sphere
      const a = pts[i], b = pts[i + 1];
      M.set([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2 + Math.max(a[3], a[4], b[3], b[4])], i * 4);
    }
    return { P, M, n, cx, cy, cz, R };
  },
  /** lower bound of the distance to a tube (its bounding sphere): skip the tube when this exceeds what matters */
  tubeBound(T, x, y, z) { return hyp3(x - T.cx, y - T.cy, z - T.cz) - T.R; },
  /**
   * Distance to the swept blade: a stadium section, 2 ru broad and 2 rv thick with round edges of radius rv, carried
   * along the centreline in a frame that turns smoothly from station to station (so a twisting blade has no creases).
   */
  tube(T, x, y, z, cut = 1e9) {                                // distances beyond `cut` may come back as any value >= cut
    const P = T.P, M = T.M, last = T.n - 2; let best = 1e18, bi = -1, bt = 0, btt = 0;
    const lim0 = Math.max(cut, 0);
    for (let i = 0; i <= last; i++) {
      const m = i * 4, mx = x - M[m], my = y - M[m + 1], mz = z - M[m + 2], lim = lim0 + M[m + 3];
      if (mx * mx + my * my + mz * mz > lim * lim) continue;
      const o = i * 11, q = o + 11, ax = P[o], ay = P[o + 1], az = P[o + 2], dx = P[q] - ax, dy = P[q + 1] - ay, dz = P[q + 2] - az;
      const px = x - ax, py = y - ay, pz = z - az, dd = dx * dx + dy * dy + dz * dz + 1e-9;
      const tt = (px * dx + py * dy + pz * dz) / dd, t = tt < 0 ? 0 : tt > 1 ? 1 : tt;
      const ex = px - dx * t, ey = py - dy * t, ez = pz - dz * t, d2 = ex * ex + ey * ey + ez * ez;
      if (d2 < best) { best = d2; bi = i; bt = t; btt = tt; }
    }
    if (bi < 0) return cut;
    const o = bi * 11, q = o + 11, s = 1 - bt;
    const qx = x - (P[o] * s + P[q] * bt), qy = y - (P[o + 1] * s + P[q + 1] * bt), qz = z - (P[o + 2] * s + P[q + 2] * bt);
    const ru = P[o + 3] * s + P[q + 3] * bt, rv = P[o + 4] * s + P[q + 4] * bt;
    let ux = P[o + 5] * s + P[q + 5] * bt, uy = P[o + 6] * s + P[q + 6] * bt, uz = P[o + 7] * s + P[q + 7] * bt;
    let tx = P[o + 8] * s + P[q + 8] * bt, ty = P[o + 9] * s + P[q + 9] * bt, tz = P[o + 10] * s + P[q + 10] * bt;
    const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const ut = ux * tx + uy * ty + uz * tz; ux -= ut * tx; uy -= ut * ty; uz -= ut * tz;
    const ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const a = Math.abs(qx * ux + qy * uy + qz * uz);                                               // across the blade's breadth
    const b = qx * (ty * uz - tz * uy) + qy * (tz * ux - tx * uz) + qz * (tx * uy - ty * ux);        // through its thickness
    const atEnd = (bi === 0 && btt < 0) || (bi === last && btt > 1), l = atEnd ? qx * tx + qy * ty + qz * tz : 0;   // past a real end
    const e = Math.max(a - Math.max(ru - rv, 0), 0);
    return Math.sqrt(e * e + l * l + b * b) - rv;
  },
};

const CORNER = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];

/**
 * Extract a welded surface (surface nets) from field(x, y, z) < 0 inside box [x0,y0,z0,x1,y1,z1] at `cell` metres,
 * in short yielded steps, and bake the style's attributes: aC (fold coordinate: 0.45 curvature, 0.3 height, 0.25 normal
 * against the form's own axis; 0 light, 1 dark), aW (swell coordinate, bore weight, cos, sin) and normal.
 * Only blocks near the surface are sampled. The field should be roughly a distance (gradient near 1).
 */
export async function buildBoneGeometry(ctx, field, box, cell, opts = {}) {
  const [x0, y0, z0, x1, y1, z1] = box;
  const nx = Math.ceil((x1 - x0) / cell) + 1, ny = Math.ceil((y1 - y0) / cell) + 1, nz = Math.ceil((z1 - z0) / cell) + 1;
  const B = 4, sy = nx, sz = nx * ny, D = new Float32Array(nx * ny * nz);
  const thr = cell * B * 0.87 * (opts.lipschitz ?? 1.22) + cell * 1.4;
  const doYield = ctx.yield ? () => ctx.yield() : async () => {};
    const tick = async () => { await doYield(); };      // ctx.yield() itself only waits when a few ms have passed
  const blocks = [];
  // 1. sample: coarse block centres first, then every node of the blocks the surface can pass through
  for (let kb = 0; kb * B < nz; kb++) {
    for (let jb = 0; jb * B < ny; jb++) {
      for (let ib = 0; ib * B < nx; ib++) {
        const i0 = ib * B, j0 = jb * B, k0 = kb * B, i1 = Math.min(i0 + B, nx), j1 = Math.min(j0 + B, ny), k1 = Math.min(k0 + B, nz);
        const dc = field(x0 + (i0 + i1 - 1) * 0.5 * cell, y0 + (j0 + j1 - 1) * 0.5 * cell, z0 + (k0 + k1 - 1) * 0.5 * cell);
        if (Math.abs(dc) < thr) {
          blocks.push(i0, j0, k0, i1, j1, k1);
          for (let k = k0; k < k1; k++) for (let j = j0; j < j1; j++) {
            let n = k * sz + j * sy + i0; const y = y0 + j * cell, z = z0 + k * cell;
            for (let i = i0; i < i1; i++) D[n++] = field(x0 + i * cell, y, z);
          }
        } else {
          for (let k = k0; k < k1; k++) for (let j = j0; j < j1; j++) { const n = k * sz + j * sy; D.fill(dc, n + i0, n + i1); }
        }
      }
      await tick();
    }
  }
  // 2. one vertex in every cell the surface crosses
  await doYield();
  const cellV = new Int32Array(nx * ny * nz), pos = [], off = CORNER.map((c) => c[0] + c[1] * sy + c[2] * sz), v = new Float32Array(8);
  // (the hot loops of steps 2 to 4 are plain functions called a piece at a time: a loop written inside an async function runs slower)
  const cellsOf = (b) => {
    const i1 = Math.min(blocks[b + 3], nx - 1), j1 = Math.min(blocks[b + 4], ny - 1), k1 = Math.min(blocks[b + 5], nz - 1);
    for (let k = blocks[b + 2]; k < k1; k++) for (let j = blocks[b + 1]; j < j1; j++) for (let i = blocks[b]; i < i1; i++) {
      const n = k * sz + j * sy + i; let mask = 0;
      for (let c = 0; c < 8; c++) { v[c] = D[n + off[c]]; if (v[c] < 0) mask |= 1 << c; }
      if (mask === 0 || mask === 255) continue;
      let px = 0, py = 0, pz = 0, cnt = 0;
      for (let e = 0; e < 12; e++) {
        const a = EDGES[e][0], c = EDGES[e][1], va = v[a], vc = v[c];
        if ((va < 0) === (vc < 0)) continue;
        const t = va / (va - vc), A = CORNER[a], C = CORNER[c];
        px += A[0] + (C[0] - A[0]) * t; py += A[1] + (C[1] - A[1]) * t; pz += A[2] + (C[2] - A[2]) * t; cnt++;
      }
      cellV[n] = pos.length / 3 + 1;
      pos.push(x0 + (i + px / cnt) * cell, y0 + (j + py / cnt) * cell, z0 + (k + pz / cnt) * cell);
    }
  };
  for (let b = 0; b < blocks.length; b += 6) { cellsOf(b); if ((b / 6) % 3 === 0) await tick(); }
  // 3. one quad round every grid edge that changes sign
  const idx = [];
  const quad = (a, b2, c, d, inside) => {
    if (a === 0 || b2 === 0 || c === 0 || d === 0) return;
    a--; b2--; c--; d--;
    if (inside) idx.push(a, b2, c, a, c, d); else idx.push(a, c, b2, a, d, c);
  };
  const quadsOf = (b) => {
    for (let k = Math.max(blocks[b + 2], 1); k < blocks[b + 5]; k++) for (let j = Math.max(blocks[b + 1], 1); j < blocks[b + 4]; j++) for (let i = Math.max(blocks[b], 1); i < blocks[b + 3]; i++) {
      const n = k * sz + j * sy + i, d0 = D[n], s0 = d0 < 0;
      if (i + 1 < nx && s0 !== (D[n + 1] < 0)) quad(cellV[n - sy - sz], cellV[n - sz], cellV[n], cellV[n - sy], s0);
      if (j + 1 < ny && s0 !== (D[n + sy] < 0)) quad(cellV[n - sz - 1], cellV[n - 1], cellV[n], cellV[n - sz], s0);
      if (k + 1 < nz && s0 !== (D[n + sz] < 0)) quad(cellV[n - 1 - sy], cellV[n - sy], cellV[n], cellV[n - 1], s0);
    }
  };
  for (let b = 0; b < blocks.length; b += 6) { quadsOf(b); if ((b / 6) % 3 === 0) await tick(); }
  // 4. bake: normal from the field's gradient, fold coordinate, swell coordinate
  const nv = pos.length / 3, P = new Float32Array(pos), N = new Float32Array(nv * 3), C = new Float32Array(nv), W = new Float32Array(nv * 4);
  const ax = opts.axis || [0.3, 0.85, 0.4], al = Math.hypot(ax[0], ax[1], ax[2]) || 1;
  const hy0 = opts.y0 ?? y0, hy1 = opts.y1 ?? y1;
  const gain = opts.curvGain ?? 40, cGain = opts.cGain ?? 2.9, cBias = opts.cBias ?? -0.36;
  const BL = opts.boreLine ? new Float32Array(nv) : null;      // aBore: the angle round a bore of its first white line at each vertex's depth
  const normalsOf = (qa, qb) => { for (let q = qa; q < qb; q++) {   // normals: the field's gradient, interpolated inside the cell
    const fx = (P[q * 3] - x0) / cell, fy = (P[q * 3 + 1] - y0) / cell, fz = (P[q * 3 + 2] - z0) / cell;
    const i = clamp(Math.floor(fx), 1, nx - 3), j = clamp(Math.floor(fy), 1, ny - 3), k = clamp(Math.floor(fz), 1, nz - 3);
    const tx = fx - i, ty = fy - j, tz = fz - k, n0 = k * sz + j * sy + i;
    let gx = 0, gy = 0, gz = 0;
    for (let c = 0; c < 8; c++) {
      const n = n0 + off[c], w = (CORNER[c][0] ? tx : 1 - tx) * (CORNER[c][1] ? ty : 1 - ty) * (CORNER[c][2] ? tz : 1 - tz);
      gx += w * (D[n + 1] - D[n - 1]); gy += w * (D[n + sy] - D[n - sy]); gz += w * (D[n + sz] - D[n - sz]);
    }
    const gl = Math.hypot(gx, gy, gz) || 1; N[q * 3] = gx / gl; N[q * 3 + 1] = gy / gl; N[q * 3 + 2] = gz / gl;
  } };
  for (let q = 0; q < nv; q += 256) { normalsOf(q, Math.min(q + 256, nv)); await tick(); }
  // curvature from the mesh itself (how the normal turns along each edge), then smoothed so it reads as a swell
  let K = new Float32Array(nv), K2 = new Float32Array(nv); const cnt = new Float32Array(nv), nt = idx.length;
  const curvOf = (ta, tb) => { for (let t = ta; t < tb; t += 3) { for (let e = 0; e < 3; e++) {
    const a = idx[t + e], b = idx[t + (e + 1) % 3], a3 = a * 3, b3 = b * 3;
    const dx = P[b3] - P[a3], dy = P[b3 + 1] - P[a3 + 1], dz = P[b3 + 2] - P[a3 + 2];
    const kk = ((N[b3] - N[a3]) * dx + (N[b3 + 1] - N[a3 + 1]) * dy + (N[b3 + 2] - N[a3 + 2]) * dz) / Math.max(dx * dx + dy * dy + dz * dz, 1e-6);
    K[a] += kk; K[b] += kk; cnt[a] += 1; cnt[b] += 1;
  } } };
  for (let t = 0; t < nt; t += 1536) { await tick(); curvOf(t, Math.min(t + 1536, nt)); }
  for (let q = 0; q < nv; q++) K[q] /= Math.max(cnt[q], 1);
  await tick();
  for (let pass = 0; pass < (opts.curvSmooth ?? 5); pass++) {
    K2.set(K);
    const from = K, to = K2, smoothOf = (ta, tb) => { for (let t = ta; t < tb; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; to[a] += from[b] + from[c]; to[b] += from[a] + from[c]; to[c] += from[a] + from[b]; } };
    for (let t = 0; t < nt; t += 3072) { await tick(); smoothOf(t, Math.min(t + 3072, nt)); }
    for (let q = 0; q < nv; q++) K2[q] /= 1 + cnt[q];
    const sw = K; K = K2; K2 = sw;
    await tick();
  }
  const Kf = K, bakeOf = (qa, qb) => { for (let q = qa; q < qb; q++) {
    const x = P[q * 3], y = P[q * 3 + 1], z = P[q * 3 + 2];
    const curv = 0.5 + 0.5 * Math.tanh(Kf[q] * gain);
    const h = clamp((y - hy0) / Math.max(hy1 - hy0, 1e-3), 0, 1), nd = 0.5 + 0.5 * (N[q * 3] * ax[0] + N[q * 3 + 1] * ax[1] + N[q * 3 + 2] * ax[2]) / al;
    C[q] = clamp(cBias + cGain * (1 - (0.45 * curv + 0.3 * h + 0.25 * nd)) + (opts.cAdd ? opts.cAdd(x, y, z) : 0), 0, 1);
    W[q * 4] = opts.swell ? opts.swell(x, y, z) : (x * 0.4 + y * 0.8 + z * 0.4) / 40;
    const bo = opts.bore ? opts.bore(x, y, z) : null;
    if (bo) { W[q * 4 + 1] = bo[0]; W[q * 4 + 2] = bo[1]; W[q * 4 + 3] = bo[2]; C[q] = lerp(C[q], opts.boreC ?? 0.5, bo[0]); if (BL) BL[q] = opts.boreLine(bo); }
  } };
  for (let q = 0; q < nv; q += 256) { bakeOf(q, Math.min(q + 256, nv)); await tick(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('aC', new THREE.BufferAttribute(C, 1));
  g.setAttribute('aW', new THREE.BufferAttribute(W, 4));
  if (BL) g.setAttribute('aBore', new THREE.BufferAttribute(BL, 1));
  await tick();
  g.setIndex(nv > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
  await tick();
  // bounds as three computes them (the box, then the furthest vertex from its centre), in plain loops: three's own two
  // calls walk every vertex through a Vector3 and held the page for one long step
  const bb = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (let q = 0; q < nv * 3; q += 3) for (let c = 0; c < 3; c++) { const t = P[q + c]; if (t < bb[c]) bb[c] = t; if (t > bb[c + 3]) bb[c + 3] = t; }
  const bcx = (bb[0] + bb[3]) / 2, bcy = (bb[1] + bb[4]) / 2, bcz = (bb[2] + bb[5]) / 2; let br = 0;
  for (let q = 0; q < nv * 3; q += 3) { const dx = P[q] - bcx, dy = P[q + 1] - bcy, dz = P[q + 2] - bcz, d2 = dx * dx + dy * dy + dz * dz; if (d2 > br) br = d2; }
  g.boundingBox = new THREE.Box3(new THREE.Vector3(bb[0], bb[1], bb[2]), new THREE.Vector3(bb[3], bb[4], bb[5]));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(bcx, bcy, bcz), Math.sqrt(br));
  return g;
}

// Surface helpers for marks: gradient and projection onto a field's zero surface.
function surfaceTools(field) {
  const n = [0, 1, 0];
  const grad = (x, y, z) => {
    const e = 0.5; n[0] = field(x + e, y, z) - field(x - e, y, z); n[1] = field(x, y + e, z) - field(x, y - e, z); n[2] = field(x, y, z + e) - field(x, y, z - e);
    const l = Math.hypot(n[0], n[1], n[2]) || 1; n[0] /= l; n[1] /= l; n[2] /= l; return n;
  };
  const project = (p) => { for (let i = 0; i < 4; i++) { const d = field(p[0], p[1], p[2]); grad(p[0], p[1], p[2]); p[0] -= n[0] * d; p[1] -= n[1] * d; p[2] -= n[2] * d; } return Math.abs(field(p[0], p[1], p[2])); };
  return { n, grad, project };
}

/**
 * Sutures: hairline S-curves walked across a field's surface. starts = [{ p: [x,y,z] (near the surface), dir: [x,y,z],
 * len (m), wob (radians of S-swing), wave (m), w (half width, m) }]. Returns a ribbon geometry for okLineMaterial:
 * the vertex shader keeps it at least 1.5 px wide and thins its alpha by coverage instead, so it never shimmers.
 */
export async function sutureRibbons(field, starts, rng, yieldFn) {
  const T = surfaceTools(field), pos = [], side = [], half = [], idx = [];
  for (const s of starts) {
    if (yieldFn) await yieldFn();
    const p = s.p.slice(), step = s.step ?? 2.5, cnt = Math.max(Math.round(s.len / step), 2), ph = rng() * 6.28, base = pos.length / 3;
    T.project(p);
    let t = s.dir.slice();
    for (let i = 0; i <= cnt; i++) {
      if (yieldFn && (i & 3) === 3) await yieldFn();
      const n = T.grad(p[0], p[1], p[2]), nx = n[0], ny = n[1], nz = n[2];
      const d = t[0] * nx + t[1] * ny + t[2] * nz; t[0] -= d * nx; t[1] -= d * ny; t[2] -= d * nz;
      const tl = Math.hypot(t[0], t[1], t[2]) || 1; t[0] /= tl; t[1] /= tl; t[2] /= tl;
      const bx = ny * t[2] - nz * t[1], by = nz * t[0] - nx * t[2], bz = nx * t[1] - ny * t[0];
      const a = (s.wob ?? 0.5) * Math.sin(6.2832 * i * step / (s.wave ?? 70) + ph), ca = Math.cos(a), sa = Math.sin(a);
      const dx = t[0] * ca + bx * sa, dy = t[1] * ca + by * sa, dz = t[2] * ca + bz * sa;
      const sx = ny * dz - nz * dy, sy = nz * dx - nx * dz, sz = nx * dy - ny * dx;
      const e = i / cnt, hw = (s.w ?? 0.16) * Math.sqrt(Math.max(Math.sin(Math.PI * Math.min(e, 1 - e) * 3 > 1.5708 ? 1.5708 : Math.PI * Math.min(e, 1 - e) * 3), 0));
      for (const sg of [-1, 1]) { pos.push(p[0] + nx * 0.2, p[1] + ny * 0.2, p[2] + nz * 0.2); side.push(sx * sg, sy * sg, sz * sg); half.push(hw); }
      if (i < cnt) { const q = base + i * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
      p[0] += dx * step; p[1] += dy * step; p[2] += dz * step; T.project(p);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3));
  g.setAttribute('aHalf', new THREE.Float32BufferAttribute(half, 1));
  g.setIndex(idx);
  return g;
}
/** Material for sutureRibbons (and the world's dry-wash threads): one flat pigment, at least 1.5 px wide. */
export function okLineMaterial(hex) {
  return new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(hex) }, uOkViewH: okUniforms.uOkViewH },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: /* glsl */`attribute vec3 aSide; attribute float aHalf; uniform float uOkViewH; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        float wpp = max(-mv.z, .05) / max(projectionMatrix[1][1] * uOkViewH * .5, 1e-4);      // metres per pixel here
        float hw = max(aHalf, .75 * wpp);
        vA = clamp(aHalf / max(.75 * wpp, 1e-5), 0., 1.) * smoothstep(0., .02, aHalf);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position + aSide * hw, 1.);
      }`,
    fragmentShader: 'uniform vec3 uCol; varying float vA; void main(){ gl_FragColor = vec4(uCol, vA); }',
  });
}

/**
 * Nutrient holes: ovals lying on a field's surface. seeds = [{ p: [x,y,z], r (m), thin (1 = sky shows through) }].
 * One merged mesh of quads for okHoleMaterial: a lavender lip, wider on one side (a different side for every hole),
 * round a core that is flat sky where the bone is thin and deep lavender where it is not.
 */
export async function holeDecals(field, seeds, rng, yieldFn) {
  const T = surfaceTools(field), pos = [], uv = [], info = [], idx = [];
  for (const s of seeds) {
    if (yieldFn && (seeds.indexOf(s) & 1) === 0) await yieldFn();
    const p = s.p.slice();
    if (T.project(p) > 0.4) { rng(); rng(); rng(); continue; }
    const n = T.grad(p[0], p[1], p[2]).slice(), ang = rng() * 6.283, asp = 0.5 + rng() * 0.35, lip = rng() * 6.283;
    let ux = n[1], uy = -n[0], uz = 0; if (Math.abs(n[2]) > 0.9) { ux = 1; uy = 0; uz = 0; }
    const d = ux * n[0] + uy * n[1] + uz * n[2]; ux -= d * n[0]; uy -= d * n[1]; uz -= d * n[2];
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = n[1] * uz - n[2] * uy, vy = n[2] * ux - n[0] * uz, vz = n[0] * uy - n[1] * ux, ca = Math.cos(ang), sa = Math.sin(ang);
    const ax = ux * ca + vx * sa, ay = uy * ca + vy * sa, az = uz * ca + vz * sa, bx = vx * ca - ux * sa, by = vy * ca - uy * sa, bz = vz * ca - uz * sa;
    const base = pos.length / 3, E = 2.1, ra = s.r * E, rb = s.r * asp * E;
    // only where the bone is nearly flat under the whole quad (never across a knife edge)
    if (Math.abs(field(p[0] + ax * ra, p[1] + ay * ra, p[2] + az * ra)) > 0.12 * ra || Math.abs(field(p[0] - ax * ra, p[1] - ay * ra, p[2] - az * ra)) > 0.12 * ra
      || Math.abs(field(p[0] + bx * rb, p[1] + by * rb, p[2] + bz * rb)) > 0.12 * ra || Math.abs(field(p[0] - bx * rb, p[1] - by * rb, p[2] - bz * rb)) > 0.12 * ra) continue;
    for (const [cu, cv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      pos.push(p[0] + n[0] * 0.25 + ax * ra * cu + bx * rb * cv, p[1] + n[1] * 0.25 + ay * ra * cu + by * rb * cv, p[2] + n[2] * 0.25 + az * ra * cu + bz * rb * cv);
      uv.push(cu * E, cv * E); info.push(s.thin ? 1 : 0, lip, s.r * asp);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aHole', new THREE.Float32BufferAttribute(info, 3));
  g.setIndex(idx);
  return g;
}
export function okHoleMaterial(pal = PALETTE) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uOkViewH: okUniforms.uOkViewH, uBlue: { value: lin(pal[0]) }, uPale: { value: lin(pal[5]) },
      uLip: { value: mixHex(pal[2], pal[6], 0.1) }, uDeep: { value: mixHex(pal[2], pal[6], 0.42) },
    },
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    vertexShader: /* glsl */`attribute vec2 aUv; attribute vec3 aHole; uniform float uOkViewH;
      varying vec2 vUv; varying vec3 vHole; varying vec3 vDir; varying float vFade;
      void main(){
        vec4 wp = modelMatrix * vec4(position, 1.); vec4 mv = viewMatrix * wp;
        float wpp = max(-mv.z, .05) / max(projectionMatrix[1][1] * uOkViewH * .5, 1e-4);
        vFade = smoothstep(1., 3., aHole.z / max(wpp, 1e-5));          // a hole under ~2 px melts into the bone
        vUv = aUv; vHole = aHole; vDir = wp.xyz - cameraPosition;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`uniform vec3 uBlue, uPale, uLip, uDeep;
      varying vec2 vUv; varying vec3 vHole; varying vec3 vDir; varying float vFade;
      ${SKY_GLSL}
      void main(){
        float r = length(vUv), aa = fwidth(r) + 1e-4;
        vec2 d = vUv / max(r, 1e-4), l = vec2(cos(vHole.y), sin(vHole.y));
        float side = .5 + .5 * dot(d, l);
        float core = 1. - smoothstep(1. - aa, 1. + aa, r);
        float lip = (1. - smoothstep(1., 1.25 + .8 * side, r)) * (.35 + .5 * side);
        vec3 inner = mix(mix(uDeep, uLip, smoothstep(.45, 1., r) * (1. - side)), okSky(vDir, uBlue, uPale), step(.5, vHole.x));
        gl_FragColor = vec4(mix(uLip, inner, core), max(core, lip) * vFade);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// The back bone's field. Local frame: front +Z (the camera comes from +Z), starboard +X, canal axis toward -Z rising 12 deg.
function makeHeroField(rng) {
  const j = (a) => (rng() * 2 - 1) * a;
  const S = {};
  S.yb = 48 + j(3); S.rb = 60 + j(3); S.hl = 42 + j(3); S.waist = 12 + j(2);          // drum
  S.cy = 140; S.rc = 23; S.tilt = 12 * Math.PI / 180;                                  // canal (fixed by the brief)
  S.ay = Math.sin(S.tilt); S.az = -Math.cos(S.tilt);
  S.rm = 38.5 + j(1.5); S.hw = 13 + j(1.5); S.hd = 35;                                 // arch ring
  S.crestH = 40 + j(6); S.crestLean = -10 + j(6); S.crestX = j(3);                     // blunt crest, a touch off centre
  const sweep = 0.8 + rng() * 0.38, lift = j(12);
  // starboard wing (+X): root broad and upright, twisting to a broad horizontal blade; S-curve out, forward and up
  const wingPts = (sgn, len, lf, sw) => [
    [sgn * 30, 150, -4, 34, 15, 0, 1, 0.1],
    [sgn * (36 + 28 * len), 176 + lf * 0.3, 8 * sw, 36, 11, 0, 0.9, 0.45],
    [sgn * (36 + 56 * len), 189 + lf * 0.6, 26 * sw, 39, 8.5, sgn * 0.1, 0.7, 0.75],
    [sgn * (36 + 84 * len), 178 + lf * 0.8, 48 * sw, 41, 7, sgn * 0.2, 0.55, 0.9],
    [sgn * (36 + 110 * len), 161 + lf, 68 * sw, 37, 6, sgn * 0.3, 0.5, 1],
    [sgn * (36 + 132 * len), 176 + lf * 1.2, 84 * sw, 29, 5, sgn * 0.4, 0.55, 1],
  ];
  const sp = wingPts(1, 1, lift, sweep), pp = wingPts(-1, 1.04 + rng() * 0.08, lift + j(7), sweep * (0.9 + rng() * 0.2));
  pp.push([pp[5][0] - 19, pp[5][1] + 11, pp[5][2] + 11, 20, 5.5, -0.4, 0.58, 1]);                     // the port wing ends whole, in a paddle
  S.wingS = F.makeTube(sp, [0, 1, 0]); S.wingP = F.makeTube(pp, [0, 1, 0]);
  const strut = (sgn, w) => F.makeTube([                    // a flat band looping from the drum up to the wing: the gap of sky is inside it
    [sgn * 44, 58 + j(4), 8, 22, 12, 0, 0.3, 1], [sgn * (80 + j(4)), 64 + j(4), 16, 20, 8, 0, 0.2, 1], [sgn * (108 + j(4)), 88, 28 * w, 18, 6.5, sgn * 0.2, 0.2, 1],
    [sgn * (119 + j(3)), 122, 38 * w, 17, 6, sgn * 0.5, 0.2, 1], [sgn * 110, 152 + lift * 0.4, 36 * w, 16, 6, sgn * 0.3, 0.5, 1], [sgn * 96, 180 + lift * 0.62, 28 * w, 14, 6, sgn * 0.1, 0.7, 0.75],
  ], [0, 0, 1]);
  S.strutS = strut(1, sweep); S.strutP = strut(-1, sweep);
  // the snap: a plane across the starboard wing between its last two stations
  const a = sp[4], b = sp[5], tl = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  S.cut = { t: [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl, (b[2] - a[2]) / tl], p: [lerp(a[0], b[0], 0.15), lerp(a[1], b[1], 0.15), lerp(a[2], b[2], 0.15)], len: 17 + rng() * 5 };
  S.spPts = sp; S.ppPts = pp;

  const canal = (x, y, z, out) => {                    // out: [s along the axis, r from it, cos, sin]
    const py = y - S.cy, s = py * S.ay + z * S.az, qy = py - s * S.ay, qz = z - s * S.az;
    const e2 = qy * S.az - qz * S.ay, r = hyp2(x, e2);
    out[0] = s; out[1] = r; out[2] = x / Math.max(r, 1e-3); out[3] = e2 / Math.max(r, 1e-3);
  };
  const tmp = [0, 0, 0, 0];
  const solid = (x, y, z) => {
    const zz = clamp(z / S.hl, -1, 1), rb = S.rb - S.waist * (1 - zz * zz * zz * zz);
    let d = F.smax(hyp2(x / 1.1, y - S.yb) - rb, Math.abs(z) - S.hl, 14);
    const dish = 148 - hyp3(x, y - S.yb, Math.abs(z) - (S.hl + 141));       // the end plates are shallow dishes
    d = F.smax(d, dish, 9);
    canal(x, y, z, tmp);
    const s = tmp[0], r = tmp[1], rd = 13, qx = Math.abs(r - S.rm) - S.hw + rd, qy = Math.abs(s) - S.hd + rd;
    const ring = hyp2(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rd;
    d = F.smin(d, ring, 22);
    d = F.smin(d, F.ell(x, y, z, S.crestX + (y - 200) * 0.06, 196 + S.crestH * 0.25, S.crestLean - (y - 200) * 0.25, 13, S.crestH, 34), 30);
    const K = 16;
    if (F.tubeBound(S.wingS, x, y, z) < d + K) d = F.smin(d, F.tube(S.wingS, x, y, z, d + K), K);
    if (F.tubeBound(S.wingP, x, y, z) < d + K) d = F.smin(d, F.tube(S.wingP, x, y, z, d + K), K);
    if (F.tubeBound(S.strutS, x, y, z) < d + K) d = F.smin(d, F.tube(S.strutS, x, y, z, d + K), K);
    if (F.tubeBound(S.strutP, x, y, z) < d + K) d = F.smin(d, F.tube(S.strutP, x, y, z, d + K), K);
    const sn = clamp(s / S.hd, -1.2, 1.2), bore = S.rc + 5 * sn * sn * sn * sn;                       // the mouths flare a little
    return F.smax(d, bore - r, 7);
  };
  const cutPlane = (x, y, z) => (x - S.cut.p[0]) * S.cut.t[0] + (y - S.cut.p[1]) * S.cut.t[1] + (z - S.cut.p[2]) * S.cut.t[2];
  const main = (x, y, z) => { const d = solid(x, y, z); return x > 90 ? Math.max(d, cutPlane(x, y, z)) : d; };
  const swell = (x, y, z) => (Math.abs(x + 9) * 0.45 + y * 0.8 + z * 0.35) / 42;
  const bore = (x, y, z) => {
    canal(x, y, z, tmp);
    const m = (1 - smoothstep(S.rc + 3, S.rc + 12, tmp[1])) * (1 - smoothstep(S.hd - 2, S.hd + 8, Math.abs(tmp[0])));
    return [m, tmp[2], tmp[3], tmp[0]];                          // (the fourth: metres along the bore's axis from its middle, for the winding of the bore's own swell)
  };
  return { S, solid, main, cutPlane, swell, bore, canal };
}

// The snapped tip of the starboard wing, as its own finer field: the wing beyond the cut plane, ended by a rough
// break pitted with rounded open cells (the only rough thing in the world).
function makeTipField(rng, H) {
  const S = H.S, T = S.wingS, t = S.cut.t, p0 = S.cut.p, L = S.cut.len, o = 4 * 11;
  let u = [T.P[o + 5], T.P[o + 6], T.P[o + 7]];
  const du = u[0] * t[0] + u[1] * t[1] + u[2] * t[2]; u = u.map((c, i) => c - du * t[i]); const ul = Math.hypot(...u) || 1; u = u.map((c) => c / ul);
  const v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]];
  const f1 = 0.2 + rng() * 0.1, f2 = 0.33 + rng() * 0.1, ph = rng() * 6;
  const rough = (a) => 2.6 * Math.sin(a * f1 + ph) + 1.3 * Math.sin(a * f2 * 2.1 + ph * 2) - a * 0.06;     // a slanted, bitten break
  const cells = [], n = 110;
  for (let i = 0; i < n; i++) {
    const a = (rng() * 2 - 1) * 31, b = (rng() * 2 - 1) * 3.4, r = 1.1 + rng() * rng() * 1.7, dep = L + rough(a) - r * (0.1 + rng() * 0.5);
    cells.push(p0[0] + t[0] * dep + u[0] * a + v[0] * b, p0[1] + t[1] * dep + u[1] * a + v[1] * b, p0[2] + t[2] * dep + u[2] * a + v[2] * b, r, a);
  }
  const field = (x, y, z) => {
    const s = H.cutPlane(x, y, z);
    let d = Math.max(F.tube(T, x, y, z), -s);
    const a = (x - p0[0]) * u[0] + (y - p0[1]) * u[1] + (z - p0[2]) * u[2];
    d = F.smax(d, s - L - rough(a), 1.0);
    if (d < 1.5 && d > -7 && s > L + rough(a) - 7) for (let i = 0; i < cells.length; i += 5) {
      if (Math.abs(cells[i + 4] - a) > 3.4) continue;
      const c = cells[i + 3] - hyp3(x - cells[i], y - cells[i + 1], z - cells[i + 2]);
      if (c > d - 0.5) d = F.smax(d, c, 0.4);
    }
    return d;
  };
  const box = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
  for (const s of [-1, L + 7]) for (const a of [-33, 33]) for (const b of [-10, 10]) for (let i = 0; i < 3; i++) {
    const c = p0[i] + t[i] * s + u[i] * a + v[i] * b; box[i] = Math.min(box[i], c); box[i + 3] = Math.max(box[i + 3], c);
  }
  // the broken face and its cells are darker the deeper they lie inside what was the wing (baked, not lit)
  const cAdd = (x, y, z) => {
    const inside = -F.tube(T, x, y, z), a = (x - p0[0]) * u[0] + (y - p0[1]) * u[1] + (z - p0[2]) * u[2], depth = L + rough(a) - H.cutPlane(x, y, z);
    return 0.42 * smoothstep(0.25, 2.2, inside) + 0.5 * smoothstep(0.3, 2.6, depth) * smoothstep(0.25, 1.2, inside);
  };
  return { field, cAdd, box, end: [p0[0] + t[0] * L, p0[1] + t[1] * L, p0[2] + t[2] * L], u, v };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE;
  const detail = clamp(opts.detail ?? 1, 0.6, 1), drive = opts.drivePhase !== false;
  const group = new THREE.Group(); group.name = 'sky-through-the-bone-hero';
  const H = makeHeroField(rng), S = H.S;
  const tipF = makeTipField(rng, H);
  // THE BORE'S OWN SWELL. On the bore's wall the fold coordinate is the place ROUND the bore, counted from the first
  // white line: round the bore the swell goes THREE times, three lines of the form's light along the wall and three of
  // its dark between them, each rise and each fall through the ramp's eight bands, so the bands run ALONG the bore,
  // never round it as rings, and no side of the bore is the light side.
  // The three swells are unequal. Their shares of the round are 1/3 + BORE_UNEQ cos(2 pi (d + i/3)), d = opts.boreShares
  // (one number 0..1 the world draws): three cosines a third of a turn apart sum to nought, so the shares sum to one for
  // every d with nothing to try; BORE_UNEQ is 1/15, the most that keeps the largest at or under two fifths (the
  // smallest is then never under 4/15, over the quarter). The largest and the smallest always differ by a tenth of
  // the round or more; two of the three can come near each other.
  // In each swell the dark line stands off the middle, by the two neighbouring swells: the half of the swell next to a
  // neighbour is to the other half as the OTHER neighbour's share is to that neighbour's. A band is then wider on one
  // side of every fold, light or dark (the hand's fault), with no further number; and this way round, the half beside
  // a broad neighbour is the narrow one, so the flats of white at the three white lines stay near one size and none
  // of them stands out as the bore's light side.
  // From a line of light to the line of dark next to it the value runs evenly (eight bands of one width), rounded next
  // to each line (okBoreFold in the fragment shader), so no line is a crease.
  // The lines WIND: from the near rim to the far rim (S.hd metres to either side of the bore's middle, by metres along
  // its axis) their angle turns by BORE_WIND of a turn, as one long S: t * t * (3 - 2 t) of the depth, which stands
  // still at both rims and turns quickest in the bore's middle. (Still at the rims: the lines meet each rim's hard edge
  // square, run on through the flared lips with no corner, and where the bore's weight gives way to the bone's own
  // fold coordinate at the two mouths the swell is not sheared.) A third of a turn, toward the falling angle: the hand
  // the bore's own suture winds (it starts under the axis at the near rim and drifts to +X as it goes in).
  // Where the first white line stands at the near rim is opts.boreStart, in turns, drawn by the world like the shares.
  // They TURN: the shader carries the whole pattern round the axis by the angle uBoreTurn, which the world sets from
  // its clock. The bake therefore leaves the wall's own swell out: boreC 0 draws the bone's fold coordinate toward nought
  // by the bore's weight, boreLine bakes the first white line's angle at each vertex's depth (aBore), and the fragment
  // shader adds weight x swell (under the power uBoreK the world raises aC to, if it does, and as that power's root, so
  // that the power bends the bone's own share as before and leaves the swell's bands even).
  const BORE_WIND = -1 / 3, BORE_UNEQ = 1 / 15, boreStart = opts.boreStart ?? 0, boreD = opts.boreShares ?? 0;
  const boreShare = [0, 1, 2].map((i) => 1 / 3 + BORE_UNEQ * Math.cos(6.2831853 * (boreD + i / 3)));
  const boreWhite = [0, boreShare[0], boreShare[0] + boreShare[1]];                                   // the three white lines, in turns from the first
  const boreDark = [0, 1, 2].map((i) => boreWhite[i] + boreShare[i] * boreShare[(i + 1) % 3] / (boreShare[(i + 2) % 3] + boreShare[(i + 1) % 3]));   // and the dark line in each swell
  const boreLine = (bo) => {                                   // bo = [weight, cos, sin of the angle round the bore, metres along its axis]
    const t = clamp((bo[3] + S.hd) / (2 * S.hd), 0, 1);
    return 6.2831853 * (boreStart + BORE_WIND * t * t * (3 - 2 * t));
  };
  const bake = { axis: [0.45 + (rng() - 0.5) * 0.2, 0.8, 0.22], y0: -10, y1: 245, swell: H.swell, bore: H.bore, boreC: 0, boreLine };
  const boneMat = okMaterial('bone', { palette: pal, amp: 0.075, boreAmp: 0.4 });
  boneMat.uniforms.uBoreW.value.set(boreWhite[1], boreWhite[2]); boneMat.uniforms.uBoreL.value.set(boreDark[0], boreDark[1], boreDark[2]);

  const cell = 3.0 / Math.sqrt(detail);
  const geo = await buildBoneGeometry(ctx, H.main, [-214, -16, -72, 180, 254, 136], cell, bake);
  const bone = new THREE.Mesh(geo, boneMat); bone.name = 'backBone'; group.add(bone);
  if (ctx.yield) await ctx.yield();
  const tb = tipF.box, tipGeo = await buildBoneGeometry(ctx, tipF.field, [tb[0] - 2, tb[1] - 2, tb[2] - 2, tb[3] + 2, tb[4] + 2, tb[5] + 2], 1.2 / Math.sqrt(detail), { ...bake, curvSmooth: 9, cAdd: tipF.cAdd, lipschitz: 1.9 });
  if (ctx.yield) await ctx.yield();
  {                                                            // match the tip's tone to the wing where the two meshes meet
    const mp = geo.attributes.position.array, mc = geo.attributes.aC.array, near = [];
    for (let i = 0; i < mc.length; i++) { if ((i & 8191) === 8191 && ctx.yield) await ctx.yield(); const x = mp[i * 3]; if (x > 90) { const s = H.cutPlane(x, mp[i * 3 + 1], mp[i * 3 + 2]); if (s > -5 && s < 0.5 && hyp3(x - S.cut.p[0], mp[i * 3 + 1] - S.cut.p[1], mp[i * 3 + 2] - S.cut.p[2]) < 48) near.push(x, mp[i * 3 + 1], mp[i * 3 + 2], mc[i]); } }
    const tp = tipGeo.attributes.position.array, tc = tipGeo.attributes.aC.array;
    for (let i = 0; i < tc.length && near.length; i++) {
      const x = tp[i * 3], y = tp[i * 3 + 1], z = tp[i * 3 + 2], s = H.cutPlane(x, y, z);
      if ((i & 15) === 15 && ctx.yield) await ctx.yield();
      if (s > 9) continue;
      let bd = 1e9, bc = tc[i];
      for (let k = 0; k < near.length; k += 4) { const dx = near[k] - x, dy = near[k + 1] - y, dz = near[k + 2] - z, d2 = dx * dx + dy * dy + dz * dz; if (d2 < bd) { bd = d2; bc = near[k + 3]; } }
      tc[i] = lerp(bc, tc[i], smoothstep(0.5, 9, s));
    }
  }
  const tip = new THREE.Mesh(tipGeo, boneMat); tip.name = 'brokenTip'; group.add(tip);
  if (ctx.yield) await ctx.yield();
  // marks: sutures (dark S-curve hairlines) and nutrient holes
  const R = (a, b) => a + rng() * (b - a), sut = [], sp = S.spPts, ppp = S.ppPts;
  sut.push({ p: [S.crestX, 222, 36], dir: [0.05, -1, 0.2], len: 78, wob: 0.35, wave: 60 });                   // down the crest to the canal's mouth
  sut.push({ p: [S.crestX, 222, -40], dir: [-0.05, -1, -0.2], len: 70, wob: 0.35, wave: 60 });
  for (const zs of [1, -1]) sut.push({ p: [0, S.yb + S.rb, zs * (S.hl - R(9, 13))], dir: [1, 0, 0], len: 6.283 * S.rb * 0.98, wob: 0.16, wave: R(55, 80), step: 3 });   // the drum's growth lines
  for (const [W, sg] of [[sp, 1], [ppp, -1]]) {
    sut.push({ p: [W[1][0], W[1][1] - 26, W[1][2] + 6], dir: [sg * 0.8, 0, 0.6], len: sg > 0 ? 92 : 112, wob: 0.5, wave: R(60, 90) });      // along the wing's underside
    sut.push({ p: [W[1][0] + sg * 10, W[1][1] + 26, W[1][2] - 6], dir: [sg * 0.8, 0.1, 0.55], len: 96, wob: 0.45, wave: R(60, 90) });      // and its back
    sut.push({ p: [sg * 52, 132, 30], dir: [sg * 0.2, -1, 0], len: 62, wob: 0.4, wave: 50 });                  // down the arch's flank to the drum
  }
  sut.push({ p: [8, S.cy - S.rc, 30], dir: [0.25, 0, -1], len: 96, wob: 0.3, wave: 48 });                       // one winding along the bore
  const sutGeo = await sutureRibbons(H.main, sut, rng, ctx.yield ? () => ctx.yield() : null);
  const sutures = new THREE.Mesh(sutGeo, okLineMaterial('#' + mixHex(pal[2], pal[6], 0.5).getHexString())); sutures.name = 'sutures'; sutures.renderOrder = 2; group.add(sutures);
  if (ctx.yield) await ctx.yield();
  const seeds = [], nH = Math.round(84 * detail);
  for (let i = 0; i < nH; i++) {
    const k = i / nH, rr = 0.35 + rng() * rng() * 1.1;
    if (k < 0.45) { const e = R(0.5, 3.9), a = sp[Math.floor(e)], b = sp[Math.floor(e) + 1], f = e % 1; seeds.push({ p: [lerp(a[0], b[0], f) + R(-6, 6), lerp(a[1], b[1], f) - R(8, 22), lerp(a[2], b[2], f) + R(-24, 24)], r: rr, thin: 1 }); }
    else if (k < 0.62) { const e = R(0.8, 4.8), a = ppp[Math.floor(e)], b = ppp[Math.floor(e) + 1], f = e % 1; seeds.push({ p: [lerp(a[0], b[0], f) + R(-6, 6), lerp(a[1], b[1], f) - R(8, 22), lerp(a[2], b[2], f) + R(-24, 24)], r: rr, thin: 1 }); }
    else if (k < 0.82) { const a = R(0, 6.283), r2 = R(S.rc + 8, S.rc + 30); seeds.push({ p: [Math.cos(a) * r2, S.cy + Math.sin(a) * r2 + 8, 44], r: rr * 0.8, thin: 0 }); }
    else { const a = R(-0.9, 0.9) + (rng() < 0.5 ? 0 : Math.PI); seeds.push({ p: [Math.cos(a) * 70, S.yb + Math.sin(a) * 60, R(-20, 30)], r: rr, thin: 0 }); }
  }
  const holes = new THREE.Mesh(await holeDecals(H.main, seeds, rng, ctx.yield ? () => ctx.yield() : null), okHoleMaterial(pal)); holes.name = 'nutrientHoles'; holes.renderOrder = 3; group.add(holes);
  if (ctx.yield) await ctx.yield();

  let prog = 0;
  const A = (x, y, z) => new THREE.Vector3(x, y, z);
  const axis = A(0, S.ay, S.az), cc = A(0, S.cy, 0);
  const anchors = {
    canalAxis: axis.clone(), canalRadius: S.rc,
    canalIn: cc.clone().addScaledVector(axis, -S.hd), canalOut: cc.clone().addScaledVector(axis, S.hd),
    crest: A(S.crestX, 196 + S.crestH * 1.25, S.crestLean),
    wingTip: A(tipF.end[0], tipF.end[1], tipF.end[2]), wingTipAcross: A(tipF.u[0], tipF.u[1], tipF.u[2]),   // the break's centre, and the unit direction its 62 m of open cells run along
    gapStarboard: A(84, 122, 22), gapPort: A(-84, 122, 22),
  };
  // a point `clear` metres under the starboard wing's underside at a station (walk down from the blade until the field says so)
  const under = (st, f, clear, dz) => {
    const a = S.spPts[st], b = S.spPts[st + 1], x = lerp(a[0], b[0], f), z = lerp(a[2], b[2], f) + dz; let y = lerp(a[1], b[1], f);
    for (let i = 0; i < 120 && H.main(x, y, z) < clear; i++) y -= 0.5;
    return A(x, y, z);
  };
  anchors.wingUnder = under(3, 0.25, 10.5, 24);                      // the closest pass: bone 10 m overhead, under the blade's front half
  const tipUnder = under(4, 0.3, 15, 22);
  anchors.flyThrough = [
    A(tipUnder.x + 40, tipUnder.y - 62, tipUnder.z + 190), A(tipUnder.x + 22, tipUnder.y - 22, tipUnder.z + 90),
    tipUnder, under(4, 0.02, 13, 23), under(3, 0.72, 12, 24), under(3, 0.48, 11.5, 24), anchors.wingUnder, under(2, 0.7, 12, 34), A(70, anchors.wingUnder.y - 12, 92), A(30, 127, 100), A(4, 126, 76),
    anchors.canalIn.clone(), cc.clone(), anchors.canalOut.clone(), cc.clone().addScaledVector(axis, 95),
  ];
  // The starboard blade's underside as a line: points on the bone's surface under the blade's centre line, about 3 m
  // apart, from the snapped tip inward to the root, each with the surface's outward normal there and the centre line's
  // heading toward the body (for a route that runs along the underside, and for a gaze along it).
  anchors.bladeUnder = [];
  {
    const T = S.wingS, P = T.P, fa = (x, y, z) => Math.min(H.main(x, y, z), tipF.field(x, y, z)), SUB = 3;
    let sgn = 0;
    for (let i = T.n - 2; i >= 0; i--) for (let k = SUB; k >= 1; k--) {
      const f = k / SUB, o = i * 11, q = o + 11, m = (e) => lerp(P[o + e], P[q + e], f);
      const cx = m(0), cy = m(1), cz = m(2);
      if (H.cutPlane(cx, cy, cz) > S.cut.len - 2) continue;                    // beyond the break there is no blade
      let tx = m(8), ty = m(9), tz = m(10); const tl = hyp3(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let ux = m(5), uy = m(6), uz = m(7); const ut = ux * tx + uy * ty + uz * tz; ux -= ut * tx; uy -= ut * ty; uz -= ut * tz;
      let bx = ty * uz - tz * uy, by = tz * ux - tx * uz, bz = tx * uy - ty * ux; const bl = hyp3(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl;
      if (sgn === 0) sgn = by < 0 ? 1 : -1;                                   // the face that looks down at the tip, followed inward
      bx *= sgn; by *= sgn; bz *= sgn;
      let s = 0; for (let it = 0; it < 80; it++) { const d = fa(cx + bx * s, cy + by * s, cz + bz * s); if (d > -0.02) break; s += Math.max(-d, 0.2); }
      const px = cx + bx * s, py = cy + by * s, pz = cz + bz * s, e = 0.5;
      const n = A(fa(px + e, py, pz) - fa(px - e, py, pz), fa(px, py + e, pz) - fa(px, py - e, pz), fa(px, py, pz + e) - fa(px, py, pz - e));
      if (n.lengthSq() < 1e-8) n.set(bx, by, bz);
      anchors.bladeUnder.push({ p: A(px, py, pz), n: n.normalize(), t: A(-tx, -ty, -tz) });
    }
  }
  anchors.viewpoints = { foot: A(0, 18, 340), front: A(0, 140, 310), exit: cc.clone().addScaledVector(axis, 120) };
  anchors.portalSeat = { position: anchors.canalOut.clone(), facing: axis.clone().negate() };
  return {
    object: group, radius: 175, height: 250, center: A(0, 135, 10), anchors, ground: true, groundY: 0,
    field: H.main,                 // field(x, y, z): metres to the bone's surface in local space (negative inside), for clearances
    fieldAll: (x, y, z) => Math.min(H.main(x, y, z), tipF.field(x, y, z)),   // the same, with the snapped tip's own mesh included
    swell: H.swell,                // swell(x, y, z): the coordinate along the swell that the bake wrote to aW.x (local space)
    setProgress(u) { prog = u; },
    update(dt, time) { if (drive) setOkPhase(prog, time); },
    dispose() {},
  };
}
