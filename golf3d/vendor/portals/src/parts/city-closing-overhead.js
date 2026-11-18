// CITY CLOSING OVERHEAD, THE KEPT CORE (builder A of the rebuild; design/film/city-closing-overhead.redesign.md, sections 2, 4,
// 5 and 8): THE BEND that carries one half of the town up over our heads, the Writer of merged bodies, the materials that run
// the bend in every pass with the blue hour's own GLSL hooked in, the bodies of the town's generator, and THE GROUND: the
// plan's two textures and the land's meshes and program. The town's plan itself is pure data in city-closing-overhead-plan.js.
//
// AXES (redesign, head): 1 unit = 1 m, y up, +z the course, and EVERY x IS WORLD x: we fly toward +z, the hinge line is x 90,
// y 7 (the paving's height), and the curl rises on the flight's LEFT, plus x. The open side is minus x.
//
// THE CROSS-SECTION LAW (redesign section 2): across the curl the land is one smooth curve, the same at every z; at arc length
// a from the hinge its tangent angle is theta1(a), the closed-form integral of the curvature k1 in four smooth pieces: the ease
// over a 0 to 100 (k = S(a / 100) / 75), the tight arc of radius 75 m to a 217, the opening to a 277 (k eased to 1 / 800), the
// ceiling of radius 800 m to the free edge at L = 596.5 (tangent 175.53 deg: under a half turn). Its place is the tangent's
// integral from the hinge. The land is BENT, NEVER STRETCHED (a cylinder): every length along a and z keeps its size.
// THE CURL DOES NOT MOVE: b = B0 = 1 at every metre flown; the knots are filled once (makeBend) and never set again.
//
// THE SHADER LAW: every vertex of the curl is authored FLAT, carrying its anchor's arc length aA and its offset from the anchor
// (du along a, dn along the ground's normal, and its z); the BEND chunk carries it by its anchor's own axes:
//   P = ( C(aA) + du T(aA) + dn N(aA), z ),  T = (cos th, sin th), N = (-sin th, cos th)
// and turns its normal by the same rotation. C and T come from 65 knots at a = i L / 64, each (x, y, cos th, sin th), held in
// ONE uniform array (vec4 uBendK[65]) shared by every program that draws the curl, colour and depth alike. C by the cubic
// Hermite with the knots' own tangents; T by a linear mix, normalized. No sin or cos in the shader. A vertex with aA under 0
// (the flat town) takes the same program with the bend's weight 0: identically flat. bendKnots, bendFrame and bendAt are the
// JS MIRROR, line for line the same law. Sway (trees) is added in the body's own flat axes BEFORE the bend.
//
// THE WRITER: bodies written flat into merged arrays (position, normal, colour, aAnchor, and the facade coordinates aFac and
// aKind, or aSway for trees). RIGID bodies (trees, landmarks) share one anchor. SOFT bodies (new Writer(sway, true): the
// terraces) write each vertex with position x 0 and aAnchor = aA + du, so every vertex rides its own ground and walls stand
// along the ground's own normal: a row follows the curve with no gap and no lean; the mirror is bendAt(K, aA + du, 0, dn, z).
//
// THE MATERIALS: bendMaterials(bend, kind, extra) gives the PAIR { colour, depth } of kind 'land' | 'house' | 'tree', both
// carrying the BEND chunk. THE NIGHT HOOK: extra.night = { pars, colour, emit, uniforms, key } puts the blue hour's GLSL into
// the colour program (lit panes, street wash, floodlight, pools); with it the old day facade, the cloud shadows and the sun's
// fade are off. Without it the kept day program stands as it was (flatMaterial and the old facade are kept, unused here).
//
// THE GROUND (the end of this file): planTextures (one texel a metre: mean colour with the lamps' POOLS in its alpha, and the
// class with each street's middle), sweepSphere (the culling spheres of bent things), makeLand (the curl's land in 6 bands
// and the flat town's ground, in the one land program: paving drawn in true metres, box-filtered, never a stone texture;
// yards, courts and gardens the places the plan lays, GROUND_SUB; near the way the paving is wet: a sheen and lamp streaks,
// WET_GLSL; no water on open paving, a kerb's gutter alone). THE RIM: the parapet of the roll's free edge is built with the land.
//
// KEPT FROM THE EARLIER BUILD: PLAN's lengths (the far end alone moved on: Z_FULL1, Z_TIP, TEX_H; TOWN_Z1 is new), Lz and both tapers, rampR, the knots and the mirror, BEND_GLSL, the
// Writer's roofs, walls4, rowHouse, hipHouse, tower, segWall, tree, TREE_KINDS, PALETTES, the wall and roof colours, BAND_Z,
// kMax and bendGap, makePlainBlocks. TAKEN OUT (the old plan is dead): the river island's plan, plots and cut line, the
// block filler, the old ground fills, the island and bank builders, the floor texture and the cloud field.
//
// EVERY RULE IN THIS FILE THAT READS THE EYE'S PLACE: fwidth and the plan textures' mipmaps and anisotropy (a pixel's
// footprint: lines filtered to their mean); the engine's culling against the sweep spheres; the land's back face (the side of
// the land the eye is on: the back is the haze's colour); THE WET SHEEN on the paved ground's first 60 m from the hinge line (a
// reflection: F from the sight line's angle to the ground, the afterglow mirrored, each lamp's streak read from the pools'
// texture along the mirrored sight line, a gutter's water mirroring more; where water lies is the plan's own metre, and
// the footprint picks the streaks' mip level); three's own fog by distance. Nothing else: no vertex, colour, pool
// or cut is placed by the eye, and nothing here reads the clock but the trees' sway.
import * as THREE from 'three';

// ---------------------------------------------------------------- THE PLAN'S TYPED FIGURES (every x is world x)
export const PLAN = {
  HX: 90, Y0: 7, L: 596.5, N: 64,                         // hinge at world x +90, y 7; full width; knot intervals
  Z_NEAR: -700, Z_FULL0: -400, Z_FULL1: 1460, Z_TIP: 1535, // the roll's tips and its full width: THE RING (z 1,200) STANDS UNDER THE FULL ROLL, the far taper begins 260 m beyond it
  QUAY0: 70, QUAY1: 90, WALL_H: 7, PARAPET: 1,              // (the earlier build's quay: kept figures, read by nothing in the rebuild)
  RING_X: 72, RING_Z: 1200, RING_Y: 22, RING_R: 12,          // the ring at the street's end (redesign section 3)
  TOWN_Z0: -60,                                             // no house, tree or lamp before z -60 (the entry's far side is bare land)
  TOWN_Z1: 1300,                                            // THE FLAT TOWN'S LAST STREET and the kerb's fronts end here, 100 m past the ring (the rolled town runs on: ROLL_TOWN_Z1 below)
  TEX_W: 597, TEX_H: 2235,                                  // the plan textures: a 0 to 597 by z -700 to the tip (Z_TIP - Z_NEAR), 1 texel a metre
  OUT: 255,                                                 // the CLASS texture's OUTSIDE class
};
// THE ROLLED TOWN'S END follows the roll's own end: a margin off its tip, the taper's own length, so its last street ends where
// the roll begins to narrow; from PLAN.TOWN_Z1 to it the rows thin into outskirts (the plan's law), the taper itself is fields and farms
PLAN.TIP_MARGIN = PLAN.Z_TIP - PLAN.Z_FULL1;
PLAN.ROLL_TOWN_Z1 = PLAN.Z_TIP - PLAN.TIP_MARGIN;
PLAN.H = PLAN.L / PLAN.N;                                   // 9.32 m between knots
// the ground's classes in the plan's CLASS texture (one texel a metre): setts of a street along z, setts of a street along a,
// slabs (squares, the promenade's strip), yard, garden, court; PLAN.OUT (255) is no ground at all
export const GROUND_CLS = { LONG: 1, CROSS: 2, SLAB: 3, YARD: 4, GARDEN: 5, COURT: 6 };
// what lies on a yard, garden or court at a texel (the CLASS texture's second byte there; 255 is plain ground): setts, a drain
// line along a or along z, a worn path, flags, a bed of earth, grass, a gravel path, a hedge line
export const GROUND_SUB = { SETT: 1, DRAIN_A: 2, DRAIN_Z: 3, WORN: 4, FLAG: 5, BED: 6, GRASS: 7, PATH: 8, HEDGE: 9, GUTTER: 10 };   // (GUTTER: on slabs, the kerb's metre along z)
// THE WET PAVING'S GRAIN AND ITS WATER, laws of the place in the ground's own metres (on the curl a and z; on the promenade
// x - 90 and z, so both programs share them): wetHash and wetNoise (value noise; they also grain earth, grass and gravel).
export const WET_GLSL = /* glsl */`
float wetHash(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float wetNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(wetHash(i), wetHash(i + vec2(1.0, 0.0)), f.x), mix(wetHash(i + vec2(0.0, 1.0)), wetHash(i + 1.0), f.x), f.y); }
// NO WATER STANDS ON OPEN PAVING (it read as dark blots, and as reddish ones where it mirrored the afterglow): wetPuddle is 0
// everywhere, its name kept for the promenade's program; water lies only in a kerb's gutter, wetGutter: m.x metres across the
// gutter's own metre (0 to 1), m.y along it; a broken line of water 0.7 m wide
float wetPuddle(vec2 m) { return 0.0; }
float wetGutter(vec2 m, float w) { return smoothstep(0.42, 0.58, wetNoise(vec2(m.y / 5.0, 17.0))) * clamp((min(m.x - 0.15, 0.85 - m.x) + 0.5 * w) / max(w, 0.001), 0.0, 1.0); }
`;

const S3 = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
// the island's width in a at z (section 2): a 300 m taper at the near tip, full width z -400 to +1,100, the far taper to z 1,175
export function Lz(z) {
  if (z <= PLAN.Z_NEAR || z >= PLAN.Z_TIP) return 0;
  if (z < PLAN.Z_FULL0) return PLAN.L * S3((z - PLAN.Z_NEAR) / 300);
  if (z <= PLAN.Z_FULL1) return PLAN.L;
  return PLAN.L * (1 - S3((z - PLAN.Z_FULL1) / 75));
}

// ---------------------------------------------------------------- THE CROSS-SECTION LAW (section 3)
const K75 = 1 / 75, K800 = 1 / 800;                         // the tight arc's radius 75 m, the ceiling's 800 m
const TH100 = (100 / 75) * 0.5;                             // theta1(100): 38.20 deg
const TH217 = TH100 + 117 / 75;                             // theta1(217): 127.58 deg
const TH277 = TH217 + 60 / 75 + (K800 - K75) * 60 * 0.5;    // theta1(277): 152.65 deg (the edge, 596.5: 175.53 deg)
// theta1(a), radians: the closed form of the curvature's integral (four polynomial pieces)
export function theta1(a) {
  if (a <= 0) return 0;
  if (a > PLAN.L) a = PLAN.L;
  if (a < 100) { const t = a / 100; return (100 / 75) * (t * t * t - t * t * t * t / 2); }
  if (a < 217) return TH100 + (a - 100) / 75;
  if (a < 277) { const t = (a - 217) / 60; return TH217 + (a - 217) / 75 + (K800 - K75) * 60 * (t * t * t - t * t * t * t / 2); }
  return TH277 + (a - 277) / 800;
}
// curvature k1(a) (for the neighbours' gaps)
export function k1(a) {
  if (a <= 0) return 0;
  if (a < 100) return K75 * S3(a / 100);
  if (a < 217) return K75;
  if (a < 277) return K75 + (K800 - K75) * S3((a - 217) / 60);
  return K800;
}

// ---------------------------------------------------------------- THE BEND DOES NOT MOVE (redesign section 2, edit 4)
// b is 1 at every metre: the knots are filled once by makeBend(B0) and never set again; rampR is kept for the route's pace
const RE = 0.12, RV = 1 / (1 - RE);
export const B0 = 1;                                        // the curl's one shape
export const BEND_METRE = 0;                                // the named metre from which b stands at 1: the first
export function rampR(t) {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < RE) { const s = t / RE; return RV * RE * (s * s * s - s * s * s * s / 2); }
  if (t > 1 - RE) { const s = (1 - t) / RE; return 1 - RV * RE * (s * s * s - s * s * s * s / 2); }
  return RV * (t - RE / 2);
}
export const bAt = () => B0;

// ---------------------------------------------------------------- THE KNOTS AND THE JS MIRROR (section 6)
const GLX = [-0.9602898564975363, -0.7966664774136267, -0.5255324099163290, -0.1834346424956498, 0.1834346424956498, 0.5255324099163290, 0.7966664774136267, 0.9602898564975363];
const GLW = [0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.3626837833783620, 0.3626837833783620, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
// bendKnots(b, out): fills 65 knots (x, y, cos th, sin th) in world x for the bend b; the same code fills the uniform
export function bendKnots(b, out = new Float32Array(4 * (PLAN.N + 1))) {
  const h = PLAN.H; let x = PLAN.HX, y = PLAN.Y0;
  for (let i = 0; i <= PLAN.N; i++) {
    if (i > 0) {                                            // C by 8-point Gauss-Legendre on the knot interval
      const a0 = (i - 1) * h, hm = h / 2, c = a0 + hm; let sx = 0, sy = 0;
      for (let g = 0; g < 8; g++) { const th = b * theta1(c + hm * GLX[g]); sx += GLW[g] * Math.cos(th); sy += GLW[g] * Math.sin(th); }
      x += hm * sx; y += hm * sy;
    }
    const th = b * theta1(i * h);
    out[4 * i] = x; out[4 * i + 1] = y; out[4 * i + 2] = Math.cos(th); out[4 * i + 3] = Math.sin(th);
  }
  return out;
}
// bendFrame(knots, aA, out4): C and the frame at aA, the BEND chunk's own steps (Hermite place, mixed and normalized frame)
export function bendFrame(K, aA, o) {
  const h = PLAN.H, a = Math.min(Math.max(aA, 0), PLAN.L);
  const i = Math.min(Math.max(Math.floor(a / h), 0), PLAN.N - 1), s = a / h - i, j = 4 * i, k = j + 4;
  const s2 = s * s, s3 = s2 * s, h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
  o[0] = h00 * K[j] + h10 * h * K[j + 2] + h01 * K[k] + h11 * h * K[k + 2];
  o[1] = h00 * K[j + 1] + h10 * h * K[j + 3] + h01 * K[k + 1] + h11 * h * K[k + 3];
  let fc = K[j + 2] + (K[k + 2] - K[j + 2]) * s, fs = K[j + 3] + (K[k + 3] - K[j + 3]) * s;
  const r = 1 / Math.sqrt(Math.max(fc * fc + fs * fs, 1e-6)); o[2] = fc * r; o[3] = fs * r;
  return o;
}
const _f4 = new Float64Array(4);
// bendAt(knots, aA, du, dn, z, out): a flat-frame point carried by its anchor's frame; aA under 0 is flat (du, dn, z as given)
export function bendAt(K, aA, du, dn, z, out = new THREE.Vector3()) {
  if (aA < 0) return out.set(du, dn, z);
  const f = bendFrame(K, aA, _f4);
  return out.set(f[0] + du * f[2] - dn * f[3], f[1] + du * f[3] + dn * f[2], z);
}
// the normal of the land at aA (world), for the light's marks and the look targets
export function bendNormal(K, aA, out = new THREE.Vector3()) { const f = bendFrame(K, aA, _f4); return out.set(-f[3], f[2], 0); }
// --- END PIECE 1

// ---------------------------------------------------------------- THE BEND CHUNK (GLSL), line for line the mirror above
// (no loop, no noise, no sin or cos; the knot index clamped; the frame's length is at least cos 2.5 deg, never near 0)
export const BEND_GLSL = /* glsl */`
uniform vec4 uBendK[65];
attribute float aAnchor;
vec2 bendC; vec2 bendF;
void bendFrameAt(float aA) {
  const float bh = 9.3203125;                         // L / 64
  float a = clamp(aA, 0.0, 596.5);
  int i = clamp(int(floor(a / bh)), 0, 63);
  float s = a / bh - float(i);
  vec4 k0 = uBendK[i]; vec4 k1 = uBendK[i + 1];
  float s2 = s * s, s3 = s2 * s;
  bendC = (2.0 * s3 - 3.0 * s2 + 1.0) * k0.xy + (s3 - 2.0 * s2 + s) * bh * k0.zw + (-2.0 * s3 + 3.0 * s2) * k1.xy + (s3 - s2) * bh * k1.zw;
  vec2 f = mix(k0.zw, k1.zw, s);
  bendF = f * inversesqrt(max(dot(f, f), 1e-6));
}
vec3 bendPoint(vec3 p) { return aAnchor < 0.0 ? p : vec3(bendC + p.x * bendF + p.y * vec2(-bendF.y, bendF.x), p.z); }
`;
const SWAY_GLSL = /* glsl */`
attribute vec2 aSway;
uniform vec4 uSwayP;                                  // x the clock, y the wind's reach at the top (m), zw its way in the body's flat frame
vec3 swayOffset() {
  float t = uSwayP.x, s = uSwayP.y * aSway.x * (sin(t * 1.3 + aSway.y) + 0.35 * sin(t * 2.9 + aSway.y * 1.7));
  return vec3(s * uSwayP.z, 0.0, s * uSwayP.w);
}
`;
const PLAN_FRAG = /* glsl */`
uniform sampler2D uPlanMean; uniform sampler2D uPlanClass; uniform vec3 uPaving;
varying vec2 vPlan;
`;
// the cut by the CLASS texture: read nearest at the plan coordinate (never by fwidth), one read and a discard, last
const PLAN_CUT = /* glsl */`
  { ivec2 bpT = ivec2(clamp(floor(vPlan.x), 0.0, ${(PLAN.TEX_W - 1).toFixed(1)}), clamp(floor(vPlan.y + ${(-PLAN.Z_NEAR).toFixed(1)}), 0.0, ${(PLAN.TEX_H - 1).toFixed(1)}));
    if (texelFetch(uPlanClass, bpT, 0).r > 0.9) discard; }
`;
// the sun's term faded to 0 by the surface's own N.L (smoothstep 0.02 to 0.10): grazing faces take bounce only (section 9;
// a law of the sun and the surface, never of the eye)
// and THE CLOUD SHADOWS (section 8; the second mend's S8): the sun's term times the cloud field at the surface point's own place
// carried along the light to the cloud layer at 1,800 m (ONE texture read: its two octaves in R and G), the field moved only by
// the world clock with the clouds' drift (uCloudP.xy, set in update()), its cover by the dealt sky (uCloudP.w); no loop, no hash
const LIGHTS_FADED = THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );',
  'getDirectionalLightInfo( directionalLight, directLight );\n\t\tdirectLight.color *= smoothstep( 0.02, 0.10, dot( geometryNormal, directLight.direction ) );\n\t\tdirectLight.color *= closingCloudSun();');
const CLOUD_VERT = 'varying vec3 vCloudW;\n';
const CLOUD_FRAG = /* glsl */`
uniform sampler2D uCloudTex; uniform vec4 uCloudP; uniform vec4 uCloudQ; varying vec3 vCloudW;
float closingCloudSun() {                             // P + L (1800 - y) / L.y, in metres; uCloudQ: (L.x / L.y, L.z / L.y, depth, 0)
  vec2 q = vCloudW.xz + uCloudQ.xy * max(1800.0 - vCloudW.y, 0.0);
  vec2 n = texture(uCloudTex, q * uCloudP.z + uCloudP.xy).rg;
  return 1.0 - uCloudQ.z * smoothstep(uCloudP.w - 0.07, uCloudP.w + 0.07, 0.68 * n.r + 0.32 * n.g);
}
`;
// no field given: the sun's term untouched (depth 0)
const NO_CLOUD = { uCloudTex: { value: null }, uCloudP: { value: new THREE.Vector4(0, 0, 0, 2) }, uCloudQ: { value: new THREE.Vector4(0, 0, 0, 0) } };
export function fadeSun(shader) {
  for (const k in NO_CLOUD) if (!shader.uniforms[k]) shader.uniforms[k] = NO_CLOUD[k];
  shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + CLOUD_FRAG).replace('#include <lights_fragment_begin>', LIGHTS_FADED);
}
// the cloud varying: the vertex's world place as drawn (after the bend and the sway), in every colour program
const cloudVert = (v) => v.replace('#include <common>', '#include <common>\n' + CLOUD_VERT).replace('#include <project_vertex>', 'vCloudW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n#include <project_vertex>');
// THE RIVER WALLS' BOUNCE (S5): on a face the sun does not reach (by the same fade of its own N.L), the floor's bounce doubled:
// the hemisphere's ground term once more, by the face's own share of the ground (a law of the sun and the surface, never the eye)
const WALL_BOUNCE = /* glsl */`
#if ( NUM_HEMI_LIGHTS > 0 ) && ( NUM_DIR_LIGHTS > 0 ) && defined( RE_IndirectDiffuse )
  irradiance += hemisphereLights[ 0 ].groundColor * (0.5 - 0.5 * dot(geometryNormal, hemisphereLights[ 0 ].direction)) * (1.0 - smoothstep(0.02, 0.10, dot(geometryNormal, directionalLights[ 0 ].direction)));
#endif
`;

// ---------------------------------------------------------------- THE FACADES AND THE STONE (the first mend's M1 and M2)
// aFac: (s along the face from its corner, h up it from the ground's line, the face's width when it has openings else 0, the
// eaves' height); aKind: (the class, the body's own die). Plan coordinates (x or a, z) on level faces and on the floor.
const FAC_VERT = /* glsl */`
attribute vec4 aFac; attribute vec2 aKind; varying vec4 vFac; varying vec2 vKind;
`;
// shared helpers: a box-filtered pulse (1 where a < x < b, softened over the footprint w) and box-filtered lines of width f
// (a share of the period) on a period-1 coordinate (exact over the footprint, so far off they are their own mean, f)
const FAC_HELP = /* glsl */`
float fcHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float fcBox(float x, float a, float b, float w) { float k = 1.0 / max(w, 0.001); return clamp((x - a) * k + 0.5, 0.0, 1.0) * clamp((b - x) * k + 0.5, 0.0, 1.0); }
float fcLines(float x, float w, float f) {               // (and to the mean outright from a footprint of 0.8 periods: no moire)
  float n = 1.0 / f, a = x + 0.5 * w, b = x - 0.5 * w;
  float c = clamp((floor(a) + min(fract(a) * n, 1.0) - floor(b) - min(fract(b) * n, 1.0)) / max(n * w, 0.0001), 0.0, 1.0);
  return mix(c, f, smoothstep(0.35, 0.8, w));
}
// coursed masonry: bed joints every rh, perpends every bl staggered course by course (the perpends to their mean once the
// courses are under the footprint); the units toned so that the whole keeps the face's own colour as its mean
vec3 fcCourses(vec3 base, vec3 mortar, float s, float h, float ws, float wh, float rh, float bl, float fb, float fp) {
  float bed = fcLines(h / rh, wh / rh, fb), pf = smoothstep(0.35, 0.8, wh / rh);
  float per = mix(fcLines(s / bl + 0.5 * mod(floor(h / rh), 2.0), ws / bl, fp), fp, pf);
  float mort = bed + per * (1.0 - bed), mm = fb + fp * (1.0 - fb);
  return mix(max((base - mortar * mm) / (1.0 - mm), vec3(0.0)), mortar, mort);
}
`;
const FACADE_FRAG = /* glsl */`
uniform vec3 uShutA; uniform vec3 uShutB; uniform vec3 uShutC; uniform vec3 uTrim;
varying vec4 vFac; varying vec2 vKind;
${FAC_HELP}
vec3 facadeColour(vec3 base, float ws, float wh) {
  float cls = floor(vKind.x + 0.5);
  if (cls < 0.5 || abs(cls - 5.0) < 0.5) return base;                    // plain, and the hedges
  float seed = vKind.y, s = vFac.x, h = vFac.y, W = vFac.z, E = vFac.w;
  if (cls > 8.5) {
    // CANAL TILES: the shade between the tiles' rounded backs every 0.21 m along the eaves, the lap of each course every
    // 0.15 m of rise, each course's tiles a little varied; and (S9) each roof's PATCHES of older and newer tiles, 2.4 by 1.8 m
    // cells, about 15 in 100 greyer and darker, 15 in 100 fresher (the second hash; the two shares even, so the mean is the
    // roof's own colour), faded out by fwidth like the tiles
    float rib = fcLines(s / 0.21, ws / 0.21, 0.35), lap = fcLines(h / 0.15, wh / 0.15, 0.2);
    float tf = smoothstep(0.3, 0.8, max(ws / 1.05, wh / 0.3)), pf = smoothstep(0.3, 0.8, max(ws / 2.4, wh / 1.8));
    float tv = (fcHash(floor(vec2(s / 1.05, h / 0.3)) + seed * 37.0) - 0.5) * (1.0 - tf);
    float ph = fcHash(floor(vec2(s / 2.4, h / 1.8)) + seed * 53.0 + 11.0);
    vec3 pt = ph > 0.85 ? vec3(0.86, 0.87, 0.90) : ph < 0.15 ? vec3(1.14, 1.08, 1.0) : vec3(1.0);
    return base * mix(pt, vec3(1.0), pf) * ((1.0 - 0.22 * rib - 0.12 * lap) / 0.899) * (1.0 + 0.22 * tv);
  }
  vec3 mortar = vec3(0.50, 0.45, 0.36), tile = vec3(0.32, 0.12, 0.055);
  float brick = (cls < 1.5 || abs(cls - 6.0) < 0.5 || abs(cls - 8.0) < 0.5) ? 1.0 : 0.0, hall = abs(cls - 8.0) < 0.5 ? 1.0 : 0.0;
  vec3 col = base;
  if (brick > 0.5) col = fcCourses(base, mortar, s, h, ws, wh, 0.075, 0.30, 0.16, 0.04);     // thin red brick (Albi, Ferrara)
  else if (cls < 3.5) {                                                    // stucco and lime wash (Girona, Evora): a soft unevenness
    float mf = smoothstep(0.15, 0.6, max(ws, wh) / 2.5);
    float mo = (sin(s * 1.31 + seed * 23.0) * sin(h * 1.73 + s * 0.41) + 0.6 * sin(s * 0.53 - h * 0.37 + seed * 9.0)) * (1.0 - mf);
    col = base * (1.0 + 0.05 * mo);
    col = mix(col, cls > 2.5 ? uTrim : base * 0.8, fcBox(h, -3.0, 0.5, wh));               // the socle: ochre on lime, darker on stucco
  } else col = fcCourses(base, mortar, s, h, ws, wh, 0.30, 0.55, 0.08, 0.05);              // a garden wall's coursed rubble
  if (abs(cls - 6.0) > 0.5) col = mix(col, tile, 0.75 * fcBox(h, E - 0.3, E + 0.02, wh));  // the eaves' two tile courses; a wall's coping
  if (W > 2.4) {
    // OPENINGS, cell by cell along the face and floor by floor (3.1 m): a window 1.0 by 1.35 m with its surround (ochre on lime,
    // a paler band on stucco, a stone sill on brick), shut shutters on some, a door on the ground floor; a hall one tall window
    float nC = max(1.0, floor(W / mix(2.9, 3.6, hall))), cw = max(W, 2.4) / nC;
    float ci = clamp(floor(s / cw), 0.0, nC - 1.0), x = s - (ci + 0.5) * cw, fi = max(floor(h / 3.1), 0.0);
    float y = mix(h - fi * 3.1, h, hall), hw = mix(0.5, 0.65, hall), y0 = mix(1.0, 3.0, hall), y1 = mix(2.35, max(E - 1.4, 4.0), hall);
    float isDoor = (1.0 - hall) * (1.0 - step(0.5, fi)) * (1.0 - step(0.5, abs(ci - floor(seed * nC))));
    float win = fcBox(x, -hw, hw, ws) * fcBox(y, y0, y1, wh) * (1.0 - isDoor);
    float inner = fcBox(x, -hw + 0.08, hw - 0.08, ws) * fcBox(y, y0 + 0.08, y1 - 0.08, wh) * (1.0 - isDoor);
    float ring = fcBox(x, -hw - 0.15, hw + 0.15, ws) * fcBox(y, y0 - 0.15, y1 + 0.15, wh) * (1.0 - isDoor);
    float sill = fcBox(x, -hw - 0.1, hw + 0.1, ws) * fcBox(y, y0 - 0.13, y0, wh) * (1.0 - isDoor);
    float door = isDoor * fcBox(x, -0.6, 0.6, ws) * fcBox(h, -1.0, 2.3, wh), dring = isDoor * fcBox(x, -0.76, 0.76, ws) * fcBox(h, -1.0, 2.46, wh);
    float shareShut = (1.0 - hall) * mix(0.55, 0.35, brick);
    float shut = step(fcHash(vec2(ci + 13.0 * seed, fi + W)), shareShut);
    vec3 sh = seed < 0.333 ? uShutA : (seed < 0.667 ? uShutB : uShutC);
    vec3 frameC = vec3(0.50, 0.47, 0.42), glass = vec3(0.03, 0.035, 0.045);
    vec3 trimC = brick > 0.5 ? vec3(0.60, 0.55, 0.46) : (cls < 2.5 ? min(base * 1.3 + 0.04, vec3(0.9)) : uTrim);
    float trimA = brick > 0.5 ? max(sill, dring) : max(ring, dring);
    vec3 pc = mix(col, trimC, trimA);
    pc = mix(pc, mix(frameC, sh, shut), win);
    pc = mix(pc, mix(glass, sh * (1.0 - 0.45 * fcBox(x, -0.03, 0.03, ws)), shut), inner);
    pc = mix(pc, vec3(0.09, 0.055, 0.03) * (0.8 + 0.5 * seed), door);
    // their mean over a cell, taken as the footprint grows past a share of the cell
    float cellA = cw * mix(3.1, max(E, 3.0), hall), aWin = 2.0 * hw * (y1 - y0) / cellA;
    float aTrim = brick > 0.5 ? 2.0 * (hw + 0.1) * 0.13 / cellA : 2.0 * (hw + 0.15) * (y1 - y0 + 0.3) / cellA - aWin;
    vec3 mean = mix(mix(col, trimC, aTrim), mix(mix(frameC, glass, 0.7), sh, shareShut), aWin);
    col = mix(pc, mean, smoothstep(0.2, 0.5, max(ws / cw, wh / 3.1)));
  }
  return col;
}
`;
// the flat world's stone, each to its own mean by the footprint (at most 2 hash calls a fragment):
// THE RIVERBED'S FLOOR (10; the second mend's S1): the floor texture (irregular stones, cracked bedrock, gravel and sand, no
// rows) read once by the plan place over its 48 m tile, through its mipmaps and the renderer's greatest anisotropic filtering
// (the renderer's sampling by the pixel's footprint, as fwidth does), over the 10 m tone fields of the vertex colours; its RGB
// times 2 keeps the field's own mean. A GRAVEL BAR (11, S2): the texture's gravel (A), paler on its crest (by the vertex
// colours). A BOULDER (12, S3): its facets' own tone, mottled by the gravel. ASHLAR (13: the sills, the old weir, the pedestal
// and its collar, the stairs' treads) and BRICK (14: the pedestal's body)
const STONE_FRAG = /* glsl */`
uniform sampler2D uFloorTex;
varying vec4 vFac; varying vec2 vKind;
${FAC_HELP}
vec3 stCoursed(vec2 p, vec2 w, float rh, float bl, float jf) {      // (joint, the unit's tone faded to its mean, the unit's die)
  float row = floor(p.y / rh), bx = p.x / bl + fcHash(vec2(row, 17.0));
  float fr = smoothstep(0.35, 0.8, w.y / rh), fb = smoothstep(0.3, 0.8, max(w.x / bl, w.y / rh)), jbf = jf * rh / bl;
  float jr = fcLines(p.y / rh, w.y / rh, jf), jb = mix(fcLines(bx, w.x / bl, jbf), jbf, fr), d = fcHash(vec2(floor(bx), row));
  return vec3(jr + jb * (1.0 - jr), (d - 0.5) * (1.0 - fb), d);
}
vec3 stoneColour(vec3 base, vec2 w) {
  float cls = floor(vKind.x + 0.5);
  vec2 p = vFac.xy, fuv = p / 48.0, gx = dFdx(fuv), gy = dFdy(fuv);   // (the gradients taken outside every branch)
  if (cls < 9.5) return base;
  if (cls < 12.5) {
    vec4 ft = textureGrad(uFloorTex, fuv, gx, gy);
    if (cls > 11.5) return base * (0.8 + 0.4 * ft.a);
    // a second read of the same texture turned 37 deg and at 48 / 41 of the scale, mixed in by broad soft fields of 90 to 270 m:
    // no two tiles alike, so the tile never shows
    const mat2 rot = mat2(0.7986, 0.6018, -0.6018, 0.7986);
    vec4 f2 = textureGrad(uFloorTex, rot * fuv * 1.1707 + vec2(0.37, 0.71), rot * gx * 1.1707, rot * gy * 1.1707);
    float m = smoothstep(0.3, 0.7, 0.5 + 0.5 * sin(p.x * 0.067 + 2.1 * sin(p.y * 0.019)) * sin(p.y * 0.041 + 1.6 * sin(p.x * 0.029)));
    vec3 fl = mix(ft.rgb, f2.rgb, m) * 1.88;     // (its mean 0.5 times 2 times 0.94: the 10 m fields' tones average 0.51, the floor 0.48)
    if (cls < 10.5) return base * fl;
    // a bar (11): the floor's own stone at its foot, its cobbles from its crest's weight (the third coordinate) of 0.4 up
    return base * mix(fl, vec3(0.35 + 1.3 * ft.a), smoothstep(0.0, 0.4, vFac.z));
  }
  if (cls < 13.5) { vec3 c = stCoursed(p, w, 0.45, 0.85, 0.06); return mix(base * (1.0 + 0.26 * c.y), base * 0.62, c.x); }
  return fcCourses(base, vec3(0.50, 0.45, 0.36), p.x, p.y, w.x, w.y, 0.075, 0.30, 0.16, 0.04);
}
`;
// THE RIVER WALLS (15; the second mend's S5), drawn by each face's own coordinates (s along it from its piece's start, the
// piece's start in metres carried in the die as (start + 1,000) / 10,000; h its height, the world's y): thin red brick in
// courses of 0.066 m and units of 0.42 m (Toulouse's foraine), a footing of coursed rubble to 0.9 m, a string course of pale
// stone at 6.72 to 7.0 m under the parapet, repair patches of a paler or a darker brick (5.3 by 2.1 m cells, one hash), the
// drains (an outlet every 31.7 m with its dark stain below), the damp toward the foot; every pattern to its mean by the footprint
const WALL_FRAG = /* glsl */`
vec3 riverWall(vec3 base, vec2 w) {
  float cls = floor(vKind.x + 0.5);
  if (abs(cls - 15.0) > 0.5) return stoneColour(base, w);
  float s = vFac.x, h = vFac.y, ws = w.x, wh = w.y, sA = s + vKind.y * 10000.0 - 1000.0;
  vec3 mortar = vec3(0.47, 0.42, 0.34);
  vec3 col = fcCourses(base, mortar, s, h, ws, wh, 0.066, 0.42, 0.2, 0.05);
  float pf = 1.0 - smoothstep(0.25, 0.6, max(ws / 5.3, wh / 2.1)), hp = fcHash(floor(vec2(sA / 5.3, h / 2.1)) + 0.5);
  col *= mix(vec3(1.0), hp > 0.89 ? vec3(1.13, 1.07, 1.02) : vec3(0.85, 0.79, 0.77), step(0.78, hp) * pf * step(0.9, h) * (1.0 - step(6.72, h)));
  col = mix(col, fcCourses(vec3(0.40, 0.36, 0.30), mortar * 0.8, s, h, ws, wh, 0.30, 0.55, 0.08, 0.05), fcBox(h, -2.0, 0.9, wh));
  col = mix(col, vec3(0.50, 0.46, 0.38), fcBox(h, 6.72, 7.0, wh));
  float dx = mod(sA + 7.0, 31.7) - 15.85, df = 1.0 - smoothstep(0.3, 1.0, max(ws / 0.7, wh / 0.7));
  col *= 1.0 - 0.85 * df * fcBox(dx, -0.3, 0.3, ws) * fcBox(h, 1.15, 1.75, wh);
  col *= 1.0 - 0.35 * df * fcBox(dx, -0.36, 0.36, ws) * fcBox(h, 0.0, 1.15, wh) * (0.6 + 0.4 * smoothstep(0.0, 1.1, h));
  col *= mix(0.86, 1.0, smoothstep(0.4, 2.6, h)) * (1.0 + 0.05 * sin(sA * 0.9 + 2.0 * sin(sA * 0.23)) * (1.0 - smoothstep(0.3, 0.8, ws / 3.0)));
  return col;
}
`;

// makeBend(): the knots for the current b, in ONE uniform shared by every island program (set(b) refills them in place)
export function makeBend(b0 = B0) {
  const knots = bendKnots(b0), uniforms = { uBendK: { value: knots } }; let cur = b0;
  return { knots, uniforms, get b() { return cur; }, set(b) { if (b !== cur) { cur = b; bendKnots(b, knots); } } };
}
// the shared wind of every tree (the clock and the dealt wind); one uniform object for all tree programs
export function makeSwayUniforms(reach, dirAngle) { return { uSwayP: { value: new THREE.Vector4(0, reach, Math.cos(dirAngle), Math.sin(dirAngle)) } }; }

// patch(material, kind, pass, bend, extra): injects the BEND chunk (and the sway, and the plan's colour and cut for the land)
// into a material's program: kind 'land' | 'house' | 'tree'; pass 'colour' | 'depth'. Every patched material sets its own
// customProgramCacheKey (the chunk's name, the kind and the pass), so no two share a program wrongly.
function patch(mat, kind, pass, bend, extra) {
  const tree = kind === 'tree', land = kind === 'land', colour = pass === 'colour', fac = kind === 'house' && colour;
  const night = colour && extra.night ? extra.night : null;   // THE NIGHT HOOK: the blue hour's own GLSL (see bendMaterials)
  const landNightDepth = land && !colour && !!(extra.night && extra.night.uniforms && extra.night.uniforms.uPlanClass);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, bend.uniforms);
    if (tree) Object.assign(sh.uniforms, extra.sway);
    if (land) Object.assign(sh.uniforms, extra.plan);
    if (fac && !night) Object.assign(sh.uniforms, extra.facade);
    if (night && night.uniforms) Object.assign(sh.uniforms, night.uniforms);
    // THE NIGHT LAND'S DEPTH PASS takes the plan's class texture and its box from the night hook: its cut reads a bound texture
    if (landNightDepth) { sh.uniforms.uPlanClass = extra.night.uniforms.uPlanClass; sh.uniforms.uPlanBox = extra.night.uniforms.uPlanBox; }
    let v = sh.vertexShader.replace('#include <common>', '#include <common>\n' + BEND_GLSL + (tree ? SWAY_GLSL : '') + (land ? 'varying vec2 vPlan;\n' : '') + (fac ? FAC_VERT : night ? NIGHT_VARY : ''));
    if (colour) v = v.replace('#include <beginnormal_vertex>', /* glsl */`
      vec3 objectNormal = vec3( normal );
      #define BEND_FRAMED
      bendFrameAt(aAnchor);
      if (aAnchor >= 0.0) objectNormal = vec3(objectNormal.x * bendF.x - objectNormal.y * bendF.y, objectNormal.x * bendF.y + objectNormal.y * bendF.x, objectNormal.z);`);
    v = v.replace('#include <begin_vertex>', /* glsl */`
      #ifndef BEND_FRAMED
      bendFrameAt(aAnchor);
      #endif
      vec3 transformed = bendPoint(position${tree ? ' + swayOffset()' : ''});${land ? '\n      vPlan = vec2(aAnchor < 0.0 ? 56.0 - position.x : aAnchor, position.z);' : ''}${fac ? '\n      vFac = aFac; vKind = aKind;' : night ? (tree ? NIGHT_TREE : NIGHT_LAND) : ''}`);
    if (colour && !night) v = cloudVert(v);
    sh.vertexShader = v;
    let f = sh.fragmentShader;
    if (fac && !night) f = f.replace('#include <common>', '#include <common>\n' + FACADE_FRAG).replace('#include <color_fragment>',
      '#include <color_fragment>\n      { vec2 fcW = fwidth(vFac.xy); diffuseColor.rgb = facadeColour(diffuseColor.rgb, fcW.x, fcW.y); }');
    if (night) f = f.replace('#include <common>', '#include <common>\n' + NIGHT_VARY + (night.pars || '')).replace('#include <color_fragment>', '#include <color_fragment>\n' + (night.colour || ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + (night.emit || ''));
    // THE CUT IS THE LAST THING A LAND PROGRAM DOES (every derivative and filtered read stands before it): the night colour
    // program by its own flag, the night depth program by one nearest read of the class at the fragment's metre
    if (land && night) f = f.replace(/}\s*$/, '  if (landCut) discard;\n}\n');
    else if (landNightDepth) f = f.replace('#include <common>', '#include <common>\nuniform sampler2D uPlanClass; uniform vec4 uPlanBox; varying vec2 vPlan;\n')
      .replace(/}\s*$/, '  { ivec2 bpT = ivec2(clamp(floor(vec2(vPlan.x, vPlan.y - uPlanBox.x)), vec2(0.0), uPlanBox.yz - 1.0)); if (texelFetch(uPlanClass, bpT, 0).r * 255.0 > 250.0) discard; }\n}\n');
    else if (land && !night) {
      f = f.replace('#include <common>', '#include <common>\n' + PLAN_FRAG);
      if (colour) f = f.replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec3 bpCol = texture(uPlanMean, vec2(vPlan.x / ${PLAN.TEX_W.toFixed(1)}, (vPlan.y + ${(-PLAN.Z_NEAR).toFixed(1)}) / ${PLAN.TEX_H.toFixed(1)})).rgb;
        diffuseColor.rgb *= gl_FrontFacing ? bpCol : uPaving;   // the land's back in the ground's own paving colour`);
      f = f.replace(/}\s*$/, PLAN_CUT + '}\n');
    }
    sh.fragmentShader = f;
    if (colour && !night) fadeSun(sh);                        // (the cloud shadows and the sun's fade retire with the night hook)
  };
  mat.customProgramCacheKey = () => 'closing-bend-' + kind + '-' + pass + (fac ? '-facade' : '') + (night ? '-night-' + (night.key || '') : '');
  return mat;
}
// the night hook's varyings, declared in the vertex and the fragment program of every colour program that takes extra.night:
// vFac (s along the face, h up it, the face's width if it has openings else 0, the eaves' height), vKind (class, the body's seed).
// A house carries them from the Writer; a tree gives (0, its height over its own ground, 0, 0) and (0, its sway's phase); the
// land gives (a, 0, 0, 0) and (0, 0). Heights are up the body's own ground: the flat world's ground is the paving, y 7.
const NIGHT_VARY = 'varying vec4 vFac; varying vec2 vKind;\n';
const NIGHT_TREE = '\n      vFac = vec4(0.0, aAnchor < 0.0 ? position.y - 7.0 : position.y, 0.0, 0.0); vKind = vec2(0.0, aSway.y);';
const NIGHT_LAND = '\n      vFac = vec4(vPlan.x, 0.0, 0.0, 0.0); vKind = vec2(0.0);';
// the facade's uniforms from the dealt palette: its three shutter colours (shares by palette) and the lime's ochre trim
export function facadeUniforms(pal) {
  const S = pal.shut.map((h) => new THREE.Color(h));
  return { uShutA: { value: S[0] }, uShutB: { value: S[1] }, uShutC: { value: S[2] }, uTrim: { value: new THREE.Color('#cfa14c') } };
}
// bendMaterials(bend, kind, extra), kind 'land' | 'house' | 'tree': extra.night = { pars, colour, emit, uniforms, key } gives the
// colour program its GLSL of the blue hour: pars after <common>, colour after <color_fragment>, emit after
// <emissivemap_fragment>; for 'house' it REPLACES the old facade call. That GLSL sees vFac, vKind, diffuseColor and
// totalEmissiveRadiance (classes: 1 brick, 2 stucco, 3 lime, 4 garden wall, 5 hedge, 6 tower, 7 lit plain, 8 hall, 9 roof).
// bendMaterials(bend, kind, extra): the colour material and its depth material (customDepthMaterial: MeshDepthMaterial with
// RGBADepthPacking, as the kit's windDepthMaterial is), both carrying the BEND chunk; the shadow pass uses the depth one
export function bendMaterials(bend, kind, extra = {}) {
  const land = kind === 'land';
  const colour = patch(new THREE.MeshLambertMaterial(land ? { color: 0xffffff, side: THREE.DoubleSide } : { vertexColors: true }), kind, 'colour', bend, extra);
  const depth = patch(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: land ? THREE.DoubleSide : THREE.FrontSide }), kind, 'depth', bend, extra);
  colour.userData.depthMaterial = depth;
  // (nothing is hooked on the material: whoever made the pair frees both, pair.dispose(); makeLand's own dispose does)
  return { colour, depth, dispose() { colour.dispose(); depth.dispose(); } };
}
// a lit material for the flat world (riverbed, banks), with the same faded sun term, the cloud shadows and the stone patterns:
// o.floor the floor texture (S1), o.cloud the cloud field's uniforms (S8); o.wall: THE RIVER WALLS' OWN MATERIAL (S5), the same
// stone for the weir and the plinth and, for class 15, the walls' brick by their own world place, and the floor's bounce doubled
export function flatMaterial(o = {}) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  const fl = { uFloorTex: { value: o.floor || null } }, wall = !!o.wall;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, fl, o.cloud || {});
    sh.vertexShader = cloudVert(sh.vertexShader.replace('#include <common>', '#include <common>\n' + FAC_VERT).replace('#include <begin_vertex>', '#include <begin_vertex>\n  vFac = aFac; vKind = aKind;'));
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + STONE_FRAG + (wall ? WALL_FRAG : '')).replace('#include <color_fragment>',
      '#include <color_fragment>\n  { vec2 stW = fwidth(vFac.xy); diffuseColor.rgb = ' + (wall ? 'riverWall(diffuseColor.rgb, stW)' : 'stoneColour(diffuseColor.rgb, stW)') + '; }');
    fadeSun(sh);
    if (wall) sh.fragmentShader = sh.fragmentShader.replace('#if defined( RE_IndirectSpecular )', WALL_BOUNCE + '#if defined( RE_IndirectSpecular )');
  };
  m.customProgramCacheKey = () => (wall ? 'closing-flat-wall' : 'closing-flat-stone');
  m.userData.floor = fl;
  return m;
}
// --- END PIECE 2

// ---------------------------------------------------------------- THE WRITER: bodies authored flat, in their anchor's frame
// A body is begun with its anchor: on the island (aA 0 or more) its vertices are written as (du, dn, zc + dz) with aAnchor =
// aA, for the BEND to carry; in the flat world (aA -1) they are written in world space, turned by the body's yaw about y
// (local du, dz -> world). Normals are the faces' own, in the same frame (the BEND turns them with the body).
// a growing Float32Array (the Writer's arrays: written in place, so the build makes no long number arrays to copy; the second
// mend's builder B, for the build's 1.5 s: the same float32 values as before, byte for byte)
class FBuf {
  constructor(per) { this.per = per; this.v = new Float32Array(per * 1024); this.len = 0; }
  grow(tris) { const g = new Float32Array(this.per * tris); g.set(this.v.subarray(0, this.len)); this.v = g; }
  out() { return this.v.slice(0, this.len); }
}
export class Writer {
  constructor(sway = false, soft = false) { this.soft = soft; this.p = new FBuf(9); this.n = new FBuf(9); this.c = new FBuf(9); this.a = new FBuf(3); this.s = sway ? new FBuf(6) : null; this.f = sway ? null : new FBuf(12); this.k = sway ? null : new FBuf(6); this.tris = 0; this.cap = 1024; this._ext = null; this._kept = true; this.body(0, 0); }
  _grow() { this.cap *= 2; for (const b of [this.p, this.n, this.c, this.a, this.s, this.f, this.k]) if (b) b.grow(this.cap); }
  // body(aA, zc, flat?): flat = { x, y, z, yaw } places it in the flat world
  body(aA, zc, flat = null, sway = null) {
    this.aA = flat ? -1 : aA; this.zc = zc; this.fl = flat; this.sw = sway;
    if (flat) { this.cy = Math.cos(flat.yaw || 0); this.sy = Math.sin(flat.yaw || 0); }
    return this.look(0);
  }
  // look(cls, seed, eaves, open): the facade class of what is written next (0 plain; 1 brick, 2 stucco, 3 lime wash, 4 a garden
  // wall's rubble, 5 hedge, 6 a tower's brick, 8 a hall's brick with tall windows; a sloped face of 1 to 8 takes 9, the canal
  // tiles; 10 the floor's slabs, 11 a cobble bar, 13 ashlar, 14 the flat world's brick), the body's own die (its variants), its
  // eaves' height, and which upright faces have openings: 'u' (those facing along u), 'z', 'all' or 'none'
  look(cls, seed = 0, eaves = 0, open = 'none') { this.cls = cls; this.seed = seed; this.eav = eaves; this.open = open; return this; }
  // the facade coordinates of a face's vertices: on the floor's classes and level faces the plan (u, z); on upright and sloped
  // faces s along the face (z on a face that looks along u, else u) from the face's own corner and h up it
  _facet(Q, hint) {
    const hx = hint[0], hy = hint[1], hz = hint[2], level = Math.abs(hx) + Math.abs(hz) < 1e-9, cl = this.cls;
    const plan = level || (cl >= 10 && cl <= 12), axisU = Math.abs(hx) >= Math.abs(hz);
    const cls = plan ? (level && cl < 10 ? 0 : cl) : (hy !== 0 && cl > 0 && cl < 9 ? 9 : cl);
    const iv = !plan && axisU ? 2 : 0;                        // s along the face: q[iv]
    let lo = Infinity, hi = -Infinity;
    if (this._ext && !plan) { lo = this._ext[0]; hi = this._ext[1]; } else for (let k = 0; k < 3; k++) { const v = Q[k][iv]; lo = Math.min(lo, v); hi = Math.max(hi, v); }
    const open = hy === 0 && (this.open === 'all' || (this.open === 'u' && axisU) || (this.open === 'z' && !axisU));
    const W = open && cls > 0 && cls < 9 ? hi - lo : 0, o = plan ? 0 : lo, F = _F;   // (one scratch record, read at once by tri)
    F.cls = cls; for (let k = 0; k < 3; k++) { const q = Q[k]; F.s[k] = q[iv] - o; F.h[k] = plan ? q[2] : q[1]; F.w[k] = plan ? q[3] || 0 : W; }
    return F;
  }
  _w(q, out) {                                              // local (du, dn, dz) -> written place
    if (!this.fl) { out[0] = q[0]; out[1] = q[1]; out[2] = this.zc + q[2]; return out; }
    const F = this.fl; out[0] = F.x + q[0] * this.cy + q[2] * this.sy; out[1] = F.y + q[1]; out[2] = F.z - q[0] * this.sy + q[2] * this.cy; return out;
  }
  // one triangle; hint: the outward way in the local frame (the winding is set by it)
  tri(q0, q1, q2, col, hint) {
    const A = this._w(q0, _wa), B = this._w(q1, _wb), C = this._w(q2, _wc);
    let ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    let hx = hint[0], hz = hint[2]; if (this.fl) { const t = hx * this.cy + hz * this.sy; hz = -hx * this.sy + hz * this.cy; hx = t; }
    const kept = !(nx * hx + ny * hint[1] + nz * hz < 0); if (!kept) { nx = -nx; ny = -ny; nz = -nz; }
    const r = 1 / (Math.hypot(nx, ny, nz) || 1); nx *= r; ny *= r; nz *= r;
    const P = _P, Q = _Q; P[0] = A; P[1] = kept ? B : C; P[2] = kept ? C : B; Q[0] = q0; Q[1] = kept ? q1 : q2; Q[2] = kept ? q2 : q1;
    const cs = Array.isArray(col);                            // a colour per vertex (in the written order), or one for the face
    const F = this.f ? this._facet(Q, hint) : null; this._kept = kept; if (this.tris >= this.cap) this._grow();
    const p = this.p, n = this.n, cc = this.c, aa = this.a, S = this.s, Fb = this.f, Kb = this.k;
    for (let k = 0; k < 3; k++) {
      const c = cs ? col[k === 0 || kept ? k : 3 - k] : col, Pk = P[k]; let i = p.len;
      p.v[i] = Pk[0]; p.v[i + 1] = Pk[1]; p.v[i + 2] = Pk[2]; n.v[i] = nx; n.v[i + 1] = ny; n.v[i + 2] = nz; cc.v[i] = c.r; cc.v[i + 1] = c.g; cc.v[i + 2] = c.b;
      p.len = n.len = cc.len = i + 3; aa.v[aa.len++] = this.aA;
      if (this.soft && !this.fl) { p.v[i] = 0; aa.v[aa.len - 1] = Math.min(Math.max(this.aA + Pk[0], 0), PLAN.L); }   // SOFT: the vertex rides its own ground
      if (S) { const sw = this.sw, h = Q[k][1]; i = S.len; S.v[i] = sw ? Math.max(0, h / sw.H) ** 2 * sw.k : 0; S.v[i + 1] = sw ? sw.phase : 0; S.len = i + 2; }
      if (F) { i = Fb.len; Fb.v[i] = F.s[k]; Fb.v[i + 1] = F.h[k]; Fb.v[i + 2] = F.w[k]; Fb.v[i + 3] = this.eav; Fb.len = i + 4; i = Kb.len; Kb.v[i] = F.cls; Kb.v[i + 1] = this.seed; Kb.len = i + 2; }
    }
    this.tris++;
  }
  // one triangle of a smooth surface (the second mend's bars): N, its three vertex normals (each the surface's true slope there,
  // in the same frame), and the winding set by their mean; written as tri() writes, then the normals replaced
  triN(q0, q1, q2, col, N) {
    const h = [N[0][0] + N[1][0] + N[2][0], N[0][1] + N[1][1] + N[2][1], N[0][2] + N[1][2] + N[2][2]], at = this.n.len;
    this.tri(q0, q1, q2, col, h);
    const order = this._kept ? [0, 1, 2] : [0, 2, 1], nv = this.n.v;
    for (let k = 0; k < 3; k++) { let [x, y, z] = N[order[k]]; if (this.fl) { const t = x * this.cy + z * this.sy; z = -x * this.sy + z * this.cy; x = t; } const r = 1 / (Math.hypot(x, y, z) || 1); nv[at + 3 * k] = x * r; nv[at + 3 * k + 1] = y * r; nv[at + 3 * k + 2] = z * r; }
  }
  // a quad (its two triangles share the face's own facade frame); col one colour or four, one per corner
  quad(q0, q1, q2, q3, col, hint) {
    if (this.f) { const axisU = Math.abs(hint[0]) >= Math.abs(hint[2]), v = [q0, q1, q2, q3].map((q) => (axisU ? q[2] : q[0])); this._ext = [Math.min(...v), Math.max(...v)]; }
    const A = Array.isArray(col);
    this.tri(q0, q1, q2, A ? [col[0], col[1], col[2]] : col, hint); this.tri(q0, q2, q3, A ? [col[0], col[2], col[3]] : col, hint);
    this._ext = null;
  }
  // a box of the frame's axes (no bottom unless asked)
  box(u0, u1, n0, n1, z0, z1, col, bottom = false) {
    this.quad([u1, n0, z0], [u1, n1, z0], [u1, n1, z1], [u1, n0, z1], col, [1, 0, 0]);
    this.quad([u0, n0, z0], [u0, n1, z0], [u0, n1, z1], [u0, n0, z1], col, [-1, 0, 0]);
    this.quad([u0, n0, z1], [u1, n0, z1], [u1, n1, z1], [u0, n1, z1], col, [0, 0, 1]);
    this.quad([u0, n0, z0], [u1, n0, z0], [u1, n1, z0], [u0, n1, z0], col, [0, 0, -1]);
    this.quad([u0, n1, z0], [u1, n1, z0], [u1, n1, z1], [u0, n1, z1], col, [0, 1, 0]);
    if (bottom) this.quad([u0, n0, z0], [u1, n0, z0], [u1, n0, z1], [u0, n0, z1], col, [0, -1, 0]);
  }
  // a gable roof over u0..u1 x z0..z1 from the eaves at e; along: 'z' (ridge along z) or 'u'; o the eaves' overhang, v the
  // verge's over the gables (0 for a row house: its roof ends flush at its gables, never over a neighbour)
  gable(u0, u1, z0, z1, e, pitch, o, col, along, wallCol, v = o) {
    const t = Math.tan(pitch);
    if (along === 'z') {
      const uc = (u0 + u1) / 2, r = e + (u1 - u0) / 2 * t, eo = e - o * t;
      this.quad([u0 - o, eo, z0 - v], [uc, r, z0 - v], [uc, r, z1 + v], [u0 - o, eo, z1 + v], col, [-1, 1, 0]);
      this.quad([u1 + o, eo, z0 - v], [uc, r, z0 - v], [uc, r, z1 + v], [u1 + o, eo, z1 + v], col, [1, 1, 0]);
      this.tri([u0, e, z0], [u1, e, z0], [uc, r, z0], wallCol, [0, 0, -1]); this.tri([u0, e, z1], [u1, e, z1], [uc, r, z1], wallCol, [0, 0, 1]);
      return r;
    }
    const zc = (z0 + z1) / 2, r = e + (z1 - z0) / 2 * t, eo = e - o * t;
    this.quad([u0 - v, eo, z0 - o], [u0 - v, r, zc], [u1 + v, r, zc], [u1 + v, eo, z0 - o], col, [0, 1, -1]);
    this.quad([u0 - v, eo, z1 + o], [u0 - v, r, zc], [u1 + v, r, zc], [u1 + v, eo, z1 + o], col, [0, 1, 1]);
    this.tri([u0, e, z0], [u0, e, z1], [u0, r, zc], wallCol, [-1, 0, 0]); this.tri([u1, e, z0], [u1, e, z1], [u1, r, zc], wallCol, [1, 0, 0]);
    return r;
  }
  // A RUN'S END ROOF (the second mend's S9): a row house's roof, its ridge along 'z' or 'u', its eaves overhanging o on its two
  // long sides only (across the ridge: no eave over either end, so none over a neighbour); the ridge's low end hipped if h0, its
  // high end if h1, each hip's face rising to the ridge over min(half the span, 0.45 of the ridge's length); an end not hipped
  // keeps its flush gable in the wall's colour
  hipEnds(u0, u1, z0, z1, e, pitch, o, col, along, wallCol, h0, h1) {
    const Zr = along === 'z', M = (s, y, t) => (Zr ? [s, y, t] : [t, y, s]);
    const s0 = Zr ? u0 : z0, s1 = Zr ? u1 : z1, t0 = Zr ? z0 : u0, t1 = Zr ? z1 : u1, tn = Math.tan(pitch);
    const sc = (s0 + s1) / 2, r = e + (s1 - s0) / 2 * tn, eo = e - o * tn, hr = Math.min((s1 - s0) / 2, 0.45 * (t1 - t0));
    const ra = h0 ? t0 + hr : t0, rb = h1 ? t1 - hr : t1;
    for (const sg of [-1, 1]) {                             // the two long sides, each in its own plane
      const se = sg < 0 ? s0 - o : s1 + o, sw = sg < 0 ? s0 : s1, hint = M(sg, 1, 0);
      this.quad(M(se, eo, t0), M(sc, r, ra), M(sc, r, rb), M(se, eo, t1), col, hint);
      if (h0) this.tri(M(se, eo, t0), M(sw, e, t0), M(sc, r, ra), col, hint);
      if (h1) this.tri(M(se, eo, t1), M(sw, e, t1), M(sc, r, rb), col, hint);
    }
    if (h0) this.tri(M(s0, e, t0), M(s1, e, t0), M(sc, r, ra), col, M(0, 1, -1)); else this.tri(M(s0, e, t0), M(s1, e, t0), M(sc, r, t0), wallCol, M(0, 0, -1));
    if (h1) this.tri(M(s0, e, t1), M(s1, e, t1), M(sc, r, rb), col, M(0, 1, 1)); else this.tri(M(s0, e, t1), M(s1, e, t1), M(sc, r, t1), wallCol, M(0, 0, 1));
    return r;
  }
  // a four-sided hipped roof (Tavira's way)
  hip(u0, u1, z0, z1, e, pitch, o, col) {
    u0 -= o; u1 += o; z0 -= o; z1 += o; const t = Math.tan(pitch), wu = u1 - u0, wz = z1 - z0, eo = e - o * t;
    const r = eo + Math.min(wu, wz) / 2 * t, uc = (u0 + u1) / 2, zc = (z0 + z1) / 2;
    const ra = wz >= wu ? [uc, r, z0 + wu / 2] : [u0 + wz / 2, r, zc], rb = wz >= wu ? [uc, r, z1 - wu / 2] : [u1 - wz / 2, r, zc];
    const c00 = [u0, eo, z0], c10 = [u1, eo, z0], c11 = [u1, eo, z1], c01 = [u0, eo, z1];
    if (wz >= wu) {
      this.quad(c00, ra, rb, c01, col, [-1, 1, 0]); this.quad(c10, ra, rb, c11, col, [1, 1, 0]);
      this.tri(c00, c10, ra, col, [0, 1, -1]); this.tri(c01, c11, rb, col, [0, 1, 1]);
    } else {
      this.quad(c00, ra, rb, c10, col, [0, 1, -1]); this.quad(c01, ra, rb, c11, col, [0, 1, 1]);
      this.tri(c00, c01, ra, col, [-1, 1, 0]); this.tri(c10, c11, rb, col, [1, 1, 0]);
    }
    return r;
  }
  pyramid(u0, u1, z0, z1, e, h, col) {
    const ap = [(u0 + u1) / 2, e + h, (z0 + z1) / 2];
    this.tri([u0, e, z0], [u1, e, z0], ap, col, [0, 1, -1]); this.tri([u0, e, z1], [u1, e, z1], ap, col, [0, 1, 1]);
    this.tri([u0, e, z0], [u0, e, z1], ap, col, [-1, 1, 0]); this.tri([u1, e, z0], [u1, e, z1], ap, col, [1, 1, 0]);
  }
  // a crown lump: an octahedron round (cu, cn, cz) with radii (ru, rn, rz); ROUND BY ITS VERTEX NORMALS (the second mend's S9):
  // at each corner the normal of the ellipsoid through the six corners there (its axis), so the light rounds over the crown
  lump(cu, cn, cz, ru, rn, rz, col) {
    const X = [[cu + ru, cn, cz], [cu - ru, cn, cz]], Y = [[cu, cn + rn, cz], [cu, cn - rn, cz]], Z = [[cu, cn, cz + rz], [cu, cn, cz - rz]];
    for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) {
      const a = X[i], b = Y[j], c = Z[k]; this.triN(a, b, c, col, [[1 - 2 * i, 0, 0], [0, 1 - 2 * j, 0], [0, 0, 1 - 2 * k]]);
    }
  }
  // a three-sided trunk from n0 to n1
  trunk(cu, cz, n0, n1, r, col) {
    const P = [0, 1, 2].map((k) => [cu + r * Math.cos(k * 2.0944 + 0.5), cz + r * Math.sin(k * 2.0944 + 0.5)]);
    for (let k = 0; k < 3; k++) {
      const A = P[k], B = P[(k + 1) % 3], mu = (A[0] + B[0]) / 2 - cu, mz = (A[1] + B[1]) / 2 - cz;
      this.quad([A[0], n0, A[1]], [B[0], n0, B[1]], [B[0], n1, B[1]], [A[0], n1, A[1]], col, [mu, 0, mz]);
    }
  }
  // the written arrays as a BufferGeometry (attributes: position, normal, color, aAnchor, and aSway for trees)
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.p.out(), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(this.n.out(), 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.c.out(), 3));
    g.setAttribute('aAnchor', new THREE.BufferAttribute(this.a.out(), 1));
    if (this.s) g.setAttribute('aSway', new THREE.BufferAttribute(this.s.out(), 2));
    if (this.f) { g.setAttribute('aFac', new THREE.BufferAttribute(this.f.out(), 4)); g.setAttribute('aKind', new THREE.BufferAttribute(this.k.out(), 2)); }
    return g;
  }
}
const _wa = [0, 0, 0], _wb = [0, 0, 0], _wc = [0, 0, 0], _P = [null, null, null], _Q = [null, null, null], _F = { cls: 0, s: [0, 0, 0], h: [0, 0, 0], w: [0, 0, 0] };
// --- END PIECE 3

// ---------------------------------------------------------------- THE NEIGHBOURS' GAPS (the old plan that stood here is taken out)
// THE NEIGHBOURS' GAPS (M4; section 6): k1 rises to the tight arc (a 100 to 290) and falls after it, so its most over [x, y] is
// k1 there at the point of [x, y] nearest a 290; two rigid neighbours of top h (the lower one's) close by h k over the span
// between their anchors, so their skins are dealt at least this gap apart (b at its most, 1), from the law alone
export const kMax = (x, y) => k1(Math.min(Math.max(217, x), y));
export function bendGap(h, w1, w2, x, y) { const hk = Math.max(0, h) * kMax(x, y); return hk * (w1 + w2) / 2 / (1 - hk) + 0.2; }
// --- END PIECE 4

// ---------------------------------------------------------------- THE GENERATOR'S BODIES (section 7; facades by the house material)
const C = (h) => new THREE.Color(h);
export const PALETTES = {                                    // the four mixes of walls (section 13): every kind present, shares change
  // (and the shutters' three colours, of green, blue-grey and grey-green, every kind in every mix: section 13)
  albi:    { brick: 0.55, stucco: 0.2, lime: 0.25, shut: ['#56704f', '#5f7383', '#7b8872'] },
  girona:  { brick: 0.15, stucco: 0.6, lime: 0.25, shut: ['#4f6b48', '#5b6f80', '#5b6f80'] },
  evora:   { brick: 0.15, stucco: 0.2, lime: 0.65, shut: ['#7b8872', '#7b8872', '#56704f'] },
  ferrara: { brick: 0.4, stucco: 0.4, lime: 0.2, shut: ['#56704f', '#7b8872', '#5f7383'] },
};
const WALLS = {
  brick: ['#9c5a3c', '#a8623f', '#93533a', '#ad6b49', '#a05d44'].map(C),
  stucco: ['#c99a5b', '#b8683f', '#c78e7c', '#9a7552', '#d2b274', '#c4825a'].map(C),
  lime: ['#e2dac8', '#ded3bd', '#e6dfcf', '#d9cdb4'].map(C),
};
// WEATHERED ROOFS (the second mend's S9): eight canal-tile tones, brown, grey and terracotta, old and new; five pale ones for
// the ceiling band; each roof its own tone, and its own patches of older and newer tiles in the facade shader
const ROOFS = ['#a5603f', '#8d5a45', '#b2714f', '#77574a', '#8b7d71', '#96523b', '#a8856a', '#6b5247'].map(C);
const PALE_ROOFS = ['#c3906f', '#b6998a', '#cba184', '#a97f69', '#d0ad8f'].map(C);
// the bell towers (S9): a rose brick shaft, the belfry's piers, slab and cornice in pale stone, its open stage dark
const BRICK_TOWER = C('#b67c66'), BELFRY_STONE = C('#d8ccb3'), BELFRY = C('#6e4332'), CHIMNEY = C('#8a5a44');
const WALL_STONE = ['#a9724f', '#b88f6c', '#9d6a4c', '#c2a37f'].map(C), HEDGE = ['#5a7440', '#617a44', '#55703d'].map(C);   // box and laurel, never black in shade
export function wallColour(R, pal) { const x = R(), k = R(); const fam = x < pal.brick ? 'brick' : x < pal.brick + pal.stucco ? 'stucco' : 'lime'; const L = WALLS[fam]; return L[Math.floor(k * L.length)]; }
// a wall colour's facade class (1 brick, 2 stucco, 3 lime wash)
export const wallClass = (col) => (WALLS.brick.includes(col) ? 1 : WALLS.stucco.includes(col) ? 2 : 3);
// a garden wall's masonry and wash by the plot's own tone, in the dealt mix's shares (M3: the town's own walls, lit as its houses)
export function gardenWall(tone, pal) {
  const fam = tone < pal.lime ? 'lime' : tone < pal.lime + pal.brick ? 'brick' : 'stucco', L = WALLS[fam];
  return { col: L[Math.floor(((tone * 7.31) % 1) * L.length)], cls: fam === 'brick' ? 1 : fam === 'stucco' ? 2 : 3 };
}
export const roofColour = (R, pale) => { const L = pale ? PALE_ROOFS : ROOFS; return L[Math.floor(R() * L.length)]; };
// four walls (no top, no bottom)
export function walls4(W, u0, u1, n0, n1, z0, z1, col) {
  W.quad([u1, n0, z0], [u1, n1, z0], [u1, n1, z1], [u1, n0, z1], col, [1, 0, 0]);
  W.quad([u0, n0, z0], [u0, n1, z0], [u0, n1, z1], [u0, n0, z1], col, [-1, 0, 0]);
  W.quad([u0, n0, z1], [u1, n0, z1], [u1, n1, z1], [u0, n1, z1], col, [0, 0, 1]);
  W.quad([u0, n0, z0], [u1, n0, z0], [u1, n1, z0], [u0, n1, z0], col, [0, 0, -1]);
}
// a ROW HOUSE (or a hall, or a shed): footprint fa (along a) by fz (along z) about its anchor, eaves at e, ridge 'z' or 'u'; one
// chimney; its roof flush at its gables. lk: { seed (its own die), cls (else by its wall's colour), open (else its two long
// faces, front and back: the gables are party walls, blind), ends: [at the ridge's low end, at its high end] (a RUN'S END, the
// second mend's S9: that end hipped, with no eave over it, and openings on every face) }
export function rowHouse(W, fa, fz, e, pitch, along, wall, roof, chim, base = -1.3, lk = {}) {
  const ends = lk.ends && (lk.ends[0] || lk.ends[1]);
  W.look(lk.cls || wallClass(wall), lk.seed || 0, e, ends ? 'all' : lk.open || (along === 'z' ? 'u' : 'z'));
  walls4(W, -fa / 2, fa / 2, base, e, -fz / 2, fz / 2, wall);
  const r = ends ? W.hipEnds(-fa / 2, fa / 2, -fz / 2, fz / 2, e, pitch, 0.4, roof, along, wall, lk.ends[0], lk.ends[1])
    : W.gable(-fa / 2, fa / 2, -fz / 2, fz / 2, e, pitch, 0.4, roof, along, wall, 0);
  if (chim) { const cu = along === 'z' ? fa * 0.12 : (chim - 0.5) * fa * 0.6, cz = along === 'z' ? (chim - 0.5) * fz * 0.6 : fz * 0.12; W.look(1, 0, r + 0.9); W.box(cu - 0.4, cu + 0.4, r - 1.2, r + 0.9, cz - 0.4, cz + 0.4, CHIMNEY); }
  return r;
}
// a HIPPED HOUSE (Tavira's four-sided roof), lime-washed, windows on every face
export function hipHouse(W, fa, fz, e, pitch, wall, roof, base = -1.3, seed = 0) { W.look(wallClass(wall), seed, e, 'all'); walls4(W, -fa / 2, fa / 2, base, e, -fz / 2, fz / 2, wall); return W.hip(-fa / 2, fa / 2, -fz / 2, fz / 2, e, pitch, 0.4, roof); }
// a BELL TOWER: a plain square brick shaft, an open belfry of four corner piers under a slab and a low cap; no clock, nothing lettered
export function tower(W, s, H, base = -1.3) {
  const sh = H - 6.5, p = Math.max(1.1, s * 0.2), h = s / 2;
  W.look(6, 0, sh);
  walls4(W, -h, h, base, sh, -h, h, BRICK_TOWER);
  W.look(0);                                                // the belfry's pale stone, plain
  for (const [cu, cz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) walls4(W, cu > 0 ? h - p : -h, cu > 0 ? h : -h + p, sh, sh + 4.5, cz > 0 ? h - p : -h, cz > 0 ? h : -h + p, BELFRY_STONE);
  W.quad([-h + p, sh, -h + p], [h - p, sh, -h + p], [h - p, sh, h - p], [-h + p, sh, h - p], BELFRY, [0, 1, 0]);    // the belfry's dark floor
  W.box(-h - 0.3, h + 0.3, sh + 4.5, sh + 5.3, -h - 0.3, h + 0.3, BELFRY_STONE, true);
  W.look(6, 0, sh);
  W.pyramid(-h - 0.3, h + 0.3, -h - 0.3, h + 0.3, sh + 5.3, 1.2, ROOFS[3]);
}
// a straight piece of garden wall or hedge between (a, z) points p and q of the flat frame, about its anchor (aA, zA):
// thickness t, from its footing (1.2 m below the ground's line) to height h
export function segWall(W, aA, zA, p, q, h, t, col, foot = 1.2) {
  const du = q[0] - p[0], dz = q[1] - p[1], len = Math.hypot(du, dz) || 1, nu = -dz / len * t / 2, nz = du / len * t / 2;
  const P = [[p[0] - aA + nu, p[1] - zA + nz], [q[0] - aA + nu, q[1] - zA + nz], [q[0] - aA - nu, q[1] - zA - nz], [p[0] - aA - nu, p[1] - zA - nz]];
  const n0 = -foot, n1 = h, cu = (P[0][0] + P[2][0]) / 2, cz = (P[0][1] + P[2][1]) / 2;
  for (let k = 0; k < 4; k++) { const A = P[k], B = P[(k + 1) % 4]; W.quad([A[0], n0, A[1]], [B[0], n0, B[1]], [B[0], n1, B[1]], [A[0], n1, A[1]], col, [(A[0] + B[0]) / 2 - cu, 0, (A[1] + B[1]) / 2 - cz]); }
  W.quad([P[0][0], n1, P[0][1]], [P[1][0], n1, P[1][1]], [P[2][0], n1, P[2][1]], [P[3][0], n1, P[3][1]], col, [0, 1, 0]);
}
// TREES (section 7): a three-sided trunk and a crown of lumps (3 lumps, 30 triangles; the near trees 5 lumps, 46); autumn planes part yellow
export const TREE_KINDS = {
  // (the second mend's S9: the greens deeper and cooler, so they stay green in the low warm sun; the plane trees ONE LUMP IN
  // FOUR YELLOW, section 7's autumn kept, the poplars too)
  plane:   { H: [14, 22], crown: 0.3, base: 0.38, cols: ['#4a6a30', '#42612f', '#557538', '#b09a3e'] },
  lime:    { H: [9, 18], crown: 0.34, base: 0.34, cols: ['#3f6034', '#466a39', '#38562f'] },   // the rebuild's squares, courts and promenade
  orange:  { H: [3, 5], crown: 0.5, base: 0.3, cols: ['#3d5a2b', '#45622e', '#38532a'] },
  lemon:   { H: [3, 4.5], crown: 0.5, base: 0.3, cols: ['#43652f', '#4b6a30'] },
  fig:     { H: [8, 11], crown: 0.42, base: 0.3, cols: ['#456a33', '#4f7239'] },
  olive:   { H: [8, 10], crown: 0.42, base: 0.3, cols: ['#68785a', '#5f7056'] },
  walnut:  { H: [9, 12], crown: 0.45, base: 0.32, cols: ['#4c6c36', '#56743b', '#456231'] },
  pear:    { H: [6, 8], crown: 0.38, base: 0.32, cols: ['#537338', '#5b7a3c', '#4b6c38'] },
  quince:  { H: [4, 5.5], crown: 0.45, base: 0.3, cols: ['#557236', '#62783b'] },
  cypress: { H: [10, 16], crown: 0.11, base: 0.06, cols: ['#2f4126', '#33462a'], narrow: true },
  poplar:  { H: [12, 15], crown: 0.16, base: 0.12, cols: ['#617a38', '#557034', '#6a843d', '#a39a42'], narrow: true },
  nettle:  { H: [10, 14], crown: 0.36, base: 0.33, cols: ['#4b6f3a', '#557a3c'] },
  oleander:{ H: [2.2, 2.9], crown: 0.55, base: 0.15, cols: ['#3f5a30', '#4a6534'] },
  // the umbrella pine of the far town's groups (S11): a broad flat crown high on a bare trunk
  pine:    { H: [12, 18], crown: 0.34, base: 0.6, cols: ['#3d5430', '#465b31'], flat: true },
};
const TRUNK = C('#5a4636');
// tree(W, kind, H, R): the crown's lumps dealt from R (all dice drawn here, in a fixed order); lumps 3 or 5
export function tree(W, kind, H, R, lumps = 3) {
  const K = TREE_KINDS[kind], cr = H * K.crown, cb = H * K.base;
  const dice = []; for (let i = 0; i < lumps * 5; i++) dice.push(R());
  W.trunk(0, 0, -0.6, cb + (H - cb) * 0.35, Math.max(0.12, H * 0.022), TRUNK);
  for (let i = 0; i < lumps; i++) {
    const d = dice.slice(i * 5, i * 5 + 5), col = C(K.cols[Math.floor(d[4] * K.cols.length)]);
    if (K.narrow) { const f = i / Math.max(1, lumps - 1); W.lump((d[0] - 0.5) * cr * 0.3, cb + (H - cb) * (0.32 + 0.38 * f), (d[1] - 0.5) * cr * 0.3, cr * (1.1 - 0.4 * f), (H - cb) * (0.34 - 0.06 * f), cr * (1.1 - 0.4 * f), col); continue; }
    const ang = (i / lumps) * 6.283 + d[0] * 1.2, off = i === 0 ? 0 : cr * (0.35 + 0.25 * d[1]);
    const ch = cb + (H - cb) * (i === 0 ? 0.55 : 0.4 + 0.25 * d[2]), rr = cr * (i === 0 ? 1 : 0.7 + 0.2 * d[3]);
    W.lump(Math.cos(ang) * off, ch, Math.sin(ang) * off, rr, Math.min(rr * (K.flat ? 0.36 : 0.85), (H - cb) * 0.5), rr, col);
  }
}
// --- END PIECE 5a

const DEG = Math.PI / 180;
// --- END PIECE 5b

// --- END PIECE 6

// ---------------------------------------------------------------- THE 6 BANDS along z of the land and the town (band 1 from z -700 to +58, then five
// of 295 m to the tip, by the plan's own extents): a land mesh in each (makeLand), and the town builder's meshes by the same bands
export const BAND_Z = [PLAN.Z_NEAR, 58, 353, 648, 943, 1238, PLAN.Z_TIP];   // (five of 295 m and a little more from the entry's block to the tip)
export const bandOf = (z) => { let b = 0; while (b < BAND_Z.length - 2 && z >= BAND_Z[b + 1]) b++; return b; };
// --- END PIECE 7c

// ---------------------------------------------------------------- THE PLAIN BLOCKS (kept)
// THE LOW PLAIN BLOCKS (section 2; the second mend's S11: the far-town stand-in retired for them): the flat town beyond the
// banks' blocks, 400 to 1,800 m off the river's line, thinning into the haze. o.areas: [[[x0, x1, z0, z1], ...], ...] (world: each
// group of rectangles one mesh of houses and one of trees), o.dist(x) a place's distance off the river's line, o.inside(x, z)
// false where a cell would come within reach of the hills. On a grid of cells (140 m along z by 110 m across, streets 14 m), each cell kept by a
// die whose share falls from 0.55 at 400 m to 0.13 at 1,800 m and holding TWO TERRACE ROWS along its long sides, each row 2 to 4
// plain houses (6 to 10 m frontage, 10 to 12 m deep, 2 or 3 floors: a box under a gabled roof of its own weathered tone, the
// next 0.06 m on, its two ends hipped: the terrace roofs in mixed tones); BELL TOWERS at the courts of cells every 300 to 500 m
// (both ways); GROUPS of 3 or 4 poplars, cypresses and umbrella pines in the courts of about one cell in ten. Every cell's dice
// are drawn whole before its tests, from streams of their own; RECEIVING SHADOW ONLY: nothing of them casts. o.most, when given,
// is COUNTED AGAINST, NEVER A CAP: every cell its die keeps is built on every seed, and the result says by how many triangles
// the count passed it (over, 0 when it did not)
export async function makePlainBlocks(ctx, o) {
  const rng = (n) => ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed)), R = rng('closing-plain'), RC = rng('closing-plain-crowns');
  const group = new THREE.Group(); group.name = 'closing-plain'; const count = { houses: 0, towers: 0, trees: 0, cells: 0 }, tris = { houses: 0, trees: 0 };
  for (let ai = 0; ai < o.areas.length; ai++) {
    const W = new Writer(), T = new Writer(true), CX = 110, CZ = 140, used = () => tris.houses + tris.trees + W.tris + T.tris;
    for (const [x0, x1, z0, z1] of o.areas[ai]) {
    const tz = [], tx = []; for (let z = z0 + R.range(80, 300); z < z1; z += R.range(300, 500)) tz.push(z); for (let x = x0 + R.range(60, 250); x < x1; x += R.range(300, 500)) tx.push(x);
    for (let z = z0; z + CZ <= z1 + 1e-6; z += CZ) {
      for (let x = x0; x + CX <= x1 + 1e-6; x += CX) {
        const keep = R(), grp = R(), gn = R.int(3, 4), rows = [0, 1].map(() => ({ n: R.int(2, 4), s: R.range(0, 30), hs: [0, 1, 2, 3, 4, 5].map(() => [R.range(6, 10), R.range(10, 12), R.int(2, 3), R.range(20, 24), R(), R(), R(), R()]) })), td = [R(), R()];
        const trees = [0, 1, 2, 3, 4].map(() => [R(), R(), R(), R()]), cx = x + CX / 2, cz = z + CZ / 2, ax = x + 7, bx = x + CX - 7, az = z + 7, bz = z + CZ - 7;
        const share = 0.55 - 0.42 * Math.min(1, Math.max(0, (o.dist(cx) - 400) / 1400)), room = true;   // (o.most is a figure to report against, never a cap: no cell is left empty by it on any seed)
        const inside = o.inside(x, z) && o.inside(x + CX, z) && o.inside(x, z + CZ) && o.inside(x + CX, z + CZ);
        const hasTower = inside && tz.some((q) => q >= z && q < z + CZ) && tx.some((q) => q >= x && q < x + CX);
        if (hasTower && room) { const s = 6 + td[0] * 2, H = 24 + td[1] * 10; W.body(-1, 0, { x: cx, y: PLAN.Y0, z: cz, yaw: 0 }); tower(W, s, H, -0.7); count.towers++; }
        if (inside && keep < share && room) {
          count.cells++;
          rows.forEach((rw, side) => {
            let s = az + rw.s, i = 0; const run = [];
            for (; i < rw.n && i < 6; i++) { const h = rw.hs[i]; if (s + h[0] > bz) break; run.push({ s, h }); s += h[0] + 0.06; }
            run.forEach(({ s: sz, h }, j) => {
              const [f, d, fl, pitch, wcd, rcd, , wck] = h, xc = side ? bx - d / 2 : ax + d / 2, wd = [wcd, wck], wc = wallColour(() => wd.shift(), o.pal), rc = ROOFS[Math.floor(rcd * ROOFS.length)];
              W.body(-1, 0, { x: xc, y: PLAN.Y0, z: sz + f / 2, yaw: 0 });
              rowHouse(W, d, f, fl * 3.1, pitch * DEG, 'z', wc, rc, 0, -0.7, { seed: h[6], ends: [j === 0, j === run.length - 1] }); count.houses++;
            });
          });
        }
        if (inside && grp < 0.1 && !hasTower && room) for (let k = 0; k < gn; k++) {
          const [kd, px, pz, hd] = trees[k], kind = kd < 0.35 ? 'pine' : kd < 0.7 ? 'cypress' : 'poplar', K = TREE_KINDS[kind], H = K.H[0] + (K.H[1] - K.H[0]) * hd;
          T.body(-1, 0, { x: cx - 25 + 50 * px, y: PLAN.Y0, z: cz - 40 + 80 * pz, yaw: 0 }, { H, k: Math.min(1.6, H / 14), phase: RC() * 6.283 });
          tree(T, kind, H, RC, K.narrow ? 2 : 1); count.trees++;
        }
      }
      await ctx.yield();
    }
    }
    const mk = (Wr, mat, name) => { if (!Wr.tris) return 0; const g = Wr.geometry(); g.computeBoundingSphere(); g.boundingSphere.radius += 40; const m = new THREE.Mesh(g, mat); m.name = name; m.receiveShadow = true; group.add(m); return Wr.tris; };
    tris.houses += mk(W, o.house.colour, 'plain-houses-' + (ai + 1)); tris.trees += mk(T, o.tree.colour, 'plain-trees-' + (ai + 1));
  }
  const all = tris.houses + tris.trees;
  return { group, count, tris, most: o.most, over: o.most === undefined ? 0 : Math.max(0, all - o.most) };
}
// --- END PIECE 8

// --- END PIECE 9b

// ================================================================ THE REBUILT GROUND (builder A; redesign sections 2, 4, 5, 8)
// planTextures(map, ctx): the plan's two textures at ONE TEXEL A METRE, for the curl's plan (map.fills in a, z; PLAN.TEX_W by
// PLAN.TEX_H from PLAN.Z_NEAR) and for the flat town's (map.fills in f = 56 - x, z; W map.f1 by H from map.z0 to map.z1).
//   mean: rgb the ground's own colour (sRGB, mipmapped: far off a pixel takes the mean of what lies under it), ALPHA THE POOLS:
//         every lamp of the map baked as (1 + (d / 6)^2)^-1.5 less its value at 20 m (so a pool ends at nothing, never in a
//         ring), cut at 20 m, and every bulb of its strings as a twelfth of a lamp, summed, clamped to 1, times the ground's class (streets, squares, courts 1; yards, gardens 0.25);
//   cls:  two bytes a texel, read nearest: the class (GROUND_CLS; PLAN.OUT beyond the brink's cut) and, for a street's setts,
//         the texel's place across its street in half metres from the middle (+128), so the middle course lies true; on a
//         yard, garden or court the second byte is the ground the plan laid there (GROUND_SUB; 255 plain);
//   classData: the classes alone, row by row (z) of W texels, for whoever asks what ground lies at a place.
// The fills are painted in 16 slices, the pools 100 lamps at a time, the last pass in 8 slices: a build step each.
const POOL_R = 20, POOL_END = Math.pow(1 + (POOL_R / 6) * (POOL_R / 6), -1.5);
export async function planTextures(map, ctx) {
  const flat = map.f1 !== undefined;
  const W = flat ? map.f1 : PLAN.TEX_W, zA = flat ? map.z0 : PLAN.Z_NEAR, H = flat ? map.z1 - map.z0 : PLAN.TEX_H;
  const mean = new Uint8Array(W * H * 4), cls2 = new Uint8Array(W * H * 2), cls = new Uint8Array(W * H), pool = new Float32Array(W * H);
  const SL = 64, rows = Math.ceil(H / SL), pause = () => (ctx && ctx.yield ? ctx.yield() : null);   // SL: the fills are painted in 64 slices of z, a hand-back after each (no step of them holds the page; a texel's last fill is the same whatever the slicing)
  await pause();                                              // (a step of its own: whatever the caller did before, the plan's deal among it, ends here)
  if (map.places) { map.places(); await pause(); }            // the plan lays its yards, courts and gardens here (once), a step of its own
  for (let sl = 0; sl < SL; sl++) {
    const j0 = sl * rows, j1 = Math.min(H, j0 + rows);
    for (const f of map.fills) {
      const u0 = flat ? f.f0 : f.a0, u1 = flat ? f.f1 : f.a1, mid = (u0 + u1) / 2, street = !f.plain && (f.cls === GROUND_CLS.LONG || f.cls === GROUND_CLS.CROSS);
      const i0 = Math.max(0, Math.round(u0)), i1 = Math.min(W, Math.round(u1)), fj0 = Math.max(j0, Math.round(f.z0 - zA)), fj1 = Math.min(j1, Math.round(f.z1 - zA));
      if (fj1 <= fj0 || i1 <= i0) continue;
      const zMid = (f.z0 + f.z1) / 2 - zA, crossS = f.cls === GROUND_CLS.CROSS, c = f.cls, r = f.rgb[0], g = f.rgb[1], b = f.rgb[2];
      const half = (off) => Math.max(0, Math.min(255, Math.round(2 * off) + 128));       // across the street from its middle, in half metres
      let offI = null; if (street && !crossS) { offI = new Uint8Array(i1 - i0); for (let i = i0; i < i1; i++) offI[i - i0] = half(i + 0.5 - mid); }
      for (let j = fj0; j < fj1; j++) {
        const offJ = street && crossS ? half(j + 0.5 - zMid) : f.sub === undefined ? 255 : f.sub;   // (a place's own ground: GROUND_SUB)
        for (let i = i0, t = j * W + i0, q = t * 4; i < i1; i++, t++, q += 4) { cls[t] = c; mean[q] = r; mean[q + 1] = g; mean[q + 2] = b; cls2[2 * t + 1] = offI ? offI[i - i0] : offJ; }
      }
    }
    if (!flat) for (let j = j0; j < j1; j++) {                // OUTSIDE: every texel past the brink's cut, in its last ground's colour
      const m = Math.max(0, Math.min(W, (map.brink.edgeA || map.brink.cutA)(zA + j + 0.5))), e = (j * W + Math.max(0, m - 1)) * 4;
      for (let i = m; i < W; i++) { const t = j * W + i, q = t * 4; cls[t] = PLAN.OUT; mean[q] = mean[e]; mean[q + 1] = mean[e + 1]; mean[q + 2] = mean[e + 2]; }
    }
    await pause();
  }
  // the pools: 25 lamps a step
  const lamps = map.lamps.map((l) => [flat ? 56 - l.x : l.a, l.z - zA, 1]);
  for (const st of (!flat && map.strings) || []) {            // the strings' bulbs, one every 1.5 m, each a twelfth of a lamp
    const len = Math.hypot(st.a1 - st.a0, st.z1 - st.z0), nb = Math.max(1, Math.floor(len / 1.5));
    for (let j = 1; j < nb; j++) { const a = st.a0 + (st.a1 - st.a0) * j / nb; if (a >= 0) lamps.push([a, st.z0 + (st.z1 - st.z0) * j / nb - zA, 1 / 12]); }
  }
  const n = lamps.length;
  for (let k = 0; k < n; k++) {
    const u = lamps[k][0], v = lamps[k][1], wt = lamps[k][2];
    const i0 = Math.max(0, Math.floor(u - POOL_R)), i1 = Math.min(W - 1, Math.ceil(u + POOL_R)), j0 = Math.max(0, Math.floor(v - POOL_R)), j1 = Math.min(H - 1, Math.ceil(v + POOL_R));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const du = i + 0.5 - u, dv = j + 0.5 - v, d2 = du * du + dv * dv; if (d2 >= POOL_R * POOL_R) continue;
      const q = 1 + d2 / 36; pool[j * W + i] += wt * (1 / (q * Math.sqrt(q)) - POOL_END);
    }
    if (k % 25 === 24) await pause();
  }
  const soft = GROUND_CLS.YARD, soft2 = GROUND_CLS.GARDEN;
  for (let sl = 0; sl < 24; sl++) {                           // the alpha and the class bytes, in 24 slices
    for (let t = Math.floor(W * H * sl / 24), e = Math.floor(W * H * (sl + 1) / 24); t < e; t++) {
      const c = cls[t], k = c === soft || c === soft2 ? 0.25 : c === PLAN.OUT ? 0 : 1;
      mean[4 * t + 3] = Math.round(255 * Math.min(1, pool[t]) * k); cls2[2 * t] = c;
    }
    await pause();
  }
  const tMean = new THREE.DataTexture(mean, W, H, THREE.RGBAFormat, THREE.UnsignedByteType);
  tMean.colorSpace = THREE.SRGBColorSpace; tMean.generateMipmaps = true; tMean.minFilter = THREE.LinearMipmapLinearFilter; tMean.magFilter = THREE.LinearFilter;
  tMean.anisotropy = Math.min(8, ctx && ctx.renderer && ctx.renderer.capabilities ? ctx.renderer.capabilities.getMaxAnisotropy() : 1);
  tMean.wrapS = tMean.wrapT = THREE.ClampToEdgeWrapping; tMean.needsUpdate = true;
  const tClass = new THREE.DataTexture(cls2, W, H, THREE.RGFormat, THREE.UnsignedByteType);
  tClass.minFilter = tClass.magFilter = THREE.NearestFilter; tClass.generateMipmaps = false; tClass.unpackAlignment = 1; tClass.needsUpdate = true;
  return { mean: tMean, cls: tClass, classData: cls, box: { z0: zA, w: W, h: H, flat } };
}

// sweepSphere(list): ONE sphere round the bent places of a list, for the engine's culling (a mesh's flat attributes would give a
// wrong sphere). The list is triples a, z, radius: a flat array of numbers, or entries [a, z, radius] or { a, z, radius }; an
// entry { x, z, radius } with no a (or a under 0) is a flat place at WORLD x, at the paving's height. One b (the curl does not
// move); plus 2 m.
const _K1 = bendKnots(B0), _s4 = new Float64Array(4);
export function sweepSphere(list) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  const one = (a, z, rad, flatX) => {
    const r = (rad || 0) + 2; let x, y;
    if (flatX !== undefined) { x = flatX; y = PLAN.Y0; } else { bendFrame(_K1, a, _s4); x = _s4[0]; y = _s4[1]; }
    x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r); z0 = Math.min(z0, z - r); z1 = Math.max(z1, z + r);
  };
  if (list.length && typeof list[0] === 'number') for (let i = 0; i + 2 < list.length; i += 3) one(list[i], list[i + 1], list[i + 2]);
  else for (const e of list) { if (Array.isArray(e)) one(e[0], e[1], e[2]); else if ((e.a === undefined || e.a < 0) && e.x !== undefined) one(0, e.z, e.radius, e.x); else one(e.a, e.z, e.radius); }
  if (x0 > x1) return new THREE.Sphere(new THREE.Vector3(PLAN.HX, PLAN.Y0, 0), 1);
  return new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2);
}

// ---------------------------------------------------------------- THE LAND'S PROGRAM (the night hook's strings for kind 'land')
// PAVING, NEVER SMEARED: no stone texture is built. The ground is drawn in its own true metres (a, z) on the curl and (f, z)
// under the flat town: bent, never stretched. The class texture picks the kind at the fragment's own metre; every line is
// box-filtered to its own mean by fwidth (a pixel's footprint), and once a metre is under the footprint the mean texture's
// colour stands alone. SETTS (streets): courses 0.24 m along the street of setts 0.16 m wide, a pale band 0.5 m wide across
// the street every 6.4 m, a middle course of darker setts 0.9 m wide (matt: a course of stone, no channel). SLABS (squares, the
// promenade's first 6 m), laid as the promenade's own so the paving runs on over the hinge: rows 0.6 m of z, joints every
// 1.2 m of a, a band 0.3 m wide every 9.6 m both ways, each slab its own tone. YARDS, GARDENS AND COURTS are the places the
// plan laid (the class texture's second byte, a metre a texel; their colours the mean texture's): a court's small setts with
// its drain and worn path, flags 0.9 by 0.6 m, earth, grass, gravel and hedge each grained at its own scale.
// THE SHEEN (a reflection: it reads the sight line by its nature, as the promenade's does; small mend 10): on paved ground
// within 60 m of the hinge line (a on the curl, f under the flat town), fading from 30 m: F x mix(uBack, uBand, w), F and w
// the promenade's own, so no seam parts the promenade from the land; a joint takes a third of it. WET AFTER RAIN: each lamp
// of the plan lays a streak toward the eye (the pools' texture read along the mirrored sight line: LAND_EMIT), broken by
// the joints; NO WATER STANDS ON OPEN PAVING: it lies in a kerb's gutter alone (the plan's GUTTER metre), where it darkens the stone
// and mirrors the afterglow more.
// THE POOLS: the land adds its own colour x uPool.rgb x uPool.a x the mean texture's alpha (the lamps of its plan).
// THE BACK of the land (never the town's side) is uBack, unlit. THE CUT: the class texture's OUTSIDE, read nearest, a discard.
const LAND_PARS = /* glsl */`
uniform sampler2D uPlanMean; uniform sampler2D uPlanClass; uniform vec4 uPlanBox; uniform vec4 uPool; uniform vec3 uBack;
uniform vec3 uBand; uniform vec2 uGlowDir; uniform vec3 uLampC; uniform float uTrim;
varying vec2 vPlan;
float landPool; float landSheen; float landPud; vec2 landW; bool landCut;
${FAC_HELP}
${WET_GLSL}
`;
const LAND_COLOUR = /* glsl */`
  {
    vec2 pq = vec2(vPlan.x, vPlan.y - uPlanBox.x);              // metres in the plan's own texture
    ivec2 pt = ivec2(clamp(floor(pq), vec2(0.0), uPlanBox.yz - 1.0));
    vec2 pk = texelFetch(uPlanClass, pt, 0).rg * 255.0;         // the class, and the place across a street
    landCut = pk.x > 250.0;                                     // past the cut: the discard itself is the program's LAST line (patch)
    vec4 pm = texture(uPlanMean, pq / uPlanBox.yz);
    landPool = pm.a;
    vec2 pw = fwidth(vPlan); landW = pw; landPud = 0.0;
    float pfar = smoothstep(0.5, 1.2, max(pw.x, pw.y));
    vec3 pcol = pm.rgb;
    landSheen = pk.x < 3.5 ? 1.0 : 0.0;                         // paved ground alone takes the sheen
    if (pfar < 1.0) {
      vec3 pat = pm.rgb;
      if (pk.x < 2.5) {                                         // setts: s along the street, t across it
        bool lg = pk.x < 1.5;
        float s = lg ? vPlan.y : vPlan.x, ws = lg ? pw.y : pw.x, t = lg ? vPlan.x : vPlan.y, wt = lg ? pw.x : pw.y;
        pat = fcCourses(pat, pat * 0.55, t, s, wt, ws, 0.24, 0.16, 0.14, 0.14);
        float band = fcLines(s / 6.4, ws / 6.4, 0.078);
        float d = (pk.y - 128.0) * 0.5 + fract(t) - 0.5;        // metres from the street's middle
        float mid = pk.y > 254.0 || pk.y < 1.0 ? 0.0 : fcBox(d, -0.45, 0.45, wt);
        pat *= mix(1.0, 1.22, band) * mix(1.0, 0.74, mid) / 1.017;
      } else if (pk.x < 3.5) {                                  // slabs, laid as the promenade's: rows 0.6 m of z, joints every 1.2 m of a
        float row = floor(vPlan.y / 0.6), bed = fcLines(vPlan.y / 0.6 + 0.0167, pw.y / 0.6, 0.0333);
        float per = mix(fcLines(vPlan.x / 1.2 + 0.5 * mod(row, 2.0) + 0.0083, pw.x / 1.2, 0.0167), 0.0167, smoothstep(0.35, 0.8, pw.y / 0.6));
        float joint = bed + per - bed * per;
        // (band courses ACROSS the way only, every 9.6 m of z: none runs along a square or the promenade, so no line stands down a square's middle)
        float grid = fcLines((vPlan.y + 0.15) / 9.6, pw.y / 9.6, 0.03125);
        vec2 sl = vec2(row, floor(vPlan.x / 1.2 + 0.5 * mod(row, 2.0)));
        float tone = 1.0 + 0.16 * (fcHash(sl) - 0.5) * (1.0 - smoothstep(0.3, 1.2, max(pw.x, pw.y)));
        // (and its panel's tone, the stone between four band courses: one delivery; the promenade's own figures and hash)
        tone *= 1.0 + 0.09 * (wetHash(floor(vPlan / 9.6) + 3.0) - 0.5) * (1.0 - smoothstep(4.8, 19.2, max(pw.x, pw.y)));
        pat *= tone * mix(1.0, 0.9, grid) * mix(1.0, 0.5, joint) / 0.969;
        landSheen = mix(mix(1.0, 0.35, max(joint, grid)), 1.0, pfar);   // stone always shows: a joint takes a third of the sheen
      } else if (pk.y < 4.5) {                                  // A COURT'S SETTS (smaller than a street's: 0.14 by 0.2 m), its drain, its worn path
        pat = fcCourses(pat, pat * (pk.y > 3.5 ? 0.8 : 0.6), vPlan.x, vPlan.y, pw.x, pw.y, 0.14, 0.2, 0.14, 0.1);
        if (pk.y > 1.5 && pk.y < 3.5) {                         // the drain: a dark channel 0.24 m wide down the middle of its metre
          bool da = pk.y < 2.5; pat *= mix(1.0, 0.5, fcBox(fract(da ? vPlan.y : vPlan.x) - 0.5, -0.12, 0.12, da ? pw.y : pw.x));
        }
      } else if (pk.y < 5.5) {                                  // FLAGS 0.9 by 0.6 m, broken bond, each its own tone
        float fr = floor(vPlan.y / 0.6); vec2 fq = vec2(vPlan.x / 0.9 + 0.5 * mod(fr, 2.0), vPlan.y / 0.6);
        float fj = max(fcLines(fq.x + 0.015, pw.x / 0.9, 0.03), fcLines(fq.y + 0.02, pw.y / 0.6, 0.04));
        pat *= (1.0 + 0.24 * (fcHash(floor(fq) + 7.0) - 0.5) * (1.0 - smoothstep(0.3, 0.9, max(pw.x, pw.y)))) * mix(1.0, 0.55, fj) / 0.969;
      } else if (pk.y < 250.0) {                                // EARTH (clods 0.45 m), GRASS (tufts 1.3 m), GRAVEL (0.25 m), A HEDGE (0.7 m): grained
        float cell = pk.y < 6.5 ? 0.45 : pk.y < 7.5 ? 1.3 : pk.y < 8.5 ? 0.25 : 0.7, amp = pk.y < 6.5 ? 0.36 : pk.y < 7.5 ? 0.26 : pk.y < 8.5 ? 0.16 : 0.5;
        float gr = wetNoise(vPlan / cell + pk.y * 13.0) - 0.5 + 0.5 * (wetNoise(vPlan / (0.31 * cell) + 5.0) - 0.5);
        pat *= 1.0 + amp * gr * (1.0 - smoothstep(0.4, 1.2, max(pw.x, pw.y) / cell));   // (to its mean once a grain is under the footprint)
      }
      pcol = mix(pat, pm.rgb, pfar);
    }
    landSheen *= 1.0 - smoothstep(30.0, 60.0, vPlan.x);         // the sheen fades out up the ground: a law of the place
    if (landSheen > 0.0) {                                      // WATER LIES IN A KERB'S GUTTER ALONE (the plan's GUTTER metre, 0.7 m of it): never on open paving
      landPud = pk.x > 2.5 && pk.y > 9.5 && pk.y < 10.5 ? wetGutter(vec2(fract(vPlan.x), vPlan.y), pw.x) * (1.0 - smoothstep(2.0, 6.0, max(pw.x, pw.y))) : 0.0;
      pcol *= mix(1.0, 0.6, landPud); landSheen = mix(landSheen, 1.0 - smoothstep(30.0, 60.0, vPlan.x), landPud);
    }
    diffuseColor.rgb = gl_FrontFacing ? pcol : vec3(0.0);
  }
`;
const LAND_EMIT = /* glsl */`
  // (the pools take the promenade's own trim on the hinge line and ease to their own over the sheen's 60 m: one light over the hinge)
  totalEmissiveRadiance += gl_FrontFacing ? diffuseColor.rgb * uPool.rgb * (uPool.a * landPool * mix(uTrim, 1.0, smoothstep(0.0, 60.0, vPlan.x))) : uBack;
  if (gl_FrontFacing && landSheen > 0.0) {                      // THE SHEEN, a reflection: the promenade's own law of F and of the afterglow
    vec3 lsV = normalize(vViewPosition);
    float lsf = 1.0 - max(dot(normal, lsV), 0.0), lsf2 = lsf * lsf, lsf5 = lsf2 * lsf2 * lsf;
    float lsF = min(0.35, 0.05 + 0.95 * lsf5); lsF = mix(lsF, max(lsF, 0.16), landPud);   // (shallow water over stone: a sixth at the least, as the promenade's)
    vec3 lsR = inverseTransformDirection(reflect(-lsV, normal), viewMatrix);
    float lsw = (1.0 - smoothstep(0.10, 0.20, lsR.y)) * max(0.0, dot(lsR.xz, uGlowDir));
    // (a gutter's level water mirrors the afterglow from steeper sight lines too, to 35 deg: the promenade's own)
    lsw = mix(lsw, (1.0 - smoothstep(0.25, 0.6, lsR.y)) * max(0.0, dot(normalize(lsR.xz + vec2(0.00001)), uGlowDir)), landPud);
    // THE LAMPS' STREAKS: the sight line mirrored in the ground runs on along the ground, away from the eye, and stands one
    // lamp's height (5 m) up after 5 / tan(its angle to the ground) metres; wet stone's grain draws a lamp's image out along
    // that line, so the pools' own texture (every lamp of the plan: its alpha is 1 at a lamp's foot) is read at 0.5 to 1.9
    // of that run; each reading cubed (a lamp's foot, 3 m about it) x the promenade's own falloff 6 / (1 + d^2 / 90)
    vec3 lsVw = inverseTransformDirection(lsV, viewMatrix), lsNw = inverseTransformDirection(normal, viewMatrix);
    vec3 lsTa = uPlanBox.w * cross(lsNw, vec3(0.0, 0.0, 1.0));  // the plan's first axis on the bent ground (a; f under the flat town)
    vec2 lsT = vec2(dot(lsVw, lsTa), lsVw.z);
    float lsl = max(length(lsT), 0.001), lsRun = 5.0 * lsl / max(dot(lsNw, lsVw), 0.03), lsS = 0.0;
    vec2 lsD = -lsT / lsl, lsP = vec2(vPlan.x, vPlan.y - uPlanBox.x);
    float lsLod = log2(max(1.0, 0.75 * max(landW.x, landW.y))); // (a footprint over 4 m blurs the lamps' feet away: no sparkle far off)
    for (int i = 0; i < 5; i++) {
      float lsk = 0.5 + 0.35 * float(i), lsd = lsRun * lsk / lsl;
      float lsa = textureLod(uPlanMean, (lsP + lsD * (lsRun * lsk)) / uPlanBox.yz, lsLod).a;
      lsS += lsa * lsa * lsa * 6.0 / (1.0 + lsd * lsd / 90.0);
    }
    // (x 0.9: two of the five readings meet a lamp's foot, so a streak's middle stands as bright as the promenade's lobe)
    totalEmissiveRadiance += lsF * (mix(uBack, uBand, lsw) + 0.9 * lsS * uLampC) * landSheen;
  }
`;

// makeLand(ctx, { bend, plan, tex, flatTex, light }) -> { group, meshes, tris, trisBy, dispose }: the curl's land in the 6 kept
// bands along z and ONE flat mesh, the flat town's ground (x -170 to 56, z from plan.flat.z0 to plan.flat.z1, y 7, anchors -1), all in the one land
// program. tex and flatTex are planTextures' results for plan and plan.flat (dispose() frees them too); light.landUniforms gives
// { uPool: vec4 (rgb and gain), uBack: vec3 }. THE GEOMETRY (the kept way): vertices at a = min(the column's a, L(z)), so the
// outline is L(z) and the stepped brink is the class texture's discard. Columns every half knot (4.66 m) through the tight arc
// (to a 280: a chord there lies 4 cm off the true curve), every knot on the ceiling; rows at the bands' ends, every 25 m on the
// bare near taper and every 5.5 m on the far taper, so a row stands on each step's end and the outline never falls inside a cut.
export async function makeLand(ctx, o) {
  const LU = (o.light && o.light.landUniforms) || {};
  const amber = new THREE.Color('#ffb057');
  const uPool = LU.uPool || { value: new THREE.Vector4(amber.r, amber.g, amber.b, 1.6) };
  const uBack = LU.uBack || { value: new THREE.Color('#323e76') };   // (the haze's own colour x 0.8 when no light is given)
  const lit = (o.light && o.light.lit) || {};                // the shared uniforms: the afterglow's band and the way to it on the ground
  const uBand = lit.uBand || { value: new THREE.Color('#ff9a55') }, uGlowDir = lit.uGlowDir || { value: new THREE.Vector2(-0.4226, 0.9063) };   // (25 deg off +z toward the open side)
  // the streaks' colour is the promenade's lamps' (#ffd9a0, section 5; light.lit.uLampC if the light gives one); o.trim is
  // the promenade's own trim of its pools (the world file's uField.z; 0.7 is its typed figure, taken when the world gives none)
  const uLampC = lit.uLampC || { value: new THREE.Color('#ffd9a0') }, uTrim = { value: o.trim === undefined ? 0.7 : o.trim };
  const mats = (t) => bendMaterials(o.bend, 'land', { plan: {}, night: { pars: LAND_PARS, colour: LAND_COLOUR, emit: LAND_EMIT, key: 'land',
    uniforms: { uPlanMean: { value: t.mean }, uPlanClass: { value: t.cls }, uPlanBox: { value: new THREE.Vector4(t.box.z0, t.box.w, t.box.h, t.box.flat ? -1 : 1) }, uPool, uBack, uBand, uGlowDir, uLampC, uTrim } } });
  const M = mats(o.tex), MF = mats(o.flatTex);
  const cols = []; for (let j = 0; j <= 60; j++) cols.push(j * PLAN.H / 2); for (let j = 31; j <= PLAN.N; j++) cols.push(j * PLAN.H);
  const rowsZ = []; for (let k = 0; k <= 12; k++) rowsZ.push(PLAN.Z_NEAR + 25 * k);
  for (let b = 1; b <= 5; b++) rowsZ.push(BAND_Z[b]);
  for (let k = 0; k <= 13; k++) rowsZ.push(PLAN.Z_FULL1 + 5.5 * k); rowsZ.push(PLAN.Z_TIP);
  const group = new THREE.Group(); group.name = 'closing-land';
  const meshes = [], trisBy = { land: 0, flat: 0 }, nc = cols.length;
  for (let b = 0; b < 6; b++) {
    const zs = rowsZ.filter((z) => z >= BAND_Z[b] - 1e-6 && z <= BAND_Z[b + 1] + 1e-6), nv = zs.length * nc;
    // THE RIM'S PARAPET (the plan's brink.rim.wall), in the band's own mesh and program: a wall 0.6 m thick and wall.h high on the
    // land's last metre along the whole full-width edge, every vertex anchored on that metre's middle (so it takes that metre's
    // stone, its lamps' pools and the cut's inside); three faces, wound to face outward
    const rim = o.plan.brink && o.plan.brink.rim, wz0 = rim ? Math.max(BAND_Z[b], rim.z0) : 0, wz1 = rim ? Math.min(BAND_Z[b + 1], rim.z1) : 0, nw = rim && wz1 > wz0 ? 12 : 0;
    const pos = new Float32Array((nv + nw) * 3), nrm = new Float32Array((nv + nw) * 3), anc = new Float32Array(nv + nw), idx = [], sw = [];
    zs.forEach((z, r) => { const L = Lz(z); for (let j = 0; j < nc; j++) { const v = r * nc + j; pos[v * 3 + 2] = z; nrm[v * 3 + 1] = 1; anc[v] = Math.min(cols[j], L); } });
    for (let r = 0; r + 1 < zs.length; r++) {
      const Lm = Math.max(Lz(zs[r]), Lz(zs[r + 1]));
      for (let j = 0; j + 1 < nc; j++) { if (cols[j] >= Lm) break; const v = r * nc + j, w = v + nc; idx.push(v, w, v + 1, v + 1, w, w + 1); }
    }
    if (nw) {
      const t = 0.3, h = rim.wall.h, aw = (rim.wall.a0 + rim.wall.a1) / 2;
      const faces = [[[-t, 0, wz0], [-t, 0, wz1], [-t, h, wz1], [-t, h, wz0], [-1, 0]], [[t, 0, wz0], [t, h, wz0], [t, h, wz1], [t, 0, wz1], [1, 0]], [[-t, h, wz0], [-t, h, wz1], [t, h, wz1], [t, h, wz0], [0, 1]]];
      faces.forEach((f, fi) => {
        const v0 = nv + 4 * fi;
        for (let k = 0; k < 4; k++) { const v = v0 + k; pos[v * 3] = f[k][0]; pos[v * 3 + 1] = f[k][1]; pos[v * 3 + 2] = f[k][2]; nrm[v * 3] = f[4][0]; nrm[v * 3 + 1] = f[4][1]; anc[v] = aw; }
        idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
      });
    }
    for (let j = 0; j < nc; j++) sw.push(cols[j], zs[0], 0, cols[j], zs[zs.length - 1], 0);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('aAnchor', new THREE.BufferAttribute(anc, 1)); g.setIndex(idx); g.boundingSphere = sweepSphere(sw);
    const m = new THREE.Mesh(g, M.colour); m.customDepthMaterial = M.depth; m.name = 'closing-land-' + (b + 1); group.add(m); meshes.push(m); trisBy.land += idx.length / 3;
    if (ctx && ctx.yield) await ctx.yield();
  }
  { // the flat town's ground: 2 by 12 quads of level paving at the hinge's height
    const F = o.plan.flat, x0 = 56 - F.f1, x1 = 56, z0 = F.z0, z1 = F.z1, nx = 2, nz = 12, pos = [], nrm = [], anc = [], idx = [];
    for (let r = 0; r <= nz; r++) for (let j = 0; j <= nx; j++) { pos.push(x0 + (x1 - x0) * j / nx, PLAN.Y0, z0 + (z1 - z0) * r / nz); nrm.push(0, 1, 0); anc.push(-1); }
    for (let r = 0; r < nz; r++) for (let j = 0; j < nx; j++) { const v = r * (nx + 1) + j, w = v + nx + 1; idx.push(v, w, v + 1, v + 1, w, w + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
    g.setAttribute('aAnchor', new THREE.Float32BufferAttribute(anc, 1)); g.setIndex(idx); g.computeBoundingSphere();
    const m = new THREE.Mesh(g, MF.colour); m.customDepthMaterial = MF.depth; m.name = 'closing-flat-ground'; group.add(m); meshes.push(m); trisBy.flat = idx.length / 3;
  }
  const dispose = () => { for (const m of meshes) m.geometry.dispose(); M.dispose(); MF.dispose(); for (const t of [o.tex, o.flatTex]) { t.mean.dispose(); t.cls.dispose(); } };
  return { group, meshes, tris: trisBy.land + trisBy.flat, trisBy, materials: [M, MF], dispose };
}
