// THE COMBED SEA: hero set piece for the world "combed-sea".
//
// What it is
//   The whole marbled sea and the comb of nine skerries, drawn as Turkish ebru. The sea is one
//   camera-following radial grid riding a three-sine swell; its fragment shader takes the undisplaced
//   xz of every fragment back through a list of at most 24 closed-form marbling OPERATIONS (newest
//   first) and reads a base of battal stones (7 m jittered cells of concentric pigment bands, every
//   border rimmed lamp-black, gall lace and pinhole bubbles inside). Under the squall a second layer
//   of round rain stones lies on top of the wound sheet and pulses outward. Built in: the Great Eddy (a vortex that keeps winding),
//   two counter-spinning satellite eddies, two creep shears, the race's back-and-forth (gel-git), the
//   row comb (one tine through each of the eight gaps: the chevrons), the NONPAREIL FIELD beyond the
//   row (north of the row arc, |x| < 262, to z -722, the stones give way to ranks 14 m deep: four bands of
//   pigment across the tide, the dominant one cycling turquoise, jade, cream; the fine comb draws them into
//   feathers 2.5 m wide and the tide carries the ranks north through the comb at 0.5 m/s: fieldSd() and
//   rankBand() in SEA_FRAG, uniforms uField / uRank), and the portal's clean ring of still water with
//   four pressed bands (cream, turquoise, navy, cream, 2 m each) round it. Everything else that touches the sea (great
//   drops, hull strokes, fin strokes, shark lenses, tern rings) is added by the world through hero.ops.
//   The skerries are lamp-black and slate two-step rock with drawn beds, joints, guano streaks and
//   cream / jade spot-marbling, a cream foam-lace collar riding the swell and a swaying jade kelp fringe.
//
// Local space == the brief's world space. Place the object at the origin, unrotated, scale 1.
//   north = -z, east = +x, still sea level y = 0. Eddy centre (-70, -40). Skerry row on an arc of
//   radius 300 about it; the flown gap is centred (0, -330), 46 m wide, between the 60 m and 52 m
//   stacks. Portal ring centred (0, -556).
//
// THE STYLE (reuse it for everything else in the world)
//   export EBRU_GLSL      uniforms uPig[8], uHazeCol, uHaze + ebHash1/2/3, ebHaze(dist), ebPig(i)
//   export SWELL_GLSL     uniforms uSwell[3], uTime + float ebSwell(vec2 xz)   (vertex or fragment)
//   export styleMaterial(opts)   the two-step pigment material for every solid (hulls, sails, sharks,
//       birds, cloud): lit pigment = vertex colour (or opts.color), shadow pigment = 35 % toward navy,
//       split by a lamp-black hairline at the terminator, silhouette hairline, optional spot-marbling,
//       paper haze. opts: { color, vertexColors, spots (0..1), spotCell (m), spotCream (0..1), side,
//       bias (terminator shift), outline (0..1), transparent, vertDecl, vertMain (GLSL, may move
//       `op` / `on`), fragDecl, fragPigment (GLSL, may change `pig`, `rim`, `spotCream`, `spotAmt`),
//       uniforms (extra) }. Works with InstancedMesh. It shares hero.uniforms (palette, haze, sun,
//       swell, time) when you pass opts.shared = hero.uniforms; otherwise it makes its own.
//   Pigment indices: 0 navy ground, 1 turquoise, 2 jade, 3 cream, 4 ochre, 5 lamp-black rim,
//       6 slate, 7 still water. Cream is capped at 0.78 albedo. Haze: 20 % at 600 m, 55 % at 3 km,
//       toward uHazeCol (horizon cream): hero.setHaze(colour, scale).
//   No scene fog is used (fog: false everywhere): the haze is in every shader, as the brief asks.
//
// hero.ops (sea operations; every add returns a handle with set(fields) and remove())
//   addDrop({ x, z, r, pigment = 3, core = 0, corePigment = 7, lens = 0, bandW = 0, order })
//       a drop of pigment radius r pushing everything outward. core 0..1: inner fraction of the radius
//       drawn in corePigment (a ring). bandW > 0: the annulus between core and rim is drawn as concentric
//       bands bandW metres wide (pigment, turquoise, navy, pigment ...), each rimmed. lens > 0: the core is drawn at that alpha (shark lens; call
//       hero.enableLens(true) once and draw the sharks before the sea).
//   addStroke({ x0, z0, x1, z1, drag = 14, width = 7, head, tail = 12, order })
//       a tine from (x0,z0) to the moving point (x1,z1): set({ x1, z1 }) every frame behind a hull or fin.
//   addComb({ x, z, dirX, dirZ, drag, sharp, spacing, alternate, sMin, sMax, halfWidth, order })
//   addVortex({ x, z, angle, radius, order }), addShear({ dirX, dirZ, amp, wavelength, phase, order })
//   addRingField({ x, z, radius, cell = 16, maxR = 3, period = 6, density = .6, pigment = 3, order })
//       many small rings that open, thin and vanish (tern plunges) without displacing the sheet. A ring
//       thinner than about 1.5 px along the pixel footprint's long axis is faded out, not drawn as dashes.
//   addGapTines(...) is the row comb (already added). Operations are applied in `order` (default 50+,
//   in the order added; built-ins use 0-12 and the portal ring 100, so it is always newest). Drop
//   rims are measured in the drop's own stage, so a rim thins where a NEWER operation squeezes it.
//   A stroke's head is at least 1.7 x drag long (the inverse is solved with two fixed-point steps).
//   ops.free() says how many of the 24 slots are left (15 with the built-ins). A handle's `fields` object may
//   be written directly (handle.fields.r = ...): that is what set() does, without making a new object.
//   FILTERING: bands melt to their cell's (or rank's) mean before they are thinner than about 2 px, and cells
//   and ranks melt to the region's mean, both judged along the pixel footprint's LONG axis (cq, fwT in
//   SEA_FRAG), so raked pattern seen at a grazing angle goes calm instead of breaking into dashes.
//
// Other hooks
//   hero.setProgress(u)     world path progress 0..1: opens the portal ring (still water 0 at u .45, 30 m
//                           across by u .64, 40 m by u .8, 44 m by u .93, plus 8 m of pressed bands all
//                           round). Never wall-clock.
//                           If it is never called the ring stands open at 44 m (viewer).
//   hero.setRing(diameter)  overrides the above directly.
//   hero.setRain(zEdge, feather, rate)  stones under z > zEdge gain `rate` rings a second (default
//                           60, 50, 0.5: the squall over the entry). rate 0 stops it.
//   hero.setSun(dir)        Vector3 TOWARD the sun (default due east, 42 degrees up).
//   hero.setHighlight(k, c) strength of the wet dash column and, optionally, its linear colour (THREE.Color; default
//                           cream at 1.25) (default strength 1; it never draws on still water
//                           or in a lens).  hero.setGlow(k): disturbed bright pigment glows (night).
//   hero.enableLens(on)     makes the sea a blended material so lens drops show what swims beneath.
//   hero.heightAt(x, z, t)  JS mirror of the swell (t defaults to the last update time).
//   hero.uniforms           shared uniform objects (uTime, uSwell, uPig, uHazeCol, uHaze, uSunDir).
//   hero.stacks             [{ x, z, yaw, length, thick, height, flatTop, top: Vector3 }] west to east.
//
// anchors (local space)
//   portalSeat   { position (0, 4.5, -554.4), normal (direction the portal faces: back up the 55
//                degree dive), radius 7, ringCentre (0, 0, -556) }
//   flyThrough   the brief's path, entry to portal; >= 6 m clear of rock (23 m in the gap).
//   gap          centre of the flown gap at sea level; gapWidth 46.
//   eddyCentre, satellites [{ position, radius }], rowCentre (arc centre), rowRadius.
//   viewpoints   { entry, overEddy, raceApproach, overField }: composed camera positions.
//   greatStacks  [west 60 m top, east 52 m top]: kittiwake wheel centres / gaze targets.
//   ledges       points on the two great stacks' faces for birds to sit or peel off from.
//
// opts: palette (the brief's seven hex strings), sunDir, rain (false: no rain layer is compiled),
//   arms (2 | 3), ring (false: no built-in portal ring), skerries (false: sea only), hazeColor.
// Per seed: which way the eddy winds, 2 or 3 arms, its turns, where the satellites sit, every stack's
//   plan, terraces, dip, fissures, crown and blocks, the two flat tops, gap widths, comb spacings.
// Size: sea radius 3,200 m about the camera (paint the sky dome below the horizon with the hazed
//   sea mean); skerry row 520 m; tallest stack 60 m. The returned radius / height / center frame the
//   flown gap and its two great stacks for the viewer; the true extent is in the anchors.
// Cost: 60k (sea) + 40k (rock) + 12.5k (collars, kelp) = about 113k triangles, 4 draw calls, no
//   lights, about 250 ms to build. The sea fragment shader is the heavy part (24 operations, two
//   stone layers and the lace): at ctx.quality.detail < 0.7 the lace and bubbles are compiled out.
// Lighting: none. Colour is pigment; the only light is the direction passed to setSun().
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const NOPS = 24;
const DEFAULT_PALETTE = ['#0F1D40', '#1E9FA6', '#3F8F6E', '#F2E7C9', '#C98A2B', '#17151C', '#5B6672'];
const EDDY = { x: -70, z: -40, r: 300 };
const RING = { x: 0, z: -556 };

export const EBRU_GLSL = /* glsl */`
uniform vec3 uPig[8];
uniform vec3 uHazeCol;
uniform vec4 uHaze;
float ebHash1(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
vec2 ebHash2(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
vec3 ebHash3(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
float ebHaze(float d){ return uHaze.z * (1. - exp(-pow(max(d, 0.) / uHaze.x, uHaze.y))); }
vec3 ebPig(float i){ return uPig[int(clamp(i, 0., 7.) + .5)]; }
`;

export const SWELL_GLSL = /* glsl */`
uniform vec4 uSwell[3];
uniform float uTime;
float ebSwell(vec2 xz){
  float h = 0.;
  for (int i = 0; i < 3; i++) { vec4 s = uSwell[i]; h += s.w * sin(dot(xz, s.xy) * s.z - sqrt(9.81 * s.z) * uTime + float(i) * 1.7); }
  return h;
}
`;

const SEA_VERT = /* glsl */`
precision highp float;
${SWELL_GLSL}
uniform vec2 uSnap;
varying vec2 vXZ;
varying vec3 vWP;
void main(){
  vec3 lp = vec3(position.x + uSnap.x, 0., position.z + uSnap.y);
  lp.y = ebSwell(lp.xz);
  vXZ = lp.xz; vWP = lp;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(lp, 1.);
}
`;

// The sea. Operations are walked newest first; nothing in the loops takes a derivative or a texture.
const SEA_FRAG = /* glsl */`
precision highp float;
#define NOPS ${NOPS}
#define CELL 7.0
${EBRU_GLSL}
uniform vec4 uOpA[NOPS];
uniform vec4 uOpB[NOPS];
uniform vec4 uOpC[NOPS];
uniform vec4 uGap[8];
uniform vec4 uEddy;
uniform vec4 uSat[2];
uniform vec4 uRain;
uniform vec3 uSunDir;
uniform vec3 uCamL;
uniform float uTime;
uniform float uHi;
uniform vec3 uHiCol;
uniform float uGlow;
uniform float uSeed;
uniform float uDetail;
uniform vec4 uField;
uniform vec2 uRank;
varying vec2 vXZ;
varying vec3 vWP;

float tineRamp(float s, float s0, float s1, float hd, float tl){
  return smoothstep(s0 - tl, s0 + tl, s) * (1. - smoothstep(s1 - hd, s1, s));
}
float vnoise(vec2 p){
  vec2 i = floor(p), f = p - i; f = f * f * (3. - 2. * f);
  return mix(mix(ebHash1(i), ebHash1(i + vec2(1., 0.)), f.x), mix(ebHash1(i + vec2(0., 1.)), ebHash1(i + vec2(1., 1.)), f.x), f.y);
}
// share of bloom pigment (0 = bare navy sea, 1 = thick bloom) in BASE space: straight spokes that the
// eddy operation winds into the spiral
float bloomMask(vec2 pb){
  vec2 q = pb - uEddy.xy + vec2(1e-3, 0.);
  float d = length(q), th = atan(q.y, q.x);
  float env = 1. - smoothstep(uEddy.z * .3, uEddy.z * 1.05, d);
  float arms = .5 + .5 * cos(th * uEddy.w + 2.2 * vnoise(pb * .012 + 3.));
  arms = smoothstep(.4, .78, arms);
  float m = env * (.12 + .88 * arms) + .7 * (1. - smoothstep(10., 95., d));
  for (int i = 0; i < 2; i++) { m += .9 * (1. - smoothstep(uSat[i].z * .35, uSat[i].z * 1.15, length(pb - uSat[i].xy))); }
  m += .4 * smoothstep(.6, .82, vnoise(pb * .0045 + 9.)) * (1. - env);
  return clamp(m, 0., 1.);
}
float navyShare(float m){ return mix(.85, .27, m); }
// pigment index of band n in cell id
float pigOf(vec2 id, float n, float navyW){
  float h = ebHash1(id * 1.73 + vec2(n * 13.17 + 3.1, n * 7.31 - 1.7));
  float h2 = ebHash1(id * 2.31 + vec2(n * 5.77 - 8.3, n * 3.13 + 2.9));
  if (h < navyW) return h2 < .55 ? 0. : 7.;
  float t = (h - navyW) / max(1. - navyW, 1e-3);
  return t < .42 ? 1. : (t < .72 ? 2. : 3.);
}
vec3 seaPig(float i){
  // 7 inside the base is the ground laid a little thinner (navy leaning to turquoise), not still water
  return i > 6.5 ? mix(uPig[0], uPig[1], .17) : ebPig(i);
}
vec3 regionMean(float m){
  float nw = navyShare(m);
  // averaged the way the eye reads a marbled sheet from afar (in root space), so the far sea stays ink
  vec3 navy = sqrt(mix(uPig[0], mix(uPig[0], uPig[1], .17), .45));
  vec3 bright = sqrt(uPig[1]) * .42 + sqrt(uPig[2]) * .30 + sqrt(uPig[3]) * .28;
  vec3 v = mix(bright, navy, nw);
  return v * v;
}
// THE NONPAREIL FIELD. North of the row the sheet is laid in RANKS 14 m deep: bands of pigment lying across
// the tide, four to a rank (a wide dominant band that cycles turquoise, jade, cream from rank to rank, a navy
// band, a narrower band of one of the other two, a thin navy band), which the fine comb draws into feathers.
// Read in the space before the shears and eddies are undone, so the ranks stay square to the comb.
// uField: row arc radius, half width, north edge z, tide shift (m). uRank: rank depth, seed.
float fieldSd(vec2 pf){
  float a = uField.x - length(pf - uEddy.xy);
  return max(max(a, abs(pf.x) - uField.y), max(uField.z - pf.y, pf.y + 215.));
}
// band coordinate at rank coordinate t (whole part: rank * 4 + band), the band's pigment, the rank's mean
float rankBand(float t, out float pig, out vec3 mean){
  float R = floor(t), f = t - R;
  float A = 1. + mod(R, 3.);
  float B = 1. + mod(A - 1. + (ebHash1(vec2(R * 1.37 + 2.1, uRank.y)) < .5 ? 1. : 2.), 3.);
  float k = 3., lo = .83, hi = 1.; pig = 7.;
  if (f < .46) { k = 0.; lo = 0.; hi = .46; pig = A; }
  else if (f < .62) { k = 1.; lo = .46; hi = .62; pig = 0.; }
  else if (f < .83) { k = 2.; lo = .62; hi = .83; pig = B; }
  vec3 m = .46 * sqrt(ebPig(A)) + .21 * sqrt(ebPig(B)) + .33 * sqrt(mix(uPig[0], uPig[1], .06));
  mean = m * m;
  return R * 4. + k + (f - lo) / (hi - lo);
}
// one layer of battal stones at pp: nearest cell, its neighbour, the distance to the wall between them
void stoneCell(vec2 pp, float seed, out vec2 id1, out vec2 id2, out vec2 hh1, out vec2 hh2, out float d1, out float d2, out float eCell, out vec2 cen){
  vec2 q = pp / CELL + seed; vec2 g = floor(q); vec2 f = q - g;
  d1 = 1e3; d2 = 1e3; vec2 r1 = vec2(0.), r2 = vec2(1., 0.);
  id1 = g; id2 = g; hh1 = vec2(0.); hh2 = vec2(0.);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 h = ebHash2(g + o);
      vec2 r = o + .5 + .72 * (h - .5) - f;
      float d = dot(r, r);
      if (d < d1) { d2 = d1; r2 = r1; id2 = id1; hh2 = hh1; d1 = d; r1 = r; id1 = g + o; hh1 = h; }
      else if (d < d2) { d2 = d; r2 = r; id2 = g + o; hh2 = h; }
    }
  }
  vec2 dr = r2 - r1;
  eCell = dot(.5 * (r1 + r2), dr / max(length(dr), 1e-4)) * CELL;
  cen = (id1 + .5 + .72 * (hh1 - .5) - seed) * CELL;
}
float rimLine(float px, float w){ return 1. - smoothstep(w * .5 - .5, w * .5 + .5, px); }
void main(){
  vec2 p = vXZ;
  vec2 dxp = dFdx(vXZ), dyp = dFdy(vXZ);
  float mpp = max(.5 * (abs(dxp.x) + abs(dyp.x) + abs(dxp.y) + abs(dyp.y)), 1e-5);
  float rimW = max(1.2, .04 / mpp);
  float camD = length(vWP - uCamL);
  float fmax = max(max(length(dxp), length(dyp)), 1e-6);        // metres a pixel along its long axis
  float ringA = 0., ringPig = 3., pxRing = 1e5;

  float pxDrop = 1e5;
  float capPig = -1.;
  float lensA = 0.;
  float disturb = 0.;
  bool gotPre = false, gotF = false;
  vec2 pPre = p, pF = p;
  for (int i = 0; i < NOPS; i++) {
    int k = NOPS - 1 - i;
    vec4 A = uOpA[k]; vec4 B = uOpB[k]; vec4 C = uOpC[k];
    int ty = int(C.w + .5);
    if (ty == 0) continue;
    if (ty == 1) {                                   // DROP  A: x z r coreFrac   B: pigment corePigment lensAlpha
      vec2 d = p - A.xy; float d2 = dot(d, d); float dl = sqrt(d2);
      vec2 nrm = d / max(dl, 1e-4);
      float fn = max(abs(dot(dxp, nrm)) + abs(dot(dyp, nrm)), 1e-6);
      float sd = dl - A.z;
      pxDrop = min(pxDrop, abs(sd) / fn);
      if (sd < 0.) {
        float sd2 = dl - A.z * A.w;
        bool core = A.w > .001 && sd2 < 0.;
        if (A.w > .001) pxDrop = min(pxDrop, abs(sd2) / fn);
        float cp = B.x;
        if (C.x > .01 && !core) {                      // pressed bands between the core and the rim (C.x m each)
          float bq = sd2 / C.x, bk = floor(bq), bfq = bq - bk, bpx = C.x / fn;
          pxDrop = min(pxDrop, min(bfq, 1. - bfq) * bpx + max(0., 3. - bpx) * 2.);
          float m3 = mod(bk, 3.);
          cp = (m3 < .5 || bpx < 1.2) ? B.x : (m3 < 1.5 ? 1. : 0.);
        }
        capPig = core ? B.y : cp;
        lensA = core ? B.z : 0.;
        break;
      }
      float k2 = A.z * A.z / max(d2, 1e-4);
      float sh = sqrt(max(1. - k2, 0.));
      p = A.xy + d * sh;
      disturb += dl * (1. - sh);
    } else if (ty == 2) {                            // STROKE  A: x0 z0 mx mz   B: drag L length head   C: tail
      vec2 q = p - A.xy; float s = dot(q, A.zw); float v = q.x * A.w - q.y * A.z;
      float e = B.x * exp(-abs(v) / max(B.y, 1e-3));
      float ss = s - e * tineRamp(s, 0., B.z, B.w, C.x);
      ss = s - e * tineRamp(ss, 0., B.z, B.w, C.x);
      float dsp = e * tineRamp(ss, 0., B.z, B.w, C.x);
      p -= A.zw * dsp;
      disturb += dsp;
    } else if (ty == 3) {                            // COMB  A: x z mx mz   B: drag L spacing(<0: back-and-forth) feather   C: sMin sMax halfWidth
      vec2 q = p - A.xy; float s = dot(q, A.zw); float v = q.x * A.w - q.y * A.z;
      float sp = abs(B.z); float t = v / sp; float k0 = floor(t); float f = (t - k0) * sp;
      float sg = (B.z < 0. && mod(k0, 2.) > .5) ? -1. : 1.;
      float sg1 = B.z < 0. ? -sg : sg;
      float e = B.x * (sg * exp(-f / B.y) + sg1 * exp(-(sp - f) / B.y));
      float fe = B.w * (C.y - C.x);
      float w = smoothstep(C.x, C.x + fe, s) * (1. - smoothstep(C.y - fe, C.y, s)) * (1. - smoothstep(C.z * .65, C.z, abs(v)));
      p -= A.zw * e * w;
    } else if (ty == 4) {                            // VORTEX  A: x z angle R
      if (!gotPre) { pPre = p; gotPre = true; }
      if (A.w > 60. && !gotF) { pF = p; gotF = true; }
      vec2 q = p - A.xy; float d = length(q);
      float a = -A.z * exp(-d / max(A.w, 1e-3));
      float c = cos(a), sn = sin(a);
      p = A.xy + vec2(c * q.x - sn * q.y, sn * q.x + c * q.y);
    } else if (ty == 5) {                            // SHEAR  A: dx dz amp k   B: phase
      if (!gotF) { pF = p; gotF = true; }
      float v = p.y * A.x - p.x * A.y;
      p -= A.xy * A.z * sin(A.w * v + B.x);
    } else if (ty == 6) {                            // GAP TINES  A: x z mx mz   B: approach runout head tail
      vec2 q = p - A.xy; float s = dot(q, A.zw); float v = q.x * A.w - q.y * A.z;
      float ss = s;
      for (int it = 0; it < 3; it++) {
        float acc = 0.;
        for (int g = 0; g < 8; g++) {
          vec4 G = uGap[g];
          acc += G.w * exp(-abs(v - G.x) / max(G.z, 1e-3)) * tineRamp(ss - G.y, -B.x, B.y, B.z, B.w);
        }
        ss = s - acc;
      }
      p -= A.zw * (s - ss);
      disturb += (s - ss) * .25;
    } else if (ty == 7) {                            // RING FIELD  A: x z regionR cell   B: maxR period density pigment   C: phase area seed
      vec2 q = (p - A.xy) / A.w; vec2 g = floor(q);
      float h0 = ebHash1(g + C.z + 4.4);
      float tt = uTime / max(B.y, .1) + h0 * 9.7 + C.x;
      float cyc = floor(tt), ph = tt - cyc;
      vec2 h = ebHash2(g + C.z + cyc * 7.13);
      float rr = min(B.x / A.w, .45);
      vec2 c = g + rr + (1. - 2. * rr) * h;
      float on = step(ebHash1(g + C.z + cyc * 3.71), B.z) * step(length(c) * A.w, A.z);
      float R = B.x * sqrt(ph);
      float wdt = min(R, C.y / max(2. * R, 1e-3)) * (1. - smoothstep(.8, 1., ph));
      vec2 dq = q - c; float dl = length(dq) * A.w;
      float sdr = abs(dl - R) - .5 * wdt;
      // (a ring whose band is thinner than a pixel and a half along the footprint's long axis is not drawn: at a
      //  grazing angle it would break into dashes. Rings displace nothing, so the walk goes on underneath.)
      float vis = on * step(.003, wdt) * smoothstep(1.2, 2.4, wdt / fmax);
      if (vis > 0.) {
        vec2 nrm = dq / max(length(dq), 1e-4);
        float fn = max(abs(dot(dxp, nrm)) + abs(dot(dyp, nrm)), 1e-6);
        pxRing = min(pxRing, abs(sdr) / fn + (1. - vis) * 4.);
        if (sdr < 0.) { ringA = vis; ringPig = B.w; }
      }
    }
  }

  // ---- stones (always evaluated so that every derivative stays at the top level)
  vec2 pb = p;
  if (!gotPre) pPre = p;
  vec2 id1, id2, hh1, hh2, cen; float d1, d2, eCell;
  stoneCell(pb, uSeed, id1, id2, hh1, hh2, d1, d2, eCell, cen);
  float mC = bloomMask(cen);
  float navyW = navyShare(mC);
  float b = hh1.x * 6. + ebHash1(id1 + 7.7) * 3. - d1 * CELL * CELL / (3. + 4. * hh1.y);
  float b2 = hh2.x * 6. + ebHash1(id2 + 7.7) * 3. - d2 * CELL * CELL / (3. + 4. * hh2.y);
  // the nonpareil field takes the place of the stones north of the row
  if (!gotF) pF = p;
  float sdF = fieldSd(pF);
  float inF = step(sdF, 0.);
  float tF = (pF.y + uField.w + 2.4 * sin(pF.x * .019 + 1.3) + 1.1 * sin(pF.x * .053 + 4.)) / uRank.x;
  float pigF; vec3 meanF;
  float bFld = rankBand(tF, pigF, meanF);
  b = mix(b, bFld, inF);
  float n = floor(b), bf = b - n;
  float pIdx = inF > .5 ? pigF : pigOf(id1, n, navyW);
  float pNb = inF > .5 ? -1. : pigOf(id1, bf < .5 ? n - 1. : n + 1., navyW);
  float mP = bloomMask(pb);
  float pCell2 = pigOf(id2, floor(b2), navyW);
  float pMean = pigOf(id1, -3., navyW);
  float laceOn = step(.42, ebHash1(id1 + 2.2));
  vec2 q = pb / CELL;

#ifdef LACE
  // gall lace: hairline cells in mapped space
  vec2 ql = pb / .85 + 17.; vec2 gq = floor(ql); vec2 fl = ql - gq;
  float l1 = 1e3, l2 = 1e3; vec2 s1 = vec2(0.), s2 = vec2(1., 0.);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 r = o + .5 + .8 * (ebHash2(gq + o + 31.) - .5) - fl;
      float d = dot(r, r);
      if (d < l1) { l2 = l1; s2 = s1; l1 = d; s1 = r; }
      else if (d < l2) { l2 = d; s2 = r; }
    }
  }
  vec2 dls = s2 - s1;
  float eLace = dot(.5 * (s1 + s2), dls / max(length(dls), 1e-4)) * .85;
#endif

#ifdef RAIN
  // rain stones: round drops laid on top of the wound sheet (in the space before the eddies are undone)
  vec2 idR, idR2, hR, hR2, cenR; float dR, dR2, eR;
  stoneCell(pPre, uSeed + 41.3, idR, idR2, hR, hR2, dR, dR2, eR, cenR);
  float rainOn = step(.001, uRain.z);
  float present = step(ebHash1(idR + 91.7), .94 * smoothstep(uRain.x, uRain.x + uRain.y, cenR.y)) * rainOn;
  vec2 cenR2 = (idR2 + .5 + .72 * (hR2 - .5) - uSeed - 41.3) * CELL;
  float present2 = step(ebHash1(idR2 + 91.7), .94 * smoothstep(uRain.x, uRain.x + uRain.y, cenR2.y)) * step(sqrt(dR2) * CELL, CELL * (.3 + .13 * hR2.y) + .2);
  float sdS = sqrt(dR) * CELL - CELL * (.3 + .13 * hR.y);
  float bR = hR.x * 6. + uRain.z * uTime * (.7 + .6 * ebHash1(idR + 3.3)) - dR * CELL * CELL / (2.2 + 2.6 * hR.x);
  float nR = floor(bR), bfR = bR - nR;
  float pR = pigOf(idR, nR, .5);
  float pRn = pigOf(idR, bfR < .5 ? nR - 1. : nR + 1., .5);
  vec2 qR = pPre / CELL;
#endif

  // ---- derivatives, once, after every loop
  float fwB = fwidth(b);
  // cells per pixel along the WORST screen axis: a footprint that is long one way and thin the other (raked
  // pattern seen at a grazing angle) must melt as soon as its thin side nears a pixel, or it breaks into dashes
  float cq = max(length(dFdx(q)), length(dFdy(q))) * 1.3;
  float fwC = fwidth(eCell);
  float fwT = max(abs(dFdx(tF)), abs(dFdy(tF))) * 1.3;
  float fwF = fwidth(sdF);

  float bandLod = 1. - smoothstep(.08, .32, fwB);
  float cellLod = (1. - smoothstep(.12, .38, cq)) * (1. - inF);
  float farK = smoothstep(.25, .6, cq);
  float rimB = rimLine(min(bf, 1. - bf) / max(fwB, 1e-5), rimW) * bandLod * (abs(pNb - pIdx) < .5 ? .28 : 1.);
  float rimC = rimLine(eCell / max(fwC, 1e-5), rimW) * cellLod * (abs(pCell2 - pIdx) < .5 ? .34 : 1.);
  rimC = max(rimC, rimLine(abs(sdF) / max(fwF, 1e-5), rimW) * (1. - farK));
  // a hairline rib down the middle of every dominant band
  rimC = max(rimC, rimLine(abs(fract(tF) - .23) / max(fwT / 1.3, 1e-5), 1.) * (1. - smoothstep(.016, .05, fwT)) * inF * .75);

  vec3 cPig = seaPig(pIdx);
#ifdef LACE
  float fwL = fwidth(eLace);
  float lq = max(length(dFdx(ql)), length(dFdy(ql))) * 1.3;
  float lace = rimLine(eLace / max(fwL, 1e-5), max(1., .022 / mpp)) * (1. - smoothstep(.1, .3, lq)) * laceOn;
  vec3 laceCol = abs(pIdx - 3.) < .5 ? mix(uPig[3], uPig[0], .45) : mix(cPig, uPig[3], .62);
  cPig = mix(cPig, laceCol, lace * .85);
  // pinhole bubbles near the camera
  vec2 qb = pPre / .42 + 5.; vec2 gb = floor(qb); vec2 hb = ebHash2(gb + 77.);
  vec2 cb = gb + .15 + .7 * ebHash2(gb + 3.3);
  float db = length(qb - cb) * .42 - (.011 + .016 * hb.x);
  float bubOn = step(hb.y, .3) * (1. - smoothstep(22., 40., camD));
  cPig = mix(cPig, uPig[5], bubOn * (1. - smoothstep(-.5, .5, (db - .012) / mpp)));
  cPig = mix(cPig, uPig[3], bubOn * (1. - smoothstep(-.5, .5, db / mpp)));
#endif

  // far colour: the region's mean (continuous, not per cell); the field's own mean fades in from its edge
  float edgeF = smoothstep(0., 50., -sdF);
  // (melted, the field goes to a calmer, darker mean than its ranks: the far sea stays ink under the pale sky)
  vec3 rMean = regionMean(mix(mP, mix(mP, .14, edgeF), inF));
  vec3 cellMean = mix(mix(rMean, seaPig(pMean), .5), meanF, inF);
  vec3 base = mix(cPig, cellMean, smoothstep(.22, .46, fwB));
  float farF = max(smoothstep(.16, .4, fwT), (1. - edgeF) * smoothstep(.12, .4, cq));
  base = mix(base, rMean, mix(farK, farF, inF));
  base = mix(base, uPig[5], max(rimB, rimC) * .92);

#ifdef RAIN
  float fwBR = fwidth(bR);
  float cqR = max(length(dFdx(qR)), length(dFdy(qR))) * 1.3;
  float fwER = fwidth(eR);
  float fwSd = fwidth(sdS);
  float rainLod = (1. - smoothstep(.25, .6, cqR)) * present;
  vec3 colR = mix(seaPig(pR), mix(uPig[0], uPig[1], .3), smoothstep(.22, .46, fwBR));
  float rimBR = rimLine(min(bfR, 1. - bfR) / max(fwBR, 1e-5), rimW) * (1. - smoothstep(.08, .32, fwBR)) * (abs(pRn - pR) < .5 ? .28 : 1.);
  float rimCR = rimLine(eR / max(fwER, 1e-5), rimW) * present2 * (1. - smoothstep(.15, .45, cqR));
  colR = mix(colR, uPig[5], max(rimBR, rimCR) * .92);
  base = mix(base, colR, rainLod * step(sdS, 0.));
  base = mix(base, uPig[5], rimLine(abs(sdS) / max(fwSd, 1e-5), rimW) * rainLod * .92);
#endif

  vec3 capCol = capPig > 6.5 ? uPig[7] : ebPig(max(capPig, 0.));
  vec3 col = capPig > -.5 ? capCol : base;
  float bright = capPig > -.5 ? step(.5, capPig) * step(capPig, 3.5) : step(.5, pIdx) * step(pIdx, 3.5);
  col *= 1. + uGlow * bright * smoothstep(.4, 5., disturb);
  col = mix(col, ebPig(ringPig), ringA);
  col = mix(col, uPig[5], rimLine(min(pxDrop, pxRing), rimW) * .92);

  // the one wet highlight: a column of short dashes under the sun's bearing
  vec2 toF = vXZ - uCamL.xz;
  vec2 sdir = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float along = dot(toF, sdir), across = toF.x * sdir.y - toF.y * sdir.x;
  float la = log(max(along, .5)) * 24.;
  float fwLa = max(fwidth(la), 1e-5), fwAc = max(fwidth(across), 1e-5);
  float row = floor(la), fr = la - row;
  float tick = floor(uTime * 2.2 + ebHash1(vec2(row, 3.)) * 9.);
  float h2 = ebHash1(vec2(row, tick)), h3 = ebHash1(vec2(tick + 5., row));
  float colW = .034 * max(along, 0.) + .25;
  float el = atan(max(uCamL.y, 1.), max(along, .5));
  float ge = (el - asin(clamp(uSunDir.y, -1., 1.))) / .42;
  float env = mix(.22, 1., exp(-ge * ge)) * step(0., along) * (1. - smoothstep(.55, .9, ge)) * (1. - smoothstep(900., 2400., along));
  // each dash is a small lens of light, not a bar
  float hl = colW * (.2 + .6 * h2);
  float dAc = (across - (h3 - .5) * colW * 1.5) / hl, dLa = (fr - .5) / .21;
  float dpx = max(max(fwAc / hl, fwLa / .21), 1e-4);
  float dash = (1. - smoothstep(-1., 1., (sqrt(dAc * dAc + dLa * dLa) - 1.) / dpx)) * step(1. - .8 * env, h2 * .999 + .001)
             * (1. - smoothstep(.5, 1.1, fwLa));
  col = mix(col, uHiCol, clamp(dash * uHi, 0., 1.) * (1. - step(.001, lensA)) * (1. - step(6.5, capPig)));

  col = mix(col, uHazeCol, ebHaze(camD));
  gl_FragColor = vec4(col, lensA > .001 ? lensA : 1.);
}
`;

// ---------------------------------------------------------------------------------------------
// The two-step pigment material for every solid thing in the world.
const SOLID_VERT = (o) => /* glsl */`
precision highp float;
${SWELL_GLSL}
varying vec3 vN;
varying vec3 vWPos;
varying vec3 vOP;
varying vec3 vCol;
varying float vDist;
${o.vertDecl || ''}
void main(){
  vec3 op = position;
  vec3 on = normal;
  #ifdef USE_INSTANCING
    mat4 mm = modelMatrix * instanceMatrix;
  #else
    mat4 mm = modelMatrix;
  #endif
  #ifdef USE_COLOR
    vCol = color.rgb;
  #else
    vCol = vec3(1.);
  #endif
  vOP = position;
  ${o.vertMain || ''}
  vec4 wp = mm * vec4(op, 1.);
  vec3 wn = mat3(mm) * on;
  vN = wn / max(length(wn), 1e-5);
  vWPos = wp.xyz;
  vec4 mv = viewMatrix * wp;
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const SOLID_FRAG = (o) => /* glsl */`
precision highp float;
${EBRU_GLSL}
uniform vec3 uSunDir;
uniform vec3 uColor;
uniform float uTime;
uniform float uSpots;
uniform float uSpotCell;
uniform float uSpotCream;
uniform float uBias;
uniform float uOutline;
uniform float uOpacity;
varying vec3 vN;
varying vec3 vWPos;
varying vec3 vOP;
varying vec3 vCol;
varying float vDist;
${o.fragDecl || ''}
float sRim(float px, float w){ return 1. - smoothstep(w * .5 - .5, w * .5 + .5, px); }
void main(){
  vec3 N = vN / max(length(vN), 1e-5);
  if (!gl_FrontFacing) N = -N;
  vec3 V = cameraPosition - vWPos; V /= max(length(V), 1e-5);
  vec3 op = vOP, wp = vWPos;
  vec3 pig = vCol * uColor;
  float rim = 0.;
  float spotAmt = uSpots, spotCream = uSpotCream;
  float lightBias = uBias;
  // spot-marbling: one stone per cell, two sizes, drawn in object space so it rides with the thing
  vec3 qs = op / uSpotCell; vec3 gs = floor(qs); vec3 hs = ebHash3(gs + 11.3);
  float rs = .12 + .3 * hs.x;
  float sdA = (length(qs - gs - rs - (1. - 2. * rs) * ebHash3(gs + 3.7)) - rs) * uSpotCell;
  vec3 qt = op / (uSpotCell * .31) + 5.5; vec3 gt = floor(qt); vec3 ht = ebHash3(gt + 23.1);
  float rt = .14 + .26 * ht.x;
  float sdB = (length(qt - gt - rt - (1. - 2. * rt) * ebHash3(gt + 8.2)) - rt) * uSpotCell * .31;
  float fwS = max(fwidth(op.x) + fwidth(op.y) + fwidth(op.z), 1e-5) * .6;
  ${o.fragPigment || ''}
  float onA = step(hs.y, spotAmt * .8), onB = step(ht.y, spotAmt * .4);
  float lodA = 1. - smoothstep(.12, .4, fwS / uSpotCell), lodB = 1. - smoothstep(.12, .4, fwS / (uSpotCell * .31));
  vec3 spotA = hs.z < spotCream ? uPig[3] : uPig[2];
  vec3 spotB = ht.z < spotCream ? uPig[3] : uPig[2];
  pig = mix(pig, spotA, onA * (1. - smoothstep(-.5, .5, sdA / fwS)) * mix(.45, 1., lodA));
  rim = max(rim, onA * lodA * sRim(abs(sdA) / fwS, 1.3));
  pig = mix(pig, spotB, onB * (1. - smoothstep(-.5, .5, sdB / fwS)) * lodB);
  rim = max(rim, onB * lodB * sRim(abs(sdB) / fwS, 1.2) * .8);
  // two steps of shade split by a hairline
  float ndl = dot(N, uSunDir) + lightBias;
  float aa = max(fwidth(ndl), 1e-4);
  float lit = smoothstep(-aa, aa, ndl);
  rim = max(rim, sRim(abs(ndl) / aa, 1.4) * .85);
  vec3 col = mix(mix(pig, uPig[0], .35) * .72, pig, lit);
  float nv = abs(dot(N, V));
  rim = max(rim, uOutline * (1. - smoothstep(.1, .24, nv)));
  col = mix(col, uPig[5], rim * .92);
  col = mix(col, uHazeCol, ebHaze(vDist));
  gl_FragColor = vec4(col, uOpacity);
}
`;

function makeShared(palette, hazeColor) {
  const pal = (palette && palette.length >= 7 ? palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const cream = pal[3].clone();
  const mx = Math.max(cream.r, cream.g, cream.b);
  if (mx > 0.78) cream.multiplyScalar(0.78 / mx);                 // no pigment clips
  const still = new THREE.Color('#0A1230').lerp(pal[0], 0.25);
  const pig = [pal[0], pal[1], pal[2], cream, pal[4], pal[5], pal[6], still];
  const k = (l) => 2 * Math.PI / l;
  const d = (deg) => { const a = deg * Math.PI / 180; return [Math.sin(a), -Math.cos(a)]; };   // bearing from north
  const d0 = d(45), d1 = d(72), d2 = d(14);
  return {
    uPig: { value: pig },
    uHazeCol: { value: hazeColor ? new THREE.Color(hazeColor) : cream.clone() },
    uHaze: { value: new THREE.Vector4(3980, 0.793, 1, 0) },
    uSunDir: { value: new THREE.Vector3(Math.cos(42 * Math.PI / 180), Math.sin(42 * Math.PI / 180), 0) },
    uTime: { value: 0 },
    uSwell: { value: [new THREE.Vector4(d0[0], d0[1], k(70), 0.5), new THREE.Vector4(d1[0], d1[1], k(31), 0.13), new THREE.Vector4(d2[0], d2[1], k(17), 0.07)] },
  };
}

// The style's solid material. See the header for opts.
export function styleMaterial(opts = {}) {
  const sh = opts.shared || makeShared(opts.palette, opts.hazeColor);
  const uniforms = {
    uPig: sh.uPig, uHazeCol: sh.uHazeCol, uHaze: sh.uHaze, uSunDir: sh.uSunDir, uTime: sh.uTime, uSwell: sh.uSwell,
    uColor: { value: new THREE.Color(opts.color ?? '#ffffff') },
    uSpots: { value: opts.spots ?? 0 }, uSpotCell: { value: opts.spotCell ?? 1.8 }, uSpotCream: { value: opts.spotCream ?? 0.5 },
    uBias: { value: opts.bias ?? 0 }, uOutline: { value: opts.outline ?? 0.85 }, uOpacity: { value: opts.opacity ?? 1 },
    ...(opts.uniforms || {}),
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: SOLID_VERT(opts), fragmentShader: SOLID_FRAG(opts),
    vertexColors: opts.vertexColors ?? false, side: opts.side ?? THREE.FrontSide,
    transparent: !!opts.transparent, depthWrite: opts.depthWrite ?? !opts.transparent, fog: false,
  });
  mat.userData.shared = sh;
  return mat;
}

// what the skerry rock adds to the solid shader: drawn beds, joints, guano streaks, wet foot
const ROCK_VERT_DECL = /* glsl */`
attribute vec4 aRock;
varying vec4 vRock;
`;
const ROCK_VERT_MAIN = /* glsl */`
  vRock = aRock;
`;
const ROCK_FRAG_DECL = /* glsl */`
varying vec4 vRock;
`;
const ROCK_FRAG = /* glsl */`
  {
    float bed = vRock.x, bi = floor(bed), bfr = bed - bi;
    float bj = floor(bed / 4.);
    float hbd = ebHash1(vec2(bj, 4.2)), hlm = ebHash1(vec2(bi, 1.3));
    vec3 slate = uPig[6], black = uPig[5];
    pig = mix(black, slate, clamp((hbd < .24 ? .2 : (hbd < .62 ? .68 : 1.)) + (hlm - .5) * .26, 0., 1.));
    pig = mix(pig, mix(slate, uPig[3], .32), step(.9, hbd) * .7);
    float fb = max(fwidth(bed), 1e-5);
    float farK = 1. - smoothstep(.12, .45, fb);
    float bedEdge = step(abs(bed / 4. - floor(bed / 4. + .5)), .13);
    rim = max(rim, sRim(min(bfr, 1. - bfr) / fb, 1.5) * farK * mix(.4, 1., bedEdge));
    // joints: each bed is cut by its own vertical hairlines
    float jw = 1.7 + 3.4 * ebHash1(vec2(bi, 9.1));
    float ju = vRock.y / jw + hbd * 7.;
    float fj = max(fwidth(vRock.y) / jw, 1e-5);
    float jf = abs(fract(ju) - .5);
    rim = max(rim, sRim((.5 - jf) / fj, 1.2) * .55 * step(.4, ebHash1(vec2(floor(ju + .5), bi + 3.))) * (1. - smoothstep(.06, .22, fj)) * farK * step(vRock.w, .5));
    // guano: cream runs hanging from the upper ledges
    float sc = vRock.y / .34, sci = floor(sc);
    float hsk = ebHash1(vec2(sci, bj * 1.7 + 2.)), hsl = ebHash1(vec2(sci + 9., bj));
    float bfj = fract(bed / 4.);
    float fsc = max(fwidth(sc), 1e-5);
    float run = step(1. - .42 * smoothstep(.3, .75, vRock.z), hsk) * step(1. - (.15 + .8 * hsl * hsl), bfj) * step(vRock.w, .5);
    float runEdge = abs(fract(sc) - .5);
    float runLod = 1. - smoothstep(.25, .7, fsc);
    pig = mix(pig, uPig[3], run * mix(.35, 1., runLod) * (1. - smoothstep(.5 - fsc * 1.5, .5, runEdge)));
    // tops: paler, thick with thrift and lichen
    float top = step(.5, vRock.w) * step(vRock.w, 1.5);
    pig = mix(pig, mix(slate, uPig[2], .22), top * .8);
    spotAmt = mix(spotAmt, 1., top);
    spotCream = mix(mix(.12, .85, smoothstep(.15, .7, vRock.z)), .8, top);
    // the wet foot under the notch: lamp-black, jade-spotted
    float wet = 1. - smoothstep(1.3, 2.4, op.y + .5 * sin(vRock.y * .37));
    pig = mix(pig, mix(black, uPig[0], .25), wet);
    spotCream = mix(spotCream, .0, wet);
  }
`;

const COLLAR_VERT = /* glsl */`
precision highp float;
${SWELL_GLSL}
attribute vec3 aCol;
varying vec3 vC;
varying float vDist;
void main(){
  vec3 lp = position;
  vec4 mv0 = viewMatrix * modelMatrix * vec4(lp, 1.);
  lp.y = ebSwell(lp.xz) + .14 + length(mv0.xyz) * .0009;
  vC = aCol;
  vec4 mv = viewMatrix * modelMatrix * vec4(lp, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const COLLAR_FRAG = /* glsl */`
precision highp float;
${EBRU_GLSL}
uniform float uTime;
varying vec3 vC;
varying float vDist;
void main(){
  float wash = .9 * sin(uTime * .7 + vC.x * .09 + vC.z) + .45 * sin(uTime * 1.13 + vC.x * .23 + 2. * vC.z);
  float rho = vC.y - wash;
  float frho = max(fwidth(vC.y), 1e-5);
  float edge = rho - (1.7 + .6 * sin(vC.x * .8 + uTime * .5));
  float solid = 1. - smoothstep(-frho, frho, edge);
  vec2 ql = vec2(vC.x, rho) / 1.05; vec2 g = floor(ql), f = ql - g;
  float l1 = 1e3, l2 = 1e3; vec2 s1 = vec2(0.), s2 = vec2(1., 0.);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 o = vec2(float(i), float(j));
      vec2 h = ebHash2(g + o + vC.z * 13.);
      vec2 r = o + .5 + .36 * sin(uTime * (.5 + h.x) + 6.283 * h) - f;
      float d = dot(r, r);
      if (d < l1) { l2 = l1; s2 = s1; l1 = d; s1 = r; }
      else if (d < l2) { l2 = d; s2 = r; }
    }
  }
  vec2 dls = s2 - s1;
  float e = dot(.5 * (s1 + s2), dls / max(length(dls), 1e-4)) * 1.05;
  float fe = max(fwidth(e), 1e-5);
  float wl = .3 * (1. - smoothstep(1.5, 6.8, rho));
  float lace = (1. - smoothstep(-.5, .5, (e - wl) / fe)) * step(.004, wl);
  float a = max(solid, lace) * (1. - smoothstep(6.4, 7.4, vC.y));
  float rimK = solid * (1. - smoothstep(1., 2.2, abs(edge) / frho));
  vec3 col = mix(uPig[3], uPig[5], rimK * .8);
  col = mix(col, uHazeCol, ebHaze(vDist));
  gl_FragColor = vec4(col, a);
}
`;
const KELP_VERT = /* glsl */`
precision highp float;
${SWELL_GLSL}
attribute vec4 aK;
attribute vec2 aPerp;
varying vec3 vK;
varying float vDist;
void main(){
  vec3 lp = position;
  float t = aK.x;
  lp.xz += aPerp * (sin(uTime * 1.25 + aK.z + t * 3.1) * .5 + sin(uTime * .53 + aK.z * 1.7) * .3) * t * t;
  vec4 mv0 = viewMatrix * modelMatrix * vec4(lp, 1.);
  lp.y = ebSwell(lp.xz) + .24 + length(mv0.xyz) * .0011 - .12 * t;
  vK = vec3(aK.y, aK.w, t);
  vec4 mv = viewMatrix * modelMatrix * vec4(lp, 1.);
  vDist = length(mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
const KELP_FRAG = /* glsl */`
precision highp float;
${EBRU_GLSL}
varying vec3 vK;
varying float vDist;
void main(){
  float s = abs(vK.x);
  float fs = max(fwidth(vK.x), 1e-5);
  vec3 jade = uPig[2];
  vec3 col = vK.y < .5 ? jade : mix(jade, uPig[0], .35) * .9;
  col = mix(col, mix(jade, uPig[3], .35), step(.86, vK.y));
  float rim = 1. - smoothstep(.6, 1.6, (1. - s) / fs);
  rim = max(rim, (1. - smoothstep(.3, 1.2, s / fs)) * .7);
  col = mix(col, uPig[5], rim * .9 * (1. - smoothstep(.25, .6, fs)));
  col = mix(col, uHazeCol, ebHaze(vDist));
  gl_FragColor = vec4(col, 1.);
}
`;

// ---------------------------------------------------------------------------------------------
// Skerry geometry: a bedded, notched, fissured stack with its own outline function.
function makeStackShape(S, rng, noise) {
  const a = S.length / 2, b = S.thick / 2, H = S.height, sd = rng.range(0, 90);
  const fiss = [];
  const nf = 4;
  for (let i = 0; i < nf; i++) {
    fiss.push({ th: (i + rng.range(0.15, 0.85)) / nf * Math.PI * 2, depth: rng.range(0.16, 0.3), y0: rng.chance(0.5) ? 0 : rng.range(0.1, 0.4), y1: rng.range(0.75, 1.2), w: rng.range(0.05, 0.08) });
  }
  const lean = { x: rng.range(-1, 1) * 0.05 * H, z: rng.range(-1, 1) * 0.04 * H };
  const topBase = S.flatTop ? 0.74 : rng.range(0.46, 0.66), nExp = rng.range(2.2, 3.4);
  const dip = { x: rng.range(0.07, 0.19) * rng.sign(), z: rng.range(-0.08, 0.08) };
  const terr = [], nt = rng.int(2, 3);
  let tw = 0;
  for (let j = 0; j < nt; j++) { const t = { t: rng.range(0.24, 0.86), w: rng.range(0.5, 1), ph: rng.range(0, 6.28), amp: rng.range(0.06, 0.17), lobes: rng.int(1, 2) }; terr.push(t); tw += t.w; }
  for (const t of terr) t.w *= 0.86 / tw;
  const prof = (th, yn) => { let v = 0.14 * yn; for (const t of terr) v += t.w * smoothstep(-0.03, 0.03, yn - (t.t + t.amp * Math.sin(th * t.lobes + t.ph))); return Math.min(1, v); };
  const outline = (th) => {
    const c = Math.cos(th), s = Math.sin(th), n = nExp;
    const r0 = 1 / Math.pow(Math.pow(Math.abs(c) / a, n) + Math.pow(Math.abs(s) / b, n), 1 / n);
    return r0 * (1 + 0.19 * noise.n2(c * 1.3 + sd, s * 1.3 + sd * 0.7) + 0.07 * noise.n2(c * 3.7 - sd, s * 3.7 + sd));
  };
  const topFrac = (th) => clamp(topBase + (S.flatTop ? 0.08 : 0.2) * noise.n2(Math.cos(th) * 1.1 + sd * 1.3, Math.sin(th) * 1.1 - sd), 0.26, 0.85);
  const crown = (th) => (S.flatTop ? 0.03 : 0.3) * Math.max(0, 0.35 + noise.n2(Math.cos(th) * 2.3 - sd * 0.6, Math.sin(th) * 2.3 + sd * 1.9));
  // radius factor of the wall at angle th and normalised height yn, bed offset kb
  const wall = (th, yn, kb) => {
    let k = 1 - (1 - topFrac(th)) * prof(th, yn);
    k *= 1 + kb;
    for (const f of fiss) {
      let d = Math.abs(th - f.th); if (d > Math.PI) d = Math.PI * 2 - d;
      const band = smoothstep(f.y0 - 0.06, f.y0 + 0.04, yn) * (1 - smoothstep(f.y1 - 0.1, f.y1, yn));
      k *= 1 - f.depth * Math.exp(-(d * d) / (f.w * f.w)) * band;
    }
    return k;
  };
  return { a, b, H, sd, fiss, lean, dip, outline, topFrac, crown, wall };
}

function buildStack(S, idx, rng, noise) {
  const sh = makeStackShape(S, rng, noise);
  const H = S.height;
  // angles: an even ring plus three columns at every fissure
  let ths = [];
  const NB = 44;
  for (let i = 0; i < NB; i++) ths.push((i + 0.5) / NB * Math.PI * 2);
  for (const f of sh.fiss) ths.push(f.th - f.w * 0.9, f.th, f.th + f.w * 0.9);
  ths = ths.map((t) => ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((p, q) => p - q);
  ths.push(ths[0] + Math.PI * 2);
  const NA = ths.length;
  // arc length along the waterline for the drawn joints
  const us = [0];
  for (let i = 1; i < NA; i++) { const r = sh.outline(ths[i]); us.push(us[i - 1] + (ths[i] - ths[i - 1]) * r); }
  // rings: the foot, the wave-cut notch, then beds with a step between each
  const rings = [];
  const foot = [[-3.5, 1.16, -3], [-0.3, 1.15, -2.4], [0.7, 1.13, -2.05], [1.0, 1.0, -1.95], [1.9, 0.91, -1.5], [3.0, 0.865, -1.0], [4.1, 0.92, -0.5], [5.0, 1.0, -0.05]];
  for (const f of foot) rings.push({ y: f[0], kb: f[1] - 1, bed: f[2], notch: true });
  const y0 = 5.2, nb = Math.max(5, Math.round((H - y0) / 4.3));
  const ws = []; let wsum = 0;
  for (let j = 0; j < nb; j++) { const w = rng.range(0.55, 1.45); ws.push(w); wsum += w; }
  let y = y0;
  const beds = [];
  for (let j = 0; j < nb; j++) {
    const y1 = y + (H - y0) * ws[j] / wsum;
    const kb = rng.range(-0.06, 0.06) + (j % 2 ? 0.03 : -0.03) + (rng.chance(0.22) ? 0.07 : 0);
    const lam = Math.max(2, Math.round((y1 - y) / 1.5));
    rings.push({ y: y + 0.04, kb, bed: j * 4, j }, { y: (y + y1) / 2, kb: kb + 0.012, bed: j * 4 + lam / 2, j }, { y: y1 - 0.04, kb: kb - 0.008, bed: j * 4 + lam - 0.001, j });
    beds.push({ y0: y, y1, kb });
    y = y1;
  }
  const pos = [], rock = [], index = [];
  const bedOff = idx * 53;
  const put = (th, u, yy, kb, bed, kind, shrink = 1, lift = 0) => {
    const yn = clamp(yy / H, 0, 1);
    let yc = yy > 0 ? yy * (1 - sh.crown(th) * smoothstep(0.5, 1, yn)) + lift : yy;
    let r = sh.outline(th) * sh.wall(th, yn, kb) * shrink;
    const lx = sh.lean.x * yn * yn, lz = sh.lean.z * yn * yn;
    let x = Math.cos(th) * r + lx, z = Math.sin(th) * r + lz;
    const nz = noise.n3(x * 0.16 + sh.sd, yc * 0.22, z * 0.16) * 0.55 + noise.n3(x * 0.5, yc * 0.6 + sh.sd, z * 0.5) * 0.2;
    r += nz * (kind === 1 ? 0.3 : 1);
    x = Math.cos(th) * r + lx; z = Math.sin(th) * r + lz;
    yc += (x * sh.dip.x + z * sh.dip.z) * smoothstep(4, 15, yy);
    pos.push(x, yc, z); rock.push(bed + bedOff, u, yn, kind);
  };
  for (const rg of rings) for (let i = 0; i < NA; i++) put(ths[i], us[i], rg.y, rg.kb + (rg.notch ? 0 : 0.045 * noise.n2(ths[i] * 2.2 + rg.j * 17.3, rg.j * 3.1 + sh.sd)), rg.bed, 0);
  const NR = rings.length;
  for (let r = 0; r < NR - 1; r++) for (let i = 0; i < NA - 1; i++) {
    const p0 = r * NA + i, p1 = p0 + 1, p2 = p0 + NA, p3 = p2 + 1;
    index.push(p0, p2, p1, p1, p2, p3);
  }
  // the top: its own ring so the drawn top never bleeds down the wall, an inner ring and a centre
  const last = rings[NR - 1], base = pos.length / 3;
  for (let i = 0; i < NA; i++) put(ths[i], us[i], last.y, last.kb, last.bed, 1);
  for (let i = 0; i < NA; i++) put(ths[i], us[i], last.y, last.kb, last.bed, 1, 0.56, (S.flatTop ? 0.5 : 0.09 * H) * (0.25 + 1.5 * Math.abs(noise.n2(ths[i] * 1.9 + sh.sd, 2.2))));
  const cy = H * (1 - sh.crown(0) * 0.5) + (S.flatTop ? 0.9 : 0.06 * H);
  pos.push(sh.lean.x, cy, sh.lean.z); rock.push(last.bed + bedOff, 0, 1, 1);
  const cI = pos.length / 3 - 1;
  for (let i = 0; i < NA - 1; i++) {
    const o0 = base + i, o1 = o0 + 1, i0 = base + NA + i, i1 = i0 + 1;
    index.push(o0, i0, o1, o1, i0, i1, i0, cI, i1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 4));
  g.setIndex(index);
  g.computeVertexNormals();
  return { geometry: g, shape: sh, ths, us, beds };
}

function makeBlock(rng, noise, size, bedSeed) {
  const g = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3);
  const p = g.attributes.position, rock = [];
  const sx = size * rng.range(0.8, 1.5), sy = size * rng.range(0.5, 0.9), sz = size * rng.range(0.7, 1.2), o = rng.range(0, 50);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const l = Math.hypot(x, y, z) || 1, k = 0.3;
    x = lerp(x, x / l * 0.62, k); y = lerp(y, y / l * 0.62, k); z = lerp(z, z / l * 0.62, k);
    const n = 1 + 0.16 * noise.n3(x * 2.1 + o, y * 2.1, z * 2.1 - o);
    x *= n * sx; y *= n * sy; z *= n * sz;
    p.setXYZ(i, x + 0.12 * size * y / sy, y, z);
    rock.push(bedSeed + y / 1.4, (x + z) * 0.8 + o, 0.1, 2);
  }
  g.deleteAttribute('uv');
  g.setAttribute('aRock', new THREE.Float32BufferAttribute(rock, 4));
  g.computeVertexNormals();
  return g;
}

async function buildCollarAndKelp(stacks, built, rng, detail, pause) {
  const cp = [], cc = [], ci = [];
  const kp = [], kk = [], kperp = [], ki = [];
  const RHO = [-1.2, 0.9, 2.7, 4.9, 7.5];
  for (let n = 0; n < stacks.length; n++) {
    const S = stacks[n];
    const { shape: sh, ths, us } = built[n];
    const c = Math.cos(S.yaw), s = Math.sin(S.yaw);
    const W = (lx, lz) => [S.x + lx * c - lz * s, S.z + lx * s + lz * c];
    const base = cp.length / 3, NA = ths.length, seed = rng.range(0, 6.28);
    for (let j = 0; j < RHO.length; j++) for (let i = 0; i < NA; i++) {
      const r = sh.outline(ths[i]) * 1.14 + RHO[j];
      const w = W(Math.cos(ths[i]) * r, Math.sin(ths[i]) * r);
      cp.push(w[0], 0, w[1]); cc.push(us[i], RHO[j], seed);
    }
    for (let j = 0; j < RHO.length - 1; j++) for (let i = 0; i < NA - 1; i++) {
      const p0 = base + j * NA + i, p1 = p0 + 1, p2 = p0 + NA, p3 = p2 + 1;
      ci.push(p0, p1, p2, p1, p3, p2);
    }
    const nk = Math.round((46 + S.length * 0.9) * detail);
    if (pause) await pause();
    for (let f = 0; f < nk; f++) {
      if (pause && f % 24 === 23) await pause();
      const th = rng.range(0, Math.PI * 2), r0 = sh.outline(th) * 1.16 + rng.range(0, 1.3);
      const da = th + rng.range(-0.7, 0.7), L = rng.range(2.6, 4.6), w0 = rng.range(0.8, 1.4), ph = rng.range(0, 6.28), hh = rng();
      const b = W(Math.cos(th) * r0, Math.sin(th) * r0);
      const dl = [Math.cos(da), Math.sin(da)], d = [dl[0] * c - dl[1] * s, dl[0] * s + dl[1] * c], pr = [-d[1], d[0]];
      const kb = kp.length / 3, NSEG = 6;
      for (let q = 0; q <= NSEG; q++) {
        const t = q / NSEG, wd = w0 * (1 - 0.8 * Math.pow(t, 1.6)) * (1 + 0.22 * Math.sin(t * 9 + ph)) * (q === 0 ? 0.6 : 1);
        const cx = b[0] + d[0] * L * t + pr[0] * 0.25 * Math.sin(t * 4 + ph), cz = b[1] + d[1] * L * t + pr[1] * 0.25 * Math.sin(t * 4 + ph);
        for (const side of [-1, 1]) {
          kp.push(cx + pr[0] * wd * 0.5 * side, 0, cz + pr[1] * wd * 0.5 * side);
          kk.push(t, side, ph, hh); kperp.push(pr[0], pr[1]);
        }
        if (q < NSEG) { const v = kb + q * 2; ki.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); }
      }
    }
    if (pause) await pause();
  }
  if (pause) await pause();
  const collar = new THREE.BufferGeometry();
  collar.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3));
  collar.setAttribute('aCol', new THREE.Float32BufferAttribute(cc, 3));
  collar.setIndex(ci);
  if (pause) await pause();
  const kelp = new THREE.BufferGeometry();
  kelp.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3));
  kelp.setAttribute('aK', new THREE.Float32BufferAttribute(kk, 4));
  kelp.setAttribute('aPerp', new THREE.Float32BufferAttribute(kperp, 2));
  kelp.setIndex(ki);
  return { collar, kelp };
}

// ---------------------------------------------------------------------------------------------
// The operation list.
const PIG_NAMES = { navy: 0, ground: 0, turquoise: 1, jade: 2, cream: 3, ochre: 4, black: 5, rim: 5, slate: 6, still: 7 };
const pigIndex = (p, d) => (p == null ? d : (typeof p === 'number' ? p : (PIG_NAMES[p] ?? d)));

function makeOps() {
  const list = [];
  let seq = 0;
  const add = (type, f, defaults) => {
    const op = { type, f: { ...defaults, ...f } };
    op.order = f.order ?? (50 + (seq++) * 0.001);
    list.push(op);
    const h = {
      fields: op.f,
      set(n) { Object.assign(op.f, n); return h; },
      remove() { const i = list.indexOf(op); if (i >= 0) list.splice(i, 1); },
    };
    return h;
  };
  const api = {
    addDrop: (f = {}) => add(1, f, { x: 0, z: 0, r: 0, pigment: 3, core: 0, corePigment: 7, lens: 0, bandW: 0 }),
    addStroke: (f = {}) => add(2, f, { x0: 0, z0: 0, x1: 0, z1: 0, drag: 14, width: 7, head: 0, tail: 12 }),
    addComb: (f = {}) => add(3, f, { x: 0, z: 0, dirX: 0, dirZ: -1, drag: 6, sharp: 0.6, spacing: 2.4, alternate: false, sMin: -100, sMax: 100, halfWidth: 100, feather: 0.14 }),
    addVortex: (f = {}) => add(4, f, { x: 0, z: 0, angle: 0, radius: 20 }),
    addShear: (f = {}) => add(5, f, { dirX: 1, dirZ: 0, amp: 5, wavelength: 300, phase: 0 }),
    addGapTines: (f = {}) => add(6, f, { x: 0, z: 0, dirX: 0, dirZ: -1, approach: 90, runout: 50, head: 80, tail: 30 }),
    addRingField: (f = {}) => add(7, f, { x: 0, z: 0, radius: 60, cell: 16, maxR: 3, period: 6, density: 0.6, pigment: 3, phase: 0, area: 0.9, seed: 0 }),
    free: () => NOPS - list.length,
    count: () => list.length,
    list,
  };
  const dirOf = (f) => { const l = Math.hypot(f.dirX, f.dirZ) || 1; return [f.dirX / l, f.dirZ / l]; };
  api.pack = (A, B, C) => {
    list.sort((p, q) => p.order - q.order);
    for (let i = 0; i < NOPS; i++) {
      const a = A[i], b = B[i], c = C[i];
      a.set(0, 0, 0, 0); b.set(0, 0, 0, 0); c.set(0, 0, 0, 0);
      const op = list[i]; if (!op) continue;
      const f = op.f;
      if (op.type === 1) {
        if (!(f.r > 0.02)) continue;
        a.set(f.x, f.z, f.r, clamp(f.core, 0, 0.995)); b.set(pigIndex(f.pigment, 3), pigIndex(f.corePigment, 7), f.lens || 0, 0); c.set(f.bandW || 0, 0, 0, 1);
      } else if (op.type === 2) {
        const dx = f.x1 - f.x0, dz = f.z1 - f.z0, len = Math.hypot(dx, dz);
        if (len < 0.5) continue;
        a.set(f.x0, f.z0, dx / len, dz / len); b.set(f.drag, Math.max(f.width, 0.05), len, Math.max(f.head || 0, 1.7 * Math.abs(f.drag), 4)); c.set(Math.max(f.tail, 0.5), 0, 0, 2);
      } else if (op.type === 3) {
        const d = dirOf(f);
        a.set(f.x, f.z, d[0], d[1]); b.set(f.drag, Math.max(f.sharp, 0.02), Math.max(f.spacing, 0.1) * (f.alternate ? -1 : 1), clamp(f.feather, 0.01, 0.5));
        c.set(f.sMin, Math.max(f.sMax, f.sMin + 1), Math.max(f.halfWidth, 1), 3);
      } else if (op.type === 4) {
        a.set(f.x, f.z, f.angle, Math.max(f.radius, 0.1)); c.w = 4;
      } else if (op.type === 5) {
        const d = dirOf(f);
        a.set(d[0], d[1], f.amp, 2 * Math.PI / Math.max(f.wavelength, 1)); b.x = f.phase; c.w = 5;
      } else if (op.type === 6) {
        const d = dirOf(f);
        a.set(f.x, f.z, d[0], d[1]); b.set(f.approach, f.runout, Math.max(f.head, 1), Math.max(f.tail, 0.5)); c.w = 6;
      } else if (op.type === 7) {
        a.set(f.x, f.z, f.radius, Math.max(f.cell, 0.5)); b.set(f.maxR, Math.max(f.period, 0.1), f.density, pigIndex(f.pigment, 3)); c.set(f.phase, f.area, f.seed, 7);
      }
    }
  };
  return api;
}

function makeSeaGeometry(detail) {
  const NS = Math.round(200 * (0.5 + 0.5 * detail)), NR = Math.round(150 * (0.5 + 0.5 * detail));
  const pos = new Float32Array((NR + 1) * NS * 3), index = new Uint32Array(NR * NS * 6);
  let ii = 0;
  for (let r = 0; r <= NR; r++) {
    const t = r / NR, rad = 3200 * (0.02 * t + 0.98 * Math.pow(t, 3.6));
    for (let s = 0; s < NS; s++) {
      const a = (s + (r & 1) * 0.5) / NS * Math.PI * 2, o = (r * NS + s) * 3;
      pos[o] = Math.cos(a) * rad; pos[o + 1] = 0; pos[o + 2] = Math.sin(a) * rad;
    }
  }
  for (let r = 0; r < NR; r++) for (let s = 0; s < NS; s++) {
    const s1 = (s + 1) % NS, p0 = r * NS + s, p1 = r * NS + s1, p2 = (r + 1) * NS + s, p3 = (r + 1) * NS + s1;
    if (r & 1) { index[ii++] = p0; index[ii++] = p2; index[ii++] = p1; index[ii++] = p1; index[ii++] = p2; index[ii++] = p3; }
    else { index[ii++] = p0; index[ii++] = p3; index[ii++] = p1; index[ii++] = p0; index[ii++] = p2; index[ii++] = p3; }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  return g;
}

const FLY = [[153, 32, 269], [107, 32, 230], [62, 27, 183], [28, 19, 127], [7, 11, 65], [0, 6, 0], [0, 3, -75], [0, 5, -200], [0, 7, -330],
  [0, 14, -365], [0, 40, -425], [0, 62, -472], [0, 68, -492], [0, 64, -508], [0, 53.6, -520], [0, 4.5, -554.4]];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const detail = ctx.quality?.detail ?? 1;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shared = makeShared(opts.palette, opts.hazeColor);
  if (opts.sunDir) shared.uSunDir.value.copy(opts.sunDir).normalize();
  const object = new THREE.Group();
  object.name = 'combed-sea-hero';

  // ---- per-seed choices
  const sense = rng.chance(0.5) ? 1 : -1;                 // which way the Great Eddy winds
  const arms = opts.arms ?? (rng.chance(0.65) ? 2 : 3);
  const turns = rng.range(2.3, 2.7);
  const EDDY_R = 110;
  const polar = (bearingDeg, r) => { const a = bearingDeg * Math.PI / 180; return [EDDY.x + r * Math.sin(a), EDDY.z - r * Math.cos(a)]; };
  const s1 = polar(rng.range(118, 128), rng.range(235, 255));
  const s2 = rng.chance(0.5) ? polar(rng.range(56, 68), rng.range(215, 235)) : polar(rng.range(292, 304), rng.range(215, 235));
  const sats = [{ x: s1[0], z: s1[1], r: 40 }, { x: s2[0], z: s2[1], r: 25 }];

  // ---- the row: nine stacks on an arc about the eddy centre, the flown gap centred (0, -330)
  const heights = [34, 41, 30, 47, 60, 52, 38, 44, 31];
  const gapW = []; for (let i = 0; i < 8; i++) gapW.push(i === 4 ? 46 : rng.range(16, 28));
  const lens = heights.map((h, i) => (i === 4 ? rng.range(37, 44) : i === 5 ? rng.range(35, 42) : rng.range(27, 41)));
  const lsum = lens.reduce((p, q) => p + q, 0), gsum = gapW.reduce((p, q) => p + q, 0), lk = (520 - gsum) / lsum;
  const rowR = Math.hypot(0 - EDDY.x, -330 - EDDY.z), alpha0 = Math.atan2(0 - EDDY.x, -(-330 - EDDY.z));
  const flatW = rng.int(0, 3), flatE = rng.int(6, 8);
  const sC = new Array(9);
  { let s = -23; for (let i = 4; i >= 0; i--) { const L = lens[i] * lk; sC[i] = s - L / 2; s -= L + (i > 0 ? gapW[i - 1] : 0); } }
  { let s = 23; for (let i = 5; i < 9; i++) { const L = lens[i] * lk; sC[i] = s + L / 2; s += L + (i < 8 ? gapW[i] : 0); } }
  const onArc = (s) => { const al = alpha0 + s / rowR; return { x: EDDY.x + rowR * Math.sin(al), z: EDDY.z - rowR * Math.cos(al), yaw: al }; };
  const stacks = heights.map((h, i) => {
    const p = onArc(sC[i]), L = lens[i] * lk;
    const thick = Math.min(L * 0.82, i === 4 || i === 5 ? rng.range(23, 28) : rng.range(16, 26));
    return { x: p.x, z: p.z, yaw: p.yaw, length: L, thick, height: h, flatTop: i === flatW || i === flatE };
  });
  const gaps = [];
  for (let i = 0; i < 8; i++) {
    const sg = i === 4 ? 0 : (sC[i] + lens[i] * lk / 2 + sC[i + 1] - lens[i + 1] * lk / 2) / 2, p = onArc(sg);
    gaps.push({ x: p.x, z: p.z, width: gapW[i], drag: i === 4 ? 38 : rng.range(24, 32) });
  }

  // ---- the sea
  const ops = makeOps();
  const vec4s = () => Array.from({ length: NOPS }, () => new THREE.Vector4());
  const seaU = {
    ...shared,
    uOpA: { value: vec4s() }, uOpB: { value: vec4s() }, uOpC: { value: vec4s() },
    uGap: { value: gaps.map((g) => new THREE.Vector4(-g.x, -(g.z + 330), g.width * 0.38, g.drag)) },
    uEddy: { value: new THREE.Vector4(EDDY.x, EDDY.z, EDDY.r, arms) },
    uSat: { value: [new THREE.Vector4(0, 0, 40, 0), new THREE.Vector4(0, 0, 25, 0)] },
    uRain: { value: new THREE.Vector4(60, 50, opts.rain === false ? 0 : 0.5, 0) },
    uCamL: { value: V3(0, 30, 0) }, uSnap: { value: new THREE.Vector2() },
    uHi: { value: 1 }, uHiCol: { value: new THREE.Color(1.25, 1.19, 1.02) }, uGlow: { value: 0 },
    uField: { value: new THREE.Vector4(rowR + 13, 262, -722, 0) }, uRank: { value: new THREE.Vector2(14, Math.floor(turns * 37) + 0.5) },
    uSeed: { value: Math.floor(rng.range(3, 60)) + 0.37 }, uDetail: { value: detail >= 0.7 ? 1 : 0 },
  };
  const seaDefines = {};
  if (opts.rain !== false) seaDefines.RAIN = 1;
  if (detail >= 0.7) seaDefines.LACE = 1;
  const seaMat = new THREE.ShaderMaterial({ defines: seaDefines, uniforms: seaU, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, side: THREE.DoubleSide, fog: false });
  await ctx.yield?.();
  const sea = new THREE.Mesh(makeSeaGeometry(detail), seaMat);
  sea.frustumCulled = false; sea.name = 'ebru-sea';
  object.add(sea);
  await ctx.yield?.();

  // built-in operations, oldest first
  const opEddy = ops.addVortex({ x: EDDY.x, z: EDDY.z, angle: 0, radius: EDDY_R, order: 0 });
  const opSat = sats.map((s, i) => ops.addVortex({ x: s.x, z: s.z, angle: 0, radius: s.r / 2.5, order: 1 + i }));
  const opShA = ops.addShear({ dirX: 1, dirZ: 0, amp: 6, wavelength: 420, phase: 0, order: 3 });
  const opShB = ops.addShear({ dirX: 0, dirZ: 1, amp: 5, wavelength: 310, phase: 1, order: 4 });
  const gelSpacing = rng.range(6.6, 7.4);
  const opGel = ops.addComb({ x: 0, z: -420, dirX: 1, dirZ: 0, drag: 12, sharp: 4, spacing: gelSpacing, alternate: true, sMin: -640, sMax: 640, halfWidth: 310, feather: 0.3, order: 10 });
  const opGaps = ops.addGapTines({ x: 0, z: -330, dirX: 0, dirZ: -1, approach: 95, runout: 55, head: 85, tail: 35, order: 11 });
  const opComb = ops.addComb({ x: 0, z: -316, dirX: 0, dirZ: -1, drag: 7, sharp: 0.8, spacing: rng.range(2.4, 2.6), alternate: false, sMin: 0, sMax: 425, halfWidth: 360, feather: 0.1, order: 12 });
  const RING_BANDS = 4, RING_BAND_W = 2.0;                // pressed bands round the still water: cream, turquoise, navy, cream
  const opRing = opts.ring === false ? null : ops.addDrop({ x: RING.x, z: RING.z, r: 22 + RING_BANDS * RING_BAND_W, pigment: 3, core: 0.78, corePigment: 7, bandW: RING_BAND_W, order: 100 });

  // ---- the skerries
  const built = [];
  let rockMat = null, collarMat = null, kelpMat = null;
  if (opts.skerries !== false) {
    const geos = [];
    for (let i = 0; i < 9; i++) {
      const S = stacks[i], bs = buildStack(S, i, rng, noise);
      built.push(bs);
      const m = new THREE.Matrix4().makeRotationY(-S.yaw).setPosition(S.x, 0, S.z);
      bs.geometry.applyMatrix4(m);
      geos.push(bs.geometry);
      const c = Math.cos(S.yaw), s = Math.sin(S.yaw);
      S.toWorld = (lx, y, lz) => V3(S.x + lx * c - lz * s, y, S.z + lx * s + lz * c);
      S.top = S.toWorld(bs.shape.lean.x, S.height, bs.shape.lean.z);
      const nbk = rng.int(4, 7);
      for (let k = 0; k < nbk; k++) {
        const th = rng.range(0, Math.PI * 2), size = rng.range(2.4, 5.6);
        const r = bs.shape.outline(th) * 1.13 + size * rng.range(0.2, 0.9);
        const w = S.toWorld(Math.cos(th) * r, size * rng.range(-0.12, 0.2), Math.sin(th) * r);
        if (Math.abs(w.x) < 31 && w.z < -250 && w.z > -420) continue;      // keep the flown gap clear
        const bg = makeBlock(rng, noise, size, i * 53 + 20 + k * 3);
        bg.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rng.range(-0.35, 0.35), rng.range(0, 6.28), rng.range(-0.35, 0.35))).setPosition(w.x, w.y, w.z));
        geos.push(bg);
      }
      await ctx.yield?.();
    }
    const rockGeo = mergeGeometries(geos, false);
    geos.forEach((g) => g.dispose());
    await ctx.yield?.();
    rockMat = styleMaterial({ shared, spots: 0.34, spotCell: 2.3, spotCream: 0.5, outline: 0.7,
      vertDecl: ROCK_VERT_DECL, vertMain: ROCK_VERT_MAIN, fragDecl: ROCK_FRAG_DECL, fragPigment: ROCK_FRAG });
    const rock = new THREE.Mesh(rockGeo, rockMat); rock.name = 'skerries';
    object.add(rock);
    await ctx.yield?.();
    const ck = await buildCollarAndKelp(stacks, built, rng, detail, ctx.yield ? () => ctx.yield() : null);
    await ctx.yield?.();
    const ckU = { uPig: shared.uPig, uHazeCol: shared.uHazeCol, uHaze: shared.uHaze, uTime: shared.uTime, uSwell: shared.uSwell };
    kelpMat = new THREE.ShaderMaterial({ uniforms: ckU, vertexShader: KELP_VERT, fragmentShader: KELP_FRAG, side: THREE.DoubleSide, fog: false });
    const kelp = new THREE.Mesh(ck.kelp, kelpMat); kelp.frustumCulled = false; kelp.name = 'kelp-fringe';
    object.add(kelp);
    collarMat = new THREE.ShaderMaterial({ uniforms: ckU, vertexShader: COLLAR_VERT, fragmentShader: COLLAR_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: false, fog: false });
    const collar = new THREE.Mesh(ck.collar, collarMat); collar.frustumCulled = false; collar.renderOrder = 1; collar.name = 'foam-collars';
    object.add(collar);
    await ctx.yield?.();
  }

  // ---- state and hooks
  let lastTime = 0, ringOverride = null, progress = null;
  const ringDiameter = () => {
    if (ringOverride != null) return ringOverride;
    if (progress == null) return 44;
    const u = progress;
    return 30 * smoothstep(0.45, 0.64, u) + 10 * smoothstep(0.64, 0.8, u) + 4 * smoothstep(0.88, 0.93, u);
  };
  const swell = shared.uSwell.value;
  const heightAt = (x, z, t = lastTime) => {
    let h = 0;
    for (let i = 0; i < 3; i++) { const s = swell[i]; h += s.w * Math.sin((x * s.x + z * s.y) * s.z - Math.sqrt(9.81 * s.z) * t + i * 1.7); }
    return h;
  };
  const _v = new THREE.Vector3();
  const sync = (time) => {
    const clock = Math.min(time, 150);                               // winding and race drag stop thinning the veins here
    const ang = sense * (turns * Math.PI * 2 + 0.0349 * clock);
    opEddy.fields.angle = ang;
    for (let i = 0; i < sats.length; i++) {
      const s = sats[i];
      opSat[i].fields.angle = -sense * (5.5 + 0.09 * clock);
      // where the satellite's water lay in the base sheet (the eddy operation undone)
      const dx = s.x - EDDY.x, dz = s.z - EDDY.z, a = -ang * Math.exp(-Math.hypot(dx, dz) / EDDY_R), c = Math.cos(a), sn = Math.sin(a);
      seaU.uSat.value[i].set(EDDY.x + c * dx - sn * dz, EDDY.z + sn * dx + c * dz, s.r, 0);
    }
    opShA.fields.phase = time * 0.05;
    opShB.fields.phase = 1 + time * 0.06;
    opGel.fields.drag = 12 + 1.5 * Math.sin(time * 0.31);
    opComb.fields.drag = 7 + 0.7 * Math.sin(time * 0.37);            // the feathers breathe
    seaU.uField.value.w = time * 0.5;                                // the tide carries the ranks north through the comb
    const breathe = 1 + 0.07 * Math.sin(time * 0.42) + 0.1 * clock / 150;
    for (let i = 0; i < gaps.length; i++) seaU.uGap.value[i].w = gaps[i].drag * breathe;
    if (opRing) {
      const half = ringDiameter() / 2, bw = RING_BAND_W * smoothstep(1, 8, half), rr = half + RING_BANDS * bw, f = opRing.fields;
      f.r = rr; f.core = rr > 0.02 ? half / rr : 0; f.bandW = bw;
    }
    ops.pack(seaU.uOpA.value, seaU.uOpB.value, seaU.uOpC.value);
  };
  sync(0);

  const great = [stacks[4], stacks[5]];
  const ledges = [];
  if (built.length) {
    for (const gi of [4, 5]) {
      const S = stacks[gi], bs = built[gi];
      bs.beds.forEach((bd, j) => {
        if (bd.y1 < S.height * 0.3 || j % 2) return;
        for (let k = 0; k < 3; k++) {
          const th = rng.range(0, Math.PI * 2), yn = bd.y1 / S.height;
          const r = bs.shape.outline(th) * bs.shape.wall(th, yn, bd.kb) + 0.4;
          ledges.push(S.toWorld(Math.cos(th) * r + bs.shape.lean.x * yn * yn, bd.y1 + 0.2, Math.sin(th) * r + bs.shape.lean.z * yn * yn));
        }
      });
    }
  }
  const diveDir = V3(0, 53.6 - 4.5, -520 + 554.4).normalize();          // back up the last straight
  const anchors = {
    portalSeat: { position: V3(0, 4.5, -554.4), normal: diveDir, radius: 7, ringCentre: V3(RING.x, 0, RING.z) },
    flyThrough: FLY.map((p) => V3(p[0], p[1], p[2])),
    gap: V3(0, 0, -330), gapWidth: 46,
    eddyCentre: V3(EDDY.x, 0, EDDY.z), eddyRadius: EDDY.r, eddySense: sense,
    satellites: sats.map((s) => ({ position: V3(s.x, 0, s.z), radius: s.r })),
    rowCentre: V3(EDDY.x, 0, EDDY.z), rowRadius: rowR,
    gaps: gaps.map((g) => ({ position: V3(g.x, 0, g.z), width: g.width })),
    greatStacks: great.map((S) => (S.top ? S.top.clone() : V3(S.x, S.height, S.z))),
    ledges,
    field: { centre: V3(0, 0, -480), width: 500, depth: 250 },
    viewpoints: { entry: V3(153, 32, 269), overEddy: V3(60, 150, 190), raceApproach: V3(0, 6, -200), overField: V3(0, 68, -492) },
  };

  const hero = {
    object, radius: 80, height: 70, center: V3(0, 10, -330), anchors,
    ground: false, groundY: 0,
    ops, uniforms: shared, seaUniforms: seaU, stacks, heightAt,
    materials: { sea: seaMat, rock: rockMat, collar: collarMat, kelp: kelpMat },
    kit: { styleMaterial, EBRU_GLSL, SWELL_GLSL },
    setProgress(u) { progress = clamp(u, 0, 1); },
    setRing(d) { ringOverride = d; },
    setRain(zEdge = 60, feather = 50, rate = 0.5) { seaU.uRain.value.x = zEdge; seaU.uRain.value.y = Math.max(feather, 1); seaU.uRain.value.z = rate; },
    setSun(dir) { shared.uSunDir.value.copy(dir).normalize(); },
    setHighlight(k, color) { seaU.uHi.value = k; if (color != null) seaU.uHiCol.value.copy(color); },
    setGlow(k) { seaU.uGlow.value = k; },
    setHaze(color, scale) { if (color != null) shared.uHazeCol.value.set(color); if (scale != null) shared.uHaze.value.z = scale; },
    enableLens(on) { seaMat.transparent = !!on; sea.renderOrder = on ? -0.5 : 0; seaMat.needsUpdate = true; },
    update(dt, time, camera) {
      lastTime = time;
      shared.uTime.value = time;
      if (camera) {
        object.updateMatrixWorld();
        camera.getWorldPosition(_v); object.worldToLocal(_v);
        seaU.uCamL.value.copy(_v); seaU.uSnap.value.set(_v.x, _v.z);
      }
      sync(time);
    },
    dispose() {},
  };
  return hero;
}
