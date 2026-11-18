// Three Pegs in the Valley: the hero (two puzzles of three rock needles and millstone rings) and the style kit of the world.
// The puzzle runs on the world's clock alone; shadows fall by the one fixed sun direction; built on our older engine and kit as
// they are (kit: none; makeNoise from src/kit/core.js).
// VERSION 3 ADDS: ring() can cut a stone true (`cut`: no bites, every slab on the ring's centre) and can build a part of
// its slabs in a call (`slabs`), for the quarry's wheel; and anchors.portalSeat names the way out's new place at the end of
// the world's line.
//
// THE STYLE, and how each rule is carried
//   Flat inks: sand, ochre, red, oxblood, maroon and two mixed from them (ripple, straw), one shadow ink (palette.dusk; the
//   world's editions pass a violet blue), a cream (palette.sky, for the beds of the washes) and a pale blue-violet that far bodies go toward (palette.far).
//   One unlit ink shader for every body, the floor and the sky (the built shadows have their own, below): a fragment shows its vertex ink, or mix(ink, shadow ink, 0.62) when its face is turned
//   from the sun, when the builder marked it shaded, or when a ray from it toward the sun meets a cast. No light, fog, texture,
//   gradient, outline or full-screen pass; written for post flat 1, bloom 0, no vignette or grain (the linear ink is the colour shown).
//   The sun stands 16.5 degrees up on the plan bearing 108 degrees, the same in every edition.
//   Casts are analytic and live in shared uniforms: 19 rings (centre, axis, radii, half thickness, optional half; the last five are left
//   to the world, and the first of those may have a wedge broken out of it), 24 upright cone
//   frusta (slots 0..11 foot and shaft of the six needles, the rest left to the world) and 36 upright boxes, each turned about
//   the vertical (left to the world; boxes 0..23 in sets of three for one body, boxes 30..35 one body of six). A body carries a self id and
//   skips its own cast, so its own faces are told by their normals alone. Nothing in the shaders or in update() reads the camera.
//   Rock is level strata as geometry: one prism per band of one table of heights and inks; thin bands sit back, thick ones stand
//   proud, bands sit out of line, blocks are missing. A ring is one ink (its furrows and the seam under each slab a second) in
//   slabs about 3 m thick: each slab a wall under a shoulder that slopes back 1.7 m, every other slab standing 2.4 m back, every
//   slab a little off centre, bites out of the rim, furrows round the hole as sunk grooves that bare the next bed down. Nothing
//   is drawn inside a face.
//   Small bodies and far ones throw a built floor polygon instead of a cast. Built shadows are laid in two steps (see VEIL_FS),
//   so a point of the floor under any number of polygons is darkened once, by the same share as under a cast, and the floor's
//   marks show through. A floor strip that is marked shaded (a dune's lee, the shade under a wash's bank) has to be drawn after
//   the sheet: inside a built shadow it then shows the once darkened ink that the floor round it shows. Built shadows need the buffer a world is drawn into to have an alpha channel that is 1 before the veils
//   (RGBA; every opaque writer here but the veils themselves writes alpha 1). A flat thing seen from both sides is two faces back to back (builder.flat), each told by its own normal.
//
// makeStyle(ctx, opts = { palette (seven hex strings: sky, sand, ochre, red, oxblood, maroon, shadow ink), far (hex) }) returns
//   palette { sky, sand, ochre, red, oxblood, maroon, dusk, far, straw, sandShade, ripple } (linear THREE.Color), shadeOf(c),
//   paleOf(c), farOf(c, layer 0..2), sun (unit Vector3 toward the sun, fixed), sunUp, sunBearing (radians), shadeMix,
//   bands [[y0, y1, inkName]], uniforms (shared; uTime is the only clock),
//   materials: rock (closed bodies), blade (flats of two faces), plain (the vertex ink and nothing else; the world's sky and
//     clouds take the same rule through inkWith),
//     veil (built shadow polygons on the floor, step one), veilWith(vertexShader) (the same behind a vertex shader of the caller's),
//     lay (step two: one sheet over the floor, drawn after every veil), veilOver (shadow polygons on a mesa's top),
//     layer(order, plain?) (floor layers; order 0 writes depth, the rest sit over it by polygon offset; set mesh.renderOrder too),
//     inkWith(vertexShader, { two, plain, uniforms, extra }) (the ink rule behind a vertex shader of the caller's),
//   geometry: builder() -> { tri, quad, flat, xf, geometry(), mesh(material) } with attributes position, normal, aInk, aId (self id, shade),
//     strata(b, o) a standing body of bands, ring(b, o) a millstone,
//   shadowOnFloor(x, y, z) -> [x, z], setRing / setCyl / setBox / setGap (world space; the hero drives rings 0..13 and cones 0..11 every
//     frame, the world sets rings 14 to 18, its own cones and boxes), update(dt, time) (sets uTime; the hero's update calls it too).
//   Self ids for aId.x: 0..18 a ring, coneId + slot a cone, boxId + slot a box, -1 none.
//
// buildHero(ctx, opts = { style, palette, floor (false = the world lays the floor) })
//   Frame: hero-local = the plan's (x, d) moved so near needle B's foot is the origin: local (x + 52, y, -(d - 384)). Put
//   hero.object at anchors.place, unturned (the cone casts are upright and the sun is a world direction).
//   Near puzzle: needles A, B, C 86 m tall, 180 m apart; five rings of radius 17, 22, 28, 34 and 40 m, each its own ink from
//   straw (smallest) to maroon (widest), crossing with their undersides at 100 m. Tall puzzle: three giants 200, 260 and 230 m
//   tall, 201 m and more apart, and eight rings of radius 30 to 50 m (one of them in two halves) in constant poses (TALL below),
//   three of which stir. The giants, their rings, places, poses and outlines are constants, the same on every seed.
//   Returns { object, radius 210, height 150 (hints of its size: the near row), center, anchors, style, update(dt, time), dispose(),
//     period (s), lawful (the table took only top rings and set none on a smaller), moves, ringsAt(time), ground, groundY }.
//   update(dt, time): every pose is a function of time alone: the near rings and their dust (3 s after a
//   landing) by time modulo period through the table of 93 moves; the tall rings by raw time through their own periods
//   (23 s, 7 s, 9 s with 13 s).
//   It writes ring matrices, uniforms and two instance attributes; it creates nothing and takes no progress value.
//   anchors (hero-local): place (where to put the object in the world), pegs[3], tallPegs[3] (needle feet), needle, giants
//     (dimensions), needleTop, tallNeedleTop (heights), portalSeat { position, facing (unit, toward the arriving camera), radius },
//     lane { underside, seatY, from, to, rings } (the lanes of the near
//     rings), keepOut [{ x, z, r }] (circles for scatter: needle feet, the near stacks, rings lying low),
//     keepLater [{ x, z, r }] (circles for the scatter's second sieve).
//   ringsAt(time, only) -> [{ x, y, z, R, r, h, ax, flying, stirs }] hero-local centres, radii, thickness and unit axis of the 5 near
//     and 9 tall rings (the broken one counts twice), for a clearance test.
//   Cost: 12 draw calls with its own floor (11 without), no lights, no textures; built in yielded steps.
import * as THREE from 'three';
import { makeNoise } from '../kit/core.js';

// ---------------------------------------------------------------- constants of the valley (the same on every seed)
const PALETTE = ['#F4E6CF', '#E6C48E', '#D9963F', '#C25A34', '#8E3529', '#5A2530', '#4B3048'];
const INK_NAMES = ['sky', 'sand', 'ochre', 'red', 'oxblood', 'maroon', 'dusk'];
// Toward the sun, world space (x, y, z = -d): 16.5 degrees above the horizon, on the plan bearing 108 degrees from the course toward +x.
// A point h metres up throws its shadow 3.376 h metres along the plan bearing -72 degrees. The same in every edition.
const SUN_UP = 16.5 * Math.PI / 180, SUN_BEARING = 108 * Math.PI / 180;
const SUN = new THREE.Vector3(Math.cos(SUN_UP) * Math.sin(SUN_BEARING), Math.sin(SUN_UP), -Math.cos(SUN_UP) * Math.cos(SUN_BEARING)).normalize();
const SHADE = 0.62;                                               // share of the shadow ink in every shaded tone
const NR = 19, NC = 24, NB = 36;                                  // casts: rings, cones, boxes
const FREE_RING = 14, GATE_RING = 15, QUARRY_RING = 16, PIECE_RING = 17; // the ring casts left to the world: one that may have a wedge broken out, two whole, and two more from PIECE_RING
const BOX_SETS = 24;                                              // boxes 0..23 stand in sets of three (one body, three boxes); 24..29 stand alone
const BOX_SIX = 30;                                               // boxes 30..35 are one body of six, which carries the id of box 30
const CONE_ID = 20, BOX_ID = 60;                                  // self ids: a cone is CONE_ID + its slot, a box BOX_ID + its slot
// The strata, bottom up: [height in m, ink]. Beds are red and oxblood, with one 3 m bed of ochre; the 1.5 m seams are ochre and maroon; the list repeats every 73.5 m.
const BANDS = [[3, 'red'], [1.5, 'maroon'], [6, 'oxblood'], [3, 'red'], [1.5, 'ochre'], [9, 'red'], [3, 'oxblood'], [1.5, 'maroon'], [6, 'red'],
  [3, 'ochre'], [9, 'oxblood'], [1.5, 'maroon'], [6, 'red'], [3, 'oxblood'], [1.5, 'ochre'], [9, 'red'], [6, 'oxblood']];
const BAND_TOP = 430;                                             // the table is laid up to the first bed that ends at or over this height (m)

// Hero-local frame: the plan's place (x, d) sits at local (x - OX, -(d - OD)); the origin is the foot of near needle B.
const OX = -52, OD = 384;
const L = (x, d) => [x - OX, -(d - OD)];

// ---------------------------------------------------------------- shaders
const CAST_GLSL = /* glsl */`
uniform vec3 uSun;
uniform vec4 uRingA[${NR}]; uniform vec4 uRingB[${NR}]; uniform vec4 uRingC[${NR}];
uniform vec4 uCylA[${NC}]; uniform vec4 uCylB[${NC}];
uniform vec4 uBoxC[${NB}]; uniform vec4 uBoxH[${NB}];
uniform vec3 uGapA; uniform vec3 uGapB;
// A: centre, outer radius (0 = unused). B: unit axis, hole radius. C: half-space normal in the ring's plane (zero = whole ring), half thickness.
// tm: where the ray's stretch inside the ring has its middle (metres along the ray), for the gap of ring ${FREE_RING}.
bool castRing(vec3 P, vec4 A, vec4 B, vec4 C, out float tm) {
  tm = 0.;
  if (A.w <= 0.) return false;
  vec3 a = B.xyz, o = P - A.xyz;
  float d0 = dot(o, a), d1 = dot(uSun, a);
  float sd = abs(d1) < 1e-4 ? 1e-4 : d1;
  float ta = (-C.w - d0) / sd, tb = (C.w - d0) / sd;
  float lo = max(min(ta, tb), 0.02), hi = max(ta, tb);
  vec3 q0 = o - a * d0, q1 = uSun - a * d1;
  float qa = max(dot(q1, q1), 1e-5), qb = dot(q0, q1), qq = dot(q0, q0);
  float D = qb * qb - qa * (qq - A.w * A.w);
  if (D <= 0.) return false;
  float s = sqrt(D);
  lo = max(lo, (-qb - s) / qa); hi = min(hi, (-qb + s) / qa);
  if (dot(C.xyz, C.xyz) > 0.5) {
    float n0 = dot(o, C.xyz), n1 = dot(uSun, C.xyz);
    if (abs(n1) < 1e-4) { if (n0 < 0.) return false; }
    else { float tc = -n0 / n1; if (n1 > 0.) lo = max(lo, tc); else hi = min(hi, tc); }
  }
  if (hi <= lo) return false;
  float Di = qb * qb - qa * (qq - B.w * B.w);
  if (Di > 0.) { float si = sqrt(Di); if ((-qb - si) / qa <= lo && (-qb + si) / qa >= hi) return false; }
  tm = 0.5 * (lo + hi);
  return true;
}
// Upright cone frustum. A: centre x, centre z, y0, y1. B: radius at y0 (0 = unused), radius at y1.
bool castCyl(vec3 P, vec4 A, vec4 B) {
  if (B.x <= 0.) return false;
  float k = (B.y - B.x) / max(A.w - A.z, 1e-3);
  vec2 o = P.xz - A.xy, s = uSun.xz;
  float r = B.x + k * (P.y - A.z), rs = k * uSun.y;
  float qa = dot(s, s) - rs * rs, qb = dot(o, s) - r * rs, qc = dot(o, o) - r * r;
  if (qa < 1e-4) return false;
  float D = qb * qb - qa * qc;
  if (D <= 0.) return false;
  float sq = sqrt(D), sy = max(uSun.y, 1e-3);
  float lo = max(max((-qb - sq) / qa, 0.02), (A.z - P.y) / sy);
  float hi = min((-qb + sq) / qa, (A.w - P.y) / sy);
  return hi > lo;
}
// Upright box, turned about the vertical. C: centre, cosine of the turn. H: half sizes (x <= 0 = unused), sine of the turn.
bool castBox(vec3 P, vec4 C, vec4 H) {
  if (H.x <= 0.) return false;
  vec3 o = C.xyz - P;
  vec3 ol = vec3(o.x * C.w - o.z * H.w, o.y, o.x * H.w + o.z * C.w);
  vec3 sl = vec3(uSun.x * C.w - uSun.z * H.w, uSun.y, uSun.x * H.w + uSun.z * C.w);
  vec3 sdir = vec3(abs(sl.x) < 1e-4 ? 1e-4 : sl.x, abs(sl.y) < 1e-4 ? 1e-4 : sl.y, abs(sl.z) < 1e-4 ? 1e-4 : sl.z);
  vec3 t0 = (ol - H.xyz) / sdir, t1 = (ol + H.xyz) / sdir;
  vec3 mn = min(t0, t1), mx = max(t0, t1);
  float lo = max(max(mn.x, mn.y), max(mn.z, 0.02)), hi = min(mx.x, min(mx.y, mx.z));
  return hi > lo;
}
// self: 0..${NR - 1} a ring, ${CONE_ID}.. a cone, ${BOX_ID}.. a box; a body never tests its own cast (its own faces are told by their normals).
// A body of three boxes carries the id of its first box and skips all three; the body of six (from box ${BOX_SIX}) likewise skips all six.
bool inShadow(vec3 P, int self) {
  for (int i = 0; i < ${NR}; i++) {
    float tm;
    if (i != self && castRing(P, uRingA[i], uRingB[i], uRingC[i], tm)) {
      // ring ${FREE_RING} has a piece broken out of it: the wedge on the far side of both uGapA and uGapB throws nothing
      if (i == ${FREE_RING}) { vec3 m = P + uSun * tm - uRingA[i].xyz; if (dot(m, uGapA) < 0. && dot(m, uGapB) < 0.) continue; }
      return true;
    }
  }
  for (int i = 0; i < ${NC}; i++) { if (i + ${CONE_ID} != self && castCyl(P, uCylA[i], uCylB[i])) return true; }
  int b = self - ${BOX_ID};
  for (int i = 0; i < ${NB}; i++) {
    bool own = i == b || (b >= 0 && b < ${BOX_SETS} && i > b && i < b + 3) || (b == ${BOX_SIX} && i > b);
    if (!own && castBox(P, uBoxC[i], uBoxH[i])) return true;
  }
  return false;
}`;

const INK_VS = /* glsl */`
attribute vec3 aInk; attribute vec2 aId;
varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
void main() {
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
  #endif
  vec4 w = modelMatrix * p;
  vW = w.xyz; vN = mat3(modelMatrix) * n; vInk = aInk; vId = aId;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// The one ink rule: the vertex ink, or mix(ink, shadow ink, ${SHADE}) on a face turned from the sun, a face marked shaded, or a point under a cast.
// A flat thing seen from both sides is built as two faces back to back, each told by its own normal.
const INK_FS = /* glsl */`
uniform vec3 uDusk;
varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
#ifndef PLAIN
${CAST_GLSL}
#endif
void main() {
  vec3 col = vInk;
  #ifndef PLAIN
  bool sh = vId.y > 0.5 || dot(vN, uSun) <= 0.;
  if (!sh) sh = inShadow(vW, int(floor(vId.x + 0.5)));
  if (sh) col = mix(vInk, uDusk, ${SHADE});
  #endif
  gl_FragColor = vec4(col, 1.);
}`;

// Built shadows on the floor, in two steps so that a point is darkened once however many polygons cover it.
// Step one (every shadow polygon, standing or moving): the colour is left as it is and the buffer's alpha is set to ${(1 - SHADE).toFixed(2)};
// nothing is written where a cast already shades the floor. Step two (one sheet over the whole floor): colour = shadow ink
// * (1 - alpha) + colour * alpha, and alpha goes back to 1. Alpha is 1 everywhere else, so the sheet changes nothing there.
const VEIL_FS = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
${CAST_GLSL}
void main() {
  if (inShadow(vW, -1)) discard;
  gl_FragColor = vec4(0., 0., 0., ${(1 - SHADE).toFixed(2)});
}`;
const LAY_FS = /* glsl */`
uniform vec3 uDusk;
void main() { gl_FragColor = vec4(uDusk, 1.); }`;
// The shadow of a small thing on a mesa's top: the share of shadow ink laid over the top.
const OVER_FS = /* glsl */`
uniform vec3 uDusk;
varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
${CAST_GLSL}
void main() {
  if (inShadow(vW, int(floor(vId.x + 0.5)))) discard;
  gl_FragColor = vec4(uDusk, ${SHADE});
}`;
// Settling dust: a level annulus on the sand that opens once, in the ripple tone under the ink rule (so a cast shades it).
// aEdge 0 = inner rim, 1 = outer. aDust per instance: age 0..1 (x), start radius (y).
const DUST_VS = /* glsl */`
attribute float aEdge; attribute vec2 aDust;
uniform vec3 uFall;
varying vec3 vW; varying vec3 vN; varying vec3 vInk; varying vec2 vId;
void main() {
  float age = clamp(aDust.x, 0., 1.);
  float r = aDust.y + 16. * age * (2. - age) + aEdge * 5. * (1. - age) * step(0.001, age);
  vec4 w = modelMatrix * instanceMatrix * vec4(position.x * r, 0., position.z * r, 1.);
  vW = w.xyz; vN = vec3(0., 1., 0.); vInk = uFall; vId = vec2(-1., 0.);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

// ---------------------------------------------------------------- the style kit
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE;
  const palette = {};
  INK_NAMES.forEach((n, i) => { palette[n] = new THREE.Color(hex[i]); });
  const shadeOf = (c) => c.clone().lerp(palette.dusk, SHADE);          // the shaded tone of an ink
  const paleOf = (c) => c.clone().lerp(palette.sky, 0.35);             // a paler ink (the beds of the washes)
  palette.far = new THREE.Color(opts.far || '#B4A6CC');               // the pale blue-violet that far bodies go toward
  palette.straw = palette.ochre.clone().lerp(palette.sand, 0.42);     // the palest ring ink
  const FAR_SHARE = [0.3, 0.55, 0.78];
  const farOf = (c, k) => c.clone().lerp(palette.far, FAR_SHARE[Math.min(2, Math.max(0, k))]);   // the ink of a body in far layer k (0 nearest), fixed at build by place
  palette.sandShade = shadeOf(palette.sand);
  palette.ripple = palette.sand.clone().lerp(palette.ochre, 0.36);
  const v4s = (n) => Array.from({ length: n }, () => new THREE.Vector4(0, 0, 0, 0));
  const uniforms = {
    uSun: { value: SUN.clone() }, uDusk: { value: palette.dusk }, uTime: { value: 0 },
    uRingA: { value: v4s(NR) }, uRingB: { value: v4s(NR) }, uRingC: { value: v4s(NR) },
    uCylA: { value: v4s(NC) }, uCylB: { value: v4s(NC) }, uBoxC: { value: v4s(NB) }, uBoxH: { value: v4s(NB) },
    uGapA: { value: new THREE.Vector3() }, uGapB: { value: new THREE.Vector3() },
  };
  for (const v of uniforms.uRingB.value) v.set(0, 1, 0, 0);
  for (const v of uniforms.uBoxC.value) v.set(0, 0, 0, 1);
  const inkMat = (two, plain, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms }, vertexShader: INK_VS, fragmentShader: INK_FS,
    defines: plain ? { PLAIN: 1 } : {}, side: two ? THREE.FrontSide : THREE.DoubleSide, fog: false, toneMapped: false, ...extra,
  });
  const rock = inkMat(false, false);            // closed bodies: needles, rings, mesas, hoodoos, boulders
  const blade = inkMat(true, false);            // flats built as two faces back to back (builder.flat): each face shows from its own side only
  const plain = inkMat(false, true);            // the vertex ink and nothing else
  // A floor layer: same ink rule. The number given sets only how far the layer sits over the sand by polygon offset (0 sand, 1 wash,
  // 1.2 dune lees, 1.5 cracks, 1.6 the shade under a wash's bank); the order of drawing is each mesh's renderOrder. Layer 0 writes depth
  // (the buried parts of fallen rings must stay under it); the layers over it do not, and sit on it by polygon offset.
  const layers = new Map();
  const layer = (order, isPlain = false) => {
    const key = order + (isPlain ? 'p' : '');
    if (!layers.has(key)) layers.set(key, inkMat(false, isPlain, { depthWrite: order === 0, polygonOffset: order > 0, polygonOffsetFactor: -1 - order, polygonOffsetUnits: -2 - 2 * order }));
    return layers.get(key);
  };
  // The built shadow of a body that carries no cast (a boulder, a tuft of scrub, a far mesa, a bird): floor polygons drawn in
  // the opaque queue after the floor layers and before the bodies (renderOrder -3), then the one sheet (lay, renderOrder -2.5).
  const VEIL_BLEND = { transparent: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.ZeroFactor, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10 };
  const veil = new THREE.ShaderMaterial({ uniforms: { ...uniforms }, vertexShader: INK_VS, fragmentShader: VEIL_FS, side: THREE.DoubleSide, fog: false, toneMapped: false, ...VEIL_BLEND });
  // the same first step behind a vertex shader of the caller's own (the shadow of a thing that moves by uTime); it must write vW
  const veilWith = (vertexShader) => new THREE.ShaderMaterial({ uniforms: { ...uniforms }, vertexShader, fragmentShader: VEIL_FS, side: THREE.DoubleSide, fog: false, toneMapped: false, ...VEIL_BLEND });
  const lay = new THREE.ShaderMaterial({
    uniforms: { ...uniforms }, vertexShader: INK_VS, fragmentShader: LAY_FS, side: THREE.DoubleSide, fog: false, toneMapped: false,
    transparent: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstAlphaFactor, blendDst: THREE.DstAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.ZeroFactor, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12,
  });
  const veilOver = new THREE.ShaderMaterial({
    uniforms: { ...uniforms }, vertexShader: INK_VS, fragmentShader: OVER_FS, side: THREE.DoubleSide, fog: false, toneMapped: false,
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, polygonOffsetUnits: -10,
  });
  // The same ink rule behind a vertex shader of the caller's own (things that move by uTime). The vertex shader must write the
  // varyings vW (world position), vN (world normal), vInk and vId; more uniforms may be passed in o.uniforms (never in extra, which would replace the shared ones).
  // two: the geometry is two faces back to back, so each face is drawn from its own side only.
  const inkWith = (vertexShader, o = {}) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, ...(o.uniforms || {}) }, vertexShader, fragmentShader: INK_FS,
    defines: o.plain ? { PLAIN: 1 } : {}, side: o.two ? THREE.FrontSide : THREE.DoubleSide, fog: false, toneMapped: false, ...(o.extra || {}),
  });

  // The strata table: [y0, y1, ink name], level and the same across the valley.
  const bands = [];
  for (let y = 0, i = 0; y < BAND_TOP; i++) { const [h, ink] = BANDS[i % BANDS.length]; bands.push([y, y + h, ink]); y += h; }

  // Geometry builder: flat-shaded triangles carrying ink, a self id for the casts and a forced-shade mark.
  function builder() {
    const P = [], N = [], C = [], I = [];
    const b = {
      tris: 0,
      xf: null,                                 // optional Matrix4 (rotation and translation) applied to what follows
      tri(a, bb, c, ink, id = -1, shade = 0, nrm = null) {
        let nx, ny, nz;
        if (b.xf) {
          const e = b.xf.elements, ap = (v) => [e[0] * v[0] + e[4] * v[1] + e[8] * v[2] + e[12], e[1] * v[0] + e[5] * v[1] + e[9] * v[2] + e[13], e[2] * v[0] + e[6] * v[1] + e[10] * v[2] + e[14]];
          a = ap(a); bb = ap(bb); c = ap(c);
          if (nrm) nrm = [e[0] * nrm[0] + e[4] * nrm[1] + e[8] * nrm[2], e[1] * nrm[0] + e[5] * nrm[1] + e[9] * nrm[2], e[2] * nrm[0] + e[6] * nrm[1] + e[10] * nrm[2]];
        }
        if (nrm) { nx = nrm[0]; ny = nrm[1]; nz = nrm[2]; } else {
          const ux = bb[0] - a[0], uy = bb[1] - a[1], uz = bb[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx;
          const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        }
        P.push(a[0], a[1], a[2], bb[0], bb[1], bb[2], c[0], c[1], c[2]);
        for (let k = 0; k < 3; k++) { N.push(nx, ny, nz); C.push(ink.r, ink.g, ink.b); I.push(id, shade); }
        b.tris++;
      },
      // a, bb, c, d in order round the face, counter-clockwise seen from outside
      quad(a, bb, c, d, ink, id, shade, nrm) { b.tri(a, bb, c, ink, id, shade, nrm); b.tri(a, c, d, ink, id, shade, nrm); },
      // a flat seen from both sides: two faces back to back, each with its own normal (for the materials made with two)
      flat(a, bb, c, ink, id = -1) { b.tri(a, bb, c, ink, id, 0); b.tri(a, c, bb, ink, id, 0); },
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
        g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
        g.setAttribute('aInk', new THREE.Float32BufferAttribute(C, 3));
        g.setAttribute('aId', new THREE.Float32BufferAttribute(I, 2));
        g.computeBoundingSphere();
        return g;
      },
      mesh(material = rock) { const m = new THREE.Mesh(b.geometry(), material); m.matrixAutoUpdate = false; return m; },
    };
    return b;
  }

  // A standing body of level strata: one prism per band of the table between y0 and y1.
  // o: { x, z, y0, y1, sides, radius(y, ang) -> m, inset (m, how far a band steps in or out), key (number, picks the weathering),
  //      id (self id for the casts), screeId (self id of the scree bands, default id: -1 lets the body's own cast shade its scree), tint (fn(ink) -> ink: the far inks), coarse (bool: a thin seam is built as one with the bed below), talus (m: bands below it are sloped scree in the ripple tone), cap (m: the top band juts out),
  //      drift(y) -> [dx, dz] (optional: the body's centre wanders with height), shift (m: how far a band may sit out of line),
  //      eyes (m: no eye ever stands higher than this, so the level top of a band above it, which only an eye over it could see, is not built) }
  function strata(b, o) {
    const n = o.sides || 8, key = o.key || 0, inset = o.inset ?? 3, id = o.id ?? -1, sid = o.screeId ?? id, noise = o.noise || ctx.noise, eyes = o.eyes ?? Infinity;
    const outline = (bi, ya, yb, top, yEval) => {
      const sloped = yEval !== undefined, ym = sloped ? yEval : (ya + yb) / 2;
      // a thin band is soft and sits back, a thick one stands proud; a slow wander on top; the top band may jut as a cap
      const thin = bands[bi][1] - bands[bi][0] < 2;
      const off = sloped ? 0 : ((thin ? -0.45 : 0.12) + 0.55 * noise.n2(bi * 0.83 + key * 13.1, key * 7.7 + 0.5)) * inset + (top ? (o.cap || 0) : 0);
      const d = o.drift ? o.drift(ym) : null, sh = sloped ? 0 : (o.shift || 0);               // shift: each band sits a little out of line
      const cx = o.x + (d ? d[0] : 0) + noise.n2(bi * 1.7 + key * 3.3, 2.2) * sh, cz = o.z + (d ? d[1] : 0) + noise.n2(bi * 1.7 + key * 3.3, 9.4) * sh;
      const pts = [];
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2 + key;
        // ribs: the outline's wobble holds its bearing up the body and changes only slowly with height (vertical joints)
        const wob = noise.n2(Math.cos(ang) * 2.3 + key * 5.1, Math.sin(ang) * 2.3 + ym * 0.012) * inset * 0.7;
        const bite = sloped ? 0 : Math.max(0, noise.n3(Math.cos(ang) * 1.7 + key, Math.sin(ang) * 1.7, bi * 0.45 + key) - 0.4) * inset * 3;   // a block gone
        const r = Math.max(0.6, o.radius(ym, ang) + off + wob - bite);
        pts.push([cx + Math.cos(ang) * r, cz - Math.sin(ang) * r]);
      }
      pts.c = [cx, cz];
      return pts;
    };
    const up = [0, 1, 0], down = [0, -1, 0];
    // the rows to build: one per band between y0 and y1; on a coarse body (the far skyline) a thin seam is one row with the bed under it
    const rows = [];
    for (let bi = 0; bi < bands.length; bi++) {
      const ya = Math.max(o.y0, bands[bi][0]), yb = Math.min(o.y1, bands[bi][1]);
      if (yb - ya < 0.2) continue;
      const last = rows[rows.length - 1];
      if (o.coarse && last && bands[bi][1] - bands[bi][0] < 2 && !(o.talus && last.yb <= o.talus + 0.01)) last.yb = yb;
      else rows.push({ bi, ya, yb });
    }
    for (const row of rows) {
      const { bi, ya, yb } = row;
      const scree = o.talus && yb <= o.talus + 0.01;                    // scree: sloped faces in the ripple tone
      let ink = scree ? palette.ripple : palette[bands[bi][2]];
      if (o.tint) ink = o.tint(ink);
      const hi = scree ? outline(bi, ya, yb, false, yb) : outline(bi, ya, yb, yb >= o.y1 - 0.01);
      const lo = scree ? outline(bi, ya, yb, false, ya) : hi;
      for (let k = 0; k < n; k++) {
        const k2 = (k + 1) % n, p = lo[k], q = lo[k2], P2 = hi[k], Q2 = hi[k2];
        b.quad([p[0], ya, p[1]], [q[0], ya, q[1]], [Q2[0], yb, Q2[1]], [P2[0], yb, P2[1]], ink, scree ? sid : id, 0);
        if (!(yb > eyes)) b.tri([hi.c[0], yb, hi.c[1]], [P2[0], yb, P2[1]], [Q2[0], yb, Q2[1]], ink, scree ? sid : id, 0, up);
        if (ya > o.y0 && !scree) b.tri([lo.c[0], ya, lo.c[1]], [q[0], ya, q[1]], [p[0], ya, p[1]], ink, id, 0, down);
      }
    }
  }

  // A millstone ring, centred on the origin with its axis on +Y, in slabs about 3 m thick. Each slab is a wall over a recessed
  // groove 0.85 m tall and 1.5 m deep in the ink of the bed below, with a shoulder at its top edge that slopes back 1.7 m in its
  // last metre. The top 0.44 m of the groove is marked shaded (what a 1.5 m overhang keeps from a sun 16.5 degrees up); the rest
  // of it is told by its normal.
  // The top face carries furrows round the hole: sunk grooves that bare the next bed down, shaded where their own sunward wall shades them.
  // o: { R, r (hole radius), h (thickness), ink, id, key (number, picks chips and the slab out of line), half (bool: angles 0..PI, z <= 0),
  //      arc (share of the circle that stands, from angle 0: the rest is broken out), furrows (their count, where the caller sets it),
  //      furrowWide, furrowDeep (m; 1.6 and 0.5 where not given), notches ([[angle (rad), width (rad), depth (m)]]: bites through the whole thickness of the rim), sun ([x, y, z] toward the sun in the ring's own frame; default: the ring lies level and unturned),
  //      cut (bool: a stone fresh from the saw: every slab on the ring's own centre and no bite out of any rim),
  //      slabs ([from, to]: only these slabs are built, counted from the bottom, so that a thick ring can be made in two calls) }
  function ring(b, o) {
    const { R, r, h, ink } = o, id = o.id ?? -1, key = o.key || 0, noise = o.noise || ctx.noise;
    const sun = o.sun || [SUN.x, SUN.y, SUN.z], FW = o.furrowWide || 1.6, FD = o.furrowDeep || 0.5;     // toward the sun in the ring's own frame; a furrow's width and depth
    const dark = sun[1] <= 0 ? 1 : 0;                                   // the furrowed face is turned from the sun: the stone itself keeps the sun from every furrow, so their walls and floors are marked shaded
    const notches = o.notches || [];
    const seam = o.seam || (ink === palette.ochre ? palette.red : ink === palette.red ? palette.oxblood : palette.maroon);   // the bed under a slab, bared in the furrows and in the seam under each slab
    const ns = Math.max(1, Math.round(h / 3)), hs = h / ns;
    const nseg = Math.max(28, Math.min(72, Math.round(R * 1.3))), part = o.half ? 0.5 : (o.arc || 1), open = part < 1;   // open: the ring is an arc with two broken ends
    const span = Math.PI * 2 * part, n = Math.max(2, Math.round(nseg * part));
    const odd = Math.floor((noise.n2(key * 3.3, 1.7) * 0.5 + 0.5) * ns) % ns;          // the slab furthest out of line
    const up = [0, 1, 0], down = [0, -1, 0];
    const narrow = R - r < 13;                                          // a hoop: its top slab keeps its whole width so that its top face has room for one furrow
    const Rs = (s, a) => {
      // every slab sits a little off the ring's centre, one of them plainly; bites are taken out of the rim, most from the top slab
      const offA = key * 2.1 + s * 2.4, offR = ns > 1 && !o.cut ? (s === odd ? 1.7 : 0.35 + 0.45 * (noise.n2(s * 3.1 + key, 6.6) * 0.5 + 0.5)) : 0;
      // the courses show in the outline: every other slab stands 2.4 m back, counted from the top slab (on a hoop from the one under it)
      let x = R - (ns > 1 ? 0.9 : 0) - ((ns - 1 - s) % 2 === (narrow ? 1 : 0) && ns > 1 ? 2.4 : 0) + offR * Math.cos(a - offA);
      const chip = o.cut ? 0 : noise.n3(Math.cos(a) * 2.6 + key * 4.7, Math.sin(a) * 2.6, s * 0.8 + key) - (s === ns - 1 ? 0.3 : 0.48);
      if (chip > 0) x -= Math.min(R - r - 0.8, chip * 16) * 0.55;
      // a notch: a bite through every slab alike, deepest at its middle
      for (const [na, nw, nd] of notches) { const f = 1 - Math.abs(Math.atan2(Math.sin(a - na), Math.cos(a - na))) / (nw / 2); if (f > 0) x -= nd * Math.min(1, f * 1.6); }
      return Math.max(r + 0.9, x);
    };
    const P = (rad, a, y) => [Math.cos(a) * rad, y, -Math.sin(a) * rad];
    for (let s = o.slabs ? o.slabs[0] : 0; s < (o.slabs ? Math.min(ns, o.slabs[1]) : ns); s++) {
      const y0 = -h / 2 + s * hs, yg = y0 + 0.85, yk = yg - 0.44, y1 = y0 + hs;
      const j0 = open ? (noise.n2(s * 9.1 + key, 4.4) * 0.5 + 0.5) * 0.14 : 0, j1 = open ? (noise.n2(s * 6.7 + key, 8.8) * 0.5 + 0.5) * 0.14 : 0;
      const full = open || s === ns - 1, fullB = open || s === 0;
      for (let k = 0; k < n; k++) {
        const a = j0 + (k / n) * (span - j0 - j1), a2 = j0 + ((k + 1) / n) * (span - j0 - j1);
        const ra = Rs(s, a), rb = Rs(s, a2), ga = Math.max(r + 0.4, ra - 1.5), gb = Math.max(r + 0.4, rb - 1.5);
        b.quad(P(ga, a, y0), P(gb, a2, y0), P(gb, a2, yk), P(ga, a, yk), seam, id, 0);
        b.quad(P(ga, a, yk), P(gb, a2, yk), P(gb, a2, yg), P(ga, a, yg), seam, id, 1);
        b.quad(P(ga, a, yg), P(gb, a2, yg), P(rb, a2, yg), P(ra, a, yg), ink, id, 0, down);
        // the wall, then a shoulder sloping back 1.7 m in its last metre: on a level ring the shoulder is lit round the sunward two thirds of the rim and told shaded by its normal on the far third (on a leaning ring the share is another)
        const ys = y1 - 1, sa = Math.max(r + 0.5, ra - 1.7), sb2 = Math.max(r + 0.5, rb - 1.7);
        b.quad(P(ra, a, yg), P(rb, a2, yg), P(rb, a2, ys), P(ra, a, ys), ink, id, 0);
        b.quad(P(ra, a, ys), P(rb, a2, ys), P(sb2, a2, y1), P(sa, a, y1), ink, id, 0);
        const ti = full ? r : Math.max(r, Math.min(sa, sb2) - 14), bi = fullB ? r : Math.max(r, Math.min(ga, gb) - 14);
        // the top face of the stone carries furrows round the hole, about 8 m apart (a hoop carries one): each a groove 1.6 m wide sunk 0.5 m into the
        // bed below, with two upright walls told by their normals and a level floor in that bed's ink; the part of the floor the
        // sunward wall keeps the sun from (on a level ring up to the furrow's whole 1.6 m where the wall faces the sun square on) is marked shaded. A furrow stops where a bite has
        // been taken out of the rim.
        const nf = s === ns - 1 ? (o.furrows ?? Math.max(1, Math.round((R - r) / 8) - 1)) : 0;
        const fur = (f, ang) => narrow ? r + 0.42 * (R - r - 2.6 - FW) + 0.3 * Math.cos(ang * 2 + key)
          : r + (R - r - 3) * f / (nf + 0.6) + 0.9 * Math.cos(ang * 2 + key + f);
        const am = (a + a2) / 2, er = [Math.cos(am), 0, -Math.sin(am)], ei = [-er[0], 0, -er[2]], yf = y1 - FD;
        const reach = (ang) => sun[1] > 0.05 ? Math.min(FW, FD * Math.abs(sun[0] * Math.cos(ang) - sun[2] * Math.sin(ang)) / sun[1]) : FW;
        const outer = sun[0] * er[0] + sun[2] * er[2] > 0;                 // the sun stands beyond the outer wall here
        let inA = ti, inB = ti;
        for (let f = 1; f <= nf; f++) {
          const fa = fur(f, a), fc = fur(f, a2);
          if (Math.max(fa, fc) + FW > Math.min(sa, sb2) - 0.8 || Math.min(fa, fc) < ti + 0.5) break;
          b.quad(P(inA, a, y1), P(fa, a, y1), P(fc, a2, y1), P(inB, a2, y1), ink, id, 0, up);
          b.quad(P(fa, a, y1), P(fa, a, yf), P(fc, a2, yf), P(fc, a2, y1), ink, id, dark, er);
          const wa = reach(a), wc = reach(a2), ea = outer ? fa + FW - wa : fa + wa, ec = outer ? fc + FW - wc : fc + wc;
          b.quad(P(fa, a, yf), P(ea, a, yf), P(ec, a2, yf), P(fc, a2, yf), seam, id, dark || (outer ? 0 : 1), up);
          b.quad(P(ea, a, yf), P(fa + FW, a, yf), P(fc + FW, a2, yf), P(ec, a2, yf), seam, id, dark || (outer ? 1 : 0), up);
          b.quad(P(fa + FW, a, yf), P(fa + FW, a, y1), P(fc + FW, a2, y1), P(fc + FW, a2, yf), ink, id, dark, ei);
          inA = fa + FW; inB = fc + FW;
        }
        b.quad(P(inA, a, y1), P(sa, a, y1), P(sb2, a2, y1), P(inB, a2, y1), ink, id, 0, up);
        b.quad(P(bi, a, y0), P(ga, a, y0), P(gb, a2, y0), P(bi, a2, y0), ink, id, 0, down);
        b.quad(P(r, a2, y0), P(r, a, y0), P(r, a, y1), P(r, a2, y1), ink, id, 0);
      }
      if (open) {
        for (const [a, sgn] of [[j0, 1], [span - j1, -1]]) {
          const ra = Rs(s, a), nrm = [Math.sin(a) * sgn, 0, Math.cos(a) * sgn];
          b.quad(P(r, a, y0), P(ra, a, y0), P(ra, a, y1), P(r, a, y1), ink, id, 0, nrm);
        }
      }
    }
  }

  const style = {
    palette, shadeOf, paleOf, farOf, sun: SUN.clone(), sunUp: SUN_UP, sunBearing: SUN_BEARING, shadeMix: SHADE, bands, uniforms, coneId: CONE_ID, boxId: BOX_ID,
    freeRing: FREE_RING, gateRing: GATE_RING, quarryRing: QUARRY_RING, pieceRing: PIECE_RING, // the ring casts and self ids left to the world (pieceRing and the one after it)
    rock, blade, plain, layer, veil, veilWith, lay, veilOver, inkWith,
    builder, strata, ring,
    // where the sun throws a point's shadow on the level floor y = 0: [x, z]
    shadowOnFloor: (x, y, z) => [x - SUN.x * y / SUN.y, z - SUN.z * y / SUN.y],
    // the casts, in world space. Rings 0..13 and cones 0..11 belong to the hero; rings 14 to 18, the other cones and the boxes are the world's.
    setRing(i, c, axis, R, r, halfThick, halfDir) {
      uniforms.uRingA.value[i].set(c.x, c.y, c.z, R); uniforms.uRingB.value[i].set(axis.x, axis.y, axis.z, r);
      if (halfDir) uniforms.uRingC.value[i].set(halfDir.x, halfDir.y, halfDir.z, halfThick); else uniforms.uRingC.value[i].set(0, 0, 0, halfThick);
    },
    setCyl(i, x, z, y0, y1, r0, r1) { uniforms.uCylA.value[i].set(x, z, y0, y1); uniforms.uCylB.value[i].set(r0, r1, 0, 0); },
    // the piece broken out of ring 14: two world vectors in its plane; what lies on the far side of both throws no shadow
    setGap(a, b) { uniforms.uGapA.value.copy(a); uniforms.uGapB.value.copy(b); },
    setBox(i, cx, cy, cz, hx, hy, hz, turn = 0) { uniforms.uBoxC.value[i].set(cx, cy, cz, Math.cos(turn)); uniforms.uBoxH.value[i].set(hx, hy, hz, Math.sin(turn)); },
    update(dt, time) { uniforms.uTime.value = time; },
  };
  return style;
}


// ---------------------------------------------------------------- the near puzzle: three pegs, five graded rings, played on the clock
const PEGS = [L(92, 276), L(-52, 384), L(-196, 492)];                 // A, B, C: 180 m apart on one line
const NEAR = [                                                         // ring 0 (smallest) to 4: radius, thickness, speeds up/down and across, ink, the bed bared in its furrows
  { R: 17, h: 6, vUp: 26, vAcross: 52, ink: 'straw', seam: 'ochre' },
  { R: 22, h: 6, vUp: 23, vAcross: 46, ink: 'ochre', seam: 'red' },
  { R: 28, h: 9, vUp: 20, vAcross: 40, ink: 'red', seam: 'oxblood' },
  { R: 34, h: 9, vUp: 17, vAcross: 34, ink: 'oxblood', seam: 'maroon' },
  { R: 40, h: 12, vUp: 14, vAcross: 28, ink: 'maroon', seam: 'oxblood' },
];
const NN = NEAR.length, TOWER = (1 << NN) - 1;                         // rings, and the moves that carry a whole tower from one peg to the next
const NEAR_HOLE = 9.5, SEAT_Y = 13, LANE_Y = 100, PEG_GAP = 180, NEXT_AT = 6;
const NEAR_KEYS = [7.3, 21.9, 38.4, 52.6, 66.1];                       // the chips and the slab out of line of each near ring
const NEEDLE = { footR0: 17, footR1: 12.5, footY: SEAT_Y, r0: 8, r1: 4.7, top: 86 };
const smooth = (t) => t * t * (3 - 2 * t);
const easeIn = (t) => 1.5 * t * t - 0.5 * t * t * t;                  // from rest to 1.5 times the mean speed
const easeOut = (t) => 1 - easeIn(1 - t);
const sat = (t) => Math.min(1, Math.max(0, t));

// Plays the moves of one period from the tower standing on peg A: three towers' worth, A to C, C to B, B to A. Move k (from 1)
// moves ring ctz(((k - 1) mod TOWER) + 1) one step round: the largest ring and every second ring down from it go A, C, B, A;
// the others go A, B, C, A. Returns the moves with their times, the period and whether every move took a top ring and set it
// on nothing smaller.
function playPuzzle() {
  const stacks = [Array.from({ length: NN }, (_, i) => NN - 1 - i), [], []], moves = [];
  const topOf = (p) => SEAT_Y + stacks[p].reduce((s, r) => s + NEAR[r].h, 0);
  let t = 0, lawful = true;
  for (let k = 1; k <= 3 * TOWER; k++) {
    const n = ((k - 1) % TOWER) + 1;
    let ring = 0; while (!((n >> ring) & 1)) ring++;
    const from = stacks.findIndex((s) => s.includes(ring)), to = (from + ((NN - 1 - ring) % 2 === 0 ? 2 : 1)) % 3;
    const dst = stacks[to];
    if (stacks[from][stacks[from].length - 1] !== ring || (dst.length && dst[dst.length - 1] < ring)) lawful = false;
    stacks[from].pop();
    const yFrom = topOf(from), yTo = topOf(to), q = NEAR[ring];
    const touchEnd = k % TOWER === 0, touchStart = (k - 1) % TOWER === 0;   // the completed tower: the same ring lands and lifts at once
    const rise = (LANE_Y - yFrom) / q.vUp * (touchStart ? 1.5 : 1);
    const cross = Math.abs(to - from) * PEG_GAP / q.vAcross;
    const sink = (LANE_Y - yTo) / q.vUp * (touchEnd ? 1.5 : 1);
    moves.push({ k, ring, from, to, yFrom, yTo, t0: t, rise, cross, sink, end: t + rise + cross + sink, touchStart, touchEnd });
    dst.push(ring);
    if (touchEnd) t += rise + cross + sink;
    else {                                                              // the next lift starts when the underside is NEXT_AT m over its seat
      const want = 1 - NEXT_AT / (LANE_Y - yTo); let a = 0, b = 1;
      for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (smooth(m) < want) a = m; else b = m; }
      t += rise + cross + sink * a;
    }
  }
  const back = stacks[0].length === NN && stacks[0].every((r, i) => r === NN - 1 - i);
  // each ring's own moves in order, for the clock
  const byRing = Array.from({ length: NN }, (_, i) => moves.filter((m) => m.ring === i));
  return { moves, byRing, period: t, lawful: lawful && back };
}

// Where near ring i is at phase tm (0 <= tm < period). out: { x, y (underside), z, aloft (m over the seat it left or seeks; 200 while it crosses),
// landed (s since it last touched a seat), seatY, peg (where it last landed) }
function nearRingAt(table, i, tm, out) {
  const mine = table.byRing[i], period = table.period;
  let j = -1;
  for (let a = mine.length - 1; a >= 0; a--) if (mine[a].t0 <= tm) { j = a; break; }
  let shift = 0;
  if (j < 0) { j = mine.length - 1; shift = -period; }
  const m = mine[j], tau = tm - (m.t0 + shift), a = PEGS[m.from], b = PEGS[m.to];
  let x, y, z, aloft;
  if (tau < m.rise) {
    const e = (m.touchStart ? easeOut : smooth)(sat(tau / m.rise));
    x = a[0]; z = a[1]; y = m.yFrom + (LANE_Y - m.yFrom) * e; aloft = y - m.yFrom;
  } else if (tau < m.rise + m.cross) {
    const e = smooth(sat((tau - m.rise) / m.cross));
    x = a[0] + (b[0] - a[0]) * e; z = a[1] + (b[1] - a[1]) * e; y = LANE_Y; aloft = 200;
  } else {
    const e = (m.touchEnd ? easeIn : smooth)(sat((tau - m.rise - m.cross) / m.sink));
    x = b[0]; z = b[1]; y = LANE_Y - (LANE_Y - m.yTo) * e; aloft = y - m.yTo;
  }
  out.x = x; out.y = y; out.z = z; out.aloft = aloft;
  // the last landing of this ring: this move if it is over, else its move before (the last of the period before, at the start)
  let prev = m, pshift = shift;
  if (tau < m.rise + m.cross + m.sink) {
    if (j > 0) prev = mine[j - 1]; else { prev = mine[mine.length - 1]; pshift = shift - period; }
  }
  out.landed = tm - (prev.end + pshift); out.seatY = prev.yTo; out.peg = prev.to;
  return out;
}

// ---------------------------------------------------------------- the tall puzzle: three giants, stopped, their rings where the plan says
// Every figure below is a constant: the same needles, rings, places and poses on every seed and every visit. Their weathering
// comes from a noise made from the constant TALL_SEED, never from the visit's own.
const TALL_SEED = 7341;
// Giants G1, G2, G3: foot place (x, d), then the foot's radii and height, the shaft's radii and the top; then the constants of
// its weathering: key, waist (share of the height), tip, flat, flatA, bend (m), bendA.
const GIANTS = [
  { at: [80, 893.2], footR0: 26, footR1: 18, footY: 16, r0: 11, r1: 6, top: 200, key: 12.4, waist: 0.62, tip: 0.45, flat: 0.22, flatA: 0.9, bend: 2.2, bendA: 4.1 },
  { at: [376, 722.8], footR0: 32, footR1: 22, footY: 20, r0: 13.5, r1: 7, top: 260, key: 27.9, waist: 0.48, tip: 0.5, flat: 0.26, flatA: 2.2, bend: 2.8, bendA: 1.3 },
  { at: [396, 522], footR0: 29, footR1: 20, footY: 18, r0: 12, r1: 6.5, top: 230, key: 35.2, waist: 0.71, tip: 0.38, flat: 0.19, flatA: 0.3, bend: 2.5, bendA: 5.6 },
];
const TALL_PEGS = GIANTS.map((g) => L(g.at[0], g.at[1]));
const TALL_HOLE = 17;
const at = (x, d, y) => [x - OX, y, -(d - OD)];
// Constant poses. pos: the ring's centre at (x, d, y). lean: the plan bearing (degrees from the course toward +x) toward which
// its axis leans. tilt: degrees of that lean from upright. spin: degrees about its own axis. slot: its place among the ring casts.
// A half ring keeps the half on its local -z side; with spin = -lean its round rim is the low side.
// sieve (where given): the place whose circle the scatter's first sieve keeps clear for this ring; its own place is kept by the second (anchors.keepLater).
const TALL = [
  { j: 0, slot: 5, key: 4.1, R: 30, h: 9, ink: 'straw', seam: 'ochre', pos: at(376, 722.8, 24.5), lean: 0, tilt: 0, spin: 0 },            // level on G2's foot
  { j: 3, slot: 6, key: 23.8, R: 38, h: 9, ink: 'red', seam: 'oxblood', pos: at(377, 721.8, 36), lean: 250, tilt: 11, spin: 40 },        // the larger ring on the smaller, askew: it tries to lift and sinks back
  { j: 5, slot: 7, key: 29.3, R: 43, h: 12, ink: 'oxblood', seam: 'maroon', pos: at(399, 519, 120), lean: 215, tilt: 30, spin: 0 },  // caught askew on G3's shaft, its low rim to the south-west
  { j: 6, slot: 8, key: 33.6, R: 46, h: 15, ink: 'red', seam: 'oxblood', pos: at(282, 733, 177), lean: 288, tilt: 55, spin: 15 },    // hanging in the open air 95 m west of G2, its centre 177 m over the sand, above the way out, its top face tipped to the west
  { j: 7, slot: 9, key: 41.5, R: 50, h: 15, ink: 'maroon', seam: 'oxblood', pos: at(396, 522, 25.5), lean: 0, tilt: 0, spin: 0 },    // the widest, level on G3's foot
  { j: 4, slot: 10, key: 46.2, R: 40, h: 12, ink: 'ochre', seam: 'red', pos: at(54, 899, 38.2), lean: 262, tilt: 72, spin: 0, sieve: at(77.3, 867.9, 38.2) },   // on edge against G1's west side: a wheel 72 degrees from level, its furrowed face to the west
  { j: 2, slot: 11, key: 17.2, R: 36, h: 9, ink: 'red', seam: 'oxblood', half: true, pos: at(420, 770, 6), lean: 240, tilt: 28, spin: 120 },         // half, fallen north-east of G2: round rim buried, broken edge up
  { j: 2, slot: 12, key: 17.2, R: 36, h: 9, ink: 'red', seam: 'oxblood', half: true, pos: at(275.9, 669.2, 2.5), lean: 200, tilt: 14, spin: 160 },   // the other half, fallen south of the way out, its round rim buried
  { j: 1, slot: 13, key: 11.7, R: 33, h: 9, ink: 'ochre', seam: 'red', pos: at(330, 790, 7), lean: 300, tilt: 24, spin: 0 },             // fallen north-east of the way out, its north-west rim buried
];
const STIRS = { 3: 23, 5: 7, 6: 117 };                                   // the rings that stir, and the period (s) after which each one's pose repeats (6: 9 s and 13 s together)
const DEG = Math.PI / 180;
const AY = new THREE.Vector3(0, 1, 0);
const _ax = new THREE.Vector3(), _qs = new THREE.Quaternion();
function pose(out, lean, tilt, spin) {                                  // out = (upright to the leaning axis) * (spin about the axis)
  _ax.set(Math.sin(lean * DEG) * Math.sin(tilt * DEG), Math.cos(tilt * DEG), -Math.cos(lean * DEG) * Math.sin(tilt * DEG));
  out.setFromUnitVectors(AY, _ax); _qs.setFromAxisAngle(AY, spin * DEG);
  return out.multiply(_qs);
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts);
  const rng = ctx.rng, noise = ctx.noise, pal = style.palette, tallNoise = makeNoise(TALL_SEED);
  const group = new THREE.Group();
  const table = playPuzzle();

  // ---- six needles in one mesh: a banded foot, an eight-sided shaft. A near needle is weathered by the visit's draws, a giant
  // by its constants and the constant noise.
  const nb = style.builder();
  const needles = [];
  const addNeedle = (place, dims, slot, w, nz) => {
    const H = dims.top - dims.footY, big = dims.top / NEEDLE.top;
    style.strata(nb, {
      x: place[0], z: place[1], y0: 0, y1: dims.footY, sides: 18, key: w.key, inset: 1.5, shift: 0.7, id: CONE_ID + slot * 2, noise: nz,
      // the foot is the same strata as the shaft, stepping in bed by bed from a ragged plan on the sand and drawn in to the
      // shaft over its last metres
      radius: (y, ang) => {
        const f = y / dims.footY, lobes = nz.n2(Math.cos(ang) * 1.3 + w.key, Math.sin(ang) * 1.3) * 0.3;
        const body = dims.footR0 * 0.9 + (dims.footR1 - dims.footR0 * 0.9) * f, neck = sat((f - 0.8) / 0.2);
        return (body + (dims.r0 * 1.02 - body) * neck * neck) * (1 + (1 - f) * lobes);
      },
    });
    style.strata(nb, {
      x: place[0], z: place[1], y0: dims.footY, y1: dims.top, sides: 8, key: w.key + 3, inset: 1.15 * Math.sqrt(big), shift: 0.9, id: CONE_ID + 1 + slot * 2, noise: nz,
      // a crooked spire: its centre wanders by up to 1.4 times its bend, its section is a flattened octagon
      drift: (y) => { const f = (y - dims.footY) / H, d = w.bend * Math.sin(f * Math.PI * 1.5) * f * 1.4; return [Math.cos(w.bendA) * d, Math.sin(w.bendA) * d]; },
      radius: (y, ang) => {
        const f = (y - dims.footY) / H;
        const pinch = 1 - 0.16 * Math.exp(-((f - w.waist) * (f - w.waist)) / 0.01);            // one weathered waist, at its own height
        const point = 1 - w.tip * sat((f - 0.955) / 0.045);                                      // the last metres narrow to a broken tip
        return (dims.r0 + (dims.r1 - dims.r0) * f) * pinch * point * (1 - w.flat * Math.abs(Math.sin(ang - w.flatA))) * 1.05;
      },
    });
    needles.push({ place, dims, slot });
  };
  for (let i = 0; i < 3; i++) {
    addNeedle(PEGS[i], NEEDLE, i, { key: rng.range(1, 40), waist: rng.range(0.3, 0.8), tip: rng.range(0.35, 0.6), flat: rng.range(0.18, 0.3), flatA: rng.range(0, Math.PI), bend: rng.range(0.9, 1.6), bendA: rng.range(0, Math.PI * 2) }, noise);
    await ctx.yield();
  }
  for (let i = 0; i < 3; i++) { addNeedle(TALL_PEGS[i], GIANTS[i], 3 + i, GIANTS[i], tallNoise); await ctx.yield(); }
  group.add(nb.mesh(style.rock));
  await ctx.yield();

  // ---- the five near rings: one mesh each, moved by the clock; each its own ink, the smallest the palest
  const near = [];
  for (let i = 0; i < NN; i++) {
    const q = NEAR[i], b = style.builder();
    style.ring(b, { R: q.R, r: NEAR_HOLE, h: q.h, ink: pal[q.ink], seam: pal[q.seam], id: i, key: NEAR_KEYS[i] });
    const mesh = b.mesh(style.rock);
    group.add(mesh);
    near.push({ mesh, q, state: {} });
    await ctx.yield();
  }

  // ---- the tall rings: the three that stir get a mesh each, the rest lie in one; outlines from the constant noise
  const tb = style.builder(), tall = [], m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
  for (const q of TALL) {
    const moving = STIRS[q.j] !== undefined;
    const rec = { q, quat: pose(new THREE.Quaternion(), q.lean, q.tilt, q.spin), pos: new THREE.Vector3(...q.pos), mesh: null };
    const b = moving ? style.builder() : tb;
    if (!moving) b.xf = m4.compose(rec.pos, rec.quat, one);
    const own = style.sun.clone().applyQuaternion(rec.quat.clone().invert());     // toward the sun as this ring's constant pose sees it
    style.ring(b, { R: q.R, r: TALL_HOLE, h: q.h, ink: pal[q.ink], seam: pal[q.seam], id: q.slot, key: q.key, half: q.half, sun: [own.x, own.y, own.z], noise: tallNoise });
    if (moving) { rec.mesh = b.mesh(style.rock); rec.mesh.position.copy(rec.pos); rec.mesh.quaternion.copy(rec.quat); rec.mesh.updateMatrix(); group.add(rec.mesh); }
    tall.push(rec);
    await ctx.yield();
  }
  tb.xf = null;
  group.add(tb.mesh(style.rock));
  await ctx.yield();

  // ---- the dust that opens where a near ring settles: one flat annulus per ring, aged by the clock, on the sand round the
  // needle's foot, from the rim of the widest ring that sits on that needle
  const dg = new THREE.InstancedBufferGeometry(), dp = [], de = [];
  for (let k = 0; k < 56; k++) {
    const a = (k / 56) * Math.PI * 2, a2 = ((k + 1) / 56) * Math.PI * 2;
    const c0 = [Math.cos(a), 0, Math.sin(a)], c1 = [Math.cos(a2), 0, Math.sin(a2)];
    dp.push(...c0, ...c1, ...c1, ...c0, ...c1, ...c0); de.push(0, 0, 1, 0, 1, 1);
  }
  dg.setAttribute('position', new THREE.Float32BufferAttribute(dp, 3));
  dg.setAttribute('aEdge', new THREE.Float32BufferAttribute(de, 1));
  const dustAttr = new THREE.InstancedBufferAttribute(new Float32Array(2 * NN), 2);
  dg.setAttribute('aDust', dustAttr);
  const dust = new THREE.InstancedMesh(dg, style.inkWith(DUST_VS, { uniforms: { uFall: { value: pal.ripple } }, extra: { depthWrite: false } }), NN);
  dust.frustumCulled = false; dust.renderOrder = -3.5; dust.matrixAutoUpdate = false;   // after the floor's marks and before the built shadows (the veils, then the sheet), which darken it once like the sand
  const dustPlaces = dust.instanceMatrix;                 // the annuli's places, rewritten by the clock
  group.add(dust);

  // ---- a floor of its own (opts.floor, on unless the world lays one): level sand under the same casts
  if (opts.floor !== false) {
    const fb = style.builder(), S = 2600, cx = 250, cz = -280;
    fb.quad([cx - S, 0, cz + S], [cx + S, 0, cz + S], [cx + S, 0, cz - S], [cx - S, 0, cz - S], pal.sand, -1, 0, [0, 1, 0]);
    const floor = fb.mesh(style.layer(0)); floor.renderOrder = -6; group.add(floor);   // before the dust, as the world's own floor is
    await ctx.yield();
  }

  // ---- the clock. Every pose below is a function of the time given; nothing here reads the camera or a progress value.
  const c = new THREE.Vector3(), ax = new THREE.Vector3(), hd = new THREE.Vector3(), q4 = new THREE.Quaternion(), dm = new THREE.Matrix4();
  const TAU = Math.PI * 2;
  const tallPose = (rec, time, pos, quat) => {           // pose of a tall ring at this time; returns how far it is lifted (60 for the ring that hangs)
    const q = rec.q; pos.copy(rec.pos); let aloft = 0;
    if (q.j === 3) {                                      // it tries, shudders and sinks back: 23 s
      const p = time % 23;
      const lift = p < 4 ? 5 * smooth(p / 4) : p < 5.5 ? 5 + 0.3 * Math.sin((p - 4) / 1.5 * TAU * 4) : p < 8.5 ? 5 * (1 - smooth((p - 5.5) / 3)) : 0;
      pos.y += lift; pose(quat, q.lean, q.tilt - 4 * lift / 5, q.spin); aloft = lift;
    } else if (q.j === 5) pose(quat, q.lean, q.tilt + 2 * Math.sin(time / 7 * TAU), q.spin);     // it rocks: 7 s
    else if (q.j === 6) {                                 // it wavers (9 s) and bobs (13 s)
      aloft = 60;
      pos.y += 1.2 * Math.sin(time / 13 * TAU);
      pose(quat, q.lean, q.tilt + 3 * Math.sin(time / 9 * TAU), q.spin);
    } else quat.copy(rec.quat);
    return aloft;
  };
  function update(dt, time) {
    style.update(dt, time);
    group.updateWorldMatrix(true, false);
    const M = group.matrixWorld, tm = ((time % table.period) + table.period) % table.period;
    for (let i = 0; i < NN; i++) {
      const n = near[i], s = nearRingAt(table, i, tm, n.state);
      n.mesh.position.set(s.x, s.y + n.q.h / 2, s.z); n.mesh.updateMatrix();
      c.copy(n.mesh.position).applyMatrix4(M);
      style.setRing(i, c, AY, n.q.R, NEAR_HOLE, n.q.h / 2, null);
    }
    for (let i = 0; i < NN; i++) {
      const s = near[i].state, age = s.landed >= 0 && s.landed < 3 ? s.landed / 3 : 0, peg = PEGS[s.peg];
      let wide = near[i].q.R;
      for (let k = 0; k < NN; k++) if (near[k].state.peg === s.peg && near[k].q.R > wide) wide = near[k].q.R;
      dm.makeTranslation(peg[0], 0.3, peg[1]); dust.setMatrixAt(i, dm);
      dustAttr.setXY(i, age, wide);
    }
    dustPlaces.needsUpdate = true; dustAttr.needsUpdate = true;
    for (const rec of tall) {
      const q = rec.q; tallPose(rec, time, c, q4);
      if (rec.mesh) { rec.mesh.position.copy(c); rec.mesh.quaternion.copy(q4); rec.mesh.updateMatrix(); }
      ax.set(0, 1, 0).applyQuaternion(q4).transformDirection(M);
      if (q.half) hd.set(0, 0, -1).applyQuaternion(q4).transformDirection(M);
      c.applyMatrix4(M);
      style.setRing(q.slot, c, ax, q.R, TALL_HOLE, q.h / 2, q.half ? hd : null);
    }
    const e = M.elements;
    for (const n of needles) {
      const d = n.dims, x = n.place[0] + e[12], z = n.place[1] + e[14];
      style.setCyl(n.slot * 2, x, z, e[13], e[13] + d.footY, d.footR0, d.footR1);
      style.setCyl(n.slot * 2 + 1, x, z, e[13] + d.footY, e[13] + d.top, d.r0, d.r1);
    }
  }
  update(0, 0);

  // Where the rings are at a time, hero-local, for a clearance test: [{ x, y, z (centre), R, r, h, ax, flying, stirs }], the five
  // near rings first, then the tall ones in the order of the plan. stirs: the period (s) after which a tall ring's pose repeats, or 0.
  // only: where given, the place in that list of the one ring wanted; the other places are then left empty.
  const ringsAt = (time, only = -1) => {
    const tm = ((time % table.period) + table.period) % table.period, out = [], s = {}, p = new THREE.Vector3(), qq = new THREE.Quaternion();
    for (let i = 0; i < NN; i++) { if (only >= 0 && only !== i) { out.push(null); continue; } nearRingAt(table, i, tm, s); out.push({ x: s.x, y: s.y + NEAR[i].h / 2, z: s.z, R: NEAR[i].R, r: NEAR_HOLE, h: NEAR[i].h, ax: [0, 1, 0], flying: s.aloft > 0, stirs: 0 }); }
    for (const rec of tall) {
      if (only >= 0 && only !== out.length) { out.push(null); continue; }
      const a = tallPose(rec, time, p, qq), u = new THREE.Vector3(0, 1, 0).applyQuaternion(qq);
      out.push({ x: p.x, y: p.y, z: p.z, R: rec.q.R, r: TALL_HOLE, h: rec.q.h, ax: [u.x, u.y, u.z], flying: rec.q.j === 6 || a > 0, stirs: STIRS[rec.q.j] || 0, half: !!rec.q.half });
    }
    return out;
  };
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const anchors = {
    place: new THREE.Vector3(OX, 0, -OD),
    pegs: PEGS.map((p) => new THREE.Vector3(p[0], 0, p[1])), tallPegs: TALL_PEGS.map((p) => new THREE.Vector3(p[0], 0, p[1])),
    needle: NEEDLE, giants: GIANTS.map((g) => ({ footR0: g.footR0, footY: g.footY, r0: g.r0, top: g.top })),
    needleTop: NEEDLE.top, tallNeedleTop: Math.max(...GIANTS.map((g) => g.top)),
    // the way out: the end of the world's flown line, 80 m up in the open air about 111 m west of the tallest giant, facing back
    // along the line's last straight (plan bearing 119 degrees)
    portalSeat: { position: V(at(264.98, 716.34, 80)), facing: new THREE.Vector3(-Math.sin(119 * Math.PI / 180), 0, Math.cos(119 * Math.PI / 180)), radius: 16 },
    // the lanes of the near rings: each rises and sinks upright over a needle (underside between seatY and laneY) and crosses level
    // between needles with its underside at laneY
    lane: { underside: LANE_Y, seatY: SEAT_Y, from: V(at(92, 276, LANE_Y)), to: V(at(-196, 492, LANE_Y)), rings: NEAR.map((q) => ({ R: q.R, h: q.h })) },
    keepOut: [
      ...needles.map((n) => ({ x: n.place[0], z: n.place[1], r: n.dims.footR0 + 12 })),
      { x: PEGS[0][0], z: PEGS[0][1], r: 52 }, { x: PEGS[1][0], z: PEGS[1][1], r: 52 }, { x: PEGS[2][0], z: PEGS[2][1], r: 52 },
      ...TALL.filter((q) => q.pos[1] < 60).map((q) => ({ x: (q.sieve || q.pos)[0], z: (q.sieve || q.pos)[2], r: q.R + 12 })),
    ],
    keepLater: TALL.filter((q) => q.sieve).map((q) => ({ x: q.pos[0], z: q.pos[2], r: q.R + 8 })),
  };
  return {
    object: group, radius: 210, height: 150, center: new THREE.Vector3(0, 60, 0), anchors, style,
    period: table.period, lawful: table.lawful, moves: table.moves, ringsAt,
    update, dispose() { dust.dispose(); if (!opts.style) { style.blade.dispose(); style.plain.dispose(); style.veil.dispose(); style.lay.dispose(); style.veilOver.dispose(); } },
    ground: opts.floor === false, groundY: 0,
  };
}
