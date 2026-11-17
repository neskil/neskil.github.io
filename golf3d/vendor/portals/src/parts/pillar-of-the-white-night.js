// The pillar of the white night: hero set piece of "pillar-of-the-white-night" (after Edvard Munch, 1863 to 1944).
//
// WHAT IT IS. The moon's reflection standing on the water as a solid gold pillar with a round head, 300 m tall:
// 46 level strokes of #E9C85A (70 thinner ones when the seed says "a breath of wind"), 44 m wide, 5 to 9 m tall,
// stacked 250 m high in three sheets 6 m apart; a head of 11 strokes clipped to a disc 54 m across (centre y 273)
// with one madder echo arc outside it, open at the lower left; a slit 16 m high (y 19..35) to fly through;
// about 420 runs of thinned paint hanging from the lower edges; pink underpaint at the stroke ends.
// It is a cylindrical billboard (turned about its own axis in the vertex shader), so it never narrows.
//
// SIZE AND COST. radius 150 (bounding), height 300, origin at the foot, +Y up. About 6,700 triangles
// (9,600 windy), 2 draw calls (strokes + runs), 2 shader programs, no textures, no lights. Build about 15 ms.
//
// opts: palette (7 hex, brief order), detail 0.6..1 (thins the runs only), wind (true/false; default by seed),
//       freeze (metres inside which the facing is held; default 150).
//       billboard (true: one face that turns to the eye at every distance, sheets 0.5 m apart, no slit, strokes of
//       uneven length and tilt, broader runs; the world uses this since its course goes round the pillar, not through).
//
// RETURNS, beside the contract: setProgress(u) journey u 0..1 (the breathing: strokes sliding sideways against
// each other and an undulation climbing the column; without it the viewer's clock is used), setRuns(v|null)
// (script the runs 0..1 yourself; default: by the eye's distance, nothing beyond 640 m, full inside 150 m),
// snapFacing(), materials { stroke, runs }, windy. update(dt, time, camera) also sets STYLE.uTime.
//
// ANCHORS (local space; the brief seats the pillar at world (0, 0, 780) unrotated, course = +Z):
//   slit        { center [0,27,0], height 16, width 44 }: level, the full width, open through all three sheets
//   flyThrough  ordered points of a safe line through the slit (8 m of air above and below at y 27)
//   portalSeat  { position [121,5,20], facing [0.707,0,0.707], radius 7 }: the brief's exit, 123 m from the pillar
//   viewpoints  first / reveal / middle / exit eye positions of the brief;  headCenter, headRadius, footprint
//
// WHAT IT EXPECTS AROUND IT. post { flat: 1, bloom 0, grade neutral }: colours are written as plain linear hex.
// The world's canvas ground and dome behind it (it is transparent where there is no paint). It must NOT be
// lifted (it is not: its material ignores uLift) and should draw after the sea and sky bands (renderOrder 40, 41;
// it writes depth, so solids drawn later are hidden by it). Do not rotate or scale it non-uniformly.
// The facing is held inside 150 m and eases back between 150 and 190 m, so nothing spins at the break-through.
//
// THE STYLE, FOR THE WHOLE WORLD (shade everything with these so the hero is not pasted in):
//   PALETTE, PIGMENT, pigments(palette)   the seven pigments as linear THREE.Color
//   STYLE            shared uniforms: uTime (ambient sway only), uLift (0..1, set from u), uViewH (buffer height
//                    in pixels: set once), uCanvas
//   LIFT_GLSL        vertex chunk: liftWorld(worldPos) = the sea standing up like a wall; pixelSize(w)
//   STYLE_GLSL       fragment chunk: wn_vn noise, wn_weave (the flax weave), wn_stroke (the mark: coverage of one
//                    long streaked stroke, loaded head, dry tail, ragged ends, mean tint under 3 pixels)
//   strokeGeometry(list, yield)  any number of ribbons (sea, sky, strand, contour, echo, laying stroke) merged
//                    into one geometry: centre line, half width, pigment, underpaint, sway wave
//   strokeMaterial(opts)   the one stroke shader; uniforms.uHead (metres laid so far) turns a ribbon into a
//                    LAYING STROKE: nothing ahead of the head, a loaded lobe at it, streaks opening 60 m behind;
//                    opts.minPx 1.5 for contour and echo lines
//   runGeometry(list) / runMaterial(opts)   runs of thinned paint, instanced, length keyed to uniforms.uRun
//   canvasMaterial(opts)   the grey flax ground: weave doubling in rings with distance, slubs, water stains
//   massMaterial(opts)     wood, tongue, boulders, jetty: one flat pigment in downward strokes thinning to bare
//                    canvas where the attribute aEdge is 1 (the top contour)
// ADDED BY THE WORLD BUILDER (all used by src/worlds/pillar-of-the-white-night.js):
//   solidMaterial(opts)   wood, tongue, hills and boulders as merged meshes with per-vertex pigment (see its comment)
//   wn_weaveR             the weave with its pitch doubled in rings, so threads are 5 to 10 pixels at any distance
//   stroke uniforms       uReach (rare event: no paint beyond this distance), uStagger (each stroke's head delayed
//                         by its own amount: the rare sky being laid band by band)
//   run uniform           uGrow (near, far): runs lengthen as the eye comes up to them
//   wn_weaveA, wn_skew    the weave with warp and weft each doubling by its own screen rate (no long blocks at a slant)
//   stroke uniform uUnit  metres per mesh unit (3 for the wide sea bands); seen close every stroke streaks and shows weave
//   solid uniform uEdgeAmt  0..1 scales aEdge (the world takes the thinned contour away while a mass is seen from above)
//   (gold pass) strokeMaterial opts.rag: the tail's raggedness as a GLSL float string (default 0.16; the billboard pillar '0.05',
//                         so its strokes end nearly in line); solid attribute aShade NEGATIVE = the lit stroke, laid in uniform uLit (the gold);
//                         billboard hero: stroke ends in line, a madder echo line up each side of the shaft
//   (lane pass) strokeMaterial opts.lane (the reflection lane: strokes spaced and drawn in toward the eye in the vertex shader,
//   uniform uLane) and solidMaterial opts.streak (goes of the ultramarine down a dark mass); the weave shows a third as much
//   through the green-black.
//   (slim pass) buildHero opts.shaftW, opts.headR (local metres; the head sits on the shaft) and opts.gaps (true: about 32 level
//                         strokes that miss each other, a dry gap between one and the next, ragged ends out of line, longer runs);
//                         wn_stroke scrubs the outer third of every stroke's width
// The set-piece viewer's own preview scenery was removed (it read the page address, which a world may not do).
import * as THREE from 'three';

// ---------------------------------------------------------------------------------------------------------------
// PIGMENTS. The world runs with post.flat = 1, so a hex written is the hex shown: NO inverse tone map anywhere.
// ---------------------------------------------------------------------------------------------------------------
export const PALETTE = ['#6C7CB8', '#BCC0DE', '#E9C85A', '#1F3A33', '#C97B6A', '#D5D0C2', '#7A3B4A'];
// names in palette order: deep sea / hills / shade, pale sky and sea, the gold (pillar only), wood (darkest),
// pink (strand, boulders, underpaint), bare canvas (never laid as paint), madder (contour and echo lines only)
export const PIGMENT = { ultra: 0, pale: 1, gold: 2, wood: 3, pink: 4, canvas: 5, madder: 6 };
export function pigments(palette = PALETTE) {
  const c = (i) => new THREE.Color(palette[i] || PALETTE[i]);   // THREE.Color converts sRGB hex to linear
  return { ultra: c(0), pale: c(1), gold: c(2), wood: c(3), pink: c(4), canvas: c(5), madder: c(6) };
}

// ---------------------------------------------------------------------------------------------------------------
// SHARED UNIFORMS: one object for every material of the world (pass the same object: do not copy it).
//   uTime   the clock: ONLY the ambient sway of bands and the drift of echo lines read it
//   uLift   0..1, the amount of "sea stands up like a wall" (world sets it from u; the pillar ignores it)
//   uViewH  height of the drawing buffer in pixels (for the 1.5 pixel floor of thin marks); set it once
//   uCanvas the bare canvas colour, used wherever paint thins to weave
// ---------------------------------------------------------------------------------------------------------------
export const STYLE = {
  uTime: { value: 0 }, uLift: { value: 0 }, uViewH: { value: 800 },
  uCanvas: { value: new THREE.Color(PALETTE[5]) },
};

// The lift, shared by every vertex shader in the world except the pillar's (space rule of the brief).
export const LIFT_GLSL = /* glsl */`
uniform float uLift;
vec3 liftWorld(vec3 wp){
  float d = length(wp.xz - cameraPosition.xz);
  wp.y += d * tan(0.262 * smoothstep(60., 600., d)) * uLift;
  return wp;
}
// size of one pixel in metres at a clip-space w (perspective camera)
uniform float uViewH;
float pixelSize(float w){ return 2.0 * max(w, 0.05) / (max(projectionMatrix[1][1], 1e-3) * max(uViewH, 1.)); }
`;

// Noise, weave and the stroke. All in metres. No textures, no loops, derivatives taken once at the top.
export const STYLE_GLSL = /* glsl */`
#ifndef WN_RAG
#define WN_RAG 0.16
#endif
float wn_h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float wn_vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(wn_h21(i), wn_h21(i + vec2(1., 0.)), f.x), mix(wn_h21(i + vec2(0., 1.)), wn_h21(i + vec2(1., 1.)), f.x), f.y); }
// plain weave of coarse flax: returns how deep a point lies between threads (0 on a thread crown, 1 in a valley).
// q in metres, pitch in metres, px = metres per pixel; flat mean (0.42) once a thread is under 3 pixels.
float wn_weave(vec2 q, float pitch, float px){
  float slub = wn_vn(vec2(floor(q.y / pitch) * 0.37, q.x * 0.11)) ;          // a thick thread now and then
  vec2 u = q / pitch + vec2(0., 0.18 * (slub - 0.5));
  u.x += 0.34 * (wn_h21(vec2(floor(u.y), 3.)) - 0.5); u.y += 0.34 * (wn_h21(vec2(floor(u.x), 7.)) - 0.5);   // no two threads alike
  vec2 c = abs(fract(u) - 0.5) * 2.;
  float par = mod(floor(u.x) + floor(u.y), 2.);
  float crown = mix((1. - c.x) * (0.55 + 0.45 * (1. - c.y)), (1. - c.y) * (0.55 + 0.45 * (1. - c.x)), par);
  float valley = 1. - smoothstep(0.12, 0.6, crown + 0.25 * (slub - 0.5));
  float keep = 1. - smoothstep(pitch / 6., pitch / 3., px);
  return mix(0.42, valley, keep);
}
// the same weave with its pitch doubled in rings as it shrinks on screen, so a thread is always 5 to 10 pixels:
// the canvas is seen in thin paint at any distance and never shimmers. base = finest pitch in metres.
#define WN_PITCH 0.09
float wn_weaveR(vec2 q, float px, float base){
  float lod = log2(max(px * 5.5 / base, 1.)), l0 = floor(lod), f = lod - l0;
  float p0 = base * exp2(l0);
  return mix(wn_weave(q, p0, 0.), wn_weave(q, p0 * 2., 0.), smoothstep(0.35, 1., f));
}
// The weave seen at a slant. Warp and weft each double their pitch in rings by their OWN screen rate, so a thread
// stays a few pixels both ways however flat the cloth lies to the eye (no long blocks under a grazing view).
// q in metres, pq = screen rate of q.x and of q.y (metres per pixel). Returns 0 on a crown .. 1 in a valley.
float wn_weave2(vec2 q, vec2 pitch){
  float slub = wn_vn(vec2(floor(q.y / pitch.y) * 0.37, q.x * 0.11 / (pitch.x / WN_PITCH)));
  vec2 u = q / pitch + vec2(0., 0.18 * (slub - 0.5));
  u.x += 0.34 * (wn_h21(vec2(floor(u.y), 3.)) - 0.5); u.y += 0.34 * (wn_h21(vec2(floor(u.x), 7.)) - 0.5);
  vec2 c = abs(fract(u) - 0.5) * 2.;
  float par = mod(floor(u.x) + floor(u.y), 2.);
  float crown = mix((1. - c.x) * (0.55 + 0.45 * (1. - c.y)), (1. - c.y) * (0.55 + 0.45 * (1. - c.x)), par);
  return 1. - smoothstep(0.12, 0.6, crown + 0.25 * (slub - 0.5));
}
float wn_weaveA(vec2 q, vec2 pq, float base){
  vec2 lod = log2(max(pq * 3.6 / base, vec2(1.))), l0 = floor(lod), f = smoothstep(0.35, 1., lod - l0);
  vec2 p0 = base * exp2(l0);
  float a = wn_weave2(q, p0), b = a, c = a, d = a;
  if (f.x > 0.001) b = wn_weave2(q, vec2(p0.x * 2., p0.y));
  if (f.y > 0.001) { c = wn_weave2(q, vec2(p0.x, p0.y * 2.)); d = c; if (f.x > 0.001) d = wn_weave2(q, p0 * 2.); }
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
// what is left of the slant once each axis has its own pitch (1 = none): fade the weave to its mean above about 3
float wn_skew(vec2 qx, vec2 qy){
  float px = length(qx), py = length(qy), area = abs(qx.x * qy.y - qx.y * qy.x);
  return px * py / max(area, 1e-9);
}
// Bristle lanes that the eye can always resolve (polish pass): along = metres along the stroke, across = metres across
// it, px = metres per pixel across, stretch = how many times longer than wide a lane is. Returns 0..1 noise whose
// lanes are 7 to 14 pixels across at any distance (their width doubles in rings, cross-faded, like the weave).
float wn_lanes(float along, float across, float px, float stretch, float seed){
  float lod = log2(max(px * 7. / 0.02, 1.)), l0 = floor(lod), f = smoothstep(0.2, 1., lod - l0), w0 = 0.02 * exp2(l0);
  float a = wn_vn(vec2(along / (w0 * stretch) + seed * 3.1 + l0 * 5.1, across / w0 + seed * 17.3));
  float b = wn_vn(vec2(along / (w0 * stretch * 2.) + seed * 3.1 + (l0 + 1.) * 5.1, across / (w0 * 2.) + seed * 17.3));
  return mix(a, b, f);
}
// The mark: one long stroke of thinned paint. s = metres along from the loaded head, y = metres across (0 on the
// centre line), L = length, hh = half width, seed = per stroke, px = metres per pixel across, dry0 = extra dryness.
// Returns coverage 0..1 of paint: dense at the head, streaked and dry toward the tail, ragged at both ends,
// bristly along both edges. Streak lanes under 3 pixels fade to their mean, so nothing shimmers.
float wn_stroke(float s, float y, float L, float hh, float seed, float px, float dry0, out float thin){
  float t = clamp(s / max(L, 1e-3), 0., 1.);
  float v = abs(y) / max(hh, 1e-3);
  float f0 = 1. - smoothstep(0.45, 1.3, px), f1 = 1. - smoothstep(0.16, 0.5, px), f2 = 1. - smoothstep(0.03, 0.09, px), f3 = 1. - smoothstep(0.007, 0.02, px);
  float n0 = wn_vn(vec2(s * 0.022 + seed * 23.1, y * 0.36 + seed * 41.3));          // lanes 3 m across: the brush's own unevenness
  float n1 = wn_vn(vec2(s * 0.040 + seed * 17.3, y * 0.95 + seed * 31.7));          // 1 m: clumps of bristles
  float n2 = wn_vn(vec2(s * 0.150 + seed * 7.1, y * 5.5 + seed * 13.9));            // 0.18 m: bristle streaks
  float n3 = wn_vn(vec2(s * 0.450 + seed * 3.3, y * 21. + seed * 5.7));             // 0.05 m: single hairs
  n2 = smoothstep(0.2, 0.8, n2); n3 = smoothstep(0.25, 0.75, n3);
  float b = 0.27 * mix(0.5, n0, f0) + 0.27 * mix(0.5, n1, f1) + 0.28 * mix(0.5, n2, f2) + 0.18 * mix(0.5, n3, f3);
  float dry = clamp(smoothstep(0.08, 1.0, t) + dry0, -0.6, 1.25);
  float e = smoothstep(0.66, 1.15, v);      // (slim pass) scrubbed at the edges: the bristles give out over the outer third
  float rag = min(2., 0.2 * L) + WN_RAG * L * (0.6 * wn_vn(vec2(y * 0.6 + seed * 9., seed * 3.)) + 0.4 * wn_vn(vec2(y * 3.3 + seed * 5., seed * 8.)));   // tail: bristles lift off unevenly
  float tail = smoothstep(L - rag, L, s);
  float lobe = (0.4 + 2.4 * wn_vn(vec2(y * 0.8 + seed * 5., seed)) + 1.1 * wn_vn(vec2(y * 4.1 + seed * 2., seed * 6.))) * min(1., L / 20.);   // head: a loaded, blunt, uneven start
  float head = 1. - smoothstep(0., lobe, s - 2.2 * v * v * min(1., L / 20.));
  float skip = 0.16 * (wn_vn(vec2(s * 0.055 + seed * 29., seed * 13.)) - 0.5);        // the brush skips where the hand lifts
  float th = mix(0.2, 0.57, dry) + skip + 1.3 * e * e + 0.9 * tail + 1.6 * head;
  float d = b - th;
  float aa = clamp(fwidth(d) * 0.8, 0.012, 0.09) + 0.04 * (1. - f1) + 0.04 * (1. - f0);
  thin = 1. - smoothstep(0., 0.22, d);                                                  // where the film is thinnest
  return smoothstep(-aa, aa, d) * step(s, L) * step(0., s);
}
`;

// ---------------------------------------------------------------------------------------------------------------
// ONE STROKE SHADER for every ribbon of the world (sea and sky bands, strand, contours, echoes, laying strokes,
// the pillar). Geometry comes from strokeGeometry() below.
// ---------------------------------------------------------------------------------------------------------------
export const STROKE_VERT = /* glsl */`
attribute vec2 aUV;      // s (metres from the loaded head), y (metres across)
attribute vec4 aDim;     // painted length L, half width hh, seed, amount of underpaint 0..1
attribute vec3 aCol;     // pigment (linear)
attribute vec3 aUnder;   // underpaint pigment (linear)
attribute vec3 aSide;    // unit vector across the stroke
attribute vec4 aWave;    // sway: amplitude m, wavelength m, phase, speed rad/s
attribute vec4 aExt;     // x: clip radius (pillar head, 0 = none), y: extra dryness, z: slide weight, w: slide phase
uniform float uTime; uniform float uMinPx;
uniform vec2 uFace; uniform float uBreath; uniform float uSwell; uniform vec2 uLane;
varying vec2 vUV; varying vec4 vDim; varying vec3 vCol; varying vec3 vUnder; varying vec4 vExt; varying float vFade; varying vec2 vPlane; varying float vDist;
${LIFT_GLSL}
void main(){
  vec3 p = position; vec3 sd = aSide;
  // the medium moves: every band sways along its length like weed in a slow current
  p += aSide * aWave.x * sin(6.2832 * aUV.x / max(aWave.y, 1.) - uTime * aWave.w + aWave.z);
#ifdef WN_PILLAR
  // breathing (keyed to u by the world): strokes slide sideways against each other, the column swells by 3 m
  p.x = p.x * (1. + uSwell * sin(6.2832 * uBreath * 0.5 + aExt.w * 0.3)) + aExt.z * sin(6.2832 * uBreath + aExt.w);
  vPlane = p.xy;
  // cylindrical billboard about the pillar's own axis: it never narrows and never shows an edge
  p = vec3(p.x * uFace.x + p.z * uFace.y, p.y, -p.x * uFace.y + p.z * uFace.x);
  sd = vec3(sd.x * uFace.x + sd.z * uFace.y, sd.y, -sd.x * uFace.y + sd.z * uFace.x);
  vec4 wp = modelMatrix * vec4(p, 1.);
#else
  vPlane = aUV;
#ifdef WN_LANE
  // the reflection lying down the water (lane pass). Its strokes are built all one size, a fixed pitch apart along local
  // z; here each is set a fixed RATIO nearer the eye than the last and drawn in by as much, so in the picture they are
  // evenly spaced level strokes of the column's own width from its foot to the bottom edge. Mesh z runs 0 (the foot) to
  // uLane.y (the eye); the world scales it to the eye's distance.
  { float q = 0.975 * exp(-uLane.x * max(p.z, 0.)); p.x *= q; p.z = (1. - q) * uLane.y; }
#endif
  vec4 wp = modelMatrix * vec4(p, 1.);
  wp.xyz = liftWorld(wp.xyz);
#endif
  vDist = length(wp.xz - cameraPosition.xz);
  vec4 cp = projectionMatrix * viewMatrix * wp;
  // thin marks never go under uMinPx pixels: widen across, and thin the film by the same ratio
  float px = pixelSize(cp.w);
  float hh = max(aDim.y, 1e-3);
  float want = max(hh, 0.5 * uMinPx * px);
  vFade = hh / want;
  if (want > hh) {
    vec3 sideW = normalize(mat3(modelMatrix) * sd + vec3(0., 1e-5, 0.));
    wp.xyz += sideW * (aUV.y / hh) * (want - hh);
    cp = projectionMatrix * viewMatrix * wp;
  }
  vUV = aUV; vDim = aDim; vCol = aCol; vUnder = aUnder; vExt = aExt;
  gl_Position = cp;
}`;

export const STROKE_FRAG = /* glsl */`
uniform vec3 uCanvas; uniform float uLanes; uniform float uHead; uniform float uWeave; uniform float uUnit; uniform vec2 uDisc; uniform float uOpacity; uniform float uReach; uniform float uStagger; uniform float uNear;
varying vec2 vUV; varying vec4 vDim; varying vec3 vCol; varying vec3 vUnder; varying vec4 vExt; varying float vFade; varying vec2 vPlane; varying float vDist;
${STYLE_GLSL}
void main(){
  float pxy = length(vec2(dFdx(vUV.y), dFdy(vUV.y)));
  float pxs = length(vec2(dFdx(vUV.x), dFdy(vUV.x)));
  float px = max(pxy, 0.06 * pxs) * vFade;
  float L = vDim.x, hh = vDim.y, seed = vDim.z;
  float s = vUV.x;
  // the hand: the centre line wanders and the width swells and pinches
  float y = vUV.y + hh * 0.34 * (wn_vn(vec2(s * 0.023 + seed * 11.1, seed * 7.3)) - 0.5)
                  + hh * 0.10 * (wn_vn(vec2(s * 0.11 + seed * 2.9, seed * 1.7)) - 0.5);
  float hw = hh * (0.88 + 0.24 * wn_vn(vec2(s * 0.017 + seed * 4.1, seed * 9.9)));
  // a stroke being laid: nothing ahead of the head, a loaded lobe at it, bristle streaks opening for 60 m behind
  float behind = uHead - s - uStagger * wn_h21(vec2(seed * 57.3, 9.7));
  // seen close (a pixel under 3 cm) every stroke is thin paint: streaks open and the weave comes through even where
  // the brush was loaded; thin lines (rail, posts, echoes) keep their body
  float nearK = (1. - smoothstep(0.006, 0.06, px * uUnit)) * smoothstep(0.1, 0.7, hh * uUnit) * uNear;
  // the loaded lobe breaks into bristle streaks within a few metres, and goes on drying for 60 m
  float dry0 = vExt.y + mix(-0.75, -0.16, smoothstep(0.4, 6., behind)) + 0.16 * smoothstep(6., 60., behind) + 0.42 * nearK;
  float vv = clamp(abs(y) / max(hw, 1e-3), 0., 1.);
  float front = behind - hw * 1.2 * (1. - sqrt(max(1. - vv * vv, 0.)));
  // the leading edge is the bristles' own: notched, a few hairs ahead of the rest
  front -= hh * (0.30 * wn_vn(vec2(y * 7. / max(hh, 0.05) + seed * 7., seed * 3.)) + 0.14 * wn_vn(vec2(y * 23. / max(hh, 0.05) + seed * 5., seed * 11.)));
  float laid = smoothstep(0., max(px * 1.5, 0.02), front);
  float lip = 1. - smoothstep(0., 0.5 * hh + 0.05, front);                      // the film is thin at the lip: weave shows
  hw *= 1. + 0.3 * (1. - smoothstep(0., 2.5 * hh, behind));
  float thin, thinU;
  float cov = wn_stroke(s, y, L, hw, seed, px, dry0, thin);
  // thin paint streaks at every distance: wherever the stroke is broad on screen, dry lanes of canvas run along it
  { float lane = wn_lanes(s, y, px, 46., seed);
    float gap = (1. - smoothstep(0.2, 0.33, lane)) * smoothstep(8., 20., hh / max(px, 1e-5));
    cov *= 1. - 0.82 * gap * uLanes; thin = max(thin, gap * uLanes); }
  float covU = wn_stroke(s + 3., y + 0.22 * hh, L + 6.5, hw * 1.06, seed + 4.7, px, 0.62, thinU) * vDim.w;
  float ends = max(1. - smoothstep(0., 0.10 * L, s), smoothstep(0.78 * L, L, s));
  covU *= mix(0.22, 1., ends);
  // thin paint sits on the crowns of the weave and misses the valleys
  // the weave under the paint: its pitch follows the larger of the two screen rates; where the stroke is seen so
  // nearly end-on that a thread would be a long block, the paint takes the weave's mean instead
  vec2 gx = vec2(dFdx(vPlane.x), dFdy(vPlane.x)), gy = vec2(dFdx(vPlane.y), dFdy(vPlane.y));
  float valley = mix(wn_weaveA(vPlane, vec2(length(gx), length(gy)) * vFade, WN_PITCH / max(uUnit, 0.01)), 0.42, smoothstep(2.5, 6., wn_skew(gx, gy)));
  cov *= 1. - uWeave * valley * clamp(thin * 0.62 + 0.03 + 0.3 * nearK + 0.5 * lip * step(uHead, 1e8), 0., 1.);   // loaded paint is the pigment exactly; weave shows in it close to
  covU *= 1. - uWeave * valley * 0.6;
  float a = cov + covU * (1. - cov);
  vec3 col = (vCol * cov + vUnder * covU * (1. - cov)) / max(a, 1e-4);
  a *= laid * vFade * uOpacity;
  // the unfinished canvas (rare): no paint yet beyond uReach metres from the eye; each stroke gives out at its own distance
  { float rr = uReach * (0.72 + 0.56 * wn_h21(vec2(seed * 91.7, 3.1)));
    a *= 1. - smoothstep(rr, rr + 6. + 0.12 * rr, vDist + 22. * (wn_vn(vec2(s * 0.05 + seed * 7., y * 0.4)) - 0.5)); }
#ifdef WN_PILLAR
  if (vExt.x > 0.) {            // the head: strokes clipped to a disc with a hand-cut edge
    vec2 r = vPlane - uDisc;
    float rr = length(r) + 1.5 * (wn_vn(r * 0.16 + 3.) - 0.5) + 0.5 * (wn_vn(r * 0.7) - 0.5);
    a *= 1. - smoothstep(vExt.x - max(px, 0.05), vExt.x + max(px, 0.05), rr);
  }
#endif
  if (a < 0.02) discard;
  gl_FragColor = vec4(col, a);
}`;

// strokeMaterial(opts): the one material for ribbons made by strokeGeometry().
//   opts.pillar  true only for the hero (billboard + breathing, no lift)
//   opts.weave   0..1 how much the canvas weave eats thin paint (default 1)
//   opts.minPx   pixel floor of the stroke's width (default 0 = off; 1.5 for contour and echo ribbons)
//   opts.near    0..1 how much the paint thins when seen close (default 1; the world's sea bands 0.12)
//   opts.lane    true only for the world's reflection lane (uniform uLane: x = ln of the spacing ratio per metre of mesh z, y = mesh z at the eye)
//   opts.unit    metres per unit of the mesh (default 1; 3 for the wide sea bands, which are built small and scaled up)
//   opts.depthWrite / opts.depthTest / opts.renderOrder as needed (bands: depthWrite false)
// Uniforms to drive: uHead.value (metres laid so far; 1e9 = finished stroke), uOpacity.
export function strokeMaterial(opts = {}) {
  const m = new THREE.ShaderMaterial({
    vertexShader: STROKE_VERT, fragmentShader: STROKE_FRAG,
    defines: opts.pillar ? (opts.rag ? { WN_PILLAR: 1, WN_RAG: opts.rag } : { WN_PILLAR: 1 }) : opts.lane ? { WN_LANE: 1 } : {},
    uniforms: {
      uTime: STYLE.uTime, uLift: STYLE.uLift, uViewH: STYLE.uViewH, uCanvas: STYLE.uCanvas,
      uLanes: { value: opts.lanes ?? (opts.pillar ? 0.55 : 1) }, uMinPx: { value: opts.minPx ?? 0 }, uUnit: { value: opts.unit ?? 1 }, uHead: { value: 1e9 }, uNear: { value: opts.near ?? 1 }, uReach: { value: 1e9 }, uStagger: { value: 0 }, uWeave: { value: opts.weave ?? 1 },
      uOpacity: { value: 1 }, uFace: { value: new THREE.Vector2(1, 0) }, uBreath: { value: 0 },
      uSwell: { value: 0 }, uDisc: { value: new THREE.Vector2(0, 0) }, uLane: { value: new THREE.Vector2(0.0104, 100) },
    },
    transparent: true, depthWrite: opts.depthWrite ?? false, depthTest: opts.depthTest ?? true,
    side: THREE.DoubleSide, forceSinglePass: true,      // one pass: strokes keep the order they were laid in
  });
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// strokeGeometry(list, yieldFn?): merges any number of strokes into ONE BufferGeometry for strokeMaterial().
// Each item: {
//   pts:    [[x,y,z], ...] centre line, at least 2 points, in laying order (the loaded head first). The first and
//           last `margin` metres of it are run-in and run-out (ragged ends, underpaint), not painted length.
//   half:   half width in metres (number)                     side: [x,y,z] unit vector across the stroke
//                                                              (default: level, perpendicular to the line)
//   color:  THREE.Color   under: THREE.Color   underAmt: 0..1 (how much underpaint peeps out; default 0)
//   seed:   0..1          dry: extra dryness -0.5..0.6 (default 0)      margin: metres (default 4)
//   wave:   [amplitude m, wavelength m, phase, speed rad/s]   (the sway; default none)
//   ext:    [clipRadius, slide, slidePhase] (pillar only)
// }
// Await it with ctx.yield as yieldFn for long lists: it yields every 16 strokes and draws no random numbers.
// ---------------------------------------------------------------------------------------------------------------
export async function strokeGeometry(list, yieldFn) {
  let nv = 0, ni = 0;
  for (const st of list) { nv += st.pts.length * 2; ni += (st.pts.length - 1) * 6; }
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), dim = new Float32Array(nv * 4);
  const col = new Float32Array(nv * 3), und = new Float32Array(nv * 3), sid = new Float32Array(nv * 3);
  const wav = new Float32Array(nv * 4), ext = new Float32Array(nv * 4);
  if (yieldFn) await yieldFn();
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let v = 0, k = 0, count = 0;
  if (yieldFn) await yieldFn();
  for (const st of list) {
    const P = st.pts, n = P.length, margin = st.margin ?? 4, half = st.half, wide = half * 1.5;
    let total = 0; const arc = [0];
    for (let i = 1; i < n; i++) { total += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]); arc.push(total); }
    const L = Math.max(total - 2 * margin, 1);
    const c = st.color, u = st.under || st.color, w = st.wave || [0, 100, 0, 0], e = st.ext || [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, n - 1)];
      let sx, sy, sz;
      const sd = typeof st.side === 'function' ? st.side(i) : st.side;
      if (sd) { sx = sd[0]; sy = sd[1]; sz = sd[2]; }
      else { const tx = b[0] - a[0], tz = b[2] - a[2], tl = Math.hypot(tx, tz) || 1; sx = -tz / tl; sy = 0; sz = tx / tl; }
      for (let j = 0; j < 2; j++) {
        const sg = j ? 1 : -1;
        pos[v * 3] = P[i][0] + sx * wide * sg; pos[v * 3 + 1] = P[i][1] + sy * wide * sg; pos[v * 3 + 2] = P[i][2] + sz * wide * sg;
        uv[v * 2] = arc[i] - margin; uv[v * 2 + 1] = wide * sg;
        dim[v * 4] = L; dim[v * 4 + 1] = half; dim[v * 4 + 2] = st.seed ?? 0.5; dim[v * 4 + 3] = st.underAmt ?? 0;
        col[v * 3] = c.r; col[v * 3 + 1] = c.g; col[v * 3 + 2] = c.b;
        und[v * 3] = u.r; und[v * 3 + 1] = u.g; und[v * 3 + 2] = u.b;
        sid[v * 3] = sx; sid[v * 3 + 1] = sy; sid[v * 3 + 2] = sz;
        wav[v * 4] = w[0]; wav[v * 4 + 1] = w[1]; wav[v * 4 + 2] = w[2]; wav[v * 4 + 3] = w[3];
        ext[v * 4] = e[0]; ext[v * 4 + 1] = st.dry ?? 0; ext[v * 4 + 2] = e[1]; ext[v * 4 + 3] = e[2];
        v++;
      }
      if (i < n - 1) { const o = v - 2; idx[k++] = o; idx[k++] = o + 1; idx[k++] = o + 2; idx[k++] = o + 1; idx[k++] = o + 3; idx[k++] = o + 2; }
    }
    if (yieldFn && (++count % 6) === 0) await yieldFn();
  }
  if (yieldFn) await yieldFn();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aDim', new THREE.BufferAttribute(dim, 4));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aUnder', new THREE.BufferAttribute(und, 3));
  g.setAttribute('aSide', new THREE.BufferAttribute(sid, 3));
  g.setAttribute('aWave', new THREE.BufferAttribute(wav, 4));
  g.setAttribute('aExt', new THREE.BufferAttribute(ext, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// canvasMaterial(opts): the ground of the picture, grey flax linen (#D5D0C2), woven, slubbed, water-stained.
// For the lifted ground plane (default: weave laid on world xz) and the dome (opts.dome: weave laid on the
// direction from the camera, give the mesh a position that follows the camera). Thread pitch 0.35 m near and
// doubling in rings with distance, so threads are always 3 to 6 pixels and never shimmer.
//   opts.lift (default true: ground), opts.dome (default false), opts.side
// ---------------------------------------------------------------------------------------------------------------
export function canvasMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    defines: opts.dome ? { WN_DOME: 1 } : {},
    uniforms: { uLift: opts.lift === false || opts.dome ? { value: 0 } : STYLE.uLift, uViewH: STYLE.uViewH, uCanvas: STYLE.uCanvas },
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec3 vD;
      ${LIFT_GLSL}
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vD = position; wp.xyz = liftWorld(wp.xyz); vW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCanvas; varying vec3 vW; varying vec3 vD;
      ${STYLE_GLSL}
      void main(){
      #ifdef WN_DOME
        vec3 d = normalize(vD + vec3(1e-4, 0., 1e-4));
        vec2 q = vec2(atan(d.x, d.z + 1e-5) * 600., d.y * 700.);
      #else
        vec2 q = vW.xz;
      #endif
        vec2 gx = vec2(dFdx(q.x), dFdy(q.x)), gy = vec2(dFdx(q.y), dFdy(q.y));
        float v = mix(wn_weaveA(q, vec2(length(gx), length(gy)), WN_PITCH), 0.42, smoothstep(2.5, 6., wn_skew(gx, gy)));
        vec2 qs = q + 60. * vec2(wn_vn(q * 0.013 + 3.), wn_vn(q * 0.013 + 11.)) + 9. * vec2(wn_vn(q * 0.09), wn_vn(q * 0.09 + 5.));
        float stain = wn_vn(qs * 0.009 + 7.) * 0.7 + wn_vn(vec2(qs.x + qs.y, qs.y - qs.x) * 0.021) * 0.3;
        float tide = smoothstep(0.585, 0.605, stain) * (1. - smoothstep(0.605, 0.70, stain));   // the dried edge of a water stain
        float tone = 1.03 - 0.06 * v - 0.014 * tide - 0.03 * smoothstep(0.42, 0.72, stain) - 0.012 * (wn_vn(q * vec2(0.5, 0.07)) - 0.5);
        gl_FragColor = vec4(uCanvas * tone, 1.);
      }`,
    side: opts.side ?? (opts.dome ? THREE.BackSide : THREE.FrontSide), depthWrite: !opts.dome,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// massMaterial(opts): solids with depth (wood, tongue, boulders, jetty planks): one flat pigment, laid in long
// DOWNWARD strokes that thin to bare canvas toward the top edge. Geometry gives attribute aEdge (float, 1 at the
// upper contour of the mass falling to 0 some 10 to 15 m below it; 0 everywhere = solid). Lifted like the rest.
//   opts.color THREE.Color (default wood), opts.thin 0..1 how much canvas opens at the top (default 0.75)
// ---------------------------------------------------------------------------------------------------------------
export function massMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uLift: STYLE.uLift, uViewH: STYLE.uViewH, uCanvas: STYLE.uCanvas,
      uCol: { value: (opts.color || new THREE.Color(PALETTE[3])).clone() }, uThin: { value: opts.thin ?? 0.75 } },
    vertexShader: /* glsl */`
      attribute float aEdge; varying float vEdge; varying vec3 vP;
      ${LIFT_GLSL}
      void main(){ vEdge = aEdge; vP = position; vec4 wp = modelMatrix * vec4(position, 1.); wp.xyz = liftWorld(wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCanvas, uCol; uniform float uThin; varying float vEdge; varying vec3 vP;
      ${STYLE_GLSL}
      void main(){
        float h = vP.x * 0.8 + vP.z * 0.6;                                  // along the mass
        float px = max(length(vec2(dFdx(h), dFdy(h))), 1e-4);
        float f1 = 1. - smoothstep(0.2, 0.6, px), f2 = 1. - smoothstep(0.04, 0.12, px);
        float n = 0.65 * mix(0.5, wn_vn(vec2(h * 0.8, vP.y * 0.035)), f1) + 0.35 * mix(0.5, wn_vn(vec2(h * 4.5, vP.y * 0.12 + 3.)), f2);
        float th = mix(-0.3, 0.2 + 0.75 * uThin, vEdge * vEdge);
        float aa = clamp(fwidth(n - th), 0.02, 0.1) + 0.06 * (1. - f1);
        float cov = smoothstep(-aa, aa, n - th);
        cov *= 1. - wn_weave(vec2(h, vP.y), 0.35, px) * 0.9 * vEdge;      // the body of the mass is the pigment exactly
        gl_FragColor = vec4(mix(uCanvas, uCol, cov), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// RUNS: thinned paint running straight down from a lower edge. runGeometry(list) + runMaterial(opts).
// Each item: { x, y, z (the top, inside the stroke it hangs from), width 0.15..0.4 m, length m, seed 0..1,
//              at 0..1 (when it starts to run as uRun goes 0 -> 1), color THREE.Color }
// Drive runMaterial.uniforms.uRun.value 0..1 from u (or from distance, as the pillar does).
// ---------------------------------------------------------------------------------------------------------------
export function runGeometry(list) {
  const SEG = 6, g = new THREE.InstancedBufferGeometry();
  const pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) pos.push(-1, i / SEG, 0, 1, i / SEG, 0);
  for (let i = 0; i < SEG; i++) { const o = i * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  const n = list.length, iSl = new Float32Array(n * 2), iPos = new Float32Array(n * 3), iDim = new Float32Array(n * 4), iCol = new Float32Array(n * 3);
  list.forEach((d, i) => {
    iPos.set([d.x, d.y, d.z], i * 3); iDim.set([d.width, d.length, d.seed, d.at], i * 4); iCol.set([d.color.r, d.color.g, d.color.b], i * 3); iSl.set([d.slide || 0, d.phase || 0], i * 2);
  });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3));
  g.setAttribute('iDim', new THREE.InstancedBufferAttribute(iDim, 4));
  g.setAttribute('iCol', new THREE.InstancedBufferAttribute(iCol, 3));
  g.setAttribute('iSlide', new THREE.InstancedBufferAttribute(iSl, 2));
  g.instanceCount = n;
  return g;
}
export function runMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    defines: opts.pillar ? { WN_PILLAR: 1 } : {},
    uniforms: { uLift: STYLE.uLift, uViewH: STYLE.uViewH, uRun: { value: 0 }, uFace: { value: new THREE.Vector2(1, 0) }, uGrow: { value: new THREE.Vector2(1e8, 1e9) },
      uBreath: { value: 0 }, uSwell: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iDim; attribute vec3 iCol; attribute vec2 iSlide;
      uniform float uRun; uniform vec2 uFace; uniform float uBreath; uniform float uSwell; uniform vec2 uGrow;
      varying vec3 vCol; varying vec3 vQ; varying vec2 vWL; varying float vFade;
      ${LIFT_GLSL}
      void main(){
        float len = iDim.y * smoothstep(iDim.w, iDim.w + 0.4, uRun);
      #ifndef WN_PILLAR
        len *= 1. - smoothstep(uGrow.x, max(uGrow.y, uGrow.x + 1.), length((modelMatrix * vec4(iPos, 1.)).xz - cameraPosition.xz));
      #endif
        float t = position.y;
        vec3 p = iPos; p.y -= t * len;
        p.x += 0.07 * sin(p.y * 0.9 + iDim.z * 40.) * smoothstep(0., 2., t * len);       // it finds its way down the weave
      #ifdef WN_PILLAR
        p.x = p.x * (1. + uSwell * sin(6.2832 * uBreath * 0.5 + iSlide.y * 0.3)) + iSlide.x * sin(6.2832 * uBreath + iSlide.y);
        vec3 ax = vec3(uFace.x, 0., -uFace.y);
        p = vec3(p.x * uFace.x + p.z * uFace.y, p.y, -p.x * uFace.y + p.z * uFace.x);
        vec4 wp = modelMatrix * vec4(p, 1.);
      #else
        vec3 ax = normalize(vec3(viewMatrix[0][0], 0., viewMatrix[2][0]) + vec3(1e-5, 0., 0.));   // faces the eye about the vertical
        vec4 wp = modelMatrix * vec4(p, 1.); wp.xyz = liftWorld(wp.xyz);
      #endif
        vec4 cp = projectionMatrix * viewMatrix * wp;
        float hw = 0.5 * iDim.x * 1.5, want = max(hw, 0.75 * pixelSize(cp.w));      // never under 1.5 pixels
        vFade = sqrt(hw / want) * step(0.02, len);
        wp.xyz += normalize(mat3(modelMatrix) * ax) * position.x * want;
        vCol = iCol; vQ = vec3(position.x * 1.5, t * len, len); vWL = vec2(iDim.x * 0.5, iDim.z);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying vec3 vQ; varying vec2 vWL; varying float vFade;
      ${STYLE_GLSL}
      void main(){
        float a = abs(vQ.x), down = vQ.y, len = vQ.z, hw = max(vWL.x, 1e-3);
        float db = (len - down) / hw;                                    // distance from the tip in half widths
        float neck = mix(1.0, 0.46, smoothstep(0., 2.5, down)) * (0.75 + 0.5 * wn_vn(vec2(vWL.y * 31., down * 0.3)));
        float q = (db - 2.2) / 2.2;
        float tip = 0.68 * sqrt(max(1. - q * q, 0.));                       // the heavier end of the run, a long drop
        float w = max(neck * step(2.2, db), max(tip, neck * (1. - step(2.2, db)) * step(q * q, 1.) * sqrt(max(1. - q * q, 0.))));
        float e = max(fwidth(a), 1e-3);
        float cov = 1. - smoothstep(w - e, w + e, a);
        float pxm = max(length(vec2(dFdx(down), dFdy(down))), 1e-4);
        float film = smoothstep(0.15, 0.6, wn_vn(vec2(vWL.y * 17., down * 0.22)) + 0.5 * step(db, 5.));   // thinned paint: it breaks, then gathers at the tip
        cov *= 1. - wn_weaveR(vec2(vQ.x * hw + vWL.y * 50., down), pxm, WN_PITCH) * mix(0.6, 0.1, film);
        if (cov * vFade < 0.02) discard;
        gl_FragColor = vec4(vCol, cov * vFade);
      }`,
    transparent: true, depthWrite: opts.depthWrite ?? false, side: THREE.DoubleSide, forceSinglePass: true,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// THE HERO
// ---------------------------------------------------------------------------------------------------------------
const SHAFT_W0 = 44, SHAFT_H = 250, HEAD_R0 = 27, SLIT_LO = 19, SLIT_HI = 35;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('white-night-pillar') : ctx.rng;
  // opts.billboard (the world's night pass): the course goes round the pillar and no longer through it, so the picture
  // is one face with its sheets a hand apart, no slit, and it turns to the eye at every distance
  const BILL = !!opts.billboard, SHEET = BILL ? 0.5 : 6;
  // (slim pass) opts.shaftW / opts.headR: a slimmer column and a smaller head; opts.gaps: the strokes miss each other, a
  // dry gap of 10 to 20 percent between one and the next, their ends ragged and out of line
  const SHAFT_W = opts.shaftW ?? SHAFT_W0, HEAD_R = opts.headR ?? HEAD_R0, HEAD_Y = SHAFT_H + HEAD_R - 4, GAPS = !!opts.gaps;
  const pg = pigments(opts.palette);
  STYLE.uCanvas.value.copy(pg.canvas);
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? 1));
  const windy = opts.wind ?? rng.chance(0.3);          // "a breath of wind": 70 thinner strokes with wider gaps
  const object = new THREE.Group(); object.name = 'pillar-of-the-white-night';

  // ---- the shaft: level strokes stacked 250 m high, in three sheets, the slit left open at 19..35 m ----
  const strokes = [], runs = [];
  const nShaft = GAPS ? (windy ? 46 : 32) : windy ? 70 : 46;
  const hLo = windy ? 3.2 : 5, hHi = windy ? 5.6 : 9;
  const levels = [];
  const lay = (y0, y1, n) => {             // n strokes filling y0..y1, overlapping here, missing each other there
    const hs = [], steps = []; let sum = 0;
    for (let i = 0; i < n; i++) { const h = rng.range(hLo, hHi); hs.push(h); const st = h * rng.range(windy ? 0.64 : 0.5, windy ? 1.04 : 1.04); steps.push(st); sum += st; }
    let y = y0; const k = (y1 - y0) / sum;
    for (let i = 0; i < n; i++) { const h = GAPS ? steps[i] * k * rng.range(0.92, 1.04) : Math.min(hs[i], steps[i] * k * 1.7); levels.push({ y: y + steps[i] * k * 0.5, h }); y += steps[i] * k; }
  };
  const nLow = windy ? 5 : 3;
  if (BILL) lay(0.5, SHAFT_H, nShaft + 2);
  else { lay(0.5, SLIT_LO - 0.5, nLow); lay(SLIT_HI + 0.5, SHAFT_H, nShaft - nLow); }
  if (!BILL) for (const lv of levels) {                 // keep the slit a clean 16 m: the camera goes through it
    const r = lv.h * 0.575 + 0.5;
    if (lv.y < (SLIT_LO + SLIT_HI) / 2) lv.y = Math.min(lv.y, SLIT_LO - r + 1.2); else lv.y = Math.max(lv.y, SLIT_HI + r - 1.2);
  }
  const sheetOf = (i) => (i * 2 + (rng.chance(0.35) ? 1 : 0)) % 3;
  const addRuns = (cx, y, h, len, z, n, minAbsX, longish, ex) => {
    for (let j = 0; j < n; j++) {
      let x = cx + rng.range(-0.47, 0.47) * len;
      if (Math.abs(x) < minAbsX) x = (x < 0 ? -1 : 1) * (minAbsX + rng.range(0, 4));
      const big = rng.chance(longish ? 0.45 : 0.16);
      runs.push({ x, y: y - h * rng.range(0.05, 0.3), z: z + 0.012, width: (BILL ? rng.range(0.3, 0.7) * (GAPS ? 1.5 : 1) : rng.range(0.15, 0.4)) * (big ? (BILL ? 1.6 : 1.25) : 1),
        length: h * 0.3 + (big ? rng.range(7, 14) * (GAPS ? 1.5 : 1) : rng.range(1.5, 6)), seed: rng(), at: rng.range(0, 0.55), slide: ex[1], phase: ex[2],
        color: rng.chance(0.05) ? pg.pink : pg.gold });
    }
  };
  levels.forEach((lv, i) => {
    const sh = sheetOf(i), z = (sh - 1) * SHEET + i * 0.004;
    // (billboard) laid by hand: no two the same length, none quite level, their ends out of line with each other
    const len = GAPS ? SHAFT_W * rng.range(0.86, 1.08) : SHAFT_W + (BILL ? rng.range(-4.2, -0.6) : rng.range(-1.6, 1.6)), cx = GAPS ? rng.range(-0.05, 0.05) * SHAFT_W : rng.range(-1.0, 1.0), dir = rng.chance(0.5) ? 1 : -1;
    const tilt = GAPS ? rng.range(-0.06, 0.06) : BILL ? rng.range(-0.035, 0.035) : rng.range(-0.008, 0.008), sag = GAPS ? rng.range(-0.7, 0.7) : BILL ? rng.range(-1.0, 1.0) : rng.range(-0.35, 0.35), margin = GAPS ? 2 : 4;
    const pts = [], N = 18, x0 = cx - dir * (len / 2 + margin), x1 = cx + dir * (len / 2 + margin);
    for (let k = 0; k <= N; k++) { const t = k / N, x = x0 + (x1 - x0) * t; pts.push([x, lv.y + tilt * x + sag * (4 * t * (1 - t) - 0.6), z]); }
    const nearSlit = !BILL && Math.abs(lv.y - lv.h / 2 - SLIT_HI) < 4;
    strokes.push({ pts, half: lv.h / 2, side: [0, 1, 0], color: pg.gold, under: pg.pink, underAmt: rng.range(0.4, 0.9), seed: rng(),
      dry: GAPS ? rng.range(-0.62, -0.34) : rng.range(-0.5, -0.02), margin, z,
      wave: [rng.range(0.3, 0.7), rng.range(60, 130), rng.range(0, 6.28), rng.range(0.5, 1.0) * (rng.chance(0.5) ? 1 : -1)],
      // slide: each stroke slips sideways on its own, and a slow undulation climbs the whole column (lv.y * 0.07)
      ext: [0, rng.range(1.1, 2.3) * (BILL ? 0.42 : 1) * (rng.chance(0.8) ? 1 : -1), lv.y * 0.07 + rng.range(-0.7, 0.7)] });
    addRuns(cx, lv.y, lv.h, len, z, Math.round((nearSlit ? 16 : rng.int(5, 10)) * detail), nearSlit ? 3.2 : 0, nearSlit, strokes[strokes.length - 1].ext);
  });
  await ctx.yield();

  // ---- the head: 11 shorter strokes clipped to a disc 54 m across ----
  const nHead = Math.max(5, Math.round(11 * HEAD_R / 27 + (GAPS ? 0.6 : 0))), hy0 = HEAD_Y - HEAD_R + 1, hy1 = HEAD_Y + HEAD_R - 1;
  for (let i = 0; i < nHead; i++) {
    const y = hy0 + (hy1 - hy0) * (i + 0.5) / nHead + rng.range(-0.8, 0.8), h = GAPS ? rng.range(4.6, 5.8) : rng.range(5.6, 8.2);
    const dy = Math.min(Math.abs(y - HEAD_Y), HEAD_R - 2), chord = 2 * Math.sqrt(HEAD_R * HEAD_R - dy * dy) + (rng.chance(0.3) ? 4 : 13);   // most run past the disc's edge, a few stop short
    const sh = (i * 2 + 1) % 3, z = (sh - 1) * SHEET + 0.3 + i * 0.004, dir = rng.chance(0.5) ? 1 : -1, margin = 3;
    const pts = [], N = 12, cx = rng.range(-0.8, 0.8), x0 = cx - dir * (chord / 2 + margin), x1 = cx + dir * (chord / 2 + margin);
    const tilt = rng.range(-0.012, 0.012);
    for (let k = 0; k <= N; k++) { const t = k / N, x = x0 + (x1 - x0) * t; pts.push([x, y + tilt * x, z]); }
    strokes.push({ pts, half: h / 2, side: [0, 1, 0], color: pg.gold, under: pg.pink, underAmt: rng.range(0.4, 0.8), seed: rng(),
      dry: rng.range(-0.45, -0.15), margin, z,
      wave: [rng.range(0.2, 0.45), rng.range(60, 110), rng.range(0, 6.28), rng.range(0.4, 0.8)],
      ext: [HEAD_R, rng.range(0.5, 1.2) * (rng.chance(0.5) ? 1 : -1), rng.range(0, 6.28)] });
    if (y < HEAD_Y) addRuns(cx, y, h, chord * 0.7, z, Math.round(rng.int(2, 4) * detail), 0, false, strokes[strokes.length - 1].ext);
  }

  // ---- the echo: the head's contour repeated once outside it in madder, never closed (open at the lower left) ----
  {
    const N = 64, a0 = -1.75 + rng.range(-0.12, 0.12), sweep = 5.05 + rng.range(-0.2, 0.15);   // from just right of the foot, round over the top
    const pts = [], sides = [], ph = rng.range(0, 6.28), off = rng.range(3.0, 4.2);
    for (let k = 0; k <= N; k++) {
      const t = k / N, a = a0 + sweep * t;
      const r = HEAD_R + off + 1.1 * Math.sin(a * 1.7 + ph) + 0.5 * Math.sin(a * 4.3 + ph * 2) + 1.6 * t * t;   // the echo wanders off its contour
      pts.push([Math.cos(a) * r, HEAD_Y + Math.sin(a) * r, SHEET + 0.6]); sides.push([Math.cos(a), Math.sin(a), 0]);
    }
    strokes.push({ pts, half: 0.9, side: (i) => sides[i], color: pg.madder, under: pg.madder, underAmt: 0, seed: rng(), dry: -0.3, margin: 2,
      z: SHEET + 0.6, wave: [0.3, 400, rng.range(0, 6.28), 0.55], ext: [0, 0, 0] });
  }
  if (BILL) {
    const ergn = ctx.rng.fork ? ctx.rng.fork('white-night-pillar-echo') : rng;
    for (const [sg, y0, y1] of GAPS ? [[-1, 52, 131], [1, 148, 226]] : [[-1, 9, 118], [-1, 131, 243], [1, 30, 171], [1, 183, 247]]) {
      const pts = [], N = Math.max(8, Math.round((y1 - y0) / 6)), ph = ergn.range(0, 6.28), off = ergn.range(3.2, 4.4);
      for (let k = 0; k <= N; k++) { const y = y0 + (y1 - y0) * k / N; pts.push([sg * (SHAFT_W / 2 + off + 1.0 * Math.sin(y * 0.05 + ph) + 0.45 * Math.sin(y * 0.17 + ph * 2)), y, SHEET + 0.6]); }
      if (sg > 0) pts.reverse();                         // one laid upward, the other down
      strokes.push({ pts, half: 0.85, side: [1, 0, 0], color: pg.madder, under: pg.madder, underAmt: 0, seed: ergn(), dry: ergn.range(-0.3, 0), margin: 2,
        z: SHEET + 0.6, wave: [0.35, 160, ergn.range(0, 6.28), 0.5], ext: [0, 0, 0] });
    }
  }
  strokes.sort((a, b) => a.z - b.z);                     // back sheet first: blended back to front as it faces us
  const geo = await strokeGeometry(strokes, ctx.yield);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 150, 0), 170);
  const mat = strokeMaterial({ pillar: true, depthWrite: true, minPx: 1.5, lanes: GAPS ? 0.38 : BILL ? 0.6 : undefined, rag: GAPS ? '0.22' : BILL ? '0.05' : undefined });
  mat.uniforms.uDisc.value.set(0, HEAD_Y); mat.uniforms.uSwell.value = 0.034;       // width breathes by 3 m
  const pillar = new THREE.Mesh(geo, mat); pillar.renderOrder = 40; pillar.frustumCulled = false; object.add(pillar);
  // the same strokes in the opposite order, for when the eye is behind the picture (after the break-through):
  // blending stays back to front on both sides. Shares every attribute; only its visibility is switched.
  const geoBack = new THREE.BufferGeometry();
  for (const k of Object.keys(geo.attributes)) geoBack.setAttribute(k, geo.attributes[k]);
  { const src = geo.index.array, rev = new src.constructor(src.length);
    for (let t = 0, n = src.length / 3; t < n; t++) { const o = (n - 1 - t) * 3; rev[t * 3] = src[o]; rev[t * 3 + 1] = src[o + 1]; rev[t * 3 + 2] = src[o + 2]; }
    geoBack.setIndex(new THREE.BufferAttribute(rev, 1)); }
  geoBack.boundingSphere = geo.boundingSphere;
  const pillarBack = new THREE.Mesh(geoBack, mat); pillarBack.renderOrder = 40; pillarBack.frustumCulled = false; pillarBack.visible = false; object.add(pillarBack);
  await ctx.yield();

  runs.sort((a, b) => a.z - b.z);
  const runGeo = runGeometry(runs);
  runGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 150, 0), 170);
  const runMat = runMaterial({ pillar: true, depthWrite: false });
  runMat.uniforms.uSwell.value = 0.034;
  const runMesh = new THREE.Mesh(runGeo, runMat); runMesh.renderOrder = 41; runMesh.frustumCulled = false; object.add(runMesh);
  await ctx.yield();

  const preview = null;       // (the set-piece viewer's preview scenery was removed when the world was built: the world is the scenery)

  // ---- motion ----
  const camW = new THREE.Vector3(), camL = new THREE.Vector3();
  const sm = THREE.MathUtils.smoothstep;
  let faceA = 0, heldA = 0, haveFace = false, progress = null, runsOverride = null;
  const SIDE = opts.side ?? 1;                           // +1 if the course turns toward local +x beyond the pillar, -1 if toward -x
  const FREEZE = preview && preview.view ? -40 : (opts.freeze ?? 150);                      // metres; radians per second
  function update(dt, time, camera) {
    STYLE.uTime.value = time;
    camera.getWorldPosition(camW); object.updateWorldMatrix(true, false); camL.copy(camW); object.worldToLocal(camL);
    const d = Math.hypot(camL.x, camL.z);
    // Facing: outside FREEZE + 40 m the picture faces the eye. Inside FREEZE it is held where it was, so nothing
    // spins as we pass through; between the two it eases. Both faces are the picture, so on the way out the
    // nearer face is taken and the pillar never turns right round. No clock in it: only where the eye is.
    if (d > 1e-3) {
      const target = Math.atan2(camL.x, camL.z);
      if (BILL) { faceA = target; heldA = target; haveFace = true; }
      else if (FREEZE > 0) {
        // (polish pass) a pure function of where the eye is, with no memory, so a frame is the same whether we flew
        // to it or were set down there: far off the picture faces the eye; close to, the eye's sideways offset counts
        // for less and less, and inside 30 m the picture lies square to the course (local z) and nothing can spin
        // Going through the middle must not turn the picture over, so beyond it we see its back: the half of the plan
        // that shows the back is bounded by a line through the middle that the course crosses nowhere else (it leaves
        // to port-north and to starboard-south, 50 degrees off the beam)
        const k = sm(d, 30, FREEZE), xs = camL.x * k, back = 0.643 * camL.z + 0.766 * xs * SIDE > 0;
        faceA = Math.atan2(xs, Math.abs(camL.z) < 1e-4 ? 1e-4 : camL.z) + (back ? Math.PI : 0);
        heldA = faceA; haveFace = true;
      } else {
        if (!haveFace) { heldA = target; haveFace = true; }
        let dl = target - heldA; dl -= Math.round(dl / Math.PI) * Math.PI;
        if (d >= FREEZE + 40) { heldA += dl; faceA = heldA; }
        else faceA = heldA + dl * sm(d, FREEZE, FREEZE + 40);
      }
      const front = Math.cos(target - faceA) >= 0;      // which side of the picture the eye is on
      pillar.visible = front; pillarBack.visible = !front;
    }
    const c = Math.cos(faceA), s = Math.sin(faceA);
    mat.uniforms.uFace.value.set(c, s); runMat.uniforms.uFace.value.set(c, s);
    const b = progress === null ? time / 41 : progress;                       // breathing: 9 slides over the journey
    mat.uniforms.uBreath.value = b * 9; runMat.uniforms.uBreath.value = b * 9;
    // the runs lengthen from nothing as we come up to it (a function of where the eye is, so of u, never of seconds)
    runMat.uniforms.uRun.value = runsOverride === null ? 1 - sm(d, 150, 640) : runsOverride;
    if (preview) preview.update(dt, time, camera);
  }

  const anchors = {
    // the slit: 16 m high (y 19..35), the full 44 m wide, open through all three sheets. Fly it level at y 27.
    slit: { center: [0, 27, 0], height: SLIT_HI - SLIT_LO, width: SHAFT_W },
    // a safe line with 8 m of air above and below (local space; the brief's course is local +Z after placing the
    // pillar at (0, 0, 780) with no rotation: the billboard turns the picture to the eye, the slit stays level)
    flyThrough: [[0, 27, -220], [0, 27, -90], [0, 27, -20], [0, 27, 0], [0, 27, 20], [0, 30, 70], [0, 55, 140]],
    // the 14 m portal of the brief, 123 m to port of the pillar as the camera arrives (world (121, 5, 800))
    portalSeat: { position: [121, 5, 20], facing: [0.7071, 0, 0.7071], radius: 7 },
    viewpoints: { first: [0, 2.5, -780], reveal: [-9, 4, -357], middle: [0, 24, -150], exit: [171, 5, 70] },
    headCenter: [0, HEAD_Y, 0], headRadius: HEAD_R, footprint: { width: SHAFT_W + 4, depth: 2 * SHEET + 2 },
  };
  const dbg = preview ? preview.view : null;            // viewer only: ?wn=close | mid for a nearer orbit
  return {
    object, radius: dbg ? dbg[0] : 150, height: dbg ? dbg[1] : 300, center: new THREE.Vector3(0, dbg ? dbg[2] : 150, 0), anchors,
    update,
    setProgress(u) { progress = u; },                  // journey u 0..1: the breathing (strokes sliding against each other)
    setRuns(v) { runsOverride = v; },                  // optional: 0..1 to script the runs yourself; null = by distance
    snapFacing() { haveFace = false; },                // call after teleporting the camera (not needed in flight)
    materials: { stroke: mat, runs: runMat },
    windy,
    dispose() {},
    ground: false, groundY: 0,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// solidMaterial(opts): the world's solids with depth (wood, tongue, far hills, boulders, jetty posts), added by
// the world builder. Like massMaterial but with per-vertex pigment and a laid-along coordinate, so that one
// merged mesh carries many forms:
//   attributes  aCol vec3 (pigment, linear), aQ vec2 (metres along the form, metres up it), aEdge float (1 where
//               the paint thins to canvas: the top contour), aShade float (0..1: where the one shade stroke lies)
//   opts.rim    true: a madder contour drawn where the surface turns away from the eye (needs normals): boulders
//   opts.thin   0..1 how much canvas opens at aEdge 1 (default 0.75);  opts.shade THREE.Color (default ultra)
//   opts.streak 0..1 (lane pass) goes of the shade colour laid down a dark mass among its downward strokes (default 0)
//   uniforms.uReach  metres (rare event: beyond it only bare canvas; default 1e9)
// ---------------------------------------------------------------------------------------------------------------
export function solidMaterial(opts = {}) {
  return new THREE.ShaderMaterial({
    defines: opts.rim ? { WN_RIM: 1 } : {},
    uniforms: { uLift: STYLE.uLift, uViewH: STYLE.uViewH, uCanvas: STYLE.uCanvas, uTime: STYLE.uTime,
      uThin: { value: opts.thin ?? 0.75 }, uReach: { value: 1e9 }, uEdgeAmt: { value: 1 }, uLanes: { value: opts.lanes ?? 1 }, uStreak: { value: opts.streak ?? 0 },
      uShade: { value: (opts.shade || new THREE.Color(PALETTE[0])).clone() }, uLit: { value: new THREE.Color(PALETTE[2]) }, uLine: { value: new THREE.Color(PALETTE[6]) } },
    vertexShader: /* glsl */`
      attribute vec3 aCol; attribute vec2 aQ; attribute float aEdge; attribute float aShade;
      varying vec3 vCol; varying vec2 vQ; varying float vEdge; varying float vShade; varying float vDist; varying float vRim;
      uniform float uEdgeAmt;
      ${LIFT_GLSL}
      void main(){
        vCol = aCol; vQ = aQ; vEdge = aEdge * uEdgeAmt; vShade = aShade;
        vec4 wp = modelMatrix * vec4(position, 1.);
        vRim = 1.;
      #ifdef WN_RIM
        vec3 n = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        vec3 v = normalize(cameraPosition - wp.xyz + vec3(1e-4));
        vRim = abs(dot(n, v));
      #endif
        wp.xyz = liftWorld(wp.xyz);
        vDist = length(wp.xz - cameraPosition.xz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCanvas, uShade, uLine, uLit; uniform float uThin, uReach, uTime, uLanes, uStreak;
      varying vec3 vCol; varying vec2 vQ; varying float vEdge; varying float vShade; varying float vDist; varying float vRim;
      ${STYLE_GLSL}
      void main(){
        float px = max(max(length(vec2(dFdx(vQ.x), dFdy(vQ.x))), 0.05 * length(vec2(dFdx(vQ.y), dFdy(vQ.y)))), 1e-4);
        // long downward strokes: lanes 12 m, 2.5 m and 0.5 m across, stretched 20 to 1 down the form; a lane the
        // eye cannot resolve (under 3 pixels) is replaced by its mean, so a far mass is flat paint with a cut edge
        float f0 = 1. - smoothstep(1.6, 4.0, px), f1 = 1. - smoothstep(0.35, 0.85, px), f2 = 1. - smoothstep(0.07, 0.17, px);
        float n0 = wn_vn(vec2(vQ.x * 0.085, vQ.y * 0.006 + 1.7));
        float n1 = wn_vn(vec2(vQ.x * 0.42, vQ.y * 0.022 + 5.1));
        float n2 = wn_vn(vec2(vQ.x * 2.1, vQ.y * 0.1 + 3.));
        float n = 0.4 * mix(0.5, n0, f0) + 0.34 * mix(0.5, n1, f1) + 0.26 * mix(0.5, n2, f2);
        // paint thins to bare canvas only at the contour (aEdge 1): a ragged, streaked edge, never a gradient
        float th = mix(0.12, 0.22 + 0.62 * uThin, vEdge);
        float aa = clamp(fwidth(n - th) * 0.9, 0.012, 0.05);
        // inside the mass the long downward strokes leave a few dry slits of canvas, seen only where the lanes resolve
        float slit = 0.33;
      #ifdef WN_RIM
        slit = mix(0.19, 0.33, smoothstep(0.1, 0.4, vCol.g));      // a dark crown seen close keeps its body: a slit of canvas now and then, never a hole
      #endif
        float cov = mix(smoothstep(-aa, aa, n - mix(-1., slit, 1. - smoothstep(0.05, 0.13, px))), smoothstep(-aa, aa, n - th), smoothstep(0.02, 0.2, vEdge));
        vec2 gx = vec2(dFdx(vQ.x), dFdy(vQ.x)), gy = vec2(dFdx(vQ.y), dFdy(vQ.y));
        float wv = mix(wn_weaveA(vQ, vec2(length(gx), length(gy)), WN_PITCH), 0.42, smoothstep(2.5, 6., wn_skew(gx, gy)));
        // the long downward strokes at every distance (polish pass): dry lanes of canvas run down the form, more of them
        // toward the contour, gathered in patches so the mass is scrubbed here and loaded there
        { float lane = wn_lanes(vQ.y, vQ.x, px, 15., 0.37);
          float clump = wn_vn(vec2(vQ.x * 0.021 + 3.7, vQ.y * 0.004));
          float gap = 1. - smoothstep(0.1, 0.3, lane - 0.3 * (clump - 0.5) - 0.12 * vEdge);
          cov *= 1. - 0.7 * gap * uLanes; }
        cov *= 1. - wv * 0.22 * vEdge * mix(0.3, 1., smoothstep(0.05, 0.15, vCol.g));
        // seen close, the threads show through any paint (a third as much through the green-black, which is loaded: a dark
        // crown must not read as a net of light dots)
        cov *= 1. - wv * 0.17 * (1. - smoothstep(0.012, 0.06, length(gx) + length(gy))) * mix(0.3, 1., smoothstep(0.05, 0.15, vCol.g));
        vec3 col = vCol;
        // (lane pass) opts.streak: the dark mass is not one flat green-black. Among its long downward strokes a go of the
        // ultramarine is laid here and there, streaked, gathered in patches, lanes the eye can always resolve
        { float ln2 = wn_lanes(vQ.y + 40., vQ.x + 31.7, px, 22., 0.71);
          float cl2 = wn_vn(vec2(vQ.x * 0.035 + 9.1, vQ.y * 0.006 + 2.));
          float st = smoothstep(0.77, 0.84, ln2 + 0.45 * (cl2 - 0.5)) * uStreak * (1. - smoothstep(0.06, 0.2, vCol.g));
          col = mix(col, uShade, 0.9 * st); }
        // the one shade stroke: streaked, dry at its ends
        float sn = 0.3 * (mix(0.5, wn_vn(vec2(vQ.x * 0.5, vQ.y * 3.)), f1) - 0.5) + 0.16 * (mix(0.5, wn_vn(vec2(vQ.x * 2.5, vQ.y * 14.)), f2) - 0.5);
        float sa = clamp(fwidth(vShade + sn) * 0.9, 0.01, 0.06);
        float sh = smoothstep(0.5 - sa, 0.5 + sa, vShade + sn);
        col = mix(col, uShade, sh);
        cov = max(cov, sh);
        float lt = smoothstep(0.5 - sa, 0.5 + sa, -vShade + sn);      // the lit stroke (negative aShade): the gold, on stones and crowns by the pillar
        col = mix(col, uLit, lt);
        cov = max(cov, lt);
        vec3 c = mix(uCanvas * (1.03 - 0.06 * wv), col, cov);
      #ifdef WN_RIM
        // the contour: a madder line where the form turns away, broken where the hand lifts (it never closes)
        float brk = wn_vn(vec2(vQ.x * 0.5 + 7., 2.3));
        float w = 0.26 + 0.13 * wn_vn(vec2(vQ.x * 1.7, vQ.y * 0.8));
        float aw = clamp(fwidth(vRim) * 0.9, 0.008, 0.1);
        float rim = (1. - smoothstep(w - aw, w + aw, vRim)) * smoothstep(0.26, 0.3, brk);
        c = mix(c, uLine, rim);
      #endif
        // the unfinished canvas (rare): beyond the reach a solid is bare canvas inside its contour; the edge of the
        // painted part is a streaked one
        float rr = uReach * (0.85 + 0.3 * wn_vn(vec2(vQ.x * 0.02, 5.)));
        float ut = (vDist - rr) / 50. + 1.4 * (wn_vn(vec2(vQ.x * 0.045, vQ.y * 0.004 + 2.)) - 0.5) + 0.5 * (n - 0.5);
        float uw = clamp(fwidth(ut), 0.004, 0.06);
        float un = smoothstep(-uw, uw, ut) * step(uReach, 1e8);
        c = mix(c, uCanvas, un);
        gl_FragColor = vec4(c, 1.);
      }`,
    side: opts.side ?? THREE.FrontSide,
  });
}
