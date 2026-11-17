// THE ONE-BIT MOON: hero set piece and style kit for the world "one-bit-moonrise".
// Two inks and no grey. The hero is the moon and what crosses it: the sky dome (solid black, 2 px stars,
// the 30 degree disc with stair-stepped maria, thick-air bands, three cloud bars), the sea drawn by the same
// dome shader (rows of white dashes, the road wedge whose dashes join into a white core with black dashes),
// four far islands cut out of the moon's foot, a fleet of 200 luggers and 5,000 terns drawn by exclusive-or.
//
// LOCAL FRAME: origin = the road's apex on the water, the road and the moon lie down -Z, +Y up, front +Z.
//   On the brief's map: object.position.set(19, 0, 123); object.rotation.y = Math.PI + 12 deg  (anchors.placement).
//   Do not mirror the object (negative scale): hulls drop their back faces by winding.
//   Sky, sea, stars and rows are computed in WORLD space from the object's matrix, so rows always run along world X.
//
// buildHero(ctx, opts) -> { object, radius 50, height 10 (viewer framing only: the piece is sky-sized), center,
//   anchors, style, setProgress(u), update(dt, time, camera), dispose(), ground: false }
//   opts: style (a shared makeStyle instance), palette (6 hex, brief order), colourway 'bone'|'amber'|'green' (seeded),
//     negative (the "day" plate), crescent, detail 0.6..1 (thins fleet and terns), density, duration (42),
//     sky: false (do not add the dome and the depth disc), cast 'lug'|'lateen' (seeded), slant (deg), crossing (Vector3,
//     where the lane meets the road), width (120 m, the lane's), speed (6), clear (11 m: boats slide aside to stay this far from the camera),
//     crest ([[x,y,z],...] local points of the skerry's crest, the end the wave starts at first), liftAt (18 s),
//     ternHeading, ternHeight (80), strandPoint (local point the strand of sixty passes, default 10 m over the stem
//     at 25 s), strandAt (25), strandScale (1: the size of the sixty that pass close), ternCount (5000), ternRadius
//     (12 m, the ribbon's half thickness), ternTail (0: the share of birds that keep leaving the crest for ternTailFor
//     seconds after the wave), ternWave (3 s: how long the release runs along the crest), ternPx (6.6: the least size of a
//     flying bird in pixels), ternBig (0: birds on the near edge drawn 2 to 3 times larger), strandCount, thin ([from, to] along the lane: four boats in five sail only this stretch and go under
//     where it ends, so the far road and the islands stay readable; default [0, 330]), length (760, the lane's),
//     astern (60: how far before the crossing the lane starts), keep ([from, to] along the lane: with speed 0, the only boats that exist), allThin (every boat keeps to `thin`), ribFar (170 m),
//     stragglers ({ slant, crossing, length, width, speed, place: [[along, across], ...], thin }: a second lane of a
//     few hand-placed boats of the same cast).
//     (polish 5) fleetCount (200), boatScale (1: the fleet's size). (true 2) The fleet and the terns are two passes on
//     one geometry: exclusive-or off the moon's disc (two sails that overlap flip back), one solid ink on it (black, or
//     white on the crescent's plate), the limb their hard edge. (true 1) The sea has no light that follows the eye: the road is pinned to the map.
//     fleetShift (0): metres the fleet's whole pattern is set down the lane (its five files are staggered so they interleave).
//     (true 1, round 2) THE STRAND IS STRUNG OUT: strandExtra (0: birds added to the strand beyond those in ternCount, sixty at
//     most in all, drawn from a stream of their own so the ribbon is unchanged by them), strandFrom (0.5: where on the crest
//     the strand sits), strandPerch (0.1: it sits a tenth of the crest either side of that), strandWindow ([-2.5, 2.5]: the
//     seconds about strandAt over which the sixty reach strandPoint, in order), strandRadius (9 m, its tube), strandVia (two
//     local points: the middle of its track, so it need not fly straight at the eye), strandPx (ternPx: the least size of a
//     flying bird of the strand; a strand bird is its own size or this, whichever is larger, never both multiplied).
//   Beyond 170 m a boat is hull and sail only (its mast and yard ribbons are dropped at that distance, not faded).
//   Terns are flat cut-outs that always face the viewer (never edge-on): exclusive-or off the disc, solid ink on it, like every figure.
//   The far islands are terraced cut-outs: a level top, one sheer step, a shelf; each wider than it is tall.
//   setProgress(u): u = 0..1 along the path. Keys the moon's height (-1 to +9.5 degrees), the terns' release (18 s of 42),
//     their flight and the strand. Call it every frame; if it is never called the piece loops on its own clock (viewer).
//   update(): call every frame with the camera it is drawn by (reads camera.matrixWorld only).
//   anchors (local): placement, roadApex, roadAxis, flyThrough (the brief's path at eye height, entry to arch),
//     portalSeat { position, facing } (the arch in the skerry; build the arch around it), viewpoints { entry, reveal,
//     core, ternsOverhead, bearAway }, islands [{ position, halfWidth, height }], fleetLane { origin, direction, normal,
//     length, width, speed, cast, count }, terns { crest, liftAt, wave, speed, strandPoint, strandAt, splines, count },
//     moonElevationAt(u).
//   Cost: about 83k triangles (terns 55k, fleet 26k), 7 draw calls (sky, depth disc, islands, fleet twice, terns twice: true 2), build
//     about 60 ms, no lights, one 48x48 texture.
//
// makeStyle(ctx, opts) -> the style, shared by the hero and everything the world adds (takes one draw from ctx.rng):
//   palette { black, white, amberBlack, amber, greenBlack, green, K, W }: linear Colors; K and W are the two inks in use.
//   uniforms: shared; update(dt, time, camera) drives uTime and the cloud bars; hook(renderer, scene, camera) is the
//     sky's onBeforeRender and sets uPx (pixels per unit tangent of the buffer being drawn) and the moon's 96/48 grid.
//   glsl (OB_GLSL): obBayer, obPat(uv, tone, fwidth(uv)), obHash, obInk(0|1) for any further ShaderMaterial.
//   ink(white?)            flat K or W. Far land, cut-outs.
//   land({cell, dust, step}) facets take 0/25/50/75/100 from their normal against uMoonDir (55 to 100 degrees), pattern
//                          pinned to the facet's plane in 0.1 m cells, solid when a cell is under 3 px, dust on black.
//                          An optional attribute aCell (one value per facet, on its three corners) sets that facet's cell.
//                          Geometry must be non-indexed with face normals (flat varyings). step = shadow, steps down.
//                          land({course, joints}) (polish 1): drawn stone courses `course` metres high on the standing faces, the
//                          face's own ink reversed along bed joints (and staggered upright joints with joints: 1); dropped under 7 px.
//                          (polish 2) dark: how seldom a black face draws a bed joint (0.84: a stroke here and there; 0.5: every other);
//                          joints: 2 draws upright joints on black faces too. (polish 4) courseDist: metres within which courses are drawn (default: any).
//                          ribbon(): a point may carry its own half width as a fourth number ([x, y, z, hw]).
//   pattern(tone, [cellsU, cellsV]) one tone on uv cells (a shadow on a deck: the deck's tone one step down).
//   figure({side})         exclusive-or: (K + W) - destination. Anything that travels. Draws after opaque, no depth write.
//                          figure({gate: true}) / line({figure: true, gate: true}) are not drawn across the arch given to
//                          setGate(foot, normal, halfWidth, crown): the exit opening eats our own boat along a hard edge.
//   line({figure, black}) + ribbon(lines, halfWidth): camera-facing ribbons that never drop under 1.5 px (keylines, stays).
//   makeSky() the dome (sky and sea picture), makeSeaDepth() a depth-only disc that hides what hangs under the water.
//   setMoon(azimuth, elevation), setRoad(x, z, azimuth): world space; the hero calls both every frame.
// Assumed post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
// style 'none', no fog, no lights. Colours are exact palette values, not pre-corrected; nothing exceeds 1.
import * as THREE from 'three';

const DEG = Math.PI / 180;
const BRIEF_PALETTE = ['#0B0B10', '#F3F0E6', '#1A0F02', '#FFB648', '#06140C', '#9CF5B0'];

// ---------------------------------------------------------------------------------------------
// The one GLSL chunk every surface shares. ink = step(bayer4(cell), tone); nothing in it knows
// about time or the screen: `uv` is a coordinate pinned to the surface, one unit per cell.
// obPat(uv, tone, fw): fw = fwidth(uv) taken by the caller (or 1/pixels-per-cell). Cells under
// 3 px round the tone to solid ink; cell edges get a one-pixel ramp, the only in-between values.
// ---------------------------------------------------------------------------------------------
export const OB_GLSL = /* glsl */`
uniform vec3 uK; uniform vec3 uW; uniform float uPx;
float obB2(vec2 v){ return fract(v.x * 0.5 + v.y * v.y * 0.75); }
float obBayer(vec2 c){ vec2 p = mod(c, 4.0); vec2 q = floor(p * 0.5); vec2 r = p - 2.0 * q; return obB2(q) * 0.25 + obB2(r) + 0.03125; }
float obCell(vec2 c, float tone){ return step(obBayer(c), tone); }
float obPat(vec2 uv, float tone, vec2 fw){
  float f = max(max(fw.x, fw.y), 1e-5);
  if (f > 0.3333) return step(0.5, tone);
  if (tone <= 0.0) return 0.0;
  if (tone >= 1.0) return 1.0;
  vec2 g = fract(uv) - 0.5;
  vec2 s = floor(uv) + 0.5 + sign(g) * clamp((abs(g) - 0.5 + fw * 0.5) / max(fw, vec2(1e-5)), 0.0, 0.5);
  vec2 b = floor(s - 0.5); vec2 w = s - 0.5 - b;
  float i00 = obCell(b, tone), i10 = obCell(b + vec2(1.0, 0.0), tone), i01 = obCell(b + vec2(0.0, 1.0), tone), i11 = obCell(b + vec2(1.0, 1.0), tone);
  return mix(mix(i00, i10, w.x), mix(i01, i11, w.x), w.y);
}
float obHash(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec3 obInk(float i){ return mix(uK, uW, clamp(i, 0.0, 1.0)); }
`;

// A camera-facing ribbon: position = centre line, aTan = tangent, aSide = -1/+1, aW = half width (m).
// It is widened in the vertex shader so it never drops under 1.5 px.
const RIBBON_VERT = /* glsl */`
uniform float uPx; attribute vec3 aTan; attribute float aSide; attribute float aW;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 t = mat3(modelViewMatrix) * aTan; t = t / max(length(t), 1e-5);
  vec3 v = mv.xyz / max(length(mv.xyz), 1e-5);
  vec3 s = cross(t, v); s = s / max(length(s), 1e-4);
  float hw = max(aW, 0.78 * max(-mv.z, 0.0) / max(uPx, 1.0));
  mv.xyz += s * aSide * hw;
  gl_Position = projectionMatrix * mv;
}`;

const LAND_VERT = /* glsl */`
uniform vec3 uMoonDir; uniform float uStep; uniform float uCell;
attribute float aCell;                                   // metres per cell, one value per facet (0 or absent: the material's uCell)
flat varying float vTone; flat varying vec3 vN; flat varying float vCell; varying vec3 vWp;
void main(){
  vCell = aCell > 0.0 ? aCell : uCell;
  vec3 n = mat3(modelMatrix) * normal; n = n / max(length(n), 1e-5);
  float c = dot(n, uMoonDir);
  float tone = c > 0.5736 ? 1.0 : (c > 0.342 ? 0.75 : (c > 0.0872 ? 0.5 : (c > -0.1736 ? 0.25 : 0.0)));
  vTone = max(tone - uStep * 0.25, 0.0); vN = n;
  vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const LAND_FRAG = /* glsl */`
uniform float uDust; uniform vec2 uCourse; uniform float uDark; uniform float uCourseDist;
flat varying float vTone; flat varying vec3 vN; flat varying float vCell; varying vec3 vWp;
${OB_GLSL}
void main(){
  vec3 a = abs(vN);
  vec2 uv = (a.y > a.x && a.y > a.z) ? vWp.xz : ((a.x > a.z) ? vWp.zy : vWp.xy);
  float cs = max(vCell, 1e-3);
  uv /= cs;
  vec2 fw = fwidth(uv);
  float ink = obPat(uv, vTone, fw);
  // dust on the plate: a few stray white squares (0.4 m) on black land, only where one is a clear 3 px
  vec2 dc = floor(uv * cs * 2.5); vec2 dfw = fw * cs * 2.5;
  if (max(dfw.x, dfw.y) < 0.3333 && vTone <= 0.0 && obHash(dc) < uDust) ink = 1.0;
  // courses (uCourse.x metres high; 0: none): drawn joints on the standing faces, the face's own ink reversed along a line
  // never under 1.5 px, and dropped whole where a course is under 7 px. On a white face every bed joint and staggered
  // upright joints (uCourse.y); on a black face only a stroke here and there. Pinned to the rock, no time in it.
  float ch = max(uCourse.x, 1e-3);
  float cy = vWp.y / ch + 0.37, row = floor(cy);
  float al = ((a.x > a.z) ? vWp.z : vWp.x) / (ch * 2.7) + 0.5 * mod(row, 2.0) + 0.35 * obHash(vec2(row, 7.0));
  float fy = max(fwidth(vWp.y) / ch, 1e-5), fa = max(fwidth(al), 1e-5);
  if (fy > 0.5) fa = 1.0;                                                     // a row boundary inside this pixel's neighbourhood
  vec3 cd = vWp - cameraPosition;
  if (uCourse.x > 0.0 && a.y < 0.6 && (vTone <= 0.0 || vTone >= 1.0) && fy < 0.143 && dot(cd, cd) < uCourseDist * uCourseDist) {
    float dj = min(fract(cy), 1.0 - fract(cy)), da = min(fract(al), 1.0 - fract(al));
    float seg = obHash(vec2(row, floor(al)));
    bool bed = dj < max(0.05 / ch, 0.8 * fy) && (vTone >= 1.0 ? seg > 0.12 : seg > uDark);
    bool up = uCourse.y > 0.5 && fa < 0.06 && da < max(0.05 / (ch * 2.7), 0.8 * fa) && (vTone >= 1.0 ? obHash(vec2(row, floor(al))) > 0.2 : (uCourse.y > 1.5 && obHash(vec2(row + 3.0, floor(al))) > 0.5));
    if (bed || up) ink = 1.0 - ink;
  }
  gl_FragColor = vec4(obInk(ink), 1.0);
}`;

const FLAT_VERT = /* glsl */`void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const PAT_VERT = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const INK_FRAG = /* glsl */`uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0); }`;
const XOR_FRAG = /* glsl */`uniform vec3 uK; uniform vec3 uW; void main(){ gl_FragColor = vec4(uK + uW, 1.0); }`;
// The gate: an arch standing in the world (the exit opening). A gated figure is not drawn where the view ray through
// it goes on through that arch, so the opening eats the figure along a hard edge instead of inverting what lies beyond.
// uGateP = the foot of the arch's centre line, uGateN = its horizontal normal, uGateDim = (half width, crown height).
export const OB_GATE_GLSL = /* glsl */`
uniform vec3 uGateP; uniform vec3 uGateN; uniform vec2 uGateDim;
bool obGated(vec3 wp){
  vec3 rd = wp - cameraPosition; float dn = dot(rd, uGateN);
  if (abs(dn) < 1e-5) return false;
  float t = dot(uGateP - cameraPosition, uGateN) / dn;
  if (t < 1.0) return false;
  vec3 h = cameraPosition + rd * t - uGateP;
  if (h.y < 0.0) return false;                                  // under the sill is the sea in front of the arch
  float a = h.x * uGateN.z - h.z * uGateN.x, yc = uGateDim.y - uGateDim.x;
  return h.y > yc ? (a * a + (h.y - yc) * (h.y - yc) < uGateDim.x * uGateDim.x) : abs(a) < uGateDim.x;
}`;
const GATE_VARY = 'varying vec3 vGw;\nvoid main(){ vGw = (modelMatrix * vec4(position, 1.0)).xyz;';
const XOR_GATE_FRAG = /* glsl */`uniform vec3 uK; uniform vec3 uW; varying vec3 vGw;${OB_GATE_GLSL}
void main(){ if (obGated(vGw)) discard; gl_FragColor = vec4(uK + uW, 1.0); }`;
const PAT_FRAG = /* glsl */`uniform float uTone; uniform vec2 uCells; varying vec2 vUv;
${OB_GLSL}
void main(){ vec2 c = vUv * uCells; gl_FragColor = vec4(obInk(obPat(c, uTone, fwidth(c))), 1.0); }`;

// exclusive-or: result = (W + K) - destination. Exact in the HDR buffer, needs no sorting.
const XOR_BLEND = {
  transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending,
  blendEquation: THREE.SubtractEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
};

// ---------------------------------------------------------------------------------------------
// SKY + SEA: one dome shader, analytic in the view direction. Above the horizon: hashed 2 px
// stars, the disc (maria from a 48x48 tone map sampled nearest, cells that ride with the disc),
// the two thick-air bands fixed to the horizon, three cloud bars as exclusive-or. Below it the
// ray is dropped onto the plane y = uSeaY and the sea is drawn there: rows of dashes pinned to
// the water, the road wedge, the core with its inks swapped.
// ---------------------------------------------------------------------------------------------
const SKY_VERT = /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;                                   // world directions, whatever the dome is parented to
  vec4 p = projectionMatrix * viewMatrix * vec4(cameraPosition + vDir, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`;
const SEA_GLSL = /* glsl */`
uniform vec2 uApex; uniform vec2 uRoadDir; uniform float uTime; uniform vec2 uRoadTan; uniform float uRoadOn; uniform float uRoadNear;
const float OB_ROW = 1.6; const float OB_DASH = 5.0;
// the road's angular coordinate at a point of the water: 0 on the axis, uRoadTan.y at the core's edge, uRoadTan.x at the fringe's
float obWedge(vec2 q){
  vec2 v = q - uApex;
  float al = dot(v, uRoadDir), ac = abs(dot(v, vec2(uRoadDir.y, -uRoadDir.x)));
  float tt = al > max(uRoadNear, 0.5) ? ac / al : 9.0;                       // uRoadNear: the road is laid toward us dash by dash
  return mix(9.0, tt, uRoadOn);
}
// (polish 2) light on water: inside the core's edge the joined dashes of every row swell, a needle that thickens toward
// the axis until the rows meet. Each row reaches as far as it likes (the hand), so the road's edge is a comb of strokes,
// never a block. T: the tier of rows drawn (spacing OB_ROW * 2^T); grow: 0.25 to 0.5 of that spacing; pull: the tier
// that is about to drop out draws its strokes back into the white.
float obStroke(vec2 p, float fz, float T, float grow, float pull){
  float RS = OB_ROW * exp2(T);
  float r = floor(p.y / RS + 0.5), dz = abs(p.y - r * RS);
  float c = max(uRoadTan.y, 1e-4);
  float rid = r * exp2(T);
  float tt = obWedge(p) + (obHash(vec2(rid, 3.7)) - 0.5) * 0.5 * c + pull * 0.75 * c;
  // (true 1) the sea has one motion: the 7 s wave travelling along the row. A joined row is a dash like any other, and
  // its end lengthens and shortens on that same wave (the row's own phase, the same 45 m wave as its dashes).
  tt += 0.15 * c * sin(6.2831853 * (p.x / 45.0 - uTime / 7.0) + obHash(vec2(rid, 7.5)) * 6.2831853);
  if (tt >= c) return 0.0;
  float s = clamp((c - tt) / (0.45 * c), 0.0, 1.0);
  float hw = mix(max(0.09, 0.78 * fz), grow * RS + fz, s * s);
  return clamp((hw - dz) / fz + 0.5, 0.0, 1.0);
}
float obSea(vec2 p, vec2 fwp){
  float fz = max(fwp.y, 1e-4), fx = max(fwp.x, 1e-4);
  float rz = p.y / OB_ROW; float r = floor(rz + 0.5); float dzm = (rz - r) * OB_ROW;
  float L = 0.0;
  if (mod(r, 2.0) < 0.5) L = 1.0;
  if (mod(r, 4.0) < 0.5) L = 2.0;
  if (mod(r, 8.0) < 0.5) L = 3.0;
  if (mod(r, 16.0) < 0.5) L = 4.0;
  if (mod(r, 32.0) < 0.5) L = 5.0;
  if (mod(r, 64.0) < 0.5) L = 6.0;
  float vis = clamp((OB_ROW * exp2(L) / fz - 4.0) * 0.5, 0.0, 1.0);      // rows drop out in fixed tiers, dashes shortening to nothing
  vis *= clamp((OB_DASH / fx - 3.0) * 0.5, 0.0, 1.0);
  float o = obHash(vec2(r, 1.5)) * OB_DASH;
  float xx = (p.x + o) / OB_DASH; float i = floor(xx); float u = xx - i - 0.5;
  float ph = obHash(vec2(r, 7.5)) * 6.2831853;
  float wv = sin(6.2831853 * ((i + 0.5) * OB_DASH / 45.0 - uTime / 7.0) + ph);
  float f0 = (0.25 + 0.10 * wv) * (0.88 + 0.24 * obHash(vec2(i, r)));
  float c = max(uRoadTan.y, 1e-4);
  float tc = obWedge(vec2((i + 0.5) * OB_DASH - o, r * OB_ROW)) + (obHash(vec2(i * 0.37 + 3.0, r)) - 0.5) * 0.012;   // the hand: the wedge's edges are not ruled
  float g = clamp((uRoadTan.x - tc) / max(uRoadTan.x - uRoadTan.y, 1e-4), 0.0, 1.0);
  float f = mix(f0, 1.0, g * g * (3.0 - 2.0 * g)) * vis;                    // the fringe: the dashes lengthen until they join
  float covx = f >= 0.985 ? 1.0 : (f <= 0.002 ? 0.0 : clamp((f * 0.5 - abs(u)) * OB_DASH / fx + 0.5, 0.0, 1.0));
  float hw = max(0.09, 0.78 * fz);                                         // rows are 0.18 m thick, never under 1.5 px
  float covz = clamp((hw - abs(dzm)) / fz + 0.5, 0.0, 1.0);
  float ink = covx * covz;
  // the core: the joined rows swell until they meet. Two tiers of rows are drawn, the finer one withdrawing as it closes up
  // Only every fourth row swells (tongues of light 6.4 m apart): we sail across the rows at ten metres a second, and
  // a comb of every row would flip under the eye six times a second; these pass at under two.
  float lv = max(log2(max(4.0 * fz / OB_ROW, 1.0)), 2.0), T0 = floor(lv), k = clamp((lv - T0) * 2.0, 0.0, 1.0);
  float gw = mix(0.37, 0.5, clamp(fz / 0.8 - 0.5, 0.0, 1.0));
  ink = max(ink, max(obStroke(p, fz, T0 + 1.0, 0.5 * gw * (1.0 + k), 0.0), obStroke(p, fz, T0, gw, k)));   // (polish 4) near the eye the swollen rows stop short of meeting: bands of light with a black thread between, never one blank sheet
  // deep in the core the sea is white and its dashes are black, growing from nothing
  float fb = (0.2 + 0.06 * wv) * (0.8 + 0.4 * obHash(vec2(i, r + 5.0))) * vis * clamp((0.97 * c - tc) / (0.12 * c), 0.0, 1.0);   // (polish 4) the white water is never blank: its black dashes run out to the comb (polish 5: right out to it). (true 1) thinned toward the brief's "fraction 0.1 to 0.2": 0.11 to 0.31, mean 0.2 (it was 0.29 to 0.82)
  float cbx = fb <= 0.002 ? 0.0 : clamp((fb * 0.5 - abs(u)) * OB_DASH / fx + 0.5, 0.0, 1.0);
  float hwb = max(0.15, 0.78 * fz);                                       // (polish 5) on the white the black dashes are strokes a hand wide: near the eye the road is hatched, not a blank sheet
  float covb = clamp((hwb - abs(dzm)) / fz + 0.5, 0.0, 1.0);
  return step(0.5, min(ink, 1.0 - cbx * covb));                             // (polish 4) cut hard at half coverage: no feathered ends, no grey far rows; the sea stair-steps like the maria
}`;
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
uniform vec3 uMoonDir; uniform vec3 uMoonR3; uniform vec3 uMoonU3; uniform float uMoonTan; uniform float uCells;
uniform sampler2D uMaria; uniform vec4 uBars[3]; uniform float uBarT; uniform float uStarP; uniform float uSeaY; uniform float uCrescent;
${OB_GLSL}
${SEA_GLSL}
void main(){
  vec3 d = vDir / max(length(vDir), 1e-5);
  float ink = 0.0;
  float pr = 1.0 / max(uPx, 1.0);
  float h = cameraPosition.y - uSeaY;
  // the sea: taken before the branch so the derivatives are valid on both sides of the horizon
  float dy = min(d.y, -1e-4);
  vec2 sp = cameraPosition.xz + d.xz * (max(h, 0.05) / -dy);
  vec2 fwp = fwidth(sp);
  if (d.y < 0.0) {
    ink = obSea(sp, fwp);
  } else {
    float el = asin(clamp(d.y, -1.0, 1.0));
    float zz = (abs(d.z) < 1e-6 && abs(d.x) < 1e-6) ? 1e-6 : d.z;
    float az = atan(d.x, zz);
    // stars: one hashed cell in 3 degree bands, each a square 2 px across
    float bj = floor(el / 0.05236);
    float n = max(floor(120.0 * cos((bj + 0.5) * 0.05236)), 1.0);
    float a = (az / 6.2831853 + 0.5) * n; float ai = floor(a);
    vec2 hc = vec2(ai, bj * 7.0 + 3.0);
    if (obHash(hc) < uStarP) {
      float sa = 0.2 + 0.6 * obHash(hc + 11.3), se = 0.2 + 0.6 * obHash(hc + 23.7);
      float da = (a - ai - sa) / n * 6.2831853 * cos(el), de = el - (bj + se) * 0.05236;
      ink = clamp((pr - abs(da)) * uPx + 0.5, 0.0, 1.0) * clamp((pr - abs(de)) * uPx + 0.5, 0.0, 1.0);
    }
    // the disc
    float md = dot(d, uMoonDir);
    if (md > 0.3) {
      vec3 q = d / md;
      vec2 m = vec2(dot(q, uMoonR3), dot(q, uMoonU3)) / uMoonTan;
      float rpx = uMoonTan * uPx;
      float edge = clamp((1.0 - length(m)) * rpx + 0.5, 0.0, 1.0);
      if (uCrescent > 0.5) {                                             // phase: a thin crescent holding the old moon at 25 per cent
        float lit = clamp((length(m - vec2(-0.2, 0.45)) - 1.0) * rpx + 0.5, 0.0, 1.0);
        vec2 tuv = m * 0.5 + 0.5; vec2 c = tuv * uCells;
        float tone = mix(0.25, 1.0, step(0.5, lit));
        float eld = el / 0.0174533;
        tone = min(tone, eld < 1.0 ? 0.5 : (eld < 2.0 ? 0.75 : 1.0));
        ink = mix(ink, obPat(c, tone, vec2(uCells * 0.5 / max(rpx, 1.0))), edge);
      } else if (edge > 0.0) {
        vec2 tuv = m * 0.5 + 0.5; vec2 c = tuv * uCells;
        float mt = floor(textureLod(uMaria, tuv, 0.0).r * 4.0 + 0.5) * 0.25;
        float eld = el / 0.0174533;
        float tone = min(mt, eld < 1.0 ? 0.5 : (eld < 2.0 ? 0.75 : 1.0));
        ink = mix(ink, obPat(c, tone, vec2(uCells * 0.5 / max(rpx, 1.0))), edge);
      }
    }
    // cloud bars: flat-ended strips, exclusive-or with whatever is behind
    vec2 mh = uMoonDir.xz / max(length(uMoonDir.xz), 1e-5);
    float rx = d.x * mh.y - d.z * mh.x, rzz = d.x * mh.x + d.z * mh.y;
    float raz = atan(rx, (abs(rzz) < 1e-6 && abs(rx) < 1e-6) ? 1e-6 : rzz);
    for (int k = 0; k < 3; k++) {
      vec4 b = uBars[k];
      float ba = mod(b.x + uBarT + 1.5708, 3.14159265) - 1.5708;
      // (polish 4) a drawn cloud, not a bare bar: a flat foot, and a top that climbs in stairs toward a crown set off
      // the middle, with a second lower hump; every edge a hard step (a bar across the disc read as a glitch dash)
      float cx = (raz - ba) / max(b.z, 1e-4);                                // -1..1 along the cloud
      float hump = max(1.0 - abs(cx - 0.18) * 1.5, 0.62 - abs(cx + 0.5) * 1.6);
      float stairs = floor(clamp(hump, 0.0, 1.0) * 4.0 + 0.999);             // 0 outside, 1..4 inside
      float topEl = b.y - b.w + 2.0 * b.w * stairs;
      float inx = step(abs(cx), 1.0) * step(0.5, stairs);
      float iny = step(b.y - b.w, el) * step(el, topEl);
      // a slit of what lies behind, low in the cloud: the foot is a separate thin bar under the body
      float slit = step(b.y - b.w + 0.9 * b.w, el) * step(el, b.y - b.w + 1.5 * b.w) * step(abs(cx + 0.1), 0.7);
      float cl = inx * iny * (1.0 - slit);
      ink = mix(ink, 1.0 - ink, cl);
    }
  }
  gl_FragColor = vec4(obInk(ink), 1.0);
}`;

// The maria: authored after the real near side, then turned and wobbled per seed. 48 x 48 tones
// (two cells of the 96 grid per texel, so every edge stair-steps): 255 white, 191 margin, 128 mare.
const MARIA = [[-0.25, 0.48, 0.30, 0.27], [0.24, 0.42, 0.19, 0.18], [0.43, 0.14, 0.22, 0.18], [0.76, 0.3, 0.1, 0.12], [0.66, -0.1, 0.13, 0.16],
  [0.45, -0.3, 0.09, 0.09], [-0.62, 0.2, 0.2, 0.42], [-0.2, -0.36, 0.22, 0.17], [-0.52, -0.42, 0.11, 0.1], [0.02, 0.83, 0.42, 0.055], [0.1, 0.12, 0.12, 0.08]];
function makeMaria(rng, noise) {
  const N = 48, data = new Uint8Array(N * N);
  const rot = rng.range(-0.7, 0.7), flip = rng.chance(0.25) ? -1 : 1, cr = Math.cos(rot), sr = Math.sin(rot), ox = rng.range(0, 50);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x0 = ((i + 0.5) / N * 2 - 1) * flip, y0 = (j + 0.5) / N * 2 - 1;
    const x = x0 * cr + y0 * sr, y = -x0 * sr + y0 * cr;
    let sd = 9;
    for (const m of MARIA) { const dx = (x - m[0]) / m[2], dy = (y - m[1]) / m[3]; sd = Math.min(sd, (Math.sqrt(dx * dx + dy * dy) - 1) * Math.min(m[2], m[3])); }
    sd += (noise ? noise.fbm2(x * 2.2 + ox, y * 2.2, 2) : 0) * 0.05 - 0.02;
    const rr = Math.sqrt(x0 * x0 + y0 * y0);
    if (rr > 0.93) sd = Math.max(sd, (rr - 0.93) * 2 + 0.031);
    data[j * N + i] = sd < -0.12 ? 128 : (sd < 0.0 ? 191 : 255);   // 75 carries the maria (a figure over it still reads, as 25); 50 only in the deep cores
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

export function makeStyle(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('one-bit-style') : ctx.rng;                       // exactly one draw from ctx.rng
  const hex = opts.palette || BRIEF_PALETTE;
  const way = opts.colourway || (rng() < 0.62 ? 'bone' : (rng() < 0.5 ? 'amber' : 'green'));
  const pair = way === 'amber' ? [hex[2], hex[3]] : (way === 'green' ? [hex[4], hex[5]] : [hex[0], hex[1]]);
  if (opts.negative) pair.reverse();                                                          // "Day": the negative plate, every rule unchanged
  const col = (h) => new THREE.Color(h);
  const palette = { black: col(hex[0]), white: col(hex[1]), amberBlack: col(hex[2]), amber: col(hex[3]), greenBlack: col(hex[4]), green: col(hex[5]), K: col(pair[0]), W: col(pair[1]) };
  const maria = makeMaria(rng, ctx.noise);
  const bars = [];
  for (let k = 0; k < 3; k++) bars.push(new THREE.Vector4((-17 + k * 12 + rng.range(-3, 3)) * DEG, (3.6 + k * 5.2 + rng.range(-1, 1)) * DEG, (8.5 - 1.5 * k) * DEG, (0.62 - 0.08 * k) * DEG));   // (polish 4) wider and thicker: a cloud, with the shape drawn in the shader
  const U = {
    uK: { value: palette.K }, uW: { value: palette.W }, uPx: { value: 600 }, uTime: { value: 0 },
    uGateP: { value: new THREE.Vector3(0, -1e5, 0) }, uGateN: { value: new THREE.Vector3(0, 0, 1) }, uGateDim: { value: new THREE.Vector2(0, 0) },   // no gate until setGate
    uMoonDir: { value: new THREE.Vector3(0, 0, 1) }, uMoonR3: { value: new THREE.Vector3(1, 0, 0) }, uMoonU3: { value: new THREE.Vector3(0, 1, 0) },
    uMoonTan: { value: Math.tan(15 * DEG) }, uCells: { value: 96 }, uMaria: { value: maria }, uBars: { value: bars }, uBarT: { value: 0 },
    uStarP: { value: 0.39 * (opts.density ?? 1) }, uSeaY: { value: 0 }, uCrescent: { value: opts.crescent ? 1 : 0 },
    uApex: { value: new THREE.Vector2(0, 0) }, uRoadDir: { value: new THREE.Vector2(0, 1) },
    uRoadTan: { value: new THREE.Vector2(Math.tan(10 * DEG), Math.tan(5 * DEG)).multiplyScalar(opts.crescent ? 1 / 3 : 1) }, uRoadOn: { value: 1 }, uRoadNear: { value: 0 },
  };
  const pick = (...n) => Object.fromEntries(n.map((k) => [k, U[k]]));
  const base = () => pick('uK', 'uW', 'uPx');
  const S = { palette, K: palette.K, W: palette.W, colourway: way, uniforms: U, glsl: OB_GLSL, xorBlend: XOR_BLEND, moonAz: 0, moonEl: 0 };

  // --- materials (every one writes exactly K or W; none is lit, fogged or tone-aware) ---
  S.ink = (white = false, o = {}) => new THREE.ShaderMaterial({ uniforms: { uInk: white ? U.uW : U.uK }, vertexShader: FLAT_VERT, fragmentShader: INK_FRAG, side: o.side ?? THREE.FrontSide });
  S.pattern = (tone = 0.5, cells = [16, 16], o = {}) => new THREE.ShaderMaterial({ uniforms: { ...base(), uTone: { value: tone }, uCells: { value: new THREE.Vector2(cells[0], cells[1]) } },
    vertexShader: PAT_VERT, fragmentShader: PAT_FRAG, side: o.side ?? THREE.FrontSide });
  S.land = (o = {}) => new THREE.ShaderMaterial({ uniforms: { ...base(), uMoonDir: U.uMoonDir, uStep: { value: o.step ?? 0 }, uCell: { value: o.cell ?? 0.1 }, uDust: { value: o.dust ?? 0.004 }, uCourse: { value: new THREE.Vector2(o.course ?? 0, o.joints ?? 0) }, uDark: { value: o.dark ?? 0.84 }, uCourseDist: { value: o.courseDist ?? 1e5 } },
    vertexShader: LAND_VERT, fragmentShader: LAND_FRAG, side: o.side ?? THREE.FrontSide });
  const gateU = () => pick('uGateP', 'uGateN', 'uGateDim'), gated = (vs) => vs.replace('void main(){', GATE_VARY);
  S.figure = (o = {}) => new THREE.ShaderMaterial({ uniforms: { ...pick('uK', 'uW'), ...(o.gate ? gateU() : {}) }, vertexShader: o.vertexShader ?? (o.gate ? gated(FLAT_VERT) : FLAT_VERT),
    fragmentShader: o.gate ? XOR_GATE_FRAG : XOR_FRAG, side: o.side ?? THREE.DoubleSide, ...XOR_BLEND });
  S.line = (o = {}) => new THREE.ShaderMaterial({ uniforms: o.figure ? { ...pick('uK', 'uW', 'uPx'), ...(o.gate ? gateU() : {}) } : { uInk: o.black ? U.uK : U.uW, uPx: U.uPx },
    vertexShader: o.figure && o.gate ? gated(RIBBON_VERT) : RIBBON_VERT, fragmentShader: o.figure ? (o.gate ? XOR_GATE_FRAG : XOR_FRAG) : INK_FRAG, side: THREE.DoubleSide, ...(o.figure ? XOR_BLEND : {}) });
  S.gateGlsl = OB_GATE_GLSL;
  S.setGate = (p, n, half, crown) => { U.uGateP.value.copy(p); U.uGateN.value.copy(n).setY(0).normalize(); U.uGateDim.value.set(half, crown); };
  S.skyMaterial = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false });

  // --- per-render hook: pixels per unit tangent and the moon's grid, from the buffer actually being drawn ---
  const v2 = new THREE.Vector2();
  S.hook = function (renderer, scene, camera) {
    const rt = renderer.getRenderTarget(); const h = rt ? rt.height : renderer.getDrawingBufferSize(v2).y;
    U.uPx.value = Math.max(50, 0.5 * h * camera.projectionMatrix.elements[5]);
    U.uCells.value = (2 * U.uMoonTan.value * U.uPx.value) / 96 >= 3 ? 96 : 48;
  };
  S.makeSky = () => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 2), S.skyMaterial); m.frustumCulled = false; m.renderOrder = -0.9; m.onBeforeRender = S.hook; return m; };
  // depth only: hides whatever hangs under the waterline within 1.5 km (the picture of the sea is the dome's)
  const followers = [];
  S.makeSeaDepth = (radius = 1500) => {
    // graded rings, small near the viewer: one huge fan loses depth precision at a grazing angle and then hides things
    // that stand a metre above the water (found on our own deck); it lies a hand under the surface instead of an offset
    const R = [0, 1.5, 4, 9, 20, 45, 100, 230, 520, radius], N = 28, pos = [], idx = [];
    for (let r = 0; r < R.length; r++) for (let k = 0; k < N; k++) { const an = k / N * Math.PI * 2; pos.push(Math.cos(an) * R[r], -0.06, Math.sin(an) * R[r]); }
    for (let r = 0; r < R.length - 1; r++) for (let k = 0; k < N; k++) { const a = r * N + k, b = r * N + (k + 1) % N, c = a + N, d = b + N; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uInk: U.uK }, vertexShader: FLAT_VERT, fragmentShader: INK_FRAG, colorWrite: false, side: THREE.DoubleSide }));
    m.frustumCulled = false; m.renderOrder = -0.5; followers.push(m); return m;
  };
  // azimuth is measured from +Z toward +X, in WORLD space; elevation of the disc's centre
  S.setMoon = (az, el) => {
    S.moonAz = az; S.moonEl = el;
    U.uMoonDir.value.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    U.uMoonR3.value.set(-Math.cos(az), 0, Math.sin(az));                                    // screen right when facing the moon
    U.uMoonU3.value.crossVectors(U.uMoonR3.value, U.uMoonDir.value).normalize();
  };
  S.setRoad = (x, z, az) => { U.uApex.value.set(x, z); U.uRoadDir.value.set(Math.sin(az), Math.cos(az)); };
  const cw = new THREE.Vector3();
  S.update = (dt, time, camera) => {
    U.uTime.value = time; U.uBarT.value = 0.2 * DEG * time;
    if (camera) {
      cw.setFromMatrixPosition(camera.matrixWorld);
      for (const m of followers) { m.position.set(cw.x, U.uSeaY.value, cw.z); if (m.parent) { m.parent.updateWorldMatrix(true, false); m.parent.worldToLocal(m.position); } }
    }
  };
  S.ribbon = makeRibbon;
  S.setMoon(0, 2 * DEG);
  return S;
}

// One geometry from many polylines: lines = [[ [x,y,z] | Vector3, ... ], ...], hw = half width in metres.
export function makeRibbon(lines, hw = 0.1) {
  const pos = [], tan = [], side = [], wid = [], idx = [];
  const get = (p) => (p.isVector3 ? [p.x, p.y, p.z] : p);
  for (const line of lines) {
    const n = line.length; if (n < 2) continue;
    const b0 = pos.length / 3;
    for (let i = 0; i < n; i++) {
      const p = get(line[i]), a = get(line[Math.max(i - 1, 0)]), b = get(line[Math.min(i + 1, n - 1)]);
      for (const s of [-1, 1]) { pos.push(p[0], p[1], p[2]); tan.push(b[0] - a[0], b[1] - a[1], b[2] - a[2]); side.push(s); wid.push(p[3] ?? hw); }   // a point may carry its own half width as a fourth number
      if (i < n - 1) { const k = b0 + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1)); g.setAttribute('aW', new THREE.Float32BufferAttribute(wid, 1));
  g.setIndex(idx); return g;
}

// ---------------------------------------------------------------------------------------------
// Far islands: flat black cut-outs standing in front of the moon's foot (local frame: the road
// runs down -Z from the origin, the moon stands over -Z).
// ---------------------------------------------------------------------------------------------
function buildIslands(ctx, S, rng) {
  // calm cut-outs: each island is a long level top and one sheer step down to a lower shelf, its two ends nearly
  // plumb, clearly wider than it is tall; nothing ridged, so it can never be mistaken for a sail
  const pos = [], idx = [], list = [];
  const slots = rng.shuffle([-11.3, -3.8, 3.8, 11.3]);
  for (let k = 0; k < 4; k++) {
    const dist = 1500 + k * 480 + rng.range(-80, 80), az = (slots[k] + rng.range(-0.5, 0.5)) * DEG;
    const hw = rng.range(2.0, 2.8), half = dist * Math.tan(hw * DEG), H = dist * Math.tan(hw * rng.range(0.78, 0.95) * DEG);
    const cx = Math.sin(az) * dist, cz = -Math.cos(az) * dist, side = rng.sign();
    const step = rng.range(0.12, 0.5), shelf = rng.range(0.42, 0.6), tilt = rng.range(-0.035, 0.035);
    // profile along the island, t from -1 to 1 (mirrored by side): end wall, level top, the step, the shelf, end wall
    const prof = [[-1, 0], [-0.965, 1 - tilt], [step - 0.012, 1 + tilt * step], [step + 0.012, shelf], [0.97, shelf * (1 - 0.6 * tilt)], [1, 0]];
    const b0 = pos.length / 3;
    for (let i = 0; i < prof.length; i++) {
      const t = prof[i][0] * side, x = cx + t * half * Math.cos(az), z = cz + t * half * Math.sin(az);
      pos.push(x, 0, z, x, prof[i][1] * H, z);
      if (i < prof.length - 1) { const q = b0 + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
    list.push({ position: new THREE.Vector3(cx, H * 0.5, cz), halfWidth: half, height: H });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, S.ink(false, { side: THREE.DoubleSide })); mesh.frustumCulled = false;
  return { mesh, list };
}

export async function buildHero(ctx, opts = {}) {
  const S = opts.style || makeStyle(ctx, { ...opts, crescent: !!opts.crescent });
  await ctx.yield();
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1, duration = opts.duration ?? 42;
  const object = new THREE.Group();
  const parts = [];
  if (opts.sky !== false) { object.add(S.makeSky()); object.add(S.makeSeaDepth()); }
  await ctx.yield();
  const isl = buildIslands(ctx, S, rng.fork('islands')); object.add(isl.mesh);
  await ctx.yield();
  const camL = new THREE.Vector3();
  const fleet = await buildFleet(ctx, S, rng.fork('fleet'), { ...opts, detail }); object.add(fleet.mesh);
  await ctx.yield();
  const terns = await buildTerns(ctx, S, rng.fork('terns'), { ...opts, detail }); object.add(terns.mesh);
  await ctx.yield();
  // opts.stragglers: a second, hand-placed handful of the same boats (their own lane), e.g. two luggers lying off the skerry
  const strag = opts.stragglers ? await buildFleet(ctx, S, rng.fork('stragglers'), { ...opts, ...opts.stragglers, detail }) : null;
  if (strag) object.add(strag.mesh);

  // demo (opts.demo, or ?obdemo=1 in the set-piece viewer): a rock in the land material with its keyline and a
  // patterned shadow card, to show the rest of the kit in use. Not part of the hero.
  if (!!opts.demo) {
    const g0 = new THREE.IcosahedronGeometry(5.5, 1), pa = g0.attributes.position;
    for (let i = 0; i < pa.count; i++) { const k = 0.75 + 0.4 * ctx.noise.n3(pa.getX(i) * 0.2, pa.getY(i) * 0.2, pa.getZ(i) * 0.2); pa.setXYZ(i, pa.getX(i) * k, pa.getY(i) * k * 0.8, pa.getZ(i) * k); }
    g0.computeVertexNormals();                                                             // non-indexed: one normal per face, the same on its three corners
    const rock = new THREE.Mesh(g0, S.land()); rock.position.set(3, 1.2, -92); object.add(rock);
    const ring = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; ring.push([3 + Math.cos(a) * 6.2, 1.2 + Math.sin(a) * 5.0, -92.5]); }
    object.add(new THREE.Mesh(S.ribbon([ring], 0.1), S.line()));
    const card = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), S.pattern(0.75, [60, 60], { side: THREE.DoubleSide })); card.position.set(-9, 3.5, -96); object.add(card);
  }

  // the brief's layout (world: +Z the entry axis, apex at x 19, z 123, the moon 12 degrees toward +X) taken into local space
  const PLACE = { position: new THREE.Vector3(19, 0, 123), rotationY: Math.PI + 12 * DEG }, c12 = Math.cos(12 * DEG), s12 = Math.sin(12 * DEG);
  const w2l = (x, y, z) => new THREE.Vector3(-(x - 19) * c12 + (z - 123) * s12, y, -((x - 19) * s12 + (z - 123) * c12));
  const fly = [[0, 0], [0, 75], [5.5, 104], [12, 128], [41.5, 188.5], [71, 249], [95, 275], [127.6, 284.4], [170, 284.2], [212, 284]].map((q) => w2l(q[0], 3.2, q[1]));
  const demo = !!opts.demo;

  let progress = -1, T = 0;
  const e = object.matrixWorld.elements;
  const hero = {
    object, radius: 50, height: demo ? 5 : 10, center: new THREE.Vector3(0, demo ? 1.3 : 3, -190), ground: false, groundY: 0, style: S,
    anchors: {
      roadApex: new THREE.Vector3(0, 0, 0), roadAxis: new THREE.Vector3(0, 0, -1), moonAzimuthLocal: new THREE.Vector3(0, 0, -1),
      islands: isl.list,
      fleetLane: fleet.lane,
      terns: terns.info,
      placement: PLACE,                                   // object.position / rotation.y that put this frame on the brief's map
      flyThrough: fly,                                    // the brief's path, eye 3.2 m, entry to arch; >= 6 m clear of everything but the fleet, which has her berth of it by place (THE FLEET'S BERTH)
      portalSeat: { position: w2l(212, 0, 284), facing: w2l(211, 0, 284).sub(w2l(212, 0, 284)).normalize() },   // sill on the water, facing back down the last straight
      viewpoints: { entry: w2l(0, 3.2, 0), reveal: w2l(12, 3.2, 128), core: w2l(47, 3.2, 200), ternsOverhead: w2l(59, 3.2, 225), bearAway: w2l(71, 3.2, 249) },
      moonElevationAt: (u) => (opts.moonEl ? opts.moonEl(u * 42) : -1 + 10.5 * u) * DEG,       // centre of the disc, radians; the disc is 30 degrees across
    },
    // u = 0..1 along the world's path (the moon's height, the terns' release and flight are keyed to it)
    setProgress(u) { progress = Math.min(Math.max(u, 0), 1); },
    update(dt, time, camera) {
      object.updateWorldMatrix(true, false);
      const az = Math.atan2(-e[8], -e[10]);
      T = progress >= 0 ? progress * duration : (time % duration);                          // seconds of the journey
      S.setRoad(e[12], e[14], az);
      S.setMoon(az, (opts.moonEl ? opts.moonEl(T * (42 / duration)) : -1 + 0.25 * T * (42 / duration)) * DEG);
      S.uniforms.uSeaY.value = e[13];
      S.update(dt, time, camera);
      if (camera) { camL.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(camL); fleet.uCamL.value.copy(camL); terns.uCamL.value.copy(camL); if (strag) strag.uCamL.value.copy(camL); }
      terns.uT.value = T; fleet.uT.value = T; if (strag) strag.uT.value = T;               // the fleet's PLACE goes by the journey's seconds, as the terns' does
      for (const p of parts) p.update(dt, time, T, camera);
    },
    // THE FLEET'S BERTH (below, berthFleet), asked for once by the world when it knows where our own boat and the great
    // luggers sail: the lane's fleet first, then the stragglers, by the same law. Gives back what was moved.
    async fleetBerth(spec) { const moved = { fleet: await fleet.berth(ctx, spec, strag ? [strag.F] : []), stragglers: strag ? await strag.berth(ctx, spec, [fleet.F]) : null }; delete spec.tab; hero.anchors.fleetBerth = moved; return moved; },
    dispose() { S.uniforms.uMaria.value.dispose(); },
  };
  return hero;
}

// ---------------------------------------------------------------------------------------------
// THE FLEET: one instanced geometry, one exclusive-or material. A boat (boat frame: +X the bow,
// +Y up, +Z to leeward) is a convex wedge of hull (back faces dropped in the shader), one sail as a
// single sheet with two shapes, mast and yard as ribbons, and six wake dashes pinned to the water.
// ---------------------------------------------------------------------------------------------
function boatGeometry(cast) {
  const pos = [], part = [], aux = [], idx = [];
  const vert = (p, pt, a) => { pos.push(p[0], p[1], p[2]); part.push(pt); aux.push(a[0], a[1], a[2], a[3]); return pos.length / 3 - 1; };
  // hull
  const X = [-4.5, -2.3, 0.8, 3.0, 4.55], B = [0.95, 1.36, 1.3, 0.8, 0.02], SH = [1.08, 0.9, 0.92, 1.12, 1.5], cen = [0, 0.3, 0];
  const quad = (a, b, c, d) => {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    const out = n[0] * (a[0] - cen[0]) + n[1] * (a[1] - cen[1]) + n[2] * (a[2] - cen[2]) >= 0;
    const q = [a, b, c, d].map((p) => vert(p, 0, [0, 0, 0, 0]));
    if (out) idx.push(q[0], q[1], q[2], q[0], q[2], q[3]); else idx.push(q[0], q[2], q[1], q[0], q[3], q[2]);
  };
  const st = X.map((x, i) => { const wx = i === 4 ? 4.05 : x, wb = B[i] * 0.68; return { DR: [x, SH[i], B[i]], DL: [x, SH[i], -B[i]], WR: [wx, -0.3, wb], WL: [wx, -0.3, -wb] }; });
  // each side is two bands with a slit between them: the strake, a line of whatever lies behind the hull
  const mx = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  const side = (aw, bw, bd, ad) => { quad(aw, bw, mx(bw, bd, 0.69), mx(aw, ad, 0.69)); quad(mx(aw, ad, 0.76), mx(bw, bd, 0.76), bd, ad); };
  for (let i = 0; i < 4; i++) { const a = st[i], b = st[i + 1]; side(a.WR, b.WR, b.DR, a.DR); side(a.WL, b.WL, b.DL, a.DL); quad(a.DR, b.DR, b.DL, a.DL); }
  quad(st[0].WL, st[0].WR, st[0].DR, st[0].DL);
  // sail: corners tack, clew, throat, peak (x, y); sheeted out to leeward aft of the mast, bellied; second shape in aux.xyz
  const lateen = cast === 'lateen';
  const Tk = lateen ? [4.4, 1.25] : [3.3, 1.55], Cl = lateen ? [-4.1, 1.9] : [-4.0, 1.95], Th = lateen ? [3.9, 1.9] : [2.5, 7.4], Pk = lateen ? [-3.3, 11.6] : [-2.9, 10.5];
  const NU = 6, NV = 5, mastX = 0.8, sheet = (x) => (mastX - x) * 0.2 + 0.12;
  const sail = (u, v, belly, lift) => {
    const fx = Tk[0] + (Cl[0] - Tk[0]) * u, fy = Tk[1] + (Cl[1] - Tk[1]) * u + lift * u * (1 - v), hx = Th[0] + (Pk[0] - Th[0]) * u, hy = Th[1] + (Pk[1] - Th[1]) * u;
    const x = fx + (hx - fx) * v, y = fy + (hy - fy) * v - 0.35 * Math.sin(Math.PI * u) * (1 - v) * (1 - v);
    return [x - belly * 0.25 * Math.sin(Math.PI * v) * u, y, sheet(x) + belly * Math.sin(Math.PI * Math.min(u * 1.15, 1)) * Math.sin(Math.PI * (0.12 + 0.8 * v))];
  };
  const patch = (v0, v1, nv) => {                                                        // two patches with a slit: the reef band
    const s0 = pos.length / 3;
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= NU; i++) {
      const v = v0 + (v1 - v0) * j / nv, a = sail(i / NU, v, 0.95, 0), b = sail(i / NU, v, 0.3, 0.35);
      vert(a, 1, [b[0] - a[0], b[1] - a[1], b[2] - a[2], 0]);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < NU; i++) { const q = s0 + j * (NU + 1) + i; idx.push(q, q + 1, q + NU + 2, q, q + NU + 2, q + NU + 1); }
  };
  patch(0, 0.27, 2); patch(0.292, 1, NV - 1);
  // mast and yard: ribbons (aux = tangent, side)
  const rib = (a, b, hw) => {
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const q = [vert(a, 2, [...t, -hw]), vert(a, 2, [...t, hw]), vert(b, 2, [...t, -hw]), vert(b, 2, [...t, hw])];
    idx.push(q[0], q[1], q[2], q[1], q[3], q[2]);
  };
  rib([mastX, 0.95, 0], [mastX, lateen ? 8.2 : 11.2, 0], 0.1);
  rib([4.35, 1.5, 0], [6.6, 1.86, 0], 0.06);                                             // bowsprit
  const yd = [Pk[0] - Th[0], Pk[1] - Th[1]], yl = Math.hypot(yd[0], yd[1]), ya = [Th[0] - yd[0] / yl * 0.6, Th[1] - yd[1] / yl * 0.6], yb = [Pk[0] + yd[0] / yl * 0.5, Pk[1] + yd[1] / yl * 0.5];
  rib([ya[0], ya[1], sheet(ya[0]) - 0.1], [yb[0], yb[1], sheet(yb[0]) - 0.1], 0.085);
  // wake: six dashes (aux = index, end, 0, 0); z is the half width
  for (let k = 0; k < 6; k++) {
    const q = [vert([0, 0.04, -0.13], 3, [k, -1, 0, 0]), vert([0, 0.04, 0.13], 3, [k, -1, 0, 0]), vert([0, 0.04, -0.13], 3, [k, 1, 0, 0]), vert([0, 0.04, 0.13], 3, [k, 1, 0, 0])];
    idx.push(q[0], q[1], q[2], q[1], q[3], q[2]);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  g.setAttribute('aAux', new THREE.Float32BufferAttribute(aux, 4)); g.setIndex(idx);
  return g;
}
// (fleet 1) THE NUMBERS OF THE FLEET'S MOTION that the law of her berth (berthFleet, below) must know as the shader knows
// them: each is typed once, here, and read by both. All are live's own.
const FLEET_SWAY = [2.0, 0.13, 40.0];       // her slow sway along the lane: metres, radians a second, radians of her dealt phase
const FLEET_HEEL = [0.1, 0.07];             // her heel to the swell: its middle and its swing, radians
const FLEET_HEAVE = [0.12, 0.06];           // her heave, metres, and her pitch, metres a metre of her length
const FLEET_SINK = [26.0, 14.0];            // at the lane's two ends she goes down 14 m by her size over her last 26 m of lane
const glf = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));   // a number as the shader reads a float
// (fleet 1) WHAT IS PLACE GOES BY THE JOURNEY'S SECONDS, WHAT IS NOT BY THE WORLD'S CLOCK. uT is the journey's second
// (the hero's T, the terns' own uT): a boat's place along the lane is her dealt start, her speed by uT and her slow
// sway by uT, so the whole of her place is one function of the journey's second and her own dealt numbers, the same
// on every arrival, and her berth of our course is laid once at build (THE FLEET'S BERTH). uTime, the world's clock,
// goes on swinging her sail between its two shapes, heeling and heaving her to the swell and running her wake's dashes: seen
// through the portal before (uT 0) she stands in her place and is not frozen. NO LINE HERE READS THE LENS TO MOVE HER:
// the parting round the viewer (live's two lines after `c`, and its radius in uLaneDim.z) is gone. uCamL is read once,
// at the end, for vDir: the direction the ink is seen along, which says whether a fragment lies on the moon's disc.
const FLEET_VERT = /* glsl */`
attribute float aPart; attribute vec4 aAux; attribute vec4 aBoat; attribute vec4 aBoat2;
uniform float uTime; uniform float uT; uniform float uPx; uniform vec4 uLane; uniform vec2 uLaneDim; uniform vec3 uCamL; uniform vec2 uThin; uniform vec2 uFleetOpt;
varying float vPart; varying vec3 vDir;
void main(){
  vPart = aPart;
  float ph = aBoat.z, sz = aBoat2.w;
  vec3 p = position;
  bool isSail = aPart > 0.5 && aPart < 1.5, isRib = aPart > 1.5 && aPart < 2.5, isWake = aPart > 2.5;
  if (isSail) p += aAux.xyz * (0.5 + 0.5 * sin(uTime * 0.8 + ph * 31.0));
  if (isWake) { float s = (aAux.x + fract(uTime * uLaneDim.y / 2.4 + ph * 5.0)) * 2.4; p.x = -4.9 - s + aAux.y * 0.85 * max(1.0 - s / 14.4, 0.0); }
  if (isWake && uLaneDim.y < 0.05) p = vec3(0.0);                      // a boat lying hove-to drags no wake
  p *= sz;
  float roll = isWake ? 0.0 : ${glf(FLEET_HEEL[0])} + ${glf(FLEET_HEEL[1])} * sin(uTime * 0.9 + ph * 17.0);
  float cr = cos(roll), sr = sin(roll);
  p = vec3(p.x, p.y * cr - p.z * sr, p.y * sr + p.z * cr);
  if (!isWake) p.y += ${glf(FLEET_HEAVE[0])} * sin(uTime * 0.9 + ph * 17.0 + 1.3) + ${glf(FLEET_HEAVE[1])} * p.x * sin(uTime * 0.9 + ph * 17.0 + 2.6);
  vec2 d0 = uLane.zw; vec2 n0 = vec2(-d0.y, d0.x);
  float cy = cos(aBoat2.x), sy = sin(aBoat2.x);
  vec2 dir = vec2(d0.x * cy - d0.y * sy, d0.x * sy + d0.y * cy);
  float s = mod(aBoat.x + uT * uLaneDim.y + ${glf(FLEET_SWAY[0])} * sin(uT * ${glf(FLEET_SWAY[1])} + ph * ${glf(FLEET_SWAY[2])}), uLaneDim.x);   // her place: by the journey's seconds
  vec2 c = uLane.xy + d0 * s + n0 * aBoat.y;
  vec3 fw = vec3(dir.x, 0.0, dir.y), rt = vec3(-dir.y, 0.0, dir.x);
  vec3 lp = vec3(c.x, 0.0, c.y) + fw * p.x + vec3(0.0, p.y, 0.0) + rt * p.z;
  float edge = fract(ph * 7.0 + 0.11) > uFleetOpt.x ? min(s - uThin.x, uThin.y - s) : min(s, uLaneDim.x - s);   // four boats in five keep to the near part of the lane, so the far road and the islands stay readable
  lp.y -= (1.0 - clamp(edge / ${glf(FLEET_SINK[0])}, 0.0, 1.0)) * ${glf(FLEET_SINK[1])} * sz;          // at the lane's two ends a boat comes up out of the sea, the waterline crossing it
  vec4 mv = modelViewMatrix * vec4(lp, 1.0);
  if (isRib) {
    vec3 t3 = fw * aAux.x + vec3(0.0, aAux.y, 0.0) + rt * aAux.z;
    vec3 t = mat3(modelViewMatrix) * t3; t = t / max(length(t), 1e-5);
    vec3 v = mv.xyz / max(length(mv.xyz), 1e-5);
    vec3 sd = cross(t, v); sd = sd / max(length(sd), 1e-4);
    float rw = length(mv.xyz) > uFleetOpt.y ? 0.0 : max(abs(aAux.w) * sz, 0.78 * max(-mv.z, 0.0) / max(uPx, 1.0));   // beyond 170 m a boat is hull and sail only
    mv.xyz += sd * sign(aAux.w) * rw;
  }
  vDir = mat3(modelMatrix) * (lp - uCamL);
  gl_Position = projectionMatrix * mv;
}`;
// (true 2) ON THE DISC THE FLEET IS ONE SOLID INK (the brief as amended: "white on the dark and black the instant it
// crosses the light"; a figure that crosses the moon's disc is painted black, the limb its hard edge). Two passes share
// the geometry, as the live version drew it: uPass 0 is the exclusive-or everywhere off the disc, uPass 1 the solid ink
// on it, so the boats that stand before the moon are clean black cut-outs that join where they overlap, and the limb
// halves a boat. Off the disc the fleet is exclusive-or as before (white on the sea, black on the road, overlaps flip
// back). The crescent's old moon is 25 per cent: there the boats stay exclusive-or.
const FLEET_FRAG = /* glsl */`uniform vec3 uK; uniform vec3 uW; uniform vec3 uMoonDir; uniform float uMoonTan; uniform float uPass; uniform float uFleetSolid; varying float vPart; varying vec3 vDir;
void main(){
  if (vPart < 0.5 && !gl_FrontFacing) discard;
  vec3 d = vDir / max(length(vDir), 1e-4);
  bool onDisc = uFleetSolid > 0.5 && d.y > 0.0 && dot(d, uMoonDir) > inversesqrt(1.0 + uMoonTan * uMoonTan);
  if (uPass < 0.5) { if (onDisc) discard; gl_FragColor = vec4(uK + uW, 1.0); }
  else { if (!onDisc) discard; gl_FragColor = vec4(uK, 1.0); }
}`;

async function buildFleet(ctx, S, rng, o) {
  const cast = o.cast || (rng() < 0.7 ? 'lug' : 'lateen');
  const g = boatGeometry(cast);
  const slant = (o.slant ?? rng.range(17, 24)) * DEG, dir = new THREE.Vector2(Math.sin(slant), -Math.cos(slant)), nrm = new THREE.Vector2(-dir.y, dir.x);
  const cross = o.crossing || new THREE.Vector3(-14, 0, -100), astern = o.astern ?? 60, length = o.length ?? 760, width = o.width ?? 120;
  const origin = new THREE.Vector2(cross.x, cross.z).addScaledVector(dir, -astern);
  const N = o.place ? o.place.length : Math.max(40, Math.round((o.fleetCount ?? 200) * o.detail * (o.density ?? 1))), files = 5, cols = Math.ceil(N / files);   // o.place: [[along, across], ...] a few boats set by hand
  const a1 = new Float32Array(N * 4), a2 = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const f = i % files, c = Math.floor(i / files);
    // (true 1) WHERE THEY STAND. Sails are exclusive-or on the disc too, so two that overlap flip back and three deep is a
    // tangle. The five files are staggered by fifths of the gap between boats (0, 2, 4, 1, 3), and each file is slid along
    // the lane by its distance across it, so that looking down the road at the moon the files interleave: a sail stands
    // in the gaps of the files before and behind it, and overlaps are pairs, at the ends of the disc.
    const across = ((f + 0.5) / files - 0.5) * width + rng.range(-7, 7);
    a1[i * 4] = ((c + 0.1 + ((f * 2) % files) / files) / cols) * length + (o.fleetShift ?? 0) + rng.range(-5, 5) + across * dir.y / (Math.abs(dir.x) > 0.3 ? dir.x : 1e9);
    a1[i * 4 + 1] = across;
    a1[i * 4 + 2] = rng(); a1[i * 4 + 3] = 0;
    a2[i * 4] = rng.range(-0.07, 0.07); a2[i * 4 + 3] = rng.range(0.86, 1.18) * (o.boatScale ?? 1);
    if (o.place) { a1[i * 4] = o.place[i][0]; a1[i * 4 + 1] = o.place[i][1]; }
    else if (o.keep && (a1[i * 4] < o.keep[0] || a1[i * 4] > o.keep[1])) a2[i * 4 + 3] = 0;   // a fleet lying hove-to (speed 0): only the boats inside `keep` exist
    if (i % 64 === 63) await ctx.yield();
  }
  g.setAttribute('aBoat', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aBoat2', new THREE.InstancedBufferAttribute(a2, 4));
  g.instanceCount = N;
  const U = S.uniforms, uCamL = { value: new THREE.Vector3(0, 1e4, 0) }, uT = { value: 0 };
  const fu = (pass) => ({ uK: U.uK, uW: U.uW, uPx: U.uPx, uTime: U.uTime, uT, uLane: { value: new THREE.Vector4(origin.x, origin.y, dir.x, dir.y) },
    uLaneDim: { value: new THREE.Vector2(length, o.speed ?? 6) }, uCamL, uThin: { value: new THREE.Vector2(o.thin ? o.thin[0] : 0, o.thin ? o.thin[1] : 330) },
    uFleetOpt: { value: new THREE.Vector2(o.allThin ? -1 : 0.2, o.ribFar ?? 170) },
    uMoonDir: U.uMoonDir, uMoonTan: U.uMoonTan, uPass: { value: pass }, uFleetSolid: { value: o.crescent ? 0 : 1 } });
  const mat = new THREE.ShaderMaterial({ uniforms: fu(0), vertexShader: FLEET_VERT, fragmentShader: FLEET_FRAG, side: THREE.DoubleSide, ...XOR_BLEND });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  const solid = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: fu(1), vertexShader: FLEET_VERT, fragmentShader: FLEET_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  solid.frustumCulled = false; solid.renderOrder = 2; mesh.add(solid);
  const lane = { origin: new THREE.Vector3(origin.x, 0, origin.y), direction: new THREE.Vector3(dir.x, 0, dir.y), normal: new THREE.Vector3(nrm.x, 0, nrm.y), length, width, speed: o.speed ?? 6, cast, count: N };
  const F = { g, a1, a2, N, origin, dir, length, speed: o.speed ?? 6, thin: [o.thin ? o.thin[0] : 0, o.thin ? o.thin[1] : 330], optX: o.allThin ? -1 : 0.2 };
  // berth: THE FLEET'S BERTH, asked for by the world once it knows our own boat's track; what it moved, and what it was told, stay on the mesh for any count to read
  return { mesh, lane, uCamL, uT, F, berth: async (ctx2, spec, others) => { mesh.userData.berthSpec = spec; return (mesh.userData.berth = await berthFleet(ctx2, F, spec, others)); }, update() {} };
}

// ---------------------------------------------------------------------------------------------
// (fleet 1) THE FLEET'S BERTH, laid at build, by place. The fleet's lane crosses our course, and every boat's track
// with it; live kept a boat off the lens by a law that read the lens (she was held on a ring round it and thrown round
// the ring when the lens passed over her own place: a sail that leapt across the frame). That law is out of the shader.
// A boat's PLACE is now one thing: her dealt start and her speed by the JOURNEY's seconds (uT, the terns' own clock),
// with her slow sway; so where she is when we pass is a fact of the build, the same on every arrival, and her berth
// can be laid here once. For every boat, at every journey second of the flight (spec.steps looks a second; where she
// has room to spare the next look is as far on as she, the lens and our own boat together cannot have closed it), with
// the lens where the course puts it at that second and our own boat where her keys put her:
//   (hull) the nearest side of her HULL (its outline seen from above, at her heel's furthest reach) stays spec.hull
//          metres from the line we sail: the course from the lens forward to our own boat's bow (aft to her stern, were
//          she astern of it); and spec.clear from our own boat's hull itself;
//   (body) no part of her as drawn stays nearer the lens than spec.body metres: her hull, sail, mast, bowsprit and
//          yard, each held in boxes that hold it at every heel, heave and swing of the sail (those run on the world's
//          clock, so every phase must be clear). The boxes are a little larger than she is: the safe side.
// A boat that has both is NOT TOUCHED: her dealt numbers stay live's bit for bit. One that has not takes the least
// shift of her START ALONG THE LANE, ahead or astern, whichever is less (spec.grain metres at a time, ahead first at
// the same distance), that gives both and does not set her into another thing: her hull's outline stays spec.clear
// from every other boat of her fleet (each at her sway's furthest reach against the other), from every boat of the
// other fleet (the stragglers' of the fleet's, the fleet's of the stragglers': each where the journey's second puts
// her), from the great luggers and the full-rigger on their own tracks (spec.movers) and from what lies where it was
// built (spec.statics: what the world hands in; this world hands in its moored boats only, so the buoys, the nets and
// the skiffs are NOT read and a shifted boat may meet one, as an unshifted boat does). If no shift within
// spec.reach gives it she is not built (her size is 0, as a hove-to fleet's boats outside its window are) and she is
// listed. Nothing is dealt: no stream gains, loses or reorders a draw. The law reads the course as a shape, our own
// boat's keys and the tracks of the things named; it reads no seed, no sampled place of the flight, no entry clock and no lens.
// ---------------------------------------------------------------------------------------------
const hull2 = (pts) => {                                                // the convex outline of [[x, z], ...], as a flat list
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); const out = []; for (const q of lo.concat(up)) out.push(q[0], q[1]); return out;
};
const dSeg2 = (px, pz, ax, az, bx, bz) => {                              // a point's distance from a stroke, squared
  const ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez; let t = l2 > 0 ? ((px - ax) * ex + (pz - az) * ez) / l2 : 0; t = t < 0 ? 0 : (t > 1 ? 1 : t);
  const dx = px - ax - ex * t, dz = pz - az - ez * t; return dx * dx + dz * dz;
};
const inPoly = (px, pz, A, n, ox, oz) => {                               // is the point inside the convex outline A (set down at ox, oz)?
  let sg = 0;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, c = (A[j * 2] - A[i * 2]) * (pz - oz - A[i * 2 + 1]) - (A[j * 2 + 1] - A[i * 2 + 1]) * (px - ox - A[i * 2]); if (c !== 0) { if (sg === 0) sg = c > 0 ? 1 : -1; else if ((c > 0 ? 1 : -1) !== sg) return false; } }
  return true;
};
const dPoly = (px, pz, A, n, ox, oz) => {                                // a point's distance from the outline A set down at (ox, oz); 0 inside it
  if (inPoly(px, pz, A, n, ox, oz)) return 0; let best = Infinity;
  for (let i = 0; i < n; i++) { const j = (i + 1) % n, d = dSeg2(px, pz, ox + A[i * 2], oz + A[i * 2 + 1], ox + A[j * 2], oz + A[j * 2 + 1]); if (d < best) best = d; }
  return Math.sqrt(best);
};
const polyGap = (A, nA, ax, az, B, nB, bx, bz) => {                     // the water between two convex outlines; 0 where one lies in or across the other
  let best = Infinity;                                                  // two outlines that do not cross are nearest each other at a corner of one of them
  for (let i = 0; i < nA; i++) { const d = dPoly(ax + A[i * 2], az + A[i * 2 + 1], B, nB, bx, bz); if (d < best) best = d; }
  for (let i = 0; i < nB; i++) { const d = dPoly(bx + B[i * 2], bz + B[i * 2 + 1], A, nA, ax, az); if (d < best) best = d; }
  if (best === 0) return 0;
  // two convex outlines can lie across each other with no corner of either inside the other: then two edges cut
  for (let i = 0; i < nA; i++) {
    const i2 = (i + 1) % nA, p0x = ax + A[i * 2], p0z = az + A[i * 2 + 1], p1x = ax + A[i2 * 2], p1z = az + A[i2 * 2 + 1];
    for (let j = 0; j < nB; j++) {
      const j2 = (j + 1) % nB, q0x = bx + B[j * 2], q0z = bz + B[j * 2 + 1], q1x = bx + B[j2 * 2], q1z = bz + B[j2 * 2 + 1];
      const d1 = (p1x - p0x) * (q0z - p0z) - (p1z - p0z) * (q0x - p0x), d2 = (p1x - p0x) * (q1z - p0z) - (p1z - p0z) * (q1x - p0x), d3 = (q1x - q0x) * (p0z - q0z) - (q1z - q0z) * (p0x - q0x), d4 = (q1x - q0x) * (p1z - q0z) - (q1z - q0z) * (p1x - q0x);
      if (d1 * d2 < 0 && d3 * d4 < 0) return 0;
    }
  }
  return best;
};
const fleetHull = (g) => {                                              // a fleet boat's hull seen from above, by her size 1, at her heel's two reaches ([m toward the bow, m to leeward], flat)
  const P = g.attributes.position.array, PT = g.attributes.aPart.array, pts = [];
  for (let i = 0; i < PT.length; i++) if (PT[i] < 0.5) for (const r of [FLEET_HEEL[0] - FLEET_HEEL[1], FLEET_HEEL[0] + FLEET_HEEL[1]]) pts.push([P[i * 3], P[i * 3 + 1] * Math.sin(r) + P[i * 3 + 2] * Math.cos(r)]);
  return hull2(pts);
};
async function berthFleet(ctx, F, spec, others = []) {
  const { g, a1, a2, N } = F, moved = { shifted: [], unbuilt: [], boats: N };
  if (!spec) return moved;
  const HULL = spec.hull, BODY = spec.body, CLEAR = spec.clear, GRAIN = spec.grain, REACH = spec.reach, STEPS = spec.steps, DUR = spec.duration, K = Math.round(DUR * STEPS);
  const [SWA, SWW, SWP] = FLEET_SWAY, d0x = F.dir.x, d0z = F.dir.y, n0x = -d0z, n0z = d0x, Lw = F.length, v = F.speed, t0 = F.thin[0], t1 = F.thin[1];
  const OWN = spec.own, C = spec.course, cp = C.pts, nC = cp.length / 3;
  // the most each can change in a journey second: her place; the lens along the course; our own boat's stem along it; her metres to one side
  const vB = v + SWA * SWW, vLens = spec.routeLen / DUR, vBow = vLens + OWN.aheadRate, vSide = OWN.sideRate;
  // ---- her shape, read from her own geometry by her size 1 (boat frame: +x the bow, +y up, +z to leeward) ----
  const P = g.attributes.position.array, PT = g.attributes.aPart.array, AX = g.attributes.aAux.array, IX = g.index.array, nv = P.length / 3;
  const hLo = FLEET_HEEL[0] - FLEET_HEEL[1], hHi = FLEET_HEEL[0] + FLEET_HEEL[1], heels = [hLo, FLEET_HEEL[0], hHi];
  // each corner's box over every heel and both shapes of the sail (between two of the three heels its arc bulges by
  // rho (1 - cos(a quarter of the swing)) at most: added)
  const vb = new Float64Array(nv * 6);
  for (let i = 0; i < nv; i++) {
    const sail = PT[i] > 0.5 && PT[i] < 1.5; let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity, rho = 0;
    for (let m = 0; m <= (sail ? 1 : 0); m++) {
      const x = P[i * 3] + m * AX[i * 4], y = P[i * 3 + 1] + m * AX[i * 4 + 1], z = P[i * 3 + 2] + m * AX[i * 4 + 2]; rho = Math.max(rho, Math.hypot(y, z));
      x0 = Math.min(x0, x); x1 = Math.max(x1, x);
      for (const r of heels) { const c = Math.cos(r), s = Math.sin(r), yy = y * c - z * s, zz = y * s + z * c; y0 = Math.min(y0, yy); y1 = Math.max(y1, yy); z0 = Math.min(z0, zz); z1 = Math.max(z1, zz); }
    }
    const pad = rho * (1 - Math.cos(FLEET_HEEL[1] / 2));
    vb.set([x0, y0 - pad, z0 - pad, x1, y1 + pad, z1 + pad], i * 6);
  }
  const boxes = [], grow = (b, i, t, j) => {                              // box b takes in corner i (or the point t of the way from corner i to corner j)
    for (let c = 0; c < 3; c++) {
      const lo = j == null ? vb[i * 6 + c] : vb[i * 6 + c] + (vb[j * 6 + c] - vb[i * 6 + c]) * t, hi = j == null ? vb[i * 6 + 3 + c] : vb[i * 6 + 3 + c] + (vb[j * 6 + 3 + c] - vb[i * 6 + 3 + c]) * t;
      b[c] = Math.min(b[c], lo); b[c + 3] = Math.max(b[c + 3], hi);
    }
  };
  const fresh = () => [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity], hullBox = fresh();
  for (let k = 0; k < IX.length; k += 6) {                                // every part of her is laid in pairs of triangles: one box a pair
    const p = PT[IX[k]];
    if (p < 0.5) for (let q = 0; q < 6; q++) grow(hullBox, IX[k + q]);
    else if (p < 1.5) { const b = fresh(); for (let q = 0; q < 6; q++) grow(b, IX[k + q]); boxes.push(b); }
    else if (p < 2.5) {                                                   // a spar: four boxes along it, each wider by its half width
      const a = IX[k], e = IX[k + 2], hw = Math.abs(AX[a * 4 + 3]);
      for (let q = 0; q < 4; q++) { const b = fresh(); grow(b, a, q / 4, e); grow(b, a, (q + 1) / 4, e); for (let c = 0; c < 3; c++) { b[c] -= hw; b[c + 3] += hw; } boxes.push(b); }
    }
  }
  boxes.push(hullBox);
  // her hull's outline from above; its reach about her place; the reach of her boxes; how far a box stands out beyond the outline
  const HO = fleetHull(g), nH = HO.length / 2; let R1 = 0, Rb1 = 0, Eb1 = 0;
  for (let i = 0; i < nH; i++) R1 = Math.max(R1, Math.hypot(HO[i * 2], HO[i * 2 + 1]));
  for (const b of boxes) { Rb1 = Math.max(Rb1, Math.hypot(Math.max(Math.abs(b[0]), Math.abs(b[3])), Math.max(Math.abs(b[2]), Math.abs(b[5])))); for (const x of [b[0], b[3]]) for (const z of [b[2], b[5]]) Eb1 = Math.max(Eb1, dPoly(x, z, HO, nH, 0, 0)); }
  const OH = spec.ownOutline || (spec.ownOutline = hull2(OWN.hull)), nO = OH.length / 2; let Rown = 0;
  for (let i = 0; i < nO; i++) Rown = Math.max(Rown, Math.hypot(OH[i * 2], OH[i * 2 + 1]));
  // ---- the journey, looked at STEPS times a second. What a look knows, worked out when a boat first asks it (and kept
  //      on the spec: the stragglers ask the same): the lens; the two ends of the stretch we sail, as points of the
  //      course's line; the course's point abeam of our own boat and her metres to one side of it ----
  const tab = spec.tab || (spec.tab = { lx: new Float64Array(K + 1).fill(NaN), ly: new Float64Array(K + 1), lz: new Float64Array(K + 1), iA: new Float64Array(K + 1), iB: new Float64Array(K + 1), mx: new Float64Array(K + 1), mz: new Float64Array(K + 1), side: new Float64Array(K + 1),
    px: new Float64Array(K + 1).fill(NaN), pz: new Float64Array(K + 1), pfx: new Float64Array(K + 1), pfz: new Float64Array(K + 1), o: {} });
  const pt = [0, 0, 0], at = (f) => { const i = Math.min(Math.max(Math.floor(f), 0), nC - 2), t = Math.min(Math.max(f - i, 0), 1); pt[0] = cp[i * 3] + (cp[i * 3 + 3] - cp[i * 3]) * t; pt[1] = cp[i * 3 + 1] + (cp[i * 3 + 4] - cp[i * 3 + 1]) * t; pt[2] = cp[i * 3 + 2] + (cp[i * 3 + 5] - cp[i * 3 + 2]) * t; return pt; };
  const look = (k) => {
    if (tab.lx[k] === tab.lx[k]) return;
    const u = k / STEPS / DUR, m = u * spec.routeLen, o = tab.o; OWN.keys(u, o); const M = m + o.ahead;
    tab.iA[k] = (Math.min(m, M + OWN.stern, k === 0 ? C.from : m) - C.from) / C.step; tab.iB[k] = (Math.max(m, M + OWN.bow) - C.from) / C.step;   // at the journey's first look the lens may stand short of the course's first point (the engine's crossing)
    at((M - C.from) / C.step); tab.mx[k] = pt[0]; tab.mz[k] = pt[2]; tab.side[k] = Math.abs(o.side);
    at((m - C.from) / C.step); tab.lx[k] = pt[0]; tab.ly[k] = pt[1]; tab.lz[k] = pt[2];
  };
  const pose = (k) => { if (tab.px[k] !== tab.px[k]) { const o = tab.o; OWN.pose(k / STEPS / DUR, o); tab.px[k] = o.x; tab.pz[k] = o.z; tab.pfx[k] = o.fx; tab.pfz[k] = o.fz; } };   // our own boat as she truly lies and heads: asked only where a hull is close to her
  const RO = OWN.ahead + OWN.bow;                                         // the stretch we sail never reaches further from the lens than this, by the course
  // ---- one boat ----
  const B = { i: 0, a: 0, ac: 0, ph: 0, sz: 0, fx: 0, fz: 0, rx: 0, rz: 0, thinned: true, poly: new Float64Array(nH * 2), Rh: 0, Rb: 0, Eb: 0, cx: 0, cz: 0, s: 0, edge: 0 };
  const take = (i) => {
    const yaw = a2[i * 4], cy = Math.cos(yaw), sy = Math.sin(yaw), sz = a2[i * 4 + 3];
    B.i = i; B.a = a1[i * 4]; B.ac = a1[i * 4 + 1]; B.ph = a1[i * 4 + 2]; B.sz = sz; B.fx = d0x * cy - d0z * sy; B.fz = d0x * sy + d0z * cy; B.rx = -B.fz; B.rz = B.fx;
    const fr = Math.fround(Math.fround(B.ph * 7) + Math.fround(0.11)); B.thinned = fr - Math.floor(fr) > F.optX;           // as the shader's own single-precision test
    for (let q = 0; q < nH; q++) { B.poly[q * 2] = (B.fx * HO[q * 2] + B.rx * HO[q * 2 + 1]) * sz; B.poly[q * 2 + 1] = (B.fz * HO[q * 2] + B.rz * HO[q * 2 + 1]) * sz; }
    B.Rh = R1 * sz; B.Rb = Rb1 * sz; B.Eb = Eb1 * sz;
  };
  // her place at look k with the start a (the shader's own line, said again); edge: how far inside the lane's window
  const place = (a, k) => {
    const T = k / STEPS, x = a + v * T + SWA * Math.sin(SWW * T + SWP * B.ph), s = x - Lw * Math.floor(x / Lw);
    B.s = s; B.cx = F.origin.x + d0x * s + n0x * B.ac; B.cz = F.origin.y + d0z * s + n0z * B.ac; B.edge = B.thinned ? Math.min(s - t0, t1 - s) : Math.min(s, Lw - s);
  };
  // under the sea (outside the lane's window): how many looks until she can be afloat again, at the least
  const under = () => { const gap = !B.thinned ? 0 : (B.s <= t0 ? t0 - B.s : Lw - B.s + t0); return Math.max(1, Math.floor(gap / Math.max(vB, 1e-6) * STEPS)); };
  // how many looks on she can be asked next, having `sec` seconds to spare (never past the lane's own end, where her place leaps to its start)
  const on = (sec) => Math.max(1, Math.floor(Math.min(sec, B.thinned ? Infinity : (Lw - B.s) / Math.max(vB, 1e-6)) * STEPS));
  // (hull) is her outline nearer than HULL to the stretch we sail at look k? The course is walked from one end of the
  // stretch to the other, as far on each time as it cannot have come within HULL of her (its points lie C.step apart).
  const hullNear = (k) => {
    const iB = tab.iB[k], H2 = HULL * HULL;
    for (let f = tab.iA[k]; f < iB; ) {
      at(f); const ax = pt[0], az = pt[2], d = dPoly(ax, az, B.poly, nH, B.cx, B.cz);
      if (d < HULL) return true;
      const n = (d - HULL) / C.step;
      if (n >= 1) { f = Math.min(f + n, iB); continue; }
      const f2 = Math.min(Math.floor(f) + 1, iB); at(f2);                  // the stroke of the course from here to its next point: asked whole
      for (let q = 0; q < nH; q++) if (dSeg2(B.cx + B.poly[q * 2], B.cz + B.poly[q * 2 + 1], ax, az, pt[0], pt[2]) < H2) return true;
      f = f2;
    }
    at(iB); return dPoly(pt[0], pt[2], B.poly, nH, B.cx, B.cz) < HULL;
  };
  // what her outline has to spare of the stretch beyond HULL, at the least: the same walk in longer strides, each as
  // far on as half of what she has to spare where it stands (half a metre at the least), and what it passes over is
  // taken off what it found; where that leaves nothing, hullNear is asked
  const lineSpare = (k) => {
    const iB = tab.iB[k]; let low = Infinity;
    for (let f = tab.iA[k]; ; ) {
      at(f); const d = dPoly(pt[0], pt[2], B.poly, nH, B.cx, B.cz); if (d < HULL) return d - HULL;
      if (f >= iB) return Math.min(low, d) - HULL;
      const far = Math.min(Math.max(0.5 * (d - HULL), 0.5), (iB - f) * C.step); low = Math.min(low, d - far); f += far / C.step;
    }
  };
  // (body) is the lens nearer than BODY to any of her boxes at look k (sunk as she is at the lane's ends)?
  const bodyNear = (k) => {
    const dx = tab.lx[k] - B.cx, dz = tab.lz[k] - B.cz; if (Math.hypot(dx, dz) > B.Rb + BODY) return false;
    const sz = B.sz, qx = dx * B.fx + dz * B.fz, qz = dx * B.rx + dz * B.rz, qy = tab.ly[k] + (1 - Math.min(Math.max(B.edge / FLEET_SINK[0], 0), 1)) * FLEET_SINK[1] * sz;
    for (const b of boxes) {
      const py = FLEET_HEAVE[0] + FLEET_HEAVE[1] * sz * Math.max(Math.abs(b[0]), Math.abs(b[3]));
      const ex = Math.max(b[0] * sz - qx, 0, qx - b[3] * sz), ey = Math.max(b[1] * sz - py - qy, 0, qy - b[4] * sz - py), ez = Math.max(b[2] * sz - qz, 0, qz - b[5] * sz);
      if (ex * ex + ey * ey + ez * ez < BODY * BODY) return true;
    }
    return false;
  };
  // (our own boat) is her hull nearer than CLEAR to ours, as ours truly lies at look k?
  const ownPoly = new Float64Array(nO * 2);
  const ownNear = (k) => {
    pose(k); if (Math.hypot(tab.px[k] - B.cx, tab.pz[k] - B.cz) > B.Rh + Rown + CLEAR) return false;
    const fx = tab.pfx[k], fz = tab.pfz[k]; for (let q = 0; q < nO; q++) { ownPoly[q * 2] = fz * OH[q * 2] + fx * OH[q * 2 + 1]; ownPoly[q * 2 + 1] = -fx * OH[q * 2] + fz * OH[q * 2 + 1]; }   // her frame: +x port (up cross forward), +z the bow
    return polyGap(B.poly, nH, B.cx, B.cz, ownPoly, nO, tab.px[k], tab.pz[k]) < CLEAR;
  };
  // our own hull lies within Rown of her place, and her place tab.side from the course's point abeam of her: what a fleet hull has to spare of that
  const ownSpare = (k) => dPoly(tab.mx[k], tab.mz[k], B.poly, nH, B.cx, B.cz) - tab.side[k] - Rown - CLEAR;
  // no box of hers stands further out from her outline than B.Eb: what the lens has to spare of that
  const bodySpare = (k) => dPoly(tab.lx[k], tab.lz[k], B.poly, nH, B.cx, B.cz) - B.Eb - BODY;
  // the terms at one look: 0 none fails, 1 the hull's berth of the line we sail, 2 the body's berth of the lens, 3 our own boat's hull
  const termAt = (a, k) => { place(a, k); if (B.edge <= 0) return 0; look(k); return hullNear(k) ? 1 : (bodyNear(k) ? 2 : (ownNear(k) ? 3 : 0)); };
  // her whole flight against the course and our own boat: -1 clear, else the look at which a term first fails (why: its number)
  let why = 0, work = 0;
  const flightOf = async (a) => {
    for (let k = 0; k <= K; ) {
      place(a, k); if (B.edge <= 0) { k += under(); continue; }
      look(k); if (++work % 256 === 0) await ctx.yield();
      const far = Math.hypot(B.cx - tab.lx[k], B.cz - tab.lz[k]) - RO - Math.max(B.Rh + Math.max(HULL, OWN.side + Rown + CLEAR), B.Rb + BODY);
      if (far > 0) { k += on(far / (vB + vLens)); continue; }
      const sH = lineSpare(k), sO = ownSpare(k), sB = bodySpare(k), sec = Math.min(sH / (vB + vBow), sO / (vB + vBow + vSide), sB / (vB + vLens));
      if (sec * STEPS >= 1) { k += on(sec); continue; }
      const t = sH <= 0 && hullNear(k) ? 1 : (sB <= 0 && bodyNear(k) ? 2 : (sO <= 0 && ownNear(k) ? 3 : 0)); if (t) { why = t; return k; }
      k++;
    }
    return -1;
  };
  // ---- the other things she must not be set into (asked only of a boat that is shifted) ----
  // a thing: its outline (pts) and, if it moves, where the journey's second T sets it down (off(T, m) writes m.x and m.z,
  // the metres its outline has moved, and m.lim, the seconds for which that goes on without a leap; it gives back the
  // seconds before the thing can be afloat, 0 when it is) and the most it moves in a second
  const thing = (name, pts, off, speed) => { const o = hull2(pts), n = o.length / 2; let cx = 0, cz = 0, R = 0; for (let q = 0; q < n; q++) { cx += o[q * 2] / n; cz += o[q * 2 + 1] / n; } for (let q = 0; q < n; q++) R = Math.max(R, Math.hypot(o[q * 2] - cx, o[q * 2 + 1] - cz)); return { name, o, n, cx, cz, R, off, speed, x: 0, z: 0, lim: Infinity }; };
  const things = [];
  (spec.movers || []).forEach((mv, q) => things.push(thing('mover ' + q, mv.pts, (T, m) => { const r = mv.run(T); m.x = mv.dir[0] * r; m.z = mv.dir[1] * r; return 0; }, mv.speed)));   // on a straight track of its own: { pts, dir, run(T), speed }
  (spec.statics || []).forEach((pts, q) => things.push(thing('static ' + q, pts, null, 0)));                                                                                        // lying where it was built: its corners
  others.forEach((F2, f) => {                                             // the other fleet's boats, each where the shader's own line puts her at the journey's second (her start read as it now stands)
    const O2 = fleetHull(F2.g), e0x = F2.dir.x, e0z = F2.dir.y, L2 = F2.length, v2 = F2.speed, vB2 = v2 + SWA * SWW, u0 = F2.thin[0], u1 = F2.thin[1];
    for (let j = 0; j < F2.N; j++) {
      const sz = F2.a2[j * 4 + 3]; if (!(sz > 0)) continue;
      const yaw = F2.a2[j * 4], cy = Math.cos(yaw), sy = Math.sin(yaw), fx = e0x * cy - e0z * sy, fz = e0x * sy + e0z * cy, ac = F2.a1[j * 4 + 1], ph = F2.a1[j * 4 + 2], pts = [];
      const fr = Math.fround(Math.fround(ph * 7) + Math.fround(0.11)), thinned = fr - Math.floor(fr) > F2.optX;
      for (let q = 0; q < O2.length; q += 2) pts.push([(fx * O2[q] - fz * O2[q + 1]) * sz, (fz * O2[q] + fx * O2[q + 1]) * sz]);
      things.push(thing('other fleet ' + f + ' boat ' + j, pts, (T, m) => {
        const x = F2.a1[j * 4] + v2 * T + SWA * Math.sin(SWW * T + SWP * ph), s = x - L2 * Math.floor(x / L2);
        m.x = F2.origin.x + e0x * s - e0z * ac; m.z = F2.origin.y + e0z * s + e0x * ac;
        if (!thinned) { m.lim = (L2 - s) / vB2; return 0; }
        if (s > u0 && s < u1) { m.lim = (u1 - s) / vB2; return 0; }
        m.lim = Infinity; return s <= u0 ? (u0 - s) / vB2 : (L2 - s + u0) / vB2;
      }, vB2));
    }
  });
  // the water between her hull and thing m at look k with the start a, less CLEAR (under the sea she has all the water
  // there is; while the thing is under it, as much as the two could close before it can be afloat)
  const thingSpare = (a, m, k) => {
    place(a, k); if (B.edge <= 0) return Infinity;
    const wait = m.off ? m.off(k / STEPS, m) : 0; if (wait > 0) return wait * (vB + m.speed);
    const gap = Math.hypot(B.cx - m.cx - m.x, B.cz - m.cz - m.z) - B.Rh - m.R - CLEAR;
    return gap > 0 ? gap : polyGap(B.poly, nH, B.cx, B.cz, m.o, m.n, m.x, m.z) - CLEAR;
  };
  const thingAt = async (a, m) => {                                       // -1 clear of thing m over the whole flight, else the look
    for (let k = 0; k <= K; ) {
      const sp = thingSpare(a, m, k); if (sp === Infinity) { k += under(); continue; }
      if (sp < 0) return k;
      k += on(Math.min(sp / (vB + m.speed), m.lim)); if (++work % 256 === 0) await ctx.yield();
    }
    return -1;
  };
  // every boat of this fleet that is afloat at some second of the journey (the others are never seen: under the sea)
  const afloat = new Uint8Array(N), wrap = (x) => x - Lw * Math.round(x / Lw);
  for (let i = 0; i < N; i++) {
    if (!(a2[i * 4 + 3] > 0)) continue; take(i);
    if (!B.thinned) { afloat[i] = 1; continue; }
    const lo = B.a - SWA, hi = B.a + v * DUR + SWA; for (let n = -2; n <= 2; n++) if (lo + n * Lw < t1 && hi + n * Lw > t0) afloat[i] = 1;
  }
  const mateNear = (a, j) => {                                            // is boat j's hull within CLEAR of hers, each at her sway's furthest reach against the other?
    const sz = a2[j * 4 + 3], da = wrap(a1[j * 4] - a), dc = a1[j * 4 + 1] - B.ac;
    if (Math.abs(dc) > B.Rh + R1 * sz + CLEAR || Math.abs(da) > B.Rh + R1 * sz + CLEAR + 2 * SWA) return false;
    const yaw = a2[j * 4], cy = Math.cos(yaw), sy = Math.sin(yaw), fx = d0x * cy - d0z * sy, fz = d0x * sy + d0z * cy, pts = [];
    for (const e of [-2 * SWA, 2 * SWA]) for (let q = 0; q < nH; q++) pts.push([(fx * HO[q * 2] - fz * HO[q * 2 + 1]) * sz + d0x * e, (fz * HO[q * 2] + fx * HO[q * 2 + 1]) * sz + d0z * e]);
    const sw = hull2(pts);
    return polyGap(B.poly, nH, 0, 0, sw, sw.length / 2, d0x * da + n0x * dc, d0z * da + n0z * dc) < CLEAR;
  };
  // ---- every boat in her turn ----
  for (let i = 0; i < N; i++) {
    if (!afloat[i]) continue;
    take(i); const a0 = B.a, k0 = await flightOf(a0);
    if (k0 < 0) { await ctx.yield(); continue; }                          // she has her berth: not touched
    // which things can she come near at all, shifted or not (asked once a second of the journey, each with the room
    // the two can close in half a second and the furthest she may be shifted; near the lane's own end, where a shift
    // can carry her place across it, every thing is kept)
    const term = why, near = [], taken = []; let nTaken = 0, done = false;
    for (const m of things) {
      let keep = false;
      for (let k = 0; k <= K && !keep; k += STEPS) { place(a0, k); if (m.off) m.off(k / STEPS, m); keep = B.s < REACH || B.s > Lw - REACH || Math.hypot(B.cx - m.cx - m.x, B.cz - m.cz - m.z) - B.Rh - m.R - CLEAR - REACH - 0.5 * (vB + m.speed) < 0; }
      if (keep) near.push(m);
    }
    const wit = [k0, k0], by = [null, null];                              // what failed her last step ahead, and astern: the look, and the thing or boat with its look
    for (let n = 1; n * GRAIN <= REACH && !done; n++) for (const sg of [1, -1]) {
      const a = Math.fround(a0 + sg * n * GRAIN), w = sg > 0 ? 0 : 1;         // the start as the shader will read it
      // what failed her last step this way most often fails this one too: asked first, at that look and a little either side of it
      let bad = false;
      for (const d of [0, STEPS >> 3, STEPS >> 2, STEPS >> 1]) for (const kk of d ? [wit[w] - d, wit[w] + d] : [wit[w]]) if (!bad && kk >= 0 && kk <= K && termAt(a, kk) > 0) { bad = true; wit[w] = kk; }
      if (bad) continue;
      const was = by[w];
      if (was && (was.m ? thingSpare(a, was.m, was.k) < 0 : mateNear(a, was.j))) { nTaken++; continue; }
      const k2 = await flightOf(a); if (k2 >= 0) { wit[w] = k2; continue; }
      let into = null;
      for (let j = 0; j < N && !into; j++) if (j !== i && afloat[j] && mateNear(a, j)) into = { j, name: 'boat ' + j };
      for (let q = 0; q < near.length && !into; q++) { const k3 = await thingAt(a, near[q]); if (k3 >= 0) into = { m: near[q], k: k3, name: near[q].name }; }
      if (into) { by[w] = into; nTaken++; if (taken.length < 8) taken.push([a - a0, into.name]); continue; }
      a1[i * 4] = a; moved.shifted.push({ boat: i, from: a0, by: a - a0, term, nTaken, taken }); done = true; break;
    }
    if (!done) { a2[i * 4 + 3] = 0; afloat[i] = 0; moved.unbuilt.push({ boat: i, from: a0, term, nTaken, taken }); }
    await ctx.yield();
  }
  g.attributes.aBoat.needsUpdate = true; g.attributes.aBoat2.needsUpdate = true;
  return moved;
}

// ---------------------------------------------------------------------------------------------
// TERNS: instanced flat cut-outs (11 triangles that never overlap themselves), turned about their
// line of flight to face the viewer, three held wing shapes at three a second with scattered
// phases. Until uLift they sit on the crest; then each is released by a wave along the crest and
// flies one of three splines, all in the vertex shader, keyed to uT (seconds of the journey).
// ---------------------------------------------------------------------------------------------
const TERN_VERT = /* glsl */`
attribute float aFlex; attribute vec3 aPerch; attribute vec4 aFly; attribute vec4 aOff;
uniform float uT; uniform float uTime; uniform float uPx; uniform vec3 uSpl[12]; uniform vec3 uSplLen; uniform vec3 uD0; uniform vec3 uCamL; uniform float uTernPx; uniform vec3 uStrandN; uniform float uStrandPx;
varying vec3 vDir;
vec3 bez(int k, float t){
  vec3 a = uSpl[k * 4], b = uSpl[k * 4 + 1], c = uSpl[k * 4 + 2], d = uSpl[k * 4 + 3];
  float tc = clamp(t, 0.0, 1.0), m = 1.0 - tc;
  vec3 p = a * (m * m * m) + b * (3.0 * m * m * tc) + c * (3.0 * m * tc * tc) + d * (tc * tc * tc);
  vec3 dv = (b - a) * (3.0 * m * m) + (c - b) * (6.0 * m * tc) + (d - c) * (3.0 * tc * tc);
  return p + dv * (t - tc);
}
vec3 posAt(float q, int k, float len, float blend){
  vec3 nrm = k == 2 ? uStrandN : vec3(-uD0.z, 0.0, uD0.x);              // the strand's tube lies across its own run-in, not across the ribbon's heading
  float wob = sin(q * 0.035 + aOff.z * 6.2831853);
  vec3 sp = bez(k, (q - aFly.z) / max(len, 1.0)) + nrm * (aOff.x + wob * 1.5) + vec3(0.0, aOff.y + wob, 0.0);
  vec3 lf = aPerch + uD0 * q + vec3(0.0, 14.0 * clamp(q / 50.0, 0.0, 1.0), 0.0);
  float w = clamp(q / max(blend, 1.0), 0.0, 1.0);
  return mix(lf, sp, w * w * (3.0 - 2.0 * w));
}
void main(){
  int k = int(aFly.y + 0.5);
  float len = k == 0 ? uSplLen.x : (k == 1 ? uSplLen.y : uSplLen.z);
  float blend = k == 2 ? 60.0 : 140.0;
  float tau = uT - aFly.x;
  float fly = step(0.0, tau);
  float q = max(tau, 0.0) * aFly.w;
  vec3 c = posAt(q, k, len, blend);
  vec3 fw = posAt(q + 1.5, k, len, blend) - c; fw = fw / max(length(fw), 1e-4);
  vec3 tc = uCamL - c; float dist = max(length(tc), 1e-3); tc /= dist;
  // a flat cut-out that always faces the viewer: its long axis is the line of flight as the viewer sees it; a bird
  // flying straight at us or away is drawn head up, so it is still a two-winged mark and never an edge-on stroke
  vec3 fp = fw - tc * dot(fw, tc); float fl = length(fp);
  vec3 upP = vec3(0.0, 1.0, 0.0) - tc * tc.y; upP = upP / max(length(upP), 1e-3);
  fp = mix(upP, fp / max(fl, 1e-4), smoothstep(0.12, 0.4, fl));
  float fpl = length(fp); fp = fpl > 1e-3 ? fp / fpl : vec3(1.0, 0.0, 0.0);
  vec3 rt = cross(fp, tc); rt = rt / max(length(rt), 1e-3);
  // the three held shapes: wings up, level, down (a perched bird holds the folded one)
  float shape = mod(floor(uTime * 3.0 + aOff.z * 3.0), 3.0);
  float up = shape < 0.5 ? 1.0 : (shape < 1.5 ? 0.0 : -0.65);
  vec2 g = position.xy;
  float f1 = step(0.5, aFlex) * step(aFlex, 1.5), f2 = step(1.5, aFlex);
  g.y += up * (0.08 * f1 + 0.24 * f2);
  g.x *= 1.0 - abs(up) * (0.05 * f1 + 0.2 * f2);
  g = mix(vec2(g.x * 0.28, g.y * 0.8), g, fly);
  float least = (k == 2 ? mix(uTernPx, uStrandPx, fly) : uTernPx) * dist / (max(uPx, 1.0) * mix(2.4, 1.1, fly));   // (polish 2: a perched bird is a dot of the crest's dotted line)        // a flying bird is never under uTernPx pixels across the wings
  // (true 1, round 2) a bird of the strand is its own size or the strand's least size (uStrandPx), whichever is larger: far
  // off the sixty are a thread of small marks, and none is drawn larger for being far away
  float sc = k == 2 ? max(aOff.w, least) : max(1.0, least) * aOff.w;
  vec3 lp = c + (rt * g.x + fp * g.y) * sc;
  vDir = mat3(modelMatrix) * (lp - uCamL);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(lp, 1.0);
}`;
// (true 2) Over the moon's disc a bird is one solid ink, the disc's opposite, as the live version drew it (the brief as
// amended: black the instant it crosses the light). Two passes share the geometry: uPass 0 is the exclusive-or
// everywhere off the disc (sky, sea, road), uPass 1 the solid ink on it; the limb parts the two along a hard line across
// the bird. The crescent's old moon keeps exclusive-or.
const TERN_FRAG = /* glsl */`uniform vec3 uK; uniform vec3 uW; uniform vec3 uMoonDir; uniform float uMoonTan; uniform float uPass; uniform float uTernSolid;
varying vec3 vDir;
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4);
  bool onDisc = uTernSolid > 0.5 && d.y > 0.0 && dot(d, uMoonDir) > inversesqrt(1.0 + uMoonTan * uMoonTan);
  if (uPass < 0.5) { if (onDisc) discard; gl_FragColor = vec4(uK + uW, 1.0); }
  else { if (!onDisc) discard; gl_FragColor = vec4(uK, 1.0); }
}`;
function ternGeometry() {
  const P = [], F = [], I = [];
  const v = (x, y, f) => { P.push(x, y, 0); F.push(f); return P.length / 3 - 1; };
  for (const s of [1, -1]) {                                                             // wings: root strip, wrist, swept tip
    const A = v(0.035 * s, 0.10, 0), B = v(0.035 * s, -0.07, 0), C = v(0.26 * s, 0.125, 1), D = v(0.25 * s, 0.0, 1), E = v(0.55 * s, -0.09, 2);
    I.push(A, B, D, A, D, C, C, D, E);
  }
  const a = v(-0.035, 0.10, 0), b = v(0.035, 0.10, 0), c = v(0.035, -0.07, 0), d = v(-0.035, -0.07, 0), h = v(0, 0.26, 0), m = v(0, -0.07, 0), t1 = v(-0.06, -0.29, 0), t2 = v(0.06, -0.29, 0);
  I.push(a, b, c, a, c, d, a, b, h, d, m, t1, m, c, t2);                                  // body, head, forked tail
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aFlex', new THREE.Float32BufferAttribute(F, 1)); g.setIndex(I);
  return g;
}
async function buildTerns(ctx, S, rng, o) {
  const V = (p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));
  // crest: local points from the end the wave starts at (default: the brief's skerry, north end first)
  const crest = (o.crest || [[-139.5, 30, -272], [-148, 32, -232], [-156, 30.5, -193], [-165, 32, -152], [-173, 30, -115]]).map(V);
  const seg = [0]; for (let i = 1; i < crest.length; i++) seg.push(seg[i - 1] + crest[i].distanceTo(crest[i - 1]));
  const Lc = seg[seg.length - 1];
  const at = (s) => { const d = s * Lc; let i = 1; while (i < crest.length - 1 && seg[i] < d) i++; return crest[i - 1].clone().lerp(crest[i], (d - seg[i - 1]) / Math.max(seg[i] - seg[i - 1], 1e-3)); };
  const lift = o.liftAt ?? 18, wave = o.ternWave ?? 3, speed = 30;
  const D0 = (o.ternHeading ? V(o.ternHeading) : new THREE.Vector3(0.84, 0, -0.545)).normalize(), up = new THREE.Vector3(0, 1, 0);
  const axis = crest[crest.length - 1].clone().sub(crest[0]).normalize(), backPer = Math.max(0, -axis.dot(D0)) * Lc;   // how far upstream the far end starts
  const P0 = crest[0].clone().addScaledVector(up, 12), along = (d, y, z) => P0.clone().addScaledVector(D0, d).add(new THREE.Vector3(0, y, z));
  const bend = rng.range(0.7, 1.3), rise = o.ternHeight ?? 80;
  const spl = [P0, along(110, (rise - 42) * 0.42, 0), along(250, (rise - 42) * 0.92, -30 * bend), along(420, rise - 42, -90 * bend),
    P0, along(110, (rise - 42) * 0.42 + 5, 8), along(250, (rise - 42) * 0.92 + 7, -22 * bend), along(420, rise - 36, -70 * bend)];
  const pass = o.strandPoint ? V(o.strandPoint) : new THREE.Vector3(-18, 13.5, -106), passAt = o.strandAt ?? 25;
  const sFrom = o.strandFrom ?? 0.5;                                                     // where on the crest the strand sits (0: the end the wave starts at)
  const s0 = at(sFrom).addScaledVector(up, 6);
  // (true 1, round 2) THE STRAND IS A THREAD. o.strandVia: the two middle points of its track (local), so that it can leave
  // the crest to one side and come round to its run-in instead of flying straight at the eye, where sixty birds are a pile.
  const via = o.strandVia ? o.strandVia.map(V) : [s0.clone().lerp(pass, 0.34).setY(s0.y - 10), s0.clone().lerp(pass, 0.67).setY(pass.y)];
  spl.push(s0, via[0], via[1], pass.clone());
  const sN = new THREE.Vector3().crossVectors(up, pass.clone().sub(via[1]).setY(0)); if (sN.lengthSq() < 1e-6) sN.set(1, 0, 0); sN.normalize();
  const blen = (k) => { let L = 0; const a = new THREE.Vector3(), b = new THREE.Vector3(), cv = new THREE.CubicBezierCurve3(spl[k * 4], spl[k * 4 + 1], spl[k * 4 + 2], spl[k * 4 + 3]); cv.getPoint(0, a); for (let i = 1; i <= 24; i++) { cv.getPoint(i / 24, b); L += a.distanceTo(b); a.copy(b); } return L; };
  const lens = new THREE.Vector3(blen(0), blen(1), blen(2));
  const N = Math.max(40, Math.round((o.ternCount ?? 5000) * o.detail * (o.density ?? 1))), nStrand = Math.min(60, Math.max(Math.round(N * 0.012), o.strandCount ?? 0));
  // o.strandExtra: birds added to the strand beyond those counted in ternCount (never more than sixty in all). They are
  // drawn after every other bird and from a stream of their own, so the ribbon is the same ribbon with or without them.
  // The sixty are strung out: each has its own place in the line (slot), perched in that order along a fifth of the crest
  // (o.strandPerch 0.1: a tenth either side of its middle), released in that order so that they reach the strand point
  // over five seconds (o.strandWindow [-2.5, 2.5] about strandAt), in a tube o.strandRadius (9 m) in radius.
  const nExtra = Math.max(0, Math.min(60 - nStrand, Math.round(o.strandExtra ?? 0))), NT = N + nExtra, nS = nStrand + nExtra;
  const slotOf = new Int32Array(NT).fill(-1), taken = new Uint8Array(Math.max(nS, 1));
  for (let i = 0; i < nStrand; i++) { const q = Math.floor(i * nS / nStrand); slotOf[i] = q; taken[q] = 1; }
  for (let i = N, q = 0; i < NT; i++) { while (taken[q]) q++; slotOf[i] = q; taken[q] = 1; }
  const sWin = o.strandWindow ?? [-2.5, 2.5], sRad = o.strandRadius ?? 9, sPerch = o.strandPerch ?? 0.1;
  let rs = null;
  // o.ternBig: so many birds on the ribbon's near edge drawn two to three times larger, so the ribbon has depth
  const nBig = o.ternBig ?? 0, nearSide = Math.sign(pass.clone().sub(P0).dot(new THREE.Vector3(-D0.z, 0, D0.x))) || 1, RR = o.ternRadius ?? 12;
  const perch = new Float32Array(NT * 3), fly = new Float32Array(NT * 4), off = new Float32Array(NT * 4);
  for (let i = 0; i < NT; i++) {
    if (i === N) rs = rng.fork('strand');                                                // after the last bird of the ribbon has had its draws
    const strand = slotOf[i] >= 0, R = i >= N ? rs : rng, slot = slotOf[i];
    const s = strand ? Math.min(Math.max(sFrom - sPerch + 2 * sPerch * (slot + 0.5 + 10 * R.range(-0.04, 0.04)) / nS, 0), 1) : R(), p = at(s);
    perch[i * 3] = p.x + R.range(-0.5, 0.5); perch[i * 3 + 1] = p.y + 0.25; perch[i * 3 + 2] = p.z + R.range(-0.5, 0.5);
    const k = strand ? 2 : (R() < 0.7 ? 0 : 1), v = speed * R.range(0.96, 1.04);
    const late = !strand && R() < (o.ternTail ?? 0) ? wave + (o.ternTailFor ?? 16) * Math.pow(R(), 1.4) : 0;   // the tail: birds that keep leaving the crest
    fly[i * 4] = strand ? passAt - lens.z / v + sWin[0] + (sWin[1] - sWin[0]) * (slot + 0.5 + 0.5 * R.range(-0.7, 0.7)) / nS : lift + (late || wave * s) + R.range(0, 0.5);
    fly[i * 4 + 1] = k; fly[i * 4 + 2] = strand ? 0 : backPer * s; fly[i * 4 + 3] = v;
    const r = (strand ? sRad : (o.ternRadius ?? 12)) * Math.sqrt(R()) * (strand ? 0.6 + 0.4 * R() : 0.35 + 0.65 * R()), a = R.range(0, Math.PI * 2);   // a ribbon 24 m thick, denser at its heart
    off[i * 4] = Math.cos(a) * r; off[i * 4 + 1] = Math.sin(a) * r * 0.8; off[i * 4 + 2] = R(); off[i * 4 + 3] = R.range(0.9, 1.12) * (strand ? (o.strandScale ?? 1) : 1);
    if (!strand && i < nStrand + nBig) { const j = (i - nStrand + 0.5) / nBig; off[i * 4] = nearSide * RR * (1.15 + 0.9 * ((j * 7) % 1)); off[i * 4 + 1] = RR * (0.9 * ((j * 3) % 1) - 0.75); off[i * 4 + 3] = 2.1 + 0.9 * ((j * 5) % 1); }
    if (i % 400 === 399) await ctx.yield();
  }
  // (cure 8) THE BIRDS' BERTH: one law of the place for every bird of the block, ribbon and strand alike. The ribbon leaves
  // the crest across the course's last stretch, and a late bird from the far end of the rock came down to the eye's own
  // height there (a wing through the lens on one seed in a hundred, within a metre on another). So: a bird's WHOLE TRACK
  // (its perch, then every metre it flies before the journey's last second: the vertex shader's posAt, said again below
  // word for word) keeps o.berth metres of clear air, beyond its own half span at the level stroke, from the course's
  // whole line (o.course: [x, y, z, ...] in this frame, the path's own points at the eye's height). One that does not
  // flies higher in the skein: its own height in the tube (aOff.y) grows by the least that gives it its berth; its
  // perch, its second of release, its speed, its side of the tube and its wingbeat stay as dealt, and a bird that has
  // its berth is not touched. Lifted, never lowered: under the course lies the sea. The law asks no clock, no u of the
  // eye, no seed and no lens: nothing in it knows where the eye is, only where the course lies on the map.
  if (o.course) {
    const C = o.course, BERTH = o.berth ?? 2, DUR = o.duration ?? 42, TIP = Math.hypot(0.55, 0.09), CELL = 8, grid = new Map(), box = [Infinity, Infinity, Infinity, -Infinity, -Infinity, -Infinity];
    const cellOf = (x, z) => (Math.floor(x / CELL) + 4096) * 8192 + Math.floor(z / CELL) + 4096;
    for (let i = 0; i < C.length; i += 3) {
      const key = cellOf(C[i], C[i + 2]); if (!grid.has(key)) grid.set(key, []); grid.get(key).push(i);
      for (let j = 0; j < 3; j++) { box[j] = Math.min(box[j], C[i + j]); box[j + 3] = Math.max(box[j + 3], C[i + j]); }
    }
    const A = spl.map((v) => [v.x, v.y, v.z]), d0 = [D0.x, D0.y, D0.z], side = [-D0.z, 0, D0.x], sn = [sN.x, sN.y, sN.z], ln = [lens.x, lens.y, lens.z], at3 = [0, 0, 0];
    // where bird i is, q metres into its flight (posAt); with a true fourth word, how far its track and its line of leaving stand apart there
    const placeOf = (i, q, apart) => {
      const k = fly[i * 4 + 1], t = (q - fly[i * 4 + 2]) / Math.max(ln[k], 1), tc = Math.min(Math.max(t, 0), 1), m = 1 - tc, a = A[k * 4], b = A[k * 4 + 1], c = A[k * 4 + 2], d = A[k * 4 + 3];
      const wob = Math.sin(q * 0.035 + off[i * 4 + 2] * 6.2831853), w0 = Math.min(Math.max(q / (k === 2 ? 60 : 140), 0), 1), w = w0 * w0 * (3 - 2 * w0), nrm = k === 2 ? sn : side; let gap = 0;
      for (let j = 0; j < 3; j++) {
        const p = a[j] * m * m * m + b[j] * 3 * m * m * tc + c[j] * 3 * m * tc * tc + d[j] * tc * tc * tc, dv = (b[j] - a[j]) * 3 * m * m + (c[j] - b[j]) * 6 * m * tc + (d[j] - c[j]) * 3 * tc * tc;
        const sp = p + dv * (t - tc) + nrm[j] * (off[i * 4] + wob * 1.5) + (j === 1 ? off[i * 4 + 1] + wob : 0), lf = perch[i * 3 + j] + d0[j] * q + (j === 1 ? 14 * Math.min(Math.max(q / 50, 0), 1) : 0);
        at3[j] = lf + (sp - lf) * w; gap += (sp - lf) * (sp - lf);
      }
      return apart ? Math.sqrt(gap) : 0;
    };
    // the least clear air of bird i's whole track from the course. `pace` is the most its place can change in a metre of
    // flight (its leaving 1.28, its track by its longest control leg and its wander, and the blend of the two by how far
    // apart they stand while it runs). Where the course is near it is asked every 0.2 m of its place; where it is far,
    // as far on as its place can have changed by less than what it has to spare. 0.006 m: what the samplings and the
    // shader's single precision can miss at 2 m, on the safe side.
    const airOf = (i) => {
      const k = fly[i * 4 + 1], v = fly[i * 4 + 3], rad = TIP * off[i * 4 + 3] + 0.006, blend = k === 2 ? 60 : 140, qa = Math.max(-fly[i * 4], 0) * v, qb = Math.max(DUR - fly[i * 4], 0) * v;
      const leg = 3 * Math.max(...[0, 1, 2].map((n) => Math.hypot(A[k * 4 + n + 1][0] - A[k * 4 + n][0], A[k * 4 + n + 1][1] - A[k * 4 + n][1], A[k * 4 + n + 1][2] - A[k * 4 + n][2]))) / Math.max(ln[k], 1) + 0.0631;
      let apart = 0; for (let q = qa; q < Math.min(qb, blend) + 5; q += 5) apart = Math.max(apart, placeOf(i, q, true));
      const pace = Math.max(1.28, leg) + 1.5 / blend * (apart + 2.5 * (1.28 + leg)); let best = Infinity;
      for (let q = qa; ; ) {
        placeOf(i, q, false);
        const x = at3[0], y = at3[1], z = at3[2], bx = Math.max(box[0] - x, 0, x - box[3]), by = Math.max(box[1] - y, 0, y - box[4]), bz = Math.max(box[2] - z, 0, z - box[5]); let near = Math.hypot(bx, by, bz);
        if (near < BERTH + rad) {
          near = CELL;                                                      // nothing of the course in the nine cells about it: it is a cell away or more
          for (let cx = -1; cx <= 1; cx++) for (let cz = -1; cz <= 1; cz++) { const l = grid.get(cellOf(x + cx * CELL, z + cz * CELL)); if (l) for (const n of l) near = Math.min(near, Math.hypot(C[n] - x, C[n + 1] - y, C[n + 2] - z)); }
        }
        best = Math.min(best, near - rad);
        if (q >= qb) break;
        q = Math.min(q + Math.max(0.2, near - rad - BERTH) / pace, qb);
      }
      return best;
    };
    for (let i = 0; i < NT; i++) {
      for (let air = airOf(i), n = 0; air < BERTH && n < 400; n++) { off[i * 4 + 1] += Math.max(BERTH - air, 0.001); air = airOf(i); await ctx.yield(); }   // a metre of lift is worth a metre of air at most, so no step passes over a height that would do
      await ctx.yield();
    }
  }
  const g = ternGeometry();
  g.setAttribute('aPerch', new THREE.InstancedBufferAttribute(perch, 3)); g.setAttribute('aFly', new THREE.InstancedBufferAttribute(fly, 4)); g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
  g.instanceCount = NT;
  const U = S.uniforms, uT = { value: 0 }, uCamL = { value: new THREE.Vector3(0, 5, 0) };
  const tu = (pass) => ({ uK: U.uK, uW: U.uW, uPx: U.uPx, uTime: U.uTime, uT, uCamL, uSpl: { value: spl }, uSplLen: { value: lens }, uD0: { value: D0 }, uTernPx: { value: o.ternPx ?? 6.6 }, uStrandN: { value: sN }, uStrandPx: { value: o.strandPx ?? o.ternPx ?? 6.6 },
    uMoonDir: U.uMoonDir, uMoonTan: U.uMoonTan, uPass: { value: pass }, uTernSolid: { value: o.crescent ? 0 : 1 } });
  const mat = new THREE.ShaderMaterial({ uniforms: tu(0), vertexShader: TERN_VERT, fragmentShader: TERN_FRAG, side: THREE.DoubleSide, ...XOR_BLEND });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  const solid = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: tu(1), vertexShader: TERN_VERT, fragmentShader: TERN_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  solid.frustumCulled = false; solid.renderOrder = 3; mesh.add(solid);
  return { mesh, uT, uCamL, info: { crest, liftAt: lift, wave, speed, strandPoint: pass, strandAt: passAt, splines: spl, count: NT, strand: nS } };
}
