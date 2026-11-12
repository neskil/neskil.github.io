// Spore Rain: an October beech wood after rain at 150x life, seen from the back of a sprinting ground
// beetle. Leaf litter is the land, haircap moss the forest, a banded snail a striped hill, and a parasol
// mushroom a cathedral whose gills shed spores into the wood's one sunbeam.
//
// World space == the hero's local space: the parasol stands at the origin on a root bank whose top is
// y = 0; the litter floor is y = FLOOR (-12). The camera arrives from +Z heading -Z with the sun on its
// left (-X). Everything is self-lit by ShaderMaterials that share the hero's uniform table (pearl
// skylight, copper bounce, the one analytic shaft and the cap's shadow), so nothing needs a light.
//
// Close-range detail is the point of this world: litter leaves, haircap shoots and the mount each have a
// detailed mesh that is swapped for a cheap one beyond about 80 m (see lodChunks), and the leaf, moss and
// cuticle shaders resolve veins, star tips and granulation by the size of a pixel on the surface.
//
// Clear air by place (set at the build from the flown line alone; no lens, seed or share of the flight is read and no
// draw is taken; see CLEAR_AIR): a drip of the parasol or of the wood whose fall would come within 2.3 m of the flown
// line is made a bead that hangs and does not fall, and a gnat whose box of dance would come within 2.3 m of it is
// moved straight away from the line, in plan, until the box clears it.
import * as THREE from 'three';
import { makePath, makeRng } from '../kit/core.js';
import { buildHero, GLSL_COMMON, BEAD_FRAG, gridGeo, gridGeoAsync } from '../parts/spore-rain.js';

const TAU = Math.PI * 2;
const FLOOR = -12, EYE = 1.9, DUR = 42;
const PALETTE = ['#B5622B', '#5A2E17', '#4E7A2E', '#C9D4C2', '#F1E6C8', '#FFD27A', '#D8281C'];
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mixn = (a, b, t) => a + (b - a) * t;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ---------------------------------------------------------------- shaders
// VK (vertex): 0 static, 1 wind sway (aux.x = height weight; uMisc.w = distance at which instances have shrunk away),
// 2 walking legs (aux.x = leg weight, aux.y = -(1 + phase)), 3 snail sole wave, 4 gnat swarm (per-instance orbit,
// aux.x = wing weight), 5 litter leaf (each instance twists and cups by its own amount; uMisc.z = seed)
// FK (fragment): 0 litter floor, 1 vertex colour with fibre noise (aux.x = ao, aux.y = gloss), 2 beech leaf (aux = s along
// the midrib, q across in leaf lengths), 3 banded shell / zoned bracket (aux.x = band coordinate), 4 fly agaric cap,
// 5 bark (aux = around, along m; uMat.z = limb radius m), 6 cushion moss (aux.x = ao), 7 cuticle (vertex colour = structural sheen,
// aux = ao, sheen), 8 broken wood (aux = distance from the log's axis m, ao; uMisc.xy = the axis), 9 smooth beech bark on a bough
// or trunk (aux = around, along m; uMat.z = radius m)

// the litter leaf's own deformation, shared by the leaf and by the soft shade drawn under it
const LEAF_DEFORM = /* glsl */`
vec3 leafDeform(vec3 p, float id, float seed, float flatK, out float tw){
  float hA = fract(id * 0.618 + seed), hB = fract(id * 0.371 + 0.3 + seed);
  tw = (hA - 0.5) * 1.5 * p.x * flatK;
  float ct = cos(tw), st = sin(tw);
  p.yz = vec2(ct * p.y - st * p.z, st * p.y + ct * p.z);
  p.y += (hB - 0.4) * 1.5 * p.z * p.z * flatK;
  return p;
}`;

const W_VERT = /* glsl */`
attribute vec3 aCol;
attribute vec2 aux;
uniform vec4 uMisc;      // x amplitude (wind m / leg swing), y gait or wind phase, z, w free
varying vec3 vL, vN, vP, vCol;
varying vec2 vAux;
#ifdef PILL
  varying vec2 vPill;       // a pill millipede's plate: its own two random numbers (instanceColor.yz; instanceColor.x = how far it is rolled up)
#endif
#include <fog_pars_vertex>
${GLSL_COMMON}
${LEAF_DEFORM}
void main(){
  vec3 p = position; vec3 n = normal; float id = 0.0;
  #ifdef USE_INSTANCING
    id = float(gl_InstanceID);
  #endif
  #if VK == 2
    float lw = step(aux.y, -0.5) * aux.x;
    float ph = uMisc.y + (-aux.y - 1.0) * 3.14159 + id * uMisc.z;
    p.z += lw * uMisc.x * sin(ph);
    p.y += lw * uMisc.x * 0.55 * max(cos(ph), 0.0);
  #endif
  #if VK == 3
    p.y += (1.0 - aux.x) * 0.07 * sin(p.z * 2.6 + uTime * 2.2) * step(p.y, 0.5);
    p.x *= 1.0 + 0.02 * sin(p.z * 2.6 + uTime * 2.2);
  #endif
  #if VK == 4
    p.y += step(aux.y, -0.5) * aux.x * abs(p.x) * 1.1 * sin(uTime * 55.0 + id * 1.3);
  #endif
  #if VK == 5
    float flatK = 1.0;
    #ifdef USE_INSTANCING
      flatK = smoothstep(0.3, 0.8, length(instanceMatrix[1].xyz) / max(length(instanceMatrix[0].xyz), 1e-3));
    #endif
    float tw5;
    p = leafDeform(p, id, uMisc.z, flatK, tw5);
    float c5 = cos(tw5), s5 = sin(tw5);
    n.yz = vec2(c5 * n.y - s5 * n.z, s5 * n.y + c5 * n.z);
  #endif
  #ifdef PILL
    vPill = vec2(0.5);
    #ifdef USE_INSTANCING_COLOR
      // as the animal rolls up its legs fold away under the belly: a ball shows only plates
      float tuck = step(aux.y, -0.5) * instanceColor.x;
      p.x *= 1.0 - 0.5 * tuck; p.y = mix(p.y, -0.2, 0.85 * tuck);
      vPill = instanceColor.yz;
    #endif
  #endif
  vP = p;
  #ifdef USE_INSTANCING
    p = (instanceMatrix * vec4(p, 1.0)).xyz; n = mat3(instanceMatrix) * n;
  #endif
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 wn = mat3(modelMatrix) * n;
  #if VK == 1
    float g1 = sin(uTime * 0.9 + wp.x * 0.05 + wp.z * 0.07) * 0.6 + sin(uTime * 2.3 + id * 1.3 + wp.x * 0.31) * 0.4;
    float g2 = cos(uTime * 1.1 + id * 0.7 + wp.z * 0.23);
    float w2 = aux.x * aux.x * uMisc.x;
    wp.x += w2 * g1; wp.z += w2 * 0.6 * g2;
    #ifdef USE_INSTANCING
      vec3 basePos = (modelMatrix * vec4(instanceMatrix[3].xyz, 1.0)).xyz;
      float gone = smoothstep(uMisc.w * 0.72, uMisc.w, length(basePos - uCamL)) * step(1.0, uMisc.w);
      wp.xyz = mix(wp.xyz, basePos, gone);
    #endif
  #endif
  #if VK == 4
    float h1 = fract(id * 0.618), h2 = fract(id * 0.371 + 0.2), h3 = fract(id * 0.137 + 0.6);
    float t = uTime * (0.7 + 0.6 * h1);
    wp.xyz += vec3(sin(t * 1.3 + h2 * 6.28) * (0.8 + 1.6 * h3), sin(t * 2.9 + h1 * 6.28) * 0.9 + sin(t * 0.7 + h3 * 6.28) * 0.6, cos(t * 1.1 + h3 * 6.28) * (0.8 + 1.6 * h2));
  #endif
  #if VK == 5
    // one leaf in five rocks on its keel as drips land on it
    wp.y += (aux.x - 0.5) * 0.22 * flatK * sin(uTime * (0.5 + fract(id * 0.618)) + id * 1.7) * step(0.8, fract(id * 0.371 + 0.3));
  #endif
  vL = wp.xyz; vN = wn; vCol = aCol; vAux = aux;
  #if defined(USE_INSTANCING_COLOR) && !defined(PILL)
    vCol *= instanceColor;
  #endif
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// the soft shade a litter leaf lays on whatever is under it: the leaf's outline, a little larger, drawn just below it
// and multiplied into the picture. It follows the leaf's own twist so it never shows through the leaf itself.
const SHADE_VERT = /* glsl */`
attribute vec2 aux;
uniform vec4 uMisc;
varying float vA;
varying float vFogD;
${LEAF_DEFORM}
void main(){
  float flatK = smoothstep(0.3, 0.8, length(instanceMatrix[1].xyz) / max(length(instanceMatrix[0].xyz), 1e-3));
  float tw;
  vec3 p = leafDeform(position, float(gl_InstanceID), uMisc.z, flatK, tw);
  vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(p, 1.0);
  // a leaf that stands on edge shades nothing: its outline would hang in the air as a dark fringe
  vec3 upI = instanceMatrix[1].xyz;
  vA = aux.x * smoothstep(0.6, 0.88, abs(upI.y) / max(length(upI), 1e-4)); vFogD = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SHADE_FRAG = /* glsl */`
uniform float fogDensity;
uniform vec4 uMisc;
varying float vA;
varying float vFogD;
void main(){
  float f = exp(-fogDensity * fogDensity * vFogD * vFogD);
  float a = vA * vA * (3.0 - 2.0 * vA) * uMisc.x * f;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a);
}`;

// scattered beech leaves over a plane: shared by the litter floor and by the canopy dome's below-horizon floor
const LEAF_GLSL = /* glsl */`
vec2 h22(vec2 p){ vec3 a = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); a += dot(a, a.yzx + 33.33); return fract((a.xx + a.yz) * a.zy); }
// half width of a beech leaf at s along its midrib (0 base, 1 tip), in leaf lengths
float leafWid(float s){ return 0.33 * pow(max(sin(3.14159 * pow(clamp(s, 0.0, 1.0), 0.8)), 0.0), 0.75); }
// one layer of leaves: returns the covering leaf's priority (< 0: none), its coordinates (s along the midrib, q across in
// leaf lengths), its id, the distance in from its margin, its length in cells, and how far outside the nearest leaf of
// this layer the point lies (cells; large when inside one or far from any)
float leafCell(vec2 g, float seed, out vec2 buv, out float bid, out float bedge, out float blen, out float bnear){
  vec2 ci = floor(g), cf = fract(g); float best = -1.0; buv = vec2(0.0); bid = 0.0; bedge = 0.0; blen = 1.0; bnear = 1.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j));
    vec2 rr = h22(ci + o + seed);
    vec2 rs = h22(ci + o + 17.3 + seed);
    vec2 d = cf - o - rr;
    float a = rs.x * 6.28318; float ca = cos(a), sa = sin(a);
    float sc = 1.3 + 0.55 * rs.y;
    vec2 q = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y) / sc;
    float s = clamp(q.x + 0.5, 0.0, 1.0);
    float e = leafWid(s) - abs(q.y);
    float pri = fract(rs.y * 5.3 + rr.x * 0.37);
    if (abs(q.x) < 0.5 && sc * 0.5 < 1.0) {
      if (e > 0.0) { if (pri > best) { best = pri; buv = vec2(s, q.y); bid = rr.y; bedge = e; blen = sc; } }
      else bnear = min(bnear, -e * sc);
    }
  }
  return best;
}`;

const W_FRAG = /* glsl */`
uniform vec3 cCopper, cUmber, cMoss, cPearl, cCream, cGold;
uniform vec3 uKeyDir, uKeyCol, uTone0, uTone1, uTone2, uTone3;
uniform vec4 uMisc, uMat, uArc;     // uMat: x gloss, y translucency, z fibre scale (FK 2: leaf length m), w pattern variant; uArc: the arcade (z0, z1, floor, height)
uniform float uSeed, uNight;
varying vec3 vL, vN, vP, vCol;
varying vec2 vAux;
#ifdef PILL
  varying vec2 vPill;
#endif
#include <fog_pars_fragment>
${GLSL_COMMON}
${LEAF_GLSL}
// what leafSurf found last, for the relief a fallen leaf shows near the eye: x = how well its pleats are resolved, y = the
// crown of a pleat, z = the curled rim just inside its margin (crowns and rim are broken along the leaf, as a dead leaf's
// are), w = which flank of a pleat this is (-1..1: the flank toward the leaf's tip is the lit one, by the leaf's own measure)
vec4 gLeaf = vec4(0.0);
float gGroove = 0.0;          // and the groove a side vein runs in
// the relief's measure: above 1 on the crowns and the lit flank, below 1 in the grooves and on the shaded flank (0.36 at
// the least: 0.66 * 0.76 * 0.72). rel = the leaf's height 0..1 (the arcade walls' measure)
float leafRelief(float rel){ return (0.66 + 0.5 * rel) * (1.0 + 0.24 * gLeaf.w) * (1.0 - 0.28 * gGroove); }
// The relief itself, eased in by k. A groove is deep umber, not black: where the measure brightens, the leaf's colour is
// multiplied by it; where it darkens, the leaf goes toward the litter's own deep umber (the bed's) and stops at
// RELIEF_FLOOR of its own colour, whichever is the brighter, and a leaf already darker than that keeps its colour.
const float RELIEF_FLOOR = 0.6;
vec3 leafRelieved(vec3 leaf, float rel, float k){
  float m = leafRelief(rel);
  vec3 deep = min(leaf, max(leaf * RELIEF_FLOOR, cUmber * 0.9 + 0.012));
  // (how far into the groove: 0 where the measure is 1, 1 where it is at its least; 1.5625 = 1 / 0.64)
  float t = clamp((1.0 - m) * 1.5625, 0.0, 1.0);
  return mix(leaf, mix(leaf * max(m, 1.0), deep, t), k);
}
// dpx, dpy: the screen derivatives of the point; hx, hy: those of a height in metres; k scales it. (The four derivatives
// are taken by main, on every pixel: not in here, which only some pixels call.)
vec3 bumpN(vec3 N, vec3 dpx, vec3 dpy, float hx, float hy, float k){
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 g = sign(det) * (hx * r1 + hy * r2);
  return normalize(abs(det) * N - k * g + N * 1e-6);
}
// the canopy as a wet surface mirrors it: bright gaps between leaf masses
vec3 skyRefl(vec3 R){
  float n = vnoise(vec3(R.xz / (abs(R.y) + 0.4) * 2.2, 3.0));
  return uSkyCol * (0.5 + 1.3 * smoothstep(0.42, 0.72, n));
}
// A beech leaf's surface. s along the midrib 0..1, q across (leaf lengths), e distance in from the margin, id random,
// tone its colour, d = (ds/dx, dq/dx, ds/dy, dq/dy): the footprint of a pixel on the leaf. Every line is filtered by its own
// footprint, so a leaf seen edge-on is the same leaf, only smoother: no dashes, no dither. Writes albedo, a soft height
// 0..1 (pleats between the side veins, the midrib sunk) and gl (x = a water bead's glint, y = its shade); returns x = 1 in
// a hole or outside the toothed margin, y = how wet the spot is.
vec2 leafSurf(float s, float q, float e, float id, vec3 tone, vec4 d, out vec3 alb, out float h, out vec2 gl){
  float aq = abs(q), sg = q < 0.0 ? -1.0 : 1.0;
  float fwS = abs(d.x) + abs(d.z), fwQ = abs(d.y) + abs(d.w);
  float fwMax = max(length(d.xy), length(d.zw)) + 1e-6;
  // side veins: seven or eight pairs, straight and parallel, bending toward the tip only at the margin
  float kq = (0.95 + 2.2 * aq) * sg;
  float vc = (s - aq * 0.95 - aq * aq * 1.1) * 8.0 + id * 7.0 + step(0.0, q) * 0.5;
  float wv = 8.0 * (abs(d.x - kq * d.y) + abs(d.z - kq * d.w)) + 1e-4;      // veins per pixel
  float fv = fract(vc), dl = min(fv, 1.0 - fv);
  float hw = 0.045 + 0.02 * (1.0 - s);
  float side = clamp((hw - dl) / wv + 0.5, 0.0, 1.0) * min(1.0, 2.0 * hw / wv);
  side = mix(side, 2.0 * hw, smoothstep(0.22, 0.6, wv)) * smoothstep(0.02, 0.07, s) * smoothstep(0.0, 0.02, aq);
  float kPl = 1.0 - smoothstep(0.18, 0.5, wv);
  float pleat = mix(0.5, 0.5 - 0.5 * cos(6.28318 * fv), kPl) * smoothstep(0.0, 0.05, aq);
  float hm = 0.0045 + 0.009 * (1.0 - s);
  float mid = clamp((hm - aq) / (fwQ + 1e-5) + 0.5, 0.0, 1.0) * min(1.0, 2.0 * hm / (fwQ + 1e-5));
  vec3 pn = vec3(s * 70.0, q * 70.0, id * 31.0);
  float kFine = 1.0 - smoothstep(0.003, 0.009, fwMax), kMid = 1.0 - smoothstep(0.012, 0.035, fwMax);
  float n1 = mix(0.5, vnoise(pn), kFine), n2 = vnoise(pn * 0.14 + 5.0), n3 = vnoise(pn * 0.045 + 11.0);
  float rot = smoothstep(0.58, 0.8, vnoise(pn * 0.09 + 23.0));
  float spot = smoothstep(0.78, 0.88, vnoise(pn * 0.45 + 3.0)) * kMid;
  alb = tone * (0.76 + 0.4 * n3 + 0.12 * n2) * (0.93 + 0.14 * n1);
  alb = mix(alb, tone * vec3(1.2, 1.12, 0.55), smoothstep(0.5, 0.85, n3) * 0.3);
  alb = mix(alb, cUmber * 0.45, rot * 0.5);
  // the blade is paler on the crown of each pleat and dark in the vein's groove: soft tonal ridges, no relief needed
  alb *= (1.0 - 0.45 * spot) * (0.86 + 0.2 * pleat) * (1.0 - 0.5 * side) * (1.0 - 0.55 * mid);
  // the margin: a dark line where the blade ends, a dry pale rim just inside it
  float rimW = 0.012 + 1.5 * fwQ;
  alb *= 0.5 + 0.5 * smoothstep(0.0, rimW * 0.6, e);
  alb += tone * 0.2 * smoothstep(rimW * 3.0, rimW, e) * smoothstep(0.0, rimW * 0.6, e);
  gLeaf = vec4(kPl, kPl * smoothstep(0.9, 0.995, 0.5 - 0.5 * cos(6.28318 * (fv - 0.1))) * smoothstep(0.02, 0.08, aq) * smoothstep(0.3, 0.6, n2),
    smoothstep(rimW * 3.0, rimW, e) * smoothstep(0.0, rimW * 0.6, e) * smoothstep(0.35, 0.6, n3), kPl * sin(6.28318 * fv) * smoothstep(0.0, 0.05, aq));
  gGroove = kPl * (1.0 - smoothstep(hw, 0.13, dl)) * smoothstep(0.02, 0.07, s) * smoothstep(0.0, 0.03, aq);
  h = pleat * 0.45 * kPl - mid * 0.35 + 0.3 * n2;
  // water beads sitting on the blade: a lens that darkens what is under it, with one sharp point of sky
  float kDrop = 1.0 - smoothstep(0.0016, 0.004, fwMax);
  vec2 dg = vec2(s, q) * 15.0, dr = h22(floor(dg) + id * 91.0), dc = fract(dg) - 0.25 - 0.5 * dr;
  float rad = 0.07 + 0.13 * dr.x, dd = length(dc), on = step(0.74, dr.y) * kDrop * (1.0 - uFrost);
  float bead = on * (1.0 - smoothstep(rad * 0.8, rad, dd));
  gl = vec2(on * (1.0 - smoothstep(rad * 0.12, rad * 0.3, length(dc - vec2(-0.3, 0.32) * rad))), bead);
  alb *= 1.0 - 0.3 * bead * smoothstep(rad * 0.3, rad, dd) - 0.25 * on * (1.0 - smoothstep(rad, rad * 1.25, dd)) * (1.0 - bead);
  // (teeth, nibbles and holes are cut out of the blade only where a pixel is much smaller than they are: they are gone
  // before the cutting stops, so a margin seen edge-on is one clean line and never a row of dashes)
  float kCut = 1.0 - smoothstep(0.003, 0.006, fwMax);
  float hole = smoothstep(0.84, 0.87, vnoise(pn * 0.1 + 41.0) + 0.12 * n2) * (1.0 - mid) * (1.0 - side * 0.7) * step(0.012, e) * kCut;
  // (a wall of the arcade, uMat.w = 1, is an old leaf eaten through between its veins: the light comes through the holes)
  hole = max(hole, step(0.5, uMat.w) * smoothstep(0.77, 0.8, vnoise(pn * 0.21 + 17.0) + 0.1 * n2) * (1.0 - mid) * (1.0 - side) * step(0.02, e) * kCut);
  float teeth = 0.013 * (0.5 - 0.5 * cos(6.28318 * fv)) * kMid * smoothstep(0.08, 0.2, s) * kCut;
  float nib = 1.0 - step(max(teeth, 0.03 * smoothstep(0.5, 0.82, vnoise(pn * 0.22 + 7.0)) * kCut), e);
  return vec2(max(hole, nib), 0.55 + 0.9 * smoothstep(0.35, 0.7, n3 + 0.3 * (1.0 - n2)));
}
// Hoar's own glints: sparse cold points along the margin and the midrib of a frosted leaf. Each is fixed to its place on
// the leaf (s along the midrib, q across; d = a pixel's footprint on the leaf), is drawn as a round point three to four
// pixels across whatever the distance, and brightens and dims on its own slow clock (0.25 to 1.1 times a second).
// They are gone where the leaf is so far that the points would not stand apart.
float hoarGlint(float s, float q, float id, vec4 d){
  const float G = 22.0;
  float kG = 1.0 - smoothstep(0.2, 0.45, G * (max(length(d.xy), length(d.zw)) + 1e-6));
  if (kG <= 0.0) return 0.0;
  float ci = floor(s * G);
  vec2 r1 = h22(vec2(ci, floor(id * 977.0)) + 3.1), r2 = h22(vec2(ci, floor(id * 977.0)) + 61.7), r3 = h22(vec2(ci, floor(id * 977.0)) + 127.3);
  float sc = (ci + 0.3 + 0.4 * r1.x) / G;
  float qm = (q < 0.0 ? -1.0 : 1.0) * max(leafWid(sc) - 0.004 - 0.014 * r1.y, 0.0), qr = (r2.y - 0.5) * 0.014;
  float det = d.x * d.w - d.z * d.y; det = (det < 0.0 ? -1.0 : 1.0) * max(abs(det), 1e-10);
  vec2 a = vec2(s - sc, q - qm), b = vec2(s - sc, q - qr);
  float la = length(vec2(d.w * a.x - d.z * a.y, d.x * a.y - d.y * a.x)) / abs(det), lb = length(vec2(d.w * b.x - d.z * b.y, d.x * b.y - d.y * b.x)) / abs(det);
  float onM = step(0.5, fract(r3.x * 7.3 + (q < 0.0 ? 0.37 : 0.0))), onR = step(0.65, r3.y);
  float twM = 0.5 + 0.5 * sin(uTime * (1.6 + 5.3 * r2.x) + r1.y * 40.0 + (q < 0.0 ? 2.0 : 0.0)), twR = 0.5 + 0.5 * sin(uTime * (1.6 + 5.3 * r3.x) + r2.y * 40.0);
  float g = onM * (0.15 + 0.85 * twM * twM * twM) * (1.0 - smoothstep(0.7, 2.2, la)) + onR * (0.15 + 0.85 * twR * twR * twR) * (1.0 - smoothstep(0.7, 2.2, lb));
  return min(g, 1.0) * kG;
}
// moss turf from above: a mat of star-shaped shoot tips of two sizes, no two alike. p in metres; returns x = tone 0..1
// (pale young tips), y = height 0..1
vec3 mossStar(vec2 g){
  vec2 ci = floor(g), cf = fract(g); float d1 = 4.0; vec2 dv = vec2(1.0, 0.0); float idc = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)); vec2 r = h22(ci + o + 3.7); vec2 d = cf - o - r; float l = dot(d, d);
    if (l < d1) { d1 = l; dv = d; idc = r.x; }
  }
  float r = sqrt(d1);
  float ang = atan(dv.y, abs(dv.x) + abs(dv.y) < 1e-4 ? 1.0 : dv.x);
  float rays = 0.5 + 0.5 * cos(ang * (5.0 + floor(idc * 3.99)) + idc * 20.0);
  float star = (1.0 - smoothstep(0.0, 0.5 + 0.2 * idc, r)) * mix(1.0, 0.2 + 0.8 * rays, smoothstep(0.05, 0.26, r));
  return vec3(star, idc, r);
}
vec2 mossTex(vec2 p, float fine){
  vec3 a = mossStar(p * 4.3), b = mossStar(p * 2.2 + 17.0);
  float star = max(a.x * (0.6 + 0.4 * b.y), b.x * 0.75);
  float tone = clamp(star * (0.7 + 0.6 * a.y) + 0.35 * (b.y - 0.5), 0.0, 1.0);
  return vec2(mix(0.42, tone, fine), mix(0.42, star, fine));
}
// one family of creases running round a limb. s = the crease coordinate (one crease to a unit), fs = a pixel measured
// in s (taken by the caller), hw = half the dark line's width in s. Returns x = the dark hairline, y = the pale lip that
// stands beside it, z = the soft groove round it (for the relief). Thinner than a pixel it fades to its own average.
vec3 crease(float s, float fs, float hw){
  float fr = fract(s) - 0.5, k = 1.0 - smoothstep(0.3, 0.75, fs);
  float ln = clamp((hw - abs(fr)) / fs + 0.5, 0.0, 1.0) * min(1.0, 2.0 * hw / fs);
  float lp = clamp((hw - abs(fr - hw * 2.1)) / fs + 0.5, 0.0, 1.0) * min(1.0, 2.0 * hw / fs);
  return vec3(ln, lp, 1.0 - smoothstep(0.0, hw * 5.0 + fs, abs(fr))) * k;
}
void main(){
  vec3 N = normalize(vN + vec3(0.0, 1e-5, 0.0));
  if (!gl_FrontFacing && (uMat.w < 1.5 || uMat.w > 2.5)) N = -N;
  vec3 toCam = uCamL - vL; float dist = length(toCam) + 1e-3;
  vec3 V = toCam / dist;
  #if FK == 7
    if (dot(N, V) < 0.0) N = -N;          // cuticle always shows its outside, whichever way its mesh is wound
  #endif
  vec3 alb = vCol; float gloss = uMat.x, ao = 1.0, sss = uMat.y, h = 0.0, bumpK = 0.0;
  vec2 glint = vec2(0.0);
  float rime = 0.1;           // where hoar frost grows on a frosty morning: margins, ribs and tips, not blotches
  float crest = 0.0, hoar = 0.0;        // a near fallen leaf's lit crowns and rim; hoar's glints
  float nearK = 1.0 - smoothstep(50.0, 170.0, dist);
  // a pixel that is cut away (a leaf's holes and teeth, a trunk lost in its crown) is only marked where the cut is decided
  // and is thrown away further down, after the last derivative: one taken beside a pixel already gone is not defined
  bool cut = false;
  #if FK == 0
    // ---- litter floor: two layers of overlapping beech leaves over wet humus, with moss
    float fwm = max(fwidth(vL.x), fwidth(vL.z));
    vec2 buv, uvB; float bid, idB, bedge, eB, blen, lenB, nearT, nearB;
    float best = leafCell(vL.xz / 6.6, uSeed, buv, bid, bedge, blen, nearT);
    float pB = leafCell(vL.xz / 5.7 + 37.7, uSeed + 5.0, uvB, idB, eB, lenB, nearB);
    float under = 0.0, cell = 6.6;
    if (best < 0.0 && pB >= 0.0) { buv = uvB; bid = fract(idB + 0.37); bedge = eB; blen = lenB; best = pB; under = 1.0; cell = 5.7; }
    vec4 dB = vec4(dFdx(buv), dFdy(buv));                 // a pixel's footprint on the covering leaf
    dB = clamp(dB, vec4(-0.25), vec4(0.25));
    float fineK = 1.0 - smoothstep(10.0, 42.0, dist);
    float n1 = vnoise(vL * 0.35 + uSeed), n2 = vnoise(vL * 1.7), n3 = vnoise(vL * 6.0) * fineK + 0.5 * (1.0 - fineK);
    float mossy = smoothstep(0.52, 0.7, 0.55 * fbm3(vL * 0.045 + uSeed) + 0.25 * n1 + vAux.x * 0.75);
    // the bed between leaves: wet black humus, leaf skeletons and crumbs
    float crumb = vnoise(vL * 13.0) * fineK;
    // (the bed is itself old leaves pressed flat: their midribs show as pale threads)
    float sk = (1.0 - smoothstep(0.0, 0.05, abs(vnoise(vL * 0.9 + 31.0) - 0.5))) * fineK;
    vec3 bed = mix(cUmber * 0.9 + 0.012, uTone3 * 0.7, smoothstep(0.3, 0.7, n1)) * (0.62 + 0.5 * n2) * (0.75 + 0.5 * crumb) * (1.0 + 0.7 * sk);
    alb = bed; gloss = 0.8; h = n2 * 0.05 + n3 * 0.03 + crumb * 0.02; sss = 0.0; ao = 0.78;
    if (best >= 0.0) {
      vec3 tone = bid < 0.25 ? uTone0 : bid < 0.5 ? uTone1 : bid < 0.75 ? uTone2 : uTone3;
      tone = mix(tone, cGold * 0.5, step(0.86, fract(bid * 11.3)) * 0.4);
      tone *= 0.74 + 0.5 * fract(bid * 7.3);
      float lenM = cell * blen;
      vec3 leaf; float lh;
      // one leaf in eight is lemon, one in eight nearly black with wet: neighbours never match
      tone = mix(tone, cGold * 0.62, step(0.875, fract(bid * 23.7)) * 0.7);
      tone *= 1.0 - 0.5 * step(fract(bid * 31.3), 0.125);
      vec2 ls = leafSurf(buv.x, buv.y, bedge, bid, tone, dB, leaf, lh, glint);
      float edgeK = smoothstep(0.0, 0.004 + fwm / lenM, bedge) * (1.0 - ls.x);
      glint *= edgeK;
      // near the eye a fallen leaf is a leaf, not paving: the pleats between its veins stand in relief, bright on their
      // crowns and deep umber in the grooves (the arcade walls' own measure, eased in), and the crowns and the curled margin
      // catch the sky. Whole within 6 m of the eye, gone by 18 m: beyond that the floor is as it was.
      float relK = (1.0 - smoothstep(6.0, 18.0, dist)) * gLeaf.x;
      leaf = leafRelieved(leaf, clamp(lh * 1.7, 0.0, 1.0), relK);
      crest = relK * edgeK * (0.3 * gLeaf.y + 0.45 * gLeaf.z) * (1.0 - 0.4 * under);
      if (uFrost > 0.5) hoar = hoarGlint(buv.x, buv.y, bid, dB) * edgeK;
      leaf *= 1.0 - 0.3 * under;
      // hyphae: white threads wandering over some leaves
      float hy = (1.0 - smoothstep(0.0, 0.012 + fwm * 0.06, abs(vnoise(vL * 0.8 + 4.0) - 0.5))) * step(0.7, fract(bid * 3.7)) * fineK * smoothstep(0.3, 0.6, vnoise(vL * 0.21));
      leaf = mix(leaf, cCream * 0.75, hy * 0.55);
      // every leaf lies at its own tilt, with its margin curled up off the one below
      float rim = 1.0 - smoothstep(0.0, 0.035, bedge);
      float tilt = (buv.y * (fract(bid * 9.1) - 0.5) * 0.7 + (buv.x - 0.5) * (fract(bid * 13.7) - 0.5) * 0.35) * lenM;
      alb = mix(bed, leaf, edgeK);
      h = mix(h, tilt + lh * 0.007 * lenM + rim * 0.1 + 0.12 + 0.1 * fract(bid * 5.1), edgeK);
      gloss = mix(gloss, 0.62 * ls.y, edgeK); ao = mix(ao, 1.0, edgeK) * (1.0 - 0.2 * under);
      h += edgeK * relK * lh * 0.012 * lenM;
      // hoar is a hairline fringe: 0.01 of the leaf's length in from the margin (it was 0.05) and 0.005 across the midrib
      // (it was 0.024), each no thinner on screen than a pixel and paler as it thins
      // (a pixel measured across the midrib and across the margin, not along them: a rib running away from the eye stays a hairline)
      float fwL = fwm / lenM + 1e-5, fwR = min(fwL, abs(dB.y) + abs(dB.w) + 1e-5), fwE = min(fwL, fwR + 0.35 * (abs(dB.x) + abs(dB.z)));
      float rimeM = (1.0 - smoothstep(0.01 - 0.5 * fwE, 0.01 + 0.5 * fwE, bedge)) * min(1.0, 0.016 / fwE);
      float rimeR = (1.0 - smoothstep(0.0, 0.0025 + fwR, abs(buv.y))) * min(1.0, 0.008 / fwR) * (1.0 - smoothstep(0.01, 0.04, fwL));
      rime = mix(0.15, max(rimeM, 0.7 * rimeR), edgeK);
    }
    // shade under the raised margins of the leaves above
    if (under > 0.5 || best < 0.0) ao *= 0.72 + 0.28 * smoothstep(0.0, 0.055, nearT);
    if (best < 0.0) ao *= 0.86 + 0.14 * smoothstep(0.0, 0.05, nearB);
    float fineM = 1.0 - smoothstep(7.0, 30.0, dist);
    vec2 mt = mossTex(vL.xz, fineM);
    // turf: dark between the shoots, olive stars, young tips pale; broad drifts of deeper and yellower moss
    float drift = vnoise(vL * 0.23 + 7.0);
    vec3 moss = mix(cMoss * 0.78, mix(cMoss * 1.08, mix(cMoss, cGold, 0.45) * 1.15, smoothstep(0.55, 0.95, mt.x)), smoothstep(0.08, 0.6, mt.x));
    moss *= (0.82 + 0.3 * n2) * (0.86 + 0.3 * drift);
    moss += uSkyCol * 0.03;                 // a little of the sky lies even in the gaps between shoots
    // further off the stars are lost, and the turf shows as tufts with the dark between them
    float tuftK = smoothstep(0.3, 0.64, 0.6 * vnoise(vec3(vL.xz * 0.9, 3.0)) + 0.4 * vnoise(vec3(vL.xz * 2.3, 11.0)));
    moss *= mix(1.0, 0.6 + 0.7 * tuftK, 1.0 - 0.7 * fineM);
    moss = mix(moss, mix(cMoss, cGold, 0.5) * 1.1, smoothstep(0.8, 1.0, tuftK) * 0.5 * (1.0 - fineM));
    moss = mix(moss, cUmber * 0.6, smoothstep(0.62, 0.8, vnoise(vL * 0.6 + 19.0)) * 0.22);
    alb = mix(alb, moss, mossy); gloss = mix(gloss, 0.12, mossy); h = mix(h, mt.y * 0.3 + n2 * 0.12, mossy);
    ao = mix(ao, 0.86 + 0.14 * mt.y, mossy) * (1.0 - vAux.y * (1.0 - 0.5 * mossy));       // the shade between painted leaves is not laid on moss
    // beads of water sit in the moss
    vec2 bc = vL.xz * 1.9; vec2 br = h22(floor(bc) + 57.0);
    float bead = step(0.8, br.x) * (1.0 - smoothstep(0.035, 0.085, length(fract(bc) - 0.25 - 0.5 * br))) * (1.0 - smoothstep(18.0, 42.0, dist));
    glint = glint * (1.0 - mossy) + vec2(bead * mossy, 0.0);
    rime = mix(rime, mix(0.4, smoothstep(0.4, 0.9, mt.x), fineM), mossy);
    bumpK = nearK * (0.3 + 0.7 * fineK) * (1.0 - smoothstep(0.02, 0.12, fwm));
  #elif FK == 1
    float f3 = vnoise(vP * uMat.z * vec3(1.0, 0.3, 1.0) + uSeed); float g3 = vnoise(vP * uMat.z * 0.23 + uSeed);
    alb = vCol * (0.82 + 0.3 * f3) * (0.86 + 0.26 * g3);
    float wk = step(0.5, uMat.w) * step(uMat.w, 1.5), fine1 = 1.0 - smoothstep(8.0, 32.0, dist);
    // (two fields at an angle to each other: no lattice shows in the warts)
    vec3 pw = vP * uMat.z * 1.4;
    float wsp = smoothstep(0.42, 0.7, 0.55 * vnoise(pw + 11.0) + 0.45 * vnoise(vec3(0.8 * pw.x + 0.6 * pw.z, 1.1 * pw.y + 0.35 * pw.x, 0.8 * pw.z - 0.6 * pw.x) * 1.6 + 3.0));
    alb *= mix(1.0, 0.9 + 0.2 * wsp, wk * fine1);
    h = f3 * 0.6 + g3 + wsp * 1.3 * wk; bumpK = (0.03 + 0.035 * wk) * nearK * (0.3 + 0.7 * fine1); ao = vAux.y < 0.0 ? 0.85 : vAux.x; gloss = uMat.x * abs(vAux.y);
    if (uMat.w > 2.5) {
      // a common puffball is studded with pearly cones, big ones ringed by small, over a tan net
      vec3 g = vP * 1.9, cb = floor(g - 0.5), cf = g - cb; float d1 = 9.0, d2 = 9.0, idc = 0.0;
      for (int k = 0; k < 8; k++) {
        vec3 o = vec3(float(k - (k / 2) * 2), float((k / 2) - (k / 4) * 2), float(k / 4));
        float hx = h31(cb + o), hy = h31(cb + o + 17.3), hz = h31(cb + o + 41.9);
        float dd = length(cf - o - 0.2 - 0.6 * vec3(hx, hy, hz));
        if (dd < d1) { d2 = d1; d1 = dd; idc = hx; } else d2 = min(d2, dd);
      }
      float rad = 0.2 + 0.2 * idc;
      float stud = (1.0 - smoothstep(rad * 0.35, rad, d1)) * fine1;
      alb = mix(alb * (0.74 + 0.2 * smoothstep(0.0, 0.25, d2 - d1)), cCream * 0.86, stud * 0.85);
      h = stud * 1.4 + f3 * 0.3; bumpK = 0.11 * nearK * (0.3 + 0.7 * fine1); gloss *= 1.0 - 0.5 * stud;
    }
    #if VK == 1
      rime = 0.08 + 0.42 * smoothstep(0.66, 1.05, vAux.x);         // the tips of shoots and tufts
    #endif
  #elif FK == 2
    // ---- a beech leaf as a mesh: veined, pleated, blotched, holed, paler beneath
    float fw2 = max(fwidth(vAux.x), fwidth(vAux.y));
    vec4 d2 = vec4(dFdx(vAux), dFdy(vAux));
    float fwQ2 = fwidth(vAux.y), fwM2 = fwidth(leafWid(vAux.x) - abs(vAux.y));       // a pixel measured across the midrib, and across the margin
    if (vAux.x < -0.01) {
      // the leaf's stalk
      alb = vCol * vec3(0.5, 0.42, 0.34) * (0.8 + 0.4 * vnoise(vP * 40.0)); gloss = 0.5; sss = 0.0;
    } else {
      float e2 = leafWid(vAux.x) - abs(vAux.y);
      vec3 leaf2; float lh2;
      vec2 ls2 = leafSurf(vAux.x, vAux.y, max(e2, 0.0), fract(vCol.r * 7.0 + vCol.b * 13.0), vCol, d2, leaf2, lh2, glint);
      if (ls2.x > 0.5 && fw2 < 0.012) cut = true;          // (decided here, thrown away after the relief's derivatives)
      alb = leaf2;
      // beneath, a beech leaf is paler and matt, its veins standing proud
      if (!gl_FrontFacing) { alb = alb * vec3(0.9, 0.88, 0.84) + 0.025; glint *= step(0.5, uMat.w); }
      h = lh2 * 0.007 * uMat.z; bumpK = nearK * (1.0 - smoothstep(0.004, 0.02, fw2));
      if (uMat.w > 0.5) {
        // an arcade wall is a leaf seen from a hand's breadth: the pleats between its veins stand in relief, bright on
        // their crowns and dark in the grooves, and the wet lies along the grooves
        float rel = clamp(lh2 * 1.7, 0.0, 1.0);
        alb *= 0.7 + 0.46 * rel;
        ao *= 0.78 + 0.22 * rel;
      }
      #if VK == 5
        // a leaf lying in the litter, near the eye: the same relief as the floor's own leaves (whole within 6 m, gone by 18 m)
        float relK2 = (1.0 - smoothstep(6.0, 18.0, dist)) * gLeaf.x;
        alb = leafRelieved(alb, clamp(lh2 * 1.7, 0.0, 1.0), relK2);
        crest = relK2 * (0.3 * gLeaf.y + 0.45 * gLeaf.z) * step(0.0, e2);
        h += relK2 * lh2 * 0.012 * uMat.z;
      #endif
      if (uFrost > 0.5) hoar = hoarGlint(vAux.x, vAux.y, fract(vCol.r * 7.0 + vCol.b * 13.0), d2) * step(0.0, e2);
      gloss = uMat.x * ls2.y * (gl_FrontFacing || uMat.w > 0.5 ? 1.0 : 0.4); ao = 0.8 + 0.2 * smoothstep(0.0, 0.05, e2);
      // hoar is a hairline fringe: 0.009 of the leaf's length in from the margin (it was 0.045) and 0.005 across the midrib
      // (it was 0.024), each no thinner on screen than a pixel and paler as it thins
      // (a pixel measured across the midrib and across the margin, not along them: a rib running away from the eye stays a hairline)
      float fwL2 = fw2 + 1e-5, fwR2 = min(fwL2, fwQ2 + 1e-5), fwE2 = min(fwL2, fwM2 + 1e-5);
      rime = max((1.0 - smoothstep(0.009 - 0.5 * fwE2, 0.009 + 0.5 * fwE2, e2)) * min(1.0, 0.0144 / fwE2), 0.7 * (1.0 - smoothstep(0.0, 0.0025 + fwR2, abs(vAux.y))) * min(1.0, 0.008 / fwR2) * (1.0 - smoothstep(0.01, 0.04, fwL2)));
    }
  #elif FK == 3
    float b = vAux.x; float pat;
    if (uMat.w < 0.5) {
      // snail: five dark bands on yellow, growth lines along the whorl
      pat = 0.0;
      pat += 1.0 - smoothstep(0.012, 0.022, abs(b - 0.14)); pat += 1.0 - smoothstep(0.018, 0.03, abs(b - 0.27));
      pat += 1.0 - smoothstep(0.036, 0.05, abs(b - 0.45)); pat += 1.0 - smoothstep(0.038, 0.05, abs(b - 0.64)); pat += 1.0 - smoothstep(0.022, 0.035, abs(b - 0.82));
      pat = clamp(pat, 0.0, 1.0) * uMisc.z;
      float gr = vnoise(vec3(vAux.y * 55.0, b * 2.0, 1.0));
      alb = mix(vCol * (0.84 + 0.22 * gr), cUmber * 0.38, pat);
      alb *= 0.85 + 0.2 * vnoise(vP * 1.3);
      h = gr * 0.5; bumpK = 0.03; gloss = 1.1;
    } else {
      // turkeytail: concentric zones, pale growing edge, velvet
      float z = b * 7.0 + 0.6 * vnoise(vec3(vAux.y * 3.0, b * 4.0, uSeed));
      float zi = floor(z), zf = fract(z);
      float hz = fract(sin(zi * 12.99 + vCol.r * 40.0) * 43758.5);
      vec3 zc = mix(mix(cUmber * 0.7, cCopper * 0.8, hz), mix(vec3(0.18, 0.2, 0.24), cGold * 0.55, fract(hz * 7.1)), step(0.5, fract(hz * 3.3)));
      alb = mix(zc, zc * 0.6, smoothstep(0.75, 1.0, zf)) * (0.8 + 0.4 * vnoise(vec3(vAux.y * 40.0, b * 3.0, 2.0)));
      alb = mix(alb, cCream * 0.85, smoothstep(0.9, 0.99, b));
      alb *= vCol.g + 0.3; h = zf * 0.6; bumpK = 0.04 * nearK; gloss = 0.3;
    }
  #elif FK == 4
    float r = vAux.x;
    if (vAux.y < 1.5) {
      // scarlet top, washed orange at the margin, cream warts
      vec2 wg = vL.xz * 0.55; vec2 wi = floor(wg), wf = fract(wg); float wart = 0.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
        vec2 o = vec2(float(i), float(j)); vec2 rr = h22(wi + o + 3.1);
        float rad = (0.12 + 0.2 * rr.x) * step(1.0 - vAux.y, fract(rr.y * 9.7) + 0.02);
        wart = max(wart, 1.0 - smoothstep(rad * 0.6, rad + 1e-3, length(wf - o - 0.2 - 0.6 * rr)));
      }
      wart *= 1.0 - smoothstep(0.86, 0.98, r);
      vec3 red = vec3(vCol.r, vCol.g, vCol.g * 0.6) * (0.8 + 0.3 * vnoise(vL * 0.7));
      red = mix(red, vec3(0.95, 0.42, 0.06), smoothstep(0.55, 1.0, r) * (0.35 + 0.5 * (1.0 - vAux.y)));
      float stri = smoothstep(0.88, 1.0, r) * 0.25 * vnoise(vec3(vCol.b * 9.0, atan(vP.z, abs(vP.x) + abs(vP.z) < 1e-4 ? 1.0 : vP.x) * 30.0, 0.0));
      alb = mix(red * (1.0 - stri), cCream * 0.9, wart);
      h = wart; bumpK = 0.25 * nearK; gloss = mix(1.25, 0.35, wart); sss = 0.12;
    } else {
      // gills under the cap: radial blades, filtered at distance
      float gph = vCol.r * 6.28318 * 84.0; float fw = fwidth(vCol.r * 84.0);
      float gl = 0.5 + 0.5 * sin(gph); gl = mix(gl, 0.5, smoothstep(0.15, 0.5, fw));
      alb = cCream * mix(0.5, 0.92, gl) * (0.75 + 0.25 * r); gloss = 0.3; sss = 0.3; ao = 0.55 + 0.45 * r;
    }
  #elif FK == 5
    // ---- bark: long braided ridges with dark cracks between them, a finer weave on those, lenticel dashes, crusts of
    // pale lichen with crisp edges, moss along the top; pale birch when the vertex colour is light. uMat.z is the limb's
    // radius in metres, so bark is the same size on the bough the beetle runs down as on the log it runs into. Every
    // layer fades by the size of a pixel in its own pattern, so nothing shimmers and nothing goes flat too early.
    float ang = vAux.x * 6.28318; vec3 q = vec3(cos(ang), 0.0, sin(ang)) * uMat.z;
    float along = vAux.y;
    vec3 p1 = vec3(q.x * 2.3, along * 0.3, q.z * 2.3) + uSeed;
    vec3 p2 = vec3(q.x * 6.1, along * 0.8, q.z * 6.1) + 7.3;
    float f1 = max(length(dFdx(p1)), length(dFdy(p1))), f2 = max(length(dFdx(p2)), length(dFdy(p2)));
    float k1 = 1.0 - smoothstep(0.2, 0.6, f1), k2 = 1.0 - smoothstep(0.15, 0.5, f2), k3 = 1.0 - smoothstep(0.05, 0.17, f2);
    float fine5 = 1.0 - smoothstep(14.0, 60.0, dist);
    float rid = mix(0.5, fbm3(p1), 0.2 + 0.8 * k1);
    float w2 = vnoise(p2 + 0.5 * rid), w3 = vnoise(p2 * 2.7 + 3.1);
    float r2 = mix(0.6, 1.0 - abs(2.0 * w2 - 1.0), k2);                       // the crests of the finer ridges
    // cracks are contour lines of the noise, their width measured in the pattern (the distance to the contour is the
    // difference in value over the slope), so a flat spot in the noise is a plate, not a black pool
    float d1 = abs(rid - 0.47) * f1 / max(fwidth(rid), 1e-5), d2 = abs(w2 - 0.5) * f2 / max(fwidth(w2), 1e-5), d3 = abs(w3 - 0.5) * f2 * 2.7 / max(fwidth(w3), 1e-5);
    float cr1 = (1.0 - smoothstep(0.015, 0.05 + f1, d1)) * k1;        // cracks between the big plates
    float cr2 = (1.0 - smoothstep(0.01, 0.06 + f2, d2)) * k2 * 0.8;         // and between the ridges
    float cr3 = (1.0 - smoothstep(0.0, 0.07 + f2 * 2.7, d3)) * k3 * 0.45;
    float crack = max(cr1, max(cr2, cr3));
    float fineB = mix(0.5, vnoise(vec3(q.x * 15.0, along * 1.6, q.z * 15.0)), 1.0 - smoothstep(0.05, 0.18, f2));
    float lentB = smoothstep(0.66, 0.76, vnoise(vec3(q.x * 2.4, along * 5.0, q.z * 2.4) + 5.0)) * (1.0 - smoothstep(0.025, 0.09, f2));      // lenticels: short dashes round the limb
    float birch = smoothstep(0.5, 0.7, vCol.g);
    vec3 beech = vCol * (0.66 + 0.6 * rid) * (0.74 + 0.4 * r2) * (0.86 + 0.28 * fineB) * (1.0 - 0.14 * lentB);
    beech = mix(beech, cUmber * 0.26, crack * 0.8);
    float lent = smoothstep(0.62, 0.72, vnoise(vec3(q.x * 0.75, along * 1.1, q.z * 0.75) + 5.0));
    vec3 bir = vCol * (0.86 + 0.14 * fineB) * (1.0 - 0.75 * lent);
    alb = mix(beech, bir, birch);
    // lichen: big grey-green crusts and small white and sulphur ones, each with a paler growing edge and dark fruit dots
    float fwL = max(length(dFdx(vL)), length(dFdy(vL)));
    float lA = vnoise(vL * 0.42 + 9.0) + 0.16 * (vnoise(vL * 1.9 + 4.0) - 0.5), lB = vnoise(vL * 1.25 + 21.0) + 0.12 * (vnoise(vL * 4.3) - 0.5);
    float eA = 0.012 + fwL * 0.5, eB = 0.02 + fwL * 1.3;
    float pA = smoothstep(0.585 - eA, 0.585 + eA, lA), pB = smoothstep(0.69 - eB, 0.69 + eB, lB);
    float rimA = pA * (1.0 - smoothstep(0.6, 0.66, lA)), rimB = pB * (1.0 - smoothstep(0.7, 0.75, lB));
    float dots = smoothstep(0.7, 0.8, vnoise(vL * 7.0 + 2.0)) * (1.0 - smoothstep(0.03, 0.1, fwL));
    float sulph = step(0.55, vnoise(vL * 0.31 + 40.0));
    vec3 lichA = vec3(0.62, 0.68, 0.58) * (0.8 + 0.4 * vnoise(vL * 3.1)) * (1.0 + 0.45 * rimA) * (1.0 - 0.6 * dots);
    vec3 lichB = mix(vec3(0.78, 0.8, 0.72), vec3(0.72, 0.62, 0.22), sulph) * (0.85 + 0.3 * vnoise(vL * 5.0)) * (1.0 + 0.3 * rimB);
    float lichK = (1.0 - birch) * (1.0 - 0.6 * smoothstep(60.0, 200.0, dist));
    alb = mix(alb, lichA, pA * 0.9 * lichK * (1.0 - 0.7 * cr1));
    alb = mix(alb, lichB, pB * 0.92 * lichK);
    float lich = max(pA, pB) * lichK;
    float mk = smoothstep(0.72, 0.98, N.y * 0.75 + 0.9 * (fbm3(vL * 0.16 + 3.0) - 0.42)) * (1.0 - birch) * uMat.w;
    vec2 mt5 = mossTex(vL.xz * 1.3, fine5);
    alb = mix(alb, mix(cMoss * 0.35, cMoss * 1.05, mt5.x) * (0.75 + 0.4 * vnoise(vL * 2.3)), mk);
    h = (rid * 0.9 + r2 * 0.3 * k2 + fineB * 0.12 - crack * 0.5) * (1.0 - 0.6 * lich) + lich * 0.12 + mk * mt5.y * 0.8;
    bumpK = (0.42 * nearK + 0.04) * (1.0 - 0.5 * birch); gloss = mix(0.2, 0.1, max(mk, lich));
    ao = (0.72 + 0.28 * rid) * (1.0 - 0.45 * crack * (1.0 - mk));
    rime = (0.1 + 0.5 * r2 * k2 * smoothstep(0.3, 0.7, rid)) * (1.0 - 0.9 * crack) + 0.35 * mk;      // rime on the crests and the moss; the cracks stay dark
  #elif FK == 8
    // ---- broken, rotted beech wood: growth rings and dark zone lines on the end grain, long fibre on the split
    // faces, pale sap wood under the bark going through tan to umber rot round the bore; matt and damp.
    // aux = (distance from the log's axis in metres, ao); uMisc.xy = the log's axis on the ground plane
    float rho = vAux.x; vec2 T2 = uMisc.xy;
    vec3 gp = vec3(vL.x * T2.y - vL.z * T2.x, vL.y, dot(vL.xz, T2));
    float endK = smoothstep(0.5, 0.85, abs(dot(N.xz, T2)));
    float fw8 = max(length(dFdx(vL)), length(dFdy(vL)));
    float kf = 1.0 - smoothstep(0.03, 0.12, fw8), km = 1.0 - smoothstep(0.1, 0.45, fw8);
    float fib = mix(0.5, vnoise(vec3(gp.xy * 5.0, gp.z * 0.3)), km), fib2 = mix(0.5, vnoise(vec3(gp.xy * 16.0, gp.z * 0.8 + 3.0)), kf);
    float big8 = vnoise(vec3(gp.xy * 0.33, 2.0)), mid8 = vnoise(vec3(gp.xy * 1.5, 5.0));
    float rr = rho * 2.3 + 1.6 * big8 + 0.3 * mid8, fwR = fwidth(rr);
    float ringC = 0.5 + 0.5 * cos(6.28318 * rr);
    float ringLine = smoothstep(0.55, 0.95, ringC) * (1.0 - smoothstep(0.25, 0.7, fwR));
    float zone = clamp((rho - 7.5) / 2.9 + 0.3 * (big8 - 0.5) + 0.12 * (mid8 - 0.5), 0.0, 1.0);
    vec3 wood8 = mix(mix(cUmber * 0.75, mix(cCopper, cCream, 0.35) * 0.9, smoothstep(0.0, 0.3, zone)), cCream * vec3(0.8, 0.73, 0.58), smoothstep(0.18, 0.6, zone));
    wood8 *= vCol * (0.84 + 0.3 * fib) * (0.92 + 0.16 * fib2);
    wood8 *= 1.0 - endK * (0.42 * ringLine + 0.1 * (1.0 - ringC) * (1.0 - smoothstep(0.25, 0.7, fwR)));
    wood8 *= mix(0.78 + 0.3 * smoothstep(0.35, 0.65, fib), 1.0, endK);
    float zl = (1.0 - smoothstep(0.0, 0.03 + fw8 * 0.4, abs(vnoise(vec3(gp.xy * 0.5, 9.0)) - 0.5))) * smoothstep(0.25, 0.5, zone) * km;
    wood8 = mix(wood8, vec3(0.03, 0.025, 0.02), zl * 0.75 * endK);
    float wr = smoothstep(0.64, 0.78, vnoise(vec3(gp.xy * 0.8 + 13.0, gp.z * 0.25)));
    wood8 = mix(wood8, cCream * 0.8 * vCol, wr * 0.45);
    wood8 = mix(wood8, cMoss * 0.55, smoothstep(0.82, 1.0, zone) * 0.5 * smoothstep(0.35, 0.7, vnoise(vec3(gp.xy * 1.1, 17.0))));
    alb = wood8; ao = vAux.y; gloss = 0.1; sss = 0.0;
    h = fib * 0.22 + fib2 * 0.08 - ringLine * 0.12 * endK; bumpK = 0.3 * nearK * km;
    rime = 0.25 + 0.5 * fib;
  #elif FK == 9
    // ---- beech bark on a bough or a trunk: smooth silver-grey skin, mottled, green with algae in drifts, fine wrinkles
    // round the limb, a few long splits that run with the grain (never closed loops: seen along the limb they converge
    // on the vanishing point), crusts of lichen, moss on whatever faces the sky and round a trunk's foot. Pale birch
    // when the vertex colour is light. aux = (around 0..1, metres along); uMat.z = the limb's radius in metres;
    // uMisc.y = how much more moss; uMisc.x = 1 on a standing trunk (aux.y is then its height).
    float R9 = uMat.z, a9 = vAux.y, ang9 = vAux.x * 6.28318;
    vec3 pm = vec3(cos(ang9) * R9, a9, sin(ang9) * R9);
    // a standing trunk goes up into its crown: it darkens under the leaves and is lost among them in ragged sprays, so
    // that looking straight up the columns end in foliage and never in the air
    // (by the angle it is looked up at, not by its height: from far or near the eye sees the same share of the column)
    float crown9 = uMisc.x * (-V.y * 10.0 + 2.2 * (vnoise(vL * 0.021 + 3.0) - 0.5) + 1.4 * (vnoise(vL * 0.1) - 0.5));
    if (crown9 > 7.6) cut = true;          // (decided here, thrown away after the relief's derivatives)
    // (uMisc.z, 1 as a rule, eases that darkening: under the parasol's vault the trunk beside it is looked up at from its
    // foot, and there it is bark, not a black wedge)
    float crownD = smoothstep(3.2, 7.0, crown9) * uMisc.z, vk9 = clamp((1.0 - uMisc.z) * 2.0, 0.0, 1.0);
    // looked up at, a trunk's flanks go in among the sprays before its middle does: its outline is broken by leaves, and
    // is never one straight edge from the root to the roof
    float spray9 = uMisc.x * vk9 * smoothstep(1.0, 4.6, crown9) * smoothstep(0.34, 0.6, 0.72 * vnoise(vL * 0.13 + 5.0) + 0.28 * vnoise(vL * 0.4 + 9.0));
    // (decided here, on the normal as it is before the relief turns it; thrown away after the relief's derivatives)
    if (uMisc.x > 0.5 && (abs(dot(N, V)) < 0.66 * spray9 || (!gl_FrontFacing && crown9 > 1.0 && vk9 > 0.0))) cut = true;
    float fw9 = max(length(dFdx(vL)), length(dFdy(vL)));                    // metres to a pixel
    float kf9 = 1.0 - smoothstep(0.02, 0.09, fw9), km9 = 1.0 - smoothstep(0.1, 0.5, fw9);
    float fine9 = 1.0 - smoothstep(14.0, 60.0, dist);
    float mott = fbm3(pm * 0.31 + uSeed), mott2 = mix(0.5, vnoise(pm * 1.4 + 3.0), km9);
    float wrF = fwidth(a9) * 8.0;
    float wr = mix(0.5, vnoise(vec3(pm.x * 0.8, a9 * 8.0, pm.z * 0.8)), kf9 * (1.0 - smoothstep(0.12, 0.4, wrF)));
    float lent9 = smoothstep(0.7, 0.8, vnoise(vec3(pm.x * 1.5, a9 * 4.5, pm.z * 1.5) + 5.0)) * kf9;
    float N9 = floor(R9 * 2.4 + 0.5), li = vAux.x * N9, cid = floor(li);
    float wand = 0.56 * (vnoise(vec3(a9 * 0.13, cid * 7.3, 1.0)) - 0.5);
    float dm = abs(fract(li) - 0.5 - wand) * 6.28318 * R9 / max(N9, 1.0);   // metres from this cell's split
    float on9 = smoothstep(0.52, 0.62, vnoise(vec3(a9 * 0.07 + cid * 3.7, cid * 1.3, 9.0)));
    float w9 = 0.035 + 0.06 * vnoise(vec3(a9 * 0.6, cid, 4.0));
    float crack9 = (1.0 - smoothstep(w9, w9 + 0.03 + 1.5 * fw9, dm)) * on9 * min(1.0, 2.5 * w9 / max(fw9, 1e-4)) * (1.0 - smoothstep(0.5, 1.6, fw9));
    float birch = smoothstep(0.5, 0.7, vCol.g);
    vec3 beech = vCol * (0.74 + 0.42 * mott) * (0.92 + 0.16 * mott2) * (0.94 + 0.12 * wr) * (1.0 - 0.22 * lent9);
    beech = mix(beech, beech * vec3(0.74, 1.04, 0.62), smoothstep(0.42, 0.72, vnoise(pm * 0.19 + 11.0)) * 0.55);
    // a standing trunk is read from far off: long dark runs where the rain comes down it, pale flanks between, green drifts
    float run9 = vnoise(vec3(pm.x * 0.06, a9 * 0.011, pm.z * 0.06) + 7.0), run2 = vnoise(vec3(pm.x * 0.2, a9 * 0.03, pm.z * 0.2) + 2.0);
    beech *= mix(1.0, (0.36 + 0.7 * run9) * (0.74 + 0.5 * run2), uMisc.x);
    float bLip = 0.0, bGroove = 0.0, rosK = 0.0, rosRim = 0.0, rosH = 0.0; vec3 rosC = vec3(0.0);
    #ifdef BOUGH
      // ---- the bough is walked along, a hand's width under the eye, and its skin is drawn for that distance: creases
      // of three sizes running round the limb (a dark hairline, a pale lip beside it), lenticels as short dark dashes
      // with raised rims, umber stains, and rosettes of leafy lichen with lobed pale margins and fruit cups in the
      // middle. Each is filtered by the size of a pixel in its own pattern; in frost the rime grows on the lips and rims.
      crack9 *= 0.5 * smoothstep(0.35, 0.6, vnoise(vec3(a9 * 0.8, cid * 3.1, 2.0)));          // the long splits: short and few
      beech *= 1.3 + 0.3 * mix(0.5, vnoise(pm * 5.5 + 2.0), kf9);
      beech = mix(beech, vec3(0.27, 0.205, 0.125) * (0.6 + 0.8 * mott), smoothstep(0.46, 0.72, vnoise(pm * 0.42 + 31.0)) * 0.52);
      beech = mix(beech, vec3(0.2, 0.27, 0.11) * (0.7 + 0.6 * mott2), smoothstep(0.5, 0.78, vnoise(pm * 0.27 + 57.0)) * 0.4);
      float cW = vnoise(vec3(pm.x * 0.3, a9 * 0.1, pm.z * 0.3) + 17.0);
      float s1 = a9 * 0.42 + 0.9 * cW + 0.3 * mott2;
      float s2 = a9 * 1.35 + 1.6 * cW + 0.5 * vnoise(vec3(pm.x * 0.9, a9 * 0.3, pm.z * 0.9));
      float s3 = a9 * 4.6 + 4.0 * cW + 1.2 * vnoise(vec3(pm.x * 1.7, a9 * 0.6, pm.z * 1.7) + 3.0);
      float pr1 = smoothstep(0.3, 0.5, vnoise(vec3(pm.x * 0.25, floor(s1) * 5.3, pm.z * 0.25)));
      float pr2 = smoothstep(0.32, 0.5, vnoise(vec3(pm.x * 0.5, floor(s2) * 5.3 + 2.0, pm.z * 0.5)));
      float pr3 = smoothstep(0.42, 0.6, vnoise(vec3(pm.x * 0.9, floor(s3) * 5.3 + 7.0, pm.z * 0.9)));
      vec3 c1 = crease(s1, fwidth(a9) * 0.42 + 1e-4, 0.019) * pr1, c2 = crease(s2, fwidth(a9) * 1.35 + 1e-4, 0.038) * pr2, c3 = crease(s3, fwidth(a9) * 4.6 + 1e-4, 0.055) * pr3;
      float bLine = max(c1.x * 0.85, max(c2.x * 0.82, c3.x * 0.7));
      bLip = max(c1.y, max(c2.y * 0.85, c3.y * 0.55)); bGroove = c1.z + 0.6 * c2.z;
      // lenticels: one to a cell, a lens lying round the limb
      float Nl9 = max(floor(6.28318 * R9 * 1.1 + 0.5), 1.0), cwl = 6.28318 * R9 / Nl9;
      vec2 lg = vec2(vAux.x * Nl9, a9 * 2.1 + 0.13), lci = floor(lg);
      vec2 lr = h22(lci + 71.0), lq = h22(lci + 13.7);
      vec2 ld = (fract(lg) - 0.35 - 0.3 * lr) * vec2(cwl, 1.0 / 2.1);
      float lhw = 0.12 + 0.18 * lq.x, lth = 0.028 + 0.022 * lq.y;
      float le = length(ld / vec2(lhw, lth)), lpx = fw9 / lth + 1e-3;
      float lon = step(0.5, fract(lq.x * 5.7 + lr.y * 3.3)) * (1.0 - smoothstep(0.035, 0.11, fw9));
      float lentD = lon * (1.0 - smoothstep(1.0 - lpx, 1.0 + lpx, le)) * min(1.0, 1.5 / max(lpx, 1e-3));
      float lentL = lon * smoothstep(1.0, 1.2 + lpx, le) * (1.0 - smoothstep(1.5, 2.1 + lpx, le));
      beech = mix(beech, cUmber * 0.2, max(bLine, lentD * 0.72));
      beech += vCol * (0.3 * bLip * (1.0 - bLine) + 0.2 * lentL);
      bLip = max(bLip, 0.7 * lentL);
      // lichen rosettes: one to a cell or none, five to seven lobes, sage, sulphur or pale grey
      float Nr9 = max(floor(6.28318 * R9 / 2.3 + 0.5), 1.0), cwr = 6.28318 * R9 / Nr9;
      vec2 rg = vec2(vAux.x * Nr9, a9 / 2.3 + 0.37), rci = floor(rg);
      vec2 rr = h22(rci + 5.3), rq = h22(rci + 91.7);
      vec2 rd = (fract(rg) - 0.33 - 0.34 * rr) * vec2(cwr, 2.3);
      float r0 = 0.3 + 0.4 * rq.x, rho = length(rd), th9 = atan(rd.y, abs(rd.x) + abs(rd.y) < 1e-4 ? 1.0 : rd.x), ph9 = rq.y * 6.28318;
      float lob = abs(sin(th9 * (2.5 + 0.5 * floor(rr.x * 2.99)) + ph9));
      float edge9 = r0 * (0.7 + 0.3 * sqrt(lob)) * (1.0 + 0.07 * sin(th9 * 13.0 + ph9 * 5.0));
      float sd9 = rho - edge9, aa9 = fw9 * 0.9 + 0.004;
      float rfade = step(fract(rr.y * 7.31 + rq.x * 3.7), 0.58) * (1.0 - smoothstep(0.1, 0.4, fw9));
      rosK = (1.0 - smoothstep(-aa9, aa9, sd9)) * rfade;
      float zone = clamp(rho / max(edge9, 1e-3), 0.0, 1.0), kind9 = fract(rr.x * 13.7 + rq.y * 5.1);
      vec3 body9 = kind9 < 0.4 ? vec3(0.74, 0.56, 0.11) : kind9 < 0.8 ? vec3(0.44, 0.54, 0.4) : vec3(0.62, 0.66, 0.58);
      vec3 rimC = kind9 < 0.4 ? vec3(0.8, 0.72, 0.3) : vec3(0.74, 0.79, 0.7);
      rosRim = smoothstep(0.8, 0.92, zone) * rosK;
      float slit = (1.0 - smoothstep(0.0, 0.2, lob)) * smoothstep(0.3, 0.6, zone);
      float ringL = 1.0 - smoothstep(0.0, 0.035 + aa9 / r0, abs(zone - 0.5 - 0.06 * sin(th9 * 7.0 + ph9)));
      vec2 dg = rd * 8.5 + rr * 9.0, dq = h22(floor(dg) + rci * 3.1);
      float dd9 = length(fract(dg) - 0.3 - 0.4 * dq), drad = 0.16 + 0.14 * dq.x;
      float cup = (1.0 - smoothstep(drad - aa9 * 8.5, drad + aa9 * 8.5, dd9)) * step(0.35, dq.y) * (1.0 - smoothstep(0.38, 0.52, zone)) * (1.0 - smoothstep(0.012, 0.045, fw9));
      rosC = body9 * (0.6 + 0.3 * zone + 0.22 * vnoise(vL * 6.0)) * (1.0 - 0.45 * slit) * (1.0 - 0.3 * ringL);
      rosC = mix(rosC, rimC, smoothstep(0.8, 0.92, zone));
      rosC = mix(rosC, kind9 < 0.4 ? vec3(0.78, 0.36, 0.05) : vec3(0.17, 0.13, 0.09), cup);
      rosC = mix(rosC, rimC, cup * smoothstep(drad * 0.55, drad * 0.85, dd9) * 0.8);
      rosH = rosK * (0.4 + 0.6 * smoothstep(0.6, 0.9, zone));
      // a rosette lies a little proud of the bark: a thin shadow round it
      beech *= 1.0 - 0.42 * rfade * (1.0 - rosK) * (1.0 - smoothstep(0.0, 0.07 + aa9, sd9));
    #endif
    beech = mix(beech, cUmber * 0.24, crack9 * mix(0.7, 0.85, uMisc.x));
    // high on a trunk the bark is green-brown with algae and moss in drifts (seen only from near its foot, looking up)
    beech = mix(beech, (cMoss * 0.5 + cUmber * 0.34) * (0.55 + 0.9 * run2), uMisc.x * vk9 * smoothstep(0.38, 0.66, vnoise(vL * 0.05 + 23.0)) * smoothstep(0.6, 3.0, crown9) * 0.7);
    beech = mix(beech, cMoss * 0.16 + cUmber * 0.1, crownD * 0.85);
    float lentB9 = smoothstep(0.62, 0.72, vnoise(vec3(pm.x * 0.2, a9 * 0.9, pm.z * 0.2) + 5.0));
    vec3 bir = vCol * (0.86 + 0.14 * mott2) * (1.0 - 0.75 * lentB9);
    alb = mix(beech, bir, birch);
    float lA = vnoise(vL * 0.42 + 9.0) + 0.16 * (vnoise(vL * 1.9 + 4.0) - 0.5), lB = vnoise(vL * 1.25 + 21.0) + 0.12 * (vnoise(vL * 4.3) - 0.5);
    float eA = 0.012 + fw9 * 0.5, eB = 0.02 + fw9 * 1.3;
    float pA = smoothstep(0.61 - eA, 0.61 + eA, lA), pB = smoothstep(0.7 - eB, 0.7 + eB, lB);
    float rimA = pA * (1.0 - smoothstep(0.625, 0.685, lA)), rimB = pB * (1.0 - smoothstep(0.71, 0.76, lB));
    float dots = smoothstep(0.7, 0.8, vnoise(vL * 7.0 + 2.0)) * (1.0 - smoothstep(0.03, 0.1, fw9));
    float sulph = step(0.7, vnoise(vL * 0.31 + 40.0));
    vec3 lichA = vec3(0.5, 0.57, 0.47) * (0.8 + 0.4 * vnoise(vL * 3.1)) * (1.0 + 0.45 * rimA) * (1.0 - 0.6 * dots);
    vec3 lichB = mix(vec3(0.66, 0.68, 0.6), vec3(0.62, 0.55, 0.26), sulph) * (0.7 + 0.5 * vnoise(vL * 5.0)) * (1.0 + 0.3 * rimB);
    float lichK = (1.0 - birch) * (1.0 - 0.7 * smoothstep(60.0, 220.0, dist)) * (1.0 - 0.6 * uMisc.x);
    #ifdef BOUGH
      lichK *= 0.3;             // (the big soft crusts stand back: the rosettes are the lichen here)
    #endif
    // (crusts, not paint: each plate is broken up by the bark's own mottling and is never one flat colour)
    float crust9 = 0.55 + 0.45 * smoothstep(0.35, 0.65, vnoise(vL * 2.6 + 13.0));
    alb = mix(alb, lichA, pA * 0.8 * lichK * crust9 * (1.0 - 0.7 * crack9));
    alb = mix(alb, lichB, pB * 0.75 * lichK * crust9);
    float lich = max(pA, pB) * lichK;
    alb = mix(alb, rosC, rosK);
    float mN = fbm3(vL * 0.16 + 3.0);
    float mk = smoothstep(0.54 - 0.16 * uMisc.y, 0.8 - 0.16 * uMisc.y, N.y * 0.5 + 1.4 * (mN - 0.45)) * step(0.5, uMat.w);
    mk = max(mk, uMisc.x * (1.0 - smoothstep(3.0, 34.0, a9 + 30.0 * (mN - 0.5))) * smoothstep(0.3, 0.55, vnoise(vL * 0.11 + 17.0)));
    mk *= 1.0 - birch * 0.7;
    vec2 mt5 = mossTex(vL.xz * 1.3 + vL.y * 0.9, fine9);
    vec3 moss9 = mix(cMoss * 0.42, mix(cMoss * 1.05, mix(cMoss, cGold, 0.4) * 1.1, smoothstep(0.6, 0.95, mt5.x)), smoothstep(0.08, 0.6, mt5.x)) * (0.75 + 0.4 * vnoise(vL * 2.3));
    alb = mix(alb, moss9, mk);
    h = (mott * 0.7 + wr * 0.05 - crack9 * 0.6 + lent9 * 0.03) * (1.0 - 0.6 * lich) + lich * 0.1 + mk * (0.25 + mt5.y * 0.8);
    bumpK = (0.3 * nearK + 0.03) * (1.0 - 0.5 * birch); gloss = mix(0.22, 0.1, max(mk, lich));
    #ifdef BOUGH
      h += (rosH * 0.12 - bGroove * 0.1) * (1.0 - mk);
      bumpK = 0.7 * nearK * (1.0 - smoothstep(0.04, 0.22, fw9)) + 0.05;
    #endif
    // a bough lying down is darker down its flanks: it reads as round from above
    ao = (0.8 + 0.2 * mott) * (1.0 - 0.5 * crack9 * (1.0 - mk)) * mix(0.62 + 0.38 * smoothstep(-0.35, 0.75, N.y), 1.0, uMisc.x);
    rime = 0.05 + 0.1 * lich + mk * (0.05 + 0.3 * smoothstep(0.6, 0.95, mt5.x));
    #ifdef BOUGH
      // rime as bright lines on the creases' lips and the rosettes' rims, and on the moss tips: no even bloom
      rime = (0.8 * bLip + 0.9 * rosRim + 0.05 * rosK) * (1.0 - mk) + mk * (0.08 + 0.5 * smoothstep(0.55, 0.95, mt5.x));
    #endif
  #elif FK == 6
    // ---- white cushion moss: a pale glaucous dome made of thousands of tiny star tips
    float fine6 = 1.0 - smoothstep(9.0, 36.0, dist);
    // star tips laid on from three sides, so the flanks of the dome carry the same stars as its crown
    vec3 w6 = N * N; w6 *= w6; w6 /= (w6.x + w6.y + w6.z + 1e-4);
    vec2 m6 = mossTex(vL.xz * 0.8, fine6) * w6.y + mossTex(vL.zy * 0.8 + 5.3, fine6) * w6.x + mossTex(vL.xy * 0.8 + 9.1, fine6) * w6.z;
    float big6 = vnoise(vL * 0.5 + uSeed), mid6 = vnoise(vL * 2.1);
    // deep green down between the rosettes, glaucous on them, the youngest tips nearly white
    alb = mix(vCol * vec3(0.36, 0.5, 0.36), vCol * (0.86 + 0.3 * smoothstep(0.5, 1.0, m6.x)), smoothstep(0.05, 0.5, m6.x)) * (0.86 + 0.28 * big6);
    alb = mix(alb, cMoss * 1.1, smoothstep(0.6, 0.85, mid6) * 0.22);
    alb = mix(alb, cUmber * 0.7, (1.0 - smoothstep(0.5, 0.7, vAux.x)) * 0.3);
    h = m6.y * 0.42 + mid6 * 0.25 + big6 * 0.35; bumpK = nearK * (0.3 + 0.7 * fine6); ao = (0.68 + 0.32 * vAux.x) * (0.68 + 0.32 * m6.y); gloss = 0.1; sss = 0.3;
    rime = mix(0.5, smoothstep(0.35, 0.9, m6.x), fine6);
  #else
    // ---- cuticle: black, finely granulate, mirror-wet; the vertex colour is the structural sheen along margins
    #ifdef PILL
      float fwZ7 = fwidth(vP.z);          // (for the plate, below: taken before the branch, which not every pixel of a block takes)
    #endif
    if (vAux.y < -0.5) { alb = vCol; gloss = 0.5; ao = 0.85; }
    else {
      float g7 = vnoise(vP * uMat.z * 0.5);
      alb = vec3(0.02, 0.018, 0.024) * (0.7 + 0.6 * g7) + vCol * 0.035 * vAux.y;
      h = g7 * 0.05 / uMat.z; bumpK = nearK * (1.0 - smoothstep(4.0, 14.0, dist)); ao = vAux.x; gloss = 0.0;
      #ifdef PILL
      {
        // a pill millipede's plate, drawn from the plate's own coordinates (vP: z runs from its hind edge to its front,
        // uMisc.w is its length): dark slate, mottled, a few plates browner; a pale buff hind margin with a dark line
        // before it; fine growth lines parallel to the margin. The belly (aux.y low) is matt and dark.
        float tp = clamp(vP.z / max(uMisc.w, 0.1) + 0.5, 0.0, 1.0);
        float fwp = fwZ7 / max(uMisc.w, 0.1) + 0.004;
        float plate7 = smoothstep(0.4, 0.7, vAux.y);
        vec3 pp = vec3(vP.xy * 2.6, vP.z * 2.6 + vPill.x * 37.0);
        float mot7 = vnoise(pp + 3.0), wob7 = 0.05 * (vnoise(pp * 1.9 + 11.0) - 0.5);
        float mW = 0.125 + 0.035 * vPill.y + 0.6 * wob7;
        // (the end domes, aux.y 0.75, carry no margin)
        float marg7 = (1.0 - smoothstep(mW - fwp, mW + fwp, tp)) * smoothstep(0.8, 0.95, vAux.y);
        float seam7 = (1.0 - smoothstep(0.012, 0.03 + fwp, abs(tp - mW - 0.03))) * min(1.0, 0.03 / fwp);
        float grow7 = 0.5 + 0.5 * sin(tp * 70.0 + 2.0 * mot7); grow7 = mix(0.5, grow7, 1.0 - smoothstep(0.02, 0.07, fwp * 5.0));
        vec3 slate = vec3(0.076, 0.085, 0.106) * (0.74 + 0.5 * mot7) * (0.9 + 0.2 * g7) * (0.93 + 0.14 * grow7);
        slate = mix(slate, vec3(0.092, 0.07, 0.05) * (0.8 + 0.4 * mot7), smoothstep(0.55, 0.9, vPill.x) * 0.6);
        vec3 buff = vec3(0.45, 0.37, 0.225) * (0.82 + 0.3 * g7) * (0.9 + 0.2 * vPill.y);
        alb = mix(slate, buff, marg7) * (1.0 - 0.65 * seam7 * (1.0 - marg7));
        alb = mix(vec3(0.05, 0.046, 0.04), alb, plate7);
        h += marg7 * 0.012;
      }
      #endif
    }
  #endif
  // the relief's derivatives are taken here, on every pixel: not inside the branch below, which only the pixels with
  // relief take, and before a cut pixel is thrown away. Taken where a neighbour does not go, they are not defined.
  vec3 bpx = dFdx(vL), bpy = dFdy(vL); float bhx = dFdx(h), bhy = dFdy(h);
  #if FK == 2 || FK == 9
    if (cut) discard;         // the cut decided above is made here: this was the program's last derivative
  #endif
  #if FK != 7
    // by moonlight colour drains away: copper and umber, which hold no blue, would go black; they go pewter instead
    alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.55, 0.15)) * 1.25 + 0.07), uNight * 0.8);
  #endif
  vec3 Ng = N;
  #if FK == 0 || FK == 2
    // a leaf seen edge-on keeps its shape and loses its relief: the pleats are in its colour, not in its normal
    bumpK *= smoothstep(0.08, 0.42, abs(dot(N, V)));
  #endif
  if (bumpK > 0.0) N = bumpN(N, bpx, bpy, bhx, bhy, bumpK);
  // under the leaf arcade the skylight is cut off: only the glow through its walls and the far mouth remain
  float ay = clamp((vL.y - uArc.z) / (uArc.w + 1.5), 0.0, 1.0);
  float arcSh = smoothstep(uArc.x - 5.0, uArc.x + 7.0, vL.z) * (1.0 - smoothstep(uArc.y - 7.0, uArc.y + 5.0, vL.z)) * (1.0 - smoothstep(0.8, 1.15, abs(vL.x) / (6.5 * (1.0 - ay) + 4.5)));
  ao *= 1.0 - 0.22 * arcSh;
  // ---- light: pearl skylight with a soft key from the bright side, copper bounce, the one shaft, wet highlights
  float beam = shaftMask(vL) * capLit(vL);
  #if FK == 9
    beam *= 1.0 - 0.9 * uMisc.x;            // a great trunk stands outside the one shaft: it is the dark the shaft is seen against
    ao *= 1.0 - 0.55 * crownD;
  #endif
  float ndl = dot(N, uSunDir);
  float dif = clamp(ndl * 0.88 + 0.12, 0.0, 1.0);
  float ndk = dot(N, uKeyDir);
  vec3 sky = mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5);
  vec3 col = alb * sky * ao * 0.95;
  col += alb * uKeyCol * ao * clamp(ndk * 0.7 + 0.3, 0.0, 1.0);
  col += alb * uSunCol * dif * beam;
  col += alb * (uKeyCol + cCopper * 0.2) * 0.62 * arcSh;      // warm light filtered through the arcade's walls
  // translucency: thin leaves and flesh glow when the bright side is behind them
  float back = max(dot(V, -uKeyDir), 0.0); back = back * back;
  vec3 thru = alb * (vec3(1.0) + 1.2 * alb / max(max(alb.r, max(alb.g, alb.b)), 0.05));
  col += thru * uKeyCol * sss * clamp(0.35 - ndk, 0.0, 1.0) * (0.35 + 1.5 * back);
  col += thru * uSunCol * sss * shaftMask(vL) * clamp(0.4 - ndl, 0.0, 1.0) * (0.25 + 1.2 * back);
  // wet highlights. Leaves and litter take one broad soft sheen of sky from their own shape and no mirror image of the
  // canopy: at a grazing angle a mirror turns every pleat into a white band
  vec3 Nr = N; float fresCap = 1.0, specP = 48.0, specK = 1.6, mirK = 1.0, shP = 14.0, shK = 0.36;
  #if FK == 0 || FK == 2
    Nr = normalize(mix(Ng, N, 0.4)); fresCap = 0.3; specP = 10.0; specK = 0.34; mirK = 0.0; shP = 5.0; shK = 0.3;
  #endif
  #if FK == 5 || FK == 8 || FK == 9
    // bark and broken wood are matt: damp darkens them, and only a faint broad sheen of sky lies on the ridges
    fresCap = 0.12; specP = 8.0; specK = 0.25; mirK = 0.0; shP = 4.0; shK = 0.22;
  #endif
  vec3 R = reflect(-V, Nr);
  float nv = clamp(dot(Nr, V), 0.0, 1.0);
  float fres = min(0.04 + 0.96 * pow(1.0 - nv, 5.0), fresCap);
  float wet = gloss * uWet;
  vec3 env = mix(uSkyCol * 0.9, skyRefl(R), mirK);
  col += (env * 0.5 * fres * smoothstep(-0.2, 0.6, R.y) + uSkyCol * shK * pow(max(R.y, 0.0), shP)) * wet * ao;
  vec3 Hk = normalize(uKeyDir + V + vec3(0.0, 1e-4, 0.0));
  col += uKeyCol * wet * specK * pow(max(dot(Nr, Hk), 0.0), specP) * ao;
  vec3 Hh = normalize(uSunDir + V + vec3(0.0, 1e-4, 0.0));
  col += uSunCol * wet * beam * 2.2 * pow(max(dot(Nr, Hh), 0.0), 60.0);
  // water beads on leaves: a point of sky each, gold in the shaft
  col = col * (1.0 - 0.12 * glint.y) + (uSkyCol * 2.6 + uSunCol * beam * 1.5) * glint.x * uWet * (1.0 - uFrost);
  // a near fallen leaf's crowns and curled rim catch the sky (dry under frost: there the hoar glints instead, cold points
  // on the rime, gold only in the shaft: see the frost below)
  col += (uSkyCol * 0.4 + alb * 1.5) * (uSkyCol + uSunCol * beam * 0.5) * crest * uWet * (1.0 - 0.5 * uFrost) * ao;
  #if FK == 7 && defined(PILL)
    if (vAux.y >= -0.5) {
      // A pill millipede's plates are polished slate, and the light on them does not ask which way is up: rolled into a
      // ball its plates face every way. The wood's skylight wraps the whole animal; a broad soft band of the pearl sky
      // lies across whatever faces between the eye and the open canopy over its shoulder, with a tight highlight inside
      // it; where a plate turns away from the eye it carries a cool rim; and in the one shaft the plates take the sun.
      // By moonlight the band is the bright gaps of the canopy, not the dim air.
      float plate7 = smoothstep(0.4, 0.7, vAux.y);
      vec3 skyP = uSkyCol * (1.0 + 3.0 * uNight);
      vec3 Lw = normalize(V + vec3(0.0, 0.85, 0.0));
      float nl7 = clamp(dot(N, Lw), 0.0, 1.0);
      float band7 = nl7 * nl7 * nl7;
      float rim7 = 1.0 - nv; rim7 = rim7 * rim7 * (0.35 + 0.65 * rim7);
      col += alb * skyP * 0.5;
      col += skyP * ao * plate7 * (0.21 * band7 + 0.8 * pow(nl7, 48.0));
      col += skyP * vec3(0.82, 0.96, 1.2) * 0.34 * rim7 * ao * (0.35 + 0.65 * plate7);
      col += uKeyCol * 0.8 * pow(max(dot(N, Hk), 0.0), 30.0) * ao * plate7;
      col += uSunCol * beam * (0.5 * alb * clamp(ndl * 0.5 + 0.5, 0.0, 1.0) + 1.6 * plate7 * pow(max(dot(N, Hh), 0.0), 60.0));
    }
  #elif FK == 7
    if (vAux.y >= -0.5) {
      // cuticle mirrors the canopy above and the litter below, with a tight sky highlight and a violet (or bronze) edge
      vec3 env7 = mix(uGroundCol * 0.6, skyRefl(R), smoothstep(-0.25, 0.3, R.y));
      col += env7 * (0.06 + 0.94 * pow(1.0 - nv, 4.0)) * ao * 0.9;
      col += uSkyCol * (1.3 * pow(max(R.y, 0.0), 24.0) + 0.16 * pow(max(R.y, 0.0), 4.0)) * ao;
      col += uKeyCol * 1.6 * pow(max(dot(N, Hk), 0.0), 60.0) * ao;
      col += uSunCol * beam * 2.0 * pow(max(dot(N, Hh), 0.0), 80.0);
      float gz = 1.0 - nv;
      col += vCol * vAux.y * ao * (0.045 + 0.24 * max(N.y, 0.0) + 1.0 * gz * gz * gz) * (uSkyCol.g * 1.5 + 0.15);
      #ifdef SNAKE
      {
        // a snake millipede is a row of polished rings, and each ring carries its own sharp point of the sky: the
        // highlight lies on the crown of every ring (vP.z runs along the ring, uMisc.w is its length) and is cut by the
        // groove between two rings, so it runs down the animal as a line of beads. A cool rim where the ring turns away.
        float tr = clamp(vP.z / max(uMisc.w, 0.05) + 0.5, 0.0, 1.0);
        float crown7 = smoothstep(0.08, 0.42, tr) * (1.0 - smoothstep(0.58, 0.92, tr));
        vec3 skyP = uSkyCol * (1.0 + 3.0 * uNight);
        vec3 Lw = normalize(V + vec3(0.0, 0.85, 0.0));
        float nl7 = clamp(dot(N, Lw), 0.0, 1.0);
        float rim7 = 1.0 - nv; rim7 = rim7 * rim7 * (0.35 + 0.65 * rim7);
        col += skyP * ao * crown7 * (4.5 * pow(nl7, 64.0) + 0.05 * nl7 * nl7 * nl7);
        col += skyP * vec3(0.82, 0.96, 1.2) * 0.1 * rim7 * ao * (0.4 + 0.6 * crown7);
      }
      #endif
    }
  #endif
  #if FK != 7
    // hoar frost: white crystals along margins, midribs and shoot tips, and a thin even bloom of them over the rest
    float grain = mix(0.5, vnoise(vL * 19.0), 1.0 - smoothstep(10.0, 38.0, dist));
    float frBase = 0.04 + 0.1 * grain;
    #ifdef BOUGH
      frBase = 0.012 + 0.03 * grain;
    #endif
    float fr = uFrost * clamp(Ng.y * 0.7 + 0.5, 0.0, 1.0) * clamp(rime * (0.7 + 0.5 * grain) + frBase, 0.0, 1.0);
    #if FK == 9
      fr *= 1.0 - 0.9 * crownD;
    #endif
    col = mix(col, uSkyCol * 1.15 + uKeyCol * 0.7 + uSunCol * beam * 0.6, fr * 0.78);
    col += (uSkyCol * vec3(0.92, 1.0, 1.2) * 3.2 + uSunCol * beam * 1.2) * hoar * uFrost * clamp(Ng.y * 0.7 + 0.5, 0.0, 1.0);
  #endif
  gl_FragColor = vec4(col, 1.0);
  #if FK == 9 && defined(USE_FOG)
    // the great trunks are the dark of the wood: the mist takes them at half the rate it takes the litter, so that at
    // three distances they are three darks and never slabs of the mist's own grey
    // (and up in the crowns it is dark against the leaves)
    float fd9 = vFogDepth * mix(1.0, 0.3 * (1.0 - 0.65 * smoothstep(3.2, 7.0, crown9)), uMisc.x);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1.0 - exp(-fogDensity * fogDensity * fd9 * fd9));
  #else
  #include <fog_fragment>
  #endif
}`;

// water: beads that tremble where they sit and drips that fall, burst into a crown and start again
const DROP_VERT = /* glsl */`
attribute vec4 iB;          // phase, kind (0 bead, 1 drip), fall height, period
varying vec3 vL, vN;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 c = instanceMatrix[3].xyz;
  float s = length(instanceMatrix[0].xyz);
  vec3 p = position; vec3 sc = vec3(1.0, 0.8, 1.0); float drop = 0.0;
  float tremble = sin(uTime * (4.0 + 5.0 * fract(iB.x * 7.3)) + iB.x * 40.0);
  if (iB.y < 0.5) {
    sc = vec3(1.0 - 0.05 * tremble, 0.78 + 0.07 * tremble, 1.0 - 0.05 * tremble);
  } else {
    float f = fract(uTime / iB.w + iB.x) * iB.w;
    drop = min(15.0 * f * f, 25.0 * f);
    float wob = sin(f * 15.0 + iB.x * 9.0) * 0.16;
    sc = vec3(1.0 + wob, 0.85 - wob * 1.4, 1.0 + wob);
    if (drop > iB.z) {
      float fh = iB.z < 41.6 ? sqrt(iB.z / 15.0) : iB.z / 25.0;
      float a = clamp((f - fh) / 0.5, 0.0, 1.0);
      drop = iB.z;
      float rim = smoothstep(0.3, 1.0, length(position.xz));
      sc = vec3(1.0 + 3.2 * a, (0.45 + 2.2 * rim * sin(a * 3.14159)) * (1.0 - a) * (1.0 - a), 1.0 + 3.2 * a) * step(a, 0.995);
      p.y = abs(p.y);
    }
  }
  vec3 lp = c + p * s * sc - vec3(0.0, drop, 0.0);
  vL = lp; vN = normalize(position / max(sc, vec3(0.2)) + vec3(0.0, 1e-4, 0.0));
  vec4 mvPosition = viewMatrix * vec4(lp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// the crown a raindrop throws up where it bursts: a glass wall that opens and falls back, its points flying off as beads.
// position = (around 0..1, up 0..1, 0) for the wall, a unit sphere for a bead; aK = (0 wall | 1 bead, the bead's point, random);
// iA.x = progress 0..1 (set from u), iA.y = seed
const CROWN_VERT = /* glsl */`
attribute vec3 aK;
attribute vec2 iA;
varying vec3 vL, vN;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 c = instanceMatrix[3].xyz; float s = length(instanceMatrix[0].xyz);
  float a = clamp(iA.x, 0.0, 1.0);
  float open = 1.0 - (1.0 - a) * (1.0 - a);
  float R = mix(0.4, 2.1, open), H = 1.9 * sin(min(a * 1.2, 1.0) * 3.14159);
  vec3 p, n;
  if (aK.x < 0.5) {
    float th = position.x * 6.28318, v = position.y;
    float spike = 0.5 + 0.5 * cos(th * 11.0 + iA.y * 6.0); spike *= spike * spike;
    float r = R * (0.74 + 0.4 * v * v);
    p = vec3(cos(th) * r, H * v * (0.4 + 0.6 * spike * v), sin(th) * r);
    n = vec3(cos(th), 0.55 - 0.9 * v, sin(th));
  } else {
    float th = (aK.y + iA.y) * 6.28318, t = max(a - 0.16, 0.0) * 1.5;
    float r = R * 1.1 + 2.4 * t * (0.6 + 0.8 * aK.z);
    float rad = 0.17 * (0.7 + 0.6 * aK.z) * step(0.16, a) * (1.0 - smoothstep(0.86, 1.0, a));
    p = vec3(cos(th) * r, 1.1 + 3.4 * t - 4.4 * t * t, sin(th) * r) + position * rad;
    n = position;
  }
  vec3 lp = c + p * s * step(0.002, a) * step(a, 0.998);
  vL = lp; vN = normalize(n + vec3(0.0, 1e-4, 0.0));
  vec4 mvPosition = viewMatrix * vec4(lp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// the same glass as the beads, but a thin sheet: clear where it faces the eye, bright only at its edges and highlights
const CROWN_FRAG = BEAD_FRAG.replace('gl_FragColor = vec4(col, 1.0);',
  'float lum = dot(col, vec3(0.3, 0.5, 0.2)); gl_FragColor = vec4(col, clamp(0.07 + 0.8 * fres + smoothstep(0.8, 1.6, lum), 0.0, 1.0));');
// soft sprites: xyz from the CPU, aC = premultiplied colour + alpha, aSz = metres
const SPRITE_VERT = /* glsl */`
attribute vec4 aC;
attribute float aSz;
uniform float uPx;
varying vec4 vC;
varying float vFog;
void main(){
  vec4 mv = viewMatrix * vec4(position, 1.0);
  float px = aSz * projectionMatrix[1][1] * uPx * 0.5 / max(-mv.z, 0.5);
  float pc = clamp(px, 1.5, 46.0);
  float al = (px > 46.0 ? 46.0 / px : 1.0) * smoothstep(1.5, 6.0, -mv.z);
  vC = aC * al; vFog = -mv.z;
  gl_PointSize = pc;
  gl_Position = projectionMatrix * mv;
}`;
// drifting motes that wrap round the camera: pale dust in the shade, gold in the shaft
const MOTE_VERT = /* glsl */`
attribute vec4 aS;
uniform float uPx;
uniform vec3 uBox, uDrift, uMoteCol;
uniform float uMoteK;
varying vec4 vC;
varying float vFog;
${GLSL_COMMON}
void main(){
  vec3 p = aS.xyz * uBox + uDrift * uTime * (0.6 + 0.8 * aS.w);
  p.x += 1.2 * sin(uTime * 0.3 + aS.w * 40.0); p.y += 0.8 * sin(uTime * 0.23 + aS.w * 70.0);
  p = mod(p - uCamL + uBox * 0.5, uBox) - uBox * 0.5;
  float edge = 1.0 - smoothstep(0.38, 0.5, max(abs(p.x) / uBox.x, max(abs(p.y) / uBox.y, abs(p.z) / uBox.z)));
  vec3 wp = p + uCamL;
  float lit = coreMask(wp) * capLit(wp);
  float tw = 0.5 + 0.5 * sin(uTime * (2.0 + 5.0 * aS.w) + aS.w * 300.0); tw *= tw;
  vec4 mv = viewMatrix * vec4(wp, 1.0);
  float size = mix(0.5 + 0.9 * fract(aS.w * 13.0), 0.16, lit);
  float px = size * projectionMatrix[1][1] * uPx * 0.5 / max(-mv.z, 0.5);
  float pc = clamp(px, 1.5, 26.0);
  float al = mix(0.10 * uMoteK, 0.5, lit) * edge * min(px / 1.5, 1.0) * (px > 26.0 ? 26.0 / px : 1.0) * smoothstep(2.0, 7.0, -mv.z);
  vC = vec4(mix(uMoteCol, uSunCol * (0.5 + 2.5 * tw), lit) * al, al * (1.0 - 0.7 * lit));
  vFog = -mv.z;
  gl_PointSize = pc;
  gl_Position = projectionMatrix * mv;
}`;
const SPRITE_FRAG = /* glsl */`
uniform vec3 fogColor;
uniform float fogDensity;
varying vec4 vC;
varying float vFog;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float s = 1.0 - smoothstep(0.0, 1.0, d); s *= s;
  vec4 c = vC * s;
  float f = 1.0 - exp(-fogDensity * fogDensity * vFog * vFog);
  c.rgb = mix(c.rgb, fogColor * c.a, f);
  gl_FragColor = c;
}`;


// the canopy, 3.5 km overhead and far out of focus: discs of copper, lemon and green with small pearl gaps where the
// sky shows, swaying slowly; far trunks as flat pale shapes standing in the fog. Below the horizon the dome carries
// the litter floor on: in flight the real floor hides it, but through the previous world's portal the engine's near
// plane sits at the opening, and this is then the floor between the viewer and the entry.
const DOME_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; }`;
const DOME_FRAG = /* glsl */`
uniform vec3 uFogCol, uCanA, uCanB, uCanC, uGap, uGlow, uTone0, uTone1, uTone2, uTone3, cUmber, cGold, uKeyCol, uKeyDir;
uniform float uSeed, uGapK, uFloorY, uFogDens, uNight, uVault;
uniform vec3 uAmber;
uniform vec4 uAxis;      // xz: the direction from the entry to the parasol; w: how strongly the lit clearing behind it glows
uniform vec4 uHero;      // xyz: the direction from the eye to the parasol's cap; w: how far the canopy round it is put in shade
varying vec3 vD;
${GLSL_COMMON}
${LEAF_GLSL}
// One layer of the canopy seen from below against the light: real beech leaves, each with its midrib and veins, hanging
// in sprays with sky or deeper foliage between. g: the layer's plane coordinate; fw: a pixel's size in g; dens: the share
// of leaves kept here (sprays). Returns the coverage and the covering leaf's colour. A leaf smaller than a few pixels
// is not drawn as a leaf: the layer goes over to an even veil of its mean colour, so nothing sparkles.
float leafLayer(vec2 g, float seed, float fw, float dens, out vec3 lc){
  vec2 buv; float bid, be, bl, bn;
  float best = leafCell(g, seed, buv, bid, be, bl, bn);
  float keep = step(fract(bid * 37.7), dens);
  float fl = fw / max(bl, 1.0);
  float a = best >= 0.0 ? smoothstep(0.0, fl + 0.004, be) * keep : 0.0;
  // (a crown is one colour: green, lemon or copper by the drift, each leaf only a little off its neighbours)
  float tsel = vnoise(vec3(g * 0.11, seed + 2.0)) + 0.3 * (vnoise(vec3(g * 0.37, seed)) - 0.5) + 0.16 * (fract(bid * 11.3) - 0.5);
  vec3 tone = mix(mix(uCanC, uCanB, smoothstep(0.4, 0.5, tsel)), uCanA, smoothstep(0.58, 0.68, tsel));
  tone *= 0.8 + 0.36 * fract(bid * 7.3);
  float kv = 1.0 - smoothstep(0.03, 0.12, fl);
  float mid = (1.0 - smoothstep(0.005, 0.012 + fl, abs(buv.y))) * kv;
  float vv = (1.0 - smoothstep(0.1, 0.3, abs(fract((buv.x - abs(buv.y) * 1.05) * 8.0 + bid * 7.0) - 0.5))) * (1.0 - smoothstep(0.008, 0.03, fl));
  lc = tone * (1.0 - 0.5 * mid) * (1.0 - 0.24 * vv) * (0.8 + 0.3 * smoothstep(0.0, 0.07, be));
  float lost = smoothstep(0.22, 0.6, fw);
  lc = mix(lc, uCanA * 0.4 + uCanB * 0.32 + uCanC * 0.28, lost);
  return mix(a, dens * 0.86, lost);
}
// a rank of far trunks standing round the horizon: n places, each with a column at its own spot and of its own girth,
// flared at the foot. az 0..1 round the horizon; aa: a pixel in the same unit. Returns coverage; sdn = -1..1 across the
// trunk, idr its random
float trunkRank(float az, float elv, float n, float seed, float aa, out float sdn, out float idr){
  float c = az * n, i = floor(c);
  float h = fract(sin((i + seed) * 12.9898) * 43758.5453), h2 = fract(h * 17.3);
  float wHalf = (0.05 + 0.04 * h2) * (1.0 + 1.1 * exp(-elv * 15.0) * (1.0 + 0.2 * sin(elv * 50.0 + h * 40.0)) + 0.3 * exp(-elv * 3.5)) * (1.0 - 0.35 * elv);
  float ce = max(cos(elv), 0.15);       // a column keeps its girth as the eye looks up it
  sdn = (c - i - 0.33 - 0.34 * h) * ce / wHalf; idr = h;
  float e = aa * n * ce / wHalf;
  return 1.0 - smoothstep(1.0 - e, 1.0 + e, abs(sdn));
}
void main(){
  vec3 d = normalize(vD + vec3(0.0, 1e-4, 0.0));
  vec3 col;
  // (the canopy's plane coordinate and a pixel's size in it, for the branch above the horizon: taken here on every pixel,
  // since a derivative taken in a branch that the pixel next to it does not take is not defined)
  float up = max(d.y, 0.0);
  vec2 uv = d.xz / (up + 0.3);
  vec2 fwv = fwidth(uv);
  if (d.y < -0.003) {
    float t = max(cameraPosition.y - uFloorY, 0.4) / max(-d.y, 1e-3);
    vec3 P = cameraPosition + d * t;
    vec2 buv, uvB; float bid, idB, be, eB, bl, lB, nT, nB;
    float best = leafCell(P.xz / 6.6, uSeed, buv, bid, be, bl, nT);
    float pB = leafCell(P.xz / 5.7 + 37.7, uSeed + 5.0, uvB, idB, eB, lB, nB);
    float under = 0.0;
    if (best < 0.0 && pB >= 0.0) { buv = uvB; bid = fract(idB + 0.37); be = eB; best = pB; under = 1.0; }
    float n1 = vnoise(P * 0.35 + uSeed), n2 = vnoise(P * 1.7);
    vec3 alb = mix(cUmber * 0.9 + 0.012, uTone3 * 0.7, smoothstep(0.3, 0.7, n1)) * (0.62 + 0.5 * n2) * 0.78;
    float gl = 0.5;
    if (best >= 0.0) {
      vec3 tone = bid < 0.25 ? uTone0 : bid < 0.5 ? uTone1 : bid < 0.75 ? uTone2 : uTone3;
      tone = mix(tone, cGold * 0.5, step(0.86, fract(bid * 11.3)) * 0.4);
      tone *= 0.74 + 0.5 * fract(bid * 7.3);
      float mid = 1.0 - smoothstep(0.004, 0.02, abs(buv.y));
      float vv = 1.0 - smoothstep(0.1, 0.3, abs(fract((buv.x - abs(buv.y) * 1.05) * 9.0 + bid * 7.0) - 0.5));
      vec3 leaf = tone * (0.62 + 0.5 * vnoise(vec3(buv * 9.0, bid * 30.0))) * (1.0 - 0.45 * mid) * (0.72 + 0.28 * vv);
      leaf = mix(leaf, cUmber * 0.42, smoothstep(0.5, 0.75, vnoise(vec3(buv * 6.0, bid * 17.0))) * 0.6);
      leaf *= (1.0 - 0.42 * under) * (0.4 + 0.6 * smoothstep(0.0, 0.05, be));
      alb = mix(alb, leaf, smoothstep(0.0, 0.01, be));
      gl = 0.4 + 0.5 * fract(bid * 5.1);
    }
    if (under > 0.5 || best < 0.0) alb *= 0.7 + 0.3 * smoothstep(0.0, 0.055, nT);
    alb = mix(alb, vec3(dot(alb, vec3(0.3, 0.55, 0.15)) * 1.25 + 0.07), uNight * 0.8);
    // seen close (from the portal, before the floor mesh begins) it must not go flat: copper and umber, blotched,
    // with wet-black crumbs and husk shadows in it
    float nearF = 1.0 - smoothstep(30.0, 110.0, t);
    alb *= mix(vec3(1.0), vec3(1.0, 0.8, 0.6), 0.6 * nearF) * (0.72 + 0.56 * vnoise(P * 1.3 + 5.0));
    alb = mix(alb, cUmber * 0.22, smoothstep(0.6, 0.7, vnoise(vec3(P.xz * 0.5, 3.0))) * 0.8 * nearF);
    col = alb * (uSkyCol * 0.95 + uKeyCol * clamp(uKeyDir.y * 0.7 + 0.3, 0.0, 1.0)) * mix(0.8, 0.6, nearF);
    float fres = 0.04 + 0.96 * pow(1.0 - clamp(-d.y, 0.0, 1.0), 5.0);
    col += uSkyCol * uWet * gl * (0.16 * fres + 0.5 * smoothstep(0.55, 0.8, vnoise(vec3(P.xz * 0.9, 7.0))) * smoothstep(0.6, 0.9, n2));
    // beads of water catching the sky
    vec2 bc = P.xz / 2.6, bi = floor(bc); vec2 br = h22(bi + 91.0);
    col += uSkyCol * 1.5 * step(0.8, br.x) * (1.0 - smoothstep(0.03, 0.1, length(fract(bc) - 0.25 - 0.5 * br)));
    float f = 1.0 - exp(-uFogDens * uFogDens * t * t);
    col = mix(col, uFogCol, f);
  } else {
    float fw = max(fwv.x, fwv.y);
    vec2 sway = 0.02 * vec2(sin(uTime * 0.21 + uv.y * 2.0), cos(uTime * 0.17 + uv.x * 2.0));
    float big = vnoise(vec3(uv * 0.9, uSeed)), big2 = vnoise(vec3(uv * 2.1 + 7.0, uSeed + 3.0));
    float sunward = max(dot(d, uSunDir), 0.0);
    float az = atan(d.z, abs(d.x) + abs(d.z) < 1e-5 ? 1.0 : d.x), elv = asin(clamp(d.y, 0.0, 1.0)), cel = sqrt(max(1.0 - d.y * d.y, 0.0));
    // The canopy is read from the ground up as three depths of beech leaf against the light. Deepest: the dark of the
    // crowns with pearl sky showing through in clusters. Over it a roof of small leaves in the crowns' own shade. Then
    // sprays of larger leaves lit through, copper, lemon and green, and nearest a few big leaves hanging low.
    vec3 skyC = uGap * (0.84 + 0.3 * sunward * sunward);
    vec3 deepC = mix(mix(uCanA, uCanC, smoothstep(0.3, 0.7, big)), uCanB, smoothstep(0.55, 0.85, big2) * 0.5) * 0.3;
    float gapN = vnoise(vec3(uv * 4.6 + 3.0, uSeed + 9.0)) + 0.3 * (vnoise(vec3(uv * 15.0, 2.0)) - 0.5);
    float gapT = 0.64 - uGapK - 0.1 * sunward * sunward;
    float gapM = smoothstep(gapT, gapT + 0.1, gapN);
    vec3 can = mix(deepC, skyC, gapM);
    vec3 lc;
    float deep = smoothstep(0.1, 0.55, d.y) * (1.0 - uNight);
    float c3 = leafLayer(uv * 64.0 + sway * 30.0 + uSeed, 3.0, fw * 64.0, 0.78 + 0.2 * big, lc);
    can = mix(can, lc * mix(vec3(0.5), vec3(0.34, 0.42, 0.37), deep), c3);
    float c2 = leafLayer(uv * 34.0 + sway * 18.0 + 11.0, 7.0, fw * 34.0, smoothstep(0.3, 0.7, vnoise(vec3(uv * 2.6 + 5.0, uSeed + 1.0))), lc);
    can = mix(can * (1.0 - 0.3 * c2), lc * (0.66 + 0.6 * sunward) * (0.85 + 0.3 * big2), c2);
    float c1 = leafLayer(uv * 19.0 + sway * 12.0 + 23.0, 13.0, fw * 19.0, smoothstep(0.56, 0.74, vnoise(vec3(uv * 1.5 + 9.0, uSeed + 5.0))) * 0.85, lc);
    can = mix(can * (1.0 - 0.35 * c1), lc * (0.58 + 0.5 * sunward), c1);
    // round the parasol the canopy is a dark, cool mass of copper and green: the lit cap and the bar stand against it
    // (under the vault itself the whole canopy above is that mass, a stop down and cooler: the lit gills and the gold
    // side of the stalk are then the brightest things in the picture, and only a few pearl gaps break the dark)
    float hk = smoothstep(mix(0.72, -0.35, uVault), mix(0.96, 0.3, uVault), dot(d, uHero.xyz)) * uHero.w;
    can = mix(can, can * mix(vec3(0.5, 0.62, 0.56), vec3(0.26, 0.38, 0.4), uVault), hk);
    // great boughs reach up from the trunks into the canopy: dark limbs with a fork each, in front of the leaves
    float bough = 0.0;
    float aaz = (abs(fwv.x) + abs(fwv.y)) * 0.35 + 0.002;
    for (int i = 0; i < 7; i++) {
      float fi = float(i), hb = fract(sin(fi * 12.9898 + uSeed * 3.1) * 43758.5453), hc = fract(hb * 13.7);
      float a0 = fi * 0.898 + hb * 0.5 + uSeed;
      float c = a0 + (hc - 0.5) * 1.5 * elv + 0.07 * sin(elv * 7.0 + fi * 2.3);
      float w = mix(0.05, 0.01, smoothstep(0.0, 1.25, elv)) * (0.7 + 0.6 * hc);
      float da = abs(mod(az - c + 3.14159, 6.28318) - 3.14159) * cel;
      float m = 1.0 - smoothstep(w - aaz, w + aaz, da);
      float c2b = c + (hb > 0.5 ? 1.0 : -1.0) * 0.55 * max(elv - 0.22 - 0.3 * hc, 0.0);
      float da2 = abs(mod(az - c2b + 3.14159, 6.28318) - 3.14159) * cel;
      m = max(m, (1.0 - smoothstep(w * 0.5 - aaz, w * 0.5 + aaz, da2)) * step(0.22 + 0.3 * hc, elv));
      bough = max(bough, m * smoothstep(0.2, 0.36, elv) * (1.0 - smoothstep(0.8, 1.25, elv)));
    }
    can = mix(can, mix(uFogCol * 0.3, deepC, 0.5) * (1.0 - 0.4 * hk), bough * 0.86);
    can += uGlow * (0.5 * pow(sunward, 6.0) + 1.2 * pow(sunward, 40.0)) * (1.0 - bough * 0.6);
    float hz = 1.0 - smoothstep(0.03, 0.36, d.y);
    // a far glade: low on the sun's side the wood opens, and the mist there is bright; the trunks stand dark against it
    float sunAz = atan(uSunDir.z, abs(uSunDir.x) + abs(uSunDir.z) < 1e-5 ? 1.0 : uSunDir.x);
    float dAz = abs(mod(az - sunAz + 3.14159, 6.28318) - 3.14159);
    float glade = exp(-dAz * dAz * 2.2) * exp(-elv * 7.0) * (1.0 - uNight * 0.6);
    vec3 fogH = uFogCol * (1.0 + 0.22 * glade) + uGlow * 1.6 * glade;
    col = mix(can, fogH, clamp(0.08 + 0.92 * hz, 0.0, 1.0));
    // the wall of the wood: two ranks of far trunks, the nearer rank darker, each lit from the bright side, mossed at
    // the foot; they fade up into the canopy, where the boughs take over
    float az01 = az / 6.28318 + 0.5, aaT = aaz / 6.28318 / max(cel, 0.2);
    float sdB, idB2, sdA, idA2;
    float tB = trunkRank(az01, elv, 19.0, 3.0 + uSeed, aaT, sdB, idB2);
    float tAr = trunkRank(az01, elv, 10.0, 11.0 + uSeed, aaT, sdA, idA2);
    float tFade = (1.0 - smoothstep(0.22, 0.6, elv)) * (0.5 + 0.5 * smoothstep(0.0, 0.05, elv));
    float sideL = clamp(2.0 * sin(sunAz - az), -1.0, 1.0);
    float barkB = 0.9 + 0.2 * vnoise(vec3(sdB * 5.0 + idB2 * 20.0, elv * 2.0, 1.0));
    vec3 tcolB = fogH * mix(0.74, 0.6, idB2) * vec3(0.94, 1.0, 0.97) * (0.86 + 0.2 * clamp(sdB, -1.0, 1.0) * sideL) * barkB;
    col = mix(col, tcolB, tB * tFade * 0.9);
    float barkA = 0.88 + 0.24 * vnoise(vec3(sdA * 6.0 + idA2 * 20.0, elv * 2.0, 1.0)) - 0.14 * smoothstep(0.55, 0.75, vnoise(vec3(sdA * 2.5 + idA2 * 9.0, elv * 14.0, 4.0)));
    vec3 tcolA = mix(uFogCol * vec3(0.4, 0.44, 0.41), uFogCol * vec3(0.25, 0.29, 0.27), idA2) * (0.84 + 0.3 * clamp(sdA, -1.0, 1.0) * sideL) * barkA;
    tcolA = mix(tcolA, tcolA * vec3(0.72, 1.1, 0.6), exp(-elv * 16.0) * 0.6);
    col = mix(col, tcolA, tAr * tFade * mix(0.7, 0.95, idA2));
    // the great beech that stands behind the parasol as the entry sees it: a darker wall for the lit column to stand against
    vec2 hd = normalize(d.xz + vec2(1e-5, 0.0));
    float behind = smoothstep(0.95, 0.994, dot(hd, uAxis.xy)) * (1.0 - smoothstep(0.07, 0.3, d.y));
    col = mix(col, uAmber * (0.8 + 0.4 * vnoise(vec3(d.xz * 9.0, 2.0))), behind * 0.88 * uAxis.w);
  }
  col = mix(col, uFogCol, 1.0 - smoothstep(0.0, 0.02, abs(d.y + 0.003)));
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- geometry helpers
// merge gridGeo-style geometries (position, normal, aCol, aux, index); each entry may carry a Matrix4
function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const e of list) { const g = e.g || e; nv += g.attributes.position.count; ni += g.index.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), aux = new Float32Array(nv * 2);
  const idx = new (nv > 65535 ? Uint32Array : Uint16Array)(ni);
  let vo = 0, io = 0; const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  for (const e of list) {
    const g = e.g || e, m = e.m || null, n = g.attributes.position.count;
    const gp = g.attributes.position.array, gn = g.attributes.normal.array;
    if (m) nm.getNormalMatrix(m);
    for (let i = 0; i < n; i++) {
      v.set(gp[i * 3], gp[i * 3 + 1], gp[i * 3 + 2]); if (m) v.applyMatrix4(m);
      pos[(vo + i) * 3] = v.x; pos[(vo + i) * 3 + 1] = v.y; pos[(vo + i) * 3 + 2] = v.z;
      v.set(gn[i * 3], gn[i * 3 + 1], gn[i * 3 + 2]); if (m) v.applyMatrix3(nm).normalize();
      nor[(vo + i) * 3] = v.x; nor[(vo + i) * 3 + 1] = v.y; nor[(vo + i) * 3 + 2] = v.z;
    }
    col.set(g.attributes.aCol.array, vo * 3); aux.set(g.attributes.aux.array, vo * 2);
    const gi = g.index.array;
    for (let i = 0; i < gi.length; i++) idx[io + i] = gi[i] + vo;
    vo += n; io += gi.length; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  out.setAttribute('aux', new THREE.BufferAttribute(aux, 2));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
// loose triangles: V holds 8 floats per vertex (xyz, rgb, aux xy), three vertices per triangle
function triGeo(V) {
  const n = V.length / 8, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), aux = new Float32Array(n * 2), idx = new Uint16Array(n);
  for (let i = 0; i < n; i++) {
    pos[i * 3] = V[i * 8]; pos[i * 3 + 1] = V[i * 8 + 1]; pos[i * 3 + 2] = V[i * 8 + 2];
    col[i * 3] = V[i * 8 + 3]; col[i * 3 + 1] = V[i * 8 + 4]; col[i * 3 + 2] = V[i * 8 + 5];
    aux[i * 2] = V[i * 8 + 6]; aux[i * 2 + 1] = V[i * 8 + 7]; idx[i] = i;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aux', new THREE.BufferAttribute(aux, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}
// surface of revolution about +Y: prof(v) -> [radius, y]; paint(u, v, o) may set o.c and o.a
function lathe(nu, nv, prof, paint) {
  return gridGeo(nu, nv, true, (u, v, o, i, j) => {
    const pr = prof(v), th = u * TAU;
    o.p[0] = Math.cos(th) * pr[0]; o.p[1] = pr[1]; o.p[2] = Math.sin(th) * pr[0];
    o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = 1; o.a[1] = 1;
    if (paint) paint(u, v, o, pr);
  });
}
// tube along a polyline of Vector3 (smoothed with a Catmull-Rom): radius(t) m, aux = (around, metres along)
function tubeGeo(points, nSeg, nRad, radius, color, bump) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const L = curve.getLength(), P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3();
  const frames = [];
  for (let j = 0; j <= nSeg; j++) {
    curve.getPointAt(j / nSeg, P); curve.getTangentAt(j / nSeg, T);
    N.set(0, 1, 0).addScaledVector(T, -T.y).normalize(); if (N.lengthSq() < 0.01) N.set(1, 0, 0);
    B.crossVectors(T, N).normalize();
    frames.push([P.clone(), N.clone(), B.clone()]);
  }
  return gridGeo(nRad, nSeg, true, (u, v, o, i, j) => {
    const f = frames[j], th = u * TAU, cs = Math.cos(th), sn = Math.sin(th);
    let r = radius(v);
    if (bump) r *= 1 + bump(cs, sn, v * L);
    o.p[0] = f[0].x + (f[1].x * cs + f[2].x * sn) * r; o.p[1] = f[0].y + (f[1].y * cs + f[2].y * sn) * r; o.p[2] = f[0].z + (f[1].z * cs + f[2].z * sn) * r;
    o.c[0] = color.r; o.c[1] = color.g; o.c[2] = color.b; o.a[0] = u; o.a[1] = v * L;
  });
}
// a lumpy ellipsoid (body parts): centre c, radii r, colour, ao, gloss
function blob(c, r, color, nu = 10, nv = 6, ao = 1, gl = 1) {
  return gridGeo(nu, nv, true, (u, v, o) => {
    const th = u * TAU, ph = v * Math.PI, s = Math.sin(ph);
    o.p[0] = c[0] + Math.cos(th) * s * r[0]; o.p[1] = c[1] + Math.cos(ph) * r[1]; o.p[2] = c[2] + Math.sin(th) * s * r[2];
    o.c[0] = color.r; o.c[1] = color.g; o.c[2] = color.b; o.a[0] = ao * (0.6 + 0.4 * (0.5 + 0.5 * Math.cos(ph))); o.a[1] = gl;
  });
}
// a thin jointed limb as a 3-sided tube through pts ([x,y,z] arrays). weighted: aux = (weight 0..1 along, -(1 + phase)),
// which the leg, wind and wing vertex kinds animate; otherwise aux = (ao, gloss = phase)
function limb(pts, r, color, phase, weighted = true) {
  const n = pts.length - 1;
  return gridGeo(3, n, true, (u, v, o, i, j) => {
    const p = pts[j], th = u * TAU, k = r * (1 - 0.6 * v);
    o.p[0] = p[0] + Math.cos(th) * k; o.p[1] = p[1] + Math.sin(th) * k * 0.9; o.p[2] = p[2] + Math.sin(th + 1.6) * k;
    o.c[0] = color.r; o.c[1] = color.g; o.c[2] = color.b; o.a[0] = weighted ? v : 0.85; o.a[1] = weighted ? -(1 + phase) : phase;
  });
}

// a round, smooth limb through pts ([x,y,z]) with a radius per point (rad[i]); ns sides, sub steps per span.
// aux = (ao, gl) unless paint(u, v, o, t) sets it; t runs 0..1 along the limb
function tubeR(pts, rad, color, ns = 8, sub = 3, ao = 1, gl = 1, paint = null) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  const nSeg = (pts.length - 1) * sub, P = new THREE.Vector3(), T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), frames = [];
  let prevN = null;
  for (let j = 0; j <= nSeg; j++) {
    const t = j / nSeg; curve.getPoint(t, P); curve.getTangent(t, T);
    if (prevN) N.copy(prevN).addScaledVector(T, -prevN.dot(T));
    else { N.set(0, 1, 0).addScaledVector(T, -T.y); if (N.lengthSq() < 0.01) N.set(1, 0, 0).addScaledVector(T, -T.x); }
    N.normalize(); B.crossVectors(T, N).normalize(); prevN = N.clone();
    const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i;
    frames.push([P.clone(), N.clone(), B.clone(), mixn(rad[i], rad[i + 1], k * k * (3 - 2 * k))]);
  }
  return gridGeo(ns, nSeg, true, (u, v, o, i, j) => {
    const f = frames[j], th = u * TAU, cs = Math.cos(th), sn = Math.sin(th), r = f[3];
    o.p[0] = f[0].x + (f[1].x * cs + f[2].x * sn) * r; o.p[1] = f[0].y + (f[1].y * cs + f[2].y * sn) * r; o.p[2] = f[0].z + (f[1].z * cs + f[2].z * sn) * r;
    o.c[0] = color.r; o.c[1] = color.g; o.c[2] = color.b; o.a[0] = ao; o.a[1] = gl;
    if (paint) paint(u, v, o, v);
  });
}

// ---------------------------------------------------------------- looks (hour of day)
// can A/B/C: the copper, lemon and green of the canopy's out-of-focus leaf masses; gap: the pearl sky between them
const LOOKS = {
  afternoon: { fog: '#C6D2BE', fogK: 0.6, dens: 0.0033, exposure: 1.36, canA: '#A0521F', canB: '#C7AE3C', canC: '#44702A', gap: '#DCE6D6', gapI: 0.9, glowI: 0.32, tint: '#fbf8ee', shadow: '#0a1409', sat: 1.06, bloom: 0.42, portal: '#ffd98a', heroFog: 0.6, wall: 0.7 },
  dawn: { fog: '#EBD9D6', fogK: 0.86, dens: 0.0056, exposure: 1.2, canA: '#9A5638', canB: '#CFAE74', canC: '#5E7A4A', gap: '#F3E4E0', gapI: 0.95, glowI: 0.6, tint: '#fff0ee', shadow: '#150e14', sat: 1.04, bloom: 0.5, portal: '#ffc2b0', heroFog: 0.5, wall: 0.78 },
  day: { fog: '#D3DAD6', fogK: 0.9, dens: 0.0036, exposure: 1.12, canA: '#96501F', canB: '#C6B548', canC: '#4A7A30', gap: '#E6ECEA', gapI: 0.98, glowI: 0.3, tint: '#f6faff', shadow: '#0c1210', sat: 1.12, bloom: 0.36, portal: '#e8f4ff', heroFog: 0.62, wall: 0.74 },
  night: { fog: '#3D4F86', fogK: 0.5, dens: 0.0036, exposure: 2.5, canA: '#243260', canB: '#344C88', canC: '#1E2E58', gap: '#9FB4EE', gapI: 0.62, glowI: 0.5, tint: '#eef0ff', shadow: '#080b1a', sat: 0.8, bloom: 0.55, portal: '#a9c4ff', heroFog: 0.62, wall: 0.6 },
};
const SEASONS = {
  october: ['#B5622B', '#8E4A22', '#C98A45', '#73401F'],
  early: ['#C9B13A', '#8FA038', '#B5622B', '#D9C25A'],
  late: ['#7E4A27', '#8E5531', '#A06436', '#6E4426'],
};

export default {
  id: 'spore-rain',
  name: 'Spore Rain',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['tiny'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || {};
    const dens = vary.density ?? 1;
    const vr = rng.fork('spore-look-2');
    const rx = makeRng('spore-rain-extras:' + ctx.seed);          // what was added later draws from its own stream: the old layout stays put
    const r3 = makeRng('spore-rain-third:' + ctx.seed);           // and what was added after that, from a third
    const r4 = makeRng('spore-rain-fourth:' + ctx.seed);          // and the fourth round's: the great trunks, the exit's floor, the root and its beetle
    // ---- which visit is this: hour, weather, season, cast
    let hour = vary.hour === 'golden' ? 'afternoon' : (vary.hour === 'dawn' || vary.hour === 'day' || vary.hour === 'night') ? vary.hour : null;
    { const r = vr(); if (!hour) hour = r < 0.45 ? 'afternoon' : r < 0.63 ? 'dawn' : r < 0.8 ? 'day' : 'night'; }
    let weather; { const r = vr(); weather = r < 0.5 ? 'drip' : r < 0.78 ? 'shower' : 'frost'; }
    let season; { const r = vr(); season = r < 0.5 ? 'october' : r < 0.76 ? 'early' : 'late'; }
    const snailMorph = hour === 'night' ? 'slug' : vr.pick(['yellow', 'yellow', 'pink', 'brown']);
    const bronze = vr.chance(0.3), pills = vr.chance(0.35);
    const rare = !!vary.rare;
    const LOOK = LOOKS[hour];
    const night = hour === 'night', frost = weather === 'frost', shower = weather === 'shower', late = season === 'late';
    const C = {}; ['copper', 'umber', 'moss', 'pearl', 'cream', 'gold', 'scarlet'].forEach((k, i) => { C[k] = new THREE.Color(PALETTE[i]); });
    const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);

    const scene = new THREE.Scene();
    const hero = await buildHero(ctx, { palette: PALETTE, hour, weather, season });
    scene.add(hero.object);
    const shaftU = (() => { const sb = hero.object.getObjectByName('shaft'); if (!sb) return null; sb.material.uniforms.uStrength.value *= 1.9 * (hour === 'day' ? 5.5 : 1); return sb.material.uniforms.uStrength; })();
    const shaft0 = shaftU ? shaftU.value : 0;
    // under the vault the bar seen in the air narrows to a core that rakes the stalk and the middle of the gills (the
    // light on the surfaces keeps the whole shaft): the track passes below and beside it, so the bar crosses the frame
    // with gold glitter inside it and grey smoke outside
    hero.shaft.point.z = 5;
    const U = hero.uniforms;
    if (U.uFogK) U.uFogK.value = LOOK.heroFog;          // the parasol keeps more of itself through the fog than the litter does: it is the one lit thing
    if (U.uGlitR && hour === 'day') U.uGlitR.value = 11;          // by day the bar seen in the air is the shaft's pale core: the spores glitter inside it, not beside it
    await ctx.yield();

    // ---- the route: litter, arcade, moss, round the snail, the agaric arc, up the bank, under the vault,
    // down the fallen branch and into the log
    const ft = hero.anchors.flyThrough;
    const outDir = ft[7].clone().sub(ft[6]).setY(0).normalize();
    const y0 = FLOOR + EYE, jx = rng.range(-1.5, 1.5);
    const brEnd = ft[7].clone().addScaledVector(outDir, 49.4).setY(-6);
    const exit = brEnd.clone().addScaledVector(outDir, 60);
    const pts = [[0, y0, 420], [0, y0, 380], [0, y0, 330], [-2 + jx, y0, 296], [-6 + jx, y0, 264], [-6 + jx, y0, 238], [-2 + jx * 0.5, y0, 204],
      [-3 - jx, y0, 162], [-7, y0, 122], [-8, y0, 98], [-8, y0, 84], [-7.5, y0 + 6, 64]];
    for (const p of ft) pts.push(p.clone());
    pts.push(ft[7].clone().lerp(brEnd, 0.5), brEnd.clone(), brEnd.clone().lerp(exit, 0.5), exit.clone());
    const path = makePath(pts);
    const L = path.length;
    await ctx.yield();
    // ---- clear air by place at the build: the flown line as points a quarter of a metre apart, for the three guards below
    // (the parasol's drips here, the gnats and the wood's drips where they are dealt). They read the line's place only: no
    // lens, seed or share of the flight, and they take no draw, so nothing else of the deal moves.
    const CLEAR_AIR = 2.3, lineP = new Float32Array((Math.ceil(L / 0.25) + 1) * 3), lineN = lineP.length / 3;
    for (let i = 0, q = new THREE.Vector3(); i < lineN; i++) { path.posAtDist(Math.min(i * 0.25, L), q); lineP[i * 3] = q.x; lineP[i * 3 + 1] = q.y; lineP[i * 3 + 2] = q.z; }
    // The line is searched coarse first, so that a guard is no stall in the build: every sixteenth point (4 m of route apart)
    // and the last. No point of the line lies more than 2 m from one of those, so a body farther than its need and 2 m from
    // each of them is clear of the whole line; round the others the points between are searched one by one. d2(j) is the
    // square of the body's distance to the line's point at lineP[j]. nearLine leaves the least square found in nearD2 and
    // its place in nearJ: the least of the whole line wherever that is under the need (and 1e9 where nothing came near).
    let nearD2 = 1e9, nearJ = -1;
    const nearLine = (d2, need) => {
      const c2 = (need + 2.01) * (need + 2.01); nearD2 = 1e9; nearJ = -1;
      for (let c = 0; ; c += 16) {
        const cc = Math.min(c, lineN - 1);
        if (d2(cc * 3) < c2) for (let k = Math.max(cc - 8, 0), e = Math.min(cc + 8, lineN - 1); k <= e; k++) { const d = d2(k * 3); if (d < nearD2) { nearD2 = d; nearJ = k * 3; } }
        if (cc === lineN - 1) break;
      }
    };
    // A DRIPPER NEVER FALLS THROUGH THE FLOWN LINE. A bead of the parasol dealt as a dripper swells, lets go and falls straight
    // down from where it hangs (the part's BEAD_VERT). Where that upright column, as long as its fall and widened by the drop
    // as drawn (1.25 radii), comes within CLEAR_AIR of the line, the bead is made one that hangs and trembles and does not
    // fall. The staged drips (kind 2) are laid by the part beside the pass and are left as they are.
    {
      const wb = hero.object.getObjectByName('water'), at = wb && wb.geometry.getAttribute('iB');
      if (at) {
        const a = at.array, m = wb.instanceMatrix.array;
        for (let i = 0; i < wb.count; i++) {
          if (a[i * 4 + 1] !== 1) continue;
          const o = i * 16, cx = m[o + 12], cy = m[o + 13], cz = m[o + 14], lo = cy - a[i * 4 + 2], need = CLEAR_AIR + 1.25 * Math.hypot(m[o], m[o + 1], m[o + 2]);
          nearLine((j) => { const dx = lineP[j] - cx, dz = lineP[j + 2] - cz, y = lineP[j + 1], dy = y > cy ? y - cy : y < lo ? lo - y : 0; return dx * dx + dy * dy + dz * dz; }, need);
          if (nearD2 < need * need) a[i * 4 + 1] = 0;
        }
        at.needsUpdate = true;
      }
    }
    await ctx.yield();
    const uOfZ = (z) => { let best = 0, bd = 1e9; for (let i = 0; i <= 200; i++) { const p = path.pointAt(i / 200 * 0.66); const d = Math.abs(p.z - z); if (d < bd) { bd = d; best = i / 200 * 0.66; } } return best; };
    const U_BANK = uOfZ(84), U_CREST = uOfZ(44), U_HUB = path.nearestXZ(ft[3].x, ft[3].z).u, U_BR = path.nearestXZ(ft[7].x, ft[7].z).u;
    const U_BREND = path.nearestXZ(brEnd.x, brEnd.z).u;
    const tmpV = new THREE.Vector3(), tmpT = new THREE.Vector3();
    // a point beside the path: d metres along, side metres to the right, returns [x, z]
    const beside = (d, side) => { path.posAtDist(d, tmpV); path.tangentAtDist(d, tmpT); const l = Math.hypot(tmpT.x, tmpT.z) || 1; return [tmpV.x - tmpT.z / l * side, tmpV.z + tmpT.x / l * side]; };

    // ---- the ground: rolling litter, the root bank, the track the beetle runs on
    const cushions = [];           // moss domes [x, z, radius, height], filled below; they add moss to the floor shader
    const bankAt = (x, z) => {
      const dx = Math.abs(x - 8) - 38, dz = Math.abs(z - 4) - 25;
      const sd = Math.hypot(Math.max(dx, 0), Math.max(dz, 0)) + Math.min(Math.max(dx, dz), 0);
      const W = mixn(20, 40, sstep(0, 30, z - 4));
      const t = clamp01((sd - 15) / W);
      return 1 - (0.6 * t + 0.4 * t * t * (3 - 2 * t));
    };
    const rawGround = (x, z) => {
      const b = bankAt(x, z);
      let h = FLOOR + (1.5 * noise.fbm2(x * 0.017, z * 0.017, 3) + 0.45 * noise.n2(x * 0.075 + 9, z * 0.075)) * (1 - 0.75 * b);
      const slope = 4 * b * (1 - b);
      h += 12 * b + slope * (1.5 * (1 - Math.abs(noise.n2(x * 0.05 + 3, z * 0.012))) - 0.7 + 0.5 * noise.n2(x * 0.11, z * 0.11));
      const r = Math.hypot(x, z);
      return mixn(h, -0.3, 1 - sstep(13, 26, r));
    };
    // the track is level under the eye; where the beetle steps from the bank onto the fallen branch the ground falls
    // away under the branch over a dozen metres (no cliff for litter to stand up against)
    const heightAt = (x, z) => {
      const h = rawGround(x, z), n = path.nearestXZ(x, z);
      const onTrack = mixn(h, n.y - EYE, 1 - sstep(4, 13, n.dist));
      const underBranch = Math.min(h, n.y - EYE - 3.5 + Math.max(0, n.dist - 5) * 0.6);
      return mixn(onTrack, underBranch, sstep(U_BR - 0.022, U_BR + 0.004, n.u));
    };

    // ---- light and atmosphere shared by every material
    const sunDir = U.uSunDir.value;
    const keyDir = new THREE.Vector3(sunDir.x, 0, sunDir.z).normalize().multiplyScalar(0.8).setY(0.6).normalize();
    const keyCol = U.uSkyCol.value.clone().multiplyScalar(0.8).add(U.uSunCol.value.clone().multiplyScalar(night ? 0.24 : 0.05));
    const fogCol = col(LOOK.fog, LOOK.fogK);
    scene.fog = new THREE.FogExp2(fogCol, LOOK.dens);
    scene.background = fogCol.clone();
    const tones = SEASONS[season].map((h) => col(h));
    const AZ0 = 396, AZ1 = 334;                                          // the leaf arcade: near mouth, far mouth
    // The arcade is a nave, not a tent: two walls of leaves lean in from feet arcF apart to tops arcT apart at height
    // arcH, and smaller leaves lie across the gap as a roof. From the entry the whole parasol stands inside its section.
    const arcS = (z) => clamp01((AZ0 - z) / (AZ0 - AZ1));
    const arcF = (z) => 9 + 3 * arcS(z), arcT = (z) => 3.6 + 2.6 * arcS(z), arcH = (z) => FLOOR + 13.5 + 4 * arcS(z);
    const ridgeAt = (z) => arcH(z) + 1.2;                                 // the twig the roof leaves hang over
    const arcWallY = (x, z) => { const ax = Math.abs(x), t = arcT(z), f = arcF(z); return ax <= t ? arcH(z) : mixn(arcH(z), FLOOR, clamp01((ax - t) / (f - t))); };
    const XU = {
      uKeyDir: { value: keyDir }, uKeyCol: { value: keyCol },
      uArc: { value: new THREE.Vector4(AZ1, AZ0, FLOOR, 15) }, uNight: { value: night ? 1 : 0 },
      uTone0: { value: tones[0] }, uTone1: { value: tones[1] }, uTone2: { value: tones[2] }, uTone3: { value: tones[3] },
    };
    const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    const wmat = (fk, vk, o = {}) => new THREE.ShaderMaterial({
      defines: fk === 10 ? { FK: 9, VK: vk, BOUGH: 1 } : { FK: fk, VK: vk },
      uniforms: { ...fogU(), ...U, ...XU, uMisc: { value: new THREE.Vector4(...(o.misc || [0, 0, 1, 0])) }, uMat: { value: new THREE.Vector4(o.gloss ?? 0.4, o.sss ?? 0, o.fibre ?? 4, o.variant ?? 0) } },
      vertexShader: W_VERT, fragmentShader: W_FRAG, fog: true, side: THREE.DoubleSide,
    });
    const addMesh = (geo, mat, name, cull = false) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.frustumCulled = cull; m.matrixAutoUpdate = false; scene.add(m); return m; };
    const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), S3 = new THREE.Vector3(), P3 = new THREE.Vector3(), E3 = new THREE.Euler(), tmpQ = new THREE.Quaternion();
    const UP = new THREE.Vector3(0, 1, 0);

    // ---- the canopy dome (and, below the horizon, the litter floor carried on past the edge of the floor mesh)
    for (let i = 0; i < 24; i++) rx();          // (the trunks once painted on the dome drew their places here: later draws stay as they were)
    const domeMat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...XU, uFogCol: { value: fogCol }, uCanA: { value: col(LOOK.canA) }, uCanB: { value: col(LOOK.canB) }, uCanC: { value: col(LOOK.canC) },
        uGap: { value: col(LOOK.gap, LOOK.gapI) }, uGlow: { value: U.uSunCol.value.clone().multiplyScalar(LOOK.glowI * 0.4) }, uGapK: { value: hour === 'day' ? 0.08 : 0 },
        uFloorY: { value: FLOOR }, uFogDens: { value: LOOK.dens }, uVault: { value: 0 }, uAxis: { value: new THREE.Vector4(0, -1, 0, 1) }, uHero: { value: new THREE.Vector4(0, 0.2, -1, 0) },
        uAmber: { value: col({ afternoon: '#E9A548', dawn: '#EFA98A', day: '#E3BC6E', night: '#5870C0' }[hour] || '#E9A548', 1.2) } },
      vertexShader: DOME_VERT, fragmentShader: DOME_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1500, 40, 20), domeMat);
    dome.renderOrder = -3; dome.frustumCulled = false; scene.add(dome);          // dome, then floor (-2), then leaf shade (-1), then the rest
    await ctx.yield();

    // ---- where the scripted animals are, by distance along the track (the beats are keyed to these)
    const dSnail = L * uOfZ(258);
    const dMite = 0.34 * L + 13;                     // its dome's centre: the mite itself is on the flank nearest the track
    const dAnt = 0.375 * L + 12.5;                   // the twig the ant file crosses on
    const toadD = 0.375 * L + 72;                    // rare: the toad, right of the track

    // ---- moss cushions (Leucobryum): pale domes; the snail's rise and the mite's dome are two of them
    const snailXZ = beside(dSnail, 15.5), miteXZ = beside(dMite, -10.5);
    const toadXZ = rare ? beside(toadD, 54) : null;
    cushions.push([snailXZ[0], snailXZ[1], 13, 2.3], [miteXZ[0], miteXZ[1], 7.5, 4.2]);
    for (let i = 0, tries = 0; i < 6 && tries < 200; tries++) {
      const d = rng.range(40, L * U_BANK), side = (rng.chance(0.5) ? 1 : -1) * rng.range(16, 70), R = rng.range(5, 12.5);
      const [x, z] = beside(d, side);
      if (z > AZ1 - 12 && z < AZ0 + 16 && Math.abs(x) < 26) continue;
      if (cushions.some((c) => Math.hypot(c[0] - x, c[1] - z) < c[2] + R + 4)) continue;
      if (toadXZ && (Math.hypot(x - toadXZ[0], z - toadXZ[1]) < R + 22 || (side > 0 && d > toadD - 75 && d < toadD + 15))) continue;
      cushions.push([x, z, R, R * rng.range(0.32, 0.5)]); i++;
    }
    // The floor round the log and beyond it is dressed in the fourth round, from its own stream (r4), so that nothing placed
    // before it moves: three more moss domes here, then leaves, moss in thickets, twigs and a ring of small caps further on.
    // exitXZ(al, lat): a point al metres beyond the portal along the log's axis and lat metres to its right.
    const exitXZ = (al, lat) => [exit.x + outDir.x * al - outDir.z * lat, exit.z + outDir.z * al + outDir.x * lat];
    const exitCush = [[...exitXZ(-52, -36), 8.5, 3.4], [...exitXZ(-20, 40), 10.5, 4.2], [...exitXZ(8, -34), 6.2, 2.8], [...exitXZ(46, 30), 9, 3.6]];
    const ringSite = exitCush[2];           // the small caps stand in a ring round this dome
    const exitCushAt = (x, z) => { let m = 0; for (const c of exitCush) { const q = Math.hypot(x - c[0], z - c[1]) / c[2]; if (q < 1.5) m = Math.max(m, 1 - sstep(0.7, 1.5, q)); } return m; };
    const exitCushH = (x, z) => { let h = 0; for (const c of exitCush) { const q = Math.hypot(x - c[0], z - c[1]) / c[2]; if (q < 1) h = Math.max(h, c[3] * Math.pow(1 - q * q, 0.6)); } return h; };
    const cushionAt = (x, z) => { let m = 0; for (const c of cushions) { const q = Math.hypot(x - c[0], z - c[1]) / c[2]; if (q < 1.5) m = Math.max(m, 1 - sstep(0.7, 1.5, q)); } return m; };
    const cushionH = (x, z) => { let h = 0; for (const c of cushions) { const q = Math.hypot(x - c[0], z - c[1]) / c[2]; if (q < 1) h = Math.max(h, c[3] * Math.pow(1 - q * q, 0.6)); } return h; };
    const surfAt = (x, z) => heightAt(x, z) + cushionH(x, z);
    const surfX = (x, z) => heightAt(x, z) + Math.max(cushionH(x, z), exitCushH(x, z));          // with the exit's domes too
    let floorGeo = null;

    {
      const GX0 = -230, GX1 = 270, GZ0 = -200, GZ1 = 520;
      const geo = floorGeo = await gridGeoAsync(ctx, 112, 158, false, (u, v, o) => {
        const x = mixn(GX0, GX1, u), z = mixn(GZ0, GZ1, v);
        o.p[0] = x; o.p[1] = heightAt(x, z); o.p[2] = z;
        const b = bankAt(x, z);
        const zone = sstep(AZ1, AZ1 - 12, z) * sstep(270, 292, z) * 0.45;
        o.c[0] = o.c[1] = o.c[2] = 1;
        o.a[0] = Math.min(1, 3.4 * b * (1 - b) * 0.8 + 0.5 * b + cushionAt(x, z) + exitCushAt(x, z) + zone); o.a[1] = 0;
      });
      addMesh(geo, wmat(0, 0), 'floor').renderOrder = -2;
    }
    await ctx.yield();
    // the surface of a dome as its mesh has it: a huddle of smaller hummocks with a bumpy skyline
    const cushMeshY = (c, x, z) => {
      const th = Math.atan2(z - c[1], x - c[0]), rr = Math.hypot(x - c[0], z - c[1]);
      const q = Math.min(1, rr / (c[2] * (1 + 0.07 * noise.n2(Math.cos(th) * 1.5 + c[0], Math.sin(th) * 1.5))));
      const hum = 1 - Math.abs(noise.n2(x * 0.3 + 7, z * 0.3)), lump = 0.35 * noise.n2(x * 0.5, z * 0.5) + 0.16 * noise.n2(x * 1.7, z * 1.7) + 0.3 * (hum * hum - 0.4);
      return c[4] + (c[3] + 0.4) * Math.pow(Math.max(1 - q * q, 0), 0.6) * (1 + 0.2 * lump) + lump * 0.5 * (1 - q) - 0.6 * q * q * q;
    };
    {
      // each dome is a huddle of smaller hummocks, tufted all over (FK 6)
      const parts = [], pale = col('#C4D2B8'), deep = col('#7E9A70');
      [...cushions, ...exitCush].forEach((c, ci) => {
        c[4] = heightAt(c[0], c[1]) - 0.4;
        const fineMesh = ci < 2;
        parts.push(gridGeo(fineMesh ? 52 : 28, fineMesh ? 18 : 9, true, (u, v, o) => {
          const th = u * TAU, q = Math.pow(v, 0.8), r = c[2] * q * (1 + 0.07 * noise.n2(Math.cos(th) * 1.5 + c[0], Math.sin(th) * 1.5));
          const x = c[0] + Math.cos(th) * r, z = c[1] + Math.sin(th) * r;
          const hum = 1 - Math.abs(noise.n2(x * 0.3 + 7, z * 0.3)), lump = 0.35 * noise.n2(x * 0.5, z * 0.5) + 0.16 * noise.n2(x * 1.7, z * 1.7) + 0.3 * (hum * hum - 0.4);
          o.p[0] = x; o.p[2] = z; o.p[1] = cushMeshY(c, x, z);
          const k = 0.55 + 0.45 * (1 - q) + 0.25 * lump;
          o.c[0] = mixn(deep.r, pale.r, k); o.c[1] = mixn(deep.g, pale.g, k); o.c[2] = mixn(deep.b, pale.b, k);
          o.a[0] = (0.5 + 0.5 * (1 - q * q)) * (0.8 + 0.2 * hum); o.a[1] = 0.3;
        }));
      });
      addMesh(mergeGeos(parts), wmat(6, 0, { gloss: 0.22 }), 'cushions');
    }
    await ctx.yield();

    // ---- beech leaves: the arcade leaned on its twig, and curled litter all along the track
    // x along the midrib (-0.5..0.5); cupped, the margin rolled up, arched end to end; aux = (s, q) for the leaf shader
    const leafGeo = (nu, nv, stalk = false) => {
      const g = gridGeo(nu, nv, false, (u, v, o) => {
        const s = u, tt = (v - 0.5) * 2, t = Math.sign(tt) * Math.pow(Math.abs(tt), 0.75), at = Math.abs(t);
        const wid = 0.33 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(s, 0.8)), 0), 0.75);
        const x = s - 0.5, q = t * wid, roll = sstep(0.62, 1, at);
        o.p[0] = x; o.p[2] = q * (1 - 0.14 * roll * roll);
        o.p[1] = 0.55 * q * q + 0.075 * wid * roll * roll + 0.16 * x * x - 0.02 * Math.sin(s * 9) * at + 0.012 * Math.sin(s * 15 + 1) * t + 0.01 * Math.sin(s * 28.3 + t * 2) * at
          + 0.05 * sstep(0.8, 1, s) * sstep(0.8, 1, s);                              // the tip curls up as the leaf dries
        o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = s; o.a[1] = q;
      });
      if (!stalk) return g;
      // the leaf's own stalk, a metre of dark wire kinked upward (the leaf shader knows it by aux.x < 0)
      return mergeGeos([g, gridGeo(3, 3, true, (u, v, o) => {
        const th = u * TAU, r = 0.0065 * (1 + 0.6 * v * v);
        o.p[0] = -0.5 - 0.105 * v; o.p[1] = 0.04 + 0.03 * v * v + Math.cos(th) * r; o.p[2] = Math.sin(th) * r + 0.012 * v * v;
        o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = -0.02; o.a[1] = 0;
      })]);
    };
    // the leaf's outline a metre larger, flat and just under it: aux.x = how dark
    const shadeGeo = gridGeo(8, 4, false, (u, v, o) => {
      const t = (v - 0.5) * 2, wid = 0.33 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(mixn(0.05, 0.95, u), 0.8)), 0), 0.75);
      o.p[0] = (u - 0.5) * 1.12; o.p[1] = -0.014; o.p[2] = t * (wid + 0.09);
      o.c[0] = o.c[1] = o.c[2] = 0; o.a[0] = (Math.abs(t) > 0.9 ? 0 : 1) * sstep(0, 0.2, u) * sstep(1, 0.8, u); o.a[1] = 0;
    });
    const leafSeed = rng();
    const leafTone = (out) => out.copy(rng.pick(tones)).multiplyScalar(rng.range(0.72, 1.18));
    const tc = new THREE.Color();
    {
      // 26 leaves a side in two staggered layers, feet 7.6 m out, tips on the twig; then four pairs flared open at the
      // near mouth, so that from the entry the walls fill the view and the far mouth is a keyhole on the axis
      const nA = 52, nW = 8, nR = 15, arcGeo = leafGeo(18, 8);
      {
        // a dry leaf's margin curls: the rim of each wall rolls in toward the eye (the walls show their undersides to
        // the arcade), wavering along its length
        const ps = arcGeo.attributes.position.array, ax = arcGeo.attributes.aux.array;
        for (let i = 0; i < ps.length / 3; i++) {
          const sA = ax[i * 2], qA = ax[i * 2 + 1], wid = 0.33 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(sA, 0.8)), 0), 0.75);
          const at = wid > 1e-4 ? Math.min(1, Math.abs(qA) / wid) : 0, roll = sstep(0.55, 1, at), wav = 0.6 + 0.4 * Math.sin(sA * 17 + (qA > 0 ? 0 : 2.1));
          ps[i * 3 + 1] -= 0.34 * wid * roll * roll * wav + 0.012 * Math.sin(sA * 50.3) * (1 - roll);
          ps[i * 3 + 2] *= 1 - 0.22 * roll * roll * wav;
        }
        arcGeo.computeVertexNormals();
      }
      // (its surface is the leaf shader's close-range variant, uMat.w = 1: veins in relief, holes between them, a wet sheen)
      const arcade = new THREE.InstancedMesh(arcGeo, wmat(2, 1, { gloss: 0.85, sss: late ? 1.25 : 0.85, fibre: 46, variant: 1, misc: [0.06, 0, 1, 0] }), nA + nW + nR);
      const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
      for (let i = 0; i < nA; i++) {
        const side = i % 2 ? 1 : -1, row = Math.floor(i / 2), layer = row % 2;
        const z = mixn(AZ0, AZ1, (Math.floor(row / 2) + 0.5 * layer + rng.range(-0.12, 0.12)) / 12.5);
        const foot = arcF(z) + layer * 1.3 + rng.range(-0.4, 0.6), top = arcT(z) + layer * 0.5 + rng.range(-0.2, 0.5);
        const gy = heightAt(side * foot, z) - 0.3, ty = arcH(z) + rng.range(-0.3, 0.9) + layer * 0.5;
        X.set(-side * (foot - top), ty - gy, rng.range(-1.6, 1.6));
        const len = X.length() * rng.range(1.04, 1.12); X.normalize();
        Z.set(0, 0, 1).addScaledVector(X, -X.z).normalize();
        Y.crossVectors(Z, X).normalize(); if (Y.x * side < 0) { Y.negate(); Z.negate(); }
        M4.makeBasis(X, Y, Z); M4.scale(S3.set(len, len * 0.7, len * rng.range(0.95, 1.2)));
        M4.setPosition(side * (foot + top) * 0.5, (gy + ty) * 0.5, z);
        arcade.setMatrixAt(i, M4); leafTone(tc); if (late) tc.lerp(C.copper, 0.4); arcade.setColorAt(i, tc);
      }
      for (let i = 0; i < nW; i++) {
        const side = i % 2 ? 1 : -1, w = Math.floor(i / 2);
        const fx = side * (arcF(AZ0) + 2.0 + 2.2 * w + rng.range(-0.4, 0.4)), fz = AZ0 + 1.6 + 2.1 * w + rng.range(-0.4, 0.4);
        const gy = heightAt(fx, fz) - 0.4, tx = side * (arcT(AZ0) + 0.7 + 1.3 * w), ty = arcH(AZ0) - 0.4 + 0.7 * w + rng.range(-0.3, 0.5), tz = AZ0 - 1 + 0.9 * w;
        X.set(tx - fx, ty - gy, tz - fz);
        const len = X.length() * rng.range(1.05, 1.12); X.normalize();
        Y.set(-side * 0.55, 0.25, 0.8); Y.addScaledVector(X, -Y.dot(X)).normalize();
        Z.crossVectors(X, Y).normalize();
        M4.makeBasis(X, Y, Z); M4.scale(S3.set(len, len * 0.75, len * rng.range(1.0, 1.2)));
        M4.setPosition((fx + tx) * 0.5, (gy + ty) * 0.5, (fz + tz) * 0.5);
        arcade.setMatrixAt(nA + i, M4); leafTone(tc); if (late) tc.lerp(C.copper, 0.4); arcade.setColorAt(nA + i, tc);
      }
      // the roof: leaves fallen across the two wall tops, lapped like slates, each at its own tilt
      for (let i = 0; i < nR; i++) {
        const z = mixn(AZ0 + 0.5, AZ1 - 0.5, (i + 0.5 + rng.range(-0.2, 0.2)) / nR), dirn = i % 2 ? 1 : -1;
        X.set(dirn * (2 * arcT(z) + 4.2), rng.range(-1.3, 1.3), rng.range(-3, 3));
        const len = X.length(); X.normalize();
        Y.set(0, 1, 0).addScaledVector(X, -X.y).normalize(); Z.crossVectors(X, Y).normalize();
        M4.makeBasis(X, Y, Z); M4.scale(S3.set(len, len * 0.45, len * rng.range(0.95, 1.2)));
        M4.setPosition(rng.range(-0.7, 0.7), arcH(z) + 1.0 + rng.range(0, 0.6) + (i % 3) * 0.25, z);
        arcade.setMatrixAt(nA + nW + i, M4); leafTone(tc); if (late) tc.lerp(C.copper, 0.4); arcade.setColorAt(nA + nW + i, tc);
      }
      arcade.name = 'arcade'; arcade.computeBoundingSphere(); scene.add(arcade);
    }
    await ctx.yield();
    // instances are kept in chunks along the route: culled by the frustum, hidden once the fog has taken them, and
    // drawn with their detailed mesh only while the eye is within `sw` metres of the chunk
    const lodChunks = [];
    const instMesh = (geo, mat, list, name, colours = true) => {
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((e, i) => { mesh.setMatrixAt(i, e.m); if (colours) mesh.setColorAt(i, e.c); });
      mesh.name = name; mesh.computeBoundingSphere(); scene.add(mesh); return mesh;
    };
    const flushLod = (buckets, name, range, sw, geoHi, matHi, geoLo, matLo, geoX = null, matX = null) => {
      for (const b of buckets) {
        if (!b.length) continue;
        const lo = instMesh(geoLo, matLo, b, name + '-lo'), hi = geoHi ? instMesh(geoHi, matHi, b, name) : null;
        const extra = hi && geoX ? instMesh(geoX, matX, b, name + '-shade', false) : null;
        if (extra) extra.renderOrder = -1;          // after the floor, before every leaf: it shades the floor and can never fight a leaf for depth
        lodChunks.push({ lo, hi, extra, c: lo.boundingSphere.center.clone(), r: lo.boundingSphere.radius, range, sw });
      }
    };
    // an instanced mesh already filled is cut into pieces along the track, so that what is behind the eye or lost in the
    // fog is not drawn (iB: its per-instance attribute, four floats each, if it has one)
    const splitAlong = (mesh, nb, range, iB = null, pad = 0) => {
      const groups = []; for (let i = 0; i < nb; i++) groups.push([]);
      for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, M4); groups[Math.min(nb - 1, Math.floor(path.nearestXZ(M4.elements[12], M4.elements[14]).u * nb))].push(i); }
      for (const g of groups) {
        if (!g.length) continue;
        const geo = iB ? mesh.geometry.clone() : mesh.geometry, part = new THREE.InstancedMesh(geo, mesh.material, g.length);
        g.forEach((src, j) => { mesh.getMatrixAt(src, M4); part.setMatrixAt(j, M4); if (mesh.instanceColor) { mesh.getColorAt(src, tc); part.setColorAt(j, tc); } });
        if (iB) { const a = new Float32Array(g.length * 4); g.forEach((src, j) => { for (let c = 0; c < 4; c++) a[j * 4 + c] = iB[src * 4 + c]; }); geo.setAttribute('iB', new THREE.InstancedBufferAttribute(a, 4)); }
        part.name = mesh.name; part.computeBoundingSphere(); part.boundingSphere.radius += pad; scene.add(part);
        lodChunks.push({ lo: part, hi: null, extra: null, c: part.boundingSphere.center.clone(), r: part.boundingSphere.radius, range, sw: 0 });
      }
      if (iB) mesh.geometry.dispose();
      mesh.dispose();
    };
    const dBRv = L * U_BR;
    const inLog = (x, z, pad) => { const rx = x - exit.x, rz = z - exit.z, al = rx * outDir.x + rz * outDir.z, lt = Math.abs(-rx * outDir.z + rz * outDir.x); return al > -10 - pad && lt < 11 + pad; };
    // true when a leaf with this matrix would put a raised part into the corridor the eye flies through. Samples are the
    // leaf's ends, margins and midrib with the most height its mesh and its own twist can give them.
    const LEAF_SAMPLES = [[-0.5, 0.35, 0], [0.5, 0.35, 0], [-0.25, 0.1, 0], [0.25, 0.1, 0], [0, 0, 0], [0, 1, 0.3], [0, 1, -0.3], [-0.25, 1, 0.27], [0.25, 1, 0.3], [-0.25, 1, -0.27], [0.25, 1, -0.3]];
    const leafBlocks = (m, yk, clear = 6) => {
      for (const sp of LEAF_SAMPLES) {
        tmpV.set(sp[0], sp[1] * yk, sp[2]).applyMatrix4(m);
        const n = path.nearestXZ(tmpV.x, tmpV.z);
        if (n.dist < clear && tmpV.y > n.y - EYE + 0.95 && path.distanceTo(tmpV.x, tmpV.y, tmpV.z) < clear) return true;
      }
      return false;
    };
    let leafSkips = 0;
    const snailXZ0 = beside(dSnail, 12.5), mitePt = beside(dMite - 3.5, -5.0);
    // where a named animal must stay in sight, stated once: the arcade and its mouth, the snail's rise, the mite's dome,
    // the ants' twig, the toad's flank on rare visits, the foot of the bank where the train runs. Whatever is head-high
    // asks here (the tall things through tallOK, the bonnets' bells through bellOK)
    const namedOK = (x, z, d, lat) => {
      const sgn = lat < 0 ? -1 : 1, al = Math.abs(lat);
      if (z < AZ0 + 14 && z > AZ1 - 8 && Math.abs(x) < 22) return false;
      if (z > AZ0 && Math.abs(x) < 10 + (z - AZ0) * 0.2) return false;
      if (Math.hypot(x - snailXZ0[0], z - snailXZ0[1]) < 17 || (sgn > 0 && Math.abs(d - dSnail) < 30 && al < 34)) return false;
      if (Math.hypot(x - mitePt[0], z - mitePt[1]) < 15 || (sgn < 0 && d > dMite - 30 && d < dMite + 4 && al < 16)) return false;
      if (Math.abs(d - dAnt) < 9 && al < 30) return false;
      if (toadXZ && (Math.hypot(x - toadXZ[0], z - toadXZ[1]) < 21 || (sgn > 0 && d > toadD - 85 && d < toadD + 30 && al < 70))) return false;
      if (z > 36 && z < 112 && al < 17) return false;
      return true;
    };
    // true where something tall may stand without hiding a named animal, the hero or the way in (d along the track,
    // lat metres to the right of it)
    const tallOK = (x, z, d, lat) => {
      if (!namedOK(x, z, d, lat)) return false;
      if (z < AZ1 && z > 60 && Math.abs(x) < 3 + (460 - z) * 0.047) return false;
      return true;
    };
    {
      const NB = 10, n = Math.round(640 * mixn(0.75, 1, detail)), near = [], far = [], small = [], qSlope = new THREE.Quaternion();
      for (let i = 0; i < NB; i++) { near.push([]); far.push([]); }
      for (let k = 0, tries = 0; k < n && tries < n * 8; tries++) {
        if ((tries & 15) === 0) await ctx.yield();          // each leaf is tried against the track many times over
        const d = rng.range(-5, L - 4), onBr = d > dBRv + 6, q = rng(), side = (rng.chance(0.5) ? 1 : -1) * ((onBr ? 6.5 : 1.5) + 60 * Math.pow(q, 1.9));
        const [x, z] = beside(d, side);
        if (Math.hypot(x, z) < 19 || cushionAt(x, z) > 0.4 || inLog(x, z, 1)) continue;
        const nd = path.nearestXZ(x, z).dist, len = rng.range(8.5, 13);
        if (onBr && nd < 6) continue;
        if (Math.abs(d - dBRv) < 14 && nd < 8) continue;               // the step from the bank onto the branch stays clear
        const nearEntry = Math.hypot(x - path.start.x, z - path.start.z) < 17, inArc = z < AZ0 + 9 && z > AZ1 - 6 && Math.abs(x) < 7.5;
        const propped = nd > 15 && !nearEntry && rng.chance(0.1);
        const y = surfAt(x, z);
        const sx = Math.max(-0.25, Math.min(0.25, (surfAt(x + 2, z) - surfAt(x - 2, z)) / 4)), sz = Math.max(-0.25, Math.min(0.25, (surfAt(x, z + 2) - surfAt(x, z - 2)) / 4));
        E3.set(rng.range(-0.08, 0.08), rng.range(0, TAU), propped ? rng.range(0.45, 1.0) : rng.range(-0.07, 0.07), 'YXZ');
        Q4.setFromEuler(E3);
        Q4.premultiply(qSlope.setFromUnitVectors(UP, P3.set(-sx, 1, -sz).normalize()));
        const flat = nd < 4.5 || nearEntry || inArc ? 0.35 : nd < 9 ? 0.7 : 1;
        M4.compose(P3.set(x, y + (propped ? len * 0.22 : 0.16 + 0.22 * flat), z), Q4, S3.set(len, len * flat * rng.range(0.6, 1.3), len));
        if (leafBlocks(M4, flat < 0.5 ? 0.1 : 0.2)) { leafSkips++; continue; }
        const bi = Math.min(NB - 1, Math.max(0, Math.floor((d + 5) / (L + 1) * NB)));
        (nd < 22 ? near : far)[bi].push({ m: M4.clone(), c: leafTone(tc).clone() }); k++;
      }
      // The litter is a tumble, not a floor. Leaves propped on one another stand beside the track with their veined
      // faces to the eye, and smaller, curlier leaves lie over the big plates, some of them underside up. (These draw
      // from their own stream, so the plates above lie where they always did.)
      {
        const lemon = col('#D2A63E'), X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
        const tone2 = () => {
          tc.copy(tones[Math.floor(rx() * tones.length) % tones.length]).multiplyScalar(rx.range(0.7, 1.22));
          const r = rx(); if (r < 0.15 && !late && !night) tc.lerp(lemon, 0.75); else if (r > 0.87) tc.multiplyScalar(0.5);
          return tc;
        };
        const nProp = Math.round(150 * mixn(0.7, 1, detail)), arcA = Math.max(L * uOfZ(206), dAnt + 14) - 6, arcB = L * uOfZ(104) + 8;
        for (let k = 0, tries = 0; k < nProp && tries < nProp * 14; tries++) {
          if ((tries & 15) === 0) await ctx.yield();
          const d = rx.range(14, L - 34), onBr = d > dBRv - 6, lat = (rx.chance(0.5) ? 1 : -1) * rx.range(onBr ? 9.5 : 7.4, onBr ? 26 : 23);
          const len = rx.range(6.5, 10.5), lean = rx.range(0.5, 1.12), yaw = rx.range(-1.0, 1.0), wide = rx.range(0.75, 1.2), up = rx.chance(0.7);
          tone2();
          const [x, z] = beside(d, lat);
          if (Math.hypot(x, z) < 24 || cushionAt(x, z) > 0.2 || inLog(x, z, 3) || !tallOK(x, z, d, lat)) continue;
          if (d > arcA && d < arcB && Math.abs(lat) < 14.5) continue;                     // the agarics' stalks are seen to their feet
          // it leans away from the track (or, one in three, toward it, showing its pale underside against the light)
          path.tangentAtDist(d, tmpT); const tl = Math.hypot(tmpT.x, tmpT.z) || 1, sg = lat < 0 ? -1 : 1;
          const ox = -tmpT.z / tl * sg, oz = tmpT.x / tl * sg, cy = Math.cos(yaw), sy = Math.sin(yaw), dir = up ? 1 : -1;
          X.set((ox * cy - oz * sy) * dir, 0, (oz * cy + ox * sy) * dir).multiplyScalar(Math.cos(lean)).setY(Math.sin(lean)).normalize();
          Z.crossVectors(X, UP).normalize(); Y.crossVectors(Z, X).normalize();
          M4.makeBasis(X, Y, Z).scale(S3.set(len, len * wide, len));
          P3.set(x, surfAt(x, z) - 0.25, z).addScaledVector(X, len * 0.5); M4.setPosition(P3);
          if (leafBlocks(M4, 0.25, 6.4)) { leafSkips++; continue; }
          const bi = Math.min(NB - 1, Math.max(0, Math.floor((d + 5) / (L + 1) * NB)));
          near[bi].push({ m: M4.clone(), c: tc.clone() }); k++;
        }
        const nSmall = Math.round(300 * mixn(0.6, 1, detail));
        for (let i = 0; i < NB; i++) small.push([]);
        for (let k = 0, tries = 0; k < nSmall && tries < nSmall * 8; tries++) {
          if ((tries & 15) === 0) await ctx.yield();
          const d = rx.range(-4, L * U_BR - 8), lat = (rx.chance(0.5) ? 1 : -1) * (0.4 + 15 * Math.pow(rx(), 1.5));
          const len = rx.range(4.2, 7.4), curl = rx.range(0.9, 1.7), flip = rx.chance(0.3);
          E3.set(rx.range(-0.22, 0.22) + (flip ? Math.PI : 0), rx.range(0, TAU), rx.range(-0.22, 0.22), 'YXZ');
          tone2();
          const [x, z] = beside(d, lat);
          if (Math.abs(lat) < 2.4 || Math.hypot(x, z) < 19 || cushionAt(x, z) > 0.5 || inLog(x, z, 1)) continue;      // the beetle's own width stays clear
          M4.compose(P3.set(x, surfAt(x, z) + (flip ? 0.55 : 0.4) + 0.05 * len * (curl - 0.9), z), Q4.setFromEuler(E3), S3.set(len, len * curl, len));
          if (leafBlocks(M4, 0.3)) { leafSkips++; continue; }
          const bi = Math.min(NB - 1, Math.max(0, Math.floor((d + 5) / (L + 1) * NB)));
          small[bi].push({ m: M4.clone(), c: tc.clone() }); k++;
        }
      }
      // round the log and beyond the portal the floor is the same tumble of leaves (fourth round, its own stream): flat
      // plates, and one in five propped on another with its veined face to the track
      {
        const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), nX = Math.round(96 * mixn(0.7, 1, detail));
        for (let k = 0, tries = 0; k < nX && tries < nX * 6; tries++) {
          if ((tries & 15) === 0) await ctx.yield();
          const al = r4.range(-78, 88), lat = (r4.chance(0.5) ? 1 : -1) * (13 + 62 * Math.pow(r4(), 1.4)), len = r4.range(8, 12.5), yaw = r4.range(0, TAU), prop = r4() < 0.2, lean = r4.range(0.45, 1.0), wide = r4.range(0.7, 1.25), kc = r4.range(0.72, 1.18), ti = Math.floor(r4() * tones.length) % tones.length, tA = r4.range(-0.08, 0.08), tB = r4.range(-0.07, 0.07);
          const [x, z] = exitXZ(al, lat);
          if (inLog(x, z, 2.5) || exitCushAt(x, z) > 0.3 || x < -225 || x > 265 || z < -195) continue;
          if (path.nearestXZ(x, z).dist < 9) continue;
          tc.copy(tones[ti]).multiplyScalar(kc);
          const y = surfX(x, z);
          if (prop) {
            X.set(Math.cos(yaw) * Math.cos(lean), Math.sin(lean), Math.sin(yaw) * Math.cos(lean)).normalize(); Z.crossVectors(X, UP).normalize(); Y.crossVectors(Z, X).normalize();
            M4.makeBasis(X, Y, Z).scale(S3.set(len * 0.8, len * 0.8 * wide, len * 0.8)); P3.set(x, y - 0.25, z).addScaledVector(X, len * 0.4); M4.setPosition(P3);
          } else {
            E3.set(tA, yaw, tB, 'YXZ');
            M4.compose(P3.set(x, y + 0.38, z), Q4.setFromEuler(E3), S3.set(len, len * wide, len));
          }
          (path.nearestXZ(x, z).dist < 30 ? near : far)[NB - 1].push({ m: M4.clone(), c: tc.clone() }); k++;
        }
      }
      // (a leaf that lies where one of the exit's moss domes now stands is taken out)
      for (const set of [near, far, small]) for (let b = 0; b < set.length; b++) set[b] = set[b].filter((e) => exitCushAt(e.m.elements[12], e.m.elements[14]) < 0.35);
      const leafMat = wmat(2, 5, { gloss: 0.62, sss: 0.5, fibre: 11, misc: [0, 0, leafSeed, 0] });
      const shadeMat = new THREE.ShaderMaterial({
        uniforms: { ...fogU(), uMisc: { value: new THREE.Vector4(0.3, 0, leafSeed, 0) } }, vertexShader: SHADE_VERT, fragmentShader: SHADE_FRAG, fog: true,
        transparent: false, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, side: THREE.DoubleSide,
      });
      await ctx.yield();
      const lo = leafGeo(7, 3);
      flushLod(near, 'litter', 330, 55, leafGeo(14, 6, true), leafMat, lo, leafMat, shadeGeo, shadeMat);
      await ctx.yield();
      flushLod(small, 'litter-small', 200, 40, leafGeo(10, 6, true), leafMat, leafGeo(6, 2), leafMat, shadeGeo, shadeMat);
      await ctx.yield();
      flushLod(far, 'litter-far', 330, 0, null, null, lo, leafMat);
    }
    await ctx.yield();

    let starGeo = null, starMat = null;
    // ---- the two domes the snail and the mite walk on are cushion moss seen close: a thousand and more pale rosettes
    // stand out of the textured surface, thickest on the side the track passes and along the skyline
    {
      const pale = col('#DCE6CE'), midc = col('#A6BE96'), deep = col('#4E6A48'), V = [], NV = [];
      for (let l = 0; l < 7; l++) {
        const inner = l % 3 === 0, th = l / 7 * TAU + (inner ? 0.2 : 0), el = inner ? 1.15 : 0.5 + 0.12 * (l % 2), len = inner ? 0.7 : 1, cs = Math.cos(th), sn = Math.sin(th), w = 0.1;
        const mx = cs * Math.cos(el) * len * 0.5, my = Math.sin(el) * len * 0.5, mz = sn * Math.cos(el) * len * 0.5, e2 = el + 0.4;
        const tx = mx + cs * Math.cos(e2) * len * 0.5, ty = my + Math.sin(e2) * len * 0.5, tz = mz + sn * Math.cos(e2) * len * 0.5, px = -sn * w, pz = cs * w;
        const vtx = (x, y, z, c, a, g) => { V.push(x, y, z, c.r, c.g, c.b, a, g); NV.push(cs * 0.5, 0.86, sn * 0.5); };
        vtx(0, -0.1, 0, deep, 0.3, 0.2); vtx(mx + px, my, mz + pz, midc, 0.75, 0.4); vtx(mx - px, my, mz - pz, midc, 0.75, 0.4);
        vtx(mx + px, my, mz + pz, midc, 0.75, 0.4); vtx(tx, ty, tz, pale, 1.0, 0.5); vtx(mx - px, my, mz - pz, midc, 0.75, 0.4);
      }
      const tuftGeo = starGeo = triGeo(V); tuftGeo.attributes.normal.array.set(NV);
      const tuftMat = starMat = wmat(1, 1, { gloss: 0.3, sss: 0.5, fibre: 14, variant: 2, misc: [0.035, 0, 1, 112] });
      for (let ci = 0; ci < 2; ci++) {
        const c = cushions[ci], n = Math.round((ci === 0 ? 980 : 560) * mixn(0.5, 1, detail)), list = [];
        const np = path.nearestXZ(c[0], c[1]); path.pointAt(np.u, tmpV);
        const fl = Math.hypot(tmpV.x - c[0], tmpV.z - c[1]) || 1, fx = (tmpV.x - c[0]) / fl, fz = (tmpV.z - c[1]) / fl;
        for (let i = 0, tries = 0; i < n && tries < n * 4; tries++) {
          if ((tries & 127) === 0) await ctx.yield();
          const th = rx.range(0, TAU), q = Math.sqrt(rx()) * 0.97, r = c[2] * q, x = c[0] + Math.cos(th) * r, z = c[1] + Math.sin(th) * r;
          const facing = Math.cos(th) * fx + Math.sin(th) * fz, sc = rx.range(0.42, 0.82) * (ci === 0 ? 1 : 0.85), tilt = rx.range(0, TAU), yawR = rx.range(0, TAU), kc = rx.range(0.82, 1.14), warm = rx();
          if (rx() > 0.3 + 0.7 * sstep(-0.5, 0.4, facing)) continue;
          const y = cushMeshY(c, x, z), gx = (cushMeshY(c, x + 0.4, z) - cushMeshY(c, x - 0.4, z)) / 0.8, gz = (cushMeshY(c, x, z + 0.4) - cushMeshY(c, x, z - 0.4)) / 0.8;
          P3.set(-gx, 1, -gz).normalize().lerp(UP, 0.35).add(S3.set(Math.cos(tilt) * 0.22, 0, Math.sin(tilt) * 0.22)).normalize();
          Q4.setFromUnitVectors(UP, P3).multiply(tmpQ.setFromAxisAngle(UP, yawR));
          M4.compose(P3.set(x, y - 0.06, z), Q4, S3.set(sc, sc * 0.9, sc));
          if (warm > 0.9) tc.setRGB(kc * 1.05, kc * 1.0, kc * 0.7); else tc.setRGB(kc, kc * 1.02, kc * 0.96);
          list.push({ m: M4.clone(), c: tc.clone() }); i++;
        }
        const mesh = instMesh(tuftGeo, tuftMat, list, 'cushion-tufts');
        lodChunks.push({ lo: mesh, hi: null, extra: null, c: mesh.boundingSphere.center.clone(), r: mesh.boundingSphere.radius, range: 100, sw: 0 });
      }
    }
    await ctx.yield();

    // ---- more of the big fungi, met closer: buttercaps flanking the moss beyond the arcade and standing opposite the
    // snail, and tall parasols far off in the fog (their places are chosen here so the moss can leave them room)
    const troop = [], troopMeshes = [], troopShared = {};
    // one beech stands near enough to be a tree and not a shape, left of the agaric arc [x, z, radius]; the rest of the
    // wall of trunks is built further on (the great trunks) and, furthest off, painted on the dome
    const beeches = [[-126, 46, 32]];
    {
      const add = (d, lat, H, R) => { const [x, z] = beside(d, lat); troop.push({ x, z, y: surfAt(x, z) - 0.5, H, R, kind: 0 }); };
      const zA = [315, 301, 288, 278], latA = [-14.6, 14.8, -15.2, 16];
      for (let i = 0; i < 4; i++) add(L * uOfZ(zA[i]) + rx.range(-2, 2), latA[i] + rx.range(-0.6, 0.6), rx.range(11.5, 16.5), rx.range(4.4, 5.6));
      const dS = [dSnail - 15, dSnail + 1, dSnail + 15, dSnail + 27], latS = [-11.2, -13.4, -10.8, -14.2];
      for (let i = 0; i < 4; i++) add(dS[i] + rx.range(-2, 2), latS[i] + rx.range(-0.6, 0.6), rx.range(9.5, 15), rx.range(4.2, 6.2));
      for (let k = 0, tries = 0; k < 7 && tries < 300; tries++) {
        const d = rx.range(40, L * 0.8), lat = (rx.chance(0.5) ? 1 : -1) * rx.range(62, 150), H = rx.range(19, 29), R = rx.range(8.5, 12.5);
        const [x, z] = beside(d, lat);
        if (Math.hypot(x, z) < 70 || path.nearestXZ(x, z).dist < 58 || cushionAt(x, z) > 0) continue;
        if (z > 60 && Math.abs(x) < 16 + (430 - z) * 0.27) continue;               // not in the keyhole: there the parasol stands alone
        if (lat > 0 && d > dSnail - 70 && d < dSnail + 60) continue;               // the snail's shell stays against plain fog
        if (toadXZ && Math.hypot(x - toadXZ[0], z - toadXZ[1]) < 40) continue;
        if (troop.some((t) => Math.hypot(t.x - x, t.z - z) < 45) || beeches.some((t) => Math.hypot(t[0] - x, t[1] - z) < t[2] * 1.6 + 22)) continue;
        troop.push({ x, z, y: heightAt(x, z) - 0.6, H, R, kind: 1 }); k++;
      }
    }

    await ctx.yield();
    // ---- haircap moss (Polytrichum): wiry stems clothed in narrow leaves that spiral up to a star-shaped top; old
    // leaves droop, young ones rise and the bud stands. In thickets, nodding in gusts. Detailed shoots near the eye,
    // a 28-triangle shoot beyond.
    {
      const dark = col('#3E5420'), mid = col('#6E8A30'), tip = col('#9CAA46'), young = col('#CBD074'), stemC = col('#6E5A30');
      const shootGeo = (hi, capsule, nLeafSet = 0) => {
        const parts = [];
        parts.push(gridGeo(hi && !nLeafSet ? 5 : 3, hi && !nLeafSet ? 3 : 1, true, (u, v, o) => {
          const th = u * TAU, r = 0.015 * (1 - 0.45 * v);
          o.p[0] = Math.cos(th) * r + 0.03 * v * v; o.p[1] = v; o.p[2] = Math.sin(th) * r;
          o.c[0] = mixn(stemC.r, mid.r, v); o.c[1] = mixn(stemC.g, mid.g, v); o.c[2] = mixn(stemC.b, mid.b, v); o.a[0] = 0.3 + v * 0.6; o.a[1] = 0.4;
        }));
        const V = [], NV = [], nLeaf = nLeafSet || (hi ? 50 : 15);
        for (let l = 0; l < nLeaf; l++) {
          const t = l / (nLeaf - 1), hv = mixn(0.07, 1.0, Math.pow(t, 0.8)), th = l * 2.39996 + (hi ? 0 : 0.4), cs = Math.cos(th), sn = Math.sin(th);
          const top = sstep(0.8, 1, t), bud = sstep(0.94, 1, t);
          const len = (0.1 + 0.075 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1))) * (1 + 0.3 * top) * (1 - 0.45 * bud) * (hi ? 1.12 : 1.1);
          const el = mixn(-0.2, 0.55, t * t) + 0.8 * bud;
          // narrow, each curving up toward its tip: a bottle brush, not a pile of kites
          const w = (hi ? (nLeafSet ? 0.016 : 0.0118) : 0.042) * (1 - 0.3 * bud), bx = 0.03 * hv * hv;
          const ce = Math.cos(el), se = Math.sin(el), cu = Math.cos(el + 0.8), su = Math.sin(el + 0.8);
          const k0 = 0.05 + 0.4 * t, k1 = 0.45 + 0.55 * t;
          const c0 = [mixn(dark.r, mid.r, k0) * 0.8, mixn(dark.g, mid.g, k0) * 0.8, mixn(dark.b, mid.b, k0) * 0.8];
          const c1 = [mixn(mid.r, tip.r, k1), mixn(mid.g, tip.g, k1), mixn(mid.b, tip.b, k1)];
          const c2 = [mixn(c1[0], young.r, top), mixn(c1[1], young.g, top), mixn(c1[2], young.b, top)];
          const mx = cs * len * 0.45 * ce, my = hv + len * 0.45 * se, mz = sn * len * 0.45 * ce;
          const tx = mx + cs * len * 0.55 * cu, ty = my + len * 0.55 * su, tz = mz + sn * len * 0.55 * cu;
          const px = -sn * w, pz = cs * w, ao0 = hv * 0.7, ao1 = Math.min(1.1, hv + 0.08);
          // one soft normal per leaf (outward and up): the shoot shades as a whole, not as a pile of facets
          const vtx = (x, y, z, c, a, g) => { V.push(x + bx, y, z, c[0], c[1], c[2], a, g); NV.push(cs * 0.55, 0.82, sn * 0.55); };
          if (hi) {
            vtx(0, hv, 0, c0, ao0, 0.5); vtx(mx + px, my, mz + pz, c1, ao1, 0.7); vtx(mx - px, my, mz - pz, c1, ao1, 0.7);
            vtx(mx + px, my, mz + pz, c1, ao1, 0.7); vtx(tx, ty, tz, c2, ao1, 0.8); vtx(mx - px, my, mz - pz, c1, ao1, 0.7);
          } else {
            vtx(px, hv - 0.012, pz, c0, ao0, 0.5); vtx(-px, hv + 0.012, -pz, c0, ao0, 0.5); vtx(tx, ty, tz, c2, ao1, 0.75);
          }
        }
        const lg = triGeo(V); lg.attributes.normal.array.set(NV);
        parts.push(lg);
        if (capsule) {
          // the spore capsule nodding on its wire stalk
          const amber = col('#B8742C');
          parts.push(limb([[0.03, 1, 0], [0.05, 1.25, 0.01], [0.08, 1.5, 0.02], [0.12, 1.62, 0.03]], 0.012, amber, 0, false));
          parts.push(blob([0.14, 1.62, 0.035], [0.035, 0.07, 0.035], amber, hi ? 6 : 4, hi ? 3 : 2, 1, 1));
          const g = mergeGeos(parts); const ax = g.attributes.aux.array, ps = g.attributes.position.array;
          for (let i = 0; i < ax.length / 2; i++) if (ps[i * 3 + 1] > 1.001) ax[i * 2] = Math.min(1.6, ps[i * 3 + 1]);
          return g;
        }
        return mergeGeos(parts);
      };
      const mossMat = wmat(1, 1, { gloss: 0.5, sss: 0.4, fibre: 9, variant: 2, misc: [0.55, 0, 1, 285] });
      const nA = Math.round(1500 * detail * mixn(0.85, 1.1, (dens - 0.7) / 0.6)), nB = Math.round(nA * 0.08);
      await ctx.yield();
      const NB = 10, NF = 5, mk = (n) => { const a = []; for (let i = 0; i < n; i++) a.push([]); return a; };
      const nearA = mk(NB), farA = mk(NF), capB = mk(NF);
      let ka = 0, kb = 0;
      for (let tries = 0; (ka < nA || kb < nB) && tries < nA * 9; tries++) {
        if ((tries & 63) === 0) await ctx.yield();
        const d = rng.range(0, L + 30), onBr = d > dBRv - 4, q = rng(), sgn = rng.chance(0.5) ? 1 : -1, side = sgn * ((onBr ? (d > L - 75 ? 19 : 13) : 6.2) + 85 * Math.pow(q, 1.6));
        if (d > L * U_CREST + 6 && !onBr) continue;
        const [x, z] = beside(d, side);
        if (Math.hypot(x, z) < 20 || inLog(x, z, 3)) continue;
        if (z < AZ0 + 14 && z > AZ1 - 8 && Math.abs(x) < 22) continue;                 // the arcade and its flared mouth stay open
        if (z > AZ0 && Math.abs(x) < 10 + (z - AZ0) * 0.2) continue;                   // nothing tall in the view from the entry
        if (Math.hypot(x - snailXZ0[0], z - snailXZ0[1]) < 17 || (sgn > 0 && Math.abs(d - dSnail) < 30 && Math.abs(side) < 34)) continue;
        if (Math.hypot(x - mitePt[0], z - mitePt[1]) < 15 || (sgn < 0 && d > dMite - 30 && d < dMite + 4 && Math.abs(side) < 16)) continue;
        if (Math.abs(d - dAnt) < 9 && Math.abs(side) < 30) continue;                   // the ants' twig is seen against the canopy
        if (toadXZ && (Math.hypot(x - toadXZ[0], z - toadXZ[1]) < 21 || (sgn > 0 && d > toadD - 85 && d < toadD + 30 && Math.abs(side) < 70))) continue;
        const b = bankAt(x, z), zone = sstep(AZ1 - 2, AZ1 - 14, z) * sstep(268, 290, z);
        const ramp = z > 36 && z < 112 && Math.abs(side) < 17;            // keep the view up the bank to the parasol open
        let want = Math.max(zone, 3.2 * b * (1 - b), 0.9 * sstep(0.2, 0.9, cushionAt(x, z)) * (cushionH(x, z) < 0.6 ? 1 : 0), sstep(0.15, 0.5, noise.fbm2(x * 0.021 + 40, z * 0.021, 2)) * 0.8);
        if (onBr) want = Math.max(want, 0.32);
        if (rng() > want * (ramp ? 0.55 : 1)) continue;
        const sight = z < AZ1 && z > 60 && Math.abs(x) < 3 + (460 - z) * 0.047;      // the line of sight from the entry to the parasol
        const hgt = rng.range(7, 14) * (0.75 + 0.25 * Math.min(1, Math.abs(side) / 14)) * (ramp || sight ? 0.4 : 1);
        if (path.nearestXZ(x, z).dist < 6.2 + hgt * 0.26) continue;          // its longest leaves stay 6 m from the eye
        E3.set(rng.range(-0.09, 0.09), rng.range(0, TAU), rng.range(-0.09, 0.09));
        M4.compose(P3.set(x, surfAt(x, z) - 0.3, z), Q4.setFromEuler(E3), S3.set(hgt * 1.3, hgt, hgt * 1.3));
        const cv = rng.range(0.8, 1.2);
        if (rng.chance(0.1)) tc.setRGB(cv * 1.3, cv * 0.95, cv * 0.55); else tc.setRGB(cv, cv * rng.range(0.95, 1.08), cv * rng.range(0.8, 1));
        const e = { m: M4.clone(), c: tc.clone() }, f = Math.min(0.999, d / (L + 31));
        if (kb < nB && rng.chance(0.14)) { capB[Math.floor(f * NF)].push(e); kb++; }
        else if (ka < nA) { (path.nearestXZ(x, z).dist < 27 ? nearA[Math.floor(f * NB)] : farA[Math.floor(f * NF)]).push(e); ka++; }
      }
      await ctx.yield();
      for (const set of [nearA, farA, capB]) for (let b = 0; b < set.length; b++) {
        set[b] = set[b].filter((e) => { const ex = e.m.elements[12], ez = e.m.elements[14]; return !troop.some((t) => Math.hypot(t.x - ex, t.z - ez) < (t.kind ? 5 : t.R * 0.6 + 2)); });
      }
      // Round the log the haircap stands in thickets, tallest at the heart of each and falling away to its edge, with
      // open litter, moss domes and twigs between: no even scatter of single stems. (Fourth round, its own stream; the
      // stems that stood there before are taken out.)
      {
        const zoneU = (L - 104) / L;
        const inZone = (ex, ez) => { const n = path.nearestXZ(ex, ez); return n.u > zoneU && n.dist > 15; };
        for (const set of [nearA, farA, capB]) for (let b = 0; b < set.length; b++) set[b] = set[b].filter((e) => !inZone(e.m.elements[12], e.m.elements[14]));
        const nCl = 22; nearA.push([]);                  // the thickets within 46 m of the track are their own chunk, drawn in detail from the branch
        for (let c = 0, tries = 0; c < nCl && tries < 200; tries++) {
          await ctx.yield();
          const al = r4.range(-100, 84), lat = (r4.chance(0.5) ? 1 : -1) * (21 + 58 * Math.pow(r4(), 1.25)), hc = r4.range(5.5, 13.5), sg = r4.range(3.6, 7.5), n = Math.round(r4.range(16, 34) * mixn(0.6, 1, detail) * (hc > 9 ? 1.2 : 1)), warm = r4() < 0.2;
          const [cx, cz] = exitXZ(al, lat);
          if (inLog(cx, cz, 9) || exitCushAt(cx, cz) > 0 || Math.hypot(cx - ringSite[0], cz - ringSite[1]) < 16 || cx < -215 || cx > 255 || cz < -188) continue;
          if (path.nearestXZ(cx, cz).dist < 17 + sg) continue;
          for (let i = 0; i < n; i++) {
            const g1 = r4.gauss(), g2 = r4.gauss(), hv = r4.range(0.62, 1.12), yaw = r4.range(0, TAU), tA = r4.range(-0.1, 0.1), tB = r4.range(-0.1, 0.1), cv = r4.range(0.8, 1.2), capsule = r4() < 0.1;
            const x = cx + g1 * sg, z = cz + g2 * sg, q = Math.min(1, Math.hypot(g1, g2) / 2.4);
            if (inLog(x, z, 4) || exitCushAt(x, z) > 0.2 || path.nearestXZ(x, z).dist < 15.5) continue;
            const hgt = Math.max(2.2, hc * (1 - 0.72 * q * q) * hv);
            E3.set(tA, yaw, tB);
            M4.compose(P3.set(x, surfX(x, z) - 0.3, z), Q4.setFromEuler(E3), S3.set(hgt * 1.3, hgt, hgt * 1.3));
            if (warm && i % 3 === 0) tc.setRGB(cv * 1.3, cv * 0.95, cv * 0.55); else tc.setRGB(cv, cv * 1.03, cv * 0.9);
            const e = { m: M4.clone(), c: tc.clone() };
            if (capsule) capB[NF - 1].push(e); else (path.nearestXZ(x, z).dist < 46 ? nearA[NB] : farA[NF - 1]).push(e);
          }
          c++;
        }
      }
      const lo = shootGeo(false, false);
      flushLod(nearA, 'haircap', 290, 44, shootGeo(true, false), mossMat, lo, mossMat);
      await ctx.yield();
      flushLod(farA, 'haircap-far', 290, 0, null, null, lo, mossMat);
      await ctx.yield();
      flushLod(capB, 'haircap-capsules', 290, 36, shootGeo(true, true), mossMat, shootGeo(false, true), mossMat);
      await ctx.yield();
      // short turf: young shoots, knee to shoulder high to the beetle, over the root bank the track climbs and through
      // the moss beyond the arcade. They stand right up to the track (lower the nearer), and leave the millipedes' lane.
      {
        const NT = 8, turf = mk(NT), nT = Math.round(1450 * mixn(0.5, 1, detail));
        const d0 = L * U_BANK - 6, d1 = L * U_BR - 4, z0 = L * uOfZ(331), z1 = L * uOfZ(266);
        for (let k = 0, tries = 0; k < nT && tries < nT * 6; tries++) {
          if ((tries & 63) === 0) await ctx.yield();
          const onBank = rx() < 0.72, d = onBank ? rx.range(d0, d1) : rx.range(z0, z1), lat = (rx.chance(0.5) ? 1 : -1) * (2.7 + 16 * Math.pow(rx(), 1.75));
          const hr = rx(), yaw = rx.range(0, TAU), tx = rx.range(-0.12, 0.12), tz = rx.range(-0.12, 0.12), cv = rx.range(0.85, 1.25), pick = rx();
          const [x, z] = beside(d, lat), al = Math.abs(lat);
          if (Math.hypot(x, z) < 15.5 || cushionAt(x, z) > 0.1) continue;
          if (onBank && lat > 3.5 && lat < 6.9) continue;             // the millipedes' lane
          if (onBank && pick > 0.25 + 0.75 * sstep(0.25, 0.7, bankAt(x, z))) continue;
          const hMax = Math.min(2.9, 0.75 + 0.3 * (al - 2.7)), hgt = mixn(0.7, hMax, hr * hr);
          E3.set(tx, yaw, tz);
          M4.compose(P3.set(x, surfAt(x, z) - 0.12, z), Q4.setFromEuler(E3), S3.set(hgt * 2.3, hgt, hgt * 2.3));
          if (pick < 0.12) tc.setRGB(cv * 1.25, cv * 1.0, cv * 0.6); else tc.setRGB(cv, cv * 1.05, cv * 0.85);
          turf[Math.min(NT - 1, Math.floor((onBank ? (d - d0) / (d1 - d0) * 0.75 : 0.75 + (d - z0) / (z1 - z0) * 0.25) * NT))].push({ m: M4.clone(), c: tc.clone() }); k++;
        }
        const turfMat = wmat(1, 1, { gloss: 0.5, sss: 0.4, fibre: 9, variant: 2, misc: [0.11, 0, 1, 190] });
        flushLod(turf, 'turf', 190, 34, shootGeo(true, false, 22), turfMat, shootGeo(false, false, 8), turfMat);
        await ctx.yield();
        // the turf itself: star-topped shoots a hand high to the beetle, standing thick beside the track where it climbs
        // the bank (the millipedes run through them) and thinner through the moss beyond the arcade
        const stars = mk(NT), nS = Math.round(2200 * mixn(0.5, 1, detail));
        for (let k = 0, tries = 0; k < nS && tries < nS * 5; tries++) {
          if ((tries & 63) === 0) await ctx.yield();
          const onBank = rx() < 0.84, d = onBank ? rx.range(d0, d1) : rx.range(z0, z1), lat = (rx.chance(0.5) ? 1 : -1) * (2.0 + 12 * Math.pow(rx(), 1.7));
          const sr = rx(), yaw = rx.range(0, TAU), tx = rx.range(-0.3, 0.3), tz = rx.range(-0.3, 0.3), cv = rx.range(0.5, 0.84), pick = rx(), lift = rx.range(0.0, 0.5);
          const [x, z] = beside(d, lat);
          if (Math.hypot(x, z) < 15.5 || cushionAt(x, z) > 0.1) continue;
          if (onBank && pick > 0.2 + 0.8 * sstep(0.2, 0.6, bankAt(x, z))) continue;
          const sc = mixn(0.32, lat > 3.2 && lat < 7.2 ? 0.42 : 0.74, sr);
          E3.set(tx, yaw, tz);
          M4.compose(P3.set(x, surfAt(x, z) + lift * sc * 0.5, z), Q4.setFromEuler(E3), S3.set(sc, sc * (0.8 + lift), sc));
          if (pick < 0.03) tc.setRGB(cv * 1.15, cv * 1.05, cv * 0.5); else tc.setRGB(cv * 0.72, cv * 1.0, cv * 0.5);
          stars[Math.min(NT - 1, Math.floor((onBank ? (d - d0) / (d1 - d0) * 0.75 : 0.75 + (d - z0) / (z1 - z0) * 0.25) * NT))].push({ m: M4.clone(), c: tc.clone() }); k++;
        }
        // and right beside the track on the bank, down to the beetle's own feet: short star shoots a hand high, so that the
        // lower third of the picture there is a mat of real moss and not a painted one (fourth round, its own stream)
        {
          const nS2 = Math.round(440 * mixn(0.5, 1, detail));
          for (let k = 0, tries = 0; k < nS2 && tries < nS2 * 4; tries++) {
            if ((tries & 63) === 0) await ctx.yield();
            const d = r4.range(d0 + 4, d1 - 2), lat = (r4.chance(0.5) ? 1 : -1) * (1.25 + 5.6 * Math.pow(r4(), 1.3)), sr = r4(), yaw = r4.range(0, TAU), tx = r4.range(-0.3, 0.3), tz = r4.range(-0.3, 0.3), cv = r4.range(0.55, 0.9), pick = r4(), lift = r4.range(0.0, 0.4);
            const [x, z] = beside(d, lat);
            if (Math.hypot(x, z) < 15.5 || cushionAt(x, z) > 0.1) continue;
            const sc = mixn(0.26, lat > 3.2 && lat < 7.2 ? 0.38 : 0.5, sr);
            E3.set(tx, yaw, tz);
            M4.compose(P3.set(x, surfAt(x, z) + lift * sc * 0.4, z), Q4.setFromEuler(E3), S3.set(sc, sc * (0.8 + lift), sc));
            if (pick < 0.05) tc.setRGB(cv * 1.15, cv * 1.05, cv * 0.5); else tc.setRGB(cv * 0.72, cv * 1.0, cv * 0.5);
            stars[Math.min(NT - 1, Math.floor((d - d0) / (d1 - d0) * 0.75 * NT))].push({ m: M4.clone(), c: tc.clone() }); k++;
          }
        }
        flushLod(stars, 'turf-stars', 84, 0, null, null, starGeo, wmat(1, 1, { gloss: 0.3, sss: 0.5, fibre: 14, variant: 2, misc: [0.035, 0, 1, 84] }));
      }
    }
    await ctx.yield();

    // ---- fly agarics in an arc either side of the track; puffballs; (late season: saucers and wood blewits)
    const statics = [], capParts = [];       // FK1 parts (stalks, puffballs, blewits) and FK4 caps
    const agarics = [], puffballs = [], puffParts = [], puffStage = [];
    const dArc0 = Math.max(L * uOfZ(206), dAnt + 14), dArc1 = L * uOfZ(104);
    const toadView = (d) => !!toadXZ && d > toadD - 78 && d < toadD + 16;      // on rare visits the right flank here is kept clear
    // The three puffballs that fire stand 10.5 m right of the track where the eye will be abreast of them at these u: the
    // drop lands when they are 28 m ahead, and the jet stands in the right of the frame, 12 to 25 m off, for the next second
    // and a half (they never come between the eye and the toad while both are in frame)
    const puffSite = [0.466, 0.514, 0.572].map((a) => { const [x, z] = beside(a * L, 10.5); return { d: a * L, x, z }; });
    {
      const nAg = Math.max(7, Math.min(13, Math.round(mixn(7, 13, (dens - 0.7) / 0.6))));
      const cream = C.cream.clone().multiplyScalar(0.9), scarlet = col('#D8281C'), lilac = col('#B4A2C4');
      // one fly agaric at d along the track: rs is the stream it draws from; ageSet and offMin are given for those added
      // beyond the arc (always on the left there: the right is the line of sight from the entry to the parasol)
      const growAgaric = (i, d, rs, ageSet = -1, offMin = 0, tall = 1) => {
        const rng = rs;
        const age = ageSet >= 0 ? ageSet : i === 1 ? 0.08 : i % 4 === 3 ? rng.range(0.05, 0.3) : rng.range(0.35, 1);
        const flip = toadView(d) && i % 2 === 1, sideSign = i % 2 && !flip ? 1 : -1;
        const H = (age < 0.2 ? rng.range(3.2, 4.6) : mixn(9.5, 14, rng()) * (late ? 0.62 : 1)) * tall;
        let R = age < 0.2 ? H * 0.42 : mixn(3.6, 7.2, sstep(0.2, 1, age)) * rng.range(0.9, 1.08);
        let off = Math.max(offMin, (age < 0.2 ? rng.range(9.5, 12) : rng.range(8.2, 10.5) + (late ? 3 : 0)) + (flip ? 6.5 : 0));
        let [x, z] = beside(d, sideSign * off);
        // the three puffballs that fire stand in clearings: an agaric that would roof one over stands further out, and
        // keeps its cap clear of the jet
        for (const ps of puffSite) {
          if (Math.hypot(ps.x - x, ps.z - z) > R + 3.4) continue;
          off += 6.5; [x, z] = beside(d, sideSign * off);
          R = Math.max(Math.min(R, Math.hypot(ps.x - x, ps.z - z) - 3.2), 2.8);
        }
        const y = surfAt(x, z) - 0.5;
        const lean = rng.range(0, TAU), la = rng.range(0.02, 0.09), sr = (age < 0.2 ? 0.9 : rng.range(0.72, 1.0));
        const m = new THREE.Matrix4().makeRotationAxis(P3.set(Math.cos(lean), 0, Math.sin(lean)).clone(), la).setPosition(x, y, z);
        agarics.push({ x, z, y, H, R, age });
        // stalk with a shaggy bulb
        statics.push({ m, g: lathe(14, 12, (v) => {
          const yy = v * H; return [sr * (1 + 1.0 * Math.exp(-yy * yy / 3.2) + 0.12 * Math.sin(yy * 3.1) * Math.exp(-yy / 3)) * (1 - 0.22 * v), yy];
        }, (u, v, o) => {
          const k = 0.86 + 0.14 * noise.n2(u * 30, v * 22 + i * 7), b = sstep(0.25, 0.0, v);
          o.c[0] = cream.r * k * (1 - 0.25 * b); o.c[1] = cream.g * k * (1 - 0.32 * b); o.c[2] = cream.b * k * (1 - 0.45 * b);
          o.a[0] = 0.5 + 0.5 * sstep(0, 0.2, v) - 0.35 * sstep(0.82, 1, v); o.a[1] = 0.8;
        }) });
        if (age >= 0.2) {
          // drooping skirt
          const ry = H * 0.74;
          statics.push({ m, g: lathe(16, 4, (v) => [sr * 0.8 + 0.1 + 1.25 * Math.pow(v, 0.7), ry - 1.5 * v * v - 0.1 * v], (u, v, o) => {
            const k = 0.9 + 0.1 * Math.sin(u * TAU * 9); o.c[0] = cream.r * k; o.c[1] = cream.g * k * 0.97; o.c[2] = cream.b * k * 0.9; o.a[0] = 0.75; o.a[1] = 0.7;
          }) });
        }
        // cap: egg -> dome -> plate (late season: an upturned orange saucer)
        const open = sstep(0.2, 0.85, age), hc = late ? -0.9 : mixn(R * 1.25, R * 0.16, open), pw = mixn(1.7, 3.2, open);
        const washed = late ? 0.05 : mixn(0.92, 0.22, sstep(0.3, 1, age));
        const red = late ? col('#C8641E') : scarlet.clone().multiplyScalar(rng.range(0.85, 1.05));
        const topY = (v) => H + (late ? 0.9 * Math.pow(v, 2.2) : hc * (1 - Math.pow(v, pw))) + (age < 0.2 ? 0 : 0.18 * R * Math.exp(-v * v * 30));
        const capR = (v) => R * (age < 0.2 ? Math.sin(v * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : Math.pow(v, 0.9));
        capParts.push({ m, g: lathe(30, 12, (v) => [capR(v) * (1 + (v > 0.9 ? 0.02 : 0)), topY(v) + (age < 0.2 ? -R * 0.9 * v * v : 0)], (u, v, o) => {
          o.c[0] = red.r; o.c[1] = red.g; o.c[2] = i * 0.37 % 1; o.a[0] = v; o.a[1] = washed;
        }) });
        if (age >= 0.2) capParts.push({ m, g: lathe(30, 4, (v) => { const q = mixn(0.12, 1, v); return [R * Math.pow(q, 0.9), topY(q) - (0.25 + 0.9 * (1 - q)) * (late ? 0.5 : 1)]; }, (u, v, o) => {
          o.c[0] = u; o.c[1] = 0; o.c[2] = 0; o.a[0] = mixn(0.12, 1, v); o.a[1] = 2;
        }) });
        if (late) {
          // lilac wood blewits growing where the agarics were
          for (let b = 0; b < 2; b++) {
            const [bx, bz] = beside(d + rng.range(-4, 4), sideSign * (off - 2.4 + b * 5.5 + rng.range(-1, 1))), by = surfAt(bx, bz) - 0.3;
            const bh = rng.range(3.5, 5.5), br = rng.range(2.6, 3.8), bm = new THREE.Matrix4().makeTranslation(bx, by, bz);
            statics.push({ m: bm, g: lathe(10, 5, (v) => [0.75 * (1 + 0.5 * Math.exp(-v * v * 8)), v * bh], (u, v, o) => { o.c[0] = lilac.r * 1.15; o.c[1] = lilac.g * 1.15; o.c[2] = lilac.b * 1.1; o.a[0] = 0.5 + 0.5 * v; o.a[1] = 0.6; }) });
            statics.push({ m: bm, g: lathe(18, 9, (v) => { const q = v < 0.7 ? v / 0.7 : 1 - (v - 0.7) / 0.3 * 0.82; return [br * q, bh + (v < 0.7 ? br * 0.42 * (1 - q * q) : -0.25 - 0.3 * (1 - q))]; }, (u, v, o) => {
              const k = v < 0.7 ? 1 : 0.62 + 0.1 * Math.sin(u * TAU * 40); o.c[0] = lilac.r * k; o.c[1] = lilac.g * k * 0.95; o.c[2] = lilac.b * k; o.a[0] = v < 0.7 ? 1 : 0.55; o.a[1] = v < 0.7 ? 1.6 : 0.4;
            }) });
          }
        }
      };
      for (let i = 0; i < nAg; i++) { const f = (i + rng.range(0.15, 0.85)) / nAg; growAgaric(i, mixn(dArc0, dArc1, f), rng); if (i & 1) await ctx.yield(); }
      // two more beyond the end of the arc, domed and scarlet, on the left of the track as it comes to the bank: red caps
      // are still overhead when the last puffball fires
      { const i0 = nAg + (nAg % 2); growAgaric(i0, dArc1 + 17 + r3.range(-1.5, 1.5), r3, r3.range(0.3, 0.36), 10.6, 0.7); growAgaric(i0 + 2, dArc1 + 40 + r3.range(-2, 2), r3, r3.range(0.3, 0.38), 11, 0.78); }
      await ctx.yield();
      // puffballs: warty pears with a pore; three stand where raindrops will land on them
      const nPuff = 16, puffCol = col('#C6AE86'), oldCol = col('#8A6A45');
      // the three that fire stand where the eye will be abreast of them at these u: the drop lands when they are 28 m
      // ahead, and the jet stands in the right of the frame, 12 to 25 m off, for the next second and a half
      for (let i = 0, tries = 0; i < nPuff && tries < 300; tries++) {
        const scripted = i < 3;
        const d = scripted ? puffSite[i].d : rng.range(L * uOfZ(300), L * U_BANK + 10);
        const sideDraw = scripted ? rng.range(9, 11) * (toadView(d) ? -1 : 1) : (rng.chance(0.5) ? 1 : -1) * rng.range(11, 46);
        const side = scripted ? 10.5 : sideDraw;
        const [x, z] = beside(d, side);
        if (!scripted && (cushionAt(x, z) > 0.2 || (toadXZ && Math.hypot(x - toadXZ[0], z - toadXZ[1]) < 20) || (side > 0 && toadView(d)) || Math.abs(d - dAnt) < 12 || agarics.some((a) => Math.hypot(a.x - x, a.z - z) < a.R + 5) || puffballs.some((p) => Math.hypot(p.x - x, p.z - z) < 9))) continue;
        const H = scripted ? rng.range(6, 7.5) : rng.range(4, 8), R = H * rng.range(0.36, 0.42), y = surfAt(x, z) - 0.25, old = scripted ? 0.75 : rng();
        puffballs.push({ x, z, y, H, R, d });
        const sq = rng.range(0.9, 1.1), ph = rng.range(0, 9);
        (scripted ? puffStage : puffParts).push({ m: scripted ? null : new THREE.Matrix4().makeTranslation(x, y, z), g: lathe(scripted ? 26 : 18, scripted ? 16 : 12, (v) => {
          const r = R * mixn(0.5, 1, sstep(0.2, 0.62, v)) * Math.sqrt(Math.max(1 - Math.pow(Math.max(0, (v - 0.64) / 0.36), 2.2), 0)) * Math.sqrt(sstep(0, 0.08, v) * 0.75 + 0.25);
          return [r, H * (v - 0.035 * sstep(0.93, 1, v))];
        }, (u, v, o) => {
          const th = u * TAU, wart = noise.n3(Math.cos(th) * 3.2 + ph, v * 9, Math.sin(th) * 3.2) * 0.5 + 0.5, w2 = sstep(0.55, 0.8, wart);
          const rr = 1 + 0.045 * w2 * sstep(0.3, 0.6, v) + 0.05 * Math.sin(th * 2 + ph) * sq;
          o.p[0] *= rr; o.p[2] *= rr;
          const k = (0.8 + 0.3 * wart) * (1 - 0.7 * sstep(0.955, 1, v)), cc = old > 0.6 ? 0.55 : 0.1;
          o.c[0] = mixn(puffCol.r, oldCol.r, cc + 0.3 * w2) * k; o.c[1] = mixn(puffCol.g, oldCol.g, cc + 0.3 * w2) * k; o.c[2] = mixn(puffCol.b, oldCol.b, cc + 0.3 * w2) * k;
          o.a[0] = 0.45 + 0.55 * sstep(0, 0.3, v); o.a[1] = 0.7;
        }) });
        i++;
        if ((i & 1) === 0) await ctx.yield();
      }
      // their own skin (pearl studs over a tan net); the three that fire are their own meshes, and flinch as the drop lands
      const puffMat = wmat(1, 0, { gloss: 0.5, sss: 0.14, fibre: 3, variant: 3 });
      await ctx.yield();
      addMesh(mergeGeos(puffParts), puffMat, 'puffballs');
      puffStage.forEach((e, i) => { const m = addMesh(e.g, puffMat, 'puffball-' + i); m.position.set(puffballs[i].x, puffballs[i].y, puffballs[i].z); m.updateMatrix(); puffStage[i] = m; });
    }
    await ctx.yield();

    // a gilled mushroom built for the close pass: bulbed stalk, a domed cap with its margin rolled under, and beneath it
    // real gills: an accordion of ng blades from the collar to the margin, bright edges over dark slots
    const shroom = (list, o) => {
      const { H, R, sr, top, mid, gill, stalk, ng, dome, m, noStalk, res = 28, sn = 12, sv = 10 } = o;
      if (!noStalk) list.push({ m, g: lathe(sn, sv, (v) => { const yy = v * (H + 0.6 * R * dome); return [sr * (1 + 0.8 * Math.exp(-yy * yy / (2.2 * sr * sr + 1))) * (1 - 0.24 * v), yy]; }, (u, v, q) => {
        const k = 0.84 + 0.16 * noise.n2(u * 30, v * 22 + H), b = sstep(0.22, 0, v);
        q.c[0] = stalk.r * k * (1 - 0.25 * b); q.c[1] = stalk.g * k * (1 - 0.32 * b); q.c[2] = stalk.b * k * (1 - 0.45 * b);
        q.a[0] = 0.5 + 0.5 * sstep(0, 0.2, v) - 0.4 * sstep(0.8, 1, v); q.a[1] = 0.8;
      }) });
      const hc = R * dome, topY = (q) => H + hc * (1 - Math.pow(q, 2.2)) + 0.1 * R * Math.exp(-q * q * 30);
      list.push({ m, g: lathe(res, 10, (v) => { const q = Math.min(1, v / 0.85), roll = Math.max(0, (v - 0.85) / 0.15); return [R * (Math.pow(q, 0.9) - 0.035 * roll * roll), topY(q) - 0.07 * R * roll]; }, (u, v, q2) => {
        const q = Math.min(1, v / 0.85), n = noise.n2(u * 40 + H, v * 6), ce = Math.exp(-q * q * 7), stri = v > 0.7 ? 0.9 + 0.1 * Math.sin(u * TAU * ng) : 1, k = (0.86 + 0.18 * n) * stri;
        q2.c[0] = mixn(top.r, mid.r, ce) * k; q2.c[1] = mixn(top.g, mid.g, ce) * k; q2.c[2] = mixn(top.b, mid.b, ce) * k;
        q2.a[0] = v > 0.85 ? 0.7 : 1; q2.a[1] = 1.5;
      }) });
      list.push({ m, g: gridGeo(ng * 2, 4, true, (u, v, q2, i) => {
        const th = u * TAU, q = mixn(0.1, 0.97, v), fold = i % 2, depth = (0.05 + 0.2 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.08 + q * 0.92)), 0.6)) * R;
        q2.p[0] = Math.cos(th) * R * q; q2.p[2] = Math.sin(th) * R * q; q2.p[1] = topY(q) - 0.06 * R - fold * depth;
        const k = fold ? 1 : 0.4;
        q2.c[0] = gill.r * k; q2.c[1] = gill.g * k; q2.c[2] = gill.b * k * (fold ? 1 : 0.85);
        q2.a[0] = (fold ? 0.95 : 0.4) * (0.6 + 0.4 * v); q2.a[1] = 0.35;
      }) });
    };
    {
      const tanTop = col('#B98A52'), tanMid = col('#74481F'), creamG = col('#E4D8B8'), paleS = col('#D6CAAC'), parTop = col('#D9CBA6'), parMid = col('#6E4A26');
      // each is its own mesh (they share one material): the one behind the eye is not drawn
      const troopMat = wmat(1, 0, { gloss: 0.6, sss: 0.14, fibre: 3, variant: 1 });
      troopShared.mat = troopMat;
      for (const t of troop) {
        const troopParts = [];
        await ctx.yield();
        const lean = rx.range(0, TAU), la = t.kind ? rx.range(0.01, 0.04) : rx.range(0.03, 0.1);
        const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.cos(lean), 0, Math.sin(lean)), la).setPosition(t.x, t.y, t.z);
        if (t.kind === 0) shroom(troopParts, { H: t.H, R: t.R, sr: rx.range(0.75, 1.0), top: tanTop.clone().multiplyScalar(rx.range(0.85, 1.12)), mid: tanMid, gill: creamG, stalk: paleS, ng: 34, dome: rx.range(0.22, 0.4), m });
        else {
          shroom(troopParts, { H: t.H, R: t.R, sr: rx.range(1.1, 1.4), top: parTop, mid: parMid, gill: creamG, stalk: paleS, ng: 30, dome: rx.range(0.24, 0.34), m, res: 20 });
          const ry = t.H * 0.72;
          troopParts.push({ m, g: lathe(14, 3, (v) => [1.3 + 2.2 * Math.pow(v, 0.7), ry - 1.8 * v * v], (u, v, q) => { q.c[0] = paleS.r * 0.9; q.c[1] = paleS.g * 0.86; q.c[2] = paleS.b * 0.8; q.a[0] = 0.75; q.a[1] = 0.6; }) });
        }
        const g = mergeGeos(troopParts); g.computeBoundingSphere(); troopMeshes.push(addMesh(g, troopMat, 'troop', true));
      }
    }
    await ctx.yield();

    // ---- mast husks: spiny four-lobed cups beside the track
    {
      const out = col('#6B4A26'), inn = col('#C9A877');
      const lobes = [];
      for (let l = 0; l < 4; l++) {
        const a0 = l / 4 * TAU + 0.2 * Math.sin(l * 2.3);
        lobes.push(gridGeo(4, 5, false, (u, v, o) => {
          const w = 0.62 * Math.sin(Math.PI * Math.min(1, 0.12 + v * 0.88)) * (1 - 0.4 * v), a = a0 + (u - 0.5) * w * 1.7;
          const rad = 0.16 + 0.95 * Math.sin(v * 1.9) * (1 + 0.07 * Math.sin(u * 19 + v * 23)), yy = 0.05 + 0.55 * v * v + 0.3 * v + 0.12 * Math.abs(u - 0.5);
          o.p[0] = Math.cos(a) * rad; o.p[1] = yy; o.p[2] = Math.sin(a) * rad;
          const k = 0.75 + 0.25 * Math.sin(u * 31 + v * 17);
          o.c[0] = mixn(inn.r, out.r, 0.5 + 0.5 * k * v); o.c[1] = mixn(inn.g, out.g, 0.5 + 0.5 * k * v); o.c[2] = mixn(inn.b, out.b, 0.5 + 0.5 * k * v);
          o.a[0] = 0.4 + 0.6 * v; o.a[1] = 0.5;
        }));
      }
      const n = Math.round(64 * mixn(0.7, 1, detail));
      const husks = new THREE.InstancedMesh(mergeGeos(lobes), wmat(1, 0, { gloss: 0.45, sss: 0.12, fibre: 14 }), n);
      let k = 0;
      for (let tries = 0; k < n && tries < n * 8; tries++) {
        const d = rng.range(0, L * U_BANK + 5), side = (rng.chance(0.5) ? 1 : -1) * (7.2 + 28 * Math.pow(rng(), 1.7));
        const [x, z] = beside(d, side);
        if (cushionAt(x, z) > 0.3 || (z < AZ0 + 6 && z > AZ1 - 6 && Math.abs(x) < 9)) continue;
        if (agarics.some((a) => Math.hypot(a.x - x, a.z - z) < 4) || puffballs.some((p) => Math.hypot(p.x - x, p.z - z) < p.R + 2.5)) continue;
        const s = rng.range(1.5, 2.1);
        E3.set(rng.range(-0.5, 0.5), rng.range(0, TAU), rng.range(-0.5, 0.5));
        M4.compose(P3.set(x, surfAt(x, z) + 0.05, z), Q4.setFromEuler(E3), S3.set(s, s * rng.range(0.8, 1.15), s));
        const cv = rng.range(0.7, 1.15); husks.setMatrixAt(k, M4); husks.setColorAt(k, tc.setRGB(cv, cv, cv)); k++;
      }
      husks.count = k; husks.name = 'husks'; splitAlong(husks, 6, 240);
    }
    await ctx.yield();

    // ---- wood: the arcade twig, the ants' arched twig, the fallen branch, the hollow log, far trunks
    const wood = [];
    const beechBark = col('#746B5E'), twigBark = col('#5E4630');
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    wood.push(tubeGeo([V3(-15, FLOOR + 3.0, 409), V3(-7.5, FLOOR + 9.5, 403.5), V3(0.6, ridgeAt(AZ0) + 0.7, AZ0), V3(-0.4, ridgeAt((AZ0 + AZ1) / 2) + 0.3, (AZ0 + AZ1) / 2), V3(0.2, ridgeAt(AZ1), AZ1),
      V3(7, ridgeAt(AZ1) - 2.2, AZ1 - 8), V3(14, FLOOR + 7, AZ1 - 18), V3(20, FLOOR + 0.4, AZ1 - 27)], 40, 8, (v) => 0.55 - 0.2 * v, twigBark, (c, s, a) => 0.1 * noise.n2(a * 0.25, c * 2)));
    // the ants' twig: it climbs out of the litter on the left, crosses the track nearly level 4 m above the eye and goes
    // down on the right, so the file is seen side-on against the canopy from a dozen metres off
    const antPts = (() => {
      const a = beside(dAnt + 4.5, -15), b = beside(dAnt + 2.5, -8.5), c = beside(dAnt + 0.6, -3.2), c2 = beside(dAnt - 0.6, 3.2), d = beside(dAnt - 2.5, 9.5), e = beside(dAnt - 5, 15), f = beside(dAnt - 7, 20);
      return [V3(a[0], surfAt(a[0], a[1]) + 0.2, a[1]), V3(b[0], FLOOR + 4.9, b[1]), V3(c[0], FLOOR + 5.85, c[1]), V3(c2[0], FLOOR + 5.95, c2[1]), V3(d[0], FLOOR + 5.3, d[1]), V3(e[0], FLOOR + 3.3, e[1]), V3(f[0], surfAt(f[0], f[1]) + 0.1, f[1])];
    })();
    const antCurve = new THREE.CatmullRomCurve3(antPts, false, 'centripetal');
    wood.push(tubeGeo(antPts, 36, 8, (v) => 0.5 - 0.14 * v, twigBark, (c, s, a) => 0.1 * noise.n2(a * 0.3 + 5, s * 2)));
    // the fallen branch the beetle runs down, from the bank into the log: silver-grey beech bark (its own mesh, so the
    // bark shader knows its girth), swollen here and there into burls on its flanks
    const dBR = L * U_BR, BR_R = 4;
    const boughBark = col('#716C60');
    {
      const bp = [], burls = [];
      for (let i = 0; i < 7; i++) burls.push([r3.range(18, 118), (r3.chance(0.5) ? 1 : -1) * r3.range(1.25, 1.9), r3.range(0.07, 0.14), r3.range(1.2, 2.2)]);
      for (let d = dBR - 16; d < L + 12; d += 9) { path.posAtDist(d, tmpV); bp.push(V3(tmpV.x, tmpV.y - EYE - BR_R + (d < dBR ? -0.5 : 0), tmpV.z)); }
      const g = tubeGeo(bp, 112, 30, (v) => BR_R * (1 - 0.06 * v), boughBark, (c, s, a) => {
        const th = Math.atan2(s, c); let k = 0.03 * noise.n3(c * 1.5, a * 0.09, s * 1.5) + 0.012 * noise.n3(c * 5, a * 0.4, s * 5);
        for (const bl of burls) { const da = (a - bl[0]) / bl[3], dt = (th - bl[1]) / 0.34; k += bl[2] * Math.exp(-da * da - dt * dt); }
        return k;
      });
      g.computeBoundingSphere();
      const m = addMesh(g, wmat(10, 0, { variant: 1, fibre: BR_R, misc: [0, 0.28, 1, 0] }), 'branch', true);
      lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 330, sw: 0 });
    }
    await ctx.yield();
    // The hollow log: a rotted beech bough 21 m across with a 15 m bore; the portal sits 6 m inside its mouth. The mouth
    // is a broken end, not a sawn one: the wall has split along the grain into staves that stand out to different
    // lengths, some run out into long splinters, some have rotted away and left a dark slot; bark stands proud of the
    // wood and lifts off it in flakes. Pale sap wood under the bark, tan within, umber rot round the bore.
    const logT = outDir.clone(), logB = new THREE.Vector3().crossVectors(logT, UP).normalize();
    const mouth = exit.clone().addScaledVector(logT, -6);
    const LOG_R = 10.5, BORE_R = 7.5;
    const ragAt = (th) => 1.5 * noise.n2(Math.cos(th) * 1.4 + 20, Math.sin(th) * 1.4) + 0.5 * noise.n2(Math.cos(th) * 5, Math.sin(th) * 5 + 7);
    const faceBase = (th) => 0.55 * ragAt(th);                 // where the broken end stands along the axis, round the mouth
    const logPt = (out, th, rho, sx) => out.set(mouth.x + logT.x * sx + logB.x * Math.cos(th) * rho, mouth.y + Math.sin(th) * rho, mouth.z + logT.z * sx + logB.z * Math.cos(th) * rho);
    const NST = 76, staveTh = [], staveFront = [];             // sector edges; per sector, the front of each of its three layers (null: rotted out)
    for (let k = 0; k <= NST; k++) staveTh.push((k + (k > 0 && k < NST ? r3.range(-0.28, 0.28) : 0)) / NST * TAU);
    // where the wood's face stands at this place on the mouth (for the brackets that grow on it)
    const frontAt = (th, rho) => {
      const t = ((th % TAU) + TAU) % TAU; let k = 0; while (k < NST - 1 && staveTh[k + 1] < t) k++;
      const fr = staveFront[k], l = rho < 8.35 ? 0 : rho < 9.3 ? 1 : 2;
      return fr && fr[l] !== null ? fr[l] : fr && fr[2] !== null ? fr[2] + 0.5 : faceBase(th);
    };
    {
      // bark shell, and the flakes that lift from its broken edge
      const st = [[46, 10.1], [32, 10.6], [17, 10.4], [7, 10.6], [1.6, 10.55], [0.35, 10.38]];
      const bark = [gridGeo(64, (st.length - 1) * 2, true, (u, v, o) => {
        const f = v * (st.length - 1), i = Math.min(st.length - 2, Math.floor(f)), t = f - i, th = u * TAU;
        let sx = mixn(st[i][0], st[i + 1][0], t), r = mixn(st[i][1], st[i + 1][1], t);
        const nearMouth = 1 - sstep(2, 9, sx);
        sx += (faceBase(th) + 0.9 * Math.abs(noise.n2(u * 40, 3.3)) * (1 - sstep(0.3, 2, sx))) * nearMouth;
        r *= 1 + 0.045 * noise.n3(Math.cos(th) * 1.8, sx * 0.08, Math.sin(th) * 1.8) + 0.012 * noise.n3(Math.cos(th) * 7, sx * 0.4, Math.sin(th) * 7);
        logPt(tmpV, th, r, sx); o.p[0] = tmpV.x; o.p[1] = tmpV.y; o.p[2] = tmpV.z;
        o.c[0] = boughBark.r; o.c[1] = boughBark.g; o.c[2] = boughBark.b; o.a[0] = u; o.a[1] = sx;
      })];
      for (let i = 0; i < 30; i++) {
        const th0 = r3.range(0, TAU), dth = r3.range(0.1, 0.26), len = r3.range(1.2, 3.6), lift = r3.range(0.25, 1.3), curl = r3.range(0.6, 1.6), root = r3.range(0.9, 1.9), tw = r3.range(-0.25, 0.25);
        if (Math.sin(th0) < -0.55) continue;                  // not under the log
        bark.push(gridGeo(3, 4, false, (u, v, o) => {
          const th = th0 + (u - 0.5) * dth * (1 - 0.35 * v * v) + tw * v * dth, fb = faceBase(th);
          const sx = fb + root - len * v, k = Math.pow(v, curl);
          logPt(tmpV, th, LOG_R + 0.08 + lift * k + 0.12 * Math.sin(u * Math.PI) * v, sx); o.p[0] = tmpV.x; o.p[1] = tmpV.y; o.p[2] = tmpV.z;
          const dk = 1 - 0.25 * v; o.c[0] = boughBark.r * dk; o.c[1] = boughBark.g * dk; o.c[2] = boughBark.b * dk; o.a[0] = th / TAU; o.a[1] = sx;
        }));
      }
      const g = mergeGeos(bark); g.computeBoundingSphere();
      const m = addMesh(g, wmat(9, 0, { variant: 1, fibre: LOG_R, misc: [0, 0, 1, 0] }), 'log-bark', true);
      lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 330, sw: 0 });
    }
    await ctx.yield();
    {
      // the wood: a dark backing and the bore, then the staves and loose splinters standing out of it
      const V = [], A = new THREE.Vector3(), Bv = new THREE.Vector3(), Cv = new THREE.Vector3(), Dv = new THREE.Vector3();
      const tri = (p, q, r, t, ap, aq, ar) => {
        V.push(p.x, p.y, p.z, t[0], t[1], t[2], p.w, ap, q.x, q.y, q.z, t[0], t[1], t[2], q.w, aq, r.x, r.y, r.z, t[0], t[1], t[2], r.w, ar);
      };
      const pt = (th, rho, sx) => { const v = logPt(new THREE.Vector3(), th, rho, sx); v.w = rho; return v; };
      const quad = (a, b, c, d, t, a0, a1) => { tri(a, b, c, t, a0, a0, a1); tri(a, c, d, t, a0, a1, a1); };
      const edges = [7.62, 8.35, 9.3, 10.22];
      for (let k = 0; k < NST; k++) {
        const t0 = staveTh[k], t1 = staveTh[k + 1], tm = (t0 + t1) * 0.5, fb = faceBase(tm), fr = [null, null, null];
        const under = Math.sin(tm) < -0.62;                  // under the branch: nothing shows
        for (let l = 0; l < 3; l++) {
          const r = r3(), gap = r3.range(0.05, 0.15), off = r3.range(-0.75, 0.55), long = r3.range(1.3, 3.4), tp = r3.range(0.2, 0.5), leanR = r3.range(-0.25, 0.5), leanT = r3.range(-0.3, 0.3);
          const tint = r3.range(0.8, 1.14), tg = r3.range(0.94, 1.02), tb = r3.range(0.84, 1.0);
          if (under || (l < 2 && r < 0.13)) continue;
          const splinter = r < 0.37, front = fb + (splinter ? -long : off), back = fb + 1.9;
          fr[l] = splinter ? fb - 0.4 : front;
          const ra = edges[l] + 0.02, rb = edges[l + 1] - 0.03 - (l < 2 ? r3.range(0, 0.08) : 0), ta = mixn(t0, t1, gap), tb2 = mixn(t0, t1, 1 - gap);
          const T = [tint, tint * tg, tint * tb];
          const b0 = pt(ta, ra, back), b1 = pt(tb2, ra, back), b2 = pt(tb2, rb, back), b3 = pt(ta, rb, back);
          // (a splinter of the innermost layer leans outward only: nothing reaches into the bore, where the portal is)
          const k2 = splinter ? tp : r3.range(0.82, 1), tc2 = tm + leanT * (t1 - t0) * (splinter ? 1 : 0.2), rc = Math.max(7.6, (ra + rb) * 0.5 + (splinter ? (l === 0 ? Math.abs(leanR) : leanR) : 0));
          const fpt = (th, rho, dx) => pt(mixn(tc2, th, k2), mixn(rc, rho, k2), front + dx);
          const sl = splinter ? 0 : r3.range(-0.25, 0.25), sl2 = splinter ? 0 : r3.range(-0.2, 0.2);
          const f0 = fpt(ta, ra, sl), f1 = fpt(tb2, ra, sl2), f2 = fpt(tb2, rb, -sl), f3 = fpt(ta, rb, -sl2);
          const aoF = Math.max(0.66, Math.min(1, 0.86 + 0.12 * (fb - front)));
          quad(f0, f1, f2, f3, T, aoF, aoF);
          quad(b0, b1, f1, f0, T, 0.4, 0.9); quad(b1, b2, f2, f1, T, 0.4, 0.9); quad(b2, b3, f3, f2, T, 0.4, 0.9); quad(b3, b0, f0, f3, T, 0.4, 0.9);
        }
        staveFront.push(fr);
      }
      // loose splinters: slivers torn half free, standing out of the face at their own angles
      for (let i = 0; i < 46; i++) {
        const th = r3.range(0, TAU), rho = r3.range(7.9, 10.1), len = r3.range(1.6, 4.4), w = r3.range(0.1, 0.24), sr = r3.range(-0.2, 0.55), stt = r3.range(-0.06, 0.06), tint = r3.range(0.9, 1.2);
        if (Math.sin(th) < -0.55) continue;
        const f0 = frontAt(th, rho) + 0.3, rt = Math.max(7.5, rho + sr * len), dth = w / rho;
        const a = pt(th - dth, rho - w * 0.4, f0), b = pt(th + dth, rho - w * 0.4, f0), c = pt(th, rho + w * 0.8, f0), tip = pt(th + stt, rt, f0 - len);
        const T = [tint, tint * 0.97, tint * 0.9];
        tri(a, b, tip, T, 0.6, 0.6, 1); tri(b, c, tip, T, 0.6, 0.6, 1); tri(c, a, tip, T, 0.6, 0.6, 1);
      }
      const staves = triGeo(V);
      await ctx.yield();
      const backing = gridGeo(48, 5, true, (u, v, o, i, j) => {
        const th = u * TAU, fb = faceBase(th), row = [[fb + 1.25, 10.32], [fb + 1.5, 9.0], [fb + 1.5, 7.56], [fb + 4.5, 7.5], [10, 7.5], [17, 7.5]][j];
        const r = row[1] * (j > 2 ? 1 + 0.03 * noise.n3(Math.cos(th) * 4, row[0] * 0.3, Math.sin(th) * 4 + 3) : 1);
        logPt(tmpV, th, r, row[0]); o.p[0] = tmpV.x; o.p[1] = tmpV.y; o.p[2] = tmpV.z;
        const k = j > 2 ? 0.3 : 0.36; o.c[0] = k; o.c[1] = k * 0.9; o.c[2] = k * 0.8; o.a[0] = r; o.a[1] = j > 2 ? 0.7 : 0.5;
      });
      const g = mergeGeos([staves, backing]); g.computeBoundingSphere();
      const m = addMesh(g, wmat(8, 0, { misc: [logT.x, logT.z, 0, 0] }), 'log-wood', true);
      lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 330, sw: 0 });
    }
    await ctx.yield();
    // ---- the great trunks: the birch at the glade edge and beeches at three distances, each on buttress roots that run
    // out into the litter, mossed at the foot (their own mesh: the bark shader is told their girth). They are placed by
    // hand so that none stands in the keyhole from the entry, behind the snail, or between the eye and the portal: one
    // stands 250 m behind the log, so the portal's light is seen against dark bark.
    const greatTrunks = [];
    let trunkMat = null;                          // its uMisc.z is eased under the parasol's vault (see update)
    {
      const birch = col('#D9D6CC'), dark = col('#4C463B');
      const bx = beside(L * uOfZ(170), 168), ex = (al, lat) => [exit.x + outDir.x * al - outDir.z * lat, exit.z + outDir.z * al + outDir.x * lat];
      const list = [[bx[0], bx[1], 22, birch, 3], [beeches[0][0], beeches[0][1], beeches[0][2], dark, 6], [...ex(250, 4), 52, dark, 7], [-105, -175, 44, dark, 6],
        [...ex(68, 97), 38, dark, 5], [...ex(139, -150), 42, dark, 6], [-160, 170, 34, dark, 5]];
      const parts = [];
      for (const t of list) {
        await ctx.yield();
        const R = t[2], nb = t[4], lob = [];
        for (let k = 0; k < nb; k++) lob.push([(k + r4.range(0.15, 0.85)) / nb * TAU, r4.range(0.75, 1.3), r4.range(4, 8)]);
        const rows = [-0.25, 0, 0.1, 0.25, 0.5, 1.0, 2.2, 5, 10, 18];
        const base = Math.min(FLOOR, t[0] > -225 && t[0] < 265 && t[1] > -195 && t[1] < 515 ? heightAt(t[0], t[1]) : FLOOR) - 1.5;
        greatTrunks.push([t[0], t[1], R]);
        // a far parasol that would stand inside a trunk is not shown
        troop.forEach((q, qi) => { if (troopMeshes[qi] && Math.hypot(q.x - t[0], q.z - t[1]) < R * 1.5 + q.R) troopMeshes[qi].visible = false; });
        parts.push({ m: new THREE.Matrix4().makeTranslation(t[0], base, t[1]), g: gridGeo(48, rows.length - 1, true, (u, v, o, i, j) => {
          const y = rows[j] * R, th = u * TAU, yy = Math.max(y, 0);
          let lobe = 0;
          for (const lb of lob) { const c = Math.cos(th - lb[0]); if (c > 0) lobe = Math.max(lobe, lb[1] * Math.pow(c, lb[2])); }
          const r = R * (1 + 0.035 * Math.sin(th * 3 + t[0]) + 0.02 * Math.sin(th * 7 + yy * 0.03) + lobe * (1.15 * Math.exp(-yy / (0.3 * R)) + 0.22 * Math.exp(-yy / (1.4 * R))) + 0.1 * Math.exp(-yy / (0.6 * R)));
          o.p[0] = Math.cos(th) * r; o.p[1] = y; o.p[2] = Math.sin(th) * r;
          const k = 1 - 0.25 * lobe * Math.exp(-yy / (0.5 * R));           // the hollows between the buttresses are darker
          o.c[0] = t[3].r * k; o.c[1] = t[3].g * k; o.c[2] = t[3].b * k; o.a[0] = u; o.a[1] = yy;
        }) });
      }
      await ctx.yield();
      trunkMat = wmat(9, 0, { variant: 1, fibre: 36, misc: [1, 0, 1, 0] });
      addMesh(mergeGeos(parts), trunkMat, 'great-trunks');
    }
    const twigLines = [];                              // where each fallen twig lies { pts, r, len }: the bonnet troops stand along them (see below)
    // fallen twigs lying through the litter, mossed and lichened: something of known thickness underfoot. Those that
    // cross the track are thin enough for the beetle to run over.
    {
      const nTw = Math.round(36 * mixn(0.6, 1, detail));
      for (let k = 0, tries = 0; k < nTw && tries < nTw * 8; tries++) {
        if ((tries & 7) === 0) await ctx.yield();
        const d = rx.range(6, L * U_BANK + 6), lat = rx.range(-32, 32), len = rx.range(11, 30), yaw = rx.range(0, Math.PI), rad0 = rx.range(0.2, 0.46), bend = rx.range(-0.3, 0.3);
        const fork = rx(), forkAt = rx.range(0.3, 0.7), forkA = rx.range(0.5, 0.95) * (rx.chance(0.5) ? 1 : -1), forkUp = rx.range(0.15, 0.5);
        const [x, z] = beside(d, lat);
        if ((z < AZ0 + 12 && z > AZ1 - 8 && Math.abs(x) < 14) || Math.hypot(x, z) < 34) continue;
        const pts = []; let ok = true, crossing = false;
        for (let i = 0; i <= 5 && ok; i++) {
          const t = i / 5 - 0.5, a = yaw + bend * t * 2, px = x + Math.cos(a) * len * t, pz = z + Math.sin(a) * len * t;
          if (cushionAt(px, pz) > 0.05 || agarics.some((g) => Math.hypot(g.x - px, g.z - pz) < 3.2) || puffballs.some((g) => Math.hypot(g.x - px, g.z - pz) < g.R + 1.2) || troop.some((g) => Math.hypot(g.x - px, g.z - pz) < 3.4)) ok = false;
          if (path.nearestXZ(px, pz).dist < 3.2 + len * 0.12) ok = false;                   // beside the track, never across it
          else if (path.nearestXZ(px, pz).dist < 7.5) crossing = true;
          pts.push(V3(px, surfAt(px, pz), pz));
        }
        if (!ok) continue;
        const r = crossing ? Math.min(rad0, 0.26) : rad0;
        for (const q of pts) q.y += r * 0.5;
        wood.push(tubeGeo(pts, 12, 6, (v) => r * (1 - 0.45 * v), twigBark, (c, sn, a) => 0.14 * noise.n2(a * 0.35 + k * 3, c * 2)));
        twigLines.push({ pts, r, len });
        if (fork > 0.35 && !crossing) {
          const t = forkAt - 0.5, a = yaw + bend * t * 2, bx0 = x + Math.cos(a) * len * t, bz0 = z + Math.sin(a) * len * t, fl = len * rx.range(0.18, 0.3), fa = a + forkA;
          if (tallOK(bx0, bz0, d, lat)) {
            const by0 = surfAt(bx0, bz0) + r * 0.5, fp = [];
            for (let i = 0; i <= 3; i++) { const q = i / 3; fp.push(V3(bx0 + Math.cos(fa) * fl * q, by0 + Math.sin(forkUp) * fl * q * (0.6 + 0.4 * q), bz0 + Math.sin(fa) * fl * q)); }
            if (fp.every((q) => path.distanceTo(q.x, q.y, q.z) > 6.5)) wood.push(tubeGeo(fp, 6, 5, (v) => r * 0.6 * (1 - 0.6 * v), twigBark, null));
          }
        }
        k++;
      }
    }
    // the route's own line, every half metre: a bell's clearance is measured to the line itself, along its whole length
    const RN = Math.ceil(L / 0.5), routeX = new Float32Array(RN + 1), routeZ = new Float32Array(RN + 1);
    for (let i = 0; i <= RN; i++) { path.pointAt(i / RN, tmpV); routeX[i] = tmpV.x; routeZ[i] = tmpV.z; }
    const routeDist = (x, z) => {
      const i0 = Math.round(path.nearestXZ(x, z).u * RN), ia = Math.max(0, i0 - 10), ib = Math.min(RN - 1, i0 + 10);
      let best = 1e9;
      for (let i = ia; i <= ib; i++) {
        const ax = routeX[i], az = routeZ[i], bx = routeX[i + 1] - ax, bz = routeZ[i + 1] - az;
        const t = clamp01(((x - ax) * bx + (z - az) * bz) / Math.max(bx * bx + bz * bz, 1e-9));
        best = Math.min(best, Math.hypot(x - ax - bx * t, z - az - bz * t));
      }
      return best;
    };
    // No bell stands nearer the route's line than the beetle's own half width plus a margin. The half width is 2.05 m:
    // the fore knees pump 0.72 m out from the mid line and the foot reaches 1.32 m beyond them. The margin is 1.45 m:
    // the widest cap's radius (0.92 m), its quiver (0.16 m) and 0.37 m of air. Both the bell's foot and its cap are
    // measured (a bell leans); one that would stand nearer is left out, and the rest of its tuft stands.
    const BEETLE_HALF = 2.05, BELL_MARGIN = 1.45, BELL_CLEAR = BEETLE_HALF + BELL_MARGIN;
    // where a bell may stand: not on a moss dome, not in a mushroom's foot, and nowhere that something head-high would
    // stand between the track and a named animal (namedOK, the test the tall things above ask: the arcade and its mouth,
    // the snail's rise, the mite's dome, the ants' twig, the toad, the foot of the bank where the train runs)
    const bellOK = (x, z) => {
      const n = path.nearestXZ(x, z), d = n.u * L;
      path.pointAt(n.u, tmpV); path.tangentAt(n.u, tmpT);
      const lat = ((x - tmpV.x) * -tmpT.z + (z - tmpV.z) * tmpT.x) / (Math.hypot(tmpT.x, tmpT.z) || 1);
      if (!namedOK(x, z, d, lat)) return false;
      if (cushionAt(x, z) > 0.5) return false;
      if (agarics.some((a) => Math.hypot(a.x - x, a.z - z) < 3.5) || puffballs.some((p) => Math.hypot(p.x - x, p.z - z) < p.R + 2) || troop.some((g) => Math.hypot(g.x - x, g.z - z) < 4.4)) return false;
      return true;
    };
    // short fallen twigs close beside the way: the same wood as the twigs above (the same tube, bark and material), 4 to
    // 8 m long and thinner as they are shorter. A short twig lies where its bells may stand: it is laid only if every one
    // of its six points passes the bells' own test of place (bellOK), lies no nearer the route's line than a bell may
    // (BELL_CLEAR, by routeDist) and lies 3 m clear of the wood already down. Nothing else is asked: those tests keep the
    // arcade, its mouth and the foot of the bank clear by themselves. They are few: about one to every SHORT_EVERY m of
    // the way on each side, from the way's start to the root bank's own station, each side drawn by itself, the place
    // along the way and the distance beside it both by chance, from a stream of their own. Each carries a troop of
    // bonnets by the troops' own rule below, so that the eye at 1.9 m passes bells at arm's length. A rule of the ground:
    // none reads the flight, none turns toward the route.
    const nLongTwigs = twigLines.length;
    {
      const rs = makeRng('spore-rain-short-twigs:' + ctx.seed), SHORT_EVERY = 30;
      const d0 = 0, d1 = L * U_BANK, perSide = Math.round((d1 - d0) / SHORT_EVERY * mixn(0.6, 1, detail));
      // how near a point lies to the wood already down (to its centre lines)
      const woodDist = (x, z) => {
        let best = 1e9;
        for (const tw of twigLines) for (let i = 0; i + 1 < tw.pts.length; i++) {
          const a = tw.pts[i], b = tw.pts[i + 1], bx = b.x - a.x, bz = b.z - a.z;
          const t = clamp01(((x - a.x) * bx + (z - a.z) * bz) / Math.max(bx * bx + bz * bz, 1e-9));
          best = Math.min(best, Math.hypot(x - a.x - bx * t, z - a.z - bz * t));
        }
        return best;
      };
      for (const side of [-1, 1]) {
        // (each twig's place along the way is drawn once; how it lies there is tried up to twenty times within a few metres
        // of that place, so a twig that finds no room is not laid somewhere else and no stretch gets more than its share)
        for (let k = 0, tries = 0, dk = 0; k < perSide; tries++) {
          if ((tries & 3) === 0) await ctx.yield();
          if (tries === 0) dk = rs.range(d0, d1);
          if (tries === 20) { k++; tries = -1; continue; }
          const d = dk + rs.range(-3, 3), lat = side * rs.range(4.4, 10.5), len = rs.range(4, 8), yaw = rs.range(0, Math.PI), thick = rs.range(0.85, 1.2), bend = rs.range(-0.3, 0.3);
          const [x, z] = beside(d, lat);
          const pts = []; let ok = true;
          for (let i = 0; i <= 5 && ok; i++) {
            const t = i / 5 - 0.5, a = yaw + bend * t * 2, px = x + Math.cos(a) * len * t, pz = z + Math.sin(a) * len * t;
            if (!bellOK(px, pz) || routeDist(px, pz) < BELL_CLEAR || woodDist(px, pz) < 3) ok = false;
            pts.push(V3(px, surfAt(px, pz), pz));
          }
          if (!ok) continue;
          const r = (0.09 + 0.018 * len) * thick;
          for (const q of pts) q.y += r * 0.5;
          // (a short twig is seen from arm's length: its snapped ends are closed, not open pipes)
          wood.push(tubeGeo(pts, 10, 6, (v) => r * (1 - 0.45 * v) * Math.sqrt(clamp01(Math.min(v, 1 - v) * 14)), twigBark, (c, sn, a) => 0.14 * noise.n2(a * 0.35 + (nLongTwigs + k) * 3 + side, c * 2)));
          twigLines.push({ pts, r, len });
          k++; tries = -1;
        }
      }
    }
    // ---- fourth round, in wood: twigs round the log; side limbs on the bough with dead leaves still hanging from them;
    // woodbine arching beside the track with its leaves hanging in the light; and the root that runs beside the head of
    // the bough, which a second ground beetle runs along as we pass (all from the fourth stream)
    const hang = [];                                   // hanging leaves { m, c }
    const root = { R: 1.25, pts: [], lat: 9.6 };       // the root's centre line; its beetle rides its crest
    {
      for (let k = 0, tries = 0; k < 9 && tries < 90; tries++) {
        const al = r4.range(-70, 70), lat = (r4.chance(0.5) ? 1 : -1) * r4.range(15, 60), len = r4.range(12, 26), yaw = r4.range(0, Math.PI), rad0 = r4.range(0.24, 0.5), bend = r4.range(-0.3, 0.3);
        const [x, z] = exitXZ(al, lat), pts = []; let ok = true;
        for (let i = 0; i <= 5 && ok; i++) {
          const t = i / 5 - 0.5, a = yaw + bend * t * 2, px = x + Math.cos(a) * len * t, pz = z + Math.sin(a) * len * t;
          if (inLog(px, pz, 3) || exitCushAt(px, pz) > 0.05 || path.nearestXZ(px, pz).dist < 10 || Math.hypot(px - ringSite[0], pz - ringSite[1]) < 12 || px < -225 || px > 265 || pz < -195) ok = false;
          pts.push(V3(px, surfX(px, pz) + rad0 * 0.5, pz));
        }
        if (!ok) continue;
        wood.push(tubeGeo(pts, 12, 6, (v) => rad0 * (1 - 0.45 * v), twigBark, (c, sn, a) => 0.14 * noise.n2(a * 0.35 + k * 3 + 50, c * 2)));
        k++;
      }
      await ctx.yield();
      // a leaf hung by its stalk from (x, y, z), its midrib along (dx, dy, dz)
      const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
      const hangLeaf = (x, y, z, dx, dy, dz, len, c) => {
        X.set(dx, dy, dz).normalize(); const tw = r4.range(0, TAU);
        Z.set(Math.cos(tw), 0, Math.sin(tw)); Z.addScaledVector(X, -Z.dot(X)); if (Z.lengthSq() < 0.01) Z.set(0, 0, 1); Z.normalize(); Y.crossVectors(Z, X).normalize();
        M4.makeBasis(X, Y, Z).scale(S3.set(len, len * r4.range(0.7, 1.3), len)); M4.setPosition(x + X.x * len * 0.56, y + X.y * len * 0.56, z + X.z * len * 0.56);
        hang.push({ m: M4.clone(), c: c.clone() });
      };
      const lemon = col('#D2B23E'), leafG = col('#7E9A3A');
      const tint = (k) => { const r = r4(); tc.copy(k === 0 ? tones[Math.floor(r * tones.length) % tones.length] : r < 0.45 ? lemon : r < 0.8 ? leafG : tones[0]).multiplyScalar(r4.range(0.8, 1.2)); if (late) tc.lerp(C.copper, 0.5); return tc; };
      // side limbs: each leaves the bough low on its flank, stays under the beetle's knee until it is clear of the lane,
      // then rises; the dead leaves on it never fell
      const Tn = new THREE.Vector3(), Rv = new THREE.Vector3();
      for (let i = 0; i < 6; i++) {
        const d = dBR + 13 + i * 15.5 + r4.range(-3, 3), sd = i % 2 ? 1 : -1, fw = r4.range(0.2, 0.8), up2 = r4.range(2.6, 4.2), up3 = r4.range(2.4, 4.4), rad = r4.range(0.5, 0.72);
        if (d > L - 26) continue;
        path.posAtDist(d, tmpV); path.tangentAtDist(d, Tn); Tn.setY(0).normalize(); Rv.set(-Tn.z, 0, Tn.x).multiplyScalar(sd);
        const cy = tmpV.y - EYE, at = (o, f, u) => V3(tmpV.x + Rv.x * o + Tn.x * f, cy + u, tmpV.z + Rv.z * o + Tn.z * f);
        const lp = [at(2.9, 0, -2.4), at(4.6, 1.6 * fw, -1.3), at(6.6, 3.4 * fw, -0.5), at(10.2, 6 * fw, up2 - 0.5), at(13.6, 9 * fw, up2 + up3 - 0.5)];
        wood.push(tubeGeo(lp, 14, 6, (v) => rad * (1 - 0.74 * v), twigBark, (c, sn, a) => 0.12 * noise.n2(a * 0.4 + i * 7, c * 2)));
        const cv = new THREE.CatmullRomCurve3(lp, false, 'centripetal'), nl = 7 + (i % 3);
        for (let l = 0; l < nl; l++) {
          cv.getPoint(0.52 + 0.48 * (l + r4.range(0.1, 0.9)) / nl, P3);
          hangLeaf(P3.x, P3.y - 0.1, P3.z, Rv.x * r4.range(-0.3, 0.5) + Tn.x * r4.range(-0.4, 0.4), -1, Rv.z * r4.range(-0.3, 0.5) + Tn.z * r4.range(-0.4, 0.4), r4.range(4.2, 6.8), tint(0));
        }
      }
      await ctx.yield();
      // woodbine: three bines arching over beside the track, the first two either side of the view up the bank to the
      // parasol (the left one stands in the shaft), the third to the left of the bough's head
      const bine = (pp, nLeaf) => {
        wood.push(tubeGeo(pp, 30, 6, (v) => 0.3 - 0.1 * v, twigBark, (c, sn, a) => 0.1 * noise.n2(a * 0.3 + pp[0].x, c * 2)));
        const cv = new THREE.CatmullRomCurve3(pp, false, 'centripetal');
        for (let l = 0; l < nLeaf; l++) {
          const t = 0.14 + 0.74 * (l + r4.range(0.15, 0.85)) / nLeaf; cv.getPoint(t, P3);
          const a = r4.range(0, TAU), sp = r4.range(0.15, 0.6);
          hangLeaf(P3.x, P3.y - 0.15, P3.z, Math.cos(a) * sp, -1, Math.sin(a) * sp, r4.range(3.6, 6.2), tint(1));
        }
      };
      const gy = (x, z) => surfX(x, z) - 0.6;
      bine([V3(-41, gy(-41, 46), 46), V3(-42, 8, 38), V3(-40, 16.5, 26), V3(-36, 19.5, 13), V3(-32, 15, 1), V3(-29.5, 6.5, -9), V3(-28.5, gy(-28.5, -15), -15)], 30);
      bine([V3(40, gy(40, 30), 30), V3(39, 7, 23), V3(35, 14.5, 13), V3(30, 16.5, 3), V3(26.5, 10.5, -5), V3(25, gy(25, -11), -11)], 22);
      {
        const o = [14, -24], h = [outDir.x, outDir.z], l = [outDir.z, -outDir.x], q = (a, b, y) => V3(o[0] + a * h[0] + b * l[0], y, o[1] + a * h[1] + b * l[1]);
        const a0 = q(17, 21, 0), a1 = q(60, 20, 0);
        bine([a0.setY(gy(a0.x, a0.z)), q(23, 20, 5), q(31, 18, 12.5), q(40, 16.5, 14.5), q(48, 16.5, 11), q(55, 18, 3), a1.setY(gy(a1.x, a1.z))], 28);
      }
      await ctx.yield();
      // the root: it comes out of the bank 22 m before the bough's head and runs beside it, its crest just above the level
      // the beetle runs at, then dives into the litter; two rootlets prop it where the ground has fallen away
      {
        const d0 = dBR - 24, d1 = dBR + 32;
        for (let d = d0; d <= d1 + 0.01; d += 4) {
          const f = (d - d0) / (d1 - d0), lat = root.lat + 0.6 * Math.sin(f * 5.0), [x, z] = beside(d, lat);
          path.posAtDist(d, tmpV);
          const g = heightAt(x, z), up = sstep(0, 0.18, f) * (1 - sstep(0.8, 1, f));
          root.pts.push(V3(x, mixn(g - root.R - 0.4, Math.max(tmpV.y - EYE + 0.5 - root.R, g - root.R * 0.6), up), z));
        }
        root.curve = new THREE.CatmullRomCurve3(root.pts, false, 'centripetal'); root.len = root.curve.getLength();
        const rg = tubeGeo(root.pts, 44, 14, (v) => root.R * (1 + 0.25 * (1 - sstep(0, 0.2, v)) - 0.2 * sstep(0.75, 1, v)), boughBark, (c, sn, a) => 0.07 * noise.n3(c * 1.3, a * 0.2, sn * 1.3) + 0.03 * noise.n3(c * 4, a * 0.6, sn * 4));
        const props = [];
        for (const f of [0.52, 0.7]) {
          root.curve.getPointAt(f, P3); const gx = P3.x + 1.2, gz = P3.z + 0.8;
          props.push(tubeGeo([V3(P3.x, P3.y - 0.3, P3.z), V3(P3.x + 0.7, P3.y - 1.8, P3.z + 0.5), V3(gx, heightAt(gx, gz) - 0.8, gz)], 5, 8, (v) => 0.75 - 0.25 * v, boughBark, null));
        }
        const g = mergeGeos([rg, ...props]); g.computeBoundingSphere();
        const m = addMesh(g, wmat(10, 0, { variant: 1, fibre: root.R, misc: [0, 0.6, 1, 0] }), 'root', true);
        lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 300, sw: 0 });
      }
    }
    await ctx.yield();
    addMesh(mergeGeos(wood), wmat(5, 0, { variant: 1, fibre: 4 }), 'wood');
    await ctx.yield();
    // the hanging leaves: thin, lit through, each swinging from its stalk
    {
      const hm = new THREE.InstancedMesh(leafGeo(8, 4), wmat(2, 1, { gloss: 0.45, sss: late ? 1.3 : 1.0, fibre: 15, misc: [0.4, 0, 1, 0] }), hang.length);
      hang.forEach((e, i) => { hm.setMatrixAt(i, e.m); hm.setColorAt(i, e.c); });
      hm.name = 'hanging-leaves'; splitAlong(hm, 7, 190, null, 4);
    }
    await ctx.yield();
    // a ring of small tan caps round one of the moss domes beside the log
    const extraOcc = [];
    {
      const parts = [], tanTop = col('#C39A5E'), tanMid = col('#7A4E24'), creamG = col('#E4D8B8'), paleS = col('#D6CAAC'), n = 13;
      for (let i = 0; i < n; i++) {
        const a = (i + r4.range(-0.3, 0.3)) / n * TAU, rr = ringSite[2] + r4.range(2.4, 3.9), H = r4.range(2.6, 5.4), R = r4.range(1.5, 2.5), la = r4.range(0.03, 0.14), ld = r4.range(0, TAU), sr = r4.range(0.3, 0.44), kt = r4.range(0.85, 1.15), dm = r4.range(0.25, 0.5);
        if (i === 4) continue;                                  // the ring is broken in one place
        const x = ringSite[0] + Math.cos(a) * rr, z = ringSite[1] + Math.sin(a) * rr;
        const m = new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.cos(ld), 0, Math.sin(ld)), la).setPosition(x, surfX(x, z) - 0.3, z);
        shroom(parts, { H, R, sr, top: tanTop.clone().multiplyScalar(kt), mid: tanMid, gill: creamG, stalk: paleS, ng: 18, dome: dm, m, res: 16 });
        extraOcc.push([x, z, R + 1.2, 0.4]);
        if ((i & 3) === 3) await ctx.yield();
      }
      const g = mergeGeos(parts); g.computeBoundingSphere();
      const m = addMesh(g, troopShared.mat, 'ring-caps', true);
      lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 150, sw: 0 });
      for (const c of exitCush) extraOcc.push([c[0], c[1], c[2] * 1.15, 0.3]);
    }
    await ctx.yield();

    // ---- porcelain fungus (it grows on fallen beech): glistening translucent caps on curved stalks, arching out from
    // the flanks of the branch so that the beetle runs down an avenue of them, looking up into their gills
    {
      const parts = [], ivory = col('#DDDCD0'), ivoryMid = col('#B9B6A6'), gillC = col('#E6E4DA'), stC = col('#CFC9B8');
      const Tn = new THREE.Vector3(), Rv = new THREE.Vector3(), B = new THREE.Vector3(), T = new THREE.Vector3(), Mx = new THREE.Matrix4();
      let sideSign = rx.chance(0.5) ? 1 : -1;
      for (let d = dBR + 12; d < L - 33; d += rx.range(6.5, 10)) {
        sideSign = -sideSign;
        await ctx.yield();
        const nC = rx.chance(0.4) ? 2 : 1;
        for (let c = 0; c < nC; c++) {
          const dd = d + c * rx.range(2.5, 4), el = rx.range(-0.15, 0.3), R = rx.range(2.5, 4.3) * (c ? 0.75 : 1), hTop = rx.range(2.4, 7.2) * (c ? 0.6 : 1) + 1.2, tiltA = rx.range(0.12, 0.34), fwd = rx.range(-2.5, 2.5);
          let latT = rx.range(8.8, 12.6) + (c ? 1.5 : 0);
          path.posAtDist(dd, tmpV); path.tangentAtDist(dd, Tn); Tn.setY(0).normalize(); Rv.set(-Tn.z, 0, Tn.x).multiplyScalar(sideSign);
          while (Math.hypot(latT - R, hTop) < 6.6) latT += 0.5;
          B.copy(tmpV).setY(tmpV.y - EYE - BR_R + Math.sin(el) * BR_R).addScaledVector(Rv, Math.cos(el) * BR_R * 0.96);
          T.copy(tmpV).addScaledVector(Rv, latT).addScaledVector(Tn, fwd).setY(tmpV.y + hTop);
          const mid = [B.x + (T.x - B.x) * 0.62, B.y + (T.y - B.y) * 0.22, B.z + (T.z - B.z) * 0.62], mid2 = [B.x + (T.x - B.x) * 0.93, B.y + (T.y - B.y) * 0.7, B.z + (T.z - B.z) * 0.93];
          const sr = 0.12 + 0.03 * R;
          parts.push(tubeR([[B.x, B.y, B.z], mid, mid2, [T.x, T.y + 0.1 * R, T.z]], [sr * 1.5, sr, sr * 0.9, sr * 1.1], stC, 8, 3, 0.85, 0.9));
          // the cap tips its far side up a little, showing its gills to the track
          Mx.makeRotationAxis(Tn, sideSign * tiltA).setPosition(T.x, T.y, T.z);
          shroom(parts, { H: 0, R, sr: 0, top: ivory.clone().multiplyScalar(rx.range(0.9, 1.05)), mid: ivoryMid, gill: gillC, stalk: stC, ng: 26, dome: rx.range(0.3, 0.46), m: Mx.clone(), noStalk: true, res: 24 });
        }
      }
      // the same fungus on the root beside the bough's head: small caps on leaning stalks down both its flanks, clear of
      // the crest its beetle runs along
      for (let i = 0; i < 12; i++) {
        const f = i < 4 ? r4.range(0.2, 0.34) : r4.range(0.5, 0.8), sd = i % 2 ? 1 : -1, el = r4.range(0.0, 0.42), h = r4.range(0.9, 2.3), R = sd > 0 ? r4.range(0.75, 1.25) : r4.range(0.5, 0.72), kt = r4.range(0.9, 1.05), dm = r4.range(0.3, 0.46), ta = r4.range(0.1, 0.3);
        root.curve.getPointAt(f, tmpV); root.curve.getTangentAt(f, Tn); Tn.setY(0).normalize(); Rv.set(-Tn.z, 0, Tn.x).multiplyScalar(sd);
        const out = sd > 0 ? 1.9 : 1.15, ce = Math.cos(el) * root.R, se = Math.sin(el) * root.R;
        B.copy(tmpV).addScaledVector(Rv, ce * 0.96).setY(tmpV.y + se * 0.96);
        T.copy(tmpV).addScaledVector(Rv, ce + out).setY(tmpV.y + se + h);
        parts.push(tubeR([[B.x, B.y, B.z], [B.x + (T.x - B.x) * 0.7, B.y + (T.y - B.y) * 0.3, B.z + (T.z - B.z) * 0.7], [T.x, T.y + 0.05, T.z]], [0.13, 0.085, 0.1], stC, 6, 3, 0.85, 0.9));
        Mx.makeRotationAxis(Tn, sd * ta).setPosition(T.x, T.y, T.z);
        shroom(parts, { H: 0, R, sr: 0, top: ivory.clone().multiplyScalar(kt), mid: ivoryMid, gill: gillC, stalk: stC, ng: 16, dome: dm, m: Mx.clone(), noStalk: true, res: 16 });
      }
      await ctx.yield();
      { const g = mergeGeos(parts); g.computeBoundingSphere(); const m = addMesh(g, wmat(1, 0, { gloss: 1.5, sss: 0.7, fibre: 2.2, variant: 0 }), 'porcelain', true);
        lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 300, sw: 0 }); }
    }
    await ctx.yield();

    const mossSpots = [];                              // the moss cushions on the bough [d, side, lat, extent]: seedlings root in them
    // ---- what grows on the bough beside the beetle's lane: rosettes of leafy lichen, grey-green and a few sulphur, lying
    // on the bark, and cushions of moss shoots along the moss stripe. All of it stays under knee height to the beetle.
    {
      const lobed = gridGeo(14, 2, true, (u, v, o) => {
        const th = u * TAU, r = v * (1 + 0.2 * Math.sin(th * 5 + 1) + 0.1 * Math.sin(th * 11)) * (0.6 + 0.4 * v);
        o.p[0] = Math.cos(th) * r; o.p[2] = Math.sin(th) * r; o.p[1] = 0.03 + 0.1 * Math.sin(v * Math.PI) + 0.09 * v * v * Math.sin(th * 7 + 2);
        const k = 0.5 + 0.55 * v; o.c[0] = k; o.c[1] = k; o.c[2] = k; o.a[0] = 0.55 + 0.45 * v; o.a[1] = 0.25;
      });
      const nL = Math.round(84 * mixn(0.6, 1, detail)), lich = new THREE.InstancedMesh(lobed, wmat(1, 0, { gloss: 0.2, sss: 0.25, fibre: 12 }), nL);
      const tufts = [[], [], []], nrm = new THREE.Vector3(), right = new THREE.Vector3();
      mossSpots.length = 0;
      // a point on the bough's upper surface, lat metres right of its crest; returns its height and leaves the normal in nrm
      const onBough = (d, lat) => {
        path.posAtDist(d, tmpV); path.tangentAtDist(d, tmpT); right.set(-tmpT.z, 0, tmpT.x).normalize();
        const up = Math.sqrt(BR_R * BR_R - lat * lat);
        nrm.copy(right).multiplyScalar(lat / BR_R).addScaledVector(UP, up / BR_R).normalize();
        P3.copy(tmpV).addScaledVector(right, lat).setY(tmpV.y - EYE - BR_R + up * (1 + 0.02));
      };
      let k = 0;
      for (let i = 0; i < nL; i++) {
        const d = r3.range(dBR + 5, L - 9), lat = (r3.chance(0.5) ? 1 : -1) * r3.range(1.55, 3.75), sc = r3.range(0.45, 1.25) * (r3.chance(0.2) ? 1.5 : 1), tone = r3(), kc = r3.range(0.8, 1.15);
        onBough(d, lat);
        Q4.setFromUnitVectors(UP, nrm).multiply(tmpQ.setFromAxisAngle(UP, r3.range(0, TAU)));
        M4.compose(P3, Q4, S3.set(sc, sc * r3.range(0.7, 1.3), sc)); lich.setMatrixAt(k, M4);
        if (tone < 0.2) tc.setRGB(0.78 * kc, 0.56 * kc, 0.14 * kc); else if (tone < 0.5) tc.setRGB(0.62 * kc, 0.68 * kc, 0.6 * kc); else tc.setRGB(0.42 * kc, 0.52 * kc, 0.4 * kc);
        lich.setColorAt(k, tc); k++;
      }
      lich.count = k; lich.name = 'bough-lichen'; splitAlong(lich, 12, 150);
      await ctx.yield();
      for (let c = 0; c < 13; c++) {
        const d0 = dBR + 8 + (L - 20 - dBR) * (c + r3.range(0.1, 0.9)) / 13, side = c % 2 ? 1 : -1, lat0 = r3.range(2.1, 3.1), ext = r3.range(2.2, 4.2), n = Math.round(r3.range(34, 58) * mixn(0.5, 1, detail));
        for (let i = 0; i < n; i++) {
          const g = r3.gauss ? r3.gauss() : r3.range(-1, 1), d = d0 + g * ext * 0.5, lat = side * Math.min(3.8, Math.max(1.5, lat0 + r3.range(-0.9, 0.9))), sc = r3.range(0.34, 0.7), cv = r3.range(0.5, 0.86), yaw = r3.range(0, TAU), warm = r3();
          if (d < dBR + 4 || d > L - 8) continue;
          onBough(d, lat);
          Q4.setFromUnitVectors(UP, nrm.lerp(UP, 0.4).normalize()).multiply(tmpQ.setFromAxisAngle(UP, yaw));
          M4.compose(P3, Q4, S3.set(sc, sc * 0.95, sc));
          if (warm < 0.06) tc.setRGB(cv * 1.15, cv * 1.05, cv * 0.5); else tc.setRGB(cv * 0.72, cv, cv * 0.5);
          tufts[Math.min(2, Math.floor((d - dBR) / (L - dBR) * 3))].push({ m: M4.clone(), c: tc.clone() });
        }
        mossSpots.push([d0, side, lat0, ext]);
      }
      flushLod(tufts, 'bough-moss', 90, 0, null, null, starGeo, wmat(1, 1, { gloss: 0.3, sss: 0.5, fibre: 14, variant: 2, misc: [0.03, 0, 1, 90] }));
    }
    await ctx.yield();

    // ---- turkeytail brackets in tiers round the log mouth and along the branch; one grey hoof fungus
    {
      const shelf = gridGeo(10, 3, false, (u, v, o) => {
        const ph = u * Math.PI, r = v * (1 + 0.09 * Math.sin(ph * 5) + 0.05 * Math.sin(ph * 11));
        o.p[0] = Math.cos(ph) * r; o.p[2] = Math.sin(ph) * r * 0.85 - 0.08; o.p[1] = 0.16 * (1 - v) + 0.05 * Math.sin(ph * 6) * v - 0.12 * v * v;
        o.c[0] = o.c[1] = o.c[2] = 1; o.a[0] = v; o.a[1] = u;
      });
      const n = 96 + 18, br = new THREE.InstancedMesh(shelf, wmat(3, 0, { gloss: 0.3, sss: 0.15, variant: 1 }), n);
      const X = new THREE.Vector3(), Zv = new THREE.Vector3(), rad = new THREE.Vector3();
      let k = 0;
      const put = (pos, outV, size) => {
        Zv.copy(outV).setY(0).normalize(); X.crossVectors(UP, Zv).normalize();
        M4.makeBasis(X, UP, Zv).scale(S3.set(size, size * rng.range(0.7, 1.3), size)).setPosition(pos);
        br.setMatrixAt(k, M4); br.setColorAt(k, tc.setRGB(rng(), rng.range(0.45, 0.8), 0)); k++;
      };
      for (let i = 0; i < 64; i++) {
        const tier = i % 16, th = mixn(-0.3, Math.PI + 0.3, (tier + rng.range(0.1, 0.9)) / 16), onFace = i % 3 === 0;
        rad.copy(logB).multiplyScalar(Math.cos(th)).addScaledVector(UP, Math.sin(th));
        if (onFace) {
          const rh = rng.range(8.3, 10.2);
          P3.copy(mouth).addScaledVector(rad, rh).addScaledVector(logT, frontAt(th, rh) - 0.1);
          put(P3, tmpT.copy(logT).negate().addScaledVector(logB, Math.cos(th) * 0.5), rng.range(1.3, 2.4));
        } else {
          const sx = rng.range(0.6, 7) + ragAt(th) * 0.55 + 1.0;
          P3.copy(mouth).addScaledVector(rad, LOG_R + 0.05).addScaledVector(logT, sx);
          tmpT.copy(logB).multiplyScalar(Math.cos(th) >= 0 ? 1 : -1).addScaledVector(logT, -0.9 * Math.abs(Math.sin(th)));
          put(P3, tmpT, rng.range(1.6, 3.4) * (1 - 0.3 * Math.abs(Math.sin(th))));
        }
      }
      for (let i = 0; i < 32; i++) {
        const d = rng.range(dBR + 8, L - 12), side = rng.chance(0.5) ? 1 : -1, el = rng.range(-0.1, 0.5);
        path.posAtDist(d, tmpV); path.tangentAtDist(d, tmpT); rad.set(-tmpT.z, 0, tmpT.x).normalize().multiplyScalar(side);
        P3.copy(tmpV).setY(tmpV.y - EYE - BR_R + Math.sin(el) * BR_R).addScaledVector(rad, Math.cos(el) * BR_R * 0.97);
        put(P3, rad, rng.range(1.0, 2.2));
      }
      // tiers of turkeytail down the flank of the root that faces the track
      for (let i = 0; i < 18; i++) {
        const f = r4.range(0.28, 0.8), el = r4.range(-0.55, 0.32), size = r4.range(0.7, 1.25), sy = r4.range(0.7, 1.3), c1 = r4(), c2 = r4.range(0.45, 0.8);
        root.curve.getPointAt(f, tmpV); root.curve.getTangentAt(f, tmpT); rad.set(tmpT.z, 0, -tmpT.x).normalize();
        P3.copy(tmpV).addScaledVector(rad, Math.cos(el) * root.R * 0.97).addScaledVector(UP, Math.sin(el) * root.R * 0.97);
        Zv.copy(rad); X.crossVectors(UP, Zv).normalize();
        M4.makeBasis(X, UP, Zv).scale(S3.set(size, size * sy, size)).setPosition(P3);
        br.setMatrixAt(k, M4); br.setColorAt(k, tc.setRGB(c1, c2, 0)); k++;
      }
      br.count = k; br.name = 'brackets'; br.frustumCulled = false; scene.add(br);
      const grey = col('#84857E');
      const th = 0.7; rad.copy(logB).multiplyScalar(-Math.cos(th)).addScaledVector(UP, Math.sin(th));
      P3.copy(mouth).addScaledVector(rad, LOG_R + 0.2).addScaledVector(logT, 3.2);
      statics.push(gridGeo(14, 8, true, (u, v, o) => {
        const a = u * TAU, ph = v * Math.PI * 0.5, band = 0.8 + 0.2 * Math.sin(v * 26);
        const r = 2.6 * Math.sin(ph + 0.15) * band;
        o.p[0] = P3.x + Math.cos(a) * r; o.p[1] = P3.y + 2.2 * Math.cos(ph) - 1.2 * (1 - v) * 0 - 0.4; o.p[2] = P3.z + Math.sin(a) * r;
        const k2 = 0.7 + 0.3 * Math.sin(v * 26 + 1); o.c[0] = grey.r * k2; o.c[1] = grey.g * k2; o.c[2] = grey.b * k2; o.a[0] = 0.6 + 0.4 * (1 - v); o.a[1] = 0.5;
      }));
    }
    await ctx.yield();

    // ---- beech nuts and cigar buds strewn along the track: something of known size underfoot
    {
      // a nut is three-winged: a spindle of triangular section with hollowed faces, sharp at the tip, blunt at the scar
      const nutC = col('#6A3E1E'), wingC = col('#9A6A38'), scarC = col('#B79A6A');
      const nutGeo = gridGeo(6, 6, true, (u, v, o) => {
        const th = u * TAU, corner = 0.5 + 0.5 * Math.cos(3 * th);
        const prof = Math.pow(Math.max(Math.sin(Math.PI * Math.pow(0.12 + 0.88 * v, 0.7)), 0), 0.9);
        const r = 0.3 * prof * (0.42 + 0.58 * Math.pow(corner, 1.3));
        o.p[0] = Math.cos(th) * r; o.p[1] = Math.sin(th) * r + 0.16; o.p[2] = -0.45 + v;
        const k = 0.8 + 0.3 * corner, sc = 1 - sstep(0, 0.14, v);
        o.c[0] = mixn(mixn(nutC.r, wingC.r, corner * corner) * k, scarC.r, sc); o.c[1] = mixn(mixn(nutC.g, wingC.g, corner * corner) * k, scarC.g, sc); o.c[2] = mixn(mixn(nutC.b, wingC.b, corner * corner) * k, scarC.b, sc);
        o.a[0] = 0.6 + 0.4 * corner; o.a[1] = 1.0 - 0.6 * sc;
      });
      // a bud is a long spindle wrapped in overlapping scales, tan with brown edges
      const budA = col('#B98F5A'), budB = col('#6E4A2A');
      const budGeo = gridGeo(6, 7, true, (u, v, o) => {
        const th = u * TAU, sc = (v * 6 + u * 2) % 1, r = 0.3 * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(0.03 + 0.97 * v, 0.8)), 0), 0.8) * (1 + 0.1 * sc);
        o.p[0] = Math.cos(th) * r; o.p[1] = Math.sin(th) * r + 0.22; o.p[2] = -0.5 + v;
        const k = sstep(0.55, 1, sc);
        o.c[0] = mixn(budA.r, budB.r, k); o.c[1] = mixn(budA.g, budB.g, k); o.c[2] = mixn(budA.b, budB.b, k);
        o.a[0] = 0.75 + 0.25 * Math.sin(th); o.a[1] = 0.55;
      });
      const mat = wmat(1, 0, { gloss: 1.1, fibre: 6 });
      const strew = (geo, n, name, lenA, lenB, wid) => {
        const mesh = new THREE.InstancedMesh(geo, mat, n);
        let k = 0;
        for (let tries = 0; k < n && tries < n * 5; tries++) {
          const d = rng.range(2, L * U_BR - 14), [x, z] = beside(d, (rng.chance(0.5) ? 1 : -1) * (1.2 + 15 * Math.pow(rng(), 1.5)));
          if (Math.hypot(x, z) < 18 || cushionAt(x, z) > 0.6) continue;
          const len = rng.range(lenA, lenB), w = wid(len);
          E3.set(rng.range(-0.25, 0.25), rng.range(0, TAU), rng.range(0, TAU), 'YXZ');
          M4.compose(P3.set(x, surfAt(x, z) + 0.1, z), Q4.setFromEuler(E3), S3.set(w, w, len));
          mesh.setMatrixAt(k, M4); const cv = rng.range(0.7, 1.25); mesh.setColorAt(k, tc.setRGB(cv, cv, cv)); k++;
        }
        mesh.count = k; mesh.name = name; splitAlong(mesh, 8, 170);
      };
      strew(nutGeo, Math.round(130 * mixn(0.6, 1, detail)), 'nuts', 1.6, 2.3, (len) => len * 0.95);
      strew(budGeo, Math.round(90 * mixn(0.6, 1, detail)), 'buds', 2.4, 3.4, () => rng.range(0.9, 1.25));
    }
    await ctx.yield();

    // ---- bonnets (Mycena): troops of translucent striped bells on hair stalks; porcelain fungus on the log
    {
      const pale = col('#CDBFA6'), stalkC = col('#7E6B58');
      const parts = [limb([[0, 0, 0], [0.03, 0.3, 0.012], [0.05, 0.6, 0], [0.045, 0.87, -0.01]], 0.02, stalkC, 0.5, true)];
      parts.push(lathe(9, 4, (v) => [0.2 * Math.pow(v, 0.62) * (1 + 0.22 * v * v * v), 0.8 + 0.32 * (1 - Math.pow(v, 1.5))], (u, v, o, pr) => {
        const stripe = Math.round(u * 9) % 2 ? 0.6 : 1, k = mixn(1, stripe, sstep(0.25, 1, v)) * (0.8 + 0.2 * v);
        const ap = 1 - sstep(0, 0.3, v);
        o.c[0] = mixn(pale.r * k, stalkC.r * 1.3, ap * 0.6); o.c[1] = mixn(pale.g * k, stalkC.g * 1.2, ap * 0.6); o.c[2] = mixn(pale.b * k, stalkC.b, ap * 0.6);
        o.a[0] = 1; o.a[1] = 1;
      }));
      const nMax = 260, bon = new THREE.InstancedMesh(mergeGeos(parts), wmat(1, 1, { gloss: 0.5, sss: 0.95, fibre: 26, misc: [0.16, 0, 1, 0] }), nMax + 80);
      let k = 0;
      const put = (x, y, z, s, tint, tiltK = 0.25) => {
        if (k >= nMax) return;
        E3.set(rng.range(-tiltK, tiltK), rng.range(0, TAU), rng.range(-tiltK, tiltK));
        M4.compose(P3.set(x, y, z), Q4.setFromEuler(E3), S3.set(s * rng.range(0.9, 1.4), s, s * rng.range(0.9, 1.4)));
        bon.setMatrixAt(k, M4); bon.setColorAt(k, tint); k++;
      };
      const tint = new THREE.Color();
      // along both flanks of the branch
      for (let d = dBR + 7; d < L - 9; d += rng.range(4, 6.5)) {
        const side = rng.chance(0.5) ? 1 : -1, n = rng.int(3, 6);
        for (let i = 0; i < n; i++) {
          const dd = d + rng.range(-2.4, 2.4), lat = rng.range(3.62, 3.95);
          path.posAtDist(dd, tmpV); path.tangentAtDist(dd, tmpT);
          const nx = -tmpT.z, nz = tmpT.x, nl = Math.hypot(nx, nz) || 1;
          const cv = rng.range(0.8, 1.15);
          put(tmpV.x + nx / nl * lat * side, tmpV.y - EYE - BR_R + Math.sqrt(BR_R * BR_R - lat * lat) - 0.15, tmpV.z + nz / nl * lat * side, rng.range(1.4, 2.5), tint.setRGB(cv, cv, cv * rng.range(0.9, 1.05)), 0.3);
        }
      }
      // troops in the litter beside the track
      const nTroop = Math.round(24 * dens);
      for (let t = 0, tries = 0; t < nTroop && tries < 200; tries++) {
        const d = rng.range(8, L * U_BANK), side = (rng.chance(0.5) ? 1 : -1) * rng.range(6.5, 15);
        const [cx, cz] = beside(d, side);
        if ((cz < AZ0 + 8 && cz > AZ1 - 8) || cushionAt(cx, cz) > 0.5 || (side > 0 && toadView(d))) continue;
        if (agarics.some((a) => Math.hypot(a.x - cx, a.z - cz) < 3.5) || puffballs.some((p) => Math.hypot(p.x - cx, p.z - cz) < p.R + 2)) continue;
        const n = rng.int(4, 8);
        for (let i = 0; i < n; i++) {
          const x = cx + rng.range(-2.6, 2.6), z = cz + rng.range(-2.6, 2.6), cv = rng.range(0.75, 1.15);
          if (path.nearestXZ(x, z).dist < 5.6) continue;
          put(x, surfAt(x, z) - 0.1, z, rng.range(1.9, 3.6), tint.setRGB(cv, cv, cv));
        }
        t++;
      }
      // porcelain fungus: slimy white caps crowning the log mouth
      for (let i = 0; i < 14; i++) {
        const b = rng.range(-7, 7), sx = rng.range(0.4, 6);
        put(mouth.x + logT.x * sx + logB.x * b, mouth.y + Math.sqrt(LOG_R * LOG_R - b * b) - 0.3, mouth.z + logT.z * sx + logB.z * b, rng.range(2.4, 3.8), tint.setRGB(1.5, 1.75, 2.3), 0.45);
      }
      // (fifth round) troops standing on the bough's shoulders, between the beetle's lane and the flank, from a stream of
      // their own: the eye passes them at arm's length
      {
        const r5b = makeRng('spore-rain-fifth-b:' + ctx.seed), cap5 = k + 80;
        for (let d = dBR + 9; d < L - 12 && k < cap5; d += r5b.range(7, 11)) {
          const side = r5b.chance(0.5) ? 1 : -1, n = r5b.int(4, 7), lat0 = r5b.range(2.5, 3.2);
          for (let i = 0; i < n && k < cap5; i++) {
            const dd = d + r5b.range(-1.3, 1.3), lat = side * (lat0 + r5b.range(-0.35, 0.35)), cv = r5b.range(0.85, 1.2), sc = r5b.range(0.8, 1.7);
            path.posAtDist(dd, tmpV); path.tangentAtDist(dd, tmpT);
            const nx = -tmpT.z, nz = tmpT.x, nl = Math.hypot(nx, nz) || 1;
            E3.set(r5b.range(-0.25, 0.25), r5b.range(0, TAU), r5b.range(-0.25, 0.25));
            M4.compose(P3.set(tmpV.x + nx / nl * lat, tmpV.y - EYE - BR_R + Math.sqrt(BR_R * BR_R - lat * lat) - 0.08, tmpV.z + nz / nl * lat), Q4.setFromEuler(E3), S3.set(sc * 1.15, sc, sc * 1.15));
            bon.setMatrixAt(k, M4); bon.setColorAt(k, tint.setRGB(cv, cv * 0.97, cv * 0.9)); k++;
          }
        }
      }
      bon.count = k; bon.name = 'bonnets'; splitAlong(bon, 9, 230);
    }
    await ctx.yield();

    // ---- a troop of bonnets along every fallen twig (the brief: "troops of translucent striped bells 1.5 to 3 m tall on
    // hair stalks along every twig"). A troop is ragged, as bonnets grow: tufts of three to nine bells with bare wood
    // between them, standing on the twig's upper side and in the litter close along its flanks. The bells are the bells
    // of the bonnets above (the same shape, the same material), in meshes of their own; each twig's troop draws from a
    // stream of its own, so nothing laid before it moves. Every rule here is a rule of the ground: where the twig lies,
    // how near the route's line a bell may stand, where a named animal must stay in sight.
    const twigTroops = [];                             // one troop to a twig { near, mid, far, c, r }: the same bells in three weights of mesh
    const TROOP_NEAR = 12, TROOP_MID = 32, TROOP_OUT = 100;        // metres from the eye to the troop's nearest edge
    {
      const pale = col('#CDBFA6'), stalkC = col('#7E6B58');
      const stalkPts = [[0, 0, 0], [0.03, 0.3, 0.012], [0.05, 0.6, 0], [0.045, 0.87, -0.01]];
      // (flat: the hair stalk as one ribbon, for the weight that is only drawn beyond TROOP_MID m, where the stalk is a pixel wide)
      const stalkRibbon = (stalk) => gridGeo(1, 1, false, (u, v, o) => {
        const q = stalk[v > 0.5 ? stalk.length - 1 : 0], w = (u - 0.5) * 0.045 * (1 - 0.5 * v);
        o.p[0] = q[0] + w; o.p[1] = q[1]; o.p[2] = q[2] + w * 0.6;
        o.c[0] = stalkC.r; o.c[1] = stalkC.g; o.c[2] = stalkC.b; o.a[0] = v; o.a[1] = -1.5;
      });
      // (ring: where a lighter bell's rings stand on the same dome, 0 its crown and 1 its rim; none given, they are even)
      const bellGeo = (nu, nv, stalk, flat = false, ring = null) => mergeGeos([flat ? stalkRibbon(stalk) : limb(stalk, 0.02, stalkC, 0.5, true),
        lathe(nu, nv, (v0) => { const v = ring ? ring(v0) : v0; return [0.2 * Math.pow(v, 0.62) * (1 + 0.22 * v * v * v), 0.8 + 0.32 * (1 - Math.pow(v, 1.5))]; }, (u, v0, o, pr) => {
          const v = ring ? ring(v0) : v0;
          const stripe = Math.round(u * 9) % 2 ? 0.6 : 1, k = mixn(1, stripe, sstep(0.25, 1, v)) * (0.8 + 0.2 * v);
          const ap = 1 - sstep(0, 0.3, v);
          o.c[0] = mixn(pale.r * k, stalkC.r * 1.3, ap * 0.6); o.c[1] = mixn(pale.g * k, stalkC.g * 1.2, ap * 0.6); o.c[2] = mixn(pale.b * k, stalkC.b, ap * 0.6);
          o.a[0] = 1; o.a[1] = 1;
        })]);
      // The troops' rule of cost: three weights of one bell, each the same dome. At arm's length it is round, eighteen
      // sides in five rings on its jointed stalk (198 triangles). From TROOP_NEAR m it is the bonnets' own nine sides in
      // two rings on a straight three-sided stalk (42: it was 90); the rings stand at v squared, crowded to the crown
      // where the dome bends, and hold it as closely as four even ones did (both within 0.011 of the bell's unit). From
      // TROOP_MID m, in the mist, it is five sides in one ring on a ribbon (12: it was 14); the ring runs from a quarter
      // of the way down the dome to the rim, so the flank is the dome's own within 0.007 and the crown is left open (a
      // far bell is seen from beside, TROOP_MID m off and more: the opening is under a pixel). Past TROOP_OUT m nothing
      // is drawn. The distances are from the eye's place to the troop's nearest edge and hold for the whole flight.
      const gNear = bellGeo(18, 5, stalkPts), gMid = bellGeo(9, 2, [stalkPts[0], stalkPts[3]], false, (v) => v * v), gFar = bellGeo(5, 1, [stalkPts[0], stalkPts[3]], true, (v) => 0.25 + 0.75 * v);
      await ctx.yield();
      // (the last number: beyond TROOP_FAR m a bell has drawn down into its foot, so a troop comes out of the mist and never pops)
      const TROOP_FAR = 96;
      const bellMat = wmat(1, 1, { gloss: 0.5, sss: 0.95, fibre: 26, misc: [0.16, 0, 1, TROOP_FAR] });
      // (the route's own line, the bells' clearance from it and where a bell may stand, routeDist, BELL_CLEAR and bellOK,
      // are stated once, above the short twigs, which lie by them too)
      // Tufts per metre of twig: about 0.34 before any is left out (a tuft covers 1.3 to 2.6 m of twig and the bare wood
      // after it is 0.2 to 2.6 m, mostly short: so two thirds of a twig carries bells and a third is bare, which is
      // how a troop looks: ragged, but plainly following its wood). The visit's density closes or opens the gaps, as it sets the number of the troops above; the
      // graphics level leaves tufts out, by the share it takes from the twigs themselves.
      const keepK = mixn(0.6, 1, detail);
      const tP = new THREE.Vector3(), tT = new THREE.Vector3(), upV = new THREE.Vector3(), qY = new THREE.Quaternion(), tint = new THREE.Color();
      const stat = { twigs: twigLines.length, withTroops: 0, metres: 0, tufts: 0, bells: 0, within8: 0, nearest: 1e9, leftOutByRoute: 0, shortTwigs: twigLines.length - nLongTwigs, shortBells: 0, shortWithin8: 0, shortNearest: 1e9, shortList: [] };
      for (let ti = 0; ti < twigLines.length; ti++) {
        await ctx.yield();
        const tw = twigLines[ti], rt = makeRng('spore-rain-twig-troop:' + ti + ':' + ctx.seed);
        const curve = new THREE.CatmullRomCurve3(tw.pts, false, 'centripetal'), Lc = curve.getLength();
        const list = [];
        stat.metres += Lc;
        for (let s = rt.range(0.3, 2.4); s < Lc - 0.3;) {
          const n = rt.int(3, 9), half = 0.32 + 0.11 * n, mode = rt(), side = rt.chance(0.5) ? 1 : -1, keep = rt() < keepK, gap = rt();
          let stood = 0;
          for (let i = 0; i < n; i++) {
            // (every bell takes the same draws whether it stands or not: leaving one out moves no other)
            const al = ((i + rt.range(0.1, 0.9)) / n - 0.5) * 2 * half, pick = rt(), acr = rt(), hk = rt(), tilt = rt.range(0.05, 0.36), along = rt.range(-0.7, 0.7);
            const yaw = rt.range(0, TAU), cv = rt.range(0.78, 1.15), kx = rt.range(0.9, 1.4), kz = rt.range(0.9, 1.4), warm = rt.range(0.9, 1.05);
            if (!keep) continue;
            const t = clamp01((s + half + al) / Lc), rT = tw.r * (1 - 0.45 * t);
            curve.getPointAt(t, tP); curve.getTangentAt(t, tT);
            const hl = Math.hypot(tT.x, tT.z) || 1, ax = tT.x / hl, az = tT.z / hl, nx = -az, nz = ax;
            // on the twig's upper side, or in the litter along its flank: most within a metre of the wood, none beyond two
            const onTwig = mode < 0.45 || (mode > 0.8 && pick < 0.5);
            const off = onTwig ? (acr * 2 - 1) * 0.7 * rT : side * (rT + 0.2 + 1.8 * acr * acr), out = off < 0 ? -1 : 1;
            const x = tP.x + nx * off, z = tP.z + nz * off;
            const y = onTwig ? tP.y + Math.sqrt(Math.max(rT * rT - off * off, 0)) - 0.07 : surfAt(x, z) - 0.1;
            // 1.5 to 3 m tall; a tuft fans: each bell leans out from the twig and a little along it
            const h = 1.5 + 1.5 * hk, sc = h / 1.12;
            const lx = nx * out + ax * along, lz = nz * out + az * along, ll = Math.hypot(lx, lz) || 1;
            upV.set(lx / ll * Math.sin(tilt), Math.cos(tilt), lz / ll * Math.sin(tilt));
            if (!bellOK(x, z)) continue;
            const dFoot = routeDist(x, z), dCap = routeDist(x + upV.x * h, z + upV.z * h);
            if (dFoot < BELL_CLEAR || dCap < BELL_CLEAR) { stat.leftOutByRoute++; continue; }
            M4.compose(P3.set(x, y, z), Q4.setFromUnitVectors(UP, upV).multiply(qY.setFromAxisAngle(UP, yaw)), S3.set(sc * kx, sc, sc * kz));
            list.push({ m: M4.clone(), c: tint.setRGB(cv, cv, cv * warm).clone() });
            stood++; stat.bells++; if (dFoot < 8) stat.within8++; stat.nearest = Math.min(stat.nearest, dFoot, dCap);
            if (ti >= nLongTwigs) { stat.shortBells++; if (dFoot < 8) stat.shortWithin8++; stat.shortNearest = Math.min(stat.shortNearest, dFoot, dCap); }
          }
          if (stood) stat.tufts++;
          s += 2 * half + (0.2 + 2.4 * gap * gap) / dens;
        }
        if (ti >= nLongTwigs) {
          const mid = tw.pts[3], nn = path.nearestXZ(mid.x, mid.z);
          path.pointAt(nn.u, tmpV); path.tangentAt(nn.u, tmpT);
          stat.shortList.push({ u: nn.u, side: (mid.x - tmpV.x) * -tmpT.z + (mid.z - tmpV.z) * tmpT.x < 0 ? -1 : 1, near: Math.min(...tw.pts.map((q) => routeDist(q.x, q.z))), len: tw.len, bells: list.length });
        }
        if (!list.length) continue;
        stat.withTroops++;
        const near = instMesh(gNear, bellMat, list, 'twig-bonnets'), mid = instMesh(gMid, bellMat, list, 'twig-bonnets'), far = instMesh(gFar, bellMat, list, 'twig-bonnets');
        near.matrixAutoUpdate = mid.matrixAutoUpdate = far.matrixAutoUpdate = false;
        twigTroops.push({ near, mid, far, c: far.boundingSphere.center.clone(), r: far.boundingSphere.radius });
      }
      stat.nearest = stat.bells ? Math.round(stat.nearest * 100) / 100 : -1; stat.metres = Math.round(stat.metres);
      stat.shortNearest = stat.shortBells ? Math.round(stat.shortNearest * 100) / 100 : -1;
      scene.userData.twigTroops = stat;
    }
    await ctx.yield();

    // ---- fifth round, on the bough: what stands between the eye and the moss. Sulphur tuft in crowded tufts down both
    // shoulders (the first at the bough's head, where we step onto it), twigs with long copper buds, and beech seedlings
    // rooted in the moss cushions, two seed leaves and the first true pair. All from a fifth stream, all clear of the lane.
    {
      const r5 = makeRng('spore-rain-fifth:' + ctx.seed);
      const nrm = new THREE.Vector3(), right = new THREE.Vector3(), Tn = new THREE.Vector3(), ax = new THREE.Vector3();
      // a point on the bough's upper surface, lat metres right of its crest (P3), its normal in nrm, the track's heading in Tn
      const onB = (d, lat) => {
        path.posAtDist(d, tmpV); path.tangentAtDist(d, Tn); Tn.setY(0).normalize(); right.set(-Tn.z, 0, Tn.x);
        const up = Math.sqrt(Math.max(0.01, BR_R * BR_R - lat * lat));
        nrm.copy(right).multiplyScalar(lat / BR_R).addScaledVector(UP, up / BR_R).normalize();
        return P3.copy(tmpV).addScaledVector(right, lat).setY(tmpV.y - EYE - BR_R + up);
      };
      const sTop = col('#D6A02A'), sMid = col('#B55A1A'), sGill = col('#A9A866'), sStalk = col('#D3C283');
      const budC = col('#7E4320'), budTip = col('#C98A45'), twigC = col('#5E4630');
      const tuftAt = [[dBR + 1.5, -2.6, 10, 1.25], [dBR + 27, 2.8, 8, 0.9], [dBR + 46, -2.8, 9, 0.95], [dBR + 62, 2.9, 7, 0.8], [L - 22.5, -2.9, 8, 0.85]];
      for (const t of tuftAt) {
        const parts = [], size = t[3];
        onB(t[0], t[1]); const bx = P3.x, by = P3.y - 0.14, bz = P3.z, ox = nrm.x, oz = nrm.z;
        for (let i = 0; i < t[2]; i++) {
          const a = r5.range(0, TAU), q = Math.sqrt(r5()), young = i >= t[2] - 2;
          const H = (young ? r5.range(0.45, 0.7) : r5.range(1.0, 2.1) * (1 - 0.3 * q)) * size, R = (young ? r5.range(0.22, 0.3) : r5.range(0.42, 0.74)) * size;
          const lx = Math.cos(a) + ox * 0.7, lz = Math.sin(a) + oz * 0.7, ll = Math.hypot(lx, lz) || 1;
          const m = new THREE.Matrix4().makeRotationAxis(ax.set(lz / ll, 0, -lx / ll), 0.1 + 0.5 * q + r5.range(0, 0.12)).setPosition(bx + Math.cos(a) * q * 0.42 * size, by, bz + Math.sin(a) * q * 0.42 * size);
          shroom(parts, { H, R, sr: 0.07 * size + 0.05 * R, top: sTop.clone().multiplyScalar(r5.range(0.85, 1.12)), mid: sMid, gill: sGill, stalk: sStalk, ng: 10, dome: young ? r5.range(0.8, 1.0) : r5.range(0.42, 0.64), m, res: 12, sn: 7, sv: 5 });
        }
        await ctx.yield();
        // beside each tuft, a twig that kept its buds: long, sharp and copper, standing off it alternately
        for (let b = 0; b < 2; b++) {
          const h = r5.range(1.5, 2.3), dd = t[0] + (b ? 1 : -1) * r5.range(3.2, 5.5), lt = t[1] + r5.range(-0.25, 0.35) * Math.sign(t[1]);
          onB(dd, lt); const o = [nrm.x, nrm.z], yaw = r5.range(-0.5, 0.5);
          const fx = o[0] * Math.cos(yaw) + Tn.x * Math.sin(yaw), fz = o[1] * Math.cos(yaw) + Tn.z * Math.sin(yaw);
          const at = (f, up, sd) => [P3.x + fx * f * h + Tn.x * sd * h, P3.y - 0.1 + up * h, P3.z + fz * f * h + Tn.z * sd * h];
          const pts = [at(0, 0, 0), at(0.16, 0.36, 0.04), at(0.3, 0.66, -0.05), at(0.52, 0.98, 0.03)];
          parts.push(tubeR(pts, [0.085 * h, 0.06 * h, 0.045 * h, 0.03 * h], twigC, 5, 2, 0.8, 0.4));
          for (let j = 1; j < 4; j++) {
            const sd = j % 2 ? 1 : -1, bl = (j === 3 ? 0.62 : 0.5) * h, dir = j === 3 ? ax.set(fx * 0.5, 1, fz * 0.5) : ax.set(fx * 0.35 + Tn.x * sd * 0.8, 0.85, fz * 0.35 + Tn.z * sd * 0.8);
            Q4.setFromUnitVectors(UP, dir.normalize());
            const m = new THREE.Matrix4().compose(P3.set(pts[j][0], pts[j][1], pts[j][2]), Q4, S3.set(1, 1, 1));
            parts.push({ m, g: lathe(6, 5, (v) => [0.1 * bl * Math.sin(Math.PI * Math.pow(v, 0.62)) * (1 - 0.45 * v) + 0.008, bl * v], (u, v, q2) => {
              const k = (Math.floor(v * 7 + u * 2) % 2 ? 0.8 : 1.05) * (0.8 + 0.3 * v);
              q2.c[0] = mixn(budC.r, budTip.r, v * v) * k; q2.c[1] = mixn(budC.g, budTip.g, v * v) * k; q2.c[2] = mixn(budC.b, budTip.b, v * v) * k;
              q2.a[0] = 0.7 + 0.3 * v; q2.a[1] = 1.2;
            }) });
          }
        }
        const g = mergeGeos(parts); g.computeBoundingSphere();
        const m = addMesh(g, troopShared.mat, 'bough-tuft', true);
        lodChunks.push({ lo: m, hi: null, extra: null, c: g.boundingSphere.center.clone(), r: g.boundingSphere.radius, range: 105, sw: 0 });
        await ctx.yield();
      }
      // seedlings: a stalk, two broad seed leaves like a bow tie, the first true pair crosswise above them
      {
        const stC = col('#8A5A3C'), cot = col('#3F7A22'), cotE = col('#6E9A2E'), lf = col('#8FAA34');
        const sg = [tubeR([[0, -0.05, 0], [0.035, 0.45, 0.02], [0, 0.9, 0]], [0.042, 0.03, 0.028], stC, 5, 2, 1, 0.5, (u, v, o, tt) => { o.c[0] = mixn(stC.r, cot.r, tt * tt); o.c[1] = mixn(stC.g, cot.g, tt * tt); o.c[2] = mixn(stC.b, cot.b, tt * tt); o.a[0] = 0.4 + 0.45 * tt; o.a[1] = 0.5; })];
        for (const sx of [-1, 1]) {
          sg.push(gridGeo(6, 2, false, (u, v, o) => {
            const a = (u - 0.5) * 2.75, r = 0.5 * v * (1 - 0.1 * Math.cos(a * 2.2));
            o.p[0] = sx * (0.03 + Math.cos(a) * r); o.p[2] = Math.sin(a) * r; o.p[1] = 0.9 + 0.16 * v - 0.12 * v * v + 0.09 * Math.abs(Math.sin(a)) * v * v;
            const k = 0.75 + 0.3 * Math.cos(a * 6) * v * 0.3 + 0.25 * v;
            o.c[0] = mixn(cot.r, cotE.r, v * v) * k; o.c[1] = mixn(cot.g, cotE.g, v * v) * k; o.c[2] = mixn(cot.b, cotE.b, v * v) * k; o.a[0] = 0.86 + 0.14 * v; o.a[1] = 1.1;
          }));
          sg.push(gridGeo(4, 2, false, (u, v, o) => {
            const vv = (v - 0.5) * 2, wid = 0.15 * Math.sin(Math.PI * Math.pow(u, 0.75));
            o.p[2] = sx * (0.02 + 0.42 * u); o.p[0] = wid * vv; o.p[1] = 0.93 + 0.3 * u - 0.1 * u * u + 0.06 * Math.abs(vv) * Math.sin(Math.PI * u);
            const k = vv === 0 ? 0.78 : 1; o.c[0] = lf.r * k; o.c[1] = lf.g * k; o.c[2] = lf.b * k; o.a[0] = 0.92 + 0.08 * u; o.a[1] = 1.1;
          }));
        }
        const list = [];
        for (const ms of mossSpots) {
          if (ms[0] < dBR + 14 || ms[0] > L - 15) continue;
          const n = r5.int(3, 5);
          for (let i = 0; i < n; i++) {
            const d = ms[0] + r5.range(-0.5, 0.5) * ms[3], lat = ms[1] * Math.min(3.5, Math.max(2.5, ms[2] + r5.range(-0.4, 0.7))), sc = r5.range(0.8, 1.3), kc = r5.range(0.8, 1.2), warm = r5();
            onB(d, lat);
            Q4.setFromUnitVectors(UP, nrm.lerp(UP, 0.7).normalize()).multiply(tmpQ.setFromAxisAngle(UP, r5.range(0, TAU)));
            M4.compose(P3.setY(P3.y - 0.05), Q4, S3.set(sc, sc * r5.range(0.85, 1.1), sc));
            if (warm < 0.14 || late) tc.setRGB(1.5 * kc, 0.95 * kc, 0.6 * kc); else tc.setRGB(kc, kc, kc);
            list.push({ m: M4.clone(), c: tc.clone() });
          }
        }
        if (list.length) {
          const sm = instMesh(mergeGeos(sg), wmat(1, 1, { gloss: 0.5, sss: 0.9, fibre: 9, misc: [0.05, 0, 1, 0] }), list, 'seedlings');
          scene.remove(sm); splitAlong(sm, 12, 120);
        }
      }
    }
    await ctx.yield();

    // ---- hard fern and russet bracken, far off: arching fronds that are only shapes in the fog
    {
      // each frond is a filled blade: a band of leaf either side of the rib whose edge is cut into pinnae, widest a third
      // of the way up, arching over. No gaps between leaflets, so far off it is a feather shape and never a comb of stripes.
      const green = col('#3F7032'), V = [], NS = 14;
      for (let f = 0; f < 7; f++) {
        const yaw = f / 7 * TAU + rng.range(-0.3, 0.3), cy = Math.cos(yaw), sy = Math.sin(yaw), droop = rng.range(0.85, 1.25);
        let px = 0, py = 0; const sp = [];
        for (let i = 0; i <= NS; i++) { const t = i / NS, el = mixn(1.3, -0.55 * droop, t); sp.push([px, py, t, el]); px += Math.cos(el) / NS; py += Math.sin(el) / NS; }
        const wAt = (t) => 0.2 * Math.pow(Math.max(Math.sin(Math.PI * Math.min(1, t * 1.02 + 0.04)), 0), 0.55) * sstep(0.02, 0.14, t);
        const pt = (r, y, lat, k, a, g) => V.push(r * cy - sy * lat, y, r * sy + cy * lat, green.r * k, green.g * k, green.b * k, a, g);
        for (let i = 0; i < NS; i++) {
          const a = sp[i], b = sp[i + 1], t = (a[2] + b[2]) * 0.5, wa = wAt(a[2]), wb = wAt(b[2]), w = wAt(t);
          for (const sd of [-1, 1]) {
            // the band beside the rib (it sags a little away from the rib), then one pinna standing out of it, swept toward the tip
            const ya = a[1] - 0.12 * wa, yb = b[1] - 0.12 * wb, la = 0.42 * wa * sd, lb = 0.42 * wb * sd;
            pt(a[0], a[1], 0, 0.6, a[2], 0.4); pt(b[0], b[1], 0, 0.6, b[2], 0.4); pt(b[0], yb, lb, 0.86, b[2], 0.45);
            pt(a[0], a[1], 0, 0.6, a[2], 0.4); pt(b[0], yb, lb, 0.86, b[2], 0.45); pt(a[0], ya, la, 0.86, a[2], 0.45);
            const tx = mixn(a[0], b[0], 0.6) + Math.cos(a[3]) * w * 0.2, ty = mixn(a[1], b[1], 0.6) + Math.sin(a[3]) * w * 0.2 - 0.34 * w;
            pt(a[0], ya, la, 0.86, a[2], 0.45); pt(b[0], yb, lb, 0.86, b[2], 0.45); pt(tx, ty, w * sd, 1.22, t, 0.5);
          }
        }
      }
      await ctx.yield();
      const n = 34, ferns = new THREE.InstancedMesh(triGeo(V), wmat(1, 1, { gloss: 0.5, sss: 0.9, fibre: 30, misc: [1.6, 0, 1, 0] }), n);
      let k = 0;
      await ctx.yield();
      // nine stand close enough to be fronds and not shapes: 46 to 80 m out, arching over the moss
      for (let tries = 0; k < 9 && tries < 300; tries++) {
        const d = rx.range(30, L * 0.93), lat = (rx.chance(0.5) ? 1 : -1) * rx.range(46, 80), s = rx.range(34, 46), yawF = rx.range(0, TAU), kg = rx.range(0.9, 1.25);
        const [x, z] = beside(d, lat);
        if (Math.hypot(x, z) < 62 || path.nearestXZ(x, z).dist < 45 || cushionAt(x, z) > 0 || !tallOK(x, z, d, lat)) continue;
        if (z > 60 && Math.abs(x) < 16 + (430 - z) * 0.27) continue;
        if (lat > 0 && d > dSnail - 70 && d < dSnail + 60) continue;
        if (troop.some((t) => Math.hypot(t.x - x, t.z - z) < 30) || beeches.some((t) => Math.hypot(t[0] - x, t[1] - z) < t[2] * 1.6 + 20)) continue;
        M4.compose(P3.set(x, heightAt(x, z) - 1, z), Q4.setFromAxisAngle(UP, yawF), S3.set(s, s, s));
        ferns.setMatrixAt(k, M4); ferns.setColorAt(k, tc.setRGB(1, kg, 1)); k++;
      }
      await ctx.yield();
      for (let tries = 0; k < n - 3 && tries < 300; tries++) {
        const d = rng.range(-20, L * 0.95), side = (rng.chance(0.5) ? 1 : -1) * rng.range(75, 190);
        const [x, z] = beside(d, side);
        if (Math.hypot(x, z) < 70 || path.nearestXZ(x, z).dist < 70) continue;
        const bracken = rng.chance(0.4), s = rng.range(36, 52);
        M4.compose(P3.set(x, heightAt(x, z) - 1, z), Q4.setFromAxisAngle(UP, rng.range(0, TAU)), S3.set(s, s * (bracken ? 0.6 : 1), s));
        ferns.setMatrixAt(k, M4); ferns.setColorAt(k, bracken ? tc.setRGB(3.4, 1.0, 0.5) : tc.setRGB(1, rng.range(0.9, 1.2), 1)); k++;
      }
      for (const e of [[36, 46, 40, 0], [70, -66, 42, 1], [120, 6, 50, 0]]) {
        if (k >= n) break;
        const x = exit.x + outDir.x * e[0] - outDir.z * e[1], z = exit.z + outDir.z * e[0] + outDir.x * e[1];
        M4.compose(P3.set(x, heightAt(x, z) - 1, z), Q4.setFromAxisAngle(UP, e[0]), S3.set(e[2], e[2] * (e[3] ? 0.6 : 1), e[2]));
        ferns.setMatrixAt(k, M4); ferns.setColorAt(k, e[3] ? tc.setRGB(3.4, 1.0, 0.5) : tc.setRGB(1, 1.1, 1)); k++;
      }
      await ctx.yield();
      for (let i = 0; i < k; i++) { ferns.getMatrixAt(i, M4); if (greatTrunks.some((t) => Math.hypot(M4.elements[12] - t[0], M4.elements[14] - t[1]) < t[2] * 1.5 + 12)) { const fx = M4.elements[12], fy = M4.elements[13], fz = M4.elements[14]; ferns.setMatrixAt(i, M4.makeScale(0, 0, 0).setPosition(fx, fy, fz)); } }
      ferns.count = k; ferns.name = 'ferns'; splitAlong(ferns, 5, 900, null, 3);
    }
    await ctx.yield();

    // ---- the banded snail on its moss rise (a leopard slug at night)
    const slug = snailMorph === 'slug';
    const snail = new THREE.Group(); snail.name = 'snail';
    const snailDir = new THREE.Vector3();
    const stalks = [];
    {
      const [sx, sz] = beside(dSnail, 12.5);
      path.posAtDist(dSnail - 7, tmpV);
      snailDir.set(tmpV.x - sx, 0, tmpV.z - sz).normalize();
      snail.position.set(sx, surfAt(sx, sz) - 0.08, sz); snail.rotation.y = Math.atan2(snailDir.x, snailDir.z);
      const skin = slug ? col('#6E5E4C') : col('#8E866F'), darkS = col('#2A241C'), pale = col('#B9B29A');
      const bodyW = (t) => 0.95 * Math.pow(Math.sin(Math.PI * (0.02 + 0.92 * Math.pow(t, 0.75))), 0.55);
      const Z0 = slug ? -5.6 : -4.0, Z1 = 3.5;
      const parts = [gridGeo(14, 26, true, (u, v, o) => {
        const a = u * TAU, sa = Math.sin(a), ca = Math.cos(a), t = v, z = mixn(Z0, Z1, t);
        const w = bodyW(t), hg = (0.3 + 0.75 * sstep(0.05, 0.4, t)) * (1 - 0.25 * sstep(0.75, 1, t)) * (slug ? 1.15 : 1), lift = Math.pow(sstep(0.7, 1, t), 1.5) * 1.0;
        o.p[0] = w * ca * (sa < 0 ? 1.14 : 1); o.p[1] = lift + hg * (sa > 0 ? sa : 0.15 * sa) + 0.03; o.p[2] = z;
        const tub = noise.n3(ca * 3, z * 2.2, sa * 3) * 0.5 + 0.5, spot = slug ? sstep(0.55, 0.7, noise.n3(ca * 1.6 + 5, z * 0.9, sa * 1.6) * 0.5 + 0.5) * (sa > -0.1 ? 1 : 0) : 0;
        const stripe = sa > 0.6 && !slug ? 0.35 * sstep(0.6, 0.95, sa) : 0;
        const k = (0.7 + 0.4 * tub) * (1 - stripe) * (1 - 0.75 * spot), fr = sa < 0 ? 1 : 0;
        o.c[0] = mixn(skin.r * k, pale.r, fr * 0.5); o.c[1] = mixn(skin.g * k, pale.g, fr * 0.5); o.c[2] = mixn(skin.b * k, pale.b, fr * 0.5);
        o.a[0] = sa < 0 ? 0.45 : 0.7 + 0.3 * sa; o.a[1] = 1.7;
      })];
      const headY = 1.0 + 0.6, headZ = Z1 - 0.35;
      for (const sd of [-1, 1]) parts.push(limb([[sd * 0.3, headY - 0.5, headZ], [sd * 0.42, headY - 0.62, headZ + 0.3], [sd * 0.5, headY - 0.78, headZ + 0.52]], 0.09, skin, 0, false));
      const body = new THREE.Mesh(mergeGeos(parts), wmat(1, 3, { gloss: 1, sss: 0.3, fibre: 5 }));
      body.frustumCulled = false; snail.add(body);
      const stalkMat = wmat(1, 0, { gloss: 1, sss: 0.3, fibre: 6 });
      for (const sd of [-1, 1]) {
        const g = mergeGeos([limb([[0, 0, 0], [0, 0.45, 0], [0, 0.9, 0], [0, 1.35, 0], [0, 1.72, 0]], 0.15, skin, 1.6, false),
          blob([0, 1.78, 0], [0.13, 0.13, 0.13], darkS, 6, 4, 1, 2.5)]);
        const m = new THREE.Mesh(g, stalkMat); m.position.set(sd * 0.3, headY - 0.12, headZ - 0.25); m.frustumCulled = false;
        snail.add(m); stalks.push({ m, sd, base: new THREE.Vector3(sd * 0.5, 0.72, 0.5).normalize() });
      }
      if (!slug) {
        const base = snailMorph === 'pink' ? col('#D49A86') : snailMorph === 'brown' ? col('#C08A3C') : col('#E6C63E');
        const turns = 3.1, rhoE = 0.97, kk = 0.1255, angE = Math.PI / 2 + 0.5;
        const shellGeo = gridGeo(18, 92, true, (u, v, o) => {
          const tau = v, back = (1 - tau) * turns * TAU, ang = angE - back, rho = rhoE * Math.exp(-kk * back);
          const a = 0.9 * rho * (1 + 0.07 * sstep(0.975, 1, tau)), ph = u * TAU, cp = Math.cos(ph), spn = Math.sin(ph);
          const ry = Math.cos(ang), rz = Math.sin(ang);
          o.p[0] = 0.62 * (rhoE - rho) + a * spn; o.p[1] = (rho + a * cp) * ry; o.p[2] = (rho + a * cp) * rz;
          const lipK = 1 - 0.55 * sstep(0.985, 1, tau);
          o.c[0] = base.r * lipK; o.c[1] = base.g * lipK; o.c[2] = base.b * lipK;
          o.a[0] = (u + 0.5) % 1; o.a[1] = tau * 3;
        });
        const shell = new THREE.Mesh(shellGeo, wmat(3, 0, { gloss: 1, variant: 0, misc: [0, 0, snailMorph === 'pink' ? 0 : snailMorph === 'brown' ? 0.6 : 1, 0] }));
        shell.frustumCulled = false;
        const pivot = new THREE.Group(); pivot.position.set(-0.25, 1.92, -0.5); pivot.add(shell); snail.add(pivot); snail.userData.pivot = pivot;
      }
      scene.add(snail);
      // the slime trail it has laid, glinting
      const wetC = col('#2B2A22');
      statics.push(gridGeo(1, 18, false, (u, v, o) => {
        const back = 3.2 + v * 36, lat = 2.2 * Math.sin(v * 2.4) + (u - 0.5) * 1.5;
        const x = sx - snailDir.x * back + snailDir.z * lat, z = sz - snailDir.z * back - snailDir.x * lat;
        o.p[0] = x; o.p[1] = surfAt(x, z) + 0.09; o.p[2] = z;
        o.c[0] = wetC.r; o.c[1] = wetC.g; o.c[2] = wetC.b; o.a[0] = 1; o.a[1] = 3.2;
      }));
    }
    await ctx.yield();

    // ---- three snake millipedes nose to tail up the bank (some visits: pill millipedes that roll up as we pass)
    const milli = { nM: pills ? 5 : 3, nSeg: pills ? 11 : 30, segLen: 0.3, gap: pills ? 6.5 : 0.7 };
    {
      const white = col('#E6E2D6'), rimC = pills ? col('#9A8460') : col('#6E7890');
      const R = pills ? 0.62 : 0.46, SL = pills ? 0.42 : milli.segLen; milli.segLen = SL; milli.R = R;
      // A pill millipede is armour: each ring is a plate arched over the back and down the flanks, wider and higher at
      // its hind margin than at its front, so that every plate stands a step proud of the one behind it (walking, a
      // plate laps the next by two fifths; rolled into a ball the plates draw apart and still lap). The belly beneath is
      // flat and matt. The plate's own pattern (slate, the buff hind margin, the dark line before it) is drawn in the
      // cuticle shader from the plate's own coordinates: milli.plate is its length. (A snake millipede's ring is as long
      // as the ring is: its length goes to the same place, for the sky highlight each ring carries.)
      milli.plate = pills ? 0.8 : SL * 1.12;
      // the ring's outline at u round it (the plate wraps down the flanks and in under them, to 60 degrees below the
      // flank's widest line: rolled up, the flanks of the plates close the ball's two sides; a narrow belly closes the ring;
      // sixteen points round it, thirteen of them the plate's)
      const sect = (u, k, p) => {
        const a = u * TAU - 0.9817, sa = Math.sin(a), ca = Math.cos(a), back = u * 16 < 13.01 || u > 0.999, kk = back ? k : 0.84;
        p[0] = Math.sign(ca) * Math.pow(Math.abs(ca), 0.8) * R * 1.25 * kk;
        p[1] = sa >= 0 ? Math.pow(sa, 0.9) * R * kk : sa * R * (back ? 0.75 * kk : 0.6);
        return back ? Math.max(sa, 0) : -1;
      };
      // the animal's two ends are closed by low domes, its head and its tail shield (a mesh of their own: two to an
      // animal, each riding its end plate)
      const dome = (z0, dz, k) => gridGeo(16, 2, true, (u, v, o) => {
        const f = Math.cos(v * Math.PI * 0.5), s = sect(u, k, o.p);
        o.p[0] *= f; o.p[1] = 0.12 * R + (o.p[1] - 0.12 * R) * f; o.p[2] = z0 + dz * Math.sin(v * Math.PI * 0.5);
        o.c[0] = rimC.r; o.c[1] = rimC.g; o.c[2] = rimC.b;
        o.a[0] = s < 0 ? 0.5 : 0.62 + 0.2 * s; o.a[1] = s < 0 ? 0.1 : 0.75;
      });
      const parts = pills ? [gridGeo(16, 3, true, (u, v, o) => {
        const s = sect(u, 1.08 - 0.22 * v + 0.04 * Math.sin(Math.PI * v), o.p);
        o.p[2] = (v - 0.5) * milli.plate;
        o.c[0] = rimC.r; o.c[1] = rimC.g; o.c[2] = rimC.b;
        o.a[0] = s < 0 ? 0.5 : 0.72 + 0.28 * s; o.a[1] = s < 0 ? 0.1 : 1;
      })] : [gridGeo(9, 3, true, (u, v, o) => {
        const a = u * TAU, r = R * (1 + 0.06 * Math.sin(v * Math.PI)) * (v > 0.99 ? 0.93 : 1);
        o.p[0] = Math.cos(a) * r; o.p[1] = Math.sin(a) * r * (Math.sin(a) < 0 ? 0.7 : 1); o.p[2] = (v - 0.5) * SL * 1.12;
        const k = v > 0.7 ? 1 : 0;
        o.c[0] = rimC.r; o.c[1] = rimC.g; o.c[2] = rimC.b;
        o.a[0] = 0.6 + 0.4 * Math.max(Math.sin(a), 0); o.a[1] = k ? 0.9 : 0.12;      // cuticle (FK 7): black, with a pale sheen on each ring's hind edge
      })];
      for (const sd of [-1, 1]) for (const lz of [-0.08, 0.08]) {
        const g = limb([[sd * R * 0.55, -R * 0.45, lz], [sd * R * 1.25, -R * 0.42, lz], [sd * R * 1.5, -R * 1.02, lz]], 0.05, white, lz > 0 ? 0.35 : 0);
        const ax = g.attributes.aux.array; for (let i = 0; i < ax.length; i += 2) ax[i] = Math.pow(ax[i], 0.7);
        parts.push(g);
      }
      const n = milli.nM * milli.nSeg;
      milli.mesh = new THREE.InstancedMesh(mergeGeos(parts), wmat(7, 2, { fibre: 9, variant: pills ? 3 : 0, misc: [0.15, 0, 0.55, milli.plate] }), n);
      if (pills) {
        // its own variant of the cuticle shader (made here, in build): each plate carries how far the animal is rolled
        // up and two random numbers of its own in its instance colour (a stream of its own, from the world's seed)
        milli.mesh.material.defines.PILL = 1;
        const rp = makeRng('spore-rain-pill:' + ctx.seed), tc9 = new THREE.Color();
        milli.tint = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { milli.tint[i * 2] = rp(); milli.tint[i * 2 + 1] = rp(); milli.mesh.setColorAt(i, tc9.setRGB(0, milli.tint[i * 2], milli.tint[i * 2 + 1])); }
        milli.caps = new THREE.InstancedMesh(mergeGeos([dome(-0.5 * milli.plate, -0.3, 1.05), dome(0.5 * milli.plate, 0.3, 0.85)]), milli.mesh.material, milli.nM * 2);
        for (let i = 0; i < milli.nM * 2; i++) milli.caps.setColorAt(i, tc9.setRGB(0, rp(), rp()));
        milli.caps.renderOrder = 20; milli.caps.frustumCulled = false; milli.caps.name = 'millipede-ends'; scene.add(milli.caps);
      } else {
        // the snake millipedes' variant of the cuticle shader: the sky highlight ring by ring
        milli.mesh.material.defines.SNAKE = 1;
      }
      // they walk inside the parasol's light shaft, whose glow is added over whatever stands in it: drawn after the
      // shaft, they stay black and glossy and are not washed to the shaft's colour
      milli.mesh.material.transparent = true; milli.mesh.renderOrder = 20;
      milli.mesh.frustumCulled = false; milli.mesh.name = 'millipedes'; scene.add(milli.mesh);
      // their route: 5 m right of the track (clear of the mount's fore leg), sampled every half metre
      milli.uMid = (U_BANK + U_CREST) * 0.5 + 0.004;
      milli.s0 = Math.max(10, milli.uMid * L - 3 * DUR * milli.uMid - 40); milli.s1 = milli.uMid * L + 3 * DUR * (1 - milli.uMid) + 20;
      const ns = Math.ceil((milli.s1 - milli.s0) / 0.5) + 1; milli.ns = ns; milli.route = new Float32Array(ns * 3);
      for (let i = 0; i < ns; i++) {
        const [x, z] = beside(milli.s0 + i * 0.5, pills ? 5.4 : 5.0);
        milli.route[i * 3] = x; milli.route[i * 3 + 1] = surfAt(x, z) + R * 0.98; milli.route[i * 3 + 2] = z;
      }
    }
    await ctx.yield();

    // ---- red wood ants filing over the arched twig with bud scales held high
    const ants = { n: 14, len: antCurve.getLength() }; ants.n = Math.max(14, Math.round(ants.len / 2.6)); ants.gap = ants.len / ants.n;
    {
      const red = col('#8E2F14'), dark = col('#1C1210'), tan = col('#C9A86A');
      const parts = [blob([0, 0.02, -0.4], [0.2, 0.19, 0.27], dark, 8, 5, 1, 2), blob([0, 0.0, -0.02], [0.11, 0.11, 0.2], red, 7, 4, 1, 1.4), blob([0, 0.06, 0.3], [0.15, 0.13, 0.15], red, 7, 4, 1, 1.6)];
      for (let l = 0; l < 6; l++) {
        const sd = l % 2 ? 1 : -1, lz = [-0.12, 0.0, 0.12][l >> 1], fz = [-0.42, 0.0, 0.4][l >> 1];
        parts.push(limb([[sd * 0.08, -0.03, lz], [sd * 0.3, 0.1, lz + fz * 0.5], [sd * 0.46, -0.3, lz + fz]], 0.03, dark, ((l >> 1) + (l % 2)) % 2));
      }
      for (const sd of [-1, 1]) parts.push(limb([[sd * 0.07, 0.12, 0.4], [sd * 0.16, 0.24, 0.55], [sd * 0.2, 0.16, 0.74]], 0.018, dark, 0.5, false));
      // the load: a bud scale gripped in the jaws and held above the head
      parts.push(gridGeo(4, 3, false, (u, v, o) => {
        const w = 0.2 * Math.sin(Math.PI * (0.1 + 0.85 * v));
        o.p[0] = (u - 0.5) * 2 * w; o.p[1] = 0.12 + 0.75 * v + 0.12 * Math.pow(Math.abs(u - 0.5) * 2, 2); o.p[2] = 0.46 + 0.3 * v - 0.25 * v * v;
        o.c[0] = tan.r * (0.8 + 0.3 * v); o.c[1] = tan.g * (0.8 + 0.3 * v); o.c[2] = tan.b; o.a[0] = 1; o.a[1] = 0.8;
      }));
      ants.mesh = new THREE.InstancedMesh(mergeGeos(parts), wmat(1, 2, { gloss: 0.9, sss: 0.25, fibre: 20, misc: [0.11, 0, 1.9, 0] }), ants.n);
      ants.mesh.frustumCulled = false; ants.mesh.name = 'ants'; scene.add(ants.mesh);
      lodChunks.push({ lo: ants.mesh, hi: null, extra: null, c: antPts[3].clone(), r: 22, range: 210, sw: 0 });
    }
    await ctx.yield();

    // ---- springtails grazing on the leaves, firing off in tumbling arcs as the beetle arrives
    const spring = { n: Math.max(40, Math.round(60 * dens)) };
    {
      const slate = col('#6C7090'), pale = col('#A9ACC4');
      const parts = [blob([0, 0, 0], [0.15, 0.17, 0.42], slate, 7, 4, 1, 2.2), blob([0, 0.04, 0.5], [0.13, 0.13, 0.15], pale, 5, 3, 1, 2)];
      for (const sd of [-1, 1]) {
        parts.push(limb([[sd * 0.06, 0.1, 0.6], [sd * 0.18, 0.26, 0.82], [sd * 0.24, 0.2, 1.08]], 0.03, slate, 0.6, false));
        for (let l = 0; l < 3; l++) parts.push(limb([[sd * 0.1, -0.06, -0.2 + l * 0.22], [sd * 0.34, -0.24, -0.2 + l * 0.26]], 0.035, slate, (l + (sd > 0 ? 1 : 0)) % 2));
      }
      parts.push(limb([[0, -0.1, -0.36], [0, -0.2, -0.1], [0, -0.22, 0.14]], 0.04, pale, 0.4, false));
      spring.mesh = new THREE.InstancedMesh(mergeGeos(parts), wmat(1, 2, { gloss: 1, fibre: 16, misc: [0.05, 0, 2.7, 0] }), spring.n);
      spring.mesh.frustumCulled = false; spring.mesh.name = 'springtails'; scene.add(spring.mesh);
      spring.d = new Float32Array(spring.n * 8);
      for (let i = 0; i < spring.n; i++) {
        const d = i < spring.n * 0.45 ? rng.range(18, L * 0.2) : rng.range(L * 0.2, L * U_BANK), sd = rng.chance(0.5) ? 1 : -1;
        const [x, z] = beside(d, sd * rng.range(3.3, 6.5)), ang = rng.range(0.35, 1.1) * sd;
        path.tangentAtDist(d, tmpT); const tl = Math.hypot(tmpT.x, tmpT.z) || 1, fx = tmpT.x / tl, fz = tmpT.z / tl;
        const dx = fx * Math.cos(ang) - fz * Math.sin(ang), dz = fz * Math.cos(ang) + fx * Math.sin(ang), reach = rng.range(12, 17);
        spring.d.set([x, surfAt(x, z) + 0.3, z, dx * reach, surfAt(x + dx * reach, z + dz * reach) + 0.3, dz * reach, d - rng.range(8, 13), rng.range(0, TAU)], i * 8);
      }
      // in the order the beetle meets them, so that update() can draw only the ones near the eye
      const recs = []; for (let i = 0; i < spring.n; i++) recs.push(Array.from(spring.d.subarray(i * 8, i * 8 + 8)));
      recs.sort((a, b) => a[6] - b[6]); recs.forEach((r, i) => spring.d.set(r, i * 8));
    }
    await ctx.yield();
    // ---- one red velvet mite, out because it rained: it walks the flank of its pale moss dome nearest the track, so
    // the eye sees scarlet on pale green
    const mite = {};
    {
      const sc = col('#D8281C'), dk = col('#8E1410');
      const parts = [blob([0, 0, -0.06], [0.31, 0.23, 0.38], sc, 12, 8, 1, 0.5), blob([0, -0.02, 0.32], [0.16, 0.13, 0.15], sc, 8, 5, 1, 0.5)];
      { // velvet: the body is furrowed and dimpled
        const p = parts[0].attributes.position.array;
        for (let i = 0; i < p.length; i += 3) { const k = 1 + 0.06 * noise.n3(p[i] * 9, p[i + 1] * 9, p[i + 2] * 9) - 0.05 * Math.exp(-Math.pow(p[i] / 0.05, 2)) * (p[i + 1] > 0 ? 1 : 0); p[i] *= k; p[i + 1] *= k; }
        parts[0].computeVertexNormals();
      }
      for (let l = 0; l < 8; l++) {
        const sd = l % 2 ? 1 : -1, r = l >> 1, fz = [0.5, 0.2, -0.15, -0.45][r], ph = (r + (l % 2)) % 2;
        parts.push(tubeR([[sd * 0.16, -0.05, fz * 0.4], [sd * 0.4, 0.08, fz * 0.9], [sd * 0.56, -0.24, fz * 1.25]], [0.045, 0.035, 0.02], dk, 5, 2, 1, 1, (u, v, o, t) => { o.a[0] = t; o.a[1] = -(1 + ph); }));
      }
      mite.mesh = new THREE.Mesh(mergeGeos(parts), wmat(1, 2, { gloss: 0.35, sss: 0.3, fibre: 30, misc: [0.1, 0, 0, 0] }));
      mite.mesh.frustumCulled = false; mite.mesh.name = 'mite'; scene.add(mite.mesh);
      mite.cx = mitePt[0]; mite.cz = mitePt[1];
    }
    await ctx.yield();
    // ---- fungus gnats dancing in the shaft and at the log mouth
    {
      const dk = col('#1B1712'), wing = col('#C9D4C2'), V = [];
      // each wing an oval fan from its root, smoky and thin (never a bright card when one passes close to the eye)
      const wo = [[0.05, 0.075], [0.16, 0.105], [0.28, 0.07], [0.345, -0.02], [0.29, -0.1], [0.16, -0.115], [0.05, -0.06]];
      for (const sd of [-1, 1]) for (let i = 0; i + 1 < wo.length; i++) {
        const a = wo[i], b = wo[i + 1], ka = 0.2 + 0.2 * a[0], kb = 0.2 + 0.2 * b[0];
        V.push(sd * 0.03, 0.04, 0, wing.r * 0.18, wing.g * 0.18, wing.b * 0.18, 0, -1, sd * a[0], 0.04 + 0.06 * a[0], a[1], wing.r * ka, wing.g * ka, wing.b * ka, a[0] / 0.345, -1, sd * b[0], 0.04 + 0.06 * b[0], b[1], wing.r * kb, wing.g * kb, wing.b * kb, b[0] / 0.345, -1);
      }
      const parts = [triGeo(V), blob([0, 0, 0], [0.055, 0.055, 0.2], dk, 5, 3, 1, 1), limb([[0, -0.03, 0.05], [0.05, -0.2, 0.0], [0.03, -0.38, -0.1]], 0.02, dk, 0.4, false), limb([[0, -0.03, -0.05], [-0.05, -0.2, -0.1], [-0.03, -0.36, -0.2]], 0.02, dk, 0.4, false)];
      const n = 90, gn = new THREE.InstancedMesh(mergeGeos(parts), wmat(1, 4, { gloss: 0.8, sss: 0.9, fibre: 20 }), n);
      for (let i = 0; i < n; i++) {
        if (i < 54) P3.set(rng.range(-24, -13.5), rng.range(2.5, 10), rng.range(-2, 27));
        else { const b = (rng.chance(0.5) ? 1 : -1) * rng.range(3.6, 6.8), sx = rng.range(-16, 1.5); P3.copy(mouth).addScaledVector(logT, sx).addScaledVector(logB, b).setY(mouth.y + rng.range(-2.5, 5)); }
        const s = rng.range(0.8, 1.15);
        // THE GNATS KEEP CLEAR OF THE FLOWN LINE. Each dances by a hash of its number inside a box round its dealt centre
        // (W_VERT, VK 4: 0.8 to 2.4 m to each side, 1.5 m up and down). Where that box, with the gnat's body (0.6 m of
        // its size), comes within CLEAR_AIR of the line, the centre is moved straight away from the line's nearest
        // point, in plan, until the box clears it. No gnat is taken out and no draw is taken.
        {
          const ax = 0.8 + 1.6 * ((i * 0.137 + 0.6) % 1), az = 0.8 + 1.6 * ((i * 0.371 + 0.2) % 1), need = CLEAR_AIR + 0.6 * s;
          const box2 = (j) => { const ex = Math.max(Math.abs(lineP[j] - P3.x) - ax, 0), ey = Math.max(Math.abs(lineP[j + 1] - P3.y) - 1.5, 0), ez = Math.max(Math.abs(lineP[j + 2] - P3.z) - az, 0); return ex * ex + ey * ey + ez * ez; };
          for (let it = 0; it < 60; it++) {
            nearLine(box2, need);
            const bd = Math.sqrt(nearD2); if (bd >= need) break;
            let bx = P3.x - lineP[nearJ], bz = P3.z - lineP[nearJ + 2];
            let h = Math.hypot(bx, bz); if (h < 1e-3) { bx = logB.x; bz = logB.z; h = Math.hypot(bx, bz); }
            P3.x += bx / h * (need - bd + 0.05); P3.z += bz / h * (need - bd + 0.05);
          }
        }
        M4.compose(P3, Q4.setFromAxisAngle(UP, rng.range(0, TAU)), S3.set(s, s, s)); gn.setMatrixAt(i, M4);
      }
      gn.frustumCulled = false; gn.name = 'gnats'; scene.add(gn);
    }
    await ctx.yield();
    // ---- rare: the brown hill beside the agaric arc is a common toad
    const toad = rare ? {} : null;
    if (toad) {
      const dToad = toadD, [tx, tz] = toadXZ, ty = surfAt(tx, tz) - 0.15;
      path.posAtDist(dToad - 30, tmpV);
      const g = new THREE.Group(); g.position.set(tx, ty, tz); g.rotation.y = Math.atan2(tmpV.x - tx, tmpV.z - tz);
      const brown = col('#644828'), belly = col('#BCA97C'), gold = col('#D9962A'), blk = col('#0A0806');
      const warty = (geo, amp, sc2) => { const p = geo.attributes.position.array, c = geo.attributes.aCol.array; for (let i = 0; i < p.length; i += 3) { const w = noise.n3(p[i] * sc2, p[i + 1] * sc2, p[i + 2] * sc2), w2 = noise.n3(p[i] * sc2 * 3 + 9, p[i + 1] * sc2 * 3, p[i + 2] * sc2 * 3); const k = 0.75 + 0.3 * w + 0.2 * w2, low = sstep(4.5, 1.5, p[i + 1]); p[i + 1] += amp * Math.max(w2, 0); c[i] = mixn(c[i] * k, belly.r, low * 0.7); c[i + 1] = mixn(c[i + 1] * k, belly.g, low * 0.7); c[i + 2] = mixn(c[i + 2] * k, belly.b, low * 0.7); if (p[i + 1] < 0.1) p[i + 1] = 0.1; } geo.computeVertexNormals(); return geo; };
      const parts = [warty(blob([0, 5.0, -1], [8.6, 6.2, 10.4], brown, 22, 14, 1, 1), 0.5, 0.35), warty(blob([0, 6.3, 8.6], [5.6, 3.7, 5.2], brown, 16, 10, 1, 1), 0.3, 0.45),
        warty(blob([7.4, 3.4, -4.5], [3.8, 4.4, 6.2], brown, 10, 7, 1, 1), 0.4, 0.4), warty(blob([-7.4, 3.4, -4.5], [3.8, 4.4, 6.2], brown, 10, 7, 1, 1), 0.4, 0.4)];
      for (const sd of [-1, 1]) {
        parts.push(warty(blob([sd * 3.4, 9.3, 8.0], [1.9, 1.7, 2.1], brown, 8, 6, 1, 1), 0.1, 0.6));
        parts.push(blob([sd * 3.9, 9.6, 8.5], [1.35, 1.3, 1.35], gold, 10, 7, 1, 3), blob([sd * 4.75, 9.6, 9.2], [0.55, 0.42, 0.95], blk, 6, 4, 1, 3));
        parts.push(limb([[sd * 5.6, 4.6, 6.2], [sd * 7.6, 2.6, 8.4], [sd * 6.8, 0.5, 10.6], [sd * 7.4, 0.3, 12.6]], 1.5, brown, 1, false));
      }
      const tm = wmat(1, 0, { gloss: 0.42, fibre: 1.1, variant: 1 });       // variant 1: warts in tone and relief
      const body = new THREE.Mesh(mergeGeos(parts), tm); body.frustumCulled = false; g.add(body);
      toad.throat = new THREE.Mesh(blob([0, 0, 0], [3.9, 2.4, 3.3], belly, 12, 8, 1, 1.4), tm); toad.throat.position.set(0, 3.5, 11.2); toad.throat.frustumCulled = false; g.add(toad.throat);
      toad.lids = [];
      for (const sd of [-1, 1]) {
        const lid = new THREE.Mesh(gridGeo(10, 5, false, (u, v, o) => { const a = (u - 0.5) * 2.6, b = v * 1.5; o.p[0] = 1.5 * Math.sin(a) * Math.cos(b * 0.6); o.p[1] = 1.5 * Math.cos(a) * Math.cos(b - 0.2); o.p[2] = 1.5 * Math.sin(b - 0.2); o.c[0] = brown.r; o.c[1] = brown.g; o.c[2] = brown.b; o.a[0] = 1; o.a[1] = 1; }), tm);
        lid.position.set(sd * 3.9, 9.6, 8.5); lid.rotation.y = sd * 0.6; lid.frustumCulled = false; g.add(lid); toad.lids.push(lid);
      }
      g.name = 'toad'; toad.group = g; toad.u = (dToad - 16) / L; toad.back = new THREE.Vector3(tx, ty + 11.4, tz); scene.add(g);
    }
    await ctx.yield();
    // soft contact shade baked into the floor under caps, puffballs, the snail, the branch and the log
    {
      const occ = [];
      for (const a of agarics) occ.push([a.x, a.z, a.R * 1.05 + 1, a.age < 0.2 ? 0.5 : 0.34], [a.x, a.z, 3.2, 0.4]);
      for (const p of puffballs) occ.push([p.x, p.z, p.R + 2.2, 0.5]);
      for (const t of troop) occ.push([t.x, t.z, t.R * 1.05 + 1, 0.34], [t.x, t.z, 3.4, 0.42]);
      occ.push([snail.position.x, snail.position.z, 5.5, 0.4]);
      if (toad) occ.push([toad.back.x, toad.back.z, 17, 0.5]);
      for (const e of extraOcc) occ.push(e);
      for (const t of greatTrunks) occ.push([t[0], t[1], t[2] * 1.9, 0.42]);
      for (let i = 2; i < root.pts.length - 2; i++) occ.push([root.pts[i].x, root.pts[i].z, 6, 0.45]);
      const ps = floorGeo.attributes.position.array, ax = floorGeo.attributes.aux.array;
      for (let i = 0; i < ax.length / 2; i++) {
        if ((i & 127) === 0) await ctx.yield();           // 18,000 floor vertices, each looked up against the track
        const x = ps[i * 3], z = ps[i * 3 + 2]; let o = 0;
        for (const c of occ) { const dx = x - c[0], dz = z - c[1], d2 = dx * dx + dz * dz; if (d2 < c[2] * c[2]) { const k = 1 - Math.sqrt(d2) / c[2]; o = Math.max(o, c[3] * Math.min(1, k * 2.2)); } }
        const n = path.nearestXZ(x, z);
        if (n.u > U_BR + 0.012) o = Math.max(o, 0.5 * (1 - sstep(3.5, 8, n.dist)));
        if (inLog(x, z, 4)) o = Math.max(o, 0.5);
        ax[i * 2 + 1] = o;
      }
    }
    await ctx.yield();
    addMesh(mergeGeos(statics), wmat(1, 0, { gloss: 0.6, sss: 0.14, fibre: 3, variant: 1 }), 'fungi');
    await ctx.yield();
    { const g = mergeGeos(capParts); g.computeBoundingSphere(); addMesh(g, wmat(4, 0, { gloss: 1, sss: 0.1 }), 'agaric-caps', true); }
    await ctx.yield();

    // ---- our mount: a violet ground beetle, built round the camera. The eye rides 0.6 m above the back of the
    // thorax shield, so the violet-rimmed shield and the head lie along the bottom of the frame, the antennae sweep
    // the lower corners and the fore knees pump beside them. Cuticle shader (FK 7): black, granulate, mirror-wet,
    // with the structural violet (or bronze) strongest on margins and at grazing angles.
    const mount = new THREE.Group(); mount.name = 'beetle'; scene.add(mount);
    const feelers = [], knees = [];
    const two = { pos: new THREE.Vector3(), tan: new THREE.Vector3(), u0: 0.79, f0: 0.47, speed: 4.5 };          // the second beetle
    const KNEE_Y = -1.5;             // the fore knees pump just under the bottom edge of a wide frame: on a tall screen they show
    let palpMat = null;
    {
      const sheenC = bronze ? col('#C98A2E') : col('#6A45F0'), legC = bronze ? col('#9A6424') : col('#4A34C0'), dull = col('#17120E');
      const parts = [];
      // pronotum: a domed shield with a turned-up margin, a groove inside the margin, a median line and two basal pits
      parts.push(gridGeo(28, 14, false, (u, v, o) => {
        const a = (u - 0.5) * Math.PI, sa = Math.sin(a), ca = Math.cos(a), b = v, asa = Math.abs(sa);
        const W = 0.8 + 0.34 * Math.sin(Math.PI * Math.min(1, b * 0.85 + 0.08));
        const front = 1 - sstep(0, 0.16, b);
        const rimL = sstep(0.8, 0.97, asa), rimF = sstep(0.12, 0.0, b), rim = Math.max(rimL, rimF);
        const groove = Math.exp(-Math.pow((asa - 0.78) / 0.07, 2)) + 0.8 * Math.exp(-Math.pow((b - 0.14) / 0.05, 2)) * (1 - rimL);
        const median = Math.exp(-Math.pow(sa / 0.045, 2)) * sstep(0.1, 0.3, b);
        const pit = Math.exp(-(Math.pow((asa - 0.5) / 0.13, 2) + Math.pow((b - 0.86) / 0.09, 2)));
        o.p[0] = W * sa; o.p[2] = -1.95 + b * 2.2 - 0.14 * ca * front + 0.1 * asa * front;
        o.p[1] = -1.12 + 0.34 * Math.pow(Math.max(ca, 0), 0.7) * (0.75 + 0.25 * Math.sin(Math.PI * Math.min(1, b + 0.15))) + 0.075 * rim - 0.035 * groove - 0.014 * median - 0.03 * pit
          - 0.16 * (1 - b) * (1 - b) + 0.01 * noise.n2(u * 26, v * 22);
        o.c[0] = sheenC.r; o.c[1] = sheenC.g; o.c[2] = sheenC.b;
        o.a[0] = (0.75 + 0.25 * ca) * (1 - 0.35 * Math.min(1, groove)) * (1 - 0.3 * pit); o.a[1] = 0.1 + 1.25 * rim + 0.25 * Math.min(1, groove);
      }));
      // head: capsule, labrum, bulging eyes, sickle mandibles that cross, and palps that twitch
      parts.push(blob([0, -1.2, -2.48], [0.47, 0.21, 0.56], sheenC, 14, 8, 1, 0.2));
      parts.push(blob([0, -1.27, -3.0], [0.24, 0.06, 0.15], sheenC, 8, 4, 0.9, 0.35));
      for (const sd of [-1, 1]) {
        parts.push(blob([sd * 0.45, -1.14, -2.5], [0.14, 0.12, 0.17], sheenC, 8, 5, 1, 0.5));
        parts.push(tubeR([[sd * 0.27, -1.25, -2.88], [sd * 0.42, -1.25, -3.14], [sd * 0.27, -1.27, -3.4], [-sd * 0.03, -1.28, -3.5]], [0.1, 0.085, 0.05, 0.012], sheenC, 8, 3, 0.9, 0.4));
        parts.push(tubeR([[sd * 0.3, -1.31, -2.8], [sd * 0.52, -1.33, -3.08], [sd * 0.5, -1.37, -3.34], [sd * 0.42, -1.4, -3.5]], [0.035, 0.03, 0.035, 0.055], dull, 6, 2, 1, 1,
          (u, v, o, t) => { o.a[0] = t; o.a[1] = -(1 + (sd > 0 ? 1 : 0)); }));
      }
      palpMat = wmat(7, 2, { fibre: 24, misc: [0.05, 0, 0, 0] });
      const shell = new THREE.Mesh(mergeGeos(parts), palpMat); shell.frustumCulled = false; shell.name = 'beetle-shell'; mount.add(shell);
      const limbMat = wmat(7, 0, { fibre: 24 });
      // antenna: eleven joints, each swelling toward its far end; the first four bare and glossy, the rest downy
      const fg = gridGeo(8, 33, true, (u, v, o, i, j) => {
        const t = v, seg = Math.min(10, Math.floor(t * 11 + 1e-6)), k = t * 11 - seg, th = u * TAU;
        const r0 = (seg === 0 ? 0.085 : mixn(0.062, 0.034, t)) * (0.72 + 0.5 * Math.pow(Math.max(k, 0), 0.7)) * (j === 33 ? 0.3 : 1);
        o.p[0] = Math.cos(th) * r0; o.p[1] = 0.14 * Math.sin(t * Math.PI) - 0.3 * t + Math.sin(th) * r0; o.p[2] = -2.1 * t;
        o.c[0] = legC.r; o.c[1] = legC.g; o.c[2] = legC.b; o.a[0] = 0.92; o.a[1] = seg > 3 ? 0.14 : 0.6;
      });
      for (const sd of [-1, 1]) {
        const f = new THREE.Mesh(fg, limbMat); f.position.set(sd * 0.38, -1.16, -2.74); f.frustumCulled = false; mount.add(f); feelers.push({ m: f, sd });
        // fore leg: swollen femur up to the knee, a tibia that widens to its spurred end and carries a row of spines,
        // and the first joints of the foot
        const tib = [[sd * 0.83, 0.5, -0.39], [sd * 1.0, 0.05, -0.72], [sd * 1.17, -0.52, -1.06], [sd * 1.25, -0.9, -1.38]];
        const leg = [
          tubeR([[0, 0, 0], [sd * 0.42, 0.3, -0.2], [sd * 0.82, 0.5, -0.38]], [0.08, 0.125, 0.08], legC, 8, 4, 0.95, 0.5),
          blob([sd * 0.83, 0.5, -0.39], [0.095, 0.095, 0.095], legC, 8, 5, 1, 0.7),
          tubeR(tib, [0.068, 0.056, 0.062, 0.082], legC, 8, 3, 0.9, 0.45),
          tubeR([[sd * 1.25, -0.9, -1.38], [sd * 1.3, -1.0, -1.62], [sd * 1.32, -1.06, -1.86], [sd * 1.32, -1.1, -2.1]], [0.07, 0.06, 0.052, 0.03], legC, 6, 3, 0.85, 0.35),
        ];
        for (let s = 0; s < 6; s++) {
          const f2 = 0.5 + s * 0.45, i0 = Math.min(2, Math.floor(f2)), k = f2 - i0, a = tib[i0], b = tib[i0 + 1];
          const px = mixn(a[0], b[0], k), py = mixn(a[1], b[1], k), pz = mixn(a[2], b[2], k), out = s % 2 ? 0.75 : -0.2;
          leg.push(tubeR([[px, py, pz], [px + sd * 0.11 * out + sd * 0.03, py - 0.05, pz + 0.13]], [0.024, 0.004], legC, 4, 1, 0.9, 0.3));
        }
        const kn = new THREE.Mesh(mergeGeos(leg), limbMat); kn.position.set(sd * 0.72, KNEE_Y, -1.55); kn.frustumCulled = false; mount.add(kn); knees.push({ m: kn, sd });
      }
      // ---- a second ground beetle of the mount's own kind, whole: it runs the root beside the head of the bough and we
      // overtake it (keyed to u). Forward is +z; its feet stand at y = -0.62. Fused wing cases with raised lines, the
      // shield with its turned-up violet margin, head, sickle jaws, eleven-jointed antennae, six legs that step in threes.
      {
        const bp = [];
        bp.push(gridGeo(22, 14, false, (u, v, o) => {
          const a = (u - 0.5) * Math.PI, sa = Math.sin(a), ca = Math.cos(a), asa = Math.abs(sa), b = v;
          const W = 0.86 * Math.pow(Math.max(Math.sin(Math.PI * (0.2 + 0.8 * b)), 0), 0.6), rim = sstep(0.8, 0.97, asa);
          const line = Math.pow(0.5 + 0.5 * Math.cos(a * 15), 3) * (1 - rim) * sstep(0.02, 0.12, b) * (1 - sstep(0.85, 1, b));
          o.p[0] = W * sa; o.p[2] = 0.56 - 2.7 * b;
          o.p[1] = 0.16 + 0.66 * Math.pow(Math.max(ca, 0), 0.72) * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, b * 0.92 + 0.12))) + 0.045 * rim * (1 - b) + 0.02 * line;
          o.c[0] = sheenC.r; o.c[1] = sheenC.g; o.c[2] = sheenC.b;
          o.a[0] = (0.72 + 0.28 * ca) * (1 - 0.3 * (1 - line) * (1 - rim) * 0.4); o.a[1] = 0.12 + 1.2 * rim + 0.3 * line;
        }));
        bp.push(gridGeo(16, 8, false, (u, v, o) => {
          const a = (u - 0.5) * Math.PI, sa = Math.sin(a), ca = Math.cos(a), asa = Math.abs(sa), b = v;
          const W = 0.5 + 0.24 * Math.sin(Math.PI * Math.min(1, b * 0.8 + 0.12)), rim = Math.max(sstep(0.78, 0.97, asa), sstep(0.14, 0, b));
          o.p[0] = W * sa; o.p[2] = 1.56 - 1.02 * b;
          o.p[1] = 0.2 + 0.46 * Math.pow(Math.max(ca, 0), 0.7) * (0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, b + 0.15))) + 0.06 * rim;
          o.c[0] = sheenC.r; o.c[1] = sheenC.g; o.c[2] = sheenC.b; o.a[0] = 0.75 + 0.25 * ca; o.a[1] = 0.12 + 1.25 * rim;
        }));
        const leg2C = legC.clone().multiplyScalar(0.4);
        bp.push(blob([0, 0.33, 0.3], [0.6, 0.3, 1.9], sheenC, 10, 6, 0.5, 0.1));           // the underside
        bp.push(blob([0, 0.42, 1.86], [0.37, 0.2, 0.44], sheenC, 12, 7, 1, 0.25));
        for (const sd of [-1, 1]) {
          bp.push(blob([sd * 0.35, 0.47, 1.86], [0.11, 0.1, 0.14], sheenC, 7, 4, 1, 0.5));
          bp.push(tubeR([[sd * 0.2, 0.36, 2.16], [sd * 0.33, 0.36, 2.38], [sd * 0.2, 0.35, 2.58], [-sd * 0.03, 0.34, 2.66]], [0.08, 0.07, 0.04, 0.012], sheenC, 6, 2, 0.9, 0.4));
          // antenna (it waves: carried by the leg kind at a small weight)
          bp.push(tubeR([[sd * 0.27, 0.5, 2.02], [sd * 0.62, 0.78, 2.6], [sd * 1.02, 0.76, 3.2], [sd * 1.34, 0.56, 3.8]], [0.06, 0.05, 0.04, 0.025], leg2C, 5, 3, 1, 1,
            (u, v, o, t) => { o.a[0] = 0.5 * t * t; o.a[1] = -(1 + (sd > 0 ? 0.3 : 1.1)); }));
          for (let l = 0; l < 3; l++) {
            const zl = [1.02, 0.34, -0.36][l], fz = [0.72, 0.05, -0.95][l], ph = (l + (sd > 0 ? 1 : 0)) % 2;
            bp.push(tubeR([[sd * 0.42, 0.26, zl], [sd * 1.0, 0.5, zl + fz * 0.45], [sd * 1.3, 0.0, zl + fz * 0.85], [sd * 1.4, -0.6, zl + fz]], [0.13, 0.11, 0.08, 0.045], leg2C, 6, 2, 1, 1,
              (u, v, o, t) => { o.a[0] = Math.pow(t, 0.8); o.a[1] = -(1 + ph); }));
          }
        }
        two.amp = 0.4; two.size = 1.6;
        two.mesh = new THREE.Mesh(mergeGeos(bp), wmat(7, 2, { fibre: 12, misc: [two.amp, 0, 0, 0] }));
        two.mesh.frustumCulled = false; two.mesh.name = 'beetle-two'; two.mesh.matrixAutoUpdate = false; scene.add(two.mesh);
      }
    }
    await ctx.yield();

    // ---- water: beads on leaves, moss and bark; drips that fall, burst and start again
    const dropMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: DROP_VERT, fragmentShader: BEAD_FRAG, fog: true });
    const dropMesh = (geo, n) => { const m = new THREE.InstancedMesh(geo, dropMat, n); m.frustumCulled = false; return m; };
    let rain = null, crowns = null, crownA = null;
    if (!frost) {
      const nBead = Math.round(240 * detail * (hour === 'dawn' ? 1.4 : 1)), bg = new THREE.IcosahedronGeometry(1, 1), bB = new Float32Array(nBead * 4);
      const beads = dropMesh(bg, nBead); let k = 0;
      for (let tries = 0; k < nBead && tries < nBead * 5; tries++) {
        const d = rng.range(0, L - 14), onBranch = d > dBR + 4, lat = onBranch ? rng.range(1.0, 3.7) * (rng.chance(0.5) ? 1 : -1) : (rng.chance(0.5) ? 1 : -1) * (1.6 + 16 * Math.pow(rng(), 1.6));
        const [x, z] = beside(d, lat), r = rng.range(0.1, 0.28) * (rng.chance(0.1) ? 1.5 : 1);
        if (!onBranch && d > L * U_CREST - 4) continue;
        let y;
        if (onBranch) { path.posAtDist(d, tmpV); y = tmpV.y - EYE - BR_R + Math.sqrt(BR_R * BR_R - lat * lat) + r * 0.5; }
        else y = surfAt(x, z) + 0.3 + r * 0.5;
        M4.makeScale(r, r, r).setPosition(x, y, z); beads.setMatrixAt(k, M4); bB[k * 4] = rng(); k++;
      }
      beads.count = k; beads.name = 'beads'; splitAlong(beads, 9, 120, bB);
      await ctx.yield();
      const nDrip = Math.round((shower ? 300 : 130) * mixn(0.8, 1.15, (dens - 0.7) / 0.6)), dg = new THREE.IcosahedronGeometry(1, nDrip > 160 ? 0 : 1), dB = new Float32Array(nDrip * 4);
      const drips = dropMesh(dg, nDrip);
      for (let i = 0; i < nDrip; i++) {
        const d = rng.range(5, L - 20), arc = i < 22;
        let x, z, top;
        if (arc) { const sd = rng.chance(0.5) ? 1 : -1; z = rng.range(AZ1, AZ0 + 3); x = sd * rng.range(2.5, 7.4); top = arcWallY(x, z) - 0.9; }
        else {
          [x, z] = beside(d, (rng.chance(0.5) ? 1 : -1) * (3.2 + 22 * Math.pow(rng(), 1.3)));
          if (Math.hypot(x, z) < 22) { const q = 22 / Math.max(Math.hypot(x, z), 1); x *= q; z *= q; if (path.nearestXZ(x, z).dist < 3.2) x -= 9; }
          top = surfAt(x, z) + rng.range(24, 34);
        }
        const g0 = surfAt(x, z), r = rng.range(0.36, 0.5);
        M4.makeScale(r, r, r).setPosition(x, top, z); drips.setMatrixAt(i, M4);
        dB[i * 4] = rng(); dB[i * 4 + 1] = 1; dB[i * 4 + 2] = Math.max(top - g0 - 0.15, 2); dB[i * 4 + 3] = shower ? rng.range(2.2, 4) : rng.range(3.4, 7);
        // THE SAME GUARD AS THE PARASOL'S DRIPS: a drip whose course comes within CLEAR_AIR of the flown line is made a bead
        // that hangs where it stood and does not fall. Its course is the upright column under it, as long as its fall and
        // 1.25 radii wide, and at its foot the crown it bursts into (DROP_VERT: 4.2 radii wide, 1.2 radii tall at the most).
        {
          const lo = top - dB[i * 4 + 2], rc = 1.25 * r, rf = 4.2 * r, hf = lo + 1.2 * r;
          nearLine((j) => {
            const dx = lineP[j] - x, dz = lineP[j + 2] - z, dh = Math.sqrt(dx * dx + dz * dz), y = lineP[j + 1];
            const hc = Math.max(dh - rc, 0), vc = y > top ? y - top : y < lo ? lo - y : 0, hw = Math.max(dh - rf, 0), vw = y > hf ? y - hf : y < lo ? lo - y : 0;
            return Math.min(hc * hc + vc * vc, hw * hw + vw * vw);
          }, CLEAR_AIR);
          if (nearD2 < CLEAR_AIR * CLEAR_AIR) dB[i * 4 + 1] = 0;
        }
      }
      drips.name = 'drips'; splitAlong(drips, 6, 420, dB, 38);          // (a drip falls up to 36 m below where its instance stands)
      // the raindrops that land on the three puffballs (and on the toad's back)
      const rg = new THREE.IcosahedronGeometry(1, 1); rg.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(16), 4));
      rain = dropMesh(rg, 4); rain.name = 'raindrops'; scene.add(rain);
      // and the crown each throws up at the pore
      {
        const NW = 30, NH = 5, NBD = 11, ico = new THREE.IcosahedronGeometry(1, 0), ip = ico.attributes.position.array, ii = ico.index ? ico.index.array : null;
        const nIco = ii ? ii.length : ip.length / 3, pos = [], aK = [], idx = [];
        for (let j = 0; j <= NH; j++) for (let i = 0; i <= NW; i++) { pos.push(i / NW, j / NH, 0); aK.push(0, 0, 0); }
        for (let j = 0; j < NH; j++) for (let i = 0; i < NW; i++) { const a = j * (NW + 1) + i, b = a + 1, c = a + NW + 1, d2 = c + 1; idx.push(a, c, b, b, c, d2); }
        for (let b = 0; b < NBD; b++) {
          const base = pos.length / 3, th = (b + 0.5) / NBD, rnd = r3();
          if (ii) { for (let k = 0; k < ip.length; k += 3) { pos.push(ip[k], ip[k + 1], ip[k + 2]); aK.push(1, th, rnd); } for (let k = 0; k < ii.length; k++) idx.push(base + ii[k]); }
          else for (let k = 0; k < nIco; k++) { pos.push(ip[k * 3], ip[k * 3 + 1], ip[k * 3 + 2]); aK.push(1, th, rnd); idx.push(base + k); }
        }
        ico.dispose();
        const cg = new THREE.BufferGeometry();
        cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); cg.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(aK), 3));
        cg.setIndex(idx);
        crownA = new THREE.InstancedBufferAttribute(new Float32Array(8), 2); cg.setAttribute('iA', crownA);
        const cm = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false });
        crowns = new THREE.InstancedMesh(cg, cm, 4); crowns.frustumCulled = false; crowns.name = 'crowns'; scene.add(crowns);
        for (let i = 0; i < 4; i++) { crownA.setXY(i, 0, r3()); crowns.setMatrixAt(i, M4.identity()); }
      }
    }
    await ctx.yield();

    // ---- falling beech leaves, seesawing down like sails and settling. Their centres stay at least 16.5 m from the
    // track, so with 3 m of sway and half a leaf's length none passes within 6 m of the eye. Leaf 0 is staged: it hangs
    // seesawing left of the arcade mouth in the first frame and comes down outside the left wall as we set off (u).
    const fall = { n: season === 'early' ? 72 : 24 };
    {
      fall.mesh = new THREE.InstancedMesh(leafGeo(12, 6), wmat(2, 0, { gloss: 0.5, sss: 0.7, fibre: 10 }), fall.n);
      fall.mesh.frustumCulled = false; fall.mesh.name = 'falling-leaves'; scene.add(fall.mesh);
      fall.d = new Float32Array(fall.n * 8);
      for (let i = 0; i < fall.n; i++) {
        let x = 0, z = 0, ok = false;
        for (let t = 0; t < 40 && !ok; t++) {
          const fd = rng.range(20, L * 0.97), onB = fd > L * 0.7;           // along the branch the view runs far ahead: leaves keep to the outer thirds
          [x, z] = beside(fd, (rng.chance(0.5) ? 1 : -1) * (onB ? rng.range(34, 70) : rng.range(16.5, 40)));
          ok = Math.hypot(x, z) > 34 && path.nearestXZ(x, z).dist > 16.4 && !(z > AZ1 - 8 && z < AZ0 + 16 && Math.abs(x) < 26) && !inLog(x, z, 8);
        }
        const top = rng.range(38, 52);
        fall.d.set([x, surfAt(x, z) + 0.4, z, top, rng.range(0, 30), rng.range(0, TAU), ok || i === 0 ? rng.range(8, 11.5) : 0, rng.range(0.9, 1.5)], i * 8);
        fall.mesh.setColorAt(i, leafTone(tc));
      }
    }

    // ---- soft sprites: puffball smoke (keyed to u) and motes drifting through the whole wood
    const blendPM = { transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor };
    const pxU = { value: 450 }, moteK = { value: 1 };
    const jets = [];
    // the drop lands when the puffball is 28 m ahead (0.048 of the track before the eye is abreast of it)
    for (let i = 0; i < 3; i++) { const p = puffballs[i]; jets.push({ x: p.x, y: p.y + p.H * 0.955, z: p.z, u: p.d / L - 0.048, wind: i === 2 ? 2.2 : 1.7, n: 680, h: p.H * 0.88, lean: i === 2 ? 0.4 : 0 }); }
    if (shower) for (let i = 3; i < Math.min(puffballs.length, 10); i++) { const p = puffballs[i]; jets.push({ x: p.x, y: p.y + p.H * 0.955, z: p.z, u: -1, period: rng.range(5, 9), off: rng.range(0, 9), wind: 1.5, n: 40, h: p.H * 1.2 }); }
    const nPuff = jets.reduce((a, j) => a + j.n, 0);
    const puff = { pos: new Float32Array(nPuff * 3), col: new Float32Array(nPuff * 4), size: new Float32Array(nPuff), seed: new Float32Array(nPuff * 4) };
    for (let i = 0; i < nPuff * 4; i++) puff.seed[i] = r3();
    {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(puff.pos, 3)); g.setAttribute('aC', new THREE.BufferAttribute(puff.col, 4)); g.setAttribute('aSz', new THREE.BufferAttribute(puff.size, 1));
      puff.geo = g;
      const m = new THREE.ShaderMaterial({ uniforms: { ...fogU(), uPx: pxU }, vertexShader: SPRITE_VERT, fragmentShader: SPRITE_FRAG, fog: true, ...blendPM });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 2; pts.name = 'puff-smoke'; scene.add(pts);
    }
    {
      const n = Math.round(520 * detail), aS = new Float32Array(n * 4);
      for (let i = 0; i < aS.length; i++) aS[i] = rng();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
      const m = new THREE.ShaderMaterial({
        uniforms: { ...fogU(), ...U, uPx: pxU, uBox: { value: new THREE.Vector3(80, 30, 80) }, uDrift: { value: new THREE.Vector3(0.5, frost ? -0.05 : -0.22, 0.3) }, uMoteCol: { value: fogCol.clone().multiplyScalar(night ? 1.5 : 1.12) }, uMoteK: moteK },
        vertexShader: MOTE_VERT, fragmentShader: SPRITE_FRAG, fog: true, ...blendPM,
      });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 2; pts.name = 'motes'; scene.add(pts);
    }
    await ctx.yield();

    // ---- per-frame
    const size2 = new THREE.Vector2(), mM = new THREE.Matrix4();
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3(), X = new THREE.Vector3(), Y = new THREE.Vector3();
    const speed = L / DUR, uSnail = dSnail / L, uAnt = dAnt / L;
    const snailBase = snail.position.clone();
    const smokeCore = night ? col('#232A3E') : col('#33200F'), smokeEdge = night ? col('#56617E') : col('#7A5A38');
    // each plume leans downwind along the track's own heading (so its head stays beside the track and inside the frame as
    // we come up to it); only the last leans a little toward the track, and we cut its thin edge
    for (const j of jets) {
      const n = path.nearestXZ(j.x, j.z); path.pointAt(n.u, tmpV); path.tangentAt(n.u, tmpT);
      const dl = Math.hypot(tmpV.x - j.x, tmpV.z - j.z) || 1, tl = Math.hypot(tmpT.x, tmpT.z) || 1, k = j.lean ?? 1;
      const wx = tmpT.x / tl * (1 - k) + (tmpV.x - j.x) / dl * k, wz = tmpT.z / tl * (1 - k) + (tmpV.z - j.z) / dl * k, wl = Math.hypot(wx, wz) || 1;
      j.wx = wx / wl; j.wz = wz / wl;
    }
    const vMid = new THREE.Vector3(), vFw = new THREE.Vector3(), vUn = new THREE.Vector3(), tcM = new THREE.Color();
    const routeAt = (s, out, tan) => {
      const f = Math.min(milli.ns - 1.001, Math.max(0, (s - milli.s0) / 0.5)), i = Math.floor(f), t = f - i, r = milli.route;
      out.set(mixn(r[i * 3], r[i * 3 + 3], t), mixn(r[i * 3 + 1], r[i * 3 + 4], t), mixn(r[i * 3 + 2], r[i * 3 + 5], t));
      tan.set(r[i * 3 + 3] - r[i * 3], r[i * 3 + 4] - r[i * 3 + 1], r[i * 3 + 5] - r[i * 3 + 2]).normalize();
    };
    const gaze = { snail: new THREE.Vector3(), ants: antPts[2].clone().add(antPts[3]).multiplyScalar(0.5), cap: hero.center.clone().setY(hero.center.y + 2) };
    gaze.snail.copy(snailBase).addScaledVector(snailDir, 2.5).setY(snailBase.y + 2.2);

    const camPos = new THREE.Vector3(), gazeTmp = new THREE.Vector3(), gazeTmp2 = new THREE.Vector3();
    const stageXZ = [-12, AZ0 + 9.5], stageY = surfAt(-12, AZ0 + 9.5);
    // the gaze rests on the ant file until we are almost under it, then slides on to the parasol
    const antGaze = (time, u) => gazeTmp.copy(gaze.ants).lerp(gaze.cap, sstep(uAnt - 0.014, uAnt + 0.004, u));

    // the second beetle's place on the root's crest at u (a pure function of u: the gaze follows it): it waits where the
    // root leaves the bank, runs ahead of us on our right at a third of our speed, is overtaken at about u 0.81, and
    // stops where the root goes down into the litter
    const twoF = (u) => Math.min(0.8, Math.max(0.18, two.f0 + two.speed * DUR / root.len * (u - two.u0)));
    const twoAt = (u, out) => { root.curve.getPointAt(twoF(u), out); out.y += root.R + 0.6 * two.size - 0.1; return out; };
    const twoGaze = (time, u) => twoAt(u, gazeTmp2);
    function update(dt, time, camera, u) {
      camPos.setFromMatrixPosition(camera.matrixWorld);       // never camera.position: behind a portal the matrix is set directly
      hero.update(dt, time, camera);
      hero.setProgress(clamp01((u - U_CREST + 0.02) / (U_BR - U_CREST + 0.02)));
      dome.position.copy(camPos);
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size2); pxU.value = size2.y; }
      const dist = u * L;
      for (const c of lodChunks) {
        const dd = camPos.distanceTo(c.c) - c.r, hiOn = !!c.hi && dd < c.sw;
        c.lo.visible = !hiOn && dd < c.range;
        if (c.hi) c.hi.visible = hiOn;
        if (c.extra) c.extra.visible = hiOn;
      }
      // a twig's troop is drawn round at arm's length, as the bonnets' own nine-sided bell further off, lighter in the mist
      for (const c of twigTroops) {
        const dd = camPos.distanceTo(c.c) - c.r;
        c.near.visible = dd < TROOP_NEAR; c.mid.visible = dd >= TROOP_NEAR && dd < TROOP_MID; c.far.visible = dd >= TROOP_MID && dd < TROOP_OUT;
      }

      // the mount follows the track's heading, not the gaze, so it lags a look to the side like a real ride
      // from far off (the view in through the portal, the first steps) the parasol keeps its shape through the fog, its
      // shaft burns brighter and the clearing behind it glows; close to, the forest is its own pale self
      {
        const farK = sstep(250, 430, Math.hypot(camPos.x - U.uCapC.value.x, camPos.z - U.uCapC.value.z));
        if (U.uFogK) U.uFogK.value = mixn(LOOK.heroFog, 0.3, farK);
        // from the agaric arc to the foot of the bank the bar is the picture: it burns brighter there, and the canopy
        // round the parasol goes into shade so that the bar and the pale cap are the brightest things in the frame
        const midK = sstep(0.33, 0.41, u) * (1 - 0.6 * sstep(0.47, 0.57, u)) * (1 - sstep(0.62, 0.68, u));
        // inside the bar its glow veils the whole frame: there it is turned down, so that what is lit and what is not
        // (gills, stalk, glitter against grey smoke) carries the picture
        const sp = U.uShaftP.value, sd = U.uSunDir.value;
        vA.copy(camPos).sub(sp); const alS = vA.dot(sd); vA.addScaledVector(sd, -alS);
        const insideK = 1 - sstep(0.72, 1.12, vA.length() / U.uCoreR.value);
        domeMat.uniforms.uAxis.value.w = mixn(0.25, 1, sstep(345, 402, camPos.z));
        const hv = domeMat.uniforms.uHero.value;
        vA.copy(gaze.cap).sub(camPos); const hd = vA.length() || 1;
        const vaultK = 1 - sstep(38, 80, hd);
        hv.set(vA.x / hd, vA.y / hd, vA.z / hd, (night ? 0.35 : 0.85) * (1 - 0.5 * sstep(330, 420, hd)) * (night ? 1 : 1 + 0.1 * vaultK));
        domeMat.uniforms.uVault.value = vaultK; moteK.value = 1 - 0.8 * vaultK;
        if (trunkMat) trunkMat.uniforms.uMisc.value.z = 1 - 0.62 * vaultK * (1 - sstep(0.76, 0.79, u));       // beside the vault a trunk is bark, not a black wedge
        hero.shaft.core = mixn(hour === 'day' ? 11 : hero.shaft.radius, 4.6, vaultK);
        // (by day the bar is already as bright as the pale wood allows: from far off it is turned down, or it is a white rod)
        if (shaftU) shaftU.value = mixn(shaft0 * (hour === 'day' ? 1 - 0.6 * farK - 0.25 * sstep(120, 250, hd) + 0.15 * midK : 1 + 1.2 * farK + 0.9 * midK), Math.min(0.5, shaft0 * 1.8), vaultK * (1 - insideK)) * mixn(1, 0.3, insideK);
      }
      {
        path.tangentAt(u, tmpT);
        const gait = dist / 2.3 * TAU;
        // at u 0 the world is being looked into through the portal before ours, from a camera that is somewhere else:
        // the beetle waits at the start of the track, heading down it, which is where the view arrives
        vA.copy(u > 0 ? camPos : path.start);
        // heading from the track; pitch from the track too, but never more than four degrees above the gaze: on the
        // bank the steady camera looks half as steeply as the track climbs, and the shield must stay a rim, not a slab
        {
          const me = camera.matrixWorld.elements, tl = Math.hypot(tmpT.x, tmpT.z) || 1;
          const gazeP = Math.asin(Math.max(-1, Math.min(1, -me[9] / (Math.hypot(me[8], me[9], me[10]) || 1))));
          const pT = Math.atan2(tmpT.y, tl), over = Math.max(0, pT - gazeP - 0.07), pM = u > 0 ? Math.min(pT, gazeP - Math.min(0.03, 0.6 * over)) : pT, cp = Math.cos(pM);
          // heading: the track's, but never more than an eighth of a turn's third off the gaze: when the eye turns to
          // look at something beside the track the shield stays a rim under it and does not swing its flank into view
          let hx = tmpT.x / tl, hz = tmpT.z / tl;
          if (u > 0) {
            const fl = Math.hypot(me[8], me[10]) || 1, fx = -me[8] / fl, fz = -me[10] / fl;
            const dy = Math.atan2(hx * fz - hz * fx, hx * fx + hz * fz), lim = 0.07;
            if (Math.abs(dy) > lim) { const a = dy - Math.sign(dy) * lim, ca = Math.cos(a), sa = Math.sin(a), nx = hx * ca - hz * sa, nz = hx * sa + hz * ca; hx = nx; hz = nz; }
          }
          vB.set(vA.x + hx * cp, vA.y + Math.sin(pM), vA.z + hz * cp);
        }
        mM.lookAt(vA, vB, UP); mount.quaternion.setFromRotationMatrix(mM);
        // on a tall, narrow screen the engine widens the view: ride a little higher above the shield so it stays a rim
        // along the bottom and not a slab
        const wide = Math.max(0, (camera.fov ? Math.tan(camera.fov * Math.PI / 360) : 0.6) - 0.62);
        mount.position.copy(vA); mount.position.y += 0.03 * Math.sin(gait * 2) - 0.27 - 2.0 * wide;
        { const me = camera.matrixWorld.elements; mount.rotateZ(0.018 * Math.sin(gait) + (u > 0 ? 0.85 * Math.asin(Math.max(-1, Math.min(1, me[1] / (Math.hypot(me[0], me[1], me[2]) || 1)))) : 0)); }
        // the antennae are held low and wide and sweep alternately across the lower corners: they never stand up across the view
        for (const f of feelers) f.m.rotation.set(0.06 * Math.sin(time * 1.7 + f.sd) + 0.03 * Math.sin(gait * 2), -f.sd * (1.26 + 0.3 * Math.sin(time * 2.4 + (f.sd > 0 ? 0 : Math.PI)) + 0.05 * Math.sin(gait)), 0);
        for (const k of knees) { const ph = gait + (k.sd > 0 ? 0 : Math.PI); k.m.rotation.set(0.42 * Math.sin(ph), 0, k.sd * 0.1 * Math.cos(ph)); k.m.position.y = KNEE_Y + 0.07 * Math.max(Math.cos(ph), 0); }
        palpMat.uniforms.uMisc.value.y = time * 9;
      }

      // the second beetle on its root
      {
        const f = twoF(u);
        twoAt(u, two.pos); root.curve.getTangentAt(f, two.tan);
        X.crossVectors(UP, two.tan).normalize(); Y.crossVectors(two.tan, X).normalize();
        const run = f > 0.181 && f < 0.799 ? 1 : 0, sR = f * root.len;
        mM.makeBasis(X.multiplyScalar(two.size), Y.multiplyScalar(two.size), vB.copy(two.tan).multiplyScalar(two.size)).setPosition(two.pos.x, two.pos.y + 0.04 * run * Math.sin(sR / two.amp / two.size * 2), two.pos.z);
        two.mesh.matrix.copy(mM);
        // its legs step by the distance it has run (no skating); standing, only its antennae stir
        two.mesh.material.uniforms.uMisc.value.y = sR / two.amp / two.size + (1 - run) * 0.25 * Math.sin(time * 1.3);
      }

      // snail: gliding, shell rocking, eye stalks following us; the nearer one flinches in as an antenna passes
      snail.position.copy(snailBase).addScaledVector(snailDir, Math.min(time, 45) * 0.15 - 3);
      snail.position.y = surfAt(snail.position.x, snail.position.z) - 0.08;
      const pv = snail.userData.pivot;
      if (pv) pv.rotation.set(0.02 * Math.sin(time * 0.57 + 1), 0, 0.035 * Math.sin(time * 0.8));
      snail.updateMatrixWorld();
      vA.copy(camPos); snail.worldToLocal(vA);
      const fl = sstep(uSnail - 0.014, uSnail - 0.004, u) * (1 - sstep(uSnail + 0.012, uSnail + 0.03, u));
      for (const st of stalks) {
        vB.copy(vA).sub(st.m.position); const dl = vB.length() || 1; vB.multiplyScalar(1 / dl);
        const w = 0.7 * (1 - sstep(25, 75, dl)) * (vB.z > -0.3 ? 1 : 0.35);
        vC.copy(st.base).multiplyScalar(1 - w).addScaledVector(vB, w);
        vC.x += 0.07 * Math.sin(time * 0.9 + st.sd); vC.y = Math.max(vC.y, 0.15); vC.normalize();
        st.m.quaternion.setFromUnitVectors(UP, vC);
        const k = fl * (vA.x * st.sd > 0 ? 1 : 0.15);
        st.m.scale.set(1 + 0.45 * k, 1 - 0.72 * k, 1 + 0.45 * k);
      }

      // millipedes: each segment rides the baked route behind its head; pill millipedes curl as we pass
      {
        const sHead0 = milli.uMid * L + 14 + 3 * DUR * (u - milli.uMid), bodyL = milli.nSeg * milli.segLen;
        let k = 0;
        for (let m = 0; m < milli.nM; m++) {
          const sH = sHead0 - m * (bodyL + milli.gap);
          const c = pills ? 1 - sstep(5, 13, Math.abs(dist - (sH - bodyL * 0.5))) : 0;
          // A pill millipede rolls up the way the animal does: belly in, plates out. Its middle stays where it walks; the
          // body bends into an arc about a centre under it, head and tail come down and in until they meet beneath, the
          // rings drawing together along the belly as the plates draw apart over the back, and the ball rests on the
          // ground where it stood. th: the angle the body spans; rho: the radius of its midline.
          let th = 0, rho = 0, cy = 0;
          if (c >= 0.01) {
            routeAt(sH - (milli.nSeg - 1) * 0.5 * milli.segLen, vMid, vFw); X.crossVectors(UP, vFw).normalize(); vUn.crossVectors(vFw, X).normalize();
            th = c * TAU * 0.93; rho = milli.nSeg * milli.segLen * (1 - 0.44 * c) / th; cy = -rho * Math.cos(th * 0.5) + 0.1 * c;
          }
          for (let j = 0; j < milli.nSeg; j++) {
            if (c < 0.01) { routeAt(sH - j * milli.segLen, vA, vB); X.crossVectors(UP, vB).normalize(); Y.crossVectors(vB, X).normalize(); }
            else {
              const ph = th * ((milli.nSeg - 1) * 0.5 - j) / milli.nSeg, sn = Math.sin(ph), cs = Math.cos(ph);
              vA.copy(vMid).addScaledVector(vFw, rho * sn).addScaledVector(vUn, rho * cs + cy);
              vB.copy(vFw).multiplyScalar(cs).addScaledVector(vUn, -sn);
              Y.copy(vFw).multiplyScalar(sn).addScaledVector(vUn, cs);
            }
            const sc = pills ? (0.74 + 0.26 * sstep(0, 2, j)) * (0.72 + 0.28 * sstep(0, 3, milli.nSeg - 1 - j)) : (0.55 + 0.45 * sstep(0, 3, j)) * (0.5 + 0.5 * sstep(0, 4, milli.nSeg - 1 - j));
            mM.makeBasis(X, Y, vB).scale(S3.set(sc, sc, 1)).setPosition(vA);
            if (pills) {
              milli.mesh.setColorAt(k, tcM.setRGB(c, milli.tint[k * 2], milli.tint[k * 2 + 1]));
              if (j === 0) milli.caps.setMatrixAt(m * 2, mM); else if (j === milli.nSeg - 1) milli.caps.setMatrixAt(m * 2 + 1, mM);
            }
            milli.mesh.setMatrixAt(k++, mM);
          }
        }
        if (pills) { milli.mesh.instanceColor.needsUpdate = true; milli.caps.instanceMatrix.needsUpdate = true; }
        milli.mesh.instanceMatrix.needsUpdate = true;
        milli.mesh.material.uniforms.uMisc.value.y = sHead0 / 0.15;
      }

      // ants in file along the arched twig
      for (let i = 0; i < ants.n; i++) {
        const s = (i * ants.gap + 2.2 * time) % ants.len, t = s / ants.len;
        antCurve.getPointAt(t, vA); antCurve.getTangentAt(t, vB);
        vC.copy(UP).addScaledVector(vB, -vB.y).normalize(); X.crossVectors(vC, vB).normalize();
        const sc = 1.35 * sstep(0, 2.5, s) * (1 - sstep(ants.len - 2.5, ants.len, s));
        vA.addScaledVector(vC, 0.5 - 0.14 * t + 0.3 * sc);
        mM.makeBasis(X, vC, vB).scale(S3.set(sc, sc, sc)).setPosition(vA);
        ants.mesh.setMatrixAt(i, mM);
      }
      ants.mesh.instanceMatrix.needsUpdate = true;
      ants.mesh.material.uniforms.uMisc.value.y = 2.2 * time / 0.11;

      // springtails: graze, then leap away in a tumbling arc as the beetle reaches them
      {
        const D = spring.d; let k = 0;
        for (let i = 0; i < spring.n; i++) {
          const o = i * 8; if (D[o + 6] < dist - 70) continue; if (D[o + 6] > dist + 190) break;
          const f = clamp01((dist - D[o + 6]) / speed / 1.15);
          const yaw = Math.atan2(D[o + 3], D[o + 5]) + (f <= 0 ? 0.6 * Math.sin(time * 0.7 + D[o + 7]) : 0);
          E3.set(-f * TAU * 3, yaw, 0, 'YXZ');
          P3.set(D[o] + D[o + 3] * f, mixn(D[o + 1], D[o + 4], f) + 22 * f * (1 - f), D[o + 2] + D[o + 5] * f);
          mM.compose(P3, Q4.setFromEuler(E3), S3.set(1.3, 1.3, 1.3));
          spring.mesh.setMatrixAt(k++, mM);
        }
        spring.mesh.count = k; spring.mesh.instanceMatrix.needsUpdate = true;
        spring.mesh.material.uniforms.uMisc.value.y = time * 3;
      }

      // the mite steps round its patch of the dome
      {
        const a = time * 0.45, x = mite.cx + 0.9 * Math.cos(a), z = mite.cz + 0.9 * Math.sin(a);
        mite.mesh.position.set(x, surfAt(x, z) + 0.5, z);
        mite.mesh.rotation.set(0, Math.atan2(-Math.sin(a), Math.cos(a)), 0); mite.mesh.scale.setScalar(2.0);
        mite.mesh.material.uniforms.uMisc.value.y = time * 5.1;
      }
      if (toad) {
        toad.throat.scale.setScalar(1 + 0.13 * Math.sin(time * 5.5) * (0.6 + 0.4 * Math.sin(time * 0.7)));
        const b = sstep(toad.u - 0.012, toad.u - 0.004, u) * (1 - sstep(toad.u + 0.004, toad.u + 0.014, u));
        for (const lid of toad.lids) lid.rotation.x = mixn(-1.25, 0.25, b);
      }

      // falling leaves
      {
        const D = fall.d;
        for (let i = 0; i < fall.n; i++) {
          if (i === 0) {
            const f = clamp01(u / 0.06), air0 = 1 - sstep(0.85, 1, f), ph0 = time * 1.5, sw0 = Math.sin(ph0);
            P3.set(-3 + (stageXZ[0] + 3) * Math.pow(f, 0.6) + sw0 * air0, stageY + 0.4 + 8.1 * (1 - Math.pow(f, 1.5)) + 0.4 * sw0 * sw0 * air0, stageXZ[1] + 0.8 * Math.cos(time * 0.7) * air0);
            E3.set(0.25 * Math.sin(time * 0.9) * air0, 0.9 + f * 1.4, 0.8 * Math.cos(ph0) * air0, 'YXZ');
            mM.compose(P3, Q4.setFromEuler(E3), S3.set(7.5, 7.5, 7.5)); fall.mesh.setMatrixAt(0, mM); continue;
          }
          const o = i * 8, top = D[o + 3], T = top / 4, cyc = T + 3.5, tt = (((time + D[o + 4]) % cyc) + cyc) % cyc;
          const tf = Math.min(tt, T), h = top - 4 * tf, air = sstep(0, 2.5, h), w = D[o + 7], ph = tf * w * 1.6 + D[o + 5];
          const sw = Math.sin(ph);
          P3.set(D[o] + 3.0 * sw * air, D[o + 1] + h + 0.6 * sw * sw * air, D[o + 2] + 1.2 * Math.cos(tf * w * 0.7 + D[o + 5]) * air);
          E3.set(0.25 * Math.sin(tf * w * 0.9) * air, D[o + 5] + tf * 0.2, 0.85 * Math.cos(ph) * air, 'YXZ');
          const s = D[o + 6] * sstep(0, 0.6, tt) * (1 - sstep(cyc - 0.5, cyc, tt));
          mM.compose(P3, Q4.setFromEuler(E3), S3.set(s, s, s));
          fall.mesh.setMatrixAt(i, mM);
        }
        fall.mesh.instanceMatrix.needsUpdate = true;
      }

      // puffball jets: a raindrop lands on each of three puffballs (u about 0.418, 0.466 and 0.524) and each fires a column
      // of umber spore dust: tight where it leaves the pore, thrown up three puffball-heights in the first half second, its
      // head then swelling and rolling over downwind
      {
        let k = 0;
        for (const j of jets) {
          const jage = j.u >= 0 ? (u - j.u) * DUR : (time + j.off) % j.period, life = j.u >= 0 ? 9 : j.period - 0.5;
          for (let p = 0; p < j.n; p++, k++) {
            const a = puff.seed[k * 4], b = puff.seed[k * 4 + 1], c = puff.seed[k * 4 + 2], e = puff.seed[k * 4 + 3], age = jage - a * 0.5;
            if (age <= 0 || age > life) { puff.col[k * 4] = puff.col[k * 4 + 1] = puff.col[k * 4 + 2] = puff.col[k * 4 + 3] = 0; puff.size[k] = 0; continue; }
            const hMax = j.h * (0.15 + 0.85 * Math.pow(b, 0.65)), rise = Math.min(9.5, hMax * (1 - Math.exp(-age * 3.4)) + 0.3 * age * b);
            const top = Math.min(1.2, rise / j.h), roll = Math.max(0, age - 0.25), head = top * top, rk = Math.pow(roll, 0.6);
            const rad = (0.3 + 0.13 * rise + 1.9 * head * rk) * (0.3 + 0.7 * e), ang = c * TAU + (b - 0.5) * 1.6 * age;
            const drift = j.wind * head * (0.35 * age + 1.5 * Math.pow(roll, 1.2));
            puff.pos[k * 3] = j.x + Math.cos(ang) * rad + j.wx * drift;
            puff.pos[k * 3 + 1] = j.y + 0.2 + rise + 0.45 * rad * Math.sin(ang * 2 + age * 1.3) - 0.3 * head * roll;
            puff.pos[k * 3 + 2] = j.z + Math.sin(ang) * rad + j.wz * drift;
            const al = 0.4 * sstep(0, 0.06, age) * Math.exp(-Math.max(0, age - 1.6) * 0.32) * (1 - sstep(life - 1.5, life, age)) * (1 - 0.3 * e * head);
            const cm = Math.min(1, e * e * (0.35 + 0.65 * top) + 0.12 * roll);
            puff.col[k * 4] = mixn(smokeCore.r, smokeEdge.r, cm) * al; puff.col[k * 4 + 1] = mixn(smokeCore.g, smokeEdge.g, cm) * al; puff.col[k * 4 + 2] = mixn(smokeCore.b, smokeEdge.b, cm) * al; puff.col[k * 4 + 3] = al;
            puff.size[k] = (0.85 + 0.75 * e) * (0.55 + 0.6 * top) + 1.05 * head * rk;
          }
        }
        puff.geo.attributes.position.needsUpdate = true; puff.geo.attributes.aC.needsUpdate = true; puff.geo.attributes.aSz.needsUpdate = true;
      }
      // the three that fire flinch under the drop and ring for a moment
      for (let i = 0; i < 3; i++) {
        const age = (u - jets[i].u) * DUR, kq = age > 0 && age < 2.5 ? Math.exp(-age * 3.2) * Math.cos(age * 13) * sstep(0, 0.05, age) : 0, m = puffStage[i];
        m.scale.set(1 + 0.07 * kq, 1 - 0.16 * kq, 1 + 0.07 * kq); m.updateMatrix();
      }
      if (rain) {
        // the drops themselves: glass buns that fall 35 m in a second and a half, and the crown each bursts into
        for (let i = 0; i < 4; i++) {
          let x = 0, y = -999, z = 0, s = 0, ca = 0;
          const j = i < 3 ? jets[i] : null, uu = j ? j.u : toad ? toad.u - 0.012 : -9, age = (u - uu) * DUR, p = j || (toad ? toad.back : null);
          if (p && age > -1.4 && age < 0.02) { x = p.x; z = p.z; y = p.y + 0.8 + 25 * Math.max(-age, 0); s = 0.95; }
          mM.makeScale(s, s, s).setPosition(x, y, z); rain.setMatrixAt(i, mM);
          if (p && age > 0 && age < 1.6) ca = age / 1.6;
          crownA.setX(i, ca);
          if (p) { mM.makeScale(1.35, 1.35, 1.35).setPosition(p.x, p.y + 0.05, p.z); crowns.setMatrixAt(i, mM); }
        }
        rain.instanceMatrix.needsUpdate = true; crowns.instanceMatrix.needsUpdate = true; crownA.needsUpdate = true;
      }
    }
    update(0, 0, { position: path.start.clone(), matrixWorld: new THREE.Matrix4().setPosition(path.start) }, 0);

    return {
      scene, path, duration: DUR,
      // linger among the fly agarics and under the gills; hurry the moss between the arcade and the snail and the first
      // of the branch; the last tenth runs at the average
      pace: (u) => 1 + 0.22 * sstep(0.1, 0.15, u) * (1 - sstep(0.2, 0.25, u)) - 0.2 * sstep(0.36, 0.42, u) * (1 - sstep(0.54, 0.6, u))
        - 0.28 * sstep(0.63, 0.69, u) * (1 - sstep(0.77, 0.82, u)) + 0.18 * sstep(0.8, 0.84, u) * (1 - sstep(0.86, 0.9, u)),
      camera: { fov: 62, near: 0.3, far: 3200, lookAhead: 24, sway: 0.8, bank: 0.6 },
      pois: [
        { at: gaze.snail, from: uSnail - 0.1, to: uSnail + 0.04, weight: 0.55 },
        { at: antGaze, from: uAnt - 0.11, to: uAnt + 0.03, weight: 0.5 },
        { at: gaze.cap, from: uAnt, to: U_BANK + 0.02, weight: 0.4 },
        { at: hero.anchors.hub, from: U_BANK - 0.02, to: 0.797, weight: 0.8, fade: 0.13 },
        { at: twoGaze, from: 0.762, to: 0.824, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: LOOK.portal, glow: 1, revealDistance: 190 },
      post: {
        exposure: LOOK.exposure, bloom: { strength: LOOK.bloom, radius: 0.6, threshold: 0.9 },
        grade: { saturation: LOOK.sat, contrast: 1.05, tint: LOOK.tint, shadowTint: LOOK.shadow, vignette: 0.34, grain: 0.02, aberration: 0 },
      },
      ride: 'none',
      _info: { hour, weather, season, snailMorph, bronze, pills, rare, U_BANK, U_CREST, U_HUB, U_BR, U_BREND, uSnail, uMite: dMite / L, uAnt, uToad: toad ? toad.u : -1, uMilli: milli.uMid, leafSkips, jets: jets.slice(0, 3).map((j) => ({ u: j.u, x: j.x, y: j.y, z: j.z, h: j.h })), agarics, puffballs: puffballs.slice(0, 3) },
      update,
      dispose() {},
    };
  },
};
